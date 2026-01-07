import { Pool, PoolClient, QueryResult } from 'pg';
import { vi } from 'vitest';

/**
 * Shared database mock types for service tests
 *
 * This module provides type-safe mock implementations for PostgreSQL
 * Pool and PoolClient objects used throughout service tests.
 *
 * Usage:
 * ```typescript
 * import { createMockPool, createMockPoolClient, MockPool, MockPoolClient } from '../utils/test-db-mocks';
 *
 * const mockPool: MockPool = createMockPool();
 * const mockClient: MockPoolClient = createMockPoolClient();
 * ```
 */

export interface MockPool extends Partial<Pool> {
  connect: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

export interface MockPoolClient extends Partial<PoolClient> {
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
}

export interface MockDatabase {
  query: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
}

export interface MockLogger {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Pool instance with common methods
 */
export function createMockPool(): MockPool {
  return {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
}

/**
 * Creates a mock PoolClient instance with common methods
 */
export function createMockPoolClient(): MockPoolClient {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

/**
 * Creates a mock database instance with common methods
 */
export function createMockDatabase(): MockDatabase {
  return {
    query: vi.fn(),
    transaction: vi.fn(),
  };
}

/**
 * Creates a mock logger instance with common methods
 */
export function createMockLogger(): MockLogger {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Creates a typed QueryResult object for testing
 */
export function createMockQueryResult<T = unknown>(rows: T[]): QueryResult<T> {
  return {
    rows,
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: [],
  };
}
