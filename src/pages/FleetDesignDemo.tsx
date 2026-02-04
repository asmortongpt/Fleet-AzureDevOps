import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { EntityAvatar } from '@/shared/design-system/EntityAvatar'
import { RowExpandPanel } from '@/shared/design-system/RowExpandPanel'
import { StatusChip } from '@/shared/design-system/StatusChip'
import type { VehicleRow } from '@/shared/design-system/types'
import { swrFetcher } from '@/lib/fetcher'

/**
 * STANDALONE FLEET DESIGN SYSTEM DEMO
 * Access directly at: http://localhost:5176/fleet-design-demo
 * No authentication required - pure design system showcase
 */
export default function FleetDesignDemo() {
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const { data: vehiclesPayload } = useSWR<any>('/api/vehicles?limit=25', swrFetcher, {
        revalidateOnFocus: false
    })

    const vehicles = useMemo<VehicleRow[]>(() => {
        const raw =
            (Array.isArray(vehiclesPayload?.data) && vehiclesPayload.data) ||
            (Array.isArray(vehiclesPayload?.data?.data) && vehiclesPayload.data.data) ||
            []

        const now = Date.now()

        return raw.map((v: any) => {
            const updatedAtMs = v.updated_at ? new Date(v.updated_at).getTime() : now
            const diffMinutes = Math.max(0, Math.round((now - updatedAtMs) / 60000))
            const updatedAgo = diffMinutes < 60 ? `${diffMinutes}m ago` : `${Math.round(diffMinutes / 60)}h ago`

            const fuelPct = Math.max(0, Math.min(100, Math.round(Number(v.fuel_level || 0))))
            const alerts = Number(v.metadata?.open_alerts || v.metadata?.alerts || 0) || 0
            const status: VehicleRow['status'] =
                v.status === 'active' ? 'good' : v.status === 'maintenance' ? 'warn' : v.status === 'retired' ? 'bad' : 'info'

            // NOTE: healthScore is a derived proxy until a dedicated health-scoring model exists.
            const healthScore = Math.max(0, Math.min(100, Math.round(fuelPct)))

            return {
                entityType: 'vehicle',
                id: String(v.id),
                displayName: String(v.name || v.number || v.unit_number || v.vehicle_number || v.id),
                status,
                kind: String(v.type || 'Vehicle'),
                odometer: Number(v.odometer || 0),
                fuelPct,
                healthScore,
                alerts,
                updatedAgo
            }
        })
    }, [vehiclesPayload])

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id)
    }

    return (
        <div style={{
            padding: 24,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            minHeight: '100vh',
            color: '#e2e8f0'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: 32,
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <h1 style={{
                    fontSize: 32,
                    fontWeight: 900,
                    marginBottom: 8,
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Fleet Design System - Live Demo
                </h1>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                    Professional table-first navigation with EntityAvatar, StatusChip, and RowExpandPanel components
                </p>
            </div>

            {/* Design System Table */}
            <div style={{
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                overflow: 'hidden'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0
                }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Vehicle</th>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Type</th>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Odometer</th>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Fuel</th>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Health</th>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Alerts</th>
                            <th style={{
                                padding: 16,
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map((vehicle) => (
                            <>
                                <tr
                                    key={vehicle.id}
                                    onClick={() => toggleRow(vehicle.id)}
                                    style={{
                                        cursor: 'pointer',
                                        background: expandedRow === vehicle.id ? 'rgba(96,165,250,0.08)' : 'transparent',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (expandedRow !== vehicle.id) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (expandedRow !== vehicle.id) {
                                            e.currentTarget.style.background = 'transparent'
                                        }
                                    }}
                                >
                                    <td style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <EntityAvatar entity={vehicle} size={38} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{vehicle.displayName}</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{vehicle.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 16, fontSize: 14 }}>{vehicle.kind}</td>
                                    <td style={{ padding: 16, fontSize: 14 }}>{vehicle.odometer.toLocaleString()} mi</td>
                                    <td style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 60,
                                                height: 6,
                                                borderRadius: 999,
                                                background: 'rgba(255,255,255,0.1)',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${vehicle.fuelPct}%`,
                                                    height: '100%',
                                                    background: vehicle.fuelPct > 50 ? '#10b981' : vehicle.fuelPct > 25 ? '#f59e0b' : '#ef4444',
                                                    transition: 'width 0.3s'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{vehicle.fuelPct}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: 16 }}>
                                        <span style={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: vehicle.healthScore >= 90 ? '#10b981' : vehicle.healthScore >= 70 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            {vehicle.healthScore}
                                        </span>
                                    </td>
                                    <td style={{ padding: 16 }}>
                                        {vehicle.alerts > 0 ? (
                                            <StatusChip status={vehicle.status} label={`${vehicle.alerts} alerts`} />
                                        ) : (
                                            <StatusChip status="good" label="No alerts" />
                                        )}
                                    </td>
                                    <td style={{ padding: 16, fontSize: 12, color: '#94a3b8' }}>{vehicle.updatedAgo}</td>
                                </tr>
                                {expandedRow === vehicle.id && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 16, background: 'rgba(0,0,0,0.2)' }}>
                                            <RowExpandPanel
                                                anomalies={[
                                                    { status: vehicle.status, label: `Health: ${vehicle.healthScore}%` },
                                                    { status: vehicle.fuelPct > 50 ? 'good' : vehicle.fuelPct > 25 ? 'warn' : 'bad', label: `Fuel: ${vehicle.fuelPct}%` },
                                                    { status: vehicle.alerts === 0 ? 'good' : 'warn', label: `${vehicle.alerts} alerts` },
                                                ]}
                                                records={[
                                                    {
                                                        id: `${vehicle.id}-1`,
                                                        summary: 'Routine maintenance completed',
                                                        timestamp: '2 days ago',
                                                        severity: 'good'
                                                    },
                                                    {
                                                        id: `${vehicle.id}-2`,
                                                        summary: 'Oil change due soon',
                                                        timestamp: '1 week ago',
                                                        severity: 'warn'
                                                    },
                                                ]}
                                                onOpenRecord={(id) => alert(`Opening record: ${id}`)}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Feature Legend */}
            <div style={{
                marginTop: 32,
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Design System Components</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#60a5fa' }}>EntityAvatar</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Status-indicating conic gradient rings around entity identifiers</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#60a5fa' }}>StatusChip</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Semantic color-coded status indicators with labels</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#60a5fa' }}>RowExpandPanel</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Expandable drilldown with telemetry and nested records</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
