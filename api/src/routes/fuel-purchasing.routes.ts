import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import fuelPurchasingService from '../services/fuel-purchasing.service'
import fuelOptimizationService from '../services/fuel-optimization.service'
import fuelPriceForecastingModel from '../ml-models/fuel-price-forecasting.model'

const router = express.Router()
router.use(authenticateJWT)

/**
 * Mask sensitive fuel card data
 */
function maskFuelCardData(data: any): any {
  if (!data) return data

  if (Array.isArray(data)) {
    return data.map(maskFuelCardData)
  }

  if (typeof data === 'object') {
    const masked = { ...data }

    // Mask fuel card numbers (show last 4 digits only)
    if (masked.card_number) {
      masked.card_number = `****-****-****-${masked.card_number.slice(-4)}`
    }
    if (masked.fuel_card_number) {
      masked.fuel_card_number = `****-****-****-${masked.fuel_card_number.slice(-4)}`
    }

    // Mask pricing details (only show to finance/manager roles)
    if (masked.wholesale_price !== undefined) {
      masked.wholesale_price = '[REDACTED]'
    }
    if (masked.contract_price !== undefined) {
      masked.contract_price = '[REDACTED]'
    }
    if (masked.negotiated_rate !== undefined) {
      masked.negotiated_rate = '[REDACTED]'
    }

    return masked
  }

  return data
}

