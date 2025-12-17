import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  Navigation,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  onToggleLayers?: () => void;
  onToggleFullscreen?: () => void;
  className?: string;
  isFullscreen?: boolean;
}

export function MobileMapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleLayers,
  onToggleFullscreen,
  className,
  isFullscreen = false
}: MobileMapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Touch-optimized button size (44px minimum for accessibility)
  const buttonSize = 'h-11 w-11 sm:h-10 sm:w-10';
  const iconSize = 'h-5 w-5';

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-40 flex flex-col gap-2',
        'sm:bottom-4 sm:right-4',
        className
      )}
      data-testid="mobile-map-controls"
    >
      {/* Fullscreen Toggle - Always visible */}
      {onToggleFullscreen && (
        <Button
          variant="default"
          size="icon"
          className={cn(
            buttonSize,
            'rounded-full shadow-lg bg-white text-slate-900 hover:bg-slate-100',
            'active:scale-95 transition-all touch-manipulation'
          )}
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          data-testid="fullscreen-control"
        >
          {isFullscreen ? (
            <Minimize2 className={iconSize} />
          ) : (
            <Maximize2 className={iconSize} />
          )}
        </Button>
      )}

      {/* Layers Toggle */}
      {onToggleLayers && (
        <Button
          variant="default"
          size="icon"
          className={cn(
            buttonSize,
            'rounded-full shadow-lg bg-white text-slate-900 hover:bg-slate-100',
            'active:scale-95 transition-all touch-manipulation'
          )}
          onClick={onToggleLayers}
          aria-label="Toggle layers"
          data-testid="layers-control"
        >
          <Layers className={iconSize} />
        </Button>
      )}

      {/* Locate Me */}
      {onLocate && (
        <Button
          variant="default"
          size="icon"
          className={cn(
            buttonSize,
            'rounded-full shadow-lg bg-white text-slate-900 hover:bg-slate-100',
            'active:scale-95 transition-all touch-manipulation'
          )}
          onClick={onLocate}
          aria-label="Locate me"
          data-testid="locate-control"
        >
          <Locate className={iconSize} />
        </Button>
      )}

      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 bg-white rounded-full shadow-lg p-1">
        {onZoomIn && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              buttonSize,
              'rounded-full hover:bg-slate-100',
              'active:scale-95 transition-all touch-manipulation'
            )}
            onClick={onZoomIn}
            aria-label="Zoom in"
            data-testid="zoom-in-control"
          >
            <ZoomIn className={iconSize} />
          </Button>
        )}

        {onZoomOut && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              buttonSize,
              'rounded-full hover:bg-slate-100',
              'active:scale-95 transition-all touch-manipulation'
            )}
            onClick={onZoomOut}
            aria-label="Zoom out"
            data-testid="zoom-out-control"
          >
            <ZoomOut className={iconSize} />
          </Button>
        )}
      </div>
    </div>
  );
}

// Gesture support component for map containers
interface GestureMapWrapperProps {
  children: React.ReactNode;
  onPinchZoom?: (scale: number) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  className?: string;
}

export function GestureMapWrapper({
  children,
  onPinchZoom,
  onSwipe,
  className
}: GestureMapWrapperProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && onPinchZoom) {
      // Pinch gesture start
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialDistance(distance);
    } else if (e.touches.length === 1 && onSwipe) {
      // Swipe gesture start
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance && onPinchZoom) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / initialDistance;
      onPinchZoom(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart && onSwipe && e.changedTouches.length === 1) {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const threshold = 50; // Minimum swipe distance

      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    }

    setTouchStart(null);
    setInitialDistance(null);
  };

  return (
    <div
      className={cn('relative touch-none', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="gesture-map-wrapper"
    >
      {children}
    </div>
  );
}
