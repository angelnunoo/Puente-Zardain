'use client';

import React, { useState, useEffect } from 'react';

export default function ViewAsClient() {
  const [isViewingAsClient, setIsViewingAsClient] = useState(false);
  const [currentRole, setCurrentRole] = useState<'admin' | 'client'>('admin');

  useEffect(() => {
    // Verificar si ya estamos en modo cliente
    const checkCurrentMode = async () => {
      try {
        const response = await fetch('/api/admin/view-mode');
        if (response.ok) {
          const data = await response.json();
          setIsViewingAsClient(data.isViewingAsClient);
          setCurrentRole(data.isViewingAsClient ? 'client' : 'admin');
        }
      } catch (error) {
        console.error('Error checking view mode:', error);
      }
    };

    checkCurrentMode();
  }, []);

  const handleToggleView = async () => {
    try {
      const newMode = isViewingAsClient ? 'admin' : 'client';
      
      const response = await fetch('/api/admin/view-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: newMode }),
      });

      if (response.ok) {
        setIsViewingAsClient(!isViewingAsClient);
        setCurrentRole(newMode);
        
        // Recargar la página para aplicar el nuevo modo
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('Error al cambiar el modo de vista');
      }
    } catch (error) {
      console.error('Error toggling view mode:', error);
    }
  };

  const getButtonStyles = () => {
    if (isViewingAsClient) {
      return {
        bg: 'bg-orange-600 hover:bg-orange-700',
        text: 'text-white',
        icon: '👨‍💼',
        label: 'Volver al panel admin',
        description: 'Estás viendo la página como un cliente'
      };
    } else {
      return {
        bg: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-white',
        icon: '👁️',
        label: 'Ver como cliente',
        description: 'Previsualiza cómo ven los clientes tu página'
      };
    }
  };

  const styles = getButtonStyles();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón principal */}
      <button
        onClick={handleToggleView}
        className={`
          ${styles.bg} ${styles.text}
          px-6 py-3 rounded-full shadow-lg
          flex items-center gap-3 font-medium
          transform transition-all duration-300
          hover:scale-105 hover:shadow-xl
          focus:outline-none focus:ring-4 focus:ring-offset-2
          ${isViewingAsClient ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}
        `}
      >
        <span className="text-xl">{styles.icon}</span>
        <span>{styles.label}</span>
        
        {/* Indicador de modo actual */}
        <div className={`
          w-2 h-2 rounded-full ml-2
          ${isViewingAsClient ? 'bg-orange-300' : 'bg-blue-300'}
          animate-pulse
        `} />
      </button>

      {/* Tooltip con información */}
      <div className={`
        absolute bottom-full right-0 mb-3
        bg-gray-900 text-white text-sm
        px-4 py-2 rounded-lg shadow-xl
        whitespace-nowrap opacity-0 invisible
        group-hover:opacity-100 group-hover:visible
        transition-all duration-200
        transform translate-y-2 group-hover:translate-y-0
      `}>
        <div className="relative">
          {styles.description}
          {/* Flecha */}
          <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900 transform -translate-y-1" />
        </div>
      </div>

      {/* Indicador flotante cuando está en modo cliente */}
      {isViewingAsClient && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">
          CLIENTE
        </div>
      )}
    </div>
  );
}

// Componente para mostrar en la barra de navegación del admin
export function ViewModeIndicator() {
  const [isViewingAsClient, setIsViewingAsClient] = useState(false);

  useEffect(() => {
    const checkCurrentMode = async () => {
      try {
        const response = await fetch('/api/admin/view-mode');
        if (response.ok) {
          const data = await response.json();
          setIsViewingAsClient(data.isViewingAsClient);
        }
      } catch (error) {
        console.error('Error checking view mode:', error);
      }
    };

    checkCurrentMode();
  }, []);

  if (!isViewingAsClient) {
    return null;
  }

  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👁️</span>
        <div>
          <h4 className="font-semibold">Modo cliente activado</h4>
          <p className="text-sm">
            Estás viendo la página como la verían los clientes. 
            Usa el botón flotante para volver al modo admin.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook para usar en otros componentes
export function useViewMode() {
  const [isViewingAsClient, setIsViewingAsClient] = useState(false);

  useEffect(() => {
    const checkCurrentMode = async () => {
      try {
        const response = await fetch('/api/admin/view-mode');
        if (response.ok) {
          const data = await response.json();
          setIsViewingAsClient(data.isViewingAsClient);
        }
      } catch (error) {
        console.error('Error checking view mode:', error);
      }
    };

    checkCurrentMode();
  }, []);

  return { isViewingAsClient };
}

// Componente de banner para modo cliente
export function ClientModeBanner() {
  const { isViewingAsClient } = useViewMode();

  if (!isViewingAsClient) {
    return null;
  }

  return (
    <div className="bg-orange-500 text-white px-4 py-2 text-center font-medium">
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">👁️</span>
        <span>Estás viendo esta página como un cliente</span>
        <span className="bg-orange-600 px-2 py-1 rounded text-xs">MODO PREVIEW</span>
      </div>
    </div>
  );
}
