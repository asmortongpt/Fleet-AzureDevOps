/**
 * API Utility Functions for VirtualGarage
 *
 * Centralized API calls for damage reports, inspections, and telemetry.
 */

export interface OBD2Telemetry {
  vehicleId: string
  timestamp: string
  rpm: number
  speed: number
  coolantTemp: number
  fuelLevel: number
  batteryVoltage: number
  engineLoad: number
  checkEngineLight: boolean
  dtcCodes?: string[]
}

export interface DamageReport {
  id: string
  asset_id: string
  vehicle_id?: string
  reported_date: string
  description: string
  severity: "minor" | "moderate" | "severe"
  photos: string[]
  triposr_model_url?: string
  triposr_task_id?: string
  triposr_status?: "pending" | "processing" | "completed" | "failed"
  location?: string
}

export interface Inspection {
  id: string
  asset_id: string
  vehicle_id?: string
  inspection_date: string
  inspection_type: "pre_trip" | "post_trip" | "safety" | "equipment"
  status: "pass" | "fail" | "needs_repair"
  photos: string[]
  defects_found?: string
  odometer_reading?: number
  engine_hours?: number
}

/**
 * Fetch real-time OBD2 telemetry for a specific vehicle
 */
export async function fetchVehicleTelemetry(vehicleId: string): Promise<OBD2Telemetry | null> {
  if (!vehicleId) return null
  try {
    const response = await fetch(`/api/emulator/vehicles/${vehicleId}/telemetry`)
    if (!response.ok) return null
    const data = await response.json()
    if (data.success && data.data) {
      return data.data as OBD2Telemetry
    }
    return null
  } catch (error) {
    console.error("Error fetching telemetry:", error)
    return null
  }
}

/**
 * Fetch damage reports from API
 */
export async function fetchDamageReports(): Promise<DamageReport[]> {
  try {
    const response = await fetch("/api/damage-reports")
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}

/**
 * Fetch inspections from API
 */
export async function fetchInspections(): Promise<Inspection[]> {
  try {
    const response = await fetch("/api/inspections")
    if (!response.ok) return []
    return response.json()
  } catch {
    return []
  }
}

/**
 * Submit TripoSR 3D model generation request
 */
export async function submitTripoSRRequest(
  formData: FormData
): Promise<{ task_id: string; status: string }> {
  const response = await fetch("/api/triposr/generate", {
    method: "POST",
    body: formData
  })
  if (!response.ok) throw new Error("Failed to submit to TripoSR")
  return response.json()
}
