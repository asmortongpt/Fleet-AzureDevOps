/**
 * Demo Data Provider
 * Provides realistic mock data for demo walkthrough mode
 */

import { Vehicle, Driver, WorkOrder, FuelTransaction, Route } from "./types"
import type { GISFacility } from "./types"

// Tallahassee, FL area coordinates
const tallahasseeFacilities = [
  { name: "HQ Depot", lat: 30.4383, lng: -84.2807, city: "Tallahassee" },
  { name: "North Service Center", lat: 30.4550, lng: -84.2500, city: "Tallahassee" },
  { name: "South Warehouse", lat: 30.4200, lng: -84.3100, city: "Tallahassee" }
]

// Tallahassee, FL - all vehicles in Tallahassee area
const usCities = [
  { name: "Tallahassee", lat: 30.4383, lng: -84.2807 },
  { name: "Tallahassee North", lat: 30.4550, lng: -84.2500 },
  { name: "Tallahassee East", lat: 30.4400, lng: -84.2600 },
  { name: "Tallahassee West", lat: 30.4300, lng: -84.3000 },
  { name: "Tallahassee South", lat: 30.4200, lng: -84.2900 }
]

const vehicleTypes: Vehicle["type"][] = ["sedan", "suv", "truck", "van"]
const statuses: Vehicle["status"][] = ["active", "idle", "charging", "service", "emergency", "offline"]

export function generateDemoVehicles(count: number = 50): Vehicle[] {
  const vehicles: Vehicle[] = []
  const makes = [
    { make: "Honda", models: ["Accord", "Civic", "CR-V"] },
    { make: "Toyota", models: ["Camry", "Corolla", "RAV4", "Highlander"] },
    { make: "Ford", models: ["F-150", "Explorer", "Transit", "Escape"] },
    { make: "Chevrolet", models: ["Silverado", "Tahoe", "Malibu", "Equinox"] },
    { make: "Tesla", models: ["Model 3", "Model Y"] },
    { make: "Nissan", models: ["Altima", "Rogue", "Leaf"] },
    { make: "Ram", models: ["1500", "2500"] },
    { make: "Mercedes", models: ["Sprinter"] },
    { make: "Dodge", models: ["ProMaster"] }
  ]

  for (let i = 0; i < count; i++) {
    const city = usCities[Math.floor(i / 10) % usCities.length] // Distribute across cities
    const type = vehicleTypes[i % vehicleTypes.length]

    // More vehicles should be active for realistic demo
    const statusWeights = [0.4, 0.3, 0.1, 0.1, 0.05, 0.05] // active, idle, charging, service, emergency, offline
    const rand = Math.random()
    let status: Vehicle["status"] = "active"
    let cumulative = 0
    for (let j = 0; j < statusWeights.length; j++) {
      cumulative += statusWeights[j]
      if (rand < cumulative) {
        status = statuses[j]
        break
      }
    }

    // Select appropriate make/model for vehicle type
    const makeData = makes[Math.floor(Math.random() * makes.length)]
    const model = makeData.models[Math.floor(Math.random() * makeData.models.length)]

    const cityCode = city.name.substring(0, 3).toUpperCase()
    const number = `${cityCode}-${1001 + i}`

    vehicles.push({
      id: `veh-demo-${1000 + i}`,
      name: `${makeData.make} ${model}`,
      number,
      type,
      make: makeData.make,
      model,
      year: 2020 + (i % 5),
      vin: `1HGBH${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000)}`,
      status,
      location: {
        lat: city.lat + (Math.random() - 0.5) * 0.1, // Spread vehicles around city
        lng: city.lng + (Math.random() - 0.5) * 0.1,
        address: `${Math.floor(Math.random() * 9000 + 1000)} ${["Main", "Oak", "Broadway", "Park", "5th"][Math.floor(Math.random() * 5)]} St, ${city.name}`
      },
      fuelLevel: status === "active" ? Math.floor(Math.random() * 40 + 40) : Math.floor(Math.random() * 100),
      fuelType: model.includes("Tesla") || model.includes("Leaf") ? "electric" : (type === "truck" ? "diesel" : "gasoline"),
      mileage: Math.floor(Math.random() * 50000 + 10000),
      driver: status === "active" ? `Driver ${Math.floor(i / 3) + 1}` : undefined,
      odometer: Math.floor(Math.random() * 50000 + 10000),
      lastService: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextService: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tenantId: "demo-tenant-001"
    })
  }

  return vehicles
}

