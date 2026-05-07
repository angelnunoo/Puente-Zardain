'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { ordersApi } from '../../../lib/api'

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
  user: { name: string; email: string }
}

const statusOptions = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']
const paymentStatusOptions = ['PENDING', 'SUCCEEDED', 'REFUNDED']

export default function AdminOrders() {
  const { token, user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('')

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setError('Acceso denegado. Solo administradores pueden ver esta página.')
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      try {
        const data = await ordersApi.getAll(token)
        setOrders(data)
      } catch (err) {
        setError((err as Error).message || 'Error al cargar pedidos.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [token, user])

  const updateStatus = async (orderId: string, status: string) => {
    if (!token) return

    try {
      await ordersApi.updateStatus(token, orderId, status)
      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      ))
    } catch (err) {
      setError((err as Error).message || 'Error al actualizar estado.')
    }
  }

  const filteredOrders = orders
    .filter(order => !filterStatus || order.status === filterStatus)
    .filter(order => !filterPaymentStatus || order.paymentStatus === filterPaymentStatus)

  if (loading) {
    return <div className="p-4">Cargando pedidos...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Pedidos</h1>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold mb-2">Filtrar por estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Todos</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Filtrar por pago:</label>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Todos</option>
            {paymentStatusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Cliente</th>
              <th className="border border-gray-300 p-2">Total</th>
              <th className="border border-gray-300 p-2">Estado</th>
              <th className="border border-gray-300 p-2">Pago</th>
              <th className="border border-gray-300 p-2">Fecha</th>
              <th className="border border-gray-300 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t border-gray-300">
                <td className="border border-gray-300 p-2">{order.id.slice(0, 8)}</td>
                <td className="border border-gray-300 p-2">
                  <div>
                    <div className="font-semibold">{order.user?.name}</div>
                    <div className="text-sm text-gray-600">{order.user?.email}</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2">{order.total}€</td>
                <td className="border border-gray-300 p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'READY' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="border border-gray-300 p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.paymentStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'REFUNDED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus === 'SUCCEEDED' ? 'Pagado' : order.paymentStatus === 'REFUNDED' ? 'Reintegrado' : 'Pendiente'}
                  </span>
                </td>
                <td className="border border-gray-300 p-2">
                  {new Date(order.createdAt).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="border border-gray-300 p-2 space-x-1">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateStatus(order.id, 'CONFIRMED')}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Confirmar
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Preparar
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Listo
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateStatus(order.id, 'DELIVERED')}
                      className="bg-purple-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Entregado
                    </button>
                  )}
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <button
                      onClick={() => updateStatus(order.id, 'CANCELLED')}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <p className="mt-4 text-gray-600">No hay pedidos con el filtro seleccionado.</p>
      )}
    </div>
  )
}
