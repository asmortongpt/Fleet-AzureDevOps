/**
 * useReactiveSafetyComplianceData - Real-time safety & compliance data with React Query
 * Auto-refreshes every 10 seconds for live dashboard updates
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface SafetyIncident {
  id: string
  vehicleId: string
  driverId: string
  type: 'collision' | 'near_miss' | 'property_damage' | 'injury' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  description: string
  reportedDate: string
  investigator?: string
}

interface SafetyInspection {
  id: string
  vehicleId: string
  type: 'dot_annual' | 'dot_90day' | 'dvir' | 'osha' | 'facility'
  status: 'pending' | 'scheduled' | 'completed' | 'failed'
  inspector: string
  scheduledDate: string
  completedDate?: string
  findings?: string[]
}

interface Certification {
  id: string
  driverId: string
  type: 'cdl' | 'medical_card' | 'hazmat' | 'safety_training' | 'forklift' | 'other'
  status: 'current' | 'expiring_soon' | 'expired'
  issueDate: string
  expiryDate: string
  certificationNumber: string
}

interface Violation {
  id: string
  vehicleId?: string
  driverId?: string
  type: 'dot' | 'osha' | 'epa' | 'ifta' | 'fmcsa' | 'other'
  severity: 'minor' | 'major' | 'critical'
  status: 'open' | 'appealed' | 'resolved' | 'paid'
  description: string
  fineAmount?: number
  dateIssued: string
}

export function useReactiveSafetyComplianceData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch safety incidents
  const { data: incidents = [], isLoading: incidentsLoading } = useQuery<SafetyIncident[]>({
    queryKey: ['safety-incidents', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/safety/incidents`)
      if (!response.ok) throw new Error('Failed to fetch incidents')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch safety inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery<SafetyInspection[]>({
    queryKey: ['safety-inspections', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/safety/inspections`)
      if (!response.ok) throw new Error('Failed to fetch inspections')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch certifications
  const { data: certifications = [], isLoading: certificationsLoading } = useQuery<Certification[]>({
    queryKey: ['certifications', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/safety/certifications`)
      if (!response.ok) throw new Error('Failed to fetch certifications')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch violations
  const { data: violations = [], isLoading: violationsLoading } = useQuery<Violation[]>({
    queryKey: ['violations', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/safety/violations`)
      if (!response.ok) throw new Error('Failed to fetch violations')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate key safety metrics
  const openIncidents = incidents.filter((i) => i.status === 'open' || i.status === 'investigating')
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical' || i.severity === 'high')

  // Days since last incident
  const sortedIncidents = [...incidents].sort((a, b) =>
    new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()
  )
  const daysSinceLastIncident = sortedIncidents.length > 0
    ? Math.floor((Date.now() - new Date(sortedIncidents[0].reportedDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Compliance rate calculation
  const totalInspections = inspections.length
  const passedInspections = inspections.filter((i) => i.status === 'completed').length
  const complianceRate = totalInspections > 0
    ? Math.round((passedInspections / totalInspections) * 100)
    : 100

  // OSHA compliance (no recordable injuries)
  const recordableInjuries = incidents.filter((i) => i.type === 'injury' && i.severity !== 'low').length
  const oshaCompliance = recordableInjuries === 0 ? 100 : Math.max(0, 100 - (recordableInjuries * 10))

  // Training completion
  const safetyTraining = certifications.filter((c) => c.type === 'safety_training')
  const currentTraining = safetyTraining.filter((c) => c.status === 'current').length
  const trainingCompletion = safetyTraining.length > 0
    ? Math.round((currentTraining / safetyTraining.length) * 100)
    : 0

  // Certifications expiring soon (within 30 days)
  const expiringCertifications = certifications.filter((c) => {
    const daysUntilExpiry = Math.floor(
      (new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  })

  // Expired certifications
  const expiredCertifications = certifications.filter((c) => c.status === 'expired')

  // Active violations
  const activeViolations = violations.filter((v) => v.status === 'open' || v.status === 'appealed')

  // Total fines
  const totalFines = violations.reduce((sum, v) => sum + (v.fineAmount || 0), 0)

  const metrics = {
    totalIncidents: incidents.length,
    openCases: openIncidents.length,
    complianceRate,
    trainingCompletion,
    daysSinceLastIncident,
    oshaCompliance,
    activeViolations: activeViolations.length,
    totalFines,
    criticalIncidents: criticalIncidents.length,
    pendingInspections: inspections.filter((i) => i.status === 'pending' || i.status === 'scheduled').length,
    expiringCertifications: expiringCertifications.length,
    expiredCertifications: expiredCertifications.length,
  }

  // Incident type distribution for charts
  const incidentTypeDistribution = incidents.reduce((acc, incident) => {
    const type = incident.type.replace('_', ' ')
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Incident severity distribution
  const incidentSeverityDistribution = incidents.reduce((acc, incident) => {
    acc[incident.severity] = (acc[incident.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Inspection status distribution
  const inspectionStatusDistribution = inspections.reduce((acc, inspection) => {
    acc[inspection.status] = (acc[inspection.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Violation type distribution
  const violationTypeDistribution = violations.reduce((acc, violation) => {
    acc[violation.type.toUpperCase()] = (acc[violation.type.toUpperCase()] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Certification status distribution
  const certificationStatusDistribution = certifications.reduce((acc, cert) => {
    acc[cert.status] = (acc[cert.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Incident trend data (last 7 days)
  const incidentTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayIncidents = incidents.filter((inc) => {
      const incDate = new Date(inc.reportedDate)
      return incDate.toDateString() === date.toDateString()
    })
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayIncidents.length,
    }
  })

  return {
    incidents,
    inspections,
    certifications,
    violations,
    metrics,
    openIncidents,
    criticalIncidents,
    expiringCertifications,
    expiredCertifications,
    activeViolations,
    incidentTypeDistribution,
    incidentSeverityDistribution,
    inspectionStatusDistribution,
    violationTypeDistribution,
    certificationStatusDistribution,
    incidentTrendData,
    isLoading: incidentsLoading || inspectionsLoading || certificationsLoading || violationsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
