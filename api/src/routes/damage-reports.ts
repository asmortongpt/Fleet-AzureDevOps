import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import { SqlParams } from '../types'
import multer from 'multer'
import { BlobServiceClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()
router.use(authenticateJWT)

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
      'text/plain', // PLY, OBJ files
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
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT
      id,
      tenant_id,
      vehicle_id,
      reporter_id,
      incident_date,
      description,
      severity,
      location,
      photos,
      estimated_cost,
      status,
      notes,
      created_at,
      updated_at FROM damage_reports WHERE tenant_id = $1'
      const params: SqlParams = [req.user!.tenant_id]

      if (vehicle_id) {
        query += ' AND vehicle_id = $2'
        params.push(vehicle_id)
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = vehicle_id
        ? 'SELECT COUNT(*) FROM damage_reports WHERE tenant_id = $1 AND vehicle_id = $2'
        : 'SELECT COUNT(*) FROM damage_reports WHERE tenant_id = $1'
      const countParams = vehicle_id ? [req.user!.tenant_id, vehicle_id] : [req.user!.tenant_id]
      const countResult = await pool.query(countQuery, countParams)

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get damage reports error:', error)
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
      const result = await pool.query(
        `SELECT
      id,
      tenant_id,
      vehicle_id,
      reporter_id,
      incident_date,
      description,
      severity,
      location,
      photos,
      estimated_cost,
      status,
      notes,
      created_at,
      updated_at FROM damage_reports WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /damage-reports
router.post(
  '/',
  requirePermission('damage_report:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = damageReportSchema.parse(req.body)

      const result = await pool.query(
        `INSERT INTO damage_reports (
          tenant_id, vehicle_id, reported_by, damage_description,
          damage_severity, damage_location, photos, videos, lidar_scans,
          triposr_task_id, triposr_status, triposr_model_url,
          linked_work_order_id, inspection_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          req.user!.tenant_id,
          validatedData.vehicle_id,
          validatedData.reported_by || req.user!.id,
          validatedData.damage_description,
          validatedData.damage_severity,
          validatedData.damage_location || null,
          validatedData.photos || [],
          validatedData.videos || [], // NEW: videos array
          validatedData.lidar_scans || [], // NEW: LiDAR scans array
          validatedData.triposr_task_id || null,
          validatedData.triposr_status || 'pending',
          validatedData.triposr_model_url || null,
          validatedData.linked_work_order_id || null,
          validatedData.inspection_id || null
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Create damage report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /damage-reports/:id
router.put(
  '/:id',
  requirePermission('damage_report:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = damageReportSchema.partial().parse(req.body)

      const fields: string[] = []
      const values: SqlParams = []
      let paramIndex = 3

      Object.entries(validatedData).forEach(([key, value]) => {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      })

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      const result = await pool.query(
        `UPDATE damage_reports SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
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
  requirePermission('damage_report:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { triposr_status, triposr_model_url } = req.body

      if (!triposr_status) {
        return res.status(400).json({ error: 'triposr_status is required' })
      }

      const result = await pool.query(
        `UPDATE damage_reports
         SET triposr_status = $1, triposr_model_url = $2, updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4 RETURNING *`,
        [triposr_status, triposr_model_url || null, req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update TripoSR status error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /damage-reports/:id
router.delete(
  '/:id',
  requirePermission('damage_report:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'damage_reports' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM damage_reports WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Damage report not found' })
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
  requirePermission('damage_report:create:own'),
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
            mediaType === 'video'
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
          error: 'Failed to upload any media files',
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
