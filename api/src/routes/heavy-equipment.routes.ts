/**
 * Heavy Equipment Routes
 * RESTful API for heavy equipment management
 *
 * Features:
 * - Equipment CRUD operations
 * - Hour meter tracking
 * - Operator certification management
 * - Attachment management
 * - Maintenance checklist completion
 * - Utilization tracking
 * - Cost analysis
 */

import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import heavyEquipmentService from '../services/heavy-equipment.service'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/heavy-equipment:
 *   get:
 *     summary: Get all heavy equipment
 *     tags: [Heavy Equipment]
 *     parameters:
 *       - name: equipment_type
 *         in: query
 *         schema:
 *           type: string
 *       - name: availability_status
 *         in: query
 *         schema:
 *           type: string
 *       - name: is_rental
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of heavy equipment
 */
router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const filters = {
      equipment_type: req.query.equipment_type as string,
      availability_status: req.query.availability_status as string,
      is_rental: req.query.is_rental ? req.query.is_rental === 'true' : undefined
    }

    const equipment = await heavyEquipmentService.getAllEquipment(tenantId, filters)

    res.json({
      equipment,
      total: equipment.length
    })
  } catch (error) {
    console.error('Error fetching heavy equipment:', error)
    res.status(500).json({ error: 'Failed to fetch heavy equipment' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Heavy Equipment]
 */
router.get('/:id', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    const equipment = await heavyEquipmentService.getEquipmentById(id, tenantId)

    res.json({ equipment })
  } catch (error: any) {
    console.error('Error fetching equipment:', error)
    if (error.message === 'Equipment not found') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to fetch equipment' })
    }
  }
})

/**
 * @openapi
 * /api/heavy-equipment:
 *   post:
 *     summary: Create new heavy equipment
 *     tags: [Heavy Equipment]
 */
