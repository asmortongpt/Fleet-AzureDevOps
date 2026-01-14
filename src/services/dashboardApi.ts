/**
 * Dashboard API Service
 * Provides type-safe API calls for role-based dashboards
 *
 * SECURITY: Uses httpOnly cookies for authentication
 * All requests include credentials: 'include' for CSRF protection
 *
 * Backend routes: api/src/routes/dashboard.routes.ts
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

// ============================================================================
// Type Definitions (matching backend responses)
// ============================================================================

export interface MaintenanceAlert {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  type: string;
  days_overdue?: number;
  scheduled_date?: string;
}

export interface MaintenanceAlerts {
  overdue_count: number;
  upcoming_count: number;
  open_work_orders: number;
  overdue: MaintenanceAlert[];
  upcoming: MaintenanceAlert[];
}

export interface FleetStats {
  active_vehicles: number;
  maintenance_vehicles: number;
  idle_vehicles: number;
  out_of_service: number;
}

export interface CostSummary {
  fuel_cost: number;
  fuel_trend: number;
  maintenance_cost: number;
  maintenance_trend: number;
  cost_per_mile: number;
  target_cost_per_mile: number;
}

export interface DriverVehicle {
  id: number;
  name: string;
  year: number;
  make: string;
  model: string;
  fuel_level: number;
  mileage: number;
  status: string;
  last_inspection: string;
}

export interface DriverTrip {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
}

export interface DriverTripsResponse {
  trips?: DriverTrip[];
}

// ============================================================================
// Generic Fetch Helper with Authentication
// ============================================================================

async function fetchWithAuth<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'GET',
    credentials: 'include', // Send httpOnly cookies for JWT authentication
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Try to parse error message from response
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.message || error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Dashboard API Methods
// ============================================================================

export const dashboardApi = {
  /**
   * Fleet Manager Endpoints
   */

  /**
   * Get maintenance alerts (overdue and upcoming)
   * @returns MaintenanceAlerts object with counts and alert lists
   */
  getMaintenanceAlerts: () =>
    fetchWithAuth<MaintenanceAlerts>('/dashboard/maintenance/alerts'),

  /**
   * Get fleet status statistics
   * @returns FleetStats object with vehicle counts by status
   */
  getFleetStats: () =>
    fetchWithAuth<FleetStats>('/dashboard/fleet/stats'),

  /**
   * Get cost summary for specified period
   * @param period - 'daily' | 'weekly' | 'monthly' (default: 'monthly')
   * @returns CostSummary object with costs, trends, and cost per mile
   */
  getCostSummary: (period: 'daily' | 'weekly' | 'monthly' = 'monthly') =>
    fetchWithAuth<CostSummary>(`/dashboard/costs/summary?period=${period}`),

  /**
   * Driver Endpoints
   */

  /**
   * Get driver's assigned vehicle
   * @returns DriverVehicle object with vehicle details
   */
  getDriverVehicle: () =>
    fetchWithAuth<DriverVehicle>('/dashboard/drivers/me/vehicle'),

  /**
   * Get driver's trips for today (or specified date)
   * @param date - ISO date string (YYYY-MM-DD), defaults to today
   * @returns Array of driver trips
   */
  getDriverTrips: (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    // Note: Backend uses /drivers/me/trips/today endpoint (returns array directly)
    // We'll normalize it to return DriverTripsResponse for consistency
    return fetchWithAuth<DriverTrip[]>('/dashboard/drivers/me/trips/today');
  },
};

/**
 * Query Keys for React Query
 * Used to identify and invalidate cached queries
 */
export const dashboardQueryKeys = {
  maintenanceAlerts: ['maintenance-alerts'] as const,
  fleetStats: ['fleet-stats'] as const,
  costSummary: (period: string) => ['cost-summary', period] as const,
  driverVehicle: ['driver-vehicle'] as const,
  driverTrips: (date: string) => ['driver-trips', date] as const,
};
