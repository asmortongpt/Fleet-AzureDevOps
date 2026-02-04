/**
 * Budget Tracking Service
 * Handles budget updates, variance calculations, forecasting, and alert triggering
 *
 * @module services/budget-tracking
 * @created 2026-02-02
 */

import { Pool, PoolClient } from 'pg';
import {
  Budget,
  BudgetUpdateResult,
  BudgetTransaction,
  BudgetAlert,
  BudgetTransactionType,
  BudgetAlertType,
  BudgetVarianceReport,
  BudgetFilters,
} from '../types/budgets';
import { UUID } from '../types/database-tables';

export class BudgetTrackingService {
  constructor(private pool: Pool) {}

  /**
   * Record expense against a budget
   * Automatically updates spent_to_date and checks alert thresholds
   */
  async recordExpense(
    budgetId: UUID,
    amount: number,
    referenceType: string,
    referenceId: UUID,
    description: string,
    performedBy: UUID,
    client?: PoolClient
  ): Promise<BudgetUpdateResult> {
    const shouldRelease = !client;
    const conn = client || (await this.pool.connect());

    try {
      if (!client) await conn.query('BEGIN');

      // Get current budget state
      const budgetResult = await conn.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1 FOR UPDATE',
        [budgetId]
      );

      if (budgetResult.rows.length === 0) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      const budget = budgetResult.rows[0];
      const previousSpent = budget.spent_to_date;
      const newSpent = previousSpent + amount;

      // Update budget
      const updateResult = await conn.query<Budget>(
        `UPDATE budgets
         SET spent_to_date = $1,
             forecast_end_of_period = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [newSpent, this.calculateForecast(budget, newSpent), budgetId]
      );

      const updatedBudget = updateResult.rows[0];

      // Record transaction
      const transactionResult = await conn.query<BudgetTransaction>(
        `INSERT INTO budget_transactions (
          tenant_id, budget_id, transaction_type, amount,
          previous_spent, new_spent, reference_type, reference_id,
          description, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          budget.tenant_id,
          budgetId,
          'expense_recorded',
          amount,
          previousSpent,
          newSpent,
          referenceType,
          referenceId,
          description,
          performedBy,
        ]
      );

      // Check for alerts (trigger will handle this, but we query for return value)
      const alertResult = await conn.query<BudgetAlert>(
        `SELECT * FROM budget_alerts
         WHERE budget_id = $1
         AND sent_at > NOW() - INTERVAL '1 minute'
         ORDER BY sent_at DESC
         LIMIT 1`,
        [budgetId]
      );

      if (!client) await conn.query('COMMIT');

      return {
        budget: updatedBudget,
        alert_triggered: alertResult.rows[0] || undefined,
        transaction_recorded: transactionResult.rows[0],
      };
    } catch (error) {
      if (!client) await conn.query('ROLLBACK');
      throw error;
    } finally {
      if (shouldRelease) conn.release();
    }
  }

  /**
   * Record commitment (e.g., purchase requisition approved but not yet spent)
   */
  async recordCommitment(
    budgetId: UUID,
    amount: number,
    referenceType: string,
    referenceId: UUID,
    description: string,
    performedBy: UUID
  ): Promise<BudgetUpdateResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const budgetResult = await client.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1 FOR UPDATE',
        [budgetId]
      );

      if (budgetResult.rows.length === 0) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      const budget = budgetResult.rows[0];
      const previousCommitted = budget.committed_amount;
      const newCommitted = previousCommitted + amount;

      // Check if commitment would exceed available budget
      const wouldExceed =
        budget.budgeted_amount < budget.spent_to_date + newCommitted;
      if (wouldExceed) {
        throw new Error(
          `Commitment would exceed budget. Available: ${budget.available_amount}, Requested: ${amount}`
        );
      }

      const updateResult = await client.query<Budget>(
        `UPDATE budgets
         SET committed_amount = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newCommitted, budgetId]
      );

      const transactionResult = await client.query<BudgetTransaction>(
        `INSERT INTO budget_transactions (
          tenant_id, budget_id, transaction_type, amount,
          previous_committed, new_committed, reference_type, reference_id,
          description, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          budget.tenant_id,
          budgetId,
          'commitment',
          amount,
          previousCommitted,
          newCommitted,
          referenceType,
          referenceId,
          description,
          performedBy,
        ]
      );

      await client.query('COMMIT');

      return {
        budget: updateResult.rows[0],
        transaction_recorded: transactionResult.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release commitment (e.g., purchase requisition denied or converted to PO)
   */
  async releaseCommitment(
    budgetId: UUID,
    amount: number,
    referenceType: string,
    referenceId: UUID,
    description: string,
    performedBy: UUID
  ): Promise<BudgetUpdateResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const budgetResult = await client.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1 FOR UPDATE',
        [budgetId]
      );

      if (budgetResult.rows.length === 0) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      const budget = budgetResult.rows[0];
      const previousCommitted = budget.committed_amount;
      const newCommitted = Math.max(0, previousCommitted - amount);

      const updateResult = await client.query<Budget>(
        `UPDATE budgets
         SET committed_amount = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newCommitted, budgetId]
      );

      const transactionResult = await client.query<BudgetTransaction>(
        `INSERT INTO budget_transactions (
          tenant_id, budget_id, transaction_type, amount,
          previous_committed, new_committed, reference_type, reference_id,
          description, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          budget.tenant_id,
          budgetId,
          'commitment_release',
          -amount,
          previousCommitted,
          newCommitted,
          referenceType,
          referenceId,
          description,
          performedBy,
        ]
      );

      await client.query('COMMIT');

      return {
        budget: updateResult.rows[0],
        transaction_recorded: transactionResult.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate forecast for end of period based on current spending rate
   */
  private calculateForecast(budget: Budget, currentSpent: number): number {
    const now = new Date();
    const periodStart = new Date(budget.period_start);
    const periodEnd = new Date(budget.period_end);

    const totalDays =
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays =
      (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = totalDays - elapsedDays;

    if (remainingDays <= 0) {
      return currentSpent; // Period ended
    }

    if (elapsedDays <= 0) {
      return 0; // Period not started
    }

    // Calculate daily burn rate
    const dailyBurnRate = currentSpent / elapsedDays;

    // Forecast = current spent + (daily burn rate * remaining days)
    const forecast = currentSpent + dailyBurnRate * remainingDays;

    return Math.round(forecast * 100) / 100;
  }

  /**
   * Get variance report for multiple budgets
   */
  async getVarianceReport(
    tenantId: UUID,
    filters?: BudgetFilters
  ): Promise<BudgetVarianceReport[]> {
    let query = `
      SELECT * FROM budget_variance_report
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 1;

    if (filters?.fiscal_year) {
      paramCount++;
      query += ` AND fiscal_year = $${paramCount}`;
      params.push(filters.fiscal_year);
    }

    if (filters?.department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(filters.department);
    }

    if (filters?.budget_category) {
      paramCount++;
      query += ` AND budget_category = $${paramCount}`;
      params.push(filters.budget_category);
    }

    if (filters?.health_status) {
      paramCount++;
      query += ` AND health_status = $${paramCount}`;
      params.push(filters.health_status);
    }

    query += ' ORDER BY consumption_percentage DESC';

    const result = await this.pool.query<BudgetVarianceReport>(query, params);
    return result.rows;
  }

  /**
   * Check if budget has sufficient funds
   */
  async checkBudgetAvailability(
    budgetId: UUID,
    requestedAmount: number
  ): Promise<{ available: boolean; budget: Budget; shortfall?: number }> {
    const result = await this.pool.query<Budget>(
      'SELECT * FROM budgets WHERE id = $1',
      [budgetId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    const budget = result.rows[0];
    const available = budget.available_amount >= requestedAmount;
    const shortfall = available ? undefined : requestedAmount - budget.available_amount;

    return { available, budget, shortfall };
  }

  /**
   * Acknowledge budget alert
   */
  async acknowledgeAlert(
    alertId: UUID,
    acknowledgedBy: UUID
  ): Promise<BudgetAlert> {
    const result = await this.pool.query<BudgetAlert>(
      `UPDATE budget_alerts
       SET acknowledged = true,
           acknowledged_by = $1,
           acknowledged_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [acknowledgedBy, alertId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Alert ${alertId} not found`);
    }

    return result.rows[0];
  }

  /**
   * Get budget transaction history
   */
  async getTransactionHistory(
    budgetId: UUID,
    limit = 50
  ): Promise<BudgetTransaction[]> {
    const result = await this.pool.query<BudgetTransaction>(
      `SELECT * FROM budget_transactions
       WHERE budget_id = $1
       ORDER BY transaction_date DESC
       LIMIT $2`,
      [budgetId, limit]
    );

    return result.rows;
  }

  /**
   * Get unacknowledged alerts for a budget
   */
  async getUnacknowledgedAlerts(budgetId: UUID): Promise<BudgetAlert[]> {
    const result = await this.pool.query<BudgetAlert>(
      `SELECT * FROM budget_alerts
       WHERE budget_id = $1 AND acknowledged = false
       ORDER BY sent_at DESC`,
      [budgetId]
    );

    return result.rows;
  }

  /**
   * Adjust budget allocation
   */
  async adjustBudget(
    budgetId: UUID,
    newAmount: number,
    reason: string,
    performedBy: UUID
  ): Promise<BudgetUpdateResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const budgetResult = await client.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1 FOR UPDATE',
        [budgetId]
      );

      if (budgetResult.rows.length === 0) {
        throw new Error(`Budget ${budgetId} not found`);
      }

      const budget = budgetResult.rows[0];
      const previousAmount = budget.budgeted_amount;
      const adjustmentAmount = newAmount - previousAmount;

      const updateResult = await client.query<Budget>(
        `UPDATE budgets
         SET budgeted_amount = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newAmount, budgetId]
      );

      const transactionResult = await client.query<BudgetTransaction>(
        `INSERT INTO budget_transactions (
          tenant_id, budget_id, transaction_type, amount,
          description, performed_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [budget.tenant_id, budgetId, 'adjustment', adjustmentAmount, reason, performedBy]
      );

      await client.query('COMMIT');

      return {
        budget: updateResult.rows[0],
        transaction_recorded: transactionResult.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
