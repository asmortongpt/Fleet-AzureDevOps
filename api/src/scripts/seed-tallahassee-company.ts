#!/usr/bin/env node
/**
 * TALLAHASSEE SMALL COMPANY SEED DATA
 * Comprehensive seed for "Capital City Courier Services" - a small fleet company in Tallahassee, FL
 * Populates ALL database tables with realistic, production-ready data
 */

import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/fleet_dev';

// ============================================================================
// TALLAHASSEE GEOGRAPHIC DATA
// ============================================================================
const TALLAHASSEE = {
  center: { lat: 30.4383, lng: -84.2807 },
  bounds: { north: 30.55, south: 30.35, east: -84.15, west: -84.40 }
};

// Real Tallahassee locations
const TALLAHASSEE_LOCATIONS = {
  downtown: { lat: 30.4383, lng: -84.2807, address: '101 S Monroe St, Tallahassee, FL 32301' },
  fsuCampus: { lat: 30.4419, lng: -84.2985, address: '600 W College Ave, Tallahassee, FL 32306' },
  famuCampus: { lat: 30.4255, lng: -84.2839, address: '1601 S Martin Luther King Jr Blvd, Tallahassee, FL 32307' },
  tallahasseeAirport: { lat: 30.3965, lng: -84.3503, address: '3300 Capital Cir SW, Tallahassee, FL 32310' },
  governorsSquareMall: { lat: 30.4769, lng: -84.2258, address: '1500 Apalachee Pkwy, Tallahassee, FL 32301' },
  capitalCircleNE: { lat: 30.4847, lng: -84.2347, address: '2415 N Monroe St, Tallahassee, FL 32303' },
  killearnEstates: { lat: 30.5156, lng: -84.2089, address: '3521 Thomasville Rd, Tallahassee, FL 32309' },
  southwoodTownCenter: { lat: 30.4089, lng: -84.2156, address: '3122 Capital Cir SE, Tallahassee, FL 32311' },
  lakeBradford: { lat: 30.4156, lng: -84.3089, address: '1600 Lake Bradford Rd, Tallahassee, FL 32304' },
  midtownDistrict: { lat: 30.4567, lng: -84.2734, address: '1122 Thomasville Rd, Tallahassee, FL 32303' }
};

// Nearby Florida cities for routes
const NEARBY_CITIES = {
  jacksonville: { lat: 30.3322, lng: -81.6557, distance: 164 },
  gainesville: { lat: 29.6516, lng: -82.3248, distance: 145 },
  panama_city: { lat: 30.1588, lng: -85.6602, distance: 98 },
  pensacola: { lat: 30.4213, lng: -87.2169, distance: 196 },
  valdosta_ga: { lat: 30.8327, lng: -83.2785, distance: 78 },
  thomasville_ga: { lat: 30.8366, lng: -83.9788, distance: 35 }
};

// ============================================================================
// COMPANY INFORMATION
// ============================================================================
const COMPANY = {
  name: 'Capital City Courier Services',
  slug: 'capital-city-courier',
  domain: 'capitalcitycourier.com',
  address: '2847 Industrial Plaza Dr, Tallahassee, FL 32310',
  phone: '850-555-0100',
  email: 'dispatch@capitalcitycourier.com',
  taxId: '59-3847291',
  founded: '2018-03-15',
  employeeCount: 28,
  vehicleCount: 15
};

// ============================================================================
// REALISTIC EMPLOYEE DATA
// ============================================================================
const EMPLOYEES = [
  // Management
  { firstName: 'Marcus', lastName: 'Washington', role: 'SuperAdmin', email: 'marcus.washington', phone: '850-555-0101', title: 'Owner/CEO' },
  { firstName: 'Patricia', lastName: 'Chen', role: 'Admin', email: 'patricia.chen', phone: '850-555-0102', title: 'Operations Manager' },
  { firstName: 'Robert', lastName: 'Martinez', role: 'Manager', email: 'robert.martinez', phone: '850-555-0103', title: 'Fleet Manager' },

  // Supervisors
  { firstName: 'Angela', lastName: 'Thompson', role: 'Supervisor', email: 'angela.thompson', phone: '850-555-0104', title: 'Dispatch Supervisor' },
  { firstName: 'David', lastName: 'Jackson', role: 'Supervisor', email: 'david.jackson', phone: '850-555-0105', title: 'Maintenance Supervisor' },

  // Dispatchers
  { firstName: 'Jennifer', lastName: 'Williams', role: 'Dispatcher', email: 'jennifer.williams', phone: '850-555-0106', title: 'Senior Dispatcher' },
  { firstName: 'Michael', lastName: 'Brown', role: 'Dispatcher', email: 'michael.brown', phone: '850-555-0107', title: 'Dispatcher' },

  // Mechanics
  { firstName: 'Carlos', lastName: 'Rodriguez', role: 'Mechanic', email: 'carlos.rodriguez', phone: '850-555-0108', title: 'Lead Mechanic' },
  { firstName: 'James', lastName: 'Davis', role: 'Mechanic', email: 'james.davis', phone: '850-555-0109', title: 'Mechanic' },

  // Drivers
  { firstName: 'William', lastName: 'Johnson', role: 'Driver', email: 'william.johnson', phone: '850-555-0110', title: 'Senior Driver', cdl: true, cdlClass: 'A' },
  { firstName: 'Christopher', lastName: 'Moore', role: 'Driver', email: 'christopher.moore', phone: '850-555-0111', title: 'Driver', cdl: true, cdlClass: 'B' },
  { firstName: 'Daniel', lastName: 'Taylor', role: 'Driver', email: 'daniel.taylor', phone: '850-555-0112', title: 'Driver', cdl: false },
  { firstName: 'Matthew', lastName: 'Anderson', role: 'Driver', email: 'matthew.anderson', phone: '850-555-0113', title: 'Driver', cdl: true, cdlClass: 'B' },
  { firstName: 'Anthony', lastName: 'Thomas', role: 'Driver', email: 'anthony.thomas', phone: '850-555-0114', title: 'Driver', cdl: false },
  { firstName: 'Joshua', lastName: 'White', role: 'Driver', email: 'joshua.white', phone: '850-555-0115', title: 'Driver', cdl: true, cdlClass: 'A' },
  { firstName: 'Andrew', lastName: 'Harris', role: 'Driver', email: 'andrew.harris', phone: '850-555-0116', title: 'Driver', cdl: false },
  { firstName: 'Joseph', lastName: 'Martin', role: 'Driver', email: 'joseph.martin', phone: '850-555-0117', title: 'Driver', cdl: true, cdlClass: 'B' },
  { firstName: 'Ryan', lastName: 'Garcia', role: 'Driver', email: 'ryan.garcia', phone: '850-555-0118', title: 'Driver', cdl: false },
  { firstName: 'Brandon', lastName: 'Clark', role: 'Driver', email: 'brandon.clark', phone: '850-555-0119', title: 'Part-Time Driver', cdl: false },

  // Viewers/Admin Staff
  { firstName: 'Sarah', lastName: 'Lewis', role: 'Viewer', email: 'sarah.lewis', phone: '850-555-0120', title: 'Accounting Clerk' },
  { firstName: 'Emily', lastName: 'Walker', role: 'Viewer', email: 'emily.walker', phone: '850-555-0121', title: 'HR Assistant' }
];

