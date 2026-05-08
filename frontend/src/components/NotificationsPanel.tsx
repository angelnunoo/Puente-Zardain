'use client'

import { useContext } from 'react'
import { useNotifications } from '../context/NotificationsContext'

export default function NotificationsPanel() {
  const { notifications, isConnected, clearNotifications } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'ℹ️'
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'order_update':
        return '📋'
      case 'kitchen_update':
        return '👨‍🍳'
      case 'low_stock_alert':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
      case 'low_stock_alert':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span className="text-xs text-gray-600">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
          <button
            onClick={clearNotifications}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-80 overflow-y-auto p-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔕</div>
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice().reverse().map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {notification.title}
                    </div>
                    <p className="text-sm text-gray-700">
                      {notification.message}
                    </p>
                    {notification.data && (
                      <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                        <pre className="text-xs">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
                
                {/* Botón de cerrar para notificaciones no persistentes */}
                {!notification.persistent && (
                  <button
                    onClick={() => {
                      // Eliminar notificación individual
                      setNotifications(prev => prev.filter(n => n.id !== notification.id))
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
