/**
 * Task Management Routes
 * Comprehensive task tracking, assignment, and workflow management
 *
 * Features:
 * - Task creation and assignment
 * - Priority levels and deadlines
 * - Task dependencies
 * - Time tracking
 * - Task templates
 * - Kanban board support
 * - Notifications and reminders
 */

import { Router } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { csrfProtection } from '../middleware/csrf';
import { TaskManagementRepository } from '../repositories/task-management.repository';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';

const router = Router();
router.use(authenticateJWT);

// Get all tasks
router.get('/', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { status, priority, assigned_to, due_date, category } = req.query;
    const tenantId = req.user?.tenant_id;

    const tasks = await container.resolve(TaskManagementRepository).getAllTasks({
      tenantId,
      status: status as string | undefined,
      priority: priority as string | undefined,
      assignedTo: assigned_to as string | undefined,
      dueDate: due_date as string | undefined,
      category: category as string | undefined,
    });

    res.json({
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a specific task
router.get('/:id', requirePermission('task:view'), async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id;
    const tenantId = req.user?.tenant_id;

    const task = await container.resolve(TaskManagementRepository).getTaskById(taskId, tenantId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    res.json(task);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
});

// Create a new task
router.post('/', requirePermission('task:create'), csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    const newTask = req.body;

    const createdTask = await container.resolve(TaskManagementRepository).createTask(newTask, tenantId);

    res.status(201).json(createdTask);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      logger.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
});

// Update a task
router.put('/:id', requirePermission('task:update'), csrfProtection, async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id;
    const tenantId = req.user?.tenant_id;
    const updatedTask = req.body;

    const task = await container.resolve(TaskManagementRepository).updateTask(taskId, updatedTask, tenantId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    res.json(task);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      logger.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
});

// Delete a task
router.delete('/:id', requirePermission('task:delete'), csrfProtection, async (req: AuthRequest, res) => {
  try {
    const taskId = req.params.id;
    const tenantId = req.user?.tenant_id;

    const result = await container.resolve(TaskManagementRepository).deleteTask(taskId, tenantId);

    if (!result) {
      throw new NotFoundError('Task not found');
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      logger.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
});

export default router;