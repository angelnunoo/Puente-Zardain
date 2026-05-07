'use client'

import { useState, useEffect, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'
import { ordersApi } from '../../lib/api'

interface Order {
  id: string
  status: string
  paymentStatus: string
  items: any[]
  total: number
  createdAt: string
  delivery: boolean
  address?: string
  paymentMethod: string
}

interface Estimate {
  queueLength: number
  estimatedMinutes: number
  averageDelivered: number
}

export default function Orders() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [chatSocket, setChatSocket] = useState<Socket | null>(null)

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  )

  useEffect(() => {
    if (!token) {
      setError('Necesitas iniciar sesión para ver tus pedidos.')
      setLoading(false)
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null

    const fetchOrders = async () => {
      try {
        const data = await ordersApi.getMyOrders(token)
        setOrders(data)
      } catch (err) {
        setError((err as Error).message || 'Error al cargar pedidos.')
      } finally {
        setLoading(false)
      }
    }

    const fetchEstimate = async () => {
      try {
        const data = await ordersApi.getEstimate()
        setEstimate(data)
      } catch (err) {
        console.warn('No se pudo obtener la estimación de pedido:', err)
      }
    }

    fetchOrders()
    fetchEstimate()

    intervalId = setInterval(() => {
      fetchOrders()
      fetchEstimate()
    }, 15000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [token])

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    if (!token || !selectedOrderId) {
      return
    }

    setChatLoading(true)
    setChatError(null)
    setChatMessages([])

    const socket = io(apiUrl, {
      transports: ['websocket'],
      auth: { token },
    })

    setChatSocket(socket)

    socket.on('connect_error', (err) => {
      setChatError(err.message || 'Error de conexión con el chat')
      setChatLoading(false)
    })

    socket.on('joined', () => {
      setChatLoading(false)
    })

    socket.on('newMessage', (message) => {
      setChatMessages((prev) => [...prev, message])
    })

    socket.on('orderStatusUpdated', (payload: { orderId: string; newStatus: string }) => {
      if (payload.orderId !== selectedOrderId) return
      setOrders((prev) =>
        prev.map((order) =>
          order.id === payload.orderId ? { ...order, status: payload.newStatus } : order,
        ),
      )
    })

    socket.emit('joinRoom', { orderId: selectedOrderId })

    const loadChat = async () => {
      try {
        const [history, replies] = await Promise.all([
          ordersApi.getChatHistory(token, selectedOrderId),
          ordersApi.getQuickReplies(token),
        ])
        setChatMessages(history)
        setQuickReplies(replies)
      } catch (err) {
        setChatError((err as Error).message || 'No se pudo cargar el chat.')
      } finally {
        setChatLoading(false)
      }
    }

    loadChat()

    return () => {
      socket.disconnect()
      setChatSocket(null)
    }
  }, [apiUrl, selectedOrderId, token])

  const sendChatMessage = (content: string) => {
    if (!chatSocket || !selectedOrderId || !content.trim()) {
      return
    }

    chatSocket.emit('sendMessage', {
      orderId: selectedOrderId,
      sender: 'Cliente',
      content: content.trim(),
    })
    setMessageInput('')
  }

  if (loading) {
    return <div className="p-4">Cargando pedidos...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mis Pedidos</h1>
      {estimate && (
        <div className="mb-6 rounded border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <p className="font-semibold">Tiempo estimado</p>
          <p className="mt-1">Cola actual: <strong>{estimate.queueLength}</strong> pedidos</p>
          <p className="text-sm mt-1">Tiempo estimado de entrega: <strong>{estimate.estimatedMinutes} min</strong></p>
          <p className="text-sm text-blue-700">Promedio de entregas: {estimate.averageDelivered} min</p>
        </div>
      )}
      {orders.length === 0 ? (
        <p className="text-gray-600">No tienes pedidos aún.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border border-gray-200 p-4 rounded bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">Pedido #{order.id.slice(0, 8)}</h2>
                <span className={`px-2 py-1 rounded text-sm ${
                  order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                  order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'READY' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Fecha: {new Date(order.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="mb-2">Total: {order.total}€</p>
              <p className="text-sm text-gray-600 mb-2">
                Método de pago: {order.paymentMethod === 'CARD' ? 'Tarjeta' : 'Efectivo'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Estado de pago: {order.paymentStatus === 'SUCCEEDED' ? 'Pagado' : order.paymentStatus === 'REFUNDED' ? 'Reintegrado' : 'Pendiente'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                {order.delivery ? `Entrega a: ${order.address}` : 'Recogida en local'}
              </p>
              <div className="mt-3">
                <h3 className="font-semibold mb-2">Artículos:</h3>
                <ul className="space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item.product?.name || 'Producto'} x{item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`rounded px-3 py-2 text-sm font-semibold transition ${
                    selectedOrderId === order.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {selectedOrderId === order.id ? 'Seleccionado' : 'Ver seguimiento'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-xl">Chat y seguimiento en vivo</h2>
            <p className="text-sm text-gray-600">
              Selecciona un pedido para abrir el chat con el restaurante y recibir actualizaciones en tiempo real.
            </p>
          </div>
          {selectedOrder && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800">
              Pedido #{selectedOrder.id.slice(0, 8)} • {selectedOrder.status}
            </span>
          )}
        </div>

        {!selectedOrder ? (
          <p className="text-sm text-gray-600">Selecciona un pedido de la lista para abrir el chat.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Estado del pedido: <strong>{selectedOrder.status}</strong>
              </p>
              <p className="text-sm text-gray-700">
                Estado del pago: <strong>{selectedOrder.paymentStatus === 'SUCCEEDED' ? 'Pagado' : selectedOrder.paymentStatus === 'REFUNDED' ? 'Reintegrado' : 'Pendiente'}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Mensajes</h3>
                {chatLoading && <span className="text-sm text-gray-500">Conectando al chat...</span>}
              </div>

              {chatError && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{chatError}</div>}

              <div className="max-h-72 overflow-y-auto rounded border border-gray-200 bg-white p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-gray-500">Aquí aparecerán los mensajes del chat.</p>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message, index) => (
                      <div key={message.id || index} className="rounded-lg border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {message.sender}
                        </div>
                        <p className="mt-1 text-sm text-gray-800">{message.content}</p>
                        <div className="mt-2 text-xs text-gray-400">
                          {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-800 transition hover:bg-blue-200"
                      onClick={() => sendChatMessage(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => sendChatMessage(messageInput)}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
