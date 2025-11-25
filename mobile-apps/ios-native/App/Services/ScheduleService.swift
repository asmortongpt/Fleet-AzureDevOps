import Foundation
import Combine
import CoreLocation

@MainActor
class ScheduleService: ObservableObject {
    static let shared = ScheduleService()

    @Published var schedules: [ScheduleEntry] = []
    @Published var driverSchedules: [DriverSchedule] = []
    @Published var vehicleSchedules: [VehicleSchedule] = []
    @Published var conflicts: [ScheduleConflict] = []

    private var cancellables = Set<AnyCancellable>()
    private let baseURL = "https://api.fleetmanagement.com/v1" // Replace with actual API
    private let persistenceKey = "com.fleet.schedules"

    private init() {
        loadCachedSchedules()
    }

    // MARK: - Schedule CRUD

    func fetchSchedules(for date: Date, filter: ScheduleFilter? = nil) async throws -> [ScheduleEntry] {
        // In production, this would call the API
        // For now, return cached schedules filtered by date

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        var filtered = schedules.filter { schedule in
            schedule.startDate >= startOfDay && schedule.startDate < endOfDay
        }

        if let filter = filter {
            filtered = filtered.filter { filter.matches($0) }
        }

        return filtered.sorted { $0.startDate < $1.startDate }
    }

    func fetchSchedulesInRange(start: Date, end: Date) async throws -> [ScheduleEntry] {
        return schedules.filter { schedule in
            schedule.startDate >= start && schedule.startDate <= end
        }.sorted { $0.startDate < $1.startDate }
    }

    func createSchedule(_ entry: ScheduleEntry) async throws {
        // Detect conflicts before creating
        let conflicts = await detectConflicts(entry: entry)
        if !conflicts.isEmpty {
            // Store conflicts for user resolution
            self.conflicts.append(contentsOf: conflicts)
        }

        // In production: POST to API
        // await apiClient.post("/schedules", body: entry)

        schedules.append(entry)
        saveSchedulesToCache()

        // Send notification
        await scheduleNotifications(for: entry)
    }

    func updateSchedule(_ entry: ScheduleEntry) async throws {
        // In production: PUT to API
        // await apiClient.put("/schedules/\(entry.id)", body: entry)

        if let index = schedules.firstIndex(where: { $0.id == entry.id }) {
            schedules[index] = entry
            saveSchedulesToCache()
        }
    }

    func deleteSchedule(_ id: String) async throws {
        // In production: DELETE to API
        // await apiClient.delete("/schedules/\(id)")

        schedules.removeAll { $0.id == id }
        saveSchedulesToCache()
    }

    func getSchedule(by id: String) -> ScheduleEntry? {
        return schedules.first { $0.id == id }
    }

    // MARK: - Driver Scheduling

    func getDriverSchedule(driverId: String, date: Date) async throws -> DriverSchedule {
        // In production: GET from API
        // let schedule = await apiClient.get("/drivers/\(driverId)/schedule?date=\(date)")

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let driverEntries = schedules.filter { entry in
            entry.participants.contains { $0.userId == driverId } &&
            entry.startDate >= startOfDay &&
            entry.startDate < endOfDay
        }

        // Build shifts from schedule entries
        let shifts = driverEntries.compactMap { entry -> ShiftSchedule? in
            guard entry.type == .shift else { return nil }
            return ShiftSchedule(
                id: entry.id,
                startTime: entry.startDate,
                endTime: entry.endDate,
                vehicleId: entry.metadata["vehicleId"],
                vehicleNumber: entry.metadata["vehicleNumber"],
                route: nil, // Would be populated from entry metadata
                status: entry.status
            )
        }

        // Build breaks
        let breaks = driverEntries.compactMap { entry -> BreakSchedule? in
            guard entry.type == .break_ else { return nil }
            return BreakSchedule(
                id: entry.id,
                startTime: entry.startDate,
                duration: entry.duration,
                type: .rest // Would be determined from metadata
            )
        }

        // Calculate hours
        let totalHours = shifts.reduce(0.0) { $0 + $1.duration } / 3600
        let overtimeHours = max(0, totalHours - 8.0) // 8 hours regular

        return DriverSchedule(
            id: UUID().uuidString,
            driverId: driverId,
            driverName: driverEntries.first?.participants.first?.name ?? "Unknown",
            date: date,
            shifts: shifts,
            totalHours: totalHours * 3600,
            overtimeHours: overtimeHours * 3600,
            breaks: breaks,
            availability: determineAvailability(for: driverId, on: date)
        )
    }

