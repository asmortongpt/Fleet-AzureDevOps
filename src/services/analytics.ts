/**
 * Analytics Service
 *
 * Abstract analytics provider interface supporting multiple backends:
 * - Google Analytics
 * - Mixpanel
 * - Custom backend
 * - Console (development)
 *
 * Features:
 * - Event tracking
 * - User property tracking
 * - Session tracking
 * - Error tracking
 * - Performance metrics
 * - Automatic batching and retry
 */

import {
  getTelemetryConfig,
  shouldTrackEvent,
  shouldSampleEvent,
  AnalyticsProvider,
  type TelemetryConfig,
} from '../config/telemetry';
import { PrivacyManager, DataSanitizer } from '../utils/privacy';
import logger from '@/utils/logger'

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  category?: string;
}

/**
 * User properties
 */
export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  [key: string]: any;
}

/**
 * Session data
 */
export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Error event
 */
export interface ErrorEvent {
  name: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

/**
 * Abstract Analytics Provider
 */
export abstract class AnalyticsBackend {
  protected config: TelemetryConfig;

  constructor(config: TelemetryConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract trackEvent(event: AnalyticsEvent): Promise<void>;
  abstract setUserProperties(properties: UserProperties): Promise<void>;
  abstract trackError(error: ErrorEvent): Promise<void>;
  abstract trackPerformance(metric: PerformanceMetric): Promise<void>;
  abstract flush(): Promise<void>;
}

/**
 * Console Analytics Backend (for development)
 */
class ConsoleBackend extends AnalyticsBackend {
  async initialize(): Promise<void> {
    logger.info('📊 Console Analytics initialized');
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    logger.info('📊 Event:', { name: event.name, properties: event.properties });
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    logger.info('👤 User properties:', { properties });
  }

  async trackError(error: ErrorEvent): Promise<void> {
    logger.error('❌ Error tracked:', { error.name, error.message });
  }

  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    logger.info('⚡ Performance:', { metric.name, metric.value, metric.unit });
  }

  async flush(): Promise<void> {
    logger.info('📊 Flush (no-op for console)');
  }
}

/**
 * Custom Backend (sends to your own API)
 */
class CustomBackend extends AnalyticsBackend {
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: number;

  async initialize(): Promise<void> {
    if (!this.config.custom?.endpoint) {
      throw new Error('Custom backend requires endpoint configuration');
    }

    // Start flush timer
    this.startFlushTimer();
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const sanitizedEvent = {
      ...event,
      properties: event.properties ? DataSanitizer.scrubObject(event.properties) : undefined,
      timestamp: event.timestamp || Date.now(),
    };

    this.eventQueue.push(sanitizedEvent);

    // Auto-flush if queue is full
    if (this.eventQueue.length >= (this.config.custom?.batchSize || 50)) {
      await this.flush();
    }
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    const sanitized = DataSanitizer.scrubObject(properties);

    await this.sendToBackend('/user-properties', sanitized);
  }

  async trackError(error: ErrorEvent): Promise<void> {
    const sanitized = DataSanitizer.scrubError(error as any);

    await this.sendToBackend('/errors', sanitized);
  }

  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    await this.sendToBackend('/performance', metric);
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    await this.sendToBackend('/events/batch', { events });
  }

