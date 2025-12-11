Here's the complete refactored version of the `geofences.enhanced.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { zodValidator } from '../middleware/zodValidator';
import { csrfProtection } from '../middleware/csrf';
import { GeofenceRepository } from '../repositories/GeofenceRepository';

const router = express.Router();

// Import the GeofenceRepository
const geofenceRepository = container.resolve(GeofenceRepository);

router.use(authenticateJWT);
router.use(helmet());
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

const geofenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  geometry: z.string(), // Simplified for example; in production, use a more complex validation for geometries
  type: z.enum(['circle', 'polygon']),
  radius: z.number().optional(),
  is_active: z.boolean(),
});

// GET /geofences
router.get(
  '/',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [geofences, totalCount] = await Promise.all([
        geofenceRepository.getGeofences(req.user!.tenant_id, Number(limit), offset),
        geofenceRepository.getGeofenceCount(req.user!.tenant_id)
      ]);

      res.json({
        data: geofences,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      console.error(`Get geofences error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /geofences/:id
router.get(
  '/:id',
  requirePermission('geofence:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const geofence = await geofenceRepository.getGeofenceById(req.params.id, req.user!.tenant_id);

      if (!geofence) {
        return res.status(404).json({ error: `Geofence not found` });
      }

      res.json(geofence);
    } catch (error) {
      console.error('Get geofence error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /geofences
router.post(
  '/',
  csrfProtection,
  requirePermission('geofence:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'geofences' }),
  zodValidator(geofenceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      const newGeofence = await geofenceRepository.createGeofence(
        req.user!.tenant_id,
        data.name,
        data.description,
        data.geometry,
        data.type,
        data.radius,
        data.is_active
      );

      res.status(201).json(newGeofence);
    } catch (error) {
      console.error(`Create geofence error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /geofences/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('geofence:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'geofences' }),
  zodValidator(geofenceSchema.partial()),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      const updatedGeofence = await geofenceRepository.updateGeofence(
        req.params.id,
        req.user!.tenant_id,
        data.name,
        data.description,
        data.geometry,
        data.type,
        data.radius,
        data.is_active
      );

      if (!updatedGeofence) {
        return res.status(404).json({ error: 'Geofence not found' });
      }

      res.json(updatedGeofence);
    } catch (error) {
      console.error('Update geofence error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /geofences/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('geofence:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'geofences' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await geofenceRepository.deleteGeofence(req.params.id, req.user!.tenant_id);

      if (!deleted) {
        return res.status(404).json({ error: 'Geofence not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete geofence error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


This refactored version replaces all `pool.query` calls with corresponding methods from the `GeofenceRepository`. The repository methods are assumed to be implemented in the `GeofenceRepository` class, which should handle the database operations.

Key changes:

1. Imported `GeofenceRepository` from `../repositories/GeofenceRepository`.
2. Resolved the `GeofenceRepository` instance using the dependency injection container.
3. Replaced all `pool.query` calls with appropriate `geofenceRepository` method calls:
   - `getGeofences` for fetching multiple geofences
   - `getGeofenceCount` for getting the total count of geofences
   - `getGeofenceById` for fetching a single geofence
   - `createGeofence` for creating a new geofence
   - `updateGeofence` for updating an existing geofence
   - `deleteGeofence` for deleting a geofence

The rest of the code structure and middleware usage remains the same. This refactoring improves the separation of concerns by moving database operations to a dedicated repository class, making the code more maintainable and easier to test.