//
//  MaintenanceViewModelCalendarExtensions.swift
//  Fleet Manager - iOS Native App
//
//  Calendar-specific extensions for MaintenanceViewModel
//  Features: Date-based queries, recurring maintenance, reminders, conflict detection
//

import Foundation
import UserNotifications
import SwiftUI

// MARK: - MaintenanceViewModel Calendar Extensions

extension MaintenanceViewModel {

    // MARK: - Date-Based Queries

    /// Get all maintenance records for a specific date
    func getMaintenanceByDate(_ date: Date, filters: MaintenanceFilters? = nil) -> [MaintenanceRecord] {
        let calendar = Calendar.current

        var records = allRecords.filter { record in
            calendar.isDate(record.scheduledDate, inSameDayAs: date)
        }

        // Apply filters if provided
        if let filters = filters {
            records = applyFilters(to: records, filters: filters)
        }

        // Sort by time
        return records.sorted { $0.scheduledDate < $1.scheduledDate }
    }

    /// Get maintenance records within a date range
    func getMaintenanceByDateRange(start: Date, end: Date, filters: MaintenanceFilters? = nil) -> [MaintenanceRecord] {
        var records = allRecords.filter { record in
            record.scheduledDate >= start && record.scheduledDate <= end
        }

        // Apply filters if provided
        if let filters = filters {
            records = applyFilters(to: records, filters: filters)
        }

        return records.sorted { $0.scheduledDate < $1.scheduledDate }
    }

    /// Get maintenance records for the current week
    func getMaintenanceForCurrentWeek(filters: MaintenanceFilters? = nil) -> [MaintenanceRecord] {
        let calendar = Calendar.current
        let now = Date()

        guard let weekInterval = calendar.dateInterval(of: .weekOfYear, for: now) else {
            return []
        }

        return getMaintenanceByDateRange(start: weekInterval.start, end: weekInterval.end, filters: filters)
    }

    /// Get maintenance records for the current month
    func getMaintenanceForCurrentMonth(filters: MaintenanceFilters? = nil) -> [MaintenanceRecord] {
        let calendar = Calendar.current
        let now = Date()

        guard let monthInterval = calendar.dateInterval(of: .month, for: now) else {
            return []
        }

        return getMaintenanceByDateRange(start: monthInterval.start, end: monthInterval.end, filters: filters)
    }

    /// Get upcoming maintenance (next N days)
    func getUpcomingMaintenance(days: Int = 7, filters: MaintenanceFilters? = nil) -> [MaintenanceRecord] {
        let now = Date()
        let endDate = Calendar.current.date(byAdding: .day, value: days, to: now) ?? now

        return getMaintenanceByDateRange(start: now, end: endDate, filters: filters)
            .filter { $0.status == .scheduled }
    }

    // MARK: - Filter Application

    private func applyFilters(to records: [MaintenanceRecord], filters: MaintenanceFilters) -> [MaintenanceRecord] {
        var filtered = records

        if let vehicleId = filters.vehicleId {
            filtered = filtered.filter { $0.vehicleId == vehicleId }
        }

        if let type = filters.type {
            filtered = filtered.filter { $0.type == type }
        }

        if let status = filters.status {
            filtered = filtered.filter { $0.status == status }
        }

        return filtered
    }

    // MARK: - Recurring Maintenance

    /// Schedule recurring maintenance with reminders
    func scheduleRecurringMaintenance(
        vehicleId: String,
        type: MaintenanceType,
        category: MaintenanceCategory,
        priority: MaintenancePriority = .normal,
        description: String,
        cost: Double? = nil,
        provider: String? = nil,
        location: String? = nil,
        notes: String? = nil,
        parts: [MaintenancePart]? = nil,
        recurrence: RecurrenceRule,
        startDate: Date,
        reminders: [MaintenanceReminder] = []
    ) {
        guard let vehicle = vehicles.first(where: { $0.id == vehicleId }) else {
            print("Vehicle not found: \(vehicleId)")
            return
        }

        let occurrences = generateRecurrenceOccurrences(
            startDate: startDate,
            recurrence: recurrence,
            maxOccurrences: 52 // Limit to 1 year worth of weekly occurrences
        )

        for (index, occurrenceDate) in occurrences.enumerated() {
            let record = MaintenanceRecord(
                id: UUID().uuidString,
                vehicleId: vehicleId,
                vehicleNumber: vehicle.number,
                type: type,
                category: category,
                scheduledDate: occurrenceDate,
                completedDate: nil,
                status: .scheduled,
                priority: priority,
                description: "\(description) (Recurring \(index + 1)/\(occurrences.count))",
                cost: cost,
                mileageAtService: vehicle.mileage,
                hoursAtService: vehicle.hoursUsed,
                servicedBy: nil,
                serviceProvider: provider,
                location: location,
                notes: notes,
                parts: parts,
                attachments: nil,
                nextServiceMileage: nil,
                nextServiceDate: index < occurrences.count - 1 ? occurrences[index + 1] : nil
            )

            allRecords.insert(record, at: 0)

            // Schedule reminders for this occurrence
            for reminder in reminders {
                scheduleReminder(for: record, reminder: reminder)
            }
        }

        filterRecords()
        updateStatistics()

        print("Scheduled \(occurrences.count) recurring maintenance events")
    }

