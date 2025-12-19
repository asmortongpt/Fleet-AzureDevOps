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
import React, { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVehicles, useWorkOrders, useFacilities, useDrivers } from "@/hooks/use-api"

// Executive Dashboard Panel
const ExecutiveDashboard = ({ vehicles, workOrders, drivers }) => {
  const totalVehicles = vehicles?.length || 0
  const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0
  const pendingOrders = workOrders?.filter(wo => wo.status === 'pending').length || 0
  const completedOrders = workOrders?.filter(wo => wo.status === 'completed').length || 0

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
      icon: <Gauge className="h-4 w-4" />
    },
    {
      title: "Active Vehicles",
      value: activeVehicles,
      subtitle: `of ${totalVehicles} total`,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      title: "Maintenance Completion",
      value: `${completionRate}%`,
      trend: "+12.4%",
      isPositive: true,
      icon: <Wrench className="h-4 w-4" />
    },
    {
      title: "Avg Fuel Cost",
      value: "$3.45",
      trend: "-0.8%",
      isPositive: true,
      icon: <Fuel className="h-4 w-4" />
    },
    {
      title: "Total Cost/Mile",
      value: "$0.58",
      trend: "-2.3%",
      isPositive: true,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: "Avg Response Time",
      value: "14.2 min",
      trend: "-18%",
      isPositive: true,
      icon: <Clock className="h-4 w-4" />
    }
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Executive Dashboard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Key performance indicators at a glance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" data-testid="analytics-kpi-grid">
          {kpis.map((kpi, index) => (
            <Card key={index} data-testid={`analytics-kpi-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{kpi.title}</span>
                  <div className="text-muted-foreground">{kpi.icon}</div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{kpi.value}</span>
                  {kpi.trend && (
                    <Badge variant={kpi.isPositive ? "default" : "destructive"} className="text-xs">
                      {kpi.isPositive ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {kpi.trend}
                    </Badge>
                  )}
                </div>
                {kpi.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fleet Utilization Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <LineChart className="h-8 w-8 mr-2" />
                <span>Chart visualization coming soon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <PieChart className="h-8 w-8 mr-2" />
                <span>Chart visualization coming soon</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

// Data Analysis Panel
const DataAnalysis = ({ vehicles, workOrders, facilities }) => {
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
                      <div className="text-2xl font-bold">{vehicles?.filter(v => v.status === 'active').length || 0}</div>
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
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No reports generated yet
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// Main Analytics Workspace Component
export function AnalyticsWorkspace({ data }: { data?: any }) {
  const [activeView, setActiveView] = useState('executive')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: workOrders = [] } = useWorkOrders()
  const { data: facilities = [] } = useFacilities()
  const { data: drivers = [] } = useDrivers()

  return (
    <div className="h-screen flex flex-col" data-testid="analytics-workspace">
      {/* Header - Responsive */}
      <div className="border-b px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Analytics Workspace</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Comprehensive fleet analytics and reporting
            </p>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Tabs - Responsive */}
      <div className="border-b px-2 py-2 sm:px-4 overflow-x-auto">
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList data-testid="analytics-view-tabs" className="w-full sm:w-auto">
            <TabsTrigger
              value="executive"
              data-testid="analytics-tab-executive"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Executive Dashboard</span>
              <span className="sm:hidden ml-1">Executive</span>
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              data-testid="analytics-tab-analysis"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Data Analysis</span>
              <span className="sm:hidden ml-1">Analysis</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              data-testid="analytics-tab-reports"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Report Builder</span>
              <span className="sm:hidden ml-1">Reports</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'executive' && (
          <ExecutiveDashboard
            vehicles={vehicles}
            workOrders={workOrders}
            drivers={drivers}
          />
        )}
        {activeView === 'analysis' && (
          <DataAnalysis
            vehicles={vehicles}
            workOrders={workOrders}
            facilities={facilities}
          />
        )}
        {activeView === 'reports' && <ReportBuilder />}
      </div>
    </div>
  )
}
