export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  customizations?: string
}

export const CART_STORAGE_KEY = 'cart'
export const CART_UPDATED_EVENT = 'cartUpdated'

export function readStoredCart(raw: string | null): CartItem[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartItem)
  } catch {
    return []
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CartItem>
  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number'
  )
}

/**
 * Decides when the in-memory cart may be written back to localStorage.
 *
 * The provider mounts with an empty list, and its persist effect runs in the
 * same turn as that empty state — including a second time under Strict Mode.
 * Writing then erases dishes the menu already saved. An empty snapshot may
 * overwrite storage only after the provider has adopted a real cart (so an
 * explicit clear still works).
 */
export function createCartStorageController() {
  let hydrated = false
  let adopted = false

  return {
    shouldWrite(nextItems: CartItem[], storedRaw: string | null): boolean {
      const stored = readStoredCart(storedRaw)
      if (!hydrated) {
        hydrated = true
        return false
      }

      if (nextItems.length === 0 && stored.length > 0 && !adopted) {
        return false
      }

      if (nextItems.length > 0 || stored.length === 0) {
        adopted = true
      }

      return true
    },
  }
}
