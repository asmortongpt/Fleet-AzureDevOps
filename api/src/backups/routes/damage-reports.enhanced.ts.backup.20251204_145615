import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import multer from 'multer'
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobUploadCommonResponse,
} from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'
import { handleError, ErrorBoundary } from '../utils/errorHandling'
import { rateLimiter } from '../middleware/rateLimiter'
import helmet from 'helmet'
import csurf from 'csurf'

const router = express.Router()

router.use(authenticateJWT)
router.use(rateLimiter)
router.use(helmet())
router.use(csurf())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'application/octet-stream',
      'model/vnd.usdz+zip',
      'text/plain',
    ]

    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.match(/\.(usdz|ply|obj|fbx|dae)$/i)
    ) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

let blobServiceClient: BlobServiceClient | null = null

const initializeBlobService = () => {
  if (!blobServiceClient && process.env.AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    )
  }
}

const damageReportSchema = z.object({
  vehicle_id: z.string().uuid(),
  reported_by: z.string().uuid().optional(),
  damage_description: z.string(),
  damage_severity: z.enum(['minor', 'moderate', 'severe']),
  damage_location: z.string().optional(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  lidar_scans: z.array(z.string()).optional(),
  triposr_task_id: z.string().optional(),
  triposr_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  triposr_model_url: z.string().optional(),
  linked_work_order_id: z.string().uuid().optional(),
  inspection_id: z.string().uuid().optional(),
})

router.get(
  '/',
  requirePermission('damage_report:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'damage_reports' }),
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, vehicle_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const query = {
        text: `SELECT * FROM damage_reports WHERE vehicle_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        values: [vehicle_id, limit, offset],
      }

      const { rows } = await pool.query(query)
      res.json(rows)
    } catch (error) {
      handleError(res, error)
    }
  }
)

router.post(
  '/',
  requirePermission('damage_report:create'),
  upload.array('media', 10),
  auditLog({ action: 'CREATE', resourceType: 'damage_report' }),
  async (req: Request, res: Response) => {
    const { files } = req
    const formData = JSON.parse(req.body.data)

    try {
      const parsedData = damageReportSchema.parse(formData)
      initializeBlobService()

      const uploadPromises = (files as Express.Multer.File[]).map(async file => {
        const blobName = uuidv4() + '-' + file.originalname
        const containerClient = blobServiceClient!.getContainerClient('damage-reports')
        await containerClient.createIfNotExists({ access: 'blob' })
        const blockBlobClient = containerClient.getBlockBlobClient(blobName)
        const uploadBlobResponse: BlobUploadCommonResponse = await blockBlobClient.uploadData(
          file.buffer,
          {
            blobHTTPHeaders: { blobContentType: file.mimetype },
          }
        )
        return blockBlobClient.url
      })

      const uploadedFilesUrls = await Promise.all(uploadPromises)

      const insertQuery = {
        text: `INSERT INTO damage_reports(vehicle_id, reported_by, damage_description, damage_severity, damage_location, photos, videos, lidar_scans, triposr_task_id, triposr_status, triposr_model_url, linked_work_order_id, inspection_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        values: [
          parsedData.vehicle_id,
          parsedData.reported_by,
          parsedData.damage_description,
          parsedData.damage_severity,
          parsedData.damage_location,
          parsedData.photos,
          parsedData.videos,
          parsedData.lidar_scans,
          parsedData.triposr_task_id,
          parsedData.triposr_status,
          parsedData.triposr_model_url,
          parsedData.linked_work_order_id,
          parsedData.inspection_id,
        ],
      }

      const { rows } = await pool.query(insertQuery)
      res.status(201).json(rows[0])
    } catch (error) {
      handleError(res, error)
    }
  }
)

export default router
