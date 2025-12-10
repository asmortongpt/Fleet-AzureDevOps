/**
 * Reactive UI Components
 * Auto-updating components with real-time data and smooth animations
 */

import { motion, AnimatePresence } from 'framer-motion'
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
        requestAnimationFrame(animateValue)
      }
    }

    requestAnimationFrame(animateValue)
  }, [value, animate])

  const colorClasses: Record<string, string> = {
    primary: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    info: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',
  }

  const trendColors: Record<string, string> = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  }

  return (
    <motion.div
      className={`rounded-lg p-6 shadow-lg ${colorClasses[color]}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        {icon && <div className="text-2xl opacity-60">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <motion.span
          className="text-3xl font-bold"
          key={displayValue}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {typeof value === 'number' ? Math.round(displayValue) : value}
        </motion.span>
        {unit && <span className="text-lg opacity-70">{unit}</span>}
      </div>

      {trend && trendValue !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{Math.abs(trendValue)}%</span>
          <span className="opacity-70">vs last period</span>
        </div>
      )}
    </motion.div>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
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
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          <AnimatePresence>
            {sortedData.map((item, index) => (
              <motion.tr
                key={String(item[keyField])}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`${
                  onRowClick
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                    : ''
                }`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
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
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  }

  const alertIcons: Record<Alert['type'], string> = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`p-4 rounded-lg border-l-4 ${alertColors[alert.type]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{alertIcons[alert.type]}</div>
                <div>
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-xs px-3 py-1 rounded bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Acknowledge alert"
                >
