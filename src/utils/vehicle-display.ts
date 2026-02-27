/**
 * Standardized vehicle display name formatting.
 * Ensures consistent naming across all components.
 */

export function formatVehicleName(v: { year?: number; make?: string; model?: string; number?: string }): string {
  // Build: "2024 Ford F-150 (#FL-1001)" with graceful fallbacks
  const parts: string[] = []
  if (v.year) parts.push(String(v.year))
  if (v.make) parts.push(v.make)
  if (v.model) parts.push(v.model)
  const base = parts.join(' ')
  if (base && v.number) return `${base} (#${v.number})`
  if (base) return base
  if (v.number) return `#${v.number}`
  return 'Unknown Vehicle'
}

export function formatVehicleShortName(v: { make?: string; model?: string; number?: string }): string {
  // Compact: "F-150 #FL-1001" for table cells, map labels
  if (v.model && v.number) return `${v.model} #${v.number}`
  if (v.make && v.model) return `${v.make} ${v.model}`
  if (v.number) return `#${v.number}`
  if (v.model) return v.model
  return 'Unknown'
}

export function formatVehicleSubtitle(v: { vin?: string; license_plate?: string; type?: string }): string {
  // "VIN: 1HGCM82633A004352 · Plate: ABC-1234 · Sedan"
  const parts: string[] = []
  if (v.vin) parts.push(`VIN: ${v.vin}`)
  if (v.license_plate) parts.push(`Plate: ${v.license_plate}`)
  if (v.type) parts.push(v.type.charAt(0).toUpperCase() + v.type.slice(1))
  return parts.join(' \u00b7 ') || '\u2014'
}
