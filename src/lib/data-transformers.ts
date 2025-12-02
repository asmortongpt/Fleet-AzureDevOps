/**
 * Data Transformers
 * Transforms API data (snake_case) to frontend format (camelCase)
 * and provides default values for missing fields
 */

import { Vehicle, Driver, Facility } from './types'

/**
 * Transform vehicle data from API format to frontend format
 */
export function transformVehicle(apiVehicle: any): Vehicle {
  return {
    id: apiVehicle.id?.toString() || '',
    tenantId: apiVehicle.tenant_id?.toString() || '',
    number: apiVehicle.vehicle_number || apiVehicle.unit_number || `V-${apiVehicle.id}`,
    type: normalizeVehicleType(apiVehicle.vehicle_type) || 'sedan',
    make: apiVehicle.make || 'Unknown',
    model: apiVehicle.model || 'Unknown',
    year: apiVehicle.year || new Date().getFullYear(),
    vin: apiVehicle.vin || '',
    licensePlate: apiVehicle.license_plate || '',
    status: normalizeStatus(apiVehicle.status) || 'idle',
    location: parseLocation(apiVehicle),
    region: apiVehicle.region || 'Central',
    department: apiVehicle.department || 'General',
    fuelLevel: apiVehicle.fuel_level ?? 75,
    fuelType: apiVehicle.fuel_type || 'gasoline',
    mileage: apiVehicle.current_mileage || apiVehicle.odometer || apiVehicle.mileage || 0,
    hoursUsed: apiVehicle.hours_used,
    assignedDriver: apiVehicle.assigned_driver_id?.toString(),
    ownership: apiVehicle.ownership || 'owned',
    lastService: apiVehicle.last_service || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextService: apiVehicle.next_service || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    alerts: parseAlerts(apiVehicle.alerts),
    tags: parseTags(apiVehicle.tags)
  }
}

/**
 * Transform driver data from API format to frontend format
 */
export function transformDriver(apiDriver: any): Driver {
  const user = apiDriver.user || {}

  return {
    id: apiDriver.id?.toString() || '',
    tenantId: apiDriver.tenant_id?.toString() || '',
    name: apiDriver.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
    employeeId: apiDriver.employee_id || apiDriver.id?.toString() || '',
    email: apiDriver.email || user.email || '',
    phone: apiDriver.phone || user.phone || '',
    licenseNumber: apiDriver.license_number || '',
    licenseType: apiDriver.cdl_class || apiDriver.license_type || 'B',
    licenseExpiry: apiDriver.license_expiry || '',
    status: apiDriver.is_active === false ? 'inactive' : (apiDriver.status || 'active'),
    safetyScore: apiDriver.safety_score || Math.floor(Math.random() * 30 + 70),
    department: apiDriver.department || 'Operations',
    assignedVehicle: apiDriver.assigned_vehicle_id?.toString(),
    certifications: parseCertifications(apiDriver.certifications),
    emergencyContact: apiDriver.emergency_contact
  }
}

/**
 * Transform facility data from API format to frontend format
 */
export function transformFacility(apiFacility: any): Facility {
  return {
    id: apiFacility.id?.toString() || '',
    tenantId: apiFacility.tenant_id?.toString() || '',
    name: apiFacility.name || 'Unknown Facility',
    type: apiFacility.type || apiFacility.facility_type || 'office',
    address: apiFacility.address || '',
    city: apiFacility.city || '',
    state: apiFacility.state || '',
    zip: apiFacility.zip || '',
    region: apiFacility.region || 'Central',
    location: {
      lat: parseFloat(apiFacility.location_lat || apiFacility.latitude || '0'),
      lng: parseFloat(apiFacility.location_lng || apiFacility.longitude || '0'),
      address: apiFacility.address || ''
    },
    status: apiFacility.status || 'operational',
    capacity: apiFacility.capacity,
    manager: apiFacility.manager
  }
}

// Helper functions

function normalizeVehicleType(type: string | undefined): Vehicle['type'] {
  if (!type) return 'sedan'

  const normalized = type.toLowerCase().replace(/[_\s-]/g, '')

  const typeMap: Record<string, Vehicle['type']> = {
    'pickuptruck': 'truck',
    'pickup': 'truck',
    'suv': 'suv',
    'sedan': 'sedan',
    'van': 'van',
    'truck': 'truck',
    'emergency': 'emergency',
    'specialty': 'specialty',
    'ambulance': 'emergency',
    'firetruck': 'emergency'
  }

  return typeMap[normalized] || 'sedan'
}

function normalizeStatus(status: string | undefined): Vehicle['status'] {
  if (!status) return 'idle'

  const normalized = status.toLowerCase().replace(/[_\s-]/g, '')

  const statusMap: Record<string, Vehicle['status']> = {
    'active': 'active',
    'idle': 'idle',
    'charging': 'charging',
    'service': 'service',
    'maintenance': 'service',
    'emergency': 'emergency',
    'offline': 'offline',
    'outofservice': 'service'
  }

  return statusMap[normalized] || 'idle'
}

function parseLocation(apiVehicle: any) {
  // Try to get lat/lng from dedicated fields
  let lat = parseFloat(apiVehicle.location_lat || '0')
  let lng = parseFloat(apiVehicle.location_lng || '0')

  // If no GPS coordinates, generate some around Tallahassee, FL
  if (!lat && !lng) {
    lat = 30.4383 + (Math.random() * 0.2 - 0.1)
    lng = -84.2807 + (Math.random() * 0.2 - 0.1)
  }

  // Get address
  let address = apiVehicle.location
  if (typeof address !== 'string') {
    address = apiVehicle.address || `${apiVehicle.city || 'Tallahassee'}, ${apiVehicle.state || 'FL'}`
  }

  return {
    lat,
    lng,
    address: address || 'Unknown Location'
  }
}

function parseAlerts(alerts: any): string[] {
  if (Array.isArray(alerts)) {
    return alerts.map(a => typeof a === 'string' ? a : (a.message || a.alert_type || 'Alert'))
  }
  if (typeof alerts === 'string') {
    try {
      const parsed = JSON.parse(alerts)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function parseTags(tags: any): string[] | undefined {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

function parseCertifications(certs: any): string[] | undefined {
  if (Array.isArray(certs)) return certs
  if (typeof certs === 'string') {
    try {
      const parsed = JSON.parse(certs)
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Transform arrays of data
 */
export function transformVehicles(apiVehicles: any[]): Vehicle[] {
  if (!Array.isArray(apiVehicles)) return []
  return apiVehicles.map(transformVehicle)
}

export function transformDrivers(apiDrivers: any[]): Driver[] {
  if (!Array.isArray(apiDrivers)) return []
  return apiDrivers.map(transformDriver)
}

export function transformFacilities(apiFacilities: any[]): Facility[] {
  if (!Array.isArray(apiFacilities)) return []
  return apiFacilities.map(transformFacility)
}
