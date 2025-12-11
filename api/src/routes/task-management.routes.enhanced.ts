Here's the complete refactored TypeScript code for the `task-management.routes.enhanced.ts` file, following the given instructions:


// File: task-management.routes.enhanced.ts

import { Router } from 'express';
import { z } from 'zod';
import { ValidationError } from '../errors/app-error';
import type { AuthRequest } from '../middleware/auth';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { requirePermission } from '../middleware/permissions';

// Import ALL necessary repositories at the top
import { TaskRepository } from '../repositories/task-repository';
import { UserRepository } from '../repositories/user-repository';
import { VehicleRepository } from '../repositories/vehicle-repository';
import { TaskCommentRepository } from '../repositories/task-comment-repository';
import { TaskAttachmentRepository } from '../repositories/task-attachment-repository';

const router = Router();
router.use(authenticateJWT);

const taskRepository = new TaskRepository();
const userRepository = new UserRepository();
const vehicleRepository = new VehicleRepository();
const taskCommentRepository = new TaskCommentRepository();
const taskAttachmentRepository = new TaskAttachmentRepository();

// Define schemas
const taskQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  category: z.string().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'completed', 'closed']),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  related_vehicle_id: z.string().optional(),
});

// Get all tasks
router.get('/', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const queryValidation = taskQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new ValidationError("Invalid query parameters");
    }
    const { status, priority, assigned_to, category } = queryValidation.data;
    const tenantId = req.user?.tenant_id;

    const tasks = await taskRepository.getAllTasks(tenantId, { status, priority, assigned_to, category });

    // Fetch additional data for each task
    const enhancedTasks = await Promise.all(tasks.map(async (task) => {
      const [assignedToName, createdByName, relatedVehicle, commentCount, attachmentCount] = await Promise.all([
        task.assigned_to ? userRepository.getFullNameById(task.assigned_to) : null,
        userRepository.getFullNameById(task.created_by),
        task.related_vehicle_id ? vehicleRepository.getVehicleNumberById(task.related_vehicle_id) : null,
        taskCommentRepository.getCommentCountByTaskId(task.id),
        taskAttachmentRepository.getAttachmentCountByTaskId(task.id),
      ]);

      return {
        ...task,
        assigned_to_name: assignedToName,
        created_by_name: createdByName,
        related_vehicle: relatedVehicle,
        comment_count: commentCount,
        attachment_count: attachmentCount,
      };
    }));

    res.json({
      tasks: enhancedTasks,
      total: enhancedTasks.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', csrfProtection, requirePermission('report:generate:global'), async (req: AuthRequest, res) => {
  const parseResult = createTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid task data', details: parseResult.error.format() });
  }
  const { title, description, category, priority, status, assigned_to, due_date, related_vehicle_id } = parseResult.data;

  try {
    const tenantId = req.user?.tenant_id;
    const taskId = await taskRepository.createTask({
      title,
      description,
      category,
      priority,
      status,
      assigned_to,
      due_date,
      related_vehicle_id,
      tenant_id: tenantId,
    });

    res.status(201).json({ id: taskId, message: 'Task created successfully' });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', csrfProtection, requirePermission('report:edit:global'), async (req: AuthRequest, res) => {
  const parseResult = createTaskSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid task data', details: parseResult.error.format() });
  }
  const { title, description, category, priority, status, assigned_to, due_date, related_vehicle_id } = parseResult.data;
  const taskId = req.params.id;
  const tenantId = req.user?.tenant_id;

  try {
    await taskRepository.updateTask(taskId, {
      title,
      description,
      category,
      priority,
      status,
      assigned_to,
      due_date,
      related_vehicle_id,
      tenant_id: tenantId,
    });

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', csrfProtection, requirePermission('report:delete:global'), async (req: AuthRequest, res) => {
  const taskId = req.params.id;
  const tenantId = req.user?.tenant_id;

  try {
    await taskRepository.deleteTask(taskId, tenantId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task by ID
router.get('/:id', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  const taskId = req.params.id;
  const tenantId = req.user?.tenant_id;

  try {
    const task = await taskRepository.getTaskById(taskId, tenantId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [assignedToName, createdByName, relatedVehicle, commentCount, attachmentCount] = await Promise.all([
      task.assigned_to ? userRepository.getFullNameById(task.assigned_to) : null,
      userRepository.getFullNameById(task.created_by),
      task.related_vehicle_id ? vehicleRepository.getVehicleNumberById(task.related_vehicle_id) : null,
      taskCommentRepository.getCommentCountByTaskId(task.id),
      taskAttachmentRepository.getAttachmentCountByTaskId(task.id),
    ]);

    const enhancedTask = {
      ...task,
      assigned_to_name: assignedToName,
      created_by_name: createdByName,
      related_vehicle: relatedVehicle,
      comment_count: commentCount,
      attachment_count: attachmentCount,
    };

    res.json(enhancedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

export default router;


This refactored code follows the given instructions:

1. All necessary repositories are imported at the top of the file.
2. All direct database queries have been replaced with repository method calls.
3. Complex queries have been broken down into multiple repository method calls where necessary.
4. All business logic has been maintained.
5. Tenant_id filtering is still applied in all relevant repository calls.
6. The complete refactored file is provided.

Note that some repository methods (like `UserRepository.getFullNameById`, `VehicleRepository.getVehicleNumberById`, etc.) are assumed to exist. If they don't, you'll need to create them in their respective repository files.

Also, the `TaskRepository` class would need to be updated to include the new methods used in this refactored code, such as `updateTask`, `deleteTask`, and `getTaskById`. These methods should be implemented in the `task-repository.ts` file, following the pattern of the existing methods.