import Foundation
import Combine

// MARK: - Global Type Aliases for Trip Models
public typealias Trip = TripModels.Trip
public typealias TripCoordinate = TripModels.TripCoordinate
public typealias TripSettings = TripModels.TripSettings
public typealias TripStatus = TripModels.TripStatus

// MARK: - Missing Type Stubs

// AppLifecycleEvent stub
public enum AppLifecycleEvent {
    case didFinishLaunching
    case willEnterForeground
    case didEnterBackground
    case willTerminate
}

// Trace stub for metrics
public struct Trace {
    let id: String
    let name: String
    let startTime: Date
    var endTime: Date?
    var attributes: [String: String]

    public init(name: String) {
        self.id = UUID().uuidString
        self.name = name
        self.startTime = Date()
        self.attributes = [:]
    }

    public mutating func stop() {
        self.endTime = Date()
    }

    public var duration: TimeInterval {
        guard let endTime = endTime else { return 0 }
        return endTime.timeIntervalSince(startTime)
    }
}

// AnyCancellable is from Combine, should be imported but adding for safety
public typealias CancellableType = AnyCancellable

// NOTE: Trip, TripStatus, TripCoordinate, and TripSettings are now defined in TripModels.swift
// and imported via type aliases at the top of this file

// Trip Statistics
public struct TripStatistics: Codable {
    public let totalTrips: Int
    public let totalDistance: Double
    public let totalDuration: TimeInterval
    public let averageSpeed: Double

    public init(totalTrips: Int = 0, totalDistance: Double = 0, totalDuration: TimeInterval = 0, averageSpeed: Double = 0) {
        self.totalTrips = totalTrips
        self.totalDistance = totalDistance
        self.totalDuration = totalDuration
        self.averageSpeed = averageSpeed
    }

    public var formattedTotalDistance: String {
        String(format: "%.1f mi", totalDistance)
    }

    public var formattedTotalDuration: String {
        let hours = Int(totalDuration) / 3600
        let minutes = (Int(totalDuration) % 3600) / 60
        return String(format: "%dh %dm", hours, minutes)
    }
}

// Performance Metrics
public struct PerformanceMetrics: Codable {
    public let cpuUsage: Double
    public let memoryUsage: Double
    public let fps: Double?

    public init(cpuUsage: Double, memoryUsage: Double, fps: Double? = nil) {
        self.cpuUsage = cpuUsage
        self.memoryUsage = memoryUsage
        self.fps = fps
    }
}

// System Metrics
public struct SystemMetrics: Codable {
    public let batteryLevel: Double
    public let networkType: String
    public let diskSpace: Double

    public init(batteryLevel: Double, networkType: String, diskSpace: Double) {
        self.batteryLevel = batteryLevel
        self.networkType = networkType
        self.diskSpace = diskSpace
    }
}

// MARK: - Button Styles
import SwiftUI

public struct PrimaryButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }

    public init() {}
}

public struct SecondaryButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(.blue)
            .padding()
            .background(Color.gray.opacity(0.2))
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }

    public init() {}
}

// MARK: - Sync Status Enum

public enum SyncStatus: String, Codable {
    case synced = "synced"
    case syncing = "syncing"
    case error = "error"
    case pending = "pending"

    public var displayName: String {
        switch self {
        case .synced: return "Synced"
        case .syncing: return "Syncing..."
        case .error: return "Sync Error"
        case .pending: return "Pending"
        }
    }
}

// MARK: - Conflict Resolution Stubs

public struct ConflictData {
    public let local: [String: Any]
    public let remote: [String: Any]
    public let timestamp: Date
    public let recordType: String

    public init(local: [String: Any], remote: [String: Any], timestamp: Date, recordType: String = "unknown") {
        self.local = local
        self.remote = remote
        self.timestamp = timestamp
        self.recordType = recordType
    }
}

public struct ConflictStatistics {
    public let totalConflicts: Int
    public let resolvedConflicts: Int
    public let pendingConflicts: Int
    public let unresolvedConflicts: Int

