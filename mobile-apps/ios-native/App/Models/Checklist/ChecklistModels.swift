//
//  ChecklistModels.swift
//  Fleet Manager
//
//  Smart Configurable Checklist System with Location-Based Triggers
//  Supports OSHA, mileage reports, fuel reports, resource checks, and more
//

import Foundation
import CoreLocation

// MARK: - Supporting Types

enum UserRole: String, Codable {
    case admin = "Admin"
    case fleetManager = "Fleet Manager"
    case dispatcher = "Dispatcher"
    case driver = "Driver"
    case mechanic = "Mechanic"
    case viewer = "Viewer"
}

struct Coordinate: Codable, Equatable {
    let latitude: Double
    let longitude: Double

    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    init(_ coordinate: CLLocationCoordinate2D) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
    }

    var clLocationCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

struct Geofence: Identifiable, Codable {
    let id: String
    let name: String
    let center: Coordinate
    let radius: Double
    let isActive: Bool
}

// MARK: - Checklist Template

struct ChecklistTemplate: Codable, Identifiable, Equatable {
    let id: String
    var name: String
    var description: String
    var category: ChecklistCategory
    var items: [ChecklistItemTemplate]
    var triggers: [ChecklistTrigger]
    var isRequired: Bool
    var timeoutMinutes: Int? // Auto-expire after X minutes
    var allowSkip: Bool
    var requiresApproval: Bool
    var approverRoles: [UserRole]
    var attachmentTypes: [AttachmentType]
    var createdBy: String
    var createdAt: Date
    var isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case category
        case items
        case triggers
        case isRequired = "is_required"
        case timeoutMinutes = "timeout_minutes"
        case allowSkip = "allow_skip"
        case requiresApproval = "requires_approval"
        case approverRoles = "approver_roles"
        case attachmentTypes = "attachment_types"
        case createdBy = "created_by"
        case createdAt = "created_at"
        case isActive = "is_active"
    }
}

enum ChecklistCategory: String, Codable, CaseIterable {
    case osha = "OSHA Safety"
    case preTripInspection = "Pre-Trip Inspection"
    case postTripInspection = "Post-Trip Inspection"
    case siteArrival = "Site Arrival"
    case siteDeparture = "Site Departure"
    case taskCompletion = "Task Completion"
    case resourceCheck = "Resource Check"
    case mileageReport = "Mileage Report"
    case fuelReport = "Fuel Report"
    case deliveryConfirmation = "Delivery Confirmation"
    case pickupConfirmation = "Pickup Confirmation"
    case incidentReport = "Incident Report"
    case maintenance = "Maintenance"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .osha: return "shield.checkered"
        case .preTripInspection: return "checklist.checked"
        case .postTripInspection: return "checkmark.circle"
        case .siteArrival: return "location.circle.fill"
        case .siteDeparture: return "location.slash.fill"
        case .taskCompletion: return "checkmark.seal.fill"
        case .resourceCheck: return "cube.box.fill"
        case .mileageReport: return "gauge"
        case .fuelReport: return "fuelpump.fill"
        case .deliveryConfirmation: return "shippingbox.fill"
        case .pickupConfirmation: return "arrow.down.circle.fill"
        case .incidentReport: return "exclamationmark.triangle.fill"
        case .maintenance: return "wrench.fill"
        case .custom: return "doc.text.fill"
        }
    }

    var colorName: String {
        switch self {
        case .osha: return "red"
        case .preTripInspection: return "blue"
        case .postTripInspection: return "green"
        case .siteArrival: return "purple"
        case .siteDeparture: return "orange"
        case .taskCompletion: return "teal"
        case .resourceCheck: return "cyan"
        case .mileageReport: return "indigo"
        case .fuelReport: return "yellow"
        case .deliveryConfirmation: return "mint"
        case .pickupConfirmation: return "pink"
        case .incidentReport: return "red"
        case .maintenance: return "orange"
        case .custom: return "gray"
        }
    }
}

// MARK: - Checklist Triggers

struct ChecklistTrigger: Codable, Identifiable, Equatable {
    let id: String
    var type: TriggerType
    var conditions: [TriggerCondition]
    var isEnabled: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case conditions
        case isEnabled = "is_enabled"
    }
}

enum TriggerType: String, Codable {
    case geofenceEntry = "Enter Geofence"
    case geofenceExit = "Exit Geofence"
    case taskStart = "Task Started"
    case taskComplete = "Task Completed"
    case timeOfDay = "Time of Day"
    case mileageInterval = "Mileage Interval"
    case fuelLevel = "Fuel Level"
    case engineHours = "Engine Hours"
    case manual = "Manual"
}

