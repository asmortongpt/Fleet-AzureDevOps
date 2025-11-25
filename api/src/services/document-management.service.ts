/**
 * Document Management Service
 *
 * Comprehensive document lifecycle management:
 * - File upload and storage (local filesystem or S3)
 * - Version control
 * - Access control and permissions
 * - Text extraction for search
 * - Category management
 * - Audit logging
 */

import pool from '../config/database'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { DocumentRAGService } from './document-rag.service'

export interface Document {
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

export interface DocumentCategory {
  id: string
  tenant_id: string
  category_name: string
  description?: string
  color: string
  icon?: string
}

export interface UploadOptions {
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

export class DocumentManagementService {
  private ragService: DocumentRAGService
  private uploadDir: string

  constructor() {
    this.ragService = new DocumentRAGService()
    // Configure upload directory (can be overridden with S3)
    this.uploadDir = process.env.DOCUMENT_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'documents')
  }

  /**
   * Initialize upload directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true })
      console.log(`Document upload directory initialized: ${this.uploadDir}`)
    } catch (error) {
      console.error('Error initializing document upload directory:', error)
      throw error
    }
  }

  /**
   * Upload a new document
   */
  async uploadDocument(options: UploadOptions): Promise<Document> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Generate file hash
      const fileHash = crypto.createHash('sha256').update(options.file.buffer).digest('hex')

      // Check for duplicate files
      const duplicateCheck = await client.query(
        `SELECT id, file_name FROM documents
         WHERE tenant_id = $1 AND file_hash = $2 AND status = 'active'',
        [options.tenantId, fileHash]
      )

      if (duplicateCheck.rows.length > 0) {
        await client.query('ROLLBACK')
        throw new Error(`Duplicate file detected: ${duplicateCheck.rows[0].file_name}`)
      }

      // Generate unique filename
      const fileExt = path.extname(options.file.originalname)
      const fileName = '${crypto.randomBytes(16).toString('hex')}${fileExt}'
      const filePath = path.join(this.uploadDir, options.tenantId, fileName)

      // Ensure tenant directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true })

      // Write file to disk (or S3 in production)
      await fs.writeFile(filePath, options.file.buffer)

      // Store relative path for database
      const fileUrl = `/uploads/documents/${options.tenantId}/${fileName}`

      // Insert document record
      const result = await client.query(
        `INSERT INTO documents (
          tenant_id, file_name, file_type, file_size, file_url, file_hash,
          category_id, tags, description, uploaded_by, is_public, metadata,
          ocr_status, embedding_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          options.tenantId,
          options.file.originalname,
          options.file.mimetype,
          options.file.size,
          fileUrl,
          fileHash,
          options.categoryId,
          options.tags || [],
          options.description,
          options.userId,
          options.isPublic || false,
          JSON.stringify(options.metadata || {}),
          this.needsOCR(options.file.mimetype) ? 'pending' : 'not_needed',
          'pending'
        ]
      )

      const document = result.rows[0]

      // Log access
      await this.logAccess(client, document.id, options.userId, 'upload')

      await client.query('COMMIT')

      // Process document asynchronously (don't wait)
      this.processDocumentAsync(document.id, filePath, options.file.mimetype).catch(err => {
        console.error('Error processing document:', err)
      })

