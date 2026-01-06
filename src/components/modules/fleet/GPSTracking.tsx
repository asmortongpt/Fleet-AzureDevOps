import React, { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { MapPin, Circle, CheckCircle, Warning, Info, Eye } from "@phosphor-icons/react"
import { UniversalMap } from "@/components/UniversalMap"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vehicle, GISFacility } from "@/lib/types"
import { useInspect } from "@/services/inspect/InspectContext"
import logger from '@/utils/logger'

/**
 * Props for the GPSTracking component
 */
interface GPSTrackingProps {
  /** Array of vehicles to display on the map and in the list */
  vehicles: Vehicle[]
  /** Array of facilities to potentially display (currently not shown) */
  facilities: GISFacility[]
  /** Optional callback when a vehicle is selected */
  onVehicleSelect?: (vehicleId: string) => void
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Optional error message to display */
  error?: string | null
}

/**
 * Vehicle status for filtering
 */
type VehicleStatus = Vehicle["status"] | "all"

/**
 * StatusChip Component - Fleet Design System
 */
const StatusChip: React.FC<{status: 'good'|'warn'|'bad'|'info'; label?: string}> = ({status, label}) => {
  const colorMap = {
    good: '#10b981',
    warn: '#f59e0b',
    bad: '#ef4444',
    info: '#60a5fa'
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'6px 10px', borderRadius:999,
      border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)',
      color: colorMap[status], fontSize:12
    }}>
      ● {label ?? status.toUpperCase()}
    </span>
  )
}

/**
 * GPSTracking Component - Professional Table-First Navigation
 *
 * Upgraded to Fleet Design System specifications:
 * - Table-first navigation for vehicle fleet
 * - Expandable rows for location drilldown
 * - Summary stat panels
 * - Professional typography and spacing
 * - Status-based semantic indicators
 * - Integrated map view with modal overlay option
 */
