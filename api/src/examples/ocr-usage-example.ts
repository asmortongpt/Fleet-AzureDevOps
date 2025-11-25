/**
 * OCR Service Usage Examples
 *
 * Demonstrates how to use the OCR service in various scenarios
 */

import ocrService, { OcrOptions, OcrProvider } from '../services/OcrService';
import ocrQueueService from '../services/OcrQueueService';
import fs from 'fs/promises';
import path from 'path';

// ============================================
// Example 1: Simple Document OCR (Synchronous)
// ============================================
export async function simpleOcrExample() {
  console.log('Example 1: Simple OCR');

  const result = await ocrService.processDocument(
    '/path/to/document.pdf',
    'doc-001',
    {
      provider: OcrProvider.TESSERACT,
      languages: ['eng']
    }
  );

  console.log('Full Text:', result.fullText);
  console.log('Confidence:', result.averageConfidence);
  console.log('Pages:', result.pages.length);
  console.log('Processing Time:', result.processingTime, 'ms');
}

// ============================================
// Example 2: Multi-Language Document
// ============================================
export async function multiLanguageOcrExample() {
  console.log('Example 2: Multi-Language OCR');

  const result = await ocrService.processDocument(
    '/path/to/bilingual-document.pdf',
    'doc-002',
    {
      provider: OcrProvider.GOOGLE_VISION,
      languages: ['eng', 'spa', 'fra'] // English, Spanish, French
    }
  );

  console.log('Detected Languages:', result.languages);
  console.log('Primary Language:', result.primaryLanguage);
  console.log('Full Text:', result.fullText.substring(0, 200) + '...');
}

// ============================================
// Example 3: Invoice/Form Processing
// ============================================
export async function formProcessingExample() {
  console.log('Example 3: Form/Invoice Processing');

  const result = await ocrService.processDocument(
    '/path/to/invoice.pdf',
    'doc-003',
    {
      provider: OcrProvider.AWS_TEXTRACT,
      detectTables: true,
      detectForms: true
    }
  );

  console.log('Tables Found:', result.tables?.length || 0);
  console.log('Form Fields Found:', result.forms?.length || 0);

  // Print extracted form fields
  if (result.forms) {
    result.forms.forEach(field => {
      console.log(`${field.key}: ${field.value} (confidence: ${field.confidence})`);
    });
  }

  // Print table data
  if (result.tables && result.tables.length > 0) {
    const table = result.tables[0];
    console.log(`Table: ${table.rows} rows × ${table.columns} columns`);
  }
}

// ============================================
// Example 4: Handwriting Recognition
// ============================================
export async function handwritingRecognitionExample() {
  console.log('Example 4: Handwriting Recognition');

  const result = await ocrService.processDocument(
    '/path/to/handwritten-note.jpg',
    'doc-004',
    {
      provider: OcrProvider.AZURE_VISION,
      detectHandwriting: true,
      languages: ['eng']
    }
  );

  console.log('Handwriting Detected:', result.metadata.hasHandwriting);
  console.log('Text:', result.fullText);
  console.log('Confidence:', result.averageConfidence);
}

