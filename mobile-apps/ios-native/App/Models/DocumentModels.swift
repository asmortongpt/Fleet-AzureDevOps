import Foundation
import SwiftUI

// MARK: - Fleet Document
struct FleetDocument: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let type: DocumentType
    let category: DocumentCategory
    let description: String?
    let fileUrl: String?
    var fileData: Data?
    let fileSize: Int64
    let mimeType: String
    let uploadedDate: Date
    let uploadedBy: String
    let expirationDate: Date?
    let reminderDate: Date?
    let relatedEntityType: RelatedEntityType
    let relatedEntityId: String
    let relatedEntityName: String
    let tags: [String]
    var status: DocumentStatus
    let version: Int
    let isConfidential: Bool
    let lastModifiedDate: Date?
    let lastModifiedBy: String?

    // Computed properties
    var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }

    var isExpiringSoon: Bool {
        guard let expirationDate = expirationDate else { return false }
        let daysUntilExpiration = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0
    }

    var daysUntilExpiration: Int? {
        guard let expirationDate = expirationDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day
    }

    var formattedFileSize: String {
        ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
    }

    var formattedUploadDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: uploadedDate)
    }

    var formattedExpirationDate: String? {
        guard let expirationDate = expirationDate else { return nil }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: expirationDate)
    }

    var statusColor: Color {
        if isExpired {
            return ModernTheme.Colors.error
        } else if isExpiringSoon {
            return ModernTheme.Colors.warning
        } else {
            return ModernTheme.Colors.success
        }
    }

    var fileExtension: String {
        (name as NSString).pathExtension.uppercased()
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case type
        case category
        case description
        case fileUrl = "file_url"
        case fileSize = "file_size"
        case mimeType = "mime_type"
        case uploadedDate = "uploaded_date"
        case uploadedBy = "uploaded_by"
        case expirationDate = "expiration_date"
        case reminderDate = "reminder_date"
        case relatedEntityType = "related_entity_type"
        case relatedEntityId = "related_entity_id"
        case relatedEntityName = "related_entity_name"
        case tags
        case status
        case version
        case isConfidential = "is_confidential"
        case lastModifiedDate = "last_modified_date"
        case lastModifiedBy = "last_modified_by"
    }

    static var sample: FleetDocument {
        FleetDocument(
            id: UUID().uuidString,
            name: "Vehicle Registration.pdf",
            type: .registration,
            category: .vehicle,
            description: "Annual vehicle registration document",
            fileUrl: nil,
            fileSize: 1024 * 1024,
            mimeType: "application/pdf",
            uploadedDate: Date().addingTimeInterval(-86400 * 30),
            uploadedBy: "John Doe",
            expirationDate: Date().addingTimeInterval(86400 * 60),
            reminderDate: Date().addingTimeInterval(86400 * 30),
            relatedEntityType: .vehicle,
            relatedEntityId: "VEH-001",
            relatedEntityName: "Vehicle V-12345",
            tags: ["registration", "2025"],
            status: .active,
            version: 1,
            isConfidential: false,
            lastModifiedDate: nil,
            lastModifiedBy: nil
        )
    }
}

// MARK: - Document Type
enum DocumentType: String, Codable, CaseIterable {
    case registration = "Registration"
    case insurance = "Insurance"
    case inspection = "Inspection"
    case maintenance = "Maintenance"
    case permit = "Permit"
    case license = "License"
    case certification = "Certification"
    case contract = "Contract"
    case invoice = "Invoice"
    case receipt = "Receipt"
    case policy = "Policy"
    case manual = "Manual"
    case warranty = "Warranty"
    case lease = "Lease"
    case accident = "Accident Report"
    case safety = "Safety"
    case training = "Training"
    case other = "Other"

