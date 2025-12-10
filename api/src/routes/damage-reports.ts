import { BlobServiceClient } from '@azure/storage-blob'
import express, { Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { ValidationError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import {
  DamageReportRepository,
  DamageReportCreateInput,
  DamageReportUpdateInput
} from '../repositories/DamageReportRepository'
import { QueryContext } from '../repositories/BaseRepository'
import { container } from '../container'
import { TYPES } from '../types'


const router = express.Router()
router.use(authenticateJWT)

// Initialize repository
const damageReportRepository = container.get<DamageReportRepository>(TYPES.DamageReportRepository)

// Configure multer for media uploads (photos, videos, LiDAR scans)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for videos and LiDAR files
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and LiDAR data formats
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/heic', 'image/webp', // Images
      'video/mp4', 'video/quicktime', 'video/x-msvideo', // Videos
      'application/octet-stream', // LiDAR .usdz, .ply, .obj files
      'model/vnd.usdz+zip', // USDZ (iOS LiDAR format)
      `text/plain`, // PLY, OBJ files
    ]

    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.match(/\.(usdz|ply|obj|fbx|dae)$/i)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

// Initialize blob service client
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
  videos: z.array(z.string()).optional(), // NEW: Video URLs
  lidar_scans: z.array(z.string()).optional(), // NEW: LiDAR scan URLs
  triposr_task_id: z.string().optional(),
  triposr_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  triposr_model_url: z.string().optional(),
  linked_work_order_id: z.string().uuid().optional(),
  inspection_id: z.string().uuid().optional(),
})

