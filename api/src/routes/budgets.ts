/**
 * Budget Management & Purchase Requisitions API Routes
 * Handles budget CRUD, variance reports, requisitions, and approval workflow
 *
 * @module routes/budgets
 * @created 2026-02-02
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateJWT } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async-handler';
import { validate } from '../middleware/validate';
import {
  Budget,
  BudgetCreateInput,
  BudgetUpdateInput,
  PurchaseRequisition,
  PurchaseRequisitionCreateInput,
  PurchaseRequisitionUpdateInput,
  ApprovalDecisionInput,
  ConvertToPOInput,
  BudgetFilters,
  RequisitionFilters,
} from '../types/budgets';
import { BudgetTrackingService } from '../services/budget-tracking';
import { ApprovalWorkflowService } from '../services/approval-workflow';
import { UUID } from '../types/database-tables';

const router = Router();

// Initialize services (assuming pool is available)
let budgetTrackingService: BudgetTrackingService;
let approvalWorkflowService: ApprovalWorkflowService;

export function initializeBudgetRoutes(pool: Pool): Router {
  budgetTrackingService = new BudgetTrackingService(pool);
  approvalWorkflowService = new ApprovalWorkflowService(pool);

  // ============================================================================
  // Budget Routes
  // ============================================================================

  /**
   * GET /api/budgets
   * List budgets with filters
   */
  router.get(
    '/budgets',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      if (!tenantId) throw new Error('Tenant ID is required');

      const filters: BudgetFilters = {
        fiscal_year: req.query.fiscal_year
          ? parseInt(req.query.fiscal_year as string)
          : undefined,
        department: req.query.department as string,
        cost_center: req.query.cost_center as string,
        budget_category: req.query.budget_category as any,
        status: req.query.status as any,
      };

      const pool = (req as any).pool as Pool;
      let query = 'SELECT * FROM budgets WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      let paramCount = 1;

      if (filters.fiscal_year) {
        paramCount++;
        query += ` AND fiscal_year = $${paramCount}`;
        params.push(filters.fiscal_year);
      }

      if (filters.department) {
        paramCount++;
        query += ` AND department = $${paramCount}`;
        params.push(filters.department);
      }

      if (filters.cost_center) {
        paramCount++;
        query += ` AND cost_center = $${paramCount}`;
        params.push(filters.cost_center);
      }

      if (filters.budget_category) {
        paramCount++;
        query += ` AND budget_category = $${paramCount}`;
        params.push(filters.budget_category);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      query += ' ORDER BY period_start DESC, budget_category';

      const result = await pool.query<Budget>(query, params);

      res.json({
        data: result.rows,
        total: result.rows.length,
      });
    })
  );

  /**
   * POST /api/budgets
   * Create new budget
   */
  router.post(
    '/budgets',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const userId = (req as any).user?.id;
      if (!tenantId) throw new Error('Tenant ID is required');

      const input: BudgetCreateInput = req.body;
      const pool = (req as any).pool as Pool;

      const result = await pool.query<Budget>(
        `INSERT INTO budgets (
          tenant_id, budget_name, budget_period, fiscal_year,
          period_start, period_end, department, cost_center,
          budget_category, budgeted_amount, notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          tenantId,
          input.budget_name,
          input.budget_period,
          input.fiscal_year,
          input.period_start,
          input.period_end,
          input.department,
          input.cost_center,
          input.budget_category,
          input.budgeted_amount,
          input.notes,
          input.metadata || {},
        ]
      );

      res.status(201).json({
        data: result.rows[0],
        message: 'Budget created successfully',
      });
    })
  );

  /**
   * GET /api/budgets/:id
   * Get budget details
   */
  router.get(
    '/budgets/:id',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const budgetId = req.params.id as UUID;
      const pool = (req as any).pool as Pool;

      const result = await pool.query<Budget>(
        'SELECT * FROM budgets WHERE id = $1 AND tenant_id = $2',
        [budgetId, tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Get transaction history
      const transactions = await budgetTrackingService.getTransactionHistory(
        budgetId,
        20
      );

      // Get unacknowledged alerts
      const alerts = await budgetTrackingService.getUnacknowledgedAlerts(budgetId);

      res.json({
        data: result.rows[0],
        transactions,
        alerts,
      });
    })
  );

  /**
   * PUT /api/budgets/:id
   * Update budget
   */
  router.put(
    '/budgets/:id',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const budgetId = req.params.id as UUID;
      const input: BudgetUpdateInput = req.body;
      const pool = (req as any).pool as Pool;

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (input.budget_name !== undefined) {
        paramCount++;
        setClauses.push(`budget_name = $${paramCount}`);
        params.push(input.budget_name);
      }

      if (input.budgeted_amount !== undefined) {
        paramCount++;
        setClauses.push(`budgeted_amount = $${paramCount}`);
        params.push(input.budgeted_amount);
      }

      if (input.forecast_end_of_period !== undefined) {
        paramCount++;
        setClauses.push(`forecast_end_of_period = $${paramCount}`);
        params.push(input.forecast_end_of_period);
      }

      if (input.status !== undefined) {
        paramCount++;
        setClauses.push(`status = $${paramCount}`);
        params.push(input.status);
      }

      if (input.notes !== undefined) {
        paramCount++;
        setClauses.push(`notes = $${paramCount}`);
        params.push(input.notes);
      }

      if (input.metadata !== undefined) {
        paramCount++;
        setClauses.push(`metadata = $${paramCount}`);
        params.push(input.metadata);
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      paramCount++;
      params.push(budgetId);
      paramCount++;
      params.push(tenantId);

      const query = `
        UPDATE budgets
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query<Budget>(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      res.json({
        data: result.rows[0],
        message: 'Budget updated successfully',
      });
    })
  );

  /**
   * GET /api/budgets/variance-report
   * Get budget variance report
   */
  router.get(
    '/budgets/variance-report',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;

      const filters: BudgetFilters = {
        fiscal_year: req.query.fiscal_year
          ? parseInt(req.query.fiscal_year as string)
          : undefined,
        department: req.query.department as string,
        budget_category: req.query.budget_category as any,
        health_status: req.query.health_status as any,
      };

      const reports = await budgetTrackingService.getVarianceReport(
        tenantId,
        filters
      );

      // Calculate summary
      const summary = {
        total_budgeted: reports.reduce((sum, r) => sum + r.budgeted_amount, 0),
        total_spent: reports.reduce((sum, r) => sum + r.spent_to_date, 0),
        total_committed: reports.reduce((sum, r) => sum + r.committed_amount, 0),
        total_available: reports.reduce((sum, r) => sum + r.available_amount, 0),
        overall_variance_percentage: 0,
        budgets_on_track: reports.filter((r) => r.health_status === 'healthy')
          .length,
        budgets_at_risk: reports.filter(
          (r) => r.health_status === 'warning' || r.health_status === 'critical'
        ).length,
        budgets_over_budget: reports.filter((r) => r.health_status === 'over_budget')
          .length,
      };

      if (summary.total_budgeted > 0) {
        summary.overall_variance_percentage =
          ((summary.total_budgeted - summary.total_spent) /
            summary.total_budgeted) *
          100;
      }

      res.json({
        data: reports,
        summary,
      });
    })
  );

  // ============================================================================
  // Purchase Requisition Routes
  // ============================================================================

  /**
   * POST /api/purchase-requisitions
   * Create new purchase requisition
   */
  router.post(
    '/purchase-requisitions',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const userId = (req as any).user?.id;
      if (!tenantId) throw new Error('Tenant ID is required');

      const input: PurchaseRequisitionCreateInput = req.body;
      const pool = (req as any).pool as Pool;

      // Generate requisition number
      const reqNumberResult = await pool.query(
        `SELECT COUNT(*) as count FROM purchase_requisitions WHERE tenant_id = $1`,
        [tenantId]
      );
      const count = parseInt(reqNumberResult.rows[0].count) + 1;
      const requisition_number = `PR-${new Date().getFullYear()}-${count.toString().padStart(5, '0')}`;

      // Create requisition
      const result = await pool.query<PurchaseRequisition>(
        `INSERT INTO purchase_requisitions (
          tenant_id, requisition_number, requested_by, department, cost_center,
          needed_by_date, justification, vendor_id, suggested_vendor, line_items,
          subtotal, tax_amount, shipping_cost, total_amount, budget_id, notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          tenantId,
          requisition_number,
          input.requested_by || userId,
          input.department,
          input.cost_center,
          input.needed_by_date,
          input.justification,
          input.vendor_id,
          input.suggested_vendor,
          JSON.stringify(input.line_items),
          input.subtotal,
          input.tax_amount || 0,
          input.shipping_cost || 0,
          input.total_amount,
          input.budget_id,
          input.notes,
          input.metadata || {},
        ]
      );

      res.status(201).json({
        data: result.rows[0],
        message: 'Purchase requisition created successfully',
      });
    })
  );

  /**
   * GET /api/purchase-requisitions/:id
   * Get requisition details
   */
  router.get(
    '/purchase-requisitions/:id',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const requisitionId = req.params.id as UUID;
      const pool = (req as any).pool as Pool;

      const result = await pool.query<PurchaseRequisition>(
        'SELECT * FROM purchase_requisitions WHERE id = $1 AND tenant_id = $2',
        [requisitionId, tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase requisition not found' });
      }

      res.json({ data: result.rows[0] });
    })
  );

  /**
   * PUT /api/purchase-requisitions/:id/approve
   * Approve purchase requisition
   */
  router.put(
    '/purchase-requisitions/:id/approve',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      const requisitionId = req.params.id as UUID;
      const { comments } = req.body;

      const decision: ApprovalDecisionInput = {
        approver_id: userId,
        decision: 'approve',
        comments,
      };

      const result = await approvalWorkflowService.processApproval(
        requisitionId,
        decision
      );

      res.json({
        data: result.requisition,
        approved: result.approved,
        next_approver: result.next_approver,
        message: result.approved ? 'Requisition approved' : 'Approval recorded',
      });
    })
  );

  /**
   * PUT /api/purchase-requisitions/:id/deny
   * Deny purchase requisition
   */
  router.put(
    '/purchase-requisitions/:id/deny',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      const requisitionId = req.params.id as UUID;
      const { comments } = req.body;

      if (!comments) {
        return res
          .status(400)
          .json({ error: 'Comments are required when denying a requisition' });
      }

      const decision: ApprovalDecisionInput = {
        approver_id: userId,
        decision: 'deny',
        comments,
      };

      const result = await approvalWorkflowService.processApproval(
        requisitionId,
        decision
      );

      res.json({
        data: result.requisition,
        message: 'Requisition denied',
      });
    })
  );

  /**
   * POST /api/purchase-requisitions/:id/convert-to-po
   * Convert approved requisition to purchase order
   */
  router.post(
    '/purchase-requisitions/:id/convert-to-po',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const userId = (req as any).user?.id;
      const requisitionId = req.params.id as UUID;
      const input: ConvertToPOInput = req.body;
      const pool = (req as any).pool as Pool;

      // Get requisition
      const reqResult = await pool.query<PurchaseRequisition>(
        'SELECT * FROM purchase_requisitions WHERE id = $1 AND tenant_id = $2',
        [requisitionId, tenantId]
      );

      if (reqResult.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase requisition not found' });
      }

      const requisition = reqResult.rows[0];

      if (requisition.status !== 'approved') {
        return res.status(400).json({
          error: 'Only approved requisitions can be converted to purchase orders',
        });
      }

      // Generate PO number
      const poNumberResult = await pool.query(
        `SELECT COUNT(*) as count FROM purchase_orders WHERE tenant_id = $1`,
        [tenantId]
      );
      const count = parseInt(poNumberResult.rows[0].count) + 1;
      const po_number =
        input.purchase_order_number ||
        `PO-${new Date().getFullYear()}-${count.toString().padStart(5, '0')}`;

      // Create purchase order
      const poResult = await pool.query(
        `INSERT INTO purchase_orders (
          tenant_id, po_number, vendor_id, order_date, expected_delivery_date,
          subtotal, tax_amount, shipping_cost, total_amount, status, notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          tenantId,
          po_number,
          input.vendor_id,
          new Date(),
          input.expected_delivery_date,
          requisition.subtotal,
          requisition.tax_amount,
          requisition.shipping_cost,
          requisition.total_amount,
          'pending',
          input.notes,
          { requisition_id: requisitionId },
        ]
      );

      const purchaseOrderId = poResult.rows[0].id;

      // Update requisition
      await pool.query(
        `UPDATE purchase_requisitions
         SET status = 'converted-to-po',
             purchase_order_id = $1,
             converted_to_po_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [purchaseOrderId, requisitionId]
      );

      // Release budget commitment if exists
      if (requisition.budget_id) {
        await budgetTrackingService.releaseCommitment(
          requisition.budget_id,
          requisition.total_amount,
          'purchase_requisition',
          requisitionId,
          `Converted to PO ${po_number}`,
          userId
        );
      }

      res.json({
        data: {
          requisition_id: requisitionId,
          purchase_order_id: purchaseOrderId,
          po_number,
        },
        message: 'Purchase requisition converted to purchase order successfully',
      });
    })
  );

  /**
   * GET /api/purchase-requisitions/pending
   * Get pending approvals for current user
   */
  router.get(
    '/purchase-requisitions/pending',
    authenticateJWT,
    asyncHandler(async (req: Request, res: Response) => {
      const tenantId = (req as any).user?.tenant_id;
      const userId = (req as any).user?.id;

      const requisitions = await approvalWorkflowService.getPendingApprovalsForUser(
        userId,
        tenantId
      );

      res.json({
        data: requisitions,
        total: requisitions.length,
      });
    })
  );

  return router;
}

export default router;
