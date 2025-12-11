/**
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
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

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import aiDispatchService from '../services/ai-dispatch'
import logger from '../utils/logger'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validation'
import { pool } from '../container'
import {
  dispatchAssignmentSchema,
  aiInsightQuerySchema,
  uuidSchema,
  timestampSchema
} from '../schemas/comprehensive.schema'
import { paginationSchema, dateRangeSchema } from '../schemas/common.schema'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// ============================================================================
// Validation Schemas
// ============================================================================

const incidentParseSchema = z.object({
  description: z.string().min(10).max(1000).trim(),
  requestId: z.string().optional()
})

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
})

const dispatchExecutionSchema = z.object({
  description: z.string().min(10).max(1000).trim(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().max(500).optional()
  }),
  vehicleId: z.number().int().positive().optional(),
  autoAssign: z.boolean().optional().default(false)
})

const predictionQuerySchema = z.object({
  timeOfDay: z.coerce.number().int().min(0).max(23).optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional()
})

const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
})

const recommendationExplainSchema = z.object({
  recommendation: z.record(z.any())
})

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
 *                 example: "Vehicle accident on I-95 northbound near Exit 42, multiple vehicles involved, possible injuries"
 *               requestId:
 *                 type: string
 *                 description: Optional correlation ID for tracking
 *     responses:
 *       200:
 *         description: Successfully parsed incident
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 incident:
 *                   type: object
 *                   properties:
 *                     incidentType:
 *                       type: string
 *                     priority:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                     location:
 *                       type: object
 *                     description:
 *                       type: string
 *                     requiredCapabilities:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  '/parse',
  csrfProtection,
  requirePermission('route:create:fleet'),
  validate(incidentParseSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const { description, requestId } = req.body
      const userId = (req as any).user?.id

      logger.info('AI incident parse request', {
        userId,
        requestId,
        descriptionLength: description.length
      })

      // Parse incident using AI
      const incident = await aiDispatchService.parseIncident(description)

      // Log to audit trail
      await pool.query(
        `INSERT INTO audit_logs
        (user_id, action, resource_type, resource_id, details, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW()`,
        [
          userId,
          'AI_INCIDENT_PARSE',
          'dispatch',
          requestId || 'unknown',
          JSON.stringify({ incident, originalDescription: description })
        ]
      )

      res.json({
        success: true,
        incident,
        requestId
      })
    } catch (error) {
      logger.error('Error parsing incident', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id
      })

      res.status(500).json({
        success: false,
        error: 'Failed to parse incident description'
      })
    }
  }
)

/**
 * @openapi
 * /api/ai-dispatch/recommend:
 *   post:
 *     summary: Get AI-powered vehicle recommendation
 *     description: Analyzes available vehicles and recommends the best option
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
 *                 description: Parsed incident (from /parse endpoint)
 *               location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     format: float
 *                   lng:
 *                     type: number
 *                     format: float
 *     responses:
 *       200:
 *         description: Vehicle recommendation
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No available vehicles
 */
