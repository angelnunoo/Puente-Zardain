'use client';

import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../lib/api';

interface ActivitySignal {
  id: string;
  type: 'preparing' | 'recent_order' | 'busy' | 'quiet';
  message: string;
  iconType: 'preparing' | 'recent_order' | 'busy' | 'quiet';
  timestamp: Date;
}

export default function ActivitySignalsFixed() {
  const [signals, setSignals] = useState<ActivitySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivitySignals = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de analyticsApi
        const data = await analyticsApi.getActivitySignals();
        
        if (data && Array.isArray(data)) {
          setSignals(data.slice(0, 5)); // Máximo 5 señales
        } else {
          throw new Error('No se pudieron obtener las señales de actividad');
        }
      } catch (error) {
        console.error('Error fetching activity signals:', error);
        setError('No se puede cargar la actividad del restaurante');
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivitySignals();
    
    // Actualizar cada 3 minutos
    const interval = setInterval(fetchActivitySignals, 180000);
    return () => clearInterval(interval);
  }, []);

  const getSignalStyle = (type: ActivitySignal['type']) => {
    switch (type) {
      case 'preparing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'recent_order':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'busy':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'quiet':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
    return `Hace ${Math.floor(diffMins / 1440)} días`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-pulse flex space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animation-delay-200"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animation-delay-400"></div>
          </div>
          <span className="text-gray-600">Cargando actividad del restaurante...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-red-800">Error de conexión</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <span className="text-4xl">😴</span>
          <p className="text-gray-600 mt-2">El restaurante está en modo descanso</p>
          <p className="text-sm text-gray-500">Vuelve a revisar más tarde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Señales de Actividad</h3>
        <p className="text-sm text-gray-600">Lo que está pasando ahora mismo en el restaurante</p>
      </div>
      
      <div className="space-y-3">
        {signals.map((signal, index) => (
          <div 
            key={signal.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getSignalStyle(signal.type)} ${
              index === 0 ? 'ring-2 ring-blue-100' : ''
            }`}
          >
            <div className="text-2xl flex-shrink-0">
              {signal.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{signal.message}</p>
              <p className="text-xs opacity-75 mt-1">
                {formatTimestamp(signal.timestamp)}
              </p>
            </div>
            
            {index === 0 && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Actualizado cada 3 minutos automáticamente
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Actualizar ahora
          </button>
        </div>
      </div>
    </div>
  );
}