    func getDriverScheduleForWeek(driverId: String, weekStart: Date) async throws -> [DriverSchedule] {
        var schedules: [DriverSchedule] = []

        for dayOffset in 0..<7 {
            if let date = Calendar.current.date(byAdding: .day, value: dayOffset, to: weekStart) {
                let schedule = try await getDriverSchedule(driverId: driverId, date: date)
                schedules.append(schedule)
            }
        }

        return schedules
    }

    func assignDriver(driverId: String, driverName: String, to vehicleId: String, shift: ShiftSchedule) async throws {
        let entry = ScheduleEntry(
            id: UUID().uuidString,
            type: .shift,
            title: "Shift - Vehicle \(shift.vehicleNumber ?? vehicleId)",
            description: "Driver assignment",
            startDate: shift.startTime,
            endDate: shift.endTime,
            status: .scheduled,
            priority: .normal,
            participants: [
                Participant(
                    id: UUID().uuidString,
                    name: driverName,
                    role: .driver,
                    status: .accepted,
                    userId: driverId
                )
            ],
            location: nil,
            recurrence: nil,
            reminders: [],
            attachments: [],
            metadata: [
                "vehicleId": vehicleId,
                "vehicleNumber": shift.vehicleNumber ?? ""
            ],
            createdBy: "system",
            createdAt: Date(),
            updatedAt: Date()
        )

        try await createSchedule(entry)
    }

    func requestTimeOff(driverId: String, driverName: String, startDate: Date, endDate: Date, reason: String) async throws {
        let entry = ScheduleEntry(
            id: UUID().uuidString,
            type: .timeOff,
            title: "Time Off Request",
            description: reason,
            startDate: startDate,
            endDate: endDate,
            status: .scheduled,
            priority: .normal,
            participants: [
                Participant(
                    id: UUID().uuidString,
                    name: driverName,
                    role: .driver,
                    status: .invited,
                    userId: driverId
                )
            ],
            location: nil,
            recurrence: nil,
            reminders: [],
            attachments: [],
            metadata: [:],
            createdBy: driverId,
            createdAt: Date(),
            updatedAt: Date()
        )

        try await createSchedule(entry)
    }

    private func determineAvailability(for driverId: String, on date: Date) -> DriverAvailability {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let dayEntries = schedules.filter { entry in
            entry.participants.contains { $0.userId == driverId } &&
            entry.startDate >= startOfDay &&
            entry.startDate < endOfDay
        }

        if dayEntries.contains(where: { $0.type == .timeOff }) {
            return .timeOff
        }

        if dayEntries.contains(where: { $0.type == .shift }) {
            return .scheduled
        }

        return .available
    }

    // MARK: - Vehicle Scheduling

    func getVehicleSchedule(vehicleId: String, date: Date) async throws -> VehicleSchedule {
        // In production: GET from API
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let vehicleEntries = schedules.filter { entry in
            entry.metadata["vehicleId"] == vehicleId &&
            entry.startDate >= startOfDay &&
            entry.startDate < endOfDay
        }

        // Build assignments
        let assignments = vehicleEntries.compactMap { entry -> VehicleAssignment? in
            guard let participant = entry.participants.first(where: { $0.role == .driver }) else {
                return nil
            }

            return VehicleAssignment(
                id: entry.id,
                driverId: participant.userId ?? "",
                driverName: participant.name,
                startTime: entry.startDate,
                endTime: entry.endDate,
                purpose: entry.title,
                estimatedMiles: Double(entry.metadata["estimatedMiles"] ?? "0") ?? 0
            )
        }

        // Build maintenance windows
        let maintenanceWindows = vehicleEntries.compactMap { entry -> MaintenanceWindow? in
            guard entry.type == .maintenance else { return nil }

            let typeString = entry.metadata["maintenanceType"] ?? "preventive"
            let type = MaintenanceType(rawValue: typeString.capitalized) ?? .preventive

            return MaintenanceWindow(
                id: entry.id,
                type: type,
                scheduledDate: entry.startDate,
                estimatedDuration: entry.duration,
                vendor: entry.metadata["vendor"],
                cost: Double(entry.metadata["cost"] ?? "0"),
                notes: entry.description,
                status: entry.status
            )
        }

        // Calculate utilization (hours scheduled / 24 hours)
        let totalScheduledTime = assignments.reduce(0.0) { $0 + $1.duration }
        let utilization = totalScheduledTime / 86400 // 24 hours in seconds

        return VehicleSchedule(
            id: UUID().uuidString,
            vehicleId: vehicleId,
            vehicleNumber: vehicleEntries.first?.metadata["vehicleNumber"] ?? vehicleId,
            date: date,
            assignments: assignments,
            maintenanceWindows: maintenanceWindows,
            utilization: min(1.0, utilization)
        )
    }

