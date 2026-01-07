// OCR Service - Optical Character Recognition
// Using Tesseract.js for text extraction from images and PDFs

import * as fs from 'fs'

import { createWorker, Worker, RecognizeResult } from 'tesseract.js'

import {
  OCRConfig,
  OCRResult,
  OCRBlock,
  OCRParagraph,
  OCRWord,
  BoundingBox
} from './types'

/**
 * OCR Service for extracting text from images and scanned documents
 */
export class OCRService {
  private workers: Map<string, Worker> = new Map()
  private maxWorkers: number = 4
  private workerQueue: string[] = []

  constructor() {
    this.initializeWorkers()
  }

  /**
   * Initialize OCR workers for parallel processing
   */
  private async initializeWorkers(): Promise<void> {
    console.log('[OCR] Initializing Tesseract workers...')

    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = await createWorker()
        await worker.loadLanguage('eng')
        await worker.initialize('eng')

        const workerId = `worker-${i}`
        this.workers.set(workerId, worker)
        this.workerQueue.push(workerId)

        console.log(`[OCR] Worker ${workerId} initialized`)
      } catch (error) {
        console.error(`[OCR] Failed to initialize worker ${i}:`, error)
      }
    }

    console.log(`[OCR] ${this.workers.size} workers ready`)
  }

  /**
   * Get an available worker from the pool
   */
  private async getWorker(): Promise<{ worker: Worker; workerId: string }> {
    // Wait for an available worker
    while (this.workerQueue.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const workerId = this.workerQueue.shift()!
    const worker = this.workers.get(workerId)!

    return { worker, workerId }
  }

  /**
   * Return a worker to the pool
   */
  private releaseWorker(workerId: string): void {
    this.workerQueue.push(workerId)
  }

  /**
   * Extract text from an image file using OCR
   */
  async extractTextFromImage(
    imagePath: string,
    config: OCRConfig = { language: 'eng' }
  ): Promise<OCRResult> {
    const startTime = Date.now()
    let workerId: string | null = null

    try {
      // Get worker
      const { worker, workerId: id } = await getWorker()
      workerId = id

      // Set language if different
      if (config.language !== 'eng') {
        const languages = Array.isArray(config.language)
          ? config.language.join('+')
          : config.language

        await worker.loadLanguage(languages)
        await worker.initialize(languages)
      }

      // Perform OCR
      const result: RecognizeResult = await worker.recognize(imagePath, {
        rectangle: config.rectangles?.[0]
      })

      // Parse result
      const ocrResult: OCRResult = {
        text: result.data.text,
        confidence: result.data.confidence,
        language: config.language as string,
        blocks: this.parseBlocks(result.data.blocks),
        words: this.parseWords(result.data.words),
        processingTime: Date.now() - startTime
      }

      return ocrResult

    } catch (error) {
      console.error('[OCR] Error extracting text:', error)
      throw new Error(`OCR extraction failed: ${error}`)
    } finally {
      if (workerId) {
        this.releaseWorker(workerId)
      }
    }
  }

  /**
   * Extract text from multiple images in parallel
   */
  async extractTextFromImages(
    imagePaths: string[],
    config: OCRConfig = { language: 'eng' }
  ): Promise<OCRResult[]> {
    const promises = imagePaths.map(imagePath =>
      this.extractTextFromImage(imagePath, config)
    )

    return Promise.all(promises)
  }

  /**
   * Extract text from a PDF file (page by page)
   */
  async extractTextFromPDF(
    pdfPath: string,
    config: OCRConfig = { language: 'eng' }
  ): Promise<OCRResult[]> {
    // This would require pdf-to-image conversion first
    // Using pdf-poppler or similar library

    try {
      // Convert PDF pages to images
      const imagePages = await this.convertPDFToImages(pdfPath)

      // Extract text from each page
      const results = await this.extractTextFromImages(imagePages, config)

      // Clean up temporary images
      this.cleanupTempFiles(imagePages)

      return results

    } catch (error) {
      console.error('[OCR] Error extracting text from PDF:', error)
      throw new Error(`PDF OCR extraction failed: ${error}`)
    }
  }

  /**
   * Detect language in an image
   */
  async detectLanguage(imagePath: string): Promise<string> {
    const { worker, workerId } = await this.getWorker()

    try {
      const result = await worker.detect(imagePath)
      return result.data.languages[0]?.code || 'eng'
    } finally {
      this.releaseWorker(workerId)
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(imagePath: string): Promise<string> {
    // Using sharp or jimp for image preprocessing
    // - Grayscale conversion
    // - Contrast enhancement
    // - Noise reduction
    // - Deskew/Rotation correction

    // For now, return original path
    // TODO: Implement image preprocessing
    return imagePath
  }

  /**
   * Parse OCR blocks from Tesseract result
   */
  private parseBlocks(blocks: any[]): OCRBlock[] {
    if (!blocks) return []

    return blocks.map(block => ({
      text: block.text,
      confidence: block.confidence,
      boundingBox: this.parseBoundingBox(block.bbox),
      paragraphs: this.parseParagraphs(block.paragraphs || [])
    }))
  }

  /**
   * Parse OCR paragraphs
   */
  private parseParagraphs(paragraphs: any[]): OCRParagraph[] {
    return paragraphs.map(para => ({
      text: para.text,
      confidence: para.confidence,
      boundingBox: this.parseBoundingBox(para.bbox),
      words: this.parseWords(para.words || [])
    }))
  }

  /**
   * Parse OCR words
   */
  private parseWords(words: any[]): OCRWord[] {
    if (!words) return []

    return words.map(word => ({
      text: word.text,
      confidence: word.confidence,
      boundingBox: this.parseBoundingBox(word.bbox)
    }))
  }

  /**
   * Parse bounding box
   */
  private parseBoundingBox(bbox: any): BoundingBox {
    return {
      x: bbox.x0,
      y: bbox.y0,
      width: bbox.x1 - bbox.x0,
      height: bbox.y1 - bbox.y0
    }
  }

  /**
   * Convert PDF pages to images
   */
  private async convertPDFToImages(pdfPath: string): Promise<string[]> {
    // This would use a library like pdf-poppler or pdf2pic
    // For now, return empty array as placeholder
    // TODO: Implement PDF to image conversion
    return []
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (error) {
        console.error(`[OCR] Failed to delete temp file ${filePath}:`, error)
      }
    })
  }

  /**
   * Terminate all OCR workers
   */
  async terminate(): Promise<void> {
    console.log('[OCR] Terminating workers...')

    const terminatePromises = Array.from(this.workers.values()).map(worker =>
      worker.terminate()
    )

    await Promise.all(terminatePromises)
    this.workers.clear()
    this.workerQueue = []

    console.log('[OCR] All workers terminated')
  }
}

// Singleton instance
let ocrServiceInstance: OCRService | null = null

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService()
  }
  return ocrServiceInstance
}

// Helper function to access worker
async function getWorker(): Promise<{ worker: Worker; workerId: string }> {
  const service = getOCRService()
  return (service as any).getWorker()
}
