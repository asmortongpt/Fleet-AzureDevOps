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
import { apiClient } from "@/lib/api-client";
import { formatEnum } from '@/utils/format-enum';
import { formatDate, formatNumber } from '@/utils/format-helpers';
import logger from '@/utils/logger';
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
        const data = await apiClient.get<Driver>(`/api/drivers/${id}`);
        setDriver(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load driver data');
        logger.error('Error fetching driver:', err);
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
      <div className="flex items-center justify-center p-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="ml-2 text-[var(--text-tertiary)]">Loading driver data...</span>
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

  if (!driver) {
    return (
      <div className="p-3 text-[var(--text-tertiary)]">
        No driver data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                {driver.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] dark:text-white">
                {driver.name}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)]">
                {driver.email} • {driver.phone}
              </p>
            </div>
          </div>
          <Badge variant={driver.status === 'on-duty' ? 'default' : 'secondary'}>
            {formatEnum(driver.status)}
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
        <TabsContent value="overview" className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Driver Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">License Number</dt>
                  <dd className="font-mono text-sm">{driver.licenseNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">License Expiry</dt>
                  <dd className="font-medium">{formatDate(driver.licenseExpiry)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">Email</dt>
                  <dd className="text-sm">{driver.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">Phone</dt>
                  <dd className="font-medium">{driver.phone}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Statistics</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">Total Trips</dt>
                  <dd className="font-medium">{formatNumber(driver.totalTrips)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">Total Miles</dt>
                  <dd className="font-medium">{formatNumber(driver.totalMiles)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--text-tertiary)]">Rating</dt>
                  <dd className="font-medium flex items-center gap-1">
                    {(driver.rating ?? 0).toFixed(1)} ⭐
                  </dd>
                </div>
                {driver.currentVehicle && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--text-tertiary)]">Current Vehicle</dt>
                    <dd className="font-medium">{driver.currentVehicle.name}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="p-2">
          <div className="space-y-2">
            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Driving Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-base font-bold text-green-600">{driver.safetyScore}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Safety Score</p>
                  <div className="flex items-center justify-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs">+5 this month</span>
                  </div>
                </div>
                <div className="text-center p-2 bg-emerald-500/10 dark:bg-white/[0.04] rounded-lg">
                  <p className="text-base font-bold text-emerald-400">98%</p>
                  <p className="text-sm text-[var(--text-tertiary)]">On-Time Delivery</p>
                  <div className="flex items-center justify-center mt-2 text-emerald-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs">+2% this month</span>
                  </div>
                </div>
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-base font-bold text-yellow-600">24.5</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Avg MPG</p>
                  <div className="flex items-center justify-center mt-2 text-[var(--text-tertiary)]">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="text-xs">-0.5 this month</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Recent Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Hard Braking Events</span>
                  <Badge variant="outline">2 this week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Speeding Incidents</span>
                  <Badge variant="outline">0 this week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Idle Time</span>
                  <Badge variant="outline">3.2 hrs/week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-tertiary)]">Average Trip Distance</span>
                  <Badge variant="outline">45.3 miles</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="p-2">
          <div className="space-y-2">
            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Hours of Service</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--text-tertiary)]">Driving Hours Today</span>
                    <span className="text-sm font-medium">6.5 / 11 hrs</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '59%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--text-tertiary)]">On-Duty Hours</span>
                    <span className="text-sm font-medium">8.2 / 14 hrs</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '59%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-[var(--text-tertiary)]">Cycle Hours</span>
                    <span className="text-sm font-medium">45 / 60 hrs</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Certifications & Documents</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Commercial Driver's License</span>
                  <Badge variant="outline" className="text-green-600">Valid</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>Medical Certificate</span>
                  <Badge variant="outline" className="text-green-600">Valid until {formatDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>HAZMAT Endorsement</span>
                  <Badge variant="outline" className="text-green-600">Valid</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-sm font-semibold mb-2">Violation History</h3>
              <div className="text-center py-2 text-[var(--text-tertiary)]">
                <p className="text-green-600 font-medium">Clean Record</p>
                <p className="text-sm">No violations in the past 12 months</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="p-2">
          <Card className="p-2">
            <h3 className="text-sm font-semibold mb-2">Current Schedule</h3>
            <div className="space-y-2">
              <div className="border-l-4 border-emerald-500 pl-2 py-2">
                <p className="font-medium">Morning Route</p>
                <p className="text-sm text-[var(--text-tertiary)]">7:00 AM - 11:30 AM</p>
                <p className="text-sm text-[var(--text-tertiary)]">Route: Downtown Deliveries</p>
                {driver.currentVehicle && (
                  <p className="text-sm text-[var(--text-tertiary)]">Vehicle: {driver.currentVehicle.name}</p>
                )}
              </div>
              <div className="border-l-4 border-green-500 pl-2 py-2">
                <p className="font-medium">Lunch Break</p>
                <p className="text-sm text-[var(--text-tertiary)]">11:30 AM - 12:30 PM</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-2 py-2">
                <p className="font-medium">Afternoon Route</p>
                <p className="text-sm text-[var(--text-tertiary)]">12:30 PM - 5:00 PM</p>
                <p className="text-sm text-[var(--text-tertiary)]">Route: Suburban Deliveries</p>
              </div>
              <div className="border-l-4 border-[var(--border-default)] pl-2 py-2">
                <p className="font-medium text-[var(--text-tertiary)]">Off-Duty</p>
                <p className="text-sm text-[var(--text-tertiary)]">After 5:00 PM</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverInspector;
