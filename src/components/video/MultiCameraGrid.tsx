/**
 * Multi-Camera Grid View Component
 *
 * Displays multiple camera feeds simultaneously in a grid layout:
 * - 2x2 grid for 4 cameras (forward, rear, driver, cabin)
 * - 3x2 grid for 6 cameras (adds side cameras)
 * - Synchronized playback controls
 * - Individual camera selection/focus
 * - Computer vision overlays on all feeds
 */

import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Videocam,
  RemoveRedEye,
  GridView,
  ViewModule,
  Fullscreen
} from '@mui/icons-material';
import {
  Box,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Chip,
  Alert,
  Stack,
  Paper,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useState, useEffect, useCallback } from 'react';

import { VideoPlayer } from './VideoPlayer';

import { apiClient } from '@/services/api';
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface CameraStream {
  vehicleId: string;
  cameraAngle: string;
  videoUrl?: string;
  videoId?: string;
  title: string;
  isActive: boolean;
}

export interface MultiCameraGridProps {
  vehicleId: string;
  autoStart?: boolean;
}

type GridLayout = '2x2' | '3x2' | '1x1';

// ============================================================================
// COMPONENT
// ============================================================================

export const MultiCameraGrid: React.FC<MultiCameraGridProps> = ({
  vehicleId,
  autoStart = false
}) => {
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState<GridLayout>('2x2');
  const [showOverlays, setShowOverlays] = useState(true);
  const [syncedPlayback, setSyncedPlayback] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusedCamera, setFocusedCamera] = useState<string | null>(null);

  // Available camera angles
  const cameraAngles = [
    { angle: 'forward', label: 'Forward', icon: '🚗' },
    { angle: 'rear', label: 'Rear', icon: '🔙' },
    { angle: 'driver_facing', label: 'Driver', icon: '👤' },
    { angle: 'cabin', label: 'Cabin', icon: '🪑' },
    { angle: 'side_left', label: 'Left Side', icon: '⬅️' },
    { angle: 'side_right', label: 'Right Side', icon: '➡️' }
  ];

  /**
   * Fetch available videos for each camera
   */
  const fetchCameraVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get video library
      const response = await apiClient.get('/api/emulator/video/library');

      if (response.data.success) {
        const videos = response.data.data;

        // Map videos to camera angles
        const streams: CameraStream[] = cameraAngles.map(cam => {
          const matchingVideo = videos.find((v: any) => v.cameraAngle === cam.angle);

          return {
            vehicleId,
            cameraAngle: cam.angle,
            videoUrl: matchingVideo?.url,
            videoId: matchingVideo?.id,
            title: `${cam.label} Camera`,
            isActive: !!matchingVideo
          };
        });

        setCameraStreams(streams);

        // Auto-start streams if requested
        if (autoStart) {
          startAllStreams(streams);
        }
      }
    } catch (err: any) {
      logger.error('Failed to fetch camera videos:', err);
      setError('Failed to load camera feeds. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, autoStart]);

  /**
   * Start all camera streams
   */
  const startAllStreams = async (streams?: CameraStream[]) => {
    const streamsToStart = streams || cameraStreams;

    for (const stream of streamsToStart) {
      if (stream.isActive) {
        try {
          await apiClient.post(`/api/emulator/video/stream/${vehicleId}/${stream.cameraAngle}/start`, {
            videoId: stream.videoId
          });
        } catch (err) {
          logger.error(`Failed to start stream for ${stream.cameraAngle}:`, err);
        }
      }
    }

    setIsPlaying(true);
  };

  /**
   * Stop all camera streams
   */
  const stopAllStreams = async () => {
    for (const stream of cameraStreams) {
      if (stream.isActive) {
        try {
          await apiClient.post(`/api/emulator/video/stream/${vehicleId}/${stream.cameraAngle}/stop`);
        } catch (err) {
          logger.error(`Failed to stop stream for ${stream.cameraAngle}:`, err);
        }
      }
    }

    setIsPlaying(false);
  };

  /**
   * Toggle playback
   */
  const togglePlayback = () => {
    if (isPlaying) {
      stopAllStreams();
    } else {
      startAllStreams();
    }
  };

  /**
   * Get grid columns based on layout
   */
  const getGridColumns = (): number => {
    if (focusedCamera) return 12; // Full width for focused view
    switch (gridLayout) {
      case '1x1': return 12;
      case '2x2': return 6;
      case '3x2': return 4;
      default: return 6;
    }
  };

  /**
   * Get number of cameras to display
   */
  const getCamerasToDisplay = (): CameraStream[] => {
    if (focusedCamera) {
      return cameraStreams.filter(s => s.cameraAngle === focusedCamera);
    }

    const activeCameras = cameraStreams.filter(s => s.isActive);

    switch (gridLayout) {
      case '1x1': return activeCameras.slice(0, 1);
      case '2x2': return activeCameras.slice(0, 4);
      case '3x2': return activeCameras.slice(0, 6);
      default: return activeCameras;
    }
  };

  /**
   * Initialize cameras on mount
   */
  useEffect(() => {
    fetchCameraVideos();
  }, [fetchCameraVideos]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && cameraStreams.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">Loading camera feeds...</Typography>
      </Box>
    );
  }

  const camerasToDisplay = getCamerasToDisplay();
  const activeCameraCount = cameraStreams.filter(s => s.isActive).length;

  return (
    <Box>
      {/* Header & Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              <Videocam sx={{ mr: 1, verticalAlign: 'middle' }} />
              Multi-Camera View
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vehicle: {vehicleId} • {activeCameraCount} cameras active
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Chip
              icon={<Videocam />}
              label={`${activeCameraCount} Active`}
              color="primary"
              size="small"
            />
            <Chip
              icon={<RemoveRedEye />}
              label={showOverlays ? 'CV On' : 'CV Off'}
              color={showOverlays ? 'success' : 'default'}
              size="small"
            />
          </Stack>
        </Box>

        {/* Control Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Playback Controls */}
          <Stack direction="row" spacing={1}>
            <Tooltip title={isPlaying ? 'Pause All' : 'Play All'}>
              <Button
                variant="contained"
                color={isPlaying ? 'warning' : 'success'}
                startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                onClick={togglePlayback}
                size="small"
              >
                {isPlaying ? 'Pause All' : 'Play All'}
              </Button>
            </Tooltip>
            <Tooltip title="Stop All">
              <Button
                variant="outlined"
                startIcon={<Stop />}
                onClick={stopAllStreams}
                size="small"
                disabled={!isPlaying}
              >
                Stop
              </Button>
            </Tooltip>
            <Tooltip title="Refresh Feeds">
              <IconButton size="small" onClick={fetchCameraVideos}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Layout Controls */}
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={showOverlays}
                  onChange={(e) => setShowOverlays(e.target.checked)}
                  size="small"
                />
              }
              label="CV Overlays"
            />

            <ToggleButtonGroup
              value={gridLayout}
              exclusive
              onChange={(_, value) => value && setGridLayout(value)}
              size="small"
            >
              <ToggleButton value="1x1">
                <Tooltip title="Single View">
                  <ViewModule />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="2x2">
                <Tooltip title="2x2 Grid">
                  <GridView />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="3x2">
                <Tooltip title="3x2 Grid">
                  <Fullscreen />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        {/* Camera Selection Pills */}
        {focusedCamera && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="All Cameras"
                onClick={() => setFocusedCamera(null)}
                size="small"
              />
              {cameraStreams.filter(s => s.isActive).map((stream) => (
                <Chip
                  key={stream.cameraAngle}
                  label={stream.title}
                  onClick={() => setFocusedCamera(stream.cameraAngle)}
                  color={focusedCamera === stream.cameraAngle ? 'primary' : 'default'}
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* No Active Cameras Warning */}
      {activeCameraCount === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No camera feeds available. Please check your video library configuration.
        </Alert>
      )}

      {/* Camera Grid */}
      <Grid container spacing={2}>
        {camerasToDisplay.map((stream) => (
          <Grid size={{ xs: 12, md: getGridColumns() }} key={stream.cameraAngle}>
            <Box
              onClick={() => !focusedCamera && setFocusedCamera(stream.cameraAngle)}
              sx={{ cursor: focusedCamera ? 'default' : 'pointer' }}
            >
              <VideoPlayer
                videoUrl={stream.videoUrl}
                videoId={stream.videoId}
                title={stream.title}
                vehicleId={vehicleId}
                cameraAngle={stream.cameraAngle}
                showOverlays={showOverlays}
                showControls={!syncedPlayback || focusedCamera === stream.cameraAngle}
                autoPlay={isPlaying}
                loop={true}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Stats Summary */}
      {camerasToDisplay.length > 0 && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Multi-Camera Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 3 }}>
              <Typography variant="caption" color="text.secondary">Active Cameras</Typography>
              <Typography variant="h6">{activeCameraCount}</Typography>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Typography variant="caption" color="text.secondary">Layout</Typography>
              <Typography variant="h6">{gridLayout.toUpperCase()}</Typography>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Typography variant="caption" color="text.secondary">CV Analysis</Typography>
              <Typography variant="h6">{showOverlays ? 'Enabled' : 'Disabled'}</Typography>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <Typography variant="caption" color="text.secondary">Playback</Typography>
              <Typography variant="h6">{isPlaying ? 'Playing' : 'Stopped'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default MultiCameraGrid;
