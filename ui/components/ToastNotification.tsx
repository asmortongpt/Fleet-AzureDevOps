import React from 'react';

import { useBranding } from '../context/BrandingContext';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type }) => {
  const { brandingConfig } = useBranding();
  const backgroundColor = brandingConfig ? brandingConfig.primaryColor : '#333';

  return (
    <div style={{ backgroundColor }} className={`toast-notification ${type}`}>
      {message}
    </div>
  );
};

export default ToastNotification;