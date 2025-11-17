// Toast Notification System
// Simple toast notification system for user feedback

interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
  icon?: string;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: string;
  duration: number;
}

// Toast event bus
class ToastEventBus {
  private listeners: ((toast: Toast) => void)[] = [];

  subscribe(listener: (toast: Toast) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(toast: Toast) {
    this.listeners.forEach(listener => listener(toast));
  }
}

export const toastEventBus = new ToastEventBus();

// Show toast notification
export function showToast(message: string, options: ToastOptions = {}) {
  const {
    duration = 3000,
    type = 'info',
    icon,
    position = 'top-right'
  } = options;

  const toast: Toast = {
    id: `toast-${Date.now()}-${Math.random()}`,
    message,
    type,
    icon,
    duration
  };

  toastEventBus.emit(toast);

  return toast.id;
}

// Convenience functions
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'success' }),

  error: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'error' }),

  info: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'info' }),

  warning: (message: string, options?: Omit<ToastOptions, 'type'>) =>
    showToast(message, { ...options, type: 'warning' }),
};
