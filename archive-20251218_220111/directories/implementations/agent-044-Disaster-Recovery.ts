```typescript
// src/agents/CTAFleetAgent44.ts
import { Logger } from '../utils/Logger';
import { BackupService } from '../services/BackupService';
import { RecoveryService } from '../services/RecoveryService';
import { NotificationService } from '../services/NotificationService';
import { AgentConfig } from '../types/AgentConfig';

export class CTAFleetAgent44 {
  private readonly agentId: string = 'AGENT-44';
  private readonly config: AgentConfig;
  private readonly logger: Logger;
  private readonly backupService: BackupService;
  private readonly recoveryService: RecoveryService;
  private readonly notificationService: NotificationService;

  constructor(
    config: AgentConfig,
    logger: Logger,
    backupService: BackupService,
    recoveryService: RecoveryService,
    notificationService: NotificationService
  ) {
    this.config = config;
    this.logger = logger;
    this.backupService = backupService;
    this.recoveryService = recoveryService;
    this.notificationService = notificationService;
  }

  public async initialize(): Promise<void> {
    try {
      this.logger.info(`Initializing CTAFleet Agent ${this.agentId} for Disaster Recovery`);
      await this.backupService.connect();
      await this.recoveryService.connect();
      this.logger.info(`Agent ${this.agentId} initialized successfully`);
    } catch (error) {
      this.logger.error(`Failed to initialize Agent ${this.agentId}:`, error);
      throw error;
    }
  }

  public async performBackup(): Promise<boolean> {
    try {
      this.logger.info(`Starting backup process for Agent ${this.agentId}`);
      const backupResult = await this.backupService.createBackup(this.config.backupPath);
      if (backupResult) {
        this.logger.info(`Backup completed successfully for Agent ${this.agentId}`);
        await this.notificationService.sendNotification(
          `Backup successful for Agent ${this.agentId}`
        );
        return true;
      }
      throw new Error('Backup process failed');
    } catch (error) {
      this.logger.error(`Backup failed for Agent ${this.agentId}:`, error);
      await this.notificationService.sendNotification(
        `Backup failed for Agent ${this.agentId}: ${error.message}`
      );
      return false;
    }
  }

  public async performRecovery(backupId: string): Promise<boolean> {
    try {
      this.logger.info(`Starting recovery process for Agent ${this.agentId} with backup ID: ${backupId}`);
      const recoveryResult = await this.recoveryService.restoreFromBackup(backupId, this.config.recoveryPath);
      if (recoveryResult) {
        this.logger.info(`Recovery completed successfully for Agent ${this.agentId}`);
        await this.notificationService.sendNotification(
          `Recovery successful for Agent ${this.agentId} with backup ID: ${backupId}`
        );
        return true;
      }
      throw new Error('Recovery process failed');
    } catch (error) {
      this.logger.error(`Recovery failed for Agent ${this.agentId}:`, error);
      await this.notificationService.sendNotification(
        `Recovery failed for Agent ${this.agentId}: ${error.message}`
      );
      return false;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const backupStatus = await this.backupService.isHealthy();
      const recoveryStatus = await this.recoveryService.isHealthy();
      const isHealthy = backupStatus && recoveryStatus;
      this.logger.info(`Health check for Agent ${this.agentId}: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
      return isHealthy;
    } catch (error) {
      this.logger.error(`Health check failed for Agent ${this.agentId}:`, error);
      return false;
    }
  }
}

// src/services/BackupService.ts
export class BackupService {
  async connect(): Promise<void> {
    // Implementation for connecting to backup storage
  }

  async createBackup(backupPath: string): Promise<boolean> {
    // Implementation for creating backup
    return true;
  }

  async isHealthy(): Promise<boolean> {
    // Implementation for health check
    return true;
  }
}

// src/services/RecoveryService.ts
export class RecoveryService {
  async connect(): Promise<void> {
    // Implementation for connecting to recovery system
  }

  async restoreFromBackup(backupId: string, recoveryPath: string): Promise<boolean> {
    // Implementation for restoring from backup
    return true;
  }

  async isHealthy(): Promise<boolean> {
    // Implementation for health check
    return true;
  }
}