struct TriggerCondition: Codable, Identifiable, Equatable {
    let id: String
    var parameter: String
    var conditionOperator: ConditionOperator
    var value: String

    enum CodingKeys: String, CodingKey {
        case id
        case parameter
        case conditionOperator = "operator"
        case value
    }
}

enum ConditionOperator: String, Codable {
    case equals
    case notEquals
    case greaterThan
    case lessThan
    case contains
    case notContains
    case between
}

// MARK: - Checklist Item Template

struct ChecklistItemTemplate: Codable, Identifiable, Equatable {
    let id: String
    var sequenceNumber: Int
    var text: String
    var description: String?
    var type: ChecklistItemType
    var isRequired: Bool
    var options: [String]? // For choice/multiChoice types
    var validationRules: ValidationRules?
    var dependencies: [String]? // IDs of items this depends on
    var conditionalLogic: ConditionalLogic?

    enum CodingKeys: String, CodingKey {
        case id
        case sequenceNumber = "sequence_number"
        case text
        case description
        case type
        case isRequired = "is_required"
        case options
        case validationRules = "validation_rules"
        case dependencies
        case conditionalLogic = "conditional_logic"
    }
}

enum ChecklistItemType: String, Codable {
    case checkbox = "Checkbox"
    case text = "Text Input"
    case number = "Number Input"
    case choice = "Single Choice"
    case multiChoice = "Multiple Choice"
    case signature = "Signature"
    case photo = "Photo"
    case location = "Location"
    case dateTime = "Date/Time"
    case barcode = "Barcode Scan"
    case odometer = "Odometer Reading"
    case fuelGallons = "Fuel Gallons"
}

struct ValidationRules: Codable, Equatable {
    var minValue: Double?
    var maxValue: Double?
    var minLength: Int?
    var maxLength: Int?
    var pattern: String? // Regex pattern
    var required: Bool

    enum CodingKeys: String, CodingKey {
        case minValue = "min_value"
        case maxValue = "max_value"
        case minLength = "min_length"
        case maxLength = "max_length"
        case pattern
        case required
    }
}

struct ConditionalLogic: Codable, Equatable {
    var showIf: [Condition]
    var hideIf: [Condition]?

    enum CodingKeys: String, CodingKey {
        case showIf = "show_if"
        case hideIf = "hide_if"
    }
}

struct Condition: Codable, Equatable {
    var itemId: String
    var conditionOperator: ConditionOperator
    var value: String

    enum CodingKeys: String, CodingKey {
        case itemId = "item_id"
        case conditionOperator = "operator"
        case value
    }
}

// MARK: - Checklist Instance

struct ChecklistInstance: Codable, Identifiable, Equatable {
    let id: String
    var templateId: String
    var templateName: String
    var category: ChecklistCategory
    var status: ChecklistStatus
    var triggeredBy: TriggerType
    var triggeredAt: Date
    var startedAt: Date?
    var completedAt: Date?
    var expiresAt: Date?
    var driverId: String
    var driverName: String
    var vehicleId: String?
    var vehicleNumber: String?
    var locationCoordinate: Coordinate?
    var locationName: String?
    var tripId: String?
    var taskId: String?
    var items: [ChecklistItemInstance]
    var attachments: [ChecklistAttachment]
    var signature: Data?
    var notes: String?
    var submittedAt: Date?
    var approvedBy: String?
    var approvedAt: Date?

    var progressPercentage: Double {
        let total = Double(items.count)
        guard total > 0 else { return 0 }
        let completed = Double(items.filter { $0.response != nil }.count)
        return (completed / total) * 100
    }

    var isExpired: Bool {
        guard let expiresAt = expiresAt else { return false }
        return Date() > expiresAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case templateId = "template_id"
        case templateName = "template_name"
        case category
        case status
        case triggeredBy = "triggered_by"
        case triggeredAt = "triggered_at"
        case startedAt = "started_at"
        case completedAt = "completed_at"
        case expiresAt = "expires_at"
        case driverId = "driver_id"
        case driverName = "driver_name"
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case locationCoordinate = "location"
        case locationName = "location_name"
        case tripId = "trip_id"
        case taskId = "task_id"
        case items
        case attachments
        case signature
        case notes
        case submittedAt = "submitted_at"
        case approvedBy = "approved_by"
        case approvedAt = "approved_at"
    }
}

