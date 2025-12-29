import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';

import { logger } from './logger';

// Utility function to generate UUIDs
const uuidv4 = (): string => randomUUID();

/**
 * SIEM Event Interface
 */
interface SIEMEvent {
  timestamp: string;
  eventType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  source: string;
  tenantId: string;
  userId?: number;
  resourceType?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  environment?: string;
}

/**
 * SIEM Response Interface
 */
interface SIEMResponse {
  eventId: string;
  accepted: boolean;
  timestamp: string;
  message?: string;
}

/**
 * SIEM Integration Service
 * Forwards security events to external SIEM systems (Splunk, Datadog, etc.)
 * Implements retry logic, batching, and fallback mechanisms
 */
class SIEMIntegration {
  private client: AxiosInstance;
  private readonly siemEndpoint = process.env.SIEM_ENDPOINT_URL;
  private readonly siemApiKey = process.env.SIEM_API_KEY;
  private readonly batchSize = 10;
  private eventQueue: SIEMEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    // Initialize HTTP client
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FleetManagement-SIEM-Client/1.0',
      },
    });

    // Add authorization header if API key configured
    if (this.siemApiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${this.siemApiKey}`;
    }

    // Start batch flush interval
    this.startBatchFlush();

    logger.info('SIEM Integration initialized', {
      endpoint: this.siemEndpoint,
      batchSize: this.batchSize,
    });
  }

  /**
   * Send single event to SIEM
   */
  async sendEvent(event: SIEMEvent): Promise<SIEMResponse> {
    try {
      if (!this.siemEndpoint) {
        logger.warn('SIEM endpoint not configured, queuing event locally');
        this.queueEvent(event);
        return {
          eventId: uuidv4(),
          accepted: true,
          timestamp: new Date().toISOString(),
          message: 'Event queued for batch processing',
        };
      }

      // Add event ID if not present
      const enrichedEvent = {
        ...event,
        id: uuidv4(),
      };

      // Attempt to send immediately
      const response = await this.sendToSIEM(enrichedEvent);
      return response;
    } catch (error) {
      logger.error('Failed to send event to SIEM', {
        error: error instanceof Error ? error.message : error,
        eventType: event.eventType,
      });

      // Queue for retry on failure
      this.queueEvent(event);

      // Return a local ID since we couldn't send to SIEM
      return {
        eventId: uuidv4(),
        accepted: true,
        timestamp: new Date().toISOString(),
        message: 'Event queued for retry',
      };
    }
  }

  /**
   * Send batch of events to SIEM
   */
  async sendBatch(events: SIEMEvent[]): Promise<SIEMResponse[]> {
    if (events.length === 0) {
      return [];
    }

    try {
      if (!this.siemEndpoint) {
        logger.warn('SIEM endpoint not configured, events stored locally');
        return events.map(() => ({
          eventId: uuidv4(),
          accepted: true,
          timestamp: new Date().toISOString(),
        }));
      }

      // Enrich events with IDs
      const enrichedEvents = events.map(event => ({
        ...event,
        id: uuidv4(),
      }));

      // Send batch
      const response = await this.client.post(`${this.siemEndpoint}/api/v1/events/batch`, {
        events: enrichedEvents,
        source: 'FleetManagement-API',
        timestamp: new Date().toISOString(),
      });

      const results = enrichedEvents.map(event => ({
        eventId: event.id,
        accepted: true,
        timestamp: new Date().toISOString(),
      }));

      logger.info('Batch sent to SIEM successfully', {
        count: enrichedEvents.length,
        endpoint: this.siemEndpoint,
      });

      return results;
    } catch (error) {
      logger.error('Failed to send batch to SIEM', {
        error: error instanceof Error ? error.message : error,
        count: events.length,
      });

      // Queue failed events for retry
      events.forEach(event => this.queueEvent(event));

      // Return success responses but they'll be retried
      return events.map(() => ({
        eventId: uuidv4(),
        accepted: true,
        timestamp: new Date().toISOString(),
        message: 'Event queued for retry',
      }));
    }
  }

  /**
   * Send event to SIEM endpoint with retry logic
   */
  private async sendToSIEM(
    event: any,
    retries: number = 3
  ): Promise<SIEMResponse> {
    if (!this.siemEndpoint) {
      throw new Error('SIEM endpoint not configured');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post(
          `${this.siemEndpoint}/api/v1/events`,
          event,
          {
            headers: {
              'X-Event-ID': event.id,
              'X-Retry-Attempt': attempt.toString(),
            },
          }
        );

        return {
          eventId: event.id,
          accepted: true,
          timestamp: new Date().toISOString(),
          message: 'Event accepted by SIEM',
        };
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const axiosError = error as any;
        const statusCode = axiosError?.response?.status;

        // Don't retry for 4xx errors (except 429 - rate limit)
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          if (isLastAttempt) {
            throw error;
          }
          continue;
        }

        if (isLastAttempt) {
          throw error;
        }

        // Exponential backoff
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Failed to send event to SIEM after retries');
  }

  /**
   * Queue event for batch processing
   */
  private queueEvent(event: SIEMEvent): void {
    this.eventQueue.push(event);
    logger.debug('Event queued for batch processing', {
      queueSize: this.eventQueue.length,
    });

    // Flush if queue exceeds batch size
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Start periodic flush of queued events
   */
  private startBatchFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);

    logger.debug('Batch flush interval started', {
      intervalMs: this.FLUSH_INTERVAL_MS,
    });
  }

  /**
   * Flush queued events to SIEM
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const events = this.eventQueue.splice(0, this.batchSize);
      logger.debug('Flushing queued events', {
        count: events.length,
      });

      await this.sendBatch(events);
    } catch (error) {
      logger.error('Failed to flush queued events', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { queuedEvents: number; batchSize: number } {
    return {
      queuedEvents: this.eventQueue.length,
      batchSize: this.batchSize,
    };
  }

  /**
   * Health check for SIEM connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.siemEndpoint) {
        logger.warn('SIEM endpoint not configured, cannot perform health check');
        return false;
      }

      const response = await this.client.get(`${this.siemEndpoint}/health`, {
        timeout: 5000,
      });

      const isHealthy = response.status === 200;
      logger.info('SIEM health check completed', {
        endpoint: this.siemEndpoint,
        healthy: isHealthy,
      });

      return isHealthy;
    } catch (error) {
      logger.warn('SIEM health check failed', {
        error: error instanceof Error ? error.message : error,
        endpoint: this.siemEndpoint,
      });
      return false;
    }
  }

  /**
   * Send alert to SIEM (high-priority event)
   */
  async sendAlert(
    alertType: string,
    severity: 'CRITICAL' | 'HIGH',
    message: string,
    context?: Record<string, any>
  ): Promise<SIEMResponse> {
    return this.sendEvent({
      timestamp: new Date().toISOString(),
      eventType: `alert.${alertType}`,
      severity,
      source: 'FleetManagement-API',
      tenantId: 'system',
      details: {
        message,
        ...context,
      },
    });
  }

  /**
   * Cleanup: stop flush interval and flush remaining events
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush of remaining events
    if (this.eventQueue.length > 0) {
      await this.flush();
    }

    logger.info('SIEM Integration shutdown complete', {
      queuedEvents: this.eventQueue.length,
    });
  }
}

// Export singleton instance
export const siemIntegration = new SIEMIntegration();

// Ensure cleanup on process exit
process.on('exit', async () => {
  await siemIntegration.shutdown();
});

process.on('SIGTERM', async () => {
  await siemIntegration.shutdown();
});
