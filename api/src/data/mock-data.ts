/**
 * Mock data for testing without database
 * Provides realistic fleet management data for all API endpoints
 */

export const mockVehicles = [
  {
    id: '1',
    tenant_id: 1,
    vin: '1HGBH41JXMN109186',
    make: 'Ford',
    model: 'F-150',
    year: 2023,
    license_plate: 'ABC-1234',
    status: 'active',
    mileage: 15420,
    fuel_level: 75,
    fuel_type: 'gasoline',
    location: { lat: 30.4383, lng: -84.2807 },
    last_service_date: '2024-10-15',
    next_service_date: '2025-01-15',
    assigned_driver_id: '1',
    department: 'Operations',
    purchase_date: '2023-01-15',
    purchase_price: 45000,
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-11-12T00:00:00Z'
  },
  {
    id: '2',
    tenant_id: 1,
    vin: '1FTFW1ET5DFC10312',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    year: 2022,
    license_plate: 'XYZ-5678',
    status: 'active',
    mileage: 28350,
    fuel_level: 45,
    fuel_type: 'diesel',
    location: { lat: 30.4415, lng: -84.2763 },
    last_service_date: '2024-09-20',
    next_service_date: '2024-12-20',
    assigned_driver_id: '2',
    department: 'Maintenance',
    purchase_date: '2022-03-10',
    purchase_price: 52000,
    created_at: '2022-03-10T10:00:00Z',
    updated_at: '2024-11-12T00:00:00Z'
  },
  {
    id: '3',
    tenant_id: 1,
    vin: '5TFUY5F18DX123456',
    make: 'Toyota',
    model: 'Tacoma',
    year: 2024,
    license_plate: 'DEF-9012',
    status: 'maintenance',
    mileage: 5200,
    fuel_level: 90,
    fuel_type: 'gasoline',
    location: { lat: 30.4497, lng: -84.2733 },
    last_service_date: '2024-11-01',
    next_service_date: '2025-02-01',
    assigned_driver_id: '3',
    department: 'Delivery',
    purchase_date: '2024-02-01',
    purchase_price: 38000,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-11-12T00:00:00Z'
  }
]

export const mockDrivers = [
  {
    id: '1',
    tenant_id: 1,
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@fleet.com',
    phone: '555-0101',
    license_number: 'D1234567',
    license_expiry: '2026-06-30',
    status: 'active',
    hire_date: '2020-03-15',
    department: 'Operations',
    role: 'driver',
    certifications: ['CDL Class A', 'Hazmat'],
    created_at: '2020-03-15T10:00:00Z',
    updated_at: '2024-11-12T00:00:00Z'
  },
  {
    id: '2',
    tenant_id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@fleet.com',
    phone: '555-0102',
    license_number: 'D7654321',
    license_expiry: '2025-12-31',
    status: 'active',
    hire_date: '2019-07-10',
    department: 'Maintenance',
    role: 'driver',
    certifications: ['CDL Class B'],
    created_at: '2019-07-10T10:00:00Z',
    updated_at: '2024-11-12T00:00:00Z'
  },
  {
    id: '3',
    tenant_id: 1,
    first_name: 'Mike',
    last_name: 'Wilson',
    email: 'mike.wilson@fleet.com',
    phone: '555-0103',
    license_number: 'D9876543',
    license_expiry: '2027-03-15',
    status: 'active',
    hire_date: '2021-01-20',
    department: 'Delivery',
    role: 'driver',
    certifications: ['CDL Class A'],
    created_at: '2021-01-20T10:00:00Z',
    updated_at: '2024-11-12T00:00:00Z'
  }
]

