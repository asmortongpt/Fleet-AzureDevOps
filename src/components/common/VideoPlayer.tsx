/**
 * VideoPlayer - HLS/MP4 video player with streaming support
 * Uses HLS.js for adaptive bitrate streaming
 */

import Hls from 'hls.js'
import {
  Play,
  Pause,
  SpeakerHigh,
  SpeakerSlash,
  CornersOut,
  CornersIn,
  Record,
  Camera,
  Warning
} from '@phosphor-icons/react'
import { useRef, useState, useEffect, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export interface VideoPlayerProps {
  /** HLS stream URL (.m3u8) or direct video URL (.mp4, .webm) */
  src?: string
  /** Poster image URL */
  poster?: string
  /** Show live indicator */
  live?: boolean
  /** Camera/feed label */
  label?: string
  /** Vehicle/asset ID */
  assetId?: string
  /** Current status */
  status?: 'recording' | 'standby' | 'offline' | 'error'
  /** Event alert text */
  eventAlert?: string
  /** Auto-play on mount */
  autoPlay?: boolean
  /** Muted by default */
  muted?: boolean
  /** Show controls */
  controls?: boolean
  /** Compact mode for grid views */
  compact?: boolean
  /** Enable fullscreen */
  allowFullscreen?: boolean
  /** Click handler */
  onClick?: () => void
  /** Class name */
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  live = false,
  label,
  assetId,
  status = 'recording',
  eventAlert,
  autoPlay = false,
  muted = true,
  controls = true,
  compact = false,
  allowFullscreen = true,
  onClick,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Initialize HLS.js or native video
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setIsLoading(true)

    // Check if it's an HLS stream
    const isHLS = src.includes('.m3u8')

    if (isHLS && Hls.isSupported()) {
      // Use HLS.js for streaming
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: live,
        backBufferLength: live ? 0 : 30
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked, user needs to interact
            setIsPlaying(false)
          })
        }
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream unavailable')
          setIsLoading(false)
        }
      })

      hlsRef.current = hls

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHLS) {
      // Native HLS (Safari) or direct video file
      video.src = src
      video.load()

      const handleCanPlay = () => {
        setIsLoading(false)
        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false))
        }
      }

      const handleError = () => {
        setError('Video unavailable')
        setIsLoading(false)
      }

      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('error', handleError)

      return () => {
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)
      }
    }
  }, [src, autoPlay, live])

  // Update time tracking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current || !allowFullscreen) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [allowFullscreen])

  const seek = useCallback((value: number[]) => {
    const video = videoRef.current
    if (!video || live) return
    video.currentTime = value[0]
  }, [live])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const statusColors = {
    recording: 'bg-red-500',
    standby: 'bg-yellow-500',
    offline: 'bg-gray-500',
    error: 'bg-red-700'
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black overflow-hidden group',
        compact ? 'rounded-lg' : 'rounded-xl',
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={onClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={isMuted}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading State */}
      {isLoading && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Warning className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">{error}</p>
          </div>
        </div>
      )}

      {/* No Source - Demo Mode */}
      {!src && status !== 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <Camera className="w-12 h-12 text-slate-600" />
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
        <div className={cn(
          'w-2 h-2 rounded-full',
          statusColors[status],
          status === 'recording' && 'animate-pulse'
        )} />
        <span className="text-[10px] text-white font-medium uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded">
          {live && status === 'recording' ? 'LIVE' : status.toUpperCase()}
        </span>
      </div>

      {/* Event Alert */}
      {eventAlert && status === 'recording' && (
        <div className="absolute top-2 right-2 bg-amber-500/90 px-2 py-0.5 rounded text-[10px] font-medium text-white z-10">
          {eventAlert}
        </div>
      )}

      {/* Recording Indicator */}
      {status === 'recording' && (
        <div className="absolute top-2 right-2 z-10">
          <Record className="w-4 h-4 text-red-500 animate-pulse" weight="fill" />
        </div>
      )}

      {/* Controls Overlay */}
      {controls && (showControls || !isPlaying) && (
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity z-20',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        )}>
          {/* Center Play Button */}
          {!isPlaying && !isLoading && !error && (
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay() }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-8 h-8 text-white ml-1" weight="fill" />
              </div>
            </button>
          )}

          {/* Bottom Controls */}
          {!compact && (
            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
              {/* Progress Bar (non-live only) */}
              {!live && duration > 0 && (
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={seek}
                  className="cursor-pointer"
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={(e) => { e.stopPropagation(); togglePlay() }}
                  >
                    {isPlaying ? <Pause weight="fill" /> : <Play weight="fill" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={(e) => { e.stopPropagation(); toggleMute() }}
                  >
                    {isMuted ? <SpeakerSlash /> : <SpeakerHigh />}
                  </Button>

                  {!live && duration > 0 && (
                    <span className="text-xs text-white/80">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {allowFullscreen && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                    >
                      {isFullscreen ? <CornersIn /> : <CornersOut />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label Bar */}
      {(label || assetId) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">{label}</span>
            {assetId && <span className="text-[10px] text-white/60">{assetId}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Demo HLS streams for testing
export const DEMO_STREAMS = {
  bigBuckBunny: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  sintel: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  tears: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  live: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8'
} as const
