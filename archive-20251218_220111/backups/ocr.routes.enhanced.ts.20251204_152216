import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import ocrService, { OcrOptions, OcrProvider } from '../services/OcrService'
import ocrQueueService from '../services/OcrQueueService'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import csurf from 'csurf'
import helmet from 'helmet'
import { body, validationResult } from 'express-validator'

const router = express.Router()

router.use(helmet()
router.use(csurf()
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
  })
)

// Configure multer for file uploads
const uploadDir = process.env.OCR_UPLOAD_DIR || '/tmp/ocr-uploads'
const upload = multer({
  dest: uploadDir,
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
      'text/csv',
    ]

    if (allowedTypes.includes(file.mimetype) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`)
    }
  },
})

const ocrOptionsSchema = z.object({
  provider: z.nativeEnum(OcrProvider).optional(),
  languages: z.string().optional(),
  detectTables: z.boolean().optional(),
  detectForms: z.boolean().optional(),
  detectHandwriting: z.boolean().optional(),
  pageNumbers: z.array(z.number().optional(),
  dpi: z.number().optional(),
  preprocessImage: z.boolean().optional(),
  async: z.boolean().optional(),
})

/**
 * @route POST /api/ocr/process
 * @desc Process a single document with OCR
 * @access Private
 */
router.post(
  '/process',
  upload.single('file'),
  [
    body('provider').isString().optional(),
    body('languages').isString().optional(),
    body('detectTables').isBoolean().optional(),
    body('detectForms').isBoolean().optional(),
    body('detectHandwriting').isBoolean().optional(),
    body('pageNumbers').isArray().optional(),
    body('dpi').isNumeric().optional(),
    body('preprocessImage').isBoolean().optional(),
    body('async').isBoolean().optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty() {
        return res.status(400).json({ errors: errors.array() })
      }

      if (!req.file) {
        return res.status(400).json({ error: `No file uploaded` })
      }

      const { tenantId, userId } = (req as any).user
      const documentId =
        req.body.documentId || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Validate and parse options
      const optionsResult = ocrOptionsSchema.safeParse({
        provider: req.body.provider,
        languages: req.body.languages ? req.body.languages.split(',') : undefined,
        detectTables: req.body.detectTables === 'true',
        detectForms: req.body.detectForms === 'true',
        detectHandwriting: req.body.detectHandwriting === 'true',
        pageNumbers: req.body.pageNumbers ? JSON.parse(req.body.pageNumbers) : undefined,
        dpi: req.body.dpi ? parseInt(req.body.dpi, 10) : undefined,
        preprocessImage: req.body.preprocessImage === 'true',
      })

      if (!optionsResult.success) {
        return res.status(400).json({ error: optionsResult.error })
      }

      const options: OcrOptions = optionsResult.data
      const asyncProcess = req.body.async === 'true'

      if (asyncProcess) {
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
        await fs.unlink(req.file.path)

        return res.json(result)
      }
    } catch (error) {
      return res.status(500).json({ error: getErrorMessage(error) })
    }
  }
)

export default router
