Here's the complete refactored version of the `damage-reports.enhanced.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import multer from 'multer';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobUploadCommonResponse,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { handleError, ErrorBoundary } from '../utils/errorHandling';
import { rateLimiter } from '../middleware/rateLimiter';
import helmet from 'helmet';
import csurf from 'csurf';
import { csrfProtection } from '../middleware/csrf';
import { DamageReportRepository } from '../repositories/DamageReportRepository';

const router = express.Router();

// Import the DamageReportRepository
const damageReportRepository = container.resolve(DamageReportRepository);

router.use(authenticateJWT);
router.use(rateLimiter);
router.use(helmet());
router.use(csurf());

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
    ];

    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.match(/\.(usdz|ply|obj|fbx|dae)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

let blobServiceClient: BlobServiceClient | null = null;

const initializeBlobService = () => {
  if (!blobServiceClient && process.env.AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
  }
};

const damageReportSchema = z.object({
  vehicle_id: z.string().uuid(),
  reported_by: z.string().uuid().optional(),
  damage_description: z.string(),
  damage_severity: z.enum(['minor', 'moderate', 'severe']),
  damage_location: z.string().optional(),
  photos: z.array(z.string().optional()),
  videos: z.array(z.string().optional()),
  lidar_scans: z.array(z.string().optional()),
  triposr_task_id: z.string().optional(),
  triposr_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  triposr_model_url: z.string().optional(),
  linked_work_order_id: z.string().uuid().optional(),
  inspection_id: z.string().uuid().optional(),
});

router.get(
  '/',
  requirePermission('damage_report:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'damage_reports' }),
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, vehicle_id } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const damageReports = await damageReportRepository.getDamageReportsByVehicleId(
        vehicle_id as string,
        Number(limit),
        offset
      );

      res.json(damageReports);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.post(
  '/',
  csrfProtection,
  requirePermission('damage_report:create'),
  upload.array('media', 10),
  auditLog({ action: 'CREATE', resourceType: 'damage_report' }),
  async (req: Request, res: Response) => {
    const { files } = req;
    const formData = JSON.parse(req.body.data);

    try {
      const parsedData = damageReportSchema.parse(formData);
      initializeBlobService();

      const uploadPromises = (files || []).map(async (file) => {
        if (!blobServiceClient) {
          throw new Error('Blob service not initialized');
        }

        const containerClient = blobServiceClient.getContainerClient('damage-reports');
        const blobName = `${uuidv4()}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const uploadResponse = await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: {
            blobContentType: file.mimetype,
          },
        });

        return {
          blobName,
          url: blockBlobClient.url,
          size: file.size,
          type: file.mimetype,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      const photos = uploadedFiles
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => file.url);

      const videos = uploadedFiles
        .filter((file) => file.type.startsWith('video/'))
        .map((file) => file.url);

      const lidarScans = uploadedFiles
        .filter((file) => file.type === 'application/octet-stream' || file.type === 'model/vnd.usdz+zip' || file.originalname.match(/\.(usdz|ply|obj|fbx|dae)$/i))
        .map((file) => file.url);

      const newDamageReport = {
        ...parsedData,
        photos,
        videos,
        lidar_scans: lidarScans,
      };

      const createdReport = await damageReportRepository.createDamageReport(newDamageReport);

      res.status(201).json(createdReport);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.get(
  '/:id',
  requirePermission('damage_report:view'),
  auditLog({ action: 'READ', resourceType: 'damage_report' }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const damageReport = await damageReportRepository.getDamageReportById(id);

      if (!damageReport) {
        throw new NotFoundError('Damage report not found');
      }

      res.json(damageReport);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.put(
  '/:id',
  csrfProtection,
  requirePermission('damage_report:update'),
  upload.array('media', 10),
  auditLog({ action: 'UPDATE', resourceType: 'damage_report' }),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { files } = req;
    const formData = JSON.parse(req.body.data);

    try {
      const parsedData = damageReportSchema.partial().parse(formData);
      initializeBlobService();

      const uploadPromises = (files || []).map(async (file) => {
        if (!blobServiceClient) {
          throw new Error('Blob service not initialized');
        }

        const containerClient = blobServiceClient.getContainerClient('damage-reports');
        const blobName = `${uuidv4()}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const uploadResponse = await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: {
            blobContentType: file.mimetype,
          },
        });

        return {
          blobName,
          url: blockBlobClient.url,
          size: file.size,
          type: file.mimetype,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      const photos = uploadedFiles
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => file.url);

      const videos = uploadedFiles
        .filter((file) => file.type.startsWith('video/'))
        .map((file) => file.url);

      const lidarScans = uploadedFiles
        .filter((file) => file.type === 'application/octet-stream' || file.type === 'model/vnd.usdz+zip' || file.originalname.match(/\.(usdz|ply|obj|fbx|dae)$/i))
        .map((file) => file.url);

      const updatedDamageReport = {
        ...parsedData,
        photos: [...(parsedData.photos || []), ...photos],
        videos: [...(parsedData.videos || []), ...videos],
        lidar_scans: [...(parsedData.lidar_scans || []), ...lidarScans],
      };

      const updatedReport = await damageReportRepository.updateDamageReport(id, updatedDamageReport);

      if (!updatedReport) {
        throw new NotFoundError('Damage report not found');
      }

      res.json(updatedReport);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.delete(
  '/:id',
  csrfProtection,
  requirePermission('damage_report:delete'),
  auditLog({ action: 'DELETE', resourceType: 'damage_report' }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await damageReportRepository.deleteDamageReport(id);

      if (!deleted) {
        throw new NotFoundError('Damage report not found');
      }

      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;


In this refactored version, all database operations have been replaced with calls to the `DamageReportRepository`. The repository methods used are:

1. `getDamageReportsByVehicleId`
2. `createDamageReport`
3. `getDamageReportById`
4. `updateDamageReport`
5. `deleteDamageReport`

These methods should be implemented in the `DamageReportRepository` class to handle the actual database operations. The rest of the file remains unchanged, maintaining the existing functionality while improving the separation of concerns by moving database operations to a dedicated repository.