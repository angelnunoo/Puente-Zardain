'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNotifications } from '../../../context/NotificationsContext'
import { IncidenceType } from '../../../../../shared/enums'

interface Incident {
  id: string
  type: IncidenceType
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: string
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
  order?: {
    id: string
    total: number
    status: string
    createdAt: string
  }
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  adminNotes?: string
}

interface IncidentsResponse {
  incidents: Incident[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function IncidentsPage() {
  const { token } = useAuth()
  const { addNotification } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState<IncidentsResponse | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    page: 1,
    limit: 20
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (token) {
      loadIncidents()
    }
  }, [token, filters])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      // Aquí iría la llamada real al API
      // const data = await incidentsApi.getIncidents(token, filters)
      
      // Simulación de datos
      const mockData: IncidentsResponse = {
        incidents: [
          {
            id: '1',
            type: IncidenceType.ORDER_LATE,
            description: 'El pedido lleva 45 minutos de retraso',
            priority: 'HIGH',
            status: 'OPEN',
            user: {
              id: 'user1',
              name: 'Juan Pérez',
              email: 'juan@email.com',
              phone: '600123456'
            },
            order: {
              id: 'order1',
              total: 25.50,
              status: 'CONFIRMED',
              createdAt: '2024-01-15T12:00:00Z'
            },
            createdAt: '2024-01-15T13:45:00Z',
            updatedAt: '2024-01-15T13:45:00Z'
          },
          {
            id: '2',
            type: IncidenceType.WRONG_ORDER,
            description: 'Me entregaron el pedido equivocado',
            priority: 'MEDIUM',
            status: 'IN_PROGRESS',
            user: {
              id: 'user2',
              name: 'María García',
              email: 'maria@email.com',
              phone: '600987654'
            },
            order: {
              id: 'order2',
              total: 18.30,
              status: 'DELIVERED',
              createdAt: '2024-01-14T19:30:00Z'
            },
            createdAt: '2024-01-14T20:15:00Z',
            updatedAt: '2024-01-14T21:00:00Z',
            adminNotes: 'Contactado con delivery para verificar el pedido'
          }
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1
      }
      
      setIncidents(mockData)
    } catch (error) {
      addNotification({
        id: `incidents_error_${Date.now()}`,
        type: 'error',
        title: 'Error al cargar incidencias',
        message: 'No se pudieron cargar las incidencias',
        timestamp: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    try {
      // await incidentsApi.updateIncidentStatus(token, incidentId, newStatus, adminNotes)
      
      addNotification({
        id: `status_update_${Date.now()}`,
        type: 'success',
        title: 'Estado actualizado',
        message: `Incidencia ${incidentId} actualizada a ${newStatus}`,
        timestamp: new Date(),
      })
      
      loadIncidents()
      setSelectedIncident(null)
      setAdminNotes('')
    } catch (error) {
      addNotification({
        id: `status_error_${Date.now()}`,
        type: 'error',
        title: 'Error al actualizar estado',
        message: 'No se pudo actualizar el estado de la incidencia',
        timestamp: new Date(),
      })
    }
  }

  const handleAddResponse = async () => {
    if (!selectedIncident || !responseText.trim()) return

    try {
      // await incidentsApi.addIncidentResponse(token, selectedIncident.id, {
      //   message: responseText,
      //   isInternal: false
      // })
      
      addNotification({
        id: `response_added_${Date.now()}`,
        type: 'success',
        title: 'Respuesta añadida',
        message: 'Se ha añadido una respuesta a la incidencia',
        timestamp: new Date(),
      })
      
      loadIncidents()
      setShowResponseModal(false)
      setResponseText('')
      setSelectedIncident(null)
    } catch (error) {
      addNotification({
        id: `response_error_${Date.now()}`,
        type: 'error',
        title: 'Error al añadir respuesta',
        message: 'No se pudo añadir la respuesta',
        timestamp: new Date(),
      })
    }
  }

  const handleEscalate = async (incidentId: string) => {
    try {
      // await incidentsApi.escalateIncident(token, incidentId, 'Usuario solicita intervención inmediata')
      
      addNotification({
        id: `escalated_${Date.now()}`,
        type: 'info',
        title: 'Incidencia escalada',
        message: 'La incidencia ha sido escalada a urgente',
        timestamp: new Date(),
      })
      
      loadIncidents()
    } catch (error) {
      addNotification({
        id: `escalate_error_${Date.now()}`,
        type: 'error',
        title: 'Error al escalar',
        message: 'No se pudo escalar la incidencia',
        timestamp: new Date(),
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      case 'ESCALATED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: IncidenceType) => {
    switch (type) {
      case IncidenceType.ORDER_LATE: return 'Pedido Tardío'
      case IncidenceType.WRONG_ORDER: return 'Pedido Incorrecto'
      case IncidenceType.QUALITY_ISSUE: return 'Problema de Calidad'
      case IncidenceType.MISSING_ITEM: return 'Producto Faltante'
      case IncidenceType.OTHER: return 'Otro'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando incidencias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Incidencias</h1>
          <p className="text-gray-600">Gestiona las incidencias reportadas por los clientes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="OPEN">Abierta</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="RESOLVED">Resuelta</option>
                <option value="CLOSED">Cerrada</option>
                <option value="ESCALATED">Escalada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value={IncidenceType.ORDER_LATE}>Pedido Tardío</option>
                <option value={IncidenceType.WRONG_ORDER}>Pedido Incorrecto</option>
                <option value={IncidenceType.QUALITY_ISSUE}>Problema de Calidad</option>
                <option value={IncidenceType.MISSING_ITEM}>Producto Faltante</option>
                <option value={IncidenceType.OTHER}>Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <button
              onClick={() => setFilters({ status: '', type: '', priority: '', page: 1, limit: 20 })}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Incidents List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents?.incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{incident.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTypeLabel(incident.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">{incident.user.name}</div>
                        <div className="text-gray-500">{incident.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(incident.priority)}`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(incident.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedIncident(incident)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIncident(incident)
                            setShowResponseModal(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Responder
                        </button>
                        {incident.priority === 'HIGH' || incident.priority === 'URGENT' ? (
                          <button
                            onClick={() => handleEscalate(incident.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Escalar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incident Detail Modal */}
        {selectedIncident && !showResponseModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Incidencia #{selectedIncident.id}
                  </h3>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Descripción</h4>
                    <p className="text-gray-600">{selectedIncident.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Cliente</h4>
                      <p className="text-gray-600">{selectedIncident.user.name}</p>
                      <p className="text-gray-500">{selectedIncident.user.email}</p>
                      <p className="text-gray-500">{selectedIncident.user.phone}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Detalles</h4>
                      <p className="text-gray-600">Tipo: {getTypeLabel(selectedIncident.type)}</p>
                      <p className="text-gray-600">Prioridad: {selectedIncident.priority}</p>
                      <p className="text-gray-600">Estado: {selectedIncident.status}</p>
                    </div>
                  </div>

                  {selectedIncident.order && (
                    <div>
                      <h4 className="font-medium text-gray-900">Pedido Relacionado</h4>
                      <p className="text-gray-600">Pedido #{selectedIncident.order.id}</p>
                      <p className="text-gray-600">Total: €{selectedIncident.order.total}</p>
                      <p className="text-gray-600">Estado: {selectedIncident.order.status}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900">Actualizar Estado</h4>
                    <div className="mt-2 space-y-2">
                      <select
                        value={selectedIncident.status}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="OPEN">Abierta</option>
                        <option value="IN_PROGRESS">En Progreso</option>
                        <option value="RESOLVED">Resuelta</option>
                        <option value="CLOSED">Cerrada</option>
                      </select>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Notas del administrador..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <button
                        onClick={() => handleStatusUpdate(selectedIncident.id, selectedIncident.status)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Actualizar Estado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Responder Incidencia #{selectedIncident?.id}
                  </h3>
                  <button
                    onClick={() => {
                      setShowResponseModal(false)
                      setResponseText('')
                      setSelectedIncident(null)
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                  />
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={handleAddResponse}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Enviar Respuesta
                    </button>
                    <button
                      onClick={() => {
                        setShowResponseModal(false)
                        setResponseText('')
                        setSelectedIncident(null)
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
