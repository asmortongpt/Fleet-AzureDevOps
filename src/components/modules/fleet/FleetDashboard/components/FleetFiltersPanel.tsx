import { MagnifyingGlass, FunnelSimple, X } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FleetFiltersPanelProps {
  statusFilter: string
  setStatusFilter: (filter: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  hasActiveFilters: boolean
  onAdvancedFiltersClick: () => void
  onClearFilters: () => void
}

export function FleetFiltersPanel({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  onAdvancedFiltersClick,
  onClearFilters
}: FleetFiltersPanelProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by vehicle number, make, or model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="service">In Service</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onAdvancedFiltersClick} className="gap-2">
        <FunnelSimple className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
            Active
          </Badge>
        )}
      </Button>
      {(hasActiveFilters || searchQuery) && (
        <Button variant="ghost" onClick={onClearFilters} className="gap-2">
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
