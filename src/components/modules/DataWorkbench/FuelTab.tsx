import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MetricCard } from "@/components/MetricCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GasPump, TrendUp, ChartLine } from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { SortIcon } from "./SortIcon"
import { FuelRecord, FuelMetrics, SortField, SortDirection } from "./types"

interface FuelTabProps {
  fuelRecords: FuelRecord[]
  vehicles: Vehicle[]
}

export function FuelTab({ fuelRecords, vehicles }: FuelTabProps) {
  const [dateRange, setDateRange] = useState("30")
  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const fuelMetrics = useMemo((): FuelMetrics => {
    const daysAgo = parseInt(dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const recentRecords = fuelRecords.filter(r => new Date(r.date) >= cutoffDate)

    const totalCost = recentRecords.reduce((sum, r) => sum + r.cost, 0)
    const totalGallons = recentRecords.reduce((sum, r) => sum + r.gallons, 0)
    const avgMPG = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.mpg, 0) / recentRecords.length
      : 0

    const totalMiles = recentRecords.reduce((sum, r) => sum + (r.mpg * r.gallons), 0)
    const costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0

    return {
      totalSpent: parseFloat(totalCost.toFixed(2)),
      totalGallons: parseFloat(totalGallons.toFixed(1)),
      averageMPG: parseFloat(avgMPG.toFixed(1)),
      costPerMile: parseFloat(costPerMile.toFixed(2))
    }
  }, [fuelRecords, dateRange])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedFuelRecords = useMemo(() => {
    let filtered = fuelRecords

    if (vehicleFilter !== "all") {
      filtered = filtered.filter(r => r.vehicleNumber === vehicleFilter)
    }

    const daysAgo = parseInt(dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)
    filtered = filtered.filter(r => new Date(r.date) >= cutoffDate)

    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "vehicleNumber":
          comparison = a.vehicleNumber.localeCompare(b.vehicleNumber)
          break
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "gallons":
          comparison = a.gallons - b.gallons
          break
        case "cost":
          comparison = a.cost - b.cost
          break
        case "odometer":
          comparison = a.odometer - b.odometer
          break
        case "mpg":
          comparison = a.mpg - b.mpg
          break
        default:
          return 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [fuelRecords, vehicleFilter, dateRange, sortField, sortDirection])

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Fuel Cost"
          value={`$${fuelMetrics.totalSpent.toLocaleString()}`}
          subtitle={`last ${dateRange} days`}
          icon={<GasPump className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Average MPG"
          value={fuelMetrics.averageMPG.toString()}
          subtitle="fleet average"
          icon={<TrendUp className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Total Gallons"
          value={fuelMetrics.totalGallons.toString()}
          subtitle="consumed"
          icon={<GasPump className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Cost per Mile"
          value={`$${fuelMetrics.costPerMile.toFixed(2)}`}
          subtitle="average"
          icon={<ChartLine className="w-5 h-5" />}
          status="info"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label htmlFor="fuel-date-range">Date Range:</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32" id="fuel-date-range" aria-label="Select date range for fuel records">
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
        <div className="flex items-center gap-2">
          <Label htmlFor="fuel-vehicle-filter">Vehicle:</Label>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full sm:w-48" id="fuel-vehicle-filter" aria-label="Filter by vehicle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.slice(0, 10).map(v => (
                <SelectItem key={v.id} value={v.number}>
                  {v.number} - {v.make} {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuel Consumption Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <ChartLine className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>Chart visualization placeholder</p>
              <p className="text-sm">Line chart showing fuel consumption over last {dateRange} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Fuel consumption records">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("vehicleNumber")}
                    scope="col"
                    aria-sort={sortField === "vehicleNumber" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Vehicle
                    <SortIcon field="vehicleNumber" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("date")}
                    scope="col"
                    aria-sort={sortField === "date" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Date
                    <SortIcon field="date" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("gallons")}
                    scope="col"
                    aria-sort={sortField === "gallons" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Gallons
                    <SortIcon field="gallons" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("cost")}
                    scope="col"
                    aria-sort={sortField === "cost" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Cost
                    <SortIcon field="cost" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("odometer")}
                    scope="col"
                    aria-sort={sortField === "odometer" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Odometer
                    <SortIcon field="odometer" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("mpg")}
                    scope="col"
                    aria-sort={sortField === "mpg" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    MPG
                    <SortIcon field="mpg" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th className="text-left p-4 font-medium" scope="col">Location</th>
                </tr>
              </thead>
              <tbody>
                {sortedFuelRecords.slice(0, 20).map(record => (
                  <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{record.vehicleNumber}</p>
                      <p className="text-sm text-muted-foreground">{record.vehicleName}</p>
                    </td>
                    <td className="p-4">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">{(record.gallons ?? 0).toFixed(1)}</td>
                    <td className="p-4 font-medium">${(record.cost ?? 0).toFixed(2)}</td>
                    <td className="p-4">{(record.odometer ?? 0).toLocaleString()} mi</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20" role="status">
                        {(record.mpg ?? 0).toFixed(1)} MPG
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {record.location || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {sortedFuelRecords.length > 20 && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          Showing 20 of {sortedFuelRecords.length} records
        </p>
      )}

      {sortedFuelRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No fuel records found for the selected filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
