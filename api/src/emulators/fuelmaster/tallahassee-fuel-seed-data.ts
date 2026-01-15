/**
 * City of Tallahassee FuelMaster Seed Data
 *
 * Realistic fuel sites, tanks, hoses, products, vehicles, and transactions
 * based on typical municipal fleet fueling infrastructure
 */

import { FuelSite, FuelTank, FuelHose, FuelProduct, FuelMasterVehicle, FuelTransaction } from './FuelMasterEmulator'

// ==================== FUEL SITES ====================

export const TALLAHASSEE_FUEL_SITES: FuelSite[] = [
  {
    site_id: 'MAIN_YARD',
    name: 'Main Fleet Maintenance Yard',
    address: '2602 Jackson Bluff Road, Tallahassee, FL 32304',
    is_active: true
  },
  {
    site_id: 'POLICE_HQ',
    name: 'Police Headquarters Fuel Station',
    address: '234 E 7th Avenue, Tallahassee, FL 32303',
    is_active: true
  },
  {
    site_id: 'FIRE_STATION_1',
    name: 'Fire Station #1 Fuel Depot',
    address: '116 N Duval Street, Tallahassee, FL 32301',
    is_active: true
  },
  {
    site_id: 'SOUTHSIDE_DEPOT',
    name: 'Southside Public Works Depot',
    address: '1940 Fleischmann Road, Tallahassee, FL 32308',
    is_active: true
  },
  {
    site_id: 'UTILITY_COMPLEX',
    name: 'Electric/Water Utility Complex',
    address: '2602 W Pensacola Street, Tallahassee, FL 32304',
    is_active: true
  }
]

// ==================== FUEL PRODUCTS ====================

export const TALLAHASSEE_FUEL_PRODUCTS: FuelProduct[] = [
  {
    product_id: 10,
    code: 'RUL87',
    description: 'Regular Unleaded 87 Octane (E10)',
    group_code: 'GASOLINE',
    unit: 'GALLON',
    default_unit_cost: 2.89
  },
  {
    product_id: 11,
    code: 'RUL89',
    description: 'Mid-Grade Unleaded 89 Octane',
    group_code: 'GASOLINE',
    unit: 'GALLON',
    default_unit_cost: 3.12
  },
  {
    product_id: 12,
    code: 'ULSD',
    description: 'Ultra Low Sulfur Diesel #2',
    group_code: 'DIESEL',
    unit: 'GALLON',
    default_unit_cost: 3.45
  },
  {
    product_id: 13,
    code: 'BIODIESEL_B20',
    description: 'B20 Biodiesel Blend',
    group_code: 'DIESEL',
    unit: 'GALLON',
    default_unit_cost: 3.62
  },
  {
    product_id: 14,
    code: 'DEF',
    description: 'Diesel Exhaust Fluid (DEF)',
    group_code: 'DEF',
    unit: 'GALLON',
    default_unit_cost: 2.45
  },
  {
    product_id: 15,
    code: 'E85',
    description: 'E85 Ethanol Fuel',
    group_code: 'ALTERNATIVE',
    unit: 'GALLON',
    default_unit_cost: 2.34
  },
  {
    product_id: 16,
    code: 'CNG',
    description: 'Compressed Natural Gas',
    group_code: 'ALTERNATIVE',
    unit: 'GGE',
    default_unit_cost: 2.12
  }
]

// ==================== FUEL TANKS ====================

