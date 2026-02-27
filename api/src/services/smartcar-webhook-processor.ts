/**
 * Smartcar Webhook Event Processor
 *
 * Processes VEHICLE_STATE webhook payloads from Smartcar into:
 *  - telematics_data (detailed telemetry records)
 *  - vehicles table (latest location/odometer update)
 *  - smartcar_vehicles (last_sync_at, metadata)
 */

import { Pool } from 'pg'

import logger from '../config/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmartcarSignal {
  code: string
  name: string
  group: string
  body: Record<string, any>
  status: { value: string }
  meta: { oemUpdatedAt: number; retrievedAt: number }
}

interface SmartcarVehicleState {
  eventId: string
  eventType: string
  data: {
    user?: { id: string }
    vehicle: {
      id: string
      make: string
      model: string
      year: number
      powertrainType?: string
    }
    signals: SmartcarSignal[]
  }
  triggers?: any[]
  meta?: {
    version: string
    webhookId: string
    webhookName: string
    deliveryId: string
    deliveredAt: number
    mode: string
    signalCount: number
  }
}

interface ExtractedTelemetry {
  latitude: number | null
  longitude: number | null
  heading_degrees: number | null
  speed_mph: number | null
  fuel_level_percent: number | null
  odometer_miles: number | null
  battery_voltage: number | null
  dtc_codes: string[] | null
  mil_status: boolean | null
  metadata: Record<string, any>
  recorded_at: Date
}

// ---------------------------------------------------------------------------
// Signal extraction helpers
// ---------------------------------------------------------------------------

function findSignal(signals: SmartcarSignal[], code: string): SmartcarSignal | undefined {
  return signals.find(s => s.code === code && s.status.value === 'SUCCESS')
}

function kmToMiles(km: number): number {
  return Math.round(km * 0.621371 * 100) / 100
}

