'use client'

import Link from 'next/link'
import DailyDashboardFixed from '../../components/admin/daily-dashboard-fixed'
import { useAuth } from '../../context/AuthContext'

export default function Admin() {
  const { token } = useAuth()

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel Admin</h1>
          <p className="text-sm text-gray-600">Dashboard en tiempo real del restaurante</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Pedidos</Link>
          <Link href="/admin/zardas" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Zardas</Link>
          <Link href="/admin/products" className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900">Productos</Link>
          <Link href="/admin/schedule" className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900">Horarios</Link>
        </div>
      </div>

      {/* Dashboard con datos reales */}
      {token ? (
        <DailyDashboardFixed />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Autenticación Requerida</h2>
          <p className="text-yellow-700">Debes iniciar sesión para ver el dashboard de administración.</p>
        </div>
      )}
    </div>
  )
}
