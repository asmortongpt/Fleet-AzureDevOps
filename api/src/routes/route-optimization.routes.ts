Here's the refactored TypeScript file using `RouteOptimizationRepository` instead of direct database queries:


/**
 * Route Optimization API Endpoints
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import * as routeOptimizationService from '../services/route-optimization.service'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'
import { RouteOptimizationRepository } from '../repositories/route-optimization.repository'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'

const router = express.Router()
router.use(authenticateJWT)

// Validation schemas
const StopSchema = z.object({
  name: z.string(),
  address: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceMinutes: z.number().min(0).default(15),
  earliestArrival: z.string().optional(),
  latestArrival: z.string().optional(),
  weight: z.number().optional(),
  volume: z.number().optional(),
  packages: z.number().optional(),
  priority: z.number().min(1).max(5).default(1),
  requiresRefrigeration: z.boolean().optional(),
  requiresLiftgate: z.boolean().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional()
})

const OptimizationRequestSchema = z.object({
  jobName: z.string(),
  stops: z.array(StopSchema).min(2),
  vehicleIds: z.array(z.number()).optional(),
  driverIds: z.array(z.number()).optional(),
  goal: z.enum(['minimize_time', 'minimize_distance', 'minimize_cost', 'balance']).default('balance'),
  considerTraffic: z.boolean().default(true),
  considerTimeWindows: z.boolean().default(true),
  considerCapacity: z.boolean().default(true),
  maxVehicles: z.number().optional(),
  maxStopsPerRoute: z.number().default(50),
  maxRouteDuration: z.number().default(480),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional()
})

/**
 * @openapi
 * /api/route-optimization/optimize:
 *   post:
 *     summary: Create optimized routes
 *     description: Optimize delivery/service routes using AI algorithms
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobName
 *               - stops
 *             properties:
 *               jobName:
 *                 type: string
 *                 example: "Daily Deliveries - Nov 10"
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     serviceMinutes:
 *                       type: number
 *                     earliestArrival:
 *                       type: string
 *                       format: date-time
 *                     latestArrival:
 *                       type: string
 *                       format: date-time
 *                     weight:
 *                       type: number
 *                     volume:
 *                       type: number
 *                     packages:
 *                       type: number
 *                     priority:
 *                       type: number
 *                     requiresRefrigeration:
 *                       type: boolean
 *                     requiresLiftgate:
 *                       type: boolean
 *                     customerName:
 *                       type: string
 *                     customerPhone:
 *                       type: string
 *                     customerEmail:
 *                       type: string
 *                       format: email
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               driverIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               goal:
 *                 type: string
 *                 enum: [minimize_time, minimize_distance, minimize_cost, balance]
 *                 default: balance
 *               considerTraffic:
 *                 type: boolean
 *                 default: true
 *               considerTimeWindows:
 *                 type: boolean
 *                 default: true
 *               considerCapacity:
 *                 type: boolean
 *                 default: true
 *               maxVehicles:
 *                 type: number
 *               maxStopsPerRoute:
 *                 type: number
 *                 default: 50
 *               maxRouteDuration:
 *                 type: number
 *                 default: 480
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               scheduledTime:
 *                 type: string
 *                 format: time
 *     responses:
 *       '200':
 *         description: Optimized routes created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: string
 *                       vehicleId:
 *                         type: number
 *                       driverId:
 *                         type: number
 *                       stops:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             stopId:
 *                               type: string
 *                             name:
 *                               type: string
 *                             address:
 *                               type: string
 *                             latitude:
 *                               type: number
 *                             longitude:
 *                               type: number
 *                             arrivalTime:
 *                               type: string
 *                               format: date-time
 *                             departureTime:
 *                               type: string
 *                               format: date-time
 *                             serviceTime:
 *                               type: number
 *                             distanceToNext:
 *                               type: number
 *                             timeToNext:
 *                               type: number
 *                       totalDistance:
 *                         type: number
 *                       totalTime:
 *                         type: number
 *                       totalCost:
 *                         type: number
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '500':
 *         description: Internal server error
 */
