/**
 * Maintenance Drilldown API Routes
 * Provides endpoints for:
 * - Preventive Maintenance Schedules
 * - Repairs
 * - Inspections
 * - Service Records
 * - Service Vendors
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'

const router = Router()

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generatePMSchedule = (scheduleId: string) => ({
  id: scheduleId,
  vehicleId: 'V-' + Math.floor(Math.random() * 100),
  vehicleNumber: 'Unit ' + Math.floor(Math.random() * 100),
  vehicleMake: ['Ford', 'Chevrolet', 'Ram', 'GMC'][Math.floor(Math.random() * 4)],
  vehicleModel: ['F-150', 'Silverado', '2500', 'Sierra'][Math.floor(Math.random() * 4)],
  vehicleYear: 2020 + Math.floor(Math.random() * 5),
  serviceType: ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Transmission Service'][
    Math.floor(Math.random() * 4)
  ],
  serviceDescription:
    'Comprehensive preventive maintenance including fluid checks, filter replacement, and safety inspection',
  lastServiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  lastServiceMileage: 45000 + Math.floor(Math.random() * 5000),
  nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  nextDueMileage: 50000 + Math.floor(Math.random() * 5000),
  currentMileage: 48500 + Math.floor(Math.random() * 1000),
  daysUntilDue: 15,
  milesUntilDue: 1500 + Math.floor(Math.random() * 500),
  status: ['upcoming', 'due-soon', 'overdue'][Math.floor(Math.random() * 3)],
  frequency: 'Every 5,000 miles or 3 months',
  estimatedCost: 125 + Math.floor(Math.random() * 200),
  assignedTechnician: ['Mike Johnson', 'Sarah Williams', 'John Smith'][
    Math.floor(Math.random() * 3)
  ],
  serviceProvider: 'Orlando Fleet Services',
  serviceProviderContact: {
    name: 'Robert Martinez',
    phone: '(407) 555-0123',
    email: 'robert.martinez@orlandofleet.com',
    address: '1234 Service Blvd, Orlando, FL 32801',
  },
  notes: 'Vehicle has been running well. Last service completed without issues.',
})

const generateServiceHistory = (vehicleId: string, serviceType?: string) => {
  const records = []
  for (let i = 0; i < 10; i++) {
    records.push({
      id: `SR-${Date.now()}-${i}`,
      workOrderNumber: `WO-2025-${1000 + i}`,
      serviceDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      serviceType: serviceType || ['Oil Change', 'Tire Rotation', 'Brake Service'][i % 3],
      description: `Routine ${serviceType || 'maintenance'} service with comprehensive inspection`,
      mileage: 50000 - i * 5000,
      technician: ['Mike Johnson', 'Sarah Williams', 'John Smith'][i % 3],
      technicianPhone: ['(407) 555-0101', '(407) 555-0102', '(407) 555-0103'][i % 3],
      technicianEmail: [
        'mike.j@orlandofleet.com',
        'sarah.w@orlandofleet.com',
        'john.s@orlandofleet.com',
      ][i % 3],
      laborHours: 2 + Math.random() * 3,
      laborCost: 150 + Math.floor(Math.random() * 200),
      partsCost: 75 + Math.floor(Math.random() * 150),
      totalCost: 225 + Math.floor(Math.random() * 350),
      status: 'completed',
      notes: i % 3 === 0 ? 'Service completed without issues. Vehicle in good condition.' : undefined,
      warranty: i % 2 === 0
        ? {
            active: true,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            expirationMileage: 60000,
            provider: 'Orlando Fleet Warranty',
            coverage: 'Parts and Labor',
          }
        : undefined,
    })
  }
  return records
}

const generateRepair = (repairId: string) => ({
  id: repairId,
  workOrderNumber: `WO-2025-${Math.floor(Math.random() * 9000) + 1000}`,
  vehicleId: 'V-' + Math.floor(Math.random() * 100),
  vehicleNumber: 'Unit ' + Math.floor(Math.random() * 100),
  repairType: ['Brake Repair', 'Engine Repair', 'Transmission Repair', 'Electrical Repair'][
    Math.floor(Math.random() * 4)
  ],
  description: 'Customer reported unusual noise from front brakes during operation',
  reportedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  reportedBy: 'James Wilson',
  reportedByPhone: '(407) 555-0200',
  reportedByEmail: 'james.wilson@company.com',
  status: ['reported', 'diagnosed', 'in-progress', 'awaiting-parts', 'completed'][
    Math.floor(Math.random() * 5)
  ],
  priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
  diagnosisDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  diagnosisNotes:
    'Inspection revealed worn brake pads and rotors. Front calipers showing signs of wear. Recommend full brake system service.',
  estimatedCost: 850,
  actualCost: 875.5,
  assignedTechnician: 'Sarah Williams',
  technicianPhone: '(407) 555-0102',
  technicianEmail: 'sarah.w@orlandofleet.com',
  startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  partsUsed: [
    {
      partNumber: 'BP-2024-F150',
      partName: 'Front Brake Pads (Set)',
      quantity: 1,
      unitCost: 125.0,
      supplier: 'AutoZone Commercial',
      supplierContact: '1-800-AUTOZONE',
    },
    {
      partNumber: 'BR-2024-F150',
      partName: 'Front Brake Rotors (Pair)',
      quantity: 1,
      unitCost: 185.0,
      supplier: 'AutoZone Commercial',
      supplierContact: '1-800-AUTOZONE',
    },
    {
      partNumber: 'BF-UNIVERSAL',
      partName: 'Brake Fluid (DOT 3)',
      quantity: 2,
      unitCost: 12.5,
      supplier: "O'Reilly Auto Parts",
      supplierContact: '(407) 555-1234',
    },
  ],
  laborEntries: [
    {
      technicianName: 'Sarah Williams',
      hours: 3.5,
      rate: 95.0,
      description: 'Brake system inspection, pad and rotor replacement, system bleeding',
    },
    {
      technicianName: 'Mike Johnson',
      hours: 1.0,
      rate: 85.0,
      description: 'Quality check and test drive',
    },
  ],
})

const generateInspection = (inspectionId: string) => {
  const failedCount = Math.floor(Math.random() * 3)
  const advisoryCount = Math.floor(Math.random() * 5)
  const totalItems = 25
  const passedCount = totalItems - failedCount - advisoryCount

  return {
    id: inspectionId,
    inspectionNumber: `INS-2025-${Math.floor(Math.random() * 9000) + 1000}`,
    vehicleId: 'V-' + Math.floor(Math.random() * 100),
    vehicleNumber: 'Unit ' + Math.floor(Math.random() * 100),
    inspectionType: ['DOT Annual', 'Pre-Trip', 'Post-Trip', 'Safety'][Math.floor(Math.random() * 4)],
    inspectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    mileage: 48000 + Math.floor(Math.random() * 5000),
    inspector: {
      name: 'David Thompson',
      certificationNumber: 'DOT-FL-2024-0456',
      phone: '(407) 555-0300',
      email: 'david.thompson@inspections.com',
    },
    location: {
      facilityName: 'Central Florida Inspection Center',
      address: '5678 Inspection Way, Orlando, FL 32805',
      phone: '(407) 555-0301',
    },
    overallResult: failedCount > 0 ? 'fail' : advisoryCount > 0 ? 'pass-with-advisories' : 'pass',
    score: Math.floor(((passedCount + advisoryCount * 0.5) / totalItems) * 100),
    itemsInspected: totalItems,
    itemsPassed: passedCount,
    itemsFailed: failedCount,
    itemsAdvisory: advisoryCount,
    inspectionItems: [
      { category: 'Brakes', item: 'Brake Pads Front', result: 'pass', notes: 'Within spec' },
      { category: 'Brakes', item: 'Brake Pads Rear', result: 'pass', notes: 'Within spec' },
      {
        category: 'Brakes',
        item: 'Brake Fluid',
        result: failedCount > 0 ? 'fail' : 'pass',
        notes: failedCount > 0 ? 'Contaminated, needs replacement' : 'Clear',
        severity: failedCount > 0 ? 'high' : undefined,
      },
      { category: 'Tires', item: 'Tire Tread Depth Front', result: 'pass', notes: '8/32"' },
      {
        category: 'Tires',
        item: 'Tire Tread Depth Rear',
        result: advisoryCount > 0 ? 'advisory' : 'pass',
        notes: advisoryCount > 0 ? '4/32" - Replace soon' : '6/32"',
        severity: advisoryCount > 0 ? 'medium' : undefined,
      },
      { category: 'Lights', item: 'Headlights', result: 'pass' },
      { category: 'Lights', item: 'Brake Lights', result: 'pass' },
      { category: 'Lights', item: 'Turn Signals', result: 'pass' },
      { category: 'Fluids', item: 'Engine Oil Level', result: 'pass' },
      {
        category: 'Fluids',
        item: 'Coolant Level',
        result: advisoryCount > 1 ? 'advisory' : 'pass',
        notes: advisoryCount > 1 ? 'Slightly low' : undefined,
        severity: advisoryCount > 1 ? 'low' : undefined,
      },
      { category: 'Suspension', item: 'Shocks/Struts', result: 'pass' },
      { category: 'Suspension', item: 'Ball Joints', result: 'pass' },
      { category: 'Steering', item: 'Steering Play', result: 'pass' },
      { category: 'Steering', item: 'Power Steering Fluid', result: 'pass' },
      { category: 'Electrical', item: 'Battery Condition', result: 'pass', notes: '12.6V' },
      {
        category: 'Electrical',
        item: 'Alternator Output',
        result: failedCount > 1 ? 'fail' : 'pass',
        notes: failedCount > 1 ? 'Below spec - 13.2V' : '14.2V',
        severity: failedCount > 1 ? 'critical' : undefined,
      },
      { category: 'Engine', item: 'Air Filter', result: 'pass' },
      { category: 'Engine', item: 'Fuel Filter', result: 'pass' },
      { category: 'Exhaust', item: 'Exhaust Leaks', result: 'pass' },
      { category: 'Safety', item: 'Fire Extinguisher', result: 'pass' },
      { category: 'Safety', item: 'First Aid Kit', result: 'pass' },
      { category: 'Safety', item: 'Warning Triangles', result: 'pass' },
      { category: 'Body', item: 'Mirrors', result: 'pass' },
      { category: 'Body', item: 'Windshield', result: 'pass' },
      { category: 'Body', item: 'Wiper Blades', result: advisoryCount > 2 ? 'advisory' : 'pass' },
    ],
    failedItems:
      failedCount > 0
        ? [
            {
              item: 'Brake Fluid',
              severity: 'high' as const,
              notes: 'Fluid contaminated with moisture. Immediate replacement required.',
              correctiveAction: 'Flush and replace brake fluid with DOT 3 specification',
              actionStatus: 'scheduled' as const,
              estimatedCost: 125.0,
            },
            ...(failedCount > 1
              ? [
                  {
                    item: 'Alternator Output',
                    severity: 'critical' as const,
                    notes: 'Alternator output below specification at 13.2V. Battery not charging properly.',
                    correctiveAction: 'Replace alternator and test battery',
                    actionStatus: 'pending' as const,
                    estimatedCost: 550.0,
                  },
                ]
              : []),
          ]
        : [],
    nextInspectionDue: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000).toISOString(),
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    certificationNumber: 'FL-DOT-2025-' + Math.floor(Math.random() * 90000 + 10000),
  }
}

const generateServiceRecord = (recordId: string) => ({
  id: recordId,
  workOrderNumber: `WO-2025-${Math.floor(Math.random() * 9000) + 1000}`,
  serviceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  serviceType: ['Oil Change', 'Tire Rotation', 'Brake Service', 'Transmission Service'][
    Math.floor(Math.random() * 4)
  ],
  description: 'Routine maintenance service including oil change, filter replacement, and multi-point inspection',
  mileage: 47500 + Math.floor(Math.random() * 1000),
  technician: 'Mike Johnson',
  technicianPhone: '(407) 555-0101',
  technicianEmail: 'mike.j@orlandofleet.com',
  laborHours: 2.5,
  laborCost: 237.5,
  partsCost: 87.5,
  totalCost: 325.0,
  status: 'completed',
  notes: 'All systems checked and operating normally. Recommended tire rotation at next service.',
  warranty: {
    active: true,
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    expirationMileage: 60000,
    provider: 'Orlando Fleet Warranty',
    coverage: 'Parts and Labor - 12 months / 12,000 miles',
  },
})

const generateServiceVendor = (vendorId: string) => ({
  id: vendorId,
  vendorName: 'Orlando Fleet Services',
  vendorType: 'Full Service Maintenance',
  contactPerson: 'Robert Martinez',
  phone: '(407) 555-0123',
  email: 'robert.martinez@orlandofleet.com',
  address: '1234 Service Blvd, Orlando, FL 32801',
  website: 'https://orlandofleetservices.com',
  specialties: [
    'Preventive Maintenance',
    'Brake Service',
    'Engine Repair',
    'Transmission Service',
    'Electrical Systems',
    'HVAC Service',
  ],
  certifications: [
    'ASE Master Certified',
    'DOT Inspection Certified',
    'Ford Fleet Certified',
    'Chevrolet Fleet Certified',
  ],
  activeContracts: 3,
  totalServicesYTD: 247,
  totalCostYTD: 89450.0,
  averageRating: 4.7,
  responseTime: '< 4 hours',
  paymentTerms: 'Net 30',
  notes: 'Preferred vendor for all fleet maintenance. Excellent track record with fast turnaround times.',
})

// ============================================
// ROUTES
// ============================================

// Get PM Schedule Detail
router.get('/pm-schedules/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params
    const schedule = generatePMSchedule(scheduleId)
    res.json(schedule)
  } catch (error) {
    console.error('Error fetching PM schedule:', error)
    res.status(500).json({ error: 'Failed to fetch PM schedule' })
  }
})

// Get Vehicle Service History
router.get('/vehicles/:vehicleId/service-history', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const { serviceType } = req.query
    const history = generateServiceHistory(vehicleId, serviceType as string | undefined)
    res.json(history)
  } catch (error) {
    console.error('Error fetching service history:', error)
    res.status(500).json({ error: 'Failed to fetch service history' })
  }
})

// Get Repair Detail
router.get('/repairs/:repairId', async (req: Request, res: Response) => {
  try {
    const { repairId } = req.params
    const repair = generateRepair(repairId)
    res.json(repair)
  } catch (error) {
    console.error('Error fetching repair:', error)
    res.status(500).json({ error: 'Failed to fetch repair' })
  }
})

// Get Inspection Detail
router.get('/inspections/:inspectionId', async (req: Request, res: Response) => {
  try {
    const { inspectionId } = req.params
    const inspection = generateInspection(inspectionId)
    res.json(inspection)
  } catch (error) {
    console.error('Error fetching inspection:', error)
    res.status(500).json({ error: 'Failed to fetch inspection' })
  }
})

// Get Service Record Detail
router.get('/service-records/:serviceRecordId', async (req: Request, res: Response) => {
  try {
    const { serviceRecordId } = req.params
    const record = generateServiceRecord(serviceRecordId)
    res.json(record)
  } catch (error) {
    console.error('Error fetching service record:', error)
    res.status(500).json({ error: 'Failed to fetch service record' })
  }
})

// Get Service Vendor Detail
router.get('/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params
    const vendor = generateServiceVendor(vendorId)
    res.json(vendor)
  } catch (error) {
    console.error('Error fetching vendor:', error)
    res.status(500).json({ error: 'Failed to fetch vendor' })
  }
})

// Get Garage Bay Work Order
router.get('/garage-bays/:bayNumber/work-order', async (req: Request, res: Response) => {
  try {
    const { bayNumber } = req.params
    const workOrder = {
      id: `WO-BAY-${bayNumber}`,
      bayNumber,
      workOrderId: `WO-2025-${Math.floor(Math.random() * 9000) + 1000}`,
      workOrderType: 'Preventive Maintenance',
      description: 'Comprehensive PM service including oil change, tire rotation, and multi-point inspection',
      priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      status: 'in-progress' as const,
      startDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      hoursLogged: 2.0,
      hoursEstimated: 3.0,
      progressPercentage: 67,
      vehicleId: 'V-' + Math.floor(Math.random() * 100),
      vehicleNumber: 'Unit ' + Math.floor(Math.random() * 100),
      vehicleMake: 'Ford',
      vehicleModel: 'F-150',
      vehicleYear: 2022,
      mileage: 48500,
      licensePlate: 'ABC123',
      assetTag: 'FL-' + Math.floor(Math.random() * 1000),
      department: 'Operations',
      assignedTechnicians: [
        {
          id: 'TECH-001',
          name: 'Sarah Williams',
          phone: '(407) 555-0102',
          email: 'sarah.w@orlandofleet.com',
        },
        {
          id: 'TECH-002',
          name: 'Mike Johnson',
          phone: '(407) 555-0101',
          email: 'mike.j@orlandofleet.com',
        },
      ],
      supervisor: {
        id: 'SUP-001',
        name: 'Robert Martinez',
        phone: '(407) 555-0123',
        email: 'robert.martinez@orlandofleet.com',
      },
      completionContacts: [
        {
          name: 'James Wilson',
          role: 'Fleet Manager',
          phone: '(407) 555-0200',
          email: 'james.wilson@company.com',
          notifyOnCompletion: true,
        },
        {
          name: 'Lisa Anderson',
          role: 'Operations Director',
          phone: '(407) 555-0201',
          email: 'lisa.anderson@company.com',
          notifyOnCompletion: true,
        },
      ],
      parts: [
        {
          partNumber: 'OIL-5W30-6QT',
          description: 'Synthetic Motor Oil 5W-30 (6 Quarts)',
          quantity: 1,
          status: 'in-stock' as const,
        },
        {
          partNumber: 'FILTER-OIL-FL820S',
          description: 'Oil Filter FL820S',
          quantity: 1,
          status: 'in-stock' as const,
        },
        {
          partNumber: 'FILTER-AIR-CA10171',
          description: 'Air Filter CA10171',
          quantity: 1,
          status: 'in-stock' as const,
        },
      ],
      materials: [
        { name: 'Shop Towels', quantity: 5, unit: 'ea' },
        { name: 'Brake Cleaner', quantity: 1, unit: 'can' },
      ],
    }

    res.json(workOrder)
  } catch (error) {
    console.error('Error fetching garage bay work order:', error)
    res.status(500).json({ error: 'Failed to fetch garage bay work order' })
  }
})

export default router
