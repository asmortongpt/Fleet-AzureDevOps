/**
 * Icon creation utilities for Leaflet markers
 * Extracted from LeafletMap.tsx for better maintainability
 */

import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

/**
 * Color scheme for vehicle status indicators
 */
export const VEHICLE_STATUS_COLORS: Record<Vehicle["status"], string> = {
  active: "#10b981", // emerald-500
  idle: "#6b7280", // gray-500
  charging: "#3b82f6", // blue-500
  service: "#f59e0b", // amber-500
  emergency: "#ef4444", // red-500
  offline: "#374151", // gray-700
} as const

/**
 * Emoji icons for different vehicle types
 */
export const VEHICLE_TYPE_EMOJI: Record<Vehicle["type"], string> = {
  car: "🚗",
  truck: "🚚",
  van: "🚐",
  bus: "🚌",
} as const

/**
 * Emoji icons for facility types
 */
export const FACILITY_TYPE_ICONS: Record<GISFacility["type"], string> = {
  office: "🏢",
  depot: "🏭",
  "service-center": "🔧",
  "fueling-station": "⛽",
} as const

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ""
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Creates a custom vehicle marker icon
 */
export function createVehicleIcon(L: any, vehicle: Vehicle): any {
  if (!L) throw new Error("Leaflet not loaded")

  const color = VEHICLE_STATUS_COLORS[vehicle.status] || VEHICLE_STATUS_COLORS.idle
  const statusLabel = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)

  return L.divIcon({
    html: `
      <div
        style="
          background-color: ${color};
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        "
        onmouseover="this.style.transform='scale(1.4)'; this.style.boxShadow='0 2px 5px rgba(0, 0, 0, 0.4)'"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.3)'"
        role="button"
        tabindex="0"
        aria-label="Vehicle ${escapeHtml(vehicle.name)}, ${escapeHtml(vehicle.type)}, Status: ${statusLabel}"
      >
      </div>
    `,
    className: "vehicle-marker-icon",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  })
}

/**
 * Creates a custom facility marker icon
 */
export function createFacilityIcon(L: any, facility: GISFacility): any {
  if (!L) throw new Error("Leaflet not loaded")

  const color = facility.status === "operational" ? "#3b82f6" : facility.status === "maintenance" ? "#f59e0b" : "#6b7280"
  const statusLabel = facility.status.charAt(0).toUpperCase() + facility.status.slice(1)
  const typeLabel = facility.type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())

  return L.divIcon({
    html: `
      <div
        style="
          background-color: ${color};
          width: 12px;
          height: 12px;
          border-radius: 3px;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        "
        onmouseover="this.style.transform='scale(1.3)'; this.style.boxShadow='0 2px 5px rgba(0, 0, 0, 0.4)'"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.3)'"
        role="button"
        tabindex="0"
        aria-label="Facility ${escapeHtml(facility.name)}, Type: ${typeLabel}, Status: ${statusLabel}"
      >
      </div>
    `,
    className: "facility-marker-icon",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -9],
  })
}

/**
 * Creates a custom camera marker icon
 */
export function createCameraIcon(L: any, camera: TrafficCamera): any {
  if (!L) throw new Error("Leaflet not loaded")

  const color = camera.operational ? "#3b82f6" : "#6b7280"
  const statusLabel = camera.operational ? "Operational" : "Offline"

  return L.divIcon({
    html: `
      <div
        style="
          background-color: ${color};
          width: 8px;
          height: 8px;
          border-radius: 2px;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          ${camera.operational ? "" : "opacity: 0.6;"}
        "
        onmouseover="this.style.transform='scale(1.5)'; this.style.boxShadow='0 2px 5px rgba(0, 0, 0, 0.4)'"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.3)'"
        role="button"
        tabindex="0"
        aria-label="Traffic Camera ${escapeHtml(camera.name)}, Status: ${statusLabel}"
      >
      </div>
    `,
    className: "camera-marker-icon",
    iconSize: [8, 8],
    iconAnchor: [4, 4],
    popupAnchor: [0, -7],
  })
}