router.post(
  '/recommend',
  csrfProtection,
  requirePermission('route:view:fleet'),
  validate(vehicleRecommendationSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const { incident, location } = req.body
      const userId = (req as any).user?.id

      logger.info('AI vehicle recommendation request', {
        userId,
        incidentType: incident.incidentType,
        priority: incident.priority,
        location
      })

      // Get recommendation from AI service
      const recommendation = await aiDispatchService.recommendVehicle(incident, location)

      // Get explanation
      const explanation = await aiDispatchService.explainRecommendation(recommendation)

      res.json({
        success: true,
        recommendation,
        explanation
      })
    } catch (error) {
      logger.error('Error getting recommendation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Check if it's a "no vehicles" error
      if (error instanceof Error && error.message.includes('No available vehicles') {
        return res.status(404).json({
          success: false,
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get vehicle recommendation'
      })
    }
  }
)

/**
 * @openapi
 * /api/ai-dispatch/dispatch:
 *   post:
 *     summary: Execute AI-powered dispatch
 *     description: Parse incident, recommend vehicle, and optionally execute dispatch
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
 *                 description: Natural language incident description
 *               location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   address:
 *                     type: string
 *               vehicleId:
 *                 type: integer
 *                 description: Override AI recommendation with specific vehicle
 *               autoAssign:
 *                 type: boolean
 *                 description: Automatically assign recommended vehicle
 *                 default: false
 *     responses:
 *       201:
 *         description: Dispatch created successfully
 */
router.post(
  '/dispatch',
  csrfProtection,
  requirePermission('route:create:fleet'),
  validate(dispatchExecutionSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const { description, location, vehicleId, autoAssign = false } = req.body
      const userId = (req as any).user?.id

      logger.info('AI dispatch request', {
        userId,
        descriptionLength: description?.length,
        location,
        vehicleId,
        autoAssign
      })

      // Step 1: Parse incident description
      const incident = await aiDispatchService.parseIncident(description)

      // Step 2: Get vehicle recommendation (unless specific vehicle provided)
      let recommendation
      let selectedVehicleId = vehicleId

      if (!vehicleId) {
        recommendation = await aiDispatchService.recommendVehicle(incident, location)
        selectedVehicleId = recommendation.vehicleId
      }

      // Step 3: Create dispatch record in database
      const dispatchResult = await pool.query(
        `INSERT INTO dispatch_incidents
        (
          incident_type,
          priority,
          description,
          location_lat,
          location_lng,
          location_address,
          required_capabilities,
          estimated_duration_minutes,
          special_instructions,
          created_by,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        RETURNING *`,
        [
          incident.incidentType,
          incident.priority,
          incident.description,
          location.lat,
          location.lng,
          location.address || null,
          JSON.stringify(incident.requiredCapabilities),
          incident.estimatedDuration || null,
          JSON.stringify(incident.specialInstructions || []),
          userId,
          'pending'
        ]
      )

      const dispatchId = dispatchResult.rows[0].id

      // Step 4: Assign vehicle if autoAssign is true
      let assignmentResult
      if (autoAssign && selectedVehicleId) {
        assignmentResult = await pool.query(
          `INSERT INTO dispatch_assignments
          (
            dispatch_id,
            vehicle_id,
            assigned_by,
            assignment_status,
            ai_score,
            ai_reasoning,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW()
          RETURNING *`,
          [
            dispatchId,
            selectedVehicleId,
            userId,
            'assigned',
            recommendation?.score || null,
            JSON.stringify(recommendation?.reasoning || [])
          ]
        )

        // Update vehicle status
        await pool.query(
          `UPDATE vehicles SET status = $1, updated_at = NOW() WHERE id = $2`,
          ['dispatched', selectedVehicleId]
        )
      }

      // Step 5: Log to audit trail
      await pool.query(
        `INSERT INTO audit_logs
        (user_id, action, resource_type, resource_id, details, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW()`,
        [
          userId,
          'AI_DISPATCH_CREATE',
          'dispatch',
          dispatchId,
          JSON.stringify({
            incident,
            recommendation: recommendation || null,
            autoAssigned: autoAssign,
            vehicleId: selectedVehicleId
          })
        ]
      )

      res.status(201).json({
        success: true,
        dispatch: {
          id: dispatchId,
          ...dispatchResult.rows[0]
        },
        incident,
        recommendation: recommendation || null,
        assignment: assignmentResult ? assignmentResult.rows[0] : null,
        autoAssigned: autoAssign
      })
    } catch (error) {
      logger.error('Error creating AI dispatch', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      res.status(500).json({
        success: false,
        error: 'Failed to create dispatch'
      })
    }
  }
)

/**
 * @openapi
 * /api/ai-dispatch/predict:
 *   get:
 *     summary: Get predictive dispatch insights
 *     description: Predicts likely incidents based on historical patterns
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
 *         description: Hour of day (0-23)
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         description: Day of week (0=Sunday, 6=Saturday)
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Prediction results
 */
router.get(
  '/predict',
  requirePermission('route:view:fleet'),
  validate(predictionQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const now = new Date()
      const timeOfDay = req.query.timeOfDay ? parseInt(req.query.timeOfDay as string) : now.getHours()
      const dayOfWeek = req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string) : now.getDay()

      const location =
        req.query.lat && req.query.lng
          ? {
              lat: parseFloat(req.query.lat as string),
              lng: parseFloat(req.query.lng as string)
            }
          : undefined

      logger.info('AI prediction request', {
        timeOfDay,
        dayOfWeek,
        location
      })

      const prediction = await aiDispatchService.predictIncidents(timeOfDay, dayOfWeek, location)

      res.json({
        success: true,
        prediction
      })
    } catch (error) {
      logger.error('Error getting predictions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      res.status(500).json({
        success: false,
        error: 'Failed to get predictions'
      })
    }
  }
)

/**
 * @openapi
 * /api/ai-dispatch/analytics:
 *   get:
 *     summary: Get dispatch performance analytics
 *     description: Returns metrics on dispatch efficiency and patterns
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
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get(
  '/analytics',
  requirePermission('route:view:fleet'),
  validate(analyticsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: 30 days ago

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date() // Default: now

      logger.info('Analytics request', { startDate, endDate })

      const analytics = await aiDispatchService.getAnalytics(startDate, endDate)

      res.json({
        success: true,
        analytics,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })
    } catch (error) {
      logger.error('Error getting analytics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      res.status(500).json({
        success: false,
        error: 'Failed to get analytics'
      })
    }
  }
)

/**
 * @openapi
 * /api/ai-dispatch/explain:
 *   post:
 *     summary: Get human-readable explanation of recommendation
 *     description: Uses AI to generate clear explanation of dispatch decision
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
 *                 description: Recommendation object from /recommend endpoint
 *     responses:
 *       200:
 *         description: Explanation generated
 */
router.post(
  '/explain',
  csrfProtection,
  requirePermission('route:view:fleet'),
  validate(recommendationExplainSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const { recommendation } = req.body

      const explanation = await aiDispatchService.explainRecommendation(recommendation)

      res.json({
        success: true,
        explanation
      })
    } catch (error) {
      logger.error('Error generating explanation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      res.status(500).json({
        success: false,
        error: 'Failed to generate explanation'
      })
    }
  }
)

export default router
