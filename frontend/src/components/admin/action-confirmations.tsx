'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConfirmationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  duration?: number;
}

interface ConfirmationContextType {
  showConfirmation: (message: Omit<ConfirmationMessage, 'id'>) => void;
  showSuccess: (message: string, details?: string) => void;
  showError: (message: string, details?: string) => void;
  showWarning: (message: string, details?: string) => void;
  showInfo: (message: string, details?: string) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function useConfirmations() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmations must be used within ConfirmationProvider');
  }
  return context;
}

interface ConfirmationProviderProps {
  children: ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [confirmations, setConfirmations] = useState<ConfirmationMessage[]>([]);

  const showConfirmation = (message: Omit<ConfirmationMessage, 'id'>) => {
    const id = Date.now().toString();
    const newConfirmation = { ...message, id };
    
    setConfirmations(prev => [...prev, newConfirmation]);
    
    // Auto-remove after duration
    const duration = message.duration || 3000;
    setTimeout(() => {
      setConfirmations(prev => prev.filter(conf => conf.id !== id));
    }, duration);
  };

  const showSuccess = (message: string, details?: string) => {
    showConfirmation({ type: 'success', message, details });
  };

  const showError = (message: string, details?: string) => {
    showConfirmation({ type: 'error', message, details, duration: 5000 });
  };

  const showWarning = (message: string, details?: string) => {
    showConfirmation({ type: 'warning', message, details, duration: 4000 });
  };

  const showInfo = (message: string, details?: string) => {
    showConfirmation({ type: 'info', message, details });
  };

  return (
    <ConfirmationContext.Provider value={{
      showConfirmation,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <ConfirmationList confirmations={confirmations} />
    </ConfirmationContext.Provider>
  );
}

interface ConfirmationListProps {
  confirmations: ConfirmationMessage[];
}

function ConfirmationList({ confirmations }: ConfirmationListProps) {
  if (confirmations.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {confirmations.map((confirmation) => (
        <ConfirmationItem key={confirmation.id} confirmation={confirmation} />
      ))}
    </div>
  );
}

interface ConfirmationItemProps {
  confirmation: ConfirmationMessage;
}

function ConfirmationItem({ confirmation }: ConfirmationItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const getConfirmationConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getConfirmationConfig(confirmation.type);

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg p-4 shadow-lg min-w-[300px] max-w-[400px]
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <span className={`text-2xl ${config.iconColor}`}>
          {config.icon}
        </span>
        
        <div className="flex-1">
          <div className="font-semibold">
            {confirmation.message}
          </div>
          
          {confirmation.details && (
            <div className="text-sm mt-1 opacity-80">
              {confirmation.details}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className={`text-gray-400 hover:text-gray-600 transition-colors`}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Hook para acciones con confirmación automática
export function useActionConfirmation() {
  const { showSuccess, showError, showWarning, showInfo } = useConfirmations();

  const confirmAction = async (
    action: () => Promise<void> | void,
    successMessage: string,
    errorMessage?: string,
    warningMessage?: string
  ) => {
    try {
      await action();
      showSuccess(successMessage);
    } catch (error) {
      if (warningMessage && error instanceof Error && error.name === 'Warning') {
        showWarning(warningMessage);
      } else {
        showError(errorMessage || 'Error al realizar la acción');
      }
    }
  };

  const confirmSave = async (action: () => Promise<void> | void, itemName: string) => {
    await confirmAction(
      action,
      `${itemName} guardado correctamente`,
      `Error al guardar ${itemName}`
    );
  };

  const confirmUpdate = async (action: () => Promise<void> | void, itemName: string) => {
    await confirmAction(
      action,
      `${itemName} actualizado correctamente`,
      `Error al actualizar ${itemName}`
    );
  };

  const confirmDelete = async (action: () => Promise<void> | void, itemName: string) => {
    await confirmAction(
      action,
      `${itemName} eliminado correctamente`,
      `Error al eliminar ${itemName}`
    );
  };

  const confirmPublish = async (action: () => Promise<void> | void, itemName: string) => {
    await confirmAction(
      action,
      `${itemName} publicado correctamente`,
      `Error al publicar ${itemName}`
    );
  };

  const confirmToggle = async (action: () => Promise<void> | void, itemName: string, enabled: boolean) => {
    const status = enabled ? 'activado' : 'desactivado';
    await confirmAction(
      action,
      `${itemName} ${status} correctamente`,
      `Error al ${enabled ? 'activar' : 'desactivar'} ${itemName}`
    );
  };

  return {
    confirmAction,
    confirmSave,
    confirmUpdate,
    confirmDelete,
    confirmPublish,
    confirmToggle,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}

// Componente de ejemplo para botones con confirmación
export function ActionButton({
  onClick,
  loading = false,
  confirmation,
  children,
  variant = 'primary',
  size = 'medium',
  ...props
}: {
  onClick?: () => Promise<void> | void;
  loading?: boolean;
  confirmation?: {
    success: string;
    error?: string;
    warning?: string;
  };
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  [key: string]: any;
}) {
  const { confirmAction } = useActionConfirmation();

  const handleClick = async () => {
    if (!onClick) return;
    
    if (confirmation) {
      await confirmAction(
        onClick,
        confirmation.success,
        confirmation.error,
        confirmation.warning
      );
    } else {
      await onClick();
    }
  };

  const getButtonStyles = () => {
    const base = 'font-medium rounded-lg transition-all duration-200';
    
    const sizeStyles = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    };

    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
    };

    return `${base} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={getButtonStyles()}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
