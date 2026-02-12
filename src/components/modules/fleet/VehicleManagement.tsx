import { Car, Plus, PencilSimple, Trash, MapPin, Engine, Speedometer, HeartHalf, Buildings, Lightning } from "@phosphor-icons/react"
import React, { useState, useMemo } from 'react'

import { useVehicles, Vehicle } from "@/hooks/useVehicles"

// StatusChip component following Fleet Design System
const StatusChip: React.FC<{status: 'active'|'inactive'|'maintenance'|'retired'; label?: string}> = ({status, label}) => {
  const colorMap = {
    active: '#10b981',
    inactive: '#94a3b8',
    maintenance: '#f59e0b',
    retired: '#ef4444'
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

export function VehicleManagement() {
  const { data, isLoading } = useVehicles()
  const vehicles = (data || []) as Vehicle[]

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalVehicles = vehicles.length
    const activeVehicles = vehicles.filter(v => v.status === 'active').length
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length
    const totalMileage = vehicles.reduce((sum, v) => sum + v.mileage, 0)
    const avgMileage = totalVehicles > 0 ? Math.round(totalMileage / totalVehicles) : 0
    const locations = new Set(vehicles.map(v => v.location)).size

    return {
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      avgMileage,
      locations
    }
  }, [vehicles])

  // Filter vehicles by search query
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles
    const query = searchQuery.toLowerCase()
    return vehicles.filter(v =>
      v.vehicleNumber.toLowerCase().includes(query) ||
      v.make.toLowerCase().includes(query) ||
      v.model.toLowerCase().includes(query) ||
      v.vin.toLowerCase().includes(query) ||
      v.licensePlate.toLowerCase().includes(query) ||
      v.location.toLowerCase().includes(query)
    )
  }, [vehicles, searchQuery])

  const toggleRowExpand = (vehicleId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
  }

  const handleDelete = (vehicle: Vehicle) => {
    // Implement delete logic
    console.log('Delete vehicle:', vehicle.id)
  }

  return (
    <div style={{ padding: 32, background: 'var(--bg, #0f172a)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text, #f1f5f9)',
          marginBottom: 8
        }}>Vehicle Management</h2>
        <p style={{
          fontSize: 14,
          color: 'var(--muted, #94a3b8)'
        }}>Comprehensive fleet vehicle tracking and management</p>
      </div>

      {/* Summary Stats - 5 panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Total Vehicles */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Total Vehicles</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{metrics.totalVehicles}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#60a5fa', marginTop:8 }}>
            <Car style={{width:14, height:14}} />
            Fleet
          </div>
        </div>

        {/* Active Vehicles */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Active</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{metrics.activeVehicles}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#10b981', marginTop:8 }}>
            <Engine style={{width:14, height:14}} />
            Operating
          </div>
        </div>

        {/* In Maintenance */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Maintenance</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{metrics.maintenanceVehicles}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#f59e0b', marginTop:8 }}>
            <Engine style={{width:14, height:14}} />
            Service
          </div>
        </div>

        {/* Average Mileage */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Avg Mileage</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{metrics.avgMileage.toLocaleString()}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted, #94a3b8)', marginTop:8 }}>
            <Speedometer style={{width:14, height:14}} />
            miles
          </div>
        </div>

        {/* Locations */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Locations</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{metrics.locations}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted, #94a3b8)', marginTop:8 }}>
            <MapPin style={{width:14, height:14}} />
            Sites
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
        padding: '12px 16px',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)'
      }}>
        <input
          type="text"
          placeholder="Search vehicles by number, make, model, VIN, license plate, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            color: 'var(--text, #f1f5f9)',
            fontSize: 14,
            outline: 'none'
          }}
        />
        <button
          onClick={() => setIsAddVehicleOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(96,165,250,0.10))',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 12,
            color: '#60a5fa',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus style={{width:16, height:16}} />
          Add Vehicle
        </button>
      </div>

      {/* Fleet Vehicles Table */}
      <div style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'var(--panel, rgba(255,255,255,0.03))',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text, #f1f5f9)'
          }}>Fleet Vehicles ({filteredVehicles.length})</h3>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
            Loading vehicles...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #94a3b8)' }}>
            {searchQuery ? 'No vehicles match your search' : 'No vehicles found'}
          </div>
        ) : (
          <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr style={{background:'rgba(255,255,255,0.02)'}}>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em', width:40}}></th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Vehicle #</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Make/Model</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>VIN</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>License Plate</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Health</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Department</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Op Status</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Engine</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Mileage</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Location</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => {
                const isExpanded = expandedRows.has(String(vehicle.id))

                return (
                  <React.Fragment key={String(vehicle.id)}>
                    <tr
                      onClick={() => toggleRowExpand(String(vehicle.id))}
                      style={{
                        cursor:'pointer',
                        borderBottom:'1px solid rgba(255,255,255,0.06)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96,165,250,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{padding:16}}>
                        <div style={{
                          width:6,
                          height:6,
                          borderRadius:'50%',
                          background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'
                        }} />
                      </td>
                      <td style={{padding:16}}>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <Car style={{width:16, height:16, color:'#60a5fa'}} />
                          <span style={{fontSize:14, fontWeight:600, color:'var(--text, #f1f5f9)'}}>{vehicle.vehicleNumber}</span>
                        </div>
                      </td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </td>
                      <td style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', fontFamily:'monospace'}}>
                        {vehicle.vin}
                      </td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                        {vehicle.licensePlate}
                      </td>
                      <td style={{padding:16}}>
                        <StatusChip status={vehicle.status as 'active'|'inactive'|'maintenance'|'retired'} />
                      </td>
                      <td style={{padding:16}}>
                        {(() => {
                          const hs = (vehicle as any).health_score ?? (vehicle as any).healthScore ?? null
                          if (hs == null) return <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>--</span>
                          const hsColor = hs >= 80 ? '#10b981' : hs >= 60 ? '#f59e0b' : '#ef4444'
                          return (
                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                              <HeartHalf style={{width:14, height:14, color:hsColor}} />
                              <div style={{width:40, height:5, borderRadius:999, background:'rgba(255,255,255,0.08)', overflow:'hidden'}}>
                                <div style={{width:`${hs}%`, height:'100%', background:hsColor, transition:'width 0.3s ease'}} />
                              </div>
                              <span style={{fontSize:12, fontWeight:600, color:hsColor}}>{hs}</span>
                            </div>
                          )
                        })()}
                      </td>
                      <td style={{padding:16, fontSize:13, color:'var(--text, #f1f5f9)'}}>
                        {(() => {
                          const dept = (vehicle as any).department ?? null
                          return dept ? (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:4,
                              padding:'4px 8px', borderRadius:6,
                              border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)',
                              fontSize:12, color:'var(--muted, #94a3b8)'
                            }}>
                              <Buildings style={{width:12, height:12}} />
                              {dept}
                            </span>
                          ) : <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>--</span>
                        })()}
                      </td>
                      <td style={{padding:16}}>
                        {(() => {
                          const opStatus = (vehicle as any).operational_status ?? (vehicle as any).operationalStatus ?? null
                          if (!opStatus) return <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>--</span>
                          const opMap: Record<string, {color:string; label:string}> = {
                            AVAILABLE: { color:'#10b981', label:'Available' },
                            IN_USE: { color:'#3b82f6', label:'In Use' },
                            MAINTENANCE: { color:'#f59e0b', label:'Maintenance' },
                            RESERVED: { color:'#fbbf24', label:'Reserved' },
                          }
                          const cfg = opMap[opStatus] || { color:'#94a3b8', label:opStatus }
                          return (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:6,
                              padding:'4px 10px', borderRadius:999,
                              border:`1px solid ${cfg.color}30`, background:`${cfg.color}15`,
                              color: cfg.color, fontSize:12, fontWeight:500
                            }}>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td style={{padding:16}}>
                        {(() => {
                          const engineType = (vehicle as any).engine_type ?? (vehicle as any).engineType ?? (vehicle as any).fuelType ?? null
                          if (!engineType) return <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>--</span>
                          const isEV = engineType.toLowerCase().includes('electric') || engineType.toLowerCase().includes('ev')
                          return (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:4,
                              fontSize:12, color: isEV ? '#3b82f6' : 'var(--text, #f1f5f9)'
                            }}>
                              {isEV ? <Lightning style={{width:12, height:12, color:'#3b82f6'}} /> : <Engine style={{width:12, height:12, color:'var(--muted, #94a3b8)'}} />}
                              {engineType}
                            </span>
                          )
                        })()}
                      </td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                        {vehicle.mileage.toLocaleString()} mi
                      </td>
                      <td style={{padding:16}}>
                        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                          <MapPin style={{width:14, height:14, color:'#60a5fa'}} />
                          {vehicle.location}
                        </div>
                      </td>
                      <td style={{padding:16}}>
                        <div style={{display:'flex', gap:8}} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(vehicle)}
                            style={{
                              padding: 8,
                              background: 'rgba(96,165,250,0.10)',
                              border: '1px solid rgba(96,165,250,0.3)',
                              borderRadius: 8,
                              color: '#60a5fa',
                              cursor: 'pointer',
                              display:'flex',
                              alignItems:'center'
                            }}
                          >
                            <PencilSimple style={{width:16, height:16}} />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle)}
                            style={{
                              padding: 8,
                              background: 'rgba(239,68,68,0.10)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 8,
                              color: '#ef4444',
                              cursor: 'pointer',
                              display:'flex',
                              alignItems:'center'
                            }}
                          >
                            <Trash style={{width:16, height:16}} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Panel */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={13} style={{padding:0}}>
                          <div style={{
                            padding:20,
                            background:'rgba(0,0,0,0.18)',
                            display:'grid',
                            gridTemplateColumns:'repeat(3, 1fr)',
                            gap:16
                          }}>
                            {/* Vehicle Details */}
                            <div style={{
                              padding:16,
                              borderRadius:16,
                              border:'1px solid rgba(255,255,255,0.08)',
                              background:'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Vehicle Details</div>
                              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Make/Model</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>{vehicle.make} {vehicle.model}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Year</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>{vehicle.year}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>VIN</span>
                                  <span style={{fontSize:10, color:'var(--text, #f1f5f9)', fontWeight:600, fontFamily:'monospace'}}>{vehicle.vin}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>License Plate</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>{vehicle.licensePlate}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Location</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>{vehicle.location}</span>
                                </div>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div style={{
                              padding:16,
                              borderRadius:16,
                              border:'1px solid rgba(255,255,255,0.08)',
                              background:'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Performance</div>
                              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Current Mileage</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>{vehicle.mileage.toLocaleString()} mi</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Status</span>
                                  <StatusChip status={vehicle.status as 'active'|'inactive'|'maintenance'|'retired'} />
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Fuel Efficiency</span>
                                  <span style={{fontSize:12, color:'#10b981', fontWeight:600}}>
                                    {(vehicle as any).avg_mpg ?? (vehicle as any).avgMpg ?? '--'} mpg
                                  </span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Health Score</span>
                                  <span style={{fontSize:12, color:
                                    ((vehicle as any).health_score ?? (vehicle as any).healthScore) >= 80 ? '#10b981' :
                                    ((vehicle as any).health_score ?? (vehicle as any).healthScore) >= 60 ? '#f59e0b' : '#ef4444',
                                    fontWeight:600
                                  }}>
                                    {(vehicle as any).health_score ?? (vehicle as any).healthScore ?? '--'}/100
                                  </span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Department</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>
                                    {(vehicle as any).department ?? '--'}
                                  </span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                  <span style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>Engine Type</span>
                                  <span style={{fontSize:12, color:'var(--text, #f1f5f9)', fontWeight:600}}>
                                    {(vehicle as any).engine_type ?? (vehicle as any).engineType ?? (vehicle as any).fuelType ?? '--'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div style={{
                              padding:16,
                              borderRadius:16,
                              border:'1px solid rgba(255,255,255,0.08)',
                              background:'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Quick Actions</div>
                              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                                <button style={{
                                  padding:'10px 14px',
                                  borderRadius:12,
                                  border:'1px solid rgba(96,165,250,0.3)',
                                  background:'rgba(96,165,250,0.10)',
                                  color:'#60a5fa',
                                  fontSize:13,
                                  fontWeight:600,
                                  cursor:'pointer',
                                  textAlign:'left'
                                }}>View Full Details</button>
                                <button style={{
                                  padding:'10px 14px',
                                  borderRadius:12,
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  background:'rgba(255,255,255,0.03)',
                                  color:'var(--text, #f1f5f9)',
                                  fontSize:13,
                                  fontWeight:600,
                                  cursor:'pointer',
                                  textAlign:'left'
                                }}>Schedule Maintenance</button>
                                <button style={{
                                  padding:'10px 14px',
                                  borderRadius:12,
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  background:'rgba(255,255,255,0.03)',
                                  color:'var(--text, #f1f5f9)',
                                  fontSize:13,
                                  fontWeight:600,
                                  cursor:'pointer',
                                  textAlign:'left'
                                }}>View Service History</button>
                                <button style={{
                                  padding:'10px 14px',
                                  borderRadius:12,
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  background:'rgba(255,255,255,0.03)',
                                  color:'var(--text, #f1f5f9)',
                                  fontSize:13,
                                  fontWeight:600,
                                  cursor:'pointer',
                                  textAlign:'left'
                                }}>Assign Driver</button>
                              </div>
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
        )}
      </div>

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div
          onClick={() => setIsAddVehicleOpen(false)}
          style={{
            position:'fixed',
            top:0,
            left:0,
            right:0,
            bottom:0,
            background:'rgba(0,0,0,0.85)',
            zIndex:9999,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'100%',
              maxWidth:700,
              maxHeight:'90vh',
              background:'var(--bg, #0f172a)',
              borderRadius:16,
              overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{
              padding:'20px 24px',
              borderBottom:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.02)'
            }}>
              <h3 style={{fontSize:18, fontWeight:600, color:'var(--text, #f1f5f9)'}}>Add New Vehicle</h3>
            </div>
            <div style={{padding:24}}>
              <div style={{color:'var(--muted, #94a3b8)', fontSize:14, textAlign:'center', padding:40}}>
                Add vehicle form will be implemented here
              </div>
            </div>
            <div style={{
              padding:'16px 24px',
              borderTop:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.02)',
              display:'flex',
              justifyContent:'flex-end',
              gap:12
            }}>
              <button
                onClick={() => setIsAddVehicleOpen(false)}
                style={{
                  padding:'10px 20px',
                  borderRadius:12,
                  border:'1px solid rgba(255,255,255,0.08)',
                  background:'rgba(255,255,255,0.03)',
                  color:'var(--text, #f1f5f9)',
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}
              >
                Cancel
              </button>
              <button style={{
                padding:'10px 20px',
                borderRadius:12,
                border:'1px solid rgba(96,165,250,0.3)',
                background:'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(96,165,250,0.10))',
                color:'#60a5fa',
                fontSize:14,
                fontWeight:600,
                cursor:'pointer'
              }}>
                Add Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div
          onClick={() => setEditingVehicle(null)}
          style={{
            position:'fixed',
            top:0,
            left:0,
            right:0,
            bottom:0,
            background:'rgba(0,0,0,0.85)',
            zIndex:9999,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            padding:24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'100%',
              maxWidth:700,
              maxHeight:'90vh',
              background:'var(--bg, #0f172a)',
              borderRadius:16,
              overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{
              padding:'20px 24px',
              borderBottom:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.02)'
            }}>
              <h3 style={{fontSize:18, fontWeight:600, color:'var(--text, #f1f5f9)'}}>
                Edit Vehicle - {editingVehicle.vehicleNumber}
              </h3>
            </div>
            <div style={{padding:24}}>
              <div style={{color:'var(--muted, #94a3b8)', fontSize:14, textAlign:'center', padding:40}}>
                Edit vehicle form will be implemented here
              </div>
            </div>
            <div style={{
              padding:'16px 24px',
              borderTop:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.02)',
              display:'flex',
              justifyContent:'flex-end',
              gap:12
            }}>
              <button
                onClick={() => setEditingVehicle(null)}
                style={{
                  padding:'10px 20px',
                  borderRadius:12,
                  border:'1px solid rgba(255,255,255,0.08)',
                  background:'rgba(255,255,255,0.03)',
                  color:'var(--text, #f1f5f9)',
                  fontSize:14,
                  fontWeight:600,
                  cursor:'pointer'
                }}
              >
                Cancel
              </button>
              <button style={{
                padding:'10px 20px',
                borderRadius:12,
                border:'1px solid rgba(96,165,250,0.3)',
                background:'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(96,165,250,0.10))',
                color:'#60a5fa',
                fontSize:14,
                fontWeight:600,
                cursor:'pointer'
              }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
