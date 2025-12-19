```typescript
// src/observability/agent.ts
import { Logger } from 'winston';
import { MetricRegistry } from './metrics';
import { TraceManager } from './tracing';
import { LogManager } from './logging';
import { HealthCheck } from './health';
import { Config } from './config';

export class CTAFleetAgent {
  private logger: Logger;
  private metrics: MetricRegistry;
  private tracer: TraceManager;
  private health: HealthCheck;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.logger = LogManager.createLogger(config.logLevel);
    this.metrics = new MetricRegistry(config.serviceName);
    this.tracer = new TraceManager(config.serviceName);
    this.health = new HealthCheck(config.serviceName);
    this.initialize();
  }

  private initialize(): void {
    this.logger.info('Initializing CTAFleet Agent Observability Stack...');
    this.metrics.registerDefaultMetrics();
    this.tracer.initialize();
    this.health.registerHealthCheck(() => this.isHealthy());
  }

  public start(): void {
    this.logger.info('Starting CTAFleet Agent Observability Stack');
    this.metrics.startMetricCollection();
  }

  public stop(): void {
    this.logger.info('Stopping CTAFleet Agent Observability Stack');
    this.metrics.stopMetricCollection();
    this.tracer.shutdown();
  }

  private isHealthy(): boolean {
    return this.metrics.isRunning() && this.tracer.isInitialized();
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public getMetrics(): MetricRegistry {
    return this.metrics;
  }

  public getTracer(): TraceManager {
    return this.tracer;
  }

  public getHealth(): HealthCheck {
    return this.health;
  }
}

// src/observability/config.ts
export interface Config {
  serviceName: string;
  logLevel: string;
  metricsPort?: number;
  tracingEnabled?: boolean;
}

// src/observability/logging.ts
import winston, { Logger } from 'winston';

export class LogManager {
  static createLogger(logLevel: string): Logger {
    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' })
      ]
    });
  }
}

// src/observability/metrics.ts
import promClient from 'prom-client';

export class MetricRegistry {
  private registry: promClient.Registry;
  private isCollecting: boolean = false;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.registry = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.registry });
  }

  public registerDefaultMetrics(): void {
    // Custom metric example
    new promClient.Gauge({
      name: `${this.serviceName}_uptime_seconds`,
      help: 'Service uptime in seconds',
      registers: [this.registry]
    });
  }

  public startMetricCollection(): void {
    this.isCollecting = true;
  }

  public stopMetricCollection(): void {
    this.isCollecting = false;
  }

  public isRunning(): boolean {
    return this.isCollecting;
  }

  public getRegistry(): promClient.Registry {
    return this.registry;
  }
}

// src/observability/tracing.ts
export class TraceManager {
  private serviceName: string;
  private initialized: boolean = false;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  public initialize(): void {
    // Placeholder for tracing initialization (e.g., OpenTelemetry)
    this.initialized = true;
    console.log(`Tracing initialized for ${this.serviceName}`);
  }

  public shutdown(): void {
    this.initialized = false;
    console.log(`Tracing shutdown for ${this.serviceName}`);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

// src/observability/health.ts
import express from 'express';

export class HealthCheck {
  private serviceName: string;
  private app: express.Application;
  private checkFn: () => boolean;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.app = express();
    this.setupEndpoints();
  }

  private setupEndpoints(): void {
    this.app.get('/health', (req, res) => {
      const isHealthy = this.checkFn ? this.checkFn() : false;
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: this.serviceName
      });
    });
  }

  public registerHealthCheck(checkFn: () => boolean): void {
    this.checkFn = checkFn;
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`Health check server started on port ${port}`);
    });
  }
}

// src/index.ts
import { CTAFleetAgent } from './observability/agent';
import { Config } from './observability/config';

const config: Config = {
  serviceName: 'ctafleet-agent-38',
  logLevel: 'info',
  metricsPort: 9090,
  tracingEnabled: true
};

const agent = new CTAFleetAgent(config);
agent.start();
agent.getHealth().start(3000);

// Test file: tests/agent.test.ts
import { CTAFleetAgent } from '../src/observability/agent';
import { Config } from '../src/observability/config';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

describe('CTAFleetAgent Observability Stack', () => {
  let agent: CTAFleetAgent;
  const config: Config = {
    serviceName: 'test-agent',
    logLevel: 'debug'
  };

  before(() => {
    agent = new CTAFleetAgent(config);
    agent.start();
  });

  after(() => {
    agent.stop();
  });

  it('should initialize logger correctly', () => {
    const logger = agent.getLogger();
    expect(logger).to.not.be.undefined;
    expect(logger.level).to.equal('debug');
  });

  it('should initialize metrics registry', () => {
    const metrics = agent.getMetrics();
    expect(metrics).to.not.be.undefined;
    expect(metrics.isRunning()).to.be.true;
  });

  it('should initialize tracer', () => {
    const tracer = agent.getTracer();
    expect(tracer).to.not.be.undefined;
    expect(tracer.isInitialized()).to.be.true;
  });

  it('should provide health check endpoint', () => {
    const health = agent.getHealth();
    expect(health).to.not.be.undefined;
  });
});
```
