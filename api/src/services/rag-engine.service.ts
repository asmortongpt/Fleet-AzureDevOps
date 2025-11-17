/**
 * RAG (Retrieval Augmented Generation) Engine Service
 * Provides semantic search and context-aware responses using vector embeddings
 */

import pool from '../config/database'
import { logger } from '../config/logger'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface Document {
  document_type: string
  document_id?: string
  document_title: string
  document_source?: string
  content: string
  metadata?: Record<string, any>
}

export interface EmbeddingChunk {
  id: string
  document_type: string
  document_title: string
  content_chunk: string
  chunk_index: number
  similarity: number
  metadata: Record<string, any>
}

export interface RAGQuery {
  query: string
  context_type?: string
  max_chunks?: number
  similarity_threshold?: number
}

export interface RAGResponse {
  answer: string
  confidence_score: number
  sources: EmbeddingChunk[]
  processing_time_ms: number
}

class RAGEngineService {
  private embeddingModel = 'text-embedding-3-small'
  private chatModel = 'gpt-4o-mini'

  /**
   * Index a document into the RAG system
   */
  async indexDocument(
    tenantId: string,
    document: Document
  ): Promise<{ chunks_created: number; document_id: string }> {
    const startTime = Date.now()

    try {
      // Split document into chunks (approximately 500 tokens each)
      const chunks = this.splitIntoChunks(document.content, 500)
      logger.info('Document split into chunks', { chunks: chunks.length, title: document.document_title })

      // Generate embeddings for each chunk
      const embeddingsPromises = chunks.map(async (chunk, index) => {
        const embedding = await this.generateEmbedding(chunk)

        return pool.query(
          `INSERT INTO embedding_vectors (
            tenant_id, document_type, document_id, document_title,
            document_source, content_chunk, chunk_index, chunk_total,
            embedding, embedding_model, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id`,
          [
            tenantId,
            document.document_type,
            document.document_id,
            document.document_title,
            document.document_source,
            chunk,
            index,
            chunks.length,
            `[${embedding.join(',')}]`, // pgvector format
            this.embeddingModel,
            JSON.stringify(document.metadata || {})
          ]
        )
      })

      await Promise.all(embeddingsPromises)

      const processingTime = Date.now() - startTime
      logger.info('Document indexed successfully', {
        title: document.document_title,
        chunks: chunks.length,
        processingTime
      })

      return {
        chunks_created: chunks.length,
        document_id: document.document_id || 'generated'
      }
    } catch (error: any) {
      logger.error('Error indexing document', { error: error.message, document: document.document_title })
      throw error
    }
  }

  /**
   * Query the RAG system
   */
  async query(
    tenantId: string,
    userId: string | undefined,
    query: RAGQuery
  ): Promise<RAGResponse> {
    const startTime = Date.now()

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query.query)

      // Search for similar chunks using cosine similarity
      const maxChunks = query.max_chunks || 5
      const similarityThreshold = query.similarity_threshold || 0.7

      let sqlQuery = `
        SELECT
          id,
          document_type,
          document_title,
          content_chunk,
          chunk_index,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
        FROM embedding_vectors
        WHERE tenant_id = $2
          AND 1 - (embedding <=> $1::vector) > $3
      `

      const params: any[] = [
        `[${queryEmbedding.join(',')}]`,
        tenantId,
        similarityThreshold
      ]

      if (query.context_type) {
        sqlQuery += ` AND document_type = $4`
        params.push(query.context_type)
      }

      sqlQuery += ` ORDER BY similarity DESC LIMIT ${maxChunks}`

      const result = await pool.query(sqlQuery, params)

      const retrievedChunks: EmbeddingChunk[] = result.rows

      if (retrievedChunks.length === 0) {
        logger.warn('No relevant chunks found for query', { query: query.query })
        return {
          answer: 'I could not find relevant information in the fleet knowledge base to answer your question.',
          confidence_score: 0,
          sources: [],
          processing_time_ms: Date.now() - startTime
        }
      }

      // Generate response using retrieved context
      const answer = await this.generateAnswer(query.query, retrievedChunks)

      // Calculate confidence score based on similarity and number of sources
      const avgSimilarity = retrievedChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / retrievedChunks.length
      const confidenceScore = Math.min(avgSimilarity * 1.2, 1.0) // Boost slightly, cap at 1.0

      const processingTime = Date.now() - startTime

      // Log query
      await this.logQuery(
        tenantId,
        userId,
        query.query,
        queryEmbedding,
        query.context_type,
        retrievedChunks,
        answer,
        confidenceScore,
        processingTime
      )

