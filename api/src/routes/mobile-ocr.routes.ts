Here's the refactored version of `mobile-ocr.routes.ts` where all `pool.query`/`db.query` calls have been replaced with repository methods. I've assumed the existence of appropriate repository classes and methods. The complete file is provided below:


import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import ocrService from '../services/OcrService';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Configure multer for file uploads
const upload = multer({
  dest: process.env.MOBILE_OCR_UPLOAD_DIR || '/tmp/mobile-ocr-uploads',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for mobile uploads
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Validation schemas
const FuelReceiptOCRSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  ocrData: z
    .object({
      date: z.string(),
      station: z.string(),
      gallons: z.number().positive(),
      pricePerGallon: z.number().positive(),
      totalCost: z.number().positive(),
      fuelType: z.string().optional(),
      location: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
      confidenceScores: z.record(z.number()).optional(),
    })
    .optional(),
});

const OdometerOCRSchema = z.object({
  vehicleId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  reservationId: z.string().uuid().optional(),
  ocrData: z
    .object({
      reading: z.number().positive(),
      unit: z.enum(['miles', 'kilometers']),
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
    })
    .optional(),
});

const ValidationSchema = z.object({
  type: z.enum(['fuel-receipt', 'odometer']),
  data: z.record(z.any()),
});

/**
 * @route POST /api/mobile/fuel-receipts/ocr
 * @desc Upload and process fuel receipt with OCR
 * @access Private
 */
router.post(
  '/fuel-receipts/ocr',
  csrfProtection,
  requirePermission('fuel_transaction:create:own'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'fuel_receipt_ocr' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { tenantId, userId } = req.user!;

      // Parse and validate request body
      const body = {
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId || null,
        ocrData: req.body.ocrData ? JSON.parse(req.body.ocrData) : undefined,
      };

      const validatedData = FuelReceiptOCRSchema.parse(body);

      // Generate document ID
      const documentId = `fuel-receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Process image with OCR if no OCR data provided
      let ocrResult = validatedData.ocrData;

      if (!ocrResult) {
        const result = await ocrService.processDocument(
          req.file.path,
          documentId,
          {
            provider: 'auto' as any,
            detectTables: false,
            detectForms: true,
          }
        );

        ocrResult = result.data;
      }

      // Save the processed data to the database
      const fuelReceiptRepository = container.resolve('FuelReceiptRepository');
      const newFuelReceipt = await fuelReceiptRepository.createFuelReceipt({
        tenantId,
        userId,
        documentId,
        vehicleId: validatedData.vehicleId,
        driverId: validatedData.driverId || null,
        ...ocrResult,
      });

      // Clean up the uploaded file
      await fs.unlink(req.file.path);

      res.status(201).json({
        message: 'Fuel receipt processed successfully',
        data: newFuelReceipt,
      });
    } catch (error) {
      logger.error(`Error processing fuel receipt: ${getErrorMessage(error)}`);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

/**
 * @route POST /api/mobile/odometer/ocr
 * @desc Upload and process odometer reading with OCR
 * @access Private
 */
router.post(
  '/odometer/ocr',
  csrfProtection,
  requirePermission('vehicle:update:own'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'odometer_ocr' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { tenantId, userId } = req.user!;

      // Parse and validate request body
      const body = {
        vehicleId: req.body.vehicleId,
        tripId: req.body.tripId || null,
        reservationId: req.body.reservationId || null,
        ocrData: req.body.ocrData ? JSON.parse(req.body.ocrData) : undefined,
      };

      const validatedData = OdometerOCRSchema.parse(body);

      // Generate document ID
      const documentId = `odometer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Process image with OCR if no OCR data provided
      let ocrResult = validatedData.ocrData;

      if (!ocrResult) {
        const result = await ocrService.processDocument(
          req.file.path,
          documentId,
          {
            provider: 'auto' as any,
            detectTables: false,
            detectForms: false,
          }
        );

        ocrResult = result.data;
      }

      // Save the processed data to the database
      const odometerReadingRepository = container.resolve('OdometerReadingRepository');
      const newOdometerReading = await odometerReadingRepository.createOdometerReading({
        tenantId,
        userId,
        documentId,
        vehicleId: validatedData.vehicleId,
        tripId: validatedData.tripId || null,
        reservationId: validatedData.reservationId || null,
        ...ocrResult,
      });

      // Clean up the uploaded file
      await fs.unlink(req.file.path);

      res.status(201).json({
        message: 'Odometer reading processed successfully',
        data: newOdometerReading,
      });
    } catch (error) {
      logger.error(`Error processing odometer reading: ${getErrorMessage(error)}`);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

/**
 * @route POST /api/mobile/validate
 * @desc Validate OCR data
 * @access Private
 */
router.post(
  '/validate',
  csrfProtection,
  requirePermission('fuel_transaction:validate:own'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, userId } = req.user!;

      const validatedData = ValidationSchema.parse(req.body);

      let validationResult;

      if (validatedData.type === 'fuel-receipt') {
        const fuelReceiptValidator = container.resolve('FuelReceiptValidator');
        validationResult = await fuelReceiptValidator.validateFuelReceipt(validatedData.data);
      } else if (validatedData.type === 'odometer') {
        const odometerValidator = container.resolve('OdometerValidator');
        validationResult = await odometerValidator.validateOdometerReading(validatedData.data);
      } else {
        throw new ValidationError('Invalid validation type');
      }

      res.status(200).json({
        message: 'Validation completed',
        data: validationResult,
      });
    } catch (error) {
      logger.error(`Error validating OCR data: ${getErrorMessage(error)}`);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

export default router;


In this refactored version:

1. I've replaced the direct database queries with repository methods:
   - `FuelReceiptRepository.createFuelReceipt` for fuel receipt processing
   - `OdometerReadingRepository.createOdometerReading` for odometer reading processing
   - `FuelReceiptValidator.validateFuelReceipt` for fuel receipt validation
   - `OdometerValidator.validateOdometerReading` for odometer reading validation

2. These repository methods are resolved from the dependency injection container using `container.resolve()`.

3. The rest of the code structure and functionality remains the same, maintaining the original logic and error handling.

4. I've assumed that the repository methods return the newly created or validated objects, which are then sent back in the response.

5. The error handling and logging remain unchanged, using the existing `logger` and `getErrorMessage` utilities.

This refactoring improves the separation of concerns, making the code more modular and easier to maintain. The database operations are now encapsulated within the repository classes, which can be easily tested and modified without affecting the route handlers.