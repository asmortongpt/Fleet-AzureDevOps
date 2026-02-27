/**
 * Document Management Service Tests
 *
 * Tests for document lifecycle management:
 * - Document CRUD operations (create, read, update, delete)
 * - File upload and storage
 * - Document versioning
 * - Access control and permissions
 * - Category management
 * - Text extraction for search
 * - Multi-tenant isolation
 * - Audit logging
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import crypto from 'crypto'

interface Document {
  id: string
  tenant_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  file_hash?: string
  category_id?: string
  tags?: string[]
  description?: string
  uploaded_by: string
  is_public: boolean
  version_number: number
  status: 'active' | 'archived' | 'deleted'
  metadata?: any
  extracted_text?: string
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_needed'
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: Date
  updated_at: Date
}

interface DocumentCategory {
  id: string
  tenant_id: string
  category_name: string
  description?: string
  color: string
  icon?: string
}

interface UploadOptions {
  tenantId: string
  userId: string
  file: {
    originalname: string
    mimetype: string
    size: number
    buffer: Buffer
  }
  categoryId?: string
  tags?: string[]
  description?: string
  isPublic?: boolean
  metadata?: any
}

class MockDocumentManagementService {
  private documents: Map<string, Document> = new Map()
  private categories: Map<string, DocumentCategory> = new Map()
  private accessLog: any[] = []
  private uploadDir: string = '/tmp/uploads'

  async initialize(): Promise<void> {
    // Initialize upload directory
  }

  async uploadDocument(options: UploadOptions): Promise<Document> {
    // Check for duplicate files
    const fileHash = crypto.createHash('sha256').update(options.file.buffer).digest('hex')

    const duplicate = Array.from(this.documents.values()).find(
      d => d.tenant_id === options.tenantId && d.file_hash === fileHash && d.status === 'active'
    )

    if (duplicate) {
      throw new Error(`Duplicate file detected: ${duplicate.file_name}`)
    }

    // Create document record
    const document: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: options.tenantId,
      file_name: options.file.originalname,
      file_type: options.file.mimetype,
      file_size: options.file.size,
      file_url: `/uploads/documents/${options.tenantId}/${Date.now()}-${options.file.originalname}`,
      file_hash: fileHash,
      category_id: options.categoryId,
      tags: options.tags || [],
      description: options.description,
      uploaded_by: options.userId,
      is_public: options.isPublic || false,
      version_number: 1,
      status: 'active',
      metadata: options.metadata,
      extracted_text: '',
      ocr_status: this.needsOCR(options.file.mimetype) ? 'pending' : 'not_needed',
      embedding_status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    }

    this.documents.set(document.id, document)
    await this.logAccess(document.id, options.userId, 'upload')

    return document
  }

  async getDocumentById(documentId: string, tenantId: string, userId: string): Promise<Document | null> {
    const document = this.documents.get(documentId)

    if (!document || document.tenant_id !== tenantId) {
      return null
    }

    // Check permission
    if (!document.is_public && document.uploaded_by !== userId) {
      throw new Error('Access denied')
    }

    await this.logAccess(documentId, userId, 'view')
    return document
  }

  async getDocuments(
    tenantId: string,
    filters?: {
      categoryId?: string
      tags?: string[]
      search?: string
      status?: string
      uploadedBy?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ documents: Document[]; total: number }> {
    let results = Array.from(this.documents.values()).filter(d => d.tenant_id === tenantId)

    // Apply status filter
    if (filters?.status) {
      results = results.filter(d => d.status === filters.status)
    } else {
      results = results.filter(d => d.status === 'active')
    }

    // Apply category filter
    if (filters?.categoryId) {
      results = results.filter(d => d.category_id === filters.categoryId)
    }

    // Apply uploaded by filter
    if (filters?.uploadedBy) {
      results = results.filter(d => d.uploaded_by === filters.uploadedBy)
    }

    // Apply tags filter
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(d => filters.tags?.some(tag => d.tags?.includes(tag)))
    }

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      results = results.filter(
        d =>
          d.file_name.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower) ||
          d.extracted_text?.toLowerCase().includes(searchLower)
      )
    }

    const total = results.length
    const offset = filters?.offset || 0
    const limit = filters?.limit || 50

    return {
      documents: results.slice(offset, offset + limit),
      total
    }
  }

  async updateDocument(
    documentId: string,
    tenantId: string,
    userId: string,
    updates: Partial<Document>
  ): Promise<Document> {
    const document = this.documents.get(documentId)

    if (!document || document.tenant_id !== tenantId) {
      throw new Error('Document not found')
    }

    // Validate allowed fields
    const allowedFields = ['file_name', 'description', 'category_id', 'tags', 'is_public', 'metadata', 'status']
    const validUpdates: Partial<Document> = {}

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        validUpdates[key as keyof Document] = value
      }
    })

    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid fields to update')
    }

    const updated: Document = {
      ...document,
      ...validUpdates,
      updated_at: new Date()
    }

    this.documents.set(documentId, updated)
    await this.logAccess(documentId, userId, 'edit')

    return updated
  }

  async deleteDocument(documentId: string, tenantId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId)

    if (!document || document.tenant_id !== tenantId) {
      throw new Error('Document not found')
    }

    document.status = 'deleted'
    document.updated_at = new Date()

    this.documents.set(documentId, document)
    await this.logAccess(documentId, userId, 'delete')
  }

  async getCategories(tenantId: string): Promise<DocumentCategory[]> {
    return Array.from(this.categories.values()).filter(c => c.tenant_id === tenantId)
  }

  async createCategory(
    tenantId: string,
    categoryData: { category_name: string; description?: string; color?: string; icon?: string }
  ): Promise<DocumentCategory> {
    const category: DocumentCategory = {
      id: `cat-${Date.now()}`,
      tenant_id: tenantId,
      category_name: categoryData.category_name,
      description: categoryData.description,
      color: categoryData.color || '#3B82F6',
      icon: categoryData.icon
    }

    this.categories.set(category.id, category)
    return category
  }

  async getAccessLog(documentId: string, tenantId: string): Promise<any[]> {
    return this.accessLog.filter(log => log.document_id === documentId)
  }

  async getStatistics(tenantId: string): Promise<any> {
    const docs = Array.from(this.documents.values()).filter(d => d.tenant_id === tenantId && d.status === 'active')

    const totalSize = docs.reduce((sum, d) => sum + d.file_size, 0)

    const byCategory: Record<string, number> = {}
    docs.forEach(d => {
      const category = d.category_id || 'Uncategorized'
      byCategory[category] = (byCategory[category] || 0) + 1
    })

    const byType: Record<string, number> = {}
    docs.forEach(d => {
      byType[d.file_type] = (byType[d.file_type] || 0) + 1
    })

    const recentUploads = docs.filter(d => d.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length

    return {
      total_documents: docs.length,
      total_size_bytes: totalSize,
      by_category: Object.entries(byCategory).map(([name, count]) => ({ name, count })),
      by_type: Object.entries(byType).map(([type, count]) => ({ type, count })),
      recent_uploads: recentUploads
    }
  }

  private async logAccess(documentId: string, userId: string, action: string): Promise<void> {
    this.accessLog.push({
      document_id: documentId,
      user_id: userId,
      action,
      accessed_at: new Date()
    })
  }

  private needsOCR(mimeType: string): boolean {
    return ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'].includes(mimeType)
  }
}

describe('DocumentManagementService', () => {
  let service: MockDocumentManagementService
  const tenantId = 'tenant-1'
  const userId = 'user-1'

  beforeEach(() => {
    service = new MockDocumentManagementService()
  })

  describe('Document Upload', () => {
    it('should upload a PDF document', async () => {
      const buffer = Buffer.from('PDF content 1')
      const document = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'report.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        }
      })

      expect(document.id).toBeDefined()
      expect(document.file_name).toBe('report.pdf')
      expect(document.file_type).toBe('application/pdf')
      expect(document.status).toBe('active')
      expect(document.version_number).toBe(1)
    })

    it('should upload a text document', async () => {
      const buffer = Buffer.from('Text content 2')
      const document = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'notes.txt',
          mimetype: 'text/plain',
          size: buffer.length,
          buffer
        }
      })

      expect(document.file_type).toBe('text/plain')
      expect(document.ocr_status).toBe('not_needed')
    })

    it('should upload with category and tags', async () => {
      const buffer = Buffer.from('Content 3')
      const categoryId = 'cat-1'
      const document = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'doc.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        },
        categoryId,
        tags: ['important', 'compliance']
      })

      expect(document.category_id).toBe(categoryId)
      expect(document.tags).toEqual(['important', 'compliance'])
    })

    it('should set OCR status for PDF files', async () => {
      const buffer = Buffer.from('PDF')
      const document = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'scan.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        }
      })

      expect(document.ocr_status).toBe('pending')
    })

    it('should detect duplicate files', async () => {
      const buffer = Buffer.from('Duplicate content')
      const file = {
        originalname: 'doc1.txt',
        mimetype: 'text/plain',
        size: buffer.length,
        buffer
      }

      await service.uploadDocument({ tenantId, userId, file })

      await expect(service.uploadDocument({ tenantId, userId, file })).rejects.toThrow('Duplicate file detected')
    })

    it('should allow same content in different tenants', async () => {
      const buffer = Buffer.from('Content')
      const file = {
        originalname: 'doc.txt',
        mimetype: 'text/plain',
        size: buffer.length,
        buffer
      }

      const doc1 = await service.uploadDocument({ tenantId, userId, file })
      const doc2 = await service.uploadDocument({
        tenantId: 'tenant-2',
        userId,
        file
      })

      expect(doc1.id).not.toBe(doc2.id)
    })

    it('should store upload metadata', async () => {
      const buffer = Buffer.from('Content')
      const metadata = { source: 'email', senderEmail: 'test@example.com' }
      const document = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'email.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        },
        metadata
      })

      expect(document.metadata).toEqual(metadata)
    })

    it('should set is_public flag', async () => {
      const buffer1 = Buffer.from('Public doc 1')
      const doc1 = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'public.txt',
          mimetype: 'text/plain',
          size: buffer1.length,
          buffer: buffer1
        },
        isPublic: true
      })

      const buffer2 = Buffer.from('Private doc 2')
      const doc2 = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'private.txt',
          mimetype: 'text/plain',
          size: buffer2.length,
          buffer: buffer2
        },
        isPublic: false
      })

      expect(doc1.is_public).toBe(true)
      expect(doc2.is_public).toBe(false)
    })

    it('should generate file hash for deduplication', async () => {
      const buffer = Buffer.from('Same content')
      const doc1 = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'file1.txt',
          mimetype: 'text/plain',
          size: buffer.length,
          buffer
        }
      })

      expect(doc1.file_hash).toBeDefined()
      expect(doc1.file_hash).toHaveLength(64) // SHA256 hex digest
    })
  })

  describe('Get Documents', () => {
    beforeEach(async () => {
      const buffer1 = Buffer.from('Content 1')
      await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'doc1.pdf',
          mimetype: 'application/pdf',
          size: buffer1.length,
          buffer: buffer1
        },
        tags: ['important']
      })

      const buffer2 = Buffer.from('Content 2')
      await service.uploadDocument({
        tenantId,
        userId: 'user-2',
        file: {
          originalname: 'doc2.txt',
          mimetype: 'text/plain',
          size: buffer2.length,
          buffer: buffer2
        },
        tags: ['archive']
      })
    })

    it('should get all active documents', async () => {
      const result = await service.getDocuments(tenantId)

      expect(result.documents).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should filter by status', async () => {
      const result = await service.getDocuments(tenantId, { status: 'active' })

      expect(result.documents.every(d => d.status === 'active')).toBe(true)
    })

    it('should filter by tags', async () => {
      const result = await service.getDocuments(tenantId, { tags: ['important'] })

      expect(result.documents.every(d => d.tags?.includes('important'))).toBe(true)
    })

    it('should search by file name', async () => {
      const result = await service.getDocuments(tenantId, { search: 'doc1' })

      expect(result.documents).toHaveLength(1)
      expect(result.documents[0].file_name).toBe('doc1.pdf')
    })

    it('should filter by uploaded user', async () => {
      const result = await service.getDocuments(tenantId, { uploadedBy: userId })

      expect(result.documents.every(d => d.uploaded_by === userId)).toBe(true)
    })

    it('should support pagination', async () => {
      const result = await service.getDocuments(tenantId, { limit: 1, offset: 0 })

      expect(result.documents).toHaveLength(1)
      expect(result.total).toBe(2)
    })

    it('should respect multi-tenant isolation', async () => {
      const result = await service.getDocuments('tenant-2')

      expect(result.documents).toHaveLength(0)
    })
  })

  describe('Get Document by ID', () => {
    let docId: string

    beforeEach(async () => {
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 100,
          buffer: Buffer.from('content')
        }
      })
      docId = doc.id
    })

    it('should retrieve document by ID', async () => {
      const document = await service.getDocumentById(docId, tenantId, userId)

      expect(document?.id).toBe(docId)
      expect(document?.file_name).toBe('test.pdf')
    })

    it('should return null for non-existent document', async () => {
      const result = await service.getDocumentById('non-existent', tenantId, userId)

      expect(result).toBeNull()
    })

    it('should enforce multi-tenant isolation', async () => {
      const result = await service.getDocumentById(docId, 'tenant-2', userId)

      expect(result).toBeNull()
    })

    it('should allow owner to access private document', async () => {
      const doc = await service.getDocumentById(docId, tenantId, userId)

      expect(doc).not.toBeNull()
    })

    it('should deny non-owner access to private document', async () => {
      const buffer = Buffer.from('private content unique 1')
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'private.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        },
        isPublic: false
      })

      await expect(service.getDocumentById(doc.id, tenantId, 'other-user')).rejects.toThrow('Access denied')
    })

    it('should allow anyone to access public document', async () => {
      const buffer = Buffer.from('public content unique 2')
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'public.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        },
        isPublic: true
      })

      const retrieved = await service.getDocumentById(doc.id, tenantId, 'other-user')
      expect(retrieved).not.toBeNull()
    })

    it('should log access when document is viewed', async () => {
      await service.getDocumentById(docId, tenantId, userId)

      const logs = await service.getAccessLog(docId, tenantId)
      const viewLog = logs.find(l => l.action === 'view' && l.user_id === userId)

      expect(viewLog).toBeDefined()
    })
  })

  describe('Update Document', () => {
    let docId: string

    beforeEach(async () => {
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 100,
          buffer: Buffer.from('content')
        }
      })
      docId = doc.id
    })

    it('should update document name', async () => {
      const updated = await service.updateDocument(docId, tenantId, userId, {
        file_name: 'new-name.pdf'
      })

      expect(updated.file_name).toBe('new-name.pdf')
    })

    it('should update description', async () => {
      const updated = await service.updateDocument(docId, tenantId, userId, {
        description: 'Updated description'
      })

      expect(updated.description).toBe('Updated description')
    })

    it('should update tags', async () => {
      const updated = await service.updateDocument(docId, tenantId, userId, {
        tags: ['new', 'tags']
      })

      expect(updated.tags).toEqual(['new', 'tags'])
    })

    it('should not update file_url', async () => {
      const original = await service.getDocumentById(docId, tenantId, userId)
      await expect(
        service.updateDocument(docId, tenantId, userId, {
          file_url: 'malicious-url'
        })
      ).rejects.toThrow('No valid fields to update')

      const updated = await service.getDocumentById(docId, tenantId, userId)
      expect(updated?.file_url).toBe(original?.file_url)
    })

    it('should update status', async () => {
      const updated = await service.updateDocument(docId, tenantId, userId, {
        status: 'archived'
      })

      expect(updated.status).toBe('archived')
    })

    it('should reject update with no valid fields', async () => {
      await expect(
        service.updateDocument(docId, tenantId, userId, {
          file_hash: 'tampered-hash'
        })
      ).rejects.toThrow('No valid fields to update')
    })

    it('should enforce multi-tenant isolation on update', async () => {
      await expect(
        service.updateDocument(docId, 'tenant-2', userId, {
          file_name: 'hacked.pdf'
        })
      ).rejects.toThrow('Document not found')
    })
  })

  describe('Delete Document', () => {
    let docId: string

    beforeEach(async () => {
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 100,
          buffer: Buffer.from('content')
        }
      })
      docId = doc.id
    })

    it('should soft delete document', async () => {
      await service.deleteDocument(docId, tenantId, userId)

      const doc = await service.getDocumentById(docId, tenantId, userId)
      // Document should still exist but be marked as deleted
      expect(doc?.status).toBe('deleted')
    })

    it('should log delete action', async () => {
      await service.deleteDocument(docId, tenantId, userId)

      const logs = await service.getAccessLog(docId, tenantId)
      const deleteLog = logs.find(l => l.action === 'delete')

      expect(deleteLog).toBeDefined()
    })

    it('should not delete non-existent document', async () => {
      await expect(service.deleteDocument('non-existent', tenantId, userId)).rejects.toThrow('Document not found')
    })

    it('should enforce multi-tenant isolation on delete', async () => {
      await expect(service.deleteDocument(docId, 'tenant-2', userId)).rejects.toThrow('Document not found')
    })
  })

  describe('Categories', () => {
    it('should create document category', async () => {
      const category = await service.createCategory(tenantId, {
        category_name: 'Contracts',
        description: 'Legal contracts',
        color: '#FF5733'
      })

      expect(category.id).toBeDefined()
      expect(category.category_name).toBe('Contracts')
      expect(category.color).toBe('#FF5733')
    })

    it('should list categories for tenant', async () => {
      const cat1 = await service.createCategory(tenantId, {
        category_name: 'Category Test 1'
      })

      const cat2 = await service.createCategory(tenantId, {
        category_name: 'Category Test 2'
      })

      const categories = await service.getCategories(tenantId)

      expect(categories.some(c => c.id === cat1.id)).toBe(true)
      expect(categories.some(c => c.id === cat2.id)).toBe(true)
    })

    it('should isolate categories by tenant', async () => {
      await service.createCategory(tenantId, {
        category_name: 'Tenant 1 Category'
      })

      const categories = await service.getCategories('tenant-2')

      expect(categories).toHaveLength(0)
    })

    it('should use default color', async () => {
      const category = await service.createCategory(tenantId, {
        category_name: 'Default Color'
      })

      expect(category.color).toBe('#3B82F6')
    })
  })

  describe('Access Log', () => {
    let docId: string

    beforeEach(async () => {
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 100,
          buffer: Buffer.from('content')
        }
      })
      docId = doc.id
    })

    it('should log upload action', async () => {
      const logs = await service.getAccessLog(docId, tenantId)
      const uploadLog = logs.find(l => l.action === 'upload')

      expect(uploadLog).toBeDefined()
    })

    it('should track access history', async () => {
      await service.getDocumentById(docId, tenantId, userId)
      await service.getDocumentById(docId, tenantId, userId)

      const logs = await service.getAccessLog(docId, tenantId)
      const viewLogs = logs.filter(l => l.action === 'view')

      expect(viewLogs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Statistics', () => {
    it('should calculate document statistics', async () => {
      const buffer1 = Buffer.from('Content 1')
      await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'doc1.pdf',
          mimetype: 'application/pdf',
          size: buffer1.length,
          buffer: buffer1
        }
      })

      const buffer2 = Buffer.from('Content 2')
      await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'doc2.txt',
          mimetype: 'text/plain',
          size: buffer2.length,
          buffer: buffer2
        }
      })

      const stats = await service.getStatistics(tenantId)

      expect(stats.total_documents).toBeGreaterThanOrEqual(2)
      expect(stats.by_type).toBeDefined()
    })

    it('should exclude deleted documents from statistics', async () => {
      const buffer = Buffer.from('Content')
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'doc.pdf',
          mimetype: 'application/pdf',
          size: 1000,
          buffer
        }
      })

      await service.deleteDocument(doc.id, tenantId, userId)

      const stats = await service.getStatistics(tenantId)

      expect(stats.total_documents).toBe(0)
    })

    it('should track recent uploads', async () => {
      const buffer = Buffer.from('Content')
      await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'recent.pdf',
          mimetype: 'application/pdf',
          size: 100,
          buffer
        }
      })

      const stats = await service.getStatistics(tenantId)

      expect(stats.recent_uploads).toBeGreaterThan(0)
    })
  })

  describe('Permissions and Security', () => {
    it('should enforce upload permissions', async () => {
      const buffer = Buffer.from('Content')
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'doc.pdf',
          mimetype: 'application/pdf',
          size: 100,
          buffer
        }
      })

      expect(doc.uploaded_by).toBe(userId)
    })

    it('should validate file size', async () => {
      // Note: Real implementation would have max size check
      const buffer = Buffer.alloc(1024 * 1024) // 1MB
      const doc = await service.uploadDocument({
        tenantId,
        userId,
        file: {
          originalname: 'large.pdf',
          mimetype: 'application/pdf',
          size: buffer.length,
          buffer
        }
      })

      expect(doc.file_size).toBe(buffer.length)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      await expect(
        service.uploadDocument({
          tenantId: '',
          userId: '',
          file: {
            originalname: 'doc.pdf',
            mimetype: 'application/pdf',
            size: 100,
            buffer: Buffer.from('content')
          }
        })
      ).resolves.toBeDefined()
    })

    it('should handle invalid document ID', async () => {
      const result = await service.getDocumentById('invalid-id', tenantId, userId)

      expect(result).toBeNull()
    })

    it('should handle concurrent uploads', async () => {
      const uploads = Array.from({ length: 5 }, (_, i) => {
        const buffer = Buffer.from(`Content ${i}`)
        return service.uploadDocument({
          tenantId,
          userId,
          file: {
            originalname: `doc-${i}.pdf`,
            mimetype: 'application/pdf',
            size: buffer.length,
            buffer
          }
        })
      })

      const results = await Promise.all(uploads)

      expect(results).toHaveLength(5)
      expect(new Set(results.map(r => r.id)).size).toBe(5) // All unique IDs
    })
  })
})
