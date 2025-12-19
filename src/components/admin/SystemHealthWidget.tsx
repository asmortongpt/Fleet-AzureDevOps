import { CheckCircle, Warning, Error, HourglassEmpty } from '@mui/icons-material';
import { Box, Grid, Paper, Typography, LinearProgress, Chip, CircularProgress } from '@mui/material';
import React, { useMemo } from 'react';

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

interface Props {
  health: SystemHealth | null;
  loading: boolean;
}

const SystemHealthWidget: React.FC<Props> = ({ health, loading }) => {
  const statusIcon = useMemo(() => {
    if (!health) return <HourglassEmpty color="disabled" />;

    switch (health.status) {
      case 'healthy':
        return <CheckCircle color="success" sx={{ fontSize: 40 }} />;
      case 'degraded':
        return <Warning color="warning" sx={{ fontSize: 40 }} />;
      case 'down':
        return <Error color="error" sx={{ fontSize: 40 }} />;
      default:
        return <HourglassEmpty color="disabled" sx={{ fontSize: 40 }} />;
    }
  }, [health]);

  const statusColor = useMemo(() => {
    if (!health) return 'default';
    switch (health?.status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'error';
      default: return 'default';
    }
  }, [health]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const calculateAvailability = () => {
    if (!health) return 0;
    // Simple calculation based on status
    switch (health.status) {
      case 'healthy': return 100;
      case 'degraded': return 75;
      case 'down': return 0;
      default: return 0;
    }
  };

  if (loading && !health) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (!health) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">No health data available</Typography>
      </Paper>
    );
  }

  const availability = calculateAvailability();

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Main Status */}
        <Grid item xs={12} md={3}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            {statusIcon}
            <Chip
              label={health.status.toUpperCase()}
              color={statusColor as any}
              size="large"
              sx={{ fontWeight: 'bold' }}
            />
            <Typography variant="body2" color="text.secondary">
              System Status
            </Typography>
          </Box>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {/* Availability */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Availability
                </Typography>
                <Typography variant="h4">
                  {availability.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={availability}
                  color={statusColor as any}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>

            {/* Uptime */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Uptime
                </Typography>
                <Typography variant="h4">
                  {formatUptime(health.uptime || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Since last restart
                </Typography>
              </Box>
            </Grid>

            {/* Response Time */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Avg Response Time
                </Typography>
                <Typography variant="h4">
                  {health.components?.api?.responseTime || 0}ms
                </Typography>
                <Chip
                  size="small"
                  label={health.components?.api?.responseTime < 200 ? 'Fast' :
                         health.components?.api?.responseTime < 500 ? 'Normal' : 'Slow'}
                  color={health.components?.api?.responseTime < 200 ? 'success' :
                         health.components?.api?.responseTime < 500 ? 'default' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            {/* Component Status */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Component Status
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* API Status */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">API Service</Typography>
                      <Chip
                        size="small"
                        label={health.components?.api?.status || 'Unknown'}
                        color={health.components?.api?.status === 'healthy' ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Response: {health.components?.api?.responseTime || 0}ms
                    </Typography>
                  </Paper>
                </Grid>

                {/* Emulators Status */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Emulators</Typography>
                      <Chip
                        size="small"
                        label={health.components?.emulators?.status || 'Unknown'}
                        color={health.components?.emulators?.status === 'healthy' ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Active: {health.components?.emulators?.activeCount || 0}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Database Status */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Database</Typography>
                      <Chip
                        size="small"
                        label={health.components?.database?.status || 'Unknown'}
                        color={health.components?.database?.status === 'healthy' ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Connections: {health.components?.database?.connectionPool || 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* System Info */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Version: {health.version || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last Check: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Never'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SystemHealthWidget;