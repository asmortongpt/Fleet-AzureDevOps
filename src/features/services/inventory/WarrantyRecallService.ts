/**
 * Warranty and Recall Service - Types and Mock Implementation
 */

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  dateSubmitted: string;
  issueDescription: string;
  claimType: 'DEFECT' | 'FAILURE' | 'DAMAGE' | 'PERFORMANCE';
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  resolution?: string;
  attachments: string[];
}

export interface WarrantyNotification {
  id: string;
  type: string;
  message: string;
  acknowledged: boolean;
  date: string;
}

export interface WarrantyInfo {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  vendorId: string;
  vendorName: string;
  warrantyType: 'MANUFACTURER' | 'EXTENDED' | 'PARTS' | 'LABOR' | 'COMPREHENSIVE';
  warrantyStartDate: string;
  warrantyEndDate: string;
  coverageDetails: string;
  terms: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CLAIMED';
  claimHistory: WarrantyClaim[];
  notifications: WarrantyNotification[];
}

export interface RecallAffectedInventory {
  partId: string;
  partNumber: string;
  location: string;
  actionRequired: string;
  complianceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface VendorContact {
  name: string;
  department: string;
  email: string;
  phone: string;
}

export interface RecallInfo {
  id: string;
  recallNumber: string;
  title: string;
  description: string;
  severity: 'SAFETY' | 'PERFORMANCE' | 'QUALITY' | 'REGULATORY';
  urgency: 'IMMEDIATE' | 'URGENT' | 'MODERATE' | 'LOW';
  issuedBy: string;
  dateIssued: string;
  effectiveDate: string;
  complianceDeadline?: string;
  affectedParts: string[];
  affectedInventory: RecallAffectedInventory[];
  remedyDescription: string;
  vendorContact: VendorContact;
  status: 'ACTIVE' | 'COMPLETED' | 'SUPERSEDED';
}

export interface ClaimReason {
  reason: string;
  count: number;
}

export interface VendorPerformance {
  vendorId: string;
  vendorName: string;
  totalWarranties: number;
  claimRate: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
}

export interface WarrantyAnalytics {
  activeWarranties: number;
  expiringWithin30Days: number;
  expiringWithin90Days: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  claimSuccessRate: number;
  averageClaimProcessingTime: number;
  topClaimReasons: ClaimReason[];
  vendorPerformance: VendorPerformance[];
}

export interface RecallAnalytics {
  totalRecalls: number;
  activeRecalls: number;
  completedRecalls: number;
  affectedItemsCount: number;
  complianceRate: number;
  overdueActions: number;
  recallsBySeverity: Record<string, number>;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  warranties: WarrantyInfo[];
  recalls: RecallInfo[];
  warrantyAnalytics: WarrantyAnalytics;
  recallAnalytics: RecallAnalytics;
}

// Data storage (populated from API)
const warrantyStore: Map<string, WarrantyInfo> = new Map();
const recallStore: Map<string, RecallInfo> = new Map();

async function loadWarranties(): Promise<WarrantyInfo[]> {
  const response = await fetch('/api/warranties?limit=500', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to load warranties: ${response.statusText}`);
  }
  const payload = await response.json();
  return payload?.data || payload || [];
}

async function loadRecalls(): Promise<RecallInfo[]> {
  const response = await fetch('/api/recalls?limit=500', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to load recalls: ${response.statusText}`);
  }
  const payload = await response.json();
  return payload?.data || payload || [];
}

class WarrantyRecallServiceClass {
  warranties: Map<string, WarrantyInfo> = warrantyStore;
  recalls: Map<string, RecallInfo> = recallStore;

  async initializeWarranties(): Promise<void> {
    const warranties = await loadWarranties();
    warrantyStore.clear();
    warranties.forEach(w => warrantyStore.set(w.id, w));
    this.warranties = warrantyStore;
  }

  async initializeRecalls(): Promise<void> {
    const recalls = await loadRecalls();
    recallStore.clear();
    recalls.forEach(r => recallStore.set(r.id, r));
    this.recalls = recallStore;
  }

  async getAllWarranties(): Promise<WarrantyInfo[]> {
    return Array.from(this.warranties.values());
  }

