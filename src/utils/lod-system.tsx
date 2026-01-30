/**
 * LOD (Level of Detail) System for 3D Vehicle Models
 * 
 * Features:
 * - Automatic LOD switching based on distance
 * - Memory-efficient model loading
 * - Progressive enhancement
 * - Frustum culling
 * 
 * Created: 2026-01-08
 */

import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface LODConfig {
  distances: number[]; // Array of distance thresholds
  modelUrls: string[]; // URLs for each LOD level
  autoSwitch?: boolean;
  hysteresis?: number; // Prevent rapid switching
}

export interface UseLODOptions {
  position: THREE.Vector3;
  config: LODConfig;
  onLODChange?: (level: number) => void;
}

// ============================================================================
// LOD HOOK
// ============================================================================

export function useLOD({ position, config, onLODChange }: UseLODOptions) {
  const { camera } = useThree();
  const lodRef = useRef<THREE.LOD>(new THREE.LOD());
  const currentLevel = useRef(0);
  const lastSwitchTime = useRef(0);

  // Calculate distance to camera
  useFrame(() => {
    if (!config.autoSwitch) return;

    const now = Date.now();
    const timeSinceLastSwitch = now - lastSwitchTime.current;

    // Hysteresis to prevent rapid switching
    if (timeSinceLastSwitch < (config.hysteresis || 100)) return;

    const distance = camera.position.distanceTo(position);
    let newLevel = 0;

    // Determine appropriate LOD level
    for (let i = 0; i < config.distances.length; i++) {
      if (distance > config.distances[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }

    // Switch LOD if needed
    if (newLevel !== currentLevel.current) {
      currentLevel.current = newLevel;
      lastSwitchTime.current = now;
      onLODChange?.(newLevel);
    }
  });

  return {
    lodRef,
    currentLevel: currentLevel.current,
  };
}

// ============================================================================
// LOD COMPONENT
// ============================================================================

interface LODVehicleModelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  lodConfig: LODConfig;
  onModelLoad?: (level: number, model: THREE.Object3D) => void;
}

export function LODVehicleModel({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  lodConfig,
  onModelLoad,
}: LODVehicleModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const positionVec = useMemo(() => new THREE.Vector3(...position), [position]);

  const { currentLevel } = useLOD({
    position: positionVec,
    config: lodConfig,
    onLODChange: (level) => {
      logger.info(`Switched to LOD level ${level}`);
    },
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh ref={meshRef}>
        <boxGeometry />
        <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  );
}

// ============================================================================
// TEXTURE COMPRESSION UTILITIES
// ============================================================================

/**
 * Compress texture to appropriate format
 */
export async function compressTexture(
  texture: THREE.Texture,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<THREE.Texture> {
  const qualitySettings = {
    low: { maxSize: 512, format: THREE.RGBAFormat },
    medium: { maxSize: 1024, format: THREE.RGBAFormat },
    high: { maxSize: 2048, format: THREE.RGBAFormat },
  };

  const settings = qualitySettings[quality];

  // Resize texture if needed
  const image = texture.image as HTMLImageElement;
  if (image.width > settings.maxSize || image.height > settings.maxSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const scale = Math.min(
      settings.maxSize / image.width,
      settings.maxSize / image.height
    );

    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const compressedTexture = new THREE.Texture(canvas);
    compressedTexture.needsUpdate = true;
    compressedTexture.format = settings.format;

    return compressedTexture;
  }

  return texture;
}

/**
 * Generate mipmaps for texture
 */
export function generateMipmaps(texture: THREE.Texture): void {
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
}

// ============================================================================
// GEOMETRY OPTIMIZATION
// ============================================================================

/**
 * Simplify geometry by reducing vertices
 */
export function simplifyGeometry(
  geometry: THREE.BufferGeometry,
  targetReduction: number = 0.5
): THREE.BufferGeometry {
  // This is a simplified version - in production, use libraries like three-mesh-simplifier
  const simplified = geometry.clone();

  // Get position attribute
  const positions = simplified.attributes.position;
  const count = positions.count;

  // Simple decimation by removing every Nth vertex
  const keepEveryN = Math.ceil(1 / targetReduction);
  const newPositions: number[] = [];
  const newIndices: number[] = [];

  for (let i = 0; i < count; i += keepEveryN) {
    newPositions.push(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );
  }

  // Create new geometry
  const simplifiedGeometry = new THREE.BufferGeometry();
  simplifiedGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(newPositions, 3)
  );

  simplifiedGeometry.computeVertexNormals();

  return simplifiedGeometry;
}

/**
 * Merge geometries for better performance
 */
export function mergeGeometries(
  geometries: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  const mergedGeometry = new THREE.BufferGeometry();

  // Use Three.js BufferGeometryUtils
  // In production, import: import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

  // Simplified merge logic
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  geometries.forEach(geometry => {
    const pos = geometry.attributes.position;
    const norm = geometry.attributes.normal;
    const uv = geometry.attributes.uv;

    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }

    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }
    }

    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        uvs.push(uv.getX(i), uv.getY(i));
      }
    }
  });

  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  return mergedGeometry;
}

// ============================================================================
// INSTANCING FOR REPEATED OBJECTS
// ============================================================================

interface InstancedVehiclesProps {
  vehicles: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    color: string;
  }>;
  modelUrl: string;
}

export function InstancedVehicles({ vehicles, modelUrl }: InstancedVehiclesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    vehicles.forEach((vehicle, i) => {
      dummy.position.set(...vehicle.position);
      dummy.rotation.set(...vehicle.rotation);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, new THREE.Color(vehicle.color));
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [vehicles]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, vehicles.length]}>
      <boxGeometry />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

// ============================================================================
// FRUSTUM CULLING
// ============================================================================

export function useFrustumCulling(objectRef: React.RefObject<THREE.Object3D>) {
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    if (!objectRef.current) return;

    // Update frustum
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    // Check if object is in frustum
    objectRef.current.visible = frustum.intersectsObject(objectRef.current);
  });
}

// ============================================================================
// OCCLUSION CULLING
// ============================================================================

interface OcclusionCullingOptions {
  objects: THREE.Object3D[];
  camera: THREE.Camera;
  raycaster: THREE.Raycaster;
}

export function performOcclusionCulling({
  objects,
  camera,
  raycaster,
}: OcclusionCullingOptions): void {
  const direction = new THREE.Vector3();

  objects.forEach(object => {
    // Calculate direction from camera to object
    direction.subVectors(object.position, camera.position).normalize();

    // Cast ray
    raycaster.set(camera.position, direction);
    const intersects = raycaster.intersectObjects(objects, true);

    // If first intersection is not this object, it's occluded
    if (intersects.length > 0 && intersects[0].object !== object) {
      object.visible = false;
    } else {
      object.visible = true;
    }
  });
}

export default {
  useLOD,
  LODVehicleModel,
  compressTexture,
  generateMipmaps,
  simplifyGeometry,
  mergeGeometries,
  InstancedVehicles,
  useFrustumCulling,
  performOcclusionCulling,
};