// ============================================================================
// VEHICLE FLEET DATA WITH SKETCHFAB 3D MODELS
// ============================================================================
const VEHICLES = [
  // Delivery Vans
  {
    number: 'CCC-001', make: 'Ford', model: 'Transit', year: 2023, type: 'van',
    vin: '1FTBW2CM5NKA12345', plate: 'FLCC001', fuelType: 'gasoline',
    color: 'White', purchasePrice: 42500, odometer: 28450,
    sketchfabUrl: 'https://sketchfab.com/3d-models/ford-transit-custom-double-cargo-van-8d2529f41c7d4404881f6c4014d4f04c',
    model3dUrl: '/models/vehicles/vans/ford_transit.glb'
  },
  {
    number: 'CCC-002', make: 'Ford', model: 'Transit', year: 2022, type: 'van',
    vin: '1FTBW2CM7MKA23456', plate: 'FLCC002', fuelType: 'gasoline',
    color: 'White', purchasePrice: 41200, odometer: 45230,
    sketchfabUrl: 'https://sketchfab.com/3d-models/ford-transit-custom-double-cargo-van-8d2529f41c7d4404881f6c4014d4f04c',
    model3dUrl: '/models/vehicles/vans/ford_transit.glb'
  },
  {
    number: 'CCC-003', make: 'Mercedes-Benz', model: 'Sprinter', year: 2023, type: 'van',
    vin: 'WD3PE7CD5NP345678', plate: 'FLCC003', fuelType: 'diesel',
    color: 'White', purchasePrice: 52800, odometer: 18920,
    sketchfabUrl: 'https://sketchfab.com/3d-models/mercedes-benz-sprinter-152f62800be34652af0545487129ca2e',
    model3dUrl: '/models/vehicles/vans/mercedes_benz_sprinter.glb'
  },
  {
    number: 'CCC-004', make: 'Ram', model: 'ProMaster', year: 2022, type: 'van',
    vin: '3C6TRVDG4NE456789', plate: 'FLCC004', fuelType: 'gasoline',
    color: 'White', purchasePrice: 38900, odometer: 52180,
    sketchfabUrl: 'https://sketchfab.com/3d-models/ram-promaster-van-3d-model',
    model3dUrl: '/models/vehicles/vans/ram_promaster.glb'
  },

  // Pickup Trucks
  {
    number: 'CCC-005', make: 'Ford', model: 'F-150', year: 2023, type: 'truck',
    vin: '1FTFW1E50NFA56789', plate: 'FLCC005', fuelType: 'gasoline',
    color: 'Blue', purchasePrice: 48500, odometer: 22340,
    sketchfabUrl: 'https://sketchfab.com/3d-models/ford-f-150-c205cde66b1d4f14b1820b89de7b8d23',
    model3dUrl: '/models/vehicles/trucks/ford_f_150.glb'
  },
  {
    number: 'CCC-006', make: 'Ford', model: 'F-150', year: 2022, type: 'truck',
    vin: '1FTFW1E52MFA67890', plate: 'FLCC006', fuelType: 'gasoline',
    color: 'Silver', purchasePrice: 46200, odometer: 38750,
    sketchfabUrl: 'https://sketchfab.com/3d-models/ford-f150-raptor-c640e4e7c68545e09a9348494c2c13a1',
    model3dUrl: '/models/vehicles/trucks/ford_f_150.glb'
  },
  {
    number: 'CCC-007', make: 'Chevrolet', model: 'Silverado 1500', year: 2023, type: 'truck',
    vin: '1GCVKREC5NZ789012', plate: 'FLCC007', fuelType: 'gasoline',
    color: 'Black', purchasePrice: 49800, odometer: 15680,
    sketchfabUrl: 'https://sketchfab.com/3d-models/2019-chevrolet-silverado-trail-boss-z71-652324cc8a974d3a9869ce2b0f3beaaa',
    model3dUrl: '/models/vehicles/trucks/chevrolet_silverado.glb'
  },

  // Sedans
  {
    number: 'CCC-008', make: 'Toyota', model: 'Camry', year: 2023, type: 'sedan',
    vin: '4T1BZ1HK5NU890123', plate: 'FLCC008', fuelType: 'gasoline',
    color: 'Gray', purchasePrice: 32500, odometer: 12450,
    sketchfabUrl: 'https://sketchfab.com/3d-models/toyota-camry-fd9b89c8c12b48f98915fac1392e3b67',
    model3dUrl: '/models/vehicles/sedans/toyota_camry.glb'
  },
  {
    number: 'CCC-009', make: 'Honda', model: 'Accord', year: 2022, type: 'sedan',
    vin: '1HGCV1F34NA901234', plate: 'FLCC009', fuelType: 'gasoline',
    color: 'White', purchasePrice: 31200, odometer: 28920,
    sketchfabUrl: 'https://sketchfab.com/3d-models/2021-honda-accord-e742636e46814de5af1568542e7c9bdb',
    model3dUrl: '/models/vehicles/sedans/honda_accord.glb'
  },

  // Electric Vehicles
  {
    number: 'CCC-010', make: 'Tesla', model: 'Model 3', year: 2023, type: 'sedan',
    vin: '5YJ3E1EA8NF012345', plate: 'FLCC010', fuelType: 'electric',
    color: 'Red', purchasePrice: 45990, odometer: 8920, batteryCapacity: 75, electricRange: 310,
    sketchfabUrl: 'https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f',
    model3dUrl: '/models/vehicles/electric_sedans/tesla_model_3.glb'
  },
  {
    number: 'CCC-011', make: 'Tesla', model: 'Model Y', year: 2023, type: 'suv',
    vin: '5YJYGDEE5NF123456', plate: 'FLCC011', fuelType: 'electric',
    color: 'Blue', purchasePrice: 52990, odometer: 6540, batteryCapacity: 75, electricRange: 330,
    sketchfabUrl: 'https://sketchfab.com/3d-models/tesla-model-y-electric-suv',
    model3dUrl: '/models/vehicles/electric_suvs/tesla_model_y.glb'
  },

  // SUVs
  {
    number: 'CCC-012', make: 'Ford', model: 'Explorer', year: 2022, type: 'suv',
    vin: '1FMSK8DH8NGA34567', plate: 'FLCC012', fuelType: 'gasoline',
    color: 'Black', purchasePrice: 44500, odometer: 32180,
    sketchfabUrl: 'https://sketchfab.com/3d-models/ford-explorer-suv',
    model3dUrl: '/models/vehicles/suvs/ford_explorer.glb'
  },
  {
    number: 'CCC-013', make: 'Honda', model: 'CR-V', year: 2023, type: 'suv',
    vin: '2HKRW2H83NH456789', plate: 'FLCC013', fuelType: 'gasoline',
    color: 'Silver', purchasePrice: 36800, odometer: 14560,
    sketchfabUrl: 'https://sketchfab.com/3d-models/honda-cr-v-suv',
    model3dUrl: '/models/vehicles/suvs/honda_cr_v.glb'
  },

  // Box Truck
  {
    number: 'CCC-014', make: 'Isuzu', model: 'NPR-HD', year: 2021, type: 'truck',
    vin: 'JALC4W163N7567890', plate: 'FLCC014', fuelType: 'diesel',
    color: 'White', purchasePrice: 58500, odometer: 48920,
    sketchfabUrl: 'https://sketchfab.com/3d-models/isuzu-npr-box-truck',
    model3dUrl: '/models/vehicles/trucks/isuzu_npr.glb'
  },

  // Spare/Reserve Vehicle
  {
    number: 'CCC-015', make: 'Toyota', model: 'Tacoma', year: 2022, type: 'truck',
    vin: '3TMCZ5AN5NM678901', plate: 'FLCC015', fuelType: 'gasoline',
    color: 'Red', purchasePrice: 38200, odometer: 25670,
    sketchfabUrl: 'https://sketchfab.com/3d-models/toyota-tacoma-pickup',
    model3dUrl: '/models/vehicles/trucks/toyota_tacoma.glb'
  }
];

// ============================================================================
// FACILITIES
// ============================================================================
const FACILITIES = [
  {
    name: 'Capital City Courier HQ',
    code: 'CCC-HQ',
    type: 'depot',
    address: '2847 Industrial Plaza Dr',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32310',
    lat: 30.4156,
    lng: -84.3089,
    capacity: 20,
    serviceBays: 4,
    contactName: 'Patricia Chen',
    contactPhone: '850-555-0102',
    contactEmail: 'patricia.chen@capitalcitycourier.com'
  },
  {
    name: 'North Tallahassee Satellite',
    code: 'CCC-NORTH',
    type: 'parking',
    address: '4521 Thomasville Rd',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32309',
    lat: 30.5156,
    lng: -84.2089,
    capacity: 8,
    serviceBays: 0,
    contactName: 'Angela Thompson',
    contactPhone: '850-555-0104',
    contactEmail: 'angela.thompson@capitalcitycourier.com'
  },
  {
    name: 'Airport Logistics Center',
    code: 'CCC-TLH',
    type: 'warehouse',
    address: '3420 Capital Cir SW',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32310',
    lat: 30.3965,
    lng: -84.3503,
    capacity: 12,
    serviceBays: 2,
    contactName: 'Robert Martinez',
    contactPhone: '850-555-0103',
    contactEmail: 'robert.martinez@capitalcitycourier.com'
  }
];

