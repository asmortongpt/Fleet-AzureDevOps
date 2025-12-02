//
//  Warranty.swift
//  Fleet Manager - iOS Native App
//
//  Warranty models for warranty tracking, claims, and coverage management
//  Supports offline-first architecture with API sync
//

import Foundation
import SwiftUI

// MARK: - Warranty Model
public struct Warranty: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let vehicleId: String
    public var component: String
    public var provider: WarrantyProvider
    public var type: WarrantyType
    public var startDate: Date
    public var endDate: Date
    public var mileageLimit: Int?
    public var coverage: WarrantyCoverage
    public var terms: String
    public var purchasePrice: Double?
    public var deductible: Double?
    public var status: WarrantyStatus
    public var documentURL: String?
    public var notes: String?
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case vehicleId = "vehicle_id"
        case component
        case provider
        case type
        case startDate = "start_date"
        case endDate = "end_date"
        case mileageLimit = "mileage_limit"
        case coverage
        case terms
        case purchasePrice = "purchase_price"
        case deductible
        case status
        case documentURL = "document_url"
        case notes
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var isActive: Bool {
        isActive(on: Date())
    }

    public func isActive(on date: Date) -> Bool {
        return date >= startDate && date <= endDate && status == .active
    }

    public var daysRemaining: Int {
        let calendar = Calendar.current
        return calendar.dateComponents([.day], from: Date(), to: endDate).day ?? 0
    }

    public var isExpiring: Bool {
        let days = daysRemaining
        return days > 0 && days <= 90
    }

    public var isExpired: Bool {
        endDate < Date()
    }

    public var expirationAlertLevel: ExpirationAlertLevel {
        let days = daysRemaining
        if days < 0 { return .expired }
        if days <= 30 { return .critical }
        if days <= 60 { return .warning }
        if days <= 90 { return .notice }
        return .none
    }

    public var coveragePercentage: Double {
        let total = endDate.timeIntervalSince(startDate)
        let elapsed = Date().timeIntervalSince(startDate)
        let remaining = max(0, 1 - (elapsed / total))
        return min(1.0, max(0.0, remaining)) * 100
    }
}

// MARK: - Warranty Type
public enum WarrantyType: String, Codable, CaseIterable {
    case manufacturer
    case extended
    case bumperToBumper = "bumper_to_bumper"
    case powertrain
    case componentSpecific = "component_specific"
    case corrosion
    case emissions
    case hybrid
    case battery

    public var displayName: String {
        switch self {
        case .manufacturer: return "Manufacturer"
        case .extended: return "Extended"
        case .bumperToBumper: return "Bumper-to-Bumper"
        case .powertrain: return "Powertrain"
        case .componentSpecific: return "Component-Specific"
        case .corrosion: return "Corrosion"
        case .emissions: return "Emissions"
        case .hybrid: return "Hybrid System"
        case .battery: return "Battery"
        }
    }

    public var icon: String {
        switch self {
        case .manufacturer: return "building.2.fill"
        case .extended: return "shield.fill"
        case .bumperToBumper: return "car.fill"
        case .powertrain: return "engine.combustion.fill"
        case .componentSpecific: return "wrench.and.screwdriver.fill"
        case .corrosion: return "drop.triangle.fill"
        case .emissions: return "smoke.fill"
        case .hybrid: return "bolt.car.fill"
        case .battery: return "battery.100.bolt"
        }
    }
}

// MARK: - Warranty Status
public enum WarrantyStatus: String, Codable, CaseIterable {
    case active
    case expired
    case cancelled
    case transferred
    case suspended

    public var displayName: String {
        switch self {
        case .active: return "Active"
        case .expired: return "Expired"
        case .cancelled: return "Cancelled"
        case .transferred: return "Transferred"
        case .suspended: return "Suspended"
        }
    }

    public var icon: String {
        switch self {
        case .active: return "checkmark.shield.fill"
        case .expired: return "xmark.shield.fill"
        case .cancelled: return "xmark.circle.fill"
        case .transferred: return "arrow.right.circle.fill"
        case .suspended: return "pause.circle.fill"
        }
    }

    public var color: Color {
        switch self {
        case .active: return .green
        case .expired: return .red
        case .cancelled: return .gray
        case .transferred: return .blue
        case .suspended: return .orange
        }
    }
}

// MARK: - Warranty Coverage
public struct WarrantyCoverage: Codable, Equatable {
    public var coveredComponents: [String]
    public var exclusions: [String]
    public var limitations: [String]?
    public var maxClaimAmount: Double?
    public var aggregateLimit: Double?

    enum CodingKeys: String, CodingKey {
        case coveredComponents = "covered_components"
        case exclusions
        case limitations
        case maxClaimAmount = "max_claim_amount"
        case aggregateLimit = "aggregate_limit"
    }

    public var coverageCount: Int {
        coveredComponents.count
    }

    public var exclusionCount: Int {
        exclusions.count
    }
}

// MARK: - Warranty Provider
public struct WarrantyProvider: Codable, Equatable {
    public var name: String
    public var contact: ProviderContact
    public var claimProcess: ClaimProcess
    public var serviceLevel: String?
    public var rating: Double?