enum ChecklistStatus: String, Codable {
    case pending = "Pending"
    case inProgress = "In Progress"
    case completed = "Completed"
    case expired = "Expired"
    case skipped = "Skipped"
    case rejected = "Rejected"
}

struct ChecklistItemInstance: Codable, Identifiable, Equatable {
    let id: String
    var templateItemId: String
    var text: String
    var type: ChecklistItemType
    var response: ChecklistResponse?
    var completedAt: Date?
    var isRequired: Bool
    var validationPassed: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case templateItemId = "template_item_id"
        case text
        case type
        case response
        case completedAt = "completed_at"
        case isRequired = "is_required"
        case validationPassed = "validation_passed"
    }
}

enum ChecklistResponse: Codable, Equatable {
    case boolean(Bool)
    case text(String)
    case number(Double)
    case singleChoice(String)
    case multipleChoice([String])
    case signature(String) // Base64 encoded
    case photo(String) // URL or path
    case locationData(Coordinate)
    case dateTime(Date)
    case barcode(String)

    enum CodingKeys: String, CodingKey {
        case type
        case boolValue
        case textValue
        case numberValue
        case singleChoiceValue
        case multipleChoiceValue
        case signatureValue
        case photoValue
        case locationValue
        case dateTimeValue
        case barcodeValue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "boolean":
            let value = try container.decode(Bool.self, forKey: .boolValue)
            self = .boolean(value)
        case "text":
            let value = try container.decode(String.self, forKey: .textValue)
            self = .text(value)
        case "number":
            let value = try container.decode(Double.self, forKey: .numberValue)
            self = .number(value)
        case "singleChoice":
            let value = try container.decode(String.self, forKey: .singleChoiceValue)
            self = .singleChoice(value)
        case "multipleChoice":
            let value = try container.decode([String].self, forKey: .multipleChoiceValue)
            self = .multipleChoice(value)
        case "signature":
            let value = try container.decode(String.self, forKey: .signatureValue)
            self = .signature(value)
        case "photo":
            let value = try container.decode(String.self, forKey: .photoValue)
            self = .photo(value)
        case "location":
            let value = try container.decode(Coordinate.self, forKey: .locationValue)
            self = .locationData(value)
        case "dateTime":
            let value = try container.decode(Date.self, forKey: .dateTimeValue)
            self = .dateTime(value)
        case "barcode":
            let value = try container.decode(String.self, forKey: .barcodeValue)
            self = .barcode(value)
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown response type")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .boolean(let value):
            try container.encode("boolean", forKey: .type)
            try container.encode(value, forKey: .boolValue)
        case .text(let value):
            try container.encode("text", forKey: .type)
            try container.encode(value, forKey: .textValue)
        case .number(let value):
            try container.encode("number", forKey: .type)
            try container.encode(value, forKey: .numberValue)
        case .singleChoice(let value):
            try container.encode("singleChoice", forKey: .type)
            try container.encode(value, forKey: .singleChoiceValue)
        case .multipleChoice(let value):
            try container.encode("multipleChoice", forKey: .type)
            try container.encode(value, forKey: .multipleChoiceValue)
        case .signature(let value):
            try container.encode("signature", forKey: .type)
            try container.encode(value, forKey: .signatureValue)
        case .photo(let value):
            try container.encode("photo", forKey: .type)
            try container.encode(value, forKey: .photoValue)
        case .locationData(let value):
            try container.encode("location", forKey: .type)
            try container.encode(value, forKey: .locationValue)
        case .dateTime(let value):
            try container.encode("dateTime", forKey: .type)
            try container.encode(value, forKey: .dateTimeValue)
        case .barcode(let value):
            try container.encode("barcode", forKey: .type)
            try container.encode(value, forKey: .barcodeValue)
        }
    }
}

struct ChecklistAttachment: Codable, Identifiable, Equatable {
    let id: String
    var type: AttachmentType
    var url: String
    var filename: String
    var uploadedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case url
        case filename
        case uploadedAt = "uploaded_at"
    }
}

enum AttachmentType: String, Codable {
    case photo
    case video
    case document
    case audio
}

// MARK: - Predefined Templates

