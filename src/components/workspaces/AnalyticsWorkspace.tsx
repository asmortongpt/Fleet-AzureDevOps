import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Share2,
  Settings,
  Gauge,
  DollarSign,
  Fuel,
  Wrench,
  Clock
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVehicles, useWorkOrders, useFacilities, useDrivers } from "@/hooks/use-api"

// Define types for data structures
interface Vehicle {
  status: string;
  [key: string]: unknown;
}

interface WorkOrder {
  status: string;
  [key: string]: unknown;
}

// Executive Dashboard Panel
const ExecutiveDashboard = ({ vehicles, workOrders, _drivers }: { vehicles: Vehicle[] | null; workOrders: WorkOrder[] | null; _drivers: unknown }) => {
  const totalVehicles = vehicles?.length || 0
  const activeVehicles = vehicles?.filter((v: Vehicle) => v.status === 'active').length || 0
  const pendingOrders = workOrders?.filter((wo: WorkOrder) => wo.status === 'pending').length || 0
  const completedOrders = workOrders?.filter((wo: WorkOrder) => wo.status === 'completed').length || 0

  const avgUtilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0
  const completionRate = (pendingOrders + completedOrders) > 0
    ? ((completedOrders / (pendingOrders + completedOrders)) * 100).toFixed(1)
    : 0

  const kpis = [
    {
      title: "Fleet Utilization",
      value: `${avgUtilization}%`,
      trend: "+5.2%",
      isPositive: true,
      icon: <Gauge className="h-5 w-5 text-blue-400" />,
      bg: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/20"
    },
    {
      title: "Active Vehicles",
      value: activeVehicles,
      subtitle: `of ${totalVehicles} total`,
      icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
      bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20"
    },
    {
      title: "Maintenance Completion",
      value: `${completionRate}%`,
      trend: "+12.4%",
      isPositive: true,
      icon: <Wrench className="h-5 w-5 text-amber-400" />,
      bg: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/20"
    },
    {
      title: "Avg Fuel Cost",
      value: "$3.45",
      trend: "-0.8%",
      isPositive: true,
      icon: <Fuel className="h-5 w-5 text-purple-400" />,
      bg: "from-purple-500/10 to-purple-500/5",
      border: "border-purple-500/20"
    },
    {
      title: "Total Cost/Mile",
      value: "$0.58",
      trend: "-2.3%",
      isPositive: true,
      icon: <DollarSign className="h-5 w-5 text-indigo-400" />,
      bg: "from-indigo-500/10 to-indigo-500/5",
      border: "border-indigo-500/20"
    },
    {
      title: "Avg Response Time",
      value: "14.2 min",
      trend: "-18%",
      isPositive: true,
      icon: <Clock className="h-5 w-5 text-cyan-400" />,
      bg: "from-cyan-500/10 to-cyan-500/5",
      border: "border-cyan-500/20"
    }
  ]

  return (
    <ScrollArea className="h-full bg-[#0a0f1c]">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h2>
            <p className="text-sm text-slate-400 mt-1">Real-time fleet performance metrics</p>
          </div>
          <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="analytics-kpi-grid">
          {kpis.map((kpi, index) => (
            <Card key={index} data-testid={`analytics-kpi-${index}`} className={`bg-gradient-to-br ${kpi.bg} border-white/5 backdrop-blur-sm`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-white/5 border ${kpi.border || 'border-white/10'}`}>
                    {kpi.icon}
                  </div>
                  {kpi.trend && (
                    <Badge variant="outline" className={`bg-black/20 border-white/10 ${kpi.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {kpi.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {kpi.trend}
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-400 block mb-1">{kpi.title}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white tracking-tight">{kpi.value}</span>
                    {kpi.subtitle && (
                      <span className="text-xs text-slate-500">{kpi.subtitle}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#0f1526]/50 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-200">Fleet Utilization Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg border border-white/5 flex items-center justify-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <LineChart className="h-8 w-8 opacity-50" />
                  <span className="text-sm">Utilization Data Visualization</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1526]/50 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-200">Cost Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full bg-gradient-to-t from-purple-500/10 to-transparent rounded-lg border border-white/5 flex items-center justify-center text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <PieChart className="h-8 w-8 opacity-50" />
                  <span className="text-sm">Cost Breakdown Visualization</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

// Data Analysis Panel
const DataAnalysis = ({ vehicles, _workOrders, _facilities }: { vehicles: Vehicle[] | null; _workOrders: unknown; _facilities: unknown }) => {
  const [selectedMetric, setSelectedMetric] = useState('utilization')
  const [dateRange, setDateRange] = useState('30d')

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Data Analysis</h2>
            <p className="text-muted-foreground">Detailed fleet analytics and insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32" data-testid="analytics-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList data-testid="analytics-metric-tabs">
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="fuel">Fuel</TabsTrigger>
          </TabsList>

          <TabsContent value="utilization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Utilization Analysis</CardTitle>
                <CardDescription>Vehicle usage patterns and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mr-3" />
                    <span>Utilization charts will appear here</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{vehicles?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Vehicles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{vehicles?.filter((v: Vehicle) => v.status === 'active').length || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Now</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">72%</div>
                      <div className="text-sm text-muted-foreground">Avg Utilization</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Total cost of ownership and operating expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mr-3" />
                  <span>Cost analysis charts will appear here</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Analytics</CardTitle>
                <CardDescription>Service trends and maintenance efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mr-3" />
                  <span>Maintenance charts will appear here</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Analytics</CardTitle>
                <CardDescription>Fuel consumption and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <Fuel className="h-12 w-12 mr-3" />
                  <span>Fuel charts will appear here</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}

// Custom Report Builder Panel
const ReportBuilder = () => {
  const [reportType, setReportType] = useState('summary')

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Custom Report Builder</h2>
          <p className="text-muted-foreground">Create and export custom analytics reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="report-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Fleet Summary</SelectItem>
                  <SelectItem value="utilization">Utilization Report</SelectItem>
                  <SelectItem value="maintenance">Maintenance Report</SelectItem>
                  <SelectItem value="cost">Cost Analysis</SelectItem>
                  <SelectItem value="fuel">Fuel Efficiency</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select defaultValue="30d">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                  <SelectItem value="custom">Custom range...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filters</label>
              <Button variant="outline" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Add filters...
              </Button>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button className="flex-1" data-testid="generate-report-btn">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}