import Foundation

// MARK: - Compliance Category
public enum ComplianceCategory: String, Codable, CaseIterable {
    case vehicle
    case driver
    case environmental
    case safety
    case insurance

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .vehicle: return "car.fill"
        case .driver: return "person.fill"
        case .environmental: return "leaf.fill"
        case .safety: return "shield.fill"
        case .insurance: return "doc.text.fill"
        }
    }

    public var color: String {
        switch self {
        case .vehicle: return "blue"
        case .driver: return "purple"
        case .environmental: return "green"
        case .safety: return "red"
        case .insurance: return "orange"
        }
    }

    public var weight: Double {
        switch self {
        case .vehicle: return 0.30
        case .driver: return 0.25
        case .safety: return 0.20
        case .environmental: return 0.15
        case .insurance: return 0.10
        }
    }
}

// MARK: - Compliance Status
public enum ComplianceStatus: String, Codable, CaseIterable {
    case compliant
    case warning
    case violation
    case expired

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .compliant: return "checkmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .violation: return "xmark.octagon.fill"
        case .expired: return "clock.badge.exclamationmark.fill"
        }
    }

    public var color: String {
        switch self {
        case .compliant: return "green"
        case .warning: return "yellow"
        case .violation: return "red"
        case .expired: return "gray"
        }
    }
}

// MARK: - Compliance Item Type
public enum ComplianceItemType: String, Codable, CaseIterable {
    case registration
    case insurance
    case inspection
    case license
    case emissions
    case medicalCard = "medical_card"
    case dotCompliance = "dot_compliance"
    case safetyInspection = "safety_inspection"
    case annualInspection = "annual_inspection"
    case cdlLicense = "cdl_license"

    public var displayName: String {
        switch self {
        case .registration: return "Registration"
        case .insurance: return "Insurance"
        case .inspection: return "Inspection"
        case .license: return "License"
        case .emissions: return "Emissions"
        case .medicalCard: return "Medical Card"
        case .dotCompliance: return "DOT Compliance"
        case .safetyInspection: return "Safety Inspection"
        case .annualInspection: return "Annual Inspection"
        case .cdlLicense: return "CDL License"
        }
    }

    public var category: ComplianceCategory {
        switch self {
        case .registration, .inspection, .annualInspection:
            return .vehicle
        case .license, .cdlLicense, .medicalCard:
            return .driver
        case .emissions:
            return .environmental
        case .safetyInspection, .dotCompliance:
            return .safety
        case .insurance:
            return .insurance
        }
    }

    public var icon: String {
        switch self {
        case .registration: return "doc.text.fill"
        case .insurance: return "doc.badge.ellipsis"
        case .inspection, .safetyInspection, .annualInspection: return "checkmark.seal.fill"
        case .license, .cdlLicense: return "creditcard.fill"
        case .emissions: return "cloud.fill"
        case .medicalCard: return "heart.text.square.fill"
        case .dotCompliance: return "shield.checkered"
        }
    }
}

// MARK: - Violation Severity
public enum ViolationSeverity: String, Codable, CaseIterable {
    case minor
    case moderate
    case serious
    case critical

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .minor: return "info.circle.fill"
        case .moderate: return "exclamationmark.circle.fill"
        case .serious: return "exclamationmark.triangle.fill"
        case .critical: return "exclamationmark.octagon.fill"
        }
    }

    public var color: String {
        switch self {
        case .minor: return "blue"
        case .moderate: return "yellow"
        case .serious: return "orange"
        case .critical: return "red"
        }
    }

    public var scoreImpact: Double {
        switch self {
        case .minor: return 2.0
        case .moderate: return 5.0
        case .serious: return 10.0
        case .critical: return 20.0
        }
    }
}

