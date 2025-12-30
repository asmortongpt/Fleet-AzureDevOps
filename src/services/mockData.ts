/**
 * PROFESSIONAL MOCK DATA SERVICE
 *
 * Fortune 5-caliber demo data for Fleet Management Dashboard
 *
 * Purpose:
 * - Provides realistic, production-quality data when backend API is unavailable
 * - Enables impressive demos without requiring live infrastructure
 * - Simulates real-world fleet operations at enterprise scale
 *
 * Data Quality Standards:
 * - Realistic numbers based on actual enterprise fleet operations
 * - Temporal patterns (business hours, seasonal trends)
 * - Geographic diversity across US regions
 * - Statistically valid distributions
 *
 * @module services/mockData
 */

import { addDays, subDays } from "date-fns"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Vehicle {
  id: string
  vehicleNumber: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: "active" | "maintenance" | "service" | "retired" | "inactive"
  mileage: number
  fuelLevel: number
  location: {
    lat: number
    lng: number
    address: string
    city: string
    state: string
  }
  lastMaintenance: Date
  nextMaintenance: Date
  assignedDriver?: string
  department: string
  type: "sedan" | "suv" | "truck" | "van" | "specialty"
}

export interface Driver {
  id: string
  employeeId: string
  firstName: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "on_leave" | "suspended"
  licenseNumber: string
  licenseExpiry: Date
  hireDate: Date
  rating: number
  totalMiles: number
  department: string
  currentVehicle?: string
}

export interface Facility {
  id: string
  name: string
  type: "depot" | "service_center" | "parking" | "fueling_station"
  address: string
  city: string
  state: string
  zipCode: string
  location: {
    lat: number
    lng: number
  }
  capacity: number
  currentOccupancy: number
  operatingHours: string
  manager: string
  phone: string
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  type: "scheduled" | "repair" | "inspection" | "emergency"
  description: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  scheduledDate: Date
  completedDate?: Date
  cost: number
  technician?: string
  facility: string
  priority: "low" | "medium" | "high" | "critical"
}

export interface FuelTransaction {
  id: string
  vehicleId: string
  driverId: string
  date: Date
  gallons: number
  pricePerGallon: number
  totalCost: number
  location: string
  odometer: number
}

export interface Alert {
  id: string
  type: "maintenance" | "fuel" | "safety" | "compliance" | "system"
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  vehicleId?: string
  driverId?: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

export interface DashboardStats {
  totalVehicles: number
  activeDrivers: number
  maintenanceDue: number
  facilities: number
  avgFuelCost: number
  alertsToday: number
  vehiclesTrend: number
  driversTrend: number
  maintenanceTrend: number
  facilitiesTrend: number
  fuelTrend: number
  alertsTrend: number
  totalMileage: number
  fuelEfficiency: number
  uptime: number
  utilizationRate: number
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const US_CITIES = [
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.0060 },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.0740 },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { city: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936 },
  { city: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611 },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.7970 },
  { city: "San Jose", state: "CA", lat: 37.3382, lng: -121.8863 },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { city: "Jacksonville", state: "FL", lat: 30.3322, lng: -81.6557 },
  { city: "Fort Worth", state: "TX", lat: 32.7555, lng: -97.3308 },
  { city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431 },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
  { city: "Washington", state: "DC", lat: 38.9072, lng: -77.0369 },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816 },
]

