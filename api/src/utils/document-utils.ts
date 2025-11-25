/**
 * Document Utilities
 * Helper functions for document processing, hashing, and validation
 */

import crypto from 'crypto'
import path from 'path'

// ============================================================================
// HASHING UTILITIES
// ============================================================================

/**
 * Generate SHA-256 hash of file content
 */
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Generate MD5 hash (for ETag or quick comparisons)
 */
export function generateMD5Hash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex')
}

/**
 * Generate secure random token for sharing
 */
export function generateShareToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash password for share protection
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err)
      resolve(salt + ':' + derivedKey.toString('hex'))
    })
  })
}

/**
 * Verify password hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':')
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err)
      resolve(key === derivedKey.toString('hex'))
    })
  })
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Generate unique filename with timestamp and random hash
 */
export function generateUniqueFileName(originalName: string): string {
  const ext = path.extname(originalName)
  const timestamp = Date.now()
  const randomHash = crypto.randomBytes(8).toString('hex')
  return `${timestamp}-${randomHash}${ext}`
}

/**
 * Get safe filename (remove special characters)
 */
export function getSafeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

/**
 * Get file extension from mimetype
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'application/json': '.json',
    'application/xml': '.xml',
    'text/html': '.html',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav'
  }

  return mimeToExt[mimeType] || ''
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number = 100 * 1024 * 1024 // 100MB default
): { valid: boolean; error?: string } {
  if (size <= 0) {
    return { valid: false, error: 'File size must be greater than 0' }
  }

  if (size > maxSize) {
    return {
      valid: false,
      error: `File size ${formatBytes(size)} exceeds maximum allowed size ${formatBytes(maxSize)}`
    }
  }

  return { valid: true }
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes || allowedTypes.length === 0) {
    return { valid: true }
  }

  const isAllowed = allowedTypes.some(allowed => {
    // Support wildcards like "image/*"
    if (allowed.endsWith('/*')) {
      const prefix = allowed.replace('/*', '')
      return mimeType.startsWith(prefix)
    }
    return mimeType === allowed
  })

  if (!isAllowed) {
    return {
      valid: false,
      error: 'File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}'
    }
  }

  return { valid: true }
}

/**
 * Check if file needs OCR processing
 */
export function needsOCR(mimeType: string): boolean {
  const ocrTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/bmp'
  ]
  return ocrTypes.includes(mimeType)
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Check if file is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
  return documentTypes.includes(mimeType)
}

/**
 * Check if file is a video
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Check if file is audio
 */
export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Format file count
 */
export function formatFileCount(count: number): string {
  if (count === 0) return 'No files'
  if (count === 1) return '1 file'
  return `${count.toLocaleString()} files`
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType: string): string {
  if (isImageFile(mimeType)) return 'Image'
  if (isVideoFile(mimeType)) return 'Video'
  if (isAudioFile(mimeType)) return 'Music'

  const iconMap: Record<string, string> = {
    'application/pdf': 'FileText',
    'application/msword': 'FileText',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FileText',
    'application/vnd.ms-excel': 'Table',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Table',
    'application/vnd.ms-powerpoint': 'Presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentation',
    'text/plain': 'FileText',
    'text/csv': 'Table',
    'application/zip': 'Archive',
    'application/x-rar-compressed': 'Archive',
    'application/json': 'Code',
    'application/xml': 'Code',
    'text/html': 'Code'
  }

  return iconMap[mimeType] || 'File'
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Build safe file path
 */
export function buildFilePath(
  basePath: string,
  tenantId: string,
  fileName: string
): string {
  // Sanitize inputs
  const safeTenantId = tenantId.replace(/[^a-zA-Z0-9-]/g, '')
  const safeFileName = getSafeFileName(fileName)

  return path.join(basePath, safeTenantId, safeFileName)
}

/**
 * Build folder path from folder hierarchy
 */
export function buildFolderPath(folders: Array<{ id: string; name: string }>): string {
  return '/' + folders.map(f => f.name).join('/')
}

/**
 * Parse folder path to components
 */
export function parseFolderPath(folderPath: string): string[] {
  return folderPath.split('/').filter(p => p.length > 0)
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate folder name
 */
export function validateFolderName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Folder name cannot be empty' }
  }

  if (name.length > 255) {
    return { valid: false, error: 'Folder name cannot exceed 255 characters' }
  }

  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
    return {
      valid: false,
      error: 'Folder name can only contain letters, numbers, spaces, hyphens, and underscores'
    }
  }

  return { valid: true }
}

/**
 * Validate document metadata
 */
export function validateMetadata(
  metadata: any
): { valid: boolean; error?: string } {
  if (metadata === null || metadata === undefined) {
    return { valid: true }
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { valid: false, error: 'Metadata must be an object' }
  }

  try {
    // Check if it's JSON serializable
    JSON.stringify(metadata)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Metadata must be JSON serializable' }
  }
}

/**
 * Validate tags
 */
export function validateTags(tags: any): { valid: boolean; error?: string } {
  if (!tags) {
    return { valid: true }
  }

  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' }
  }

  if (tags.length > 50) {
    return { valid: false, error: 'Maximum 50 tags allowed' }
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { valid: false, error: 'All tags must be strings' }
    }

    if (tag.length > 50) {
      return { valid: false, error: 'Tag length cannot exceed 50 characters' }
    }
  }

  return { valid: true }
}

// ============================================================================
// CONTENT DETECTION
// ============================================================================

/**
 * Detect if content is text-based and can be indexed
 */
export function isTextIndexable(mimeType: string): boolean {
  const indexableTypes = [
    'text/plain',
    'text/csv',
    'text/html',
    'text/xml',
    'application/json',
    'application/xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  return indexableTypes.includes(mimeType)
}

/**
 * Get content category from mime type
 */
export function getContentCategory(mimeType: string): string {
  if (isImageFile(mimeType)) return 'Images'
  if (isVideoFile(mimeType)) return 'Videos'
  if (isAudioFile(mimeType)) return 'Audio'
  if (isDocumentFile(mimeType)) return 'Documents'

  if (mimeType.startsWith('text/')) return 'Text Files'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return 'Archives'
  }

  return 'Other'
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Check if timestamp is expired
 */
export function isExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false
  return new Date() > new Date(expiresAt)
}

/**
 * Get expiration in hours
 */
export function getExpirationHours(expiresAt?: Date): number | null {
  if (!expiresAt) return null

  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()

  if (diffMs <= 0) return 0

  return Math.ceil(diffMs / (1000 * 60 * 60))
}
