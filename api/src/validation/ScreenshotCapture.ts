import { chromium, Browser } from 'playwright';
import { logger } from '../lib/logger';
import { AgentConfig } from './agents/BaseAgent';

/**
 * Options for screenshot capture
 */
export interface CaptureOptions {
  url: string;
  width: number;
  height: number;
  waitFor?: string;
}

/**
 * Handles screenshot capture using Playwright
 * Supports multiple breakpoints and full-page screenshots
 */
export class ScreenshotCapture {
  private browser: Browser | null = null;

  constructor(private config: AgentConfig = {}) {}

  /**
   * Launch Playwright browser instance
   */
  async launch(): Promise<void> {
    if (this.browser) return; // Already launched

    logger.debug('Launching Playwright browser');

    this.browser = await chromium.launch({
      headless: this.config.headless !== false
    });

    logger.debug('Browser launched successfully');
  }

  /**
   * Capture screenshot at specified dimensions
   */
  async capture(options: CaptureOptions): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    logger.debug('Capturing screenshot', {
      url: options.url,
      width: options.width,
      height: options.height
    });

    const page = await this.browser.newPage();

    try {
      // Set viewport
      await page.setViewportSize({ width: options.width, height: options.height });

      // Navigate to page
      await page.goto(options.url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout || 30000
      });

      // Wait for optional selector
      if (options.waitFor) {
        logger.debug('Waiting for selector', { selector: options.waitFor });
        await page.waitForSelector(options.waitFor, {
          timeout: this.config.timeout || 30000
        });
      }

      // Capture full page screenshot
      const screenshot = await page.screenshot({ fullPage: true });
      logger.debug('Screenshot captured successfully', {
        size: screenshot.length,
        url: options.url
      });

      return screenshot;
    } catch (error) {
      logger.error('Failed to capture screenshot', { error, url: options.url });
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Analyze screenshot for text overflow issues
   * Returns array of detected overflow elements
   * Placeholder: Will implement with vision AI/OCR in future
   */
  async analyzeTextOverflow(screenshot: Buffer): Promise<any[]> {
    logger.debug('Analyzing screenshot for text overflow', {
      size: screenshot.length
    });

    // Placeholder: Will implement with vision AI/OCR in future
    // For now, return empty array
    return [];
  }

  /**
   * Close browser and cleanup resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      logger.debug('Closing Playwright browser');
      await this.browser.close();
      this.browser = null;
      logger.debug('Browser closed successfully');
    }
  }
}
