// Authentication Hook
// Manages user authentication state, login, logout, and token management

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import logger from '@/utils/logger'

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshToken: () => Promise<void>;
}

// Create auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider hook (for use in App.tsx)
export const useAuthProvider = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SECURITY (CRIT-F-001): Initialize auth state from httpOnly cookies
  // Tokens are NO LONGER stored in localStorage to prevent XSS attacks
  // Instead, we verify session with backend which reads the httpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have a valid session via httpOnly cookie
        const response = await fetch('/api/v1/auth/verify', {
          method: 'GET',
          credentials: 'include', // Send httpOnly cookie
        });

        if (response.ok) {
          const data = await response.json();
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            role: data.user.role,
            avatar: data.user.avatar,
            token: '', // No token in localStorage anymore
          };
          setUserState(userData);
        }
      } catch (error) {
        logger.error('Failed to initialize auth:', { error });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // SECURITY (CRIT-F-001): Login function using httpOnly cookies only
  // NO localStorage token storage to prevent XSS token theft
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',  // Required to receive httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        avatar: data.user.avatar,
        token: '', // SECURITY: No token stored in memory/localStorage
      };

      // SECURITY (CRIT-F-001): Token is now ONLY in httpOnly cookie set by backend
      // NO localStorage.setItem('token', ...) - prevents XSS token theft
      // Only store non-sensitive user profile data for UI display
      localStorage.setItem('user', JSON.stringify(userData));

      setUserState(userData);
    } catch (error) {
      logger.error('Login error:', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // SECURITY (CRIT-F-001): Logout function - backend clears httpOnly cookie
  const logout = useCallback(async () => {
    try {
      // Call backend to clear httpOnly cookie
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      logger.error('Logout error:', { error });
    }

    setUserState(null);
    localStorage.removeItem('user');
    // SECURITY: No localStorage.removeItem('token') - it was never there
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_role');
  }, []);

  // SECURITY (CRIT-F-001): Set user for demo mode only
  // NO token storage in localStorage
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      // Only store non-sensitive user profile data
      const safeUser = { ...newUser, token: '' }; // Strip token
      localStorage.setItem('user', JSON.stringify(safeUser));
      // SECURITY: No localStorage.setItem('token', ...) - prevents XSS
    }
  }, []);

  // SECURITY (CRIT-F-001): Refresh token using httpOnly cookie only
  // Backend rotates httpOnly cookie, NO localStorage token storage
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',  // Send httpOnly cookie, receive new one
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (user && data.user) {
        // Update user profile data only, NO token storage
        const updatedUser = {
          ...user,
          ...data.user,
          token: '' // SECURITY: No token in memory
        };
        setUserState(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // SECURITY: No localStorage.setItem('token', ...) - prevents XSS
      }
    } catch (error) {
      logger.error('Token refresh error:', { error });
      logout();
    }
  }, [user, logout]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUser,
    refreshToken,
  };
};
