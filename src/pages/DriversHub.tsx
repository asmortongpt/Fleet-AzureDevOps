/**
 * DriversHub - Professional Driver Management Dashboard
 *
 * Enterprise-grade driver management with:
 * - Professional table-based layout (NO cards)
 * - CTA branded styling
 * - Real-time driver data
 * - Advanced sorting, filtering, pagination
 * - All data visible upfront
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
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Star,
  Shield,
  BadgeCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DataTable, createStatusColumn, createMonospaceColumn } from '@/components/ui/data-table'
import { useReactiveDriversData } from '@/hooks/use-reactive-drivers-data'
import { cn } from '@/lib/utils'

interface Driver {
  id: number
  name: string
  email: string
  phone: string
  licenseNumber: string
  status: 'Active' | 'Inactive' | 'On Leave' | 'Training'
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
      status: d.status ?? 'Active',
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

  // Define table columns with CTA styling
  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Driver Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2F3359] flex items-center justify-center">
              <User className="h-4 w-4 text-[#41B2E3]" />
            </div>
            <span className="font-semibold text-white">{row.getValue('name')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#41B2E3]" />
            <span className="text-gray-200 text-sm">{row.getValue('email')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#41B2E3]" />
            <span className="text-gray-200 font-mono text-sm">{row.getValue('phone')}</span>
          </div>
        ),
      },
      createMonospaceColumn<Driver>('licenseNumber', 'License #'),
      createStatusColumn<Driver>('status', 'Status'),
      {
        accessorKey: 'currentVehicle',
        header: 'Current Vehicle',
        cell: ({ row }) => {
          const vehicle = row.getValue('currentVehicle') as string | undefined
          return vehicle ? (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-[#F0A000]" />
              <span className="text-white text-sm">{vehicle}</span>
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
            <MapPin className="h-4 w-4 text-[#41B2E3]" />
            <span className="text-gray-200 text-sm">{row.getValue('location') || 'Unknown'}</span>
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
              <Clock className={cn('h-4 w-4', isOvertime ? 'text-[#DD3903]' : 'text-[#41B2E3]')} />
              <span className={cn('font-medium', isOvertime ? 'text-[#DD3903]' : 'text-white')}>
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
            <span className={cn('font-medium', isOvertime ? 'text-[#F0A000]' : 'text-white')}>
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
          const color = score >= 95 ? 'text-emerald-400' : score >= 85 ? 'text-[#F0A000]' : 'text-[#DD3903]'
          return (
            <div className="flex items-center gap-2">
              <Shield className={cn('h-4 w-4', color)} />
              <span className={cn('font-bold', color)}>{score}</span>
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
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-[#F0A000] fill-[#F0A000]" />
              <span className="text-white font-medium">{rating.toFixed(1)}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'totalTrips',
        header: 'Total Trips',
        cell: ({ row }) => (
          <span className="text-white">{(row.getValue('totalTrips') as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'totalMiles',
        header: 'Total Miles',
        cell: ({ row }) => (
          <span className="text-gray-200">{(row.getValue('totalMiles') as number).toLocaleString()}</span>
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
                  <AlertTriangle className="h-4 w-4 text-[#DD3903]" />
                  <span className="text-[#DD3903] font-semibold">{violations}</span>
                </>
              ) : (
                <>
                  <BadgeCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">0</span>
                </>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'lastTrip',
        header: 'Last Trip',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400 text-xs">{row.getValue('lastTrip') || 'N/A'}</span>
          </div>
        ),
      },
    ],
    []
  )

  // Calculate driver statistics
  const driverStats = useMemo(() => {
    const total = drivers.length
    const active = drivers.filter((d) => d.status === 'Active').length
    const onLeave = drivers.filter((d) => d.status === 'On Leave').length
    const avgSafetyScore = Math.round(
      drivers.reduce((sum, d) => sum + d.safetyScore, 0) / total
    )
    const avgRating = (drivers.reduce((sum, d) => sum + d.rating, 0) / total).toFixed(1)
    const totalViolations = drivers.reduce((sum, d) => sum + d.violations, 0)
    const totalHoursToday = drivers.reduce((sum, d) => sum + d.hoursToday, 0)

    return {
      total,
      active,
      onLeave,
      avgSafetyScore,
      avgRating,
      totalViolations,
      totalHoursToday: totalHoursToday.toFixed(1),
    }
  }, [drivers])

  return (
    <div className="min-h-screen bg-[#0A0E27] p-3 space-y-3">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F0A000] to-[#DD3903]" />
        <div className="pt-3">
          <h1 className="text-2xl font-bold text-white mb-1">Driver Management</h1>
          <p className="text-sm text-gray-300">
            Intelligent Technology. Integrated Partnership. - ArchonY: Intelligent Performance
          </p>
        </div>
      </div>

      {/* Stats Bar - Compact and Professional */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <StatCard
          label="Total Drivers"
          value={driverStats.total}
          icon={<User className="h-5 w-5 text-[#41B2E3]" />}
          trend="neutral"
        />
        <StatCard
          label="Active"
          value={driverStats.active}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          trend="up"
        />
        <StatCard
          label="On Leave"
          value={driverStats.onLeave}
          icon={<Calendar className="h-5 w-5 text-[#F0A000]" />}
          trend="neutral"
        />
        <StatCard
          label="Avg Safety"
          value={driverStats.avgSafetyScore}
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
          trend="up"
        />
        <StatCard
          label="Avg Rating"
          value={driverStats.avgRating}
          icon={<Star className="h-5 w-5 text-[#F0A000]" />}
          trend="neutral"
        />
        <StatCard
          label="Violations"
          value={driverStats.totalViolations}
          icon={<AlertTriangle className="h-5 w-5 text-[#DD3903]" />}
          trend="down"
        />
        <StatCard
          label="Hours Today"
          value={driverStats.totalHoursToday}
          icon={<Clock className="h-5 w-5 text-[#41B2E3]" />}
          trend="neutral"
        />
      </div>

      {/* Main Data Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Driver Fleet</h2>
            <p className="text-xs text-gray-300 mt-0.5">
              {selectedDrivers.length > 0 && `${selectedDrivers.length} selected • `}
              All data visible • Professional table layout
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-[#131B45] border-[#41B2E3]/20 text-white hover:bg-[#41B2E3]/20"
            >
              Export Data
            </Button>
            <Button className="bg-[#DD3903] hover:bg-[#DD3903]/90 text-white">
              Add Driver
            </Button>
          </div>
        </div>

        {(!isLoading && drivers.length === 0) ? (
          <div className="rounded-lg border border-[#41B2E3]/20 bg-[#131B45] p-6 text-sm text-gray-200">
            No driver records found. Connect the drivers service or seed the CTA dataset to populate this table.
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

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-3 border-t border-[#41B2E3]/10">
        CTA Driver Management • ArchonY Platform • Real-time updates • Professional data tables
      </div>
    </div>
  )
}

// Professional Stat Card Component
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ label, value, icon, trend = 'neutral' }: StatCardProps) {
  return (
    <div className="bg-[#2F3359] border border-[#41B2E3]/20 rounded-lg p-3 hover:border-[#41B2E3]/40 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
          {label}
        </div>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-xl font-bold text-white">{value}</div>
        {trend !== 'neutral' && (
          <div className={cn(
            'flex items-center text-xs mb-1',
            trend === 'up' ? 'text-emerald-400' : 'text-[#DD3903]'
          )}>
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
