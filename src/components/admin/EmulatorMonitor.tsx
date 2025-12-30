import {
  PlayArrow,
  Stop,
  Refresh,
  Memory,
  Update,
  DirectionsCar,
  Person,
  LocalGasStation,
  Build,
  MyLocation,
  Route,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
  Pause
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Button,
  Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useState, useMemo } from 'react';

import logger from '@/utils/logger';

interface EmulatorData {
  id: string;
  name: string;
  type: 'vehicle' | 'driver' | 'fuel' | 'maintenance' | 'gps' | 'route' | 'cost';
  status: 'running' | 'stopped' | 'paused' | 'error';
  recordCount: number;
  updateFrequency: number; // in seconds
  lastUpdate: string;
  memoryUsage?: number; // in MB
  cpuUsage?: number; // percentage
  errorCount?: number;
  config?: {
    autoGenerate: boolean;
    batchSize: number;
    interval: number;
  };
}

interface EmulatorGroup {
  active: EmulatorData[];
  inactive: EmulatorData[];
  statistics: {
    totalRecords: number;
    totalMemory: number;
    avgUpdateFrequency: number;
    errorRate: number;
  };
}

interface Props {
  emulators: EmulatorGroup | null;
  loading: boolean;
}

const EmulatorMonitor: React.FC<Props> = ({ emulators, loading }) => {
  const [expandedEmulator, setExpandedEmulator] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  const emulatorIcons = {
    vehicle: <DirectionsCar />,
    driver: <Person />,
    fuel: <LocalGasStation />,
    maintenance: <Build />,
    gps: <MyLocation />,
    route: <Route />,
    cost: <AttachMoney />
  };

  const statusColors = {
    running: 'success',
    stopped: 'default',
    paused: 'warning',
    error: 'error'
  } as const;

  // Combine active and inactive emulators
  const allEmulators = useMemo(() => {
    if (!emulators) return [];
    return [...(emulators.active || []), ...(emulators.inactive || [])];
  }, [emulators]);

  // Filter emulators by type
  const filteredEmulators = useMemo(() => {
    if (selectedType === 'all') return allEmulators;
    return allEmulators.filter(e => e.type === selectedType);
  }, [allEmulators, selectedType]);

  // Group emulators by type for summary
  const emulatorsByType = useMemo(() => {
    const grouped: Record<string, { total: number; running: number; records: number }> = {};
    allEmulators.forEach(emulator => {
      if (!grouped[emulator.type]) {
        grouped[emulator.type] = { total: 0, running: 0, records: 0 };
      }
      grouped[emulator.type].total++;
      if (emulator.status === 'running') grouped[emulator.type].running++;
      grouped[emulator.type].records += emulator.recordCount || 0;
    });
    return grouped;
  }, [allEmulators]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const handleToggleEmulator = (emulatorId: string) => {
    // This would call an API to start/stop the emulator
    logger.debug('Toggle emulator:', emulatorId);
  };

  const handleRefreshEmulator = (emulatorId: string) => {
    // This would call an API to refresh the emulator
    logger.debug('Refresh emulator:', emulatorId);
  };

  if (loading && !emulators) {
    return <Box sx={{ p: 2 }}>Loading emulator data...</Box>;
  }

  if (!emulators || allEmulators.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No emulators configured</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(emulatorsByType).map(([type, stats]) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={type}>
            <Card
              sx={{
                cursor: 'pointer',
                bgcolor: selectedType === type ? 'primary.main' : 'background.paper',
                color: selectedType === type ? 'primary.contrastText' : 'text.primary',
                transition: 'all 0.3s'
              }}
              onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    {emulatorIcons[type as keyof typeof emulatorIcons]}
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {type}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${stats.running}/${stats.total}`}
                    size="small"
                    color={stats.running > 0 ? 'success' : 'default'}
                  />
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {stats.records.toLocaleString()}
                </Typography>
                <Typography variant="caption">
                  records generated
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Overall Statistics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 3 }}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">
                {emulators.statistics?.totalRecords.toLocaleString() ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Records
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Box textAlign="center">
              <Typography variant="h5" color="success.main">
                {emulators.active?.length ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Emulators
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Box textAlign="center">
              <Typography variant="h5">
                {emulators.statistics?.totalMemory ?? 0} MB
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Memory Usage
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 3 }}>
            <Box textAlign="center">
              <Typography variant="h5" color={emulators.statistics?.errorRate > 5 ? 'error' : 'text.primary'}>
                {(emulators.statistics?.errorRate ?? 0).toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Error Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Emulator Details Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Emulator</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Records</TableCell>
              <TableCell align="right">Update Freq</TableCell>
              <TableCell align="right">Memory</TableCell>
              <TableCell>Last Update</TableCell>
              <TableCell align="center">Actions</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmulators.map((emulator) => (
              <React.Fragment key={emulator.id}>
                <TableRow hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {emulatorIcons[emulator.type]}
                      <Typography variant="body2">
                        {emulator.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        emulator.status === 'running' ? <CheckCircle /> :
                        emulator.status === 'paused' ? <Pause /> :
                        emulator.status === 'error' ? <Error /> :
                        <Stop />
                      }
                      label={emulator.status}
                      size="small"
                      color={statusColors[emulator.status]}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {emulator.recordCount.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {emulator.updateFrequency}s
                  </TableCell>
                  <TableCell align="right">
                    {emulator.memoryUsage ? (
                      <Box>
                        <Typography variant="caption">
                          {emulator.memoryUsage} MB
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((emulator.memoryUsage / 100) * 100, 100)}
                          sx={{ mt: 0.5, height: 4 }}
                          color={emulator.memoryUsage > 80 ? 'error' : 'primary'}
                        />
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatTime(emulator.lastUpdate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={0.5}>
                      <Tooltip title={emulator.status === 'running' ? 'Stop' : 'Start'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleEmulator(emulator.id)}
                          color={emulator.status === 'running' ? 'error' : 'success'}
                        >
                          {emulator.status === 'running' ? <Stop /> : <PlayArrow />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refresh">
                        <IconButton
                          size="small"
                          onClick={() => handleRefreshEmulator(emulator.id)}
                          disabled={emulator.status !== 'running'}
                        >
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setExpandedEmulator(
                        expandedEmulator === emulator.id ? null : emulator.id
                      )}
                    >
                      {expandedEmulator === emulator.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* Expanded Details */}
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 0 }}>
                    <Collapse in={expandedEmulator === emulator.id}>
                      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary">
                              Configuration
                            </Typography>
                            <Typography variant="body2">
                              Auto-generate: {emulator.config?.autoGenerate ? 'Yes' : 'No'}
                            </Typography>
                            <Typography variant="body2">
                              Batch size: {emulator.config?.batchSize ?? 10}
                            </Typography>
                            <Typography variant="body2">
                              Interval: {emulator.config?.interval ?? 60}s
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption" color="text.secondary">
                              Performance
                            </Typography>
                            <Typography variant="body2">
                              CPU Usage: {emulator.cpuUsage ?? 0}%
                            </Typography>
                            <Typography variant="body2">
                              Error Count: {emulator.errorCount ?? 0}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Box display="flex" gap={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Update />}
                              >
                                Reset
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Memory />}
                              >
                                Clear Cache
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Control Panel */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
          >
            Start All
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Stop />}
          >
            Stop All
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
          >
            Refresh All
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Emulator Monitor
        </Typography>
      </Box>
    </Box>
  );
};

export default EmulatorMonitor;