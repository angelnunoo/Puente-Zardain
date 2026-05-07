'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { kitchenApi } from '../../lib/api'

type KitchenMetrics = {
  kitchenStatus: string
  scheduleStatus: { open: boolean; reason: string; nextOpen: string | null }
  pending: number
  preparing: number
  ready: number
  deliveredToday: number
  averageDeliveredMinutes: number
  queueLength: number
}

export default function Admin() {
  const { token } = useAuth()
  const [metrics, setMetrics] = useState<KitchenMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = async () => {
    try {
      if (!token) return
      const data = await kitchenApi.getMetrics(token)
      setMetrics(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar métricas')
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [token])

  const updateStatus = async (status: string) => {
    try {
      if (!token) return
      await kitchenApi.setStatus(token, status)
      await loadMetrics()
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar estado de cocina')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel Admin</h1>
          <p className="text-sm text-gray-600">Visión rápida del estado de cocina, cola de pedidos y horario.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="rounded bg-blue-600 px-4 py-2 text-white">Pedidos</Link>
          <Link href="/admin/schedule" className="rounded bg-gray-800 px-4 py-2 text-white">Horarios</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Cocina</h2>
          {metrics ? (
            <>
              <p className="mb-2">Estado actual: <strong className={metrics.kitchenStatus === 'open' ? 'text-green-600' : metrics.kitchenStatus === 'closed' ? 'text-red-600' : 'text-orange-600'}>{metrics.kitchenStatus}</strong></p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateStatus('open')} className="rounded bg-green-600 px-3 py-2 text-white">Abrir cocina</button>
                <button onClick={() => updateStatus('closed')} className="rounded bg-red-600 px-3 py-2 text-white">Cerrar cocina</button>
                <button onClick={() => updateStatus('saturated')} className="rounded bg-yellow-600 px-3 py-2 text-white">Modo saturado</button>
              </div>
            </>
          ) : (
            <p>{error ?? 'Cargando estado de cocina...'}</p>
          )}
        </div>

        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Métricas de servicio</h2>
          {metrics ? (
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Pedidos en cola:</strong> {metrics.queueLength}</p>
              <p><strong>Pending:</strong> {metrics.pending}</p>
              <p><strong>Preparando:</strong> {metrics.preparing}</p>
              <p><strong>Listos:</strong> {metrics.ready}</p>
              <p><strong>Servidos hoy:</strong> {metrics.deliveredToday}</p>
              <p><strong>Tiempo medio de entrega:</strong> {metrics.averageDeliveredMinutes} min</p>
              <p><strong>Horario actual:</strong> {metrics.scheduleStatus.reason}</p>
              {metrics.scheduleStatus.nextOpen ? <p><strong>Próxima apertura:</strong> {metrics.scheduleStatus.nextOpen}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-gray-600">{error ?? 'Cargando métricas...'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
