/**
 * Format database enum/snake_case values into human-readable labels.
 *
 * Examples:
 *   "in_transit"      → "In Transit"
 *   "PENDING_REVIEW"  → "Pending Review"
 *   "full_time"       → "Full Time"
 *   "inProgress"      → "In Progress"
 */
/** Well-known fleet acronyms that should stay uppercase. */
const ACRONYMS: Record<string, string> = {
  suv: 'SUV',
  ev: 'EV',
  cng: 'CNG',
  cdl: 'CDL',
  vin: 'VIN',
  pto: 'PTO',
  hos: 'HOS',
  dot: 'DOT',
  eld: 'ELD',
  obd: 'OBD',
  gps: 'GPS',
  api: 'API',
  url: 'URL',
  eta: 'ETA',
  mpg: 'MPG',
  id: 'ID',
}

export function formatEnum(value: string | null | undefined): string {
  if (!value) return '—'
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(w => ACRONYMS[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format a field name (snake_case column name) into a human-readable label.
 *
 * Examples:
 *   "employment_type" → "Employment Type"
 *   "hos_status"      → "HOS Status"
 */
export function formatFieldLabel(value: string | null | undefined): string {
  if (!value) return '—'
  const specialCases: Record<string, string> = {
    hos: 'HOS',
    id: 'ID',
    vin: 'VIN',
    cdl: 'CDL',
    dot: 'DOT',
    eld: 'ELD',
    obd: 'OBD',
    gps: 'GPS',
    api: 'API',
    url: 'URL',
    eta: 'ETA',
    mpg: 'MPG',
  }
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => specialCases[w.toLowerCase()] || w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
