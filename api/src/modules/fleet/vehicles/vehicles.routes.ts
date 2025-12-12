import { Router } from 'express';
import { container } from '../../../container';
import { TYPES } from '../../../container';
import { VehiclesService } from './vehicles.service';
import { authenticateJWT } from '../../../middleware/auth';

const router = Router();
const vehiclesService = container.get<VehiclesService>(TYPES.VehiclesService);

router.get('/', authenticateJWT, async (req: any, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await vehiclesService.getVehicles(
      req.user.tenant_id,
      { page: Number(page), limit: Number(limit) }
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateJWT, async (req: any, res, next) => {
  try {
    const vehicle = await vehiclesService.getVehicleById(req.params.id, req.user.tenant_id);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateJWT, async (req: any, res, next) => {
  try {
    const vehicle = await vehiclesService.createVehicle(req.body, req.user.tenant_id);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateJWT, async (req: any, res, next) => {
  try {
    const vehicle = await vehiclesService.updateVehicle(req.params.id, req.body, req.user.tenant_id);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateJWT, async (req: any, res, next) => {
  try {
    await vehiclesService.deleteVehicle(req.params.id, req.user.tenant_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