export const TALLAHASSEE_FUEL_TANKS: FuelTank[] = [
  // Main Yard Tanks
  {
    tank_id: 101,
    site_id: 'MAIN_YARD',
    product_id: 12, // ULSD
    capacity_gallons: 15000,
    current_gallons: 8234
  },
  {
    tank_id: 102,
    site_id: 'MAIN_YARD',
    product_id: 10, // RUL87
    capacity_gallons: 12000,
    current_gallons: 5678
  },
  {
    tank_id: 103,
    site_id: 'MAIN_YARD',
    product_id: 14, // DEF
    capacity_gallons: 2000,
    current_gallons: 892
  },
  {
    tank_id: 104,
    site_id: 'MAIN_YARD',
    product_id: 13, // B20
    capacity_gallons: 8000,
    current_gallons: 3456
  },

  // Police HQ Tanks
  {
    tank_id: 201,
    site_id: 'POLICE_HQ',
    product_id: 10, // RUL87
    capacity_gallons: 8000,
    current_gallons: 4123
  },
  {
    tank_id: 202,
    site_id: 'POLICE_HQ',
    product_id: 11, // RUL89
    capacity_gallons: 4000,
    current_gallons: 1890
  },
  {
    tank_id: 203,
    site_id: 'POLICE_HQ',
    product_id: 15, // E85
    capacity_gallons: 3000,
    current_gallons: 967
  },

  // Fire Station #1 Tanks
  {
    tank_id: 301,
    site_id: 'FIRE_STATION_1',
    product_id: 12, // ULSD
    capacity_gallons: 6000,
    current_gallons: 3234
  },
  {
    tank_id: 302,
    site_id: 'FIRE_STATION_1',
    product_id: 10, // RUL87
    capacity_gallons: 4000,
    current_gallons: 2145
  },

  // Southside Depot Tanks
  {
    tank_id: 401,
    site_id: 'SOUTHSIDE_DEPOT',
    product_id: 12, // ULSD
    capacity_gallons: 12000,
    current_gallons: 6789
  },
  {
    tank_id: 402,
    site_id: 'SOUTHSIDE_DEPOT',
    product_id: 10, // RUL87
    capacity_gallons: 8000,
    current_gallons: 4321
  },
  {
    tank_id: 403,
    site_id: 'SOUTHSIDE_DEPOT',
    product_id: 14, // DEF
    capacity_gallons: 1500,
    current_gallons: 678
  },

  // Utility Complex Tanks
  {
    tank_id: 501,
    site_id: 'UTILITY_COMPLEX',
    product_id: 12, // ULSD
    capacity_gallons: 20000,
    current_gallons: 12456
  },
  {
    tank_id: 502,
    site_id: 'UTILITY_COMPLEX',
    product_id: 13, // B20
    capacity_gallons: 10000,
    current_gallons: 5234
  },
  {
    tank_id: 503,
    site_id: 'UTILITY_COMPLEX',
    product_id: 10, // RUL87
    capacity_gallons: 6000,
    current_gallons: 2987
  }
]

// ==================== FUEL HOSES ====================

export const TALLAHASSEE_FUEL_HOSES: FuelHose[] = [
  // Main Yard Hoses
  { site_id: 'MAIN_YARD', tank_id: 101, hose_id: 1, hose_code: 'MY-D1', product_id: 12, meter_reading: 245678.4, is_active: true },
  { site_id: 'MAIN_YARD', tank_id: 101, hose_id: 2, hose_code: 'MY-D2', product_id: 12, meter_reading: 234567.2, is_active: true },
  { site_id: 'MAIN_YARD', tank_id: 102, hose_id: 3, hose_code: 'MY-G1', product_id: 10, meter_reading: 189234.8, is_active: true },
  { site_id: 'MAIN_YARD', tank_id: 102, hose_id: 4, hose_code: 'MY-G2', product_id: 10, meter_reading: 176543.1, is_active: true },
  { site_id: 'MAIN_YARD', tank_id: 103, hose_id: 5, hose_code: 'MY-DEF1', product_id: 14, meter_reading: 34567.3, is_active: true },
  { site_id: 'MAIN_YARD', tank_id: 104, hose_id: 6, hose_code: 'MY-B20', product_id: 13, meter_reading: 98765.9, is_active: true },

  // Police HQ Hoses
  { site_id: 'POLICE_HQ', tank_id: 201, hose_id: 7, hose_code: 'PD-G1', product_id: 10, meter_reading: 156789.2, is_active: true },
  { site_id: 'POLICE_HQ', tank_id: 201, hose_id: 8, hose_code: 'PD-G2', product_id: 10, meter_reading: 145678.5, is_active: true },
  { site_id: 'POLICE_HQ', tank_id: 202, hose_id: 9, hose_code: 'PD-P1', product_id: 11, meter_reading: 67890.4, is_active: true },
  { site_id: 'POLICE_HQ', tank_id: 203, hose_id: 10, hose_code: 'PD-E85', product_id: 15, meter_reading: 45678.7, is_active: true },

  // Fire Station #1 Hoses
  { site_id: 'FIRE_STATION_1', tank_id: 301, hose_id: 11, hose_code: 'FD-D1', product_id: 12, meter_reading: 234567.8, is_active: true },
  { site_id: 'FIRE_STATION_1', tank_id: 302, hose_id: 12, hose_code: 'FD-G1', product_id: 10, meter_reading: 123456.3, is_active: true },

  // Southside Depot Hoses
  { site_id: 'SOUTHSIDE_DEPOT', tank_id: 401, hose_id: 13, hose_code: 'SS-D1', product_id: 12, meter_reading: 298765.1, is_active: true },
  { site_id: 'SOUTHSIDE_DEPOT', tank_id: 401, hose_id: 14, hose_code: 'SS-D2', product_id: 12, meter_reading: 287654.9, is_active: true },
  { site_id: 'SOUTHSIDE_DEPOT', tank_id: 402, hose_id: 15, hose_code: 'SS-G1', product_id: 10, meter_reading: 198765.4, is_active: true },
  { site_id: 'SOUTHSIDE_DEPOT', tank_id: 403, hose_id: 16, hose_code: 'SS-DEF1', product_id: 14, meter_reading: 23456.8, is_active: true },

  // Utility Complex Hoses
  { site_id: 'UTILITY_COMPLEX', tank_id: 501, hose_id: 17, hose_code: 'UC-D1', product_id: 12, meter_reading: 456789.2, is_active: true },
  { site_id: 'UTILITY_COMPLEX', tank_id: 501, hose_id: 18, hose_code: 'UC-D2', product_id: 12, meter_reading: 445678.1, is_active: true },
  { site_id: 'UTILITY_COMPLEX', tank_id: 501, hose_id: 19, hose_code: 'UC-D3', product_id: 12, meter_reading: 434567.9, is_active: true },
  { site_id: 'UTILITY_COMPLEX', tank_id: 502, hose_id: 20, hose_code: 'UC-B20', product_id: 13, meter_reading: 167890.3, is_active: true },
  { site_id: 'UTILITY_COMPLEX', tank_id: 503, hose_id: 21, hose_code: 'UC-G1', product_id: 10, meter_reading: 134567.5, is_active: true }
]

