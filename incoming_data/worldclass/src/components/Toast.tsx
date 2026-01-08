import React, { useEffect } from 'react';
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 border rounded-lg p-4 shadow-lg ${bgColors[type]} animate-slide-up`}>
      <div className="flex items-center">
        <p className={`${textColors[type]} font-medium`}>{message}</p>
        <button
          onClick={onClose}
          className={`ml-4 ${textColors[type]} hover:opacity-75`}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Toast Container
export const ToastContainer: React.FC<{
  toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>;
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
