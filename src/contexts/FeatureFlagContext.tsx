import React, { createContext, useContext, useCallback, ReactNode } from 'react';

import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';

interface FeatureFlagContextType {
    isEnabled: (featureKey: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};

interface FeatureFlagProviderProps {
    children: ReactNode;
}

export const FeatureFlagProvider = ({ children }: FeatureFlagProviderProps) => {
    const { user } = useAuth();
    const { settings } = useTenant();

    const isEnabled = useCallback((featureKey: string): boolean => {
        // 1. Check if super admin (bypass flags)
        if (user?.role === 'SuperAdmin') return true;

        // 2. Check tenant settings
        if (settings?.features && settings.features[featureKey] !== undefined) {
            if (!settings.features[featureKey]) return false;
        }

        // 3. Check environment/global flags
        // Note: We need to use bracket notation to access dynamically
        // @ts-ignore - import.meta.env dynamic access
        const envKey = `VITE_FEATURE_${featureKey.toUpperCase().replace(/-/g, '_')}`;
        const envFlag = import.meta.env[envKey];

        if (envFlag === 'false') return false;

        // Default to true if not explicitly disabled
        return true;
    }, [user, settings]);

    return (
        <FeatureFlagContext.Provider value={{ isEnabled }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};
