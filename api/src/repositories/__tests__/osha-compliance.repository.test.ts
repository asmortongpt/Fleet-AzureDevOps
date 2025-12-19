import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

import { pool } from '../../db'
import { OSHAComplianceRepository } from '../osha-compliance.repository'

describe('OSHAComplianceRepository', () => {
  let repository: OSHAComplianceRepository
  const testTenantId = 'test-tenant-osha-compliance'
  let testDriverId: number
  let testVehicleId: number

  beforeAll(async () => {
    repository = new OSHAComplianceRepository()

    // Create test tenant data
    const driverResult = await pool.query(
      `INSERT INTO drivers (first_name, last_name, tenant_id, status, license_number)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Test', 'Driver', testTenantId, 'active', 'DL123456']
    )
    testDriverId = driverResult.rows[0].id

    const vehicleResult = await pool.query(
      `INSERT INTO vehicles (unit_number, make, model, year, tenant_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['UNIT-TEST-001', 'Ford', 'F-150', 2023, testTenantId, 'active']
    )
    testVehicleId = vehicleResult.rows[0].id
  })

  afterAll(async () => {
    // Clean up test data
    await pool.query(`DELETE FROM osha_300_log WHERE employee_id = $1`, [testDriverId])
    await pool.query(`DELETE FROM vehicle_safety_inspections WHERE driver_id = $1`, [testDriverId])
    await pool.query(`DELETE FROM safety_training_records WHERE employee_id = $1`, [testDriverId])
    await pool.query(`DELETE FROM accident_investigations WHERE driver_id = $1`, [testDriverId])
    await pool.query(`DELETE FROM drivers WHERE id = $1`, [testDriverId])
    await pool.query(`DELETE FROM vehicles WHERE id = $1`, [testVehicleId])
  })

  describe('OSHA 300 Log', () => {
    it('should create and retrieve OSHA 300 log entry', async () => {
      const data = {
        employee_id: testDriverId,
        vehicle_id: testVehicleId,
        date_of_injury: new Date('2024-01-15'),
        case_number: 'CASE-001',
        description_of_injury: 'Test injury description',
        injury_classification: 'Minor',
        case_status: 'Open'
      }

      const created = await repository.createOSHA300Log(data)
      expect(created).toBeDefined()
      expect(created.case_number).toBe('CASE-001')

      const retrieved = await repository.findOSHA300LogById(created.id, testTenantId)
      expect(retrieved).toBeDefined()
      expect(retrieved.case_number).toBe('CASE-001')

      // Clean up
      await pool.query(`DELETE FROM osha_300_log WHERE id = $1`, [created.id])
    })

    it('should filter OSHA 300 log by year', async () => {
      const data = {
        employee_id: testDriverId,
        date_of_injury: new Date('2024-01-15'),
        case_number: 'CASE-002',
        description_of_injury: 'Test injury',
        injury_classification: 'Minor',
        case_status: 'Open'
      }

      const created = await repository.createOSHA300Log(data)

      const result = await repository.findOSHA300Log(testTenantId, { year: '2024' })
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM osha_300_log WHERE id = $1`, [created.id])
    })

    it('should update OSHA 300 log entry', async () => {
      const data = {
        employee_id: testDriverId,
        date_of_injury: new Date('2024-01-15'),
        case_number: 'CASE-003',
        description_of_injury: 'Test injury',
        injury_classification: 'Minor',
        case_status: 'Open'
      }

      const created = await repository.createOSHA300Log(data)

      const updated = await repository.updateOSHA300Log(
        created.id,
        { case_status: 'Closed' },
        testDriverId
      )

      expect(updated).toBeDefined()
      expect(updated.case_status).toBe('Closed')

      // Clean up
      await pool.query(`DELETE FROM osha_300_log WHERE id = $1`, [created.id])
    })
  })

  describe('Safety Inspections', () => {
    it('should create and retrieve safety inspection', async () => {
      const data = {
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        inspection_date: new Date('2024-01-15'),
        inspection_type: 'Pre-Trip',
        overall_status: 'Pass'
      }

      const created = await repository.createSafetyInspection(data)
      expect(created).toBeDefined()
      expect(created.overall_status).toBe('Pass')

      const result = await repository.findSafetyInspections(testTenantId, {
        vehicle_id: testVehicleId
      })
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM vehicle_safety_inspections WHERE id = $1`, [created.id])
    })

    it('should filter safety inspections by status', async () => {
      const data = {
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        inspection_date: new Date('2024-01-15'),
        inspection_type: 'Pre-Trip',
        overall_status: 'Fail'
      }

      const created = await repository.createSafetyInspection(data)

      const result = await repository.findSafetyInspections(testTenantId, {
        status: 'Fail'
      })
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM vehicle_safety_inspections WHERE id = $1`, [created.id])
    })
  })

  describe('Training Records', () => {
    it('should create and retrieve training record', async () => {
      const data = {
        employee_id: testDriverId,
        training_type: 'Safety Training',
        training_date: new Date('2024-01-15'),
        passed: true
      }

      const created = await repository.createTrainingRecord(data)
      expect(created).toBeDefined()
      expect(created.training_type).toBe('Safety Training')

      const result = await repository.findTrainingRecords(testTenantId, {
        employee_id: testDriverId
      })
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM safety_training_records WHERE id = $1`, [created.id])
    })

    it('should filter training records by type', async () => {
      const data = {
        employee_id: testDriverId,
        training_type: 'Hazmat Certification',
        training_date: new Date('2024-01-15'),
        passed: true
      }

      const created = await repository.createTrainingRecord(data)

      const result = await repository.findTrainingRecords(testTenantId, {
        training_type: 'Hazmat Certification'
      })
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM safety_training_records WHERE id = $1`, [created.id])
    })
  })

  describe('Accident Investigations', () => {
    it('should create and retrieve accident investigation', async () => {
      const data = {
        accident_date: new Date('2024-01-15'),
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        severity: 'Minor',
        description: 'Test accident description',
        investigation_status: 'Open'
      }

      const created = await repository.createAccidentInvestigation(data)
      expect(created).toBeDefined()
      expect(created.severity).toBe('Minor')

      const result = await repository.findAccidentInvestigations(testTenantId, {})
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM accident_investigations WHERE id = $1`, [created.id])
    })

    it('should filter accident investigations by severity', async () => {
      const data = {
        accident_date: new Date('2024-01-15'),
        vehicle_id: testVehicleId,
        driver_id: testDriverId,
        severity: 'Severe',
        description: 'Test severe accident',
        investigation_status: 'Open'
      }

      const created = await repository.createAccidentInvestigation(data)

      const result = await repository.findAccidentInvestigations(testTenantId, {
        severity: 'Severe'
      })
      expect(result.data.length).toBeGreaterThan(0)

      // Clean up
      await pool.query(`DELETE FROM accident_investigations WHERE id = $1`, [created.id])
    })
  })

  describe('Dashboard Statistics', () => {
    it('should retrieve dashboard statistics', async () => {
      // Create test data
      const oshaLog = await repository.createOSHA300Log({
        employee_id: testDriverId,
        date_of_injury: new Date(),
        case_number: 'DASH-001',
        description_of_injury: 'Test',
        injury_classification: 'Minor',
        case_status: 'Open',
        days_away_from_work: 2
      })

      const stats = await repository.getDashboardStats(testTenantId)

      expect(stats).toBeDefined()
      expect(stats.injuries).toBeDefined()
      expect(stats.inspections).toBeDefined()
      expect(stats.certifications).toBeDefined()
      expect(stats.accidents).toBeDefined()
      expect(Array.isArray(stats.accidents)).toBe(true)

      // Clean up
      await pool.query(`DELETE FROM osha_300_log WHERE id = $1`, [oshaLog.id])
    })
  })

  describe('Tenant Isolation', () => {
    it('should not retrieve data from other tenants', async () => {
      const otherTenantId = 'other-tenant-osha'

      const data = {
        employee_id: testDriverId,
        date_of_injury: new Date(),
        case_number: 'ISOLATED-001',
        description_of_injury: 'Test',
        injury_classification: 'Minor',
        case_status: 'Open'
      }

      const created = await repository.createOSHA300Log(data)

      // Try to retrieve with different tenant ID
      const retrieved = await repository.findOSHA300LogById(created.id, otherTenantId)
      expect(retrieved).toBeNull()

      // Clean up
      await pool.query(`DELETE FROM osha_300_log WHERE id = $1`, [created.id])
    })
  })
})
