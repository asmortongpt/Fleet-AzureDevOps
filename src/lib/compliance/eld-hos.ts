/**
 * ELD/HOS Compliance - Electronic Logging Device / Hours of Service
 * Commercial operations compliance for DOT regulations
 */

export interface HOSLog {
  driverId: string
  date: string
  dutyStatus: "off-duty" | "sleeper" | "driving" | "on-duty"
  startTime: string
  endTime: string
  duration: number // minutes
  location: { lat: number; lng: number; address: string }
  odometer: number
  notes?: string
}

export interface DVIRReport {
  id: string
  vehicleId: string
  driverId: string
  type: "pre-trip" | "post-trip"
  defectsFound: boolean
  defects: {
    component: string
    description: string
    severity: "minor" | "major" | "critical"
  }[]
  signature: string
  timestamp: string
}

export interface DOTReport {
  type: "weekly" | "monthly" | "annual"
  period: { start: string; end: string }
  violations: number
  totalHours: number
  totalMiles: number
}
