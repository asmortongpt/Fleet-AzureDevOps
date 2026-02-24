/**
 * DriversHub - Professional Driver Management Dashboard
 *
 * Government-professional quality:
 * - Charcoal/white theme only
 * - Semantic safety score colors
 * - Overtime flagging
 * - Proper date/enum/number formatting
 * - No emoji, no animations, no gold/orange/cyan
 */

import { type ColumnDef } from '@tanstack/react-table'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  AlertTriangle,
  Clock,
  Activity,
  Shield,
  BadgeCheck,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { useReactiveDriversData } from '@/hooks/use-reactive-drivers-data'
import { cn } from '@/lib/utils'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatNumber } from '@/utils/format-helpers'

interface Driver {
  id: number
  name: string
  email: string
  phone: string
  licenseNumber: string
  status: string
  currentVehicle?: string
  location?: string
  hoursToday: number
  hoursWeek: number
  safetyScore: number
  rating: number
  totalTrips: number
  totalMiles: number
  violations: number
  lastTrip?: string
  certifications?: string[]
  hireDate: string
}

export default function DriversHub() {
  const { drivers: liveDrivers, isLoading } = useReactiveDriversData()
  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>([])

  // Transform live data to table format
  const drivers = useMemo<Driver[]>(() => {
    if (!liveDrivers?.length) {
      return []
    }

    return liveDrivers.map((d: any) => ({
      id: d.id,
      name: d.name ?? d.driver_name ?? '',
      email: d.email ?? '',
      phone: d.phone ?? d.phone_number ?? '',
      licenseNumber: d.license_number ?? d.licenseNumber ?? '',
      status: d.status ?? 'active',
      currentVehicle: d.current_vehicle ?? d.currentVehicle,
      location: d.location ?? d.current_location ?? '',
      hoursToday: d.hours_today ?? d.hoursToday ?? 0,
      hoursWeek: d.hours_week ?? d.hoursWeek ?? 0,
      safetyScore: d.safety_score ?? d.safetyScore ?? 0,
      rating: d.rating ?? d.driver_rating ?? 0,
      totalTrips: d.total_trips ?? d.totalTrips ?? 0,
      totalMiles: d.total_miles ?? d.totalMiles ?? 0,
      violations: d.violations ?? d.violation_count ?? 0,
      lastTrip: d.last_trip ?? d.lastTrip,
      certifications: d.certifications ?? [],
      hireDate: d.hire_date ?? d.hireDate ?? '',
    }))
  }, [liveDrivers])

  // Define table columns
  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Driver Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="font-medium text-foreground">{row.getValue('name')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">{row.getValue('email')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-mono text-sm">{row.getValue('phone')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'licenseNumber',
        header: 'License #',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground">{row.getValue('licenseNumber') || '\u2014'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          const normalized = status?.toLowerCase().replace(/[\s_-]+/g, '')
          const isActive = normalized === 'active'
          const isOnLeave = normalized === 'onleave'
          return (
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : isOnLeave
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-white/[0.06] text-muted-foreground'
              )}
            >
              {formatEnum(status)}
            </span>
          )
        },
      },
      {
        accessorKey: 'currentVehicle',
        header: 'Current Vehicle',
        cell: ({ row }) => {
          const vehicle = row.getValue('currentVehicle') as string | undefined
          return vehicle ? (
            <div className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground text-sm">{vehicle}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Not assigned</span>
          )
        },
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">{row.getValue('location') || '\u2014'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'hoursToday',
        header: 'Hours Today',
        cell: ({ row }) => {
          const hours = row.getValue('hoursToday') as number
          const isOvertime = hours > 8
          return (
            <div className="flex items-center gap-2">
              <Clock className={cn('h-3.5 w-3.5', isOvertime ? 'text-rose-400' : 'text-muted-foreground')} />
              <span className={cn('font-medium text-sm', isOvertime ? 'text-rose-400' : 'text-foreground')}>
                {hours.toFixed(1)}h
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'hoursWeek',
        header: 'Hours/Week',
        cell: ({ row }) => {
          const hours = row.getValue('hoursWeek') as number
          const isOvertime = hours > 40
          return (
            <span className={cn('font-medium text-sm', isOvertime ? 'text-rose-400' : 'text-foreground')}>
              {hours.toFixed(1)}h
            </span>
          )
        },
      },
      {
        accessorKey: 'safetyScore',
        header: 'Safety Score',
        cell: ({ row }) => {
          const score = row.getValue('safetyScore') as number
          const color =
            score >= 95
              ? 'text-emerald-400'
              : score >= 85
                ? 'text-amber-400'
                : 'text-rose-400'
          return (
            <div className="flex items-center gap-2">
              <Shield className={cn('h-3.5 w-3.5', color)} />
              <span className={cn('font-semibold text-sm', color)}>{score}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }) => {
          const rating = row.getValue('rating') as number
          return (
            <span className="text-foreground font-medium text-sm">{rating.toFixed(1)}</span>
          )
        },
      },
      {
        accessorKey: 'totalTrips',
        header: 'Total Trips',
        cell: ({ row }) => (
          <span className="text-foreground text-sm">{formatNumber(row.getValue('totalTrips') as number)}</span>
        ),
      },
      {
        accessorKey: 'totalMiles',
        header: 'Total Miles',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{formatNumber(row.getValue('totalMiles') as number)}</span>
        ),
      },
      {
        accessorKey: 'violations',
        header: 'Violations',
        cell: ({ row }) => {
          const violations = row.getValue('violations') as number
          return (
            <div className="flex items-center gap-2">
              {violations > 0 ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-rose-400 font-semibold text-sm">{violations}</span>
                </>
              ) : (
                <>
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm">0</span>
                </>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'lastTrip',
        header: 'Last Trip',
        cell: ({ row }) => {
          const val = row.getValue('lastTrip') as string | undefined
          return (
            <span className="text-muted-foreground text-xs">{formatDate(val)}</span>
          )
        },
      },
      {
        accessorKey: 'hireDate',
        header: 'Hire Date',
        cell: ({ row }) => {
          const val = row.original.hireDate
          return (
            <span className="text-muted-foreground text-xs">{formatDate(val)}</span>
          )
        },
      },
    ],
    []
  )

  // Calculate driver statistics
  const driverStats = useMemo(() => {
    const total = drivers.length
    if (total === 0) {
      return { total: 0, active: 0, onLeave: 0, avgSafetyScore: 0 }
    }
    const active = drivers.filter(
      (d) => d.status?.toLowerCase().replace(/[\s_-]+/g, '') === 'active'
    ).length
    const onLeave = drivers.filter(
      (d) => d.status?.toLowerCase().replace(/[\s_-]+/g, '') === 'onleave'
    ).length
    const avgSafetyScore = Math.round(
      drivers.reduce((sum, d) => sum + d.safetyScore, 0) / total
    )

    return { total, active, onLeave, avgSafetyScore }
  }, [drivers])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Driver Management</h1>
          <p className="text-xs text-muted-foreground">Loading driver data...</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#242424] border border-white/[0.08] animate-pulse rounded" />
          ))}
        </div>
        <div className="flex-1 min-h-0 bg-[#242424] border border-white/[0.08] animate-pulse rounded" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Driver Management</h1>
          <p className="text-xs text-muted-foreground">
            {drivers.length} drivers
            {selectedDrivers.length > 0 && ` / ${selectedDrivers.length} selected`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.08] text-foreground"
          >
            Export Data
          </Button>
          <Button
            size="sm"
            className="bg-white/[0.08] text-foreground hover:bg-white/[0.12]"
          >
            Add Driver
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        <KPICard
          label="Total Drivers"
          value={formatNumber(driverStats.total)}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <KPICard
          label="Active"
          value={formatNumber(driverStats.active)}
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
        />
        <KPICard
          label="On Leave"
          value={formatNumber(driverStats.onLeave)}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        <KPICard
          label="Avg Safety Score"
          value={String(driverStats.avgSafetyScore)}
          icon={<Shield className={cn(
            'h-4 w-4',
            driverStats.avgSafetyScore >= 95
              ? 'text-emerald-400'
              : driverStats.avgSafetyScore >= 85
                ? 'text-amber-400'
                : 'text-rose-400'
          )} />}
        />
      </div>

      {/* Main Data Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        {drivers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No records found
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={drivers}
            searchPlaceholder="Search drivers by name, email, phone, license..."
            onRowSelect={setSelectedDrivers}
            enableRowSelection={true}
            enableSearch={true}
            enablePagination={true}
            defaultPageSize={25}
          />
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}

// KPI Card - charcoal/white only
interface KPICardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function KPICard({ label, value, icon }: KPICardProps) {
  return (
    <div className="bg-[#242424] border border-white/[0.08] rounded px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  )
}
