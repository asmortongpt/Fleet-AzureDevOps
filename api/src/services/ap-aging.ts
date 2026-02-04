/**
 * Accounts Payable Aging Service
 * Handles AP aging reports, cash flow forecasting, and payment tracking
 */

import { Pool } from 'pg';
import {
  AccountsPayable,
  APAgingReport,
  APAgingReportResponse,
  CashFlowForecast,
  CreateAccountsPayableInput,
  PaymentInput,
  APQueryOptions,
  APListResponse
} from '../types/accounts-payable';

export class APAgingService {
  constructor(private pool: Pool) {}

  /**
   * Create a new AP record
   */
  async createAP(input: CreateAccountsPayableInput): Promise<AccountsPayable> {
    const balanceRemaining = input.amount_due;

    const query = `
      INSERT INTO accounts_payable (
        tenant_id,
        invoice_id,
        vendor_id,
        invoice_number,
        invoice_date,
        due_date,
        amount_due,
        amount_paid,
        balance_remaining,
        payment_terms,
        discount_available,
        discount_date,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      input.tenant_id,
      input.invoice_id || null,
      input.vendor_id,
      input.invoice_number,
      input.invoice_date,
      input.due_date,
      input.amount_due,
      balanceRemaining,
      input.payment_terms || null,
      input.discount_available || null,
      input.discount_date || null,
      JSON.stringify(input.metadata || {})
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Record a payment against an AP record
   */
  async recordPayment(
    apId: string,
    payment: PaymentInput
  ): Promise<AccountsPayable> {
    // Get current AP record
    const getQuery = `SELECT * FROM accounts_payable WHERE id = $1`;
    const getResult = await this.pool.query(getQuery, [apId]);

    if (getResult.rows.length === 0) {
      throw new Error('AP record not found');
    }

    const ap = getResult.rows[0] as AccountsPayable;

    // Validate payment amount
    if (payment.amount_paid <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (payment.amount_paid > ap.balance_remaining) {
      throw new Error('Payment amount exceeds balance remaining');
    }

    // Calculate new amounts
    const newAmountPaid = ap.amount_paid + payment.amount_paid;
    const newBalanceRemaining = ap.amount_due - newAmountPaid;

    // Determine new status
    let newStatus: string;
    if (newBalanceRemaining === 0) {
      newStatus = 'paid';
    } else if (newBalanceRemaining < ap.amount_due) {
      newStatus = 'partially-paid';
    } else {
      newStatus = ap.status;
    }

    // Update AP record
    const updateQuery = `
      UPDATE accounts_payable
      SET amount_paid = $1,
          balance_remaining = $2,
          status = $3,
          payment_method = $4,
          payment_reference = $5,
          payment_notes = $6,
          paid_date = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const updateValues = [
      newAmountPaid,
      newBalanceRemaining,
      newStatus,
      payment.payment_method,
      payment.payment_reference || null,
      payment.payment_notes || null,
      payment.paid_date,
      apId
    ];

    const result = await this.pool.query(updateQuery, updateValues);
    return result.rows[0];
  }

  /**
   * Get list of AP records with filtering
   */
  async listAP(options: APQueryOptions): Promise<APListResponse> {
    const conditions: string[] = ['ap.tenant_id = $1'];
    const values: any[] = [options.tenant_id];
    let paramCount = 1;

    // Build WHERE clause
    if (options.vendor_id) {
      paramCount++;
      conditions.push(`ap.vendor_id = $${paramCount}`);
      values.push(options.vendor_id);
    }

    if (options.status) {
      paramCount++;
      if (Array.isArray(options.status)) {
        conditions.push(`ap.status = ANY($${paramCount})`);
        values.push(options.status);
      } else {
        conditions.push(`ap.status = $${paramCount}`);
        values.push(options.status);
      }
    }

    if (options.aging_bucket) {
      paramCount++;
      conditions.push(`ap.aging_bucket = $${paramCount}`);
      values.push(options.aging_bucket);
    }

    if (options.due_date_from) {
      paramCount++;
      conditions.push(`ap.due_date >= $${paramCount}`);
      values.push(options.due_date_from);
    }

    if (options.due_date_to) {
      paramCount++;
      conditions.push(`ap.due_date <= $${paramCount}`);
      values.push(options.due_date_to);
    }

    if (options.min_amount) {
      paramCount++;
      conditions.push(`ap.balance_remaining >= $${paramCount}`);
      values.push(options.min_amount);
    }

    if (options.max_amount) {
      paramCount++;
      conditions.push(`ap.balance_remaining <= $${paramCount}`);
      values.push(options.max_amount);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM accounts_payable ap
      WHERE ${whereClause}
    `;

    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get data with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const dataQuery = `
      SELECT ap.*, v.name as vendor_name
      FROM accounts_payable ap
      JOIN vendors v ON ap.vendor_id = v.id
      WHERE ${whereClause}
      ORDER BY ap.due_date ASC, ap.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const dataResult = await this.pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      total,
      limit,
      offset
    };
  }

