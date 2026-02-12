/**
 * Error Dashboard Component
 * Comprehensive error tracking and analytics dashboard
 *
 * @module components/admin/ErrorDashboard
 */

import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Info,
  Filter,
  Download,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import logger from '@/utils/logger';


interface ErrorSummary {
  total: number;
  last24h: number;
  last7d: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface ErrorEntry {
  id: string;
  message: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: number;
  count: number;
  affectedUsers: number;
  stack?: string;
  context?: Record<string, any>;
}

export function ErrorDashboard() {
  const [summary, setSummary] = useState<ErrorSummary | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [errorHistory, setErrorHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchErrorData();
    const interval = setInterval(fetchErrorData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  async function fetchErrorData() {
    setIsLoading(true);

    try {
      const response = await fetch('/api/monitoring/errors', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch errors (${response.status})`);
      }

      const payload = await response.json();
      const rawErrors = Array.isArray(payload) ? payload : (payload.data ?? []);
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };

      const grouped = new Map<string, {
        entry: ErrorEntry;
        users: Set<string>;
      }>();

      rawErrors.forEach((err: any) => {
        const statusCode = Number(err.statusCode) || 0;
        const severity: ErrorEntry['severity'] =
          statusCode >= 500 ? 'critical' : statusCode >= 400 ? 'medium' : 'low';
        const type = err.type || 'Error';
        const message = err.message || 'Unknown error';
        const key = `${type}|${message}`;

        byType[type] = (byType[type] || 0) + 1;
        bySeverity[severity] = (bySeverity[severity] || 0) + 1;

        if (!grouped.has(key)) {
          grouped.set(key, {
            entry: {
              id: err.id || key,
              message,
              type,
              severity,
              timestamp: err.timestamp || now,
              count: 1,
              affectedUsers: 0,
              stack: err.stack,
              context: err.context
            },
            users: new Set()
          });
        } else {
          grouped.get(key)!.entry.count += 1;
          grouped.get(key)!.entry.timestamp = Math.max(grouped.get(key)!.entry.timestamp, err.timestamp || 0);
        }

        if (err.userId) {
          grouped.get(key)!.users.add(err.userId);
        }
      });

      const entries = Array.from(grouped.values()).map(({ entry, users }) => ({
        ...entry,
        affectedUsers: users.size
      })).sort((a, b) => b.timestamp - a.timestamp);

      const last24h = rawErrors.filter((err: any) => (err.timestamp || 0) >= now - dayMs).length;
      const prev24h = rawErrors.filter((err: any) => (err.timestamp || 0) >= now - 2 * dayMs && (err.timestamp || 0) < now - dayMs).length;
      const last7d = rawErrors.filter((err: any) => (err.timestamp || 0) >= now - 7 * dayMs).length;

      let trend: ErrorSummary['trend'] = 'stable';
      let trendPercentage = 0;
      if (prev24h > 0) {
        trendPercentage = Math.abs(((last24h - prev24h) / prev24h) * 100);
        trend = last24h > prev24h ? 'up' : last24h < prev24h ? 'down' : 'stable';
      }

      const history: { date: string; errors: number; critical: number }[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const start = new Date(now - i * dayMs);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + dayMs);
        const dayErrors = rawErrors.filter((err: any) => {
          const ts = err.timestamp || 0;
          return ts >= start.getTime() && ts < end.getTime();
        });
        const criticalCount = dayErrors.filter((err: any) => (Number(err.statusCode) || 0) >= 500).length;
        history.push({
          date: start.toISOString().slice(0, 10),
          errors: dayErrors.length,
          critical: criticalCount
        });
      }

      setSummary({
        total: rawErrors.length,
        last24h,
        last7d,
        byType,
        bySeverity,
        trend,
        trendPercentage: Number(trendPercentage.toFixed(1))
      });
      setErrors(entries);
      setErrorHistory(history);
    } catch (error) {
      logger.error('Failed to fetch error data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function exportErrors() {
    const data = JSON.stringify(errors, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-blue-800 bg-blue-100 border-blue-300';
      default:
        return 'text-slate-700 bg-gray-100 border-gray-300';
    }
  }

  const filteredErrors = errors.filter((error) => {
    if (selectedSeverity !== 'all' && error.severity !== selectedSeverity) {
      return false;
    }
    if (selectedType !== 'all' && error.type !== selectedType) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-2">
      {/* Header */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="text-sm font-bold">Error Tracking</h2>
              <p className="text-sm text-muted-foreground">
                Real-time error monitoring and analytics
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportErrors}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={fetchErrorData} disabled={isLoading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="text-center p-2 border rounded-lg">
              <div className="text-sm font-bold text-red-600">{summary.total}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Errors</div>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className="text-sm font-bold">{summary.last24h}</div>
                {summary.trend === 'down' ? (
                  <TrendingDown className="h-6 w-6 text-green-500" />
                ) : summary.trend === 'up' ? (
                  <TrendingUp className="h-6 w-6 text-red-500" />
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Last 24 Hours
                {summary.trend !== 'stable' && (
                  <span
                    className={`ml-1 ${summary.trend === 'down' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {summary.trend === 'down' ? '↓' : '↑'}
                    {summary.trendPercentage}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <div className="text-sm font-bold">{summary.last7d}</div>
              <div className="text-sm text-muted-foreground mt-1">Last 7 Days</div>
            </div>
            <div className="text-center p-2 border rounded-lg">
              <div className="text-sm font-bold text-red-600">
                {summary.bySeverity.critical}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Critical Errors</div>
            </div>
          </div>
        )}
      </Card>

      {/* Error History Chart */}
      <Card className="p-3">
        <h3 className="text-sm font-semibold mb-2">Error Trend (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={errorHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="errors"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
              name="Total Errors"
            />
            <Area
              type="monotone"
              dataKey="critical"
              stroke="#dc2626"
              fill="#dc2626"
              fillOpacity={0.6}
              name="Critical"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Error Breakdown */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card className="p-3">
            <h3 className="text-sm font-semibold mb-2">Errors by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={Object.entries(summary.byType).map(([type, count]) => ({
                  type,
                  count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-3">
            <h3 className="text-sm font-semibold mb-2">Errors by Severity</h3>
            <div className="space-y-3">
              {Object.entries(summary.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(severity)}>
                      {severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm">{count} errors</span>
                  </div>
                  <Progress
                    value={(count / summary.total) * 100}
                    className="w-32"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-5 w-5" />
          <span className="font-semibold">Filters</span>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Types</option>
            {summary &&
              Object.keys(summary.byType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </select>
        </div>
      </Card>

      {/* Error List */}
      <Card className="p-3">
        <h3 className="text-sm font-semibold mb-2">Recent Errors</h3>
        <div className="space-y-3">
          {filteredErrors.length === 0 ? (
            <div className="text-center py-3 text-muted-foreground">
              <Info className="h-9 w-12 mx-auto mb-2 opacity-50" />
              <p>No errors match the current filters.</p>
            </div>
          ) : (
            filteredErrors.map((error) => (
              <div
                key={error.id}
                className="flex items-start justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {error.severity === 'critical' || error.severity === 'high' ? (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    )}
                    <span className="font-medium">{error.message}</span>
                    <Badge className={getSeverityColor(error.severity)}>
                      {error.severity}
                    </Badge>
                    <Badge variant="outline">{error.type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground ml-7 space-y-1">
                    <p>
                      Occurred {error.count} times • Affected {error.affectedUsers}{' '}
                      users
                    </p>
                    <p>{new Date(error.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
