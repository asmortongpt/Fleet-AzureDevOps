```typescript
// ctaFleetAgent061.ts
import { performance } from 'perf_hooks';
import { Logger } from 'winston';
import * as winston from 'winston';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs';
import * as path from 'path';

// Promisify file operations for async/await
const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

// Logger configuration for secure logging
const logger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'ctafleet-agent061.log' }),
    new winston.transports.Console()
  ]
});

interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: string;
  status: 'success' | 'failure';
  error?: string;
}

class CTAFleetAgent061 {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly METRICS_FILE = path.join(__dirname, 'performance-metrics.json');

  constructor() {
    logger.info('CTAFleet Agent 061 initialized for performance testing');
    this.loadMetricsFromFile().catch(err => {
      logger.error('Failed to load metrics from file on initialization', { error: err.message });
    });
  }

  // Securely load metrics from file with error handling
  private async loadMetricsFromFile(): Promise<void> {
    try {
      const data = await readFileAsync(this.METRICS_FILE, 'utf-8');
      this.metrics = JSON.parse(data);
      logger.info('Performance metrics loaded from file');
    } catch (error) {
      logger.warn('No existing metrics file found or parse error, starting with empty metrics', { error: (error as Error).message });
      this.metrics = [];
    }
  }

  // Securely save metrics to file with retry mechanism
  private async saveMetricsToFile(): Promise<void> {
    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        await writeFileAsync(this.METRICS_FILE, JSON.stringify(this.metrics, null, 2), 'utf-8');
        logger.info('Performance metrics saved to file');
        return;
      } catch (error) {
        retries++;
        logger.error(`Failed to save metrics to file (attempt ${retries}/${this.MAX_RETRIES})`, { error: (error as Error).message });
        if (retries === this.MAX_RETRIES) {
          throw new Error('Max retries reached for saving metrics');
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  // Measure performance of a specific operation
  public async measurePerformance(operation: string, task: () => Promise<void>): Promise<PerformanceMetrics> {
    const start = performance.now();
    const timestamp = new Date().toISOString();
    let metric: PerformanceMetrics;

    try {
      await task();
      const duration = performance.now() - start;
      metric = {
        operation,
        duration,
        timestamp,
        status: 'success'
      };
      logger.info(`Performance test for ${operation} completed successfully`, { duration });
    } catch (error) {
      const duration = performance.now() - start;
      metric = {
        operation,
        duration,
        timestamp,
        status: 'failure',
        error: (error as Error).message
      };
      logger.error(`Performance test for ${operation} failed`, { error: (error as Error).message, duration });
    }

    this.metrics.push(metric);
    await this.saveMetricsToFile().catch(err => {
      logger.error('Failed to save metrics after test', { error: err.message });
    });

    return metric;
  }

  // Get all collected metrics with sanitization
  public getMetrics(): PerformanceMetrics[] {
    // Return a deep copy to prevent external modification
    return JSON.parse(JSON.stringify(this.metrics));
  }

  // Clear metrics with secure deletion
  public async clearMetrics(): Promise<void> {
    this.metrics = [];
    await this.saveMetricsToFile().catch(err => {
      logger.error('Failed to clear metrics', { error: err.message });
      throw new Error('Failed to clear metrics');
    });
    logger.info('Performance metrics cleared');
  }
}

// Export for testing and usage
export default CTAFleetAgent061;

// ctaFleetAgent061.test.ts
import { expect } from 'chai';
import CTAFleetAgent061 from './ctaFleetAgent061';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';

describe('CTAFleet Agent 061 - Performance Testing', () => {
  let agent: CTAFleetAgent061;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    agent = new CTAFleetAgent061();
    sandbox = sinon.createSandbox();
    // Mock file operations to prevent actual disk writes during tests
    sandbox.stub(fs, 'writeFile').callsFake((path, data, encoding, callback) => callback(null));
    sandbox.stub(fs, 'readFile').callsFake((path, encoding, callback) => callback(null, '[]'));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should measure performance of successful operation', async () => {
    const operation = 'test-success';
    const task = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    };

    const metric = await agent.measurePerformance(operation, task);
    expect(metric.operation).to.equal(operation);
    expect(metric.status).to.equal('success');
    expect(metric.duration).to.be.greaterThan(0);
    expect(metric.timestamp).to.be.a('string');
  });

  it('should measure performance of failed operation', async () => {
    const operation = 'test-failure';
    const task = async () => {
      throw new Error('Test error');
    };

    const metric = await agent.measurePerformance(operation, task);
    expect(metric.operation).to.equal(operation);
    expect(metric.status).to.equal('failure');
    expect(metric.error).to.equal('Test error');
    expect(metric.duration).to.be.greaterThan(0);
  });

  it('should return collected metrics', async () => {
    const operation = 'test-metrics';
    const task = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    };

    await agent.measurePerformance(operation, task);
    const metrics = agent.getMetrics();
    expect(metrics).to.be.an('array');
    expect(metrics.length).to.equal(1);
    expect(metrics[0].operation).to.equal(operation);
  });

  it('should clear metrics', async () => {
    const operation = 'test-clear';
    const task = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    };

    await agent.measurePerformance(operation, task);
    await agent.clearMetrics();
    const metrics = agent.getMetrics();
    expect(metrics).to.be.an('array');
    expect(metrics.length).to.equal(0);
  });
});
```
