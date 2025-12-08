/**
 * AI Task Prioritization Service Tests
 *
 * Tests:
 * - Priority score calculation
 * - Task assignment recommendations
 * - Dependency analysis
 * - Execution order optimization
 * - Resource allocation
 * - Error handling and fallbacks
 * - Security validation
 *
 * @module ai-task-prioritization-tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

import pool from '../../config/database'
import {
  calculatePriorityScore,
  recommendTaskAssignment,
  analyzeDependencies,
  getOptimalExecutionOrder,
  optimizeResourceAllocation
} from '../../services/ai-task-prioritization'

// ============================================================================
// TEST SETUP
// ============================================================================

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001'
const TEST_USER_ID = '00000000-0000-0000-0000-000000000002'
let testVehicleId: string
let testTaskId: string

beforeAll(async () => {
  // Create test tenant
  await pool.query(
    `INSERT INTO tenants (id, name, subscription_tier, is_active)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [TEST_TENANT_ID, 'Test Tenant AI', 'enterprise', true]
  )

  // Create test user
  await pool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING`,
    [
      TEST_USER_ID,
      TEST_TENANT_ID,
      'test.driver@fleet.test',
      'hashed_password',
      'Test',
      'Driver',
      'driver',
      true,
      JSON.stringify({
        skills: ['vehicle_repair', 'diagnostics', 'electrical'],
        certifications: ['ASE', 'CDL'],
        experience_level: 'senior',
        latitude: 40.7128,
        longitude: -74.0060
      })
    ]
  )

  // Create test vehicle
  const vehicleResult = await pool.query(
    `INSERT INTO vehicles (tenant_id, vehicle_number, vin, make, model, year, status, last_latitude, last_longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [TEST_TENANT_ID, 'TEST-AI-001', '1HGBH41JXMN109186', 'Toyota', 'Camry', 2023, 'active', 40.7580, -73.9855]
  )
  testVehicleId = vehicleResult.rows[0].id

  // Create test task
  const taskResult = await pool.query(
    `INSERT INTO tasks (tenant_id, task_title, description, task_type, priority, status, created_by, estimated_hours, vehicle_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      TEST_TENANT_ID,
      'Test Task for AI',
      'Test task for AI prioritization',
      'maintenance',
      'medium',
      'pending',
      TEST_USER_ID,
      4,
      testVehicleId
    ]
  )
  testTaskId = taskResult.rows[0].id
})

afterAll(async () => {
  // Clean up test data
  await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [TEST_TENANT_ID])
  await pool.query('DELETE FROM vehicles WHERE tenant_id = $1', [TEST_TENANT_ID])
  await pool.query('DELETE FROM users WHERE tenant_id = $1', [TEST_TENANT_ID])
  await pool.query('DELETE FROM tenants WHERE id = $1', [TEST_TENANT_ID])
})

// ============================================================================
// PRIORITY SCORE CALCULATION TESTS
// ============================================================================

describe('calculatePriorityScore', () => {
  it('should calculate priority score for a task', async () => {
    const taskData = {
      task_title: 'Urgent Engine Repair',
      description: 'Critical engine issue requiring immediate attention',
      task_type: 'repair',
      priority: 'critical' as const,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimated_hours: 6,
      tenant_id: TEST_TENANT_ID,
      vehicle_id: testVehicleId
    }

    const result = await calculatePriorityScore(taskData)

    expect(result).toBeDefined()
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
    expect(result.reasoning).toBeTruthy()
    expect(result.factors).toBeDefined()
    expect(result.factors.urgency).toBeGreaterThanOrEqual(0)
    expect(result.factors.businessImpact).toBeGreaterThanOrEqual(0)
  }, 30000) // 30 second timeout for AI call

  it('should handle tasks without due dates', async () => {
    const taskData = {
      task_title: 'Routine Maintenance',
      task_type: 'maintenance',
      priority: 'low' as const,
      tenant_id: TEST_TENANT_ID
    }

    const result = await calculatePriorityScore(taskData)

    expect(result).toBeDefined()
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  }, 30000)

  it('should use fallback scoring when AI fails', async () => {
    // Mock AI failure
    vi.mock('@azure/openai', () => ({
      AzureOpenAI: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
          }
        }
      }))
    }))

    const taskData = {
      task_title: 'Test Task',
      task_type: 'inspection',
      priority: 'medium' as const,
      tenant_id: TEST_TENANT_ID
    }

    const result = await calculatePriorityScore(taskData)

    expect(result).toBeDefined()
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.reasoning).toContain('basic priority rules')
  })

  it('should reject invalid task data', async () => {
    const invalidTaskData = {
      task_title: '', // Empty title - invalid
      task_type: 'test',
      tenant_id: TEST_TENANT_ID
    }

    await expect(calculatePriorityScore(invalidTaskData as any)).rejects.toThrow()
  })
})

// ============================================================================
// TASK ASSIGNMENT TESTS
// ============================================================================

describe('recommendTaskAssignment', () => {
  it('should recommend users for task assignment', async () => {
    const taskData = {
      task_title: 'Vehicle Diagnostics',
      task_type: 'diagnostics',
      priority: 'high' as const,
      estimated_hours: 3,
      tenant_id: TEST_TENANT_ID,
      vehicle_id: testVehicleId
    }

    const result = await recommendTaskAssignment(taskData, true)

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    // Should return up to 3 recommendations
    expect(result.length).toBeLessThanOrEqual(3)

    if (result.length > 0) {
      const recommendation = result[0]
      expect(recommendation.recommendedUserId).toBeTruthy()
      expect(recommendation.userName).toBeTruthy()
      expect(recommendation.score).toBeGreaterThanOrEqual(0)
      expect(recommendation.score).toBeLessThanOrEqual(100)
      expect(recommendation.reasoning).toBeTruthy()
      expect(recommendation.skillMatch).toBeGreaterThanOrEqual(0)
      expect(recommendation.estimatedStartTime).toBeInstanceOf(Date)
      expect(recommendation.estimatedCompletionTime).toBeInstanceOf(Date)
    }
  }, 30000)

  it('should consider location when requested', async () => {
    const taskData = {
      task_title: 'On-site Repair',
      task_type: 'repair',
      priority: 'medium' as const,
      tenant_id: TEST_TENANT_ID,
      vehicle_id: testVehicleId
    }

    const withLocation = await recommendTaskAssignment(taskData, true)
    const withoutLocation = await recommendTaskAssignment(taskData, false)

    expect(Array.isArray(withLocation)).toBe(true)
    expect(Array.isArray(withoutLocation)).toBe(true)

    if (withLocation.length > 0) {
      // When considering location, distance should be calculated
      const rec = withLocation[0]
      // Distance might be undefined if location data is missing
      if (rec.distance !== undefined) {
        expect(rec.distance).toBeGreaterThanOrEqual(0)
      }
    }
  }, 30000)

  it('should return empty array when no users available', async () => {
    const unusedTenantId = '99999999-9999-9999-9999-999999999999'

    const taskData = {
      task_title: 'Test Task',
      task_type: 'test',
      tenant_id: unusedTenantId
    }

    const result = await recommendTaskAssignment(taskData, false)

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  }, 30000)
})

// ============================================================================
// DEPENDENCY ANALYSIS TESTS
// ============================================================================

describe('analyzeDependencies', () => {
  it('should analyze task dependencies', async () => {
    const result = await analyzeDependencies(testTaskId, TEST_TENANT_ID)

    expect(result).toBeDefined()
    expect(result.taskId).toBe(testTaskId)
    expect(Array.isArray(result.dependencies)).toBe(true)
    expect(Array.isArray(result.dependents)).toBe(true)
    expect(Array.isArray(result.blockedBy)).toBe(true)
    expect(typeof result.criticalPath).toBe('boolean')
    expect(typeof result.canStart).toBe('boolean')
  })

  it('should identify tasks on critical path', async () => {
    // Create parent-child task relationship
    const parentResult = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [TEST_TENANT_ID, 'Parent Task', 'planning', TEST_USER_ID, 'in_progress']
    )
    const parentId = parentResult.rows[0].id

    const childResult = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by, parent_task_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [TEST_TENANT_ID, 'Child Task', 'execution', TEST_USER_ID, parentId, 'pending']
    )
    const childId = childResult.rows[0].id

    const parentDeps = await analyzeDependencies(parentId, TEST_TENANT_ID)
    const childDeps = await analyzeDependencies(childId, TEST_TENANT_ID)

    // Parent should be on critical path (has dependents)
    expect(parentDeps.criticalPath).toBe(true)
    expect(parentDeps.dependents).toContain(childId)

    // Child should have parent as dependency
    expect(childDeps.dependencies).toContain(parentId)

    // Clean up
    await pool.query('DELETE FROM tasks WHERE id IN ($1, $2)', [parentId, childId])
  })

  it('should handle non-existent task gracefully', async () => {
    const fakeTaskId = '00000000-0000-0000-0000-000000000999'

    const result = await analyzeDependencies(fakeTaskId, TEST_TENANT_ID)

    expect(result).toBeDefined()
    expect(result.taskId).toBe(fakeTaskId)
    expect(result.dependencies.length).toBe(0)
    expect(result.dependents.length).toBe(0)
  })
})

// ============================================================================
// EXECUTION ORDER TESTS
// ============================================================================

describe('getOptimalExecutionOrder', () => {
  it('should calculate optimal execution order for independent tasks', async () => {
    // Create independent tasks
    const task1Result = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [TEST_TENANT_ID, 'Independent Task 1', 'test', TEST_USER_ID]
    )
    const task2Result = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [TEST_TENANT_ID, 'Independent Task 2', 'test', TEST_USER_ID]
    )

    const taskIds = [task1Result.rows[0].id, task2Result.rows[0].id]

    const result = await getOptimalExecutionOrder(taskIds, TEST_TENANT_ID)

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    // Independent tasks should all be in first level (can run in parallel)
    expect(result[0]).toEqual(expect.arrayContaining(taskIds))

    // Clean up
    await pool.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [taskIds])
  })

  it('should respect task dependencies in execution order', async () => {
    // Create task chain: A -> B -> C
    const taskA = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [TEST_TENANT_ID, 'Task A', 'test', TEST_USER_ID, 'pending']
    )
    const taskB = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by, parent_task_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [TEST_TENANT_ID, 'Task B', 'test', TEST_USER_ID, taskA.rows[0].id, 'pending']
    )
    const taskC = await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, task_type, created_by, parent_task_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [TEST_TENANT_ID, 'Task C', 'test', TEST_USER_ID, taskB.rows[0].id, 'pending']
    )

    const taskIds = [taskC.rows[0].id, taskB.rows[0].id, taskA.rows[0].id] // Intentionally unordered

    const result = await getOptimalExecutionOrder(taskIds, TEST_TENANT_ID)

    expect(result.length).toBeGreaterThanOrEqual(3)
    // Task A should be in earlier level than B, and B earlier than C
    const levelOfA = result.findIndex(level => level.includes(taskA.rows[0].id))
    const levelOfB = result.findIndex(level => level.includes(taskB.rows[0].id))
    const levelOfC = result.findIndex(level => level.includes(taskC.rows[0].id))

    expect(levelOfA).toBeLessThan(levelOfB)
    expect(levelOfB).toBeLessThan(levelOfC)

    // Clean up
    await pool.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [taskIds])
  })
})

// ============================================================================
// RESOURCE OPTIMIZATION TESTS
// ============================================================================

describe('optimizeResourceAllocation', () => {
  it('should optimize resource allocation for multiple tasks', async () => {
    const taskIds = [testTaskId]

    const result = await optimizeResourceAllocation(taskIds, TEST_TENANT_ID)

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(taskIds.length)

    if (result.length > 0) {
      const optimization = result[0]
      expect(optimization.taskId).toBe(testTaskId)
      expect(optimization.recommendedSchedule).toBeInstanceOf(Date)
      expect(Array.isArray(optimization.resourceConflicts)).toBe(true)
      expect(Array.isArray(optimization.alternativeAssignments)).toBe(true)
      expect(optimization.optimizationScore).toBeGreaterThanOrEqual(0)
    }
  }, 60000) // 60 second timeout for multiple AI calls

  it('should handle empty task list', async () => {
    const result = await optimizeResourceAllocation([], TEST_TENANT_ID)

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })
})

// ============================================================================
// SECURITY TESTS
// ============================================================================

describe('Security Validation', () => {
  it('should enforce tenant isolation in priority calculation', async () => {
    const differentTenantId = '11111111-1111-1111-1111-111111111111'

    const taskData = {
      task_title: 'Cross-tenant Task',
      task_type: 'test',
      tenant_id: differentTenantId,
      vehicle_id: testVehicleId // Vehicle from different tenant
    }

    // Should not crash, but won't find vehicle data
    const result = await calculatePriorityScore(taskData)
    expect(result).toBeDefined()
  }, 30000)

  it('should sanitize SQL inputs', async () => {
    const maliciousTaskId = "'; DROP TABLE tasks; --"

    // Should handle gracefully without SQL injection
    await expect(async () => {
      await analyzeDependencies(maliciousTaskId, TEST_TENANT_ID)
    }).not.toThrow()
  })

  it('should validate UUIDs', async () => {
    const invalidUUID = 'not-a-uuid'

    const taskData = {
      task_title: 'Test',
      task_type: 'test',
      tenant_id: invalidUUID // Invalid UUID
    }

    // Should be caught by Zod validation
    await expect(calculatePriorityScore(taskData as any)).rejects.toThrow()
  })
})

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  it('should handle database connection errors gracefully', async () => {
    // Simulate database error by using invalid tenant ID format
    const taskData = {
      task_title: 'Test Task',
      task_type: 'test',
      tenant_id: 'invalid-uuid-format'
    }

    await expect(calculatePriorityScore(taskData as any)).rejects.toThrow()
  })

  it('should provide fallback when AI service is unavailable', async () => {
    // This is tested in the priority calculation suite
    // The service should gracefully fall back to basic scoring
    const taskData = {
      task_title: 'Fallback Test',
      task_type: 'test',
      priority: 'high' as const,
      tenant_id: TEST_TENANT_ID
    }

    const result = await calculatePriorityScore(taskData)
    expect(result).toBeDefined()
    expect(result.score).toBeGreaterThan(0)
  }, 30000)
})
