'use client';

import React, { useState, useEffect } from 'react';

interface OrderAcceptanceData {
  enabled: boolean;
  message: string;
  autoSchedule: {
    enabled: boolean;
    openTime: string;
    closeTime: string;
  };
  maxOrdersPerHour: number;
  currentOrders: number;
}

export default function OrderAcceptance() {
  const [data, setData] = useState<OrderAcceptanceData>({
    enabled: true,
    message: 'Aceptando pedidos normalmente',
    autoSchedule: {
      enabled: false,
      openTime: '12:00',
      closeTime: '23:00'
    },
    maxOrdersPerHour: 20,
    currentOrders: 8
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simular obtención de datos desde backend
    const fetchOrderAcceptance = async () => {
      try {
        const response = await fetch('/api/admin/order-acceptance');
        if (response.ok) {
          const fetchedData = await response.json();
          setData(fetchedData);
        } else {
          // Fallback con datos simulados
          const mockData: OrderAcceptanceData = {
            enabled: true,
            message: 'Aceptando pedidos normalmente',
            autoSchedule: {
              enabled: false,
              openTime: '12:00',
              closeTime: '23:00'
            },
            maxOrdersPerHour: 20,
            currentOrders: 8
          };
          setData(mockData);
        }
      } catch (error) {
        console.error('Error fetching order acceptance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAcceptance();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/order-acceptance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log('Configuración guardada exitosamente');
      } else {
        console.error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error saving order acceptance:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = () => {
    if (!data.enabled) return 'bg-red-100 text-red-800 border-red-200';
    if (data.currentOrders >= data.maxOrdersPerHour) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusIcon = () => {
    if (!data.enabled) return '🔴';
    if (data.currentOrders >= data.maxOrdersPerHour) return '🟡';
    return '🟢';
  };

  const getStatusText = () => {
    if (!data.enabled) return 'Pedidos desactivados';
    if (data.currentOrders >= data.maxOrdersPerHour) return 'Capacidad alcanzada';
    return 'Aceptando pedidos';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Título */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🛎️</span>
          Aceptación de pedidos
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Controla cuándo y cómo aceptas nuevos pedidos
        </p>
      </div>

      {/* Estado actual */}
      <div className={`mb-6 p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getStatusIcon()}</span>
            <div>
              <h4 className="font-semibold text-lg">{getStatusText()}</h4>
              <p className="text-sm opacity-90">{data.message}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-75">Pedidos activos</div>
            <div className="text-2xl font-bold">
              {data.currentOrders}/{data.maxOrdersPerHour}
            </div>
          </div>
        </div>
      </div>

      {/* Toggle principal */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={data.enabled}
              onChange={(e) => setData({ ...data, enabled: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              data.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                data.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </div>
          </div>
          <span className="font-medium text-gray-700">
            {data.enabled ? 'Pedidos activados' : 'Pedidos desactivados'}
          </span>
        </label>
      </div>

      {/* Mensaje personalizado */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje para clientes
        </label>
        <input
          type="text"
          value={data.message}
          onChange={(e) => setData({ ...data, message: e.target.value })}
          placeholder="Escribe el mensaje que verán los clientes..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!data.enabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          Este mensaje aparecerá en la página principal cuando los pedidos estén activados
        </p>
      </div>

      {/* Límite de pedidos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Límite de pedidos por hora
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max="100"
            value={data.maxOrdersPerHour}
            onChange={(e) => setData({ ...data, maxOrdersPerHour: parseInt(e.target.value) || 1 })}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!data.enabled}
          />
          <span className="text-sm text-gray-600">
            pedidos por hora
          </span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uso actual</span>
            <span>{Math.round((data.currentOrders / data.maxOrdersPerHour) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                (data.currentOrders / data.maxOrdersPerHour) >= 0.9 
                  ? 'bg-red-500' 
                  : (data.currentOrders / data.maxOrdersPerHour) >= 0.7 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((data.currentOrders / data.maxOrdersPerHour) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Programación automática */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Programación automática
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.autoSchedule.enabled}
              onChange={(e) => setData({ 
                ...data, 
                autoSchedule: { ...data.autoSchedule, enabled: e.target.checked }
              })}
              disabled={!data.enabled}
              className="sr-only"
            />
            <div className={`w-9 h-5 rounded-full transition-colors ${
              data.autoSchedule.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                data.autoSchedule.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}></div>
            </div>
            <span className="text-sm text-gray-600">
              {data.autoSchedule.enabled ? 'Activada' : 'Desactivada'}
            </span>
          </label>
        </div>
        
        {data.autoSchedule.enabled && (
          <div className="flex gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora de apertura</label>
              <input
                type="time"
                value={data.autoSchedule.openTime}
                onChange={(e) => setData({ 
                  ...data, 
                  autoSchedule: { ...data.autoSchedule, openTime: e.target.value }
                })}
                disabled={!data.enabled}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora de cierre</label>
              <input
                type="time"
                value={data.autoSchedule.closeTime}
                onChange={(e) => setData({ 
                  ...data, 
                  autoSchedule: { ...data.autoSchedule, closeTime: e.target.value }
                })}
                disabled={!data.enabled}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        
        <button
          onClick={() => {
            setData({
              enabled: true,
              message: 'Aceptando pedidos normalmente',
              autoSchedule: {
                enabled: false,
                openTime: '12:00',
                closeTime: '23:00'
              },
              maxOrdersPerHour: 20,
              currentOrders: 0
            });
          }}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Restablecer
        </button>
      </div>

      {/* Ayuda */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>⚠️ Importante:</strong> Cuando desactives los pedidos, los clientes no podrán 
          realizar nuevos pedidos. Usa esta función cuando necesites pausar temporalmente 
          el servicio (mantenimiento, exceso de demanda, etc.).
        </p>
      </div>
    </div>
  );
}
