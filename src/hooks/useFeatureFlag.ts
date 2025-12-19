import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

export const useFeatureFlag = (key: string): boolean => {
    const { isEnabled } = useFeatureFlags();
    return isEnabled(key);
};
