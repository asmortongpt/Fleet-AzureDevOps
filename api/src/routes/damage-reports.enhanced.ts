To refactor the `damage-reports.enhanced.ts` file to use the repository pattern, we'll need to create a `DamageReportRepository` and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


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

      const uploadPromises = (files as Express.Multer.File[]).map(async file => {
        const blobName = uuidv4() + '-' + file.originalname;
        const containerClient = blobServiceClient!.getContainerClient('damage-reports');
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        return {
          blobName,
          url: blockBlobClient.url,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      const photos = uploadedFiles
        .filter(file => file.blobName.startsWith('photo-'))
        .map(file => file.url);

      const videos = uploadedFiles
        .filter(file => file.blobName.startsWith('video-'))
        .map(file => file.url);

      const lidarScans = uploadedFiles
        .filter(file => file.blobName.startsWith('lidar-'))
        .map(file => file.url);

      const newDamageReport = {
        ...parsedData,
        photos,
        videos,
        lidar_scans: lidarScans,
      };

      const createdDamageReport = await damageReportRepository.createDamageReport(newDamageReport);

      res.status(201).json(createdDamageReport);
    } catch (error) {
      handleError(res, error);
    }
  }
);

export default router;


In this refactored version, we've made the following changes:

1. Imported the `DamageReportRepository` at the top of the file.
2. Resolved the `DamageReportRepository` instance from the container.
3. Replaced the `pool.query` call in the GET route with a call to `damageReportRepository.getDamageReportsByVehicleId`.
4. Replaced the database insertion logic in the POST route with a call to `damageReportRepository.createDamageReport`.

Note that this refactoring assumes the existence of a `DamageReportRepository` class with the following methods:


class DamageReportRepository {
  async getDamageReportsByVehicleId(vehicleId: string, limit: number, offset: number): Promise<any[]> {
    // Implementation to fetch damage reports by vehicle ID with pagination
  }

  async createDamageReport(damageReport: any): Promise<any> {
    // Implementation to create a new damage report
  }
}


You'll need to implement these methods in the `DamageReportRepository` class to complete the refactoring process. The repository should handle the database interactions, allowing the route handlers to focus on business logic and data processing.