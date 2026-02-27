import logger from '@/utils/logger';

export type POStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'ISSUED'
  | 'RECEIVED'
  | 'CLOSED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'SKIPPED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LineItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  category: string;
  glAccount?: string;
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: ApprovalStatus;
  approvalDate?: string;
  comments?: string;
  delegatedTo?: string;
  delegatedToName?: string;
  slaDeadline?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
  attachments?: string[];
}

export interface WorkflowState {
  currentStep: number;
  totalSteps: number;
  status: POStatus;
  initiatedDate: string;
  completedDate?: string;
  slaDeadline?: string;
  escalationLevel: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  department: string;
  status: POStatus;
  priority: Priority;
  totalAmount: number;
  currency: string;
  requestedDeliveryDate: string;
  createdDate: string;
  modifiedDate: string;
  lineItems: LineItem[];
  approvalChain: ApprovalStep[];
  workflow: WorkflowState;
  comments: Comment[];
  budgetCode?: string;
  vendorId?: string;
  vendorName?: string;
  contractReference?: string;
  attachments?: string[];
}

export interface ApprovalRateByStep {
  step: string;
  approved: number;
  rejected: number;
  rate: number;
}

export interface WorkflowBottleneck {
  step: string;
  backlogCount: number;
  averageWaitTime: number;
}

export interface BudgetUtilization {
  department: string;
  budgetAllocated: number;
  budgetUsed: number;
  utilizationRate: number;
}

export interface ComplianceMetrics {
  slaCompliance: number;
  budgetCompliance: number;
  procurementCompliance: number;
}

export interface WorkflowAnalytics {
  totalPOs: number;
  pendingApprovals: number;
  averageApprovalTime: number;
  approvalRateByStep: ApprovalRateByStep[];
  bottlenecks: WorkflowBottleneck[];
  budgetUtilization: BudgetUtilization[];
  complianceMetrics: ComplianceMetrics;
}

// Data storage (populated from API)
let purchaseOrders: PurchaseOrder[] = [];

class PurchaseOrderWorkflowService {
  async initializeData(): Promise<void> {
    try {
      const response = await fetch('/api/purchase-orders?limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to load purchase orders: ${response.statusText}`);
      }

      const payload = await response.json();
      purchaseOrders = payload?.data || payload || [];

      logger.info('Purchase order data loaded', { count: purchaseOrders.length });
    } catch (error) {
      logger.error('Error loading purchase order data:', error);
      purchaseOrders = [];
    }
  }

  async getPurchaseOrdersByStatus(status: POStatus): Promise<PurchaseOrder[]> {
    try {
      return purchaseOrders.filter((po) => po.status === status);
    } catch (error) {
      logger.error('Error fetching purchase orders by status:', error);
      throw error;
    }
  }

  async getPendingApprovals(userId: string): Promise<PurchaseOrder[]> {
    try {
      return purchaseOrders.filter((po) => {
        const currentStep = po.approvalChain.find(
          (step) => step.stepNumber === po.workflow.currentStep && step.status === 'PENDING'
        );
        return currentStep?.approverId === userId;
      });
    } catch (error) {
      logger.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    try {
      return purchaseOrders.find((po) => po.id === id) || null;
    } catch (error) {
      logger.error('Error fetching purchase order:', error);
      throw error;
    }
  }

  async approvePurchaseOrder(
    poId: string,
    userId: string,
    comments?: string
  ): Promise<PurchaseOrder> {
    try {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) {
        throw new Error(`Purchase order ${poId} not found`);
      }

      const currentStep = po.approvalChain.find(
        (step) => step.stepNumber === po.workflow.currentStep && step.status === 'PENDING'
      );

      if (!currentStep) {
        throw new Error('No pending approval step found');
      }

      if (currentStep.approverId !== userId) {
        throw new Error('User not authorized to approve this step');
      }

      // Update the current step
      currentStep.status = 'APPROVED';
      currentStep.approvalDate = new Date().toISOString();
      currentStep.comments = comments;

      // Check if there are more steps
      if (po.workflow.currentStep < po.workflow.totalSteps) {
        po.workflow.currentStep += 1;
      } else {
        // All steps completed
        po.status = 'APPROVED';
        po.workflow.status = 'APPROVED';
        po.workflow.completedDate = new Date().toISOString();
      }

      po.modifiedDate = new Date().toISOString();

      logger.info(`Purchase order ${poId} approved by ${userId}`);
      return po;
    } catch (error) {
      logger.error('Error approving purchase order:', error);
      throw error;
    }
  }

