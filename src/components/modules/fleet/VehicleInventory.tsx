/**
 * VehicleInventory Component - TABLE-FIRST DESIGN
 *
 * Professional vehicle inventory tracking with table-first navigation.
 * Transformed to Fleet Design System specifications.
 *
 * Features:
 * - Table-first navigation with expandable rows
 * - Professional typography and glassmorphic design
 * - Summary statistics panels with gradients
 * - StatusChip semantic indicators
 * - Inline drilldown without modals
 * - Real-time metrics and analytics
 *
 * @security Admin/Manager only - enforced via usePermissions
 */

import {
  MagnifyingGlass,
  Package,
  TrendUp,
  Warning,
  ArrowsClockwise,
  Plus,
  Wrench,
  CalendarBlank,
  CurrencyDollar,
  X
} from "@phosphor-icons/react"
import React, { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"

import { usePermissions } from "@/hooks/usePermissions"
import { useVehicleInventory } from "@/hooks/useVehicleInventory"
import { Part } from "@/lib/types"
import logger from '@/utils/logger';

interface VehicleInventoryProps {
  vehicleId: string
  vehicleNumber: string
  vehicleMake?: string
  vehicleModel?: string
}

// StatusChip Component - Inline implementation
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

export function VehicleInventory({
  vehicleId,
  vehicleNumber,
  vehicleMake = "",
  vehicleModel = ""
}: VehicleInventoryProps) {
  const { hasAnyRole, isLoading: permissionsLoading } = usePermissions()
  const {
    assignedParts,
    usageHistory,
    compatibleParts,
    maintenanceHistory,
    isLoading,
    assignPart,
    removePart,
    recordUsage,
    refetch
  } = useVehicleInventory(vehicleId)

  const canManage = hasAnyRole("Admin", "FleetManager", "MaintenanceManager")

  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState<'assigned'|'compatible'|'usage'|'maintenance'>('assigned')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isAssignPanelOpen, setIsAssignPanelOpen] = useState(false)
  const [isUsagePanelOpen, setIsUsagePanelOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [usageData, setUsageData] = useState({
    quantity: 0,
    workOrderId: "",
    notes: ""
  })

  // Filtered parts
  const filteredAssignedParts = useMemo(() => {
    if (!searchTerm) return assignedParts || []
    const search = searchTerm.toLowerCase()
    return (assignedParts || []).filter(part =>
      part.partNumber.toLowerCase().includes(search) ||
      part.name.toLowerCase().includes(search) ||
      part.manufacturer.toLowerCase().includes(search)
    )
  }, [assignedParts, searchTerm])

  const filteredCompatibleParts = useMemo(() => {
    if (!searchTerm) return compatibleParts || []
    const search = searchTerm.toLowerCase()
    return (compatibleParts || []).filter(part =>
      part.partNumber.toLowerCase().includes(search) ||
      part.name.toLowerCase().includes(search) ||
      part.manufacturer.toLowerCase().includes(search)
    )
  }, [compatibleParts, searchTerm])

  // Metrics
  const metrics = useMemo(() => {
    const parts = assignedParts || []
    const history = usageHistory || []
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentUsage = history.filter(
      h => new Date(h.date) >= last30Days
    )

    return {
      totalPartsAssigned: parts.length,
      totalValue: parts.reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0),
      lowStockParts: parts.filter(p => p.quantityOnHand <= p.reorderPoint).length,
      partsUsedLast30Days: recentUsage.reduce((sum, h) => sum + Math.abs(h.quantity), 0),
      costLast30Days: recentUsage.reduce((sum, h) => sum + (h.cost || 0), 0),
      maintenanceEvents: (maintenanceHistory || []).length
    }
  }, [assignedParts, usageHistory, maintenanceHistory])

  // Handlers
  const toggleRowExpand = (partId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId)
    } else {
      newExpanded.add(partId)
    }
    setExpandedRows(newExpanded)
  }

  const handleAssignPart = useCallback(async (part: Part) => {
    try {
      await assignPart(part.id)
      toast.success(`${part.name} assigned to vehicle`)
      setIsAssignPanelOpen(false)
    } catch (error) {
      toast.error("Failed to assign part")
      logger.error("Failed to assign part", error as Error)
    }
  }, [assignPart])

  const handleRemovePart = useCallback(async (partId: string) => {
    if (!confirm("Remove this part from the vehicle?")) return

    try {
      await removePart(partId)
      toast.success("Part removed from vehicle")
    } catch (error) {
      toast.error("Failed to remove part")
      logger.error("Failed to remove part", error as Error)
    }
  }, [removePart])

  const handleRecordUsage = useCallback(async () => {
    if (!selectedPart || !usageData.quantity) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      await recordUsage({
        partId: selectedPart.id,
        partNumber: selectedPart.partNumber,
        type: "usage",
        quantity: -Math.abs(usageData.quantity),
        workOrderId: usageData.workOrderId,
        notes: usageData.notes,
        date: new Date().toISOString(),
        performedBy: "Current User",
        cost: selectedPart.unitCost * usageData.quantity
      })

      toast.success("Usage recorded")
      setIsUsagePanelOpen(false)
      setUsageData({ quantity: 0, workOrderId: "", notes: "" })
      setSelectedPart(null)
    } catch (error) {
      toast.error("Failed to record usage")
      logger.error("Failed to record usage", error as Error)
    }
  }, [selectedPart, usageData, recordUsage])

  const getStockStatus = useCallback((part: Part): 'good'|'warn'|'bad' => {
    if (part.quantityOnHand === 0) return 'bad'
    if (part.quantityOnHand <= part.reorderPoint) return 'warn'
    return 'good'
  }, [])

  const getStockLevel = useCallback((part: Part) => {
    return Math.min((part.quantityOnHand / part.maxStockLevel) * 100, 100)
  }, [])

  if (permissionsLoading) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:400}}>
        <ArrowsClockwise style={{width:32, height:32, animation:'spin 1s linear infinite', color:'var(--muted, #94a3b8)'}} />
      </div>
    )
  }

  if (!canManage) {
    return (
      <div style={{
        padding:24, borderRadius:16,
        border:'1px solid rgba(255,255,255,0.08)',
        background:'rgba(255,255,255,0.03)'
      }}>
        <h3 style={{fontSize:20, fontWeight:700, color:'var(--text, #f1f5f9)', marginBottom:8}}>Access Denied</h3>
        <p style={{fontSize:14, color:'var(--muted, #94a3b8)'}}>
          You do not have permission to view vehicle inventory
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding:24 }} role="main" aria-label="Vehicle Inventory">
      {/* Professional Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text, #f1f5f9)',
          marginBottom: 8
        }}>Vehicle Inventory - {vehicleNumber}</h2>
        <p style={{
          fontSize: 14,
          color: 'var(--muted, #94a3b8)'
        }}>{vehicleMake} {vehicleModel} - Professional parts and supplies tracking</p>
      </div>

      {/* Summary Stats - 6 panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Assigned Parts */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Assigned Parts</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{metrics.totalPartsAssigned}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#60a5fa', marginTop:8 }}>
            <Package style={{width:14, height:14}} />
            Active
          </div>
        </div>

        {/* Parts Value */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Parts Value</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>${(metrics.totalValue/1000).toFixed(1)}k</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#10b981', marginTop:8 }}>
            <CurrencyDollar style={{width:14, height:14}} />
            Total
          </div>
        </div>

        {/* Low Stock */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(255,255,255,0.03))'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Low Stock</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{metrics.lowStockParts}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#f59e0b', marginTop:8 }}>
            <Warning style={{width:14, height:14}} />
            Need attention
          </div>
        </div>

        {/* Parts Used (30d) */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Parts Used (30d)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{metrics.partsUsedLast30Days}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted, #94a3b8)', marginTop:8 }}>
            <TrendUp style={{width:14, height:14}} />
            Units
          </div>
        </div>

        {/* Cost (30d) */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Cost (30d)</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>${(metrics.costLast30Days/1000).toFixed(1)}k</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted, #94a3b8)', marginTop:8 }}>
            <CurrencyDollar style={{width:14, height:14}} />
            Parts cost
          </div>
        </div>

        {/* Maintenance */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Maintenance</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{metrics.maintenanceEvents}</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted, #94a3b8)', marginTop:8 }}>
            <Wrench style={{width:14, height:14}} />
            Events
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{
        display:'flex', gap:8, marginBottom:24,
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        paddingBottom:2
      }}>
        {(['assigned','compatible','usage','maintenance'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              padding:'10px 18px', fontSize:14, fontWeight:600,
              color: activeView === view ? 'var(--text, #f1f5f9)' : 'var(--muted, #94a3b8)',
              background: activeView === view ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: 'none', borderRadius:'12px 12px 0 0',
              borderBottom: activeView === view ? '2px solid #60a5fa' : '2px solid transparent',
              cursor:'pointer', textTransform:'capitalize'
            }}
          >
            {view === 'assigned' ? 'Assigned Parts' : view === 'compatible' ? 'Compatible Parts' : view === 'usage' ? 'Usage History' : 'Maintenance'}
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div style={{display:'flex', gap:16, marginBottom:24}}>
        <div style={{position:'relative', flex:1}}>
          <MagnifyingGlass style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'var(--muted, #94a3b8)'}} />
          <input
            placeholder={`Search ${activeView} parts...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width:'100%', padding:'12px 12px 12px 40px', fontSize:14,
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:12, color:'var(--text, #f1f5f9)'
            }}
          />
        </div>
        {activeView === 'assigned' && (
          <button
            onClick={() => setIsAssignPanelOpen(true)}
            style={{
              padding:'12px 20px', fontSize:14, fontWeight:600,
              background:'linear-gradient(135deg, #60a5fa, #3b82f6)',
              border:'none', borderRadius:12, color:'#fff', cursor:'pointer',
              display:'flex', alignItems:'center', gap:8
            }}
          >
            <Plus style={{width:16, height:16}} />
            Assign Parts
          </button>
        )}
      </div>

      {/* ASSIGNED PARTS TABLE */}
      {activeView === 'assigned' && (
        <div style={{
          borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
          background:'rgba(255,255,255,0.03)', overflow:'hidden'
        }}>
          {isLoading ? (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:80}}>
              <ArrowsClockwise style={{width:32, height:32, animation:'spin 1s linear infinite', color:'var(--muted, #94a3b8)'}} />
            </div>
          ) : (
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.02)'}}>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em', width:40}}></th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Part Number</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Name</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Category</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Stock Level</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Quantity</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Unit Cost</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignedParts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{padding:60, textAlign:'center', color:'var(--muted, #94a3b8)', fontSize:14}}>
                      No parts assigned to this vehicle.
                    </td>
                  </tr>
                ) : (
                  filteredAssignedParts.map(part => {
                    const isExpanded = expandedRows.has(part.id)
                    const stockStatus = getStockStatus(part)
                    const stockLevel = getStockLevel(part)

                    return (
                      <React.Fragment key={part.id}>
                        <tr
                          onClick={() => toggleRowExpand(part.id)}
                          style={{
                            cursor:'pointer',
                            borderBottom:'1px solid rgba(255,255,255,0.06)',
                            transition:'background 0.15s'
                          }}
                        >
                          <td style={{padding:16}}>
                            <div style={{
                              width:6, height:6, borderRadius:'50%',
                              background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'
                            }} />
                          </td>
                          <td style={{padding:16, fontFamily:'monospace', fontSize:13, color:'var(--text, #f1f5f9)'}}>
                            {part.partNumber}
                          </td>
                          <td style={{padding:16}}>
                            <div style={{fontWeight:600, fontSize:14, color:'var(--text, #f1f5f9)', marginBottom:2}}>
                              {part.name}
                            </div>
                            <div style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>
                              {part.manufacturer}
                            </div>
                          </td>
                          <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)', textTransform:'capitalize'}}>
                            {part.category}
                          </td>
                          <td style={{padding:16}}>
                            <div style={{width:100}}>
                              <div style={{
                                height:6, borderRadius:999, background:'rgba(255,255,255,0.1)',
                                overflow:'hidden', marginBottom:4
                              }}>
                                <div style={{
                                  width:`${stockLevel}%`, height:'100%',
                                  background: stockStatus === 'good' ? '#10b981' : stockStatus === 'warn' ? '#f59e0b' : '#ef4444'
                                }} />
                              </div>
                              <div style={{fontSize:11, color:'var(--muted, #94a3b8)'}}>
                                {part.quantityOnHand} / {part.maxStockLevel}
                              </div>
                            </div>
                          </td>
                          <td style={{padding:16, fontSize:16, fontWeight:700, color:'var(--text, #f1f5f9)'}}>
                            {part.quantityOnHand}
                          </td>
                          <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                            ${part.unitCost.toFixed(2)}
                          </td>
                          <td style={{padding:16}}>
                            <StatusChip
                              status={stockStatus}
                              label={stockStatus === 'good' ? 'In Stock' : stockStatus === 'warn' ? 'Low Stock' : 'Out of Stock'}
                            />
                          </td>
                          <td style={{padding:16}}>
                            <div style={{display:'flex', gap:8}}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPart(part)
                                  setIsUsagePanelOpen(true)
                                }}
                                style={{
                                  padding:'8px 12px', fontSize:12, fontWeight:600,
                                  background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.3)',
                                  borderRadius:10, color:'#60a5fa', cursor:'pointer',
                                  display:'flex', alignItems:'center', gap:6
                                }}
                              >
                                <Wrench style={{width:14, height:14}} />
                                Use
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemovePart(part.id)
                                }}
                                style={{
                                  padding:'8px 12px', fontSize:12, fontWeight:600,
                                  background:'transparent', border:'1px solid rgba(255,255,255,0.08)',
                                  borderRadius:10, color:'var(--muted, #94a3b8)', cursor:'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row Panel */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} style={{padding:0, borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                              <div style={{
                                padding:20, background:'rgba(0,0,0,0.18)',
                                display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16
                              }}>
                                {/* Part Details */}
                                <div style={{
                                  padding:16, borderRadius:14,
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  background:'rgba(255,255,255,0.03)'
                                }}>
                                  <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Part Details</div>
                                  <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                    <div>
                                      <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:2}}>Manufacturer</div>
                                      <div style={{fontSize:14, color:'var(--text, #f1f5f9)', fontWeight:600}}>{part.manufacturer}</div>
                                    </div>
                                    <div>
                                      <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:2}}>Category</div>
                                      <div style={{fontSize:14, color:'var(--text, #f1f5f9)', fontWeight:600, textTransform:'capitalize'}}>{part.category}</div>
                                    </div>
                                    <div>
                                      <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:2}}>Reorder Point</div>
                                      <div style={{fontSize:14, color:'var(--text, #f1f5f9)', fontWeight:600}}>{part.reorderPoint} units</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Stock Information */}
                                <div style={{
                                  padding:16, borderRadius:14,
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  background:'rgba(255,255,255,0.03)'
                                }}>
                                  <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Stock Information</div>
                                  <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                    <div>
                                      <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:2}}>On Hand</div>
                                      <div style={{fontSize:20, color:'var(--text, #f1f5f9)', fontWeight:700}}>{part.quantityOnHand} units</div>
                                    </div>
                                    <div>
                                      <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:2}}>Max Stock</div>
                                      <div style={{fontSize:14, color:'var(--text, #f1f5f9)', fontWeight:600}}>{part.maxStockLevel} units</div>
                                    </div>
                                    <div>
                                      <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:2}}>Total Value</div>
                                      <div style={{fontSize:14, color:'#10b981', fontWeight:700}}>${(part.quantityOnHand * part.unitCost).toFixed(2)}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div style={{
                                  padding:16, borderRadius:14,
                                  border:'1px solid rgba(255,255,255,0.08)',
                                  background:'rgba(255,255,255,0.03)'
                                }}>
                                  <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Quick Actions</div>
                                  <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                    <button
                                      onClick={() => {
                                        setSelectedPart(part)
                                        setIsUsagePanelOpen(true)
                                      }}
                                      style={{
                                        padding:'12px 16px', fontSize:14, fontWeight:600,
                                        background:'linear-gradient(135deg, #60a5fa, #3b82f6)',
                                        border:'none', borderRadius:10, color:'#fff', cursor:'pointer',
                                        display:'flex', alignItems:'center', gap:8
                                      }}
                                    >
                                      <Wrench style={{width:16, height:16}} />
                                      Record Usage
                                    </button>
                                    <button
                                      onClick={() => handleRemovePart(part.id)}
                                      style={{
                                        padding:'12px 16px', fontSize:14, fontWeight:600,
                                        background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)',
                                        borderRadius:10, color:'#ef4444', cursor:'pointer'
                                      }}
                                    >
                                      Remove from Vehicle
                                    </button>
                                    <div style={{fontSize:12, color:'var(--muted, #94a3b8)', marginTop:8}}>
                                      Click to expand/collapse row details
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* COMPATIBLE PARTS TABLE */}
      {activeView === 'compatible' && (
        <div style={{
          borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
          background:'rgba(255,255,255,0.03)', overflow:'hidden'
        }}>
          <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr style={{background:'rgba(255,255,255,0.02)'}}>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Part Number</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Name</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Category</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Available</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Unit Cost</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompatibleParts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{padding:60, textAlign:'center', color:'var(--muted, #94a3b8)', fontSize:14}}>
                    No compatible parts found.
                  </td>
                </tr>
              ) : (
                filteredCompatibleParts.map(part => {
                  const stockStatus = getStockStatus(part)
                  return (
                    <tr key={part.id} style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      <td style={{padding:16, fontFamily:'monospace', fontSize:13, color:'var(--text, #f1f5f9)'}}>{part.partNumber}</td>
                      <td style={{padding:16}}>
                        <div style={{fontWeight:600, fontSize:14, color:'var(--text, #f1f5f9)', marginBottom:2}}>{part.name}</div>
                        <div style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>{part.manufacturer}</div>
                      </td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)', textTransform:'capitalize'}}>{part.category}</td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>{part.quantityOnHand} units</td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>${part.unitCost.toFixed(2)}</td>
                      <td style={{padding:16}}>
                        <StatusChip
                          status={stockStatus}
                          label={stockStatus === 'good' ? 'In Stock' : stockStatus === 'warn' ? 'Low Stock' : 'Out of Stock'}
                        />
                      </td>
                      <td style={{padding:16}}>
                        <button
                          onClick={() => handleAssignPart(part)}
                          disabled={part.quantityOnHand === 0}
                          style={{
                            padding:'8px 14px', fontSize:12, fontWeight:600,
                            background: part.quantityOnHand === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(96,165,250,0.15)',
                            border: part.quantityOnHand === 0 ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(96,165,250,0.3)',
                            borderRadius:10,
                            color: part.quantityOnHand === 0 ? 'var(--muted, #94a3b8)' : '#60a5fa',
                            cursor: part.quantityOnHand === 0 ? 'not-allowed' : 'pointer',
                            display:'flex', alignItems:'center', gap:6
                          }}
                        >
                          <Plus style={{width:14, height:14}} />
                          Assign
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* USAGE HISTORY TABLE */}
      {activeView === 'usage' && (
        <div style={{
          borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
          background:'rgba(255,255,255,0.03)', overflow:'hidden'
        }}>
          <div style={{padding:20, borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 style={{fontSize:18, fontWeight:700, color:'var(--text, #f1f5f9)', marginBottom:4}}>Usage History</h3>
            <p style={{fontSize:13, color:'var(--muted, #94a3b8)'}}>Parts usage and consumption records</p>
          </div>
          <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr style={{background:'rgba(255,255,255,0.02)'}}>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Date</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Part</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Quantity</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Work Order</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Cost</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(usageHistory || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{padding:60, textAlign:'center', color:'var(--muted, #94a3b8)', fontSize:14}}>
                    No usage history available.
                  </td>
                </tr>
              ) : (
                (usageHistory || []).map(record => (
                  <tr key={record.id} style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <td style={{padding:16}}>
                      <div style={{display:'flex', alignItems:'center', gap:8, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                        <CalendarBlank style={{width:16, height:16, color:'var(--muted, #94a3b8)'}} />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{padding:16, fontFamily:'monospace', fontSize:13, color:'var(--text, #f1f5f9)', fontWeight:600}}>
                      {record.partNumber}
                    </td>
                    <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>{Math.abs(record.quantity)} units</td>
                    <td style={{padding:16, fontFamily:'monospace', fontSize:13, color:'var(--text, #f1f5f9)'}}>
                      {record.workOrderId || '-'}
                    </td>
                    <td style={{padding:16, fontSize:14, color:'#10b981', fontWeight:600}}>${(record.cost || 0).toFixed(2)}</td>
                    <td style={{padding:16, fontSize:13, color:'var(--muted, #94a3b8)'}}>
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MAINTENANCE HISTORY TABLE */}
      {activeView === 'maintenance' && (
        <div style={{
          borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
          background:'rgba(255,255,255,0.03)', overflow:'hidden'
        }}>
          <div style={{padding:20, borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 style={{fontSize:18, fontWeight:700, color:'var(--text, #f1f5f9)', marginBottom:4}}>Maintenance History</h3>
            <p style={{fontSize:13, color:'var(--muted, #94a3b8)'}}>Service events and parts replacements</p>
          </div>
          <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr style={{background:'rgba(255,255,255,0.02)'}}>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Date</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Service Type</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Priority</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Cost</th>
                <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Technician</th>
              </tr>
            </thead>
            <tbody>
              {(maintenanceHistory || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{padding:60, textAlign:'center', color:'var(--muted, #94a3b8)', fontSize:14}}>
                    No maintenance history available.
                  </td>
                </tr>
              ) : (
                (maintenanceHistory || []).map(event => (
                  <tr key={event.id} style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>
                      {new Date(event.createdDate).toLocaleDateString()}
                    </td>
                    <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)', fontWeight:600}}>{event.serviceType}</td>
                    <td style={{padding:16}}>
                      <StatusChip status="info" label={event.priority} />
                    </td>
                    <td style={{padding:16}}>
                      <StatusChip status="good" label={event.status} />
                    </td>
                    <td style={{padding:16, fontSize:14, color:'#10b981', fontWeight:600}}>${(event.cost || 0).toFixed(2)}</td>
                    <td style={{padding:16, fontSize:14, color:'var(--text, #f1f5f9)'}}>{event.assignedTo || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Parts Overlay Panel */}
      {isAssignPanelOpen && (
        <div
          onClick={() => setIsAssignPanelOpen(false)}
          style={{
            position:'fixed', top:0, left:0, right:0, bottom:0,
            background:'rgba(0,0,0,0.85)', zIndex:9999,
            display:'flex', alignItems:'center', justifyContent:'center', padding:24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'100%', maxWidth:1000, maxHeight:'90vh',
              background:'var(--bg, #0f172a)', borderRadius:16, overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{padding:24, borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h3 style={{fontSize:20, fontWeight:700, color:'var(--text, #f1f5f9)', marginBottom:4}}>Assign Parts to Vehicle</h3>
                <p style={{fontSize:14, color:'var(--muted, #94a3b8)'}}>Select compatible parts to assign to {vehicleNumber}</p>
              </div>
              <button onClick={() => setIsAssignPanelOpen(false)} style={{padding:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'var(--text, #f1f5f9)', cursor:'pointer'}}>
                <X style={{width:20, height:20}} />
              </button>
            </div>
            <div style={{padding:24, maxHeight:'calc(90vh - 100px)', overflowY:'auto'}}>
              <div style={{position:'relative', marginBottom:20}}>
                <MagnifyingGlass style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'var(--muted, #94a3b8)'}} />
                <input
                  placeholder="Search parts..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width:'100%', padding:'12px 12px 12px 40px', fontSize:14,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:12, color:'var(--text, #f1f5f9)'
                  }}
                />
              </div>
              <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.02)'}}>
                    <th style={{padding:12, fontSize:11, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Part</th>
                    <th style={{padding:12, fontSize:11, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Category</th>
                    <th style={{padding:12, fontSize:11, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Available</th>
                    <th style={{padding:12, fontSize:11, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                    <th style={{padding:12, fontSize:11, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompatibleParts.map(part => (
                    <tr key={part.id} style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      <td style={{padding:12}}>
                        <div style={{fontWeight:600, fontSize:13, color:'var(--text, #f1f5f9)', marginBottom:2}}>{part.name}</div>
                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', fontFamily:'monospace'}}>{part.partNumber}</div>
                      </td>
                      <td style={{padding:12, fontSize:13, color:'var(--text, #f1f5f9)', textTransform:'capitalize'}}>{part.category}</td>
                      <td style={{padding:12, fontSize:13, color:'var(--text, #f1f5f9)'}}>{part.quantityOnHand} units</td>
                      <td style={{padding:12}}>
                        <StatusChip
                          status={getStockStatus(part)}
                          label={getStockStatus(part) === 'good' ? 'In Stock' : getStockStatus(part) === 'warn' ? 'Low' : 'Out'}
                        />
                      </td>
                      <td style={{padding:12}}>
                        <button
                          onClick={() => handleAssignPart(part)}
                          disabled={part.quantityOnHand === 0}
                          style={{
                            padding:'8px 14px', fontSize:12, fontWeight:600,
                            background: part.quantityOnHand === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                            border:'none', borderRadius:10,
                            color: part.quantityOnHand === 0 ? 'var(--muted, #94a3b8)' : '#fff',
                            cursor: part.quantityOnHand === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Usage Overlay Panel */}
      {selectedPart && isUsagePanelOpen && (
        <div
          onClick={() => setIsUsagePanelOpen(false)}
          style={{
            position:'fixed', top:0, left:0, right:0, bottom:0,
            background:'rgba(0,0,0,0.85)', zIndex:9999,
            display:'flex', alignItems:'center', justifyContent:'center', padding:24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:'100%', maxWidth:500,
              background:'var(--bg, #0f172a)', borderRadius:16, overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{padding:24, borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <h3 style={{fontSize:20, fontWeight:700, color:'var(--text, #f1f5f9)', marginBottom:4}}>Record Parts Usage</h3>
                <p style={{fontSize:14, color:'var(--muted, #94a3b8)'}}>Record usage of {selectedPart.name} for {vehicleNumber}</p>
              </div>
              <button onClick={() => setIsUsagePanelOpen(false)} style={{padding:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'var(--text, #f1f5f9)', cursor:'pointer'}}>
                <X style={{width:20, height:20}} />
              </button>
            </div>
            <div style={{padding:24}}>
              <div style={{marginBottom:20}}>
                <label style={{display:'block', fontSize:13, fontWeight:600, color:'var(--text, #f1f5f9)', marginBottom:8}}>Quantity Used</label>
                <input
                  type="number"
                  min="1"
                  max={selectedPart.quantityOnHand}
                  value={usageData.quantity}
                  onChange={e => setUsageData({ ...usageData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity..."
                  style={{
                    width:'100%', padding:12, fontSize:14,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:12, color:'var(--text, #f1f5f9)'
                  }}
                />
                <p style={{fontSize:12, color:'var(--muted, #94a3b8)', marginTop:6}}>
                  Available: {selectedPart.quantityOnHand} units
                </p>
              </div>

              <div style={{marginBottom:20}}>
                <label style={{display:'block', fontSize:13, fontWeight:600, color:'var(--text, #f1f5f9)', marginBottom:8}}>Work Order # (Optional)</label>
                <input
                  value={usageData.workOrderId}
                  onChange={e => setUsageData({ ...usageData, workOrderId: e.target.value })}
                  placeholder="WO-12345"
                  style={{
                    width:'100%', padding:12, fontSize:14,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:12, color:'var(--text, #f1f5f9)'
                  }}
                />
              </div>

              <div style={{marginBottom:20}}>
                <label style={{display:'block', fontSize:13, fontWeight:600, color:'var(--text, #f1f5f9)', marginBottom:8}}>Notes (Optional)</label>
                <input
                  value={usageData.notes}
                  onChange={e => setUsageData({ ...usageData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  style={{
                    width:'100%', padding:12, fontSize:14,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:12, color:'var(--text, #f1f5f9)'
                  }}
                />
              </div>

              <div style={{
                padding:16, borderRadius:12,
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
                marginBottom:20
              }}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:13, color:'var(--muted, #94a3b8)'}}>Unit Cost:</span>
                  <span style={{fontSize:14, fontWeight:600, color:'var(--text, #f1f5f9)'}}>${selectedPart.unitCost.toFixed(2)}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <span style={{fontSize:13, color:'var(--muted, #94a3b8)'}}>Quantity:</span>
                  <span style={{fontSize:14, fontWeight:600, color:'var(--text, #f1f5f9)'}}>{usageData.quantity} units</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                  <span style={{fontSize:14, fontWeight:700, color:'var(--text, #f1f5f9)'}}>Total Cost:</span>
                  <span style={{fontSize:16, fontWeight:700, color:'#10b981'}}>
                    ${(selectedPart.unitCost * usageData.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{display:'flex', gap:12}}>
                <button
                  onClick={() => setIsUsagePanelOpen(false)}
                  style={{
                    flex:1, padding:'12px 20px', fontSize:14, fontWeight:600,
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:12, color:'var(--text, #f1f5f9)', cursor:'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordUsage}
                  style={{
                    flex:1, padding:'12px 20px', fontSize:14, fontWeight:600,
                    background:'linear-gradient(135deg, #60a5fa, #3b82f6)',
                    border:'none', borderRadius:12, color:'#fff', cursor:'pointer'
                  }}
                >
                  Record Usage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
