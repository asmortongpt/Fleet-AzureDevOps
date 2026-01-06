/**
 * VehicleTable - Table-first navigation pattern for Fleet vehicles
 *
 * Implements:  Table → Expand → Nested Table → Row click → Full record view
 * Design System: Fleet Design System (asmortongpt/fleet)
 * Pattern: Professional data tables with inline drilldown
 */

import React, { useState } from 'react'
import { Table } from '@/shared/design-system/components/Table'
import type { Column } from '@/shared/design-system/components/Table'
import { EntityAvatar } from '@/shared/design-system/components/EntityAvatar'
import { StatusChip } from '@/shared/design-system/components/StatusChip'
import { RowExpandPanel } from '@/shared/design-system/components/RowExpandPanel'
import type { VehicleRow, Status, RecordRow } from '@/shared/design-system/types'

interface VehicleTableProps {
  vehicles: VehicleRow[]
  onRowClick?: (vehicle: VehicleRow) => void
  onRecordOpen?: (recordId: string) => void
}

export function VehicleTable({ vehicles, onRowClick, onRecordOpen }: VehicleTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const columns: Column<VehicleRow>[] = [
    {
      key: 'avatar',
      header: '',
      width: 60,
      cellRenderer: (row) => <EntityAvatar entity={row} size={38} />
    },
    {
      key: 'displayName',
      header: 'Vehicle',
      sortable: true,
      width: 180,
      cellRenderer: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{row.displayName}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.kind}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      filterable: true,
      cellRenderer: (row) => <StatusChip status={row.status} />
    },
    {
      key: 'odometer',
      header: 'Odometer',
      sortable: true,
      width: 120,
      cellRenderer: (row) => (
        <span style={{ color: 'var(--text)' }}>{row.odometer.toLocaleString()} mi</span>
      )
    },
    {
      key: 'fuelPct',
      header: 'Fuel',
      sortable: true,
      width: 100,
      cellRenderer: (row) => {
        const color = row.fuelPct > 50 ? 'var(--good)' : row.fuelPct > 25 ? 'var(--warn)' : 'var(--bad)'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 60,
                height: 6,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${row.fuelPct}%`,
                  height: '100%',
                  background: color,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <span style={{ fontSize: 12, color }}>{row.fuelPct}%</span>
          </div>
        )
      }
    },
    {
      key: 'healthScore',
      header: 'Health',
      sortable: true,
      width: 100,
      cellRenderer: (row) => {
        const status: Status = row.healthScore >= 85 ? 'good' : row.healthScore >= 60 ? 'warn' : 'bad'
        return <StatusChip status={status} label={`${row.healthScore}/100`} />
      }
    },
    {
      key: 'alerts',
      header: 'Alerts',
      sortable: true,
      width: 80,
      cellRenderer: (row) => {
        if (row.alerts === 0) {
          return <span style={{ color: 'var(--muted)' }}>—</span>
        }
        const status: Status = row.alerts > 5 ? 'bad' : row.alerts > 2 ? 'warn' : 'info'
        return <StatusChip status={status} label={String(row.alerts)} />
      }
    },
    {
      key: 'updatedAgo',
      header: 'Last Update',
      width: 120,
      cellRenderer: (row) => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.updatedAgo}</span>
    }
  ]

  const renderExpandedContent = (row: VehicleRow) => {
    // Mock anomaly data - in production this would come from telemetry
    const anomalies: { status: Status; label: string }[] = [
      { status: 'good', label: 'Engine Temp Normal' },
      { status: row.fuelPct < 25 ? 'warn' : 'good', label: `Fuel ${row.fuelPct}%` },
      { status: row.healthScore < 60 ? 'bad' : 'good', label: `Health ${row.healthScore}/100` },
      { status: 'info', label: `${row.odometer.toLocaleString()} mi` }
    ]

    // Mock recent records - in production this would query actual maintenance/telemetry records
    const recentRecords: Pick<RecordRow, 'id' | 'summary' | 'timestamp' | 'severity'>[] = [
      {
        id: `${row.id}-rec-1`,
        summary: 'Routine inspection completed',
        timestamp: '2h ago',
        severity: 'good'
      },
      {
        id: `${row.id}-rec-2`,
        summary: row.fuelPct < 25 ? 'Low fuel warning' : 'Fuel level normal',
        timestamp: '4h ago',
        severity: row.fuelPct < 25 ? 'warn' : 'info'
      },
      {
        id: `${row.id}-rec-3`,
        summary: 'GPS location updated',
        timestamp: row.updatedAgo,
        severity: 'info'
      }
    ]

    return <RowExpandPanel anomalies={anomalies} records={recentRecords} onOpenRecord={onRecordOpen} />
  }

  return (
    <Table
      columns={columns}
      data={vehicles}
      onRowClick={(row) => {
        toggleRowExpansion(row.id)
        onRowClick?.(row)
      }}
      expandedRows={expandedRows}
      renderExpandedContent={renderExpandedContent}
      pagination={{
        pageSize: 20,
        showPageSizeOptions: true
      }}
      searchable
      searchPlaceholder="Search vehicles..."
    />
  )
}
