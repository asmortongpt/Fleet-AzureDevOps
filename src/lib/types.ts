// Multi-tenant support
export interface Tenant {
  id: string
  name: string
  domain: string
  status: "active" | "suspended" | "trial"
  plan: "basic" | "professional" | "enterprise"
  maxUsers: number
  maxVehicles: number
  features: string[]
  createdAt: string
  contactEmail: string
  billingInfo?: {
    address: string
    paymentMethod: string
    nextBillingDate: string
  }
}

export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  role: "super-admin" | "admin" | "manager" | "supervisor" | "technician" | "driver" | "viewer"
  permissions: string[]
  department?: string
  phone?: string
  status: "active" | "inactive" | "suspended"
  lastLogin?: string
  createdAt: string
}

export interface Vehicle {
  id: string
  tenantId: string
  number: string
  type: "sedan" | "suv" | "truck" | "van" | "emergency" | "specialty" | "tractor" | "forklift" | "trailer" | "construction" | "bus" | "motorcycle"
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  status: "active" | "idle" | "charging" | "service" | "emergency" | "offline"
  location: {
    lat: number
    lng: number
    address: string
  }
  region: string
  department: string
  fuelLevel: number
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid" | "cng" | "propane"
  mileage: number
  hoursUsed?: number // For equipment tracking
  assignedDriver?: string
  ownership: "owned" | "leased" | "rented"
  lastService: string
  nextService: string
  alerts: string[]
  customFields?: Record<string, any>
  tags?: string[]
}

