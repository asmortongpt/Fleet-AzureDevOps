import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartLine,
  TrendUp,
  TrendDown,
  Warning,
  CheckCircle,
  Clock,
  CurrencyDollar,
  Gauge,
  Truck,
  Wrench,
  Fire,
  Users,
  Target,
  Download,
  ArrowsClockwise,
  Brain,
  ShieldCheck,
  Lightning
} from '@phosphor-icons/react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

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

// Mock data generators using useMemo pattern
const generateMockKPIs = (): KPIData => ({
  totalVehicles: 124,
  activeVehicles: 98,
  inactiveVehicles: 8,
  maintenanceVehicles: 18,
  fleetUtilizationRate: 78.5,
  totalMileageThisMonth: 45230,
  totalMileageLastMonth: 42150,
  mileageChange: 7.3,
  avgFuelEfficiency: 18.4,
  maintenanceCostPerVehicle: 1245.50,
  incidentRatePer100kMiles: 2.3,
  avgDriverSafetyScore: 87.5,
  assetUtilizationPercentage: 79.0,
  taskCompletionRate: 92.5,
  avgAlertResponseTime: 2.4
})

const generateMockHealth = (): FleetHealth => ({
  overall: 82.5,
  mechanical: 85.0,
  safety: 87.5,
  compliance: 78.0,
  efficiency: 79.5,
  breakdown: [
    { category: 'Mechanical', score: 85.0, weight: 0.30 },
    { category: 'Safety', score: 87.5, weight: 0.35 },
    { category: 'Compliance', score: 78.0, weight: 0.20 },
    { category: 'Efficiency', score: 79.5, weight: 0.15 }
  ]
})

const generateMockCosts = (): CostAnalysis => ({
  totalCosts: 154680,
  fuelCosts: 78340,
  maintenanceCosts: 62140,
  incidentCosts: 14200,
  costPerMile: 3.42,
  costPerVehicle: 1247.58,
  breakdown: [
    { category: 'Fuel', amount: 78340, percentage: 50.6 },
    { category: 'Maintenance', amount: 62140, percentage: 40.2 },
    { category: 'Incidents', amount: 14200, percentage: 9.2 }
  ]
})

const generateMockInsights = (): AIInsight[] => [
  {
    id: '1',
    type: 'critical',
    title: 'High Maintenance Costs Detected',
    message: 'Vehicle F-150 (VIN: 1FTFW1E84MFC12345) has incurred $8,450 in maintenance costs over the last 90 days. Consider replacement evaluation.',
    confidence: 0.92,
    actionable: true,
    relatedVehicle: '1FTFW1E84MFC12345',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    type: 'warning',
    title: 'Overdue Maintenance Alert',
    message: '12 vehicles have overdue maintenance schedules. Immediate action required to prevent breakdowns and ensure compliance.',
    confidence: 0.95,
    actionable: true,
    timestamp: new Date().toISOString()
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Fleet Optimization Opportunity',
    message: 'Current utilization is at 78.5%. Consider redistributing 8 underutilized vehicles to high-demand routes to improve efficiency by 12%.',
    confidence: 0.78,
    actionable: true,
    timestamp: new Date().toISOString()
  },
  {
    id: '4',
    type: 'insight',
    title: 'AI Strategic Recommendation',
    message: 'Based on historical patterns, implementing predictive maintenance could reduce emergency repairs by 35% and save approximately $18,500 monthly.',
    confidence: 0.85,
    actionable: true,
    timestamp: new Date().toISOString()
  }
]

const generateMockTrends = () => ({
  utilization: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 70 + Math.random() * 20,
    label: 'Utilization %'
  })),
  costs: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: 3000 + Math.random() * 2000,
    label: 'Daily Costs'
  })),
  incidents: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.floor(Math.random() * 5),
    label: 'Incidents'
  }))
})

// API fetcher function for real API calls
const fetchDashboardKpis = async (): Promise<KPIData> => {
  // In production, replace with: return (await fetch('/api/executive-dashboard/kpis')).json()
  return generateMockKPIs()
}

const fetchDashboardHealth = async (): Promise<FleetHealth> => {
  // In production, replace with: return (await fetch('/api/executive-dashboard/fleet-health')).json()
  return generateMockHealth()
}

const fetchDashboardCosts = async (): Promise<CostAnalysis> => {
  // In production, replace with: return (await fetch('/api/executive-dashboard/cost-analysis')).json()
  return generateMockCosts()
}

const fetchDashboardInsights = async (): Promise<AIInsight[]> => {
  // In production, replace with: return (await fetch('/api/executive-dashboard/insights')).json()
  return generateMockInsights()
}

const fetchDashboardTrends = async () => {
  // In production, replace with: return (await fetch('/api/executive-dashboard/trends')).json()
  return generateMockTrends()
}

