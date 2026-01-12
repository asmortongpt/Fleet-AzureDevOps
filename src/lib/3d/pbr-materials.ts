/**
 * PBR Materials Library - Photorealistic Materials for Vehicle Rendering
 *
 * Features:
 * - Physically Based Rendering (PBR) materials
 * - Car paint with clearcoat
 * - Chrome, glass, rubber materials
 * - Quality presets (low, medium, high)
 * - Material variants (metallic, pearl, matte)
 */

import * as THREE from 'three';

export type MaterialQuality = 'low' | 'medium' | 'high' | 'ultra';
export type PaintType = 'metallic' | 'pearl' | 'matte' | 'gloss';

export interface CarPaintOptions {
  color: string | THREE.Color;
  quality?: MaterialQuality;
  paintType?: PaintType;
  flakeSize?: number;
  flakeDensity?: number;
}

export interface MaterialOptions {
  quality?: MaterialQuality;
  color?: string | THREE.Color;
  opacity?: number;
}

/**
 * Create photorealistic car paint material with clearcoat
 */
export function createCarPaintMaterial(options: CarPaintOptions): THREE.MeshPhysicalMaterial {
  const {
    color,
    quality = 'medium',
    paintType = 'metallic',
    flakeSize = 0.5,
    flakeDensity = 0.8
  } = options;

  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  // Quality-based parameters
  const qualitySettings = {
    low: {
      metalness: 0.7,
      roughness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.0,
    },
    medium: {
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.5,
    },
    high: {
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.0,
    },
    ultra: {
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      envMapIntensity: 2.5,
    },
  };

  const settings = qualitySettings[quality];

  // Paint type adjustments
  const paintSettings = {
    metallic: {
      metalness: settings.metalness,
      roughness: settings.roughness,
      sheen: 0.3,
      sheenRoughness: 0.5,
    },
    pearl: {
      metalness: settings.metalness * 0.9,
      roughness: settings.roughness * 0.8,
      sheen: 0.8,
      sheenRoughness: 0.3,
      iridescence: 1.0,
      iridescenceIOR: 1.3,
    },
    matte: {
      metalness: 0.0,
      roughness: 0.9,
      sheen: 0.0,
      sheenRoughness: 1.0,
    },
    gloss: {
      metalness: settings.metalness,
      roughness: settings.roughness * 0.5,
      sheen: 0.5,
      sheenRoughness: 0.2,
    },
  };

  const paint = paintSettings[paintType];

  const material = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    metalness: paint.metalness,
    roughness: paint.roughness,
    clearcoat: settings.clearcoat,
    clearcoatRoughness: settings.clearcoatRoughness,
    envMapIntensity: settings.envMapIntensity,
    reflectivity: 1.0,
    ior: 1.5,
    sheen: paint.sheen,
    sheenRoughness: paint.sheenRoughness,
    sheenColor: baseColor.clone().offsetHSL(0, 0, 0.1),
  });

  // Add iridescence for pearl paint
  if (paintType === 'pearl' && quality !== 'low') {
    material.iridescence = paint.iridescence || 0;
    material.iridescenceIOR = paint.iridescenceIOR || 1.3;
    material.iridescenceThicknessRange = [100, 800];
  }

  return material;
}

/**
 * Create chrome/metal material for trim, wheels
 */
export function createChromeMaterial(options: MaterialOptions = {}): THREE.MeshStandardMaterial {
  const { quality = 'medium', color = '#ffffff' } = options;

  const qualitySettings = {
    low: { roughness: 0.2, envMapIntensity: 2.0 },
    medium: { roughness: 0.1, envMapIntensity: 2.5 },
    high: { roughness: 0.05, envMapIntensity: 3.0 },
    ultra: { roughness: 0.02, envMapIntensity: 3.5 },
  };

  const settings = qualitySettings[quality];
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 1.0,
    roughness: settings.roughness,
    envMapIntensity: settings.envMapIntensity,
  });
}

/**
 * Create glass material for windows
 */
export function createGlassMaterial(options: MaterialOptions = {}): THREE.MeshPhysicalMaterial {
  const { quality = 'medium', color = '#88ccff', opacity = 0.3 } = options;

  const qualitySettings = {
    low: {
      transmission: 0.5,
      roughness: 0.05,
      thickness: 0.3,
    },
    medium: {
      transmission: 0.8,
      roughness: 0.02,
      thickness: 0.5,
    },
    high: {
      transmission: 0.95,
      roughness: 0,
      thickness: 0.5,
    },
    ultra: {
      transmission: 0.98,
      roughness: 0,
      thickness: 0.5,
    },
  };

  const settings = qualitySettings[quality];
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    metalness: 0,
    roughness: settings.roughness,
    transmission: settings.transmission,
    thickness: settings.thickness,
    ior: 1.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
  });
}

/**
 * Create rubber material for tires
 */
export function createRubberMaterial(options: MaterialOptions = {}): THREE.MeshStandardMaterial {
  const { color = '#111111' } = options;
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0,
    roughness: 0.9,
    envMapIntensity: 0.3,
  });
}

/**
 * Create plastic material for interior
 */
export function createPlasticMaterial(options: MaterialOptions = {}): THREE.MeshStandardMaterial {
  const { quality = 'medium', color = '#333333' } = options;
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  const qualitySettings = {
    low: { roughness: 0.6, envMapIntensity: 0.5 },
    medium: { roughness: 0.5, envMapIntensity: 0.7 },
    high: { roughness: 0.4, envMapIntensity: 0.9 },
    ultra: { roughness: 0.3, envMapIntensity: 1.0 },
  };

  const settings = qualitySettings[quality];

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0.1,
    roughness: settings.roughness,
    envMapIntensity: settings.envMapIntensity,
  });
}

