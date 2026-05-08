'use client';

import React, { useState, useEffect } from 'react';

interface CustomerProfile {
  name: string;
  email: string;
  totalOrders: number;
  zardasBalance: number;
  currentLeague: string;
  nextLeague: string;
  zardasToNextLeague: number;
  lastOrderDate: string;
}

export default function CustomerProfile() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención del perfil del cliente
    const fetchProfile = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProfile: CustomerProfile = {
        name: 'María García',
        email: 'maria.garcia@email.com',
        totalOrders: 23,
        zardasBalance: 450,
        currentLeague: 'Oro',
        nextLeague: 'Platino',
        zardasToNextLeague: 50,
        lastOrderDate: '2024-01-14'
      };
      
      setProfile(mockProfile);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-36 bg-gray-200 rounded"></div>
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="text-gray-500">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const progressPercentage = ((profile.zardasBalance - profile.zardasToNextLeague) / profile.zardasBalance) * 100;

  const getLeagueColor = (league: string) => {
    switch (league) {
      case 'Bronce': return 'text-orange-600 bg-orange-100';
      case 'Plata': return 'text-gray-600 bg-gray-100';
      case 'Oro': return 'text-yellow-600 bg-yellow-100';
      case 'Platino': return 'text-purple-600 bg-purple-100';
      case 'Diamante': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Editar perfil
        </button>
      </div>

      {/* Información Principal */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {profile.name.charAt(0)}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            ¡Hola, {profile.name}!
          </h3>
          <p className="text-sm text-gray-600">{profile.email}</p>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {profile.totalOrders}
          </div>
          <div className="text-xs text-blue-700">Pedidos</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {profile.zardasBalance}
          </div>
          <div className="text-xs text-green-700">Zardas</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className={`text-lg font-bold ${getLeagueColor(profile.currentLeague).split(' ')[0]}`}>
            {profile.currentLeague}
          </div>
          <div className="text-xs text-purple-700">Liga</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">
            +{profile.zardasToNextLeague}
          </div>
          <div className="text-xs text-orange-700">Para siguiente</div>
        </div>
      </div>

      {/* Progreso de Liga */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso a {profile.nextLeague}
          </span>
          <span className="text-sm text-gray-500">
            {profile.zardasBalance - profile.zardasToNextLeague} / {profile.zardasBalance} Zardas
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          ¡Necesitas {profile.zardasToNextLeague} Zardas más para llegar a {profile.nextLeague}!
        </p>
      </div>

      {/* Último Pedido */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Último pedido</p>
            <p className="font-medium text-gray-900">
              {new Date(profile.lastOrderDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Ver historial
          </button>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
          🎯 Ver recompensas
        </button>
        <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
          ⭐ Ver tabla de clasificación
        </button>
      </div>
    </div>
  );
}
