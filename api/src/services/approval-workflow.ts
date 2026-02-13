/**
 * Approval Workflow Service
 * Handles multi-level purchase requisition approvals based on amount thresholds
 *
 * @module services/approval-workflow
 * @created 2026-02-02
 */

import { Pool, PoolClient } from 'pg';

import logger from '../config/logger';
import {
  PurchaseRequisition,
  ApprovalWorkflowStep,
  ApprovalResult,
  ApprovalDecisionInput,
  UnauthorizedApprovalError,
} from '../types/budgets';
import { UUID } from '../types/database-tables';

interface ApprovalThreshold {
  maxAmount: number;
  requiredRole: string;
  requiredApprovers: number;
}

export class ApprovalWorkflowService {
  private approvalThresholds: ApprovalThreshold[] = [
    { maxAmount: 1000, requiredRole: 'supervisor', requiredApprovers: 1 },
    { maxAmount: 5000, requiredRole: 'manager', requiredApprovers: 1 },
    { maxAmount: 25000, requiredRole: 'director', requiredApprovers: 1 },
    { maxAmount: 100000, requiredRole: 'vp', requiredApprovers: 1 },
    { maxAmount: Infinity, requiredRole: 'cfo', requiredApprovers: 2 },
  ];

  constructor(private pool: Pool) {}

  /**
   * Initialize approval workflow when requisition is submitted
   */
  async initializeWorkflow(
    requisitionId: UUID,
    totalAmount: number,
    tenantId: UUID
  ): Promise<ApprovalWorkflowStep[]> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Determine required approvers based on amount
      const workflow = await this.buildApprovalWorkflow(
        totalAmount,
        tenantId,
        client
      );

      // Update requisition with workflow
      await client.query(
        `UPDATE purchase_requisitions
         SET approval_workflow = $1,
             status = 'pending-approval',
             submitted_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(workflow), requisitionId]
      );

      // Send notification to first approver
      await this.sendApprovalNotification(requisitionId, workflow[0], client);

      await client.query('COMMIT');

      return workflow;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Build approval workflow based on amount thresholds
   */
  private async buildApprovalWorkflow(
    amount: number,
    tenantId: UUID,
    client: PoolClient
  ): Promise<ApprovalWorkflowStep[]> {
    const workflow: ApprovalWorkflowStep[] = [];

    // Find applicable thresholds
    for (const threshold of this.approvalThresholds) {
      if (amount <= threshold.maxAmount) {
        // Get users with required role
        const approversResult = await client.query(
          `SELECT u.id, u.email, u.full_name
           FROM users u
           JOIN user_roles ur ON u.id = ur.user_id
           WHERE u.tenant_id = $1
           AND ur.role_name = $2
           AND u.is_active = true
           LIMIT $3`,
          [tenantId, threshold.requiredRole, threshold.requiredApprovers]
        );

        for (const approver of approversResult.rows) {
          workflow.push({
            approver_id: approver.id,
            role: threshold.requiredRole,
            status: 'pending',
            threshold_amount: threshold.maxAmount,
          });
        }

        break; // Only need one threshold level
      }
    }

    if (workflow.length === 0) {
      throw new Error(
        `No approvers found for amount ${amount}. Please configure approval roles.`
      );
    }

    return workflow;
  }

  /**
   * Process approval decision
   */
  async processApproval(
    requisitionId: UUID,
    decision: ApprovalDecisionInput
  ): Promise<ApprovalResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get requisition
      const reqResult = await client.query<PurchaseRequisition>(
        'SELECT * FROM purchase_requisitions WHERE id = $1 FOR UPDATE',
        [requisitionId]
      );

      if (reqResult.rows.length === 0) {
        throw new Error(`Requisition ${requisitionId} not found`);
      }

      const requisition = reqResult.rows[0];

      // Verify user is authorized approver
      const workflow = requisition.approval_workflow as ApprovalWorkflowStep[];
      const approverStep = workflow.find(
        (step) =>
          step.approver_id === decision.approver_id && step.status === 'pending'
      );

      if (!approverStep) {
        throw new UnauthorizedApprovalError(decision.approver_id, requisitionId);
      }

      // Update workflow step
      approverStep.status = decision.decision === 'approve' ? 'approved' : 'denied';
      approverStep.date = new Date().toISOString();
      approverStep.comments = decision.comments;

      let newStatus: string;
      let nextApprover: UUID | undefined;

      if (decision.decision === 'deny') {
        // Denied - end workflow
        newStatus = 'denied';
        await client.query(
          `UPDATE purchase_requisitions
           SET status = $1,
               approval_workflow = $2,
               denied_by = $3,
               denied_at = NOW(),
               denial_reason = $4,
               updated_at = NOW()
           WHERE id = $5`,
          [
            newStatus,
            JSON.stringify(workflow),
            decision.approver_id,
            decision.comments || 'Requisition denied by approver',
            requisitionId,
          ]
        );
      } else {
        // Approved - check if more approvers needed
        const pendingSteps = workflow.filter((step) => step.status === 'pending');

        if (pendingSteps.length > 0) {
          // More approvals needed
          newStatus = 'pending-approval';
          nextApprover = pendingSteps[0].approver_id;

          await client.query(
            `UPDATE purchase_requisitions
             SET approval_workflow = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [JSON.stringify(workflow), requisitionId]
          );

