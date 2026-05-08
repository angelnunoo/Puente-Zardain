'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi, ordersApi, analyticsApi } from '../../lib/api';

interface DashboardData {
  currentStatus: {
    isOpen: boolean;
    kitchenStatus: 'fluida' | 'carga' | 'saturada';
    activeOrders: number;
    estimatedWaitTime: string;
  };
  dailyStats: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    newCustomers: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'order' | 'customer' | 'issue' | 'milestone';
    message: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    action?: string;
  }>;
  rhythm: {
    current: 'tranquilo' | 'normal' | 'intenso' | 'pico';
    description: string;
    icon: string;
  };
}

export default function DailyDashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener datos reales desde APIs
        const [kitchenMetrics, todayStats, recentOrders] = await Promise.all([
          kitchenApi.getMetrics(token),
          analyticsApi.getDashboardMetrics(token, 'period=today'),
          ordersApi.getAll(token)
        ]);

        // Procesar datos para el dashboard
        const processedData: DashboardData = {
          currentStatus: {
            isOpen: kitchenMetrics.scheduleStatus.open,
            kitchenStatus: kitchenMetrics.kitchenStatus === 'open' ? 'fluida' : 
                           kitchenMetrics.kitchenStatus === 'saturated' ? 'saturada' : 'carga',
            activeOrders: kitchenMetrics.pending + kitchenMetrics.preparing,
            estimatedWaitTime: `${kitchenMetrics.averageDeliveredMinutes} min`
          },
          dailyStats: {
            totalOrders: todayStats.orders || 0,
            totalRevenue: todayStats.revenue || 0,
            averageOrderValue: todayStats.averageOrderValue || 0,
            newCustomers: todayStats.newCustomers || 0
          },
          recentActivity: recentOrders.slice(0, 10).map(order => ({
            id: order.id,
            type: 'order' as const,
            message: `Pedido #${order.id.slice(0, 8)} - ${order.status}`,
            timestamp: order.createdAt,
            priority: order.status === 'CANCELLED' ? 'high' : 'medium'
          })),
          alerts: [
            ...(kitchenMetrics.queueLength > 10 ? [{
              id: 'queue',
              type: 'warning' as const,
              message: `Cola de pedidos alta: ${kitchenMetrics.queueLength} pedidos`,
              action: 'Considerar contratar ayuda temporal'
            }] : []),
            ...(kitchenMetrics.kitchenStatus === 'saturated' ? [{
              id: 'kitchen',
              type: 'warning' as const,
              message: 'Cocina saturada',
              action: 'Activar modo de emergencia'
            }] : [])
          ],
          rhythm: {
            current: kitchenMetrics.queueLength > 15 ? 'pico' :
                    kitchenMetrics.queueLength > 8 ? 'intenso' :
                    kitchenMetrics.queueLength > 3 ? 'normal' : 'tranquilo',
            description: kitchenMetrics.queueLength > 15 ? 'Máxima actividad' :
                           kitchenMetrics.queueLength > 8 ? 'Muy ocupado' :
                           kitchenMetrics.queueLength > 3 ? 'Ritmo normal' : 'Actividad tranquila',
            icon: kitchenMetrics.queueLength > 15 ? '🔥' :
                   kitchenMetrics.queueLength > 8 ? '⚡' :
                   kitchenMetrics.queueLength > 3 ? '👍' : '😌'
          }
        };

        setDashboardData(processedData);
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
          // Fallback con datos simulados según hora y contexto
          const now = new Date();
          const currentHour = now.getHours();
          const isWeekend = now.getDay() === 0 || now.getDay() === 6;
          
          let rhythm: DashboardData['rhythm'];
          let kitchenStatus: DashboardData['currentStatus']['kitchenStatus'];
          
          // Determinar ritmo y estado según hora
          if (currentHour >= 13 && currentHour <= 15) {
            rhythm = {
              current: 'pico',
              description: 'Hora punta del mediodía 🏃‍♂️',
              icon: '🔥'
            };
            kitchenStatus = 'saturada';
          } else if (currentHour >= 20 && currentHour <= 22) {
            rhythm = {
              current: 'intenso',
              description: 'Cena muy activa 🍽',
              icon: '⚡'
            };
            kitchenStatus = 'carga';
          } else if (currentHour >= 12 && currentHour <= 23) {
            rhythm = {
              current: 'normal',
              description: 'Ritmo constante 🚶‍♂️',
              icon: '👍'
            };
            kitchenStatus = 'fluida';
          } else {
            rhythm = {
              current: 'tranquilo',
              description: 'Momento de calma 😊',
              icon: '🌙'
            };
            kitchenStatus = 'fluida';
          }

          const mockData: DashboardData = {
            currentStatus: {
              isOpen: currentHour >= 12 && currentHour <= 23,
              kitchenStatus,
              activeOrders: Math.floor(Math.random() * 8) + 2,
              estimatedWaitTime: `${Math.floor(Math.random() * 15) + 10}-${Math.floor(Math.random() * 15) + 25} min`
            },
            dailyStats: {
              totalOrders: Math.floor(Math.random() * 50) + 20,
              totalRevenue: Math.floor(Math.random() * 800) + 300,
              averageOrderValue: Math.floor(Math.random() * 10) + 12,
              newCustomers: Math.floor(Math.random() * 8) + 2
            },
            recentActivity: [
              {
                id: '1',
                type: 'order',
                message: 'Nuevo pedido de María García',
                timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
                priority: 'medium'
              },
              {
                id: '2',
                type: 'customer',
                message: 'Nuevo cliente registrado: Juan Pérez',
                timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
                priority: 'low'
              },
              {
                id: '3',
                type: 'milestone',
                message: '¡Superados 20 pedidos hoy!',
                timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
                priority: 'high'
              }
            ],
            alerts: [
              {
                id: '1',
                type: 'warning',
                message: 'Stock bajo en hamburguesas clásicas',
                action: 'Revisar inventario'
              },
              {
                id: '2',
                type: 'info',
                message: 'Lluvia prevista para esta tarde',
                action: 'Preparar delivery'
              }
            ],
            rhythm
          };
          
          setDashboardData(mockData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const getRhythmColor = (rhythm: string) => {
    switch (rhythm) {
      case 'pico':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'intenso':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tranquilo':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          icon: '⚠️'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          icon: 'ℹ️'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: '✅'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          icon: '📢'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ¿Qué está pasando hoy? 📊
          </h1>
          <p className="text-xl text-gray-600">
            Un vistazo rápido a tu restaurante
          </p>
        </div>

        {/* Estado Actual */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Estado</span>
              <span className={`text-2xl ${dashboardData.currentStatus.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                {dashboardData.currentStatus.isOpen ? '🟢' : '🔴'}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.currentStatus.isOpen ? 'Abierto' : 'Cerrado'}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Pedidos activos</span>
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.currentStatus.activeOrders}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Tiempo espera</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.currentStatus.estimatedWaitTime}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Ritmo del día</span>
              <span className="text-2xl">{dashboardData.rhythm.icon}</span>
            </div>
            <div className={`${getRhythmColor(dashboardData.rhythm.current)} border rounded-lg px-3 py-2`}>
              <div className="font-bold text-sm">
                {dashboardData.rhythm.description}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del Día */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Pedidos hoy</span>
              <span className="text-2xl">🛵</span>
            </div>
            <div className="text-3xl font-bold">
              {dashboardData.dailyStats.totalOrders}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Ingresos</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold">
              {dashboardData.dailyStats.totalRevenue}€
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Ticket medio</span>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-3xl font-bold">
              {dashboardData.dailyStats.averageOrderValue}€
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Clientes nuevos</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold">
              {dashboardData.dailyStats.newCustomers}
            </div>
          </div>
        </div>

        {/* Alertas */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Alertas importantes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dashboardData.alerts.map((alert) => {
                const config = getAlertConfig(alert.type);
                
                return (
                  <div
                    key={alert.id}
                    className={`${config.bgColor} ${config.borderColor} ${config.textColor} border rounded-lg p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{config.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium mb-1">{alert.message}</p>
                        {alert.action && (
                          <button className="text-sm underline hover:no-underline">
                            {alert.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actividad Reciente */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Actividad reciente</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.priority === 'high' ? 'bg-red-500' :
                    activity.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
