/**
 * Mobile App Types - React Native offline-first architecture
 * Field-grade features: assignments, PTT, damage reporting, receipt capture, keyless entry
 */

export interface MobileAssignment {
  id: string
  vehicleId: string
  driverId: string
  type: "delivery" | "pickup" | "service" | "inspection"
  status: "pending" | "in-progress" | "completed"
  offline: boolean
  syncedAt?: string
}

export interface DamageReport {
  id: string
  vehicleId: string
  severity: "minor" | "moderate" | "major" | "critical"
  location3D?: { x: number; y: number; z: number }
  photos: string[]
  videos: string[]
  description: string
  autoWODraft: boolean
  timestamp: string
}

export interface ReceiptCapture {
  id: string
  type: "fuel" | "charging" | "toll" | "parking" | "parts"
  photo: string
  ocrData: {
    merchant: string
    amount: number
    date: string
    items: { description: string; amount: number }[]
    confidence: number
  }
  autoMatched: boolean
  ledgerEntryId?: string
}

export interface KeylessEntry {
  vehicleId: string
  action: "lock" | "unlock" | "start-engine" | "start-charge"
  method: "BLE" | "NFC" | "Smartcar"
  requiresMFA: boolean
  requiresHITL: boolean
  authorization: string
}

export interface OSHACheckIn {
  id: string
  employeeId: string
  siteId: string
  method: "QR" | "NFC" | "geofence" | "manual"
  type: "check-in" | "check-out"
  loneWorker: boolean
  timerMinutes?: number
  location: { lat: number; lng: number }
  timestamp: string
}

export interface HomeChargeCapture {
  id: string
  driverId: string
  chargerPhoto: string
  utilityBillPhoto?: string
  ocrData: {
    kWh: number
    cost: number
    date: string
    confidence: number
  }
  reimbursementAmount: number
  status: "pending" | "approved" | "paid"
}
