/**
 * Example Service with Dependency Injection
 *
 * This service demonstrates proper DI patterns for the Fleet Management System.
 *
 * Key Benefits:
 * - Testability: Dependencies can be easily mocked
 * - Flexibility: Easy to swap implementations
 * - Clear contracts: Dependencies are explicit in constructor
 * - Lifecycle management: Container controls instantiation
 *
 * Usage:
 * ```typescript
 * import { container } from '../container'
 *
 * // Resolve from container
 * const exampleService = container.resolve('exampleService')
 * await exampleService.performAction()
 * ```
 */

import { Pool } from 'pg'

/**
 * Dependencies interface
 * This makes it clear what this service needs
 */
export interface ExampleServiceDependencies {
  db: Pool
  logger: any // Winston logger instance
}

/**
 * Example Service with Constructor Injection
 *
 * This service demonstrates best practices for DI:
 * 1. Accept dependencies through constructor
 * 2. Store dependencies as private readonly properties
 * 3. Define clear dependency interface
 * 4. No global imports of database or services
 */
export class ExampleDIService {
  // Dependencies injected through constructor
  private readonly db: Pool
  private readonly logger: any // Winston logger instance

  /**
   * Constructor with dependency injection
   *
   * @param dependencies - Object containing all required dependencies
   */
  constructor({ db, logger }: ExampleServiceDependencies) {
    this.db = db
    this.logger = logger

    this.logger.info('ExampleDIService initialized')
  }

  /**
   * Example method that uses injected database
   */
  async getVehicleCount(): Promise<number> {
    try {
      const result = await this.db.query('SELECT COUNT(*) as count FROM vehicles')
      const count = parseInt(result.rows[0].count, 10)

      this.logger.info(`Retrieved vehicle count: ${count}`)
      return count
    } catch (error) {
      this.logger.error('Error getting vehicle count:', error)
      throw error
    }
  }

  /**
   * Example method with business logic
   */
  async performAction(vehicleId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Use injected dependencies
      const result = await this.db.query('SELECT 
      id,
      tenant_id,
      vin,
      make,
      model,
      year,
      license_plate,
      vehicle_type,
      fuel_type,
      status,
      odometer,
      engine_hours,
      purchase_date,
      purchase_price,
      current_value,
      gps_device_id,
      last_gps_update,
      latitude,
      longitude,
      location,
      speed,
      heading,
      assigned_driver_id,
      assigned_facility_id,
      telematics_data,
      photos,
      notes,
      created_at,
      updated_at FROM vehicles WHERE id = $1', [vehicleId])

      if (result.rows.length === 0) {
        return {
          success: false,
          message: `Vehicle ${vehicleId} not found`
        }
      }

      this.logger.info(`Action performed on vehicle ${vehicleId}`)

      return {
        success: true,
        message: `Action completed successfully for vehicle ${vehicleId}`
      }
    } catch (error) {
      this.logger.error(`Error performing action on vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  /**
   * Example method that could use another service
   * In a real scenario, you'd inject that service in the constructor
   */
  async performComplexAction(vehicleId: number): Promise<void> {
    // If you need other services, inject them in constructor
    // Don't do: import otherService from './other-service'
    // Do: constructor({ db, logger, otherService }: Dependencies)

    this.logger.info(`Performing complex action on vehicle ${vehicleId}`)
    // ... business logic
  }
}

/**
 * Factory function for creating service with automatic dependency resolution
 * This is what Awilix will use
 */
export function createExampleDIService({ db, logger }: ExampleServiceDependencies): ExampleDIService {
  return new ExampleDIService({ db, logger })
}

// Export the class (not an instance) for DI container registration
export default ExampleDIService
