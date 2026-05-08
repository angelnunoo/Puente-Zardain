'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { zardasApi } from '../../lib/api';

interface ZardasData {
  current: number;
  totalEarned: number;
  currentLeague: string;
  nextLeague: string;
  zardasToNextLeague: number;
  currentReward: {
    id: string;
    name: string;
    description: string;
    zardasNeeded: number;
    isAvailable: boolean;
  };
  recentActivity: Array<{
    id: string;
    description: string;
    zardas: number;
    date: string;
  }>;
}

export default function ZardasLoyaltyFixed() {
  const { token } = useAuth();
  const [zardas, setZardas] = useState<ZardasData>({
    current: 0,
    totalEarned: 0,
    currentLeague: 'Bronce',
    nextLeague: 'Plata',
    zardasToNextLeague: 100,
    currentReward: {
      id: '',
      name: '',
      description: '',
      zardasNeeded: 0,
      isAvailable: false
    },
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZardasData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de zardasApi
        const data = await zardasApi.getLoyaltyData(token);
        
        if (data) {
          setZardas(data);
        } else {
          throw new Error('No se pudieron obtener los datos de Zardas');
        }
      } catch (error) {
        console.error('Error fetching Zardas data:', error);
        setError('No se puede cargar la información de lealtad');
        
        // Lógica fallback solo si falla la API
        const mockData: ZardasData = {
          current: 150,
          totalEarned: 750,
          currentLeague: 'Bronce',
          nextLeague: 'Plata',
          zardasToNextLeague: 50,
          currentReward: {
            id: 'reward-1',
            name: 'Patatas Fritas Gratis',
            description: 'Canjea patatas fritas gratis',
            zardasNeeded: 200,
            isAvailable: false
          },
          recentActivity: [
            {
              id: 'activity-1',
              description: 'Pedido #1234 completado',
              zardas: 25,
              date: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: 'activity-2',
              description: 'Registro en el programa',
              zardas: 50,
              date: new Date(Date.now() - 604800000).toISOString()
            }
          ]
        };
        
        setZardas(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchZardasData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchZardasData, 300000);
    return () => clearInterval(interval);
  }, [token]);

  const getLeagueColor = (league: string) => {
    switch (league) {
      case 'Bronce': return 'text-amber-600 bg-amber-50';
      case 'Plata': return 'text-gray-600 bg-gray-50';
      case 'Oro': return 'text-yellow-600 bg-yellow-50';
      case 'Diamante': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = () => {
    const totalForNextLeague = zardas.current + zardas.zardasToNextLeague;
    return (zardas.current / totalForNextLeague) * 100;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Cargando programa de lealtad...</span>
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Programa Zardas</h3>
        <p className="text-sm text-gray-600">Acumula puntos y obtén recompensas exclusivas</p>
      </div>

      {/* Estado actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">{zardas.current}</div>
          <p className="text-sm text-gray-600 mt-1">Zardas actuales</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{zardas.totalEarned}</div>
          <p className="text-sm text-gray-600 mt-1">Totales ganados</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className={`text-lg font-semibold ${getLeagueColor(zardas.currentLeague).split(' ')[0]}`}>
            {zardas.currentLeague}
          </div>
          <p className="text-sm text-gray-600 mt-1">Liga actual</p>
        </div>
      </div>

      {/* Progreso a siguiente liga */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso a {zardas.nextLeague}
          </span>
          <span className="text-sm text-gray-500">
            {zardas.zardasToNextLeague} Zardas restantes
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Recompensa actual */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800">Próxima Recompensa</h4>
          {zardas.currentReward.isAvailable && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Disponible
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-800">{zardas.currentReward.name}</p>
            <p className="text-sm text-gray-600">{zardas.currentReward.description}</p>
            <p className="text-sm font-medium text-purple-600 mt-1">
              {zardas.currentReward.zardasNeeded} Zardas necesarios
            </p>
          </div>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              zardas.currentReward.isAvailable
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!zardas.currentReward.isAvailable}
          >
            {zardas.currentReward.isAvailable ? 'Canjear' : 'No disponible'}
          </button>
        </div>
      </div>

      {/* Actividad reciente */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Actividad Reciente</h4>
        <div className="space-y-2">
          {zardas.recentActivity.slice(0, 3).map((activity) => (
            <div 
              key={activity.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className={`text-sm font-semibold ${
                activity.zardas > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {activity.zardas > 0 ? '+' : ''}{activity.zardas} Zardas
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button 
          onClick={() => window.location.href = '/rewards'}
          className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-6 py-3 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <span>Ver todas las recompensas</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
