/**
 * Document Search Service
 *
 * Unified search interface combining multiple search strategies:
 * - Full-text search (PostgreSQL tsvector)
 * - Semantic search (vector embeddings via RAG)
 * - Faceted search and filtering
 * - Relevance ranking and boosting
 * - Personalized search results
 * - Search result clustering
 *
 * This service orchestrates SearchIndexService and DocumentRAGService
 * to provide the best search experience.
 */

import SearchIndexService, { SearchQuery, SearchResult, SearchStats } from './SearchIndexService'
import DocumentRAGService, { SearchResult as RAGSearchResult } from './document-rag.service'
import pool from '../config/database'

export interface UnifiedSearchRequest {
  query: string
  tenantId: string
  userId: string

  // Search modes
  mode?: 'full-text' | 'semantic' | 'hybrid'

  // Search options
  fuzzy?: boolean
  phrase?: boolean
  operator?: 'AND' | 'OR'

  // Filters
  categoryId?: string
  documentType?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  uploadedBy?: string

  // Personalization
  usePersonalization?: boolean

  // Pagination
  page?: number
  limit?: number

  // Sorting
  sortBy?: 'relevance' | 'date' | 'popularity'
  sortOrder?: 'asc' | 'desc'

  // Advanced
  boost?: { [field: string]: number }
  minScore?: number
}

export interface UnifiedSearchResponse {
  results: SearchResult[]
  stats: SearchStats
  facets: SearchFacets
  suggestions?: {
    spelling?: string[]
    related?: string[]
  }
  clusters?: SearchCluster[]
}

export interface SearchFacets {
  categories: Array<{ id: string; name: string; count: number }>
  documentTypes: Array<{ type: string; count: number }>
  tags: Array<{ tag: string; count: number }>
  dateRanges: Array<{ range: string; count: number }>
  uploadedBy: Array<{ id: string; name: string; count: number }>
}

export interface SearchCluster {
  cluster_id: string
  cluster_name: string
  documents: SearchResult[]
  relevance: number
}

export interface SavedSearch {
  id: string
  tenant_id: string
  user_id: string
  name: string
  query: string
  filters: any
  notification_enabled: boolean
  created_at: Date
  last_run_at?: Date
}

export interface SearchHistory {
  id: string
  user_id: string
  query: string
  result_count: number
  clicked_documents: string[]
  created_at: Date
}

export class DocumentSearchService {
  private searchIndexService: typeof SearchIndexService
  private ragService: typeof DocumentRAGService

  constructor() {
    this.searchIndexService = SearchIndexService
    this.ragService = DocumentRAGService
  }

  /**
   * Unified search combining full-text and semantic search
   */
  async search(request: UnifiedSearchRequest): Promise<UnifiedSearchResponse> {
    const mode = request.mode || 'hybrid'
    const page = request.page || 1
    const limit = request.limit || 20
    const offset = (page - 1) * limit

    let results: SearchResult[] = []
    let stats: SearchStats

    try {
      if (mode === 'full-text' || mode === 'hybrid') {
        // Full-text search
        const searchQuery: SearchQuery = {
          query: request.query,
          fuzzy: request.fuzzy,
          phrase: request.phrase,
          operator: request.operator,
          boost: request.boost,
          filters: {
            tenantId: request.tenantId,
            categoryId: request.categoryId,
            documentType: request.documentType,
            tags: request.tags,
            dateFrom: request.dateFrom,
            dateTo: request.dateTo,
            uploadedBy: request.uploadedBy,
            minScore: request.minScore
          }
        }

        const fullTextResults = await this.searchIndexService.search(
          searchQuery,
          {
            limit,
            offset,
            sortBy: request.sortBy,
            sortOrder: request.sortOrder
          }
        )

        results = fullTextResults.results
        stats = fullTextResults.stats
      }

      if (mode === 'semantic') {
        // Semantic search using RAG
        const semanticResults = await this.ragService.semanticSearch(
          request.tenantId,
          request.query,
          {
            limit,
            categoryId: request.categoryId,
            minScore: request.minScore || 0.7
          }
        )

        // Convert RAG results to SearchResult format
        results = this.convertRAGResults(semanticResults)
        stats = {
          total_results: semanticResults.length,
          search_time_ms: 0,
          max_score: semanticResults.length > 0 ? semanticResults[0].similarity_score : 0,
          query_terms: request.query.split(/\s+/)
        }
      }

      if (mode === 'hybrid') {
        // Combine full-text and semantic search results
        const semanticResults = await this.ragService.semanticSearch(
          request.tenantId,
          request.query,
          {
            limit: Math.floor(limit / 2),
            categoryId: request.categoryId,
            minScore: 0.6
          }
        )

        // Merge and re-rank results
        const semanticConverted = this.convertRAGResults(semanticResults)
        results = this.mergeResults(results, semanticConverted, limit)

        // Update stats
        stats!.total_results = results.length
      }

      // Apply personalization if enabled
      if (request.usePersonalization) {
        results = await this.personalizeResults(results, request.userId, request.tenantId)
      }

      // Get facets
      const facets = await this.getFacets(request)

      // Get suggestions
      const suggestions = await this.getSuggestions(request)

      // Get clusters (for large result sets)
      const clusters = results.length > 50
        ? await this.clusterResults(results)
        : undefined

      // Save to search history
      await this.saveSearchHistory(
        request.userId,
        request.query,
        results.length
      )

      return {
        results,
        stats: stats!,
        facets,
        suggestions,
        clusters
      }
    } catch (error) {
      console.error('Unified search error:', error)
      throw error
    }
  }

