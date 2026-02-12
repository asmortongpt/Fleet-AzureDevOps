/**
 * 3D Model Loader - Advanced GLTF/GLB Loading System
 *
 * Features:
 * - Lazy loading with caching
 * - Progressive loading indicators
 * - Error handling and fallbacks
 * - Material optimization
 * - LOD (Level of Detail) support
 */

import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import logger from '@/utils/logger';
export interface ModelLoadOptions {
  url: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  enableDraco?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface VehicleModelMetadata {
  vehicleType: 'sedan' | 'suv' | 'truck' | 'van' | 'pickup' | 'bus' | 'motorcycle';
  make?: string;
  model?: string;
  year?: number;
  parts: {
    body: string[];
    glass: string[];
    chrome: string[];
    tires: string[];
    wheels: string[];
    interior: string[];
    lights: string[];
  };
}

// Model cache for performance
const modelCache = new Map<string, THREE.Group>();

// Default vehicle model URLs (fallback library)
export const DEFAULT_VEHICLE_MODELS: Record<string, string> = {
  sedan: '/models/vehicles/sedan-default.glb',
  suv: '/models/vehicles/suv-default.glb',
  truck: '/models/vehicles/truck-default.glb',
  van: '/models/vehicles/van-default.glb',
  pickup: '/models/vehicles/pickup-default.glb',
  bus: '/models/vehicles/bus-default.glb',
  motorcycle: '/models/vehicles/motorcycle-default.glb',
};

/**
 * Create optimized GLTF loader with DRACO compression support
 */
export function createGLTFLoader(enableDraco: boolean = true): GLTFLoader {
  const loader = new GLTFLoader();

  if (enableDraco) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);
  }

  return loader;
}

/**
 * Load a 3D vehicle model with caching
 */
export async function loadVehicleModel(
  options: ModelLoadOptions
): Promise<THREE.Group> {
  const { url, onProgress, onError, enableDraco = true, castShadow = true, receiveShadow = true } = options;

  // Check cache first
  if (modelCache.has(url)) {
    const cached = modelCache.get(url)!;
    return cached.clone();
  }

  const loader = createGLTFLoader(enableDraco);

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Optimize model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = castShadow;
            child.receiveShadow = receiveShadow;

            // Enable frustum culling for performance
            child.frustumCulled = true;

            // Optimize geometry
            if (child.geometry) {
              child.geometry.computeBoundingBox();
              child.geometry.computeBoundingSphere();
            }
          }
        });

        // Cache the model
        modelCache.set(url, model);

        resolve(model);
      },
      (progressEvent) => {
        if (onProgress && progressEvent.lengthComputable) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
      (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const err = new Error(`Failed to load model from ${url}: ${errorMessage}`);
        if (onError) {
          onError(err);
        }
        reject(err);
      }
    );
  });
}

/**
 * Load a fallback model based on vehicle type
 */
export async function loadFallbackModel(
  vehicleType: string
): Promise<THREE.Group> {
  const fallbackUrl = DEFAULT_VEHICLE_MODELS[vehicleType as keyof typeof DEFAULT_VEHICLE_MODELS]
    || DEFAULT_VEHICLE_MODELS.sedan;

  try {
    return await loadVehicleModel({ url: fallbackUrl });
  } catch (error) {
    logger.error('Failed to load fallback model, using placeholder', error);
    return createPlaceholderModel();
  }
}

/**
 * Create a simple placeholder model when loading fails
 */
export function createPlaceholderModel(): THREE.Group {
  const group = new THREE.Group();

  // Create a simple car-shaped placeholder
  const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.5,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.4;
  body.castShadow = true;
  body.receiveShadow = true;

  // Cabin
  const cabinGeometry = new THREE.BoxGeometry(1.5, 0.6, 2);
  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 1.0, -0.5);
  cabin.castShadow = true;
  cabin.receiveShadow = true;

  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.9
  });

  const wheelPositions: [number, number, number][] = [
    [-0.8, 0.3, 1.2],   // Front left
    [0.8, 0.3, 1.2],    // Front right
    [-0.8, 0.3, -1.2],  // Rear left
    [0.8, 0.3, -1.2],   // Rear right
  ];

  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    group.add(wheel);
  });

  group.add(body);
  group.add(cabin);

  return group;
}

/**
 * Analyze model structure and identify vehicle parts
 */
export function analyzeVehicleModel(model: THREE.Group): VehicleModelMetadata {
  const parts: VehicleModelMetadata['parts'] = {
    body: [],
    glass: [],
    chrome: [],
    tires: [],
    wheels: [],
    interior: [],
    lights: [],
  };

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name) {
      const name = child.name.toLowerCase();

      if (name.includes('body') || name.includes('panel') || name.includes('door') || name.includes('hood')) {
        parts.body.push(child.name);
      } else if (name.includes('glass') || name.includes('window') || name.includes('windshield')) {
        parts.glass.push(child.name);
      } else if (name.includes('chrome') || name.includes('trim') || name.includes('bumper')) {
        parts.chrome.push(child.name);
      } else if (name.includes('tire') || name.includes('rubber')) {
        parts.tires.push(child.name);
      } else if (name.includes('wheel') || name.includes('rim')) {
        parts.wheels.push(child.name);
      } else if (name.includes('seat') || name.includes('dashboard') || name.includes('steering')) {
        parts.interior.push(child.name);
      } else if (name.includes('light') || name.includes('lamp') || name.includes('headlight')) {
        parts.lights.push(child.name);
      }
    }
  });

  return {
    vehicleType: 'sedan', // Default, should be inferred from model metadata
    parts,
  };
}

/**
 * Clear model cache (useful for memory management)
 */
export function clearModelCache(): void {
  modelCache.clear();
}

/**
 * Preload multiple models
 */
export async function preloadModels(urls: string[]): Promise<void> {
  const promises = urls.map(url =>
    loadVehicleModel({ url }).catch(err => {
      logger.warn(`Failed to preload model ${url}:`, err);
    })
  );

  await Promise.all(promises);
}

/**
 * Get model from cache
 */
export function getCachedModel(url: string): THREE.Group | undefined {
  return modelCache.get(url);
}

/**
 * Calculate optimal LOD (Level of Detail) distance
 */
export function calculateLODDistances(boundingBox: THREE.Box3): number[] {
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDimension = Math.max(size.x, size.y, size.z);

  return [
    maxDimension * 5,   // High detail
    maxDimension * 15,  // Medium detail
    maxDimension * 30,  // Low detail
  ];
}
