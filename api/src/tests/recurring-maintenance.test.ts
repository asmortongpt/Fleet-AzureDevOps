/**
 * Test Suite for Recurring Maintenance System
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Pool } from 'pg'
import {
  calculateNextDueDate,
  validateRecurrencePattern,
  checkDueSchedules,
  generateWorkOrder,
  processRecurringSchedules,
  getRecurringScheduleStats
} from '../services/recurring-maintenance'
import { MaintenanceSchedule, RecurrencePattern } from '../types/maintenance'

// Test database connection
const testPool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'fleetdb_test',
  user: process.env.TEST_DB_USER || 'fleetadmin',
  password: process.env.TEST_DB_PASSWORD
})

let testTenantId: string
let testVehicleId: string
let testScheduleId: string

beforeAll(async () => {
  // Create test tenant
  const tenantResult = await testPool.query(
    "INSERT INTO tenants (name, domain, active) VALUES ('Test Tenant', 'test.com', true) RETURNING id"
  )
  testTenantId = tenantResult.rows[0].id

  // Create test vehicle
  const vehicleResult = await testPool.query(
    `INSERT INTO vehicles (tenant_id, vehicle_number, make, model, year, vin, status)
     VALUES ($1, 'TEST-001', 'Test', 'Vehicle', 2023, 'TEST123456789', 'active') RETURNING id',
    [testTenantId]
  )
  testVehicleId = vehicleResult.rows[0].id
})

afterAll(async () => {
  // Cleanup test data
  await testPool.query('DELETE FROM maintenance_schedules WHERE tenant_id = $1', [testTenantId])
  await testPool.query('DELETE FROM vehicles WHERE tenant_id = $1', [testTenantId])
  await testPool.query('DELETE FROM tenants WHERE id = $1', [testTenantId])
  await testPool.end()
})

beforeEach(async () => {
  // Clean up schedules between tests
  await testPool.query('DELETE FROM maintenance_schedules WHERE tenant_id = $1', [testTenantId])
  await testPool.query('DELETE FROM work_orders WHERE tenant_id = $1', [testTenantId])
  await testPool.query('DELETE FROM maintenance_schedule_history WHERE tenant_id = $1', [testTenantId])
})

describe('Recurrence Pattern Validation', () => {
  it('should validate time-based pattern', () => {
    const pattern: RecurrencePattern = {
      type: 'time',
      interval_value: 90,
      interval_unit: 'days'
    }

    const result = validateRecurrencePattern(pattern)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should validate mileage-based pattern', () => {
    const pattern: RecurrencePattern = {
      type: 'mileage',
      interval_value: 3000,
      interval_unit: 'miles'
    }

    const result = validateRecurrencePattern(pattern)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject invalid interval value', () => {
    const pattern: RecurrencePattern = {
      type: 'time',
      interval_value: -10,
      interval_unit: 'days'
    }

    const result = validateRecurrencePattern(pattern)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject mismatched type and unit', () => {
    const pattern: RecurrencePattern = {
      type: 'mileage',
      interval_value: 3000,
      interval_unit: 'days' // Should be 'miles'
    }

    const result = validateRecurrencePattern(pattern)
    expect(result.valid).toBe(false)
  })
})

describe('Next Due Date Calculation', () => {
  it('should calculate next due date for time-based daily interval', async () => {
    const schedule: Partial<MaintenanceSchedule> = {
      tenant_id: testTenantId,
      vehicle_id: testVehicleId,
      recurrence_pattern: {
        type: 'time',
        interval_value: 30,
        interval_unit: 'days'
      }
    }

    const currentDate = new Date('2025-01-01')
    const nextDue = await calculateNextDueDate(schedule as MaintenanceSchedule, currentDate)

    const expected = new Date('2025-01-31')
    expect(nextDue.toDateString()).toBe(expected.toDateString())
  })

  it('should calculate next due date for weekly interval', async () => {
    const schedule: Partial<MaintenanceSchedule> = {
      tenant_id: testTenantId,
      vehicle_id: testVehicleId,
      recurrence_pattern: {
        type: 'time',
        interval_value: 2,
        interval_unit: 'weeks'
      }
    }

    const currentDate = new Date('2025-01-01')
    const nextDue = await calculateNextDueDate(schedule as MaintenanceSchedule, currentDate)

    const expected = new Date('2025-01-15')
    expect(nextDue.toDateString()).toBe(expected.toDateString())
  })

  it('should calculate next due date for monthly interval', async () => {
    const schedule: Partial<MaintenanceSchedule> = {
      tenant_id: testTenantId,
      vehicle_id: testVehicleId,
      recurrence_pattern: {
        type: 'time',
        interval_value: 3,
        interval_unit: 'months'
      }
    }

    const currentDate = new Date('2025-01-01')
    const nextDue = await calculateNextDueDate(schedule as MaintenanceSchedule, currentDate)

    const expected = new Date('2025-04-01')
    expect(nextDue.toDateString()).toBe(expected.toDateString())
  })
})

describe('Check Due Schedules', () => {
  it('should find schedules due within specified days', async () => {
    // Create a schedule due in 3 days
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)

    await testPool.query(
      `INSERT INTO maintenance_schedules (
        tenant_id, vehicle_id, service_type, next_due,
        is_recurring, auto_create_work_order, priority, estimated_cost, status
      ) VALUES ($1, $2, $3, $4, true, true, 'medium', 100, 'scheduled')',
      [testTenantId, testVehicleId, 'Test Service', dueDate]
    )

    const dueSchedules = await checkDueSchedules(testTenantId, 7, true)
    expect(dueSchedules.length).toBe(1)
    expect(dueSchedules[0].schedule.service_type).toBe('Test Service')
  })

  it('should not find schedules due beyond specified days', async () => {
    // Create a schedule due in 10 days
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 10)

    await testPool.query(
      `INSERT INTO maintenance_schedules (
        tenant_id, vehicle_id, service_type, next_due,
        is_recurring, auto_create_work_order, priority, estimated_cost, status
      ) VALUES ($1, $2, $3, $4, true, true, 'medium', 100, 'scheduled')',
      [testTenantId, testVehicleId, 'Future Service', dueDate]
    )

    const dueSchedules = await checkDueSchedules(testTenantId, 7, false)
    expect(dueSchedules.length).toBe(0)
  })

  it('should mark overdue schedules correctly', async () => {
    // Create an overdue schedule
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() - 5)

    await testPool.query(
      `INSERT INTO maintenance_schedules (
        tenant_id, vehicle_id, service_type, next_due,
        is_recurring, auto_create_work_order, priority, estimated_cost, status
      ) VALUES ($1, $2, $3, $4, true, true, 'high', 150, 'scheduled')',
      [testTenantId, testVehicleId, 'Overdue Service', dueDate]
    )

    const dueSchedules = await checkDueSchedules(testTenantId, 7, true)
    expect(dueSchedules.length).toBe(1)
    expect(dueSchedules[0].is_overdue).toBe(true)
  })
})

describe('Work Order Generation', () => {
  it('should generate work order from schedule', async () => {
    // Create a schedule
    const scheduleResult = await testPool.query(
      `INSERT INTO maintenance_schedules (
        tenant_id, vehicle_id, service_type, next_due, priority,
        is_recurring, auto_create_work_order, estimated_cost,
        recurrence_pattern, work_order_template, status
      ) VALUES ($1, $2, $3, NOW(), $4, true, true, $5, $6, $7, 'scheduled') RETURNING *',
      [
        testTenantId,
        testVehicleId,
        'Oil Change',
        'medium',
        75,
        JSON.stringify({ type: 'time', interval_value: 90, interval_unit: 'days' }),
        JSON.stringify({ priority: 'medium', estimated_cost: 75, description: 'Regular oil change' })
      ]
    )

    const schedule = scheduleResult.rows[0]

    // Generate work order
    const workOrderId = await generateWorkOrder(schedule)

    // Verify work order was created
    const woResult = await testPool.query('SELECT 
      id,
      tenant_id,
      work_order_number,
      vehicle_id,
      facility_id,
      assigned_technician_id,
      type,
      priority,
      status,
      description,
      odometer_reading,
      engine_hours_reading,
      scheduled_start,
      scheduled_end,
      actual_start,
      actual_end,
      labor_hours,
      labor_cost,
      parts_cost,
      total_cost,
      photos,
      attachments,
      notes,
      created_by,
      created_at,
      updated_at FROM work_orders WHERE id = $1', [workOrderId])
    expect(woResult.rows.length).toBe(1)
    expect(woResult.rows[0].schedule_id).toBe(schedule.id)
    expect(woResult.rows[0].status).toBe('open')

    // Verify schedule was updated
    const updatedSchedule = await testPool.query(
      'SELECT 
      id,
      tenant_id,
      vehicle_id,
      service_type,
      interval_type,
      interval_value,
      last_service_date,
      last_service_odometer,
      last_service_engine_hours,
      next_service_due_date,
      next_service_due_odometer,
      next_service_due_engine_hours,
      is_overdue,
      is_active,
      notes,
      created_at,
      updated_at FROM maintenance_schedules WHERE id = $1',
      [schedule.id]
    )
    expect(updatedSchedule.rows[0].last_work_order_created_at).not.toBeNull()

    // Verify history was created
    const historyResult = await testPool.query(
      'SELECT 
      id,
      schedule_id,
      tenant_id,
      vehicle_id,
      service_type,
      service_date,
      odometer_reading,
      engine_hours_reading,
      work_order_id,
      notes,
      created_at FROM maintenance_schedule_history WHERE schedule_id = $1',
      [schedule.id]
    )
    expect(historyResult.rows.length).toBe(1)
    expect(historyResult.rows[0].status).toBe('success')
  })
})

describe('Recurring Schedule Statistics', () => {
  it('should calculate statistics correctly', async () => {
    // Create multiple schedules
    await testPool.query(
      `INSERT INTO maintenance_schedules (
        tenant_id, vehicle_id, service_type, next_due, priority,
        is_recurring, auto_create_work_order, estimated_cost, status
      ) VALUES
        ($1, $2, 'Service 1', NOW() + INTERVAL '5 days', 'medium', true, true, 100, 'scheduled'),
        ($1, $2, 'Service 2', NOW() + INTERVAL '20 days', 'high', true, true, 200, 'scheduled'),
        ($1, $2, 'Service 3', NOW() - INTERVAL '5 days', 'urgent', true, true, 300, 'scheduled')',
      [testTenantId, testVehicleId]
    )

    const stats = await getRecurringScheduleStats(testTenantId)

    expect(stats.total_recurring).toBe(3)
    expect(stats.total_active).toBe(3)
    expect(stats.due_within_7_days).toBeGreaterThan(0)
    expect(stats.overdue).toBe(1)
    expect(stats.total_estimated_cost_next_30_days).toBeGreaterThan(0)
  })
})

describe('Process Recurring Schedules', () => {
  it('should process all due schedules and generate work orders', async () => {
    // Create a due schedule
    await testPool.query(
      `INSERT INTO maintenance_schedules (
        tenant_id, vehicle_id, service_type, next_due, priority,
        is_recurring, auto_create_work_order, estimated_cost,
        recurrence_pattern, work_order_template, status
      ) VALUES ($1, $2, $3, NOW() - INTERVAL '1 day', $4, true, true, $5, $6, $7, 'scheduled')',
      [
        testTenantId,
        testVehicleId,
        'Scheduled Maintenance',
        'medium',
        100,
        JSON.stringify({ type: 'time', interval_value: 90, interval_unit: 'days' }),
        JSON.stringify({ priority: 'medium', estimated_cost: 100 })
      ]
    )

    // Process schedules
    const results = await processRecurringSchedules(testTenantId, 1)

    expect(results.length).toBe(1)
    expect(results[0].success).toBe(true)
    expect(results[0].work_order_id).toBeDefined()

    // Verify work order was created
    const woCount = await testPool.query(
      'SELECT COUNT(*) FROM work_orders WHERE tenant_id = $1',
      [testTenantId]
    )
    expect(parseInt(woCount.rows[0].count)).toBe(1)
  })
})
