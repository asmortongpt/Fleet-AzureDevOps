To refactor the code and replace `pool.query/db.query` with a repository pattern, we need to create a repository class that encapsulates the database operations. We'll also need to update the `VehicleModelsService` to use this new repository. Here's the complete refactored file:


/**
 * Vehicle 3D Models API Routes
 *
 * Endpoints for 3D vehicle visualization, AR, and customization
 */

import express, { Response } from 'express'
import { z } from 'zod'

import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { getErrorMessage } from '../utils/error-handler'
import logger from '../config/logger'

// Import the new repository and service
import VehicleModelsRepository from '../repositories/vehicle-models.repository'
import VehicleModelsService from '../services/vehicle-models.service'

const router = express.Router()

// Create an instance of the repository and service
const vehicleModelsRepository = new VehicleModelsRepository()
const vehicleModelsService = new VehicleModelsService(vehicleModelsRepository)

// Optional authentication - allow public access for some endpoints
const optionalAuth = (req: AuthRequest, res: Response, next: any) => {
  authenticateJWT(req, res, (err?: any) => {
    // Continue even if not authenticated
    next()
  })
}

/**
 * GET /api/vehicles/:id/3d-model
 * Get 3D model data for a vehicle
 */
router.get('/:id/3d-model', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id)

    const modelData = await vehicleModelsService.getVehicle3DModel(vehicleId)

    if (!modelData) {
      throw new NotFoundError("Vehicle 3D model not found")
    }

    res.json(modelData)
  } catch (error: any) {
    logger.error('Get 3D model error:', error)
    res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
  }
})

/**
 * GET /api/vehicles/:id/ar-model
 * Get AR model URL (USDZ for iOS or GLB for Android)
 */
router.get('/:id/ar-model', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id)
    const platform = req.query.platform as string // 'ios' or 'android'

    const modelData = await vehicleModelsService.getVehicle3DModel(vehicleId)

    if (!modelData) {
      throw new NotFoundError("Vehicle 3D model not found")
    }

    const arUrl = platform === 'ios' ? modelData.usdz_model_url : modelData.glb_model_url

    if (!arUrl) {
      throw new NotFoundError("AR model not available for this platform")
    }

    res.json({
      url: arUrl,
      platform,
      supports_ar: modelData.supports_ar,
      bbox: {
        width: modelData.bbox_width_m,
        height: modelData.bbox_height_m,
        length: modelData.bbox_length_m,
      },
    })
  } catch (error: any) {
    logger.error('Get AR model error:', error)
    res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
  }
})

/**
 * POST /api/vehicles/:id/customize
 * Save vehicle customization
 */
router.post(
  '/:id/customize',
  csrfProtection,
  authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicle_customization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.id)

      const schema = z.object({
        exteriorColorHex: z.string().optional(),
        exteriorColorName: z.string().optional(),
        interiorColorHex: z.string().optional(),
        interiorColorName: z.string().optional(),
        wheelStyle: z.string().optional(),
        trimPackage: z.string().optional(),
      })

      const customization = schema.parse(req.body)

      const result = await vehicleModelsService.updateCustomization(vehicleId, customization)

      res.json({
        message: 'Customization saved successfully',
        data: result,
      })
    } catch (error: any) {
      logger.error('Save customization error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid customization data', details: error.errors })
      }
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
    }
  }
)

/**
 * GET /api/vehicle-models
 * List all published 3D vehicle models
 */
router.get('/models', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      make: req.query.make as string,
      model: req.query.model as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      bodyStyle: req.query.bodyStyle as string,
    }

    const models = await vehicleModelsService.getPublished3DModels(filters)

    res.json({
      data: models,
      count: models.length,
    })
  } catch (error: any) {
    logger.error('List models error:', error)
    res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
  }
})

/**
 * GET /api/vehicle-models/catalog
 * Get makes/models catalog for filtering
 */
router.get('/models/catalog', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const catalog = await vehicleModelsService.getMakesModelsCatalog()

    res.json(catalog)
  } catch (error: any) {
    logger.error('Get catalog error:', error)
    res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
  }
})

export default router


Now, let's create the new `VehicleModelsRepository` and update the `VehicleModelsService`:

**vehicle-models.repository.ts:**


import { pool } from '../config/database'

class VehicleModelsRepository {
  async getVehicle3DModel(vehicleId: number) {
    const query = 'SELECT * FROM vehicle_3d_models WHERE vehicle_id = $1'
    const result = await pool.query(query, [vehicleId])
    return result.rows[0] || null
  }

  async updateCustomization(vehicleId: number, customization: any) {
    const query = `
      UPDATE vehicle_customizations
      SET exterior_color_hex = COALESCE($2, exterior_color_hex),
          exterior_color_name = COALESCE($3, exterior_color_name),
          interior_color_hex = COALESCE($4, interior_color_hex),
          interior_color_name = COALESCE($5, interior_color_name),
          wheel_style = COALESCE($6, wheel_style),
          trim_package = COALESCE($7, trim_package)
      WHERE vehicle_id = $1
      RETURNING *
    `
    const values = [
      vehicleId,
      customization.exteriorColorHex,
      customization.exteriorColorName,
      customization.interiorColorHex,
      customization.interiorColorName,
      customization.wheelStyle,
      customization.trimPackage,
    ]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  async getPublished3DModels(filters: any) {
    let query = 'SELECT * FROM vehicle_3d_models WHERE is_published = true'
    const values: any[] = []

    if (filters.make) {
      query += ' AND make = $' + (values.length + 1)
      values.push(filters.make)
    }

    if (filters.model) {
      query += ' AND model = $' + (values.length + 1)
      values.push(filters.model)
    }

    if (filters.year) {
      query += ' AND year = $' + (values.length + 1)
      values.push(filters.year)
    }

    if (filters.bodyStyle) {
      query += ' AND body_style = $' + (values.length + 1)
      values.push(filters.bodyStyle)
    }

    const result = await pool.query(query, values)
    return result.rows
  }

  async getMakesModelsCatalog() {
    const query = `
      SELECT DISTINCT make, model
      FROM vehicle_3d_models
      WHERE is_published = true
      ORDER BY make, model
    `
    const result = await pool.query(query)
    return result.rows
  }
}

export default VehicleModelsRepository


**vehicle-models.service.ts:**


import { NotFoundError } from '../errors/app-error'

class VehicleModelsService {
  private repository: any

  constructor(repository: any) {
    this.repository = repository
  }

  async getVehicle3DModel(vehicleId: number) {
    const modelData = await this.repository.getVehicle3DModel(vehicleId)
    if (!modelData) {
      throw new NotFoundError("Vehicle 3D model not found")
    }
    return modelData
  }

  async updateCustomization(vehicleId: number, customization: any) {
    return await this.repository.updateCustomization(vehicleId, customization)
  }

  async getPublished3DModels(filters: any) {
    return await this.repository.getPublished3DModels(filters)
  }

  async getMakesModelsCatalog() {
    return await this.repository.getMakesModelsCatalog()
  }
}

export default VehicleModelsService


This refactored version introduces a `VehicleModelsRepository` class that encapsulates all database operations. The `VehicleModelsService` now depends on this repository instead of directly using the database pool. This change improves the separation of concerns and makes the code more modular and easier to test.

Note that you'll need to create the new files (`vehicle-models.repository.ts` and update `vehicle-models.service.ts`) in your project structure for this refactored version to work correctly.