// MARK: - Compliance Item
public struct ComplianceItem: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let type: ComplianceItemType
    public let entityId: String // Vehicle ID or Driver ID
    public let entityName: String
    public let entityType: String // "vehicle" or "driver"
    public var status: ComplianceStatus
    public let issueDate: String?
    public let expirationDate: String
    public let renewalDate: String?
    public let documentNumber: String?
    public let issuingAuthority: String?
    public let jurisdiction: String?
    public var notes: String?
    public var attachments: [String]?
    public let createdAt: String
    public let updatedAt: String

    // Computed properties
    public var daysUntilExpiration: Int {
        let dateFormatter = ISO8601DateFormatter()
        guard let expDate = dateFormatter.date(from: expirationDate) else { return 0 }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let expiry = calendar.startOfDay(for: expDate)

        let components = calendar.dateComponents([.day], from: today, to: expiry)
        return components.day ?? 0
    }

    public var isExpiringSoon: Bool {
        let days = daysUntilExpiration
        return days > 0 && days <= 90
    }

    public var isExpired: Bool {
        daysUntilExpiration < 0
    }

    public var warningLevel: ComplianceStatus {
        let days = daysUntilExpiration

        if days < 0 {
            return .expired
        } else if days <= 30 {
            return .violation
        } else if days <= 90 {
            return .warning
        } else {
            return .compliant
        }
    }

    public var expirationColor: String {
        warningLevel.color
    }

    public var formattedExpirationDate: String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: expirationDate) else { return expirationDate }

        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        displayFormatter.timeStyle = .none
        return displayFormatter.string(from: date)
    }
}

// MARK: - Violation
public struct Violation: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let type: ComplianceItemType
    public let category: ComplianceCategory
    public let entityId: String // Vehicle ID or Driver ID
    public let entityName: String
    public let entityType: String // "vehicle" or "driver"
    public let violationDate: String
    public let severity: ViolationSeverity
    public let description: String
    public let citationNumber: String?
    public let fineAmount: Double?
    public let location: String?
    public let officerName: String?
    public let officerBadge: String?
    public var isResolved: Bool
    public let resolvedDate: String?
    public let resolvedBy: String?
    public var resolutionNotes: String?
    public var attachments: [String]?
    public let createdAt: String
    public let updatedAt: String

    // Computed properties
    public var formattedViolationDate: String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: violationDate) else { return violationDate }

        let displayFormatter = DateFormatter()
        displayFormatter.dateStyle = .medium
        displayFormatter.timeStyle = .short
        return displayFormatter.string(from: date)
    }

    public var formattedFineAmount: String {
        guard let amount = fineAmount else { return "N/A" }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }

    public var daysOpen: Int {
        let formatter = ISO8601DateFormatter()
        guard let violationDate = formatter.date(from: violationDate) else { return 0 }

        let calendar = Calendar.current
        let endDate = isResolved ? (resolvedDate.flatMap { formatter.date(from: $0) } ?? Date()) : Date()

        let components = calendar.dateComponents([.day], from: violationDate, to: endDate)
        return components.day ?? 0
    }
}

// MARK: - Compliance Score
public struct ComplianceScore: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let overallScore: Double
    public let categoryScores: [ComplianceCategory: Double]
    public let vehicleScore: Double
    public let driverScore: Double
    public let environmentalScore: Double
    public let safetyScore: Double
    public let insuranceScore: Double
    public let totalItems: Int
    public let compliantItems: Int
    public let warningItems: Int
    public let violationItems: Int
    public let expiredItems: Int
    public let trend: ScoreTrend
    public let previousScore: Double?
    public let calculatedAt: String

    public enum ScoreTrend: String, Codable {
        case improving
        case stable
        case declining

        public var icon: String {
            switch self {
            case .improving: return "arrow.up.circle.fill"
            case .stable: return "minus.circle.fill"
            case .declining: return "arrow.down.circle.fill"
            }
        }

        public var color: String {
            switch self {
            case .improving: return "green"
            case .stable: return "blue"
            case .declining: return "red"
            }
        }
    }

    // Computed properties
    public var scoreColor: String {
        if overallScore >= 90 {
            return "green"
        } else if overallScore >= 70 {
            return "yellow"
        } else {
            return "red"
        }
    }

    public var scoreGrade: String {
        if overallScore >= 90 {
            return "A"
        } else if overallScore >= 80 {
            return "B"
        } else if overallScore >= 70 {
            return "C"
        } else if overallScore >= 60 {
            return "D"
        } else {
            return "F"
        }
    }

    public var complianceRate: Double {
        guard totalItems > 0 else { return 0 }
        return Double(compliantItems) / Double(totalItems) * 100
    }
}

