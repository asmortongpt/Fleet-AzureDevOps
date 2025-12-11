Here's the complete refactored version of the `charging-stations.enhanced.ts` file, with all `pool.query` calls replaced by repository methods:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import csurf from 'csurf';
import { csrfProtection } from '../middleware/csrf';
import { ChargingStationRepository } from '../repositories/chargingStationRepository';

const router = express.Router();

// Import the repository
const chargingStationRepository = container.resolve(ChargingStationRepository);

router.use(authenticateJWT);
router.use(helmet());
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
);
router.use(csurf());

const chargingStationSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  charger_type: z.string().min(1),
  power_output: z.number(),
  status: z.string().min(1),
  is_active: z.boolean(),
});

// GET /charging-stations
router.get(
  '/',
  requirePermission('charging_station:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [stations, totalCount] = await Promise.all([
        chargingStationRepository.getChargingStations(req.user!.tenant_id, Number(limit), offset),
        chargingStationRepository.getChargingStationCount(req.user!.tenant_id)
      ]);

      res.json({
        data: stations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      console.error(`Get charging-stations error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /charging-stations/:id
router.get(
  '/:id',
  requirePermission('charging_station:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const station = await chargingStationRepository.getChargingStationById(req.params.id, req.user!.tenant_id);

      if (!station) {
        return res.status(404).json({ error: `Charging station not found` });
      }

      res.json(station);
    } catch (error) {
      console.error('Get charging-stations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /charging-stations
router.post(
  '/',
  csrfProtection,
  requirePermission('charging_station:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = chargingStationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error });
      }

      const newStation = await chargingStationRepository.createChargingStation({
        ...req.body,
        tenant_id: req.user!.tenant_id
      });

      res.status(201).json(newStation);
    } catch (error) {
      console.error('Create charging-station error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /charging-stations/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('charging_station:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validationResult = chargingStationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error });
      }

      const updatedStation = await chargingStationRepository.updateChargingStation(
        req.params.id,
        req.user!.tenant_id,
        req.body
      );

      if (!updatedStation) {
        return res.status(404).json({ error: 'Charging station not found' });
      }

      res.json(updatedStation);
    } catch (error) {
      console.error('Update charging-station error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /charging-stations/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('charging_station:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'charging_stations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await chargingStationRepository.deleteChargingStation(req.params.id, req.user!.tenant_id);

      if (!deleted) {
        return res.status(404).json({ error: 'Charging station not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete charging-station error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the `ChargingStationRepository` from the appropriate location.
2. We've resolved the repository instance using the dependency injection container.
3. All `pool.query` calls have been replaced with corresponding methods from the `ChargingStationRepository`:
   - `getChargingStations` for fetching multiple stations
   - `getChargingStationCount` for getting the total count
   - `getChargingStationById` for fetching a single station
   - `createChargingStation` for creating a new station
   - `updateChargingStation` for updating an existing station
   - `deleteChargingStation` for deleting a station

4. The repository methods are called with the appropriate parameters, including the `tenant_id` from the authenticated user.

5. Error handling and response formatting remain the same as in the original code.

This refactoring improves the separation of concerns by moving the database operations into a dedicated repository class, making the code more maintainable and easier to test.