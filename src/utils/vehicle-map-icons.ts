/**
 * Vehicle type-specific SVG markers for Google Maps.
 *
 * Three marker shapes: pin (teardrop), circle, badge (rounded-rect).
 * Three sizes: small, medium, large.
 * Glossy 3D rendering with gradient, highlight, shadow, and dual-layer icons.
 */

import type { MarkerStyle, MarkerSize } from '@/stores/useMapMarkerSettings';

// Re-export types for convenience
export type { MarkerStyle, MarkerSize };

// ---------------------------------------------------------------------------
// Status colours
// ---------------------------------------------------------------------------
export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  idle: '#6b7280',
  charging: '#06b6d4',
  service: '#f59e0b',
  emergency: '#ef4444',
  offline: '#374151',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  charging: 'Charging',
  service: 'In Service',
  emergency: 'Emergency',
  offline: 'Offline',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6b7280';
}

// ---------------------------------------------------------------------------
// Vehicle-type icon paths (18×18 viewBox, white stroke)
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

// ---------------------------------------------------------------------------
// Size configuration
// ---------------------------------------------------------------------------
interface SizeCfg {
  pin: [number, number];    // [width, height]
  circle: number;           // diameter
  badge: [number, number];  // [width, height]
  iconStroke: number;
  haloExtra: number;
  borderW: number;
  selectedScale: number;    // multiplier for selected variant
}

const SIZE_CFG: Record<MarkerSize, SizeCfg> = {
  small:  { pin: [28, 36], circle: 26, badge: [28, 34], iconStroke: 1.4, haloExtra: 1.2, borderW: 1.5, selectedScale: 1.35 },
  medium: { pin: [34, 44], circle: 32, badge: [34, 42], iconStroke: 1.8, haloExtra: 1.4, borderW: 2.0, selectedScale: 1.25 },
  large:  { pin: [42, 54], circle: 40, badge: [42, 52], iconStroke: 2.2, haloExtra: 1.6, borderW: 2.5, selectedScale: 1.2  },
};

