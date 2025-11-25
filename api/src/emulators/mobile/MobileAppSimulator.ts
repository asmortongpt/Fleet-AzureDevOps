/**
 * MobileAppSimulator - Simulates all data that would be submitted from the mobile app
 *
 * SIMPLIFIED VERSION - Generates realistic mobile app submissions:
 * - Fuel receipts with photos (15-25/day across fleet)
 * - Damage reports with photos (5-10/day)
 * - Vehicle inspections (pre-trip, post-trip)
 * - Motion sensor events (harsh braking, acceleration)
 */

import { EventEmitter } from 'events'
import { Pool } from 'pg'
import { FuelReceiptGenerator, FuelTransaction } from './FuelReceiptGenerator'
import { DamageReportGenerator, DamageReport } from './DamageReportGenerator'
import { InspectionGenerator, VehicleInspection } from './InspectionGenerator'
import { MotionSensorSimulator, MotionEvent } from './MotionSensorSimulator'

export interface MobileAppConfig {
  database: {
    host: string
    port: number
    database: string
    user: string
    password: string
  }
  simulation: {
    fuelReceiptsPerDay: number // Default: 20
    damageReportsPerDay: number // Default: 5
    preTripInspectionRate: number // Default: 0.6 (60% of fleet)
    motionEventsPerHour: number // Default: 50
  }
}

interface VehicleData {
  id: string
  driverId: string
  driverName: string
  location: { lat: number; lng: number }
  odometer: number
  speed: number
  tankCapacity: number
  fuelType: string
}

export class MobileAppSimulator extends EventEmitter {
  private config: MobileAppConfig
  private pool: Pool
  private isRunning = false

  // Generators
  private fuelGenerator: FuelReceiptGenerator
  private damageGenerator: DamageReportGenerator
  private inspectionGenerator: InspectionGenerator
  private motionSimulator: MotionSensorSimulator

  // Timers
  private fuelTimer: NodeJS.Timeout | null = null
  private damageTimer: NodeJS.Timeout | null = null
  private inspectionTimer: NodeJS.Timeout | null = null
  private motionTimer: NodeJS.Timeout | null = null

  constructor(config: MobileAppConfig) {
    super()
    this.config = config
    this.pool = new Pool(config.database)

    this.fuelGenerator = new FuelReceiptGenerator()
    this.damageGenerator = new DamageReportGenerator()
    this.inspectionGenerator = new InspectionGenerator()
    this.motionSimulator = new MotionSensorSimulator()

    console.log('🚗 MobileAppSimulator initialized')
  }

  /**
   * Start the mobile app simulator
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  MobileAppSimulator already running')
      return
    }

    console.log('🚀 Starting MobileAppSimulator...')
    this.isRunning = true

    // Start fuel receipt generation (every 4 hours)
    const fuelInterval = (24 * 60 * 60 * 1000) / (this.config.simulation.fuelReceiptsPerDay / 5)
    this.fuelTimer = setInterval(() => this.generateFuelReceipts(), fuelInterval)

    // Start damage report generation (every 2 hours)
    const damageInterval = (24 * 60 * 60 * 1000) / (this.config.simulation.damageReportsPerDay / 2)
    this.damageTimer = setInterval(() => this.generateDamageReports(), damageInterval)

    // Start morning pre-trip inspections (once per day at 6am)
    const now = new Date()
    const nextSixAM = new Date(now)
    nextSixAM.setHours(6, 0, 0, 0)
    if (nextSixAM < now) {
      nextSixAM.setDate(nextSixAM.getDate() + 1)
    }
    const msUntilSixAM = nextSixAM.getTime() - now.getTime()

    setTimeout(() => {
      this.generatePreTripInspections()
      this.inspectionTimer = setInterval(() => this.generatePreTripInspections(), 24 * 60 * 60 * 1000)
    }, msUntilSixAM)

    // Start motion event generation (every hour)
    const motionInterval = (60 * 60 * 1000) / (this.config.simulation.motionEventsPerHour / 10)
    this.motionTimer = setInterval(() => this.generateMotionEvents(), motionInterval)

    // Generate some initial data
    await this.generateInitialData()

    console.log('✅ MobileAppSimulator started successfully')
    this.emit('started')
  }

  /**
   * Stop the simulator
   */
  public async stop(): Promise<void> {
    console.log('🛑 Stopping MobileAppSimulator...')
    this.isRunning = false

    if (this.fuelTimer) clearInterval(this.fuelTimer)
    if (this.damageTimer) clearInterval(this.damageTimer)
    if (this.inspectionTimer) clearInterval(this.inspectionTimer)
    if (this.motionTimer) clearInterval(this.motionTimer)

    await this.pool.end()

    console.log('✅ MobileAppSimulator stopped')
    this.emit('stopped')
  }

