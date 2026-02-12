/**
 * Asset Type Mapping Utilities
 *
 * Maps various vehicle/asset type strings to standardized categories and types.
 */

import { AssetCategory, AssetType, OperationalStatus } from "@/types/asset.types"

/**
 * Map vehicle type string to asset category
 */
export function mapVehicleTypeToCategory(vehicleType?: string): AssetCategory | undefined {
  if (!vehicleType) return "PASSENGER_VEHICLE"
  const type = vehicleType.toLowerCase()
  if (type.includes("sedan") || type.includes("suv") || type.includes("car")) return "PASSENGER_VEHICLE"
  if (type.includes("van") || type.includes("pickup")) return "LIGHT_COMMERCIAL"
  if (type.includes("truck") || type.includes("heavy")) return "HEAVY_TRUCK"
  if (type.includes("tractor")) return "TRACTOR"
  if (type.includes("trailer")) return "TRAILER"
  if (type.includes("excavator") || type.includes("bulldozer") || type.includes("crane") || type.includes("forklift")) return "HEAVY_EQUIPMENT"
  if (type.includes("bucket") || type.includes("utility")) return "UTILITY_VEHICLE"
  if (type.includes("generator") || type.includes("compressor")) return "SPECIALTY_EQUIPMENT"
  return "PASSENGER_VEHICLE"
}

/**
 * Map asset type string to asset category
 */
export function mapAssetTypeToCategory(assetType?: string): AssetCategory | undefined {
  if (!assetType) return undefined
  const type = assetType.toLowerCase()
  if (type.includes("vehicle")) return "PASSENGER_VEHICLE"
  if (type.includes("equipment")) return "HEAVY_EQUIPMENT"
  if (type.includes("tool")) return "NON_POWERED"
  return undefined
}

/**
 * Map vehicle type string to specific asset type
 */
export function mapVehicleTypeToAssetType(vehicleType?: string): AssetType | undefined {
  if (!vehicleType) return "PASSENGER_CAR"
  const type = vehicleType.toLowerCase()
  if (type.includes("sedan") || type.includes("car")) return "PASSENGER_CAR"
  if (type.includes("suv")) return "SUV"
  if (type.includes("van") && type.includes("passenger")) return "PASSENGER_VAN"
  if (type.includes("van")) return "CARGO_VAN"
  if (type.includes("pickup")) return "PICKUP_TRUCK"
  if (type.includes("dump")) return "DUMP_TRUCK"
  if (type.includes("excavator")) return "EXCAVATOR"
  if (type.includes("bulldozer")) return "BULLDOZER"
  if (type.includes("forklift")) return "FORKLIFT"
  if (type.includes("crane")) return "MOBILE_CRANE"
  if (type.includes("generator")) return "GENERATOR"
  return "OTHER"
}

/**
 * Normalize emulator vehicle data to GarageAsset format
 */
export function normalizeEmulatorVehicles(vehicles: any[]): any[] {
  return vehicles.map((v: any) => ({
    id: v.id,
    make: v.make || "Unknown",
    model: v.model || "Unknown",
    year: v.year || new Date().getFullYear(),
    vin: v.vin,
    license_plate: v.licensePlate || v.license_plate,
    asset_name: v.name || `${v.year} ${v.make} ${v.model}`,
    asset_tag: v.assetTag || v.id,
    department: v.department || "Fleet Operations",
    vehicle_type: v.type || v.vehicleType,
    color: v.color,
    odometer: v.odometer || v.mileage,
    engine_hours: v.engineHours,
    asset_category: mapVehicleTypeToCategory(v.type || v.vehicleType),
    asset_type: mapVehicleTypeToAssetType(v.type || v.vehicleType),
    operational_status: v.status === "active" ? ("ACTIVE" as OperationalStatus) : ("STANDBY" as OperationalStatus),
    // Fuel efficiency for telemetry calculations
    fuelEfficiency: v.fuelEfficiency || 25,
    tankSize: v.tankSize || 20
  }))
}
