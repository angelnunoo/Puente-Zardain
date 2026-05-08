'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi } from '../../lib/api';

interface RestaurantStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'unavailable';
  nextOpenTime?: string;
  currentSchedule?: string;
  message?: string;
  estimatedTime?: string;
}

export default function HeroSectionFixed() {
  const { token } = useAuth();
  const [status, setStatus] = useState<RestaurantStatus>({
    isOpen: false,
    status: 'closed'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantStatus = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de kitchenApi
        const data = await kitchenApi.getStatus(token);
        
        if (data) {
          setStatus(data);
        } else {
          throw new Error('No se pudo obtener el estado del restaurante');
        }
      } catch (error) {
        console.error('Error fetching restaurant status:', error);
        setError('No se puede verificar el estado del restaurante');
        
        // Lógica de horario fallback solo si falla la API
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        
        const isMonday = currentDay === 1;
        const isOpenHours = currentHour >= 12 && currentHour < 23;
        const isOpen = !isMonday && isOpenHours;
        
        let nextOpenTime = '';
        let restaurantStatus: 'open' | 'closed' | 'unavailable' = 'closed';
        let estimatedTime = '';
        
        if (isMonday) {
          restaurantStatus = 'unavailable';
          nextOpenTime = 'Mañana a las 12:00';
        } else if (currentHour < 12) {
          restaurantStatus = 'closed';
          nextOpenTime = 'Hoy a las 12:00';
        } else if (currentHour >= 23) {
          restaurantStatus = 'closed';
          nextOpenTime = 'Mañana a las 12:00';
        } else {
          restaurantStatus = 'open';
          // Tiempo estimado según hora
          if (currentHour >= 14 && currentHour <= 16) {
            estimatedTime = '25-35 min';
          } else if (currentHour >= 20 || currentHour <= 1) {
            estimatedTime = '45-60 min';
          } else {
            estimatedTime = '30-40 min';
          }
        }
        
        setStatus({
          isOpen,
          status: restaurantStatus,
          nextOpenTime,
          currentSchedule: isMonday ? 'Cerrado los lunes' : '12:00 - 23:00',
          estimatedTime
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantStatus();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchRestaurantStatus, 300000);
    return () => clearInterval(interval);
  }, [token]);

  const getStatusConfig = () => {
    switch (status.status) {
      case 'open':
        return {
          bgColor: 'bg-gradient-to-r from-green-600 to-green-700',
          textColor: 'text-white',
          icon: 'open',
          title: 'Estamos funcionando con normalidad',
          subtitle: 'La cocina está funcionando perfectamente',
          description: 'Pedidos siendo preparados ahora mismo'
        };
      case 'closed':
        return {
          bgColor: 'bg-gradient-to-r from-gray-600 to-gray-700',
          textColor: 'text-white',
          icon: 'closed',
          title: 'Estamos cerrados ahora',
          subtitle: status.currentSchedule || 'Fuera de horario',
          description: status.nextOpenTime ? `Reabrimos: ${status.nextOpenTime}` : 'Consulta nuestros horarios'
        };
      case 'unavailable':
        return {
          bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
          textColor: 'text-white',
          icon: 'unavailable',
          title: 'Cerrado por descanso',
          subtitle: 'Nos vemos pronto',
          description: 'Disfrutando de nuestro merecido descanso semanal'
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
          textColor: 'text-white',
          icon: 'warning',
          title: 'Estado desconocido',
          subtitle: 'Verificando estado...',
          description: 'Por favor, intenta de nuevo en unos momentos'
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (loading) {
    return (
      <div className={`${statusConfig.bgColor} ${statusConfig.textColor} py-16 px-4`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="text-6xl mb-4">
              <svg className="w-16 h-16 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16l4-4m0 0l4 4m0 0V4m6 2a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2h-4a2 2 0 00-2 2v12z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-2">Verificando estado...</h1>
            <p className="text-xl opacity-90">Cargando información del restaurante</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          <h1 className="text-4xl font-bold mb-2">Error de conexión</h1>
          <p className="text-xl opacity-90 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${statusConfig.bgColor} ${statusConfig.textColor} py-16 px-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Columna izquierda - Información principal */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">
              {statusConfig.icon === 'open' && (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {statusConfig.icon === 'closed' && (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l-2 2m2-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10 0V9a2 2 0 00-2-2h-4a2 2 0 00-2 2v6" />
                </svg>
              )}
              {statusConfig.icon === 'unavailable' && (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9 12h6m-6 0h6m2 0H7a2 2 0 01-2 2v6a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2h-4a2 2 0 00-2 2v6z" />
                </svg>
              )}
              {statusConfig.icon === 'warning' && (
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{statusConfig.title}</h1>
                <p className="text-xl opacity-90">{statusConfig.subtitle}</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-lg font-medium mb-2">{statusConfig.description}</p>
              {status.estimatedTime && (
                <p className="text-sm opacity-80">
                  <strong>Tiempo estimado:</strong> {status.estimatedTime}
                </p>
              )}
            </div>
          </div>

          {/* Columna derecha - Información de contacto y horarios */}
          <div className="space-y-6">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Horario</p>
                  <p className="text-sm opacity-90">{status.currentSchedule}</p>
                  {status.nextOpenTime && (
                    <p className="text-xs opacity-80 mt-1">Próxima apertura: {status.nextOpenTime}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Dirección</p>
                  <p className="text-sm opacity-90">Calle Puente de Zardain, 15</p>
                  <p className="text-xs opacity-80">28014 Madrid</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Teléfono</p>
                  <p className="text-sm opacity-90">912 345 678</p>
                  <p className="text-xs opacity-80">Pedidos: 912 345 679</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ChefHat className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Cocina</p>
                  <p className="text-sm opacity-90">Abierta de 12:00 a 23:00</p>
                  <p className="text-xs opacity-80">Cerrado los lunes</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/menu'}
                className="w-full bg-white text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Ver Carta
              </button>
              <button 
                onClick={() => window.location.href = '/orders'}
                className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Mis Pedidos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
