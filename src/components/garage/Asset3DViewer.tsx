/**
 * Asset3DViewer - Comprehensive 3D Vehicle Viewer Component
 *
 * Features:
 * - Dynamic model resolution based on make/model/category
 * - Photorealistic materials with custom color support
 * - Cinematic camera system with preset views
 * - Damage point visualization on 3D model
 * - Device capability detection for performance optimization
 * - Proper error handling and loading states
 *
 * Updated: 2025-01-03 - Resolved merge conflicts and unified implementations
 */

import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Html } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef, useState, Suspense, useMemo, useCallback } from 'react';
import * as THREE from 'three';

import { PhotorealisticMaterials } from '../../materials/PhotorealisticMaterials';
import { detectWebGLCapabilities } from '../../utils/WebGLCompatibilityManager';

import type { DamagePoint } from '@/components/garage/DamageOverlay';
import type { AssetCategory, AssetType } from '@/types/asset.types';

// ============================================================================
// TYPES
// ============================================================================

export interface Asset3DViewerProps {
  // Vehicle identification - used for model resolution
  assetCategory?: AssetCategory | string;
  assetType?: AssetType | string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;

  // Direct model URL (takes precedence over auto-resolution)
  customModelUrl?: string;
  modelUrl?: string;  // Backward compatibility

  // Damage visualization
  damagePoints?: DamagePoint[];
  selectedDamageId?: string;
  onSelectDamage?: (point: DamagePoint) => void;
  showDamage?: boolean;

  // Camera and display options
  autoRotate?: boolean;
  currentCamera?: string;
  qualityLevel?: 'low' | 'medium' | 'high' | 'ultra';
  showControls?: boolean;

  // Callbacks
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onCameraChange?: (preset: string) => void;
}

// Camera preset positions
interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

const CAMERA_PRESETS: Record<string, CameraPreset> = {
  hero: { position: [8, 4, 8], target: [0, 0.5, 0], fov: 45 },
  front: { position: [0, 2, 8], target: [0, 1, 0], fov: 50 },
  rear: { position: [0, 2, -8], target: [0, 1, 0], fov: 50 },
  left: { position: [-8, 2, 0], target: [0, 1, 0], fov: 50 },
  right: { position: [8, 2, 0], target: [0, 1, 0], fov: 50 },
  frontQuarter: { position: [6, 3, 6], target: [0, 0.8, 0], fov: 45 },
  rearQuarter: { position: [-6, 3, -6], target: [0, 0.8, 0], fov: 45 },
  topDown: { position: [0, 15, 0.1], target: [0, 0, 0], fov: 60 },
  lowAngle: { position: [4, 0.5, 4], target: [0, 1.5, 0], fov: 35 },
  interior: { position: [0.5, 1.2, 0.3], target: [0, 1.2, 1], fov: 70 },
  engineBay: { position: [0, 1.5, 3], target: [0, 0.8, 2], fov: 55 },
  wheelDetail: { position: [3, 0.8, 3], target: [1.5, 0.3, 1.5], fov: 40 },
  profile: { position: [10, 2, 0], target: [0, 1, 0], fov: 45 },
};

// ============================================================================
// MODEL URL RESOLUTION
// ============================================================================

/**
 * Resolves the appropriate 3D model URL based on vehicle information
 */
