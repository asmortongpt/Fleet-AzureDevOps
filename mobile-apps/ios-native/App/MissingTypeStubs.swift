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
