/**
 * VehicleTable - Table-first navigation pattern for Fleet vehicles
 *
 * Implements:  Table → Expand → Nested Table → Row click → Full record view
 * Design System: Fleet Design System (asmortongpt/fleet)
 * Pattern: Professional data tables with inline drilldown
 */

import React, { useState } from 'react'

import { EntityAvatar } from '@/shared/design-system/components/EntityAvatar'
import { RowExpandPanel } from '@/shared/design-system/components/RowExpandPanel'
import { StatusChip } from '@/shared/design-system/components/StatusChip'
import { Table } from '@/shared/design-system/components/Table'
import type { Column } from '@/shared/design-system/components/Table'
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
      width: '60',
      accessor: (row: VehicleRow) => <EntityAvatar entity={row} size={38} />
    },
    {
      key: 'displayName',
      header: 'Vehicle',
      sortable: true,
      width: '180',
      accessor: (row: VehicleRow) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{row.displayName}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.kind}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '120',
      filterable: true,
      accessor: (row: VehicleRow) => <StatusChip status={row.status} />
    },
    {
      key: 'odometer',
      header: 'Odometer',
      sortable: true,
      width: '120',
      accessor: (row: VehicleRow) => (
        <span style={{ color: 'var(--text)' }}>{row.odometer.toLocaleString()} mi</span>
      )
    },
    {
      key: 'fuelPct',
      header: 'Fuel',
      sortable: true,
      width: '100',
      accessor: (row: VehicleRow) => {
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
      width: '100',
      accessor: (row: VehicleRow) => {
        const status: Status = row.healthScore >= 85 ? 'good' : row.healthScore >= 60 ? 'warn' : 'bad'
        return <StatusChip status={status} label={`${row.healthScore}/100`} />
      }
    },
    {
      key: 'department',
      header: 'Dept',
      sortable: true,
      width: '120',
      filterable: true,
      accessor: (row: VehicleRow) => {
        if (!row.department) {
          return <span style={{ color: 'var(--muted)', fontSize: 12 }}>--</span>
        }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 8px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: 12, color: 'var(--muted)'
          }}>
            {row.department}
          </span>
        )
      }
    },
    {
      key: 'operationalStatus',
      header: 'Op Status',
      sortable: true,
      width: '120',
      filterable: true,
      accessor: (row: VehicleRow) => {
        if (!row.operationalStatus) {
          return <span style={{ color: 'var(--muted)', fontSize: 12 }}>--</span>
        }
        const opMap: Record<string, { color: string; label: string }> = {
          AVAILABLE: { color: '#10b981', label: 'Available' },
          IN_USE: { color: '#3b82f6', label: 'In Use' },
          MAINTENANCE: { color: '#f59e0b', label: 'Maintenance' },
          RESERVED: { color: '#fbbf24', label: 'Reserved' },
        }
        const cfg = opMap[row.operationalStatus] || { color: '#94a3b8', label: row.operationalStatus }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 8px', borderRadius: 999,
            border: `1px solid ${cfg.color}30`,
            background: `${cfg.color}15`,
            color: cfg.color, fontSize: 12, fontWeight: 500
          }}>
            {cfg.label}
          </span>
        )
      }
    },
    {
      key: 'engineType',
      header: 'Engine',
      sortable: true,
      width: '110',
      accessor: (row: VehicleRow) => {
        if (!row.engineType) {
          return <span style={{ color: 'var(--muted)', fontSize: 12 }}>--</span>
        }
        const isEV = row.engineType.toLowerCase().includes('electric') || row.engineType.toLowerCase().includes('ev')
        return (
          <span style={{
            fontSize: 12,
            color: isEV ? '#3b82f6' : 'var(--text)',
            fontWeight: isEV ? 600 : 400
          }}>
            {isEV ? '\u26A1 ' : ''}{row.engineType}
          </span>
        )
      }
    },
    {
      key: 'alerts',
      header: 'Alerts',
      sortable: true,
      width: '80',
      accessor: (row: VehicleRow) => {
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
      width: '120',
      accessor: (row: VehicleRow) => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{row.updatedAgo}</span>
    }
  ]

  const renderExpandedContent = (row: VehicleRow) => {
    const anomalies: { status: Status; label: string }[] = []

    if (typeof row.fuelPct === 'number') {
      anomalies.push({
        status: row.fuelPct < 25 ? 'warn' : 'good',
        label: `Fuel ${row.fuelPct}%`
      })
    }

    if (typeof row.healthScore === 'number') {
      anomalies.push({
        status: row.healthScore < 60 ? 'bad' : 'good',
        label: `Health ${row.healthScore}/100`
      })
    }

    if (typeof row.odometer === 'number') {
      anomalies.push({
        status: 'info',
        label: `${row.odometer.toLocaleString()} mi`
      })
    }

    const recentRecords: Pick<RecordRow, 'id' | 'summary' | 'timestamp' | 'severity'>[] =
      (row as any).recentRecords || []

    return <RowExpandPanel anomalies={anomalies} records={recentRecords} onOpenRecord={onRecordOpen} />
  }

  return (
    <div>
      <Table
        columns={columns}
        data={vehicles}
        onRowClick={(row) => {
          toggleRowExpansion(row.id)
          onRowClick?.(row)
        }}
        pagination={{
          pageSize: 20,
          showSizeOptions: true
        }}
      />
      {vehicles.filter(v => expandedRows.has(v.id)).map(row => (
        <div key={row.id}>
          {renderExpandedContent(row)}
        </div>
      ))}
    </div>
  )
}
