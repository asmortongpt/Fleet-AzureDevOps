import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { ImageComparison } from '../ImageComparison';
import { logger } from '../../lib/logger';

/**
 * Visual QA validation results
 */
export interface VisualQAResults {
  screenshots: Record<number, Record<string, Buffer>>;
  issues: VisualIssue[];
  timestamp: number;
  duration: number;
}

/**
 * Visual issue detected by the agent
 */
export interface VisualIssue {
  type: string;
  selector?: string;
  text?: string;
  agent: string;
  page: string;
  severity?: string;
}

/**
 * Visual QA Agent
 * Captures screenshots at all breakpoints and detects visual issues
 */
export class VisualQAAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private imageComparison: ImageComparison;
  private results: VisualQAResults = {
    screenshots: {},
    issues: [],
    timestamp: 0,
    duration: 0
  };

  private readonly BREAKPOINTS = [375, 480, 768, 1024, 1440, 1920];
  private readonly PAGES = ['/', '/vehicles', '/drivers', '/dashboard'];

  constructor(config?: AgentConfig) {
    super(config);
    this.screenshotCapture = new ScreenshotCapture(config);
    this.imageComparison = new ImageComparison();
  }

  /**
   * Initialize the Visual QA Agent
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing VisualQAAgent');
      await this.screenshotCapture.launch();
      logger.debug('VisualQAAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize VisualQAAgent', { error });
      throw error;
    }
  }

  /**
   * Capture screenshots at all 6 breakpoints
   */
  async captureBreakpoints(options: {
    pages: string[];
    breakpoints: number[];
  }): Promise<Record<number, Record<string, Buffer>>> {
    logger.debug('Capturing breakpoints', {
      pageCount: options.pages.length,
      breakpointCount: options.breakpoints.length
    });

    const screenshots: Record<number, Record<string, Buffer>> = {};

    for (const breakpoint of options.breakpoints) {
      screenshots[breakpoint] = {};

      for (const page of options.pages) {
        try {
          const screenshot = await this.screenshotCapture.capture({
            url: `http://localhost:5173${page}`,
            width: breakpoint,
            height: 1080
          });
          screenshots[breakpoint][page] = screenshot;
          logger.debug(`Captured ${page} at ${breakpoint}px`);
        } catch (error) {
          logger.error(`Failed to capture ${page} at ${breakpoint}px`, { error });
          throw error;
        }
      }
    }

    return screenshots;
  }

  /**
   * Analyze page for text overflow issues
   */
  async analyzeForTextOverflow(page: string): Promise<any> {
    logger.debug('Analyzing for text overflow', { page });

    const screenshot = await this.screenshotCapture.capture({
      url: `http://localhost:5173${page}`,
      width: 1920,
      height: 1080
    });

    const issues = await this.screenshotCapture.analyzeTextOverflow(screenshot);

    const result = {
      page,
      screenshot,
      issues,
      severity: issues.length > 5 ? 'critical' : issues.length > 0 ? 'high' : 'none'
    };

    logger.debug('Text overflow analysis complete', {
      page,
      issueCount: issues.length,
      severity: result.severity
    });

    return result;
  }

  /**
   * Capture current state of page at specific breakpoint
   */
  async captureCurrentState(page: string, width: number): Promise<Buffer> {
    return await this.screenshotCapture.capture({
      url: `http://localhost:5173${page}`,
      width,
      height: 1080
    });
  }

  /**
   * Get baseline screenshot (placeholder)
   * In real implementation, load from storage
   */
  async getBaseline(page: string, width: number): Promise<Buffer | null> {
    // Will implement baseline storage in future tasks
    logger.debug('Getting baseline', { page, width });
    return null;
  }

  /**
   * Compare current screenshot against baseline
   */
  async compareWithBaseline(
    current: Buffer,
    baseline: Buffer | null
  ): Promise<any> {
    if (!baseline) {
      logger.debug('No baseline available for comparison');
      return {
        pixelDifference: 0,
        percentChanged: 0,
        screenshot: current,
        message: 'No baseline to compare'
      };
    }

    return await this.imageComparison.compare(current, baseline);
  }

  /**
   * Execute complete visual QA validation
   */
  async execute(): Promise<VisualQAResults> {
    try {
      logger.debug('Starting Visual QA execution');
      const startTime = Date.now();

      // Capture all breakpoints
      const screenshots = await this.captureBreakpoints({
        pages: this.PAGES,
        breakpoints: this.BREAKPOINTS
      });

      // Analyze each page for text overflow
      const issues: VisualIssue[] = [];
      for (const page of this.PAGES) {
        const analysis = await this.analyzeForTextOverflow(page);
        if (analysis.issues.length > 0) {
          issues.push(
            ...analysis.issues.map((issue: any) => ({
              ...issue,
              agent: 'VisualQAAgent',
              page
            }))
          );
        }
      }

      this.results = {
        screenshots,
        issues,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      logger.debug('Visual QA execution complete', {
        duration: this.results.duration,
        issueCount: issues.length
      });

      return this.results;
    } catch (error) {
      logger.error('Visual QA execution failed', { error });
      throw error;
    }
  }

  /**
   * Get the validation results
   */
  getResults(): VisualQAResults {
    return this.results;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.screenshotCapture.close();
  }
}
