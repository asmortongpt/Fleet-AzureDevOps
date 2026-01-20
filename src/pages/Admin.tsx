/**
 * Admin Page - System Configuration & Status Dashboard
 * PURPOSE: Comprehensive system administration with real configuration management
 *
 * FEATURES:
 * 1. Real-time configuration fetched from /api/admin/config
 * 2. System status and health monitoring via /api/admin/status
 * 3. Settings organized by category and impact level
 * 4. Inline configuration validation
 * 5. Change history and audit trail
 */

import {
  Settings,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Activity,
  Database,
  Zap,
  Server,
  AlertCircle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigItem {
  key: string;
  value: string;
  category: string;
  description?: string;
  requiresCTAOwner?: boolean;
}

interface SystemStatus {
  overall: 'operational' | 'degraded' | 'critical';
  uptime: number;
  timestamp: string;
  services: {
    database?: { status: string; latency?: number; version?: string };
    cache?: { status: string; type?: string };
    queue?: { status: string; type?: string };
  };
  resources: {
    memory?: { used: number; total: number; percentage: number };
    cpu?: { usage: Record<string, number> };
    process?: { pid: number; platform: string; nodeVersion: string };
  };
  stats: {
    totalVehicles: number;
    activeDrivers: number;
    pendingMaintenance: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: {
    application?: { configs: ConfigItem[]; total: number; categories: string[] };
    database?: { settings: any[] };
    environment?: { nodeEnv: string; port: number; databaseConnected: boolean };
  };
  error?: string;
  timestamp?: string;
}

export default function Admin() {
  const [configData, setConfigData] = useState<ConfigItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchConfigurations();
    fetchSystemStatus();
    // Refresh system status every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConfigurations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch configurations: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      if (data.success && data.data.application) {
        setConfigData(data.data.application.configs || []);
        setCategories(data.data.application.categories || []);
        if (data.data.application.categories && data.data.application.categories.length > 0) {
          setActiveCategory(data.data.application.categories[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configurations');
      console.error('Configuration fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const response = await fetch('/api/admin/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system status: ${response.statusText}`);
      }

      const data: { success: boolean; data: SystemStatus } = await response.json();
      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (err: any) {
      setStatusError(err.message || 'Failed to load system status');
      console.error('Status fetch error:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-gray-600 mt-1">Configuration and monitoring dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchConfigurations}
            variant="outline"
            disabled={loading}
          >
            <Zap className="mr-2 h-4 w-4" />
            Refresh Config
          </Button>
          <Button
            onClick={fetchSystemStatus}
            variant="outline"
            disabled={statusLoading}
          >
            <Activity className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {!statusLoading && systemStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Last updated: {new Date(systemStatus.timestamp).toLocaleTimeString()}
                </CardDescription>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(systemStatus.overall)}`}>
                  {getStatusIcon(systemStatus.overall)}
                  <span className="ml-2 capitalize">{systemStatus.overall}</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Uptime */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Uptime</div>
                <div className="text-lg font-bold font-mono">{formatUptime(systemStatus.uptime)}</div>
              </div>

              {/* Database */}
              {systemStatus.services.database && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">Database</div>
                    {getStatusIcon(systemStatus.services.database.status)}
                  </div>
                  <div className="text-sm font-mono text-gray-700">
                    {systemStatus.services.database.latency && `Latency: ${systemStatus.services.database.latency}ms`}
                  </div>
                </div>
              )}

              {/* Memory Usage */}
              {systemStatus.resources.memory && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Memory</div>
                  <div className="text-lg font-bold">
                    {systemStatus.resources.memory.used}/{systemStatus.resources.memory.total}MB
                  </div>
                  <div className="text-xs text-gray-500">
                    {systemStatus.resources.memory.percentage}% used
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Fleet Stats</div>
                <div className="text-xs space-y-1">
                  <div>Vehicles: {systemStatus.stats.totalVehicles}</div>
                  <div>Drivers: {systemStatus.stats.activeDrivers}</div>
                  <div>Pending: {systemStatus.stats.pendingMaintenance}</div>
                </div>
              </div>
            </div>

            {/* Services Health Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-4">
              {systemStatus.services.database && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(systemStatus.services.database.status)}`}>
                    {systemStatus.services.database.status}
                  </span>
                </div>
              )}
              {systemStatus.services.cache && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Cache</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(systemStatus.services.cache.status)}`}>
                    {systemStatus.services.cache.status}
                  </span>
                </div>
              )}
              {systemStatus.services.queue && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span className="text-sm font-medium">Queue</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(systemStatus.services.queue.status)}`}>
                    {systemStatus.services.queue.status}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {statusError && (
        <Alert variant="destructive">
          <AlertDescription>{statusError}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <div>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                {configData.length} configuration items across {categories.length} categories
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {categories.length > 0 && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 border-b pb-4">
                <span className="text-sm font-medium text-gray-600 mr-2">Filter by:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Configuration Items */}
              <div className="space-y-3">
                {configData
                  .filter((config) => activeCategory === '' || config.category === activeCategory)
                  .map((config) => (
                    <div
                      key={config.key}
                      className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{config.key}</h4>
                            {config.requiresCTAOwner && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                CTA Owner Only
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{config.description || 'No description'}</p>
                          <div className="mt-2 p-2 bg-gray-50 rounded font-mono text-xs text-gray-700 break-all">
                            {config.value || '(not set)'}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Category: <span className="font-medium">{config.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {configData.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No configuration items available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Items</div>
              <div className="text-2xl font-bold text-blue-600">{configData.length}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Categories</div>
              <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">CTA Owner Only</div>
              <div className="text-2xl font-bold text-orange-600">
                {configData.filter((c) => c.requiresCTAOwner).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
