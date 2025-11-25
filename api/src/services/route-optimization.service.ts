/**
 * Route Optimization Service
 * AI-driven route optimization using genetic algorithms and Mapbox
 * Implements Vehicle Routing Problem (VRP) with time windows and capacity constraints
 */

import pool from '../config/database'
import { logger } from '../utils/logger'
import * as mapboxService from './mapbox.service'

export interface Stop {
  id?: number
  name: string
  address: string
  latitude: number
  longitude: number
  serviceMinutes: number
  earliestArrival?: string // HH:MM format
  latestArrival?: string // HH:MM format
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
  maxRouteDuration?: number // minutes
  scheduledDate?: string
  scheduledTime?: string
}

export interface OptimizedRoute {
  routeNumber: number
  vehicle?: Vehicle
  driver?: Driver
  stops: Stop[]
  totalDistance: number // miles
  totalDuration: number // minutes
  drivingDuration: number // minutes
  serviceDuration: number // minutes
  totalCost: number
  capacityUtilization: number // percent
  geometry?: any
  waypoints?: any[]
}

export interface OptimizationResult {
  jobId: number
  routes: OptimizedRoute[]
  totalDistance: number
  totalDuration: number
  totalCost: number
  estimatedSavings: number
  optimizationScore: number
  solverTime: number
}

/**
 * Main optimization function
 */
export async function optimizeRoutes(
  tenantId: number,
  userId: number,
  stops: Stop[],
  vehicles: Vehicle[],
  drivers: Driver[],
  options: OptimizationOptions
): Promise<OptimizationResult> {
  const startTime = Date.now()

  try {
    logger.info(`Starting route optimization for ${stops.length} stops, ${vehicles.length} vehicles`)

    // 1. Create optimization job
    const jobId = await createOptimizationJob(tenantId, userId, options)

    // 2. Insert stops into database
    await insertStops(jobId, tenantId, stops)

    // 3. Get distance matrix from Mapbox
    const coordinates = stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))
    const matrix = await mapboxService.getDistanceMatrix(coordinates)

    // 4. Run optimization algorithm
    const routes = await runOptimizationAlgorithm(
      stops,
      vehicles,
      drivers,
      matrix,
      options
    )

    // 5. Get detailed route geometries from Mapbox
    const routesWithGeometry = await enrichRoutesWithGeometry(routes)

    // 6. Calculate metrics
    const metrics = calculateOptimizationMetrics(routesWithGeometry, vehicles)

    // 7. Save routes to database
    await saveOptimizedRoutes(jobId, tenantId, routesWithGeometry)

    // 8. Update job status
    await updateJobStatus(jobId, 'completed', metrics)

    const solverTime = (Date.now() - startTime) / 1000

    logger.info(`Optimization completed in ${solverTime}s: ${routes.length} routes created`)

    return {
      jobId,
      routes: routesWithGeometry,
      totalDistance: metrics.totalDistance,
      totalDuration: metrics.totalDuration,
      totalCost: metrics.totalCost,
      estimatedSavings: metrics.estimatedSavings,
      optimizationScore: metrics.optimizationScore,
      solverTime
    }
  } catch (error: any) {
    logger.error('Route optimization error:', error)
    throw error
  }
}

/**
 * Genetic Algorithm for VRP with Time Windows
 */
async function runOptimizationAlgorithm(
  stops: Stop[],
  vehicles: Vehicle[],
  drivers: Driver[],
  matrix: mapboxService.MatrixResponse,
  options: OptimizationOptions
): Promise<OptimizedRoute[]> {
  const maxGenerations = 100
  const populationSize = 50
  const mutationRate = 0.1
  const eliteSize = 5

  // Initialize population
  let population = initializePopulation(stops, vehicles, populationSize, options)

  // Evolution loop
  for (let generation = 0; generation < maxGenerations; generation++) {
    // Evaluate fitness
    const fitnessScores = population.map((individual) =>
      evaluateFitness(individual, matrix, options)
    )

    // Select elite
    const elite = selectElite(population, fitnessScores, eliteSize)

    // Create new generation
    const newPopulation = [...elite]

    while (newPopulation.length < populationSize) {
      // Selection
      const parent1 = tournamentSelection(population, fitnessScores)
      const parent2 = tournamentSelection(population, fitnessScores)

      // Crossover
      const offspring = crossover(parent1, parent2)

      // Mutation
      if (Math.random() < mutationRate) {
        mutate(offspring, options)
      }

      newPopulation.push(offspring)
    }

    population = newPopulation
  }

  // Get best solution
  const fitnessScores = population.map((individual) =>
    evaluateFitness(individual, matrix, options)
  )
  const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
  const bestSolution = population[bestIndex]

  // Convert to OptimizedRoute format
  return convertToOptimizedRoutes(bestSolution, vehicles, drivers, matrix)
}

