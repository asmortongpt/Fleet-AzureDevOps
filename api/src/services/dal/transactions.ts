import { Pool, PoolClient } from 'pg'
import { TransactionError } from './errors'

// Allowlist of valid PostgreSQL isolation levels
const VALID_ISOLATION_LEVELS = [
  'READ UNCOMMITTED',
  'READ COMMITTED',
  'REPEATABLE READ',
  'SERIALIZABLE'
] as const;

type IsolationLevel = typeof VALID_ISOLATION_LEVELS[number];

function isValidIsolationLevel(level: string): level is IsolationLevel {
  return VALID_ISOLATION_LEVELS.includes(level as IsolationLevel);
}

// Validate savepoint names to prevent SQL injection
// PostgreSQL identifiers: start with letter/underscore, contain alphanumeric/underscore, max 63 chars
const VALID_SAVEPOINT_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

function isValidSavepointName(name: string): boolean {
  return VALID_SAVEPOINT_PATTERN.test(name);
}

function validateSavepointName(name: string): void {
  if (!isValidSavepointName(name)) {
    throw new TransactionError(`Invalid savepoint name: ${name}`);
  }
}

/**
 * Transaction context for nested transaction support
 */
interface TransactionContext {
  client: PoolClient
  level: number
  savepointName?: string
}

/**
 * Execute a callback within a database transaction
 * Automatically handles commit/rollback and connection cleanup
 *
 * @param pool - Database connection pool
 * @param callback - Async function to execute within the transaction
 * @returns Result of the callback function
 *
 * @example
 * const result = await withTransaction(pool, async (client) => {
 *   const user = await client.query('INSERT INTO users...')
 *   const profile = await client.query('INSERT INTO profiles...')
 *   return { user, profile }
 * })
 */
export async function withTransaction<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction rolled back:', error)
    throw new TransactionError(
      error instanceof Error ? error.message : 'Transaction failed'
    )
  } finally {
    client.release()
  }
}

/**
 * Execute a callback within a transaction with isolation level
 *
 * @param pool - Database connection pool
 * @param isolationLevel - Transaction isolation level
 * @param callback - Async function to execute within the transaction
 * @returns Result of the callback function
 *
 * @example
 * const result = await withTransactionIsolation(
 *   pool,
 *   'SERIALIZABLE',
 *   async (client) => {
 *     // Your transaction logic here
 *   }
 * )
 */
export async function withTransactionIsolation<T>(
  pool: Pool,
  isolationLevel: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE',
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  // Validate isolation level against allowlist
  if (!isValidIsolationLevel(isolationLevel)) {
    throw new TransactionError(`Invalid isolation level: ${isolationLevel}`);
  }

  const client = await pool.connect()

  try {
    // Isolation level is validated, safe to use in query
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`)
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction rolled back:', error)
    throw new TransactionError(
      error instanceof Error ? error.message : 'Transaction failed'
    )
  } finally {
    client.release()
  }
}

/**
 * Execute nested transactions using savepoints
 *
 * @param client - Existing database client (from parent transaction)
 * @param callback - Async function to execute within the nested transaction
 * @param savepointName - Optional custom savepoint name
 * @returns Result of the callback function
 *
 * @example
 * await withTransaction(pool, async (client) => {
 *   await client.query('INSERT INTO users...')
 *
 *   try {
 *     await withNestedTransaction(client, async () => {
 *       await client.query('INSERT INTO profiles...')
 *     })
 *   } catch (error) {
 *     // Nested transaction rolled back, but parent continues
 *   }
 *
 *   await client.query('INSERT INTO logs...')
 * })
 */
export async function withNestedTransaction<T>(
  client: PoolClient,
  callback: () => Promise<T>,
  savepointName: string = `sp_${Date.now()}`
): Promise<T> {
  // Validate savepoint name to prevent SQL injection
  validateSavepointName(savepointName);

  try {
    // Savepoint name is validated, safe to use in query
    await client.query(`SAVEPOINT ${savepointName}`)
    const result = await callback()
    await client.query(`RELEASE SAVEPOINT ${savepointName}`)
    return result
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`)
    console.error('Nested transaction rolled back:', error)
    throw new TransactionError(
      error instanceof Error ? error.message : 'Nested transaction failed'
    )
  }
}

/**
 * Execute multiple operations in a transaction with retry logic
 *
 * @param pool - Database connection pool
 * @param callback - Async function to execute within the transaction
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in milliseconds (default: 100)
 * @returns Result of the callback function
 *
 * @example
 * const result = await withTransactionRetry(pool, async (client) => {
 *   // Operations that might have serialization conflicts
 * }, 5, 200)
 */
