/**
 * Warranty and Recall Management Service
 * Handles warranty tracking, claim processing, recall management, and compliance
 */

export interface WarrantyInfo {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  vendorId: string;
  vendorName: string;
  warrantyType: 'MANUFACTURER' | 'EXTENDED' | 'THIRD_PARTY' | 'CUSTOM';
  status: 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'VOID';
  warrantyStartDate: string;
  warrantyEndDate: string;
  coverageDetails: string;
  termsAndConditions: string;
  claimHistory: WarrantyClaim[];
  notifications: WarrantyNotification[];
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  dateSubmitted: string;
  issueDescription: string;
  claimType: 'DEFECT' | 'FAILURE' | 'DAMAGE' | 'PERFORMANCE';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'RESOLVED';
  resolution?: string;
  resolvedDate?: string;
  attachments: string[];
}

export interface WarrantyNotification {
  id: string;
  type: 'EXPIRING' | 'EXPIRED' | 'CLAIM_UPDATE' | 'REMINDER';
  message: string;
  date: string;
  acknowledged: boolean;
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
  affectedInventory: AffectedInventoryItem[];
  remedyDescription: string;
  vendorContact: VendorContact;
}

export interface AffectedInventoryItem {
  partId: string;
  partNumber: string;
  location: string;
  actionRequired: string;
  complianceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  actionTaken?: string;
  actionDate?: string;
  actionBy?: string;
}

export interface VendorContact {
  name: string;
  department: string;
  email: string;
  phone: string;
}

export interface WarrantyAnalytics {
  totalWarranties: number;
  activeWarranties: number;
  expiredWarranties: number;
  expiringWithin30Days: number;
  expiringWithin90Days: number;
  totalClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  claimSuccessRate: number;
  topClaimReasons: Array<{ reason: string; count: number }>;
  vendorPerformance: VendorPerformance[];
}

export interface VendorPerformance {
  vendorId: string;
  vendorName: string;
  totalWarranties: number;
  claimRate: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
}

export interface RecallAnalytics {
  totalRecalls: number;
  activeRecalls: number;
  completedRecalls: number;
  affectedItemsCount: number;
  completedActionsCount: number;
  complianceRate: number;
  overdueActions: number;
  recallsBySeverity: Record<string, number>;
  recallsByUrgency: Record<string, number>;
}

export interface ComplianceReport {
  reportId: string;
  generatedDate: string;
  warrantyCompliance: {
    totalActive: number;
    expiringSoon: number;
    claimsProcessed: number;
    complianceScore: number;
  };
  recallCompliance: {
    activeRecalls: number;
    completionRate: number;
    overdueActions: number;
    complianceScore: number;
  };
  recommendations: string[];
}

class WarrantyRecallService {
  private warranties: Map<string, WarrantyInfo> = new Map();
  private recalls: Map<string, RecallInfo> = new Map();

  async initializeWarranties(): Promise<void> {
    // Initialize with sample data
    const sampleWarranties: WarrantyInfo[] = [
      {
        id: 'w1',
        partId: 'p1',
        partName: 'Engine Block',
        partNumber: 'ENG-001',
        vendorId: 'v1',
        vendorName: 'Ford Motors',
        warrantyType: 'MANUFACTURER',
        status: 'ACTIVE',
        warrantyStartDate: '2024-01-15T00:00:00Z',
        warrantyEndDate: '2026-01-15T00:00:00Z',
        coverageDetails: 'Full coverage for manufacturing defects',
        termsAndConditions: 'Standard manufacturer terms',
        claimHistory: [],
        notifications: []
      },
      {
        id: 'w2',
        partId: 'p2',
        partName: 'Transmission',
        partNumber: 'TRN-002',
        vendorId: 'v2',
        vendorName: 'Allison Transmission',
        warrantyType: 'EXTENDED',
        status: 'ACTIVE',
        warrantyStartDate: '2024-06-01T00:00:00Z',
        warrantyEndDate: '2026-02-15T00:00:00Z',
        coverageDetails: 'Extended coverage for 2 years',
        termsAndConditions: 'Extended warranty terms',
        claimHistory: [],
        notifications: []
      }
    ];

    sampleWarranties.forEach(w => this.warranties.set(w.id, w));
  }

  async initializeRecalls(): Promise<void> {
    // Initialize with sample data
    const sampleRecalls: RecallInfo[] = [
      {
        id: 'r1',
        recallNumber: 'RC-2026-001',
        title: 'Brake System Safety Recall',
        description: 'Critical brake line defect affecting stopping performance',
        severity: 'SAFETY',
        urgency: 'IMMEDIATE',
        issuedBy: 'NHTSA',
        dateIssued: '2026-01-15T00:00:00Z',
        effectiveDate: '2026-01-20T00:00:00Z',
        complianceDeadline: '2026-03-01T00:00:00Z',
        affectedParts: ['BRK-101', 'BRK-102'],
        affectedInventory: [
          {
            partId: 'p3',
            partNumber: 'BRK-101',
            location: 'Warehouse A',
            actionRequired: 'Inspect and replace if defective',
            complianceStatus: 'PENDING'
          }
        ],
        remedyDescription: 'Inspect brake lines and replace with updated part number BRK-103',
        vendorContact: {
          name: 'John Doe',
          department: 'Safety Compliance',
          email: 'safety@vendor.com',
          phone: '555-0100'
        }
      }
    ];

    sampleRecalls.forEach(r => this.recalls.set(r.id, r));
  }

