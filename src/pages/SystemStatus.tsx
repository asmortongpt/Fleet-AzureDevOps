/**
 * System Status Page - Comprehensive system health monitoring dashboard
 * Shows connection health, emulator status, and real-time metrics
 */

import { Activity, AlertCircle, CheckCircle2, Clock, Database, Radio, Server, TrendingUp, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConnectionStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  message?: string;
  lastChecked: Date;
  metadata?: Record<string, any>;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  connections: ConnectionStatus[];
  emulators: {
    gps: number;
    obd2: number;
    fuel: number;
    maintenance: number;
    driver: number;
    route: number;
    cost: number;
    iot: number;
    radio: number;
    video: number;
    ev: number;
    inventory: number;
    dispatch: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

interface EmulatorStatus {
  isRunning: boolean;
  isPaused: boolean;
  stats: {
    totalVehicles: number;
    activeVehicles: number;
    totalEvents: number;
    eventsPerSecond: number;
    uptime: number;
  };
  emulators: {
    gps: number;
    obd2: number;
    fuel: number;
    maintenance: number;
    driver: number;
    route: number;
    cost: number;
    iot: number;
    radio: number;
  };
}

export default function SystemStatus() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [emulatorStatus, setEmulatorStatus] = useState<EmulatorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data.data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  // Fetch emulator status
  const fetchEmulatorStatus = async () => {
    try {
      const response = await fetch('/api/emulators/status');
      if (response.ok) {
        const data = await response.json();
        setEmulatorStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching emulator status:', error);
    }
  };

  // Initial load
  useEffect(() => {
    Promise.all([fetchSystemHealth(), fetchEmulatorStatus()])
      .finally(() => setLoading(false));
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSystemHealth();
      fetchEmulatorStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Emulator control handlers
  const handleStartEmulators = async () => {
    try {
      const response = await fetch('/api/emulators/start-all', { method: 'POST' });
      if (response.ok) {
        fetchEmulatorStatus();
      }
    } catch (error) {
      console.error('Error starting emulators:', error);
    }
  };

  const handleStopEmulators = async () => {
    try {
      const response = await fetch('/api/emulators/stop-all', { method: 'POST' });
      if (response.ok) {
        fetchEmulatorStatus();
      }
    } catch (error) {
      console.error('Error stopping emulators:', error);
    }
  };

  const handlePauseEmulators = async () => {
    try {
      const response = await fetch('/api/emulators/pause', { method: 'POST' });
      if (response.ok) {
        fetchEmulatorStatus();
      }
    } catch (error) {
      console.error('Error pausing emulators:', error);
    }
  };

  const handleResumeEmulators = async () => {
    try {
      const response = await fetch('/api/emulators/resume', { method: 'POST' });
      if (response.ok) {
        fetchEmulatorStatus();
      }
    } catch (error) {
      console.error('Error resuming emulators:', error);
    }
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '< 1m';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-700 dark:text-gray-400">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">System Status</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive system health monitoring and emulator control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchSystemHealth();
              fetchEmulatorStatus();
            }}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Overall System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemHealth?.overall || 'unknown')}
              <div>
                <p className="text-sm font-bold capitalize">{systemHealth?.overall || 'Unknown'}</p>
                <p className="text-sm text-gray-500">System Status</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-sm font-semibold">{formatUptime(systemHealth?.uptime || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Memory</p>
                <p className="text-sm font-semibold">{systemHealth?.memory.percentage || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Connections</p>
                <p className="text-sm font-semibold">
                  {systemHealth?.connections.filter(c => c.status === 'healthy').length || 0}/
                  {systemHealth?.connections.length || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="emulators">Emulators</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Service Connections
              </CardTitle>
              <CardDescription>
                Status of external services and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemHealth?.connections.map((conn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(conn.status)}
                      <div>
                        <p className="font-medium">{conn.name}</p>
                        <p className="text-sm text-gray-500">
                          {conn.message || 'No message'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(conn.status)}>
                        {conn.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {conn.responseTime}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emulators Tab */}
        <TabsContent value="emulators" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Emulator Control
              </CardTitle>
              <CardDescription>
                Start, stop, and monitor fleet emulators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStartEmulators}
                  disabled={emulatorStatus?.isRunning}
                  className="flex-1"
                >
                  Start All Emulators
                </Button>
                <Button
                  onClick={handleStopEmulators}
                  disabled={!emulatorStatus?.isRunning}
                  variant="destructive"
                  className="flex-1"
                >
                  Stop All Emulators
                </Button>
                {emulatorStatus?.isRunning && (
                  <>
                    <Button
                      onClick={emulatorStatus.isPaused ? handleResumeEmulators : handlePauseEmulators}
                      variant="outline"
                      className="flex-1"
                    >
                      {emulatorStatus.isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  </>
                )}
              </div>

              {/* Status */}
              {emulatorStatus && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-gray-400">Total Vehicles</p>
                      <p className="text-sm font-bold text-blue-800">{emulatorStatus.stats.totalVehicles}</p>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-gray-400">Active</p>
                      <p className="text-sm font-bold text-green-600">{emulatorStatus.stats.activeVehicles}</p>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-gray-400">Events/sec</p>
                      <p className="text-sm font-bold text-purple-600">{emulatorStatus.stats.eventsPerSecond}</p>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-gray-400">Total Events</p>
                      <p className="text-sm font-bold text-orange-600">{emulatorStatus.stats.totalEvents.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Emulator Counts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(emulatorStatus.emulators).map(([type, count]) => (
                      <div key={type} className="p-3 border rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-gray-400 capitalize">{type}</p>
                        <p className="text-base font-semibold">{count} active</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Metrics
              </CardTitle>
              <CardDescription>
                Real-time system performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Memory Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Memory Usage</p>
                  <p className="text-sm text-gray-500">
                    {systemHealth?.memory.used}MB / {systemHealth?.memory.total}MB
                  </p>
                </div>
                <Progress value={systemHealth?.memory.percentage || 0} className="h-2" />
                <p className="text-sm text-gray-500 mt-1">
                  {systemHealth?.memory.percentage}% used
                </p>
              </div>

              {/* Emulator Breakdown */}
              {systemHealth?.emulators && (
                <div>
                  <p className="font-medium mb-3">Active Emulators</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(systemHealth.emulators)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm capitalize">{type}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
