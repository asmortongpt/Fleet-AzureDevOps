/**
 * OCR Service Usage Example
 *
 * Demonstrates how to use the Azure Computer Vision OCR service
 */

import {
  extractText,
  processDocument,
  batchProcessDocuments,
  getDocumentsPendingOcr,
  isOcrConfigured,
  getOcrStatus
} from '../services/ocr.service'

async function main() {
  console.log('=== Azure Computer Vision OCR Service ===\n')

  // Check configuration status
  console.log('1. Configuration Status:')
  const status = getOcrStatus()
  console.log(JSON.stringify(status, null, 2))
  console.log()

  if (!isOcrConfigured()) {
    console.log('⚠️  Azure Computer Vision is not configured.')
    console.log('To configure, set these environment variables:')
    console.log('  - AZURE_COMPUTER_VISION_ENDPOINT')
    console.log('  - AZURE_COMPUTER_VISION_KEY')
    console.log()
    console.log('The service will gracefully degrade and return empty results.')
    console.log()
  }

  // Example 1: Extract text from a single document
  console.log('2. Single Document OCR:')
  const samplePdfUrl = 'https://example.com/sample-invoice.pdf'
  console.log(`Processing: ${samplePdfUrl}`)

  const result = await extractText(samplePdfUrl, 'application/pdf')
  console.log('Result:', {
    textLength: result.text.length,
    confidence: result.confidence,
    pageCount: result.pageCount,
    lineCount: result.lines?.length || 0
  })
  console.log()

  // Example 2: Process a document from database (requires document ID)
  console.log('3. Process Document from Database:')
  console.log('Usage: await processDocument(documentId)')
  console.log('This will:')
  console.log('  - Fetch document from database')
  console.log('  - Extract OCR text')
  console.log('  - Update documents.ocr_text column')
  console.log()

  // Example 3: Batch processing
  console.log('4. Batch Processing:')
  console.log('Usage: await batchProcessDocuments([id1, id2, id3])')
  const batchResults = await batchProcessDocuments([])
  console.log('Batch Results:', batchResults)
  console.log()

  // Example 4: Find documents pending OCR
  console.log('5. Find Pending Documents:')
  console.log('Usage: await getDocumentsPendingOcr(tenantId, limit)')
  console.log('Returns documents that need OCR processing')
  console.log()

  console.log('=== Examples Complete ===')
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export default main
