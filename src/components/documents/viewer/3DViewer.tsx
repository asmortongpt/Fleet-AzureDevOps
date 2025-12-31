/**
 * 3DViewer - Professional 3D model viewer with measurement, clipping, and annotations
 * Uses @react-three/fiber and @react-three/drei for rendering
 */

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Center, useGLTF, Grid, GizmoHelper, GizmoViewport, Html, Line } from '@react-three/drei';
import {
  Download, Box, RotateCcw, Grid3X3, Palette, AlertCircle, Camera,
  Ruler, Scissors, Info, Eye, EyeOff, Layers, X
} from 'lucide-react';
import { Suspense, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DocumentMetadata } from '@/lib/documents/types';
import { cn } from '@/lib/utils';

interface ThreeDViewerProps {
  document: DocumentMetadata;
}

interface MeasurementPoint {
  position: THREE.Vector3;
  id: string;
}

interface Measurement {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  distance: number;
}

interface ModelStats {
  vertices: number;
  faces: number;
  materials: number;
  meshes: number;
  boundingBox: { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3 };
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

// Clipping plane component
function ClippingPlane({
  axis,
  position,
  enabled,
  flip
}: {
  axis: 'x' | 'y' | 'z';
  position: number;
  enabled: boolean;
  flip: boolean;
}) {
  const { gl, scene } = useThree();

  useEffect(() => {
    if (!enabled) {
      gl.clippingPlanes = [];
      return;
    }

    const normal = new THREE.Vector3(
      axis === 'x' ? (flip ? -1 : 1) : 0,
      axis === 'y' ? (flip ? -1 : 1) : 0,
      axis === 'z' ? (flip ? -1 : 1) : 0
    );

    const plane = new THREE.Plane(normal, -position * (flip ? -1 : 1));
    gl.clippingPlanes = [plane];
    gl.localClippingEnabled = true;

    return () => {
      gl.clippingPlanes = [];
    };
  }, [gl, axis, position, enabled, flip]);

  return null;
}

// Measurement line component
function MeasurementLine({ start, end, distance }: { start: THREE.Vector3; end: THREE.Vector3; distance: number }) {
  const midpoint = useMemo(() =>
    new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5),
    [start, end]
  );

  return (
    <group>
      <Line
        points={[start, end]}
        color="#f59e0b"
        lineWidth={2}
        dashed={false}
      />
      {/* Start point */}
      <mesh position={start}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {/* End point */}
      <mesh position={end}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {/* Distance label */}
      <Html position={midpoint} center>
        <div className="bg-amber-500 text-black px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-lg">
          {distance.toFixed(3)} m
        </div>
      </Html>
    </group>
  );
}

// Measurement point marker
function MeasurementMarker({ position }: { position: THREE.Vector3 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial color="#22c55e" />
    </mesh>
  );
}

// Model component with stats collection
function Model({
  url,
  wireframe,
  onStatsReady,
  onMeshClick,
  measureMode
}: {
  url: string;
  wireframe: boolean;
  onStatsReady: (stats: ModelStats) => void;
  onMeshClick?: (point: THREE.Vector3) => void;
  measureMode: boolean;
}) {
  const { scene } = useGLTF(url);
  const { raycaster, camera, pointer } = useThree();
  const meshRefs = useRef<THREE.Mesh[]>([]);

  // Calculate stats on load
  useEffect(() => {
    let vertices = 0;
    let faces = 0;
    let materials = new Set<THREE.Material>();
    let meshCount = 0;
    const box = new THREE.Box3();

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        meshRefs.current.push(child);

        if (child.geometry) {
          const geo = child.geometry as THREE.BufferGeometry;
          vertices += geo.attributes.position?.count || 0;
          faces += geo.index ? geo.index.count / 3 : vertices / 3;
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => materials.add(m));
          } else {
            materials.add(child.material);
          }
        }

        box.expandByObject(child);
      }
    });

    const size = new THREE.Vector3();
    box.getSize(size);

    onStatsReady({
      vertices: Math.round(vertices),
      faces: Math.round(faces),
      materials: materials.size,
      meshes: meshCount,
      boundingBox: { min: box.min.clone(), max: box.max.clone(), size }
    });
  }, [scene, onStatsReady]);

  // Apply wireframe
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

  // Handle click for measurement
  const handleClick = useCallback((event: THREE.Event) => {
    if (!measureMode || !onMeshClick) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(scene, true);

    if (intersects.length > 0) {
      onMeshClick(intersects[0].point.clone());
    }
  }, [measureMode, onMeshClick, raycaster, pointer, camera, scene]);

  return (
    <Center>
      <primitive object={scene} onClick={handleClick} />
    </Center>
  );
}