      return {
        answer,
        confidence_score: Math.round(confidenceScore * 10000) / 10000,
        sources: retrievedChunks,
        processing_time_ms: processingTime
      }
    } catch (error: any) {
      logger.error('RAG query error', { error: error.message, query: query.query })
      throw error
    }
  }

  /**
   * Generate answer using OpenAI with retrieved context
   */
  private async generateAnswer(query: string, context: EmbeddingChunk[]): Promise<string> {
    const contextText = context
      .map((chunk, idx) => `[Source ${idx + 1}: ${chunk.document_title}]\n${chunk.content_chunk}`)
      .join('\n\n')

    const systemPrompt = `You are a Fleet Management AI assistant with access to the organization's fleet policies, procedures, maintenance histories, and documentation.

Your task is to answer questions accurately based on the provided context from the knowledge base. Always:
1. Base your answers strictly on the provided context
2. Cite specific sources when possible
3. If the context doesn't contain the answer, say so clearly
4. Be concise but thorough
5. Focus on practical, actionable information

Context from Knowledge Base:
${contextText}`

    const response = await openai.chat.completions.create({
      model: this.chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    return response.choices[0]?.message?.content || 'Unable to generate response'
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      })

      return response.data[0].embedding
    } catch (error: any) {
      logger.error('Error generating embedding', { error: error.message })
      throw error
    }
  }

  /**
   * Split text into chunks
   */
  private splitIntoChunks(text: string, maxTokens: number): string[] {
    // Approximate: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4
    const chunks: string[] = []

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/)

    let currentChunk = ''

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= maxChars) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }

        // If single paragraph is too long, split by sentences
        if (paragraph.length > maxChars) {
          const sentences = paragraph.split(/\. /)
          currentChunk = ''

          for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxChars) {
              currentChunk += (currentChunk ? '. ' : '') + sentence
            } else {
              if (currentChunk) {
                chunks.push(currentChunk.trim())
              }
              currentChunk = sentence
            }
          }
        } else {
          currentChunk = paragraph
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  /**
   * Log RAG query
   */
  private async logQuery(
    tenantId: string,
    userId: string | undefined,
    queryText: string,
    queryEmbedding: number[],
    contextType: string | undefined,
    retrievedChunks: EmbeddingChunk[],
    generatedResponse: string,
    confidenceScore: number,
    processingTime: number
  ): Promise<void> {
    try {
      const sourcesCited = retrievedChunks.map(chunk => ({
        document_title: chunk.document_title,
        document_type: chunk.document_type,
        similarity: chunk.similarity
      }))

      await pool.query(
        `INSERT INTO rag_queries (
          tenant_id, user_id, query_text, query_embedding, context_type,
          retrieved_chunks, generated_response, confidence_score,
          sources_cited, processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenantId,
          userId || null,
          queryText,
          `[${queryEmbedding.join(',')}]`,
          contextType || null,
          JSON.stringify(retrievedChunks.map(c => ({ id: c.id, chunk_index: c.chunk_index }))),
          generatedResponse,
          confidenceScore,
          JSON.stringify(sourcesCited),
          processingTime
        ]
      )
    } catch (error) {
      logger.warn('Failed to log RAG query', { error })
    }
  }

  /**
   * Provide feedback on RAG response
   */
  async provideFeedback(
    queryId: string,
    tenantId: string,
    wasHelpful: boolean,
    feedback?: string
  ): Promise<void> {
    await pool.query(
      `UPDATE rag_queries
       SET was_helpful = $1, user_feedback = $2
       WHERE id = $3 AND tenant_id = $4`,
      [wasHelpful, feedback || null, queryId, tenantId]
    )

    logger.info('RAG feedback recorded', { queryId, wasHelpful })
  }

  /**
   * Delete document from RAG system
   */
  async deleteDocument(tenantId: string, documentId: string): Promise<number> {
    const result = await pool.query(
      `DELETE FROM embedding_vectors
       WHERE tenant_id = $1 AND document_id = $2`,
      [tenantId, documentId]
    )

    logger.info('Document deleted from RAG', { documentId, chunksDeleted: result.rowCount })
    return result.rowCount || 0
  }

  /**
   * Get document statistics
   */
  async getStatistics(tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT document_id) as total_documents,
        COUNT(*) as total_chunks,
        COUNT(DISTINCT document_type) as document_types,
        AVG(LENGTH(content_chunk)) as avg_chunk_size
       FROM embedding_vectors
       WHERE tenant_id = $1`,
      [tenantId]
    )

    const queryStats = await pool.query(
      `SELECT
        COUNT(*) as total_queries,
        AVG(confidence_score) as avg_confidence,
        COUNT(*) FILTER (WHERE was_helpful = true) as helpful_queries,
        COUNT(*) FILTER (WHERE was_helpful = false) as unhelpful_queries
       FROM rag_queries
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId]
    )

    return {
      ...result.rows[0],
      ...queryStats.rows[0]
    }
  }

  /**
   * Bulk index multiple documents
   */
  async bulkIndexDocuments(
    tenantId: string,
    documents: Document[]
  ): Promise<{ total: number; successful: number; failed: number }> {
    let successful = 0
    let failed = 0

    for (const document of documents) {
      try {
        await this.indexDocument(tenantId, document)
        successful++
      } catch (error) {
        failed++
        logger.error('Failed to index document in bulk operation', {
          title: document.document_title
        })
      }
    }

    logger.info('Bulk indexing completed', { total: documents.length, successful, failed })

    return { total: documents.length, successful, failed }
  }
}

export const ragEngineService = new RAGEngineService()
export default ragEngineService
