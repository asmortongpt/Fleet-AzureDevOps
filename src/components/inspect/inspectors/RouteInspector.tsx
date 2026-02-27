/**
 * RouteInspector Component
 *
 * Complete route inspection interface with 3 tabs:
 * - Overview: Route details, distance, duration estimates
 * - Stops: List of stops along the route
 * - Performance: Route efficiency and optimization metrics
 */

import { Loader2, AlertCircle, MapPin, Navigation, TrendingUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from "@/lib/api-client";
import { formatDate, formatTime } from '@/utils/format-helpers';
import logger from '@/utils/logger';
interface RouteInspectorProps {
  id: string;
  initialTab?: string;
}

interface RouteStop {
  id: string;
  sequence: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedArrival: string;
  type: 'pickup' | 'delivery' | 'waypoint';
  status: 'pending' | 'completed' | 'skipped';
}

interface Route {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'in-progress' | 'completed';
  totalDistance: number;
  estimatedDuration: number;
  stops: RouteStop[];
  assignedVehicle?: {
    id: string;
    name: string;
  };
  assignedDriver?: {
    id: string;
    name: string;
  };
  optimizationScore: number;
  createdAt: string;
}

export const RouteInspector: React.FC<RouteInspectorProps> = ({ id, initialTab = 'overview' }) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<Route>(`/api/routes/${id}`);
        setRoute(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load route data');
        logger.error('Error fetching route:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoute();
    }
  }, [id]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'pickup': return '📦';
      case 'delivery': return '🚚';
      case 'waypoint': return '📍';
      default: return '•';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-emerald-500';
      case 'skipped': return 'bg-white/[0.10]';
      default: return 'bg-white/[0.08]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="ml-2 text-white/40">Loading route data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-3 text-white/40">
        No route data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white/80 dark:text-white">
              {route.name}
            </h2>
            <p className="text-sm text-white/40 dark:text-white/40">
              {route.description}
            </p>
          </div>
          <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
            {route.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stops">Stops</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Route Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-emerald-500/10 dark:bg-white/[0.04] rounded-lg">
                  <MapPin className="w-4 h-4 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm font-bold text-emerald-400">{(route.totalDistance ?? 0).toFixed(1)}</p>
                  <p className="text-sm text-white/40">Miles</p>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Navigation className="w-4 h-4 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-bold text-green-600">{route.stops.length}</p>
                  <p className="text-sm text-white/40">Stops</p>
                </div>
                <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <Loader2 className="w-4 h-4 mx-auto mb-2 text-amber-600" />
                  <p className="text-sm font-bold text-amber-600">{formatDuration(route.estimatedDuration)}</p>
                  <p className="text-sm text-white/40">Est. Time</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm font-bold text-yellow-600">{route.optimizationScore}%</p>
                  <p className="text-sm text-white/40">Optimized</p>
                </div>
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Assignments</h3>
              <dl className="space-y-3">
                {route.assignedVehicle && (
                  <div>
                    <dt className="text-sm text-white/40">Vehicle</dt>
                    <dd className="font-medium">{route.assignedVehicle.name}</dd>
                  </div>
                )}
                {route.assignedDriver && (
                  <div>
                    <dt className="text-sm text-white/40">Driver</dt>
                    <dd className="font-medium">{route.assignedDriver.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-white/40">Created</dt>
                  <dd className="font-medium">{formatDate(route.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-white/40">Status</dt>
                  <dd className="font-medium capitalize">{route.status}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-2 md:col-span-2">
              <h3 className="text-sm font-semibold mb-2">Route Map</h3>
              <div className="bg-white/[0.05] dark:bg-[#18181b] rounded-lg h-96 flex items-center justify-center">
                <p className="text-white/40">Map visualization would appear here</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Stops Tab */}
        <TabsContent value="stops" className="p-2">
          <Card className="p-2">
            <h3 className="text-sm font-semibold mb-2">Route Stops ({route.stops.length})</h3>
            <div className="space-y-3">
              {route.stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-2 p-2 bg-white/[0.03] dark:bg-[#18181b] rounded-lg hover:bg-white/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(stop.status)} flex items-center justify-center text-white font-bold text-sm`}>
                      {stop.sequence}
                    </div>
                    {index < route.stops.length - 1 && (
                      <div className="w-px h-9 bg-white/[0.08] dark:bg-white/[0.15] mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getStopIcon(stop.type)}</span>
                      <span className="font-medium capitalize">{stop.type}</span>
                      <Badge variant="outline" className="ml-auto">
                        {stop.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/40 mb-1">{stop.location.address}</p>
                    <p className="text-xs text-white/40 font-mono">
                      {(stop.location?.latitude ?? 0).toFixed(6)}, {(stop.location?.longitude ?? 0).toFixed(6)}
                    </p>
                    <p className="text-xs text-white/40 mt-2">
                      Est. Arrival: {formatTime(stop.estimatedArrival)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="p-2">
          <div className="space-y-2">
            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Route Optimization</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/40">Overall Efficiency</span>
                    <span className="text-sm font-medium">{route.optimizationScore}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${route.optimizationScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-3 bg-emerald-500/10 dark:bg-white/[0.04] rounded-lg">
                    <p className="text-sm text-white/40">Distance Savings</p>
                    <p className="text-base font-bold text-emerald-400">12.3 mi</p>
                    <p className="text-xs text-white/40">vs. unoptimized</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-white/40">Time Savings</p>
                    <p className="text-base font-bold text-green-600">45 min</p>
                    <p className="text-xs text-white/40">vs. unoptimized</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-white/40">Fuel Savings</p>
                    <p className="text-base font-bold text-amber-600">$18.50</p>
                    <p className="text-xs text-white/40">estimated</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Performance Metrics</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-white/40">Average Stop Time</dt>
                  <dd className="font-medium">8 minutes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/40">Completion Rate</dt>
                  <dd className="font-medium">95%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/40">On-Time Deliveries</dt>
                  <dd className="font-medium">92%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/40">Estimated Fuel Cost</dt>
                  <dd className="font-medium">${((route.totalDistance ?? 0) * 0.35).toFixed(2)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Recommendations</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-emerald-500/10 dark:bg-white/[0.04] rounded-lg">
                  <span className="text-emerald-400">💡</span>
                  <div className="flex-1">
                    <p className="font-medium text-emerald-400 dark:text-emerald-200">Optimize Stop Sequence</p>
                    <p className="text-sm text-white/40">Reordering stops 5-7 could save 3.2 miles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-green-600">✅</span>
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">Well Optimized</p>
                    <p className="text-sm text-white/40">Current route is highly efficient</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteInspector;
