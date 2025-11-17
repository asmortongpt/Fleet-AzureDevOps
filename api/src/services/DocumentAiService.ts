/**
 * Document AI Service
 *
 * Advanced AI-powered document analysis:
 * - Automatic document classification (contracts, invoices, reports, etc.)
 * - Key entity extraction (dates, amounts, names, locations, vehicle IDs)
 * - Document summarization (brief, detailed, executive)
 * - Sentiment analysis
 * - Q&A over documents using RAG
 * - Content validation and quality assessment
 *
 * Supports multiple AI providers: OpenAI GPT-4, Claude, Cohere
 */

import OpenAI from 'openai'
import pool from '../config/database'
import vectorSearchService from './VectorSearchService'
import embeddingService from './EmbeddingService'

export interface DocumentClassification {
  documentType: string
  confidence: number
  primaryCategory: string
  secondaryCategory?: string
  tags: string[]
  reasoning?: string
}

export interface ExtractedEntity {
  type: string // 'date', 'amount', 'vendor', 'person', 'location', 'vehicle_id', 'phone', 'email'
  value: string
  normalizedValue?: string
  confidence: number
  context?: string
  position?: { start: number; end: number }
}

export interface DocumentSummary {
  summaryType: 'brief' | 'detailed' | 'executive' | 'technical'
  summaryText: string
  keyPoints: string[]
  keywords: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentimentScore?: number
  originalLength: number
  summaryLength: number
  compressionRatio: number
}

export interface QAResponse {
  answer: string
  sources: Array<{
    documentId: string
    content: string
    score: number
    page?: number
  }>
  confidence: number
  modelUsed: string
}

export interface ValidationResult {
  isValid: boolean
  qualityScore: number
  issues: string[]
  suggestions: string[]
}

