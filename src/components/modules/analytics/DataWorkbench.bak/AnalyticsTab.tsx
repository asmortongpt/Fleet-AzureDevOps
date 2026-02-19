import {
  CheckCircle,
  TrendUp,
  TrendDown
} from "@phosphor-icons/react"
import { useMemo } from "react"

import { MaintenanceRecord, FuelRecord } from "./types"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ResponsiveBarChart, ResponsiveLineChart } from "@/components/visualizations"
import { Vehicle } from "@/lib/types"

interface AnalyticsTabProps {
  vehicles: Vehicle[]
  fuelRecords: FuelRecord[]
  maintenanceRecords: MaintenanceRecord[]
  timeRange: string
  onTimeRangeChange: (value: string) => void
}

export function AnalyticsTab({
  vehicles,
  fuelRecords,
  maintenanceRecords,
  timeRange,
  onTimeRangeChange
}: AnalyticsTabProps) {
  const analyticsMetrics = useMemo(() => {
    const activeVehicles = (vehicles || []).filter(v => v.status === "active")
    const totalMileage = (vehicles || []).reduce((sum, v) => sum + v.mileage, 0)
    const avgMilesPerDay = vehicles.length > 0 ? totalMileage / vehicles.length / 365 : 0

    const daysAgo = parseInt(timeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const recentFuelRecords = fuelRecords.filter(r => new Date(r.date) >= cutoffDate)
    const recentMaintenanceRecords = maintenanceRecords.filter(r =>
      new Date(r.date) >= cutoffDate && r.status === "completed"
    )

    const fuelCost = recentFuelRecords.reduce((sum, r) => sum + r.cost, 0)
    const maintenanceCost = recentMaintenanceRecords.reduce((sum, r) => sum + r.cost, 0)
    const totalCost = fuelCost + maintenanceCost
    const costPerVehicle = vehicles.length > 0 ? totalCost / vehicles.length : 0

    const vehicleMPGs = new Map<string, number[]>()
    recentFuelRecords.forEach(r => {
      const mpgs = vehicleMPGs.get(r.vehicleNumber) || []
      mpgs.push(r.mpg)
      vehicleMPGs.set(r.vehicleNumber, mpgs)
    })

    let mostEfficient = { vehicle: "N/A", mpg: 0 }
    vehicleMPGs.forEach((mpgs, vehicleNum) => {
      const avgMPG = mpgs.reduce((a, b) => a + b, 0) / mpgs.length
      if (avgMPG > mostEfficient.mpg) {
        const vehicle = (vehicles || []).find(v => v.number === vehicleNum)
        mostEfficient = {
          vehicle: vehicle ? `${vehicle.number} (${vehicle.make} ${vehicle.model})` : vehicleNum,
          mpg: avgMPG
        }
      }
    })

    return {
      activeVehicles: activeVehicles.length,
      totalVehicles: vehicles.length,
      avgMilesPerDay: avgMilesPerDay.toFixed(1),
      totalCost: totalCost.toFixed(2),
      costPerVehicle: costPerVehicle.toFixed(2),
      fuelCost: fuelCost.toFixed(2),
      maintenanceCost: maintenanceCost.toFixed(2),
      mostEfficient
    }
  }, [vehicles, fuelRecords, maintenanceRecords, timeRange])

  const utilizationByDepartment = useMemo(() => {
    const grouped = new Map<string, { total: number; active: number }>()
    vehicles.forEach((vehicle) => {
      const dept = vehicle.department || "Unassigned"
      if (!grouped.has(dept)) grouped.set(dept, { total: 0, active: 0 })
      const entry = grouped.get(dept)!
      entry.total += 1
      if (vehicle.status === "active") entry.active += 1
    })

    return Array.from(grouped.entries()).map(([name, entry]) => ({
      name,
      utilization: entry.total > 0 ? Math.round((entry.active / entry.total) * 100) : 0,
      count: entry.total
    }))
  }, [vehicles])

  const costTrendData = useMemo(() => {
    const daysAgo = parseInt(timeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const buckets = new Map<string, { name: string; fuel: number; maintenance: number }>()

    fuelRecords.forEach((record) => {
      const recordDate = new Date(record.date)
      if (recordDate < cutoffDate) return
      const key = recordDate.toISOString().split("T")[0]
      const label = recordDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const existing = buckets.get(key) || { name: label, fuel: 0, maintenance: 0 }
      existing.fuel += record.cost
      buckets.set(key, existing)
    })

    maintenanceRecords
      .filter((record) => new Date(record.date) >= cutoffDate)
      .forEach((record) => {
        const recordDate = new Date(record.date)
        const key = recordDate.toISOString().split("T")[0]
        const label = recordDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        const existing = buckets.get(key) || { name: label, fuel: 0, maintenance: 0 }
        existing.maintenance += record.cost
        buckets.set(key, existing)
      })

    return Array.from(buckets.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([, value]) => ({
        name: value.name,
        fuel: Number(value.fuel.toFixed(2)),
        maintenance: Number(value.maintenance.toFixed(2)),
        total: Number((value.fuel + value.maintenance).toFixed(2))
      }))
  }, [fuelRecords, maintenanceRecords, timeRange])

  const topPerformers = useMemo(() => {
    const efficiency = analyticsMetrics.mostEfficient

    const costsByVehicle = new Map<string, { cost: number; miles: number }>()
    fuelRecords.forEach((record) => {
      const entry = costsByVehicle.get(record.vehicleNumber) || { cost: 0, miles: 0 }
      entry.cost += record.cost
      entry.miles += record.mpg * record.gallons
      costsByVehicle.set(record.vehicleNumber, entry)
    })

    let lowestCost = { vehicle: "N/A", costPerMile: 0 }
    costsByVehicle.forEach((entry, vehicleNumber) => {
      const costPerMile = entry.miles > 0 ? entry.cost / entry.miles : 0
      if (costPerMile > 0 && (lowestCost.costPerMile === 0 || costPerMile < lowestCost.costPerMile)) {
        const vehicle = vehicles.find(v => v.number === vehicleNumber)
        lowestCost = {
          vehicle: vehicle ? `${vehicle.number} (${vehicle.make} ${vehicle.model})` : vehicleNumber,
          costPerMile
        }
      }
    })

    const maintenanceCounts = new Map<string, number>()
    maintenanceRecords.forEach((record) => {
      maintenanceCounts.set(record.vehicleNumber, (maintenanceCounts.get(record.vehicleNumber) || 0) + 1)
    })

    let mostReliable = { vehicle: "N/A", count: 0 }
    maintenanceCounts.forEach((count, vehicleNumber) => {
      if (mostReliable.vehicle === "N/A" || count < mostReliable.count) {
        const vehicle = vehicles.find(v => v.number === vehicleNumber)
        mostReliable = {
          vehicle: vehicle ? `${vehicle.number} (${vehicle.make} ${vehicle.model})` : vehicleNumber,
          count
        }
      }
    })

    return { efficiency, lowestCost, mostReliable }
  }, [analyticsMetrics, fuelRecords, maintenanceRecords, vehicles])

  const totalCostValue = Number(analyticsMetrics.totalCost)
  const fuelCostValue = Number(analyticsMetrics.fuelCost)
  const maintenanceCostValue = Number(analyticsMetrics.maintenanceCost)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Fleet Analytics</h2>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold">
              {analyticsMetrics.totalVehicles > 0
                ? ((analyticsMetrics.activeVehicles / analyticsMetrics.totalVehicles) * 100).toFixed(1)
                : "0.0"}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {analyticsMetrics.activeVehicles} of {analyticsMetrics.totalVehicles} vehicles active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Miles per Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold">
              {analyticsMetrics.avgMilesPerDay}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              per vehicle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Efficient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate">
              {analyticsMetrics.mostEfficient.vehicle}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {analyticsMetrics.mostEfficient.mpg.toFixed(1)} MPG average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cost Analysis (Last {timeRange} days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Operating Cost</span>
                <span className="font-semibold text-sm">${analyticsMetrics.totalCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cost per Vehicle</span>
                <span className="font-medium">${analyticsMetrics.costPerVehicle}</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-3">Cost Breakdown</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Fuel</span>
                    <span className="text-sm font-medium">${analyticsMetrics.fuelCost}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${totalCostValue > 0 ? (fuelCostValue / totalCostValue) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Maintenance</span>
                    <span className="text-sm font-medium">${analyticsMetrics.maintenanceCost}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{
                        width: `${totalCostValue > 0 ? (maintenanceCostValue / totalCostValue) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {utilizationByDepartment.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vehicle Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No utilization data available for the selected range.
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveBarChart
            title="Vehicle Utilization"
            description="Active rate by department"
            data={utilizationByDepartment}
            dataKeys={["utilization"]}
            colors={["#3b82f6"]}
            height={260}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Category</th>
                  <th className="text-left p-2 font-medium">Vehicle</th>
                  <th className="text-left p-2 font-medium">Metric</th>
                  <th className="text-left p-2 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-2 font-medium">Most Efficient</td>
                  <td className="p-2">
                    <p className="font-medium">{topPerformers.efficiency.vehicle}</p>
                  </td>
                  <td className="p-2">Fuel Economy</td>
                  <td className="p-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <TrendUp className="w-3 h-3 mr-1" />
                      {topPerformers.efficiency.mpg > 0
                        ? `${topPerformers.efficiency.mpg.toFixed(1)} MPG`
                        : "N/A"}
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-2 font-medium">Most Reliable</td>
                  <td className="p-2">
                    <p className="font-medium">{topPerformers.mostReliable.vehicle}</p>
                  </td>
                  <td className="p-2">Maintenance Events</td>
                  <td className="p-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {topPerformers.mostReliable.vehicle === "N/A"
                        ? "N/A"
                        : `${topPerformers.mostReliable.count} events`}
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-2 font-medium">Lowest Cost</td>
                  <td className="p-2">
                    <p className="font-medium">{topPerformers.lowestCost.vehicle}</p>
                  </td>
                  <td className="p-2">Operating Cost</td>
                  <td className="p-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <TrendDown className="w-3 h-3 mr-1" />
                      {topPerformers.lowestCost.costPerMile > 0
                        ? `$${topPerformers.lowestCost.costPerMile.toFixed(2)}/mi`
                        : "N/A"}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {costTrendData.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No cost trend data available for the selected range.
            </div>
          </CardContent>
        </Card>
      ) : (
        <ResponsiveLineChart
          title="Cost Trends"
          description={`Last ${timeRange} days`}
          data={costTrendData}
          dataKeys={["fuel", "maintenance", "total"]}
          height={260}
          showArea
          showTrend
        />
      )}
    </div>
  )
}
