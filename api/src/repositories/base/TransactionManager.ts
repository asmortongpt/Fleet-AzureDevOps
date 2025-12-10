import { Pool, PoolClient } from 'pg'

/**
 * Transaction Manager Utility
 * Provides transaction context for multiple repository operations
 *
 * Example usage:
 * const txn = new TransactionManager(pool)
 * await txn.execute(async (client) => {
 *   await vehicleRepo.create(vehicleData, tenantId, client)
 *   await maintenanceRepo.create(maintenanceData, tenantId, client)
 *   // Both operations committed atomically
 * })
 */
export class TransactionManager {
  private pool: Pool
  private client: PoolClient | null = null
  private isActive: boolean = false

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Begin transaction
   * Acquires connection from pool and executes BEGIN
   */
  async begin(): Promise<void> {
    if (this.isActive) {
      throw new Error('Transaction already active')
    }
    this.client = await this.pool.connect()
    await this.client.query('BEGIN')
    this.isActive = true
  }

  /**
   * Commit transaction
   * Commits changes and releases connection back to pool
   */
  async commit(): Promise<void> {
    if (!this.isActive || !this.client) {
      throw new Error('No active transaction to commit')
    }
    await this.client.query('COMMIT')
    this.client.release()
    this.client = null
    this.isActive = false
  }

  /**
   * Rollback transaction
   * Reverts all changes and releases connection
   */
  async rollback(): Promise<void> {
    if (!this.isActive || !this.client) {
      throw new Error('No active transaction to rollback')
    }
    await this.client.query('ROLLBACK')
    this.client.release()
    this.client = null
    this.isActive = false
  }

  /**
   * Execute callback within transaction
   * Automatically handles BEGIN, COMMIT, and ROLLBACK on error
   */
  async execute<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    await this.begin()
    try {
      if (!this.client) {
        throw new Error('Transaction client not initialized')
      }
      const result = await callback(this.client)
      await this.commit()
      return result
    } catch (error) {
      await this.rollback()
      throw error
    }
  }

  /**
   * Get current transaction client
   * Returns null if no transaction is active
   */
  getClient(): PoolClient | null {
    return this.client
  }

  /**
   * Check if transaction is active
   */
  isTransactionActive(): boolean {
    return this.isActive
  }
}

/**
 * Helper function for quick transactions
 * Simplifies transaction usage for single operations
 *
 * Example:
 * await withTransaction(pool, async (client) => {
 *   await client.query('INSERT INTO ...', [...])
 *   await client.query('UPDATE ...', [...])
 * })
 */
export async function withTransaction<T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const txn = new TransactionManager(pool)
  return txn.execute(callback)
}
