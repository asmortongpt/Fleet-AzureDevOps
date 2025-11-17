import Foundation
import CoreLocation

// MARK: - Schedule Entry

struct ScheduleEntry: Codable, Identifiable, Hashable {
    let id: String
    var type: ScheduleType
    var title: String
    var description: String?
    var startDate: Date
    var endDate: Date
    var status: ScheduleStatus
    var priority: Priority
    var participants: [Participant]
    var location: ScheduleLocation?
    var recurrence: RecurrenceRule?
    var reminders: [Reminder]
    var attachments: [String] // URLs as strings for Codable
    var metadata: [String: String]
    var createdBy: String
    var createdAt: Date
    var updatedAt: Date

    // Computed properties
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }

    var isOverdue: Bool {
        status != .completed && status != .cancelled && endDate < Date()
    }

    var isToday: Bool {
        Calendar.current.isDateInToday(startDate)
    }

    var isUpcoming: Bool {
        startDate > Date()
    }

    // Hashable conformance
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: ScheduleEntry, rhs: ScheduleEntry) -> Bool {
        lhs.id == rhs.id
    }
}

enum ScheduleType: String, Codable, CaseIterable {
    case shift = "Shift"
    case trip = "Trip"
    case maintenance = "Maintenance"
    case training = "Training"
    case meeting = "Meeting"
    case inspection = "Inspection"
    case delivery = "Delivery"
    case pickup = "Pickup"
    case break_ = "Break"
    case timeOff = "Time Off"

    var icon: String {
        switch self {
        case .shift: return "clock.fill"
        case .trip: return "location.fill"
        case .maintenance: return "wrench.fill"
        case .training: return "book.fill"
        case .meeting: return "person.3.fill"
        case .inspection: return "checkmark.circle.fill"
        case .delivery: return "shippingbox.fill"
        case .pickup: return "arrow.down.circle.fill"
        case .break_: return "cup.and.saucer.fill"
        case .timeOff: return "beach.umbrella.fill"
        }
    }

    var colorName: String {
        switch self {
        case .shift: return "blue"
        case .trip: return "green"
        case .maintenance: return "orange"
        case .training: return "purple"
        case .meeting: return "indigo"
        case .inspection: return "cyan"
        case .delivery: return "teal"
        case .pickup: return "mint"
        case .break_: return "gray"
        case .timeOff: return "pink"
        }
    }
}

enum ScheduleStatus: String, Codable {
    case scheduled = "Scheduled"
    case confirmed = "Confirmed"
    case inProgress = "In Progress"
    case completed = "Completed"
    case cancelled = "Cancelled"
    case delayed = "Delayed"
}

enum Priority: String, Codable, CaseIterable {
    case low = "Low"
    case normal = "Normal"
    case high = "High"
    case urgent = "Urgent"

    var colorName: String {
        switch self {
        case .low: return "gray"
        case .normal: return "blue"
        case .high: return "orange"
        case .urgent: return "red"
        }
    }

    var sortOrder: Int {
        switch self {
        case .urgent: return 0
        case .high: return 1
        case .normal: return 2
        case .low: return 3
        }
    }
}

struct Participant: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var role: ParticipantRole
    var status: ParticipantStatus
    var userId: String?
    var avatarUrl: String?

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

enum ParticipantRole: String, Codable {
    case driver = "Driver"
    case mechanic = "Mechanic"
    case manager = "Manager"
    case dispatcher = "Dispatcher"
    case customer = "Customer"
}

enum ParticipantStatus: String, Codable {
    case invited = "Invited"
    case accepted = "Accepted"
    case declined = "Declined"
    case tentative = "Tentative"
}

struct ScheduleLocation: Codable, Hashable {
    var name: String
    var address: String
    var latitude: Double
    var longitude: Double
    var notes: String?

    var coordinates: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    init(name: String, address: String, coordinates: CLLocationCoordinate2D, notes: String? = nil) {
        self.name = name
        self.address = address
        self.latitude = coordinates.latitude
        self.longitude = coordinates.longitude
        self.notes = notes
    }
}

// MARK: - Recurrence

struct RecurrenceRule: Codable, Hashable {
    var frequency: RecurrenceFrequency
    var interval: Int // Every X days/weeks/months
    var endDate: Date?
    var count: Int? // Number of occurrences
    var daysOfWeek: [DayOfWeek]?
    var daysOfMonth: [Int]?