export class DocumentAiService {
  private openai: OpenAI | null = null
  private model = 'gpt-4-turbo-preview'
  private visionModel = 'gpt-4-vision-preview'

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      console.log('✓ DocumentAI Service initialized')
    } else {
      console.warn('⚠ OpenAI API key not found - DocumentAI will use mock responses')
    }
  }

  /**
   * Automatically classify a document
   */
  async classifyDocument(
    tenantId: string,
    documentId: string,
    content: string
  ): Promise<DocumentClassification> {
    if (!this.openai) {
      return this.getMockClassification()
    }

    try {
      const prompt = `Analyze this document and classify it. Return a JSON object with:
- documentType: specific type (e.g., "Fuel Receipt", "Repair Invoice", "Insurance Certificate", "Maintenance Report")
- confidence: 0-1 score
- primaryCategory: main category ("Receipts", "Invoices", "Safety Forms", "Vehicle Documentation", "Reports", etc.)
- secondaryCategory: subcategory if applicable
- tags: array of relevant tags
- reasoning: brief explanation

Document content:
${content.substring(0, 3000)}...`

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a document classification expert for fleet management systems. Analyze documents and provide accurate classifications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      // Store classification
      await this.storeClassification(tenantId, documentId, result)

      return {
        documentType: result.documentType,
        confidence: result.confidence,
        primaryCategory: result.primaryCategory,
        secondaryCategory: result.secondaryCategory,
        tags: result.tags || [],
        reasoning: result.reasoning,
      }
    } catch (error) {
      console.error('Document classification error:', error)
      return this.getMockClassification()
    }
  }

  /**
   * Extract key entities from document
   */
  async extractEntities(
    tenantId: string,
    documentId: string,
    content: string
  ): Promise<ExtractedEntity[]> {
    if (!this.openai) {
      return this.getMockEntities()
    }

    try {
      const prompt = `Extract all important entities from this document. Return a JSON array with objects containing:
- type: entity type (date, amount, vendor, person, location, vehicle_id, phone, email, etc.)
- value: the extracted value
- normalizedValue: standardized format if applicable
- confidence: 0-1 score
- context: surrounding text (optional)

Focus on fleet management relevant entities: dates, monetary amounts, vendor names, vehicle identifiers, driver names, locations, odometer readings, etc.

Document content:
${content.substring(0, 4000)}...`

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at extracting structured information from fleet management documents. Be precise and thorough.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      })

      const result = JSON.parse(response.choices[0].message.content || '{"entities":[]}')
      const entities = result.entities || []

      // Store entities
      await this.storeEntities(tenantId, documentId, entities)

      return entities.map((e: any) => ({
        type: e.type,
        value: e.value,
        normalizedValue: e.normalizedValue || e.value,
        confidence: e.confidence || 0.8,
        context: e.context,
      }))
    } catch (error) {
      console.error('Entity extraction error:', error)
      return this.getMockEntities()
    }
  }

  /**
   * Generate document summary
   */
  async generateSummary(
    tenantId: string,
    documentId: string,
    content: string,
    summaryType: 'brief' | 'detailed' | 'executive' | 'technical' = 'brief'
  ): Promise<DocumentSummary> {
    if (!this.openai) {
      return this.getMockSummary(content, summaryType)
    }

    try {
      const summaryPrompts = {
        brief: 'Create a brief 2-3 sentence summary highlighting the most important points.',
        detailed:
          'Create a detailed summary covering all major points, organized into clear sections.',
        executive:
          'Create an executive summary suitable for management, focusing on key decisions, costs, and action items.',
        technical:
          'Create a technical summary focusing on specifications, measurements, and technical details.',
      }

      const prompt = `${summaryPrompts[summaryType]}

Also provide:
- keyPoints: array of 3-5 key bullet points
- keywords: array of important keywords/topics
- sentiment: overall sentiment (positive, negative, or neutral)
- sentimentScore: -1 to 1 score

Return as JSON.

Document content:
${content}`

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at summarizing fleet management documents. Provide clear, actionable summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      const summary: DocumentSummary = {
        summaryType,
        summaryText: result.summary || result.summaryText || '',
        keyPoints: result.keyPoints || [],
        keywords: result.keywords || [],
        sentiment: result.sentiment || 'neutral',
        sentimentScore: result.sentimentScore || 0,
        originalLength: content.length,
        summaryLength: (result.summary || result.summaryText || '').length,
        compressionRatio: content.length / (result.summary || result.summaryText || 'x').length,
      }

      // Store summary
      await this.storeSummary(tenantId, documentId, summary)

      return summary
    } catch (error) {
      console.error('Summary generation error:', error)
      return this.getMockSummary(content, summaryType)
    }
  }

  /**
   * Answer questions about a document using RAG
   */
  async askQuestion(
    tenantId: string,
    userId: string,
    question: string,
    documentIds?: string[]
  ): Promise<QAResponse> {
    try {
      // Search for relevant content using vector search
      const searchResults = await vectorSearchService.search(tenantId, question, {
        limit: 5,
        minScore: 0.7,
        filter: documentIds ? { document_id: documentIds } : {},
      })

      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find relevant information in the documents to answer your question.",
          sources: [],
          confidence: 0,
          modelUsed: this.model,
        }
      }

      // Build context from search results
      const context = searchResults
        .map(
          (result, idx) =>
            `[Source ${idx + 1}]\n${result.content}\n[Similarity: ${result.score.toFixed(2)}]`
        )
        .join('\n\n')

      // Generate answer using GPT-4
      if (!this.openai) {
        return {
          answer: `Based on the documents: ${searchResults[0].content.substring(0, 200)}... (Mock response - configure OpenAI for full functionality)`,
          sources: searchResults.map(r => ({
            documentId: r.id,
            content: r.content,
            score: r.score,
          })),
          confidence: 0.5,
          modelUsed: 'mock',
        }
      }

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for fleet management. Answer questions accurately based on the provided document context.
If the context doesn't contain enough information, say so clearly. Always cite which source you're using.`,
          },
          {
            role: 'user',
            content: `Context from documents:\n${context}\n\nQuestion: ${question}\n\nProvide a clear, accurate answer based on the context above. Include source references.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      })

      const answer = response.choices[0].message.content || 'Unable to generate answer'

      // Calculate confidence based on top similarity score
      const confidence = searchResults[0]?.score || 0

      // Store query
      await this.storeQuery(tenantId, userId, question, answer, searchResults, confidence)

      return {
        answer,
        sources: searchResults.map(r => ({
          documentId: r.id,
          content: r.content,
          score: r.score,
          page: r.metadata?.page_number,
        })),
        confidence,
        modelUsed: this.model,
      }
    } catch (error) {
      console.error('Q&A error:', error)
      throw error
    }
  }

  /**
   * Validate document content quality
   */
  async validateDocument(content: string): Promise<ValidationResult> {
    if (!this.openai) {
      return {
        isValid: true,
        qualityScore: 0.7,
        issues: [],
        suggestions: ['Configure OpenAI API for full validation'],
      }
    }

    try {
      const prompt = `Analyze this document's content quality. Check for:
- Completeness (all necessary information present)
- Clarity (text is clear and readable)
- Accuracy (no obvious errors or inconsistencies)
- Formatting (proper structure)

Return JSON with:
- isValid: boolean
- qualityScore: 0-1 score
- issues: array of identified problems
- suggestions: array of improvement suggestions

Document content:
${content.substring(0, 2000)}...`

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a document quality validator. Assess documents objectively.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        isValid: result.isValid !== false,
        qualityScore: result.qualityScore || 0.7,
        issues: result.issues || [],
        suggestions: result.suggestions || [],
      }
    } catch (error) {
      console.error('Document validation error:', error)
      return {
        isValid: true,
        qualityScore: 0.5,
        issues: ['Validation error occurred'],
        suggestions: [],
      }
    }
  }

  /**
   * Analyze document sentiment
   */
  async analyzeSentiment(content: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral'
    score: number
    aspects?: Record<string, number>
  }> {
    if (!this.openai) {
      return { sentiment: 'neutral', score: 0 }
    }

    try {
      const prompt = `Analyze the sentiment of this document. Return JSON with:
- sentiment: "positive", "negative", or "neutral"
- score: -1 to 1 (-1 very negative, 0 neutral, 1 very positive)
- aspects: object with sentiment scores for different aspects (optional)

Document:
${content.substring(0, 2000)}...`

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze document sentiment accurately.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')

      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        aspects: result.aspects,
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      return { sentiment: 'neutral', score: 0 }
    }
  }

  // ============================================================================
  // Database Storage Methods
  // ============================================================================

  private async storeClassification(
    tenantId: string,
    documentId: string,
    classification: any
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO document_classifications (
          tenant_id, document_id, detected_type, confidence,
          primary_category, secondary_category, tags, model_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tenant_id, document_id)
        DO UPDATE SET
          detected_type = EXCLUDED.detected_type,
          confidence = EXCLUDED.confidence,
          primary_category = EXCLUDED.primary_category,
          secondary_category = EXCLUDED.secondary_category,
          tags = EXCLUDED.tags,
          model_name = EXCLUDED.model_name`,
        [
          tenantId,
          documentId,
          classification.documentType,
          classification.confidence,
          classification.primaryCategory,
          classification.secondaryCategory,
          classification.tags,
          this.model,
        ]
      )
    } catch (error) {
      console.error('Error storing classification:', error)
    }
  }

  private async storeEntities(
    tenantId: string,
    documentId: string,
    entities: any[]
  ): Promise<void> {
    try {
      // Delete existing entities
      await pool.query('DELETE FROM extracted_entities WHERE tenant_id = $1 AND document_id = $2', [
        tenantId,
        documentId,
      ])

      // Insert new entities
      for (const entity of entities) {
        await pool.query(
          `INSERT INTO extracted_entities (
            tenant_id, document_id, entity_type, entity_value,
            entity_normalized, confidence, context_text
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            tenantId,
            documentId,
            entity.type,
            entity.value,
            entity.normalizedValue || entity.value,
            entity.confidence || 0.8,
            entity.context,
          ]
        )
      }
    } catch (error) {
      console.error('Error storing entities:', error)
    }
  }

  private async storeSummary(
    tenantId: string,
    documentId: string,
    summary: DocumentSummary
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO document_summaries (
          tenant_id, document_id, summary_type, summary_text,
          key_points, keywords, sentiment, sentiment_score,
          original_length, summary_length, compression_ratio, model_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (tenant_id, document_id, summary_type)
        DO UPDATE SET
          summary_text = EXCLUDED.summary_text,
          key_points = EXCLUDED.key_points,
          keywords = EXCLUDED.keywords,
          sentiment = EXCLUDED.sentiment,
          sentiment_score = EXCLUDED.sentiment_score,
          original_length = EXCLUDED.original_length,
          summary_length = EXCLUDED.summary_length,
          compression_ratio = EXCLUDED.compression_ratio`,
        [
          tenantId,
          documentId,
          summary.summaryType,
          summary.summaryText,
          summary.keyPoints,
          summary.keywords,
          summary.sentiment,
          summary.sentimentScore,
          summary.originalLength,
          summary.summaryLength,
          summary.compressionRatio,
          this.model,
        ]
      )
    } catch (error) {
      console.error('Error storing summary:', error)
    }
  }

  private async storeQuery(
    tenantId: string,
    userId: string,
    question: string,
    answer: string,
    sources: any[],
    confidence: number
  ): Promise<void> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(question)

      await pool.query(
        `INSERT INTO rag_queries (
          tenant_id, user_id, query_text, query_embedding, query_type,
          results_count, results, top_similarity_score,
          response_text, response_model, confidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          tenantId,
          userId,
          question,
          JSON.stringify(queryEmbedding.embedding),
          'qa',
          sources.length,
          JSON.stringify(sources.map(s => ({ id: s.id, score: s.score }))),
          confidence,
          answer,
          this.model,
          confidence,
        ]
      )
    } catch (error) {
      console.error('Error storing query:', error)
    }
  }

  // ============================================================================
  // Mock Data Methods (for development without API keys)
  // ============================================================================

  private getMockClassification(): DocumentClassification {
    return {
      documentType: 'Maintenance Report',
      confidence: 0.75,
      primaryCategory: 'Reports',
      secondaryCategory: 'Maintenance Records',
      tags: ['maintenance', 'vehicle', 'service'],
      reasoning: 'Mock classification (configure OpenAI for real analysis)',
    }
  }

  private getMockEntities(): ExtractedEntity[] {
    return [
      {
        type: 'date',
        value: '2025-01-15',
        normalizedValue: '2025-01-15',
        confidence: 0.9,
      },
      {
        type: 'amount',
        value: '$1,234.56',
        normalizedValue: '1234.56',
        confidence: 0.85,
      },
      {
        type: 'vendor',
        value: 'Mock Vendor Inc.',
        normalizedValue: 'Mock Vendor Inc.',
        confidence: 0.8,
      },
    ]
  }

  private getMockSummary(content: string, summaryType: string): DocumentSummary {
    return {
      summaryType: summaryType as any,
      summaryText: `This is a mock ${summaryType} summary. Configure OpenAI API for real summarization.`,
      keyPoints: [
        'Configure OpenAI API key',
        'Real AI analysis will be available',
        'Mock data provided for development',
      ],
      keywords: ['mock', 'development', 'configuration'],
      sentiment: 'neutral',
      sentimentScore: 0,
      originalLength: content.length,
      summaryLength: 100,
      compressionRatio: content.length / 100,
    }
  }
}

export default new DocumentAiService()