export function generateDemoFacilities(): GISFacility[] {
  return [
    {
      id: "fac-demo-1",
      name: "HQ Depot - New York",
      type: "depot",
      location: {
        lat: 40.7128,
        lng: -74.0060,
        address: "123 Fleet Street, New York, NY 10001"
      },
      address: "123 Fleet Street, New York, NY 10001",
      capacity: 15,
      currentOccupancy: 8,
      status: "operational",
      serviceBays: 8,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-2",
      name: "West Coast Hub - Los Angeles",
      type: "depot",
      location: {
        lat: 34.0522,
        lng: -118.2437,
        address: "456 Harbor Blvd, Los Angeles, CA 90011"
      },
      address: "456 Harbor Blvd, Los Angeles, CA 90011",
      capacity: 10,
      currentOccupancy: 6,
      status: "operational",
      serviceBays: 6,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-3",
      name: "Central Operations - Chicago",
      type: "depot",
      location: {
        lat: 41.8781,
        lng: -87.6298,
        address: "789 Logistics Ave, Chicago, IL 60601"
      },
      address: "789 Logistics Ave, Chicago, IL 60601",
      capacity: 10,
      currentOccupancy: 5,
      status: "operational",
      serviceBays: 5,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-4",
      name: "East Service Center - Atlanta",
      type: "service-center",
      location: {
        lat: 33.7490,
        lng: -84.3880,
        address: "321 Peachtree St, Atlanta, GA 30303"
      },
      address: "321 Peachtree St, Atlanta, GA 30303",
      capacity: 8,
      currentOccupancy: 4,
      status: "operational",
      serviceBays: 4,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-5",
      name: "Northwest Facility - Seattle",
      type: "depot",
      location: {
        lat: 47.6062,
        lng: -122.3321,
        address: "654 Pacific Way, Seattle, WA 98101"
      },
      address: "654 Pacific Way, Seattle, WA 98101",
      capacity: 7,
      currentOccupancy: 5,
      status: "operational",
      serviceBays: 5,
      tenantId: "demo-tenant-001"
    }
  ]
}

export function generateDemoDrivers(count: number = 30): Driver[] {
  const drivers: Driver[] = []
  const firstNames = ["James", "Maria", "David", "Jennifer", "Michael", "Sarah", "Robert", "Emily", "John", "Lisa"]
  const lastNames = ["Thompson", "Rodriguez", "Anderson", "Taylor", "Chen", "Williams", "Martinez", "Brown", "Garcia", "Wilson"]

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]

    drivers.push({
      id: `drv-demo-${2000 + i}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}${i > 9 ? i - 9 : ''}@demofleet.com`,
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      licenseNumber: `D${1234567 + i}`,
      licenseState: ["NY", "CA", "IL", "GA", "WA"][Math.floor(i / 6) % 5],
      licenseClass: ["A", "B", "C"][i % 3],
      licenseExpiry: new Date(Date.now() + (Math.random() * 365 + 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: i < 20 ? "active" : "off-duty",
      safetyScore: Math.floor(Math.random() * 20 + 80),
      tenantId: "demo-tenant-001"
    })
  }

  return drivers
}

