import Foundation
import EventKit
import Combine

@MainActor
class CalendarSyncService: ObservableObject {
    static let shared = CalendarSyncService()

    @Published var syncEnabled: Bool = false
    @Published var lastSyncDate: Date?
    @Published var syncStatus: SyncStatus = .idle
    @Published var conflicts: [ConflictResolution] = []

    private let eventStore = EKEventStore()
    private var calendarIdentifier: String?
    private let syncKey = "com.fleet.calendar.sync"

    enum SyncStatus {
        case idle
        case syncing
        case success
        case failed(Error)
    }

    private init() {
        loadSyncSettings()
    }

    // MARK: - Authorization

    func requestCalendarAccess() async throws -> Bool {
        if #available(iOS 17.0, *) {
            let status = try await eventStore.requestFullAccessToEvents()
            return status
        } else {
            return try await withCheckedThrowingContinuation { continuation in
                eventStore.requestAccess(to: .event) { granted, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                    } else {
                        continuation.resume(returning: granted)
                    }
                }
            }
        }
    }

    func checkAuthorizationStatus() -> EKAuthorizationStatus {
        if #available(iOS 17.0, *) {
            return EKEventStore.authorizationStatus(for: .event)
        } else {
            return EKEventStore.authorizationStatus(for: .event)
        }
    }

    // MARK: - Calendar Management

    func getOrCreateFleetCalendar() async throws -> EKCalendar {
        // Check if we have a saved calendar identifier
        if let identifier = calendarIdentifier,
           let calendar = eventStore.calendar(withIdentifier: identifier) {
            return calendar
        }

        // Search for existing Fleet calendar
        let calendars = eventStore.calendars(for: .event)
        if let fleetCalendar = calendars.first(where: { $0.title == "Fleet Management" }) {
            calendarIdentifier = fleetCalendar.calendarIdentifier
            saveSyncSettings()
            return fleetCalendar
        }

        // Create new calendar
        let newCalendar = EKCalendar(for: .event, eventStore: eventStore)
        newCalendar.title = "Fleet Management"
        newCalendar.cgColor = UIColor.blue.cgColor

        if let source = eventStore.defaultCalendarForNewEvents?.source {
            newCalendar.source = source
        } else if let source = eventStore.sources.first(where: { $0.sourceType == .calDAV || $0.sourceType == .local }) {
            newCalendar.source = source
        } else {
            throw CalendarError.noSourceAvailable
        }

        try eventStore.saveCalendar(newCalendar, commit: true)
        calendarIdentifier = newCalendar.calendarIdentifier
        saveSyncSettings()

        return newCalendar
    }

    // MARK: - Export

    func exportSchedule(_ schedule: ScheduleEntry) async throws {
        guard syncEnabled else {
            throw CalendarError.syncDisabled
        }

        let authorized = try await requestCalendarAccess()
        guard authorized else {
            throw CalendarError.accessDenied
        }

        let calendar = try await getOrCreateFleetCalendar()
        let event = try createEvent(from: schedule, calendar: calendar)

        try eventStore.save(event, span: .thisEvent, commit: true)
    }

    func exportSchedules(_ schedules: [ScheduleEntry]) async throws {
        syncStatus = .syncing

        do {
            let authorized = try await requestCalendarAccess()
            guard authorized else {
                throw CalendarError.accessDenied
            }

            let calendar = try await getOrCreateFleetCalendar()

            // Remove existing events
            try await clearCalendarEvents(calendar)

            // Add new events
            for schedule in schedules {
                let event = try createEvent(from: schedule, calendar: calendar)
                try eventStore.save(event, span: .thisEvent, commit: false)
            }

            try eventStore.commit()

            lastSyncDate = Date()
            syncStatus = .success
            saveSyncSettings()

        } catch {
            syncStatus = .failed(error)
            throw error
        }
    }

    // MARK: - Import

    func importFromCalendar() async throws -> [ScheduleEntry] {
        let authorized = try await requestCalendarAccess()
        guard authorized else {
            throw CalendarError.accessDenied
        }

        let calendar = try await getOrCreateFleetCalendar()
        let now = Date()
        let oneMonthLater = Calendar.current.date(byAdding: .month, value: 1, to: now) ?? now

        let predicate = eventStore.predicateForEvents(
            withStart: now,
            end: oneMonthLater,
            calendars: [calendar]
        )

        let events = eventStore.events(matching: predicate)

        return events.compactMap { event in
            try? createScheduleEntry(from: event)
        }
    }

    // MARK: - Sync

    func syncWithCalendar(_ schedules: [ScheduleEntry]) async throws {
        syncStatus = .syncing
        conflicts.removeAll()

        do {
            // Export to calendar
            try await exportSchedules(schedules)

            // Import from calendar to check for conflicts
            let calendarSchedules = try await importFromCalendar()

            // Detect conflicts
            detectConflicts(local: schedules, remote: calendarSchedules)

            syncStatus = .success
        } catch {
            syncStatus = .failed(error)
            throw error
        }
    }

    func enableSync() async throws {
        let authorized = try await requestCalendarAccess()
        guard authorized else {
            throw CalendarError.accessDenied
        }

        _ = try await getOrCreateFleetCalendar()
        syncEnabled = true
        saveSyncSettings()
    }

    func disableSync() {
        syncEnabled = false
        saveSyncSettings()
    }

    // MARK: - Conflict Detection

    private func detectConflicts(local: [ScheduleEntry], remote: [ScheduleEntry]) {
        var foundConflicts: [ConflictResolution] = []

        for localEntry in local {
            if let remoteEntry = remote.first(where: { $0.id == localEntry.id }) {
                // Check if entries differ
                if localEntry.updatedAt != remoteEntry.updatedAt {
                    let conflict = ConflictResolution(
                        id: UUID().uuidString,
                        localEntry: localEntry,
                        remoteEntry: remoteEntry,
                        resolution: .manual,
                        resolvedAt: nil
                    )
                    foundConflicts.append(conflict)
                }
            }
        }

        conflicts = foundConflicts
    }

    // MARK: - Helpers

    private func createEvent(from schedule: ScheduleEntry, calendar: EKCalendar) throws -> EKEvent {
        let event = EKEvent(eventStore: eventStore)
        event.title = schedule.title
        event.notes = schedule.description
        event.startDate = schedule.startDate
        event.endDate = schedule.endDate
        event.calendar = calendar

        if let location = schedule.location {
            event.location = location.name

            if #available(iOS 9.0, *) {
                let structuredLocation = EKStructuredLocation(title: location.name)
                structuredLocation.geoLocation = CLLocation(
                    latitude: location.latitude,
                    longitude: location.longitude
                )
                event.structuredLocation = structuredLocation
            }
        }

        // Add alarms for reminders
        for reminder in schedule.reminders {
            let alarm = EKAlarm(relativeOffset: -Double(reminder.minutesBefore * 60))
            event.addAlarm(alarm)
        }

        // Handle recurrence
        if let recurrence = schedule.recurrence {
            event.recurrenceRules = [createRecurrenceRule(from: recurrence)]
        }

        // Store schedule ID in notes
        let metadata = "Fleet Schedule ID: \(schedule.id)"
        event.notes = [schedule.description, metadata]
            .compactMap { $0 }
            .joined(separator: "\n\n")

        return event
    }

    private func createScheduleEntry(from event: EKEvent) throws -> ScheduleEntry {
        // Extract schedule ID from notes
        let scheduleId = extractScheduleId(from: event.notes) ?? event.eventIdentifier

        let location: ScheduleLocation?
        if let structuredLocation = event.structuredLocation,
           let geoLocation = structuredLocation.geoLocation {
            location = ScheduleLocation(
                name: structuredLocation.title,
                address: "",
                coordinates: geoLocation.coordinate
            )
        } else if let locationString = event.location {
            location = ScheduleLocation(
                name: locationString,
                address: locationString,
                coordinates: CLLocationCoordinate2D(latitude: 0, longitude: 0)
            )
        } else {
            location = nil
        }

        let reminders = event.alarms?.map { alarm in
            Reminder(
                id: UUID().uuidString,
                type: .notification,
                minutesBefore: Int(-alarm.relativeOffset / 60),
                sent: false
            )
        } ?? []

        return ScheduleEntry(
            id: scheduleId,
            type: .meeting, // Default type, would need to be stored in metadata
            title: event.title ?? "Untitled",
            description: cleanDescription(event.notes),
            startDate: event.startDate,
            endDate: event.endDate,
            status: .scheduled,
            priority: .normal,
            participants: [],
            location: location,
            recurrence: event.recurrenceRules?.first.map { createRecurrenceRule(from: $0) },
            reminders: reminders,
            attachments: [],
            metadata: [:],
            createdBy: "calendar",
            createdAt: event.creationDate ?? Date(),
            updatedAt: event.lastModifiedDate ?? Date()
        )
    }

    private func createRecurrenceRule(from schedule: RecurrenceRule) -> EKRecurrenceRule {
        let frequency: EKRecurrenceFrequency
        switch schedule.frequency {
        case .daily: frequency = .daily
        case .weekly: frequency = .weekly
        case .monthly: frequency = .monthly
        case .yearly: frequency = .yearly
        }

        let end: EKRecurrenceEnd?
        if let endDate = schedule.endDate {
            end = EKRecurrenceEnd(end: endDate)
        } else if let count = schedule.count {
            end = EKRecurrenceEnd(occurrenceCount: count)
        } else {
            end = nil
        }

        return EKRecurrenceRule(
            recurrenceWith: frequency,
            interval: schedule.interval,
            end: end
        )
    }

    private func createRecurrenceRule(from ekRule: EKRecurrenceRule) -> RecurrenceRule {
        let frequency: RecurrenceFrequency
        switch ekRule.frequency {
        case .daily: frequency = .daily
        case .weekly: frequency = .weekly
        case .monthly: frequency = .monthly
        case .yearly: frequency = .yearly
        @unknown default: frequency = .daily
        }

        let endDate = ekRule.recurrenceEnd?.endDate
        let count = ekRule.recurrenceEnd?.occurrenceCount

        return RecurrenceRule(
            frequency: frequency,
            interval: ekRule.interval,
            endDate: endDate,
            count: count != NSNotFound ? count : nil,
            daysOfWeek: nil,
            daysOfMonth: nil
        )
    }

    private func clearCalendarEvents(_ calendar: EKCalendar) async throws {
        let now = Date()
        let oneYearLater = Calendar.current.date(byAdding: .year, value: 1, to: now) ?? now

        let predicate = eventStore.predicateForEvents(
            withStart: now,
            end: oneYearLater,
            calendars: [calendar]
        )

        let events = eventStore.events(matching: predicate)

        for event in events {
            try eventStore.remove(event, span: .thisEvent, commit: false)
        }

        try eventStore.commit()
    }

    private func extractScheduleId(from notes: String?) -> String? {
        guard let notes = notes else { return nil }

        let pattern = "Fleet Schedule ID: ([a-zA-Z0-9-]+)"
        if let range = notes.range(of: pattern, options: .regularExpression) {
            let idString = String(notes[range])
            return idString.replacingOccurrences(of: "Fleet Schedule ID: ", with: "")
        }

        return nil
    }

    private func cleanDescription(_ notes: String?) -> String? {
        guard let notes = notes else { return nil }

        let pattern = "Fleet Schedule ID: [a-zA-Z0-9-]+"
        return notes.replacingOccurrences(of: pattern, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Persistence

    private func loadSyncSettings() {
        if let data = UserDefaults.standard.data(forKey: syncKey),
           let settings = try? JSONDecoder().decode(SyncSettings.self, from: data) {
            syncEnabled = settings.enabled
            calendarIdentifier = settings.calendarIdentifier
            lastSyncDate = settings.lastSyncDate
        }
    }

    private func saveSyncSettings() {
        let settings = SyncSettings(
            enabled: syncEnabled,
            calendarIdentifier: calendarIdentifier,
            lastSyncDate: lastSyncDate
        )

        if let data = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(data, forKey: syncKey)
        }
    }
}

// MARK: - Supporting Types

struct SyncSettings: Codable {
    var enabled: Bool
    var calendarIdentifier: String?
    var lastSyncDate: Date?
}

enum CalendarError: LocalizedError {
    case accessDenied
    case syncDisabled
    case noSourceAvailable
    case invalidEvent

    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "Calendar access denied. Please enable in Settings."
        case .syncDisabled:
            return "Calendar sync is disabled. Enable it in settings."
        case .noSourceAvailable:
            return "No calendar source available."
        case .invalidEvent:
            return "Invalid event data."
        }
    }
}
