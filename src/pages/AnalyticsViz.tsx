import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  timestamp: string;
  utilization: number;
  cost: number;
  maintenance: number;
  efficiency: number;
  events?: { label: string; impact: number }[];
}

interface CostBreakdown {
  category: string;
  value: number;
  percentage: number;
}

interface CostDriver {
  name: string;
  cost: number;
  delta: number;
}

interface AnalyticsResponse {
  utilizationTrend: AnalyticsData[];
  costBreakdown: CostBreakdown[];
  maintenanceForecast: { month: string; planned: number; target: number }[];
  efficiencyTrend: AnalyticsData[];
  topCostDrivers: CostDriver[];
}

const TIME_RANGES = [
  { label: '24h', value: '1d' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
] as const;

type TimeRange = typeof TIME_RANGES[number]['value'];

const AnalyticsViz: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics/overview?range=${timeRange}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result: AnalyticsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">Loading analytics data...</div>
    </div>
  );

  const renderError = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-destructive">Error: {error}</div>
    </div>
  );

  const CustomTooltip: React.FC<{ active: boolean; payload: any; label: string }> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-4 rounded-lg shadow-md border border-border">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} style={{ color: entry.stroke || entry.fill }}>
              {`${entry.dataKey}: ${entry.value.toFixed(2)}${entry.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (error) return renderError();
  if (loading || !data) return renderLoading();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics: What Changed and Why?</h1>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>How is fleet utilization trending?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.utilizationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="timestamp" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip content={<CustomTooltip active payload label />} />
                  <Line type="monotone" dataKey="utilization" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where are costs coming from?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                    labelLine={false}
                  >
                    {data.costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip active payload label />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What maintenance is upcoming?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.maintenanceForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip content={<CustomTooltip active payload label />} />
                  <Bar dataKey="planned" fill="#3b82f6" />
                  <Bar dataKey="target" fill="#10b981" opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>How has efficiency changed over time?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.efficiencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="timestamp" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip content={<CustomTooltip active payload label />} />
                  <Area type="monotone" dataKey="efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What are the top cost drivers?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCostDrivers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis dataKey="name" type="category" width={100} stroke="#888" />
                  <Tooltip content={<CustomTooltip active payload label />} />
                  <Bar dataKey="cost" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsViz;