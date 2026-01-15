// Drilldown types
export interface DrilldownProps {
  [key: string]: unknown
}

export interface DrilldownLevel {
  id: string
  type: string
  label: string
  data?: unknown
  timestamp: number
}
