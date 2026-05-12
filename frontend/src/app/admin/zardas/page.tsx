'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { zardasApi } from '../../../lib/api'

export default function AdminZardasPage() {
  const { token, user } = useAuth()
  const [balance, setBalance] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      setError('Acceso denegado. Solo administradores pueden ver esta página.')
      setLoading(false)
      return
    }

    const fetchZardas = async () => {
      try {
        const currentBalance = await zardasApi.getBalance(token, user.id)
        const currentHistory = await zardasApi.getHistory(token, user.id)
        setBalance(currentBalance)
        setHistory(currentHistory)
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos de Zardas.')
      } finally {
        setLoading(false)
      }
    }

    fetchZardas()
  }, [token, user])

  if (loading) {
    return <div className="p-4">Cargando datos de Zardas...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zardas Admin</h1>
        <p className="text-sm text-gray-600">Visión rápida del saldo y transacciones de Zardas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-2">Saldo actual</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Disponible</span>
              <span className="font-semibold text-green-700">{balance.available} Zardas</span>
            </div>
            <div className="flex justify-between">
              <span>Total ganado</span>
              <span className="font-semibold">{balance.total} Zardas</span>
            </div>
            <div className="flex justify-between">
              <span>En espera</span>
              <span>{balance.pending} Zardas</span>
            </div>
            <div className="flex justify-between">
              <span>Caducadas</span>
              <span>{balance.expired} Zardas</span>
            </div>
            <div className="flex justify-between">
              <span>Rango</span>
              <span className="font-semibold">{balance.league}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-2">Reglas de Zardas</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Ganas 10% del total del pedido en Zardas cuando el pedido se marca como listo.</li>
            <li>• Puedes canjear Zardas en el checkout: 5 Zardas = 5€, 10 Zardas = 10€, 15 Zardas = 15€.</li>
            <li>• El pedido mínimo tras descuento debe ser de al menos 15 €.</li>
            <li>• Las administraciones pueden ajustar saldo mediante la API segura.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de transacciones</h2>
        {history.length === 0 ? (
          <p className="text-gray-600">No hay transacciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-gray-300 p-2">Fecha</th>
                  <th className="border border-gray-300 p-2">Tipo</th>
                  <th className="border border-gray-300 p-2">Cantidad</th>
                  <th className="border border-gray-300 p-2">Razón</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-300">
                    <td className="border border-gray-300 p-2">
                      {new Date(entry.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="border border-gray-300 p-2">{entry.type}</td>
                    <td className="border border-gray-300 p-2">{entry.amount}</td>
                    <td className="border border-gray-300 p-2">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
