'use client';

import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../lib/api';

interface PopularProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  ordersCount: number;
  category: string;
  tags?: string[];
  available: boolean;
}

export default function PopularProductsFixed() {
  const [products, setProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Conexión REAL con backend a través de analyticsApi
        const data = await analyticsApi.getPopularProducts();
        
        if (data && Array.isArray(data)) {
          setProducts(data.slice(0, 5)); // Máximo 5 productos
        } else {
          throw new Error('No se pudieron obtener los productos populares');
        }
      } catch (error) {
        console.error('Error fetching popular products:', error);
        setError('No se puede cargar los productos populares');
        
        // Lógica fallback solo si falla la API
        const mockProducts: PopularProduct[] = [
          {
            id: '1',
            name: 'Hamburguesa Clásica',
            price: 12.50,
            image: '/images/burger-classic.jpg',
            ordersCount: 245,
            category: 'Hamburguesas',
            tags: ['popular', 'clasico'],
            available: true
          },
          {
            id: '2',
            name: 'Patatas Fritas',
            price: 4.50,
            image: '/images/fries.jpg',
            ordersCount: 189,
            category: 'Acompañamientos',
            tags: ['popular'],
            available: true
          },
          {
            id: '3',
            name: 'Hamburguesa con Queso',
            price: 13.50,
            image: '/images/burger-cheese.jpg',
            ordersCount: 167,
            category: 'Hamburguesas',
            tags: ['popular'],
            available: true
          }
        ];
        
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchPopularProducts, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Cargando productos populares...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
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

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <span className="text-4xl">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4v6a2 2 0 002 2h4a2 2 0 002-2V9a2 2 0 00-2-2h-4a2 2 0 00-2 2v6z" />
              </svg>
            </span>
          <p className="text-gray-600 mt-2">No hay productos populares disponibles</p>
          <p className="text-sm text-gray-500">Vuelve a revisar más tarde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Productos Populares</h3>
        <p className="text-sm text-gray-600">Los más pedidos por nuestros clientes</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <div 
            key={product.id}
            className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {/* Badge de popularidad */}
            {product.tags?.includes('popular') && (
              <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                🔥 Popular
              </div>
            )}
            
            {/* Badge de nuevo */}
            {product.tags?.includes('nuevo') && (
              <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ✨ Nuevo
              </div>
            )}
            
            {/* Imagen del producto */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200/f3f4f6/6b7280?text=Producto';
                }}
              />
              
              {/* Overlay de disponibilidad */}
              {!product.available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-medium">No disponible</span>
                </div>
              )}
            </div>
            
            {/* Información del producto */}
            <div className="p-3">
              <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-1">
                {product.name}
              </h4>
              <p className="text-xs text-gray-500 mb-2">
                {product.category}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  €{product.price.toFixed(2)}
                </span>
                
                {/* Indicador de popularidad */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {product.ordersCount} pedidos
                  </span>
                  <span className="text-orange-500 text-sm">⭐</span>
                </div>
              </div>
            </div>
            
            {/* Botón de acción rápido */}
            <div className="px-3 pb-3">
              <button
                className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  product.available
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!product.available}
                onClick={() => {
                  if (product.available) {
                    // Aquí se podría añadir al carrito
                    console.log('Añadir al carrito:', product.id);
                  }
                }}
              >
                {product.available ? 'Añadir al carrito' : 'No disponible'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button 
          onClick={() => window.location.href = '/menu'}
          className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span>Ver todos los productos</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
