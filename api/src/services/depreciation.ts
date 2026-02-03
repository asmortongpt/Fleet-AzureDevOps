/**
 * Depreciation Service
 * Handles depreciation calculations for assets and vehicles
 * Supports multiple depreciation methods: straight-line, declining-balance, units-of-production
 */

import { Pool } from 'pg';
import {
  AssetDepreciation,
  DepreciationSchedule,
  DepreciationCalculationResult,
  CreateDepreciationInput,
  DepreciationMethod,
  MonthlyDepreciationJournal
} from '../types/accounts-payable';

export class DepreciationService {
  constructor(private pool: Pool) {}

  /**
   * Calculate straight-line depreciation
   * Formula: (Cost - Salvage Value) / Useful Life
   */
  calculateStraightLine(
    originalCost: number,
    salvageValue: number,
    usefulLifeYears: number
  ): number {
    if (usefulLifeYears <= 0) {
      throw new Error('Useful life must be greater than 0');
    }

    const depreciableAmount = originalCost - salvageValue;
    const annualDepreciation = depreciableAmount / usefulLifeYears;

    return Math.round(annualDepreciation * 100) / 100;
  }

  /**
   * Calculate declining-balance depreciation (double-declining method)
   * Formula: Book Value × (2 / Useful Life)
   */
  calculateDecliningBalance(
    bookValue: number,
    salvageValue: number,
    usefulLifeYears: number,
    rate: number = 2 // Double-declining by default
  ): number {
    if (usefulLifeYears <= 0) {
      throw new Error('Useful life must be greater than 0');
    }

    const depreciationRate = rate / usefulLifeYears;
    const depreciation = bookValue * depreciationRate;

    // Ensure we don't depreciate below salvage value
    const maxDepreciation = Math.max(0, bookValue - salvageValue);
    const finalDepreciation = Math.min(depreciation, maxDepreciation);

    return Math.round(finalDepreciation * 100) / 100;
  }

  /**
   * Calculate units-of-production depreciation
   * Formula: (Cost - Salvage Value) × (Units Used / Total Estimated Units)
   */
  calculateUnitsOfProduction(
    originalCost: number,
    salvageValue: number,
    totalEstimatedUnits: number,
    unitsUsedInPeriod: number
  ): number {
    if (totalEstimatedUnits <= 0) {
      throw new Error('Total estimated units must be greater than 0');
    }

    const depreciableAmount = originalCost - salvageValue;
    const depreciationPerUnit = depreciableAmount / totalEstimatedUnits;
    const periodDepreciation = depreciationPerUnit * unitsUsedInPeriod;

    return Math.round(periodDepreciation * 100) / 100;
  }

