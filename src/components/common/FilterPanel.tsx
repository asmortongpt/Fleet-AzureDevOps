/**
 * FilterPanel - Reusable filter panel component
 *
 * A flexible, type-safe filter panel that supports multiple filter types
 * (text, select, multi-select, date range, etc.) with consistent UI.
 *
 * Features:
 * - Multiple filter types
 * - Collapsible design
 * - Clear all filters
 * - Active filter count badge
 * - Responsive layout
 *
 * Usage:
 * ```tsx
 * <FilterPanel
 *   filters={[
 *     { type: 'text', key: 'search', label: 'Search', placeholder: 'Search vehicles...' },
 *     { type: 'select', key: 'status', label: 'Status', options: [
 *       { label: 'Active', value: 'active' },
 *       { label: 'Inactive', value: 'inactive' }
 *     ]},
 *     { type: 'multi-select', key: 'categories', label: 'Categories', options: [...] }
 *   ]}
 *   values={filterValues}
 *   onChange={setFilterValues}
 * />
 * ```
 */

import { MagnifyingGlass, FunnelSimple, X } from "@phosphor-icons/react"
import { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

// ============================================================================
// TYPES
// ============================================================================

export interface FilterOption {
  label: string
  value: string
  icon?: ReactNode
}

export type FilterType = "text" | "select" | "multi-select" | "button-group"

export interface FilterDefinition {
  /** Filter type */
  type: FilterType
  /** Unique key for the filter */
  key: string
  /** Display label */
  label?: string
  /** Placeholder text (for text inputs) */
  placeholder?: string
  /** Options for select/multi-select/button-group */
  options?: FilterOption[]
  /** Default value */
  defaultValue?: any
  /** Show search icon (for text inputs) */
  showSearchIcon?: boolean
  /** Custom render function */
  render?: (value: any, onChange: (value: any) => void) => ReactNode
}

export interface FilterValues {
  [key: string]: any
}

export interface FilterPanelProps {
  /** Filter definitions */
  filters: FilterDefinition[]
  /** Current filter values */
  values: FilterValues
  /** Callback when filters change */
  onChange: (values: FilterValues) => void
  /** Show clear all button */
  showClearAll?: boolean
  /** Additional className */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilterPanel({
  filters,
  values,
  onChange,
  showClearAll = true,
  className = ""
}: FilterPanelProps) {
  // Count active filters (non-empty, non-default values)
  const activeFilterCount = filters.filter((filter) => {
    const value = values[filter.key]
    if (value == null || value === "") return false
    if (Array.isArray(value) && value.length === 0) return false
    if (value === filter.defaultValue) return false
    return true
  }).length

  // Handle filter change
  const handleChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    })
  }

  // Clear all filters
  const handleClearAll = () => {
    const clearedValues: FilterValues = {}
    filters.forEach((filter) => {
      if (filter.type === "multi-select") {
        clearedValues[filter.key] = []
      } else {
        clearedValues[filter.key] = filter.defaultValue ?? ""
      }
    })
    onChange(clearedValues)
  }

  // Render individual filter based on type
  const renderFilter = (filter: FilterDefinition) => {
    const value = values[filter.key] ?? filter.defaultValue ?? ""

    // Custom render function
    if (filter.render) {
      return filter.render(value, (newValue) => handleChange(filter.key, newValue))
    }

    // Text input
    if (filter.type === "text") {
      return (
        <div key={filter.key} className="space-y-2">
          {filter.label && <Label htmlFor={filter.key}>{filter.label}</Label>}
          <div className="relative">
            {filter.showSearchIcon && (
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input
              id={filter.key}
              placeholder={filter.placeholder}
              value={value}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              className={filter.showSearchIcon ? "pl-10" : ""}
            />
          </div>
        </div>
      )
    }

    // Select dropdown
    if (filter.type === "select") {
      return (
        <div key={filter.key} className="space-y-2">
          {filter.label && <Label htmlFor={filter.key}>{filter.label}</Label>}
          <Select
            value={value}
            onValueChange={(newValue) => handleChange(filter.key, newValue)}
          >
            <SelectTrigger id={filter.key}>
              <SelectValue placeholder={filter.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Button group (like category filters)
    if (filter.type === "button-group") {
      return (
        <div key={filter.key} className="space-y-2">
          {filter.label && <Label>{filter.label}</Label>}
          <div className="flex flex-wrap gap-2">
            {filter.options?.map((option) => (
              <Button
                key={option.value}
                variant={value === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleChange(filter.key, option.value)}
                className="gap-2"
              >
                {option.icon}
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )
    }

    // Multi-select (button group with multiple selection)
    if (filter.type === "multi-select") {
      const selectedValues = Array.isArray(value) ? value : []

      const toggleValue = (optionValue: string) => {
        if (selectedValues.includes(optionValue)) {
          handleChange(
            filter.key,
            selectedValues.filter((v) => v !== optionValue)
          )
        } else {
          handleChange(filter.key, [...selectedValues, optionValue])
        }
      }

      return (
        <div key={filter.key} className="space-y-2">
          {filter.label && <Label>{filter.label}</Label>}
          <div className="flex flex-wrap gap-2">
            {filter.options?.map((option) => (
              <Button
                key={option.value}
                variant={selectedValues.includes(option.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleValue(option.value)}
                className="gap-2"
              >
                {option.icon}
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelSimple className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {showClearAll && activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear all
            </Button>
          )}
        </div>
        <div className="space-y-4">{filters.map(renderFilter)}</div>
      </CardContent>
    </Card>
  )
}