// Loading placeholder
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

// Screenshot helper component
function ScreenshotHelper({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const capture = () => {
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/png');
      onCapture(dataUrl);
    };

    // Expose capture function
    (window as any).__capture3DScreenshot = capture;

    return () => {
      delete (window as any).__capture3DScreenshot;
    };
  }, [gl, scene, camera, onCapture]);

  return null;
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

  // Measurement state
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<MeasurementPoint[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Clipping plane state
  const [clipEnabled, setClipEnabled] = useState(false);
  const [clipAxis, setClipAxis] = useState<'x' | 'y' | 'z'>('x');
  const [clipPosition, setClipPosition] = useState(0);
  const [clipFlip, setClipFlip] = useState(false);

  // Model stats
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleScreenshot = useCallback(() => {
    const capture = (window as any).__capture3DScreenshot;
    if (capture) {
      capture();
    }
  }, []);

  const handleScreenshotCapture = useCallback((dataUrl: string) => {
    const link = window.document.createElement('a');
    link.download = `${document.name.replace(/\.[^/.]+$/, '')}_screenshot.png`;
    link.href = dataUrl;
    link.click();
  }, [document.name]);

  const handleMeasureClick = useCallback((point: THREE.Vector3) => {
    if (!measureMode) return;

    const newPoint: MeasurementPoint = {
      id: crypto.randomUUID(),
      position: point
    };

    setMeasurePoints(prev => {
      const updated = [...prev, newPoint];

      // If we have two points, create a measurement
      if (updated.length === 2) {
        const distance = updated[0].position.distanceTo(updated[1].position);
        const measurement: Measurement = {
          id: crypto.randomUUID(),
          start: updated[0].position,
          end: updated[1].position,
          distance
        };
        setMeasurements(m => [...m, measurement]);
        return []; // Reset points
      }

      return updated;
    });
  }, [measureMode]);

  const clearMeasurements = useCallback(() => {
    setMeasurements([]);
    setMeasurePoints([]);
  }, []);

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
      <div className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur border-b z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-500" />
            <span className="font-medium text-sm truncate max-w-[200px]">{document.name}</span>
          </div>
          {stats && (
            <Badge variant="secondary" className="text-xs">
              {stats.vertices.toLocaleString()} verts
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Measurement tool */}
          <Button
            variant={measureMode ? "default" : "outline"}
            size="sm"
            onClick={() => setMeasureMode(!measureMode)}
            className={cn(measureMode && "bg-amber-500 hover:bg-amber-600")}
          >
            <Ruler className="mr-1 h-4 w-4" />
            Measure
          </Button>

          {measurements.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMeasurements}>
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Clipping plane */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={clipEnabled ? "default" : "outline"} size="sm">
                <Scissors className="mr-1 h-4 w-4" />
                Section
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Clipping</Label>
                  <Switch checked={clipEnabled} onCheckedChange={setClipEnabled} />
                </div>

                {clipEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Axis</Label>
                      <div className="flex gap-1">
                        {(['x', 'y', 'z'] as const).map((axis) => (
                          <Button
                            key={axis}
                            size="sm"
                            variant={clipAxis === axis ? "default" : "outline"}
                            onClick={() => setClipAxis(axis)}
                            className="flex-1"
                          >
                            {axis.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Position: {clipPosition.toFixed(2)}</Label>
                      <Slider
                        value={[clipPosition]}
                        min={-5}
                        max={5}
                        step={0.1}
                        onValueChange={(v) => setClipPosition(v[0])}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Flip Direction</Label>
                      <Switch checked={clipFlip} onCheckedChange={setClipFlip} />
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Screenshot */}
          <Button variant="outline" size="sm" onClick={handleScreenshot}>
            <Camera className="mr-1 h-4 w-4" />
            Screenshot
          </Button>

          {/* View options */}
          <Button variant="outline" size="sm" onClick={resetCamera}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Wireframe toggle */}
          <Button
            variant={wireframe ? "default" : "outline"}
            size="sm"
            onClick={() => setWireframe(!wireframe)}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          {/* Grid toggle */}
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Layers className="h-4 w-4" />
          </Button>

          {/* Auto rotate */}
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <RotateCcw className={cn("h-4 w-4", autoRotate && "animate-spin")} />
          </Button>

          {/* Model info */}
          <Sheet open={showStats} onOpenChange={setShowStats}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Model Information</SheetTitle>
                <SheetDescription>Technical details about the 3D model</SheetDescription>
              </SheetHeader>
              {stats && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{stats.vertices.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Vertices</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{stats.faces.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Faces</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{stats.meshes}</div>
                      <div className="text-xs text-muted-foreground">Meshes</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{stats.materials}</div>
                      <div className="text-xs text-muted-foreground">Materials</div>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Bounding Box</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Width (X)</div>
                        <div className="font-mono">{stats.boundingBox.size.x.toFixed(3)}m</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Height (Y)</div>
                        <div className="font-mono">{stats.boundingBox.size.y.toFixed(3)}m</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Depth (Z)</div>
                        <div className="font-mono">{stats.boundingBox.size.z.toFixed(3)}m</div>
                      </div>
                    </div>
                  </div>

                  {measurements.length > 0 && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">Measurements</div>
                      <div className="space-y-1">
                        {measurements.map((m, i) => (
                          <div key={m.id} className="flex justify-between text-xs">
                            <span>Measurement {i + 1}</span>
                            <span className="font-mono">{m.distance.toFixed(4)}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Background color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4" />
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
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Measurement mode indicator */}
      {measureMode && (
        <div className="bg-amber-500 text-black text-xs font-medium text-center py-1">
          Click on the model to place measurement points ({measurePoints.length}/2)
        </div>
      )}

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
          onError={() => setError(true)}
          gl={{ preserveDrawingBuffer: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />

          <Suspense fallback={<LoadingPlaceholder />}>
            <Model
              url={document.url}
              wireframe={wireframe}
              onStatsReady={setStats}
              onMeshClick={handleMeasureClick}
              measureMode={measureMode}
            />
          </Suspense>

          {/* Clipping plane */}
          <ClippingPlane
            axis={clipAxis}
            position={clipPosition}
            enabled={clipEnabled}
            flip={clipFlip}
          />

          {/* Measurement markers */}
          {measurePoints.map((p) => (
            <MeasurementMarker key={p.id} position={p.position} />
          ))}

          {/* Measurement lines */}
          {measurements.map((m) => (
            <MeasurementLine
              key={m.id}
              start={m.start}
              end={m.end}
              distance={m.distance}
            />
          ))}

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

          <ScreenshotHelper onCapture={handleScreenshotCapture} />
        </Canvas>

        {/* Help overlay */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Controls:</p>
          <ul className="space-y-0.5">
            <li>Left-click + drag: Rotate</li>
            <li>Right-click + drag: Pan</li>
            <li>Scroll: Zoom</li>
            {measureMode && <li className="text-amber-500">Click model: Add point</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
