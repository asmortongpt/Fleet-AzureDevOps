/**
 * Task Management API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/server'
import {
  generateTestToken,
  cleanupDatabase,
  seedTestDatabase,
  closeTestDatabase,
  generateTestTask,
  testPool
} from '../setup'

describe('Task Management API', () => {
  let authToken: string
  let secondTenantToken: string

  beforeAll(async () => {
    await seedTestDatabase()
    authToken = generateTestToken()
    secondTenantToken = generateTestToken({ tenant_id: 'different-tenant' })
  })

  afterAll(async () => {
    await cleanupDatabase()
    await closeTestDatabase()
  })

  beforeEach(async () => {
    await testPool.query('DELETE FROM task_time_entries WHERE 1=1')
    await testPool.query('DELETE FROM task_comments WHERE 1=1')
    await testPool.query('DELETE FROM task_checklist WHERE 1=1')
    await testPool.query('DELETE FROM tasks WHERE 1=1')
  })

  describe('POST /api/task-management', () => {
    it('should create a new task', async () => {
      const taskData = generateTestTask()

      const response = await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.task).toBeDefined()
      expect(response.body.task.title).toBe(taskData.title)
      expect(response.body.task.priority).toBe(taskData.priority)
      expect(response.body.message).toBe('Task created successfully')
    })

    it('should create task with checklist items', async () => {
      const taskData = {
        ...generateTestTask(),
        checklist_items: [
          { text: 'First checklist item', completed: false },
          { text: 'Second checklist item', completed: true }
        ]
      }

      const response = await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201)

      const taskId = response.body.task.id

      const checklistResult = await testPool.query(
        'SELECT * FROM task_checklist WHERE task_id = $1',
        [taskId]
      )

      expect(checklistResult.rows.length).toBe(2)
    })

    it('should default to medium priority if not specified', async () => {
      const taskData = { ...generateTestTask() }
      delete taskData.priority

      const response = await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.task.priority).toBe('medium')
    })

    it('should require authentication', async () => {
      await request(app)
        .post('/api/task-management')
        .send(generateTestTask())
        .expect(401)
    })
  })

  describe('GET /api/task-management', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask({ priority: 'high', status: 'in_progress' }))

      await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask({ priority: 'low', status: 'completed' }))

      await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask({ priority: 'critical', status: 'todo' }))
    })

    it('should retrieve all tasks', async () => {
      const response = await request(app)
        .get('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.tasks).toBeDefined()
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/task-management?status=in_progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.tasks.forEach((task: any) => {
        expect(task.status).toBe('in_progress')
      })
    })

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/task-management?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.tasks.forEach((task: any) => {
        expect(task.priority).toBe('high')
      })
    })

    it('should sort tasks by priority and due date', async () => {
      const response = await request(app)
        .get('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Critical should come first
      const firstTask = response.body.tasks[0]
      expect(firstTask.priority).toBe('critical')
    })

    it('should enforce multi-tenant isolation', async () => {
      const response = await request(app)
        .get('/api/task-management')
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(200)

      const firstTenantTasks = response.body.tasks.filter(
        (t: any) => t.tenant_id === 'test-tenant-id'
      )
      expect(firstTenantTasks.length).toBe(0)
    })
  })

  describe('PUT /api/task-management/:id', () => {
    let testTaskId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask())

      testTaskId = response.body.task.id
    })

    it('should update task successfully', async () => {
      const updates = {
        title: 'Updated Task Title',
        status: 'completed',
        priority: 'high'
      }

      const response = await request(app)
        .put(`/api/task-management/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200)

      expect(response.body.task.title).toBe(updates.title)
      expect(response.body.task.status).toBe(updates.status)
      expect(response.body.task.priority).toBe(updates.priority)
    })

    it('should reject update with no fields', async () => {
      await request(app)
        .put(`/api/task-management/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('should not allow update of other tenant tasks', async () => {
      await request(app)
        .put(`/api/task-management/${testTaskId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .send({ status: 'completed' })
        .expect(404)
    })
  })

  describe('POST /api/task-management/:id/comments', () => {
    let testTaskId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask())

      testTaskId = response.body.task.id
    })

    it('should add comment to task', async () => {
      const response = await request(app)
        .post(`/api/task-management/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ comment_text: 'Test comment' })
        .expect(201)

      expect(response.body.comment).toBeDefined()
      expect(response.body.comment.comment_text).toBe('Test comment')
    })

    it('should store comment in database', async () => {
      await request(app)
        .post(`/api/task-management/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ comment_text: 'Stored comment' })

      const result = await testPool.query(
        'SELECT * FROM task_comments WHERE task_id = $1',
        [testTaskId]
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].comment_text).toBe('Stored comment')
    })
  })

  describe('POST /api/task-management/:id/time-entries', () => {
    let testTaskId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask())

      testTaskId = response.body.task.id
    })

    it('should log time on task', async () => {
      const response = await request(app)
        .post(`/api/task-management/${testTaskId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hours_spent: 2.5,
          description: 'Fixed bug'
        })
        .expect(201)

      expect(response.body.time_entry).toBeDefined()
      expect(response.body.time_entry.hours_spent).toBe('2.5')
    })

    it('should store time entry in database', async () => {
      await request(app)
        .post(`/api/task-management/${testTaskId}/time-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hours_spent: 3,
          description: 'Development work'
        })

      const result = await testPool.query(
        'SELECT * FROM task_time_entries WHERE task_id = $1',
        [testTaskId]
      )

      expect(result.rows.length).toBe(1)
      expect(parseFloat(result.rows[0].hours_spent)).toBe(3)
    })
  })

  describe('GET /api/task-management/analytics/summary', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask({ status: 'completed', priority: 'high' }))

      await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask({ status: 'todo', priority: 'medium' }))

      await request(app)
        .post('/api/task-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestTask({ status: 'completed', priority: 'low' }))
    })

    it('should return task analytics', async () => {
      const response = await request(app)
        .get('/api/task-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.by_status).toBeDefined()
      expect(response.body.by_priority).toBeDefined()
      expect(response.body.by_category).toBeDefined()
      expect(response.body.completion_rate).toBeDefined()
    })

    it('should calculate accurate completion rate', async () => {
      const response = await request(app)
        .get('/api/task-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.completion_rate.completed).toBe('2')
      expect(response.body.completion_rate.total).toBe('3')
      expect(parseFloat(response.body.completion_rate.percentage)).toBeGreaterThan(60)
    })
  })
})
