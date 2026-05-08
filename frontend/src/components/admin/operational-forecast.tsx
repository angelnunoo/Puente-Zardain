'use client';

import React, { useState, useEffect } from 'react';

interface WeekPattern {
  day: string;
  avgOrders: number;
  avgRevenue: number;
  peakHours: string[];
  trends: 'increasing' | 'stable' | 'decreasing';
}

interface ProblematicProduct {
  id: string;
  name: string;
  issues: Array<{
    type: 'stock' | 'preparation_time' | 'complaints' | 'waste';
    description: string;
    severity: 'low' | 'medium' | 'high';
    frequency: string;
  }>;
  suggestion: string;
}

interface DayForecast {
  day: string;
  expectedOrders: number;
  expectedRevenue: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

export default function OperationalForecast() {
  const [patterns, setPatterns] = useState<WeekPattern[]>([]);
  const [problematicProducts, setProblematicProducts] = useState<ProblematicProduct[]>([]);
  const [forecast, setForecast] = useState<DayForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención de datos de previsión operativa desde backend
    const fetchOperationalForecast = async () => {
      try {
        const response = await fetch('/api/admin/operational-forecast');
        if (response.ok) {
          const data = await response.json();
          setPatterns(data.patterns);
          setProblematicProducts(data.problematicProducts);
          setForecast(data.forecast);
        } else {
          // Fallback con datos simulados
          const mockPatterns: WeekPattern[] = [
            {
              day: 'Lunes',
              avgOrders: 25,
              avgRevenue: 300,
              peakHours: ['13:00-14:30', '20:00-21:30'],
              trends: 'increasing'
            },
            {
              day: 'Martes',
              avgOrders: 30,
              avgRevenue: 360,
              peakHours: ['13:00-14:30', '20:00-21:30'],
              trends: 'stable'
            },
            {
              day: 'Miércoles',
              avgOrders: 35,
              avgRevenue: 420,
              peakHours: ['13:00-14:30', '20:00-21:30'],
              trends: 'increasing'
            },
            {
              day: 'Jueves',
              avgOrders: 40,
              avgRevenue: 480,
              peakHours: ['13:00-14:30', '20:00-21:30'],
              trends: 'stable'
            },
            {
              day: 'Viernes',
              avgOrders: 55,
              avgRevenue: 660,
              peakHours: ['13:00-14:30', '20:00-22:00'],
              trends: 'increasing'
            },
            {
              day: 'Sábado',
              avgOrders: 50,
              avgRevenue: 600,
              peakHours: ['14:00-16:00', '20:00-22:00'],
              trends: 'stable'
            },
            {
              day: 'Domingo',
              avgOrders: 35,
              avgRevenue: 420,
              peakHours: ['14:00-16:00', '20:00-21:00'],
              trends: 'decreasing'
            }
          ];

          const mockProblematicProducts: ProblematicProduct[] = [
            {
              id: '1',
              name: 'Hamburguesa clásica',
              issues: [
                {
                  type: 'stock',
                  description: 'Se agota frecuentemente los viernes',
                  severity: 'high',
                  frequency: 'Semanal'
                },
                {
                  type: 'preparation_time',
                  description: 'Tarda más de lo esperado en horas punta',
                  severity: 'medium',
                  frequency: 'Diario'
                }
              ],
              suggestion: 'Aumentar stock un 30% los viernes y preparar bases con anticipación'
            },
            {
              id: '2',
              name: 'Patatas fritas',
              issues: [
                {
                  type: 'waste',
                  description: 'Alto desperdicio al final del día',
                  severity: 'medium',
                  frequency: 'Diario'
                }
              ],
              suggestion: 'Reducir preparación en lotes pequeños según demanda'
            },
            {
              id: '3',
              name: 'Ensalada César',
              issues: [
                {
                  type: 'complaints',
                  description: 'Quejas sobre lechuga no fresca',
                  severity: 'high',
                  frequency: 'Ocasional'
                }
              ],
              suggestion: 'Revisar proveedor y preparar solo bajo pedido'
            }
          ];

          const today = new Date();
          const dayOfWeek = today.getDay();
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const todayName = dayNames[dayOfWeek];
          const todayPattern = mockPatterns.find(p => p.day === todayName);
          
          const mockForecast: DayForecast = {
            day: todayName,
            expectedOrders: todayPattern ? todayPattern.avgOrders + Math.floor(Math.random() * 10) - 5 : 30,
            expectedRevenue: todayPattern ? todayPattern.avgRevenue + Math.floor(Math.random() * 50) - 25 : 360,
            confidence: 75,
            factors: [
              'Es ' + todayName.toLowerCase(),
              todayPattern ? (todayPattern.trends === 'increasing' ? 'Tendencia al alza' : 'Tendencia estable') : 'Día normal',
              'Clima favorable',
              'Sin eventos especiales'
            ],
            recommendations: [
              'Preparar extra de productos populares',
              'Tener personal completo en horas punta',
              'Revisar stock antes del mediodía'
            ]
          };

          setPatterns(mockPatterns);
          setProblematicProducts(mockProblematicProducts);
          setForecast(mockForecast);
        }
      } catch (error) {
        console.error('Error fetching operational forecast:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOperationalForecast();
    
    // Actualizar cada hora
    const interval = setInterval(fetchOperationalForecast, 3600000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '📊';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return '📦';
      case 'preparation_time':
        return '⏱️';
      case 'complaints':
        return '⚠️';
      case 'waste':
        return '🗑️';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-6xl mb-4">🔮</div>
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Previsión Operativa 🔮
          </h1>
          <p className="text-xl text-gray-600">
            Patrones, problemas y sugerencias para hoy
          </p>
        </div>

        {/* Previsión del Día */}
        {forecast && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Previsión para {forecast.day}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Confianza:</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{forecast.confidence}%</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{forecast.expectedOrders}</p>
                <p className="text-sm text-gray-600">Pedidos esperados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{forecast.expectedRevenue}€</p>
                <p className="text-sm text-gray-600">Ingresos estimados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(forecast.expectedRevenue / forecast.expectedOrders)}€
                </p>
                <p className="text-sm text-gray-600">Ticket medio</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Factores considerados</h3>
                <ul className="space-y-2">
                  {forecast.factors.map((factor, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sugerencias para hoy</h3>
                <ul className="space-y-2">
                  {forecast.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-blue-500">💡</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Patrones Semanales */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Patrones Semanales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Día</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Pedidos</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Ingresos</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Horas punta</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{pattern.day}</td>
                    <td className="text-center py-3 px-4 text-gray-700">{pattern.avgOrders}</td>
                    <td className="text-center py-3 px-4 text-gray-700">{pattern.avgRevenue}€</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {pattern.peakHours.map((hour, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {hour}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-2xl">{getTrendIcon(pattern.trends)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos Problemáticos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Productos que Requieren Atención
          </h2>
          <div className="grid md:grid-cols-1 gap-6">
            {problematicProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    Requiere acción
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Problemas detectados</h4>
                    <div className="space-y-2">
                      {product.issues.map((issue, index) => (
                        <div key={index} className={`border ${getSeverityColor(issue.severity)} rounded-lg p-3`}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{getIssueIcon(issue.type)}</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">{issue.description}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="opacity-75">Frecuencia: {issue.frequency}</span>
                                <span className={`px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                                  {issue.severity === 'high' ? 'Alto' : 
                                   issue.severity === 'medium' ? 'Medio' : 'Bajo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sugerencia</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <p className="text-green-800 text-sm leading-relaxed">{product.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje Final */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            🔮 Usa esta información para prepararte mejor y ofrecer el mejor servicio
          </p>
        </div>
      </div>
    </div>
  );
}
