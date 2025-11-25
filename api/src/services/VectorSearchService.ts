/**
 * Vector Search Service for RAG System
 *
 * Supports multiple vector database backends:
 * - PostgreSQL with pgvector extension (recommended for most use cases)
 * - Pinecone (cloud-native, highly scalable)
 * - Qdrant (self-hosted, feature-rich)
 *
 * Features:
 * - Similarity search with configurable distance metrics
 * - Hybrid search (combining keyword and vector search)
 * - Metadata filtering
 * - Multi-vector search
 * - Automatic index management
 * - Performance monitoring
 */

import pool from '../config/database'

export interface VectorStoreConfig {
  backend: 'pgvector' | 'pinecone' | 'qdrant'
  indexName?: string
  namespace?: string
  dimensions?: number
}

export interface VectorDocument {
  id: string
  content: string
  embedding?: number[]
  metadata?: Record<string, any>
  score?: number
}

export interface SearchOptions {
  limit?: number
  minScore?: number
  maxScore?: number
  filter?: Record<string, any>
  includeMetadata?: boolean
  includeEmbeddings?: boolean
}

export interface SearchResult {
  id: string
  content: string
  score: number
  metadata?: Record<string, any>
  embedding?: number[]
}

export interface HybridSearchOptions extends SearchOptions {
  keywordWeight?: number // 0-1, weight for keyword search
  vectorWeight?: number // 0-1, weight for vector search
  keywordFields?: string[] // Fields to search for keywords
}