    /// Generate occurrence dates based on recurrence rule
    private func generateRecurrenceOccurrences(
        startDate: Date,
        recurrence: RecurrenceRule,
        maxOccurrences: Int
    ) -> [Date] {
        var occurrences: [Date] = []
        var currentDate = startDate
        let calendar = Calendar.current

        var count = 0
        let maxCount = recurrence.count ?? maxOccurrences

        while count < maxCount {
            occurrences.append(currentDate)
            count += 1

            // Calculate next occurrence
            switch recurrence.frequency {
            case .daily:
                guard let nextDate = calendar.date(byAdding: .day, value: recurrence.interval, to: currentDate) else {
                    break
                }
                currentDate = nextDate

            case .weekly:
                guard let nextDate = calendar.date(byAdding: .weekOfYear, value: recurrence.interval, to: currentDate) else {
                    break
                }
                currentDate = nextDate

            case .monthly:
                guard let nextDate = calendar.date(byAdding: .month, value: recurrence.interval, to: currentDate) else {
                    break
                }
                currentDate = nextDate

            case .yearly:
                guard let nextDate = calendar.date(byAdding: .year, value: recurrence.interval, to: currentDate) else {
                    break
                }
                currentDate = nextDate
            }

            // Check end date condition
            if let endDate = recurrence.endDate, currentDate > endDate {
                break
            }
        }

        return occurrences
    }

    // MARK: - Reminder Management

    /// Schedule a reminder for a maintenance record
    func scheduleReminder(for record: MaintenanceRecord, reminder: MaintenanceReminder) {
        Task {
            let authorized = await NotificationService.shared.requestAuthorization()
            guard authorized else {
                print("Notification permission denied")
                return
            }

            let reminderDate = Calendar.current.date(
                byAdding: .minute,
                value: -reminder.minutesBefore,
                to: record.scheduledDate
            ) ?? record.scheduledDate

            switch reminder.type {
            case .notification:
                scheduleNotificationReminder(for: record, at: reminderDate, reminder: reminder)
            case .email:
                scheduleEmailReminder(for: record, at: reminderDate, reminder: reminder)
            case .sms:
                scheduleSMSReminder(for: record, at: reminderDate, reminder: reminder)
            }
        }
    }

