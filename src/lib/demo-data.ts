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
    { make: "Tesla", models: ["Model 3", "Model Y", "Semi"] },
    { make: "Nissan", models: ["Altima", "Rogue", "Leaf"] },
    { make: "Ram", models: ["1500", "2500", "ProMaster"] },
    { make: "Mercedes", models: ["Sprinter", "Metris"] },
    { make: "Caterpillar", models: ["320 Excavator", "966 Loader", "D6 Dozer"] },
    { make: "John Deere", models: ["4066R Tractor", "310SL Backhoe", "324G Loader"] },
    { make: "Freightliner", models: ["Cascadia", "M2 106", "Columbia"] }
  ]

  const departments = ["Operations", "Logistics", "Field Services", "Maintenance", "Executive", "Construction"]
  const regions = ["North Florida", "Central Florida", "Tallahassee Metro", "Capital District", "Panhandle"]
  const alerts = ["Oil Change Due", "Tire Pressure Low", "Inspection Required", "Brake Service Soon", "Filter Replacement"]
  const tags = ["Priority Fleet", "Heavy Duty", "City Routes", "Long Haul", "Training Vehicle", "EV Fleet"]

  for (let i = 0; i < count; i++) {
    const city = usCities[Math.floor(i / 10) % usCities.length]
    const type = vehicleTypes[i % vehicleTypes.length]
    const makeData = makes[i % makes.length]
    const model = makeData!.models[Math.floor(Math.random() * makeData!.models.length)]

    // Determine if this is heavy equipment
    const isHeavyEquipment = makeData!.make === "Caterpillar" || makeData!.make === "John Deere"
    const isTrailer = model!.includes("Trailer")
    const isTruck = type === "truck" || makeData!.make === "Freightliner"

    // More vehicles should be active for realistic demo
    const statusWeights = [0.4, 0.3, 0.1, 0.1, 0.05, 0.05]
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

    const cityCode = city!.name.substring(0, 3).toUpperCase()
    const number = `TAL-${1001 + i}`
    const odometer = Math.floor(Math.random() * 80000 + 10000)
    const engineHours = isHeavyEquipment ? Math.floor(Math.random() * 5000 + 500) : undefined

    vehicles.push({
      id: `veh-${Math.random().toString(36).substr(2, 6)}`,
      tenantId: "demo-tenant-001",
      name: `${makeData!.make} ${model}`,
      number,
      type: isHeavyEquipment ? "construction" : (isTrailer ? "trailer" : type),
      make: makeData!.make,
      model,
      year: 2018 + (i % 7),
      vin: `1HGBH${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000)}`,
      status,
      location: {
        lat: city!.lat + (Math.random() - 0.5) * 0.1,
        lng: city!.lng + (Math.random() - 0.5) * 0.1,
        address: `${Math.floor(Math.random() * 9000 + 1000)} ${["Main", "Oak", "Broadway", "Park", "5th", "Monroe", "Tennessee"][Math.floor(Math.random() * 7)]} St, ${city!.name}, FL`
      },
      region: regions[i % regions.length],
      department: departments[i % departments.length],
      fuelLevel: status === "active" ? Math.floor(Math.random() * 40 + 40) : Math.floor(Math.random() * 100),
      fuelType: model!.includes("Tesla") || model!.includes("Leaf") ? "electric" : (isTruck ? "diesel" : "gasoline"),
      mileage: odometer,
      hoursUsed: engineHours,
      driver: status === "active" ? `Driver ${Math.floor(i / 3) + 1}` : undefined,
      assignedDriver: status === "active" ? `drv-demo-${2000 + (i % 30)}` : undefined,
      ownership: ["owned", "leased", "rented"][i % 3] as Vehicle["ownership"],
      odometer,
      lastService: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextService: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alerts: i % 5 === 0 ? [alerts[Math.floor(Math.random() * alerts.length)]] : [],
      customFields: {
        costCenter: `CC-${1000 + Math.floor(i / 10)}`,
        insurancePolicy: `POL-${100000 + i}`,
        purchaseDate: new Date(Date.now() - Math.random() * 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        warrantyExpiry: new Date(Date.now() + Math.random() * 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      tags: [tags[Math.floor(Math.random() * tags.length)]],

      // Multi-Asset Extensions
      asset_category: isHeavyEquipment ? 'HEAVY_EQUIPMENT' : (isTruck ? 'HEAVY_TRUCK' : 'PASSENGER_VEHICLE'),
      asset_type: isHeavyEquipment ? 'EXCAVATOR' : (isTruck ? 'BOX_TRUCK' : 'SEDAN'),
      power_type: isTrailer ? 'TOWED' : 'SELF_POWERED',
      primary_metric: isHeavyEquipment ? 'ENGINE_HOURS' : 'ODOMETER',
      engine_hours: engineHours,
      pto_hours: isHeavyEquipment ? Math.floor(Math.random() * 1000) : undefined,
      aux_hours: isHeavyEquipment ? Math.floor(Math.random() * 500) : undefined,
      cycle_count: isHeavyEquipment ? Math.floor(Math.random() * 10000) : undefined,
      last_metric_update: new Date().toISOString(),

      // Equipment Specifications
      capacity_tons: isHeavyEquipment ? Math.floor(Math.random() * 30 + 10) : undefined,
      max_reach_feet: isHeavyEquipment ? Math.floor(Math.random() * 40 + 20) : undefined,
      lift_height_feet: isHeavyEquipment ? Math.floor(Math.random() * 30 + 15) : undefined,
      bucket_capacity_yards: isHeavyEquipment ? Math.floor(Math.random() * 5 + 1) : undefined,
      operating_weight_lbs: isHeavyEquipment ? Math.floor(Math.random() * 50000 + 20000) : undefined,

      // Trailer Specifications
      axle_count: isTrailer ? Math.floor(Math.random() * 3 + 2) : undefined,
      max_payload_kg: isTrailer ? Math.floor(Math.random() * 20000 + 5000) : undefined,
      tank_capacity_l: isTrailer ? Math.floor(Math.random() * 5000 + 1000) : undefined,

      // Equipment Capabilities
      has_pto: isHeavyEquipment || isTruck,
      has_aux_power: isHeavyEquipment,
      is_road_legal: !isHeavyEquipment,
      requires_cdl: isTruck || isHeavyEquipment,
      requires_special_license: isHeavyEquipment,
      max_speed_kph: isHeavyEquipment ? 40 : (isTruck ? 120 : 180),
      is_off_road_only: isHeavyEquipment,

      // Operational Status
      operational_status: status === 'active' ? 'IN_USE' : (status === 'service' ? 'MAINTENANCE' : 'AVAILABLE'),

      // Asset Organization
      parent_asset_id: undefined,
      group_id: `group-${Math.floor(i / 10)}`,
      fleet_id: "fleet-main-001",
      location_id: `loc-${Math.floor(i / 20)}`
    })
  }

  return vehicles
}

export function generateDemoFacilities(): GISFacility[] {
  // All facilities now located in Tallahassee, FL area
  return [
    {
      id: "fac-demo-1",
      name: "CTA Fleet HQ Depot",
      type: "depot",
      location: {
        lat: 30.4383,
        lng: -84.2807,
        address: "1000 Apalachee Pkwy, Tallahassee, FL 32301"
      },
      address: "1000 Apalachee Pkwy, Tallahassee, FL 32301",
      capacity: 15,
      currentOccupancy: 8,
      status: "operational",
      serviceBays: 8,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-2",
      name: "North Tallahassee Hub",
      type: "depot",
      location: {
        lat: 30.4650,
        lng: -84.2600,
        address: "2500 N Monroe St, Tallahassee, FL 32303"
      },
      address: "2500 N Monroe St, Tallahassee, FL 32303",
      capacity: 10,
      currentOccupancy: 6,
      status: "operational",
      serviceBays: 6,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-3",
      name: "Capitol Circle Operations",
      type: "depot",
      location: {
        lat: 30.4500,
        lng: -84.2300,
        address: "3200 Capital Circle NE, Tallahassee, FL 32308"
      },
      address: "3200 Capital Circle NE, Tallahassee, FL 32308",
      capacity: 10,
      currentOccupancy: 5,
      status: "operational",
      serviceBays: 5,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-4",
      name: "Southwood Service Center",
      type: "service-center",
      location: {
        lat: 30.4100,
        lng: -84.2400,
        address: "4500 Southwood Blvd, Tallahassee, FL 32311"
      },
      address: "4500 Southwood Blvd, Tallahassee, FL 32311",
      capacity: 8,
      currentOccupancy: 4,
      status: "operational",
      serviceBays: 4,
      tenantId: "demo-tenant-001"
    },
    {
      id: "fac-demo-5",
      name: "Killearn Fueling Station",
      type: "fueling-station",
      location: {
        lat: 30.5000,
        lng: -84.2200,
        address: "1800 Thomasville Rd, Tallahassee, FL 32303"
      },
      address: "1800 Thomasville Rd, Tallahassee, FL 32303",
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
  const departments = ["Operations", "Logistics", "Field Services", "Transportation", "Maintenance"]
  const licenseTypes = ["CDL Class A", "CDL Class B", "Standard", "CDL Class C", "Passenger"]
  const certifications = [
    ["HAZMAT", "Tanker"],
    ["Doubles/Triples", "HAZMAT"],
    ["Passenger", "School Bus"],
    ["Tanker"],
    ["HAZMAT", "Doubles/Triples", "Tanker"],
    []
  ]

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]

    drivers.push({
      id: `drv-demo-${2000 + i}`,
      tenantId: "demo-tenant-001",
      employeeId: `EMP-${String(1001 + i).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}${i > 9 ? i - 9 : ''}@demofleet.com`,
      phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      department: departments[i % departments.length],
      licenseType: licenseTypes[i % licenseTypes.length],
      licenseExpiry: new Date(Date.now() + (Math.random() * 365 + 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: i < 20 ? "active" : "off-duty",
      safetyScore: Math.floor(Math.random() * 20 + 80),
      certifications: certifications[i % certifications.length]
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

    const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    const scheduledDate = new Date(createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000)
    const completedDate = status === "completed" ? new Date(scheduledDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined

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
  // Tallahassee area routes
  const routeNames = [
    "TLH-JAX Express", "TLH-PNS Route", "Capital Circle Run", "Southwood Delivery",
    "Killearn Route", "TLH-Thomasville Express", "Midtown Loop", "FSU Campus Run",
    "Airport Connector", "Mahan Drive Route", "Apalachee Pkwy", "Blairstone Loop",
    "Capital Region Circuit", "TLH-PAM Coastal", "North Monroe Route"
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

// Generate all demo data at once with comprehensive counts
export function generateAllDemoData() {
  const vehicleCount = parseInt(import.meta.env?.VITE_DEMO_VEHICLE_COUNT || '100', 10)
  const driverCount = parseInt(import.meta.env?.VITE_DEMO_DRIVER_COUNT || '50', 10)
  const workOrderCount = parseInt(import.meta.env?.VITE_DEMO_WORK_ORDER_COUNT || '75', 10)
  const fuelTransactionCount = parseInt(import.meta.env?.VITE_DEMO_FUEL_TRANSACTION_COUNT || '250', 10)

  const vehicles = generateDemoVehicles(vehicleCount)
  const drivers = generateDemoDrivers(driverCount)
  const workOrders = generateDemoWorkOrders(workOrderCount)
  const fuelTransactions = generateDemoFuelTransactions(fuelTransactionCount)
  const routes = generateDemoRoutes(40)
  const facilities = generateDemoFacilities()

  // Generate technicians with full data
  const technicians = drivers.slice(0, 15).map((d, i) => ({
    id: `tech-${i + 1}`,
    name: d.name,
    specialization: ["Engine", "Transmission", "Brakes", "Electrical", "HVAC", "Tires"][i % 6].split(','),
    availability: ["available", "busy", "off-duty"][i % 3] as "available" | "busy" | "off-duty",
    efficiency: Math.floor(Math.random() * 20 + 80),
    certifications: d.certifications,
    activeWorkOrders: Math.floor(Math.random() * 5)
  }))

  // Generate maintenance schedules
  const maintenanceSchedules = vehicles.slice(0, 50).map((v, i) => ({
    id: `ms-${i + 1}`,
    vehicleId: v.id,
    vehicleNumber: v.number,
    serviceType: ["Oil Change", "Tire Rotation", "Brake Inspection", "DOT Inspection", "Engine Service"][i % 5],
    frequency: ["monthly", "quarterly", "annually", "mileage-based"][i % 4] as any,
    intervalMiles: i % 4 === 3 ? 5000 + (i * 1000) : undefined,
    lastPerformed: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastCompleted: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextDue: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: ["low", "medium", "high", "urgent"][i % 4] as any,
    estimatedCost: Math.floor(Math.random() * 500 + 100),
    status: ["scheduled", "due", "overdue", "completed"][i % 4] as any,
    autoSchedule: i % 2 === 0,
    isRecurring: true,
    autoCreateWorkOrder: true
  }))

  // Generate service bays
  const serviceBays = [1, 2, 3, 4, 5, 6, 7, 8].map(num => ({
    id: `bay-${num}`,
    number: `BAY-${num.toString().padStart(2, '0')}`,
    status: num <= 5 ? "occupied" : (num === 6 ? "maintenance" : "available") as any,
    vehicle: num <= 5 ? vehicles[num - 1]?.number : undefined,
    technician: num <= 5 ? technicians[num - 1]?.name : undefined,
    serviceType: num <= 5 ? ["Oil Change", "Brake Service", "Tire Rotation", "Engine Tune", "Inspection"][num - 1] : undefined,
    estimatedCompletion: num <= 5 ? new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000).toISOString() : undefined
  }))

  // Generate parts inventory
  const parts = Array.from({ length: 100 }, (_, i) => ({
    id: `part-${i + 1}`,
    partNumber: `PN-${10000 + i}`,
    name: ["Oil Filter", "Air Filter", "Brake Pads", "Spark Plug", "Wiper Blade", "Battery", "Alternator", "Starter", "Radiator Hose", "Serpentine Belt"][i % 10],
    description: `High quality replacement part`,
    category: ["filters", "brakes", "electrical", "engine", "body"][i % 5] as any,
    manufacturer: ["Bosch", "Denso", "ACDelco", "Motorcraft", "Mopar"][i % 5],
    compatibleVehicles: vehicles.slice(i % 10, (i % 10) + 5).map(v => v.id),
    quantityOnHand: Math.floor(Math.random() * 50 + 5),
    minStockLevel: 10,
    maxStockLevel: 100,
    reorderPoint: 15,
    unitCost: Math.floor(Math.random() * 100 + 10),
    location: `Shelf ${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
    alternateVendors: []
  }))

  // Generate vendors
  const vendors = [
    { id: "v-1", name: "AutoZone Parts Plus", type: "parts" as const },
    { id: "v-2", name: "Precision Repair Services", type: "service" as const },
    { id: "v-3", name: "Gulf Coast Fuel Co", type: "fuel" as const },
    { id: "v-4", name: "Fleet Insurance Group", type: "insurance" as const },
    { id: "v-5", name: "Capital Leasing LLC", type: "leasing" as const }
  ].map((v, i) => ({
    ...v,
    tenantId: "demo-tenant-001",
    contactPerson: `Contact ${i + 1}`,
    email: `contact@${v.name.toLowerCase().replace(/\s+/g, '')}.com`,
    phone: `(850) ${100 + i}-${1000 + i}`,
    address: `${1000 + i * 100} Business Blvd, Tallahassee, FL 32301`,
    rating: 4 + Math.random(),
    status: "active" as const,
    services: [v.type],
    paymentTerms: "Net 30",
    taxId: `12-345${6000 + i}`,
    certifications: ["ISO 9001"],
    totalSpend: Math.floor(Math.random() * 50000 + 10000),
    invoiceCount: Math.floor(Math.random() * 50 + 10)
  }))

  return {
    vehicles,
    facilities,
    drivers,
    workOrders,
    fuelTransactions,
    routes,
    maintenanceSchedules,
    serviceBays,
    staff: drivers.slice(0, 20),
    technicians,
    parts,
    vendors
  }
}
