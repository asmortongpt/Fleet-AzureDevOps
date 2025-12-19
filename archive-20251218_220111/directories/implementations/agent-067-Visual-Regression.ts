```typescript
// src/agents/CTAFleetAgent67.ts
import { Agent, AgentConfig } from '../core/Agent';
import { Logger } from '../utils/Logger';
import { VisualRegressionTester } from '../services/VisualRegressionTester';
import { TestResult } from '../types/TestResult';

export class CTAFleetAgent67 extends Agent {
  private visualTester: VisualRegressionTester;
  private readonly logger: Logger;

  constructor(config: AgentConfig) {
    super(config);
    this.logger = new Logger('CTAFleetAgent67');
    this.visualTester = new VisualRegressionTester({
      baselineDir: config.baselineDir || './baselines',
      diffDir: config.diffDir || './diffs',
      actualDir: config.actualDir || './actuals',
      threshold: config.threshold || 0.1
    });
  }

  public async runVisualRegressionTests(
    testUrls: string[],
    viewport: { width: number; height: number }
  ): Promise<TestResult[]> {
    this.logger.info('Starting visual regression tests for CTAFleet Agent 67');
    const results: TestResult[] = [];

    try {
      for (const url of testUrls) {
        this.logger.info(`Testing URL: ${url}`);
        const result = await this.visualTester.compareSnapshot(url, viewport);
        results.push({
          testName: `Visual Regression - ${url}`,
          passed: result.isMatch,
          details: result.details,
          timestamp: new Date().toISOString()
        });

        if (!result.isMatch) {
          this.logger.error(`Visual mismatch detected for ${url}`);
        }
      }
    } catch (error) {
      this.logger.error('Error during visual regression testing', error);
      results.push({
        testName: 'Visual Regression - Error',
        passed: false,
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.info('Visual regression tests completed');
    return results;
  }
}

// src/services/VisualRegressionTester.ts
import puppeteer, { Browser, Page } from 'puppeteer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

interface VisualTesterConfig {
  baselineDir: string;
  diffDir: string;
  actualDir: string;
  threshold: number;
}

interface ComparisonResult {
  isMatch: boolean;
  details: string;
}

export class VisualRegressionTester {
  private browser: Browser | null = null;
  private config: VisualTesterConfig;

  constructor(config: VisualTesterConfig) {
    this.config = config;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.config.baselineDir, this.config.diffDir, this.config.actualDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  public async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  public async compareSnapshot(
    url: string,
    viewport: { width: number; height: number }
  ): Promise<ComparisonResult> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });

    const testName = encodeURIComponent(url);
    const actualPath = path.join(this.config.actualDir, `${testName}.png`);
    const baselinePath = path.join(this.config.baselineDir, `${testName}.png`);
    const diffPath = path.join(this.config.diffDir, `${testName}-diff.png`);

    await page.screenshot({ path: actualPath, fullPage: true });

    if (!fs.existsSync(baselinePath)) {
      fs.copyFileSync(actualPath, baselinePath);
      await page.close();
      return { isMatch: true, details: 'Baseline created' };
    }

    const actual = PNG.sync.read(fs.readFileSync(actualPath));
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const { width, height } = actual;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      actual.data,
      baseline.data,
      diff.data,
      width,
      height,
      { threshold: this.config.threshold }
    );

    const totalPixels = width * height;
    const mismatchPercentage = (numDiffPixels / totalPixels) * 100;
    const isMatch = mismatchPercentage < this.config.threshold * 100;

    if (!isMatch) {
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
    }

    await page.close();
    return {
      isMatch,
      details: `Mismatch: ${mismatchPercentage.toFixed(2)}% (${numDiffPixels} pixels)`
    };
  }

  public async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// src/types/TestResult.ts
export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  timestamp: string;
}

// src/core/Agent.ts
export interface AgentConfig {
  name?: string;
  baselineDir?: string;
  diffDir?: string;
  actualDir?: string;
  threshold?: number;
}

export abstract class Agent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }
}

// src/utils/Logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string): void {
    console.log(`[INFO] [${this.context}] ${message}`);
  }

  public error(message: string, error?: Error): void {
    console.error(`[ERROR] [${this.context}] ${message}`, error || '');
  }
}

// tests/CTAFleetAgent67.test.ts
import { CTAFleetAgent67 } from '../src/agents/CTAFleetAgent67';
import { expect } from 'chai';
import sinon from 'sinon';
import { VisualRegressionTester } from '../src/services/VisualRegressionTester';

describe('CTAFleetAgent67 - Visual Regression Testing', () => {
  let agent: CTAFleetAgent67;
  let visualTesterStub: sinon.SinonStubbedInstance<VisualRegressionTester>;

  beforeEach(() => {
    visualTesterStub = sinon.createStubInstance(VisualRegressionTester);
    agent = new CTAFleetAgent67({
      baselineDir: './test-baselines',
      diffDir: './test-diffs',
      actualDir: './test-actuals',
      threshold: 0.1
    });

    // Replace the real visual tester with our stub
    (agent as any).visualTester = visualTesterStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should run visual regression tests successfully', async () => {
    const testUrls = ['https://example.com/page1', 'https://example.com/page2'];
    const viewport = { width: 1280, height: 720 };

    visualTesterStub.compareSnapshot.resolves({
      isMatch: true,
      details: 'Match within threshold'
    });

    const results = await agent.runVisualRegressionTests(testUrls, viewport);

    expect(results).to.have.lengthOf(2);
    expect(results[0].passed).to.be.true;
    expect(results[0].testName).to.include('Visual Regression');
    expect(visualTesterStub.compareSnapshot.calledTwice).to.be.true;
  });

  it('should handle visual mismatch in regression tests', async () => {
    const testUrls = ['https://example.com/page1'];
    const viewport = { width: 1280, height: 720 };

    visualTesterStub.compareSnapshot.resolves({
      isMatch: false,
      details: 'Mismatch: 2.5% (3200 pixels)'
    });

    const results = await agent.runVisualRegressionTests(testUrls, viewport);

    expect(results).to.have.lengthOf(1);
    expect(results[0].passed).to.be.false;
    expect(results[0].details).to.include('Mismatch');
  });

  it('should handle errors during visual regression testing', async () => {
    const testUrls = ['https://example.com/page1'];
    const viewport = { width: 1280, height: 720 };

    visualTesterStub.compareSnapshot.rejects(new Error('Browser error'));

    const results = await agent.runVisualRegressionTests(testUrls, viewport);

    expect(results).to.have.lengthOf(1);
    expect(results[0].passed).to.be.false;
    expect(results[0].details).to.include('Browser error');
  });
});
```
