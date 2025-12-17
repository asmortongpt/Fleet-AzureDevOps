```typescript
// src/agents/CTAFleetAgent45.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/Logger';

const execAsync = promisify(exec);

export class CTAFleetAgent45 {
  private readonly backupDir: string;
  private readonly sourceDirs: string[];
  private readonly logger: Logger;

  constructor(backupDir: string, sourceDirs: string[]) {
    this.backupDir = backupDir;
    this.sourceDirs = sourceDirs;
    this.logger = new Logger('CTAFleetAgent45');
  }

  /**
   * Initiates the backup process for all source directories
   */
  public async initiateBackup(): Promise<void> {
    this.logger.info('Starting backup automation process...');
    try {
      await this.createBackupDirectory();
      await this.performBackup();
      this.logger.info('Backup process completed successfully.');
    } catch (error) {
      this.logger.error(`Backup process failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates the backup directory if it doesn't exist
   */
  private async createBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      this.logger.info(`Creating backup directory: ${this.backupDir}`);
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Performs the backup operation for each source directory
   */
  private async performBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    for (const sourceDir of this.sourceDirs) {
      try {
        const sourceName = path.basename(sourceDir);
        const backupPath = path.join(this.backupDir, `${sourceName}-${timestamp}.tar.gz`);
        await this.createTarBackup(sourceDir, backupPath);
        this.logger.info(`Backup created for ${sourceDir} at ${backupPath}`);
      } catch (error) {
        this.logger.error(`Failed to backup ${sourceDir}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Creates a tar.gz backup of the source directory
   */
  private async createTarBackup(sourceDir: string, backupPath: string): Promise<void> {
    const command = `tar -czvf "${backupPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
    await execAsync(command);
  }

  /**
   * Cleans up old backups, keeping only the latest specified number
   */
  public async cleanupOldBackups(maxBackups: number): Promise<void> {
    this.logger.info(`Cleaning up old backups, keeping latest ${maxBackups}`);
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.tar.gz')).sort();

      if (backupFiles.length > maxBackups) {
        const filesToDelete = backupFiles.slice(0, backupFiles.length - maxBackups);
        for (const file of filesToDelete) {
          const filePath = path.join(this.backupDir, file);
          await fs.unlink(filePath);
          this.logger.info(`Deleted old backup: ${filePath}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup old backups: ${error.message}`);
      throw error;
    }
  }
}

// src/utils/Logger.ts
export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string): void {
    console.log(`[INFO] [${this.context}] ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] [${this.context}] ${message}`);
  }
}

// tests/agents/CTAFleetAgent45.test.ts
import { CTAFleetAgent45 } from '../src/agents/CTAFleetAgent45';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('CTAFleetAgent45 - Backup Automation', () => {
  let agent: CTAFleetAgent45;
  let testBackupDir: string;
  let testSourceDir: string;
  let testSourceDir2: string;

  beforeAll(async () => {
    testBackupDir = path.join(__dirname, 'test-backups');
    testSourceDir = path.join(__dirname, 'test-source');
    testSourceDir2 = path.join(__dirname, 'test-source2');

    // Create test directories and files
    await fs.mkdir(testSourceDir, { recursive: true });
    await fs.mkdir(testSourceDir2, { recursive: true });
    await fs.writeFile(path.join(testSourceDir, 'test.txt'), 'test content');
    await fs.writeFile(path.join(testSourceDir2, 'test2.txt'), 'test content 2');

    agent = new CTAFleetAgent45(testBackupDir, [testSourceDir, testSourceDir2]);
  });

  afterAll(async () => {
    // Cleanup test directories
    try {
      await execAsync(`rm -rf ${testBackupDir}`);
      await execAsync(`rm -rf ${testSourceDir}`);
      await execAsync(`rm -rf ${testSourceDir2}`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  test('should create backup directory if it does not exist', async () => {
    await agent.initiateBackup();
    const exists = await fs.access(testBackupDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  test('should create backups for all source directories', async () => {
    await agent.initiateBackup();
    const files = await fs.readdir(testBackupDir);
    expect(files.length).toBeGreaterThanOrEqual(2);
    expect(files.some(f => f.includes('test-source'))).toBe(true);
    expect(files.some(f => f.includes('test-source2'))).toBe(true);
  });

  test('should cleanup old backups', async () => {
    // Create multiple backups
    await agent.initiateBackup();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for timestamp difference
    await agent.initiateBackup();
    
    const initialFiles = await fs.readdir(testBackupDir);
    expect(initialFiles.length).toBeGreaterThanOrEqual(4);

    await agent.cleanupOldBackups(2);
    const remainingFiles = await fs.readdir(testBackupDir);
    expect(remainingFiles.length).toBeLessThanOrEqual(2);
  });

  test('should throw error on backup failure', async () => {
    const invalidAgent = new CTAFleetAgent45(testBackupDir, ['/nonexistent/path']);
    await expect(invalidAgent.initiateBackup()).rejects.toThrow();
  });
});
```