// MARK: - Regulation
public struct Regulation: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let name: String
    public let category: ComplianceCategory
    public let jurisdiction: String
    public let description: String
    public let requirement: String
    public let frequency: RegulationFrequency
    public let deadline: String?
    public let applicableTo: ApplicableEntity
    public let isActive: Bool
    public var checklistItems: [String]?
    public var references: [ReferenceLink]?
    public let createdAt: String
    public let updatedAt: String

    public enum RegulationFrequency: String, Codable {
        case daily
        case weekly
        case monthly
        case quarterly
        case annually
        case biannually
        case asNeeded = "as_needed"
        case oneTime = "one_time"

        public var displayName: String {
            switch self {
            case .daily: return "Daily"
            case .weekly: return "Weekly"
            case .monthly: return "Monthly"
            case .quarterly: return "Quarterly"
            case .annually: return "Annually"
            case .biannually: return "Biannually"
            case .asNeeded: return "As Needed"
            case .oneTime: return "One Time"
            }
        }
    }

    public enum ApplicableEntity: String, Codable {
        case vehicles
        case drivers
        case fleet
        case all

        public var displayName: String {
            rawValue.capitalized
        }
    }

    public struct ReferenceLink: Codable, Identifiable {
        public let id: String
        public let title: String
        public let url: String
        public let type: LinkType

        public enum LinkType: String, Codable {
            case regulation
            case guidance
            case form
            case resource
        }
    }
}

// MARK: - Compliance Dashboard Summary
public struct ComplianceDashboardSummary: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public let score: ComplianceScore
    public let expiringItems: [ComplianceItem]
    public let recentViolations: [Violation]
    public let upcomingDeadlines: [ComplianceItem]
    public let categoryBreakdown: [CategoryBreakdown]
    public let monthlyTrend: [MonthlyScore]
    public let generatedAt: String

    public struct CategoryBreakdown: Codable, Identifiable, Equatable {
        public let id: String
        public let category: ComplianceCategory
        public let score: Double
        public let totalItems: Int
        public let compliantCount: Int
        public let warningCount: Int
        public let violationCount: Int
        public let expiredCount: Int
    }

    public struct MonthlyScore: Codable, Identifiable, Equatable {
        public let id: String
        public let month: String
        public let score: Double
        public let violations: Int
    }

    // Computed properties
    public var expiringIn30Days: Int {
        expiringItems.filter { $0.daysUntilExpiration <= 30 && $0.daysUntilExpiration > 0 }.count
    }

    public var expiringIn60Days: Int {
        expiringItems.filter { $0.daysUntilExpiration <= 60 && $0.daysUntilExpiration > 30 }.count
    }

    public var expiringIn90Days: Int {
        expiringItems.filter { $0.daysUntilExpiration <= 90 && $0.daysUntilExpiration > 60 }.count
    }

    public var unresolvedViolations: Int {
        recentViolations.filter { !$0.isResolved }.count
    }

    public var totalFinesOutstanding: Double {
        recentViolations
            .filter { !$0.isResolved }
            .compactMap { $0.fineAmount }
            .reduce(0, +)
    }
}

// MARK: - API Response Models
public struct ComplianceDashboardResponse: Codable {
    public let dashboard: ComplianceDashboardSummary
    public let success: Bool
    public let message: String?
}

public struct ComplianceItemsResponse: Codable {
    public let items: [ComplianceItem]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct ViolationsResponse: Codable {
    public let violations: [Violation]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct ComplianceScoreResponse: Codable {
    public let score: ComplianceScore
    public let success: Bool
}

public struct RegulationsResponse: Codable {
    public let regulations: [Regulation]
    public let total: Int
}

// MARK: - Request Models
public struct ComplianceItemCreateRequest: Codable {
    public let type: ComplianceItemType
    public let entityId: String
    public let entityType: String
    public let expirationDate: String
    public let issueDate: String?
    public let documentNumber: String?
    public let issuingAuthority: String?
    public let jurisdiction: String?
    public let notes: String?
}

public struct ComplianceItemUpdateRequest: Codable {
    public let status: ComplianceStatus?
    public let expirationDate: String?
    public let renewalDate: String?
    public let notes: String?
}

public struct ViolationCreateRequest: Codable {
    public let type: ComplianceItemType
    public let category: ComplianceCategory
    public let entityId: String
    public let entityType: String
    public let violationDate: String
    public let severity: ViolationSeverity
    public let description: String
    public let citationNumber: String?
    public let fineAmount: Double?
    public let location: String?
}

public struct ViolationResolveRequest: Codable {
    public let resolvedBy: String
    public let resolutionNotes: String
}
