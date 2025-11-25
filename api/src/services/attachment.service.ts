/**
 * Attachment Service
 *
 * Comprehensive file attachment system integrating:
 * - Azure Blob Storage for file storage
 * - Microsoft Teams file uploads/downloads
 * - Outlook email attachments
 * - File validation, compression, and virus scanning
 * - Thumbnail generation for images
 * - SAS token generation for secure access
 */

import { BlobServiceClient, ContainerClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob'
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import crypto from 'crypto'
import pool from '../config/database'
import sharp from 'sharp'
import { Readable } from 'stream'
import { validateURL, SSRFError } from '../utils/safe-http-request'

export interface FileMetadata {
  originalFilename: string
  mimeType: string
  size: number
  uploadedBy?: string
  tenantId?: string
  communicationId?: number
  metadata?: Record<string, any>
}

export interface UploadResult {
  id: string
  blobUrl: string
  filename: string
  size: number
  mimeType: string
  thumbnailUrl?: string
}

export interface EmailAttachment {
  name: string
  contentType: string
  size: number
  contentBytes?: string
  isInline?: boolean
}

export class AttachmentService {
  private blobServiceClient: BlobServiceClient | null = null
  private graphClient: Client | null = null
  private accountName: string = ''
  private accountKey: string = ''
  private isInitialized: boolean = false

  // File size limits
  private readonly MAX_TEAMS_FILE_SIZE = 25 * 1024 * 1024 // 25MB
  private readonly MAX_OUTLOOK_FILE_SIZE = 150 * 1024 * 1024 // 150MB
  private readonly MAX_GENERAL_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private readonly CHUNK_SIZE = 4 * 1024 * 1024 // 4MB chunks for large files

  // Allowed and blocked file types
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/msword', // DOC
    'application/vnd.ms-excel', // XLS
    'application/vnd.ms-powerpoint', // PPT
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/zip',
    'application/x-zip-compressed'
  ]

  private readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar', '.app', '.dmg',
    '.scr', '.com', '.pif', '.msi', '.dll', '.deb', '.rpm'
  ]

  // Container names
  private readonly CONTAINERS = {
    TEAMS_FILES: 'teams-files',
    EMAIL_ATTACHMENTS: 'email-attachments',
    COMMUNICATION_FILES: 'communication-files'
  }

  constructor() {
    // Lazy initialization - only initialize when Azure Storage is configured
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    if (!connectionString) {
      console.warn('⚠️  AZURE_STORAGE_CONNECTION_STRING is not configured - attachment features will be disabled')
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

      // Initialize Microsoft Graph Client
      const credential = new ClientSecretCredential(
        process.env.MS_GRAPH_TENANT_ID || '',
        process.env.MS_GRAPH_CLIENT_ID || '',
        process.env.MS_GRAPH_CLIENT_SECRET || ''
      )

      this.graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const token = await credential.getToken('https://graph.microsoft.com/.default')
            return token.token
          }
        }
      })

      this.isInitialized = true
      console.log('✅ AttachmentService initialized successfully')

      // Initialize containers
      this.initializeContainers().catch(err => {
        console.error('Error initializing containers:', err)
      })
    } catch (error) {
      console.error('Error initializing AttachmentService:', error)
      this.isInitialized = false
    }
  }

  /**
   * Check if service is initialized and throw error if not
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.blobServiceClient) {
      throw new Error('AttachmentService is not initialized. Azure Storage configuration is missing.')
    }
  }

  /**
   * Initialize Azure Blob Storage containers
   */
  private async initializeContainers(): Promise<void> {
    for (const containerName of Object.values(this.CONTAINERS)) {
      try {
        const containerClient = this.blobServiceClient.getContainerClient(containerName)
        await containerClient.createIfNotExists()
        console.log(`✅ Container initialized: ${containerName}`)
      } catch (error) {
        console.error(`Error creating container ${containerName}:`, error)
      }
    }
  }

  /**
   * Validate file type and size
   */
  validateFileType(file: { originalname: string; mimetype: string }, allowedTypes?: string[]): boolean {
    const types = allowedTypes || this.ALLOWED_MIME_TYPES

    // Check MIME type
    if (!types.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`)
    }

    // Check for dangerous extensions
    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      throw new Error(`File extension ${extension} is blocked for security reasons`)
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
   * Upload file to Azure Blob Storage
   */
  async uploadToAzure(
    file: { originalname: string; mimetype: string; buffer: Buffer; size: number },
    metadata: FileMetadata
  ): Promise<UploadResult> {
    this.ensureInitialized()

    try {
      // Validate file
      this.validateFileType(file)

      if (file.size > this.MAX_GENERAL_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${this.MAX_GENERAL_FILE_SIZE / 1024 / 1024}MB`)
      }

      // Generate unique filename and path
      const datePath = this.generateDatePath()
      const uniqueFilename = this.generateUniqueFilename(file.originalname)
      const blobName = `${datePath}/${uniqueFilename}`

      // Get container client
      const containerClient = this.blobServiceClient.getContainerClient(this.CONTAINERS.COMMUNICATION_FILES)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      // Upload file
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        },
        metadata: {
          originalFilename: file.originalname,
          uploadedBy: metadata.uploadedBy || 'system',
          tenantId: metadata.tenantId || '',
          ...metadata.metadata
        }
      })

      const blobUrl = blockBlobClient.url

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined
      if (file.mimetype.startsWith('image/')) {
        thumbnailUrl = await this.generateThumbnail(file, containerClient, datePath)
      }

      // Store in database
      const result = await pool.query(
        `INSERT INTO communication_attachments (
          communication_id, filename, original_filename, file_size_bytes,
          mime_type, storage_path, storage_url, blob_url, thumbnail_url,
          virus_scan_status, is_scanned
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          metadata.communicationId || null,
          uniqueFilename,
          file.originalname,
          file.size,
          file.mimetype,
          blobName,
          blobUrl,
          blobUrl,
          thumbnailUrl,
          'pending',
          false
        ]
      )

      return {
        id: result.rows[0].id,
        blobUrl,
        filename: uniqueFilename,
        size: file.size,
        mimeType: file.mimetype,
        thumbnailUrl
      }
    } catch (error) {
      console.error('Error uploading to Azure:', error)
      throw error
    }
  }

  /**
   * Download file from Azure Blob Storage
   */
  async downloadFromAzure(blobUrl: string): Promise<Buffer> {
    this.ensureInitialized()

    try {
      // SSRF Protection: Validate blob URL is from trusted Azure Storage
      try {
        validateURL(blobUrl, {
          allowedDomains: [
            'blob.core.windows.net', // Azure Blob Storage
            '*.blob.core.windows.net'
          ]
        })
      } catch (error) {
        if (error instanceof SSRFError) {
          console.error(`SSRF Protection blocked blob download from ${blobUrl}`, {
            reason: error.reason
          })
          throw new Error(`Unauthorized blob URL: ${error.reason}`)
        }
        throw error
      }

      // Extract blob name from URL
      const url = new URL(blobUrl)
      const pathParts = url.pathname.split('/')
      const containerName = pathParts[1]
      const blobName = pathParts.slice(2).join('/')

      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blobClient = containerClient.getBlobClient(blobName)

      const downloadResponse = await blobClient.download()

      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to download file')
      }

      const chunks: Buffer[] = []
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk))
      }

      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error downloading from Azure:', error)
      throw error
    }
  }

  /**
   * Delete file from Azure Blob Storage
   */
  async deleteFromAzure(blobUrl: string): Promise<void> {
    this.ensureInitialized()

    try{
      // SSRF Protection: Validate blob URL
      try {
        validateURL(blobUrl, {
          allowedDomains: ['blob.core.windows.net', '*.blob.core.windows.net']
        })
      } catch (error) {
        if (error instanceof SSRFError) {
          throw new Error(`Unauthorized blob URL: ${error.reason}`)
        }
        throw error
      }

      const url = new URL(blobUrl)
      const pathParts = url.pathname.split('/')
      const containerName = pathParts[1]
      const blobName = pathParts.slice(2).join('/')

      const containerClient = this.blobServiceClient.getContainerClient(containerName)
      const blobClient = containerClient.getBlobClient(blobName)

      await blobClient.deleteIfExists()

      // Also delete from database
      await pool.query(
        'UPDATE communication_attachments SET is_scanned = false, scan_result = $1 WHERE blob_url = $2',
        ['Deleted', blobUrl]
      )

      console.log(`✅ Deleted blob: ${blobUrl}`)
    } catch (error) {
      console.error('Error deleting from Azure:', error)
      throw error
    }
  }

  /**
   * Generate SAS URL for temporary file access
   */
  async getFileSasUrl(blobUrl: string, expiryMinutes: number = 60): Promise<string> {
    try {
      // SSRF Protection: Validate blob URL
      try {
        validateURL(blobUrl, {
          allowedDomains: ['blob.core.windows.net', '*.blob.core.windows.net']
        })
      } catch (error) {
        if (error instanceof SSRFError) {
          throw new Error(`Unauthorized blob URL: ${error.reason}`)
        }
        throw error
      }

      const url = new URL(blobUrl)
      const pathParts = url.pathname.split('/')
      const containerName = pathParts[1]
      const blobName = pathParts.slice(2).join('/')

      const sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey)

      const sasOptions = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiryMinutes * 60 * 1000)
      }

      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString()
      const sasUrl = `${blobUrl}?${sasToken}`

      // Store SAS URL in database
      await pool.query(
        'UPDATE communication_attachments SET sas_url = $1 WHERE blob_url = $2',
        [sasUrl, blobUrl]
      )

      return sasUrl
    } catch (error) {
      console.error('Error generating SAS URL:', error)
      throw error
    }
  }

  /**
   * Upload file to Microsoft Teams channel
   */
  async uploadToTeams(
    teamId: string,
    channelId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer; size: number },
    messageId?: string
  ): Promise<any> {
    try {
      if (file.size > this.MAX_TEAMS_FILE_SIZE) {
        throw new Error(`File size exceeds Teams limit of ${this.MAX_TEAMS_FILE_SIZE / 1024 / 1024}MB`)
      }

      // Get the drive ID for the channel
      const drive = await this.graphClient
        .api(`/groups/${teamId}/drive`)
        .get()

      const driveId = drive.id

      // Upload file to Teams
      let uploadResult

      if (file.size <= this.CHUNK_SIZE) {
        // Small file - direct upload
        uploadResult = await this.graphClient
          .api(`/drives/${driveId}/root:/General/${file.originalname}:/content`)
          .putStream(Readable.from(file.buffer))
      } else {
        // Large file - chunked upload
        uploadResult = await this.uploadLargeFileToTeams(driveId, file)
      }

      // Store reference in database
      await pool.query(
        `UPDATE communication_attachments
         SET teams_file_id = $1, storage_url = $2
         WHERE original_filename = $3',
        [uploadResult.id, uploadResult.webUrl, file.originalname]
      )

      return uploadResult
    } catch (error) {
      console.error('Error uploading to Teams:', error)
      throw error
    }
  }

  /**
   * Upload large file to Teams using chunked upload
   */
  private async uploadLargeFileToTeams(
    driveId: string,
    file: { originalname: string; buffer: Buffer; size: number }
  ): Promise<any> {
    // Create upload session
    const uploadSession = await this.graphClient
      .api(`/drives/${driveId}/root:/General/${file.originalname}:/createUploadSession`)
      .post({
        item: {
          '@microsoft.graph.conflictBehavior': 'rename'
        }
      })

    const uploadUrl = uploadSession.uploadUrl

    // SSRF Protection: Validate upload URL is from Microsoft Graph
    try {
      validateURL(uploadUrl, {
        allowedDomains: [
          'graph.microsoft.com',
          '*.sharepoint.com',
          'onedrive.live.com',
          '*.onedrive.com'
        ]
      })
    } catch (error) {
      if (error instanceof SSRFError) {
        throw new Error(`Unauthorized upload URL from Microsoft Graph: ${error.reason}`)
      }
      throw error
    }

    // Upload in chunks
    let uploadedBytes = 0
    const chunks = Math.ceil(file.size / this.CHUNK_SIZE)

    for (let i = 0; i < chunks; i++) {
      const start = i * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, file.size)
      const chunk = file.buffer.slice(start, end)

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${start}-${end - 1}/${file.size}`
        },
        body: chunk
      })

      if (!response.ok && response.status !== 202) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      uploadedBytes = end
    }

    // Get final result
    const result = await fetch(uploadUrl)
    return result.json()
  }

  /**
   * Download file from Microsoft Teams
   */
  async downloadFromTeams(teamId: string, channelId: string, fileId: string): Promise<Buffer> {
    try {
      const drive = await this.graphClient
        .api(`/groups/${teamId}/drive`)
        .get()

      const fileStream = await this.graphClient
        .api(`/drives/${drive.id}/items/${fileId}/content`)
        .getStream()

      const chunks: Buffer[] = []
      for await (const chunk of fileStream) {
        chunks.push(Buffer.from(chunk))
      }

      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error downloading from Teams:', error)
      throw error
    }
  }

  /**
   * Upload attachment to Outlook email draft
   */
  async uploadToOutlook(messageId: string, file: { originalname: string; mimetype: string; buffer: Buffer }): Promise<any> {
    try {
      const attachment: EmailAttachment = {
        name: file.originalname,
        contentType: file.mimetype,
        size: file.buffer.length,
        contentBytes: file.buffer.toString('base64')
      }

      const result = await this.graphClient
        .api(`/me/messages/${messageId}/attachments`)
        .post({
          '@odata.type': '#microsoft.graph.fileAttachment',
          ...attachment
        })

      // Store reference in database
      await pool.query(
        `UPDATE communication_attachments
         SET outlook_attachment_id = $1
         WHERE original_filename = $2',
        [result.id, file.originalname]
      )

      return result
    } catch (error) {
      console.error('Error uploading to Outlook:', error)
      throw error
    }
  }

  /**
   * Send email with attachments
   */
  async sendEmailWithAttachment(
    email: {
      to: string[]
      subject: string
      body: string
      cc?: string[]
      bcc?: string[]
    },
    files: Array<{ originalname: string; mimetype: string; buffer: Buffer }>
  ): Promise<any> {
    try {
      const attachments: EmailAttachment[] = files.map(file => ({
        name: file.originalname,
        contentType: file.mimetype,
        size: file.buffer.length,
        contentBytes: file.buffer.toString('base64')
      }))

      const message = {
        subject: email.subject,
        body: {
          contentType: 'HTML',
          content: email.body
        },
        toRecipients: email.to.map(addr => ({ emailAddress: { address: addr } })),
        ccRecipients: email.cc?.map(addr => ({ emailAddress: { address: addr } })) || [],
        bccRecipients: email.bcc?.map(addr => ({ emailAddress: { address: addr } })) || [],
        attachments: attachments.map(att => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          ...att
        }))
      }

      const result = await this.graphClient
        .api('/me/sendMail')
        .post({ message })

      return result
    } catch (error) {
      console.error('Error sending email with attachment:', error)
      throw error
    }
  }

  /**
   * Download email attachment
   */
  async downloadEmailAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      const attachment = await this.graphClient
        .api(`/me/messages/${messageId}/attachments/${attachmentId}`)
        .get()

      if (attachment.contentBytes) {
        return Buffer.from(attachment.contentBytes, 'base64')
      }

      throw new Error('Attachment content not available')
    } catch (error) {
      console.error('Error downloading email attachment:', error)
      throw error
    }
  }

  /**
   * Scan file for viruses (placeholder for actual virus scanning integration)
   */
  async scanFileForVirus(file: { buffer: Buffer; originalname: string }): Promise<'clean' | 'infected' | 'error'> {
    try {
      // In production, integrate with Azure Security Center or third-party antivirus API
      // For now, perform basic checks

      // Check file size (extremely large files might be suspicious)
      if (file.buffer.length > 500 * 1024 * 1024) {
        return 'error'
      }

      // Check for common malware signatures (basic example)
      const suspiciousPatterns = [
        Buffer.from('MZ'), // PE executable header
        Buffer.from('!<arch>'), // Unix archive
      ]

      for (const pattern of suspiciousPatterns) {
        if (file.buffer.includes(pattern)) {
          // Additional validation needed - might be legitimate
          console.warn(`Suspicious pattern found in ${file.originalname}`)
        }
      }

      // Default to clean for now
      // TODO: Integrate with actual antivirus service
      return 'clean'
    } catch (error) {
      console.error('Error scanning file:', error)
      return 'error'
    }
  }

  /**
   * Generate thumbnail for image files
   */
  async generateThumbnail(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    containerClient: ContainerClient,
    datePath: string
  ): Promise<string> {
    try {
      if (!file.mimetype.startsWith('image/')) {
        throw new Error('File is not an image')
      }

      // Generate thumbnail using sharp
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Upload thumbnail
      const thumbnailFilename = `thumb_${this.generateUniqueFilename(file.originalname)}.jpg`
      const thumbnailBlobName = `${datePath}/thumbnails/${thumbnailFilename}`
      const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailBlobName)

      await thumbnailBlobClient.uploadData(thumbnailBuffer, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg'
        }
      })

      return thumbnailBlobClient.url
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      return ''
    }
  }

  /**
   * Compress file (for large files)
   */
  async compressFile(file: { buffer: Buffer; originalname: string }): Promise<Buffer> {
    try {
      const zlib = require('zlib')
      const { promisify } = require('util')
      const gzip = promisify(zlib.gzip)

      const compressed = await gzip(file.buffer, { level: 9 })

      console.log(`Compressed ${file.originalname}: ${file.buffer.length} -> ${compressed.length} bytes`)

      return compressed
    } catch (error) {
      console.error('Error compressing file:', error)
      throw error
    }
  }

  /**
   * Clean up orphaned files (files not linked to any communication)
   */
  async cleanupOrphanedFiles(daysOld: number = 30): Promise<number> {
    try {
      // Validate and sanitize daysOld parameter
      const daysOldNum = Math.max(1, Math.min(365, daysOld || 30))

      const result = await pool.query(
        `SELECT blob_url
         FROM communication_attachments
         WHERE communication_id IS NULL
         AND created_at < NOW() - ($1 || ' days')::INTERVAL`,
        [daysOldNum]
      )

      let deletedCount = 0

      for (const row of result.rows) {
        try {
          await this.deleteFromAzure(row.blob_url)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete ${row.blob_url}:`, error)
        }
      }

      // Remove from database
      await pool.query(
        `DELETE FROM communication_attachments
         WHERE communication_id IS NULL
         AND created_at < NOW() - ($1 || ' days')::INTERVAL`,
        [daysOldNum]
      )

      console.log(`✅ Cleaned up ${deletedCount} orphaned files`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error)
      throw error
    }
  }
}

export default new AttachmentService()
