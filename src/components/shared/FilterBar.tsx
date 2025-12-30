import { MagnifyingGlass, X, Funnel } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useVehicleFilters } from '@/hooks/useVehicleFilters'
import { cn } from '@/lib/utils'

export type VehicleFilters = ReturnType<typeof useVehicleFilters>['filters']
export type FilterStats = ReturnType<typeof useVehicleFilters>['filterStats']

export interface FilterBarProps {
  filters: VehicleFilters
  onFilterChange: <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => void
  onReset: () => void

  // Statistics for filter badges
  stats?: FilterStats

  // Unique values for dropdowns
  locations?: string[]
  departments?: string[]
  makes?: string[]

  // Feature flags - enable specific filters
  enableStatusFilter?: boolean
  enableTypeFilter?: boolean
  enableLocationFilter?: boolean
  enableDepartmentFilter?: boolean
  enableMakeFilter?: boolean
  enableSearch?: boolean
  enableQuickToggles?: boolean

  // UI customization
  className?: string
  compact?: boolean
  showFilterCount?: boolean
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  stats,
  locations = [],
  departments = [],
  makes = [],
  enableStatusFilter = true,
  enableTypeFilter = true,
  enableLocationFilter = false,
  enableDepartmentFilter = false,
  enableMakeFilter = false,
  enableSearch = true,
  enableQuickToggles = true,
  className,
  compact = false,
  showFilterCount = true
}: FilterBarProps) {
  // Count active filters
  const activeFilterCount =
    (filters.status !== 'all' ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.location !== 'all' ? 1 : 0) +
    (filters.department !== 'all' ? 1 : 0) +
    (filters.make !== 'all' ? 1 : 0) +
    (filters.searchTerm ? 1 : 0) +
    (filters.assignedOnly ? 1 : 0) +
    (filters.availableOnly ? 1 : 0)

  const hasActiveFilters = activeFilterCount > 0

  return (
    <Card className={cn('border-l-4 border-l-primary', className)}>
      <CardContent className={cn('space-y-4', compact ? 'p-4' : 'p-6')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Funnel className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Filters</h3>
            {showFilterCount && hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          {enableSearch && (
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="search" className="text-sm font-medium">
                Search
              </Label>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search vehicles..."
                  value={filters.searchTerm}
                  onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Status Filter */}
          {enableStatusFilter && (
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={filters.status}
                onValueChange={(value: string) => onFilterChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All {stats && `(${(stats as any)?.all ?? 0})`}
                  </SelectItem>
                  <SelectItem value="active">
                    Active {stats && `(${(stats as any)?.active ?? 0})`}
                  </SelectItem>
                  <SelectItem value="inactive">
                    Inactive {stats && `(${(stats as any)?.inactive ?? 0})`}
                  </SelectItem>
                  <SelectItem value="maintenance">
                    Maintenance {stats && `(${(stats as any)?.maintenance ?? 0})`}
                  </SelectItem>
                  <SelectItem value="out_of_service">
                    Out of Service {stats && `(${(stats as any)?.outOfService ?? 0})`}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type Filter */}
          {enableTypeFilter && (
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Fuel Type
              </Label>
              <Select
                value={filters.type}
                onValueChange={(value: string) => onFilterChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="electric">
                    Electric {stats && `(${stats?.electric ?? 0})`}
                  </SelectItem>
                  <SelectItem value="hybrid">
                    Hybrid {stats && `(${stats?.hybrid ?? 0})`}
                  </SelectItem>
                  <SelectItem value="gas">
                    Gas {stats && `(${stats?.gas ?? 0})`}
                  </SelectItem>
                  <SelectItem value="diesel">
                    Diesel {stats && `(${stats?.diesel ?? 0})`}
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Filter */}
          {enableLocationFilter && locations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location
              </Label>
              <Select
                value={filters.location}
                onValueChange={(value: string) => onFilterChange('location', value)}
              >
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department Filter */}
          {enableDepartmentFilter && departments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">
                Department
              </Label>
              <Select
                value={filters.department}
                onValueChange={(value: string) => onFilterChange('department', value)}
              >
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Make Filter */}
          {enableMakeFilter && makes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="make" className="text-sm font-medium">
                Make
              </Label>
              <Select
                value={filters.make}
                onValueChange={(value: string) => onFilterChange('make', value)}
              >
                <SelectTrigger id="make">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Makes</SelectItem>
                  {makes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Quick Toggles */}
        {enableQuickToggles && (
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="assigned-only"
                checked={filters.assignedOnly}
                onCheckedChange={(checked) =>
                  onFilterChange('assignedOnly', !!checked)
                }
              />
              <Label
                htmlFor="assigned-only"
                className="text-sm font-normal cursor-pointer"
              >
                Assigned Only {stats && `(${stats?.assigned ?? 0})`}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="available-only"
                checked={filters.availableOnly}
                onCheckedChange={(checked) =>
                  onFilterChange('availableOnly', !!checked)
                }
              />
              <Label
                htmlFor="available-only"
                className="text-sm font-normal cursor-pointer"
              >
                Available Only {stats && `(${stats?.available ?? 0})`}
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}