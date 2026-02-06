/**
 * useReactiveAssetsData - Real-time assets and inventory data with React Query
 * Auto-refreshes every 10 seconds for live asset management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { secureFetch } from '@/hooks/use-api'

interface Asset {
  id: string
  name: string
  assetTag: string
  type: 'vehicle' | 'equipment' | 'tool' | 'other'
  status: 'active' | 'maintenance' | 'retired' | 'available'
  location: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  assignedTo?: string
  lastServiceDate?: string
  nextServiceDate?: string
  depreciationRate: number
  warrantyExpiry?: string
  createdAt: string
}

interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  quantity: number
  reorderPoint: number
  unitCost: number
  location: string
  supplier?: string
  lastRestocked?: string
}

export function useReactiveAssetsData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  const unwrapRows = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[]
    if (payload?.data && Array.isArray(payload.data)) return payload.data as T[]
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data as T[]
    return []
  }

  // Fetch assets
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['assets', realTimeUpdate],
    queryFn: async () => {
      const response = await secureFetch(`/api/assets`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      const payload = await response.json()
      const rows = unwrapRows<any>(payload)
      return rows.map((row: any) => ({
        id: row.id,
        name: row.asset_name || row.name,
        assetTag: row.asset_number || row.asset_tag || row.assetNumber || '',
        type: row.asset_type || row.type || 'other',
        status: row.status || 'active',
        location: row.location || row.current_location || '',
        purchaseDate: row.purchase_date || row.created_at || new Date().toISOString(),
        purchasePrice: Number(row.purchase_price || 0),
        currentValue: Number(row.current_value || 0),
        condition: row.condition || 'good',
        assignedTo: row.assigned_to_name || row.assigned_to,
        lastServiceDate: row.last_maintenance || row.last_service_date,
        nextServiceDate: row.next_maintenance || row.next_service_date,
        depreciationRate: Number(row.metadata?.depreciation_rate || 0),
        warrantyExpiry: row.warranty_expiration || row.warranty_expiry_date,
        createdAt: row.created_at || new Date().toISOString()
      }))
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', realTimeUpdate],
    queryFn: async () => {
      const response = await secureFetch(`/api/inventory/items?limit=200`)
      if (!response.ok) throw new Error('Failed to fetch inventory')
      const payload = await response.json()
      const rows = unwrapRows<any>(payload)
      return rows.map((row: any) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        category: row.category,
        quantity: Number(row.quantity_on_hand || 0),
        reorderPoint: Number(row.reorder_point || 0),
        unitCost: Number(row.unit_cost || 0),
        location: row.warehouse_location || row.bin_location || '',
        supplier: row.primary_supplier_name || row.primary_supplier_id,
        lastRestocked: row.last_restocked
      }))
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate asset metrics
  const metrics = {
    totalAssets: assets.length,
    activeAssets: assets.filter((a) => a.status === 'active').length,
    inMaintenance: assets.filter((a) => a.status === 'maintenance').length,
    available: assets.filter((a) => a.status === 'available').length,
    retired: assets.filter((a) => a.status === 'retired').length,
    totalValue: assets.reduce((sum, a) => sum + (a.currentValue || 0), 0),
    totalDepreciation: assets.reduce((sum, a) => sum + ((a.purchasePrice || 0) - (a.currentValue || 0)), 0),
    avgAge: assets.length > 0
      ? assets.reduce((sum, a) => {
          const ageInYears = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
          return sum + ageInYears
        }, 0) / assets.length
      : 0,
    utilizationRate: assets.length > 0
      ? Math.round((assets.filter((a) => a.status === 'active').length / assets.length) * 100)
      : 0,
  }

  // Inventory metrics
  const inventoryMetrics = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0),
    lowStockItems: inventory.filter((i) => i.quantity <= i.reorderPoint).length,
    outOfStockItems: inventory.filter((i) => i.quantity === 0).length,
  }

  // Asset status distribution for pie chart
  const statusDistribution = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Asset type distribution
  const typeDistribution = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Asset condition distribution
  const conditionDistribution = {
    excellent: assets.filter((a) => a.condition === 'excellent').length,
    good: assets.filter((a) => a.condition === 'good').length,
    fair: assets.filter((a) => a.condition === 'fair').length,
    poor: assets.filter((a) => a.condition === 'poor').length,
  }

  // Asset value over time (derived from asset purchase dates)
  const assetValueTrendData = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, idx) => {
      const date = new Date(now)
      date.setMonth(now.getMonth() - (5 - idx))
      const cutoff = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const monthAssets = assets.filter((a) => new Date(a.createdAt) <= cutoff)
      const value = monthAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0)
      const depreciation = monthAssets.reduce((sum, a) => sum + ((a.purchasePrice || 0) - (a.currentValue || 0)), 0)
      return {
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        value,
        depreciation
      }
    })
  })()

  // Depreciation by asset type
  const depreciationByTypeData = Object.entries(typeDistribution).map(([type, count]) => {
    const typeAssets = assets.filter((a) => a.type === type)
    const totalDepreciation = typeAssets.reduce((sum, a) => sum + ((a.purchasePrice || 0) - (a.currentValue || 0)), 0)
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: totalDepreciation,
      count,
    }
  })

  // Lifecycle status (age-based)
  const lifecycleData = {
    new: assets.filter((a) => {
      const ageInYears = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      return ageInYears < 1
    }).length,
    operational: assets.filter((a) => {
      const ageInYears = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      return ageInYears >= 1 && ageInYears < 5
    }).length,
    aging: assets.filter((a) => {
      const ageInYears = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      return ageInYears >= 5 && ageInYears < 10
    }).length,
    endOfLife: assets.filter((a) => {
      const ageInYears = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      return ageInYears >= 10
    }).length,
  }

  // Assets requiring maintenance (service due within 30 days)
  const maintenanceRequired = assets.filter((a) => {
    if (!a.nextServiceDate) return false
    const serviceDate = new Date(a.nextServiceDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return serviceDate <= thirtyDaysFromNow && serviceDate >= new Date()
  }).sort((a, b) => new Date(a.nextServiceDate!).getTime() - new Date(b.nextServiceDate!).getTime())

  // High-value assets (top 10)
  const highValueAssets = [...assets]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)

  // Assets with high depreciation
  const highDepreciationAssets = [...assets]
    .map((asset) => ({
      ...asset,
      depreciationAmount: asset.purchasePrice - asset.currentValue,
      depreciationPercent: ((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100,
    }))
    .sort((a, b) => b.depreciationAmount - a.depreciationAmount)
    .slice(0, 10)

  // Low stock inventory items
  const lowStockItems = inventory
    .filter((i) => i.quantity <= i.reorderPoint && i.quantity > 0)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10)

  // Out of stock items
  const outOfStockItems = inventory
    .filter((i) => i.quantity === 0)
    .slice(0, 10)

  // Inventory by category
  const inventoryByCategory = inventory.reduce((acc, item) => {
    const existing = acc.find((cat) => cat.name === item.category)
    if (existing) {
      existing.count += 1
      existing.value += item.quantity * item.unitCost
    } else {
      acc.push({
        name: item.category,
        count: 1,
        value: item.quantity * item.unitCost,
        items: item.quantity,
      })
    }
    return acc
  }, [] as Array<{ name: string; count: number; value: number; items: number }>)

  return {
    assets,
    inventory,
    metrics,
    inventoryMetrics,
    statusDistribution,
    typeDistribution,
    conditionDistribution,
    assetValueTrendData,
    depreciationByTypeData,
    lifecycleData,
    maintenanceRequired,
    highValueAssets,
    highDepreciationAssets,
    lowStockItems,
    outOfStockItems,
    inventoryByCategory,
    isLoading: assetsLoading || inventoryLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
