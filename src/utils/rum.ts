/**
 * Real User Monitoring (RUM) for Map Components
 *
 * Tracks actual user experience metrics including:
 * - Core Web Vitals (LCP, FID, CLS, TTFB, INP)
 * - Map-specific performance metrics
 * - Geographic performance distribution
 * - Device/browser performance breakdown
 * - Custom business metrics
 *
 * Usage:
 * import { RUMTracker } from '@/utils/rum';
 *
 * const rum = new RUMTracker();
 * rum.start();
 */

// ============================================================================
// Types
// ============================================================================

import logger from '@/utils/logger'
export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

export interface MapMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserContext {
  sessionId: string;
  userId?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  connectionType?: string;
  geography?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface PerformanceEvent {
  type: 'web-vital' | 'map-metric' | 'user-interaction' | 'error';
  timestamp: number;
  context: UserContext;
  data: any;
}

// ============================================================================
// Core Web Vitals Thresholds
// ============================================================================

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

// ============================================================================
// RUM Tracker Class
// ============================================================================

export class RUMTracker {
  private context: UserContext;
  private events: PerformanceEvent[] = [];
  private sessionStartTime: number;
  private endpoint?: string;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: number;

  constructor(config: {
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
    userId?: string;
  } = {}) {
    this.endpoint = config.endpoint;
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 30000;
    this.sessionStartTime = Date.now();

    this.context = this.buildUserContext(config.userId);
  }

  /**
   * Starts RUM tracking
   */
  start(): void {
    this.trackWebVitals();
    this.trackNavigationTiming();
    this.trackResourceTiming();
    this.setupAutoFlush();

    logger.info('[RUM] Tracking started', { context: this.context });
  }

  /**
   * Stops RUM tracking
   */
  stop(): void {
    this.flush();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    logger.info('[RUM] Tracking stopped');
  }

  /**
   * Tracks a custom map metric
   */
  trackMapMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: MapMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.recordEvent({
      type: 'map-metric',
      timestamp: Date.now(),
      context: this.context,
      data: metric,
    });
  }

  /**
   * Tracks map initialization
   */
  trackMapInit(duration: number, provider: string): void {
    this.trackMapMetric('map-init', duration, { provider });
  }

  /**
   * Tracks marker rendering
   */
  trackMarkerRender(count: number, duration: number, clustered: boolean): void {
    this.trackMapMetric('marker-render', duration, {
      count,
      clustered,
      markersPerMs: count / duration,
    });
  }

  /**
   * Tracks map interaction
   */
  trackMapInteraction(type: 'zoom' | 'pan' | 'click' | 'filter', duration: number): void {
    this.trackMapMetric(`map-interaction-${type}`, duration);
  }

  /**
   * Tracks tile loading
   */
  trackTileLoad(tileCount: number, duration: number): void {
    this.trackMapMetric('tile-load', duration, { tileCount });
  }

  /**
   * Tracks search operation
   */
  trackSearch(resultCount: number, duration: number, query: string): void {
    this.trackMapMetric('search', duration, {
      resultCount,
      queryLength: query.length,
    });
  }