    enum CodingKeys: String, CodingKey {
        case name
        case contact
        case claimProcess = "claim_process"
        case serviceLevel = "service_level"
        case rating
    }
}

// MARK: - Provider Contact
public struct ProviderContact: Codable, Equatable {
    public var phone: String
    public var email: String
    public var website: String?
    public var address: String?
    public var hours: String?
}

// MARK: - Claim Process
public struct ClaimProcess: Codable, Equatable {
    public var submissionMethod: String
    public var requiredDocuments: [String]
    public var averageProcessingDays: Int?
    public var onlinePortal: String?

    enum CodingKeys: String, CodingKey {
        case submissionMethod = "submission_method"
        case requiredDocuments = "required_documents"
        case averageProcessingDays = "average_processing_days"
        case onlinePortal = "online_portal"
    }
}

// MARK: - Warranty Claim
public struct WarrantyClaim: Codable, Identifiable, Equatable {
    public let id: String
    public let warrantyId: String
    public let vehicleId: String
    public var issueDescription: String
    public var component: String
    public var failureDate: Date
    public var mileageAtFailure: Int?
    public var status: ClaimStatus
    public var claimAmount: Double?
    public var approvedAmount: Double?
    public var deductiblePaid: Double?
    public var repairShop: RepairShop?
    public var documents: [ClaimDocument]
    public var notes: String?
    public var submittedAt: Date
    public var updatedAt: Date
    public var resolvedAt: Date?
    public var denialReason: String?

    enum CodingKeys: String, CodingKey {
        case id
        case warrantyId = "warranty_id"
        case vehicleId = "vehicle_id"
        case issueDescription = "issue_description"
        case component
        case failureDate = "failure_date"
        case mileageAtFailure = "mileage_at_failure"
        case status
        case claimAmount = "claim_amount"
        case approvedAmount = "approved_amount"
        case deductiblePaid = "deductible_paid"
        case repairShop = "repair_shop"
        case documents
        case notes
        case submittedAt = "submitted_at"
        case updatedAt = "updated_at"
        case resolvedAt = "resolved_at"
        case denialReason = "denial_reason"
    }

    public var statusColor: Color {
        status.color
    }

    public var isResolved: Bool {
        status == .approved || status == .denied
    }

    public var processingDays: Int {
        let calendar = Calendar.current
        let endDate = resolvedAt ?? Date()
        return calendar.dateComponents([.day], from: submittedAt, to: endDate).day ?? 0
    }
}

// MARK: - Claim Status
public enum ClaimStatus: String, Codable, CaseIterable {
    case draft
    case submitted
    case underReview = "under_review"
    case pendingDocuments = "pending_documents"
    case approved
    case denied
    case paid
    case appealed

    public var displayName: String {
        switch self {
        case .draft: return "Draft"
        case .submitted: return "Submitted"
        case .underReview: return "Under Review"
        case .pendingDocuments: return "Pending Documents"
        case .approved: return "Approved"
        case .denied: return "Denied"
        case .paid: return "Paid"
        case .appealed: return "Appealed"
        }
    }

    public var icon: String {
        switch self {
        case .draft: return "doc.text.fill"
        case .submitted: return "paperplane.fill"
        case .underReview: return "magnifyingglass.circle.fill"
        case .pendingDocuments: return "doc.badge.ellipsis"
        case .approved: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        case .paid: return "dollarsign.circle.fill"
        case .appealed: return "arrow.counterclockwise.circle.fill"
        }
    }

    public var color: Color {
        switch self {
        case .draft: return .gray
        case .submitted: return .blue
        case .underReview: return .orange
        case .pendingDocuments: return .yellow
        case .approved: return .green
        case .denied: return .red
        case .paid: return .purple
        case .appealed: return .cyan
        }
    }
}

// MARK: - Repair Shop
public struct RepairShop: Codable, Equatable {
    public var name: String
    public var phone: String
    public var address: String
    public var certified: Bool
}

// MARK: - Claim Document
public struct ClaimDocument: Codable, Identifiable, Equatable {
    public let id: String
    public var type: DocumentType
    public var name: String
    public var url: String?
    public var uploadedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case name
        case url
        case uploadedAt = "uploaded_at"
    }

    public enum DocumentType: String, Codable {
        case photo
        case invoice
        case estimate
        case diagnostic
        case other

        public var displayName: String {
            rawValue.capitalized
        }

        public var icon: String {
            switch self {
            case .photo: return "photo.fill"
            case .invoice: return "doc.text.fill"
            case .estimate: return "doc.plaintext.fill"
            case .diagnostic: return "stethoscope"
            case .other: return "doc.fill"
            }
        }
    }
}

// MARK: - Expiration Alert Level
public enum ExpirationAlertLevel: Int, Codable, Comparable {
    case none = 0
    case notice = 1
    case warning = 2
    case critical = 3
    case expired = 4

    public static func < (lhs: ExpirationAlertLevel, rhs: ExpirationAlertLevel) -> Bool {
        lhs.rawValue < rhs.rawValue
    }