    var icon: String {
        switch self {
        case .registration: return "doc.text.fill"
        case .insurance: return "shield.fill"
        case .inspection: return "checkmark.shield.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .permit: return "doc.badge.gearshape"
        case .license: return "person.text.rectangle.fill"
        case .certification: return "rosette"
        case .contract: return "doc.on.doc.fill"
        case .invoice: return "dollarsign.circle.fill"
        case .receipt: return "receipt.fill"
        case .policy: return "doc.plaintext.fill"
        case .manual: return "book.fill"
        case .warranty: return "shield.checkered"
        case .lease: return "house.fill"
        case .accident: return "exclamationmark.triangle.fill"
        case .safety: return "cross.case.fill"
        case .training: return "graduationcap.fill"
        case .other: return "doc.fill"
        }
    }

    var color: Color {
        switch self {
        case .registration: return .blue
        case .insurance: return .green
        case .inspection: return .orange
        case .maintenance: return .purple
        case .permit: return .teal
        case .license: return .indigo
        case .certification: return .mint
        case .contract: return .cyan
        case .invoice, .receipt: return .yellow
        case .policy: return .gray
        case .manual: return .brown
        case .warranty: return .green
        case .lease: return .pink
        case .accident: return .red
        case .safety: return .red
        case .training: return .blue
        case .other: return .gray
        }
    }

    var requiresExpiration: Bool {
        switch self {
        case .registration, .insurance, .inspection, .permit, .license, .certification, .warranty, .lease:
            return true
        default:
            return false
        }
    }
}

// MARK: - Document Category
enum DocumentCategory: String, Codable, CaseIterable {
    case vehicle = "Vehicle"
    case driver = "Driver"
    case fleet = "Fleet"
    case compliance = "Compliance"
    case financial = "Financial"
    case safety = "Safety"
    case training = "Training"
    case other = "Other"

    var icon: String {
        switch self {
        case .vehicle: return "car.fill"
        case .driver: return "person.fill"
        case .fleet: return "car.2.fill"
        case .compliance: return "checkmark.seal.fill"
        case .financial: return "dollarsign.circle.fill"
        case .safety: return "shield.fill"
        case .training: return "graduationcap.fill"
        case .other: return "folder.fill"
        }
    }
}

// MARK: - Related Entity Type
enum RelatedEntityType: String, Codable {
    case vehicle = "Vehicle"
    case driver = "Driver"
    case fleet = "Fleet"
    case department = "Department"
    case vendor = "Vendor"
    case general = "General"
}

// MARK: - Document Status
enum DocumentStatus: String, Codable, CaseIterable {
    case active = "Active"
    case expired = "Expired"
    case pending = "Pending Review"
    case archived = "Archived"
    case draft = "Draft"

    var color: Color {
        switch self {
        case .active: return ModernTheme.Colors.success
        case .expired: return ModernTheme.Colors.error
        case .pending: return ModernTheme.Colors.warning
        case .archived: return ModernTheme.Colors.idle
        case .draft: return ModernTheme.Colors.secondaryText
        }
    }

    var icon: String {
        switch self {
        case .active: return "checkmark.circle.fill"
        case .expired: return "xmark.circle.fill"
        case .pending: return "clock.fill"
        case .archived: return "archivebox.fill"
        case .draft: return "pencil.circle.fill"
        }
    }
}

// MARK: - Document Upload Request
struct DocumentUploadRequest {
    let name: String
    let type: DocumentType
    let category: DocumentCategory
    let description: String?
    let fileData: Data
    let mimeType: String
    let expirationDate: Date?
    let reminderDate: Date?
    let relatedEntityType: RelatedEntityType
    let relatedEntityId: String
    let relatedEntityName: String
    let tags: [String]
    let isConfidential: Bool
}

