export const mockVehicles = [
  {
    id: 1,
    vin: 'FLT001V2024001',
    make: 'Ford',
    model: 'F-150',
    year: 2024,
    license_plate: 'FL-2024-001',
    status: 'active',
    fuel_type: 'Gasoline',
    odometer: 15420,
    location: {
      lat: 28.5383,
      lng: -81.3792,
      address: 'Orlando, FL'
    },
    assigned_driver: 'John Smith',
    last_service: '2024-12-15',
    next_service_due: '2025-03-15',
    fuel_level: 75,
    battery_voltage: 12.6,
    engine_hours: 420,
    image_url: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Ford+F-150'
  },
  {
    id: 2,
    vin: 'FLT002V2024002',
    make: 'Chevrolet',
    model: 'Silverado',
    year: 2023,
    license_plate: 'FL-2023-102',
    status: 'active',
    fuel_type: 'Diesel',
    odometer: 28950,
    location: {
      lat: 28.5421,
      lng: -81.3790,
      address: 'Orlando, FL'
    },
    assigned_driver: 'Sarah Johnson',
    last_service: '2024-11-20',
    next_service_due: '2025-02-20',
    fuel_level: 60,
    battery_voltage: 12.4,
    engine_hours: 680,
    image_url: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Chevrolet+Silverado'
  },
  {
    id: 3,
    vin: 'FLT003V2024003',
    make: 'Ram',
    model: '1500',
    year: 2024,
    license_plate: 'FL-2024-203',
    status: 'maintenance',
    fuel_type: 'Gasoline',
    odometer: 12100,
    location: {
      lat: 28.5410,
      lng: -81.3750,
      address: 'Service Center, Orlando'
    },
    assigned_driver: null,
    last_service: '2025-01-10',
    next_service_due: '2025-04-10',
    fuel_level: 45,
    battery_voltage: 12.5,
    engine_hours: 350,
    image_url: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Ram+1500'
  },
  {
    id: 4,
    vin: 'FLT004V2023004',
    make: 'Toyota',
    model: 'Tundra',
    year: 2023,
    license_plate: 'FL-2023-304',
    status: 'active',
    fuel_type: 'Hybrid',
    odometer: 22400,
    location: {
      lat: 28.5450,
      lng: -81.3820,
      address: 'Winter Park, FL'
    },
    assigned_driver: 'Michael Chen',
    last_service: '2024-12-05',
    next_service_due: '2025-03-05',
    fuel_level: 85,
    battery_voltage: 12.7,
    engine_hours: 520,
    image_url: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Toyota+Tundra'
  },
  {
    id: 5,
    vin: 'FLT005V2024005',
    make: 'GMC',
    model: 'Sierra',
    year: 2024,
    license_plate: 'FL-2024-405',
    status: 'active',
    fuel_type: 'Diesel',
    odometer: 8750,
    location: {
      lat: 28.5300,
      lng: -81.3700,
      address: 'Lake Nona, Orlando'
    },
    assigned_driver: 'Emily Rodriguez',
    last_service: '2024-12-28',
    next_service_due: '2025-03-28',
    fuel_level: 90,
    battery_voltage: 12.8,
    engine_hours: 280,
    image_url: 'https://via.placeholder.com/300x200/ec4899/ffffff?text=GMC+Sierra'
  }
];

export const mockVehicleStats = {
  total: 5,
  active: 4,
  maintenance: 1,
  inactive: 0,
  averageMileage: 17524,
  totalFuelSpent: 8450.50,
  avgFuelEfficiency: 18.5
};
