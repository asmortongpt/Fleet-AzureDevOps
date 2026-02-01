export interface User {
  id: string
  email: string
  name: string
}

export interface Vehicle {
  id: string
  tenantId: string
  number: string
  name?: string // Computed display name (e.g., "Vehicle #123" or "2024 Ford F-150")
  type: "sedan" | "suv" | "truck" | "van" | "emergency" | "specialty" | "tractor" | "forklift" | "trailer" | "construction" | "bus" | "motorcycle"
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: "active" | "idle" | "charging" | "service" | "emergency" | "offline"
  location: {
    lat: number
    lng: number
    latitude?: number // Backwards compatibility alias
    longitude?: number // Backwards compatibility alias
    address: string
  }
  region: string
  department: string
  fuelLevel: number
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid" | "cng" | "propane"
  mileage: number
  hoursUsed?: number // For equipment tracking
  assignedDriver?: string
  driver?: string // Alias for assignedDriver for backwards compatibility
  ownership: "owned" | "leased" | "rented"
  lastService: string
  nextService: string
  alerts: string[]
  customFields?: Record<string, any>
  tags?: string[]

  // Asset Classification
  asset_category?: 'PASSENGER_VEHICLE' | 'LIGHT_COMMERCIAL' | 'HEAVY_TRUCK' | 'TRACTOR' | 'TRAILER' | 'HEAVY_EQUIPMENT' | 'UTILITY_VEHICLE' | 'SPECIALTY_EQUIPMENT' | 'NON_POWERED'
  asset_type?: string
  power_type?: 'SELF_POWERED' | 'TOWED' | 'STATIONARY' | 'PORTABLE'

  // Multi-Metric Tracking
  primary_metric?: 'ODOMETER' | 'ENGINE_HOURS' | 'PTO_HOURS' | 'AUX_HOURS' | 'CYCLES' | 'CALENDAR'
  odometer?: number
  engine_hours?: number
  pto_hours?: number
  aux_hours?: number
  cycle_count?: number
  last_metric_update?: string

  // Equipment Specifications (for HEAVY_EQUIPMENT)
  capacity_tons?: number
  max_reach_feet?: number
  lift_height_feet?: number
  bucket_capacity_yards?: number
  operating_weight_lbs?: number

  // Trailer Specifications (for TRAILER)
  axle_count?: number
  max_payload_kg?: number
  tank_capacity_l?: number

  // Equipment Capabilities
  has_pto?: boolean
  has_aux_power?: boolean
  is_road_legal?: boolean
  requires_cdl?: boolean
  requires_special_license?: boolean
  max_speed_kph?: number
  is_off_road_only?: boolean

  // Operational Status
  operational_status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED'

  // Asset Organization
  parent_asset_id?: string
  group_id?: string
  fleet_id?: string
  location_id?: string

  // Financial
  purchasePrice?: number | string
  currentValue?: number | string
  acquisitionDate?: string

  // Metadata
  metadata?: {
    image_url?: string
    [key: string]: any
  }

  // Timestamps
  createdAt?: string
  updatedAt?: string

  // Additional Properties from Database Schema (snake_case compatibility)
  assigned_driver?: string
  assigned_driver_id?: string | number
  driver_id?: number
  driver_name?: string
  driverId?: string

  // Battery & Electric Vehicle Properties
  batteryLevel?: number
  battery_level?: number
  current_soc?: number
  charging_status?: string
  range_miles?: number
  carbon_saved_kg?: number

  // Maintenance Properties
  lastMaintenance?: string | Date
  nextMaintenanceDate?: string | Date
  lastServiceDate?: string | Date
  lastInspectionDate?: string | Date
  nextInspectionDate?: string | Date
  next_service_date?: string | Date
  nextServiceMiles?: number
  nextMaintenanceMiles?: number
  lastUpdated?: string | Date
  last_updated?: string | Date
  lastSeen?: string | Date
  pmStatus?: string
  pmOverdue?: boolean
  maintenanceHistory?: any[]
  maintenanceAlerts?: any[]
  serviceSchedule?: any
  safetyEquipmentStatus?: string
  safetyInspectionExpired?: boolean
  annualInspection?: any
  defectReports?: any[]

  // Cost & Financial Tracking
  cost?: string | number
  price?: number | string
  last12MonthsMaintenanceCost?: number
  estimatedCost?: number

  // Additional Database Fields
  tenant_id?: number
  license_plate?: string
  fuel_level?: number
  created_at?: Date | string
  updated_at?: Date | string

  // Vehicle Identification & Display
  vehicle_id?: string | number
  vehicle_name?: string
  vehicle_number?: string
  vehicle_status?: string
  vehicleId?: string
  vehicleName?: string
  vehicleNumber?: string
  plate?: string
  plate_number?: string
  plateNumber?: string
  manufacturer?: string
  trim?: string
  color?: string
  exteriorColor?: string
  interiorColor?: string

  // Location & Tracking
  latitude?: number
  longitude?: number
  coordinates?: { lat: number; lng: number }
  current_location?: string
  lastKnownLocation?: string
  parkingLocation?: string
  position?: any
  speed?: number
  isMoving?: boolean

  // Metrics & Performance
  odometer_reading?: number
  odometerMiles?: number
  currentMileage?: number
  annualMiles?: number
  milesSincePM?: number
  mileageSinceLastPM?: number
  daysSincePM?: number
  daysOverdue?: number
  daysUntilFailure?: number
  daysUnused?: number
  uptime?: number
  health_score?: number
  health?: string | number
  efficiency_kwh_per_mile?: number
  fuel_efficiency?: number

  // Fuel & Capacity
  fuel?: number
  fuel_capacity?: number
  tankCapacity?: number
  capacity?: number
  gvwr?: number
  seatingCapacity?: number

  // Assignment & Personnel
  assigned_to?: string
  assignedDate?: string | Date
  assignedDepartment?: string
  assignmentType?: string
  fleetManager?: string
  maintenanceSupervisor?: string
  requiresCDL?: boolean

  // Safety & Compliance
  activeRecalls?: any[]
  breakdownsLast12Months?: number
  predictedIssue?: string
  severity?: string
  rating?: number

  // Image & Media
  image?: string
  imageUrl?: string
  primaryImage?: string
  realImage?: string
  imageSource?: string
  imageConfidence?: number
  isLoadingImages?: boolean

  // Scheduling & Availability
  availability?: string
  schedule?: any
  entry_count?: number
  last_entry?: string | Date
  total_time_in_zone?: number

  // Features & Specifications
  features?: string[]
  specifications?: Record<string, any>
  documents?: any[]

  // UI/Display Properties
  isFavorite?: boolean
  views?: number
  alertType?: string
  confidence?: number
  source?: string
  rotation?: number

  // Lifecycle
  expectedLifeMiles?: number
  expectedLifeYears?: number
  evaluation?: any
}

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