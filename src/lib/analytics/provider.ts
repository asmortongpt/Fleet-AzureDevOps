import posthog from 'posthog-js';
import logger from '@/utils/logger';

/**
 * Analytics Provider using PostHog
 *
 * Provides comprehensive analytics tracking including:
 * - User identification and traits
 * - Event tracking with properties
 * - Page view tracking
 * - Feature flags
 * - A/B testing
 * - Session recording (production only)
 * - Error tracking
 *
 * Environment Variables Required:
 * - VITE_POSTHOG_API_KEY: Your PostHog API key
 * - VITE_POSTHOG_HOST: Your PostHog instance URL (optional, defaults to app.posthog.com)
 *
 * @example
 * ```ts
 * // Initialize in your app
 * analytics.init();
 *
 * // Identify a user
 * analytics.identify('user-123', {
 *   email: 'user@example.com',
 *   name: 'John Doe',
 * });
 *
 * // Track an event
 * analytics.track('Vehicle Created', {
 *   vehicle_id: 'v-123',
 *   make: 'Toyota',
 *   model: 'Camry',
 * });
 *
 * // Check feature flag
 * const isNewDashboardEnabled = analytics.isFeatureEnabled('new-dashboard');
 * ```
 */
export class AnalyticsProvider {
  private initialized = false;
  private userId: string | null = null;

  /**
   * Initialize PostHog analytics
   * Should be called once when the app starts
   */
  init(): void {
    if (this.initialized) {
      logger.warn('Analytics already initialized');
      return;
    }

    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;

    if (!apiKey) {
      logger.warn('PostHog API key not found. Analytics disabled.');
      return;
    }

    try {
      posthog.init(apiKey, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',

        // Callback when PostHog is loaded
        loaded: (ph: any) => {
          if (import.meta.env.DEV) {
            logger.info('PostHog initialized');
            ph.debug(true);
          }
        },

        // Automatic tracking
        capture_pageview: true, // Auto-track page views
        capture_pageleave: true, // Track when user leaves page
        autocapture: true, // Auto-capture clicks, form submissions, etc.

        // Session recording (only in production)
        disable_session_recording: !import.meta.env.PROD,
        session_recording: {
          maskAllInputs: true, // Mask sensitive input fields
          recordCrossOriginIframes: false,
        },

        // Privacy settings
        persistence: 'localStorage+cookie',
        opt_out_capturing_by_default: false,
        respect_dnt: true, // Respect Do Not Track browser setting

        // Performance
        property_blacklist: [], // Properties to never send
        sanitize_properties: (properties: any) => {
          // Remove sensitive data
          const sanitized = { ...properties };
          delete sanitized.password;
          delete sanitized.ssn;
          delete sanitized.credit_card;
          return sanitized;
        },

        // Advanced features
        enable_recording_console_log: import.meta.env.PROD,
        capture_performance: true,

        // Cross-domain tracking
        cross_subdomain_cookie: true,
        secure_cookie: import.meta.env.PROD,
      });

      this.initialized = true;
      logger.info('Analytics initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Identify a user with unique ID and optional traits
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) {
      logger.warn('Analytics not initialized');
      return;
    }

    try {
      this.userId = userId;
      posthog.identify(userId, traits);

      // Set user properties for all future events
      if (traits) {
        posthog.people.set(traits);
      }

      logger.info(`User identified: ${userId}`);
    } catch (error) {
      logger.error('Failed to identify user:', error);
    }
  }

