/**
 * 3DViewer - Real 3D model viewer using Three.js
 * Supports GLTF/GLB, OBJ, STL formats
 */

import { Suspense, useState } from 'react';
import { Download, Box, RotateCcw, Grid3X3, Sun } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Stage, Center, Grid } from '@react-three/drei';

import { Button } from '@/components/ui/button';
import { DocumentMetadata } from '@/lib/documents/types';
import { Slider } from '@/components/ui/slider';

interface ThreeDViewerProps {
  document: DocumentMetadata;
}

// 3D Model component that loads GLTF/GLB files
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

export function ThreeDViewer({ document }: ThreeDViewerProps) {
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [lightIntensity, setLightIntensity] = useState([1]);
  const [autoRotate, setAutoRotate] = useState(false);

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const isSupported = /\.(gltf|glb|obj)$/i.test(document.name);

  if (!isSupported) {
    // Fallback for unsupported formats
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center max-w-md p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-background flex items-center justify-center text-indigo-600">
            <Box className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{document.name}</h3>
          <p className="text-muted-foreground mb-4">
            This 3D format requires conversion. Supported formats: GLTF, GLB, OBJ
          </p>
          <Button onClick={handleDownload} size="lg">
            <Download className="mr-2 h-5 w-5" />
            Download model
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Controls toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Grid
          </Button>
          <Button
            variant={wireframe ? "default" : "outline"}
            size="sm"
            onClick={() => setWireframe(!wireframe)}
          >
            Wireframe
          </Button>
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Auto-Rotate
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-32">
            <Sun className="w-4 h-4 text-yellow-400" />
            <Slider
              value={lightIntensity}
              onValueChange={setLightIntensity}
              min={0.1}
              max={2}
              step={0.1}
              className="w-20"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
          shadows
        >
          <ambientLight intensity={0.3 * lightIntensity[0]} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={lightIntensity[0]}
            castShadow
          />

          <Suspense fallback={<LoadingFallback />}>
            <Stage environment="studio" intensity={0.5}>
              <Center>
                <Model url={document.url} />
              </Center>
            </Stage>
          </Suspense>

          {showGrid && (
            <Grid
              infiniteGrid
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#444"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#666"
              fadeDistance={30}
              fadeStrength={1}
            />
          )}

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enablePan
            enableZoom
            enableRotate
            minDistance={1}
            maxDistance={100}
          />

          <Environment preset="studio" />
        </Canvas>
      </div>

      {/* Instructions */}
      <div className="p-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400 text-center">
        Left-click drag to rotate • Scroll to zoom • Right-click drag to pan
      </div>
    </div>
  );
}
