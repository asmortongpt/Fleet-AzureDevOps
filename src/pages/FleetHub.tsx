/**
 * FleetHub - Fleet Management Dashboard
 *
 * Theme-aware design using Tailwind CSS semantic classes:
 * - Supports both light and dark modes via CSS variables
 * - Uses bg-background, bg-card, text-foreground, etc.
 * - Semantic status colors via Tailwind named palette (emerald, amber, red, blue)
 * - Professional typography with accessible spacing
 */

import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Car,
  MapPin,
  Fuel,
  Gauge,
  User,
  AlertTriangle,
  DollarSign,
  Clock,
  Zap,
  HeartPulse,
  Building2,
} from 'lucide-react'
import { DataTable, createStatusColumn, createMonospaceColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useReactiveFleetData } from '@/hooks/use-reactive-fleet-data'
import { cn } from '@/lib/utils'

interface Vehicle {
  id: number
  vin: string
  make: string
  model: string
  year: number
  licensePlate: string
  status: 'active' | 'inactive' | 'maintenance' | 'warning' | 'critical'
  driver?: string | null
  location?: string | null
  region?: string | null
  fuelLevel?: number | null
  mileage: number
  lastMaintenance?: string | null
  nextMaintenance?: string | null
  avgMpg?: number | null
  totalCost?: number | null
  lastUpdated?: string | null
  healthScore?: number | null
  department?: string | null
  operationalStatus?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED' | null
}

