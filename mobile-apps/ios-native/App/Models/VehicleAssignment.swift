//
//  VehicleAssignment.swift
//  Fleet Manager - iOS Native App
//
//  Vehicle Assignment models for fleet operations management
//  Supports permanent, temporary, pool, and departmental assignments
//  with conflict detection and approval workflows
//

import Foundation
import SwiftUI

// MARK: - Vehicle Assignment Model
public struct VehicleAssignment: Codable, Identifiable, Equatable, Hashable {
    public let id: String
    public let tenantId: String
    public var vehicleId: String
    public var assignedTo: String  // driverId, departmentId, or projectId
    public var assignmentType: VehicleAssignmentType
    public var status: VehicleAssignmentStatus
    public var startDate: Date
    public var endDate: Date?
    public var purpose: String?
    public var notes: String?
    public var approvedBy: String?
    public var approvedAt: Date?
    public var requestedBy: String
    public var requestedAt: Date
    public var handoffNotes: String?
    public var odometer: Double?
    public var fuelLevel: Double?
    public var returnOdometer: Double?
    public var returnFuelLevel: Double?
    public var returnCondition: VehicleCondition?
    public var returnNotes: String?
    public var returnedAt: Date?
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case vehicleId = "vehicle_id"
        case assignedTo = "assigned_to"
        case assignmentType = "assignment_type"
        case status
        case startDate = "start_date"
        case endDate = "end_date"
        case purpose
        case notes
        case approvedBy = "approved_by"
        case approvedAt = "approved_at"
        case requestedBy = "requested_by"
        case requestedAt = "requested_at"
        case handoffNotes = "handoff_notes"
        case odometer
        case fuelLevel = "fuel_level"
        case returnOdometer = "return_odometer"
        case returnFuelLevel = "return_fuel_level"
        case returnCondition = "return_condition"
        case returnNotes = "return_notes"
        case returnedAt = "returned_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var isActive: Bool {
        status == .active && Date() >= startDate && (endDate == nil || Date() <= endDate!)
    }

    public var isPending: Bool {
        status == .pending
    }

    public var isExpired: Bool {
        guard let endDate = endDate else { return false }
        return Date() > endDate && status == .active
    }

    public var duration: TimeInterval? {
        guard let end = endDate else { return nil }
        return end.timeIntervalSince(startDate)
    }

    public var durationDays: Int? {
        guard let duration = duration else { return nil }
        return Int(duration / 86400)
    }

    public var dateRange: DateInterval {
        DateInterval(start: startDate, end: endDate ?? Date.distantFuture)
    }

    public var totalMilesDriven: Double? {
        guard let start = odometer, let end = returnOdometer else { return nil }
        return end - start
    }

    public var fuelConsumed: Double? {
        guard let start = fuelLevel, let end = returnFuelLevel else { return nil }
        return start - end
    }
}

// MARK: - Assignment Type
public enum VehicleAssignmentType: String, Codable, CaseIterable {
    case permanent = "permanent"
    case temporary = "temporary"
    case pool = "pool"
    case reserved = "reserved"
    case department = "department"
    case project = "project"

    public var displayName: String {
        switch self {
        case .permanent: return "Permanent"
        case .temporary: return "Temporary"
        case .pool: return "Pool (Shared)"
        case .reserved: return "Reserved"
        case .department: return "Department"
        case .project: return "Project"
        }
    }

    public var icon: String {
        switch self {
        case .permanent: return "person.fill.checkmark"
        case .temporary: return "clock.fill"
        case .pool: return "person.3.fill"
        case .reserved: return "calendar.badge.clock"
        case .department: return "building.2.fill"
        case .project: return "folder.fill"
        }
    }

    public var color: Color {
        switch self {
        case .permanent: return .blue
        case .temporary: return .orange
        case .pool: return .purple
        case .reserved: return .teal
        case .department: return .green
        case .project: return .indigo
        }
    }

    public var description: String {
        switch self {
        case .permanent:
            return "Long-term assignment to a specific driver"
        case .temporary:
            return "Short-term assignment with defined end date"
        case .pool:
            return "Shared vehicle available for check-in/check-out"
        case .reserved:
            return "Reserved for specific event or time period"
        case .department:
            return "Assigned to entire department"
        case .project:
            return "Dedicated to specific project"
        }
    }
}

