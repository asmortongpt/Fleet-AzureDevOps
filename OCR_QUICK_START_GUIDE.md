# OCR Service - Quick Start Guide

Get started with the Fleet OCR service in 5 minutes!

## 1. Install Dependencies

```bash
cd /home/user/Fleet/api
npm install
```

New packages installed:
- `tesseract.js` - Free OCR engine
- `pdf-parse` - PDF text extraction
- `mammoth` - Word document processing
- `xlsx` - Excel spreadsheet processing
- `@google-cloud/vision` - Google Cloud Vision API
- `@aws-sdk/client-textract` - AWS Textract SDK
- `@azure/cognitiveservices-computervision` - Azure Computer Vision

## 2. Run Database Migration

```bash
npm run migrate
```

This creates the OCR tables:
- `ocr_results` - Stores OCR results
- `ocr_jobs` - Job queue
- `ocr_batch_jobs` - Batch processing
- `ocr_provider_stats` - Usage statistics

## 3. Configure OCR Providers (Optional)

### Option A: Free Tier (Tesseract.js)
No configuration needed! Works out of the box.

### Option B: Premium Providers

Copy the example configuration:
```bash
cp .env.ocr.example .env.local
```

Edit `.env.local` and add your API keys:

**Google Cloud Vision:**
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**AWS Textract:**
```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
```

**Azure Computer Vision:**
```bash
AZURE_VISION_KEY=your-key
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
```

## 4. Start the Server

```bash
npm run dev
```

## 5. Test the OCR Service

### Using cURL:

**Process a Document (Synchronous):**
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "provider=auto" \
  -F "async=false"
```

**Process a Document (Asynchronous):**
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "async=true"
```

**Check Job Status:**
```bash
curl http://localhost:3000/api/ocr/job/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search OCR Results:**
```bash
curl -X POST http://localhost:3000/api/ocr/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "invoice", "limit": 20}'
```

### Using JavaScript/TypeScript:

```typescript
import ocrService from './services/OcrService';

// Process a document
const result = await ocrService.processDocument(
  '/path/to/document.pdf',
  'doc-123',
  {
    provider: 'auto',
    languages: ['eng', 'spa'],
    detectTables: true
  }
);

console.log('Text:', result.fullText);
console.log('Confidence:', result.averageConfidence);
```

## 6. Check Available Providers

```bash
curl http://localhost:3000/api/ocr/providers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response shows which providers are configured and available.

## Common Use Cases

### Use Case 1: Extract Text from PDF
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -F "file=@invoice.pdf" \
  -F "provider=tesseract" \
  -F "async=false"
```

### Use Case 2: Process Invoice with Tables
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -F "file=@invoice.pdf" \
  -F "provider=aws_textract" \
  -F "detectTables=true" \
  -F "detectForms=true" \
  -F "async=true"
```

### Use Case 3: Multi-Language Document
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -F "file=@multilingual.pdf" \
  -F "provider=google_vision" \
  -F "languages=eng,spa,fra" \
  -F "async=false"
```

### Use Case 4: Batch Process Multiple Files
```bash
curl -X POST http://localhost:3000/api/ocr/batch \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf" \
  -F "files=@doc3.jpg" \
  -F "provider=auto"
```

### Use Case 5: Handwriting Recognition
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -F "file=@handwritten.jpg" \
  -F "provider=azure_vision" \
  -F "detectHandwriting=true" \
  -F "async=false"
```

## Supported File Formats

- **PDF** - Portable Document Format
- **JPEG/JPG** - Image files
- **PNG** - Image files
- **TIFF** - Image files (multi-page supported)
- **WebP** - Image files
- **DOCX** - Microsoft Word documents
- **XLSX** - Microsoft Excel spreadsheets
- **TXT** - Plain text files
- **CSV** - Comma-separated values

## Supported Languages (100+)

Common languages:
- `eng` - English
- `spa` - Spanish
- `fra` - French
- `deu` - German
- `ita` - Italian
- `por` - Portuguese
- `rus` - Russian
- `jpn` - Japanese
- `chi_sim` - Chinese (Simplified)
- `chi_tra` - Chinese (Traditional)
- `kor` - Korean
- `ara` - Arabic
- `hin` - Hindi

