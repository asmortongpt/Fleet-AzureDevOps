```typescript
// src/agents/CTAFleetAgent36.ts
import { Agent, AgentStatus } from '../models/Agent';
import { HealthCheckResult, HealthCheckStatus } from '../models/HealthCheck';
import { Logger } from '../utils/Logger';
import { NotificationService } from '../services/NotificationService';

export class CTAFleetAgent36 implements Agent {
  private readonly agentId: string = 'CTAFleet-Agent-36';
  private readonly name: string = 'Health Check Agent';
  private status: AgentStatus = AgentStatus.IDLE;
  private lastCheck: Date | null = null;
  private readonly checkIntervalMs: number = 30000; // 30 seconds
  private readonly notificationService: NotificationService;
  private readonly logger: Logger;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(notificationService: NotificationService, logger: Logger) {
    this.notificationService = notificationService;
    this.logger = logger;
  }

  public getId(): string {
    return this.agentId;
  }

  public getName(): string {
    return this.name;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public start(): void {
    if (this.status === AgentStatus.RUNNING) {
      this.logger.warn(`${this.name} is already running`);
      return;
    }

    this.status = AgentStatus.RUNNING;
    this.logger.info(`${this.name} started`);
    this.runHealthChecks();

    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.checkIntervalMs);
  }

  public stop(): void {
    if (this.status === AgentStatus.IDLE) {
      this.logger.warn(`${this.name} is already stopped`);
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.status = AgentStatus.IDLE;
    this.logger.info(`${this.name} stopped`);
  }

  private async runHealthChecks(): Promise<void> {
    try {
      this.logger.info('Running health checks...');
      const results = await this.performHealthChecks();
      this.lastCheck = new Date();

      const failedChecks = results.filter(result => result.status === HealthCheckStatus.FAILURE);
      if (failedChecks.length > 0) {
        await this.notificationService.sendAlert(
          'Health Check Failure',
          `The following health checks failed: ${failedChecks.map(check => check.serviceName).join(', ')}`
        );
      }

      this.logger.info('Health checks completed', { results });
    } catch (error) {
      this.logger.error('Error during health checks', error);
      await this.notificationService.sendAlert(
        'Health Check Error',
        `Error occurred during health checks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async performHealthChecks(): Promise<HealthCheckResult[]> {
    const servicesToCheck = [
      { name: 'Database', endpoint: '/health/db' },
      { name: 'API Gateway', endpoint: '/health/api' },
      { name: 'Message Queue', endpoint: '/health/mq' },
    ];

    const results: HealthCheckResult[] = [];

    for (const service of servicesToCheck) {
      try {
        // Simulated health check - in real implementation, this would make HTTP calls
        const status = Math.random() > 0.2 ? HealthCheckStatus.SUCCESS : HealthCheckStatus.FAILURE;
        const message = status === HealthCheckStatus.SUCCESS 
          ? `${service.name} is healthy` 
          : `${service.name} check failed`;

        results.push({
          serviceName: service.name,
          status,
          message,
          timestamp: new Date(),
          endpoint: service.endpoint,
        });
      } catch (error) {
        results.push({
          serviceName: service.name,
          status: HealthCheckStatus.FAILURE,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          endpoint: service.endpoint,
        });
      }
    }

    return results;
  }

  public getLastCheckTime(): Date | null {
    return this.lastCheck;
  }
}

// src/models/Agent.ts
export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}

export interface Agent {
  getId(): string;
  getName(): string;
  getStatus(): AgentStatus;
  start(): void;
  stop(): void;
}

// src/models/HealthCheck.ts
export enum HealthCheckStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  WARNING = 'WARNING',
}

export interface HealthCheckResult {
  serviceName: string;
  status: HealthCheckStatus;
  message: string;
  timestamp: Date;
  endpoint: string;
}

