//
//  MissingModelStubs.swift
//  Fleet Manager
//
//  Temporary stub models for missing type declarations
//  These will be replaced with proper implementations
//

import Foundation
import CoreLocation

// MARK: - Dashboard Models

struct ActivityItem: Identifiable, Codable {
    let id: String
    let type: ActivityType
    let title: String
    let description: String
    let timestamp: Date
    let vehicleId: String?
    let driverId: String?

    init(
        id: String = UUID().uuidString,
        type: ActivityType,
        title: String,
        description: String,
        timestamp: Date = Date(),
        vehicleId: String? = nil,
        driverId: String? = nil
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.description = description
        self.timestamp = timestamp
        self.vehicleId = vehicleId
        self.driverId = driverId
    }
}

enum ActivityType: String, Codable {
    case tripStarted = "Trip Started"
    case tripCompleted = "Trip Completed"
    case maintenanceScheduled = "Maintenance Scheduled"
    case maintenanceCompleted = "Maintenance Completed"
    case fuelAdded = "Fuel Added"
    case alertTriggered = "Alert Triggered"
    case checklistCompleted = "Checklist Completed"
    case documentUploaded = "Document Uploaded"
    case vehicleAssigned = "Vehicle Assigned"
    case incidentReported = "Incident Reported"

    var icon: String {
        switch self {
        case .tripStarted: return "location.fill"
        case .tripCompleted: return "checkmark.circle.fill"
        case .maintenanceScheduled: return "calendar.badge.plus"
        case .maintenanceCompleted: return "wrench.and.screwdriver.fill"
        case .fuelAdded: return "fuelpump.fill"
        case .alertTriggered: return "exclamationmark.triangle.fill"
        case .checklistCompleted: return "checklist"
        case .documentUploaded: return "doc.fill"
        case .vehicleAssigned: return "car.fill"
        case .incidentReported: return "exclamationmark.shield.fill"
        }
    }

    var color: String {
        switch self {
        case .tripStarted: return "blue"
        case .tripCompleted: return "green"
        case .maintenanceScheduled: return "orange"
        case .maintenanceCompleted: return "green"
        case .fuelAdded: return "blue"
        case .alertTriggered: return "red"
        case .checklistCompleted: return "green"
        case .documentUploaded: return "purple"
        case .vehicleAssigned: return "blue"
        case .incidentReported: return "red"
        }
    }
}

// MARK: - Trip Models

struct TripEvent: Identifiable, Codable {
    let id: String
    let type: TripEventType
    let timestamp: Date
    let location: CLLocationCoordinate2D?
    let description: String
    let severity: EventSeverity?

    init(
        id: String = UUID().uuidString,
        type: TripEventType,
        timestamp: Date,
        location: CLLocationCoordinate2D? = nil,
        description: String,
        severity: EventSeverity? = nil
    ) {
        self.id = id
        self.type = type
        self.timestamp = timestamp
        self.location = location
        self.description = description
        self.severity = severity
    }
}

enum TripEventType: String, Codable {
    case hardBraking = "Hard Braking"
    case rapidAcceleration = "Rapid Acceleration"
    case sharpTurn = "Sharp Turn"
    case speedingViolation = "Speeding Violation"
    case idling = "Excessive Idling"
    case geofenceEntry = "Geofence Entry"
    case geofenceExit = "Geofence Exit"
    case stop = "Stop"
    case engineOn = "Engine On"
    case engineOff = "Engine Off"
}

enum EventSeverity: String, Codable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    case critical = "Critical"

    var color: String {
        switch self {
        case .low: return "yellow"
        case .medium: return "orange"
        case .high: return "red"
        case .critical: return "purple"
        }
    }
}

// MARK: - User Models

enum UserRole: String, Codable, CaseIterable {
    case admin = "Admin"
    case fleetManager = "Fleet Manager"
    case dispatcher = "Dispatcher"
    case driver = "Driver"
    case mechanic = "Mechanic"
    case viewer = "Viewer"

