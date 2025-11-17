/**
 * Incident Management API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/server'
import {
  generateTestToken,
  cleanupDatabase,
  seedTestDatabase,
  closeTestDatabase,
  generateTestIncident,
  testPool
} from '../setup'

describe('Incident Management API', () => {
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
    await testPool.query('DELETE FROM incident_timeline WHERE 1=1')
    await testPool.query('DELETE FROM incident_witnesses WHERE 1=1')
    await testPool.query('DELETE FROM incident_actions WHERE 1=1')
    await testPool.query('DELETE FROM incidents WHERE 1=1')
  })

  describe('POST /api/incident-management', () => {
    it('should create a new incident', async () => {
      const incidentData = generateTestIncident()

      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData)
        .expect(201)

      expect(response.body.incident).toBeDefined()
      expect(response.body.incident.incident_title).toBe(incidentData.incident_title)
      expect(response.body.incident.severity).toBe(incidentData.severity)
      expect(response.body.message).toBe('Incident reported successfully')
    })

    it('should create incident with witnesses', async () => {
      const incidentData = {
        ...generateTestIncident(),
        witnesses: [
          { name: 'John Doe', contact: 'john@example.com', statement: 'Witness statement 1' },
          { name: 'Jane Smith', contact: 'jane@example.com', statement: 'Witness statement 2' }
        ]
      }

      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData)
        .expect(201)

      const incidentId = response.body.incident.id

      const witnessResult = await testPool.query(
        'SELECT * FROM incident_witnesses WHERE incident_id = $1',
        [incidentId]
      )

      expect(witnessResult.rows.length).toBe(2)
    })

    it('should create timeline entry on creation', async () => {
      const incidentData = generateTestIncident()

      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData)
        .expect(201)

      const incidentId = response.body.incident.id

      const timelineResult = await testPool.query(
        'SELECT * FROM incident_timeline WHERE incident_id = $1',
        [incidentId]
      )

      expect(timelineResult.rows.length).toBe(1)
      expect(timelineResult.rows[0].event_type).toBe('created')
    })

    it('should require authentication', async () => {
      await request(app)
        .post('/api/incident-management')
        .send(generateTestIncident())
        .expect(401)
    })
  })

  describe('GET /api/incident-management', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident({ severity: 'critical', status: 'open' }))

      await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident({ severity: 'low', status: 'closed' }))

      await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident({ severity: 'high', status: 'investigating' }))
    })

    it('should retrieve all incidents', async () => {
      const response = await request(app)
        .get('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.incidents).toBeDefined()
      expect(response.body.incidents.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter incidents by status', async () => {
      const response = await request(app)
        .get('/api/incident-management?status=open')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.incidents.forEach((incident: any) => {
        expect(incident.status).toBe('open')
      })
    })

    it('should filter incidents by severity', async () => {
      const response = await request(app)
        .get('/api/incident-management?severity=critical')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.incidents.forEach((incident: any) => {
        expect(incident.severity).toBe('critical')
      })
    })

    it('should sort incidents by severity', async () => {
      const response = await request(app)
        .get('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Critical incidents should come first
      const firstIncident = response.body.incidents[0]
      expect(firstIncident.severity).toBe('critical')
    })

    it('should enforce multi-tenant isolation', async () => {
      const response = await request(app)
        .get('/api/incident-management')
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(200)

      const firstTenantIncidents = response.body.incidents.filter(
        (i: any) => i.tenant_id === 'test-tenant-id'
      )
      expect(firstTenantIncidents.length).toBe(0)
    })
  })

  describe('GET /api/incident-management/:id', () => {
    let testIncidentId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident())

      testIncidentId = response.body.incident.id
    })

    it('should retrieve incident with full details', async () => {
      const response = await request(app)
        .get(`/api/incident-management/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.incident).toBeDefined()
      expect(response.body.incident.id).toBe(testIncidentId)
      expect(response.body.corrective_actions).toBeDefined()
      expect(response.body.timeline).toBeDefined()
      expect(response.body.witnesses).toBeDefined()
    })

    it('should return 404 for non-existent incident', async () => {
      await request(app)
        .get('/api/incident-management/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should not allow access to other tenant incidents', async () => {
      await request(app)
        .get(`/api/incident-management/${testIncidentId}`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .expect(404)
    })
  })

  describe('PUT /api/incident-management/:id', () => {
    let testIncidentId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident())

      testIncidentId = response.body.incident.id
    })

    it('should update incident successfully', async () => {
      const updates = {
        status: 'investigating',
        severity: 'high',
        assigned_investigator: 'test-user-id'
      }

      const response = await request(app)
        .put(`/api/incident-management/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200)

      expect(response.body.incident.status).toBe(updates.status)
      expect(response.body.incident.severity).toBe(updates.severity)
    })

    it('should create timeline entry on update', async () => {
      await request(app)
        .put(`/api/incident-management/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'investigating' })
        .expect(200)

      const timelineResult = await testPool.query(
        'SELECT * FROM incident_timeline WHERE incident_id = $1 AND event_type = $2',
        [testIncidentId, 'updated']
      )

      expect(timelineResult.rows.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/incident-management/:id/actions', () => {
    let testIncidentId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident())

      testIncidentId = response.body.incident.id
    })

    it('should add corrective action to incident', async () => {
      const response = await request(app)
        .post(`/api/incident-management/${testIncidentId}/actions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action_description: 'Repair damage',
          action_type: 'corrective',
          assigned_to: 'test-user-id',
          due_date: '2024-12-31'
        })
        .expect(201)

      expect(response.body.action).toBeDefined()
      expect(response.body.action.action_description).toBe('Repair damage')
    })

    it('should create timeline entry for action', async () => {
      await request(app)
        .post(`/api/incident-management/${testIncidentId}/actions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action_description: 'Review policies',
          action_type: 'preventive'
        })

      const timelineResult = await testPool.query(
        'SELECT * FROM incident_timeline WHERE incident_id = $1 AND event_type = $2',
        [testIncidentId, 'action_added']
      )

      expect(timelineResult.rows.length).toBe(1)
    })
  })

  describe('POST /api/incident-management/:id/close', () => {
    let testIncidentId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident())

      testIncidentId = response.body.incident.id
    })

    it('should close incident successfully', async () => {
      const response = await request(app)
        .post(`/api/incident-management/${testIncidentId}/close`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution_notes: 'Incident resolved',
          root_cause: 'Driver error',
          preventive_measures: 'Additional training required'
        })
        .expect(200)

      expect(response.body.incident.status).toBe('closed')
      expect(response.body.incident.resolution_notes).toBe('Incident resolved')
      expect(response.body.incident.closed_date).toBeDefined()
    })

    it('should create timeline entry for closure', async () => {
      await request(app)
        .post(`/api/incident-management/${testIncidentId}/close`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resolution_notes: 'Completed investigation'
        })

      const timelineResult = await testPool.query(
        'SELECT * FROM incident_timeline WHERE incident_id = $1 AND event_type = $2',
        [testIncidentId, 'closed']
      )

      expect(timelineResult.rows.length).toBe(1)
    })

    it('should not allow closure of other tenant incidents', async () => {
      await request(app)
        .post(`/api/incident-management/${testIncidentId}/close`)
        .set('Authorization', `Bearer ${secondTenantToken}`)
        .send({ resolution_notes: 'Test' })
        .expect(404)
    })
  })

  describe('GET /api/incident-management/analytics/summary', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident({ status: 'open', severity: 'critical', incident_type: 'accident' }))

      await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident({ status: 'closed', severity: 'low', incident_type: 'near_miss' }))

      await request(app)
        .post('/api/incident-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestIncident({ status: 'investigating', severity: 'high', incident_type: 'accident' }))
    })

    it('should return incident analytics', async () => {
      const response = await request(app)
        .get('/api/incident-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.by_status).toBeDefined()
      expect(response.body.by_severity).toBeDefined()
      expect(response.body.by_type).toBeDefined()
      expect(response.body.monthly_trend).toBeDefined()
    })

    it('should provide accurate counts by severity', async () => {
      const response = await request(app)
        .get('/api/incident-management/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const criticalCount = response.body.by_severity.find((s: any) => s.severity === 'critical')
      const highCount = response.body.by_severity.find((s: any) => s.severity === 'high')

      expect(parseInt(criticalCount?.count || 0)).toBeGreaterThanOrEqual(1)
      expect(parseInt(highCount?.count || 0)).toBeGreaterThanOrEqual(1)
    })
  })
})
