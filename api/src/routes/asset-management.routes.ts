/**
 * Asset Management Routes
 * Comprehensive fleet asset tracking and lifecycle management
 *
 * Features:
 * - Asset inventory (vehicles, equipment, tools, trailers)
 * - QR code generation and tracking
 * - Asset depreciation calculation
 * - Maintenance history
 * - Assignment tracking
 * - Asset transfers
 * - Disposal management
 */

import { Router } from 'express'

import logger from '../config/logger'
import { NotFoundError } from '../errors/app-error'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'

// Import repositories
import { AssetRepository } from '../repositories/asset.repository'
import { UserRepository } from '../repositories/user.repository'
import { AssetHistoryRepository } from '../repositories/asset-history.repository'
import { MaintenanceScheduleRepository } from '../repositories/maintenance-schedule.repository'
import { QRCodeRepository } from '../repositories/qr-code.repository'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [vehicle, equipment, tool, trailer, other]
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance, retired, disposed]
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get('/', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { type, status, location, assigned_to, search } = req.query
    const tenantId = req.user?.tenant_id

    const assetRepository = new AssetRepository()
    const userRepository = new UserRepository()
    const assetHistoryRepository = new AssetHistoryRepository()
    const maintenanceScheduleRepository = new MaintenanceScheduleRepository()

    let query = assetRepository.createBaseQuery()

    const params: any[] = [tenantId]
    let paramCount = 1

    if (type) {
      paramCount++
      query = assetRepository.addTypeFilter(query, paramCount)
      params.push(type)
    }

    if (status) {
      paramCount++
      query = assetRepository.addStatusFilter(query, paramCount)
      params.push(status)
    }

    if (location) {
      paramCount++
      query = assetRepository.addLocationFilter(query, paramCount)
      params.push(location)
    }

    if (assigned_to) {
      paramCount++
      query = assetRepository.addAssignedToFilter(query, paramCount)
      params.push(assigned_to)
    }

    if (search) {
      paramCount++
      query = assetRepository.addSearchFilter(query, paramCount)
      params.push(`%${search}%`)
    }

    query = assetRepository.addGroupByAndOrderBy(query)

    const assets = await assetRepository.executeAssetQuery(query, params)

    const result = await Promise.all(assets.map(async (asset) => {
      const assignedToUser = asset.assigned_to ? await userRepository.getUserById(asset.assigned_to) : null
      const historyCount = await assetHistoryRepository.getHistoryCountForAsset(asset.id)
      const nextMaintenance = await maintenanceScheduleRepository.getNextScheduledMaintenanceForAsset(asset.id)

      return {
        ...asset,
        assigned_to_name: assignedToUser ? `${assignedToUser.first_name} ${assignedToUser.last_name}` : null,
        history_count: historyCount,
        next_maintenance: nextMaintenance
      }
    }))

    res.json({
      assets: result,
    })
  } catch (error) {
    logger.error('Error fetching assets:', error)
    res.status(500).json({ error: 'An error occurred while fetching assets' })
  }
})

/**
 * @openapi
 * /api/assets/{id}:
 *   get:
 *     summary: Get a specific asset
 *     tags: [Assets]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asset details
 *       404:
 *         description: Asset not found
 */
router.get('/:id', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const assetId = parseInt(req.params.id)
    const tenantId = req.user?.tenant_id

    const assetRepository = new AssetRepository()
    const userRepository = new UserRepository()
    const assetHistoryRepository = new AssetHistoryRepository()
    const maintenanceScheduleRepository = new MaintenanceScheduleRepository()

    const asset = await assetRepository.getAssetById(assetId, tenantId)

    if (!asset) {
      throw new NotFoundError('Asset not found')
    }

    const assignedToUser = asset.assigned_to ? await userRepository.getUserById(asset.assigned_to) : null
    const history = await assetHistoryRepository.getHistoryForAsset(asset.id)
    const nextMaintenance = await maintenanceScheduleRepository.getNextScheduledMaintenanceForAsset(asset.id)

    const result = {
      ...asset,
      assigned_to_name: assignedToUser ? `${assignedToUser.first_name} ${assignedToUser.last_name}` : null,
      history: history,
      next_maintenance: nextMaintenance
    }

    res.json(result)
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      logger.error('Error fetching asset:', error)
      res.status(500).json({ error: 'An error occurred while fetching the asset' })
    }
  }
})

/**
 * @openapi
 * /api/assets:
 *   post:
 *     summary: Create a new asset
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [vehicle, equipment, tool, trailer, other]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance, retired, disposed]
 *               location:
 *                 type: string
 *               assigned_to:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               purchase_date:
 *                 type: string
 *                 format: date
 *               purchase_price:
 *                 type: number
 *               serial_number:
 *                 type: string
 *               model:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission('vehicle:create:fleet'), csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const assetRepository = new AssetRepository()
    const qrCodeRepository = new QRCodeRepository()

    const newAsset = await assetRepository.createAsset({
      ...req.body,
      tenant_id: tenantId
    })

    const qrCode = await qrCodeRepository.generateQRCodeForAsset(newAsset.id)

    res.status(201).json({
      ...newAsset,
      qr_code: qrCode
    })
  } catch (error) {
    logger.error('Error creating asset:', error)
    res.status(500).json({ error: 'An error occurred while creating the asset' })
  }
})

/**
 * @openapi
 * /api/assets/{id}:
 *   put:
 *     summary: Update an existing asset
 *     tags: [Assets]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [vehicle, equipment, tool, trailer, other]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance, retired, disposed]
 *               location:
 *                 type: string
 *               assigned_to:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               purchase_date:
 *                 type: string
 *                 format: date
 *               purchase_price:
 *                 type: number
 *               serial_number:
 *                 type: string
 *               model:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Asset not found
 */
router.put('/:id', requirePermission('vehicle:update:fleet'), csrfProtection, async (req: AuthRequest, res) => {
  try {
    const assetId = parseInt(req.params.id)
    const tenantId = req.user?.tenant_id

    const assetRepository = new AssetRepository()

    const updatedAsset = await assetRepository.updateAsset(assetId, {
      ...req.body,
      tenant_id: tenantId
    })

    if (!updatedAsset) {
      throw new NotFoundError('Asset not found')
    }

    res.json(updatedAsset)
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      logger.error('Error updating asset:', error)
      res.status(500).json({ error: 'An error occurred while updating the asset' })
    }
  }
})

/**
 * @openapi
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete an asset
 *     tags: [Assets]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 */
router.delete('/:id', requirePermission('vehicle:delete:fleet'), csrfProtection, async (req: AuthRequest, res) => {
  try {
    const assetId = parseInt(req.params.id)
    const tenantId = req.user?.tenant_id

    const assetRepository = new AssetRepository()

    const deleted = await assetRepository.deleteAsset(assetId, tenantId)

    if (!deleted) {
      throw new NotFoundError('Asset not found')
    }

    res.status(204).send()
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      logger.error('Error deleting asset:', error)
      res.status(500).json({ error: 'An error occurred while deleting the asset' })
    }
  }
})

export default router