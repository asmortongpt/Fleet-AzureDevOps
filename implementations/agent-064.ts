```typescript
// src/agents/CTAFleetAgent064.ts
import { Logger } from 'winston';
import { performance } from 'perf_hooks';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { RateLimiter } from 'limiter';

// Constants
const MAX_CONCURRENT_REQUESTS = 100;
const REQUESTS_PER_MINUTE = 60;
const TIMEOUT_MS = 5000;

// Interfaces
interface LoadTestConfig {
  targetUrl: string;
  totalRequests: number;
  concurrentRequests: number;
  durationMs?: number;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  errorDetails: Array<{ status?: number; message: string }>;
}

// Custom Errors
class LoadTestError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'LoadTestError';
  }
}

class CTAFleetAgent064 {
  private readonly logger: Logger;
  private readonly httpClient: AxiosInstance;
  private readonly rateLimiter: RateLimiter;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rateLimiter = new RateLimiter({ tokensPerInterval: REQUESTS_PER_MINUTE, interval: 'minute' });
    
    this.httpClient = axios.create({
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'CTAFleet-Agent-064/1.0.0',
        'Content-Type': 'application/json',
      },
      // Disable following redirects for security
      maxRedirects: 0,
      // Validate status codes
      validateStatus: (status) => status >= 200 && status < 300,
    });
  }

  /**
   * Executes a load test against the specified target URL with configured parameters.
   * @param config Load test configuration
   * @returns Promise with load test results
   */
  async executeLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    try {
      this.validateConfig(config);
      this.logger.info('Starting load test', { targetUrl: config.targetUrl, totalRequests: config.totalRequests });

      const results: LoadTestResult = {
        totalRequests: config.totalRequests,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatencyMs: 0,
        minLatencyMs: Infinity,
        maxLatencyMs: 0,
        errorDetails: [],
      };

      const latencies: number[] = [];
      const batchSize = Math.min(config.concurrentRequests, MAX_CONCURRENT_REQUESTS);
      const totalBatches = Math.ceil(config.totalRequests / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const requestsInBatch = Math.min(batchSize, config.totalRequests - batch * batchSize);
        const batchPromises: Array<Promise<void>> = [];

        for (let i = 0; i < requestsInBatch; i++) {
          batchPromises.push(this.makeRequest(config.targetUrl, results, latencies));
        }

        await Promise.all(batchPromises);
        await setTimeout(100); // Small delay between batches to prevent overload
      }

      // Calculate statistics
      if (latencies.length > 0) {
        results.averageLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        results.minLatencyMs = Math.min(...latencies);
        results.maxLatencyMs = Math.max(...latencies);
      } else {
        results.minLatencyMs = 0;
      }

      this.logger.info('Load test completed', results);
      return results;
    } catch (error) {
      this.logger.error('Load test failed', { error });
      throw new LoadTestError('Failed to execute load test', error);
    }
  }

  /**
   * Validates the load test configuration.
   * @param config Configuration to validate
   */
  private validateConfig(config: LoadTestConfig): void {
    if (!config.targetUrl || !config.targetUrl.startsWith('http')) {
      throw new LoadTestError('Invalid target URL');
    }
    if (config.totalRequests <= 0) {
      throw new LoadTestError('Total requests must be greater than 0');
    }
    if (config.concurrentRequests <= 0 || config.concurrentRequests > MAX_CONCURRENT_REQUESTS) {
      throw new LoadTestError(`Concurrent requests must be between 1 and ${MAX_CONCURRENT_REQUESTS}`);
    }
  }

  /**
   * Makes a single HTTP request with rate limiting and performance tracking.
   * @param url Target URL
   * @param results Results object to update
   * @param latencies Array to store latency values
   */
  private async makeRequest(url: string, results: LoadTestResult, latencies: number[]): Promise<void> {
    try {
      await this.rateLimiter.removeTokens(1);
      const startTime = performance.now();

      await this.httpClient.get(url);
      const latency = performance.now() - startTime;

      results.successfulRequests++;
      latencies.push(latency);
    } catch (error) {
      results.failedRequests++;
      const axiosError = error as AxiosError;
      results.errorDetails.push({
        status: axiosError.response?.status,
        message: axiosError.message || 'Unknown error',
      });
      this.logger.warn('Request failed', { error: axiosError.message, url });
    }
  }
}

export { CTAFleetAgent064, LoadTestConfig, LoadTestResult, LoadTestError };

// src/tests/CTAFleetAgent064.test.ts
import { createLogger } from 'winston';
import { CTAFleetAgent064, LoadTestConfig, LoadTestError } from '../agents/CTAFleetAgent064';
import nock from 'nock';
import { expect } from 'chai';

describe('CTAFleetAgent064 - Load Testing', () => {
  let agent: CTAFleetAgent064;
  let logger: any;

  beforeEach(() => {
    logger = createLogger({ silent: true });
    agent = new CTAFleetAgent064(logger);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should successfully complete a load test with valid configuration', async () => {
    const targetUrl = 'http://example.com/api';
    nock('http://example.com')
      .get('/api')
      .times(5)
      .reply(200, { status: 'ok' });

    const config: LoadTestConfig = {
      targetUrl,
      totalRequests: 5,
      concurrentRequests: 2,
    };

    const result = await agent.executeLoadTest(config);

    expect(result.totalRequests).to.equal(5);
    expect(result.successfulRequests).to.equal(5);
    expect(result.failedRequests).to.equal(0);
    expect(result.averageLatencyMs).to.be.greaterThan(0);
  });

  it('should handle failed requests during load test', async () => {
    const targetUrl = 'http://example.com/api';
    nock('http://example.com')
      .get('/api')
      .times(3)
      .reply(200, { status: 'ok' })
      .get('/api')
      .times(2)
      .reply(500, { error: 'server error' });

    const config: LoadTestConfig = {
      targetUrl,
      totalRequests: 5,
      concurrentRequests: 2,
    };

    const result = await agent.executeLoadTest(config);

    expect(result.totalRequests).to.equal(5);
    expect(result.successfulRequests).to.equal(3);
    expect(result.failedRequests).to.equal(2);
    expect(result.errorDetails.length).to.equal(2);
  });

  it('should throw LoadTestError for invalid configuration', async () => {
    const config: LoadTestConfig = {
      targetUrl: 'invalid-url',
      totalRequests: 5,
      concurrentRequests: 2,
    };

    await expect(agent.executeLoadTest(config)).to.be.rejectedWith(LoadTestError);
  });

  it('should throw LoadTestError for invalid concurrent requests', async () => {
    const config: LoadTestConfig = {
      targetUrl: 'http://example.com',
      totalRequests: 5,
      concurrentRequests: 1000,
    };

    await expect(agent.executeLoadTest(config)).to.be.rejectedWith(LoadTestError);
  });
});
```
