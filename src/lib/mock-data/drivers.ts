export const mockDrivers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@fleet.com',
    phone: '(407) 555-0101',
    license_number: 'FL-D123456',
    license_expiry: '2027-06-15',
    status: 'active',
    assigned_vehicle: 'Ford F-150 (FL-2024-001)',
    hire_date: '2020-03-15',
    total_miles: 125000,
    safety_score: 98,
    violations: 0,
    avatar_url: 'https://via.placeholder.com/150/3b82f6/ffffff?text=JS'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@fleet.com',
    phone: '(407) 555-0102',
    license_number: 'FL-D789012',
    license_expiry: '2026-09-20',
    status: 'active',
    assigned_vehicle: 'Chevrolet Silverado (FL-2023-102)',
    hire_date: '2019-08-22',
    total_miles: 180000,
    safety_score: 95,
    violations: 1,
    avatar_url: 'https://via.placeholder.com/150/10b981/ffffff?text=SJ'
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'michael.chen@fleet.com',
    phone: '(407) 555-0103',
    license_number: 'FL-D345678',
    license_expiry: '2028-03-10',
    status: 'active',
    assigned_vehicle: 'Toyota Tundra (FL-2023-304)',
    hire_date: '2021-01-10',
    total_miles: 95000,
    safety_score: 100,
    violations: 0,
    avatar_url: 'https://via.placeholder.com/150/8b5cf6/ffffff?text=MC'
  },
  {
    id: 4,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@fleet.com',
    phone: '(407) 555-0104',
    license_number: 'FL-D901234',
    license_expiry: '2026-12-05',
    status: 'active',
    assigned_vehicle: 'GMC Sierra (FL-2024-405)',
    hire_date: '2022-06-01',
    total_miles: 62000,
    safety_score: 97,
    violations: 0,
    avatar_url: 'https://via.placeholder.com/150/ec4899/ffffff?text=ER'
  },
  {
    id: 5,
    name: 'David Williams',
    email: 'david.williams@fleet.com',
    phone: '(407) 555-0105',
    license_number: 'FL-D567890',
    license_expiry: '2025-07-18',
    status: 'on_leave',
    assigned_vehicle: null,
    hire_date: '2018-11-15',
    total_miles: 210000,
    safety_score: 92,
    violations: 2,
    avatar_url: 'https://via.placeholder.com/150/f59e0b/ffffff?text=DW'
  }
];

export const mockDriverStats = {
  total: 5,
  active: 4,
  on_leave: 1,
  avgSafetyScore: 96.4,
  totalViolations: 3,
  expiringSoon: 1
};
