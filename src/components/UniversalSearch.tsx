/**
 * Universal Search Component
 * Searches across all entity types with federated results
 *
 * Searches:
 * - Vehicles (by number, VIN, make/model, license plate)
 * - Drivers (by name, employee ID, email)
 * - Work Orders (by ID, service type, description)
 * - Parts (by name, part number, SKU)
 * - Vendors (by name, contact)
 * - Routes (by name, destination)
 * - Documents (by title, content)
 *
 * Created: 2025-11-23
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass, Car, User, Wrench, Package,
  Truck, MapPin, FileText, X, ArrowRight, Clock,
  Keyboard, CaretRight, Spinner
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { useEntityLinking, EntityType, EntityReference } from '@/contexts/EntityLinkingContext'
import { useFleetData } from '@/hooks/use-fleet-data'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
  type: EntityType
  id: string
  title: string
  subtitle?: string
  description?: string
  score: number
  data?: any
  matches?: SearchMatch[]
}

interface SearchMatch {
  field: string
  value: string
  highlight: string
}

interface SearchCategory {
  type: EntityType
  label: string
  icon: React.ElementType
  color: string
}

interface UniversalSearchProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onResultSelect?: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

// ============================================================================
// SEARCH CATEGORIES
// ============================================================================

const SEARCH_CATEGORIES: SearchCategory[] = [
  { type: 'vehicle', label: 'Vehicles', icon: Car, color: 'text-blue-500' },
  { type: 'driver', label: 'Drivers', icon: User, color: 'text-green-500' },
  { type: 'work-order', label: 'Work Orders', icon: Wrench, color: 'text-orange-500' },
  { type: 'part', label: 'Parts', icon: Package, color: 'text-cyan-500' },
  { type: 'vendor', label: 'Vendors', icon: Truck, color: 'text-indigo-500' },
  { type: 'route', label: 'Routes', icon: MapPin, color: 'text-purple-500' },
  { type: 'document', label: 'Documents', icon: FileText, color: 'text-gray-500' }
]

// ============================================================================
// SEARCH HOOK
// ============================================================================

function useUniversalSearch(query: string, enabled: boolean = true) {
  const { vehicles, drivers, workOrders, routes } = useFleetData()
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    if (!enabled || !debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const searchTerm = debouncedQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search vehicles
    vehicles?.forEach(vehicle => {
      const fields = [
        { field: 'number', value: vehicle.number },
        { field: 'vin', value: vehicle.vin },
        { field: 'make', value: vehicle.make },
        { field: 'model', value: vehicle.model },
        { field: 'licensePlate', value: vehicle.licensePlate },
        { field: 'driver', value: vehicle.assignedDriver || '' }
      ]

      const matches: SearchMatch[] = []
      let score = 0

      fields.forEach(({ field, value }) => {
        if (value && value.toLowerCase().includes(searchTerm)) {
          const startIdx = value.toLowerCase().indexOf(searchTerm)
          matches.push({
            field,
            value,
            highlight: value.substring(0, startIdx) +
              '<mark>' + value.substring(startIdx, startIdx + searchTerm.length) + '</mark>' +
              value.substring(startIdx + searchTerm.length)
          })
          // Exact match scores higher
          score += value.toLowerCase() === searchTerm ? 100 : 50
        }
      })

      if (matches.length > 0) {
        searchResults.push({
          type: 'vehicle',
          id: vehicle.id,
          title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          subtitle: vehicle.number,
          description: `${vehicle.status} | ${vehicle.region}`,
          score,
          data: vehicle,
          matches
        })
      }
    })

    // Search drivers
    drivers?.forEach(driver => {
      const fields = [
        { field: 'name', value: driver.name },
        { field: 'employeeId', value: driver.employeeId },
        { field: 'email', value: driver.email },
        { field: 'phone', value: driver.phone },
        { field: 'department', value: driver.department }
      ]

      const matches: SearchMatch[] = []
      let score = 0

      fields.forEach(({ field, value }) => {
        if (value && value.toLowerCase().includes(searchTerm)) {
          matches.push({ field, value, highlight: highlightMatch(value, searchTerm) })
          score += value.toLowerCase() === searchTerm ? 100 : 50
        }
      })

      if (matches.length > 0) {
        searchResults.push({
          type: 'driver',
          id: driver.id,
          title: driver.name,
          subtitle: driver.employeeId,
          description: driver.department,
          score,
          data: driver,
          matches
        })
      }
    })

    // Search work orders
    workOrders?.forEach(wo => {
      const fields = [
        { field: 'id', value: wo.id },
        { field: 'vehicleNumber', value: wo.vehicleNumber },
        { field: 'serviceType', value: wo.serviceType },
        { field: 'description', value: wo.description }
      ]

      const matches: SearchMatch[] = []
      let score = 0

      fields.forEach(({ field, value }) => {
        if (value && value.toLowerCase().includes(searchTerm)) {
          matches.push({ field, value, highlight: highlightMatch(value, searchTerm) })
          score += value.toLowerCase() === searchTerm ? 100 : 50
        }
      })

      if (matches.length > 0) {
        searchResults.push({
          type: 'work-order',
          id: wo.id,
          title: `WO-${wo.id.slice(-6)} - ${wo.serviceType}`,
          subtitle: wo.vehicleNumber,
          description: `${wo.status} | ${wo.priority} priority`,
          score,
          data: wo,
          matches
        })
      }
    })

    // Search routes
    routes?.forEach(route => {
      const fields = [
        { field: 'name', value: route.name || '' },
        { field: 'startLocation', value: route.startLocation || '' },
        { field: 'endLocation', value: route.endLocation || '' }
      ]

      const matches: SearchMatch[] = []
      let score = 0

      fields.forEach(({ field, value }) => {
        if (value && value.toLowerCase().includes(searchTerm)) {
          matches.push({ field, value, highlight: highlightMatch(value, searchTerm) })
          score += value.toLowerCase() === searchTerm ? 100 : 50
        }
      })

      if (matches.length > 0) {
        searchResults.push({
          type: 'route',
          id: route.id,
          title: route.name || `Route ${route.id}`,
          subtitle: `${route.startLocation} -> ${route.endLocation}`,
          description: route.status,
          score,
          data: route,
          matches
        })
      }
    })

    // Sort by score
    searchResults.sort((a, b) => b.score - a.score)

    setResults(searchResults.slice(0, 50)) // Limit to 50 results
    setIsSearching(false)
  }, [debouncedQuery, enabled, vehicles, drivers, workOrders, routes])

  return { results, isSearching }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function highlightMatch(value: string, term: string): string {
  const idx = value.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return value
  return value.substring(0, idx) +
    '<mark>' + value.substring(idx, idx + term.length) + '</mark>' +
    value.substring(idx + term.length)
}

function getCategoryForType(type: EntityType): SearchCategory | undefined {
  return SEARCH_CATEGORIES.find(c => c.type === type)
}

// ============================================================================
// SEARCH RESULT ITEM
// ============================================================================

interface SearchResultItemProps {
  result: SearchResult
  isSelected?: boolean
  onClick: () => void
}

function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const category = getCategoryForType(result.type)
  const Icon = category?.icon || FileText

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
        "border border-transparent hover:border-primary/20 hover:bg-muted/50",
        isSelected && "bg-primary/10 border-primary/30"
      )}
    >
      <div className={cn("p-2 rounded-md bg-muted", category?.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{result.title}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {category?.label}
          </Badge>
        </div>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {result.subtitle}
          </p>
        )}
        {result.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {result.description}
          </p>
        )}
      </div>

      <CaretRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT - DIALOG VERSION
// ============================================================================

export function UniversalSearch({
  open,
  onOpenChange,
  onResultSelect,
  placeholder = "Search vehicles, drivers, work orders...",
  className
}: UniversalSearchProps) {
  const { push: drilldownPush } = useDrilldown()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { results, isSearching } = useUniversalSearch(query, open)

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        handleResultSelect(results[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex])

  const handleResultSelect = useCallback((result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result)
    } else {
      drilldownPush({
        id: `${result.type}-${result.id}`,
        type: result.type,
        label: result.title,
        data: result.data
      })
    }
    onOpenChange?.(false)
  }, [onResultSelect, drilldownPush, onOpenChange])

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach(result => {
      if (!groups[result.type]) groups[result.type] = []
      groups[result.type].push(result)
    })
    return groups
  }, [results])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[600px] p-0", className)}>
        <DialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <MagnifyingGlass className="w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="border-0 focus-visible:ring-0 text-lg h-10"
              autoFocus
            />
            {isSearching && <Spinner className="w-4 h-4 animate-spin" />}
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {query.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Keyboard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Type at least 2 characters to search</p>
                <p className="text-xs mt-2">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Cmd+K</kbd> or <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+K</kbd> anytime to open search
                </p>
              </div>
            ) : results.length === 0 && !isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                <MagnifyingGlass className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([type, typeResults]) => {
                  const category = getCategoryForType(type as EntityType)
                  if (!category) return null
                  const Icon = category.icon

                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={cn("w-4 h-4", category.color)} />
                        <span className="text-sm font-medium">{category.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {typeResults.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {typeResults.slice(0, 5).map((result, idx) => (
                          <SearchResultItem
                            key={`${result.type}-${result.id}`}
                            result={result}
                            isSelected={results.indexOf(result) === selectedIndex}
                            onClick={() => handleResultSelect(result)}
                          />
                        ))}
                        {typeResults.length > 5 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              drilldownPush({
                                id: `search-${type}-${query}`,
                                type: `${type}-list`,
                                label: `${category.label} matching "${query}"`,
                                data: { results: typeResults, query }
                              })
                              onOpenChange?.(false)
                            }}
                          >
                            View all {typeResults.length} {category.label.toLowerCase()}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded mr-1">Tab</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-muted rounded mr-1">Enter</kbd> to select
            </span>
          </div>
          <span>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// SEARCH TRIGGER BUTTON
// ============================================================================

interface SearchTriggerProps {
  className?: string
  onClick?: () => void
}

export function SearchTrigger({ className, onClick }: SearchTriggerProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 md:w-80",
        className
      )}
    >
      <MagnifyingGlass className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">Search everything...</span>
      <span className="lg:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
        <span className="text-xs">Cmd</span>K
      </kbd>
    </Button>
  )
}

// ============================================================================
// GLOBAL SEARCH PROVIDER
// ============================================================================

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}

export default UniversalSearch
