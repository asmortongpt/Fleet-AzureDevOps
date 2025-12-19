import { useQuery } from '@tanstack/react-query';

import type { TrafficCamera } from '../types/traffic-cameras';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseTrafficCamerasOptions {
  /** Filter by county */
  county?: string;
  /** Filter by road */
  road?: string;
  /** Filter by direction */
  direction?: string;
  /** Bounding box for map viewport */
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  /** Whether to enable auto-refresh */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Hook to fetch and manage Florida traffic cameras
 * Supports filtering, auto-refresh, and viewport-based loading
 */
export function useTrafficCameras(options: UseTrafficCamerasOptions = {}) {
  const {
    county,
    road,
    direction,
    bounds,
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
  } = options;

  const params = new URLSearchParams();
  if (county) params.append('county', county);
  if (road) params.append('road', road);
  if (direction) params.append('direction', direction);
  if (bounds) {
    params.append('bounds', JSON.stringify(bounds));
  }

  const { data, isLoading, error, refetch } = useQuery<TrafficCamera[]>({
    queryKey: ['traffic-cameras', county, road, direction, bounds],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/traffic-cameras?${params}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch traffic cameras: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: refreshInterval,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  return {
    cameras: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to fetch a single traffic camera and its live feed
 */
export function useTrafficCamera(cameraId: number) {
  const { data, isLoading, error, refetch } = useQuery<TrafficCamera>({
    queryKey: ['traffic-camera', cameraId],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/traffic-cameras/${cameraId}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch camera: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!cameraId,
    staleTime: 60000, // 1 minute
  });

  return {
    camera: data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
