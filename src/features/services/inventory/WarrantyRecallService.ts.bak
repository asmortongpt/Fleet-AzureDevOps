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

// Mock data storage
const mockWarranties: Map<string, WarrantyInfo> = new Map();
const mockRecalls: Map<string, RecallInfo> = new Map();

// Initialize mock data
const initializeMockData = () => {
  // Mock warranties
  const warranties: WarrantyInfo[] = [
    {
      id: 'w1',
      partId: 'p1',
      partNumber: 'BRK-2024-001',
      partName: 'Heavy Duty Brake Pads',
      vendorId: 'v1',
      vendorName: 'AutoParts Pro',
      warrantyType: 'MANUFACTURER',
      warrantyStartDate: '2024-01-15',
      warrantyEndDate: '2025-01-15',
      coverageDetails: 'Full replacement for manufacturing defects',
      terms: '12-month coverage from date of purchase',
      status: 'ACTIVE',
      claimHistory: [
        {
          id: 'c1',
          claimNumber: 'CLM-2024-001',
          dateSubmitted: '2024-06-15',
          issueDescription: 'Premature wear on front brake pads',
          claimType: 'DEFECT',
          status: 'RESOLVED',
          resolution: 'Full replacement provided',
          attachments: []
        }
      ],
      notifications: [
        {
          id: 'n1',
          type: 'EXPIRY_WARNING',
          message: 'Warranty expiring in 30 days',
          acknowledged: false,
          date: '2024-12-15'
        }
      ]
    },
    {
      id: 'w2',
      partId: 'p2',
      partNumber: 'ENG-2024-002',
      partName: 'Engine Oil Filter',
      vendorId: 'v2',
      vendorName: 'FilterMax Industries',
      warrantyType: 'PARTS',
      warrantyStartDate: '2024-03-01',
      warrantyEndDate: '2025-03-01',
      coverageDetails: 'Replacement for defective filters',
      terms: '12-month coverage',
      status: 'ACTIVE',
      claimHistory: [],
      notifications: []
    },
    {
      id: 'w3',
      partId: 'p3',
      partNumber: 'TIR-2024-003',
      partName: 'All-Season Tires',
      vendorId: 'v3',
      vendorName: 'TireWorld Global',
      warrantyType: 'COMPREHENSIVE',
      warrantyStartDate: '2024-02-01',
      warrantyEndDate: '2024-02-15',
      coverageDetails: 'Full coverage including road hazards',
      terms: '24-month or 50,000 mile coverage',
      status: 'EXPIRED',
      claimHistory: [
        {
          id: 'c2',
          claimNumber: 'CLM-2024-002',
          dateSubmitted: '2024-05-20',
          issueDescription: 'Sidewall damage',
          claimType: 'DAMAGE',
          status: 'APPROVED',
          resolution: 'Pro-rated replacement',
          attachments: []
        }
      ],
      notifications: []
    }
  ];

  warranties.forEach(w => mockWarranties.set(w.id, w));

  // Mock recalls
  const recalls: RecallInfo[] = [
    {
      id: 'r1',
      recallNumber: 'RCL-2024-001',
      title: 'Brake Caliper Safety Recall',
      description: 'Potential brake caliper mounting bolt loosening under extreme conditions',
      severity: 'SAFETY',
      urgency: 'IMMEDIATE',
      issuedBy: 'NHTSA',
      dateIssued: '2024-06-01',
      effectiveDate: '2024-06-15',
      complianceDeadline: '2024-09-01',
      affectedParts: ['BRK-CAL-001', 'BRK-CAL-002', 'BRK-CAL-003'],
      affectedInventory: [
        {
          partId: 'inv1',
          partNumber: 'BRK-CAL-001',
          location: 'Warehouse A',
          actionRequired: 'REPLACE',
          complianceStatus: 'PENDING'
        },
        {
          partId: 'inv2',
          partNumber: 'BRK-CAL-002',
          location: 'Warehouse B',
          actionRequired: 'INSPECT',
          complianceStatus: 'COMPLETED'
        }
      ],
      remedyDescription: 'Replace affected brake calipers with updated units. Inspect all mounting hardware.',
      vendorContact: {
        name: 'John Smith',
        department: 'Safety Compliance',
        email: 'jsmith@autopartspro.com',
        phone: '555-123-4567'
      },
      status: 'ACTIVE'
    },
    {
      id: 'r2',
      recallNumber: 'RCL-2024-002',
      title: 'Fuel Line Connector Quality Issue',
      description: 'Some fuel line connectors may develop micro-cracks over time',
      severity: 'QUALITY',
      urgency: 'MODERATE',
      issuedBy: 'Manufacturer',
      dateIssued: '2024-07-15',
      effectiveDate: '2024-08-01',
      affectedParts: ['FUEL-CON-001'],
      affectedInventory: [
        {
          partId: 'inv3',
          partNumber: 'FUEL-CON-001',
          location: 'Warehouse C',
          actionRequired: 'INSPECT',
          complianceStatus: 'IN_PROGRESS'
        }
      ],
      remedyDescription: 'Inspect all fuel line connectors from affected batch. Replace if any damage found.',
      vendorContact: {
        name: 'Sarah Johnson',
        department: 'Quality Assurance',
        email: 'sjohnson@fuelparts.com',
        phone: '555-987-6543'
      },
      status: 'ACTIVE'
    }
  ];

  recalls.forEach(r => mockRecalls.set(r.id, r));
};

class WarrantyRecallServiceClass {
  warranties: Map<string, WarrantyInfo> = mockWarranties;
  recalls: Map<string, RecallInfo> = mockRecalls;

  async initializeWarranties(): Promise<void> {
    if (mockWarranties.size === 0) {
      initializeMockData();
    }
    this.warranties = mockWarranties;
  }

  async initializeRecalls(): Promise<void> {
    if (mockRecalls.size === 0) {
      initializeMockData();
    }
    this.recalls = mockRecalls;
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

    const allClaims = warranties.flatMap(w => w.claimHistory);
    const approvedClaims = allClaims.filter(c => c.status === 'APPROVED' || c.status === 'RESOLVED').length;

    return {
      activeWarranties,
      expiringWithin30Days,
      expiringWithin90Days: 5,
      totalClaims: allClaims.length,
      pendingClaims: allClaims.filter(c => c.status === 'PENDING').length,
      approvedClaims,
      rejectedClaims: allClaims.filter(c => c.status === 'REJECTED').length,
      claimSuccessRate: allClaims.length > 0 ? (approvedClaims / allClaims.length) * 100 : 0,
      averageClaimProcessingTime: 14,
      topClaimReasons: [
        { reason: 'Manufacturing Defect', count: 8 },
        { reason: 'Premature Failure', count: 5 },
        { reason: 'Performance Issue', count: 3 }
      ],
      vendorPerformance: [
        {
          vendorId: 'v1',
          vendorName: 'AutoParts Pro',
          totalWarranties: 15,
          claimRate: 12.5,
          averageResolutionTime: 10,
          customerSatisfaction: 4.5
        },
        {
          vendorId: 'v2',
          vendorName: 'FilterMax Industries',
          totalWarranties: 8,
          claimRate: 5.0,
          averageResolutionTime: 7,
          customerSatisfaction: 4.8
        },
        {
          vendorId: 'v3',
          vendorName: 'TireWorld Global',
          totalWarranties: 12,
          claimRate: 18.0,
          averageResolutionTime: 14,
          customerSatisfaction: 3.9
        }
      ]
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
