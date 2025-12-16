import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// TenantContext
interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

interface TenantContextValue {
  currentTenant: Tenant | null;
  switchTenant: (tenantId: number) => Promise<void>;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;
        if (tenantId) {
          const res = await fetch(`/api/tenants/${tenantId}`);
          const tenant = await res.json();
          setCurrentTenant(tenant);
        }
      } catch (error) {
        // Silent failure for tenant loading - will retry on next mount
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, []);

  const switchTenant = async (tenantId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      const tenant = await res.json();
      setCurrentTenant(tenant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tenant_id', String(tenantId));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TenantContext.Provider value={{ currentTenant, switchTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

// UserContext
interface UserProfile {
  id: number;
  name: string;
  email: string;
  permissions: string[];
}

interface UserContextValue {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

// FeatureFlagsContext
interface FeatureFlagsContextValue {
  isFeatureEnabled: (featureName: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        const res = await fetch('/api/feature-flags');
        const flags = await res.json();
        setFeatureFlags(flags);
      } catch (error) {
        // Silent failure for feature flags loading - will use defaults
      }
    };

    loadFeatureFlags();
  }, []);

  const isFeatureEnabled = (featureName: string) => !!featureFlags[featureName];

  return (
    <FeatureFlagsContext.Provider value={{ isFeatureEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}

// NotificationContext
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// ThemeContext
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}