'use client';

import React, { useState, useEffect } from 'react';

interface OrderCard {
  id: string;
  date: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  zardasEarned: number;
  estimatedTime?: string;
}

export default function OrderHistoryCards() {
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención del historial de pedidos
    const fetchOrderHistory = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOrders: OrderCard[] = [
        {
          id: '1',
          date: '2024-01-14',
          status: 'completed',
          totalAmount: 25.90,
          items: [
            { name: 'Hamburguesa Clásica', quantity: 1, price: 12.50 },
            { name: 'Patatas Fritas', quantity: 1, price: 4.50 },
            { name: 'Refresco', quantity: 1, price: 2.50 }
          ],
          zardasEarned: 26
        },
        {
          id: '2',
          date: '2024-01-12',
          status: 'completed',
          totalAmount: 18.40,
          items: [
            { name: 'Pizza Margarita', quantity: 1, price: 10.90 },
            { name: 'Ensalada César', quantity: 1, price: 8.75 }
          ],
          zardasEarned: 18
        },
        {
          id: '3',
          date: '2024-01-10',
          status: 'completed',
          totalAmount: 32.25,
          items: [
            { name: 'Hamburguesa Especial', quantity: 2, price: 14.50 },
            { name: 'Nuggets', quantity: 1, price: 6.50 }
          ],
          zardasEarned: 32
        }
      ];
      
      setOrders(mockOrders);
      setLoading(false);
    };

    fetchOrderHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '✅';
      case 'completed':
        return '🎉';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const handleRepeatOrder = async (orderId: string) => {
    // Simular repetición de pedido
    console.log('Repeating order:', orderId);
    // Aquí se añadirían los productos al carrito
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <h2 className="text-xl font-bold mb-4">Mis Pedidos</h2>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-48 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mis Pedidos</h2>
        <span className="text-sm text-gray-500">
          {orders.length} pedidos totales
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-gray-600 mb-4">Aún no tienes pedidos</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Hacer mi primer pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Cabecera del Pedido */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {getStatusText(order.status)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(order.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {order.totalAmount.toFixed(2)}€
                  </div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <span>⭐</span>
                    <span>+{order.zardasEarned} Zardas</span>
                  </div>
                </div>
              </div>

              {/* Items del Pedido */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2">Artículos:</div>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-600">
                        {(item.price * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Pedido #{order.id}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRepeatOrder(order.id)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 text-sm font-medium"
                  >
                    🔄 Repetir pedido
                  </button>
                  
                  <button className="px-3 py-1 text-gray-600 hover:text-gray-700 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                    📄 Ver detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen de Zardas */}
      {orders.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-semibold text-green-800">
                  Total de Zardas ganadas
                </div>
                <div className="text-sm text-green-700">
                  En todos tus pedidos
                </div>
              </div>
            </div>
            
            <div className="text-2xl font-bold text-green-800">
              {orders.reduce((total, order) => total + order.zardasEarned, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