    var permissions: [String] {
        switch self {
        case .admin:
            return ["all"]
        case .fleetManager:
            return ["view_vehicles", "edit_vehicles", "view_drivers", "edit_drivers", "view_maintenance", "schedule_maintenance", "view_reports"]
        case .dispatcher:
            return ["view_vehicles", "view_drivers", "assign_vehicles", "view_trips"]
        case .driver:
            return ["view_assigned_vehicle", "start_trip", "end_trip", "report_issue"]
        case .mechanic:
            return ["view_vehicles", "view_maintenance", "complete_maintenance"]
        case .viewer:
            return ["view_vehicles", "view_reports"]
        }
    }
}

// MARK: - Location Models

typealias Coordinate = CLLocationCoordinate2D

struct Geofence: Identifiable, Codable {
    let id: String
    let name: String
    let center: CLLocationCoordinate2D
    let radius: Double // in meters
    let type: GeofenceType
    let isActive: Bool
    let enterAlert: Bool
    let exitAlert: Bool
    let createdDate: Date
    let description: String?

    init(
        id: String = UUID().uuidString,
        name: String,
        center: CLLocationCoordinate2D,
        radius: Double,
        type: GeofenceType = .custom,
        isActive: Bool = true,
        enterAlert: Bool = true,
        exitAlert: Bool = true,
        createdDate: Date = Date(),
        description: String? = nil
    ) {
        self.id = id
        self.name = name
        self.center = center
        self.radius = radius
        self.type = type
        self.isActive = isActive
        self.enterAlert = enterAlert
        self.exitAlert = exitAlert
        self.createdDate = createdDate
        self.description = description
    }

    func contains(_ coordinate: CLLocationCoordinate2D) -> Bool {
        let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        let centerLocation = CLLocation(latitude: center.latitude, longitude: center.longitude)
        return location.distance(from: centerLocation) <= radius
    }
}

enum GeofenceType: String, Codable {
    case depot = "Depot"
    case serviceArea = "Service Area"
    case restrictedZone = "Restricted Zone"
    case deliveryZone = "Delivery Zone"
    case custom = "Custom"
}

// MARK: - Document Models

struct FleetDocument: Identifiable, Codable {
    let id: String
    let name: String
    let category: DocumentCategory
    let vehicleId: String?
    let driverId: String?
    let uploadDate: Date
    let expirationDate: Date?
    let fileUrl: String
    let fileSize: Int
    let fileType: String
    let uploadedBy: String
    let notes: String?
    let tags: [String]

    init(
        id: String = UUID().uuidString,
        name: String,
        category: DocumentCategory,
        vehicleId: String? = nil,
        driverId: String? = nil,
        uploadDate: Date = Date(),
        expirationDate: Date? = nil,
        fileUrl: String,
        fileSize: Int,
        fileType: String,
        uploadedBy: String,
        notes: String? = nil,
        tags: [String] = []
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.uploadDate = uploadDate
        self.expirationDate = expirationDate
        self.fileUrl = fileUrl
        self.fileSize = fileSize
        self.fileType = fileType
        self.uploadedBy = uploadedBy
        self.notes = notes
        self.tags = tags
    }

    var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }

    var daysUntilExpiration: Int? {
        guard let expirationDate = expirationDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day
    }
}

enum DocumentCategory: String, Codable, CaseIterable {
    case registration = "Registration"
    case insurance = "Insurance"
    case inspection = "Inspection"
    case maintenance = "Maintenance"
    case driverLicense = "Driver License"
    case certification = "Certification"
    case permit = "Permit"
    case invoice = "Invoice"
    case receipt = "Receipt"
    case photo = "Photo"
    case other = "Other"

    var icon: String {
        switch self {
        case .registration: return "doc.text.fill"
        case .insurance: return "shield.fill"
        case .inspection: return "checklist"
        case .maintenance: return "wrench.fill"
        case .driverLicense: return "person.text.rectangle"
        case .certification: return "rosette"
        case .permit: return "checkmark.seal.fill"
        case .invoice: return "doc.plaintext"
        case .receipt: return "receipt"
        case .photo: return "photo"
        case .other: return "doc"
        }
    }
}