function resolveModelUrl(
  make?: string,
  model?: string,
  assetCategory?: string,
  assetType?: string,
  customModelUrl?: string
): string {
  // Direct URL takes precedence
  if (customModelUrl) return customModelUrl;

  // Try to resolve based on make and model
  if (make && model) {
    const normalizedMake = make.toLowerCase().replace(/[-\s]/g, '_');
    const normalizedModel = model.toLowerCase().replace(/[-\s]/g, '_');

    // Check known model mappings
    const modelMappings: Record<string, string> = {
      // Trucks
      'ford_f_150': '/models/vehicles/trucks/ford_f_150.glb',
      'ford_f_250': '/models/vehicles/trucks/ford_f_250.glb',
      'ford_f150': '/models/vehicles/trucks/ford_f_150.glb',
      'chevrolet_silverado': '/models/vehicles/trucks/chevrolet_silverado.glb',
      'chevrolet_silverado_1500': '/models/vehicles/trucks/chevrolet_silverado.glb',
      'chevrolet_colorado': '/models/vehicles/trucks/chevrolet_colorado.glb',
      'ram_1500': '/models/vehicles/trucks/ram_1500.glb',
      'ram_1500_big_horn': '/models/vehicles/trucks/ram_1500.glb',
      'toyota_tacoma': '/models/vehicles/trucks/toyota_tacoma.glb',
      'toyota_tacoma_trd': '/models/vehicles/trucks/toyota_tacoma.glb',
      'gmc_sierra': '/models/vehicles/trucks/gmc_sierra.glb',
      'freightliner_cascadia': '/models/vehicles/trucks/freightliner_cascadia.glb',
      'kenworth_t680': '/models/vehicles/trucks/kenworth_t680.glb',
      'mack_anthem': '/models/vehicles/trucks/mack_anthem.glb',

      // Vans
      'ford_transit': '/models/vehicles/vans/ford_transit.glb',
      'ford_transit_350': '/models/vehicles/vans/ford_transit.glb',
      'mercedes_benz_sprinter': '/models/vehicles/vans/mercedes_benz_sprinter.glb',
      'mercedes_sprinter': '/models/vehicles/vans/mercedes_benz_sprinter.glb',
      'sprinter_2500': '/models/vehicles/vans/mercedes_benz_sprinter.glb',
      'ram_promaster': '/models/vehicles/vans/ram_promaster.glb',
      'nissan_nv3500': '/models/vehicles/vans/nissan_nv3500.glb',

      // Sedans
      'toyota_camry': '/models/vehicles/sedans/toyota_camry.glb',
      'toyota_corolla': '/models/vehicles/sedans/toyota_corolla.glb',
      'honda_accord': '/models/vehicles/sedans/honda_accord.glb',
      'nissan_altima': '/models/vehicles/sedans/nissan_altima.glb',
      'tesla_model_3': '/models/vehicles/sedans/tesla_model_3.glb',
      'tesla_model_s': '/models/vehicles/sedans/tesla_model_s.glb',

      // SUVs
      'tesla_model_y': '/models/vehicles/electric_suvs/tesla_model_y.glb',
      'tesla_model_x': '/models/vehicles/suvs/tesla_model_x.glb',
      'chevrolet_tahoe': '/models/vehicles/suvs/chevrolet_tahoe.glb',
      'ford_explorer': '/models/vehicles/suvs/ford_explorer.glb',
      'honda_cr_v': '/models/vehicles/suvs/honda_cr_v.glb',
      'jeep_wrangler': '/models/vehicles/suvs/jeep_wrangler.glb',

      // Construction/Heavy Equipment
      'caterpillar_320': '/models/vehicles/construction/caterpillar_320.glb',
      'john_deere_200g': '/models/vehicles/construction/john_deere_200g.glb',
      'komatsu_pc210': '/models/vehicles/construction/komatsu_pc210.glb',
      'volvo_ec220': '/models/vehicles/construction/volvo_ec220.glb',
      'hitachi_zx210': '/models/vehicles/construction/hitachi_zx210.glb',
      'kenworth_t880': '/models/vehicles/construction/kenworth_t880.glb',
      'peterbilt_567': '/models/vehicles/construction/peterbilt_567.glb',
      'mack_granite': '/models/vehicles/construction/mack_granite.glb',

      // Altech fleet vehicles
      'altech_st_200_service': '/models/vehicles/trucks/altech_st_200_service.glb',
      'altech_fh_250_flatbed': '/models/vehicles/trucks/altech_fh_250_flatbed.glb',
      'altech_fh_300_flatbed': '/models/vehicles/trucks/altech_fh_300_flatbed.glb',
      'altech_hd_40_dump': '/models/vehicles/construction/altech_hd_40_dump_truck.glb',
      'altech_wt_2000_water': '/models/vehicles/trucks/altech_wt_2000_water.glb',
      'altech_fl_1500_fuel_lube': '/models/vehicles/trucks/altech_fl_1500_fuel_lube.glb',
    };

    // Try exact match first
    const exactKey = `${normalizedMake}_${normalizedModel}`;
    if (modelMappings[exactKey]) {
      return modelMappings[exactKey];
    }

    // Try just the model name
    if (modelMappings[normalizedModel]) {
      return modelMappings[normalizedModel];
    }

    // Try partial matching
    for (const [key, url] of Object.entries(modelMappings)) {
      if (key.includes(normalizedMake) && key.includes(normalizedModel.split('_')[0])) {
        return url;
      }
    }
  }

  // Fall back to category-based defaults
  const categoryDefaults: Record<string, string> = {
    'HEAVY_TRUCK': '/models/vehicles/trucks/ford_f_150.glb',
    'LIGHT_COMMERCIAL': '/models/vehicles/trucks/ford_f_150.glb',
    'PASSENGER_VEHICLE': '/models/vehicles/sedans/sample_sedan.glb',
    'HEAVY_EQUIPMENT': '/models/vehicles/construction/caterpillar_320.glb',
    'CONSTRUCTION': '/models/vehicles/construction/caterpillar_320.glb',
    'TRAILER': '/models/vehicles/trailers/utility_3000r.glb',
  };

  if (assetCategory && categoryDefaults[assetCategory]) {
    return categoryDefaults[assetCategory];
  }

  // Asset type defaults
  const typeDefaults: Record<string, string> = {
    'PICKUP_TRUCK': '/models/vehicles/trucks/ford_f_150.glb',
    'CARGO_VAN': '/models/vehicles/vans/ford_transit.glb',
    'SEMI_TRUCK': '/models/vehicles/trucks/freightliner_cascadia.glb',
    'DUMP_TRUCK': '/models/vehicles/construction/altech_hd_40_dump_truck.glb',
    'EXCAVATOR': '/models/vehicles/construction/caterpillar_320.glb',
    'SEDAN': '/models/vehicles/sedans/sample_sedan.glb',
    'SUV': '/models/vehicles/suvs/ford_explorer.glb',
  };

  if (assetType && typeDefaults[assetType]) {
    return typeDefaults[assetType];
  }

  // Ultimate fallback
  return '/models/vehicles/trucks/sample_truck.glb';
}

