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
                const response = await fetch(`/api/tenants/${user.tenantId}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch tenant settings: ${response.status}`);
                }

                const payload = await response.json();
                const settingsData = payload?.data?.settings || {};

                setSettings({
                    branding: {
                        primaryColor: settingsData.branding?.primaryColor || '#0f172a',
                        logoUrl: settingsData.branding?.logoUrl || '/logos/logo-horizontal.svg',
                        companyName: settingsData.branding?.companyName || user.tenantName || 'Organization',
                    },
                    features: settingsData.features || {},
                    region: settingsData.region || 'US-East',
                    dateFormat: settingsData.dateFormat || 'MM/DD/YYYY',
                });
            } catch (error) {
                logger.error('[TenantContext] Failed to fetch settings', { error });
                setSettings(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated && user?.tenantId) {
            fetchTenantSettings();
        } else {
            setSettings(null);
        }
    }, [isAuthenticated, user?.tenantId]);

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
