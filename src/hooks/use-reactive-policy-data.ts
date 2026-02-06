/**
 * useReactivePolicyData - Real-time policy and procedures data with React Query
 * Auto-refreshes every 10 seconds for live policy management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { secureFetch } from '@/hooks/use-api'

interface Policy {
  id: string
  title: string
  category: 'safety' | 'compliance' | 'operational' | 'hr' | 'environmental' | 'security'
  status: 'active' | 'draft' | 'archived' | 'under_review'
  version: string
  effectiveDate: string
  reviewDate?: string
  owner: string
  description: string
  acknowledgedBy?: string[]
  violationCount?: number
  createdAt: string
  updatedAt: string
}

interface Procedure {
  id: string
  policyId: string
  title: string
  steps: string[]
  status: 'active' | 'draft' | 'outdated'
  lastUpdated: string
  createdAt: string
}

interface PolicyUpdate {
  id: string
  policyId: string
  type: 'created' | 'revised' | 'reviewed' | 'archived'
  description: string
  updatedBy: string
  timestamp: string
}

interface PolicyCompliance {
  id: string
  policyId: string
  employeeId: string
  acknowledged: boolean
  acknowledgedAt?: string
  trainingCompleted: boolean
  trainingCompletedAt?: string
  complianceScore: number
}

export function useReactivePolicyData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  const fetchList = useMemo(() => {
    return async <T,>(path: string): Promise<T[]> => {
      try {
        const response = await secureFetch(path, { method: 'GET' })
        if (!response.ok) return []
        const payload = await response.json()
        const data = payload?.data ?? payload
        if (Array.isArray(data)) return data as T[]
        if (data?.data && Array.isArray(data.data)) return data.data as T[]
        return []
      } catch {
        return []
      }
    }
  }, [])

  // Fetch policies
  const { data: policies = [], isLoading: policiesLoading } = useQuery<Policy[]>({
    queryKey: ['policies', realTimeUpdate],
    queryFn: async () => {
      return fetchList<Policy>('/api/policies')
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch procedures
  const { data: procedures = [], isLoading: proceduresLoading } = useQuery<Procedure[]>({
    queryKey: ['procedures', realTimeUpdate],
    queryFn: async () => {
      return fetchList<Procedure>('/api/procedures')
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch policy updates
  const { data: policyUpdates = [], isLoading: updatesLoading } = useQuery<PolicyUpdate[]>({
    queryKey: ['policy-updates', realTimeUpdate],
    queryFn: async () => {
      return fetchList<PolicyUpdate>('/api/policy-updates')
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch policy compliance
  const { data: complianceRecords = [], isLoading: complianceLoading } = useQuery<PolicyCompliance[]>({
    queryKey: ['policy-compliance', realTimeUpdate],
    queryFn: async () => {
      return fetchList<PolicyCompliance>('/api/policy-compliance')
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate policy metrics
  const metrics = {
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.status === 'active').length,
    draftPolicies: policies.filter((p) => p.status === 'draft').length,
    underReview: policies.filter((p) => p.status === 'under_review').length,
    totalProcedures: procedures.length,
    activeProcedures: procedures.filter((p) => p.status === 'active').length,
    totalViolations: policies.reduce((sum, p) => sum + (p.violationCount || 0), 0),
    avgComplianceScore: complianceRecords.length > 0
      ? Math.round(
          complianceRecords.reduce((sum, c) => sum + c.complianceScore, 0) / complianceRecords.length
        )
      : 0,
    acknowledgementRate: complianceRecords.length > 0
      ? Math.round(
          (complianceRecords.filter((c) => c.acknowledged).length / complianceRecords.length) * 100
        )
      : 0,
    trainingCompletionRate: complianceRecords.length > 0
      ? Math.round(
          (complianceRecords.filter((c) => c.trainingCompleted).length / complianceRecords.length) * 100
        )
      : 0,
  }

  // Policy status distribution for pie chart
  const statusDistribution = policies.reduce((acc, policy) => {
    acc[policy.status] = (acc[policy.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Policy by category distribution
  const categoryDistribution = policies.reduce((acc, policy) => {
    acc[policy.category] = (acc[policy.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Compliance trend data (last 4 weeks)
  const complianceTrendData = (() => {
    const buckets = Array.from({ length: 4 }, (_, index) => {
      const end = new Date()
      end.setDate(end.getDate() - index * 7)
      const start = new Date(end)
      start.setDate(end.getDate() - 7)
      return { start, end }
    }).reverse()

    return buckets.map((bucket, idx) => {
      const acknowledgements = complianceRecords.filter((record) => {
        if (!record.acknowledgedAt) return false
        const ts = new Date(record.acknowledgedAt)
        return ts >= bucket.start && ts < bucket.end
      }).length

      const trainings = complianceRecords.filter((record) => {
        if (!record.trainingCompletedAt) return false
        const ts = new Date(record.trainingCompletedAt)
        return ts >= bucket.start && ts < bucket.end
      }).length

      return {
        name: `Week ${idx + 1}`,
        acknowledgement: acknowledgements,
        training: trainings,
        violations: 0
      }
    })
  })()

  // Policy adoption rate by category
  const adoptionByCategory = Object.entries(categoryDistribution).map(([category, totalPolicies]) => {
    const categoryPolicies = policies.filter((p) => p.category === category)
    const policyIds = new Set(categoryPolicies.map((p) => p.id))
    const relevant = complianceRecords.filter((record) => policyIds.has(record.policyId))
    const adopted = relevant.filter((record) => record.acknowledged).length
    const total = relevant.length
    const rate = total > 0 ? Math.round((adopted / total) * 100) : 0
    return {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      adopted,
      total,
      rate
    }
  })

  // Get policies needing review (within 30 days)
  const policiesNeedingReview = policies.filter((p) => {
    if (!p.reviewDate) return false
    const reviewDate = new Date(p.reviewDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return reviewDate <= thirtyDaysFromNow && reviewDate >= new Date()
  }).sort((a, b) => new Date(a.reviewDate!).getTime() - new Date(b.reviewDate!).getTime())

  // Get policies with violations
  const policiesWithViolations = policies
    .filter((p) => (p.violationCount || 0) > 0)
    .sort((a, b) => (b.violationCount || 0) - (a.violationCount || 0))
    .slice(0, 10)

  // Get recent policy updates (last 10)
  const recentUpdates = policyUpdates
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  // Get low compliance policies
  const lowCompliancePolicies = (() => {
    const policyComplianceMap = new Map<string, { total: number; acknowledged: number }>()

    complianceRecords.forEach((record) => {
      if (!policyComplianceMap.has(record.policyId)) {
        policyComplianceMap.set(record.policyId, { total: 0, acknowledged: 0 })
      }
      const stats = policyComplianceMap.get(record.policyId)!
      stats.total++
      if (record.acknowledged) stats.acknowledged++
    })

    return Array.from(policyComplianceMap.entries())
      .map(([policyId, stats]) => {
        const policy = policies.find((p) => p.id === policyId)
        return {
          policy,
          rate: Math.round((stats.acknowledged / stats.total) * 100),
          acknowledged: stats.acknowledged,
          total: stats.total,
        }
      })
      .filter((item) => item.policy && item.rate < 80)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5)
  })()

  return {
    policies,
    procedures,
    policyUpdates,
    complianceRecords,
    metrics,
    statusDistribution,
    categoryDistribution,
    complianceTrendData,
    adoptionByCategory,
    policiesNeedingReview,
    policiesWithViolations,
    recentUpdates,
    lowCompliancePolicies,
    isLoading: policiesLoading || proceduresLoading || updatesLoading || complianceLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
