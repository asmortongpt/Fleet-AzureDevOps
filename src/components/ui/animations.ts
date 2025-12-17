/**
 * Phase 4: Visual Polish - Animation Components
 *
 * Export all animation-related components for easy importing
 */

// Animated Markers
export {
  AnimatedMarker,
  AnimatedMarkerCluster,
  AnimatedMarkerRoute,
} from "./AnimatedMarker";

// Loading Skeletons
export {
  MapLoadingSkeleton,
  VehicleListLoadingSkeleton,
  DashboardCardsLoadingSkeleton,
  TableLoadingSkeleton,
  DetailPanelLoadingSkeleton,
  ChartLoadingSkeleton,
  FormLoadingSkeleton,
  GridLoadingSkeleton,
} from "./LoadingSkeleton";

// Interactive Tooltips
export {
  InteractiveTooltip,
  SimpleTooltip,
  DataTooltip,
} from "./InteractiveTooltip";

// Gradient Overlays
export {
  HeatmapGradient,
  ZoneOverlay,
  MetricGradient,
  PerformanceGradient,
  AnimatedBackground,
} from "./GradientOverlay";

// Progress Indicators
export {
  LinearProgress,
  CircularProgress,
  StepProgress,
  UploadProgress,
  LoadingSpinner,
  PulsingDots,
} from "./ProgressIndicator";
