/**
 * Vehicle 3D Model Viewer Component
 *
 * Interactive 3D viewer for fleet vehicles with customization controls
 * Supports model rotation, paint color changes, and damage visualization
 */

import { OrbitControls, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import axios from 'axios';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// ============================================================================
// Types
// ============================================================================

interface Vehicle3DModel {
  id: number;
  vehicleId: number;
  status: string;
  paintColor: string;
  paintHex?: string;
  trim: string;
  wheels: string;
  features: Record<string, boolean>;
  models: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
  };
  textures: {
    baseColor?: string;
    metallic?: string;
    roughness?: string;
    normal?: string;
  };
  thumbnail?: string;
  version: number;
  createdAt: string;
  creditsUsed: number;
}

interface PaintColor {
  name: string;
  hex: string;
  category: string;
  upcharge: number;
}

interface DamageRecord {
  id: number;
  type: string;
  location: string;
  severity: string;
  description: string;
  photos: string[];
  occurredAt: string;
  estimatedCost: number;
  damageModelUrl?: string;
}

// ============================================================================
// 3D Model Component
// ============================================================================

function Model({ url, textures, onLoaded }: {
  url: string;
  textures?: {
    baseColor?: string;
    metallic?: string;
    roughness?: string;
    normal?: string;
  };
  onLoaded?: () => void;
}) {
  const gltf = useLoader(GLTFLoader, url);
  const meshRef = useRef<THREE.Group>();

  useEffect(() => {
    if (gltf && onLoaded) {
      onLoaded();
    }
  }, [gltf, onLoaded]);

  // Apply PBR textures if available
  useEffect(() => {
    if (!textures || !gltf) return;

    const textureLoader = new THREE.TextureLoader();

    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (textures.baseColor) {
          material.map = textureLoader.load(textures.baseColor);
        }
        if (textures.metallic) {
          material.metalnessMap = textureLoader.load(textures.metallic);
        }
        if (textures.roughness) {
          material.roughnessMap = textureLoader.load(textures.roughness);
        }
        if (textures.normal) {
          material.normalMap = textureLoader.load(textures.normal);
        }

        material.needsUpdate = true;
      }
    });
  }, [textures, gltf]);

  // Auto-rotate
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      <primitive object={gltf.scene} scale={1.5} />
    </group>
  );
}

// ============================================================================
// Loading Placeholder
// ============================================================================

function LoadingPlaceholder() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-white bg-opacity-90 p-8 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Loading 3D Model...</p>
      </div>
    </Html>
  );
}

// ============================================================================
// Main Viewer Component
// ============================================================================

