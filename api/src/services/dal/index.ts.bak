/**
 * Data Access Layer (DAL) Module
 * Provides a standardized interface for database operations
 */

export { BaseRepository } from './BaseRepository'
export { QueryLogger, globalQueryLogger } from './QueryLogger'
export {
  DatabaseError,
  NotFoundError,
  ValidationError,
  ConflictError,
  TransactionError,
  ConnectionError,
  handleDatabaseError
} from './errors'
export {
  withTransaction,
  withTransactionIsolation,
  withNestedTransaction,
  withTransactionRetry,
  batchTransaction,
  withTransactionTimeout,
  TransactionManager
} from './transactions'

// Re-export connection manager
export {
  ConnectionManager,
  connectionManager,
  PoolType,
  initializeConnectionManager
} from '../../config/connection-manager'
