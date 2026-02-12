import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LineChart, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Gauge, Truck, Flame, Download, RefreshCw, Brain, Zap } from 'lucide-react'
import { useMemo } from 'react'



import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface KPIData {
  totalVehicles: number
  activeVehicles: number
  inactiveVehicles: number
  maintenanceVehicles: number
  fleetUtilizationRate: number
  totalMileageThisMonth: number
  totalMileageLastMonth: number
  mileageChange: number
  avgFuelEfficiency: number
  maintenanceCostPerVehicle: number
  incidentRatePer100kMiles: number
  avgDriverSafetyScore: number
  assetUtilizationPercentage: number
  taskCompletionRate: number
  avgAlertResponseTime: number
}

interface AIInsight {
  id: string
  type: 'warning' | 'recommendation' | 'insight' | 'critical'
  title: string
  message: string
  confidence: number
  actionable: boolean
  relatedVehicle?: string
  timestamp: string
}

interface FleetHealth {
  overall: number
  mechanical: number
  safety: number
  compliance: number
  efficiency: number
  breakdown: {
    category: string
    score: number
    weight: number
  }[]
}

interface CostAnalysis {
  totalCosts: number
  fuelCosts: number
  maintenanceCosts: number
  incidentCosts: number
  costPerMile: number
  costPerVehicle: number
  breakdown: {
    category: string
    amount: number
    percentage: number
  }[]
}

interface TrendData {
  date: string
  value: number
  label: string
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4'
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// API fetcher functions for real API calls
const fetchDashboardKpis = async (): Promise<KPIData> => {
  const response = await fetch(`${API_BASE}/executive-dashboard/kpis`)
  if (!response.ok) throw new Error('Failed to fetch KPI data')
  return response.json()
}

const fetchDashboardHealth = async (): Promise<FleetHealth> => {
  const response = await fetch(`${API_BASE}/executive-dashboard/fleet-health`)
  if (!response.ok) throw new Error('Failed to fetch fleet health data')
  return response.json()
}

const fetchDashboardCosts = async (): Promise<CostAnalysis> => {
  const response = await fetch(`${API_BASE}/executive-dashboard/cost-analysis`)
  if (!response.ok) throw new Error('Failed to fetch cost analysis data')
  return response.json()
}

const fetchDashboardInsights = async (): Promise<AIInsight[]> => {
  const response = await fetch(`${API_BASE}/executive-dashboard/insights`)
  if (!response.ok) throw new Error('Failed to fetch insights')
  return response.json()
}

const fetchDashboardTrends = async () => {
  const response = await fetch(`${API_BASE}/executive-dashboard/trends`)
  if (!response.ok) throw new Error('Failed to fetch trends')
  return response.json()
}

export function ExecutiveDashboard() {
  const queryClient = useQueryClient()
  const { push } = useDrilldown()

  // TanStack Query hooks with 60-second refetch interval
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIData>({
    queryKey: ['executive-dashboard', 'kpis'],
    queryFn: fetchDashboardKpis,
    refetchInterval: 60000,
    staleTime: 30000,
    gcTime: 60000
  })

  const { data: fleetHealth, isLoading: healthLoading } = useQuery<FleetHealth>({
    queryKey: ['executive-dashboard', 'fleet-health'],
    queryFn: fetchDashboardHealth,
    refetchInterval: 60000,
    staleTime: 30000,
    gcTime: 60000
  })

  const { data: costAnalysis, isLoading: costsLoading } = useQuery<CostAnalysis>({
    queryKey: ['executive-dashboard', 'cost-analysis'],
    queryFn: fetchDashboardCosts,
    refetchInterval: 60000,
    staleTime: 30000,
    gcTime: 60000
  })

  const { data: insights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ['executive-dashboard', 'insights'],
    queryFn: fetchDashboardInsights,
    refetchInterval: 60000,
    staleTime: 30000,
    gcTime: 60000
  })

  const { data: trends, isLoading: trendsLoading } = useQuery<{
    utilization: TrendData[];
    costs: TrendData[];
    incidents: TrendData[];
  }>({
    queryKey: ['executive-dashboard', 'trends'],
    queryFn: fetchDashboardTrends,
    refetchInterval: 60000,
    staleTime: 30000,
    gcTime: 60000
  })

  const loading = kpisLoading || healthLoading || costsLoading || insightsLoading || trendsLoading