  /**
   * Generate AP aging report
   */
  async generateAgingReport(tenantId: string): Promise<APAgingReportResponse> {
    // Get aging data by vendor
    const query = `
      SELECT
        ap.tenant_id,
        ap.vendor_id,
        v.name AS vendor_name,
        COUNT(*) AS total_invoices,
        SUM(ap.balance_remaining) AS total_balance,
        SUM(CASE WHEN ap.aging_bucket = 'current' THEN ap.balance_remaining ELSE 0 END) AS current_balance,
        SUM(CASE WHEN ap.aging_bucket = '1-30' THEN ap.balance_remaining ELSE 0 END) AS balance_1_30,
        SUM(CASE WHEN ap.aging_bucket = '31-60' THEN ap.balance_remaining ELSE 0 END) AS balance_31_60,
        SUM(CASE WHEN ap.aging_bucket = '61-90' THEN ap.balance_remaining ELSE 0 END) AS balance_61_90,
        SUM(CASE WHEN ap.aging_bucket = '90+' THEN ap.balance_remaining ELSE 0 END) AS balance_90_plus,
        AVG(ap.aging_days) AS avg_days_outstanding
      FROM accounts_payable ap
      JOIN vendors v ON ap.vendor_id = v.id
      WHERE ap.tenant_id = $1
        AND ap.status IN ('unpaid', 'partially-paid', 'overdue')
      GROUP BY ap.tenant_id, ap.vendor_id, v.name
      ORDER BY total_balance DESC
    `;

    const result = await this.pool.query(query, [tenantId]);
    const byVendor = result.rows.map(row => ({
      tenant_id: row.tenant_id,
      vendor_id: row.vendor_id,
      vendor_name: row.vendor_name,
      total_invoices: parseInt(row.total_invoices, 10),
      total_balance: parseFloat(row.total_balance),
      current_balance: parseFloat(row.current_balance),
      balance_1_30: parseFloat(row.balance_1_30),
      balance_31_60: parseFloat(row.balance_31_60),
      balance_61_90: parseFloat(row.balance_61_90),
      balance_90_plus: parseFloat(row.balance_90_plus),
      avg_days_outstanding: parseFloat(row.avg_days_outstanding)
    }));

    // Calculate summary totals
    const summary = {
      total_vendors: byVendor.length,
      total_invoices: byVendor.reduce((sum, v) => sum + v.total_invoices, 0),
      total_outstanding: byVendor.reduce((sum, v) => sum + v.total_balance, 0),
      current: byVendor.reduce((sum, v) => sum + v.current_balance, 0),
      days_1_30: byVendor.reduce((sum, v) => sum + v.balance_1_30, 0),
      days_31_60: byVendor.reduce((sum, v) => sum + v.balance_31_60, 0),
      days_61_90: byVendor.reduce((sum, v) => sum + v.balance_61_90, 0),
      days_90_plus: byVendor.reduce((sum, v) => sum + v.balance_90_plus, 0)
    };

    return {
      generated_at: new Date(),
      tenant_id: tenantId,
      summary,
      by_vendor: byVendor
    };
  }

  /**
   * Generate cash flow forecast
   */
  async generateCashFlowForecast(
    tenantId: string,
    daysAhead: number = 90
  ): Promise<CashFlowForecast[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const query = `
      SELECT
        DATE(due_date) as date,
        SUM(balance_remaining) as total_due,
        SUM(CASE WHEN due_date < CURRENT_DATE THEN balance_remaining ELSE 0 END) as total_overdue,
        COUNT(*) as invoice_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'vendor_id', vendor_id,
            'vendor_name', v.name,
            'amount_due', balance_remaining,
            'due_date', due_date,
            'invoice_number', invoice_number
          ) ORDER BY balance_remaining DESC
        ) as vendors
      FROM accounts_payable ap
      JOIN vendors v ON ap.vendor_id = v.id
      WHERE ap.tenant_id = $1
        AND ap.status IN ('unpaid', 'partially-paid', 'overdue')
        AND ap.due_date <= $2
      GROUP BY DATE(due_date)
      ORDER BY date ASC
    `;

    const result = await this.pool.query(query, [tenantId, endDate]);

    return result.rows.map(row => ({
      date: row.date,
      total_due: parseFloat(row.total_due),
      total_overdue: parseFloat(row.total_overdue),
      payments_scheduled: parseFloat(row.total_due) - parseFloat(row.total_overdue),
      net_cash_flow: -parseFloat(row.total_due), // Negative because it's money going out
      vendors: row.vendors
    }));
  }