    var description: String {
        switch frequency {
        case .daily:
            return interval == 1 ? "Daily" : "Every \(interval) days"
        case .weekly:
            if let days = daysOfWeek, !days.isEmpty {
                let dayNames = days.map { $0.shortName }.joined(separator: ", ")
                return "Weekly on \(dayNames)"
            }
            return interval == 1 ? "Weekly" : "Every \(interval) weeks"
        case .monthly:
            return interval == 1 ? "Monthly" : "Every \(interval) months"
        case .yearly:
            return interval == 1 ? "Yearly" : "Every \(interval) years"
        }
    }
}

enum RecurrenceFrequency: String, Codable {
    case daily = "Daily"
    case weekly = "Weekly"
    case monthly = "Monthly"
    case yearly = "Yearly"
}

enum DayOfWeek: Int, Codable, CaseIterable {
    case sunday = 1
    case monday = 2
    case tuesday = 3
    case wednesday = 4
    case thursday = 5
    case friday = 6
    case saturday = 7

    var shortName: String {
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][self.rawValue - 1]
    }

    var fullName: String {
        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][self.rawValue - 1]
    }
}

struct Reminder: Codable, Identifiable, Hashable {
    let id: String
    var type: ReminderType
    var minutesBefore: Int
    var sent: Bool

