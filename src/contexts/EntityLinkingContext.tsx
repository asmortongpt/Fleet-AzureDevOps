/**
 * Entity Linking Context
 * Central registry for managing relationships between all fleet entities
 *
 * Provides bidirectional navigation between:
 * - Vehicles <-> Drivers <-> Trips <-> Routes
 * - Vehicles <-> Maintenance <-> Work Orders <-> Parts
 * - Vehicles <-> Fuel Transactions <-> Cost Reports
 * - Assets <-> Equipment <-> Trailers (parent-child)
 * - Vendors <-> Purchase Orders <-> Invoices <-> Parts
 * - Facilities <-> Service Bays <-> Technicians
 *
 * Created: 2025-11-23
 */

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'
import { Vehicle, Driver, WorkOrder, FuelTransaction, Part, Vendor, MaintenanceSchedule } from '@/lib/types'
import { useDrilldown } from './DrilldownContext'

// ============================================================================
// ENTITY TYPES & RELATIONSHIP DEFINITIONS
// ============================================================================

export type EntityType =
  | 'vehicle' | 'driver' | 'work-order' | 'maintenance'
  | 'fuel' | 'part' | 'vendor' | 'invoice' | 'purchase-order'
  | 'facility' | 'trip' | 'route' | 'asset' | 'equipment'
  | 'trailer' | 'alert' | 'document' | 'communication'

export interface EntityReference {
  type: EntityType
  id: string
  label: string
  data?: any
}

export interface EntityRelationship {
  source: EntityReference
  target: EntityReference
  relationshipType: 'assigned-to' | 'belongs-to' | 'contains' | 'tows' | 'serviced-by' |
                    'purchased-from' | 'invoiced-to' | 'documented-by' | 'related-to' |
                    'parent-of' | 'child-of' | 'fueled-by' | 'maintained-by'
  metadata?: Record<string, any>
}

export interface LinkedEntities {
  drivers: EntityReference[]
  vehicles: EntityReference[]
  workOrders: EntityReference[]
  maintenanceRecords: EntityReference[]
  fuelTransactions: EntityReference[]
  parts: EntityReference[]
  vendors: EntityReference[]
  invoices: EntityReference[]
  purchaseOrders: EntityReference[]
  facilities: EntityReference[]
  trips: EntityReference[]
  routes: EntityReference[]
  assets: EntityReference[]
  alerts: EntityReference[]
  documents: EntityReference[]
}

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

export interface EntityLinkingContextType {
  // Core linking functions
  getLinkedEntities: (type: EntityType, id: string) => LinkedEntities
  findRelationships: (type: EntityType, id: string) => EntityRelationship[]

  // Navigation helpers
  navigateToEntity: (ref: EntityReference) => void
  navigateToRelated: (fromType: EntityType, fromId: string, toType: EntityType) => void

  // Relationship management
  registerRelationship: (relationship: EntityRelationship) => void
  removeRelationship: (sourceType: EntityType, sourceId: string, targetType: EntityType, targetId: string) => void

  // Bulk operations
  getVehicleContext: (vehicleId: string) => VehicleContext
  getDriverContext: (driverId: string) => DriverContext
  getWorkOrderContext: (workOrderId: string) => WorkOrderContext

  // Real-time updates
  lastUpdate: Date | null
  isLoading: boolean

  // Entity counts
  entityCounts: Record<EntityType, number>
}

export interface VehicleContext {
  vehicle: EntityReference | null
  assignedDriver: EntityReference | null
  recentWorkOrders: EntityReference[]
  upcomingMaintenance: EntityReference[]
  fuelHistory: EntityReference[]
  activeTrips: EntityReference[]
  linkedAssets: EntityReference[]
  alerts: EntityReference[]
  documents: EntityReference[]
  totalCost: number
}

