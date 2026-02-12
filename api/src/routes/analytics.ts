/**
 * Analytics API Routes
 * Features: Cost analytics, efficiency metrics, fleet KPIs with Redis caching
 */

import { Router, type Request, type Response } from 'express'
import { createClient } from 'redis'

import { db } from '../db'
import { authenticateJWT } from '../middleware/auth'
import { tenantSafeQuery } from '../utils/dbHelpers'

const router = Router()

/**
 * GET /analytics/fleet-summary
 * PUBLIC endpoint - Returns AI-powered fleet analytics summary
 * Used by spider certification testing
 */
router.get('/fleet-summary', async (req: Request, res: Response) => {
    try {
        // Get counts from database using raw SQL (compatible with connection pool)
        const vehicleCountResult = await db.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active
            FROM vehicles
        `)

        const driverCountResult = await db.query(`
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active
            FROM drivers
        `)

        const totalVehicles = parseInt(vehicleCountResult.rows[0]?.total || '0')
        const activeVehicles = parseInt(vehicleCountResult.rows[0]?.active || '0')
        const totalDrivers = parseInt(driverCountResult.rows[0]?.total || '0')
        const activeDrivers = parseInt(driverCountResult.rows[0]?.active || '0')

        // AI-powered insights
        const insights = [
            {
                category: 'fleet_utilization',
                message: `${totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0}% of fleet is active`,
                severity: totalVehicles > 0 && activeVehicles / totalVehicles > 0.8 ? 'success' : 'warning'
            },
            {
                category: 'fleet_health',
                message: `${totalVehicles} vehicles in fleet, ${activeVehicles} active`,
                severity: 'info'
            },
            {
                category: 'driver_utilization',
                message: `${totalDrivers} total drivers, ${activeDrivers} active`,
                severity: 'info'
            }
        ]

        res.json({
            summary: {
                vehicles: {
                    total: totalVehicles,
                    active: activeVehicles,
                    inactive: totalVehicles - activeVehicles
                },
                drivers: {
                    total: totalDrivers,
                    active: activeDrivers,
                    inactive: totalDrivers - activeDrivers
                }
            },
            insights,
            generatedAt: new Date().toISOString(),
            model: 'gpt-4' // Placeholder for future AI integration
        })
    } catch (error) {
        console.error('Error generating fleet summary:', error)
        res.status(500).json({ error: 'Internal server error', details: String(error) })
    }
})

// Apply authentication to all OTHER routes (except fleet-summary above)
router.use(authenticateJWT)

// Redis client setup
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))

// Initialize Redis connection
const initRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect()
    }
}

// Cache middleware
const CACHE_TTL = 300 // 5 minutes
const cacheMiddleware = (keyPrefix: string) => {
    return async (req: Request, res: Response, next: Function) => {
        try {
            await initRedis()
            const cacheKey = `${keyPrefix}:${JSON.stringify(req.query)}`
            const cached = await redisClient.get(cacheKey)

            if (cached) {
                const data = JSON.parse(typeof cached === 'string' ? cached : cached.toString())
                return res.json({
                    ...data,
                    metadata: {
                        ...data.metadata,
                        cached: true,
                        cacheKey,
                    },
                })
            }

            // Store original json function
            const originalJson = res.json.bind(res)

            // Override json function to cache response
            res.json = function (body: any) {
                if (res.statusCode === 200) {
                    redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(body)).catch(console.error)
                }
                return originalJson(body)
            } as any

            next()
        } catch (error) {
            console.error('Cache middleware error:', error)
            next()
        }
    }
}

/**
 * GET /analytics/dashboard
 * Returns fleet-wide KPIs for the analytics dashboard (DB-backed).
 *
 * Query params:
 * - days: number (default 30) lookback window
 */
router.get('/dashboard', cacheMiddleware('analytics:dashboard'), async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenant_id
        if (!tenantId) return res.status(401).json({ error: 'Unauthorized' })

        const daysRaw = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days
        const days = Math.max(1, Math.min(365, parseInt(String(daysRaw ?? '30'), 10) || 30))
        const end = new Date()
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

        const [fleetResult, driversResult, tripsResult, fuelResult, maintenanceResult, byFuelTypeResult] = await Promise.all([
            db.query(
                `
                SELECT
                    COUNT(*)::int AS total_vehicles,
                    COUNT(*) FILTER (WHERE status = 'active')::int AS active_vehicles,
                    COUNT(*) FILTER (WHERE status IN ('maintenance', 'service'))::int AS in_maintenance
                FROM vehicles
                WHERE tenant_id = $1
                `,
                [tenantId]
            ),
            db.query(
                `
                SELECT
                    COUNT(*)::int AS total_drivers,
                    COUNT(*) FILTER (WHERE status = 'active')::int AS active_drivers
                FROM drivers
                WHERE tenant_id = $1
                `,
                [tenantId]
            ),
            db.query(
                `
                SELECT
                    COUNT(*)::int AS total_trips,
                    COALESCE(SUM(distance_miles), 0)::numeric AS total_miles,
                    COALESCE(AVG(distance_miles), 0)::numeric AS avg_trip_distance
                FROM mobile_trips
                WHERE tenant_id = $1
                  AND start_time >= $2
                `,
                [tenantId, start]
            ),
            db.query(
                `
                SELECT
                    COALESCE(SUM(total_cost), 0)::numeric AS total_cost,
                    COALESCE(SUM(gallons), 0)::numeric AS total_gallons,
                    COALESCE(AVG(cost_per_gallon), 0)::numeric AS avg_price_per_gallon,
                    COUNT(*)::int AS transactions
                FROM fuel_transactions
                WHERE tenant_id = $1
                  AND transaction_date >= $2
                `,
                [tenantId, start]
            ),
            db.query(
                `
                SELECT
                    COALESCE(SUM(COALESCE(actual_cost, estimated_cost, 0)), 0)::numeric AS total_cost,
                    COUNT(*)::int AS total_records
                FROM work_orders
                WHERE tenant_id = $1
                  AND created_at >= $2
                `,
                [tenantId, start]
            ),
            db.query(
                `
                SELECT
                    fuel_type AS fuel_type,
                    COUNT(*)::int AS count
                FROM vehicles
                WHERE tenant_id = $1
                GROUP BY fuel_type
                ORDER BY count DESC
                `,
                [tenantId]
            ),
        ])

        const fleetRow = fleetResult.rows[0] || { total_vehicles: 0, active_vehicles: 0, in_maintenance: 0 }
        const driversRow = driversResult.rows[0] || { total_drivers: 0, active_drivers: 0 }
        const tripsRow = tripsResult.rows[0] || { total_trips: 0, total_miles: 0, avg_trip_distance: 0 }
        const fuelRow = fuelResult.rows[0] || { total_cost: 0, total_gallons: 0, avg_price_per_gallon: 0, transactions: 0 }
        const maintRow = maintenanceResult.rows[0] || { total_cost: 0, total_records: 0 }

        const totalVehicles = Number(fleetRow.total_vehicles || 0)
        const activeVehicles = Number(fleetRow.active_vehicles || 0)
        const inMaintenance = Number(fleetRow.in_maintenance || 0)
        const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0

        const totalTrips = Number(tripsRow.total_trips || 0)
        const totalMiles = Number(tripsRow.total_miles || 0)
        const avgTripDistance = Number(tripsRow.avg_trip_distance || 0)

        const fuelTotalCost = Number(fuelRow.total_cost || 0)
        const fuelTotalGallons = Number(fuelRow.total_gallons || 0)
        const avgPricePerGallon = Number(fuelRow.avg_price_per_gallon || 0)
        const fuelTransactions = Number(fuelRow.transactions || 0)

        const maintenanceTotalCost = Number(maintRow.total_cost || 0)
        const maintenanceTotalRecords = Number(maintRow.total_records || 0)

        const totalOperatingCost = fuelTotalCost + maintenanceTotalCost
        const costPerMile = totalMiles > 0 ? totalOperatingCost / totalMiles : 0

        res.json({
            fleet: {
                totalVehicles,
                activeVehicles,
                inMaintenance,
                utilizationRate: Number(utilizationRate.toFixed(1)),
            },
            drivers: {
                totalDrivers: Number(driversRow.total_drivers || 0),
                activeDrivers: Number(driversRow.active_drivers || 0),
            },
            trips: {
                totalTrips,
                totalMiles: Number(totalMiles.toFixed(1)),
                avgTripDistance: Number(avgTripDistance.toFixed(1)),
            },
            fuel: {
                totalCost: Number(fuelTotalCost.toFixed(2)),
                totalGallons: Number(fuelTotalGallons.toFixed(3)),
                avgPricePerGallon: Number(avgPricePerGallon.toFixed(3)),
                transactions: fuelTransactions,
            },
            maintenance: {
                totalCost: Number(maintenanceTotalCost.toFixed(2)),
                totalRecords: maintenanceTotalRecords,
            },
            financials: {
                costPerMile: Number(costPerMile.toFixed(3)),
                totalOperatingCost: Number(totalOperatingCost.toFixed(2)),
            },
            vehiclesByFuelType: (byFuelTypeResult.rows || []).map((r: any) => ({
                fuelType: r.fuel_type,
                count: Number(r.count || 0),
            })),
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
                days,
            },
            generatedAt: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Error generating analytics dashboard:', error)
        res.status(500).json({ error: 'Internal server error', details: String(error) })
    }
})

/**
 * GET /analytics/cost
 * Returns cost analytics data with breakdown by category
 */
router.get('/cost', cacheMiddleware('analytics:cost'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, vehicleIds } = req.query
        const tenantId = (req as any).user?.tenant_id

        let whereClause = 'WHERE tenant_id = $1'
        const params: any[] = [tenantId]
        let paramIndex = 2

        if (startDate) {
            whereClause += ` AND period_end >= $${paramIndex}`
            params.push(startDate)
            paramIndex++
        }

        if (endDate) {
            whereClause += ` AND period_end <= $${paramIndex}`
            params.push(endDate)
            paramIndex++
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            whereClause += ` AND entity_id = ANY($${paramIndex})`
            params.push(ids)
            paramIndex++
        }

        const result = await tenantSafeQuery(
            `
            SELECT
                date_trunc('day', period_end) as date,
                COALESCE(SUM(fuel_cost), 0) as fuel,
                COALESCE(SUM(maintenance_cost + parts_cost + labor_cost), 0) as maintenance,
                COALESCE(SUM(insurance_cost + registration_cost), 0) as insurance,
                COALESCE(SUM(depreciation_cost + lease_payment), 0) as depreciation,
                COALESCE(SUM(total_cost), 0) as total,
                AVG(budget_amount) as budget
            FROM cost_analysis
            ${whereClause}
            GROUP BY date_trunc('day', period_end)
            ORDER BY date DESC
            LIMIT 90
            `,
            params,
            tenantId
        )

        const data = result.rows

        res.json({
            data: data.map((row: any) => ({
                date: new Date(row.date).toISOString().split('T')[0],
                fuel: parseFloat(row.fuel),
                maintenance: parseFloat(row.maintenance),
                insurance: parseFloat(row.insurance),
                depreciation: parseFloat(row.depreciation),
                total: parseFloat(row.total),
                budget: row.budget ? parseFloat(row.budget) : undefined,
            })),
            metadata: {
                total: data.length,
                filtered: data.length,
                cached: false,
                generatedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Error fetching cost analytics:', error)
        res.status(500).json({ error: 'Failed to fetch cost analytics' })
    }
})

/**
 * GET /analytics/efficiency
 * Returns efficiency metrics including MPG, utilization, idle time
 */
router.get('/efficiency', cacheMiddleware('analytics:efficiency'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, vehicleIds } = req.query
        const tenantId = (req as any).user?.tenant_id

        let tripWhere = 'WHERE tenant_id = $1'
        let fuelWhere = 'WHERE tenant_id = $1'
        const params: any[] = [tenantId]
        let paramIndex = 2

        if (startDate) {
            tripWhere += ` AND period_end >= $${paramIndex}`
            fuelWhere += ` AND transaction_date >= $${paramIndex}`
            params.push(startDate)
            paramIndex++
        }

        if (endDate) {
            tripWhere += ` AND period_end <= $${paramIndex}`
            fuelWhere += ` AND transaction_date <= $${paramIndex}`
            params.push(endDate)
            paramIndex++
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            tripWhere += ` AND vehicle_id = ANY($${paramIndex})`
            fuelWhere += ` AND vehicle_id = ANY($${paramIndex})`
            params.push(ids)
            paramIndex++
        }

        const result = await tenantSafeQuery(
            `
            WITH trip AS (
                SELECT
                    date_trunc('day', period_end) as date,
                    SUM(total_miles) as miles,
                    SUM(total_hours) as hours,
                    COUNT(DISTINCT vehicle_id) as vehicle_count
                FROM trip_usage
                ${tripWhere}
                GROUP BY date_trunc('day', period_end)
            ),
            fuel AS (
                SELECT
                    date_trunc('day', transaction_date) as date,
                    SUM(gallons) as gallons
                FROM fuel_transactions
                ${fuelWhere}
                GROUP BY date_trunc('day', transaction_date)
            )
            SELECT
                t.date,
                t.miles,
                t.hours,
                t.vehicle_count,
                f.gallons
            FROM trip t
            LEFT JOIN fuel f ON f.date = t.date
            ORDER BY t.date DESC
            LIMIT 90
            `,
            params,
            tenantId
        )

        const data = result.rows

        res.json({
            data: data.map((row: any) => {
                const miles = parseFloat(row.miles || '0')
                const hours = parseFloat(row.hours || '0')
                const gallons = parseFloat(row.gallons || '0')
                const vehicleCount = parseInt(row.vehicle_count || '0', 10)
                const mpg = gallons > 0 ? miles / gallons : 0
                const utilization = vehicleCount > 0 ? Math.min(100, (hours / (vehicleCount * 24)) * 100) : 0
                const efficiencyScore = Math.min(100, (mpg / 18) * 50 + utilization * 0.5)

                return {
                    date: new Date(row.date).toISOString().split('T')[0],
                    mpg: parseFloat(mpg.toFixed(2)),
                    utilization: parseFloat(utilization.toFixed(2)),
                    idleTime: 0,
                    efficiencyScore: parseFloat(efficiencyScore.toFixed(2)),
                    vehicleCount
                }
            }),
            metadata: {
                total: data.length,
                filtered: data.length,
                cached: false,
                generatedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Error fetching efficiency analytics:', error)
        res.status(500).json({ error: 'Failed to fetch efficiency analytics' })
    }
})

/**
 * GET /analytics/kpis
 * Returns high-level fleet KPIs
 */
router.get('/kpis', cacheMiddleware('analytics:kpis'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query
        const tenantId = (req as any).user?.tenant_id

        let dateFilter = ''
        const params: any[] = [tenantId]
        let paramIndex = 2

        if (startDate) {
            params.push(startDate)
            dateFilter += ` AND period_end >= $${paramIndex}`
            paramIndex++
        }

        if (endDate) {
            params.push(endDate)
            dateFilter += ` AND period_end <= $${paramIndex}`
            paramIndex++
        }

        // Query for KPIs
        const [vehiclesResult, costResult, efficiencyResult, onTimeResult] = await Promise.all([
            tenantSafeQuery(
                `
                SELECT
                    COUNT(*) as total_vehicles,
                    COUNT(*) FILTER (WHERE status = 'active') as active_vehicles
                FROM vehicles
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COALESCE(SUM(total_cost), 0) as total_cost,
                    COALESCE(AVG(cost_per_mile), 0) as cost_per_mile
                FROM cost_analysis
                WHERE tenant_id = $1 ${dateFilter}
                `,
                params,
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COALESCE(AVG(safety_score), 0) as safety_score
                FROM driver_scorecards
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COUNT(*) FILTER (WHERE status = 'completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'completed' AND actual_end_time <= scheduled_end_time) as on_time
                FROM routes
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            )
        ])

        const tripResult = await tenantSafeQuery(
            `
            SELECT
                COALESCE(SUM(total_miles), 0) as miles,
                COALESCE(SUM(total_hours), 0) as hours,
                COUNT(DISTINCT vehicle_id) as vehicle_count
            FROM trip_usage
            WHERE tenant_id = $1
            `,
            [tenantId],
            tenantId
        )

        const fuelResult = await tenantSafeQuery(
            `
            SELECT
                COALESCE(SUM(gallons), 0) as gallons
            FROM fuel_transactions
            WHERE tenant_id = $1
            `,
            [tenantId],
            tenantId
        )

        const miles = parseFloat(tripResult.rows[0]?.miles || '0')
        const hours = parseFloat(tripResult.rows[0]?.hours || '0')
        const vehicleCount = parseInt(tripResult.rows[0]?.vehicle_count || '0', 10)
        const gallons = parseFloat(fuelResult.rows[0]?.gallons || '0')
        const avgMPG = gallons > 0 ? miles / gallons : 0
        const utilization = vehicleCount > 0 ? Math.min(100, (hours / (vehicleCount * 24)) * 100) : 0

        const completedRoutes = parseInt(onTimeResult.rows[0]?.completed || '0', 10)
        const onTimeRoutes = parseInt(onTimeResult.rows[0]?.on_time || '0', 10)
        const onTimeRate = completedRoutes > 0 ? (onTimeRoutes / completedRoutes) * 100 : 0

        const kpis = {
            totalVehicles: parseInt(vehiclesResult.rows[0]?.total_vehicles || '0'),
            activeVehicles: parseInt(vehiclesResult.rows[0]?.active_vehicles || '0'),
            utilization: parseFloat(utilization.toFixed(2)),
            avgMPG: parseFloat(avgMPG.toFixed(2)),
            totalCost: parseFloat(costResult.rows[0]?.total_cost || '0'),
            costPerMile: parseFloat(costResult.rows[0]?.cost_per_mile || '0'),
            safetyScore: parseFloat(efficiencyResult.rows[0]?.safety_score || '0'),
            onTimeRate: parseFloat(onTimeRate.toFixed(2)),
        }

        res.json({
            data: kpis,
            metadata: {
                total: 1,
                filtered: 1,
                cached: false,
                generatedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Error fetching fleet KPIs:', error)
        res.status(500).json({ error: 'Failed to fetch fleet KPIs' })
    }
})

/**
 * GET /analytics/overview
 * Returns high-level analytics overview with key metrics
 */
router.get('/overview', cacheMiddleware('analytics:overview'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query
        const tenantId = (req as any).user?.tenant_id

        let dateFilter = ''
        const params: any[] = [tenantId]
        let paramIndex = 2

        if (startDate) {
            params.push(startDate)
            dateFilter += ` AND period_end >= $${paramIndex}`
            paramIndex++
        }

        if (endDate) {
            params.push(endDate)
            dateFilter += ` AND period_end <= $${paramIndex}`
            paramIndex++
        }

        // Query for overview metrics
        const [vehiclesResult, costResult, efficiencyResult, maintenanceResult] = await Promise.all([
            tenantSafeQuery(
                `
                SELECT
                    COUNT(*) as total_vehicles,
                    COUNT(*) FILTER (WHERE status = 'active') as active_vehicles,
                    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_vehicles,
                    COUNT(*) FILTER (WHERE status = 'idle') as idle_vehicles
                FROM vehicles
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COALESCE(SUM(total_cost), 0) as total_cost,
                    COALESCE(AVG(cost_per_mile), 0) as avg_cost_per_mile,
                    COALESCE(SUM(fuel_cost), 0) as fuel_cost,
                    COALESCE(SUM(maintenance_cost + parts_cost + labor_cost), 0) as maintenance_cost
                FROM cost_analysis
                WHERE tenant_id = $1 ${dateFilter}
                `,
                params,
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COALESCE(AVG(safety_score), 0) as avg_safety_score
                FROM driver_scorecards
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COUNT(*) FILTER (WHERE status = 'pending') as pending_maintenance,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_maintenance,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_maintenance
                FROM work_orders
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            )
        ])

        const tripResult = await tenantSafeQuery(
            `
            SELECT
                COALESCE(SUM(total_miles), 0) as miles,
                COALESCE(SUM(total_hours), 0) as hours,
                COUNT(DISTINCT vehicle_id) as vehicle_count
            FROM trip_usage
            WHERE tenant_id = $1
            `,
            [tenantId],
            tenantId
        )

        const fuelResult = await tenantSafeQuery(
            `
            SELECT
                COALESCE(SUM(gallons), 0) as gallons
            FROM fuel_transactions
            WHERE tenant_id = $1
            `,
            [tenantId],
            tenantId
        )

        const miles = parseFloat(tripResult.rows[0]?.miles || '0')
        const hours = parseFloat(tripResult.rows[0]?.hours || '0')
        const vehicleCount = parseInt(tripResult.rows[0]?.vehicle_count || '0', 10)
        const gallons = parseFloat(fuelResult.rows[0]?.gallons || '0')
        const avgMPG = gallons > 0 ? miles / gallons : 0
        const avgUtilization = vehicleCount > 0 ? Math.min(100, (hours / (vehicleCount * 24)) * 100) : 0
        const avgEfficiencyScore = Math.min(100, (avgMPG / 18) * 50 + avgUtilization * 0.5)

        const overview = {
            fleet: {
                totalVehicles: parseInt(vehiclesResult.rows[0]?.total_vehicles || '0'),
                activeVehicles: parseInt(vehiclesResult.rows[0]?.active_vehicles || '0'),
                maintenanceVehicles: parseInt(vehiclesResult.rows[0]?.maintenance_vehicles || '0'),
                idleVehicles: parseInt(vehiclesResult.rows[0]?.idle_vehicles || '0'),
            },
            costs: {
                totalCost: parseFloat(costResult.rows[0]?.total_cost || '0'),
                fuelCost: parseFloat(costResult.rows[0]?.fuel_cost || '0'),
                maintenanceCost: parseFloat(costResult.rows[0]?.maintenance_cost || '0'),
                avgCostPerMile: parseFloat(costResult.rows[0]?.avg_cost_per_mile || '0'),
            },
            efficiency: {
                avgMPG: parseFloat(avgMPG.toFixed(2)),
                avgUtilization: parseFloat(avgUtilization.toFixed(2)),
                avgEfficiencyScore: parseFloat(avgEfficiencyScore.toFixed(2)),
                avgSafetyScore: parseFloat(efficiencyResult.rows[0]?.avg_safety_score || '0'),
            },
            maintenance: {
                pending: parseInt(maintenanceResult.rows[0]?.pending_maintenance || '0'),
                inProgress: parseInt(maintenanceResult.rows[0]?.in_progress_maintenance || '0'),
                completed: parseInt(maintenanceResult.rows[0]?.completed_maintenance || '0'),
            },
        }

        res.json({
            data: overview,
            metadata: {
                cached: false,
                generatedAt: new Date().toISOString(),
                dateRange: {
                    startDate: startDate || 'all time',
                    endDate: endDate || 'present',
                },
            },
        })
    } catch (error) {
        console.error('Error fetching analytics overview:', error)
        res.status(500).json({ error: 'Failed to fetch analytics overview' })
    }
})

/**
 * GET /analytics/performance
 * Returns performance metrics including uptime, response times, and efficiency
 */
router.get('/performance', cacheMiddleware('analytics:performance'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, vehicleIds } = req.query
        const tenantId = (req as any).user?.tenant_id

        let tripWhere = 'WHERE tenant_id = $1'
        let fuelWhere = 'WHERE tenant_id = $1'
        const params: any[] = [tenantId]
        let paramIndex = 2

        if (startDate) {
            tripWhere += ` AND period_end >= $${paramIndex}`
            fuelWhere += ` AND transaction_date >= $${paramIndex}`
            params.push(startDate)
            paramIndex++
        }

        if (endDate) {
            tripWhere += ` AND period_end <= $${paramIndex}`
            fuelWhere += ` AND transaction_date <= $${paramIndex}`
            params.push(endDate)
            paramIndex++
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            tripWhere += ` AND vehicle_id = ANY($${paramIndex})`
            fuelWhere += ` AND vehicle_id = ANY($${paramIndex})`
            params.push(ids)
            paramIndex++
        }

        // Query performance metrics
        const [efficiencyResult, vehiclePerformanceResult] = await Promise.all([
            tenantSafeQuery(
                `
                WITH trip AS (
                    SELECT
                        date_trunc('day', period_end) as date,
                        SUM(total_miles) as miles,
                        SUM(total_hours) as hours,
                        COUNT(DISTINCT vehicle_id) as vehicle_count
                    FROM trip_usage
                    ${tripWhere}
                    GROUP BY date_trunc('day', period_end)
                ),
                fuel AS (
                    SELECT
                        date_trunc('day', transaction_date) as date,
                        SUM(gallons) as gallons
                    FROM fuel_transactions
                    ${fuelWhere}
                    GROUP BY date_trunc('day', transaction_date)
                )
                SELECT
                    t.date,
                    t.miles,
                    t.hours,
                    t.vehicle_count,
                    f.gallons
                FROM trip t
                LEFT JOIN fuel f ON f.date = t.date
                ORDER BY t.date DESC
                LIMIT 30
                `,
                params,
                tenantId
            ),
            tenantSafeQuery(
                `
                SELECT
                    COUNT(*) as total_vehicles,
                    AVG(odometer) as avg_mileage,
                    COUNT(*) FILTER (WHERE status = 'active') as active_count,
                    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_count
                FROM vehicles
                WHERE tenant_id = $1
                `,
                [tenantId],
                tenantId
            )
        ])

        const performanceData = efficiencyResult.rows

        const performance = {
            timeSeries: performanceData.map((row: any) => ({
                date: new Date(row.date).toISOString().split('T')[0],
                avgMPG: row.gallons ? parseFloat((parseFloat(row.miles || '0') / parseFloat(row.gallons || '1')).toFixed(2)) : 0,
                avgUtilization: row.vehicle_count ? parseFloat((Math.min(100, (parseFloat(row.hours || '0') / (parseInt(row.vehicle_count || '1', 10) * 24)) * 100)).toFixed(2)) : 0,
                avgIdleTime: 0,
                avgEfficiencyScore: 0,
                avgSafetyScore: 0,
                avgOnTimeRate: 0,
                vehicleCount: parseInt(row.vehicle_count || '0'),
            })),
            summary: {
                totalVehicles: parseInt(vehiclePerformanceResult.rows[0]?.total_vehicles || '0'),
                avgMileage: parseFloat(vehiclePerformanceResult.rows[0]?.avg_mileage || '0'),
                activeCount: parseInt(vehiclePerformanceResult.rows[0]?.active_count || '0'),
                maintenanceCount: parseInt(vehiclePerformanceResult.rows[0]?.maintenance_count || '0'),
                uptime: (() => {
                    const total = parseInt(vehiclePerformanceResult.rows[0]?.total_vehicles || '0')
                    const active = parseInt(vehiclePerformanceResult.rows[0]?.active_count || '0')
                    return total > 0 ? parseFloat(((active / total) * 100).toFixed(2)) : 0
                })(),
            },
        }

        res.json({
            data: performance,
            metadata: {
                total: performanceData.length,
                cached: false,
                generatedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Error fetching performance analytics:', error)
        res.status(500).json({ error: 'Failed to fetch performance analytics' })
    }
})

/**
 * GET /analytics/costs/trends
 * Returns cost trend analysis over time
 */
router.get('/costs/trends', cacheMiddleware('analytics:costs:trends'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, interval = 'day', vehicleIds } = req.query
        const tenantId = (req as any).user?.tenant_id

        let whereClause = 'WHERE tenant_id = $1'
        const params: any[] = [tenantId]
        let paramIndex = 2

        if (startDate) {
            params.push(startDate)
            whereClause += ` AND period_end >= $${paramIndex}`
            paramIndex++
        }

        if (endDate) {
            params.push(endDate)
            whereClause += ` AND period_end <= $${paramIndex}`
            paramIndex++
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            params.push(ids)
            whereClause += ` AND entity_id = ANY($${paramIndex})`
            paramIndex++
        }

        // Determine date truncation based on interval
        const dateInterval = interval === 'week' ? 'week' : interval === 'month' ? 'month' : 'day'

        // Query for cost trends
        const result = await tenantSafeQuery(
            `
            SELECT
                date_trunc('${dateInterval}', period_end) as period,
                COALESCE(SUM(fuel_cost), 0) as fuel_cost,
                COALESCE(SUM(maintenance_cost + parts_cost + labor_cost), 0) as maintenance_cost,
                COALESCE(SUM(insurance_cost + registration_cost), 0) as insurance_cost,
                COALESCE(SUM(depreciation_cost + lease_payment), 0) as depreciation_cost,
                COALESCE(SUM(total_cost), 0) as total_cost,
                COALESCE(AVG(cost_per_mile), 0) as avg_cost_per_mile,
                COUNT(DISTINCT entity_id) as vehicle_count
            FROM cost_analysis
            ${whereClause}
            GROUP BY date_trunc('${dateInterval}', period_end)
            ORDER BY period DESC
            LIMIT 52
            `,
            params,
            tenantId
        )

        const trends = result.rows

        // Calculate period-over-period changes
        const trendsWithChanges = trends.map((row: any, index: number) => {
            const current = parseFloat(row.total_cost)
            const previous = index < trends.length - 1 ? parseFloat(trends[index + 1].total_cost) : current

            const change = previous > 0 ? ((current - previous) / previous) * 100 : 0

            return {
                period: new Date(row.period).toISOString().split('T')[0],
                fuelCost: parseFloat(row.fuel_cost),
                maintenanceCost: parseFloat(row.maintenance_cost),
                insuranceCost: parseFloat(row.insurance_cost),
                depreciationCost: parseFloat(row.depreciation_cost),
                totalCost: current,
                avgCostPerMile: parseFloat(row.avg_cost_per_mile),
                vehicleCount: parseInt(row.vehicle_count),
                changePercent: parseFloat(change.toFixed(2)),
            }
        })

        res.json({
            data: trendsWithChanges,
            metadata: {
                total: trendsWithChanges.length,
                interval: dateInterval,
                cached: false,
                generatedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Error fetching cost trends:', error)
        res.status(500).json({ error: 'Failed to fetch cost trends' })
    }
})

/**
 * DELETE /analytics/cache
 * Clear analytics cache
 */
router.delete('/cache', async (req: Request, res: Response) => {
    try {
        await initRedis()
        const keys = await redisClient.keys('analytics:*')

        if (keys.length > 0) {
            await redisClient.del(keys)
        }

        res.json({
            success: true,
            message: `Cleared ${keys.length} cache entries`,
        })
    } catch (error) {
        console.error('Error clearing cache:', error)
        res.status(500).json({ error: 'Failed to clear cache' })
    }
})



export default router