    func scheduleMaintenance(vehicleId: String, vehicleNumber: String, window: MaintenanceWindow) async throws {
        let entry = ScheduleEntry(
            id: window.id,
            type: .maintenance,
            title: "\(window.type.rawValue) - Vehicle \(vehicleNumber)",
            description: window.notes,
            startDate: window.scheduledDate,
            endDate: window.endTime,
            status: window.status,
            priority: .high,
            participants: [],
            location: nil,
            recurrence: nil,
            reminders: [
                Reminder(id: UUID().uuidString, type: .notification, minutesBefore: 1440, sent: false), // 1 day
                Reminder(id: UUID().uuidString, type: .notification, minutesBefore: 60, sent: false)
            ],
            attachments: [],
            metadata: [
                "vehicleId": vehicleId,
                "vehicleNumber": vehicleNumber,
                "maintenanceType": window.type.rawValue,
                "vendor": window.vendor ?? "",
                "cost": String(window.cost ?? 0)
            ],
            createdBy: "system",
            createdAt: Date(),
            updatedAt: Date()
        )

        try await createSchedule(entry)
    }

    // MARK: - Conflict Detection

    func detectConflicts(entry: ScheduleEntry) async -> [ScheduleConflict] {
        var conflicts: [ScheduleConflict] = []

        // Check for driver double-booking
        for participant in entry.participants where participant.role == .driver {
            if let userId = participant.userId {
                let driverConflicts = schedules.filter { existing in
                    existing.id != entry.id &&
                    existing.participants.contains { $0.userId == userId && $0.role == .driver } &&
                    timeRangesOverlap(
                        start1: entry.startDate, end1: entry.endDate,
                        start2: existing.startDate, end2: existing.endDate
                    )
                }

                if !driverConflicts.isEmpty {
                    conflicts.append(ScheduleConflict(
                        id: UUID().uuidString,
                        conflictingEntries: [entry] + driverConflicts,
                        type: .doubleBooking,
                        severity: .high
                    ))
                }
            }
        }

        // Check for vehicle double-booking
        if let vehicleId = entry.metadata["vehicleId"] {
            let vehicleConflicts = schedules.filter { existing in
                existing.id != entry.id &&
                existing.metadata["vehicleId"] == vehicleId &&
                timeRangesOverlap(
                    start1: entry.startDate, end1: entry.endDate,
                    start2: existing.startDate, end2: existing.endDate
                )
            }

            if !vehicleConflicts.isEmpty {
                conflicts.append(ScheduleConflict(
                    id: UUID().uuidString,
                    conflictingEntries: [entry] + vehicleConflicts,
                    type: .resourceUnavailable,
                    severity: .high
                ))
            }
        }

        // Check for Hours of Service violations (drivers working > 14 hours)
        for participant in entry.participants where participant.role == .driver {
            if let userId = participant.userId {
                if let schedule = try? await getDriverSchedule(driverId: userId, date: entry.startDate) {
                    let proposedHours = (schedule.totalHours + entry.duration) / 3600
                    if proposedHours > 14 {
                        conflicts.append(ScheduleConflict(
                            id: UUID().uuidString,
                            conflictingEntries: [entry],
                            type: .violation,
                            severity: .critical
                        ))
                    }
                }
            }
        }

        return conflicts
    }

    func resolveConflict(_ conflict: ScheduleConflict, resolution: Resolution) async throws {
        // Handle conflict resolution based on type
        conflicts.removeAll { $0.id == conflict.id }
    }

