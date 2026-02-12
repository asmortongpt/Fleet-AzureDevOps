/**
 * CostAnalyticsPage - Comprehensive Cost Analytics & Budget Management
 *
 * Features:
 * - Cost-per-mile calculations with IRS mileage rates (2024: $0.67/mile)
 * - Budget vs actual comparisons
 * - TCO (Total Cost of Ownership) analysis
 * - Fuel cost tracking
 * - Maintenance cost breakdown
 * - Department cost allocation
 * - Real-time cost monitoring with API integration
 */

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Car,
  Fuel,
  Wrench,
  Building,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  Filter,
  ArrowUpDown,
  Clock,
  Cog,
  Gauge
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Section } from '@/components/ui/section'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFleetData } from '@/hooks/use-fleet-data'


// IRS Standard Mileage Rates (Updated 2024)
const IRS_RATES = {
  2024: 0.67,  // $0.67 per mile
  2023: 0.655, // $0.655 per mile
  2022: 0.625, // $0.625 per mile
}

const CURRENT_IRS_RATE = IRS_RATES[2024]
const DOWNTIME_COST_PER_HOUR = 50 // Standard downtime cost rate $/hr

interface CostMetric {
  label: string
  value: string
  change: number
  changeLabel: string
  icon: React.ReactNode
  variant: 'success' | 'warning' | 'danger' | 'info'
}

interface CostBreakdown {
  category: string
  amount: number
  budget: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface VehicleCostData {
  vehicleId: string
  vehicleName: string
  totalCost: number
  costPerMile: number
  miles: number
  fuelCost: number
  maintenanceCost: number
  variance: number
  department: string
  healthScore: number | null
  downtimeHours: number
}

interface DepartmentCostData {
  department: string
  vehicleCount: number
  totalCost: number
  avgCostPerVehicle: number
  fuelCost: number
  maintenanceCost: number
}

export default function CostAnalyticsPage() {
  const fleetData = useFleetData()
  const [timeframe, setTimeframe] = useState('month')
  const [department, setDepartment] = useState('all')
  const [sortBy, setSortBy] = useState<'cost' | 'variance' | 'costPerMile'>('cost')

  // Calculate cost metrics from real fleet data
  const costMetrics = useMemo<CostMetric[]>(() => {
    const vehicles = fleetData.vehicles || []
    const fuelTransactions = fleetData.fuelTransactions || []
    const workOrders = fleetData.workOrders || []

    // Calculate total mileage
    const totalMiles = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0)

    // Calculate fuel costs
    const totalFuelCost = fuelTransactions.reduce((sum, t) => {
      return sum + (t.quantity || 0) * (t.pricePerGallon || 0)
    }, 0)

    // Calculate maintenance costs from work orders
    const totalMaintenanceCost = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => sum + (wo.cost || 0), 0)

    // Calculate parts and labor costs from work orders
    const totalPartsCost = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => sum + ((wo as any).parts_cost || 0), 0)