  async getAllWarranties(): Promise<WarrantyInfo[]> {
    return Array.from(this.warranties.values());
  }

  async getWarrantyAnalytics(): Promise<WarrantyAnalytics> {
    const warranties = Array.from(this.warranties.values());
    const now = new Date();

    const activeWarranties = warranties.filter(w => w.status === 'ACTIVE').length;
    const expiredWarranties = warranties.filter(w => w.status === 'EXPIRED').length;

    const expiringWithin30Days = warranties.filter(w => {
      const endDate = new Date(w.warrantyEndDate);
      const daysRemaining = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 30;
    }).length;

    const expiringWithin90Days = warranties.filter(w => {
      const endDate = new Date(w.warrantyEndDate);
      const daysRemaining = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 90;
    }).length;

    const allClaims = warranties.flatMap(w => w.claimHistory);
    const approvedClaims = allClaims.filter(c => c.status === 'APPROVED').length;
    const deniedClaims = allClaims.filter(c => c.status === 'DENIED').length;

    return {
      totalWarranties: warranties.length,
      activeWarranties,
      expiredWarranties,
      expiringWithin30Days,
      expiringWithin90Days,
      totalClaims: allClaims.length,
      approvedClaims,
      deniedClaims,
      claimSuccessRate: allClaims.length > 0 ? (approvedClaims / allClaims.length) * 100 : 0,
      topClaimReasons: [
        { reason: 'Manufacturing Defect', count: 5 },
        { reason: 'Premature Failure', count: 3 }
      ],
      vendorPerformance: [
        {
          vendorId: 'v1',
          vendorName: 'Ford Motors',
          totalWarranties: 10,
          claimRate: 15.5,
          averageResolutionTime: 14,
          customerSatisfaction: 4.2
        }
      ]
    };
  }

  async getActiveRecalls(): Promise<RecallInfo[]> {
    return Array.from(this.recalls.values());
  }

  async getRecallAnalytics(): Promise<RecallAnalytics> {
    const recalls = Array.from(this.recalls.values());
    const allAffectedItems = recalls.flatMap(r => r.affectedInventory);
    const completedActions = allAffectedItems.filter(i => i.complianceStatus === 'COMPLETED').length;

    return {
      totalRecalls: recalls.length,
      activeRecalls: recalls.length,
      completedRecalls: 0,
      affectedItemsCount: allAffectedItems.length,
      completedActionsCount: completedActions,
      complianceRate: allAffectedItems.length > 0 ? (completedActions / allAffectedItems.length) * 100 : 0,
      overdueActions: 2,
      recallsBySeverity: {
        SAFETY: 1,
        PERFORMANCE: 0,
        QUALITY: 0,
        REGULATORY: 0
      },
      recallsByUrgency: {
        IMMEDIATE: 1,
        URGENT: 0,
        MODERATE: 0,
        LOW: 0
      }
    };
  }

  async submitWarrantyClaim(claim: Omit<WarrantyClaim, 'id' | 'status'>): Promise<string> {
    const newClaim: WarrantyClaim = {
      ...claim,
      id: `claim-${Date.now()}`,
      status: 'SUBMITTED'
    };
    // In a real implementation, this would save to a database
    return newClaim.id;
  }

  async processRecallAction(
    recallId: string,
    partId: string,
    action: { actionTaken: string; actionBy: string }
  ): Promise<void> {
    const recall = this.recalls.get(recallId);
    if (!recall) {
      throw new Error('Recall not found');
    }

    const item = recall.affectedInventory.find(i => i.partId === partId);
    if (item) {
      item.complianceStatus = 'COMPLETED';
      item.actionTaken = action.actionTaken;
      item.actionDate = new Date().toISOString();
      item.actionBy = action.actionBy;
    }
  }

  async generateComplianceReport(): Promise<ComplianceReport> {
    const warrantyAnalytics = await this.getWarrantyAnalytics();
    const recallAnalytics = await this.getRecallAnalytics();

    return {
      reportId: `report-${Date.now()}`,
      generatedDate: new Date().toISOString(),
      warrantyCompliance: {
        totalActive: warrantyAnalytics.activeWarranties,
        expiringSoon: warrantyAnalytics.expiringWithin30Days,
        claimsProcessed: warrantyAnalytics.totalClaims,
        complianceScore: 95.5
      },
      recallCompliance: {
        activeRecalls: recallAnalytics.activeRecalls,
        completionRate: recallAnalytics.complianceRate,
        overdueActions: recallAnalytics.overdueActions,
        complianceScore: recallAnalytics.complianceRate
      },
      recommendations: [
        'Review warranties expiring within 30 days',
        'Process pending recall actions immediately'
      ]
    };
  }
}

export default new WarrantyRecallService();
