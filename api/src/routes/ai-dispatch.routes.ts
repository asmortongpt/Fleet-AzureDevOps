Here's the complete refactored version of the `ai-dispatch.routes.ts` file, replacing all database queries with repository methods:


/**
 * AI-Directed Dispatch Routes
 *
 * RESTful API endpoints for AI-powered dispatch operations:
 * - POST /api/ai-dispatch/parse - Parse natural language incident
 * - POST /api/ai-dispatch/recommend - Get vehicle recommendation
 * - POST /api/ai-dispatch/dispatch - Execute intelligent dispatch
 * - GET /api/ai-dispatch/predict - Get predictive insights
 * - GET /api/ai-dispatch/analytics - Get dispatch performance metrics
 * - POST /api/ai-dispatch/explain - Get recommendation explanation
 *
 * Security: All routes require authentication and appropriate permissions
 *
 * @module routes/ai-dispatch
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import aiDispatchService from '../services/ai-dispatch';
import logger from '../utils/logger';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import {
  dispatchAssignmentSchema,
  aiInsightQuerySchema,
  uuidSchema,
  timestampSchema
} from '../schemas/comprehensive.schema';
import { paginationSchema, dateRangeSchema } from '../schemas/common.schema';

// Import repositories
import { IncidentRepository } from '../repositories/incident.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { DispatchRepository } from '../repositories/dispatch.repository';
import { AnalyticsRepository } from '../repositories/analytics.repository';

// Initialize repositories
const incidentRepository = new IncidentRepository();
const vehicleRepository = new VehicleRepository();
const dispatchRepository = new DispatchRepository();
const analyticsRepository = new AnalyticsRepository();

// Update aiDispatchService to use repositories
aiDispatchService.setRepositories({
  incident: incidentRepository,
  vehicle: vehicleRepository,
  dispatch: dispatchRepository,
  analytics: analyticsRepository
});

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// ============================================================================
// Validation Schemas
// ============================================================================

const incidentParseSchema = z.object({
  description: z.string().min(10).max(1000).trim(),
  requestId: z.string().optional()
});

const vehicleRecommendationSchema = z.object({
  incident: z.object({
    incidentType: z.string().min(1).max(100),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().optional(),
    requiredCapabilities: z.array(z.string()).optional(),
    estimatedDuration: z.number().optional(),
    specialInstructions: z.array(z.string()).optional()
  }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().max(500).optional()
  })
});

const dispatchExecutionSchema = z.object({
  description: z.string().min(10).max(1000).trim(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().max(500).optional()
  }),
  vehicleId: z.number().int().positive().optional(),
  autoAssign: z.boolean().optional().default(false)
});

const predictionQuerySchema = z.object({
  timeOfDay: z.coerce.number().int().min(0).max(23).optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
});

const analyticsQuerySchema = z.object({
  ...dateRangeSchema.shape,
  ...paginationSchema.shape,
  incidentType: z.string().optional(),
  vehicleType: z.string().optional(),
  responseTimeThreshold: z.number().positive().optional()
});

// ============================================================================
// Routes
// ============================================================================

// Parse natural language incident
router.post(
  '/parse',
  csrfProtection,
  requirePermission('ai-dispatch:parse'),
  validate(incidentParseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { description, requestId } = req.body;
    const parsedIncident = await aiDispatchService.parseIncident(description, requestId);
    res.json(parsedIncident);
  })
);

// Get vehicle recommendation
router.post(
  '/recommend',
  csrfProtection,
  requirePermission('ai-dispatch:recommend'),
  validate(vehicleRecommendationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const recommendation = await aiDispatchService.getVehicleRecommendation(req.body);
    res.json(recommendation);
  })
);

// Execute intelligent dispatch
router.post(
  '/dispatch',
  csrfProtection,
  requirePermission('ai-dispatch:dispatch'),
  validate(dispatchExecutionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const dispatchResult = await aiDispatchService.executeDispatch(req.body);
    res.json(dispatchResult);
  })
);

// Get predictive insights
router.get(
  '/predict',
  csrfProtection,
  requirePermission('ai-dispatch:predict'),
  validate(predictionQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const predictions = await aiDispatchService.getPredictiveInsights(req.query);
    res.json(predictions);
  })
);

// Get dispatch performance metrics
router.get(
  '/analytics',
  csrfProtection,
  requirePermission('ai-dispatch:analytics'),
  validate(analyticsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const analytics = await aiDispatchService.getDispatchAnalytics(req.query);
    res.json(analytics);
  })
);

// Get recommendation explanation
router.post(
  '/explain',
  csrfProtection,
  requirePermission('ai-dispatch:explain'),
  validate(dispatchAssignmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const explanation = await aiDispatchService.explainRecommendation(req.body);
    res.json(explanation);
  })
);

export default router;


In this refactored version:

1. We've imported the necessary repository classes at the top of the file.

2. We've initialized instances of each repository:
   
   const incidentRepository = new IncidentRepository();
   const vehicleRepository = new VehicleRepository();
   const dispatchRepository = new DispatchRepository();
   const analyticsRepository = new AnalyticsRepository();
   

3. We've updated the `aiDispatchService` to use these repositories:
   
   aiDispatchService.setRepositories({
     incident: incidentRepository,
     vehicle: vehicleRepository,
     dispatch: dispatchRepository,
     analytics: analyticsRepository
   });
   

4. All database operations that were previously using `pool.query` or `db.query` should now be handled within the respective repository methods. The `aiDispatchService` methods (e.g., `parseIncident`, `getVehicleRecommendation`, etc.) should now use these repository methods instead of direct database queries.

5. The route handlers remain largely unchanged, as they were already using the `aiDispatchService` methods. The service layer now handles the interaction with the repositories.

This refactoring assumes that the `aiDispatchService` has been updated to use the repository methods instead of direct database queries. If you need further modifications to the service layer or the repository implementations, please let me know, and I'll be happy to provide more detailed guidance.