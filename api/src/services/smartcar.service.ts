/**
 * Smartcar Connected Vehicle Service
 * Supports 50+ car brands (Tesla, Ford, GM, Mercedes, BMW, etc.)
 * Remote control: lock/unlock, start/stop, locate, charge
 * Full signal support: diagnostics, tires, oil, speed, compass, security, and more
 *
 * Security: Uses SSRF-protected HTTP client to prevent server-side request forgery
 */

import { AxiosInstance } from 'axios'
import { Pool } from 'pg'
import querystring from 'querystring'

import logger from '../config/logger'
import { createSafeAxiosInstance, safePost, safeDelete } from '../utils/ssrf-protection'

// Allowed domains for Smartcar requests
const SMARTCAR_ALLOWED_DOMAINS = [
  'api.smartcar.com',
  'auth.smartcar.com',
  'connect.smartcar.com',
  'management.smartcar.com',
]

const SMARTCAR_CLIENT_ID = process.env.SMARTCAR_CLIENT_ID
const SMARTCAR_CLIENT_SECRET = process.env.SMARTCAR_CLIENT_SECRET
const SMARTCAR_REDIRECT_URI = process.env.SMARTCAR_REDIRECT_URI // Required - no default
const SMARTCAR_MODE = process.env.SMARTCAR_MODE || 'live' // 'test' or 'live'

// Full scope list for all supported signals
const SMARTCAR_SCOPES = [
  'required:read_vehicle_info',
  'required:read_vin',
  'required:read_location',
  'required:read_odometer',
  'read_speedometer',
  'read_compass',
  'required:read_battery',
  'required:read_charge',
  'required:control_charge',
  'required:read_fuel',
  'required:control_security',
  'read_security',
  'required:read_engine_oil',
  'read_diagnostics',
  'required:read_tires',
  'read_climate',
  'read_thermometer',
  'read_alerts',
  'read_service_history',
  'read_user_profile',
  'read_extended_vehicle_info',
]

