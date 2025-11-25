import Foundation
import CoreLocation
import SwiftUI

// MARK: - Route
struct Route: Codable, Identifiable, Equatable {
    let id: String
    let tenantId: String
    let name: String
    let description: String?
    let waypoints: [Waypoint]
    let distance: Double // in meters
    let estimatedDuration: TimeInterval // in seconds
    let isFavorite: Bool
    var usageCount: Int
    let createdDate: Date
    let createdBy: String
    var lastModifiedDate: Date?
    var lastModifiedBy: String?
    var lastUsedDate: Date?
    let tags: [String]
    let trafficEnabled: Bool
    var currentTrafficCondition: TrafficCondition?
    var notes: String?

    var origin: Waypoint? {
        waypoints.first
    }

    var destination: Waypoint? {
        waypoints.last
    }

    var intermediateWaypoints: [Waypoint] {
        guard waypoints.count > 2 else { return [] }
        return Array(waypoints[1..<waypoints.count-1])
    }

    var formattedDistance: String {
        if distance >= 1000 {
            return String(format: "%.1f km", distance / 1000)
        } else {
            return String(format: "%.0f m", distance)
        }
    }

    var formattedDuration: String {
        let minutes = Int(estimatedDuration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            if mins == 0 {
                return "\(hours) hr"
            }
            return "\(hours) hr \(mins) min"
        }
    }

    var formattedLastUsed: String? {
        guard let lastUsed = lastUsedDate else { return nil }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: lastUsed, relativeTo: Date())
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case name
        case description
        case waypoints
        case distance
        case estimatedDuration = "estimated_duration"
        case isFavorite = "is_favorite"
        case usageCount = "usage_count"
        case createdDate = "created_date"
        case createdBy = "created_by"
        case lastModifiedDate = "last_modified_date"
        case lastModifiedBy = "last_modified_by"
        case lastUsedDate = "last_used_date"
        case tags
        case trafficEnabled = "traffic_enabled"
        case currentTrafficCondition = "current_traffic_condition"
        case notes
    }

    static var sample: Route {
        Route(
            id: UUID().uuidString,
            tenantId: "tenant-1",
            name: "Downtown Delivery Route",
            description: "Main delivery route through downtown area",
            waypoints: [
                Waypoint(
                    id: UUID().uuidString,
                    order: 0,
                    location: Coordinate(latitude: 38.9072, longitude: -77.0369),
                    name: "Warehouse",
                    address: "123 Main St, Washington, DC",
                    type: .origin,
                    estimatedArrival: nil,
                    notes: nil
                ),
                Waypoint(
                    id: UUID().uuidString,
                    order: 1,
                    location: Coordinate(latitude: 38.9047, longitude: -77.0164),
                    name: "Customer A",
                    address: "456 Oak Ave, Washington, DC",
                    type: .stop,
                    estimatedArrival: nil,
                    notes: "Deliver Package #123"
                ),
                Waypoint(
                    id: UUID().uuidString,
                    order: 2,
                    location: Coordinate(latitude: 38.8951, longitude: -77.0364),
                    name: "Customer B",
                    address: "789 Elm Rd, Washington, DC",
                    type: .destination,
                    estimatedArrival: nil,
                    notes: nil
                )
            ],
            distance: 5420,
            estimatedDuration: 1200,
            isFavorite: true,
            usageCount: 12,
            createdDate: Date().addingTimeInterval(-86400 * 7),
            createdBy: "Admin",
            lastModifiedDate: Date().addingTimeInterval(-86400),
            lastModifiedBy: "Admin",
            lastUsedDate: Date().addingTimeInterval(-3600),
            tags: ["delivery", "downtown"],
            trafficEnabled: true,
            currentTrafficCondition: .moderate,
            notes: "Avoid rush hour between 4-6 PM"
        )
    }
}

// MARK: - Waypoint
struct Waypoint: Codable, Identifiable, Equatable {
    let id: String
    let order: Int
    let location: Coordinate
    let name: String
    let address: String?
    let type: WaypointType
    var estimatedArrival: Date?
    var notes: String?

    var coordinate: CLLocationCoordinate2D {
        location.clCoordinate
    }

    var icon: String {
        type.icon
    }

    var color: Color {
        type.color
    }

    enum CodingKeys: String, CodingKey {
        case id
        case order
        case location
        case name
        case address
        case type
        case estimatedArrival = "estimated_arrival"
        case notes
    }
}

// MARK: - Waypoint Type
enum WaypointType: String, Codable, CaseIterable {
    case origin = "Origin"
    case destination = "Destination"
    case stop = "Stop"
    case fuel = "Fuel Stop"
    case rest = "Rest Stop"
    case delivery = "Delivery"
    case pickup = "Pickup"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .origin: return "mappin.circle.fill"
        case .destination: return "flag.checkered"
        case .stop: return "mappin.and.ellipse"
        case .fuel: return "fuelpump.fill"
        case .rest: return "bed.double.fill"
        case .delivery: return "shippingbox.fill"
        case .pickup: return "arrow.up.bin.fill"
        case .custom: return "mappin"
        }
    }

    var color: Color {
        switch self {
        case .origin: return .green
        case .destination: return .red
        case .stop: return .blue
        case .fuel: return .orange
        case .rest: return .purple
        case .delivery: return .teal
        case .pickup: return .indigo
        case .custom: return .gray
        }
    }
}

// MARK: - Coordinate
extension Coordinate {
    init(latitude: Double, longitude: Double) {
        self.init(latitude: latitude, longitude: longitude)
    }
}

