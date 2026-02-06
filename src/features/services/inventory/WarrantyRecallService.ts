/**
 * Warranty and Recall Service - API Implementation
 */

import { secureFetch } from '@/hooks/use-api'
import logger from '@/utils/logger'

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
  department?: string;
  email: string;
  phone?: string;
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

const unwrapRows = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (payload?.data && Array.isArray(payload.data)) return payload.data as T[]
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data as T[]
  return []
}

const unwrapData = <T,>(payload: any): T => {
  if (payload?.data !== undefined) return payload.data as T
  return payload as T
}

const parseJsonArray = (value: any): string[] => {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const createExpiryNotifications = (warranty: WarrantyInfo): WarrantyNotification[] => {
  if (!warranty.warrantyEndDate) return []
  const endDate = new Date(warranty.warrantyEndDate)
  const now = new Date()
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysRemaining <= 0) return []
  if (daysRemaining > 90) return []

  return [{
    id: `${warranty.id}-expiry-${daysRemaining}`,
    type: daysRemaining <= 30 ? 'EXPIRY_WARNING' : 'EXPIRY_NOTICE',
    message: `Warranty expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
    acknowledged: false,
    date: now.toISOString()
  }]
}

class WarrantyRecallServiceClass {
  async initializeWarranties(): Promise<void> {
    return
  }

  async initializeRecalls(): Promise<void> {
    return
  }

  async getAllWarranties(): Promise<WarrantyInfo[]> {
    try {
      const response = await secureFetch('/api/warranty/warranties?limit=200')
      if (!response.ok) {
        throw new Error(`Failed to fetch warranties (${response.status})`)
      }
      const payload = await response.json()
      const rows = unwrapRows<any>(payload)
      return rows.map((row: any) => {
        const warranty: WarrantyInfo = {
          id: row.id,
          partId: row.inventory_item_id,
          partNumber: row.part_number,
          partName: row.part_name,
          vendorId: row.vendor_id,
          vendorName: row.vendor_name,
          warrantyType: row.warranty_type,
          warrantyStartDate: row.warranty_start_date,
          warrantyEndDate: row.warranty_end_date,
          coverageDetails: row.coverage_details,
          terms: row.terms,
          status: row.status,
          claimHistory: (row.claim_history || []).map((claim: any) => ({
            id: claim.id,
            claimNumber: claim.claimNumber || claim.claim_number,
            dateSubmitted: claim.dateSubmitted || claim.date_submitted,
            issueDescription: claim.issueDescription || claim.issue_description,
            claimType: claim.claimType || claim.claim_type,
            status: claim.status,
            resolution: claim.resolution,
            attachments: claim.attachments || []
          })),
          notifications: []
        }
        warranty.notifications = createExpiryNotifications(warranty)
        return warranty
      })
    } catch (error) {
      logger.error('Failed to load warranties', error)
      return []
    }
  }

  async getWarrantyAnalytics(): Promise<WarrantyAnalytics> {
    try {
      const [analyticsResponse, warranties] = await Promise.all([
        secureFetch('/api/warranty/warranties/analytics'),
        this.getAllWarranties()
      ])

      if (!analyticsResponse.ok) {
        throw new Error(`Failed to fetch warranty analytics (${analyticsResponse.status})`)
      }

      const analyticsPayload = await analyticsResponse.json()
      const analyticsData = unwrapData<any>(analyticsPayload)

      const claims = warranties.flatMap(w => w.claimHistory)
      const claimReasonCounts = claims.reduce((acc, claim) => {
        const reason = claim.claimType || 'UNKNOWN'
        acc.set(reason, (acc.get(reason) ?? 0) + 1)
        return acc
      }, new Map<string, number>())

      const topClaimReasons = Array.from(claimReasonCounts.entries()).map(([reason, count]) => ({
        reason,
        count
      }))

      const vendorStats = warranties.reduce((acc, warranty) => {
        const key = warranty.vendorId || warranty.vendorName
        if (!key) return acc
        if (!acc.has(key)) {
          acc.set(key, {
            vendorId: warranty.vendorId,
            vendorName: warranty.vendorName,
            totalWarranties: 0,
            totalClaims: 0,
            approvedClaims: 0,
            totalResolutionDays: 0,
            resolvedClaims: 0
          })
        }
        const vendor = acc.get(key)!
        vendor.totalWarranties += 1
        warranty.claimHistory.forEach((claim) => {
          vendor.totalClaims += 1
          if (claim.status === 'APPROVED' || claim.status === 'RESOLVED') {
            vendor.approvedClaims += 1
          }
          if (claim.dateSubmitted) {
            const daysOpen = (Date.now() - new Date(claim.dateSubmitted).getTime()) / (1000 * 60 * 60 * 24)
            vendor.totalResolutionDays += daysOpen
            vendor.resolvedClaims += 1
          }
        })
        return acc
      }, new Map<string, any>())

      const vendorPerformance: VendorPerformance[] = Array.from(vendorStats.values()).map((vendor) => ({
        vendorId: vendor.vendorId || vendor.vendorName,
        vendorName: vendor.vendorName,
        totalWarranties: vendor.totalWarranties,
        claimRate: vendor.totalWarranties > 0 ? Number(((vendor.totalClaims / vendor.totalWarranties) * 100).toFixed(1)) : 0,
        averageResolutionTime: vendor.resolvedClaims > 0
          ? Number((vendor.totalResolutionDays / vendor.resolvedClaims).toFixed(1))
          : 0,
        customerSatisfaction: 0
      }))

      return {
        activeWarranties: Number(analyticsData.activeWarranties) || 0,
        expiringWithin30Days: Number(analyticsData.expiringWithin30Days) || 0,
        expiringWithin90Days: Number(analyticsData.expiringWithin90Days) || 0,
        totalClaims: Number(analyticsData.totalClaims) || claims.length,
        pendingClaims: Number(analyticsData.pendingClaims) || claims.filter(c => c.status === 'PENDING').length,
        approvedClaims: Number(analyticsData.approvedClaims) || claims.filter(c => c.status === 'APPROVED' || c.status === 'RESOLVED').length,
        rejectedClaims: Number(analyticsData.rejectedClaims) || claims.filter(c => c.status === 'REJECTED').length,
        claimSuccessRate: Number(analyticsData.claimSuccessRate) || 0,
        averageClaimProcessingTime: vendorPerformance.reduce((sum, v) => sum + v.averageResolutionTime, 0) / (vendorPerformance.length || 1),
        topClaimReasons,
        vendorPerformance
      }
    } catch (error) {
      logger.error('Failed to load warranty analytics', error)
      return {
        activeWarranties: 0,
        expiringWithin30Days: 0,
        expiringWithin90Days: 0,
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        claimSuccessRate: 0,
        averageClaimProcessingTime: 0,
        topClaimReasons: [],
        vendorPerformance: []
      }
    }
  }

  async getAllRecalls(): Promise<RecallInfo[]> {
    try {
      const response = await secureFetch('/api/warranty/recalls?limit=200')
      if (!response.ok) {
        throw new Error(`Failed to fetch recalls (${response.status})`)
      }
      const payload = await response.json()
      const rows = unwrapRows<any>(payload)
      return rows.map((row: any) => ({
        id: row.id,
        recallNumber: row.recall_number,
        title: row.title,
        description: row.description,
        severity: row.severity,
        urgency: row.urgency,
        issuedBy: row.issued_by,
        dateIssued: row.date_issued,
        effectiveDate: row.effective_date,
        complianceDeadline: row.compliance_deadline,
        affectedParts: parseJsonArray(row.affected_parts),
        affectedInventory: (row.affected_inventory || []).map((item: any) => ({
          partId: item.partId || item.part_id || item.inventory_item_id,
          partNumber: item.partNumber || item.part_number,
          location: item.location,
          actionRequired: item.actionRequired || item.action_required,
          complianceStatus: item.complianceStatus || item.compliance_status
        })),
        remedyDescription: row.remedy_description,
        vendorContact: row.vendor_contact || { name: '', email: '' },
        status: row.status
      }))
    } catch (error) {
      logger.error('Failed to load recalls', error)
      return []
    }
  }

  async getActiveRecalls(): Promise<RecallInfo[]> {
    const recalls = await this.getAllRecalls()
    return recalls.filter(r => r.status === 'ACTIVE')
  }

  async getRecallAnalytics(): Promise<RecallAnalytics> {
    try {
      const [analyticsResponse, recalls] = await Promise.all([
        secureFetch('/api/warranty/recalls/analytics'),
        this.getAllRecalls()
      ])

      if (!analyticsResponse.ok) {
        throw new Error(`Failed to fetch recall analytics (${analyticsResponse.status})`)
      }

      const analyticsPayload = await analyticsResponse.json()
      const analyticsData = unwrapData<any>(analyticsPayload)

      const recallsBySeverity = recalls.reduce((acc, recall) => {
        acc[recall.severity] = (acc[recall.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalRecalls: Number(analyticsData.totalRecalls) || recalls.length,
        activeRecalls: Number(analyticsData.activeRecalls) || recalls.filter(r => r.status === 'ACTIVE').length,
        completedRecalls: Number(analyticsData.completedRecalls) || recalls.filter(r => r.status === 'COMPLETED').length,
        affectedItemsCount: Number(analyticsData.affectedItemsCount) || recalls.reduce((sum, r) => sum + r.affectedInventory.length, 0),
        complianceRate: Number(analyticsData.complianceRate) || 0,
        overdueActions: Number(analyticsData.overdueActions) || 0,
        recallsBySeverity
      }
    } catch (error) {
      logger.error('Failed to load recall analytics', error)
      return {
        totalRecalls: 0,
        activeRecalls: 0,
        completedRecalls: 0,
        affectedItemsCount: 0,
        complianceRate: 0,
        overdueActions: 0,
        recallsBySeverity: {}
      }
    }
  }

  async submitWarrantyClaim(claim: {
    warrantyId: string
    claimNumber: string
    dateSubmitted: string
    issueDescription: string
    claimType: WarrantyClaim['claimType']
    attachments: string[]
  }): Promise<string> {
    const response = await secureFetch('/api/warranty/warranties/claims', {
      method: 'POST',
      body: JSON.stringify({
        warrantyId: claim.warrantyId,
        claimNumber: claim.claimNumber,
        dateSubmitted: claim.dateSubmitted,
        issueDescription: claim.issueDescription,
        claimType: claim.claimType,
        attachments: claim.attachments
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to submit warranty claim (${response.status})`)
    }

    const payload = await response.json()
    return payload?.data?.id || payload?.id
  }

  async processRecallAction(
    recallId: string,
    partId: string,
    action: { actionTaken: string; actionBy: string }
  ): Promise<void> {
    const response = await secureFetch('/api/warranty/recalls/actions', {
      method: 'POST',
      body: JSON.stringify({
        recallId,
        partId,
        actionTaken: action.actionTaken,
        actionBy: action.actionBy
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to process recall action (${response.status})`)
    }
  }

  async generateComplianceReport(): Promise<ComplianceReport> {
    const [warranties, recalls, warrantyAnalytics, recallAnalytics] = await Promise.all([
      this.getAllWarranties(),
      this.getAllRecalls(),
      this.getWarrantyAnalytics(),
      this.getRecallAnalytics()
    ])

    return {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      warranties,
      recalls,
      warrantyAnalytics,
      recallAnalytics
    }
  }
}

const WarrantyRecallService = new WarrantyRecallServiceClass()
export default WarrantyRecallService