  private async sendToBackend(path: string, data: any): Promise<void> {
    const endpoint = this.config.custom!.endpoint;

    try {
      const response = await fetch(`${endpoint}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.custom?.apiKey && {
            'X-API-Key': this.config.custom.apiKey,
          }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send analytics to backend:', { error });
      // Re-queue events on failure
      if (path.includes('/events/batch') && data.events) {
        this.eventQueue.unshift(...data?.events);
      }
    }
  }

  private startFlushTimer(): void {
    const interval = this.config.custom?.flushInterval || 30000;

    this.flushTimer = window.setInterval(() => {
      this.flush().catch(console.error);
    }, interval);
  }

  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

/**
 * Google Analytics Backend
 */
class GoogleAnalyticsBackend extends AnalyticsBackend {
  private gtag?: (...args: any[]) => void;

  async initialize(): Promise<void> {
    if (!this.config.googleAnalytics?.measurementId) {
      throw new Error('Google Analytics requires measurementId');
    }

    // Load gtag.js
    await this.loadGtagScript();
  }

  private async loadGtagScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalytics!.measurementId}`;

      script.onload = () => {
        // Initialize gtag
        (window as any).dataLayer = (window as any).dataLayer || [];
        this.gtag = function gtag(...args: any[]) {
          (window as any).dataLayer.push(args);
        };

        this.gtag('js', new Date());
        this.gtag('config', this.config.googleAnalytics!.measurementId, {
          anonymize_ip: this.config.anonymizeIp,
          debug_mode: this.config.googleAnalytics!.debug,
        });

        resolve();
      };

      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.gtag) return;

    this.gtag('event', event.name, {
      event_category: event.category,
      ...event.properties,
    });
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.gtag) return;

    this.gtag('set', 'user_properties', {
      ...properties,
      email: undefined, // Don't send email to GA
    });

    if (properties.userId) {
      this.gtag('set', { user_id: await DataSanitizer.hashIdentifier(properties.userId) });
    }
  }

  async trackError(error: ErrorEvent): Promise<void> {
    if (!this.gtag) return;

    this.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
    });
  }

  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    if (!this.gtag) return;

    this.gtag('event', 'timing_complete', {
      name: metric.name,
      value: metric.value,
      event_category: 'performance',
    });
  }

  async flush(): Promise<void> {
    // Google Analytics handles flushing automatically
  }
}

/**
 * Mixpanel Backend
 */
class MixpanelBackend extends AnalyticsBackend {
  private mixpanel?: any;

  async initialize(): Promise<void> {
    if (!this.config.mixpanel?.token) {
      throw new Error('Mixpanel requires token');
    }

    await this.loadMixpanel();
  }

  private async loadMixpanel(): Promise<void> {
    // In production, load Mixpanel SDK dynamically
    // For now, assume it's loaded globally
    if (typeof (window as any).mixpanel !== 'undefined') {
      this.mixpanel = (window as any).mixpanel;
      this.mixpanel.init(this.config.mixpanel!.token, {
        debug: this.config.mixpanel!.debug,
        track_pageview: false,
        persistence: 'localStorage',
      });
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.mixpanel) return;

    this.mixpanel.track(event.name, event.properties);
  }

  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.mixpanel) return;

    if (properties.userId) {
      this.mixpanel.identify(await DataSanitizer.hashIdentifier(properties.userId));
    }

    this.mixpanel.people.set(properties);
  }

  async trackError(error: ErrorEvent): Promise<void> {
    if (!this.mixpanel) return;

    this.mixpanel.track('Error', {
      error_name: error.name,
      error_message: error.message,
    });
  }

  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    if (!this.mixpanel) return;

    this.mixpanel.track('Performance Metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit,
    });
  }

  async flush(): Promise<void> {
    // Mixpanel handles flushing automatically
  }
}

