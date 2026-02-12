import express, { Response } from 'express'
import crypto from 'crypto'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

const router = express.Router()
router.use(authenticateJWT)

type UIIncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed'

function mapDbStatusToUI(status: string | null | undefined): UIIncidentStatus {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'open'
  if (s === 'in_progress' || s === 'on_hold') return 'investigating'
  if (s === 'completed') return 'resolved'
  if (s === 'cancelled' || s === 'failed') return 'closed'
  return 'open'
}

function mapUIStatusToDb(status: UIIncidentStatus | string | null | undefined): string {
  const s = String(status || '').toLowerCase()
  if (s === 'open') return 'pending'
  if (s === 'investigating') return 'in_progress'
  if (s === 'resolved') return 'completed'
  if (s === 'closed') return 'cancelled'
  return 'pending'
}

function toTimestamp(date: string | undefined, time: string | undefined): string | null {
  if (!date) return null
  const iso = time ? `${date}T${time}` : `${date}T00:00:00`
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  // store without timezone (DB column is timestamp without time zone)
  return d.toISOString().replace('Z', '')
}

function addStatusHistory(metadata: any, event: { status: string; by?: string; note?: string }) {
  const history = Array.isArray(metadata?.status_history) ? metadata.status_history : []
  history.push({
    id: crypto.randomUUID(),
    status: event.status,
    by: event.by,
    note: event.note,
    timestamp: new Date().toISOString(),
  })
  return { ...metadata, status_history: history }
}

