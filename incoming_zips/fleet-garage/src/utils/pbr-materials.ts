/**
 * PBR Materials System - Physically Based Rendering materials for vehicles
 * 
 * Features:
 * - Car paint materials (metallic, pearlescent, matte)
 * - Chrome and metal finishes
 * - Glass and transparent materials
 * - Rubber and plastic materials
 * - Environment mapping
 * 
 * Created: 2026-01-08
 */

import * as THREE from 'three';

// ============================================================================
// MATERIAL PRESETS
// ============================================================================

export interface PBRMaterialConfig {
  baseColor: string | THREE.Color;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  envMapIntensity?: number;
  emissive?: string | THREE.Color;
  emissiveIntensity?: number;
}

export const VEHICLE_MATERIALS = {
  // Car Paint
  glossyPaint: {
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
  },

  mattePaint: {
    metalness: 0.0,
    roughness: 0.8,
    clearcoat: 0.0,
    envMapIntensity: 0.5,
  },

  metallicPaint: {
    metalness: 1.0,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.0,
  },

  pearlescentPaint: {
    metalness: 0.7,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.8,
  },

  // Chrome & Metal
  chrome: {
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 2.5,
  },

  brushedMetal: {
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 1.2,
  },

  // Glass
  glass: {
    metalness: 0.0,
    roughness: 0.0,
    transmission: 1.0,
    thickness: 0.5,
    envMapIntensity: 1.0,
  },

  tintedGlass: {
    metalness: 0.0,
    roughness: 0.0,
    transmission: 0.7,
    thickness: 0.5,
    envMapIntensity: 0.8,
  },

  // Plastic & Rubber
  rubber: {
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.3,
  },

  plastic: {
    metalness: 0.0,
    roughness: 0.5,
    envMapIntensity: 0.4,
  },

  glossyPlastic: {
    metalness: 0.0,
    roughness: 0.2,
    clearcoat: 0.5,
    envMapIntensity: 0.8,
  },
};

// ============================================================================
// MATERIAL FACTORY
// ============================================================================

export class VehicleMaterialFactory {
  private envMap: THREE.Texture | null = null;
  private textureLoader = new THREE.TextureLoader();

  setEnvironmentMap(envMap: THREE.Texture): void {
    this.envMap = envMap;
  }

  /**
   * Create car paint material
   */
  createPaintMaterial(config: {
    color: string | THREE.Color;
    type?: 'glossy' | 'matte' | 'metallic' | 'pearlescent';
    normalMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
  }): THREE.MeshPhysicalMaterial {
    const preset = VEHICLE_MATERIALS[`${config.type || 'glossy'}Paint`];

    const material = new THREE.MeshPhysicalMaterial({
      color: config.color,
      metalness: preset.metalness,
      roughness: preset.roughness,
      clearcoat: preset.clearcoat || 0,
      clearcoatRoughness: preset.clearcoatRoughness || 0,
      envMap: this.envMap,
      envMapIntensity: preset.envMapIntensity,
      normalMap: config.normalMap,
      roughnessMap: config.roughnessMap,
    });

    return material;
  }

  /**
   * Create chrome/metal material
   */
  createMetalMaterial(config: {
    color?: string | THREE.Color;
    type?: 'chrome' | 'brushed';
    normalMap?: THREE.Texture;
  }): THREE.MeshStandardMaterial {
    const preset = VEHICLE_MATERIALS[config.type || 'chrome'];

    return new THREE.MeshStandardMaterial({
      color: config.color || 0xffffff,
      metalness: preset.metalness,
      roughness: preset.roughness,
      envMap: this.envMap,
      envMapIntensity: preset.envMapIntensity,
      normalMap: config.normalMap,
    });
  }

  /**
   * Create glass material
   */
  createGlassMaterial(config: {
    color?: string | THREE.Color;
    tinted?: boolean;
    opacity?: number;
  }): THREE.MeshPhysicalMaterial {
    const preset = config.tinted ? VEHICLE_MATERIALS.tintedGlass : VEHICLE_MATERIALS.glass;

    return new THREE.MeshPhysicalMaterial({
      color: config.color || 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: preset.transmission,
      transparent: true,
      opacity: config.opacity || 0.9,
      envMap: this.envMap,
      envMapIntensity: preset.envMapIntensity,
      thickness: preset.thickness,
      ior: 1.5,
    });
  }

  /**
   * Create rubber material (tires)
   */
  createRubberMaterial(config: {
    color?: string | THREE.Color;
    normalMap?: THREE.Texture;
    aoMap?: THREE.Texture;
  }): THREE.MeshStandardMaterial {
    const preset = VEHICLE_MATERIALS.rubber;

    return new THREE.MeshStandardMaterial({
      color: config.color || 0x1a1a1a,
      metalness: preset.metalness,
      roughness: preset.roughness,
      envMap: this.envMap,
      envMapIntensity: preset.envMapIntensity,
      normalMap: config.normalMap,
      aoMap: config.aoMap,
    });
  }

