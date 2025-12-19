// src/ctaFleetAgent.ts
import { AlertManager } from './alertManager';
import { Config } from './config';
import { Logger } from './logger';
import { MetricsCollector } from './metricsCollector';

export class CTAFleetAgent {
  private logger: Logger;
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private config: Config;
  private isRunning: boolean;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger(config.logLevel);
    this.metricsCollector = new MetricsCollector(config.metricsEndpoint);
    this.alertManager = new AlertManager(config.alertThresholds);
    this.isRunning = false;
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('CTAFleet Agent is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting CTAFleet Agent 43 with SRE Practices');

    try {
      await this.metricsCollector.initialize();
      this.runMonitoringLoop();
    } catch (error) {
      this.logger.error('Failed to start CTAFleet Agent', error);
      this.isRunning = false;
      throw error;
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.logger.info('Stopping CTAFleet Agent');
    this.metricsCollector.cleanup();
  }

  private runMonitoringLoop(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }

      try {
        const metrics = await this.metricsCollector.collectMetrics();
        this.logger.debug('Collected metrics', metrics);

        const alerts = this.alertManager.checkThresholds(metrics);
        if (alerts.length > 0) {
          this.logger.warn('Threshold alerts triggered', alerts);
          await this.alertManager.sendAlerts(alerts);
        }
      } catch (error) {
        this.logger.error('Error in monitoring loop', error);
      }
    }, this.config.pollingInterval);
  }

  public getStatus(): { running: boolean; config: Config } {
    return {
      running: this.isRunning,
      config: this.config,
    };
  }
}

// src/config.ts
export interface Config {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsEndpoint: string;
  pollingInterval: number;
  alertThresholds: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

// src/logger.ts
export class Logger {
  private logLevel: string;

  constructor(logLevel: string) {
    this.logLevel = logLevel;
  }

  public debug(message: string, ...args: any[]): void {
    if (['debug'].includes(this.logLevel)) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: any[]): void {
    if (['debug', 'info'].includes(this.logLevel)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  public error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

// src/metricsCollector.ts
export class MetricsCollector {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async initialize(): Promise<void> {
    // Simulate initialization of metrics collector
    return Promise.resolve();
  }

  public async collectMetrics(): Promise<Record<string, number>> {
    // Simulate fetching metrics from endpoint
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
    };
  }

  public cleanup(): void {
    // Simulate cleanup
  }
}

// src/alertManager.ts
export class AlertManager {
  private thresholds: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };

  constructor(thresholds: { cpuUsage: number; memoryUsage: number; diskUsage: number }) {
    this.thresholds = thresholds;
  }

  public checkThresholds(metrics: Record<string, number>): string[] {
    const alerts: string[] = [];

    if (metrics.cpuUsage > this.thresholds.cpuUsage) {
      alerts.push(`High CPU Usage: ${metrics.cpuUsage}%`);
    }
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push(`High Memory Usage: ${metrics.memoryUsage}%`);
    }
    if (metrics.diskUsage > this.thresholds.diskUsage) {
      alerts.push(`High Disk Usage: ${metrics.diskUsage}%`);
    }

    return alerts;
  }

  public async sendAlerts(alerts: string[]): Promise<void> {
    // Simulate sending alerts
    console.log('Sending alerts:', alerts);
    return Promise.resolve();
  }
}

// tests/ctaFleetAgent.test.ts
import { CTAFleetAgent } from '../src/ctaFleetAgent';
import { Config } from '../src/config';

describe('CTAFleetAgent', () => {
  let agent: CTAFleetAgent;
  let config: Config;

  beforeEach(() => {
    config = {
      logLevel: 'debug',
      metricsEndpoint: 'http://localhost:9090/metrics',
      pollingInterval: 1000,
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 75,
        diskUsage: 90,
      },
    };
    agent = new CTAFleetAgent(config);
  });

  afterEach(() => {
    agent.stop();
  });

  test('should initialize and start agent', async () => {
    await expect(agent.start()).resolves.toBeUndefined();
    const status = agent.getStatus();
    expect(status.running).toBe(true);
    expect(status.config).toEqual(config);
  });

  test('should not start if already running', async () => {
    await agent.start();
    await expect(agent.start()).resolves.toBeUndefined();
    const status = agent.getStatus();
    expect(status.running).toBe(true);
  });

  test('should stop agent', () => {
    agent.stop();
    const status = agent.getStatus();
    expect(status.running).toBe(false);
  });
});

// tests/metricsCollector.test.ts
import { MetricsCollector } from '../src/metricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector('http://localhost:9090/metrics');
  });

  test('should initialize successfully', async () => {
    await expect(collector.initialize()).resolves.toBeUndefined();
  });

  test('should collect metrics', async () => {
    const metrics = await collector.collectMetrics();
    expect(metrics).toHaveProperty('cpuUsage');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('diskUsage');
    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
  });
});

// tests/alertManager.test.ts
import { AlertManager } from '../src/alertManager';

describe('AlertManager', () => {
  let alertManager: AlertManager;

  beforeEach(() => {
    alertManager = new AlertManager({
      cpuUsage: 80,
      memoryUsage: 75,
      diskUsage: 90,
    });
  });

  test('should detect threshold breaches', () => {
    const metrics = {
      cpuUsage: 85,
      memoryUsage: 80,
      diskUsage: 95,
    };
    const alerts = alertManager.checkThresholds(metrics);
    expect(alerts.length).toBe(3);
    expect(alerts).toContain('High CPU Usage: 85%');
    expect(alerts).toContain('High Memory Usage: 80%');
    expect(alerts).toContain('High Disk Usage: 95%');
  });

  test('should not trigger alerts below thresholds', () => {
    const metrics = {
      cpuUsage: 70,
      memoryUsage: 60,
      diskUsage: 80,
    };
    const alerts = alertManager.checkThresholds(metrics);
    expect(alerts.length).toBe(0);
  });

  test('should send alerts', async () => {
    const alerts = ['High CPU Usage: 85%'];
    await expect(alertManager.sendAlerts(alerts)).resolves.toBeUndefined();
  });
});
