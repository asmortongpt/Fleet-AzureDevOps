// Toast Container Component
// Displays toast notifications using the toast event bus

// motion removed - React 19 incompatible
import React, { useState, useEffect, useRef } from 'react';

import { toastEventBus } from '../../utils/toast';
import './ToastContainer.css';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: string;
  duration: number;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    // Subscribe to toast events
    const unsubscribe = toastEventBus.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto-remove toast after duration
      const timerId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        timersRef.current.delete(timerId);
      }, toast.duration);
      timersRef.current.add(timerId);
    });

    return () => {
      unsubscribe();
      // Clear all pending auto-dismiss timers on unmount
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (toast: Toast) => {
    if (toast.icon) return toast.icon;

    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className="toast-container"
      aria-live="polite"
      aria-atomic="true"
      role="status"
      data-testid="toast-container"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          <span className="toast-icon">{getIcon(toast)}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
