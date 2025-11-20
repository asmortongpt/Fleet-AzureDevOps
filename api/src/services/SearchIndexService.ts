/**
 * Search Index Service
 *
 * World-class full-text search system using PostgreSQL and optional Elasticsearch
 *
 * Features:
 * - PostgreSQL full-text search with tsvector/tsquery
 * - Multi-field search (title, content, metadata, tags, comments)
 * - Fuzzy matching and typo tolerance
 * - Phrase search and proximity operators
 * - Boolean operators (AND, OR, NOT)
 * - Search result ranking and boosting
 * - Query analysis and optimization
 * - Search result caching
 */

import pool from '../config/database'
import { cache } from '../utils/cache'

export interface SearchQuery {
  query: string
  fields?: string[]
  operator?: 'AND' | 'OR'
  fuzzy?: boolean
  phrase?: boolean
  proximity?: number
  boost?: { [field: string]: number }
  filters?: SearchFilters
}

export interface SearchFilters {
  tenantId: string
  categoryId?: string
  documentType?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  uploadedBy?: string
  status?: string
  minScore?: number
}

export interface SearchResult {
  id: string
  document_id: string
  title: string
  content_snippet: string
  highlighted_snippet?: string
  relevance_score: number
  rank: number
  document_type: string
  category?: string
  tags?: string[]
  uploaded_by: string
  uploaded_by_name: string
  created_at: Date
  metadata?: any
  match_fields: string[]
  match_positions?: any
}

export interface SearchStats {
  total_results: number
  search_time_ms: number
  max_score: number
  query_terms: string[]
  filtered_count?: number
}

export interface AutocompleteResult {
  suggestion: string
  score: number
  frequency: number
  type: 'query' | 'document' | 'tag' | 'category'
}

export interface SpellingSuggestion {
  original: string
  suggestion: string
  distance: number
  frequency: number
}

export class SearchIndexService {
  private cache: Cache
  private cacheEnabled: boolean
  private cacheTTL: number = 300 // 5 minutes

  constructor() {
    this.cache = new Cache()
    this.cacheEnabled = process.env.SEARCH_CACHE_ENABLED !== 'false'
  }

  /**
   * Perform full-text search across documents
   */
  async search(
    searchQuery: SearchQuery,
    options?: {
      limit?: number
      offset?: number
      sortBy?: 'relevance' | 'date' | 'popularity'
      sortOrder?: 'asc' | 'desc'
    }
  ): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = Date.now()