// MARK: - Assignment Status
public enum VehicleAssignmentStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case active = "active"
    case completed = "completed"
    case cancelled = "cancelled"
    case expired = "expired"
    case checkedOut = "checked_out"
    case checkedIn = "checked_in"

    public var displayName: String {
        switch self {
        case .pending: return "Pending Approval"
        case .active: return "Active"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .expired: return "Expired"
        case .checkedOut: return "Checked Out"
        case .checkedIn: return "Checked In"
        }
    }

    public var color: Color {
        switch self {
        case .pending: return .orange
        case .active: return .green
        case .completed: return .blue
        case .cancelled: return .red
        case .expired: return .gray
        case .checkedOut: return .purple
        case .checkedIn: return .teal
        }
    }

    public var icon: String {
        switch self {
        case .pending: return "clock.fill"
        case .active: return "checkmark.circle.fill"
        case .completed: return "checkmark.seal.fill"
        case .cancelled: return "xmark.circle.fill"
        case .expired: return "exclamationmark.triangle.fill"
        case .checkedOut: return "arrow.up.circle.fill"
        case .checkedIn: return "arrow.down.circle.fill"
        }
    }
}

// MARK: - Vehicle Condition
public enum VehicleCondition: String, Codable, CaseIterable {
    case excellent = "excellent"
    case good = "good"
    case fair = "fair"
    case poor = "poor"
    case damaged = "damaged"

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .orange
        case .damaged: return .red
        }
    }

    public var icon: String {
        switch self {
        case .excellent: return "star.fill"
        case .good: return "hand.thumbsup.fill"
        case .fair: return "minus.circle.fill"
        case .poor: return "hand.thumbsdown.fill"
        case .damaged: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - Assignment Request
public struct AssignmentRequest: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var vehicleId: String?
    public var vehicleType: String?
    public var requestedBy: String
    public var assignmentType: VehicleAssignmentType
    public var startDate: Date
    public var endDate: Date?
    public var purpose: String
    public var notes: String?
    public var status: RequestStatus
    public var reviewedBy: String?
    public var reviewedAt: Date?
    public var reviewNotes: String?
    public var assignmentId: String?
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case vehicleId = "vehicle_id"
        case vehicleType = "vehicle_type"
        case requestedBy = "requested_by"
        case assignmentType = "assignment_type"
        case startDate = "start_date"
        case endDate = "end_date"
        case purpose
        case notes
        case status
        case reviewedBy = "reviewed_by"
        case reviewedAt = "reviewed_at"
        case reviewNotes = "review_notes"
        case assignmentId = "assignment_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    public var isPending: Bool {
        status == .pending
    }
}

// MARK: - Request Status
public enum RequestStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case approved = "approved"
    case denied = "denied"
    case cancelled = "cancelled"

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .pending: return .orange
        case .approved: return .green
        case .denied: return .red
        case .cancelled: return .gray
        }
    }

    public var icon: String {
        switch self {
        case .pending: return "clock.fill"
        case .approved: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        case .cancelled: return "minus.circle.fill"
        }
    }
}

// MARK: - Assignment Conflict
public struct AssignmentConflict: Identifiable, Equatable {
    public let id: String
    public let assignment1: VehicleAssignment
    public let assignment2: VehicleAssignment
    public let overlapPeriod: DateInterval
    public let conflictType: ConflictType

    public init(id: String = UUID().uuidString,
                assignment1: VehicleAssignment,
                assignment2: VehicleAssignment,
                overlapPeriod: DateInterval,
                conflictType: ConflictType = .dateOverlap) {
        self.id = id
        self.assignment1 = assignment1
        self.assignment2 = assignment2
        self.overlapPeriod = overlapPeriod
        self.conflictType = conflictType
    }

    public var overlapDays: Int {
        Int(overlapPeriod.duration / 86400)
    }
}

// MARK: - Conflict Type
public enum ConflictType: String, CaseIterable {
    case dateOverlap = "date_overlap"
    case doubleBooking = "double_booking"
    case maintenanceConflict = "maintenance_conflict"

    public var displayName: String {
        switch self {
        case .dateOverlap: return "Date Overlap"
        case .doubleBooking: return "Double Booking"
        case .maintenanceConflict: return "Maintenance Conflict"
        }
    }

    public var color: Color {
        switch self {
        case .dateOverlap: return .orange
        case .doubleBooking: return .red
        case .maintenanceConflict: return .yellow
        }
    }
}

// MARK: - Assignment History
public struct AssignmentHistory: Codable, Identifiable, Equatable {
    public let id: String
    public let assignmentId: String
    public let vehicleId: String
    public let assignedTo: String
    public let action: AssignmentAction
    public let performedBy: String
    public let notes: String?
    public let timestamp: Date
    public let metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id
        case assignmentId = "assignment_id"
        case vehicleId = "vehicle_id"
        case assignedTo = "assigned_to"
        case action
        case performedBy = "performed_by"
        case notes
        case timestamp
        case metadata
    }
}

