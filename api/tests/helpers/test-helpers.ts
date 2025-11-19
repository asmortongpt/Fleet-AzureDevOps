/**
 * Test Helpers and Utilities
 * Provides common testing utilities for API tests
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Pool, PoolClient } from 'pg';

// ========== Mock Express Objects ==========

export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: {
    id: 'test-user-id',
    tenant_id: 'test-tenant-id',
    role: 'admin',
  },
  ...overrides,
});

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    statusCode: 200,
    status: function (code: number) {
      this.statusCode = code;
      return this as Response;
    },
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res;
};

export const createMockNext = () => vi.fn();

// ========== JWT Utilities ==========

export const generateTestToken = (payload: any = {}) => {
  const defaultPayload = {
    id: 'test-user-id',
    tenant_id: 'test-tenant-id',
    email: 'test@example.com',
    role: 'admin',
    ...payload,
  };

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(defaultPayload, secret, { expiresIn: '1h' });
};

export const generateExpiredToken = (payload: any = {}) => {
  const defaultPayload = {
    id: 'test-user-id',
    tenant_id: 'test-tenant-id',
    email: 'test@example.com',
    role: 'admin',
    ...payload,
  };

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(defaultPayload, secret, { expiresIn: '-1h' });
};

// ========== Database Test Helpers ==========

export class DatabaseTestHelper {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async cleanAllTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete in reverse order of dependencies
      const tables = [
        'telemetry_data',
        'fuel_transactions',
        'maintenance_history',
        'work_orders',
        'maintenance_schedules',
        'inspections',
        'incident_photos',
        'incident_witnesses',
        'incident_actions',
        'incidents',
        'driver_assignments',
        'vehicle_documents',
        'documents',
        'geofences',
        'routes',
        'alerts',
        'vehicles',
        'drivers',
        'assets',
        'users',
        'tenants',
      ];

      for (const table of tables) {
        await client.query(`DELETE FROM ${table} WHERE 1=1`);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async insertTestData(table: string, data: any | any[]): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const records = Array.isArray(data) ? data : [data];
      const results = [];

      for (const record of records) {
        const columns = Object.keys(record);
        const values = Object.values(record);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
          INSERT INTO ${table} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;

        const result = await client.query(query, values);
        results.push(result.rows[0]);
      }

      return results;
    } finally {
      client.release();
    }
  }

  async getRecordById(table: string, id: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async countRecords(table: string, where?: string, params?: any[]): Promise<number> {
    const client = await this.pool.connect();
    try {
      const whereClause = where ? `WHERE ${where}` : '';
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${table} ${whereClause}`,
        params || []
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// ========== API Test Helpers ==========

export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await waitFor(delayMs);
      }
    }
  }

  throw lastError;
};

// ========== Date/Time Helpers ==========

export const createDateInPast = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

export const createDateInFuture = (daysAhead: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ========== Validation Helpers ==========

export const expectValidUUID = (value: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
};

export const expectValidISODate = (value: string) => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  expect(value).toMatch(isoDateRegex);
};

export const expectValidEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(value).toMatch(emailRegex);
};

// ========== Performance Testing Helpers ==========

export class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    this.endTime = performance.now();
    return this.getDuration();
  }

  getDuration(): number {
    return this.endTime - this.startTime;
  }

  assertDurationLessThan(maxMs: number): void {
    const duration = this.getDuration();
    expect(duration).toBeLessThan(maxMs);
  }
}

export const measureAsync = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const monitor = new PerformanceMonitor();
  monitor.start();
  const result = await fn();
  const duration = monitor.end();
  return { result, duration };
};

// ========== Multi-Tenant Test Helpers ==========

export const createTenantContext = (tenantId: string) => ({
  tenantId,
  createRequest: (overrides: Partial<Request> = {}) =>
    createMockRequest({
      user: { ...overrides.user, tenant_id: tenantId } as any,
      ...overrides,
    }),
  createToken: (payload: any = {}) =>
    generateTestToken({ tenant_id: tenantId, ...payload }),
});

// ========== Error Testing Helpers ==========

export const expectAsyncError = async (fn: () => Promise<any>, expectedError?: string | RegExp) => {
  let error: Error | undefined;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).toBeDefined();
  if (expectedError) {
    if (typeof expectedError === 'string') {
      expect(error?.message).toContain(expectedError);
    } else {
      expect(error?.message).toMatch(expectedError);
    }
  }
};

// ========== Mock External Services ==========

export const createMockFileUpload = (overrides: any = {}) => ({
  fieldname: 'file',
  originalname: 'test-file.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: Buffer.from('test file content'),
  size: 1024,
  ...overrides,
});

export const createMockEmailService = () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBulkEmail: vi.fn().mockResolvedValue({ sent: 10, failed: 0 }),
});

export const createMockSMSService = () => ({
  sendSMS: vi.fn().mockResolvedValue({ sid: 'test-sms-sid', status: 'sent' }),
});

export const createMockStorageService = () => ({
  uploadFile: vi.fn().mockResolvedValue({ url: 'https://storage.example.com/file.pdf' }),
  deleteFile: vi.fn().mockResolvedValue(true),
  getSignedUrl: vi.fn().mockResolvedValue('https://storage.example.com/signed-url'),
});

// ========== Test Data Builders ==========

export class TestDataBuilder<T> {
  private data: Partial<T> = {};

  constructor(private defaults: T) {
    this.data = { ...defaults };
  }

  with(key: keyof T, value: any): this {
    this.data[key] = value;
    return this;
  }

  withMany(values: Partial<T>): this {
    this.data = { ...this.data, ...values };
    return this;
  }

  build(): T {
    return { ...this.defaults, ...this.data } as T;
  }

  buildMany(count: number): T[] {
    return Array.from({ length: count }, () => this.build());
  }
}

// ========== Assertion Helpers ==========

export const expectArrayContainsObject = (array: any[], obj: Partial<any>) => {
  const found = array.some((item) =>
    Object.entries(obj).every(([key, value]) => item[key] === value)
  );
  expect(found).toBe(true);
};

export const expectPaginatedResponse = (response: any, expectedFields: string[] = ['data', 'total', 'page', 'pageSize']) => {
  expectedFields.forEach(field => {
    expect(response).toHaveProperty(field);
  });
  expect(Array.isArray(response.data)).toBe(true);
  expect(typeof response.total).toBe('number');
};
