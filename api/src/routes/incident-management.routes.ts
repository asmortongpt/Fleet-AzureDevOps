/**
 * Incident Management Routes
 * Comprehensive incident tracking, investigation, and resolution
 *
 * Features:
 * - Incident reporting and classification
 * - Severity levels and escalation
 * - Investigation workflow
 * - Root cause analysis
 * - Corrective actions tracking
 * - OSHA reporting integration
 * - Timeline tracking
 * - Photo and document attachments
 */

import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth'
import pool from '../config/database'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()
router.use(authenticateJWT)

// Get all incidents
router.get('/', requirePermission('safety_incident:view:global'), async (req: AuthRequest, res) => {
  try {
    const { status, severity, incident_type, date_from, date_to } = req.query
    const tenantId = req.user?.tenant_id

    let query = `
      SELECT
        i.*,
        u_reported.first_name || ' ' || u_reported.last_name as reported_by_name,
        u_assigned.first_name || ' ' || u_assigned.last_name as assigned_to_name,
        v.vehicle_number as vehicle_involved,
        d.first_name || ' ' || d.last_name as driver_name,
        COUNT(DISTINCT ia.id) as action_count,
        COUNT(DISTINCT iph.id) as photo_count
      FROM incidents i
      LEFT JOIN users u_reported ON i.reported_by = u_reported.id
      LEFT JOIN users u_assigned ON i.assigned_investigator = u_assigned.id
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN incident_actions ia ON i.id = ia.incident_id
      LEFT JOIN incident_photos iph ON i.id = iph.incident_id
      WHERE i.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (status) {
      paramCount++
      query += ` AND i.status = $${paramCount}`
      params.push(status)
    }
    if (severity) {
      paramCount++
      query += ` AND i.severity = $${paramCount}`
      params.push(severity)
    }
    if (incident_type) {
      paramCount++
      query += ` AND i.incident_type = $${paramCount}`
      params.push(incident_type)
    }
    if (date_from) {
      paramCount++
      query += ` AND i.incident_date >= $${paramCount}`
      params.push(date_from)
    }
    if (date_to) {
      paramCount++
      query += ` AND i.incident_date <= $${paramCount}`
      params.push(date_to)
    }

    query += ` GROUP BY i.id, u_reported.first_name, u_reported.last_name, u_assigned.first_name, u_assigned.last_name, v.vehicle_number, d.first_name, d.last_name`
    query += ` ORDER BY
      CASE i.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      i.incident_date DESC`

    const result = await pool.query(query, params)

    res.json({
      incidents: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching incidents:', error)
    res.status(500).json({ error: 'Failed to fetch incidents' })
  }
})

// Get incident by ID with full details
router.get('/:id', requirePermission('safety_incident:view:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const [incident, actions, timeline, witnesses] = await Promise.all([
      pool.query(
        `SELECT
          i.*,
          u_reported.first_name || ' ' || u_reported.last_name as reported_by_name,
          u_assigned.first_name || ' ' || u_assigned.last_name as assigned_to_name,
          v.vehicle_number as vehicle_involved,
          d.first_name || ' ' || d.last_name as driver_name
        FROM incidents i
        LEFT JOIN users u_reported ON i.reported_by = u_reported.id
        LEFT JOIN users u_assigned ON i.assigned_investigator = u_assigned.id
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        LEFT JOIN drivers d ON i.driver_id = d.id
        WHERE i.id = $1 AND i.tenant_id = $2',
        [id, tenantId]
      ),
      pool.query(
        `SELECT 
      id,
      incident_id,
      action_type,
      action_description,
      assigned_to,
      due_date,
      completed_date,
      status,
      notes,
      created_by,
      created_at FROM incident_actions WHERE incident_id = $1 ORDER BY created_at`,
        [id]
      ),
      pool.query(
        `SELECT 
      id,
      incident_id,
      event_type,
      description,
      performed_by,
      timestamp FROM incident_timeline WHERE incident_id = $1 ORDER BY timestamp`,
        [id]
      ),
      pool.query(
        `SELECT 
      id,
      incident_id,
      witness_name,
      contact_info,
      statement,
      created_at FROM incident_witnesses WHERE incident_id = $1',
        [id]
      )
    ])

    if (incident.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' })
    }

    res.json({
      incident: incident.rows[0],
      corrective_actions: actions.rows,
      timeline: timeline.rows,
      witnesses: witnesses.rows
    })
  } catch (error) {
    console.error('Error fetching incident:', error)
    res.status(500).json({ error: 'Failed to fetch incident' })
  }
})

// Create incident
router.post('/', requirePermission('safety_incident:create:global'), async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      incident_title, incident_type, severity, incident_date, incident_time,
      location, description, vehicle_id, driver_id, injuries_reported,
      injury_details, property_damage, damage_estimate, weather_conditions,
      road_conditions, witnesses, immediate_actions, police_report_number
    } = req.body

    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await client.query(
      `INSERT INTO incidents (
        tenant_id, incident_title, incident_type, severity, status,
        incident_date, incident_time, location, description,
        vehicle_id, driver_id, injuries_reported, injury_details,
        property_damage, damage_estimate, weather_conditions,
        road_conditions, police_report_number, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        tenantId, incident_title, incident_type, severity, 'open',
        incident_date, incident_time, location, description,
        vehicle_id, driver_id, injuries_reported, injury_details,
        property_damage, damage_estimate, weather_conditions,
        road_conditions, police_report_number, userId
      ]
    )

    const incidentId = result.rows[0].id

    // Add witnesses
    if (witnesses && witnesses.length > 0) {
      for (const witness of witnesses) {
        await client.query(
          `INSERT INTO incident_witnesses (incident_id, witness_name, contact_info, statement)
           VALUES ($1, $2, $3, $4)`,
          [incidentId, witness.name, witness.contact, witness.statement]
        )
      }
    }

    // Add timeline entry
    await client.query(
      `INSERT INTO incident_timeline (incident_id, event_type, description, performed_by)
       VALUES ($1, $2, $3, $4)`,
      [incidentId, 'created', 'Incident reported', userId]
    )

    await client.query('COMMIT')

    res.status(201).json({
      incident: result.rows[0],
      message: 'Incident reported successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating incident:', error)
    res.status(500).json({ error: 'Failed to create incident' })
  } finally {
    client.release()
  }
})

