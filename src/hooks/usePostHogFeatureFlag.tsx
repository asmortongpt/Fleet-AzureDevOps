import { useState, useEffect, useCallback } from 'react';
import { analytics } from '@/lib/analytics/provider';

/**
 * Hook to check if a PostHog feature flag is enabled
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const newDashboardEnabled = usePostHogFeatureFlag('new-dashboard');
 *
 *   if (newDashboardEnabled) {
 *     return <NewDashboard />;
 *   }
 *
 *   return <OldDashboard />;
 * }
 * ```
 */
export function usePostHogFeatureFlag(flag: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = () => {
      const enabled = analytics.isFeatureEnabled(flag);
      setIsEnabled(enabled);
      setLoading(false);
    };

    // Check immediately
    checkFlag();

    // Listen for flag updates
    analytics.onFeatureFlags(() => {
      checkFlag();
    });

    // Cleanup: reload flags after a short delay to ensure fresh data
    const timer = setTimeout(() => {
      analytics.reloadFeatureFlags();
    }, 1000);

    return () => clearTimeout(timer);
  }, [flag]);

  // Return false while loading to prevent flash of wrong content
  return loading ? false : isEnabled;
}

/**
 * Hook to get the variant of a PostHog feature flag (for multivariate flags)
 *
 * @example
 * ```tsx
 * function ProductPage() {
 *   const priceDisplayVariant = usePostHogFeatureFlagVariant('price-display');
 *
 *   if (priceDisplayVariant === 'premium') {
 *     return <PremiumPricing />;
 *   }
 *   if (priceDisplayVariant === 'standard') {
 *     return <StandardPricing />;
 *   }
 *   return <DefaultPricing />;
 * }
 * ```
 */
export function usePostHogFeatureFlagVariant(flag: string): string | undefined {
  const [variant, setVariant] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = () => {
      const value = analytics.getFeatureFlag(flag);
      setVariant(typeof value === 'string' ? value : undefined);
      setLoading(false);
    };

    // Check immediately
    checkFlag();

    // Listen for flag updates
    analytics.onFeatureFlags(() => {
      checkFlag();
    });

    // Reload flags
    const timer = setTimeout(() => {
      analytics.reloadFeatureFlags();
    }, 1000);

    return () => clearTimeout(timer);
  }, [flag]);

  return loading ? undefined : variant;
}

/**
 * Hook to get multiple PostHog feature flags at once
 *
 * @example
 * ```tsx
 * function Features() {
 *   const flags = usePostHogFeatureFlags(['new-dashboard', 'dark-mode', 'beta-features']);
 *
 *   return (
 *     <div>
 *       {flags['new-dashboard'] && <NewDashboard />}
 *       {flags['dark-mode'] && <DarkModeToggle />}
 *       {flags['beta-features'] && <BetaFeatures />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePostHogFeatureFlags(
  flags: string[]
): Record<string, boolean> {
  const [flagsState, setFlagsState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlags = () => {
      const newState: Record<string, boolean> = {};
      flags.forEach((flag) => {
        newState[flag] = analytics.isFeatureEnabled(flag);
      });
      setFlagsState(newState);
      setLoading(false);
    };

    // Check immediately
    checkFlags();

    // Listen for flag updates
    analytics.onFeatureFlags(() => {
      checkFlags();
    });

    // Reload flags
    const timer = setTimeout(() => {
      analytics.reloadFeatureFlags();
    }, 1000);

    return () => clearTimeout(timer);
  }, [flags]);

  return loading ? {} : flagsState;
}

/**
 * Hook for A/B testing experiments with PostHog
 *
 * @example
 * ```tsx
 * function CheckoutPage() {
 *   const { variant, trackConversion } = useExperiment('checkout-flow');
 *
 *   const handlePurchase = () => {
 *     trackConversion('purchase_completed', { amount: 99.99 });
 *   };
 *
 *   if (variant === 'one-page') {
 *     return <OnePageCheckout onComplete={handlePurchase} />;
 *   }
 *   return <MultiPageCheckout onComplete={handlePurchase} />;
 * }
 * ```
 */
export function useExperiment(experimentName: string) {
  const variant = usePostHogFeatureFlagVariant(experimentName);

  const trackConversion = useCallback(
    (goalName: string, properties?: Record<string, any>) => {
      analytics.track(`${experimentName} - ${goalName}`, {
        experiment: experimentName,
        variant,
        goal: goalName,
        ...properties,
      });
    },
    [experimentName, variant]
  );

  const trackImpression = useCallback(() => {
    analytics.track(`${experimentName} - Impression`, {
      experiment: experimentName,
      variant,
    });
  }, [experimentName, variant]);

  useEffect(() => {
    if (variant) {
      trackImpression();
    }
  }, [variant, trackImpression]);

  return {
    variant,
    trackConversion,
    trackImpression,
  };
}

/**
 * Hook to conditionally render content based on PostHog feature flag
 *
 * @example
 * ```tsx
 * function App() {
 *   const FeatureGated = useFeatureGate('premium-features');
 *
 *   return (
 *     <div>
 *       <FeatureGated>
 *         <PremiumContent />
 *       </FeatureGated>
 *       <StandardContent />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureGate(flag: string) {
  const isEnabled = usePostHogFeatureFlag(flag);

  return function FeatureGate({ children }: { children: React.ReactNode }) {
    return isEnabled ? <>{children}</> : null;
  };
}

/**
 * Hook to get all active PostHog feature flags
 */
export function useActiveFeatureFlags(): string[] {
  const [activeFlags, setActiveFlags] = useState<string[]>([]);

  useEffect(() => {
    analytics.onFeatureFlags((flags) => {
      setActiveFlags(flags);
    });

    // Reload flags
    analytics.reloadFeatureFlags();
  }, []);

  return activeFlags;
}