// ---------------------------------------------------------------------------
// Shared SVG <defs> builder
// ---------------------------------------------------------------------------
function buildDefs(color: string, borderW: number): string {
  const lighter = lightenHex(color, 22);
  return `<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lighter}"/>
      <stop offset="100%" stop-color="${color}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.35" cy="0.3" r="0.5">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="s" x="-30%" y="-15%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${borderW * 0.8}"/>
      <feOffset dy="${borderW * 0.75}" result="off"/>
      <feComponentTransfer in="off"><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

// ---------------------------------------------------------------------------
// Dual-layer icon rendering (halo + crisp stroke)
// ---------------------------------------------------------------------------
function buildIconGroup(
  iconPath: string,
  cx: number,
  cy: number,
  iconStroke: number,
  haloExtra: number,
): string {
  const ix = cx - 9;  // 18/2 = 9
  const iy = cy - 9.5;
  return `<g transform="translate(${ix},${iy})">
    <path d="${iconPath}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="${iconStroke + haloExtra}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${iconPath}" fill="none" stroke="#fff" stroke-width="${iconStroke}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

// ---------------------------------------------------------------------------
// PIN style
// ---------------------------------------------------------------------------
function buildPinPath(cx: number, cy: number, r: number, tipY: number): string {
  const dx = Math.round(r * 0.38);
  const midY = Math.round(cy + r + (tipY - cy - r) * 0.35);
  return `M${cx} ${tipY}C${cx - dx} ${midY} ${cx - r} ${cy + r - 1} ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}C${cx + r} ${cy + r - 1} ${cx + dx} ${midY} ${cx} ${tipY}Z`;
}

function svgPin(type: string, color: string, w: number, h: number, cfg: SizeCfg): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  const cx = Math.round(w / 2);
  const r = Math.round(w / 2) - 4;
  const cy = r + 4;
  const pinD = buildPinPath(cx, cy, r, h - 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${buildDefs(color, cfg.borderW)}
  <path d="${pinD}" fill="url(#g)" stroke="#fff" stroke-width="${cfg.borderW}" filter="url(#s)"/>
  <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="url(#h)"/>
  ${buildIconGroup(iconPath, cx, cy, cfg.iconStroke, cfg.haloExtra)}
</svg>`;
}

// ---------------------------------------------------------------------------
// CIRCLE style
// ---------------------------------------------------------------------------
function svgCircle(type: string, color: string, d: number, cfg: SizeCfg): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  const c = Math.round(d / 2);
  const r = c - 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 ${d} ${d}">
  ${buildDefs(color, cfg.borderW)}
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)" stroke="#fff" stroke-width="${cfg.borderW}" filter="url(#s)"/>
  <circle cx="${c}" cy="${c}" r="${r - 1}" fill="url(#h)"/>
  ${buildIconGroup(iconPath, c, c, cfg.iconStroke, cfg.haloExtra)}
</svg>`;
}

// ---------------------------------------------------------------------------
// BADGE style (rounded rect + pointer)
// ---------------------------------------------------------------------------
function svgBadge(type: string, color: string, w: number, h: number, cfg: SizeCfg): string {
  const iconPath = ICON_PATHS[type] || FALLBACK_PATH;
  const bodyH = h - 10;
  const cr = 5;
  const cx = Math.round(w / 2);
  const bodyCy = Math.round(bodyH / 2) + 2;
  // Build badge outline as a single path: rounded rect top + triangle pointer bottom
  const rr = w - 4; // rect right
  const pw = 5; // pointer half-width
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${buildDefs(color, cfg.borderW)}
  <path d="${badgeD}" fill="url(#g)" stroke="#fff" stroke-width="${cfg.borderW}" filter="url(#s)"/>
  <rect x="4" y="4" width="${w - 8}" height="${bodyH - 4}" rx="${cr - 1}" fill="url(#h)"/>
  ${buildIconGroup(iconPath, cx, bodyCy, cfg.iconStroke, cfg.haloExtra)}
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
 */
export function buildVehicleMarkerIcon(
  vehicleType: string,
  statusColor: string,
  style: MarkerStyle = 'pin',
  size: MarkerSize = 'medium',
): google.maps.Icon {
  const cfg = SIZE_CFG[size];
  let svg: string;
  let w: number;
  let h: number;

  switch (style) {
    case 'circle': {
      const d = cfg.circle;
      svg = svgCircle(vehicleType, statusColor, d, cfg);
      w = d;
      h = d;
      break;
    }
    case 'badge': {
      [w, h] = cfg.badge;
      svg = svgBadge(vehicleType, statusColor, w, h, cfg);
      break;
    }
    default: { // pin
      [w, h] = cfg.pin;
      svg = svgPin(vehicleType, statusColor, w, h, cfg);
      break;
    }
  }

  const anchorY = style === 'circle' ? Math.round(h / 2) : h;
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
): google.maps.Icon {
  const cfg = SIZE_CFG[size];
  const s = cfg.selectedScale;
  const iconPath = ICON_PATHS[vehicleType] || FALLBACK_PATH;
  const lighter = lightenHex(statusColor, 22);

  // Scale up dimensions
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

  // Build base shape
  let shapeSvg: string;
  let ringCx: number;
  let ringCy: number;
  let ringR: number;

  if (style === 'circle') {
    const c = Math.round(w / 2);
    const r = c - 3;
    ringCx = c; ringCy = c; ringR = r;
    shapeSvg = `<circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)" stroke="#fff" stroke-width="${bw}" filter="url(#s)"/>
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
    shapeSvg = `<path d="${badgeD}" fill="url(#g)" stroke="#fff" stroke-width="${bw}" filter="url(#s)"/>
    <rect x="5" y="4" width="${w - 10}" height="${bodyH - 4}" rx="${cr - 1}" fill="url(#h)"/>`;
  } else {
    const cx = Math.round(w / 2);
    const r = Math.round(w / 2) - 5;
    const cy = r + 5;
    const pinD = buildPinPath(cx, cy, r, h - 2);
    ringCx = cx; ringCy = cy; ringR = r;
    shapeSvg = `<path d="${pinD}" fill="url(#g)" stroke="#fff" stroke-width="${bw}" filter="url(#s)"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="url(#h)"/>`;
  }

  const iconCx = ringCx;
  const iconCy = ringCy;
  const ix = iconCx - 9;
  const iy = iconCy - 9.5;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lighter}"/>
      <stop offset="100%" stop-color="${statusColor}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.35" cy="0.3" r="0.5">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="s" x="-30%" y="-15%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${bw}"/>
      <feOffset dy="${bw}" result="off"/>
      <feComponentTransfer in="off"><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
    </filter>
  </defs>
  <circle cx="${ringCx}" cy="${ringCy}" r="${ringR + 6}" fill="none" stroke="${statusColor}" stroke-width="2.5" opacity="0.35" filter="url(#glow)"/>
  ${shapeSvg}
  <g transform="translate(${ix},${iy})">
    <path d="${iconPath}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="${iStroke + cfg.haloExtra}" stroke-linecap="round" stroke-linejoin="round"/>
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
 * Returns a fixed 28×36 pin or 26-diameter circle or 28×34 badge.
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
