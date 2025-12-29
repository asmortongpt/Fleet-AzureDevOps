import React, { createContext, useContext, useCallback, ReactNode } from 'react';

import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import type { FeatureFlagKey } from '@/types/feature-flags';
import { FEATURE_FLAGS } from '@/types/feature-flags';

interface FeatureFlagContextType {
    isEnabled: (featureKey: FeatureFlagKey) => boolean;
    getAllFlags: () => Record<FeatureFlagKey, boolean>;
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

    const isEnabled = useCallback((featureKey: FeatureFlagKey): boolean => {
        const flagMetadata = FEATURE_FLAGS[featureKey];
        if (!flagMetadata) {
            console.warn(`Unknown feature flag: ${featureKey}`);
            return false;
        }

        // 1. Check if super admin (bypass flags)
        if (user?.role === 'SuperAdmin') return true;

        // 2. Check tenant settings (database-backed feature flags)
        if (settings?.features && settings.features[featureKey] !== undefined) {
            if (!settings.features[featureKey]) return false;
        }

        // 3. Check environment/global flags
        // @ts-ignore - import.meta.env dynamic access
        const envKey = `VITE_FEATURE_${featureKey.toUpperCase().replace(/-/g, '_')}`;
        const envFlag = import.meta.env[envKey];

        if (envFlag === 'false') return false;
        if (envFlag === 'true') return true;

        // 4. Check minimum plan requirement
        if (flagMetadata.minimumPlan && settings?.plan) {
            const planHierarchy = ['free', 'basic', 'professional', 'enterprise'];
            const requiredLevel = planHierarchy.indexOf(flagMetadata.minimumPlan);
            const currentLevel = planHierarchy.indexOf(settings.plan);
            if (currentLevel < requiredLevel) return false;
        }

        // 5. Check permission requirements
        if (flagMetadata.requiresPermission) {
            if (!user?.permissions?.includes(flagMetadata.requiresPermission)) {
                return false;
            }
        }

        // 6. Default to flag's default enabled state
        return flagMetadata.defaultEnabled;
    }, [user, settings]);

    const getAllFlags = useCallback((): Record<FeatureFlagKey, boolean> => {
        const flags = {} as Record<FeatureFlagKey, boolean>;
        for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]) {
            flags[key] = isEnabled(key);
        }
        return flags;
    }, [isEnabled]);

    return (
        <FeatureFlagContext.Provider value={{ isEnabled, getAllFlags }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};
