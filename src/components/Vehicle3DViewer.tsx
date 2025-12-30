import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  Html,
  Sky,
  Grid,
  Stats,
  useProgress
} from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, SSAO, ToneMapping, DepthOfField, Vignette } from '@react-three/postprocessing';
import {
  Maximize2,
  Minimize2,
  Camera,
  Eye,
  EyeOff,
  Scan
} from 'lucide-react';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Vehicle3DViewerProps {
  vehicleId: number;
  modelUrl?: string;
  usdzUrl?: string;
  vehicleData?: {
    make: string;
    model: string;
    year: number;
    exteriorColor?: string;
    interiorColor?: string;
    damageMarkers?: Array<{
      location: { x: number; y: number; z: number };
      severity: 'minor' | 'moderate' | 'severe';
      type: string;
      description?: string;
    }>;
  };
  onARView?: () => void;
  onCustomize?: (customization: any) => void;
  className?: string;
}

// Advanced Car Paint Shader (Photorealistic PBR)
function createCarPaintMaterial(color: string, quality: 'low' | 'medium' | 'high'): THREE.MeshPhysicalMaterial {
  const baseColor = new THREE.Color(color);

  return new THREE.MeshPhysicalMaterial({
    // Base color
    color: baseColor,

    // PBR properties for car paint
    metalness: 0.9,           // High metalness for metallic paint
    roughness: quality === 'high' ? 0.15 : quality === 'medium' ? 0.2 : 0.3,  // Smooth finish

    // Clearcoat (this is KEY for photorealistic car paint!)
    clearcoat: quality === 'high' ? 1.0 : quality === 'medium' ? 0.8 : 0.5,   // Full clearcoat on high
    clearcoatRoughness: quality === 'high' ? 0.03 : quality === 'medium' ? 0.05 : 0.1,  // Super smooth clearcoat

    // Reflectivity
    reflectivity: 1.0,         // Maximum reflectivity

    // Environment map intensity (for HDRI reflections)
    envMapIntensity: quality === 'high' ? 2.0 : quality === 'medium' ? 1.5 : 1.0,

    // IOR (Index of Refraction) for realistic light bending
    ior: 1.5,                  // Glass-like IOR for clearcoat

    // Sheen (for pearl/metallic paint effects)
    sheen: 0.5,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(color).offsetHSL(0, 0, 0.1),  // Slightly brighter sheen

    // Transmission (for deep paint effect - advanced)
    transmission: 0,
    thickness: 0.5,

    // Enable shadows
    shadowSide: THREE.FrontSide,
  });
}

// Chrome/Metal Material for trim, wheels, etc.
function createChromeMaterial(quality: 'low' | 'medium' | 'high'): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: quality === 'high' ? 0.05 : quality === 'medium' ? 0.1 : 0.2,
    envMapIntensity: quality === 'high' ? 3.0 : 2.0,
  });
}

// Glass Material for windows
function createGlassMaterial(quality: 'low' | 'medium' | 'high'): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0,
    roughness: quality === 'high' ? 0 : 0.05,
    transmission: quality === 'high' ? 0.95 : quality === 'medium' ? 0.8 : 0.5,  // Transparency
    thickness: 0.5,
    ior: 1.5,  // Glass IOR
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
}

// Rubber Material for tires
function createRubberMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0,
    roughness: 0.9,  // Very rough
    envMapIntensity: 0.3,
  });
}

