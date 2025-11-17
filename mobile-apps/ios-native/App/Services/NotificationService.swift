/**
 * NotificationService.swift
 * Fleet Management Notification Service
 *
 * Handles local notifications for:
 * - Maintenance reminders
 * - Low fuel alerts
 * - Service due notifications
 * - Trip completion alerts
 */

import Foundation
import UserNotifications
import UIKit

@MainActor
class NotificationService: NSObject {
    static let shared = NotificationService()

    private let notificationCenter = UNUserNotificationCenter.current()
    @Published var isAuthorized = false
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined

    // Notification categories
    private let maintenanceCategory = "MAINTENANCE"
    private let lowFuelCategory = "LOW_FUEL"
    private let serviceCategory = "SERVICE_DUE"
    private let tripCategory = "TRIP_COMPLETE"

    override init() {
        super.init()
        notificationCenter.delegate = self
        setupNotificationCategories()
    }

    // MARK: - Authorization

    func requestAuthorization() async -> Bool {
        do {
            let granted = try await notificationCenter.requestAuthorization(options: [.alert, .sound, .badge])
            await updateAuthorizationStatus()

            if granted {
                print("✅ Notification permission granted")
            } else {
                print("⚠️ Notification permission denied")
            }

            return granted
        } catch {
            print("❌ Error requesting notification authorization: \(error.localizedDescription)")
            return false
        }
    }

    func checkAuthorizationStatus() async {
        await updateAuthorizationStatus()
    }

    private func updateAuthorizationStatus() async {
        let settings = await notificationCenter.notificationSettings()
        authorizationStatus = settings.authorizationStatus
        isAuthorized = settings.authorizationStatus == .authorized
    }

    // MARK: - Setup Notification Categories

    private func setupNotificationCategories() {
        // Maintenance category with actions
        let viewAction = UNNotificationAction(
            identifier: "VIEW_MAINTENANCE",
            title: "View Details",
            options: [.foreground]
        )

        let snoozeAction = UNNotificationAction(
            identifier: "SNOOZE_MAINTENANCE",
            title: "Remind Later",
            options: []
        )

        let maintenanceCategoryObj = UNNotificationCategory(
            identifier: maintenanceCategory,
            actions: [viewAction, snoozeAction],
            intentIdentifiers: [],
            options: []
        )

        // Low fuel category with actions
        let refuelAction = UNNotificationAction(
            identifier: "REFUEL_ACTION",
            title: "Mark as Refueled",
            options: []
        )

        let lowFuelCategoryObj = UNNotificationCategory(
            identifier: lowFuelCategory,
            actions: [refuelAction],
            intentIdentifiers: [],
            options: []
        )

        // Service due category
        let scheduleAction = UNNotificationAction(
            identifier: "SCHEDULE_SERVICE",
            title: "Schedule Service",
            options: [.foreground]
        )

        let serviceCategoryObj = UNNotificationCategory(
            identifier: serviceCategory,
            actions: [scheduleAction],
            intentIdentifiers: [],
            options: []
        )

        // Register categories
        notificationCenter.setNotificationCategories([
            maintenanceCategoryObj,
            lowFuelCategoryObj,
            serviceCategoryObj
        ])
    }

    // MARK: - Schedule Maintenance Reminder