function buildTimeline(incidentRow: any): any[] {
  const metadata = incidentRow.metadata || {}
  const history = Array.isArray(metadata.status_history) ? metadata.status_history : []
  const events = []

  if (incidentRow.created_at) {
    events.push({
      id: `created-${incidentRow.id}`,
      event_type: 'created',
      description: 'Incident created',
      performed_by_name: incidentRow.reported_by_name || undefined,
      timestamp: new Date(incidentRow.created_at).toISOString(),
    })
  }

  for (const h of history) {
    events.push({
      id: h.id || crypto.randomUUID(),
      event_type: 'status_change',
      description: `Status changed to ${h.status}`,
      performed_by_name: h.by,
      timestamp: h.timestamp || new Date().toISOString(),
    })
  }

  const actions = Array.isArray(metadata.actions) ? metadata.actions : []
  for (const a of actions) {
    events.push({
      id: a.id || crypto.randomUUID(),
      event_type: 'action',
      description: a.action_description || a.description || 'Corrective action added',
      performed_by_name: a.created_by_name,
      timestamp: a.created_at || new Date().toISOString(),
    })
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

async function getTenantId(req: AuthRequest): Promise<string> {
  const tenantId = req.user?.tenant_id
  if (!tenantId) {
    throw new Error('Missing tenant_id in auth context')
  }
  return tenantId
}

// GET /api/incident-management
router.get(
  '/',
  requirePermission('incident:view:global'),
  auditLog({ action: 'READ', resourceType: 'incident_management' }),
  async (req: AuthRequest, res: Response) => {
    const tenantId = await getTenantId(req)
    const { severity, status, limit = '200', page = '1' } = req.query as Record<string, string>
    const offset = (Number(page) - 1) * Number(limit)

    const where: string[] = ['i.tenant_id = $1']
    const params: any[] = [tenantId]
    let idx = 2

    if (severity && severity !== 'all') {
      where.push(`i.severity = $${idx}`)
      params.push(severity)
      idx++
    }

    if (status && status !== 'all') {
      // UI uses open/investigating/resolved/closed; DB uses status enum
      where.push(`i.status = $${idx}`)
      params.push(mapUIStatusToDb(status))
      idx++
    }

    const sql = `
      SELECT
        i.*,
        v.number as vehicle_involved,
        d.first_name || ' ' || d.last_name as driver_name,
        u.first_name || ' ' || u.last_name as reported_by_name
      FROM incidents i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN users u ON i.reported_by_id = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY i.incident_date DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `
    params.push(Number(limit), offset)

    const result = await pool.query(sql, params)

    const mapped = result.rows.map((row: any) => {
      const metadata = row.metadata || {}
      const actions = Array.isArray(metadata.actions) ? metadata.actions : []

      return {
        id: row.id,
        incident_title: metadata.incident_title || row.number,
        incident_type: row.type,
        severity: row.severity,
        status: mapDbStatusToUI(row.status),
        incident_date: row.incident_date,
        incident_time: metadata.incident_time,
        location: row.location,
        description: row.description,
        vehicle_id: row.vehicle_id,
        vehicle_involved: row.vehicle_involved,
        driver_id: row.driver_id,
        driver_name: row.driver_name,
        reported_by_name: row.reported_by_name,
        injuries_reported: row.injuries_reported,
        injury_details: metadata.injury_details,
        property_damage: Boolean(metadata.property_damage),
        damage_estimate: metadata.damage_estimate,
        weather_conditions: metadata.weather_conditions,
        road_conditions: metadata.road_conditions,
        police_report_number: row.police_report_number,
        resolution_notes: metadata.resolution_notes,
        root_cause: row.root_cause,
        preventive_measures: metadata.preventive_measures,
        action_count: actions.length,
        photo_count: Array.isArray(row.attachments) ? row.attachments.length : (metadata.photo_count || 0),
        created_at: row.created_at,
        closed_date: metadata.closed_date,
      }
    })

    res.json({ incidents: mapped })
  }
)

// GET /api/incident-management/:id (details)
router.get(
  '/:id',
  requirePermission('incident:view:global'),
  auditLog({ action: 'READ', resourceType: 'incident_management' }),
  async (req: AuthRequest, res: Response) => {
    const tenantId = await getTenantId(req)
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT
        i.*,
        u.first_name || ' ' || u.last_name as reported_by_name
      FROM incidents i
      LEFT JOIN users u ON i.reported_by_id = u.id
      WHERE i.id = $1 AND i.tenant_id = $2
      `,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' })
    }

    const row = result.rows[0]
    const metadata = row.metadata || {}
    const actions = Array.isArray(metadata.actions) ? metadata.actions : []

    // Resolve assigned_to_name from users table when possible.
    const assignedIds = actions.map((a: any) => a.assigned_to).filter(Boolean)
    let assignedNameMap = new Map<string, string>()
    if (assignedIds.length) {
      const users = await pool.query(
        `SELECT id, first_name, last_name FROM users WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
        [tenantId, assignedIds]
      )
      assignedNameMap = new Map(users.rows.map((u: any) => [u.id, `${u.first_name} ${u.last_name}`.trim()]))
    }

    const correctiveActions = actions.map((a: any) => ({
      id: a.id,
      action_type: a.action_type || 'corrective',
      action_description: a.action_description || a.description || '',
      assigned_to_name: a.assigned_to_name || assignedNameMap.get(a.assigned_to) || undefined,
      due_date: a.due_date,
      completed_date: a.completed_date,
      status: a.status || 'pending',
    }))

    res.json({
      incident: {
        id: row.id,
        incident_title: metadata.incident_title || row.number,
        incident_type: row.type,
        severity: row.severity,
        status: mapDbStatusToUI(row.status),
        incident_date: row.incident_date,
        location: row.location,
        description: row.description,
        injuries_reported: row.injuries_reported,
        police_report_number: row.police_report_number,
        root_cause: row.root_cause,
        corrective_actions: row.corrective_actions,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      corrective_actions: correctiveActions,
      timeline: buildTimeline(row),
    })
  }
)

// POST /api/incident-management
router.post(
  '/',
  csrfProtection,
  requirePermission('incident:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'incident_management' }),
  async (req: AuthRequest, res: Response) => {
    const tenantId = await getTenantId(req)
    const userId = req.user!.id
    const body = req.body || {}

    // Generate next incident number per tenant.
    const numberResult = await pool.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
       FROM incidents WHERE tenant_id = $1`,
      [tenantId]
    )
    const number = `INC-${String(numberResult.rows[0].next_num).padStart(4, '0')}`

    const incidentDate = toTimestamp(body.incident_date, body.incident_time)
    if (!incidentDate) {
      return res.status(400).json({ error: 'Invalid incident_date/incident_time' })
    }

    const initialMetadata = addStatusHistory(
      {
        incident_title: body.incident_title,
        incident_time: body.incident_time,
        weather_conditions: body.weather_conditions,
        road_conditions: body.road_conditions,
        injury_details: body.injury_details,
        property_damage: body.property_damage,
        damage_estimate: body.damage_estimate,
        preventive_measures: body.preventive_measures,
        resolution_notes: body.resolution_notes,
        actions: [],
        created_via: 'incident-management-ui',
      },
      { status: 'created', by: userId }
    )

    const dbStatus = mapUIStatusToDb(body.status || 'open')

    const result = await pool.query(
      `
      INSERT INTO incidents (
        tenant_id,
        number,
        vehicle_id,
        driver_id,
        type,
        severity,
        status,
        incident_date,
        location,
        description,
        injuries_reported,
        police_report_number,
        reported_by_id,
        root_cause,
        corrective_actions,
        metadata
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )
      RETURNING *
      `,
      [
        tenantId,
        number,
        body.vehicle_id || null,
        body.driver_id || null,
        body.incident_type || body.type || 'other',
        body.severity || 'medium',
        dbStatus,
        incidentDate,
        body.location || null,
        body.description || '',
        Boolean(body.injuries_reported),
        body.police_report_number || null,
        userId,
        body.root_cause || null,
        body.corrective_actions || null,
        JSON.stringify(initialMetadata),
      ]
    )

    const row = result.rows[0]
    res.status(201).json({
      incident: {
        id: row.id,
        incident_title: body.incident_title || number,
        incident_type: row.type,
        severity: row.severity,
        status: mapDbStatusToUI(row.status),
        incident_date: row.incident_date,
        location: row.location,
        description: row.description,
        created_at: row.created_at,
      },
    })
  }
)

// PUT /api/incident-management/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('incident:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'incident_management' }),
  async (req: AuthRequest, res: Response) => {
    const tenantId = await getTenantId(req)
    const userId = req.user!.id
    const { id } = req.params
    const body = req.body || {}

    const incidentDate = body.incident_date ? toTimestamp(body.incident_date, body.incident_time) : null
    const dbStatus = body.status ? mapUIStatusToDb(body.status) : null

    const current = await pool.query(
      `SELECT id, status, metadata FROM incidents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    if (current.rows.length === 0) return res.status(404).json({ error: 'Incident not found' })

    const currentRow = current.rows[0]
    let metadata = currentRow.metadata || {}
    if (body.incident_title !== undefined) metadata.incident_title = body.incident_title
    if (body.incident_time !== undefined) metadata.incident_time = body.incident_time
    if (body.weather_conditions !== undefined) metadata.weather_conditions = body.weather_conditions
    if (body.road_conditions !== undefined) metadata.road_conditions = body.road_conditions
    if (body.injury_details !== undefined) metadata.injury_details = body.injury_details
    if (body.property_damage !== undefined) metadata.property_damage = body.property_damage
    if (body.damage_estimate !== undefined) metadata.damage_estimate = body.damage_estimate
    if (body.resolution_notes !== undefined) metadata.resolution_notes = body.resolution_notes
    if (body.preventive_measures !== undefined) metadata.preventive_measures = body.preventive_measures

    if (dbStatus && dbStatus !== currentRow.status) {
      metadata = addStatusHistory(metadata, { status: dbStatus, by: userId })
    }

    const updateResult = await pool.query(
      `
      UPDATE incidents
      SET
        vehicle_id = COALESCE($3, vehicle_id),
        driver_id = COALESCE($4, driver_id),
        type = COALESCE($5, type),
        severity = COALESCE($6, severity),
        status = COALESCE($7::status, status),
        incident_date = COALESCE($8::timestamp, incident_date),
        location = COALESCE($9, location),
        description = COALESCE($10, description),
        injuries_reported = COALESCE($11::boolean, injuries_reported),
        police_report_number = COALESCE($12, police_report_number),
        root_cause = COALESCE($13, root_cause),
        corrective_actions = COALESCE($14, corrective_actions),
        metadata = $15::jsonb,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
      `,
      [
        id,
        tenantId,
        body.vehicle_id ?? null,
        body.driver_id ?? null,
        body.incident_type ?? body.type ?? null,
        body.severity ?? null,
        dbStatus ?? null,
        incidentDate,
        body.location ?? null,
        body.description ?? null,
        body.injuries_reported ?? null,
        body.police_report_number ?? null,
        body.root_cause ?? null,
        body.corrective_actions ?? null,
        JSON.stringify(metadata),
      ]
    )

    res.json({
      incident: {
        id: updateResult.rows[0].id,
        incident_title: metadata.incident_title || updateResult.rows[0].number,
        incident_type: updateResult.rows[0].type,
        severity: updateResult.rows[0].severity,
        status: mapDbStatusToUI(updateResult.rows[0].status),
        incident_date: updateResult.rows[0].incident_date,
        location: updateResult.rows[0].location,
        description: updateResult.rows[0].description,
        updated_at: updateResult.rows[0].updated_at,
      },
    })
  }
)

// POST /api/incident-management/:id/actions
router.post(
  '/:id/actions',
  csrfProtection,
  requirePermission('incident:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'incident_management_actions' }),
  async (req: AuthRequest, res: Response) => {
    const tenantId = await getTenantId(req)
    const userId = req.user!.id
    const { id } = req.params
    const body = req.body || {}

    const action = {
      id: crypto.randomUUID(),
      action_type: body.action_type || 'corrective',
      action_description: body.action_description || '',
      assigned_to: body.assigned_to || null,
      due_date: body.due_date || null,
      completed_date: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      created_by: userId,
    }

    const result = await pool.query(
      `
      UPDATE incidents
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{actions}',
        COALESCE(metadata->'actions', '[]'::jsonb) || $3::jsonb,
        true
      ),
      updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, metadata
      `,
      [id, tenantId, JSON.stringify([action])]
    )

    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' })
    res.status(201).json({ action })
  }
)

// POST /api/incident-management/:id/close
router.post(
  '/:id/close',
  csrfProtection,
  requirePermission('incident:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'incident_management_close' }),
  async (req: AuthRequest, res: Response) => {
    const tenantId = await getTenantId(req)
    const userId = req.user!.id
    const { id } = req.params
    const body = req.body || {}

    const current = await pool.query(
      `SELECT id, metadata FROM incidents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    if (current.rows.length === 0) return res.status(404).json({ error: 'Incident not found' })

    let metadata = current.rows[0].metadata || {}
    metadata.resolution_notes = body.resolution_notes || metadata.resolution_notes
    metadata.preventive_measures = body.preventive_measures || metadata.preventive_measures
    metadata.closed_date = new Date().toISOString()
    metadata = addStatusHistory(metadata, { status: 'completed', by: userId, note: 'Closed via UI' })

    const updateResult = await pool.query(
      `
      UPDATE incidents
      SET
        status = 'completed'::status,
        root_cause = COALESCE($3, root_cause),
        metadata = $4::jsonb,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, status, updated_at
      `,
      [id, tenantId, body.root_cause || null, JSON.stringify(metadata)]
    )

    res.json({
      id: updateResult.rows[0].id,
      status: mapDbStatusToUI(updateResult.rows[0].status),
      updated_at: updateResult.rows[0].updated_at,
    })
  }
)

export default router