export function generateDemoWorkOrders(count: number = 30): WorkOrder[] {
  const workOrders: WorkOrder[] = []
  const statuses: WorkOrder["status"][] = ["completed", "in-progress", "scheduled", "overdue"]
  const priorities: WorkOrder["priority"][] = ["low", "medium", "high", "urgent"]
  const types = ["Oil Change", "Tire Rotation", "Brake Inspection", "Transmission Repair", "Engine Service", "DOT Inspection", "Battery Replacement"]

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(i / 7.5)] // Distribute statuses evenly
    const type = types[i % types.length]

    let createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    let scheduledDate = new Date(createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000)
    let completedDate = status === "completed" ? new Date(scheduledDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined

    workOrders.push({
      id: `WO-2024-${String(i + 1).padStart(3, '0')}`,
      vehicleId: `veh-demo-${1000 + (i % 50)}`,
      type,
      description: `${type} for vehicle maintenance`,
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignedTo: status !== "scheduled" ? `Technician ${(i % 5) + 1}` : undefined,
      createdAt: createdDate.toISOString(),
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      completedDate: completedDate?.toISOString().split('T')[0],
      estimatedCost: Math.floor(Math.random() * 800 + 200),
      actualCost: status === "completed" ? Math.floor(Math.random() * 800 + 200) : undefined,
      tenantId: "demo-tenant-001"
    })
  }

  return workOrders
}

export function generateDemoFuelTransactions(count: number = 100): FuelTransaction[] {
  const transactions: FuelTransaction[] = []

  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    const gallons = Math.random() * 15 + 5
    const pricePerGallon = Math.random() * 0.5 + 3.5

    transactions.push({
      id: `fuel-demo-${3000 + i}`,
      vehicleId: `veh-demo-${1000 + (i % 50)}`,
      driverId: `drv-demo-${2000 + (i % 30)}`,
      date: date.toISOString().split('T')[0],
      gallons: Number(gallons.toFixed(2)),
      pricePerGallon: Number(pricePerGallon.toFixed(2)),
      totalCost: Number((gallons * pricePerGallon).toFixed(2)),
      location: `Station ${(i % 10) + 1}`,
      odometer: Math.floor(Math.random() * 50000 + 10000),
      tenantId: "demo-tenant-001"
    })
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function generateDemoRoutes(count: number = 15): Route[] {
  const routes: Route[] = []
  const statuses: Route["status"][] = ["completed", "in-progress", "planned"]
  const routeNames = [
    "NYC-PHI Run", "LA-SD Express", "CHI-MIL Route", "ATL-CLT Delivery",
    "SEA-PORT Route", "NYC-BOS Express", "LA-SF Coastal", "CHI-DET Run",
    "ATL-JAX Route", "SEA-VAN Border", "NYC-DC Capital", "LA-LV Desert",
    "CHI-STL Midwest", "ATL-MIA Southeast", "SEA-PDX Northwest"
  ]

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length]
    const startDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)

    routes.push({
      id: `route-demo-${4000 + i}`,
      name: routeNames[i],
      vehicleId: `veh-demo-${1000 + (i * 3) % 50}`,
      driverId: `drv-demo-${2000 + i % 30}`,
      status,
      startLocation: usCities[Math.floor(i / 3) % usCities.length].name,
      endLocation: usCities[(Math.floor(i / 3) + 1) % usCities.length].name,
      distance: Math.floor(Math.random() * 400 + 50),
      estimatedDuration: Math.floor(Math.random() * 480 + 60),
      startTime: startDate.toISOString(),
      endTime: status === "completed" ? new Date(startDate.getTime() + Math.random() * 8 * 60 * 60 * 1000).toISOString() : undefined,
      tenantId: "demo-tenant-001"
    })
  }

  return routes
}

// Generate all demo data at once
export function generateAllDemoData() {
  return {
    vehicles: generateDemoVehicles(50),
    facilities: generateDemoFacilities(),
    drivers: generateDemoDrivers(30),
    workOrders: generateDemoWorkOrders(30),
    fuelTransactions: generateDemoFuelTransactions(100),
    routes: generateDemoRoutes(15),
    maintenanceSchedules: [],
    serviceBays: generateDemoFacilities(),
    staff: generateDemoDrivers(10),
    technicians: generateDemoDrivers(5)
  }
}
