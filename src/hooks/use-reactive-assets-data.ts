/**
 * useReactiveAssetsData - Real-time assets and inventory data with React Query
 * Auto-refreshes every 10 seconds for live asset management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

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

  // Fetch assets
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['assets', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/assets`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/inventory`)
      if (!response.ok) throw new Error('Failed to fetch inventory')
      return response.json()
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

  // Asset value over time (mock data - would calculate from purchase dates and depreciation)
  const assetValueTrendData = [
    { name: 'Jan', value: 4800000, depreciation: 250000 },
    { name: 'Feb', value: 4750000, depreciation: 260000 },
    { name: 'Mar', value: 4700000, depreciation: 270000 },
    { name: 'Apr', value: 4650000, depreciation: 280000 },
    { name: 'May', value: 4600000, depreciation: 290000 },
    { name: 'Jun', value: 4550000, depreciation: 300000 },
  ]

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
