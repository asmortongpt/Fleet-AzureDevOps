/**
 * CostEmulator - Comprehensive cost tracking with budget management
 */

import { EventEmitter } from 'events'

// Enhanced interfaces for cost tracking
export interface CostEntry {
  id: number
  vehicleId: number
  driverId?: number
  category: 'fuel' | 'maintenance' | 'insurance' | 'depreciation' | 'labor' | 'tolls' | 'parking' | 'violations' | 'other'
  amount: number
  date: Date
  description: string
  invoiceNumber?: string
  vendorName?: string
  vendorId?: number
  department?: string
  budgetCategory?: string
  tags?: string[]
  paymentMethod?: 'fleet_card' | 'credit' | 'cash' | 'check' | 'wire' | 'ach'
  approvedBy?: string
  notes?: string
  mileageAtTime?: number
}

export interface BudgetTracking {
  month: string // YYYY-MM
  category: string
  budgeted: number
  actual: number
  variance: number
  variancePercent: number
  status: 'under' | 'on-track' | 'over'
  projectedMonthEnd?: number
  ytdBudget?: number
  ytdActual?: number
  alerts?: string[]
}

export interface CostAnalytics {
  totalCosts: number
  costPerMile: number
  costPerVehicle: number
  costPerDay: number
  topExpenseCategories: { category: string; amount: number; percent: number }[]
  monthlyTrend: { month: string; amount: number; budgeted: number }[]
  vehicleComparison: {
    vehicleId: number;
    vehicleName: string;
    totalCost: number;
    costPerMile: number;
    costPerDay: number;
  }[]
  departmentBreakdown?: { department: string; amount: number; percent: number }[]
  vendorAnalysis?: { vendorName: string; amount: number; transactionCount: number }[]
  yearOverYearComparison?: {
    currentYear: number
    previousYear: number
    percentChange: number
  }
}

export interface CostForecast {
  nextMonth: number
  nextQuarter: number
  yearEnd: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
}

export class CostEmulator extends EventEmitter {
  private costEntries: CostEntry[] = []
  private budgets: Map<string, BudgetTracking> = new Map()
  private nextId: number = 1
  private isRunning: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  // Budget configuration by category (monthly amounts)
  private categoryBudgets = {
    fuel: 15000,
    maintenance: 8000,
    insurance: 5000,
    depreciation: 12000,
    labor: 35000,
    tolls: 1500,
    parking: 800,
    violations: 500,
    other: 2000
  }

  // Vendor pool for realistic data
  private vendors = {
    fuel: ['Shell', 'BP', 'Exxon', 'Chevron', 'Mobil', 'Speedway', 'Circle K'],
    maintenance: ['Jiffy Lube', 'Firestone', 'Midas', 'Goodyear', 'Fleet Services Inc', 'AutoZone Pro'],
    insurance: ['Progressive Commercial', 'State Farm Business', 'Liberty Mutual', 'Nationwide Fleet'],
    parking: ['Central Parking', 'SP+ Parking', 'LAZ Parking', 'City Municipal Lot'],
    tolls: ['E-ZPass', 'SunPass', 'FasTrak', 'TxTag', 'I-Pass']
  }

  private departments = ['Operations', 'Delivery', 'Sales', 'Service', 'Executive', 'Maintenance']

  constructor() {
    super()
    this.initializeHistoricalData()
    this.initializeBudgets()
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
return
}
    this.isRunning = true

    // Generate new costs periodically
    this.updateInterval = setInterval(() => {
      this.generateRandomCost()
    }, 30000) // Every 30 seconds

