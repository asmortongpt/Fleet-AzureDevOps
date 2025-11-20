/**
 * Document Service
 *
 * Fleet document management service integrating:
 * - Azure Blob Storage for file storage
 * - PostgreSQL for metadata storage
 * - Document expiration tracking and alerts
 * - Vehicle, driver, and work order associations
 * - SAS URL generation for secure downloads
 */

import { BlobServiceClient, ContainerClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob'
import crypto from 'crypto'
import pool from '../config/database'

export interface DocumentMetadata {
  vehicleId?: string
  driverId?: string
  workOrderId?: string
  documentType: 'registration' | 'insurance' | 'inspection' | 'maintenance' | 'incident' | 'other'
  title: string
  description?: string
  expiresAt?: Date
  tenantId: number
  uploadedBy: number
}

export interface DocumentRecord {
  id: string
  vehicleId?: string
  driverId?: string
  workOrderId?: string
  documentType: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  storagePath: string
  ocrText?: string
  metadata?: any
  uploadedBy: number
  uploadedAt: Date
  expiresAt?: Date
  isArchived: boolean
  tenantId: number
  downloadUrl?: string
}

export interface DocumentFilters {
  vehicleId?: string
  driverId?: string
  workOrderId?: string
  documentType?: string
  isArchived?: boolean
}

export class DocumentService {
  private blobServiceClient: BlobServiceClient | null = null
  private accountName: string = ''
  private accountKey: string = ''
  private isInitialized: boolean = false

  // File size limits
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  // Allowed MIME types for documents
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/msword', // DOC
    'application/vnd.ms-excel', // XLS
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  // Container name for fleet documents
  private readonly CONTAINER_NAME = 'fleet-documents'

  constructor() {
    // Graceful initialization - only initialize when Azure Storage is configured
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    if (!connectionString) {
      console.warn('⚠️  AZURE_STORAGE_CONNECTION_STRING is not configured - document features will be disabled')
      return
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)

      // Parse account name and key from connection string
      const accountNameMatch = connectionString.match(/AccountName=([^;]+)/)
      const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/)

      if (!accountNameMatch || !accountKeyMatch) {
        console.error('Invalid Azure Storage connection string format')
        return
      }

      this.accountName = accountNameMatch[1]
      this.accountKey = accountKeyMatch[1]

      this.isInitialized = true
      console.log('✅ DocumentService initialized successfully')

      // Initialize container
      this.initializeContainer().catch(err => {
        console.error('Error initializing document container:', err)
      })
    } catch (error) {
      console.error('Error initializing DocumentService:', error)
      this.isInitialized = false
    }
  }

  /**
   * Check if service is initialized and throw error if not
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.blobServiceClient) {
      throw new Error('DocumentService is not initialized. Azure Storage configuration is missing.')
    }
  }

  /**
   * Initialize Azure Blob Storage container
   */
  private async initializeContainer(): Promise<void> {
    try {
      const containerClient = this.blobServiceClient!.getContainerClient(this.CONTAINER_NAME)
      await containerClient.createIfNotExists({
        access: 'private'
      })
      console.log(`✅ Container initialized: ${this.CONTAINER_NAME}`)
    } catch (error) {
      console.error(`Error creating container ${this.CONTAINER_NAME}:`, error)
    }
  }

  /**
   * Validate file type
   */
  private validateFileType(file: { mimetype: string }): boolean {
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`)
    }
    return true
  }

  /**
   * Generate date-based path for file organization
   */
  private generateDatePath(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  /**
   * Generate unique filename
   */
  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.substring(originalFilename.lastIndexOf('.'))
    const hash = crypto.randomBytes(16).toString('hex')
    return `${hash}${extension}`
  }

  /**
   * Upload document to Azure Blob Storage and store metadata in PostgreSQL
   */
  async uploadDocument(
    file: Express.Multer.File,
    metadata: DocumentMetadata
  ): Promise<DocumentRecord> {
    this.ensureInitialized()

    try {
      // Validate file
      this.validateFileType(file)

      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
      }

      // Generate unique filename and path
      const datePath = this.generateDatePath()
      const uniqueFilename = this.generateUniqueFilename(file.originalname)
      const blobName = `${datePath}/${uniqueFilename}`

      // Get container client
      const containerClient = this.blobServiceClient!.getContainerClient(this.CONTAINER_NAME)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      // Upload file
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        },
        metadata: {
          originalFilename: file.originalname,
          uploadedBy: metadata.uploadedBy.toString(),
          tenantId: metadata.tenantId.toString(),
          documentType: metadata.documentType,
          title: metadata.title
        }
      })

      const blobUrl = blockBlobClient.url

      // Store in database
      const result = await pool.query(
        `INSERT INTO fleet_documents (
          vehicle_id, driver_id, work_order_id, document_type,
          title, description, file_name, original_file_name,
          file_size, mime_type, storage_path, blob_url,
          uploaded_by, tenant_id, expires_at, is_archived,
          uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING
          id,
          vehicle_id as "vehicleId",
          driver_id as "driverId",
          work_order_id as "workOrderId",
          document_type as "documentType",
          title,
          description,
          file_name as "fileName",
          file_size as "fileSize",
          mime_type as "mimeType",
          storage_path as "storagePath",
          ocr_text as "ocrText",
          metadata,
          uploaded_by as "uploadedBy",
          uploaded_at as "uploadedAt",
          expires_at as "expiresAt",
          is_archived as "isArchived",
          tenant_id as "tenantId"`,
        [
          metadata.vehicleId || null,
          metadata.driverId || null,
          metadata.workOrderId || null,
          metadata.documentType,
          metadata.title,
          metadata.description || null,
          uniqueFilename,
          file.originalname,
          file.size,
          file.mimetype,
          blobName,
          blobUrl,
          metadata.uploadedBy,
          metadata.tenantId,
          metadata.expiresAt || null,
          false
        ]
      )

      return result.rows[0] as DocumentRecord
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  /**
   * Get document by ID with SAS URL for download
   */
  async getDocument(documentId: string, tenantId?: number): Promise<DocumentRecord | null> {
    this.ensureInitialized()

    try {
      const query = tenantId
        ? 'SELECT 
      id,
      tenant_id,
      vehicle_id,
      driver_id,
      work_order_id,
      document_type,
      title,
      description,
      file_name,
      original_file_name,
      file_size,
      mime_type,
      storage_path,
      blob_url,
      ocr_text,
      metadata,
      uploaded_by,
      uploaded_at,
      expires_at,
      is_archived,
      created_at,
      updated_at FROM fleet_documents WHERE id = $1 AND tenant_id = $2'
        : 'SELECT id, tenant_id, document_name, document_type, file_path, created_at, updated_at FROM fleet_documents WHERE id = $1'

      const params = tenantId ? [documentId, tenantId] : [documentId]

      const result = await pool.query(query, params)

      if (result.rows.length === 0) {
        return null
      }

      const doc = result.rows[0]

      // Generate SAS URL for download (7-day expiry)
      const downloadUrl = await this.generateSasUrl(doc.blob_url, 7 * 24 * 60) // 7 days in minutes

      return {
        id: doc.id,
        vehicleId: doc.vehicle_id,
        driverId: doc.driver_id,
        workOrderId: doc.work_order_id,
        documentType: doc.document_type,
        title: doc.title,
        description: doc.description,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        storagePath: doc.storage_path,
        ocrText: doc.ocr_text,
        metadata: doc.metadata,
        uploadedBy: doc.uploaded_by,
        uploadedAt: doc.uploaded_at,
        expiresAt: doc.expires_at,
        isArchived: doc.is_archived,
        tenantId: doc.tenant_id,
        downloadUrl
      }
    } catch (error) {
      console.error('Error getting document:', error)
      throw error
    }
  }

  /**
   * List documents with optional filters
   */
  async listDocuments(filters: DocumentFilters = {}, tenantId?: number): Promise<DocumentRecord[]> {
    try {
      let query = 'SELECT 
      id,
      tenant_id,
      vehicle_id,
      driver_id,
      work_order_id,
      document_type,
      title,
      description,
      file_name,
      original_file_name,
      file_size,
      mime_type,
      storage_path,
      blob_url,
      ocr_text,
      metadata,
      uploaded_by,
      uploaded_at,
      expires_at,
      is_archived,
      created_at,
      updated_at FROM fleet_documents WHERE 1=1'
      const params: any[] = []
      let paramIndex = 1

      if (tenantId) {
        query += ` AND tenant_id = $${paramIndex}`
        params.push(tenantId)
        paramIndex++
      }

      if (filters.vehicleId) {
        query += ` AND vehicle_id = $${paramIndex}`
        params.push(filters.vehicleId)
        paramIndex++
      }

      if (filters.driverId) {
        query += ` AND driver_id = $${paramIndex}`
        params.push(filters.driverId)
        paramIndex++
      }

      if (filters.workOrderId) {
        query += ` AND work_order_id = $${paramIndex}`
        params.push(filters.workOrderId)
        paramIndex++
      }

      if (filters.documentType) {
        query += ` AND document_type = $${paramIndex}`
        params.push(filters.documentType)
        paramIndex++
      }

      if (filters.isArchived !== undefined) {
        query += ` AND is_archived = $${paramIndex}`
        params.push(filters.isArchived)
        paramIndex++
      }

      query += ' ORDER BY uploaded_at DESC'

      const result = await pool.query(query, params)

      return result.rows.map(doc => ({
        id: doc.id,
        vehicleId: doc.vehicle_id,
        driverId: doc.driver_id,
        workOrderId: doc.work_order_id,
        documentType: doc.document_type,
        title: doc.title,
        description: doc.description,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        storagePath: doc.storage_path,
        ocrText: doc.ocr_text,
        metadata: doc.metadata,
        uploadedBy: doc.uploaded_by,
        uploadedAt: doc.uploaded_at,
        expiresAt: doc.expires_at,
        isArchived: doc.is_archived,
        tenantId: doc.tenant_id
      }))
    } catch (error) {
      console.error('Error listing documents:', error)
      throw error
    }
  }

  /**
   * Delete document from Azure Blob Storage and database
   */
  async deleteDocument(documentId: string, tenantId?: number): Promise<boolean> {
    this.ensureInitialized()

    try {
      // Get document to retrieve blob URL
      const doc = await this.getDocument(documentId, tenantId)

      if (!doc) {
        return false
      }

      // Delete from Azure Blob Storage
      const url = new URL(doc.storagePath ?
        `https://${this.accountName}.blob.core.windows.net/${this.CONTAINER_NAME}/${doc.storagePath}` :
        doc.downloadUrl || '')
      const pathParts = url.pathname.split('/')
      const blobName = pathParts.slice(2).join('/')

      const containerClient = this.blobServiceClient!.getContainerClient(this.CONTAINER_NAME)
      const blobClient = containerClient.getBlobClient(blobName)
      await blobClient.deleteIfExists()

      // Delete from database
      const deleteQuery = tenantId
        ? 'DELETE FROM fleet_documents WHERE id = $1 AND tenant_id = $2 RETURNING id'
        : 'DELETE FROM fleet_documents WHERE id = $1 RETURNING id'

      const deleteParams = tenantId ? [documentId, tenantId] : [documentId]
      const result = await pool.query(deleteQuery, deleteParams)

      console.log(`✅ Deleted document: ${documentId}`)
      return result.rows.length > 0
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  /**
   * Get documents expiring within specified days threshold
   */
  async getExpiringDocuments(daysThreshold: number, tenantId?: number): Promise<DocumentRecord[]> {
    try {
      const query = tenantId
        ? `SELECT id, tenant_id, document_name, document_type, file_path, created_at, updated_at FROM fleet_documents
           WHERE expires_at IS NOT NULL
           AND expires_at <= NOW() + INTERVAL '${daysThreshold} days'
           AND expires_at > NOW()
           AND is_archived = false
           AND tenant_id = $1
           ORDER BY expires_at ASC`
        : `SELECT id, tenant_id, document_name, document_type, file_path, created_at, updated_at FROM fleet_documents
           WHERE expires_at IS NOT NULL
           AND expires_at <= NOW() + INTERVAL '${daysThreshold} days'
           AND expires_at > NOW()
           AND is_archived = false
           ORDER BY expires_at ASC`

      const params = tenantId ? [tenantId] : []
      const result = await pool.query(query, params)

      return result.rows.map(doc => ({
        id: doc.id,
        vehicleId: doc.vehicle_id,
        driverId: doc.driver_id,
        workOrderId: doc.work_order_id,
        documentType: doc.document_type,
        title: doc.title,
        description: doc.description,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        storagePath: doc.storage_path,
        ocrText: doc.ocr_text,
        metadata: doc.metadata,
        uploadedBy: doc.uploaded_by,
        uploadedAt: doc.uploaded_at,
        expiresAt: doc.expires_at,
        isArchived: doc.is_archived,
        tenantId: doc.tenant_id
      }))
    } catch (error) {
      console.error('Error getting expiring documents:', error)
      throw error
    }
  }

  /**
   * Generate SAS URL for temporary file access
   */
  private async generateSasUrl(blobUrl: string, expiryMinutes: number = 10080): Promise<string> {
    try {
      const url = new URL(blobUrl)
      const pathParts = url.pathname.split('/')
      const blobName = pathParts.slice(2).join('/')

      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey)

      const sasOptions = {
        containerName: this.CONTAINER_NAME,
        blobName,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiryMinutes * 60 * 1000)
      }

      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
      return `${blobUrl}?${sasToken}`
    } catch (error) {
      console.error('Error generating SAS URL:', error)
      throw error
    }
  }

  /**
   * Archive a document (soft delete)
   */
  async archiveDocument(documentId: string, tenantId?: number): Promise<boolean> {
    try {
      const query = tenantId
        ? 'UPDATE fleet_documents SET is_archived = true WHERE id = $1 AND tenant_id = $2 RETURNING id'
        : 'UPDATE fleet_documents SET is_archived = true WHERE id = $1 RETURNING id'

      const params = tenantId ? [documentId, tenantId] : [documentId]
      const result = await pool.query(query, params)

      return result.rows.length > 0
    } catch (error) {
      console.error('Error archiving document:', error)
      throw error
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

export default new DocumentService()
