/**
 * Shared vehicle popup HTML builder for all map libraries
 * (Leaflet, Google Maps, Mapbox).
 *
 * Produces a charcoal-themed popup card with inline SVG icons,
 * status dot + badge, vehicle type badge, health score gauge,
 * fuel progress bar, speed indicator, department, quick action
 * buttons, two-column detail grid, relative timestamp, etc.
 */

import type { Vehicle } from "@/lib/types"

// ---------------------------------------------------------------------------
// Status colour mapping
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",    // emerald
  idle: "#9ca3af",      // gray
  charging: "#06b6d4",  // cyan
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
// Vehicle type labels
// ---------------------------------------------------------------------------

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  truck: "Truck",
  van: "Van",
  emergency: "Emergency",
  specialty: "Specialty",
  tractor: "Tractor",
  forklift: "Forklift",
  trailer: "Trailer",
  construction: "Construction",
  bus: "Bus",
  motorcycle: "Motorcycle",
}

function vehicleTypeLabel(type: string | undefined): string {
  if (!type) return ""
  return VEHICLE_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

// ---------------------------------------------------------------------------
// Fuel type labels & icons
// ---------------------------------------------------------------------------

const FUEL_TYPE_LABELS: Record<string, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  cng: "CNG",
  propane: "Propane",
}