// ==================== FLEET VEHICLES ====================

export const TALLAHASSEE_FLEET_VEHICLES: FuelMasterVehicle[] = [
  // Fleet Services Vehicles
  { fuelmaster_vehicle_id: 'FM-10001', vehicle_tag: '1001', status: 'ACTIVE', linked_equipment_key: 'E-10001', linked_ams_equipment_id: 10001, last_odometer: 45678 },
  { fuelmaster_vehicle_id: 'FM-10002', vehicle_tag: '1002', status: 'ACTIVE', linked_equipment_key: 'E-10002', linked_ams_equipment_id: 10002, last_odometer: 52341 },
  { fuelmaster_vehicle_id: 'FM-10003', vehicle_tag: '1003', status: 'ACTIVE', linked_equipment_key: 'E-10003', linked_ams_equipment_id: 10003, last_odometer: 38912 },

  // Police Vehicles (Patrol Cars)
  { fuelmaster_vehicle_id: 'FM-12001', vehicle_tag: 'PD-101', status: 'ACTIVE', linked_equipment_key: 'E-12001', linked_ams_equipment_id: 12001, last_odometer: 67890 },
  { fuelmaster_vehicle_id: 'FM-12002', vehicle_tag: 'PD-102', status: 'ACTIVE', linked_equipment_key: 'E-12002', linked_ams_equipment_id: 12002, last_odometer: 72345 },
  { fuelmaster_vehicle_id: 'FM-12003', vehicle_tag: 'PD-103', status: 'ACTIVE', linked_equipment_key: 'E-12003', linked_ams_equipment_id: 12003, last_odometer: 58901 },
  { fuelmaster_vehicle_id: 'FM-12004', vehicle_tag: 'PD-104', status: 'ACTIVE', linked_equipment_key: 'E-12004', linked_ams_equipment_id: 12004, last_odometer: 81234 },
  { fuelmaster_vehicle_id: 'FM-12005', vehicle_tag: 'PD-105', status: 'ACTIVE', linked_equipment_key: 'E-12005', linked_ams_equipment_id: 12005, last_odometer: 43567 },

  // Fire Apparatus
  { fuelmaster_vehicle_id: 'FM-12101', vehicle_tag: 'E-1', status: 'ACTIVE', linked_equipment_key: 'E-12101', linked_ams_equipment_id: 12101, last_odometer: 12345 },
  { fuelmaster_vehicle_id: 'FM-12102', vehicle_tag: 'E-2', status: 'ACTIVE', linked_equipment_key: 'E-12102', linked_ams_equipment_id: 12102, last_odometer: 15678 },
  { fuelmaster_vehicle_id: 'FM-12103', vehicle_tag: 'L-1', status: 'ACTIVE', linked_equipment_key: 'E-12103', linked_ams_equipment_id: 12103, last_odometer: 9234 },
  { fuelmaster_vehicle_id: 'FM-12104', vehicle_tag: 'R-1', status: 'ACTIVE', linked_equipment_key: 'E-12104', linked_ams_equipment_id: 12104, last_odometer: 21456 },

  // Public Works - Streets (Heavy Equipment)
  { fuelmaster_vehicle_id: 'FM-11001', vehicle_tag: 'PW-101', status: 'ACTIVE', linked_equipment_key: 'E-11001', linked_ams_equipment_id: 11001, last_odometer: 3456 },
  { fuelmaster_vehicle_id: 'FM-11002', vehicle_tag: 'PW-102', status: 'ACTIVE', linked_equipment_key: 'E-11002', linked_ams_equipment_id: 11002, last_odometer: 4567 },
  { fuelmaster_vehicle_id: 'FM-11003', vehicle_tag: 'PW-103', status: 'ACTIVE', linked_equipment_key: 'E-11003', linked_ams_equipment_id: 11003, last_odometer: 2789 },
  { fuelmaster_vehicle_id: 'FM-11004', vehicle_tag: 'PW-104', status: 'ACTIVE', linked_equipment_key: 'E-11004', linked_ams_equipment_id: 11004, last_odometer: 5678 },

  // Public Works - Sanitation
  { fuelmaster_vehicle_id: 'FM-11101', vehicle_tag: 'SAN-201', status: 'ACTIVE', linked_equipment_key: 'E-11101', linked_ams_equipment_id: 11101, last_odometer: 45678 },
  { fuelmaster_vehicle_id: 'FM-11102', vehicle_tag: 'SAN-202', status: 'ACTIVE', linked_equipment_key: 'E-11102', linked_ams_equipment_id: 11102, last_odometer: 43210 },
  { fuelmaster_vehicle_id: 'FM-11103', vehicle_tag: 'SAN-203', status: 'ACTIVE', linked_equipment_key: 'E-11103', linked_ams_equipment_id: 11103, last_odometer: 51234 },
  { fuelmaster_vehicle_id: 'FM-11104', vehicle_tag: 'SAN-204', status: 'ACTIVE', linked_equipment_key: 'E-11104', linked_ams_equipment_id: 11104, last_odometer: 38901 },

  // Parks & Recreation
  { fuelmaster_vehicle_id: 'FM-13001', vehicle_tag: 'PRK-301', status: 'ACTIVE', linked_equipment_key: 'E-13001', linked_ams_equipment_id: 13001, last_odometer: 23456 },
  { fuelmaster_vehicle_id: 'FM-13002', vehicle_tag: 'PRK-302', status: 'ACTIVE', linked_equipment_key: 'E-13002', linked_ams_equipment_id: 13002, last_odometer: 19876 },
  { fuelmaster_vehicle_id: 'FM-13003', vehicle_tag: 'PRK-303', status: 'ACTIVE', linked_equipment_key: 'E-13003', linked_ams_equipment_id: 13003, last_odometer: 31245 },

  // Electric Utility
  { fuelmaster_vehicle_id: 'FM-14001', vehicle_tag: 'ELEC-401', status: 'ACTIVE', linked_equipment_key: 'E-14001', linked_ams_equipment_id: 14001, last_odometer: 56789 },
  { fuelmaster_vehicle_id: 'FM-14002', vehicle_tag: 'ELEC-402', status: 'ACTIVE', linked_equipment_key: 'E-14002', linked_ams_equipment_id: 14002, last_odometer: 48765 },
  { fuelmaster_vehicle_id: 'FM-14003', vehicle_tag: 'ELEC-403', status: 'ACTIVE', linked_equipment_key: 'E-14003', linked_ams_equipment_id: 14003, last_odometer: 62341 },
  { fuelmaster_vehicle_id: 'FM-14004', vehicle_tag: 'ELEC-404', status: 'ACTIVE', linked_equipment_key: 'E-14004', linked_ams_equipment_id: 14004, last_odometer: 39876 },

  // Water Utility
  { fuelmaster_vehicle_id: 'FM-14101', vehicle_tag: 'WTR-501', status: 'ACTIVE', linked_equipment_key: 'E-14101', linked_ams_equipment_id: 14101, last_odometer: 44567 },
  { fuelmaster_vehicle_id: 'FM-14102', vehicle_tag: 'WTR-502', status: 'ACTIVE', linked_equipment_key: 'E-14102', linked_ams_equipment_id: 14102, last_odometer: 51890 },
  { fuelmaster_vehicle_id: 'FM-14103', vehicle_tag: 'WTR-503', status: 'ACTIVE', linked_equipment_key: 'E-14103', linked_ams_equipment_id: 14103, last_odometer: 37654 },

  // Unmapped Test Vehicle
  { fuelmaster_vehicle_id: 'FM-99999', vehicle_tag: 'UNMAPPED', status: 'ACTIVE' }
]

