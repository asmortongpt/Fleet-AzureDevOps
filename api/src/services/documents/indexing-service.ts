// Smart Indexing Service - AI-Powered Document Analysis
// Extracts entities, generates summaries, and creates searchable indexes

import {
  Document,
  DocumentIndex,
  IndexingJob,
  IndexingStep,
  ExtractedEntity,
  EntityType,
  SentimentAnalysis
} from './types'
import { getAIService } from '../api-bus/ai-service'

/**
 * Smart Indexing Service for AI-powered document analysis
 */
export class IndexingService {
  private activeJobs: Map<string, IndexingJob> = new Map()

  /**
   * Index a document with full AI analysis
   */
  async indexDocument(document: Document): Promise<DocumentIndex> {
    const jobId = this.createIndexingJob(document.id)

    try {
      // Step 1: Extract entities
      await this.updateJobStep(jobId, 'Extract Entities', 'processing')
      const entities = await this.extractEntities(document.extractedText || '')
      await this.updateJobStep(jobId, 'Extract Entities', 'completed')

      // Step 2: Generate AI summary
      await this.updateJobStep(jobId, 'Generate Summary', 'processing')
      const summary = await this.generateSummary(document.extractedText || '')
      await this.updateJobStep(jobId, 'Generate Summary', 'completed')

      // Step 3: Analyze sentiment
      await this.updateJobStep(jobId, 'Analyze Sentiment', 'processing')
      const sentiment = await this.analyzeSentiment(document.extractedText || '')
      await this.updateJobStep(jobId, 'Analyze Sentiment', 'completed')

      // Step 4: Extract topics
      await this.updateJobStep(jobId, 'Extract Topics', 'processing')
      const topics = await this.extractTopics(document.extractedText || '')
      await this.updateJobStep(jobId, 'Extract Topics', 'completed')

      // Step 5: Create full-text index
      await this.updateJobStep(jobId, 'Create Index', 'processing')
      const fullTextIndex = this.createFullTextIndex(document)
      await this.updateJobStep(jobId, 'Create Index', 'completed')

      // Step 6: Generate semantic vector (for semantic search)
      await this.updateJobStep(jobId, 'Generate Vector', 'processing')
      const semanticVector = await this.generateSemanticVector(
        document.extractedText || ''
      )
      await this.updateJobStep(jobId, 'Generate Vector', 'completed')

      // Complete the job
      const job = this.activeJobs.get(jobId)!
      job.status = 'completed'
      job.completedAt = new Date().toISOString()

      // Create document index
      const index: DocumentIndex = {
        documentId: document.id,
        fullTextIndex,
        metadataIndex: this.createMetadataIndex(document),
        entityIndex: entities,
        semanticVector,
        topics,
        sentiment,
        lastIndexedAt: new Date().toISOString()
      }

      return index

    } catch (error) {
      // Mark job as failed
      const job = this.activeJobs.get(jobId)
      if (job) {
        job.status = 'failed'
        job.error = (error as Error).message
      }

      throw error
    }
  }

  /**
   * Extract named entities from text using AI
   */
  async extractEntities(text: string): Promise<ExtractedEntity[]> {
    if (!text || text.trim().length === 0) {
      return []
    }

    try {
      const aiService = getAIService()

      const prompt = `Extract structured entities from this text. Return JSON array with format:
[{"type": "person|organization|location|date|time|money|phone|email|url|vin|license-plate|driver-license|invoice-number|contract-number|policy-number", "value": "extracted value", "confidence": 0.0-1.0, "context": "surrounding text"}]

Text: ${text.substring(0, 4000)}`

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 2000
      })

      // Parse JSON response
      const content = response.choices[0]?.message?.content || '[]'
      let entities: ExtractedEntity[] = []

