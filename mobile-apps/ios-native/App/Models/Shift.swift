import Foundation
import CoreLocation
import SwiftUI

// MARK: - Shift
struct Shift: Codable, Identifiable, Equatable {
    let id: String
    let tenantId: String
    let driverId: String
    let vehicleId: String
    let startTime: Date
    var endTime: Date?
    var status: ShiftStatus
    var startLocation: Coordinate?
    var endLocation: Coordinate?
    var breakEntries: [BreakEntry]
    var timeEntries: [TimeEntry]
    let createdDate: Date
    let createdBy: String
    var lastModifiedDate: Date?
    var lastModifiedBy: String?
    var notes: String?
    var shiftTemplateId: String?

    // Computed properties
    var driverName: String?
    var vehicleName: String?

    var duration: TimeInterval? {
        guard let endTime = endTime else { return nil }
        return endTime.timeIntervalSince(startTime)
    }

    var totalBreakTime: TimeInterval {
        breakEntries.reduce(0) { total, breakEntry in
            total + (breakEntry.duration ?? 0)
        }
    }

    var workingHours: TimeInterval? {
        guard let duration = duration else { return nil }
        return duration - totalBreakTime
    }

    var regularHours: Double {
        guard let workingHours = workingHours else { return 0 }
        let hours = workingHours / 3600
        return min(hours, 8.0)
    }

    var overtimeHours: Double {
        guard let workingHours = workingHours else { return 0 }
        let hours = workingHours / 3600
        return max(0, hours - 8.0)
    }

    var formattedDuration: String {
        guard let duration = duration else { return "In Progress" }
        let hours = Int(duration / 3600)
        let minutes = Int((duration.truncatingRemainder(dividingBy: 3600)) / 60)
        return String(format: "%dh %02dm", hours, minutes)
    }

    var formattedWorkingHours: String {
        guard let workingHours = workingHours else { return "In Progress" }
        let hours = Int(workingHours / 3600)
        let minutes = Int((workingHours.truncatingRemainder(dividingBy: 3600)) / 60)
        return String(format: "%dh %02dm", hours, minutes)
    }

    var statusColor: Color {
        switch status {
        case .scheduled:
            return .blue
        case .started:
            return .green
        case .break:
            return .orange
        case .ended:
            return .gray
        case .missed:
            return .red
        }
    }

    var isActive: Bool {
        status == .started || status == .break
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case driverId = "driver_id"
        case vehicleId = "vehicle_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case status
        case startLocation = "start_location"
        case endLocation = "end_location"
        case breakEntries = "break_entries"
        case timeEntries = "time_entries"
        case createdDate = "created_date"
        case createdBy = "created_by"
        case lastModifiedDate = "last_modified_date"
        case lastModifiedBy = "last_modified_by"
        case notes
        case shiftTemplateId = "shift_template_id"
        case driverName = "driver_name"
        case vehicleName = "vehicle_name"
    }

    static var sample: Shift {
        Shift(
            id: UUID().uuidString,
            tenantId: "tenant-1",
            driverId: "driver-1",
            vehicleId: "vehicle-1",
            startTime: Date().addingTimeInterval(-3600 * 4),
            endTime: nil,
            status: .started,
            startLocation: Coordinate(latitude: 38.9072, longitude: -77.0369),
            endLocation: nil,
            breakEntries: [
                BreakEntry(
                    id: UUID().uuidString,
                    shiftId: UUID().uuidString,
                    startTime: Date().addingTimeInterval(-3600 * 2),
                    endTime: Date().addingTimeInterval(-3600 * 2 + 900),
                    type: .lunch,
                    isPaid: false
                )
            ],
            timeEntries: [],
            createdDate: Date().addingTimeInterval(-3600 * 4),
            createdBy: "user-1",
            lastModifiedDate: nil,
            lastModifiedBy: nil,
            notes: nil,
            shiftTemplateId: nil,
            driverName: "John Smith",
            vehicleName: "Truck #42"
        )
    }
}

// MARK: - ShiftStatus
enum ShiftStatus: String, Codable, CaseIterable {
    case scheduled = "scheduled"
    case started = "started"
    case `break` = "break"
    case ended = "ended"
    case missed = "missed"

    var displayName: String {
        switch self {
        case .scheduled: return "Scheduled"
        case .started: return "In Progress"
        case .break: return "On Break"
        case .ended: return "Completed"
        case .missed: return "Missed"
        }
    }

    var icon: String {
        switch self {
        case .scheduled: return "calendar"
        case .started: return "play.circle.fill"
        case .break: return "pause.circle.fill"
        case .ended: return "checkmark.circle.fill"
        case .missed: return "xmark.circle.fill"
        }
    }
}

// MARK: - ShiftTemplate
struct ShiftTemplate: Codable, Identifiable, Equatable {
    let id: String
    let tenantId: String
    let name: String
    let description: String?
    let startTime: Date // Time of day
    let endTime: Date // Time of day
    let recurrencePattern: RecurrencePattern
    var daysOfWeek: [Int]? // 0=Sunday, 6=Saturday
    var assignedDriverIds: [String]
    var assignedVehicleIds: [String]
    let isActive: Bool
    let createdDate: Date
    let createdBy: String
    var lastModifiedDate: Date?
    var lastModifiedBy: String?

