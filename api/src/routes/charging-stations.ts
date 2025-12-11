Here's the complete refactored version of the `charging-stations.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';
import { csrfProtection } from '../middleware/csrf';
import { ChargingStationRepository } from '../repositories/chargingStationRepository';

const router = express.Router();
router.use(authenticateJWT);

// Initialize the repository
const chargingStationRepository = container.resolve(ChargingStationRepository);

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
          pages: Math.ceil(totalCount / Number(limit))
        }
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
        return res.status(404).json({ error: `ChargingStation not found` });
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
      const newStation = await chargingStationRepository.createChargingStation({
        ...req.body,
        tenant_id: req.user!.tenant_id
      });

      res.status(201).json(newStation);
    } catch (error) {
      console.error(`Create charging-stations error:`, error);
      res.status(500).json({ error: `Internal server error` });
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
      const updatedStation = await chargingStationRepository.updateChargingStation(req.params.id, req.user!.tenant_id, req.body);

      if (!updatedStation) {
        return res.status(404).json({ error: `ChargingStation not found` });
      }

      res.json(updatedStation);
    } catch (error) {
      console.error(`Update charging-stations error:`, error);
      res.status(500).json({ error: `Internal server error` });
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
        return res.status(404).json({ error: `ChargingStation not found` });
      }

      res.status(204).send();
    } catch (error) {
      console.error(`Delete charging-stations error:`, error);
      res.status(500).json({ error: `Internal server error` });
    }
  }
);

export default router;


This refactored version of `charging-stations.ts` replaces all `pool.query` calls with methods from the `ChargingStationRepository`. The repository methods used are:

1. `getChargingStations`
2. `getChargingStationCount`
3. `getChargingStationById`
4. `createChargingStation`
5. `updateChargingStation`
6. `deleteChargingStation`

These methods should be implemented in the `ChargingStationRepository` class, which is assumed to be located in `../repositories/chargingStationRepository.ts`. The repository class should handle the database operations that were previously done using `pool.query`.

Note that this refactoring assumes that the `ChargingStationRepository` class has been properly implemented with the necessary methods. You may need to create or update this class to match the new structure and ensure all database operations are correctly handled.