  /**
   * Convert RAG search results to unified format
   */
  private convertRAGResults(ragResults: RAGSearchResult[]): SearchResult[] {
    return ragResults.map((result, index) => ({
      id: result.chunk_id,
      document_id: result.document_id,
      title: result.document_name,
      content_snippet: result.chunk_text.substring(0, 200) + '...',
      highlighted_snippet: result.chunk_text,
      relevance_score: result.similarity_score,
      rank: index + 1,
      document_type: 'unknown',
      category: result.category_name,
      tags: [],
      uploaded_by: '',
      uploaded_by_name: '',
      created_at: new Date(),
      match_fields: ['content'],
      metadata: {
        page_number: result.page_number,
        section_title: result.section_title
      }
    }))
  }

  /**
   * Merge and re-rank results from multiple sources
   */
  private mergeResults(
    fullTextResults: SearchResult[],
    semanticResults: SearchResult[],
    limit: number
  ): SearchResult[] {
    // Create a map to track unique documents
    const resultMap = new Map<string, SearchResult>()

    // Add full-text results with boosted scores
    fullTextResults.forEach(result => {
      const existing = resultMap.get(result.document_id)
      if (!existing || result.relevance_score > existing.relevance_score) {
        resultMap.set(result.document_id, {
          ...result,
          relevance_score: result.relevance_score * 1.2 // Boost full-text results
        })
      }
    })

    // Add semantic results
    semanticResults.forEach(result => {
      const existing = resultMap.get(result.document_id)
      if (!existing) {
        resultMap.set(result.document_id, result)
      } else {
        // Combine scores if document appears in both
        existing.relevance_score = (existing.relevance_score + result.relevance_score) / 2
      }
    })

    // Sort by combined score
    const merged = Array.from(resultMap.values())
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit)

    // Update ranks
    merged.forEach((result, index) => {
      result.rank = index + 1
    })

