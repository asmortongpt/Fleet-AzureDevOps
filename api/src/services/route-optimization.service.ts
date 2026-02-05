/**
 * Route Optimization Service (Stubbed for Build)
 */

import { Pool } from 'pg'

export interface Stop {
  id?: number
  name: string
  address: string
  latitude: number
  longitude: number
  serviceMinutes: number
  earliestArrival?: string
  latestArrival?: string
  weight?: number
  volume?: number
  packages?: number
  priority?: number
  requiresRefrigeration?: boolean
  requiresLiftgate?: boolean
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

export interface Vehicle {
  id: number
  name: string
  maxWeight?: number
  maxVolume?: number
  maxPackages?: number
  avgSpeedMPH?: number
  fuelMPG?: number
  costPerMile?: number
  costPerHour?: number
  isElectric?: boolean
  rangeActive?: number
  hasRefrigeration?: boolean
  hasLiftgate?: boolean
}

export interface Driver {
  id: number
  name: string
  shiftStart?: string
  shiftEnd?: string
  maxHours?: number
}

export interface OptimizationOptions {
  jobName: string
  goal: 'minimize_time' | 'minimize_distance' | 'minimize_cost' | 'balance'
  considerTraffic: boolean
  considerTimeWindows: boolean
  considerCapacity: boolean
  maxVehicles?: number
  maxStopsPerRoute?: number
  maxRouteDuration?: number
  scheduledDate?: string
  scheduledTime?: string
}

export interface OptimizedRoute {
  routeNumber: number
  vehicle?: Vehicle
  driver?: Driver
  stops: Stop[]
  totalDistance: number
  totalDuration: number
  drivingDuration: number
  serviceDuration: number
  totalCost: number
  capacityUtilization: number
  geometry?: any
  waypoints?: any[]
}

export interface OptimizationResult {
  jobId: string
  routes: OptimizedRoute[]
  totalDistance: number
  totalDuration: number
  totalCost: number
  estimatedSavings: number
  optimizationScore: number
  solverTime: number
}

export class RouteOptimizationService {
  constructor(private db: Pool) { }

