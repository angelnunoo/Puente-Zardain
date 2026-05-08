'use client';

import React, { useState, useEffect } from 'react';

interface PanelTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardBackground: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
}

interface DailySummary {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: string;
  color: string;
}

export default function PanelIdentity() {
  const [theme, setTheme] = useState<PanelTheme>({
    primaryColor: 'bg-amber-600',
    secondaryColor: 'bg-orange-500',
    accentColor: 'bg-yellow-500',
    backgroundColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    textColor: 'text-gray-800',
    cardBackground: 'bg-white'
  });

  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención de datos del panel
    const fetchPanelData = async () => {
      try {
        const response = await fetch('/api/admin/panel-data');
        if (response.ok) {
          const data = await response.json();
          setQuickActions(data.quickActions);
          setDailySummary(data.dailySummary);
        } else {
          // Fallback con datos simulados
          const mockQuickActions: QuickAction[] = [
            {
              id: '1',
              title: 'Pedidos activos',
              description: 'Ver los pedidos que estamos preparando ahora',
              icon: '🍳',
              color: 'bg-blue-500',
              action: () => console.log('Ir a pedidos activos')
            },
            {
              id: '2',
              title: 'Nuevos clientes',
              description: 'Dar la bienvenida a los que nos han visitado hoy',
              icon: '👋',
              color: 'bg-green-500',
              action: () => console.log('Ir a nuevos clientes')
            },
            {
              id: '3',
              title: 'Inventario',
              description: 'Revisar qué nos falta y qué tenemos',
              icon: '📦',
              color: 'bg-purple-500',
              action: () => console.log('Ir a inventario')
            },
            {
              id: '4',
              title: 'Mensaje del día',
              description: 'Cambiar el mensaje para los clientes',
              icon: '✍️',
              color: 'bg-pink-500',
              action: () => console.log('Ir a mensaje del día')
            }
          ];

          const mockDailySummary: DailySummary[] = [
            {
              title: 'Pedidos hoy',
              value: 42,
              change: {
                value: '+15%',
                type: 'increase'
              },
              icon: '🛵',
              color: 'text-blue-600'
            },
            {
              title: 'Ingresos',
              value: '512€',
              change: {
                value: '+8%',
                type: 'increase'
              },
              icon: '💰',
              color: 'text-green-600'
            },
            {
              title: 'Clientes felices',
              value: 38,
              change: {
                value: '+5',
                type: 'increase'
              },
              icon: '😊',
              color: 'text-yellow-600'
            },
            {
              title: 'Tiempo espera',
              value: '18 min',
              change: {
                value: '-3 min',
                type: 'increase'
              },
              icon: '⏱️',
              color: 'text-purple-600'
            }
          ];

          setQuickActions(mockQuickActions);
          setDailySummary(mockDailySummary);
        }
      } catch (error) {
        console.error('Error fetching panel data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPanelData();

    // Actualizar tiempo cada minuto
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '¡Buenos días! ☀️';
    if (hour < 18) return '¡Buenas tardes! 🌤️';
    return '¡Buenas noches! 🌙';
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return '📈';
      case 'decrease':
        return '📉';
      default:
        return '➡️';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.backgroundColor} flex items-center justify-center`}>
        <div className="animate-pulse text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.backgroundColor} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header con estilo pizarra */}
        <div className={`${theme.cardBackground} rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden`}>
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full -mr-32 -mt-32 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {getGreeting()}
                </h1>
                <p className="text-xl text-gray-600">
                  Bienvenido a tu restaurante, hoy vamos a hacer que la gente sonría
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-600">
                  {currentTime.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Resumen del día */}
            <div className="grid md:grid-cols-4 gap-6">
              {dailySummary.map((summary, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl mb-2">{summary.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{summary.value}</div>
                  <div className="text-sm text-gray-600 mb-1">{summary.title}</div>
                  {summary.change && (
                    <div className={`text-xs font-medium ${summary.color} flex items-center justify-center gap-1`}>
                      <span>{getChangeIcon(summary.change.type)}</span>
                      <span>{summary.change.value}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`${theme.cardBackground} rounded-2xl shadow-lg p-8 text-left hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
            >
              <div className="flex items-start gap-6">
                <div className={`${action.color} text-white text-4xl p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bloque de mensaje inspirador */}
        <div className={`${theme.cardBackground} rounded-2xl shadow-xl p-8 mb-8`}>
          <div className="text-center">
            <div className="text-5xl mb-4">💝</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tu cocina, tu hogar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Cada plato que sales es una historia que contar, cada cliente una sonrisa que regalar. 
              Hoy más que nunca, tu restaurante es el lugar donde la gente se siente como en casa.
            </p>
          </div>
        </div>

        {/* Sección de consejos rápidos */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className={`${theme.cardBackground} rounded-xl shadow-lg p-6`}>
            <div className="text-3xl mb-4">💡</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Consejo del día
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Prepara las bases de las hamburguesas por la mañana para agilizar los pedidos de la hora punta.
            </p>
          </div>

          <div className={`${theme.cardBackground} rounded-xl shadow-lg p-6`}>
            <div className="text-3xl mb-4">🌟</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Lo que funciona bien
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Los clientes están encantados con las patatas extra crujientes. ¡Sigue así!
            </p>
          </div>

          <div className={`${theme.cardBackground} rounded-xl shadow-lg p-6`}>
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Meta de hoy
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Superar los 50 pedidos y mantener la satisfacción por encima del 95%.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            🍽️ Tu restaurante, tu pasión, tu éxito. Estamos contigo en cada paso.
          </p>
        </div>
      </div>
    </div>
  );
}
