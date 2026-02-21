/**
 * Vehicle type-specific SVG marker icons for Google Maps.
 *
 * Each vehicle type gets a unique silhouette inside a status-coloured circle marker.
 * This makes it instantly clear what TYPE of vehicle is at each location, while the
 * colour communicates STATUS.
 */

// ---------------------------------------------------------------------------
// Status colours (mirrors GoogleMap.tsx getVehicleColor)
// ---------------------------------------------------------------------------
export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  idle: '#6b7280',
  charging: '#06b6d4',
  service: '#f59e0b',
  emergency: '#ef4444',
  offline: '#374151',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6b7280';
}

// ---------------------------------------------------------------------------
// Vehicle-type icon paths (18x18 viewBox, white fill)
// Simplified silhouettes optimised for 28-32px rendered size.
// ---------------------------------------------------------------------------
const ICON_PATHS: Record<string, string> = {
  // Truck - cab + cargo bed
  truck:
    'M2 11V7a1 1 0 011-1h7v6H3a1 1 0 01-1-1zm8-5h3.2a1 1 0 01.8.4l2 3 .5.6v3a1 1 0 01-1 1h-1M10 6v7m-5 1a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  // Sedan - classic car shape
  sedan:
    'M3 11h12M4.5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11l1.5-4h9L15 11M5 7V5.5a.5.5 0 01.5-.5h7a.5.5 0 01.5.5V7',
  // SUV - taller car body
  suv:
    'M2 12h14M4 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM2 12V9a1 1 0 011-1h2l2-3h4l2 3h2a1 1 0 011 1v3',
  // Van - tall box shape
  van:
    'M2 12V6a1 1 0 011-1h8a1 1 0 011 1v1l2 2v3a1 1 0 01-1 1h-1M2 12h1m-1 0a1 1 0 001 1h1M4.5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  // Bus - long rectangular
  bus:
    'M1 12V5a1 1 0 011-1h14a1 1 0 011 1v7M1 12h16M1 12a1 1 0 001 1h1m13-1a1 1 0 01-1 1h-1M4 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6 4v4m4-4v4m4-4v4',
  // Emergency - ambulance cross
  emergency:
    'M7 3h4v4h4v4h-4v4H7v-4H3V7h4V3z',
  // Tractor - farm tractor
  tractor:
    'M3 10V7a2 2 0 012-2h4v5H3zm6-5h3l2 3v2h-5V5zM4 14a2 2 0 100-4 2 2 0 000 4zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  // Forklift - L-shape with forks
  forklift:
    'M4 4v9h3V4H4zm5 5v4h2V9H9zm4-5v8m0-8h3m-3 4h2',
  // Trailer - open rectangle
  trailer:
    'M1 6h14v6H1V6zm0 6h14M4 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 9h2',
  // Construction - excavator arm
  construction:
    'M2 14h5V9L4 6l3-2m0 0l4 5v5h3l1-4 1 4',
  // Motorcycle - bike shape
  motorcycle:
    'M4 12a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 10h3l2-4h2l1 2h2',
  // Specialty - gear/cog
  specialty:
    'M9 2l1.5 2L13 3l-.5 2.5L15 7l-2 1 .5 2.5-2.5-.5L9 12l-1.5-2L5 11l.5-2.5L3 7l2-1L4.5 3.5 7 4z',
};

// Fallback for unknown types → simple dot
const FALLBACK_PATH = 'M9 4a5 5 0 100 10 5 5 0 000-10z';

// ---------------------------------------------------------------------------
// Human-readable labels
// ---------------------------------------------------------------------------
export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  truck: 'Truck',
  van: 'Van',
  bus: 'Bus',
  emergency: 'Emergency',
  tractor: 'Tractor',
  forklift: 'Forklift',
  trailer: 'Trailer',
  construction: 'Construction',
  motorcycle: 'Motorcycle',
  specialty: 'Specialty',
};

// ---------------------------------------------------------------------------
// SVG marker generator
// ---------------------------------------------------------------------------

/**
 * Build a Google Maps marker icon object with a vehicle-type silhouette.
 *
 * @param vehicleType  e.g. "truck", "sedan"
 * @param statusColor  hex colour from status (e.g. "#10b981")
 * @param size         rendered size in pixels (default 32)
 */
export function buildVehicleMarkerIcon(
  vehicleType: string,
  statusColor: string,
  size = 32,
): google.maps.Icon {
  const svg = buildMarkerSvg(vehicleType, statusColor, size);
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

function buildMarkerSvg(type: string, color: string, size: number): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  // Marker is a circle with drop-shadow, containing a white vehicle icon
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.35"/>
    </filter>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="#fff" stroke-width="2" filter="url(#s)"/>
  <g transform="translate(${(size - 18) / 2},${(size - 18) / 2})" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="${iconPath}"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Selected-state marker (larger with pulse ring)
// ---------------------------------------------------------------------------
export function buildSelectedMarkerIcon(
  vehicleType: string,
  statusColor: string,
  size = 40,
): google.maps.Icon {
  const iconPath = ICON_PATHS[vehicleType] || FALLBACK_PATH;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="${statusColor}" stroke-width="2" opacity="0.4"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 5}" fill="${statusColor}" stroke="#fff" stroke-width="2.5" filter="url(#s)"/>
  <g transform="translate(${(size - 18) / 2},${(size - 18) / 2})" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="${iconPath}"/>
  </g>
</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}