// MARK: - Assignment Action
public enum AssignmentAction: String, Codable, CaseIterable {
    case created = "created"
    case approved = "approved"
    case denied = "denied"
    case started = "started"
    case completed = "completed"
    case cancelled = "cancelled"
    case extended = "extended"
    case reassigned = "reassigned"
    case checkedOut = "checked_out"
    case checkedIn = "checked_in"

    public var displayName: String {
        rawValue.capitalized
    }

    public var icon: String {
        switch self {
        case .created: return "plus.circle.fill"
        case .approved: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        case .started: return "play.circle.fill"
        case .completed: return "checkmark.seal.fill"
        case .cancelled: return "xmark.seal.fill"
        case .extended: return "arrow.forward.circle.fill"
        case .reassigned: return "arrow.left.arrow.right.circle.fill"
        case .checkedOut: return "arrow.up.circle.fill"
        case .checkedIn: return "arrow.down.circle.fill"
        }
    }
}

// MARK: - API Response Models
public struct VehicleAssignmentsResponse: Codable {
    public let assignments: [VehicleAssignment]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct VehicleAssignmentResponse: Codable {
    public let assignment: VehicleAssignment
}

public struct AssignmentRequestsResponse: Codable {
    public let requests: [AssignmentRequest]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct AssignmentHistoryResponse: Codable {
    public let history: [AssignmentHistory]
    public let total: Int
}

public struct AssignmentConflictsResponse: Codable {
    public let conflicts: [AssignmentConflict]
}

// MARK: - DateInterval Extension
extension DateInterval {
    func overlaps(_ other: DateInterval) -> Bool {
        return self.intersects(other)
    }

    func overlap(with other: DateInterval) -> DateInterval? {
        guard self.overlaps(other) else { return nil }
        let start = max(self.start, other.start)
        let end = min(self.end, other.end)
        return DateInterval(start: start, end: end)
    }
}

// MARK: - Sample Data for Previews
extension VehicleAssignment {
    public static var sample: VehicleAssignment {
        VehicleAssignment(
            id: "assignment-001",
            tenantId: "tenant-001",
            vehicleId: "vehicle-001",
            assignedTo: "driver-001",
            assignmentType: .permanent,
            status: .active,
            startDate: Date(),
            endDate: nil,
            purpose: "Regular duty assignment",
            notes: "Primary vehicle for daily operations",
            approvedBy: "manager-001",
            approvedAt: Date(),
            requestedBy: "manager-001",
            requestedAt: Date(),
            handoffNotes: "Vehicle in excellent condition",
            odometer: 45000.0,
            fuelLevel: 0.85,
            returnOdometer: nil,
            returnFuelLevel: nil,
            returnCondition: nil,
            returnNotes: nil,
            returnedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }

    public static var temporarySample: VehicleAssignment {
        VehicleAssignment(
            id: "assignment-002",
            tenantId: "tenant-001",
            vehicleId: "vehicle-002",
            assignedTo: "driver-002",
            assignmentType: .temporary,
            status: .active,
            startDate: Date(),
            endDate: Calendar.current.date(byAdding: .day, value: 7, to: Date()),
            purpose: "Special project assignment",
            notes: "Return by end of next week",
            approvedBy: "manager-001",
            approvedAt: Date(),
            requestedBy: "driver-002",
            requestedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
            handoffNotes: "Minor scratch on rear bumper",
            odometer: 32000.0,
            fuelLevel: 0.75,
            returnOdometer: nil,
            returnFuelLevel: nil,
            returnCondition: nil,
            returnNotes: nil,
            returnedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension AssignmentRequest {
    public static var sample: AssignmentRequest {
        AssignmentRequest(
            id: "request-001",
            tenantId: "tenant-001",
            vehicleId: nil,
            vehicleType: "SUV",
            requestedBy: "driver-003",
            assignmentType: .temporary,
            startDate: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
            endDate: Calendar.current.date(byAdding: .day, value: 10, to: Date()),
            purpose: "Client site visit and equipment delivery",
            notes: "Need vehicle with towing capacity",
            status: .pending,
            reviewedBy: nil,
            reviewedAt: nil,
            reviewNotes: nil,
            assignmentId: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension AssignmentHistory {
    public static var sample: AssignmentHistory {
        AssignmentHistory(
            id: "history-001",
            assignmentId: "assignment-001",
            vehicleId: "vehicle-001",
            assignedTo: "driver-001",
            action: .created,
            performedBy: "manager-001",
            notes: "Initial assignment for new driver",
            timestamp: Date(),
            metadata: ["department": "Operations", "shift": "Day"]
        )
    }
}
