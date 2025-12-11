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

// Import necessary repositories
import { FuelReceiptRepository } from '../repositories/FuelReceiptRepository';
import { OdometerReadingRepository } from '../repositories/OdometerReadingRepository';
import { ValidationRepository } from '../repositories/ValidationRepository';

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
      const fuelReceiptRepository = container.resolve(FuelReceiptRepository);
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
            detectForms: true,
          }
        );

        ocrResult = result.data;
      }

      // Save the processed data to the database
      const odometerReadingRepository = container.resolve(OdometerReadingRepository);
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
 * @route POST /api/mobile/validate-ocr
 * @desc Validate OCR data
 * @access Private
 */
router.post(
  '/validate-ocr',
  csrfProtection,
  requirePermission('ocr:validate'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId } = req.user!;

      const validatedData = ValidationSchema.parse(req.body);

      const validationRepository = container.resolve(ValidationRepository);
      const validationResult = await validationRepository.validateOCRData({
        tenantId,
        type: validatedData.type,
        data: validatedData.data,
      });

      res.status(200).json({
        message: 'OCR data validated successfully',
        data: validationResult,
      });
    } catch (error) {
      logger.error(`Error validating OCR data: ${getErrorMessage(error)}`);
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
);

export default router;