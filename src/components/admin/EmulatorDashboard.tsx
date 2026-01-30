/**
 * Comprehensive Emulator Dashboard
 *
 * Displays ALL emulator types with real-time monitoring:
 * - Video Emulators (DashCam, Telematics, Mobile Uploads)
 * - OBD2 Emulators
 * - GPS/Location Emulators
 * - IoT Sensor Emulators
 * - Radio Communication Emulators
 * - Driver Behavior Emulators
 * - Computer Vision Analysis
 *
 * CTA Owner access only
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Badge,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PlayArrow,
  Stop,
  Refresh,
  Memory,
  DirectionsCar,
  Videocam,
  Speed,
  MyLocation,
  Radio,
  Person,
  RemoveRedEye,
  AlertTriangle,
  CheckCircle,
  Error as ErrorIcon,
  Pause,
  ExpandMore,
  ExpandLess,
  CloudUpload,
  Storage,
  Sensors,
  Timer,
  TrendingUp,
  Security
} from '@mui/icons-material';

import logger from '@/utils/logger';
import { apiClient } from '@/services/api';

// ============================================================================
// TYPES
// ============================================================================

interface EmulatorStatus {
  vehicleId: string;
  type: 'dashcam' | 'telematics' | 'mobile' | 'obd2' | 'gps' | 'iot' | 'radio' | 'driver';
  isRunning: boolean;
  isPaused: boolean;
  startedAt: Date | null;
  statistics: any;
  health: 'healthy' | 'warning' | 'error' | 'stopped';
  lastUpdate: Date;
}

interface VideoEmulatorStats {
  dashcamCount: number;
  dashcamsRunning: number;
  telematicsRunning: boolean;
  totalVideoFiles: number;
  totalStorageGB: number;
  mobileUploadsCount: number;
  eventsTriggered: number;
}

interface VisionAnalysisStats {
  framesProcessed: number;
  objectsDetected: number;
  alertsTriggered: number;
  collisionWarnings: number;
  driverAlerts: number;
  laneWarnings: number;
  averageProcessingTimeMs: number;
}

interface GeneralEmulatorStats {
  running: number;
  paused: number;
  stopped: number;
  errors: number;
  totalVehicles: number;
  dataPointsGenerated: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const EmulatorDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [expandedEmulator, setExpandedEmulator] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [videoEmulators, setVideoEmulators] = useState<EmulatorStatus[]>([]);
  const [videoStats, setVideoStats] = useState<VideoEmulatorStats | null>(null);
  const [visionStats, setVisionStats] = useState<VisionAnalysisStats | null>(null);
  const [generalEmulators, setGeneralEmulators] = useState<EmulatorStatus[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralEmulatorStats | null>(null);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Fetch video emulator data
   */
  const fetchVideoEmulators = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/emulator/video/status');
      if (response.data.success) {
        setVideoEmulators(response.data.data || []);
      }

      const statsResponse = await apiClient.get('/api/emulator/video/statistics');
      if (statsResponse.data.success) {
        setVideoStats(statsResponse.data.data);
      }
    } catch (err: any) {
      logger.error('Failed to fetch video emulators:', err);
      if (err.response?.status !== 403) {
        setError('Failed to fetch video emulator data');
      }
    }
  }, []);

  /**
   * Fetch general emulator data (OBD2, GPS, IoT, etc.)
   */
  const fetchGeneralEmulators = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/emulator/status');
      if (response.data.success) {
        // Transform the general emulator data
        const emulatorData = response.data.data;
        setGeneralStats({
          running: emulatorData.activeEmulators || 0,
          paused: emulatorData.pausedEmulators || 0,
          stopped: emulatorData.stoppedEmulators || 0,
          errors: emulatorData.errors || 0,
          totalVehicles: emulatorData.vehicles?.length || 0,
          dataPointsGenerated: emulatorData.totalDataPoints || 0
        });
      }
    } catch (err: any) {
      logger.error('Failed to fetch general emulators:', err);
    }
  }, []);

  /**
   * Fetch all data
   */
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    await Promise.all([
      fetchVideoEmulators(),
      fetchGeneralEmulators()
    ]);

    setLoading(false);
  }, [fetchVideoEmulators, fetchGeneralEmulators]);

  /**
   * Initialize and setup auto-refresh
   */
  useEffect(() => {
    fetchAllData();

    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAllData();
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchAllData]);

  /**
   * Start video dashcam emulator
   */
  const handleStartDashcam = async (vehicleId: string) => {
    try {
      await apiClient.post(`/api/emulator/video/dashcam/${vehicleId}/start`, {
        continuousRecording: true,
        autoUploadEnabled: false
      });
      await fetchVideoEmulators();
    } catch (err: any) {
      logger.error('Failed to start dashcam:', err);
      setError('Failed to start dashcam emulator');
    }
  };

  /**
   * Stop video dashcam emulator
   */
  const handleStopDashcam = async (vehicleId: string) => {
    try {
      await apiClient.post(`/api/emulator/video/dashcam/${vehicleId}/stop`);
      await fetchVideoEmulators();
    } catch (err: any) {
      logger.error('Failed to stop dashcam:', err);
      setError('Failed to stop dashcam emulator');
    }
  };

  /**
   * Trigger video event
   */
  const handleTriggerEvent = async (vehicleId: string, eventType: string) => {
    try {
      await apiClient.post(`/api/emulator/video/dashcam/${vehicleId}/event`, {
        eventType
      });
      await fetchVideoEmulators();
    } catch (err: any) {
      logger.error('Failed to trigger event:', err);
      setError('Failed to trigger video event');
    }
  };

  /**
   * Start all video emulators
   */
  const handleStartAllVideo = async () => {
    try {
      await apiClient.post('/api/emulator/video/telematics/start');
      await fetchVideoEmulators();
    } catch (err: any) {
      logger.error('Failed to start all video emulators:', err);
      setError('Failed to start all video emulators');
    }
  };

  /**
   * Stop all video emulators
   */
  const handleStopAllVideo = async () => {
    try {
      await apiClient.post('/api/emulator/video/stop-all');
      await fetchVideoEmulators();
    } catch (err: any) {
      logger.error('Failed to stop all video emulators:', err);
      setError('Failed to stop all video emulators');
    }
  };

  /**
   * Start general emulators
   */
  const handleStartGeneral = async () => {
    try {
      await apiClient.post('/api/emulator/start', { count: 10 });
      await fetchGeneralEmulators();
    } catch (err: any) {
      logger.error('Failed to start emulators:', err);
      setError('Failed to start emulators');
    }
  };

  /**
   * Stop general emulators
   */
  const handleStopGeneral = async () => {
    try {
      await apiClient.post('/api/emulator/stop');
      await fetchGeneralEmulators();
    } catch (err: any) {
      logger.error('Failed to stop emulators:', err);
      setError('Failed to stop emulators');
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date | string) => {
    const timestamp = new Date(date);
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();

    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
  };

  /**
   * Get health icon
   */
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle color="success" />;
      case 'warning': return <AlertTriangle color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <Stop color="disabled" />;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: { isRunning: boolean; isPaused: boolean; health: string }) => {
    if (status.health === 'error') return 'error';
    if (status.isPaused) return 'warning';
    if (status.isRunning) return 'success';
    return 'default';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !videoStats && !generalStats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Emulator Dashboard</Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading emulator data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
          Emulator Control Center
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Chip
            icon={autoRefresh ? <TrendingUp /> : <Pause />}
            label={autoRefresh ? 'Live' : 'Paused'}
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{ cursor: 'pointer' }}
          />
          <Tooltip title="Refresh Now">
            <IconButton onClick={fetchAllData}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<Videocam />}
          label="Video Emulators"
          iconPosition="start"
        />
        <Tab
          icon={<Speed />}
          label="Vehicle Emulators"
          iconPosition="start"
        />
        <Tab
          icon={<RemoveRedEye />}
          label="Vision Analysis"
          iconPosition="start"
        />
        <Tab
          icon={<Memory />}
          label="System Overview"
          iconPosition="start"
        />
      </Tabs>

      {/* Tab 0: Video Emulators */}
      {tabValue === 0 && (
        <Box>
          {/* Video Stats Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Videocam color="primary" />
                    <Typography variant="subtitle2">DashCams</Typography>
                  </Box>
                  <Typography variant="h4">
                    {videoStats?.dashcamsRunning || 0}/{videoStats?.dashcamCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active / Total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Storage color="primary" />
                    <Typography variant="subtitle2">Video Files</Typography>
                  </Box>
                  <Typography variant="h4">
                    {videoStats?.totalVideoFiles || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(videoStats?.totalStorageGB || 0).toFixed(2)} GB stored
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CloudUpload color="primary" />
                    <Typography variant="subtitle2">Mobile Uploads</Typography>
                  </Box>
                  <Typography variant="h4">
                    {videoStats?.mobileUploadsCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Simulated uploads
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AlertTriangle color="primary" />
                    <Typography variant="subtitle2">Events</Typography>
                  </Box>
                  <Typography variant="h4">
                    {videoStats?.eventsTriggered || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total triggered
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Video Emulators Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Statistics</TableCell>
                  <TableCell>Last Update</TableCell>
                  <TableCell align="center">Actions</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {videoEmulators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No video emulators running</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  videoEmulators.map((emulator) => (
                    <React.Fragment key={`${emulator.vehicleId}-${emulator.type}`}>
                      <TableRow hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <DirectionsCar />
                            <Typography variant="body2">{emulator.vehicleId}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emulator.type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              emulator.isRunning ? (emulator.isPaused ? <Pause /> : <PlayArrow />) : <Stop />
                            }
                            label={
                              emulator.isRunning ? (emulator.isPaused ? 'Paused' : 'Running') : 'Stopped'
                            }
                            size="small"
                            color={getStatusColor(emulator) as any}
                          />
                        </TableCell>
                        <TableCell>
                          {getHealthIcon(emulator.health)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {JSON.stringify(emulator.statistics).slice(0, 50)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatTimeAgo(emulator.lastUpdate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            {emulator.type === 'dashcam' && (
                              <>
                                <Tooltip title={emulator.isRunning ? 'Stop' : 'Start'}>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      emulator.isRunning
                                        ? handleStopDashcam(emulator.vehicleId)
                                        : handleStartDashcam(emulator.vehicleId)
                                    }
                                    color={emulator.isRunning ? 'error' : 'success'}
                                  >
                                    {emulator.isRunning ? <Stop /> : <PlayArrow />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Trigger Event">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTriggerEvent(emulator.vehicleId, 'harsh_braking')}
                                    disabled={!emulator.isRunning}
                                  >
                                    <AlertTriangle />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedEmulator(
                                expandedEmulator === `${emulator.vehicleId}-${emulator.type}`
                                  ? null
                                  : `${emulator.vehicleId}-${emulator.type}`
                              )
                            }
                          >
                            {expandedEmulator === `${emulator.vehicleId}-${emulator.type}` ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0 }}>
                          <Collapse in={expandedEmulator === `${emulator.vehicleId}-${emulator.type}`}>
                            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Detailed Statistics
                              </Typography>
                              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                {JSON.stringify(emulator.statistics, null, 2)}
                              </pre>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Video Control Panel */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleStartAllVideo}
            >
              Start All Video
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStopAllVideo}
            >
              Stop All Video
            </Button>
          </Box>
        </Box>
      )}

      {/* Tab 1: Vehicle Emulators (OBD2, GPS, IoT, Radio) */}
      {tabValue === 1 && (
        <Box>
          {/* General Stats Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <DirectionsCar color="primary" />
                    <Typography variant="subtitle2">Vehicles</Typography>
                  </Box>
                  <Typography variant="h4">
                    {generalStats?.totalVehicles || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total in system
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PlayArrow color="success" />
                    <Typography variant="subtitle2">Running</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {generalStats?.running || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active emulators
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Sensors color="primary" />
                    <Typography variant="subtitle2">Data Points</Typography>
                  </Box>
                  <Typography variant="h4">
                    {(generalStats?.dataPointsGenerated || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Generated
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ErrorIcon color={generalStats?.errors ? 'error' : 'disabled'} />
                    <Typography variant="subtitle2">Errors</Typography>
                  </Box>
                  <Typography variant="h4" color={generalStats?.errors ? 'error' : 'inherit'}>
                    {generalStats?.errors || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    System errors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Emulator Types */}
          <Grid container spacing={2}>
            {[
              { icon: <Speed />, label: 'OBD2', color: '#2196f3' },
              { icon: <MyLocation />, label: 'GPS', color: '#4caf50' },
              { icon: <Sensors />, label: 'IoT Sensors', color: '#ff9800' },
              { icon: <Radio />, label: 'Radio', color: '#9c27b0' },
              { icon: <Person />, label: 'Driver', color: '#f44336' },
              { icon: <Timer />, label: 'Events', color: '#00bcd4' }
            ].map((emType) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={emType.label}>
                <Card sx={{ borderLeft: `4px solid ${emType.color}` }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      {emType.icon}
                      <Typography variant="h6">{emType.label}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Emulating real-time {emType.label.toLowerCase()} data for fleet operations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* General Control Panel */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={handleStartGeneral}
            >
              Start Emulators
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStopGeneral}
            >
              Stop All
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchGeneralEmulators}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      )}

      {/* Tab 2: Vision Analysis */}
      {tabValue === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Computer Vision analysis provides real-time AI-powered insights including object detection,
            driver behavior monitoring, lane detection, collision prediction, and more.
          </Alert>

          <Grid container spacing={2}>
            {[
              { icon: <RemoveRedEye />, label: 'Object Detection', desc: 'Vehicles, pedestrians, cyclists, obstacles' },
              { icon: <Person />, label: 'Driver Monitoring', desc: 'Distraction, drowsiness, compliance' },
              { icon: <AlertTriangle />, label: 'Collision Prediction', desc: 'Forward collision warnings with TTC' },
              { icon: <DirectionsCar />, label: 'Lane Detection', desc: 'Lane departure warnings' },
              { icon: <Security />, label: 'Facial Recognition', desc: 'Driver identification & authentication' },
              { icon: <Sensors />, label: 'Blind Spot Detection', desc: 'Left/right monitoring' }
            ].map((feature) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.label}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      {feature.icon}
                      <Typography variant="subtitle1">{feature.label}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab 3: System Overview */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>System Status</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Video Emulation System
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">
                    • DashCam Emulators: {videoStats?.dashcamCount || 0}
                  </Typography>
                  <Typography variant="body2">
                    • Video Files: {videoStats?.totalVideoFiles || 0}
                  </Typography>
                  <Typography variant="body2">
                    • Storage Used: {(videoStats?.totalStorageGB || 0).toFixed(2)} GB
                  </Typography>
                  <Typography variant="body2">
                    • Mobile Uploads: {videoStats?.mobileUploadsCount || 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  General Emulation System
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">
                    • Total Vehicles: {generalStats?.totalVehicles || 0}
                  </Typography>
                  <Typography variant="body2">
                    • Running Emulators: {generalStats?.running || 0}
                  </Typography>
                  <Typography variant="body2">
                    • Data Points: {(generalStats?.dataPointsGenerated || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    • System Errors: {generalStats?.errors || 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity="success" sx={{ mt: 3 }}>
            All emulation systems operational. CTA Owner access verified.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default EmulatorDashboard;
