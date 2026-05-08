'use client';

import React, { useState, useEffect } from 'react';

interface ProductTag {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  description: string;
}

export default function ProductTagsAdmin() {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simular obtención de etiquetas desde backend
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/admin/product-tags');
        if (response.ok) {
          const data = await response.json();
          setTags(data);
        } else {
          // Fallback con datos simulados
          const mockTags: ProductTag[] = [
            {
              id: 'nuevo',
              name: 'Nuevo',
              icon: '✨',
              color: 'bg-green-100 text-green-800 border-green-200',
              enabled: true,
              description: 'Productos nuevos en la carta'
            },
            {
              id: 'popular',
              name: 'Popular',
              icon: '🔥',
              color: 'bg-red-100 text-red-800 border-red-200',
              enabled: true,
              description: 'Los más pedidos por clientes'
            },
            {
              id: 'vegetariano',
              name: 'Vegetariano',
              icon: '🌱',
              color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              enabled: true,
              description: 'Opciones sin carne'
            },
            {
              id: 'destacado',
              name: 'Destacado',
              icon: '⭐',
              color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              enabled: false,
              description: 'Recomendaciones del chef'
            },
            {
              id: 'picante',
              name: 'Picante',
              icon: '🌶️',
              color: 'bg-orange-100 text-orange-800 border-orange-200',
              enabled: false,
              description: 'Para los que aman el picante'
            },
            {
              id: 'sin-gluten',
              name: 'Sin Gluten',
              icon: '🌾',
              color: 'bg-blue-100 text-blue-800 border-blue-200',
              enabled: false,
              description: 'Opciones sin gluten'
            }
          ];
          setTags(mockTags);
        }
      } catch (error) {
        console.error('Error fetching product tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleToggleTag = (tagId: string) => {
    setTags(tags.map(tag => 
      tag.id === tagId ? { ...tag, enabled: !tag.enabled } : tag
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/product-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tags),
      });

      if (response.ok) {
        console.log('Etiquetas guardadas exitosamente');
      } else {
        console.error('Error al guardar las etiquetas');
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Título */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🏷️</span>
          Etiquetas de productos
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Activa o desactiva etiquetas para categorizar productos en la carta
        </p>
      </div>

      {/* Vista previa */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Vista previa:</p>
        <div className="flex flex-wrap gap-2">
          {tags.filter(tag => tag.enabled).map(tag => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${tag.color} border`}
            >
              <span>{tag.icon}</span>
              {tag.name}
            </span>
          ))}
        </div>
        {tags.filter(tag => tag.enabled).length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No hay etiquetas activadas
          </p>
        )}
      </div>

      {/* Lista de etiquetas */}
      <div className="space-y-3 mb-6">
        {tags.map(tag => (
          <div
            key={tag.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              tag.enabled 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Icono y nombre */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{tag.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{tag.name}</h4>
                  <p className="text-sm text-gray-600">{tag.description}</p>
                </div>
              </div>
            </div>

            {/* Toggle */}
            <label className="relative cursor-pointer">
              <input
                type="checkbox"
                checked={tag.enabled}
                onChange={() => handleToggleTag(tag.id)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                tag.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  tag.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Estadísticas */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {tags.length}
            </div>
            <div className="text-sm text-gray-600">Total etiquetas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {tags.filter(tag => tag.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Activadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {tags.filter(tag => !tag.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Desactivadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((tags.filter(tag => tag.enabled).length / tags.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Activación</div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        
        <button
          onClick={() => {
            setTags(tags.map(tag => ({ ...tag, enabled: false })));
          }}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Desactivar todas
        </button>
        
        <button
          onClick={() => {
            setTags(tags.map(tag => ({ ...tag, enabled: true })));
          }}
          className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors"
        >
          Activar todas
        </button>
      </div>

      {/* Ayuda */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>💡 Consejo:</strong> Las etiquetas ayudan a los clientes a identificar rápidamente 
          características especiales de los productos. Usa etiquetas relevantes y mantén un número 
          manejable para no sobrecargar la interfaz.
        </p>
      </div>
    </div>
  );
}
