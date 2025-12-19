import { Car, BatteryMedium, Circle, ArrowRight } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useMemo, useRef, useEffect, useState } from "react"

import { Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"

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
    const colors = {
      active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
      idle: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
      charging: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
      service: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
      emergency: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
      offline: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700"
    }
    return colors[status]
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

  const isRecentlyUpdated = (vehicle: Vehicle) => {
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
            const actualIndex = visibleRange.start + index

            return (
              <motion.div
                key={vehicle.id}
                className={cn(
                  "compact-list-item",
                  wasRecentlyUpdated && "bg-blue-50 dark:bg-blue-950/20"
                )}
                onClick={() => onVehicleClick?.(vehicle)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                data-testid="vehicle-card"
                data-vehicle-id={vehicle.id}
              >
                <div className={cn("compact-list-item-icon", getStatusColor(vehicle.status))}>
                  <Car className="w-3.5 h-3.5" weight="fill" />
                  {wasRecentlyUpdated && (
                    <Circle
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 fill-blue-500 text-blue-500 animate-pulse"
                      weight="fill"
                    />
                  )}
                </div>

                <div className="compact-list-item-content">
                  <div className="flex items-center gap-1.5">
                    <div className="compact-list-item-title" data-testid="vehicle-make-model">
                      {vehicle.number}
                    </div>
                    {wasRecentlyUpdated && (
                      <span className="inline-flex px-1.5 py-0.5 text-[8px] font-semibold text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-900">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="compact-list-item-subtitle" data-testid="vehicle-plate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
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
                      {vehicle.status}
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
              </motion.div>
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
    const colors = {
      active: "text-green-600 dark:text-green-400",
      idle: "text-gray-500 dark:text-gray-400",
      charging: "text-blue-600 dark:text-blue-400",
      service: "text-amber-600 dark:text-amber-400",
      emergency: "text-red-600 dark:text-red-400",
      offline: "text-gray-400 dark:text-gray-500"
    }
    return colors[status]
  }

  return (
    <div className="space-y-1">
      {displayVehicles.map((vehicle, index) => (
        <motion.div
          key={vehicle.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => onVehicleClick?.(vehicle)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Car className={cn("w-3.5 h-3.5", getStatusColor(vehicle.status))} weight="fill" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {vehicle.number}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {vehicle.make} {vehicle.model}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BatteryMedium className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold">{vehicle.fuelLevel}%</span>
          </div>
        </motion.div>
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
