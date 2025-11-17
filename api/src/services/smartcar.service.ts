/**
 * Smartcar Connected Vehicle Service
 * Supports 50+ car brands (Tesla, Ford, GM, Mercedes, BMW, etc.)
 * Remote control: lock/unlock, start/stop, locate, charge
 */

import axios, { AxiosInstance } from 'axios'
import { Pool } from 'pg'

const SMARTCAR_CLIENT_ID = process.env.SMARTCAR_CLIENT_ID
const SMARTCAR_CLIENT_SECRET = process.env.SMARTCAR_CLIENT_SECRET
const SMARTCAR_REDIRECT_URI = process.env.SMARTCAR_REDIRECT_URI // Required - no default
const SMARTCAR_MODE = process.env.SMARTCAR_MODE || 'live' // 'test' or 'live'

// Validate required Smartcar configuration
if (SMARTCAR_CLIENT_ID && !SMARTCAR_REDIRECT_URI) {
  throw new Error('SMARTCAR_REDIRECT_URI must be set when SMARTCAR_CLIENT_ID is configured')
}

interface SmartcarVehicle {
  id: string
  make: string
  model: string
  year: number
  vin?: string
}

interface SmartcarLocation {
  latitude: number
  longitude: number
  timestamp: string
}

interface SmartcarOdometer {
  distance: number // in miles
  timestamp: string
}

interface SmartcarBattery {
  percentRemaining: number
  range: number // in miles
  timestamp: string
}

interface SmartcarFuel {
  percentRemaining: number
  amountRemaining: number // in liters
  range: number // in miles
  timestamp: string
}

interface SmartcarCharge {
  isPluggedIn: boolean
  state: 'FULLY_CHARGED' | 'CHARGING' | 'NOT_CHARGING'
  timestamp: string
}

class SmartcarService {
  private api: AxiosInstance
  private db: Pool

  constructor(db: Pool) {
    if (!SMARTCAR_CLIENT_ID || !SMARTCAR_CLIENT_SECRET) {
      throw new Error('SMARTCAR_CLIENT_ID and SMARTCAR_CLIENT_SECRET environment variables are required')
    }

    this.api = axios.create({
      baseURL: 'https://api.smartcar.com/v2.0',
      timeout: 30000
    })

    this.db = db
  }

