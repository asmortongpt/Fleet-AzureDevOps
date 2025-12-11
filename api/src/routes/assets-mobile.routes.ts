import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import logger from '../config/logger';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { AssetRepository } from '../repositories/AssetRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AssetCheckoutHistoryRepository } from '../repositories/AssetCheckoutHistoryRepository';
import { AssetCheckinHistoryRepository } from '../repositories/AssetCheckinHistoryRepository';
import { AssetStatusRepository } from '../repositories/AssetStatusRepository';

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

// Initialize the repositories
const assetRepository = new AssetRepository();
const userRepository = new UserRepository();
const assetCheckoutHistoryRepository = new AssetCheckoutHistoryRepository();
const assetCheckinHistoryRepository = new AssetCheckinHistoryRepository();
const assetStatusRepository = new AssetStatusRepository();

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

      const user = await userRepository.getUserById(userId, tenantId);
      if (!user) {
        return res.status(404).send('User not found.');
      }

      const asset = await assetRepository.getAssetById(assetId, tenantId);
      if (!asset) {
        return res.status(404).send('Asset not found.');
      }

      if (asset.status !== 'available') {
        return res.status(400).send('Asset is not available for checkout.');
      }

      const checkoutHistory = await assetCheckoutHistoryRepository.createCheckoutHistory(
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        photo.buffer
      );

      await assetStatusRepository.updateAssetStatus(assetId, 'checked_out', tenantId);

      res.status(201).json(checkoutHistory);
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

      const user = await userRepository.getUserById(userId, tenantId);
      if (!user) {
        return res.status(404).send('User not found.');
      }

      const asset = await assetRepository.getAssetById(assetId, tenantId);
      if (!asset) {
        return res.status(404).send('Asset not found.');
      }

      if (asset.status !== 'checked_out') {
        return res.status(400).send('Asset is not checked out.');
      }

      const checkinHistory = await assetCheckinHistoryRepository.createCheckinHistory(
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        photo.buffer
      );

      await assetStatusRepository.updateAssetStatus(assetId, 'available', tenantId);

      res.status(201).json(checkinHistory);
    } catch (error) {
      logger.error('Checkin Error:', error);
      res.status(500).send('Internal server error during asset checkin.');
    }
  }
);

export default router;