struct DocumentExpirationAlert: Identifiable, Codable {
    let id: String
    let documentId: String
    let documentName: String
    let category: DocumentCategory
    let expirationDate: Date
    let daysUntilExpiration: Int
    let severity: AlertSeverity
    let vehicleId: String?
    let driverId: String?

    init(
        id: String = UUID().uuidString,
        documentId: String,
        documentName: String,
        category: DocumentCategory,
        expirationDate: Date,
        daysUntilExpiration: Int,
        severity: AlertSeverity,
        vehicleId: String? = nil,
        driverId: String? = nil
    ) {
        self.id = id
        self.documentId = documentId
        self.documentName = documentName
        self.category = category
        self.expirationDate = expirationDate
        self.daysUntilExpiration = daysUntilExpiration
        self.severity = severity
        self.vehicleId = vehicleId
        self.driverId = driverId
    }
}

enum AlertSeverity: String, Codable {
    case info = "Info"
    case warning = "Warning"
    case urgent = "Urgent"
    case critical = "Critical"

    var color: String {
        switch self {
        case .info: return "blue"
        case .warning: return "yellow"
        case .urgent: return "orange"
        case .critical: return "red"
        }
    }
}

struct DocumentLibraryStats: Codable {
    let totalDocuments: Int
    let documentsByCategory: [DocumentCategory: Int]
    let expiringThisMonth: Int
    let expired: Int
    let totalStorageUsed: Int // in bytes
    let recentUploads: Int

    init(
        totalDocuments: Int = 0,
        documentsByCategory: [DocumentCategory: Int] = [:],
        expiringThisMonth: Int = 0,
        expired: Int = 0,
        totalStorageUsed: Int = 0,
        recentUploads: Int = 0
    ) {
        self.totalDocuments = totalDocuments
        self.documentsByCategory = documentsByCategory
        self.expiringThisMonth = expiringThisMonth
        self.expired = expired
        self.totalStorageUsed = totalStorageUsed
        self.recentUploads = recentUploads
    }

    var storageUsedMB: Double {
        Double(totalStorageUsed) / 1024.0 / 1024.0
    }
}

struct DocumentSearchCriteria: Codable {
    var searchText: String
    var categories: [DocumentCategory]
    var showExpired: Bool
    var showExpiringSoon: Bool
    var vehicleId: String?
    var driverId: String?
    var dateRange: DateRange?

    init(
        searchText: String = "",
        categories: [DocumentCategory] = [],
        showExpired: Bool = true,
        showExpiringSoon: Bool = true,
        vehicleId: String? = nil,
        driverId: String? = nil,
        dateRange: DateRange? = nil
    ) {
        self.searchText = searchText
        self.categories = categories
        self.showExpired = showExpired
        self.showExpiringSoon = showExpiringSoon
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.dateRange = dateRange
    }

    var isFiltered: Bool {
        !searchText.isEmpty || !categories.isEmpty || vehicleId != nil || driverId != nil || dateRange != nil
    }
}

struct DocumentUploadRequest: Codable {
    let name: String
    let category: DocumentCategory
    let vehicleId: String?
    let driverId: String?
    let expirationDate: Date?
    let fileData: Data
    let fileType: String
    let notes: String?
    let tags: [String]

    init(
        name: String,
        category: DocumentCategory,
        vehicleId: String? = nil,
        driverId: String? = nil,
        expirationDate: Date? = nil,
        fileData: Data,
        fileType: String,
        notes: String? = nil,
        tags: [String] = []
    ) {
        self.name = name
        self.category = category
        self.vehicleId = vehicleId
        self.driverId = driverId
        self.expirationDate = expirationDate
        self.fileData = fileData
        self.fileType = fileType
        self.notes = notes
        self.tags = tags
    }
}