/**
 * Create leather material for seats
 */
export function createLeatherMaterial(options: MaterialOptions = {}): THREE.MeshStandardMaterial {
  const { quality = 'medium', color = '#8B4513' } = options;
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  const qualitySettings = {
    low: { roughness: 0.7, envMapIntensity: 0.4 },
    medium: { roughness: 0.6, envMapIntensity: 0.5 },
    high: { roughness: 0.5, envMapIntensity: 0.6 },
    ultra: { roughness: 0.4, envMapIntensity: 0.7 },
  };

  const settings = qualitySettings[quality];

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0,
    roughness: settings.roughness,
    envMapIntensity: settings.envMapIntensity,
  });
}

/**
 * Create emissive material for lights
 */
export function createLightMaterial(color: string | THREE.Color = '#ffffff', intensity: number = 1.0): THREE.MeshStandardMaterial {
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: baseColor,
    emissiveIntensity: intensity,
    metalness: 0,
    roughness: 0.3,
  });
}

/**
 * Create carbon fiber material
 */
export function createCarbonFiberMaterial(options: MaterialOptions = {}): THREE.MeshStandardMaterial {
  const { quality = 'medium' } = options;

  const qualitySettings = {
    low: { roughness: 0.4, envMapIntensity: 1.0 },
    medium: { roughness: 0.3, envMapIntensity: 1.5 },
    high: { roughness: 0.2, envMapIntensity: 2.0 },
    ultra: { roughness: 0.15, envMapIntensity: 2.5 },
  };

  const settings = qualitySettings[quality];

  return new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.7,
    roughness: settings.roughness,
    envMapIntensity: settings.envMapIntensity,
  });
}

/**
 * Apply materials to vehicle model based on part names
 */
export function applyVehicleMaterials(
  model: THREE.Group,
  options: {
    exteriorColor?: string;
    interiorColor?: string;
    paintType?: PaintType;
    quality?: MaterialQuality;
  }
): void {
  const {
    exteriorColor = '#ffffff',
    interiorColor = '#333333',
    paintType = 'metallic',
    quality = 'medium'
  } = options;

  const paintMaterial = createCarPaintMaterial({
    color: exteriorColor,
    quality,
    paintType
  });
  const chromeMaterial = createChromeMaterial({ quality });
  const glassMaterial = createGlassMaterial({ quality });
  const rubberMaterial = createRubberMaterial();
  const plasticMaterial = createPlasticMaterial({ quality, color: interiorColor });
  const leatherMaterial = createLeatherMaterial({ quality, color: interiorColor });

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const name = child.name.toLowerCase();

      if (name.includes('body') || name.includes('paint') || name.includes('panel') || name.includes('door') || name.includes('hood') || name.includes('trunk')) {
        child.material = paintMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
      else if (name.includes('chrome') || name.includes('trim') || name.includes('bumper') || name.includes('grille')) {
        child.material = chromeMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
      else if (name.includes('glass') || name.includes('window') || name.includes('windshield')) {
        child.material = glassMaterial;
        child.castShadow = false;
        child.receiveShadow = true;
      }
      else if (name.includes('tire') || name.includes('rubber')) {
        child.material = rubberMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
      else if (name.includes('wheel') || name.includes('rim')) {
        child.material = chromeMaterial.clone();
        child.castShadow = true;
        child.receiveShadow = true;
      }
      else if (name.includes('seat') || name.includes('leather')) {
        child.material = leatherMaterial;
        child.receiveShadow = true;
      }
      else if (name.includes('dashboard') || name.includes('plastic') || name.includes('interior')) {
        child.material = plasticMaterial;
        child.receiveShadow = true;
      }
      else if (name.includes('light') || name.includes('lamp')) {
        child.material = createLightMaterial('#ffaa00', 0.5);
      }
      else if (name.includes('carbon')) {
        child.material = createCarbonFiberMaterial({ quality });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    }
  });
}

/**
 * Material preset configurations
 */
export const MATERIAL_PRESETS = {
  luxury: {
    paintType: 'pearl' as PaintType,
    quality: 'ultra' as MaterialQuality,
    chromeFinish: 'polished',
  },
  sport: {
    paintType: 'metallic' as PaintType,
    quality: 'high' as MaterialQuality,
    carbonFiber: true,
  },
  utility: {
    paintType: 'gloss' as PaintType,
    quality: 'medium' as MaterialQuality,
    matte: false,
  },
  stealth: {
    paintType: 'matte' as PaintType,
    quality: 'high' as MaterialQuality,
    darkChrome: true,
  },
};

/**
 * Popular vehicle colors
 */
export const VEHICLE_COLORS = {
  // Whites
  white: '#FFFFFF',
  pearl_white: '#F4F4F4',
  frost_white: '#F8F8FF',

  // Blacks
  black: '#000000',
  jet_black: '#0A0A0A',
  carbon_black: '#1A1A1A',

  // Grays
  silver: '#C0C0C0',
  titanium: '#878787',
  graphite: '#383838',
  charcoal: '#36454F',

  // Blues
  blue: '#0066CC',
  navy: '#000080',
  sky_blue: '#87CEEB',
  royal_blue: '#4169E1',

  // Reds
  red: '#FF0000',
  cherry_red: '#DE3163',
  burgundy: '#800020',
  crimson: '#DC143C',

  // Yellows
  yellow: '#FFFF00',
  gold: '#FFD700',
  sunset_orange: '#FF6347',

  // Greens
  racing_green: '#014421',
  forest_green: '#228B22',
  lime: '#32CD32',

  // Special
  chrome: '#E5E4E2',
  matte_black: '#28282B',
  copper: '#B87333',
};
