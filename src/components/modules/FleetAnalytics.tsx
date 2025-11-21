import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ChartLine,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  GasPump,
  Wrench,
  CarProfile,
  Clock
} from "@phosphor-icons/react"
import { MetricCard } from "@/components/MetricCard"
import { ChartCard } from "@/components/ChartCard"
import { useState } from "react"
import { useFleetData } from "@/hooks/use-fleet-data"

interface FleetAnalyticsProps {
  data?: any
  data: ReturnType<typeof useFleetData>
}

export function FleetAnalytics({ data }: FleetAnalyticsProps) {
  const vehicles = data.vehicles || []
  const fuelTransactions = data.fuelTransactions || []
  const workOrders = data.workOrders || []

  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
  const [activeTab, setActiveTab] = useState<string>("overview")

  const monthlyFleetData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((name, i) => {
      const activeCount = Math.floor(Math.random() * 15 + 35)
      return {
        name,
        active: activeCount,
        idle: Math.floor(Math.random() * 10 + 5),
        service: Math.floor(Math.random() * 5 + 2),
        utilization: Math.floor((activeCount / 50) * 100)
      }
    })
  }, [])

  const costAnalysis = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map(name => ({
      name,
      fuel: Math.floor(Math.random() * 15000 + 25000),
      maintenance: Math.floor(Math.random() * 10000 + 15000),
      insurance: Math.floor(Math.random() * 5000 + 8000)
    }))
  }, [])

  const utilizationByType = useMemo(() => {
    const types = ["Sedan", "SUV", "Truck", "Van", "Emergency"]
    return types.map(name => ({
      name,
      utilization: Math.floor(Math.random() * 30 + 65),
      count: vehicles.filter(v => v.type.toLowerCase() === name.toLowerCase()).length
    }))
  }, [vehicles])

  const metrics = useMemo(() => {
    const totalFuelCost = fuelTransactions.reduce((sum, t) => sum + t.totalCost, 0)
    const totalMaintenanceCost = workOrders
      .filter(w => w.cost)
      .reduce((sum, w) => sum + (w.cost || 0), 0)
    
    const activeVehicles = vehicles.filter(v => v.status === "active").length
    const utilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0
    
    const avgMileage = vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length)
      : 0

    const downtime = vehicles.filter(v => v.status === "service").length

    return {
      totalFleet: vehicles.length,
      utilization,
      totalFuelCost,
      totalMaintenanceCost,
      avgMileage,
      downtime
    }
  }, [vehicles, fuelTransactions, workOrders])

  const kpis = useMemo(() => {
    return {
      costPerVehicle: metrics.totalFleet > 0 
        ? Math.round((metrics.totalFuelCost + metrics.totalMaintenanceCost) / metrics.totalFleet)
        : 0,
      costPerMile: metrics.avgMileage > 0
        ? ((metrics.totalFuelCost + metrics.totalMaintenanceCost) / (metrics.avgMileage * metrics.totalFleet)).toFixed(2)
        : "0.00",
      downtimeRate: metrics.totalFleet > 0
        ? ((metrics.downtime / metrics.totalFleet) * 100).toFixed(1)
        : "0.0",
      fuelEfficiency: fuelTransactions.length > 0
        ? (fuelTransactions.reduce((sum, t) => sum + t.mpg, 0) / fuelTransactions.length).toFixed(1)
        : "0.0"
    }
  }, [metrics, fuelTransactions])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Fleet Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive analytics and performance insights</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="kpis">Key Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Fleet Size"
              value={metrics.totalFleet}
              subtitle="vehicles"
              icon={<CarProfile className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Fleet Utilization"
              value={`${metrics.utilization}%`}
              trend="up"
              change={3.2}
              subtitle="vs last period"
              icon={<TrendUp className="w-5 h-5" />}
              status="success"
            />
            <MetricCard
              title="Avg Mileage"
              value={`${metrics.avgMileage.toLocaleString()}mi`}
              subtitle="per vehicle"
              icon={<ChartLine className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Vehicles in Service"
              value={metrics.downtime}
              subtitle="requiring attention"
              icon={<Wrench className="w-5 h-5" />}
              status={metrics.downtime > 5 ? "warning" : "success"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Fleet Status Over Time"
              subtitle="Monthly vehicle status breakdown"
              type="area"
              data={monthlyFleetData}
              dataKey="active"
              color="oklch(0.45 0.15 250)"
            />
            <ChartCard
              title="Fleet Utilization Rate"
              subtitle="Percentage of fleet in active use"
              type="line"
              data={monthlyFleetData}
              dataKey="utilization"
              color="oklch(0.75 0.12 210)"
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Fuel Cost"
              value={`$${metrics.totalFuelCost.toLocaleString()}`}
              trend="up"
              change={8.5}
              subtitle="vs last period"
              icon={<GasPump className="w-5 h-5" />}
              status="warning"
            />
            <MetricCard
              title="Maintenance Cost"
              value={`$${metrics.totalMaintenanceCost.toLocaleString()}`}
              trend="down"
              change={2.3}
              subtitle="vs last period"
              icon={<Wrench className="w-5 h-5" />}
              status="success"
            />
            <MetricCard
              title="Cost per Vehicle"
              value={`$${kpis.costPerVehicle.toLocaleString()}`}
              subtitle="average total cost"
              icon={<CurrencyDollar className="w-5 h-5" />}
              status="info"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Cost Analysis Breakdown"
              subtitle="Monthly operating costs by category"
              type="bar"
              data={costAnalysis}
              dataKey="fuel"
              color="oklch(0.45 0.15 250)"
            />
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Fuel</span>
                      <span className="text-sm font-semibold">${metrics.totalFuelCost.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ 
                          width: `${(metrics.totalFuelCost / (metrics.totalFuelCost + metrics.totalMaintenanceCost)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Maintenance</span>
                      <span className="text-sm font-semibold">${metrics.totalMaintenanceCost.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent"
                        style={{ 
                          width: `${(metrics.totalMaintenanceCost / (metrics.totalFuelCost + metrics.totalMaintenanceCost)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Operating Cost</span>
                      <span className="font-semibold text-lg">
                        ${(metrics.totalFuelCost + metrics.totalMaintenanceCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Utilization by Vehicle Type"
              subtitle="Average utilization percentage by category"
              type="bar"
              data={utilizationByType}
              dataKey="utilization"
              color="oklch(0.65 0.15 160)"
            />
            <Card>
              <CardHeader>
                <CardTitle>Fleet Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {utilizationByType.map(type => (
                    <div key={type.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{type.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {type.count} vehicles
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold">{type.utilization}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            type.utilization >= 80 ? "bg-success" :
                            type.utilization >= 60 ? "bg-accent" :
                            "bg-warning"
                          }`}
                          style={{ width: `${type.utilization}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <CurrencyDollar className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Cost per Mile</p>
                </div>
                <p className="text-3xl font-semibold">${kpis.costPerMile}</p>
                <p className="text-sm text-muted-foreground mt-1">fleet average</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <GasPump className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Fuel Efficiency</p>
                </div>
                <p className="text-3xl font-semibold">{kpis.fuelEfficiency} MPG</p>
                <p className="text-sm text-muted-foreground mt-1">fleet average</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Downtime Rate</p>
                </div>
                <p className="text-3xl font-semibold">{kpis.downtimeRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">of total fleet</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <TrendUp className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                </div>
                <p className="text-3xl font-semibold">{metrics.utilization}%</p>
                <p className="text-sm text-muted-foreground mt-1">fleet efficiency</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <TrendUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Fleet Utilization Improving</h4>
                    <p className="text-sm text-muted-foreground">
                      Fleet utilization has increased by 3.2% compared to last period, indicating better resource allocation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning">
                    <GasPump className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Fuel Costs Rising</h4>
                    <p className="text-sm text-muted-foreground">
                      Fuel expenses have increased by 8.5%. Consider fuel efficiency training or route optimization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Maintenance Costs Decreasing</h4>
                    <p className="text-sm text-muted-foreground">
                      Maintenance expenses down by 2.3%, suggesting effective preventive maintenance practices.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
