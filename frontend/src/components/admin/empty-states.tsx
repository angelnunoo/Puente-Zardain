'use client';

import React from 'react';

interface EmptyStateProps {
  type: 'orders' | 'products' | 'customers' | 'analytics' | 'notifications';
  title?: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export default function EmptyStates({ type, title, description, action }: EmptyStateProps) {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'orders':
        return {
          icon: '📋',
          defaultTitle: 'Aún no hay pedidos hoy',
          defaultDescription: 'Los pedidos aparecerán aquí cuando los clientes empiecen a pedir',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'products':
        return {
          icon: '🍽',
          defaultTitle: 'No hay productos en la carta',
          defaultDescription: 'Añade tus primeros productos para empezar a recibir pedidos',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };
      case 'customers':
        return {
          icon: '👥',
          defaultTitle: 'Aún no hay clientes registrados',
          defaultDescription: 'Los clientes empezarán a aparecer cuando hagan su primer pedido',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'analytics':
        return {
          icon: '📊',
          defaultTitle: 'No hay datos para mostrar',
          defaultDescription: 'Necesitas tener algo de actividad para ver las estadísticas',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800'
        };
      case 'notifications':
        return {
          icon: '🔔',
          defaultTitle: 'No hay notificaciones',
          defaultDescription: 'Te avisaremos aquí cuando haya novedades importantes',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
      default:
        return {
          icon: '📭',
          defaultTitle: 'No hay contenido',
          defaultDescription: 'No hay nada que mostrar en este momento',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const config = getEmptyStateConfig();
  const finalTitle = title || config.defaultTitle;
  const finalDescription = description || config.defaultDescription;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 border-dashed rounded-xl p-12 text-center`}>
      {/* Icono principal */}
      <div className="text-6xl mb-6 animate-bounce">
        {config.icon}
      </div>

      {/* Título */}
      <h3 className={`text-2xl font-bold ${config.textColor} mb-4`}>
        {finalTitle}
      </h3>

      {/* Descripción */}
      <p className={`text-lg ${config.textColor} opacity-90 mb-8 max-w-md mx-auto`}>
        {finalDescription}
      </p>

      {/* Acción si existe */}
      {action && (
        <button
          onClick={action.onClick}
          className={`${config.textColor} ${config.borderColor} border-2 px-6 py-3 rounded-lg font-medium hover:bg-white hover:bg-opacity-50 transition-all duration-200`}
        >
          {action.text}
        </button>
      )}

      {/* Mensaje adicional de ayuda */}
      <div className="mt-8 text-sm opacity-75">
        <p className={config.textColor}>
          {type === 'orders' && 'Consejo: Asegúrate de que el restaurante esté abierto para recibir pedidos'}
          {type === 'products' && 'Consejo: Empieza con tus platos más populares'}
          {type === 'customers' && 'Consejo: Comparte tu enlace para atraer a tus primeros clientes'}
          {type === 'analytics' && 'Consejo: Las estadísticas se actualizan cada hora'}
          {type === 'notifications' && 'Consejo: Revisa esta sección periódicamente para no perderte nada'}
        </p>
      </div>

      {/* Indicador de tiempo real */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">
          Actualizando automáticamente...
        </span>
      </div>
    </div>
  );
}

// Componentes específicos para cada tipo de estado vacío
export function EmptyOrders() {
  return (
    <EmptyStates
      type="orders"
      action={{
        text: 'Ver cómo activar pedidos',
        onClick: () => console.log('Ir a configuración de pedidos')
      }}
    />
  );
}

export function EmptyProducts() {
  return (
    <EmptyStates
      type="products"
      title='Tu carta está vacía'
      description='Añade los platos que haces mejor para empezar'
      action={{
        text: 'Añadir primer producto',
        onClick: () => console.log('Ir a añadir producto')
      }}
    />
  );
}

export function EmptyCustomers() {
  return (
    <EmptyStates
      type="customers"
      description='Los clientes aparecerán aquí cuando empiecen a disfrutar de tu comida'
    />
  );
}

export function EmptyAnalytics() {
  return (
    <EmptyStates
      type="analytics"
      title='Sin datos suficientes'
      description='Necesitas al menos 1 día de actividad para ver estadísticas'
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyStates
      type="notifications"
      description='Todo en orden por ahora. Te avisaremos si hay algo importante'
    />
  );
}
