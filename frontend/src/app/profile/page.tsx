'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userApi, ordersApi } from '../../lib/api'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  zardas: number
  league: string
}

interface Order {
  id: string
  status: string
  paymentStatus: string
  total: number
  createdAt: string
}

export default function Profile() {
  const { token, user: authUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Necesitas iniciar sesión para ver tu perfil.')
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const userData = await userApi.profile(token)
        setProfile(userData)

        // Fetch recent orders
        const ordersData = await ordersApi.getMyOrders(token)
        setRecentOrders(ordersData.slice(0, 5)) // Last 5 orders
      } catch (err) {
        setError((err as Error).message || 'Error al cargar perfil.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token])

  const getLeagueIcon = (league: string) => {
    switch (league.toLowerCase()) {
      case 'bronze': return '🥉'
      case 'silver': return '🥈'
      case 'gold': return '🥇'
      case 'platinum': return '💎'
      case 'diamond': return '💍'
      case 'master': return '👑'
      default: return '🎖️'
    }
  }

  if (loading) {
    return <div className="p-4">Cargando perfil...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  if (!profile) {
    return <div className="p-4">No se pudo cargar el perfil.</div>
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="text-lg">{profile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-lg">{profile.email}</p>
            </div>
            {profile.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-lg">{profile.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Zardas & League */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Sistema Zardas</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Puntos Zardas</label>
              <p className="text-2xl font-bold text-yellow-600">{profile.zardas} 🎖️</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Liga Actual</label>
              <p className="text-xl font-semibold">
                {getLeagueIcon(profile.league)} {profile.league}
              </p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                ¡Gana más puntos con cada pedido para subir de liga y obtener beneficios exclusivos!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Pedidos Recientes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600">Aún no has realizado pedidos.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 border border-gray-100 rounded">
                <div>
                  <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{order.total}€</p>
                  <div className="space-y-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.paymentStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'REFUNDED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus === 'SUCCEEDED' ? 'Pagado' : order.paymentStatus === 'REFUNDED' ? 'Reintegrado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
