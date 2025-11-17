// Auth Provider Component
// Wraps the application and provides authentication context

import React, { useEffect } from 'react';
import { AuthContext, useAuthProvider } from '../../hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();

  // Auto-login with demo user for development
  useEffect(() => {
    if (!auth.user && !auth.isLoading) {
      const demoUser = {
        id: 'demo-user-001',
        email: 'demo@fleet.capitaltechalliance.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'Fleet Manager',
        avatar: '',
        token: 'demo-token-' + Date.now()
      };

      auth.setUser(demoUser);
      localStorage.setItem('demo_mode', 'true');
      localStorage.setItem('demo_role', 'Fleet Manager');

      console.log('✅ Demo mode activated - auto-logged in as:', demoUser.email);
    }
  }, [auth]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
