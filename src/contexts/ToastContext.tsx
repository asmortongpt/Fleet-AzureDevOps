/**
 * Toast Context Provider
 *
 * Provides global toast notification management throughout the application.
 * Wrap your app with ToastProvider and use useToastContext to access toast functions.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { ToastProvider } from '@/contexts/ToastContext';
 *
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourApp />
 *     </ToastProvider>
 *   );
 * }
 *
 * // In any component
 * import { useToastContext } from '@/contexts/ToastContext';
 *
 * function MyComponent() {
 *   const { showSuccess, showError } = useToastContext();
 *
 *   const handleSave = async () => {
 *     try {
 *       await save();
 *       showSuccess('Saved successfully!');
 *     } catch (error) {
 *       showError('Failed to save');
 *     }
 *   };
 * }
 * ```
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface ToastContextValue {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5
}) => {
  const { toasts, addToast, removeToast, clearAllToasts } = useToast();

  const showSuccess = (message: string, duration?: number) => {
    if (toasts.length >= maxToasts) {
      removeToast(toasts[0].id);
    }
    addToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    if (toasts.length >= maxToasts) {
      removeToast(toasts[0].id);
    }
    addToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    if (toasts.length >= maxToasts) {
      removeToast(toasts[0].id);
    }
    addToast(message, 'info', duration);
  };

  const showWarning = (message: string, duration?: number) => {
    if (toasts.length >= maxToasts) {
      removeToast(toasts[0].id);
    }
    addToast(message, 'warning', duration);
  };

  const value: ToastContextValue = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll: clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast context
 * @throws Error if used outside ToastProvider
 */
export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
