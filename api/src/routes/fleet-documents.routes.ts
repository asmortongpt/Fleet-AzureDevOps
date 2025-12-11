Here's the complete refactored version of the `fleet-documents.routes.ts` file, replacing all database operations with repository methods:


import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { csrfProtection } from '../middleware/csrf';
import { DocumentRepository } from '../repositories/document.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { DriverRepository } from '../repositories/driver.repository';
import { WorkOrderRepository } from '../repositories/workorder.repository';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { getErrorMessage } from '../utils/error-handler';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || '/tmp/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
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
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: images, PDF, Word, Excel, text files'));
    }
  }
});

// Apply authentication to all routes
router.use(authenticateJWT);

// Initialize repositories
const documentRepository = container.resolve(DocumentRepository);
const vehicleRepository = container.resolve(VehicleRepository);
const driverRepository = container.resolve(DriverRepository);
const workOrderRepository = container.resolve(WorkOrderRepository);

// ============================================================================
// Document CRUD Operations
// ============================================================================

/**
 * @openapi
 * /api/fleet-documents/upload:
 *   post:
 *     summary: Upload a document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - documentType
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               vehicleId:
 *                 type: integer
 *               driverId:
 *                 type: integer
 *               workOrderId:
 *                 type: integer
 *               documentType:
 *                 type: string
 *                 enum: [registration, insurance, inspection, maintenance, license, permit, other]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/upload', csrfProtection, upload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vehicleId, driverId, workOrderId, documentType, title, description, expiresAt } = req.body;
  const file = req.file;

  if (!file) {
    throw new ValidationError('No file uploaded');
  }

  if (!documentType || !title) {
    throw new ValidationError('documentType and title are required');
  }

  const documentData = {
    userId: req.user.id,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
    documentType,
    title,
    description,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
    driverId: driverId ? parseInt(driverId, 10) : null,
    workOrderId: workOrderId ? parseInt(workOrderId, 10) : null
  };

  const document = await documentRepository.createDocument(documentData);

  if (document.vehicleId) {
    await vehicleRepository.addDocumentToVehicle(document.vehicleId, document.id);
  }
  if (document.driverId) {
    await driverRepository.addDocumentToDriver(document.driverId, document.id);
  }
  if (document.workOrderId) {
    await workOrderRepository.addDocumentToWorkOrder(document.workOrderId, document.id);
  }

  auditLog(req, 'Document uploaded', { documentId: document.id });

  res.status(201).json({ message: 'Document uploaded successfully', documentId: document.id });
}));

/**
 * @openapi
 * /api/fleet-documents/{id}:
 *   get:
 *     summary: Get a specific document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const documentId = parseInt(req.params.id, 10);
  const document = await documentRepository.getDocumentById(documentId);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  authorize(req, document.userId);

  res.json(document);
}));

/**
 * @openapi
 * /api/fleet-documents:
 *   get:
 *     summary: List all documents
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: workOrderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: expiresBefore
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: expiresAfter
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of documents retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/', csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vehicleId, driverId, workOrderId, documentType, expiresBefore, expiresAfter } = req.query;

  const filter: any = {
    userId: req.user.id,
    vehicleId: vehicleId ? parseInt(vehicleId as string, 10) : undefined,
    driverId: driverId ? parseInt(driverId as string, 10) : undefined,
    workOrderId: workOrderId ? parseInt(workOrderId as string, 10) : undefined,
    documentType: documentType as string,
    expiresBefore: expiresBefore ? new Date(expiresBefore as string) : undefined,
    expiresAfter: expiresAfter ? new Date(expiresAfter as string) : undefined
  };

  const documents = await documentRepository.getDocuments(filter);

  res.json(documents);
}));

/**
 * @openapi
 * /api/fleet-documents/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const documentId = parseInt(req.params.id, 10);
  const { title, description, expiresAt } = req.body;

  const document = await documentRepository.getDocumentById(documentId);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  authorize(req, document.userId);

  const updateData: any = {
    title,
    description,
    expiresAt: expiresAt ? new Date(expiresAt) : null
  };

  const updatedDocument = await documentRepository.updateDocument(documentId, updateData);

  auditLog(req, 'Document updated', { documentId });

  res.json(updatedDocument);
}));

/**
 * @openapi
 * /api/fleet-documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', csrfProtection, asyncHandler(async (req: AuthRequest, res: Response) => {
  const documentId = parseInt(req.params.id, 10);

  const document = await documentRepository.getDocumentById(documentId);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  authorize(req, document.userId);

  await documentRepository.deleteDocument(documentId);

  auditLog(req, 'Document deleted', { documentId });

  res.json({ message: 'Document deleted successfully' });
}));

export default router;


In this refactored version:

1. We've imported the necessary repository classes at the top of the file.
2. We've initialized the repositories using the dependency injection container.
3. All database operations have been replaced with calls to the appropriate repository methods:
   - `documentRepository.createDocument()` for creating a new document
   - `documentRepository.getDocumentById()` for retrieving a specific document
   - `documentRepository.getDocuments()` for listing documents
   - `documentRepository.updateDocument()` for updating a document
   - `documentRepository.deleteDocument()` for deleting a document
   - `vehicleRepository.addDocumentToVehicle()` for associating a document with a vehicle
   - `driverRepository.addDocumentToDriver()` for associating a document with a driver
   - `workOrderRepository.addDocumentToWorkOrder()` for associating a document with a work order

4. The overall structure and functionality of the routes remain the same, but now they use the repository pattern for data access.

This refactoring improves the separation of concerns, making the code more modular and easier to maintain. The database operations are now encapsulated within the repository classes, which can be easily tested and modified without affecting the route handlers.