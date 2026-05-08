'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

interface FeedbackContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration || 5000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <FeedbackContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
      <NotificationContainer />
    </FeedbackContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useFeedback();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: '✅',
          iconBg: 'bg-green-100',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: '❌',
          iconBg: 'bg-red-100',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'ℹ️',
          iconBg: 'bg-gray-100',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const styles = getNotificationStyles(notification.type);

  return (
    <div
      className={`
        ${styles.bg} border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-out
        animate-in slide-in-from-right-2
        hover:shadow-xl
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          ${styles.iconBg} rounded-full p-2 flex-shrink-0
          flex items-center justify-center w-8 h-8
        `}>
          <span className="text-sm">{styles.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${styles.titleColor} mb-1`}>
            {notification.title}
          </h4>
          {notification.message && (
            <p className={`text-sm ${styles.messageColor} break-words`}>
              {notification.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 p-1 rounded-md transition-colors
            hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1
            ${styles.titleColor.replace('text-', 'hover:bg-').replace('800', '100')}
          `}
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div
            className={`
              h-1 rounded-full transition-all ease-linear
              ${notification.type === 'success' ? 'bg-green-500' : ''}
              ${notification.type === 'error' ? 'bg-red-500' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
              ${notification.type === 'info' ? 'bg-blue-500' : ''}
            `}
            style={{
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

// Hook para facilitar el uso
export function useActionFeedback() {
  const { addNotification } = useFeedback();

  const showSuccess = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message: message || '',
      duration: 4000
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message: message || '',
      duration: 6000
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message: message || '',
      duration: 5000
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message: message || '',
      duration: 4000
    });
  }, [addNotification]);

  const showLoading = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message: message || '',
      duration: 0 // No auto-dismiss for loading
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
}

// Componente para botones con feedback automático
interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ActionButton({
  children,
  onClick,
  successMessage = 'Acción completada exitosamente',
  errorMessage = 'Error al realizar la acción',
  loadingMessage = 'Procesando...',
  className = '',
  disabled = false,
  variant = 'primary'
}: ActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError, showLoading, removeNotification } = useActionFeedback();
  const { notifications } = useFeedback();

  const handleClick = async () => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);
      
      // Show loading notification
      const loadingId = Math.random().toString(36).substr(2, 9);
      showLoading(loadingMessage);

      await onClick();

      // Remove loading notification
      const loadingNotification = notifications.find(n => n.title === loadingMessage);
      if (loadingNotification) {
        removeNotification(loadingNotification.id);
      }

      showSuccess(successMessage);
    } catch (error) {
      console.error('Action error:', error);
      
      // Remove loading notification if exists
      const loadingNotification = notifications.find(n => n.title === loadingMessage);
      if (loadingNotification) {
        removeNotification(loadingNotification.id);
      }

      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantStyles()}
        ${className}
      `}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Estilos para las animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
  
  @keyframes slide-in-from-right-2 {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-in {
    animation: slide-in-from-right-2 0.3s ease-out;
  }
`;
document.head.appendChild(style);
