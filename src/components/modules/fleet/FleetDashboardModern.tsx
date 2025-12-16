/**
 * Modern Fleet Dashboard - No-Scroll Grid Layout
 * Optimized for 1920x1080 displays with enterprise-grade design
 * Following Datadog/Grafana/Azure Portal design patterns
 */

import { useMemo, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompactMetricCard } from "@/components/dashboard/CompactMetricCard"
import { MiniChart, MiniDonutChart } from "@/components/dashboard/MiniChart"
import { CompactVehicleList } from "@/components/dashboard/CompactVehicleList"
import { AlertsFeed, ActivityFeed } from "@/components/dashboard/AlertsFeed"
import { AddVehicleDialog } from "@/components/dialogs/AddVehicleDialog"
import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import {
  Car,
  Pulse,
  BatteryMedium,
  Wrench,
  Warning,
  Lightning,
  MapPin,
  MagnifyingGlass,
  Circle,
  Broadcast,
  ChartLine,
  Bell,
  List,
  ChartLineUp
} from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useInspect } from "@/services/inspect/InspectContext"
import { cn } from "@/lib/utils"
import "@/styles/dashboard-layout.css"

export function FleetDashboardModern() {
  // Call useFleetData internally instead of receiving as prop
  const data = useFleetData()
  const initialVehicles = data.vehicles || []

  // Drilldown and inspect contexts
  const { push: drilldownPush } = useDrilldown()
  const { openInspect } = useInspect()

  // Real-time telemetry
  const {
    isConnected: isRealtimeConnected,
    isEmulatorRunning,
    lastUpdate: lastTelemetryUpdate,
    vehicles: realtimeVehicles,
    emulatorStats,
    recentEvents
  } = useVehicleTelemetry({
    enabled: true,
    initialVehicles,
    onVehicleUpdate: (vehicleId, update) => {
      console.debug(`[FleetDashboard] Real-time update for ${vehicleId}`, update)
    }
  })

  // Merge vehicles with real-time data
  const vehicles = useMemo(() => {
    if (realtimeVehicles.length > 0) {
      const merged = new Map<string, Vehicle>()
      initialVehicles.forEach(v => merged.set(v.id, v))
      realtimeVehicles.forEach(v => {
        const existing = merged.get(v.id)
        if (existing) {
          merged.set(v.id, { ...existing, ...v })
        } else {
          merged.set(v.id, v)
        }
      })
      return Array.from(merged.values())
    }
    return initialVehicles
  }, [initialVehicles, realtimeVehicles])

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [selectedView, setSelectedView] = useState<"overview" | "analytics">("overview")

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesStatus = statusFilter === "all" || v.status === statusFilter
      const matchesRegion = regionFilter === "all" || v.region === regionFilter
      const matchesSearch = !searchQuery || searchQuery === "" ||
        v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesRegion && matchesSearch
    })
  }, [vehicles, statusFilter, regionFilter, searchQuery])

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredVehicles.length
    const active = filteredVehicles.filter(v => v.status === "active").length
    const idle = filteredVehicles.filter(v => v.status === "idle").length
    const charging = filteredVehicles.filter(v => v.status === "charging").length
    const service = filteredVehicles.filter(v => v.status === "service").length
    const emergency = filteredVehicles.filter(v => v.status === "emergency").length
    const lowFuel = filteredVehicles.filter(v => v.fuelLevel < 25).length
    const alerts = filteredVehicles.filter(v => (v.alerts?.length || 0) > 0).length
    const avgFuelLevel = total > 0
      ? Math.round(filteredVehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / total)
      : 0

    return { total, active, idle, charging, service, emergency, lowFuel, alerts, avgFuelLevel }
  }, [filteredVehicles])

  const regions = Array.from(new Set(vehicles.map(v => v.region))) as string[]

  // Drilldown handlers
  const handleVehicleDrilldown = useCallback((vehicle: Vehicle) => {
    openInspect({ type: 'vehicle', id: vehicle.id })
    drilldownPush({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle',
      label: `${vehicle.number} - ${vehicle.make} ${vehicle.model}`,
      data: { vehicleId: vehicle.id, vehicle }
    })
  }, [drilldownPush, openInspect])

  const handleMetricDrilldown = useCallback((metricType: string, value: number | string, label: string) => {
    drilldownPush({
      id: `metric-${metricType}`,
      type: 'metric-detail',
      label: `${label} - ${value}`,
      data: { metricType, value, label }
    })
  }, [drilldownPush])

  // Chart data
  const statusChartData = useMemo(() => [
    { label: "Active", value: metrics.active, color: "bg-green-500 dark:bg-green-400" },
    { label: "Idle", value: metrics.idle, color: "bg-gray-500 dark:bg-gray-400" },
    { label: "Charging", value: metrics.charging, color: "bg-blue-500 dark:bg-blue-400" },
    { label: "Service", value: metrics.service, color: "bg-amber-500 dark:bg-amber-400" },
    { label: "Emergency", value: metrics.emergency, color: "bg-red-500 dark:bg-red-400" }
  ], [metrics])

  const regionChartData = useMemo(() =>
    regions.map(region => ({
      label: region,
      value: filteredVehicles.filter(v => v.region === region).length
    })),
    [regions, filteredVehicles]
  )

  const fuelTrendData = useMemo(() => {
    // Simulate 24-hour fuel trend
    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map(h => ({
      label: `${h}:00`,
      value: 60 + Math.sin(h / 4) * 20 + Math.random() * 10
    }))
  }, [])

  const utilizationData = useMemo(() => {
    const last7Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return last7Days.map(day => ({
      label: day,
      value: Math.floor(Math.random() * 40) + 60
    }))
  }, [])

  // Mock alerts data
  const mockAlerts = useMemo(() => [
    {
      id: '1',
      type: 'critical' as const,
      title: 'Low Battery Warning',
      message: 'Vehicle battery level critically low. Immediate charging required.',
      vehicleName: 'TRK-001',
      timestamp: new Date(Date.now() - 5 * 60000),
      isRead: false
    },
    {
      id: '2',
      type: 'warning' as const,
      title: 'Maintenance Due',
      message: 'Scheduled maintenance is overdue by 3 days.',
      vehicleName: 'VAN-042',
      timestamp: new Date(Date.now() - 15 * 60000),
      isRead: false
    },
    {
      id: '3',
      type: 'info' as const,
      title: 'Service Completed',
      message: 'Regular maintenance completed successfully.',
      vehicleName: 'CAR-123',
      timestamp: new Date(Date.now() - 30 * 60000),
      isRead: true
    }
  ], [])

  // Mock activity data
  const mockActivities = useMemo(() =>
    recentEvents.map((event, idx) => ({
      id: `activity-${idx}`,
      type: event.type,
      vehicleId: event.vehicleId,
      vehicleName: vehicles.find(v => v.id === event.vehicleId)?.number,
      description: `Status update received`,
      timestamp: new Date(event.timestamp || Date.now())
    })),
    [recentEvents, vehicles]
  )

  return (
    <div className="dashboard-container">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-title">
          <Car className="w-5 h-5 text-primary" weight="fill" />
          <span>Fleet Dashboard</span>
          {/* Live Indicator */}
          {isRealtimeConnected && (
            <div className="live-indicator">
              <div className="live-indicator-dot" />
              <span>LIVE</span>
            </div>
          )}
          {isEmulatorRunning && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
              <Broadcast className="w-3 h-3 mr-1 animate-pulse" />
              Emulator Active
            </Badge>
          )}
        </div>

        <div className="dashboard-header-actions">
          {/* Search */}
          <div className="relative w-64">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Filters */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AddVehicleDialog onAdd={data.addVehicle} />
        </div>
      </div>

      {/* Stats Bar - Compact Metrics */}
      <div className="dashboard-stats-bar">
        <CompactMetricCard
          title="Total Vehicles"
          value={metrics.total}
          subtitle={`${metrics.active} active now`}
          icon={<Car className="w-5 h-5" />}
          status="info"
          onClick={() => handleMetricDrilldown('total', metrics.total, 'Total Vehicles')}
        />
        <CompactMetricCard
          title="Active Vehicles"
          value={metrics.active}
          change={5.2}
          trend="up"
          subtitle="on the road"
          icon={<Pulse className="w-5 h-5" />}
          status="success"
        />
        <CompactMetricCard
          title="Avg Fuel Level"
          value={`${metrics.avgFuelLevel}%`}
          change={metrics.lowFuel > 5 ? 3.1 : 0}
          trend={metrics.lowFuel > 5 ? "down" : "neutral"}
          subtitle={`${metrics.lowFuel} low fuel`}
          icon={<BatteryMedium className="w-5 h-5" />}
          status={metrics.lowFuel > 5 ? "warning" : "success"}
        />
        <CompactMetricCard
          title="Service Required"
          value={metrics.service}
          change={metrics.alerts > 10 ? 12 : 0}
          trend={metrics.alerts > 10 ? "up" : "neutral"}
          subtitle={`${metrics.alerts} alerts`}
          icon={<Wrench className="w-5 h-5" />}
          status={metrics.service > 5 ? "warning" : "info"}
        />
        <CompactMetricCard
          title="Critical Alerts"
          value={mockAlerts.filter(a => a.type === 'critical').length}
          subtitle="requires attention"
          icon={<Warning className="w-5 h-5" />}
          status="error"
        />
      </div>

      {/* Main Grid - 2x2 Layout */}
      <div className="dashboard-main-grid" id="main-content">
        {/* Map Section - Left Column (Full Height) */}
        <div className="dashboard-map-section">
          <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="h-full flex flex-col">
            <div className="compact-card-header flex-shrink-0">
              <div className="compact-card-title">
                <MapPin className="w-4 h-4" />
                Fleet Overview
              </div>
              <TabsList className="h-7">
                <TabsTrigger value="overview" className="text-xs h-6">Map</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs h-6">Vehicles</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="flex-1 m-0 p-0 overflow-hidden">
              <ProfessionalFleetMap
                vehicles={filteredVehicles}
                facilities={data.facilities}
                height="100%"
                onVehicleSelect={(vehicleId) => {
                  const vehicle = filteredVehicles.find(v => v.id === vehicleId)
                  if (vehicle) handleVehicleDrilldown(vehicle)
                }}
                showLegend={true}
                enableRealTime={isRealtimeConnected}
              />
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 m-0 overflow-hidden">
              <CompactVehicleList
                vehicles={filteredVehicles}
                onVehicleClick={handleVehicleDrilldown}
                showRealtimeIndicator={isRealtimeConnected}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Charts Section - Top Right (2x2 Grid) */}
        <div className="dashboard-charts-section">
          <MiniDonutChart
            title="Fleet Status"
            data={statusChartData}
            total={metrics.total}
          />

          <MiniChart
            title="Regional Distribution"
            data={regionChartData}
            type="bar"
            color="blue"
            currentValue={`${regions.length} regions`}
          />

          <MiniChart
            title="Fuel Trend (24h)"
            data={fuelTrendData.slice(-12)}
            type="line"
            color="green"
            currentValue={`${metrics.avgFuelLevel}%`}
          />

          <MiniChart
            title="Utilization (7d)"
            data={utilizationData}
            type="sparkline"
            color="purple"
            currentValue="87%"
          />
        </div>

        {/* Activity Section - Bottom Right */}
        <div className="dashboard-activity-section">
          <Tabs defaultValue="alerts" className="h-full flex flex-col">
            <div className="compact-card-header flex-shrink-0">
              <div className="compact-card-title">
                <ChartLineUp className="w-4 h-4" />
                Activity
              </div>
              <TabsList className="h-7">
                <TabsTrigger value="alerts" className="text-xs h-6">
                  <Bell className="w-3 h-3 mr-1" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="feed" className="text-xs h-6">
                  <Broadcast className="w-3 h-3 mr-1" />
                  Live Feed
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="alerts" className="flex-1 m-0 overflow-hidden">
              <div className="h-full">
                <AlertsFeed
                  alerts={mockAlerts}
                  onAlertClick={(alert) => console.log('Alert clicked:', alert)}
                />
              </div>
            </TabsContent>

            <TabsContent value="feed" className="flex-1 m-0 overflow-hidden">
              <div className="h-full">
                <ActivityFeed activities={mockActivities} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer - Status Bar */}
      <div className="dashboard-footer">
        <div className="dashboard-footer-status">
          <div className="flex items-center gap-2">
            <Circle className={cn("w-2 h-2 fill-current", isRealtimeConnected ? "text-green-500 animate-pulse" : "text-gray-400")} weight="fill" />
            <span>{isRealtimeConnected ? "Connected" : "Offline"}</span>
          </div>
          {lastTelemetryUpdate && (
            <span>Last update: {lastTelemetryUpdate.toLocaleTimeString()}</span>
          )}
          {emulatorStats && (
            <span>Emulator: {emulatorStats.eventsPerSecond.toFixed(1)} events/sec</span>
          )}
        </div>

        <div className="dashboard-footer-info">
          <span>{filteredVehicles.length} vehicles displayed</span>
          <span>•</span>
          <span>{mockAlerts.filter(a => !a.isRead).length} unread alerts</span>
          <span>•</span>
          <span>Fleet Manager v2.0</span>
        </div>
      </div>
    </div>
  )
}
