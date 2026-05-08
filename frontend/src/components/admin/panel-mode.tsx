'use client';

import React, { useState, useEffect } from 'react';

interface PanelModeData {
  mode: 'simple' | 'complete';
  userPreferences: {
    showAdvancedMetrics: boolean;
    showDetailedAnalytics: boolean;
    showExperimentalFeatures: boolean;
    compactView: boolean;
  };
}

export default function PanelMode() {
  const [panelMode, setPanelMode] = useState<PanelModeData>({
    mode: 'simple',
    userPreferences: {
      showAdvancedMetrics: false,
      showDetailedAnalytics: false,
      showExperimentalFeatures: false,
      compactView: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simular obtención de configuración desde backend
    const fetchPanelMode = async () => {
      try {
        const response = await fetch('/api/admin/panel-mode');
        if (response.ok) {
          const data = await response.json();
          setPanelMode(data);
        } else {
          // Fallback con datos simulados
          const mockData: PanelModeData = {
            mode: 'simple',
            userPreferences: {
              showAdvancedMetrics: false,
              showDetailedAnalytics: false,
              showExperimentalFeatures: false,
              compactView: false
            }
          };
          setPanelMode(mockData);
        }
      } catch (error) {
        console.error('Error fetching panel mode:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPanelMode();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/panel-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(panelMode),
      });

      if (response.ok) {
        console.log('Configuración del panel guardada exitosamente');
        // Recargar para aplicar cambios
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('Error al guardar la configuración del panel');
      }
    } catch (error) {
      console.error('Error saving panel mode:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleModeToggle = (newMode: 'simple' | 'complete') => {
    setPanelMode(prev => ({
      ...prev,
      mode: newMode,
      userPreferences: {
        ...prev.userPreferences,
        showAdvancedMetrics: newMode === 'complete',
        showDetailedAnalytics: newMode === 'complete',
        showExperimentalFeatures: newMode === 'complete'
      }
    }));
  };

  const handlePreferenceChange = (key: keyof PanelModeData['userPreferences'], value: boolean) => {
    setPanelMode(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 w-full bg-gray-200 rounded mb-4"></div>
          <div className="h-32 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Título */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>⚙️</span>
          Configuración del panel
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Personaliza tu experiencia en el panel de administración
        </p>
      </div>

      {/* Selector de modo principal */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-800 mb-4">Modo del panel</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modo Simple */}
          <div
            className={`
              relative border-2 rounded-lg p-4 cursor-pointer transition-all
              ${panelMode.mode === 'simple' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => handleModeToggle('simple')}
          >
            {panelMode.mode === 'simple' && (
              <div className="absolute top-2 right-2">
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Activo</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Modo Simple</h5>
                <p className="text-sm text-gray-600">Para uso diario y rápido</p>
              </div>
            </div>
            
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Funciones esenciales
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Interfaz limpia
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Carga rápida
              </li>
            </ul>
          </div>

          {/* Modo Completo */}
          <div
            className={`
              relative border-2 rounded-lg p-4 cursor-pointer transition-all
              ${panelMode.mode === 'complete' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => handleModeToggle('complete')}
          >
            {panelMode.mode === 'complete' && (
              <div className="absolute top-2 right-2">
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Activo</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900">Modo Completo</h5>
                <p className="text-sm text-gray-600">Control total y análisis</p>
              </div>
            </div>
            
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-purple-500">✓</span>
                Todas las funciones
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">✓</span>
                Análisis avanzados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">✓</span>
                Funciones experimentales
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preferencias adicionales */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-800 mb-4">Preferencias adicionales</h4>
        <div className="space-y-4">
          {/* Métricas avanzadas */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Métricas avanzadas</h5>
              <p className="text-sm text-gray-600">
                Mostrar métricas detalladas de rendimiento y análisis
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={panelMode.userPreferences.showAdvancedMetrics}
                onChange={(e) => handlePreferenceChange('showAdvancedMetrics', e.target.checked)}
                disabled={panelMode.mode === 'simple'}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                panelMode.userPreferences.showAdvancedMetrics ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  panelMode.userPreferences.showAdvancedMetrics ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>

          {/* Análisis detallados */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Análisis detallados</h5>
              <p className="text-sm text-gray-600">
                Activar informes completos y gráficos avanzados
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={panelMode.userPreferences.showDetailedAnalytics}
                onChange={(e) => handlePreferenceChange('showDetailedAnalytics', e.target.checked)}
                disabled={panelMode.mode === 'simple'}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                panelMode.userPreferences.showDetailedAnalytics ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  panelMode.userPreferences.showDetailedAnalytics ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>

          {/* Funciones experimentales */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Funciones experimentales</h5>
              <p className="text-sm text-gray-600">
                Probar nuevas características en desarrollo
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={panelMode.userPreferences.showExperimentalFeatures}
                onChange={(e) => handlePreferenceChange('showExperimentalFeatures', e.target.checked)}
                disabled={panelMode.mode === 'simple'}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                panelMode.userPreferences.showExperimentalFeatures ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  panelMode.userPreferences.showExperimentalFeatures ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>

          {/* Vista compacta */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Vista compacta</h5>
              <p className="text-sm text-gray-600">
                Reducir el tamaño de los elementos para mostrar más información
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={panelMode.userPreferences.compactView}
                onChange={(e) => handlePreferenceChange('compactView', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${
                panelMode.userPreferences.compactView ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  panelMode.userPreferences.compactView ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Resumen del modo actual */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="font-medium text-blue-900 mb-2">Configuración actual</h5>
        <div className="text-sm text-blue-800">
          <p>
            <strong>Modo:</strong> {panelMode.mode === 'simple' ? 'Simple' : 'Completo'}
          </p>
          <p>
            <strong>Características activas:</strong> {[
              panelMode.userPreferences.showAdvancedMetrics && 'Métricas avanzadas',
              panelMode.userPreferences.showDetailedAnalytics && 'Análisis detallados',
              panelMode.userPreferences.showExperimentalFeatures && 'Funciones experimentales',
              panelMode.userPreferences.compactView && 'Vista compacta'
            ].filter(Boolean).join(', ') || 'Ninguna adicional'}
          </p>
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
            setPanelMode({
              mode: 'simple',
              userPreferences: {
                showAdvancedMetrics: false,
                showDetailedAnalytics: false,
                showExperimentalFeatures: false,
                compactView: false
              }
            });
          }}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Restablecer valores
        </button>
      </div>

      {/* Ayuda */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>💡 Consejo:</strong> El modo Simple es ideal para operaciones diarias rápidas, 
          mientras que el modo Completo te da acceso total a todas las herramientas de análisis y configuración.
        </p>
      </div>
    </div>
  );
}