// MARK: - Document Expiration Alert
struct DocumentExpirationAlert: Identifiable {
    let id: String
    let documentId: String
    let documentName: String
    let documentType: DocumentType
    let expirationDate: Date
    let daysUntilExpiration: Int
    let severity: AlertSeverity
    let relatedEntityName: String

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: expirationDate)
    }

    var message: String {
        switch severity {
        case .critical:
            return "Expired \(abs(daysUntilExpiration)) days ago"
        case .high:
            return "Expires in \(daysUntilExpiration) days"
        case .medium:
            return "Expires in \(daysUntilExpiration) days"
        case .low:
            return "Expires in \(daysUntilExpiration) days"
        }
    }

    enum AlertSeverity {
        case critical // Expired
        case high     // 0-7 days
        case medium   // 8-30 days
        case low      // 31-60 days

        var color: Color {
            switch self {
            case .critical: return ModernTheme.Colors.error
            case .high: return Color.red
            case .medium: return ModernTheme.Colors.warning
            case .low: return ModernTheme.Colors.info
            }
        }

        var icon: String {
            switch self {
            case .critical: return "exclamationmark.octagon.fill"
            case .high: return "exclamationmark.triangle.fill"
            case .medium: return "exclamationmark.circle.fill"
            case .low: return "info.circle.fill"
            }
        }
    }

    static func from(document: FleetDocument) -> DocumentExpirationAlert? {
        guard let expirationDate = document.expirationDate else { return nil }
        guard let daysUntil = document.daysUntilExpiration else { return nil }

        let severity: AlertSeverity
        if daysUntil < 0 {
            severity = .critical
        } else if daysUntil <= 7 {
            severity = .high
        } else if daysUntil <= 30 {
            severity = .medium
        } else if daysUntil <= 60 {
            severity = .low
        } else {
            return nil // Not expiring soon enough to alert
        }

        return DocumentExpirationAlert(
            id: document.id,
            documentId: document.id,
            documentName: document.name,
            documentType: document.type,
            expirationDate: expirationDate,
            daysUntilExpiration: daysUntil,
            severity: severity,
            relatedEntityName: document.relatedEntityName
        )
    }
}

// MARK: - Document Library Statistics
struct DocumentLibraryStats: Codable {
    let totalDocuments: Int
    let activeDocuments: Int
    let expiredDocuments: Int
    let expiringSoonDocuments: Int
    let documentsByType: [String: Int]
    let documentsByCategory: [String: Int]
    let totalStorageUsed: Int64
    let recentUploads: Int
    let pendingReview: Int

    var formattedStorageUsed: String {
        ByteCountFormatter.string(fromByteCount: totalStorageUsed, countStyle: .file)
    }

    enum CodingKeys: String, CodingKey {
        case totalDocuments = "total_documents"
        case activeDocuments = "active_documents"
        case expiredDocuments = "expired_documents"
        case expiringSoonDocuments = "expiring_soon_documents"
        case documentsByType = "documents_by_type"
        case documentsByCategory = "documents_by_category"
        case totalStorageUsed = "total_storage_used"
        case recentUploads = "recent_uploads"
        case pendingReview = "pending_review"
    }
}

// MARK: - Document Search Criteria
struct DocumentSearchCriteria {
    var query: String = ""
    var types: Set<DocumentType> = []
    var categories: Set<DocumentCategory> = []
    var statuses: Set<DocumentStatus> = []
    var relatedEntityType: RelatedEntityType?
    var relatedEntityId: String?
    var expiringOnly: Bool = false
    var expiredOnly: Bool = false
    var uploadedAfter: Date?
    var uploadedBefore: Date?
    var tags: Set<String> = []

    var isActive: Bool {
        !query.isEmpty || !types.isEmpty || !categories.isEmpty ||
        !statuses.isEmpty || relatedEntityType != nil ||
        expiringOnly || expiredOnly || uploadedAfter != nil ||
        uploadedBefore != nil || !tags.isEmpty
    }

    mutating func reset() {
        query = ""
        types.removeAll()
        categories.removeAll()
        statuses.removeAll()
        relatedEntityType = nil
        relatedEntityId = nil
        expiringOnly = false
        expiredOnly = false
        uploadedAfter = nil
        uploadedBefore = nil
        tags.removeAll()
    }
}

// MARK: - API Response Models
struct DocumentsResponse: Codable {
    let documents: [FleetDocument]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct DocumentResponse: Codable {
    let document: FleetDocument
    let downloadUrl: String?

    enum CodingKeys: String, CodingKey {
        case document
        case downloadUrl = "download_url"
    }
}

struct DocumentStatsResponse: Codable {
    let stats: DocumentLibraryStats
}

struct DocumentUploadResponse: Codable {
    let success: Bool
    let document: FleetDocument
    let message: String
}
