/**
 * City of Tallahassee PeopleSoft Seed Data
 *
 * Realistic chartfields, GL accounts, departments, funds, and projects
 * based on typical municipal government finance structure
 */

export interface TallahasseeChartfield {
  business_unit: string
  company: string
  department: string
  department_name: string
  fund: string
  fund_name: string
  account: string
  account_name: string
  operating_unit: string
  program?: string
  project_id?: string
  project_name?: string
  activity_id?: string
  is_active: boolean
}

export interface TallahasseeDepartment {
  department: string
  name: string
  director: string
  is_active: boolean
}

export interface TallahasseeFund {
  fund: string
  name: string
  type: 'GENERAL' | 'SPECIAL_REVENUE' | 'CAPITAL' | 'ENTERPRISE' | 'INTERNAL_SERVICE'
  is_active: boolean
}

export interface TallahasseeGLAccount {
  account: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'REVENUE' | 'EXPENSE' | 'EQUITY'
  category: string
  is_active: boolean
}

export interface TallahasseeProject {
  project_id: string
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED'
  budget: number
  department: string
}

// ==================== DEPARTMENTS ====================

export const TALLAHASSEE_DEPARTMENTS: TallahasseeDepartment[] = [
  {
    department: '17020',
    name: 'Fleet Services Division',
    director: 'Michael Stevens',
    is_active: true
  },
  {
    department: '17025',
    name: 'Equipment Maintenance',
    director: 'Sarah Johnson',
    is_active: true
  },
  {
    department: '17030',
    name: 'Fuel Management',
    director: 'Robert Martinez',
    is_active: true
  },
  {
    department: '11010',
    name: 'Public Works - Streets',
    director: 'James Wilson',
    is_active: true
  },
  {
    department: '11020',
    name: 'Public Works - Sanitation',
    director: 'Patricia Davis',
    is_active: true
  },
  {
    department: '12010',
    name: 'Police Department',
    director: 'Chief Lawrence Henderson',
    is_active: true
  },
  {
    department: '12020',
    name: 'Fire Department',
    director: 'Chief Angela Rodriguez',
    is_active: true
  },
  {
    department: '13010',
    name: 'Parks and Recreation',
    director: 'David Thompson',
    is_active: true
  },
  {
    department: '14010',
    name: 'Electric Utility',
    director: 'Jennifer White',
    is_active: true
  },
  {
    department: '14020',
    name: 'Water Utility',
    director: 'Christopher Brown',
    is_active: true
  },
  {
    department: '15010',
    name: 'Information Technology',
    director: 'Michelle Garcia',
    is_active: true
  },
  {
    department: '16010',
    name: 'Finance Department',
    director: 'William Taylor',
    is_active: true
  },
  {
    department: '17010',
    name: 'General Services',
    director: 'Lisa Anderson',
    is_active: true
  }
]

// ==================== FUNDS ====================

export const TALLAHASSEE_FUNDS: TallahasseeFund[] = [
  {
    fund: '001',
    name: 'General Fund',
    type: 'GENERAL',
    is_active: true
  },
  {
    fund: '002',
    name: 'Capital Projects Fund',
    type: 'CAPITAL',
    is_active: true
  },
  {
    fund: '101',
    name: 'Electric Enterprise Fund',
    type: 'ENTERPRISE',
    is_active: true
  },
  {
    fund: '102',
    name: 'Water/Sewer Enterprise Fund',
    type: 'ENTERPRISE',
    is_active: true
  },
  {
    fund: '201',
    name: 'Internal Service Fund - Fleet',
    type: 'INTERNAL_SERVICE',
    is_active: true
  },
  {
    fund: '202',
    name: 'Internal Service Fund - IT',
    type: 'INTERNAL_SERVICE',
    is_active: true
  },
  {
    fund: '301',
    name: 'Gas Tax Revenue Fund',
    type: 'SPECIAL_REVENUE',
    is_active: true
  },
  {
    fund: '302',
    name: 'Stormwater Management Fund',
    type: 'SPECIAL_REVENUE',
    is_active: true
  },
  {
    fund: '401',
    name: 'Bond Fund - Infrastructure',
    type: 'CAPITAL',
    is_active: true
  }
]

// ==================== GL ACCOUNTS ====================

