import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from '@react-three/drei';
import { PhotorealisticMaterials } from '../../materials/PhotorealisticMaterials';
import { CinematicCameraSystem } from '../../camera/CinematicCameraSystem';
import { detectWebGLCapabilities } from '../../utils/WebGLCompatibilityManager';
import { PBRMaterialSystem } from '../../materials/PBRMaterialSystem';
import * as THREE from 'three';

interface Asset3DViewerProps {
  modelUrl: string;
  vehicleType?: 'sedan' | 'suv' | 'truck' | 'construction';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

function VehicleModel({ url, vehicleType }: { url: string; vehicleType: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    // Apply photorealistic materials to vehicle
    const materials = PhotorealisticMaterials;

    scene.traverse((child: any) => {
      if (child.isMesh) {
        const meshName = child.name.toLowerCase();

        if (meshName.includes('body') || meshName.includes('paint')) {
          child.material = materials.createCarPaintMaterial('#1a5490', 'gloss');
        } else if (meshName.includes('glass') || meshName.includes('window')) {
          child.material = materials.createAutomotiveGlass(0.3);
        } else if (meshName.includes('chrome') || meshName.includes('trim')) {
          child.material = materials.createChromeMaterial();
        } else if (meshName.includes('tire') || meshName.includes('wheel')) {
          child.material = materials.createTireMaterial();
        }
      }
    });
  }, [scene, vehicleType]);

  return <primitive object={scene} />;
}

export function Asset3DViewer({ modelUrl, vehicleType = 'sedan', onLoad, onError }: Asset3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [currentCamera, setCurrentCamera] = useState('hero');
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    // Detect device capabilities
    const capabilities = detectWebGLCapabilities();
    setDeviceCapabilities(capabilities);
  }, []);

  const handleCameraChange = (preset: string) => {
    setCurrentCamera(preset);
  };

  const cameraPresets = [
    'hero', 'frontQuarter', 'rearQuarter', 'profile',
    'topDown', 'interior', 'engineBay', 'wheelDetail'
  ];

  return (
    <div className="relative w-full h-full">
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
          <PerspectiveCamera makeDefault position={[4, 2, 4]} fov={50} />

          {/* Lighting System */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-10, 5, -5]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="sunset" background={false} />

          {/* Vehicle Model with Photorealistic Materials */}
          <VehicleModel url={modelUrl} vehicleType={vehicleType} />

          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={2}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>

      {/* Camera Preset Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-white/90 rounded-lg shadow-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm mb-2">Camera Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {cameraPresets.map(preset => (
              <button
                key={preset}
                onClick={() => handleCameraChange(preset)}
                className={`px-3 py-1 text-xs rounded ${currentCamera === preset
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Device Info Badge */}
      {deviceCapabilities && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded">
          WebGL {deviceCapabilities.webgl2 ? '2.0' : '1.0'}
        </div>
      )}
    </div>
  );
}
