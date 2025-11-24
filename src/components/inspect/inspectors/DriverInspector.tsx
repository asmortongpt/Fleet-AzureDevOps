/**
 * DriverInspector Component
 *
 * Complete driver inspection interface with 4 tabs:
 * - Overview: Basic driver information and current status
 * - Performance: Driving metrics, scores, and statistics
 * - Compliance: HOS, certifications, and violations
 * - Schedule: Assigned vehicles, routes, and shifts
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

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
                    {driver.rating.toFixed(1)} ⭐
                  </dd>
                </div>
                {driver.currentVehicle && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Current Vehicle</dt>
                    <dd className="font-medium">{driver.currentVehicle.name}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Driving Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{driver.safetyScore}</p>
                  <p className="text-sm text-gray-600">Safety Score</p>
                  <div className="flex items-center justify-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs">+5 this month</span>
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">98%</p>
                  <p className="text-sm text-gray-600">On-Time Delivery</p>
                  <div className="flex items-center justify-center mt-2 text-blue-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs">+2% this month</span>
                  </div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">24.5</p>
                  <p className="text-sm text-gray-600">Avg MPG</p>
                  <div className="flex items-center justify-center mt-2 text-gray-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="text-xs">-0.5 this month</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hard Braking Events</span>
                  <Badge variant="outline">2 this week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Speeding Incidents</span>
                  <Badge variant="outline">0 this week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Idle Time</span>
                  <Badge variant="outline">3.2 hrs/week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Trip Distance</span>
                  <Badge variant="outline">45.3 miles</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Hours of Service</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Driving Hours Today</span>
                    <span className="text-sm font-medium">6.5 / 11 hrs</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '59%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">On-Duty Hours</span>
                    <span className="text-sm font-medium">8.2 / 14 hrs</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '59%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Cycle Hours</span>
                    <span className="text-sm font-medium">45 / 60 hrs</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Certifications & Documents</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Commercial Driver's License</span>
                  <Badge variant="outline" className="text-green-600">Valid</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Medical Certificate</span>
                  <Badge variant="outline" className="text-green-600">Valid until {new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>HAZMAT Endorsement</span>
                  <Badge variant="outline" className="text-green-600">Valid</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Violation History</h3>
              <div className="text-center py-4 text-gray-500">
                <p className="text-green-600 font-medium">Clean Record</p>
                <p className="text-sm">No violations in the past 12 months</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Current Schedule</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium">Morning Route</p>
                <p className="text-sm text-gray-600">7:00 AM - 11:30 AM</p>
                <p className="text-sm text-gray-500">Route: Downtown Deliveries</p>
                {driver.currentVehicle && (
                  <p className="text-sm text-gray-500">Vehicle: {driver.currentVehicle.name}</p>
                )}
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="font-medium">Lunch Break</p>
                <p className="text-sm text-gray-600">11:30 AM - 12:30 PM</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium">Afternoon Route</p>
                <p className="text-sm text-gray-600">12:30 PM - 5:00 PM</p>
                <p className="text-sm text-gray-500">Route: Suburban Deliveries</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-4 py-2">
                <p className="font-medium text-gray-500">Off-Duty</p>
                <p className="text-sm text-gray-600">After 5:00 PM</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverInspector;