export async function withTransactionRetry<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 100
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(pool, callback)
    } catch (error: any) {
      lastError = error

      // Retry on serialization failures or deadlocks
      const shouldRetry =
        error.code === '40001' || // serialization_failure
        error.code === '40P01'    // deadlock_detected

      if (!shouldRetry || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))

      console.warn(`Transaction retry attempt ${attempt + 1}/${maxRetries}`)
    }
  }

  throw lastError || new TransactionError('Transaction failed after retries')
}

/**
 * Batch operations within a single transaction
 *
 * @param pool - Database connection pool
 * @param operations - Array of async operations to execute
 * @returns Array of results from all operations
 *
 * @example
 * const results = await batchTransaction(pool, [
 *   (client) => client.query('INSERT INTO table1...'),
 *   (client) => client.query('INSERT INTO table2...'),
 *   (client) => client.query('INSERT INTO table3...')
 * ])
 */
export async function batchTransaction<T>(
  pool: Pool,
  operations: Array<(client: PoolClient) => Promise<T>>
): Promise<T[]> {
  return withTransaction(pool, async (client) => {
    const results: T[] = []

    for (const operation of operations) {
      const result = await operation(client)
      results.push(result)
    }

    return results
  })
}

/**
 * Execute a transaction with a timeout
 *
 * @param pool - Database connection pool
 * @param callback - Async function to execute within the transaction
 * @param timeoutMs - Timeout in milliseconds
 * @returns Result of the callback function
 *
 * @example
 * const result = await withTransactionTimeout(pool, async (client) => {
 *   // Long-running operations
 * }, 5000)
 */
export async function withTransactionTimeout<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise<T>(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TransactionError(`Transaction timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    try {
      const result = await withTransaction(pool, callback)
      clearTimeout(timeoutId)
      resolve(result)
    } catch (error) {
      clearTimeout(timeoutId)
      reject(error)
    }
  })
}

/**
 * Transaction manager class for advanced transaction control
 */
export class TransactionManager {
  private client: PoolClient | null = null
  private transactionLevel: number = 0
  private savepoints: string[] = []

  constructor(private pool: Pool) {}

  /**
   * Begin a new transaction
   */
  async begin(isolationLevel?: IsolationLevel): Promise<void> {
    if (this.transactionLevel === 0) {
      this.client = await this.pool.connect()
      let isolationClause = ''
      if (isolationLevel) {
        // Validate isolation level against allowlist
        if (!isValidIsolationLevel(isolationLevel)) {
          throw new TransactionError(`Invalid isolation level: ${isolationLevel}`);
        }
        isolationClause = ` ISOLATION LEVEL ${isolationLevel}`
      }
      await this.client.query(`BEGIN${isolationClause}`)
    } else {
      // Nested transaction: create savepoint
      // Savepoint name is generated from a numeric counter, safe pattern
      const savepointName = `sp_level_${this.transactionLevel}`
      validateSavepointName(savepointName);
      this.savepoints.push(savepointName)
      await this.client!.query(`SAVEPOINT ${savepointName}`)
    }
    this.transactionLevel++
  }

  /**
   * Commit the current transaction
   */
  async commit(): Promise<void> {
    if (this.transactionLevel === 0) {
      throw new TransactionError('No active transaction to commit')
    }

    this.transactionLevel--

    if (this.transactionLevel === 0) {
      await this.client!.query('COMMIT')
      this.client!.release()
      this.client = null
      this.savepoints = []
    } else {
      // Release savepoint
      const savepointName = this.savepoints.pop()
      if (savepointName) {
        // Savepoint names are generated internally, but validate for safety
        validateSavepointName(savepointName);
        await this.client!.query(`RELEASE SAVEPOINT ${savepointName}`)
      }
    }
  }

  /**
   * Rollback the current transaction
   */
  async rollback(): Promise<void> {
    if (this.transactionLevel === 0) {
      throw new TransactionError('No active transaction to rollback')
    }

    this.transactionLevel--

    if (this.transactionLevel === 0) {
      await this.client!.query('ROLLBACK')
      this.client!.release()
      this.client = null
      this.savepoints = []
    } else {
      // Rollback to savepoint
      const savepointName = this.savepoints.pop()
      if (savepointName) {
        // Savepoint names are generated internally, but validate for safety
        validateSavepointName(savepointName);
        await this.client!.query(`ROLLBACK TO SAVEPOINT ${savepointName}`)
      }
    }
  }

  /**
   * Get the current transaction client
   */
  getClient(): PoolClient {
    if (!this.client) {
      throw new TransactionError('No active transaction')
    }
    return this.client
  }

  /**
   * Check if a transaction is active
   */
  isActive(): boolean {
    return this.transactionLevel > 0
  }

  /**
   * Get current transaction level
   */
  getLevel(): number {
    return this.transactionLevel
  }
}
