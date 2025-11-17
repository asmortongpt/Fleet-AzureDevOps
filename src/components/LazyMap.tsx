/**
 * LazyMap Component - Production-Ready Lazy Loading Wrapper for Maps
 *
 * A comprehensive wrapper component that provides:
 * - Lazy loading with React.lazy() and Suspense
 * - Loading skeleton with progress indicators
 * - Error boundaries for graceful failure handling
 * - Prefetch on hover for better UX
 * - Multiple loading states and transitions
 * - Accessibility support
 * - Memory-efficient code splitting
 *
 * @module LazyMap
 * @version 1.0.0
 *
 * Usage:
 * ```tsx
 * import { LazyMap } from '@/components/LazyMap'
 *
 * <LazyMap
 *   vehicles={vehicles}
 *   facilities={facilities}
 *   cameras={cameras}
 *   enablePrefetch={true}
 * />
 * ```
 */

import { lazy, Suspense, useState, useEffect, useRef, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { UniversalMapProps } from './UniversalMap';

// ============================================================================
// LAZY-LOADED MAP COMPONENTS
// ============================================================================

/**
 * Dynamically import UniversalMap component
 * This creates a separate chunk that only loads when the map is needed
 */
const UniversalMapLazy = lazy(() =>
  import('./UniversalMap').then((module) => ({
    default: module.UniversalMap,
  }))
);

/**
 * Dynamically import LeafletMap component
 * Used for direct Leaflet implementation
 */
const LeafletMapLazy = lazy(() =>
  import('./LeafletMap').then((module) => ({
    default: module.LeafletMap,
  }))
);

/**
 * Dynamically import MapboxMap component
 * Used for direct Mapbox implementation
 */
const MapboxMapLazy = lazy(() =>
  import('./MapboxMap').then((module) => ({
    default: module.MapboxMap,
  }))
);

/**
 * Dynamically import GoogleMap component
 * Used for direct Google Maps implementation
 */
const GoogleMapLazy = lazy(() =>
  import('./GoogleMap').then((module) => ({
    default: module.GoogleMap,
  }))
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Map provider types
 */
export type MapProvider = 'universal' | 'leaflet' | 'mapbox' | 'google';

/**
 * Loading skeleton variant
 */
export type SkeletonVariant = 'simple' | 'detailed' | 'animated';

/**
 * Props for LazyMap component
 */
export interface LazyMapProps extends UniversalMapProps {
  /**
   * Map provider to use
   * @default 'universal'
   */
  provider?: MapProvider;

  /**
   * Enable prefetching on hover
   * Starts loading the map component when user hovers over container
   * @default true
   */
  enablePrefetch?: boolean;

  /**
   * Loading skeleton variant
   * @default 'animated'
   */
  skeletonVariant?: SkeletonVariant;

  /**
   * Minimum height for the map container
   * @default 500
   */
  minHeight?: number;

  /**
   * Maximum height for the map container
   * @default undefined (no limit)
   */
  maxHeight?: number;

  /**
   * Callback when map chunk starts loading
   */
  onLoadStart?: () => void;

  /**
   * Callback when map chunk finishes loading
   */
  onLoadComplete?: () => void;

  /**
   * Custom error fallback component
   */
  errorFallback?: ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

// ============================================================================
// LOADING SKELETON COMPONENTS
// ============================================================================

/**
 * Simple loading skeleton - minimal UI
 */
function SimpleLoadingSkeleton({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="flex items-center justify-center bg-muted/20 rounded-lg"
      style={{ minHeight: `${minHeight}px` }}
      role="status"
      aria-live="polite"
      aria-label="Loading map"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

/**
 * Detailed loading skeleton - shows what's being loaded
 */
function DetailedLoadingSkeleton({ minHeight }: { minHeight: number }) {
  const [loadingStage, setLoadingStage] = useState(0);
  const stages = [
    'Initializing map engine...',
    'Loading geographic data...',
    'Preparing markers...',
    'Finalizing map...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % stages.length);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-center bg-muted/20 rounded-lg"
      style={{ minHeight: `${minHeight}px` }}
      role="status"
      aria-live="polite"
      aria-label="Loading map"
    >
      <div className="text-center max-w-md px-6">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-6" />

        {/* Loading stage text */}
        <h3 className="text-base font-semibold text-foreground mb-2">Loading Map</h3>
        <p className="text-sm text-muted-foreground mb-4">{stages[loadingStage]}</p>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground/70 mt-4">
          {Math.round(((loadingStage + 1) / stages.length) * 100)}% complete
        </p>
      </div>
    </div>
  );
}

/**
 * Animated loading skeleton - shows map placeholder with pulse animation
 */
function AnimatedLoadingSkeleton({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="relative bg-muted/20 rounded-lg overflow-hidden"
      style={{ minHeight: `${minHeight}px` }}
      role="status"
      aria-live="polite"
      aria-label="Loading map"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-green-50/20 to-blue-50/20 dark:from-blue-950/20 dark:via-green-950/20 dark:to-blue-950/20 animate-pulse" />

      {/* Map-like grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          {/* Animated map pin icon */}
          <div className="mb-4 flex justify-center">
            <svg
              className="w-16 h-16 text-primary animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>

          <h3 className="text-base font-semibold text-foreground mb-2">Loading Interactive Map</h3>
          <p className="text-sm text-muted-foreground">Preparing geographic interface...</p>

          {/* Pulsing dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton markers (decorative) */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: '20%', left: '30%' },
          { top: '40%', left: '60%' },
          { top: '60%', left: '25%' },
          { top: '70%', left: '70%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 bg-primary/20 rounded-full animate-pulse"
            style={{ ...pos, animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Get loading skeleton component based on variant
 */
function getLoadingSkeleton(variant: SkeletonVariant, minHeight: number) {
  switch (variant) {
    case 'simple':
      return <SimpleLoadingSkeleton minHeight={minHeight} />;
    case 'detailed':
      return <DetailedLoadingSkeleton minHeight={minHeight} />;
    case 'animated':
      return <AnimatedLoadingSkeleton minHeight={minHeight} />;
    default:
      return <AnimatedLoadingSkeleton minHeight={minHeight} />;
  }
}

// ============================================================================
// ERROR FALLBACK COMPONENT
// ============================================================================

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      className="flex items-center justify-center bg-muted/30 border border-destructive/20 rounded-lg"
      style={{ minHeight: '500px' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center p-8 max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-destructive mb-3">Failed to Load Map</h3>
        <p className="text-sm text-muted-foreground mb-1">{error.message}</p>
        <p className="text-xs text-muted-foreground/70 mb-6">
          This may be due to network issues or missing dependencies.
        </p>

        <button
          onClick={resetErrorBoundary}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors font-medium text-sm"
        >
          Try Again
        </button>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LazyMap - Production-ready lazy-loaded map component
 *
 * Wraps map components with:
 * - Lazy loading (code splitting)
 * - Suspense boundaries
 * - Error boundaries
 * - Loading states
 * - Prefetch on hover
 * - Accessibility
 *
 * @example
 * ```tsx
 * <LazyMap
 *   vehicles={vehicles}
 *   facilities={facilities}
 *   provider="universal"
 *   enablePrefetch={true}
 *   skeletonVariant="animated"
 * />
 * ```
 */
export function LazyMap({
  provider = 'universal',
  enablePrefetch = true,
  skeletonVariant = 'animated',
  minHeight = 500,
  maxHeight,
  onLoadStart,
  onLoadComplete,
  errorFallback: CustomErrorFallback,
  className = '',
  ...mapProps
}: LazyMapProps) {
  const [isPrefetched, setIsPrefetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================================================
  // PREFETCH LOGIC
  // ========================================================================

  /**
   * Prefetch map component on hover
   * Starts loading the chunk before user actually needs it
   */
  const handleMouseEnter = () => {
    if (!enablePrefetch || isPrefetched) return;

    // Debounce prefetch to avoid loading on accidental hover
    prefetchTimeoutRef.current = setTimeout(() => {
      setIsPrefetched(true);
      onLoadStart?.();

      // Trigger dynamic import to start loading the chunk
      let prefetchPromise: Promise<any>;

      switch (provider) {
        case 'leaflet':
          prefetchPromise = import('./LeafletMap');
          break;
        case 'mapbox':
          prefetchPromise = import('./MapboxMap');
          break;
        case 'google':
          prefetchPromise = import('./GoogleMap');
          break;
        case 'universal':
        default:
          prefetchPromise = import('./UniversalMap');
          break;
      }

      prefetchPromise
        .then(() => {
          console.log(`✅ Prefetched ${provider} map component`);
          onLoadComplete?.();
        })
        .catch((error) => {
          console.error(`❌ Failed to prefetch ${provider} map:`, error);
        });
    }, 300); // 300ms debounce
  };

  /**
   * Cancel prefetch if user leaves before timeout
   */
  const handleMouseLeave = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  // ========================================================================
  // MAP COMPONENT SELECTION
  // ========================================================================

  /**
   * Select the appropriate lazy-loaded map component
   */
  const MapComponent = (() => {
    switch (provider) {
      case 'leaflet':
        return LeafletMapLazy;
      case 'mapbox':
        return MapboxMapLazy;
      case 'google':
        return GoogleMapLazy;
      case 'universal':
      default:
        return UniversalMapLazy;
    }
  })();

  // ========================================================================
  // RENDER
  // ========================================================================

  const containerStyle: React.CSSProperties = {
    minHeight: `${minHeight}px`,
    ...(maxHeight && { maxHeight: `${maxHeight}px` }),
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ErrorBoundary
        FallbackComponent={CustomErrorFallback || DefaultErrorFallback}
        onReset={() => {
          // Reset any state if needed
          setIsLoading(false);
        }}
        onError={(error, errorInfo) => {
          console.error('Map error boundary caught:', error, errorInfo);
        }}
      >
        <Suspense fallback={getLoadingSkeleton(skeletonVariant, minHeight)}>
          <MapComponent {...mapProps} className={className} />
        </Suspense>
      </ErrorBoundary>

      {/* Prefetch indicator (development only) */}
      {process.env.NODE_ENV === 'development' && isPrefetched && (
        <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded z-50">
          Prefetched
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NAMED EXPORTS
// ============================================================================

/**
 * Pre-configured lazy map variants for convenience
 */

export function LazyUniversalMap(props: Omit<LazyMapProps, 'provider'>) {
  return <LazyMap {...props} provider="universal" />;
}

export function LazyLeafletMap(props: Omit<LazyMapProps, 'provider'>) {
  return <LazyMap {...props} provider="leaflet" />;
}

export function LazyMapboxMap(props: Omit<LazyMapProps, 'provider'>) {
  return <LazyMap {...props} provider="mapbox" />;
}

export function LazyGoogleMap(props: Omit<LazyMapProps, 'provider'>) {
  return <LazyMap {...props} provider="google" />;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { MapProvider, SkeletonVariant, LazyMapProps };