    private func scheduleNotificationReminder(for record: MaintenanceRecord, at date: Date, reminder: MaintenanceReminder) {
        let content = UNMutableNotificationContent()
        content.title = "Maintenance Reminder"
        content.body = "\(record.vehicleNumber ?? "Vehicle") - \(record.type.rawValue) scheduled for \(record.scheduledDate.formatted(date: .abbreviated, time: .shortened))"
        content.sound = .default
        content.categoryIdentifier = "MAINTENANCE_REMINDER"
        content.userInfo = [
            "maintenanceId": record.id,
            "vehicleId": record.vehicleId,
            "type": record.type.rawValue
        ]

        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)

        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(
            identifier: "maintenance-\(record.id)-reminder-\(reminder.id)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            } else {
                print("Scheduled notification for maintenance \(record.id)")
            }
        }
    }

    private func scheduleEmailReminder(for record: MaintenanceRecord, at date: Date, reminder: MaintenanceReminder) {
        // Implementation would integrate with email service
        print("Email reminder scheduled for \(date)")
    }

    private func scheduleSMSReminder(for record: MaintenanceRecord, at date: Date, reminder: MaintenanceReminder) {
        // Implementation would integrate with SMS service
        print("SMS reminder scheduled for \(date)")
    }

    /// Cancel all reminders for a maintenance record
    func cancelReminders(for recordId: String) {
        UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
            let identifiersToRemove = requests
                .filter { $0.identifier.contains("maintenance-\(recordId)-reminder") }
                .map { $0.identifier }

            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiersToRemove)
            print("Cancelled \(identifiersToRemove.count) reminders for maintenance \(recordId)")
        }
    }

    // MARK: - Conflict Detection

    /// Detect scheduling conflicts for a vehicle
    func detectConflicts(
        vehicleId: String,
        scheduledDate: Date,
        duration: TimeInterval = 2 * 3600, // 2 hours default
        excludeId: String? = nil
    ) -> [MaintenanceRecord] {
        let calendar = Calendar.current
        let endDate = scheduledDate.addingTimeInterval(duration)

        return allRecords.filter { record in
            // Exclude the record being edited
            if let excludeId = excludeId, record.id == excludeId {
                return false
            }

            // Only check for same vehicle
            guard record.vehicleId == vehicleId else {
                return false
            }

            // Only check non-completed/cancelled records
            guard record.status != .completed && record.status != .cancelled else {
                return false
            }

            // Check for time overlap
            let recordEnd = record.scheduledDate.addingTimeInterval(duration)
            return (scheduledDate < recordEnd && endDate > record.scheduledDate)
        }
    }

    /// Check if a time slot is available for a vehicle
    func isTimeSlotAvailable(
        vehicleId: String,
        scheduledDate: Date,
        duration: TimeInterval = 2 * 3600,
        excludeId: String? = nil
    ) -> Bool {
        let conflicts = detectConflicts(
            vehicleId: vehicleId,
            scheduledDate: scheduledDate,
            duration: duration,
            excludeId: excludeId
        )
        return conflicts.isEmpty
    }

    /// Suggest alternative time slots when conflicts exist
    func suggestAlternativeTimeSlots(
        vehicleId: String,
        preferredDate: Date,
        duration: TimeInterval = 2 * 3600,
        numberOfSuggestions: Int = 3
    ) -> [Date] {
        var suggestions: [Date] = []
        let calendar = Calendar.current

        // Try different time slots on the same day
        let startOfDay = calendar.startOfDay(for: preferredDate)
        let workHours = [8, 10, 13, 15] // 8am, 10am, 1pm, 3pm

        for hour in workHours {
            guard let timeSlot = calendar.date(byAdding: .hour, value: hour, to: startOfDay) else {
                continue
            }

            if isTimeSlotAvailable(vehicleId: vehicleId, scheduledDate: timeSlot, duration: duration) {
                suggestions.append(timeSlot)
                if suggestions.count >= numberOfSuggestions {
                    return suggestions
                }
            }
        }

        // Try next few days if not enough suggestions
        for dayOffset in 1...7 {
            guard let nextDay = calendar.date(byAdding: .day, value: dayOffset, to: preferredDate) else {
                continue
            }

            for hour in workHours {
                guard let timeSlot = calendar.date(byAdding: .hour, value: hour, to: calendar.startOfDay(for: nextDay)) else {
                    continue
                }

                if isTimeSlotAvailable(vehicleId: vehicleId, scheduledDate: timeSlot, duration: duration) {
                    suggestions.append(timeSlot)
                    if suggestions.count >= numberOfSuggestions {
                        return suggestions
                    }
                }
            }
        }

        return suggestions
    }

    // MARK: - Calendar Export

    /// Export maintenance schedule to calendar format (iCal)
    func exportToCalendar(records: [MaintenanceRecord]) -> String {
        var icsContent = """
        BEGIN:VCALENDAR
        VERSION:2.0
        PRODID:-//Fleet Manager//Maintenance Calendar//EN
        CALSCALE:GREGORIAN
        METHOD:PUBLISH
        X-WR-CALNAME:Fleet Maintenance
        X-WR-TIMEZONE:UTC
        X-WR-CALDESC:Fleet vehicle maintenance schedule

        """

        for record in records {
            icsContent += generateICalEvent(for: record)
        }

        icsContent += "END:VCALENDAR"
        return icsContent
    }

    private func generateICalEvent(for record: MaintenanceRecord) -> String {
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate, .withTime, .withColonSeparatorInTime]

        let startDate = dateFormatter.string(from: record.scheduledDate).replacingOccurrences(of: ":", with: "").replacingOccurrences(of: "-", with: "")
        let endDate = dateFormatter.string(from: record.scheduledDate.addingTimeInterval(2 * 3600)).replacingOccurrences(of: ":", with: "").replacingOccurrences(of: "-", with: "")

        return """
        BEGIN:VEVENT
        UID:\(record.id)@fleetmanager.com
        DTSTAMP:\(startDate)
        DTSTART:\(startDate)
        DTEND:\(endDate)
        SUMMARY:\(record.vehicleNumber ?? "Vehicle") - \(record.type.rawValue)
        DESCRIPTION:\(record.description)
        LOCATION:\(record.location ?? "")
        STATUS:CONFIRMED
        PRIORITY:\(priorityToICalPriority(record.priority))
        END:VEVENT

        """
    }

    private func priorityToICalPriority(_ priority: MaintenancePriority) -> Int {
        switch priority {
        case .critical: return 1
        case .urgent: return 2
        case .high: return 3
        case .normal: return 5
        case .low: return 7
        }
    }

    // MARK: - Helper Methods

    /// Add a new maintenance record with conflict checking
    func addMaintenanceRecord(_ record: MaintenanceRecord, checkConflicts: Bool = true) {
        if checkConflicts {
            let conflicts = detectConflicts(
                vehicleId: record.vehicleId,
                scheduledDate: record.scheduledDate
            )

            if !conflicts.isEmpty {
                print("Warning: \(conflicts.count) conflicts detected for this maintenance")
            }
        }

        allRecords.insert(record, at: 0)
        filterRecords()
        updateStatistics()
    }

    /// Update maintenance record with conflict checking
    func updateMaintenanceRecord(_ record: MaintenanceRecord, checkConflicts: Bool = true) {
        guard let index = allRecords.firstIndex(where: { $0.id == record.id }) else {
            return
        }

        if checkConflicts {
            let conflicts = detectConflicts(
                vehicleId: record.vehicleId,
                scheduledDate: record.scheduledDate,
                excludeId: record.id
            )

            if !conflicts.isEmpty {
                print("Warning: \(conflicts.count) conflicts detected for this maintenance")
            }
        }

        allRecords[index] = record
        filterRecords()
        updateStatistics()
    }

    /// Get maintenance statistics for a date range
    func getMaintenanceStats(from startDate: Date, to endDate: Date) -> MaintenanceStats {
        let records = getMaintenanceByDateRange(start: startDate, end: endDate)

        let totalCost = records.compactMap { $0.cost }.reduce(0, +)
        let completedCount = records.filter { $0.status == .completed }.count
        let scheduledCount = records.filter { $0.status == .scheduled }.count
        let overdueCount = records.filter { $0.status == .overdue }.count

        var typeBreakdown: [MaintenanceType: Int] = [:]
        for type in MaintenanceType.allCases {
            typeBreakdown[type] = records.filter { $0.type == type }.count
        }

        return MaintenanceStats(
            totalRecords: records.count,
            completedCount: completedCount,
            scheduledCount: scheduledCount,
            overdueCount: overdueCount,
            totalCost: totalCost,
            averageCost: records.isEmpty ? 0 : totalCost / Double(records.count),
            typeBreakdown: typeBreakdown
        )
    }
}

// MARK: - Supporting Types

struct MaintenanceStats {
    let totalRecords: Int
    let completedCount: Int
    let scheduledCount: Int
    let overdueCount: Int
    let totalCost: Double
    let averageCost: Double
    let typeBreakdown: [MaintenanceType: Int]
}

// MARK: - Notification Service Placeholder

class NotificationService {
    static let shared = NotificationService()

    func requestAuthorization() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            print("Error requesting notification authorization: \(error)")
            return false
        }
    }

    func scheduleMaintenanceReminder(for record: MaintenanceRecord, daysBefore: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Maintenance Reminder"
        content.body = "\(record.vehicleNumber ?? "Vehicle") - \(record.type.rawValue) scheduled"
        content.sound = .default

        let calendar = Calendar.current
        guard let triggerDate = calendar.date(byAdding: .day, value: -daysBefore, to: record.scheduledDate) else {
            return
        }

        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(
            identifier: "maintenance-\(record.id)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    func cancelMaintenanceNotification(maintenanceId: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["maintenance-\(maintenanceId)"])
    }
}
