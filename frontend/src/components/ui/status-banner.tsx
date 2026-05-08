'use client';

import React, { useState, useEffect } from 'react';

interface StatusBannerProps {
  className?: string;
}

export default function StatusBanner({ className = '' }: StatusBannerProps) {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [type, setType] = useState<'info' | 'warning' | 'error'>('info');

  useEffect(() => {
    // Simular obtención de mensajes desde el admin
    const fetchStatusMessage = async () => {
      // Simular API call
      const response = await fetch('/api/status-banner');
      const data = response.ok ? await response.json() : {
        message: 'Cocina con algo de espera',
        type: 'warning',
        enabled: true
      };

      if (data.enabled && data.message) {
        setMessage(data.message);
        setType(data.type || 'info');
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    fetchStatusMessage();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchStatusMessage, 120000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return null;
  }

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`border-l-4 p-4 mb-4 ${getStyles()} ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
