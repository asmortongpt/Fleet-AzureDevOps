export interface MaintenanceRecord {
  id: string
  vehicleNumber: string
  vehicleName: string
  serviceType: string
  date: string
  cost: number
  status: "upcoming" | "overdue" | "completed"
  nextDue: string | null
  notes?: string
}

export interface FuelRecord {
  id: string
  vehicleNumber: string
  vehicleName: string
  date: string
  gallons: number
  cost: number
  odometer: number
  mpg: number
  location?: string
}

export interface MaintenanceMetrics {
  totalCost: number
  overdue: number
  upcoming: number
}

export interface FuelMetrics {
  totalSpent: number
  totalGallons: number
  averageMPG: number
  costPerMile: number
}

export type SortField = string
export type SortDirection = "asc" | "desc"

export type MaintenanceFilter = "all" | "upcoming" | "overdue" | "completed"
