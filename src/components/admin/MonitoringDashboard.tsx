import { Refresh, Assessment, Error, Warning, CheckCircle } from '@mui/icons-material';
import { Grid, Card, CardContent, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import apiClient from '../../lib/api-client';

import AlertsPanel from './AlertsPanel';
import EmulatorMonitor from './EmulatorMonitor';
import ErrorRateChart from './ErrorRateChart';
import PerformanceMetrics from './PerformanceMetrics';
import SystemHealthWidget from './SystemHealthWidget';

import logger from '@/utils/logger';

// Import proper interfaces from child components
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  version: string;
  timestamp: string;
  components: {
    api: { status: string; responseTime: number };
    emulators: { status: string; activeCount: number };
    database: { status: string; connectionPool: number };
  };
}

interface Metrics {
  requestsPerMinute: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
}

interface EmulatorGroup {
  name: string;
  type: string;
  instances: Array<{
    id: string;
    status: 'active' | 'inactive' | 'error';
    lastActivity: string;
    metrics: {
      messagesProcessed: number;
      errorCount: number;
      uptime: number;
    };
  }>;
}

interface Error {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Alert {
  id: string;
  timestamp: number;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
}

interface MonitoringData {
  health: SystemHealth | null;
  metrics: Metrics | null;
  emulators: EmulatorGroup | null;
  errors: Error[];
  alerts: Alert[];
}

const MonitoringDashboard: React.FC = () => {
  const [data, setData] = useState<MonitoringData>({
    health: null,
    metrics: null,
    emulators: null,
    errors: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);

      // Fetch all monitoring data in parallel
      const [healthRes, metricsRes, emulatorsRes, errorsRes, alertsRes] = await Promise.all([
        apiClient.get<SystemHealth>('/monitoring/health'),
        apiClient.get<Metrics>('/monitoring/metrics'),
        apiClient.get<EmulatorGroup>('/monitoring/emulators'),
        apiClient.get<Error[]>('/monitoring/errors'),
        apiClient.get<Alert[]>('/monitoring/alerts')
      ]);

      setData({
        health: healthRes?.data ?? null,
        metrics: metricsRes?.data ?? null,
        emulators: emulatorsRes?.data ?? null,
        errors: errorsRes?.data ?? [],
        alerts: alertsRes?.data ?? []
      });

      setLastRefresh(new Date());
    } catch (err) {
      logger.error('Failed to fetch monitoring data:', err);
      setError('Failed to fetch monitoring data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMonitoringData]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchMonitoringData();
  };

  const exportToCSV = () => {
    const csvContent = `Monitoring Report - ${new Date().toISOString()}\n\n` +
      `System Health: ${data.health?.status || 'Unknown'}\n` +
      `Uptime: ${data.health?.uptime || 0} seconds\n` +
      `API Response Time: ${data.health?.components?.api?.responseTime || 0}ms\n` +
      `Active Emulators: ${data.emulators?.active?.length || 0}\n` +
      `Total Errors: ${data.errors?.length || 0}\n` +
      `Active Alerts: ${data.alerts?.filter(a => a.status === 'active')?.length || 0}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monitoring-report-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && !data.health) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Assessment fontSize="large" color="primary" />
            <div>
              <Typography variant="h4">System Monitoring Dashboard</Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Typography>
            </div>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Typography>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Toggle
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              <Refresh /> Refresh Now
            </button>
            <button
              onClick={exportToCSV}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Export CSV
            </button>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Dashboard Grid */}
      <Grid container spacing={3}>
        {/* System Health - Full Width */}
        <Grid size={{ xs: 12 }}>
          <SystemHealthWidget
            health={data.health}
            loading={loading}
          />
        </Grid>

        {/* Performance Metrics - Half Width */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <PerformanceMetrics
                metrics={data.metrics}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Error Rate Chart - Half Width */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate Analysis
              </Typography>
              <ErrorRateChart
                errors={data.errors}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Emulator Monitor - Full Width */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emulator Status
              </Typography>
              <EmulatorMonitor
                emulators={data.emulators}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts Panel - Full Width */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Alerts & Warnings
              </Typography>
              <AlertsPanel
                alerts={data.alerts}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CheckCircle color="success" />
                <Typography variant="h6">
                  {data.health?.status === 'healthy' ? '100%' :
                   data.health?.status === 'degraded' ? '75%' : '0%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System Health
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Assessment color="primary" />
                <Typography variant="h6">
                  {data.metrics?.requestsPerMinute || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requests/min
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Error color="error" />
                <Typography variant="h6">
                  {data.errors?.filter(e => e.timestamp && e.timestamp > Date.now() - 3600000).length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Errors (1h)
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Warning color="warning" />
                <Typography variant="h6">
                  {data.alerts?.filter(a => a.status === 'active').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Alerts
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonitoringDashboard;