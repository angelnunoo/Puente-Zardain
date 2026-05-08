'use client'

import { useEffect, useState } from 'react'
import { scheduleApi } from '../../lib/api'
import { PublicScheduleResponse } from '../../../../shared/interfaces'

type ScheduleWindow = {
  id: string
  dayOfWeek: number
  shift: number
  openTime: string
  closeTime: string
  active: boolean
  note?: string
}

type SpecialSchedule = {
  id: string
  date: string
  openTime?: string
  closeTime?: string
  isClosed: boolean
  note?: string
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<PublicScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const shiftNames = { 1: 'Comida', 2: 'Cena' }

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const data = await scheduleApi.getPublicSchedule()
      setSchedule(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el horario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  const formatNextOpenTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando horarios...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-800 font-semibold mb-2">Error al cargar horarios</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadSchedule}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con estado actual */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Horarios del Puente de Zardain</h1>
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Volver al inicio
            </a>
          </div>

          {/* Estado actual del restaurante */}
          <div className={`rounded-lg p-4 ${
            schedule?.isOpenNow 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                schedule?.isOpenNow ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className={`font-semibold ${
                  schedule?.isOpenNow ? 'text-green-800' : 'text-red-800'
                }`}>
                  {schedule?.isOpenNow ? '🟢 Abierto ahora' : '🔴 Cerrado ahora'}
                </p>
                {!schedule?.isOpenNow && schedule?.nextOpenTime && (
                  <p className="text-sm text-red-600 mt-1">
                    Próxima apertura: {formatNextOpenTime(schedule.nextOpenTime)}
                  </p>
                )}
                {schedule?.isOpenNow && schedule?.nextCloseTime && (
                  <p className="text-sm text-green-600 mt-1">
                    Cierra a las: {schedule.nextCloseTime.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calendario semanal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Horario semanal</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dayNames.map((dayName, index) => {
              const daySchedules = schedule?.regular?.filter(
                (s: ScheduleWindow) => s.dayOfWeek === index && s.active
              ) || []

              return (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900 mb-2">{dayName}</h3>
                  {daySchedules.length > 0 ? (
                    <div className="space-y-1">
                      {daySchedules.map((window: ScheduleWindow) => (
                        <div key={window.id} className="text-sm text-gray-600">
                          <p className="font-medium text-gray-700">
                            {shiftNames[window.shift as keyof typeof shiftNames]}
                          </p>
                          <p>{window.openTime} - {window.closeTime}</p>
                          {window.note && (
                            <p className="text-xs text-gray-500 italic">{window.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Cerrado</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Días especiales */}
        {schedule?.special && schedule.special.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Fechas especiales</h2>
            <div className="space-y-3">
              {schedule.special.map((special: SpecialSchedule) => (
                <div 
                  key={special.id} 
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(special.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {special.isClosed ? (
                        <p className="text-red-600 font-medium">Cerrado</p>
                      ) : (
                        <p className="text-green-600">
                          {special.openTime} - {special.closeTime}
                        </p>
                      )}
                      {special.note && (
                        <p className="text-sm text-gray-600 mt-1">{special.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Información importante</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Los pedidos se pueden realizar únicamente durante el horario de apertura</li>
            <li>• El tiempo estimado de preparación es de aproximadamente 45 minutos</li>
            <li>• Los horarios especiales (festivos, eventos) tienen prioridad sobre el horario regular</li>
            <li>• Para pedidos grandes o grupos, recomendamos llamar con antelación</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
