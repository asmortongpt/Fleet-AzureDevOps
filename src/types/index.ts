export interface User {
  id: string
  email: string
  name: string
}

// Re-export canonical Vehicle type to ensure single source of truth
export type { Vehicle } from './Vehicle';

export interface Driver {
  status?: "active" | "inactive" | "on-leave";
  id: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  licenseNumber: string
  avatar_url?: string
  assignedVehicle?: string
  tenantId?: string
  // Backwards compatibility: snake_case properties
  first_name?: string
  last_name?: string
  license_number?: string
}

export interface WorkOrder {
  id: string
  title: string
  status: string
  description?: string
  dueDate?: string
  priority?: string
  assignedTo?: string
  vehicleId?: string
  type?: string
}

export interface Asset {
  id: string
  name: string
  type: string
  status: string
  location?: {
    lat: number
    lng: number
  }
  // Backwards compatibility: allow direct lat/lng access
  latitude?: number
  longitude?: number
  lastSeen?: string
}

export interface Geofence {
  id: string
  name: string
  description?: string
  type: 'circle' | 'polygon' | 'rectangle'
  center?: { lat: number; lng: number }
  // Backwards compatibility: allow direct lat/lng access
  latitude?: number
  longitude?: number
  radius?: number // meters for circle
  coordinates?: Array<{ lat: number; lng: number }> // for polygon/rectangle
  color?: string
  active?: boolean
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  type: 'preventive' | 'corrective' | 'inspection' | 'repair'
  date: string
  cost: number
  description?: string
  status?: string
}

export interface FuelTransaction {
  id: string
  vehicleId: string
  date: string
  quantity: number
  cost: number
  pricePerUnit: number
  location?: string
  fuelType?: string
}

export interface DataPoint {
  name: string
  value: number
  timestamp?: string
  unit?: string
  category?: string
  metadata?: Record<string, any>
}

// Vehicle metrics from analytics
export interface VehicleMetrics {
  totalVehicles: number
  activeVehicles: number
  maintenanceVehicles?: number
  idleVehicles?: number
  averageFuelLevel?: number
  totalMileage?: number
  maintenanceDue?: number
  utilizationRate?: number
  avgFuelEfficiency?: number
  performanceTrend?: any[]
}

// Driver metrics
export interface DriverMetrics {
  totalDrivers?: number
  activeDrivers?: number
  onLeave?: number
  complianceRate?: number
  safetyScore?: number
  hoursWorked?: number
  performanceTrend?: any[]
}

// Operations metrics
export interface OperationsMetrics {
  totalRoutes?: number
  activeRoutes?: number
  completedRoutes?: number
  pendingTasks?: number
  completedTasks?: number
  fuelCostToday?: number
  routeEfficiency?: number
  averageDeliveryTime?: number
}

// Route details
export interface Route {
  id: string
  status: 'delayed' | 'scheduled' | 'completed' | 'cancelled' | 'in_transit'
  driverId: string
  vehicleId: string
  distance: number
  startTime: string
  origin?: string
  destination?: string
  name?: string
  startLocation?: string
  endLocation?: string
  estimatedArrival?: string
  actualArrival?: string
  stops?: number
  createdAt?: string
  updatedAt?: string
}

// Fuel transaction details
export interface FuelTransactionDetail {
  id: string
  createdAt: string
  cost: number
  vehicleId: string
  amount: number
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg'
  odometer?: number
  gallons?: number
  pricePerGallon?: number
  totalCost?: number
  location?: string
  receiptNumber?: string
  driverId?: string
}