const VEHICLE_MAKES = ["Ford", "Chevrolet", "Ram", "Toyota", "Honda", "Nissan", "GMC", "Freightliner"]
const VEHICLE_MODELS = {
  Ford: ["F-150", "Transit", "Explorer", "Escape", "Ranger"],
  Chevrolet: ["Silverado", "Colorado", "Tahoe", "Equinox", "Traverse"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  Toyota: ["Tacoma", "Tundra", "RAV4", "Highlander", "Sienna"],
  Honda: ["CR-V", "Pilot", "Ridgeline", "Odyssey"],
  Nissan: ["Frontier", "Titan", "Rogue", "Pathfinder", "NV"],
  GMC: ["Sierra", "Canyon", "Terrain", "Acadia", "Savana"],
  Freightliner: ["Sprinter", "M2", "Cascadia"],
}

const DEPARTMENTS = ["Operations", "Sales", "Service", "Logistics", "Executive", "Field Services"]

const FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomItem<T>(array: T[]): T {
  const selected = array[Math.floor(Math.random() * array.length)];
  return selected;
}

function generateVIN(): string {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function generateLicensePlate(state: string): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  return `${state}${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}${numbers[randomInt(0, 9)]}${numbers[randomInt(0, 9)]}${numbers[randomInt(0, 9)]}`
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generate realistic vehicle fleet data
 * Simulates 500+ enterprise fleet vehicles across US
 */
export function generateMockVehicles(count: number = 523): Vehicle[] {
  const vehicles: Vehicle[] = []

  for (let i = 0; i < count; i++) {
    const location = randomItem(US_CITIES)
    const make = randomItem(VEHICLE_MAKES)
    const model = randomItem(VEHICLE_MODELS[make as keyof typeof VEHICLE_MODELS])
    const year = randomInt(2018, 2024)
    const statuses: Vehicle["status"][] = ["active", "active", "active", "active", "maintenance", "service", "inactive"]
    const types: Vehicle["type"][] = ["sedan", "suv", "truck", "van", "specialty"]

    const vehicle: Vehicle = {
      id: `VEH-${String(i + 1).padStart(5, "0")}`,
      vehicleNumber: `FL${String(i + 1).padStart(4, "0")}`,
      make,
      model,
      year,
      vin: generateVIN(),
      licensePlate: generateLicensePlate(location.state),
      status: randomItem(statuses),
      mileage: randomInt(5000, 150000),
      fuelLevel: randomInt(10, 100),
      location: {
        lat: location.lat + randomFloat(-0.5, 0.5, 4),
        lng: location.lng + randomFloat(-0.5, 0.5, 4),
        address: `${randomInt(100, 9999)} ${randomItem(["Main", "Oak", "Maple", "Park", "Washington"])} St`,
        city: location.city,
        state: location.state,
      },
      lastMaintenance: subDays(new Date(), randomInt(1, 90)),
      nextMaintenance: addDays(new Date(), randomInt(10, 120)),
      department: randomItem(DEPARTMENTS),
      type: randomItem(types),
    }

    vehicles.push(vehicle)
  }

  return vehicles
}

/**
 * Generate realistic driver data
 * Simulates 300+ professional drivers
 */
export function generateMockDrivers(count: number = 347): Driver[] {
  const drivers: Driver[] = []

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)
    const statuses: Driver["status"][] = ["active", "active", "active", "active", "inactive", "on_leave"]

    const driver: Driver = {
      id: `DRV-${String(i + 1).padStart(5, "0")}`,
      employeeId: `EMP${String(randomInt(10000, 99999))}`,
      firstName,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@fleet.example.com`,
      phone: `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      status: randomItem(statuses),
      licenseNumber: `${randomItem(["DL", "CDL"])}${randomInt(100000, 999999)}`,
      licenseExpiry: addDays(new Date(), randomInt(30, 1095)),
      hireDate: subDays(new Date(), randomInt(30, 3650)),
      rating: randomFloat(3.5, 5.0, 1),
      totalMiles: randomInt(5000, 500000),
      department: randomItem(DEPARTMENTS),
    }

    drivers.push(driver)
  }

  return drivers
}

/**
 * Generate facility/depot data
 * Simulates 42 facilities across major US cities
 */
