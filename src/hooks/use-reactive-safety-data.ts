/**
 * useReactiveSafetyData - Real-time safety data with React Query
 * Auto-refreshes every 10 seconds for live safety monitoring dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface SafetyAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  vehicleId?: string
  driverId?: string
  timestamp: string
  status: 'active' | 'acknowledged' | 'resolved'
  severity: number
}

interface DriverSafety {
  driverId: string
  driverName: string
  safetyScore: number
  violationCount: number
  incidentCount: number
  trainingStatus: 'current' | 'expiring' | 'expired'
  lastIncidentDate?: string
  harshBrakingEvents: number
  speedingEvents: number
  distractedDrivingEvents: number
}

interface VehicleSafety {
  vehicleId: string
  vehicleName: string
  licensePlate: string
  safetyRating: number
  lastInspectionDate: string
  nextInspectionDate: string
  safetyEquipmentStatus: 'compliant' | 'needs_attention' | 'critical'
  activeRecalls: number
  defectReports: number
  crashDetectionEnabled: boolean
}

interface TrainingRecord {
  id: string
  driverId: string
  driverName: string
  programName: string
  category: 'defensive_driving' | 'hazmat' | 'emergency_response' | 'safety_protocols'
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
  scheduledDate: string
  completionDate?: string
  expiryDate?: string
  certificationNumber?: string
}

interface IncidentReport {
  id: string
  type: 'accident' | 'near_miss' | 'hazard' | 'equipment_failure'
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  vehicleId?: string
  driverId?: string
  date: string
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  injuries: number
  damageEstimate?: number
}

export function useReactiveSafetyData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch safety alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<SafetyAlert[]>({
    queryKey: ['safety-alerts', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/safety-alerts`)
      if (!response.ok) throw new Error('Failed to fetch safety alerts')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch driver safety data
  const { data: driverSafety = [], isLoading: driverSafetyLoading } = useQuery<DriverSafety[]>({
    queryKey: ['driver-safety', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/driver-safety`)
      if (!response.ok) throw new Error('Failed to fetch driver safety')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch vehicle safety data
  const { data: vehicleSafety = [], isLoading: vehicleSafetyLoading } = useQuery<VehicleSafety[]>({
    queryKey: ['vehicle-safety', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/vehicle-safety`)
      if (!response.ok) throw new Error('Failed to fetch vehicle safety')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch training records
  const { data: trainingRecords = [], isLoading: trainingLoading } = useQuery<TrainingRecord[]>({
    queryKey: ['training-records', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/training-records`)
      if (!response.ok) throw new Error('Failed to fetch training records')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch incident reports
  const { data: incidents = [], isLoading: incidentsLoading } = useQuery<IncidentReport[]>({
    queryKey: ['safety-incidents', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/safety-incidents`)
      if (!response.ok) throw new Error('Failed to fetch incidents')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate safety metrics
  const safetyScore = driverSafety.length > 0
    ? Math.round(driverSafety.reduce((sum, d) => sum + d.safetyScore, 0) / driverSafety.length)
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

  const metrics = {
    safetyScore,
    activeAlerts,
    criticalAlerts,
    trainingCompliance,
    incidentRate,
    totalIncidents: incidents.length,
    openIncidents: incidents.filter((i) => i.status !== 'closed').length,
    daysIncidentFree: calculateDaysIncidentFree(incidents),
    totalViolations: driverSafety.reduce((sum, d) => sum + d.violationCount, 0),
  }

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

  return {
    alerts,
    driverSafety,
    vehicleSafety,
    trainingRecords,
    incidents,
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
    isLoading: alertsLoading || driverSafetyLoading || vehicleSafetyLoading || trainingLoading || incidentsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
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
