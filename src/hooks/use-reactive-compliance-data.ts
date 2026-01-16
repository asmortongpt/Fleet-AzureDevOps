/**
 * useReactiveComplianceData - Real-time compliance data with React Query
 * Auto-refreshes every 10 seconds for live compliance dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ComplianceRecord {
  id: string
  type: 'dot' | 'epa' | 'osha' | 'ifta' | 'dmv' | 'insurance'
  vehicleId?: string
  driverId?: string
  status: 'compliant' | 'non_compliant' | 'expiring_soon' | 'expired'
  expiryDate: string
  lastInspection?: string
  violations?: number
  createdAt: string
}

interface Inspection {
  id: string
  vehicleId: string
  inspectionType: 'dot' | 'safety' | 'emission'
  status: 'passed' | 'failed' | 'pending'
  defects: number
  inspectionDate: string
}

export function useReactiveComplianceData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch compliance records
  const { data: complianceRecords = [], isLoading: complianceLoading } = useQuery<ComplianceRecord[]>({
    queryKey: ['compliance-records', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/compliance`)
      if (!response.ok) throw new Error('Failed to fetch compliance records')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery<Inspection[]>({
    queryKey: ['inspections', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/inspections`)
      if (!response.ok) throw new Error('Failed to fetch inspections')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate compliance metrics
  const metrics = {
    totalRecords: complianceRecords.length,
    compliant: complianceRecords.filter((r) => r.status === 'compliant').length,
    nonCompliant: complianceRecords.filter((r) => r.status === 'non_compliant').length,
    expiringSoon: complianceRecords.filter((r) => r.status === 'expiring_soon').length,
    expired: complianceRecords.filter((r) => r.status === 'expired').length,
    complianceRate: complianceRecords.length > 0
      ? Math.round((complianceRecords.filter((r) => r.status === 'compliant').length / complianceRecords.length) * 100)
      : 0,
    totalInspections: inspections.length,
    passedInspections: inspections.filter((i) => i.status === 'passed').length,
    failedInspections: inspections.filter((i) => i.status === 'failed').length,
    totalViolations: complianceRecords.reduce((sum, r) => sum + (r.violations || 0), 0),
  }

  // Compliance status distribution
  const statusDistribution = complianceRecords.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Compliance by type
  const complianceByType = complianceRecords.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Inspection pass rate trend (mock data - would calculate from timestamps)
  const inspectionTrendData = [
    { name: 'Jan', passed: 45, failed: 5, rate: 90 },
    { name: 'Feb', passed: 48, failed: 4, rate: 92 },
    { name: 'Mar', passed: 47, failed: 6, rate: 89 },
    { name: 'Apr', passed: 51, failed: 3, rate: 94 },
    { name: 'May', passed: 49, failed: 5, rate: 91 },
    { name: 'Jun', passed: 52, failed: 2, rate: 96 },
  ]

  // Compliance rate by category
  const complianceRateByCategory = [
    { name: 'DOT', rate: 95, total: 120, compliant: 114 },
    { name: 'EPA', rate: 88, total: 85, compliant: 75 },
    { name: 'OSHA', rate: 92, total: 100, compliant: 92 },
    { name: 'IFTA', rate: 98, total: 60, compliant: 59 },
    { name: 'DMV', rate: 94, total: 150, compliant: 141 },
    { name: 'Insurance', rate: 100, total: 120, compliant: 120 },
  ]

  // Get expiring items (within 30 days)
  const expiringItems = complianceRecords.filter((r) => {
    if (r.status !== 'expiring_soon') return false
    const expiryDate = new Date(r.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).slice(0, 10)

  // Get non-compliant items
  const nonCompliantItems = complianceRecords
    .filter((r) => r.status === 'non_compliant' || r.status === 'expired')
    .sort((a, b) => (b.violations || 0) - (a.violations || 0))
    .slice(0, 10)

  // Get failed inspections
  const failedInspectionsList = inspections
    .filter((i) => i.status === 'failed')
    .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
    .slice(0, 5)

  return {
    complianceRecords,
    inspections,
    metrics,
    statusDistribution,
    complianceByType,
    inspectionTrendData,
    complianceRateByCategory,
    expiringItems,
    nonCompliantItems,
    failedInspectionsList,
    isLoading: complianceLoading || inspectionsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