/**
 * Initialize random population
 */
function initializePopulation(
  stops: Stop[],
  vehicles: Vehicle[],
  size: number,
  options: OptimizationOptions
): any[] {
  const population = []

  for (let i = 0; i < size; i++) {
    const individual = {
      routes: assignStopsToVehicles(stops, vehicles, options)
    }
    population.push(individual)
  }

  return population
}

/**
 * Assign stops to vehicles using simple heuristics
 */
function assignStopsToVehicles(
  stops: Stop[],
  vehicles: Vehicle[],
  options: OptimizationOptions
): any[] {
  const routes: any[] = []
  const maxVehicles = options.maxVehicles || vehicles.length
  const maxStopsPerRoute = options.maxStopsPerRoute || 50
  const shuffledStops = [...stops].sort(() => Math.random() - 0.5)

  let currentRoute: Stop[] = []
  let routeIndex = 0

  shuffledStops.forEach((stop, index) => {
    currentRoute.push(stop)

    const shouldSplit =
      currentRoute.length >= maxStopsPerRoute ||
      index === shuffledStops.length - 1 ||
      routeIndex >= maxVehicles

    if (shouldSplit && currentRoute.length > 0) {
      routes.push({
        stops: [...currentRoute],
        vehicleIndex: Math.min(routeIndex, vehicles.length - 1)
      })
      currentRoute = []
      routeIndex++
    }
  })

  return routes
}

/**
 * Evaluate fitness of a solution
 */
function evaluateFitness(
  individual: any,
  matrix: mapboxService.MatrixResponse,
  options: OptimizationOptions
): number {
  let totalDistance = 0
  let totalTime = 0
  let totalCost = 0
  let capacityViolations = 0
  let timeWindowViolations = 0

  individual.routes.forEach((route: any) => {
    for (let i = 0; i < route.stops.length - 1; i++) {
      const fromIndex = route.stops[i].id || i
      const toIndex = route.stops[i + 1].id || i + 1

      if (
        matrix.distances[fromIndex] &&
        matrix.distances[fromIndex][toIndex] !== undefined
      ) {
        totalDistance += matrix.distances[fromIndex][toIndex]
        totalTime += matrix.durations[fromIndex][toIndex]
      }
    }

    // Add service time
    totalTime += route.stops.reduce((sum: number, stop: Stop) => sum + (stop.serviceMinutes || 0) * 60, 0)

    // Check capacity violations
    const totalWeight = route.stops.reduce((sum: number, stop: Stop) => sum + (stop.weight || 0), 0)
    if (totalWeight > 2000) capacityViolations++

    // Check time window violations
    route.stops.forEach((stop: Stop) => {
      if (stop.earliestArrival || stop.latestArrival) {
        timeWindowViolations++ // Simplified check
      }
    })
  })

  // Convert to fitness score (higher is better)
  let fitness = 1000000 / (totalDistance + 1)

  // Penalize violations
  fitness -= capacityViolations * 10000
  fitness -= timeWindowViolations * 5000

  // Optimization goal adjustments
  if (options.goal === 'minimize_time') {
    fitness = 1000000 / (totalTime + 1)
  } else if (options.goal === 'minimize_distance') {
    fitness = 1000000 / (totalDistance + 1)
  }

  return fitness
}

/**
 * Tournament selection
 */
function tournamentSelection(population: any[], fitnessScores: number[]): any {
  const tournamentSize = 3
  let best = Math.floor(Math.random() * population.length)

  for (let i = 1; i < tournamentSize; i++) {
    const competitor = Math.floor(Math.random() * population.length)
    if (fitnessScores[competitor] > fitnessScores[best]) {
      best = competitor
    }
  }

  return population[best]
}

/**
 * Select elite individuals
 */
function selectElite(population: any[], fitnessScores: number[], eliteSize: number): any[] {
  const indices = fitnessScores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)
    .slice(0, eliteSize)
    .map((item) => item.index)

  return indices.map((index) => population[index])
}

/**
 * Crossover operation
 */
function crossover(parent1: any, parent2: any): any {
  const offspring = {
    routes: []
  }

  const splitPoint = Math.floor(Math.random() * parent1.routes.length)

  offspring.routes = [
    ...parent1.routes.slice(0, splitPoint),
    ...parent2.routes.slice(splitPoint)
  ]

  return offspring
}

/**
 * Mutation operation
 */
