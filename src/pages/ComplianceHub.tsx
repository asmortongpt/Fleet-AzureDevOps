/**
 * ComplianceHub - Professional Compliance Management Dashboard
 *
 * Enterprise-grade compliance management with:
 * - Professional table-based layout (NO cards)
 * - CTA branded styling
 * - Compliance tracking, inspections, violations
 * - Advanced sorting, filtering, pagination
 * - All data visible upfront
 */

import { type ColumnDef } from '@tanstack/react-table'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Clock,
  User,
  Car,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  BadgeCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { DataTable, createStatusColumn } from '@/components/ui/data-table'
import { useFleetData } from '@/hooks/use-fleet-data'
import { useExport } from '@/hooks/useExport'
import { cn } from '@/lib/utils'
import { formatVehicleName } from '@/utils/vehicle-display'

interface ComplianceRecord {
  id: number
  recordType: 'Inspection' | 'Violation' | 'Certification' | 'Audit'
  vehicle: string
  driver: string
  date: string
  status: 'Passed' | 'Failed' | 'Warning' | 'Pending' | 'Expired'
  inspector?: string
  category: string
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate?: string
  notes?: string
  resolution?: string
}

export default function ComplianceHub() {
  const [selectedRecords, setSelectedRecords] = useState<ComplianceRecord[]>([])
  const fleetData = useFleetData()
  const { exportToCSV } = useExport()

  const complianceRecords = useMemo<ComplianceRecord[]>(() => {
    const vehiclesById = new Map(fleetData.vehicles.map((v: any) => [v.id, v]))
    const driversById = new Map(fleetData.drivers.map((d: any) => [d.id ?? d.driver_id, d]))

    const inspections = (fleetData.inspections || []).map((inspection: any) => {
      const vehicle = vehiclesById.get(inspection.vehicle_id)
      const driver = driversById.get(inspection.driver_id)
      return {
        id: inspection.id,
        recordType: 'Inspection' as const,
        vehicle: vehicle ? formatVehicleName(vehicle) : '',
        driver: driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : '',
        date: inspection.completed_at || inspection.inspection_date || inspection.created_at || '',
        status: (inspection.status === 'passed' ? 'Passed' : inspection.status === 'failed' ? 'Failed' : 'Pending') as ComplianceRecord['status'],
        inspector: inspection.inspector || inspection.inspector_name || '',
        category: inspection.type || inspection.inspection_type || 'Inspection',
        severity: inspection.severity || 'Low',
        dueDate: inspection.next_due_date || inspection.due_date,
        notes: inspection.notes || inspection.summary,
        resolution: inspection.resolution || ''
      }
    })

    const incidents = (fleetData.incidents || []).map((incident: any) => {
      const vehicle = vehiclesById.get(incident.vehicle_id)
      const driver = driversById.get(incident.driver_id)
      const severity = incident.severity || incident.priority || 'Low'
      const status =
        String(incident.status || '').toLowerCase() === 'resolved'
          ? 'Passed'
          : String(severity).toLowerCase() === 'critical'
            ? 'Failed'
            : 'Warning'

      return {
        id: incident.id,
        recordType: 'Violation' as const,
        vehicle: vehicle ? formatVehicleName(vehicle) : '',
        driver: driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : '',
        date: incident.created_at || incident.event_time || '',
        status: status as ComplianceRecord['status'],
        inspector: incident.reported_by || '',
        category: incident.category || incident.type || 'Violation',
        severity: severity,
        dueDate: incident.due_date || '',
        notes: incident.description || incident.notes || '',
        resolution: incident.resolution || ''
      }
    })

    return [...inspections, ...incidents]
  }, [fleetData.drivers, fleetData.vehicles, fleetData.inspections, fleetData.incidents])

  // Define table columns with CTA styling
  const columns = useMemo<ColumnDef<ComplianceRecord>[]>(
    () => [
      {
        accessorKey: 'recordType',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('recordType') as string
          const typeColors: Record<string, string> = {
            'Inspection': 'bg-[hsl(var(--chart-1)/0.2)] text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1)/0.3)]',
            'Violation': 'bg-[hsl(var(--chart-6)/0.2)] text-[hsl(var(--chart-6))] border-[hsl(var(--chart-6)/0.3)]',
            'Certification': 'bg-[hsl(var(--chart-2)/0.2)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/0.3)]',
            'Audit': 'bg-[hsl(var(--chart-3)/0.2)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.3)]',
          }
          return (
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
              typeColors[type] || 'bg-white/[0.04] text-white/40 border-white/[0.04]'
            )}>
              {type}
            </span>
          )
        },
      },
      {
        accessorKey: 'vehicle',
        header: 'Vehicle',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-white font-medium">{row.getValue('vehicle')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'driver',
        header: 'Driver',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-white/40">{row.getValue('driver')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/40" />
            <span className="text-white">{row.getValue('date')}</span>
          </div>
        ),
      },
      createStatusColumn<ComplianceRecord>('status', 'Status'),
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-white/40 text-sm">{row.getValue('category')}</span>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => {
          const severity = row.getValue('severity') as string | undefined
          if (!severity) return <span className="text-white/40">-</span>

          const severityColors: Record<string, string> = {
            'Low': 'text-[hsl(var(--chart-2))]',
            'Medium': 'text-[hsl(var(--chart-3))]',
            'High': 'text-[hsl(var(--chart-6))]',
            'Critical': 'text-[hsl(var(--chart-6))] font-bold',
          }

          const icons = {
            'Low': <CheckCircle className="h-4 w-4" />,
            'Medium': <AlertTriangle className="h-4 w-4" />,
            'High': <AlertTriangle className="h-4 w-4" />,
            'Critical': <AlertOctagon className="h-4 w-4" />,
          }

          return (
            <div className={cn('flex items-center gap-2', severityColors[severity])}>
              {icons[severity as keyof typeof icons]}
              <span className="font-medium">{severity}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'inspector',
        header: 'Inspector',
        cell: ({ row }) => (
          <span className="text-white/40 text-sm">{row.getValue('inspector') || '-'}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => {
          const dueDate = row.getValue('dueDate') as string | undefined
          if (!dueDate) return <span className="text-white/40">-</span>

          const isOverdue = new Date(dueDate) < new Date()
          return (
            <div className="flex items-center gap-2">
              <Clock className={cn('h-4 w-4', isOverdue ? 'text-rose-400' : 'text-white/40')} />
              <span className={cn('text-sm', isOverdue ? 'text-rose-400 font-semibold' : 'text-white/40')}>
                {dueDate}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => (
          <span className="text-white/40 text-xs max-w-xs truncate block">
            {row.getValue('notes') || '-'}
          </span>
        ),
      },
    ],
    []
  )

  // Calculate compliance statistics
  const complianceStats = useMemo(() => {
    const total = complianceRecords.length
    const passed = complianceRecords.filter((r) => r.status === 'Passed').length
    const failed = complianceRecords.filter((r) => r.status === 'Failed').length
    const warnings = complianceRecords.filter((r) => r.status === 'Warning').length
    const expired = complianceRecords.filter((r) => r.status === 'Expired').length
    const critical = complianceRecords.filter((r) => r.severity === 'Critical').length
    const passRate = Math.round((passed / total) * 100)

    return {
      total,
      passed,
      failed,
      warnings,
      expired,
      critical,
      passRate,
    }
  }, [complianceRecords])

  if (fleetData.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-rose-400 font-medium">Failed to load data</p>
        <p className="text-sm text-white/40">{fleetData.error instanceof Error ? fleetData.error.message : 'An unexpected error occurred'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#0e0e0e] p-3 space-y-3">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-px bg-white/[0.04]" />
        <div className="pt-3">
          <h1 className="text-xl font-bold text-white mb-1">Compliance Management</h1>
          <p className="text-sm text-white/40">
            Intelligent Technology. Integrated Partnership. - CTA Fleet
          </p>
        </div>
      </div>

      {/* Stats Bar - Compact and Professional */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <StatCard
          label="Total Records"
          value={complianceStats.total}
          icon={<FileText className="h-5 w-5 text-primary" />}
          trend="neutral"
        />
        <StatCard
          label="Passed"
          value={complianceStats.passed}
          icon={<CheckCircle className="h-5 w-5 text-[hsl(var(--chart-2))]" />}
          trend="up"
        />
        <StatCard
          label="Failed"
          value={complianceStats.failed}
          icon={<XCircle className="h-5 w-5 text-rose-400" />}
          trend="down"
        />
        <StatCard
          label="Warnings"
          value={complianceStats.warnings}
          icon={<AlertTriangle className="h-5 w-5 text-[hsl(var(--chart-3))]" />}
          trend="neutral"
        />
        <StatCard
          label="Expired"
          value={complianceStats.expired}
          icon={<Calendar className="h-5 w-5 text-rose-400" />}
          trend="down"
        />
        <StatCard
          label="Critical Issues"
          value={complianceStats.critical}
          icon={<AlertOctagon className="h-5 w-5 text-rose-400" />}
          trend="down"
        />
        <StatCard
          label="Pass Rate"
          value={`${complianceStats.passRate}%`}
          icon={<BadgeCheck className="h-5 w-5 text-[hsl(var(--chart-2))]" />}
          trend="up"
        />
      </div>

      {/* Main Data Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Compliance Records</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {selectedRecords.length > 0 && `${selectedRecords.length} selected • `}
              All records visible • Professional table layout
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-[#111111] border-white/[0.04] text-white hover:bg-primary/10"
              onClick={() => exportToCSV(complianceRecords.map(r => ({
                recordType: r.recordType,
                vehicle: r.vehicle,
                driver: r.driver,
                date: r.date,
                status: r.status,
                category: r.category,
                severity: r.severity || '-',
                dueDate: r.dueDate || '-',
                notes: r.notes || '-',
              })), 'compliance-records')}
            >
              Export Records
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              New Record
            </Button>
          </div>
        </div>

        {(!fleetData.isLoading && complianceRecords.length === 0) ? (
          <div className="rounded-lg border border-white/[0.04] bg-[#111111] p-6 text-sm text-white/40">
            No compliance records found. Populate inspections/incidents for this tenant to display results.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={complianceRecords}
            searchPlaceholder="Search records by type, vehicle, driver, category..."
            onRowSelect={setSelectedRecords}
            enableRowSelection={true}
            enableSearch={true}
            enablePagination={true}
            defaultPageSize={25}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-white/40 pt-6 border-t border-white/[0.04]">
        CTA Compliance Management • CTA Fleet Platform • DOT & FMCSA compliant • Professional data tables
      </div>
    </div>
    </ErrorBoundary>
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
    <div className="bg-[#111111] border border-white/[0.04] rounded-lg p-3 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">
          {label}
        </div>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-xl font-bold text-white">{value}</div>
        {trend !== 'neutral' && (
          <div className={cn(
            'flex items-center text-xs mb-1',
            trend === 'up' ? 'text-[hsl(var(--chart-2))]' : 'text-rose-400'
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
