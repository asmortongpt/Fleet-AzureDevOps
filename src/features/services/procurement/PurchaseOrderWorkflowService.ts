import { secureFetch } from '@/hooks/use-api';

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
  category?: string;
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

const unwrapRows = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload?.data && Array.isArray(payload.data)) return payload.data as T[];
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data as T[];
  return [];
};

const unwrapItem = <T,>(payload: any): T | null => {
  if (!payload) return null;
  if (payload?.data && typeof payload.data === 'object') return payload.data as T;
  return payload as T;
};

const toStatus = (status?: string): POStatus => {
  const upper = (status || 'PENDING_APPROVAL').toUpperCase();
  return upper as POStatus;
};

const mapOrder = (row: any): PurchaseOrder => {
  const lineItems = Array.isArray(row.line_items) ? row.line_items : Array.isArray(row.lineItems) ? row.lineItems : [];
  const approvals = Array.isArray(row.approvals) ? row.approvals : [];
  const comments = Array.isArray(row.comments) ? row.comments : [];
  const totalAmount = Number(row.total_amount ?? row.totalAmount ?? row.calculated_total ?? 0);
  const createdDate = row.created_at ?? row.createdAt ?? row.order_date ?? new Date().toISOString();

  return {
    id: row.id,
    poNumber: row.number ?? row.po_number ?? row.poNumber ?? row.id,
    title: row.title ?? row.subject ?? row.name ?? `Purchase Order ${row.number ?? row.id}`,
    description: row.description ?? row.notes ?? row.vendor_name ?? '',
    requesterId: row.requested_by_id ?? row.requestedById ?? '',
    requesterName: row.requested_by_name ?? row.requestedByName ?? row.requester_name ?? 'CTA Procurement',
    department: row.department ?? row.requested_by_department ?? row.cost_center ?? 'Operations',
    status: toStatus(row.status ?? row.po_status),
    priority: (row.priority ?? 'MEDIUM').toUpperCase(),
    totalAmount,
    currency: row.currency ?? 'USD',
    requestedDeliveryDate: row.expected_delivery_date ?? row.expectedDeliveryDate ?? createdDate,
    createdDate,
    modifiedDate: row.updated_at ?? row.updatedAt ?? createdDate,
    lineItems: lineItems.map((item: any, idx: number) => ({
      id: item.id ?? `${row.id}-li-${idx}`,
      partNumber: item.part_number ?? item.partNumber ?? item.sku ?? '',
      description: item.description ?? item.item_name ?? '',
      quantity: Number(item.quantity ?? 0),
      unitOfMeasure: item.unit_of_measure ?? item.unitOfMeasure ?? 'EA',
      unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
      totalPrice: Number(item.line_total ?? item.totalPrice ?? 0),
      category: item.category,
      glAccount: item.gl_account ?? item.glAccount,
    })),
    approvalChain: approvals.map((approval: any, idx: number) => ({
      id: approval.id ?? `${row.id}-ap-${idx}`,
      stepNumber: approval.approval_level ?? approval.stepNumber ?? idx + 1,
      approverId: approval.approver_id ?? approval.approverId ?? '',
      approverName: approval.approver_name ?? approval.approverName ?? '',
      approverRole: approval.approver_role ?? approval.approverRole ?? '',
      status: (approval.status ?? 'PENDING').toUpperCase(),
      approvalDate: approval.approved_at ?? approval.approvalDate,
      comments: approval.comments ?? approval.comment,
      delegatedTo: approval.delegated_to ?? approval.delegatedTo,
      delegatedToName: approval.delegated_to_name ?? approval.delegatedToName,
      slaDeadline: approval.sla_deadline ?? approval.slaDeadline,
    })),
    workflow: {
      currentStep: Number(row.current_step ?? 1),
      totalSteps: Number(row.total_steps ?? approvals.length ?? 1),
      status: toStatus(row.status ?? row.po_status),
      initiatedDate: row.submitted_for_approval_at ?? createdDate,
      completedDate: row.approved_at ?? row.cancelled_at,
      slaDeadline: row.sla_deadline ?? row.slaDeadline,
      escalationLevel: Number(row.escalation_level ?? 0),
    },
    comments: comments.map((comment: any, idx: number) => ({
      id: comment.id ?? `${row.id}-comment-${idx}`,
      userId: comment.user_id ?? comment.userId ?? '',
      userName: comment.user_name ?? comment.userName ?? '',
      comment: comment.comment ?? '',
      timestamp: comment.timestamp ?? comment.created_at ?? new Date().toISOString(),
      attachments: comment.attachments,
    })),
    budgetCode: row.budget_code ?? row.budgetCode,
    vendorId: row.vendor_id ?? row.vendorId,
    vendorName: row.vendor_name ?? row.vendorName,
    contractReference: row.contract_reference ?? row.contractReference,
    attachments: row.attachments,
  } as PurchaseOrder;
};

class PurchaseOrderWorkflowService {
  async initializeData(): Promise<void> {
    // No-op: data must come from the API/DB.
  }

  async getPurchaseOrdersByStatus(status: POStatus): Promise<PurchaseOrder[]> {
    const apiStatus = status.toLowerCase();
    const res = await secureFetch(`/api/purchase-orders-enhanced?status=${apiStatus}&limit=200`);
    if (!res.ok) throw new Error('Failed to fetch purchase orders');
    const payload = await res.json();
    return unwrapRows<any>(payload).map(mapOrder);
  }

  async getPendingApprovals(_userId: string): Promise<PurchaseOrder[]> {
    const res = await secureFetch('/api/purchase-orders-enhanced?status=pending_approval&limit=200');
    if (!res.ok) throw new Error('Failed to fetch pending approvals');
    const payload = await res.json();
    return unwrapRows<any>(payload).map(mapOrder);
  }

  async getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    const res = await secureFetch('/api/purchase-orders-enhanced?limit=200');
    if (!res.ok) throw new Error('Failed to fetch purchase order analytics');
    const payload = await res.json();
    const orders = unwrapRows<any>(payload);
    const totalPOs = orders.length;
    const pendingApprovals = orders.filter((row: any) => String(row.status).toLowerCase() === 'pending_approval').length;

    return {
      totalPOs,
      pendingApprovals,
      averageApprovalTime: 0,
      approvalRateByStep: [],
      bottlenecks: [],
      budgetUtilization: [],
      complianceMetrics: {
        slaCompliance: 0,
        budgetCompliance: 0,
        procurementCompliance: 0,
      },
    };
  }

  async approvePurchaseOrder(id: string, _userId: string, comments: string): Promise<void> {
    const res = await secureFetch(`/api/purchase-orders-enhanced/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', comments })
    });
    if (!res.ok) throw new Error('Failed to approve purchase order');
  }

  async rejectPurchaseOrder(id: string, _userId: string, reason: string): Promise<void> {
    const res = await secureFetch(`/api/purchase-orders-enhanced/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', comments: reason })
    });
    if (!res.ok) throw new Error('Failed to reject purchase order');
  }

  async delegateApproval(): Promise<void> {
    throw new Error('Delegation not yet supported by backend');
  }

  async addComment(id: string, _userId: string, _userName: string, comment: string): Promise<void> {
    const res = await secureFetch(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ notes: comment })
    });
    if (!res.ok) throw new Error('Failed to add comment');
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    const res = await secureFetch(`/api/purchase-orders-enhanced/${id}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const row = unwrapItem<any>(payload);
    return row ? mapOrder(row) : null;
  }
}

export default new PurchaseOrderWorkflowService();
