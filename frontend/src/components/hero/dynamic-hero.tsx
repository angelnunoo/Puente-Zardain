'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Phone, ChefHat } from 'lucide-react';

interface RestaurantStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'busy';
  nextOpenTime?: string;
  currentSchedule?: string;
  message?: string;
}

export default function DynamicHero() {
  const [status, setStatus] = useState<RestaurantStatus>({
    isOpen: false,
    status: 'closed'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención del estado del restaurante
    const fetchRestaurantStatus = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();
      
      // Lógica de horario (ejemplo: 12:00-23:00, cerrado lunes)
      const isMonday = currentDay === 1;
      const isOpenHours = currentHour >= 12 && currentHour < 23;
      const isOpen = !isMonday && isOpenHours;
      
      let nextOpenTime = '';
      if (!isOpen) {
        if (isMonday) {
          nextOpenTime = 'Mañana a las 12:00';
        } else if (currentHour < 12) {
          nextOpenTime = `Hoy a las 12:00`;
        } else {
          nextOpenTime = `Mañana a las 12:00`;
        }
      }
      
      setStatus({
        isOpen,
        status: isOpen ? (currentHour >= 20 ? 'busy' : 'open') : 'closed',
        nextOpenTime,
        currentSchedule: isMonday ? 'Cerrado los lunes' : '12:00 - 23:00',
        message: isOpen 
          ? (currentHour >= 20 ? 'Con alta demanda' : 'Funcionando normalmente')
          : 'Temporalmente cerrado'
      });
      
      setLoading(false);
    };

    fetchRestaurantStatus();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchRestaurantStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'open':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />;
      case 'busy':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />;
      default:
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'open':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'busy':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getButtonText = () => {
    if (status.isOpen) {
      return 'Pedir ahora';
    }
    return status.nextOpenTime ? `Abrimos ${status.nextOpenTime}` : 'Consultar horario';
  };

  const getButtonVariant = () => {
    return status.isOpen ? 'default' : 'outline';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-white/20 rounded mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-white/20 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6">
          {/* Estado Principal */}
          <div className="flex items-center justify-center gap-3">
            {getStatusIcon()}
            <div className="text-2xl font-bold">
              {status.isOpen ? 'Abierto ahora' : 'Cerrado'}
            </div>
          </div>

          {/* Badge de Estado */}
          <Badge className={getStatusColor()}>
            {status.message}
          </Badge>

          {/* Horario Actual */}
          <div className="flex items-center justify-center gap-2 text-white/90">
            <Clock className="w-4 h-4" />
            <span>Horario: {status.currentSchedule}</span>
          </div>

          {/* Mensaje de Espera si está cerrado */}
          {!status.isOpen && status.nextOpenTime && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
              <p className="text-lg font-medium mb-2">
                {status.nextOpenTime}
              </p>
              <p className="text-sm text-white/80">
                Mientras tanto, puedes explorar nuestro menú
              </p>
            </div>
          )}

          {/* Botón Principal */}
          <Button 
            size="lg" 
            variant={getButtonVariant()}
            className="text-lg px-8 py-3 h-auto"
            disabled={!status.isOpen}
          >
            {getButtonText()}
          </Button>

          {/* Información Adicional */}
          <div className="flex items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Calle Principal 123</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>900 123 456</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              <span>Cocina hasta las 23:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
