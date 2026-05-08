'use client';

import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../lib/api';

interface BannerData {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  enabled: boolean;
}

export default function StatusBannerFixed() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de notificationsApi
        const data = await notificationsApi.getBanner();
        
        if (data && data.enabled && data.message?.trim() !== '') {
          setBanner(data);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error fetching banner:', error);
        setError('No se puede cargar el mensaje del restaurante');
        setIsVisible(false);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchBanner, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-100 py-2 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 text-sm">Cargando mensaje...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-orange-50 border-b border-orange-200 py-2 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-orange-600 text-sm">⚠️ {error}</span>
            <button 
              onClick={() => window.location.reload()}
              className="text-orange-700 underline text-sm hover:text-orange-800"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isVisible || !banner) {
    return null;
  }

  const getBannerStyles = () => {
    switch (banner.type) {
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-orange-600 text-white';
      case 'success':
        return 'bg-green-600 text-white';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getIcon = () => {
    switch (banner.type) {
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4v4m0 0v6a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2h-4a2 2 0 00-2 2v6z" />
          </svg>
        );
    }
  };

  return (
    <div className={`${getBannerStyles()} py-3 px-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl">{getIcon()}</span>
          <div className="flex-1">
            <p className="font-medium text-center">{banner.message}</p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white transition-colors p-1 rounded"
            title="Cerrar mensaje"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
