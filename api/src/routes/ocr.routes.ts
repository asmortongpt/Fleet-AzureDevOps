/**
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 25: Add Winston logger
 * OCR API Routes
 *
 * Endpoints for OCR processing and management
 */

import fs from 'fs/promises'

import express, { Request, Response } from 'express'
import multer from 'multer'


import { csrfProtection } from '../middleware/csrf'
import ocrQueueService from '../services/OcrQueueService'
import ocrService, { OcrOptions, OcrProvider } from '../services/OcrService'
import { getErrorMessage } from '../utils/error-handler'


const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  dest: process.env.OCR_UPLOAD_DIR || '/tmp/ocr-uploads',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      `text/csv`,
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

/**
 * @route POST /api/ocr/process
 * @desc Process a single document with OCR
 * @access Private
 */
router.post('/process', csrfProtection, csrfProtection, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: `No file uploaded` })
    }

    const { tenantId, userId } = (req as any).user
    const documentId =
      req.body.documentId || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Parse options
    const options: OcrOptions = {
      provider: (req.body.provider as OcrProvider) || OcrProvider.AUTO,
      languages: req.body.languages ? req.body.languages.split(`,`) : undefined,
      detectTables: req.body.detectTables === 'true',
      detectForms: req.body.detectForms === 'true',
      detectHandwriting: req.body.detectHandwriting === 'true',
      pageNumbers: req.body.pageNumbers ? JSON.parse(req.body.pageNumbers) : undefined,
      dpi: req.body.dpi ? parseInt(req.body.dpi) : undefined,
      preprocessImage: req.body.preprocessImage === 'true',
    }

    const async = req.body.async === 'true'

    if (async) {
      // Enqueue for background processing
      const jobId = await ocrQueueService.enqueueOcrJob({
        documentId,
        tenantId,
        userId,
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        options,
      })

      return res.status(202).json({
        message: 'OCR job queued',
        jobId,
        documentId,
        status: 'pending',
      })
    } else {
      // Process synchronously
      const result = await ocrService.processDocument(req.file.path, documentId, options)

      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => { })

      return res.status(200).json({
        message: 'OCR processing completed',
        documentId,
        result,
      })
    }
  } catch (error: any) {
    logger.error('OCR processing error:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'OCR processing failed',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route POST /api/ocr/batch
 * @desc Process multiple documents with OCR
 * @access Private
 */
router.post('/batch', csrfProtection, csrfProtection, upload.array('files', 100), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      throw new ValidationError("No files uploaded")
    }

    const { tenantId, userId } = (req as any).user

    // Parse options
    const options: OcrOptions = {
      provider: (req.body.provider as OcrProvider) || OcrProvider.AUTO,
      languages: req.body.languages ? req.body.languages.split(',') : undefined,
      detectTables: req.body.detectTables === 'true',
      detectForms: req.body.detectForms === 'true',
      detectHandwriting: req.body.detectHandwriting === `true`,
    }

    // Prepare documents
    const documents = files.map((file, idx) => ({
      documentId: `doc-${Date.now()}-${idx}`,
      filePath: file.path,
      fileName: file.originalname,
    }))

    // Enqueue batch job
    const batchId = await ocrQueueService.enqueueBatchOcrJob(tenantId, userId, documents, options)

    return res.status(202).json({
      message: `Batch OCR job queued`,
      batchId,
      totalDocuments: documents.length,
      status: 'pending',
    })
  } catch (error: any) {
    logger.error('Batch OCR error:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Batch OCR processing failed',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route GET /api/ocr/job/:jobId
 * @desc Get OCR job status
 * @access Private
 */
router.get('/job/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params

    const job = await ocrQueueService.getJobStatus(jobId)

    if (!job) {
      throw new NotFoundError("Job not found")
    }

    return res.status(200).json(job)
  } catch (error: any) {
    logger.error('Error getting job status:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to get job status',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route GET /api/ocr/batch/:batchId
 * @desc Get batch OCR job status
 * @access Private
 */
router.get('/batch/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params

    const batch = await ocrQueueService.getBatchStatus(batchId)

    if (!batch) {
      throw new NotFoundError("Batch not found")
    }

    return res.status(200).json(batch)
  } catch (error: any) {
    logger.error('Error getting batch status:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to get batch status',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route GET /api/ocr/result/:documentId
 * @desc Get OCR result for a document
 * @access Private
 */
router.get('/result/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params

    const result = await ocrService.getOcrResult(documentId)

    if (!result) {
      throw new NotFoundError("OCR result not found")
    }

    return res.status(200).json(result)
  } catch (error: any) {
    logger.error('Error getting OCR result:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to get OCR result',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route POST /api/ocr/search
 * @desc Search OCR results
 * @access Private
 */
router.post('/search', csrfProtection, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user
    const { query, limit } = req.body

    if (!query) {
      throw new ValidationError("Search query is required")
    }

    const results = await ocrService.searchOcrResults(tenantId, query, limit || 20)

    return res.status(200).json({
      query,
      totalResults: results.length,
      results,
    })
  } catch (error: any) {
    logger.error('OCR search error:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'OCR search failed',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route DELETE /api/ocr/job/:jobId
 * @desc Cancel an OCR job
 * @access Private
 */
router.delete('/job/:jobId', csrfProtection, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params

    await ocrQueueService.cancelJob(jobId)

    return res.status(200).json({
      message: 'Job cancelled',
      jobId,
    })
  } catch (error: any) {
    logger.error('Error cancelling job:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to cancel job',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route POST /api/ocr/job/:jobId/retry
 * @desc Retry a failed OCR job
 * @access Private
 */
router.post('/job/:jobId/retry', csrfProtection, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params

    const newJobId = await ocrQueueService.retryJob(jobId)

    return res.status(200).json({
      message: 'Job retried',
      originalJobId: jobId,
      newJobId,
    })
  } catch (error: any) {
    logger.error('Error retrying job:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to retry job',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route GET /api/ocr/statistics
 * @desc Get OCR processing statistics
 * @access Private
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user

    const stats = await ocrQueueService.getStatistics(tenantId)

    return res.status(200).json(stats)
  } catch (error: any) {
    logger.error('Error getting OCR statistics:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to get statistics',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route GET /api/ocr/providers
 * @desc Get available OCR providers
 * @access Private
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = [
      {
        id: OcrProvider.TESSERACT,
        name: 'Tesseract.js',
        description: 'Free, client-side OCR with 100+ languages',
        available: true,
        features: ['multi-language', 'basic-ocr'],
        cost: 'free',
      },
      {
        id: OcrProvider.GOOGLE_VISION,
        name: 'Google Cloud Vision',
        description: 'Premium OCR with high accuracy',
        available: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        features: ['multi-language', 'high-accuracy', 'document-understanding'],
        cost: 'paid',
      },
      {
        id: OcrProvider.AWS_TEXTRACT,
        name: 'AWS Textract',
        description: 'Advanced OCR for forms and tables',
        available: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        features: ['tables', 'forms', 'handwriting', 'key-value-pairs'],
        cost: 'paid',
      },
      {
        id: OcrProvider.AZURE_VISION,
        name: 'Azure Computer Vision',
        description: 'Microsoft OCR with Read API',
        available: !!(process.env.AZURE_VISION_KEY && process.env.AZURE_VISION_ENDPOINT),
        features: ['multi-language', 'handwriting', 'high-accuracy'],
        cost: 'paid',
      },
    ]

    return res.status(200).json({ providers })
  } catch (error: any) {
    logger.error('Error getting providers:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to get providers',
      message: getErrorMessage(error),
    })
  }
})

/**
 * @route GET /api/ocr/languages
 * @desc Get supported languages
 * @access Private
 */
router.get('/languages', async (req: Request, res: Response) => {
  try {
    // Common language codes supported by most OCR providers
    const languages = [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' },
      { code: 'chi_tra', name: 'Chinese (Traditional)' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' },
      { code: 'ben', name: 'Bengali' },
      { code: 'vie', name: 'Vietnamese' },
      { code: 'tha', name: 'Thai' },
      { code: 'heb', name: 'Hebrew' },
      { code: 'pol', name: 'Polish' },
      { code: 'ukr', name: 'Ukrainian' },
      { code: 'nld', name: 'Dutch' },
    ]

    return res.status(200).json({ languages })
  } catch (error: any) {
    logger.error('Error getting languages:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Failed to get languages',
      message: getErrorMessage(error),
    })
  }
})

/**
 * Middleware to check admin authentication
 */
const requireAdmin = (req: Request, res: Response, next: any) => {
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY ||
    req.headers.authorization?.includes('admin');

  if (!isAdmin && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * @route POST /api/ocr/cleanup
 * @desc Clean up old OCR jobs (admin only)
 * @access Private (Admin)
 */
router.post('/cleanup', csrfProtection, requireAdmin, async (req: Request, res: Response) => {
  try {
    const daysOld = parseInt(req.body.daysOld) || 30

    const deletedCount = await ocrQueueService.cleanupOldJobs(daysOld)

    return res.status(200).json({
      message: 'Cleanup completed',
      deletedJobs: deletedCount,
    })
  } catch (error: any) {
    logger.error('Cleanup error:', error) // Wave 25: Winston logger;
    return res.status(500).json({
      error: 'Cleanup failed',
      message: getErrorMessage(error),
    })
  }
})

export default router