  /**
   * Generate OAuth authorization URL for user to connect their vehicle
   */
  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: SMARTCAR_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: SMARTCAR_REDIRECT_URI,
      scope: [
        'required:read_vehicle_info',
        'required:read_location',
        'required:read_odometer',
        'required:control_security',
        'required:read_battery',
        'required:read_charge',
        'required:control_charge',
        'required:read_fuel',
        'required:read_engine_oil',
        'required:read_tires'
      ].join(' '),
      mode: SMARTCAR_MODE,
      ...(state && { state })
    })

    return `https://connect.smartcar.com/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(code: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }> {
    const response = await axios.post(
      'https://auth.smartcar.com/oauth/token',
      {
        code,
        grant_type: 'authorization_code',
        redirect_uri: SMARTCAR_REDIRECT_URI,
        client_id: SMARTCAR_CLIENT_ID,
        client_secret: SMARTCAR_CLIENT_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }> {
    const response = await axios.post(
      'https://auth.smartcar.com/oauth/token',
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SMARTCAR_CLIENT_ID,
        client_secret: SMARTCAR_CLIENT_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }

  /**
   * Get list of vehicle IDs accessible with this access token
   */
  async getVehicles(accessToken: string): Promise<string[]> {
    const response = await this.api.get('/vehicles', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return response.data.vehicles
  }

  /**
   * Get vehicle information (make, model, year)
   */
  async getVehicleInfo(vehicleId: string, accessToken: string): Promise<SmartcarVehicle> {
    const response = await this.api.get(`/vehicles/${vehicleId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return response.data
  }

  /**
   * Get vehicle VIN
   */
  async getVehicleVin(vehicleId: string, accessToken: string): Promise<string> {
    const response = await this.api.get(`/vehicles/${vehicleId}/vin`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return response.data.vin
  }

  /**
   * Get vehicle location
   */
  async getLocation(vehicleId: string, accessToken: string): Promise<SmartcarLocation> {
    const response = await this.api.get(`/vehicles/${vehicleId}/location`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return {
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timestamp: response.data.meta.dataAge
    }
  }

  /**
   * Get vehicle odometer reading
   */
  async getOdometer(vehicleId: string, accessToken: string): Promise<SmartcarOdometer> {
    const response = await this.api.get(`/vehicles/${vehicleId}/odometer`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    // Convert km to miles
    const miles = response.data.distance * 0.621371

    return {
      distance: miles,
      timestamp: response.data.meta.dataAge
    }
  }

  /**
   * Get EV battery level
   */
  async getBattery(vehicleId: string, accessToken: string): Promise<SmartcarBattery> {
    const response = await this.api.get(`/vehicles/${vehicleId}/battery`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return {
      percentRemaining: response.data.percentRemaining,
      range: response.data.range * 0.621371, // Convert km to miles
      timestamp: response.data.meta.dataAge
    }
  }

  /**
   * Get fuel tank level
   */
  async getFuel(vehicleId: string, accessToken: string): Promise<SmartcarFuel> {
    const response = await this.api.get(`/vehicles/${vehicleId}/fuel`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return {
      percentRemaining: response.data.percentRemaining,
      amountRemaining: response.data.amountRemaining,
      range: response.data.range * 0.621371, // Convert km to miles
      timestamp: response.data.meta.dataAge
    }
  }

  /**
   * Get EV charge status
   */
  async getChargeStatus(vehicleId: string, accessToken: string): Promise<SmartcarCharge> {
    const response = await this.api.get(`/vehicles/${vehicleId}/charge`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return {
      isPluggedIn: response.data.isPluggedIn,
      state: response.data.state,
      timestamp: response.data.meta.dataAge
    }
  }

  /**
   * Lock vehicle doors
   */
  async lockDoors(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    const response = await this.api.post(
      `/vehicles/${vehicleId}/security`,
      { action: 'LOCK' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      status: response.data.status,
      message: response.data.message || 'Doors locked successfully'
    }
  }

  /**
   * Unlock vehicle doors
   */
  async unlockDoors(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    const response = await this.api.post(
      `/vehicles/${vehicleId}/security`,
      { action: 'UNLOCK' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      status: response.data.status,
      message: response.data.message || 'Doors unlocked successfully'
    }
  }

  /**
   * Start EV charging
   */
  async startCharging(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    const response = await this.api.post(
      `/vehicles/${vehicleId}/charge`,
      { action: 'START' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      status: response.data.status,
      message: response.data.message || 'Charging started successfully'
    }
  }

  /**
   * Stop EV charging
   */
  async stopCharging(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    const response = await this.api.post(
      `/vehicles/${vehicleId}/charge`,
      { action: 'STOP' },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      status: response.data.status,
      message: response.data.message || 'Charging stopped successfully'
    }
  }

  /**
   * Disconnect Smartcar vehicle (revoke access)
   */
  async disconnectVehicle(accessToken: string): Promise<void> {
    await axios.delete('https://management.smartcar.com/oauth/token', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  }

  /**
   * Store vehicle connection in database
   */
  async storeVehicleConnection(
    vehicleId: number,
    smartcarVehicleId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    metadata: any
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    await this.db.query(
      `INSERT INTO vehicle_telematics_connections
       (vehicle_id, provider_id, external_vehicle_id, access_token, refresh_token,
        token_expires_at, metadata, sync_status)
       VALUES ($1, (SELECT id FROM telematics_providers WHERE name = 'smartcar'),
               $2, $3, $4, $5, $6, 'active')
       ON CONFLICT (vehicle_id, provider_id)
       DO UPDATE SET
         external_vehicle_id = EXCLUDED.external_vehicle_id,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at,
         metadata = EXCLUDED.metadata,
         sync_status = 'active',
         updated_at = NOW()`,
      [vehicleId, smartcarVehicleId, accessToken, refreshToken, expiresAt, JSON.stringify(metadata)]
    )
  }

  /**
   * Get vehicle connection from database
   */
  async getVehicleConnection(vehicleId: number): Promise<{
    external_vehicle_id: string
    access_token: string
    refresh_token: string
    token_expires_at: Date
  } | null> {
    const result = await this.db.query(
      `SELECT external_vehicle_id, access_token, refresh_token, token_expires_at
       FROM vehicle_telematics_connections
       WHERE vehicle_id = $1
       AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')
       AND sync_status = 'active'`,
      [vehicleId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Refresh token if expired
   */
  async ensureValidToken(vehicleId: number): Promise<string> {
    const connection = await this.getVehicleConnection(vehicleId)

    if (!connection) {
      throw new Error('Vehicle not connected to Smartcar')
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const expiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt <= fiveMinutesFromNow) {
      console.log(`Refreshing Smartcar token for vehicle ${vehicleId}`)

      // Refresh token
      const refreshed = await this.refreshAccessToken(connection.refresh_token)

      // Update database
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
      await this.db.query(
        `UPDATE vehicle_telematics_connections
         SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
         WHERE vehicle_id = $4
         AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')`,
        [refreshed.access_token, refreshed.refresh_token, newExpiresAt, vehicleId]
      )

      return refreshed.access_token
    }

    return connection.access_token
  }

  /**
   * Sync vehicle data to telemetry table
   */
  async syncVehicleData(vehicleId: number): Promise<void> {
    const accessToken = await this.ensureValidToken(vehicleId)
    const connection = await this.getVehicleConnection(vehicleId)

    if (!connection) return

    const smartcarVehicleId = connection.external_vehicle_id

    try {
      // Get location
      const location = await this.getLocation(smartcarVehicleId, accessToken)

      // Get odometer
      const odometer = await this.getOdometer(smartcarVehicleId, accessToken)

      // Try to get battery (for EVs) or fuel (for gas)
      let batteryPercent = null
      let fuelPercent = null
      let range = null

      try {
        const battery = await this.getBattery(smartcarVehicleId, accessToken)
        batteryPercent = battery.percentRemaining
        range = battery.range
      } catch (e) {
        // Not an EV, try fuel
        try {
          const fuel = await this.getFuel(smartcarVehicleId, accessToken)
          fuelPercent = fuel.percentRemaining
          range = fuel.range
        } catch (e2) {
          // Neither available
        }
      }

      // Insert telemetry record
      await this.db.query(
        `INSERT INTO vehicle_telemetry
         (vehicle_id, provider_id, timestamp, latitude, longitude,
          odometer_miles, battery_percent, fuel_percent, estimated_range_miles)
         VALUES ($1, (SELECT id FROM telematics_providers WHERE name = 'smartcar'),
                 NOW(), $2, $3, $4, $5, $6, $7)`,
        [vehicleId, location.latitude, location.longitude, odometer.distance, batteryPercent, fuelPercent, range]
      )

      console.log(`✅ Synced Smartcar data for vehicle ${vehicleId}`)
    } catch (error: any) {
      console.error(`Error syncing Smartcar vehicle ${vehicleId}:`, error.message)

      // Update connection status
      await this.db.query(
        `UPDATE vehicle_telematics_connections
         SET sync_status = 'error', sync_error = $1
         WHERE vehicle_id = $2
         AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')`,
        [error.message, vehicleId]
      )
    }
  }
}

export default SmartcarService
