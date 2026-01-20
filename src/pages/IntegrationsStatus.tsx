/**
 * IntegrationsStatus - Integration Health Dashboard
 * Real-time monitoring of all external integrations
 *
 * PURPOSE: Provides visibility into integration connectivity and health status
 * Shows real-time status from /api/integrations endpoint with connection health indicators
 */

import axios from 'axios';
import {
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { IntegrationCard, IntegrationHealth } from '@/components/integrations/IntegrationCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface IntegrationSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
}

export default function IntegrationsStatus() {
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [summary, setSummary] = useState<IntegrationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrationHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchIntegrationHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchIntegrationHealth = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get('/api/integrations/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
        }
      });

      setIntegrations(response.data.integrations);
      setSummary(response.data.summary);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch integration health');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSingleIntegration = async (integrationName: string) => {
    try {
      const response = await axios.get(
        `/api/integrations/health/${integrationName}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
          }
        }
      );

      setIntegrations((prev) =>
        prev.map((i) => (i.name === response.data.name ? response.data : i))
      );
    } catch (err) {
      console.error(`Failed to refresh ${integrationName}:`, err);
    }
  };

  const getSystemHealthScore = () => {
    if (!summary) return 0;
    if (summary.total === 0) return 0;

    const score =
      (summary.healthy * 100 + summary.degraded * 50 + summary.down * 0 + summary.unknown * 25) /
      summary.total;
    return Math.round(score);
  };

  const getSystemHealthStatus = () => {
    const score = getSystemHealthScore();
    if (score >= 90) return { label: 'Healthy', color: 'text-green-500', icon: CheckCircle2 };
    if (score >= 70) return { label: 'Degraded', color: 'text-yellow-500', icon: AlertTriangle };
    if (score >= 50) return { label: 'Issues', color: 'text-orange-500', icon: AlertTriangle };
    return { label: 'Critical', color: 'text-red-500', icon: XCircle };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading integration status...</p>
        </div>
      </div>
    );
  }

  const healthStatus = getSystemHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Health Status</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of all external integrations
          </p>
        </div>
        <Button onClick={fetchIntegrationHealth} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Health Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-blue-500" />
                <div>
                  <CardTitle>System Health Overview</CardTitle>
                  <CardDescription>Overall integration health score</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <HealthIcon className={`h-8 w-8 ${healthStatus.color}`} />
                <div className="text-right">
                  <div className="text-2xl font-bold">{getSystemHealthScore()}%</div>
                  <div className={`text-sm ${healthStatus.color}`}>{healthStatus.label}</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.healthy}</div>
                <div className="text-sm text-gray-600">Healthy</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{summary.degraded}</div>
                <div className="text-sm text-gray-600">Degraded</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.down}</div>
                <div className="text-sm text-gray-600">Down</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{summary.unknown}</div>
                <div className="text-sm text-gray-600">Unknown</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div key={integration.name}>
            <IntegrationCard
              integration={integration}
              onRefresh={() => refreshSingleIntegration(integration.name.toLowerCase().replace(/\s+/g, '-'))}
              refreshing={refreshing}
            />
          </div>
        ))}
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration Status Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span><strong>Healthy:</strong> Integration is fully operational</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span><strong>Degraded:</strong> Integration is working but with issues</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span><strong>Down:</strong> Integration is not working</span>
          </div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-gray-400" />
            <span><strong>Unknown:</strong> Status could not be determined</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