    const totalLaborCost = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => sum + ((wo as any).labor_cost || 0), 0)

    // Total operating cost
    const totalCost = totalFuelCost + totalMaintenanceCost

    // Cost per mile
    const costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const isInRange = (dateValue: string | number | Date | undefined, start: Date, end: Date) => {
      if (!dateValue) return false
      const d = new Date(dateValue)
      return d >= start && d <= end
    }

    const fuelCostCurrent = fuelTransactions.reduce((sum, t) => {
      const dateValue = t.transactionDate || t.created_at || t.date
      if (!isInRange(dateValue, currentMonthStart, now)) return sum
      return sum + (t.quantity || 0) * (t.pricePerGallon || 0)
    }, 0)
    const fuelCostPrevious = fuelTransactions.reduce((sum, t) => {
      const dateValue = t.transactionDate || t.created_at || t.date
      if (!isInRange(dateValue, previousMonthStart, previousMonthEnd)) return sum
      return sum + (t.quantity || 0) * (t.pricePerGallon || 0)
    }, 0)

    const maintenanceCostCurrent = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => {
        const woAny = wo as any
        const dateValue = woAny.actual_end || woAny.actual_end_date || woAny.completed_at || woAny.updated_at || wo.completedDate
        if (!isInRange(dateValue, currentMonthStart, now)) return sum
        return sum + (wo.cost || woAny.total_cost || 0)
      }, 0)
    const maintenanceCostPrevious = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => {
        const woAny = wo as any
        const dateValue = woAny.actual_end || woAny.actual_end_date || woAny.completed_at || woAny.updated_at || wo.completedDate
        if (!isInRange(dateValue, previousMonthStart, previousMonthEnd)) return sum
        return sum + (wo.cost || woAny.total_cost || 0)
      }, 0)

    const monthlyBudget = Number((fleetData as any)?.budget?.monthly || 0)
    const currentSpend = totalCost
    const budgetVariance = monthlyBudget > 0 ? ((currentSpend - monthlyBudget) / monthlyBudget) * 100 : 0

    // IRS standard rate comparison
    const irsStandardCost = totalMiles * CURRENT_IRS_RATE
    const savingsVsIRS = irsStandardCost - currentSpend
    const savingsPercentage = irsStandardCost > 0 ? (savingsVsIRS / irsStandardCost) * 100 : 0

    return [
      {
        label: 'Total Operating Cost',
        value: `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: budgetVariance,
        changeLabel: monthlyBudget > 0
          ? `${Math.abs(budgetVariance).toFixed(1)}% ${budgetVariance > 0 ? 'over' : 'under'} budget`
          : 'Budget unavailable',
        icon: <DollarSign className="w-3 h-3" />,
        variant: monthlyBudget > 0
          ? (budgetVariance > 10 ? 'danger' : budgetVariance > 5 ? 'warning' : 'success')
          : 'warning'
      },
      {
        label: 'Cost Per Mile',
        value: `$${costPerMile.toFixed(3)}`,
        change: savingsPercentage,
        changeLabel: `vs IRS rate ($${CURRENT_IRS_RATE}/mi)`,
        icon: <Car className="w-3 h-3" />,
        variant: costPerMile < CURRENT_IRS_RATE ? 'success' : 'warning'
      },
      {
        label: 'Fuel Costs',
        value: `$${totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: fuelCostPrevious > 0 ? ((fuelCostCurrent - fuelCostPrevious) / fuelCostPrevious) * 100 : 0,
        changeLabel: 'vs last month',
        icon: <Fuel className="w-3 h-3" />,
        variant: fuelCostCurrent <= fuelCostPrevious ? 'success' : 'warning'
      },
      {
        label: 'Maintenance Costs',
        value: `$${totalMaintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: maintenanceCostPrevious > 0 ? ((maintenanceCostCurrent - maintenanceCostPrevious) / maintenanceCostPrevious) * 100 : 0,
        changeLabel: 'vs last month',
        icon: <Wrench className="w-3 h-3" />,
        variant: maintenanceCostCurrent <= maintenanceCostPrevious ? 'success' : 'warning'
      },
      {
        label: 'Parts Cost',
        value: `$${totalPartsCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: totalMaintenanceCost > 0 ? (totalPartsCost / totalMaintenanceCost) * 100 : 0,
        changeLabel: `${totalMaintenanceCost > 0 ? ((totalPartsCost / totalMaintenanceCost) * 100).toFixed(0) : 0}% of maintenance`,
        icon: <Cog className="w-3 h-3" />,
        variant: 'info'
      },
      {
        label: 'Labor Cost',
        value: `$${totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: totalMaintenanceCost > 0 ? (totalLaborCost / totalMaintenanceCost) * 100 : 0,
        changeLabel: `${totalMaintenanceCost > 0 ? ((totalLaborCost / totalMaintenanceCost) * 100).toFixed(0) : 0}% of maintenance`,
        icon: <Clock className="w-3 h-3" />,
        variant: 'info'
      }
    ]
  }, [fleetData])

  // Calculate cost breakdown by category
  const costBreakdown = useMemo<CostBreakdown[]>(() => {
    const vehicles = fleetData.vehicles || []
    const fuelTransactions = fleetData.fuelTransactions || []
    const workOrders = fleetData.workOrders || []

    const totalFuelCost = fuelTransactions.reduce((sum, t) => {
      return sum + (t.quantity || 0) * (t.pricePerGallon || 0)
    }, 0)

    const totalMaintenanceCost = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => sum + (wo.cost || 0), 0)

    const totalDowntimeHours = workOrders
      .filter(wo => wo.status === 'completed')
      .reduce((sum, wo) => sum + ((wo as any).downtime_hours || 0), 0)
    const downtimeCost = totalDowntimeHours * DOWNTIME_COST_PER_HOUR

    const insuranceCost = 0
    const depreciationCost = 0
    const otherCosts = 0

    const total = totalFuelCost + totalMaintenanceCost + downtimeCost + insuranceCost + depreciationCost + otherCosts

    return [
      {
        category: 'Fuel',
        amount: totalFuelCost,
        budget: total * 0.40,
        percentage: total > 0 ? (totalFuelCost / total) * 100 : 0,
        trend: 'down' as const
      },
      {
        category: 'Maintenance',
        amount: totalMaintenanceCost,
        budget: total * 0.25,
        percentage: total > 0 ? (totalMaintenanceCost / total) * 100 : 0,
        trend: 'up' as const
      },
      {
        category: 'Downtime Cost',
        amount: downtimeCost,
        budget: total * 0.15,
        percentage: total > 0 ? (downtimeCost / total) * 100 : 0,
        trend: totalDowntimeHours > 100 ? 'up' as const : 'stable' as const
      },
      ...(insuranceCost > 0 ? [{
        category: 'Insurance',
        amount: insuranceCost,
        budget: total * 0.10,
        percentage: total > 0 ? (insuranceCost / total) * 100 : 0,
        trend: 'stable' as const
      }] : []),
      ...(depreciationCost > 0 ? [{
        category: 'Depreciation',
        amount: depreciationCost,
        budget: total * 0.05,
        percentage: total > 0 ? (depreciationCost / total) * 100 : 0,
        trend: 'stable' as const
      }] : []),
      ...(otherCosts > 0 ? [{
        category: 'Other',
        amount: otherCosts,
        budget: total * 0.05,
        percentage: total > 0 ? (otherCosts / total) * 100 : 0,
        trend: 'stable' as const
      }] : [])
    ]
  }, [fleetData])

  // Parts vs Labor split for visualization
  const partsLaborSplit = useMemo(() => {
    const workOrders = fleetData.workOrders || []
    const completedOrders = workOrders.filter(wo => wo.status === 'completed')
    const totalParts = completedOrders.reduce((sum, wo) => sum + ((wo as any).parts_cost || 0), 0)
    const totalLabor = completedOrders.reduce((sum, wo) => sum + ((wo as any).labor_cost || 0), 0)
    const total = totalParts + totalLabor
    return {
      partsCost: totalParts,
      laborCost: totalLabor,
      partsPercent: total > 0 ? (totalParts / total) * 100 : 50,
      laborPercent: total > 0 ? (totalLabor / total) * 100 : 50
    }
  }, [fleetData])

  // Calculate per-vehicle cost data
  const vehicleCostData = useMemo<VehicleCostData[]>(() => {
    const vehicles = fleetData.vehicles || []
    const fuelTransactions = fleetData.fuelTransactions || []
    const workOrders = fleetData.workOrders || []

    const data = vehicles.map(vehicle => {
      // Filter transactions for this vehicle
      const vehicleFuelTransactions = fuelTransactions.filter(
        t => t.vehicleId === vehicle.id
      )
      const vehicleWorkOrders = workOrders.filter(
        wo => wo.vehicleId === vehicle.id && wo.status === 'completed'
      )

      // Calculate costs
      const fuelCost = vehicleFuelTransactions.reduce((sum, t) => {
        return sum + (t.quantity || 0) * (t.pricePerGallon || 0)
      }, 0)

      const maintenanceCost = vehicleWorkOrders.reduce((sum, wo) => {
        return sum + (wo.cost || 0)
      }, 0)

      // Calculate downtime hours for this vehicle
      const downtimeHours = vehicleWorkOrders.reduce((sum, wo) => {
        return sum + ((wo as any).downtime_hours || 0)
      }, 0)

      const totalCost = fuelCost + maintenanceCost
      const miles = vehicle.mileage || 0
      const costPerMile = miles > 0 ? totalCost / miles : 0

      // Calculate variance from IRS rate
      const irsStandardCost = miles * CURRENT_IRS_RATE
      const variance = irsStandardCost > 0
        ? ((totalCost - irsStandardCost) / irsStandardCost) * 100
        : 0

      return {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        totalCost,
        costPerMile,
        miles,
        fuelCost,
        maintenanceCost,
        variance,
        department: (vehicle as any).department || 'Unassigned',
        healthScore: (vehicle as any).health_score ?? (vehicle as any).healthScore ?? null,
        downtimeHours
      }
    })

    // Sort based on selected criterion
    return data.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return b.totalCost - a.totalCost
        case 'variance':
          return Math.abs(b.variance) - Math.abs(a.variance)
        case 'costPerMile':
          return b.costPerMile - a.costPerMile
        default:
          return 0
      }
    })
  }, [fleetData, sortBy])

  // Department cost analysis
  const departmentCostData = useMemo<DepartmentCostData[]>(() => {
    const departments = ['Operations', 'Maintenance', 'Field Services', 'Administration', 'Executive']
    const vehicles = fleetData.vehicles || []
    const fuelTransactions = fleetData.fuelTransactions || []
    const workOrders = fleetData.workOrders || []

    // Normalize department names for comparison
    const normalizeDept = (dept: string) => {
      if (!dept) return 'Unassigned'
      const lower = dept.toLowerCase().replace(/[_-]/g, ' ')
      for (const d of departments) {
        if (lower.includes(d.toLowerCase())) return d
      }
      return dept
    }

    // Build a map of all departments found
    const deptMap = new Map<string, DepartmentCostData>()

    // Initialize known departments
    for (const dept of departments) {
      deptMap.set(dept, {
        department: dept,
        vehicleCount: 0,
        totalCost: 0,
        avgCostPerVehicle: 0,
        fuelCost: 0,
        maintenanceCost: 0
      })
    }

    vehicles.forEach(vehicle => {
      const dept = normalizeDept((vehicle as any).department || '')
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          vehicleCount: 0,
          totalCost: 0,
          avgCostPerVehicle: 0,
          fuelCost: 0,
          maintenanceCost: 0
        })
      }
      const entry = deptMap.get(dept)!
      entry.vehicleCount += 1

      // Fuel cost for this vehicle
      const vehicleFuel = fuelTransactions
        .filter(t => t.vehicleId === vehicle.id)
        .reduce((sum, t) => sum + (t.quantity || 0) * (t.pricePerGallon || 0), 0)

      // Maintenance cost for this vehicle
      const vehicleMaintenance = workOrders
        .filter(wo => wo.vehicleId === vehicle.id && wo.status === 'completed')
        .reduce((sum, wo) => sum + (wo.cost || 0), 0)

      entry.fuelCost += vehicleFuel
      entry.maintenanceCost += vehicleMaintenance
      entry.totalCost += vehicleFuel + vehicleMaintenance
    })

    // Calculate averages and filter out empty departments
    const result = Array.from(deptMap.values())
      .filter(d => d.vehicleCount > 0)
      .map(d => ({
        ...d,
        avgCostPerVehicle: d.vehicleCount > 0 ? d.totalCost / d.vehicleCount : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    return result
  }, [fleetData])

  // Fuel efficiency analysis
  const fuelEfficiencyData = useMemo(() => {
    const vehicles = fleetData.vehicles || []

    // Get vehicles with fuel efficiency data
    const vehiclesWithEfficiency = vehicles
      .map(v => ({
        id: v.id,
        name: `${v.year} ${v.make} ${v.model}`,
        type: v.type || 'unknown',
        department: (v as any).department || 'Unassigned',
        fuelEfficiency: Number((v as any).fuel_efficiency ?? (v as any).fuelEfficiency ?? 0)
      }))
      .filter(v => v.fuelEfficiency > 0)

    // Average fuel efficiency
    const avgEfficiency = vehiclesWithEfficiency.length > 0
      ? vehiclesWithEfficiency.reduce((sum, v) => sum + v.fuelEfficiency, 0) / vehiclesWithEfficiency.length
      : 0

    // Group by department
    const byDepartment = new Map<string, { total: number; count: number }>()
    vehiclesWithEfficiency.forEach(v => {
      const existing = byDepartment.get(v.department) || { total: 0, count: 0 }
      existing.total += v.fuelEfficiency
      existing.count += 1
      byDepartment.set(v.department, existing)
    })
    const departmentEfficiency = Array.from(byDepartment.entries())
      .map(([dept, data]) => ({
        department: dept,
        avgEfficiency: data.count > 0 ? data.total / data.count : 0,
        vehicleCount: data.count
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)

    // Top 5 most efficient
    const mostEfficient = [...vehiclesWithEfficiency]
      .sort((a, b) => b.fuelEfficiency - a.fuelEfficiency)
      .slice(0, 5)

    // Top 5 least efficient
    const leastEfficient = [...vehiclesWithEfficiency]
      .sort((a, b) => a.fuelEfficiency - b.fuelEfficiency)
      .slice(0, 5)

    return {
      avgEfficiency,
      departmentEfficiency,
      mostEfficient,
      leastEfficient,
      totalVehiclesWithData: vehiclesWithEfficiency.length
    }
  }, [fleetData])

  const handleExportData = () => {
    toast.success('Exporting cost analytics data...')
    // In production, this would generate and download a CSV/Excel file
  }

  const getVariantColor = (variant: CostMetric['variant']) => {
    const colors = {
      success: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      warning: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      danger: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
      info: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
    }
    return colors[variant]
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-500" />
    return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <HubPage
      title="Cost Analytics"
      description={`Comprehensive cost tracking and budget analysis \u2022 IRS Rate: $${CURRENT_IRS_RATE}/mile`}
      icon={<DollarSign className="h-5 w-5" />}
      headerActions={
        <>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40">
              <Building className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {costMetrics.map((metric, index) => (
            <Section key={index} title={metric.label} className={`border-2 ${getVariantColor(metric.variant)}`} contentClassName="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold">{metric.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {metric.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {metric.changeLabel}
                    </span>
                  </div>
                </div>
                <div className="ml-2">{metric.icon}</div>
              </div>
            </Section>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Breakdown */}
          <Section
            title="Cost Breakdown by Category"
            description="Budget vs actual spending analysis"
            icon={<PieChart className="w-3 h-3" />}
          >
              <div className="space-y-4">
                {costBreakdown.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(item.trend)}
                        <span className="font-medium text-sm">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Budget: ${item.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                          item.amount > item.budget ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((item.amount / item.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.percentage.toFixed(1)}% of total</span>
                      <span>
                        {item.amount > item.budget ? 'Over' : 'Under'} by $
                        {Math.abs(item.amount - item.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Parts vs Labor Split */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Parts vs Labor Split</span>
                    <span className="text-xs text-muted-foreground">
                      ${partsLaborSplit.partsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${partsLaborSplit.laborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${partsLaborSplit.partsPercent}%` }}
                      title={`Parts: ${partsLaborSplit.partsPercent.toFixed(1)}%`}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${partsLaborSplit.laborPercent}%` }}
                      title={`Labor: ${partsLaborSplit.laborPercent.toFixed(1)}%`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-blue-500" />
                      <span className="text-xs text-muted-foreground">
                        Parts ({partsLaborSplit.partsPercent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        Labor ({partsLaborSplit.laborPercent.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
          </Section>

          {/* IRS Rate Comparison */}
          <Section
            title="IRS Mileage Rate Comparison"
            description="Industry standard benchmarking"
            icon={<BarChart3 className="w-3 h-3" />}
          >
              <div className="space-y-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-3 h-3 text-blue-800 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        2024 IRS Standard Mileage Rate
                      </p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mt-1">
                        ${CURRENT_IRS_RATE} per mile
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        Use this rate for tax deduction calculations and employee reimbursements
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Historical IRS Rates</h4>
                  {Object.entries(IRS_RATES).reverse().map(([year, rate]) => (
                    <div key={year} className="flex items-center justify-between p-3 bg-muted rounded">
                      <span className="text-sm font-medium">{year}</span>
                      <Badge variant="outline">${rate}/mile</Badge>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Fleet Performance
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Your average cost per mile is{' '}
                    {costMetrics[1]?.value || '$0.000'}, which is{' '}
                    {parseFloat(costMetrics[1]?.value?.replace('$', '') || '0') < CURRENT_IRS_RATE
                      ? 'below'
                      : 'above'}{' '}
                    the IRS standard rate
                  </p>
                </div>
              </div>
          </Section>
        </div>

        {/* Vehicle Cost Table */}
        <Section
          title="Per-Vehicle Cost Analysis"
          description="Detailed cost breakdown for each vehicle in your fleet"
          icon={<Car className="w-3 h-3" />}
          actions={
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">Total Cost</SelectItem>
                <SelectItem value="costPerMile">Cost Per Mile</SelectItem>
                <SelectItem value="variance">Budget Variance</SelectItem>
              </SelectContent>
            </Select>
          }
        >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-sm text-foreground">
                      Vehicle
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-sm text-foreground">
                      Department
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-sm text-foreground">
                      Health
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Total Cost
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Cost/Mile
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Miles
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Fuel Cost
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Maintenance
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Downtime (hrs)
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      vs IRS Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleCostData.slice(0, 10).map((vehicle) => (
                    <tr
                      key={vehicle.vehicleId}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <p className="font-medium text-sm">{vehicle.vehicleName}</p>
                      </td>
                      <td className="py-3 px-2 text-left">
                        <Badge variant="outline" className="text-xs">
                          {vehicle.department}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {vehicle.healthScore !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                vehicle.healthScore >= 80
                                  ? 'bg-green-500'
                                  : vehicle.healthScore >= 60
                                  ? 'bg-yellow-500'
                                  : vehicle.healthScore >= 40
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span className="text-sm">{vehicle.healthScore}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <p className="font-semibold">
                          ${vehicle.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Badge
                          variant={vehicle.costPerMile < CURRENT_IRS_RATE ? 'default' : 'destructive'}
                        >
                          ${vehicle.costPerMile.toFixed(3)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {vehicle.miles.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        ${vehicle.fuelCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        ${vehicle.maintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {vehicle.downtimeHours > 0 ? (
                          <span className={vehicle.downtimeHours > 24 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {vehicle.downtimeHours.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">0</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {vehicle.variance < 0 ? (
                            <TrendingDown className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              vehicle.variance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {vehicle.variance > 0 ? '+' : ''}
                            {vehicle.variance.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {vehicleCostData.length > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All {vehicleCostData.length} Vehicles
                </Button>
              </div>
            )}
        </Section>

        {/* Department Cost Analysis */}
        <Section
          title="Department Cost Analysis"
          description="Cost allocation and comparison by department"
          icon={<Building className="w-3 h-3" />}
        >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-sm text-foreground">
                      Department
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Vehicles
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Total Cost
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Avg Cost/Vehicle
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Fuel Cost
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm text-foreground">
                      Maintenance Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departmentCostData.map((dept) => {
                    const grandTotal = departmentCostData.reduce((s, d) => s + d.totalCost, 0)
                    const pct = grandTotal > 0 ? (dept.totalCost / grandTotal) * 100 : 0
                    return (
                      <tr
                        key={dept.department}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground/70" />
                            <div>
                              <p className="font-medium text-sm">{dept.department}</p>
                              <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% of total spend</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge variant="outline">{dept.vehicleCount}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-semibold">
                            ${dept.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-right text-sm">
                          ${dept.avgCostPerVehicle.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-right text-sm">
                          ${dept.fuelCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-right text-sm">
                          ${dept.maintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                  {departmentCostData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                        No department data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </Section>

        {/* Fuel Efficiency Analysis */}
        <Section
          title="Fuel Efficiency Analysis"
          description={`Fleet average: ${fuelEfficiencyData.avgEfficiency.toFixed(1)} MPG across ${fuelEfficiencyData.totalVehiclesWithData} vehicles`}
          icon={<Gauge className="w-3 h-3" />}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Average by Department */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-foreground">By Department</h4>
                {fuelEfficiencyData.departmentEfficiency.length > 0 ? (
                  <div className="space-y-2">
                    {fuelEfficiencyData.departmentEfficiency.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{dept.department}</p>
                          <p className="text-xs text-muted-foreground">{dept.vehicleCount} vehicle{dept.vehicleCount !== 1 ? 's' : ''}</p>
                        </div>
                        <Badge variant={dept.avgEfficiency >= fuelEfficiencyData.avgEfficiency ? 'default' : 'secondary'}>
                          {dept.avgEfficiency.toFixed(1)} MPG
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No efficiency data available</p>
                )}
              </div>

              {/* Top 5 Most Efficient */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Most Fuel-Efficient
                </h4>
                {fuelEfficiencyData.mostEfficient.length > 0 ? (
                  <div className="space-y-2">
                    {fuelEfficiencyData.mostEfficient.map((v, i) => (
                      <div key={v.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 w-5">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{v.department}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">{v.fuelEfficiency.toFixed(1)} MPG</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No efficiency data available</p>
                )}
              </div>

              {/* Top 5 Least Efficient */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Least Fuel-Efficient
                </h4>
                {fuelEfficiencyData.leastEfficient.length > 0 ? (
                  <div className="space-y-2">
                    {fuelEfficiencyData.leastEfficient.map((v, i) => (
                      <div key={v.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 w-5">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{v.department}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">{v.fuelEfficiency.toFixed(1)} MPG</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No efficiency data available</p>
                )}
              </div>
            </div>
        </Section>
      </div>
    </HubPage>
  )
}