export const TALLAHASSEE_GL_ACCOUNTS: TallahasseeGLAccount[] = [
  // EXPENSE ACCOUNTS (600000-699999)
  {
    account: '654110',
    name: 'Vehicle Fuel - Gasoline',
    type: 'EXPENSE',
    category: 'Fuel',
    is_active: true
  },
  {
    account: '654120',
    name: 'Vehicle Fuel - Diesel',
    type: 'EXPENSE',
    category: 'Fuel',
    is_active: true
  },
  {
    account: '654130',
    name: 'Vehicle Fuel - Alternative',
    type: 'EXPENSE',
    category: 'Fuel',
    is_active: true
  },
  {
    account: '654210',
    name: 'Vehicle Repairs & Maintenance',
    type: 'EXPENSE',
    category: 'Maintenance',
    is_active: true
  },
  {
    account: '654220',
    name: 'Vehicle Parts & Supplies',
    type: 'EXPENSE',
    category: 'Maintenance',
    is_active: true
  },
  {
    account: '654230',
    name: 'Vehicle Tires',
    type: 'EXPENSE',
    category: 'Maintenance',
    is_active: true
  },
  {
    account: '654240',
    name: 'Vehicle Preventive Maintenance',
    type: 'EXPENSE',
    category: 'Maintenance',
    is_active: true
  },
  {
    account: '654310',
    name: 'Sublet Repairs - Outside Vendors',
    type: 'EXPENSE',
    category: 'Sublet',
    is_active: true
  },
  {
    account: '654320',
    name: 'Emergency Repairs',
    type: 'EXPENSE',
    category: 'Maintenance',
    is_active: true
  },
  {
    account: '654410',
    name: 'Vehicle Registration & Licensing',
    type: 'EXPENSE',
    category: 'Administrative',
    is_active: true
  },
  {
    account: '654420',
    name: 'Vehicle Insurance',
    type: 'EXPENSE',
    category: 'Administrative',
    is_active: true
  },
  {
    account: '654510',
    name: 'Equipment Rental',
    type: 'EXPENSE',
    category: 'Equipment',
    is_active: true
  },
  {
    account: '654520',
    name: 'Heavy Equipment Repairs',
    type: 'EXPENSE',
    category: 'Equipment',
    is_active: true
  },
  {
    account: '661010',
    name: 'Fleet Personnel Salaries',
    type: 'EXPENSE',
    category: 'Personnel',
    is_active: true
  },
  {
    account: '661020',
    name: 'Fleet Personnel Benefits',
    type: 'EXPENSE',
    category: 'Personnel',
    is_active: true
  },
  {
    account: '662010',
    name: 'Operating Supplies',
    type: 'EXPENSE',
    category: 'Supplies',
    is_active: true
  },
  {
    account: '663010',
    name: 'Professional Services',
    type: 'EXPENSE',
    category: 'Services',
    is_active: true
  },

  // ASSET ACCOUNTS (100000-199999)
  {
    account: '154100',
    name: 'Vehicles - Light Duty',
    type: 'ASSET',
    category: 'Fixed Assets',
    is_active: true
  },
  {
    account: '154200',
    name: 'Vehicles - Heavy Duty',
    type: 'ASSET',
    category: 'Fixed Assets',
    is_active: true
  },
  {
    account: '154300',
    name: 'Equipment - Construction',
    type: 'ASSET',
    category: 'Fixed Assets',
    is_active: true
  },
  {
    account: '154400',
    name: 'Equipment - Public Safety',
    type: 'ASSET',
    category: 'Fixed Assets',
    is_active: true
  },

  // REVENUE ACCOUNTS (400000-499999)
  {
    account: '434100',
    name: 'Fleet Services Revenue',
    type: 'REVENUE',
    category: 'Service Revenue',
    is_active: true
  },
  {
    account: '434200',
    name: 'Fuel Sales Revenue',
    type: 'REVENUE',
    category: 'Service Revenue',
    is_active: true
  }
]

// ==================== PROJECTS ====================

