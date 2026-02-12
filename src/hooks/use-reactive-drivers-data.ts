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

// Environment variables with secure fallbacks
const API_BASE = import.meta.env.VITE_API_URL || '/api'
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

const DriverSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
    licenseNumber: z.string().nullish(),
    licenseExpiry: z.string().datetime().nullish(),
    status: z.string().nullish(),
    vehicleId: z.string().nullish(),
    safetyScore: z.number().min(0).max(100).nullish(),
    performanceRating: z.number().min(0).max(100).nullish(),
    hoursWorked: z.number().min(0).nullish(),
    violationCount: z.number().min(0).nullish(),
    createdAt: z.string().datetime().nullish(),
    // snake_case fields
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    license_number: z.string().nullish(),
    license_expiry_date: z.string().datetime().nullish(),
    performance_score: z.coerce.number().nullish(),
    status_code: z.string().nullish(),
    employee_number: z.string().nullish(),
    created_at: z.string().datetime().nullish(),
    metadata: z.any().nullish(),
  })
  .passthrough()
  .transform((row) => {
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
    const name = row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim()
    const status = (row.status || row.status_code || 'active') as z.infer<typeof DriverStatusEnum>

    // Parse numeric strings from API (safety_score, performance_score come as "72.50")
    const safetyScore = Number(row.safetyScore ?? row.safety_score ?? row.performance_score ?? 0) || 0
    const performanceRating = Number(row.performanceRating ?? row.performance_score ?? row.safety_score ?? 0) || 0

    return {
      id: row.id,
      name: name || row.email || 'Unknown',
      email: row.email || '',
      phone: row.phone || '',
      licenseNumber: row.licenseNumber || row.license_number || '',
      licenseExpiry: row.licenseExpiry || row.license_expiry_date || new Date().toISOString(),
      status: status || 'active',
      vehicleId: row.vehicleId,
      safetyScore,
      performanceRating,
      hoursWorked: row.hoursWorked ?? metadata.hoursWorked ?? 0,
      violationCount: row.violationCount ?? metadata.violationCount ?? 0,
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      // Pass through extra fields for UI consumption
      department: row.department,
      region: row.region,
      employment_type: row.employment_type,
      employmentType: row.employment_type,
      hos_status: row.hos_status,
      hosStatus: row.hos_status,
      hours_available: row.hours_available,
      hoursAvailable: row.hours_available,
      medical_card_expiry: row.medical_card_expiry_date,
      medicalCardExpiry: row.medical_card_expiry_date,
      drug_test_date: row.drug_test_date,
      safety_score: safetyScore,
    }
  })

const AssignmentSchema = z
  .object({
    id: z.string(),
    driverId: z.string().nullish(),
    vehicleId: z.string().nullish(),
    startDate: z.string().datetime().nullish(),
    endDate: z.string().datetime().nullish(),
    status: z.string().default('active'),
    driver_id: z.string().nullish(),
    vehicle_id: z.string().nullish(),
    start_date: z.string().datetime().nullish(),
    end_date: z.string().datetime().nullish(),
  })
  .transform((row) => ({
    id: row.id,
    driverId: row.driverId ?? row.driver_id ?? '',
    vehicleId: row.vehicleId ?? row.vehicle_id ?? '',
    startDate: row.startDate ?? row.start_date ?? '',
    endDate: row.endDate ?? row.end_date,
    status: row.status,
  }))


// TypeScript types derived from schemas
export type Driver = z.infer<typeof DriverSchema>
export type Assignment = z.infer<typeof AssignmentSchema>
export type PerformanceTrend = {
  date: string
  avgScore: number
  violations: number
}
export type DriverStatus = z.infer<typeof DriverStatusEnum>
export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>

// API response types
const DriversResponseSchema = z.array(DriverSchema)
const AssignmentsResponseSchema = z.array(AssignmentSchema)

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
      // Handle nested response formats: { data: { data: [...] } }, { data: [...] }, or [...]
      const payload =
        Array.isArray(data?.data?.data) ? data.data.data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data) ? data
        : data

      // Validate response schema
      const validated = schema.parse(payload)

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
  // Fetch drivers with error handling
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: () => secureFetch('/drivers', DriversResponseSchema as any) as Promise<Driver[]>,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
    retry: RETRY_ATTEMPTS,
    retryDelay: RETRY_DELAY,
  })

  // Fetch assignments with error handling
  const assignmentsQuery: UseQueryResult<Assignment[], Error> = useQuery({
    queryKey: ['vehicle-assignments'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/vehicle-assignments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          '/vehicle-assignments'
        )
      }

      const payload = await response.json()
      // Handle nested formats: { data: { assignments: [...] } }, { data: { data: [...] } }, { data: [...] }
      const rows =
        payload?.data?.assignments ?? payload?.data?.data ?? payload?.assignments ?? (Array.isArray(payload?.data) ? payload.data : payload ?? [])
      return AssignmentsResponseSchema.parse(Array.isArray(rows) ? rows : [])
    },
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
    retry: RETRY_ATTEMPTS,
    retryDelay: RETRY_DELAY,
  })

  const drivers = driversQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []
  const performanceTrend: PerformanceTrend[] = []

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
  }, [driversQuery, assignmentsQuery])

  const isLoading =
    driversQuery.isLoading ||
    assignmentsQuery.isLoading

  const isError =
    driversQuery.isError ||
    assignmentsQuery.isError

  const error =
    driversQuery.error ||
    assignmentsQuery.error

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
