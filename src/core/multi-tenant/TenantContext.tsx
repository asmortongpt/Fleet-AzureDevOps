import React, { createContext, useContext, useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  features: Record<string, boolean>;
  limits: {
    maxVehicles: number;
    maxUsers: number;
    maxStorageGB: number;
    apiRateLimit: number;
  };
  branding: {
    primaryColor: string;
    logo: string;
    favicon: string;
  };
}

interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (resource: string, count: number) => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      // Get tenant ID from subdomain or user preference
      const tenantId = getTenantIdFromDomain();

      const response = await fetch(`/api/v1/tenants/${tenantId}`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });

      const data = await response.json();
      setTenant(data.tenant);

      // Apply branding
      if (data.tenant.branding?.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', data.tenant.branding.primaryColor);
      }

      // Store for API calls
      if (typeof window !== 'undefined') {
        (window as any).__TENANT_ID__ = tenantId;
      }

    } catch (error) {
      console.error('Failed to load tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return tenant?.features[feature] === true;
  };

  const isWithinLimit = (resource: string, count: number): boolean => {
    const limit = tenant?.limits[resource as keyof typeof tenant.limits];
    return limit ? count <= limit : true;
  };

  return (
    <TenantContext.Provider value={{
      tenant,
      loading,
      hasFeature,
      isWithinLimit,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

function getTenantIdFromDomain(): string {
  if (typeof window === 'undefined') return 'default';

  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Extract subdomain as tenant ID
  if (parts.length >= 3) {
    return parts[0];
  }

  return 'default';
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
