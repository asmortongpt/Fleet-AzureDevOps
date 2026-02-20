/**
 * Shared vehicle popup HTML builder for all map libraries
 * (Leaflet, Google Maps, Mapbox).
 *
 * Produces a charcoal-themed popup card with inline SVG icons,
 * status dot + badge, fuel progress bar, relative timestamp, etc.
 */

import type { Vehicle } from "@/lib/types"

// ---------------------------------------------------------------------------
// Status colour mapping
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",    // emerald
  idle: "#9ca3af",      // gray
  charging: "#10b981",  // emerald (treat like active)
  service: "#f59e0b",   // amber
  emergency: "#f43f5e", // rose
  offline: "#9ca3af",   // gray
}

function statusColor(status: string): string {
  return STATUS_COLORS[status] || "#9ca3af"
}

function statusLabel(status: string): string {
  if (!status) return "Unknown"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ---------------------------------------------------------------------------
// Fuel bar colour
// ---------------------------------------------------------------------------

function fuelBarColor(pct: number): string {
  if (pct >= 50) return "#10b981"
  if (pct >= 25) return "#f59e0b"
  return "#f43f5e"
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "—"
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 0) return "Just now"
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Odometer formatting (with commas)
// ---------------------------------------------------------------------------

function formatOdometer(value: number | null | undefined): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("en-US").format(Math.round(value)) + " mi"
}

// ---------------------------------------------------------------------------
// Inline SVG icons (16x16, stroke-based)
// ---------------------------------------------------------------------------

const SVG_USER = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`

const SVG_MAP_PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`

const SVG_FUEL = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 4"/><path d="M3 22h12"/><path d="M7 9h4"/></svg>`

const SVG_GAUGE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m14.7 10.7-3 2.2"/><path d="M12 6v2"/></svg>`

const SVG_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`

const SVG_TRUCK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.63l-3-3.53A1 1 0 0 0 14 10H12"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`

const SVG_ARROW_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

const POPUP_BG = "#242424"
const POPUP_BORDER = "rgba(255,255,255,0.1)"
const TEXT_PRIMARY = "#ffffff"
const TEXT_SECONDARY = "#9ca3af"
const SEPARATOR = "rgba(255,255,255,0.08)"
const FONT = "'Montserrat', system-ui, -apple-system, sans-serif"

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

/**
 * Build a professional vehicle popup HTML string for use in any map library.
 *
 * @param vehicle  The vehicle data object
 * @param escape   An HTML-escaping function (each map library may provide its own)
 * @returns        Raw HTML string
 */
export function buildVehiclePopupHTML(
  vehicle: Vehicle,
  escape: (s: string | null | undefined) => string
): string {
  const color = statusColor(vehicle.status)
  const label = statusLabel(vehicle.status)
  const fuel = typeof vehicle.fuelLevel === "number" ? Math.round(vehicle.fuelLevel) : null
  const odo = vehicle.mileage ?? vehicle.odometer ?? null
  const lastSeen = (vehicle as any).updatedAt ?? (vehicle as any).last_metric_update ?? null
  const fleetNum = vehicle.number || null
  const driverName = vehicle.driver || vehicle.assignedDriver || null
  const locationText =
    vehicle.location?.address ||
    (vehicle.location?.lat && vehicle.location?.lng
      ? `${vehicle.location.lat.toFixed(4)}, ${vehicle.location.lng.toFixed(4)}`
      : null)

  // --- Build rows ---

  // Fleet number subtitle
  const fleetNumHTML = fleetNum
    ? `<div style="font-size:11px;color:${TEXT_SECONDARY};margin-top:2px;">${SVG_TRUCK} <span style="vertical-align:middle;">${escape(fleetNum)}</span></div>`
    : ""

  // Driver row
  const driverHTML = driverName
    ? `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;">
      ${SVG_USER}
      <span style="color:${TEXT_PRIMARY};font-size:12px;">${escape(driverName)}</span>
    </div>`
    : `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;">
      ${SVG_USER}
      <span style="color:${TEXT_SECONDARY};font-size:12px;font-style:italic;">Unassigned</span>
    </div>`

  // Fuel row
  const fuelHTML =
    fuel !== null
      ? `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;">
      ${SVG_FUEL}
      <div style="flex:1;display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
          <div style="width:${Math.min(fuel, 100)}%;height:100%;background:${fuelBarColor(fuel)};border-radius:2px;"></div>
        </div>
        <span style="color:${TEXT_PRIMARY};font-size:11px;min-width:28px;text-align:right;">${fuel}%</span>
      </div>
    </div>`
      : ""

  // Odometer row
  const odoHTML =
    odo !== null
      ? `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;">
      ${SVG_GAUGE}
      <span style="color:${TEXT_PRIMARY};font-size:12px;">${formatOdometer(odo)}</span>
    </div>`
      : ""

  // Last seen row
  const lastSeenHTML = lastSeen
    ? `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;">
      ${SVG_CLOCK}
      <span style="color:${TEXT_SECONDARY};font-size:11px;">${relativeTime(lastSeen)}</span>
    </div>`
    : ""

  // Location row
  const locationHTML = locationText
    ? `
    <div style="display:flex;align-items:flex-start;gap:6px;padding:6px 0;">
      <span style="flex-shrink:0;margin-top:1px;">${SVG_MAP_PIN}</span>
      <span style="color:${TEXT_SECONDARY};font-size:11px;line-height:1.4;">${escape(locationText)}</span>
    </div>`
    : ""

  // --- Assemble popup ---

  return `
<div style="
  font-family:${FONT};
  max-width:280px;
  background:${POPUP_BG};
  border:1px solid ${POPUP_BORDER};
  border-radius:8px;
  padding:14px 16px 12px;
  color:${TEXT_PRIMARY};
  box-sizing:border-box;
">
  <!-- Header: name + status dot -->
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
    <div style="display:flex;align-items:center;gap:8px;min-width:0;">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
      <span style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escape(vehicle.name || "Unknown Vehicle")}</span>
    </div>
    <span style="
      font-size:10px;
      font-weight:600;
      text-transform:uppercase;
      letter-spacing:0.5px;
      padding:2px 8px;
      border-radius:4px;
      background:${color}20;
      color:${color};
      white-space:nowrap;
      flex-shrink:0;
    ">${label}</span>
  </div>
  ${fleetNumHTML}

  <!-- Separator -->
  <div style="height:1px;background:${SEPARATOR};margin:10px 0 8px;"></div>

  <!-- Info rows -->
  ${driverHTML}
  ${fuelHTML}
  ${odoHTML}
  ${lastSeenHTML}

  ${locationText ? `<div style="height:1px;background:${SEPARATOR};margin:4px 0;"></div>${locationHTML}` : ""}

  <!-- View Details button -->
  <div style="margin-top:10px;">
    <button
      onclick="window.dispatchEvent(new CustomEvent('vehicle-action', { detail: { action: 'viewDetails', vehicleId: '${escape(vehicle.id)}' } }))"
      style="
        width:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.12);
        color:${TEXT_PRIMARY};
        border-radius:6px;
        padding:7px 12px;
        font-size:12px;
        font-weight:500;
        cursor:pointer;
        font-family:${FONT};
        transition:background 0.15s;
      "
      onmouseover="this.style.background='rgba(255,255,255,0.14)'"
      onmouseout="this.style.background='rgba(255,255,255,0.08)'"
    >
      View Details ${SVG_ARROW_RIGHT}
    </button>
  </div>
</div>`
}