    return merged
  }

  /**
   * Personalize search results based on user history
   */
  private async personalizeResults(
    results: SearchResult[],
    userId: string,
    tenantId: string
  ): Promise<SearchResult[]> {
    try {
      // Get user's interaction history
      const history = await pool.query(
        `SELECT document_id, COUNT(*) as interaction_count
         FROM (
           SELECT unnest(clicked_documents) as document_id
           FROM search_history
           WHERE user_id = $1
             AND created_at > NOW() - INTERVAL '30 days'
         ) interactions
         GROUP BY document_id`,
        [userId]
      )

      const interactionMap = new Map<string, number>()
      history.rows.forEach(row => {
        interactionMap.set(row.document_id, parseInt(row.interaction_count))
      })

      // Get user's preferred categories
      const categoryPrefs = await pool.query(
        `SELECT category_id, COUNT(*) as count
         FROM documents d
         JOIN search_history sh ON d.id = ANY(sh.clicked_documents)
         WHERE sh.user_id = $1
           AND d.tenant_id = $2
           AND sh.created_at > NOW() - INTERVAL '30 days'
         GROUP BY category_id
         ORDER BY count DESC
         LIMIT 5`,
        [userId, tenantId]
      )

      const preferredCategories = new Set(
        categoryPrefs.rows.map(row => row.category_id)
      )

      // Boost results based on personalization
      const personalized = results.map(result => {
        let boost = 1.0

        // Boost previously interacted documents
        const interactions = interactionMap.get(result.document_id) || 0
        if (interactions > 0) {
          boost += Math.min(interactions * 0.1, 0.5) // Max 50% boost
        }

        // Boost preferred categories
        if (result.category && preferredCategories.has(result.category)) {
          boost += 0.2
        }

        return {
          ...result,
          relevance_score: result.relevance_score * boost
        }
      })

      // Re-sort by new scores
      return personalized
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .map((result, index) => ({
          ...result,
          rank: index + 1
        }))
    } catch (error) {
      console.error('Personalization error:', error)
      return results // Return original results on error
    }
  }

  /**
   * Get search facets for filtering
   */
  private async getFacets(request: UnifiedSearchRequest): Promise<SearchFacets> {
    try {
      const [categories, documentTypes, tags, uploadedBy] = await Promise.all([
        // Categories
        pool.query(
          `SELECT
            dc.id,
            dc.category_name as name,
            COUNT(d.id) as count
          FROM document_categories dc
          LEFT JOIN documents d ON dc.id = d.category_id
            AND d.tenant_id = $1
            AND d.status = 'active'
          WHERE dc.tenant_id = $1
          GROUP BY dc.id, dc.category_name
          ORDER BY count DESC
          LIMIT 20`,
          [request.tenantId]
        ),
        // Document types
        pool.query(
          `SELECT
            file_type as type,
            COUNT(*) as count
          FROM documents
          WHERE tenant_id = $1
            AND status = 'active'
          GROUP BY file_type
          ORDER BY count DESC
          LIMIT 20`,
          [request.tenantId]
        ),
        // Tags
        pool.query(
          `SELECT
            unnest(tags) as tag,
            COUNT(*) as count
          FROM documents
          WHERE tenant_id = $1
            AND status = 'active'
            AND tags IS NOT NULL
          GROUP BY tag
          ORDER BY count DESC
          LIMIT 30`,
          [request.tenantId]
        ),
        // Uploaded by
        pool.query(
          `SELECT
            u.id,
            u.first_name || ' ' || u.last_name as name,
            COUNT(d.id) as count
          FROM users u
          LEFT JOIN documents d ON u.id = d.uploaded_by
            AND d.tenant_id = $1
            AND d.status = 'active'
          WHERE u.tenant_id = $1
          GROUP BY u.id, u.first_name, u.last_name
          HAVING COUNT(d.id) > 0
          ORDER BY count DESC
          LIMIT 20`,
          [request.tenantId]
        )
      ])

      return {
        categories: categories.rows.map(row => ({
          id: row.id,
          name: row.name,
          count: parseInt(row.count)
        })),
        documentTypes: documentTypes.rows.map(row => ({
          type: row.type,
          count: parseInt(row.count)
        })),
        tags: tags.rows.map(row => ({
          tag: row.tag,
          count: parseInt(row.count)
        })),
        dateRanges: this.getDateRangeFacets(),
        uploadedBy: uploadedBy.rows.map(row => ({
          id: row.id,
          name: row.name,
          count: parseInt(row.count)
        }))
      }
    } catch (error) {
      console.error('Facets error:', error)
      return {
        categories: [],
        documentTypes: [],
        tags: [],
        dateRanges: [],
        uploadedBy: []
      }
    }
  }

  /**
   * Get date range facets
   */
  private getDateRangeFacets(): Array<{ range: string; count: number }> {
    return [
      { range: 'Today', count: 0 },
      { range: 'Last 7 days', count: 0 },
      { range: 'Last 30 days', count: 0 },
      { range: 'Last 90 days', count: 0 },
      { range: 'Last year', count: 0 },
      { range: 'Older', count: 0 }
    ]
  }

  /**
   * Get search suggestions
   */
  private async getSuggestions(
    request: UnifiedSearchRequest
  ): Promise<{ spelling?: string[]; related?: string[] }> {
    try {
      const [spelling, related] = await Promise.all([
        // Spelling suggestions
        this.searchIndexService.getSpellingSuggestions(
          request.tenantId,
          request.query
        ),
        // Related searches
        this.getRelatedSearches(request.tenantId, request.query)
      ])

      return {
        spelling: spelling.slice(0, 3).map(s => s.suggestion),
        related: related.slice(0, 5)
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      return {}
    }
  }

  /**
   * Get related searches
   */
  private async getRelatedSearches(
    tenantId: string,
    query: string
  ): Promise<string[]> {
    try {
      const result = await pool.query(
        `SELECT DISTINCT query_text, COUNT(*) as count
         FROM search_query_log
         WHERE tenant_id = $1
           AND query_text != $2
           AND query_text ILIKE $3
           AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY query_text
         ORDER BY count DESC
         LIMIT 5`,
        [tenantId, query, `%${query}%`]
      )

      return result.rows.map(row => row.query_text)
    } catch (error) {
      console.error('Related searches error:', error)
      return []
    }
  }

  /**
   * Cluster search results by similarity
   */
  private async clusterResults(results: SearchResult[]): Promise<SearchCluster[]> {
    // Simple clustering by category for now
    // In production, could use more sophisticated clustering algorithms
    const clusters = new Map<string, SearchResult[]>()

    results.forEach(result => {
      const category = result.category || 'Uncategorized'
      if (!clusters.has(category)) {
        clusters.set(category, [])
      }
      clusters.get(category)!.push(result)
    })

    return Array.from(clusters.entries())
      .map(([category, documents], index) => ({
        cluster_id: `cluster_${index}`,
        cluster_name: category,
        documents,
        relevance: documents.reduce((sum, doc) => sum + doc.relevance_score, 0) / documents.length
      }))
      .sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Save search to history
   */
  private async saveSearchHistory(
    userId: string,
    query: string,
    resultCount: number
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO search_history (
          user_id, query, result_count, clicked_documents, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [userId, query, resultCount, []]
      )
    } catch (error) {
      // Don't fail search if history save fails
      console.error('Search history error:', error)
    }
  }

  /**
   * Update search history with clicked document
   */
  async recordDocumentClick(
    userId: string,
    query: string,
    documentId: string
  ): Promise<void> {
    try {
      await pool.query(
        `UPDATE search_history
         SET clicked_documents = array_append(clicked_documents, $3)
         WHERE user_id = $1
           AND query = $2
           AND created_at > NOW() - INTERVAL '1 hour'
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, query, documentId]
      )
    } catch (error) {
      console.error('Document click recording error:', error)
    }
  }

  /**
   * Save search query
   */
  async saveSearch(
    tenantId: string,
    userId: string,
    name: string,
    query: string,
    filters: any,
    notificationEnabled: boolean = false
  ): Promise<SavedSearch> {
    const result = await pool.query(
      `INSERT INTO saved_searches (
        tenant_id, user_id, name, query, filters, notification_enabled, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [tenantId, userId, name, query, JSON.stringify(filters), notificationEnabled]
    )

    return result.rows[0]
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, user_id, search_name, search_query, created_at, updated_at FROM saved_searches
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    return result.rows
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId: string, userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM saved_searches
       WHERE id = $1 AND user_id = $2`,
      [searchId, userId]
    )
  }

  /**
   * Get search history
   */
  async getSearchHistory(
    userId: string,
    limit: number = 50
  ): Promise<SearchHistory[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, user_id, search_query, result_count, created_at FROM search_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    )

    return result.rows
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(
    tenantId: string,
    prefix: string,
    limit: number = 10
  ): Promise<any[]> {
    return this.searchIndexService.autocomplete(tenantId, prefix, limit)
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(tenantId: string, days: number = 30): Promise<any> {
    return this.searchIndexService.getSearchAnalytics(tenantId, days)
  }
}

export default new DocumentSearchService()
