'use client';

import React, { useState, useEffect } from 'react';
import { productsApi } from '../../lib/api';
import { ProductResponseDto } from '../../../../shared/dtos';
import { useAuth } from '../../context/AuthContext';

export default function MenuSectionFixed() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      
      try {
        const [productsData, categoriesData] = await Promise.all([
          productsApi.getAll(token, true), // solo productos activos
          productsApi.getCategories(token)
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [token]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedProducts = filteredProducts.reduce((acc: Record<string, ProductResponseDto[]>, product: ProductResponseDto) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, ProductResponseDto[]>);

  const addToCart = async (product: ProductResponseDto) => {
    try {
      if (!token) {
        alert('Debes iniciar sesión para hacer pedidos');
        return;
      }

      const customizations = prompt('¿Alguna personalización? (ej: sin cebolla, extra queso)', '') || '';

      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cartItems.find((item: any) => item.productId === product.id && item.customizations === customizations);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          customizations
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cartItems));
      
      // Actualizar el contador del carrito si existe
      const cartEvent = new CustomEvent('cartUpdated', { detail: { count: cartItems.length } });
      window.dispatchEvent(cartEvent);
      
      alert(`${product.name} añadido al carrito`);
    } catch (err: any) {
      alert('Error al añadir al carrito');
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            La carta completa
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Solo mostramos lo que tenemos ahora mismo
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8">
          <div className="space-y-6">
            {/* Búsqueda mejorada */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar en nuestra carta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg placeholder-gray-500 shadow-sm"
              />
            </div>

            {/* Categorías mejoradas */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Categorías</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    selectedCategory === 'todos'
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  Todos
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {products.length}
                  </span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      selectedCategory === category.name
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {category.name}
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando carta...</p>
          </div>
        ) : (
          <div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No encontramos platos</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? `No hay resultados para "${searchTerm}". Intenta con otros términos.`
                    : 'No hay platos en esta categoría. Prueba con otras categorías.'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('todos');
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Ver todos los platos
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <div key={category}>
                    <h3 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                      <span>{category}</span>
                      <span className="ml-3 text-lg font-normal text-gray-500">
                        ({categoryProducts.length} platos)
                      </span>
                    </h3>
                    
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                          <div className="relative">
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-48 object-cover rounded-t-xl"
                              />
                            )}
                            
                            {/* Badge de stock */}
                            {product.stock <= 5 && (
                              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                                ⚠️ Últimas {product.stock} unidades
                              </div>
                            )}
                            
                            {/* Badge de activo/inactivo */}
                            {!product.active && (
                              <div className="absolute top-3 left-3 bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                                No disponible
                              </div>
                            )}
                          </div>
                          
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-xl font-semibold text-gray-900">{product.name}</h4>
                              <span className="text-2xl font-bold text-green-600">€{product.price.toFixed(2)}</span>
                            </div>
                            
                            {product.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            
                            {/* Ingredientes alérgenos */}
                            {product.ingredients && product.ingredients.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Puede contener:</p>
                                <div className="flex flex-wrap gap-1">
                                  {product.ingredients.map((ingredient) => (
                                    <span 
                                      key={ingredient.id}
                                      className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded"
                                    >
                                      {ingredient.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Stock info */}
                            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                              <span>
                                Stock: <span className={`font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                  {product.stock} unidades
                                </span>
                              </span>
                              <span className={`px-3 py-1 rounded text-xs font-medium ${
                                product.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.active ? 'Disponible' : 'No disponible'}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => addToCart(product)}
                              disabled={!product.active || product.stock === 0}
                              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                                !product.active || product.stock === 0
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {!product.active || product.stock === 0 ? (
                                <span>No disponible</span>
                              ) : (
                                <span>Añadir al carrito 🛒</span>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
