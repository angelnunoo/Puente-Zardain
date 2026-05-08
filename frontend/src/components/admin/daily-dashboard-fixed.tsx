'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi, ordersApi, analyticsApi } from '../../lib/api';

export default function DailyDashboardFixed() {
  const { token } = useAuth();
  const [kitchenMetrics, setKitchenMetrics] = useState<any>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener datos reales desde APIs
        const [metrics, stats, orders] = await Promise.all([
          kitchenApi.getMetrics(token),
          analyticsApi.getDashboardMetrics(token, 'period=today'),
          ordersApi.getAll(token)
        ]);

        setKitchenMetrics(metrics);
        setTodayStats(stats);
        setRecentOrders(orders.slice(0, 5)); // Últimos 5 pedidos
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const getRhythmIcon = () => {
    if (!kitchenMetrics) return '😌';
    const queueLength = kitchenMetrics.queueLength || 0;
    if (queueLength > 15) return '🔥';
    if (queueLength > 8) return '⚡';
    if (queueLength > 3) return '👍';
    return '😌';
  };

  const getRhythmDescription = () => {
    if (!kitchenMetrics) return 'Actividad tranquila';
    const queueLength = kitchenMetrics.queueLength || 0;
    if (queueLength > 15) return 'Máxima actividad';
    if (queueLength > 8) return 'Muy ocupado';
    if (queueLength > 3) return 'Ritmo normal';
    return 'Actividad tranquila';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado Actual */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Estado Actual del Restaurante</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">{getRhythmIcon()}</div>
            <p className="text-sm text-gray-600">Ritmo</p>
            <p className="font-semibold">{getRhythmDescription()}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">
              {kitchenMetrics?.scheduleStatus?.open ? '🟢' : '🔴'}
            </div>
            <p className="text-sm text-gray-600">Estado</p>
            <p className="font-semibold">
              {kitchenMetrics?.scheduleStatus?.open ? 'Abierto' : 'Cerrado'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-sm text-gray-600">Pedidos Activos</p>
            <p className="font-semibold text-2xl">
              {(kitchenMetrics?.pending || 0) + (kitchenMetrics?.preparing || 0)}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <p className="text-sm text-gray-600">Tiempo Medio</p>
            <p className="font-semibold">
              {kitchenMetrics?.averageDeliveredMinutes || 0} min
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas del Día */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Estadísticas de Hoy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🛒</div>
            <p className="text-sm text-gray-600">Pedidos Totales</p>
            <p className="font-semibold text-2xl">{todayStats?.orders || 0}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm text-gray-600">Ingresos</p>
            <p className="font-semibold text-2xl">€{todayStats?.revenue || 0}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm text-gray-600">Ticket Medio</p>
            <p className="font-semibold text-2xl">€{todayStats?.averageOrderValue || 0}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm text-gray-600">Nuevos Clientes</p>
            <p className="font-semibold text-2xl">{todayStats?.newCustomers || 0}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Alertas Importantes</h2>
        <div className="space-y-3">
          {kitchenMetrics?.queueLength > 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">Cola de pedidos alta</p>
                  <p className="text-yellow-700">
                    Hay {kitchenMetrics.queueLength} pedidos en cola
                  </p>
                </div>
              </div>
            </div>
          )}
          {kitchenMetrics?.kitchenStatus === 'saturated' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-semibold text-red-800">Cocina Saturada</p>
                  <p className="text-red-700">
                    Considerar activar modo de emergencia
                  </p>
                </div>
              </div>
            </div>
          )}
          {(!kitchenMetrics?.queueLength || kitchenMetrics?.queueLength === 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-semibold text-blue-800">Sin pedidos activos</p>
                  <p className="text-blue-700">
                    Todo en orden, momento para revisar inventario
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600">No hay actividad reciente.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border border-gray-100 rounded">
                <div>
                  <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