          // Notify next approver
          await this.sendApprovalNotification(requisitionId, pendingSteps[0], client);
        } else {
          // All approvals complete
          newStatus = 'approved';

          await client.query(
            `UPDATE purchase_requisitions
             SET status = $1,
                 approval_workflow = $2,
                 approved_by = $3,
                 approved_at = NOW(),
                 updated_at = NOW()
             WHERE id = $4`,
            [
              newStatus,
              JSON.stringify(workflow),
              decision.approver_id,
              requisitionId,
            ]
          );

          // Notify requester
          await this.sendApprovalCompleteNotification(requisitionId, client);
        }
      }

      // Get updated requisition
      const updatedResult = await client.query<PurchaseRequisition>(
        'SELECT * FROM purchase_requisitions WHERE id = $1',
        [requisitionId]
      );

      await client.query('COMMIT');

      return {
        requisition: updatedResult.rows[0],
        approved: decision.decision === 'approve',
        next_approver: nextApprover,
        notification_sent: true,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send approval notification email
   */
  private async sendApprovalNotification(
    requisitionId: UUID,
    approver: ApprovalWorkflowStep,
    client: PoolClient
  ): Promise<void> {
    // Get requisition details
    const reqResult = await client.query(
      `SELECT pr.*, u.email as requester_email, u.full_name as requester_name
       FROM purchase_requisitions pr
       JOIN users u ON pr.requested_by = u.id
       WHERE pr.id = $1`,
      [requisitionId]
    );

    if (reqResult.rows.length === 0) return;

    const requisition = reqResult.rows[0];

    // Get approver email
    const approverResult = await client.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [approver.approver_id]
    );

    if (approverResult.rows.length === 0) return;

    const approverInfo = approverResult.rows[0];

    // Store notification in queue (actual email sending would be handled by email service)
    await client.query(
      `INSERT INTO notifications (
        tenant_id, user_id, notification_type, title, message, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        requisition.tenant_id,
        approver.approver_id,
        'purchase_requisition_approval',
        `Purchase Requisition ${requisition.requisition_number} Requires Approval`,
        `A new purchase requisition for $${requisition.total_amount} requires your approval.\n\nRequested by: ${requisition.requester_name}\nJustification: ${requisition.justification}`,
        JSON.stringify({
          requisition_id: requisitionId,
          requisition_number: requisition.requisition_number,
          amount: requisition.total_amount,
        }),
      ]
    );

    logger.info(
      `Approval notification sent to ${approverInfo.email} for requisition ${requisition.requisition_number}`
    );
  }

  /**
   * Send approval complete notification to requester
   */
  private async sendApprovalCompleteNotification(
    requisitionId: UUID,
    client: PoolClient
  ): Promise<void> {
    const reqResult = await client.query(
      `SELECT pr.*, u.email as requester_email, u.full_name as requester_name
       FROM purchase_requisitions pr
       JOIN users u ON pr.requested_by = u.id
       WHERE pr.id = $1`,
      [requisitionId]
    );

    if (reqResult.rows.length === 0) return;

    const requisition = reqResult.rows[0];

    await client.query(
      `INSERT INTO notifications (
        tenant_id, user_id, notification_type, title, message, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        requisition.tenant_id,
        requisition.requested_by,
        'purchase_requisition_approved',
        `Purchase Requisition ${requisition.requisition_number} Approved`,
        `Your purchase requisition for $${requisition.total_amount} has been fully approved and can now be converted to a purchase order.`,
        JSON.stringify({
          requisition_id: requisitionId,
          requisition_number: requisition.requisition_number,
          amount: requisition.total_amount,
        }),
      ]
    );

    logger.info(
      `Approval complete notification sent to ${requisition.requester_email} for requisition ${requisition.requisition_number}`
    );
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovalsForUser(
    userId: UUID,
    tenantId: UUID
  ): Promise<PurchaseRequisition[]> {
    const result = await this.pool.query<PurchaseRequisition>(
      `SELECT pr.*
       FROM purchase_requisitions pr
       WHERE pr.tenant_id = $1
       AND pr.status = 'pending-approval'
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(pr.approval_workflow) AS step
         WHERE (step->>'approver_id')::uuid = $2
         AND step->>'status' = 'pending'
       )
       ORDER BY pr.requisition_date ASC`,
      [tenantId, userId]
    );

    return result.rows;
  }

  /**
   * Get approval history for a requisition
   */
  async getApprovalHistory(requisitionId: UUID): Promise<ApprovalWorkflowStep[]> {
    const result = await this.pool.query<PurchaseRequisition>(
      'SELECT approval_workflow FROM purchase_requisitions WHERE id = $1',
      [requisitionId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Requisition ${requisitionId} not found`);
    }

    return (result.rows[0].approval_workflow as ApprovalWorkflowStep[]) || [];
  }

  /**
   * Cancel requisition (only if pending)
   */
  async cancelRequisition(
    requisitionId: UUID,
    cancelledBy: UUID,
    reason: string
  ): Promise<PurchaseRequisition> {
    const result = await this.pool.query<PurchaseRequisition>(
      `UPDATE purchase_requisitions
       SET status = 'cancelled',
           denial_reason = $1,
           denied_by = $2,
           denied_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       AND status IN ('draft', 'submitted', 'pending-approval')
       RETURNING *`,
      [reason, cancelledBy, requisitionId]
    );

    if (result.rows.length === 0) {
      throw new Error(
        `Requisition ${requisitionId} not found or cannot be cancelled`
      );
    }

    return result.rows[0];
  }

  /**
   * Update approval thresholds (for admin configuration)
   */
  setApprovalThresholds(thresholds: ApprovalThreshold[]): void {
    // Sort by amount ascending
    this.approvalThresholds = thresholds.sort((a, b) => a.maxAmount - b.maxAmount);
  }

  /**
   * Get current approval thresholds
   */
  getApprovalThresholds(): ApprovalThreshold[] {
    return [...this.approvalThresholds];
  }
}
