/**
 * RealisticGPSEmulator - Production-grade GPS/telemetry emulation
 *
 * Features:
 * - Physics-based vehicle movement with acceleration/deceleration
 * - Speed limits based on road type and traffic conditions
 * - Realistic GPS signal characteristics (HDOP, satellite count, accuracy)
 * - Traffic pattern simulation based on time of day
 * - Weather effects on movement
 * - Driver behavior influence on speed profiles
 * - Smooth cornering with speed reduction
 * - Realistic route following with waypoint transitions
 * - Stop duration at waypoints with realistic timing
 */

import { EventEmitter } from 'events'
import {
  Vehicle,
  Location,
  GPSTelemetry,
  EmulatorConfig,
  Route,
  Geofence,
  Waypoint
} from '../types'

interface MovementState {
  // Position
  currentLat: number
  currentLng: number
  altitude: number

  // Velocity
  speed: number // mph
  targetSpeed: number
  heading: number // degrees
  targetHeading: number

  // Acceleration
  acceleration: number // mph/s
  maxAcceleration: number
  maxDeceleration: number

  // Odometer
  odometer: number // miles

  // Status
  isMoving: boolean
  isAtStop: boolean
  stopUntil: Date | null
  isTurning: boolean
}

interface TrafficCondition {
  level: 'light' | 'moderate' | 'heavy' | 'standstill'
  speedMultiplier: number
  stopProbability: number
}

// Speed limits by road type (mph)
const SPEED_LIMITS = {
  highway: { min: 55, max: 75, cruise: 70 },
  city: { min: 15, max: 35, cruise: 30 },
  residential: { min: 10, max: 25, cruise: 20 },
  parking: { min: 0, max: 10, cruise: 5 },
  construction: { min: 10, max: 35, cruise: 25 }
}

// Acceleration/deceleration by vehicle type (mph/s)
const VEHICLE_DYNAMICS = {
  sedan: { maxAccel: 8, maxDecel: 15, cornering: 0.7 },
  suv: { maxAccel: 6, maxDecel: 12, cornering: 0.65 },
  truck: { maxAccel: 4, maxDecel: 10, cornering: 0.55 },
  van: { maxAccel: 5, maxDecel: 11, cornering: 0.6 },
  excavator: { maxAccel: 1.5, maxDecel: 3, cornering: 0.3 },
  dump_truck: { maxAccel: 2, maxDecel: 5, cornering: 0.4 },
  trailer: { maxAccel: 3, maxDecel: 8, cornering: 0.45 }
}