export const TALLAHASSEE_PROJECTS: TallahasseeProject[] = [
  {
    project_id: 'PRJ-2026-001',
    name: 'Fleet Modernization Initiative',
    status: 'ACTIVE',
    budget: 2500000,
    department: '17020'
  },
  {
    project_id: 'PRJ-2026-002',
    name: 'EV Charging Infrastructure',
    status: 'ACTIVE',
    budget: 850000,
    department: '17020'
  },
  {
    project_id: 'PRJ-2026-003',
    name: 'Heavy Equipment Replacement',
    status: 'ACTIVE',
    budget: 1200000,
    department: '11010'
  },
  {
    project_id: 'PRJ-2025-045',
    name: 'Police Fleet Upgrade',
    status: 'ACTIVE',
    budget: 1800000,
    department: '12010'
  },
  {
    project_id: 'PRJ-2025-046',
    name: 'Fire Apparatus Replacement',
    status: 'ACTIVE',
    budget: 2200000,
    department: '12020'
  },
  {
    project_id: 'PRJ-2026-004',
    name: 'Fuel System Upgrade',
    status: 'PLANNED',
    budget: 450000,
    department: '17030'
  },
  {
    project_id: 'PRJ-2025-032',
    name: 'Sanitation Fleet Replacement',
    status: 'ACTIVE',
    budget: 3500000,
    department: '11020'
  },
  {
    project_id: 'PRJ-2026-005',
    name: 'Telematics System Implementation',
    status: 'ACTIVE',
    budget: 180000,
    department: '17020'
  }
]

// ==================== VALID CHARTFIELD COMBINATIONS ====================