    var durationHours: Double {
        endTime.timeIntervalSince(startTime) / 3600
    }

    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: startTime)) - \(formatter.string(from: endTime))"
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case name
        case description
        case startTime = "start_time"
        case endTime = "end_time"
        case recurrencePattern = "recurrence_pattern"
        case daysOfWeek = "days_of_week"
        case assignedDriverIds = "assigned_driver_ids"
        case assignedVehicleIds = "assigned_vehicle_ids"
        case isActive = "is_active"
        case createdDate = "created_date"
        case createdBy = "created_by"
        case lastModifiedDate = "last_modified_date"
        case lastModifiedBy = "last_modified_by"
    }

    static var sample: ShiftTemplate {
        let calendar = Calendar.current
        let now = Date()
        let startTime = calendar.date(bySettingHour: 8, minute: 0, second: 0, of: now)!
        let endTime = calendar.date(bySettingHour: 17, minute: 0, second: 0, of: now)!

        return ShiftTemplate(
            id: UUID().uuidString,
            tenantId: "tenant-1",
            name: "Morning Shift",
            description: "Standard 9-hour morning shift",
            startTime: startTime,
            endTime: endTime,
            recurrencePattern: .weekly,
            daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
            assignedDriverIds: [],
            assignedVehicleIds: [],
            isActive: true,
            createdDate: Date(),
            createdBy: "user-1",
            lastModifiedDate: nil,
            lastModifiedBy: nil
        )
    }
}

// MARK: - RecurrencePattern
enum RecurrencePattern: String, Codable, CaseIterable {
    case daily = "daily"
    case weekly = "weekly"
    case biweekly = "biweekly"
    case monthly = "monthly"
    case custom = "custom"

    var displayName: String {
        switch self {
        case .daily: return "Daily"
        case .weekly: return "Weekly"
        case .biweekly: return "Bi-weekly"
        case .monthly: return "Monthly"
        case .custom: return "Custom"
        }
    }
}

// MARK: - TimeEntry
struct TimeEntry: Codable, Identifiable, Equatable {
    let id: String
    let shiftId: String
    let entryType: TimeEntryType
    let timestamp: Date
    var location: Coordinate?
    var notes: String?
    let createdBy: String

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case shiftId = "shift_id"
        case entryType = "entry_type"
        case timestamp
        case location
        case notes
        case createdBy = "created_by"
    }

    static var sample: TimeEntry {
        TimeEntry(
            id: UUID().uuidString,
            shiftId: UUID().uuidString,
            entryType: .clockIn,
            timestamp: Date(),
            location: Coordinate(latitude: 38.9072, longitude: -77.0369),
            notes: nil,
            createdBy: "user-1"
        )
    }
}

// MARK: - TimeEntryType
enum TimeEntryType: String, Codable, CaseIterable {
    case clockIn = "clock_in"
    case clockOut = "clock_out"
    case breakStart = "break_start"
    case breakEnd = "break_end"

    var displayName: String {
        switch self {
        case .clockIn: return "Clock In"
        case .clockOut: return "Clock Out"
        case .breakStart: return "Break Start"
        case .breakEnd: return "Break End"
        }
    }

    var icon: String {
        switch self {
        case .clockIn: return "arrow.right.circle.fill"
        case .clockOut: return "arrow.left.circle.fill"
        case .breakStart: return "pause.circle.fill"
        case .breakEnd: return "play.circle.fill"
        }
    }
}

// MARK: - BreakEntry
struct BreakEntry: Codable, Identifiable, Equatable {
    let id: String
    let shiftId: String
    let startTime: Date
    var endTime: Date?
    let type: BreakType
    let isPaid: Bool

    var duration: TimeInterval? {
        guard let endTime = endTime else { return nil }
        return endTime.timeIntervalSince(startTime)
    }

    var formattedDuration: String {
        guard let duration = duration else { return "In Progress" }
        let minutes = Int(duration / 60)
        return "\(minutes) min"
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case shiftId = "shift_id"
        case startTime = "start_time"
        case endTime = "end_time"
        case type
        case isPaid = "is_paid"
    }

    static var sample: BreakEntry {
        BreakEntry(
            id: UUID().uuidString,
            shiftId: UUID().uuidString,
            startTime: Date(),
            endTime: Date().addingTimeInterval(900),
            type: .lunch,
            isPaid: false
        )
    }
}

// MARK: - BreakType
enum BreakType: String, Codable, CaseIterable {
    case lunch = "lunch"
    case rest = "rest"
    case other = "other"

    var displayName: String {
        switch self {
        case .lunch: return "Lunch Break"
        case .rest: return "Rest Break"
        case .other: return "Other"
        }
    }
}

