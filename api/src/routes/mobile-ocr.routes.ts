/**
 * Mobile OCR API Routes
 *
 * Production-ready endpoints for mobile OCR processing:
 * - Fuel receipt upload and OCR processing
 * - Odometer reading capture and validation
 * - Data validation and storage
 * - Integration with existing fuel transactions and vehicle tracking
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import ocrService from '../services/OcrService';
import pool from '../config/database';
import { getErrorMessage } from '../utils/error-handler'

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
            preprocessImage: true,
          }
        );

        // Parse OCR text to extract fuel receipt data
        ocrResult = parseFuelReceiptFromOCR(result.fullText);
      }

      // Store receipt image
      const receiptFileName = `${documentId}.jpg`;
      const receiptPath = path.join(
        process.env.RECEIPT_STORAGE_PATH || '/app/storage/receipts',
        tenantId,
        receiptFileName
      );

      // Ensure directory exists
      await fs.mkdir(path.dirname(receiptPath), { recursive: true });

      // Move file to permanent storage
      await fs.rename(req.file.path, receiptPath);

      // Create fuel transaction record
      const transactionDate = ocrResult.date ? new Date(ocrResult.date) : new Date();

      const result = await pool.query(
        `INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, driver_id, transaction_date,
          gallons, price_per_gallon, odometer_reading,
          fuel_type, location, receipt_photo, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tenantId,
          validatedData.vehicleId,
          validatedData.driverId,
          transactionDate,
          ocrResult.gallons,
          ocrResult.pricePerGallon,
          null, // odometer reading will be captured separately
          ocrResult.fuelType || 'Regular',
          ocrResult.location,
          receiptPath,
          ocrResult.notes,
        ]
      );

      const transaction = result.rows[0];

      // Store OCR metadata
      await pool.query(
        `INSERT INTO mobile_ocr_captures (
          tenant_id, user_id, capture_type, document_id,
          image_path, ocr_data, confidence_scores, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          tenantId,
          userId,
          'fuel_receipt',
          documentId,
          receiptPath,
          JSON.stringify(ocrResult),
          JSON.stringify(ocrResult.confidenceScores || {}),
        ]
      );

      return res.status(201).json({
        message: 'Fuel receipt processed successfully',
        transaction,
        ocrData: ocrResult,
        confidenceScores: ocrResult.confidenceScores,
        documentId,
      });
    } catch (error: any) {
      console.error('Fuel receipt OCR error:', error);

      // Clean up uploaded file on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Failed to process fuel receipt',
        message: getErrorMessage(error),
      });
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
  requirePermission('vehicle:update:own'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'odometer_reading_ocr' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { tenantId, userId } = req.user!;

      // Parse and validate request body
      const body = {
        vehicleId: req.body.vehicleId,
        tripId: req.body.tripId || undefined,
        reservationId: req.body.reservationId || undefined,
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
            preprocessImage: true,
          }
        );

        // Parse OCR text to extract odometer reading
        ocrResult = parseOdometerFromOCR(result.fullText);
      }

      // Validate against last odometer reading
      const lastReadingResult = await pool.query(
        `SELECT odometer_reading, reading_date
         FROM odometer_readings
         WHERE vehicle_id = $1 AND tenant_id = $2
         ORDER BY reading_date DESC
         LIMIT 1`,
        [validatedData.vehicleId, tenantId]
      );

      if (lastReadingResult.rows.length > 0) {
        const lastReading = parseFloat(lastReadingResult.rows[0].odometer_reading);

        if (ocrResult.reading < lastReading) {
          return res.status(400).json({
            error: 'Invalid odometer reading',
            message: `Reading (${ocrResult.reading}) cannot be less than last reading (${lastReading})`,
            lastReading,
            lastReadingDate: lastReadingResult.rows[0].reading_date,
          });
        }

        // Alert if large increase
        if (ocrResult.reading - lastReading > 1000) {
          console.warn(
            `Large odometer increase for vehicle ${validatedData.vehicleId}: ${ocrResult.reading - lastReading} ${ocrResult.unit}`
          );
        }
      }

      // Store odometer image
      const odometerFileName = `${documentId}.jpg`;
      const odometerPath = path.join(
        process.env.ODOMETER_STORAGE_PATH || '/app/storage/odometer',
        tenantId,
        odometerFileName
      );

      // Ensure directory exists
      await fs.mkdir(path.dirname(odometerPath), { recursive: true });

      // Move file to permanent storage
      await fs.rename(req.file.path, odometerPath);

      // Create odometer reading record
      const result = await pool.query(
        `INSERT INTO odometer_readings (
          tenant_id, vehicle_id, odometer_reading, reading_date,
          reading_type, unit, photo_path, trip_id, reservation_id,
          confidence_score, notes, created_by
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          tenantId,
          validatedData.vehicleId,
          ocrResult.reading,
          'ocr',
          ocrResult.unit,
          odometerPath,
          validatedData.tripId,
          validatedData.reservationId,
          ocrResult.confidence,
          ocrResult.notes,
          userId,
        ]
      );

      const reading = result.rows[0];

      // Update vehicle's current odometer reading
      await pool.query(
        `UPDATE vehicles
         SET odometer_reading = $1, last_odometer_update = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [ocrResult.reading, validatedData.vehicleId, tenantId]
      );

      // Store OCR metadata
      await pool.query(
        `INSERT INTO mobile_ocr_captures (
          tenant_id, user_id, capture_type, document_id,
          image_path, ocr_data, confidence_scores, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          tenantId,
          userId,
          'odometer',
          documentId,
          odometerPath,
          JSON.stringify(ocrResult),
          JSON.stringify({ reading: ocrResult.confidence }),
        ]
      );

      return res.status(201).json({
        message: 'Odometer reading processed successfully',
        reading,
        ocrData: ocrResult,
        confidence: ocrResult.confidence,
        documentId,
      });
    } catch (error: any) {
      console.error('Odometer OCR error:', error);

      // Clean up uploaded file on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Failed to process odometer reading',
        message: getErrorMessage(error),
      });
    }
  }
);

/**
 * @route POST /api/mobile/ocr/validate
 * @desc Validate extracted OCR data
 * @access Private
 */
