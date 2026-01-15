/**
 * Example Usage - Complete Implementation Guide
 * 
 * This file demonstrates how to integrate all components
 */

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';

// Phase 1: Photo System
import { MobileCameraCapture } from '@/components/garage/MobileCameraCapture';
import { PhotoGallery } from '@/components/garage/PhotoGallery';
import { photoUploadService } from '@/services/PhotoUploadService';

// Phase 2: Condition Monitoring
import { VehicleConditionPanel } from '@/components/garage/VehicleConditionPanel';
import type { VehicleCondition, ServiceRecord } from '@/types/vehicle-condition.types';

// Phase 3: Performance
import { LODVehicleModel } from '@/utils/lod-system';

// Phase 4: Rendering
import { VehicleMaterialFactory, QUALITY_PRESETS } from '@/utils/pbr-materials';

// Phase 5: AI
import {
  initializeDamageDetection,
  getDamageDetectionService,
} from '@/services/AIDamageDetectionService';

// ============================================================================
// COMPLETE GARAGE SYSTEM
// ============================================================================

export function CompleteGarageSystem() {
  const [activeView, setActiveView] = useState<'3d' | 'photos' | 'condition'>('3d');
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [damageReport, setDamageReport] = useState(null);

  // Initialize AI service
  useEffect(() => {
    initializeDamageDetection({
      endpoint: import.meta.env.VITE_AI_API_ENDPOINT,
      apiKey: import.meta.env.VITE_AI_API_KEY,
      modelVersion: 'v1.0',
      confidenceThreshold: 0.7,
    });
  }, []);

  // Handle photo capture
  const handlePhotosCapture = async (capturedPhotos) => {
    try {
      // Upload photos
      await photoUploadService.uploadPhotos({
        assetId: 'vehicle-123',
        photos: capturedPhotos,
        onProgress: (progress) => {
          console.log('Upload progress:', progress);
        },
      });

      // Run AI analysis
      const aiService = getDamageDetectionService();
      const analysisResults = await aiService.analyzeBatch(capturedPhotos);

      // Generate report
      const report = aiService.generateReport(analysisResults, {
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        vin: '1FTFW1E84NFA12345',
      });

      setDamageReport(report);
      setPhotos([...photos, ...capturedPhotos]);
      setShowCamera(false);
      setActiveView('photos');
    } catch (error) {
      console.error('Photo capture failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Vehicle Garage System
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('3d')}
              className={`px-4 py-2 rounded-lg transition-colors $\{
                activeView === '3d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3D View
            </button>
            <button
              onClick={() => setActiveView('photos')}
              className={`px-4 py-2 rounded-lg transition-colors $\{
                activeView === 'photos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveView('condition')}
              className={`px-4 py-2 rounded-lg transition-colors $\{
                activeView === 'condition'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Condition
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeView === '3d' && (
          <div className="h-[600px] rounded-xl overflow-hidden bg-slate-900">
            <Canvas>
              <PerspectiveCamera makeDefault position={[5, 2, 5]} />
              <OrbitControls />

              {/* Lighting */}
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

              {/* Environment */}
              <Environment preset="sunset" />

              {/* Vehicle Model with LOD */}
              <LODVehicleModel
                position={[0, 0, 0]}
                lodConfig={{
                  distances: [10, 20, 50],
                  modelUrls: [
                    '/models/vehicle-high.glb',
                    '/models/vehicle-medium.glb',
                    '/models/vehicle-low.glb',
                  ],
                  autoSwitch: true,
                  hysteresis: 100,
                }}
              />

              {/* Ground */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#2a2a2a" />
              </mesh>
            </Canvas>

            {/* FAB for camera */}
            <button
              onClick={() => setShowCamera(true)}
              className="absolute bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        {activeView === 'photos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Vehicle Photos
              </h2>
              <button
                onClick={() => setShowCamera(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Capture Photos
              </button>
            </div>

            {damageReport && (
              <div className="bg-slate-900 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  AI Damage Analysis
                </h3>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-400">
                      {damageReport.summary.bySeverity.critical}
                    </p>
                    <p className="text-slate-400 text-sm">Critical</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-400">
                      {damageReport.summary.bySeverity.severe}
                    </p>
                    <p className="text-slate-400 text-sm">Severe</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-400">
                      {damageReport.summary.bySeverity.moderate}
                    </p>
                    <p className="text-slate-400 text-sm">Moderate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400">
                      {damageReport.summary.bySeverity.minor}
                    </p>
                    <p className="text-slate-400 text-sm">Minor</p>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-300 mb-2">Estimated Cost:</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${damageReport.summary.estimatedCost.min.toLocaleString()} - 
                    ${damageReport.summary.estimatedCost.max.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <PhotoGallery
              photos={photos}
              onDeletePhoto={(photoId) => {
                setPhotos(photos.filter(p => p.id !== photoId));
              }}
              groupByZone={true}
            />
          </div>
        )}

        {activeView === 'condition' && (
          <VehicleConditionPanel
            condition={mockVehicleCondition}
            serviceHistory={mockServiceHistory}
            onScheduleService={(type) => {
              console.log('Schedule service:', type);
            }}
          />
        )}
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <MobileCameraCapture
          assetId="vehicle-123"
          onPhotosCapture={handlePhotosCapture}
          onClose={() => setShowCamera(false)}
          guidedMode={true}
          maxPhotos={50}
          compressionQuality={0.85}
          maxDimension={1920}
        />
      )}
    </div>
  );
}

// Mock data for demonstration
const mockVehicleCondition: VehicleCondition = {
  assetId: 'vehicle-123',
  lastUpdated: new Date(),
  mileage: {
    current: 45230,
    unit: 'miles',
    lastRecorded: new Date(),
  },
  engine: {
    oilLife: 65,
    lastOilChange: new Date('2025-11-15'),
    nextOilChangeDue: 48000,
    oilType: '5W-30 Synthetic',
    coolantLevel: 'normal',
    coolantLastChecked: new Date('2025-12-01'),
  },
  transmission: {
    fluidLevel: 'normal',
    lastService: new Date('2025-06-20'),
    condition: 'good',
  },
  brakes: {
    frontPadLife: 70,
    rearPadLife: 65,
    fluidLevel: 'normal',
    lastInspection: new Date('2025-11-01'),
  },
  tires: {
    frontLeft: {
      treadDepth: 7.5,
      pressure: 35,
      recommendedPressure: 35,
      condition: 'good',
    },
    frontRight: {
      treadDepth: 7.2,
      pressure: 34,
      recommendedPressure: 35,
      condition: 'good',
    },
    rearLeft: {
      treadDepth: 6.8,
      pressure: 35,
      recommendedPressure: 35,
      condition: 'fair',
    },
    rearRight: {
      treadDepth: 7.0,
      pressure: 36,
      recommendedPressure: 35,
      condition: 'good',
    },
    lastRotation: new Date('2025-10-15'),
  },
  battery: {
    health: 85,
    voltage: 12.6,
    lastTested: new Date('2025-12-01'),
  },
  fluids: {
    powerSteering: 'normal',
    washerFluid: 'normal',
  },
  filters: {
    airFilter: 'clean',
    cabinFilter: 'clean',
    lastReplaced: new Date('2025-11-15'),
  },
  diagnostics: {
    checkEngineLightOn: false,
    diagnosticCodes: [],
    lastScan: new Date('2025-12-01'),
  },
  nextScheduledService: {
    type: 'oil_change',
    dueDate: new Date('2026-03-15'),
    dueMileage: 48000,
    description: 'Regular oil change and filter replacement',
  },
};

const mockServiceHistory: ServiceRecord[] = [
  {
    id: 'service-1',
    assetId: 'vehicle-123',
    date: new Date('2025-11-15'),
    mileage: 45000,
    serviceType: 'oil_change',
    description: 'Synthetic oil change and filter replacement',
    performedBy: 'City Garage',
    location: 'Main Facility',
    cost: 85,
    parts: [
      { name: 'Oil Filter', quantity: 1, cost: 12 },
      { name: '5W-30 Synthetic Oil (5qt)', quantity: 1, cost: 35 },
    ],
    labor: { hours: 0.5, rate: 75 },
  },
  // Add more service records...
];

export default CompleteGarageSystem;
