/**
 * AI OCR Service
 * Azure Computer Vision integration for OCR, image analysis, and document processing
 */

import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'
import { CognitiveServicesCredentials } from '@azure/ms-rest-js'
import { BlobServiceClient } from '@azure/storage-blob'
import pool from '../config/database'
import { logger } from '../utils/logger'
import sharp from 'sharp'

export interface OCRResult {
  text: string
  confidence: number
  language: string
  lines: OCRLine[]
  metadata: {
    width: number
    height: number
    pages: number
    processingTimeMs: number
  }
}

export interface OCRLine {
  text: string
  boundingBox: number[]
  confidence: number
  words: OCRWord[]
}

export interface OCRWord {
  text: string
  boundingBox: number[]
  confidence: number
}

export interface ImageAnalysisResult {
  description: string
  tags: string[]
  objects: DetectedObject[]
  text: string
  metadata: {
    width: number
    height: number
    format: string
  }
}

export interface DetectedObject {
  name: string
  confidence: number
  boundingBox: { x: number; y: number; w: number; h: number }
}

export interface DocumentAnalysisResult {
  documentType: 'invoice' | 'receipt' | 'form' | 'license' | 'registration' | 'unknown'
  extractedFields: Record<string, any>
  rawText: string
  confidence: number
}

class AIOCRService {
  private visionClient: ComputerVisionClient | null = null
  private blobServiceClient: BlobServiceClient | null = null
  private readonly containerName = 'ocr-processing'

  constructor() {
    this.initializeClients()
  }