// ============================================================================
// VENDORS
// ============================================================================
const VENDORS = [
  {
    name: 'Tallahassee Auto Parts',
    code: 'TAP',
    type: 'parts',
    contactName: 'Mike Sullivan',
    contactEmail: 'mike@tallyautoparts.com',
    contactPhone: '850-555-2001',
    address: '1245 N Monroe St',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32303',
    paymentTerms: 'Net 30',
    preferredVendor: true
  },
  {
    name: 'Capital City Tire & Service',
    code: 'CCTS',
    type: 'service',
    contactName: 'Tony Garcia',
    contactEmail: 'tony@capitalcitytire.com',
    contactPhone: '850-555-2002',
    address: '2890 Apalachee Pkwy',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32301',
    paymentTerms: 'Net 15',
    preferredVendor: true
  },
  {
    name: 'Shell Fleet Solutions',
    code: 'SHELL',
    type: 'fuel',
    contactName: 'Regional Account Rep',
    contactEmail: 'fleet@shell.com',
    contactPhone: '800-331-3703',
    address: 'Corporate',
    city: 'Houston',
    state: 'TX',
    zipCode: '77002',
    paymentTerms: 'Due on Receipt',
    preferredVendor: true
  },
  {
    name: 'Florida Commercial Insurance',
    code: 'FCI',
    type: 'insurance',
    contactName: 'Barbara Wilson',
    contactEmail: 'bwilson@flcommercialins.com',
    contactPhone: '850-555-2004',
    address: '201 E Park Ave',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32301',
    paymentTerms: 'Monthly',
    preferredVendor: true
  },
  {
    name: 'AutoZone Commercial',
    code: 'AZC',
    type: 'parts',
    contactName: 'Store Manager',
    contactEmail: 'commercial@autozone.com',
    contactPhone: '850-555-2005',
    address: '1530 W Tennessee St',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32304',
    paymentTerms: 'Net 30',
    preferredVendor: false
  },
  {
    name: 'Penske Truck Leasing',
    code: 'PTL',
    type: 'service',
    contactName: 'Account Manager',
    contactEmail: 'fleet@penske.com',
    contactPhone: '850-555-2006',
    address: '2980 Capital Cir NE',
    city: 'Tallahassee',
    state: 'FL',
    zipCode: '32308',
    paymentTerms: 'Net 30',
    preferredVendor: false
  }
];

