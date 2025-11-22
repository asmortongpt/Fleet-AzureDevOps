import Foundation

// MARK: - Fleet Metrics Model
struct FleetMetrics: Codable, Equatable {
    let totalVehicles: Int
    let activeTrips: Int
    let maintenanceDue: Int
    let availableVehicles: Int
    let vehicleUtilizationRate: Double
    let activeDrivers: Int
    let lastUpdated: Date

    enum CodingKeys: String, CodingKey {
        case totalVehicles = "total_vehicles"
        case activeTrips = "active_trips"
        case maintenanceDue = "maintenance_due"
        case availableVehicles = "available_vehicles"
        case vehicleUtilizationRate = "vehicle_utilization_rate"
        case activeDrivers = "active_drivers"
        case lastUpdated = "last_updated"
    }

    // Default empty state
    static var empty: FleetMetrics {
        FleetMetrics(
            totalVehicles: 0,
            activeTrips: 0,
            maintenanceDue: 0,
            availableVehicles: 0,
            vehicleUtilizationRate: 0.0,
            activeDrivers: 0,
            lastUpdated: Date()
        )
    }

    // Sample data for previews
    static var sample: FleetMetrics {
        FleetMetrics(
            totalVehicles: 45,
            activeTrips: 12,
            maintenanceDue: 5,
            availableVehicles: 28,
            vehicleUtilizationRate: 0.73,
            activeDrivers: 38,
            lastUpdated: Date()
        )
    }
}

// MARK: - Fleet Metrics Response (API wrapper)
struct FleetMetricsResponse: Codable {
    let success: Bool
    let data: FleetMetrics
    let timestamp: Date

    enum CodingKeys: String, CodingKey {
        case success
        case data
        case timestamp
    }
}

// MARK: - Quick Action Type
enum QuickActionType: String, CaseIterable {
    case startTrip = "start_trip"
    case reportIssue = "report_issue"
    case vehicleInspection = "vehicle_inspection"

    var title: String {
        switch self {
        case .startTrip:
            return "Start Trip"
        case .reportIssue:
            return "Report Issue"
        case .vehicleInspection:
            return "Vehicle Inspection"
        }
    }

    var icon: String {
        switch self {
        case .startTrip:
            return "car.fill"
        case .reportIssue:
            return "exclamationmark.triangle.fill"
        case .vehicleInspection:
            return "checkmark.circle.fill"
        }
    }

    var accessibilityLabel: String {
        switch self {
        case .startTrip:
            return "Start a new trip"
        case .reportIssue:
            return "Report a vehicle issue"
        case .vehicleInspection:
            return "Perform vehicle inspection"
        }
    }
}

// MARK: - Metric Card Data
struct MetricCardData: Identifiable {
    let id = UUID()
    let title: String
    let value: String
    let icon: String
    let color: String
    let accessibilityLabel: String
}

// MARK: - Dashboard State
enum DashboardState: Equatable {
    case loading
    case loaded(FleetMetrics)
    case empty
    case error(String)

    var isLoading: Bool {
        if case .loading = self {
            return true
        }
        return false
    }

    var fleetMetrics: FleetMetrics? {
        if case .loaded(let metrics) = self {
            return metrics
        }
        return nil
    }

    var errorMessage: String? {
        if case .error(let message) = self {
            return message
        }
        return nil
    }
}