  /**
   * Initialize Azure clients
   */
  private initializeClients(): void {
    try {
      // Initialize Computer Vision client
      const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT
      const apiKey = process.env.AZURE_COMPUTER_VISION_KEY

      if (endpoint && apiKey) {
        const credentials = new CognitiveServicesCredentials(apiKey)
        this.visionClient = new ComputerVisionClient(credentials, endpoint)
        logger.info('Azure Computer Vision client initialized')
      } else {
        logger.warn('Azure Computer Vision credentials not configured')
      }

      // Initialize Blob Storage client
      const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING

      if (storageConnectionString) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString)
        this.ensureContainer()
        logger.info('Azure Blob Storage client initialized')
      } else {
        logger.warn('Azure Blob Storage connection string not configured')
      }
    } catch (error) {
      logger.error('Failed to initialize Azure clients:', error)
    }
  }

  /**
   * Ensure OCR processing container exists
   */
  private async ensureContainer(): Promise<void> {
    try {
      if (!this.blobServiceClient) return

      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      await containerClient.createIfNotExists({
        access: 'private'
      })
    } catch (error) {
      logger.error('Failed to create container:', error)
    }
  }

  /**
   * Perform OCR on image buffer
   */
  async performOCR(
    imageBuffer: Buffer,
    tenantId: string,
    options: { language?: string } = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      if (!this.visionClient) {
        throw new Error('Azure Computer Vision client not initialized')
      }

      // Optimize image
      const optimizedImage = await this.optimizeImage(imageBuffer)

      // Upload to blob storage for processing
      const blobUrl = await this.uploadToBlob(optimizedImage, tenantId)

      // Perform OCR using Read API
      const readResult = await this.visionClient.read(blobUrl)

      // Get operation location
      const operationLocation = readResult.operationLocation
      const operationId = operationLocation.split('/').pop()

      if (!operationId) {
        throw new Error('Failed to get operation ID')
      }

      // Poll for result
      let result
      let status = 'running'
      while (status === 'running' || status === 'notStarted') {
        await this.delay(1000)
        result = await this.visionClient.getReadResult(operationId)
        status = result.status
      }

      if (status !== 'succeeded') {
        throw new Error(`OCR failed with status: ${status}`)
      }

      // Extract text and metadata
      const lines: OCRLine[] = []
      let fullText = ''

      if (result.analyzeResult?.readResults) {
        for (const page of result.analyzeResult.readResults) {
          for (const line of page.lines) {
            const words: OCRWord[] = line.words.map((word) => ({
              text: word.text,
              boundingBox: word.boundingBox || [],
              confidence: word.confidence || 0
            }))

            lines.push({
              text: line.text,
              boundingBox: line.boundingBox || [],
              confidence: words.reduce((sum, w) => sum + w.confidence, 0) / words.length,
              words
            })

            fullText += line.text + '\n'
          }
        }
      }

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata()

      const ocrResult: OCRResult = {
        text: fullText.trim(),
        confidence:
          lines.reduce((sum, line) => sum + line.confidence, 0) / (lines.length || 1),
        language: options.language || 'en',
        lines,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          pages: result.analyzeResult?.readResults?.length || 1,
          processingTimeMs: Date.now() - startTime
        }
      }

      // Store result in database
      await this.storeOCRResult(tenantId, ocrResult)

      logger.info('OCR completed successfully', {
        tenantId,
        textLength: fullText.length,
        linesCount: lines.length,
        confidence: ocrResult.confidence,
        processingTimeMs: ocrResult.metadata.processingTimeMs
      })

      return ocrResult
    } catch (error: any) {
      logger.error('OCR failed:', error)
      throw new Error(`OCR processing failed: ${error.message}`)
    }
  }

  /**
   * Analyze image content
   */
  async analyzeImage(
    imageBuffer: Buffer,
    tenantId: string
  ): Promise<ImageAnalysisResult> {
    try {
      if (!this.visionClient) {
        throw new Error('Azure Computer Vision client not initialized')
      }

      // Upload to blob
      const blobUrl = await this.uploadToBlob(imageBuffer, tenantId)

      // Analyze image
      const analysis = await this.visionClient.analyzeImage(blobUrl, {
        visualFeatures: ['Description', 'Tags', 'Objects'],
        language: 'en'
      })

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata()

      // Extract OCR text
      const ocrResult = await this.performOCR(imageBuffer, tenantId)

      return {
        description: analysis.description?.captions?.[0]?.text || '',
        tags: analysis.tags?.map((tag) => tag.name) || [],
        objects:
          analysis.objects?.map((obj) => ({
            name: obj.object || '',
            confidence: obj.confidence || 0,
            boundingBox: {
              x: obj.rectangle?.x || 0,
              y: obj.rectangle?.y || 0,
              w: obj.rectangle?.w || 0,
              h: obj.rectangle?.h || 0
            }
          })) || [],
        text: ocrResult.text,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown'
        }
      }
    } catch (error: any) {
      logger.error('Image analysis failed:', error)
      throw new Error(`Image analysis failed: ${error.message}`)
    }
  }

  /**
   * Analyze document (invoice, receipt, form, etc.)
   */
  async analyzeDocument(
    imageBuffer: Buffer,
    tenantId: string,
    documentHint?: string
  ): Promise<DocumentAnalysisResult> {
    try {
      // Perform OCR
      const ocrResult = await this.performOCR(imageBuffer, tenantId)

      // Detect document type
      const documentType = this.detectDocumentType(ocrResult.text, documentHint)

      // Extract fields based on document type
      const extractedFields = await this.extractDocumentFields(
        ocrResult.text,
        documentType,
        ocrResult.lines
      )

      return {
        documentType,
        extractedFields,
        rawText: ocrResult.text,
        confidence: ocrResult.confidence
      }
    } catch (error: any) {
      logger.error('Document analysis failed:', error)
      throw new Error(`Document analysis failed: ${error.message}`)
    }
  }

  /**
   * Detect document type from text content
   */
  private detectDocumentType(
    text: string,
    hint?: string
  ): 'invoice' | 'receipt' | 'form' | 'license' | 'registration' | 'unknown' {
    const lowerText = text.toLowerCase()

    if (hint) {
      const hintLower = hint.toLowerCase()
      if (
        ['invoice', 'receipt', 'form', 'license', 'registration'].includes(hintLower)
      ) {
        return hintLower as any
      }
    }

    // Invoice detection
    if (
      lowerText.includes('invoice') ||
      (lowerText.includes('bill to') && lowerText.includes('total'))
    ) {
      return 'invoice'
    }

    // Receipt detection
    if (lowerText.includes('receipt') || lowerText.includes('transaction')) {
      return 'receipt'
    }

    // Driver's license detection
    if (
      lowerText.includes("driver's license") ||
      lowerText.includes('drivers license') ||
      lowerText.includes('dl no')
    ) {
      return 'license'
    }

    // Vehicle registration detection
    if (
      lowerText.includes('registration') ||
      lowerText.includes('license plate') ||
      lowerText.includes('vin')
    ) {
      return 'registration'
    }

    return 'unknown'
  }

  /**
   * Extract structured fields from document
   */
  private async extractDocumentFields(
    text: string,
    documentType: string,
    lines: OCRLine[]
  ): Promise<Record<string, any>> {
    const fields: Record<string, any> = {}

    switch (documentType) {
      case 'invoice':
        fields.invoiceNumber = this.extractPattern(text, /invoice\s*#?\s*(\S+)/i)
        fields.invoiceDate = this.extractPattern(text, /date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
        fields.totalAmount = this.extractPattern(text, /total[:\s]+\$?(\d+\.?\d*)/i)
        break

      case 'receipt':
        fields.merchantName = lines[0]?.text || ''
        fields.transactionDate = this.extractPattern(text, /(\d{1,2}\/\d{1,2}\/\d{2,4})/)
        fields.total = this.extractPattern(text, /total[:\s]+\$?(\d+\.?\d*)/i)
        break

      case 'license':
        fields.licenseNumber = this.extractPattern(text, /(?:dl|license)\s*#?\s*(\S+)/i)
        fields.fullName = this.extractName(text)
        fields.dateOfBirth = this.extractPattern(text, /dob[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
        fields.expirationDate = this.extractPattern(text, /exp[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
        break

      case 'registration':
        fields.plateNumber = this.extractPattern(text, /plate[:\s]+(\S+)/i)
        fields.vin = this.extractPattern(text, /vin[:\s]+([A-HJ-NPR-Z0-9]{17})/i)
        fields.make = this.extractPattern(text, /make[:\s]+(\w+)/i)
        fields.model = this.extractPattern(text, /model[:\s]+(\w+)/i)
        fields.year = this.extractPattern(text, /year[:\s]+(\d{4})/i)
        break
    }

    return fields
  }

  /**
   * Extract pattern from text
   */
  private extractPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern)
    return match ? match[1] : null
  }

  /**
   * Extract name from text (simple heuristic)
   */
  private extractName(text: string): string | null {
    // Look for capitalized words that might be names
    const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/
    const match = text.match(namePattern)
    return match ? match[1] : null
  }

  /**
   * Optimize image for OCR
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(3000, 3000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .greyscale()
        .normalize()
        .sharpen()
        .png({ compressionLevel: 6 })
        .toBuffer()
    } catch (error) {
      logger.warn('Image optimization failed, using original:', error)
      return imageBuffer
    }
  }

  /**
   * Upload image to blob storage
   */
  private async uploadToBlob(imageBuffer: Buffer, tenantId: string): Promise<string> {
    try {
      if (!this.blobServiceClient) {
        throw new Error('Blob service client not initialized')
      }

      const containerClient = this.blobServiceClient.getContainerClient(this.containerName)
      const blobName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'image/png' }
      })

      return blockBlobClient.url
    } catch (error: any) {
      logger.error('Failed to upload to blob:', error)
      throw new Error(`Blob upload failed: ${error.message}`)
    }
  }

  /**
   * Store OCR result in database
   */
  private async storeOCRResult(tenantId: string, result: OCRResult): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ocr_results (
          tenant_id, text, confidence, language, lines_count,
          processing_time_ms, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          tenantId,
          result.text,
          result.confidence,
          result.language,
          result.lines.length,
          result.metadata.processingTimeMs
        ]
      )
    } catch (error) {
      logger.error('Failed to store OCR result:', error)
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get OCR statistics
   */
  async getStatistics(tenantId: string): Promise<{
    totalProcessed: number
    averageConfidence: number
    averageProcessingTime: number
  }> {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_processed,
          AVG(confidence) as avg_confidence,
          AVG(processing_time_ms) as avg_processing_time
         FROM ocr_results
         WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
        [tenantId]
      )

      return {
        totalProcessed: parseInt(result.rows[0].total_processed) || 0,
        averageConfidence: parseFloat(result.rows[0].avg_confidence) || 0,
        averageProcessingTime: parseFloat(result.rows[0].avg_processing_time) || 0
      }
    } catch (error) {
      logger.error('Failed to get OCR statistics:', error)
      return {
        totalProcessed: 0,
        averageConfidence: 0,
        averageProcessingTime: 0
      }
    }
  }
}

export default new AIOCRService()