    var description: String {
        let hours = minutesBefore / 60
        let mins = minutesBefore % 60

        if minutesBefore < 60 {
            return "\(minutesBefore) minutes before"
        } else if mins == 0 {
            return "\(hours) hour\(hours > 1 ? "s" : "") before"
        } else {
            return "\(hours)h \(mins)m before"
        }
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

enum ReminderType: String, Codable {
    case notification = "Notification"
    case email = "Email"
    case sms = "SMS"
}

// MARK: - Driver Schedule

struct DriverSchedule: Codable, Identifiable {
    let id: String
    var driverId: String
    var driverName: String
    var date: Date
    var shifts: [ShiftSchedule]
    var totalHours: TimeInterval
    var overtimeHours: TimeInterval
    var breaks: [BreakSchedule]
    var availability: DriverAvailability

    var regularHours: TimeInterval {
        max(0, totalHours - overtimeHours)
    }

    var hasOvertime: Bool {
        overtimeHours > 0
    }

    var isAvailable: Bool {
        availability == .available
    }
}

struct ShiftSchedule: Codable, Identifiable, Hashable {
    let id: String
    var startTime: Date
    var endTime: Date
    var vehicleId: String?
    var vehicleNumber: String?
    var route: Route?
    var status: ScheduleStatus

    var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct BreakSchedule: Codable, Identifiable, Hashable {
    let id: String
    var startTime: Date
    var duration: TimeInterval
    var type: BreakType

    var endTime: Date {
        startTime.addingTimeInterval(duration)
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

enum BreakType: String, Codable {
    case meal = "Meal Break"
    case rest = "Rest Break"
    case mandatory = "Mandatory Break"
}

enum DriverAvailability: String, Codable {
    case available = "Available"
    case scheduled = "Scheduled"
    case timeOff = "Time Off"
    case sick = "Sick"
    case unavailable = "Unavailable"

    var icon: String {
        switch self {
        case .available: return "checkmark.circle.fill"
        case .scheduled: return "clock.fill"
        case .timeOff: return "beach.umbrella.fill"
        case .sick: return "cross.circle.fill"
        case .unavailable: return "xmark.circle.fill"
        }
    }

    var colorName: String {
        switch self {
        case .available: return "green"
        case .scheduled: return "blue"
        case .timeOff: return "orange"
        case .sick: return "red"
        case .unavailable: return "gray"
        }
    }
}

// MARK: - Vehicle Schedule

struct VehicleSchedule: Codable, Identifiable {
    let id: String
    var vehicleId: String
    var vehicleNumber: String
    var date: Date
    var assignments: [VehicleAssignment]
    var maintenanceWindows: [MaintenanceWindow]
    var utilization: Double // 0-1

    var isFullyBooked: Bool {
        utilization >= 0.9
    }

    var hasMaintenanceDue: Bool {
        !maintenanceWindows.isEmpty
    }
}

struct VehicleAssignment: Codable, Identifiable, Hashable {
    let id: String
    var driverId: String
    var driverName: String
    var startTime: Date
    var endTime: Date
    var purpose: String
    var estimatedMiles: Double

    var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct MaintenanceWindow: Codable, Identifiable, Hashable {
    let id: String
    var type: MaintenanceType
    var scheduledDate: Date
    var estimatedDuration: TimeInterval
    var vendor: String?
    var cost: Double?
    var notes: String?
    var status: ScheduleStatus

    var endTime: Date {
        scheduledDate.addingTimeInterval(estimatedDuration)
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

enum MaintenanceType: String, Codable, CaseIterable {
    case routine = "Routine Maintenance"
    case repair = "Repair"
    case inspection = "Inspection"
    case cleaning = "Cleaning"

    var icon: String {
        switch self {
        case .routine: return "wrench.and.screwdriver.fill"
        case .repair: return "hammer.fill"
        case .inspection: return "doc.text.magnifyingglass"
        case .cleaning: return "sparkles"
        }
    }
}

// MARK: - Route Schedule

struct Route: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var stops: [RouteStop]
    var estimatedDuration: TimeInterval
    var estimatedDistance: Double

    var stopCount: Int {
        stops.count
    }

    var formattedDistance: String {
        String(format: "%.1f mi", estimatedDistance)
    }

    var formattedDuration: String {
        let hours = Int(estimatedDuration / 3600)
        let minutes = Int((estimatedDuration.truncatingRemainder(dividingBy: 3600)) / 60)
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

struct RouteStop: Codable, Identifiable, Hashable {
    let id: String
    var sequenceNumber: Int
    var location: ScheduleLocation
    var arrivalTime: Date
    var departureTime: Date
    var stopType: StopType
    var instructions: String?

    var dwellTime: TimeInterval {
        departureTime.timeIntervalSince(arrivalTime)
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

enum StopType: String, Codable {
    case pickup = "Pickup"
    case delivery = "Delivery"
    case waypoint = "Waypoint"
    case rest = "Rest Stop"

    var icon: String {
        switch self {
        case .pickup: return "arrow.down.circle.fill"
        case .delivery: return "shippingbox.fill"
        case .waypoint: return "mappin.circle.fill"
        case .rest: return "cup.and.saucer.fill"
        }
    }
}

// MARK: - Calendar Integration

struct CalendarSync: Codable {
    var syncEnabled: Bool
    var calendarId: String?
    var lastSyncDate: Date?
    var syncConflicts: [ConflictResolution]

    var needsSync: Bool {
        guard syncEnabled else { return false }
        guard let lastSync = lastSyncDate else { return true }
        return Date().timeIntervalSince(lastSync) > 3600 // 1 hour
    }
}

struct ConflictResolution: Codable, Identifiable {
    let id: String
    var localEntry: ScheduleEntry
    var remoteEntry: ScheduleEntry
    var resolution: Resolution
    var resolvedAt: Date?
}

enum Resolution: String, Codable {
    case keepLocal = "Keep Local"
    case keepRemote = "Keep Remote"
    case merge = "Merge"
    case manual = "Manual"
}

// MARK: - Schedule Conflict

struct ScheduleConflict: Identifiable {
    let id: String
    var conflictingEntries: [ScheduleEntry]
    var type: ConflictType
    var severity: Severity

    var description: String {
        switch type {
        case .doubleBooking:
            return "Double booking detected"
        case .overlap:
            return "Schedule overlap detected"
        case .violation:
            return "Policy violation detected"
        case .resourceUnavailable:
            return "Resource unavailable"
        }
    }
}

enum ConflictType: String {
    case doubleBooking = "Double Booking"
    case overlap = "Overlap"
    case violation = "Violation"
    case resourceUnavailable = "Resource Unavailable"
}

enum Severity: String {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    case critical = "Critical"

    var colorName: String {
        switch self {
        case .low: return "gray"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }
}

// MARK: - Schedule Filter

struct ScheduleFilter {
    var types: Set<ScheduleType> = []
    var statuses: Set<ScheduleStatus> = []
    var priorities: Set<Priority> = []
    var dateRange: DateRange?
    var searchText: String = ""

    func matches(_ entry: ScheduleEntry) -> Bool {
        if !types.isEmpty && !types.contains(entry.type) {
            return false
        }

        if !statuses.isEmpty && !statuses.contains(entry.status) {
            return false
        }

        if !priorities.isEmpty && !priorities.contains(entry.priority) {
            return false
        }

        if let range = dateRange {
            if entry.startDate < range.start || entry.startDate > range.end {
                return false
            }
        }

        if !searchText.isEmpty {
            let lowercasedSearch = searchText.lowercased()
            return entry.title.lowercased().contains(lowercasedSearch) ||
                   entry.description?.lowercased().contains(lowercasedSearch) ?? false
        }

        return true
    }
}

struct DateRange {
    var start: Date
    var end: Date
}

// MARK: - Schedule Statistics

struct ScheduleStatistics {
    var totalScheduled: Int
    var completed: Int
    var inProgress: Int
    var upcoming: Int
    var overdue: Int
    var cancelled: Int

    var completionRate: Double {
        guard totalScheduled > 0 else { return 0 }
        return Double(completed) / Double(totalScheduled)
    }
}
