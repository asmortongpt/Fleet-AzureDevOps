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
  mockRoutes,
  paginateResults
} from '../data/mock-data'

export const useMockData = process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'test'

export class MockDatabase {
  async query(sql: string, params?: any[]): Promise<any> {
    // Simple pattern matching to determine which data to return
    const sqlLower = sql.toLowerCase()

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
