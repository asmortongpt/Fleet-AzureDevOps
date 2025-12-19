```typescript
// src/agents/CTAFleetAgent044.ts
import { Logger } from 'winston';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { IDisasterRecoveryService } from '../interfaces/IDisasterRecoveryService';
import { BackupResult, RecoveryResult } from '../models/DisasterRecovery';
import { ValidationError, SystemError } from '../errors/CustomErrors';
import { sanitizeInput } from '../utils/security';

@injectable()
export class CTAFleetAgent044 {
  private readonly agentId: string = 'Agent-044';
  private readonly serviceName: string = 'DisasterRecovery';

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.DisasterRecoveryService) private drService: IDisasterRecoveryService
  ) {
    this.logger.info(`${this.agentId} initialized for ${this.serviceName}`);
  }

  /**
   * Initiates a backup process for critical systems
   * @param backupConfig Configuration for backup operation
   * @returns Promise with backup result
   */
  public async initiateBackup(backupConfig: Record<string, unknown>): Promise<BackupResult> {
    try {
      // Sanitize input to prevent injection attacks
      const sanitizedConfig = sanitizeInput(backupConfig);
      this.logger.info(`Starting backup process for ${this.agentId}`);

      // Validate backup configuration
      if (!sanitizedConfig.targetSystems || !sanitizedConfig.backupLocation) {
        throw new ValidationError('Invalid backup configuration: Missing required fields');
      }

      // Execute backup through service
      const result = await this.drService.createBackup(sanitizedConfig);
      this.logger.info(`Backup completed successfully for ${this.agentId}`);

      return result;
    } catch (error) {
      this.logger.error(`Backup failed for ${this.agentId}: ${error.message}`);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new SystemError(`Backup operation failed: ${error.message}`);
    }
  }

  /**
   * Initiates a recovery process from backup
   * @param recoveryConfig Configuration for recovery operation
   * @returns Promise with recovery result
   */
  public async initiateRecovery(recoveryConfig: Record<string, unknown>): Promise<RecoveryResult> {
    try {
      // Sanitize input to prevent injection attacks
      const sanitizedConfig = sanitizeInput(recoveryConfig);
      this.logger.info(`Starting recovery process for ${this.agentId}`);

      // Validate recovery configuration
      if (!sanitizedConfig.backupId || !sanitizedConfig.targetEnvironment) {
        throw new ValidationError('Invalid recovery configuration: Missing required fields');
      }

      // Execute recovery through service
      const result = await this.drService.restoreFromBackup(sanitizedConfig);
      this.logger.info(`Recovery completed successfully for ${this.agentId}`);

      return result;
    } catch (error) {
      this.logger.error(`Recovery failed for ${this.agentId}: ${error.message}`);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new SystemError(`Recovery operation failed: ${error.message}`);
    }
  }
}

// src/interfaces/IDisasterRecoveryService.ts
export interface IDisasterRecoveryService {
  createBackup(config: Record<string, unknown>): Promise<BackupResult>;
  restoreFromBackup(config: Record<string, unknown>): Promise<RecoveryResult>;
}

// src/models/DisasterRecovery.ts
export interface BackupResult {
  backupId: string;
  status: 'success' | 'failed';
  timestamp: Date;
  location: string;
  details?: Record<string, unknown>;
}

export interface RecoveryResult {
  recoveryId: string;
  status: 'success' | 'failed';
  timestamp: Date;
  restoredSystems: string[];
  details?: Record<string, unknown>;
}

// src/errors/CustomErrors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

// src/utils/security.ts
export function sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Remove potential script tags and dangerous characters
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>{}]/g, '');
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// src/config/types.ts
export const TYPES = {
  Logger: Symbol.for('Logger'),
  DisasterRecoveryService: Symbol.for('DisasterRecoveryService'),
};

// tests/agents/CTAFleetAgent044.test.ts
import { Container } from 'inversify';
import { createMock } from 'ts-auto-mock';
import { CTAFleetAgent044 } from '../src/agents/CTAFleetAgent044';
import { IDisasterRecoveryService } from '../src/interfaces/IDisasterRecoveryService';
import { Logger } from 'winston';
import { TYPES } from '../src/config/types';
import { BackupResult, RecoveryResult } from '../src/models/DisasterRecovery';
import { ValidationError, SystemError } from '../src/errors/CustomErrors';

describe('CTAFleetAgent044 - Disaster Recovery', () => {
  let container: Container;
  let agent: CTAFleetAgent044;
  let mockDrService: IDisasterRecoveryService;
  let mockLogger: Logger;

  beforeEach(() => {
    container = new Container();
    mockDrService = createMock<IDisasterRecoveryService>({
      createBackup: async () => ({
        backupId: 'backup-123',
        status: 'success',
        timestamp: new Date(),
        location: '/backups/123',
      }),
      restoreFromBackup: async () => ({
        recoveryId: 'recovery-123',
        status: 'success',
        timestamp: new Date(),
        restoredSystems: ['system1', 'system2'],
      }),
    });

    mockLogger = createMock<Logger>({
      info: jest.fn(),
      error: jest.fn(),
    });

    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(TYPES.DisasterRecoveryService).toConstantValue(mockDrService);
    container.bind(CTAFleetAgent044).to(CTAFleetAgent044);

    agent = container.get(CTAFleetAgent044);
  });

  describe('initiateBackup', () => {
    it('should successfully create a backup with valid config', async () => {
      const config = {
        targetSystems: ['system1', 'system2'],
        backupLocation: '/backups',
      };

      const result: BackupResult = await agent.initiateBackup(config);
      expect(result.status).toBe('success');
      expect(result.backupId).toBe('backup-123');
    });

    it('should throw ValidationError for invalid config', async () => {
      const config = { invalid: 'data' };
      await expect(agent.initiateBackup(config)).rejects.toThrow(ValidationError);
    });

    it('should handle system errors during backup', async () => {
      mockDrService.createBackup = async () => {
        throw new Error('Backup failed');
      };
      container.bind(TYPES.DisasterRecoveryService).toConstantValue(mockDrService);

      const config = {
        targetSystems: ['system1'],
        backupLocation: '/backups',
      };

      await expect(agent.initiateBackup(config)).rejects.toThrow(SystemError);
    });
  });

  describe('initiateRecovery', () => {
    it('should successfully restore from backup with valid config', async () => {
      const config = {
        backupId: 'backup-123',
        targetEnvironment: 'prod',
      };

      const result: RecoveryResult = await agent.initiateRecovery(config);
      expect(result.status).toBe('success');
      expect(result.recoveryId).toBe('recovery-123');
    });

    it('should throw ValidationError for invalid config', async () => {
      const config = { invalid: 'data' };
      await expect(agent.initiateRecovery(config)).rejects.toThrow(ValidationError);
    });

    it('should handle system errors during recovery', async () => {
      mockDrService.restoreFromBackup = async () => {
        throw new Error('Recovery failed');
      };
      container.bind(TYPES.DisasterRecoveryService).toConstantValue(mockDrService);

      const config = {
        backupId: 'backup-123',
        targetEnvironment: 'prod',
      };

      await expect(agent.initiateRecovery(config)).rejects.toThrow(SystemError);
    });
  });
});
```
