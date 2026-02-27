/**
 * Reactive UI Components
 * Auto-updating components with real-time data and smooth animations
 */

// motion removed - React 19 incompatible
import { useAtom, useAtomValue } from 'jotai'
import React, { useMemo, useEffect, useState } from 'react'

import {
  Vehicle,
  Alert,
  vehiclesAtom,
  unacknowledgedAlertsAtom,
  acknowledgeAlertAtom,
  removeAlertAtom,
  vehicleStatsAtom,
  fleetMetricsAtom,
} from '../../lib/reactive-state'

import { formatEnum } from '@/utils/format-enum'
import { formatDateTime, formatNumber } from '@/utils/format-helpers'

/* ============================================================
   REACTIVE METRIC CARD
   ============================================================ */

interface ReactiveMetricCardProps {
  title: string
  value: number | string
  unit?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  animate?: boolean
}

export function ReactiveMetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  color = 'primary',
  animate = true,
}: ReactiveMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // Animate number changes
  useEffect(() => {
    if (!animate || typeof value !== 'number') {
      setDisplayValue(typeof value === 'number' ? value : 0)
      return
    }

    let frameId: number
    const startValue = displayValue
    const endValue = value
    const duration = 1000 // 1 second
    const startTime = Date.now()

    const animateValue = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = startValue + (endValue - startValue) * eased
      setDisplayValue(current)

      if (progress < 1) {
        frameId = requestAnimationFrame(animateValue)
      }
    }

    frameId = requestAnimationFrame(animateValue)

    return () => cancelAnimationFrame(frameId)
  }, [value, animate])

  const colorClasses: Record<string, string> = {
    primary: 'bg-emerald-500/5 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    info: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  }

  const trendColors: Record<string, string> = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-white/70 dark:text-white/40',
  }

  return (
    <div
      className={`rounded-lg p-3 transition-transform duration-200 hover:scale-[1.02] ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        {icon && <div className="text-sm opacity-60">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-base font-bold"
        >
          {typeof value === 'number' ? Math.round(displayValue) : value}
        </span>
        {unit && <span className="text-sm opacity-70">{unit}</span>}
      </div>

      {trend && trendValue !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{Math.abs(trendValue)}%</span>
          <span className="opacity-70">vs last period</span>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   REACTIVE DATA TABLE
   ============================================================ */

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface ReactiveDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
}

export function ReactiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
}: ReactiveDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDirection])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-white/40 dark:text-white/40">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-white/[0.03] dark:bg-[#18181b] border-b border-white/[0.08] dark:border-white/[0.08]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-3 text-left text-xs font-medium text-white/40 dark:text-white/40 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-white/[0.05] dark:hover:bg-white/[0.08]' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#111113] divide-y divide-gray-200 dark:divide-gray-800">
          {sortedData.map((item) => (
            <tr
              key={String(item[keyField])}
              className={`${
                onRowClick
                  ? 'cursor-pointer hover:bg-white/[0.03] dark:hover:bg-[#18181b]'
                  : ''
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2 whitespace-nowrap">
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ============================================================
   REALTIME ALERTS FEED
   ============================================================ */

export function RealtimeAlertsFeed() {
  const [alerts] = useAtom(unacknowledgedAlertsAtom)
  const [, acknowledgeAlert] = useAtom(acknowledgeAlertAtom)
  const [, removeAlert] = useAtom(removeAlertAtom)

  const alertColors: Record<Alert['type'], string> = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-emerald-500/5 dark:bg-emerald-900/20 border-emerald-500/20 dark:border-emerald-800',
  }

  const alertIcons: Record<Alert['type'], string> = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-2 rounded-lg border-l-4 ${alertColors[alert.type]}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-sm">{alertIcons[alert.type]}</div>
              <div>
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                <p className="text-xs opacity-60 mt-2">
                  {formatDateTime(alert.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="text-xs px-3 py-1 rounded bg-white dark:bg-[#18181b] hover:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                aria-label="Acknowledge alert"
              >
                ✓
              </button>
              <button
                onClick={() => removeAlert(alert.id)}
                className="text-xs px-3 py-1 rounded bg-white dark:bg-[#18181b] hover:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      {alerts.length === 0 && (
        <div className="text-center py-3 text-white/40 dark:text-white/40">
          No active alerts
        </div>
      )}
    </div>
  )
}

/* ============================================================
   FLEET STATS DASHBOARD
   ============================================================ */

export function FleetStatsDashboard() {
  const stats = useAtomValue(vehicleStatsAtom)
  const metrics = useAtomValue(fleetMetricsAtom)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      <ReactiveMetricCard
        title="Total Vehicles"
        value={stats.total}
        icon="🚗"
        color="primary"
      />
      <ReactiveMetricCard
        title="Active Vehicles"
        value={stats.active}
        icon="✓"
        color="success"
      />
      <ReactiveMetricCard
        title="In Maintenance"
        value={stats.maintenance}
        icon="🔧"
        color="warning"
      />
      <ReactiveMetricCard
        title="Offline"
        value={stats.offline}
        icon="⚠"
        color="error"
      />
      <ReactiveMetricCard
        title="Avg Fuel Level"
        value={metrics.avgFuelLevel}
        unit="%"
        icon="⛽"
        color="info"
      />
      <ReactiveMetricCard
        title="Avg Battery"
        value={metrics.avgBatteryLevel}
        unit="%"
        icon="🔋"
        color="success"
      />
      <ReactiveMetricCard
        title="Avg Mileage"
        value={metrics.avgMileage}
        unit="mi"
        icon="📏"
        color="primary"
      />
      <ReactiveMetricCard
        title="Total Mileage"
        value={metrics.totalMileage}
        unit="mi"
        icon="🌍"
        color="info"
      />
    </div>
  )
}

