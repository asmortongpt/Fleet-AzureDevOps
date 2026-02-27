import { Car, BatteryMedium, Circle, ArrowRight } from "lucide-react"
// motion removed - React 19 incompatible
import { useMemo, useRef, useEffect, useState } from "react"

import { Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatEnum } from "@/utils/format-enum"
import { formatVehicleName, formatVehicleShortName } from "@/utils/vehicle-display"

interface CompactVehicleListProps {
  vehicles: Vehicle[]
  onVehicleClick?: (vehicle: Vehicle) => void
  maxHeight?: string
  showRealtimeIndicator?: boolean
}

export function CompactVehicleList({
  vehicles,
  onVehicleClick,
  maxHeight = "100%",
  showRealtimeIndicator = false
}: CompactVehicleListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  const getStatusColor = (status: Vehicle["status"]) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
      idle: "bg-white/[0.05] text-white/40 border-white/[0.08] dark:bg-[#18181b] dark:text-white/40 dark:border-white/[0.08]",
      charging: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-700 dark:border-emerald-900",
      service: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
      emergency: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
      offline: "bg-white/[0.05] text-white/40 border-white/[0.08] dark:bg-[#18181b] dark:text-white/40 dark:border-white/[0.08]",
      assigned: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
      dispatched: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
      en_route: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-900",
      on_site: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
      maintenance: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
      retired: "bg-white/[0.05] text-white/40 border-white/[0.08] dark:bg-[#18181b] dark:text-white/40 dark:border-white/[0.08]",
    }
    return colors[status] || colors.offline
  }

  const getBatteryColor = (level: number) => {
    if (level >= 60) return "text-green-600 dark:text-green-400"
    if (level >= 30) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  // Virtual scrolling implementation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const itemHeight = 48 // Approximate height of each item
      const visibleCount = Math.ceil(container.clientHeight / itemHeight)
      const start = Math.floor(scrollTop / itemHeight)
      const end = start + visibleCount + 5 // Buffer

      setVisibleRange({ start: Math.max(0, start - 5), end: Math.min(vehicles.length, end) })
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll)
  }, [vehicles.length])

  const visibleVehicles = useMemo(() => {
    return vehicles.slice(visibleRange.start, visibleRange.end)
  }, [vehicles, visibleRange])

  const isRecentlyUpdated = (vehicle: Vehicle & { lastUpdated?: string | Date }) => {
    if (!showRealtimeIndicator || !vehicle.lastUpdated) return false
    return (new Date().getTime() - new Date(vehicle.lastUpdated).getTime()) < 5000
  }

  return (
    <div className="compact-card h-full">
      <div className="compact-card-header">
        <div className="compact-card-title">
          <Car className="w-4 h-4" />
          Fleet Vehicles
        </div>
        <div className="text-xs text-muted-foreground">
          {vehicles.length} total
        </div>
      </div>
      <div
        ref={containerRef}
        className="scrollable-content"
        style={{ maxHeight }}
      >
        <div
          className="space-y-1 p-2"
          style={{
            paddingTop: visibleRange.start * 48,
            paddingBottom: (vehicles.length - visibleRange.end) * 48
          }}
        >
          {visibleVehicles.map((vehicle, index) => {
            const wasRecentlyUpdated = isRecentlyUpdated(vehicle)
            const _actualIndex = visibleRange.start + index

            return (
              <div
                key={vehicle.id}
                className={cn(
                  "compact-list-item",
                  wasRecentlyUpdated && "bg-emerald-500/5 dark:bg-emerald-950/20"
                )}
                onClick={() => onVehicleClick?.(vehicle)}
                data-testid="vehicle-card"
                data-vehicle-id={vehicle.id}
              >
                <div className={cn("compact-list-item-icon", getStatusColor(vehicle.status))}>
                  <Car className="w-3.5 h-3.5" />
                  {wasRecentlyUpdated && (
                    <Circle
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 fill-emerald-500 text-emerald-800 animate-pulse"
                     
                    />
                  )}
                </div>

                <div className="compact-list-item-content">
                  <div className="flex items-center gap-1.5">
                    <div className="compact-list-item-title" data-testid="vehicle-make-model">
                      {vehicle.number}
                    </div>
                    {wasRecentlyUpdated && (
                      <span className="inline-flex px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700 bg-emerald-500/10 dark:bg-emerald-950 dark:text-emerald-700 rounded border border-emerald-500/20 dark:border-emerald-900">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="compact-list-item-subtitle" data-testid="vehicle-plate">
                    {formatVehicleName(vehicle)}
                  </div>
                </div>

                <div className="compact-list-item-action">
                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-foreground">
                        {vehicle.region}
                      </div>
                      <div className="text-[9px] text-muted-foreground" data-testid="vehicle-driver">
                        {vehicle.department}
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-0.5", getBatteryColor(vehicle.fuelLevel))} data-testid="vehicle-mileage">
                      <BatteryMedium className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">{vehicle.fuelLevel}%</span>
                    </div>
                    <div className={cn("status-badge", getStatusColor(vehicle.status))} data-testid="vehicle-status">
                      {formatEnum(vehicle.status)}
                    </div>
                    <button
                      data-testid="view-details-btn"
                      className="p-0 border-0 bg-transparent cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onVehicleClick?.(vehicle)
                      }}
                    >
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Compact version with minimal info
export function CompactVehicleListMini({
  vehicles,
  onVehicleClick,
  maxItems = 5
}: Omit<CompactVehicleListProps, 'maxHeight'> & { maxItems?: number }) {
  const displayVehicles = useMemo(() => vehicles.slice(0, maxItems), [vehicles, maxItems])

  const getStatusColor = (status: Vehicle["status"]) => {
    const colors: Record<string, string> = {
      active: "text-green-600 dark:text-green-400",
      idle: "text-white/40 dark:text-white/40",
      charging: "text-emerald-800 dark:text-emerald-700",
      service: "text-amber-600 dark:text-amber-400",
      emergency: "text-red-600 dark:text-red-400",
      offline: "text-white/40 dark:text-white/40",
      assigned: "text-emerald-600 dark:text-emerald-400",
      dispatched: "text-orange-600 dark:text-orange-400",
      en_route: "text-teal-600 dark:text-teal-400",
      on_site: "text-yellow-600 dark:text-yellow-400",
      completed: "text-emerald-600 dark:text-emerald-400",
      maintenance: "text-amber-600 dark:text-amber-400",
      retired: "text-white/40 dark:text-white/40",
    }
    return colors[status] || colors.offline
  }

  return (
    <div className="space-y-1">
      {displayVehicles.map((vehicle, index) => (
        <div
          key={vehicle.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => onVehicleClick?.(vehicle)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Car className={cn("w-3.5 h-3.5", getStatusColor(vehicle.status))} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {vehicle.number}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {formatVehicleShortName(vehicle)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BatteryMedium className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold">{vehicle.fuelLevel}%</span>
          </div>
        </div>
      ))}
      {vehicles.length > maxItems && (
        <div className="text-center pt-1">
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            +{vehicles.length - maxItems} more
          </button>
        </div>
      )}
    </div>
  )
}