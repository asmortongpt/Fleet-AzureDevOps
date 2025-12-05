import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MagnifyingGlass, Funnel, X } from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { StatusBadge } from "@/components/shared"

interface ActiveFilter {
  id: string
  field: string
  label: string
  value: string
}

interface OverviewTabProps {
  vehicles: Vehicle[]
  onAdvancedSearch: () => void
}

export function OverviewTab({ vehicles, onAdvancedSearch }: OverviewTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  const handleRemoveFilter = (id: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== id))
  }

  const handleClearAllFilters = () => {
    setActiveFilters([])
    setSearchQuery("")
  }

  const filteredVehicles = (vehicles || []).filter(vehicle => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        vehicle.number.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Active filters
    for (const filter of activeFilters) {
      const vehicleValue = String((vehicle as any)[filter.field] || "").toLowerCase()
      if (!vehicleValue.includes(filter.value.toLowerCase())) {
        return false
      }
    }

    return true
  })

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search vehicles by number, make, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search vehicles"
          />
        </div>
        <Button
          variant="outline"
          onClick={onAdvancedSearch}
          className="gap-2"
          aria-label="Open advanced search filters"
        >
          <Funnel className="w-4 h-4" aria-hidden="true" />
          Advanced Search
        </Button>
        {(activeFilters.length > 0 || searchQuery) && (
          <Button
            variant="outline"
            onClick={handleClearAllFilters}
            className="gap-2 text-destructive hover:text-destructive"
            aria-label={`Clear all filters and search (${activeFilters.length} active)`}
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center" role="status" aria-live="polite">
          <span className="text-sm text-muted-foreground">Active Filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="gap-1.5 pr-1 py-1"
            >
              <span className="text-xs">
                <strong>{filter.label}:</strong> {filter.value}
              </span>
              <button
                onClick={() => handleRemoveFilter(filter.id)}
                className="hover:bg-muted rounded-sm p-0.5 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Vehicle Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Fleet vehicles overview">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium" scope="col">Vehicle</th>
                  <th className="text-left p-4 font-medium" scope="col">Status</th>
                  <th className="text-left p-4 font-medium" scope="col">Mileage</th>
                  <th className="text-left p-4 font-medium" scope="col">Fuel</th>
                  <th className="text-left p-4 font-medium" scope="col">Driver</th>
                  <th className="text-left p-4 font-medium" scope="col">Department</th>
                  <th className="text-left p-4 font-medium" scope="col">Region</th>
                  <th className="text-left p-4 font-medium" scope="col">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.slice(0, 15).map(vehicle => (
                  <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{vehicle.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{vehicle.mileage.toLocaleString()} mi</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-16 h-2 bg-muted rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={vehicle.fuelLevel}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Fuel level ${vehicle.fuelLevel}%`}
                        >
                          <div
                            className={`h-full ${
                              vehicle.fuelLevel > 50
                                ? "bg-success"
                                : vehicle.fuelLevel > 25
                                ? "bg-warning"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${vehicle.fuelLevel}%` }}
                          />
                        </div>
                        <span className="text-sm" aria-hidden="true">{vehicle.fuelLevel}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">
                        {vehicle.assignedDriver || "Unassigned"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {vehicle.department}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{vehicle.region}</span>
                    </td>
                    <td className="p-4">
                      {((vehicle.alerts || [])).length > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-warning/10 text-warning border-warning/20"
                          role="status"
                          aria-label={`${((vehicle.alerts || [])).length} active alerts`}
                        >
                          {((vehicle.alerts || [])).length}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredVehicles.length > 15 && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          Showing 15 of {filteredVehicles.length} vehicles
        </p>
      )}

      {filteredVehicles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No vehicles found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
