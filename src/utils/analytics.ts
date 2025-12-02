// Analytics Tracking System
// Tracks user interactions, events, and usage patterns

import logger from '@/utils/logger'
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = true;

    // Check if analytics is disabled
    if (localStorage.getItem('analytics_disabled') === 'true') {
      this.isEnabled = false;
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  clearUserId() {
    this.userId = undefined;
  }

  enable() {
    this.isEnabled = true;
    localStorage.removeItem('analytics_disabled');
  }

  disable() {
    this.isEnabled = false;
    localStorage.setItem('analytics_disabled', 'true');
  }

  // Track an event
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('📊 Analytics Event:', { event });
    }

    // Send to analytics service
    this.sendEvent(event);
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // In production, send to your analytics backend
      // For now, store in localStorage for demo purposes
      const events = this.getStoredEvents();
      events.push(event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));

      // TODO: Replace with actual analytics service call
      // await fetch('/api/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    } catch (error) {
      logger.error('Failed to send analytics event:', { error });
    }
  }

  private getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('analytics_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Get all stored events (for debugging)
  getEvents(): AnalyticsEvent[] {
    return this.getStoredEvents();
  }

  // Clear all stored events
  clearEvents() {
    localStorage.removeItem('analytics_events');
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export convenience function
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  analyticsService.track(eventName, properties);
}

export default analyticsService;
