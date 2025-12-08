/**
 * GPSEmulator - Production-grade GPS tracking emulation
 * Features:
 * - Real-time tracking for 50 vehicles
 * - Realistic movement patterns along routes
 * - Route history with breadcrumbs (last 50 positions)
 * - Geofencing alerts for facilities
 * - Dynamic status updates based on speed
 * - Address geocoding simulation
 */

import { EventEmitter } from 'events'

import { faker } from '@faker-js/faker'

// GPS Position Interface
export interface GPSPosition {
  id: number
  vehicleId: number
  latitude: number
  longitude: number
  speed: number // mph
  heading: number // degrees
  accuracy: number // meters
  timestamp: Date
  status: 'moving' | 'idle' | 'stopped'
  address?: string // geocoded address
}

// Breadcrumb Interface
export interface Breadcrumb {
  latitude: number
  longitude: number
  timestamp: Date
}

// Geofence Alert Interface
export interface GeofenceAlert {
  vehicleId: number
  facilityName: string
  distance: number // meters
  timestamp: Date
}

// Facility/Geofence definition
interface Facility {
  name: string
  latitude: number
  longitude: number
  radius: number // meters
  type: 'hq' | 'service_center' | 'fuel_depot'
}

// Vehicle State tracking
interface VehicleState {
  vehicleId: number
  currentPosition: GPSPosition
  breadcrumbs: Breadcrumb[]
  lastUpdateTime: Date
  routeIndex: number
  targetLocation: { lat: number; lng: number }
  baseLocation: { lat: number; lng: number }
  isOnHighway: boolean
}

export class GPSEmulator extends EventEmitter {
  private vehicles: Map<number, VehicleState> = new Map()
  private facilities: Facility[] = []
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private geofenceAlerts: GeofenceAlert[] = []

  // Tallahassee, FL area bounds
  private readonly TALLAHASSEE_CENTER = { lat: 30.4383, lng: -84.2807 }
  private readonly CITY_RADIUS_MILES = 15

  // Speed ranges
  private readonly SPEED_RANGES = {
    city: { min: 5, max: 35 },
    highway: { min: 45, max: 65 },
    residential: { min: 5, max: 25 },
    stopped: { min: 0, max: 0 },
    idle: { min: 1, max: 5 }
  }

  constructor() {
    super()
    this.initializeFacilities()
    this.initializeVehicles(50)
  }

  /**
   * Initialize facilities/geofences in Tallahassee area
   */
  private initializeFacilities(): void {
    this.facilities = [
      {
        name: 'Fleet HQ',
        latitude: 30.4383,
        longitude: -84.2807,
        radius: 100,
        type: 'hq'
      },
      {
        name: 'North Service Center',
        latitude: 30.4583,
        longitude: -84.2707,
        radius: 100,
        type: 'service_center'
      },
      {
        name: 'South Service Center',
        latitude: 30.4183,
        longitude: -84.2907,
        radius: 100,
        type: 'service_center'
      },
      {
        name: 'East Fuel Depot',
        latitude: 30.4383,
        longitude: -84.2607,
        radius: 100,
        type: 'fuel_depot'
      },
      {
        name: 'West Fuel Depot',
        latitude: 30.4383,
        longitude: -84.3007,
        radius: 100,
        type: 'fuel_depot'
      },
      {
        name: 'Airport Service Hub',
        latitude: 30.3925,
        longitude: -84.3503,
        radius: 100,
        type: 'service_center'
      }
    ]
  }

  /**
   * Initialize vehicles with realistic starting positions
   */
  private initializeVehicles(count: number): void {
    for (let i = 1; i <= count; i++) {
      const baseLocation = this.generateRandomLocation()
      const currentPosition: GPSPosition = {
        id: Date.now() + i,
        vehicleId: i,
        latitude: baseLocation.lat,
        longitude: baseLocation.lng,
        speed: 0,
        heading: Math.random() * 360,
        accuracy: faker.number.float({ min: 5, max: 15 }),
        timestamp: new Date(),
        status: 'stopped',
        address: this.generateAddress(baseLocation.lat, baseLocation.lng)
      }

      const vehicleState: VehicleState = {
        vehicleId: i,
        currentPosition,
        breadcrumbs: [],
        lastUpdateTime: new Date(),
        routeIndex: 0,
        targetLocation: this.generateRandomLocation(),
        baseLocation,
        isOnHighway: false
      }

      this.vehicles.set(i, vehicleState)
    }
  }

  /**
   * Generate random location within Tallahassee area
   */
  private generateRandomLocation(): { lat: number; lng: number } {
    // Convert miles to degrees (approximate)
    const radiusInDegrees = this.CITY_RADIUS_MILES / 69.0

    // Generate random point within radius
    const angle = Math.random() * 2 * Math.PI
    const radius = Math.sqrt(Math.random()) * radiusInDegrees

    const lat = this.TALLAHASSEE_CENTER.lat + radius * Math.cos(angle)
    const lng = this.TALLAHASSEE_CENTER.lng + radius * Math.sin(angle)

    return { lat, lng }
  }