// MARK: - ShiftSwapRequest
struct ShiftSwapRequest: Codable, Identifiable, Equatable {
    let id: String
    let tenantId: String
    let originalShiftId: String
    let requestingDriverId: String
    let targetDriverId: String?
    var targetShiftId: String?
    let status: SwapStatus
    let requestDate: Date
    var responseDate: Date?
    var respondedBy: String?
    var approvedBy: String?
    var approvalDate: Date?
    var reason: String?
    var notes: String?

    // Computed properties for display
    var originalShift: Shift?
    var targetShift: Shift?
    var requestingDriverName: String?
    var targetDriverName: String?

    var statusColor: Color {
        switch status {
        case .pending: return .orange
        case .approved: return .green
        case .rejected: return .red
        case .cancelled: return .gray
        }
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case originalShiftId = "original_shift_id"
        case requestingDriverId = "requesting_driver_id"
        case targetDriverId = "target_driver_id"
        case targetShiftId = "target_shift_id"
        case status
        case requestDate = "request_date"
        case responseDate = "response_date"
        case respondedBy = "responded_by"
        case approvedBy = "approved_by"
        case approvalDate = "approval_date"
        case reason
        case notes
        case originalShift = "original_shift"
        case targetShift = "target_shift"
        case requestingDriverName = "requesting_driver_name"
        case targetDriverName = "target_driver_name"
    }

    static var sample: ShiftSwapRequest {
        ShiftSwapRequest(
            id: UUID().uuidString,
            tenantId: "tenant-1",
            originalShiftId: UUID().uuidString,
            requestingDriverId: "driver-1",
            targetDriverId: "driver-2",
            targetShiftId: nil,
            status: .pending,
            requestDate: Date(),
            responseDate: nil,
            respondedBy: nil,
            approvedBy: nil,
            approvalDate: nil,
            reason: "Family emergency",
            notes: nil,
            originalShift: nil,
            targetShift: nil,
            requestingDriverName: "John Smith",
            targetDriverName: "Jane Doe"
        )
    }
}

// MARK: - SwapStatus
enum SwapStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case approved = "approved"
    case rejected = "rejected"
    case cancelled = "cancelled"

    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .approved: return "Approved"
        case .rejected: return "Rejected"
        case .cancelled: return "Cancelled"
        }
    }

    var icon: String {
        switch self {
        case .pending: return "clock"
        case .approved: return "checkmark.circle.fill"
        case .rejected: return "xmark.circle.fill"
        case .cancelled: return "slash.circle.fill"
        }
    }
}

// MARK: - ShiftReport
struct ShiftReport: Codable, Identifiable, Equatable {
    let id: String
    let tenantId: String
    let driverId: String?
    let vehicleId: String?
    let startDate: Date
    let endDate: Date
    let totalShifts: Int
    let totalHoursWorked: Double
    let totalRegularHours: Double
    let totalOvertimeHours: Double
    let totalBreakTime: Double
    let missedShifts: Int
    var shifts: [Shift]
    let generatedDate: Date
    let generatedBy: String

    // Computed properties
    var driverName: String?
    var vehicleName: String?

    var averageHoursPerShift: Double {
        guard totalShifts > 0 else { return 0 }
        return totalHoursWorked / Double(totalShifts)
    }

    var overtimePercentage: Double {
        guard totalHoursWorked > 0 else { return 0 }
        return (totalOvertimeHours / totalHoursWorked) * 100
    }

    var formattedTotalHours: String {
        String(format: "%.1f hrs", totalHoursWorked)
    }

    var formattedOvertimeHours: String {
        String(format: "%.1f hrs", totalOvertimeHours)
    }

    var formattedDateRange: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return "\(formatter.string(from: startDate)) - \(formatter.string(from: endDate))"
    }

    // API coding keys
    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case driverId = "driver_id"
        case vehicleId = "vehicle_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case totalShifts = "total_shifts"
        case totalHoursWorked = "total_hours_worked"
        case totalRegularHours = "total_regular_hours"
        case totalOvertimeHours = "total_overtime_hours"
        case totalBreakTime = "total_break_time"
        case missedShifts = "missed_shifts"
        case shifts
        case generatedDate = "generated_date"
        case generatedBy = "generated_by"
        case driverName = "driver_name"
        case vehicleName = "vehicle_name"
    }

    static var sample: ShiftReport {
        ShiftReport(
            id: UUID().uuidString,
            tenantId: "tenant-1",
            driverId: "driver-1",
            vehicleId: nil,
            startDate: Calendar.current.date(byAdding: .day, value: -7, to: Date())!,
            endDate: Date(),
            totalShifts: 5,
            totalHoursWorked: 42.5,
            totalRegularHours: 40.0,
            totalOvertimeHours: 2.5,
            totalBreakTime: 2.5,
            missedShifts: 0,
            shifts: [],
            generatedDate: Date(),
            generatedBy: "user-1",
            driverName: "John Smith",
            vehicleName: nil
        )
    }
}

// MARK: - Coordinate
struct Coordinate: Codable, Equatable {
    let latitude: Double
    let longitude: Double

    var location: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    init(from location: CLLocationCoordinate2D) {
        self.latitude = location.latitude
        self.longitude = location.longitude
    }
}