      try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          entities = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error('[Indexing] Failed to parse entities:', parseError)
      }

      // Enrich with fleet-specific entity detection
      entities.push(...this.detectFleetEntities(text))

      return entities

    } catch (error) {
      console.error('[Indexing] Error extracting entities:', error)
      return []
    }
  }

  /**
   * Detect fleet-specific entities using regex patterns
   */
  private detectFleetEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []

    // VIN pattern (17 characters)
    const vinPattern = /\b[A-HJ-NPR-Z0-9]{17}\b/gi
    let match
    while ((match = vinPattern.exec(text)) !== null) {
      entities.push({
        type: 'vin',
        value: match[0],
        confidence: 0.95,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      })
    }

    // License plate pattern
    const platePattern = /\b[A-Z]{1,3}[-\s]?\d{1,4}[-\s]?[A-Z]?\b/gi
    while ((match = platePattern.exec(text)) !== null) {
      entities.push({
        type: 'license-plate',
        value: match[0],
        confidence: 0.85,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      })
    }

    // Driver license pattern
    const dlPattern = /\b[A-Z]{1,2}\d{6,8}\b/gi
    while ((match = dlPattern.exec(text)) !== null) {
      entities.push({
        type: 'driver-license',
        value: match[0],
        confidence: 0.80,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      })
    }

    // Invoice number pattern
    const invoicePattern = /\b(?:INV|INVOICE)[-#]?\s*\d{4,10}\b/gi
    while ((match = invoicePattern.exec(text)) !== null) {
      entities.push({
        type: 'invoice-number',
        value: match[0],
        confidence: 0.90,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      })
    }

    return entities
  }

  /**
   * Generate AI-powered document summary
   */
  async generateSummary(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return ''
    }

    try {
      const aiService = getAIService()

      const prompt = `Summarize this document in 2-3 concise sentences, focusing on key information relevant to fleet management:

${text.substring(0, 8000)}`

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 200
      })

      return response.choices[0]?.message?.content || ''

    } catch (error) {
      console.error('[Indexing] Error generating summary:', error)
      return ''
    }
  }

  /**
   * Analyze document sentiment
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      }
    }

    try {
      const aiService = getAIService()

      const prompt = `Analyze the sentiment of this text. Return JSON format:
{"score": -1 to 1, "magnitude": 0 to 10, "label": "positive|neutral|negative", "confidence": 0.0-1.0}

Text: ${text.substring(0, 4000)}`

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.1,
        maxTokens: 100
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      }

    } catch (error) {
      console.error('[Indexing] Error analyzing sentiment:', error)
      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      }
    }
  }

  /**
   * Extract main topics from document
   */
  async extractTopics(text: string): Promise<string[]> {
    if (!text || text.trim().length === 0) {
      return []
    }

    try {
      const aiService = getAIService()

      const prompt = `Extract 3-5 main topics/themes from this text. Return as JSON array of strings.

Text: ${text.substring(0, 6000)}`

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 150
      })

      const content = response.choices[0]?.message?.content || '[]'
      const jsonMatch = content.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return []

    } catch (error) {
      console.error('[Indexing] Error extracting topics:', error)
      return []
    }
  }

  /**
   * Create full-text search index
   */
  private createFullTextIndex(document: Document): string {
    const parts: string[] = [
      document.title,
      document.description || '',
      document.filename,
      document.originalFilename,
      document.category,
      document.subcategory || '',
      ...document.tags,
      document.extractedText || '',
      document.aiGeneratedSummary || '',
      document.metadata?.author || '',
      document.metadata?.subject || '',
      ...(document.metadata?.keywords || [])
    ]

    // Combine and normalize
    return parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Create metadata index for structured search
   */
  private createMetadataIndex(document: Document): Record<string, any> {
    return {
      title: document.title,
      category: document.category,
      subcategory: document.subcategory,
      documentType: document.documentType,
      tags: document.tags,
      ownerId: document.ownerId,
      ownerName: document.ownerName,
      status: document.status,
      accessLevel: document.accessLevel,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      ...document.metadata
    }
  }

  /**
   * Generate semantic vector for similarity search
   */
  async generateSemanticVector(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return []
    }

    try {
      // Using OpenAI embeddings API
      // This would create a 1536-dimensional vector
      // For now, return empty array as placeholder
      // TODO: Implement actual embeddings generation

      return []

    } catch (error) {
      console.error('[Indexing] Error generating semantic vector:', error)
      return []
    }
  }

  /**
   * Create a new indexing job
   */
  private createIndexingJob(documentId: string): string {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const job: IndexingJob = {
      id: jobId,
      documentId,
      status: 'processing',
      startedAt: new Date().toISOString(),
      steps: [
        {
          name: 'Extract Entities',
          status: 'pending',
          progress: 0
        },
        {
          name: 'Generate Summary',
          status: 'pending',
          progress: 0
        },
        {
          name: 'Analyze Sentiment',
          status: 'pending',
          progress: 0
        },
        {
          name: 'Extract Topics',
          status: 'pending',
          progress: 0
        },
        {
          name: 'Create Index',
          status: 'pending',
          progress: 0
        },
        {
          name: 'Generate Vector',
          status: 'pending',
          progress: 0
        }
      ]
    }

    this.activeJobs.set(jobId, job)
    return jobId
  }

  /**
   * Update indexing job step status
   */
  private async updateJobStep(
    jobId: string,
    stepName: string,
    status: 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    const job = this.activeJobs.get(jobId)
    if (!job) return

    const step = job.steps.find(s => s.name === stepName)
    if (!step) return

    step.status = status

    if (status === 'processing') {
      step.startedAt = new Date().toISOString()
      step.progress = 0
    } else if (status === 'completed') {
      step.completedAt = new Date().toISOString()
      step.progress = 100
    }
  }

  /**
   * Get indexing job status
   */
  getJobStatus(jobId: string): IndexingJob | undefined {
    return this.activeJobs.get(jobId)
  }

  /**
   * Re-index all documents (bulk operation)
   */
  async reindexAllDocuments(documents: Document[]): Promise<void> {
    console.log(`[Indexing] Re-indexing ${documents.length} documents...`)

    const batchSize = 10
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)

      await Promise.all(
        batch.map(doc => this.indexDocument(doc).catch(err => {
          console.error(`[Indexing] Failed to index document ${doc.id}:`, err)
        }))
      )

      console.log(`[Indexing] Processed ${Math.min(i + batchSize, documents.length)} / ${documents.length}`)
    }

    console.log('[Indexing] Re-indexing complete')
  }
}

// Singleton instance
let indexingServiceInstance: IndexingService | null = null

export function getIndexingService(): IndexingService {
  if (!indexingServiceInstance) {
    indexingServiceInstance = new IndexingService()
  }
  return indexingServiceInstance
}
