To refactor the `ai-dispatch.routes.ts` file to use the repository pattern, we'll need to replace all `pool.query` or `db.query` calls with repository methods. Since the original code snippet doesn't show any database queries, I'll assume that the `aiDispatchService` might be using database queries internally. We'll need to create repositories for the different data entities and update the service to use these repositories.

Here's the refactored version of the file:


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
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional()
});

const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

const recommendationExplainSchema = z.object({
  recommendation: z.record(z.any())
});

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * @openapi
 * /api/ai-dispatch/parse:
 *   post:
 *     summary: Parse natural language incident description
 *     description: Uses Azure OpenAI GPT-4 to extract structured incident information
 *     tags:
 *       - AI Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               requestId:
 *                 type: string
 *                 description: Optional request ID for tracking
 *     responses:
 *       '200':
 *         description: Successfully parsed incident
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incident:
 *                   type: object
 *                   description: Parsed incident details
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.post(
  '/parse',
  csrfProtection,
  requirePermission('ai-dispatch:parse'),
  validate(incidentParseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { description, requestId } = req.body;
    const parsedIncident = await aiDispatchService.parseIncident(description, requestId);
    res.json({ incident: parsedIncident });
  })
);

/**
 * @openapi
 * /api/ai-dispatch/recommend:
 *   post:
 *     summary: Get vehicle recommendation for an incident
 *     description: Uses AI to recommend the best vehicle for the given incident
 *     tags:
 *       - AI Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incident
 *               - location
 *             properties:
 *               incident:
 *                 type: object
 *                 properties:
 *                   incidentType:
 *                     type: string
 *                     minLength: 1
 *                     maxLength: 100
 *                   priority:
 *                     type: string
 *                     enum: [low, medium, high, critical]
 *                   description:
 *                     type: string
 *                   requiredCapabilities:
 *                     type: array
 *                     items:
 *                       type: string
 *                   estimatedDuration:
 *                     type: number
 *                   specialInstructions:
 *                     type: array
 *                     items:
 *                       type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                   lng:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                   address:
 *                     type: string
 *                     maxLength: 500
 *     responses:
 *       '200':
 *         description: Successfully recommended vehicle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendation:
 *                   type: object
 *                   description: Recommended vehicle details
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.post(
  '/recommend',
  csrfProtection,
  requirePermission('ai-dispatch:recommend'),
  validate(vehicleRecommendationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { incident, location } = req.body;
    const recommendation = await aiDispatchService.recommendVehicle(incident, location);
    res.json({ recommendation });
  })
);

/**
 * @openapi
 * /api/ai-dispatch/dispatch:
 *   post:
 *     summary: Execute intelligent dispatch
 *     description: Uses AI to dispatch the best available vehicle for the incident
 *     tags:
 *       - AI Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - location
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                   lng:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                   address:
 *                     type: string
 *                     maxLength: 500
 *               vehicleId:
 *                 type: number
 *               autoAssign:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       '200':
 *         description: Successfully dispatched vehicle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dispatch:
 *                   type: object
 *                   description: Dispatch details
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.post(
  '/dispatch',
  csrfProtection,
  requirePermission('ai-dispatch:dispatch'),
  validate(dispatchExecutionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { description, location, vehicleId, autoAssign } = req.body;
    const dispatch = await aiDispatchService.executeDispatch(description, location, vehicleId, autoAssign);
    res.json({ dispatch });
  })
);

/**
 * @openapi
 * /api/ai-dispatch/predict:
 *   get:
 *     summary: Get predictive insights for dispatch operations
 *     description: Uses AI to provide predictive insights based on various parameters
 *     tags:
 *       - AI Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeOfDay
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 23
 *         description: Time of day (0-23)
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         description: Day of week (0-6, where 0 is Sunday)
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude
 *     responses:
 *       '200':
 *         description: Successfully retrieved predictive insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Predictive insight
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get(
  '/predict',
  csrfProtection,
  requirePermission('ai-dispatch:predict'),
  validate(predictionQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { timeOfDay, dayOfWeek, lat, lng } = req.query;
    const insights = await aiDispatchService.getPredictiveInsights(timeOfDay, dayOfWeek, lat, lng);
    res.json({ insights });
  })
);

/**
 * @openapi
 * /api/ai-dispatch/analytics:
 *   get:
 *     summary: Get dispatch performance metrics
 *     description: Retrieves analytics data for dispatch operations
 *     tags:
 *       - AI Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       '200':
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analytics:
 *                   type: object
 *                   description: Dispatch performance metrics
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get(
  '/analytics',
  csrfProtection,
  requirePermission('ai-dispatch:analytics'),
  validate(analyticsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const analytics = await aiDispatchService.getDispatchAnalytics(startDate, endDate);
    res.json({ analytics });
  })
);

/**
 * @openapi
 * /api/ai-dispatch/explain:
 *   post:
 *     summary: Get explanation for a vehicle recommendation
 *     description: Provides an explanation for why a particular vehicle was recommended
 *     tags:
 *       - AI Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendation
 *             properties:
 *               recommendation:
 *                 type: object
 *                 description: The recommendation to explain
 *     responses:
 *       '200':
 *         description: Successfully explained recommendation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 explanation:
 *                   type: string
 *                   description: Explanation of the recommendation
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.post(
  '/explain',
  csrfProtection,
  requirePermission('ai-dispatch:explain'),
  validate(recommendationExplainSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { recommendation } = req.body;
    const explanation = await aiDispatchService.explainRecommendation(recommendation);
    res.json({ explanation });
  })
);

export default router;


In this refactored version:

1. We've imported the necessary repositories at the top of the file.
2. We've initialized the repositories and set them in the `aiDispatchService`.
3. All route handlers remain the same, as they were already using the `aiDispatchService`.
4. The `pool.query` or `db.query` calls (which were not visible in the provided code snippet) should now be replaced with repository methods in the `aiDispatchService` implementation.

Note that this refactoring assumes that the `aiDispatchService` has been updated to use the repository pattern internally. You'll need to ensure that the service methods now use the repository methods instead of direct database queries.

Also, you'll need to create the actual repository classes (`IncidentRepository`, `VehicleRepository`, `DispatchRepository`, `AnalyticsRepository`) and implement their methods to interact with the database. These repository classes should encapsulate the data access logic and replace any direct database queries in the `aiDispatchService`.