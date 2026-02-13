// Fleet Application - Semantic Search with Vector Embeddings
// AI-powered document search using OpenAI embeddings and cosine similarity

import { OpenAI } from 'openai';
import { Pool } from 'pg';

import logger from '../../config/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface SearchOptions {
  query: string;
  limit?: number;
  threshold?: number; // Minimum similarity score (0-1)
  filters?: {
    category?: string[];
    dateRange?: { start: Date; end: Date };
    owner?: string;
    tags?: string[];
  };
}

interface SearchResult {
  documentId: string;
  title: string;
  snippet: string;
  similarity: number;
  metadata: Record<string, any>;
}

export class SemanticSearchService {
  private pool: Pool;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Generate embedding vector for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small', // 1536 dimensions, cost-effective
        input: text.substring(0, 8000), // Limit token count
      });

      const embedding = response.data[0].embedding;

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      logger.error('Embedding generation failed', { error });
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Perform semantic search across documents
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      limit = 10,
      threshold = 0.7,
      filters = {}
    } = options;

    // Generate embedding for search query
    const queryEmbedding = await this.generateEmbedding(query);

    // Build SQL query with filters
    let sql = `
      SELECT
        d.id,
        d.title,
        d.content_text,
        d.metadata,
        de.embedding,
        (1 - (de.embedding <=> $1::vector)) as similarity
      FROM documents d
      INNER JOIN document_embeddings de ON d.id = de.document_id
      WHERE (1 - (de.embedding <=> $1::vector)) >= $2
    `;

    const params: any[] = [
      `[${queryEmbedding.join(',')}]`, // Vector as string for pgvector
      threshold
    ];
    let paramCount = 2;

    // Apply filters
    if (filters.category && filters.category.length > 0) {
      paramCount++;
      sql += ` AND d.category = ANY($${paramCount})`;
      params.push(filters.category);
    }

    if (filters.dateRange) {
      paramCount++;
      sql += ` AND d.created_at >= $${paramCount}`;
      params.push(filters.dateRange.start);

      paramCount++;
      sql += ` AND d.created_at <= $${paramCount}`;
      params.push(filters.dateRange.end);
    }

    if (filters.owner) {
      paramCount++;
      sql += ` AND d.owner_id = $${paramCount}`;
      params.push(filters.owner);
    }

    if (filters.tags && filters.tags.length > 0) {
      paramCount++;
      sql += ` AND d.tags && $${paramCount}`;
      params.push(filters.tags);
    }

    sql += `
      ORDER BY similarity DESC
      LIMIT $${paramCount + 1}
    `;
    params.push(limit);

    try {
      const result = await this.pool.query(sql, params);

      return result.rows.map(row => ({
        documentId: row.id,
        title: row.title,
        snippet: this.extractSnippet(row.content_text, query),
        similarity: parseFloat(row.similarity),
        metadata: row.metadata
      }));
    } catch (error) {
      logger.error('Semantic search failed', { error });
      throw new Error('Search failed');
    }
  }

  /**
   * Find similar documents to a given document
   */
  async findSimilar(documentId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Get the embedding for the source document
      const sourceQuery = `
        SELECT embedding, title, content_text
        FROM document_embeddings de
        INNER JOIN documents d ON de.document_id = d.id
        WHERE de.document_id = $1
      `;
      const sourceResult = await this.pool.query(sourceQuery, [documentId]);

      if (sourceResult.rows.length === 0) {
        throw new Error('Document not found');
      }

      const sourceEmbedding = sourceResult.rows[0].embedding;
      const sourceTitle = sourceResult.rows[0].title;

      // Find similar documents
      const similarQuery = `
        SELECT
          d.id,
          d.title,
          d.content_text,
          d.metadata,
          (1 - (de.embedding <=> $1::vector)) as similarity
        FROM documents d
        INNER JOIN document_embeddings de ON d.id = de.document_id
        WHERE d.id != $2
        ORDER BY similarity DESC
        LIMIT $3
      `;

      const result = await this.pool.query(similarQuery, [
        sourceEmbedding,
        documentId,
        limit
      ]);

      return result.rows.map(row => ({
        documentId: row.id,
        title: row.title,
        snippet: this.extractSnippet(row.content_text, sourceTitle),
        similarity: parseFloat(row.similarity),
        metadata: row.metadata
      }));
    } catch (error) {
      logger.error('Similar document search failed', { error });
      throw new Error('Failed to find similar documents');
    }
  }

  /**
   * Index a document for semantic search
   */
  async indexDocument(documentId: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Store in database
      const sql = `
        INSERT INTO document_embeddings (document_id, embedding, indexed_at, metadata)
        VALUES ($1, $2, NOW(), $3)
        ON CONFLICT (document_id)
        DO UPDATE SET
          embedding = $2,
          indexed_at = NOW(),
          metadata = $3
      `;

      await this.pool.query(sql, [
        documentId,
        `[${embedding.join(',')}]`,
        JSON.stringify(metadata)
      ]);

      logger.info(`Document ${documentId} indexed for semantic search`);
    } catch (error) {
      logger.error('Document indexing failed', { error });
      throw new Error('Failed to index document');
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(documents: Array<{ id: string; content: string; metadata?: Record<string, any> }>): Promise<void> {
    const batchSize = 10; // Process in batches to avoid rate limits

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await Promise.all(
        batch.map(doc =>
          this.indexDocument(doc.id, doc.content, doc.metadata)
            .catch(err => logger.error(`Failed to index ${doc.id}`, { error: err }))
        )
      );

      // Rate limit delay
      if (i + batchSize < documents.length) {
        await this.delay(1000);
      }
    }
  }

  /**
   * Perform hybrid search (semantic + keyword)
   */
  async hybridSearch(options: SearchOptions & { keywordWeight?: number }): Promise<SearchResult[]> {
    const { keywordWeight = 0.3, ...searchOptions } = options;
    const semanticWeight = 1 - keywordWeight;

    // Perform semantic search
    const semanticResults = await this.search(searchOptions);

    // Perform keyword search
    const keywordResults = await this.keywordSearch(searchOptions);

    // Merge and re-rank results
    const mergedResults = this.mergeResults(
      semanticResults,
      keywordResults,
      semanticWeight,
      keywordWeight
    );

    return mergedResults.slice(0, searchOptions.limit || 10);
  }

  /**
   * Traditional keyword-based search for hybrid approach
   */
  private async keywordSearch(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 10, filters = {} } = options;

    let sql = `
      SELECT
        id,
        title,
        content_text,
        metadata,
        ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
      FROM documents
      WHERE search_vector @@ plainto_tsquery('english', $1)
    `;

    const params: any[] = [query];
    let paramCount = 1;

    // Apply same filters as semantic search
    if (filters.category && filters.category.length > 0) {
      paramCount++;
      sql += ` AND category = ANY($${paramCount})`;
      params.push(filters.category);
    }

    sql += `
      ORDER BY rank DESC
      LIMIT $${paramCount + 1}
    `;
    params.push(limit);

    const result = await this.pool.query(sql, params);

    return result.rows.map(row => ({
      documentId: row.id,
      title: row.title,
      snippet: this.extractSnippet(row.content_text, query),
      similarity: parseFloat(row.rank),
      metadata: row.metadata
    }));
  }

  /**
   * Merge semantic and keyword search results
   */
  private mergeResults(
    semantic: SearchResult[],
    keyword: SearchResult[],
    semanticWeight: number,
    keywordWeight: number
  ): SearchResult[] {
    const resultMap = new Map<string, SearchResult>();

    // Add semantic results
    semantic.forEach(result => {
      resultMap.set(result.documentId, {
        ...result,
        similarity: result.similarity * semanticWeight
      });
    });

    // Merge keyword results
    keyword.forEach(result => {
      const existing = resultMap.get(result.documentId);
      if (existing) {
        existing.similarity += result.similarity * keywordWeight;
      } else {
        resultMap.set(result.documentId, {
          ...result,
          similarity: result.similarity * keywordWeight
        });
      }
    });

    // Sort by combined score
    return Array.from(resultMap.values())
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Extract relevant snippet from document
   */
  private extractSnippet(content: string, query: string, maxLength: number = 200): string {
    if (!content) return '';

    const queryTerms = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);

    // Find sentence with most query terms
    let bestSentence = sentences[0];
    let maxMatches = 0;

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const matches = queryTerms.filter(term => lowerSentence.includes(term)).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    });

    // Truncate if needed
    if (bestSentence.length > maxLength) {
      return bestSentence.substring(0, maxLength) + '...';
    }

    return bestSentence.trim();
  }

  /**
   * Simple hash for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.embeddingCache.size,
      maxSize: 1000 // Could be configurable
    };
  }
}

// Database migration for pgvector support
export const semanticSearchMigration = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id SERIAL PRIMARY KEY,
  document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL, -- OpenAI embedding dimensions
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector
ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index on document_id for joins
CREATE INDEX IF NOT EXISTS idx_document_embeddings_doc_id
ON document_embeddings(document_id);

-- Create full-text search vector on documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(content_text, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_documents_search_vector
ON documents USING GIN (search_vector);
`;
