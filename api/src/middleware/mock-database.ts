/**
 * Mock Database Middleware
 * Intercepts database queries and returns mock data when no database is available
 */

import {
  mockVehicles,
  mockDrivers,
  mockWorkOrders,
  mockFuelTransactions,
  mockFacilities,
  mockMaintenanceSchedules,
  mockRoutes
} from '../data/mock-data'

export const useMockData = process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'test'

export class MockDatabase {
  async query(sql: string, params?: any[]): Promise<any> {
    // Simple pattern matching to determine which data to return
    const sqlLower = sql.toLowerCase()

    if (sqlLower.includes('from users') && (sqlLower.includes('where email =') || sqlLower.includes('email = $1'))) {
      const email = params && params[0] ? params[0] : ''

      if (email === 'admin@fleet.local') {
        return {
          rows: [{
            id: '1',
            tenant_id: 1,
            email: 'admin@fleet.local',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            is_active: true,
            phone: '555-555-5555',
            password_hash: 'MOCK_HASH',
            failed_login_attempts: 0,
            account_locked_until: null,
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        }
      } else {
        return { rows: [], rowCount: 0 }
      }
    }

    // Mock refreshing token
    if (sqlLower.includes('from refresh_tokens')) {
      return {
        rows: [{
          user_id: '1',
          tenant_id: 1,
          token_hash: 'mock-hash',
          revoked_at: null,
          expires_at: new Date(Date.now() + 86400000)
        }],
        rowCount: 1
      }
    }

    if (sqlLower.includes('from users') && sqlLower.includes('where id =')) {
      return {
        rows: [{
          id: '1',
          tenant_id: 1,
          email: 'admin@fleet.local',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          is_active: true,
          phone: '555-555-5555',
          created_at: new Date(),
          updated_at: new Date()
        }],
        rowCount: 1
      }
    }

    if (sqlLower.includes('update ')) {
      return { rows: [], rowCount: 1 }
    }

    if (sqlLower.includes('insert into vehicles')) {
      const newVehicle = {
        id: 'mock-' + Date.now(),
        vin: params ? params[0] : 'UNKNOWN',
        license_plate: params ? params[1] : 'UNKNOWN',
        make: params ? params[2] : 'UNKNOWN',
        model: params ? params[3] : 'UNKNOWN',
        year: params ? params[4] : 2024, // Assuming year is 5th param based on repo
        status: params ? params[5] : 'active',
        mileage: params ? params[6] : 0,
        fuel_type: params ? params[7] : 'gasoline',
        department: params ? params[8] : null,
        tenant_id: params ? params[9] : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location: { lat: 30.4383, lng: -84.2807 },
        last_service_date: null,
        next_service_date: null,
        assigned_driver_id: null,
        purchase_date: new Date().toISOString(),
        purchase_price: 0
      }
      // Add to beginning of mock data so it appears first in list
      mockVehicles.unshift(newVehicle as any)
      return { rows: [newVehicle], rowCount: 1 }
    }

    if (sqlLower.includes('insert ')) {
      return { rows: [], rowCount: 1 }
    }

    if (sqlLower.includes('from vehicles') || sqlLower.includes('from "vehicles"')) {
      return { rows: mockVehicles, rowCount: mockVehicles.length }
    }

    if (sqlLower.includes('from drivers') || sqlLower.includes('from users where role')) {
      return { rows: mockDrivers, rowCount: mockDrivers.length }
    }

    if (sqlLower.includes('from work_orders')) {
      return { rows: mockWorkOrders, rowCount: mockWorkOrders.length }
    }

    if (sqlLower.includes('from fuel_transactions')) {
      return { rows: mockFuelTransactions, rowCount: mockFuelTransactions.length }
    }

    if (sqlLower.includes('from facilities')) {
      return { rows: mockFacilities, rowCount: mockFacilities.length }
    }

    if (sqlLower.includes('from maintenance_schedules')) {
      return { rows: mockMaintenanceSchedules, rowCount: mockMaintenanceSchedules.length }
    }

    if (sqlLower.includes('from routes')) {
      return { rows: mockRoutes, rowCount: mockRoutes.length }
    }

    // Default empty response
    return { rows: [], rowCount: 0 }
  }
}

export const mockPool = new MockDatabase()
