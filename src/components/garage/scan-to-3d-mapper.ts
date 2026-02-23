/**
 * scan-to-3d-mapper — Maps vehicle scan damage items to 3D coordinates
 * for the existing DamageOverlay system in Asset3DViewer.
 *
 * Uses frame index + bounding box position to determine which zone on
 * the vehicle body each damage item corresponds to, then returns 3D
 * positions compatible with the DamagePoint type.
 */

import type { DamagePoint } from '@/components/garage/DamageOverlay';

// Re-export for convenience
export type { DamagePoint };

// ============================================================================
// DamageItem shape (matches VehicleScanUpload)
// ============================================================================

export interface DamageItem {
  id: string;
  damage_type: string;
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number;
  description: string;
  area_percent?: number;
  bbox?: number[]; // [x_min, y_min, x_max, y_max] normalised 0-1
  frame_index?: number;
  zone?: string;
}

// ============================================================================
// 24 damage zone positions on a standard vehicle model
// ============================================================================

export const ZONE_3D_POSITIONS: Record<string, [number, number, number]> = {
  front_bumper: [0, 0.3, 2.2],
  front_hood: [0, 0.8, 1.5],
  front_left_fender: [-0.9, 0.5, 1.8],
  front_right_fender: [0.9, 0.5, 1.8],
  front_left_headlight: [-0.7, 0.4, 2.1],
  front_right_headlight: [0.7, 0.4, 2.1],
  left_front_door: [-1.0, 0.5, 0.5],
  left_rear_door: [-1.0, 0.5, -0.5],
  right_front_door: [1.0, 0.5, 0.5],
  right_rear_door: [1.0, 0.5, -0.5],
  left_side_panel: [-1.0, 0.5, 0],
  right_side_panel: [1.0, 0.5, 0],
  left_mirror: [-1.1, 0.7, 0.8],
  right_mirror: [1.1, 0.7, 0.8],
  roof: [0, 1.2, 0],
  windshield: [0, 1.0, 1.2],
  rear_window: [0, 1.0, -1.2],
  rear_bumper: [0, 0.3, -2.2],
  rear_trunk: [0, 0.7, -1.8],
  rear_left_taillight: [-0.7, 0.4, -2.1],
  rear_right_taillight: [0.7, 0.4, -2.1],
  left_rear_quarter: [-0.9, 0.5, -1.5],
  right_rear_quarter: [0.9, 0.5, -1.5],
  undercarriage: [0, 0, 0],
};

// ============================================================================
// Frame angle mapping (8-angle walkthrough)
// ============================================================================

const FRAME_ANGLE_MAP: Record<number, string> = {
  0: 'front',
  1: 'front_left',
  2: 'left',
  3: 'rear_left',
  4: 'rear',
  5: 'rear_right',
  6: 'right',
  7: 'front_right',
};

// ============================================================================
// Angle-to-zone mapping by bbox quadrant
// ============================================================================

const ANGLE_ZONE_MAP: Record<string, Record<string, string>> = {
  front: {
    top_left: 'front_left_headlight',
    top_right: 'front_right_headlight',
    bottom_left: 'front_left_fender',
    bottom_right: 'front_right_fender',
    center: 'front_bumper',
  },
  front_left: {
    top_left: 'front_left_headlight',
    top_right: 'front_hood',
    bottom_left: 'front_left_fender',
    bottom_right: 'left_front_door',
    center: 'front_left_fender',
  },
  left: {
    top_left: 'left_mirror',
    top_right: 'roof',
    bottom_left: 'left_front_door',
    bottom_right: 'left_rear_door',
    center: 'left_side_panel',
  },
  rear_left: {
    top_left: 'rear_window',
    top_right: 'left_rear_door',
    bottom_left: 'rear_left_taillight',
    bottom_right: 'left_rear_quarter',
    center: 'left_rear_quarter',
  },
  rear: {
    top_left: 'rear_left_taillight',
    top_right: 'rear_right_taillight',
    bottom_left: 'rear_bumper',
    bottom_right: 'rear_bumper',
    center: 'rear_trunk',
  },
  rear_right: {
    top_left: 'right_rear_quarter',
    top_right: 'rear_window',
    bottom_left: 'rear_right_taillight',
    bottom_right: 'right_rear_quarter',
    center: 'right_rear_quarter',
  },
  right: {
    top_left: 'roof',
    top_right: 'right_mirror',
    bottom_left: 'right_rear_door',
    bottom_right: 'right_front_door',
    center: 'right_side_panel',
  },
  front_right: {
    top_left: 'front_hood',
    top_right: 'front_right_headlight',
    bottom_left: 'right_front_door',
    bottom_right: 'front_right_fender',
    center: 'front_right_fender',
  },
};

