```typescript
// src/backgroundJobs/PerformanceMonitor.ts
import { Logger } from '../utils/Logger';
import { PerformanceMetrics } from '../models/PerformanceMetrics';
import { DatabaseService } from '../services/DatabaseService';
import { AlertService } from '../services/AlertService';

export class PerformanceMonitor {
  private readonly INTERVAL_MS = 30000; // 30 seconds
  private readonly CPU_THRESHOLD = 80; // 80% CPU usage
  private readonly MEMORY_THRESHOLD = 75; // 75% Memory usage
  private intervalId: NodeJS.Timeout | null = null;
  private logger: Logger;
  private dbService: DatabaseService;
  private alertService: AlertService;

  constructor(
    logger: Logger,
    dbService: DatabaseService,
    alertService: AlertService
  ) {
    this.logger = logger;
    this.dbService = dbService;
    this.alertService = alertService;
  }

  public start(): void {
    if (this.intervalId) {
      this.logger.warn('Performance monitor already running');
      return;
    }

    this.logger.info('Starting performance monitor');
    this.intervalId = setInterval(async () => {
      try {
        await this.checkPerformance();
      } catch (error) {
        this.logger.error('Error in performance monitoring', error);
      }
    }, this.INTERVAL_MS);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Performance monitor stopped');
    }
  }

  private async checkPerformance(): Promise<void> {
    const metrics = this.collectMetrics();
    await this.storeMetrics(metrics);

    if (this.isAboveThreshold(metrics)) {
      await this.alertService.sendAlert({
        type: 'PERFORMANCE_WARNING',
        message: `High resource usage detected - CPU: ${metrics.cpuUsage}%, Memory: ${metrics.memoryUsage}%`,
        timestamp: new Date(),
        severity: 'HIGH',
      });
    }
  }

  private collectMetrics(): PerformanceMetrics {
    // Simulated metrics collection (in real implementation, use system metrics)
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const timestamp = new Date();

    return {
      cpuUsage,
      memoryUsage,
      timestamp,
    };
  }

  private async storeMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      await this.dbService.savePerformanceMetrics(metrics);
      this.logger.debug('Performance metrics stored successfully');
    } catch (error) {
      this.logger.error('Failed to store performance metrics', error);
      throw error;
    }
  }

  private isAboveThreshold(metrics: PerformanceMetrics): boolean {
    return (
      metrics.cpuUsage > this.CPU_THRESHOLD ||
      metrics.memoryUsage > this.MEMORY_THRESHOLD
    );
  }
}

// src/models/PerformanceMetrics.ts
export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  timestamp: Date;
}

// src/utils/Logger.ts
export class Logger {
  public info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  public error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error);
  }

  public debug(message: string): void {
    console.log(`[DEBUG] ${message}`);
  }
}

// src/services/DatabaseService.ts
import { PerformanceMetrics } from '../models/PerformanceMetrics';

export class DatabaseService {
  public async savePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    // Simulated database save
    console.log('Saving metrics to database:', metrics);
    return Promise.resolve();
  }
}

// src/services/AlertService.ts
interface Alert {
  type: string;
  message: string;
  timestamp: Date;
  severity: string;
}

export class AlertService {
  public async sendAlert(alert: Alert): Promise<void> {
    // Simulated alert sending
    console.log('Sending alert:', alert);
    return Promise.resolve();
  }
}

// src/backgroundJobs/index.ts
import { PerformanceMonitor } from './PerformanceMonitor';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../services/DatabaseService';
import { AlertService } from '../services/AlertService';

export class BackgroundJobManager {
  private performanceMonitor: PerformanceMonitor;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    const dbService = new DatabaseService();
    const alertService = new AlertService();
    this.performanceMonitor = new PerformanceMonitor(
      this.logger,
      dbService,
      alertService
    );
  }

  public startAll(): void {
    this.performanceMonitor.start();
    this.logger.info('All background jobs started');
  }

  public stopAll(): void {
    this.performanceMonitor.stop();
    this.logger.info('All background jobs stopped');
  }
}

// tests/backgroundJobs/PerformanceMonitor.test.ts
import { PerformanceMonitor } from '../../src/backgroundJobs/PerformanceMonitor';
import { Logger } from '../../src/utils/Logger';
import { DatabaseService } from '../../src/services/DatabaseService';
import { AlertService } from '../../src/services/AlertService';
import { PerformanceMetrics } from '../../src/models/PerformanceMetrics';

jest.useFakeTimers();

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;
  let mockLogger: jest.Mocked<Logger>;
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockAlertService: jest.Mocked<AlertService>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockDbService = {
      savePerformanceMetrics: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DatabaseService>;

    mockAlertService = {
      sendAlert: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AlertService>;

    performanceMonitor = new PerformanceMonitor(
      mockLogger,
      mockDbService,
      mockAlertService
    );

    // Mock the collectMetrics method to return controlled values
    jest.spyOn(performanceMonitor as any, 'collectMetrics').mockImplementation(
      () =>
        ({
          cpuUsage: 50,
          memoryUsage: 60,
          timestamp: new Date(),
        } as PerformanceMetrics)
    );
  });

  afterEach(() => {
    performanceMonitor.stop();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test('should start performance monitoring', () => {
    performanceMonitor.start();
    expect(mockLogger.info).toHaveBeenCalledWith('Starting performance monitor');
  });

  test('should not start if already running', () => {
    performanceMonitor.start();
    performanceMonitor.start();
    expect(mockLogger.warn).toHaveBeenCalledWith('Performance monitor already running');
  });

  test('should stop performance monitoring', () => {
    performanceMonitor.start();
    performanceMonitor.stop();
    expect(mockLogger.info).toHaveBeenCalledWith('Performance monitor stopped');
  });

  test('should collect and store metrics on interval', () => {
    performanceMonitor.start();
    jest.advanceTimersByTime(30000);
    expect(mockDbService.savePerformanceMetrics).toHaveBeenCalled();
  });

  test('should send alert when metrics exceed threshold', () => {
    jest.spyOn(performanceMonitor as any, 'collectMetrics').mockImplementation(
      () =>
        ({
          cpuUsage: 85,
          memoryUsage: 80,
          timestamp: new Date(),
        } as PerformanceMetrics)
    );

    performanceMonitor.start();
    jest.advanceTimersByTime(30000);
    expect(mockAlertService.sendAlert).toHaveBeenCalled();
  });

  test('should handle errors during performance check', () => {
    mockDbService.savePerformanceMetrics.mockRejectedValue(new Error('DB Error'));
    performanceMonitor.start();
    jest.advanceTimersByTime(30000);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in performance monitoring'),
      expect.any(Error)
    );
  });
});

// src/index.ts
import { BackgroundJobManager } from './backgroundJobs';

const jobManager = new BackgroundJobManager();

// Start background jobs on application startup
jobManager.startAll();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  jobManager.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  jobManager.stopAll();
  process.exit(0);
});
```
