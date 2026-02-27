/**
 * Vehicle map markers — professional flat design with data overlays.
 *
 * Three marker shapes: pin (teardrop), circle, badge (rounded-rect).
 * Three sizes: small, medium, large.
 * Optional fuel/battery level ring and heading indicator.
 */

import type { MarkerStyle, MarkerSize } from '@/stores/useMapMarkerSettings';

export type { MarkerStyle, MarkerSize };

/** Optional vehicle data for enhanced marker rendering */
export interface VehicleMarkerData {
  fuelPercent?: number;   // 0–100, renders as outer arc ring
  batteryPercent?: number; // 0–100, fallback if no fuelPercent
  speed?: number;          // mph, renders as small badge below marker
  heading?: number;        // 0–360 degrees, renders as direction arrow
}

// ---------------------------------------------------------------------------
// Status colours (no blue, no purple, no indigo)
// ---------------------------------------------------------------------------
export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  idle: '#6b7280',
  charging: '#10b981',
  service: '#f59e0b',
  emergency: '#ef4444',
  offline: '#374151',
  assigned: '#a3a3a3',
  dispatched: '#fb923c',
  en_route: '#34d399',
  on_site: '#facc15',
  completed: '#34d399',
  maintenance: '#f59e0b',
  retired: '#6b7280',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  charging: 'Charging',
  service: 'In Service',
  emergency: 'Emergency',
  offline: 'Offline',
  assigned: 'Assigned',
  dispatched: 'Dispatched',
  en_route: 'En Route',
  on_site: 'On Site',
  completed: 'Completed',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6b7280';
}

// ---------------------------------------------------------------------------
// Improved vehicle-type icon paths (18×18 viewBox)
// Cleaner, more detailed, stroke-based with better proportions
// ---------------------------------------------------------------------------
const ICON_PATHS: Record<string, string> = {
  truck:
    'M2 11V7a1 1 0 011-1h7v6H3a1 1 0 01-1-1zm8-5h3.2a1 1 0 01.8.4l2 3 .5.6v3a1 1 0 01-1 1h-1M10 6v7m-5 1a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  sedan:
    'M3 11h12M4.5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm9 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3 11l1.5-4h9L15 11M5 7V5.5a.5.5 0 01.5-.5h7a.5.5 0 01.5.5V7',
  suv:
    'M2 12h14M4 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM2 12V9a1 1 0 011-1h2l2-3h4l2 3h2a1 1 0 011 1v3',
  van:
    'M2 12V6a1 1 0 011-1h8a1 1 0 011 1v1l2 2v3a1 1 0 01-1 1h-1M2 12h1m-1 0a1 1 0 001 1h1M4.5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  bus:
    'M1 12V5a1 1 0 011-1h14a1 1 0 011 1v7M1 12h16M1 12a1 1 0 001 1h1m13-1a1 1 0 01-1 1h-1M4 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6 4v4m4-4v4m4-4v4',
  emergency:
    'M7 3h4v4h4v4h-4v4H7v-4H3V7h4V3z',
  tractor:
    'M3 10V7a2 2 0 012-2h4v5H3zm6-5h3l2 3v2h-5V5zM4 14a2 2 0 100-4 2 2 0 000 4zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  forklift:
    'M4 4v9h3V4H4zm5 5v4h2V9H9zm4-5v8m0-8h3m-3 4h2',
  trailer:
    'M1 6h14v6H1V6zm0 6h14M4 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 9h2',
  construction:
    'M2 14h5V9L4 6l3-2m0 0l4 5v5h3l1-4 1 4',
  motorcycle:
    'M4 12a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4zM4 10h3l2-4h2l1 2h2',
  specialty:
    'M9 2l1.5 2L13 3l-.5 2.5L15 7l-2 1 .5 2.5-2.5-.5L9 12l-1.5-2L5 11l.5-2.5L3 7l2-1L4.5 3.5 7 4z',
};