router.post('/', requirePermission('vehicle:create:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const equipmentData = {
      ...req.body,
      tenant_id: tenantId
    }

    const equipment = await heavyEquipmentService.createEquipment(equipmentData, userId)

    res.status(201).json({
      equipment,
      message: 'Heavy equipment created successfully'
    })
  } catch (error) {
    console.error('Error creating heavy equipment:', error)
    res.status(500).json({ error: 'Failed to create heavy equipment' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}:
 *   put:
 *     summary: Update heavy equipment
 *     tags: [Heavy Equipment]
 */
router.put('/:id', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    const equipment = await heavyEquipmentService.updateEquipment(id, tenantId, req.body, userId)

    res.json({
      equipment,
      message: 'Equipment updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating equipment:', error)
    if (error.message === 'Equipment not found') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Failed to update equipment' })
    }
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}/hour-meter:
 *   post:
 *     summary: Record hour meter reading
 *     tags: [Heavy Equipment]
 */
router.post('/:id/hour-meter', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const readingData = {
      equipment_id: id,
      recorded_by: userId,
      ...req.body
    }

    const reading = await heavyEquipmentService.recordHourMeterReading(readingData)

    res.status(201).json({
      reading,
      message: 'Hour meter reading recorded successfully'
    })
  } catch (error) {
    console.error('Error recording hour meter:', error)
    res.status(500).json({ error: 'Failed to record hour meter reading' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}/hour-meter:
 *   get:
 *     summary: Get hour meter readings
 *     tags: [Heavy Equipment]
 */
router.get('/:id/hour-meter', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    const readings = await heavyEquipmentService.getHourMeterReadings(id, limit)

    res.json({
      readings,
      total: readings.length
    })
  } catch (error) {
    console.error('Error fetching hour meter readings:', error)
    res.status(500).json({ error: 'Failed to fetch hour meter readings' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/certifications:
 *   get:
 *     summary: Get operator certifications
 *     tags: [Heavy Equipment]
 */
router.get('/certifications/all', requirePermission('driver:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const filters = {
      driver_id: req.query.driver_id as string,
      equipment_type: req.query.equipment_type as string,
      status: req.query.status as string,
      expiring_soon: req.query.expiring_soon === 'true'
    }

    const certifications = await heavyEquipmentService.getOperatorCertifications(tenantId, filters)

    res.json({
      certifications,
      total: certifications.length
    })
  } catch (error) {
    console.error('Error fetching certifications:', error)
    res.status(500).json({ error: 'Failed to fetch certifications' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/certifications/expiring:
 *   get:
 *     summary: Get expiring certifications
 *     tags: [Heavy Equipment]
 */
router.get('/certifications/expiring', requirePermission('driver:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const daysThreshold = parseInt(req.query.days as string) || 30

    const alerts = await heavyEquipmentService.getCertificationExpiringAlerts(tenantId, daysThreshold)

    res.json({
      alerts,
      total: alerts.length
    })
  } catch (error) {
    console.error('Error fetching expiring certifications:', error)
    res.status(500).json({ error: 'Failed to fetch expiring certifications' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/certifications/matrix:
 *   get:
 *     summary: Get operator certification matrix
 *     tags: [Heavy Equipment]
 */
router.get('/certifications/matrix', requirePermission('driver:view:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const matrix = await heavyEquipmentService.getOperatorCertificationMatrix(tenantId)

    res.json({ matrix })
  } catch (error) {
    console.error('Error fetching certification matrix:', error)
    res.status(500).json({ error: 'Failed to fetch certification matrix' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/certifications:
 *   post:
 *     summary: Create operator certification
 *     tags: [Heavy Equipment]
 */
router.post('/certifications/create', requirePermission('driver:create:global'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    const certificationData = {
      ...req.body,
      tenant_id: tenantId
    }

    const certification = await heavyEquipmentService.createOperatorCertification(certificationData)

    res.status(201).json({
      certification,
      message: 'Operator certification created successfully'
    })
  } catch (error) {
    console.error('Error creating certification:', error)
    res.status(500).json({ error: 'Failed to create certification' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/attachments/{equipmentId}:
 *   get:
 *     summary: Get equipment attachments
 *     tags: [Heavy Equipment]
 */
router.get('/attachments/:equipmentId', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { equipmentId } = req.params

    const attachments = await heavyEquipmentService.getEquipmentAttachments(equipmentId)

    res.json({
      attachments,
      total: attachments.length
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    res.status(500).json({ error: 'Failed to fetch attachments' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/attachments:
 *   post:
 *     summary: Add equipment attachment
 *     tags: [Heavy Equipment]
 */
router.post('/attachments', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const attachment = await heavyEquipmentService.addAttachment(req.body)

    res.status(201).json({
      attachment,
      message: 'Attachment added successfully'
    })
  } catch (error) {
    console.error('Error adding attachment:', error)
    res.status(500).json({ error: 'Failed to add attachment' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/attachments/{id}/status:
 *   patch:
 *     summary: Update attachment status (attach/detach)
 *     tags: [Heavy Equipment]
 */
router.patch('/attachments/:id/status', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { is_attached } = req.body

    const attachment = await heavyEquipmentService.updateAttachmentStatus(id, is_attached)

    res.json({
      attachment,
      message: 'Attachment status updated successfully'
    })
  } catch (error) {
    console.error('Error updating attachment status:', error)
    res.status(500).json({ error: 'Failed to update attachment status' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}/inspection:
 *   post:
 *     summary: Complete inspection checklist
 *     tags: [Heavy Equipment]
 */
router.post('/:id/inspection', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const checklistData = {
      equipment_id: id,
      completed_by: userId,
      ...req.body
    }

    const checklist = await heavyEquipmentService.completeMaintenanceChecklist(checklistData)

    res.status(201).json({
      checklist,
      message: 'Inspection checklist completed successfully'
    })
  } catch (error) {
    console.error('Error completing inspection:', error)
    res.status(500).json({ error: 'Failed to complete inspection' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}/inspection:
 *   get:
 *     summary: Get inspection checklists
 *     tags: [Heavy Equipment]
 */
router.get('/:id/inspection', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 20

    const checklists = await heavyEquipmentService.getMaintenanceChecklists(id, limit)

    res.json({
      checklists,
      total: checklists.length
    })
  } catch (error) {
    console.error('Error fetching inspection checklists:', error)
    res.status(500).json({ error: 'Failed to fetch inspection checklists' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}/utilization:
 *   get:
 *     summary: Get equipment utilization
 *     tags: [Heavy Equipment]
 */
router.get('/:id/utilization', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const startDate = req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = req.query.end_date as string || new Date().toISOString().split('T')[0]

    const utilization = await heavyEquipmentService.getEquipmentUtilization(id, startDate, endDate)

    res.json({ utilization })
  } catch (error) {
    console.error('Error fetching utilization:', error)
    res.status(500).json({ error: 'Failed to fetch utilization data' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/{id}/cost-analysis:
 *   get:
 *     summary: Get equipment cost analysis
 *     tags: [Heavy Equipment]
 */
router.get('/:id/cost-analysis', requirePermission('report:view:global'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const startDate = req.query.start_date as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = req.query.end_date as string || new Date().toISOString().split('T')[0]

    const analysis = await heavyEquipmentService.getEquipmentCostAnalysis(id, startDate, endDate)

    res.json({ analysis })
  } catch (error) {
    console.error('Error fetching cost analysis:', error)
    res.status(500).json({ error: 'Failed to fetch cost analysis' })
  }
})

/**
 * @openapi
 * /api/heavy-equipment/maintenance/schedules:
 *   get:
 *     summary: Get maintenance schedules
 *     tags: [Heavy Equipment]
 */
router.get('/maintenance/schedules', requirePermission('maintenance:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const equipmentId = req.query.equipment_id as string

    const schedules = await heavyEquipmentService.getMaintenanceSchedules(tenantId, equipmentId)

    res.json({
      schedules,
      total: schedules.length
    })
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error)
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' })
  }
})

export default router
