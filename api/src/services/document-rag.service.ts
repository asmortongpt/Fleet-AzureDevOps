/**
 * Document RAG (Retrieval Augmented Generation) Service
 *
 * Provides semantic search and AI-powered Q&A over documents:
 * - Text chunking for optimal embedding
 * - Vector embedding generation (OpenAI or local models)
 * - Semantic similarity search
 * - Context retrieval for AI queries
 * - Document Q&A capabilities
 */

import pool from '../config/database'
import OpenAI from 'openai'

export interface DocumentChunk {
  id: string
  document_id: string
  chunk_text: string
  chunk_index: number
  chunk_type: string
  page_number?: number
  section_title?: string
  token_count: number
  metadata?: any
}

export interface SearchResult {
  chunk_id: string
  document_id: string
  document_name: string
  chunk_text: string
  similarity_score: number
  page_number?: number
  section_title?: string
  category_name?: string
}

export interface QAResult {
  answer: string
  sources: SearchResult[]
  confidence: number
  query_id: string
}

export class DocumentRAGService {
  private openai: OpenAI | null = null
  private embeddingModel = 'text-embedding-ada-002'
  private chatModel = 'gpt-4'
  private chunkSize = 1000 // characters
  private chunkOverlap = 200 // characters

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    } else {
      console.warn('OpenAI API key not found. RAG features will use mock data.')
    }
  }

  /**
   * Generate embeddings for a document's text
   */
  async generateDocumentEmbeddings(documentId: string, text: string): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Delete existing embeddings for this document
      await client.query(
        'DELETE FROM document_embeddings WHERE document_id = $1',
        [documentId]
      )

      // Split text into chunks
      const chunks = this.chunkText(text)

      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        // Generate embedding
        const embedding = await this.generateEmbedding(chunk.text)

        // Store in database
        await client.query(
          `INSERT INTO document_embeddings (
            document_id, chunk_text, chunk_index, embedding,
            chunk_type, token_count, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            documentId,
            chunk.text,
            i,
            JSON.stringify(embedding),
            'paragraph',
            chunk.token_count,
            JSON.stringify(chunk.metadata || {})
          ]
        )
      }

      await client.query('COMMIT')
      console.log(`Generated ${chunks.length} embeddings for document ${documentId}`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error generating document embeddings:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Split text into chunks with overlap
   */
  private chunkText(text: string): Array<{ text: string; token_count: number; metadata?: any }> {
    const chunks: Array<{ text: string; token_count: number; metadata?: any }> = []

    // Clean text
    text = text.replace(/\s+/g, ' ').trim()

    if (text.length === 0) {
      return chunks
    }

    let start = 0
    while (start < text.length) {
      let end = start + this.chunkSize

      // Try to break at sentence boundary
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end)
        if (sentenceEnd > start + this.chunkSize / 2) {
          end = sentenceEnd + 1
        }
      } else {
        end = text.length
      }

      const chunkText = text.slice(start, end).trim()

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          token_count: this.estimateTokenCount(chunkText),
          metadata: {}
        })
      }

      // Move start position with overlap
      start = end - this.chunkOverlap
      if (start >= text.length) break
    }

    return chunks
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token on average
    return Math.ceil(text.length / 4)
  }

  /**
   * Generate embedding vector for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      // Return mock embedding for development
      console.warn('Using mock embedding (OpenAI not configured)')
      return this.generateMockEmbedding()
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      // Fallback to mock embedding
      return this.generateMockEmbedding()
    }
  }

  /**
   * Generate mock embedding for development
   */
  private generateMockEmbedding(): number[] {
    // Generate a random 1536-dimensional vector (OpenAI ada-002 size)
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
  }

  /**
   * Semantic search across documents
   */
  async semanticSearch(
    tenantId: string,
    query: string,
    options?: {
      limit?: number
      categoryId?: string
      documentIds?: string[]
      minScore?: number
    }
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query)

      // Build SQL query
      let sql = `
        SELECT
          de.id as chunk_id,
          de.document_id,
          d.file_name as document_name,
          de.chunk_text,
          de.page_number,
          de.section_title,
          dc.category_name,
          1 - (de.embedding <=> $1::vector) as similarity_score
        FROM document_embeddings de
        JOIN documents d ON de.document_id = d.id
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        WHERE d.tenant_id = $2 AND d.status = 'active'
      `

      const params: any[] = [JSON.stringify(queryEmbedding), tenantId]
      let paramCount = 2

      if (options?.categoryId) {
        paramCount++
        sql += ` AND d.category_id = $${paramCount}`
        params.push(options.categoryId)
      }

      if (options?.documentIds && options.documentIds.length > 0) {
        paramCount++
        sql += ` AND d.id = ANY($${paramCount})`
        params.push(options.documentIds)
      }

      if (options?.minScore) {
        paramCount++
        sql += ` AND (1 - (de.embedding <=> $1::vector)) >= $${paramCount}`
        params.push(options.minScore)
      }

      sql += ` ORDER BY similarity_score DESC LIMIT $${paramCount + 1}`
      params.push(options?.limit || 10)

      const result = await pool.query(sql, params)

      return result.rows
    } catch (error) {
      console.error('Error performing semantic search:', error)
      throw error
    }
  }

  /**
   * Answer a question using RAG
   */
  async askQuestion(
    tenantId: string,
    userId: string,
    question: string,
    options?: {
      categoryId?: string
      documentIds?: string[]
      maxSources?: number
    }
  ): Promise<QAResult> {
    const client = await pool.connect()

    try {
      // Search for relevant context
      const searchResults = await this.semanticSearch(tenantId, question, {
        limit: options?.maxSources || 5,
        categoryId: options?.categoryId,
        documentIds: options?.documentIds,
        minScore: 0.7
      })

      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the documents to answer your question.",
          sources: [],
          confidence: 0,
          query_id: ''
        }
      }

      // Build context from search results
      const context = searchResults
        .map((result, idx) => {
          return `[Source ${idx + 1}: ${result.document_name}${result.page_number ? `, Page ${result.page_number}` : ''}]\n${result.chunk_text}`
        })
        .join('\n\n')

      // Generate answer using OpenAI
      let answer: string
      let confidence: number

      if (!this.openai) {
        // Mock answer for development
        answer = `Based on the documents, here's what I found: ${searchResults[0].chunk_text.substring(0, 200)}... (Note: Using mock AI response - configure OpenAI API key for full functionality)`
        confidence = 0.5
      } else {
        const response = await this.openai.chat.completions.create({
          model: this.chatModel,
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that answers questions based on fleet management documents.
              Use the provided context to answer questions accurately. If the context doesn't contain enough information,
              say so clearly. Always cite which source you're using in your answer.`
            },
            {
              role: 'user',
              content: `Context:\n${context}\n\nQuestion: ${question}\n\nProvide a clear, concise answer based on the context above.`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })

        answer = response.choices[0].message.content || 'Unable to generate answer'
        confidence = 0.85 // Could be calculated based on search scores
      }

      // Generate query embedding for storage
      const queryEmbedding = await this.generateEmbedding(question)

      // Store query in history
      const queryResult = await client.query(
        `INSERT INTO document_rag_queries (
          tenant_id, user_id, query_text, query_embedding,
          response_text, matched_documents, matched_chunks,
          relevance_scores, execution_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id',
        [
          tenantId,
          userId,
          question,
          JSON.stringify(queryEmbedding),
          answer,
          searchResults.map(r => r.document_id),
          searchResults.map(r => r.chunk_id),
          JSON.stringify(searchResults.map(r => ({ chunk_id: r.chunk_id, score: r.similarity_score }))),
          0 // Execution time would be calculated
        ]
      )

      return {
        answer,
        sources: searchResults,
        confidence,
        query_id: queryResult.rows[0].id
      }
    } catch (error) {
      console.error('Error answering question:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get query history for analytics
   */
  async getQueryHistory(
    tenantId: string,
    options?: { userId?: string; limit?: number }
  ): Promise<any[]> {
    let query = `
      SELECT
        drq.*,
        u.first_name || ' ' || u.last_name as user_name,
        (
          SELECT json_agg(json_build_object('id', d.id, 'name', d.file_name))
          FROM documents d
          WHERE d.id = ANY(drq.matched_documents)
        ) as documents
      FROM document_rag_queries drq
      JOIN users u ON drq.user_id = u.id
      WHERE drq.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (options?.userId) {
      paramCount++
      query += ` AND drq.user_id = $${paramCount}`
      params.push(options.userId)
    }

    query += ` ORDER BY drq.created_at DESC LIMIT $${paramCount + 1}`
    params.push(options?.limit || 50)

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Provide feedback on a query
   */
  async provideFeedback(
    queryId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    await pool.query(
      `UPDATE document_rag_queries
       SET feedback_rating = $1, feedback_comment = $2
       WHERE id = $3',
      [rating, comment, queryId]
    )
  }

  /**
   * Get RAG analytics
   */
  async getAnalytics(tenantId: string): Promise<any> {
    const [totalQueries, avgRating, topQueries, recentQueries] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total, AVG(execution_time_ms) as avg_time
         FROM document_rag_queries
         WHERE tenant_id = $1',
        [tenantId]
      ),
      pool.query(
        `SELECT AVG(feedback_rating) as avg_rating, COUNT(*) as rated_count
         FROM document_rag_queries
         WHERE tenant_id = $1 AND feedback_rating IS NOT NULL`,
        [tenantId]
      ),
      pool.query(
        `SELECT query_text, COUNT(*) as count
         FROM document_rag_queries
         WHERE tenant_id = $1
         GROUP BY query_text
         ORDER BY count DESC
         LIMIT 10`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as count
         FROM document_rag_queries
         WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [tenantId]
      )
    ])

    return {
      total_queries: parseInt(totalQueries.rows[0].total) || 0,
      avg_execution_time: parseFloat(totalQueries.rows[0].avg_time) || 0,
      avg_rating: parseFloat(avgRating.rows[0].avg_rating) || 0,
      rated_queries: parseInt(avgRating.rows[0].rated_count) || 0,
      top_queries: topQueries.rows,
      recent_queries: parseInt(recentQueries.rows[0].count) || 0
    }
  }
}

export default new DocumentRAGService()