  /**
   * Generate realistic address based on coordinates
   */
  private generateAddress(lat: number, lng: number): string {
    const streets = [
      'Main St', 'Oak Ave', 'Maple Dr', 'Park Blvd', 'University Way',
      'Capitol Cir', 'Monroe St', 'Tennessee St', 'Apalachee Pkwy',
      'Thomasville Rd', 'Mahan Dr', 'Capital Cir NE', 'Centerville Rd'
    ]

    const streetNumber = faker.number.int({ min: 100, max: 9999 })
    const street = faker.helpers.arrayElement(streets)

    return `${streetNumber} ${street}, Tallahassee, FL`
  }

  /**
   * Start GPS emulation
   */
  public start(): void {
    if (this.isRunning) return

    this.isRunning = true

    // Update positions every 10 seconds
    this.updateInterval = setInterval(() => {
      this.updateAllVehicles()
    }, 10000)

    // Initial update
    this.updateAllVehicles()

    console.log('GPS Emulator started - tracking 50 vehicles')
  }

  /**
   * Stop GPS emulation
   */
  public stop(): void {
    if (!this.isRunning) return

    this.isRunning = false

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    console.log('GPS Emulator stopped')
  }

  /**
   * Update all vehicle positions
   */
  private updateAllVehicles(): void {
    this.vehicles.forEach(vehicleState => {
      this.updateVehiclePosition(vehicleState)
      this.checkGeofences(vehicleState)
    })

    // Emit batch update event
    const positions = Array.from(this.vehicles.values()).map(v => v.currentPosition)
    this.emit('positionsUpdate', positions)
  }

  /**
   * Update single vehicle position
   */
  private updateVehiclePosition(vehicleState: VehicleState): void {
    const timeDelta = (Date.now() - vehicleState.lastUpdateTime.getTime()) / 1000 // seconds

    // Determine if vehicle should be moving
    const shouldMove = Math.random() > 0.2 // 80% chance of movement

    if (!shouldMove && vehicleState.currentPosition.status === 'stopped') {
      // Vehicle remains stopped
      return
    }

    // Calculate distance to target
    const distance = this.calculateDistance(
      vehicleState.currentPosition.latitude,
      vehicleState.currentPosition.longitude,
      vehicleState.targetLocation.lat,
      vehicleState.targetLocation.lng
    )

    // If close to target, pick new target
    if (distance < 0.5) { // Less than 0.5 miles
      vehicleState.targetLocation = this.generateRandomLocation()
      vehicleState.isOnHighway = Math.random() > 0.6 // 40% chance of highway
    }

    // Determine speed based on context
    let targetSpeed: number
    if (!shouldMove) {
      targetSpeed = 0
    } else if (vehicleState.isOnHighway) {
      targetSpeed = faker.number.float(this.SPEED_RANGES.highway)
    } else if (distance < 1) {
      targetSpeed = faker.number.float(this.SPEED_RANGES.residential)
    } else {
      targetSpeed = faker.number.float(this.SPEED_RANGES.city)
    }

    // Smooth speed changes
    const currentSpeed = vehicleState.currentPosition.speed
    const speedChange = (targetSpeed - currentSpeed) * 0.3 // 30% change per update
    const newSpeed = Math.max(0, currentSpeed + speedChange)

    // Calculate new heading towards target
    const heading = this.calculateBearing(
      vehicleState.currentPosition.latitude,
      vehicleState.currentPosition.longitude,
      vehicleState.targetLocation.lat,
      vehicleState.targetLocation.lng
    )

    // Calculate distance traveled
    const distanceTraveled = (newSpeed * timeDelta) / 3600 // miles

    // Calculate new position
    const newPosition = this.calculateNewPosition(
      vehicleState.currentPosition.latitude,
      vehicleState.currentPosition.longitude,
      heading,
      distanceTraveled
    )

    // Update breadcrumbs
    vehicleState.breadcrumbs.push({
      latitude: vehicleState.currentPosition.latitude,
      longitude: vehicleState.currentPosition.longitude,
      timestamp: vehicleState.currentPosition.timestamp
    })

    // Keep only last 50 breadcrumbs
    if (vehicleState.breadcrumbs.length > 50) {
      vehicleState.breadcrumbs.shift()
    }

    // Determine status based on speed
    let status: 'moving' | 'idle' | 'stopped'
    if (newSpeed === 0) {
      status = 'stopped'
    } else if (newSpeed <= 5) {
      status = 'idle'
    } else {
      status = 'moving'
    }

    // Update vehicle position
    vehicleState.currentPosition = {
      id: Date.now() + vehicleState.vehicleId,
      vehicleId: vehicleState.vehicleId,
      latitude: newPosition.lat,
      longitude: newPosition.lng,
      speed: Math.round(newSpeed * 10) / 10, // Round to 1 decimal
      heading: Math.round(heading),
      accuracy: faker.number.float({ min: 5, max: 15 }),
      timestamp: new Date(),
      status,
      address: Math.random() > 0.7 ?
        this.generateAddress(newPosition.lat, newPosition.lng) :
        vehicleState.currentPosition.address
    }

    vehicleState.lastUpdateTime = new Date()
  }

