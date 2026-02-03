/**
 * Budget Management & Purchase Requisitions Route Tests
 *
 * @module routes/__tests__/budgets.test
 * @created 2026-02-02
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { BudgetTrackingService } from '../../services/budget-tracking';
import { ApprovalWorkflowService } from '../../services/approval-workflow';
import {
  Budget,
  PurchaseRequisition,
  BudgetCreateInput,
  PurchaseRequisitionCreateInput,
} from '../../types/budgets';

describe('Budget Management System', () => {
  let pool: Pool;
  let budgetTrackingService: BudgetTrackingService;
  let approvalWorkflowService: ApprovalWorkflowService;
  let testTenantId: string;
  let testUserId: string;
  let testBudgetId: string;
  let testRequisitionId: string;

  beforeAll(async () => {
    // Initialize pool (use test database)
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleet_test',
      user: process.env.DB_USER || 'fleet_user',
      password: process.env.DB_PASSWORD || 'fleet_password',
    });

    budgetTrackingService = new BudgetTrackingService(pool);
    approvalWorkflowService = new ApprovalWorkflowService(pool);

    // Create test tenant and user
    const tenantResult = await pool.query(
      `INSERT INTO tenants (tenant_name, is_active) VALUES ($1, $2) RETURNING id`,
      ['Test Budget Tenant', true]
    );
    testTenantId = tenantResult.rows[0].id;

    const userResult = await pool.query(
      `INSERT INTO users (tenant_id, email, full_name, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testTenantId, 'test@budget.com', 'Test User', true]
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testTenantId) {
      await pool.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    }
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up budgets and requisitions before each test
    if (testTenantId) {
      await pool.query('DELETE FROM purchase_requisitions WHERE tenant_id = $1', [
        testTenantId,
      ]);
      await pool.query('DELETE FROM budget_transactions WHERE tenant_id = $1', [
        testTenantId,
      ]);
      await pool.query('DELETE FROM budget_alerts WHERE tenant_id = $1', [
        testTenantId,
      ]);
      await pool.query('DELETE FROM budgets WHERE tenant_id = $1', [testTenantId]);
    }
  });

  describe('Budget CRUD Operations', () => {
    it('should create a new budget', async () => {
      const budgetInput: BudgetCreateInput = {
        budget_name: 'Q1 2026 Fuel Budget',
        budget_period: 'quarterly',
        fiscal_year: 2026,
        period_start: new Date('2026-01-01'),
        period_end: new Date('2026-03-31'),
        department: 'Fleet Operations',
        cost_center: 'FLEET-001',
        budget_category: 'fuel',
        budgeted_amount: 50000,
        notes: 'First quarter fuel budget',
      };

      const result = await pool.query<Budget>(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, department, cost_center,
          budget_category, budgeted_amount, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          testTenantId,
          budgetInput.budget_name,
          budgetInput.budget_period,
          budgetInput.fiscal_year,
          budgetInput.period_start,
          budgetInput.period_end,
          budgetInput.department,
          budgetInput.cost_center,
          budgetInput.budget_category,
          budgetInput.budgeted_amount,
          budgetInput.notes,
        ]
      );

      const budget = result.rows[0];
      testBudgetId = budget.id;

      expect(budget).toBeDefined();
      expect(budget.budget_name).toBe('Q1 2026 Fuel Budget');
      expect(budget.budgeted_amount).toBe('50000.00');
      expect(budget.spent_to_date).toBe('0.00');
      expect(budget.available_amount).toBe('50000.00');
      expect(budget.status).toBe('active');
    });

    it('should retrieve budget by id', async () => {
      // Create budget first
      const createResult = await pool.query<Budget>(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, budget_category, budgeted_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testTenantId,
          'Test Budget',
          'monthly',
          2026,
          '2026-02-01',
          '2026-02-28',
          'maintenance',
          25000,
        ]
      );

      const budgetId = createResult.rows[0].id;

      // Retrieve it
      const result = await pool.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1 AND tenant_id = $2',
        [budgetId, testTenantId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].budget_name).toBe('Test Budget');
    });

    it('should update budget amounts', async () => {
      // Create budget
      const createResult = await pool.query<Budget>(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, budget_category, budgeted_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testTenantId,
          'Update Test Budget',
          'monthly',
          2026,
          '2026-02-01',
          '2026-02-28',
          'parts',
          10000,
        ]
      );

      const budgetId = createResult.rows[0].id;

      // Update it
      const result = await pool.query<Budget>(
        `UPDATE budgets SET budgeted_amount = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [15000, budgetId]
      );

      expect(result.rows[0].budgeted_amount).toBe('15000.00');
      expect(result.rows[0].available_amount).toBe('15000.00');
    });
  });

  describe('Budget Tracking Service', () => {
    beforeEach(async () => {
      // Create a test budget
      const result = await pool.query<Budget>(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, budget_category, budgeted_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testTenantId,
          'Service Test Budget',
          'monthly',
          2026,
          '2026-02-01',
          '2026-02-28',
          'fuel',
          10000,
        ]
      );
      testBudgetId = result.rows[0].id;
    });

    it('should record expense and update spent_to_date', async () => {
      const updateResult = await budgetTrackingService.recordExpense(
        testBudgetId,
        2500,
        'fuel_transaction',
        testUserId,
        'Fuel purchase for Fleet #1',
        testUserId
      );

      expect(updateResult.budget.spent_to_date).toBe('2500.00');
      expect(updateResult.budget.available_amount).toBe('7500.00');
      expect(updateResult.transaction_recorded).toBeDefined();
      expect(updateResult.transaction_recorded.transaction_type).toBe(
        'expense_recorded'
      );
    });

    it('should trigger alert at 80% threshold', async () => {
      // Spend 80% of budget
      await budgetTrackingService.recordExpense(
        testBudgetId,
        8000,
        'fuel_transaction',
        testUserId,
        'Large fuel purchase',
        testUserId
      );

      // Check for alert
      const alerts = await budgetTrackingService.getUnacknowledgedAlerts(
        testBudgetId
      );

      expect(alerts.length).toBeGreaterThan(0);
      const alert80 = alerts.find((a) => a.alert_type === 'threshold_80');
      expect(alert80).toBeDefined();
    });

    it('should calculate forecast correctly', async () => {
      // Record some expenses over time
      await budgetTrackingService.recordExpense(
        testBudgetId,
        3000,
        'fuel_transaction',
        testUserId,
        'Week 1 fuel',
        testUserId
      );

      const result = await pool.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1',
        [testBudgetId]
      );

      expect(result.rows[0].forecast_end_of_period).toBeDefined();
      expect(parseFloat(result.rows[0].forecast_end_of_period)).toBeGreaterThan(0);
    });
  });

  describe('Purchase Requisitions', () => {
    beforeEach(async () => {
      // Create a test budget for requisitions
      const result = await pool.query<Budget>(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, budget_category, budgeted_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          testTenantId,
          'Requisition Test Budget',
          'monthly',
          2026,
          '2026-02-01',
          '2026-02-28',
          'parts',
          20000,
        ]
      );
      testBudgetId = result.rows[0].id;
    });

    it('should create purchase requisition', async () => {
      const requisitionInput: PurchaseRequisitionCreateInput = {
        requested_by: testUserId,
        department: 'Fleet Maintenance',
        justification: 'Need parts for scheduled maintenance',
        line_items: [
          {
            description: 'Oil Filter',
            quantity: 10,
            unit_cost: 15.5,
            total: 155,
            part_number: 'OF-12345',
          },
          {
            description: 'Air Filter',
            quantity: 10,
            unit_cost: 22.5,
            total: 225,
            part_number: 'AF-67890',
          },
        ],
        subtotal: 380,
        tax_amount: 30.4,
        shipping_cost: 15,
        total_amount: 425.4,
        budget_id: testBudgetId,
      };

      const result = await pool.query<PurchaseRequisition>(
        `INSERT INTO purchase_requisitions (
          tenant_id, requisition_number, requested_by, department,
          justification, line_items, subtotal, tax_amount,
          shipping_cost, total_amount, budget_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          testTenantId,
          'PR-2026-00001',
          requisitionInput.requested_by,
          requisitionInput.department,
          requisitionInput.justification,
          JSON.stringify(requisitionInput.line_items),
          requisitionInput.subtotal,
          requisitionInput.tax_amount,
          requisitionInput.shipping_cost,
          requisitionInput.total_amount,
          requisitionInput.budget_id,
        ]
      );

      const requisition = result.rows[0];
      testRequisitionId = requisition.id;

      expect(requisition).toBeDefined();
      expect(requisition.requisition_number).toBe('PR-2026-00001');
      expect(requisition.status).toBe('draft');
      expect(requisition.total_amount).toBe('425.40');
    });
  });

  describe('Budget Variance Reporting', () => {
    it('should generate variance report', async () => {
      // Create multiple budgets with different consumption levels
      await pool.query(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, budget_category, budgeted_amount, spent_to_date
        ) VALUES
        ($1, 'Healthy Budget', 'monthly', 2026, '2026-02-01', '2026-02-28', 'fuel', 10000, 3000),
        ($1, 'Warning Budget', 'monthly', 2026, '2026-02-01', '2026-02-28', 'maintenance', 5000, 4000),
        ($1, 'Over Budget', 'monthly', 2026, '2026-02-01', '2026-02-28', 'parts', 3000, 3500)`,
        [testTenantId]
      );

      const report = await budgetTrackingService.getVarianceReport(testTenantId);

      expect(report.length).toBe(3);

      const healthyBudget = report.find((r) => r.budget_name === 'Healthy Budget');
      expect(healthyBudget?.health_status).toBe('healthy');

      const warningBudget = report.find((r) => r.budget_name === 'Warning Budget');
      expect(['warning', 'critical']).toContain(warningBudget?.health_status);

      const overBudget = report.find((r) => r.budget_name === 'Over Budget');
      expect(overBudget?.health_status).toBe('over_budget');
    });
  });
});
