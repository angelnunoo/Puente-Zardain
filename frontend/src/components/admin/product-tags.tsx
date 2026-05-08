'use client';

import React, { useState, useEffect } from 'react';

interface ProductTag {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export default function ProductTags() {
  const [tags, setTags] = useState<ProductTag[]>([
    { id: '1', name: 'Nuevo', icon: '🆕', color: 'bg-green-100 text-green-800', enabled: true },
    { id: '2', name: 'Popular', icon: '🔥', color: 'bg-red-100 text-red-800', enabled: true },
    { id: '3', name: 'Vegetariano', icon: '🌱', color: 'bg-green-100 text-green-800', enabled: false },
    { id: '4', name: 'Destacado', icon: '⭐', color: 'bg-yellow-100 text-yellow-800', enabled: false },
    { id: '5', name: 'Picante', icon: '🌶️', color: 'bg-orange-100 text-orange-800', enabled: false },
    { id: '6', name: 'Sin Gluten', icon: '🌾', color: 'bg-blue-100 text-blue-800', enabled: false },
  ]);

  useEffect(() => {
    // Cargar etiquetas desde la API
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/admin/product-tags');
        if (response.ok) {
          const data = await response.json();
          setTags(data);
        }
      } catch (error) {
        console.error('Error loading product tags:', error);
      }
    };

    fetchTags();
  }, []);

  const handleToggle = async (tagId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/product-tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagId, enabled }),
      });

      if (response.ok) {
        setTags(prev => 
          prev.map(tag => 
            tag.id === tagId ? { ...tag, enabled } : tag
          )
        );
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Etiquetas de Productos
        </h3>
        <p className="text-sm text-gray-600">
          Activa o desactiva etiquetas para mostrar en los productos
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tags.map(tag => (
          <div 
            key={tag.id}
            className={`border rounded-lg p-4 transition-all ${
              tag.enabled 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tag.icon}</span>
                <span className="font-medium text-gray-900">{tag.name}</span>
              </div>
              
              <button
                onClick={() => handleToggle(tag.id, !tag.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tag.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tag.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                  {tag.icon} {tag.name}
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                {tag.enabled ? 'Visible para clientes' : 'Oculto para clientes'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">💡</span>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Cómo funcionan las etiquetas:</p>
            <ul className="space-y-1 text-xs">
              <li>• Activa las etiquetas que quieras mostrar</li>
              <li>• Asigna etiquetas a productos desde el editor de carta</li>
              <li>• Los clientes verán las etiquetas activas</li>
              <li>• Las etiquetas ayudan a destacar productos especiales</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {tags.filter(t => t.enabled).length} de {tags.length} etiquetas activas
        </div>
        
        <button className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 text-sm">
          Ver Productos con Etiquetas
        </button>
      </div>
    </div>
  );
}
