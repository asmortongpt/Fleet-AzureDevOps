import Foundation

// MARK: - Activity Item Model
struct ActivityItem: Identifiable, Codable {
    let id: String
    let type: ActivityType
    let title: String
    let description: String?
    let timestamp: Date
    let userId: String?
    let vehicleId: String?
    let metadata: [String: String]?

    enum ActivityType: String, Codable {
        case vehicleAdded = "vehicle_added"
        case tripStarted = "trip_started"
        case tripCompleted = "trip_completed"
        case maintenanceScheduled = "maintenance_scheduled"
        case maintenanceCompleted = "maintenance_completed"
        case incidentReported = "incident_reported"
        case inspectionCompleted = "inspection_completed"
        case userLogin = "user_login"
        case alertTriggered = "alert_triggered"
        case other = "other"

        var icon: String {
            switch self {
            case .vehicleAdded: return "car.fill"
            case .tripStarted: return "location.fill"
            case .tripCompleted: return "checkmark.circle.fill"
            case .maintenanceScheduled: return "calendar"
            case .maintenanceCompleted: return "wrench.fill"
            case .incidentReported: return "exclamationmark.triangle.fill"
            case .inspectionCompleted: return "checkmark.shield.fill"
            case .userLogin: return "person.fill"
            case .alertTriggered: return "bell.fill"
            case .other: return "circle.fill"
            }
        }

        var color: String {
            switch self {
            case .vehicleAdded: return "blue"
            case .tripStarted: return "green"
            case .tripCompleted: return "green"
            case .maintenanceScheduled: return "orange"
            case .maintenanceCompleted: return "blue"
            case .incidentReported: return "red"
            case .inspectionCompleted: return "purple"
            case .userLogin: return "gray"
            case .alertTriggered: return "yellow"
            case .other: return "gray"
            }
        }
    }

    init(id: String = UUID().uuidString,
         type: ActivityType,
         title: String,
         description: String? = nil,
         timestamp: Date = Date(),
         userId: String? = nil,
         vehicleId: String? = nil,
         metadata: [String: String]? = nil) {
        self.id = id
        self.type = type
        self.title = title
        self.description = description
        self.timestamp = timestamp
        self.userId = userId
        self.vehicleId = vehicleId
        self.metadata = metadata
    }
}

// MARK: - Sample Data
extension ActivityItem {
    static let sampleActivities: [ActivityItem] = [
        ActivityItem(type: .tripStarted, title: "Trip started", description: "Vehicle #1234 departed"),
        ActivityItem(type: .maintenanceScheduled, title: "Maintenance scheduled", description: "Oil change for Fleet Vehicle A"),
        ActivityItem(type: .incidentReported, title: "Incident reported", description: "Minor damage reported on Vehicle #5678"),
        ActivityItem(type: .inspectionCompleted, title: "Inspection completed", description: "Pre-trip inspection passed")
    ]
}
