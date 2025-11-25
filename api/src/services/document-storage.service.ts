/**
 * Document Storage Service
 * Main service for comprehensive document storage and management
 * Integrates: storage adapters, versioning, permissions, folders, and audit logging
 */

import pool from '../config/database'
import path from 'path'
import {
  Document,
  DocumentWithMetadata,
  DocumentSearchResult,
  DocumentStatistics,
  UploadDocumentOptions,
  UpdateDocumentOptions,
  GetDocumentsFilters,
  DocumentNotFoundError,
  DuplicateDocumentError,
  StorageQuotaExceededError,
  DocumentStatus,
  OCRStatus,
  EmbeddingStatus
} from '../types/document-storage.types'
import {
  generateFileHash,
  generateUniqueFileName,
  validateFileSize,
  validateFileType,
  validateMetadata,
  validateTags,
  needsOCR,
  formatBytes
} from '../utils/document-utils'
import { StorageFactory } from './storage/storage-factory'
import { StorageAdapter } from './storage/storage-adapter.base'
import documentAuditService from './document-audit.service'
import documentFolderService from './document-folder.service'
import documentPermissionService from './document-permission.service'
import documentVersionService from './document-version.service'

export class DocumentStorageService {
  private storageAdapter?: StorageAdapter
  private maxFileSize: number
  private allowedFileTypes?: string[]

