/**
 * Map Components Performance Benchmark Suite
 *
 * Comprehensive benchmarks for map component performance including:
 * - Map initialization
 * - Marker rendering at various scales
 * - Map provider switching
 * - Tile loading
 * - Clustering performance
 * - Filter operations
 * - Search operations
 *
 * Run with: npm run bench
 */

import { bench, describe } from 'vitest';
import {
  generateVehicles,
  generateFacilities,
  generateCameras,
  BENCHMARK_DATASETS,
  generateClusteredDataset,
} from './utils/test-data-generator';
import {
  measureTime,
  measureMemory,
  runBenchmark,
  formatBytes,
  formatDuration,
} from './utils/performance-metrics';

// ============================================================================
// Configuration
// ============================================================================

const MARKER_COUNTS = [10, 100, 1000, 10000];
const CLUSTER_SIZES = [100, 1000, 10000];
const SEARCH_DATASET_SIZE = 10000;

// ============================================================================
// Map Initialization Benchmarks
// ============================================================================

describe('Map Initialization', () => {
  bench('Initialize empty map', () => {
    // Simulate map initialization
    const mapConfig = {
      center: [30.4383, -84.2807] as [number, number],
      zoom: 13,
      provider: 'leaflet',
    };

    // Simulate DOM creation and configuration
    const container = { id: 'map', style: {} };
    const controls = ['zoom', 'attribution', 'scale'];

    return { mapConfig, container, controls };
  });

  bench('Initialize map with 10 markers', () => {
    const vehicles = generateVehicles(10);
    const mapState = {
      markers: vehicles.map((v) => ({
        id: v.id,
        position: [v.location.lat, v.location.lng],
        type: 'vehicle',
      })),
    };
    return mapState;
  });

  bench('Initialize map with 100 markers', () => {
    const vehicles = generateVehicles(100);
    const mapState = {
      markers: vehicles.map((v) => ({
        id: v.id,
        position: [v.location.lat, v.location.lng],
        type: 'vehicle',
      })),
    };
    return mapState;
  });

  bench('Initialize map with clustering enabled', () => {
    const vehicles = generateVehicles(1000);
    const clusters = new Map();

    // Simulate basic clustering algorithm
    vehicles.forEach((v) => {
      const key = `${Math.floor(v.location.lat * 100)}-${Math.floor(v.location.lng * 100)}`;
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key).push(v);
    });

    return { clusterCount: clusters.size, markerCount: vehicles.length };
  });
});

// ============================================================================
// Marker Rendering Benchmarks
// ============================================================================

describe('Marker Rendering Performance', () => {
  MARKER_COUNTS.forEach((count) => {
    bench(`Render ${count} vehicle markers`, () => {
      const vehicles = generateVehicles(count);

      // Simulate marker creation
      const markers = vehicles.map((vehicle) => ({
        id: vehicle.id,
        element: {
          type: 'div',
          className: 'vehicle-marker',
          style: {
            backgroundColor: '#10b981',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
          },
        },
        position: [vehicle.location.lat, vehicle.location.lng],
        popup: {
          content: `<div>${vehicle.name}</div>`,
        },
      }));

      return markers.length;
    });
  });

  MARKER_COUNTS.forEach((count) => {
    bench(`Update ${count} marker positions`, () => {
      const vehicles = generateVehicles(count);

      // Simulate position updates
      const updates = vehicles.map((v, index) => ({
        id: v.id,
        newPosition: [
          v.location.lat + Math.random() * 0.01,
          v.location.lng + Math.random() * 0.01,
        ],
      }));

      return updates.length;
    });
  });

  bench('Render mixed markers (vehicles + facilities + cameras)', () => {
    const vehicles = generateVehicles(100);
    const facilities = generateFacilities(20);
    const cameras = generateCameras(30);

    const allMarkers = [
      ...vehicles.map((v) => ({ type: 'vehicle', data: v })),
      ...facilities.map((f) => ({ type: 'facility', data: f })),
      ...cameras.map((c) => ({ type: 'camera', data: c })),
    ];

    return allMarkers.length;
  });
});

// ============================================================================
// Map Provider Switching Benchmarks
// ============================================================================

describe('Map Provider Switching', () => {
  bench('Switch from Leaflet to Google Maps', () => {
    const currentProvider = 'leaflet';
    const newProvider = 'google';
    const markers = generateVehicles(50);

    // Simulate provider switch
    const cleanup = { removeMarkers: true, destroyMap: true };
    const initialize = { provider: newProvider, markers };

    return { cleanup, initialize };
  });

  bench('Switch map style (same provider)', () => {
    const currentStyle = 'streets';
    const newStyle = 'satellite';

    // Simulate style change
    const styleUpdate = {
      from: currentStyle,
      to: newStyle,
      reloadTiles: true,
    };

    return styleUpdate;
  });

  bench('Preserve markers during provider switch', () => {
    const markers = generateVehicles(200);

    // Simulate marker state preservation
    const savedState = markers.map((m) => ({
      id: m.id,
      position: [m.location.lat, m.location.lng],
      status: m.status,
    }));

    return savedState.length;
  });
});