// src/utils/Logger.ts
export class Logger {
  public info(message: string, data?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, data || '');
  }

  public warn(message: string, data?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  public error(message: string, error?: Error | unknown): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

// src/services/NotificationService.ts
export class NotificationService {
  public async sendAlert(title: string, message: string): Promise<void> {
    // Simulated notification sending
    console.log(`[ALERT] ${title}: ${message}`);
    return Promise.resolve();
  }
}

// tests/agents/CTAFleetAgent36.test.ts
import { CTAFleetAgent36 } from '../../src/agents/CTAFleetAgent36';
import { AgentStatus } from '../../src/models/Agent';
import { NotificationService } from '../../src/services/NotificationService';
import { Logger } from '../../src/utils/Logger';

jest.useFakeTimers();

describe('CTAFleetAgent36 - Health Checks', () => {
  let agent: CTAFleetAgent36;
  let mockNotificationService: NotificationService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockNotificationService = new NotificationService();
    mockLogger = new Logger();
    agent = new CTAFleetAgent36(mockNotificationService, mockLogger);
    jest.spyOn(mockNotificationService, 'sendAlert');
    jest.spyOn(mockLogger, 'info');
    jest.spyOn(mockLogger, 'warn');
    jest.spyOn(mockLogger, 'error');
  });

  afterEach(() => {
    agent.stop();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test('should initialize with correct properties', () => {
    expect(agent.getId()).toBe('CTAFleet-Agent-36');
    expect(agent.getName()).toBe('Health Check Agent');
    expect(agent.getStatus()).toBe(AgentStatus.IDLE);
    expect(agent.getLastCheckTime()).toBeNull();
  });

  test('should start and set status to RUNNING', () => {
    agent.start();
    expect(agent.getStatus()).toBe(AgentStatus.RUNNING);
    expect(mockLogger.info).toHaveBeenCalledWith('Health Check Agent started');
  });

  test('should not start if already running', () => {
    agent.start();
    agent.start();
    expect(mockLogger.warn).toHaveBeenCalledWith('Health Check Agent is already running');
  });

  test('should stop and set status to IDLE', () => {
    agent.start();
    agent.stop();
    expect(agent.getStatus()).toBe(AgentStatus.IDLE);
    expect(mockLogger.info).toHaveBeenCalledWith('Health Check Agent stopped');
  });

  test('should not stop if already stopped', () => {
    agent.stop();
    expect(mockLogger.warn).toHaveBeenCalledWith('Health Check Agent is already stopped');
  });

  test('should run health checks on start and at intervals', async () => {
    const runHealthChecksSpy = jest.spyOn(agent as any, 'runHealthChecks');
    agent.start();
    expect(runHealthChecksSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(30000);
    expect(runHealthChecksSpy).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(30000);
    expect(runHealthChecksSpy).toHaveBeenCalledTimes(3);
  });

  test('should update last check time after health checks', async () => {
    agent.start();
    jest.advanceTimersByTime(1000);
    expect(agent.getLastCheckTime()).not.toBeNull();
  });

  test('should send alert on health check failures', async () => {
    // Force a failure in health check
    jest.spyOn(agent as any, 'performHealthChecks').mockResolvedValue([
      {
        serviceName: 'Database',
        status: 'FAILURE',
        message: 'Database check failed',
        timestamp: new Date(),
        endpoint: '/health/db',
      },
    ]);

    agent.start();
    jest.advanceTimersByTime(1000);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockNotificationService.sendAlert).toHaveBeenCalledWith(
      'Health Check Failure',
      expect.stringContaining('Database')
    );
  });

  test('should handle errors during health checks', async () => {
    jest.spyOn(agent as any, 'performHealthChecks').mockRejectedValue(new Error('Test error'));
    agent.start();
    jest.advanceTimersByTime(1000);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockNotificationService.sendAlert).toHaveBeenCalledWith(
      'Health Check Error',
      expect.stringContaining('Test error')
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error during health checks',
      expect.any(Error)
    );
  });
});
```
