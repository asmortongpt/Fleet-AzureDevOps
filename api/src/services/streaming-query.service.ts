/**
 * Streaming Query Service
 *
 * This service provides streaming capabilities for large result sets
 * to prevent memory issues and improve performance.
 */

import { Pool, QueryConfig } from 'pg'
import QueryStream from 'pg-query-stream'
import { Transform, Readable } from 'stream'

export interface StreamingOptions {
  batchSize?: number
  highWaterMark?: number
  transform?: (row: any) => any
  filter?: (row: any) => boolean
}

export class StreamingQueryService {
  /**
   * Stream query results
   */
  async streamQuery(
    pool: Pool,
    query: string | QueryConfig,
    options: StreamingOptions = {}
  ): Promise<Readable> {
    const {
      batchSize = 100,
      highWaterMark = 16384,
      transform,
      filter
    } = options

    // Create query stream
    const queryConfig = typeof query === 'string'
      ? new QueryStream(query, [], { batchSize, highWaterMark })
      : new QueryStream(query.text, query.values || [], { batchSize, highWaterMark })

    const client = await pool.connect()

    const stream = client.query(queryConfig)

    // Add cleanup on stream end
    stream.on('end', () => {
      client.release()
    })

    stream.on('error', (error) => {
      console.error('Stream error:', error)
      client.release()
    })

    // Apply transform and filter if provided
    if (transform || filter) {
      const transformStream = new Transform({
        objectMode: true,
        transform(row, encoding, callback) {
          // Apply filter
          if (filter && !filter(row)) {
            callback()
            return
          }

          // Apply transform
          const result = transform ? transform(row) : row
          callback(null, result)
        }
      })

      return stream.pipe(transformStream)
    }

    return stream
  }

  /**
   * Stream query to JSON array
   */
  async streamToJSONArray(
    pool: Pool,
    query: string | QueryConfig,
    options: StreamingOptions = {}
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const stream = await this.streamQuery(pool, query, options)
      const chunks: any[] = []
      let first = true

      chunks.push('[')

      stream.on('data', (row) => {
        if (!first) {
          chunks.push(',')
        }
        first = false
        chunks.push(JSON.stringify(row))
      })

      stream.on('end', () => {
        chunks.push(']')
        resolve(chunks.join(''))
      })

      stream.on('error', reject)
    })
  }

  /**
   * Stream query to CSV
   */
  async streamToCSV(
    pool: Pool,
    query: string | QueryConfig,
    options: StreamingOptions & { delimiter?: string; headers?: boolean } = {}
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const { delimiter = ',', headers = true } = options
      const stream = await this.streamQuery(pool, query, options)
      const chunks: string[] = []
      let headerWritten = false

      stream.on('data', (row) => {
        // Write headers on first row
        if (!headerWritten && headers) {
          const headerRow = Object.keys(row).join(delimiter)
          chunks.push(headerRow + '\n')
          headerWritten = true
        }

        // Write data row
        const values = Object.values(row).map(value => {
          if (value === null || value === undefined) {
            return ''
          }

          const strValue = String(value)
          // Escape values containing delimiter or quotes
          if (strValue.includes(delimiter) || strValue.includes('"') || strValue.includes('\n')) {
            return '"${strValue.replace(/"/g, '""')}"'
          }

          return strValue
        })

        chunks.push(values.join(delimiter) + '\n')
      })

      stream.on('end', () => {
        resolve(chunks.join(''))
      })

      stream.on('error', reject)
    })
  }

  /**
   * Stream query and process in batches
   */
  async streamBatches<T = any>(
    pool: Pool,
    query: string | QueryConfig,
    batchProcessor: (batch: T[]) => Promise<void>,
    options: StreamingOptions & { batchSize?: number } = {}
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const { batchSize = 100 } = options
      const stream = await this.streamQuery(pool, query, options)
      let batch: T[] = []
      let totalProcessed = 0

      stream.on('data', async (row: T) => {
        batch.push(row)

        if (batch.length >= batchSize) {
          // Pause stream while processing batch
          stream.pause()

          try {
            await batchProcessor(batch)
            totalProcessed += batch.length
            batch = []
            stream.resume()
          } catch (error) {
            stream.destroy(error as Error)
          }
        }
      })

      stream.on('end', async () => {
        // Process remaining batch
        if (batch.length > 0) {
          try {
            await batchProcessor(batch)
            totalProcessed += batch.length
          } catch (error) {
            reject(error)
            return
          }
        }

        resolve(totalProcessed)
      })

      stream.on('error', reject)
    })
  }

  /**
   * Stream aggregation - process rows and compute aggregates without loading all data
   */
  async streamAggregate<T = any>(
    pool: Pool,
    query: string | QueryConfig,
    aggregator: {
      initial: T
      accumulator: (acc: T, row: any) => T
      finalizer?: (acc: T) => T
    },
    options: StreamingOptions = {}
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const stream = await this.streamQuery(pool, query, options)
      let accumulator = aggregator.initial

      stream.on('data', (row) => {
        accumulator = aggregator.accumulator(accumulator, row)
      })

      stream.on('end', () => {
        const result = aggregator.finalizer
          ? aggregator.finalizer(accumulator)
          : accumulator

        resolve(result)
      })

      stream.on('error', reject)
    })
  }

  /**
   * Count rows without loading into memory
   */
  async streamCount(
    pool: Pool,
    query: string | QueryConfig,
    options: StreamingOptions = {}
  ): Promise<number> {
    return this.streamAggregate(
      pool,
      query,
      {
        initial: 0,
        accumulator: (count) => count + 1
      },
      options
    )
  }

  /**
   * Get paginated results using cursor-based pagination (more efficient than OFFSET)
   */
  async getPaginatedResults<T = any>(
    pool: Pool,
    baseQuery: string,
    options: {
      cursorColumn: string
      cursorValue?: any
      limit?: number
      direction?: 'asc' | 'desc'
      where?: string
      params?: any[]
    }
  ): Promise<{ data: T[]; nextCursor: any; hasMore: boolean }> {
    const {
      cursorColumn,
      cursorValue,
      limit = 100,
      direction = 'asc',
      where = '',
      params = []
    } = options

    // Build query with cursor
    let query = baseQuery
    const queryParams = [...params]

    if (cursorValue !== undefined) {
      const operator = direction === 'asc' ? '>' : '<'
      const cursorCondition = `${cursorColumn} ${operator} $${queryParams.length + 1}`

      if (where) {
        query += ` AND ${cursorCondition}`
      } else {
        query += ` WHERE ${cursorCondition}`
      }

      queryParams.push(cursorValue)
    }

    // Add ORDER BY and LIMIT
    query += ` ORDER BY ${cursorColumn} ${direction.toUpperCase()} LIMIT ${limit + 1}`

    // Execute query
    const result = await pool.query(query, queryParams)

    // Check if there are more results
    const hasMore = result.rows.length > limit
    const data = hasMore ? result.rows.slice(0, limit) : result.rows

    // Get next cursor
    const nextCursor = hasMore ? data[data.length - 1][cursorColumn] : null

    return {
      data,
      nextCursor,
      hasMore
    }
  }
}

// Singleton instance
export const streamingQueryService = new StreamingQueryService()

export default streamingQueryService
