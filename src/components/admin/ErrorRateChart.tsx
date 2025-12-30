import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Chip, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Error {
  id: string;
  endpoint: string;
  type: string;
  message: string;
  timestamp: number;
  statusCode?: number;
  userId?: string;
  stackTrace?: string;
}

interface Props {
  errors: Error[];
  loading: boolean;
}

const ErrorRateChart: React.FC<Props> = ({ errors = [], loading }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [filterEndpoint, setFilterEndpoint] = useState<string>('all');

  // Filter errors by time range
  const filteredErrors = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    };
    const cutoff = now - ranges[timeRange];

    let filtered = errors.filter(e => e.timestamp > cutoff);

    if (filterEndpoint !== 'all') {
      filtered = filtered.filter(e => e.endpoint === filterEndpoint);
    }

    return filtered;
  }, [errors, timeRange, filterEndpoint]);

  // Get unique endpoints for filter
  const endpoints = useMemo(() => {
    const uniqueEndpoints = [...new Set(errors.map(e => e.endpoint))];
    return uniqueEndpoints.filter(Boolean).sort();
  }, [errors]);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!filteredErrors || filteredErrors.length === 0) return [];

    // Group errors by time intervals
    const intervals = timeRange === '1h' ? 12 : // 5-minute intervals
                      timeRange === '24h' ? 24 : // 1-hour intervals
                      timeRange === '7d' ? 7 : // 1-day intervals
                      30; // 1-day intervals

    const now = Date.now();
    const intervalMs = {
      '1h': 300000, // 5 minutes
      '24h': 3600000, // 1 hour
      '7d': 86400000, // 1 day
      '30d': 86400000 // 1 day
    }[timeRange];

    const data: Array<{ time: string; errors: number; unique: number }> = [];
    for (let i = intervals - 1; i >= 0; i--) {
      const startTime = now - (i + 1) * intervalMs;
      const endTime = now - i * intervalMs;
      const errorsInInterval = filteredErrors.filter(
        e => e.timestamp >= startTime && e.timestamp < endTime
      );

      const label = timeRange === '1h' ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                    timeRange === '24h' ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                    new Date(endTime).toLocaleDateString([], { month: 'short', day: 'numeric' });

      data.push({
        time: label,
        errors: errorsInInterval.length,
        unique: new Set(errorsInInterval.map(e => e.type)).size
      });
    }

    return data;
  }, [filteredErrors, timeRange]);

  // Process data for pie chart (error types)
  const pieData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    filteredErrors.forEach(error => {
      const type = error.type || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount).map(([type, count]) => ({
      name: type,
      value: count
    }));
  }, [filteredErrors]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return 'flat';
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.errors, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.errors, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'flat';
  }, [chartData]);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6C5CE7'];

  if (loading) {
    return <Box sx={{ p: 2 }}>Loading error data...</Box>;
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_event, value) => value && setChartType(value)}
            size="small"
          >
            <ToggleButton value="line">Line</ToggleButton>
            <ToggleButton value="bar">Bar</ToggleButton>
            <ToggleButton value="pie">Pie</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_event, value) => value && setTimeRange(value)}
            size="small"
          >
            <ToggleButton value="1h">1H</ToggleButton>
            <ToggleButton value="24h">24H</ToggleButton>
            <ToggleButton value="7d">7D</ToggleButton>
            <ToggleButton value="30d">30D</ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Endpoint</InputLabel>
            <Select
              value={filterEndpoint}
              label="Endpoint"
              onChange={(e) => setFilterEndpoint(e.target.value as string)}
            >
              <MenuItem value="all">All Endpoints</MenuItem>
              {endpoints.map(endpoint => (
                <MenuItem key={endpoint} value={endpoint}>{endpoint}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box display="flex" gap={1} alignItems="center">
          {trend === 'up' && <Chip icon={<TrendingUp />} label="Increasing" color="error" size="small" />}
          {trend === 'down' && <Chip icon={<TrendingDown />} label="Decreasing" color="success" size="small" />}
          {trend === 'flat' && <Chip icon={<TrendingFlat />} label="Stable" color="default" size="small" />}
          <Typography variant="body2" color="text.secondary">
            Total: {filteredErrors.length} errors
          </Typography>
        </Box>
      </Box>

      {/* Chart */}
      {chartType === 'pie' ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="#FF6B6B"
                strokeWidth={2}
                name="Error Count"
              />
              <Line
                type="monotone"
                dataKey="unique"
                stroke="#4ECDC4"
                strokeWidth={2}
                name="Unique Types"
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="errors" fill="#FF6B6B" name="Error Count" />
              <Bar dataKey="unique" fill="#4ECDC4" name="Unique Types" />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}

      {/* Error Summary */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              {filteredErrors.filter(e => e.statusCode && e.statusCode >= 500).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Server Errors (5xx)
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {filteredErrors.filter(e => e.statusCode && e.statusCode >= 400 && e.statusCode < 500).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Client Errors (4xx)
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {new Set(filteredErrors.map(e => e.endpoint)).size}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Affected Endpoints
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Most Recent Errors */}
      {filteredErrors.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Most Recent Errors
          </Typography>
          {filteredErrors.slice(0, 3).map(error => (
            <Box key={error.id} sx={{ p: 1, mb: 1, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" component="div">
                <strong>{error.type}</strong> at {error.endpoint}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(error.timestamp).toLocaleString()} - {error.message}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ErrorRateChart;