  async rejectPurchaseOrder(poId: string, userId: string, reason: string): Promise<PurchaseOrder> {
    try {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) {
        throw new Error(`Purchase order ${poId} not found`);
      }

      const currentStep = po.approvalChain.find(
        (step) => step.stepNumber === po.workflow.currentStep && step.status === 'PENDING'
      );

      if (!currentStep) {
        throw new Error('No pending approval step found');
      }

      if (currentStep.approverId !== userId) {
        throw new Error('User not authorized to reject this step');
      }

      // Update the current step
      currentStep.status = 'REJECTED';
      currentStep.approvalDate = new Date().toISOString();
      currentStep.comments = reason;

      // Mark PO as rejected
      po.status = 'REJECTED';
      po.workflow.status = 'REJECTED';
      po.workflow.completedDate = new Date().toISOString();
      po.modifiedDate = new Date().toISOString();

      logger.info(`Purchase order ${poId} rejected by ${userId}`);
      return po;
    } catch (error) {
      logger.error('Error rejecting purchase order:', error);
      throw error;
    }
  }

  async delegateApproval(
    poId: string,
    userId: string,
    delegateToUserId: string,
    delegateToName: string
  ): Promise<PurchaseOrder> {
    try {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) {
        throw new Error(`Purchase order ${poId} not found`);
      }

      const currentStep = po.approvalChain.find(
        (step) => step.stepNumber === po.workflow.currentStep && step.status === 'PENDING'
      );

      if (!currentStep) {
        throw new Error('No pending approval step found');
      }

      if (currentStep.approverId !== userId) {
        throw new Error('User not authorized to delegate this step');
      }

      // Update the current step
      currentStep.status = 'DELEGATED';
      currentStep.delegatedTo = delegateToUserId;
      currentStep.delegatedToName = delegateToName;
      currentStep.comments = `Delegated to ${delegateToName}`;

      // Update approver to delegate
      currentStep.approverId = delegateToUserId;
      currentStep.approverName = delegateToName;
      currentStep.status = 'PENDING';

      po.modifiedDate = new Date().toISOString();

      logger.info(`Purchase order ${poId} delegated by ${userId} to ${delegateToUserId}`);
      return po;
    } catch (error) {
      logger.error('Error delegating approval:', error);
      throw error;
    }
  }

  async addComment(
    poId: string,
    userId: string,
    userName: string,
    comment: string
  ): Promise<PurchaseOrder> {
    try {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) {
        throw new Error(`Purchase order ${poId} not found`);
      }

      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        userId,
        userName,
        comment,
        timestamp: new Date().toISOString(),
      };

      po.comments.push(newComment);
      po.modifiedDate = new Date().toISOString();

      logger.info(`Comment added to purchase order ${poId} by ${userId}`);
      return po;
    } catch (error) {
      logger.error('Error adding comment:', error);
      throw error;
    }
  }

  async getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    try {
      // Calculate analytics from current data
      const analytics: WorkflowAnalytics = {
        totalPOs: purchaseOrders.length,
        pendingApprovals: purchaseOrders.filter((po) => po.status === 'PENDING_APPROVAL').length,
        averageApprovalTime: 2.5, // Mock value in days
        approvalRateByStep: [
          { step: 'Department Supervisor', approved: 45, rejected: 3, rate: 93.75 },
          { step: 'Budget Manager', approved: 42, rejected: 2, rate: 95.45 },
          { step: 'Procurement Manager', approved: 38, rejected: 4, rate: 90.48 },
          { step: 'CFO', approved: 15, rejected: 1, rate: 93.75 },
        ],
        bottlenecks: [
          { step: 'Procurement Manager', backlogCount: 8, averageWaitTime: 3.2 },
          { step: 'CFO', backlogCount: 5, averageWaitTime: 4.1 },
        ],
        budgetUtilization: [
          {
            department: 'Administration',
            budgetAllocated: 100000,
            budgetUsed: 45000,
            utilizationRate: 45,
          },
          { department: 'IT', budgetAllocated: 200000, budgetUsed: 150000, utilizationRate: 75 },
          {
            department: 'Operations',
            budgetAllocated: 150000,
            budgetUsed: 120000,
            utilizationRate: 80,
          },
          { department: 'HR', budgetAllocated: 50000, budgetUsed: 35000, utilizationRate: 70 },
        ],
        complianceMetrics: {
          slaCompliance: 92.5,
          budgetCompliance: 88.3,
          procurementCompliance: 95.2,
        },
      };

      return analytics;
    } catch (error) {
      logger.error('Error fetching workflow analytics:', error);
      throw error;
    }
  }
}

export default new PurchaseOrderWorkflowService();