// ==================== SAMPLE TRANSACTIONS ====================

/**
 * Generate realistic fuel transactions for the past 30 days
 */
export function generateSampleTransactions(count: number = 500): FuelTransaction[] {
  const transactions: FuelTransaction[] = []
  const now = new Date()

  // Transaction patterns by vehicle type
  const vehiclePatterns = {
    police: { avgGallons: 12, frequency: 2 }, // 2x per week
    fire: { avgGallons: 45, frequency: 1 }, // 1x per week
    sanitation: { avgGallons: 35, frequency: 1 }, // 1x per week
    utility: { avgGallons: 28, frequency: 1.5 }, // 1.5x per week
    admin: { avgGallons: 15, frequency: 1 } // 1x per week
  }

  let txCounter = 1

  // Generate transactions for last 30 days
  for (let day = 30; day >= 0; day--) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)

    // Generate transactions for this day
    TALLAHASSEE_FLEET_VEHICLES.forEach(vehicle => {
      if (vehicle.fuelmaster_vehicle_id === 'FM-99999') return // Skip unmapped

      // Determine vehicle type and pattern
      let pattern = vehiclePatterns.admin
      let siteId = 'MAIN_YARD'
      let tankId = 102
      let hoseId = 3
      let productId = 10

      if (vehicle.vehicle_tag.startsWith('PD-')) {
        pattern = vehiclePatterns.police
        siteId = 'POLICE_HQ'
        tankId = 201
        hoseId = 7
        productId = 10
      } else if (vehicle.vehicle_tag.startsWith('E-') || vehicle.vehicle_tag.startsWith('L-') || vehicle.vehicle_tag.startsWith('R-')) {
        pattern = vehiclePatterns.fire
        siteId = 'FIRE_STATION_1'
        tankId = 301
        hoseId = 11
        productId = 12
      } else if (vehicle.vehicle_tag.startsWith('SAN-')) {
        pattern = vehiclePatterns.sanitation
        siteId = 'SOUTHSIDE_DEPOT'
        tankId = 401
        hoseId = 13
        productId = 12
      } else if (vehicle.vehicle_tag.startsWith('ELEC-') || vehicle.vehicle_tag.startsWith('WTR-')) {
        pattern = vehiclePatterns.utility
        siteId = 'UTILITY_COMPLEX'
        tankId = 501
        hoseId = 17
        productId = 12
      } else if (vehicle.vehicle_tag.startsWith('PW-')) {
        pattern = vehiclePatterns.admin
        siteId = 'SOUTHSIDE_DEPOT'
        tankId = 401
        hoseId = 13
        productId = 12
      }

      // Random chance of fueling based on frequency
      if (Math.random() < (pattern.frequency / 7)) {
        const product = TALLAHASSEE_FUEL_PRODUCTS.find(p => p.product_id === productId)!
        const quantity = pattern.avgGallons + (Math.random() * 10 - 5) // +/- 5 gallons
        const odometer = vehicle.last_odometer! + Math.floor(Math.random() * 500)

        const tx: FuelTransaction = {
          transaction_id: `TX-${String(txCounter++).padStart(6, '0')}`,
          site_id: siteId,
          tank_id: tankId,
          hose_id: hoseId,
          product_id: productId,
          fuelmaster_vehicle_id: vehicle.fuelmaster_vehicle_id,
          driver_id: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
          odometer,
          engine_hours: Math.random() * 1000,
          quantity: Math.round(quantity * 10) / 10,
          unit_cost: product.default_unit_cost,
          total_cost: Math.round(quantity * product.default_unit_cost * 100) / 100,
          transaction_time: new Date(date.setHours(
            Math.floor(Math.random() * 16) + 6, // 6 AM to 10 PM
            Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 60)
          )).toISOString(),
          is_voided: false
        }

        transactions.push(tx)
        vehicle.last_odometer = odometer
      }
    })
  }

  return transactions
}