function fuelTypeLabel(fuelType: string | undefined): string {
  if (!fuelType) return ""
  return FUEL_TYPE_LABELS[fuelType] || fuelType.charAt(0).toUpperCase() + fuelType.slice(1)
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
// Health score colour
// ---------------------------------------------------------------------------

function healthScoreColor(score: number): string {
  if (score >= 80) return "#10b981"  // green
  if (score >= 50) return "#f59e0b"  // amber
  return "#f43f5e"                    // red
}

function healthScoreLabel(score: number): string {
  if (score >= 80) return "Good"
  if (score >= 50) return "Fair"
  return "Poor"
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "\u2014"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "\u2014"
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
  if (value == null) return "\u2014"
  return new Intl.NumberFormat("en-US").format(Math.round(value)) + " mi"
}

// ---------------------------------------------------------------------------
// Inline SVG icons (14x14, stroke-based)
// ---------------------------------------------------------------------------

const SVG_USER = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`

const SVG_MAP_PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`

const SVG_FUEL = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 4"/><path d="M3 22h12"/><path d="M7 9h4"/></svg>`

const SVG_GAUGE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m14.7 10.7-3 2.2"/><path d="M12 6v2"/></svg>`

const SVG_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`

const SVG_TRUCK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.63l-3-3.53A1 1 0 0 0 14 10H12"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`

const SVG_ARROW_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`

const SVG_SPEED = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0" /><path d="M12 12l4-4"/><path d="M12 7v1"/><path d="M7 12h1"/><path d="M17 12h-1"/><path d="M7.8 7.8l.7.7"/><path d="M16.2 7.8l-.7.7"/></svg>`

const SVG_HEART = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`

const SVG_BUILDING = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`

const SVG_ZAP = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`

const SVG_WRENCH = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`

const SVG_SEND = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`

const SVG_EYE = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

const POPUP_BG = "#242424"
const POPUP_BORDER = "rgba(255,255,255,0.1)"
const TEXT_PRIMARY = "#ffffff"
const TEXT_SECONDARY = "#9ca3af"
const TEXT_DIM = "rgba(255,255,255,0.4)"
const SEPARATOR = "rgba(255,255,255,0.08)"
const FONT = "'Montserrat', system-ui, -apple-system, sans-serif"

// ---------------------------------------------------------------------------
// Fuel type icon suffix (small inline indicator)
// ---------------------------------------------------------------------------

function fuelTypeIcon(fuelType: string | undefined): string {
  switch (fuelType) {
    case "electric": return SVG_ZAP
    case "hybrid": return SVG_ZAP
    default: return ""
  }
}

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

  const vType = vehicleTypeLabel(vehicle.type)
  const fType = fuelTypeLabel(vehicle.fuelType)
  const healthScore = typeof vehicle.health_score === "number" ? Math.round(vehicle.health_score) : null
  const speed = typeof vehicle.speed === "number" ? Math.round(vehicle.speed) : null
  const department = vehicle.department || null
  const makeModelYear =
    vehicle.make && vehicle.model
      ? `${vehicle.year || ""} ${vehicle.make} ${vehicle.model}`.trim()
      : null
  const escapedId = escape(vehicle.id)

  // --- Badges row (vehicle type + fuel type) ---
  const typeBadgeHTML = vType
    ? `<span style="
        font-size:9px;
        font-weight:600;
        text-transform:uppercase;
        letter-spacing:0.5px;
        padding:2px 6px;
        border-radius:3px;
        background:rgba(255,255,255,0.08);
        color:${TEXT_SECONDARY};
        white-space:nowrap;
      ">${escape(vType)}</span>`
    : ""

  const fuelTypeBadgeHTML = fType
    ? `<span style="
        font-size:9px;
        font-weight:600;
        text-transform:uppercase;
        letter-spacing:0.5px;
        padding:2px 6px;
        border-radius:3px;
        background:${vehicle.fuelType === "electric" ? "rgba(16,185,129,0.12)" : vehicle.fuelType === "hybrid" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)"};
        color:${vehicle.fuelType === "electric" ? "#10b981" : vehicle.fuelType === "hybrid" ? "#f59e0b" : TEXT_DIM};
        white-space:nowrap;
        display:inline-flex;
        align-items:center;
        gap:3px;
      ">${fuelTypeIcon(vehicle.fuelType)}${escape(fType)}</span>`
    : ""

  const badgesRowHTML = (typeBadgeHTML || fuelTypeBadgeHTML)
    ? `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;">${typeBadgeHTML}${fuelTypeBadgeHTML}</div>`
    : ""

  // --- Health score gauge ---
  const healthGaugeHTML = healthScore !== null
    ? (() => {
        const hColor = healthScoreColor(healthScore)
        const hLabel = healthScoreLabel(healthScore)
        return `
    <div style="padding:6px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:5px;">
          ${SVG_HEART}
          <span style="color:${TEXT_SECONDARY};font-size:11px;">Health</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="color:${hColor};font-size:11px;font-weight:600;">${healthScore}</span>
          <span style="color:${TEXT_DIM};font-size:10px;">/ 100</span>
          <span style="
            font-size:9px;
            font-weight:600;
            padding:1px 5px;
            border-radius:3px;
            background:${hColor}18;
            color:${hColor};
            margin-left:2px;
          ">${hLabel}</span>
        </div>
      </div>
      <div style="width:100%;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
        <div style="width:${Math.min(healthScore, 100)}%;height:100%;background:${hColor};border-radius:3px;transition:width 0.3s ease;"></div>
      </div>
    </div>`
      })()
    : ""

  // --- Fleet number + make/model subtitle ---
  const subtitleParts: string[] = []
  if (fleetNum) subtitleParts.push(escape(fleetNum))
  if (makeModelYear) subtitleParts.push(escape(makeModelYear))

  const subtitleHTML = subtitleParts.length > 0
    ? `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:${TEXT_SECONDARY};margin-top:2px;">
        ${SVG_TRUCK}
        <span style="vertical-align:middle;">${subtitleParts.join(" \u2022 ")}</span>
      </div>`
    : ""

  // --- Two-column detail grid rows ---

  // Driver cell
  const driverCellHTML = `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_USER}
      <span style="color:${driverName ? TEXT_PRIMARY : TEXT_SECONDARY};font-size:11px;${driverName ? "" : "font-style:italic;"}overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${driverName ? escape(driverName) : "Unassigned"}</span>
    </div>`

  // Department cell
  const deptCellHTML = department
    ? `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_BUILDING}
      <span style="color:${TEXT_PRIMARY};font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escape(department)}</span>
    </div>`
    : `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_BUILDING}
      <span style="color:${TEXT_DIM};font-size:11px;font-style:italic;">No dept</span>
    </div>`

  // Odometer cell
  const odoCellHTML = `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_GAUGE}
      <span style="color:${odo !== null ? TEXT_PRIMARY : TEXT_DIM};font-size:11px;">${formatOdometer(odo)}</span>
    </div>`

  // Speed cell
  const speedCellHTML = speed !== null
    ? `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_SPEED}
      <span style="color:${speed > 0 ? TEXT_PRIMARY : TEXT_SECONDARY};font-size:11px;font-weight:${speed > 0 ? "600" : "400"};">${speed} mph</span>
    </div>`
    : `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_SPEED}
      <span style="color:${TEXT_DIM};font-size:11px;">\u2014</span>
    </div>`

  // Last seen cell
  const lastSeenCellHTML = `
    <div style="display:flex;align-items:center;gap:5px;min-width:0;">
      ${SVG_CLOCK}
      <span style="color:${TEXT_SECONDARY};font-size:11px;">${relativeTime(lastSeen)}</span>
    </div>`

  // Fuel row (full-width with progress bar)
  const fuelHTML =
    fuel !== null
      ? `
    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;">
      ${SVG_FUEL}
      <div style="flex:1;display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
          <div style="width:${Math.min(fuel, 100)}%;height:100%;background:${fuelBarColor(fuel)};border-radius:2px;"></div>
        </div>
        <span style="color:${TEXT_PRIMARY};font-size:11px;min-width:28px;text-align:right;">${fuel}%</span>
      </div>
    </div>`
      : ""

  // Location row
  const locationHTML = locationText
    ? `
    <div style="display:flex;align-items:flex-start;gap:6px;padding:4px 0;">
      <span style="flex-shrink:0;margin-top:1px;">${SVG_MAP_PIN}</span>
      <span style="color:${TEXT_SECONDARY};font-size:11px;line-height:1.4;">${escape(locationText)}</span>
    </div>`
    : ""

  // --- Quick action buttons ---
  const btnBase = `
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:4px;
    flex:1;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.1);
    color:${TEXT_SECONDARY};
    border-radius:5px;
    padding:6px 4px;
    font-size:10px;
    font-weight:500;
    cursor:pointer;
    font-family:${FONT};
    transition:all 0.15s;
    white-space:nowrap;
  `

  const actionBtnsHTML = `
    <div style="display:flex;gap:6px;margin-top:10px;">
      <button
        onclick="window.dispatchEvent(new CustomEvent('vehicle-action', { detail: { action: 'viewDetails', vehicleId: '${escapedId}' } }))"
        style="${btnBase}"
        onmouseover="this.style.background='rgba(16,185,129,0.15)';this.style.color='#10b981';this.style.borderColor='rgba(16,185,129,0.3)'"
        onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.color='${TEXT_SECONDARY}';this.style.borderColor='rgba(255,255,255,0.1)'"
      >${SVG_EYE} Details</button>
      <button
        onclick="window.dispatchEvent(new CustomEvent('vehicle-action', { detail: { action: 'dispatch', vehicleId: '${escapedId}' } }))"
        style="${btnBase}"
        onmouseover="this.style.background='rgba(6,182,212,0.15)';this.style.color='#06b6d4';this.style.borderColor='rgba(6,182,212,0.3)'"
        onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.color='${TEXT_SECONDARY}';this.style.borderColor='rgba(255,255,255,0.1)'"
      >${SVG_SEND} Dispatch</button>
      <button
        onclick="window.dispatchEvent(new CustomEvent('vehicle-action', { detail: { action: 'maintenance', vehicleId: '${escapedId}' } }))"
        style="${btnBase}"
        onmouseover="this.style.background='rgba(245,158,11,0.15)';this.style.color='#f59e0b';this.style.borderColor='rgba(245,158,11,0.3)'"
        onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.color='${TEXT_SECONDARY}';this.style.borderColor='rgba(255,255,255,0.1)'"
      >${SVG_WRENCH} Maint.</button>
    </div>`

  // --- Assemble popup ---

  return `
<div style="
  font-family:${FONT};
  max-width:320px;
  min-width:280px;
  background:${POPUP_BG};
  border:1px solid ${POPUP_BORDER};
  border-radius:10px;
  padding:14px 16px 12px;
  color:${TEXT_PRIMARY};
  box-sizing:border-box;
  box-shadow:0 8px 32px rgba(0,0,0,0.4);
">
  <!-- Header: name + status dot + status badge -->
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
    <div style="display:flex;align-items:center;gap:8px;min-width:0;">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;box-shadow:0 0 6px ${color}60;"></span>
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

  <!-- Subtitle: fleet# + make/model/year -->
  ${subtitleHTML}

  <!-- Vehicle type + fuel type badges -->
  ${badgesRowHTML}

  <!-- Separator -->
  <div style="height:1px;background:${SEPARATOR};margin:10px 0 8px;"></div>

  <!-- Health score gauge -->
  ${healthGaugeHTML}

  <!-- Two-column detail grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;padding:${healthGaugeHTML ? "4px" : "0"} 0 4px;">
    ${driverCellHTML}
    ${deptCellHTML}
    ${odoCellHTML}
    ${speedCellHTML}
    ${lastSeenCellHTML}
    <div></div>
  </div>

  <!-- Fuel bar (full-width) -->
  ${fuelHTML}

  <!-- Location -->
  ${locationText ? `<div style="height:1px;background:${SEPARATOR};margin:4px 0;"></div>${locationHTML}` : ""}

  <!-- Quick action buttons -->
  ${actionBtnsHTML}
</div>`
}
