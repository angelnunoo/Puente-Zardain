'use client';

import React, { useState, useEffect } from 'react';

interface AvailabilitySettings {
  isAvailable: boolean;
  message: string;
  autoDisableTime?: string;
  autoEnableTime?: string;
}

export default function AvailabilityToggle() {
  const [settings, setSettings] = useState<AvailabilitySettings>({
    isAvailable: true,
    message: 'Funcionando con normalidad',
    autoDisableTime: '23:00',
    autoEnableTime: '12:00'
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState('');

  useEffect(() => {
    // Cargar configuración actual
    const fetchAvailability = async () => {
      try {
        const response = await fetch('/api/admin/availability');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const handleToggle = async (newAvailable: boolean) => {
    try {
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          isAvailable: newAvailable,
        }),
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, isAvailable: newAvailable }));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleSaveMessage = async () => {
    try {
      const response = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          message: tempMessage,
        }),
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, message: tempMessage }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const startEditing = () => {
    setTempMessage(settings.message);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTempMessage(settings.message);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
          <div className="h-10 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getAvailabilityConfig = (isAvailable: boolean) => {
    return isAvailable
      ? {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: '✅',
          title: 'Disponible',
          description: 'Aceptando pedidos'
        }
      : {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          icon: '❌',
          title: 'No disponible',
          description: 'No aceptando pedidos'
        };
  };

  const config = getAvailabilityConfig(settings.isAvailable);

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border-2 ${config.borderColor}`}>
      {/* Título y Toggle Principal */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Hoy: {config.title}
            </h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        
        <button
          onClick={() => handleToggle(!settings.isAvailable)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            settings.isAvailable ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              settings.isAvailable ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Mensaje Personalizado */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Mensaje para clientes
          </label>
          {!isEditing && (
            <button
              onClick={startEditing}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Editar
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={tempMessage}
              onChange={(e) => setTempMessage(e.target.value)}
              placeholder="Escribe un mensaje claro y breve..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={80}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {tempMessage.length}/80 caracteres
              </span>
              <div className="flex gap-2">
                <button
                  onClick={cancelEditing}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMessage}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
            <p className={`font-medium ${config.textColor}`}>
              {settings.message}
            </p>
          </div>
        )}
      </div>

      {/* Horarios Automáticos */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Horarios automáticos
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Desactivar automáticamente
            </label>
            <input
              type="time"
              value={settings.autoDisableTime || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, autoDisableTime: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Activar automáticamente
            </label>
            <input
              type="time"
              value={settings.autoEnableTime || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, autoEnableTime: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Vista Previa */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Vista previa para clientes
        </h4>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className={`font-medium ${config.textColor}`}>
              {config.title}
            </div>
            <div className="text-sm text-gray-600">
              {settings.message}
            </div>
          </div>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">💡</span>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Consejos:</p>
            <ul className="space-y-1 text-xs">
              <li>• Usa mensajes claros y breves</li>
              <li>• Configura horarios para automatización</li>
              <li>• Comunica claramente cuando no haya servicio</li>
              <li>• Los clientes verán esto inmediatamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
