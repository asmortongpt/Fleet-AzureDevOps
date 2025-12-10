/**
 * DriverInspector Component
 *
 * Complete driver inspection interface with 4 tabs:
 * - Overview: Basic driver information and current status
 * - Performance: Driving metrics, scores, and statistics
 * - Compliance: HOS, certifications, and violations
 * - Schedule: Assigned vehicles, routes, and shifts
 */

import { Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';

interface DriverInspectorProps {
  id: string;
  initialTab?: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'active' | 'inactive' | 'on-duty' | 'off-duty';
  currentVehicle?: {
    id: string;
    name: string;
  };
  photo?: string;
  rating: number;
  totalTrips: number;
  totalMiles: number;
  safetyScore: number;
}

export const DriverInspector: React.FC<DriverInspectorProps> = ({ id, initialTab = 'overview' }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get(`/api/drivers/${id}`);
        setDriver(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load driver data');
        console.error('Error fetching driver:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDriver();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading driver data...</span>
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

  if (!driver) {
    return (
      <div className="p-8 text-gray-500">
        No driver data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {driver.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {driver.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {driver.email} • {driver.phone}
              </p>
            </div>
          </div>
          <Badge variant={driver.status === 'on-duty' ? 'default' : 'secondary'}>
            {driver.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Driver Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">License Number</dt>
                  <dd className="font-mono text-sm">{driver.licenseNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">License Expiry</dt>
                  <dd className="font-medium">{new Date(driver.licenseExpiry).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Email</dt>
                  <dd className="text-sm">{driver.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Phone</dt>
                  <dd className="font-medium">{driver.phone}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Trips</dt>
                  <dd className="font-medium">{driver.totalTrips.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Miles</dt>
                  <dd className="font-medium">{driver.totalMiles.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Rating</dt>
                  <dd className="font-medium flex items-center gap-1">
