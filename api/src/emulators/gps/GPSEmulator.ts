/**
 * GPSEmulator - Realistic GPS/telemetry emulation
 * Features:
 * - Realistic vehicle movement along routes
 * - Speed variation based on road type and traffic
 * - GPS accuracy simulation
 * - Geofence detection
 * - Altitude changes
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

export class GPSEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private geofences: Map<string, Geofence>

  private currentLocation: Location
  private currentSpeed: number = 0
  private currentHeading: number = 0
  private odometer: number = 0
  private isRunning: boolean = false
  private isPaused: boolean = false

  private updateInterval: NodeJS.Timeout | null = null
  private currentRoute: Route | null = null
  private currentWaypointIndex: number = 0
  private isAtStop: boolean = false
  private stopUntil: Date | null = null

  // Movement state
  private targetWaypoint: Waypoint | null = null
  private distanceToTarget: number = 0

  constructor(vehicle: Vehicle, config: EmulatorConfig, geofences: Map<string, Geofence>) {
    super()
    this.vehicle = vehicle
    this.config = config
    this.geofences = geofences

    // Initialize at starting location
    this.currentLocation = { ...vehicle.startingLocation }
  }

  /**
   * Start GPS emulation
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.isPaused = false

    const updateFrequency = this.config.gps?.updateFrequency || 5000

    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.update()
      }
    }, updateFrequency)

    console.log(`GPS Emulator started for vehicle ${this.vehicle.id}`)
  }

  /**
   * Stop GPS emulation
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.isRunning = false
    this.isPaused = false

    console.log(`GPS Emulator stopped for vehicle ${this.vehicle.id}`)
  }

  /**
   * Pause GPS emulation
   */
  public async pause(): Promise<void> {
    this.isPaused = true
  }

  /**
   * Resume GPS emulation
   */
  public async resume(): Promise<void> {
    this.isPaused = false
  }

  /**
   * Set route for vehicle
   */
  public setRoute(route: Route): void {
    this.currentRoute = route
    this.currentWaypointIndex = 0
    this.targetWaypoint = route.waypoints[0]
    this.calculateDistanceToTarget()
  }

  /**
   * Main update loop
   */
  private update(): void {
    // Check if at stop
    if (this.isAtStop && this.stopUntil) {
      if (new Date() < this.stopUntil) {
        // Still at stop - emit zero movement
        this.emitTelemetry()
        return
      } else {
        // Stop duration complete
        this.isAtStop = false
        this.stopUntil = null
        this.moveToNextWaypoint()
      }
    }

    // Update vehicle movement
    if (this.currentRoute && this.targetWaypoint) {
      this.updateMovement()
    } else {
      // No route - simulate random local movement
      this.updateRandomMovement()
    }

    // Check geofences
    this.checkGeofences()

    // Emit telemetry data
    this.emitTelemetry()
  }

  /**
   * Update vehicle movement along route
   */
  private updateMovement(): void {
    if (!this.targetWaypoint) return

    // Calculate speed based on road type and traffic
    const roadType = this.getCurrentRoadType()
    const baseSpeed = this.getSpeedForRoadType(roadType)
    const trafficFactor = this.getTrafficFactor()

    this.currentSpeed = baseSpeed * trafficFactor * this.getDriverFactor()

    // Apply time compression
    let actualSpeed = this.currentSpeed
    if (this.config.timeCompression?.enabled) {
      actualSpeed *= this.config.timeCompression.ratio
    }

    // Calculate distance traveled in this update (convert mph to meters per update)
    const updateFrequencySeconds = (this.config.gps?.updateFrequency || 5000) / 1000
    const distanceTraveled = (actualSpeed * 0.44704) * updateFrequencySeconds // mph to m/s

    // Update odometer
    this.odometer += distanceTraveled / 1609.34 // meters to miles

    // Move towards target
    if (this.distanceToTarget <= distanceTraveled) {
      // Reached waypoint
      this.currentLocation = {
        lat: this.targetWaypoint.lat,
        lng: this.targetWaypoint.lng
      }

      // Handle stop at waypoint
      if (this.targetWaypoint.stopDuration > 0) {
        this.isAtStop = true
        const stopDuration = this.targetWaypoint.stopDuration * 60 * 1000 // minutes to ms

        // Apply time compression to stop duration
        const actualStopDuration = this.config.timeCompression?.enabled
          ? stopDuration / this.config.timeCompression.ratio
          : stopDuration

        this.stopUntil = new Date(Date.now() + actualStopDuration)
        this.currentSpeed = 0
      } else {
        this.moveToNextWaypoint()
      }
    } else {
      // Move towards target
      const bearing = this.calculateBearing(
        this.currentLocation,
        this.targetWaypoint
      )
      this.currentHeading = bearing

      const newLocation = this.calculateNewPosition(
        this.currentLocation,
        bearing,
        distanceTraveled
      )

      this.currentLocation = newLocation
      this.distanceToTarget -= distanceTraveled
    }
  }

  /**
   * Move to next waypoint in route
   */
  private moveToNextWaypoint(): void {
    if (!this.currentRoute) return

    this.currentWaypointIndex++

    if (this.currentWaypointIndex >= this.currentRoute.waypoints.length) {
      // Route complete - loop back to start or stop
      this.currentWaypointIndex = 0
      this.emit('routeComplete', { vehicleId: this.vehicle.id })
    }

    this.targetWaypoint = this.currentRoute.waypoints[this.currentWaypointIndex]
    this.calculateDistanceToTarget()
  }

  /**
   * Update random movement when no route assigned
   */
  private updateRandomMovement(): void {
    // Random local movement around home base
    const maxDistance = 0.01 // ~1km in degrees
    const randomLat = (Math.random() - 0.5) * maxDistance
    const randomLng = (Math.random() - 0.5) * maxDistance

    this.currentLocation = {
      lat: this.vehicle.homeBase.lat + randomLat,
      lng: this.vehicle.homeBase.lng + randomLng
    }

    this.currentSpeed = Math.random() * 30 + 10 // 10-40 mph
    this.currentHeading = Math.random() * 360
    this.odometer += 0.1 // Small increment
  }

  /**
   * Check geofence violations
   */
  private checkGeofences(): void {
    this.geofences.forEach((geofence) => {
      const distance = this.calculateDistance(
        this.currentLocation,
        geofence.center
      )

      const wasInside = this.isInsideGeofence(geofence)
      const isInside = distance <= geofence.radius

      if (!wasInside && isInside && geofence.alertOnEntry) {
        this.emit('geofenceEntry', {
          vehicleId: this.vehicle.id,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          location: this.currentLocation,
          timestamp: new Date()
        })
      }

      if (wasInside && !isInside && geofence.alertOnExit) {
        this.emit('geofenceExit', {
          vehicleId: this.vehicle.id,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          location: this.currentLocation,
          timestamp: new Date()
        })
      }
    })
  }

  /**
   * Check if currently inside geofence
   */
  private isInsideGeofence(geofence: Geofence): boolean {
    const distance = this.calculateDistance(this.currentLocation, geofence.center)
    return distance <= geofence.radius
  }

  /**
   * Emit GPS telemetry data
   */
  private emitTelemetry(): void {
    // Add GPS accuracy variation
    const accuracy = this.config.gps?.accuracy || { min: 5, max: 50 }
    const gpsAccuracy = Math.random() * (accuracy.max - accuracy.min) + accuracy.min

    // Add slight position jitter based on accuracy
    const jitterLat = (Math.random() - 0.5) * (gpsAccuracy / 111000) // Convert meters to degrees
    const jitterLng = (Math.random() - 0.5) * (gpsAccuracy / (111000 * Math.cos(this.currentLocation.lat * Math.PI / 180)))

    const telemetry: GPSTelemetry = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      location: {
        lat: this.currentLocation.lat + jitterLat,
        lng: this.currentLocation.lng + jitterLng,
        accuracy: gpsAccuracy
      },
      speed: this.currentSpeed,
      heading: this.currentHeading,
      odometer: this.odometer,
      accuracy: gpsAccuracy,
      satelliteCount: Math.floor(Math.random() * 8) + 4 // 4-12 satellites
    }

    this.emit('data', telemetry)
  }

  /**
   * Get current road type
   */
  private getCurrentRoadType(): 'city' | 'highway' | 'residential' {
    if (!this.currentRoute) return 'city'

    const roadTypes = this.currentRoute.roadTypes || []
    const index = Math.min(this.currentWaypointIndex, roadTypes.length - 1)
    return roadTypes[index] || 'city'
  }

  /**
   * Get speed for road type
   */
  private getSpeedForRoadType(roadType: 'city' | 'highway' | 'residential'): number {
    const speedConfig = this.config.gps?.speedVariation || {
      highway: { min: 55, max: 75 },
      city: { min: 20, max: 45 },
      residential: { min: 15, max: 35 }
    }

    const range = speedConfig[roadType]
    return Math.random() * (range.max - range.min) + range.min
  }

  /**
   * Get traffic factor
   */
  private getTrafficFactor(): number {
    // Would be based on scenario traffic level
    return 1.0 // Normal traffic
  }

  /**
   * Get driver behavior factor
   */
  private getDriverFactor(): number {
    const behavior = this.vehicle.driverBehavior

    switch (behavior) {
      case 'aggressive':
        return 1.15
      case 'cautious':
        return 0.85
      default:
        return 1.0
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
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

    const bearing = Math.atan2(y, x) * 180 / Math.PI

    return (bearing + 360) % 360
  }

  /**
   * Calculate new position given bearing and distance
   */
  private calculateNewPosition(location: Location, bearing: number, distance: number): Location {
    const R = 6371000 // Earth radius in meters
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
   * Calculate distance to current target waypoint
   */
  private calculateDistanceToTarget(): void {
    if (!this.targetWaypoint) {
      this.distanceToTarget = 0
      return
    }

    this.distanceToTarget = this.calculateDistance(
      this.currentLocation,
      this.targetWaypoint
    )
  }

  /**
   * Get current state
   */
  public getCurrentState(): any {
    return {
      location: this.currentLocation,
      speed: this.currentSpeed,
      heading: this.currentHeading,
      odometer: this.odometer,
      isAtStop: this.isAtStop,
      currentRoute: this.currentRoute?.id,
      currentWaypoint: this.currentWaypointIndex
    }
  }
}
