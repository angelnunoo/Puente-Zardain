'use client';

import React, { useState, useEffect } from 'react';

interface PopularItem {
  id: string;
  name: string;
  price: number;
  image: string;
  ordersCount: number;
}

export default function PopularItems() {
  const [items, setItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular obtención de productos populares
    const fetchPopularItems = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockItems: PopularItem[] = [
        {
          id: '1',
          name: 'Hamburguesa Clásica',
          price: 12.50,
          image: '/images/burger-classic.jpg',
          ordersCount: 156
        },
        {
          id: '2',
          name: 'Pizza Margarita',
          price: 10.90,
          image: '/images/pizza-margarita.jpg',
          ordersCount: 142
        },
        {
          id: '3',
          name: 'Ensalada César',
          price: 8.75,
          image: '/images/salad-caesar.jpg',
          ordersCount: 98
        },
        {
          id: '4',
          name: 'Patatas Fritas',
          price: 4.50,
          image: '/images/fries.jpg',
          ordersCount: 87
        }
      ];
      
      setItems(mockItems);
      setLoading(false);
    };

    fetchPopularItems();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchPopularItems, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <h2 className="text-xl font-bold mb-4">Lo que más se pide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <h2 className="text-xl font-bold text-gray-900">Lo que más se pide</h2>
        <span className="text-sm text-gray-500">Actualizado ahora</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div key={item.id} className="group cursor-pointer">
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-24 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform"
              />
              {index === 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  🔥
                </div>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
              {item.name}
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">
                {item.price.toFixed(2)}€
              </span>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{item.ordersCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          Ver menú completo →
        </button>
      </div>
    </div>
  );
}
