import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * Custom hook for managing toast notifications
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toasts, addToast, removeToast } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       addToast('Saved successfully!', 'success');
 *     } catch (error) {
 *       addToast('Failed to save', 'error');
 *     }
 *   };
 *
 *   return <ToastContainer toasts={toasts} removeToast={removeToast} />;
 * }
 * ```
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'success',
      duration?: number
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<ToastMessage, 'id'>>) => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, ...updates } : toast
        )
      );
    },
    []
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    updateToast
  };
};