// Vehicle Model Component (Enhanced with PBR)
function VehicleModel({
  url,
  exteriorColor = '#ffffff',
  showDamage = false,
  damageMarkers = [],
  quality = 'medium'
}: {
  url: string;
  exteriorColor?: string;
  showDamage?: boolean;
  damageMarkers?: Array<{
    location: { x: number; y: number; z: number };
    severity: 'minor' | 'moderate' | 'severe';
    type: string;
    description?: string;
  }>;
  quality?: 'low' | 'medium' | 'high';
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Load GLTF model (placeholder for now)
  // In production, this would load actual vehicle models
  const { scene } = useGLTF(url || '/models/placeholder/sedan.glb', true);

  useEffect(() => {
    if (scene) {
      // Create photorealistic materials
      const paintMaterial = createCarPaintMaterial(exteriorColor, quality);
      const chromeMaterial = createChromeMaterial(quality);
      const glassMaterial = createGlassMaterial(quality);
      const rubberMaterial = createRubberMaterial();

      // Apply materials to different parts of the vehicle
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Apply PBR materials based on part name
          if (child.name.includes('body') || child.name.includes('paint') || child.name.includes('panel')) {
            // Car body - photorealistic paint
            child.material = paintMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
          else if (child.name.includes('chrome') || child.name.includes('trim') || child.name.includes('bumper')) {
            // Chrome/metal parts
            child.material = chromeMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
          else if (child.name.includes('glass') || child.name.includes('window') || child.name.includes('windshield')) {
            // Glass - with refraction
            child.material = glassMaterial;
            child.castShadow = false;
            child.receiveShadow = true;
          }
          else if (child.name.includes('tire') || child.name.includes('rubber')) {
            // Tires - matte rubber
            child.material = rubberMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
          else if (child.name.includes('wheel') || child.name.includes('rim')) {
            // Wheels - chrome
            child.material = chromeMaterial.clone();
            child.castShadow = true;
            child.receiveShadow = true;
          }
          else {
            // Default - enhance existing material if it's Standard
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.envMapIntensity = quality === 'high' ? 1.5 : 1.0;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
        }
      });
      setModelLoaded(true);
    }
  }, [scene, exteriorColor, quality]);

  // Subtle idle animation with realistic physics
  useFrame(({ clock }) => {
    if (groupRef.current && modelLoaded) {
      const time = clock.getElapsedTime();
      // Very subtle breathing motion (like car suspension settling)
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.002;
      groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />

      {/* Damage markers */}
      {showDamage && damageMarkers.map((marker, index) => (
        <DamageMarker
          key={index}
          position={[marker.location?.x ?? 0, marker.location?.y ?? 0, marker.location?.z ?? 0]}
          severity={marker.severity}
          type={marker.type}
          description={marker.description}
        />
      ))}
    </group>
  );
}

// Damage Marker Component
function DamageMarker({
  position,
  severity,
  type,
  description
}: {
  position: [number, number, number];
  severity: 'minor' | 'moderate' | 'severe';
  type: string;
  description?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const color = severity === 'severe' ? new THREE.Color('#ef4444') :
                severity === 'moderate' ? new THREE.Color('#f59e0b') : new THREE.Color('#10b981');

  return (
    <mesh
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.8 : 0.3}
        transparent
        opacity={0.7}
      />

      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
            <div className="font-semibold">{type}</div>
            <div className="text-xs text-gray-300">{severity}</div>
            {description && <div className="text-xs mt-1">{description}</div>}
          </div>
        </Html>
      )}
    </mesh>
  );
}

// Ground Plane Component
function GroundPlane() {
  return (
    <>
      <ContactShadows
        position={[0, -0.8, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
      />
      <Grid
        position={[0, -0.8, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
    </>
  );
}

// Scene Component with all 3D elements (Enhanced)
function Scene({
  modelUrl,
  exteriorColor,
  environment,
  showDamage,
  damageMarkers,
  quality,
  cameraPreset,
  enablePostProcessing = true,
  showStats = false
}: {
  modelUrl: string;
  exteriorColor: string;
  environment: string;
  showDamage: boolean;
  damageMarkers: Array<{
    location: { x: number; y: number; z: number };
    severity: 'minor' | 'moderate' | 'severe';
    type: string;
    description?: string;
  }>;
  quality: 'low' | 'medium' | 'high';
  cameraPreset: { x: number; y: number; z: number; target?: { x: number; y: number; z: number } };
  enablePostProcessing?: boolean;
  showStats?: boolean;
}) {
  const { camera } = useThree();
  useEffect(() => {
    // Apply camera preset with smooth transition
    if (cameraPreset) {
      camera.position.set(cameraPreset.x, cameraPreset.y, cameraPreset.z);
      if (cameraPreset.target) {
        camera.lookAt(cameraPreset.target.x, cameraPreset.target.y, cameraPreset.target.z);
      }
    }
  }, [cameraPreset, camera]);

  // Enhanced lighting setup
  const shadowMapSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;

  return (
    <>
      {/* Performance Stats (when enabled) */}
      {showStats && <Stats />}

      {/* Enhanced Lighting System */}
      <ambientLight intensity={0.3} />

      {/* Main Key Light */}
      <spotLight
        position={[10, 15, 10]}
        angle={0.3}
        penumbra={1}
        intensity={1.5}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0001}
      />

      {/* Fill Light */}
      <spotLight
        position={[-10, 10, -10]}
        angle={0.4}
        penumbra={1}
        intensity={0.5}
        castShadow
        shadow-mapSize={[shadowMapSize / 2, shadowMapSize / 2]}
      />

      {/* Rim Light */}
      <pointLight position={[0, 5, -10]} intensity={0.8} color="#88ccff" />

      {/* Ground Bounce Light */}
      <hemisphereLight
        intensity={0.3}
        color="#ffffff"
        groundColor="#444444"
      />

      {/* HDRI Environment for Photorealistic Reflections */}
      {environment === 'studio' && (
        <Environment
          preset="studio"
          background={false}
          blur={0.1}           // Slight blur for softer reflections
          resolution={quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512}
        />
      )}
      {environment === 'sunset' && (
        <>
          <Sky
            sunPosition={[100, 20, 100]}
            turbidity={8}
            rayleigh={2}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
          <Environment
            preset="sunset"
            background={false}
            blur={0.05}
            resolution={quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512}
          />
        </>
      )}
      {environment === 'city' && (
        <Environment
          preset="city"
          background={false}
          blur={0.15}
          resolution={quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512}
        />
      )}
      {environment === 'night' && (
        <>
          <Environment
            preset="night"
            background={false}
            blur={0.2}
            resolution={quality === 'high' ? 1024 : 512}
          />
          <pointLight position={[0, 5, 0]} intensity={2} color="#ffaa00" decay={2} />
        </>
      )}

      {/* Ground */}
      <GroundPlane />

      {/* Vehicle Model */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <VehicleModel
          url={modelUrl}
          exteriorColor={exteriorColor}
          showDamage={showDamage}
          damageMarkers={damageMarkers}
          quality={quality}
        />
      </Suspense>

      {/* Camera Controls with Touch Support */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.5, 0]}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.8}
        zoomSpeed={0.8}
        panSpeed={0.5}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </>
  );
}

// Loading Placeholder Component
function LoadingPlaceholder() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 1, 4]} />
      <meshStandardMaterial color="#444444" />
    </mesh>
  );
}

export default function Vehicle3DViewer({
  vehicleId,
  modelUrl = '/models/placeholder/sedan.glb',
  usdzUrl,
  vehicleData,
  onARView,
  onCustomize,
  className
}: Vehicle3DViewerProps) {
  const [quality] = useState<'low' | 'medium' | 'high'>('medium');
  const [environment] = useState<string>('studio');
  const [showDamage] = useState<boolean>(false);
  const [cameraPreset] = useState<{ x: number; y: number; z: number; target: { x: number; y: number; z: number } }>({
    x: 5,
    y: 3,
    z: 5,
    target: { x: 0, y: 0.5, z: 0 }
  });

  return (
    <div className={`relative w-full h-[500px] ${className || ''}`}>
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 60 }}
        gl={{ antialias: quality === 'high', alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          modelUrl={modelUrl}
          exteriorColor={vehicleData?.exteriorColor || '#ffffff'}
          environment={environment}
          showDamage={showDamage}
          damageMarkers={vehicleData?.damageMarkers || []}
          quality={quality}
          cameraPreset={cameraPreset}
          enablePostProcessing={quality !== 'low'}
          showStats={false}
        />
      </Canvas>
    </div>
  );
}