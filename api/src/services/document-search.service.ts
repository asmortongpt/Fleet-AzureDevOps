/**
 * Document Search Service
 *
 * Provides full-text search capabilities using PostgreSQL's built-in
 * text search features with tsvector and GIN indexes.
 *
 * Features:
 * - Full-text search on document title, description, and OCR content
 * - Advanced filtering by vehicle, driver, work order, document type, date range
 * - Relevance ranking using ts_rank
 * - Automatic search vector updates via triggers
 * - Multi-tenant support
 */

import pool from '../config/database'
import { PoolClient } from 'pg'

export interface SearchFilters {
  vehicleId?: string
  driverId?: string
  workOrderId?: string
  documentType?: string
  categoryId?: string
  startDate?: Date
  endDate?: Date
  tenantId: number | string
  status?: 'active' | 'archived' | 'deleted'
  limit?: number
  offset?: number
}

export interface DocumentRecord {
  id: string
  tenant_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  file_hash?: string
  category_id?: string
  category_name?: string
  category_color?: string
  tags?: string[]
  description?: string
  uploaded_by: string
  uploaded_by_name?: string
  is_public: boolean
  version_number: number
  status: string
  metadata?: any
  extracted_text?: string
  ocr_status: string
  ocr_completed_at?: Date
  embedding_status: string
  embedding_completed_at?: Date
  created_at: Date
  updated_at: Date
  // Search-specific fields
  rank?: number
  headline?: string
}

export interface SearchResult {
  documents: DocumentRecord[]
  total: number
  query: string
  filters: SearchFilters
  execution_time_ms: number
}

export class DocumentSearchService {
  /**
   * Search documents using PostgreSQL full-text search
   *
   * @param query - Search query string
   * @param filters - Optional filters to narrow results
   * @returns SearchResult with matched documents and metadata
   */
  async searchDocuments(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now()

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty')
    }

    if (!filters?.tenantId) {
      throw new Error('Tenant ID is required for search')
    }

    // Sanitize and prepare search query for PostgreSQL tsquery
    const searchQuery = this.prepareSearchQuery(query)

    // Build SQL query with filters
    const { sql, params } = this.buildSearchQuery(searchQuery, filters)

