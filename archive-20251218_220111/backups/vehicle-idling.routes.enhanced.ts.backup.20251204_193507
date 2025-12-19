import express, { Request, Response } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { VehicleIdlingService } from '../services/vehicle-idling.service';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/asyncHandler';
import { csrfProtection } from '../middleware/csrfProtection';

const router = express.Router();
const idlingService = new VehicleIdlingService();

// Active Idling Events
router.get(
  '/active',
  authenticate,
  rateLimiter(100),
  asyncHandler(async (req: Request, res: Response) => {
    const activeEvents = await idlingService.getActiveIdlingEvents();
    res.json({
      success: true,
      count: activeEvents.length,
      events: activeEvents,
    });
  })
);

router.get(
  '/active/:vehicleId',
  authenticate,
  rateLimiter(100),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      vehicleId: Joi.number().integer().required(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const event = await idlingService.getActiveIdlingEvent(parseInt(vehicleId, 10));
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'No active idling event for this vehicle',
      });
    }
    res.json({
      success: true,
      event,
    });
  })
);

// Vehicle Idling History & Statistics
router.get(
  '/vehicle/:vehicleId',
  authenticate,
  rateLimiter(100),
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      vehicleId: Joi.number().integer().required(),
    }),
    [Segments.QUERY]: Joi.object().keys({
      days: Joi.number().integer().min(1).max(365).default(30),
      limit: Joi.number().integer().min(1).max(1000).default(100),
      offset: Joi.number().integer().min(0).default(0),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const { days, limit, offset } = req.query;
    const history = await idlingService.getIdlingHistory(parseInt(vehicleId, 10), days, limit, offset);
    res.json({
      success: true,
      history,
    });
  })
);

// Apply CSRF protection to all mutation endpoints
router.post('*', csrfProtection);
router.put('*', csrfProtection);
router.delete('*', csrfProtection);

export default router;