/**
 * Database Module
 *
 * Centralized database management for the Fleet API including:
 * - Connection pool management with lazy initialization
 * - Pool monitoring and alerting
 * - Graceful shutdown handling
 *
 * @module database
 */

export {
  DatabaseConnectionManager,
  databaseConnectionManager,
  initializeDatabaseManager,
  PoolType
} from './connectionManager';

export {
  PoolMonitor,
  poolMonitor,
  startPoolMonitor,
  stopPoolMonitor,
  type PoolMetrics,
  type PoolAlert,
  type AlertConfig
} from './poolMonitor';

/**
 * Initialize database systems
 *
 * This should be called during application startup to:
 * 1. Setup connection manager with graceful shutdown handlers
 * 2. Start pool monitoring
 *
 * @param options - Initialization options
 */
export async function initializeDatabase(options?: {
  eagerInit?: boolean;
  startMonitor?: boolean;
  monitorIntervalMs?: number;
}): Promise<void> {
  const {
    eagerInit = process.env.DB_EAGER_INIT === 'true',
    startMonitor = process.env.DB_MONITOR_ENABLED !== 'false',
    monitorIntervalMs = parseInt(process.env.DB_METRICS_INTERVAL_MS || '60000')
  } = options || {};

  console.log('[Database] Initializing database systems...');

  // Import and initialize connection manager (new system)
  const { initializeDatabaseManager } = await import('./connectionManager');
  await initializeDatabaseManager();

  // Also initialize legacy connection manager for backward compatibility
  // This is needed because 166+ files still import from /config/database
  try {
    const { initializeConnectionManager } = await import('../config/connection-manager');
    await initializeConnectionManager();
    console.log('[Database] Legacy connection manager initialized');
  } catch (error) {
    console.warn('[Database] Failed to initialize legacy connection manager:', error);
  }

  // Start pool monitoring if enabled
  if (startMonitor) {
    const { poolMonitor } = await import('./poolMonitor');
    poolMonitor.start();
    console.log(`[Database] Pool monitoring started (interval: ${monitorIntervalMs}ms)`);
  }

  // Eager initialization if requested
  if (eagerInit) {
    const { databaseConnectionManager } = await import('./connectionManager');
    await databaseConnectionManager.getWritePool();
    console.log('[Database] Eager initialization complete');
  }

  console.log('[Database] Database systems initialized');
}

/**
 * Shutdown database systems gracefully
 *
 * This should be called during application shutdown to:
 * 1. Stop pool monitoring
 * 2. Wait for active queries to complete
 * 3. Close all connection pools
 */
export async function shutdownDatabase(): Promise<void> {
  console.log('[Database] Initiating database shutdown...');

  // Stop pool monitoring
  const { stopPoolMonitor } = await import('./poolMonitor');
  stopPoolMonitor();

  // Graceful shutdown of connection manager
  const { databaseConnectionManager } = await import('./connectionManager');
  await databaseConnectionManager.gracefulShutdown();

  console.log('[Database] Database shutdown complete');
}
