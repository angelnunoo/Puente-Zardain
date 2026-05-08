'use client';

import React, { useState, useEffect } from 'react';

interface RestaurantStatus {
  status: 'fluid' | 'busy' | 'unavailable';
  message: string;
  waitTime?: string;
  ordersInProgress?: number;
}

export default function RestaurantStatusIcons() {
  const [status, setStatus] = useState<RestaurantStatus>({
    status: 'fluid',
    message: 'Funcionando con normalidad',
    waitTime: '20-25 min',
    ordersInProgress: 3
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención del estado del restaurante
    const fetchStatus = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Lógica de estado según hora y día
      let newStatus: RestaurantStatus;
      
      if (day === 1) { // Lunes cerrado
        newStatus = {
          status: 'unavailable',
          message: 'Cerrado los lunes',
          waitTime: undefined,
          ordersInProgress: 0
        };
      } else if (hour < 12 || hour >= 23) { // Fuera de horario
        newStatus = {
          status: 'unavailable',
          message: 'Fuera de horario',
          waitTime: undefined,
          ordersInProgress: 0
        };
      } else if (hour >= 20 || hour <= 14) { // Horas pico
        newStatus = {
          status: 'busy',
          message: 'Alta demanda',
          waitTime: '35-45 min',
          ordersInProgress: 8
        };
      } else { // Horario normal
        newStatus = {
          status: 'fluid',
          message: 'Funcionando con normalidad',
          waitTime: '20-25 min',
          ordersInProgress: 3
        };
      }
      
      setStatus(newStatus);
      setLoading(false);
    };

    fetchStatus();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'fluid':
        return {
          icon: '🟢',
          color: 'text-green-600 bg-green-50 border-green-200',
          textColor: 'text-green-800',
          bgColor: 'bg-green-100'
        };
      case 'busy':
        return {
          icon: '🟡',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          bgColor: 'bg-yellow-100'
        };
      case 'unavailable':
        return {
          icon: '🔴',
          color: 'text-red-600 bg-red-50 border-red-200',
          textColor: 'text-red-800',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: '⚪',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          bgColor: 'bg-gray-100'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const config = getStatusConfig(status.status);

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border ${config.color}`}>
      {/* Icono Principal */}
      <span className="text-2xl animate-pulse">{config.icon}</span>
      
      {/* Mensaje de Estado */}
      <div className="flex flex-col">
        <span className={`font-semibold ${config.textColor}`}>
          {status.message}
        </span>
        
        {/* Información Adicional */}
        <div className="flex items-center gap-4 text-xs">
          {status.waitTime && (
            <span className={config.textColor}>
              ⏱️ {status.waitTime}
            </span>
          )}
          
          {status.ordersInProgress !== undefined && status.ordersInProgress > 0 && (
            <span className={config.textColor}>
              📋 {status.ordersInProgress} pedidos
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