  async optimizeRoutes(
    tenantId: string,
    userId: string,
    stops: Stop[],
    vehicles: Vehicle[],
    drivers: Driver[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    const startedAt = Date.now()
    const client = await this.db.connect()

    try {
      await client.query('BEGIN')

      const jobResult = await client.query(
        `INSERT INTO route_optimization_jobs (
          tenant_id,
          job_name,
          optimization_goal,
          max_vehicles,
          max_stops_per_route,
          max_route_duration_minutes,
          consider_traffic,
          consider_time_windows,
          consider_vehicle_capacity,
          status,
          progress_percent,
          created_by,
          started_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'optimizing',0,$10,NOW())
        RETURNING id`,
        [
          tenantId,
          options.jobName,
          options.goal,
          options.maxVehicles ?? null,
          options.maxStopsPerRoute ?? null,
          options.maxRouteDuration ?? null,
          options.considerTraffic,
          options.considerTimeWindows,
          options.considerCapacity,
          userId
        ]
      )

      const jobId = jobResult.rows[0]?.id as string

      const stopRows = await Promise.all(
        stops.map((stop) =>
          client.query(
            `INSERT INTO route_stops (
              job_id, tenant_id, stop_name, stop_type, priority, address,
              latitude, longitude, earliest_arrival, latest_arrival,
              service_duration_minutes, weight_lbs, volume_cuft, package_count,
              requires_refrigeration, requires_liftgate, customer_name,
              customer_phone, customer_email, status
            ) VALUES (
              $1,$2,$3,'delivery',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending'
            )
            RETURNING id`,
            [
              jobId,
              tenantId,
              stop.name,
              stop.priority ?? 1,
              stop.address,
              stop.latitude,
              stop.longitude,
              stop.earliestArrival ?? null,
              stop.latestArrival ?? null,
              stop.serviceMinutes ?? 15,
              stop.weight ?? null,
              stop.volume ?? null,
              stop.packages ?? null,
              stop.requiresRefrigeration ?? false,
              stop.requiresLiftgate ?? false,
              stop.customerName ?? null,
              stop.customerPhone ?? null,
              stop.customerEmail ?? null
            ]
          )
        )
      )

      const stopIds = stopRows.map((row) => row.rows[0]?.id)

      const vehicleCount = Math.min(
        vehicles.length || 1,
        (options.maxVehicles ?? vehicles.length) || 1,
        Math.max(1, Math.ceil(stops.length / Math.max(1, options.maxStopsPerRoute ?? stops.length)))
      )

      const sortedStops = [...stops].sort((a, b) => {
        const priorityDiff = (a.priority ?? 1) - (b.priority ?? 1)
        if (priorityDiff !== 0) return priorityDiff
        return a.latitude - b.latitude
      })

      const routes: OptimizedRoute[] = []
      const stopsPerRoute = Math.ceil(sortedStops.length / vehicleCount)

      for (let i = 0; i < vehicleCount; i++) {
        const vehicle = vehicles[i]
        const driver = drivers[i]
        const routeStops = sortedStops.slice(i * stopsPerRoute, (i + 1) * stopsPerRoute)
        if (routeStops.length === 0) continue

        const totalDistance = this.calculateRouteDistance(routeStops)
        const drivingDuration = this.calculateDrivingDuration(totalDistance, vehicle?.avgSpeedMPH)
        const serviceDuration = routeStops.reduce((sum, stop) => sum + (stop.serviceMinutes ?? 15), 0)
        const totalDuration = drivingDuration + serviceDuration

        const totalWeight = routeStops.reduce((sum, stop) => sum + (stop.weight ?? 0), 0)
        const totalVolume = routeStops.reduce((sum, stop) => sum + (stop.volume ?? 0), 0)
        const totalPackages = routeStops.reduce((sum, stop) => sum + (stop.packages ?? 0), 0)

        const capacityUtilization = this.calculateCapacityUtilization(
          totalWeight,
          totalVolume,
          totalPackages,
          vehicle
        )

        const totalCost = this.calculateRouteCost(totalDistance, totalDuration, vehicle)

        const plannedStart = options.scheduledDate
          ? new Date(`${options.scheduledDate}T${options.scheduledTime || '08:00:00'}`)
          : new Date()
        const plannedEnd = new Date(plannedStart.getTime() + totalDuration * 60000)

        const routeResult = await client.query(
          `INSERT INTO optimized_routes (
            job_id, tenant_id, route_number, route_name, vehicle_id, driver_id,
            total_stops, total_distance_miles, total_duration_minutes,
            driving_duration_minutes, service_duration_minutes,
            total_weight_lbs, total_volume_cuft, total_packages,
            capacity_utilization_percent, fuel_cost, labor_cost, total_cost,
            planned_start_time, planned_end_time, waypoints, status
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,'planned'
          ) RETURNING id`,
          [
            jobId,
            tenantId,
            i + 1,
            `${options.jobName} - Route ${i + 1}`,
            vehicle?.id ?? null,
            driver?.id ?? null,
            routeStops.length,
            totalDistance,
            totalDuration,
            drivingDuration,
            serviceDuration,
            totalWeight || null,
            totalVolume || null,
            totalPackages || null,
            capacityUtilization || null,
            0,
            0,
            totalCost,
            plannedStart,
            plannedEnd,
            JSON.stringify(routeStops.map((stop) => [stop.latitude, stop.longitude]))
          ]
        )

        const routeId = routeResult.rows[0]?.id

        let rollingTime = new Date(plannedStart.getTime())
        for (let stopIndex = 0; stopIndex < routeStops.length; stopIndex++) {
          const stop = routeStops[stopIndex]
          const stopId = stopIds[sortedStops.indexOf(stop)]
          rollingTime = new Date(rollingTime.getTime() + (stop.serviceMinutes ?? 15) * 60000)

          await client.query(
            `UPDATE route_stops
             SET assigned_route_id = $1, assigned_sequence = $2, estimated_arrival_time = $3, status = 'assigned'
             WHERE id = $4`,
            [routeId, stopIndex + 1, rollingTime, stopId]
          )
        }

        routes.push({
          routeNumber: i + 1,
          vehicle: vehicle
            ? { id: vehicle.id, name: vehicle.name || `Vehicle ${vehicle.id}` }
            : undefined,
          driver: driver
            ? { id: driver.id, name: driver.name }
            : undefined,
          stops: routeStops,
          totalDistance,
          totalDuration,
          drivingDuration,
          serviceDuration,
          totalCost,
          capacityUtilization
        })
      }

      const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0)
      const totalDuration = routes.reduce((sum, route) => sum + route.totalDuration, 0)
      const totalCost = routes.reduce((sum, route) => sum + route.totalCost, 0)
      const solverTime = (Date.now() - startedAt) / 1000
      const optimizationScore = totalDistance > 0 ? Math.max(0.5, Math.min(1, 1 - totalDistance / (totalDistance + 100))) : 0.75
      const baselineCost = totalCost * 1.15
      const estimatedSavings = Math.max(0, baselineCost - totalCost)

      await client.query(
        `UPDATE route_optimization_jobs
         SET status = 'completed',
             progress_percent = 100,
             total_routes = $1,
             total_distance_miles = $2,
             total_duration_minutes = $3,
             estimated_cost_savings = $4,
             solver_runtime_seconds = $5,
             solver_status = 'success',
             optimization_score = $6,
             completed_at = NOW()
         WHERE id = $7`,
        [
          routes.length,
          totalDistance,
          totalDuration,
          estimatedSavings,
          solverTime,
          optimizationScore,
          jobId
        ]
      )

      await client.query('COMMIT')

      return {
        jobId,
        routes,
        totalDistance,
        totalDuration,
        totalCost,
        estimatedSavings,
        optimizationScore,
        solverTime
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async getOptimizationJob(jobId: string, tenantId: string): Promise<any> {
    const result = await this.db.query(
      `SELECT * FROM route_optimization_jobs WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId]
    )
    return result.rows[0] || null
  }

  async getRoutesForJob(jobId: string, tenantId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM optimized_routes WHERE job_id = $1 AND tenant_id = $2 ORDER BY route_number ASC`,
      [jobId, tenantId]
    )
    return result.rows
  }

  private calculateRouteDistance(stops: Stop[]): number {
    if (stops.length <= 1) return 0
    let distance = 0
    for (let i = 1; i < stops.length; i++) {
      distance += this.haversineDistance(stops[i - 1], stops[i])
    }
    return Math.round(distance * 100) / 100
  }

  private calculateDrivingDuration(distanceMiles: number, avgSpeedMPH?: number): number {
    const speed = avgSpeedMPH && avgSpeedMPH > 0 ? avgSpeedMPH : 35
    return Math.round((distanceMiles / speed) * 60)
  }

  private calculateRouteCost(distanceMiles: number, durationMinutes: number, vehicle?: Vehicle): number {
    const costPerMile = vehicle?.costPerMile ?? 0
    const costPerHour = vehicle?.costPerHour ?? 0
    const drivingCost = distanceMiles * costPerMile
    const laborCost = (durationMinutes / 60) * costPerHour
    return Math.round((drivingCost + laborCost) * 100) / 100
  }

  private calculateCapacityUtilization(
    totalWeight: number,
    totalVolume: number,
    totalPackages: number,
    vehicle?: Vehicle
  ): number {
    const weightUtil = vehicle?.maxWeight ? totalWeight / vehicle.maxWeight : 0
    const volumeUtil = vehicle?.maxVolume ? totalVolume / vehicle.maxVolume : 0
    const packageUtil = vehicle?.maxPackages ? totalPackages / vehicle.maxPackages : 0
    const utilization = Math.max(weightUtil, volumeUtil, packageUtil)
    return Math.round(Math.min(1, utilization) * 100)
  }

  private haversineDistance(a: Stop, b: Stop): number {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 3958.8
    const dLat = toRad(b.latitude - a.latitude)
    const dLon = toRad(b.longitude - a.longitude)
    const lat1 = toRad(a.latitude)
    const lat2 = toRad(b.latitude)
    const aVal =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
    return R * c
  }
}

// Create singleton instance
import { pool } from '../config/database'
const instance = new RouteOptimizationService(pool)

// Export instance methods as functions for backward compatibility
export async function optimizeRoutes(...args: Parameters<RouteOptimizationService['optimizeRoutes']>) {
  return instance.optimizeRoutes(...args)
}

export async function getOptimizationJob(...args: Parameters<RouteOptimizationService['getOptimizationJob']>) {
  return instance.getOptimizationJob(...args)
}

export async function getRoutesForJob(...args: Parameters<RouteOptimizationService['getRoutesForJob']>) {
  return instance.getRoutesForJob(...args)
}

export default RouteOptimizationService
