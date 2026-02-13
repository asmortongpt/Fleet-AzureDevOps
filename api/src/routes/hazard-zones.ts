import express, { Response } from 'express'

import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'

const router = express.Router()

router.use(authenticateJWT)

// GET /api/hazard-zones
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    const result = await pool.query(
      `SELECT id, name, type, center_lat, center_lng, radius, metadata, created_at, updated_at
       FROM geofences
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY created_at DESC
       LIMIT 500`,
      [tenantId]
    )

    const zones = result.rows.map((row: any) => {
      const metadata = row.metadata || {}
      const hazardType = metadata.hazard_type || 'environmental'
      const severity = metadata.severity || 'medium'

      return {
        id: row.id,
        name: row.name,
        type: hazardType,
        severity,
        location: {
          lat: Number(row.center_lat),
          lng: Number(row.center_lng),
          address: metadata.address
        },
        radius: row.radius ? Number(row.radius) : 0,
        restrictions: metadata.restrictions || [],
        activeFrom: metadata.active_from || row.created_at,
        activeTo: metadata.active_to,
        description: metadata.description,
        createdBy: metadata.created_by,
        createdDate: row.created_at,
        lastUpdated: row.updated_at
      }
    })

    res.json({ data: zones })
  } catch (error: unknown) {
    return res.status(500).json({ error: 'Failed to fetch hazard zones' })
  }
})

function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// GET /api/hazard-zones/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params

    const result = await pool.query(
      `SELECT id, name, type, center_lat, center_lng, radius, metadata, created_at, updated_at
       FROM geofences
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Hazard zone not found')
    }

    const row = result.rows[0]
    const metadata = row.metadata || {}
    const hazardType = metadata.hazard_type || 'environmental'
    const severity = metadata.severity || 'medium'

    res.json({
      data: {
        id: row.id,
        name: row.name,
        type: hazardType,
        severity,
        location: {
          lat: Number(row.center_lat),
          lng: Number(row.center_lng),
          address: metadata.address
        },
        radius: row.radius ? Number(row.radius) : 0,
        restrictions: metadata.restrictions || [],
        activeFrom: metadata.active_from || row.created_at,
        activeTo: metadata.active_to,
        description: metadata.description,
        createdBy: metadata.created_by,
        createdDate: row.created_at,
        lastUpdated: row.updated_at
      }
    })
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to fetch hazard zone' })
  }
})

// GET /api/hazard-zones/:id/affected-vehicles
router.get('/:id/affected-vehicles', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params

    const zoneResult = await pool.query(
      `SELECT center_lat, center_lng, radius, metadata
       FROM geofences
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    if (zoneResult.rows.length === 0) {
      throw new NotFoundError('Hazard zone not found')
    }

    const zone = zoneResult.rows[0]
    const radius = zone.radius ? Number(zone.radius) : 0

    const vehiclesResult = await pool.query(
      `SELECT v.id,
              v.vehicle_number,
              v.make,
              v.model,
              v.latitude,
              v.longitude,
              v.assigned_driver_id,
              d.first_name,
              d.last_name
       FROM vehicles v
       LEFT JOIN drivers d ON v.assigned_driver_id = d.id
       WHERE v.tenant_id = $1
         AND v.latitude IS NOT NULL
         AND v.longitude IS NOT NULL`,
      [tenantId]
    )

    const affected = vehiclesResult.rows
      .map((vehicle: any) => {
        const distance = haversineDistanceMeters(
          Number(zone.center_lat),
          Number(zone.center_lng),
          Number(vehicle.latitude),
          Number(vehicle.longitude)
        )
        return {
          vehicle,
          distance
        }
      })
      .filter((item) => radius > 0 && item.distance <= radius)
      .map((item) => ({
        id: item.vehicle.id,
        vehicle_id: item.vehicle.id,
        vehicle_name: item.vehicle.vehicle_number || `${item.vehicle.make} ${item.vehicle.model}`,
        driver_id: item.vehicle.assigned_driver_id,
        driver_name: item.vehicle.first_name ? `${item.vehicle.first_name} ${item.vehicle.last_name || ''}`.trim() : undefined,
        last_entry: null,
        entry_count: 0,
        total_time_in_zone: 0
      }))

    res.json({ data: affected })
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to fetch affected vehicles' })
  }
})

// GET /api/hazard-zones/:id/events
router.get('/:id/events', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params

    const existsResult = await pool.query(
      `SELECT to_regclass('public.geofence_events') as table_name`
    )
    if (!existsResult.rows[0]?.table_name) {
      return res.json({ data: [] })
    }

    const eventsResult = await pool.query(
      `SELECT ge.id,
              ge.event_type,
              ge.recorded_at as timestamp,
              ge.vehicle_id,
              v.vehicle_number,
              v.make,
              v.model,
              ge.metadata
       FROM geofence_events ge
       JOIN vehicles v ON ge.vehicle_id = v.id
       WHERE ge.tenant_id = $1 AND ge.geofence_id = $2
       ORDER BY ge.recorded_at DESC
       LIMIT 200`,
      [tenantId, id]
    )

    const events = eventsResult.rows.map((row: any) => ({
      id: row.id,
      event_type: row.event_type,
      description: row.metadata?.description || `${row.event_type} event`,
      timestamp: row.timestamp,
      vehicle_id: row.vehicle_id,
      vehicle_name: row.vehicle_number || `${row.make} ${row.model}`,
      metadata: row.metadata || {}
    }))

    res.json({ data: events })
  } catch (error: unknown) {
    return res.status(500).json({ error: 'Failed to fetch hazard zone events' })
  }
})

export default router