// ============================================================================
// Tile Loading Benchmarks
// ============================================================================

describe('Tile Loading Performance', () => {
  bench('Calculate visible tiles at zoom level 13', () => {
    const bounds = {
      north: 30.5383,
      south: 30.3383,
      east: -84.1807,
      west: -84.3807,
    };
    const zoom = 13;

    // Simulate tile calculation
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    const tiles: any[] = [];

    for (let x = 0; x < scale; x++) {
      for (let y = 0; y < scale; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles.length;
  });

  bench('Tile cache lookup (100 tiles)', () => {
    const cache = new Map();

    // Simulate tile cache
    for (let i = 0; i < 100; i++) {
      cache.set(`tile-${i}`, { data: new Uint8Array(1024) });
    }

    // Simulate lookups
    let hits = 0;
    for (let i = 0; i < 100; i++) {
      if (cache.has(`tile-${i}`)) {
        hits++;
      }
    }

    return hits;
  });

  bench('Tile preloading for adjacent areas', () => {
    const currentTile = { x: 10, y: 10, z: 13 };
    const adjacentTiles: any[] = [];

    // Calculate adjacent tiles
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx !== 0 || dy !== 0) {
          adjacentTiles.push({
            x: currentTile.x + dx,
            y: currentTile.y + dy,
            z: currentTile.z,
          });
        }
      }
    }

    return adjacentTiles.length;
  });
});

// ============================================================================
// Clustering Performance Benchmarks
// ============================================================================

describe('Clustering Performance', () => {
  CLUSTER_SIZES.forEach((size) => {
    bench(`Cluster ${size} markers using grid-based algorithm`, () => {
      const vehicles = generateVehicles(size);
      const clusters = new Map<string, any[]>();

      // Simple grid-based clustering
      const gridSize = 0.05; // degrees
      vehicles.forEach((v) => {
        const gridX = Math.floor(v.location.lat / gridSize);
        const gridY = Math.floor(v.location.lng / gridSize);
        const key = `${gridX}-${gridY}`;

        if (!clusters.has(key)) {
          clusters.set(key, []);
        }
        clusters.get(key)!.push(v);
      });

      return clusters.size;
    });
  });

  bench('Dynamic cluster splitting on zoom', () => {
    const clusteredData = generateClusteredDataset(10, 100);
    const zoom = 15; // High zoom - should split clusters

    // Simulate cluster splitting
    const newClusters = new Map();
    const gridSize = 0.01 / Math.pow(2, zoom - 10); // Smaller grid at higher zoom

    clusteredData.forEach((v) => {
      const gridX = Math.floor(v.location.lat / gridSize);
      const gridY = Math.floor(v.location.lng / gridSize);
      const key = `${gridX}-${gridY}`;

      if (!newClusters.has(key)) {
        newClusters.set(key, []);
      }
      newClusters.get(key).push(v);
    });

    return newClusters.size;
  });

  bench('Update clusters after adding 100 new markers', () => {
    const existingClusters = new Map();
    const newMarkers = generateVehicles(100);

    // Simulate incremental cluster update
    newMarkers.forEach((v) => {
      const key = `${Math.floor(v.location.lat * 100)}-${Math.floor(v.location.lng * 100)}`;
      if (!existingClusters.has(key)) {
        existingClusters.set(key, []);
      }
      existingClusters.get(key).push(v);
    });

    return existingClusters.size;
  });
});

// ============================================================================
// Filter Operations Benchmarks
// ============================================================================

describe('Filter Operations', () => {
  const dataset = generateVehicles(SEARCH_DATASET_SIZE);

  bench(`Filter ${SEARCH_DATASET_SIZE} vehicles by status`, () => {
    const filtered = dataset.filter((v) => v.status === 'active');
    return filtered.length;
  });

  bench(`Filter ${SEARCH_DATASET_SIZE} vehicles by multiple criteria`, () => {
    const filtered = dataset.filter(
      (v) =>
        v.status === 'active' &&
        v.fuelLevel > 50 &&
        v.type === 'truck' &&
        v.department === 'Operations'
    );
    return filtered.length;
  });

  bench(`Filter ${SEARCH_DATASET_SIZE} vehicles by location bounds`, () => {
    const bounds = {
      north: 30.5,
      south: 30.4,
      east: -84.2,
      west: -84.3,
    };

    const filtered = dataset.filter(
      (v) =>
        v.location.lat >= bounds.south &&
        v.location.lat <= bounds.north &&
        v.location.lng >= bounds.west &&
        v.location.lng <= bounds.east
    );
    return filtered.length;
  });

  bench('Toggle marker visibility (show/hide)', () => {
    const visibilityMap = new Map(dataset.map((v) => [v.id, true]));

    // Toggle all
    dataset.forEach((v) => {
      visibilityMap.set(v.id, !visibilityMap.get(v.id));
    });

    return visibilityMap.size;
  });

  bench('Apply multiple filters sequentially', () => {
    let filtered = dataset;

    // Status filter
    filtered = filtered.filter((v) => ['active', 'idle'].includes(v.status));

    // Department filter
    filtered = filtered.filter((v) => v.department === 'Operations');

    // Fuel filter
    filtered = filtered.filter((v) => v.fuelLevel > 25);

    // Location filter
    filtered = filtered.filter((v) => v.location.lat > 30.4);

    return filtered.length;
  });
});