export interface Driver {
  id: string
  tenantId: string
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  licenseType: string
  licenseExpiry: string
  assignedVehicle?: string
  safetyScore: number
  certifications: string[]
  status: "active" | "off-duty" | "on-leave"
  avatar?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface Staff {
  id: string
  tenantId: string
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  supervisor?: string
  status: "active" | "inactive"
  hireDate?: string
}

export interface ServiceBay {
  id: string
  number: string
  status: "occupied" | "available" | "maintenance"
  vehicle?: string
  technician?: string
  serviceType?: string
  estimatedCompletion?: string
}

export interface WorkOrder {
  id: string
  tenantId: string
  vehicleId: string
  vehicleNumber: string
  serviceType: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in-progress" | "completed" | "cancelled"
  assignedTo?: string
  cost?: number
  laborHours?: number
  createdDate: string
  completedDate?: string
  description: string
  notes?: string[]
  parts?: { partId: string; quantity: number; cost: number }[]
  createdBy: string
  approvedBy?: string
}

export interface Technician {
  id: string
  name: string
  specialization: string[]
  availability: "available" | "busy" | "off-duty"
  efficiency: number
  certifications: string[]
  activeWorkOrders: number
}

export interface FuelTransaction {
  id: string
  vehicleId: string
  vehicleNumber: string
  date: string
  station: string
  gallons: number
  pricePerGallon: number
  totalCost: number
  mpg: number
  paymentMethod: string
  odometer: number
}

export interface MaintenanceRequest {
  id: string
  vehicleId: string
  vehicleNumber: string
  issueType: string
  priority: "low" | "medium" | "high" | "urgent"
  description: string
  requestedBy: string
  requestDate: string
  status: "pending" | "approved" | "in-progress" | "completed"
}

export interface MileageReimbursement {
  id: string
  employeeId: string
  employeeName: string
  vehicleType: string
  tripDate: string
  startLocation: string
  endLocation: string
  miles: number
  purpose: string
  rate: number
  amount: number
  status: "draft" | "submitted" | "approved" | "rejected" | "paid"
  submittedDate?: string
  approvedBy?: string
  approvedDate?: string
}

export interface GISFacility {
  id: string
  name: string
  type: "office" | "depot" | "service-center" | "fueling-station"
  location: {
    lat: number
    lng: number
  }
  address: string
  region: string
  status: "operational" | "maintenance" | "closed"
}

export interface Vendor {
  id: string
  tenantId: string
  name: string
  type: "parts" | "service" | "fuel" | "insurance" | "leasing" | "towing" | "other"
  contactPerson: string
  email: string
  phone: string
  address: string
  website?: string
  rating: number
  status: "active" | "inactive" | "suspended"
  services: string[]
  paymentTerms: string
  taxId: string
  certifications: string[]
  contractStart?: string
  contractEnd?: string
  lastOrderDate?: string
  totalSpend: number
  invoiceCount: number
  performanceMetrics?: {
    onTimeDelivery: number
    qualityScore: number
    responseTime: number
  }
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  vendorName: string
  date: string
  expectedDelivery: string
  status: "draft" | "pending-approval" | "approved" | "ordered" | "received" | "cancelled"
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  notes?: string
  approvedBy?: string
  approvedDate?: string
  receivedBy?: string
  receivedDate?: string
  attachments?: string[]
}

export interface PurchaseOrderItem {
  id: string
  partId: string
  partNumber: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Part {
  id: string
  partNumber: string
  name: string
  description: string
  category: "engine" | "transmission" | "brakes" | "electrical" | "body" | "interior" | "tires" | "fluids" | "filters" | "other"
  manufacturer: string
  compatibleVehicles: string[]
  quantityOnHand: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  unitCost: number
  location: string
  preferredVendorId?: string
  alternateVendors: string[]
  lastOrdered?: string
  lastUsed?: string
  imageUrl?: string
}

export interface InventoryTransaction {
  id: string
  partId: string
  partNumber: string
  type: "purchase" | "usage" | "return" | "adjustment" | "transfer"
  quantity: number
  date: string
  reference?: string
  workOrderId?: string
  cost?: number
  performedBy: string
  notes?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  vendorId: string
  vendorName: string
  poId?: string
  date: string
  dueDate: string
  status: "draft" | "pending" | "paid" | "overdue" | "disputed" | "cancelled"
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  balance: number
  paymentMethod?: string
  paidDate?: string
  notes?: string
  attachments?: string[]
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface MSTeamsMessage {
  id: string
  channelId: string
  channelName: string
  subject: string
  content: string
  author: string
  timestamp: string
  attachments?: string[]
  mentions?: string[]
  reactions?: { emoji: string; count: number }[]
  relatedVehicleId?: string
  relatedWorkOrderId?: string
}

export interface MSOutlookEmail {
  id: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  date: string
  body: string
  attachments?: EmailAttachment[]
  isRead: boolean
  category?: string
  relatedVehicleId?: string
  relatedWorkOrderId?: string
  relatedVendorId?: string
  hasReceipt: boolean
}

export interface EmailAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
}

export interface AIAssistantMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: string
  context?: {
    vehicleId?: string
    workOrderId?: string
    vendorId?: string
    action?: string
  }
  suggestions?: string[]
}

export interface RecurrencePattern {
  type: "mileage" | "time" | "engine_hours" | "combined"
  interval_value: number
  interval_unit: "miles" | "days" | "weeks" | "months" | "engine_hours"
  lead_time_days?: number
  warning_threshold_days?: number
  grace_period_days?: number
}

export interface WorkOrderTemplate {
  priority: "low" | "medium" | "high" | "urgent"
  assigned_technician?: string
  estimated_cost?: number
  estimated_duration_hours?: number
  description?: string
  parts?: string[]
  service_provider?: string
  instructions?: string
  checklist?: string[]
}

export interface MaintenanceSchedule {
  id: string
  vehicleId: string
  vehicleNumber: string
  serviceType: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually" | "mileage-based"
  intervalMiles?: number
  lastPerformed: string
  lastCompleted?: string
  nextDue: string
  priority: "low" | "medium" | "high" | "urgent"
  assignedVendorId?: string
  assignedTechnician?: string
  estimatedCost: number
  status: "scheduled" | "due" | "overdue" | "completed"
  autoSchedule: boolean
  notes?: string
  parts?: string[]
  serviceProvider?: string

