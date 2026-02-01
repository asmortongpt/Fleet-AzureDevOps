/**
 * Analytics API Routes
 * Features: Cost analytics, efficiency metrics, fleet KPIs with Redis caching
 */

import { Router, type Request, type Response } from 'express'
import { createClient } from 'redis'

import { db } from '../db'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

// Apply authentication to all routes
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
 * GET /analytics/cost
 * Returns cost analytics data with breakdown by category
 */
router.get('/cost', cacheMiddleware('analytics:cost'), async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, vehicleIds } = req.query

        let whereClause = '1=1'
        const params: any[] = []

        if (startDate) {
            params.push(startDate)
            whereClause += ` AND date >= $${params.length}`
        }

        if (endDate) {
            params.push(endDate)
            whereClause += ` AND date <= $${params.length}`
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            params.push(ids)
            whereClause += ` AND vehicle_id = ANY($${params.length})`
        }

        // Query for cost data
        const result = await db.query(
            `
            SELECT
                date_trunc('day', date) as date,
                COALESCE(SUM(CASE WHEN category = 'fuel' THEN amount ELSE 0 END), 0) as fuel,
                COALESCE(SUM(CASE WHEN category = 'maintenance' THEN amount ELSE 0 END), 0) as maintenance,
                COALESCE(SUM(CASE WHEN category = 'insurance' THEN amount ELSE 0 END), 0) as insurance,
                COALESCE(SUM(CASE WHEN category = 'depreciation' THEN amount ELSE 0 END), 0) as depreciation,
                COALESCE(SUM(amount), 0) as total,
                AVG(budget) as budget
            FROM fleet_costs
            WHERE ${whereClause}
            GROUP BY date_trunc('day', date)
            ORDER BY date DESC
            LIMIT 90
            `,
            params
        )

        // If no data from DB, return demo data
        const data = result.rows.length > 0 ? result.rows : generateDemoCostData()

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

        let whereClause = '1=1'
        const params: any[] = []

        if (startDate) {
            params.push(startDate)
            whereClause += ` AND date >= $${params.length}`
        }

        if (endDate) {
            params.push(endDate)
            whereClause += ` AND date <= $${params.length}`
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            params.push(ids)
            whereClause += ` AND vehicle_id = ANY($${params.length})`
        }

        const result = await db.query(
            `
            SELECT
                date_trunc('day', date) as date,
                AVG(mpg) as mpg,
                AVG(utilization) as utilization,
                AVG(idle_time) as idle_time,
                AVG(efficiency_score) as efficiency_score,
                COUNT(DISTINCT vehicle_id) as vehicle_count
            FROM fleet_efficiency
            WHERE ${whereClause}
            GROUP BY date_trunc('day', date)
            ORDER BY date DESC
            LIMIT 90
            `,
            params
        )

        const data = result.rows.length > 0 ? result.rows : generateDemoEfficiencyData()

        res.json({
            data: data.map((row: any) => ({
                date: new Date(row.date).toISOString().split('T')[0],
                mpg: parseFloat(row.mpg),
                utilization: parseFloat(row.utilization),
                idleTime: parseFloat(row.idle_time),
                efficiencyScore: parseFloat(row.efficiency_score),
                vehicleCount: parseInt(row.vehicle_count),
            })),
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

        let dateFilter = ''
        const params: any[] = []

        if (startDate) {
            params.push(startDate)
            dateFilter += ` AND date >= $${params.length}`
        }

        if (endDate) {
            params.push(endDate)
            dateFilter += ` AND date <= $${params.length}`
        }

        // Query for KPIs
        const [vehiclesResult, costResult, efficiencyResult] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) as total_vehicles,
                    COUNT(*) FILTER (WHERE status = 'active') as active_vehicles
                FROM vehicles
            `),
            db.query(
                `
                SELECT
                    SUM(amount) as total_cost,
                    AVG(cost_per_mile) as cost_per_mile
                FROM fleet_costs
                WHERE 1=1 ${dateFilter}
                `,
                params
            ),
            db.query(
                `
                SELECT
                    AVG(mpg) as avg_mpg,
                    AVG(utilization) as utilization,
                    AVG(safety_score) as safety_score,
                    AVG(on_time_rate) as on_time_rate
                FROM fleet_efficiency
                WHERE 1=1 ${dateFilter}
                `,
                params
            ),
        ])

        const kpis = {
            totalVehicles: parseInt(vehiclesResult.rows[0]?.total_vehicles || '0'),
            activeVehicles: parseInt(vehiclesResult.rows[0]?.active_vehicles || '0'),
            utilization: parseFloat(efficiencyResult.rows[0]?.utilization || '0'),
            avgMPG: parseFloat(efficiencyResult.rows[0]?.avg_mpg || '0'),
            totalCost: parseFloat(costResult.rows[0]?.total_cost || '0'),
            costPerMile: parseFloat(costResult.rows[0]?.cost_per_mile || '0'),
            safetyScore: parseFloat(efficiencyResult.rows[0]?.safety_score || '0'),
            onTimeRate: parseFloat(efficiencyResult.rows[0]?.on_time_rate || '0'),
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

        let dateFilter = ''
        const params: any[] = []

        if (startDate) {
            params.push(startDate)
            dateFilter += ` AND date >= $${params.length}`
        }

        if (endDate) {
            params.push(endDate)
            dateFilter += ` AND date <= $${params.length}`
        }

        // Query for overview metrics
        const [vehiclesResult, costResult, efficiencyResult, maintenanceResult] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) as total_vehicles,
                    COUNT(*) FILTER (WHERE status = 'active') as active_vehicles,
                    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_vehicles,
                    COUNT(*) FILTER (WHERE status = 'idle') as idle_vehicles
                FROM vehicles
            `),
            db.query(
                `
                SELECT
                    COALESCE(SUM(amount), 0) as total_cost,
                    COALESCE(AVG(cost_per_mile), 0) as avg_cost_per_mile,
                    COALESCE(SUM(CASE WHEN category = 'fuel' THEN amount ELSE 0 END), 0) as fuel_cost,
                    COALESCE(SUM(CASE WHEN category = 'maintenance' THEN amount ELSE 0 END), 0) as maintenance_cost
                FROM fleet_costs
                WHERE 1=1 ${dateFilter}
                `,
                params
            ),
            db.query(
                `
                SELECT
                    COALESCE(AVG(mpg), 0) as avg_mpg,
                    COALESCE(AVG(utilization), 0) as avg_utilization,
                    COALESCE(AVG(efficiency_score), 0) as avg_efficiency_score,
                    COALESCE(AVG(safety_score), 0) as avg_safety_score
                FROM fleet_efficiency
                WHERE 1=1 ${dateFilter}
                `,
                params
            ),
            db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE status = 'pending') as pending_maintenance,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_maintenance,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_maintenance
                FROM maintenance_records
            `)
        ])

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
                avgMPG: parseFloat(efficiencyResult.rows[0]?.avg_mpg || '0'),
                avgUtilization: parseFloat(efficiencyResult.rows[0]?.avg_utilization || '0'),
                avgEfficiencyScore: parseFloat(efficiencyResult.rows[0]?.avg_efficiency_score || '0'),
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

        let whereClause = '1=1'
        const params: any[] = []

        if (startDate) {
            params.push(startDate)
            whereClause += ` AND date >= $${params.length}`
        }

        if (endDate) {
            params.push(endDate)
            whereClause += ` AND date <= $${params.length}`
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            params.push(ids)
            whereClause += ` AND vehicle_id = ANY($${params.length})`
        }

        // Query performance metrics
        const [efficiencyResult, vehiclePerformanceResult] = await Promise.all([
            db.query(
                `
                SELECT
                    date_trunc('day', date) as date,
                    AVG(mpg) as avg_mpg,
                    AVG(utilization) as avg_utilization,
                    AVG(idle_time) as avg_idle_time,
                    AVG(efficiency_score) as avg_efficiency_score,
                    AVG(safety_score) as avg_safety_score,
                    AVG(on_time_rate) as avg_on_time_rate,
                    COUNT(DISTINCT vehicle_id) as vehicle_count
                FROM fleet_efficiency
                WHERE ${whereClause}
                GROUP BY date_trunc('day', date)
                ORDER BY date DESC
                LIMIT 30
                `,
                params
            ),
            db.query(`
                SELECT
                    COUNT(*) as total_vehicles,
                    AVG(mileage) as avg_mileage,
                    COUNT(*) FILTER (WHERE status = 'active') as active_count,
                    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_count
                FROM vehicles
            `)
        ])

        const performanceData = efficiencyResult.rows.length > 0 ? efficiencyResult.rows : generateDemoPerformanceData()

        const performance = {
            timeSeries: performanceData.map((row: any) => ({
                date: new Date(row.date).toISOString().split('T')[0],
                avgMPG: parseFloat(row.avg_mpg || '0'),
                avgUtilization: parseFloat(row.avg_utilization || '0'),
                avgIdleTime: parseFloat(row.avg_idle_time || '0'),
                avgEfficiencyScore: parseFloat(row.avg_efficiency_score || '0'),
                avgSafetyScore: parseFloat(row.avg_safety_score || '0'),
                avgOnTimeRate: parseFloat(row.avg_on_time_rate || '0'),
                vehicleCount: parseInt(row.vehicle_count || '0'),
            })),
            summary: {
                totalVehicles: parseInt(vehiclePerformanceResult.rows[0]?.total_vehicles || '0'),
                avgMileage: parseFloat(vehiclePerformanceResult.rows[0]?.avg_mileage || '0'),
                activeCount: parseInt(vehiclePerformanceResult.rows[0]?.active_count || '0'),
                maintenanceCount: parseInt(vehiclePerformanceResult.rows[0]?.maintenance_count || '0'),
                uptime: 99.5, // Calculate from actual data
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

        let whereClause = '1=1'
        const params: any[] = []

        if (startDate) {
            params.push(startDate)
            whereClause += ` AND date >= $${params.length}`
        }

        if (endDate) {
            params.push(endDate)
            whereClause += ` AND date <= $${params.length}`
        }

        if (vehicleIds && typeof vehicleIds === 'string') {
            const ids = vehicleIds.split(',')
            params.push(ids)
            whereClause += ` AND vehicle_id = ANY($${params.length})`
        }

        // Determine date truncation based on interval
        const dateInterval = interval === 'week' ? 'week' : interval === 'month' ? 'month' : 'day'

        // Query for cost trends
        const result = await db.query(
            `
            SELECT
                date_trunc('${dateInterval}', date) as period,
                COALESCE(SUM(CASE WHEN category = 'fuel' THEN amount ELSE 0 END), 0) as fuel_cost,
                COALESCE(SUM(CASE WHEN category = 'maintenance' THEN amount ELSE 0 END), 0) as maintenance_cost,
                COALESCE(SUM(CASE WHEN category = 'insurance' THEN amount ELSE 0 END), 0) as insurance_cost,
                COALESCE(SUM(CASE WHEN category = 'depreciation' THEN amount ELSE 0 END), 0) as depreciation_cost,
                COALESCE(SUM(amount), 0) as total_cost,
                COALESCE(AVG(cost_per_mile), 0) as avg_cost_per_mile,
                COUNT(DISTINCT vehicle_id) as vehicle_count
            FROM fleet_costs
            WHERE ${whereClause}
            GROUP BY date_trunc('${dateInterval}', date)
            ORDER BY period DESC
            LIMIT 52
            `,
            params
        )

        const trends = result.rows.length > 0 ? result.rows : generateDemoCostTrends(dateInterval)

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

// Demo data generators (used when DB is empty)
function generateDemoCostData() {
    const data = []
    const today = new Date()

    for (let i = 90; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        data.push({
            date: date,
            fuel: Math.random() * 10000 + 5000,
            maintenance: Math.random() * 5000 + 2000,
            insurance: Math.random() * 2000 + 1000,
            depreciation: Math.random() * 3000 + 1500,
            total: 0, // Will be calculated
            budget: 25000,
        })

        const last = data[data.length - 1]
        last.total = last.fuel + last.maintenance + last.insurance + last.depreciation
    }

    return data
}

function generateDemoEfficiencyData() {
    const data = []
    const today = new Date()

    for (let i = 90; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        data.push({
            date: date,
            mpg: Math.random() * 10 + 15,
            utilization: Math.random() * 30 + 70,
            idle_time: Math.random() * 5 + 1,
            efficiency_score: Math.random() * 20 + 80,
            vehicle_count: 150,
        })
    }

    return data
}

function generateDemoPerformanceData() {
    const data = []
    const today = new Date()

    for (let i = 30; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        data.push({
            date: date,
            avg_mpg: Math.random() * 10 + 15,
            avg_utilization: Math.random() * 30 + 70,
            avg_idle_time: Math.random() * 5 + 1,
            avg_efficiency_score: Math.random() * 20 + 80,
            avg_safety_score: Math.random() * 15 + 85,
            avg_on_time_rate: Math.random() * 10 + 90,
            vehicle_count: 150,
        })
    }

    return data
}

function generateDemoCostTrends(interval: string) {
    const data = []
    const today = new Date()
    const periods = interval === 'month' ? 12 : interval === 'week' ? 52 : 90

    for (let i = periods; i >= 0; i--) {
        const date = new Date(today)
        if (interval === 'month') {
            date.setMonth(date.getMonth() - i)
        } else if (interval === 'week') {
            date.setDate(date.getDate() - (i * 7))
        } else {
            date.setDate(date.getDate() - i)
        }

        const fuelCost = Math.random() * 10000 + 5000
        const maintenanceCost = Math.random() * 5000 + 2000
        const insuranceCost = Math.random() * 2000 + 1000
        const depreciationCost = Math.random() * 3000 + 1500

        data.push({
            period: date,
            fuel_cost: fuelCost,
            maintenance_cost: maintenanceCost,
            insurance_cost: insuranceCost,
            depreciation_cost: depreciationCost,
            total_cost: fuelCost + maintenanceCost + insuranceCost + depreciationCost,
            avg_cost_per_mile: Math.random() * 1 + 1.5,
            vehicle_count: 150,
        })
    }

    return data
}

export default router
