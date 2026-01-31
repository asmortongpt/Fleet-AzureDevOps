/**
 * Enhanced Video Player Component
 * Full-featured video player with timeline, controls, annotation markers, and privacy filters
 */

import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Download, Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface VideoPlayerProps {
  videoUrl: string;
  eventId: number;
  events?: VideoEvent[];
  annotations?: EventAnnotation[];
  privacyMode?: boolean;
  autoPlay?: boolean;
  onTimeUpdate?: (time: number) => void;
  onEventMarkerClick?: (event: VideoEvent) => void;
}

interface VideoEvent {
  id: number;
  timestamp: number; // seconds from start
  eventType: string;
  severity: string;
  description: string;
}

interface EventAnnotation {
  timestamp: number;
  text: string;
  color: string;
}

const severityColors: Record<string, string> = {
  minor: 'bg-blue-500',
  moderate: 'bg-yellow-500',
  severe: 'bg-orange-500',
  critical: 'bg-red-500'
};

export default function VideoPlayerEnhanced({
  videoUrl,
  eventId,
  events = [],
  annotations = [],
  privacyMode = false,
  autoPlay = false,
  onTimeUpdate,
  onEventMarkerClick
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [privacyFilterEnabled, setPrivacyFilterEnabled] = useState(privacyMode);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Auto-play if requested
    if (autoPlay) {
      video.play().catch(err => logger.error('Auto-play failed:', err));
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, onTimeUpdate]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const downloadVideo = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `event_${eventId}_video.mp4`;
    a.click();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventMarkerPosition = (timestamp: number): string => {
    return `${(timestamp / duration) * 100}%`;
  };

  const jumpToEvent = (event: VideoEvent) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = event.timestamp;
    setCurrentTime(event.timestamp);
    onEventMarkerClick?.(event);
  };

  return (
    <Card>
      <div ref={containerRef} className="relative bg-black group">
        {/* Video Element */}
        <video
          ref={videoRef}
          className={cn(
            'w-full aspect-video object-contain',
            privacyFilterEnabled && 'blur-sm'
          )}
          src={videoUrl}
        >
          Your browser does not support video playback.
        </video>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-sm">Loading video...</div>
          </div>
        )}

        {/* Privacy Filter Toggle */}
        {privacyMode && (
          <div className="absolute top-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPrivacyFilterEnabled(!privacyFilterEnabled)}
            >
              {privacyFilterEnabled ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Privacy On
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Privacy Off
                </>
              )}
            </Button>
          </div>
        )}

        {/* Event Annotations Overlay */}
        {annotations.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 space-y-2">
            {annotations
              .filter(a => Math.abs(a.timestamp - currentTime) < 2)
              .map((annotation, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'px-2 py-2 rounded-lg text-white text-sm font-medium shadow-sm',
                    annotation.color
                  )}
                >
                  {annotation.text}
                </div>
              ))}
          </div>
        )}

        {/* Controls Overlay - Shows on hover */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Timeline with Event Markers */}
          <div className="relative mb-2">
            {/* Event Markers */}
            {events.map((event) => (
              <div
                key={event.id}
                className="absolute top-0 -translate-x-1/2 cursor-pointer"
                style={{ left: getEventMarkerPosition(event.timestamp) }}
                onClick={() => jumpToEvent(event)}
              >
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    severityColors[event.severity]
                  )}
                  title={`${event.eventType} at ${formatTime(event.timestamp)}`}
                />
              </div>
            ))}

            {/* Progress Slider */}
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>

          {/* Time Display */}
          <div className="text-white text-sm mb-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {playbackRate}x
                </Button>

                {showSettings && (
                  <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-lg p-2 space-y-1">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={cn(
                          'block w-full text-left px-3 py-1 rounded text-white hover:bg-white/20',
                          playbackRate === rate && 'bg-white/30'
                        )}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={downloadVideo}
              >
                <Download className="h-5 w-5" />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Event Timeline Below Video */}
        {events.length > 0 && (
          <div className="p-2 border-t">
            <h4 className="font-semibold mb-3">Safety Events in Video</h4>
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => jumpToEvent(event)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={cn(severityColors[event.severity], 'text-white')}>
                      {event.severity}
                    </Badge>
                    <div>
                      <div className="font-medium">{event.eventType}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
