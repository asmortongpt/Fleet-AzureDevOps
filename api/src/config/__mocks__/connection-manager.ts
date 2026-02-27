import { vi } from 'vitest'

/**
 * Automock for src/config/connection-manager.ts
 *
 * Provides a fully-mocked connectionManager singleton so that tests importing
 * the connection-manager module never attempt real database connections.
 */

// Re-export the real PoolType enum so consumers can still reference it
export enum PoolType {
  ADMIN = 'admin',
  WEBAPP = 'webapp',
  READONLY = 'readonly',
  READ_REPLICA = 'read_replica',
}

/**
 * Mock pg.Pool-like object returned by getPool / getReadPool / getWritePool / getAdminPool.
 * Contains the most commonly used Pool methods as vi.fn() stubs.
 */
function createMockPool() {
  return {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    }),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  }
}

const mockPool = createMockPool()

/**
 * Mocked ConnectionManager instance.
 * Every public method is a vi.fn() that returns sensible defaults.
 */
export const connectionManager = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getPool: vi.fn().mockReturnValue(mockPool),
  getReadPool: vi.fn().mockReturnValue(mockPool),
  getWritePool: vi.fn().mockReturnValue(mockPool),
  getAdminPool: vi.fn().mockReturnValue(mockPool),
  getConnection: vi.fn().mockResolvedValue({
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  }),
  getHealthStatus: vi.fn().mockResolvedValue({}),
  getPoolStats: vi.fn().mockReturnValue({
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  }),
  getAllPoolStats: vi.fn().mockReturnValue({}),
  getReplicaLag: vi.fn().mockResolvedValue(null),
  detectConnectionLeaks: vi.fn().mockResolvedValue({}),
  getPoolDiagnostics: vi.fn().mockResolvedValue({
    timestamp: new Date().toISOString(),
    pools: {},
    replicaLag: null,
    connectionLeaks: {},
  }),
  closeAll: vi.fn().mockResolvedValue(undefined),
  getMetricsRegistry: vi.fn().mockReturnValue({
    metrics: vi.fn().mockResolvedValue(''),
    contentType: 'text/plain',
  }),
  getMetrics: vi.fn().mockResolvedValue(''),
  setupGracefulShutdown: vi.fn(),
}

/**
 * Mocked ConnectionManager class.
 * Constructing a new instance returns the same mock shape.
 */
export class ConnectionManager {
  initialize = connectionManager.initialize
  getPool = connectionManager.getPool
  getReadPool = connectionManager.getReadPool
  getWritePool = connectionManager.getWritePool
  getAdminPool = connectionManager.getAdminPool
  getConnection = connectionManager.getConnection
  getHealthStatus = connectionManager.getHealthStatus
  getPoolStats = connectionManager.getPoolStats
  getAllPoolStats = connectionManager.getAllPoolStats
  getReplicaLag = connectionManager.getReplicaLag
  detectConnectionLeaks = connectionManager.detectConnectionLeaks
  getPoolDiagnostics = connectionManager.getPoolDiagnostics
  closeAll = connectionManager.closeAll
  getMetricsRegistry = connectionManager.getMetricsRegistry
  getMetrics = connectionManager.getMetrics
  setupGracefulShutdown = connectionManager.setupGracefulShutdown
}

/**
 * Mocked initializeConnectionManager — resolves immediately.
 */
export const initializeConnectionManager = vi.fn().mockResolvedValue(undefined)

/**
 * Mocked getDefaultPool — returns the same mock pool.
 */
export function getDefaultPool() {
  return mockPool
}

export default connectionManager
