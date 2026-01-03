/**
 * Loading Skeleton Components - CLS Optimization
 *
 * All skeleton components use FIXED DIMENSIONS to prevent Cumulative Layout Shift (CLS).
 * Target: Core Web Vitals CLS < 0.1
 *
 * Usage:
 * ```tsx
 * import { FleetDashboardSkeleton } from '@/components/loading'
 *
 * function Dashboard() {
 *   const { data, isLoading } = useFleetData()
 *
 *   if (isLoading) return <FleetDashboardSkeleton />
 *
 *   return <FleetDashboard data={data} />
 * }
 * ```
 */

// Dashboard & Page Skeletons
export {
  FleetDashboardSkeleton,
  FleetMetricsBarSkeleton,
  FleetTableSkeleton,
  FleetMapSkeleton
} from './FleetDashboardSkeleton'

// Form Skeletons
export {
  VehicleFormSkeleton,
  DriverFormSkeleton,
  WorkOrderFormSkeleton,
  UserManagementFormSkeleton
} from './VehicleFormSkeleton'

// Chart Skeletons
export {
  LineChartSkeleton,
  BarChartSkeleton,
  PieChartSkeleton,
  DonutChartSkeleton,
  AreaChartSkeleton,
  GaugeChartSkeleton,
  HeatmapSkeleton,
  SparklineChartSkeleton,
  StatCardWithChartSkeleton,
  DashboardChartsGridSkeleton
} from './ChartSkeleton'

// Navigation Skeletons
export {
  SidebarSkeleton,
  HeaderSkeleton,
  BreadcrumbSkeleton,
  TabNavigationSkeleton,
  PaginationSkeleton,
  FilterBarSkeleton,
  ToolbarSkeleton,
  ContextMenuSkeleton,
  DropdownMenuSkeleton,
  CommandPaletteSkeleton,
  FullLayoutSkeleton
} from './NavigationSkeleton'

// Re-export advanced skeletons from shared
export {
  DashboardSkeleton,
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  MapSkeleton,
  ChartSkeleton,
  ProfileSkeleton,
  VehicleCardSkeleton,
  PageSkeleton
} from '@/components/shared/AdvancedLoadingSkeleton'
