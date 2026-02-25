import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import {
  AccessibilityPerformanceValidator,
  WCAGAudit,
  LighthouseScores,
  CoreWebVitals,
  KeyboardNavigation,
  ScreenReaderCompatibility
} from '../AccessibilityPerformanceValidator';
import { logger } from '../../lib/logger';

/**
 * Result interface for accessibility and performance validation
 */
export interface AccessibilityPerformanceResult {
  wcagAudit: WCAGAudit;
  lighthouseScores: LighthouseScores;
  coreWebVitals: CoreWebVitals;
  keyboardNavigation: KeyboardNavigation;
  screenReaderCompatibility: ScreenReaderCompatibility;
  timestamp: number;
  duration: number;
}

/**
 * Accessibility and Performance Agent
 * Validates WCAG compliance, Lighthouse scores, and Core Web Vitals
 */
export class AccessibilityPerformanceAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private validator: AccessibilityPerformanceValidator;
  private results: AccessibilityPerformanceResult | null = null;

  private readonly baseUrl: string;
  private readonly PAGES = ['/', '/vehicles', '/drivers', '/dashboard'];

  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.validator = new AccessibilityPerformanceValidator();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing AccessibilityPerformanceAgent');
      await this.screenshotCapture.launch();
      logger.debug('AccessibilityPerformanceAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AccessibilityPerformanceAgent', { error });
      throw error;
    }
  }

  /**
   * Execute accessibility and performance validation
   */
  async execute<T = AccessibilityPerformanceResult>(): Promise<T> {
    try {
      logger.debug('Starting accessibility and performance validation');
      const startTime = Date.now();

      // Capture pages for analysis
      for (const page of this.PAGES) {
        try {
          logger.debug('Capturing accessibility metrics for page', { page });
          await this.screenshotCapture.capture({
            url: `${this.baseUrl}${page}`,
            width: 1440,
            height: 1080
          });
        } catch (pageError) {
          logger.warn('Error processing page for accessibility check', { page, error: pageError });
          // Continue with other pages even if one fails
        }
      }

      // Run all validations
      const wcagAudit = await this.validator.auditWCAG();
      const lighthouseScores = await this.validator.measureLighthouse();
      const coreWebVitals = await this.validator.measureCoreWebVitals();
      const keyboardNavigation = await this.validator.validateKeyboardNavigation();
      const screenReaderCompatibility = await this.validator.validateScreenReaderCompatibility();

      this.results = {
        wcagAudit,
        lighthouseScores,
        coreWebVitals,
        keyboardNavigation,
        screenReaderCompatibility,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      logger.debug('Accessibility and performance validation complete', {
        duration: this.results.duration,
        wcagCompliant: wcagAudit.level === 'AA',
        lighthousePerformance: lighthouseScores.performance,
        wcagViolations: wcagAudit.violations.length,
        keyboardIssues: keyboardNavigation.issues.length
      });

      return this.results as T;
    } catch (error) {
      logger.error('Accessibility and performance validation failed', { error });
      throw error;
    }
  }

  /**
   * Get validation results
   */
  getResults<T = AccessibilityPerformanceResult>(): T | null {
    return this.results as T | null;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.screenshotCapture.close();
    } catch (error) {
      logger.warn('Error during cleanup', { error });
    }
  }
}
