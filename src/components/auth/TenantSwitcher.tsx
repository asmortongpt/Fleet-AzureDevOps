/**
 * Tenant Switcher Component
 * Allows SuperAdmins to switch between tenants
 * SECURITY (CRIT-F-004): Only available to SuperAdmin users
 */

import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  vehicleCount: number;
  userCount: number;
  active: boolean;
}

export function TenantSwitcher() {
  const { user, isSuperAdmin, switchTenant, getCurrentTenant } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for SuperAdmins
  if (!isSuperAdmin()) {
    return null;
  }

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
    setCurrentTenantId(getCurrentTenant());
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/v1/tenants', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      } else {
        throw new Error('Failed to load tenants');
      }
    } catch (err) {
      logger.error('[TenantSwitcher] Failed to load tenants', { error: err });
      setError('Unable to load tenants');
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    if (tenantId === currentTenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      await switchTenant(tenantId);
      setCurrentTenantId(tenantId);

      // Reload page to refresh all tenant-specific data
      window.location.reload();
    } catch (err) {
      logger.error('[TenantSwitcher] Failed to switch tenant', { error: err, tenantId });
      setError('Failed to switch tenant. Please try again.');
      setIsLoading(false);
    }
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId);

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="tenant-switcher">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="lg"
            className="shadow-lg rounded-full px-6 gap-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-75">Current Tenant</span>
              <span className="font-semibold" data-testid="current-tenant">
                {currentTenant?.name || user?.tenantName || 'Loading...'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-80"
          sideOffset={8}
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Switch Tenant</span>
            <Badge variant="outline" className="text-xs">
              SuperAdmin
            </Badge>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {error && (
            <div className="p-2">
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {tenants.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No tenants available
              </div>
            ) : (
              tenants.map(tenant => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => handleSwitchTenant(tenant.id)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  disabled={!tenant.active || isLoading}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{tenant.name}</p>
                      {tenant.id === currentTenantId && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {tenant.plan}
                      </Badge>
                      {!tenant.active && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {tenant.vehicleCount} vehicles • {tenant.userCount} users
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>

          <DropdownMenuSeparator />

          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTenants}
              className="w-full justify-start text-xs"
              disabled={isLoading}
            >
              Refresh Tenant List
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Inline Tenant Switcher (for use in header/navbar)
 */
export function InlineTenantSwitcher() {
  const { user, isSuperAdmin, switchTenant, getCurrentTenant } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only show for SuperAdmins
  if (!isSuperAdmin()) {
    return null;
  }

  useEffect(() => {
    loadTenants();
    setCurrentTenantId(getCurrentTenant());
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/v1/tenants', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      logger.error('[InlineTenantSwitcher] Failed to load tenants', { error: err });
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    if (tenantId === currentTenantId) return;

    setIsLoading(true);

    try {
      await switchTenant(tenantId);
      setCurrentTenantId(tenantId);
      window.location.reload();
    } catch (err) {
      logger.error('[InlineTenantSwitcher] Failed to switch tenant', { error: err });
      setIsLoading(false);
    }
  };

  const currentTenant = tenants.find(t => t.id === currentTenantId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isLoading}
        >
          <Building2 className="w-4 h-4" />
          <span className="max-w-32 truncate" data-testid="current-tenant">
            {currentTenant?.name || user?.tenantName || 'Tenant'}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {tenants.map(tenant => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSwitchTenant(tenant.id)}
            disabled={!tenant.active || isLoading}
            className="flex items-center justify-between"
          >
            <span className="truncate">{tenant.name}</span>
            {tenant.id === currentTenantId && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