    public init(totalConflicts: Int = 0, resolvedConflicts: Int = 0, pendingConflicts: Int = 0, unresolvedConflicts: Int = 0) {
        self.totalConflicts = totalConflicts
        self.resolvedConflicts = resolvedConflicts
        self.pendingConflicts = pendingConflicts
        self.unresolvedConflicts = unresolvedConflicts
    }
}

public class ConflictResolver {
    public static let shared = ConflictResolver()

    public var conflictDetected = PassthroughSubject<ConflictData, Never>()

    private init() {}

    public func resolve(_ conflict: ConflictData) -> [String: Any] {
        // Stub implementation - return remote by default
        return conflict.remote
    }

    public func resolveConflict(local: [String: Any], remote: [String: Any]) async throws -> [String: Any] {
        // Stub implementation - return remote by default
        return remote
    }

    public func resolveConflict(_ conflict: ConflictData) async throws -> [String: Any] {
        // Stub implementation - return remote by default
        return conflict.remote
    }

    public func detectConflictFromDictionaries(local: [String: Any], remote: [String: Any]) -> ConflictData? {
        // Stub implementation - return nil (no conflict detected)
        return nil
    }

    public func detectConflictFromDictionaries(local: [String: Any], remote: [String: Any], recordType: String, entityId: String) -> ConflictData? {
        // Stub implementation - return nil (no conflict detected)
        return nil
    }

    public func getConflictStatistics() -> ConflictStatistics {
        // Stub implementation - return empty statistics
        return ConflictStatistics()
    }
}

// MARK: - Date Range

public struct DateRange {
    public var start: Date
    public var end: Date

    public init(start: Date, end: Date) {
        self.start = start
        self.end = end
    }
}

// MARK: - Dashboard Models

public struct DashboardStats: Codable {
    public let totalVehicles: Int
    public let activeVehicles: Int
    public let totalTrips: Int
    public let todayTrips: Int
    public let alerts: Int
    public let avgFuelLevel: Double
    public let maintenanceDue: Int
    public let totalMileage: Double
    public let totalFuelCost: Double
    public let fleetUtilization: Double

    public init(totalVehicles: Int, activeVehicles: Int, totalTrips: Int, todayTrips: Int, alerts: Int, avgFuelLevel: Double, maintenanceDue: Int, totalMileage: Double, totalFuelCost: Double, fleetUtilization: Double) {
        self.totalVehicles = totalVehicles
        self.activeVehicles = activeVehicles
        self.totalTrips = totalTrips
        self.todayTrips = todayTrips
        self.alerts = alerts
        self.avgFuelLevel = avgFuelLevel
        self.maintenanceDue = maintenanceDue
        self.totalMileage = totalMileage
        self.totalFuelCost = totalFuelCost
        self.fleetUtilization = fleetUtilization
    }
}

// NOTE: ActivityItem and ActivityType are defined in Models/FleetModels.swift

// MARK: - MockDataGenerator Stub

public class MockDataGenerator {
    public static let shared = MockDataGenerator()

    private init() {}

    public func generateVehicles(count: Int) -> [Vehicle] {
        return []
    }

    public func generateTrips(count: Int, vehicles: [Vehicle]) -> [Trip] {
        return []
    }

    public func generateMaintenanceRecords(count: Int, vehicles: [Vehicle]) -> [MaintenanceRecord] {
        return []
    }

    public func generateDashboardStats(vehicles: [Vehicle], trips: [Trip]) -> DashboardStats {
        let totalVehicles = vehicles.count
        let activeVehicles = vehicles.filter { $0.status == .active }.count
        let totalTrips = trips.count
        let todayTrips = trips.filter { Calendar.current.isDateInToday($0.startTime) }.count
        let alerts = vehicles.reduce(0) { total, vehicle in total + vehicle.alerts.count }
        let avgFuelLevel = vehicles.isEmpty ? 0 : vehicles.reduce(0.0, { total, vehicle in total + vehicle.fuelLevel }) / Double(vehicles.count)
        // maintenanceDue - simplified check since nextService is a String
        let maintenanceDue = vehicles.filter { !$0.nextService.isEmpty }.count
        let totalMileage = vehicles.reduce(0.0, { total, vehicle in total + vehicle.mileage })
        // totalFuelCost - estimated from total distance * average cost per mile
        let totalFuelCost = trips.reduce(0.0, { total, trip in total + (trip.totalDistance * 0.15) })
        let fleetUtilization = totalVehicles > 0 ? (Double(activeVehicles) / Double(totalVehicles)) * 100 : 0

        return DashboardStats(
            totalVehicles: totalVehicles,
            activeVehicles: activeVehicles,
            totalTrips: totalTrips,
            todayTrips: todayTrips,
            alerts: alerts,
            avgFuelLevel: avgFuelLevel,
            maintenanceDue: maintenanceDue,
            totalMileage: totalMileage,
            totalFuelCost: totalFuelCost,
            fleetUtilization: fleetUtilization
        )
    }
}

