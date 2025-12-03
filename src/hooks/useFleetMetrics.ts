/**
 * Fleet Metrics Hook
 *
 * Centralized hook for calculating fleet-wide metrics and KPIs.
 * Eliminates duplicate calculation logic in 8+ modules (Dashboard, Analytics, Reports, etc.)
 *
 * Features:
 * - Utilization metrics (%, hours, distance)
 * - Cost metrics (total, per vehicle, per mile, fuel costs)
 * - Maintenance metrics (upcoming, overdue, completion rate)
 * - Compliance metrics (score, violations, certifications)
 * - Efficiency metrics (MPG, CO2, idle time)
 * - All calculations memoized for performance
 *
 * Usage:
 * ```tsx
 * const metrics = useFleetMetrics(vehicles, {
 *   fuelTransactions,
 *   maintenanceRecords,
 *   drivers
 * })
 *
 * <MetricCard title="Utilization" value={`${metrics.utilization.percentage}%`} />
 * <MetricCard title="Total Costs" value={`$${metrics.costs.total.toLocaleString()}`} />
 * ```
 */

import { useMemo } from 'react'

interface Vehicle {
  id: string
  status?: string
  mileage?: number
  hoursUsed?: number
  maintenanceCost?: number
  fuelCost?: number
  totalCost?: number
  make?: string
  model?: string
  year?: number
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  mpg?: number
  type?: string
  fuelType?: string
  co2Emissions?: number
  idleTime?: number
  assignedTo?: string | null
  certifications?: string[]
  violations?: any[]
  [key: string]: any
}

interface FuelTransaction {
  vehicleId?: string
  vehicleNumber?: string
  totalCost?: number
  gallons?: number
  date?: string
  mpg?: number
  pricePerGallon?: number
  [key: string]: any
}

interface MaintenanceRecord {
  vehicleId?: string
  vehicleNumber?: string
  status?: string
  nextDue?: string
  lastCompleted?: string
  cost?: number
  estimatedCost?: number
  priority?: string
  [key: string]: any
}

interface Driver {
  id: string
  certifications?: string[]
  certificateExpiry?: string
  violations?: any[]
  [key: string]: any
}

interface FleetMetricsOptions {
  fuelTransactions?: FuelTransaction[]
  maintenanceRecords?: MaintenanceRecord[]
  workOrders?: any[]
  drivers?: Driver[]
  dateRange?: { start: Date; end: Date }
}

export interface UtilizationMetrics {
  percentage: number
  totalVehicles: number
  activeVehicles: number
  inactiveVehicles: number
  utilizationRate: number
  totalHours: number
  totalMiles: number
  avgHoursPerVehicle: number
  avgMilesPerVehicle: number
}

export interface CostMetrics {
  total: number
  perVehicle: number
  perMile: number
  fuel: number
  maintenance: number
  other: number
  monthlyAvg: number
  yearlyProjection: number
  costByType: Record<string, number>
}

export interface MaintenanceMetrics {
  upcoming: number
  overdue: number
  completed: number
  inProgress: number
  totalScheduled: number
  completionRate: number
  avgCost: number
  totalCost: number
  criticalCount: number
}

export interface ComplianceMetrics {
  score: number
  violations: number
  certificationsValid: number
  certificationsExpired: number
  certificationsExpiringSoon: number
  inspectionsDue: number
  inspectionsPassed: number
  overallCompliance: number
}

export interface EfficiencyMetrics {
  avgMPG: number
  totalFuelConsumed: number
  totalCO2Emissions: number
  avgIdleTime: number
  fuelEfficiencyTrend: number
  costPerMile: number
  electricVehicles: number
  hybridVehicles: number
  gasVehicles: number
}

export interface FleetMetrics {
  utilization: UtilizationMetrics
  costs: CostMetrics
  maintenance: MaintenanceMetrics
  compliance: ComplianceMetrics
  efficiency: EfficiencyMetrics
}