    func scheduleMaintenanceReminder(for record: MaintenanceRecord, daysBefore: Int = 1) {
        guard let scheduledDate = record.scheduledDate else {
            print("⚠️ Cannot schedule notification: no scheduled date")
            return
        }

        // Only schedule for future dates
        guard scheduledDate > Date() else {
            print("⚠️ Scheduled date is in the past")
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Maintenance Due Soon"
        content.body = "\(record.type.rawValue) scheduled for vehicle \(record.vehicleNumber ?? record.vehicleId) on \(formatDate(scheduledDate))"
        content.sound = .default
        content.categoryIdentifier = maintenanceCategory

        // Add metadata
        content.userInfo = [
            "type": "maintenance",
            "maintenanceId": record.id,
            "vehicleId": record.vehicleId
        ]

        // Add badge
        content.badge = 1

        // Schedule notification daysBefore the maintenance date
        if let triggerDate = Calendar.current.date(byAdding: .day, value: -daysBefore, to: scheduledDate) {
            // Only schedule if trigger date is in the future
            guard triggerDate > Date() else {
                print("⚠️ Trigger date is in the past")
                return
            }

            let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

            let identifier = "maintenance_\(record.id)"
            let request = UNNotificationRequest(
                identifier: identifier,
                content: content,
                trigger: trigger
            )

            notificationCenter.add(request) { error in
                if let error = error {
                    print("❌ Error scheduling maintenance notification: \(error.localizedDescription)")
                } else {
                    print("✅ Scheduled maintenance notification for \(formatDate(triggerDate))")
                }
            }
        }
    }

    // MARK: - Schedule Low Fuel Alert

    func scheduleLowFuelAlert(for vehicle: Vehicle) {
        // Only alert if fuel is critically low (< 25%)
        guard vehicle.fuelLevel < 0.25 else {
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Low Fuel Alert"
        content.body = "Vehicle \(vehicle.number) (\(vehicle.make) \(vehicle.model)) has low fuel: \(vehicle.fuelLevelPercentage)%"
        content.sound = .defaultCritical
        content.categoryIdentifier = lowFuelCategory

        // Add metadata
        content.userInfo = [
            "type": "lowFuel",
            "vehicleId": vehicle.id,
            "fuelLevel": vehicle.fuelLevel
        ]

        // Critical alerts for very low fuel (< 10%)
        if vehicle.fuelLevel < 0.10 {
            content.interruptionLevel = .critical
            content.badge = 1
        }

        // Trigger immediately
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)

        let identifier = "lowfuel_\(vehicle.id)"
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )

        notificationCenter.add(request) { error in
            if let error = error {
                print("❌ Error scheduling low fuel notification: \(error.localizedDescription)")
            } else {
                print("✅ Scheduled low fuel alert for vehicle \(vehicle.number)")
            }
        }
    }

    // MARK: - Schedule Service Due Alert

    func scheduleServiceDueAlert(for vehicle: Vehicle, serviceName: String, dueDate: Date) {
        guard dueDate > Date() else {
            print("⚠️ Service due date is in the past")
            return
        }

        let content = UNMutableNotificationContent()
        content.title = "Service Due"
        content.body = "\(serviceName) is due for vehicle \(vehicle.number) on \(formatDate(dueDate))"
        content.sound = .default
        content.categoryIdentifier = serviceCategory

        // Add metadata
        content.userInfo = [
            "type": "serviceDue",
            "vehicleId": vehicle.id,
            "serviceName": serviceName,
            "dueDate": dueDate.timeIntervalSince1970
        ]

        content.badge = 1

        // Schedule 3 days before due date
        if let triggerDate = Calendar.current.date(byAdding: .day, value: -3, to: dueDate) {
            guard triggerDate > Date() else {
                print("⚠️ Trigger date is in the past")
                return
            }

            let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

            let identifier = "service_\(vehicle.id)_\(serviceName.replacingOccurrences(of: " ", with: "_"))"
            let request = UNNotificationRequest(
                identifier: identifier,
                content: content,
                trigger: trigger
            )

            notificationCenter.add(request) { error in
                if let error = error {
                    print("❌ Error scheduling service due notification: \(error.localizedDescription)")
                } else {
                    print("✅ Scheduled service due alert for \(formatDate(triggerDate))")
                }
            }
        }
    }

    // MARK: - Schedule Trip Completion Alert

    func scheduleTripCompletionAlert(vehicleNumber: String, distance: Double, duration: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = "Trip Completed"
        content.body = "Vehicle \(vehicleNumber) completed a trip of \(String(format: "%.1f", distance)) miles in \(formatDuration(duration))"
        content.sound = .default
        content.categoryIdentifier = tripCategory

        // Add metadata
        content.userInfo = [
            "type": "tripComplete",
            "vehicleNumber": vehicleNumber,
            "distance": distance,
            "duration": duration
        ]

        // Trigger immediately
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)