export const mockWorkOrders = [
  {
    id: '1',
    tenant_id: 1,
    vehicle_id: '1',
    title: 'Oil Change and Tire Rotation',
    description: 'Routine maintenance - 15k mile service',
    status: 'completed',
    priority: 'medium',
    assigned_to: '2',
    scheduled_date: '2024-10-15',
    completed_date: '2024-10-15',
    estimated_cost: 150,
    actual_cost: 145,
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-10-15T16:00:00Z'
  },
  {
    id: '2',
    tenant_id: 1,
    vehicle_id: '2',
    title: 'Brake Pad Replacement',
    description: 'Front brake pads worn - replace immediately',
    status: 'in_progress',
    priority: 'high',
    assigned_to: '2',
    scheduled_date: '2024-11-12',
    estimated_cost: 300,
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-12T08:00:00Z'
  },
  {
    id: '3',
    tenant_id: 1,
    vehicle_id: '3',
    title: 'Annual Inspection',
    description: 'State-required annual safety inspection',
    status: 'pending',
    priority: 'medium',
    scheduled_date: '2024-11-20',
    estimated_cost: 75,
    created_at: '2024-11-05T10:00:00Z',
    updated_at: '2024-11-05T10:00:00Z'
  }
]

export const mockFuelTransactions = [
  {
    id: '1',
    tenant_id: 1,
    vehicle_id: '1',
    driver_id: '1',
    date: '2024-11-11',
    gallons: 18.5,
    cost_per_gallon: 3.45,
    total_cost: 63.83,
    odometer: 15420,
    fuel_type: 'gasoline',
    location: 'Shell Station - Main St',
    created_at: '2024-11-11T14:30:00Z'
  },
  {
    id: '2',
    tenant_id: 1,
    vehicle_id: '2',
    driver_id: '2',
    date: '2024-11-10',
    gallons: 22.3,
    cost_per_gallon: 3.89,
    total_cost: 86.75,
    odometer: 28350,
    fuel_type: 'diesel',
    location: 'BP Station - Highway 40',
    created_at: '2024-11-10T09:15:00Z'
  }
]

export const mockFacilities = [
  {
    id: '1',
    tenant_id: 1,
    name: 'Main Garage',
    type: 'maintenance',
    address: '123 Industrial Parkway',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    phone: '555-0200',
    capacity: 10,
    operating_hours: '6:00 AM - 10:00 PM',
    manager_id: '2',
    created_at: '2020-01-01T10:00:00Z'
  },
  {
    id: '2',
    tenant_id: 1,
    name: 'North Service Center',
    type: 'service',
    address: '456 Route 9',
    city: 'Albany',
    state: 'NY',
    zip: '12201',
    phone: '555-0201',
    capacity: 5,
    operating_hours: '7:00 AM - 6:00 PM',
    created_at: '2021-06-15T10:00:00Z'
  }
]

export const mockMaintenanceSchedules = [
  {
    id: '1',
    tenant_id: 1,
    vehicle_id: '1',
    service_type: 'oil_change',
    last_service_date: '2024-10-15',
    next_service_date: '2025-01-15',
    interval_miles: 5000,
    created_at: '2024-10-15T10:00:00Z'
  },
  {
    id: '2',
    tenant_id: 1,
    vehicle_id: '2',
    service_type: 'tire_rotation',
    last_service_date: '2024-09-20',
    next_service_date: '2024-12-20',
    interval_miles: 7500,
    created_at: '2024-09-20T10:00:00Z'
  }
]

export const mockRoutes = [
  {
    id: '1',
    tenant_id: 1,
    name: 'Downtown Delivery Route',
    description: 'Daily delivery route covering downtown area',
    start_location: '123 Main St, New York, NY',
    end_location: '123 Main St, New York, NY',
    waypoints: ['456 Broadway', '789 Park Ave', '321 5th Ave'],
    estimated_distance_miles: 45,
    estimated_duration_minutes: 180,
    assigned_vehicle_id: '1',
    assigned_driver_id: '1',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z'
  }
]

// Helper function to paginate results
export function paginateResults<T>(data: T[], page: number = 1, pageSize: number = 10) {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    data: data.slice(start, end),
    total: data.length,
    page,
    pageSize,
    totalPages: Math.ceil(data.length / pageSize)
  }
}
