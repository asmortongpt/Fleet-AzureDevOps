import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import type { FeatureFlagKey } from '@/types/feature-flags';

export const useFeatureFlag = (key: FeatureFlagKey): boolean => {
    const { isEnabled } = useFeatureFlags();
    return isEnabled(key);
};