  /**
   * Generate initial data on startup
   */
  private async generateInitialData(): Promise<void> {
    console.log('📊 Generating initial mobile app data...')

    try {
      await this.generateFuelReceipts()
      await this.generateDamageReports()
      console.log('✅ Initial data generated')
    } catch (error) {
      console.error('❌ Error generating initial data:', error)
    }
  }

  /**
   * Generate fuel receipts
   */
  private async generateFuelReceipts(): Promise<void> {
    try {
      // Get some random vehicles that need fuel
      const vehicles = await this.getRandomVehicles(3)

      for (const vehicle of vehicles) {
        const transaction = this.fuelGenerator.generateFuelTransaction(
          vehicle.id,
          vehicle.driverId,
          vehicle.odometer,
          vehicle.tankCapacity,
          vehicle.fuelType
        )

        await this.saveFuelTransaction(transaction)

        console.log(`⛽ Generated fuel receipt for vehicle ${vehicle.id} at ${transaction.vendor}`)
        this.emit('fuel-receipt-generated', transaction)
      }
    } catch (error) {
      console.error('❌ Error generating fuel receipts:', error)
    }
  }

  /**
   * Generate damage reports
   */
  private async generateDamageReports(): Promise<void> {
    try {
      const vehicles = await this.getRandomVehicles(2)

      for (const vehicle of vehicles) {
        const report = this.damageGenerator.generateDamageReport(
          vehicle.id,
          vehicle.driverId,
          vehicle.driverName,
          vehicle.location
        )

        await this.saveDamageReport(report)

        console.log(
          `🔧 Generated ${report.damage_severity} damage report for vehicle ${vehicle.id}: ${report.damage_type}`
        )
        this.emit('damage-report-generated', report)
      }
    } catch (error) {
      console.error('❌ Error generating damage reports:', error)
    }
  }

  /**
   * Generate pre-trip inspections
   */
  private async generatePreTripInspections(): Promise<void> {
    try {
      const count = Math.floor(500 * this.config.simulation.preTripInspectionRate)
      const vehicles = await this.getRandomVehicles(count)

      for (const vehicle of vehicles) {
        const inspection = this.inspectionGenerator.generateInspection(
          vehicle.id,
          vehicle.driverId,
          vehicle.driverName,
          'pre_trip',
          vehicle.location,
          vehicle.odometer
        )

        await this.saveInspection(inspection)

        console.log(
          `✅ Generated pre-trip inspection for vehicle ${vehicle.id}: ${inspection.overall_result}`
        )
        this.emit('inspection-generated', inspection)
      }
    } catch (error) {
      console.error('❌ Error generating inspections:', error)
    }
  }

  /**
   * Generate motion events
   */
  private async generateMotionEvents(): Promise<void> {
    try {
      const vehicles = await this.getRandomVehicles(5)

      for (const vehicle of vehicles) {
        if (vehicle.speed > 10) {
          // Only generate events if vehicle is moving
          const event = this.motionSimulator.generateMotionEvent(
            vehicle.id,
            vehicle.driverId,
            vehicle.speed,
            vehicle.location
          )

          await this.saveMotionEvent(event)

          console.log(
            `📱 Generated motion event for vehicle ${vehicle.id}: ${event.event_type} (${event.severity})`
          )
          this.emit('motion-event-generated', event)
        }
      }
    } catch (error) {
      console.error('❌ Error generating motion events:', error)
    }
  }