  /**
   * Track a custom event with properties
   */
  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      logger.warn('Analytics not initialized');
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        user_id: this.userId,
        environment: import.meta.env.MODE,
        app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      };

      posthog.capture(event, enrichedProperties);

      if (import.meta.env.DEV) {
        logger.info(`Event tracked: ${event}`, enrichedProperties);
      }
    } catch (error) {
      logger.error(`Failed to track event: ${event}`, error);
    }
  }

  /**
   * Track a page view
   */
  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      logger.warn('Analytics not initialized');
      return;
    }

    try {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        $pathname: window.location.pathname,
        $search: window.location.search,
        $hash: window.location.hash,
        page_name: name,
        ...properties,
      });
    } catch (error) {
      logger.error('Failed to track page view:', error);
    }
  }

  /**
   * Reset analytics (e.g., on logout)
   */
  reset(): void {
    if (!this.initialized) return;

    try {
      posthog.reset();
      this.userId = null;
      logger.info('Analytics reset');
    } catch (error) {
      logger.error('Failed to reset analytics:', error);
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized) return false;

    try {
      return posthog.isFeatureEnabled(flag) || false;
    } catch (error) {
      logger.error(`Failed to check feature flag: ${flag}`, error);
      return false;
    }
  }

  /**
   * Get feature flag value (for multivariate flags)
   */
  getFeatureFlag(flag: string): string | boolean | undefined {
    if (!this.initialized) return undefined;

    try {
      return posthog.getFeatureFlag(flag);
    } catch (error) {
      logger.error(`Failed to get feature flag: ${flag}`, error);
      return undefined;
    }
  }

  /**
   * Listen for feature flag changes
   */
  onFeatureFlags(
    callback: (flags: string[], variants: Record<string, string | boolean>) => void
  ): void {
    if (!this.initialized) return;

    try {
      posthog.onFeatureFlags(callback);
    } catch (error) {
      logger.error('Failed to listen for feature flags:', error);
    }
  }

  /**
   * Reload feature flags manually
   */
  reloadFeatureFlags(): void {
    if (!this.initialized) return;

    try {
      posthog.reloadFeatureFlags();
    } catch (error) {
      logger.error('Failed to reload feature flags:', error);
    }
  }

  /**
   * Get experiment variant for A/B testing
   */
  getExperimentVariant(experiment: string): string | undefined {
    if (!this.initialized) return undefined;

    try {
      const variant = posthog.getFeatureFlag(experiment);
      return typeof variant === 'string' ? variant : undefined;
    } catch (error) {
      logger.error(`Failed to get experiment variant: ${experiment}`, error);
      return undefined;
    }
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('Error Occurred', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Set user properties (super properties)
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.people.set(properties);
    } catch (error) {
      logger.error('Failed to set user properties:', error);
    }
  }

  /**
   * Increment a user property
   */
  incrementUserProperty(property: string, value: number = 1): void {
    if (!this.initialized) return;

    try {
      // PostHog doesn't have increment, so we'll get current value and add to it
      const currentValue = (posthog.get_property(property) as number) || 0;
      posthog.people.set({ [property]: currentValue + value });
    } catch (error) {
      logger.error(`Failed to increment user property: ${property}`, error);
    }
  }

  /**
   * Start session recording
   */
  startRecording(): void {
    if (!this.initialized) return;

    try {
      posthog.startSessionRecording();
    } catch (error) {
      logger.error('Failed to start session recording:', error);
    }
  }

  /**
   * Stop session recording
   */
  stopRecording(): void {
    if (!this.initialized) return;

    try {
      posthog.stopSessionRecording();
    } catch (error) {
      logger.error('Failed to stop session recording:', error);
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string | undefined {
    if (!this.initialized) return undefined;

    try {
      return posthog.get_session_id();
    } catch (error) {
      logger.error('Failed to get session ID:', error);
      return undefined;
    }
  }

  /**
   * Opt user out of analytics
   */
  optOut(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_out_capturing();
      logger.info('User opted out of analytics');
    } catch (error) {
      logger.error('Failed to opt out:', error);
    }
  }

  /**
   * Opt user in to analytics
   */
  optIn(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_in_capturing();
      logger.info('User opted in to analytics');
    } catch (error) {
      logger.error('Failed to opt in:', error);
    }
  }

  /**
   * Check if user has opted out
   */
  hasOptedOut(): boolean {
    if (!this.initialized) return false;

    try {
      return posthog.has_opted_out_capturing();
    } catch (error) {
      logger.error('Failed to check opt-out status:', error);
      return false;
    }
  }

  /**
   * Get distinct ID (anonymous or identified)
   */
  getDistinctId(): string | undefined {
    if (!this.initialized) return undefined;

    try {
      return posthog.get_distinct_id();
    } catch (error) {
      logger.error('Failed to get distinct ID:', error);
      return undefined;
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsProvider();

// Auto-initialize if API key is present
if (import.meta.env.VITE_POSTHOG_API_KEY) {
  analytics.init();
}
