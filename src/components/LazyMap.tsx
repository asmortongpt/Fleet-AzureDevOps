import { lazy, Suspense, useState, useEffect, useRef, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { UniversalMapProps } from './UniversalMap';
import type { MapboxMapProps } from './MapboxMap';
import type { LeafletMapProps } from './LeafletMap';
import type { GoogleMapProps } from './GoogleMap';

import logger from '@/utils/logger';

const UniversalMapLazy = lazy(() =>
  import('./UniversalMap').then((module) => ({
    default: module.UniversalMap,
  }))
);

const LeafletMapLazy = lazy(() =>
  import('./LeafletMap').then((module) => ({
    default: module.LeafletMap,
  }))
);

const MapboxMapLazy = lazy(() =>
  import('./MapboxMap').then((module) => ({
    default: module.MapboxMap,
  }))
);

const GoogleMapLazy = lazy(() =>
  import('./GoogleMap').then((module) => ({
    default: module.GoogleMap,
  }))
);

export type MapProvider = 'universal' | 'leaflet' | 'mapbox' | 'google';

export type SkeletonVariant = 'simple' | 'detailed' | 'animated';

export interface LazyMapProps extends Partial<UniversalMapProps>, Partial<MapboxMapProps>, Partial<LeafletMapProps>, Partial<GoogleMapProps> {
  provider?: MapProvider;
  enablePrefetch?: boolean;
  skeletonVariant?: SkeletonVariant;
  minHeight?: number;
  maxHeight?: number;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  errorFallback?: ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

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
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-6" />
        <h3 className="text-base font-semibold text-foreground mb-2">Loading Map</h3>
        <p className="text-sm text-muted-foreground mb-4">{stages[loadingStage]}</p>
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

function AnimatedLoadingSkeleton({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="relative bg-muted/20 rounded-lg overflow-hidden"
      style={{ minHeight: `${minHeight}px` }}
      role="status"
      aria-live="polite"
      aria-label="Loading map"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-green-50/20 to-blue-50/20 dark:from-blue-950/20 dark:via-green-950/20 dark:to-blue-950/20 animate-pulse" />
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
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
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
  const containerRef = useRef<HTMLDivElement>(null);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!enablePrefetch || isPrefetched) return;

    prefetchTimeoutRef.current = setTimeout(() => {
      setIsPrefetched(true);
      onLoadStart?.();

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
          logger.debug(`✅ Prefetched ${provider} map component`);
          onLoadComplete?.();
        })
        .catch((error) => {
          logger.error(`❌ Failed to prefetch ${provider} map:`, error);
        });
    }, 300);
  };

  const handleMouseLeave = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

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

  const containerStyle: React.CSSProperties = {
    minHeight: `${minHeight}px`,
    ...(maxHeight ? { maxHeight: `${maxHeight}px` } : {}),
  };

  const ErrorFallback = CustomErrorFallback || DefaultErrorFallback;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          setIsPrefetched(false);
        }}
      >
        <Suspense fallback={getLoadingSkeleton(skeletonVariant, minHeight)}>
          <MapComponent {...(mapProps as any)} className={className} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}