// src/services/NotificationService.ts
export class NotificationService {
  async sendNotification(message: string): Promise<void> {
    // Implementation for sending notifications
    console.log(`Notification: ${message}`);
  }
}

// src/utils/Logger.ts
export class Logger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

// src/types/AgentConfig.ts
export interface AgentConfig {
  backupPath: string;
  recoveryPath: string;
  agentName: string;
}

// tests/CTAFleetAgent44.test.ts
import { CTAFleetAgent44 } from '../src/agents/CTAFleetAgent44';
import { Logger } from '../src/utils/Logger';
import { BackupService } from '../src/services/BackupService';
import { RecoveryService } from '../src/services/RecoveryService';
import { NotificationService } from '../src/services/NotificationService';
import { AgentConfig } from '../src/types/AgentConfig';

jest.mock('../src/services/BackupService');
jest.mock('../src/services/RecoveryService');
jest.mock('../src/services/NotificationService');
jest.mock('../src/utils/Logger');

describe('CTAFleetAgent44 - Disaster Recovery', () => {
  let agent: CTAFleetAgent44;
  let mockConfig: AgentConfig;
  let mockLogger: jest.Mocked<Logger>;
  let mockBackupService: jest.Mocked<BackupService>;
  let mockRecoveryService: jest.Mocked<RecoveryService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockConfig = {
      backupPath: '/backup/path',
      recoveryPath: '/recovery/path',
      agentName: 'TestAgent',
    };

    mockLogger = new Logger() as jest.Mocked<Logger>;
    mockBackupService = new BackupService() as jest.Mocked<BackupService>;
    mockRecoveryService = new RecoveryService() as jest.Mocked<RecoveryService>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    agent = new CTAFleetAgent44(
      mockConfig,
      mockLogger,
      mockBackupService,
      mockRecoveryService,
      mockNotificationService
    );
  });

  test('should initialize agent successfully', async () => {
    mockBackupService.connect.mockResolvedValue();
    mockRecoveryService.connect.mockResolvedValue();

    await expect(agent.initialize()).resolves.toBeUndefined();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
  });

  test('should handle initialization failure', async () => {
    const error = new Error('Connection failed');
    mockBackupService.connect.mockRejectedValue(error);

    await expect(agent.initialize()).rejects.toThrow(error);
    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(String), error);
  });

  test('should perform backup successfully', async () => {
    mockBackupService.createBackup.mockResolvedValue(true);
    mockNotificationService.sendNotification.mockResolvedValue();

    const result = await agent.performBackup();
    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Backup completed successfully'));
    expect(mockNotificationService.sendNotification).toHaveBeenCalled();
  });

  test('should handle backup failure', async () => {
    mockBackupService.createBackup.mockResolvedValue(false);
    mockNotificationService.sendNotification.mockResolvedValue();

    const result = await agent.performBackup();
    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockNotificationService.sendNotification).toHaveBeenCalled();
  });

  test('should perform recovery successfully', async () => {
    const backupId = 'backup-123';
    mockRecoveryService.restoreFromBackup.mockResolvedValue(true);
    mockNotificationService.sendNotification.mockResolvedValue();

    const result = await agent.performRecovery(backupId);
    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Recovery completed successfully'));
    expect(mockNotificationService.sendNotification).toHaveBeenCalled();
  });

  test('should handle recovery failure', async () => {
    const backupId = 'backup-123';
    mockRecoveryService.restoreFromBackup.mockResolvedValue(false);
    mockNotificationService.sendNotification.mockResolvedValue();

    const result = await agent.performRecovery(backupId);
    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockNotificationService.sendNotification).toHaveBeenCalled();
  });

  test('should perform health check successfully', async () => {
    mockBackupService.isHealthy.mockResolvedValue(true);
    mockRecoveryService.isHealthy.mockResolvedValue(true);

    const result = await agent.healthCheck();
    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Healthy'));
  });

  test('should handle health check failure', async () => {
    mockBackupService.isHealthy.mockResolvedValue(false);
    mockRecoveryService.isHealthy.mockResolvedValue(true);

    const result = await agent.healthCheck();
    expect(result).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Unhealthy'));
  });
});
```
