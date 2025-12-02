import Foundation
import CoreLocation
import SwiftUI

// MARK: - Geofence
struct Geofence: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let description: String?
    let type: GeofenceType
    let shape: GeofenceShape
    let isActive: Bool
    let createdDate: Date
    let createdBy: String
    var lastModifiedDate: Date?
    var lastModifiedBy: String?
    let assignedVehicles: [String]
    let assignedDrivers: [String]
    let notifications: GeofenceNotifications
    let schedule: GeofenceSchedule?
    let tags: [String]

    var color: Color {
        type.color
    }

    var icon: String {
        type.icon
    }

    var statusColor: Color {
        isActive ? ModernTheme.Colors.success : ModernTheme.Colors.idle
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case type
        case shape
        case isActive = "is_active"
        case createdDate = "created_date"
        case createdBy = "created_by"
        case lastModifiedDate = "last_modified_date"
        case lastModifiedBy = "last_modified_by"
        case assignedVehicles = "assigned_vehicles"
        case assignedDrivers = "assigned_drivers"
        case notifications
        case schedule
        case tags
    }

    static var sample: Geofence {
        Geofence(
            id: UUID().uuidString,
            name: "Downtown Zone",
            description: "City center area",
            type: .restricted,
            shape: .circle(GeofenceCircle(
                center: CLLocationCoordinate2D(latitude: 38.9072, longitude: -77.0369),
                radius: 1000
            )),
            isActive: true,
            createdDate: Date(),
            createdBy: "Admin",
            assignedVehicles: ["VEH-001", "VEH-002"],
            assignedDrivers: [],
            notifications: GeofenceNotifications(
                onEntry: true,
                onExit: true,
                onDwell: false,
                dwellTimeMinutes: nil
            ),
            schedule: nil,
            tags: ["downtown", "restricted"]
        )
    }
}

// MARK: - Geofence Type
enum GeofenceType: String, Codable, CaseIterable {
    case restricted = "Restricted"
    case allowed = "Allowed"
    case serviceArea = "Service Area"
    case parking = "Parking"
    case depot = "Depot"
    case customer = "Customer Site"
    case hazard = "Hazard Zone"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .restricted: return "nosign"
        case .allowed: return "checkmark.shield.fill"
        case .serviceArea: return "mappin.circle.fill"
        case .parking: return "parkingsign.circle.fill"
        case .depot: return "house.fill"
        case .customer: return "building.2.fill"
        case .hazard: return "exclamationmark.triangle.fill"
        case .custom: return "mappin.and.ellipse"
        }
    }

    var color: Color {
        switch self {
        case .restricted: return .red
        case .allowed: return .green
        case .serviceArea: return .blue
        case .parking: return .purple
        case .depot: return .orange
        case .customer: return .teal
        case .hazard: return .yellow
        case .custom: return .gray
        }
    }
}

// MARK: - Geofence Shape
enum GeofenceShape: Codable, Equatable {
    case circle(GeofenceCircle)
    case polygon(GeofencePolygon)

    enum CodingKeys: String, CodingKey {
        case type
        case circle
        case polygon
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "circle":
            let circle = try container.decode(GeofenceCircle.self, forKey: .circle)
            self = .circle(circle)
        case "polygon":
            let polygon = try container.decode(GeofencePolygon.self, forKey: .polygon)
            self = .polygon(polygon)
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown shape type")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .circle(let circle):
            try container.encode("circle", forKey: .type)
            try container.encode(circle, forKey: .circle)
        case .polygon(let polygon):
            try container.encode("polygon", forKey: .type)
            try container.encode(polygon, forKey: .polygon)
        }
    }

    var displayName: String {
        switch self {
        case .circle: return "Circle"
        case .polygon: return "Polygon"
        }
    }
}

// MARK: - Geofence Circle
struct GeofenceCircle: Codable, Equatable {
    let center: Coordinate
    let radius: Double // in meters

    init(center: CLLocationCoordinate2D, radius: Double) {
        self.center = Coordinate(latitude: center.latitude, longitude: center.longitude)
        self.radius = radius
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: center.latitude, longitude: center.longitude)
    }

    var formattedRadius: String {
        if radius >= 1000 {
            return String(format: "%.1f km", radius / 1000)
        } else {
            return String(format: "%.0f m", radius)
        }
    }
}

// MARK: - Geofence Polygon
struct GeofencePolygon: Codable, Equatable {
    let coordinates: [Coordinate]

    var clCoordinates: [CLLocationCoordinate2D] {
        coordinates.map { $0.clCoordinate }
    }

