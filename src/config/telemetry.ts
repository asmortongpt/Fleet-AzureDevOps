/**
 * Telemetry Configuration
 *
 * Environment-based configuration for telemetry and analytics.
 * Supports feature flags, sampling rates, and privacy settings.
 */

export enum TelemetryLevel {
  NONE = 'none',           // No telemetry
  ESSENTIAL = 'essential', // Only critical errors and essential metrics
  STANDARD = 'standard',   // Standard usage analytics
  DETAILED = 'detailed',   // Detailed behavior analytics
}

export enum AnalyticsProvider {
  NONE = 'none',
  CONSOLE = 'console',       // Development only
  CUSTOM = 'custom',         // Custom backend
  GOOGLE_ANALYTICS = 'ga',   // Google Analytics
  MIXPANEL = 'mixpanel',     // Mixpanel
  SEGMENT = 'segment',       // Segment
}

export interface TelemetryConfig {
  // Core settings
  enabled: boolean;
  level: TelemetryLevel;
  providers: AnalyticsProvider[];

  // Privacy settings
  respectDoNotTrack: boolean;
  anonymizeIp: boolean;
  requireConsent: boolean;
  defaultConsent: boolean;

  // Sampling rates (0-1)
  eventSamplingRate: number;
  errorSamplingRate: number;
  performanceSamplingRate: number;

  // Feature flags
  features: {
    trackPageViews: boolean;
    trackClicks: boolean;
    trackErrors: boolean;
    trackPerformance: boolean;
    trackUserProperties: boolean;
    trackSessionReplay: boolean;
  };

  // Data retention
  retention: {
    localStorageDays: number;
    sessionDurationMinutes: number;
  };

  // Provider-specific configs
  googleAnalytics?: {
    measurementId: string;
    debug: boolean;
  };

  mixpanel?: {
    token: string;
    debug: boolean;
  };

  segment?: {
    writeKey: string;
    debug: boolean;
  };

  custom?: {
    endpoint: string;
    apiKey?: string;
    batchSize: number;
    flushInterval: number; // milliseconds
  };

  // Error reporting (Sentry-like)
  errorReporting?: {
    enabled: boolean;
    dsn?: string;
    environment: string;
    sampleRate: number;
    tracesSampleRate: number;
    ignoreErrors: string[];
  };
}

/**
 * Get environment name
 */
function getEnvironment(): string {
  if (import.meta.env.MODE === 'production') return 'production';
  if (import.meta.env.MODE === 'staging') return 'staging';
  if (import.meta.env.MODE === 'test') return 'test';
  return 'development';
}

/**
 * Check if user has Do Not Track enabled
 */
function hasDoNotTrack(): boolean {
  if (typeof window === 'undefined') return false;

  const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
}

/**
 * Default configuration for development
 */
const developmentConfig: TelemetryConfig = {
  enabled: true,
  level: TelemetryLevel.DETAILED,
  providers: [AnalyticsProvider.CONSOLE],

  respectDoNotTrack: true,
  anonymizeIp: true,
  requireConsent: false,
  defaultConsent: true,

  eventSamplingRate: 1.0,
  errorSamplingRate: 1.0,
  performanceSamplingRate: 1.0,

  features: {
    trackPageViews: true,
    trackClicks: true,
    trackErrors: true,
    trackPerformance: true,
    trackUserProperties: true,
    trackSessionReplay: false,
  },

  retention: {
    localStorageDays: 7,
    sessionDurationMinutes: 30,
  },

  custom: {
    endpoint: '/api/analytics',
    batchSize: 10,
    flushInterval: 5000,
  },

  errorReporting: {
    enabled: true,
    environment: 'development',
    sampleRate: 1.0,
    tracesSampleRate: 1.0,
    ignoreErrors: ['ResizeObserver loop limit exceeded'],
  },
};

/**
 * Default configuration for production
 */
const productionConfig: TelemetryConfig = {
  enabled: true,
  level: TelemetryLevel.STANDARD,
  providers: [AnalyticsProvider.CUSTOM],

  respectDoNotTrack: true,
  anonymizeIp: true,
  requireConsent: true,
  defaultConsent: false,

  eventSamplingRate: 0.1, // Sample 10% of events
  errorSamplingRate: 1.0, // Track all errors
  performanceSamplingRate: 0.05, // Sample 5% of performance metrics

  features: {
    trackPageViews: true,
    trackClicks: true,
    trackErrors: true,
    trackPerformance: true,
    trackUserProperties: true,
    trackSessionReplay: false,
  },

  retention: {
    localStorageDays: 30,
    sessionDurationMinutes: 30,
  },

  custom: {
    endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/analytics',
    apiKey: import.meta.env.VITE_ANALYTICS_API_KEY,
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
  },

  errorReporting: {
    enabled: true,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    sampleRate: 0.1,
    tracesSampleRate: 0.1,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'NetworkError',
    ],
  },
};

