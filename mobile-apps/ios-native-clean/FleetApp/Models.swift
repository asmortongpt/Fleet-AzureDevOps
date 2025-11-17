import Foundation

// MARK: - Vehicle
struct Vehicle: Codable, Identifiable {
    let id: String
    let make: String
    let model: String
    let year: Int
    let vin: String
    let licensePlate: String
    let status: VehicleStatus
    let mileage: Double
    let fuelLevel: Double
    let location: Location?
    let lastMaintenance: Date?
    let nextMaintenanceDue: Date?

    enum VehicleStatus: String, Codable {
        case available = "available"
        case inUse = "in_use"
        case maintenance = "maintenance"
        case outOfService = "out_of_service"

        var displayName: String {
            switch self {
            case .available: return "Available"
            case .inUse: return "In Use"
            case .maintenance: return "Maintenance"
            case .outOfService: return "Out of Service"
            }
        }

        var color: String {
            switch self {
            case .available: return "green"
            case .inUse: return "blue"
            case .maintenance: return "orange"
            case .outOfService: return "red"
            }
        }
    }
}

// MARK: - Trip
struct Trip: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let driverId: String
    let startTime: Date
    let endTime: Date?
    let startLocation: Location
    let endLocation: Location?
    let distance: Double?
    let status: TripStatus

    enum TripStatus: String, Codable {
        case active = "active"
        case completed = "completed"
        case cancelled = "cancelled"

        var displayName: String {
            switch self {
            case .active: return "Active"
            case .completed: return "Completed"
            case .cancelled: return "Cancelled"
            }
        }
    }
}

// MARK: - Alert
struct Alert: Codable, Identifiable {
    let id: String
    let vehicleId: String
    let type: AlertType
    let priority: AlertPriority
    let message: String
    let createdAt: Date
    let isRead: Bool

    enum AlertType: String, Codable {
        case maintenance = "maintenance"
        case inspection = "inspection"
        case fuelLow = "fuel_low"
        case accident = "accident"
        case other = "other"

        var icon: String {
            switch self {
            case .maintenance: return "wrench.fill"
            case .inspection: return "checkmark.shield.fill"
            case .fuelLow: return "fuel.fill"
            case .accident: return "exclamationmark.triangle.fill"
            case .other: return "info.circle.fill"
            }
        }
    }

    enum AlertPriority: String, Codable {
        case low = "low"
        case medium = "medium"
        case high = "high"
        case critical = "critical"

        var color: String {
            switch self {
            case .low: return "green"
            case .medium: return "yellow"
            case .high: return "orange"
            case .critical: return "red"
            }
        }
    }
}

// MARK: - Dashboard
struct DashboardMetrics: Codable {
    let totalVehicles: Int
    let activeVehicles: Int
    let totalTrips: Int
    let activeTrips: Int
    let totalAlerts: Int
    let unreadAlerts: Int
    let averageFuelLevel: Double
    let totalMileage: Double
    let recentActivity: [Activity]

    struct Activity: Codable, Identifiable {
        let id: String
        let type: String
        let message: String
        let timestamp: Date
    }
}

// MARK: - Location
struct Location: Codable {
    let latitude: Double
    let longitude: Double
    let address: String?
}

// MARK: - API Response Wrappers
struct VehiclesResponse: Codable {
    let vehicles: [Vehicle]
}

struct TripsResponse: Codable {
    let trips: [Trip]
}

struct AlertsResponse: Codable {
    let alerts: [Alert]
}