export function useFleetMetrics(
  vehicles: Vehicle[] = [],
  options: FleetMetricsOptions = {}
): FleetMetrics {
  const {
    fuelTransactions = [],
    maintenanceRecords = [],
    drivers = [],
    dateRange
  } = options

  /**
   * Calculate utilization metrics
   */
  const utilization = useMemo<UtilizationMetrics>(() => {
    const totalVehicles = vehicles.length
    const activeVehicles = vehicles.filter(
      (v) => v.status?.toLowerCase() === 'active'
    ).length
    const inactiveVehicles = totalVehicles - activeVehicles

    const totalHours = vehicles.reduce((sum, v) => sum + (v.hoursUsed || 0), 0)
    const totalMiles = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0)

    // Assume 8760 hours per year (24 * 365) for utilization calculation
    const availableHours = totalVehicles * 8760
    const utilizationRate = availableHours > 0 ? (totalHours / availableHours) * 100 : 0

    return {
      percentage: Math.round(utilizationRate * 10) / 10,
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      totalHours: Math.round(totalHours),
      totalMiles: Math.round(totalMiles),
      avgHoursPerVehicle: totalVehicles > 0 ? Math.round(totalHours / totalVehicles) : 0,
      avgMilesPerVehicle: totalVehicles > 0 ? Math.round(totalMiles / totalVehicles) : 0
    }
  }, [vehicles])

  /**
   * Calculate cost metrics
   */
  const costs = useMemo<CostMetrics>(() => {
    // Sum all costs from vehicles
    const maintenanceCostFromVehicles = vehicles.reduce(
      (sum, v) => sum + (v.maintenanceCost || 0),
      0
    )
    const fuelCostFromVehicles = vehicles.reduce((sum, v) => sum + (v.fuelCost || 0), 0)

    // Sum costs from transactions
    const fuelCostFromTransactions = fuelTransactions.reduce(
      (sum, t) => sum + (t.totalCost || 0),
      0
    )
    const maintenanceCostFromRecords = maintenanceRecords.reduce(
      (sum, m) => sum + (m.cost || m.estimatedCost || 0),
      0
    )

    // Use higher of vehicle-reported or transaction-based costs
    const fuel = Math.max(fuelCostFromVehicles, fuelCostFromTransactions)
    const maintenance = Math.max(maintenanceCostFromVehicles, maintenanceCostFromRecords)

    const total = fuel + maintenance
    const perVehicle = vehicles.length > 0 ? total / vehicles.length : 0
    const totalMiles = utilization.totalMiles
    const perMile = totalMiles > 0 ? total / totalMiles : 0

    // Calculate costs by vehicle type
    const costByType: Record<string, number> = {}
    vehicles.forEach((v) => {
      const type = v.type || v.fuelType || 'Unknown'
      const vehicleCost = (v.maintenanceCost || 0) + (v.fuelCost || 0) + (v.totalCost || 0)
      costByType[type] = (costByType[type] || 0) + vehicleCost
    })

    // Estimate monthly and yearly based on available data
    const monthlyAvg = total / 12 // Simplified - assumes annual data
    const yearlyProjection = total

    return {
      total: Math.round(total * 100) / 100,
      perVehicle: Math.round(perVehicle * 100) / 100,
      perMile: Math.round(perMile * 100) / 100,
      fuel: Math.round(fuel * 100) / 100,
      maintenance: Math.round(maintenance * 100) / 100,
      other: 0,
      monthlyAvg: Math.round(monthlyAvg * 100) / 100,
      yearlyProjection: Math.round(yearlyProjection * 100) / 100,
      costByType
    }
  }, [vehicles, fuelTransactions, maintenanceRecords, utilization.totalMiles])

  /**
   * Calculate maintenance metrics
   */
  const maintenance = useMemo<MaintenanceMetrics>(() => {
    const now = new Date()

    const upcoming = maintenanceRecords.filter((m) => {
      if (!m.nextDue) return false
      const dueDate = new Date(m.nextDue)
      return dueDate > now && m.status !== 'completed'
    }).length

    const overdue = maintenanceRecords.filter((m) => {
      if (!m.nextDue) return false
      const dueDate = new Date(m.nextDue)
      return dueDate <= now && m.status !== 'completed'
    }).length

    const completed = maintenanceRecords.filter(
      (m) => m.status?.toLowerCase() === 'completed'
    ).length

    const inProgress = maintenanceRecords.filter(
      (m) => m.status?.toLowerCase() === 'in_progress' || m.status?.toLowerCase() === 'in progress'
    ).length

    const totalScheduled = maintenanceRecords.length
    const completionRate =
      totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0

    const totalCost = maintenanceRecords.reduce(
      (sum, m) => sum + (m.cost || m.estimatedCost || 0),
      0
    )
    const avgCost = totalScheduled > 0 ? totalCost / totalScheduled : 0

    const criticalCount = maintenanceRecords.filter(
      (m) =>
        m.priority?.toLowerCase() === 'urgent' || m.priority?.toLowerCase() === 'high'
    ).length

    return {
      upcoming,
      overdue,
      completed,
      inProgress,
      totalScheduled,
      completionRate: Math.round(completionRate * 10) / 10,
      avgCost: Math.round(avgCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      criticalCount
    }
  }, [maintenanceRecords])

  /**
   * Calculate compliance metrics
   */
  const compliance = useMemo<ComplianceMetrics>(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    let certificationsValid = 0
    let certificationsExpired = 0
    let certificationsExpiringSoon = 0

    // Check driver certifications
    drivers.forEach((driver) => {
      if (driver.certificateExpiry) {
        const expiryDate = new Date(driver.certificateExpiry)
        if (expiryDate < now) {
          certificationsExpired++
        } else if (expiryDate <= thirtyDaysFromNow) {
          certificationsExpiringSoon++
        } else {
          certificationsValid++
        }
      }
    })

    // Count violations
    const violations = vehicles.reduce((sum, v) => {
      return sum + (Array.isArray(v.violations) ? v.violations.length : 0)
    }, 0) + drivers.reduce((sum, d) => {
      return sum + (Array.isArray(d.violations) ? d.violations.length : 0)
    }, 0)

    // Count inspections
    const inspectionsDue = vehicles.filter((v) => {
      if (!v.nextMaintenanceDate) return false
      return new Date(v.nextMaintenanceDate) <= now
    }).length

    const inspectionsPassed = vehicles.filter((v) => {
      return v.status?.toLowerCase() === 'active' && !v.violations?.length
    }).length

    // Calculate overall compliance score (0-100)
    const totalCertifications = certificationsValid + certificationsExpired + certificationsExpiringSoon
    const certificationScore = totalCertifications > 0
      ? (certificationsValid / totalCertifications) * 100
      : 100

    const violationPenalty = Math.min(violations * 5, 50) // Max 50 point penalty
    const inspectionScore = vehicles.length > 0
      ? (inspectionsPassed / vehicles.length) * 100
      : 100

    const overallCompliance = Math.max(
      0,
      Math.min(100, (certificationScore + inspectionScore) / 2 - violationPenalty)
    )

    return {
      score: Math.round(overallCompliance * 10) / 10,
      violations,
      certificationsValid,
      certificationsExpired,
      certificationsExpiringSoon,
      inspectionsDue,
      inspectionsPassed,
      overallCompliance: Math.round(overallCompliance * 10) / 10
    }
  }, [vehicles, drivers])

  /**
   * Calculate efficiency metrics
   */
  const efficiency = useMemo<EfficiencyMetrics>(() => {
    const totalFuelConsumed = fuelTransactions.reduce(
      (sum, t) => sum + (t.gallons || 0),
      0
    )

    const avgMPG = vehicles.reduce((sum, v) => sum + (v.mpg || 0), 0) / (vehicles.length || 1)

    const totalCO2Emissions = vehicles.reduce(
      (sum, v) => sum + (v.co2Emissions || 0),
      0
    )

    const avgIdleTime = vehicles.reduce((sum, v) => sum + (v.idleTime || 0), 0) / (vehicles.length || 1)

    const electricVehicles = vehicles.filter(
      (v) => (v.type || v.fuelType || '').toLowerCase().includes('electric')
    ).length

    const hybridVehicles = vehicles.filter(
      (v) => (v.type || v.fuelType || '').toLowerCase().includes('hybrid')
    ).length

    const gasVehicles = vehicles.filter(
      (v) => (v.type || v.fuelType || '').toLowerCase().includes('gas')
    ).length

    // Calculate fuel efficiency trend (simplified - would need historical data)
    const fuelEfficiencyTrend = 0 // Placeholder

    const costPerMile = costs.perMile

    return {
      avgMPG: Math.round(avgMPG * 10) / 10,
      totalFuelConsumed: Math.round(totalFuelConsumed * 10) / 10,
      totalCO2Emissions: Math.round(totalCO2Emissions * 10) / 10,
      avgIdleTime: Math.round(avgIdleTime * 10) / 10,
      fuelEfficiencyTrend,
      costPerMile: Math.round(costPerMile * 100) / 100,
      electricVehicles,
      hybridVehicles,
      gasVehicles
    }
  }, [vehicles, fuelTransactions, costs.perMile])

  return {
    utilization,
    costs,
    maintenance,
    compliance,
    efficiency
  }
}
