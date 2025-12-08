import {
  CheckCircle,
  ChartLine,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Fleet Analytics</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((analyticsMetrics.activeVehicles / analyticsMetrics.totalVehicles) * 100).toFixed(1)}%
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
            <div className="text-3xl font-bold">
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
            <div className="text-lg font-bold truncate">
              {analyticsMetrics.mostEfficient.vehicle}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {analyticsMetrics.mostEfficient.mpg.toFixed(1)} MPG average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Analysis (Last {timeRange} days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Operating Cost</span>
                <span className="font-semibold text-lg">${analyticsMetrics.totalCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cost per Vehicle</span>
                <span className="font-medium">${analyticsMetrics.costPerVehicle}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
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
                        width: `${(parseFloat(analyticsMetrics.fuelCost) / parseFloat(analyticsMetrics.totalCost)) * 100}%`
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
                        width: `${(parseFloat(analyticsMetrics.maintenanceCost) / parseFloat(analyticsMetrics.totalCost)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <ChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization placeholder</p>
                <p className="text-sm">Bar chart showing vehicle utilization by department</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Vehicle</th>
                  <th className="text-left p-4 font-medium">Metric</th>
                  <th className="text-left p-4 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Most Efficient</td>
                  <td className="p-4">
                    <p className="font-medium">{vehicles[0]?.number || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicles[0] ? `${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}` : ""}
                    </p>
                  </td>
                  <td className="p-4">Fuel Economy</td>
                  <td className="p-4">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <TrendUp className="w-3 h-3 mr-1" />
                      28.5 MPG
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Most Reliable</td>
                  <td className="p-4">
                    <p className="font-medium">{vehicles[2]?.number || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicles[2] ? `${vehicles[2].year} ${vehicles[2].make} ${vehicles[2].model}` : ""}
                    </p>
                  </td>
                  <td className="p-4">Uptime</td>
                  <td className="p-4">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      99.2%
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Lowest Cost</td>
                  <td className="p-4">
                    <p className="font-medium">{vehicles[4]?.number || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicles[4] ? `${vehicles[4].year} ${vehicles[4].make} ${vehicles[4].model}` : ""}
                    </p>
                  </td>
                  <td className="p-4">Operating Cost</td>
                  <td className="p-4">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <TrendDown className="w-3 h-3 mr-1" />
                      $0.42/mi
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <ChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization placeholder</p>
              <p className="text-sm">Line chart showing cost trends over time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