export class VectorSearchService {
  private backend: 'pgvector' | 'pinecone' | 'qdrant'
  private pinecone: any = null
  private qdrant: any = null
  private initialized = false

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.backend = config.backend || this.selectBestBackend()
    // Don't call async initialization in constructor
  }

  /**
   * Initialize vector store backend (called lazily)
   */
  private async initializeBackend(): Promise<void> {
    if (this.initialized) return
    switch (this.backend) {
      case 'pgvector':
        await this.initializePgVector()
        break
      case 'pinecone':
        await this.initializePinecone()
        break
      case 'qdrant':
        await this.initializeQdrant()
        break
    }
    this.initialized = true
  }

  /**
   * Initialize PostgreSQL with pgvector
   */
  private async initializePgVector(): Promise<void> {
    try {
      // Check if pgvector extension is installed
      const result = await pool.query(
        "SELECT ` + (await getTableColumns(pool, 'pg_extension')).join(', ') + ` FROM pg_extension WHERE extname = 'vector'"
      )

      if (result.rows.length === 0) {
        console.warn('⚠ pgvector extension not installed. Install with: CREATE EXTENSION vector;')
      } else {
        console.log('✓ PostgreSQL pgvector backend initialized')
      }
    } catch (error) {
      console.error('Error initializing pgvector:', error)
    }
  }

  /**
   * Initialize Pinecone
   */
  private async initializePinecone(): Promise<void> {
    if (!process.env.PINECONE_API_KEY) {
      console.warn('Pinecone API key not found, using pgvector fallback')
      this.backend = 'pgvector'
      await this.initializePgVector()
      return
    }

    try {
      const { Pinecone } = await import('@pinecone-database/pinecone')
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      })
      console.log('✓ Pinecone backend initialized')
    } catch (error) {
      console.warn('Pinecone SDK not available, falling back to pgvector')
      this.backend = 'pgvector'
      await this.initializePgVector()
    }
  }

  /**
   * Initialize Qdrant
   */
  private async initializeQdrant(): Promise<void> {
    if (!process.env.QDRANT_URL) {
      console.warn('Qdrant URL not found, using pgvector fallback')
      this.backend = 'pgvector'
      await this.initializePgVector()
      return
    }

    try {
      const { QdrantClient } = await import('@qdrant/js-client-rest')
      this.qdrant = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
      })
      console.log('✓ Qdrant backend initialized')
    } catch (error) {
      console.warn('Qdrant SDK not available, falling back to pgvector')
      this.backend = 'pgvector'
      await this.initializePgVector()
    }
  }

  /**
   * Index a document with its embedding
   */
  async indexDocument(
    tenantId: string,
    document: VectorDocument
  ): Promise<{ id: string; success: boolean }> {
    // Ensure backend is initialized
    await this.initializeBackend()

    // Generate embedding if not provided
    if (!document.embedding) {
      const embeddingService = await import('./EmbeddingService').then(m => m.default())
      const embeddingResult = await embeddingService.generateEmbedding(document.content)
      document.embedding = embeddingResult.embedding
    }

    switch (this.backend) {
      case 'pgvector':
        return this.indexDocumentPgVector(tenantId, document)
      case 'pinecone':
        return this.indexDocumentPinecone(tenantId, document)
      case 'qdrant':
        return this.indexDocumentQdrant(tenantId, document)
      default:
        throw new Error(`Unsupported backend: ${this.backend}`)
    }
  }

  /**
   * Index multiple documents (batch)
   */
  async indexDocumentsBatch(
    tenantId: string,
    documents: VectorDocument[]
  ): Promise<{ indexed: number; failed: number }> {
    let indexed = 0
    let failed = 0

    // Process in batches of 100
    const batchSize = 100
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)

      try {
        await Promise.all(
          batch.map(async doc => {
            try {
              await this.indexDocument(tenantId, doc)
              indexed++
            } catch (error) {
              console.error(`Failed to index document ${doc.id}:`, error)
              failed++
            }
          })
        )
      } catch (error) {
        console.error('Batch indexing error:', error)
        failed += batch.length
      }
    }

    return { indexed, failed }
  }

  /**
   * Semantic search using vector similarity
   */
  async search(
    tenantId: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // Ensure backend is initialized
    await this.initializeBackend()

    // Generate query embedding
    const embeddingService = await import('./EmbeddingService').then(m => m.default())
    const embeddingResult = await embeddingService.generateEmbedding(query)

    return this.searchByVector(tenantId, embeddingResult.embedding, options)
  }

  /**
   * Search by pre-computed vector
   */
  async searchByVector(
    tenantId: string,
    queryVector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    switch (this.backend) {
      case 'pgvector':
        return this.searchPgVector(tenantId, queryVector, options)
      case 'pinecone':
        return this.searchPinecone(tenantId, queryVector, options)
      case 'qdrant':
        return this.searchQdrant(tenantId, queryVector, options)
      default:
        throw new Error(`Unsupported backend: ${this.backend}`)
    }
  }

  /**
   * Hybrid search: combines keyword and vector search
   */
  async hybridSearch(
    tenantId: string,
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      keywordWeight = 0.3,
      vectorWeight = 0.7,
      keywordFields = ['content', 'metadata'],
      limit = 10,
      ...vectorOptions
    } = options

    // Perform vector search
    const vectorResults = await this.search(tenantId, query, {
      ...vectorOptions,
      limit: limit * 2, // Get more results for combining
    })

    // Perform keyword search (PostgreSQL full-text search)
    const keywordResults = await this.keywordSearch(tenantId, query, {
      limit: limit * 2,
      fields: keywordFields,
    })

    // Combine and re-rank results
    const combined = this.combineResults(vectorResults, keywordResults, {
      vectorWeight,
      keywordWeight,
    })

    return combined.slice(0, limit)
  }

  /**
   * Delete a document from the index
   */
  async deleteDocument(tenantId: string, documentId: string): Promise<boolean> {
    switch (this.backend) {
      case 'pgvector':
        return this.deleteDocumentPgVector(tenantId, documentId)
      case 'pinecone':
        return this.deleteDocumentPinecone(tenantId, documentId)
      case 'qdrant':
        return this.deleteDocumentQdrant(tenantId, documentId)
      default:
        throw new Error(`Unsupported backend: ${this.backend}`)
    }
  }

  /**
   * Update document metadata
   */
  async updateMetadata(
    tenantId: string,
    documentId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE document_embeddings
         SET metadata = $1, updated_at = NOW()
         WHERE document_id = $2 AND tenant_id = $3`,
        [JSON.stringify(metadata), documentId, tenantId]
      )
      return true
    } catch (error) {
      console.error('Error updating metadata:', error)
      return false
    }
  }

  // ============================================================================
  // PostgreSQL pgvector Implementation
  // ============================================================================

  private async indexDocumentPgVector(
    tenantId: string,
    document: VectorDocument
  ): Promise<{ id: string; success: boolean }> {
    try {
      await pool.query(
        `INSERT INTO document_embeddings (
          tenant_id, document_id, content, embedding, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (tenant_id, document_id)
        DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()`,
        [
          tenantId,
          document.id,
          document.content,
          JSON.stringify(document.embedding),
          JSON.stringify(document.metadata || {}),
        ]
      )

      return { id: document.id, success: true }
    } catch (error) {
      console.error('Error indexing document in pgvector:', error)
      return { id: document.id, success: false }
    }
  }

  private async searchPgVector(
    tenantId: string,
    queryVector: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const { limit = 10, minScore = 0, filter = {} } = options

    try {
      // Build filter conditions
      let filterSQL = ''
      const params: any[] = [tenantId, JSON.stringify(queryVector), limit]

      if (Object.keys(filter).length > 0) {
        const filterConditions = Object.entries(filter)
          .map(([key, value], index) => {
            params.push(value)
            return `metadata->>'${key}' = $${params.length}`
          })
          .join(' AND ')

        filterSQL = `AND ${filterConditions}`
      }

      // Cosine similarity search using pgvector
      const query = `
        SELECT
          document_id as id,
          content,
          1 - (embedding::vector <=> $2::vector) as score,
          metadata
        FROM document_embeddings
        WHERE tenant_id = $1
          ${filterSQL}
        ORDER BY embedding::vector <=> $2::vector
        LIMIT $3
      `

      const result = await pool.query(query, params)

      return result.rows
        .filter((row: any) => row.score >= minScore)
        .map((row: any) => ({
          id: row.id,
          content: row.content,
          score: row.score,
          metadata: row.metadata,
        }))
    } catch (error) {
      console.error('Error searching in pgvector:', error)
      return []
    }
  }

  private async deleteDocumentPgVector(tenantId: string, documentId: string): Promise<boolean> {
    try {
      await pool.query(
        'DELETE FROM document_embeddings WHERE tenant_id = $1 AND document_id = $2',
        [tenantId, documentId]
      )
      return true
    } catch (error) {
      console.error('Error deleting document from pgvector:', error)
      return false
    }
  }

  // ============================================================================
  // Pinecone Implementation
  // ============================================================================

  private async indexDocumentPinecone(
    tenantId: string,
    document: VectorDocument
  ): Promise<{ id: string; success: boolean }> {
    if (!this.pinecone) {
      throw new Error('Pinecone not initialized')
    }

    try {
      const indexName = process.env.PINECONE_INDEX || 'fleet-documents'
      const index = this.pinecone.index(indexName)

      await index.namespace(tenantId).upsert([
        {
          id: document.id,
          values: document.embedding,
          metadata: {
            ...document.metadata,
            content: document.content,
          },
        },
      ])

      return { id: document.id, success: true }
    } catch (error) {
      console.error('Error indexing document in Pinecone:', error)
      return { id: document.id, success: false }
    }
  }

  private async searchPinecone(
    tenantId: string,
    queryVector: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.pinecone) {
      throw new Error('Pinecone not initialized')
    }

    const { limit = 10, minScore = 0, filter = {} } = options

    try {
      const indexName = process.env.PINECONE_INDEX || 'fleet-documents'
      const index = this.pinecone.index(indexName)

      const results = await index.namespace(tenantId).query({
        vector: queryVector,
        topK: limit,
        includeMetadata: true,
        filter,
      })

      return results.matches
        .filter((match: any) => match.score >= minScore)
        .map((match: any) => ({
          id: match.id,
          content: match.metadata.content,
          score: match.score,
          metadata: match.metadata,
        }))
    } catch (error) {
      console.error('Error searching in Pinecone:', error)
      return []
    }
  }

  private async deleteDocumentPinecone(tenantId: string, documentId: string): Promise<boolean> {
    if (!this.pinecone) {
      throw new Error('Pinecone not initialized')
    }

    try {
      const indexName = process.env.PINECONE_INDEX || 'fleet-documents'
      const index = this.pinecone.index(indexName)

      await index.namespace(tenantId).deleteOne(documentId)
      return true
    } catch (error) {
      console.error('Error deleting document from Pinecone:', error)
      return false
    }
  }

  // ============================================================================
  // Qdrant Implementation
  // ============================================================================

  private async indexDocumentQdrant(
    tenantId: string,
    document: VectorDocument
  ): Promise<{ id: string; success: boolean }> {
    if (!this.qdrant) {
      throw new Error('Qdrant not initialized')
    }

    try {
      const collectionName = `fleet-documents-${tenantId}`

      await this.qdrant.upsert(collectionName, {
        points: [
          {
            id: document.id,
            vector: document.embedding,
            payload: {
              content: document.content,
              ...document.metadata,
            },
          },
        ],
      })

      return { id: document.id, success: true }
    } catch (error) {
      console.error('Error indexing document in Qdrant:', error)
      return { id: document.id, success: false }
    }
  }

  private async searchQdrant(
    tenantId: string,
    queryVector: number[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.qdrant) {
      throw new Error('Qdrant not initialized')
    }

    const { limit = 10, minScore = 0, filter = {} } = options

    try {
      const collectionName = `fleet-documents-${tenantId}`

      const results = await this.qdrant.search(collectionName, {
        vector: queryVector,
        limit,
        filter: Object.keys(filter).length > 0 ? { must: filter } : undefined,
      })

      return results
        .filter((result: any) => result.score >= minScore)
        .map((result: any) => ({
          id: result.id,
          content: result.payload.content,
          score: result.score,
          metadata: result.payload,
        }))
    } catch (error) {
      console.error('Error searching in Qdrant:', error)
      return []
    }
  }

  private async deleteDocumentQdrant(tenantId: string, documentId: string): Promise<boolean> {
    if (!this.qdrant) {
      throw new Error('Qdrant not initialized')
    }

    try {
      const collectionName = `fleet-documents-${tenantId}`
      await this.qdrant.delete(collectionName, {
        points: [documentId],
      })
      return true
    } catch (error) {
      console.error('Error deleting document from Qdrant:', error)
      return false
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Keyword search using PostgreSQL full-text search
   */
  private async keywordSearch(
    tenantId: string,
    query: string,
    options: { limit: number; fields: string[] }
  ): Promise<SearchResult[]> {
    try {
      const result = await pool.query(
        `SELECT
          document_id as id,
          content,
          ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) as score,
          metadata
        FROM document_embeddings
        WHERE tenant_id = $1
          AND to_tsvector('english', content) @@ plainto_tsquery('english', $2)
        ORDER BY score DESC
        LIMIT $3`,
        [tenantId, query, options.limit]
      )

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        score: row.score,
        metadata: row.metadata,
      }))
    } catch (error) {
      console.error('Error in keyword search:', error)
      return []
    }
  }

  /**
   * Combine vector and keyword search results
   */
  private combineResults(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[],
    weights: { vectorWeight: number; keywordWeight: number }
  ): SearchResult[] {
    const combined = new Map<string, SearchResult>()

    // Normalize and add vector results
    const maxVectorScore = Math.max(...vectorResults.map(r => r.score), 1)
    vectorResults.forEach(result => {
      combined.set(result.id, {
        ...result,
        score: (result.score / maxVectorScore) * weights.vectorWeight,
      })
    })

    // Normalize and combine keyword results
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.score), 1)
    keywordResults.forEach(result => {
      const existing = combined.get(result.id)
      const keywordScore = (result.score / maxKeywordScore) * weights.keywordWeight

      if (existing) {
        existing.score += keywordScore
      } else {
        combined.set(result.id, {
          ...result,
          score: keywordScore,
        })
      }
    })

    // Sort by combined score
    return Array.from(combined.values()).sort((a, b) => b.score - a.score)
  }

  /**
   * Select best available backend
   */
  private selectBestBackend(): 'pgvector' | 'pinecone' | 'qdrant' {
    if (process.env.PINECONE_API_KEY) return 'pinecone'
    if (process.env.QDRANT_URL) return 'qdrant'
    return 'pgvector'
  }

  /**
   * Get service statistics
   */
  async getStatistics(tenantId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_documents,
          AVG(LENGTH(content)) as avg_content_length,
          MIN(created_at) as oldest_document,
          MAX(created_at) as newest_document
        FROM document_embeddings
        WHERE tenant_id = $1`,
        [tenantId]
      )

      return {
        backend: this.backend,
        ...result.rows[0],
      }
    } catch (error) {
      console.error('Error getting statistics:', error)
      return { backend: this.backend, total_documents: 0 }
    }
  }
}

// Export the class instead of an instance to avoid module-level database access
// Initialize in server.ts after database connection is established
export default VectorSearchService