/**
 * Main Analytics Service
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private backends: AnalyticsBackend[] = [];
  private config: TelemetryConfig;
  private session: SessionData;
  private userProperties: UserProperties = {};

  private constructor() {
    this.config = getTelemetryConfig();
    this.session = this.initializeSession();
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics backends
   */
  private async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Initialize each configured provider
    for (const provider of this.config.providers) {
      try {
        const backend = this.createBackend(provider);
        if (backend) {
          await backend.initialize();
          this.backends.push(backend);
        }
      } catch (error) {
        logger.error('Error', { error: `Failed to initialize ${provider} analytics:`, error });
      }
    }

    // Set up session tracking
    this.startSessionTracking();

    // Set up page unload handler
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Create backend instance
   */
  private createBackend(provider: AnalyticsProvider): AnalyticsBackend | null {
    switch (provider) {
      case AnalyticsProvider.CONSOLE:
        return new ConsoleBackend(this.config);
      case AnalyticsProvider.CUSTOM:
        return new CustomBackend(this.config);
      case AnalyticsProvider.GOOGLE_ANALYTICS:
        return new GoogleAnalyticsBackend(this.config);
      case AnalyticsProvider.MIXPANEL:
        return new MixpanelBackend(this.config);
      default:
        return null;
    }
  }

  /**
   * Initialize session
   */
  private initializeSession(): SessionData {
    const sessionKey = 'analytics_session';
    const stored = typeof window !== 'undefined' ? localStorage.getItem(sessionKey) : null;

    if (stored) {
      try {
        const session = JSON.parse(stored);
        const sessionTimeout = this.config.retention.sessionDurationMinutes * 60 * 1000;

        // Check if session is still valid
        if (Date.now() - session.lastActivity < sessionTimeout) {
          return {
            ...session,
            lastActivity: Date.now(),
          };
        }
      } catch {
        // Invalid session data, create new
      }
    }

    // Create new session
    const newSession: SessionData = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
    };

    this.saveSession(newSession);
    return newSession;
  }

  /**
   * Save session to localStorage
   */
  private saveSession(session: SessionData): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_session', JSON.stringify(session));
    }
  }

  /**
   * Start session tracking
   */
  private startSessionTracking(): void {
    if (typeof window === 'undefined') return;

    // Update last activity on user interaction
    const updateActivity = () => {
      this.session.lastActivity = Date.now();
      this.saveSession(this.session);
    };

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true, once: false });
    });
  }

  /**
   * Track event
   */
  async track(name: string, properties?: Record<string, any>, category?: string): Promise<void> {
    if (!this.config.enabled) return;

    // Check if event should be tracked
    if (!shouldTrackEvent(name as any, this.config)) return;

    // Check sampling
    if (!shouldSampleEvent('event', this.config)) return;

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        sessionId: this.session.sessionId,
        timestamp: Date.now(),
      },
      category,
      timestamp: Date.now(),
    };

    // Update session
    this.session.events++;
    this.saveSession(this.session);

    // Send to all backends
    await Promise.all(
      this.backends.map(backend =>
        backend.trackEvent(event).catch(err =>
          logger.error('Backend tracking error:', { err })
        )
      )
    );
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    if (!this.config.features.trackPageViews) return;

    this.session.pageViews++;
    this.saveSession(this.session);

    await this.track('page_view', {
      page,
      ...properties,
    }, 'navigation');
  }

  /**
   * Set user properties
   */
  async identify(properties: UserProperties): Promise<void> {
    if (!this.config.features.trackUserProperties) return;

    this.userProperties = { ...this.userProperties, ...properties };

    await Promise.all(
      this.backends.map(backend =>
        backend.setUserProperties(properties).catch(err =>
          logger.error('Backend identify error:', { err })
        )
      )
    );
  }

  /**
   * Track error
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    if (!this.config.features.trackErrors) return;
    if (!shouldSampleEvent('error', this.config)) return;

    const errorEvent: ErrorEvent = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: context ? DataSanitizer.scrubObject(context) : undefined,
      timestamp: Date.now(),
      sessionId: this.session.sessionId,
      userId: this.userProperties.userId,
    };

    await Promise.all(
      this.backends.map(backend =>
        backend.trackError(errorEvent).catch(err =>
          logger.error('Backend error tracking error:', { err })
        )
      )
    );
  }

  /**
   * Track performance metric
   */
  async trackPerformance(name: string, value: number, unit: string = 'ms', metadata?: Record<string, any>): Promise<void> {
    if (!this.config.features.trackPerformance) return;
    if (!shouldSampleEvent('performance', this.config)) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    await Promise.all(
      this.backends.map(backend =>
        backend.trackPerformance(metric).catch(err =>
          logger.error('Backend performance tracking error:', { err })
        )
      )
    );
  }

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.backends.map(backend =>
        backend.flush().catch(err =>
          logger.error('Backend flush error:', { err })
        )
      )
    );
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.session.sessionId;
  }

  /**
   * Get session data
   */
  getSessionData(): SessionData {
    return { ...this.session };
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Export convenience functions
export const trackEvent = (name: string, properties?: Record<string, any>, category?: string) =>
  analytics.track(name, properties, category);

export const trackPageView = (page: string, properties?: Record<string, any>) =>
  analytics.trackPageView(page, properties);

export const identify = (properties: UserProperties) =>
  analytics.identify(properties);

export const trackError = (error: Error, context?: Record<string, any>) =>
  analytics.trackError(error, context);

export const trackPerformance = (name: string, value: number, unit?: string, metadata?: Record<string, any>) =>
  analytics.trackPerformance(name, value, unit, metadata);

export default analytics;
