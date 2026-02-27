import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { TypographyValidator, TextTruncationIssue, FontMetrics, ContrastIssue } from '../TypographyValidator';
import { logger } from '../../lib/logger';

/**
 * Result interface for typography validation
 */
export interface TypographyAgentResult {
  truncationIssues: TextTruncationIssue[];
  contentTests: {
    longText: { passed: boolean; tested: number };
    multiLanguage: { passed: boolean; tested: number };
    specialCharacters: { passed: boolean; tested: number };
  };
  fontMetrics: FontMetrics;
  contrastIssues: ContrastIssue[];
  timestamp: number;
  duration: number;
}

/**
 * Typography Agent
 * Validates text handling, font loading, and contrast compliance
 */
export class TypographyAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private validator: TypographyValidator;
  private results: TypographyAgentResult | null = null;

  private readonly baseUrl: string;
  private readonly PAGES = ['/', '/vehicles', '/drivers', '/dashboard'];

  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.validator = new TypographyValidator();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing TypographyAgent');
      await this.screenshotCapture.launch();
      logger.debug('TypographyAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TypographyAgent', { error });
      throw error;
    }
  }

  /**
   * Execute typography validation
   */
  async execute<T = TypographyAgentResult>(): Promise<T> {
    try {
      logger.debug('Starting typography validation');
      const startTime = Date.now();

      const truncationIssues: TextTruncationIssue[] = [];

      // Test each page
      for (const page of this.PAGES) {
        try {
          logger.debug('Capturing typography metrics for page', { page });
          await this.screenshotCapture.capture({
            url: `${this.baseUrl}${page}`,
            width: 1440,
            height: 1080
          });

          const pageIssues = await this.validator.detectTruncation();
          truncationIssues.push(...pageIssues);
        } catch (pageError) {
          logger.warn('Error processing page', { page, error: pageError });
          // Continue with other pages even if one fails
        }
      }

      const contentTests = await this.validator.validateContent();
      const fontMetrics = await this.validator.checkFontLoading();
      const contrastIssues = await this.validator.verifyContrast();

      this.results = {
        truncationIssues,
        contentTests,
        fontMetrics,
        contrastIssues,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      logger.debug('Typography validation complete', {
        duration: this.results.duration,
        truncationCount: truncationIssues.length,
        contrastIssuesCount: contrastIssues.length
      });

      return this.results as T;
    } catch (error) {
      logger.error('Typography validation failed', { error });
      throw error;
    }
  }

  /**
   * Get validation results
   */
  getResults<T = TypographyAgentResult>(): T | null {
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