Get full list:
```bash
curl http://localhost:3000/api/ocr/languages
```

## Provider Selection Guide

| Provider | Best For | Cost | Accuracy | Speed |
|----------|----------|------|----------|-------|
| Tesseract.js | Simple text, multi-language | Free | Good | Medium |
| Google Vision | General purpose, high accuracy | Paid | Excellent | Fast |
| AWS Textract | Forms, tables, invoices | Paid | Excellent | Fast |
| Azure Vision | Handwriting, multi-language | Paid | Excellent | Fast |

## Monitoring & Statistics

**Get OCR Statistics:**
```bash
curl http://localhost:3000/api/ocr/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Returns:
```json
{
  "pending": 5,
  "processing": 2,
  "completed": 1247,
  "failed": 13,
  "avgProcessingTime": 2341.5,
  "jobs24h": 87
}
```

## Troubleshooting

### Problem: OCR job stuck in "pending"
**Solution:** Check queue service is running and initialized.

### Problem: Low accuracy results
**Solution:**
- Try a different provider (Google Vision or Azure for better accuracy)
- Specify correct language codes
- Enable image preprocessing: `preprocessImage=true`
- Use higher DPI for image conversion

### Problem: Provider not available
**Solution:** Check environment variables are set correctly and API keys are valid.

### Problem: "File too large" error
**Solution:**
- Use async processing for files > 1MB
- Check file size limit (default 50MB max)
- Increase `OCR_JOB_TIMEOUT` if needed

## Next Steps

1. ✅ **Explore Examples**: Check `/home/user/Fleet/api/src/examples/ocr-usage-example.ts`
2. ✅ **Read Full Documentation**: See `OCR_SERVICE_IMPLEMENTATION_SUMMARY.md`
3. ✅ **Configure Premium Providers**: Setup Google, AWS, or Azure for better accuracy
4. ✅ **Monitor Performance**: Use statistics endpoint to track usage
5. ✅ **Integrate with Document Management**: Connect OCR to your document upload flow

## Support

- **Documentation**: See `OCR_SERVICE_IMPLEMENTATION_SUMMARY.md`
- **API Reference**: Visit `/api/docs` when server is running
- **Examples**: See `/home/user/Fleet/api/src/examples/ocr-usage-example.ts`
- **Configuration**: See `.env.ocr.example`

## Cost Estimation

### Free Tier (Tesseract.js):
- ✅ Unlimited usage
- ✅ 100+ languages
- ✅ No API keys required

### Paid Tiers:
- **Google Cloud Vision**: $1.50 per 1,000 pages
- **AWS Textract (Text)**: $1.50 per 1,000 pages
- **AWS Textract (Forms/Tables)**: $50-65 per 1,000 pages
- **Azure Computer Vision**: $1.00 per 1,000 pages

**Example Costs:**
- 10,000 pages/month with Tesseract: **$0**
- 10,000 pages/month with Google Vision: **$15**
- 10,000 pages/month with AWS Textract (forms): **$500-650**

## Quick Reference - API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ocr/process` | POST | Process a document |
| `/api/ocr/batch` | POST | Process multiple documents |
| `/api/ocr/job/:jobId` | GET | Get job status |
| `/api/ocr/batch/:batchId` | GET | Get batch status |
| `/api/ocr/result/:documentId` | GET | Get OCR result |
| `/api/ocr/search` | POST | Search OCR results |
| `/api/ocr/providers` | GET | List available providers |
| `/api/ocr/languages` | GET | List supported languages |
| `/api/ocr/statistics` | GET | Get processing statistics |
| `/api/ocr/job/:jobId` | DELETE | Cancel a job |
| `/api/ocr/job/:jobId/retry` | POST | Retry a failed job |
| `/api/ocr/cleanup` | POST | Clean up old jobs |

That's it! You're ready to process documents with OCR. 🚀