export const TALLAHASSEE_CHARTFIELDS: TallahasseeChartfield[] = [
  // Fleet Services - General Fund
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '001',
    fund_name: 'General Fund',
    account: '654120',
    account_name: 'Vehicle Fuel - Diesel',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '001',
    fund_name: 'General Fund',
    account: '654110',
    account_name: 'Vehicle Fuel - Gasoline',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654220',
    account_name: 'Vehicle Parts & Supplies',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654310',
    account_name: 'Sublet Repairs - Outside Vendors',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },

  // Fleet Services - Capital Projects with Project IDs
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '002',
    fund_name: 'Capital Projects Fund',
    account: '154100',
    account_name: 'Vehicles - Light Duty',
    operating_unit: 'FLEET',
    program: 'FLEET_CAP',
    project_id: 'PRJ-2026-001',
    project_name: 'Fleet Modernization Initiative',
    activity_id: 'A001',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17020',
    department_name: 'Fleet Services Division',
    fund: '002',
    fund_name: 'Capital Projects Fund',
    account: '154200',
    account_name: 'Vehicles - Heavy Duty',
    operating_unit: 'FLEET',
    program: 'FLEET_CAP',
    project_id: 'PRJ-2026-001',
    project_name: 'Fleet Modernization Initiative',
    activity_id: 'A002',
    is_active: true
  },

  // Equipment Maintenance
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17025',
    department_name: 'Equipment Maintenance',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654240',
    account_name: 'Vehicle Preventive Maintenance',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17025',
    department_name: 'Equipment Maintenance',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654520',
    account_name: 'Heavy Equipment Repairs',
    operating_unit: 'FLEET',
    program: 'FLEET_OPS',
    is_active: true
  },

  // Fuel Management
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17030',
    department_name: 'Fuel Management',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654120',
    account_name: 'Vehicle Fuel - Diesel',
    operating_unit: 'FLEET',
    program: 'FUEL_MGT',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FLEET',
    department: '17030',
    department_name: 'Fuel Management',
    fund: '201',
    fund_name: 'Internal Service Fund - Fleet',
    account: '654110',
    account_name: 'Vehicle Fuel - Gasoline',
    operating_unit: 'FLEET',
    program: 'FUEL_MGT',
    is_active: true
  },

  // Public Works - Streets
  {
    business_unit: 'CITY_TALLY',
    company: 'PUBWRKS',
    department: '11010',
    department_name: 'Public Works - Streets',
    fund: '301',
    fund_name: 'Gas Tax Revenue Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'STREETS',
    program: 'STREET_MAINT',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'PUBWRKS',
    department: '11010',
    department_name: 'Public Works - Streets',
    fund: '002',
    fund_name: 'Capital Projects Fund',
    account: '154300',
    account_name: 'Equipment - Construction',
    operating_unit: 'STREETS',
    program: 'STREET_CAP',
    project_id: 'PRJ-2026-003',
    project_name: 'Heavy Equipment Replacement',
    activity_id: 'A010',
    is_active: true
  },

  // Public Works - Sanitation
  {
    business_unit: 'CITY_TALLY',
    company: 'PUBWRKS',
    department: '11020',
    department_name: 'Public Works - Sanitation',
    fund: '001',
    fund_name: 'General Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'SANITATION',
    program: 'SANIT_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'PUBWRKS',
    department: '11020',
    department_name: 'Public Works - Sanitation',
    fund: '002',
    fund_name: 'Capital Projects Fund',
    account: '154200',
    account_name: 'Vehicles - Heavy Duty',
    operating_unit: 'SANITATION',
    program: 'SANIT_CAP',
    project_id: 'PRJ-2025-032',
    project_name: 'Sanitation Fleet Replacement',
    activity_id: 'A020',
    is_active: true
  },

  // Police Department
  {
    business_unit: 'CITY_TALLY',
    company: 'POLICE',
    department: '12010',
    department_name: 'Police Department',
    fund: '001',
    fund_name: 'General Fund',
    account: '654110',
    account_name: 'Vehicle Fuel - Gasoline',
    operating_unit: 'POLICE',
    program: 'POLICE_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'POLICE',
    department: '12010',
    department_name: 'Police Department',
    fund: '001',
    fund_name: 'General Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'POLICE',
    program: 'POLICE_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'POLICE',
    department: '12010',
    department_name: 'Police Department',
    fund: '002',
    fund_name: 'Capital Projects Fund',
    account: '154400',
    account_name: 'Equipment - Public Safety',
    operating_unit: 'POLICE',
    program: 'POLICE_CAP',
    project_id: 'PRJ-2025-045',
    project_name: 'Police Fleet Upgrade',
    activity_id: 'A030',
    is_active: true
  },

  // Fire Department
  {
    business_unit: 'CITY_TALLY',
    company: 'FIRE',
    department: '12020',
    department_name: 'Fire Department',
    fund: '001',
    fund_name: 'General Fund',
    account: '654120',
    account_name: 'Vehicle Fuel - Diesel',
    operating_unit: 'FIRE',
    program: 'FIRE_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FIRE',
    department: '12020',
    department_name: 'Fire Department',
    fund: '001',
    fund_name: 'General Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'FIRE',
    program: 'FIRE_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'FIRE',
    department: '12020',
    department_name: 'Fire Department',
    fund: '002',
    fund_name: 'Capital Projects Fund',
    account: '154400',
    account_name: 'Equipment - Public Safety',
    operating_unit: 'FIRE',
    program: 'FIRE_CAP',
    project_id: 'PRJ-2025-046',
    project_name: 'Fire Apparatus Replacement',
    activity_id: 'A040',
    is_active: true
  },

  // Parks and Recreation
  {
    business_unit: 'CITY_TALLY',
    company: 'PARKS',
    department: '13010',
    department_name: 'Parks and Recreation',
    fund: '001',
    fund_name: 'General Fund',
    account: '654110',
    account_name: 'Vehicle Fuel - Gasoline',
    operating_unit: 'PARKS',
    program: 'PARKS_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'PARKS',
    department: '13010',
    department_name: 'Parks and Recreation',
    fund: '001',
    fund_name: 'General Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'PARKS',
    program: 'PARKS_OPS',
    is_active: true
  },

  // Electric Utility
  {
    business_unit: 'CITY_TALLY',
    company: 'UTILITY',
    department: '14010',
    department_name: 'Electric Utility',
    fund: '101',
    fund_name: 'Electric Enterprise Fund',
    account: '654120',
    account_name: 'Vehicle Fuel - Diesel',
    operating_unit: 'ELECTRIC',
    program: 'ELEC_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'UTILITY',
    department: '14010',
    department_name: 'Electric Utility',
    fund: '101',
    fund_name: 'Electric Enterprise Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'ELECTRIC',
    program: 'ELEC_OPS',
    is_active: true
  },

  // Water Utility
  {
    business_unit: 'CITY_TALLY',
    company: 'UTILITY',
    department: '14020',
    department_name: 'Water Utility',
    fund: '102',
    fund_name: 'Water/Sewer Enterprise Fund',
    account: '654120',
    account_name: 'Vehicle Fuel - Diesel',
    operating_unit: 'WATER',
    program: 'WATER_OPS',
    is_active: true
  },
  {
    business_unit: 'CITY_TALLY',
    company: 'UTILITY',
    department: '14020',
    department_name: 'Water Utility',
    fund: '102',
    fund_name: 'Water/Sewer Enterprise Fund',
    account: '654210',
    account_name: 'Vehicle Repairs & Maintenance',
    operating_unit: 'WATER',
    program: 'WATER_OPS',
    is_active: true
  }
]