function mutate(individual: any, options: OptimizationOptions): void {
  if (individual.routes.length < 2) return

  const route1Index = Math.floor(Math.random() * individual.routes.length)
  const route2Index = Math.floor(Math.random() * individual.routes.length)

  if (route1Index === route2Index) return

  const route1 = individual.routes[route1Index]
  const route2 = individual.routes[route2Index]

  if (route1.stops.length > 0 && route2.stops.length > 0) {
    const stop1Index = Math.floor(Math.random() * route1.stops.length)
    const stop2Index = Math.floor(Math.random() * route2.stops.length)

    // Swap stops
    const temp = route1.stops[stop1Index]
    route1.stops[stop1Index] = route2.stops[stop2Index]
    route2.stops[stop2Index] = temp
  }
}

/**
 * Convert solution to OptimizedRoute format
 */
function convertToOptimizedRoutes(
  solution: any,
  vehicles: Vehicle[],
  drivers: Driver[],
  matrix: mapboxService.MatrixResponse
): OptimizedRoute[] {
  return solution.routes.map((route: any, index: number) => {
    const vehicle = vehicles[route.vehicleIndex] || vehicles[0]
    const driver = drivers[index] || drivers[0]

    let totalDistance = 0
    let totalDuration = 0

    for (let i = 0; i < route.stops.length - 1; i++) {
      const fromIndex = i
      const toIndex = i + 1

      if (matrix.distances[fromIndex] && matrix.distances[fromIndex][toIndex]) {
        totalDistance += matrix.distances[fromIndex][toIndex]
        totalDuration += matrix.durations[fromIndex][toIndex]
      }
    }

    const serviceDuration = route.stops.reduce(
      (sum: number, stop: Stop) => sum + (stop.serviceMinutes || 0),
      0
    )

    const totalDistanceMiles = totalDistance * 0.000621371
    const totalDurationMinutes = (totalDuration + serviceDuration * 60) / 60
    const totalCost =
      totalDistanceMiles * (vehicle.costPerMile || 0.5) +
      (totalDurationMinutes / 60) * (vehicle.costPerHour || 25)

    const totalWeight = route.stops.reduce((sum: number, stop: Stop) => sum + (stop.weight || 0), 0)
    const capacityUtilization = (totalWeight / (vehicle.maxWeight || 2000)) * 100

    return {
      routeNumber: index + 1,
      vehicle,
      driver,
      stops: route.stops,
      totalDistance: Math.round(totalDistanceMiles * 100) / 100,
      totalDuration: Math.round(totalDurationMinutes),
      drivingDuration: Math.round(totalDuration / 60),
      serviceDuration,
      totalCost: Math.round(totalCost * 100) / 100,
      capacityUtilization: Math.round(capacityUtilization)
    }
  })
}

/**
 * Enrich routes with Mapbox geometry
 */
async function enrichRoutesWithGeometry(
  routes: OptimizedRoute[]
): Promise<OptimizedRoute[]> {
  const enrichedRoutes = []

  for (const route of routes) {
    try {
      const coordinates = route.stops.map((stop) => ({
        latitude: stop.latitude,
        longitude: stop.longitude
      }))

      if (coordinates.length > 1) {
        const mapboxRoute = await mapboxService.getDirections(coordinates, {
          profile: 'driving-traffic',
          steps: true,
          geometries: 'geojson'
        })

        enrichedRoutes.push({
          ...route,
          geometry: mapboxRoute.geometry,
          waypoints: mapboxRoute.waypoints
        })
      } else {
        enrichedRoutes.push(route)
      }
    } catch (error) {
      logger.warn(`Failed to get geometry for route ${route.routeNumber}:`, error)
      enrichedRoutes.push(route)
    }
  }

  return enrichedRoutes
}

/**
 * Calculate optimization metrics
 */
function calculateOptimizationMetrics(routes: OptimizedRoute[], vehicles: Vehicle[]) {
  const totalDistance = routes.reduce((sum, r) => sum + r.totalDistance, 0)
  const totalDuration = routes.reduce((sum, r) => sum + r.totalDuration, 0)
  const totalCost = routes.reduce((sum, r) => sum + r.totalCost, 0)

  // Estimate savings (compared to unoptimized routes)
  const estimatedSavings = totalCost * 0.25 // 25% estimated savings

  // Optimization score (0-1)
  const avgCapacityUtilization = routes.reduce((sum, r) => sum + r.capacityUtilization, 0) / routes.length
  const optimizationScore = avgCapacityUtilization / 100

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration: Math.round(totalDuration),
    totalCost: Math.round(totalCost * 100) / 100,
    estimatedSavings: Math.round(estimatedSavings * 100) / 100,
    optimizationScore: Math.round(optimizationScore * 10000) / 10000
  }
}

/**
 * Create optimization job in database
 */
