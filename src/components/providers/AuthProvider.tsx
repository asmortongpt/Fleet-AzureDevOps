// Auth Provider Component
// Wraps the application and provides authentication context

import { AuthContext, useAuthProvider } from '../../hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();

  // SECURITY FIX: Removed auto-login vulnerability (CWE-287)
  // Auto-login with fake tokens is a critical authentication bypass
  // Users must now authenticate through proper login flow with valid credentials
  //
  // Previously this component would automatically create a fake user session
  // without any authentication, allowing unauthorized access to the application
  //
  // Proper authentication flow:
  // 1. User navigates to /login
  // 2. User provides credentials (email/password or SSO)
  // 3. Backend validates credentials
  // 4. Backend returns JWT token
  // 5. Frontend stores token and establishes authenticated session
  //
  // For development/testing: Use proper test accounts with real authentication
  // instead of bypassing authentication entirely

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
