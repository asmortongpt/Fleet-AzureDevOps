import express from 'express';
import { maintenanceService } from '../services/MaintenanceService';
import { NotFoundError } from '../errors/NotFoundError';

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const data = await maintenanceService.getMaintenanceDetails(
      parseInt(id),
      tenant_id
    );

    res.json(data);
  } catch (error) {
    next(error); // Let error middleware handle it
  }
});

export default router;