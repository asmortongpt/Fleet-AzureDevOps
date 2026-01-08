/**
 * Shared type definitions for Maintenance Hub drilldown components
 */

export interface PreventiveMaintenanceSchedule {
  id: string
  vehicleId: string
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  serviceType: string
  serviceDescription: string
  lastServiceDate?: string
  lastServiceMileage?: number
  nextDueDate: string
  nextDueMileage?: number
  currentMileage: number
  daysUntilDue: number
  milesUntilDue?: number
  status: 'upcoming' | 'due-soon' | 'overdue' | 'completed'
  frequency: string
  estimatedCost: number
  assignedTechnician?: string
  serviceProvider: string
  serviceProviderContact: {
    name: string
    phone: string
    email: string
    address: string
  }
  notes?: string
}

export interface ServiceHistoryRecord {
  id: string
  workOrderNumber: string
  serviceDate: string
  serviceType: string
  description: string
  mileage: number
  technician: string
  technicianPhone: string
  technicianEmail: string
  laborHours: number
  laborCost: number
  partsCost: number
  totalCost: number
  status: 'completed' | 'cancelled'
  notes?: string
  warranty?: {
    active: boolean
    expirationDate?: string
    expirationMileage?: number
    provider: string
    coverage: string
  }
}

export interface RepairRecord {
  id: string
  workOrderNumber: string
  vehicleId: string
  vehicleNumber: string
  repairType: string
  description: string
  reportedDate: string
  reportedBy: string
  reportedByPhone: string
  reportedByEmail: string
  status: 'reported' | 'diagnosed' | 'in-progress' | 'awaiting-parts' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  diagnosisDate?: string
  diagnosisNotes?: string
  estimatedCost?: number
  actualCost?: number
  assignedTechnician?: string
  technicianPhone?: string
  technicianEmail?: string
  startDate?: string
  completionDate?: string
  partsUsed: Array<{
    partNumber: string
    partName: string
    quantity: number
    unitCost: number
    supplier: string
    supplierContact: string
  }>
  laborEntries: Array<{
    technicianName: string
    hours: number
    rate: number
    description: string
  }>
}

export interface InspectionRecord {
  id: string
  inspectionNumber: string
  vehicleId: string
  vehicleNumber: string
  inspectionType: string
  inspectionDate: string
  mileage: number
  inspector: {
    name: string
    certificationNumber: string
    phone: string
    email: string
  }
  location: {
    facilityName: string
    address: string
    phone: string
  }
  overallResult: 'pass' | 'pass-with-advisories' | 'fail'
  score?: number
  itemsInspected: number
  itemsPassed: number
  itemsFailed: number
  itemsAdvisory: number
  inspectionItems: Array<{
    category: string
    item: string
    result: 'pass' | 'fail' | 'advisory'
    notes?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }>
  failedItems: Array<{
    item: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    notes: string
    correctiveAction: string
    actionStatus: 'pending' | 'scheduled' | 'in-progress' | 'completed'
    estimatedCost?: number
  }>
  nextInspectionDue?: string
  expirationDate?: string
  certificationNumber?: string
}

export interface ServiceVendor {
  id: string
  vendorName: string
  vendorType: string
  contactPerson: string
  phone: string
  email: string
  address: string
  website?: string
  specialties: string[]
  certifications: string[]
  activeContracts: number
  totalServicesYTD: number
  totalCostYTD: number
  averageRating: number
  responseTime: string
  paymentTerms: string
  notes?: string
}

export interface GarageBayMatrixRow {
  bayNumber: string
  currentVehicle: string
  workOrderNumber: string
  status: 'available' | 'occupied' | 'reserved'
  technician: string
  estimatedCompletion: string
  [key: string]: any
}

export interface WorkOrderListRow {
  workOrderNumber: string
  vehicleNumber: string
  serviceType: string
  status: string
  priority: string
  assignedTo: string
  scheduledDate: string
  estimatedCost: number
  [key: string]: any
}

export interface PMScheduleMatrixRow {
  vehicleNumber: string
  serviceType: string
  lastService: string
  nextDue: string
  daysUntilDue: number
  status: string
  assignedTechnician: string
  [key: string]: any
}

export interface PartsInventoryRow {
  partNumber: string
  partName: string
  category: string
  quantityOnHand: number
  reorderPoint: number
  status: string
  unitCost: number
  [key: string]: any
}

export interface ServiceHistoryRow {
  workOrderNumber: string
  vehicleNumber: string
  serviceDate: string
  serviceType: string
  technician: string
  totalCost: number
  status: string
  [key: string]: any
}
