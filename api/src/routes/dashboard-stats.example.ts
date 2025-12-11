/**
 * EXAMPLE: Dashboard Statistics Endpoint with Query Result Caching
 *
 * This demonstrates caching expensive aggregation queries that power dashboards.
 * These queries are often slow and run frequently, making them ideal for caching.
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { cache } from '../utils/cache'
import { slowQueryLogger } from '../utils/performance'
import { csrfProtection } from '../middleware/csrf'

// Import repositories
import { VehicleRepository } from '../repositories/vehicle.repository'
import { DriverRepository } from '../repositories/driver.repository'
import { WorkOrderRepository } from '../repositories/workOrder.repository'
import { MaintenanceScheduleRepository } from '../repositories/maintenanceSchedule.repository'
import { FuelTransactionRepository } from '../repositories/fuelTransaction.repository'

const router = express.Router()
router.use(authenticateJWT)

/**
 * GET /api/dashboard/stats
 *
 * Returns dashboard statistics:
 * - Total vehicles, drivers, work orders
 * - Active vs inactive counts
 * - Upcoming maintenance
 * - Recent fuel transactions
 *
 * This endpoint uses MANUAL caching (not middleware) because:
 * 1. The query is expensive (joins multiple tables)
 * 2. Results are tenant-specific (different cache per tenant)
 * 3. We want to cache the raw query result, not the formatted response
 */
router.get('/stats',
  requirePermission('dashboard:view:team'),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id

      // Generate cache key specific to this tenant
      const cacheKey = cache.getCacheKey(tenantId, `dashboard:stats`)

      // Try to get from cache first
      const cached = await cache.get(cacheKey)
      if (cached) {
        console.log(`✅ Cache HIT: dashboard stats for tenant ${tenantId}`)
        return res.json({
          success: true,
          data: cached,
          cached: true
        })
      }

      console.log(`❌ Cache MISS: dashboard stats for tenant ${tenantId}`)

      // Initialize repositories
      const vehicleRepository = new VehicleRepository()
      const driverRepository = new DriverRepository()
      const workOrderRepository = new WorkOrderRepository()
      const maintenanceScheduleRepository = new MaintenanceScheduleRepository()
      const fuelTransactionRepository = new FuelTransactionRepository()

      // Expensive aggregation query with slow query logging
      const stats = await slowQueryLogger(
        async () => {
          const [
            vehicleStats,
            driverStats,
            workOrderStats,
            maintenanceStats,
            fuelStats
          ] = await Promise.all([
            vehicleRepository.getDashboardStats(tenantId),
            driverRepository.getDashboardStats(tenantId),
            workOrderRepository.getDashboardStats(tenantId),
            maintenanceScheduleRepository.getDashboardStats(tenantId),
            fuelTransactionRepository.getDashboardStats(tenantId)
          ])

          return {
            ...vehicleStats,
            ...driverStats,
            ...workOrderStats,
            ...maintenanceStats,
            ...fuelStats
          }
        }
      )

      // Cache the result
      await cache.set(cacheKey, stats, 3600) // Cache for 1 hour

      return res.json({
        success: true,
        data: stats,
        cached: false
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return res.status(500).json({
        success: false,
        error: 'An error occurred while fetching dashboard stats'
      })
    }
  }
)

export default router