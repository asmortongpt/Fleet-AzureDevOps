//
//  Assignment.swift
//  Fleet Manager - iOS Native App
//
//  Dispatch assignment models for fleet operations management
//  Supports offline-first architecture with API sync
//

import Foundation
import SwiftUI

// MARK: - Assignment Model
public struct Assignment: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var vehicleId: String
    public var driverId: String?
    public var routeId: String?
    public var tripId: String?
    public var type: AssignmentType
    public var status: AssignmentStatus
    public var priority: AssignmentPriority
    public var scheduledStart: Date
    public var scheduledEnd: Date?
    public var actualStart: Date?
    public var actualEnd: Date?
    public var description: String?
    public var notes: String?
    public var location: AssignmentLocation?
    public var checkpoints: [Checkpoint]
    public var createdBy: String
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case vehicleId = "vehicle_id"
        case driverId = "driver_id"
        case routeId = "route_id"
        case tripId = "trip_id"
        case type
        case status
        case priority
        case scheduledStart = "scheduled_start"
        case scheduledEnd = "scheduled_end"
        case actualStart = "actual_start"
        case actualEnd = "actual_end"
        case description
        case notes
        case location
        case checkpoints
        case createdBy = "created_by"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var isActive: Bool {
        status == .inProgress
    }

    public var isOverdue: Bool {
        guard let scheduledEnd = scheduledEnd else { return false }
        return status != .completed && Date() > scheduledEnd
    }

    public var isPending: Bool {
        status == .pending
    }

    public var duration: TimeInterval? {
        guard let start = actualStart, let end = actualEnd else { return nil }
        return end.timeIntervalSince(start)
    }

    public var scheduledDuration: TimeInterval? {
        guard let end = scheduledEnd else { return nil }
        return end.timeIntervalSince(scheduledStart)
    }

    public var completionPercentage: Int {
        guard !checkpoints.isEmpty else { return 0 }
        let completedCount = checkpoints.filter { $0.isCompleted }.count
        return Int((Double(completedCount) / Double(checkpoints.count)) * 100)
    }
}

// MARK: - Assignment Type
public enum AssignmentType: String, Codable, CaseIterable {
    case delivery
    case pickup
    case patrol
    case maintenance
    case emergency
    case transfer
    case inspection
    case training
    case other

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .delivery: return "shippingbox.fill"
        case .pickup: return "arrow.down.circle.fill"
        case .patrol: return "shield.fill"
        case .maintenance: return "wrench.and.screwdriver.fill"
        case .emergency: return "exclamationmark.triangle.fill"
        case .transfer: return "arrow.left.arrow.right"
        case .inspection: return "checkmark.seal.fill"
        case .training: return "book.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }

    public var color: Color {
        switch self {
        case .delivery: return .blue
        case .pickup: return .purple
        case .patrol: return .green
        case .maintenance: return .orange
        case .emergency: return .red
        case .transfer: return .teal
        case .inspection: return .indigo
        case .training: return .cyan
        case .other: return .gray
        }
    }
}

// MARK: - Assignment Status
public enum AssignmentStatus: String, Codable, CaseIterable {
    case pending
    case assigned
    case inProgress = "in_progress"
    case completed
    case cancelled
    case onHold = "on_hold"
    case delayed

    public var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .assigned: return "Assigned"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .onHold: return "On Hold"
        case .delayed: return "Delayed"
        }
    }

    public var color: Color {
        switch self {
        case .pending: return .blue
        case .assigned: return .purple
        case .inProgress: return .green
        case .completed: return .gray
        case .cancelled: return .red
        case .onHold: return .orange
        case .delayed: return .yellow
        }
    }

    public var icon: String {
        switch self {
        case .pending: return "clock.fill"
        case .assigned: return "person.fill.checkmark"
        case .inProgress: return "play.circle.fill"
        case .completed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle.fill"
        case .onHold: return "pause.circle.fill"
        case .delayed: return "exclamationmark.circle.fill"
        }
    }
}

// MARK: - Assignment Priority
public enum AssignmentPriority: String, Codable, CaseIterable {
    case low
    case normal
    case high
    case urgent
    case critical

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .low: return .blue
        case .normal: return .green
        case .high: return .orange
        case .urgent: return .red
        case .critical: return .purple
        }
    }

    public var icon: String {
        switch self {
        case .low: return "arrow.down.circle.fill"
        case .normal: return "equal.circle.fill"
        case .high: return "arrow.up.circle.fill"
        case .urgent: return "exclamationmark.circle.fill"
        case .critical: return "exclamationmark.triangle.fill"
        }
    }

    public var sortOrder: Int {
        switch self {
        case .critical: return 5
        case .urgent: return 4
        case .high: return 3
        case .normal: return 2
        case .low: return 1
        }
    }
}

