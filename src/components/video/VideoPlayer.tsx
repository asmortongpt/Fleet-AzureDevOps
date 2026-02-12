/**
 * Video Player Component with Computer Vision Overlays
 *
 * Displays real dashcam video with AI-powered analysis overlays:
 * - Object detection bounding boxes
 * - Lane detection lines
 * - Driver monitoring indicators
 * - Collision warnings
 * - Traffic sign recognition
 *
 * Supports multiple video sources:
 * - YouTube embeds
 * - Direct video URLs (MP4, WebM)
 * - HLS/DASH streams
 */

import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Settings,
  Warning,
  RemoveRedEye
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Tooltip
} from '@mui/material';
import React, { useRef, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoPlayerProps {
  videoUrl: string;
  videoId?: string;
  title?: string;
  vehicleId?: string;
  cameraAngle?: string;
  showOverlays?: boolean;
  showControls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

interface CVOverlay {
  type: 'object' | 'lane' | 'sign' | 'warning';
  boundingBox?: { x: number; y: number; width: number; height: number };
  points?: Array<{ x: number; y: number }>;
  label: string;
  confidence?: number;
  color: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoId,
  title = 'Dashcam Video',
  vehicleId,
  cameraAngle = 'forward',
  showOverlays = true,
  showControls = true,
  autoPlay = false,
  loop = false,
  onTimeUpdate,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Computer Vision Analysis State
  const [cvOverlays, setCvOverlays] = useState<CVOverlay[]>([]);
  const [detectionStats, setDetectionStats] = useState({
    objects: 0,
    vehicles: 0,
    pedestrians: 0,
    alerts: 0
  });

  /**
   * Check if URL is YouTube
   */
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  /**
   * Convert YouTube URL to embed URL
   */
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=${autoPlay ? 1 : 0}&loop=${loop ? 1 : 0}`;
    }
    return url;
  };

  /**
   * Computer vision analysis placeholder.
   * Real overlays should be supplied via API integration.
   */
  const simulateComputerVision = () => {
    if (!showOverlays) return;
    setCvOverlays([]);
    setDetectionStats({
      objects: 0,
      vehicles: 0,
      pedestrians: 0,
      alerts: 0
    });
  };

  /**
   * Draw CV overlays on canvas
   */
  const drawOverlays = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showOverlays || cvOverlays.length === 0) return;

    // Draw overlays
    cvOverlays.forEach(overlay => {
      if (overlay.type === 'object' || overlay.type === 'sign' || overlay.type === 'warning') {
        // Draw bounding box
        if (overlay.boundingBox) {
          const box = overlay.boundingBox;
          const x = box.x * canvas.width;
          const y = box.y * canvas.height;
          const width = box.width * canvas.width;
          const height = box.height * canvas.height;

          ctx.strokeStyle = overlay.color;
          ctx.lineWidth = overlay.type === 'warning' ? 4 : 2;
          ctx.strokeRect(x, y, width, height);

          // Draw label background
          const labelPadding = 4;
          const labelHeight = 20;
          ctx.fillStyle = overlay.color;
          ctx.fillRect(x, y - labelHeight, width, labelHeight);

          // Draw label text
          ctx.fillStyle = '#000000';
          ctx.font = overlay.type === 'warning' ? 'bold 14px Arial' : '12px Arial';
          ctx.fillText(overlay.label, x + labelPadding, y - labelPadding);

          // Draw confidence if available
          if (overlay.confidence) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(`${(overlay.confidence * 100).toFixed(0)}%`, x + width - 30, y - labelPadding);
          }
        }
      } else if (overlay.type === 'lane' && overlay.points) {
        // Draw lane lines
        ctx.strokeStyle = overlay.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        overlay.points.forEach((point, index) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  };

  /**
   * Handle video time update
   */
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }

      // Simulate CV analysis every second
      if (Math.floor(time) !== Math.floor(time - 0.1)) {
        simulateComputerVision();
      }
    }
  };

  /**
   * Handle video loaded
   */
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  /**
   * Handle video ended
   */
  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  /**
   * Toggle play/pause
   */
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  /**
   * Format time
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Update canvas overlay on video frame
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        drawOverlays();
      }
    }, 100); // 10 FPS overlay update

    return () => clearInterval(interval);
  }, [isPlaying, cvOverlays, showOverlays]);

  /**
   * Initialize computer vision simulation
   */
  useEffect(() => {
    simulateComputerVision();
    const interval = setInterval(simulateComputerVision, 2000);
    return () => clearInterval(interval);
  }, [cameraAngle, showOverlays]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const isYouTube = isYouTubeUrl(videoUrl);

  return (
    <Card ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      <CardContent sx={{ p: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="subtitle2">{title}</Typography>
            {vehicleId && (
              <Typography variant="caption" color="text.secondary">
                {vehicleId} - {cameraAngle}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<RemoveRedEye />}
              label={`${detectionStats.objects} Objects`}
              size="small"
              variant="outlined"
            />
            {detectionStats.alerts > 0 && (
              <Chip
                icon={<Warning />}
                label={`${detectionStats.alerts} Alerts`}
                size="small"
                color="error"
              />
            )}
          </Stack>
        </Box>

        {/* Video Container */}
        <Box sx={{ position: 'relative', backgroundColor: '#000', borderRadius: 1 }}>
          {isYouTube ? (
            // YouTube Embed
            <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 */ }}>
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '4px'
                }}
              />
            </Box>
          ) : (
            // HTML5 Video
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay={autoPlay}
                loop={loop}
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: '4px'
                }}
              />
              {/* CV Overlay Canvas */}
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              />
            </>
          )}
        </Box>

        {/* Controls */}
        {showControls && !isYouTube && (
          <Box sx={{ mt: 1 }}>
            {/* Progress Bar */}
            <LinearProgress
              variant="determinate"
              value={(currentTime / duration) * 100 || 0}
              sx={{ mb: 1 }}
            />

            {/* Control Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={togglePlay}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton size="small" onClick={toggleMute}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <Typography variant="caption">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Tooltip title={showOverlays ? 'Hide Overlays' : 'Show Overlays'}>
                  <IconButton size="small">
                    <RemoveRedEye color={showOverlays ? 'primary' : 'disabled'} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small">
                  <Settings />
                </IconButton>
                <IconButton size="small" onClick={toggleFullscreen}>
                  <Fullscreen />
                </IconButton>
              </Stack>
            </Box>
          </Box>
        )}

        {/* Detection Stats */}
        {showOverlays && detectionStats.objects > 0 && (
          <Paper sx={{ mt: 1, p: 1, backgroundColor: 'background.default' }}>
            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Vehicles</Typography>
                <Typography variant="body2">{detectionStats.vehicles}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pedestrians</Typography>
                <Typography variant="body2">{detectionStats.pedestrians}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Objects</Typography>
                <Typography variant="body2">{detectionStats.objects}</Typography>
              </Box>
            </Stack>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
