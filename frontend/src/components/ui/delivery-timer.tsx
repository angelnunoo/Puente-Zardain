'use client';

import React, { useState, useEffect } from 'react';

interface DeliveryTimerProps {
  className?: string;
}

export default function DeliveryTimer({ className = '' }: DeliveryTimerProps) {
  const [estimatedTime, setEstimatedTime] = useState('50-60 min');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  const getDisplayTime = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    // Ajustar tiempo según hora del día
    if (hour >= 14 && hour <= 16) {
      return '45-55 min'; // Hora pico, más rápido
    } else if (hour >= 20 || hour <= 1) {
      return '60-75 min'; // Noche, más lento
    }
    
    return estimatedTime;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium text-gray-700">
        Tiempo estimado: <span className="font-bold text-blue-600">{getDisplayTime()}</span>
      </span>
    </div>
  );
}
