/**
 * Transaction Management Utilities
 *
 * Provides a clean interface for executing database transactions
 * with automatic rollback on errors and proper connection cleanup.
 *
 * USAGE:
 *   const txManager = new TransactionManager(pool)
 *
 *   const result = await txManager.withTransaction(async (client) => {
 *     await client.query('INSERT INTO table1 ...', [val1])
 *     await client.query('UPDATE table2 ...', [val2])
 *     return { success: true }
 *   })
 *
 * SECURITY:
 * - All queries within transactions MUST use parameterized queries
 * - Transactions automatically rolled back on any error
 * - Connections always released (even on error)
 */

import { Pool, PoolClient } from 'pg'
import { DatabaseError } from '../../middleware/errorHandler'
import { TransactionCallback } from './types'

export class TransactionManager {
  constructor(private pool: Pool) {}

  /**
   * Execute a callback within a database transaction
   *
   * @param callback - Async function that receives a PoolClient
   * @returns Result from callback
   * @throws DatabaseError if transaction fails
   */
  async withTransaction<R>(callback: TransactionCallback<R>): Promise<R> {
    const client = await this.pool.connect()

    try {
      // Begin transaction
      await client.query('BEGIN')

      // Execute callback with client
      const result = await callback(client)

      // Commit transaction
      await client.query('COMMIT')

      return result
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK')

      throw new DatabaseError('Transaction failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      // Always release connection back to pool
      client.release()
    }
  }

  /**
   * Execute a callback within a READ ONLY transaction
   * Useful for complex queries that need consistent snapshot
   *
   * @param callback - Async function that receives a PoolClient
   * @returns Result from callback
   */
  async withReadOnlyTransaction<R>(callback: TransactionCallback<R>): Promise<R> {
    const client = await this.pool.connect()

    try {
      // Begin read-only transaction
      await client.query('BEGIN TRANSACTION READ ONLY')

      // Execute callback with client
      const result = await callback(client)

      // Commit (no changes made, but releases locks)
      await client.query('COMMIT')

      return result
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK')

      throw new DatabaseError('Read-only transaction failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      // Always release connection back to pool
      client.release()
    }
  }

  /**
   * Execute a callback within a transaction with custom isolation level
   *
   * @param isolationLevel - Transaction isolation level
   * @param callback - Async function that receives a PoolClient
   * @returns Result from callback
   */
  async withIsolationLevel<R>(
    isolationLevel: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE',
    callback: TransactionCallback<R>
  ): Promise<R> {
    const client = await this.pool.connect()

    try {
      // Set isolation level and begin transaction
      await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`)

      // Execute callback with client
      const result = await callback(client)

      // Commit transaction
      await client.query('COMMIT')

      return result
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK')

      throw new DatabaseError(`Transaction failed (${isolationLevel})`, {
        isolationLevel,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      // Always release connection back to pool
      client.release()
    }
  }
}