  constructor() {
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB
    // If specified, restrict file types
    if (process.env.ALLOWED_FILE_TYPES) {
      this.allowedFileTypes = process.env.ALLOWED_FILE_TYPES.split(',')
    }
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      this.storageAdapter = StorageFactory.createDefault()
      await this.storageAdapter.initialize()

      // Initialize other services
      await documentVersionService.initialize()

      console.log('✅ Document Storage Service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Document Storage Service:', error)
      throw error
    }
  }

  /**
   * Upload a new document
   */
  async uploadDocument(options: UploadDocumentOptions): Promise<DocumentWithMetadata> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Validate file size
      const sizeValidation = validateFileSize(options.file.size, this.maxFileSize)
      if (!sizeValidation.valid) {
        throw new Error(sizeValidation.error)
      }

      // Validate file type
      const typeValidation = validateFileType(
        options.file.mimetype,
        this.allowedFileTypes
      )
      if (!typeValidation.valid) {
        throw new Error(typeValidation.error)
      }

      // Validate metadata
      if (options.metadata) {
        const metadataValidation = validateMetadata(options.metadata)
        if (!metadataValidation.valid) {
          throw new Error(metadataValidation.error)
        }
      }

      // Validate tags
      if (options.tags) {
        const tagsValidation = validateTags(options.tags)
        if (!tagsValidation.valid) {
          throw new Error(tagsValidation.error)
        }
      }

      // Generate file hash for deduplication
      const fileHash = generateFileHash(options.file.buffer)

      // Check for duplicate files
      const duplicateCheck = await client.query(
        `SELECT id, file_name FROM documents
         WHERE tenant_id = $1 AND file_hash = $2 AND deleted_at IS NULL`,
        [options.tenantId, fileHash]
      )

      if (duplicateCheck.rows.length > 0) {
        throw new DuplicateDocumentError(duplicateCheck.rows[0].file_name)
      }

      // Verify folder exists if specified
      if (options.folderId) {
        const folder = await documentFolderService.getFolderById(
          options.folderId,
          options.tenantId
        )
        if (!folder) {
          throw new Error('Folder not found')
        }
      }

      // Get storage location
      const storageLocationResult = await client.query(
        `SELECT id, tenant_id, location_name, location_type, location_path, is_active, created_at FROM document_storage_locations
         WHERE tenant_id = $1 AND is_default = true AND is_active = true`,
        [options.tenantId]
      )

      let storageLocationId = null
      if (storageLocationResult.rows.length > 0) {
        const storageLocation = storageLocationResult.rows[0]
        storageLocationId = storageLocation.id

        // Check storage quota
        if (
          storageLocation.capacity_bytes &&
          storageLocation.used_bytes + options.file.size >
            storageLocation.capacity_bytes
        ) {
          throw new StorageQuotaExceededError()
        }
      }

      // Initialize storage adapter if not already done
      if (!this.storageAdapter) {
        await this.initialize()
      }

      // Generate unique filename
      const fileName = generateUniqueFileName(options.file.originalname)
      const filePath = options.folderId
        ? `${options.tenantId}/folders/${options.folderId}/${fileName}`
        : `${options.tenantId}/documents/${fileName}`

      // Upload file to storage
      const fileUrl = await this.storageAdapter!.upload(
        options.file.buffer,
        filePath,
        {
          metadata: options.metadata,
          contentType: options.file.mimetype
        }
      )

      // Insert document record
      const result = await client.query(
        `INSERT INTO documents (
          tenant_id, parent_folder_id, file_name, file_type, file_size,
          file_url, file_hash, storage_location_id, category_id, tags,
          description, uploaded_by, is_public, metadata, ocr_status,
          embedding_status, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          options.tenantId,
          options.folderId || null,
          options.file.originalname,
          options.file.mimetype,
          options.file.size,
          fileUrl,
          fileHash,
          storageLocationId,
          options.categoryId || null,
          options.tags || [],
          options.description || null,
          options.userId,
          options.isPublic || false,
          JSON.stringify(options.metadata || {}),
          needsOCR(options.file.mimetype) ? OCRStatus.PENDING : OCRStatus.NOT_NEEDED,
          EmbeddingStatus.PENDING,
          DocumentStatus.ACTIVE
        ]
      )

      const document = result.rows[0]

      // Log upload
      await documentAuditService.logDocumentAction(
        options.tenantId,
        document.id,
        options.userId,
        'upload',
        {
          newValues: {
            file_name: document.file_name,
            file_size: document.file_size,
            folder_id: options.folderId
          }
        }
      )

      await client.query('COMMIT')

      // Process document asynchronously (OCR, embeddings, etc.)
      this.processDocumentAsync(document.id, options.file.buffer, options.file.mimetype)
        .catch(err => {
          console.error('❌ Error processing document:', err)
        })

      console.log(`✅ Document uploaded: ${document.file_name}`)

      // Get enriched document data
      return this.getDocumentById(document.id, options.tenantId, options.userId)
    } catch (error) {
      await client.query('ROLLBACK')

      // Try to clean up uploaded file
      try {
        // File cleanup would go here
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup file:', cleanupError)
      }

      console.error('❌ Failed to upload document:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(
    documentId: string,
    tenantId: string,
    userId: string
  ): Promise<DocumentWithMetadata> {
    try {
      const result = await pool.query(
        `SELECT
          d.*,
          dc.category_name,
          dc.color as category_color,
          u.first_name || ' ' || u.last_name as uploaded_by_name,
          df.folder_name,
          df.path as folder_path,
          (SELECT COUNT(*) FROM document_versions dv WHERE dv.document_id = d.id) as version_count,
          (SELECT COUNT(*) FROM document_comments dcom WHERE dcom.document_id = d.id) as comment_count,
          (SELECT COUNT(*) FROM document_permissions dp WHERE dp.document_id = d.id) > 0 as has_permissions
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN document_folders df ON d.parent_folder_id = df.id
        WHERE d.id = $1 AND d.tenant_id = $2 AND d.deleted_at IS NULL`,
        [documentId, tenantId]
      )

      if (result.rows.length === 0) {
        throw new DocumentNotFoundError(documentId)
      }

      // Log access
      await documentAuditService.logDocumentAction(
        tenantId,
        documentId,
        userId,
        'view'
      )

      return result.rows[0]
    } catch (error) {
      console.error('❌ Failed to get document:', error)
      throw error
    }
  }

  /**
   * Get documents with filters
   */
  async getDocuments(
    tenantId: string,
    filters?: GetDocumentsFilters
  ): Promise<DocumentSearchResult> {
    try {
      let query = `
        SELECT
          d.*,
          dc.category_name,
          dc.color as category_color,
          u.first_name || ' ' || u.last_name as uploaded_by_name,
          df.folder_name,
          df.path as folder_path,
          (SELECT COUNT(*) FROM document_versions dv WHERE dv.document_id = d.id) as version_count,
          (SELECT COUNT(*) FROM document_comments dcom WHERE dcom.document_id = d.id) as comment_count
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN document_folders df ON d.parent_folder_id = df.id
        WHERE d.tenant_id = $1
      `

      const params: any[] = [tenantId]
      let paramCount = 1

      // Apply filters
      if (!filters?.includeDeleted) {
        query += ` AND d.deleted_at IS NULL`
      }

      if (filters?.folderId) {
        paramCount++
        query += ` AND d.parent_folder_id = $${paramCount}`
        params.push(filters.folderId)
      }

      if (filters?.categoryId) {
        paramCount++
        query += ` AND d.category_id = $${paramCount}`
        params.push(filters.categoryId)
      }

      if (filters?.status) {
        paramCount++
        query += ` AND d.status = $${paramCount}`
        params.push(filters.status)
      }

      if (filters?.uploadedBy) {
        paramCount++
        query += ` AND d.uploaded_by = $${paramCount}`
        params.push(filters.uploadedBy)
      }

      if (filters?.fileType) {
        paramCount++
        query += ` AND d.file_type = $${paramCount}`
        params.push(filters.fileType)
      }

      if (filters?.tags && filters.tags.length > 0) {
        paramCount++
        query += ` AND d.tags && $${paramCount}`
        params.push(filters.tags)
      }

      if (filters?.search) {
        paramCount++
        query += ` AND (
          d.file_name ILIKE $${paramCount}
          OR d.description ILIKE $${paramCount}
          OR d.extracted_text ILIKE $${paramCount}
        )`
        params.push(`%${filters.search}%`)
      }

      if (filters?.minSize) {
        paramCount++
        query += ` AND d.file_size >= $${paramCount}`
        params.push(filters.minSize)
      }

      if (filters?.maxSize) {
        paramCount++
        query += ` AND d.file_size <= $${paramCount}`
        params.push(filters.maxSize)
      }

      if (filters?.createdAfter) {
        paramCount++
        query += ` AND d.created_at >= $${paramCount}`
        params.push(filters.createdAfter)
      }

      if (filters?.createdBefore) {
        paramCount++
        query += ` AND d.created_at <= $${paramCount}`
        params.push(filters.createdBefore)
      }

      // Get total count
      const countResult = await pool.query(
        query.replace('SELECT d.*, dc.category_name', 'SELECT COUNT(DISTINCT d.id) as count'),
        params
      )
      const total = parseInt(countResult.rows[0].count)

      // Add sorting
      const sortBy = filters?.sortBy || 'created_at'
      const sortOrder = filters?.sortOrder || 'DESC'
      query += ` ORDER BY d.${sortBy} ${sortOrder}`

      // Add pagination
      const limit = filters?.limit || 50
      const offset = filters?.offset || 0

      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)

      paramCount++
      query += ` OFFSET $${paramCount}`
      params.push(offset)

      const result = await pool.query(query, params)

      return {
        documents: result.rows,
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: offset + limit < total
      }
    } catch (error) {
      console.error('❌ Failed to get documents:', error)
      throw error
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: string,
    tenantId: string,
    userId: string,
    updates: UpdateDocumentOptions
  ): Promise<DocumentWithMetadata> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get current document
      const currentResult = await client.query(
        `SELECT 
      id,
      tenant_id,
      file_name,
      file_type,
      file_size,
      file_url,
      file_hash,
      category_id,
      tags,
      description,
      uploaded_by,
      is_public,
      version_number,
      status,
      metadata,
      extracted_text,
      ocr_status,
      ocr_completed_at,
      embedding_status,
      embedding_completed_at,
      created_at,
      updated_at FROM documents WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [documentId, tenantId]
      )

      if (currentResult.rows.length === 0) {
        throw new DocumentNotFoundError(documentId)
      }

      const currentDoc = currentResult.rows[0]

      // Build update query
      const setClauses: string[] = []
      const values: any[] = []
      let paramCount = 1

      const allowedFields: (keyof UpdateDocumentOptions)[] = [
        'file_name',
        'description',
        'category_id',
        'tags',
        'is_public',
        'metadata',
        'status',
        'parent_folder_id'
      ]

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          if (field === 'metadata') {
            setClauses.push(`${field} = $${paramCount}`)
            values.push(JSON.stringify(updates[field]))
          } else {
            setClauses.push(`${field} = $${paramCount}`)
            values.push(updates[field])
          }
          paramCount++
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update')
      }

      values.push(documentId, tenantId)

      const result = await client.query(
        `UPDATE documents
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
         RETURNING *`,
        values
      )

      const updatedDoc = result.rows[0]

      // Log update
      await documentAuditService.logDocumentAction(
        tenantId,
        documentId,
        userId,
        'edit',
        {
          oldValues: currentDoc,
          newValues: updates
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Document updated: ${updatedDoc.file_name}`)

      return this.getDocumentById(documentId, tenantId, userId)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to update document:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(
    documentId: string,
    tenantId: string,
    userId: string,
    permanent: boolean = false
  ): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query(
        `SELECT id, tenant_id, document_name, document_type, file_path, created_at, updated_at FROM documents WHERE id = $1 AND tenant_id = $2',
        [documentId, tenantId]
      )

      if (result.rows.length === 0) {
        throw new DocumentNotFoundError(documentId)
      }

      const document = result.rows[0]

      if (permanent) {
        // Permanent delete - remove from storage and database
        if (!this.storageAdapter) {
          await this.initialize()
        }

        // Delete from storage
        try {
          await this.storageAdapter!.delete(document.file_url)
        } catch (error) {
          console.warn('⚠️  Failed to delete file from storage:', error)
        }

        // Delete from database
        await client.query(
          `DELETE FROM documents WHERE id = $1 AND tenant_id = $2',
          [documentId, tenantId]
        )

        await documentAuditService.logDocumentAction(
          tenantId,
          documentId,
          userId,
          'permanent_delete',
          { oldValues: { file_name: document.file_name } }
        )
      } else {
        // Soft delete
        await client.query(
          `UPDATE documents
           SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2',
          [documentId, tenantId]
        )

        await documentAuditService.logDocumentAction(
          tenantId,
          documentId,
          userId,
          'delete',
          { oldValues: { file_name: document.file_name } }
        )
      }

      await client.query('COMMIT')

      console.log(`✅ Document deleted: ${document.file_name} (permanent: ${permanent})`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to delete document:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Restore deleted document
   */
  async restoreDocument(
    documentId: string,
    tenantId: string,
    userId: string
  ): Promise<DocumentWithMetadata> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query(
        `UPDATE documents
         SET deleted_at = NULL, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL
         RETURNING *`,
        [documentId, tenantId]
      )

      if (result.rows.length === 0) {
        throw new DocumentNotFoundError(documentId)
      }

      const document = result.rows[0]

      await documentAuditService.logDocumentAction(
        tenantId,
        documentId,
        userId,
        'restore',
        { newValues: { file_name: document.file_name } }
      )

      await client.query('COMMIT')

      console.log(`✅ Document restored: ${document.file_name}`)

      return this.getDocumentById(documentId, tenantId, userId)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to restore document:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Download document
   */
  async downloadDocument(
    documentId: string,
    tenantId: string,
    userId: string
  ): Promise<{ buffer: Buffer; document: Document }> {
    try {
      const document = await this.getDocumentById(documentId, tenantId, userId)

      if (!this.storageAdapter) {
        await this.initialize()
      }

      const buffer = await this.storageAdapter!.download(document.file_url)

      // Log download
      await documentAuditService.logDocumentAction(
        tenantId,
        documentId,
        userId,
        'download'
      )

      console.log(`✅ Document downloaded: ${document.file_name}`)

      return { buffer, document }
    } catch (error) {
      console.error('❌ Failed to download document:', error)
      throw error
    }
  }

  /**
   * Get document statistics
   */
  async getStatistics(tenantId: string): Promise<DocumentStatistics> {
    try {
      const [totalDocs, byCategory, byType, byStatus, storageUsage] =
        await Promise.all([
          pool.query(
            `SELECT
              COUNT(*) as total_documents,
              SUM(file_size) as total_size_bytes
            FROM documents
            WHERE tenant_id = $1 AND deleted_at IS NULL`,
            [tenantId]
          ),
          pool.query(
            `SELECT
              COALESCE(dc.category_name, 'Uncategorized') as category,
              dc.color,
              COUNT(*) as count
            FROM documents d
            LEFT JOIN document_categories dc ON d.category_id = dc.id
            WHERE d.tenant_id = $1 AND d.deleted_at IS NULL
            GROUP BY dc.category_name, dc.color
            ORDER BY count DESC`,
            [tenantId]
          ),
          pool.query(
            `SELECT
              file_type,
              COUNT(*) as count,
              SUM(file_size) as total_size
            FROM documents
            WHERE tenant_id = $1 AND deleted_at IS NULL
            GROUP BY file_type
            ORDER BY count DESC`,
            [tenantId]
          ),
          pool.query(
            `SELECT
              status,
              COUNT(*) as count
            FROM documents
            WHERE tenant_id = $1
            GROUP BY status
            ORDER BY count DESC`,
            [tenantId]
          ),
          pool.query(
            `SELECT
              used_bytes,
              capacity_bytes
            FROM document_storage_locations
            WHERE tenant_id = $1 AND is_default = true`,
            [tenantId]
          )
        ])

      const storage = storageUsage.rows[0] || { used_bytes: 0, capacity_bytes: null }
      const usagePercentage = storage.capacity_bytes
        ? (storage.used_bytes / storage.capacity_bytes) * 100
        : undefined

      return {
        total_documents: parseInt(totalDocs.rows[0].total_documents) || 0,
        total_size_bytes: parseInt(totalDocs.rows[0].total_size_bytes) || 0,
        by_category: byCategory.rows,
        by_type: byType.rows,
        by_status: byStatus.rows,
        storage_usage: {
          used_bytes: parseInt(storage.used_bytes) || 0,
          capacity_bytes: storage.capacity_bytes
            ? parseInt(storage.capacity_bytes)
            : undefined,
          usage_percentage: usagePercentage
        },
        recent_uploads: 0 // Would need to calculate
      }
    } catch (error) {
      console.error('❌ Failed to get statistics:', error)
      throw error
    }
  }

  /**
   * Process document asynchronously (OCR, embeddings, etc.)
   */
  private async processDocumentAsync(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<void> {
    try {
      // This would integrate with OCR and embedding services
      // For now, just mark as completed
      await pool.query(
        `UPDATE documents
         SET ocr_status = $1, embedding_status = $2, updated_at = NOW()
         WHERE id = $3',
        [OCRStatus.NOT_NEEDED, EmbeddingStatus.COMPLETED, documentId]
      )

      console.log(`✅ Document processed: ${documentId}`)
    } catch (error) {
      console.error('❌ Error processing document:', error)
      await pool.query(
        `UPDATE documents
         SET ocr_status = $1, embedding_status = $2
         WHERE id = $3',
        [OCRStatus.FAILED, EmbeddingStatus.FAILED, documentId]
      )
    }
  }
}

export default new DocumentStorageService()