    console.log('Cost Emulator started')
  }

  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
    console.log('Cost Emulator stopped')
  }

  private initializeHistoricalData(): void {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Generate 6 months of historical data
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
      // Generate 5-15 costs per day
      const costsPerDay = Math.floor(Math.random() * 10) + 5

      for (let i = 0; i < costsPerDay; i++) {
        const category = this.getRandomCategory()
        const cost = this.generateCostEntry(category, new Date(d))
        this.costEntries.push(cost)
      }
    }

    console.log(`Generated ${this.costEntries.length} historical cost entries`)
  }

  private initializeBudgets(): void {
    const now = new Date()

    // Initialize budgets for last 6 months
    for (let i = 6; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`

      Object.keys(this.categoryBudgets).forEach(category => {
        const budgetKey = `${monthKey}-${category}`
        const budgeted = this.categoryBudgets[category as keyof typeof this.categoryBudgets]

        // Calculate actual costs for this month/category
        const actual = this.calculateActualCosts(monthKey, category)
        const variance = actual - budgeted
        const variancePercent = (variance / budgeted) * 100

        this.budgets.set(budgetKey, {
          month: monthKey,
          category,
          budgeted,
          actual,
          variance,
          variancePercent,
          status: this.getBudgetStatus(variancePercent),
          projectedMonthEnd: this.projectMonthEnd(monthKey, category, actual),
          alerts: this.generateBudgetAlerts(variancePercent, category)
        })
      })
    }
  }

  private generateCostEntry(category: string, date: Date = new Date()): CostEntry {
    const vehicleId = Math.floor(Math.random() * 50) + 1
    const amount = this.generateAmount(category)

    const entry: CostEntry = {
      id: this.nextId++,
      vehicleId,
      driverId: Math.random() > 0.3 ? Math.floor(Math.random() * 30) + 1 : undefined,
      category: category as CostEntry['category'],
      amount,
      date,
      description: this.generateDescription(category),
      invoiceNumber: `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(this.nextId).padStart(5, '0')}`,
      vendorName: this.getRandomVendor(category),
      vendorId: Math.floor(Math.random() * 100) + 1,
      department: this.departments[Math.floor(Math.random() * this.departments.length)],
      budgetCategory: `${category.toUpperCase()}-${date.getFullYear()}`,
      tags: this.generateTags(category),
      paymentMethod: this.getRandomPaymentMethod(),
      approvedBy: Math.random() > 0.5 ? `Manager${Math.floor(Math.random() * 5) + 1}` : undefined,
      notes: Math.random() > 0.7 ? this.generateNotes(category) : undefined,
      mileageAtTime: Math.floor(Math.random() * 150000) + 10000
    }

    this.emit('costAdded', entry)
    return entry
  }

  private generateAmount(category: string): number {
    const ranges = {
      fuel: { min: 40, max: 120 },
      maintenance: { min: 50, max: 2000 },
      insurance: { min: 100, max: 500 },
      depreciation: { min: 200, max: 800 },
      labor: { min: 300, max: 1500 },
      tolls: { min: 5, max: 50 },
      parking: { min: 10, max: 100 },
      violations: { min: 25, max: 500 },
      other: { min: 20, max: 300 }
    }

    const range = ranges[category as keyof typeof ranges] || { min: 10, max: 100 }
    return Number((Math.random() * (range.max - range.min) + range.min).toFixed(2))
  }

  private generateDescription(category: string): string {
    const descriptions = {
      fuel: ['Fuel purchase', 'Diesel refuel', 'Gasoline fill-up', 'Fleet card transaction'],
      maintenance: ['Oil change', 'Tire rotation', 'Brake service', 'Engine diagnostic', 'Scheduled maintenance', 'Air filter replacement'],
      insurance: ['Monthly premium', 'Liability coverage', 'Comprehensive coverage', 'Collision coverage'],
      depreciation: ['Monthly depreciation', 'Quarterly depreciation adjustment', 'Annual depreciation'],
      labor: ['Driver wages', 'Overtime payment', 'Holiday pay', 'Shift differential', 'Performance bonus'],
      tolls: ['Highway toll', 'Bridge toll', 'Express lane', 'Turnpike toll'],
      parking: ['Daily parking', 'Monthly parking pass', 'Airport parking', 'Downtown parking'],
      violations: ['Parking ticket', 'Moving violation', 'Equipment violation', 'Overweight fine'],
      other: ['Registration renewal', 'Safety equipment', 'Cleaning supplies', 'Administrative fee']
    }

    const options = descriptions[category as keyof typeof descriptions] || ['Miscellaneous expense']
    return options[Math.floor(Math.random() * options.length)]
  }

  private generateTags(category: string): string[] {
    const tags = []

    if (Math.random() > 0.5) {
tags.push('tax-deductible')
}
    if (Math.random() > 0.7) {
tags.push('recurring')
}
    if (Math.random() > 0.8) {
tags.push('urgent')
}
    if (category === 'maintenance' && Math.random() > 0.6) {
tags.push('preventive')
}
    if (category === 'violations' || category === 'tolls') {
tags.push('compliance')
}

    return tags
  }

  private generateNotes(category: string): string {
    const notes = {
      fuel: 'Regular scheduled refueling',
      maintenance: 'Preventive maintenance as per schedule',
      insurance: 'Quarterly payment processed',
      labor: 'Regular payroll processing',
      violations: 'Requires follow-up with driver',
      other: 'Approved by fleet manager'
    }

    return notes[category as keyof typeof notes] || 'Standard transaction'
  }

  private getRandomCategory(): string {
    const categories = Object.keys(this.categoryBudgets)
    // Weight categories by frequency
    const weights = [30, 20, 5, 10, 25, 3, 2, 1, 4] // fuel, maintenance, insurance, etc.
    const totalWeight = weights.reduce((a, b) => a + b, 0)

    let random = Math.random() * totalWeight
    for (let i = 0; i < categories.length; i++) {
      random -= weights[i]
      if (random <= 0) {
return categories[i]
}
    }

    return categories[0]
  }

  private getRandomVendor(category: string): string {
    const vendorList = this.vendors[category as keyof typeof this.vendors]
    if (!vendorList) {
return `Vendor-${Math.floor(Math.random() * 100)}`
}
    return vendorList[Math.floor(Math.random() * vendorList.length)]
  }

  private getRandomPaymentMethod(): CostEntry['paymentMethod'] {
    const methods: CostEntry['paymentMethod'][] = ['fleet_card', 'credit', 'cash', 'check', 'wire', 'ach']
    const weights = [40, 30, 10, 10, 5, 5]
    const totalWeight = weights.reduce((a, b) => a + b, 0)

    let random = Math.random() * totalWeight
    for (let i = 0; i < methods.length; i++) {
      random -= weights[i]
      if (random <= 0) {
return methods[i]
}
    }

    return 'fleet_card'
  }

  private calculateActualCosts(month: string, category: string): number {
    const [year, monthNum] = month.split('-').map(Number)

    return this.costEntries
      .filter(entry => {
        const entryMonth = entry.date.getMonth() + 1
        const entryYear = entry.date.getFullYear()
        return entryYear === year &&
               entryMonth === monthNum &&
               entry.category === category
      })
      .reduce((sum, entry) => sum + entry.amount, 0)
  }

  private getBudgetStatus(variancePercent: number): BudgetTracking['status'] {
    if (variancePercent < -5) {
return 'under'
}
    if (variancePercent > 10) {
return 'over'
}
    return 'on-track'
  }

  private projectMonthEnd(month: string, _category: string, currentActual: number): number {
    const now = new Date()
    const [year, monthNum] = month.split('-').map(Number)
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    const currentDay = now.getDate()

    // Simple linear projection
    const dailyAverage = currentActual / currentDay
    return Number((dailyAverage * daysInMonth).toFixed(2))
  }

  private generateBudgetAlerts(variancePercent: number, category: string): string[] {
    const alerts = []

    if (variancePercent > 20) {
      alerts.push(`⚠️ ${category} costs are ${variancePercent.toFixed(1)}% over budget`)
    }
    if (variancePercent > 10 && variancePercent <= 20) {
      alerts.push(`⚡ ${category} costs approaching budget limit`)
    }
    if (variancePercent < -20) {
      alerts.push(`✓ ${category} costs are significantly under budget`)
    }

    return alerts
  }

  private generateRandomCost(): void {
    const category = this.getRandomCategory()
    const cost = this.generateCostEntry(category)
    this.costEntries.push(cost)

    // Update budget tracking
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const budgetKey = `${monthKey}-${category}`

    const budget = this.budgets.get(budgetKey)
    if (budget) {
      budget.actual += cost.amount
      budget.variance = budget.actual - budget.budgeted
      budget.variancePercent = (budget.variance / budget.budgeted) * 100
      budget.status = this.getBudgetStatus(budget.variancePercent)
      budget.alerts = this.generateBudgetAlerts(budget.variancePercent, category)
    }
  }

  // Public API methods
  public getAllCosts(filters?: {
    category?: string
    vehicleId?: number
    department?: string
    startDate?: Date
    endDate?: Date
    minAmount?: number
    maxAmount?: number
    paymentMethod?: string
    tags?: string[]
  }): CostEntry[] {
    let results = [...this.costEntries]

    if (filters) {
      if (filters.category) {
        results = results.filter(c => c.category === filters.category)
      }
      if (filters.vehicleId) {
        results = results.filter(c => c.vehicleId === filters.vehicleId)
      }
      if (filters.department) {
        results = results.filter(c => c.department === filters.department)
      }
      if (filters.startDate) {
        results = results.filter(c => c.date >= filters.startDate!)
      }
      if (filters.endDate) {
        results = results.filter(c => c.date <= filters.endDate!)
      }
      if (filters.minAmount !== undefined) {
        results = results.filter(c => c.amount >= filters.minAmount!)
      }
      if (filters.maxAmount !== undefined) {
        results = results.filter(c => c.amount <= filters.maxAmount!)
      }
      if (filters.paymentMethod) {
        results = results.filter(c => c.paymentMethod === filters.paymentMethod)
      }
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(c =>
          c.tags && filters.tags!.some(tag => c.tags!.includes(tag))
        )
      }
    }

    return results.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  public getCostsByVehicle(vehicleId: number): CostEntry[] {
    return this.costEntries.filter(c => c.vehicleId === vehicleId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  public getAnalytics(startDate?: Date, endDate?: Date): CostAnalytics {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1)
    const end = endDate || new Date()

    const filteredCosts = this.costEntries.filter(c => c.date >= start && c.date <= end)

    // Calculate total costs
    const totalCosts = filteredCosts.reduce((sum, c) => sum + c.amount, 0)

    // Estimate total miles (mock calculation)
    const totalMiles = filteredCosts.length * 150 // Rough estimate
    const costPerMile = totalMiles > 0 ? totalCosts / totalMiles : 0

    // Get unique vehicles
    const uniqueVehicles = new Set(filteredCosts.map(c => c.vehicleId))
    const costPerVehicle = uniqueVehicles.size > 0 ? totalCosts / uniqueVehicles.size : 0

    // Calculate days in period
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const costPerDay = days > 0 ? totalCosts / days : 0

    // Category breakdown
    const categoryTotals = new Map<string, number>()
    filteredCosts.forEach(c => {
      categoryTotals.set(c.category, (categoryTotals.get(c.category) || 0) + c.amount)
    })

    const topExpenseCategories = Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: (amount / totalCosts) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Monthly trend
    const monthlyTotals = new Map<string, { actual: number, budgeted: number }>()
    filteredCosts.forEach(c => {
      const monthKey = `${c.date.getFullYear()}-${String(c.date.getMonth() + 1).padStart(2, '0')}`
      const current = monthlyTotals.get(monthKey) || { actual: 0, budgeted: 0 }
      current.actual += c.amount
      monthlyTotals.set(monthKey, current)
    })

    // Add budget amounts
    this.budgets.forEach((budget) => {
      const month = budget.month
      if (monthlyTotals.has(month)) {
        const current = monthlyTotals.get(month)!
        current.budgeted += budget.budgeted
      }
    })

    const monthlyTrend = Array.from(monthlyTotals.entries())
      .map(([month, data]) => ({
        month,
        amount: data.actual,
        budgeted: data.budgeted
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Vehicle comparison
    const vehicleTotals = new Map<number, { total: number, miles: number }>()
    filteredCosts.forEach(c => {
      const current = vehicleTotals.get(c.vehicleId) || { total: 0, miles: 0 }
      current.total += c.amount
      current.miles += 150 // Mock miles
      vehicleTotals.set(c.vehicleId, current)
    })

    const vehicleComparison = Array.from(vehicleTotals.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        vehicleName: `Vehicle ${vehicleId}`,
        totalCost: data.total,
        costPerMile: data.miles > 0 ? data.total / data.miles : 0,
        costPerDay: data.total / days
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10)

    // Department breakdown
    const departmentTotals = new Map<string, number>()
    filteredCosts.forEach(c => {
      if (c.department) {
        departmentTotals.set(c.department, (departmentTotals.get(c.department) || 0) + c.amount)
      }
    })

    const departmentBreakdown = Array.from(departmentTotals.entries())
      .map(([department, amount]) => ({
        department,
        amount,
        percent: (amount / totalCosts) * 100
      }))
      .sort((a, b) => b.amount - a.amount)

    // Vendor analysis
    const vendorTotals = new Map<string, { amount: number, count: number }>()
    filteredCosts.forEach(c => {
      if (c.vendorName) {
        const current = vendorTotals.get(c.vendorName) || { amount: 0, count: 0 }
        current.amount += c.amount
        current.count++
        vendorTotals.set(c.vendorName, current)
      }
    })

    const vendorAnalysis = Array.from(vendorTotals.entries())
      .map(([vendorName, data]) => ({
        vendorName,
        amount: data.amount,
        transactionCount: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Year over year comparison
    const currentYear = new Date().getFullYear()
    const currentYearCosts = filteredCosts
      .filter(c => c.date.getFullYear() === currentYear)
      .reduce((sum, c) => sum + c.amount, 0)

    const previousYearCosts = filteredCosts
      .filter(c => c.date.getFullYear() === currentYear - 1)
      .reduce((sum, c) => sum + c.amount, 0)

    const yearOverYearComparison = previousYearCosts > 0 ? {
      currentYear: currentYearCosts,
      previousYear: previousYearCosts,
      percentChange: ((currentYearCosts - previousYearCosts) / previousYearCosts) * 100
    } : undefined

    return {
      totalCosts: Number(totalCosts.toFixed(2)),
      costPerMile: Number(costPerMile.toFixed(2)),
      costPerVehicle: Number(costPerVehicle.toFixed(2)),
      costPerDay: Number(costPerDay.toFixed(2)),
      topExpenseCategories,
      monthlyTrend,
      vehicleComparison,
      departmentBreakdown,
      vendorAnalysis,
      yearOverYearComparison
    }
  }

  public getBudgetTracking(month?: string): BudgetTracking[] {
    const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

    const results: BudgetTracking[] = []
    this.budgets.forEach((budget) => {
      if (budget.month === targetMonth || !month) {
        // Recalculate actual costs to ensure accuracy
        budget.actual = this.calculateActualCosts(budget.month, budget.category)
        budget.variance = budget.actual - budget.budgeted
        budget.variancePercent = (budget.variance / budget.budgeted) * 100
        budget.status = this.getBudgetStatus(budget.variancePercent)
        budget.projectedMonthEnd = this.projectMonthEnd(budget.month, budget.category, budget.actual)
        budget.alerts = this.generateBudgetAlerts(budget.variancePercent, budget.category)

        // Calculate YTD values
        const yearStart = new Date(parseInt(budget.month.split('-')[0]), 0, 1)
        const monthEnd = new Date(parseInt(budget.month.split('-')[0]), parseInt(budget.month.split('-')[1]), 0)

        budget.ytdBudget = this.calculateYTDBudget(budget.category, yearStart, monthEnd)
        budget.ytdActual = this.calculateYTDActual(budget.category, yearStart, monthEnd)

        results.push({ ...budget })
      }
    })

    return results.sort((a, b) => {
      if (a.month !== b.month) {
return b.month.localeCompare(a.month)
}
      return a.category.localeCompare(b.category)
    })
  }

  private calculateYTDBudget(category: string, start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1
    return this.categoryBudgets[category as keyof typeof this.categoryBudgets] * months
  }

  private calculateYTDActual(category: string, start: Date, end: Date): number {
    return this.costEntries
      .filter(c => c.category === category && c.date >= start && c.date <= end)
      .reduce((sum, c) => sum + c.amount, 0)
  }

  public exportToCSV(): string {
    const headers = [
      'ID', 'Date', 'Vehicle ID', 'Driver ID', 'Category', 'Amount',
      'Description', 'Invoice Number', 'Vendor', 'Department',
      'Payment Method', 'Approved By', 'Tags', 'Notes'
    ]

    const rows = this.costEntries.map(entry => [
      entry.id,
      entry.date.toISOString().split('T')[0],
      entry.vehicleId,
      entry.driverId || '',
      entry.category,
      entry.amount.toFixed(2),
      entry.description,
      entry.invoiceNumber || '',
      entry.vendorName || '',
      entry.department || '',
      entry.paymentMethod || '',
      entry.approvedBy || '',
      (entry.tags || []).join(';'),
      entry.notes || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n')

    return csv
  }

  public addCost(cost: Omit<CostEntry, 'id'>): CostEntry {
    const newCost: CostEntry = {
      ...cost,
      id: this.nextId++,
      date: new Date(cost.date)
    }

    this.costEntries.push(newCost)
    this.emit('costAdded', newCost)

    // Update budget tracking
    const monthKey = `${newCost.date.getFullYear()}-${String(newCost.date.getMonth() + 1).padStart(2, '0')}`
    const budgetKey = `${monthKey}-${newCost.category}`

    const budget = this.budgets.get(budgetKey)
    if (budget) {
      budget.actual += newCost.amount
      budget.variance = budget.actual - budget.budgeted
      budget.variancePercent = (budget.variance / budget.budgeted) * 100
      budget.status = this.getBudgetStatus(budget.variancePercent)
    }

    return newCost
  }

  public getForecast(): CostForecast {
    const analytics = this.getAnalytics()
    const recentTrend = analytics.monthlyTrend.slice(-3)

    if (recentTrend.length < 3) {
      return {
        nextMonth: 0,
        nextQuarter: 0,
        yearEnd: 0,
        confidence: 'low',
        assumptions: ['Insufficient historical data for accurate forecast']
      }
    }

    // Calculate average monthly cost from last 3 months
    const avgMonthly = recentTrend.reduce((sum, m) => sum + m.amount, 0) / recentTrend.length

    // Apply seasonal adjustments
    const currentMonth = new Date().getMonth()
    const seasonalFactor = this.getSeasonalFactor(currentMonth)

    const nextMonth = avgMonthly * seasonalFactor
    const nextQuarter = nextMonth * 3 * 1.02 // 2% growth factor

    // Calculate months remaining in year
    const monthsRemaining = 12 - currentMonth
    const yearEnd = avgMonthly * monthsRemaining * seasonalFactor * 1.03 // 3% growth factor

    // Determine confidence based on data consistency
    const variance = this.calculateVariance(recentTrend.map(m => m.amount))
    const confidence: CostForecast['confidence'] =
      variance < 0.1 ? 'high' :
      variance < 0.25 ? 'medium' : 'low'

    return {
      nextMonth: Number(nextMonth.toFixed(2)),
      nextQuarter: Number(nextQuarter.toFixed(2)),
      yearEnd: Number(yearEnd.toFixed(2)),
      confidence,
      assumptions: [
        'Based on 3-month rolling average',
        `Seasonal adjustment factor: ${seasonalFactor.toFixed(2)}`,
        'Assumes 2-3% quarterly growth',
        'Does not account for extraordinary events'
      ]
    }
  }

  private getSeasonalFactor(month: number): number {
    // Winter months (Dec-Feb): higher fuel/maintenance
    if (month === 11 || month === 0 || month === 1) {
return 1.15
}
    // Summer months (Jun-Aug): higher fuel for AC, more trips
    if (month >= 5 && month <= 7) {
return 1.10
}
    // Spring/Fall: normal operations
    return 1.0
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length / (mean * mean)
  }

  public getCurrentState(): any {
    return {
      totalEntries: this.costEntries.length,
      totalCost: this.costEntries.reduce((sum, c) => sum + c.amount, 0),
      categoryCounts: Object.keys(this.categoryBudgets).reduce((acc, cat) => {
        acc[cat] = this.costEntries.filter(c => c.category === cat).length
        return acc
      }, {} as Record<string, number>),
      isRunning: this.isRunning
    }
  }
}

// Export singleton instance
export const costEmulator = new CostEmulator()