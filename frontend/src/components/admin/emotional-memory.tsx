'use client';

import React, { useState, useEffect } from 'react';

interface CustomerMemory {
  id: string;
  customerId: string;
  customerName: string;
  frequency: 'habitual' | 'ocasional' | 'nuevo';
  lastOrder: string;
  preferences: {
    favoriteProducts: string[];
    commonOrder: string;
    specialRequests: string[];
    notes: string;
  };
  emotionalData: {
    totalOrders: number;
    totalSpent: number;
    zardasEarned: number;
    firstOrderDate: string;
    daysSinceLastOrder: number;
  };
  reunionMessage: string;
}

export default function EmotionalMemory() {
  const [memories, setMemories] = useState<CustomerMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  useEffect(() => {
    // Simular obtención de datos de memoria emocional desde backend
    const fetchEmotionalMemory = async () => {
      try {
        const response = await fetch('/api/admin/emotional-memory');
        if (response.ok) {
          const data = await response.json();
          setMemories(data);
        } else {
          // Fallback con datos simulados
          const mockMemories: CustomerMemory[] = [
            {
              id: '1',
              customerId: 'cust_001',
              customerName: 'María García',
              frequency: 'habitual',
              lastOrder: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              preferences: {
                favoriteProducts: ['Hamburguesa clásica', 'Patatas fritas', 'Coca-Cola'],
                commonOrder: 'Hamburguesa clásica con patatas y refresco',
                specialRequests: ['Sin cebolla', 'Extra queso'],
                notes: 'Siempre pide lo mismo, muy puntual en sus pedidos'
              },
              emotionalData: {
                totalOrders: 47,
                totalSpent: 423,
                zardasEarned: 211,
                firstOrderDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
                daysSinceLastOrder: 2
              },
              reunionMessage: '¡Qué alegría volver a verte por aquí! 😊'
            },
            {
              id: '2',
              customerId: 'cust_002',
              customerName: 'Juan Pérez',
              frequency: 'habitual',
              lastOrder: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              preferences: {
                favoriteProducts: ['Pizza margarita', 'Ensalada César'],
                commonOrder: 'Pizza individual con ensalada',
                specialRequests: ['Poco picante', 'Extra aceite'],
                notes: 'Viene los viernes casi siempre, le gusta la comida saludable'
              },
              emotionalData: {
                totalOrders: 32,
                totalSpent: 384,
                zardasEarned: 192,
                firstOrderDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                daysSinceLastOrder: 7
              },
              reunionMessage: '¡Hola Juan! Hace una semana que no te veíamos 🍕'
            },
            {
              id: '3',
              customerId: 'cust_003',
              customerName: 'Ana López',
              frequency: 'ocasional',
              lastOrder: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              preferences: {
                favoriteProducts: ['Tacos al pastor', 'Agua de horchata'],
                commonOrder: 'Combo de tacos con bebida',
                specialRequests: ['Salsa extra', 'Sin cilantro'],
                notes: 'Viene los fines de semana, siempre con amigos'
              },
              emotionalData: {
                totalOrders: 18,
                totalSpent: 216,
                zardasEarned: 108,
                firstOrderDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                daysSinceLastOrder: 14
              },
              reunionMessage: '¡Qué gusto verte de nuevo Ana! ¿Tus amigos también? 👥'
            }
          ];
          
          setMemories(mockMemories);
        }
      } catch (error) {
        console.error('Error fetching emotional memory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmotionalMemory();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchEmotionalMemory, 300000);
    return () => clearInterval(interval);
  }, []);

  const getFrequencyConfig = (frequency: string) => {
    switch (frequency) {
      case 'habitual':
        return {
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: '⭐',
          label: 'Habitual'
        };
      case 'ocasional':
        return {
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          icon: '🌟',
          label: 'Ocasional'
        };
      case 'nuevo':
        return {
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          icon: '✨',
          label: 'Nuevo'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          icon: '📌',
          label: 'Desconocido'
        };
    }
  };

  const getReunionColor = (daysSinceLastOrder: number) => {
    if (daysSinceLastOrder <= 3) return 'text-green-600';
    if (daysSinceLastOrder <= 7) return 'text-blue-600';
    if (daysSinceLastOrder <= 14) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-6xl mb-4">💝</div>
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Memoria Emocional 💝
          </h1>
          <p className="text-xl text-gray-600">
            Conoce a tus clientes como si fueran familia
          </p>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Clientes habituales</span>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {memories.filter(m => m.frequency === 'habitual').length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Clientes esta semana</span>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {memories.filter(m => m.emotionalData.daysSinceLastOrder <= 7).length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Reencuentros pendientes</span>
              <span className="text-2xl">🔄</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {memories.filter(m => m.emotionalData.daysSinceLastOrder > 7 && m.frequency === 'habitual').length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Total Zardas</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {memories.reduce((sum, m) => sum + m.emotionalData.zardasEarned, 0)}
            </div>
          </div>
        </div>

        {/* Lista de Clientes con Memoria */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Tus clientes</h2>
            <p className="text-gray-600 mt-1">
              Conoce sus preferencias y haz que se sientan como en casa
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {memories.map((memory) => {
              const config = getFrequencyConfig(memory.frequency);
              
              return (
                <div key={memory.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-6">
                    {/* Foto y Nombre */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {memory.customerName.charAt(0)}
                      </div>
                    </div>

                    {/* Información Principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {memory.customerName}
                        </h3>
                        <span className={`${config.bgColor} ${config.borderColor} ${config.textColor} border px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                          <span>{config.icon}</span>
                          {config.label}
                        </span>
                      </div>

                      {/* Mensaje de Reencuentro */}
                      <div className={`text-lg font-medium ${getReunionColor(memory.emotionalData.daysSinceLastOrder)} mb-3`}>
                        {memory.reunionMessage}
                      </div>

                      {/* Preferencias Principales */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Lo de siempre:</p>
                          <p className="text-gray-900">{memory.preferences.commonOrder}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Último pedido:</p>
                          <p className="text-gray-900">
                            Hace {memory.emotionalData.daysSinceLastOrder} días
                          </p>
                        </div>
                      </div>

                      {/* Detalles Expandidos */}
                      {selectedMemory === memory.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Preferencias</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {memory.preferences.favoriteProducts.map((product, index) => (
                                  <li key={index}>• {product}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Pedidos especiales</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {memory.preferences.specialRequests.map((request, index) => (
                                  <li key={index}>• {request}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                              <p className="text-sm text-gray-600">{memory.preferences.notes}</p>
                            </div>
                          </div>
                          
                          {/* Estadísticas */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid md:grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{memory.emotionalData.totalOrders}</p>
                                <p className="text-sm text-gray-600">Pedidos totales</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{memory.emotionalData.totalSpent}€</p>
                                <p className="text-sm text-gray-600">Gastado</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{memory.emotionalData.zardasEarned}</p>
                                <p className="text-sm text-gray-600">Zardas ganadas</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {Math.round(memory.emotionalData.totalSpent / memory.emotionalData.totalOrders)}€
                                </p>
                                <p className="text-sm text-gray-600">Ticket medio</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botón de Acción */}
                      <button
                        onClick={() => setSelectedMemory(selectedMemory === memory.id ? null : memory.id)}
                        className="mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        {selectedMemory === memory.id ? 'Ocultar detalles' : 'Ver más detalles'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensaje Final */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            💝 Cada cliente es único. Conocer sus preferencias hace que se sientan como en casa.
          </p>
        </div>
      </div>
    </div>
  );
}
