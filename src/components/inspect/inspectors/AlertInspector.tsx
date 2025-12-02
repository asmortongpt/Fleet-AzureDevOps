/**
 * AlertInspector Component
 *
 * Complete alert inspection interface with 3 tabs:
 * - Details: Alert information, severity, timestamp
 * - Related Events: Associated vehicles, drivers, and events
 * - Actions: Response history and available actions
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader2, AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface AlertInspectorProps {
  id: string;
  initialTab?: string;
}

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  description: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  vehicle?: {
    id: string;
    name: string;
  };
  driver?: {
    id: string;
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const severityConfig = {
  critical: { color: 'red', icon: XCircle, badge: 'destructive' as const },
  high: { color: 'orange', icon: AlertTriangle, badge: 'destructive' as const },
  medium: { color: 'yellow', icon: AlertCircle, badge: 'default' as const },
  low: { color: 'blue', icon: AlertCircle, badge: 'secondary' as const },
  info: { color: 'gray', icon: CheckCircle, badge: 'outline' as const }
};

export const AlertInspector: React.FC<AlertInspectorProps> = ({ id, initialTab = 'details' }) => {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get(`/api/alerts/${id}`);
        setAlert(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load alert data');
        console.error('Error fetching alert:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAlert();
    }
  }, [id]);

  const handleAcknowledge = async () => {
    if (!alert) return;
    setProcessing(true);
    try {
      await apiClient.post(`/api/alerts/${id}/acknowledge`, {});
      setAlert({ ...alert, status: 'acknowledged' });
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!alert) return;
    setProcessing(true);
    try {
      await apiClient.post(`/api/alerts/${id}/resolve`, {});
      setAlert({ ...alert, status: 'resolved' });
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = async () => {
    if (!alert) return;
    setProcessing(true);
    try {
      await apiClient.post(`/api/alerts/${id}/dismiss`, {});
      setAlert({ ...alert, status: 'dismissed' });
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading alert data...</span>
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

  if (!alert) {
    return (
      <div className="p-8 text-gray-500">
        No alert data available
      </div>
    );
  }

  const SeverityIcon = severityConfig[alert.severity].icon;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SeverityIcon className={`h-8 w-8 text-${severityConfig[alert.severity].color}-600`} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {alert.type}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={severityConfig[alert.severity].badge}>
              {alert.severity.toUpperCase()}
            </Badge>
            <Badge variant={alert.status === 'resolved' ? 'default' : 'secondary'}>
              {alert.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related Events</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Alert Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Message</p>
                  <p className="font-medium text-lg">{alert.message}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-800 dark:text-gray-200">{alert.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-600">Alert Type</p>
                    <p className="font-medium">{alert.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Severity</p>
                    <p className="font-medium capitalize">{alert.severity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{alert.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>

            {alert.location && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Latitude</p>
                      <p className="font-mono">{alert.location.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Longitude</p>
                      <p className="font-mono">{alert.location.longitude.toFixed(6)}</p>
                    </div>
                  </div>
                  {alert.location.address && (
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{alert.location.address}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Related Events Tab */}
        <TabsContent value="related" className="p-4">
          <div className="space-y-4">
            {alert.vehicle && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Associated Vehicle</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{alert.vehicle.name}</p>
                    <p className="text-sm text-gray-600">Vehicle ID: {alert.vehicle.id}</p>
                  </div>
                  <Button variant="outline" size="sm">View Vehicle</Button>
                </div>
              </Card>
            )}

            {alert.driver && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Associated Driver</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{alert.driver.name}</p>
                    <p className="text-sm text-gray-600">Driver ID: {alert.driver.id}</p>
                  </div>
                  <Button variant="outline" size="sm">View Driver</Button>
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Related Alerts</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Speeding Alert</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                  <Badge variant="outline">Medium</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Route Deviation</p>
                    <p className="text-sm text-gray-600">4 hours ago</p>
                  </div>
                  <Badge variant="outline">Low</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Available Actions</h3>
              <div className="space-y-3">
                {alert.status === 'active' && (
                  <Button
                    onClick={handleAcknowledge}
                    disabled={processing}
                    className="w-full"
                    variant="outline"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Acknowledge Alert
                  </Button>
                )}
                {(alert.status === 'active' || alert.status === 'acknowledged') && (
                  <Button
                    onClick={handleResolve}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Resolve Alert
                  </Button>
                )}
                {alert.status !== 'dismissed' && (
                  <Button
                    onClick={handleDismiss}
                    disabled={processing}
                    className="w-full"
                    variant="destructive"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Dismiss Alert
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Action History</h3>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-px h-full bg-gray-300"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Alert Created</p>
                    <p className="text-sm text-gray-600">{new Date(alert.timestamp).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">System detected {alert.type.toLowerCase()}</p>
                  </div>
                </div>
                {alert.status !== 'active' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-px h-full bg-gray-300"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{alert.status === 'acknowledged' ? 'Acknowledged' : 'Status Updated'}</p>
                      <p className="text-sm text-gray-600">Status changed to {alert.status}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertInspector;