const FALLBACK_PATH = 'M9 4a5 5 0 100 10 5 5 0 000-10z';

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
// Colour helpers
// ---------------------------------------------------------------------------
function lightenHex(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * pct / 100));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * pct / 100));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * pct / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenHex(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * pct / 100));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * pct / 100));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * pct / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Get fuel/battery colour: green ≥50, amber 25-49, red <25 */
function fuelColor(pct: number): string {
  if (pct >= 50) return '#10b981';
  if (pct >= 25) return '#f59e0b';
  return '#ef4444';
}

// ---------------------------------------------------------------------------
// Size configuration — slightly larger for better readability
// ---------------------------------------------------------------------------
interface SizeCfg {
  pin: [number, number];    // [width, height]
  circle: number;           // diameter
  badge: [number, number];  // [width, height]
  iconStroke: number;
  haloExtra: number;
  borderW: number;
  selectedScale: number;
  fuelRingW: number;        // fuel arc ring stroke width
  fuelRingGap: number;      // gap between marker and fuel ring
  speedBadgeH: number;      // height of speed badge below marker
}

const SIZE_CFG: Record<MarkerSize, SizeCfg> = {
  small:  { pin: [30, 40], circle: 28, badge: [30, 38], iconStroke: 1.4, haloExtra: 1.2, borderW: 1.5, selectedScale: 1.3, fuelRingW: 2, fuelRingGap: 2, speedBadgeH: 10 },
  medium: { pin: [38, 50], circle: 36, badge: [38, 48], iconStroke: 1.8, haloExtra: 1.4, borderW: 2.0, selectedScale: 1.2, fuelRingW: 2.5, fuelRingGap: 2.5, speedBadgeH: 12 },
  large:  { pin: [46, 60], circle: 44, badge: [46, 58], iconStroke: 2.2, haloExtra: 1.6, borderW: 2.5, selectedScale: 1.15, fuelRingW: 3, fuelRingGap: 3, speedBadgeH: 14 },
};

// ---------------------------------------------------------------------------
// SVG helpers
// ---------------------------------------------------------------------------