  async getWarrantyAnalytics(): Promise<WarrantyAnalytics> {
    const warranties = Array.from(this.warranties.values());
    const now = new Date();

    const activeWarranties = warranties.filter(w => w.status === 'ACTIVE').length;
    const expiringWithin30Days = warranties.filter(w => {
      const endDate = new Date(w.warrantyEndDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 30;
    }).length;
    const expiringWithin90Days = warranties.filter(w => {
      const endDate = new Date(w.warrantyEndDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 90;
    }).length;

    const allClaims = warranties.flatMap(w => w.claimHistory);
    const approvedClaims = allClaims.filter(c => c.status === 'APPROVED' || c.status === 'RESOLVED').length;

    const claimDurations = allClaims
      .map((c: any) => {
        const submitted = new Date(c.dateSubmitted || c.submitted_at || c.created_at);
        const resolved = c.resolutionDate || c.resolved_at || c.updated_at;
        if (!resolved) return null;
        const resolvedDate = new Date(resolved);
        return Math.max(0, resolvedDate.getTime() - submitted.getTime());
      })
      .filter((d: any) => d !== null) as number[];

    const averageClaimProcessingTime = claimDurations.length > 0
      ? Math.round(claimDurations.reduce((sum, d) => sum + d, 0) / claimDurations.length / (1000 * 60 * 60 * 24))
      : 0;

    const reasonCounts = allClaims.reduce<Record<string, number>>((acc, claim) => {
      const reason = claim.claimType || (claim as any).reason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    const topClaimReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      activeWarranties,
      expiringWithin30Days,
      expiringWithin90Days,
      totalClaims: allClaims.length,
      pendingClaims: allClaims.filter(c => c.status === 'PENDING').length,
      approvedClaims,
      rejectedClaims: allClaims.filter(c => c.status === 'REJECTED').length,
      claimSuccessRate: allClaims.length > 0 ? (approvedClaims / allClaims.length) * 100 : 0,
      averageClaimProcessingTime,
      topClaimReasons,
      vendorPerformance: []
    };
  }

  async getActiveRecalls(): Promise<RecallInfo[]> {
    return Array.from(this.recalls.values()).filter(r => r.status === 'ACTIVE');
  }

  async getRecallAnalytics(): Promise<RecallAnalytics> {
    const recalls = Array.from(this.recalls.values());
    const activeRecalls = recalls.filter(r => r.status === 'ACTIVE');
    const affectedItems = activeRecalls.flatMap(r => r.affectedInventory);
    const completedItems = affectedItems.filter(i => i.complianceStatus === 'COMPLETED').length;

    return {
      totalRecalls: recalls.length,
      activeRecalls: activeRecalls.length,
      completedRecalls: recalls.filter(r => r.status === 'COMPLETED').length,
      affectedItemsCount: affectedItems.length,
      complianceRate: affectedItems.length > 0 ? (completedItems / affectedItems.length) * 100 : 100,
      overdueActions: 1,
      recallsBySeverity: {
        SAFETY: 1,
        PERFORMANCE: 0,
        QUALITY: 1,
        REGULATORY: 0
      }
    };
  }

  async submitWarrantyClaim(claim: Omit<WarrantyClaim, 'id' | 'status'>): Promise<string> {
    const claimId = `claim-${Date.now()}`;
    // In a real implementation, this would save to a database
    return claimId;
  }

  async processRecallAction(
    recallId: string,
    partId: string,
    action: { actionTaken: string; actionBy: string }
  ): Promise<void> {
    const recall = this.recalls.get(recallId);
    if (recall) {
      const item = recall.affectedInventory.find(i => i.partId === partId);
      if (item) {
        item.complianceStatus = 'COMPLETED';
      }
    }
  }

  async generateComplianceReport(): Promise<ComplianceReport> {
    const [warrantyAnalytics, recallAnalytics] = await Promise.all([
      this.getWarrantyAnalytics(),
      this.getRecallAnalytics()
    ]);

    return {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      warranties: Array.from(this.warranties.values()),
      recalls: Array.from(this.recalls.values()),
      warrantyAnalytics,
      recallAnalytics
    };
  }
}

const WarrantyRecallService = new WarrantyRecallServiceClass();
export default WarrantyRecallService;
