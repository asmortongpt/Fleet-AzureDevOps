/**
 * BeaconService
 *
 * Comprehensive beacon monitoring service with:
 * - Monitor for nearby vehicle beacons
 * - Range beacons (proximity detection: immediate, near, far)
 * - Geofencing with beacons
 * - Auto-notifications when near vehicle
 * - Background beacon monitoring
 * - Support for iBeacon and Eddystone formats
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native'
import Beacons from 'react-native-beacons-manager'

export type BeaconProximity = 'immediate' | 'near' | 'far' | 'unknown'

export interface Beacon {
  uuid: string
  major: number
  minor: number
  rssi: number
  accuracy: number
  proximity: BeaconProximity
  distance?: number
  timestamp: Date
}

export interface VehicleBeacon extends Beacon {
  vehicleId: string
  vin?: string
  make?: string
  model?: string
  licensePlate?: string
  location?: string
}

export interface BeaconRegion {
  identifier: string
  uuid: string
  major?: number
  minor?: number
}

export interface GeofenceBeacon {
  beaconId: string
  region: BeaconRegion
  type: 'entry' | 'exit'
  timestamp: Date
}

export interface BeaconNotification {
  vehicleId: string
  vehicleName: string
  proximity: BeaconProximity
  distance?: number
  message: string
}

type BeaconCallback = (beacons: Beacon[]) => void
type VehicleBeaconCallback = (beacons: VehicleBeacon[]) => void
type GeofenceCallback = (event: GeofenceBeacon) => void

class BeaconServiceClass {
  private isMonitoring = false
  private isRanging = false
  private regions: Map<string, BeaconRegion> = new Map()
  private beaconCallbacks: BeaconCallback[] = []
  private vehicleBeaconCallbacks: VehicleBeaconCallback[] = []
  private geofenceCallbacks: GeofenceCallback[] = []
  private vehicleBeaconMap: Map<string, VehicleBeacon> = new Map()
  private lastNotificationTime: Map<string, number> = new Map()
  private notificationCooldown = 60000 // 1 minute

  /**
   * Initialize beacon service and request permissions
   */
  async init(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Request Android permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        ])

        const allGranted = Object.values(granted).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        )

        if (!allGranted) {
          console.warn('Beacon permissions not granted')
          return false
        }
      }

      // Detect beacon support
      await Beacons.detectIBeacons()

      console.log('Beacon service initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing beacon service:', error)
      return false
    }
  }

  /**
   * Register a beacon region for monitoring
   */
  registerRegion(region: BeaconRegion): void {
    this.regions.set(region.identifier, region)
    console.log('Beacon region registered:', region)
  }

  /**
   * Unregister a beacon region
   */
  unregisterRegion(identifier: string): void {
    this.regions.delete(identifier)
    console.log('Beacon region unregistered:', identifier)
  }

  /**
   * Start monitoring for beacons in registered regions
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Already monitoring beacons')
      return
    }

    try {
      await this.init()

      // Start monitoring for all registered regions
      for (const region of this.regions.values()) {
        await Beacons.startMonitoringForRegion(region)
        console.log('Started monitoring region:', region.identifier)
      }

      // Set up region enter/exit listeners
      Beacons.BeaconsEventEmitter.addListener(
        'regionDidEnter',
        (data: any) => {
          console.log('Region entered:', data)
          this.handleGeofenceEvent(data, 'entry')
        }
      )

      Beacons.BeaconsEventEmitter.addListener(
        'regionDidExit',
        (data: any) => {
          console.log('Region exited:', data)
          this.handleGeofenceEvent(data, 'exit')
        }
      )

      this.isMonitoring = true
      console.log('Beacon monitoring started')
    } catch (error) {
      console.error('Error starting beacon monitoring:', error)
      throw error
    }
  }

  /**
   * Stop monitoring for beacons
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return

    try {
      for (const region of this.regions.values()) {
        await Beacons.stopMonitoringForRegion(region)
      }

      Beacons.BeaconsEventEmitter.removeAllListeners('regionDidEnter')
      Beacons.BeaconsEventEmitter.removeAllListeners('regionDidExit')

      this.isMonitoring = false
      console.log('Beacon monitoring stopped')
    } catch (error) {
      console.error('Error stopping beacon monitoring:', error)
    }
  }

  /**
   * Start ranging beacons (proximity detection)
   */
  async startRanging(): Promise<void> {
    if (this.isRanging) {
      console.warn('Already ranging beacons')
      return
    }

    try {
      await this.init()

      // Start ranging for all registered regions
      for (const region of this.regions.values()) {
        await Beacons.startRangingBeaconsInRegion(region)
        console.log('Started ranging region:', region.identifier)
      }

      // Set up ranging listener
      Beacons.BeaconsEventEmitter.addListener(
        'beaconsDidRange',
        (data: any) => {
          this.handleBeaconsRanged(data)
        }
      )

      this.isRanging = true
      console.log('Beacon ranging started')
    } catch (error) {
      console.error('Error starting beacon ranging:', error)
      throw error
    }
  }

  /**
   * Stop ranging beacons
   */
  async stopRanging(): Promise<void> {
    if (!this.isRanging) return

    try {
      for (const region of this.regions.values()) {
        await Beacons.stopRangingBeaconsInRegion(region)
      }

      Beacons.BeaconsEventEmitter.removeAllListeners('beaconsDidRange')

      this.isRanging = false
      console.log('Beacon ranging stopped')
    } catch (error) {
      console.error('Error stopping beacon ranging:', error)
    }
  }

  /**
   * Register callback for beacon ranging events
   */
  onBeaconsDetected(callback: BeaconCallback): () => void {
    this.beaconCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.beaconCallbacks.indexOf(callback)
      if (index > -1) {
        this.beaconCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Register callback for vehicle beacon events
   */
  onVehicleBeaconsDetected(callback: VehicleBeaconCallback): () => void {
    this.vehicleBeaconCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.vehicleBeaconCallbacks.indexOf(callback)
      if (index > -1) {
        this.vehicleBeaconCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Register callback for geofence events
   */
  onGeofenceEvent(callback: GeofenceCallback): () => void {
    this.geofenceCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.geofenceCallbacks.indexOf(callback)
      if (index > -1) {
        this.geofenceCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Handle beacons ranged event
   */
  private handleBeaconsRanged(data: any): void {
    const beacons: Beacon[] = (data.beacons || []).map((beacon: any) => ({
      uuid: beacon.uuid,
      major: beacon.major,
      minor: beacon.minor,
      rssi: beacon.rssi,
      accuracy: beacon.accuracy,
      proximity: this.getProximity(beacon.proximity),
      distance: beacon.accuracy,
      timestamp: new Date()
    }))

    // Notify all beacon callbacks
    this.beaconCallbacks.forEach(callback => callback(beacons))

    // Check for vehicle beacons
    const vehicleBeacons = this.mapToVehicleBeacons(beacons)
    if (vehicleBeacons.length > 0) {
      this.vehicleBeaconCallbacks.forEach(callback => callback(vehicleBeacons))
      this.checkProximityNotifications(vehicleBeacons)
    }
  }

  /**
   * Handle geofence event
   */
  private handleGeofenceEvent(data: any, type: 'entry' | 'exit'): void {
    const event: GeofenceBeacon = {
      beaconId: data.uuid,
      region: {
        identifier: data.identifier || data.uuid,
        uuid: data.uuid,
        major: data.major,
        minor: data.minor
      },
      type,
      timestamp: new Date()
    }

    this.geofenceCallbacks.forEach(callback => callback(event))
  }

  /**
   * Map beacons to vehicle beacons using registered vehicle data
   */
  private mapToVehicleBeacons(beacons: Beacon[]): VehicleBeacon[] {
    const vehicleBeacons: VehicleBeacon[] = []

    for (const beacon of beacons) {
      const beaconKey = `${beacon.uuid}-${beacon.major}-${beacon.minor}`
      const vehicleData = this.vehicleBeaconMap.get(beaconKey)

      if (vehicleData) {
        vehicleBeacons.push({
          ...beacon,
          vehicleId: vehicleData.vehicleId,
          vin: vehicleData.vin,
          make: vehicleData.make,
          model: vehicleData.model,
          licensePlate: vehicleData.licensePlate,
          location: vehicleData.location
        })
      }
    }

    return vehicleBeacons
  }

  /**
   * Register vehicle beacon mapping
   */
  registerVehicleBeacon(
    uuid: string,
    major: number,
    minor: number,
    vehicleData: Omit<VehicleBeacon, keyof Beacon>
  ): void {
    const beaconKey = `${uuid}-${major}-${minor}`
    const vehicleBeacon: VehicleBeacon = {
      uuid,
      major,
      minor,
      rssi: 0,
      accuracy: 0,
      proximity: 'unknown',
      timestamp: new Date(),
      ...vehicleData
    }

    this.vehicleBeaconMap.set(beaconKey, vehicleBeacon)
    console.log('Vehicle beacon registered:', beaconKey, vehicleData)
  }

  /**
   * Fetch and register vehicle beacons from API
   */
  async fetchVehicleBeacons(authToken: string): Promise<void> {
    try {
      const response = await fetch('/api/mobile/beacons/nearby', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Register each vehicle beacon
        for (const beacon of data.beacons) {
          this.registerVehicleBeacon(
            beacon.uuid,
            beacon.major,
            beacon.minor,
            {
              vehicleId: beacon.vehicleId,
              vin: beacon.vin,
              make: beacon.make,
              model: beacon.model,
              licensePlate: beacon.licensePlate,
              location: beacon.location
            }
          )

          // Also register region for monitoring
          this.registerRegion({
            identifier: `vehicle-${beacon.vehicleId}`,
            uuid: beacon.uuid,
            major: beacon.major,
            minor: beacon.minor
          })
        }

        console.log(`Registered ${data.beacons.length} vehicle beacons`)
      }
    } catch (error) {
      console.error('Error fetching vehicle beacons:', error)
    }
  }

  /**
   * Register a new beacon with the API
   */
  async registerBeaconWithAPI(
    authToken: string,
    vehicleId: string,
    uuid: string,
    major: number,
    minor: number
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/mobile/beacons/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          vehicleId,
          uuid,
          major,
          minor,
          registeredAt: new Date().toISOString()
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error registering beacon with API:', error)
      return false
    }
  }

  /**
   * Check proximity and send notifications
   */
  private checkProximityNotifications(vehicleBeacons: VehicleBeacon[]): void {
    for (const beacon of vehicleBeacons) {
      if (beacon.proximity === 'immediate' || beacon.proximity === 'near') {
        const now = Date.now()
        const lastNotification = this.lastNotificationTime.get(beacon.vehicleId) || 0

        // Check cooldown period
        if (now - lastNotification > this.notificationCooldown) {
          this.sendProximityNotification(beacon)
          this.lastNotificationTime.set(beacon.vehicleId, now)
        }
      }
    }
  }

  /**
   * Send proximity notification
   */
  private sendProximityNotification(beacon: VehicleBeacon): void {
    const vehicleName = beacon.make && beacon.model
      ? `${beacon.make} ${beacon.model}`
      : `Vehicle ${beacon.vehicleId}`

    const distance = beacon.distance
      ? `${beacon.distance.toFixed(1)}m away`
      : beacon.proximity

    const notification: BeaconNotification = {
      vehicleId: beacon.vehicleId,
      vehicleName,
      proximity: beacon.proximity,
      distance: beacon.distance,
      message: `${vehicleName} is ${distance}`
    }

    // You can integrate with push notification service here
    console.log('Proximity notification:', notification)

    // For now, just log - integrate with your notification system
    // PushNotification.localNotification({
    //   title: 'Vehicle Nearby',
    //   message: notification.message,
    //   data: { vehicleId: beacon.vehicleId }
    // })
  }

  /**
   * Get proximity from string
   */
  private getProximity(proximity: any): BeaconProximity {
    if (typeof proximity === 'string') {
      const p = proximity.toLowerCase()
      if (p === 'immediate' || p === 'near' || p === 'far') {
        return p as BeaconProximity
      }
    } else if (typeof proximity === 'number') {
      // iOS proximity values
      if (proximity === 1) return 'immediate'
      if (proximity === 2) return 'near'
      if (proximity === 3) return 'far'
    }

    return 'unknown'
  }

  /**
   * Get nearest vehicle beacon
   */
  getNearestVehicle(vehicleBeacons: VehicleBeacon[]): VehicleBeacon | null {
    if (vehicleBeacons.length === 0) return null

    return vehicleBeacons.reduce((nearest, current) => {
      if (!nearest) return current

      const nearestDist = nearest.distance || 999
      const currentDist = current.distance || 999

      return currentDist < nearestDist ? current : nearest
    })
  }

  /**
   * Filter beacons by proximity
   */
  filterByProximity(
    beacons: Beacon[],
    proximity: BeaconProximity | BeaconProximity[]
  ): Beacon[] {
    const proximities = Array.isArray(proximity) ? proximity : [proximity]
    return beacons.filter(beacon => proximities.includes(beacon.proximity))
  }

  /**
   * Start background monitoring (for background location tracking)
   */
  async startBackgroundMonitoring(): Promise<void> {
    try {
      await this.init()

      if (Platform.OS === 'ios') {
        // iOS supports background beacon monitoring
        await Beacons.allowsBackgroundLocationUpdates(true)
      }

      await this.startMonitoring()
      console.log('Background beacon monitoring started')
    } catch (error) {
      console.error('Error starting background monitoring:', error)
    }
  }

  /**
   * Clean up and release resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stopRanging()
      await this.stopMonitoring()

      this.beaconCallbacks = []
      this.vehicleBeaconCallbacks = []
      this.geofenceCallbacks = []
      this.regions.clear()
      this.vehicleBeaconMap.clear()
      this.lastNotificationTime.clear()

      console.log('Beacon service cleaned up')
    } catch (error) {
      console.error('Error cleaning up beacon service:', error)
    }
  }
}

// Export singleton instance
export default new BeaconServiceClass()