// ============================================================================
// PARTS INVENTORY
// ============================================================================
const PARTS_INVENTORY = [
  { partNumber: 'OIL-5W30-5Q', name: 'Motor Oil 5W-30 (5 Quart)', category: 'fluid', manufacturer: 'Mobil 1', unitCost: 28.99, quantityOnHand: 24, reorderPoint: 10, reorderQuantity: 24 },
  { partNumber: 'OIL-0W20-5Q', name: 'Motor Oil 0W-20 (5 Quart)', category: 'fluid', manufacturer: 'Castrol', unitCost: 32.99, quantityOnHand: 18, reorderPoint: 8, reorderQuantity: 18 },
  { partNumber: 'FLT-OIL-FRD', name: 'Oil Filter - Ford Transit/F-150', category: 'filter', manufacturer: 'Motorcraft', unitCost: 12.99, quantityOnHand: 15, reorderPoint: 5, reorderQuantity: 12 },
  { partNumber: 'FLT-OIL-CHV', name: 'Oil Filter - Chevrolet', category: 'filter', manufacturer: 'ACDelco', unitCost: 11.99, quantityOnHand: 8, reorderPoint: 4, reorderQuantity: 10 },
  { partNumber: 'FLT-OIL-TOY', name: 'Oil Filter - Toyota', category: 'filter', manufacturer: 'Toyota OEM', unitCost: 14.99, quantityOnHand: 10, reorderPoint: 4, reorderQuantity: 10 },
  { partNumber: 'FLT-OIL-HND', name: 'Oil Filter - Honda', category: 'filter', manufacturer: 'Honda OEM', unitCost: 13.99, quantityOnHand: 8, reorderPoint: 4, reorderQuantity: 8 },
  { partNumber: 'FLT-AIR-FRD', name: 'Air Filter - Ford Transit', category: 'filter', manufacturer: 'Motorcraft', unitCost: 24.99, quantityOnHand: 6, reorderPoint: 3, reorderQuantity: 6 },
  { partNumber: 'FLT-AIR-GEN', name: 'Air Filter - Universal', category: 'filter', manufacturer: 'K&N', unitCost: 29.99, quantityOnHand: 4, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'BRK-PAD-FRD-F', name: 'Brake Pads Front - Ford F-150', category: 'brake', manufacturer: 'Wagner', unitCost: 89.99, quantityOnHand: 4, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'BRK-PAD-FRD-R', name: 'Brake Pads Rear - Ford F-150', category: 'brake', manufacturer: 'Wagner', unitCost: 79.99, quantityOnHand: 4, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'BRK-PAD-TRN-F', name: 'Brake Pads Front - Ford Transit', category: 'brake', manufacturer: 'Motorcraft', unitCost: 94.99, quantityOnHand: 6, reorderPoint: 3, reorderQuantity: 6 },
  { partNumber: 'BRK-ROT-FRD-F', name: 'Brake Rotor Front - Ford F-150', category: 'brake', manufacturer: 'Wagner', unitCost: 129.99, quantityOnHand: 2, reorderPoint: 1, reorderQuantity: 2 },
  { partNumber: 'WPR-BLD-22', name: 'Wiper Blade 22"', category: 'electrical', manufacturer: 'Rain-X', unitCost: 18.99, quantityOnHand: 10, reorderPoint: 4, reorderQuantity: 10 },
  { partNumber: 'WPR-BLD-24', name: 'Wiper Blade 24"', category: 'electrical', manufacturer: 'Rain-X', unitCost: 19.99, quantityOnHand: 8, reorderPoint: 4, reorderQuantity: 8 },
  { partNumber: 'BAT-GRP65', name: 'Battery Group 65 750CCA', category: 'electrical', manufacturer: 'Interstate', unitCost: 169.99, quantityOnHand: 3, reorderPoint: 1, reorderQuantity: 3 },
  { partNumber: 'BAT-GRP35', name: 'Battery Group 35 640CCA', category: 'electrical', manufacturer: 'Interstate', unitCost: 149.99, quantityOnHand: 2, reorderPoint: 1, reorderQuantity: 2 },
  { partNumber: 'TIR-LT275', name: 'Tire LT275/65R18', category: 'tire', manufacturer: 'Michelin', unitCost: 289.99, quantityOnHand: 4, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'TIR-225-65', name: 'Tire 225/65R17', category: 'tire', manufacturer: 'Goodyear', unitCost: 189.99, quantityOnHand: 6, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'CLN-WASH-5G', name: 'Windshield Washer Fluid 5 Gal', category: 'fluid', manufacturer: 'Prestone', unitCost: 14.99, quantityOnHand: 8, reorderPoint: 4, reorderQuantity: 8 },
  { partNumber: 'CLN-ATF-1G', name: 'Automatic Transmission Fluid 1 Gal', category: 'fluid', manufacturer: 'Valvoline', unitCost: 24.99, quantityOnHand: 6, reorderPoint: 3, reorderQuantity: 6 },
  { partNumber: 'CLN-COOL-1G', name: 'Engine Coolant 50/50 1 Gal', category: 'fluid', manufacturer: 'Prestone', unitCost: 16.99, quantityOnHand: 10, reorderPoint: 4, reorderQuantity: 8 },
  { partNumber: 'BLT-SERP-FRD', name: 'Serpentine Belt - Ford', category: 'engine', manufacturer: 'Gates', unitCost: 34.99, quantityOnHand: 4, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'SPK-PLG-FRD', name: 'Spark Plugs - Ford (Set of 8)', category: 'engine', manufacturer: 'Motorcraft', unitCost: 89.99, quantityOnHand: 3, reorderPoint: 1, reorderQuantity: 3 },
  { partNumber: 'HOS-RAD-UNI', name: 'Radiator Hose Universal', category: 'engine', manufacturer: 'Gates', unitCost: 29.99, quantityOnHand: 4, reorderPoint: 2, reorderQuantity: 4 },
  { partNumber: 'LGT-HEAD-H11', name: 'Headlight Bulb H11', category: 'electrical', manufacturer: 'Sylvania', unitCost: 24.99, quantityOnHand: 6, reorderPoint: 2, reorderQuantity: 6 }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function randomCoordNear(center: { lat: number; lng: number }, radiusKm: number = 0.1): { lat: number; lng: number } {
  const latOffset = (Math.random() - 0.5) * radiusKm * 0.018;
  const lngOffset = (Math.random() - 0.5) * radiusKm * 0.018;
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset
  };
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seedTallahasseeCompany() {
  console.log('=========================================================');
  console.log('  CAPITAL CITY COURIER SERVICES - DATABASE SEED');
  console.log('  Tallahassee, Florida Small Fleet Company');
  console.log('=========================================================\n');

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('Clearing existing data...\n');

    // Clear tables in correct order
    await client.query(`
      TRUNCATE TABLE
        audit_logs, tasks, charging_sessions, charging_stations,
        invoices, purchase_orders, parts_inventory, vendors,
        notifications, announcements, documents,
        training_records, certifications, incidents,
        geofences, telemetry_data, gps_tracks, dispatches, routes,
        fuel_transactions, inspections, maintenance_schedules, work_orders,
        assets, drivers, vehicles, facilities, users, tenants
      RESTART IDENTITY CASCADE
    `);

    const ids: any = {
      tenantId: '',
      userIds: [],
      vehicleIds: [],
      driverIds: [],
      facilityIds: [],
      vendorIds: [],
      partIds: [],
      chargingStationIds: []
    };

    // ========================================================================
    // 1. CREATE TENANT
    // ========================================================================
    console.log('1. Creating tenant...');
    const tenantResult = await client.query(`
      INSERT INTO tenants (name, slug, domain, settings, billing_email, subscription_tier, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      COMPANY.name,
      COMPANY.slug,
      COMPANY.domain,
      JSON.stringify({
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        distanceUnit: 'miles',
        fuelUnit: 'gallons',
        companyAddress: COMPANY.address,
        companyPhone: COMPANY.phone,
        taxId: COMPANY.taxId
      }),
      COMPANY.email,
      'professional',
      true
    ]);
    ids.tenantId = tenantResult.rows[0].id;
    console.log(`   Created tenant: ${COMPANY.name}\n`);

    // ========================================================================
    // 2. CREATE USERS
    // ========================================================================
    console.log('2. Creating users...');
    const passwordHash = await bcrypt.hash('TallyCourier2024!', 12);

    for (const emp of EMPLOYEES) {
      const result = await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        ids.tenantId,
        `${emp.email}@capitalcitycourier.com`,
        passwordHash,
        emp.firstName,
        emp.lastName,
        emp.phone,
        emp.role,
        true,
        daysAgo(randomInt(0, 7))
      ]);
      ids.userIds.push({ id: result.rows[0].id, ...emp });
    }
    console.log(`   Created ${EMPLOYEES.length} users\n`);

    // ========================================================================
    // 3. CREATE FACILITIES
    // ========================================================================
    console.log('3. Creating facilities...');
    for (const fac of FACILITIES) {
      const result = await client.query(`
        INSERT INTO facilities (tenant_id, name, code, type, address, city, state, zip_code, country, latitude, longitude, capacity, current_occupancy, contact_name, contact_phone, contact_email, operating_hours, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        ids.tenantId,
        fac.name,
        fac.code,
        fac.type,
        fac.address,
        fac.city,
        fac.state,
        fac.zipCode,
        'US',
        fac.lat,
        fac.lng,
        fac.capacity,
        randomInt(0, Math.floor(fac.capacity * 0.7)),
        fac.contactName,
        fac.contactPhone,
        fac.contactEmail,
        JSON.stringify({
          monday: { open: '06:00', close: '20:00' },
          tuesday: { open: '06:00', close: '20:00' },
          wednesday: { open: '06:00', close: '20:00' },
          thursday: { open: '06:00', close: '20:00' },
          friday: { open: '06:00', close: '20:00' },
          saturday: { open: '07:00', close: '15:00' },
          sunday: { open: null, close: null }
        }),
        true
      ]);
      ids.facilityIds.push(result.rows[0].id);
    }
    console.log(`   Created ${FACILITIES.length} facilities\n`);

    // ========================================================================
    // 4. CREATE DRIVERS
    // ========================================================================
    console.log('4. Creating drivers...');
    const driverUsers = ids.userIds.filter((u: any) => u.role === 'Driver');

    for (const driver of driverUsers) {
      const result = await client.query(`
        INSERT INTO drivers (tenant_id, user_id, first_name, last_name, email, phone, employee_number, license_number, license_state, license_expiry_date, cdl, cdl_class, status, hire_date, date_of_birth, emergency_contact_name, emergency_contact_phone, performance_score, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        ids.tenantId,
        driver.id,
        driver.firstName,
        driver.lastName,
        `${driver.email}@capitalcitycourier.com`,
        driver.phone,
        `EMP-${String(ids.driverIds.length + 1001).padStart(4, '0')}`,
        `FL${randomInt(100000000, 999999999)}`,
        'FL',
        daysFromNow(randomInt(180, 730)),
        driver.cdl || false,
        driver.cdlClass || null,
        'active',
        daysAgo(randomInt(90, 1825)),
        daysAgo(randomInt(8000, 16000)),
        `${randomItem(['John', 'Mary', 'Robert', 'Linda'])} ${driver.lastName}`,
        `850-555-${randomInt(1000, 9999)}`,
        randomFloat(85, 100, 2),
        JSON.stringify({ title: driver.title })
      ]);
      ids.driverIds.push(result.rows[0].id);
    }
    console.log(`   Created ${driverUsers.length} drivers\n`);

    // ========================================================================
    // 5. CREATE VEHICLES
    // ========================================================================
    console.log('5. Creating vehicles...');
    for (let i = 0; i < VEHICLES.length; i++) {
      const v = VEHICLES[i];
      const location = randomCoordNear(TALLAHASSEE.center, 0.05);

      const result = await client.query(`
        INSERT INTO vehicles (tenant_id, vin, name, number, type, make, model, year, license_plate, status, fuel_type, fuel_level, odometer, latitude, longitude, location_address, last_service_date, next_service_date, next_service_mileage, purchase_date, purchase_price, current_value, insurance_policy_number, insurance_expiry_date, assigned_driver_id, assigned_facility_id, metadata, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING id
      `, [
        ids.tenantId,
        v.vin,
        `${v.make} ${v.model}`,
        v.number,
        v.type,
        v.make,
        v.model,
        v.year,
        v.plate,
        randomItem(['active', 'active', 'active', 'idle']),
        v.fuelType,
        v.fuelType === 'electric' ? randomFloat(40, 95) : randomFloat(30, 95),
        v.odometer,
        location.lat,
        location.lng,
        `${randomInt(100, 9999)} ${randomItem(['Monroe St', 'Apalachee Pkwy', 'Tennessee St', 'Thomasville Rd'])}, Tallahassee, FL`,
        daysAgo(randomInt(30, 90)),
        daysFromNow(randomInt(30, 120)),
        v.odometer + randomInt(3000, 5000),
        daysAgo(randomInt(365, 1095)),
        v.purchasePrice,
        v.purchasePrice * randomFloat(0.6, 0.85),
        `FCI-${randomInt(100000, 999999)}`,
        daysFromNow(randomInt(60, 365)),
        i < ids.driverIds.length ? ids.driverIds[i] : null,
        ids.facilityIds[0],
        JSON.stringify({
          color: v.color,
          sketchfabUrl: v.sketchfabUrl,
          model3dUrl: v.model3dUrl,
          batteryCapacity: v.batteryCapacity,
          electricRange: v.electricRange
        }),
        true
      ]);
      ids.vehicleIds.push(result.rows[0].id);
    }
    console.log(`   Created ${VEHICLES.length} vehicles\n`);

    // ========================================================================
    // 6. CREATE VENDORS
    // ========================================================================
    console.log('6. Creating vendors...');
    for (const vendor of VENDORS) {
      const result = await client.query(`
        INSERT INTO vendors (tenant_id, name, code, type, contact_name, contact_email, contact_phone, address, city, state, zip_code, country, payment_terms, preferred_vendor, rating, is_active, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        ids.tenantId,
        vendor.name,
        vendor.code,
        vendor.type,
        vendor.contactName,
        vendor.contactEmail,
        vendor.contactPhone,
        vendor.address,
        vendor.city,
        vendor.state,
        vendor.zipCode,
        'US',
        vendor.paymentTerms,
        vendor.preferredVendor,
        randomFloat(3.5, 5.0, 2),
        true,
        '{}'
      ]);
      ids.vendorIds.push(result.rows[0].id);
    }
    console.log(`   Created ${VENDORS.length} vendors\n`);

    // ========================================================================
    // 7. CREATE PARTS INVENTORY
    // ========================================================================
    console.log('7. Creating parts inventory...');
    for (const part of PARTS_INVENTORY) {
      const result = await client.query(`
        INSERT INTO parts_inventory (tenant_id, part_number, name, description, category, manufacturer, unit_cost, unit_of_measure, quantity_on_hand, reorder_point, reorder_quantity, location_in_warehouse, facility_id, is_active, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        ids.tenantId,
        part.partNumber,
        part.name,
        `${part.name} for fleet maintenance`,
        part.category,
        part.manufacturer,
        part.unitCost,
        'each',
        part.quantityOnHand,
        part.reorderPoint,
        part.reorderQuantity,
        `${randomItem(['A', 'B', 'C'])}-${randomInt(1, 10)}-${randomInt(1, 5)}`,
        ids.facilityIds[0],
        true,
        '{}'
      ]);
      ids.partIds.push(result.rows[0].id);
    }
    console.log(`   Created ${PARTS_INVENTORY.length} parts\n`);

    // ========================================================================
    // 8. CREATE WORK ORDERS
    // ========================================================================
    console.log('8. Creating work orders...');
    const workOrderTypes = [
      { title: 'Oil Change', type: 'preventive', cost: 85 },
      { title: 'Tire Rotation', type: 'preventive', cost: 45 },
      { title: 'Brake Inspection', type: 'inspection', cost: 125 },
      { title: 'A/C System Service', type: 'corrective', cost: 250 },
      { title: 'Transmission Service', type: 'preventive', cost: 350 },
      { title: 'Battery Replacement', type: 'corrective', cost: 180 },
      { title: 'Alignment Check', type: 'inspection', cost: 95 },
      { title: 'DOT Inspection', type: 'inspection', cost: 75 }
    ];

    for (let i = 0; i < 45; i++) {
      const wo = randomItem(workOrderTypes);
      const vehicleId = randomItem(ids.vehicleIds);
      const status = randomItem(['pending', 'in_progress', 'completed', 'completed', 'completed']);

      await client.query(`
        INSERT INTO work_orders (tenant_id, vehicle_id, number, title, description, type, priority, status, assigned_to_id, requested_by_id, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, estimated_cost, actual_cost, labor_hours, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        ids.tenantId,
        vehicleId,
        `WO-${new Date().getFullYear()}-${String(i + 1001).padStart(4, '0')}`,
        wo.title,
        `${wo.title} service for fleet vehicle`,
        wo.type,
        randomItem(['low', 'medium', 'medium', 'high']),
        status,
        ids.userIds.find((u: any) => u.role === 'Mechanic')?.id || null,
        ids.userIds.find((u: any) => u.role === 'Manager')?.id || null,
        daysAgo(randomInt(0, 30)),
        daysFromNow(randomInt(1, 14)),
        status !== 'pending' ? daysAgo(randomInt(1, 15)) : null,
        status === 'completed' ? daysAgo(randomInt(0, 10)) : null,
        wo.cost,
        status === 'completed' ? wo.cost * randomFloat(0.9, 1.15) : null,
        status === 'completed' ? randomFloat(0.5, 4, 1) : null,
        '',
        '{}'
      ]);
    }
    console.log('   Created 45 work orders\n');

    // ========================================================================
    // 9. CREATE FUEL TRANSACTIONS
    // ========================================================================
    console.log('9. Creating fuel transactions...');
    const fuelStations = [
      { name: 'Shell - Monroe St', lat: 30.4567, lng: -84.2734 },
      { name: 'BP - Apalachee Pkwy', lat: 30.4383, lng: -84.2456 },
      { name: 'Chevron - Tennessee St', lat: 30.4489, lng: -84.3012 },
      { name: 'RaceTrac - Capital Cir', lat: 30.4156, lng: -84.2567 },
      { name: 'Circle K - Thomasville Rd', lat: 30.4789, lng: -84.2234 }
    ];

    for (let i = 0; i < 180; i++) {
      const vehicleId = randomItem(ids.vehicleIds);
      const driverId = randomItem(ids.driverIds);
      const station = randomItem(fuelStations);
      const gallons = randomFloat(8, 28, 3);
      const pricePerGallon = randomFloat(3.15, 3.89, 3);

      await client.query(`
        INSERT INTO fuel_transactions (tenant_id, vehicle_id, driver_id, transaction_date, fuel_type, gallons, cost_per_gallon, total_cost, odometer, location, latitude, longitude, vendor_name, receipt_number, payment_method, card_last4, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        ids.tenantId,
        vehicleId,
        driverId,
        daysAgo(randomInt(0, 90)),
        randomItem(['gasoline', 'gasoline', 'gasoline', 'diesel']),
        gallons,
        pricePerGallon,
        (gallons * pricePerGallon).toFixed(2),
        randomInt(15000, 85000),
        station.name,
        station.lat,
        station.lng,
        station.name.split(' - ')[0],
        `REC${randomInt(100000000, 999999999)}`,
        'company_card',
        String(randomInt(1000, 9999)),
        '',
        '{}'
      ]);
    }
    console.log('   Created 180 fuel transactions\n');

    // ========================================================================
    // 10. CREATE ROUTES
    // ========================================================================
    console.log('10. Creating routes...');
    const routeTemplates = [
      { name: 'Downtown Tallahassee Loop', type: 'delivery', distance: 15, duration: 90 },
      { name: 'FSU Campus Delivery', type: 'delivery', distance: 8, duration: 45 },
      { name: 'Airport Express', type: 'shuttle', distance: 12, duration: 35 },
      { name: 'North Tallahassee Route', type: 'delivery', distance: 22, duration: 120 },
      { name: 'Southwood Business Park', type: 'service', distance: 18, duration: 75 },
      { name: 'Thomasville Road Corridor', type: 'delivery', distance: 14, duration: 60 },
      { name: 'Capital Circle Full Loop', type: 'delivery', distance: 35, duration: 150 },
      { name: 'Midtown Express', type: 'express', distance: 6, duration: 25 }
    ];

    for (let i = 0; i < 35; i++) {
      const route = randomItem(routeTemplates);
      const vehicleId = randomItem(ids.vehicleIds);
      const driverId = randomItem(ids.driverIds);

      await client.query(`
        INSERT INTO routes (tenant_id, name, number, description, type, status, assigned_vehicle_id, assigned_driver_id, start_facility_id, end_facility_id, scheduled_start_time, scheduled_end_time, estimated_distance, estimated_duration, waypoints, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        ids.tenantId,
        `${route.name} #${i + 1}`,
        `RT-${String(i + 1001).padStart(4, '0')}`,
        `Standard ${route.type} route covering ${route.name.toLowerCase()}`,
        route.type,
        randomItem(['pending', 'in_progress', 'completed', 'completed']),
        vehicleId,
        driverId,
        ids.facilityIds[0],
        ids.facilityIds[0],
        daysAgo(randomInt(0, 30)),
        daysAgo(randomInt(0, 30)),
        route.distance,
        route.duration,
        JSON.stringify([
          { lat: TALLAHASSEE.center.lat, lng: TALLAHASSEE.center.lng, address: 'HQ', stopDuration: 5 },
          { lat: TALLAHASSEE.center.lat + 0.02, lng: TALLAHASSEE.center.lng - 0.01, address: 'Stop 1', stopDuration: 10 },
          { lat: TALLAHASSEE.center.lat + 0.01, lng: TALLAHASSEE.center.lng + 0.02, address: 'Stop 2', stopDuration: 15 }
        ]),
        '{}'
      ]);
    }
    console.log('   Created 35 routes\n');

    // ========================================================================
    // 11. CREATE INSPECTIONS
    // ========================================================================
    console.log('11. Creating inspections...');
    for (let i = 0; i < 120; i++) {
      const vehicleId = randomItem(ids.vehicleIds);
      const driverId = randomItem(ids.driverIds);
      const passed = Math.random() > 0.15;

      await client.query(`
        INSERT INTO inspections (tenant_id, vehicle_id, driver_id, inspector_id, type, status, inspector_name, location, started_at, completed_at, defects_found, passed_inspection, notes, checklist_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        ids.tenantId,
        vehicleId,
        driverId,
        ids.userIds.find((u: any) => u.role === 'Supervisor')?.id || null,
        randomItem(['pre_trip', 'post_trip', 'safety', 'dot']),
        'completed',
        randomItem(EMPLOYEES.filter(e => e.role === 'Driver')).firstName + ' ' + randomItem(EMPLOYEES.filter(e => e.role === 'Driver')).lastName,
        'Capital City Courier HQ',
        daysAgo(randomInt(0, 60)),
        daysAgo(randomInt(0, 60)),
        passed ? 0 : randomInt(1, 3),
        passed,
        passed ? 'All systems operational' : 'Minor issues noted - see checklist',
        JSON.stringify({
          brakes: passed ? 'pass' : randomItem(['pass', 'fail']),
          lights: 'pass',
          tires: passed ? 'pass' : randomItem(['pass', 'needs_attention']),
          fluids: 'pass',
          mirrors: 'pass',
          horn: 'pass',
          wipers: passed ? 'pass' : randomItem(['pass', 'needs_attention']),
          seatbelts: 'pass'
        })
      ]);
    }
    console.log('   Created 120 inspections\n');

    // ========================================================================
    // 12. CREATE GPS TRACKS
    // ========================================================================
    console.log('12. Creating GPS tracks...');
    for (const vehicleId of ids.vehicleIds.slice(0, 8)) {
      for (let j = 0; j < 100; j++) {
        const location = randomCoordNear(TALLAHASSEE.center, 0.08);

        await client.query(`
          INSERT INTO gps_tracks (tenant_id, vehicle_id, timestamp, latitude, longitude, altitude, speed, heading, accuracy, odometer, fuel_level, engine_status, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          ids.tenantId,
          vehicleId,
          new Date(Date.now() - j * 60000),
          location.lat,
          location.lng,
          randomFloat(15, 45),
          randomFloat(0, 55),
          randomFloat(0, 360),
          randomFloat(2, 8),
          randomInt(15000, 85000),
          randomFloat(25, 95),
          randomItem(['running', 'running', 'idle', 'off']),
          '{}'
        ]);
      }
    }
    console.log('   Created 800 GPS tracks\n');

    // ========================================================================
    // 13. CREATE GEOFENCES
    // ========================================================================
    console.log('13. Creating geofences...');
    const geofenceData = [
      { name: 'HQ Depot Zone', type: 'facility', ...TALLAHASSEE_LOCATIONS.downtown, radius: 500 },
      { name: 'FSU Campus Zone', type: 'operational', ...TALLAHASSEE_LOCATIONS.fsuCampus, radius: 1000 },
      { name: 'Airport Zone', type: 'operational', ...TALLAHASSEE_LOCATIONS.tallahasseeAirport, radius: 800 },
      { name: 'Downtown Tallahassee', type: 'operational', ...TALLAHASSEE_LOCATIONS.downtown, radius: 2000 },
      { name: 'North Service Area', type: 'operational', ...TALLAHASSEE_LOCATIONS.killearnEstates, radius: 1500 },
      { name: 'Restricted - State Capitol', type: 'restricted', lat: 30.4381, lng: -84.2816, radius: 200 }
    ];

    for (const geo of geofenceData) {
      await client.query(`
        INSERT INTO geofences (tenant_id, name, description, type, center_lat, center_lng, radius, color, is_active, notify_on_entry, notify_on_exit, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        ids.tenantId,
        geo.name,
        `Geofence zone for ${geo.name.toLowerCase()}`,
        geo.type,
        geo.lat,
        geo.lng,
        geo.radius,
        geo.type === 'restricted' ? '#ef4444' : '#3b82f6',
        true,
        geo.type === 'restricted',
        true,
        '{}'
      ]);
    }
    console.log('   Created 6 geofences\n');

    // ========================================================================
    // 14. CREATE INCIDENTS
    // ========================================================================
    console.log('14. Creating incidents...');
    const incidentTypes = [
      { type: 'near_miss', severity: 'minor' },
      { type: 'accident', severity: 'minor' },
      { type: 'accident', severity: 'moderate' },
      { type: 'property_damage', severity: 'minor' },
      { type: 'violation', severity: 'minor' }
    ];

    for (let i = 0; i < 12; i++) {
      const incident = randomItem(incidentTypes);
      const vehicleId = randomItem(ids.vehicleIds);
      const driverId = randomItem(ids.driverIds);
      const location = randomCoordNear(TALLAHASSEE.center, 0.05);

      await client.query(`
        INSERT INTO incidents (tenant_id, number, vehicle_id, driver_id, type, severity, status, incident_date, location, latitude, longitude, description, injuries_reported, fatalities_reported, police_report_number, insurance_claim_number, estimated_cost, reported_by_id, reported_at, root_cause, corrective_actions, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [
        ids.tenantId,
        `INC-${new Date().getFullYear()}-${String(i + 1001).padStart(4, '0')}`,
        vehicleId,
        driverId,
        incident.type,
        incident.severity,
        randomItem(['pending', 'in_progress', 'completed']),
        daysAgo(randomInt(7, 180)),
        `${randomInt(100, 9999)} ${randomItem(['Monroe St', 'Apalachee Pkwy', 'Tennessee St'])}, Tallahassee, FL`,
        location.lat,
        location.lng,
        `${incident.type.replace('_', ' ')} incident - ${incident.severity} severity`,
        false,
        false,
        incident.type === 'accident' ? `TPD-${randomInt(100000, 999999)}` : null,
        incident.severity !== 'minor' ? `FCI-CLM-${randomInt(10000, 99999)}` : null,
        incident.severity === 'minor' ? randomFloat(200, 1500) : randomFloat(1500, 8000),
        ids.userIds.find((u: any) => u.role === 'Supervisor')?.id,
        daysAgo(randomInt(7, 180)),
        'Driver training reminder issued',
        'Safety briefing conducted with driver',
        '{}'
      ]);
    }
    console.log('   Created 12 incidents\n');

    // ========================================================================
    // 15. CREATE CERTIFICATIONS
    // ========================================================================
    console.log('15. Creating certifications...');
    const certTypes = ['CDL', 'Medical Card', 'Defensive Driving', 'Hazmat', 'First Aid'];

    for (const driverId of ids.driverIds) {
      for (const certType of certTypes.slice(0, randomInt(2, 4))) {
        await client.query(`
          INSERT INTO certifications (tenant_id, driver_id, type, number, issuing_authority, issued_date, expiry_date, status, verified_by_id, verified_at, notes, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          ids.tenantId,
          driverId,
          certType,
          `CERT-${randomInt(100000, 999999)}`,
          certType === 'CDL' ? 'Florida DHSMV' : certType === 'Medical Card' ? 'DOT Certified Examiner' : 'National Safety Council',
          daysAgo(randomInt(90, 730)),
          daysFromNow(randomInt(90, 730)),
          'active',
          ids.userIds.find((u: any) => u.role === 'Manager')?.id,
          daysAgo(randomInt(30, 90)),
          '',
          '{}'
        ]);
      }
    }
    console.log('   Created driver certifications\n');

    // ========================================================================
    // 16. CREATE TRAINING RECORDS
    // ========================================================================
    console.log('16. Creating training records...');
    const trainings = [
      { name: 'Defensive Driving Course', type: 'safety', hours: 8, cost: 150 },
      { name: 'DOT Compliance Training', type: 'compliance', hours: 4, cost: 75 },
      { name: 'Vehicle Safety Inspection', type: 'skills', hours: 2, cost: 50 },
      { name: 'Customer Service Excellence', type: 'skills', hours: 3, cost: 45 },
      { name: 'First Aid & CPR', type: 'safety', hours: 6, cost: 125 },
      { name: 'Hazmat Handling', type: 'compliance', hours: 8, cost: 200 }
    ];

    for (const driverId of ids.driverIds) {
      for (const training of trainings.slice(0, randomInt(2, 4))) {
        await client.query(`
          INSERT INTO training_records (tenant_id, driver_id, training_name, training_type, provider, instructor_name, start_date, end_date, completion_date, status, passed, score, certificate_number, hours_completed, cost, notes, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          ids.tenantId,
          driverId,
          training.name,
          training.type,
          'Tallahassee Safety Training Center',
          'Certified Instructor',
          daysAgo(randomInt(30, 365)),
          daysAgo(randomInt(28, 360)),
          daysAgo(randomInt(28, 360)),
          'completed',
          true,
          randomFloat(85, 100, 1),
          `TC-${randomInt(10000, 99999)}`,
          training.hours,
          training.cost,
          '',
          '{}'
        ]);
      }
    }
    console.log('   Created driver training records\n');

    // ========================================================================
    // 17. CREATE DOCUMENTS
    // ========================================================================
    console.log('17. Creating documents...');
    const docTypes = [
      { name: 'Vehicle Insurance Policy', type: 'contract', category: 'compliance' },
      { name: 'DOT Operating Authority', type: 'certification', category: 'compliance' },
      { name: 'Safety Manual 2024', type: 'manual', category: 'safety' },
      { name: 'Employee Handbook', type: 'policy', category: 'hr' },
      { name: 'Maintenance Procedures', type: 'manual', category: 'operations' },
      { name: 'Fleet Inspection Checklist', type: 'form', category: 'safety' },
      { name: 'Fuel Card Policy', type: 'policy', category: 'finance' },
      { name: 'Accident Report Form', type: 'form', category: 'safety' }
    ];

    for (const doc of docTypes) {
      await client.query(`
        INSERT INTO documents (tenant_id, name, description, type, category, file_url, file_size, mime_type, version, uploaded_by_id, is_public, tags, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        ids.tenantId,
        doc.name,
        `Official ${doc.name.toLowerCase()} for Capital City Courier Services`,
        doc.type,
        doc.category,
        `/documents/${doc.name.toLowerCase().replace(/ /g, '_')}.pdf`,
        randomInt(50000, 2000000),
        'application/pdf',
        '1.0',
        ids.userIds.find((u: any) => u.role === 'Admin')?.id,
        false,
        JSON.stringify([doc.category, doc.type]),
        '{}'
      ]);
    }
    console.log('   Created 8 documents\n');

    // ========================================================================
    // 18. CREATE ANNOUNCEMENTS
    // ========================================================================
    console.log('18. Creating announcements...');
    const announcements = [
      { title: 'Holiday Schedule Update', message: 'Office closed December 25-26. Limited operations December 24.', type: 'info', priority: 'high' },
      { title: 'New Safety Protocol', message: 'All drivers must complete updated safety checklist before each route.', type: 'warning', priority: 'high' },
      { title: 'Fleet Maintenance Window', message: 'Scheduled maintenance for all vehicles this Saturday 7AM-12PM.', type: 'reminder', priority: 'medium' },
      { title: 'Q4 Performance Bonus', message: 'Congratulations team! Q4 bonuses will be distributed next Friday.', type: 'success', priority: 'medium' },
      { title: 'Weather Advisory', message: 'Tropical storm expected this weekend. Review emergency procedures.', type: 'alert', priority: 'critical' }
    ];

    for (const ann of announcements) {
      await client.query(`
        INSERT INTO announcements (tenant_id, title, message, type, priority, target_roles, published_at, expires_at, created_by_id, is_active, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        ids.tenantId,
        ann.title,
        ann.message,
        ann.type,
        ann.priority,
        JSON.stringify(['Driver', 'Dispatcher', 'Manager', 'Admin']),
        daysAgo(randomInt(0, 14)),
        daysFromNow(randomInt(7, 60)),
        ids.userIds.find((u: any) => u.role === 'Admin')?.id,
        true,
        '{}'
      ]);
    }
    console.log('   Created 5 announcements\n');

    // ========================================================================
    // 19. CREATE NOTIFICATIONS
    // ========================================================================
    console.log('19. Creating notifications...');
    const notifTypes = [
      { title: 'Vehicle Due for Service', message: 'Oil change due in 500 miles', type: 'reminder' },
      { title: 'Route Completed', message: 'Downtown delivery route completed successfully', type: 'success' },
      { title: 'Fuel Card Transaction', message: 'Fuel purchase $52.47 at Shell Monroe St', type: 'info' },
      { title: 'Inspection Reminder', message: 'Pre-trip inspection required before departure', type: 'warning' },
      { title: 'New Work Order Assigned', message: 'Brake inspection assigned for CCC-005', type: 'info' }
    ];

    for (const user of ids.userIds.slice(0, 10)) {
      for (let i = 0; i < randomInt(3, 8); i++) {
        const notif = randomItem(notifTypes);
        await client.query(`
          INSERT INTO notifications (tenant_id, user_id, title, message, type, priority, is_read, read_at, sent_at, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          ids.tenantId,
          user.id,
          notif.title,
          notif.message,
          notif.type,
          'medium',
          Math.random() > 0.4,
          Math.random() > 0.4 ? daysAgo(randomInt(0, 7)) : null,
          daysAgo(randomInt(0, 14)),
          '{}'
        ]);
      }
    }
    console.log('   Created notifications\n');

    // ========================================================================
    // 20. CREATE CHARGING STATIONS
    // ========================================================================
    console.log('20. Creating charging stations...');
    const chargingStations = [
      { name: 'HQ Charging Bay 1', type: 'level2', lat: 30.4156, lng: -84.3089, ports: 2, powerKw: 19.2 },
      { name: 'HQ Charging Bay 2', type: 'level2', lat: 30.4157, lng: -84.3090, ports: 2, powerKw: 19.2 },
      { name: 'North Satellite Charger', type: 'level2', lat: 30.5156, lng: -84.2089, ports: 1, powerKw: 11.5 }
    ];

    for (const station of chargingStations) {
      const result = await client.query(`
        INSERT INTO charging_stations (tenant_id, name, station_id, type, facility_id, latitude, longitude, address, number_of_ports, available_ports, max_power_kw, cost_per_kwh, is_public, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        ids.tenantId,
        station.name,
        `CS-${randomInt(1000, 9999)}`,
        station.type,
        ids.facilityIds[0],
        station.lat,
        station.lng,
        '2847 Industrial Plaza Dr, Tallahassee, FL 32310',
        station.ports,
        station.ports,
        station.powerKw,
        0.15,
        false,
        'active',
        '{}'
      ]);
      ids.chargingStationIds.push(result.rows[0].id);
    }
    console.log('   Created 3 charging stations\n');

    // ========================================================================
    // 21. CREATE CHARGING SESSIONS
    // ========================================================================
    console.log('21. Creating charging sessions...');
    const evVehicleIds = ids.vehicleIds.slice(9, 11); // Tesla Model 3 and Model Y

    for (let i = 0; i < 35; i++) {
      const vehicleId = randomItem(evVehicleIds);
      const stationId = randomItem(ids.chargingStationIds);
      const energyKwh = randomFloat(15, 55, 3);

      await client.query(`
        INSERT INTO charging_sessions (tenant_id, vehicle_id, driver_id, station_id, start_time, end_time, duration_minutes, energy_delivered_kwh, start_soc_percent, end_soc_percent, cost, payment_method, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        ids.tenantId,
        vehicleId,
        randomItem(ids.driverIds),
        stationId,
        daysAgo(randomInt(0, 60)),
        daysAgo(randomInt(0, 60)),
        randomInt(45, 240),
        energyKwh,
        randomFloat(15, 45),
        randomFloat(80, 100),
        (energyKwh * 0.15).toFixed(2),
        'company_account',
        'completed',
        '{}'
      ]);
    }
    console.log('   Created 35 charging sessions\n');

    // ========================================================================
    // 22. CREATE PURCHASE ORDERS
    // ========================================================================
    console.log('22. Creating purchase orders...');
    for (let i = 0; i < 18; i++) {
      const vendorId = randomItem(ids.vendorIds);
      const subtotal = randomFloat(150, 2500, 2);
      const tax = subtotal * 0.07;
      const shipping = randomFloat(0, 25, 2);
      const total = subtotal + tax + shipping;

      await client.query(`
        INSERT INTO purchase_orders (tenant_id, number, vendor_id, status, order_date, expected_delivery_date, subtotal, tax_amount, shipping_cost, total_amount, payment_status, paid_amount, requested_by_id, approved_by_id, shipping_address, notes, line_items, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        ids.tenantId,
        `PO-${new Date().getFullYear()}-${String(i + 1001).padStart(4, '0')}`,
        vendorId,
        randomItem(['pending', 'completed', 'completed', 'completed']),
        daysAgo(randomInt(0, 45)),
        daysFromNow(randomInt(3, 14)),
        subtotal,
        tax.toFixed(2),
        shipping,
        total.toFixed(2),
        randomItem(['unpaid', 'paid', 'paid']),
        Math.random() > 0.3 ? total.toFixed(2) : '0.00',
        ids.userIds.find((u: any) => u.role === 'Mechanic')?.id,
        ids.userIds.find((u: any) => u.role === 'Manager')?.id,
        COMPANY.address,
        'Parts order for fleet maintenance',
        JSON.stringify([]),
        '{}'
      ]);
    }
    console.log('   Created 18 purchase orders\n');

    // ========================================================================
    // 23. CREATE ASSETS
    // ========================================================================
    console.log('23. Creating assets...');
    const assets = [
      { name: 'Snap-on Tool Chest', type: 'tool', category: 'Garage', value: 4500 },
      { name: 'Floor Jack 3-Ton', type: 'equipment', category: 'Garage', value: 350 },
      { name: 'OBD-II Scanner Pro', type: 'equipment', category: 'Diagnostic', value: 1200 },
      { name: 'Tire Changer Machine', type: 'machinery', category: 'Garage', value: 3800 },
      { name: 'Wheel Balancer', type: 'machinery', category: 'Garage', value: 2900 },
      { name: 'Air Compressor 60-Gal', type: 'equipment', category: 'Garage', value: 1100 },
      { name: 'Pressure Washer', type: 'equipment', category: 'Cleaning', value: 450 },
      { name: 'Dispatch Computer Station', type: 'technology', category: 'Office', value: 2200 },
      { name: 'Fleet GPS Tracking Server', type: 'technology', category: 'IT', value: 3500 },
      { name: 'Security Camera System', type: 'technology', category: 'Security', value: 1800 }
    ];

    for (const asset of assets) {
      await client.query(`
        INSERT INTO assets (tenant_id, asset_number, name, description, type, category, manufacturer, purchase_date, purchase_price, current_value, status, assigned_facility_id, condition, warranty_expiry_date, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        ids.tenantId,
        `AST-${String(randomInt(10000, 99999))}`,
        asset.name,
        `${asset.name} for fleet operations`,
        asset.type,
        asset.category,
        randomItem(['Snap-on', 'Milwaukee', 'DeWalt', 'Autel', 'Dell', 'Axis']),
        daysAgo(randomInt(180, 1095)),
        asset.value,
        asset.value * randomFloat(0.6, 0.9),
        'active',
        ids.facilityIds[0],
        randomItem(['excellent', 'good', 'good', 'fair']),
        daysFromNow(randomInt(180, 730)),
        '',
        '{}'
      ]);
    }
    console.log('   Created 10 assets\n');

    // ========================================================================
    // 24. CREATE MAINTENANCE SCHEDULES
    // ========================================================================
    console.log('24. Creating maintenance schedules...');
    const maintenanceItems = [
      { name: 'Oil Change', intervalMiles: 5000, intervalDays: 90, cost: 85 },
      { name: 'Tire Rotation', intervalMiles: 7500, intervalDays: 120, cost: 45 },
      { name: 'Brake Inspection', intervalMiles: 15000, intervalDays: 180, cost: 125 },
      { name: 'Transmission Service', intervalMiles: 30000, intervalDays: 365, cost: 350 },
      { name: 'Air Filter Replacement', intervalMiles: 20000, intervalDays: 365, cost: 55 }
    ];

    for (const vehicleId of ids.vehicleIds) {
      for (const maint of maintenanceItems.slice(0, randomInt(2, 4))) {
        await client.query(`
          INSERT INTO maintenance_schedules (tenant_id, vehicle_id, name, description, type, interval_miles, interval_days, last_service_date, last_service_mileage, next_service_date, next_service_mileage, estimated_cost, estimated_duration, is_active, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          ids.tenantId,
          vehicleId,
          maint.name,
          `Scheduled ${maint.name.toLowerCase()} service`,
          'preventive',
          maint.intervalMiles,
          maint.intervalDays,
          daysAgo(randomInt(30, 90)),
          randomInt(15000, 70000),
          daysFromNow(randomInt(30, 120)),
          randomInt(20000, 85000),
          maint.cost,
          randomInt(30, 120),
          true,
          '{}'
        ]);
      }
    }
    console.log('   Created maintenance schedules\n');

    // ========================================================================
    // 25. CREATE DISPATCHES
    // ========================================================================
    console.log('25. Creating dispatches...');
    for (let i = 0; i < 50; i++) {
      const vehicleId = randomItem(ids.vehicleIds);
      const driverId = randomItem(ids.driverIds);
      const origin = randomItem(Object.values(TALLAHASSEE_LOCATIONS));
      const dest = randomItem(Object.values(TALLAHASSEE_LOCATIONS));

      await client.query(`
        INSERT INTO dispatches (tenant_id, vehicle_id, driver_id, dispatcher_id, type, priority, status, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng, dispatched_at, acknowledged_at, arrived_at, completed_at, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        ids.tenantId,
        vehicleId,
        driverId,
        ids.userIds.find((u: any) => u.role === 'Dispatcher')?.id,
        randomItem(['delivery', 'pickup', 'service', 'express']),
        randomItem(['low', 'medium', 'medium', 'high']),
        randomItem(['pending', 'in_progress', 'completed', 'completed', 'completed']),
        origin.address,
        dest.address,
        origin.lat,
        origin.lng,
        dest.lat,
        dest.lng,
        daysAgo(randomInt(0, 30)),
        daysAgo(randomInt(0, 30)),
        daysAgo(randomInt(0, 30)),
        Math.random() > 0.3 ? daysAgo(randomInt(0, 30)) : null,
        '',
        '{}'
      ]);
    }
    console.log('   Created 50 dispatches\n');

    // ========================================================================
    // 26. CREATE TELEMETRY DATA
    // ========================================================================
    console.log('26. Creating telemetry data...');
    for (const vehicleId of ids.vehicleIds.slice(0, 10)) {
      for (let j = 0; j < 24; j++) {
        await client.query(`
          INSERT INTO telemetry_data (tenant_id, vehicle_id, timestamp, engine_rpm, engine_temperature, battery_voltage, fuel_consumption_rate, tire_pressure_front_left, tire_pressure_front_right, tire_pressure_rear_left, tire_pressure_rear_right, oil_pressure, diagnostic_codes, raw_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          ids.tenantId,
          vehicleId,
          new Date(Date.now() - j * 3600000),
          randomInt(700, 3500),
          randomFloat(180, 220),
          randomFloat(12.4, 14.2),
          randomFloat(2.5, 8.5),
          randomFloat(32, 36),
          randomFloat(32, 36),
          randomFloat(32, 36),
          randomFloat(32, 36),
          randomFloat(25, 45),
          JSON.stringify([]),
          JSON.stringify({})
        ]);
      }
    }
    console.log('   Created 240 telemetry records\n');

    // ========================================================================
    // 27. CREATE INVOICES
    // ========================================================================
    console.log('27. Creating invoices...');
    for (let i = 0; i < 15; i++) {
      const vendorId = randomItem(ids.vendorIds);
      const subtotal = randomFloat(200, 3500, 2);
      const tax = subtotal * 0.07;
      const total = subtotal + tax;
      const status = randomItem(['paid', 'paid', 'paid', 'sent', 'draft']);

      await client.query(`
        INSERT INTO invoices (tenant_id, number, type, vendor_id, status, invoice_date, due_date, paid_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_due, payment_method, notes, line_items, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        ids.tenantId,
        `INV-${new Date().getFullYear()}-${String(i + 1001).padStart(4, '0')}`,
        'vendor',
        vendorId,
        status,
        daysAgo(randomInt(0, 60)),
        daysFromNow(randomInt(15, 45)),
        status === 'paid' ? daysAgo(randomInt(0, 30)) : null,
        subtotal,
        tax.toFixed(2),
        '0.00',
        total.toFixed(2),
        status === 'paid' ? total.toFixed(2) : '0.00',
        status === 'paid' ? '0.00' : total.toFixed(2),
        status === 'paid' ? randomItem(['check', 'ach', 'credit_card']) : null,
        '',
        JSON.stringify([]),
        '{}'
      ]);
    }
    console.log('   Created 15 invoices\n');

    // ========================================================================
    // 28. CREATE TASKS
    // ========================================================================
    console.log('28. Creating tasks...');
    const taskTemplates = [
      { title: 'Complete vehicle inspection', type: 'inspection' },
      { title: 'Update driver certification', type: 'administrative' },
      { title: 'Review fuel reports', type: 'administrative' },
      { title: 'Process maintenance request', type: 'maintenance' },
      { title: 'Approve purchase order', type: 'administrative' },
      { title: 'Conduct safety briefing', type: 'safety' },
      { title: 'Review incident report', type: 'safety' },
      { title: 'Schedule DOT inspection', type: 'inspection' }
    ];

    for (let i = 0; i < 25; i++) {
      const task = randomItem(taskTemplates);
      await client.query(`
        INSERT INTO tasks (tenant_id, title, description, type, priority, status, assigned_to_id, created_by_id, due_date, completed_at, notes, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        ids.tenantId,
        task.title,
        `${task.title} for fleet operations`,
        task.type,
        randomItem(['low', 'medium', 'medium', 'high']),
        randomItem(['pending', 'in_progress', 'completed', 'completed']),
        randomItem(ids.userIds)?.id,
        ids.userIds.find((u: any) => u.role === 'Manager')?.id,
        daysFromNow(randomInt(1, 14)),
        Math.random() > 0.5 ? daysAgo(randomInt(0, 7)) : null,
        '',
        '{}'
      ]);
    }
    console.log('   Created 25 tasks\n');

    // ========================================================================
    // 29. CREATE AUDIT LOGS
    // ========================================================================
    console.log('29. Creating audit logs...');
    const auditActions = ['login', 'create', 'update', 'delete', 'view', 'export'];
    const entityTypes = ['vehicle', 'driver', 'route', 'work_order', 'fuel_transaction', 'user'];

    for (let i = 0; i < 150; i++) {
      const user = randomItem(ids.userIds);
      await client.query(`
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        ids.tenantId,
        user.id,
        randomItem(auditActions),
        randomItem(entityTypes),
        null,
        `192.168.1.${randomInt(1, 254)}`,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        '{}'
      ]);
    }
    console.log('   Created 150 audit logs\n');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('=========================================================');
    console.log('  SEED COMPLETE - CAPITAL CITY COURIER SERVICES');
    console.log('=========================================================\n');
    console.log('Data Summary:');
    console.log(`  - 1 Tenant (${COMPANY.name})`);
    console.log(`  - ${EMPLOYEES.length} Users`);
    console.log(`  - ${FACILITIES.length} Facilities`);
    console.log(`  - ${driverUsers.length} Drivers`);
    console.log(`  - ${VEHICLES.length} Vehicles (with Sketchfab 3D models)`);
    console.log(`  - ${VENDORS.length} Vendors`);
    console.log(`  - ${PARTS_INVENTORY.length} Parts`);
    console.log('  - 45 Work Orders');
    console.log('  - 180 Fuel Transactions');
    console.log('  - 35 Routes');
    console.log('  - 120 Inspections');
    console.log('  - 800 GPS Tracks');
    console.log('  - 6 Geofences');
    console.log('  - 12 Incidents');
    console.log('  - Driver Certifications & Training');
    console.log('  - 8 Documents');
    console.log('  - 5 Announcements');
    console.log('  - User Notifications');
    console.log('  - 3 Charging Stations');
    console.log('  - 35 Charging Sessions');
    console.log('  - 18 Purchase Orders');
    console.log('  - 10 Assets');
    console.log('  - Maintenance Schedules');
    console.log('  - 50 Dispatches');
    console.log('  - 240 Telemetry Records');
    console.log('  - 15 Invoices');
    console.log('  - 25 Tasks');
    console.log('  - 150 Audit Logs');
    console.log('\nLogin Credentials:');
    console.log('  Email: marcus.washington@capitalcitycourier.com');
    console.log('  Password: TallyCourier2024!');
    console.log('\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedTallahasseeCompany().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