// Validate required Smartcar configuration at runtime rather than module load
// This prevents the server from crashing when SmartCar is not configured
const isSmartcarConfigured = (): boolean => {
  if (SMARTCAR_CLIENT_ID && !SMARTCAR_REDIRECT_URI) {
    logger.warn('SMARTCAR_REDIRECT_URI not set - SmartCar integration will be disabled')
    return false
  }
  return !!(SMARTCAR_CLIENT_ID && SMARTCAR_CLIENT_SECRET && SMARTCAR_REDIRECT_URI)
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

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

interface SmartcarTirePressure {
  frontLeft: number | null
  frontRight: number | null
  backLeft: number | null
  backRight: number | null
  timestamp: string
}

interface SmartcarEngineOil {
  lifeRemaining: number | null
  timestamp: string
}

interface SmartcarDiagnostics {
  dtcCount: number
  dtcCodes: string[]
  milStatus: boolean | null
  timestamp: string
}

interface SmartcarLockStatus {
  isLocked: boolean | null
  doors: Array<{ type: string; status: string }> | null
  timestamp: string
}

interface SmartcarExtendedInfo {
  make: string | null
  model: string | null
  year: number | null
  trimLevel: string | null
  exteriorColor: string | null
  nickname: string | null
  timestamp: string
}

export interface SmartcarAllSignals {
  location: SmartcarLocation | null
  odometer: SmartcarOdometer | null
  speed: { speed: number; timestamp: string } | null
  battery: SmartcarBattery | null
  fuel: SmartcarFuel | null
  charge: SmartcarCharge | null
  tires: SmartcarTirePressure | null
  oil: SmartcarEngineOil | null
  diagnostics: SmartcarDiagnostics | null
  lockStatus: SmartcarLockStatus | null
  vehicleInfo: SmartcarExtendedInfo | null
  vin: string | null
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class SmartcarService {
  private api: AxiosInstance | null = null
  private db: Pool
  private configured: boolean = false

  constructor(db: Pool) {
    this.db = db
    this.configured = isSmartcarConfigured()

    if (this.configured) {
      // SSRF Protection: Use safe axios instance with domain allowlist
      this.api = createSafeAxiosInstance('https://api.smartcar.com/v2.0', {
        timeout: 30000,
        allowedDomains: SMARTCAR_ALLOWED_DOMAINS,
      })
    }
  }

  isConfigured(): boolean {
    return this.configured
  }

  getMode(): string {
    return SMARTCAR_MODE
  }

  private ensureConfigured(): void {
    if (!this.configured || !this.api) {
      throw new Error('SmartCar is not configured. Please set SMARTCAR_CLIENT_ID, SMARTCAR_CLIENT_SECRET, and SMARTCAR_REDIRECT_URI')
    }
  }

  private authHeaders(accessToken: string) {
    return { Authorization: `Bearer ${accessToken}` }
  }

  // =========================================================================
  // OAuth Flow
  // =========================================================================

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: SMARTCAR_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: SMARTCAR_REDIRECT_URI || '',
      scope: SMARTCAR_SCOPES.join(' '),
      mode: SMARTCAR_MODE,
      ...(state && { state })
    } as Record<string, string>)

    return `https://connect.smartcar.com/oauth/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }> {
    // Smartcar OAuth endpoint requires form-urlencoded, not JSON
    const data = querystring.stringify({
      code,
      grant_type: 'authorization_code',
      redirect_uri: SMARTCAR_REDIRECT_URI,
      client_id: SMARTCAR_CLIENT_ID,
      client_secret: SMARTCAR_CLIENT_SECRET
    })

    // SSRF Protection: Use safe HTTP client with domain allowlist
    const response = await safePost(
      `https://auth.smartcar.com/oauth/token`,
      data,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        allowedDomains: SMARTCAR_ALLOWED_DOMAINS,
      }
    )

    return response.data
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }> {
    // Smartcar OAuth endpoint requires form-urlencoded, not JSON
    const data = querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SMARTCAR_CLIENT_ID,
      client_secret: SMARTCAR_CLIENT_SECRET
    })

    // SSRF Protection: Use safe HTTP client with domain allowlist
    const response = await safePost(
      'https://auth.smartcar.com/oauth/token',
      data,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        allowedDomains: SMARTCAR_ALLOWED_DOMAINS,
      }
    )

    return response.data
  }

  // =========================================================================
  // Vehicle Lists & Info
  // =========================================================================

  async getVehicles(accessToken: string): Promise<string[]> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles`, {
      headers: this.authHeaders(accessToken)
    })
    return response.data.vehicles
  }

  async getVehicleInfo(vehicleId: string, accessToken: string): Promise<SmartcarVehicle> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}`, {
      headers: this.authHeaders(accessToken)
    })
    return response.data
  }

  async getVehicleVin(vehicleId: string, accessToken: string): Promise<string> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/vin`, {
      headers: this.authHeaders(accessToken)
    })
    return response.data.vin
  }

  async getExtendedInfo(vehicleId: string, accessToken: string): Promise<SmartcarExtendedInfo> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      make: response.data.make ?? null,
      model: response.data.model ?? null,
      year: response.data.year ?? null,
      trimLevel: response.data.trim ?? null,
      exteriorColor: response.data.color ?? null,
      nickname: response.data.name ?? null,
      timestamp: response.data.meta?.dataAge || new Date().toISOString(),
    }
  }

  // =========================================================================
  // Location & Movement
  // =========================================================================

  async getLocation(vehicleId: string, accessToken: string): Promise<SmartcarLocation> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/location`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getOdometer(vehicleId: string, accessToken: string): Promise<SmartcarOdometer> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/odometer`, {
      headers: this.authHeaders(accessToken)
    })
    // Convert km to miles
    const miles = response.data.distance * 0.621371
    return {
      distance: miles,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getSpeedometer(vehicleId: string, accessToken: string): Promise<{ speed: number; timestamp: string }> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/speedometer`, {
      headers: this.authHeaders(accessToken)
    })
    // Convert km/h to mph
    const mph = (response.data.speed ?? 0) * 0.621371
    return {
      speed: mph,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getCompass(vehicleId: string, accessToken: string): Promise<{ heading: number; timestamp: string }> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/compass`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      heading: response.data.heading ?? 0,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  // =========================================================================
  // Battery, Fuel & Charging
  // =========================================================================

  async getBattery(vehicleId: string, accessToken: string): Promise<SmartcarBattery> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/battery`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      percentRemaining: response.data.percentRemaining,
      range: response.data.range * 0.621371, // Convert km to miles
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getFuel(vehicleId: string, accessToken: string): Promise<SmartcarFuel> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/fuel`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      percentRemaining: response.data.percentRemaining,
      amountRemaining: response.data.amountRemaining,
      range: response.data.range * 0.621371, // Convert km to miles
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getChargeStatus(vehicleId: string, accessToken: string): Promise<SmartcarCharge> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/charge`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      isPluggedIn: response.data.isPluggedIn,
      state: response.data.state,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  // =========================================================================
  // Diagnostics & Maintenance
  // =========================================================================

  async getDiagnostics(vehicleId: string, accessToken: string): Promise<SmartcarDiagnostics> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/diagnostics`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      dtcCount: response.data.diagnosticTroubleCodes?.length ?? 0,
      dtcCodes: (response.data.diagnosticTroubleCodes ?? []).map((d: any) => d.code),
      milStatus: response.data.milStatus ?? null,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getEngineOil(vehicleId: string, accessToken: string): Promise<SmartcarEngineOil> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/engine/oil`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      lifeRemaining: response.data.lifeRemaining ?? null,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async getTirePressure(vehicleId: string, accessToken: string): Promise<SmartcarTirePressure> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/tires/pressure`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      frontLeft: response.data.frontLeft ?? null,
      frontRight: response.data.frontRight ?? null,
      backLeft: response.data.backLeft ?? null,
      backRight: response.data.backRight ?? null,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  // =========================================================================
  // Security
  // =========================================================================

  async getLockStatus(vehicleId: string, accessToken: string): Promise<SmartcarLockStatus> {
    this.ensureConfigured()
    const response = await this.api!.get(`/vehicles/${vehicleId}/security`, {
      headers: this.authHeaders(accessToken)
    })
    return {
      isLocked: response.data.isLocked ?? null,
      doors: response.data.doors ?? null,
      timestamp: response.data.meta?.dataAge || new Date().toISOString()
    }
  }

  async lockDoors(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    this.ensureConfigured()
    const response = await this.api!.post(
      `/vehicles/${vehicleId}/security`,
      { action: 'LOCK' },
      {
        headers: {
          ...this.authHeaders(accessToken),
          'Content-Type': 'application/json'
        }
      }
    )
    return {
      status: response.data.status,
      message: response.data.message || 'Doors locked successfully'
    }
  }

  async unlockDoors(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    this.ensureConfigured()
    const response = await this.api!.post(
      `/vehicles/${vehicleId}/security`,
      { action: 'UNLOCK' },
      {
        headers: {
          ...this.authHeaders(accessToken),
          'Content-Type': 'application/json'
        }
      }
    )
    return {
      status: response.data.status,
      message: response.data.message || 'Doors unlocked successfully'
    }
  }

  // =========================================================================
  // Charging Control
  // =========================================================================

  async startCharging(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    this.ensureConfigured()
    const response = await this.api!.post(
      `/vehicles/${vehicleId}/charge`,
      { action: 'START' },
      {
        headers: {
          ...this.authHeaders(accessToken),
          'Content-Type': 'application/json'
        }
      }
    )
    return {
      status: response.data.status,
      message: response.data.message || 'Charging started successfully'
    }
  }

  async stopCharging(vehicleId: string, accessToken: string): Promise<{ status: string; message: string }> {
    this.ensureConfigured()
    const response = await this.api!.post(
      `/vehicles/${vehicleId}/charge`,
      { action: 'STOP' },
      {
        headers: {
          ...this.authHeaders(accessToken),
          'Content-Type': 'application/json'
        }
      }
    )
    return {
      status: response.data.status,
      message: response.data.message || 'Charging stopped successfully'
    }
  }

  // =========================================================================
  // Batch: Get All Signals
  // =========================================================================

  async getAllSignals(vehicleId: string, accessToken: string): Promise<SmartcarAllSignals> {
    this.ensureConfigured()

    const results: SmartcarAllSignals = {
      location: null,
      odometer: null,
      speed: null,
      battery: null,
      fuel: null,
      charge: null,
      tires: null,
      oil: null,
      diagnostics: null,
      lockStatus: null,
      vehicleInfo: null,
      vin: null,
    }

    // Fetch all signals in parallel, catching individual failures
    const fetchers = [
      this.getLocation(vehicleId, accessToken).then(v => { results.location = v }).catch(() => {}),
      this.getOdometer(vehicleId, accessToken).then(v => { results.odometer = v }).catch(() => {}),
      this.getSpeedometer(vehicleId, accessToken).then(v => { results.speed = v }).catch(() => {}),
      this.getBattery(vehicleId, accessToken).then(v => { results.battery = v }).catch(() => {}),
      this.getFuel(vehicleId, accessToken).then(v => { results.fuel = v }).catch(() => {}),
      this.getChargeStatus(vehicleId, accessToken).then(v => { results.charge = v }).catch(() => {}),
      this.getTirePressure(vehicleId, accessToken).then(v => { results.tires = v }).catch(() => {}),
      this.getEngineOil(vehicleId, accessToken).then(v => { results.oil = v }).catch(() => {}),
      this.getDiagnostics(vehicleId, accessToken).then(v => { results.diagnostics = v }).catch(() => {}),
      this.getLockStatus(vehicleId, accessToken).then(v => { results.lockStatus = v }).catch(() => {}),
      this.getExtendedInfo(vehicleId, accessToken).then(v => { results.vehicleInfo = v }).catch(() => {}),
      this.getVehicleVin(vehicleId, accessToken).then(v => { results.vin = v }).catch(() => {}),
    ]

    await Promise.allSettled(fetchers)

    return results
  }

  // =========================================================================
  // Disconnect
  // =========================================================================

  async disconnectVehicle(accessToken: string): Promise<void> {
    // SSRF Protection: Use safe HTTP client with domain allowlist
    await safeDelete(`https://management.smartcar.com/oauth/token`, {
      headers: this.authHeaders(accessToken),
      allowedDomains: SMARTCAR_ALLOWED_DOMAINS,
    })
  }

  // =========================================================================
  // Database Operations
  // =========================================================================

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

  async getVehicleConnection(vehicleId: string | number): Promise<{
    external_vehicle_id: string
    access_token: string
    refresh_token: string
    token_expires_at: Date
    metadata?: any
    sync_status?: string
    sync_error?: string
    updated_at?: Date
  } | null> {
    const result = await this.db.query(
      `SELECT external_vehicle_id, access_token, refresh_token, token_expires_at,
              metadata, sync_status, sync_error, updated_at
       FROM vehicle_telematics_connections
       WHERE vehicle_id = $1
       AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')
       AND sync_status = 'active'`,
      [vehicleId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async getAllConnections(tenantId?: string): Promise<any[]> {
    const query = tenantId
      ? `SELECT vtc.*, (v.year || ' ' || v.make || ' ' || v.model) as vehicle_name, v.make, v.model, v.year, v.license_plate
         FROM vehicle_telematics_connections vtc
         JOIN vehicles v ON v.id = vtc.vehicle_id
         WHERE vtc.provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')
         AND v.tenant_id = $1
         ORDER BY vtc.updated_at DESC`
      : `SELECT vtc.*, (v.year || ' ' || v.make || ' ' || v.model) as vehicle_name, v.make, v.model, v.year, v.license_plate
         FROM vehicle_telematics_connections vtc
         JOIN vehicles v ON v.id = vtc.vehicle_id
         WHERE vtc.provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')
         ORDER BY vtc.updated_at DESC`

    const result = await this.db.query(query, tenantId ? [tenantId] : [])
    return result.rows
  }

  async ensureValidToken(vehicleId: string | number): Promise<string> {
    const connection = await this.getVehicleConnection(vehicleId)

    if (!connection) {
      throw new Error(`Vehicle not connected to Smartcar`)
    }

    // Check if using management token (test mode) - these don't expire
    const isManagementToken = connection.metadata?.using_management_token === true
    if (isManagementToken) {
      logger.debug('Using Smartcar management token for test mode', { vehicleId })
      return connection.access_token
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const expiresAt = new Date(connection.token_expires_at)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt <= fiveMinutesFromNow) {
      logger.info('Refreshing Smartcar token', { vehicleId })

      // Refresh token (only if not using management token)
      if (!connection.refresh_token) {
        throw new Error(`No refresh token available for vehicle ${vehicleId}`)
      }

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

  async syncVehicleData(vehicleId: string | number): Promise<void> {
    const accessToken = await this.ensureValidToken(vehicleId)
    const connection = await this.getVehicleConnection(vehicleId)

    if (!connection) {
      return
    }

    const smartcarVehicleId = connection.external_vehicle_id

    try {
      // Get location from Smartcar API
      const location = await this.getLocation(smartcarVehicleId, accessToken)

      // In test mode, use route-based simulation around Tallahassee, FL
      let lat = location.latitude
      let lng = location.longitude
      if (SMARTCAR_MODE === 'test') {
        // Determine route index from the vehicle's order in the connections table
        const { rows: connRows } = await this.db.query(
          `SELECT vehicle_id FROM vehicle_telematics_connections vtc
           JOIN telematics_providers tp ON vtc.provider_id = tp.id
           WHERE tp.name = 'smartcar' AND vtc.sync_status != 'disconnected'
           ORDER BY vtc.vehicle_id`
        )
        const routeIdx = connRows.findIndex((r: { vehicle_id: string }) => String(r.vehicle_id) === String(vehicleId))
        const ROUTES: [number, number][][] = [
          [[30.4383,-84.2807],[30.4450,-84.2920],[30.4427,-84.2985],[30.4350,-84.3050],[30.4250,-84.3150],[30.4100,-84.3300],[30.3970,-84.3450],[30.3926,-84.3503],[30.4000,-84.3400],[30.4100,-84.3200],[30.4200,-84.3050],[30.4300,-84.2920]],
          [[30.4550,-84.2750],[30.4620,-84.2680],[30.4720,-84.2600],[30.4830,-84.2550],[30.4900,-84.2650],[30.4880,-84.2800],[30.4800,-84.2950],[30.4700,-84.3020],[30.4600,-84.2950],[30.4530,-84.2850]],
        ]
        const CYCLE_MS = 300_000
        const route = ROUTES[(routeIdx >= 0 ? routeIdx : 0) % ROUTES.length]
        const progress = (Date.now() % CYCLE_MS) / CYCLE_MS
        const segFloat = progress * route.length
        const segIdx = Math.floor(segFloat) % route.length
        const segProgress = segFloat - Math.floor(segFloat)
        const start = route[segIdx]
        const end = route[(segIdx + 1) % route.length]
        lat = start[0] + (end[0] - start[0]) * segProgress
        lng = start[1] + (end[1] - start[1]) * segProgress
      }

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
      } catch (err: unknown) {
        // Not an EV or no permission, try fuel
        try {
          const fuel = await this.getFuel(smartcarVehicleId, accessToken)
          fuelPercent = fuel.percentRemaining
          range = fuel.range
        } catch {
          // Neither available or no permission - that's OK, we have location data
          logger.debug('Battery and fuel data not available for vehicle', { smartcarVehicleId })
        }
      }

      // Insert telemetry record
      // Round range to integer for estimated_range_miles column
      const rangeRounded = range !== null ? Math.round(range) : null
      // Round odometer to 2 decimal places for numeric column
      const odometerRounded = Math.round(odometer.distance * 100) / 100
      await this.db.query(
        `INSERT INTO vehicle_telemetry
         (vehicle_id, provider_id, timestamp, latitude, longitude,
          odometer_miles, battery_percent, fuel_percent, estimated_range_miles)
         VALUES ($1, (SELECT id FROM telematics_providers WHERE name = 'smartcar'),
                 NOW(), $2, $3, $4, $5, $6, $7)`,
        [vehicleId, lat, lng, odometerRounded, batteryPercent, fuelPercent, rangeRounded]
      )

      // Update vehicle's current position and odometer
      await this.db.query(
        `UPDATE vehicles
         SET latitude = $2, longitude = $3, odometer = $4, last_gps_update = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [vehicleId, lat, lng, odometerRounded]
      )

      // Update last sync time
      await this.db.query(
        `UPDATE vehicle_telematics_connections
         SET sync_status = 'active', sync_error = NULL, last_sync_at = NOW(), updated_at = NOW()
         WHERE vehicle_id = $1
         AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')`,
        [vehicleId]
      )

      logger.info('Synced Smartcar data for vehicle', { vehicleId })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      logger.error('Error syncing Smartcar vehicle', { vehicleId, error: errorMessage })

      // Update connection status
      await this.db.query(
        `UPDATE vehicle_telematics_connections
         SET sync_status = 'error', sync_error = $1
         WHERE vehicle_id = $2
         AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')`,
        [errorMessage, vehicleId]
      )
    }
  }
}

export default SmartcarService