/**
 * Configuration for staging environment
 */
const stagingConfig: TelemetryConfig = {
  ...productionConfig,
  level: TelemetryLevel.DETAILED,
  requireConsent: false,
  defaultConsent: true,
  eventSamplingRate: 0.5,
  performanceSamplingRate: 0.5,
  errorReporting: {
    ...productionConfig.errorReporting!,
    environment: 'staging',
    sampleRate: 1.0,
    tracesSampleRate: 1.0,
  },
};

/**
 * Configuration for testing
 */
const testConfig: TelemetryConfig = {
  ...developmentConfig,
  enabled: false,
  providers: [AnalyticsProvider.NONE],
};

/**
 * Get configuration based on environment
 */
function getConfigByEnvironment(): TelemetryConfig {
  const env = getEnvironment();

  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'test':
      return testConfig;
    default:
      return developmentConfig;
  }
}

/**
 * Get active telemetry configuration
 */
export function getTelemetryConfig(): TelemetryConfig {
  const config = getConfigByEnvironment();

  // Override if user has Do Not Track enabled
  if (config.respectDoNotTrack && hasDoNotTrack()) {
    return {
      ...config,
      enabled: false,
      level: TelemetryLevel.NONE,
      providers: [AnalyticsProvider.NONE],
    };
  }

  // Check localStorage for user preferences
  if (typeof window !== 'undefined') {
    const userOptOut = localStorage.getItem('telemetry_opt_out');
    if (userOptOut === 'true') {
      return {
        ...config,
        enabled: false,
        level: TelemetryLevel.NONE,
      };
    }

    // Check for consent requirement
    if (config.requireConsent) {
      const userConsent = localStorage.getItem('telemetry_consent');
      if (userConsent !== 'true') {
        return {
          ...config,
          enabled: false,
        };
      }
    }
  }

  return config;
}

/**
 * Map event types to telemetry levels
 */
export const EventLevelMapping = {
  // Essential events (tracked at all levels except NONE)
  error: TelemetryLevel.ESSENTIAL,
  critical_error: TelemetryLevel.ESSENTIAL,
  app_crash: TelemetryLevel.ESSENTIAL,

  // Standard events
  page_view: TelemetryLevel.STANDARD,
  user_login: TelemetryLevel.STANDARD,
  user_logout: TelemetryLevel.STANDARD,
  feature_used: TelemetryLevel.STANDARD,

  // Detailed events
  click: TelemetryLevel.DETAILED,
  hover: TelemetryLevel.DETAILED,
  scroll: TelemetryLevel.DETAILED,
  input: TelemetryLevel.DETAILED,

  // Map-specific events
  map_loaded: TelemetryLevel.STANDARD,
  map_provider_selected: TelemetryLevel.STANDARD,
  map_zoom: TelemetryLevel.DETAILED,
  map_pan: TelemetryLevel.DETAILED,
  marker_click: TelemetryLevel.STANDARD,
  route_calculated: TelemetryLevel.STANDARD,
} as const;

/**
 * Check if event should be tracked based on current telemetry level
 */
export function shouldTrackEvent(
  eventType: keyof typeof EventLevelMapping,
  config: TelemetryConfig = getTelemetryConfig()
): boolean {
  if (!config.enabled) return false;

  const requiredLevel = EventLevelMapping[eventType];
  if (!requiredLevel) return true; // Track unknown events by default

  const levelHierarchy = {
    [TelemetryLevel.NONE]: 0,
    [TelemetryLevel.ESSENTIAL]: 1,
    [TelemetryLevel.STANDARD]: 2,
    [TelemetryLevel.DETAILED]: 3,
  };

  return levelHierarchy[config.level] >= levelHierarchy[requiredLevel];
}

/**
 * Check if event should be sampled
 */
export function shouldSampleEvent(
  eventType: 'event' | 'error' | 'performance',
  config: TelemetryConfig = getTelemetryConfig()
): boolean {
  const rate = eventType === 'error'
    ? config.errorSamplingRate
    : eventType === 'performance'
    ? config.performanceSamplingRate
    : config.eventSamplingRate;

  return Math.random() < rate;
}

export default getTelemetryConfig;
