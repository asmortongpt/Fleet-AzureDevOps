/**
 * Map Component with Telemetry - Complete Example
 *
 * This example demonstrates how to integrate telemetry into a map component,
 * tracking all interactions, performance metrics, and errors.
 *
 * @example
 * ```tsx
 * import MapWithTelemetry from './examples/MapWithTelemetry.example';
 *
 * function App() {
 *   return <MapWithTelemetry provider="mapbox" />;
 * }
 * ```
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMapTelemetry, MapInteractionType } from '../hooks/useTelemetry';
import { captureException, addBreadcrumb, ErrorSeverity } from '../services/errorReporting';
import { withErrorBoundary } from '../services/errorReporting';

interface Marker {
  id: string;
  position: [number, number];
  type: 'vehicle' | 'depot' | 'customer';
  label: string;
  metadata?: Record<string, any>;
}

interface MapWithTelemetryProps {
  provider: 'mapbox' | 'google' | 'arcgis';
  initialCenter?: [number, number];
  initialZoom?: number;
  markers?: Marker[];
  onMarkerClick?: (marker: Marker) => void;
}

/**
 * Map component with comprehensive telemetry integration
 */
const MapWithTelemetry: React.FC<MapWithTelemetryProps> = ({
  provider,
  initialCenter = [-84.28, 30.44],
  initialZoom = 12,
  markers = [],
  onMarkerClick,
}) => {
  // State
  const [zoom, setZoom] = useState(initialZoom);
  const [center, setCenter] = useState(initialCenter);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['vehicles']));

  // Refs
  const mapRef = useRef<any>(null);
  const loadStartTime = useRef<number>(Date.now());

  // Telemetry hook
  const telemetry = useMapTelemetry(provider);

  /**
   * Track map load
   */
  useEffect(() => {
    if (isLoaded) return;

    // Add breadcrumb
    addBreadcrumb({
      category: 'map',
      message: 'Map initialization started',
      level: ErrorSeverity.INFO,
      timestamp: Date.now(),
      data: {
        provider,
        markerCount: markers.length,
      },
    });

    // Simulate map loading
    const loadMap = async () => {
      try {
        const timing = telemetry.startTiming('map_initialization');

        // Simulate async map loading
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Map loaded successfully
        const loadTime = Date.now() - loadStartTime.current;

        telemetry.trackMapLoaded(provider, loadTime, {
          provider,
          zoom,
          center,
          markerCount: markers.length,
          layerCount: visibleLayers.size,
        });

        telemetry.endTiming(timing);

        setIsLoaded(true);

        // Add success breadcrumb
        addBreadcrumb({
          category: 'map',
          message: 'Map loaded successfully',
          level: ErrorSeverity.INFO,
          timestamp: Date.now(),
          data: {
            loadTime,
            provider,
          },
        });
      } catch (error) {
        // Track error
        telemetry.trackMapError(error as Error, {
          provider,
          stage: 'initialization',
        });

        captureException(error as Error, {
          component: 'MapWithTelemetry',
          action: 'loadMap',
          tags: {
            provider,
            stage: 'initialization',
          },
        });
      }
    };

    loadMap();
  }, [isLoaded, provider, markers.length, zoom, center, visibleLayers.size, telemetry]);

  /**
   * Handle zoom change
   */
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const oldZoom = zoom;

      // Track zoom interaction
      telemetry.trackZoom(newZoom, oldZoom);

      // Add breadcrumb
      addBreadcrumb({
        category: 'map',
        message: 'User changed zoom level',
        level: ErrorSeverity.DEBUG,
        timestamp: Date.now(),
        data: {
          oldZoom,
          newZoom,
          delta: newZoom - oldZoom,
        },
      });

      setZoom(newZoom);
    },
    [zoom, telemetry]
  );

  /**
   * Handle pan/move
   */
  const handlePan = useCallback(
    (newCenter: [number, number]) => {
      const oldCenter = center;

      // Track pan interaction
      telemetry.trackPan(newCenter, oldCenter);

      // Calculate distance moved (simplified)
      const distance = Math.sqrt(
        Math.pow(newCenter[0] - oldCenter[0], 2) + Math.pow(newCenter[1] - oldCenter[1], 2)
      );

      // Only log breadcrumb if significant movement
      if (distance > 0.01) {
        addBreadcrumb({
          category: 'map',
          message: 'User panned map',
          level: ErrorSeverity.DEBUG,
          timestamp: Date.now(),
          data: {
            distance,
          },
        });
      }

      setCenter(newCenter);
    },
    [center, telemetry]
  );

  /**
   * Handle marker click
   */
  const handleMarkerClickInternal = useCallback(
    (marker: Marker) => {
      // Track marker interaction
      telemetry.trackMarkerClick(marker.id, marker.type, {
        label: marker.label,
        hasMetadata: !!marker.metadata,
      });

      // Add breadcrumb
      addBreadcrumb({
        category: 'user',
        message: 'User clicked marker',
        level: ErrorSeverity.INFO,
        timestamp: Date.now(),
        data: {
          markerId: marker.id,
          markerType: marker.type,
        },
      });

      setSelectedMarker(marker);
      onMarkerClick?.(marker);
    },
    [telemetry, onMarkerClick]
  );

  /**
   * Handle layer toggle
   */
  const handleLayerToggle = useCallback(
    (layerId: string) => {
      const newVisibleLayers = new Set(visibleLayers);
      const wasVisible = visibleLayers.has(layerId);

      if (wasVisible) {
        newVisibleLayers.delete(layerId);
      } else {
        newVisibleLayers.add(layerId);
      }

      // Track layer toggle
      telemetry.trackMapInteraction(MapInteractionType.LAYER_TOGGLE, {
        layerId,
        visible: !wasVisible,
        totalLayers: newVisibleLayers.size,
      });

      // Add breadcrumb
      addBreadcrumb({
        category: 'map',
        message: `User toggled layer: ${layerId}`,
        level: ErrorSeverity.INFO,
        timestamp: Date.now(),
        data: {
          layerId,
          visible: !wasVisible,
        },
      });

      setVisibleLayers(newVisibleLayers);
    },
    [visibleLayers, telemetry]
  );

  /**
   * Handle search
   */
  const handleSearch = useCallback(
    async (query: string) => {
      const searchStart = Date.now();

      try {
        // Add breadcrumb
        addBreadcrumb({
          category: 'search',
          message: 'User performed search',
          level: ErrorSeverity.INFO,
          timestamp: Date.now(),
          data: {
            queryLength: query.length,
          },
        });

        // Simulate search
        const results = markers.filter((m) =>
          m.label.toLowerCase().includes(query.toLowerCase())
        );

        const searchDuration = Date.now() - searchStart;

        // Track search
        telemetry.trackSearch(query, results.length, searchDuration);

        return results;
      } catch (error) {
        captureException(error as Error, {
          component: 'MapWithTelemetry',
          action: 'search',
          extra: {
            queryLength: query.length,
          },
        });
        return [];
      }
    },
    [markers, telemetry]
  );

  /**
   * Handle filter
   */
  const handleFilter = useCallback(
    (filterType: string, filterValue: any) => {
      const filteredMarkers = markers.filter((m) => {
        if (filterType === 'type') {
          return m.type === filterValue;
        }
        return true;
      });

      // Track filter
      telemetry.trackFilter(filterType, filterValue, filteredMarkers.length);

      // Add breadcrumb
      addBreadcrumb({
        category: 'filter',
        message: `Applied filter: ${filterType}`,
        level: ErrorSeverity.INFO,
        timestamp: Date.now(),
        data: {
          filterType,
          resultsCount: filteredMarkers.length,
        },
      });

      return filteredMarkers;
    },
    [markers, telemetry]
  );

  /**
   * Handle export
   */
  const handleExport = useCallback(
    (format: 'json' | 'geojson' | 'csv') => {
      try {
        const timing = telemetry.startTiming('export_data');

        // Simulate export
        const data = JSON.stringify(markers);

        telemetry.trackExport(format, markers.length);
        telemetry.endTiming(timing);

        // Add breadcrumb
        addBreadcrumb({
          category: 'export',
          message: `Exported data as ${format}`,
          level: ErrorSeverity.INFO,
          timestamp: Date.now(),
          data: {
            format,
            itemCount: markers.length,
          },
        });

        // Download (simplified)
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        captureException(error as Error, {
          component: 'MapWithTelemetry',
          action: 'export',
          extra: {
            format,
            itemCount: markers.length,
          },
        });
      }
    },
    [markers, telemetry]
  );

  /**
   * Performance monitoring example
   */
  useEffect(() => {
    // Track render performance
    const renderTime = performance.now();

    telemetry.trackMetric('component_render_time', renderTime, 'ms');
  }, [telemetry]);

  if (!isLoaded) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Loading map...</p>
        <p style={{ fontSize: 12, color: '#666' }}>
          Provider: {provider} | Markers: {markers.length}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map container (simplified) */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',
          position: 'relative',
        }}
      >
        {/* Map visualization would go here */}
        <div style={{ padding: 20 }}>
          <h3>Map Loaded: {provider}</h3>
          <p>Zoom: {zoom}</p>
          <p>Center: {center.join(', ')}</p>
          <p>Markers: {markers.length}</p>
          <p>Layers: {visibleLayers.size}</p>
          {telemetry.isEnabled && <p>Telemetry: Enabled (Session: {telemetry.sessionId})</p>}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          backgroundColor: 'white',
          padding: 10,
          borderRadius: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <button onClick={() => handleZoomChange(zoom + 1)}>Zoom In</button>
        <button onClick={() => handleZoomChange(zoom - 1)}>Zoom Out</button>
        <button onClick={() => handleLayerToggle('vehicles')}>Toggle Vehicles</button>
        <button onClick={() => handleExport('json')}>Export</button>
      </div>

      {/* Selected marker info */}
      {selectedMarker && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h4>Selected: {selectedMarker.label}</h4>
          <p>Type: {selectedMarker.type}</p>
          <p>Position: {selectedMarker.position.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Export with error boundary
 */
export default withErrorBoundary(MapWithTelemetry, {
  fallback: ({ error, resetError }) => (
    <div style={{ padding: 20, color: 'red' }}>
      <h2>Map Failed to Load</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Reload Map</button>
    </div>
  ),
  onError: (error, errorInfo) => {
    console.error('Map error:', error, errorInfo);
  },
});
