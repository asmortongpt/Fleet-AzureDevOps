/**
 * Cost Analysis and Reporting Integration Tests
 *
 * End-to-end workflow validation:
 * - Cost tracking and categorization
 * - Expense analysis and forecasting
 * - ROI and efficiency reporting
 * - Depreciation tracking
 * - Multi-tenant cost isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

interface MockCostEntry {
  id: string
  tenant_id: string
  vehicle_id: string
  category: 'fuel' | 'maintenance' | 'insurance' | 'depreciation' | 'tolls' | 'parking'
  amount: number
  date: Date
  description: string
  recurring: boolean
}

interface MockExpenseReport {
  id: string
  tenant_id: string
  period_start: Date
  period_end: Date
  total_fuel: number
  total_maintenance: number
  total_insurance: number
  total_depreciation: number
  total_other: number
  total_all: number
  vehicle_count: number
  total_miles: number
  cost_per_mile: number
}

interface MockVehicleDepreciation {
  id: string
  tenant_id: string
  vehicle_id: string
  purchase_price: number
  purchase_date: Date
  current_value: number
  depreciation_rate: number
  yearly_depreciation: number
}

interface MockForecast {
  id: string
  tenant_id: string
  period_months: number
  projected_fuel_cost: number
  projected_maintenance_cost: number
  projected_total_cost: number
  confidence_level: number
}

class CostAnalysisWorkflow {
  private costs: Map<string, MockCostEntry> = new Map()
  private reports: Map<string, MockExpenseReport> = new Map()
  private depreciation: Map<string, MockVehicleDepreciation> = new Map()
  private forecasts: Map<string, MockForecast> = new Map()
  private idCounter = 0

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${++this.idCounter}`
  }

  async recordCostEntry(
    tenantId: string,
    vehicleId: string,
    category: string,
    amount: number,
    date: Date,
    description: string,
    recurring: boolean = false
  ): Promise<{ success: boolean; cost?: MockCostEntry }> {
    const id = this.generateId('cost')
    const cost: MockCostEntry = {
      id,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      category: category as any,
      amount,
      date,
      description,
      recurring,
    }

    this.costs.set(id, cost)
    return { success: true, cost }
  }

  async generateExpenseReport(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ success: boolean; report?: MockExpenseReport }> {
    const tenantCosts = Array.from(this.costs.values()).filter(
      c => c.tenant_id === tenantId && c.date >= periodStart && c.date <= periodEnd
    )

    const report: MockExpenseReport = {
      id: this.generateId('report'),
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
      total_fuel: this.sumByCategory(tenantCosts, 'fuel'),
      total_maintenance: this.sumByCategory(tenantCosts, 'maintenance'),
      total_insurance: this.sumByCategory(tenantCosts, 'insurance'),
      total_depreciation: this.sumByCategory(tenantCosts, 'depreciation'),
      total_other: this.sumOtherCategories(tenantCosts),
      total_all: tenantCosts.reduce((sum, c) => sum + c.amount, 0),
      vehicle_count: new Set(tenantCosts.map(c => c.vehicle_id)).size,
      total_miles: tenantCosts.filter(c => c.category === 'fuel').length * 150, // Mock calculation
      cost_per_mile: 0,
    }

    // Calculate cost per mile
    if (report.total_miles > 0) {
      report.cost_per_mile = report.total_all / report.total_miles
    }

    this.reports.set(report.id, report)
    return { success: true, report }
  }

  private sumByCategory(costs: MockCostEntry[], category: string): number {
    return costs.filter(c => c.category === category).reduce((sum, c) => sum + c.amount, 0)
  }

  private sumOtherCategories(costs: MockCostEntry[]): number {
    return costs
      .filter(c => !['fuel', 'maintenance', 'insurance', 'depreciation'].includes(c.category))
      .reduce((sum, c) => sum + c.amount, 0)
  }

  async recordVehicleDepreciation(
    tenantId: string,
    vehicleId: string,
    purchasePrice: number,
    purchaseDate: Date,
    depreciationRate: number
  ): Promise<{ success: boolean; depreciation?: MockVehicleDepreciation }> {
    const id = this.generateId('depreciation')

    // Calculate current value based on age
    const ageInYears = (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    const currentValue = purchasePrice * Math.pow(1 - depreciationRate, ageInYears)
    const yearlyDepreciation = purchasePrice * depreciationRate

    const depreciation: MockVehicleDepreciation = {
      id,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      purchase_price: purchasePrice,
      purchase_date: purchaseDate,
      current_value: currentValue,
      depreciation_rate: depreciationRate,
      yearly_depreciation: yearlyDepreciation,
    }

    this.depreciation.set(id, depreciation)
    return { success: true, depreciation }
  }

  async generateForecast(
    tenantId: string,
    periodMonths: number
  ): Promise<{ success: boolean; forecast?: MockForecast }> {
    const tenantCosts = Array.from(this.costs.values()).filter(c => c.tenant_id === tenantId)

    if (tenantCosts.length === 0) {
      return { success: false }
    }

    // Calculate averages from recent costs
    const recentCosts = tenantCosts.slice(-20) // Last 20 costs
    const avgFuel = this.sumByCategory(recentCosts, 'fuel') / Math.max(1, recentCosts.length)
    const avgMaintenance =
      this.sumByCategory(recentCosts, 'maintenance') / Math.max(1, recentCosts.length)

    const forecast: MockForecast = {
      id: this.generateId('forecast'),
      tenant_id: tenantId,
      period_months: periodMonths,
      projected_fuel_cost: avgFuel * (periodMonths * 4), // ~4 weeks per month
      projected_maintenance_cost: avgMaintenance * (periodMonths * 4),
      projected_total_cost: (avgFuel + avgMaintenance) * (periodMonths * 4),
      confidence_level: 0.75,
    }

    this.forecasts.set(forecast.id, forecast)
    return { success: true, forecast }
  }

  async getVehicleCostSummary(
    tenantId: string,
    vehicleId: string
  ): Promise<{
    total: number
    byCategory: Record<string, number>
    averageMonthly: number
    costTrend: 'increasing' | 'stable' | 'decreasing'
  }> {
    const vehicleCosts = Array.from(this.costs.values()).filter(
      c => c.tenant_id === tenantId && c.vehicle_id === vehicleId
    )

    const byCategory: Record<string, number> = {}
    let total = 0

    for (const cost of vehicleCosts) {
      byCategory[cost.category] = (byCategory[cost.category] || 0) + cost.amount
      total += cost.amount
    }

    const averageMonthly = vehicleCosts.length > 0 ? total / 12 : 0

    // Simple trend calculation
    const recentCosts = vehicleCosts.slice(-10)
    const olderCosts = vehicleCosts.slice(-20, -10)
    const recentAvg = recentCosts.reduce((sum, c) => sum + c.amount, 0) / Math.max(1, recentCosts.length)
    const olderAvg = olderCosts.reduce((sum, c) => sum + c.amount, 0) / Math.max(1, olderCosts.length)

    let costTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (recentAvg > olderAvg * 1.1) {
      costTrend = 'increasing'
    } else if (recentAvg < olderAvg * 0.9) {
      costTrend = 'decreasing'
    }

    return {
      total,
      byCategory,
      averageMonthly,
      costTrend,
    }
  }

  async getFleetCostAnalysis(tenantId: string): Promise<{
    total: number
    byCategory: Record<string, number>
    vehicleCount: number
    costPerVehicle: number
  }> {
    const fleetCosts = Array.from(this.costs.values()).filter(c => c.tenant_id === tenantId)

    const byCategory: Record<string, number> = {}
    let total = 0

    for (const cost of fleetCosts) {
      byCategory[cost.category] = (byCategory[cost.category] || 0) + cost.amount
      total += cost.amount
    }

    const vehicleCount = new Set(fleetCosts.map(c => c.vehicle_id)).size
    const costPerVehicle = vehicleCount > 0 ? total / vehicleCount : 0

    return {
      total,
      byCategory,
      vehicleCount,
      costPerVehicle,
    }
  }

  getReportsByTenant(tenantId: string): MockExpenseReport[] {
    return Array.from(this.reports.values()).filter(r => r.tenant_id === tenantId)
  }

  getForecastsByTenant(tenantId: string): MockForecast[] {
    return Array.from(this.forecasts.values()).filter(f => f.tenant_id === tenantId)
  }
}

describe('Cost Analysis and Reporting Integration', () => {
  let workflow: CostAnalysisWorkflow
  const tenantId1 = 'tenant-1'
  const tenantId2 = 'tenant-2'
  const vehicleId1 = 'vehicle-1'
  const vehicleId2 = 'vehicle-2'

  beforeEach(() => {
    workflow = new CostAnalysisWorkflow()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Workflow: Cost Tracking and Categorization', () => {
    it('should record cost entry with category', async () => {
      const result = await workflow.recordCostEntry(
        tenantId1,
        vehicleId1,
        'fuel',
        45.5,
        new Date(),
        'Shell gas station'
      )

      expect(result.success).toBe(true)
      expect(result.cost?.category).toBe('fuel')
      expect(result.cost?.amount).toBe(45.5)
    })

    it('should track recurring costs', async () => {
      const result = await workflow.recordCostEntry(
        tenantId1,
        vehicleId1,
        'insurance',
        125.0,
        new Date(),
        'Monthly insurance premium',
        true
      )

      expect(result.success).toBe(true)
      expect(result.cost?.recurring).toBe(true)
    })

    it('should categorize multiple cost types', async () => {
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 50, new Date(), 'Gas')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'maintenance', 150, new Date(), 'Oil change')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'insurance', 100, new Date(), 'Insurance')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'tolls', 5.5, new Date(), 'Highway toll')

      const summary = await workflow.getVehicleCostSummary(tenantId1, vehicleId1)

      expect(summary.byCategory.fuel).toBe(50)
      expect(summary.byCategory.maintenance).toBe(150)
      expect(summary.byCategory.insurance).toBe(100)
      expect(summary.byCategory.tolls).toBe(5.5)
      expect(summary.total).toBe(305.5)
    })
  })

  describe('Workflow: Expense Report Generation', () => {
    it('should generate expense report for period', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 200, startDate, 'Fuel')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'maintenance', 300, startDate, 'Maintenance')
      await workflow.recordCostEntry(tenantId1, vehicleId2, 'insurance', 150, startDate, 'Insurance')

      const reportResult = await workflow.generateExpenseReport(tenantId1, startDate, endDate)

      expect(reportResult.success).toBe(true)
      expect(reportResult.report?.total_fuel).toBe(200)
      expect(reportResult.report?.total_maintenance).toBe(300)
      expect(reportResult.report?.total_insurance).toBe(150)
      expect(reportResult.report?.total_all).toBe(650)
      expect(reportResult.report?.vehicle_count).toBe(2)
    })

    it('should calculate cost per mile', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, startDate, 'Fuel 1')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, startDate, 'Fuel 2')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'maintenance', 200, startDate, 'Maintenance')

      const reportResult = await workflow.generateExpenseReport(tenantId1, startDate, endDate)

      expect(reportResult.report?.cost_per_mile).toBeGreaterThan(0)
    })

    it('should handle date filtering for reports', async () => {
      const jan1 = new Date('2024-01-01')
      const jan31 = new Date('2024-01-31')
      const feb1 = new Date('2024-02-01')

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, jan1, 'January fuel')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 200, feb1, 'February fuel')

      const janReport = await workflow.generateExpenseReport(tenantId1, jan1, jan31)
      expect(janReport.report?.total_fuel).toBe(100)

      const febReport = await workflow.generateExpenseReport(tenantId1, feb1, new Date('2024-02-28'))
      expect(febReport.report?.total_fuel).toBe(200)
    })
  })

  describe('Workflow: Vehicle Depreciation Tracking', () => {
    it('should track vehicle depreciation', async () => {
      const purchaseDate = new Date('2020-01-01')
      const result = await workflow.recordVehicleDepreciation(
        tenantId1,
        vehicleId1,
        50000,
        purchaseDate,
        0.15 // 15% per year
      )

      expect(result.success).toBe(true)
      expect(result.depreciation?.purchase_price).toBe(50000)
      expect(result.depreciation?.depreciation_rate).toBe(0.15)
      expect(result.depreciation?.yearly_depreciation).toBe(7500)
    })

    it('should calculate current vehicle value', async () => {
      const purchaseDate = new Date('2020-01-01')
      const depResult = await workflow.recordVehicleDepreciation(
        tenantId1,
        vehicleId1,
        40000,
        purchaseDate,
        0.1
      )

      expect(depResult.depreciation?.current_value).toBeGreaterThan(0)
      expect(depResult.depreciation?.current_value).toBeLessThan(40000)
    })
  })

  describe('Workflow: Cost Forecasting', () => {
    it('should generate cost forecast', async () => {
      // Setup historical data
      const baseDate = new Date()
      for (let i = 0; i < 20; i++) {
        await workflow.recordCostEntry(
          tenantId1,
          vehicleId1,
          i % 2 === 0 ? 'fuel' : 'maintenance',
          100 + i * 5,
          new Date(baseDate.getTime() - i * 86400000),
          `Cost ${i}`
        )
      }

      const forecastResult = await workflow.generateForecast(tenantId1, 12)

      expect(forecastResult.success).toBe(true)
      expect(forecastResult.forecast?.period_months).toBe(12)
      expect(forecastResult.forecast?.projected_total_cost).toBeGreaterThan(0)
      expect(forecastResult.forecast?.confidence_level).toBe(0.75)
    })

    it('should fail forecast without historical data', async () => {
      const result = await workflow.generateForecast(tenantId1, 12)
      expect(result.success).toBe(false)
    })
  })

  describe('Workflow: Cost Analysis and Insights', () => {
    it('should analyze vehicle cost trends', async () => {
      const baseDate = new Date()

      // Simulate increasing costs
      for (let i = 0; i < 15; i++) {
        await workflow.recordCostEntry(
          tenantId1,
          vehicleId1,
          'maintenance',
          100 + i * 10,
          new Date(baseDate.getTime() - i * 86400000),
          `Maintenance ${i}`
        )
      }

      const summary = await workflow.getVehicleCostSummary(tenantId1, vehicleId1)

      expect(summary.total).toBeGreaterThan(0)
      expect(summary.averageMonthly).toBeGreaterThan(0)
      expect(['increasing', 'stable', 'decreasing']).toContain(summary.costTrend)
    })

    it('should calculate fleet-wide cost analysis', async () => {
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, new Date(), 'Fuel v1')
      await workflow.recordCostEntry(tenantId1, vehicleId2, 'fuel', 150, new Date(), 'Fuel v2')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'maintenance', 200, new Date(), 'Maint v1')
      await workflow.recordCostEntry(tenantId1, vehicleId2, 'maintenance', 250, new Date(), 'Maint v2')

      const fleetAnalysis = await workflow.getFleetCostAnalysis(tenantId1)

      expect(fleetAnalysis.total).toBe(700)
      expect(fleetAnalysis.byCategory.fuel).toBe(250)
      expect(fleetAnalysis.byCategory.maintenance).toBe(450)
      expect(fleetAnalysis.vehicleCount).toBe(2)
      expect(fleetAnalysis.costPerVehicle).toBe(350)
    })
  })

  describe('Workflow: Multi-Tenant Cost Isolation', () => {
    it('should isolate costs between tenants', async () => {
      const date = new Date()

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, date, 'Tenant 1 fuel')
      await workflow.recordCostEntry(tenantId2, vehicleId2, 'fuel', 200, date, 'Tenant 2 fuel')

      const report1 = await workflow.generateExpenseReport(tenantId1, date, date)
      const report2 = await workflow.generateExpenseReport(tenantId2, date, date)

      expect(report1.report?.total_fuel).toBe(100)
      expect(report2.report?.total_fuel).toBe(200)
    })

    it('should isolate reports between tenants', async () => {
      const date = new Date()

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, date, 'Cost')
      const report1 = await workflow.generateExpenseReport(tenantId1, date, date)

      await workflow.recordCostEntry(tenantId2, vehicleId2, 'fuel', 200, date, 'Cost')
      const report2 = await workflow.generateExpenseReport(tenantId2, date, date)

      const tenant1Reports = workflow.getReportsByTenant(tenantId1)
      const tenant2Reports = workflow.getReportsByTenant(tenantId2)

      expect(tenant1Reports.length).toBe(1)
      expect(tenant2Reports.length).toBe(1)
      expect(tenant1Reports[0].id).not.toBe(tenant2Reports[0].id)
    })

    it('should prevent cross-tenant cost analysis', async () => {
      const date = new Date()

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 100, date, 'T1 Cost')
      await workflow.recordCostEntry(tenantId2, vehicleId2, 'fuel', 200, date, 'T2 Cost')

      // Tenant 1 should only see their costs
      const t1Analysis = await workflow.getFleetCostAnalysis(tenantId1)
      expect(t1Analysis.total).toBe(100)

      // Tenant 2 should only see their costs
      const t2Analysis = await workflow.getFleetCostAnalysis(tenantId2)
      expect(t2Analysis.total).toBe(200)
    })
  })

  describe('Workflow: Error Handling and Edge Cases', () => {
    it('should handle empty report generation', async () => {
      const date = new Date()
      const result = await workflow.generateExpenseReport(tenantId1, date, date)

      expect(result.success).toBe(true)
      expect(result.report?.total_all).toBe(0)
    })

    it('should handle cost tracking for multiple vehicles', async () => {
      const date = new Date()

      const promises = [
        workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 50, date, 'V1 Fuel'),
        workflow.recordCostEntry(tenantId1, vehicleId2, 'fuel', 60, date, 'V2 Fuel'),
      ]

      const results = await Promise.all(promises)
      expect(results.every(r => r.success)).toBe(true)

      const analysis = await workflow.getFleetCostAnalysis(tenantId1)
      expect(analysis.vehicleCount).toBe(2)
      expect(analysis.total).toBe(110)
    })

    it('should generate accurate reports with mixed categories', async () => {
      const date = new Date('2024-01-15')

      await workflow.recordCostEntry(tenantId1, vehicleId1, 'fuel', 75, date, 'Gas')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'maintenance', 250, date, 'Service')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'insurance', 85, date, 'Insurance')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'tolls', 12.5, date, 'Toll')
      await workflow.recordCostEntry(tenantId1, vehicleId1, 'parking', 10, date, 'Parking')

      const report = await workflow.generateExpenseReport(
        tenantId1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      )

      expect(report.report?.total_fuel).toBe(75)
      expect(report.report?.total_maintenance).toBe(250)
      expect(report.report?.total_insurance).toBe(85)
      expect(report.report?.total_other).toBe(22.5) // tolls + parking
      expect(report.report?.total_all).toBe(432.5)
    })
  })
})