router.post('/optimize', csrfProtection, requirePermission('route_optimization:create'), auditLog, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id || req.body.tenant_id
  if (!tenantId) {
    throw new ValidationError('Tenant ID is required')
  }

  const parsedData = OptimizationRequestSchema.safeParse(req.body)
  if (!parsedData.success) {
    throw new ValidationError('Invalid request data', parsedData.error)
  }

  const optimizationRequest = parsedData.data

  try {
    const routeOptimizationRepository = container.resolve(RouteOptimizationRepository)
    const optimizationResult = await routeOptimizationService.optimizeRoutes(optimizationRequest)

    const jobId = await routeOptimizationRepository.createOptimizationJob(tenantId, optimizationRequest.jobName, optimizationResult)

    res.status(200).json({
      jobId,
      routes: optimizationResult.routes
    })
  } catch (error) {
    logger.error(`Error optimizing routes: ${getErrorMessage(error)}`)
    throw error
  }
}))

/**
 * @openapi
 * /api/route-optimization/jobs/{jobId}:
 *   get:
 *     summary: Get optimization job details
 *     description: Retrieve details of a specific optimization job
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the optimization job
 *     responses:
 *       '200':
 *         description: Optimization job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 jobName:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       routeId:
 *                         type: string
 *                       vehicleId:
 *                         type: number
 *                       driverId:
 *                         type: number
 *                       stops:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             stopId:
 *                               type: string
 *                             name:
 *                               type: string
 *                             address:
 *                               type: string
 *                             latitude:
 *                               type: number
 *                             longitude:
 *                               type: number
 *                             arrivalTime:
 *                               type: string
 *                               format: date-time
 *                             departureTime:
 *                               type: string
 *                               format: date-time
 *                             serviceTime:
 *                               type: number
 *                             distanceToNext:
 *                               type: number
 *                             timeToNext:
 *                               type: number
 *                       totalDistance:
 *                         type: number
 *                       totalTime:
 *                         type: number
 *                       totalCost:
 *                         type: number
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Optimization job not found
 *       '500':
 *         description: Internal server error
 */
router.get('/jobs/:jobId', csrfProtection, requirePermission('route_optimization:read'), auditLog, asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenant_id || req.body.tenant_id
  if (!tenantId) {
    throw new ValidationError('Tenant ID is required')
  }

  const jobId = req.params.jobId

  try {
    const routeOptimizationRepository = container.resolve(RouteOptimizationRepository)
    const job = await routeOptimizationRepository.getOptimizationJob(tenantId, jobId)

    if (!job) {
      throw new NotFoundError('Optimization job not found')
    }

    res.status(200).json(job)
  } catch (error) {
    logger.error(`Error retrieving optimization job: ${getErrorMessage(error)}`)
    throw error
  }
}))

export default router


This refactored version of the TypeScript route file incorporates the `RouteOptimizationRepository` as requested. Here's a summary of the changes made:

1. Imported `RouteOptimizationRepository` at the top of the file.
2. Replaced all direct database queries with repository methods:
   - In the POST `/optimize` route, `createOptimizationJob` method is used instead of a direct database insert.
   - In the GET `/jobs/:jobId` route, `getOptimizationJob` method is used instead of a direct database query.
3. Kept all existing route handlers and logic intact.
4. Maintained the use of `tenant_id` from `req.user` or `req.body`.
5. Kept error handling in place, including the use of `asyncHandler` and custom error classes.
6. The complete refactored file is provided, as requested.

Note that the `RouteOptimizationRepository` class and its methods (`createOptimizationJob` and `getOptimizationJob`) are assumed to exist and be properly implemented in the `../repositories/route-optimization.repository` file. You may need to create or modify this repository file to match the usage in this refactored code.