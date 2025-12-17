// src/agents/CTAFleetAgent41.ts
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../services/metricsCollector';
import { Agent } from '../models/agent';
import { Metric } from '../models/metric';

export class CTAFleetAgent41 implements Agent {
  private readonly agentId: string = 'CTAFleet-Agent-41';
  private readonly metricsCollector: MetricsCollector;
  private readonly logger: Logger;
  private isRunning: boolean = false;

  constructor(metricsCollector: MetricsCollector, logger: Logger) {
    this.metricsCollector = metricsCollector;
    this.logger = logger;
  }

  public start(): void {
    if (this.isRunning) {
      this.logger.warn(`${this.agentId} is already running`);
      return;
    }

    this.isRunning = true;
    this.logger.info(`${this.agentId} started for metrics collection`);
    this.collectMetrics();
  }

  public stop(): void {
    if (!this.isRunning) {
      this.logger.warn(`${this.agentId} is not running`);
      return;
    }

    this.isRunning = false;
    this.logger.info(`${this.agentId} stopped`);
  }

  private async collectMetrics(): Promise<void> {
    while (this.isRunning) {
      try {
        const metrics = await this.metricsCollector.collect();
        this.processMetrics(metrics);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      } catch (error) {
        this.logger.error(`${this.agentId} failed to collect metrics: ${error}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  private processMetrics(metrics: Metric[]): void {
    if (!metrics || metrics.length === 0) {
      this.logger.warn(`${this.agentId} received no metrics to process`);
      return;
    }

    metrics.forEach(metric => {
      this.logger.info(`${this.agentId} processed metric - ${metric.name}: ${metric.value}`);
    });
  }

  public getAgentId(): string {
    return this.agentId;
  }

  public isAgentRunning(): boolean {
    return this.isRunning;
  }
}

// src/models/agent.ts
export interface Agent {
  start(): void;
  stop(): void;
  getAgentId(): string;
  isAgentRunning(): boolean;
}

// src/models/metric.ts
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  source: string;
}

// src/utils/logger.ts
export class Logger {
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  }
}

// src/services/metricsCollector.ts
export class MetricsCollector {
  public async collect(): Promise<Metric[]> {
    // Simulate collecting metrics from a system or API
    return [
      {
        name: 'cpu_usage',
        value: Math.random() * 100,
        timestamp: new Date(),
        source: 'system'
      },
      {
        name: 'memory_usage',
        value: Math.random() * 100,
        timestamp: new Date(),
        source: 'system'
      }
    ];
  }
}

// src/tests/CTAFleetAgent41.test.ts
import { CTAFleetAgent41 } from '../agents/CTAFleetAgent41';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../services/metricsCollector';

jest.useFakeTimers();

describe('CTAFleetAgent41', () => {
  let agent: CTAFleetAgent41;
  let mockLogger: Logger;
  let mockMetricsCollector: MetricsCollector;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as unknown as Logger;

    mockMetricsCollector = {
      collect: jest.fn().mockResolvedValue([
        { name: 'cpu_usage', value: 75.5, timestamp: new Date(), source: 'system' },
        { name: 'memory_usage', value: 60.2, timestamp: new Date(), source: 'system' }
      ])
    } as unknown as MetricsCollector;

    agent = new CTAFleetAgent41(mockMetricsCollector, mockLogger);
  });

  afterEach(() => {
    agent.stop();
    jest.clearAllTimers();
  });

  test('should initialize with correct agent ID', () => {
    expect(agent.getAgentId()).toBe('CTAFleet-Agent-41');
  });

  test('should start agent and log start message', () => {
    agent.start();
    expect(mockLogger.info).toHaveBeenCalledWith('CTAFleet-Agent-41 started for metrics collection');
    expect(agent.isAgentRunning()).toBe(true);
  });

  test('should not start if already running', () => {
    agent.start();
    agent.start();
    expect(mockLogger.warn).toHaveBeenCalledWith('CTAFleet-Agent-41 is already running');
  });

  test('should stop agent and log stop message', () => {
    agent.start();
    agent.stop();
    expect(mockLogger.info).toHaveBeenCalledWith('CTAFleet-Agent-41 stopped');
    expect(agent.isAgentRunning()).toBe(false);
  });

  test('should not stop if not running', () => {
    agent.stop();
    expect(mockLogger.warn).toHaveBeenCalledWith('CTAFleet-Agent-41 is not running');
  });

  test('should collect and process metrics', async () => {
    agent.start();
    jest.advanceTimersByTime(5000);
    await Promise.resolve(); // Allow async operations to complete

    expect(mockMetricsCollector.collect).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('processed metric - cpu_usage'));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('processed metric - memory_usage'));
  });

  test('should handle empty metrics', async () => {
    mockMetricsCollector.collect = jest.fn().mockResolvedValue([]);
    agent.start();
    jest.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(mockLogger.warn).toHaveBeenCalledWith('CTAFleet-Agent-41 received no metrics to process');
  });

  test('should handle metrics collection errors', async () => {
    mockMetricsCollector.collect = jest.fn().mockRejectedValue(new Error('Collection failed'));
    agent.start();
    jest.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('failed to collect metrics'));
  });
});