// struct PredefinedTemplates {
//     static let oshaChecklist = ChecklistTemplate(
//         id: "osha-site-safety",
//         name: "OSHA Site Safety Checklist",
//         description: "Required safety inspection before entering work site",
//         category: .osha,
//         items: [
//             ChecklistItemTemplate(
//                 id: "ppe-hardhat",
//                 sequenceNumber: 1,
//                 text: "Hard hat available and in good condition",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "ppe-vest",
//                 sequenceNumber: 2,
//                 text: "High-visibility vest available",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "ppe-boots",
//                 sequenceNumber: 3,
//                 text: "Steel-toe boots worn",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "hazards-identified",
//                 sequenceNumber: 4,
//                 text: "Site hazards identified and documented",
//                 description: "Document any visible hazards",
//                 type: .text,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: ValidationRules(
//                     minValue: nil,
//                     maxValue: nil,
//                     minLength: 10,
//                     maxLength: 500,
//                     pattern: nil,
//                     required: true
//                 ),
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "emergency-exits",
//                 sequenceNumber: 5,
//                 text: "Emergency exits identified",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "safety-photo",
//                 sequenceNumber: 6,
//                 text: "Photo of PPE and work area",
//                 description: nil,
//                 type: .photo,
//                 isRequired: false,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             )
//         ],
//         triggers: [
//             ChecklistTrigger(
//                 id: "site-entry",
//                 type: .geofenceEntry,
//                 conditions: [],
//                 isEnabled: true
//             )
//         ],
//         isRequired: true,
//         timeoutMinutes: 15,
//         allowSkip: false,
//         requiresApproval: false,
//         approverRoles: [],
//         attachmentTypes: [.photo],
//         createdBy: "system",
//         createdAt: Date(),
//         isActive: true
//     )
// 
//     static let mileageReport = ChecklistTemplate(
//         id: "mileage-report",
//         name: "Mileage Report",
//         description: "Record trip mileage and fuel usage",
//         category: .mileageReport,
//         items: [
//             ChecklistItemTemplate(
//                 id: "starting-odometer",
//                 sequenceNumber: 1,
//                 text: "Starting Odometer Reading",
//                 description: nil,
//                 type: .odometer,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: ValidationRules(
//                     minValue: 0,
//                     maxValue: 999999,
//                     minLength: nil,
//                     maxLength: nil,
//                     pattern: nil,
//                     required: true
//                 ),
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "ending-odometer",
//                 sequenceNumber: 2,
//                 text: "Ending Odometer Reading",
//                 description: nil,
//                 type: .odometer,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: ValidationRules(
//                     minValue: 0,
//                     maxValue: 999999,
//                     minLength: nil,
//                     maxLength: nil,
//                     pattern: nil,
//                     required: true
//                 ),
//                 dependencies: ["starting-odometer"],
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "trip-purpose",
//                 sequenceNumber: 3,
//                 text: "Trip Purpose",
//                 description: nil,
//                 type: .choice,
//                 isRequired: true,
//                 options: ["Delivery", "Pickup", "Service Call", "Meeting", "Training", "Other"],
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             )
//         ],
//         triggers: [
//             ChecklistTrigger(
//                 id: "trip-end",
//                 type: .taskComplete,
//                 conditions: [],
//                 isEnabled: true
//             )
//         ],
//         isRequired: true,
//         timeoutMinutes: 30,
//         allowSkip: false,
//         requiresApproval: false,
//         approverRoles: [],
//         attachmentTypes: [],
//         createdBy: "system",
//         createdAt: Date(),
//         isActive: true
//     )
// 
//     static let fuelReport = ChecklistTemplate(
//         id: "fuel-report",
//         name: "Fuel Report",
//         description: "Record fuel purchase details",
//         category: .fuelReport,
//         items: [
//             ChecklistItemTemplate(
//                 id: "fuel-gallons",
//                 sequenceNumber: 1,
//                 text: "Gallons Purchased",
//                 description: nil,
//                 type: .fuelGallons,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: ValidationRules(
//                     minValue: 0.1,
//                     maxValue: 200,
//                     minLength: nil,
//                     maxLength: nil,
//                     pattern: nil,
//                     required: true
//                 ),
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "price-per-gallon",
//                 sequenceNumber: 2,
//                 text: "Price Per Gallon ($)",
//                 description: nil,
//                 type: .number,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: ValidationRules(
//                     minValue: 0.01,
//                     maxValue: 20,
//                     minLength: nil,
//                     maxLength: nil,
//                     pattern: nil,
//                     required: true
//                 ),
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "fuel-receipt",
//                 sequenceNumber: 3,
//                 text: "Upload Fuel Receipt",
//                 description: nil,
//                 type: .photo,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "odometer-at-fuel",
//                 sequenceNumber: 4,
//                 text: "Current Odometer Reading",
//                 description: nil,
//                 type: .odometer,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: ValidationRules(
//                     minValue: 0,
//                     maxValue: 999999,
//                     minLength: nil,
//                     maxLength: nil,
//                     pattern: nil,
//                     required: true
//                 ),
//                 dependencies: nil,
//                 conditionalLogic: nil
//             )
//         ],
//         triggers: [
//             ChecklistTrigger(
//                 id: "fuel-low",
//                 type: .fuelLevel,
//                 conditions: [
//                     TriggerCondition(
//                         id: "fuel-threshold",
//                         parameter: "fuelLevel",
//                         conditionOperator: .lessThan,
//                         value: "25"
//                     )
//                 ],
//                 isEnabled: true
//             )
//         ],
//         isRequired: true,
//         timeoutMinutes: 60,
//         allowSkip: false,
//         requiresApproval: false,
//         approverRoles: [],
//         attachmentTypes: [.photo],
//         createdBy: "system",
//         createdAt: Date(),
//         isActive: true
//     )
// 
//     static let resourceChecklist = ChecklistTemplate(
//         id: "resource-check",
//         name: "Resource/Equipment Checklist",
//         description: "Verify all required equipment and resources are available",
//         category: .resourceCheck,
//         items: [
//             ChecklistItemTemplate(
//                 id: "tools-complete",
//                 sequenceNumber: 1,
//                 text: "All required tools present",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "materials-complete",
//                 sequenceNumber: 2,
//                 text: "All materials/supplies loaded",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "missing-items",
//                 sequenceNumber: 3,
//                 text: "List any missing items",
//                 description: "If any items are missing, list them here",
//                 type: .text,
//                 isRequired: false,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             )
//         ],
//         triggers: [
//             ChecklistTrigger(
//                 id: "task-start",
//                 type: .taskStart,
//                 conditions: [],
//                 isEnabled: true
//             )
//         ],
//         isRequired: true,
//         timeoutMinutes: 10,
//         allowSkip: false,
//         requiresApproval: false,
//         approverRoles: [],
//         attachmentTypes: [.photo],
//         createdBy: "system",
//         createdAt: Date(),
//         isActive: true
//     )
// 
//     static let preTripInspection = ChecklistTemplate(
//         id: "pre-trip-inspection",
//         name: "Pre-Trip Inspection",
//         description: "Vehicle safety inspection before starting trip",
//         category: .preTripInspection,
//         items: [
//             ChecklistItemTemplate(
//                 id: "tire-condition",
//                 sequenceNumber: 1,
//                 text: "Tire condition and pressure",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "lights-working",
//                 sequenceNumber: 2,
//                 text: "All lights working properly",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "fluid-levels",
//                 sequenceNumber: 3,
//                 text: "Fluid levels checked",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "brakes-working",
//                 sequenceNumber: 4,
//                 text: "Brakes functioning properly",
//                 description: nil,
//                 type: .checkbox,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             ),
//             ChecklistItemTemplate(
//                 id: "inspection-signature",
//                 sequenceNumber: 5,
//                 text: "Inspector Signature",
//                 description: nil,
//                 type: .signature,
//                 isRequired: true,
//                 options: nil,
//                 validationRules: nil,
//                 dependencies: nil,
//                 conditionalLogic: nil
//             )
//         ],
//         triggers: [
//             ChecklistTrigger(
//                 id: "trip-start",
//                 type: .taskStart,
//                 conditions: [],
//                 isEnabled: true
//             )
//         ],
//         isRequired: true,
//         timeoutMinutes: 20,
//         allowSkip: false,
//         requiresApproval: false,
//         approverRoles: [],
//         attachmentTypes: [.photo],
//         createdBy: "system",
//         createdAt: Date(),
//         isActive: true
//     )
// 
//     static func allTemplates() -> [ChecklistTemplate] {
//         return [oshaChecklist, mileageReport, fuelReport, resourceChecklist, preTripInspection]
//     }
// }

// MARK: - API Response Models

struct ChecklistTemplatesResponse: Codable {
    let templates: [ChecklistTemplate]
    let total: Int
}

struct ChecklistInstancesResponse: Codable {
    let checklists: [ChecklistInstance]
    let total: Int
}

struct ChecklistInstanceResponse: Codable {
    let checklist: ChecklistInstance
}
