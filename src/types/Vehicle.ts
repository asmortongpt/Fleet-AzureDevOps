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

  // Timestamps
  createdAt?: string
  updatedAt?: string
}
