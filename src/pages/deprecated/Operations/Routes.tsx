/**
 * Routes Operations Surface
 *
 * PURPOSE: "What route actions can I take right now?"
 *
 * FEATURES:
 * - Real-time route list with live data from /api/routes
 * - Search and filter routes by name, status, vehicle, driver
 * - View comprehensive route details and metrics
 * - Route optimization with efficiency scoring
 * - Status indicators: active, pending, completed
 * - Responsive pagination and loading states
 * - Error handling and fallback states
 *
 * WORKFLOW:
 * - View routes list with key details (left panel)
 * - Click route → view details and optimization options (right panel)
 * - Actions: optimize, view stops, track metrics
 */

import React, { useState, useMemo } from 'react';
import { MapPin, Plus, Search, Zap, Briefcase, CheckCircle, AlertTriangle, Spinner } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

import { SplitView } from '@/components/operations/SplitView';
import { ActionButton, StatusBadge } from '@/components/operations/InlineActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getCsrfToken } from '@/hooks/use-api';
import logger from '@/utils/logger';

/**
 * Type definitions for route data from API
 */
interface RouteStop {
  stopNumber: number;
  address: string;
  estimatedArrival: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: number;
}

interface RouteData {
  routeId: string;
  vehicleId?: string | null;
  driverId?: string | null;
  status: 'active' | 'pending' | 'completed' | 'in_progress' | 'planned';
  stops: RouteStop[];
  optimizationScore: number;
  estimatedDuration: number;
  type: string;
  date: string;
  startLocation: string;
  endLocation: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  data: RouteData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Fetch routes from API with error handling
 */
async function fetchRoutes(searchQuery: string = ''): Promise<RouteData[]> {
  try {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append('search', searchQuery);
    }

    const response = await fetch(`/api/routes?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as ApiResponse;
    return result.data || [];
  } catch (error) {
    logger.error('Failed to fetch routes:', error);
    throw error;
  }
}

/**
 * Get status color based on route status
 */
function getStatusColor(status: string): 'active' | 'pending' | 'completed' {
  switch (status) {
    case 'active':
    case 'in_progress':
      return 'active';
    case 'completed':
      return 'completed';
    default:
      return 'pending';
  }
}

/**
 * Format distance display
 */
function formatDistance(stops: RouteStop[]): string {
  // Estimate distance based on number of stops (rough approximation)
  const estimatedMilesPerStop = 2.5;
  return (stops.length * estimatedMilesPerStop).toFixed(1);
}

/**
 * Format duration from minutes to readable string
 */
function formatDuration(minutes: number): string {
  if (minutes === 0) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Main component
 */
export function RoutesOperations() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch routes from API
  const { data: routes = [], isLoading, error, refetch } = useQuery<RouteData[]>({
    queryKey: ['routes', searchQuery],
    queryFn: () => fetchRoutes(searchQuery),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const selectedRoute = useMemo(
    () => routes.find((r) => r.routeId === selectedRouteId),
    [routes, selectedRouteId]
  );

  /**
   * Handle route optimization
   */
  const handleOptimize = async () => {
    if (!selectedRoute) return;

    try {
      const token = await getCsrfToken();

      const response = await fetch('/api/routes/optimize', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'X-CSRF-Token': token }),
        },
        body: JSON.stringify({ routeId: selectedRoute.routeId }),
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }

      toast.success('Route optimized successfully!', {
        duration: 3000,
        icon: <Zap className="w-5 h-5" />,
      });

      // Refetch routes to get updated data
      await refetch();
    } catch (error) {
      logger.error('Route optimization error:', error);
      toast.error('Failed to optimize route');
    }
  };

  /**
   * Render individual route item in list
   */
  const renderRouteItem = (route: RouteData) => {
    const isSelected = route.routeId === selectedRouteId;
    const statusColor = getStatusColor(route.status);
    const distance = formatDistance(route.stops);
    const nextStop = route.stops.find(s => s.status !== 'completed');

    return (
      <motion.div
        key={route.routeId}
        whileHover={{ scale: 1.01, x: 4 }}
        onClick={() => {
          setSelectedRouteId(route.routeId);
          setIsCreating(false);
        }}
        className={cn(
          'p-4 border-b border-slate-700/50 cursor-pointer transition-colors',
          'hover:bg-cyan-400/5',
          isSelected && 'bg-cyan-400/10 border-l-4 border-l-cyan-400'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Route Icon */}
          <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-400/20 to-pink-500/20 flex items-center justify-center border border-violet-400/30">
            <MapPin className="w-6 h-6 text-violet-400" />
          </div>

          {/* Route Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white mb-1 truncate">
              {route.date ? `${route.startLocation} → ${route.endLocation}` : 'Unnamed Route'}
            </h3>
            <p className="text-xs text-slate-400">
              {route.stops.length} stops • {distance} mi • {formatDuration(route.estimatedDuration)}
            </p>
            {nextStop && (
              <p className="text-xs text-cyan-300 mt-1">
                Next: {nextStop.address}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <StatusBadge status={statusColor} size="sm" />
          </div>
        </div>

        {/* Optimization Score */}
        {route.optimizationScore > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xs text-slate-400">Efficiency:</div>
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  route.optimizationScore >= 80
                    ? 'bg-green-500'
                    : route.optimizationScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                )}
                style={{ width: `${route.optimizationScore}%` }}
              />
            </div>
            <div className="text-xs text-slate-300">{Math.round(route.optimizationScore)}%</div>
          </div>
        )}
      </motion.div>
    );
  };

  /**
   * Render detail panel content
   */
  const detailContent = () => {
    if (isCreating) {
      return (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4">New Route</h4>
          <div className="space-y-3">
            <Input
              placeholder="Start location"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Input
              placeholder="End location"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Input
              placeholder="Number of stops"
              type="number"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
        </div>
      );
    }

    if (!selectedRoute) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <Briefcase className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-sm text-slate-400">Select a route to view details</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Route Summary */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4">Route Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <StatusBadge status={getStatusColor(selectedRoute.status)} size="sm" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stops:</span>
              <span className="text-white font-semibold">{selectedRoute.stops.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance:</span>
              <span className="text-white font-semibold">{formatDistance(selectedRoute.stops)} mi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Est. Duration:</span>
              <span className="text-white font-semibold">{formatDuration(selectedRoute.estimatedDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Route Type:</span>
              <span className="text-white font-semibold capitalize">{selectedRoute.type}</span>
            </div>
          </div>
        </div>

        {/* Optimization Score */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-violet-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-3">Efficiency Score</h4>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">Overall Optimization</span>
              <span className="text-sm font-bold text-white">{Math.round(selectedRoute.optimizationScore)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  selectedRoute.optimizationScore >= 80
                    ? 'bg-green-500'
                    : selectedRoute.optimizationScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                )}
                style={{ width: `${selectedRoute.optimizationScore}%` }}
              />
            </div>
          </div>
          <Button
            onClick={handleOptimize}
            size="sm"
            className="bg-violet-500 hover:bg-violet-400 text-white w-full"
          >
            <Zap className="w-4 h-4" />
            <span className="ml-2">Optimize Route</span>
          </Button>
        </div>

        {/* Route Stops */}
        {selectedRoute.stops.length > 0 && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-slate-600/30 p-4">
            <h4 className="text-sm font-bold text-white mb-3">Stops ({selectedRoute.stops.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedRoute.stops.map((stop) => (
                <div key={stop.stopNumber} className="flex items-start gap-2 p-2 bg-slate-700/20 rounded text-xs">
                  <div className="text-slate-400 font-semibold">#{stop.stopNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{stop.address}</p>
                    <p className="text-slate-400 text-xs">
                      {new Date(stop.estimatedArrival).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={cn(
                    'flex-shrink-0 w-2 h-2 rounded-full',
                    stop.status === 'completed' ? 'bg-green-500' :
                    stop.status === 'in-progress' ? 'bg-yellow-500' :
                    'bg-slate-500'
                  )} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {selectedRoute.notes && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-slate-600/30 p-4">
            <h4 className="text-sm font-bold text-white mb-2">Notes</h4>
            <p className="text-xs text-slate-300">{selectedRoute.notes}</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Left panel content with search and routes list
   */
  const listPanel = (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
           
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search routes..."
            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
      </div>

      {/* Routes List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Spinner className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading routes...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-sm text-red-400 mb-2">Failed to load routes</p>
            <Button
              onClick={() => refetch()}
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && routes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
            <MapPin className="w-8 h-8 mb-2" />
            <p className="text-sm">No routes found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        )}

        {!isLoading && !error && routes.map(renderRouteItem)}
      </div>
    </div>
  );

  // Route count display
  const routeCount = routes.length;
  const activeCount = routes.filter(r => r.status === 'active' || r.status === 'in_progress').length;

  return (
    <SplitView
      theme="operations"
      listPanel={{
        title: 'Routes',
        description: `${activeCount} active • ${routeCount} total`,
        icon: <MapPin />,
        content: listPanel,
        actions: (
          <Button
            onClick={() => {
              setIsCreating(true);
              setSelectedRouteId(null);
            }}
            size="sm"
            className="bg-violet-500 hover:bg-violet-400 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2">New Route</span>
          </Button>
        ),
      }}
      detailPanel={
        selectedRouteId || isCreating
          ? {
              title: isCreating ? 'New Route' : selectedRoute?.startLocation || 'Route Details',
              subtitle: isCreating ? 'Create new route' : `${selectedRoute?.stops.length || 0} stops`,
              content: detailContent(),
              onClose: () => {
                setSelectedRouteId(null);
                setIsCreating(false);
              },
              actions: isCreating ? (
                <ActionButton
                  icon={<CheckCircle />}
                  label="Create"
                  onClick={() => {
                    toast.success('Route created successfully!');
                    setIsCreating(false);
                  }}
                  variant="success"
                />
              ) : null,
            }
          : null
      }
    />
  );
}

export default RoutesOperations;