export interface DriverContext {
  driver: EntityReference | null
  assignedVehicle: EntityReference | null
  recentTrips: EntityReference[]
  performanceAlerts: EntityReference[]
  certifications: EntityReference[]
  communications: EntityReference[]
  safetyScore: number
}

export interface WorkOrderContext {
  workOrder: EntityReference | null
  vehicle: EntityReference | null
  assignedTechnician: EntityReference | null
  partsUsed: EntityReference[]
  relatedInvoice: EntityReference | null
  vendor: EntityReference | null
  estimatedCost: number
  actualCost: number
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const emptyLinkedEntities: LinkedEntities = {
  drivers: [],
  vehicles: [],
  workOrders: [],
  maintenanceRecords: [],
  fuelTransactions: [],
  parts: [],
  vendors: [],
  invoices: [],
  purchaseOrders: [],
  facilities: [],
  trips: [],
  routes: [],
  assets: [],
  alerts: [],
  documents: []
}

const defaultContext: EntityLinkingContextType = {
  getLinkedEntities: () => emptyLinkedEntities,
  findRelationships: () => [],
  navigateToEntity: () => {},
  navigateToRelated: () => {},
  registerRelationship: () => {},
  removeRelationship: () => {},
  getVehicleContext: () => ({
    vehicle: null,
    assignedDriver: null,
    recentWorkOrders: [],
    upcomingMaintenance: [],
    fuelHistory: [],
    activeTrips: [],
    linkedAssets: [],
    alerts: [],
    documents: [],
    totalCost: 0
  }),
  getDriverContext: () => ({
    driver: null,
    assignedVehicle: null,
    recentTrips: [],
    performanceAlerts: [],
    certifications: [],
    communications: [],
    safetyScore: 0
  }),
  getWorkOrderContext: () => ({
    workOrder: null,
    vehicle: null,
    assignedTechnician: null,
    partsUsed: [],
    relatedInvoice: null,
    vendor: null,
    estimatedCost: 0,
    actualCost: 0
  }),
  lastUpdate: null,
  isLoading: false,
  entityCounts: {} as Record<EntityType, number>
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const EntityLinkingContext = createContext<EntityLinkingContextType>(defaultContext)

export const useEntityLinking = () => {
  const context = useContext(EntityLinkingContext)
  if (!context) {
    throw new Error('useEntityLinking must be used within EntityLinkingProvider')
  }
  return context
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface EntityLinkingProviderProps {
  children: React.ReactNode
  vehicles?: Vehicle[]
  drivers?: Driver[]
  workOrders?: WorkOrder[]
  fuelTransactions?: FuelTransaction[]
  parts?: Part[]
  vendors?: Vendor[]
  maintenanceSchedules?: MaintenanceSchedule[]
}

export function EntityLinkingProvider({
  children,
  vehicles = [],
  drivers = [],
  workOrders = [],
  fuelTransactions = [],
  parts = [],
  vendors = [],
  maintenanceSchedules = []
}: EntityLinkingProviderProps) {
  const { push: drilldownPush } = useDrilldown()
  const [relationships, setRelationships] = useState<EntityRelationship[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Build relationship graph from data
  useEffect(() => {
    setIsLoading(true)
    const newRelationships: EntityRelationship[] = []

    // Vehicle <-> Driver relationships
    vehicles.forEach(vehicle => {
      if (vehicle.assignedDriver) {
        const driver = drivers.find(d => d.id === vehicle.assignedDriver || d.name === vehicle.assignedDriver)
        if (driver) {
          newRelationships.push({
            source: { type: 'vehicle', id: vehicle.id, label: `${vehicle.make} ${vehicle.model} (${vehicle.number})` },
            target: { type: 'driver', id: driver.id, label: driver.name },
            relationshipType: 'assigned-to'
          })
        }
      }

      // Vehicle <-> Parent Asset relationships
      if (vehicle.parent_asset_id) {
        const parentVehicle = vehicles.find(v => v.id === vehicle.parent_asset_id)
        if (parentVehicle) {
          newRelationships.push({
            source: { type: 'vehicle', id: parentVehicle.id, label: `${parentVehicle.make} ${parentVehicle.model}` },
            target: { type: 'vehicle', id: vehicle.id, label: `${vehicle.make} ${vehicle.model}` },
            relationshipType: 'tows'
          })
        }
      }
    })

    // Work Order <-> Vehicle relationships
    workOrders.forEach(wo => {
      const vehicle = vehicles.find(v => v.id === wo.vehicleId)
      if (vehicle) {
        newRelationships.push({
          source: { type: 'work-order', id: wo.id, label: `WO-${wo.id.slice(-6)} - ${wo.serviceType}` },
          target: { type: 'vehicle', id: vehicle.id, label: `${vehicle.make} ${vehicle.model}` },
          relationshipType: 'serviced-by'
        })
      }

      // Work Order <-> Parts
      wo.parts?.forEach(part => {
        const partRecord = parts.find(p => p.id === part.partId)
        if (partRecord) {
          newRelationships.push({
            source: { type: 'work-order', id: wo.id, label: `WO-${wo.id.slice(-6)}` },
            target: { type: 'part', id: partRecord.id, label: partRecord.name },
            relationshipType: 'contains',
            metadata: { quantity: part.quantity, cost: part.cost }
          })
        }
      })
    })

    // Fuel Transactions <-> Vehicle
    fuelTransactions.forEach(ft => {
      const vehicle = vehicles.find(v => v.id === ft.vehicleId)
      if (vehicle) {
        newRelationships.push({
          source: { type: 'fuel', id: ft.id, label: `Fuel ${ft.date} - ${ft.gallons}gal` },
          target: { type: 'vehicle', id: vehicle.id, label: `${vehicle.make} ${vehicle.model}` },
          relationshipType: 'fueled-by'
        })
      }
    })

    // Maintenance Schedules <-> Vehicle
    maintenanceSchedules.forEach(ms => {
      const vehicle = vehicles.find(v => v.id === ms.vehicleId)
      if (vehicle) {
        newRelationships.push({
          source: { type: 'maintenance', id: ms.id, label: `${ms.serviceType} - ${ms.status}` },
          target: { type: 'vehicle', id: vehicle.id, label: `${vehicle.make} ${vehicle.model}` },
          relationshipType: 'maintained-by'
        })
      }
    })

    setRelationships(newRelationships)
    setLastUpdate(new Date())
    setIsLoading(false)
  }, [vehicles, drivers, workOrders, fuelTransactions, parts, vendors, maintenanceSchedules])

  // Get all entities linked to a specific entity
  const getLinkedEntities = useCallback((type: EntityType, id: string): LinkedEntities => {
    const linked: LinkedEntities = { ...emptyLinkedEntities }

    relationships.forEach(rel => {
      const isSource = rel.source.type === type && rel.source.id === id
      const isTarget = rel.target.type === type && rel.target.id === id

      if (isSource || isTarget) {
        const otherEntity = isSource ? rel.target : rel.source

        switch (otherEntity.type) {
          case 'driver': linked.drivers.push(otherEntity); break
          case 'vehicle': linked.vehicles.push(otherEntity); break
          case 'work-order': linked.workOrders.push(otherEntity); break
          case 'maintenance': linked.maintenanceRecords.push(otherEntity); break
          case 'fuel': linked.fuelTransactions.push(otherEntity); break
          case 'part': linked.parts.push(otherEntity); break
          case 'vendor': linked.vendors.push(otherEntity); break
          case 'invoice': linked.invoices.push(otherEntity); break
          case 'purchase-order': linked.purchaseOrders.push(otherEntity); break
          case 'facility': linked.facilities.push(otherEntity); break
          case 'trip': linked.trips.push(otherEntity); break
          case 'route': linked.routes.push(otherEntity); break
          case 'asset': case 'equipment': case 'trailer': linked.assets.push(otherEntity); break
          case 'alert': linked.alerts.push(otherEntity); break
          case 'document': linked.documents.push(otherEntity); break
        }
      }
    })

    return linked
  }, [relationships])

  // Find all relationships for an entity
  const findRelationships = useCallback((type: EntityType, id: string): EntityRelationship[] => {
    return relationships.filter(rel =>
      (rel.source.type === type && rel.source.id === id) ||
      (rel.target.type === type && rel.target.id === id)
    )
  }, [relationships])

  // Navigate to entity detail
  const navigateToEntity = useCallback((ref: EntityReference) => {
    drilldownPush({
      id: `${ref.type}-${ref.id}`,
      type: ref.type,
      label: ref.label,
      data: ref.data
    })
  }, [drilldownPush])

  // Navigate to related entities
  const navigateToRelated = useCallback((fromType: EntityType, fromId: string, toType: EntityType) => {
    const linked = getLinkedEntities(fromType, fromId)
    let entities: EntityReference[] = []

    switch (toType) {
      case 'driver': entities = linked.drivers; break
      case 'vehicle': entities = linked.vehicles; break
      case 'work-order': entities = linked.workOrders; break
      case 'maintenance': entities = linked.maintenanceRecords; break
      case 'fuel': entities = linked.fuelTransactions; break
      case 'part': entities = linked.parts; break
      default: break
    }

    if (entities.length === 1) {
      navigateToEntity(entities[0])
    } else if (entities.length > 1) {
      drilldownPush({
        id: `${fromType}-${fromId}-${toType}s`,
        type: `${toType}-list`,
        label: `Related ${toType}s (${entities.length})`,
        data: { entities, fromType, fromId }
      })
    }
  }, [getLinkedEntities, navigateToEntity, drilldownPush])

  // Register new relationship
  const registerRelationship = useCallback((relationship: EntityRelationship) => {
    setRelationships(prev => [...prev, relationship])
    setLastUpdate(new Date())
  }, [])

  // Remove relationship
  const removeRelationship = useCallback((
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string
  ) => {
    setRelationships(prev => prev.filter(rel =>
      !(rel.source.type === sourceType && rel.source.id === sourceId &&
        rel.target.type === targetType && rel.target.id === targetId)
    ))
    setLastUpdate(new Date())
  }, [])

  // Get comprehensive vehicle context
  const getVehicleContext = useCallback((vehicleId: string): VehicleContext => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle) {
      return defaultContext.getVehicleContext(vehicleId)
    }

    const linked = getLinkedEntities('vehicle', vehicleId)
    const vehicleWorkOrders = workOrders.filter(wo => wo.vehicleId === vehicleId)
    const vehicleFuel = fuelTransactions.filter(ft => ft.vehicleId === vehicleId)
    const vehicleMaintenance = maintenanceSchedules.filter(ms => ms.vehicleId === vehicleId)

    // Calculate total costs
    const workOrderCosts = vehicleWorkOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0)
    const fuelCosts = vehicleFuel.reduce((sum, ft) => sum + (ft.gallons * ft.pricePerGallon), 0)

    return {
      vehicle: { type: 'vehicle', id: vehicleId, label: `${vehicle.make} ${vehicle.model}`, data: vehicle },
      assignedDriver: linked.drivers[0] || null,
      recentWorkOrders: linked.workOrders.slice(0, 5),
      upcomingMaintenance: linked.maintenanceRecords.filter(m =>
        maintenanceSchedules.find(ms => ms.id === m.id)?.status === 'scheduled'
      ),
      fuelHistory: linked.fuelTransactions.slice(0, 10),
      activeTrips: linked.trips.filter(t => t.data?.status === 'active'),
      linkedAssets: linked.assets,
      alerts: (vehicle.alerts || []).map((alert, i) => ({
        type: 'alert' as EntityType,
        id: `${vehicleId}-alert-${i}`,
        label: alert
      })),
      documents: linked.documents,
      totalCost: workOrderCosts + fuelCosts
    }
  }, [vehicles, workOrders, fuelTransactions, maintenanceSchedules, getLinkedEntities])

  // Get comprehensive driver context
  const getDriverContext = useCallback((driverId: string): DriverContext => {
    const driver = drivers.find(d => d.id === driverId)
    if (!driver) {
      return defaultContext.getDriverContext(driverId)
    }

    const linked = getLinkedEntities('driver', driverId)

    return {
      driver: { type: 'driver', id: driverId, label: driver.name, data: driver },
      assignedVehicle: linked.vehicles[0] || null,
      recentTrips: linked.trips.slice(0, 10),
      performanceAlerts: linked.alerts,
      certifications: driver.certifications.map((cert, i) => ({
        type: 'document' as EntityType,
        id: `${driverId}-cert-${i}`,
        label: cert
      })),
      communications: linked.documents.filter(d => d.type === 'communication'),
      safetyScore: driver.safetyScore
    }
  }, [drivers, getLinkedEntities])

  // Get comprehensive work order context
  const getWorkOrderContext = useCallback((workOrderId: string): WorkOrderContext => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId)
    if (!workOrder) {
      return defaultContext.getWorkOrderContext(workOrderId)
    }

    const linked = getLinkedEntities('work-order', workOrderId)
    const partsCost = workOrder.parts?.reduce((sum, p) => sum + (p.cost * p.quantity), 0) || 0

    return {
      workOrder: { type: 'work-order', id: workOrderId, label: `WO-${workOrderId.slice(-6)}`, data: workOrder },
      vehicle: linked.vehicles[0] || null,
      assignedTechnician: workOrder.assignedTo
        ? { type: 'driver', id: workOrder.assignedTo, label: workOrder.assignedTo }
        : null,
      partsUsed: linked.parts,
      relatedInvoice: linked.invoices[0] || null,
      vendor: linked.vendors[0] || null,
      estimatedCost: workOrder.cost || 0,
      actualCost: partsCost + (workOrder.laborHours || 0) * 75 // $75/hr labor rate
    }
  }, [workOrders, getLinkedEntities])

  // Calculate entity counts
  const entityCounts = useMemo(() => ({
    vehicle: vehicles.length,
    driver: drivers.length,
    'work-order': workOrders.length,
    maintenance: maintenanceSchedules.length,
    fuel: fuelTransactions.length,
    part: parts.length,
    vendor: vendors.length,
    invoice: 0, // From API
    'purchase-order': 0, // From API
    facility: 0, // From API
    trip: 0, // From API
    route: 0, // From API
    asset: vehicles.filter(v => v.asset_category).length,
    equipment: vehicles.filter(v => v.asset_category === 'HEAVY_EQUIPMENT').length,
    trailer: vehicles.filter(v => v.asset_category === 'TRAILER').length,
    alert: vehicles.reduce((sum, v) => sum + (v.alerts?.length || 0), 0),
    document: 0, // From API
    communication: 0 // From API
  }), [vehicles, drivers, workOrders, maintenanceSchedules, fuelTransactions, parts, vendors])

  const value: EntityLinkingContextType = useMemo(() => ({
    getLinkedEntities,
    findRelationships,
    navigateToEntity,
    navigateToRelated,
    registerRelationship,
    removeRelationship,
    getVehicleContext,
    getDriverContext,
    getWorkOrderContext,
    lastUpdate,
    isLoading,
    entityCounts
  }), [
    getLinkedEntities, findRelationships, navigateToEntity, navigateToRelated,
    registerRelationship, removeRelationship, getVehicleContext, getDriverContext,
    getWorkOrderContext, lastUpdate, isLoading, entityCounts
  ])

  return (
    <EntityLinkingContext.Provider value={value}>
      {children}
    </EntityLinkingContext.Provider>
  )
}

export default EntityLinkingContext