  /**
   * Create plastic material
   */
  createPlasticMaterial(config: {
    color: string | THREE.Color;
    glossy?: boolean;
    normalMap?: THREE.Texture;
  }): THREE.MeshStandardMaterial {
    const preset = config.glossy ? VEHICLE_MATERIALS.glossyPlastic : VEHICLE_MATERIALS.plastic;

    return new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: preset.metalness,
      roughness: preset.roughness,
      envMap: this.envMap,
      envMapIntensity: preset.envMapIntensity,
      normalMap: config.normalMap,
    });
  }

  /**
   * Create leather/fabric material (interior)
   */
  createFabricMaterial(config: {
    color: string | THREE.Color;
    normalMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
  }): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: 0,
      roughness: 0.85,
      normalMap: config.normalMap,
      roughnessMap: config.roughnessMap,
      envMap: this.envMap,
      envMapIntensity: 0.2,
    });
  }

  /**
   * Load and create material from textures
   */
  async createMaterialFromTextures(config: {
    baseColorUrl: string;
    normalUrl?: string;
    metallicUrl?: string;
    roughnessUrl?: string;
    aoUrl?: string;
    materialType: 'paint' | 'metal' | 'plastic' | 'fabric';
  }): Promise<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial> {
    const [baseColorMap, normalMap, metallicMap, roughnessMap, aoMap] = await Promise.all([
      this.textureLoader.loadAsync(config.baseColorUrl),
      config.normalUrl ? this.textureLoader.loadAsync(config.normalUrl) : null,
      config.metallicUrl ? this.textureLoader.loadAsync(config.metallicUrl) : null,
      config.roughnessUrl ? this.textureLoader.loadAsync(config.roughnessUrl) : null,
      config.aoUrl ? this.textureLoader.loadAsync(config.aoUrl) : null,
    ]);

    // Configure texture wrapping and filtering
    [baseColorMap, normalMap, metallicMap, roughnessMap, aoMap].forEach(map => {
      if (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.minFilter = THREE.LinearMipmapLinearFilter;
        map.magFilter = THREE.LinearFilter;
        map.generateMipmaps = true;
      }
    });

    if (config.materialType === 'paint') {
      return new THREE.MeshPhysicalMaterial({
        map: baseColorMap,
        normalMap: normalMap || undefined,
        metalnessMap: metallicMap || undefined,
        roughnessMap: roughnessMap || undefined,
        aoMap: aoMap || undefined,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMap: this.envMap,
        envMapIntensity: 1.5,
      });
    }

    return new THREE.MeshStandardMaterial({
      map: baseColorMap,
      normalMap: normalMap || undefined,
      metalnessMap: metallicMap || undefined,
      roughnessMap: roughnessMap || undefined,
      aoMap: aoMap || undefined,
      envMap: this.envMap,
      envMapIntensity: 0.8,
    });
  }
}

// ============================================================================
// ENVIRONMENT MAP UTILITIES
// ============================================================================

/**
 * Load HDR environment map
 */
export async function loadHDREnvironment(
  url: string
): Promise<THREE.Texture> {
  // In production, use RGBELoader from three/examples/jsm/loaders/RGBELoader
  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync(url);

  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.encoding = THREE.sRGBEncoding;

  return texture;
}

/**
 * Create procedural environment map
 */
export function createProceduralEnvironment(): THREE.CubeTexture {
  const size = 512;
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });

  // Create scene with gradient
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue

  // Add ground plane
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x404040 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Add ambient light representation
  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(ambientLight);

  return cubeRenderTarget.texture;
}

// ============================================================================
// POST-PROCESSING EFFECTS
// ============================================================================

export interface RenderQualitySettings {
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  pixelRatio: number;
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
}

export const QUALITY_PRESETS: Record<'low' | 'medium' | 'high' | 'ultra', RenderQualitySettings> = {
  low: {
    shadows: false,
    shadowMapSize: 512,
    antialias: false,
    pixelRatio: 1,
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1,
  },
  medium: {
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
    pixelRatio: 1,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
  },
  high: {
    shadows: true,
    shadowMapSize: 2048,
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2,
  },
  ultra: {
    shadows: true,
    shadowMapSize: 4096,
    antialias: true,
    pixelRatio: window.devicePixelRatio,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2,
  },
};

export function applyRenderQuality(
  renderer: THREE.WebGLRenderer,
  settings: RenderQualitySettings
): void {
  renderer.setPixelRatio(settings.pixelRatio);
  renderer.shadowMap.enabled = settings.shadows;

  if (settings.shadows) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  renderer.toneMapping = settings.toneMapping;
  renderer.toneMappingExposure = settings.toneMappingExposure;
  renderer.outputEncoding = THREE.sRGBEncoding;
}

export default {
  VehicleMaterialFactory,
  VEHICLE_MATERIALS,
  loadHDREnvironment,
  createProceduralEnvironment,
  QUALITY_PRESETS,
  applyRenderQuality,
};
