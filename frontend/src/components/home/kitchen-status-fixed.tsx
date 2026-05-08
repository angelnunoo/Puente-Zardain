'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi } from '../../lib/api';

interface KitchenStatus {
  status: 'fluida' | 'carga' | 'saturada';
  message: string;
  estimatedDelay?: string;
  lastUpdated: string;
}

export default function KitchenStatusFixed() {
  const { token } = useAuth();
  const [kitchenStatus, setKitchenStatus] = useState<KitchenStatus>({
    status: 'fluida',
    message: 'La cocina está funcionando perfectamente',
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKitchenStatus = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de kitchenApi
        const data = await kitchenApi.getStatus(token);
        
        if (data) {
          // Mapear el estado del backend a nuestra interfaz
          let mappedStatus: KitchenStatus['status'] = 'fluida';
          let message = 'La cocina está funcionando perfectamente';
          let estimatedDelay = '';
          
          if (data.status === 'open') {
            // Si está abierto, verificar si hay carga según hora
            const now = new Date();
            const currentHour = now.getHours();
            const isPeakHour = (currentHour >= 13 && currentHour <= 15) || (currentHour >= 20 && currentHour <= 22);
            
            if (isPeakHour) {
              mappedStatus = 'carga';
              message = 'Tenemos bastante carga ahora mismo';
              estimatedDelay = '+5-10 min';
            } else {
              mappedStatus = 'fluida';
              message = 'La cocina está funcionando perfectamente';
              estimatedDelay = '15-20 min';
            }
          } else if (data.status === 'closed') {
            mappedStatus = 'saturada';
            message = 'La cocina está cerrada ahora';
            estimatedDelay = 'Cocina cerrada';
          }
          
          setKitchenStatus({
            status: mappedStatus,
            message,
            estimatedDelay,
            lastUpdated: new Date().toISOString()
          });
        } else {
          throw new Error('No se pudo obtener el estado de la cocina');
        }
      } catch (error) {
        console.error('Error fetching kitchen status:', error);
        setError('No se puede verificar el estado de la cocina');
        
        // Lógica fallback solo si falla la API
        const now = new Date();
        const currentHour = now.getHours();
        const isPeakHour = (currentHour >= 13 && currentHour <= 15) || (currentHour >= 20 && currentHour <= 22);
        
        let status: KitchenStatus['status'] = 'fluida';
        let message = 'La cocina está funcionando perfectamente';
        let estimatedDelay = '';
        
        if (isPeakHour) {
          status = 'saturada';
          message = 'Vamos muy justos en cocina, gracias por la paciencia';
          estimatedDelay = '+15-20 min';
        } else if (isPeakHour) {
          status = 'carga';
          message = 'Tenemos bastante carga ahora mismo';
          estimatedDelay = '+5-10 min';
        }
        
        setKitchenStatus({
          status,
          message,
          estimatedDelay,
          lastUpdated: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenStatus();
    
    // Actualizar cada 3 minutos
    const interval = setInterval(fetchKitchenStatus, 180000);
    return () => clearInterval(interval);
  }, [token]);

  const getStatusConfig = () => {
    switch (kitchenStatus.status) {
      case 'fluida':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: 'check',
          title: 'Cocina Funcional',
          subtitle: 'Operación normal'
        };
      case 'carga':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: 'clock',
          title: 'Cocina con Carga',
          subtitle: 'Tiempo estimado aumentado'
        };
      case 'saturada':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: 'fire',
          title: 'Cocina Saturada',
          subtitle: 'Funcionando a máxima capacidad'
        };
      default:
        return {
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          icon: 'warning',
          title: 'Estado Desconocido',
          subtitle: 'Verificando...'
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Verificando estado de la cocina...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-orange-800">Error de conexión</p>
              <p className="text-sm text-orange-600">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${statusConfig.bgColor} border rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{statusConfig.icon}</div>
          <div>
            <h3 className={`text-lg font-semibold ${statusConfig.textColor}`}>
              {statusConfig.title}
            </h3>
            <p className={`text-sm ${statusConfig.textColor} opacity-80`}>
              {statusConfig.subtitle}
            </p>
            <p className={`text-sm mt-2 ${statusConfig.textColor}`}>
              {kitchenStatus.message}
            </p>
            {kitchenStatus.estimatedDelay && (
              <p className={`text-xs mt-1 font-medium ${statusConfig.textColor}`}>
                Tiempo estimado: {kitchenStatus.estimatedDelay}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-xs ${statusConfig.textColor} opacity-60`}>
            Última actualización
          </p>
          <p className={`text-xs ${statusConfig.textColor} opacity-80`}>
            {new Date(kitchenStatus.lastUpdated).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      {/* Barra de progreso visual */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              kitchenStatus.status === 'fluida' ? 'bg-green-500 w-1/3' :
              kitchenStatus.status === 'carga' ? 'bg-yellow-500 w-2/3' :
              'bg-red-500 w-full'
            }`}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Óptimo</span>
          <span className="text-xs text-gray-500">Carga</span>
          <span className="text-xs text-gray-500">Saturado</span>
        </div>
      </div>
    </div>
  );
}
