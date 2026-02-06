
import React, { ReactNode } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';

interface AuthProviderFactoryProps {
  children: ReactNode;
}

export const AuthProviderFactory: React.FC<AuthProviderFactoryProps> = ({ children }) => {
  // Always use real AuthContext provider. Mock auth is not allowed in runtime builds.
  return <AuthProvider>{children}</AuthProvider>;
};

export default AuthProviderFactory;
