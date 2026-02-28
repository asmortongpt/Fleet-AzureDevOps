/**
 * Heavy Equipment Routes (DB-backed)
 *
 * Frontend dependencies:
 * - GET /api/heavy-equipment
 * - GET /api/heavy-equipment/maintenance/schedules
 * - GET /api/heavy-equipment/certifications/expiring?days=60
 * - GET /api/heavy-equipment/certifications/matrix
 * - GET /api/heavy-equipment/:id/cost-analysis
 * - GET /api/heavy-equipment/:id/utilization
 * - GET /api/heavy-equipment/:id/telemetrics
 * - GET /api/heavy-equipment/:id/inspection
 */

import { Router } from 'express'

import pool from '../config/database'
import logger from '../config/logger'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { getErrorMessage } from '../utils/error-handler'
import { HeavyEquipmentService } from '../services/heavy-equipment.service'

const router = Router()
const service = new HeavyEquipmentService(pool)

router.use(authenticateJWT)

router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const filters = {
      equipment_type: req.query.equipment_type as string | undefined,
      availability_status: req.query.availability_status as string | undefined,
      is_rental: req.query.is_rental !== null && req.query.is_rental !== undefined ? String(req.query.is_rental) === 'true' : undefined,
    }

    const equipment = await service.getAllEquipment(tenantId, filters)
    res.json({ equipment, total: equipment.length })
  } catch (error) {
    logger.error('Error fetching heavy equipment:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch heavy equipment' })
  }
})

router.get('/maintenance/schedules', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const schedules = await service.getMaintenanceSchedules(tenantId)
    res.json({ schedules })
  } catch (error) {
    logger.error('Error fetching equipment maintenance schedules:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' })
  }
})

router.get('/certifications/expiring', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const days = Number(req.query.days ?? 60)
    const alerts = await service.getExpiringCertifications(tenantId, Number.isFinite(days) ? days : 60)
    res.json({ alerts })
  } catch (error) {
    logger.error('Error fetching expiring equipment certifications:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch expiring certifications' })
  }
})

router.get('/certifications/matrix', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const matrix = await service.getCertificationMatrix(tenantId)
    res.json({ matrix })
  } catch (error) {
    logger.error('Error fetching certification matrix:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch certification matrix' })
  }
})

router.get('/:id', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const { id } = req.params
    const result = await pool.query(
      `SELECT
        he.id, he.tenant_id, he.asset_id, he.equipment_type, he.model_year,
        he.engine_hours, he.engine_type, he.weight_capacity_lbs, he.load_capacity,
        he.reach_distance_ft, he.inspection_required, he.last_inspection_date,
        he.next_inspection_date, he.certification_number, he.requires_certification,
        he.operator_license_type, he.metadata, he.created_at, he.updated_at,
        a.asset_number, a.asset_name, a.manufacturer, a.model AS asset_model,
        a.serial_number, a.status AS asset_status, a.condition, a.current_location,
        a.acquisition_date, a.acquisition_cost,
        f.name AS facility_name
      FROM heavy_equipment he
      LEFT JOIN assets a ON a.id = he.asset_id
      LEFT JOIN facilities f ON f.id = a.facility_id
      WHERE he.id = $1 AND he.tenant_id = $2`,
      [id, tenantId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Heavy equipment not found' })
    }

    res.json({ data: result.rows[0] })
  } catch (error) {
    logger.error('Error fetching heavy equipment by id:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch heavy equipment' })
  }
})

router.get('/:id/cost-analysis', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const { id } = req.params
    const startDate = (req.query.start_date as string | undefined) || undefined
    const endDate = (req.query.end_date as string | undefined) || undefined
    const analysis = await service.getCostAnalysis(tenantId, id, startDate, endDate)
    res.json({ analysis })
  } catch (error) {
    logger.error('Error fetching equipment cost analysis:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch cost analysis' })
  }
})

router.get('/:id/utilization', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const { id } = req.params
    const startDate = (req.query.start_date as string | undefined) || undefined
    const endDate = (req.query.end_date as string | undefined) || undefined
    const utilization = await service.getUtilization(tenantId, id, startDate, endDate)
    res.json({ utilization })
  } catch (error) {
    logger.error('Error fetching equipment utilization:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch utilization' })
  }
})

// NOTE: frontend uses `/telemetrics` (typo); keep route name for compatibility.
router.get('/:id/telemetrics', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const { id } = req.params
    const limit = Number(req.query.limit ?? 50)
    const telemetry = await service.getTelematics(tenantId, id, Number.isFinite(limit) ? limit : 50)
    res.json({ telemetry })
  } catch (error) {
    logger.error('Error fetching equipment telematics:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch telematics' })
  }
})

router.get('/:id/inspection', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    if (!tenantId) {
return res.status(401).json({ error: 'Authentication required' })
}

    const { id } = req.params
    const limit = Number(req.query.limit ?? 50)
    const inspections = await service.getInspectionHistory(tenantId, id, Number.isFinite(limit) ? limit : 50)
    res.json({ inspections })
  } catch (error) {
    logger.error('Error fetching equipment inspection history:', { error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch inspection history' })
  }
})

export default router