// ============================================================================
// Search Operations Benchmarks
// ============================================================================

describe('Search Operations', () => {
  const dataset = generateVehicles(SEARCH_DATASET_SIZE);

  bench(`Linear search through ${SEARCH_DATASET_SIZE} vehicles by ID`, () => {
    const targetId = 'vehicle-5000';
    const found = dataset.find((v) => v.id === targetId);
    return found !== undefined;
  });

  bench(`Search ${SEARCH_DATASET_SIZE} vehicles by name (substring)`, () => {
    const query = 'vehicle-1';
    const results = dataset.filter((v) => v.id.includes(query));
    return results.length;
  });

  bench(`Search with indexed lookup (Map-based)`, () => {
    const index = new Map(dataset.map((v) => [v.id, v]));
    const targetId = 'vehicle-5000';
    const found = index.get(targetId);
    return found !== undefined;
  });

  bench('Fuzzy search simulation (edit distance)', () => {
    const query = 'vehicle-100';

    // Simple fuzzy matching simulation
    const results = dataset.filter((v) => {
      const similarity = 1 - levenshteinDistance(query, v.id) / Math.max(query.length, v.id.length);
      return similarity > 0.7;
    });

    return results.length;
  });

  bench('Search and sort results by distance', () => {
    const center = { lat: 30.4383, lng: -84.2807 };

    const results = dataset
      .map((v) => ({
        vehicle: v,
        distance: Math.sqrt(
          Math.pow(v.location.lat - center.lat, 2) +
          Math.pow(v.location.lng - center.lng, 2)
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 100);

    return results.length;
  });
});

// ============================================================================
// Memory Usage Benchmarks
// ============================================================================

describe('Memory Usage', () => {
  bench('Memory footprint of 1000 markers', () => {
    const markers = generateVehicles(1000);

    // Calculate approximate memory usage
    const jsonSize = JSON.stringify(markers).length;
    const estimatedBytes = jsonSize * 2; // Rough estimate including object overhead

    return estimatedBytes;
  });

  bench('Memory footprint with clustering (10000 markers)', () => {
    const markers = generateVehicles(10000);
    const clusters = new Map();

    markers.forEach((v) => {
      const key = `${Math.floor(v.location.lat * 100)}-${Math.floor(v.location.lng * 100)}`;
      if (!clusters.has(key)) {
        clusters.set(key, { markers: [], center: { lat: 0, lng: 0 }, count: 0 });
      }
      const cluster = clusters.get(key);
      cluster.markers.push(v.id);
      cluster.count++;
    });

    const clusterSize = JSON.stringify(Array.from(clusters.values())).length;
    return clusterSize;
  });
});

// ============================================================================
// Complex Scenarios Benchmarks
// ============================================================================

describe('Complex Scenarios', () => {
  bench('Full map update cycle (zoom + pan + filter)', () => {
    const vehicles = generateVehicles(1000);

    // Zoom change - recalculate clusters
    const clusters = new Map();
    vehicles.forEach((v) => {
      const key = `${Math.floor(v.location.lat * 200)}-${Math.floor(v.location.lng * 200)}`;
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key).push(v);
    });

    // Pan - update visible bounds
    const bounds = {
      north: 30.5,
      south: 30.4,
      east: -84.2,
      west: -84.3,
    };

    const visible = vehicles.filter(
      (v) =>
        v.location.lat >= bounds.south &&
        v.location.lat <= bounds.north &&
        v.location.lng >= bounds.west &&
        v.location.lng <= bounds.east
    );

    // Filter
    const filtered = visible.filter((v) => v.status === 'active');

    return { clusters: clusters.size, visible: visible.length, filtered: filtered.length };
  });

  bench('Real-time updates (100 markers moving)', () => {
    const vehicles = generateVehicles(100);

    // Simulate position updates
    const updates = vehicles.map((v) => ({
      ...v,
      location: {
        ...v.location,
        lat: v.location.lat + (Math.random() - 0.5) * 0.001,
        lng: v.location.lng + (Math.random() - 0.5) * 0.001,
      },
    }));

    return updates.length;
  });

  bench('Bulk operations (add 500 + remove 200 markers)', () => {
    const existing = generateVehicles(1000);
    const toAdd = generateVehicles(500);
    const toRemoveIds = new Set(existing.slice(0, 200).map((v) => v.id));

    // Simulate bulk operation
    const remaining = existing.filter((v) => !toRemoveIds.has(v.id));
    const final = [...remaining, ...toAdd];

    return final.length;
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple Levenshtein distance calculation for fuzzy search
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
