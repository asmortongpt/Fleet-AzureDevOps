/**
 * Azure Computer Vision OCR Service
 *
 * Provides document text extraction using Azure Computer Vision Read API.
 * Supports PDF, JPEG, PNG, BMP, TIFF formats with graceful degradation.
 *
 * Features:
 * - Extract text from uploaded documents (PDFs, images)
 * - Async processing with polling
 * - Confidence scoring
 * - Batch processing capabilities
 * - Graceful degradation without Azure credentials
 */

import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'
import { ApiKeyCredentials } from '@azure/ms-rest-js'
import pool from '../config/database'

// Azure Computer Vision configuration
const AZURE_CV_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT
const AZURE_CV_KEY = process.env.AZURE_COMPUTER_VISION_KEY
const MAX_POLL_ATTEMPTS = 30 // 30 seconds max polling
const POLL_INTERVAL_MS = 1000 // Poll every 1 second

// Supported file types
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/tiff'
]

export interface OcrResult {
  text: string
  confidence: number
  pageCount?: number
  lines?: {
    text: string
    confidence: number
    boundingBox?: number[]
  }[]
}

export interface ProcessingResults {
  successful: string[]
  failed: { documentId: string; error: string }[]
  totalProcessed: number
}

// Lazy initialization of Computer Vision client
let cvClient: ComputerVisionClient | null = null

/**
 * Get or create Computer Vision client
 */
function getComputerVisionClient(): ComputerVisionClient | null {
  if (!AZURE_CV_ENDPOINT || !AZURE_CV_KEY) {
    console.warn('⚠️  Azure Computer Vision not configured. OCR service will return empty results.')
    return null
  }

  if (!cvClient) {
    const credentials = new ApiKeyCredentials({
      inHeader: { 'Ocp-Apim-Subscription-Key': AZURE_CV_KEY }
    })
    cvClient = new ComputerVisionClient(credentials, AZURE_CV_ENDPOINT)
  }

  return cvClient
}

/**
 * Sleep utility for polling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Extract text from document URL using Azure Computer Vision Read API
 *
 * @param blobUrl - Azure Blob Storage URL or public URL of the document
 * @param mimeType - MIME type of the document (e.g., 'application/pdf', 'image/jpeg')
 * @returns Extracted text and confidence score
 */
export async function extractText(
  blobUrl: string,
  mimeType: string
): Promise<OcrResult> {
  const client = getComputerVisionClient()

  // Graceful degradation: return empty result if not configured
  if (!client) {
    console.warn(`OCR skipped for ${blobUrl} - Azure Computer Vision not configured`)
    return {
      text: '',
      confidence: 0,
      pageCount: 0,
      lines: []
    }
  }

  // Validate MIME type
  if (!SUPPORTED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    console.warn(`Unsupported MIME type for OCR: ${mimeType}`)
    return {
      text: '',
      confidence: 0,
      pageCount: 0,
      lines: []
    }
  }

  try {
    // Step 1: Submit the document to Read API using URL
    console.log(`📄 Submitting document for OCR: ${blobUrl}`)
    const readOperation = await client.read(blobUrl)

    // Get operation location from headers
    const operationLocation = readOperation._response?.request?.url || ''
    const operationId = operationLocation.substring(operationLocation.lastIndexOf('/') + 1)

    if (!operationId) {
      throw new Error('Failed to get operation ID from Read API response')
    }

    // Step 2: Poll for completion
    console.log(`⏳ Polling for OCR completion (operation: ${operationId})`)
    let result = await client.getReadResult(operationId)
    let attempts = 0

    while (
      result.status === 'running' ||
      result.status === 'notStarted'
    ) {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error('OCR operation timed out after 30 seconds')
      }

      await sleep(POLL_INTERVAL_MS)
      result = await client.getReadResult(operationId)
      attempts++
    }

    // Step 3: Check for errors
    if (result.status === 'failed') {
      throw new Error('OCR operation failed')
    }

    // Step 4: Extract text from results
    const pages = result.analyzeResult?.readResults || []
    const lines: OcrResult['lines'] = []
    let fullText = ''
    let totalConfidence = 0
    let lineCount = 0

    for (const page of pages) {
      for (const line of page.lines || []) {
        // Note: Azure Computer Vision Read API may not provide line-level confidence
        // Use appearance confidence if available, otherwise default to 0.9
        const lineConfidence = (line as any).confidence || 0.9

        lines.push({
          text: line.text || '',
          confidence: lineConfidence,
          boundingBox: line.boundingBox
        })

        fullText += line.text + '\n'
        totalConfidence += lineConfidence
        lineCount++
      }
    }

    const averageConfidence = lineCount > 0 ? totalConfidence / lineCount : 0

    console.log(`✅ OCR complete: ${lineCount} lines extracted, avg confidence: ${(averageConfidence * 100).toFixed(1)}%`)

    return {
      text: fullText.trim(),
      confidence: averageConfidence,
      pageCount: pages.length,
      lines
    }
  } catch (error) {
    console.error('❌ OCR extraction error:', error)

    // Graceful degradation: log error but don't crash
    return {
      text: '',
      confidence: 0,
      pageCount: 0,
      lines: []
    }
  }
}

