import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'fleet_manager' | 'driver' | 'viewer';
  department: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulated authentication - in production, this would connect to your backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate API call to check authentication
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Mock user data - replace with actual API call
          setUser({
            id: '1',
            email: 'admin@dcf.state.fl.us',
            name: 'Administrator',
            role: 'admin',
            department: 'Fleet Management',
            avatar: '/avatars/admin.jpg'
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      // Simulate login API call
      await new Promise(resolve.setTimeout(resolve, 1000));

      // Mock successful login
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: 'Administrator',
        role: 'admin',
        department: 'Fleet Management'
      }

      setUser(mockUser);
      localStorage.setItem('auth_token', 'mock_token_123');
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Permission system based on roles
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics', 'manage_fleet'],
      fleet_manager: ['read', 'write', 'view_analytics', 'manage_fleet'],
      driver: ['read', 'view_own_data'],
      viewer: ['read']
    }

    return permissions[user.role]?.includes(permission) || false
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
};