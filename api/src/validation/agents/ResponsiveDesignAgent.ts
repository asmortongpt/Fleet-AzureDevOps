import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { ResponsiveValidator, BreakpointValidation } from '../ResponsiveValidator';
import { logger } from '../../lib/logger';

/**
 * Result from responsive design validation
 */
export interface ResponsiveDesignResult {
  breakpoints: Record<number, BreakpointValidation>;
  issues: Array<{
    type: 'touch-target' | 'readability' | 'reflow';
    selector: string;
    breakpoint: number;
    size?: number;
    fontSize?: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    agent: string;
  }>;
  timestamp: number;
  duration: number;
  networkThrottling?: {
    pageLoadTime: number;
    throttleProfile: '4g' | '3g';
  };
}

/**
 * Responsive Design Agent
 * Validates responsive design across all 6 breakpoints
 * Checks: touch targets, readability, layout reflow
 */
export class ResponsiveDesignAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private validator: ResponsiveValidator;
  private results: ResponsiveDesignResult | null = null;

  private readonly BREAKPOINTS = [375, 480, 768, 1024, 1440, 1920];
  private readonly baseUrl: string;

  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.validator = new ResponsiveValidator();
  }

  /**
   * Initialize the Responsive Design Agent
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing ResponsiveDesignAgent');
      await this.screenshotCapture.launch();
      logger.debug('ResponsiveDesignAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ResponsiveDesignAgent', { error });
      throw error;
    }
  }

  /**
   * Execute responsive design validation across all breakpoints
   */
  async execute<T = ResponsiveDesignResult>(): Promise<T> {
    try {
      logger.debug('Starting responsive design validation');
      const startTime = Date.now();

      const breakpoints: Record<number, BreakpointValidation> = {};
      const allIssues: ResponsiveDesignResult['issues'] = [];

      // Validate each breakpoint
      for (const breakpoint of this.BREAKPOINTS) {
        logger.debug(`Validating breakpoint ${breakpoint}px`);

        // Capture screenshot at breakpoint
        await this.screenshotCapture.capture({
          url: this.baseUrl,
          width: breakpoint,
          height: 1080
        });

        // Validate this breakpoint
        const validation = await this.validator.validate(breakpoint);
        breakpoints[breakpoint] = validation;

        // Convert issues to include breakpoint and severity
        validation.issues.forEach((issue) => {
          allIssues.push({
            ...issue,
            breakpoint,
            severity: this.calculateIssueSeverity(
              issue.type,
              breakpoint
            ) as 'critical' | 'high' | 'medium' | 'low',
            agent: 'ResponsiveDesignAgent'
          });
        });
      }

      this.results = {
        breakpoints,
        issues: allIssues,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      logger.debug('Responsive design validation complete', {
        duration: this.results.duration,
        issueCount: allIssues.length,
        breakpointCount: this.BREAKPOINTS.length
      });

      return this.results as T;
    } catch (error) {
      logger.error('Responsive design validation failed', { error });
      throw error;
    }
  }

  /**
   * Execute with network throttling simulation
   */
  async executeWithThrottling<T = ResponsiveDesignResult>(
    profile: '4g' | '3g'
  ): Promise<T> {
    try {
      logger.debug('Starting validation with network throttling', { profile });

      // Placeholder: In real implementation, would use Playwright throttling
      // https://playwright.dev/docs/api/class-browsercontext#browser-context-route
      const pageLoadTime = profile === '4g' ? 2500 : 5000; // Simulated milliseconds

      const results = await this.execute<ResponsiveDesignResult>();

      results.networkThrottling = {
        pageLoadTime,
        throttleProfile: profile
      };

      logger.debug('Validation with throttling complete', { pageLoadTime });

      return results as T;
    } catch (error) {
      logger.error('Throttled validation failed', { error });
      throw error;
    }
  }

  /**
   * Calculate issue severity based on type and breakpoint
   */
  private calculateIssueSeverity(
    type: string,
    breakpoint: number
  ): string {
    if (type === 'touch-target') {
      // More critical on mobile breakpoints
      return breakpoint <= 768 ? 'critical' : 'high';
    }
    if (type === 'readability') {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Get the validation results
   */
  getResults<T = ResponsiveDesignResult>(): T | null {
    return this.results as T | null;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.screenshotCapture.close();
  }
}
