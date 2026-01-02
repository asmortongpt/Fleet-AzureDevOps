import { divIcon } from 'leaflet';
import { Camera, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';

import { useTrafficCameras } from '../../../hooks/useTrafficCameras';
import type { TrafficCamera } from '../../../types/traffic-cameras';

import logger from '@/utils/logger';
interface TrafficCameraLayerProps {
  /** Filter by county */
  county?: string;
  /** Filter by road */
  road?: string;
  /** Filter by direction */
  direction?: string;
  /** Map bounds for viewport filtering */
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Leaflet layer component that displays Florida traffic cameras
 * Shows all 411 Florida DOT camera feeds with live preview
 */
export function TrafficCameraLayer({
  county,
  road,
  direction,
  bounds,
}: TrafficCameraLayerProps) {
  const { cameras, isLoading, error } = useTrafficCameras({
    county,
    road,
    direction,
    bounds,
  });

  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);

  // Create custom camera icon
  const cameraIcon = divIcon({
    className: 'custom-camera-marker',
    html: `
      <div class="relative">
        <div class="bg-blue-600 text-white rounded-full p-2 shadow-lg border-2 border-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  if (isLoading) {
    return null; // Or show loading indicator
  }

  if (error) {
    logger.error('Error loading traffic cameras:', error);
    return null;
  }

  return (
    <>
      {cameras.map((camera) => (
        <Marker
          key={camera.id}
          position={[camera.latitude, camera.longitude]}
          icon={cameraIcon}
          eventHandlers={{
            click: () => setSelectedCamera(camera),
          }}
        >
          <Popup maxWidth={400} className="camera-popup">
            <CameraPopupContent camera={camera} />
          </Popup>
        </Marker>
      ))}

      {selectedCamera && (
        <CameraFeedModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </>
  );
}

/**
 * Camera popup content with preview
 */
function CameraPopupContent({ camera }: { camera: TrafficCamera }) {
  return (
    <div className="p-2 min-w-[300px]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {camera.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {camera.road} {camera.direction}
          </p>
        </div>
        <Camera className="w-5 h-5 text-blue-600" />
      </div>

      {camera.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          {camera.description}
        </p>
      )}

      {/* Camera feed preview */}
      {camera.thumbnailUrl && (
        <div className="mb-2 rounded overflow-hidden">
          <img
            src={camera.thumbnailUrl}
            alt={`${camera.name} camera view`}
            className="w-full h-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Preview%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
        <div>
          <span className="font-medium">County:</span> {camera.county}
        </div>
        <div>
          <span className="font-medium">Direction:</span> {camera.direction}
        </div>
        {camera.metadata?.mileMarker && (
          <div className="col-span-2">
            <span className="font-medium">Mile Marker:</span>{' '}
            {camera.metadata.mileMarker}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Updated: {new Date(camera.lastUpdated).toLocaleTimeString()}</span>
        <span
          className={`px-2 py-1 rounded ${
            camera.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : camera.status === 'maintenance'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {camera.status}
        </span>
      </div>
    </div>
  );
}

/**
 * Full-screen camera feed modal
 */
function CameraFeedModal({
  camera,
  onClose,
}: {
  camera: TrafficCamera;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {camera.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {camera.road} {camera.direction} - {camera.county} County
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Camera Feed */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
          <div className="aspect-video bg-black rounded overflow-hidden">
            {camera.feedUrl ? (
              <iframe
                src={camera.feedUrl}
                className="w-full h-full"
                title={`${camera.name} live feed`}
                allow="autoplay"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Live feed unavailable</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{camera.description}</p>
              {camera.metadata?.mileMarker && (
                <p className="mt-1">Mile Marker: {camera.metadata.mileMarker}</p>
              )}
            </div>
            {camera.feedUrl && (
              <a
                href={camera.feedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Open in New Tab
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
