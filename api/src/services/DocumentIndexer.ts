/**
 * Document Indexer Service
 *
 * Advanced document indexing system for full-text search
 *
 * Features:
 * - Real-time indexing on document upload
 * - Incremental indexing for updates
 * - Background reindexing jobs
 * - Index optimization and maintenance
 * - Custom analyzers for different languages
 * - Batch indexing for performance
 */

import pool from '../config/database'
import SearchIndexService from './SearchIndexService'

export interface IndexingJob {
  id: string
  job_type: 'index' | 'reindex' | 'optimize' | 'delete'
  document_id?: string
  tenant_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total_documents?: number
  processed_documents?: number
  error_message?: string
  started_at?: Date
  completed_at?: Date
  created_at: Date
}

export interface IndexStats {
  total_documents: number
  indexed_documents: number
  pending_documents: number
  failed_documents: number
  index_size_bytes: number
  last_optimization: Date
  avg_indexing_time_ms: number
}

export class DocumentIndexer {
  private isRunning: boolean = false
  private currentJob: IndexingJob | null = null
  private batchSize: number = 100
  private jobCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start background job processor
    this.startJobProcessor()
  }

  /**
   * Index a single document in real-time
   */
  async indexDocument(
    documentId: string,
    tenantId: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(`Indexing document ${documentId}...`)

      // Get document data
      const result = await pool.query(
        `SELECT
          d.*,
          dc.category_name,
          u.first_name || ' ' || u.last_name as uploaded_by_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = $1 AND d.tenant_id = $2`,
        [documentId, tenantId]
      )

      if (result.rows.length === 0) {
        throw new Error('Document not found')
      }

      const document = result.rows[0]

      // Build search vector from document fields
      const searchContent = this.buildSearchContent(document)

      // Update document with search vector
      await pool.query(
        `UPDATE documents
         SET
           search_vector = to_tsvector('english', $1),
           indexed_at = NOW(),
           index_status = 'indexed'
         WHERE id = $2`,
        [searchContent, documentId]
      )

      // Update indexing stats
      const indexingTime = Date.now() - startTime
      await this.updateIndexingStats(tenantId, documentId, indexingTime, 'success')

      console.log(`Document ${documentId} indexed successfully in ${indexingTime}ms`)

      // Clear search cache to reflect new content
      await SearchIndexService.clearCache()
    } catch (error) {
      console.error(`Error indexing document ${documentId}:`, error)
      await this.updateIndexingStats(tenantId, documentId, Date.now() - startTime, 'failed')
      throw error
    }
  }

  /**
   * Build searchable content from document fields
   */
  private buildSearchContent(document: any): string {
    const parts: string[] = []

    // File name (highest weight)
    if (document.file_name) {
      parts.push(document.file_name.repeat(4)) // Boost file name
    }

    // Description
    if (document.description) {
      parts.push(document.description.repeat(2)) // Boost description
    }

    // Extracted text (main content)
    if (document.extracted_text) {
      parts.push(document.extracted_text)
    }

    // Tags
    if (document.tags && Array.isArray(document.tags)) {
      parts.push(document.tags.join(' ').repeat(3)) // Boost tags
    }

    // Category
    if (document.category_name) {
      parts.push(document.category_name.repeat(2))
    }

    // Metadata
    if (document.metadata) {
      try {
        const metadata = typeof document.metadata === 'string'
          ? JSON.parse(document.metadata)
          : document.metadata

        const metadataText = Object.values(metadata)
          .filter(v => typeof v === 'string')
          .join(' ')

        if (metadataText) {
          parts.push(metadataText)
        }
      } catch (error) {
        // Ignore metadata parsing errors
      }
    }

    return parts.join(' ')
  }

  /**
   * Update document index incrementally
   */
  async updateDocumentIndex(
    documentId: string,
    tenantId: string,
    updatedFields: string[]
  ): Promise<void> {
    console.log(`Updating index for document ${documentId} (fields: ${updatedFields.join(', ')})`)

    // For now, just reindex the entire document
    // In production, this could be optimized to only update specific fields
    await this.indexDocument(documentId, tenantId, 'high')
  }

  /**
   * Remove document from index
   */
  async deleteDocumentIndex(documentId: string, tenantId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE documents
         SET
           search_vector = NULL,
           indexed_at = NULL,
           index_status = 'deleted'
         WHERE id = $1 AND tenant_id = $2`,
        [documentId, tenantId]
      )

      console.log(`Document ${documentId} removed from index`)

      // Clear search cache
      await SearchIndexService.clearCache()
    } catch (error) {
      console.error(`Error deleting document index ${documentId}:`, error)
      throw error
    }
  }

  /**
   * Create a background reindexing job
   */
  async createReindexJob(
    tenantId: string,
    options?: {
      categoryId?: string
      documentIds?: string[]
      fullReindex?: boolean
    }
  ): Promise<IndexingJob> {
    try {
      // Count documents to be reindexed
      let countQuery = 'SELECT COUNT(*) as count FROM documents WHERE tenant_id = $1'
      const countParams: any[] = [tenantId]

      if (options?.categoryId) {
        countQuery += ' AND category_id = $2'
        countParams.push(options.categoryId)
      }

      if (options?.documentIds && options.documentIds.length > 0) {
        countQuery += ' AND id = ANY($2)'
        countParams.push(options.documentIds)
      }

      if (!options?.fullReindex) {
        countQuery += ' AND (index_status IS NULL OR index_status != \'indexed\')'
      }

      const countResult = await pool.query(countQuery, countParams)
      const totalDocuments = parseInt(countResult.rows[0].count)

      // Create indexing job
      const result = await pool.query(
        `INSERT INTO indexing_jobs (
          tenant_id, job_type, status, progress,
          total_documents, processed_documents,
          metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          tenantId,
          'reindex',
          'pending',
          0,
          totalDocuments,
          0,
          JSON.stringify(options || {})
        ]
      )

      console.log(`Created reindexing job for ${totalDocuments} documents`)

      return result.rows[0]
    } catch (error) {
      console.error('Error creating reindex job:', error)
      throw error
    }
  }

  /**
   * Process a reindexing job in the background
   */
  private async processReindexJob(job: IndexingJob): Promise<void> {
    console.log(`Processing reindex job ${job.id}...`)

    try {
      // Update job status to processing
      await pool.query(
        `UPDATE indexing_jobs
         SET status = 'processing', started_at = NOW()
         WHERE id = $1`,
        [job.id]
      )

      const metadata = JSON.parse((job as any).metadata || '{}')

      // Build query to get documents
      let query = `
        SELECT id
        FROM documents
        WHERE tenant_id = $1
      `
      const params: any[] = [job.tenant_id]
      let paramCount = 1

      if (metadata.categoryId) {
        paramCount++
        query += ` AND category_id = $${paramCount}`
        params.push(metadata.categoryId)
      }

      if (metadata.documentIds && metadata.documentIds.length > 0) {
        paramCount++
        query += ` AND id = ANY($${paramCount})`
        params.push(metadata.documentIds)
      }

      if (!metadata.fullReindex) {
        query += ` AND (index_status IS NULL OR index_status != 'indexed')`
      }

      query += ' ORDER BY created_at DESC'

      const result = await pool.query(query, params)
      const documents = result.rows

      console.log(`Reindexing ${documents.length} documents...`)

      // Process documents in batches
      let processedCount = 0
      let failedCount = 0

      for (let i = 0; i < documents.length; i += this.batchSize) {
        const batch = documents.slice(i, i + this.batchSize)

        // Index batch
        const indexPromises = batch.map(doc =>
          this.indexDocument(doc.id, job.tenant_id, 'normal')
            .catch(error => {
              console.error(`Failed to index document ${doc.id}:`, error)
              failedCount++
            })
        )

        await Promise.all(indexPromises)

        processedCount += batch.length
        const progress = Math.floor((processedCount / documents.length) * 100)

        // Update job progress
        await pool.query(
          `UPDATE indexing_jobs
           SET progress = $1, processed_documents = $2
           WHERE id = $3`,
          [progress, processedCount, job.id]
        )

        console.log(`Reindex progress: ${processedCount}/${documents.length} (${progress}%)`)
      }

      // Mark job as completed
      await pool.query(
        `UPDATE indexing_jobs
         SET
           status = 'completed',
           progress = 100,
           processed_documents = $1,
           completed_at = NOW()
         WHERE id = $2`,
        [processedCount, job.id]
      )

      console.log(`Reindex job ${job.id} completed: ${processedCount} indexed, ${failedCount} failed`)
    } catch (error) {
      console.error(`Error processing reindex job ${job.id}:`, error)

      // Mark job as failed
      await pool.query(
        `UPDATE indexing_jobs
         SET
           status = 'failed',
           error_message = $1,
           completed_at = NOW()
         WHERE id = $2`,
        [error instanceof Error ? error.message : 'Unknown error', job.id]
      )
    }
  }

  /**
   * Optimize search indexes
   */
  async optimizeIndexes(tenantId: string): Promise<void> {
    console.log(`Optimizing search indexes for tenant ${tenantId}...`)

    try {
      // Create optimization job
      const job = await pool.query(
        `INSERT INTO indexing_jobs (
          tenant_id, job_type, status, progress, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
        [tenantId, 'optimize', 'processing', 0]
      )

      const jobId = job.rows[0].id

      // Run VACUUM ANALYZE on documents table
      await pool.query('VACUUM ANALYZE documents')

      // Rebuild indexes if needed
      await pool.query('REINDEX TABLE documents')

      // Update statistics
      await pool.query(
        `UPDATE tenant_index_stats
         SET
           last_optimization = NOW(),
           optimization_count = optimization_count + 1
         WHERE tenant_id = $1`,
        [tenantId]
      )

      // Mark job as completed
      await pool.query(
        `UPDATE indexing_jobs
         SET status = 'completed', progress = 100, completed_at = NOW()
         WHERE id = $1`,
        [jobId]
      )

      console.log(`Index optimization completed for tenant ${tenantId}`)
    } catch (error) {
      console.error('Error optimizing indexes:', error)
      throw error
    }
  }

  /**
   * Get indexing statistics
   */
  async getIndexStats(tenantId: string): Promise<IndexStats> {
    try {
      const [docStats, indexLog, optimization] = await Promise.all([
        // Document counts
        pool.query(
          `SELECT
            COUNT(*) as total_documents,
            COUNT(CASE WHEN index_status = 'indexed' THEN 1 END) as indexed_documents,
            COUNT(CASE WHEN index_status IS NULL OR index_status = 'pending' THEN 1 END) as pending_documents,
            COUNT(CASE WHEN index_status = 'failed' THEN 1 END) as failed_documents,
            SUM(file_size) as total_size
          FROM documents
          WHERE tenant_id = $1`,
          [tenantId]
        ),
        // Average indexing time
        pool.query(
          `SELECT AVG(indexing_time_ms) as avg_time
          FROM document_indexing_log
          WHERE tenant_id = $1
            AND created_at > NOW() - INTERVAL '7 days'
            AND status = 'success'`,
          [tenantId]
        ),
        // Last optimization
        pool.query(
          `SELECT last_optimization
          FROM tenant_index_stats
          WHERE tenant_id = $1`,
          [tenantId]
        )
      ])

      return {
        total_documents: parseInt(docStats.rows[0].total_documents) || 0,
        indexed_documents: parseInt(docStats.rows[0].indexed_documents) || 0,
        pending_documents: parseInt(docStats.rows[0].pending_documents) || 0,
        failed_documents: parseInt(docStats.rows[0].failed_documents) || 0,
        index_size_bytes: parseInt(docStats.rows[0].total_size) || 0,
        last_optimization: optimization.rows[0]?.last_optimization || new Date(0),
        avg_indexing_time_ms: parseFloat(indexLog.rows[0].avg_time) || 0
      }
    } catch (error) {
      console.error('Error getting index stats:', error)
      throw error
    }
  }

  /**
   * Get indexing jobs
   */
  async getIndexingJobs(
    tenantId: string,
    options?: { status?: string; limit?: number }
  ): Promise<IndexingJob[]> {
    let query = `
      SELECT *
      FROM indexing_jobs
      WHERE tenant_id = $1
    `
    const params: any[] = [tenantId]

    if (options?.status) {
      query += ' AND status = $2'
      params.push(options.status)
    }

    query += ' ORDER BY created_at DESC'

    if (options?.limit) {
      query += ` LIMIT ${options.limit}`
    }

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Start background job processor
   */
  private startJobProcessor(): void {
    // Check for pending jobs every 30 seconds
    this.jobCheckInterval = setInterval(async () => {
      if (this.isRunning) {
        return // Already processing a job
      }

      try {
        // Get next pending job
        const result = await pool.query(
          `SELECT *
           FROM indexing_jobs
           WHERE status = 'pending'
           ORDER BY created_at ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED`
        )

        if (result.rows.length === 0) {
          return // No pending jobs
        }

        const job = result.rows[0]
        this.isRunning = true
        this.currentJob = job

        // Process job based on type
        if (job.job_type === 'reindex') {
          await this.processReindexJob(job)
        } else if (job.job_type === 'optimize') {
          await this.optimizeIndexes(job.tenant_id)
        }

        this.isRunning = false
        this.currentJob = null
      } catch (error) {
        console.error('Error in job processor:', error)
        this.isRunning = false
        this.currentJob = null
      }
    }, 30000)

    console.log('Document indexer job processor started')
  }

  /**
   * Stop background job processor
   */
  stopJobProcessor(): void {
    if (this.jobCheckInterval) {
      clearInterval(this.jobCheckInterval)
      this.jobCheckInterval = null
      console.log('Document indexer job processor stopped')
    }
  }

  /**
   * Update indexing statistics
   */
  private async updateIndexingStats(
    tenantId: string,
    documentId: string,
    indexingTime: number,
    status: 'success' | 'failed'
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO document_indexing_log (
          tenant_id, document_id, indexing_time_ms, status, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [tenantId, documentId, indexingTime, status]
      )

      // Update tenant stats
      await pool.query(
        `INSERT INTO tenant_index_stats (
          tenant_id, total_indexed, last_indexed_at
        ) VALUES ($1, 1, NOW())
        ON CONFLICT (tenant_id)
        DO UPDATE SET
          total_indexed = tenant_index_stats.total_indexed + 1,
          last_indexed_at = NOW()`,
        [tenantId]
      )
    } catch (error) {
      // Don't fail indexing if stats update fails
      console.error('Error updating indexing stats:', error)
    }
  }

  /**
   * Batch index multiple documents
   */
  async batchIndexDocuments(
    documentIds: string[],
    tenantId: string
  ): Promise<{ success: number; failed: number }> {
    console.log(`Batch indexing ${documentIds.length} documents...`)

    let success = 0
    let failed = 0

    for (let i = 0; i < documentIds.length; i += this.batchSize) {
      const batch = documentIds.slice(i, i + this.batchSize)

      const results = await Promise.allSettled(
        batch.map(id => this.indexDocument(id, tenantId, 'normal'))
      )

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          success++
        } else {
          failed++
        }
      })

      console.log(`Batch progress: ${i + batch.length}/${documentIds.length}`)
    }

    console.log(`Batch indexing completed: ${success} success, ${failed} failed`)

    return { success, failed }
  }
}

export default new DocumentIndexer()
