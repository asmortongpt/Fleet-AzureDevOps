/**
 * useReactiveDriversData - Enterprise-grade real-time driver data management
 * Features:
 * - Optimized memoization for performance
 * - Comprehensive error handling
 * - Type-safe API responses
 * - Security-hardened data fetching
 * - Automatic retry logic
 * - Real-time updates with efficient polling
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { z } from 'zod'
import { mockData } from '@/lib/mock-data'

// Environment variables with secure fallbacks
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const REFETCH_INTERVAL = 10000 // 10 seconds
const STALE_TIME = 5000 // 5 seconds
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

// Security constants
const LICENSE_EXPIRY_WARNING_DAYS = 30
const LOW_SAFETY_SCORE_THRESHOLD = 75
const SAFETY_SCORE_EXCELLENT = 90
const SAFETY_SCORE_GOOD = 75
const SAFETY_SCORE_FAIR = 60
const MAX_TOP_PERFORMERS = 10

// Zod schemas for runtime validation
const DriverStatusEnum = z.enum(['active', 'inactive', 'on_leave', 'suspended'])
const AssignmentStatusEnum = z.enum(['active', 'completed', 'pending'])

const DriverSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime(),
  status: DriverStatusEnum,
  vehicleId: z.string().optional(),
  safetyScore: z.number().min(0).max(100),
  performanceRating: z.number().min(0).max(100),
  hoursWorked: z.number().min(0),
  violationCount: z.number().min(0),
  createdAt: z.string().datetime(),
})

const AssignmentSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  vehicleId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: AssignmentStatusEnum,
})

const PerformanceTrendSchema = z.object({
  date: z.string().datetime(),
  avgScore: z.number(),
  violations: z.number(),
})

// TypeScript types derived from schemas
export type Driver = z.infer<typeof DriverSchema>
export type Assignment = z.infer<typeof AssignmentSchema>
export type PerformanceTrend = z.infer<typeof PerformanceTrendSchema>
export type DriverStatus = z.infer<typeof DriverStatusEnum>
export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>

// API response types
const DriversResponseSchema = z.array(DriverSchema)
const AssignmentsResponseSchema = z.array(AssignmentSchema)
const PerformanceTrendResponseSchema = z.array(PerformanceTrendSchema)

// Custom error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Sanitize string to prevent XSS
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Secure fetch wrapper with retry logic
async function secureFetch<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  retries = RETRY_ATTEMPTS
): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin', // CSRF protection
      })

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        )
      }

      const data = await response.json()

      // Validate response schema
      const validated = schema.parse(data)

      return validated
    } catch (error) {
      if (attempt === retries) {
        if (error instanceof z.ZodError) {
          throw new ApiError(
            `Invalid API response format: ${error.message}`,
            undefined,
            endpoint
          )
        }
        throw error
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt))
      )
    }
  }

  throw new ApiError('Max retries exceeded', undefined, endpoint)
}

// Metrics calculation interface
interface DriverMetrics {
  totalDrivers: number
  activeDrivers: number
  onLeave: number
  suspended: number
  avgSafetyScore: number
  avgPerformance: number
  activeAssignments: number
  totalViolations: number
}

interface SafetyScoreRanges {
  excellent: number
  good: number
  fair: number
  poor: number
}

interface DriverWithHours {
  name: string
  hours: number
}

// Hook return type
interface UseReactiveDriversDataReturn {
  drivers: Driver[]
  assignments: Assignment[]
  performanceTrend: PerformanceTrend[]
  metrics: DriverMetrics
  statusDistribution: Record<DriverStatus, number>
  safetyScoreRanges: SafetyScoreRanges
  hoursWorkedData: DriverWithHours[]
  driversWithViolations: Driver[]
  lowSafetyDrivers: Driver[]
  expiringLicenses: Driver[]
  topPerformers: Driver[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  lastUpdate: Date
  refresh: () => void
}

/**
 * Main hook for reactive driver data management
 * Optimized with memoization and efficient computations
 */
