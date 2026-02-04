/**
 * Heavy Equipment Routes (DB-backed)
 *
 * Requirements:
 * - All data comes from DB tables (no simulated/random values).
 * - Auth + permissions enforced for all endpoints.
 * - Tenant-safe access.
 */

import { Router } from 'express'

import logger from '../config/logger'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import heavyEquipmentService from '../services/heavy-equipment.service'
import { getErrorMessage } from '../utils/error-handler'

const router = Router()

router.use(authenticateJWT)

router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const filters = {
      equipment_type: req.query.equipment_type as string,
      availability_status: req.query.availability_status as string,
      is_rental: req.query.is_rental ? req.query.is_rental === 'true' : undefined,
    }

    const equipment = await heavyEquipmentService.getAllEquipment(tenantId, filters)
    res.json({ equipment, total: equipment.length })
  } catch (error) {
    logger.error('Error fetching heavy equipment:', error)
    res.status(500).json({ error: 'Failed to fetch heavy equipment' })
  }
})

router.get('/:id([0-9a-fA-F-]{36})', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const equipment = await heavyEquipmentService.getEquipmentById(id, tenantId)
    res.json({ equipment })
  } catch (error) {
    logger.error('Error fetching equipment:', error)
    if (getErrorMessage(error) === 'Equipment not found') return res.status(404).json({ error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to fetch equipment' })
  }
})

router.post('/', csrfProtection, requirePermission('vehicle:create:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id
    const equipment = await heavyEquipmentService.createEquipment({ ...req.body, tenant_id: tenantId }, userId)
    res.status(201).json({ equipment, message: 'Heavy equipment created successfully' })
  } catch (error) {
    logger.error('Error creating heavy equipment:', error)
    res.status(500).json({ error: 'Failed to create heavy equipment' })
  }
})

router.put('/:id([0-9a-fA-F-]{36})', csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id
    const equipment = await heavyEquipmentService.updateEquipment(id, tenantId, req.body, userId)
    res.json({ equipment, message: 'Equipment updated successfully' })
  } catch (error) {
    logger.error('Error updating equipment:', error)
    if (getErrorMessage(error) === 'Equipment not found') return res.status(404).json({ error: getErrorMessage(error) })
    res.status(500).json({ error: 'Failed to update equipment' })
  }
})

router.post('/:id([0-9a-fA-F-]{36})/hour-meter', csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const hours = typeof req.body?.hours === 'number' ? req.body.hours : (typeof req.body?.reading === 'number' ? req.body.reading : undefined)
    if (typeof hours !== 'number') return res.status(400).json({ error: 'hours is required' })

    const reading = await heavyEquipmentService.recordHourMeterReading({
      tenant_id: tenantId,
      equipment_id: id,
      recorded_by: userId,
      hours,
      odometer_miles: req.body?.odometer_miles,
      fuel_level_percent: req.body?.fuel_level_percent,
      job_site: req.body?.job_site,
      operator_id: req.body?.operator_id,
      billable_hours: req.body?.billable_hours,
      notes: req.body?.notes,
    })

    res.status(201).json({ reading, message: 'Hour meter reading recorded successfully' })
  } catch (error) {
    logger.error('Error recording hour meter:', error)
    res.status(500).json({ error: 'Failed to record hour meter reading' })
  }
})

router.get('/:id([0-9a-fA-F-]{36})/hour-meter', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const limit = parseInt(req.query.limit as string) || 50
    const readings = await heavyEquipmentService.getHourMeterReadings(tenantId, id, limit)
    res.json({ readings, total: readings.length })
  } catch (error) {
    logger.error('Error fetching hour meter readings:', error)
    res.status(500).json({ error: 'Failed to fetch hour meter readings' })
  }
})

router.get('/certifications/all', requirePermission('driver:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const filters = {
      driver_id: req.query.driver_id as string,
      equipment_type: req.query.equipment_type as string,
      status: req.query.status as string,
      expiring_soon: req.query.expiring_soon === 'true',
    }
    const certifications = await heavyEquipmentService.getOperatorCertifications(tenantId, filters)
    res.json({ certifications, total: certifications.length })
  } catch (error) {
    logger.error('Error fetching certifications:', error)
    res.status(500).json({ error: 'Failed to fetch certifications' })
  }
})

router.get('/certifications/expiring', requirePermission('driver:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const daysThreshold = parseInt(req.query.days as string) || 30
    const alerts = await heavyEquipmentService.getCertificationExpiringAlerts(tenantId, daysThreshold)
    res.json({ alerts, total: alerts.length })
  } catch (error) {
    logger.error('Error fetching expiring certifications:', error)
    res.status(500).json({ error: 'Failed to fetch expiring certifications' })
  }
})

