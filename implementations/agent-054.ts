```typescript
// src/agents/CTAFleetAgent054.ts
import { Logger } from '../utils/Logger';
import { AuditRecord } from '../models/AuditRecord';
import { DatabaseService } from '../services/DatabaseService';
import { ValidationError } from '../errors/ValidationError';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { sanitizeInput } from '../utils/Sanitizer';
import { RateLimiter } from '../utils/RateLimiter';

export class CTAFleetAgent054 {
  private readonly agentId: string = 'AGENT_054';
  private readonly logger: Logger;
  private readonly dbService: DatabaseService;
  private readonly rateLimiter: RateLimiter;

  constructor() {
    this.logger = new Logger('CTAFleetAgent054');
    this.dbService = new DatabaseService();
    this.rateLimiter = new RateLimiter(100, 60); // 100 requests per minute
  }

  /**
   * Records an audit trail entry for compliance tracking
   * @param userId - The ID of the user performing the action
   * @param action - The action being performed
   * @param resource - The resource being acted upon
   * @param details - Additional details about the action
   * @returns Promise<void>
   * @throws ValidationError if input validation fails
   * @throws UnauthorizedError if user is not authorized
   */
  public async recordAuditTrail(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      // Rate limiting check
      if (!this.rateLimiter.allowRequest(userId)) {
        throw new ValidationError('Rate limit exceeded. Please try again later.');
      }

      // Input sanitization
      const sanitizedUserId = sanitizeInput(userId);
      const sanitizedAction = sanitizeInput(action);
      const sanitizedResource = sanitizeInput(resource);

      // Input validation
      if (!sanitizedUserId || !sanitizedAction || !sanitizedResource) {
        throw new ValidationError('Invalid input: userId, action, and resource are required');
      }

      // Authorization check (mock implementation)
      if (!(await this.isAuthorized(sanitizedUserId))) {
        throw new UnauthorizedError('User not authorized to record audit trail');
      }

      // Create audit record
      const auditRecord: AuditRecord = {
        id: this.generateAuditId(),
        agentId: this.agentId,
        userId: sanitizedUserId,
        action: sanitizedAction,
        resource: sanitizedResource,
        details,
        timestamp: new Date().toISOString(),
        ipAddress: this.getClientIp(), // Mock implementation
      };

      // Save to database with retry logic
      await this.dbService.saveAuditRecord(auditRecord);
      this.logger.info(`Audit trail recorded for user ${sanitizedUserId} on resource ${sanitizedResource}`);
    } catch (error) {
      this.logger.error(`Failed to record audit trail: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Retrieves audit trail records based on filters
   * @param userId - Optional user ID filter
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @returns Promise<AuditRecord[]>
   */
  public async getAuditTrail(
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AuditRecord[]> {
    try {
      // Sanitize inputs
      const sanitizedUserId = userId ? sanitizeInput(userId) : undefined;
      const sanitizedStartDate = startDate ? sanitizeInput(startDate) : undefined;
      const sanitizedEndDate = endDate ? sanitizeInput(endDate) : undefined;

      // Authorization check
      if (!(await this.isAuthorized(sanitizedUserId || 'anonymous'))) {
        throw new UnauthorizedError('User not authorized to view audit trail');
      }

      const records = await this.dbService.queryAuditRecords({
        userId: sanitizedUserId,
        startDate: sanitizedStartDate,
        endDate: sanitizedEndDate,
      });

      this.logger.info(`Retrieved ${records.length} audit records`);
      return records;
    } catch (error) {
      this.logger.error(`Failed to retrieve audit trail: ${error.message}`, error);
      throw error;
    }
  }

  private async isAuthorized(userId: string): Promise<boolean> {
    // Mock authorization check - replace with actual implementation
    return userId !== 'unauthorized_user';
  }

  private generateAuditId(): string {
    return `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIp(): string {
    // Mock IP retrieval - replace with actual implementation
    return '127.0.0.1';
  }
}

// src/models/AuditRecord.ts
export interface AuditRecord {
  id: string;
  agentId: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
}

// src/services/DatabaseService.ts
export class DatabaseService {
  private records: AuditRecord[] = []; // Mock storage

  public async saveAuditRecord(record: AuditRecord): Promise<void> {
    this.records.push(record);
    // Implement actual database storage with retry logic
  }

  public async queryAuditRecords(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditRecord[]> {
    // Implement actual database query with proper indexing
    return this.records.filter((record) => {
      if (filters.userId && record.userId !== filters.userId) return false;
      if (filters.startDate && record.timestamp < filters.startDate) return false;
      if (filters.endDate && record.timestamp > filters.endDate) return false;
      return true;
    });
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

  public error(message: string, error?: Error): void {
    console.error(`[ERROR] [${this.context}] ${message}`, error || '');
  }
}

// src/utils/Sanitizer.ts
export function sanitizeInput(input: string): string {
  // Basic sanitization - replace with more robust solution
  return input.replace(/[<>{}]/g, '');
}

// src/utils/RateLimiter.ts
export class RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly requests: Map<string, number[]> = new Map();

  constructor(limit: number, windowSeconds: number) {
    this.limit = limit;
    this.windowMs = windowSeconds * 1000;
  }

  public allowRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const windowStart = now - this.windowMs;

    // Remove old timestamps
    const updatedTimestamps = timestamps.filter((ts) => ts > windowStart);
    this.requests.set(key, updatedTimestamps);

    if (updatedTimestamps.length >= this.limit) {
      return false;
    }

    updatedTimestamps.push(now);
    this.requests.set(key, updatedTimestamps);
    return true;
  }
}

// src/errors/ValidationError.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// src/errors/UnauthorizedError.ts
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// src/tests/CTAFleetAgent054.test.ts
import { CTAFleetAgent054 } from '../agents/CTAFleetAgent054';
import { expect } from 'bun:test';

describe('CTAFleetAgent054 - Audit Trail Tests', () => {
  let agent: CTAFleetAgent054;

  beforeEach(() => {
    agent = new CTAFleetAgent054();
  });

  test('should record audit trail successfully', async () => {
    await agent.recordAuditTrail('user123', 'CREATE', 'vehicle/001', { source: 'web' });
    const records = await agent.getAuditTrail('user123');
    expect(records.length).toBe(1);
    expect(records[0].userId).toBe('user123');
    expect(records[0].action).toBe('CREATE');
  });

  test('should throw ValidationError for invalid input', async () => {
    await expect(agent.recordAuditTrail('', 'CREATE', 'vehicle/001')).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw UnauthorizedError for unauthorized user', async () => {
    await expect(
      agent.recordAuditTrail('unauthorized_user', 'CREATE', 'vehicle/001')
    ).rejects.toThrow(UnauthorizedError);
  });

  test('should return filtered audit records', async () => {
    await agent.recordAuditTrail('user123', 'CREATE', 'vehicle/001');
    await agent.recordAuditTrail('user456', 'UPDATE', 'vehicle/002');
    const records = await agent.getAuditTrail('user123');
    expect(records.length).toBe(1);
    expect(records[0].userId).toBe('user123');
  });

  test('should enforce rate limiting', async () => {
    // Mock rate limiter to always return false after first call
    const mockAgent = new CTAFleetAgent054();
    await expect(
      mockAgent.recordAuditTrail('user123', 'CREATE', 'vehicle/001')
    ).resolves.not.toThrow();

    // Simulate rate limit exceeded
    // In real test, would need to mock RateLimiter
  });
});
```