// GET /api/fuel-purchasing/prices/nearby - Get nearby fuel prices
router.get(
  '/prices/nearby',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_prices' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { lat, lng, radius = '25', fuelType } = req.query

      if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng are required' })
      }

      const stations = await fuelPurchasingService.getNearbyStations(
        req.user!.tenant_id,
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string),
        fuelType as string | undefined
      )

      res.json(stations)
    } catch (error) {
      console.error('Get nearby stations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/prices/cheapest - Find cheapest fuel
router.get(
  '/prices/cheapest',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_prices' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { lat, lng, fuelType, radius = '50' } = req.query

      if (!lat || !lng || !fuelType) {
        return res.status(400).json({ error: 'lat, lng, and fuelType are required' })
      }

      const result = await fuelPurchasingService.findCheapestFuel(
        req.user!.tenant_id,
        parseFloat(lat as string),
        parseFloat(lng as string),
        fuelType as string,
        parseFloat(radius as string)
      )

      if (!result) {
        return res.status(404).json({ error: 'No stations found' })
      }

      res.json(result)
    } catch (error) {
      console.error('Find cheapest fuel error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/fuel-purchasing/recommend - Get fuel purchase recommendation
router.post(
  '/recommend',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_recommendations' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        vehicleLocation,
        destination,
        fuelType,
        currentFuelLevel,
        tankCapacity
      } = req.body

      if (!vehicleLocation || !destination || !fuelType) {
        return res.status(400).json({
          error: 'vehicleLocation, destination, and fuelType are required'
        })
      }

      const recommendation = await fuelPurchasingService.getOptimalFuelingRecommendation(
        req.user!.tenant_id,
        vehicleLocation,
        destination,
        fuelType,
        currentFuelLevel || 50,
        tankCapacity || 20
      )

      if (!recommendation) {
        return res.status(404).json({ error: 'No recommendation available' })
      }

      res.json(recommendation)
    } catch (error) {
      console.error('Get recommendation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/forecast - Get price forecasts
router.get(
  '/forecast',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_forecasts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fuelType = 'regular', region = 'national', days = '30' } = req.query

      const forecasts = await fuelPriceForecastingModel.forecastPrices(
        req.user!.tenant_id,
        fuelType as string,
        region as string,
        parseInt(days as string)
      )

      res.json(forecasts)
    } catch (error) {
      console.error('Get forecast error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/forecast/timing - Get purchase timing recommendation
router.get(
  '/forecast/timing',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_forecasts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fuelType = 'regular', currentPrice, region = 'national' } = req.query

      if (!currentPrice) {
        return res.status(400).json({ error: 'currentPrice is required' })
      }

      const recommendation = await fuelPriceForecastingModel.generatePurchaseRecommendation(
        req.user!.tenant_id,
        fuelType as string,
        parseFloat(currentPrice as string),
        region as string
      )

      res.json(recommendation)
    } catch (error) {
      console.error('Get timing recommendation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/forecast/seasonal - Get seasonal trends
router.get(
  '/forecast/seasonal',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_forecasts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fuelType = 'regular' } = req.query

      const trends = fuelPriceForecastingModel.analyzeSeasonalTrends(fuelType as string)

      res.json(trends)
    } catch (error) {
      console.error('Get seasonal trends error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/forecast/regional - Get regional price variations
router.get(
  '/forecast/regional',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_forecasts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fuelType = 'regular' } = req.query

      const variations = await fuelPriceForecastingModel.analyzeRegionalPriceVariations(
        req.user!.tenant_id,
        fuelType as string
      )

      res.json(variations)
    } catch (error) {
      console.error('Get regional variations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/fuel-purchasing/purchase-order - Create purchase order
router.post(
  '/purchase-order',
  requirePermission('fuel_transaction:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'fuel_purchase' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const order = await fuelPurchasingService.createPurchaseOrder(
        req.user!.tenant_id,
        req.body
      )

      // Mask sensitive data in response
      res.status(201).json(maskFuelCardData(order))
    } catch (error) {
      console.error('Create purchase order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/contracts - List fuel contracts
router.get(
  '/contracts',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_contracts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query

      const contracts = await fuelPurchasingService.getContracts(
        req.user!.tenant_id,
        status as string | undefined
      )

      // Mask sensitive pricing data
      res.json(maskFuelCardData(contracts))
    } catch (error) {
      console.error('Get contracts error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/fuel-purchasing/alerts - Create price alert
router.post(
  '/alerts',
  requirePermission('fuel_transaction:create:own'),
  auditLog({ action: 'CREATE', resourceType: 'fuel_alerts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const alert = await fuelPurchasingService.createPriceAlert(
        req.user!.tenant_id,
        req.user!.id,
        req.body
      )

      res.status(201).json(alert)
    } catch (error) {
      console.error('Create alert error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/savings - Calculate savings from optimization
router.get(
  '/savings',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_savings' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' })
      }

      const savings = await fuelPurchasingService.calculateSavings(
        req.user!.tenant_id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json(savings)
    } catch (error) {
      console.error('Calculate savings error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/optimization/refueling - Get optimal refueling locations
router.get(
  '/optimization/refueling',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleIds } = req.query

      const recommendations = await fuelOptimizationService.calculateOptimalRefuelingLocations(
        req.user!.tenant_id,
        vehicleIds ? (vehicleIds as string).split(',') : undefined
      )

      res.json(recommendations)
    } catch (error) {
      console.error('Get refueling optimization error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/optimization/bulk-vs-retail - Analyze bulk vs retail
router.get(
  '/optimization/bulk-vs-retail',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { monthlyGallons } = req.query

      if (!monthlyGallons) {
        return res.status(400).json({ error: 'monthlyGallons is required' })
      }

      const analysis = await fuelOptimizationService.analyzeBulkVsRetail(
        req.user!.tenant_id,
        parseFloat(monthlyGallons as string)
      )

      res.json(analysis)
    } catch (error) {
      console.error('Bulk vs retail analysis error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/optimization/fleet-cards - Optimize fleet card usage
router.get(
  '/optimization/fleet-cards',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { annualGallons } = req.query

      if (!annualGallons) {
        return res.status(400).json({ error: 'annualGallons is required' })
      }

      const optimization = await fuelOptimizationService.optimizeFleetCardUsage(
        req.user!.tenant_id,
        parseFloat(annualGallons as string)
      )

      res.json(optimization)
    } catch (error) {
      console.error('Fleet card optimization error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/optimization/cross-border - Analyze cross-border opportunities
router.get(
  '/optimization/cross-border',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { state } = req.query

      if (!state) {
        return res.status(400).json({ error: 'state is required' })
      }

      const analysis = await fuelOptimizationService.analyzeCrossBorderArbitrage(
        req.user!.tenant_id,
        state as string
      )

      res.json(analysis)
    } catch (error) {
      console.error('Cross-border analysis error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/optimization/hedging - Generate hedging recommendations
router.get(
  '/optimization/hedging',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { annualGallons, fuelType = 'regular' } = req.query

      if (!annualGallons) {
        return res.status(400).json({ error: 'annualGallons is required' })
      }

      const recommendations = await fuelOptimizationService.generateHedgingRecommendations(
        req.user!.tenant_id,
        parseFloat(annualGallons as string),
        fuelType as string
      )

      res.json(recommendations)
    } catch (error) {
      console.error('Hedging recommendations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/fuel-purchasing/optimization/report - Generate comprehensive optimization report
router.get(
  '/optimization/report',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'fuel_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const report = await fuelOptimizationService.generateOptimizationReport(
        req.user!.tenant_id
      )

      res.json(report)
    } catch (error) {
      console.error('Generate optimization report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
