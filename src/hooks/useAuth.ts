// Authentication Hook Re-export
// This file exists for backward compatibility. 
// The canonical Auth implementation is in @/contexts/AuthContext.tsx

import { useAuth as useContextAuth, AuthContext as ContextAuth } from '@/contexts/AuthContext';

// Re-export using the same names
export const AuthContext = ContextAuth;
export const useAuth = useContextAuth;

// Deprecated export - prefer direct usage of AuthProvider component
export const useAuthProvider = () => {
  throw new Error('useAuthProvider is deprecated. Use <AuthProvider> from @/contexts/AuthContext instead.');
};