    var area: Double {
        // Calculate polygon area (simplified)
        return 0.0
    }
}

// MARK: - Coordinate
struct Coordinate: Codable, Equatable {
    let latitude: Double
    let longitude: Double

    var clCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    enum CodingKeys: String, CodingKey {
        case latitude = "lat"
        case longitude = "lon"
    }
}

// MARK: - Geofence Notifications
struct GeofenceNotifications: Codable, Equatable {
    let onEntry: Bool
    let onExit: Bool
    let onDwell: Bool
    let dwellTimeMinutes: Int?

    enum CodingKeys: String, CodingKey {
        case onEntry = "on_entry"
        case onExit = "on_exit"
        case onDwell = "on_dwell"
        case dwellTimeMinutes = "dwell_time_minutes"
    }
}

// MARK: - Geofence Schedule
struct GeofenceSchedule: Codable, Equatable {
    let startTime: String // HH:mm format
    let endTime: String
    let daysOfWeek: [Int] // 1-7 (Sunday-Saturday)
    let timezone: String

    var isActiveNow: Bool {
        // Implement time-based check
        return true
    }

    enum CodingKeys: String, CodingKey {
        case startTime = "start_time"
        case endTime = "end_time"
        case daysOfWeek = "days_of_week"
        case timezone
    }
}

// MARK: - Geofence Violation
struct GeofenceViolation: Codable, Identifiable, Equatable {
    let id: String
    let geofenceId: String
    let geofenceName: String
    let vehicleId: String
    let vehicleNumber: String
    let driverName: String?
    let violationType: ViolationType
    let timestamp: Date
    let location: Coordinate
    let duration: TimeInterval?
    let acknowledged: Bool
    let acknowledgedBy: String?
    let acknowledgedDate: Date?
    let notes: String?

    var formattedTimestamp: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: timestamp)
    }

    var formattedDuration: String? {
        guard let duration = duration else { return nil }
        let minutes = Int(duration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours)h \(mins)m"
        }
    }

    var statusColor: Color {
        acknowledged ? ModernTheme.Colors.idle : ModernTheme.Colors.error
    }

    enum ViolationType: String, Codable {
        case entry = "Unauthorized Entry"
        case exit = "Unauthorized Exit"
        case dwell = "Excessive Dwell Time"

        var icon: String {
            switch self {
            case .entry: return "arrow.right.circle.fill"
            case .exit: return "arrow.left.circle.fill"
            case .dwell: return "clock.fill"
            }
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case geofenceId = "geofence_id"
        case geofenceName = "geofence_name"
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case driverName = "driver_name"
        case violationType = "violation_type"
        case timestamp
        case location
        case duration
        case acknowledged
        case acknowledgedBy = "acknowledged_by"
        case acknowledgedDate = "acknowledged_date"
        case notes
    }

    static var sample: GeofenceViolation {
        GeofenceViolation(
            id: UUID().uuidString,
            geofenceId: "GEO-001",
            geofenceName: "Downtown Zone",
            vehicleId: "VEH-001",
            vehicleNumber: "V-12345",
            driverName: "John Doe",
            violationType: .entry,
            timestamp: Date(),
            location: Coordinate(latitude: 38.9072, longitude: -77.0369),
            duration: nil,
            acknowledged: false,
            acknowledgedBy: nil,
            acknowledgedDate: nil,
            notes: nil
        )
    }
}

// MARK: - Geofence Statistics
struct GeofenceStatistics: Codable {
    let totalGeofences: Int
    let activeGeofences: Int
    let totalViolations: Int
    let unacknowledgedViolations: Int
    let violationsByType: [String: Int]
    let violationsByGeofence: [String: Int]
    let mostViolatedGeofence: String?
    let recentViolations: [GeofenceViolation]

    enum CodingKeys: String, CodingKey {
        case totalGeofences = "total_geofences"
        case activeGeofences = "active_geofences"
        case totalViolations = "total_violations"
        case unacknowledgedViolations = "unacknowledged_violations"
        case violationsByType = "violations_by_type"
        case violationsByGeofence = "violations_by_geofence"
        case mostViolatedGeofence = "most_violated_geofence"
        case recentViolations = "recent_violations"
    }
}

// MARK: - API Response Models
struct GeofencesResponse: Codable {
    let geofences: [Geofence]
    let total: Int
}

struct GeofenceResponse: Codable {
    let geofence: Geofence
}

struct GeofenceViolationsResponse: Codable {
    let violations: [GeofenceViolation]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct GeofenceStatisticsResponse: Codable {
    let statistics: GeofenceStatistics
}
