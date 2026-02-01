/**
 * Real User Monitoring (RUM)
 * Track real user interactions, behavior, and experience
 *
 * @module monitoring/rum
 */

import { telemetry , metrics } from './telemetry';
import logger from '@/utils/logger';

/**
 * RUM Event Types
 */
export type RUMEventType =
  | 'pageview'
  | 'click'
  | 'scroll'
  | 'input'
  | 'error'
  | 'navigation'
  | 'custom';

/**
 * RUM Event
 */
export interface RUMEvent {
  type: RUMEventType;
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

/**
 * User Session
 */
export interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  pageViews: number;
  interactions: number;
  errors: number;
  userAgent: string;
  viewport: { width: number; height: number };
  referrer: string;
}

/**
 * RUM Service
 */
class RUMService {
  private events: RUMEvent[] = [];
  private session: UserSession | null = null;
  private sessionId: string = '';
  private initialized: boolean = false;
  private trackingEnabled: boolean = true;

  /**
   * Initialize RUM
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    try {
      // Create session
      this.createSession();

      // Track page views
      this.trackPageViews();

      // Track user interactions
      this.trackClicks();
      this.trackScrolls();
      this.trackInputs();

      // Track errors
      this.trackErrors();

      // Track navigation
      this.trackNavigation();

      // Track visibility changes
      this.trackVisibilityChanges();

      // Send events periodically
      this.startEventFlush();

      this.initialized = true;

      if (import.meta.env.DEV) {
        logger.info('[RUM] Initialized successfully');
        logger.info('[RUM] Session ID:', this.sessionId);
      }
    } catch (error) {
      logger.error('[RUM] Failed to initialize:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create new session
   */
  private createSession(): void {
    this.sessionId = this.generateSessionId();

    this.session = {
      id: this.sessionId,
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrer: document.referrer,
    };

    // Store session in sessionStorage
    try {
      sessionStorage.setItem('rum_session', JSON.stringify(this.session));
    } catch (error) {
      logger.warn('[RUM] Failed to store session:', { error });
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Track page views
   */
  private trackPageViews(): void {
    this.trackEvent('pageview', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });

    if (this.session) {
      this.session.pageViews++;
    }
  }

  /**
   * Track clicks
   */
  private trackClicks(): void {
    document.addEventListener(
      'click',
      (event) => {
        if (!this.trackingEnabled) return;

        const target = event.target as HTMLElement;

        // Get meaningful element info
        const elementInfo = this.getElementInfo(target);

        this.trackEvent('click', {
          ...elementInfo,
          x: event.clientX,
          y: event.clientY,
          timestamp: Date.now(),
        });

        if (this.session) {
          this.session.interactions++;
        }

        // Track specific button clicks
        if (target.matches('button, a, [role="button"]')) {
          metrics.record('user-interaction', 1, {
            type: 'click',
            element: elementInfo.element,
          });
        }
      },
      { passive: true, capture: true }
    );
  }

  /**
   * Track scrolls
   */
  private trackScrolls(): void {
    let scrollTimeout: NodeJS.Timeout;
    let maxScroll = 0;

    window.addEventListener(
      'scroll',
      () => {
        if (!this.trackingEnabled) return;

        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
          const scrollPercentage = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) *
            100
          );

          if (scrollPercentage > maxScroll) {
            maxScroll = scrollPercentage;

            this.trackEvent('scroll', {
              percentage: scrollPercentage,
              depth: window.scrollY,
            });

            // Track scroll milestones
            if (scrollPercentage >= 25 && scrollPercentage < 50) {
              metrics.record('scroll-depth', 25);
            } else if (scrollPercentage >= 50 && scrollPercentage < 75) {
              metrics.record('scroll-depth', 50);
            } else if (scrollPercentage >= 75 && scrollPercentage < 90) {
              metrics.record('scroll-depth', 75);
            } else if (scrollPercentage >= 90) {
              metrics.record('scroll-depth', 100);
            }
          }
        }, 100);
      },
      { passive: true }
    );
  }

  /**
   * Track input events
   */
  private trackInputs(): void {
    document.addEventListener(
      'input',
      (event) => {
        if (!this.trackingEnabled) return;

        const target = event.target as HTMLInputElement;

        // Don't track actual input values for privacy
        this.trackEvent('input', {
          element: target.tagName.toLowerCase(),
          type: target.type,
          name: target.name,
          id: target.id,
          // Don't include value for privacy
        });

        if (this.session) {
          this.session.interactions++;
        }
      },
      { passive: true, capture: true }
    );
  }

  /**
   * Track errors
   */
  private trackErrors(): void {
    window.addEventListener('error', (event) => {
      this.trackEvent('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });

      if (this.session) {
        this.session.errors++;
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error', {
        message: 'Unhandled Promise Rejection',
        reason: event.reason?.toString(),
      });

      if (this.session) {
        this.session.errors++;
      }
    });
  }

  /**
   * Track navigation
   */
  private trackNavigation(): void {
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.trackEvent('navigation', {
        type: 'popstate',
        url: window.location.href,
      });
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      this.trackEvent('navigation', {
        type: 'hashchange',
        hash: window.location.hash,
      });
    });
  }

  /**
   * Track visibility changes
   */
  private trackVisibilityChanges(): void {
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('custom', {
        name: 'visibility-change',
        visible: !document.hidden,
      });

      // End session if page becomes hidden for too long
      if (document.hidden && this.session) {
        setTimeout(() => {
          if (document.hidden) {
            this.endSession();
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    });
  }

  /**
   * Get element information
   */
  private getElementInfo(element: HTMLElement): Record<string, any> {
    return {
      element: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      text: element.textContent?.substring(0, 50) || undefined,
      href: (element as HTMLAnchorElement).href || undefined,
    };
  }

  /**
   * Track custom event
   */
  trackEvent(type: RUMEventType, data: Record<string, any>): void {
    if (!this.initialized || !this.trackingEnabled) {
      return;
    }

    const event: RUMEvent = {
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      userId: this.getUserId(),
    };

    this.events.push(event);

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Send to telemetry
    telemetry.addEvent(`rum.${type}`, data);

    // Log in dev
    if (import.meta.env.DEV) {
      logger.info('[RUM]', { type, ...data });
    }
  }

  /**
   * Get user ID (if authenticated)
   */
  private getUserId(): string | undefined {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id;
      }
    } catch (error) {
      // Ignore
    }
    return undefined;
  }

  /**
   * Start event flush timer
   */
  private startEventFlush(): void {
    // Send events every 30 seconds
    setInterval(() => {
      this.flushEvents();
    }, 30 * 1000);

    // Send events before page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
      this.endSession();
    });
  }

  /**
   * Flush events to server
   */
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    // Skip sending events in development - no endpoint available
    if (import.meta.env.DEV) {
      if (import.meta.env.DEV) {
        logger.debug('[RUM] Skipping event flush in development mode');
      }
      return;
    }

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('/api/v1/monitoring/rum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          session: this.session,
        }),
        // Use keepalive for events sent on unload
        keepalive: true,
      });
    } catch (error) {
      // Only log error once, not repeatedly
      if (!this.flushErrorLogged) {
        logger.warn('[RUM] Event endpoint unavailable, events will be discarded');
        this.flushErrorLogged = true;
      }
      // Don't put events back - they'll accumulate forever if endpoint is down
    }
  }

  private flushErrorLogged = false;

  /**
   * End session
   */
  private endSession(): void {
    if (!this.session) {
      return;
    }

    this.session.endTime = Date.now();

    // Send final session data
    this.trackEvent('custom', {
      name: 'session-end',
      duration: this.session.endTime - this.session.startTime,
      pageViews: this.session.pageViews,
      interactions: this.session.interactions,
      errors: this.session.errors,
    });

    // Flush remaining events
    this.flushEvents();

    // Clear session
    try {
      sessionStorage.removeItem('rum_session');
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Get current session
   */
  getSession(): UserSession | null {
    return this.session;
  }

  /**
   * Get all events
   */
  getEvents(): RUMEvent[] {
    return [...this.events];
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Enable/disable tracking
   */
  setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;

    if (import.meta.env.DEV) {
      logger.info('[RUM] Tracking', enabled ? 'enabled' : 'disabled');
    }
  }

  /**
   * Check if tracking is enabled
   */
  isTrackingEnabled(): boolean {
    return this.trackingEnabled;
  }

  /**
   * Opt out of tracking
   */
  optOut(): void {
    this.setTrackingEnabled(false);
    this.clearEvents();

    try {
      localStorage.setItem('rum_opt_out', 'true');
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Opt in to tracking
   */
  optIn(): void {
    this.setTrackingEnabled(true);

    try {
      localStorage.removeItem('rum_opt_out');
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Check opt-out status
   */
  isOptedOut(): boolean {
    try {
      return localStorage.getItem('rum_opt_out') === 'true';
    } catch (error) {
      return false;
    }
  }
}

/**
 * Global RUM instance
 */
export const rum = new RUMService();

/**
 * Initialize RUM
 */
export function initRUM(): void {
  // Check if user opted out
  if (!rum.isOptedOut()) {
    rum.init();
  } else {
    logger.info('[RUM] User opted out of tracking');
  }
}

/**
 * Track custom RUM event
 */
export function trackRUMEvent(name: string, data?: Record<string, any>): void {
  rum.trackEvent('custom', {
    name,
    ...data,
  });
}
