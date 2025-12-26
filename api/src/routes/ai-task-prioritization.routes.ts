/**
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 32: Add Winston logger
 * AI Task Prioritization API Routes
 *
 * Endpoints:
 * - POST /api/ai-tasks/prioritize - Calculate priority score for a task
 * - POST /api/ai-tasks/assign - Get recommended assignments
 * - POST /api/ai-tasks/dependencies - Analyze task dependencies
 * - POST /api/ai-tasks/optimize - Optimize resource allocation
 * - POST /api/ai-tasks/execution-order - Get optimal execution order
 * - POST /api/ai-tasks/batch-prioritize - Prioritize multiple tasks
 *
 * Security:
 * - JWT authentication required
 * - Tenant isolation enforced
 * - Input validation with Zod
 * - Rate limiting applied
 * - Audit logging enabled
 *
 * @module ai-task-prioritization-routes
 */

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'

import { pool } from '../db'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import AITaskPrioritizationService from '../services/ai-task-prioritization'

const aiService = new AITaskPrioritizationService(pool)

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// Rate limiting for AI endpoints (more restrictive due to API costs)
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

router.use(aiRateLimiter)

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PrioritizeTaskSchema = z.object({
  task_title: z.string().min(1).max(255),
  description: z.string().optional(),
  task_type: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().positive().optional(),
  vehicle_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
})

const AssignTaskSchema = z.object({
  task_id: z.string().uuid().optional(),
  task_title: z.string().min(1),
  task_type: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimated_hours: z.number().positive().optional(),
  vehicle_id: z.string().uuid().optional(),
  consider_location: z.boolean().optional().default(true)
})

const DependencyAnalysisSchema = z.object({
  task_id: z.string().uuid()
})

const ExecutionOrderSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1)
})

const OptimizeResourcesSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1)
})

const BatchPrioritizeSchema = z.object({
  tasks: z.array(PrioritizeTaskSchema).min(1).max(20) // Limit batch size
})

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/ai-tasks/prioritize
 * Calculate AI-powered priority score for a single task
 */
router.post(
  '/prioritize',
  csrfProtection, requirePermission('report:generate:global'),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' })
      }

      // Validate input
      const validatedData = PrioritizeTaskSchema.parse(req.body)

      // Add tenant_id to task data
      const taskData = {
        ...validatedData,
        tenant_id: tenantId
      }

      // Calculate priority score
      const priorityScore = await aiService.calculatePriorityScore(taskData)

      // Log the analysis
      await pool.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          req.user?.id,
          'ai_priority_calculation',
          'task',
          validatedData.id || null,
          JSON.stringify({
            task_title: taskData.task_title,
            score: priorityScore.score,
            confidence: priorityScore.confidence
          })
        ]
      )

      res.json({
        success: true,
        priorityScore,
        message: 'Priority score calculated successfully'
      })
    } catch (error) {
      logger.error('Error in prioritize endpoint:', error) // Wave 32: Winston logger
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Failed to calculate priority score' })
    }
  }
)

/**
 * POST /api/ai-tasks/assign
 * Get AI-recommended task assignments
 */
router.post(
  '/assign',
  csrfProtection, requirePermission('report:generate:global'),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' })
      }

      // Validate input
      const validatedData = AssignTaskSchema.parse(req.body)

      // Add tenant_id to task data
      const taskData = {
        ...validatedData,
        tenant_id: tenantId
      }

      // Get recommendations
      const recommendations = await aiService.recommendTaskAssignment(
        taskData,
        validatedData.consider_location
      )

      // Log the recommendation
      await pool.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          req.user?.id,
          'ai_assignment_recommendation',
          'task',
          validatedData.task_id || null,
          JSON.stringify({
            task_title: taskData.task_title,
            recommendations_count: recommendations.length,
            top_recommendation: recommendations[0]?.userName || null
          })
        ]
      )

      res.json({
        success: true,
        recommendations,
        count: recommendations.length,
        message: 'Assignment recommendations generated successfully'
      })
    } catch (error) {
      logger.error('Error in assign endpoint:', error) // Wave 32: Winston logger
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Failed to generate recommendations' })
    }
  }
)