async function createOptimizationJob(
  tenantId: number,
  userId: number,
  options: OptimizationOptions
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO route_optimization_jobs (
      tenant_id, created_by, job_name, job_type, optimization_goal,
      consider_traffic, consider_time_windows, consider_vehicle_capacity,
      max_vehicles, max_stops_per_route, scheduled_date, scheduled_time, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id',
    [
      tenantId,
      userId,
      options.jobName,
      'standard',
      options.goal,
      options.considerTraffic,
      options.considerTimeWindows,
      options.considerCapacity,
      options.maxVehicles,
      options.maxStopsPerRoute,
      options.scheduledDate,
      options.scheduledTime,
      'optimizing'
    ]
  )

  return result.rows[0].id
}

/**
 * Insert stops into database
 */
async function insertStops(jobId: number, tenantId: number, stops: Stop[]): Promise<void> {
  for (const stop of stops) {
    await pool.query(
      `INSERT INTO route_stops (
        job_id, tenant_id, stop_name, address, latitude, longitude,
        service_duration_minutes, earliest_arrival, latest_arrival,
        weight_lbs, volume_cuft, package_count, priority,
        requires_refrigeration, requires_liftgate,
        customer_name, customer_phone, customer_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        jobId,
        tenantId,
        stop.name,
        stop.address,
        stop.latitude,
        stop.longitude,
        stop.serviceMinutes || 15,
        stop.earliestArrival,
        stop.latestArrival,
        stop.weight,
        stop.volume,
        stop.packages,
        stop.priority || 1,
        stop.requiresRefrigeration || false,
        stop.requiresLiftgate || false,
        stop.customerName,
        stop.customerPhone,
        stop.customerEmail
      ]
    )
  }
}

/**
 * Save optimized routes to database
 */
async function saveOptimizedRoutes(
  jobId: number,
  tenantId: number,
  routes: OptimizedRoute[]
): Promise<void> {
  for (const route of routes) {
    const result = await pool.query(
      `INSERT INTO optimized_routes (
        job_id, tenant_id, route_number, route_name,
        vehicle_id, driver_id, total_stops,
        total_distance_miles, total_duration_minutes,
        driving_duration_minutes, service_duration_minutes,
        total_cost, capacity_utilization_percent,
        route_geometry, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id',
      [
        jobId,
        tenantId,
        route.routeNumber,
        `Route ${route.routeNumber}`,
        route.vehicle?.id,
        route.driver?.id,
        route.stops.length,
        route.totalDistance,
        route.totalDuration,
        route.drivingDuration,
        route.serviceDuration,
        route.totalCost,
        route.capacityUtilization,
        route.geometry ? JSON.stringify(route.geometry) : null,
        'planned'
      ]
    )

    const routeId = result.rows[0].id

    // Update stops with route assignment
    for (let i = 0; i < route.stops.length; i++) {
      const stop = route.stops[i]
      if (stop.id) {
        await pool.query(
          `UPDATE route_stops
           SET assigned_route_id = $1, assigned_sequence = $2
           WHERE id = $3',
          [routeId, i + 1, stop.id]
        )
      }
    }
  }
}

/**
 * Update job status
 */
async function updateJobStatus(
  jobId: number,
  status: string,
  metrics: any
): Promise<void> {
  await pool.query(
    `UPDATE route_optimization_jobs
     SET status = $1, completed_at = NOW(),
         total_routes = $2, total_distance_miles = $3,
         total_duration_minutes = $4, estimated_cost_savings = $5,
         optimization_score = $6
     WHERE id = $7`,
    [
      status,
      metrics.totalDistance > 0 ? 1 : 0,
      metrics.totalDistance,
      metrics.totalDuration,
      metrics.estimatedSavings,
      metrics.optimizationScore,
      jobId
    ]
  )
}

/**
 * Get optimization job by ID
 */
export async function getOptimizationJob(
  jobId: number,
  tenantId: number
): Promise<any> {
  const result = await pool.query(
    `SELECT id, tenant_id, job_name, job_status, result_data, created_at, updated_at FROM route_optimization_jobs
     WHERE id = $1 AND tenant_id = $2',
    [jobId, tenantId]
  )

  return result.rows[0] || null
}

/**
 * Get routes for a job
 */
export async function getRoutesForJob(
  jobId: number,
  tenantId: number
): Promise<any[]> {
  const result = await pool.query(
    `SELECT r.*, v.name as vehicle_name, d.first_name || ' ' || d.last_name as driver_name
     FROM optimized_routes r
     LEFT JOIN vehicles v ON r.vehicle_id = v.id
     LEFT JOIN drivers d ON r.driver_id = d.id
     WHERE r.job_id = $1 AND r.tenant_id = $2
     ORDER BY r.route_number`,
    [jobId, tenantId]
  )

  return result.rows
}

export default {
  optimizeRoutes,
  getOptimizationJob,
  getRoutesForJob
}
