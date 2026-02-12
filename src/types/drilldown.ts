// Drilldown types
export interface DrilldownProps {
  onDrilldown?: (level: DrilldownLevel) => void
  onBack?: () => void
  currentLevel?: DrilldownLevel
  levels?: DrilldownLevel[]
  className?: string
  children?: React.ReactNode
}

export interface DrilldownLevel {
  id: string
  type: DrilldownType
  label: string
  data?: DrilldownData
  timestamp: number
  parentId?: string
  metadata?: Record<string, unknown>
}

export type DrilldownType = 
  | 'dashboard'
  | 'widget'
  | 'chart'
  | 'table'
  | 'detail'
  | 'custom'

export interface DrilldownData {
  filters?: Record<string, unknown>
  params?: Record<string, unknown>
  context?: Record<string, unknown>
}

export interface DrilldownContext {
  levels: DrilldownLevel[]
  currentLevel: DrilldownLevel | null
  canGoBack: boolean
  canGoForward: boolean
  history: DrilldownLevel[]
  maxDepth?: number
}

export interface DrilldownActions {
  drilldown: (level: Omit<DrilldownLevel, 'timestamp'>) => void
  back: () => void
  forward: () => void
  reset: () => void
  goToLevel: (levelId: string) => void
}

export interface DrilldownState {
  context: DrilldownContext
  actions: DrilldownActions
}

export interface DrilldownConfig {
  maxDepth?: number
  enableHistory?: boolean
  persistState?: boolean
  onLevelChange?: (level: DrilldownLevel | null) => void
  onError?: (error: Error) => void
}

export interface DrilldownBreadcrumb {
  id: string
  label: string
  onClick: () => void
  isActive: boolean
}

export interface DrilldownTransition {
  from: DrilldownLevel | null
  to: DrilldownLevel
  direction: 'forward' | 'backward'
  timestamp: number
}

// Hierarchical drilldown types (for data-focused drilling)
export interface HierarchicalDrilldownLevel {
  field: string
  label: string
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max'
  formatter?: (value: unknown) => string
}

export interface HierarchicalDrilldownConfig {
  levels: HierarchicalDrilldownLevel[]
  maxDepth?: number
  enableHistory?: boolean
  persistState?: boolean
  onLevelChange?: (level: string | null) => void
  onError?: (error: Error) => void
}

export interface HierarchicalDrilldownBreadcrumb {
  level: string
  value: string | number
  label: string
}

export interface HierarchicalDrilldownState {
  currentLevel: string
  filters: Record<string, string | number>
  breadcrumbs: HierarchicalDrilldownBreadcrumb[]
}