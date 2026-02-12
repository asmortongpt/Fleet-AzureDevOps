import { Activity, AlertCircle, CheckCircle2, Database, Server, Zap } from 'lucide-react';
import React, { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'degraded' | 'warning' | 'critical';
  score: number; // 0-100
  lastCheck: string;
  responseTime?: number;
  errorRate?: number;
  status_details: string;
  icon: React.ReactNode;
}

interface SystemHealthProps {
  className?: string;
}

/**
 * SystemHealth Component
 *
 * PURPOSE: Display composite system health metrics
 *
 * HEALTH LEVELS:
 * - 95-100: Healthy (green)
 * - 80-94: Degraded (yellow)
 * - 50-79: Warning (orange)
 * - 0-49: Critical (red)
 */
export function SystemHealth({ className }: SystemHealthProps) {
  const [metrics, setMetrics] = React.useState<HealthMetric[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchHealthMetrics = async () => {
      try {
        // Fetch from multiple health endpoints in parallel
        const apiStart = Date.now();
        const [dashboardStats, systemHealth] = await Promise.all([
          fetch('/api/dashboard/stats', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
          fetch('/api/health', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        ]);
        const apiResponseTime = Date.now() - apiStart;

        const now = new Date().toISOString();
        const metricsData: HealthMetric[] = [];

        // Database Health
        if (systemHealth?.checks?.database) {
          const db = systemHealth.checks.database;
          const dbStatus = db.status === 'unhealthy' ? 'critical' : db.status === 'warning' ? 'degraded' : 'healthy';
          const responseTime = typeof db.latency === 'string' ? parseFloat(db.latency) : db.latency;
          metricsData.push({
            name: 'Database',
            status: dbStatus,
            score: dbStatus === 'healthy' ? 100 : dbStatus === 'degraded' ? 70 : 0,
            lastCheck: systemHealth.timestamp || now,
            responseTime: Number.isFinite(responseTime) ? responseTime : undefined,
            status_details: db.latency ? `Latency: ${db.latency}` : 'Latency unavailable',
            icon: <Database className="h-5 w-5" />
          });
        }

        // API Health
        if (dashboardStats) {
          metricsData.push({
            name: 'API',
            status: 'healthy',
            score: 100,
            lastCheck: now,
            responseTime: apiResponseTime,
            errorRate: 0,
            status_details: `Response: ${apiResponseTime}ms`,
            icon: <Server className="h-5 w-5" />
          });
        }

        if (systemHealth?.checks?.applicationInsights) {
          const ai = systemHealth.checks.applicationInsights;
          const aiStatus = ai.status === 'unhealthy' ? 'critical' : ai.status === 'warning' ? 'degraded' : 'healthy';
          metricsData.push({
            name: 'Integrations',
            status: aiStatus,
            score: aiStatus === 'healthy' ? 100 : aiStatus === 'degraded' ? 70 : 0,
            lastCheck: systemHealth.timestamp || now,
            status_details: ai.message || 'Integration status unavailable',
            icon: <Zap className="h-5 w-5" />
          });
        }

        if (systemHealth?.checks?.redis) {
          const redis = systemHealth.checks.redis;
          const cacheStatus = redis.status === 'unhealthy' ? 'critical' : redis.status === 'warning' ? 'degraded' : 'healthy';
          metricsData.push({
            name: 'Cache',
            status: cacheStatus,
            score: cacheStatus === 'healthy' ? 100 : cacheStatus === 'degraded' ? 70 : 0,
            lastCheck: systemHealth.timestamp || now,
            status_details: redis.latency ? `Latency: ${redis.latency}` : redis.message || 'Cache status unavailable',
            icon: <Activity className="h-5 w-5" />
          });
        }

        if (metricsData.length === 0) {
          metricsData.push({
            name: 'System',
            status: 'warning',
            score: 0,
            lastCheck: now,
            status_details: 'Health endpoints unavailable',
            icon: <AlertCircle className="h-5 w-5" />
          });
        }

        setMetrics(metricsData);
      } catch (error) {
        logger.error('Failed to fetch health metrics:', error);
        // Provide degraded state on error
        setMetrics([
          {
            name: 'System',
            status: 'warning',
            score: 60,
            lastCheck: new Date().toISOString(),
            status_details: 'Health check unavailable',
            icon: <AlertCircle className="h-5 w-5" />
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Calculate composite health score
  const compositeScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    const totalScore = metrics.reduce((sum, m) => sum + m.score, 0);
    return Math.round(totalScore / metrics.length);
  }, [metrics]);

  // Determine composite status based on score
  const compositeStatus = useMemo(() => {
    if (compositeScore >= 95) return 'healthy';
    if (compositeScore >= 80) return 'degraded';
    if (compositeScore >= 50) return 'warning';
    return 'critical';
  }, [compositeScore]);

  const statusConfig = {
    healthy: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-700',
      icon: <CheckCircle2 className="h-5 w-5" />
    },
    degraded: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: <AlertCircle className="h-5 w-5" />
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      icon: <AlertCircle className="h-5 w-5" />
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: <AlertCircle className="h-5 w-5" />
    }
  };

  const config = statusConfig[compositeStatus];

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Global System Health</span>
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', config.bg, config.border, 'border')}>
            {config.icon}
            <span className={cn('font-mono text-2xl font-bold', config.text)}>
              {compositeScore}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric) => {
          const metricConfig = statusConfig[metric.status];

          return (
            <div
              key={metric.name}
              className={cn(
                'p-4 rounded-lg border transition-all',
                metricConfig.bg,
                metricConfig.border
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={metricConfig.text}>
                    {metric.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{metric.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Last check: {new Date(metric.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('font-mono text-lg font-bold', metricConfig.text)}>
                    {metric.score}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">Status:</span>
                <span className={metricConfig.text}>{metric.status_details}</span>
              </div>

              {/* Visual score bar */}
              <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    metric.status === 'healthy' && 'bg-emerald-500',
                    metric.status === 'degraded' && 'bg-yellow-500',
                    metric.status === 'warning' && 'bg-orange-500',
                    metric.status === 'critical' && 'bg-red-500'
                  )}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-2 text-xs text-muted-foreground border-t">
          Health metrics from {metrics.length} system components
        </div>
      </CardContent>
    </Card>
  );
}
