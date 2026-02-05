/**
 * Cost Analysis Service
 *
 * Production-ready implementation backed by the database.
 *
 * Key points:
 * - No in-memory emulators or hardcoded demo data.
 * - Uses `unified_costs` (DB view) to normalize multiple sources:
 *   fuel_transactions, work_orders, invoices, cost_manual_entries.
 * - Budget status uses `budgets` table (Migration 004_budget_management.sql).
 */

import type { Pool } from 'pg'

import costForecastingModel from '../ml-models/cost-forecasting.model'

export interface CostEntry {
  id?: string
  costCategory: string
  costSubcategory?: string
  vehicleId?: string | null
  driverId?: string | null
  routeId?: string | null
  vendorId?: string | null
  amount: number
  description?: string | null
  transactionDate: Date
  invoiceNumber?: string | null
  isBudgeted: boolean
  isAnomaly: boolean
  anomalyScore?: number | null
  anomalyReason?: string | null
  costPerMile?: number | null
}

export interface CostSummary {
  totalCost: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    trend: 'increasing' | 'decreasing' | 'stable'
    forecastedAmount: number
  }>
  topExpenses: Array<{
    description: string
    amount: number
    category: string
    date: Date
  }>
  anomalies: Array<{
    id: string
    amount: number
    category: string
    reason: string
    date: Date
  }>
}

export interface BudgetStatus {
  category: string
  allocated: number
  spent: number
  remaining: number
  percentageUsed: number
  isOverBudget: boolean
  forecastedSpend: number
}

type UnifiedCostRow = {
  tenant_id: string
  cost_category: string
  cost_subcategory: string | null
  vehicle_id: string | null
  driver_id: string | null
  route_id: string | null
  vendor_id: string | null
  amount: string
  description: string | null
  transaction_date: Date
  invoice_number: string | null
  is_budgeted: boolean
  is_anomaly: boolean
  anomaly_score: string | null
  anomaly_reason: string | null
  cost_per_mile: string | null
  source_table: string
  source_id: string
}

function toNumber(n: unknown, fallback = 0): number {
  const v = typeof n === 'string' ? Number(n) : typeof n === 'number' ? n : NaN
  return Number.isFinite(v) ? v : fallback
}

function computeTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
  if (previous <= 0) return current > 0 ? 'increasing' : 'stable'
  const delta = (current - previous) / previous
  if (Math.abs(delta) < 0.05) return 'stable'
  return delta > 0 ? 'increasing' : 'decreasing'
}

function quarterRange(fiscalYear: number, fiscalQuarter: number): { start: Date; end: Date } {
  const q = Math.min(4, Math.max(1, fiscalQuarter))
  const startMonth = (q - 1) * 3 // 0,3,6,9
  const start = new Date(Date.UTC(fiscalYear, startMonth, 1, 0, 0, 0))
  const end = new Date(Date.UTC(fiscalYear, startMonth + 3, 0, 23, 59, 59, 999)) // last day of quarter
  return { start, end }
}

export class CostAnalysisService {
  constructor(private db: Pool) {}