/**
 * Process a document and update its OCR text in the database
 *
 * @param documentId - UUID of the document in the documents table
 */
export async function processDocument(documentId: string): Promise<void> {
  try {
    // Fetch document details
    const result = await pool.query(
      `SELECT id, blob_url, mime_type, file_name
       FROM documents
       WHERE id = $1`,
      [documentId]
    )

    if (result.rows.length === 0) {
      throw new Error(`Document not found: ${documentId}`)
    }

    const doc = result.rows[0]
    console.log(`🔍 Processing document: ${doc.file_name} (${doc.mime_type})`)

    // Extract text
    const ocrResult = await extractText(doc.blob_url, doc.mime_type)

    // Update database with OCR text
    await pool.query(
      `UPDATE documents
       SET ocr_text = $1,
           ocr_confidence = $2,
           ocr_processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [ocrResult.text, ocrResult.confidence, documentId]
    )

    console.log(`✅ Document ${documentId} processed successfully`)
  } catch (error) {
    console.error(`❌ Failed to process document ${documentId}:`, error)

    // Update document with error status
    await pool.query(
      `UPDATE documents
       SET ocr_error = $1,
           ocr_processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', documentId]
    )

    throw error
  }
}

/**
 * Batch process multiple documents
 *
 * @param documentIds - Array of document UUIDs to process
 * @returns Results summary with successful and failed documents
 */
export async function batchProcessDocuments(
  documentIds: string[]
): Promise<ProcessingResults> {
  const results: ProcessingResults = {
    successful: [],
    failed: [],
    totalProcessed: 0
  }

  console.log(`📦 Starting batch OCR processing for ${documentIds.length} documents`)

  // Process documents sequentially to avoid rate limits
  for (const documentId of documentIds) {
    try {
      await processDocument(documentId)
      results.successful.push(documentId)
    } catch (error) {
      results.failed.push({
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    results.totalProcessed++
  }

  console.log(
    `✅ Batch processing complete: ${results.successful.length} successful, ${results.failed.length} failed`
  )

  return results
}

/**
 * Get documents that need OCR processing
 *
 * @param tenantId - Tenant ID to filter documents
 * @param limit - Maximum number of documents to return
 * @returns Array of documents pending OCR
 */
export async function getDocumentsPendingOcr(
  tenantId?: string,
  limit: number = 50
): Promise<any[]> {
  const query = tenantId
    ? `SELECT id, file_name, mime_type, blob_url, created_at
       FROM documents
       WHERE tenant_id = $1
         AND ocr_text IS NULL
         AND ocr_error IS NULL
         AND mime_type = ANY($2)
       ORDER BY created_at ASC
       LIMIT $3`
    : `SELECT id, file_name, mime_type, blob_url, created_at
       FROM documents
       WHERE ocr_text IS NULL
         AND ocr_error IS NULL
         AND mime_type = ANY($1)
       ORDER BY created_at ASC
       LIMIT $2`

  const params = tenantId
    ? [tenantId, SUPPORTED_MIME_TYPES, limit]
    : [SUPPORTED_MIME_TYPES, limit]

  const result = await pool.query(query, params)
  return result.rows
}

/**
 * Check if Azure Computer Vision is configured
 */
export function isOcrConfigured(): boolean {
  return !!(AZURE_CV_ENDPOINT && AZURE_CV_KEY)
}

/**
 * Get OCR service status
 */
export function getOcrStatus() {
  return {
    configured: isOcrConfigured(),
    endpoint: AZURE_CV_ENDPOINT ? '***configured***' : 'not configured',
    supportedFormats: SUPPORTED_MIME_TYPES
  }
}

export default {
  extractText,
  processDocument,
  batchProcessDocuments,
  getDocumentsPendingOcr,
  isOcrConfigured,
  getOcrStatus,
  SUPPORTED_MIME_TYPES
}
