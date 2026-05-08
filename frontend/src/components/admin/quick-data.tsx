'use client';

import React, { useState, useEffect } from 'react';

interface QuickData {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  pendingReviews: number;
  lowStockProducts: number;
  newCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  topProduct: {
    name: string;
    orders: number;
    revenue: number;
  };
  customerSatisfaction: number;
}

export default function QuickData() {
  const [data, setData] = useState<QuickData>({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    pendingReviews: 0,
    lowStockProducts: 0,
    newCustomers: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    monthlyOrders: 0,
    topProduct: {
      name: '',
      orders: 0,
      revenue: 0
    },
    customerSatisfaction: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Simular obtención de datos desde backend
    const fetchQuickData = async () => {
      try {
        const response = await fetch('/api/admin/quick-data');
        if (response.ok) {
          const fetchedData = await response.json();
          setData(fetchedData);
        } else {
          // Fallback con datos simulados
          const mockData: QuickData = {
            todayOrders: 47,
            todayRevenue: 623.50,
            activeOrders: 8,
            pendingReviews: 12,
            lowStockProducts: 3,
            newCustomers: 15,
            averageOrderValue: 13.26,
            conversionRate: 3.8,
            monthlyRevenue: 18547.80,
            monthlyOrders: 1247,
            topProduct: {
              name: 'Hamburguesa Clásica',
              orders: 156,
              revenue: 1950.00
            },
            customerSatisfaction: 4.7
          };
          setData(mockData);
        }
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching quick data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchQuickData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { isUp: true, percentage: 100 };
    const percentage = ((current - previous) / previous) * 100;
    return {
      isUp: percentage >= 0,
      percentage: Math.abs(percentage)
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Datos Rápidos</h2>
          <p className="text-gray-600">
            {lastUpdated && `Actualizado: ${lastUpdated.toLocaleTimeString('es-ES')}`}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pedidos de hoy */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pedidos hoy</h3>
              <div className="text-3xl font-bold text-gray-900">{data.todayOrders}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-sm font-medium">+12.5%</span>
                <span className="text-gray-500 text-sm">vs ayer</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        {/* Ingresos de hoy */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Ingresos hoy</h3>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.todayRevenue)}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-sm font-medium">+8.3%</span>
                <span className="text-gray-500 text-sm">vs ayer</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Pedidos activos */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pedidos activos</h3>
              <div className="text-3xl font-bold text-gray-900">{data.activeOrders}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-orange-600 text-sm font-medium">En preparación</span>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        {/* Nuevos clientes */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Nuevos clientes</h3>
              <div className="text-3xl font-bold text-gray-900">{data.newCustomers}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 text-sm font-medium">+25.0%</span>
                <span className="text-gray-500 text-sm">vs semana pasada</span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        {/* Productos con stock bajo */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Stock bajo</h3>
              <div className="text-3xl font-bold text-gray-900">{data.lowStockProducts}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-600 text-sm font-medium">Requerir atención</span>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        {/* Reseñas pendientes */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Reseñas pendientes</h3>
              <div className="text-3xl font-bold text-gray-900">{data.pendingReviews}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-indigo-600 text-sm font-medium">Por revisar</span>
              </div>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor promedio del pedido */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Valor promedio del pedido</h4>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.averageOrderValue)}</div>
        </div>

        {/* Tasa de conversión */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Tasa de conversión</h4>
          <div className="text-xl font-bold text-gray-900">{formatPercentage(data.conversionRate)}</div>
        </div>

        {/* Ingresos mensuales */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Ingresos mensuales</h4>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.monthlyRevenue)}</div>
        </div>

        {/* Satisfacción del cliente */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Satisfacción del cliente</h4>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-gray-900">{data.customerSatisfaction}</div>
            <span className="text-yellow-500">⭐</span>
          </div>
        </div>
      </div>

      {/* Producto más vendido */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Producto más vendido del mes</h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-gray-900">{data.topProduct.name}</h4>
            <div className="flex items-center gap-6 mt-2">
              <div>
                <span className="text-sm text-gray-600">Pedidos: </span>
                <span className="font-semibold">{data.topProduct.orders}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Ingresos: </span>
                <span className="font-semibold">{formatCurrency(data.topProduct.revenue)}</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <span className="text-3xl">🏆</span>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.location.href = '/admin/orders'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver todos los pedidos
        </button>
        <button
          onClick={() => window.location.href = '/admin/stock'}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Gestionar stock
        </button>
        <button
          onClick={() => window.location.href = '/admin/reviews'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Revisar reseñas
        </button>
        <button
          onClick={() => window.location.href = '/admin/analytics'}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Ver analytics completo
        </button>
      </div>
    </div>
  );
}