    public var displayName: String {
        switch self {
        case .none: return "Active"
        case .notice: return "Expires in 90 days"
        case .warning: return "Expires in 60 days"
        case .critical: return "Expires in 30 days"
        case .expired: return "Expired"
        }
    }

    public var color: Color {
        switch self {
        case .none: return .green
        case .notice: return .blue
        case .warning: return .orange
        case .critical: return .red
        case .expired: return .gray
        }
    }

    public var icon: String {
        switch self {
        case .none: return "checkmark.shield.fill"
        case .notice: return "info.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .critical: return "exclamationmark.octagon.fill"
        case .expired: return "xmark.shield.fill"
        }
    }
}

// MARK: - Warranty Statistics
public struct WarrantyStatistics: Codable {
    public var totalWarranties: Int
    public var activeWarranties: Int
    public var expiringWarranties: Int
    public var totalClaims: Int
    public var pendingClaims: Int
    public var approvedClaims: Int
    public var deniedClaims: Int
    public var totalClaimAmount: Double
    public var approvedClaimAmount: Double
    public var averageProcessingDays: Double

    enum CodingKeys: String, CodingKey {
        case totalWarranties = "total_warranties"
        case activeWarranties = "active_warranties"
        case expiringWarranties = "expiring_warranties"
        case totalClaims = "total_claims"
        case pendingClaims = "pending_claims"
        case approvedClaims = "approved_claims"
        case deniedClaims = "denied_claims"
        case totalClaimAmount = "total_claim_amount"
        case approvedClaimAmount = "approved_claim_amount"
        case averageProcessingDays = "average_processing_days"
    }

    public var approvalRate: Double {
        guard totalClaims > 0 else { return 0 }
        return Double(approvedClaims) / Double(totalClaims) * 100
    }
}

// MARK: - API Response Models
public struct WarrantiesResponse: Codable {
    public let warranties: [Warranty]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct WarrantyResponse: Codable {
    public let warranty: Warranty
}

public struct ClaimsResponse: Codable {
    public let claims: [WarrantyClaim]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct ClaimResponse: Codable {
    public let claim: WarrantyClaim
}

public struct WarrantyStatisticsResponse: Codable {
    public let statistics: WarrantyStatistics
}

// MARK: - API Request Models
public struct CreateWarrantyRequest: Codable {
    public let vehicleId: String
    public let component: String
    public let provider: WarrantyProvider
    public let type: WarrantyType
    public let startDate: Date
    public let endDate: Date
    public let mileageLimit: Int?
    public let coverage: WarrantyCoverage
    public let terms: String
    public let purchasePrice: Double?
    public let deductible: Double?

    enum CodingKeys: String, CodingKey {
        case vehicleId = "vehicle_id"
        case component
        case provider
        case type
        case startDate = "start_date"
        case endDate = "end_date"
        case mileageLimit = "mileage_limit"
        case coverage
        case terms
        case purchasePrice = "purchase_price"
        case deductible
    }
}

public struct CreateClaimRequest: Codable {
    public let warrantyId: String
    public let issueDescription: String
    public let component: String
    public let failureDate: Date
    public let mileageAtFailure: Int?
    public let claimAmount: Double?
    public let repairShop: RepairShop?

    enum CodingKeys: String, CodingKey {
        case warrantyId = "warranty_id"
        case issueDescription = "issue_description"
        case component
        case failureDate = "failure_date"
        case mileageAtFailure = "mileage_at_failure"
        case claimAmount = "claim_amount"
        case repairShop = "repair_shop"
    }
}

public struct UpdateClaimRequest: Codable {
    public let status: ClaimStatus?
    public let notes: String?
    public let approvedAmount: Double?
    public let denialReason: String?

    enum CodingKeys: String, CodingKey {
        case status
        case notes
        case approvedAmount = "approved_amount"
        case denialReason = "denial_reason"
    }
}

// MARK: - Warranty Helper Functions
extension Warranty {
    public func isComponentCovered(
        component: String,
        mileage: Int?,
        date: Date = Date()
    ) -> Bool {
        // Check warranty is active
        guard isActive(on: date) else { return false }

        // Check mileage limit if applicable
        if let mileageLimit = mileageLimit,
           let currentMileage = mileage,
           currentMileage > mileageLimit {
            return false
        }

        // Check component is covered
        let componentLower = component.lowercased()
        guard coverage.coveredComponents.contains(where: { covered in
            componentLower.contains(covered.lowercased()) ||
            covered.lowercased().contains(componentLower)
        }) else {
            return false
        }

        // Check exclusions
        if coverage.exclusions.contains(where: { exclusion in
            componentLower.contains(exclusion.lowercased())
        }) {
            return false
        }

        return true
    }

    public func calculateWarrantyValue() -> Double {
        // Estimate value based on coverage and time remaining
        let baseValue = Double(coverage.coveredComponents.count) * 500.0
        let timeDepreciation = coveragePercentage / 100.0

        return baseValue * timeDepreciation
    }
}