  /**
   * Check geofences for a vehicle
   */
  private checkGeofences(vehicleState: VehicleState): void {
    this.facilities.forEach(facility => {
      const distance = this.calculateDistance(
        vehicleState.currentPosition.latitude,
        vehicleState.currentPosition.longitude,
        facility.latitude,
        facility.longitude
      ) * 1609.34 // Convert miles to meters

      if (distance <= facility.radius) {
        const alert: GeofenceAlert = {
          vehicleId: vehicleState.vehicleId,
          facilityName: facility.name,
          distance: Math.round(distance),
          timestamp: new Date()
        }

        // Check if we already have a recent alert for this vehicle and facility
        const recentAlert = this.geofenceAlerts.find(a =>
          a.vehicleId === vehicleState.vehicleId &&
          a.facilityName === facility.name &&
          (Date.now() - a.timestamp.getTime()) < 60000 // Within last minute
        )

        if (!recentAlert) {
          this.geofenceAlerts.push(alert)
          this.emit('geofenceAlert', alert)

          // Keep only last 100 alerts
          if (this.geofenceAlerts.length > 100) {
            this.geofenceAlerts.shift()
          }
        }
      }
    })
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in miles
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Calculate bearing between two coordinates
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = this.toRad(lng2 - lng1)
    const lat1Rad = this.toRad(lat1)
    const lat2Rad = this.toRad(lat2)

    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

    const bearing = Math.atan2(y, x)

    return (this.toDeg(bearing) + 360) % 360
  }

  /**
   * Calculate new position given bearing and distance
   */
  private calculateNewPosition(lat: number, lng: number, bearing: number, distance: number): { lat: number; lng: number } {
    const R = 3959 // Earth radius in miles
    const bearingRad = this.toRad(bearing)
    const latRad = this.toRad(lat)
    const lngRad = this.toRad(lng)

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distance / R) +
      Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad)
    )

    const newLngRad = lngRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
      Math.cos(distance / R) - Math.sin(latRad) * Math.sin(newLatRad)
    )

    return {
      lat: this.toDeg(newLatRad),
      lng: this.toDeg(newLngRad)
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * Math.PI / 180
  }

  /**
   * Convert radians to degrees
   */
  private toDeg(radians: number): number {
    return radians * 180 / Math.PI
  }

  /**
   * Get current positions for all vehicles
   */
  public getAllPositions(filters?: {
    status?: 'moving' | 'idle' | 'stopped'
    bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
    page?: number
    limit?: number
  }): { positions: GPSPosition[]; total: number } {
    let positions = Array.from(this.vehicles.values()).map(v => v.currentPosition)

    // Apply filters
    if (filters) {
      if (filters.status) {
        positions = positions.filter(p => p.status === filters.status)
      }

      if (filters.bounds) {
        positions = positions.filter(p =>
          p.latitude >= filters.bounds!.minLat &&
          p.latitude <= filters.bounds!.maxLat &&
          p.longitude >= filters.bounds!.minLng &&
          p.longitude <= filters.bounds!.maxLng
        )
      }
    }

    const total = positions.length

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit
      positions = positions.slice(start, start + filters.limit)
    }

    return { positions, total }
  }

  /**
   * Get current position for specific vehicle
   */
  public getVehiclePosition(vehicleId: number): GPSPosition | null {
    const vehicleState = this.vehicles.get(vehicleId)
    return vehicleState ? vehicleState.currentPosition : null
  }

  /**
   * Get route history for specific vehicle
   */
  public getVehicleHistory(vehicleId: number): Breadcrumb[] {
    const vehicleState = this.vehicles.get(vehicleId)
    return vehicleState ? [...vehicleState.breadcrumbs] : []
  }

  /**
   * Get geofencing alerts
   */
  public getGeofenceAlerts(filters?: {
    vehicleId?: number
    startDate?: Date
    endDate?: Date
  }): GeofenceAlert[] {
    let alerts = [...this.geofenceAlerts]

    if (filters) {
      if (filters.vehicleId) {
        alerts = alerts.filter(a => a.vehicleId === filters.vehicleId)
      }

      if (filters.startDate) {
        alerts = alerts.filter(a => a.timestamp >= filters.startDate!)
      }

      if (filters.endDate) {
        alerts = alerts.filter(a => a.timestamp <= filters.endDate!)
      }
    }

    return alerts
  }

  /**
   * Get facilities/geofences
   */
  public getFacilities(): Facility[] {
    return [...this.facilities]
  }
}

// Export singleton instance
export const gpsEmulator = new GPSEmulator()