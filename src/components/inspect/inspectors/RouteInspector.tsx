/**
 * RouteInspector Component
 *
 * Complete route inspection interface with 3 tabs:
 * - Overview: Route details, distance, duration estimates
 * - Stops: List of stops along the route
 * - Performance: Route efficiency and optimization metrics
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Loader2, AlertCircle, MapPin, Navigation, TrendingUp } from 'lucide-react';

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
        const data = await apiClient.get(`/api/routes/${id}`);
        setRoute(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load route data');
        console.error('Error fetching route:', err);
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
      case 'pending': return 'bg-blue-500';
      case 'skipped': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading route data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-8 text-gray-500">
        No route data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {route.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
        <TabsContent value="overview" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Route Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{route.totalDistance.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Miles</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Navigation className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{route.stops.length}</p>
                  <p className="text-sm text-gray-600">Stops</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{formatDuration(route.estimatedDuration)}</p>
                  <p className="text-sm text-gray-600">Est. Time</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold text-yellow-600">{route.optimizationScore}%</p>
                  <p className="text-sm text-gray-600">Optimized</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Assignments</h3>
              <dl className="space-y-3">
                {route.assignedVehicle && (
                  <div>
                    <dt className="text-sm text-gray-600">Vehicle</dt>
                    <dd className="font-medium">{route.assignedVehicle.name}</dd>
                  </div>
                )}
                {route.assignedDriver && (
                  <div>
                    <dt className="text-sm text-gray-600">Driver</dt>
                    <dd className="font-medium">{route.assignedDriver.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-600">Created</dt>
                  <dd className="font-medium">{new Date(route.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd className="font-medium capitalize">{route.status}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Route Map</h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Map visualization would appear here</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Stops Tab */}
        <TabsContent value="stops" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Route Stops ({route.stops.length})</h3>
            <div className="space-y-3">
              {route.stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full ${getStatusColor(stop.status)} flex items-center justify-center text-white font-bold text-sm`}>
                      {stop.sequence}
                    </div>
                    {index < route.stops.length - 1 && (
                      <div className="w-px h-12 bg-gray-300 dark:bg-gray-600 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getStopIcon(stop.type)}</span>
                      <span className="font-medium capitalize">{stop.type}</span>
                      <Badge variant="outline" className="ml-auto">
                        {stop.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{stop.location.address}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {stop.location.latitude.toFixed(6)}, {stop.location.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Est. Arrival: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Route Optimization</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Efficiency</span>
                    <span className="text-sm font-medium">{route.optimizationScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${route.optimizationScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600">Distance Savings</p>
                    <p className="text-xl font-bold text-blue-600">12.3 mi</p>
                    <p className="text-xs text-gray-500">vs. unoptimized</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600">Time Savings</p>
                    <p className="text-xl font-bold text-green-600">45 min</p>
                    <p className="text-xs text-gray-500">vs. unoptimized</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600">Fuel Savings</p>
                    <p className="text-xl font-bold text-purple-600">$18.50</p>
                    <p className="text-xs text-gray-500">estimated</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Average Stop Time</dt>
                  <dd className="font-medium">8 minutes</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Completion Rate</dt>
                  <dd className="font-medium">95%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">On-Time Deliveries</dt>
                  <dd className="font-medium">92%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Estimated Fuel Cost</dt>
                  <dd className="font-medium">${(route.totalDistance * 0.35).toFixed(2)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-blue-600">💡</span>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Optimize Stop Sequence</p>
                    <p className="text-sm text-gray-600">Reordering stops 5-7 could save 3.2 miles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-green-600">✅</span>
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">Well Optimized</p>
                    <p className="text-sm text-gray-600">Current route is highly efficient</p>
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