function extractTelemetry(signals: SmartcarSignal[]): ExtractedTelemetry {
  const metadata: Record<string, any> = {}
  let recorded_at = new Date()

  // Location
  const location = findSignal(signals, 'location-preciselocation')
  const latitude = location?.body.latitude ?? null
  const longitude = location?.body.longitude ?? null
  const heading_degrees = location?.body.heading ? Math.round(location.body.heading) : null

  // Use the signal timestamp as recorded_at if available
  if (location?.meta?.retrievedAt) {
    recorded_at = new Date(location.meta.retrievedAt)
  }

  // Odometer (Smartcar sends in km)
  const odometer = findSignal(signals, 'odometer-traveleddistance')
  const odometer_miles = odometer?.body.value != null
    ? kmToMiles(odometer.body.value)
    : null
  if (odometer?.body.value != null) {
    metadata.odometer_km = odometer.body.value
  }

  // Fuel level
  const fuel = findSignal(signals, 'internalcombustionengine-fuellevel')
  const fuel_level_percent = fuel?.body.value ?? null

  // 12V battery
  const lowBattery = findSignal(signals, 'lowvoltagebattery-stateofcharge')
  const battery_voltage = lowBattery?.body.value ?? null
  if (lowBattery) {
    metadata.low_voltage_battery_percent = lowBattery.body.value
    const batteryStatus = findSignal(signals, 'lowvoltagebattery-status')
    if (batteryStatus) metadata.low_voltage_battery_status = batteryStatus.body.value
  }

  // DTC codes
  const dtcList = findSignal(signals, 'diagnostics-dtclist')
  const dtc_codes = dtcList?.body.values?.map((d: any) => d.code) ?? null

  // MIL status
  const mil = findSignal(signals, 'diagnostics-mil')
  const mil_status = mil ? mil.body.status !== 'OK' : null

  // ---- EV / Traction Battery ----
  const soc = findSignal(signals, 'tractionbattery-stateofcharge')
  if (soc) metadata.battery_percent = soc.body.value

  const range = findSignal(signals, 'tractionbattery-range')
  if (range) {
    metadata.estimated_range_km = range.body.value
    metadata.estimated_range_miles = kmToMiles(range.body.value)
    if (range.body.additionalValues) metadata.range_variants = range.body.additionalValues
  }

  const capacity = findSignal(signals, 'tractionbattery-nominalcapacity')
  if (capacity) metadata.battery_capacity_kwh = capacity.body.capacity

  // ---- Charge state ----
  const isCharging = findSignal(signals, 'charge-ischarging')
  if (isCharging) metadata.is_charging = isCharging.body.value

  const chargingStatus = findSignal(signals, 'charge-detailedchargingstatus')
  if (chargingStatus) metadata.charging_status = chargingStatus.body.value

  const amperage = findSignal(signals, 'charge-amperage')
  if (amperage) metadata.charge_amperage = amperage.body.value

  const voltage = findSignal(signals, 'charge-voltage')
  if (voltage) metadata.charge_voltage = voltage.body.value

  const wattage = findSignal(signals, 'charge-wattage')
  if (wattage) metadata.charge_wattage = wattage.body.value

  const energyAdded = findSignal(signals, 'charge-energyadded')
  if (energyAdded) metadata.energy_added_kwh = energyAdded.body.value

  const timeToComplete = findSignal(signals, 'charge-timetocomplete')
  if (timeToComplete) metadata.charge_minutes_remaining = timeToComplete.body.value

  const chargeLimit = findSignal(signals, 'charge-chargelimits')
  if (chargeLimit) metadata.charge_limits = chargeLimit.body.values

  const chargeRecords = findSignal(signals, 'charge-chargerecords')
  if (chargeRecords) metadata.charge_records = chargeRecords.body.values

  const connectorType = findSignal(signals, 'charge-chargingconnectortype')
  if (connectorType) metadata.charging_connector = connectorType.body.value

  const cableConnected = findSignal(signals, 'charge-ischargingcableconnected')
  if (cableConnected) metadata.cable_connected = cableConnected.body.value

  // ---- Climate / HVAC ----
  const extTemp = findSignal(signals, 'climate-externaltemperature')
  if (extTemp) metadata.external_temp_c = extTemp.body.value

  const intTemp = findSignal(signals, 'climate-internaltemperature')
  if (intTemp) metadata.internal_temp_c = intTemp.body.value

  const hvacActive = findSignal(signals, 'hvac-iscabinhvacactive')
  if (hvacActive) metadata.hvac_active = hvacActive.body.value

  const targetTemp = findSignal(signals, 'hvac-cabintargettemperature')
  if (targetTemp) metadata.hvac_target_temp_c = targetTemp.body.value

  // ---- Lock / Security ----
  const locked = findSignal(signals, 'closure-islocked')
  if (locked) metadata.is_locked = locked.body.value

  // ---- Connectivity ----
  const isOnline = findSignal(signals, 'connectivitystatus-isonline')
  if (isOnline) metadata.is_online = isOnline.body.value

  const isAsleep = findSignal(signals, 'connectivitystatus-isasleep')
  if (isAsleep) metadata.is_asleep = isAsleep.body.value

  const firmware = findSignal(signals, 'connectivitysoftware-currentfirmwareversion')
  if (firmware) metadata.firmware_version = firmware.body.value

  // ---- Location extras ----
  const isAtHome = findSignal(signals, 'location-isathome')
  if (isAtHome) metadata.is_at_home = isAtHome.body.value

  // ---- Vehicle identity ----
  const nickname = findSignal(signals, 'vehicleidentification-nickname')
  if (nickname) metadata.nickname = nickname.body.value

  // ---- Oil life (ICE) ----
  const oilLife = findSignal(signals, 'internalcombustionengine-oillife')
  if (oilLife) metadata.oil_life_percent = oilLife.body.value

  // ---- Diagnostics summary ----
  const diagSignals = signals.filter(s => s.group === 'Diagnostics' && s.status.value === 'SUCCESS')
  const diagWarnings = diagSignals.filter(s => s.body.status && s.body.status !== 'OK')
  if (diagWarnings.length > 0) {
    metadata.diagnostic_warnings = diagWarnings.map(s => ({
      name: s.name,
      status: s.body.status,
      description: s.body.description,
    }))
  }
  const dtcCount = findSignal(signals, 'diagnostics-dtccount')
  if (dtcCount) metadata.dtc_count = dtcCount.body.value

  return {
    latitude,
    longitude,
    heading_degrees,
    speed_mph: null, // Smartcar doesn't send speed in webhook signals
    fuel_level_percent,
    odometer_miles,
    battery_voltage,
    dtc_codes,
    mil_status,
    metadata,
    recorded_at,
  }
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function processWebhookEvent(
  pool: Pool,
  payload: SmartcarVehicleState,
  tenantId: string,
): Promise<{ vehicle_id: string; telemetry_id: string; signals_processed: number }> {
  const smartcarVehicleId = payload.data.vehicle.id
  const vehicleInfo = payload.data.vehicle
  const signals = payload.data.signals

  // Use a dedicated client so we can SET the tenant context for RLS
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`)

    // Debug: verify tenant context is set
    const tenantCheck = await client.query(`SELECT current_setting('app.current_tenant_id', true) as tid`)
    logger.info('Tenant context set for webhook processing', { tenant_id: tenantCheck.rows[0].tid })

    // 1. Find or create the smartcar_vehicles link
    let linkRow = await client.query(
      `SELECT sv.id, sv.vehicle_id FROM smartcar_vehicles sv WHERE sv.smartcar_vehicle_id = $1`,
      [smartcarVehicleId],
    )

    let fleetVehicleId: string

    if (linkRow.rows.length === 0) {
      // Dev convenience: auto-create vehicle + link
      logger.info(`No smartcar_vehicles link for ${smartcarVehicleId}, auto-creating vehicle`, {
        make: vehicleInfo.make,
        model: vehicleInfo.model,
      })

      // Generate a placeholder VIN from the Smartcar vehicle ID
      const placeholderVin = `SC${smartcarVehicleId.replace(/-/g, '').substring(0, 15)}`

      const fuelType = vehicleInfo.powertrainType === 'BEV' ? 'electric'
        : vehicleInfo.powertrainType === 'PHEV' ? 'hybrid'
        : 'gasoline'

      const newVehicle = await client.query(
        `INSERT INTO vehicles (tenant_id, vin, make, model, year, fuel_type, status, vehicle_type)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', 'sedan')
         ON CONFLICT (vin) DO UPDATE SET make = EXCLUDED.make
         RETURNING id`,
        [tenantId, placeholderVin, vehicleInfo.make, vehicleInfo.model, vehicleInfo.year, fuelType],
      )
      fleetVehicleId = newVehicle.rows[0].id

      await client.query(
        `INSERT INTO smartcar_vehicles
         (tenant_id, vehicle_id, smartcar_vehicle_id, make, model, year, connected, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)
         ON CONFLICT (smartcar_vehicle_id) DO UPDATE SET
           connected = true, updated_at = NOW()
         RETURNING id, vehicle_id`,
        [
          tenantId,
          fleetVehicleId,
          smartcarVehicleId,
          vehicleInfo.make,
          vehicleInfo.model,
          vehicleInfo.year,
          JSON.stringify({ powertrainType: vehicleInfo.powertrainType }),
        ],
      )

      logger.info(`Created vehicle ${fleetVehicleId} and smartcar link for ${smartcarVehicleId}`)
    } else {
      fleetVehicleId = linkRow.rows[0].vehicle_id
    }

    // 2. Extract telemetry from signals
    const telemetry = extractTelemetry(signals)

    // Store webhook metadata in the telemetry metadata
    telemetry.metadata.smartcar_event_id = payload.eventId
    telemetry.metadata.smartcar_vehicle_id = smartcarVehicleId
    telemetry.metadata.webhook_mode = payload.meta?.mode
    telemetry.metadata.signal_count = payload.meta?.signalCount ?? signals.length
    telemetry.metadata.vehicle_info = {
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      year: vehicleInfo.year,
      powertrainType: vehicleInfo.powertrainType,
    }

    // 3. Insert into telematics_data
    const insertResult = await client.query(
      `INSERT INTO telematics_data (
         tenant_id, vehicle_id, latitude, longitude, heading_degrees,
         speed_mph, fuel_level_percent, odometer_miles, battery_voltage,
         dtc_codes, mil_status, source, external_id, metadata, recorded_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [
        tenantId,
        fleetVehicleId,
        telemetry.latitude,
        telemetry.longitude,
        telemetry.heading_degrees,
        telemetry.speed_mph,
        telemetry.fuel_level_percent,
        telemetry.odometer_miles,
        telemetry.battery_voltage,
        telemetry.dtc_codes,
        telemetry.mil_status,
        'smartcar-webhook',
        payload.eventId,
        JSON.stringify(telemetry.metadata),
        telemetry.recorded_at,
      ],
    )

    // 4. Update vehicle's latest location + odometer
    const vehicleUpdates: string[] = []
    const vehicleParams: any[] = []
    let paramIdx = 1

    if (telemetry.latitude != null && telemetry.longitude != null) {
      vehicleUpdates.push(`latitude = $${paramIdx++}`)
      vehicleParams.push(telemetry.latitude)
      vehicleUpdates.push(`longitude = $${paramIdx++}`)
      vehicleParams.push(telemetry.longitude)
      vehicleUpdates.push(`last_gps_update = $${paramIdx++}`)
      vehicleParams.push(new Date())
    }
    if (telemetry.heading_degrees != null) {
      vehicleUpdates.push(`heading = $${paramIdx++}`)
      vehicleParams.push(telemetry.heading_degrees)
    }
    if (telemetry.odometer_miles != null) {
      vehicleUpdates.push(`odometer = $${paramIdx++}`)
      vehicleParams.push(telemetry.odometer_miles)
    }

    // Store rich telematics snapshot on the vehicle row
    vehicleUpdates.push(`telematics_data = $${paramIdx++}`)
    vehicleParams.push(JSON.stringify(telemetry.metadata))

    if (vehicleUpdates.length > 0) {
      vehicleParams.push(fleetVehicleId)
      await client.query(
        `UPDATE vehicles SET ${vehicleUpdates.join(', ')} WHERE id = $${paramIdx}`,
        vehicleParams,
      )
    }

    // 5. Update smartcar_vehicles last_sync_at
    await client.query(
      `UPDATE smartcar_vehicles SET last_sync_at = NOW(), updated_at = NOW() WHERE vehicle_id = $1`,
      [fleetVehicleId],
    )

    await client.query('COMMIT')

    const successSignals = signals.filter(s => s.status.value === 'SUCCESS').length

    logger.info(`Processed webhook for vehicle ${fleetVehicleId}`, {
      smartcar_vehicle_id: smartcarVehicleId,
      telemetry_id: insertResult.rows[0].id,
      signals_total: signals.length,
      signals_success: successSignals,
      has_location: telemetry.latitude != null,
      has_odometer: telemetry.odometer_miles != null,
      has_battery: telemetry.metadata.battery_percent != null,
    })

    return {
      vehicle_id: fleetVehicleId,
      telemetry_id: insertResult.rows[0].id,
      signals_processed: successSignals,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