  async trackCost(tenantId: string, cost: CostEntry): Promise<CostEntry> {
    const client = await this.db.connect()
    try {
      await client.query('BEGIN')

      const anomalyDetection = await costForecastingModel.detectAnomaly(
        cost.amount,
        cost.costCategory,
        tenantId
      )

      let costPerMile: number | null = null
      if (cost.vehicleId) {
        const startDate = new Date(cost.transactionDate)
        startDate.setDate(startDate.getDate() - 30)
        costPerMile = await costForecastingModel.calculateCostPerMile(
          cost.vehicleId,
          tenantId,
          startDate,
          cost.transactionDate
        )
      }

      const result = await client.query<{ id: string }>(
        `INSERT INTO cost_manual_entries (
           tenant_id, cost_category, cost_subcategory,
           vehicle_id, driver_id, route_id, vendor_id,
           amount, description, transaction_date, invoice_number,
           is_budgeted, is_anomaly, anomaly_score, anomaly_reason, cost_per_mile
         ) VALUES (
           $1, $2, $3,
           $4, $5, $6, $7,
           $8, $9, $10, $11,
           $12, $13, $14, $15, $16
         )
         RETURNING id`,
        [
          tenantId,
          cost.costCategory,
          cost.costSubcategory ?? null,
          cost.vehicleId ?? null,
          cost.driverId ?? null,
          cost.routeId ?? null,
          cost.vendorId ?? null,
          cost.amount,
          cost.description ?? null,
          cost.transactionDate,
          cost.invoiceNumber ?? null,
          cost.isBudgeted,
          anomalyDetection.isAnomaly,
          anomalyDetection.score,
          anomalyDetection.reason,
          costPerMile,
        ]
      )

      await client.query('COMMIT')

      return {
        ...cost,
        id: result.rows[0].id,
        isAnomaly: anomalyDetection.isAnomaly,
        anomalyScore: anomalyDetection.score,
        anomalyReason: anomalyDetection.reason,
        costPerMile,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async getCostSummary(tenantId: string, startDate: Date, endDate: Date): Promise<CostSummary> {
    // Total cost
    const totalResult = await this.db.query<{ total_cost: string }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS total_cost
       FROM unified_costs
       WHERE tenant_id = $1 AND transaction_date BETWEEN $2 AND $3`,
      [tenantId, startDate, endDate]
    )
    const totalCost = toNumber(totalResult.rows[0]?.total_cost, 0)

    // Category breakdown (current period)
    const breakdownResult = await this.db.query<{ category: string; amount: string }>(
      `SELECT cost_category AS category, COALESCE(SUM(amount), 0)::text AS amount
       FROM unified_costs
       WHERE tenant_id = $1 AND transaction_date BETWEEN $2 AND $3
       GROUP BY cost_category
       ORDER BY SUM(amount) DESC`,
      [tenantId, startDate, endDate]
    )

    // Previous period for trend (same duration immediately preceding)
    const durationMs = Math.max(1, endDate.getTime() - startDate.getTime())
    const prevEnd = new Date(startDate.getTime())
    const prevStart = new Date(startDate.getTime() - durationMs)

    const prevBreakdownResult = await this.db.query<{ category: string; amount: string }>(
      `SELECT cost_category AS category, COALESCE(SUM(amount), 0)::text AS amount
       FROM unified_costs
       WHERE tenant_id = $1 AND transaction_date BETWEEN $2 AND $3
       GROUP BY cost_category`,
      [tenantId, prevStart, prevEnd]
    )

    const prevByCategory = new Map<string, number>(
      prevBreakdownResult.rows.map((r) => [r.category, toNumber(r.amount, 0)])
    )

    const categoryBreakdown = await Promise.all(
      breakdownResult.rows.map(async (row) => {
        const amount = toNumber(row.amount, 0)
        const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0
        const prevAmount = prevByCategory.get(row.category) ?? 0
        const trend = computeTrend(amount, prevAmount)

        // Forecast by category using the lightweight model (DB-backed)
        const forecast = await costForecastingModel.forecastCosts(tenantId, row.category, 1)
        const forecastedAmount = forecast[0]?.predictedAmount ?? 0

        return {
          category: row.category,
          amount,
          percentage,
          trend,
          forecastedAmount,
        }
      })
    )

    // Top expenses in period
    const expensesResult = await this.db.query<{
      description: string | null
      amount: string
      category: string
      date: Date
    }>(
      `SELECT
         COALESCE(description, source_table) AS description,
         amount::text AS amount,
         cost_category AS category,
         transaction_date AS date
       FROM unified_costs
       WHERE tenant_id = $1 AND transaction_date BETWEEN $2 AND $3
       ORDER BY amount DESC
       LIMIT 10`,
      [tenantId, startDate, endDate]
    )

    const topExpenses = expensesResult.rows.map((r) => ({
      description: r.description ?? 'Expense',
      amount: toNumber(r.amount, 0),
      category: r.category,
      date: r.date,
    }))

    const anomalies = await this.getAnomalies(tenantId, startDate, endDate)

    return {
      totalCost,
      categoryBreakdown,
      topExpenses,
      anomalies,
    }
  }

  async getCostsByCategory(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ category: string; amount: number; percentage: number }>> {
    const result = await this.db.query<{ category: string; amount: string }>(
      `SELECT cost_category AS category, COALESCE(SUM(amount), 0)::text AS amount
       FROM unified_costs
       WHERE tenant_id = $1 AND transaction_date BETWEEN $2 AND $3
       GROUP BY cost_category
       ORDER BY SUM(amount) DESC`,
      [tenantId, startDate, endDate]
    )

    const total = result.rows.reduce((sum, r) => sum + toNumber(r.amount, 0), 0)
    return result.rows.map((r) => ({
      category: r.category,
      amount: toNumber(r.amount, 0),
      percentage: total > 0 ? (toNumber(r.amount, 0) / total) * 100 : 0,
    }))
  }

  async getCostsByVehicle(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ vehicleId: string; amount: number; percentage: number }>> {
    const result = await this.db.query<{ vehicle_id: string; amount: string }>(
      `SELECT vehicle_id, COALESCE(SUM(amount), 0)::text AS amount
       FROM unified_costs
       WHERE tenant_id = $1
       AND vehicle_id IS NOT NULL
       AND transaction_date BETWEEN $2 AND $3
       GROUP BY vehicle_id
       ORDER BY SUM(amount) DESC
       LIMIT 50`,
      [tenantId, startDate, endDate]
    )

    const total = result.rows.reduce((sum, r) => sum + toNumber(r.amount, 0), 0)
    return result.rows.map((r) => ({
      vehicleId: r.vehicle_id,
      amount: toNumber(r.amount, 0),
      percentage: total > 0 ? (toNumber(r.amount, 0) / total) * 100 : 0,
    }))
  }

  async forecastCosts(
    tenantId: string,
    category: string | null,
    months: number
  ): Promise<ReturnType<typeof costForecastingModel.forecastCosts>> {
    return costForecastingModel.forecastCosts(tenantId, category, months)
  }

  async getCostTrends(
    tenantId: string,
    category: string | null,
    months: number
  ): Promise<Array<{ period: string; amount: number }>> {
    const whereClause = category ? 'AND cost_category = $2' : ''
    const params = category ? [tenantId, category, months] : [tenantId, months]
    const monthParamIndex = category ? 3 : 2

    const result = await this.db.query<{ period: string; amount: string }>(
      `SELECT
         to_char(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS period,
         COALESCE(SUM(amount), 0)::text AS amount
       FROM unified_costs
       WHERE tenant_id = $1
       ${whereClause}
       AND transaction_date >= (CURRENT_DATE - (($${monthParamIndex}::int) || ' months')::interval)
       GROUP BY DATE_TRUNC('month', transaction_date)
       ORDER BY DATE_TRUNC('month', transaction_date) ASC`,
      params as any
    )

    return result.rows.map((r) => ({
      period: r.period,
      amount: toNumber(r.amount, 0),
    }))
  }

  async getAnomalies(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostSummary['anomalies']> {
    const result = await this.db.query<Pick<UnifiedCostRow, 'source_id' | 'cost_category' | 'amount' | 'description' | 'transaction_date'>>(
      `SELECT source_id, cost_category, amount::text AS amount, description, transaction_date
       FROM unified_costs
       WHERE tenant_id = $1 AND transaction_date BETWEEN $2 AND $3`,
      [tenantId, startDate, endDate]
    )

    const rows = result.rows.map((r) => ({
      id: r.source_id,
      category: r.cost_category,
      amount: toNumber((r as any).amount, 0),
      description: (r as any).description as string | null,
      date: (r as any).transaction_date as Date,
    }))

    // Per-category mean/stddev and flag z-score outliers.
    const byCategory = new Map<string, number[]>()
    for (const r of rows) {
      const arr = byCategory.get(r.category) ?? []
      arr.push(r.amount)
      byCategory.set(r.category, arr)
    }

    const stats = new Map<string, { mean: number; std: number }>()
    for (const [cat, amounts] of byCategory.entries()) {
      if (amounts.length < 3) continue
      const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length
      const variance = amounts.reduce((s, v) => s + (v - mean) * (v - mean), 0) / amounts.length
      const std = Math.sqrt(variance)
      stats.set(cat, { mean, std })
    }

    const anomalies = rows
      .map((r) => {
        const st = stats.get(r.category)
        if (!st || st.std <= 0) return null
        const z = Math.abs((r.amount - st.mean) / st.std)
        if (z <= 2.5) return null
        const reason = r.amount > st.mean
          ? `High spend vs baseline for ${r.category}`
          : `Low spend vs baseline for ${r.category}`
        return {
          id: r.id,
          amount: r.amount,
          category: r.category,
          reason,
          date: r.date,
        }
      })
      .filter(Boolean) as CostSummary['anomalies']

    anomalies.sort((a, b) => b.date.getTime() - a.date.getTime())
    return anomalies.slice(0, 20)
  }

  async getBudgetStatus(
    tenantId: string,
    fiscalYear?: number,
    fiscalQuarter?: number
  ): Promise<BudgetStatus[]> {
    const year = fiscalYear ?? new Date().getUTCFullYear()
    const quarter = fiscalQuarter ?? (Math.floor(new Date().getUTCMonth() / 3) + 1)
    const { start, end } = quarterRange(year, quarter)

    // Pull any budget rows that overlap the requested quarter.
    const budgets = await this.db.query<{
      budget_category: string
      budgeted_amount: string
      period_start: Date
      period_end: Date
      status: string
    }>(
      `SELECT budget_category, budgeted_amount::text AS budgeted_amount, period_start, period_end, status
       FROM budgets
       WHERE tenant_id = $1
       AND fiscal_year = $2
       AND status IN ('active', 'draft')
       AND period_end >= $3
       AND period_start <= $4`,
      [tenantId, year, start, end]
    )

    const allocatedByCategory = new Map<string, number>()
    for (const b of budgets.rows) {
      const prev = allocatedByCategory.get(b.budget_category) ?? 0
      allocatedByCategory.set(b.budget_category, prev + toNumber(b.budgeted_amount, 0))
    }

    // Spent from unified_costs in the quarter. We map invoice -> administrative by default.
    const spent = await this.db.query<{ budget_category: string; spent: string }>(
      `SELECT
         CASE
           WHEN cost_category = 'invoice' THEN 'administrative'
           WHEN cost_category IN ('fuel','maintenance','insurance','depreciation','parts','labor','equipment','administrative','other')
             THEN cost_category
           ELSE 'other'
         END AS budget_category,
         COALESCE(SUM(amount), 0)::text AS spent
       FROM unified_costs
       WHERE tenant_id = $1
       AND transaction_date BETWEEN $2 AND $3
       GROUP BY 1`,
      [tenantId, start, end]
    )

    const spentByCategory = new Map<string, number>(
      spent.rows.map((r) => [r.budget_category, toNumber(r.spent, 0)])
    )

    const categories = new Set<string>([
      ...Array.from(allocatedByCategory.keys()),
      ...Array.from(spentByCategory.keys()),
    ])

    const out: BudgetStatus[] = []
    for (const cat of Array.from(categories).sort()) {
      const allocated = allocatedByCategory.get(cat) ?? 0
      const s = spentByCategory.get(cat) ?? 0
      const remaining = allocated - s
      const percentageUsed = allocated > 0 ? (s / allocated) * 100 : (s > 0 ? 100 : 0)

      // Forecast spend for the quarter using last 12 months monthly trend, scaled to quarter.
      const forecast = await costForecastingModel.forecastCosts(tenantId, cat === 'administrative' ? 'invoice' : cat, 1)
      const forecastedSpend = forecast[0]?.predictedAmount ?? s

      out.push({
        category: cat,
        allocated,
        spent: s,
        remaining,
        percentageUsed,
        isOverBudget: allocated > 0 ? s > allocated : false,
        forecastedSpend,
      })
    }

    return out
  }

  async setBudgetAllocation(
    tenantId: string,
    category: string,
    amount: number,
    fiscalYear: number,
    fiscalQuarter: number
  ): Promise<void> {
    const { start, end } = quarterRange(fiscalYear, fiscalQuarter)
    // Update if exists (tenant/year/quarter/category for the "global" budget row).
    const update = await this.db.query(
      `UPDATE budgets
       SET budgeted_amount = $1, updated_at = NOW()
       WHERE tenant_id = $2
       AND fiscal_year = $3
       AND budget_period = 'quarterly'
       AND budget_category = $4
       AND department IS NULL
       AND cost_center IS NULL
       AND period_start = $5
       RETURNING id`,
      [amount, tenantId, fiscalYear, category, start]
    )

    if (update.rowCount && update.rowCount > 0) return

    await this.db.query(
      `INSERT INTO budgets (
         tenant_id, budget_name, budget_period, fiscal_year,
         period_start, period_end, department, cost_center,
         budget_category, budgeted_amount, status
       ) VALUES (
         $1, $2, 'quarterly', $3,
         $4, $5, NULL, NULL,
         $6, $7, 'active'
       )`,
      [
        tenantId,
        `Quarterly Budget (${fiscalYear} Q${fiscalQuarter})`,
        fiscalYear,
        start,
        end,
        category,
        amount,
      ]
    )
  }

  async exportCostData(tenantId: string, startDate: Date, endDate: Date): Promise<string> {
    const result = await this.db.query<{
      transaction_date: Date
      cost_category: string
      cost_subcategory: string | null
      amount: string
      description: string | null
      invoice_number: string | null
      vehicle_number: string | null
      driver_name: string | null
      vendor_name: string | null
    }>(
      `SELECT
         uc.transaction_date,
         uc.cost_category,
         uc.cost_subcategory,
         uc.amount::text AS amount,
         uc.description,
         uc.invoice_number,
         v.vehicle_number AS vehicle_number,
         d.name AS driver_name,
         vn.name AS vendor_name
       FROM unified_costs uc
       LEFT JOIN vehicles v ON uc.vehicle_id = v.id
       LEFT JOIN drivers d ON uc.driver_id = d.id
       LEFT JOIN vendors vn ON uc.vendor_id = vn.id
       WHERE uc.tenant_id = $1
       AND uc.transaction_date BETWEEN $2 AND $3
       ORDER BY uc.transaction_date DESC`,
      [tenantId, startDate, endDate]
    )

    const headers = [
      'Date',
      'Category',
      'Subcategory',
      'Amount',
      'Description',
      'Invoice',
      'Vehicle',
      'Driver',
      'Vendor',
    ]

    let csv = headers.join(',') + '\n'
    for (const row of result.rows) {
      const values = [
        row.transaction_date?.toISOString?.() ?? String(row.transaction_date),
        row.cost_category ?? '',
        row.cost_subcategory ?? '',
        row.amount ?? '0',
        row.description ?? '',
        row.invoice_number ?? '',
        row.vehicle_number ?? '',
        row.driver_name ?? '',
        row.vendor_name ?? '',
      ]
      csv += values.map((v) => `"${String(v).replace(/\"/g, '\"\"')}"`).join(',') + '\n'
    }

    return csv
  }
}

// Export singleton instance
import { pool } from '../db'
const costAnalysisService = new CostAnalysisService(pool as any)
export default costAnalysisService