  // Memoize last updated time
  const lastUpdated = useMemo(() => new Date(), [kpis, fleetHealth, costAnalysis, insights, trends])

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['executive-dashboard', 'kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['executive-dashboard', 'fleet-health'] }),
      queryClient.invalidateQueries({ queryKey: ['executive-dashboard', 'cost-analysis'] }),
      queryClient.invalidateQueries({ queryKey: ['executive-dashboard', 'insights'] }),
      queryClient.invalidateQueries({ queryKey: ['executive-dashboard', 'trends'] })
    ])
  }

  const handleExportPDF = () => {
    // In production, this would generate a PDF report
    alert('PDF Export functionality - integrate with jsPDF or similar library')
  }

  const getHealthColor = (score: number) => {
    if (score >= 85) return COLORS.success
    if (score >= 70) return COLORS.warning
    return COLORS.danger
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <Flame className="w-3 h-3" />
      case 'warning':
        return <AlertTriangle className="w-3 h-3" />
      case 'recommendation':
        return <Zap className="w-3 h-3" />
      default:
        return <Brain className="w-3 h-3" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'recommendation':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-9 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading executive dashboard...</p>
        </div>
      </div>
    )
  }

  if (!kpis || !fleetHealth || !costAnalysis) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Unable to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time fleet insights and AI-powered recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Fleet Health Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Overall Fleet Health
              </CardTitle>
              <CardDescription>Comprehensive health score across all categories</CardDescription>
            </div>
            <div className="text-center">
              <div
                className="text-5xl font-bold"
                style={{ color: getHealthColor(fleetHealth.overall) }}
              >
                {fleetHealth.overall.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">out of 100</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {fleetHealth.breakdown.map((item) => (
              <Card
                key={item.category}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                onClick={() => push({
                  id: `health-${item.category.toLowerCase()}`,
                  type: item.category === 'Safety' ? 'safety-score' :
                        item.category === 'Mechanical' ? 'maintenance-stats' :
                        item.category === 'Compliance' ? 'regulations' :
                        'utilization',
                  label: `${item.category} Health`,
                  data: { category: item.category, score: item.score, weight: item.weight }
                })}
              >
                <CardContent className="pt-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                    <p
                      className="text-base font-bold"
                      style={{ color: getHealthColor(item.score) }}
                    >
                      {item.score.toFixed(1)}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {(item.weight * 100).toFixed(0)}% weight
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators - All clickable with deep drilldown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card
          className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          onClick={() => push({
            id: 'total-vehicles',
            type: 'fleet-overview',
            label: 'Total Vehicles',
            data: { filter: 'all', totalVehicles: kpis.totalVehicles }
          })}
        >
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="text-sm font-bold">{kpis.totalVehicles}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.activeVehicles} active • {kpis.maintenanceVehicles} in maintenance
                </p>
              </div>
              <Truck className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          onClick={() => push({
            id: 'fleet-utilization',
            type: 'utilization',
            label: 'Fleet Utilization',
            data: { rate: kpis.fleetUtilizationRate, assetRate: kpis.assetUtilizationPercentage }
          })}
        >
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                <p className="text-sm font-bold">{kpis.fleetUtilizationRate.toFixed(1)}%</p>
                <Badge variant="outline" className="mt-1">
                  {kpis.assetUtilizationPercentage.toFixed(1)}% assets active
                </Badge>
              </div>
              <LineChart className="w-4 h-4 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          onClick={() => push({
            id: 'mileage-stats',
            type: 'performance-metrics',
            label: 'Monthly Mileage',
            data: { thisMonth: kpis.totalMileageThisMonth, lastMonth: kpis.totalMileageLastMonth, change: kpis.mileageChange }
          })}
        >
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Mileage</p>
                <p className="text-sm font-bold">{kpis.totalMileageThisMonth.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpis.mileageChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-danger" />
                  )}
                  <span className={`text-xs ${kpis.mileageChange >= 0 ? 'text-success' : 'text-danger'}`}>
                    {kpis.mileageChange.toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <Gauge className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
          onClick={() => push({
            id: 'fuel-efficiency',
            type: 'fuel-stats',
            label: 'Fuel Efficiency',
            data: { avgEfficiency: kpis.avgFuelEfficiency }
          })}
        >
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Fuel Efficiency</p>
                <p className="text-sm font-bold">{kpis.avgFuelEfficiency.toFixed(1)} MPG</p>
                <p className="text-xs text-muted-foreground mt-1">Fleet average</p>
              </div>
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Intelligent recommendations and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {insights?.map((insight) => (
                <div
                  key={insight.id}
                  className="border rounded-md p-2 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => {
                    // Drill to related record if available, otherwise show insight detail
                    if (insight.relatedVehicle) {
                      push({
                        id: `vehicle-${insight.relatedVehicle}`,
                        type: 'vehicle',
                        label: `Vehicle ${insight.relatedVehicle}`,
                        data: { vehicleId: insight.relatedVehicle }
                      })
                    } else if (insight.type === 'critical' || insight.type === 'warning') {
                      push({
                        id: `incident-${insight.id}`,
                        type: 'incidents',
                        label: insight.title,
                        data: { insightId: insight.id, ...insight }
                      })
                    } else {
                      push({
                        id: `insight-${insight.id}`,
                        type: 'fleet-optimizer',
                        label: insight.title,
                        data: { insight }
                      })
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`text-${getInsightColor(insight.type)}-foreground`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <p className="font-medium">{insight.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        Take Action
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{insight.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </p>
                    <span className="text-xs text-primary">Click to view details →</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}