export default function FleetHub() {
  const { vehicles: liveVehicles, metrics: stats, isLoading } = useReactiveFleetData()
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([])

  // Transform live data to table format
  const vehicles = useMemo<Vehicle[]>(() => {
    return liveVehicles.map((v: any) => ({
      id: v.id,
      vin: v.vin ?? '',
      make: v.make ?? '',
      model: v.model ?? '',
      year: v.year ?? 0,
      licensePlate: v.license_plate ?? v.licensePlate ?? '',
      status: (v.status || 'active').toLowerCase(),
      driver: v.assigned_driver ?? v.driver ?? null,
      location: v.location ?? null,
      region: v.region ?? null,
      fuelLevel: v.fuel_level ?? v.fuelLevel ?? null,
      mileage: v.mileage ?? v.odometer ?? 0,
      lastMaintenance: v.last_maintenance ?? v.lastMaintenance ?? null,
      nextMaintenance: v.next_maintenance ?? v.nextMaintenance ?? null,
      avgMpg: v.avg_mpg ?? v.avgMpg ?? null,
      totalCost: v.total_cost ?? v.totalCost ?? null,
      lastUpdated: v.last_updated ?? v.lastUpdated ?? null,
      healthScore: v.health_score ?? v.healthScore ?? null,
      department: v.department ?? null,
      operationalStatus: v.operational_status ?? v.operationalStatus ?? null,
    }))
  }, [liveVehicles])

  // Define table columns with maximum contrast
  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      createMonospaceColumn<Vehicle>('vin', 'VIN'),
      {
        accessorKey: 'make',
        header: 'Make',
        cell: ({ row }) => (
          <div className="font-medium text-foreground">{row.getValue('make')}</div>
        ),
      },
      {
        accessorKey: 'model',
        header: 'Model',
        cell: ({ row }) => (
          <div className="text-foreground">{row.getValue('model')}</div>
        ),
      },
      {
        accessorKey: 'year',
        header: 'Year',
        cell: ({ row }) => (
          <div className="text-muted-foreground">{row.getValue('year')}</div>
        ),
      },
      createMonospaceColumn<Vehicle>('licensePlate', 'License'),
      createStatusColumn<Vehicle>('status', 'Status'),
      {
        accessorKey: 'healthScore',
        header: 'Health',
        cell: ({ row }) => {
          const score = row.getValue('healthScore') as number | null
          if (score == null) {
            return <span className="text-muted-foreground text-xs">--</span>
          }
          const color =
            score >= 80
              ? 'bg-emerald-500'
              : score >= 60
                ? 'bg-amber-500'
                : 'bg-red-500'
          const textColor =
            score >= 80
              ? 'text-emerald-500'
              : score >= 60
                ? 'text-amber-500'
                : 'text-red-500'
          return (
            <div className="flex items-center gap-2 min-w-[80px]">
              <Progress
                value={score}
                className="h-1.5 w-12 bg-muted"
                indicatorClassName={color}
              />
              <span className={cn('text-xs font-medium', textColor)}>{score}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'department',
        header: 'Dept',
        cell: ({ row }) => {
          const dept = row.getValue('department') as string | null
          if (!dept) {
            return <span className="text-muted-foreground text-xs">--</span>
          }
          return (
            <Badge
              variant="outline"
              size="sm"
              className="bg-muted border-border text-muted-foreground font-normal"
            >
              {dept}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'operationalStatus',
        header: 'Op Status',
        cell: ({ row }) => {
          const opStatus = row.getValue('operationalStatus') as string | null
          if (!opStatus) {
            return <span className="text-muted-foreground text-xs">--</span>
          }
          const opStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
            AVAILABLE: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', label: 'Available' },
            IN_USE: { bg: 'bg-blue-500/15', text: 'text-blue-500', label: 'In Use' },
            MAINTENANCE: { bg: 'bg-amber-500/15', text: 'text-amber-500', label: 'Maintenance' },
            RESERVED: { bg: 'bg-yellow-400/15', text: 'text-yellow-400', label: 'Reserved' },
          }
          const cfg = opStatusConfig[opStatus] || { bg: 'bg-muted', text: 'text-muted-foreground', label: opStatus }
          return (
            <Badge
              variant="outline"
              size="sm"
              className={cn(cfg.bg, cfg.text, 'border-transparent font-medium')}
            >
              {cfg.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'driver',
        header: 'Driver',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground">{row.getValue('driver') || 'Unassigned'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const location = row.getValue('location') as string | null
          const region = row.original.region
          return (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-muted-foreground">{location || 'Unknown'}</span>
                {region && (
                  <span className="text-[10px] text-muted-foreground/60 leading-tight">{region}</span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'fuelLevel',
        header: 'Fuel',
        cell: ({ row }) => {
          const fuel = row.getValue('fuelLevel') as number
          const isEV = row.original.avgMpg === 0
          const Icon = isEV ? Zap : Fuel
          const color = fuel > 50 ? 'text-emerald-500' : fuel > 20 ? 'text-amber-500' : 'text-red-500'

          if (fuel == null) {
            return <span className="text-muted-foreground text-xs">—</span>
          }
          return (
            <div className="flex items-center gap-1.5">
              <Icon className={cn('h-3.5 w-3.5', color)} />
              <span className={color}>{fuel}%</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'mileage',
        header: 'Mileage',
        cell: ({ row }) => {
          const mileage = row.getValue('mileage') as number
          return (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">{mileage.toLocaleString()}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'avgMpg',
        header: 'MPG',
        cell: ({ row }) => {
          const mpg = row.getValue('avgMpg') as number
          if (mpg == null) {
            return <span className="text-muted-foreground text-xs">—</span>
          }
          if (mpg === 0) {
            return <span className="text-muted-foreground text-xs">EV</span>
          }
          return (
            <div className="text-foreground">{mpg.toFixed(1)}</div>
          )
        },
      },
      {
        accessorKey: 'totalCost',
        header: 'Cost',
        cell: ({ row }) => {
          const cost = row.getValue('totalCost') as number | null
          return (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">{cost != null ? `$${cost.toLocaleString()}` : '—'}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'lastUpdated',
        header: 'Updated',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{row.getValue('lastUpdated') || '—'}</span>
        </div>
      ),
    },
    ],
    []
  )

  // Calculate fleet statistics
  const fleetStats = useMemo(() => {
    const total = vehicles.length
    const active = vehicles.filter((v) => v.status === 'active').length
    const maintenance = vehicles.filter((v) => v.status === 'maintenance').length
    const warnings = vehicles.filter((v) => v.status === 'warning' || v.status === 'critical').length
    const fuelValues = vehicles.map((v) => v.fuelLevel).filter((value): value is number => typeof value === 'number')
    const avgFuel = fuelValues.length ? fuelValues.reduce((sum, v) => sum + v, 0) / fuelValues.length : 0
    const totalMileage = vehicles.reduce((sum, v) => sum + v.mileage, 0)
    const totalCost = vehicles.reduce((sum, v) => sum + (v.totalCost || 0), 0)

    // Avg Health Score
    const healthValues = vehicles
      .map((v) => v.healthScore)
      .filter((value): value is number => typeof value === 'number')
    const avgHealth = healthValues.length
      ? Math.round(healthValues.reduce((sum, v) => sum + v, 0) / healthValues.length)
      : null

    // Department breakdown
    const deptCounts: Record<string, number> = {}
    vehicles.forEach((v) => {
      if (v.department) {
        deptCounts[v.department] = (deptCounts[v.department] || 0) + 1
      }
    })
    const uniqueDepts = Object.keys(deptCounts).length

    return {
      total,
      active,
      maintenance,
      warnings,
      avgFuel: Math.round(avgFuel),
      totalMileage,
      totalCost,
      avgHealth,
      uniqueDepts,
      deptCounts,
    }
  }, [vehicles])

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Minimal Header */}
      <div className="border-b border-border pb-2">
        <h1 className="text-xl font-semibold text-foreground">Fleet Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time vehicle monitoring and analytics
        </p>
      </div>

      {/* Ultra-Compact Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
        <StatCard
          label="Total"
          value={fleetStats.total}
          icon={<Car className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Active"
          value={fleetStats.active}
          icon={<Car className="h-4 w-4 text-emerald-500" />}
          highlight="success"
        />
        <StatCard
          label="Maintenance"
          value={fleetStats.maintenance}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          highlight="warning"
        />
        <StatCard
          label="Warnings"
          value={fleetStats.warnings}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          highlight="error"
        />
        <StatCard
          label="Avg Fuel"
          value={`${fleetStats.avgFuel}%`}
          icon={<Fuel className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Mileage"
          value={`${(fleetStats.totalMileage / 1000).toFixed(0)}K`}
          icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Cost"
          value={`$${(fleetStats.totalCost / 1000).toFixed(0)}K`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          label="Avg Health"
          value={fleetStats.avgHealth != null ? fleetStats.avgHealth : '--'}
          icon={
            <HeartPulse
              className={cn(
                'h-4 w-4',
                fleetStats.avgHealth != null && fleetStats.avgHealth >= 80
                  ? 'text-emerald-500'
                  : fleetStats.avgHealth != null && fleetStats.avgHealth >= 60
                    ? 'text-amber-500'
                    : fleetStats.avgHealth != null
                      ? 'text-red-500'
                      : 'text-muted-foreground'
              )}
            />
          }
          highlight={
            fleetStats.avgHealth != null && fleetStats.avgHealth >= 80
              ? 'success'
              : fleetStats.avgHealth != null && fleetStats.avgHealth >= 60
                ? 'warning'
                : fleetStats.avgHealth != null
                  ? 'error'
                  : undefined
          }
        />
        <DeptStatCard
          uniqueDepts={fleetStats.uniqueDepts}
          deptCounts={fleetStats.deptCounts}
        />
      </div>

      {/* Main Data Table - Ultra-Compact */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Vehicles</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedVehicles.length > 0 && `${selectedVehicles.length} selected • `}
              {vehicles.length} total
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              Export
            </Button>
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
            >
              Add Vehicle
            </Button>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
            No vehicles available. Connect to backend to load fleet data.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={vehicles}
            searchPlaceholder="Search by VIN, make, model, license..."
            onRowSelect={setSelectedVehicles}
            enableRowSelection={true}
            enableSearch={true}
            enablePagination={true}
            defaultPageSize={25}
          />
        )}
      </div>
    </div>
  )
}

// Stat Card
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  highlight?: 'success' | 'warning' | 'error'
}

function StatCard({ label, value, icon, highlight }: StatCardProps) {
  const highlightColor = {
    success: 'border-emerald-500/30',
    warning: 'border-amber-500/30',
    error: 'border-red-500/30',
  }

  return (
    <div className={cn(
      "bg-card border rounded-md p-3 hover:bg-muted transition-colors",
      highlight ? highlightColor[highlight] : "border-border"
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        {icon}
      </div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  )
}

// Department Stat Card with breakdown tooltip
interface DeptStatCardProps {
  uniqueDepts: number
  deptCounts: Record<string, number>
}

function DeptStatCard({ uniqueDepts, deptCounts }: DeptStatCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])

  return (
    <div
      className="bg-card border border-border rounded-md p-3 hover:bg-muted transition-colors relative cursor-pointer"
      onMouseEnter={() => setShowBreakdown(true)}
      onMouseLeave={() => setShowBreakdown(false)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Departments
        </div>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-lg font-bold text-foreground">{uniqueDepts}</div>

      {/* Breakdown Popover */}
      {showBreakdown && sortedDepts.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-muted border border-border rounded-md p-2 min-w-[140px] shadow-xl">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-1.5">Breakdown</div>
          {sortedDepts.slice(0, 8).map(([dept, count]) => (
            <div key={dept} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-xs text-muted-foreground truncate max-w-[90px]">{dept}</span>
              <span className="text-xs text-foreground font-medium">{count}</span>
            </div>
          ))}
          {sortedDepts.length > 8 && (
            <div className="text-[10px] text-muted-foreground/60 mt-1">+{sortedDepts.length - 8} more</div>
          )}
        </div>
      )}
    </div>
  )
}
