import { Vehicle, GISFacility, TrafficCamera } from "../src/lib/types"

/**
 * Generate mock vehicles with realistic Tallahassee, FL coordinates
 */
export function generateMockVehicles(count: number = 10): Vehicle[] {
  const baseLat = 30.4383
  const baseLng = -84.2807
  const spread = 0.1 // ~11km radius

  const vehicleTypes: Vehicle["type"][] = ["sedan", "suv", "truck", "van", "bus"]
  const statuses: Vehicle["status"][] = ["active", "idle", "charging", "service", "emergency", "offline"]
  const fuelTypes: Vehicle["fuelType"][] = ["gasoline", "diesel", "electric", "hybrid"]
  const makes = ["Ford", "Chevrolet", "Toyota", "Honda", "Tesla", "Ram", "GMC"]
  const departments = ["Operations", "Maintenance", "Administration", "Emergency Response"]
  
  return Array.from({ length: count }, (_, i) => {
    const type = vehicleTypes[i % vehicleTypes.length]
    const status = statuses[i % statuses.length]
    const fuelType = type === "bus" ? "diesel" : fuelTypes[i % fuelTypes.length]
    const make = makes[i % makes.length]
    
    return {
      id: "VEH-" + String(i + 1).padStart(4, "0"),
      tenantId: "tenant-001",
      number: "FL-" + String(i + 1).padStart(3, "0"),
      type,
      make,
      model: type === "sedan" ? "Fusion" : type === "suv" ? "Explorer" : type === "truck" ? "F-150" : type === "van" ? "Transit" : "E-450",
      year: 2020 + (i % 5),
      vin: "1HGBH41JXMN" + String(109186 + i).padStart(6, "0"),
      licensePlate: "FL " + String(i + 100).padStart(3, "0") + " ABC",
      status,
      location: {
        lat: baseLat + (Math.random() - 0.5) * spread,
        lng: baseLng + (Math.random() - 0.5) * spread,
        address: Math.floor(Math.random() * 9000 + 1000) + " " + ["N", "S", "E", "W"][i % 4] + " " + ["Monroe", "Adams", "Tennessee", "Gadsden", "Meridian"][i % 5] + " St, Tallahassee, FL 32301",
      },
      region: "North Florida",
      department: departments[i % departments.length],
      fuelLevel: Math.floor(Math.random() * 100),
      fuelType,
      mileage: Math.floor(Math.random() * 100000) + 10000,
      assignedDriver: status !== "offline" ? "Driver " + String(i + 1).padStart(2, "0") : undefined,
      ownership: i % 3 === 0 ? "leased" : i % 3 === 1 ? "rented" : "owned",
      lastService: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      nextService: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      alerts: status === "emergency" ? ["Engine Warning", "Low Oil Pressure"] : status === "service" ? ["Maintenance Due"] : [],
      tags: [type, fuelType, departments[i % departments.length]],
    }
  })
}

/**
 * Generate mock GIS facilities
 */
export function generateMockFacilities(count: number = 5): GISFacility[] {
  const baseLat = 30.4383
  const baseLng = -84.2807
  const spread = 0.15

  const types: GISFacility["type"][] = ["office", "depot", "service-center", "fueling-station"]
  const names = [
    "Main Office",
    "North Depot",
    "South Service Center",
    "East Fueling Station",
    "West Maintenance Facility",
    "Central Operations",
    "Emergency Response Hub",
  ]

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length]
    return {
      id: "FAC-" + String(i + 1).padStart(4, "0"),
      tenantId: "tenant-001",
      name: names[i % names.length],
      type,
      status: i % 7 === 0 ? "maintenance" : i % 11 === 0 ? "closed" : "operational",
      capacity: Math.floor(Math.random() * 50) + 20,
      address: Math.floor(Math.random() * 9000 + 1000) + " " + ["Capital", "Tennessee", "Apalachee", "Thomasville", "Mahan"][i % 5] + " Dr, Tallahassee, FL 32301",
      location: {
        lat: baseLat + (Math.random() - 0.5) * spread,
        lng: baseLng + (Math.random() - 0.5) * spread,
      },
    }
  })
}

/**
 * Generate mock traffic cameras
 */
export function generateMockCameras(count: number = 8): TrafficCamera[] {
  const baseLat = 30.4383
  const baseLng = -84.2807
  const spread = 0.12

  const intersections = [
    { name: "I-10 & Monroe St", cross: "Interstate 10 / Monroe Street" },
    { name: "Tennessee St & Adams St", cross: "Tennessee Street / Adams Street" },
    { name: "Apalachee Pkwy & Capital Cir", cross: "Apalachee Parkway / Capital Circle" },
    { name: "Thomasville Rd & I-10", cross: "Thomasville Road / Interstate 10" },
    { name: "Mahan Dr & Capital Cir NE", cross: "Mahan Drive / Capital Circle Northeast" },
    { name: "W Tennessee St & Ocala Rd", cross: "West Tennessee Street / Ocala Road" },
    { name: "N Monroe St & 7th Ave", cross: "North Monroe Street / 7th Avenue" },
    { name: "Pensacola St & MLK Jr Blvd", cross: "Pensacola Street / Martin Luther King Jr Boulevard" },
  ]

  return Array.from({ length: count }, (_, i) => {
    const intersection = intersections[i % intersections.length]
    return {
      id: "CAM-" + String(i + 1).padStart(4, "0"),
      name: "Traffic Camera - " + intersection.name,
      latitude: baseLat + (Math.random() - 0.5) * spread,
      longitude: baseLng + (Math.random() - 0.5) * spread,
      address: intersection.name + ", Tallahassee, FL",
      crossStreets: intersection.cross,
      operational: i % 7 !== 0,
      cameraUrl: i % 2 === 0 ? "https://example.com/camera/" + (i + 1) : undefined,
    }
  })
}

/**
 * Generate a large dataset of vehicles for testing performance
 */
export function generateLargeVehicleDataset(count: number = 1000): Vehicle[] {
  return generateMockVehicles(count)
}

/**
 * Get vehicles filtered by status
 */
export function getVehiclesByStatus(vehicles: Vehicle[], status: Vehicle["status"]): Vehicle[] {
  return vehicles.filter((v) => v.status === status)
}

/**
 * Get active vehicles only
 */
export function getActiveVehicles(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter((v) => v.status === "active")
}

/**
 * Get vehicles with alerts
 */
export function getVehiclesWithAlerts(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter((v) => v.alerts && v.alerts.length > 0)
}
