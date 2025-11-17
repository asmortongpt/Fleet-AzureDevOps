/**
 * OCR Service Tests
 *
 * Tests for Azure Computer Vision OCR service
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  extractText,
  processDocument,
  batchProcessDocuments,
  isOcrConfigured,
  getOcrStatus,
  SUPPORTED_MIME_TYPES
} from '../src/services/ocr.service'

describe('OCR Service', () => {
  describe('Configuration', () => {
    it('should report configuration status', () => {
      const status = getOcrStatus()
      expect(status).toHaveProperty('configured')
      expect(status).toHaveProperty('endpoint')
      expect(status).toHaveProperty('supportedFormats')
      expect(status.supportedFormats).toEqual(SUPPORTED_MIME_TYPES)
    })

    it('should check if OCR is configured', () => {
      const configured = isOcrConfigured()
      expect(typeof configured).toBe('boolean')
    })
  })

  describe('Supported Formats', () => {
    it('should support common document formats', () => {
      expect(SUPPORTED_MIME_TYPES).toContain('application/pdf')
      expect(SUPPORTED_MIME_TYPES).toContain('image/jpeg')
      expect(SUPPORTED_MIME_TYPES).toContain('image/png')
      expect(SUPPORTED_MIME_TYPES).toContain('image/bmp')
      expect(SUPPORTED_MIME_TYPES).toContain('image/tiff')
    })
  })

  describe('Graceful Degradation', () => {
    it('should return empty result for unsupported MIME types', async () => {
      const result = await extractText('https://example.com/doc.txt', 'text/plain')

      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('pageCount')
      expect(result).toHaveProperty('lines')

      expect(result.text).toBe('')
      expect(result.confidence).toBe(0)
    })

    it('should handle missing Azure credentials gracefully', async () => {
      // This test verifies graceful degradation when Azure CV is not configured
      // It should not throw an error, but return empty results

      const result = await extractText(
        'https://example.com/sample.pdf',
        'application/pdf'
      )

      expect(result).toBeDefined()
      expect(result.text).toBeDefined()
      expect(result.confidence).toBeDefined()

      // Without credentials, should return empty result
      if (!isOcrConfigured()) {
        expect(result.text).toBe('')
        expect(result.confidence).toBe(0)
      }
    })
  })

  describe('Data Structure', () => {
    it('should return correct OcrResult structure', async () => {
      const result = await extractText('https://example.com/test.jpg', 'image/jpeg')

      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('pageCount')
      expect(result).toHaveProperty('lines')

      expect(typeof result.text).toBe('string')
      expect(typeof result.confidence).toBe('number')
      expect(typeof result.pageCount).toBe('number')
      expect(Array.isArray(result.lines)).toBe(true)
    })
  })

  // Skip integration tests if OCR is not configured
  describe.skipIf(!isOcrConfigured())('Integration Tests', () => {
    it('should process a real document (if configured)', async () => {
      // This test only runs if Azure Computer Vision is configured
      // Replace with a real test document URL
      const testDocUrl = process.env.TEST_DOCUMENT_URL

      if (testDocUrl) {
        const result = await extractText(testDocUrl, 'image/jpeg')

        expect(result.confidence).toBeGreaterThan(0)
        expect(result.text.length).toBeGreaterThan(0)
      }
    }, { timeout: 35000 }) // Allow extra time for API calls
  })
})

describe('Batch Processing', () => {
  it('should return valid ProcessingResults structure', async () => {
    const result = await batchProcessDocuments([])

    expect(result).toHaveProperty('successful')
    expect(result).toHaveProperty('failed')
    expect(result).toHaveProperty('totalProcessed')

    expect(Array.isArray(result.successful)).toBe(true)
    expect(Array.isArray(result.failed)).toBe(true)
    expect(result.totalProcessed).toBe(0)
  })
})