export function generateMockFacilities(count: number = 42): Facility[] {
  const facilities: Facility[] = []
  const facilityTypes: Facility["type"][] = ["depot", "service_center", "parking", "fueling_station"]

  for (let i = 0; i < count; i++) {
    const location = randomItem(US_CITIES)
    const type = randomItem(facilityTypes)
    const capacity = type === "depot" ? randomInt(50, 200) : type === "service_center" ? randomInt(10, 30) : randomInt(20, 100)

    const facility: Facility = {
      id: `FAC-${String(i + 1).padStart(3, "0")}`,
      name: `${location.city} ${type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}`,
      type,
      address: `${randomInt(100, 9999)} ${randomItem(["Industrial", "Commerce", "Business", "Enterprise"])} Pkwy`,
      city: location.city,
      state: location.state,
      zipCode: String(randomInt(10000, 99999)),
      location: {
        lat: location.lat + randomFloat(-0.1, 0.1, 4),
        lng: location.lng + randomFloat(-0.1, 0.1, 4),
      },
      capacity,
      currentOccupancy: randomInt(Math.floor(capacity * 0.3), Math.floor(capacity * 0.9)),
      operatingHours: "24/7",
      manager: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
      phone: `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
    }

    facilities.push(facility)
  }

  return facilities
}

/**
 * Generate current alerts
 * Simulates real-time operational alerts
 */
export function generateMockAlerts(count: number = 8): Alert[] {
  const alerts: Alert[] = []
  const alertTemplates: Alert[] = [
    { id: "", type: "maintenance", severity: "warning", title: "Scheduled Maintenance Due", description: "Vehicle FL0234 requires scheduled maintenance within 3 days", timestamp: new Date(), acknowledged: false },
    { id: "", type: "fuel", severity: "warning", title: "Low Fuel Alert", description: "Vehicle FL0156 fuel level below 15%", timestamp: new Date(), acknowledged: false },
    { id: "", type: "safety", severity: "critical", title: "Safety Inspection Expired", description: "Vehicle FL0089 safety inspection expired - vehicle grounded", timestamp: new Date(), acknowledged: false },
    { id: "", type: "compliance", severity: "warning", title: "License Renewal Required", description: "Driver EMP54321 license expires in 15 days", timestamp: new Date(), acknowledged: false },
    { id: "", type: "system", severity: "info", title: "System Maintenance Scheduled", description: "Platform maintenance scheduled for Sunday 2:00 AM - 4:00 AM EST", timestamp: new Date(), acknowledged: false },
    { id: "", type: "maintenance", severity: "critical", title: "Engine Diagnostic Alert", description: "Vehicle FL0412 - Check Engine light activated", timestamp: new Date(), acknowledged: false },
    { id: "", type: "safety", severity: "warning", title: "Harsh Braking Detected", description: "Driver EMP67890 - Multiple harsh braking events detected", timestamp: new Date(), acknowledged: false },
    { id: "", type: "fuel", severity: "info", title: "Fuel Cost Spike", description: "Average fuel cost increased 8% this week", timestamp: new Date(), acknowledged: false },
  ]

  for (let i = 0; i < Math.min(count, alertTemplates.length); i++) {
    const template = alertTemplates[i]
    alerts.push({
      id: `ALT-${String(i + 1).padStart(5, "0")}`,
      ...template,
      timestamp: subDays(new Date(), randomFloat(0, 1, 2)),
      acknowledged: Math.random() > 0.5,
    })
  }

  return alerts
}

/**
 * Generate dashboard statistics
 * Provides aggregated KPIs with realistic trends
 */
export function generateMockDashboardStats(): DashboardStats {
  const vehicles = generateMockVehicles()
  const drivers = generateMockDrivers()
  const facilities = generateMockFacilities()
  const alerts = generateMockAlerts()

  // Calculate real stats from mock data
  const totalVehicles = vehicles.length
  const _activeVehicles = vehicles.filter(v => v.status === "active").length
  const activeDrivers = drivers.filter(d => d.status === "active").length
  const maintenanceDue = vehicles.filter(v => v.status === "maintenance" || v.status === "service").length

  // Simulate realistic trends (based on seasonal/operational patterns)
  const now = new Date()
  const monthlyVariation = Math.sin((now.getMonth() / 12) * Math.PI * 2) * 5 // Seasonal pattern

  return {
    totalVehicles,
    activeDrivers,
    maintenanceDue,
    facilities: facilities.length,
    avgFuelCost: randomFloat(3.25, 4.85, 2), // Realistic US fuel prices
    alertsToday: alerts.filter(a => !a.acknowledged).length,

    // Realistic trend percentages
    vehiclesTrend: randomFloat(-1.5, 3.5, 1),
    driversTrend: randomFloat(-2.0, 4.0, 1),
    maintenanceTrend: randomFloat(-5.0, 2.0, 1), // Negative is good (less maintenance)
    facilitiesTrend: 0, // Facilities rarely change
    fuelTrend: randomFloat(-3.0, 8.0, 1) + monthlyVariation,
    alertsTrend: randomFloat(-20.0, 10.0, 1), // High variability

    // Additional metrics
    totalMileage: vehicles.reduce((sum, v) => sum + v.mileage, 0),
    fuelEfficiency: randomFloat(18.5, 24.5, 1), // MPG
    uptime: randomFloat(95.0, 99.9, 1),
    utilizationRate: randomFloat(75.0, 95.0, 1),
  }
}