export function GPSTracking({
  vehicles = [],
  facilities = [],
  onVehicleSelect,
  isLoading = false,
  error = null
}: GPSTrackingProps) {
  // Inspect drawer for detailed entity views
  const { openInspect } = useInspect()

  // State management
  const [statusFilter, setStatusFilter] = useState<VehicleStatus>("all")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showMapModal, setShowMapModal] = useState(false)
  const [focusedVehicle, setFocusedVehicle] = useState<Vehicle | null>(null)

  // Refs for cleanup and performance
  const mountedRef = useRef(true)
  const previousVehiclesRef = useRef<Vehicle[]>([])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  /**
   * Track vehicle changes for debugging and analytics
   */
  useEffect(() => {
    if (vehicles.length !== previousVehiclesRef.current.length) {
      logger.debug(`[GPSTracking] Vehicle count changed: ${previousVehiclesRef.current.length} -> ${vehicles.length}`)
      previousVehiclesRef.current = vehicles
    }
  }, [vehicles])

  /**
   * Toggle row expansion
   */
  const toggleRowExpand = useCallback((vehicleId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(vehicleId)) {
        next.delete(vehicleId)
      } else {
        next.add(vehicleId)
      }
      return next
    })
  }, [])

  /**
   * Filtered vehicles based on status filter
   */
  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) {
      logger.error('[GPSTracking] vehicles prop is not an array:', vehicles)
      return []
    }

    if (statusFilter === "all") {
      return vehicles
    }

    return vehicles.filter(v => {
      if (!v || typeof v !== 'object') {
        logger.warn('[GPSTracking] Invalid vehicle object:', v)
        return false
      }
      return v.status === statusFilter
    })
  }, [vehicles, statusFilter])

  /**
   * Calculate status metrics
   */
  const statusMetrics = useMemo(() => {
    const safeVehicles = Array.isArray(vehicles) ? vehicles : []

    return {
      total: safeVehicles.length,
      active: safeVehicles.filter(v => v?.status === "active").length,
      idle: safeVehicles.filter(v => v?.status === "idle").length,
      emergency: safeVehicles.filter(v => v?.status === "emergency").length,
      charging: safeVehicles.filter(v => v?.status === "charging").length,
      service: safeVehicles.filter(v => v?.status === "service").length,
      offline: safeVehicles.filter(v => v?.status === "offline").length,
      withLocation: safeVehicles.filter(v => v?.location?.lat && v?.location?.lng).length
    }
  }, [vehicles])

  /**
   * Get status semantic indicator
   */
  const getStatusSemantic = useCallback((status: Vehicle["status"]): 'good'|'warn'|'bad'|'info' => {
    switch (status) {
      case "active":
        return 'good'
      case "emergency":
        return 'bad'
      case "service":
        return 'warn'
      case "charging":
        return 'info'
      case "idle":
        return 'info'
      case "offline":
        return 'bad'
      default:
        return 'info'
    }
  }, [])

  /**
   * Handle vehicle selection
   */
  const handleVehicleClick = useCallback((vehicleId: string) => {
    openInspect({ type: 'vehicle', id: vehicleId })
    setSelectedVehicleId(vehicleId)
    onVehicleSelect?.(vehicleId)
  }, [onVehicleSelect, openInspect])

  /**
   * Handle map view for specific vehicle
   */
  const handleViewOnMap = useCallback((vehicle: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation()
    setFocusedVehicle(vehicle)
    setShowMapModal(true)
  }, [])

  /**
   * Validate vehicle data for map
   */
  const validVehiclesForMap = useMemo(() => {
    return filteredVehicles.filter(v => {
      if (!v?.location) return false
      const { lat, lng } = v.location
      if (typeof lat !== 'number' || typeof lng !== 'number') return false
      if (isNaN(lat) || isNaN(lng)) return false
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false
      return true
    })
  }, [filteredVehicles])

  /**
   * Render error state
   */
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text, #f1f5f9)', marginBottom: 8 }}>
            Live GPS Tracking
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted, #94a3b8)' }}>Real-time fleet location monitoring</p>
        </div>
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text, #f1f5f9)', marginBottom: 8 }}>
            Live GPS Tracking
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted, #94a3b8)' }}>Loading vehicle locations...</p>
        </div>
        <div style={{
          padding: 48,
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.03)'
        }}>
          <Circle className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p style={{ color: 'var(--muted, #94a3b8)' }}>Loading GPS data...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: 24,
      background: 'var(--bg, #0f172a)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text, #f1f5f9)',
          marginBottom: 8
        }}>Live GPS Tracking</h2>
        <p style={{
          fontSize: 14,
          color: 'var(--muted, #94a3b8)'
        }}>Professional fleet location monitoring with table-first navigation</p>
      </div>

      {/* Summary Stats Row - 5 panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Total Vehicles</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{statusMetrics.total}</div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(16,185,129,0.25)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Active</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{statusMetrics.active}</div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(239,68,68,0.25)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Emergency</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444' }}>{statusMetrics.emergency}</div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(96,165,250,0.25)',
          background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Charging/Idle</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>{statusMetrics.charging + statusMetrics.idle}</div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(245,158,11,0.25)',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>GPS Available</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{statusMetrics.withLocation}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)'
      }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: statusFilter === 'all' ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: 'var(--text, #f1f5f9)',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          All ({statusMetrics.total})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: statusFilter === 'active' ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: 'var(--text, #f1f5f9)',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Active ({statusMetrics.active})
        </button>
        <button
          onClick={() => setStatusFilter('emergency')}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: statusFilter === 'emergency' ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: 'var(--text, #f1f5f9)',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Emergency ({statusMetrics.emergency})
        </button>
        <button
          onClick={() => setStatusFilter('service')}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: statusFilter === 'service' ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: 'var(--text, #f1f5f9)',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Service ({statusMetrics.service})
        </button>
        <button
          onClick={() => setStatusFilter('offline')}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: statusFilter === 'offline' ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: 'var(--text, #f1f5f9)',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Offline ({statusMetrics.offline})
        </button>
      </div>

      {/* Map Error Alert */}
      {mapError && (
        <Alert variant="destructive" style={{ marginBottom: 24 }}>
          <Warning className="h-4 w-4" />
          <AlertDescription>Map Error: {mapError}</AlertDescription>
        </Alert>
      )}

      {/* No Vehicles Alert */}
      {filteredVehicles.length === 0 && (
        <Alert style={{ marginBottom: 24 }}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {statusFilter === "all"
              ? "No vehicles found in your fleet."
              : `No vehicles with status "${statusFilter}" found.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Professional Table */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.03)',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0
        }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{
                padding: 16,
                fontSize: 12,
                color: 'var(--muted, #94a3b8)',
                textAlign: 'left',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                width: 40
              }}></th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Vehicle</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Status</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Location</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Coordinates</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>GPS</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle, idx) => {
              if (!vehicle) return null

              const isExpanded = expandedRows.has(vehicle.id)
              const hasLocation = vehicle.location?.lat && vehicle.location?.lng

              return (
                <React.Fragment key={vehicle.id}>
                  <tr
                    onClick={() => toggleRowExpand(vehicle.id)}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(96,165,250,0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'
                      }} />
                    </td>
                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text, #f1f5f9)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {vehicle.number || vehicle.id}
                    </td>
                    <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <StatusChip status={getStatusSemantic(vehicle.status)} label={vehicle.status} />
                    </td>
                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text, #f1f5f9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {vehicle.location?.address?.split(',')[0] || 'Unknown'}
                    </td>
                    <td style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {hasLocation ? `${vehicle.location.lat.toFixed(4)}, ${vehicle.location.lng.toFixed(4)}` : 'N/A'}
                    </td>
                    <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <StatusChip status={hasLocation ? 'good' : 'bad'} label={hasLocation ? 'Available' : 'Offline'} />
                    </td>
                    <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {hasLocation && (
                        <button
                          onClick={(e) => handleViewOnMap(vehicle, e)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 12,
                            border: '1px solid rgba(96,165,250,0.3)',
                            background: 'rgba(96,165,250,0.15)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12
                          }}
                        >
                          <MapPin className="w-4 h-4" />
                          Map
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row Panel */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{
                          padding: 16,
                          background: 'rgba(0,0,0,0.18)',
                          borderTop: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            {/* Full Address */}
                            <div style={{
                              padding: 16,
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Full Address</div>
                              <div style={{ fontSize: 14, color: 'var(--text, #f1f5f9)' }}>
                                {vehicle.location?.address || 'Address not available'}
                              </div>
                            </div>

                            {/* Precise Coordinates */}
                            <div style={{
                              padding: 16,
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Precise Coordinates</div>
                              <div style={{ fontSize: 14, color: 'var(--text, #f1f5f9)', fontFamily: 'monospace' }}>
                                {hasLocation ? `${vehicle.location.lat.toFixed(6)}, ${vehicle.location.lng.toFixed(6)}` : 'GPS unavailable'}
                              </div>
                            </div>

                            {/* Vehicle Info */}
                            <div style={{
                              padding: 16,
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Vehicle Details</div>
                              <div style={{ fontSize: 14, color: 'var(--text, #f1f5f9)' }}>
                                ID: {vehicle.id}<br />
                                Type: {vehicle.type || 'Unknown'}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVehicleClick(vehicle.id)
                              }}
                              style={{
                                padding: '10px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(96,165,250,0.3)',
                                background: 'rgba(96,165,250,0.15)',
                                color: '#60a5fa',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 600
                              }}
                            >
                              Open Detailed View
                            </button>
                            {hasLocation && (
                              <button
                                onClick={(e) => handleViewOnMap(vehicle, e)}
                                style={{
                                  padding: '10px 16px',
                                  borderRadius: 12,
                                  border: '1px solid rgba(16,185,129,0.3)',
                                  background: 'rgba(16,185,129,0.15)',
                                  color: '#10b981',
                                  cursor: 'pointer',
                                  fontSize: 14,
                                  fontWeight: 600
                                }}
                              >
                                View on Map
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Map Modal Overlay */}
      {showMapModal && (
        <div
          onClick={() => setShowMapModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1600,
              height: '90vh',
              background: 'var(--bg, #0f172a)',
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {/* Map Header */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #f1f5f9)', marginBottom: 4 }}>
                  Fleet Map View
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted, #94a3b8)' }}>
                  {focusedVehicle ? `Focused on ${focusedVehicle.number}` : `${validVehiclesForMap.length} vehicles on map`}
                </p>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text, #f1f5f9)',
                  cursor: 'pointer',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Map Container */}
            <div style={{ height: 'calc(100% - 80px)' }}>
              {validVehiclesForMap.length > 0 ? (
                <UniversalMap
                  vehicles={focusedVehicle ? [focusedVehicle] : validVehiclesForMap}
                  facilities={[]}
                  showVehicles={true}
                  showFacilities={false}
                  className="w-full h-full"
                />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <div style={{ textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No vehicles with GPS data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
