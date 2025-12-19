// src/agents/CTAFleetAgent30.ts
import { PerformanceMetrics, MetricData } from '../models/PerformanceMetrics';
import { Agent, AgentConfig } from '../types';
import { Logger } from '../utils/Logger';

export class CTAFleetAgent30 implements Agent {
  private config: AgentConfig;
  private metrics: PerformanceMetrics;
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(config: AgentConfig) {
    this.config = {
      ...config,
      pollingInterval: config.pollingInterval || 30000, // Default to 30 seconds
    };
    this.metrics = new PerformanceMetrics();
    this.logger = new Logger('CTAFleetAgent30');
    this.logger.info('Agent initialized with config', this.config);
  }

  public start(): void {
    if (this.isRunning) {
      this.logger.warn('Agent is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting performance monitoring agent');
    this.monitorPerformance();
  }

  public stop(): void {
    this.isRunning = false;
    this.logger.info('Stopping performance monitoring agent');
  }

  private async monitorPerformance(): Promise<void> {
    while (this.isRunning) {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.addMetric(metrics);
        this.logger.info('Performance metrics collected', metrics);

        if (this.metrics.isThresholdExceeded()) {
          this.logger.warn('Performance threshold exceeded', metrics);
          this.notifyAlert(metrics);
        }

        await new Promise(resolve => setTimeout(resolve, this.config.pollingInterval));
      } catch (error) {
        this.logger.error('Error in performance monitoring', error);
        await new Promise(resolve => setTimeout(resolve, this.config.pollingInterval));
      }
    }
  }

  private async collectMetrics(): Promise<MetricData> {
    // Simulate collecting system performance metrics
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const latency = Math.random() * 1000;

    return {
      timestamp: new Date(),
      cpuUsage,
      memoryUsage,
      latency,
    };
  }

  private notifyAlert(metrics: MetricData): void {
    // Simulate sending alert notification
    this.logger.info('Sending alert notification for metrics', metrics);
    // Implementation for actual notification (e.g., email, webhook) can be added here
  }

  public getMetrics(): MetricData[] {
    return this.metrics.getAllMetrics();
  }
}

// src/models/PerformanceMetrics.ts
export interface MetricData {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
}

export class PerformanceMetrics {
  private metrics: MetricData[] = [];
  private readonly MAX_METRICS = 100;
  private readonly CPU_THRESHOLD = 80;
  private readonly MEMORY_THRESHOLD = 80;
  private readonly LATENCY_THRESHOLD = 500;

  public addMetric(metric: MetricData): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  public getAllMetrics(): MetricData[] {
    return [...this.metrics];
  }

  public isThresholdExceeded(): boolean {
    const latestMetric = this.metrics[this.metrics.length - 1];
    if (!latestMetric) return false;

    return (
      latestMetric.cpuUsage > this.CPU_THRESHOLD ||
      latestMetric.memoryUsage > this.MEMORY_THRESHOLD ||
      latestMetric.latency > this.LATENCY_THRESHOLD
    );
  }
}

// src/types.ts
export interface AgentConfig {
  pollingInterval?: number;
  thresholds?: {
    cpu?: number;
    memory?: number;
    latency?: number;
  };
}

export interface Agent {
  start(): void;
  stop(): void;
}

// src/utils/Logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string, ...args: any[]): void {
    console.log(`[INFO] [${this.context}] ${message}`, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] [${this.context}] ${message}`, ...args);
  }

  public error(message: string, ...args: any[]): void {
    console.error(`[ERROR] [${this.context}] ${message}`, ...args);
  }
}

// src/tests/CTAFleetAgent30.test.ts
import { CTAFleetAgent30 } from '../agents/CTAFleetAgent30';

describe('CTAFleetAgent30 - Performance Monitoring', () => {
  let agent: CTAFleetAgent30;
  const config: AgentConfig = {
    pollingInterval: 1000,
  };

  beforeEach(() => {
    agent = new CTAFleetAgent30(config);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    agent.stop();
    jest.clearAllMocks();
  });

  test('should initialize agent with default config', () => {
    expect(agent).toBeDefined();
  });

  test('should start and stop agent correctly', () => {
    agent.start();
    expect(agent['isRunning']).toBe(true);

    agent.stop();
    expect(agent['isRunning']).toBe(false);
  });

  test('should not start agent if already running', () => {
    agent.start();
    const warnSpy = jest.spyOn(console, 'warn');
    agent.start();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Agent is already running')
    );
  });

  test('should collect and store metrics', async () => {
    agent.start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    const metrics = agent.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0]).toHaveProperty('cpuUsage');
    expect(metrics[0]).toHaveProperty('memoryUsage');
    expect(metrics[0]).toHaveProperty('latency');
    expect(metrics[0]).toHaveProperty('timestamp');
  });
});

// Usage example
// src/index.ts
import { CTAFleetAgent30 } from './agents/CTAFleetAgent30';

const config = {
  pollingInterval: 5000, // Poll every 5 seconds
};

const agent = new CTAFleetAgent30(config);
agent.start();

// Stop after 30 seconds for demo
setTimeout(() => {
  agent.stop();
  console.log('Agent stopped. Final metrics:', agent.getMetrics());
}, 30000);