  /**
   * Tracks Core Web Vitals
   */
  private trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Try to use web-vitals library if available
    this.trackCLS();
    this.trackLCP();
    this.trackFID();
    this.trackTTFB();
    this.trackINP();
  }

  /**
   * Tracks Cumulative Layout Shift (CLS)
   */
  private trackCLS(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let clsEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = clsEntries[0];
          const lastSessionEntry = clsEntries[clsEntries.length - 1];

          if (
            clsEntries.length === 0 ||
            (entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000)
          ) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          } else {
            clsEntries = [entry];
            clsValue = (entry as any).value;
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Report on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportWebVital('CLS', clsValue);
        observer.disconnect();
      }
    });
  }

  /**
   * Tracks Largest Contentful Paint (LCP)
   */
  private trackLCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportWebVital('LCP', lastEntry.startTime);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  /**
   * Tracks First Input Delay (FID)
   */
  private trackFID(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.reportWebVital('FID', fid);
        observer.disconnect();
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  }

  /**
   * Tracks Time to First Byte (TTFB)
   */
  private trackTTFB(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.reportWebVital('TTFB', ttfb);
    }
  }

  /**
   * Tracks Interaction to Next Paint (INP)
   */
  private trackINP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    let maxDuration = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = (entry as any).duration || 0;
        if (duration > maxDuration) {
          maxDuration = duration;
        }
      }
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });

    // Report on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportWebVital('INP', maxDuration);
        observer.disconnect();
      }
    });
  }

  /**
   * Tracks Navigation Timing
   */
  private trackNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.trackMapMetric('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
      this.trackMapMetric('load-complete', navigation.loadEventEnd - navigation.loadEventStart);
      this.trackMapMetric('dom-interactive', navigation.domInteractive - navigation.fetchStart);
    }
  }

  /**
   * Tracks Resource Timing
   */
  private trackResourceTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Track tile loading times
    const tileResources = resources.filter((r) => r.name.includes('tile') || r.name.includes('.png'));
    if (tileResources.length > 0) {
      const avgTileLoad = tileResources.reduce((sum, r) => sum + r.duration, 0) / tileResources.length;
      this.trackMapMetric('avg-tile-load', avgTileLoad, { count: tileResources.length });
    }

    // Track JavaScript bundle size
    const jsResources = resources.filter((r) => r.name.endsWith('.js'));
    const totalJsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    this.trackMapMetric('js-bundle-size', totalJsSize, { count: jsResources.length });
  }

  /**
   * Reports a Web Vital metric
   */
  private reportWebVital(name: string, value: number): void {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    const rating = threshold
      ? value <= threshold.good
        ? 'good'
        : value <= threshold.poor
        ? 'needs-improvement'
        : 'poor'
      : 'good';

    const vital: WebVital = {
      name,
      value,
      rating,
      delta: 0,
      id: this.generateId(),
    };

    this.recordEvent({
      type: 'web-vital',
      timestamp: Date.now(),
      context: this.context,
      data: vital,
    });
  }

  /**
   * Records an event
   */
  private recordEvent(event: PerformanceEvent): void {
    this.events.push(event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flushes events to endpoint
   */
  private flush(): void {
    if (this.events.length === 0) return;

    const batch = [...this.events];
    this.events = [];

    if (this.endpoint) {
      this.sendToEndpoint(batch);
    } else {
      // Log to console if no endpoint configured
      logger.info('[RUM] Metrics:', { batch });
    }
  }

  /**
   * Sends events to analytics endpoint
   */
  private async sendToEndpoint(events: PerformanceEvent[]): Promise<void> {
    if (!this.endpoint) return;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.context.sessionId,
          events,
        }),
        keepalive: true,
      });

      if (!response.ok) {
        logger.error('[RUM] Failed to send metrics:', { statusText: response.statusText });
      }
    } catch (error) {
      logger.error('[RUM] Error sending metrics:', { error });
    }
  }

  /**
   * Sets up automatic flushing
   */
  private setupAutoFlush(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  /**
   * Builds user context
   */
  private buildUserContext(userId?: string): UserContext {
    const ua = navigator.userAgent;
    const screen = window.screen;

    return {
      sessionId: this.generateSessionId(),
      userId,
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(ua),
      browserVersion: this.getBrowserVersion(ua),
      os: this.getOS(ua),
      osVersion: this.getOSVersion(ua),
      screenResolution: `${screen.width}x${screen.height}`,
      connectionType: this.getConnectionType(),
    };
  }

  /**
   * Gets device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Gets browser name
   */
  private getBrowser(ua: string): string {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Gets browser version
   */
  private getBrowserVersion(ua: string): string {
    const match = ua.match(/(Firefox|Chrome|Safari|Edge|Opera)[\/\s](\d+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Gets OS name
   */
  private getOS(ua: string): string {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Gets OS version
   */
  private getOSVersion(ua: string): string {
    const match = ua.match(/(Windows NT|Mac OS X|Android|iOS)[\s\/](\d+[\._\d]*)/);
    return match ? match[2].replace(/_/g, '.') : 'Unknown';
  }

  /**
   * Gets connection type
   */
  private getConnectionType(): string | undefined {
    const nav = navigator as any;
    if (nav.connection) {
      return nav.connection.effectiveType || nav.connection.type;
    }
    return undefined;
  }

  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Gets performance summary
   */
  getPerformanceSummary(): {
    webVitals: Record<string, WebVital>;
    mapMetrics: MapMetric[];
    sessionDuration: number;
  } {
    const webVitals: Record<string, WebVital> = {};
    const mapMetrics: MapMetric[] = [];

    this.events.forEach((event) => {
      if (event.type === 'web-vital') {
        webVitals[event.data.name] = event.data;
      } else if (event.type === 'map-metric') {
        mapMetrics.push(event.data);
      }
    });

    return {
      webVitals,
      mapMetrics,
      sessionDuration: Date.now() - this.sessionStartTime,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let rumInstance: RUMTracker | null = null;

export function initRUM(config?: Parameters<typeof RUMTracker.prototype.constructor>[0]): RUMTracker {
  if (!rumInstance) {
    rumInstance = new RUMTracker(config);
    rumInstance.start();
  }
  return rumInstance;
}

export function getRUM(): RUMTracker | null {
  return rumInstance;
}

// ============================================================================
// Export
// ============================================================================

export default RUMTracker;
