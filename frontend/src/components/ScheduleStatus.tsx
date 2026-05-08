'use client'

import { useEffect, useState } from 'react'
import { scheduleApi } from '../lib/api'
import { PublicScheduleResponse } from '../../../../shared/interfaces'

interface ScheduleStatusProps {
  onOrderAttempt?: () => void
  showOrderButton?: boolean
}

export default function ScheduleStatus({ onOrderAttempt, showOrderButton = true }: ScheduleStatusProps) {
  const [schedule, setSchedule] = useState<PublicScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await scheduleApi.getPublicSchedule()
        setSchedule(data)
      } catch (error) {
        console.error('Error loading schedule:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSchedule()
  }, [])

  const formatNextOpenTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
          <p className="text-yellow-800">Verificando horario de atención...</p>
        </div>
      </div>
    )
  }

  if (!schedule?.isOpenNow) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">🔴</span>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Restaurante cerrado ahora
            </h3>
            
            {schedule?.nextOpenTime && (
              <p className="text-red-700 mb-4">
                <strong>Próxima apertura:</strong> {formatNextOpenTime(schedule.nextOpenTime)}
              </p>
            )}

            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Horario habitual:</h4>
              <div className="grid gap-2 text-sm">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, index) => {
                  const daySchedules = schedule?.regular?.filter(
                    (s) => s.dayOfWeek === index && s.active
                  ) || []
                  
                  return (
                    <div key={index} className="flex justify-between">
                      <span className="font-medium text-gray-700">{day}:</span>
                      <span className="text-gray-600">
                        {daySchedules.length > 0 
                          ? daySchedules.map(s => `${s.openTime}-${s.closeTime}`).join(', ')
                          : 'Cerrado'
                        }
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {schedule?.special && schedule.special.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-orange-900 mb-2">Próximas fechas especiales:</h4>
                <div className="space-y-2 text-sm">
                  {schedule.special
                    .filter(s => new Date(s.date) >= new Date())
                    .slice(0, 3)
                    .map((special) => (
                      <div key={special.id} className="flex justify-between text-orange-800">
                        <span>
                          {new Date(special.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="font-medium">
                          {special.isClosed ? 'Cerrado' : `${special.openTime}-${special.closeTime}`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-red-600">
                <p>⏰ Los pedidos solo se pueden realizar durante el horario de apertura</p>
                <p>📞 Para pedidos especiales: <a href="tel:+34912345678" className="underline">+34 912 345 678</a></p>
              </div>
              
              {showOrderButton && (
                <button
                  onClick={onOrderAttempt}
                  disabled={true}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
                >
                  No se pueden hacer pedidos
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
          <div>
            <p className="text-green-800 font-semibold">
              🟢 Abierto ahora - Pedidos disponibles
            </p>
            {schedule?.nextCloseTime && (
              <p className="text-green-600 text-sm">
                Cierra a las: {schedule.nextCloseTime.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
        
        {showOrderButton && onOrderAttempt && (
          <button
            onClick={onOrderAttempt}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Hacer pedido ahora
          </button>
        )}
      </div>
    </div>
  )
}
