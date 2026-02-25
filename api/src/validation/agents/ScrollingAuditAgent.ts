import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { ScrollingDetector, ScrollInstance } from '../ScrollingDetector';
import { logger } from '../../lib/logger';

/**
 * Scrolling audit results
 */
export interface ScrollingAuditResult {
  scrollInstances: ScrollInstance[];
  summary: {
    totalScrolls: number;
    criticalScrolls: number;
    highScrolls: number;
    mediumScrolls: number;
    lowScrolls: number;
    pagesAffected: number;
  };
  timestamp: number;
  duration: number;
}

/**
 * Scrolling Audit Agent
 * Maps all scrolling instances and proposes solutions
 */
export class ScrollingAuditAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private detector: ScrollingDetector;
  private results: ScrollingAuditResult | null = null;

  private readonly baseUrl: string;
  private readonly PAGES = ['/', '/vehicles', '/drivers', '/dashboard'];

  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.detector = new ScrollingDetector();
  }

  /**
   * Initialize the Scrolling Audit Agent
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing ScrollingAuditAgent');
      await this.screenshotCapture.launch();
      logger.debug('ScrollingAuditAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ScrollingAuditAgent', { error });
      throw error;
    }
  }

  /**
   * Execute scrolling audit across all pages
   */
  async execute<T = ScrollingAuditResult>(): Promise<T> {
    try {
      logger.debug('Starting scrolling audit');
      const startTime = Date.now();

      const allScrolls: ScrollInstance[] = [];

      // Audit each page
      for (const page of this.PAGES) {
        logger.debug(`Auditing scrolling on page: ${page}`);

        // Capture page
        await this.screenshotCapture.capture({
          url: `${this.baseUrl}${page}`,
          width: 1440,
          height: 1080
        });

        // Detect scrolling on this page
        const pageScrolls = await this.detector.detectScrolling();
        allScrolls.push(...pageScrolls);
      }

      // Calculate summary
      const summary = this.calculateSummary(allScrolls);

      this.results = {
        scrollInstances: allScrolls,
        summary,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      logger.debug('Scrolling audit complete', {
        duration: this.results.duration,
        totalScrolls: allScrolls.length
      });

      return this.results as T;
    } catch (error) {
      logger.error('Scrolling audit failed', { error });
      throw error;
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(scrolls: ScrollInstance[]): ScrollingAuditResult['summary'] {
    return {
      totalScrolls: scrolls.length,
      criticalScrolls: scrolls.filter((s) => s.severity === 'critical').length,
      highScrolls: scrolls.filter((s) => s.severity === 'high').length,
      mediumScrolls: scrolls.filter((s) => s.severity === 'medium').length,
      lowScrolls: scrolls.filter((s) => s.severity === 'low').length,
      pagesAffected: new Set(scrolls.map((s) => s.selector)).size
    };
  }

  /**
   * Get the validation results
   */
  getResults<T = ScrollingAuditResult>(): T | null {
    return this.results as T | null;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      logger.debug('Cleaning up ScrollingAuditAgent');
      await this.screenshotCapture.close();
      logger.debug('ScrollingAuditAgent cleanup complete');
    } catch (error) {
      logger.error('Error during ScrollingAuditAgent cleanup', { error });
    }
  }
}
