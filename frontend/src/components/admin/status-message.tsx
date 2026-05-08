'use client';

import React, { useState, useEffect } from 'react';

export default function StatusMessage() {
  const [message, setMessage] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState('');

  useEffect(() => {
    // Cargar mensaje actual
    const fetchStatusMessage = async () => {
      try {
        const response = await fetch('/api/admin/status-message');
        const data = await response.json();
        setMessage(data.message || '');
        setIsEnabled(data.enabled || false);
      } catch (error) {
        console.error('Error loading status message:', error);
      }
    };

    fetchStatusMessage();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/status-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: tempMessage,
          enabled: isEnabled,
        }),
      });

      if (response.ok) {
        setMessage(tempMessage);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving status message:', error);
    }
  };

  const handleToggle = async (newEnabled: boolean) => {
    try {
      const response = await fetch('/api/admin/status-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          enabled: newEnabled,
        }),
      });

      if (response.ok) {
        setIsEnabled(newEnabled);
      }
    } catch (error) {
      console.error('Error toggling status message:', error);
    }
  };

  const startEditing = () => {
    setTempMessage(message);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTempMessage(message);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Mensaje Destacado
        </h3>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleToggle(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          <span className="text-sm text-gray-600">
            {isEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={tempMessage}
            onChange={(e) => setTempMessage(e.target.value)}
            placeholder="Escribe un mensaje corto y claro..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {tempMessage.length}/100 caracteres
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-700">
              {message || 'No hay mensaje configurado'}
            </p>
          </div>
          
          <button
            onClick={startEditing}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
          >
            Editar Mensaje
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-sm text-blue-700">
          💡 Este mensaje aparecerá en la parte superior de la web para todos los visitantes.
        </p>
      </div>
    </div>
  );
}
