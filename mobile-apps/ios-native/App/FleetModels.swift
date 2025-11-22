import Foundation
import CoreLocation

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

// MARK: - Activity Item (for Dashboard)

struct ActivityItem: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: ActivityType
    let title: String
    let description: String
    let vehicleId: String?
    let driverId: String?
}

enum ActivityType: String {
    case tripStarted = "Trip Started"
    case tripCompleted = "Trip Completed"
    case maintenanceScheduled = "Maintenance Scheduled"
    case maintenanceCompleted = "Maintenance Completed"
    case alert = "Alert"
    case incident = "Incident"
}

// MARK: - Dashboard Stats

struct DashboardStats: Codable {
    let totalVehicles: Int
    let activeVehicles: Int
    let totalTrips: Int
    let todayTrips: Int
    let alerts: Int
    let avgFuelLevel: Double
    let maintenanceDue: Int
    let totalMileage: Double
    let totalFuelCost: Double
    let fleetUtilization: Double
}

// MARK: - Date Range

struct DateRange: Equatable {
    let start: Date
    let end: Date
}

// MARK: - TripEvent for activity tracking

struct TripEvent {
    enum EventType: String, CaseIterable {
        case start = "Start"
        case stop = "Stop"
        case hardBraking = "Hard Braking"
        case rapidAcceleration = "Rapid Acceleration"
        case speeding = "Speeding"
        case idle = "Idle"
        case geofenceEntry = "Geofence Entry"
        case geofenceExit = "Geofence Exit"
    }

    enum Severity: String, CaseIterable {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
    }

    let type: EventType
    let timestamp: Date
    let location: CLLocationCoordinate2D
    let severity: Severity
    let details: String?
}

// MARK: - Fuel Record

struct FuelRecord: Identifiable, Codable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let date: Date
    let station: String
    let location: VehicleLocation
    let gallons: Double
    let pricePerGallon: Double
    let totalCost: Double
    let odometer: Double
    let fuelType: FuelType
    let paymentMethod: String
    let receipt: String?
    let notes: String?

    var mpg: Double? {
        nil // Would need previous record to calculate
    }
}