  // Recurring maintenance fields
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  autoCreateWorkOrder?: boolean
  workOrderTemplate?: WorkOrderTemplate
  lastWorkOrderCreatedAt?: string
  currentMileage?: number
  currentEngineHours?: number
}

export interface Receipt {
  id: string
  date: string
  vendor: string
  category: "fuel" | "maintenance" | "parts" | "service" | "toll" | "parking" | "other"
  amount: number
  taxAmount: number
  paymentMethod: string
  vehicleId?: string
  driverId?: string
  workOrderId?: string
  imageUrl?: string
  ocrData?: {
    merchantName?: string
    date?: string
    total?: string
    items?: { description: string; amount: number }[]
  }
  status: "pending" | "approved" | "rejected" | "reimbursed"
  submittedBy: string
  approvedBy?: string
  notes?: string
}

export interface CommunicationLog {
  id: string
  tenantId: string
  type: "email" | "teams" | "phone" | "sms" | "in-person"
  date: string
  participants: string[]
  subject: string
  summary: string
  relatedVehicleId?: string
  relatedVendorId?: string
  relatedWorkOrderId?: string
  followUpRequired: boolean
  followUpDate?: string
  attachments?: string[]
  createdBy: string
}

// Audit logging for compliance
export interface AuditLog {
  id: string
  tenantId: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, { old: any; new: any }>
  ipAddress: string
  timestamp: string
  metadata?: Record<string, any>
}

// Fleet Analytics
export interface FleetMetrics {
  tenantId: string
  period: string
  totalVehicles: number
  activeVehicles: number
  idleVehicles: number
  serviceVehicles: number
  totalMileage: number
  totalFuelCost: number
  totalMaintenanceCost: number
  averageMPG: number
  utilizationRate: number
  maintenanceCompliance: number
  safetyIncidents: number
}

// Equipment-specific tracking
export interface EquipmentUsage {
  id: string
  tenantId: string
  vehicleId: string
  operatorId: string
  startTime: string
  endTime?: string
  hoursUsed: number
  taskType: string
  location: string
  notes?: string
  fuelConsumed?: number
}

// Traffic Cameras
export interface TrafficCamera {
  id: string
  sourceId: string
  externalId: string
  name: string
  address?: string
  crossStreet1?: string
  crossStreet2?: string
  crossStreets?: string
  cameraUrl?: string
  streamUrl?: string
  imageUrl?: string
  latitude?: number
  longitude?: number
  enabled: boolean
  operational: boolean
  lastCheckedAt?: string
  metadata?: Record<string, any>
  syncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CameraDataSource {
  id: string
  name: string
  description?: string
  sourceType: 'arcgis' | 'rest_api' | 'csv' | 'geojson' | 'manual'
  serviceUrl: string
  enabled: boolean
  syncIntervalMinutes: number
  authentication?: {
    type: 'token' | 'oauth' | 'none'
    token?: string
  }
  fieldMapping: Record<string, string>
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'failed' | 'pending'
  lastSyncError?: string
  totalCamerasSynced: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Route interface for route management
export interface Route {
  id: string;
  tenantId: string;
  name: string;
  vehicleId: string;
  driverId: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startLocation: string;
  endLocation: string;
  waypoints?: Array<{ lat: number; lng: number; address?: string }>;
  distance: number; // in miles
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  startTime: string;
  endTime?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Document Management with Geospatial Support
// ============================================================================

export interface DocumentLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface Document {
  id: string
  tenantId: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  fileHash?: string
  categoryId?: string
  categoryName?: string
  categoryColor?: string
  tags?: string[]
  description?: string
  uploadedBy: string
  uploadedByName?: string
  isPublic: boolean
  versionNumber: number
  status: 'active' | 'archived' | 'deleted'
  metadata?: Record<string, any>
  extractedText?: string
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'not_needed'
  ocrCompletedAt?: string
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  embeddingCompletedAt?: string

  // Geospatial fields
  location?: DocumentLocation
  locationCoordinatesLat?: number
  locationCoordinatesLng?: number
  locationAddress?: string
  locationCity?: string
  locationState?: string
  locationCountry?: string
  locationPostalCode?: string
  geojsonData?: any // GeoJSON for complex geometries
  geoAccuracy?: 'high' | 'medium' | 'low'
  geoSource?: 'exif' | 'address' | 'manual' | 'geocoded'
  geoExtractedAt?: string

  createdAt: string
  updatedAt: string
}

export interface DocumentCategory {
  id: string
  tenantId: string
  categoryName: string
  description?: string
  color: string
  icon?: string
  documentCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface DocumentGeoData {
  documentId: string
  fileName: string
  location?: DocumentLocation
  distanceMeters?: number
  categoryName?: string
  categoryColor?: string
}

export interface DocumentCluster {
  clusterId: number
  centerLat: number
  centerLng: number
  documentCount: number
  documents: DocumentGeoData[]
}

export interface DocumentHeatmapCell {
  lat: number
  lng: number
  intensity: number
  documentCount: number
}
