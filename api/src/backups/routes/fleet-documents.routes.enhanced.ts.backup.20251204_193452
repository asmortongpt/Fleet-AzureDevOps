import { Router, Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import pool from '../config/database';
import documentService from '../services/document.service';
import { getErrorMessage } from '../utils/error-handler';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';

const router = Router();

router.use(helmet());
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

// CSRF protection
router.use(csurf({ cookie: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || '/tmp/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: images, PDF, Word, Excel, text files.'));
    }
  },
});

// Apply authentication to all routes
router.use(authenticateJWT);

// Document upload schema
const documentUploadSchema = z.object({
  vehicleId: z.number().optional(),
  driverId: z.number().optional(),
  workOrderId: z.number().optional(),
  documentType: z.enum(['registration', 'insurance', 'inspection', 'maintenance', 'license', 'permit', 'other']),
  title: z.string(),
  description: z.string().optional(),
});

router.post('/upload', upload.single('file'), authorize(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validationResult = documentUploadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const documentData = validationResult.data;
    const userId = req.user.id;

    // Process file upload...
    const document = await documentService.createDocument({ ...documentData, userId, filePath: file.path });

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;