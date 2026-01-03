import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Stage, ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useEffect, useRef, useState, Suspense, useMemo } from 'react';
import * as THREE from 'three';

import { PhotorealisticMaterials } from '../../materials/PhotorealisticMaterials';
import { detectWebGLCapabilities } from '../../utils/WebGLCompatibilityManager';
import { DamageOverlay, DamagePoint } from './DamageOverlay';

// =============================================================================
// TYPES
// =============================================================================

interface Asset3DViewerProps {
  // Asset Identification
  assetCategory?: string;
  assetType?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;

  // Model Data
  modelUrl?: string; // Legacy
  customModelUrl?: string; // New

  // Damage Integration
  damagePoints?: DamagePoint[];
  selectedDamageId?: string;
  onSelectDamage?: (point: DamagePoint) => void;
  showDamage?: boolean;

  // View Controls
  autoRotate?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// =============================================================================
// MODEL RESOLUTION UTILITY
// =============================================================================

const resolveModelUrl = (props: Partial<Asset3DViewerProps>): string => {
  if (props.customModelUrl) return props.customModelUrl;
  if (props.modelUrl) return props.modelUrl;

  const make = props.make?.toLowerCase() || '';
  const model = props.model?.toLowerCase() || '';
  const type = props.assetType?.toLowerCase() || props.assetCategory?.toLowerCase() || '';

  // Specific Model Mappings
  if (make.includes('ford') && model.includes('f-150')) return '/models/vehicles/trucks/ford_f_150.glb';
  if (make.includes('chevrolet') && model.includes('silverado')) return '/models/vehicles/trucks/chevrolet_silverado.glb';
  if (make.includes('ram')) return '/models/vehicles/trucks/ram_1500.glb';
  if (make.includes('toyota') && model.includes('tacoma')) return '/models/vehicles/trucks/toyota_tacoma.glb';
  if (make.includes('mercedes') && model.includes('sprinter')) return '/models/vehicles/vans/mercedes_benz_sprinter.glb';
  if (make.includes('tesla') && model.includes('model y')) return '/models/vehicles/electric_suvs/tesla_model_y.glb';
  if (make.includes('freightliner')) return '/models/vehicles/trucks/freightliner_cascadia.glb';
  if (make.includes('altech') && model.includes('dump')) return '/models/vehicles/construction/altech_hd_40_dump_truck.glb';
  if (make.includes('altech') && model.includes('service')) return '/models/vehicles/trucks/altech_st_200_service.glb';

  // Fallback by Type
  if (type.includes('truck')) return '/models/vehicles/trucks/ford_f_150.glb';
  if (type.includes('van')) return '/models/vehicles/vans/ford_transit.glb';
  if (type.includes('suv')) return '/models/vehicles/suvs/generic_suv.glb';
  if (type.includes('construction')) return '/models/vehicles/construction/altech_hd_40_dump_truck.glb';

  // Absolute Fallback
  return '/models/vehicles/sedans/generic_sedan.glb';
};

// =============================================================================
// VEHICLE MODEL COMPONENT
// =============================================================================

function VehicleModel({ url, color = '#1a5490' }: { url: string; color?: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    // Apply photorealistic materials to vehicle
    const materials = PhotorealisticMaterials;

    scene.traverse((child: any) => {
      if (child.isMesh) {
        const meshName = child.name.toLowerCase();

        // Advanced Material Multi-Pass
        if (meshName.includes('body') || meshName.includes('paint') || meshName.includes('car_paint')) {
          child.material = materials.createCarPaintMaterial(color, 'gloss');
          child.castShadow = true;
          child.receiveShadow = true;
        } else if (meshName.includes('glass') || meshName.includes('window') || meshName.includes('windshield')) {
          child.material = materials.createAutomotiveGlass(0.3);
        } else if (meshName.includes('chrome') || meshName.includes('trim') || meshName.includes('handle')) {
          child.material = materials.createChromeMaterial();
        } else if (meshName.includes('tire') || meshName.includes('rubber')) {
          child.material = materials.createTireMaterial();
        } else if (meshName.includes('wheel') || meshName.includes('rim') || meshName.includes('aluminum')) {
          child.material = materials.createAluminumMaterial();
        } else if (meshName.includes('leather') || meshName.includes('seat')) {
          child.material = materials.createLeatherMaterial('#2a2a2a');
        } else if (meshName.includes('carbon')) {
          child.material = materials.createCarbonFiberMaterial();
        } else if (meshName.includes('brake') || meshName.includes('disc')) {
          child.material = materials.createBrakeDiscMaterial();
        }
      }
    });
  }, [scene, color]);

  return <primitive object={scene} />;
}

// =============================================================================
// CAMERA PRESETS
// =============================================================================

const CAMERA_PRESETS: Record<string, [number, number, number]> = {
  hero: [5, 2.5, 5],
  front: [0, 1.5, 6],
  rear: [0, 1.5, -6],
  side: [6, 1, 0],
  top: [0, 10, 0],
  interior: [0, 1, 0.5],
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function Asset3DViewer(props: Asset3DViewerProps) {
  const {
    color = '#1E3A8A',
    damagePoints = [],
    selectedDamageId,
    onSelectDamage,
    showDamage = true,
    autoRotate = false
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [currentCamera, setCurrentCamera] = useState('hero');

  // Resolve Model URL
  const finalModelUrl = useMemo(() => resolveModelUrl(props), [props]);

  useEffect(() => {
    const capabilities = detectWebGLCapabilities();
    setDeviceCapabilities(capabilities);
  }, []);

  const handleCameraChange = (preset: string) => {
    setCurrentCamera(preset);
  };

  return (
    <div className="relative w-full h-full group">
      <Canvas
        ref={canvasRef}
        shadows
        dpr={deviceCapabilities?.webgl2 ? [1, 2] : [1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={CAMERA_PRESETS[currentCamera] || CAMERA_PRESETS.hero}
            fov={45}
          />

          <Stage
            intensity={0.5}
            environment="city"
            adjustCamera={false}
            shadows={{ type: 'contact', opacity: 0.4, blur: 2 }}
          >
            {/* Vehicle Model */}
            <VehicleModel url={finalModelUrl} color={color} />
          </Stage>

          {/* Light Rig */}
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

          {/* Damage Integration */}
          {showDamage && (
            <DamageOverlay
              damagePoints={damagePoints}
              selectedDamageId={selectedDamageId}
              onSelectDamage={onSelectDamage}
            />
          )}

          {/* Camera Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={4}
            maxDistance={12}
            makeDefault
          />

          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.5}
            scale={10}
            blur={2}
            far={10}
            resolution={512}
            color="#000000"
          />
        </Suspense>
      </Canvas>

      {/* Floating Camera Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        {Object.keys(CAMERA_PRESETS).map(preset => (
          <button
            key={preset}
            onClick={() => handleCameraChange(preset)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md border transition-all ${currentCamera === preset
                ? 'bg-primary/80 border-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
              }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <div className="bg-black/60 backdrop-blur-md text-[10px] text-slate-400 px-3 py-1.5 rounded-full border border-slate-800">
          GPU: {deviceCapabilities?.webgl2 ? 'WEBGL_2.0_ENABLED' : 'WEBGL_1.0_COMPAT'}
        </div>
        <div className="bg-black/60 backdrop-blur-md text-[10px] text-slate-500 px-3 py-1.5 rounded-full border border-slate-800">
          MODEL: {finalModelUrl.split('/').pop()}
        </div>
      </div>
    </div>
  );
}

export default Asset3DViewer;
