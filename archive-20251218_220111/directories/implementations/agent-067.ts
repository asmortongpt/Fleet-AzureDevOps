```typescript
// src/agents/CTAFleetAgent067.ts
import { Logger } from 'winston';
import { Browser, Page } from 'puppeteer';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { compareImages, createDiff } from 'pixelmatch';
import PNG from 'pngjs';
import { sanitizePath } from 'sanitize-filename';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);

export interface VisualRegressionConfig {
  baselineDir: string;
  resultsDir: string;
  diffDir: string;
  viewport: { width: number; height: number };
  threshold: number;
}

export class CTAFleetAgent067 {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logger: Logger;
  private config: VisualRegressionConfig;

  constructor(logger: Logger, config: Partial<VisualRegressionConfig> = {}) {
    this.logger = logger;
    this.config = {
      baselineDir: config.baselineDir || path.join(__dirname, 'screenshots/baseline'),
      resultsDir: config.resultsDir || path.join(__dirname, 'screenshots/results'),
      diffDir: config.diffDir || path.join(__dirname, 'screenshots/diff'),
      viewport: config.viewport || { width: 1280, height: 720 },
      threshold: config.threshold || 0.1,
    };
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing CTAFleet Agent 067: Visual Regression Testing');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 30000,
      });
      this.page = await this.browser.newPage();
      await this.page.setViewport(this.config.viewport);
      await this.createDirectories();
    } catch (error) {
      this.logger.error('Initialization failed:', error);
      throw new Error(`Failed to initialize browser: ${error.message}`);
    }
  }

  private async createDirectories(): Promise<void> {
    try {
      for (const dir of [this.config.baselineDir, this.config.resultsDir, this.config.diffDir]) {
        if (!fs.existsSync(dir)) {
          await mkdirAsync(dir, { recursive: true });
        }
      }
    } catch (error) {
      this.logger.error('Failed to create directories:', error);
      throw new Error(`Directory creation failed: ${error.message}`);
    }
  }

  async captureScreenshot(url: string, testName: string): Promise<string> {
    if (!this.page) throw new Error('Browser page not initialized');
    
    const sanitizedTestName = sanitizePath(testName);
    const resultPath = path.join(this.config.resultsDir, `${sanitizedTestName}.png`);

    try {
      this.logger.info(`Capturing screenshot for ${testName} at ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.page.waitForTimeout(1000); // Wait for animations
      await this.page.screenshot({ path: resultPath, fullPage: false });
      return resultPath;
    } catch (error) {
      this.logger.error(`Screenshot capture failed for ${testName}:`, error);
      throw new Error(`Failed to capture screenshot: ${error.message}`);
    }
  }

  async compareScreenshots(testName: string): Promise<{ passed: boolean; diffPath?: string; mismatchPercentage?: number }> {
    const sanitizedTestName = sanitizePath(testName);
    const baselinePath = path.join(this.config.baselineDir, `${sanitizedTestName}.png`);
    const resultPath = path.join(this.config.resultsDir, `${sanitizedTestName}.png`);
    const diffPath = path.join(this.config.diffDir, `${sanitizedTestName}_diff.png`);

    try {
      if (!fs.existsSync(baselinePath)) {
        this.logger.warn(`Baseline not found for ${testName}, creating new baseline`);
        await writeFileAsync(baselinePath, await readFileAsync(resultPath));
        return { passed: true };
      }

      const baseline = PNG.PNG.sync.read(await readFileAsync(baselinePath));
      const result = PNG.PNG.sync.read(await readFileAsync(resultPath));
      const { width, height } = baseline;
      const diff = new PNG.PNG({ width, height });

      const mismatchedPixels = compareImages(
        baseline.data,
        result.data,
        diff.data,
        width,
        height,
        { threshold: this.config.threshold }
      );

      const mismatchPercentage = (mismatchedPixels / (width * height)) * 100;
      const passed = mismatchPercentage <= this.config.threshold * 100;

      if (!passed) {
        await writeFileAsync(diffPath, PNG.PNG.sync.write(diff));
        this.logger.warn(`Visual regression detected for ${testName}: ${mismatchPercentage.toFixed(2)}% mismatch`);
      }

      return { passed, diffPath: !passed ? diffPath : undefined, mismatchPercentage };
    } catch (error) {
      this.logger.error(`Comparison failed for ${testName}:`, error);
      throw new Error(`Failed to compare screenshots: ${error.message}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.logger.info('Browser closed successfully');
      }
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
      throw new Error(`Failed to cleanup browser: ${error.message}`);
    }
  }
}

// src/tests/CTAFleetAgent067.test.ts
import { createLogger } from 'winston';
import { CTAFleetAgent067, VisualRegressionConfig } from '../agents/CTAFleetAgent067';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);

describe('CTAFleetAgent067 - Visual Regression Testing', () => {
  let agent: CTAFleetAgent067;
  let testConfig: VisualRegressionConfig;
  const testName = 'test-page';
  const testUrl = 'https://example.com';

  beforeAll(async () => {
    testConfig = {
      baselineDir: path.join(__dirname, 'test-screenshots/baseline'),
      resultsDir: path.join(__dirname, 'test-screenshots/results'),
      diffDir: path.join(__dirname, 'test-screenshots/diff'),
      viewport: { width: 1280, height: 720 },
      threshold: 0.1,
    };

    const logger = createLogger({
      level: 'info',
      format: require('winston').format.json(),
      transports: [new require('winston').transports.Console()],
    });

    agent = new CTAFleetAgent067(logger, testConfig);
    await agent.initialize();
  });

  afterAll(async () => {
    await agent.cleanup();
    // Cleanup test directories
    for (const dir of [testConfig.baselineDir, testConfig.resultsDir, testConfig.diffDir]) {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            await unlinkAsync(path.join(dir, file));
          }
          await rmdirAsync(dir);
        }
      } catch (error) {
        console.error(`Failed to cleanup test directory ${dir}:`, error);
      }
    }
  });

  test('should initialize browser successfully', () => {
    expect(agent).toBeDefined();
  });

  test('should capture screenshot successfully', async () => {
    // Mock page.goto for testing
    jest.spyOn(agent as any, 'page', 'get').mockReturnValue({
      goto: jest.fn().mockResolvedValue(undefined),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
      screenshot: jest.fn().mockResolvedValue(undefined),
    });

    const screenshotPath = await agent.captureScreenshot(testUrl, testName);
    expect(screenshotPath).toBeDefined();
    expect(screenshotPath).toContain(`${testName}.png`);
  });

  test('should create baseline if not exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('mock-data'));

    const result = await agent.compareScreenshots(testName);
    expect(result.passed).toBe(true);
    expect(result.diffPath).toBeUndefined();
  });

  test('should handle comparison errors gracefully', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockRejectedValue(new Error('Read failed'));

    await expect(agent.compareScreenshots(testName)).rejects.toThrow('Failed to compare screenshots');
  });
});
```
