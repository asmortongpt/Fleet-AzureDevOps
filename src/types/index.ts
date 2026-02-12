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

  // Personal details
  middle_name?: string
  suffix?: string
  preferred_name?: string
  profile_photo_url?: string
  gender?: string
  date_of_birth?: string

  // Address
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string

  // Employment
  department?: string
  position_title?: string
  region?: string
  employment_type?: string
  supervisor_id?: string
  cost_center?: string
  pay_rate?: number
  pay_type?: string
  facility_id?: string
  hire_date?: string
  employee_number?: string
  employeeId?: string

  // License & compliance
  license_class?: string
  cdl?: string
  cdl_class?: string
  endorsements?: string[]
  restrictions?: string[]
  medical_card_number?: string
  medical_card_expiry?: string
  medical_card_status?: string
  twic_card_number?: string
  twic_card_expiry?: string
  hazmat_endorsement?: boolean
  tanker_endorsement?: boolean
  doubles_triples?: boolean
  passenger_endorsement?: boolean
  licenseExpiry?: string

  // Safety & testing
  safety_score?: number
  drug_test_date?: string
  drug_test_result?: string
  alcohol_test_date?: string
  alcohol_test_result?: string
  background_check_date?: string
  background_check_status?: string
  mvr_check_date?: string
  mvr_check_status?: string
  total_incidents?: number
  total_violations?: number
  performance_score?: number

  // Assignment
  assigned_vehicle_id?: string
  home_terminal?: string
  dispatch_zone?: string

  // Hours of Service
  hos_status?: string
  hours_available?: number
  cycle_hours_used?: number
  last_rest_start?: string

  // Emergency contact
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship?: string
  }

  // Metrics
  rating?: number
  totalTrips?: number
  totalMiles?: number

  // Timestamps
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface WorkOrder {
  id: string
  title: string
  status: string
  description?: string
  dueDate?: string
  due_date?: string
  priority?: string
  assignedTo?: string
  vehicleId?: string
  vehicle_id?: string
  type?: string
  number?: string
  notes?: string

  // Facility & classification
  facility_id?: string
  category?: string
  subcategory?: string

  // Root cause & resolution
  root_cause?: string
  resolution_notes?: string

  // Vendor & external reference
  vendor_id?: string
  external_reference?: string

  // Cost breakdown
  downtime_hours?: number
  parts_cost?: number
  labor_cost?: number
  total_cost?: number
  tax_amount?: number
  estimated_cost?: number
  actual_cost?: number

  // Scheduling
  completed_at?: string
  scheduled_start_date?: string
  scheduled_end_date?: string
  actual_start_date?: string
  actual_end_date?: string

  // Assignment & tracking
  driver_id?: string
  bay_number?: string
  labor_hours?: number
  odometer_at_start?: number
  odometer_at_end?: number

  // Flags
  is_emergency?: boolean
  customer_complaint?: string
  technician_notes?: string
  quality_check_passed?: boolean

  // Recurrence
  recurring?: boolean
  recurrence_pattern?: Record<string, any>

  // Timestamps
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
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
  vehicle_id?: string
  date: string
  quantity: number
  cost: number
  pricePerUnit: number
  location?: string
  fuelType?: string

  // Aliases for quantity/pricePerUnit (DB column names)
  gallons?: number
  cost_per_gallon?: number
  price_per_gallon?: number

  // Efficiency & fill details
  mpg_calculated?: number
  is_full_fill?: boolean
  miles_since_last_fill?: number
  tank_level_before?: number
  tank_level_after?: number

  // Station details
  station_name?: string
  station_brand?: string

  // Driver & receipt
  driver_id?: string
  receipt_number?: string
  receipt_url?: string

  // Payment
  payment_method?: string
  card_last4?: string
  fleet_card_number?: string

  // Tax
  state_tax?: number
  federal_tax?: number
  discount_amount?: number

  // Flagging & reconciliation
  is_flagged?: boolean
  flag_reason?: string
  is_reconciled?: boolean

  // IFTA
  ifta_jurisdiction?: string
  pump_number?: string

  // Odometer
  odometer_reading?: number

  // Notes
  notes?: string

  // Timestamps
  createdAt?: string
  created_at?: string
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