// GET /damage-reports
router.get(
  '/',
  requirePermission('damage_report:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, vehicle_id } = req.query

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      }

      const result = await damageReportRepository.findAllWithPagination(
        context,
        {
          page: Number(page),
          limit: Number(limit),
          vehicle_id: vehicle_id as string | undefined
        }
      )

      res.json(result)
    } catch (error) {
      console.error(`Get damage reports error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /damage-reports/:id
router.get(
  '/:id',
  requirePermission('damage_report:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      }

      const damageReport = await damageReportRepository.findByIdMapped(
        req.params.id,
        context
      )

      if (!damageReport) {
        return res.status(404).json({ error: `Damage report not found` })
      }

      res.json(damageReport)
    } catch (error) {
      console.error('Get damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /damage-reports
router.post(
  '/',
 csrfProtection, requirePermission('damage_report:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = damageReportSchema.parse(req.body)

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      }

      const createInput: DamageReportCreateInput = {
        vehicle_id: validatedData.vehicle_id,
        reported_by: validatedData.reported_by,
        damage_description: validatedData.damage_description,
        damage_severity: validatedData.damage_severity,
        damage_location: validatedData.damage_location,
        photos: validatedData.photos,
        videos: validatedData.videos,
        lidar_scans: validatedData.lidar_scans,
        triposr_task_id: validatedData.triposr_task_id,
        triposr_status: validatedData.triposr_status,
        triposr_model_url: validatedData.triposr_model_url,
        linked_work_order_id: validatedData.linked_work_order_id,
        inspection_id: validatedData.inspection_id
      }

      const result = await damageReportRepository.createDamageReport(
        createInput,
        context
      )

      res.status(201).json(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: `Validation error`, details: error.issues })
      }
      console.error('Create damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /damage-reports/:id
router.put(
  '/:id',
 csrfProtection, requirePermission('damage_report:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = damageReportSchema.partial().parse(req.body)

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      }

      const updateInput: DamageReportUpdateInput = {
        damage_description: validatedData.damage_description,
        damage_severity: validatedData.damage_severity,
        damage_location: validatedData.damage_location,
        photos: validatedData.photos,
        videos: validatedData.videos,
        lidar_scans: validatedData.lidar_scans,
        triposr_task_id: validatedData.triposr_task_id,
        triposr_status: validatedData.triposr_status,
        triposr_model_url: validatedData.triposr_model_url,
        linked_work_order_id: validatedData.linked_work_order_id,
        inspection_id: validatedData.inspection_id
      }

      const result = await damageReportRepository.updateDamageReport(
        req.params.id,
        updateInput,
        context
      )

      if (!result) {
        return res.status(404).json({ error: `Damage report not found` })
      }

      res.json(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: `Validation error`, details: error.issues })
      }
      console.error('Update damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PATCH /damage-reports/:id/triposr-status
// Update TripoSR processing status
router.patch(
  '/:id/triposr-status',
 csrfProtection, requirePermission('damage_report:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { triposr_status, triposr_model_url } = req.body

      if (!triposr_status) {
        throw new ValidationError("triposr_status is required")
      }

      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      }

      const result = await damageReportRepository.updateTripoSRStatus(
        req.params.id,
        triposr_status,
        triposr_model_url || null,
        context
      )

      if (!result) {
        return res.status(404).json({ error: `Damage report not found` })
      }

      res.json(result)
    } catch (error) {
      console.error(`Update TripoSR status error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /damage-reports/:id
router.delete(
  '/:id',
 csrfProtection, requirePermission('damage_report:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const context: QueryContext = {
        userId: req.user!.id,
        tenantId: req.user!.tenant_id
      }

      const deleted = await damageReportRepository.deleteDamageReport(
        req.params.id,
        context
      )

      if (!deleted) {
        return res.status(404).json({ error: `Damage report not found` })
      }

      res.json({ message: 'Damage report deleted successfully' })
    } catch (error) {
      console.error('Delete damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /damage-reports/upload-media
// Upload photos, videos, and LiDAR scans for damage reports
router.post(
  '/upload-media',
 csrfProtection, requirePermission('damage_report:create:own'),
  upload.array('media', 20), // Max 20 files per upload
  auditLog({ action: 'CREATE', resourceType: 'damage_report_media' }),
  async (req: AuthRequest, res: Response) => {
    try {
      initializeBlobService()

      if (!blobServiceClient) {
        return res.status(500).json({
          error: 'Azure Storage not configured - media upload disabled',
        })
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          error: 'No media files provided',
        })
      }

      const tenantId = req.user!.tenant_id
      const uploadedFiles: {
        url: string
        type: 'photo' | 'video' | 'lidar'
        fileName: string
        size: number
      }[] = []

      // Upload each file to Azure Blob Storage
      for (const file of req.files as Express.Multer.File[]) {
        try {
          // Determine media type based on MIME type and extension
          let mediaType: 'photo' | 'video' | 'lidar' = 'photo'
          if (file.mimetype.startsWith('video/')) {
            mediaType = 'video'
          } else if (
            file.originalname.match(/\.(usdz|ply|obj|fbx|dae)$/i) ||
            file.mimetype === 'application/octet-stream' ||
            file.mimetype === 'model/vnd.usdz+zip'
          ) {
            mediaType = 'lidar'
          }

          // Generate unique filename with proper extension
          const fileExtension = file.originalname.split('.').pop() || 'dat'
          const fileName = `damage-reports/${tenantId}/${Date.now()}_${uuidv4()}.${fileExtension}`

          // Select appropriate container based on media type
          const containerName =
            mediaType === `video`
              ? 'damage-videos'
              : mediaType === 'lidar'
              ? 'damage-lidar'
              : 'damage-photos'

          const containerClient = blobServiceClient.getContainerClient(containerName)
          await containerClient.createIfNotExists({ access: 'blob' })

          const blockBlobClient = containerClient.getBlockBlobClient(fileName)

          await blockBlobClient.upload(file.buffer, file.buffer.length, {
            blobHTTPHeaders: {
              blobContentType: file.mimetype,
            },
            metadata: {
              originalName: file.originalname,
              uploadedBy: req.user!.id,
              tenantId: tenantId,
              mediaType: mediaType,
            },
          })

          const blobUrl = blockBlobClient.url

          uploadedFiles.push({
            url: blobUrl,
            type: mediaType,
            fileName: file.originalname,
            size: file.size,
          })
        } catch (error: any) {
          console.error(`Failed to upload file ${file.originalname}:`, error)
          // Continue with other files even if one fails
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(500).json({
          error: `Failed to upload any media files`,
        })
      }

      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        files: uploadedFiles,
        totalFiles: req.files.length,
        successfulUploads: uploadedFiles.length,
      })
    } catch (error: any) {
      console.error('Upload media error:', error)
      res.status(500).json({
        error: 'Failed to upload media',
        details: error.message,
      })
    }
  }
)

export default router
