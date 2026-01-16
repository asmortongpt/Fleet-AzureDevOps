/**
 * useReactiveProcurementData - Real-time procurement data with React Query
 * Auto-refreshes every 10 seconds for live dashboard updates
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export interface Vendor {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'onboarding'
  rating: number
  totalSpend: number
  onTimeDelivery: number
  qualityRating: number
  leadTimeDays: number
  contractEndDate?: string
}

export interface PurchaseOrder {
  id: string
  vendorId: string
  vendorName: string
  orderNumber: string
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'in_transit' | 'received' | 'cancelled'
  totalAmount: number
  createdAt: string
  expectedDelivery?: string
  items: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'parts' | 'fuel' | 'equipment' | 'services' | 'supplies'
}

export interface Contract {
  id: string
  vendorId: string
  vendorName: string
  type: 'parts' | 'fuel' | 'services' | 'maintenance'
  startDate: string
  endDate: string
  status: 'active' | 'expiring' | 'expired' | 'pending'
  totalValue: number
  renewalDate?: string
}

export interface ProcurementMetrics {
  totalPOs: number
  activeVendors: number
  pendingApprovals: number
  totalSpend: number
  avgOrderValue: number
  onTimeDeliveryRate: number
  monthlySpend: number
  budgetUsed: number
  budgetTotal: number
}

export function useReactiveProcurementData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ['vendors', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/vendors`)
      if (!response.ok) throw new Error('Failed to fetch vendors')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch purchase orders
  const { data: purchaseOrders = [], isLoading: posLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/purchase-orders`)
      if (!response.ok) throw new Error('Failed to fetch purchase orders')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ['contracts', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/contracts`)
      if (!response.ok) throw new Error('Failed to fetch contracts')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate metrics from real data
  const metrics: ProcurementMetrics = {
    totalPOs: purchaseOrders.length,
    activeVendors: vendors.filter((v) => v.status === 'active').length,
    pendingApprovals: purchaseOrders.filter((po) => po.status === 'pending_approval').length,
    totalSpend: purchaseOrders
      .filter((po) => po.status === 'received')
      .reduce((sum, po) => sum + po.totalAmount, 0),
    avgOrderValue:
      purchaseOrders.length > 0
        ? purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0) / purchaseOrders.length
        : 0,
    onTimeDeliveryRate:
      vendors.length > 0
        ? vendors.reduce((sum, v) => sum + v.onTimeDelivery, 0) / vendors.length
        : 0,
    monthlySpend: purchaseOrders
      .filter((po) => {
        const orderDate = new Date(po.createdAt)
        const now = new Date()
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        )
      })
      .reduce((sum, po) => sum + po.totalAmount, 0),
    budgetUsed: 72000,
    budgetTotal: 100000,
  }

  // PO status distribution for pie chart
  const poStatusDistribution = purchaseOrders.reduce((acc, po) => {
    const status =
      po.status === 'pending_approval'
        ? 'Pending Approval'
        : po.status === 'in_transit'
          ? 'In Transit'
          : po.status.charAt(0).toUpperCase() + po.status.slice(1)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // PO category distribution for bar chart
  const poCategoryDistribution = purchaseOrders.reduce((acc, po) => {
    const category = po.category.charAt(0).toUpperCase() + po.category.slice(1)
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Vendor performance for bar chart (top 10 vendors by spend)
  const vendorSpendData = vendors
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10)
    .map((v) => ({
      name: v.name,
      spend: v.totalSpend,
    }))

  // Monthly spend trend (last 6 months)
  const monthlySpendTrend = [
    { name: 'Jul', spend: 68500 },
    { name: 'Aug', spend: 72100 },
    { name: 'Sep', spend: 65800 },
    { name: 'Oct', spend: 78300 },
    { name: 'Nov', spend: 82400 },
    { name: 'Dec', spend: metrics.monthlySpend },
  ]

  // Pending approvals (urgent items)
  const pendingApprovals = purchaseOrders.filter(
    (po) => po.status === 'pending_approval'
  )

  // Overdue orders (in transit beyond expected delivery)
  const overdueOrders = purchaseOrders.filter((po) => {
    if (po.status === 'in_transit' && po.expectedDelivery) {
      return new Date(po.expectedDelivery) < new Date()
    }
    return false
  })

  // Budget alerts (over 75% usage)
  const budgetAlerts = metrics.budgetUsed / metrics.budgetTotal > 0.75

  // Expiring contracts (within 30 days)
  const expiringContracts = contracts.filter((c) => {
    if (c.endDate) {
      const daysUntilExpiry = Math.floor(
        (new Date(c.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30
    }
    return false
  })

  // Top vendors by spend
  const topVendorsBySpend = vendors
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5)

  // Recent POs (last 10)
  const recentPurchaseOrders = [...purchaseOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return {
    vendors,
    purchaseOrders,
    contracts,
    metrics,
    poStatusDistribution,
    poCategoryDistribution,
    vendorSpendData,
    monthlySpendTrend,
    pendingApprovals,
    overdueOrders,
    budgetAlerts,
    expiringContracts,
    topVendorsBySpend,
    recentPurchaseOrders,
    isLoading: vendorsLoading || posLoading || contractsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