// MARK: - Traffic Condition
enum TrafficCondition: String, Codable, CaseIterable {
    case light = "Light"
    case moderate = "Moderate"
    case heavy = "Heavy"
    case severe = "Severe"
    case unknown = "Unknown"

    var color: Color {
        switch self {
        case .light: return .green
        case .moderate: return .yellow
        case .heavy: return .orange
        case .severe: return .red
        case .unknown: return .gray
        }
    }

    var icon: String {
        switch self {
        case .light: return "car.fill"
        case .moderate: return "car.2.fill"
        case .heavy: return "exclamationmark.triangle.fill"
        case .severe: return "exclamationmark.octagon.fill"
        case .unknown: return "questionmark.circle.fill"
        }
    }

    var delayMultiplier: Double {
        switch self {
        case .light: return 1.0
        case .moderate: return 1.25
        case .heavy: return 1.5
        case .severe: return 2.0
        case .unknown: return 1.0
        }
    }
}

// MARK: - Route Usage History
struct RouteUsageHistory: Codable, Identifiable {
    let id: String
    let routeId: String
    let vehicleId: String
    let vehicleNumber: String
    let driverId: String?
    let driverName: String?
    let startTime: Date
    let endTime: Date?
    let actualDistance: Double?
    let actualDuration: TimeInterval?
    let fuelUsed: Double?
    let deviations: Int // Number of times driver deviated from route
    let completed: Bool

    var formattedStartTime: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: startTime)
    }

    var formattedDuration: String? {
        guard let duration = actualDuration else { return nil }
        let minutes = Int(duration / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours)h \(mins)m"
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case routeId = "route_id"
        case vehicleId = "vehicle_id"
        case vehicleNumber = "vehicle_number"
        case driverId = "driver_id"
        case driverName = "driver_name"
        case startTime = "start_time"
        case endTime = "end_time"
        case actualDistance = "actual_distance"
        case actualDuration = "actual_duration"
        case fuelUsed = "fuel_used"
        case deviations
        case completed
    }
}

// MARK: - Route Filter Options
enum RouteFilterOption: String, CaseIterable {
    case all = "All Routes"
    case favorites = "Favorites"
    case mostUsed = "Most Used"
    case recentlyCreated = "Recently Created"
    case recentlyUsed = "Recently Used"

    var icon: String {
        switch self {
        case .all: return "list.bullet"
        case .favorites: return "star.fill"
        case .mostUsed: return "chart.bar.fill"
        case .recentlyCreated: return "clock.fill"
        case .recentlyUsed: return "arrow.clockwise"
        }
    }
}

// MARK: - Route Sort Options
enum RouteSortOption: String, CaseIterable {
    case nameAsc = "Name (A-Z)"
    case nameDesc = "Name (Z-A)"
    case distanceAsc = "Distance (Shortest)"
    case distanceDesc = "Distance (Longest)"
    case durationAsc = "Duration (Quickest)"
    case durationDesc = "Duration (Longest)"
    case usageDesc = "Most Used"
    case lastUsedDesc = "Recently Used"

    var icon: String {
        switch self {
        case .nameAsc, .nameDesc: return "textformat"
        case .distanceAsc, .distanceDesc: return "map"
        case .durationAsc, .durationDesc: return "clock"
        case .usageDesc: return "chart.bar"
        case .lastUsedDesc: return "clock.arrow.circlepath"
        }
    }
}

// MARK: - API Request Models
struct CreateRouteRequest: Codable {
    let name: String
    let description: String?
    let waypoints: [WaypointInput]
    let trafficEnabled: Bool
    let tags: [String]
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case name
        case description
        case waypoints
        case trafficEnabled = "traffic_enabled"
        case tags
        case notes
    }
}

struct WaypointInput: Codable {
    let order: Int
    let location: Coordinate
    let name: String
    let address: String?
    let type: WaypointType
    let notes: String?
}

struct UpdateRouteRequest: Codable {
    let name: String?
    let description: String?
    let waypoints: [WaypointInput]?
    let isFavorite: Bool?
    let trafficEnabled: Bool?
    let tags: [String]?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case name
        case description
        case waypoints
        case isFavorite = "is_favorite"
        case trafficEnabled = "traffic_enabled"
        case tags
        case notes
    }
}

// MARK: - API Response Models
struct RoutesResponse: Codable {
    let routes: [Route]
    let total: Int
    let page: Int?
    let limit: Int?
}

struct RouteResponse: Codable {
    let route: Route
}

struct RouteUsageHistoryResponse: Codable {
    let history: [RouteUsageHistory]
    let total: Int
}

// MARK: - Route Statistics
struct RouteStatistics: Codable {
    let totalRoutes: Int
    let favoriteRoutes: Int
    let totalDistance: Double
    let totalUsages: Int
    let averageDistance: Double
    let averageDuration: TimeInterval
    let mostUsedRoute: Route?

    var formattedTotalDistance: String {
        if totalDistance >= 1000 {
            return String(format: "%.1f km", totalDistance / 1000)
        } else {
            return String(format: "%.0f m", totalDistance)
        }
    }

    enum CodingKeys: String, CodingKey {
        case totalRoutes = "total_routes"
        case favoriteRoutes = "favorite_routes"
        case totalDistance = "total_distance"
        case totalUsages = "total_usages"
        case averageDistance = "average_distance"
        case averageDuration = "average_duration"
        case mostUsedRoute = "most_used_route"
    }
}