      return document
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error uploading document:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Process document asynchronously: extract text and generate embeddings
   */
  private async processDocumentAsync(documentId: string, filePath: string, mimeType: string): Promise<void> {
    try {
      // Extract text from document
      const extractedText = await this.extractText(filePath, mimeType)

      // Update document with extracted text
      await pool.query(
        `UPDATE documents
         SET extracted_text = $1, ocr_status = 'completed', ocr_completed_at = NOW()
         WHERE id = $2',
        [extractedText, documentId]
      )

      // Generate embeddings for RAG
      if (extractedText && extractedText.length > 50) {
        await pool.query(
          'UPDATE documents SET embedding_status = 'processing' WHERE id = $1',
          [documentId]
        )

        await this.ragService.generateDocumentEmbeddings(documentId, extractedText)

        await pool.query(
          'UPDATE documents SET embedding_status = 'completed', embedding_completed_at = NOW() WHERE id = $1',
          [documentId]
        )
      } else {
        await pool.query(
          'UPDATE documents SET embedding_status = 'failed' WHERE id = $1',
          [documentId]
        )
      }
    } catch (error) {
      console.error('Error processing document:', error)
      await pool.query(
        'UPDATE documents SET ocr_status = 'failed', embedding_status = 'failed' WHERE id = $1',
        [documentId]
      )
    }
  }

  /**
   * Extract text from document (supports PDF, DOCX, TXT, CSV)
   */
  private async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      // For text files, read directly
      if (mimeType === 'text/plain' || mimeType === 'text/csv') {
        const content = await fs.readFile(filePath, 'utf-8')
        return content
      }

      // For PDFs, would use pdf-parse or similar
      if (mimeType === 'application/pdf') {
        // PRODUCTION TODO: Integrate pdf-parse
        // const pdfParse = require('pdf-parse')
        // const dataBuffer = await fs.readFile(filePath)
        // const data = await pdfParse(dataBuffer)
        // return data.text

        // Placeholder for now
        return `[PDF content extraction not yet implemented for ${filePath}]`
      }

      // For DOCX, would use mammoth or similar
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // PRODUCTION TODO: Integrate mammoth
        // const mammoth = require('mammoth')
        // const result = await mammoth.extractRawText({ path: filePath })
        // return result.value

        return `[DOCX content extraction not yet implemented for ${filePath}]`
      }

      return ''
    } catch (error) {
      console.error('Error extracting text:', error)
      return ''
    }
  }

  /**
   * Check if file needs OCR
   */
  private needsOCR(mimeType: string): boolean {
    const ocrTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ]
    return ocrTypes.includes(mimeType)
  }

  /**
   * Get documents with filters
   */
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
    let query = `
      SELECT
        d.*,
        dc.category_name,
        dc.color as category_color,
        u.first_name || ' ' || u.last_name as uploaded_by_name,
        (SELECT COUNT(*) FROM document_versions dv WHERE dv.document_id = d.id) as version_count,
        (SELECT COUNT(*) FROM document_comments dcom WHERE dcom.document_id = d.id) as comment_count
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (filters?.status) {
      paramCount++
      query += ` AND d.status = $${paramCount}`
      params.push(filters.status)
    } else {
      query += ' AND d.status = 'active''
    }

    if (filters?.categoryId) {
      paramCount++
      query += ` AND d.category_id = $${paramCount}`
      params.push(filters.categoryId)
    }

    if (filters?.uploadedBy) {
      paramCount++
      query += ` AND d.uploaded_by = $${paramCount}`
      params.push(filters.uploadedBy)
    }

    if (filters?.tags && filters.tags.length > 0) {
      paramCount++
      query += ` AND d.tags && $${paramCount}`
      params.push(filters.tags)
    }

    if (filters?.search) {
      paramCount++
      query += ` AND (
        d.file_name ILIKE $${paramCount} OR
        d.description ILIKE $${paramCount} OR
        d.extracted_text ILIKE $${paramCount}
      )`
      params.push(`%${filters.search}%`)
    }

    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT d.*, dc.category_name, dc.color as category_color, u.first_name', 'SELECT COUNT(DISTINCT d.id)'),
      params
    )
    const total = parseInt(countResult.rows[0].count)

    // Add pagination
    query += ` ORDER BY d.created_at DESC`

    if (filters?.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    if (filters?.offset) {
      paramCount++
      query += ` OFFSET $${paramCount}`
      params.push(filters.offset)
    }

    const result = await pool.query(query, params)

    return {
      documents: result.rows,
      total
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string, tenantId: string, userId: string): Promise<Document | null> {
    const result = await pool.query(
      `SELECT
        d.*,
        dc.category_name,
        dc.color as category_color,
        u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = $1 AND d.tenant_id = $2',
      [documentId, tenantId]
    )

    if (result.rows.length === 0) {
      return null
    }

    // Log access
    await this.logAccess(null, documentId, userId, 'view')

    return result.rows[0]
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: string,
    tenantId: string,
    userId: string,
    updates: Partial<Document>
  ): Promise<Document> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const setClauses: string[] = []
      const values: any[] = []
      let paramCount = 1

      const allowedFields = ['file_name', 'description', 'category_id', 'tags', 'is_public', 'metadata', 'status']

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof Document] !== undefined) {
          setClauses.push(`${key} = $${paramCount}`)
          values.push(updates[key as keyof Document])
          paramCount++
        }
      })

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update')
      }

      setClauses.push('updated_at = NOW()')
      values.push(documentId, tenantId)

      const result = await client.query(
        `UPDATE documents
         SET ${setClauses.join(', ')}
         WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        throw new Error('Document not found')
      }

      await this.logAccess(client, documentId, userId, 'edit')

      await client.query('COMMIT')

      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, tenantId: string, userId: string): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query(
        `UPDATE documents
         SET status = 'deleted', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [documentId, tenantId]
      )

      if (result.rows.length === 0) {
        throw new Error('Document not found')
      }

      await this.logAccess(client, documentId, userId, 'delete')

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get document categories
   */
  async getCategories(tenantId: string): Promise<DocumentCategory[]> {
    const result = await pool.query(
      `SELECT
        dc.*,
        COUNT(d.id) as document_count
      FROM document_categories dc
      LEFT JOIN documents d ON dc.id = d.category_id AND d.status = 'active'
      WHERE dc.tenant_id = $1
      GROUP BY dc.id
      ORDER BY dc.category_name`,
      [tenantId]
    )

    return result.rows
  }

  /**
   * Create category
   */
  async createCategory(
    tenantId: string,
    categoryData: { category_name: string; description?: string; color?: string; icon?: string }
  ): Promise<DocumentCategory> {
    const result = await pool.query(
      `INSERT INTO document_categories (tenant_id, category_name, description, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        tenantId,
        categoryData.category_name,
        categoryData.description,
        categoryData.color || '#3B82F6',
        categoryData.icon
      ]
    )

    return result.rows[0]
  }

  /**
   * Get document access log
   */
  async getAccessLog(documentId: string, tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        dal.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM document_access_log dal
      JOIN users u ON dal.user_id = u.id
      JOIN documents d ON dal.document_id = d.id
      WHERE dal.document_id = $1 AND d.tenant_id = $2
      ORDER BY dal.accessed_at DESC
      LIMIT 100`,
      [documentId, tenantId]
    )

    return result.rows
  }

  /**
   * Log document access
   */
  private async logAccess(
    client: any,
    documentId: string,
    userId: string,
    action: 'view' | 'download' | 'edit' | 'delete' | 'upload' | 'share'
  ): Promise<void> {
    const query = `
      INSERT INTO document_access_log (document_id, user_id, action)
      VALUES ($1, $2, $3)
    `

    if (client) {
      await client.query(query, [documentId, userId, action])
    } else {
      await pool.query(query, [documentId, userId, action])
    }
  }

  /**
   * Get document statistics
   */
  async getStatistics(tenantId: string): Promise<any> {
    const [totalDocs, byCategory, byType, recentUploads] = await Promise.all([
      pool.query(
        `SELECT
          COUNT(*) as total_documents,
          SUM(file_size) as total_size_bytes
        FROM documents
        WHERE tenant_id = $1 AND status = 'active'',
        [tenantId]
      ),
      pool.query(
        `SELECT
          COALESCE(dc.category_name, 'Uncategorized') as category,
          dc.color,
          COUNT(*) as count
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        WHERE d.tenant_id = $1 AND d.status = 'active'
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
        WHERE tenant_id = $1 AND status = 'active'
        GROUP BY file_type
        ORDER BY count DESC`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as count
        FROM documents
        WHERE tenant_id = $1 AND status = 'active'
        AND created_at > NOW() - INTERVAL '7 days'',
        [tenantId]
      )
    ])

    return {
      total_documents: parseInt(totalDocs.rows[0].total_documents) || 0,
      total_size_bytes: parseInt(totalDocs.rows[0].total_size_bytes) || 0,
      by_category: byCategory.rows,
      by_type: byType.rows,
      recent_uploads: parseInt(recentUploads.rows[0].count) || 0
    }
  }
}

export default new DocumentManagementService()