// ============================================================================
// DAMAGE MARKER COMPONENT
// ============================================================================

interface DamageMarkerProps {
  point: DamagePoint;
  isSelected: boolean;
  onClick: () => void;
}

function DamageMarker({ point, isSelected, onClick }: DamageMarkerProps) {
  const severityColors: Record<string, string> = {
    minor: '#22c55e',    // Green
    moderate: '#eab308', // Yellow
    severe: '#f97316',   // Orange
    critical: '#ef4444', // Red
  };

  const color = severityColors[point.severity] || severityColors.moderate;

  // Use the 3D position from the damage point
  const position = point.position;

  return (
    <group position={position}>
      {/* Outer ring animation */}
      <mesh onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[isSelected ? 0.15 : 0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1 : 0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Tooltip on hover/select */}
      {isSelected && (
        <Html center distanceFactor={10}>
          <div className="bg-slate-900/95 text-white text-xs px-3 py-2 rounded-lg shadow-sm whitespace-nowrap">
            <div className="font-semibold">{point.zone}</div>
            <div className="text-slate-300 capitalize">{point.severity} damage</div>
            {point.description && (
              <div className="text-slate-400 mt-1">{point.description}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// VEHICLE MODEL COMPONENT
// ============================================================================

interface VehicleModelProps {
  url: string;
  color?: string;
  damagePoints?: DamagePoint[];
  selectedDamageId?: string;
  onSelectDamage?: (point: DamagePoint) => void;
  showDamage?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

function VehicleModel({
  url,
  color = '#1a5490',
  damagePoints = [],
  selectedDamageId,
  onSelectDamage,
  showDamage = true,
  onLoad,
  onError
}: VehicleModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Load the GLTF model with error handling
  let scene: THREE.Group;
  try {
    const gltf = useGLTF(url);
    scene = gltf.scene;
  } catch (error) {
    useEffect(() => {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to load 3D model'));
      }
    }, [error, onError]);

    return (
      <Html center>
        <div className="bg-red-900/90 text-white px-2 py-2 rounded-lg text-sm">
          Failed to load model
        </div>
      </Html>
    );
  }

  useEffect(() => {
    if (!scene) return;

    // Apply photorealistic materials to vehicle
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name.toLowerCase();

        if (meshName.includes('body') || meshName.includes('paint') || meshName.includes('exterior')) {
          mesh.material = PhotorealisticMaterials.createCarPaintMaterial(color, 'gloss');
        } else if (meshName.includes('glass') || meshName.includes('window') || meshName.includes('windshield')) {
          mesh.material = PhotorealisticMaterials.createAutomotiveGlass(0.3);
        } else if (meshName.includes('chrome') || meshName.includes('trim') || meshName.includes('grill')) {
          mesh.material = PhotorealisticMaterials.createChromeMaterial();
        } else if (meshName.includes('tire') || meshName.includes('rubber')) {
          mesh.material = PhotorealisticMaterials.createTireMaterial();
        } else if (meshName.includes('wheel') || meshName.includes('rim') || meshName.includes('alloy')) {
          mesh.material = PhotorealisticMaterials.createAluminumMaterial();
        } else if (meshName.includes('leather') || meshName.includes('seat') || meshName.includes('interior')) {
          mesh.material = PhotorealisticMaterials.createLeatherMaterial('#1a1a1a');
        } else if (meshName.includes('carbon') || meshName.includes('fiber')) {
          mesh.material = PhotorealisticMaterials.createCarbonFiberMaterial();
        } else if (meshName.includes('brake') || meshName.includes('disc') || meshName.includes('rotor')) {
          mesh.material = PhotorealisticMaterials.createBrakeDiscMaterial();
        }

        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    // Center and scale model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Scale to fit viewport (max dimension ~4 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 4 / maxDim : 1;
    scene.scale.setScalar(scale);

    // Center the model
    scene.position.sub(center.multiplyScalar(scale));
    scene.position.y = 0; // Keep on ground plane

    setModelLoaded(true);
    if (onLoad) onLoad();
  }, [scene, color, onLoad]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />

      {/* Damage markers */}
      {showDamage && modelLoaded && damagePoints.map((point) => (
        <DamageMarker
          key={point.id}
          point={point}
          isSelected={point.id === selectedDamageId}
          onClick={() => { onSelectDamage?.(point); }}
        />
      ))}
    </group>
  );
}

// ============================================================================
// CAMERA CONTROLLER COMPONENT
// ============================================================================

interface CameraControllerProps {
  preset: CameraPreset;
  autoRotate: boolean;
  enableControls: boolean;
}

function CameraController({ preset, autoRotate, enableControls }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const targetPosition = useRef(new THREE.Vector3(...preset.position));
  const targetLookAt = useRef(new THREE.Vector3(...preset.target));

  useEffect(() => {
    targetPosition.current.set(...preset.position);
    targetLookAt.current.set(...preset.target);
    setIsAnimating(true);
  }, [preset]);

  useFrame(() => {
    if (isAnimating) {
      // Smooth camera transition
      camera.position.lerp(targetPosition.current, 0.05);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.05);
      }

      // Check if animation is complete
      if (camera.position.distanceTo(targetPosition.current) < 0.01) {
        setIsAnimating(false);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={preset.position}
        fov={preset.fov}
      />
      <OrbitControls
        ref={controlsRef}
        target={preset.target}
        enablePan={enableControls}
        enableZoom={enableControls}
        enableRotate={enableControls}
        autoRotate={autoRotate && !isAnimating}
        autoRotateSpeed={1}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={20}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Asset3DViewer({
  assetCategory,
  assetType,
  make,
  model,
  year,
  color = '#3B82F6',
  customModelUrl,
  modelUrl,
  damagePoints = [],
  selectedDamageId,
  onSelectDamage,
  showDamage = true,
  autoRotate = false,
  currentCamera = 'hero',
  qualityLevel = 'high',
  showControls = true,
  onLoad,
  onError,
  onCameraChange,
}: Asset3DViewerProps) {
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [internalCamera, setInternalCamera] = useState(currentCamera);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Resolve model URL
  const resolvedModelUrl = useMemo(() => {
    return customModelUrl || modelUrl || resolveModelUrl(make, model, assetCategory, assetType);
  }, [make, model, assetCategory, assetType, customModelUrl, modelUrl]);

  // Get current camera preset
  const cameraPreset = useMemo(() => {
    return CAMERA_PRESETS[internalCamera] || CAMERA_PRESETS.hero;
  }, [internalCamera]);

  // Detect device capabilities on mount
  useEffect(() => {
    const capabilities = detectWebGLCapabilities();
    setDeviceCapabilities(capabilities);
  }, []);

  // Sync external camera prop
  useEffect(() => {
    if (currentCamera !== internalCamera) {
      setInternalCamera(currentCamera);
    }
  }, [currentCamera]);

  // Handle camera change
  const handleCameraChange = useCallback((preset: string) => {
    setInternalCamera(preset);
    onCameraChange?.(preset);
  }, [onCameraChange]);

  // Handle model load
  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Handle model error
  const handleModelError = useCallback((error: Error) => {
    setLoadError(error);
    setIsLoading(false);
    onError?.(error);
  }, [onError]);

  // Calculate DPR based on quality and device capabilities
  const dpr = useMemo(() => {
    const qualityDpr = {
      low: [1, 1],
      medium: [1, 1.5],
      high: [1, 2],
      ultra: [1.5, 2.5],
    };
    return qualityDpr[qualityLevel] || qualityDpr.high;
  }, [qualityLevel]) as [number, number];

  // Camera preset list for UI
  const cameraPresetList = [
    'hero', 'frontQuarter', 'rearQuarter', 'profile',
    'front', 'rear', 'left', 'right',
    'topDown', 'lowAngle', 'wheelDetail'
  ];

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={dpr}
        gl={{
          antialias: qualityLevel !== 'low',
          alpha: true,
          powerPreference: qualityLevel === 'ultra' ? 'high-performance' : 'default',
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Suspense fallback={null}>
          {/* Camera and Controls */}
          <CameraController
            preset={cameraPreset}
            autoRotate={autoRotate}
            enableControls={true}
          />

          {/* Lighting System */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={qualityLevel === 'low' ? 1024 : 2048}
            shadow-mapSize-height={qualityLevel === 'low' ? 1024 : 2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <directionalLight position={[-10, 5, -5]} intensity={0.5} />
          <directionalLight position={[0, -5, 0]} intensity={0.2} />

          {/* Fill lights for automotive look */}
          <pointLight position={[5, 2, 0]} intensity={0.3} color="#fff5e0" />
          <pointLight position={[-5, 2, 0]} intensity={0.3} color="#e0f0ff" />

          {/* Environment */}
          <Environment
            preset="sunset"
            background={false}
          />

          {/* Ground plane with reflection */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial
              color="#1a1a2e"
              metalness={0.8}
              roughness={0.2}
              envMapIntensity={0.5}
            />
          </mesh>

          {/* Vehicle Model */}
          <VehicleModel
            url={resolvedModelUrl}
            color={color}
            damagePoints={damagePoints}
            selectedDamageId={selectedDamageId}
            onSelectDamage={onSelectDamage}
            showDamage={showDamage}
            onLoad={handleModelLoad}
            onError={handleModelError}
          />
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-center text-white">
            <div className="w-12 h-9 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center text-white p-3">
            <div className="text-red-400 text-sm mb-3">⚠️</div>
            <p className="text-sm font-semibold mb-2">Failed to load 3D model</p>
            <p className="text-sm text-slate-400">{loadError.message}</p>
          </div>
        </div>
      )}

      {/* Camera Preset Controls */}
      {showControls && !loadError && (
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-sm p-2 space-y-2">
          <h3 className="font-semibold text-sm text-white mb-2">Camera Views</h3>
          <div className="grid grid-cols-2 gap-2">
            {cameraPresetList.map(preset => (
              <button
                key={preset}
                onClick={() => handleCameraChange(preset)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  internalCamera === preset
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {preset.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Device Info Badge */}
      {deviceCapabilities && (
        <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2">
          <span className={deviceCapabilities.webgl2 ? 'text-green-400' : 'text-yellow-400'}>●</span>
          <span>WebGL {deviceCapabilities.webgl2 ? '2.0' : '1.0'}</span>
          {deviceCapabilities.maxTextureSize && (
            <span className="text-slate-400">| {deviceCapabilities.maxTextureSize}px max</span>
          )}
        </div>
      )}

      {/* Vehicle Info Badge */}
      {(make || model) && (
        <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-xs px-3 py-2 rounded-lg">
          {year && <span>{year} </span>}
          {make && <span>{make} </span>}
          {model && <span>{model}</span>}
        </div>
      )}
    </div>
  );
}

// Default export for lazy loading
export default Asset3DViewer;
