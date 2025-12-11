/**
 * TaskManagementRepository Tests - B3 Agent 29
 * Comprehensive test coverage for all repository methods
 * Tests tenant isolation and parameterized queries
 */

import { taskManagementRepository, Task, TaskFilters } from '../task-management.repository'
import { pool } from '../../db'

describe('TaskManagementRepository', () => {
  const TEST_TENANT_ID = 'test-tenant-123'
  const TEST_USER_ID = 1
  let createdTaskId: number

  beforeAll(async () => {
    // Clean up any existing test data
    await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [TEST_TENANT_ID])
  })

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [TEST_TENANT_ID])
    await pool.end()
  })

  describe('create', () => {
    it('should create a task with required fields', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high' as const,
        status: 'todo' as const
      }

      const task = await taskManagementRepository.create(taskData, TEST_TENANT_ID, TEST_USER_ID)

      expect(task).toBeDefined()
      expect(task.id).toBeDefined()
      expect(task.title).toBe('Test Task')
      expect(task.description).toBe('Test Description')
      expect(task.priority).toBe('high')
      expect(task.status).toBe('todo')
      expect(task.tenant_id).toBe(TEST_TENANT_ID)
      expect(task.created_by).toBe(TEST_USER_ID)

      createdTaskId = task.id
    })

    it('should create a task with default priority and status', async () => {
      const taskData = {
        title: 'Task with Defaults'
      }

      const task = await taskManagementRepository.create(taskData, TEST_TENANT_ID, TEST_USER_ID)

      expect(task.priority).toBe('medium')
      expect(task.status).toBe('todo')
    })

    it('should throw validation error when title is missing', async () => {
      const taskData = {
        description: 'No title'
      }

      await expect(
        taskManagementRepository.create(taskData, TEST_TENANT_ID, TEST_USER_ID)
      ).rejects.toThrow('Task title is required')
    })

    it('should create task with all optional fields', async () => {
      const taskData = {
        title: 'Complete Task',
        description: 'Full details',
        category: 'maintenance',
        priority: 'critical' as const,
        status: 'in_progress' as const,
        assigned_to: 2,
        due_date: new Date('2025-12-31'),
        estimated_hours: 8,
        related_vehicle_id: 100,
        related_work_order_id: 200,
        tags: ['urgent', 'safety']
      }

      const task = await taskManagementRepository.create(taskData, TEST_TENANT_ID, TEST_USER_ID)

      expect(task.category).toBe('maintenance')
      expect(task.assigned_to).toBe(2)
      expect(task.estimated_hours).toBe(8)
      expect(task.related_vehicle_id).toBe(100)
      expect(task.related_work_order_id).toBe(200)
    })
  })

  describe('findById', () => {
    it('should find task by ID for correct tenant', async () => {
      const task = await taskManagementRepository.findById(createdTaskId, TEST_TENANT_ID)

      expect(task).toBeDefined()
      expect(task?.id).toBe(createdTaskId)
      expect(task?.title).toBe('Test Task')
    })

    it('should return null for wrong tenant', async () => {
      const task = await taskManagementRepository.findById(createdTaskId, 'wrong-tenant')

      expect(task).toBeNull()
    })

    it('should return null for non-existent task', async () => {
      const task = await taskManagementRepository.findById(999999, TEST_TENANT_ID)

      expect(task).toBeNull()
    })
  })

  describe('update', () => {
    it('should update task fields', async () => {
      const updates = {
        title: 'Updated Task Title',
        priority: 'low' as const,
        status: 'completed' as const
      }

      const task = await taskManagementRepository.update(createdTaskId, updates, TEST_TENANT_ID)

      expect(task).toBeDefined()
      expect(task?.title).toBe('Updated Task Title')
      expect(task?.priority).toBe('low')
      expect(task?.status).toBe('completed')
    })

    it('should enforce tenant isolation on update', async () => {
      const updates = {
        title: 'Should Not Update'
      }

      const task = await taskManagementRepository.update(createdTaskId, updates, 'wrong-tenant')

      expect(task).toBeNull()
    })

    it('should throw error when no fields provided', async () => {
      await expect(
        taskManagementRepository.update(createdTaskId, {}, TEST_TENANT_ID)
      ).rejects.toThrow('No fields to update')
    })
  })

  describe('findAllWithDetails', () => {
    beforeAll(async () => {
      // Create multiple tasks for filtering tests
      await taskManagementRepository.create(
        { title: 'High Priority Task', priority: 'high', status: 'todo' },
        TEST_TENANT_ID,
        TEST_USER_ID
      )
      await taskManagementRepository.create(
        { title: 'Medium Priority Task', priority: 'medium', status: 'in_progress' },
        TEST_TENANT_ID,
        TEST_USER_ID
      )
      await taskManagementRepository.create(
        { title: 'Low Priority Task', priority: 'low', status: 'completed' },
        TEST_TENANT_ID,
        TEST_USER_ID
      )
    })

    it('should find all tasks for tenant', async () => {
      const tasks = await taskManagementRepository.findAllWithDetails(TEST_TENANT_ID)

      expect(tasks.length).toBeGreaterThan(0)
      tasks.forEach(task => {
        expect(task.tenant_id).toBe(TEST_TENANT_ID)
      })
    })

    it('should filter tasks by status', async () => {
      const filters: TaskFilters = { status: 'todo' }
      const tasks = await taskManagementRepository.findAllWithDetails(TEST_TENANT_ID, filters)

      expect(tasks.length).toBeGreaterThan(0)
      tasks.forEach(task => {
        expect(task.status).toBe('todo')
      })
    })

    it('should filter tasks by priority', async () => {
      const filters: TaskFilters = { priority: 'high' }
      const tasks = await taskManagementRepository.findAllWithDetails(TEST_TENANT_ID, filters)

      expect(tasks.length).toBeGreaterThan(0)
      tasks.forEach(task => {
        expect(task.priority).toBe('high')
      })
    })

    it('should filter tasks by multiple criteria', async () => {
      const filters: TaskFilters = {
        status: 'in_progress',
        priority: 'medium'
      }
      const tasks = await taskManagementRepository.findAllWithDetails(TEST_TENANT_ID, filters)

      tasks.forEach(task => {
        expect(task.status).toBe('in_progress')
        expect(task.priority).toBe('medium')
      })
    })

    it('should return empty array for different tenant', async () => {
      const tasks = await taskManagementRepository.findAllWithDetails('different-tenant')

      expect(tasks).toEqual([])
    })
  })

  describe('addComment', () => {
    it('should add comment to task', async () => {
      const comment = await taskManagementRepository.addComment(
        createdTaskId,
        TEST_USER_ID,
        'This is a test comment'
      )

      expect(comment).toBeDefined()
      expect(comment.task_id).toBe(createdTaskId)
      expect(comment.user_id).toBe(TEST_USER_ID)
      expect(comment.comment_text).toBe('This is a test comment')
      expect(comment.created_at).toBeDefined()
    })

    it('should throw error for empty comment', async () => {
      await expect(
        taskManagementRepository.addComment(createdTaskId, TEST_USER_ID, '')
      ).rejects.toThrow('Comment text is required')
    })

    it('should throw error for whitespace-only comment', async () => {
      await expect(
        taskManagementRepository.addComment(createdTaskId, TEST_USER_ID, '   ')
      ).rejects.toThrow('Comment text is required')
    })
  })

  describe('addTimeEntry', () => {
    it('should add time entry to task', async () => {
      const timeEntry = await taskManagementRepository.addTimeEntry(
        createdTaskId,
        TEST_USER_ID,
        4.5,
        'Worked on implementation'
      )

      expect(timeEntry).toBeDefined()
      expect(timeEntry.task_id).toBe(createdTaskId)
      expect(timeEntry.user_id).toBe(TEST_USER_ID)
      expect(timeEntry.hours_spent).toBe(4.5)
      expect(timeEntry.description).toBe('Worked on implementation')
    })

    it('should add time entry without description', async () => {
      const timeEntry = await taskManagementRepository.addTimeEntry(
        createdTaskId,
        TEST_USER_ID,
        2.0
      )

      expect(timeEntry.hours_spent).toBe(2.0)
      expect(timeEntry.description).toBeNull()
    })

    it('should throw error for zero hours', async () => {
      await expect(
        taskManagementRepository.addTimeEntry(createdTaskId, TEST_USER_ID, 0)
      ).rejects.toThrow('Hours spent must be greater than 0')
    })

    it('should throw error for negative hours', async () => {
      await expect(
        taskManagementRepository.addTimeEntry(createdTaskId, TEST_USER_ID, -5)
      ).rejects.toThrow('Hours spent must be greater than 0')
    })
  })

  describe('addChecklistItems', () => {
    it('should add checklist items to task', async () => {
      const items = [
        { text: 'Step 1', completed: false },
        { text: 'Step 2', completed: true },
        { text: 'Step 3' }
      ]

      await taskManagementRepository.addChecklistItems(createdTaskId, items)

      // Verify items were added
      const result = await pool.query(
        'SELECT id, tenant_id, created_at, updated_at FROM task_checklist WHERE task_id = $1 ORDER BY id',
        [createdTaskId]
      )

      expect(result.rows.length).toBe(3)
      expect(result.rows[0].item_text).toBe('Step 1')
      expect(result.rows[0].is_completed).toBe(false)
      expect(result.rows[1].is_completed).toBe(true)
      expect(result.rows[2].is_completed).toBe(false) // default
    })

    it('should handle empty items array', async () => {
      await expect(
        taskManagementRepository.addChecklistItems(createdTaskId, [])
      ).resolves.toBeUndefined()
    })
  })

  describe('analytics methods', () => {
    describe('getStatusCounts', () => {
      it('should return status counts', async () => {
        const counts = await taskManagementRepository.getStatusCounts(TEST_TENANT_ID)

        expect(counts).toBeDefined()
        expect(Array.isArray(counts)).toBe(true)

        const totalCount = counts.reduce((sum, item) => sum + item.count, 0)
        expect(totalCount).toBeGreaterThan(0)
      })
    })

    describe('getPriorityCounts', () => {
      it('should return priority counts', async () => {
        const counts = await taskManagementRepository.getPriorityCounts(TEST_TENANT_ID)

        expect(counts).toBeDefined()
        expect(Array.isArray(counts)).toBe(true)

        const totalCount = counts.reduce((sum, item) => sum + item.count, 0)
        expect(totalCount).toBeGreaterThan(0)
      })
    })

    describe('getCategoryCounts', () => {
      it('should return category counts', async () => {
        const counts = await taskManagementRepository.getCategoryCounts(TEST_TENANT_ID)

        expect(counts).toBeDefined()
        expect(Array.isArray(counts)).toBe(true)
      })
    })

    describe('getCompletionRate', () => {
      it('should return completion rate', async () => {
        const rate = await taskManagementRepository.getCompletionRate(TEST_TENANT_ID)

        expect(rate).toBeDefined()
        expect(rate.total).toBeGreaterThanOrEqual(0)
        expect(rate.completed).toBeGreaterThanOrEqual(0)
        expect(rate.percentage).toBeDefined()
        expect(parseFloat(rate.percentage)).toBeGreaterThanOrEqual(0)
        expect(parseFloat(rate.percentage)).toBeLessThanOrEqual(100)
      })
    })

    describe('getAnalytics', () => {
      it('should return complete analytics', async () => {
        const analytics = await taskManagementRepository.getAnalytics(TEST_TENANT_ID)

        expect(analytics).toBeDefined()
        expect(analytics.by_status).toBeDefined()
        expect(analytics.by_priority).toBeDefined()
        expect(analytics.by_category).toBeDefined()
        expect(analytics.completion_rate).toBeDefined()
        expect(analytics.completion_rate.total).toBeGreaterThan(0)
      })
    })
  })

  describe('count', () => {
    it('should count all tasks for tenant', async () => {
      const count = await taskManagementRepository.count(TEST_TENANT_ID)

      expect(count).toBeGreaterThan(0)
    })

    it('should count tasks with filters', async () => {
      const count = await taskManagementRepository.count(TEST_TENANT_ID, {
        status: 'completed'
      })

      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return 0 for different tenant', async () => {
      const count = await taskManagementRepository.count('non-existent-tenant')

      expect(count).toBe(0)
    })
  })

  describe('delete', () => {
    it('should delete task for correct tenant', async () => {
      const taskToDelete = await taskManagementRepository.create(
        { title: 'Task to Delete' },
        TEST_TENANT_ID,
        TEST_USER_ID
      )

      const deleted = await taskManagementRepository.delete(taskToDelete.id, TEST_TENANT_ID)

      expect(deleted).toBe(true)

      const found = await taskManagementRepository.findById(taskToDelete.id, TEST_TENANT_ID)
      expect(found).toBeNull()
    })

    it('should not delete task for wrong tenant', async () => {
      const deleted = await taskManagementRepository.delete(createdTaskId, 'wrong-tenant')

      expect(deleted).toBe(false)
    })

    it('should return false for non-existent task', async () => {
      const deleted = await taskManagementRepository.delete(999999, TEST_TENANT_ID)

      expect(deleted).toBe(false)
    })
  })

  describe('tenant isolation', () => {
    const TENANT_A = 'tenant-a'
    const TENANT_B = 'tenant-b'
    let taskATenantA: number
    let taskBTenantB: number

    beforeAll(async () => {
      // Create tasks for different tenants
      const taskA = await taskManagementRepository.create(
        { title: 'Tenant A Task' },
        TENANT_A,
        TEST_USER_ID
      )
      const taskB = await taskManagementRepository.create(
        { title: 'Tenant B Task' },
        TENANT_B,
        TEST_USER_ID
      )

      taskATenantA = taskA.id
      taskBTenantB = taskB.id
    })

    afterAll(async () => {
      await pool.query('DELETE FROM tasks WHERE tenant_id IN ($1, $2)', [TENANT_A, TENANT_B])
    })

    it('should enforce tenant isolation on findById', async () => {
      const taskA = await taskManagementRepository.findById(taskATenantA, TENANT_A)
      const taskB = await taskManagementRepository.findById(taskATenantA, TENANT_B)

      expect(taskA).toBeDefined()
      expect(taskB).toBeNull()
    })

    it('should enforce tenant isolation on findAllWithDetails', async () => {
      const tasksA = await taskManagementRepository.findAllWithDetails(TENANT_A)
      const tasksB = await taskManagementRepository.findAllWithDetails(TENANT_B)

      expect(tasksA.some(t => t.id === taskATenantA)).toBe(true)
      expect(tasksA.some(t => t.id === taskBTenantB)).toBe(false)

      expect(tasksB.some(t => t.id === taskBTenantB)).toBe(true)
      expect(tasksB.some(t => t.id === taskATenantA)).toBe(false)
    })

    it('should enforce tenant isolation on update', async () => {
      const updated = await taskManagementRepository.update(
        taskATenantA,
        { title: 'Updated by Tenant B' },
        TENANT_B
      )

      expect(updated).toBeNull()

      const original = await taskManagementRepository.findById(taskATenantA, TENANT_A)
      expect(original?.title).toBe('Tenant A Task')
    })

    it('should enforce tenant isolation on delete', async () => {
      const deleted = await taskManagementRepository.delete(taskATenantA, TENANT_B)

      expect(deleted).toBe(false)

      const stillExists = await taskManagementRepository.findById(taskATenantA, TENANT_A)
      expect(stillExists).toBeDefined()
    })
  })
})