// MARK: - Assignment Location
public struct AssignmentLocation: Codable, Equatable {
    public var name: String
    public var address: String
    public var lat: Double
    public var lng: Double
    public var notes: String?

    public var coordinate: (lat: Double, lng: Double) {
        (lat, lng)
    }
}

// MARK: - Checkpoint
public struct Checkpoint: Codable, Identifiable, Equatable {
    public let id: String
    public var name: String
    public var description: String?
    public var sequence: Int
    public var location: AssignmentLocation?
    public var isCompleted: Bool
    public var completedAt: Date?
    public var completedBy: String?
    public var notes: String?
    public var photoRequired: Bool
    public var photoURL: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case sequence
        case location
        case isCompleted = "is_completed"
        case completedAt = "completed_at"
        case completedBy = "completed_by"
        case notes
        case photoRequired = "photo_required"
        case photoURL = "photo_url"
    }
}

// MARK: - Communication Message
public struct DispatchMessage: Codable, Identifiable, Equatable {
    public let id: String
    public var assignmentId: String?
    public var vehicleId: String?
    public var driverId: String?
    public var senderId: String
    public var senderName: String
    public var message: String
    public var type: MessageType
    public var priority: AssignmentPriority
    public var isRead: Bool
    public var createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case assignmentId = "assignment_id"
        case vehicleId = "vehicle_id"
        case driverId = "driver_id"
        case senderId = "sender_id"
        case senderName = "sender_name"
        case message
        case type
        case priority
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}

// MARK: - Message Type
public enum MessageType: String, Codable {
    case text
    case alert
    case instruction
    case update
    case emergency

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .text: return "message.fill"
        case .alert: return "bell.fill"
        case .instruction: return "list.bullet.clipboard.fill"
        case .update: return "arrow.clockwise"
        case .emergency: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - API Response Models
public struct AssignmentsResponse: Codable {
    public let assignments: [Assignment]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct AssignmentResponse: Codable {
    public let assignment: Assignment
}

// MARK: - Sample Data for Previews
extension Assignment {
    public static var sample: Assignment {
        Assignment(
            id: "assignment-001",
            tenantId: "tenant-001",
            vehicleId: "vehicle-001",
            driverId: "driver-001",
            routeId: "route-001",
            tripId: nil,
            type: .delivery,
            status: .inProgress,
            priority: .high,
            scheduledStart: Date(),
            scheduledEnd: Calendar.current.date(byAdding: .hour, value: 4, to: Date()),
            actualStart: Date(),
            actualEnd: nil,
            description: "Deliver medical supplies to Memorial Hospital",
            notes: "Requires signature upon delivery",
            location: AssignmentLocation.sample,
            checkpoints: [Checkpoint.sample],
            createdBy: "dispatcher-001",
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension AssignmentLocation {
    public static var sample: AssignmentLocation {
        AssignmentLocation(
            name: "Memorial Hospital",
            address: "1234 Medical Center Dr, Washington, DC 20001",
            lat: 38.9072,
            lng: -77.0369,
            notes: "Main entrance delivery dock"
        )
    }
}

extension Checkpoint {
    public static var sample: Checkpoint {
        Checkpoint(
            id: "checkpoint-001",
            name: "Load supplies at warehouse",
            description: "Verify all items against manifest",
            sequence: 1,
            location: AssignmentLocation(
                name: "Central Warehouse",
                address: "5678 Storage Rd, Washington, DC 20002",
                lat: 38.9100,
                lng: -77.0400,
                notes: "Loading dock #3"
            ),
            isCompleted: true,
            completedAt: Date(),
            completedBy: "driver-001",
            notes: "All items verified and loaded",
            photoRequired: true,
            photoURL: nil
        )
    }
}

extension DispatchMessage {
    public static var sample: DispatchMessage {
        DispatchMessage(
            id: "message-001",
            assignmentId: "assignment-001",
            vehicleId: "vehicle-001",
            driverId: "driver-001",
            senderId: "dispatcher-001",
            senderName: "Central Dispatch",
            message: "Please confirm arrival at Memorial Hospital",
            type: .instruction,
            priority: .normal,
            isRead: false,
            createdAt: Date()
        )
    }
}
