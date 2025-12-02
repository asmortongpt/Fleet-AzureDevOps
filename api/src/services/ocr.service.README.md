# Azure Computer Vision OCR Service

## Overview

The OCR (Optical Character Recognition) service provides document text extraction using Azure Computer Vision Read API. It supports multiple document formats with graceful degradation when Azure credentials are not configured.

## Features

- **Multi-format support**: PDF, JPEG, PNG, BMP, TIFF
- **Confidence scoring**: Returns accuracy metrics for extracted text
- **Async processing**: Polls Azure API with configurable timeout
- **Batch processing**: Process multiple documents efficiently
- **Graceful degradation**: Works without Azure credentials (returns empty results)
- **Database integration**: Automatically updates `documents.ocr_text` column

## Installation

The required packages are already installed:

```bash
npm install @azure/cognitiveservices-computervision @azure/ms-rest-js
```

## Configuration

Set these environment variables in your `.env` file:

```env
AZURE_COMPUTER_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_COMPUTER_VISION_KEY=your-subscription-key-here
```

### Getting Azure Computer Vision Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a **Computer Vision** resource
3. Copy the **Endpoint** and **Key** from the resource's "Keys and Endpoint" page
4. Paste into your `.env` file

## Usage

### 1. Extract Text from Document URL

```typescript
import { extractText } from './services/ocr.service'

const result = await extractText(
  'https://storage.azure.com/documents/invoice.pdf',
  'application/pdf'
)

console.log('Extracted Text:', result.text)
console.log('Confidence:', result.confidence)
console.log('Pages:', result.pageCount)
console.log('Lines:', result.lines?.length)
```

**Returns:**
```typescript
{
  text: string              // Full extracted text
  confidence: number        // Average confidence (0-1)
  pageCount: number         // Number of pages processed
  lines: [{                 // Individual lines with metadata
    text: string
    confidence: number
    boundingBox: number[]
  }]
}
```

### 2. Process Document from Database

```typescript
import { processDocument } from './services/ocr.service'

// Automatically fetches document, extracts text, and updates database
await processDocument('document-uuid-here')
```

**What it does:**
1. Fetches document from `documents` table by ID
2. Calls Azure Computer Vision Read API
3. Updates `documents.ocr_text` and `ocr_confidence` columns
4. Sets `ocr_processed_at` timestamp

### 3. Batch Process Documents

```typescript
import { batchProcessDocuments } from './services/ocr.service'

const results = await batchProcessDocuments([
  'doc-id-1',
  'doc-id-2',
  'doc-id-3'
])

console.log('Successful:', results.successful.length)
console.log('Failed:', results.failed.length)
console.log('Total:', results.totalProcessed)
```

**Returns:**
```typescript
{
  successful: string[]           // Array of successful document IDs
  failed: [{                     // Array of failed documents
    documentId: string
    error: string
  }]
  totalProcessed: number         // Total count
}
```

### 4. Find Documents Needing OCR

```typescript
import { getDocumentsPendingOcr } from './services/ocr.service'

const pending = await getDocumentsPendingOcr('tenant-id', 50)

console.log(`Found ${pending.length} documents needing OCR`)

// Process them
const results = await batchProcessDocuments(
  pending.map(doc => doc.id)
)
```

### 5. Check Configuration Status

```typescript
import { isOcrConfigured, getOcrStatus } from './services/ocr.service'

if (!isOcrConfigured()) {
  console.log('Azure Computer Vision not configured')
}

const status = getOcrStatus()
console.log(status)
// {
//   configured: false,
//   endpoint: 'not configured',
//   supportedFormats: ['application/pdf', 'image/jpeg', ...]
// }
```

## Supported File Types

| MIME Type          | Extension | Description |
|--------------------|-----------|-------------|
| `application/pdf`  | .pdf      | PDF documents |
| `image/jpeg`       | .jpg      | JPEG images |
| `image/jpg`        | .jpg      | JPEG images |
| `image/png`        | .png      | PNG images |
| `image/bmp`        | .bmp      | Bitmap images |
| `image/tiff`       | .tiff     | TIFF images |

