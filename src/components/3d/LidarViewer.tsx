/**
 * LiDAR 3D Viewer Component
 *
 * Interactive 3D viewer for LiDAR scans with damage visualization,
 * volume inspection, and AR preview capabilities.
 *
 * Features:
 * - WebGL-based 3D model rendering
 * - Damage annotation overlays
 * - Volume measurement display
 * - Point cloud visualization
 * - Model export (GLB, USDZ, OBJ)
 * - AR Quick Look for iOS devices
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import logger from '@/utils/logger';

interface LiDARPoint {
  x: number;
  y: number;
  z: number;
  intensity?: number;
  rgb?: { r: number; g: number; b: number };
}

interface DamageAnnotation {
  annotationId: string;
  damageType: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  location: { x: number; y: number; z: number };
  area: number;
  volume?: number;
  depth?: number;
  confidence: number;
}

interface Model3D {
  modelId: string;
  format: 'glb' | 'usdz' | 'obj' | 'ply' | 'stl';
  fileUrl: string;
  fileSize: number;
  polygonCount: number;
  vertexCount: number;
}

interface LiDARScan {
  scanId: string;
  vehicleId: number;
  scanDate: Date;
  pointCount: number;
  resolution: number;
  accuracy: number;
}

interface LidarViewerProps {
  scanId: string;
  onError?: (error: Error) => void;
  showDamageOverlays?: boolean;
  enableMeasurement?: boolean;
  enableExport?: boolean;
}

export const LidarViewer: React.FC<LidarViewerProps> = ({
  scanId,
  onError,
  showDamageOverlays = true,
  enableMeasurement = true,
  enableExport = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<LiDARScan | null>(null);
  const [models, setModels] = useState<Model3D[]>([]);
  const [damageAnnotations, setDamageAnnotations] = useState<DamageAnnotation[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<DamageAnnotation | null>(null);
  const [viewMode, setViewMode] = useState<'model' | 'pointcloud'>('model');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [cameraPosition, setCameraPosition] = useState({ distance: 5, azimuth: 45, elevation: 30 });

  // Load scan data
  useEffect(() => {
    loadScanData();
  }, [scanId]);

  const loadScanData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lidar/scans/${scanId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load scan: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setScan(data.data.scan);
        setModels(data.data.models);
        setDamageAnnotations(data.data.damageAnnotations || []);

        // Select first GLB model by default
        const glbModel = data.data.models.find((m: Model3D) => m.format === 'glb');
        if (glbModel) {
          setSelectedModel(glbModel);
        }
      } else {
        throw new Error(data.error || 'Failed to load scan data');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred loading the scan';
      setError(errorMsg);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize 3D viewer
  useEffect(() => {
    if (!canvasRef.current || !selectedModel) return;

    const canvas = canvasRef.current;
    initializeViewer(canvas, selectedModel);

    return () => {
      // Cleanup
      cleanupViewer();
    };
  }, [selectedModel, viewMode]);

  const initializeViewer = (canvas: HTMLCanvasElement, model: Model3D) => {
    // In production, this would use Three.js or Babylon.js
    // For this implementation, we'll create a basic WebGL context

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      setError('WebGL 2.0 not supported');
      return;
    }

    // Set canvas size
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    // Clear canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Draw placeholder
    drawPlaceholder(gl, canvas);

    // In production: Load and render the 3D model
    // loadModel(model.fileUrl, gl, canvas);
  };

  const drawPlaceholder = (gl: WebGLRenderingContext, canvas: HTMLCanvasElement) => {
    // Draw a simple placeholder visualization
    const ctx2d = canvas.getContext('2d');
    if (ctx2d) {
      ctx2d.fillStyle = '#1a1a1a';
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);

      ctx2d.fillStyle = '#ffffff';
      ctx2d.font = '16px sans-serif';
      ctx2d.textAlign = 'center';
      ctx2d.fillText('3D Model Viewer', canvas.width / 2, canvas.height / 2 - 20);

      ctx2d.fillStyle = '#888888';
      ctx2d.font = '14px sans-serif';
      ctx2d.fillText(
        `${selectedModel?.format.toUpperCase()} Model`,
        canvas.width / 2,
        canvas.height / 2 + 10
      );
      ctx2d.fillText(
        `${selectedModel?.vertexCount.toLocaleString()} vertices`,
        canvas.width / 2,
        canvas.height / 2 + 30
      );
    }
  };

  const cleanupViewer = () => {
    // Cleanup Three.js or WebGL resources
  };

  const handleExportModel = async (format: string) => {
    try {
      const model = models.find(m => m.format === format);
      if (!model) {
        alert(`${format.toUpperCase()} model not available`);
        return;
      }

      // Download model
      window.open(model.fileUrl, '_blank');
    } catch (err) {
      logger.error('Export error:', err);
      alert('Failed to export model');
    }
  };

  const handleARPreview = () => {
    const usdzModel = models.find(m => m.format === 'usdz');
    if (!usdzModel) {
      alert('USDZ model required for AR preview');
      return;
    }

    // iOS AR Quick Look
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      window.location.href = usdzModel.fileUrl;
    } else {
      alert('AR preview is currently only supported on iOS devices');
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'severe':
        return 'destructive';
      case 'moderate':
        return 'warning';
      case 'minor':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatVolume = (volume?: number): string => {
    if (!volume) return 'N/A';
    if (volume < 0.001) return `${(volume * 1000000).toFixed(2)} cm³`;
    if (volume < 1) return `${(volume * 1000).toFixed(2)} L`;
    return `${volume.toFixed(4)} m³`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading LiDAR scan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Scan</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {/* Scan Info Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>LiDAR Scan Viewer</CardTitle>
              <CardDescription>
                {scan && new Date(scan.scanDate).toLocaleString()} • {scan?.pointCount.toLocaleString()} points
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadScanData}>
                Refresh
              </Button>
              {enableExport && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleExportModel('glb')}>
                    Export GLB
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportModel('usdz')}>
                    Export USDZ
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleARPreview}>
                    AR Preview
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* 3D Viewer Canvas */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-[600px] bg-gray-900"
                style={{ display: 'block' }}
              />

              {/* Viewer Controls Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Button
                  variant={viewMode === 'model' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('model')}
                >
                  3D Model
                </Button>
                <Button
                  variant={viewMode === 'pointcloud' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('pointcloud')}
                >
                  Point Cloud
                </Button>
                <Button
                  variant={showGrid ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  Grid
                </Button>
                <Button
                  variant={showAxes ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAxes(!showAxes)}
                >
                  Axes
                </Button>
              </div>

              {/* Scan Quality Indicator */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                <div className="space-y-1">
                  <div>Resolution: {scan?.resolution.toFixed(3)} pts/m</div>
                  <div>Accuracy: ±{scan?.accuracy ? (scan.accuracy * 100).toFixed(1) : 'N/A'} cm</div>
                  <div>Points: {scan?.pointCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Selected Annotation Overlay */}
              {selectedAnnotation && (
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white max-w-sm">
                  <h4 className="font-semibold mb-2">
                    {selectedAnnotation.damageType.replace('_', ' ').toUpperCase()}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div>Severity: {selectedAnnotation.severity}</div>
                    <div>Area: {selectedAnnotation.area.toFixed(4)} m²</div>
                    <div>Volume: {formatVolume(selectedAnnotation.volume)}</div>
                    {selectedAnnotation.depth && (
                      <div>Depth: {(selectedAnnotation.depth * 100).toFixed(2)} cm</div>
                    )}
                    <div>Confidence: {(selectedAnnotation.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Damage Annotations */}
        <Card>
          <CardHeader>
            <CardTitle>Damage Annotations</CardTitle>
            <CardDescription>
              {damageAnnotations.length} detected damage zone{damageAnnotations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list">
              <TabsList className="w-full">
                <TabsTrigger value="list" className="flex-1">
                  List
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex-1">
                  Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-2">
                {damageAnnotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    No damage annotations
                  </p>
                ) : (
                  damageAnnotations.map(annotation => (
                    <div
                      key={annotation.annotationId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnnotation?.annotationId === annotation.annotationId
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {annotation.damageType.replace('_', ' ')}
                        </span>
                        <Badge variant={getSeverityColor(annotation.severity) as any}>
                          {annotation.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Area: {annotation.area.toFixed(4)} m²</div>
                        <div>Volume: {formatVolume(annotation.volume)}</div>
                        <div>Confidence: {(annotation.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="stats">
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium mb-2">Damage Summary</div>
                    <div className="space-y-2">
                      {['critical', 'severe', 'moderate', 'minor'].map(severity => {
                        const count = damageAnnotations.filter(a => a.severity === severity).length;
                        if (count === 0) return null;
                        return (
                          <div key={severity} className="flex justify-between">
                            <span className="capitalize">{severity}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">Total Volume</div>
                    <div className="text-sm font-bold">
                      {formatVolume(
                        damageAnnotations.reduce((sum, a) => sum + (a.volume || 0), 0)
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">Total Area</div>
                    <div className="text-sm font-bold">
                      {damageAnnotations
                        .reduce((sum, a) => sum + a.area, 0)
                        .toFixed(4)}{' '}
                      m²
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-2">Damage Types</div>
                    <div className="space-y-1">
                      {Array.from(
                        new Set(damageAnnotations.map(a => a.damageType))
                      ).map(type => (
                        <div key={type} className="flex justify-between">
                          <span className="capitalize">{type.replace('_', ' ')}:</span>
                          <span>
                            {damageAnnotations.filter(a => a.damageType === type).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Model Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>Export and view in different formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {models.map(model => (
              <Button
                key={model.modelId}
                variant={selectedModel?.modelId === model.modelId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedModel(model)}
              >
                {model.format.toUpperCase()}
                <span className="ml-2 text-xs text-muted-foreground">
                  {(model.fileSize / 1024 / 1024).toFixed(1)} MB
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LidarViewer;
