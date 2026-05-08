'use client';

import React, { useState, useEffect } from 'react';

interface ProductStock {
  id: string;
  name: string;
  category: string;
  stock: 'available' | 'low' | 'out';
  stockCount?: number;
  price: number;
  image: string;
  autoManage: boolean;
  lastUpdated: string;
  maxStock: number;
}

export default function StockIndicators() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');

  useEffect(() => {
    // Simular obtención de productos con stock
    const fetchStockData = async () => {
      setLoading(true);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProducts: ProductStock[] = [
        {
          id: '1',
          name: 'Hamburguesa Clásica',
          category: 'Hamburguesas',
          stock: 'available',
          stockCount: 25,
          price: 12.50,
          image: '/images/burger-classic.jpg',
          autoManage: true,
          lastUpdated: '2024-01-15 14:30',
          maxStock: 50
        },
        {
          id: '2',
          name: 'Pizza Margarita',
          category: 'Pizzas',
          stock: 'low',
          stockCount: 3,
          price: 10.90,
          image: '/images/pizza-margarita.jpg',
          autoManage: true,
          lastUpdated: '2024-01-15 14:30',
          maxStock: 30
        },
        {
          id: '3',
          name: 'Ensalada César',
          category: 'Ensaladas',
          stock: 'out',
          stockCount: 0,
          price: 8.75,
          image: '/images/salad-caesar.jpg',
          autoManage: false,
          lastUpdated: '2024-01-15 14:30',
          maxStock: 20
        },
        {
          id: '4',
          name: 'Patatas Fritas',
          category: 'Acompañamientos',
          stock: 'available',
          stockCount: 50,
          price: 4.50,
          image: '/images/fries.jpg',
          autoManage: true,
          lastUpdated: '2024-01-15 14:30',
          maxStock: 60
        },
        {
          id: '5',
          name: 'Hamburguesa Especial',
          category: 'Hamburguesas',
          stock: 'low',
          stockCount: 5,
          price: 14.50,
          image: '/images/burger-special.jpg',
          autoManage: true,
          lastUpdated: '2024-01-15 14:30',
          maxStock: 25
        },
        {
          id: '6',
          name: 'Refresco Cola',
          category: 'Bebidas',
          stock: 'available',
          stockCount: 100,
          price: 2.50,
          image: '/images/cola.jpg',
          autoManage: true,
          lastUpdated: '2024-01-15 14:30',
          maxStock: 150
        }
      ];
      
      setProducts(mockProducts);
      setLoading(false);
    };

    fetchStockData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchStockData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getStockConfig = (stock: string) => {
    switch (stock) {
      case 'available':
        return {
          icon: '✅',
          color: 'text-green-600 bg-green-50 border-green-200',
          badgeColor: 'bg-green-100 text-green-800',
          text: 'Disponible'
        };
      case 'low':
        return {
          icon: '⚠️',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          text: 'Poco stock'
        };
      case 'out':
        return {
          icon: '❌',
          color: 'text-red-600 bg-red-50 border-red-200',
          badgeColor: 'bg-red-100 text-red-800',
          text: 'Agotado'
        };
      default:
        return {
          icon: '❓',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          badgeColor: 'bg-gray-100 text-gray-800',
          text: 'Desconocido'
        };
    }
  };

  const handleStockUpdate = async (productId: string, newStock: 'available' | 'low' | 'out') => {
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, stock: newStock }),
      });

      if (response.ok) {
        setProducts(prev => 
          prev.map(product => 
            product.id === productId 
              ? { 
                  ...product, 
                  stock: newStock,
                  stockCount: newStock === 'out' ? 0 : newStock === 'low' ? 5 : 20
                }
              : product
          )
        );
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.stock === filter);

  const stockCounts = {
    available: products.filter(p => p.stock === 'available').length,
    low: products.filter(p => p.stock === 'low').length,
    out: products.filter(p => p.stock === 'out').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <h2 className="text-xl font-bold mb-4">Control de Stock</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* Título y Resumen */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Control de Stock</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Actualizado ahora</span>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stockCounts.available}
              </div>
              <div className="text-sm text-green-700">Disponibles</div>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>
        
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {stockCounts.low}
              </div>
              <div className="text-sm text-yellow-700">Poco stock</div>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </div>
        
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {stockCounts.out}
              </div>
              <div className="text-sm text-red-700">Agotados</div>
            </div>
            <span className="text-3xl">❌</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({products.length})
        </button>
        
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'available' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Disponibles ({stockCounts.available})
        </button>
        
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'low' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Poco stock ({stockCounts.low})
        </button>
        
        <button
          onClick={() => setFilter('out')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'out' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Agotados ({stockCounts.out})
        </button>
      </div>

      {/* Lista de Productos */}
      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const config = getStockConfig(product.stock);
          
          return (
            <div 
              key={product.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${config.color}`}
            >
              <div className="flex items-center justify-between">
                {/* Información del Producto */}
                <div className="flex items-center gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{product.category}</span>
                      <span>•</span>
                      <span>{product.price.toFixed(2)}€</span>
                      {product.stockCount !== undefined && (
                        <>
                          <span>•</span>
                          <span>Stock: {product.stockCount} unidades</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estado y Acciones */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
                    {config.icon} {config.text}
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStockUpdate(product.id, 'available')}
                      className={`px-2 py-1 text-xs rounded ${
                        product.stock === 'available'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                      title="Marcar como disponible"
                    >
                      ✅
                    </button>
                    
                    <button
                      onClick={() => handleStockUpdate(product.id, 'low')}
                      className={`px-2 py-1 text-xs rounded ${
                        product.stock === 'low'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                      }`}
                      title="Marcar como poco stock"
                    >
                      ⚠️
                    </button>
                    
                    <button
                      onClick={() => handleStockUpdate(product.id, 'out')}
                      className={`px-2 py-1 text-xs rounded ${
                        product.stock === 'out'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                      title="Marcar como agotado"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información Adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">💡</span>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Gestión de stock:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Disponible:</strong> Producto con stock normal</li>
              <li>• <strong>Poco stock:</strong> Producto con stock bajo, considerar reponer</li>
              <li>• <strong>Agotado:</strong> Producto sin stock, no visible para clientes</li>
              <li>• Los productos agotados no aparecen en la carta pública</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