## Database Schema

The service expects these columns in the `documents` table:

```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_error TEXT;
```

## Error Handling

The service implements graceful degradation:

### Without Azure Credentials
```typescript
// Returns empty results, logs warning, doesn't crash
const result = await extractText(url, mimeType)
// result = { text: '', confidence: 0, pageCount: 0, lines: [] }
```

### Unsupported File Type
```typescript
const result = await extractText('doc.txt', 'text/plain')
// Returns empty result with warning
```

### API Timeout
```typescript
// After 30 seconds, returns empty result and logs error
// Document updated with ocr_error in database
```

### Network Errors
```typescript
// Catches errors, logs them, returns empty result
// Document updated with ocr_error in database
```

## Performance Considerations

### API Limits
- Azure Computer Vision has rate limits based on your pricing tier
- Free tier: 20 calls per minute
- Standard tier: Higher limits

### Timeouts
- Default polling timeout: 30 seconds
- Poll interval: 1 second
- Adjust `MAX_POLL_ATTEMPTS` and `POLL_INTERVAL_MS` if needed

### Batch Processing
- Processes documents sequentially to avoid rate limits
- For parallel processing, adjust the batch logic
- Consider using a queue (like pg-boss) for large batches

## Integration Examples

### With File Upload Endpoint

```typescript
import { Router } from 'express'
import { processDocument } from './services/ocr.service'

router.post('/documents/upload', async (req, res) => {
  const { documentId } = req.body

  // Upload file to blob storage first...
  // Then process OCR asynchronously

  // Option 1: Process immediately (blocks response)
  await processDocument(documentId)

  // Option 2: Queue for background processing (recommended)
  await queueService.addJob('ocr-processing', { documentId })

  res.json({ success: true })
})
```

### With Background Worker

```typescript
import { batchProcessDocuments, getDocumentsPendingOcr } from './services/ocr.service'

// Run every 5 minutes
setInterval(async () => {
  const pending = await getDocumentsPendingOcr(undefined, 100)

  if (pending.length > 0) {
    console.log(`Processing ${pending.length} pending documents`)
    const results = await batchProcessDocuments(
      pending.map(doc => doc.id)
    )
    console.log(`Complete: ${results.successful.length}/${results.totalProcessed}`)
  }
}, 5 * 60 * 1000)
```

## Testing

Run tests:
```bash
npm test tests/ocr.service.test.ts
```

Run example:
```bash
npx tsx src/scripts/ocr-example.ts
```

## Troubleshooting

### "OCR skipped - Azure Computer Vision not configured"
- Set `AZURE_COMPUTER_VISION_ENDPOINT` and `AZURE_COMPUTER_VISION_KEY` in `.env`

### "OCR operation timed out after 30 seconds"
- Large PDFs may take longer
- Increase `MAX_POLL_ATTEMPTS` in the service file
- Check Azure service health

### "Failed to fetch document"
- Ensure blob URLs are publicly accessible or include SAS tokens
- Check network connectivity to Azure Blob Storage

### Low confidence scores
- Image quality may be poor
- Document may be handwritten (Read API optimized for printed text)
- Try preprocessing images (contrast, resolution)

## API Reference

### `extractText(blobUrl: string, mimeType: string): Promise<OcrResult>`
Extract text from a document URL.

### `processDocument(documentId: string): Promise<void>`
Process a document from the database and update OCR text.

### `batchProcessDocuments(documentIds: string[]): Promise<ProcessingResults>`
Process multiple documents in batch.

### `getDocumentsPendingOcr(tenantId?: string, limit?: number): Promise<any[]>`
Get documents that need OCR processing.

### `isOcrConfigured(): boolean`
Check if Azure Computer Vision is configured.

### `getOcrStatus(): object`
Get configuration and status information.

## License

Part of the Fleet Management System - Backend API