/** Build SVG arc path for a partial circle (fuel/battery gauge) */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${start.x} ${start.y} A${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Fuel arc ring SVG overlay */
function buildFuelRing(cx: number, cy: number, r: number, pct: number, strokeW: number): string {
  if (pct <= 0) return '';
  const clampedPct = Math.min(100, Math.max(0, pct));
  const sweepAngle = (clampedPct / 100) * 360;
  const color = fuelColor(clampedPct);
  // Background track (dim)
  const track = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${strokeW}"/>`;
  if (clampedPct >= 100) {
    return `${track}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" opacity="0.8"/>`;
  }
  const path = arcPath(cx, cy, r, 0, sweepAngle);
  return `${track}<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" opacity="0.85"/>`;
}

/** Heading direction triangle */
function buildHeadingArrow(cx: number, cy: number, r: number, heading: number, color: string): string {
  const rad = ((heading - 90) * Math.PI) / 180;
  const tipX = cx + (r + 4) * Math.cos(rad);
  const tipY = cy + (r + 4) * Math.sin(rad);
  const size = 3;
  const perpRad = rad + Math.PI / 2;
  const baseX1 = cx + (r - 1) * Math.cos(rad) + size * Math.cos(perpRad);
  const baseY1 = cy + (r - 1) * Math.sin(rad) + size * Math.sin(perpRad);
  const baseX2 = cx + (r - 1) * Math.cos(rad) - size * Math.cos(perpRad);
  const baseY2 = cy + (r - 1) * Math.sin(rad) - size * Math.sin(perpRad);
  return `<polygon points="${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}" fill="${color}" opacity="0.9"/>`;
}

/** Speed badge below marker */
function buildSpeedBadge(cx: number, bottomY: number, speed: number, badgeH: number): string {
  const text = `${Math.round(speed)}`;
  const badgeW = text.length * 5.5 + 10;
  const x = cx - badgeW / 2;
  const y = bottomY + 2;
  return `<rect x="${x}" y="${y}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="#242424" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
  <text x="${cx}" y="${y + badgeH * 0.72}" fill="white" font-size="${badgeH * 0.65}" font-weight="600" font-family="system-ui,sans-serif" text-anchor="middle" letter-spacing="0.3">${text}</text>`;
}

// ---------------------------------------------------------------------------
// Shared SVG <defs> — clean matte style
// ---------------------------------------------------------------------------
function buildDefs(color: string, borderW: number): string {
  const lighter = lightenHex(color, 15);
  const darker = darkenHex(color, 10);
  return `<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lighter}"/>
      <stop offset="100%" stop-color="${darker}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.4" cy="0.35" r="0.5">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-10%" width="140%" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${borderW * 0.6}"/>
      <feOffset dy="${borderW * 0.5}" result="off"/>
      <feComponentTransfer in="off"><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

// ---------------------------------------------------------------------------
// Icon rendering — dual-layer for clarity
// ---------------------------------------------------------------------------
function buildIconGroup(iconPath: string, cx: number, cy: number, iconStroke: number, haloExtra: number): string {
  const ix = cx - 9;
  const iy = cy - 9.5;
  return `<g transform="translate(${ix},${iy})">
    <path d="${iconPath}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="${iconStroke + haloExtra}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${iconPath}" fill="none" stroke="#fff" stroke-width="${iconStroke}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// PIN shape
// ---------------------------------------------------------------------------
function buildPinPath(cx: number, cy: number, r: number, tipY: number): string {
  const dx = Math.round(r * 0.38);
  const midY = Math.round(cy + r + (tipY - cy - r) * 0.35);
  return `M${cx} ${tipY}C${cx - dx} ${midY} ${cx - r} ${cy + r - 1} ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}C${cx + r} ${cy + r - 1} ${cx + dx} ${midY} ${cx} ${tipY}Z`;
}

function svgPin(type: string, color: string, w: number, h: number, cfg: SizeCfg, data?: VehicleMarkerData): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  const pad = data?.fuelPercent != null ? cfg.fuelRingGap + cfg.fuelRingW + 1 : 0;
  const totalW = w + pad * 2;
  const speedExtra = data?.speed != null ? cfg.speedBadgeH + 3 : 0;
  const totalH = h + pad + speedExtra;
  const ox = pad; // offset for fuel ring padding

  const cx = Math.round(w / 2) + ox;
  const r = Math.round(w / 2) - 4;
  const cy = r + 4 + (pad > 0 ? 1 : 0);
  const tipY = h - 2 + (pad > 0 ? 1 : 0);
  const pinD = buildPinPath(cx, cy, r, tipY);

  let extras = '';
  // Fuel ring
  if (data?.fuelPercent != null) {
    const fuelR = r + cfg.fuelRingGap + cfg.fuelRingW / 2;
    extras += buildFuelRing(cx, cy, fuelR, data.fuelPercent, cfg.fuelRingW);
  }
  // Heading arrow
  if (data?.heading != null && data.heading >= 0) {
    const arrowR = r + (pad > 0 ? cfg.fuelRingGap + cfg.fuelRingW + 1 : 3);
    extras += buildHeadingArrow(cx, cy, arrowR, data.heading, color);
  }
  // Speed badge
  let speedSvg = '';
  if (data?.speed != null && data.speed > 0) {
    speedSvg = buildSpeedBadge(cx, tipY, data.speed, cfg.speedBadgeH);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  ${buildDefs(color, cfg.borderW)}
  ${extras}
  <path d="${pinD}" fill="url(#g)" stroke="rgba(255,255,255,0.7)" stroke-width="${cfg.borderW}" filter="url(#s)"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="url(#h)"/>
  ${buildIconGroup(iconPath, cx, cy, cfg.iconStroke, cfg.haloExtra)}
  ${speedSvg}
</svg>`;
}

// ---------------------------------------------------------------------------
// CIRCLE shape
// ---------------------------------------------------------------------------
function svgCircle(type: string, color: string, d: number, cfg: SizeCfg, data?: VehicleMarkerData): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  const pad = data?.fuelPercent != null ? cfg.fuelRingGap + cfg.fuelRingW + 1 : 0;
  const totalD = d + pad * 2;
  const speedExtra = data?.speed != null ? cfg.speedBadgeH + 3 : 0;
  const totalH = totalD + speedExtra;

  const c = Math.round(totalD / 2);
  const r = Math.round(d / 2) - 2;

  let extras = '';
  if (data?.fuelPercent != null) {
    const fuelR = r + cfg.fuelRingGap + cfg.fuelRingW / 2;
    extras += buildFuelRing(c, c, fuelR, data.fuelPercent, cfg.fuelRingW);
  }
  if (data?.heading != null && data.heading >= 0) {
    const arrowR = r + (pad > 0 ? cfg.fuelRingGap + cfg.fuelRingW + 1 : 3);
    extras += buildHeadingArrow(c, c, arrowR, data.heading, color);
  }
  let speedSvg = '';
  if (data?.speed != null && data.speed > 0) {
    speedSvg = buildSpeedBadge(c, totalD, data.speed, cfg.speedBadgeH);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalD}" height="${totalH}" viewBox="0 0 ${totalD} ${totalH}">
  ${buildDefs(color, cfg.borderW)}
  ${extras}
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)" stroke="rgba(255,255,255,0.7)" stroke-width="${cfg.borderW}" filter="url(#s)"/>
  <circle cx="${c}" cy="${c}" r="${r - 1}" fill="url(#h)"/>
  ${buildIconGroup(iconPath, c, c, cfg.iconStroke, cfg.haloExtra)}
  ${speedSvg}
</svg>`;
}

// ---------------------------------------------------------------------------
// BADGE shape (rounded rect + pointer)
// ---------------------------------------------------------------------------
function svgBadge(type: string, color: string, w: number, h: number, cfg: SizeCfg, data?: VehicleMarkerData): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  const bodyH = h - 10;
  const cr = 5;
  const cx = Math.round(w / 2);
  const bodyCy = Math.round(bodyH / 2) + 2;
  const rr = w - 4;
  const pw = 5;
  const badgeD = [
    `M${cr + 2} 2`,
    `h${rr - 2 * cr}`,
    `a${cr} ${cr} 0 01${cr} ${cr}`,
    `v${bodyH - 2 * cr}`,
    `a${cr} ${cr} 0 01-${cr} ${cr}`,
    `h-${Math.round((rr - 2 * cr) / 2) - pw}`,
    `l-${pw} 8`,
    `l-${pw} -8`,
    `h-${Math.round((rr - 2 * cr) / 2) - pw}`,
    `a${cr} ${cr} 0 01-${cr}-${cr}`,
    `V${cr + 2}`,
    `a${cr} ${cr} 0 01${cr}-${cr}`,
    'z',
  ].join('');

  // Fuel bar at bottom of badge body
  let fuelBar = '';
  if (data?.fuelPercent != null) {
    const pct = Math.min(100, Math.max(0, data.fuelPercent));
    const barW = w - 10;
    const fillW = (pct / 100) * barW;
    const barY = bodyH - 2;
    fuelBar = `<rect x="5" y="${barY}" width="${barW}" height="2.5" rx="1.25" fill="rgba(255,255,255,0.1)"/>
    <rect x="5" y="${barY}" width="${fillW}" height="2.5" rx="1.25" fill="${fuelColor(pct)}" opacity="0.85"/>`;
  }

  const speedExtra = data?.speed != null ? cfg.speedBadgeH + 3 : 0;
  const totalH = h + speedExtra;
  let speedSvg = '';
  if (data?.speed != null && data.speed > 0) {
    speedSvg = buildSpeedBadge(cx, h, data.speed, cfg.speedBadgeH);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${totalH}" viewBox="0 0 ${w} ${totalH}">
  ${buildDefs(color, cfg.borderW)}
  <path d="${badgeD}" fill="url(#g)" stroke="rgba(255,255,255,0.7)" stroke-width="${cfg.borderW}" filter="url(#s)"/>
  <rect x="4" y="4" width="${w - 8}" height="${bodyH - 4}" rx="${cr - 1}" fill="url(#h)"/>
  ${buildIconGroup(iconPath, cx, bodyCy - 1, cfg.iconStroke, cfg.haloExtra)}
  ${fuelBar}
  ${speedSvg}
</svg>`;
}

// ---------------------------------------------------------------------------
// SVG → data URI
// ---------------------------------------------------------------------------
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a Google Maps marker icon.
 *
 * @param vehicleType  e.g. "truck", "sedan"
 * @param statusColor  hex colour from status
 * @param style        'pin' | 'circle' | 'badge'
 * @param size         'small' | 'medium' | 'large'
 * @param data         optional vehicle data for enhanced rendering
 */
export function buildVehicleMarkerIcon(
  vehicleType: string,
  statusColor: string,
  style: MarkerStyle = 'pin',
  size: MarkerSize = 'medium',
  data?: VehicleMarkerData,
): google.maps.Icon {
  const cfg = SIZE_CFG[size];
  let svg: string;
  let w: number;
  let h: number;

  const hasFuel = data?.fuelPercent != null;
  const hasSpeed = data?.speed != null && data.speed > 0;
  const pad = hasFuel && style !== 'badge' ? cfg.fuelRingGap + cfg.fuelRingW + 1 : 0;
  const speedExtra = hasSpeed ? cfg.speedBadgeH + 3 : 0;

  switch (style) {
    case 'circle': {
      const d = cfg.circle;
      svg = svgCircle(vehicleType, statusColor, d, cfg, data);
      w = d + pad * 2;
      h = d + pad * 2 + speedExtra;
      break;
    }
    case 'badge': {
      [w, h] = cfg.badge;
      svg = svgBadge(vehicleType, statusColor, w, h, cfg, data);
      h = h + speedExtra;
      break;
    }
    default: { // pin
      const [pw, ph] = cfg.pin;
      svg = svgPin(vehicleType, statusColor, pw, ph, cfg, data);
      w = pw + pad * 2;
      h = ph + pad + speedExtra;
      break;
    }
  }

  const anchorY = style === 'circle' ? Math.round((h - speedExtra) / 2) : h - speedExtra;
  return {
    url: svgToDataUri(svg),
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(Math.round(w / 2), anchorY),
  };
}

/**
 * Build a selected-state marker icon (larger with glow ring).
 */
export function buildSelectedMarkerIcon(
  vehicleType: string,
  statusColor: string,
  style: MarkerStyle = 'pin',
  size: MarkerSize = 'medium',
  data?: VehicleMarkerData,
): google.maps.Icon {
  const cfg = SIZE_CFG[size];
  const s = cfg.selectedScale;
  const iconPath = ICON_PATHS[vehicleType] || FALLBACK_PATH;
  const lighter = lightenHex(statusColor, 15);

  let w: number, h: number;
  switch (style) {
    case 'circle': {
      const d = Math.round(cfg.circle * s);
      w = d; h = d;
      break;
    }
    case 'badge': {
      w = Math.round(cfg.badge[0] * s);
      h = Math.round(cfg.badge[1] * s);
      break;
    }
    default: {
      w = Math.round(cfg.pin[0] * s);
      h = Math.round(cfg.pin[1] * s);
      break;
    }
  }

  const bw = cfg.borderW + 0.5;
  const iStroke = cfg.iconStroke + 0.2;

  let shapeSvg: string;
  let ringCx: number;
  let ringCy: number;
  let ringR: number;

  if (style === 'circle') {
    const c = Math.round(w / 2);
    const r = c - 3;
    ringCx = c; ringCy = c; ringR = r;
    shapeSvg = `<circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)" stroke="rgba(255,255,255,0.8)" stroke-width="${bw}" filter="url(#s)"/>
    <circle cx="${c}" cy="${c}" r="${r - 1}" fill="url(#h)"/>`;
  } else if (style === 'badge') {
    const bodyH = h - 12;
    const cr = 6;
    const cx = Math.round(w / 2);
    const bodyCy = Math.round(bodyH / 2) + 2;
    const rr = w - 4;
    const pw = 6;
    const badgeD = [
      `M${cr + 2} 2`, `h${rr - 2 * cr}`,
      `a${cr} ${cr} 0 01${cr} ${cr}`, `v${bodyH - 2 * cr}`,
      `a${cr} ${cr} 0 01-${cr} ${cr}`,
      `h-${Math.round((rr - 2 * cr) / 2) - pw}`, `l-${pw} 10`, `l-${pw} -10`,
      `h-${Math.round((rr - 2 * cr) / 2) - pw}`,
      `a${cr} ${cr} 0 01-${cr}-${cr}`, `V${cr + 2}`, `a${cr} ${cr} 0 01${cr}-${cr}`, 'z',
    ].join('');
    ringCx = cx; ringCy = bodyCy; ringR = Math.round(w / 2) - 4;
    shapeSvg = `<path d="${badgeD}" fill="url(#g)" stroke="rgba(255,255,255,0.8)" stroke-width="${bw}" filter="url(#s)"/>
    <rect x="5" y="4" width="${w - 10}" height="${bodyH - 4}" rx="${cr - 1}" fill="url(#h)"/>`;
  } else {
    const cx = Math.round(w / 2);
    const r = Math.round(w / 2) - 5;
    const cy = r + 5;
    const pinD = buildPinPath(cx, cy, r, h - 2);
    ringCx = cx; ringCy = cy; ringR = r;
    shapeSvg = `<path d="${pinD}" fill="url(#g)" stroke="rgba(255,255,255,0.8)" stroke-width="${bw}" filter="url(#s)"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="url(#h)"/>`;
  }

  const ix = ringCx - 9;
  const iy = ringCy - 9.5;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lighter}"/>
      <stop offset="100%" stop-color="${statusColor}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.4" cy="0.35" r="0.5">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-10%" width="140%" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${bw * 0.8}"/>
      <feOffset dy="${bw}" result="off"/>
      <feComponentTransfer in="off"><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/>
    </filter>
  </defs>
  <circle cx="${ringCx}" cy="${ringCy}" r="${ringR + 5}" fill="none" stroke="${statusColor}" stroke-width="2" opacity="0.4" filter="url(#glow)"/>
  ${shapeSvg}
  <g transform="translate(${ix},${iy})">
    <path d="${iconPath}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="${iStroke + cfg.haloExtra}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${iconPath}" fill="none" stroke="#fff" stroke-width="${iStroke}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

  const anchorY = style === 'circle' ? Math.round(h / 2) : h;
  return {
    url: svgToDataUri(svg),
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(Math.round(w / 2), anchorY),
  };
}

/**
 * Generate an inline SVG data URI for legend/settings previews.
 */
export function getMarkerPreviewSvg(
  vehicleType: string,
  color: string,
  style: MarkerStyle,
): string {
  const cfg = SIZE_CFG.small;
  switch (style) {
    case 'circle':
      return svgToDataUri(svgCircle(vehicleType, color, cfg.circle, cfg));
    case 'badge':
      return svgToDataUri(svgBadge(vehicleType, color, cfg.badge[0], cfg.badge[1], cfg));
    default:
      return svgToDataUri(svgPin(vehicleType, color, cfg.pin[0], cfg.pin[1], cfg));
  }
}
