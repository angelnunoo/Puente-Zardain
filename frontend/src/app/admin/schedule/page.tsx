'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { scheduleApi } from '../../../lib/api'

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

export default function AdminSchedule() {
  const { token } = useAuth()
  const [windows, setWindows] = useState<ScheduleWindow[]>([])
  const [specials, setSpecials] = useState<SpecialSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [newWindow, setNewWindow] = useState({ dayOfWeek: 1, shift: 1, openTime: '09:00', closeTime: '14:00', note: '' })
  const [newSpecial, setNewSpecial] = useState({ date: '', isClosed: false, openTime: '09:00', closeTime: '14:00', note: '' })

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const loadSchedule = async () => {
    try {
      if (!token) return
      setLoading(true)
      const data = await scheduleApi.getAdminSchedule(token)
      setWindows(data.windows || [])
      setSpecials(data.specials || [])
      setLoading(false)
    } catch (err: any) {
      setLoading(false)
      setMessage(err.message || 'No se pudo cargar el horario')
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [token])

  const handleCreateWindow = async () => {
    try {
      if (!token) return
      await scheduleApi.createWindow(token, newWindow)
      setMessage('Ventana creada correctamente')
      loadSchedule()
    } catch (err: any) {
      setMessage(err.message || 'Error al crear ventana')
    }
  }

  const handleCreateSpecial = async () => {
    try {
      if (!token) return
      await scheduleApi.createSpecial(token, newSpecial)
      setMessage('Horario especial creado correctamente')
      loadSchedule()
    } catch (err: any) {
      setMessage(err.message || 'Error al crear especial')
    }
  }

  const handleToggleWindow = async (id: string, active: boolean) => {
    try {
      if (!token) return
      await scheduleApi.updateWindow(token, id, { active: !active })
      loadSchedule()
    } catch (err: any) {
      setMessage(err.message || 'Error al actualizar ventana')
    }
  }

  const handleDeleteWindow = async (id: string) => {
    try {
      if (!token) return
      await scheduleApi.deleteWindow(token, id)
      loadSchedule()
    } catch (err: any) {
      setMessage(err.message || 'Error al eliminar ventana')
    }
  }

  const handleDeleteSpecial = async (id: string) => {
    try {
      if (!token) return
      await scheduleApi.deleteSpecial(token, id)
      loadSchedule()
    } catch (err: any) {
      setMessage(err.message || 'Error al eliminar especial')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administrar Horarios</h1>
          <p className="text-sm text-gray-600">Añade ventanas de apertura y días especiales para controlar el servicio.</p>
        </div>
        <Link href="/admin" className="rounded bg-gray-800 px-4 py-2 text-white">Volver al panel</Link>
      </div>

      {message ? <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Ventanas de horario</h2>
          {loading ? <p>Cargando...</p> : (
            windows.length ? (
              <div className="space-y-3">
                {windows.map((window) => (
                  <div key={window.id} className="rounded border border-gray-100 p-3">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <div>
                        <p><strong>{dayNames[window.dayOfWeek]}</strong> · Turno {window.shift}</p>
                        <p>{window.openTime} - {window.closeTime}</p>
                        <p>{window.note}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleWindow(window.id, window.active)} className="rounded bg-blue-600 px-3 py-1 text-white">{window.active ? 'Desactivar' : 'Activar'}</button>
                        <button onClick={() => handleDeleteWindow(window.id)} className="rounded bg-red-600 px-3 py-1 text-white">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">No hay ventanas configuradas.</p>
          )}

          <div className="mt-6 space-y-3 rounded border border-dashed border-gray-200 p-4">
            <h3 className="font-semibold">Nueva ventana</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Día
                <select className="mt-1 w-full rounded border p-2" value={newWindow.dayOfWeek} onChange={(event) => setNewWindow({ ...newWindow, dayOfWeek: Number(event.target.value) })}>
                  {dayNames.map((name, index) => (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Turno
                <input type="number" className="mt-1 w-full rounded border p-2" value={newWindow.shift} onChange={(event) => setNewWindow({ ...newWindow, shift: Number(event.target.value) })} min={1} />
              </label>
              <label className="text-sm">
                Apertura
                <input type="time" className="mt-1 w-full rounded border p-2" value={newWindow.openTime} onChange={(event) => setNewWindow({ ...newWindow, openTime: event.target.value })} />
              </label>
              <label className="text-sm">
                Cierre
                <input type="time" className="mt-1 w-full rounded border p-2" value={newWindow.closeTime} onChange={(event) => setNewWindow({ ...newWindow, closeTime: event.target.value })} />
              </label>
            </div>
            <label className="text-sm block">
              Nota
              <input type="text" className="mt-1 w-full rounded border p-2" value={newWindow.note} onChange={(event) => setNewWindow({ ...newWindow, note: event.target.value })} />
            </label>
            <button onClick={handleCreateWindow} className="rounded bg-green-600 px-4 py-2 text-white">Guardar ventana</button>
          </div>
        </section>

        <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Días especiales</h2>
          {loading ? <p>Cargando...</p> : (
            specials.length ? (
              <div className="space-y-3">
                {specials.map((special) => (
                  <div key={special.id} className="rounded border border-gray-100 p-3">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <div>
                        <p><strong>{special.date}</strong> · {special.isClosed ? 'Cerrado' : `${special.openTime} - ${special.closeTime}`}</p>
                        <p>{special.note}</p>
                      </div>
                      <button onClick={() => handleDeleteSpecial(special.id)} className="rounded bg-red-600 px-3 py-1 text-white">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">No hay fechas especiales registradas.</p>
          )}

          <div className="mt-6 space-y-3 rounded border border-dashed border-gray-200 p-4">
            <h3 className="font-semibold">Nuevo día especial</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Fecha
                <input type="date" className="mt-1 w-full rounded border p-2" value={newSpecial.date} onChange={(event) => setNewSpecial({ ...newSpecial, date: event.target.value })} />
              </label>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={newSpecial.isClosed} onChange={(event) => setNewSpecial({ ...newSpecial, isClosed: event.target.checked })} />
                Día cerrado
              </label>
            </div>
            {!newSpecial.isClosed && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Apertura
                  <input type="time" className="mt-1 w-full rounded border p-2" value={newSpecial.openTime} onChange={(event) => setNewSpecial({ ...newSpecial, openTime: event.target.value })} />
                </label>
                <label className="text-sm">
                  Cierre
                  <input type="time" className="mt-1 w-full rounded border p-2" value={newSpecial.closeTime} onChange={(event) => setNewSpecial({ ...newSpecial, closeTime: event.target.value })} />
                </label>
              </div>
            )}
            <label className="text-sm block">
              Nota
              <input type="text" className="mt-1 w-full rounded border p-2" value={newSpecial.note} onChange={(event) => setNewSpecial({ ...newSpecial, note: event.target.value })} />
            </label>
            <button onClick={handleCreateSpecial} className="rounded bg-green-600 px-4 py-2 text-white">Guardar especial</button>
          </div>
        </section>
      </div>
    </div>
  )
}