export class RealisticGPSEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private geofences: Map<string, Geofence>

  private state: MovementState
  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  // Route tracking
  private currentRoute: Route | null = null
  private currentWaypointIndex: number = 0
  private targetWaypoint: Waypoint | null = null
  private distanceToTarget: number = 0

  // Traffic and weather
  private currentTraffic: TrafficCondition
  private weatherCondition: 'clear' | 'rain' | 'fog' = 'clear'

  // GPS simulation
  private gpsNoiseLevel: number = 0
  private lastPositionUpdate: Date

  // Geofence tracking
  private currentGeofences: Set<string> = new Set()

  constructor(vehicle: Vehicle, config: EmulatorConfig, geofences: Map<string, Geofence>) {
    super()
    this.vehicle = vehicle
    this.config = config
    this.geofences = geofences

    // Initialize movement state
    this.state = this.getInitialState()

    // Initialize traffic based on time of day
    this.currentTraffic = this.getTrafficCondition()

    this.lastPositionUpdate = new Date()
  }

  /**
   * Get initial state
   */
  private getInitialState(): MovementState {
    const dynamics = this.getVehicleDynamics()

    return {
      currentLat: this.vehicle.startingLocation.lat,
      currentLng: this.vehicle.startingLocation.lng,
      altitude: 50 + Math.random() * 50, // meters above sea level (FL is flat)

      speed: 0,
      targetSpeed: 0,
      heading: Math.random() * 360,
      targetHeading: 0,

      acceleration: 0,
      maxAcceleration: dynamics.maxAccel,
      maxDeceleration: dynamics.maxDecel,

      odometer: this.vehicle.startingLocation.altitude || Math.random() * 50000,

      isMoving: false,
      isAtStop: true,
      stopUntil: null,
      isTurning: false
    }
  }

  /**
   * Get vehicle dynamics
   */
  private getVehicleDynamics(): { maxAccel: number; maxDecel: number; cornering: number } {
    const type = this.vehicle.type
    return VEHICLE_DYNAMICS[type as keyof typeof VEHICLE_DYNAMICS] || VEHICLE_DYNAMICS.sedan
  }

  /**
   * Get traffic condition based on time of day
   */
  private getTrafficCondition(): TrafficCondition {
    const hour = new Date().getHours()
    const day = new Date().getDay()
    const isWeekend = day === 0 || day === 6

    // Rush hour patterns
    if (!isWeekend) {
      if ((hour >= 7 && hour < 9) || (hour >= 16 && hour < 19)) {
        return { level: 'heavy', speedMultiplier: 0.5, stopProbability: 0.1 }
      }
    }

    if (hour >= 10 && hour < 16) {
      return { level: 'moderate', speedMultiplier: 0.75, stopProbability: 0.03 }
    }

    if (hour >= 22 || hour < 6) {
      return { level: 'light', speedMultiplier: 1.0, stopProbability: 0.01 }
    }

    return { level: 'moderate', speedMultiplier: 0.8, stopProbability: 0.05 }
  }

  /**
   * Start GPS emulation
   */
  public async start(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    this.isPaused = false

    // Assign a random route if none set
    if (!this.currentRoute) {
      this.selectRandomRoute()
    }

    const updateFrequency = this.config.gps?.updateFrequency || 1000

    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.update()
      }
    }, updateFrequency)

    console.log(`RealisticGPSEmulator started for vehicle ${this.vehicle.id}`)
  }

  /**
   * Stop GPS emulation
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.isRunning = false
    this.isPaused = false

    console.log(`RealisticGPSEmulator stopped for vehicle ${this.vehicle.id}`)
  }

  public async pause(): Promise<void> {
    this.isPaused = true
    this.state.isMoving = false
    this.state.speed = 0
  }

  public async resume(): Promise<void> {
    this.isPaused = false
  }

  /**
   * Set route for vehicle
   */
  public setRoute(route: Route): void {
    this.currentRoute = route
    this.currentWaypointIndex = 0
    this.targetWaypoint = route.waypoints[0] || null
    this.calculateDistanceToTarget()
    console.log(`Route "${route.name}" assigned to vehicle ${this.vehicle.id}`)
  }

  /**
   * Select a random route with realistic road-like paths
   */
  private selectRandomRoute(): void {
    const center = this.vehicle.startingLocation
    const radius = 0.015 + Math.random() * 0.025 // ~1.5-4km radius

    // Generate main destination points
    const numDestinations = 4 + Math.floor(Math.random() * 4) // 4-7 destinations
    const destinations: { lat: number; lng: number; name: string; stopDuration: number }[] = []

    for (let i = 0; i < numDestinations; i++) {
      const angle = (i / numDestinations) * 2 * Math.PI + (Math.random() - 0.5) * 0.5
      const dist = radius * (0.5 + Math.random() * 0.5)
      destinations.push({
        lat: center.lat + dist * Math.cos(angle),
        lng: center.lng + dist * Math.sin(angle),
        name: `Stop ${i + 1}`,
        stopDuration: i === Math.floor(numDestinations / 2) ? 10 + Math.random() * 10 : 3 + Math.random() * 7
      })
    }

    // Generate road-like path between all destinations
    const waypoints: Waypoint[] = [
      { ...center, name: 'Start - Depot', type: 'depot', stopDuration: 0 }
    ]

    let prevPoint = center
    const roadTypes: string[] = []

    for (let i = 0; i < destinations.length; i++) {
      const dest = destinations[i]

      // Generate road segments between prevPoint and dest
      const segmentWaypoints = this.generateRoadSegment(prevPoint, dest)

      // Add intermediate waypoints (no stop)
      for (const wp of segmentWaypoints) {
        waypoints.push({
          lat: wp.lat,
          lng: wp.lng,
          name: '',
          type: 'waypoint',
          stopDuration: 0
        })
        roadTypes.push(wp.roadType || 'city')
      }

      // Add destination with stop
      waypoints.push({
        lat: dest.lat,
        lng: dest.lng,
        name: dest.name,
        type: i === Math.floor(numDestinations / 2) ? 'break' : 'delivery',
        stopDuration: dest.stopDuration
      })
      roadTypes.push('city')

      prevPoint = dest
    }

    // Return path to depot
    const returnSegment = this.generateRoadSegment(prevPoint, center)
    for (const wp of returnSegment) {
      waypoints.push({
        lat: wp.lat,
        lng: wp.lng,
        name: '',
        type: 'waypoint',
        stopDuration: 0
      })
      roadTypes.push(wp.roadType || 'city')
    }
    waypoints.push({ ...center, name: 'Return to Depot', type: 'depot', stopDuration: 0 })
    roadTypes.push('city')

    this.currentRoute = {
      id: `AUTO-${this.vehicle.id}`,
      name: `Auto Route for ${this.vehicle.id}`,
      description: 'Auto-generated delivery route',
      type: 'delivery',
      estimatedDuration: 120,
      estimatedDistance: 15,
      waypoints,
      roadTypes,
      trafficPatterns: {}
    }

    this.currentWaypointIndex = 0
    this.targetWaypoint = waypoints[0]
    this.calculateDistanceToTarget()
  }

  /**
   * Generate road-like path segment between two points
   * Simulates realistic street navigation with turns and curves
   */
  private generateRoadSegment(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Array<{ lat: number; lng: number; roadType: string }> {
    const waypoints: Array<{ lat: number; lng: number; roadType: string }> = []

    const dx = to.lng - from.lng
    const dy = to.lat - from.lat
    const distance = Math.sqrt(dx * dx + dy * dy)

    // More waypoints for longer distances
    const numSegments = Math.max(3, Math.floor(distance / 0.003)) // ~every 300m

    // Choose road pattern type randomly
    const patternType = Math.floor(Math.random() * 4)

    for (let i = 1; i < numSegments; i++) {
      const t = i / numSegments
      let lat: number, lng: number
      let roadType = 'city'

      switch (patternType) {
        case 0:
          // Grid-like: go horizontal then vertical (with some variation)
          if (t < 0.45) {
            const segT = t / 0.45
            lat = from.lat + dy * 0.1 * segT + (Math.random() - 0.5) * 0.0005
            lng = from.lng + dx * segT + (Math.random() - 0.5) * 0.0003
            roadType = 'city'
          } else if (t < 0.55) {
            // Turn
            const segT = (t - 0.45) / 0.1
            lat = from.lat + dy * 0.1 + dy * 0.3 * segT
            lng = from.lng + dx * (0.45 + 0.1 * segT)
            roadType = 'residential'
          } else {
            const segT = (t - 0.55) / 0.45
            lat = from.lat + dy * 0.4 + dy * 0.6 * segT + (Math.random() - 0.5) * 0.0005
            lng = from.lng + dx * 0.55 + dx * 0.45 * segT + (Math.random() - 0.5) * 0.0003
            roadType = i > numSegments * 0.7 ? 'residential' : 'city'
          }
          break

        case 1:
          // Curved path using quadratic bezier
          const controlOffset = 0.3 + Math.random() * 0.4
          const controlLat = from.lat + dy * 0.5 + dx * controlOffset * (Math.random() > 0.5 ? 1 : -1)
          const controlLng = from.lng + dx * 0.5 + dy * controlOffset * (Math.random() > 0.5 ? 1 : -1)

          const t1 = 1 - t
          lat = t1 * t1 * from.lat + 2 * t1 * t * controlLat + t * t * to.lat
          lng = t1 * t1 * from.lng + 2 * t1 * t * controlLng + t * t * to.lng
          // Add small road noise
          lat += (Math.random() - 0.5) * 0.0003
          lng += (Math.random() - 0.5) * 0.0003
          roadType = t > 0.3 && t < 0.7 ? 'highway' : 'city'
          break

        case 2:
          // Zigzag pattern (simulating city blocks)
          const zigzagFreq = 3 + Math.floor(Math.random() * 2)
          const zigzagPhase = (Math.floor(t * zigzagFreq) % 2 === 0)
          const localT = (t * zigzagFreq) % 1

          if (zigzagPhase) {
            lat = from.lat + dy * t + (Math.random() - 0.5) * 0.0002
            lng = from.lng + dx * (Math.floor(t * zigzagFreq) / zigzagFreq + localT * (1 / zigzagFreq))
          } else {
            lat = from.lat + dy * (Math.floor(t * zigzagFreq) / zigzagFreq + localT * (1 / zigzagFreq))
            lng = from.lng + dx * t + (Math.random() - 0.5) * 0.0002
          }
          roadType = 'residential'
          break

        case 3:
        default:
          // S-curve pattern
          const curveAmplitude = 0.15 + Math.random() * 0.1
          const curveOffset = Math.sin(t * Math.PI * 2) * curveAmplitude

          lat = from.lat + dy * t + dx * curveOffset + (Math.random() - 0.5) * 0.0002
          lng = from.lng + dx * t - dy * curveOffset + (Math.random() - 0.5) * 0.0002
          roadType = t > 0.2 && t < 0.8 ? 'city' : 'residential'
          break
      }

      waypoints.push({ lat, lng, roadType })
    }

    return waypoints
  }

  /**
   * Main update loop
   */
  private update(): void {
    const now = new Date()
    const deltaTime = (now.getTime() - this.lastPositionUpdate.getTime()) / 1000
    this.lastPositionUpdate = now

    // Apply time compression
    let effectiveDeltaTime = deltaTime
    if (this.config.timeCompression?.enabled) {
      effectiveDeltaTime *= this.config.timeCompression.ratio
    }

    // Update traffic conditions periodically
    if (Math.random() < 0.01) {
      this.currentTraffic = this.getTrafficCondition()
    }

    // Check if at stop
    if (this.state.isAtStop && this.state.stopUntil) {
      if (now < this.state.stopUntil) {
        // Still at stop - emit zero movement
        this.emitTelemetry()
        return
      } else {
        // Stop complete
        this.state.isAtStop = false
        this.state.stopUntil = null
        this.moveToNextWaypoint()
      }
    }

    // Update movement
    if (this.currentRoute && this.targetWaypoint) {
      this.updateMovement(effectiveDeltaTime)
    } else {
      this.updateRandomMovement(effectiveDeltaTime)
    }

    // Check geofences
    this.checkGeofences()

    // Emit telemetry
    this.emitTelemetry()
  }

  /**
   * Update vehicle movement along route
   */
  private updateMovement(deltaTime: number): void {
    if (!this.targetWaypoint) return

    // Calculate target heading
    this.state.targetHeading = this.calculateBearing(
      { lat: this.state.currentLat, lng: this.state.currentLng },
      this.targetWaypoint
    )

    // Smooth heading changes (vehicle turning)
    const headingDiff = this.normalizeAngle(this.state.targetHeading - this.state.heading)
    const turnRate = 45 * deltaTime // 45 degrees per second max
    if (Math.abs(headingDiff) > 1) {
      const turn = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), turnRate)
      this.state.heading = this.normalizeAngle(this.state.heading + turn)
      this.state.isTurning = Math.abs(headingDiff) > 15
    } else {
      this.state.isTurning = false
    }

    // Determine target speed based on road type and conditions
    const roadType = this.getCurrentRoadType()
    const speedLimits = SPEED_LIMITS[roadType] || SPEED_LIMITS.city
    const driverFactor = this.getDriverSpeedFactor()
    const trafficFactor = this.currentTraffic.speedMultiplier
    const turningFactor = this.state.isTurning ? this.getVehicleDynamics().cornering : 1.0

    // Calculate base target speed
    let baseTargetSpeed = speedLimits.cruise * driverFactor * trafficFactor * turningFactor

    // Slow down when approaching waypoint
    if (this.distanceToTarget < 100) { // 100 meters
      const approachFactor = Math.max(0.3, this.distanceToTarget / 100)
      baseTargetSpeed *= approachFactor
    }

    // Weather effects
    if (this.weatherCondition === 'rain') {
      baseTargetSpeed *= 0.8
    } else if (this.weatherCondition === 'fog') {
      baseTargetSpeed *= 0.6
    }

    this.state.targetSpeed = baseTargetSpeed

    // Apply acceleration/deceleration physics
    this.applyAcceleration(deltaTime)

    // Calculate distance traveled in this update
    const speedMps = this.state.speed * 0.44704 // mph to m/s
    const distanceTraveled = speedMps * deltaTime

    // Update odometer (convert meters to miles)
    this.state.odometer += distanceTraveled / 1609.34

    // Move towards target
    if (this.distanceToTarget <= distanceTraveled) {
      // Reached waypoint
      this.state.currentLat = this.targetWaypoint.lat
      this.state.currentLng = this.targetWaypoint.lng

      // Handle stop at waypoint
      if (this.targetWaypoint.stopDuration > 0) {
        this.state.isAtStop = true
        this.state.isMoving = false
        this.state.speed = 0

        let stopDuration = this.targetWaypoint.stopDuration * 60 * 1000 // minutes to ms

        // Apply time compression
        if (this.config.timeCompression?.enabled) {
          stopDuration /= this.config.timeCompression.ratio
        }

        // Add some randomness
        stopDuration *= (0.8 + Math.random() * 0.4)

        this.state.stopUntil = new Date(Date.now() + stopDuration)

        this.emit('waypointReached', {
          vehicleId: this.vehicle.id,
          waypoint: this.targetWaypoint,
          timestamp: new Date()
        })
      } else {
        this.moveToNextWaypoint()
      }
    } else {
      // Move towards target
      const newPosition = this.calculateNewPosition(
        { lat: this.state.currentLat, lng: this.state.currentLng },
        this.state.heading,
        distanceTraveled
      )

      this.state.currentLat = newPosition.lat
      this.state.currentLng = newPosition.lng
      this.state.isMoving = this.state.speed > 1
      this.distanceToTarget -= distanceTraveled
    }
  }

  /**
   * Apply realistic acceleration physics
   */
  private applyAcceleration(deltaTime: number): void {
    const speedDiff = this.state.targetSpeed - this.state.speed

    if (Math.abs(speedDiff) < 0.5) {
      // Close enough to target
      this.state.speed = this.state.targetSpeed
      this.state.acceleration = 0
      return
    }

    if (speedDiff > 0) {
      // Accelerating
      const accelRate = this.state.maxAcceleration * (1 - this.state.speed / 80) // Decreases at higher speeds
      this.state.acceleration = Math.min(speedDiff / deltaTime, accelRate)
    } else {
      // Decelerating
      this.state.acceleration = Math.max(speedDiff / deltaTime, -this.state.maxDeceleration)
    }

    this.state.speed += this.state.acceleration * deltaTime
    this.state.speed = Math.max(0, Math.min(this.state.speed, 85)) // Max 85 mph
  }

  /**
   * Move to next waypoint in route
   */
  private moveToNextWaypoint(): void {
    if (!this.currentRoute) return

    this.currentWaypointIndex++

    if (this.currentWaypointIndex >= this.currentRoute.waypoints.length) {
      // Route complete - loop back
      this.currentWaypointIndex = 0
      this.emit('routeComplete', {
        vehicleId: this.vehicle.id,
        routeId: this.currentRoute.id,
        timestamp: new Date()
      })
    }

    this.targetWaypoint = this.currentRoute.waypoints[this.currentWaypointIndex]
    this.calculateDistanceToTarget()
  }

  /**
   * Random movement when no route
   */
  private updateRandomMovement(deltaTime: number): void {
    // Random local movement
    if (!this.state.isMoving && Math.random() < 0.01) {
      // Start moving
      this.state.isMoving = true
      this.state.targetSpeed = 15 + Math.random() * 25
      this.state.targetHeading = Math.random() * 360
    }

    if (this.state.isMoving && Math.random() < 0.005) {
      // Stop
      this.state.isMoving = false
      this.state.targetSpeed = 0
    }

    // Apply movement
    this.applyAcceleration(deltaTime)

    // Smooth heading
    const headingDiff = this.normalizeAngle(this.state.targetHeading - this.state.heading)
    this.state.heading = this.normalizeAngle(this.state.heading + headingDiff * 0.1)

    // Move
    const speedMps = this.state.speed * 0.44704
    const distanceTraveled = speedMps * deltaTime
    this.state.odometer += distanceTraveled / 1609.34

    const newPosition = this.calculateNewPosition(
      { lat: this.state.currentLat, lng: this.state.currentLng },
      this.state.heading,
      distanceTraveled
    )

    // Keep within bounds of home base
    const maxDistance = 0.05 // ~5km
    const distFromHome = this.calculateDistance(newPosition, this.vehicle.homeBase)
    if (distFromHome / 1000 > maxDistance * 111) {
      // Turn back towards home
      this.state.targetHeading = this.calculateBearing(newPosition, this.vehicle.homeBase)
    } else {
      this.state.currentLat = newPosition.lat
      this.state.currentLng = newPosition.lng
    }
  }

  /**
   * Check geofence violations
   */
  private checkGeofences(): void {
    const currentPosition = { lat: this.state.currentLat, lng: this.state.currentLng }

    this.geofences.forEach((geofence) => {
      const distance = this.calculateDistance(currentPosition, geofence.center)
      const wasInside = this.currentGeofences.has(geofence.id)
      const isInside = distance <= geofence.radius

      if (!wasInside && isInside) {
        this.currentGeofences.add(geofence.id)
        if (geofence.alertOnEntry) {
          this.emit('geofenceEntry', {
            vehicleId: this.vehicle.id,
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            location: currentPosition,
            timestamp: new Date()
          })
        }
      }

      if (wasInside && !isInside) {
        this.currentGeofences.delete(geofence.id)
        if (geofence.alertOnExit) {
          this.emit('geofenceExit', {
            vehicleId: this.vehicle.id,
            geofenceId: geofence.id,
            geofenceName: geofence.name,
            location: currentPosition,
            timestamp: new Date()
          })
        }
      }
    })
  }

  /**
   * Emit GPS telemetry with realistic sensor characteristics
   */
  private emitTelemetry(): void {
    // GPS accuracy and noise
    const baseAccuracy = this.config.gps?.accuracy || { min: 3, max: 15 }
    let accuracy = baseAccuracy.min + Math.random() * (baseAccuracy.max - baseAccuracy.min)

    // Accuracy degrades in certain conditions
    if (this.state.speed < 5) accuracy *= 1.5 // Less accurate when stationary
    if (this.weatherCondition !== 'clear') accuracy *= 2

    // Simulate GPS jitter
    const jitterLat = (Math.random() - 0.5) * (accuracy / 111000)
    const jitterLng = (Math.random() - 0.5) * (accuracy / (111000 * Math.cos(this.state.currentLat * Math.PI / 180)))

    // Satellite count (varies with location/conditions)
    let satelliteCount = Math.floor(8 + Math.random() * 6) // 8-14 satellites
    if (this.weatherCondition !== 'clear') satelliteCount -= 2

    // HDOP (Horizontal Dilution of Precision)
    const hdop = 0.8 + Math.random() * 1.2 // 0.8-2.0

    const telemetry: GPSTelemetry = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      location: {
        lat: this.state.currentLat + jitterLat,
        lng: this.state.currentLng + jitterLng,
        altitude: this.state.altitude + (Math.random() - 0.5) * 5,
        accuracy: accuracy
      },
      speed: Math.max(0, this.state.speed + (Math.random() - 0.5) * 2), // +-1 mph noise
      heading: this.state.heading,
      odometer: this.state.odometer,
      accuracy: accuracy,
      satelliteCount: satelliteCount
    }

    this.emit('data', telemetry)
  }

  /**
   * Get current road type
   */
  private getCurrentRoadType(): 'highway' | 'city' | 'residential' | 'parking' | 'construction' {
    if (!this.currentRoute) return 'city'

    const roadTypes = this.currentRoute.roadTypes || []
    const index = Math.min(this.currentWaypointIndex, roadTypes.length - 1)
    return (roadTypes[index] || 'city') as any
  }

  /**
   * Get driver behavior speed factor
   */
  private getDriverSpeedFactor(): number {
    switch (this.vehicle.driverBehavior) {
      case 'aggressive':
        return 1.15 + Math.random() * 0.1
      case 'cautious':
        return 0.85 - Math.random() * 0.05
      default:
        return 1.0 + (Math.random() - 0.5) * 0.1
    }
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371000 // Earth radius in meters
    const lat1 = point1.lat * Math.PI / 180
    const lat2 = point2.lat * Math.PI / 180
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(point1: Location, point2: Location): number {
    const lat1 = point1.lat * Math.PI / 180
    const lat2 = point2.lat * Math.PI / 180
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180

    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  }

  /**
   * Calculate new position given bearing and distance
   */
  private calculateNewPosition(location: Location, bearing: number, distance: number): Location {
    const R = 6371000
    const bearingRad = bearing * Math.PI / 180
    const lat1 = location.lat * Math.PI / 180
    const lng1 = location.lng * Math.PI / 180

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad)
    )

    const lng2 = lng1 + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    )

    return {
      lat: lat2 * 180 / Math.PI,
      lng: lng2 * 180 / Math.PI
    }
  }

  /**
   * Calculate distance to target waypoint
   */
  private calculateDistanceToTarget(): void {
    if (!this.targetWaypoint) {
      this.distanceToTarget = 0
      return
    }

    this.distanceToTarget = this.calculateDistance(
      { lat: this.state.currentLat, lng: this.state.currentLng },
      this.targetWaypoint
    )
  }

  /**
   * Normalize angle to 0-360 range
   */
  private normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360
  }

  /**
   * Get current state
   */
  public getCurrentState(): any {
    return {
      location: { lat: this.state.currentLat, lng: this.state.currentLng },
      speed: this.state.speed,
      heading: this.state.heading,
      odometer: this.state.odometer,
      isAtStop: this.state.isAtStop,
      isMoving: this.state.isMoving,
      currentRoute: this.currentRoute?.id,
      currentWaypoint: this.currentWaypointIndex,
      acceleration: this.state.acceleration,
      traffic: this.currentTraffic.level
    }
  }
}