/* ============================================================
   LIVE VEHICLE LIST
   ============================================================ */

export function LiveVehicleList({ onVehicleClick }: { onVehicleClick?: (vehicle: Vehicle) => void }) {
  const vehicles = useAtomValue(vehiclesAtom)

  const columns: Column<Vehicle>[] = [
    {
      key: 'licensePlate',
      label: 'License Plate',
      sortable: true,
    },
    {
      key: 'make',
      label: 'Make',
      sortable: true,
    },
    {
      key: 'model',
      label: 'Model',
      sortable: true,
    },
    {
      key: 'year',
      label: 'Year',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (vehicle) => {
        const statusColors: Record<Vehicle['status'], string> = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          offline: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          retired: 'bg-white/[0.05] text-white/60 dark:bg-[#111113] dark:text-white/80',
        }

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status]}`}>
            {formatEnum(vehicle.status)}
          </span>
        )
      },
    },
    {
      key: 'mileage',
      label: 'Mileage',
      sortable: true,
      render: (vehicle) => (vehicle.mileage ? `${formatNumber(vehicle.mileage)} mi` : '—'),
    },
    {
      key: 'fuelLevel',
      label: 'Fuel',
      sortable: true,
      render: (vehicle) => (vehicle.fuelLevel ? `${vehicle.fuelLevel}%` : '—'),
    },
  ]

  return (
    <ReactiveDataTable
      data={vehicles}
      columns={columns}
      keyField="id"
      onRowClick={onVehicleClick}
      emptyMessage="No vehicles found"
    />
  )
}

/* ============================================================
   CONNECTION STATUS INDICATOR
   ============================================================ */

interface ConnectionStatusProps {
  isConnected: boolean
  isReconnecting: boolean
}

export function ConnectionStatus({ isConnected, isReconnecting }: ConnectionStatusProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected
            ? 'bg-green-500'
            : isReconnecting
            ? 'bg-amber-500 animate-pulse'
            : 'bg-red-500'
        }`}
      />
      <span className="text-xs font-medium">
        {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
      </span>
    </div>
  )
}
