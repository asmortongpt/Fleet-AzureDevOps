/**
 * useReactiveDriversData - Real-time drivers data with React Query
 * Auto-refreshes every 10 seconds for live driver management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  status: 'active' | 'inactive' | 'on_leave' | 'suspended'
  vehicleId?: string
  safetyScore: number
  performanceRating: number
  hoursWorked: number
  violationCount: number
  createdAt: string
}

interface Assignment {
  id: string
  driverId: string
  vehicleId: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'pending'
}

export function useReactiveDriversData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['drivers', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/drivers`)
      if (!response.ok) throw new Error('Failed to fetch drivers')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/assignments`)
      if (!response.ok) throw new Error('Failed to fetch assignments')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate driver metrics
  const metrics = {
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter((d) => d.status === 'active').length,
    onLeave: drivers.filter((d) => d.status === 'on_leave').length,
    suspended: drivers.filter((d) => d.status === 'suspended').length,
    avgSafetyScore: drivers.length > 0
      ? Math.round(drivers.reduce((sum, d) => sum + (d.safetyScore || 0), 0) / drivers.length)
      : 0,
    avgPerformance: drivers.length > 0
      ? Math.round(drivers.reduce((sum, d) => sum + (d.performanceRating || 0), 0) / drivers.length)
      : 0,
    activeAssignments: assignments.filter((a) => a.status === 'active').length,
    totalViolations: drivers.reduce((sum, d) => sum + (d.violationCount || 0), 0),
  }

  // Driver status distribution for pie chart
  const statusDistribution = drivers.reduce((acc, driver) => {
    acc[driver.status] = (acc[driver.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Safety score distribution
  const safetyScoreRanges = {
    excellent: drivers.filter((d) => d.safetyScore >= 90).length,
    good: drivers.filter((d) => d.safetyScore >= 75 && d.safetyScore < 90).length,
    fair: drivers.filter((d) => d.safetyScore >= 60 && d.safetyScore < 75).length,
    poor: drivers.filter((d) => d.safetyScore < 60).length,
  }

  // Performance trend data (mock - would come from API with historical data)
  const performanceTrendData = [
    { name: 'Mon', avgScore: 85, violations: 2 },
    { name: 'Tue', avgScore: 87, violations: 1 },
    { name: 'Wed', avgScore: 86, violations: 3 },
    { name: 'Thu', avgScore: 89, violations: 1 },
    { name: 'Fri', avgScore: 88, violations: 2 },
    { name: 'Sat', avgScore: 84, violations: 0 },
    { name: 'Sun', avgScore: 86, violations: 1 },
  ]

  // Hours worked distribution by driver (top 10)
  const hoursWorkedData = drivers
    .sort((a, b) => (b.hoursWorked || 0) - (a.hoursWorked || 0))
    .slice(0, 10)
    .map((driver) => ({
      name: driver.name.split(' ')[0], // First name only
      hours: driver.hoursWorked || 0,
    }))

  // Get drivers with violations
  const driversWithViolations = drivers
    .filter((d) => (d.violationCount || 0) > 0)
    .sort((a, b) => (b.violationCount || 0) - (a.violationCount || 0))
    .slice(0, 5)

  // Get drivers with low safety scores
  const lowSafetyDrivers = drivers
    .filter((d) => d.safetyScore < 75)
    .sort((a, b) => a.safetyScore - b.safetyScore)
    .slice(0, 5)

  // Get drivers with expiring licenses (within 30 days)
  const expiringLicenses = drivers.filter((d) => {
    if (!d.licenseExpiry) return false
    const expiryDate = new Date(d.licenseExpiry)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
  })

  return {
    drivers,
    assignments,
    metrics,
    statusDistribution,
    safetyScoreRanges,
    performanceTrendData,
    hoursWorkedData,
    driversWithViolations,
    lowSafetyDrivers,
    expiringLicenses,
    isLoading: driversLoading || assignmentsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
