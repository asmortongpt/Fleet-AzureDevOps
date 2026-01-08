import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { useAuth } from './AuthContext';

import logger from '@/utils/logger';

interface TenantSettings {
    branding: {
        primaryColor: string;
        logoUrl: string;
        companyName: string;
    };
    features: {
        [key: string]: boolean;
    };
    region: string;
    dateFormat: string;
}

interface TenantContextType {
    tenantId: string | null;
    tenantName: string | undefined;
    settings: TenantSettings | null;
    isLoading: boolean;
    isTenantActive: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

interface TenantProviderProps {
    children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
    const { user, isAuthenticated } = useAuth();
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchTenantSettings = async () => {
            if (!user?.tenantId) return;

            setIsLoading(true);
            try {
                // In a real app, this would fetch from an API
                // const response = await fetch(\`/api/v1/tenants/\${user.tenantId}/settings\`);
                // const data = await response.json();

                // Simulating API call for now
                await new Promise(resolve => setTimeout(resolve, 500));

                // Mock data
                setSettings({
                    branding: {
                        primaryColor: '#0f172a',
                        logoUrl: '/logos/logo-horizontal.svg',
                        companyName: user.tenantName || 'My Organization',
                    },
                    features: {
                        'beta-features': false,
                        'advanced-analytics': true,
                    },
                    region: 'US-East',
                    dateFormat: 'MM/DD/YYYY',
                });
            } catch (error) {
                logger.error('[TenantContext] Failed to fetch settings', { error });
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated && user?.tenantId) {
            fetchTenantSettings();
        } else {
            setSettings(null);
        }
    }, [isAuthenticated, user?.tenantId, user?.tenantName]);

    const value = {
        tenantId: user?.tenantId || null,
        tenantName: user?.tenantName,
        settings,
        isLoading,
        isTenantActive: !!user?.tenantId,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};