  /**
   * Get random vehicles from database
   */
  private async getRandomVehicles(count: number): Promise<VehicleData[]> {
    const result = await this.pool.query(
      `
      SELECT
        v.id::text,
        COALESCE(v.driver_id::text, v.assigned_driver_id::text) as driver_id,
        COALESCE(d.name, CONCAT(d.first_name, ' ', d.last_name), 'Unknown Driver') as driver_name,
        COALESCE(v.latitude, 30.4383) as lat,
        COALESCE(v.longitude, -84.2807) as lng,
        COALESCE(v.odometer, 50000) as odometer,
        COALESCE(v.speed, 0) as speed,
        COALESCE(v.tank_capacity, 25) as tank_capacity,
        COALESCE(v.fuel_type, 'diesel') as fuel_type
      FROM vehicles v
      LEFT JOIN drivers d ON d.id = COALESCE(v.driver_id, v.assigned_driver_id)
      WHERE v.status = 'active'
      ORDER BY RANDOM()
      LIMIT $1
    `,
      [count]
    )

    return result.rows.map(row => ({
      id: row.id,
      driverId: row.driver_id || 'unknown',
      driverName: row.driver_name,
      location: { lat: parseFloat(row.lat), lng: parseFloat(row.lng) },
      odometer: parseInt(row.odometer),
      speed: parseFloat(row.speed),
      tankCapacity: parseFloat(row.tank_capacity),
      fuelType: row.fuel_type
    }))
  }

  /**
   * Save fuel transaction to database
   */
  private async saveFuelTransaction(transaction: FuelTransaction): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO fuel_transactions (
        vehicle_id, driver_id, vendor, transaction_date, fuel_type,
        gallons, cost_per_gallon, total_cost, odometer, location,
        payment_method, transaction_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        transaction.vehicle_id,
        transaction.driver_id,
        transaction.vendor,
        transaction.transaction_date,
        transaction.fuel_type,
        transaction.gallons,
        transaction.cost_per_gallon,
        transaction.total_cost,
        transaction.odometer,
        transaction.location.address,
        transaction.payment_method,
        transaction.transaction_id
      ]
    )
  }

  /**
   * Save damage report to database
   */
  private async saveDamageReport(report: DamageReport): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO damage_reports (
        vehicle_id, report_date, damage_description, damage_type,
        damage_severity, damage_location, estimated_cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        report.vehicle_id,
        report.report_date,
        report.damage_description,
        report.damage_type,
        report.damage_severity,
        report.damage_location,
        report.estimated_cost
      ]
    )
  }

  /**
   * Save inspection to database
   */
  private async saveInspection(inspection: VehicleInspection): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO inspections (
        vehicle_id, driver_id, inspection_type, inspection_date,
        odometer_reading, overall_result, defects_found, critical_defects
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        inspection.vehicle_id,
        inspection.driver_id,
        inspection.inspection_type,
        inspection.inspection_date,
        inspection.odometer_reading,
        inspection.overall_result,
        inspection.defects_found,
        inspection.critical_defects
      ]
    )
  }

  /**
   * Save motion event to database
   */
  private async saveMotionEvent(event: MotionEvent): Promise<void> {
    // Save to driver_behavior_events or create a new motion_events table
    await this.pool.query(
      `
      INSERT INTO driver_behavior_events (
        vehicle_id, driver_id, event_type, event_date,
        latitude, longitude, severity, g_force, speed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
    `,
      [
        event.vehicle_id,
        event.driver_id,
        event.event_type,
        event.timestamp,
        event.location.lat,
        event.location.lng,
        event.severity,
        event.g_force,
        event.speed_mph
      ]
    )
  }
}
