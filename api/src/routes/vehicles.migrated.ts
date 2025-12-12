import { Router } from 'express';
import { container, TYPES } from '../container';
import { VehiclesService } from '../modules/fleet/vehicles/vehicles.service';
import { authenticateJWT } from '../middleware/auth';
import { ValidationError } from '../errors/AppError';

const router = Router();

// Get service from DI container
const vehiclesService = container.get<VehiclesService>(TYPES.VehiclesService);

/**
 * GET /api/vehicles
 * List all vehicles with pagination
 */
router.get('/', authenticateJWT, async (req: any, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await vehiclesService.getVehicles(
      req.user.tenant_id,
      { page: Number(page), limit: Number(limit) }
    );
    res.json(result);
  } catch (error) {
    next(error);  // Global error handler
  }
});

/**
 * GET /api/vehicles/:id
 * Get single vehicle by ID
 */
router.get('/:id', authenticateJWT, async (req: any, res, next) => {
  try {
    const vehicle = await vehiclesService.getVehicleById(
      req.params.id,
      req.user.tenant_id
    );
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vehicles
 * Create new vehicle
 */
router.post('/', authenticateJWT, async (req: any, res, next) => {
  try {
    // Basic validation
    if (!req.body.make || !req.body.model || !req.body.year) {
      throw new ValidationError('Make, model, and year are required');
    }

    const vehicle = await vehiclesService.createVehicle(
      req.body,
      req.user.tenant_id
    );
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/vehicles/:id
 * Update existing vehicle
 */
router.put('/:id', authenticateJWT, async (req: any, res, next) => {
  try {
    const vehicle = await vehiclesService.updateVehicle(
      req.params.id,
      req.body,
      req.user.tenant_id
    );
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/vehicles/:id
 * Delete vehicle
 */
router.delete('/:id', authenticateJWT, async (req: any, res, next) => {
  try {
    await vehiclesService.deleteVehicle(req.params.id, req.user.tenant_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
