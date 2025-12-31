/**
 * 3DViewer - Interactive 3D model viewer (GLTF, GLB, etc.)
 * Uses @react-three/fiber and @react-three/drei for rendering
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center, useGLTF, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { Download, Box, RotateCcw, Grid3X3, Palette, ZoomIn, ZoomOut, Move3D, AlertCircle } from 'lucide-react';
import { Suspense, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DocumentMetadata } from '@/lib/documents/types';

interface ThreeDViewerProps {
  document: DocumentMetadata;
}

// Background color presets
const backgroundColors = [
  { name: 'Dark', value: '#1a1a2e' },
  { name: 'Light', value: '#f0f0f0' },
  { name: 'Blue', value: '#1e3a5f' },
  { name: 'Green', value: '#1a3a2e' },
  { name: 'Purple', value: '#2d1b4e' },
  { name: 'Neutral', value: '#404040' },
];

// Model component that loads GLTF/GLB files
function Model({ url, wireframe }: { url: string; wireframe: boolean }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.wireframe = wireframe;
          });
        } else if (child.material) {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [scene, wireframe]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

// Loading placeholder
function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

// Error fallback for unsupported formats
function UnsupportedFormat({ document, onDownload }: { document: DocumentMetadata; onDownload: () => void }) {
  return (
    <div className="flex items-center justify-center h-full bg-muted/30">
      <div className="text-center max-w-md p-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-semibold mb-2">{document.name}</h3>
        <p className="text-muted-foreground mb-4">3D Model</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            This 3D format is not directly viewable in the browser.
            For best results, use GLB or GLTF format files.
          </p>
        </div>

        <div className="text-xs text-muted-foreground mb-6">
          <p><strong>Supported browser formats:</strong></p>
          <ul className="list-disc list-inside mt-2">
            <li>GLTF (.gltf)</li>
            <li>GLB (.glb)</li>
          </ul>
        </div>

        <Button onClick={onDownload} size="lg">
          <Download className="mr-2 h-5 w-5" />
          Download Model
        </Button>
      </div>
    </div>
  );
}

export function ThreeDViewer({ document }: ThreeDViewerProps) {
  const controlsRef = useRef<any>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [autoRotate, setAutoRotate] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Check if the file format is supported for browser viewing
  const fileExtension = document.name.split('.').pop()?.toLowerCase();
  const isSupportedFormat = ['gltf', 'glb'].includes(fileExtension || '');

  if (!isSupportedFormat) {
    return <UnsupportedFormat document={document} onDownload={handleDownload} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-semibold mb-2">Failed to Load Model</h3>
          <p className="text-muted-foreground mb-6">
            Unable to load the 3D model. The file may be corrupted or inaccessible.
          </p>

          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Controls toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur border-b z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-sm">{document.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset camera */}
          <Button variant="outline" size="sm" onClick={resetCamera}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset View
          </Button>

          {/* Wireframe toggle */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="wireframe" className="text-xs">Wireframe</Label>
            <Switch
              id="wireframe"
              checked={wireframe}
              onCheckedChange={setWireframe}
            />
          </div>

          {/* Grid toggle */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <Move3D className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="grid" className="text-xs">Grid</Label>
            <Switch
              id="grid"
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
          </div>

          {/* Auto rotate */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="autorotate" className="text-xs">Auto Rotate</Label>
            <Switch
              id="autorotate"
              checked={autoRotate}
              onCheckedChange={setAutoRotate}
            />
          </div>

          {/* Background color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="mr-2 h-4 w-4" />
                Background
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid grid-cols-3 gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-10 h-10 rounded-md border-2 transition-all ${
                      bgColor === color.value ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setBgColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Download */}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
          onError={() => setError(true)}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />

          <Suspense fallback={<LoadingPlaceholder />}>
            <Model url={document.url} wireframe={wireframe} />
          </Suspense>

          {showGrid && (
            <Grid
              infiniteGrid
              fadeDistance={30}
              fadeStrength={1}
              cellSize={0.5}
              cellThickness={0.5}
              sectionSize={2}
              sectionThickness={1}
              cellColor="#6366f1"
              sectionColor="#818cf8"
            />
          )}

          <Environment preset="studio" />

          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enablePan
            enableZoom
            enableRotate
            minDistance={1}
            maxDistance={100}
          />

          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
          </GizmoHelper>
        </Canvas>

        {/* Help overlay */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Controls:</p>
          <ul className="space-y-0.5">
            <li>Left-click + drag: Rotate</li>
            <li>Right-click + drag: Pan</li>
            <li>Scroll: Zoom</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
