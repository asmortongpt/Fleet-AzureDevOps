import { Speed, Timer, Storage, NetworkCheck } from '@mui/icons-material';
import {
  Box,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import React, { useMemo } from 'react';

interface Metrics {
  endpoints: {
    path: string;
    method: string;
    p50: number;
    p95: number;
    p99: number;
    requestCount: number;
    errorRate: number;
    lastHour: {
      requests: number;
      errors: number;
      avgResponseTime: number;
    };
  }[];
  throughput: {
    requestsPerMinute: number;
    requestsPerSecond: number;
    peakRPM: number;
    avgResponseTime: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
    avgLoadTime: number;
  };
  database?: {
    avgQueryTime: number;
    slowQueries: number;
    connectionPoolUsage: number;
    activeConnections: number;
    maxConnections: number;
  };
}

interface Props {
  metrics: Metrics | null;
  loading: boolean;
}

const PerformanceMetrics: React.FC<Props> = ({ metrics, loading }) => {
  // Calculate slowest endpoints
  const slowestEndpoints = useMemo(() => {
    if (!metrics?.endpoints) return [];
    return [...metrics.endpoints]
      .sort((a, b) => b.p95 - a.p95)
      .slice(0, 5);
  }, [metrics?.endpoints]);

  // Calculate highest error rate endpoints
  const errorProneEndpoints = useMemo(() => {
    if (!metrics?.endpoints) return [];
    return [...metrics.endpoints]
      .filter(e => e.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 3);
  }, [metrics?.endpoints]);

  const getPerformanceColor = (time: number): 'success' | 'primary' | 'warning' | 'error' => {
    if (time < 100) return 'success';
    if (time < 300) return 'primary';
    if (time < 1000) return 'warning';
    return 'error';
  };

  const formatTime = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.round(ms)}ms`;
  };

  if (loading && !metrics) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No performance data available
      </Typography>
    );
  }

  return (
    <Box>
      {/* Key Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Throughput */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <NetworkCheck color="primary" />
              <Typography variant="subtitle2">Throughput</Typography>
            </Box>
            <Typography variant="h4">
              {metrics.throughput?.requestsPerMinute || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              requests/minute
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">
                Peak: {metrics.throughput?.peakRPM || 0} RPM
              </Typography>
              <Typography variant="caption" display="block">
                Rate: {metrics.throughput?.requestsPerSecond?.toFixed(2) || 0} req/s
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Average Response Time */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Timer color="primary" />
              <Typography variant="subtitle2">Avg Response Time</Typography>
            </Box>
            <Typography variant="h4">
              {formatTime(metrics.throughput?.avgResponseTime || 0)}
            </Typography>
            <Chip
              size="small"
              label={metrics.throughput?.avgResponseTime < 200 ? 'Excellent' :
                     metrics.throughput?.avgResponseTime < 500 ? 'Good' :
                     metrics.throughput?.avgResponseTime < 1000 ? 'Fair' : 'Poor'}
              color={getPerformanceColor(metrics.throughput?.avgResponseTime || 0)}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>

        {/* Cache Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Storage color="primary" />
              <Typography variant="subtitle2">Cache Hit Rate</Typography>
            </Box>
            <Typography variant="h4">
              {((metrics.cache?.hitRate || 0) * 100).toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(metrics.cache?.hitRate || 0) * 100}
              color={metrics.cache?.hitRate > 0.8 ? 'success' :
                     metrics.cache?.hitRate > 0.6 ? 'warning' : 'error'}
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {metrics.cache?.totalHits || 0} hits / {metrics.cache?.totalMisses || 0} misses
            </Typography>
          </Paper>
        </Grid>

        {/* Database Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Speed color="primary" />
              <Typography variant="subtitle2">Database</Typography>
            </Box>
            <Typography variant="h4">
              {formatTime(metrics.database?.avgQueryTime || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              avg query time
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">
                Connections: {metrics.database?.activeConnections || 0}/{metrics.database?.maxConnections || 0}
              </Typography>
              <Typography variant="caption" display="block" color="warning.main">
                Slow queries: {metrics.database?.slowQueries || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Response Time Percentiles */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Response Time Percentiles (All Endpoints)
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={getPerformanceColor(150)}>
                {formatTime(150)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                p50 (median)
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={getPerformanceColor(450)}>
                {formatTime(450)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                p95
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={getPerformanceColor(800)}>
                {formatTime(800)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                p99
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Slowest Endpoints Table */}
      {slowestEndpoints.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Slowest Endpoints
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">p50</TableCell>
                  <TableCell align="right">p95</TableCell>
                  <TableCell align="right">p99</TableCell>
                  <TableCell align="right">Requests</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slowestEndpoints.map((endpoint, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="caption">
                        <Chip
                          label={endpoint.method}
                          size="small"
                          sx={{ mr: 1, fontSize: '0.7rem' }}
                        />
                        {endpoint.path}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatTime(endpoint.p50)}
                        size="small"
                        color={getPerformanceColor(endpoint.p50)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatTime(endpoint.p95)}
                        size="small"
                        color={getPerformanceColor(endpoint.p95)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatTime(endpoint.p99)}
                        size="small"
                        color={getPerformanceColor(endpoint.p99)}
                      />
                    </TableCell>
                    <TableCell align="right">{endpoint.requestCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Error-Prone Endpoints */}
      {errorProneEndpoints.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom color="error">
            Endpoints with Errors
          </Typography>
          {errorProneEndpoints.map((endpoint, idx) => (
            <Box
              key={idx}
              sx={{ p: 1, mb: 1, bgcolor: 'rgba(255,0,0,0.1)', borderRadius: 1 }}
            >
              <Typography variant="caption">
                <strong>{endpoint.method} {endpoint.path}</strong>
              </Typography>
              <Typography variant="caption" display="block" color="error">
                Error rate: {(endpoint.errorRate * 100).toFixed(2)}% ({endpoint.lastHour.errors} errors in last hour)
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PerformanceMetrics;