export default function Vehicle3DViewer({ vehicleId }: { vehicleId: number }) {
  const [model, setModel] = useState<Vehicle3DModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [customColorHex, setCustomColorHex] = useState<string>('#000000');
  const [customColorDescription, setCustomColorDescription] = useState<string>('');

  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([]);
  const [selectedDamage, setSelectedDamage] = useState<number | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  const [viewMode, setViewMode] = useState<'current' | 'damaged'>('current');

  // ------------------------------------------------------------------------
  // Load vehicle model and available colors
  // ------------------------------------------------------------------------

  useEffect(() => {
    loadVehicleModel();
    loadPaintColors();
    loadDamageRecords();
  }, [vehicleId]);

  const loadVehicleModel = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/3d-models/vehicle/${vehicleId}`);

      if (response.data.success) {
        setModel(response.data.data);
        setSelectedColor(response.data.data.paintColor);
      } else {
        setError('No 3D model found for this vehicle');
      }
    } catch (err) {
      console.error('Error loading model:', err);
      setError('Failed to load vehicle model');
    } finally {
      setLoading(false);
    }
  };

  const loadPaintColors = async () => {
    try {
      const response = await axios.get('/api/3d-models/paint-colors');
      if (response.data.success) {
        setPaintColors(response.data.data);
      }
    } catch (err) {
      console.error('Error loading paint colors:', err);
    }
  };

  const loadDamageRecords = async () => {
    try {
      const response = await axios.get(`/api/3d-models/damage/${vehicleId}`);
      if (response.data.success) {
        setDamageRecords(response.data.data);
      }
    } catch (err) {
      console.error('Error loading damage records:', err);
    }
  };

  // ------------------------------------------------------------------------
  // Change paint color
  // ------------------------------------------------------------------------

  const handleColorChange = async (colorName: string) => {
    if (!model) return;

    try {
      setIsGenerating(true);
      setGenerationProgress('Generating new paint color...');

      const response = await axios.post('/api/3d-models/change-color', {
        vehicleId,
        paintColor: colorName,
        paintHex: colorName === 'Customize' ? customColorHex : undefined,
        customDescription: colorName === 'Customize' ? customColorDescription : undefined,
      });

      if (response.data.success) {
        // Poll for completion
        const meshyTaskId = response.data.data.meshyTaskId;
        await pollTaskStatus(meshyTaskId);

        // Reload model
        await loadVehicleModel();
        setModelLoaded(false);
      }
    } catch (err) {
      console.error('Error changing color:', err);
      alert('Failed to change paint color');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // ------------------------------------------------------------------------
  // Poll task status
  // ------------------------------------------------------------------------

  const pollTaskStatus = async (meshyTaskId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/3d-models/status/${meshyTaskId}`);

          if (response.data.success) {
            const { status, progress } = response.data.data;

            setGenerationProgress(`${status} - ${progress}%`);

            if (status === 'SUCCEEDED') {
              clearInterval(pollInterval);
              resolve();
            } else if (status === 'FAILED') {
              clearInterval(pollInterval);
              reject(new Error('Model generation failed'));
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 5000); // Poll every 5 seconds

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Model generation timeout'));
      }, 600000);
    });
  };

  // ------------------------------------------------------------------------
  // View damage model
  // ------------------------------------------------------------------------

  const viewDamageModel = (damageId: number) => {
    setSelectedDamage(damageId);
    setViewMode('damaged');
    setModelLoaded(false);
  };

  // ------------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg">
          <p className="text-xl font-semibold">{error}</p>
          <button
            onClick={loadVehicleModel}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!model) return null;

  const currentModelUrl = viewMode === 'current'
    ? model.models.glb
    : damageRecords.find(d => d.id === selectedDamage)?.damageModelUrl;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 2, 5]} />

          <Suspense fallback={<LoadingPlaceholder />}>
            {currentModelUrl && (
              <Model
                url={currentModelUrl}
                textures={model.textures}
                onLoaded={() => setModelLoaded(true)}
              />
            )}
          </Suspense>

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
          />

          <Environment preset="sunset" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <directionalLight position={[-10, 10, -5]} intensity={0.5} />
        </Canvas>

        {/* Status overlay */}
        {!modelLoaded && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-semibold text-gray-700">Loading model...</p>
          </div>
        )}

        {isGenerating && (
          <div className="absolute top-4 left-4 bg-blue-600 bg-opacity-90 px-6 py-3 rounded-lg shadow-lg">
            <p className="text-sm font-semibold text-white">{generationProgress}</p>
          </div>
        )}

        {/* Model info overlay */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-6 py-4 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-700">
            {model.trim} | {model.paintColor} | {model.wheels}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Version {model.version} | {model.creditsUsed} credits
          </p>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Vehicle Customization
          </h2>

          {/* View Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setViewMode('current');
                setModelLoaded(false);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                viewMode === 'current'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Current Model
            </button>
            <button
              onClick={() => setViewMode('damaged')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                viewMode === 'damaged'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Damage View
            </button>
          </div>

          {/* Paint Colors */}
          {viewMode === 'current' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Paint Color
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {paintColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColor(color.name);
                      handleColorChange(color.name);
                    }}
                    disabled={isGenerating}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedColor === color.name
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">
                          {color.name}
                        </p>
                        <p className="text-xs text-gray-500">{color.category}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Color */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Custom Color
                </h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <textarea
                  value={customColorDescription}
                  onChange={(e) => setCustomColorDescription(e.target.value)}
                  placeholder="Describe custom paint (e.g., matte military green)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <button
                  onClick={() => handleColorChange('Customize')}
                  disabled={isGenerating || !customColorDescription}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Custom Color
                </button>
              </div>
            </div>
          )}

          {/* Damage Records */}
          {viewMode === 'damaged' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Damage Records ({damageRecords.length})
              </h3>

              {damageRecords.length === 0 ? (
                <p className="text-gray-500 text-sm">No damage records found</p>
              ) : (
                <div className="space-y-3">
                  {damageRecords.map((damage) => (
                    <button
                      key={damage.id}
                      onClick={() => viewDamageModel(damage.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedDamage === damage.id
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-800">
                          {damage.type} - {damage.location}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            damage.severity === 'severe'
                              ? 'bg-red-100 text-red-800'
                              : damage.severity === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {damage.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {damage.description}
                      </p>
                      {damage.estimatedCost && (
                        <p className="text-sm font-semibold text-gray-700">
                          Est. Cost: ${damage.estimatedCost.toLocaleString()}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
