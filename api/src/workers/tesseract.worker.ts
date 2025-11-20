/**
 * Tesseract OCR Worker Thread
 *
 * Offloads CPU-intensive Tesseract OCR processing to a worker thread
 * to prevent blocking the main event loop.
 *
 * Performance Impact:
 * - Moves 2-10 second OCR operations off main thread
 * - Allows API to remain responsive during OCR processing
 * - Enables parallel OCR processing
 */

import { parentPort, workerData } from 'worker_threads';
import { createWorker, PSM, OEM } from 'tesseract.js';

interface TesseractWorkerData {
  imageBuffer: Buffer;
  languages: string[];
  options: {
    preserve_interword_spaces?: string;
    tessedit_pageseg_mode?: number;
  };
}

interface TesseractWorkerResult {
  success: boolean;
  data?: {
    text: string;
    confidence: number;
    lines: any[];
    words: any[];
    imageWidth: number;
    imageHeight: number;
  };
  error?: string;
}

/**
 * Process OCR in worker thread
 */
async function processOCR(data: TesseractWorkerData): Promise<TesseractWorkerResult> {
  const startTime = Date.now();
  let worker: any = null;

  try {
    const { imageBuffer, languages, options } = data;
    const lang = languages && languages.length > 0 ? languages.join('+') : 'eng';

    // Create Tesseract worker
    worker = await createWorker(lang, OEM.LSTM_ONLY, {
      logger: (m) => {
        // Minimal logging in worker
        if (m.status === 'recognizing text') {
          console.log(`[Worker] OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure Tesseract
    await worker.setParameters({
      tessedit_pageseg_mode: options.tessedit_pageseg_mode || PSM.AUTO,
      preserve_interword_spaces: options.preserve_interword_spaces || '1'
    });

    // Perform OCR (CPU-intensive part)
    const { data: ocrData } = await worker.recognize(imageBuffer);

    // Terminate worker
    await worker.terminate();

    const processingTime = Date.now() - startTime;
    console.log(`[Worker] OCR completed in ${processingTime}ms`);

    return {
      success: true,
      data: {
        text: ocrData.text,
        confidence: ocrData.confidence,
        lines: ocrData.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
          words: line.words.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          }))
        })),
        words: ocrData.words || [],
        imageWidth: ocrData.imageWidth || 0,
        imageHeight: ocrData.imageHeight || 0
      }
    };
  } catch (error: any) {
    // Ensure worker is terminated on error
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // Ignore termination errors
      }
    }

    console.error('[Worker] OCR error:', error);
    return {
      success: false,
      error: error.message || 'Unknown OCR error'
    };
  }
}

// Worker thread entry point
if (parentPort) {
  processOCR(workerData)
    .then(result => {
      parentPort!.postMessage(result);
    })
    .catch(error => {
      parentPort!.postMessage({
        success: false,
        error: error.message || 'Worker execution failed'
      });
    });
}
