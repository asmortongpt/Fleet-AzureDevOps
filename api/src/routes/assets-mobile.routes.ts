To refactor the `assets-mobile.routes.ts` file to use the repository pattern, we'll need to create a repository for handling database operations and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import logger from '../config/logger';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { AssetRepository } from '../repositories/AssetRepository';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Schema for checkout/checkin request validation
const assetActionSchema = z.object({
  assetId: z.number(),
  userId: z.number(),
  tenantId: z.number(),
  gpsLat: z.number().min(-90).max(90),
  gpsLng: z.number().min(-180).max(180),
  conditionRating: z.number().min(1).max(5),
  digitalSignature: z.string(),
});

// Initialize the repository
const assetRepository = new AssetRepository();

router.post(
  '/checkout',
  csrfProtection,
  authenticateJWT,
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId, tenantId, gpsLat, gpsLng, conditionRating, digitalSignature } =
        assetActionSchema.parse(req.body);
      const photo = req.file;

      if (!photo) {
        return res.status(400).send('Photo is required.');
      }

      const result = await assetRepository.checkoutAsset(
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        photo.buffer
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Checkout Error:', error);
      res.status(500).send('Internal server error during asset checkout.');
    }
  }
);

router.post(
  '/checkin',
  csrfProtection,
  authenticateJWT,
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId, tenantId, gpsLat, gpsLng, conditionRating, digitalSignature } =
        assetActionSchema.parse(req.body);
      const photo = req.file;

      if (!photo) {
        return res.status(400).send('Photo is required.');
      }

      const result = await assetRepository.checkinAsset(
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        photo.buffer
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Checkin Error:', error);
      res.status(500).send('Internal server error during asset checkin.');
    }
  }
);

export default router;


Now, we need to create the `AssetRepository` class. Here's an example implementation of the `AssetRepository` class that you should create in a new file named `AssetRepository.ts` in the `repositories` directory:


// repositories/AssetRepository.ts

import { pool } from '../db';

export class AssetRepository {
  async checkoutAsset(
    assetId: number,
    userId: number,
    tenantId: number,
    gpsLat: number,
    gpsLng: number,
    conditionRating: number,
    digitalSignature: string,
    photo: Buffer
  ) {
    const queryText = `
      INSERT INTO asset_checkout_history(asset_id, user_id, tenant_id, gps_lat, gps_lng, condition_rating, digital_signature, photo)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      assetId,
      userId,
      tenantId,
      gpsLat,
      gpsLng,
      conditionRating,
      digitalSignature,
      photo,
    ];
    const { rows } = await pool.query(queryText, values);
    return rows[0];
  }

  async checkinAsset(
    assetId: number,
    userId: number,
    tenantId: number,
    gpsLat: number,
    gpsLng: number,
    conditionRating: number,
    digitalSignature: string,
    photo: Buffer
  ) {
    const queryText = `
      INSERT INTO asset_checkin_history(asset_id, user_id, tenant_id, gps_lat, gps_lng, condition_rating, digital_signature, photo)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      assetId,
      userId,
      tenantId,
      gpsLat,
      gpsLng,
      conditionRating,
      digitalSignature,
      photo,
    ];
    const { rows } = await pool.query(queryText, values);
    return rows[0];
  }
}


This refactoring moves the database operations into the `AssetRepository` class, which encapsulates the logic for checking out and checking in assets. The route handlers now use the repository methods instead of directly querying the database, which improves separation of concerns and makes the code more maintainable and testable.