        let identifier = "trip_\(vehicleNumber)_\(Date().timeIntervalSince1970)"
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )

        notificationCenter.add(request) { error in
            if let error = error {
                print("❌ Error scheduling trip notification: \(error.localizedDescription)")
            } else {
                print("✅ Scheduled trip completion notification")
            }
        }
    }

    // MARK: - Cancel Notifications

    func cancelNotification(identifier: String) {
        notificationCenter.removePendingNotificationRequests(withIdentifiers: [identifier])
        print("✅ Cancelled notification: \(identifier)")
    }

    func cancelMaintenanceNotification(maintenanceId: String) {
        let identifier = "maintenance_\(maintenanceId)"
        cancelNotification(identifier: identifier)
    }

    func cancelLowFuelNotification(vehicleId: String) {
        let identifier = "lowfuel_\(vehicleId)"
        cancelNotification(identifier: identifier)
    }

    func cancelAllNotifications() {
        notificationCenter.removeAllPendingNotificationRequests()
        print("✅ Cancelled all pending notifications")
    }

    // MARK: - Badge Management

    func setBadgeCount(_ count: Int) {
        Task { @MainActor in
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }

    func clearBadge() {
        setBadgeCount(0)
    }

    // MARK: - Query Pending Notifications

    func getPendingNotifications() async -> [UNNotificationRequest] {
        return await notificationCenter.pendingNotificationRequests()
    }

    func getPendingNotificationCount() async -> Int {
        let requests = await getPendingNotifications()
        return requests.count
    }

    // MARK: - Helper Methods

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) / 60 % 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationService: UNUserNotificationCenterDelegate {

    // Handle notification when app is in foreground
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    // Handle notification tap
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        Task { @MainActor in
            await handleNotificationAction(response: response, userInfo: userInfo)
            completionHandler()
        }
    }

    // Handle notification actions
    private func handleNotificationAction(response: UNNotificationResponse, userInfo: [AnyHashable: Any]) async {
        let actionIdentifier = response.actionIdentifier
        let notificationType = userInfo["type"] as? String ?? "unknown"

        print("📱 Notification action: \(actionIdentifier) for type: \(notificationType)")

        switch actionIdentifier {
        case "VIEW_MAINTENANCE":
            if let maintenanceId = userInfo["maintenanceId"] as? String {
                // Navigate to maintenance detail
                print("Navigate to maintenance: \(maintenanceId)")
                // Post notification for navigation
                NotificationCenter.default.post(
                    name: NSNotification.Name("NavigateToMaintenance"),
                    object: nil,
                    userInfo: ["maintenanceId": maintenanceId]
                )
            }

        case "SNOOZE_MAINTENANCE":
            // Reschedule notification for 1 hour later
            print("Snoozing maintenance notification")

        case "REFUEL_ACTION":
            if let vehicleId = userInfo["vehicleId"] as? String {
                print("Mark vehicle \(vehicleId) as refueled")
                // Post notification to update vehicle fuel level
                NotificationCenter.default.post(
                    name: NSNotification.Name("VehicleRefueled"),
                    object: nil,
                    userInfo: ["vehicleId": vehicleId]
                )
            }

        case "SCHEDULE_SERVICE":
            if let vehicleId = userInfo["vehicleId"] as? String {
                print("Schedule service for vehicle: \(vehicleId)")
                // Navigate to schedule service view
                NotificationCenter.default.post(
                    name: NSNotification.Name("ScheduleService"),
                    object: nil,
                    userInfo: ["vehicleId": vehicleId]
                )
            }

        case UNNotificationDefaultActionIdentifier:
            // User tapped the notification
            print("User tapped notification")

        case UNNotificationDismissActionIdentifier:
            // User dismissed the notification
            print("User dismissed notification")

        default:
            break
        }
    }
}