export function useReactiveDriversData(): UseReactiveDriversDataReturn {
  // ========================================
  // DEMO MODE - Return Mock Data
  // ========================================

  const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

  if (USE_MOCK_DATA) {
    // Transform mock drivers to match expected format
    const drivers: Driver[] = mockData.drivers.map((d, idx) => ({
      id: String(d.id),
      name: d.name,
      email: d.email,
      phone: d.phone,
      licenseNumber: d.license_number,
      licenseExpiry: new Date(d.license_expiry).toISOString(),
      status: d.status as DriverStatus,
      vehicleId: d.assigned_vehicle ? String(idx + 1) : undefined,
      safetyScore: d.safety_score,
      performanceRating: d.safety_score, // Use safety score as performance proxy
      hoursWorked: Math.floor(d.total_miles / 50), // Estimate hours from miles
      violationCount: d.violations,
      createdAt: new Date(d.hire_date).toISOString(),
    }))

    const metrics: DriverMetrics = {
      totalDrivers: mockData.driverStats.total,
      activeDrivers: mockData.driverStats.active,
      onLeave: mockData.driverStats.on_leave,
      suspended: 0,
      avgSafetyScore: mockData.driverStats.avgSafetyScore,
      avgPerformance: mockData.driverStats.avgSafetyScore,
      activeAssignments: mockData.driverStats.active,
      totalViolations: mockData.driverStats.totalViolations,
    }

    const statusDistribution: Record<DriverStatus, number> = {
      active: mockData.driverStats.active,
      on_leave: mockData.driverStats.on_leave,
      inactive: 0,
      suspended: 0,
    }

    const safetyScoreRanges: SafetyScoreRanges = {
      excellent: drivers.filter(d => d.safetyScore >= 90).length,
      good: drivers.filter(d => d.safetyScore >= 75 && d.safetyScore < 90).length,
      fair: drivers.filter(d => d.safetyScore >= 60 && d.safetyScore < 75).length,
      poor: drivers.filter(d => d.safetyScore < 60).length,
    }

    const lowSafetyDrivers = drivers.filter(d => d.safetyScore < LOW_SAFETY_SCORE_THRESHOLD)
    const expiringLicenses = drivers.filter(d => {
      const daysUntilExpiry = (new Date(d.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return daysUntilExpiry > 0 && daysUntilExpiry <= LICENSE_EXPIRY_WARNING_DAYS
    })
    const topPerformers = [...drivers]
      .sort((a, b) => b.performanceRating - a.performanceRating)
      .slice(0, MAX_TOP_PERFORMERS)

    const hoursWorkedData: DriverWithHours[] = drivers.map(d => ({
      name: d.name,
      hours: d.hoursWorked,
    })).sort((a, b) => b.hours - a.hours).slice(0, 10)

    const performanceTrend: PerformanceTrend[] = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      avgScore: metrics.avgSafetyScore + (Math.random() * 5 - 2.5), // Slight variation
      violations: Math.floor(metrics.totalViolations / 7),
    }))

    return {
      drivers,
      assignments: [],
      performanceTrend,
      metrics,
      statusDistribution,
      safetyScoreRanges,
      hoursWorkedData,
      driversWithViolations: drivers.filter(d => d.violationCount > 0),
      lowSafetyDrivers,
      expiringLicenses,
      topPerformers,
      isLoading: false,
      isError: false,
      error: null,
      lastUpdate: new Date(),
      refresh: () => {},
    }
  }

  // Fetch drivers with error handling
  const driversQuery: UseQueryResult<Driver[], Error> = useQuery({
    queryKey: ['drivers'],
    queryFn: () => secureFetch('/drivers', DriversResponseSchema),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
    retry: RETRY_ATTEMPTS,
    retryDelay: RETRY_DELAY,
  })

  // Fetch assignments with error handling
  const assignmentsQuery: UseQueryResult<Assignment[], Error> = useQuery({
    queryKey: ['assignments'],
    queryFn: () => secureFetch('/assignments', AssignmentsResponseSchema),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
    retry: RETRY_ATTEMPTS,
    retryDelay: RETRY_DELAY,
  })

  // Fetch performance trend data
  const performanceTrendQuery: UseQueryResult<PerformanceTrend[], Error> = useQuery({
    queryKey: ['performance-trend'],
    queryFn: () => secureFetch('/performance-trend', PerformanceTrendResponseSchema),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
    retry: RETRY_ATTEMPTS,
    retryDelay: RETRY_DELAY,
  })

  const drivers = driversQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []
  const performanceTrend = performanceTrendQuery.data ?? []

  // Memoized metrics calculation - only recalculates when drivers/assignments change
  const metrics = useMemo<DriverMetrics>(() => {
    if (drivers.length === 0) {
      return {
        totalDrivers: 0,
        activeDrivers: 0,
        onLeave: 0,
        suspended: 0,
        avgSafetyScore: 0,
        avgPerformance: 0,
        activeAssignments: 0,
        totalViolations: 0,
      }
    }

    const activeDrivers = drivers.filter(d => d.status === 'active').length
    const onLeave = drivers.filter(d => d.status === 'on_leave').length
    const suspended = drivers.filter(d => d.status === 'suspended').length

    const totalSafetyScore = drivers.reduce((sum, d) => sum + d.safetyScore, 0)
    const totalPerformance = drivers.reduce((sum, d) => sum + d.performanceRating, 0)
    const totalViolations = drivers.reduce((sum, d) => sum + d.violationCount, 0)
    const activeAssignments = assignments.filter(a => a.status === 'active').length

    return {
      totalDrivers: drivers.length,
      activeDrivers,
      onLeave,
      suspended,
      avgSafetyScore: Math.round(totalSafetyScore / drivers.length),
      avgPerformance: Math.round(totalPerformance / drivers.length),
      activeAssignments,
      totalViolations,
    }
  }, [drivers, assignments])

  // Memoized status distribution
  const statusDistribution = useMemo<Record<DriverStatus, number>>(() => {
    const distribution: Record<string, number> = {
      active: 0,
      inactive: 0,
      on_leave: 0,
      suspended: 0,
    }

    drivers.forEach(driver => {
      distribution[driver.status] = (distribution[driver.status] || 0) + 1
    })

    return distribution as Record<DriverStatus, number>
  }, [drivers])

  // Memoized safety score ranges
  const safetyScoreRanges = useMemo<SafetyScoreRanges>(() => {
    return drivers.reduce(
      (acc, driver) => {
        if (driver.safetyScore >= SAFETY_SCORE_EXCELLENT) acc.excellent++
        else if (driver.safetyScore >= SAFETY_SCORE_GOOD) acc.good++
        else if (driver.safetyScore >= SAFETY_SCORE_FAIR) acc.fair++
        else acc.poor++
        return acc
      },
      { excellent: 0, good: 0, fair: 0, poor: 0 }
    )
  }, [drivers])

  // Memoized hours worked data (top 10)
  const hoursWorkedData = useMemo<DriverWithHours[]>(() => {
    return drivers
      .sort((a, b) => b.hoursWorked - a.hoursWorked)
      .slice(0, MAX_TOP_PERFORMERS)
      .map(driver => ({
        name: sanitizeString(driver.name.split(' ')[0] || driver.name),
        hours: driver.hoursWorked,
      }))
  }, [drivers])

  // Memoized drivers with violations (top 5)
  const driversWithViolations = useMemo<Driver[]>(() => {
    return drivers
      .filter(d => d.violationCount > 0)
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 5)
  }, [drivers])

  // Memoized low safety score drivers (bottom 5)
  const lowSafetyDrivers = useMemo<Driver[]>(() => {
    return drivers
      .filter(d => d.safetyScore < LOW_SAFETY_SCORE_THRESHOLD)
      .sort((a, b) => a.safetyScore - b.safetyScore)
      .slice(0, 5)
  }, [drivers])

  // Memoized expiring licenses (within 30 days)
  const expiringLicenses = useMemo<Driver[]>(() => {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + LICENSE_EXPIRY_WARNING_DAYS)

    return drivers.filter(driver => {
      try {
        const expiryDate = new Date(driver.licenseExpiry)
        return expiryDate >= now && expiryDate <= futureDate
      } catch {
        return false
      }
    })
  }, [drivers])

  // Memoized top performers (top 10 by performance rating)
  const topPerformers = useMemo<Driver[]>(() => {
    return drivers
      .filter(d => d.status === 'active')
      .sort((a, b) => b.performanceRating - a.performanceRating)
      .slice(0, MAX_TOP_PERFORMERS)
  }, [drivers])

  // Refresh callback - invalidates all queries
  const refresh = useCallback(() => {
    driversQuery.refetch()
    assignmentsQuery.refetch()
    performanceTrendQuery.refetch()
  }, [driversQuery, assignmentsQuery, performanceTrendQuery])

  const isLoading =
    driversQuery.isLoading ||
    assignmentsQuery.isLoading ||
    performanceTrendQuery.isLoading

  const isError =
    driversQuery.isError ||
    assignmentsQuery.isError ||
    performanceTrendQuery.isError

  const error =
    driversQuery.error ||
    assignmentsQuery.error ||
    performanceTrendQuery.error

  return {
    drivers,
    assignments,
    performanceTrend,
    metrics,
    statusDistribution,
    safetyScoreRanges,
    hoursWorkedData,
    driversWithViolations,
    lowSafetyDrivers,
    expiringLicenses,
    topPerformers,
    isLoading,
    isError,
    error,
    lastUpdate: new Date(),
    refresh,
  }
}