export function ExecutiveDashboard() {
  const queryClient = useQueryClient()

  // TanStack Query hooks with 60-second refetch interval
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIData>({
    queryKey: ['executive-dashboard', 'kpis'],
    queryFn: fetchDashboardKpis,
    refetchInterval: 60000,
    staleTime: 30000
  })

  const { data: fleetHealth, isLoading: healthLoading } = useQuery<FleetHealth>({
    queryKey: ['executive-dashboard', 'fleet-health'],
    queryFn: fetchDashboardHealth,
    refetchInterval: 60000,
    staleTime: 30000
  })

  const { data: costAnalysis, isLoading: costsLoading } = useQuery<CostAnalysis>({
    queryKey: ['executive-dashboard', 'cost-analysis'],
    queryFn: fetchDashboardCosts,
    refetchInterval: 60000,
    staleTime: 30000
  })

  const { data: insights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ['executive-dashboard', 'insights'],
    queryFn: fetchDashboardInsights,
    refetchInterval: 60000,
    staleTime: 30000
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['executive-dashboard', 'trends'],
    queryFn: fetchDashboardTrends,
    refetchInterval: 60000,
    staleTime: 30000
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
        return <Fire className="w-5 h-5" weight="fill" />
      case 'warning':
        return <Warning className="w-5 h-5" weight="fill" />
      case 'recommendation':
        return <Lightning className="w-5 h-5" weight="fill" />
      default:
        return <Brain className="w-5 h-5" weight="fill" />
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
          <ArrowsClockwise className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Executive Dashboard</h2>
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
            <ArrowsClockwise className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                <Gauge className="w-6 h-6" />
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
          <div className="grid grid-cols-4 gap-4">
            {fleetHealth.breakdown.map((item) => (
              <Card key={item.category}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                    <p
                      className="text-3xl font-bold"
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="text-2xl font-bold">{kpis.totalVehicles}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.activeVehicles} active • {kpis.maintenanceVehicles} in maintenance
                </p>
              </div>
              <Truck className="w-8 h-8 text-primary" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                <p className="text-2xl font-bold">{kpis.fleetUtilizationRate.toFixed(1)}%</p>
                <Badge variant="outline" className="mt-1">
                  {kpis.assetUtilizationPercentage.toFixed(1)}% assets active
                </Badge>
              </div>
              <ChartLine className="w-8 h-8 text-success" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Mileage</p>
                <p className="text-2xl font-bold">{kpis.totalMileageThisMonth.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpis.mileageChange >= 0 ? (
                    <TrendUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendDown className="w-4 h-4 text-danger" />
                  )}
                  <span className={`text-xs ${kpis.mileageChange >= 0 ? 'text-success' : 'text-danger'}`}>
                    {Math.abs(kpis.mileageChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <Target className="w-8 h-8 text-purple" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Driver Safety Score</p>
                <p className="text-2xl font-bold">{kpis.avgDriverSafetyScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.incidentRatePer100kMiles.toFixed(2)} incidents/100k mi
                </p>
              </div>
              <ShieldCheck className="w-8 h-8 text-success" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fuel Efficiency</p>
                <p className="text-2xl font-bold">{kpis.avgFuelEfficiency.toFixed(1)} MPG</p>
                <Badge variant="outline" className="mt-1">Fleet average</Badge>
              </div>
              <CurrencyDollar className="w-8 h-8 text-warning" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Cost</p>
                <p className="text-2xl font-bold">${kpis.maintenanceCostPerVehicle.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">per vehicle/month</p>
              </div>
              <Wrench className="w-8 h-8 text-primary" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Task Completion</p>
                <p className="text-2xl font-bold">{kpis.taskCompletionRate.toFixed(1)}%</p>
                <Badge variant="outline" className="mt-1">Work orders</Badge>
              </div>
              <CheckCircle className="w-8 h-8 text-success" weight="duotone" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alert Response Time</p>
                <p className="text-2xl font-bold">{kpis.avgAlertResponseTime.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground mt-1">average response</p>
              </div>
              <Clock className="w-8 h-8 text-cyan" weight="duotone" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" weight="duotone" />
            AI-Powered Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Machine learning analysis detecting patterns and anomalies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {insights.map((insight) => (
                <Card key={insight.id} className="border-l-4" style={{ borderLeftColor: insight.type === 'critical' ? COLORS.danger : insight.type === 'warning' ? COLORS.warning : COLORS.primary }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${insight.type === 'critical' ? 'bg-red-100 text-red-600' : insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant={getInsightColor(insight.type)}>
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{insight.message}</p>
                        <div className="flex items-center gap-2">
                          {insight.actionable && (
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          )}
                          {insight.relatedVehicle && (
                            <Badge variant="secondary">VIN: {insight.relatedVehicle}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(insight.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Charts and Trends */}
      <Tabs defaultValue="utilization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="utilization">Fleet Utilization</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="incidents">Incident Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Utilization Over Time</CardTitle>
              <CardDescription>30-day trend analysis of fleet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends?.utilization || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                    name="Utilization %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Current month expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costAnalysis.breakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                    >
                      {costAnalysis.breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Cost Trend</CardTitle>
                <CardDescription>30-day cost history</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends?.costs || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      name="Daily Costs ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Monthly Costs</p>
                  <p className="text-3xl font-bold">${costAnalysis.totalCosts.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Per Mile</p>
                  <p className="text-3xl font-bold">${costAnalysis.costPerMile.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost Per Vehicle</p>
                  <p className="text-3xl font-bold">${costAnalysis.costPerVehicle.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Incident Trends</CardTitle>
              <CardDescription>30-day incident history</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends?.incidents || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={COLORS.danger} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common executive dashboard tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Truck className="w-6 h-6" />
              <span className="text-xs">Fleet Overview</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Wrench className="w-6 h-6" />
              <span className="text-xs">Schedule Maintenance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ChartLine className="w-6 h-6" />
              <span className="text-xs">View Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span className="text-xs">Driver Management</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