/**
 * POST /api/ai-tasks/dependencies
 * Analyze task dependencies
 */
router.post(
  '/dependencies',
  csrfProtection, requirePermission('report:view:global'),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' })
      }

      // Validate input
      const validatedData = DependencyAnalysisSchema.parse(req.body)

      // Analyze dependencies
      const dependencyGraph = await aiService.analyzeDependencies(
        validatedData.task_id,
        tenantId
      )

      res.json({
        success: true,
        dependencyGraph,
        message: 'Dependency analysis completed successfully'
      })
    } catch (error) {
      logger.error('Error in dependencies endpoint:', error) // Wave 32: Winston logger
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Failed to analyze dependencies' })
    }
  }
)

/**
 * POST /api/ai-tasks/execution-order
 * Get optimal task execution order
 */
router.post(
  '/execution-order',
  csrfProtection, requirePermission('report:view:global'),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' })
      }

      // Validate input
      const validatedData = ExecutionOrderSchema.parse(req.body)

      // Get execution order
      const executionOrder = await aiService.getOptimalExecutionOrder(
        validatedData.task_ids,
        tenantId
      )

      res.json({
        success: true,
        executionOrder,
        levels: executionOrder.length,
        message: 'Execution order calculated successfully'
      })
    } catch (error) {
      logger.error('Error in execution-order endpoint:', error) // Wave 32: Winston logger
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Failed to calculate execution order' })
    }
  }
)

/**
 * POST /api/ai-tasks/optimize
 * Optimize resource allocation across tasks
 */
router.post(
  '/optimize',
  csrfProtection, requirePermission('report:generate:global'),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' })
      }

      // Validate input
      const validatedData = OptimizeResourcesSchema.parse(req.body)

      // Optimize resources
      const optimizations = await aiService.optimizeResourceAllocation(
        validatedData.task_ids,
        tenantId
      )

      // Log the optimization
      await pool.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tenantId,
          req.user?.id,
          'ai_resource_optimization',
          'task',
          JSON.stringify({
            task_count: validatedData.task_ids.length,
            optimizations_count: optimizations.length
          })
        ]
      )

      res.json({
        success: true,
        optimizations,
        count: optimizations.length,
        message: 'Resource optimization completed successfully'
      })
    } catch (error) {
      logger.error('Error in optimize endpoint:', error) // Wave 32: Winston logger
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Failed to optimize resources' })
    }
  }
)

/**
 * POST /api/ai-tasks/batch-prioritize
 * Calculate priority scores for multiple tasks in batch
 */
router.post(
  '/batch-prioritize',
  csrfProtection, requirePermission('report:generate:global'),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID required' })
      }

      // Validate input
      const validatedData = BatchPrioritizeSchema.parse(req.body)

      // Calculate priority for each task
      const results = await Promise.all(
        validatedData.tasks.map(async (task) => {
          const taskData = { ...task, tenant_id: tenantId }
          const priorityScore = await aiService.calculatePriorityScore(taskData)
          return {
            task: task.task_title,
            priorityScore
          }
        })
      )

      // Log the batch operation
      await pool.query(
        `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tenantId,
          req.user?.id,
          'ai_batch_priority_calculation',
          'task',
          JSON.stringify({
            task_count: validatedData.tasks.length
          })
        ]
      )

      res.json({
        success: true,
        results,
        count: results.length,
        message: 'Batch prioritization completed successfully'
      })
    } catch (error) {
      logger.error('Error in batch-prioritize endpoint:', error) // Wave 32: Winston logger
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors
        })
      }
      res.status(500).json({ error: 'Failed to batch prioritize tasks' })
    }
  }
)

/**
 * GET /api/ai-tasks/health
 * Health check endpoint for AI service
 */
router.get('/health', async (req: AuthRequest, res) => {
  try {
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT
    const hasApiKey = !!process.env.OPENAI_API_KEY

    res.json({
      success: true,
      status: 'healthy',
      azureEndpointConfigured: !!azureEndpoint,
      apiKeyConfigured: hasApiKey,
      message: 'AI Task Prioritization service is operational'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed'
    })
  }
})

export default router