// Update incident
router.put('/:id', requirePermission('safety_incident:update:global'), async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const updates = req.body
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'tenant_id') {
        setClauses.push(`${key} = $${paramCount}`)
        values.push(updates[key])
        paramCount++
      }
    })

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(id, tenantId)

    const result = await client.query(
      `UPDATE incidents
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Incident not found' })
    }

    // Add timeline entry
    const changedFields = Object.keys(updates).join(', ')
    await client.query(
      `INSERT INTO incident_timeline (incident_id, event_type, description, performed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, 'updated', 'Updated: ${changedFields}`, userId]
    )

    await client.query('COMMIT')

    res.json({
      incident: result.rows[0],
      message: 'Incident updated successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error updating incident:', error)
    res.status(500).json({ error: 'Failed to update incident' })
  } finally {
    client.release()
  }
})

// Add corrective action
router.post('/:id/actions', requirePermission('safety_incident:update:global'), async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { action_description, assigned_to, due_date, action_type } = req.body
    const userId = req.user?.id

    const result = await client.query(
      `INSERT INTO incident_actions (
        incident_id, action_type, action_description, assigned_to, due_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [id, action_type, action_description, assigned_to, due_date, userId]
    )

    // Add timeline entry
    await client.query(
      `INSERT INTO incident_timeline (incident_id, event_type, description, performed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, 'action_added', 'Corrective action assigned: ${action_description}`, userId]
    )

    await client.query('COMMIT')

    res.status(201).json({
      action: result.rows[0],
      message: 'Corrective action added successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error adding action:', error)
    res.status(500).json({ error: 'Failed to add corrective action' })
  } finally {
    client.release()
  }
})

// Close incident
router.post('/:id/close', requirePermission('safety_incident:update:global'), async (req: AuthRequest, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { resolution_notes, root_cause, preventive_measures } = req.body
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const result = await client.query(
      `UPDATE incidents
       SET status = 'closed',
           closed_date = NOW(),
           resolution_notes = $1,
           root_cause = $2,
           preventive_measures = $3,
           closed_by = $4
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [resolution_notes, root_cause, preventive_measures, userId, id, tenantId]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Incident not found' })
    }

    // Add timeline entry
    await client.query(
      `INSERT INTO incident_timeline (incident_id, event_type, description, performed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, 'closed', 'Incident investigation completed and closed', userId]
    )

    await client.query('COMMIT')

    res.json({
      incident: result.rows[0],
      message: 'Incident closed successfully'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error closing incident:', error)
    res.status(500).json({ error: 'Failed to close incident' })
  } finally {
    client.release()
  }
})

// Get incident analytics
router.get('/analytics/summary', requirePermission('safety_incident:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const [statusCounts, severityCounts, typeCounts, monthlyTrend] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) as count FROM incidents WHERE tenant_id = $1 GROUP BY status`,
        [tenantId]
      ),
      pool.query(
        `SELECT severity, COUNT(*) as count FROM incidents WHERE tenant_id = $1 GROUP BY severity`,
        [tenantId]
      ),
      pool.query(
        `SELECT incident_type, COUNT(*) as count FROM incidents WHERE tenant_id = $1 GROUP BY incident_type`,
        [tenantId]
      ),
      pool.query(
        `SELECT
           DATE_TRUNC('month', incident_date) as month,
           COUNT(*) as count
         FROM incidents
         WHERE tenant_id = $1 AND incident_date >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', incident_date)
         ORDER BY month`,
        [tenantId]
      )
    ])

    res.json({
      by_status: statusCounts.rows,
      by_severity: severityCounts.rows,
      by_type: typeCounts.rows,
      monthly_trend: monthlyTrend.rows
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

export default router
