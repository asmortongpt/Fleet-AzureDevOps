/**
 * Enterprise Authentication Component
 * Simple authentication wrapper for CTAFleet
 */

import React from 'react';

// Simple enterprise auth component for development
export const EnterpriseAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default EnterpriseAuth;