    try {
      // Execute count query first
      const countSql = sql.replace(
        /SELECT d\.\*, .+ FROM/,
        'SELECT COUNT(DISTINCT d.id) as total FROM'
      ).replace(/ORDER BY .+/, '').replace(/LIMIT .+/, '').replace(/OFFSET .+/, '')

      const countResult = await pool.query(countSql, params.slice(0, -2)) // Remove LIMIT and OFFSET params
      const total = parseInt(countResult.rows[0]?.total || '0')

      // Execute main search query
      const result = await pool.query(sql, params)

      const executionTime = Date.now() - startTime

      return {
        documents: result.rows,
        total,
        query,
        filters: filters || { tenantId: filters!.tenantId },
        execution_time_ms: executionTime
      }
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new Error('Document search failed: ${error instanceof Error ? error.message : 'Unknown error'}')
    }
  }

  /**
   * Search documents by vehicle ID with optional text query
   *
   * @param vehicleId - Vehicle ID to filter by
   * @param query - Optional search query
   * @param tenantId - Tenant ID
   * @returns Array of matching documents
   */
  async searchByVehicle(
    vehicleId: string,
    query?: string,
    tenantId?: string | number
  ): Promise<DocumentRecord[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    const filters: SearchFilters = {
      vehicleId,
      tenantId,
      status: 'active',
      limit: 100
    }

    if (query && query.trim().length > 0) {
      const result = await this.searchDocuments(query, filters)
      return result.documents
    }

    // If no query, just filter by vehicle
    const sql = `
      SELECT
        d.*,
        dc.category_name,
        dc.color as category_color,
        u.first_name || ' ' || u.last_name as uploaded_by_name,
        v.unit_number as vehicle_unit
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN vehicles v ON d.related_vehicle_id = v.id
      WHERE d.tenant_id = $1
        AND d.related_vehicle_id = $2
        AND d.status = $3
      ORDER BY d.created_at DESC
      LIMIT 100
    `

    const result = await pool.query(sql, [tenantId, vehicleId, 'active'])
    return result.rows
  }

  /**
   * Index or re-index a document's search vectors
   *
   * This is called automatically by database triggers, but can be
   * manually invoked if needed (e.g., after bulk OCR processing)
   *
   * @param documentId - Document ID to index
   */
  async indexDocument(documentId: string): Promise<void> {
    try {
      // The search_vector is automatically updated by the trigger,
      // but we can force a manual update if needed
      const sql = `
        UPDATE documents
        SET
          search_vector =
            setweight(to_tsvector('english', COALESCE(file_name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(extracted_text, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'B'),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, file_name
      `

      const result = await pool.query(sql, [documentId])

      if (result.rows.length === 0) {
        throw new Error(`Document not found: ${documentId}`)
      }

      console.log(`✅ Indexed document: ${result.rows[0].file_name}`)
    } catch (error) {
      console.error('Error indexing document:', error)
      throw new Error('Failed to index document: ${error instanceof Error ? error.message : 'Unknown error'}')
    }
  }

  /**
   * Batch index multiple documents
   *
   * @param documentIds - Array of document IDs to index
   */
  async batchIndexDocuments(documentIds: string[]): Promise<void> {
    if (!documentIds || documentIds.length === 0) {
      return
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      for (const documentId of documentIds) {
        await this.indexDocument(documentId)
      }

      await client.query('COMMIT')
      console.log(`✅ Batch indexed ${documentIds.length} documents`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error in batch indexing:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get search suggestions/autocomplete based on partial query
   *
   * @param partialQuery - Partial search query
   * @param tenantId - Tenant ID
   * @param limit - Maximum number of suggestions
   * @returns Array of suggested search terms
   */
  async getSuggestions(
    partialQuery: string,
    tenantId: string | number,
    limit: number = 5
  ): Promise<string[]> {
    if (!partialQuery || partialQuery.trim().length < 2) {
      return []
    }

    const sql = `
      SELECT DISTINCT file_name
      FROM documents
      WHERE tenant_id = $1
        AND status = 'active'
        AND file_name ILIKE $2
      ORDER BY file_name
      LIMIT $3
    `

    const result = await pool.query(sql, [tenantId, `%${partialQuery}%`, limit])
    return result.rows.map(row => row.file_name)
  }

  /**
   * Get most searched terms for analytics
   *
   * @param tenantId - Tenant ID
   * @param limit - Number of top terms to return
   * @returns Array of search terms with counts
   */
  async getTopSearchTerms(
    tenantId: string | number,
    limit: number = 10
  ): Promise<{ term: string; count: number }[]> {
    // This would require a search_log table to track searches
    // For now, return empty array
    // TODO: Implement search logging and analytics
    return []
  }

  /**
   * Build the full-text search SQL query with filters
   *
   * @private
   */
  private buildSearchQuery(searchQuery: string, filters?: SearchFilters): { sql: string; params: any[] } {
    const params: any[] = []
    let paramCount = 0

    // Base query with full-text search and ranking
    let sql = `
      SELECT
        d.*,
        dc.category_name,
        dc.color as category_color,
        u.first_name || ' ' || u.last_name as uploaded_by_name,
        ts_rank(d.search_vector, to_tsquery('english', $${++paramCount})) AS rank,
        ts_headline('english',
          COALESCE(d.file_name, '') || ' ' || COALESCE(d.description, '') || ' ' || COALESCE(d.extracted_text, ''),
          to_tsquery('english', $${paramCount}),
          'MaxWords=50, MinWords=25, ShortWord=3, HighlightAll=false, MaxFragments=3'
        ) AS headline
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.search_vector @@ to_tsquery('english', $${paramCount})
    `
    params.push(searchQuery)

    // Add tenant filter
    if (filters?.tenantId) {
      sql += ` AND d.tenant_id = $${++paramCount}`
      params.push(filters.tenantId)
    }

    // Add status filter
    if (filters?.status) {
      sql += ` AND d.status = $${++paramCount}`
      params.push(filters.status)
    } else {
      sql += ' AND d.status = 'active''
    }

    // Add vehicle filter
    if (filters?.vehicleId) {
      sql += ` AND d.related_vehicle_id = $${++paramCount}`
      params.push(filters.vehicleId)
    }

    // Add driver filter
    if (filters?.driverId) {
      sql += ` AND d.related_driver_id = $${++paramCount}`
      params.push(filters.driverId)
    }

    // Add work order filter
    if (filters?.workOrderId) {
      sql += ` AND d.related_maintenance_id = $${++paramCount}`
      params.push(filters.workOrderId)
    }

    // Add category filter
    if (filters?.categoryId) {
      sql += ` AND d.category_id = $${++paramCount}`
      params.push(filters.categoryId)
    }

    // Add document type filter
    if (filters?.documentType) {
      sql += ` AND d.document_type = $${++paramCount}`
      params.push(filters.documentType)
    }

    // Add date range filters
    if (filters?.startDate) {
      sql += ` AND d.document_date >= $${++paramCount}`
      params.push(filters.startDate)
    }

    if (filters?.endDate) {
      sql += ` AND d.document_date <= $${++paramCount}`
      params.push(filters.endDate)
    }

    // Order by relevance rank, then by upload date
    sql += ` ORDER BY rank DESC, d.uploaded_at DESC`

    // Add pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    sql += ` LIMIT $${++paramCount}`
    params.push(limit)

    sql += ` OFFSET $${++paramCount}`
    params.push(offset)

    return { sql, params }
  }

  /**
   * Prepare and sanitize search query for PostgreSQL tsquery
   *
   * Converts user input into a valid tsquery format:
   * - Handles special characters
   * - Adds prefix matching for partial words
   * - Combines terms with AND/OR operators
   *
   * @private
   */
  private prepareSearchQuery(query: string): string {
    // Remove special characters that could break tsquery
    const sanitized = query
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')

    if (!sanitized) {
      throw new Error('Search query is invalid after sanitization')
    }

    // Split into terms and add prefix matching
    const terms = sanitized
      .split(' ')
      .filter(term => term.length > 0)
      .map(term => `${term}:*`)

    // Join with AND operator for more precise results
    // Use OR for broader results: terms.join(' | ')
    return terms.join(' & ')
  }

  /**
   * Get search statistics for a tenant
   *
   * @param tenantId - Tenant ID
   * @returns Statistics about indexed documents
   */
  async getSearchStatistics(tenantId: string | number): Promise<{
    total_documents: number
    ocr_completed: number
    ocr_pending: number
    searchable_documents: number
    total_text_size_mb: number
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE ocr_status = 'completed') as ocr_completed,
        COUNT(*) FILTER (WHERE ocr_status IN ('pending', 'processing')) as ocr_pending,
        COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as searchable_documents,
        ROUND(SUM(LENGTH(COALESCE(extracted_text, '')))::numeric / 1048576, 2) as total_text_size_mb
      FROM documents
      WHERE tenant_id = $1
        AND status = 'active'
    `

    const result = await pool.query(sql, [tenantId])

    return {
      total_documents: parseInt(result.rows[0].total_documents) || 0,
      ocr_completed: parseInt(result.rows[0].ocr_completed) || 0,
      ocr_pending: parseInt(result.rows[0].ocr_pending) || 0,
      searchable_documents: parseInt(result.rows[0].searchable_documents) || 0,
      total_text_size_mb: parseFloat(result.rows[0].total_text_size_mb) || 0
    }
  }
}

export default new DocumentSearchService()
