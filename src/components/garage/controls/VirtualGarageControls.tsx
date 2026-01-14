import { Camera, Settings, Maximize2, RotateCw } from 'lucide-react';
import React, { useState } from 'react';

interface VirtualGarageControlsProps {
  onCameraChange: (preset: string) => void;
  onQualityChange: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  onToggleShowcase: () => void;
  currentCamera?: string;
  currentQuality?: string;
}

export function VirtualGarageControls({
  onCameraChange,
  onQualityChange,
  onToggleShowcase,
  currentCamera = 'hero',
  currentQuality = 'high'
}: VirtualGarageControlsProps) {
  const [expanded, setExpanded] = useState(true);
  
  const cameraPresets = [
    { id: 'hero', label: 'Hero Shot', icon: '🎬' },
    { id: 'frontQuarter', label: 'Front Quarter', icon: '📐' },
    { id: 'rearQuarter', label: 'Rear Quarter', icon: '📐' },
    { id: 'profile', label: 'Side Profile', icon: '➡️' },
    { id: 'topDown', label: 'Top Down', icon: '⬇️' },
    { id: 'interior', label: 'Interior', icon: '🪑' },
    { id: 'engineBay', label: 'Engine Bay', icon: '⚙️' },
    { id: 'wheelDetail', label: 'Wheel Detail', icon: '⭕' },
  ];
  
  const qualityLevels = [
    { id: 'low', label: 'Low', description: 'Mobile-optimized' },
    { id: 'medium', label: 'Medium', description: 'Balanced' },
    { id: 'high', label: 'High', description: 'Desktop quality' },
    { id: 'ultra', label: 'Ultra', description: 'Maximum fidelity' },
  ];
  
  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div 
          className="bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 text-white">
            <Camera size={20} />
            <span className="font-semibold">Virtual Garage Controls</span>
          </div>
          <button className="text-white hover:bg-white/20 rounded p-1">
            {expanded ? '−' : '+'}
          </button>
        </div>
        
        {expanded && (
          <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
            {/* Camera Presets */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Camera size={16} />
                Camera Angles
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {cameraPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => onCameraChange(preset.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      currentCamera === preset.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="text-sm mb-1">{preset.icon}</div>
                    <div className="text-xs font-medium">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quality Settings */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Settings size={16} />
                Rendering Quality
              </h3>
              <div className="space-y-2">
                {qualityLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => onQualityChange(level.id as any)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all ${
                      currentQuality === level.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{level.label}</div>
                    <div className="text-xs opacity-75">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Showcase Mode */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <RotateCw size={16} />
                Presentation
              </h3>
              <button
                onClick={onToggleShowcase}
                className="w-full px-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <Maximize2 size={18} />
                  360° Showcase Mode
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
