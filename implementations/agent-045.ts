```typescript
// src/agents/ctaFleetAgent045.ts
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as winston from 'winston';
import * as cron from 'node-cron';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

// Load environment variables
config();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/backup-agent.log' }),
    new winston.transports.Console(),
  ],
});

// Configuration interface
interface BackupConfig {
  sourceDir: string;
  backupDir: string;
  s3Bucket: string;
  s3Region: string;
  cronSchedule: string;
  retentionDays: number;
}

// Backup Agent class
class CTAFleetAgent045 {
  private config: BackupConfig;
  private s3Client: S3Client;
  private readonly AGENT_ID = 'CTAFleet-Agent-045';

  constructor(config: BackupConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: this.config.s3Region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // Initialize backup scheduling
  public initialize(): void {
    logger.info(`${this.AGENT_ID} initializing backup automation...`);
    cron.schedule(this.config.cronSchedule, async () => {
      try {
        await this.performBackup();
      } catch (error) {
        logger.error(`${this.AGENT_ID} backup failed:`, error);
      }
    });
  }

  // Perform backup operation
  public async performBackup(): Promise<void> {
    logger.info(`${this.AGENT_ID} starting backup process...`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.tar.gz`;
    const localBackupPath = path.join(this.config.backupDir, backupName);

    try {
      // Create local backup
      await this.createLocalBackup(localBackupPath);
      // Upload to S3
      await this.uploadToS3(localBackupPath, backupName);
      // Clean up old backups
      await this.cleanupOldBackups();
      logger.info(`${this.AGENT_ID} backup completed successfully: ${backupName}`);
    } catch (error) {
      logger.error(`${this.AGENT_ID} backup process failed:`, error);
      throw error;
    } finally {
      // Clean up local backup file
      if (fs.existsSync(localBackupPath)) {
        fs.unlinkSync(localBackupPath);
      }
    }
  }

  // Create local compressed backup
  private async createLocalBackup(backupPath: string): Promise<void> {
    const execAsync = promisify(exec);
    const command = `tar -czvf ${backupPath} ${this.config.sourceDir}`;
    
    try {
      await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });
      logger.info(`${this.AGENT_ID} local backup created: ${backupPath}`);
    } catch (error) {
      logger.error(`${this.AGENT_ID} failed to create local backup:`, error);
      throw new Error('Local backup creation failed');
    }
  }

  // Upload backup to S3
  private async uploadToS3(localPath: string, backupName: string): Promise<void> {
    try {
      const fileContent = fs.readFileSync(localPath);
      const command = new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: `backups/${backupName}`,
        Body: fileContent,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);
      logger.info(`${this.AGENT_ID} uploaded backup to S3: ${backupName}`);
    } catch (error) {
      logger.error(`${this.AGENT_ID} S3 upload failed:`, error);
      throw new Error('S3 upload failed');
    }
  }

  // Clean up old local backups based on retention policy
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupDir);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.config.backupDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > retentionMs) {
          fs.unlinkSync(filePath);
          logger.info(`${this.AGENT_ID} deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      logger.error(`${this.AGENT_ID} cleanup failed:`, error);
      throw new Error('Backup cleanup failed');
    }
  }
}

// Main execution
const backupConfig: BackupConfig = {
  sourceDir: process.env.SOURCE_DIR || '/app/data',
  backupDir: process.env.BACKUP_DIR || '/app/backups',
  s3Bucket: process.env.S3_BUCKET || 'cta-fleet-backups',
  s3Region: process.env.S3_REGION || 'us-east-1',
  cronSchedule: process.env.CRON_SCHEDULE || '0 2 * * *', // Daily at 2 AM
  retentionDays: parseInt(process.env.RETENTION_DAYS || '7', 10),
};

const agent = new CTAFleetAgent045(backupConfig);
agent.initialize();

// Export for testing purposes
export { CTAFleetAgent045, BackupConfig };

// src/agents/ctaFleetAgent045.test.ts
import { CTAFleetAgent045, BackupConfig } from './ctaFleetAgent045';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('CTAFleetAgent045 - Backup Automation', () => {
  let agent: CTAFleetAgent045;
  let testConfig: BackupConfig;
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    testConfig = {
      sourceDir: '/test/source',
      backupDir: '/test/backups',
      s3Bucket: 'test-bucket',
      s3Region: 'us-east-1',
      cronSchedule: '0 2 * * *',
      retentionDays: 7,
    };
    agent = new CTAFleetAgent045(testConfig);
    s3Mock.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize without errors', () => {
    expect(() => agent.initialize()).not.toThrow();
  });

  test('should handle S3 upload failure', async () => {
    s3Mock.onAnyCommand().rejects(new Error('S3 upload failed'));
    await expect(agent.performBackup()).rejects.toThrow('S3 upload failed');
  });

  test('should cleanup old backups based on retention policy', async () => {
    const mockReaddirSync = jest.spyOn(fs, 'readdirSync');
    const mockStatSync = jest.spyOn(fs, 'statSync');
    const mockUnlinkSync = jest.spyOn(fs, 'unlinkSync');

    mockReaddirSync.mockReturnValue(['old-backup.tar.gz']);
    mockStatSync.mockReturnValue({
      mtimeMs: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days old
    } as fs.Stats);

    await (agent as any).cleanupOldBackups();
    expect(mockUnlinkSync).toHaveBeenCalled();
  });

  test('should not delete recent backups', async () => {
    const mockReaddirSync = jest.spyOn(fs, 'readdirSync');
    const mockStatSync = jest.spyOn(fs, 'statSync');
    const mockUnlinkSync = jest.spyOn(fs, 'unlinkSync');

    mockReaddirSync.mockReturnValue(['recent-backup.tar.gz']);
    mockStatSync.mockReturnValue({
      mtimeMs: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day old
    } as fs.Stats);

    await (agent as any).cleanupOldBackups();
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });
});
```