router.get('/certifications/matrix', requirePermission('driver:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const matrix = await heavyEquipmentService.getOperatorCertificationMatrix(tenantId)
    res.json({ matrix })
  } catch (error) {
    logger.error('Error fetching certification matrix:', error)
    res.status(500).json({ error: 'Failed to fetch certification matrix' })
  }
})

router.post('/certifications/create', csrfProtection, requirePermission('driver:create:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const certification = await heavyEquipmentService.createOperatorCertification({ ...req.body, tenant_id: tenantId })
    res.status(201).json({ certification, message: 'Operator certification created successfully' })
  } catch (error) {
    logger.error('Error creating certification:', error)
    res.status(500).json({ error: 'Failed to create certification' })
  }
})

router.get('/attachments/:equipmentId([0-9a-fA-F-]{36})', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { equipmentId } = req.params
    const attachments = await heavyEquipmentService.getEquipmentAttachments(tenantId, equipmentId)
    res.json({ attachments, total: attachments.length })
  } catch (error) {
    logger.error('Error fetching attachments:', error)
    res.status(500).json({ error: 'Failed to fetch attachments' })
  }
})

router.post('/attachments', csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const attachment = await heavyEquipmentService.addAttachment({ ...req.body, tenant_id: tenantId })
    res.status(201).json({ attachment, message: 'Attachment added successfully' })
  } catch (error) {
    logger.error('Error adding attachment:', error)
    res.status(500).json({ error: 'Failed to add attachment' })
  }
})

router.patch('/attachments/:id([0-9a-fA-F-]{36})/status', csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params
    const isAttached = Boolean(req.body?.is_attached)
    const attachment = await heavyEquipmentService.updateAttachmentStatus(tenantId, id, isAttached)
    res.json({ attachment, message: 'Attachment status updated successfully' })
  } catch (error) {
    logger.error('Error updating attachment status:', error)
    res.status(500).json({ error: 'Failed to update attachment status' })
  }
})

router.post('/:id([0-9a-fA-F-]{36})/inspection', csrfProtection, requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id
    const { id } = req.params

    const checklist = await heavyEquipmentService.completeMaintenanceChecklist({
      tenant_id: tenantId,
      equipment_id: id,
      completed_by: userId,
      checklist_template_id: req.body?.checklist_template_id,
      engine_hours_at_completion: req.body?.engine_hours_at_completion,
      overall_status: req.body?.overall_status || 'passed',
      inspector_name: req.body?.inspector_name,
      notes: req.body?.notes,
      responses: Array.isArray(req.body?.responses) ? req.body.responses : [],
    })

    res.status(201).json({ checklist, message: 'Inspection checklist completed successfully' })
  } catch (error) {
    logger.error('Error completing inspection:', error)
    res.status(500).json({ error: 'Failed to complete inspection' })
  }
})

router.get('/:id([0-9a-fA-F-]{36})/inspection', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 20
    const checklists = await heavyEquipmentService.getMaintenanceChecklists(tenantId, id, limit)
    res.json({ checklists, total: checklists.length })
  } catch (error) {
    logger.error('Error fetching inspection checklists:', error)
    res.status(500).json({ error: 'Failed to fetch inspection checklists' })
  }
})

router.get('/:id([0-9a-fA-F-]{36})/utilization', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params
    const startDate = (req.query.start_date as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = (req.query.end_date as string) || new Date().toISOString().split('T')[0]
    const utilization = await heavyEquipmentService.getEquipmentUtilization(tenantId, id, startDate, endDate)
    res.json({ utilization })
  } catch (error) {
    logger.error('Error fetching utilization:', error)
    res.status(500).json({ error: 'Failed to fetch utilization data' })
  }
})

router.get('/:id([0-9a-fA-F-]{36})/cost-analysis', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params
    const startDate = (req.query.start_date as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = (req.query.end_date as string) || new Date().toISOString().split('T')[0]
    const analysis = await heavyEquipmentService.getEquipmentCostAnalysis(tenantId, id, startDate, endDate)
    res.json({ analysis })
  } catch (error) {
    logger.error('Error fetching cost analysis:', error)
    res.status(500).json({ error: 'Failed to fetch cost analysis' })
  }
})

router.get('/maintenance/schedules', requirePermission('maintenance:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const equipmentId = req.query.equipment_id as string | undefined
    const schedules = await heavyEquipmentService.getMaintenanceSchedules(tenantId, equipmentId)
    res.json({ schedules, total: schedules.length })
  } catch (error) {
    logger.error('Error fetching maintenance schedules:', error)
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' })
  }
})

router.get('/:id([0-9a-fA-F-]{36})/telemetrics', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { id } = req.params
    const telemetrics = await heavyEquipmentService.getLatestTelemetrics(tenantId, id)
    res.json({ telemetrics })
  } catch (error) {
    logger.error('Error fetching telemetrics:', error)
    res.status(500).json({ error: 'Failed to fetch telemetrics' })
  }
})

export default router