// ============================================
// Example 5: Batch Processing (Async)
// ============================================
export async function batchProcessingExample() {
  console.log('Example 5: Batch Processing');

  const documents = [
    { documentId: 'doc-005', filePath: '/path/to/doc1.pdf', fileName: 'doc1.pdf' },
    { documentId: 'doc-006', filePath: '/path/to/doc2.pdf', fileName: 'doc2.pdf' },
    { documentId: 'doc-007', filePath: '/path/to/doc3.jpg', fileName: 'doc3.jpg' }
  ];

  const batchId = await ocrQueueService.enqueueBatchOcrJob(
    'tenant-123',
    'user-456',
    documents,
    {
      provider: OcrProvider.AUTO,
      languages: ['eng']
    }
  );

  console.log('Batch Job ID:', batchId);

  // Poll for completion
  let batchStatus = await ocrQueueService.getBatchStatus(batchId);
  console.log('Status:', batchStatus?.status);
  console.log('Progress:', '${batchStatus?.completedDocuments}/${batchStatus?.totalDocuments}`);
}

// ============================================
// Example 6: Async Job Processing
// ============================================
export async function asyncJobExample() {
  console.log('Example 6: Async Job Processing');

  const jobId = await ocrQueueService.enqueueOcrJob({
    documentId: 'doc-008',
    tenantId: 'tenant-123',
    userId: 'user-456',
    filePath: '/path/to/large-document.pdf',
    fileName: 'large-document.pdf',
    fileSize: 5000000,
    mimeType: 'application/pdf',
    options: {
      provider: OcrProvider.GOOGLE_VISION,
      languages: ['eng'],
      detectTables: true
    }
  });

  console.log('Job ID:', jobId);

  // Wait for completion
  let jobStatus;
  do {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    jobStatus = await ocrQueueService.getJobStatus(jobId);
    console.log(`Status: ${jobStatus?.status}, Progress: ${jobStatus?.progress}%`);
  } while (jobStatus && jobStatus.status === 'processing');

  if (jobStatus?.status === 'completed') {
    console.log('OCR Result:', jobStatus.ocrResult);
  }
}

// ============================================
// Example 7: Excel Spreadsheet Processing
// ============================================
export async function excelProcessingExample() {
  console.log('Example 7: Excel Processing');

  const result = await ocrService.processDocument(
    '/path/to/spreadsheet.xlsx',
    'doc-009',
    {}
  );

  console.log('Sheets Processed:', result.metadata.pageCount);
  console.log('Has Tables:', result.metadata.hasTables);
  console.log('Text Content:', result.fullText.substring(0, 200) + '...');
}

// ============================================
// Example 8: Word Document Processing
// ============================================
export async function wordDocumentExample() {
  console.log('Example 8: Word Document Processing');

  const result = await ocrService.processDocument(
    '/path/to/document.docx',
    'doc-010',
    {}
  );

  console.log('Text Extracted:', result.fullText.length, 'characters');
  console.log('Confidence:', result.averageConfidence); // Will be 1.0 for text extraction
}

// ============================================
// Example 9: Search OCR Results
// ============================================
export async function searchOcrResultsExample() {
  console.log('Example 9: Search OCR Results');

  const results = await ocrService.searchOcrResults(
    'tenant-123',
    'invoice payment terms',
    10
  );

  console.log('Search Results:', results.length);
  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.file_name} (rank: ${result.rank})`);
    console.log(`   Preview: ${result.full_text.substring(0, 100)}...`);
  });
}

// ============================================
// Example 10: Error Handling & Retry
// ============================================
export async function errorHandlingExample() {
  console.log('Example 10: Error Handling & Retry');

  try {
    const result = await ocrService.processDocument(
      '/path/to/corrupted-file.pdf',
      'doc-011',
      {
        provider: OcrProvider.TESSERACT
      }
    );
    console.log('Success:', result);
  } catch (error) {
    console.error('OCR Failed:', error);

    // Try with a different provider
    try {
      const result = await ocrService.processDocument(
        '/path/to/corrupted-file.pdf',
        'doc-011',
        {
          provider: OcrProvider.GOOGLE_VISION // Fallback provider
        }
      );
      console.log('Success with fallback provider:', result);
    } catch (fallbackError) {
      console.error('All providers failed:', fallbackError);
    }
  }
}

// ============================================
// Example 11: Get Job Statistics
// ============================================
export async function statisticsExample() {
  console.log('Example 11: OCR Statistics');

  const stats = await ocrQueueService.getStatistics('tenant-123');

  console.log('Pending Jobs:', stats.pending);
  console.log('Processing Jobs:', stats.processing);
  console.log('Completed Jobs:', stats.completed);
  console.log('Failed Jobs:', stats.failed);
  console.log('Average Processing Time:', stats.avgProcessingTime, 'ms');
  console.log('Jobs (Last 24h):', stats.jobs24h);
}

// ============================================
// Example 12: Cleanup Old Jobs
// ============================================
export async function cleanupExample() {
  console.log('Example 12: Cleanup Old Jobs');

  const deletedCount = await ocrQueueService.cleanupOldJobs(30); // Delete jobs older than 30 days
  console.log('Deleted Jobs:', deletedCount);
}

// ============================================
// Example 13: Provider Auto-Selection
// ============================================
export async function autoProviderSelectionExample() {
  console.log('Example 13: Auto Provider Selection');

  // For a simple text document - will use Tesseract (free)
  const simpleDoc = await ocrService.processDocument(
    '/path/to/simple-text.jpg',
    'doc-012',
    {
      provider: OcrProvider.AUTO
    }
  );
  console.log('Used Provider:', simpleDoc.provider);

  // For a form/table document - will use AWS Textract (if available)
  const formDoc = await ocrService.processDocument(
    '/path/to/invoice.pdf',
    'doc-013',
    {
      provider: OcrProvider.AUTO,
      detectTables: true,
      detectForms: true
    }
  );
  console.log('Used Provider:', formDoc.provider);

  // For handwriting - will use Azure or AWS (if available)
  const handwrittenDoc = await ocrService.processDocument(
    '/path/to/handwritten.jpg',
    'doc-014',
    {
      provider: OcrProvider.AUTO,
      detectHandwriting: true
    }
  );
  console.log('Used Provider:', handwrittenDoc.provider);
}

// ============================================
// Example 14: Page-Level Processing
// ============================================
export async function pageLevelProcessingExample() {
  console.log('Example 14: Page-Level Processing');

  const result = await ocrService.processDocument(
    '/path/to/multi-page.pdf',
    'doc-015',
    {
      provider: OcrProvider.GOOGLE_VISION,
      pageNumbers: [1, 3, 5] // Process only pages 1, 3, and 5
    }
  );

  console.log('Pages Processed:', result.pages.length);

  result.pages.forEach(page => {
    console.log(`\nPage ${page.pageNumber}:`);
    console.log(`  Confidence: ${page.confidence}`);
    console.log(`  Language: ${page.language}`);
    console.log(`  Lines: ${page.lines.length}`);
    console.log(`  Text Preview: ${page.text.substring(0, 100)}...`);
  });
}

// ============================================
// Example 15: Bounding Box Extraction
// ============================================
export async function boundingBoxExample() {
  console.log('Example 15: Bounding Box Extraction');

  const result = await ocrService.processDocument(
    '/path/to/document.jpg',
    'doc-016',
    {
      provider: OcrProvider.GOOGLE_VISION
    }
  );

  // Get bounding boxes for all words on first page
  const firstPage = result.pages[0];
  firstPage.lines.forEach(line => {
    line.words.forEach(word => {
      console.log(`Word: "${word.text}"`);
      console.log(`  Position: x=${word.boundingBox.x}, y=${word.boundingBox.y}`);
      console.log(`  Size: width=${word.boundingBox.width}, height=${word.boundingBox.height}`);
      console.log(`  Confidence: ${word.confidence}`);
    });
  });
}

// ============================================
// Run All Examples
// ============================================
export async function runAllExamples() {
  console.log('===============================================');
  console.log('OCR SERVICE USAGE EXAMPLES');
  console.log('===============================================\n');

  try {
    // NOTE: Update file paths before running these examples
    // await simpleOcrExample();
    // await multiLanguageOcrExample();
    // await formProcessingExample();
    // await handwritingRecognitionExample();
    // await batchProcessingExample();
    // await asyncJobExample();
    // await excelProcessingExample();
    // await wordDocumentExample();
    // await searchOcrResultsExample();
    // await errorHandlingExample();
    // await statisticsExample();
    // await cleanupExample();
    // await autoProviderSelectionExample();
    // await pageLevelProcessingExample();
    // await boundingBoxExample();

    console.log('\n===============================================');
    console.log('All examples completed!');
    console.log('===============================================');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run all examples:
// runAllExamples();