  /**
   * Identify overdue invoices
   */
  async getOverdueInvoices(tenantId: string): Promise<AccountsPayable[]> {
    const query = `
      SELECT ap.*, v.name as vendor_name
      FROM accounts_payable ap
      JOIN vendors v ON ap.vendor_id = v.id
      WHERE ap.tenant_id = $1
        AND ap.status IN ('unpaid', 'partially-paid', 'overdue')
        AND ap.due_date < CURRENT_DATE
      ORDER BY ap.aging_days DESC, ap.balance_remaining DESC
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Calculate Days Payable Outstanding (DPO)
   * DPO = (Accounts Payable / Cost of Goods Sold) × Number of Days
   */
  async calculateDPO(tenantId: string, days: number = 365): Promise<number> {
    const query = `
      SELECT
        SUM(balance_remaining) as total_payables,
        (
          SELECT SUM(total_amount)
          FROM invoices
          WHERE tenant_id = $1
            AND invoice_date >= CURRENT_DATE - INTERVAL '${days} days'
        ) as total_cogs
      FROM accounts_payable
      WHERE tenant_id = $1
        AND status IN ('unpaid', 'partially-paid', 'overdue')
    `;

    const result = await this.pool.query(query, [tenantId]);
    const { total_payables, total_cogs } = result.rows[0];

    if (!total_cogs || total_cogs === 0) {
      return 0;
    }

    const dpo = (parseFloat(total_payables) / parseFloat(total_cogs)) * days;
    return Math.round(dpo * 100) / 100;
  }

  /**
   * Get payment history for a vendor
   */
  async getVendorPaymentHistory(
    vendorId: string,
    limit: number = 10
  ): Promise<AccountsPayable[]> {
    const query = `
      SELECT *
      FROM accounts_payable
      WHERE vendor_id = $1
        AND status = 'paid'
      ORDER BY paid_date DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [vendorId, limit]);
    return result.rows;
  }

  /**
   * Calculate average days to pay for a vendor
   */
  async getVendorAverageDaysToPay(vendorId: string): Promise<number> {
    const query = `
      SELECT
        AVG(paid_date - invoice_date) as avg_days
      FROM accounts_payable
      WHERE vendor_id = $1
        AND status = 'paid'
        AND paid_date IS NOT NULL
    `;

    const result = await this.pool.query(query, [vendorId]);

    if (!result.rows[0].avg_days) {
      return 0;
    }

    return Math.round(parseFloat(result.rows[0].avg_days));
  }

  /**
   * Get early payment discount opportunities
   */
  async getDiscountOpportunities(tenantId: string): Promise<AccountsPayable[]> {
    const query = `
      SELECT ap.*, v.name as vendor_name,
             (ap.discount_available) as potential_savings
      FROM accounts_payable ap
      JOIN vendors v ON ap.vendor_id = v.id
      WHERE ap.tenant_id = $1
        AND ap.status = 'unpaid'
        AND ap.discount_available > 0
        AND ap.discount_date >= CURRENT_DATE
      ORDER BY ap.discount_available DESC
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Get AP metrics dashboard
   */
  async getDashboardMetrics(tenantId: string) {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('unpaid', 'partially-paid', 'overdue')) as unpaid_count,
        SUM(balance_remaining) FILTER (WHERE status IN ('unpaid', 'partially-paid', 'overdue')) as total_outstanding,
        SUM(balance_remaining) FILTER (WHERE status = 'overdue') as total_overdue,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
        AVG(aging_days) FILTER (WHERE status IN ('unpaid', 'partially-paid', 'overdue')) as avg_days_outstanding,
        SUM(discount_available) FILTER (WHERE discount_date >= CURRENT_DATE AND status = 'unpaid') as available_discounts
      FROM accounts_payable
      WHERE tenant_id = $1
    `;

    const result = await this.pool.query(query, [tenantId]);
    const metrics = result.rows[0];

    return {
      unpaid_count: parseInt(metrics.unpaid_count || '0', 10),
      total_outstanding: parseFloat(metrics.total_outstanding || '0'),
      total_overdue: parseFloat(metrics.total_overdue || '0'),
      overdue_count: parseInt(metrics.overdue_count || '0', 10),
      avg_days_outstanding: parseFloat(metrics.avg_days_outstanding || '0'),
      available_discounts: parseFloat(metrics.available_discounts || '0')
    };
  }
}

export default APAgingService;
