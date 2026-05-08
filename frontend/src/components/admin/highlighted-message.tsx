'use client';

import React, { useState, useEffect } from 'react';

interface MessageData {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export default function HighlightedMessage() {
  const [messageData, setMessageData] = useState<MessageData>({
    enabled: false,
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simular obtención del mensaje desde backend
    const fetchMessage = async () => {
      try {
        const response = await fetch('/api/admin/highlighted-message');
        if (response.ok) {
          const data = await response.json();
          setMessageData(data);
        } else {
          // Fallback con datos simulados
          const mockData: MessageData = {
            enabled: false,
            message: '',
            type: 'info'
          };
          setMessageData(mockData);
        }
      } catch (error) {
        console.error('Error fetching highlighted message:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/highlighted-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        // Mostrar notificación de éxito
        console.log('Mensaje guardado exitosamente');
      } else {
        console.error('Error al guardar el mensaje');
      }
    } catch (error) {
      console.error('Error saving message:', error);
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Título */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📢</span>
          Mensaje destacado
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Muestra un mensaje importante en la página principal
        </p>
      </div>

      {/* Vista previa */}
      {messageData.enabled && messageData.message.trim() && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
          <div className={`p-4 rounded-lg border ${getTypeColor(messageData.type)}`}>
            <p className="text-sm font-medium">{messageData.message}</p>
          </div>
        </div>
      )}

      {/* Toggle de activación */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={messageData.enabled}
              onChange={(e) => setMessageData({ ...messageData, enabled: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              messageData.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                messageData.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </div>
          </div>
          <span className="font-medium text-gray-700">
            {messageData.enabled ? 'Mensaje activado' : 'Mensaje desactivado'}
          </span>
        </label>
      </div>

      {/* Campo de mensaje */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje a mostrar
        </label>
        <input
          type="text"
          value={messageData.message}
          onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
          placeholder="Escribe un mensaje corto y claro..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!messageData.enabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          Máximo 100 caracteres. {messageData.message.length}/100
        </p>
      </div>

      {/* Selector de tipo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de mensaje
        </label>
        <div className="flex gap-2">
          {[
            { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-800' },
            { value: 'success', label: 'Éxito', color: 'bg-green-100 text-green-800' },
            { value: 'warning', label: 'Advertencia', color: 'bg-yellow-100 text-yellow-800' },
            { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setMessageData({ ...messageData, type: type.value as MessageData['type'] })}
              disabled={!messageData.enabled}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                messageData.type === type.value
                  ? type.color
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${!messageData.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {type.label}
            </button>
          ))}
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
            setMessageData({
              enabled: false,
              message: '',
              type: 'info'
            });
          }}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Restablecer
        </button>
      </div>

      {/* Ayuda */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>💡 Consejo:</strong> Usa mensajes cortos y claros para comunicar información importante como promociones, cambios de horario o avisos especiales.
        </p>
      </div>
    </div>
  );
}