// ============================================================================
// Cost estimation
// ============================================================================

const BASE_COSTS: Record<string, number> = {
  dent: 200,
  scratch: 100,
  rust: 500,
  crack: 400,
  broken_light: 300,
  broken_glass: 350,
  paint_chip: 75,
  missing_part: 600,
  damage: 250, // generic fallback
};

const SEVERITY_MULTIPLIERS: Record<string, number> = {
  severe: 2.5,
  moderate: 1.5,
  minor: 0.8,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determine the quadrant of a bounding box within the frame.
 * bbox is [x_min, y_min, x_max, y_max] normalised 0-1.
 * Returns 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center'.
 */
export function getBboxQuadrant(bbox: number[]): string {
  if (!bbox || bbox.length < 4) return 'center';

  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = (bbox[1] + bbox[3]) / 2;

  // If near the centre, return 'center'
  if (cx > 0.35 && cx < 0.65 && cy > 0.35 && cy < 0.65) {
    return 'center';
  }

  const left = cx < 0.5;
  const top = cy < 0.5;

  if (top && left) return 'top_left';
  if (top && !left) return 'top_right';
  if (!top && left) return 'bottom_left';
  return 'bottom_right';
}

/**
 * Small deterministic offset to avoid damage markers stacking on top of each other.
 */
function jitter(index: number, axis: number): number {
  // Simple pseudo-random based on index and axis
  const seed = (index * 7 + axis * 13) % 100;
  return ((seed / 100) - 0.5) * 0.1; // +/-0.05
}

// ============================================================================
// Main export
// ============================================================================

/**
 * Map scan damage items to 3D DamagePoint[] for the Asset3DViewer.
 *
 * @param items  Array of damage items from the scanner pipeline
 * @param frameCount  Total frames analysed (default 8 for guided scan)
 * @returns DamagePoint[] ready to pass to Asset3DViewer's damagePoints prop
 */
export function mapScanDamageTo3D(
  items: DamageItem[],
  frameCount: number = 8
): DamagePoint[] {
  return items.map((item, idx) => {
    // --- Determine the camera angle ---
    const frameIdx =
      item.frame_index != null
        ? item.frame_index % (frameCount || 8)
        : idx % 8;
    const angle = FRAME_ANGLE_MAP[frameIdx] || 'front';

    // --- Determine the quadrant within the frame ---
    const quadrant = item.bbox ? getBboxQuadrant(item.bbox) : 'center';

    // --- Look up zone ---
    let zone: string;
    if (item.zone && ZONE_3D_POSITIONS[item.zone]) {
      zone = item.zone;
    } else {
      const angleZones = ANGLE_ZONE_MAP[angle];
      zone = angleZones?.[quadrant] || angleZones?.center || 'front_bumper';
    }

    // --- Get 3D position ---
    const basePos = ZONE_3D_POSITIONS[zone] || ZONE_3D_POSITIONS.front_bumper;
    const position: [number, number, number] = [
      basePos[0] + jitter(idx, 0),
      basePos[1] + jitter(idx, 1),
      basePos[2] + jitter(idx, 2),
    ];

    // --- Estimate cost ---
    const damageKey = item.damage_type.toLowerCase().replace(/\s+/g, '_');
    const baseCost = BASE_COSTS[damageKey] || BASE_COSTS.damage;
    const multiplier = SEVERITY_MULTIPLIERS[item.severity] || 1;
    const estimatedCost = Math.round(baseCost * multiplier);

    // --- Map severity to DamagePoint severity scale ---
    // Scanner uses minor/moderate/severe; DamageOverlay also has 'critical'
    const severityMap: Record<string, 'minor' | 'moderate' | 'severe' | 'critical'> = {
      minor: 'minor',
      moderate: 'moderate',
      severe: 'severe',
    };

    return {
      id: item.id || `scan-dmg-${idx}`,
      position,
      normal: [0, 1, 0] as [number, number, number],
      severity: severityMap[item.severity] || 'moderate',
      description: item.description || `${item.damage_type.replace(/_/g, ' ')} (${item.severity})`,
      estimatedCost,
      photos: [],
      createdAt: new Date().toISOString(),
      zone,
    };
  });
}