  /**
   * Create or update depreciation record for an asset
   */
  async createDepreciation(
    input: CreateDepreciationInput
  ): Promise<AssetDepreciation> {
    // Validate input
    if (!input.asset_id && !input.vehicle_id) {
      throw new Error('Either asset_id or vehicle_id must be provided');
    }

    if (input.asset_id && input.vehicle_id) {
      throw new Error('Cannot provide both asset_id and vehicle_id');
    }

    // Calculate depreciation per year or unit based on method
    let depreciationPerYear: number | null = null;
    let depreciationPerUnit: number | null = null;

    if (input.depreciation_method === 'straight-line') {
      if (!input.useful_life_years) {
        throw new Error('useful_life_years required for straight-line method');
      }
      depreciationPerYear = this.calculateStraightLine(
        input.original_cost,
        input.salvage_value,
        input.useful_life_years
      );
    } else if (input.depreciation_method === 'units-of-production') {
      if (!input.useful_life_units) {
        throw new Error('useful_life_units required for units-of-production method');
      }
      depreciationPerUnit = (input.original_cost - input.salvage_value) / input.useful_life_units;
    }

    const query = `
      INSERT INTO asset_depreciation (
        tenant_id,
        asset_id,
        vehicle_id,
        depreciation_method,
        original_cost,
        salvage_value,
        useful_life_years,
        useful_life_units,
        start_date,
        depreciation_per_year,
        depreciation_per_unit,
        total_depreciation,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12)
      RETURNING *
    `;

    const values = [
      input.tenant_id,
      input.asset_id || null,
      input.vehicle_id || null,
      input.depreciation_method,
      input.original_cost,
      input.salvage_value,
      input.useful_life_years || null,
      input.useful_life_units || null,
      input.start_date,
      depreciationPerYear,
      depreciationPerUnit,
      input.notes || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Calculate and record depreciation for a specific period
   */
  async calculatePeriodDepreciation(
    assetDepreciationId: string,
    periodStart: Date,
    periodEnd: Date,
    unitsUsed?: number
  ): Promise<DepreciationCalculationResult> {
    // Get depreciation record
    const depQuery = `
      SELECT * FROM asset_depreciation WHERE id = $1
    `;
    const depResult = await this.pool.query(depQuery, [assetDepreciationId]);

    if (depResult.rows.length === 0) {
      throw new Error('Depreciation record not found');
    }

    const depreciation = depResult.rows[0] as AssetDepreciation;

    // Calculate beginning book value
    const beginningBookValue = depreciation.original_cost - depreciation.total_depreciation;

    let depreciationExpense = 0;

    // Calculate depreciation based on method
    if (depreciation.depreciation_method === 'straight-line') {
      // Calculate monthly depreciation
      const monthsDiff = this.getMonthsDifference(periodStart, periodEnd);
      depreciationExpense = (depreciation.depreciation_per_year || 0) * (monthsDiff / 12);
    } else if (depreciation.depreciation_method === 'declining-balance') {
      const yearsDiff = this.getYearsDifference(periodStart, periodEnd);
      depreciationExpense = this.calculateDecliningBalance(
        beginningBookValue,
        depreciation.salvage_value,
        depreciation.useful_life_years || 1,
        2
      ) * yearsDiff;
    } else if (depreciation.depreciation_method === 'units-of-production') {
      if (!unitsUsed) {
        throw new Error('unitsUsed required for units-of-production method');
      }
      depreciationExpense = (depreciation.depreciation_per_unit || 0) * unitsUsed;
    }

    // Ensure we don't depreciate below salvage value
    const maxDepreciation = Math.max(0, beginningBookValue - depreciation.salvage_value);
    depreciationExpense = Math.min(depreciationExpense, maxDepreciation);

    const accumulatedDepreciation = depreciation.total_depreciation + depreciationExpense;
    const endingBookValue = depreciation.original_cost - accumulatedDepreciation;

    // Insert schedule entry
    const scheduleQuery = `
      INSERT INTO depreciation_schedule (
        tenant_id,
        asset_depreciation_id,
        period_start,
        period_end,
        beginning_book_value,
        depreciation_expense,
        accumulated_depreciation,
        ending_book_value,
        units_used,
        is_actual
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *
    `;

    const scheduleValues = [
      depreciation.tenant_id,
      assetDepreciationId,
      periodStart,
      periodEnd,
      beginningBookValue,
      depreciationExpense,
      accumulatedDepreciation,
      endingBookValue,
      unitsUsed || null
    ];

    const scheduleResult = await this.pool.query(scheduleQuery, scheduleValues);

    // Update depreciation record
    const updateQuery = `
      UPDATE asset_depreciation
      SET total_depreciation = $1,
          last_calculated_date = $2,
          updated_at = NOW()
      WHERE id = $3
    `;

    await this.pool.query(updateQuery, [
      accumulatedDepreciation,
      periodEnd,
      assetDepreciationId
    ]);

    return {
      asset_depreciation_id: assetDepreciationId,
      period_start: periodStart,
      period_end: periodEnd,
      depreciation_expense: depreciationExpense,
      accumulated_depreciation: accumulatedDepreciation,
      book_value: endingBookValue,
      schedule_entries: [scheduleResult.rows[0]]
    };
  }

  /**
   * Generate monthly depreciation journal entries for a period
   */
  async generateMonthlyJournal(
    tenantId: string,
    year: number,
    month: number
  ): Promise<MonthlyDepreciationJournal> {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // Last day of month

    // Get all active depreciations for tenant
    const query = `
      SELECT
        ad.*,
        COALESCE(a.name, v.make || ' ' || v.model) as asset_name
      FROM asset_depreciation ad
      LEFT JOIN assets a ON ad.asset_id = a.id
      LEFT JOIN vehicles v ON ad.vehicle_id = v.id
      WHERE ad.tenant_id = $1
        AND ad.start_date <= $2
      ORDER BY asset_name
    `;

    const result = await this.pool.query(query, [tenantId, periodEnd]);
    const depreciations = result.rows;

    const entries = [];
    let totalMonthlyExpense = 0;

    for (const dep of depreciations) {
      // Calculate monthly depreciation
      let monthlyExpense = 0;

      if (dep.depreciation_method === 'straight-line') {
        monthlyExpense = (dep.depreciation_per_year || 0) / 12;
      } else if (dep.depreciation_method === 'declining-balance') {
        const currentBookValue = dep.original_cost - dep.total_depreciation;
        const annualExpense = this.calculateDecliningBalance(
          currentBookValue,
          dep.salvage_value,
          dep.useful_life_years || 1
        );
        monthlyExpense = annualExpense / 12;
      } else if (dep.depreciation_method === 'units-of-production') {
        // For units-of-production, we need actual usage data
        // This would need to be calculated based on actual miles/hours used
        // For now, skip or use estimated monthly usage
        continue;
      }

      const accumulatedDepreciation = dep.total_depreciation + monthlyExpense;
      const bookValue = dep.original_cost - accumulatedDepreciation;

      entries.push({
        asset_id: dep.asset_id || dep.vehicle_id,
        asset_name: dep.asset_name,
        depreciation_expense: monthlyExpense,
        accumulated_depreciation: accumulatedDepreciation,
        book_value: bookValue
      });

      totalMonthlyExpense += monthlyExpense;
    }

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      entries,
      total_monthly_expense: Math.round(totalMonthlyExpense * 100) / 100
    };
  }

  /**
   * Get depreciation schedule for an asset
   */
  async getDepreciationSchedule(
    assetDepreciationId: string
  ): Promise<DepreciationSchedule[]> {
    const query = `
      SELECT * FROM depreciation_schedule
      WHERE asset_depreciation_id = $1
      ORDER BY period_start ASC
    `;

    const result = await this.pool.query(query, [assetDepreciationId]);
    return result.rows;
  }

  /**
   * Project future depreciation schedule
   */
  async projectDepreciationSchedule(
    assetDepreciationId: string,
    numberOfPeriods: number = 12
  ): Promise<DepreciationSchedule[]> {
    const depQuery = `
      SELECT * FROM asset_depreciation WHERE id = $1
    `;
    const depResult = await this.pool.query(depQuery, [assetDepreciationId]);

    if (depResult.rows.length === 0) {
      throw new Error('Depreciation record not found');
    }

    const depreciation = depResult.rows[0] as AssetDepreciation;
    const schedule: DepreciationSchedule[] = [];

    let currentBookValue = depreciation.original_cost - depreciation.total_depreciation;
    let accumulatedDepreciation = depreciation.total_depreciation;
    let currentDate = new Date();

    for (let i = 0; i < numberOfPeriods; i++) {
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0);

      let monthlyExpense = 0;

      if (depreciation.depreciation_method === 'straight-line') {
        monthlyExpense = (depreciation.depreciation_per_year || 0) / 12;
      } else if (depreciation.depreciation_method === 'declining-balance') {
        const annualExpense = this.calculateDecliningBalance(
          currentBookValue,
          depreciation.salvage_value,
          depreciation.useful_life_years || 1
        );
        monthlyExpense = annualExpense / 12;
      }

      // Ensure we don't go below salvage value
      const maxExpense = Math.max(0, currentBookValue - depreciation.salvage_value);
      monthlyExpense = Math.min(monthlyExpense, maxExpense);

      accumulatedDepreciation += monthlyExpense;
      const endingBookValue = depreciation.original_cost - accumulatedDepreciation;

      schedule.push({
        id: `projected-${i}`,
        tenant_id: depreciation.tenant_id,
        asset_depreciation_id: assetDepreciationId,
        period_start: periodStart,
        period_end: periodEnd,
        beginning_book_value: currentBookValue,
        depreciation_expense: monthlyExpense,
        accumulated_depreciation: accumulatedDepreciation,
        ending_book_value: endingBookValue,
        units_used: null,
        is_actual: false,
        notes: null,
        metadata: {},
        created_at: new Date()
      });

      currentBookValue = endingBookValue;

      // Stop if we've reached salvage value
      if (currentBookValue <= depreciation.salvage_value) {
        break;
      }
    }

    return schedule;
  }

  /**
   * Helper: Calculate months difference between two dates
   */
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth());

    return Math.max(1, months); // At least 1 month
  }

  /**
   * Helper: Calculate years difference between two dates
   */
  private getYearsDifference(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    return Math.max(0.0833, years); // At least 1 month (0.0833 years)
  }

  /**
   * Get summary of all depreciations for a tenant
   */
  async getDepreciationSummary(tenantId: string) {
    const query = `
      SELECT
        depreciation_method,
        COUNT(*) as total_assets,
        SUM(original_cost) as total_original_cost,
        SUM(total_depreciation) as total_accumulated_depreciation,
        SUM(current_book_value) as total_book_value,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date))) as avg_age_years
      FROM asset_depreciation
      WHERE tenant_id = $1
      GROUP BY depreciation_method
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}

export default DepreciationService;
