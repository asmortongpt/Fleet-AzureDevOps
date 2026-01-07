// Document Management Service
// Complete document lifecycle management with storage, versioning, search, and workflow

import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

import { getIndexingService } from './indexing-service'
import { getOCRService } from './ocr-service'
import {
  Document,
  DocumentSearchQuery,
  DocumentSearchResult,
  DocumentAnalytics,
  BulkOperationRequest,
  BulkOperationResult,
  DocumentCategory,
  DocumentVersion,
  AccessLevel
} from './types'

/**
 * Document Management Service
 * Handles document storage, retrieval, search, and lifecycle management
 */
export class DocumentService {
  private documents: Map<string, Document> = new Map()
  private documentVersions: Map<string, DocumentVersion[]> = new Map()
  private storageBasePath: string = '/tmp/fleet-documents'

  constructor() {
    this.initializeStorage()
    this.loadDocuments()
  }

  /**
   * Initialize document storage directories
   */
  private initializeStorage(): void {
    if (!fs.existsSync(this.storageBasePath)) {
      fs.mkdirSync(this.storageBasePath, { recursive: true })
    }

    // Create category directories
    const categories: DocumentCategory[] = [
      'vehicle-documents',
      'driver-documents',
      'maintenance-records',
      'compliance-documents',
      'financial-documents',
      'contracts',
      'policies',
      'reports',
      'invoices',
      'insurance',
      'permits-licenses',
      'inspection-reports',
      'incident-reports',
      'training-materials',
      'general'
    ]

    categories.forEach(category => {
      const categoryPath = path.join(this.storageBasePath, category)
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true })
      }
    })
  }

  /**
   * Load documents from storage (placeholder - would load from database)
   */
  private loadDocuments(): void {
    // TODO: Load from PostgreSQL database
    console.log('[DocumentService] Initialized (in-memory mode)')
  }

  /**
   * Upload and process a new document
   */
  async uploadDocument(
    file: {
      buffer: Buffer
      originalname: string
      mimetype: string
      size: number
    },
    metadata: {
      title: string
      description?: string
      category: DocumentCategory
      subcategory?: string
      tags?: string[]
      ownerId: string
      ownerName: string
      accessLevel?: AccessLevel
    }
  ): Promise<Document> {
    try {
      // Generate unique document ID
      const documentId = this.generateDocumentId()

      // Determine document type
      const documentType = this.getDocumentType(file.mimetype)

      // Generate filename
      const filename = this.generateFilename(documentId, file.originalname)

      // Determine storage path
      const storagePath = path.join(
        this.storageBasePath,
        metadata.category,
        filename
      )

      // Save file to storage
      fs.writeFileSync(storagePath, file.buffer)

      // Extract text content
      let extractedText = ''
      if (this.isImageFile(file.mimetype)) {
        // Use OCR for images
        const ocrService = getOCRService()
        const ocrResult = await ocrService.extractTextFromImage(storagePath)
        extractedText = ocrResult.text
      } else if (file.mimetype === 'application/pdf') {
        // Extract text from PDF (placeholder)
        extractedText = await this.extractTextFromPDF(storagePath)
      } else if (file.mimetype.startsWith('text/')) {
        // Read text files directly
        extractedText = file.buffer.toString('utf-8')
      }

      // Create document object
      const document: Document = {
        id: documentId,
        title: metadata.title,
        description: metadata.description,
        filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageUrl: storagePath,

        category: metadata.category,
        subcategory: metadata.subcategory,
        documentType,
        tags: metadata.tags || [],

        extractedText,
        pageCount: this.estimatePageCount(extractedText),
        wordCount: this.countWords(extractedText),

        metadata: {},
        searchableContent: '',

        version: 1,
        isLatestVersion: true,

        ownerId: metadata.ownerId,
        ownerName: metadata.ownerName,
        accessLevel: metadata.accessLevel || 'internal',

        status: 'draft',
        accessCount: 0,
        downloadCount: 0,

        createdAt: new Date().toISOString(),
        createdBy: metadata.ownerId,
        updatedAt: new Date().toISOString(),
        updatedBy: metadata.ownerId
      }

      // Index document with AI
      const indexingService = getIndexingService()
      const index = await indexingService.indexDocument(document)

      // Update document with AI-generated data
      document.aiGeneratedSummary = await indexingService.generateSummary(extractedText)
      document.aiExtractedEntities = index.entityIndex
      document.searchableContent = index.fullTextIndex

      // Store document
      this.documents.set(documentId, document)

      console.log(`[DocumentService] Document uploaded: ${documentId}`)

      return document

    } catch (error) {
      console.error('[DocumentService] Upload failed:', error)
      throw new Error(`Document upload failed: ${error}`)
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    const document = this.documents.get(documentId)

    if (document) {
      // Update access tracking
      document.lastAccessedAt = new Date().toISOString()
      document.accessCount++
    }

    return document || null
  }

  /**
   * Search documents
   */
  async searchDocuments(query: DocumentSearchQuery): Promise<DocumentSearchResult> {
    let results = Array.from(this.documents.values())

    // Apply filters
    if (query.filters) {
      results = this.applyFilters(results, query.filters)
    }

    // Apply text search
    if (query.query) {
      results = this.applyTextSearch(results, query.query)
    }

    // Apply sorting
    if (query.sort) {
      results = this.applySorting(results, query.sort)
    }

    // Calculate total before pagination
    const total = results.length

    // Apply pagination
    const page = query.pagination?.page || 1
    const limit = query.pagination?.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    results = results.slice(startIndex, endIndex)

    // Generate facets
    const facets = this.generateFacets(Array.from(this.documents.values()))

    return {
      documents: results,
      total,
      page,
      limit,
      facets
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: string,
    updates: Partial<Document>,
    userId: string
  ): Promise<Document | null> {
    const document = this.documents.get(documentId)
    if (!document) return null

    // Create new version if content changed
    if (updates.storageUrl && updates.storageUrl !== document.storageUrl) {
      await this.createVersion(document)
    }

    // Apply updates
    Object.assign(document, updates, {
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    })

    // Re-index if content changed
    if (updates.extractedText) {
      const indexingService = getIndexingService()
      await indexingService.indexDocument(document)
    }

    return document
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const document = this.documents.get(documentId)
    if (!document) return false

    try {
      // Delete file from storage
      if (fs.existsSync(document.storageUrl)) {
        fs.unlinkSync(document.storageUrl)
      }

      // Delete thumbnail if exists
      if (document.thumbnailUrl && fs.existsSync(document.thumbnailUrl)) {
        fs.unlinkSync(document.thumbnailUrl)
      }

      // Remove from map
      this.documents.delete(documentId)

      console.log(`[DocumentService] Document deleted: ${documentId}`)
      return true

    } catch (error) {
      console.error('[DocumentService] Delete failed:', error)
      return false
    }
  }

  /**
   * Create a new version of a document
   */
  private async createVersion(document: Document): Promise<void> {
    const version: DocumentVersion = {
      versionNumber: document.version,
      documentId: document.id,
      storageUrl: document.storageUrl,
      createdAt: document.updatedAt,
      createdBy: document.updatedBy,
      fileSize: document.fileSize
    }

    // Get or create version history
    const versions = this.documentVersions.get(document.id) || []
    versions.push(version)
    this.documentVersions.set(document.id, versions)

    // Increment version number
    document.version++
  }

  /**
   * Get document version history
   */
  async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    return this.documentVersions.get(documentId) || []
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<Buffer | null> {
    const document = this.documents.get(documentId)
    if (!document) return null

    try {
      const buffer = fs.readFileSync(document.storageUrl)

      // Update download count
      document.downloadCount++

      return buffer

    } catch (error) {
      console.error('[DocumentService] Download failed:', error)
      return null
    }
  }

  /**
   * Get document analytics
   */
  async getAnalytics(): Promise<DocumentAnalytics> {
    const documents = Array.from(this.documents.values())

    // Calculate metrics
    const totalDocuments = documents.length
    const totalStorage = documents.reduce((sum, doc) => sum + doc.fileSize, 0)

    const documentsByCategory = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1
      return acc
    }, {} as Record<DocumentCategory, number>)

    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1
      return acc
    }, {} as any)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentUploads = documents.filter(
      doc => new Date(doc.createdAt) > sevenDaysAgo
    ).length

    const mostAccessed = documents
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)

    const mostDownloaded = documents
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 10)

    const averageFileSize = totalStorage / totalDocuments || 0

    const pendingApprovals = documents.filter(
      doc => doc.status === 'pending-review' || doc.status === 'under-review'
    ).length

    const now = new Date()
    const expiringDocuments = documents.filter(
      doc => doc.expiresAt && new Date(doc.expiresAt) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    )

    return {
      totalDocuments,
      totalStorage,
      documentsByCategory,
      documentsByType,
      recentUploads,
      mostAccessed,
      mostDownloaded,
      averageFileSize,
      storageGrowthRate: 0, // Would calculate from historical data
      pendingApprovals,
      expiringDocuments
    }
  }

  /**
   * Bulk operations
   */
  async bulkOperation(request: BulkOperationRequest): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      totalProcessed: request.documentIds.length,
      successCount: 0,
      failureCount: 0,
      errors: []
    }

    for (const documentId of request.documentIds) {
      try {
        switch (request.operation) {
          case 'delete':
            await this.deleteDocument(documentId)
            break

          case 'archive':
            await this.updateDocument(documentId, { status: 'archived' }, 'system')
            break

          case 'update-category':
            await this.updateDocument(
              documentId,
              { category: request.parameters?.category },
              'system'
            )
            break

          case 'update-tags':
            await this.updateDocument(
              documentId,
              { tags: request.parameters?.tags },
              'system'
            )
            break

          case 'update-access-level':
            await this.updateDocument(
              documentId,
              { accessLevel: request.parameters?.accessLevel },
              'system'
            )
            break

          case 'reindex':
            const doc = await this.getDocument(documentId)
            if (doc) {
              const indexingService = getIndexingService()
              await indexingService.indexDocument(doc)
            }
            break
        }

        result.successCount++

      } catch (error) {
        result.failureCount++
        result.errors.push({
          documentId,
          error: (error as Error).message
        })
      }
    }

    result.success = result.failureCount === 0

    return result
  }

  // ==================== Helper Methods ====================

  private generateDocumentId(): string {
    return `doc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
  }

  private generateFilename(documentId: string, originalFilename: string): string {
    const ext = path.extname(originalFilename)
    return `${documentId}${ext}`
  }

  private getDocumentType(mimeType: string): any {
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.includes('word')) return 'word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('text/')) return 'text'
    if (mimeType.includes('presentation')) return 'presentation'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
    return 'other'
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    // TODO: Implement PDF text extraction using pdf-parse or similar
    return ''
  }

  private estimatePageCount(text: string): number {
    // Estimate ~500 words per page
    const wordCount = this.countWords(text)
    return Math.ceil(wordCount / 500)
  }

  private countWords(text: string): number {
    if (!text) return 0
    return text.trim().split(/\s+/).length
  }

  private applyFilters(documents: Document[], filters: any): Document[] {
    let results = documents

    if (filters.category?.length > 0) {
      results = results.filter(doc => filters.category.includes(doc.category))
    }

    if (filters.documentType?.length > 0) {
      results = results.filter(doc => filters.documentType.includes(doc.documentType))
    }

    if (filters.tags?.length > 0) {
      results = results.filter(doc =>
        filters.tags.some((tag: string) => doc.tags.includes(tag))
      )
    }

    if (filters.status?.length > 0) {
      results = results.filter(doc => filters.status.includes(doc.status))
    }

    if (filters.ownerId?.length > 0) {
      results = results.filter(doc => filters.ownerId.includes(doc.ownerId))
    }

    if (filters.dateRange) {
      const { field, from, to } = filters.dateRange
      results = results.filter(doc => {
        const docDate = new Date((doc as any)[field])
        if (from && docDate < new Date(from)) return false
        if (to && docDate > new Date(to)) return false
        return true
      })
    }

    return results
  }

  private applyTextSearch(documents: Document[], query: string): Document[] {
    const searchTerms = query.toLowerCase().split(/\s+/)

    return documents.filter(doc => {
      const searchableContent = doc.searchableContent || ''
      return searchTerms.every(term => searchableContent.includes(term))
    })
  }

  private applySorting(documents: Document[], sort: any): Document[] {
    return documents.sort((a, b) => {
      const aValue = (a as any)[sort.field]
      const bValue = (b as any)[sort.field]

      if (sort.order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  private generateFacets(documents: Document[]): any {
    const categories = new Map<string, number>()
    const documentTypes = new Map<string, number>()
    const tags = new Map<string, number>()
    const owners = new Map<string, number>()
    const statuses = new Map<string, number>()

    documents.forEach(doc => {
      categories.set(doc.category, (categories.get(doc.category) || 0) + 1)
      documentTypes.set(doc.documentType, (documentTypes.get(doc.documentType) || 0) + 1)
      owners.set(doc.ownerName, (owners.get(doc.ownerName) || 0) + 1)
      statuses.set(doc.status, (statuses.get(doc.status) || 0) + 1)

      doc.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1)
      })
    })

    return {
      categories: Array.from(categories.entries()).map(([value, count]) => ({ value, count })),
      documentTypes: Array.from(documentTypes.entries()).map(([value, count]) => ({ value, count })),
      tags: Array.from(tags.entries()).map(([value, count]) => ({ value, count })),
      owners: Array.from(owners.entries()).map(([value, count]) => ({ value, count })),
      statuses: Array.from(statuses.entries()).map(([value, count]) => ({ value, count }))
    }
  }
}

// Singleton instance
let documentServiceInstance: DocumentService | null = null

export function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService()
  }
  return documentServiceInstance
}