// MARK: - Schedule Model Stubs

public struct ScheduleEntry: Identifiable, Codable {
    public let id: String
    public var title: String
    public var description: String?
    public var startDate: Date
    public var endDate: Date

    public init(id: String = UUID().uuidString, title: String, description: String? = nil, startDate: Date, endDate: Date) {
        self.id = id
        self.title = title
        self.description = description
        self.startDate = startDate
        self.endDate = endDate
    }
}

public enum ScheduleType: String, Codable {
    case shift
    case maintenance
    case other
}

public struct ScheduleFilter {
    public init() {}
}

public struct ScheduleConflict: Identifiable {
    public let id: String
    public var description: String

    public init(id: String = UUID().uuidString, description: String = "") {
        self.id = id
        self.description = description
    }
}

public struct ScheduleStatistics {
    public var totalScheduled: Int = 0
    public var completed: Int = 0

    public init() {}
}

public struct DriverSchedule: Identifiable, Codable {
    public let id: String
    public var driverName: String

    public init(id: String = UUID().uuidString, driverName: String) {
        self.id = id
        self.driverName = driverName
    }
}

public struct VehicleSchedule: Identifiable, Codable {
    public let id: String
    public var vehicleNumber: String

    public init(id: String = UUID().uuidString, vehicleNumber: String) {
        self.id = id
        self.vehicleNumber = vehicleNumber
    }
}

public struct ShiftSchedule: Identifiable, Codable {
    public let id: String
    public var startTime: Date
    public var endTime: Date

    public init(id: String = UUID().uuidString, startTime: Date, endTime: Date) {
        self.id = id
        self.startTime = startTime
        self.endTime = endTime
    }
}

public struct MaintenanceWindow: Identifiable, Codable {
    public let id: String
    public var scheduledDate: Date

    public init(id: String = UUID().uuidString, scheduledDate: Date) {
        self.id = id
        self.scheduledDate = scheduledDate
    }
}

public enum Resolution: String, Codable {
    case keepLocal
    case keepRemote
    case merge
}

public class ScheduleService {
    public static let shared = ScheduleService()
    private init() {}
}

// MARK: - Checklist Model Stubs

public struct ChecklistInstance: Identifiable, Codable {
    public let id: String
    public var templateName: String
    public var status: String

    public init(id: String = UUID().uuidString, templateName: String, status: String = "pending") {
        self.id = id
        self.templateName = templateName
        self.status = status
    }
}

public struct ChecklistTemplate: Identifiable, Codable {
    public let id: String
    public var name: String
    public var description: String

    public init(id: String = UUID().uuidString, name: String, description: String = "") {
        self.id = id
        self.name = name
        self.description = description
    }
}

public enum ChecklistCategory: String, Codable {
    case osha
    case preTripInspection
    case maintenance
    case custom
}

public struct ChecklistItemInstance: Identifiable, Codable {
    public let id: String
    public var text: String

    public init(id: String = UUID().uuidString, text: String) {
        self.id = id
        self.text = text
    }
}

public enum ChecklistResponse: Codable {
    case boolean(Bool)
    case text(String)
    case number(Double)

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let bool = try? container.decode(Bool.self) {
            self = .boolean(bool)
        } else if let text = try? container.decode(String.self) {
            self = .text(text)
        } else if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else {
            self = .boolean(false)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .boolean(let value):
            try container.encode(value)
        case .text(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        }
    }
}

public enum AttachmentType: String, Codable {
    case photo
    case video
    case document
}

public class ChecklistService {
    public static let shared = ChecklistService()
    private init() {}
}
