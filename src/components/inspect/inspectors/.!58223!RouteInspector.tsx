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
import { apiClient } from '@/lib/api';

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
