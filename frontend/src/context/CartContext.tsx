'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { cartApi } from '../lib/api'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  customizations?: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, customizations?: string) => void
  updateQuantity: (productId: string, quantity: number, customizations?: string) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const CART_STORAGE_KEY = 'cart'

function getStorageCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const stored = window.localStorage.getItem(CART_STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored) as CartItem[]
  } catch {
    return []
  }
}

function mergeCarts(localItems: CartItem[], remoteItems: CartItem[]) {
  const merged = new Map<string, CartItem>()

  const add = (item: CartItem) => {
    const key = `${item.productId}:${item.customizations || ''}`
    const existing = merged.get(key)
    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      })
    } else {
      merged.set(key, { ...item })
    }
  }

  localItems.forEach(add)
  remoteItems.forEach(add)

  return Array.from(merged.values())
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [remoteLoaded, setRemoteLoaded] = useState(false)
  const isMounted = useRef(false)

  useEffect(() => {
    setItems(getStorageCart())
    isMounted.current = true
  }, [])

  useEffect(() => {
    if (!isMounted.current) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    const fetchRemoteCart = async () => {
      if (!token) {
        setRemoteLoaded(true)
        return
      }

      try {
        const remoteCart = await cartApi.getCart(token)
        const remoteItems = remoteCart?.items?.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          customizations: item.customizations,
          name: item.product?.name ?? '',
          price: item.product?.price ?? 0,
        })) || []

        const mergedItems = mergeCarts(getStorageCart(), remoteItems)
        setItems(mergedItems)
        await cartApi.updateCart(token, { items: mergedItems })
      } catch (error) {
        console.error('Error sincronizando carrito:', error)
      } finally {
        setRemoteLoaded(true)
      }
    }

    if (!loading) {
      fetchRemoteCart()
    }
  }, [token, loading])

  useEffect(() => {
    if (!token || !remoteLoaded) return
    const syncCart = async () => {
      try {
        await cartApi.updateCart(token, { items })
      } catch (error) {
        console.error('Error enviando carrito al backend:', error)
      }
    }
    syncCart()
  }, [token, items, remoteLoaded])

  const value = useMemo(
    () => ({
      items,
      addItem(item: Omit<CartItem, 'quantity'>) {
        setItems((prev) => {
          const key = `${item.productId}:${item.customizations || ''}`
          const existing = prev.find((i) => `${i.productId}:${i.customizations || ''}` === key)
          if (existing) {
            return prev.map((i) =>
              `${i.productId}:${i.customizations || ''}` === key
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
          return [...prev, { ...item, quantity: 1 }]
        })
      },
      removeItem(productId: string, customizations?: string) {
        const key = `${productId}:${customizations || ''}`
        setItems((prev) => prev.filter((i) => `${i.productId}:${i.customizations || ''}` !== key))
      },
      updateQuantity(productId: string, quantity: number, customizations?: string) {
        const key = `${productId}:${customizations || ''}`
        if (quantity <= 0) {
          setItems((prev) => prev.filter((i) => `${i.productId}:${i.customizations || ''}` !== key))
        } else {
          setItems((prev) =>
            prev.map((i) =>
              `${i.productId}:${i.customizations || ''}` === key ? { ...i, quantity } : i
            )
          )
        }
      },
      clearCart() {
        setItems([])
      },
      get total() {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },
      get itemCount() {
        return items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    [items]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
