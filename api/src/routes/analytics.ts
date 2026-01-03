/**
 * Analytics API Routes
 * Features: Cost analytics, efficiency metrics, fleet KPIs with Redis caching
 */

import { Router, type Request, type Response } from 'express'
import { createClient } from 'redis'
import { query } from '../db'

const router = Router()

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
                const data = JSON.parse(cached)
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
        const result = await query(
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

        const result = await query(
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
            query(`
                SELECT
                    COUNT(*) as total_vehicles,
                    COUNT(*) FILTER (WHERE status = 'active') as active_vehicles
                FROM vehicles
            `),
            query(
                `
                SELECT
                    SUM(amount) as total_cost,
                    AVG(cost_per_mile) as cost_per_mile
                FROM fleet_costs
                WHERE 1=1 ${dateFilter}
                `,
                params
            ),
            query(
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

export default router
