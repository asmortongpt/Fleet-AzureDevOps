import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import path from 'path'

/**
 * File Validation Utilities
 *
 * Implements secure file validation using magic bytes (file signatures)
 * instead of relying on MIME types which can be spoofed
 */

// Allowed file types with their MIME types and extensions
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],

  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],

  // Videos (for damage analysis)
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi']
}

// Maximum file sizes by category (in bytes)
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB for images (reduced from 50MB)
  document: 10 * 1024 * 1024, // 10MB for documents
  video: 50 * 1024 * 1024 // 50MB for videos (AI analysis videos)
}

/**
 * Validate file content using magic bytes
 * @param buffer File buffer
 * @returns Validation result with file type info
 */
export async function validateFileContent(buffer: Buffer): Promise<{
  valid: boolean
  mimeType?: string
  extension?: string
  error?: string
}> {
  try {
    // Check file type using magic bytes
    const fileType = await fileTypeFromBuffer(buffer)

    if (!fileType) {
      return {
        valid: false,
        error: 'Unable to determine file type from content'
      }
    }

    // Check if file type is allowed
    if (!ALLOWED_FILE_TYPES[fileType.mime as keyof typeof ALLOWED_FILE_TYPES]) {
      return {
        valid: false,
        error: `File type ${fileType.mime} is not allowed`
      }
    }

    return {
      valid: true,
      mimeType: fileType.mime,
      extension: fileType.ext
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'File validation failed'
    }
  }
}

/**
 * Validate file size based on file type
 * @param buffer File buffer
 * @param fileType File MIME type
 * @returns Validation result
 */
export function validateFileSize(buffer: Buffer, fileType: string): {
  valid: boolean
  error?: string
} {
  const size = buffer.length

  // Determine category and max size
  let maxSize: number
  if (fileType.startsWith('image/')) {
    maxSize = MAX_FILE_SIZES.image
  } else if (fileType.startsWith('video/')) {
    maxSize = MAX_FILE_SIZES.video
  } else {
    maxSize = MAX_FILE_SIZES.document
  }

  if (size > maxSize) {
    return {
      valid: false,
      error: `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`
    }
  }

  return { valid: true }
}

/**
 * Generate a secure, unique filename
 * Uses cryptographic random UUID to prevent filename collisions and path traversal attacks
 * @param originalExtension Original file extension (optional, will be validated)
 * @param detectedExtension Extension detected from file content
 * @returns Secure filename
 */
export function generateSecureFilename(originalExtension?: string, detectedExtension?: string): string {
  // Generate cryptographically secure random filename
  const randomBytes = crypto.randomBytes(16)
  const uuid = randomBytes.toString('hex')

  // Use detected extension from magic bytes, not from original filename
  const ext = detectedExtension || 'bin'

  // Sanitize extension - remove any path components
  const sanitizedExt = path.extname(`.${ext}`).toLowerCase()

  return `${uuid}${sanitizedExt}`
}

/**
 * Comprehensive file validation
 * @param buffer File buffer
 * @param originalFilename Original filename (for logging only, not used for validation)
 * @returns Validation result with secure filename
 */
export async function validateFile(buffer: Buffer, originalFilename: string): Promise<{
  valid: boolean
  secureFilename?: string
  mimeType?: string
  error?: string
}> {
  // Validate file content using magic bytes
  const contentValidation = await validateFileContent(buffer)
  if (!contentValidation.valid) {
    return contentValidation
  }

  // Validate file size
  const sizeValidation = validateFileSize(buffer, contentValidation.mimeType!)
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  // Generate secure filename
  const secureFilename = generateSecureFilename(
    path.extname(originalFilename),
    contentValidation.extension
  )

  return {
    valid: true,
    secureFilename,
    mimeType: contentValidation.mimeType
  }
}

/**
 * Virus scanning placeholder
 * In production, this would integrate with ClamAV, Windows Defender API,
 * or cloud-based services like VirusTotal, MetaDefender, etc.
 * @param buffer File buffer
 * @param filename Filename for logging
 * @returns Scan result
 */
export async function scanForVirus(buffer: Buffer, filename: string): Promise<{
  clean: boolean
  threat?: string
  error?: string
}> {
  // TODO: Integrate with actual virus scanning service
  // For now, implement basic heuristics:

  // 1. Check file size - extremely large files might be suspicious
  if (buffer.length > 100 * 1024 * 1024) { // 100MB
    return {
      clean: false,
      threat: 'File exceeds maximum size for scanning'
    }
  }

  // 2. Check for common malware signatures (very basic example)
  // In production, use a real AV engine
  const content = buffer.toString('binary')
  const suspiciousPatterns = [
    'eval(',
    '<script',
    'javascript:',
    'vbscript:',
    'onclick=',
    'onerror='
  ]

  for (const pattern of suspiciousPatterns) {
    if (content.includes(pattern)) {
      return {
        clean: false,
        threat: `Potentially malicious content detected: ${pattern}`
      }
    }
  }

  // Placeholder - in production, call actual AV service
  console.log(`[VIRUS_SCAN] Placeholder scan for ${filename} - would call ClamAV/VirusTotal here`)

  return {
    clean: true
  }
}

/**
 * Complete file security validation pipeline
 * @param buffer File buffer
 * @param originalFilename Original filename
 * @returns Complete validation result
 */
export async function secureFileValidation(buffer: Buffer, originalFilename: string): Promise<{
  valid: boolean
  secureFilename?: string
  mimeType?: string
  virusScanResult?: { clean: boolean; threat?: string }
  error?: string
}> {
  // Step 1: Validate file content and size
  const validation = await validateFile(buffer, originalFilename)
  if (!validation.valid) {
    return validation
  }

  // Step 2: Virus scan
  const virusScanResult = await scanForVirus(buffer, validation.secureFilename!)
  if (!virusScanResult.clean) {
    return {
      valid: false,
      error: `File failed security scan: ${virusScanResult.threat}`,
      virusScanResult
    }
  }

  return {
    valid: true,
    secureFilename: validation.secureFilename,
    mimeType: validation.mimeType,
    virusScanResult
  }
}
