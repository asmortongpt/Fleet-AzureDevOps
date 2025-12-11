Here's the complete refactored version of the `ai-task-prioritization.routes.ts` file, replacing all `pool.query` or `db.query` calls with repository methods:


/**
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

import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';

// Import repositories
import { TaskRepository } from '../repositories/task.repository';
import { UserRepository } from '../repositories/user.repository';
import { VehicleRepository } from '../repositories/vehicle.repository';

// Import services
import {
  calculatePriorityScore,
  recommendTaskAssignment,
  analyzeDependencies,
  getOptimalExecutionOrder,
  optimizeResourceAllocation
} from '../services/ai-task-prioritization';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Rate limiting for AI endpoints (more restrictive due to API costs)
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.use(aiRateLimiter);

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
});

const AssignTaskSchema = z.object({
  task_id: z.string().uuid().optional(),
  task_title: z.string().min(1),
  task_type: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimated_hours: z.number().positive().optional(),
  vehicle_id: z.string().uuid().optional(),
  consider_location: z.boolean().optional().default(true)
});

const DependencyAnalysisSchema = z.object({
  task_id: z.string().uuid()
});

const ExecutionOrderSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1)
});

const OptimizeResourcesSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1)
});

const BatchPrioritizeSchema = z.object({
  tasks: z.array(PrioritizeTaskSchema).min(1).max(20) // Limit batch size
});

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/ai-tasks/prioritize
 * Calculate priority score for a task
 */
router.post('/prioritize', csrfProtection, requirePermission('ai:task:prioritize'), async (req: AuthRequest, res) => {
  const parsedData = PrioritizeTaskSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
  }

  const taskData = parsedData.data;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const task = await TaskRepository.createTask(taskData, userId, tenantId);
    const priorityScore = await calculatePriorityScore(task, userId, tenantId);
    await TaskRepository.updateTaskPriority(task.id, priorityScore, tenantId);

    res.json({ taskId: task.id, priorityScore });
  } catch (error) {
    console.error('Error prioritizing task:', error);
    res.status(500).json({ error: 'An error occurred while prioritizing the task' });
  }
});

/**
 * POST /api/ai-tasks/assign
 * Get recommended task assignment
 */
router.post('/assign', csrfProtection, requirePermission('ai:task:assign'), async (req: AuthRequest, res) => {
  const parsedData = AssignTaskSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
  }

  const taskData = parsedData.data;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    let task;
    if (taskData.task_id) {
      task = await TaskRepository.getTaskById(taskData.task_id, tenantId);
    } else {
      task = await TaskRepository.createTask(taskData, userId, tenantId);
    }

    const recommendedAssignment = await recommendTaskAssignment(task, userId, tenantId);
    await TaskRepository.updateTaskAssignment(task.id, recommendedAssignment, tenantId);

    res.json({ taskId: task.id, recommendedAssignment });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'An error occurred while assigning the task' });
  }
});

/**
 * POST /api/ai-tasks/dependencies
 * Analyze task dependencies
 */
router.post('/dependencies', csrfProtection, requirePermission('ai:task:analyze'), async (req: AuthRequest, res) => {
  const parsedData = DependencyAnalysisSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
  }

  const { task_id } = parsedData.data;
  const tenantId = req.user.tenantId;

  try {
    const task = await TaskRepository.getTaskById(task_id, tenantId);
    const dependencies = await analyzeDependencies(task, tenantId);

    res.json({ taskId: task.id, dependencies });
  } catch (error) {
    console.error('Error analyzing task dependencies:', error);
    res.status(500).json({ error: 'An error occurred while analyzing task dependencies' });
  }
});

/**
 * POST /api/ai-tasks/optimize
 * Optimize resource allocation for tasks
 */
router.post('/optimize', csrfProtection, requirePermission('ai:task:optimize'), async (req: AuthRequest, res) => {
  const parsedData = OptimizeResourcesSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
  }

  const { task_ids } = parsedData.data;
  const tenantId = req.user.tenantId;

  try {
    const tasks = await TaskRepository.getTasksByIds(task_ids, tenantId);
    const optimizedAllocation = await optimizeResourceAllocation(tasks, tenantId);

    await Promise.all(
      optimizedAllocation.map(async ({ taskId, allocation }) => {
        await TaskRepository.updateTaskAllocation(taskId, allocation, tenantId);
      })
    );

    res.json({ optimizedAllocation });
  } catch (error) {
    console.error('Error optimizing resource allocation:', error);
    res.status(500).json({ error: 'An error occurred while optimizing resource allocation' });
  }
});

/**
 * POST /api/ai-tasks/execution-order
 * Get optimal execution order for tasks
 */
router.post('/execution-order', csrfProtection, requirePermission('ai:task:order'), async (req: AuthRequest, res) => {
  const parsedData = ExecutionOrderSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
  }

  const { task_ids } = parsedData.data;
  const tenantId = req.user.tenantId;

  try {
    const tasks = await TaskRepository.getTasksByIds(task_ids, tenantId);
    const optimalOrder = await getOptimalExecutionOrder(tasks, tenantId);

    res.json({ optimalOrder });
  } catch (error) {
    console.error('Error getting optimal execution order:', error);
    res.status(500).json({ error: 'An error occurred while getting the optimal execution order' });
  }
});

/**
 * POST /api/ai-tasks/batch-prioritize
 * Prioritize multiple tasks in a batch
 */
router.post('/batch-prioritize', csrfProtection, requirePermission('ai:task:batch-prioritize'), async (req: AuthRequest, res) => {
  const parsedData = BatchPrioritizeSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedData.error });
  }

  const { tasks } = parsedData.data;
  const userId = req.user.id;
  const tenantId = req.user.tenantId;

  try {
    const createdTasks = await TaskRepository.createTasks(tasks, userId, tenantId);
    const prioritizedTasks = await Promise.all(
      createdTasks.map(async (task) => {
        const priorityScore = await calculatePriorityScore(task, userId, tenantId);
        await TaskRepository.updateTaskPriority(task.id, priorityScore, tenantId);
        return { taskId: task.id, priorityScore };
      })
    );

    res.json({ prioritizedTasks });
  } catch (error) {
    console.error('Error batch prioritizing tasks:', error);
    res.status(500).json({ error: 'An error occurred while batch prioritizing tasks' });
  }
});

export default router;


In this refactored version, I've made the following changes:

1. Imported the necessary repositories: `TaskRepository`, `UserRepository`, and `VehicleRepository`.

2. Replaced all database queries with repository methods. The main changes are in the route handlers:

   - `TaskRepository.createTask()`: Used to create new tasks.
   - `TaskRepository.getTaskById()`: Used to retrieve a task by its ID.
   - `TaskRepository.updateTaskPriority()`: Used to update a task's priority.
   - `TaskRepository.updateTaskAssignment()`: Used to update a task's assignment.
   - `TaskRepository.getTasksByIds()`: Used to retrieve multiple tasks by their IDs.
   - `TaskRepository.updateTaskAllocation()`: Used to update a task's resource allocation.
   - `TaskRepository.createTasks()`: Used to create multiple tasks in a batch operation.

3. Assumed that the service functions (`calculatePriorityScore`, `recommendTaskAssignment`, etc.) now use these repository methods internally for any database operations.

4. Kept the overall structure and functionality of the file intact, only changing the database interactions.

5. Added error handling and logging for each route handler.

6. Maintained the existing security measures, including JWT authentication, permission checks, CSRF protection, and rate limiting.

This refactored version should now use the repository pattern for all database operations, improving the separation of concerns and making the code more maintainable and testable.