/**
 * useReactiveSafetyData - Enterprise-grade real-time safety metrics hook
 *
 * Features:
 * - Type-safe API responses with Zod validation
 * - FMCSA/DOT compliance metrics integration
 * - Real-time WebSocket updates for critical safety events
 * - Robust error handling with retry logic
 * - Optimized React Query usage with proper caching
 * - Memory leak prevention with abort controllers
 * - Comprehensive data sanitization
 * - Performance optimized with memoization
 *
 * @security Validates all API responses, sanitizes data, prevents XSS
 * @performance Uses React Query deduplication, caching, and intelligent refetching
 * @compliance FMCSA, DOT, OSHA standards integrated
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { z } from 'zod'
<<<<<<< HEAD
import DOMPurify from 'dompurify'
import logger from '@/utils/logger';
=======
>>>>>>> fix/pipeline-eslint-build

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

// Zod schemas for runtime validation - FMCSA/DOT compliant
const SafetyScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  speeding: z.number().min(0).max(100),
  harshBraking: z.number().min(0).max(100),
  harshAcceleration: z.number().min(0).max(100),
  distraction: z.number().min(0).max(100),
  fatigue: z.number().min(0).max(100),
  seatbelt: z.number().min(0).max(100),
  calculatedAt: z.string().datetime(),
})

const SafetyAlertSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['critical', 'warning', 'info']),
  title: z.string().transform(str => DOMPurify.sanitize(str)),
  description: z.string().transform(str => DOMPurify.sanitize(str)),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  status: z.enum(['active', 'acknowledged', 'resolved']),
  severity: z.number().min(1).max(10),
})

const DriverSafetySchema = z.object({
  driverId: z.string().uuid(),
  driverName: z.string().transform(str => DOMPurify.sanitize(str)),
  cdlNumber: z.string().optional(),
  safetyScore: SafetyScoreSchema,
  totalMiles: z.number().min(0),
  totalHours: z.number().min(0),
  violationCount: z.number().int().min(0),
  incidentCount: z.number().int().min(0),
  lastIncidentDate: z.string().datetime().nullable(),
  trainingStatus: z.enum(['current', 'expiring', 'expired']),
  trainingCompliance: z.number().min(0).max(100),
  dotCompliant: z.boolean(),
  fmcsaScore: z.number().min(0).max(1000).optional(),
  hosViolations: z.number().int().min(0),
  harshBrakingEvents: z.number().int().min(0),
  speedingEvents: z.number().int().min(0),
  distractedDrivingEvents: z.number().int().min(0),
})

const VehicleSafetySchema = z.object({
  vehicleId: z.string().uuid(),
  vehicleName: z.string().transform(str => DOMPurify.sanitize(str)),
  licensePlate: z.string().transform(str => DOMPurify.sanitize(str)),
  inspectionStatus: z.enum(['current', 'due_soon', 'overdue', 'out_of_service']),
  safetyRating: z.number().min(0).max(100),
  lastInspectionDate: z.string().datetime(),
  nextInspectionDate: z.string().datetime(),
  safetyEquipmentStatus: z.enum(['compliant', 'needs_attention', 'critical']),
  maintenanceScore: z.number().min(0).max(100),
  defectsCount: z.number().int().min(0),
  criticalDefects: z.number().int().min(0),
  activeRecalls: z.number().int().min(0),
  defectReports: z.number().int().min(0),
  crashHistory30Days: z.number().int().min(0),
  crashHistory12Months: z.number().int().min(0),
  crashDetectionEnabled: z.boolean(),
  dotCompliant: z.boolean(),
})

const TrainingRecordSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  driverName: z.string().transform(str => DOMPurify.sanitize(str)),
  programName: z.string().transform(str => DOMPurify.sanitize(str)),
  category: z.enum(['defensive_driving', 'hazmat', 'winter_driving', 'distraction', 'fatigue', 'vehicle_inspection', 'emergency_response', 'safety_protocols']),
  required: z.boolean(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'overdue']),
  scheduledDate: z.string().datetime(),
  completionDate: z.string().datetime().nullable(),
  expiryDate: z.string().datetime().nullable(),
  certificationNumber: z.string().optional(),
  averageScore: z.number().min(0).max(100).nullable(),
})

const IncidentReportSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['collision', 'accident', 'near_miss', 'violation', 'injury', 'property_damage', 'hos_violation', 'hazard', 'equipment_failure']),
  severity: z.enum(['minor', 'moderate', 'major', 'severe', 'critical']),
  date: z.string().datetime(),
  vehicleId: z.string().uuid().nullable(),
  driverId: z.string().uuid().nullable(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional().transform(str => str ? DOMPurify.sanitize(str) : undefined),
  }),
  description: z.string().transform(str => DOMPurify.sanitize(str)),
  rootCause: z.string().optional().transform(str => str ? DOMPurify.sanitize(str) : undefined),
  preventable: z.boolean(),
  oshaRecordable: z.boolean(),
  dotReportable: z.boolean(),
  status: z.enum(['reported', 'investigating', 'resolved', 'closed']),
  injuries: z.number().int().min(0),
  damageEstimate: z.number().min(0).optional(),
})

const BehaviorEventSchema = z.object({
  timestamp: z.string().datetime(),
  type: z.enum(['harsh_brake', 'harsh_accel', 'harsh_turn', 'speeding', 'distraction', 'tailgating']),
  severity: z.number().min(1).max(5),
  speed: z.number().min(0).max(200),
  gForce: z.number().min(0).max(10).optional(),
  duration: z.number().min(0).optional(),
})

const SpeedViolationSchema = z.object({
  timestamp: z.string().datetime(),
  speed: z.number().min(0).max(200),
  speedLimit: z.number().min(0).max(100),
  excess: z.number().min(0),
  duration: z.number().min(0),
  location: z.string().optional().transform(str => str ? DOMPurify.sanitize(str) : undefined),
})

// TypeScript types derived from schemas
export type SafetyScore = z.infer<typeof SafetyScoreSchema>
export type SafetyAlert = z.infer<typeof SafetyAlertSchema>
export type DriverSafety = z.infer<typeof DriverSafetySchema>
export type VehicleSafety = z.infer<typeof VehicleSafetySchema>
export type TrainingRecord = z.infer<typeof TrainingRecordSchema>
export type IncidentReport = z.infer<typeof IncidentReportSchema>
export type BehaviorEvent = z.infer<typeof BehaviorEventSchema>
export type SpeedViolation = z.infer<typeof SpeedViolationSchema>

// Custom error class for safety data operations
class SafetyDataError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'SafetyDataError'
  }
}

export function useReactiveSafetyData(options?: {
  refreshInterval?: number
  filters?: {
    startDate?: string
    endDate?: string
    driverIds?: string[]
    vehicleIds?: string[]
  }
}) {
  const queryClient = useQueryClient()
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeUpdates, setRealtimeUpdates] = useState<{
    type: 'incident' | 'violation' | 'score_update'
    data: unknown
    timestamp: string
  }[]>([])

  // Fetch safety alerts with validation
  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery<SafetyAlert[]>({
    queryKey: ['safety-alerts', realTimeUpdate, options?.filters],
    queryFn: async ({ signal }) => {
      try {
        const queryParams = new URLSearchParams()
        if (options?.filters?.startDate) queryParams.append('startDate', options.filters.startDate)
        if (options?.filters?.endDate) queryParams.append('endDate', options.filters.endDate)

        const response = await fetch(`${API_BASE}/safety-alerts?${queryParams}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        })
        if (!response.ok) throw new SafetyDataError('Failed to fetch safety alerts', `HTTP_${response.status}`)
        const data = await response.json()
        return z.array(SafetyAlertSchema).parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new SafetyDataError('Invalid safety alert data format', 'VALIDATION_ERROR', error.errors)
        }
        throw error
      }
    },
    refetchInterval: options?.refreshInterval || 10000,
    staleTime: 5000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Fetch driver safety data with validation
  const { data: driverSafety = [], isLoading: driverSafetyLoading } = useQuery<DriverSafety[]>({
    queryKey: ['driver-safety', realTimeUpdate, options?.filters],
    queryFn: async ({ signal }) => {
      try {
        const queryParams = new URLSearchParams()
        if (options?.filters?.driverIds) queryParams.append('driverIds', options.filters.driverIds.join(','))

        const response = await fetch(`${API_BASE}/driver-safety?${queryParams}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        })
        if (!response.ok) throw new SafetyDataError('Failed to fetch driver safety', `HTTP_${response.status}`)
        const data = await response.json()
        return z.array(DriverSafetySchema).parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new SafetyDataError('Invalid driver safety data format', 'VALIDATION_ERROR', error.errors)
        }
        throw error
      }
    },
    refetchInterval: options?.refreshInterval || 10000,
    staleTime: 5000,
    retry: 3,
  })

  // Fetch vehicle safety data with validation
  const { data: vehicleSafety = [], isLoading: vehicleSafetyLoading } = useQuery<VehicleSafety[]>({
    queryKey: ['vehicle-safety', realTimeUpdate, options?.filters],
    queryFn: async ({ signal }) => {
      try {
        const queryParams = new URLSearchParams()
        if (options?.filters?.vehicleIds) queryParams.append('vehicleIds', options.filters.vehicleIds.join(','))

        const response = await fetch(`${API_BASE}/vehicle-safety?${queryParams}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        })
        if (!response.ok) throw new SafetyDataError('Failed to fetch vehicle safety', `HTTP_${response.status}`)
        const data = await response.json()
        return z.array(VehicleSafetySchema).parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new SafetyDataError('Invalid vehicle safety data format', 'VALIDATION_ERROR', error.errors)
        }
        throw error
      }
    },
    refetchInterval: options?.refreshInterval || 10000,
    staleTime: 5000,
    retry: 3,
  })

  // Fetch training records with validation
  const { data: trainingRecords = [], isLoading: trainingLoading } = useQuery<TrainingRecord[]>({
    queryKey: ['training-records', realTimeUpdate, options?.filters],
    queryFn: async ({ signal }) => {
      try {
        const response = await fetch(`${API_BASE}/training-records`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        })
        if (!response.ok) throw new SafetyDataError('Failed to fetch training records', `HTTP_${response.status}`)
        const data = await response.json()
        return z.array(TrainingRecordSchema).parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new SafetyDataError('Invalid training record data format', 'VALIDATION_ERROR', error.errors)
        }
        throw error
      }
    },
    refetchInterval: options?.refreshInterval || 10000,
    staleTime: 5000,
    retry: 3,
  })

  // Fetch incident reports with validation
  const { data: incidents = [], isLoading: incidentsLoading } = useQuery<IncidentReport[]>({
    queryKey: ['safety-incidents', realTimeUpdate, options?.filters],
    queryFn: async ({ signal }) => {
      try {
        const queryParams = new URLSearchParams()
        if (options?.filters?.startDate) queryParams.append('startDate', options.filters.startDate)
        if (options?.filters?.endDate) queryParams.append('endDate', options.filters.endDate)

        const response = await fetch(`${API_BASE}/safety-incidents?${queryParams}`, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'include',
        })
        if (!response.ok) throw new SafetyDataError('Failed to fetch incidents', `HTTP_${response.status}`)
        const data = await response.json()
        return z.array(IncidentReportSchema).parse(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new SafetyDataError('Invalid incident report data format', 'VALIDATION_ERROR', error.errors)
        }
        throw error
      }
    },
    refetchInterval: options?.refreshInterval || 10000,
    staleTime: 5000,
    retry: 3,
  })

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        ws = new WebSocket(`${WS_BASE}/safety-events`)

        ws.onopen = () => {
          setIsConnected(true)
          logger.info('[SafetyData] WebSocket connected')
        }

        ws.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data)
            setRealtimeUpdates(prev => [...prev.slice(-19), {
              type: update.type,
              data: update.data,
              timestamp: new Date().toISOString(),
            }])

            // Invalidate relevant queries based on update type
            if (update.type === 'incident' || update.type === 'violation') {
              queryClient.invalidateQueries({ queryKey: ['safety-incidents'] })
              queryClient.invalidateQueries({ queryKey: ['safety-alerts'] })
            }
            if (update.type === 'score_update') {
              queryClient.invalidateQueries({ queryKey: ['driver-safety'] })
            }
          } catch (error) {
            logger.error('[SafetyData] Failed to parse WebSocket message:', error)
          }
        }

        ws.onclose = () => {
          setIsConnected(false)
          logger.info('[SafetyData] WebSocket disconnected, reconnecting...')
          reconnectTimeout = setTimeout(connect, 5000)
        }

        ws.onerror = (error) => {
          logger.error('[SafetyData] WebSocket error:', error)
        }
      } catch (error) {
        logger.error('[SafetyData] Failed to establish WebSocket connection:', error)
        reconnectTimeout = setTimeout(connect, 10000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.close()
      }
    }
  }, [queryClient])

  // Mutation for updating safety training completion
  const updateTrainingMutation = useMutation({
    mutationFn: async ({ moduleId, driverId }: { moduleId: string; driverId: string }) => {
      const response = await fetch(`${API_BASE}/safety/training/${moduleId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ driverId }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to update training status')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] })
    },
  })

  // Calculate enhanced safety metrics with memoization
  const metrics = useMemo(() => {
    const safetyScore = driverSafety.length > 0
      ? Math.round(
          driverSafety.reduce((sum, d) => sum + d.safetyScore.overall, 0) / driverSafety.length
        )
      : 0

    const activeAlerts = alerts.filter((a) => a.status === 'active').length
    const criticalAlerts = alerts.filter((a) => a.type === 'critical' && a.status === 'active').length

    const trainingCompliance = trainingRecords.length > 0
      ? Math.round((trainingRecords.filter((t) => t.status === 'completed').length / trainingRecords.length) * 100)
      : 0

    const incidentRate = incidents.length > 0
      ? incidents.filter((i) => {
          const incidentDate = new Date(i.date)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return incidentDate >= thirtyDaysAgo
        }).length
      : 0

    // Calculate FMCSA compliance scores
    const fmcsaBasicScores = {
      unsafeDriving: calculateFMCSAScore(driverSafety, 'speeding'),
      hoursOfService: calculateFMCSAScore(driverSafety, 'hos'),
      driverFitness: calculateFMCSAScore(driverSafety, 'training'),
      vehicleMaintenance: calculateVehicleMaintenanceScore(vehicleSafety),
      crashIndicator: calculateCrashIndicator(incidents),
    }

    const dotCompliance = Math.round(
      (driverSafety.filter(d => d.dotCompliant).length / Math.max(driverSafety.length, 1)) * 100
    )

    const oshaIncidentRate = calculateOSHAIncidentRate(incidents, driverSafety.length)

    return {
      safetyScore,
      activeAlerts,
      criticalAlerts,
      trainingCompliance,
      incidentRate,
      totalIncidents: incidents.length,
      openIncidents: incidents.filter((i) => i.status !== 'closed').length,
      daysIncidentFree: calculateDaysIncidentFree(incidents),
      totalViolations: driverSafety.reduce((sum, d) => sum + d.violationCount, 0),
      fmcsaBasicScores,
      dotCompliance,
      oshaIncidentRate,
      criticalVehicles: vehicleSafety.filter(v => v.inspectionStatus === 'out_of_service').length,
      highRiskDrivers: driverSafety.filter(d => d.safetyScore.overall < 70).length,
      preventableIncidents: incidents.filter(i => i.preventable).length,
    }
  }, [alerts, driverSafety, vehicleSafety, trainingRecords, incidents])

  // Alert distribution by type
  const alertsByType = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Driver safety score ranges
  const driverSafetyRanges = {
    excellent: driverSafety.filter((d) => d.safetyScore >= 90).length,
    good: driverSafety.filter((d) => d.safetyScore >= 75 && d.safetyScore < 90).length,
    fair: driverSafety.filter((d) => d.safetyScore >= 60 && d.safetyScore < 75).length,
    poor: driverSafety.filter((d) => d.safetyScore < 60).length,
  }

  // Incident trend data (last 7 days)
  const incidentTrendData = generateIncidentTrend(incidents)

  // Training completion by category
  const trainingByCategory = trainingRecords.reduce((acc, record) => {
    if (!acc[record.category]) {
      acc[record.category] = { total: 0, completed: 0 }
    }
    acc[record.category].total++
    if (record.status === 'completed') {
      acc[record.category].completed++
    }
    return acc
  }, {} as Record<string, { total: number; completed: number }>)

  const trainingCategoryData = Object.entries(trainingByCategory).map(([category, data]) => ({
    name: formatCategoryName(category),
    completion: Math.round((data.completed / data.total) * 100),
    total: data.total,
  }))

  // Vehicle safety compliance
  const vehicleSafetyCompliance = vehicleSafety.filter(
    (v) => v.safetyEquipmentStatus === 'compliant'
  ).length

  // Top safety risks (drivers with violations)
  const topRiskDrivers = driverSafety
    .filter((d) => d.violationCount > 0 || d.incidentCount > 0)
    .sort((a, b) => (b.violationCount + b.incidentCount * 2) - (a.violationCount + a.incidentCount * 2))
    .slice(0, 10)

  // Vehicles needing safety attention
  const vehiclesNeedingAttention = vehicleSafety.filter(
    (v) => v.safetyEquipmentStatus !== 'compliant' || v.activeRecalls > 0 || v.defectReports > 0
  )

  // Overdue training
  const overdueTraining = trainingRecords.filter((t) => t.status === 'overdue')

  // Critical active alerts
  const criticalActiveAlerts = alerts
    .filter((a) => a.type === 'critical' && a.status === 'active')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Refresh function
  const refresh = useCallback(() => {
    setRealTimeUpdate((prev) => prev + 1)
    queryClient.invalidateQueries({ queryKey: ['safety-alerts'] })
    queryClient.invalidateQueries({ queryKey: ['driver-safety'] })
    queryClient.invalidateQueries({ queryKey: ['vehicle-safety'] })
    queryClient.invalidateQueries({ queryKey: ['training-records'] })
    queryClient.invalidateQueries({ queryKey: ['safety-incidents'] })
  }, [queryClient])

  return {
    // Core data
    alerts,
    driverSafety,
    vehicleSafety,
    trainingRecords,
    incidents,

    // Metrics
    metrics,
    alertsByType,
    driverSafetyRanges,
    incidentTrendData,
    trainingCategoryData,
    vehicleSafetyCompliance,
    topRiskDrivers,
    vehiclesNeedingAttention,
    overdueTraining,
    criticalActiveAlerts,

    // Real-time updates
    realtimeUpdates,
    isConnected,

    // Status
    isLoading: alertsLoading || driverSafetyLoading || vehicleSafetyLoading || trainingLoading || incidentsLoading,
    isError: alertsError,
    lastUpdate: new Date(),

    // Actions
    refresh,
    updateTraining: updateTrainingMutation.mutate,
  }
}

// Helper functions
function calculateDaysIncidentFree(incidents: IncidentReport[]): number {
  if (incidents.length === 0) return 0

  const sortedIncidents = [...incidents]
    .filter((i) => i.type === 'accident')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedIncidents.length === 0) return 365 // No accidents in records

  const lastIncident = new Date(sortedIncidents[0].date)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - lastIncident.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

function generateIncidentTrend(incidents: IncidentReport[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      name: days[date.getDay()],
      date: date.toISOString().split('T')[0],
      accidents: 0,
      nearMisses: 0,
      hazards: 0,
    }
  })

  incidents.forEach((incident) => {
    const incidentDate = incident.date.split('T')[0]
    const dayData = last7Days.find((d) => d.date === incidentDate)
    if (dayData) {
      if (incident.type === 'accident') dayData.accidents++
      else if (incident.type === 'near_miss') dayData.nearMisses++
      else if (incident.type === 'hazard') dayData.hazards++
    }
  })

  return last7Days.map(({ name, accidents, nearMisses, hazards }) => ({
    name,
    accidents,
    nearMisses,
    hazards,
    total: accidents + nearMisses + hazards,
  }))
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// FMCSA compliance calculation functions
function calculateFMCSAScore(drivers: DriverSafety[], metric: 'speeding' | 'hos' | 'training'): number {
  if (drivers.length === 0) return 100

  switch (metric) {
    case 'speeding':
      const speedingScore = drivers.reduce((sum, d) => sum + d.safetyScore.speeding, 0) / drivers.length
      return Math.round(speedingScore)

    case 'hos':
      const hosViolations = drivers.reduce((sum, d) => sum + d.hosViolations, 0)
      const maxViolations = drivers.length * 5 // Threshold for worst score
      return Math.round(Math.max(0, 100 - (hosViolations / maxViolations) * 100))

    case 'training':
      const compliantDrivers = drivers.filter(d => d.trainingCompliance >= 90).length
      return Math.round((compliantDrivers / drivers.length) * 100)

    default:
      return 100
  }
}

function calculateVehicleMaintenanceScore(vehicles: VehicleSafety[]): number {
  if (vehicles.length === 0) return 100

  const compliantVehicles = vehicles.filter(v =>
    v.inspectionStatus === 'current' &&
    v.defectsCount === 0 &&
    v.activeRecalls === 0
  ).length

  return Math.round((compliantVehicles / vehicles.length) * 100)
}

function calculateCrashIndicator(incidents: IncidentReport[]): number {
  const recentCrashes = incidents.filter(i => {
    const date = new Date(i.date)
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    return i.type === 'collision' && date >= yearAgo
  }).length

  // Lower is better for crash indicator
  if (recentCrashes === 0) return 100
  if (recentCrashes <= 2) return 80
  if (recentCrashes <= 5) return 60
  if (recentCrashes <= 10) return 40
  return 20
}

function calculateOSHAIncidentRate(incidents: IncidentReport[], employeeCount: number): number {
  if (employeeCount === 0) return 0

  const oshaRecordable = incidents.filter(i => i.oshaRecordable).length
  const hoursWorked = employeeCount * 2000 // Assuming 2000 hours per year per employee

  // OSHA incident rate = (Number of injuries × 200,000) / Employee hours worked
  return Number(((oshaRecordable * 200000) / hoursWorked).toFixed(2))
}

// Export utility functions for component use
export function getSafetyScoreColor(score: number): string {
  if (score >= 90) return '#22c55e' // green
  if (score >= 70) return '#eab308' // yellow
  return '#ef4444' // red
}

export function getSeverityColor(severity: 'minor' | 'moderate' | 'major' | 'severe' | 'critical'): string {
  const colors = {
    minor: '#3b82f6',    // blue
    moderate: '#eab308', // yellow
    major: '#f97316',    // orange
    severe: '#dc2626',   // red-600
    critical: '#ef4444', // red
  }
  return colors[severity]
}

export function formatComplianceStatus(compliant: boolean): string {
  return compliant ? 'Compliant' : 'Non-Compliant'
}

export function getInspectionStatusColor(status: 'current' | 'due_soon' | 'overdue' | 'out_of_service'): string {
  const colors = {
    current: '#22c55e',       // green
    due_soon: '#eab308',      // yellow
    overdue: '#f97316',       // orange
    out_of_service: '#ef4444' // red
  }
  return colors[status]
}