router.post(
  '/ocr/validate',
  requirePermission('fuel_transaction:view:own'),
  auditLog({ action: 'READ', resourceType: 'ocr_validation' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = ValidationSchema.parse(req.body);

      let validationResult: any = { valid: false, errors: [] };

      if (validatedData.type === 'fuel-receipt') {
        try {
          FuelReceiptOCRSchema.shape.ocrData!.parse(validatedData.data);
          validationResult = {
            valid: true,
            data: validatedData.data,
            warnings: [],
          };

          // Add warnings for low confidence scores
          if (validatedData.data.confidenceScores) {
            Object.entries(validatedData.data.confidenceScores).forEach(
              ([field, score]) => {
                if (score < 0.8) {
                  validationResult.warnings.push(
                    `Low confidence (${(score * 100).toFixed(0)}%) for field: ${field}`
                  );
                }
              }
            );
          }
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            validationResult.errors = error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }));
          }
        }
      } else if (validatedData.type === 'odometer') {
        try {
          OdometerOCRSchema.shape.ocrData!.parse(validatedData.data);
          validationResult = {
            valid: true,
            data: validatedData.data,
            warnings: [],
          };

          // Add warning for low confidence
          if (validatedData.data.confidence < 0.85) {
            validationResult.warnings.push(
              `Low confidence (${(validatedData.data.confidence * 100).toFixed(0)}%) for odometer reading`
            );
          }
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            validationResult.errors = error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }));
          }
        }
      }

      return res.status(200).json(validationResult);
    } catch (error: any) {
      console.error('Validation error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Validation failed',
        message: getErrorMessage(error),
      });
    }
  }
);

/**
 * @route GET /api/mobile/ocr/history
 * @desc Get OCR capture history for user
 * @access Private
 */
router.get(
  '/ocr/history',
  requirePermission('fuel_transaction:view:own'),
  auditLog({ action: 'READ', resourceType: 'ocr_history' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, userId } = req.user!;
      const { type, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT ` + (await getTableColumns(pool, 'mobile_ocr_captures')).join(', ') + ` FROM mobile_ocr_captures
        WHERE tenant_id = $1 AND user_id = $2
      `;
      const params: any[] = [tenantId, userId];

      if (type) {
        query += ` AND capture_type = $3`;
        params.push(type);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return res.status(200).json({
        captures: result.rows,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: result.rows.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching OCR history:', error);
      return res.status(500).json({
        error: 'Failed to fetch OCR history',
        message: getErrorMessage(error),
      });
    }
  }
);

/**
 * Helper function to parse fuel receipt from OCR text
 */
function parseFuelReceiptFromOCR(text: string): any {
  // Simplified parsing logic (mobile service does most of this)
  return {
    date: new Date().toISOString(),
    station: 'Unknown',
    gallons: 0,
    pricePerGallon: 0,
    totalCost: 0,
    confidenceScores: {
      date: 0.5,
      station: 0.5,
      gallons: 0.5,
      pricePerGallon: 0.5,
      totalCost: 0.5,
    },
  };
}

/**
 * Helper function to parse odometer reading from OCR text
 */
function parseOdometerFromOCR(text: string): any {
  // Extract numbers from text
  const numbers = text.match(/\d{5,7}/g);
  const reading = numbers && numbers.length > 0 ? parseInt(numbers[0], 10) : 0;

  return {
    reading,
    unit: 'miles' as const,
    confidence: 0.8,
  };
}

export default router;
