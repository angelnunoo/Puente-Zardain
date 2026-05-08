'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'order_update' | 'kitchen_update' | 'low_stock_alert'
  title: string
  message: string
  timestamp: Date
  data?: any
  persistent?: boolean
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  clearNotifications: () => void
  isConnected: boolean
  socket: Socket | null
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Conectar al servidor WebSocket cuando el usuario esté autenticado
    const token = localStorage.getItem('token')
    if (!token) return

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      console.log('Connected to notifications server')
      setIsConnected(true)
      setSocket(newSocket)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notifications server')
      setIsConnected(false)
      setSocket(null)
    })

    newSocket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification)
      
      // Añadir notificación al estado
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Mantener máximo 50
    })

    newSocket.on('order_updated', (data: any) => {
      console.log('Order updated:', data)
      
      const notification: Notification = {
        id: `order_${data.orderId}_${Date.now()}`,
        type: 'order_update',
        title: 'Pedido Actualizado',
        message: `Tu pedido #${data.orderId} está ${data.status}`,
        timestamp: new Date(),
        data,
      }
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)])
    })

    newSocket.on('kitchen_status_changed', (data: any) => {
      console.log('Kitchen status changed:', data)
      
      const notification: Notification = {
        id: `kitchen_${Date.now()}`,
        type: 'kitchen_update',
        title: 'Estado de Cocina',
        message: data.message || `La cocina está ${data.status}`,
        timestamp: new Date(),
        data,
      }
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)])
    })

    newSocket.on('low_stock_alert', (data: any) => {
      console.log('Low stock alert:', data)
      
      const notification: Notification = {
        id: `stock_${data.productId}_${Date.now()}`,
        type: 'low_stock_alert',
        title: '⚠️ Stock Bajo',
        message: data.message,
        timestamp: new Date(),
        data,
      }
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)])
    })

    // Unir a salas específicas del usuario
    newSocket.on('connect', () => {
      const userId = localStorage.getItem('userId')
      if (userId) {
        newSocket.emit('join_user_room', { userId })
      }
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)])
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const value: NotificationsContextType = {
    notifications,
    addNotification,
    clearNotifications,
    isConnected,
    socket,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}