    // Check cache
    const cacheKey = this.generateCacheKey(searchQuery, options)
    if (this.cacheEnabled) {
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      // Parse and optimize query
      const parsedQuery = this.parseQuery(searchQuery)
      const tsquery = this.buildTsQuery(parsedQuery, searchQuery)

      // Build SQL query
      const { query, params } = this.buildSearchQuery(
        tsquery,
        searchQuery,
        options
      )

      // Execute search
      const result = await pool.query(query, params)

      // Build results
      const results: SearchResult[] = result.rows.map((row, index) => ({
        id: row.id,
        document_id: row.document_id,
        title: row.file_name,
        content_snippet: row.snippet,
        highlighted_snippet: row.highlighted_snippet,
        relevance_score: parseFloat(row.relevance_score),
        rank: index + 1 + (options?.offset || 0),
        document_type: row.file_type,
        category: row.category_name,
        tags: row.tags || [],
        uploaded_by: row.uploaded_by,
        uploaded_by_name: row.uploaded_by_name,
        created_at: row.created_at,
        metadata: row.metadata,
        match_fields: this.extractMatchFields(row),
        match_positions: row.match_positions
      }))

      // Get total count
      const countQuery = this.buildCountQuery(tsquery, searchQuery)
      const countResult = await pool.query(countQuery.query, countQuery.params)
      const totalResults = parseInt(countResult.rows[0].count)

      const stats: SearchStats = {
        total_results: totalResults,
        search_time_ms: Date.now() - startTime,
        max_score: results.length > 0 ? results[0].relevance_score : 0,
        query_terms: parsedQuery.terms,
        filtered_count: results.length
      }

      const response = { results, stats }

      // Cache results
      if (this.cacheEnabled) {
        await this.cache.set(cacheKey, response, this.cacheTTL)
      }

      // Log search for analytics
      await this.logSearch(searchQuery, stats)

      return response
    } catch (error) {
      console.error('Search error:', error)
      throw new Error('Search failed')
    }
  }

  /**
   * Parse search query into components
   */
  private parseQuery(searchQuery: SearchQuery): {
    terms: string[]
    phrases: string[]
    excluded: string[]
    operators: string[]
  } {
    const query = searchQuery.query.trim()
    const terms: string[] = []
    const phrases: string[] = []
    const excluded: string[] = []
    const operators: string[] = []

    // Extract quoted phrases
    const phraseRegex = /"([^"]+)"/g
    let match
    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1])
    }

    // Remove quoted phrases from query
    let cleanQuery = query.replace(phraseRegex, '')

    // Extract excluded terms (starting with -)
    const excludeRegex = /-(\w+)/g
    while ((match = excludeRegex.exec(cleanQuery)) !== null) {
      excluded.push(match[1])
    }

    // Remove excluded terms
    cleanQuery = cleanQuery.replace(excludeRegex, '')

    // Extract boolean operators
    const operatorRegex = /\b(AND|OR|NOT)\b/gi
    while ((match = operatorRegex.exec(cleanQuery)) !== null) {
      operators.push(match[1].toUpperCase())
    }

    // Remove operators
    cleanQuery = cleanQuery.replace(operatorRegex, '')

    // Extract remaining terms
    const remainingTerms = cleanQuery
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.toLowerCase())

    terms.push(...remainingTerms)

    return { terms, phrases, excluded, operators }
  }

  /**
   * Build PostgreSQL tsquery from parsed query
   */
  private buildTsQuery(
    parsed: { terms: string[]; phrases: string[]; excluded: string[] },
    searchQuery: SearchQuery
  ): string {
    const queryParts: string[] = []

    // Add phrases (exact match)
    parsed.phrases.forEach(phrase => {
      const phraseParts = phrase
        .split(/\s+/)
        .map(word => `${word}:*`)
        .join(' <-> ')
      queryParts.push(`(${phraseParts})`)
    })

    // Add terms with optional fuzzy matching
    parsed.terms.forEach(term => {
      if (searchQuery.fuzzy) {
        // Prefix matching for fuzzy search
        queryParts.push(`${term}:*`)
      } else {
        queryParts.push(term)
      }
    })

    // Add excluded terms
    parsed.excluded.forEach(term => {
      queryParts.push(`!${term}`)
    })

    // Combine with operator
    const operator = searchQuery.operator === 'OR' ? ' | ' : ' & '
    return queryParts.join(operator)
  }

  /**
   * Build complete SQL search query
   */
  private buildSearchQuery(
    tsquery: string,
    searchQuery: SearchQuery,
    options?: {
      limit?: number
      offset?: number
      sortBy?: 'relevance' | 'date' | 'popularity'
      sortOrder?: 'asc' | 'desc'
    }
  ): { query: string; params: any[] } {
    const params: any[] = []
    let paramCount = 0

    // Build search vector combining multiple fields with boost
    const searchFields = searchQuery.fields || [
      'file_name',
      'description',
      'extracted_text',
      'tags'
    ]

    const boost = searchQuery.boost || {
      file_name: 4.0,
      description: 2.0,
      extracted_text: 1.0,
      tags: 3.0
    }

    // Build combined search vector
    const searchVectorParts: string[] = []
    searchFields.forEach(field => {
      const weight = boost[field] || 1.0
      if (field === 'tags') {
        searchVectorParts.push(
          `setweight(to_tsvector('english', COALESCE(array_to_string(d.tags, ' '), '')), 'A') * ${weight}`
        )
      } else {
        searchVectorParts.push(
          `setweight(to_tsvector('english', COALESCE(d.${field}, '')), 'A') * ${weight}`
        )
      }
    })

    const searchVector = searchVectorParts.join(' || ')

    // Main query
    let query = `
      SELECT
        d.id,
        d.id as document_id,
        d.file_name,
        d.file_type,
        d.tags,
        d.uploaded_by,
        d.created_at,
        d.metadata,
        dc.category_name,
        u.first_name || ' ' || u.last_name as uploaded_by_name,
        ts_rank_cd(${searchVector}, to_tsquery('english', $${++paramCount}), 32) as relevance_score,
        ts_headline(
          'english',
          COALESCE(d.extracted_text, d.description, d.file_name),
          to_tsquery('english', $${paramCount}),
          'MaxWords=50, MinWords=25, MaxFragments=3'
        ) as snippet,
        ts_headline(
          'english',
          COALESCE(d.extracted_text, d.description, d.file_name),
          to_tsquery('english', $${paramCount}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25'
        ) as highlighted_snippet,
        (${searchVector}) @@ to_tsquery('english', $${paramCount}) as match_positions
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.tenant_id = $${++paramCount}
        AND (${searchVector}) @@ to_tsquery('english', $${paramCount - 1})
    `

    params.push(tsquery, searchQuery.filters?.tenantId)

    // Add filters
    if (searchQuery.filters) {
      if (searchQuery.filters.categoryId) {
        query += ` AND d.category_id = $${++paramCount}`
        params.push(searchQuery.filters.categoryId)
      }

      if (searchQuery.filters.documentType) {
        query += ` AND d.file_type = $${++paramCount}`
        params.push(searchQuery.filters.documentType)
      }

      if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
        query += ` AND d.tags && $${++paramCount}`
        params.push(searchQuery.filters.tags)
      }

      if (searchQuery.filters.dateFrom) {
        query += ` AND d.created_at >= $${++paramCount}`
        params.push(searchQuery.filters.dateFrom)
      }

      if (searchQuery.filters.dateTo) {
        query += ` AND d.created_at <= $${++paramCount}`
        params.push(searchQuery.filters.dateTo)
      }

      if (searchQuery.filters.uploadedBy) {
        query += ` AND d.uploaded_by = $${++paramCount}`
        params.push(searchQuery.filters.uploadedBy)
      }

      if (searchQuery.filters.status) {
        query += ` AND d.status = $${++paramCount}`
        params.push(searchQuery.filters.status)
      } else {
        query += ` AND d.status = 'active'`
      }

      if (searchQuery.filters.minScore) {
        query += ` AND ts_rank_cd(${searchVector}, to_tsquery('english', $1), 32) >= $${++paramCount}`
        params.push(searchQuery.filters.minScore)
      }
    }

    // Sorting
    const sortBy = options?.sortBy || 'relevance'
    const sortOrder = options?.sortOrder || 'desc'

    if (sortBy === 'relevance') {
      query += ` ORDER BY relevance_score ${sortOrder.toUpperCase()}`
    } else if (sortBy === 'date') {
      query += ` ORDER BY d.created_at ${sortOrder.toUpperCase()}`
    } else if (sortBy === 'popularity') {
      query += ` ORDER BY d.view_count ${sortOrder.toUpperCase()} NULLS LAST`
    }

    // Add secondary sort by relevance
    if (sortBy !== 'relevance') {
      query += `, relevance_score DESC`
    }

    // Pagination
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    params.push(limit, offset)

    return { query, params }
  }

  /**
   * Build count query for total results
   */
  private buildCountQuery(
    tsquery: string,
    searchQuery: SearchQuery
  ): { query: string; params: any[] } {
    const params: any[] = []
    let paramCount = 0

    const searchFields = searchQuery.fields || [
      'file_name',
      'description',
      'extracted_text',
      'tags'
    ]

    const boost = searchQuery.boost || {
      file_name: 4.0,
      description: 2.0,
      extracted_text: 1.0,
      tags: 3.0
    }

    const searchVectorParts: string[] = []
    searchFields.forEach(field => {
      const weight = boost[field] || 1.0
      if (field === 'tags') {
        searchVectorParts.push(
          `setweight(to_tsvector('english', COALESCE(array_to_string(d.tags, ' '), '')), 'A') * ${weight}`
        )
      } else {
        searchVectorParts.push(
          `setweight(to_tsvector('english', COALESCE(d.${field}, '')), 'A') * ${weight}`
        )
      }
    })

    const searchVector = searchVectorParts.join(' || ')

    let query = `
      SELECT COUNT(*) as count
      FROM documents d
      WHERE d.tenant_id = $${++paramCount}
        AND (${searchVector}) @@ to_tsquery('english', $${++paramCount})
    `

    params.push(searchQuery.filters?.tenantId, tsquery)

    // Add same filters as main query
    if (searchQuery.filters) {
      if (searchQuery.filters.categoryId) {
        query += ` AND d.category_id = $${++paramCount}`
        params.push(searchQuery.filters.categoryId)
      }

      if (searchQuery.filters.documentType) {
        query += ` AND d.file_type = $${++paramCount}`
        params.push(searchQuery.filters.documentType)
      }

      if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
        query += ` AND d.tags && $${++paramCount}`
        params.push(searchQuery.filters.tags)
      }

      if (searchQuery.filters.dateFrom) {
        query += ` AND d.created_at >= $${++paramCount}`
        params.push(searchQuery.filters.dateFrom)
      }

      if (searchQuery.filters.dateTo) {
        query += ` AND d.created_at <= $${++paramCount}`
        params.push(searchQuery.filters.dateTo)
      }

      if (searchQuery.filters.uploadedBy) {
        query += ` AND d.uploaded_by = $${++paramCount}`
        params.push(searchQuery.filters.uploadedBy)
      }

      if (searchQuery.filters.status) {
        query += ` AND d.status = $${++paramCount}`
        params.push(searchQuery.filters.status)
      } else {
        query += ` AND d.status = 'active'`
      }
    }

    return { query, params }
  }

  /**
   * Extract which fields matched in the search
   */
  private extractMatchFields(row: any): string[] {
    const matchedFields: string[] = []

    if (row.file_name && row.highlighted_snippet?.includes(row.file_name)) {
      matchedFields.push('title')
    }
    if (row.description) {
      matchedFields.push('description')
    }
    if (row.extracted_text) {
      matchedFields.push('content')
    }
    if (row.tags && row.tags.length > 0) {
      matchedFields.push('tags')
    }

    return matchedFields
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(
    tenantId: string,
    prefix: string,
    limit: number = 10
  ): Promise<AutocompleteResult[]> {
    try {
      const results: AutocompleteResult[] = []

      // Search document names
      const docResult = await pool.query(
        `SELECT DISTINCT file_name, COUNT(*) OVER() as frequency
         FROM documents
         WHERE tenant_id = $1
           AND status = 'active'
           AND file_name ILIKE $2
         ORDER BY file_name
         LIMIT $3`,
        [tenantId, `${prefix}%`, limit]
      )

      docResult.rows.forEach(row => {
        results.push({
          suggestion: row.file_name,
          score: 1.0,
          frequency: parseInt(row.frequency),
          type: 'document'
        })
      })

      // Search tags
      const tagResult = await pool.query(
        `SELECT DISTINCT unnest(tags) as tag, COUNT(*) as frequency
         FROM documents
         WHERE tenant_id = $1
           AND status = 'active'
           AND EXISTS (
             SELECT 1 FROM unnest(tags) t WHERE t ILIKE $2
           )
         GROUP BY tag
         ORDER BY frequency DESC, tag
         LIMIT $3`,
        [tenantId, `${prefix}%`, limit]
      )

      tagResult.rows.forEach(row => {
        results.push({
          suggestion: row.tag,
          score: 0.9,
          frequency: parseInt(row.frequency),
          type: 'tag'
        })
      })

      // Search categories
      const categoryResult = await pool.query(
        `SELECT DISTINCT category_name, COUNT(d.id) as frequency
         FROM document_categories dc
         LEFT JOIN documents d ON dc.id = d.category_id AND d.status = 'active'
         WHERE dc.tenant_id = $1
           AND dc.category_name ILIKE $2
         GROUP BY dc.category_name
         ORDER BY frequency DESC, dc.category_name
         LIMIT $3`,
        [tenantId, `${prefix}%`, limit]
      )

      categoryResult.rows.forEach(row => {
        results.push({
          suggestion: row.category_name,
          score: 0.8,
          frequency: parseInt(row.frequency),
          type: 'category'
        })
      })

      // Sort by score and frequency
      return results
        .sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score
          return b.frequency - a.frequency
        })
        .slice(0, limit)
    } catch (error) {
      console.error('Autocomplete error:', error)
      return []
    }
  }

  /**
   * Get spelling suggestions (Did you mean?)
   */
  async getSpellingSuggestions(
    tenantId: string,
    query: string
  ): Promise<SpellingSuggestion[]> {
    try {
      const suggestions: SpellingSuggestion[] = []

      // Use PostgreSQL's similarity function (requires pg_trgm extension)
      const result = await pool.query(
        `SELECT DISTINCT word, similarity(word, $2) as score
         FROM (
           SELECT unnest(string_to_array(file_name, ' ')) as word FROM documents WHERE tenant_id = $1
           UNION
           SELECT unnest(tags) as word FROM documents WHERE tenant_id = $1
           UNION
           SELECT category_name as word FROM document_categories WHERE tenant_id = $1
         ) words
         WHERE similarity(word, $2) > 0.3
           AND word != $2
         ORDER BY score DESC
         LIMIT 5`,
        [tenantId, query]
      )

      result.rows.forEach(row => {
        suggestions.push({
          original: query,
          suggestion: row.word,
          distance: 1 - parseFloat(row.score),
          frequency: 0 // Could be enhanced with actual frequency
        })
      })

      return suggestions
    } catch (error) {
      console.error('Spelling suggestion error:', error)
      return []
    }
  }

  /**
   * Generate cache key for search query
   */
  private generateCacheKey(
    searchQuery: SearchQuery,
    options?: any
  ): string {
    return `search:${JSON.stringify({ searchQuery, options })}`
  }

  /**
   * Log search for analytics
   */
  private async logSearch(
    searchQuery: SearchQuery,
    stats: SearchStats
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO search_query_log (
          tenant_id, query_text, query_terms, filters,
          result_count, search_time_ms, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          searchQuery.filters?.tenantId,
          searchQuery.query,
          stats.query_terms,
          JSON.stringify(searchQuery.filters || {}),
          stats.total_results,
          stats.search_time_ms
        ]
      )
    } catch (error) {
      // Don't fail search if logging fails
      console.error('Search logging error:', error)
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(
    tenantId: string,
    days: number = 30
  ): Promise<any> {
    try {
      const [topQueries, noResults, avgTime, totalSearches] = await Promise.all([
        // Top queries
        pool.query(
          `SELECT query_text, COUNT(*) as count, AVG(result_count) as avg_results
           FROM search_query_log
           WHERE tenant_id = $1
             AND created_at > NOW() - INTERVAL '${days} days'
           GROUP BY query_text
           ORDER BY count DESC
           LIMIT 10`,
          [tenantId]
        ),
        // Queries with no results
        pool.query(
          `SELECT query_text, COUNT(*) as count
           FROM search_query_log
           WHERE tenant_id = $1
             AND result_count = 0
             AND created_at > NOW() - INTERVAL '${days} days'
           GROUP BY query_text
           ORDER BY count DESC
           LIMIT 10`,
          [tenantId]
        ),
        // Average search time
        pool.query(
          `SELECT AVG(search_time_ms) as avg_time_ms
           FROM search_query_log
           WHERE tenant_id = $1
             AND created_at > NOW() - INTERVAL '${days} days'`,
          [tenantId]
        ),
        // Total searches
        pool.query(
          `SELECT COUNT(*) as total
           FROM search_query_log
           WHERE tenant_id = $1
             AND created_at > NOW() - INTERVAL '${days} days'`,
          [tenantId]
        )
      ])

      return {
        top_queries: topQueries.rows,
        no_result_queries: noResults.rows,
        avg_search_time_ms: parseFloat(avgTime.rows[0].avg_time_ms) || 0,
        total_searches: parseInt(totalSearches.rows[0].total) || 0
      }
    } catch (error) {
      console.error('Search analytics error:', error)
      throw error
    }
  }

  /**
   * Clear search cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear('search:*')
  }

  /**
   * Warm up cache with popular queries
   */
  async warmCache(tenantId: string): Promise<void> {
    try {
      // Get top 20 queries from last 7 days
      const result = await pool.query(
        `SELECT DISTINCT query_text, filters
         FROM search_query_log
         WHERE tenant_id = $1
           AND created_at > NOW() - INTERVAL '7 days'
         ORDER BY created_at DESC
         LIMIT 20`,
        [tenantId]
      )

      // Execute and cache each query
      for (const row of result.rows) {
        try {
          const filters = JSON.parse(row.filters || '{}')
          await this.search({
            query: row.query_text,
            filters: { tenantId, ...filters }
          })
        } catch (error) {
          console.error('Cache warming error for query:', row.query_text, error)
        }
      }

      console.log(`Cache warmed with ${result.rows.length} queries`)
    } catch (error) {
      console.error('Cache warming error:', error)
    }
  }
}

export default new SearchIndexService()