    private func timeRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date) -> Bool {
        return start1 < end2 && end1 > start2
    }

    // MARK: - Statistics

    func getStatistics(for dateRange: DateRange) -> ScheduleStatistics {
        let filtered = schedules.filter { schedule in
            schedule.startDate >= dateRange.start && schedule.startDate <= dateRange.end
        }

        return ScheduleStatistics(
            totalScheduled: filtered.count,
            completed: filtered.filter { $0.status == .completed }.count,
            inProgress: filtered.filter { $0.status == .inProgress }.count,
            upcoming: filtered.filter { $0.isUpcoming }.count,
            overdue: filtered.filter { $0.isOverdue }.count,
            cancelled: filtered.filter { $0.status == .cancelled }.count
        )
    }

    // MARK: - Notifications

    private func scheduleNotifications(for entry: ScheduleEntry) async {
        // In production, schedule local notifications
        for reminder in entry.reminders where !reminder.sent {
            let triggerDate = entry.startDate.addingTimeInterval(-Double(reminder.minutesBefore * 60))

            // Schedule notification using UNUserNotificationCenter
            // NotificationService.shared.scheduleNotification(
            //     title: entry.title,
            //     body: "Starting in \(reminder.minutesBefore) minutes",
            //     date: triggerDate
            // )
        }
    }

    // MARK: - Persistence

    private func loadCachedSchedules() {
        if let data = UserDefaults.standard.data(forKey: persistenceKey),
           let cached = try? JSONDecoder().decode([ScheduleEntry].self, from: data) {
            schedules = cached
        } else {
            // Load sample data for demo
            loadSampleData()
        }
    }

    private func saveSchedulesToCache() {
        if let data = try? JSONEncoder().encode(schedules) {
            UserDefaults.standard.set(data, forKey: persistenceKey)
        }
    }

    private func loadSampleData() {
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date())!
        let tomorrowMorning = Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: tomorrow)!

        schedules = [
            ScheduleEntry(
                id: UUID().uuidString,
                type: .shift,
                title: "Morning Shift",
                description: "Regular delivery route",
                startDate: tomorrowMorning,
                endDate: tomorrowMorning.addingTimeInterval(8 * 3600),
                status: .scheduled,
                priority: .normal,
                participants: [
                    Participant(
                        id: UUID().uuidString,
                        name: "John Driver",
                        role: .driver,
                        status: .accepted,
                        userId: "driver-001"
                    )
                ],
                location: nil,
                recurrence: RecurrenceRule(
                    frequency: .daily,
                    interval: 1,
                    endDate: nil,
                    count: nil,
                    daysOfWeek: [.monday, .tuesday, .wednesday, .thursday, .friday],
                    daysOfMonth: nil
                ),
                reminders: [
                    Reminder(id: UUID().uuidString, type: .notification, minutesBefore: 30, sent: false)
                ],
                attachments: [],
                metadata: ["vehicleId": "vehicle-001", "vehicleNumber": "FL-101"],
                createdBy: "system",
                createdAt: Date(),
                updatedAt: Date()
            ),
            ScheduleEntry(
                id: UUID().uuidString,
                type: .maintenance,
                title: "Oil Change - FL-101",
                description: "Scheduled maintenance",
                startDate: tomorrow.addingTimeInterval(14 * 3600),
                endDate: tomorrow.addingTimeInterval(15.5 * 3600),
                status: .scheduled,
                priority: .high,
                participants: [],
                location: ScheduleLocation(
                    name: "Main Garage",
                    address: "123 Fleet St",
                    coordinates: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060)
                ),
                recurrence: nil,
                reminders: [
                    Reminder(id: UUID().uuidString, type: .notification, minutesBefore: 60, sent: false)
                ],
                attachments: [],
                metadata: ["vehicleId": "vehicle-001", "vehicleNumber": "FL-101", "maintenanceType": "routine"],
                createdBy: "system",
                createdAt: Date(),
                updatedAt: Date()
            )
        ]

        saveSchedulesToCache()
    }
}

// MARK: - CLLocationCoordinate2D Codable Extension

extension CLLocationCoordinate2D: Codable {
    enum CodingKeys: String, CodingKey {
        case latitude
        case longitude
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let latitude = try container.decode(Double.self, forKey: .latitude)
        let longitude = try container.decode(Double.self, forKey: .longitude)
        self.init(latitude: latitude, longitude: longitude)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
    }
}
