import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MetricCard } from "@/components/MetricCard"
import { Plus, Wrench, Warning, Calendar } from "@phosphor-icons/react"
import { SortIcon } from "./SortIcon"
import {
  MaintenanceRecord,
  MaintenanceMetrics,
  MaintenanceFilter,
  SortField,
  SortDirection
} from "./types"

interface MaintenanceTabProps {
  maintenanceRecords: MaintenanceRecord[]
  onScheduleService: () => void
}

export function MaintenanceTab({ maintenanceRecords, onScheduleService }: MaintenanceTabProps) {
  const [maintenanceFilter, setMaintenanceFilter] = useState<MaintenanceFilter>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const maintenanceMetrics = useMemo((): MaintenanceMetrics => {
    const thisMonth = new Date()
    thisMonth.setDate(1)

    const totalCost = maintenanceRecords
      .filter(r => new Date(r.date) >= thisMonth && r.status === "completed")
      .reduce((sum, r) => sum + r.cost, 0)

    const overdue = maintenanceRecords.filter(r => r.status === "overdue").length

    const upcoming = maintenanceRecords.filter(r => {
      if (r.status !== "upcoming") return false
      const dueDate = r.nextDue ? new Date(r.nextDue) : new Date(r.date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return dueDate <= thirtyDaysFromNow
    }).length

    return { totalCost, overdue, upcoming }
  }, [maintenanceRecords])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedMaintenanceRecords = useMemo(() => {
    let filtered = maintenanceRecords

    if (maintenanceFilter !== "all") {
      filtered = filtered.filter(r => r.status === maintenanceFilter)
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "vehicleNumber":
          comparison = a.vehicleNumber.localeCompare(b.vehicleNumber)
          break
        case "serviceType":
          comparison = a.serviceType.localeCompare(b.serviceType)
          break
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "cost":
          comparison = a.cost - b.cost
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        default:
          return 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [maintenanceRecords, maintenanceFilter, sortField, sortDirection])

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Maintenance Cost"
          value={`$${maintenanceMetrics.totalCost.toLocaleString()}`}
          subtitle="this month"
          icon={<Wrench className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Overdue Services"
          value={maintenanceMetrics.overdue}
          subtitle="need immediate attention"
          icon={<Warning className="w-5 h-5" />}
          status={maintenanceMetrics.overdue > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Upcoming Services"
          value={maintenanceMetrics.upcoming}
          subtitle="next 30 days"
          icon={<Calendar className="w-5 h-5" />}
          status="info"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2" role="group" aria-label="Maintenance status filter">
          <Button
            variant={maintenanceFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setMaintenanceFilter("all")}
            aria-pressed={maintenanceFilter === "all"}
          >
            All
          </Button>
          <Button
            variant={maintenanceFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setMaintenanceFilter("upcoming")}
            aria-pressed={maintenanceFilter === "upcoming"}
          >
            Upcoming
          </Button>
          <Button
            variant={maintenanceFilter === "overdue" ? "default" : "outline"}
            size="sm"
            onClick={() => setMaintenanceFilter("overdue")}
            aria-pressed={maintenanceFilter === "overdue"}
          >
            Overdue
          </Button>
          <Button
            variant={maintenanceFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setMaintenanceFilter("completed")}
            aria-pressed={maintenanceFilter === "completed"}
          >
            Completed
          </Button>
        </div>
        <Button onClick={onScheduleService} aria-label="Schedule new service">
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Schedule Service
        </Button>
      </div>

      {/* Maintenance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Maintenance records">
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
                    onClick={() => handleSort("serviceType")}
                    scope="col"
                    aria-sort={sortField === "serviceType" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Service Type
                    <SortIcon field="serviceType" currentField={sortField} direction={sortDirection} />
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
                    onClick={() => handleSort("cost")}
                    scope="col"
                    aria-sort={sortField === "cost" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Cost
                    <SortIcon field="cost" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70"
                    onClick={() => handleSort("status")}
                    scope="col"
                    aria-sort={sortField === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  >
                    Status
                    <SortIcon field="status" currentField={sortField} direction={sortDirection} />
                  </th>
                  <th className="text-left p-4 font-medium" scope="col">Next Due</th>
                </tr>
              </thead>
              <tbody>
                {sortedMaintenanceRecords.slice(0, 20).map(record => (
                  <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{record.vehicleNumber}</p>
                      <p className="text-sm text-muted-foreground">{record.vehicleName}</p>
                    </td>
                    <td className="p-4">{record.serviceType}</td>
                    <td className="p-4">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium">
                      ${record.cost.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={
                          record.status === "completed"
                            ? "bg-success/10 text-success border-success/20"
                            : record.status === "upcoming"
                            ? "bg-info/10 text-info border-info/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                        role="status"
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {record.nextDue ? new Date(record.nextDue).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {sortedMaintenanceRecords.length > 20 && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          Showing 20 of {sortedMaintenanceRecords.length} records
        </p>
      )}

      {sortedMaintenanceRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No maintenance records found for the selected filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
