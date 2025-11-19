import Foundation
import UserNotifications
import UIKit
import Combine

/**
 * Push Notification Manager
 *
 * Handles:
 * - APNs registration and token management
 * - Local and remote notification handling
 * - Notification categories and actions
 * - Badge management
 * - Deep linking from notifications
 */

class PushNotificationManager: NSObject, ObservableObject {
    static let shared = PushNotificationManager()

    @Published var isRegistered = false
    @Published var pushToken: String?
    @Published var notificationPermissionStatus: UNAuthorizationStatus = .notDetermined

    private let notificationCenter = UNUserNotificationCenter.current()
    private let apiClient = APIClient.shared

    private override init() {
        super.init()
        notificationCenter.delegate = self
        checkPermissionStatus()
    }

    // MARK: - Permission

    func requestPermission() {
        notificationCenter.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    print("✅ Notification permission granted")
                    self.registerForRemoteNotifications()
                } else {
                    print("❌ Notification permission denied")
                }

                self.checkPermissionStatus()
            }

            if let error = error {
                print("❌ Notification permission error: \(error.localizedDescription)")
            }
        }
    }

    private func checkPermissionStatus() {
        notificationCenter.getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.notificationPermissionStatus = settings.authorizationStatus
            }
        }
    }

    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }

    // MARK: - Token Management

    func didRegisterForRemoteNotifications(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.pushToken = token
        self.isRegistered = true

        print("📱 APNs device token: \(token)")

        // Send token to backend
        registerDeviceWithBackend(token)
    }

    func didFailToRegisterForRemoteNotifications(error: Error) {
        print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
        isRegistered = false
    }

    private func registerDeviceWithBackend(_ token: String) {
        let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        let deviceName = UIDevice.current.name
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let osVersion = UIDevice.current.systemVersion

        let request = DeviceRegistrationRequest(
            deviceType: "ios",
            deviceId: deviceId,
            deviceName: deviceName,
            appVersion: appVersion,
            osVersion: osVersion,
            pushToken: token
        )

        let _: AnyPublisher<DeviceRegistrationResponse, APIError> = apiClient.post("/mobile/register", body: request)

        // Note: In real implementation, should handle response
        print("📱 Device registered with backend")
    }

    // MARK: - Notification Categories

    func setupNotificationCategories() {
        // Trip notification actions
        let startTripAction = UNNotificationAction(
            identifier: "START_TRIP",
            title: "Start Trip",
            options: .foreground
        )

        let endTripAction = UNNotificationAction(
            identifier: "END_TRIP",
            title: "End Trip",
            options: .destructive
        )

        let tripCategory = UNNotificationCategory(
            identifier: "TRIP_NOTIFICATION",
            actions: [startTripAction, endTripAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        // Inspection reminder actions
        let performInspectionAction = UNNotificationAction(
            identifier: "PERFORM_INSPECTION",
            title: "Start Inspection",
            options: .foreground
        )

        let snoozeAction = UNNotificationAction(
            identifier: "SNOOZE",
            title: "Remind Later",
            options: []
        )

        let inspectionCategory = UNNotificationCategory(
            identifier: "INSPECTION_REMINDER",
            actions: [performInspectionAction, snoozeAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        // Message notification actions
        let replyAction = UNTextInputNotificationAction(
            identifier: "REPLY_MESSAGE",
            title: "Reply",
            options: [],
            textInputButtonTitle: "Send",
            textInputPlaceholder: "Type your message..."
        )

        let markReadAction = UNNotificationAction(
            identifier: "MARK_READ",
            title: "Mark as Read",
            options: []
        )

        let messageCategory = UNNotificationCategory(
            identifier: "MESSAGE_NOTIFICATION",
            actions: [replyAction, markReadAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        // Alert notification actions
        let viewAlertAction = UNNotificationAction(
            identifier: "VIEW_ALERT",
            title: "View Details",
            options: .foreground
        )

        let dismissAlertAction = UNNotificationAction(
            identifier: "DISMISS_ALERT",
            title: "Dismiss",
            options: .destructive
        )

        let alertCategory = UNNotificationCategory(
            identifier: "ALERT_NOTIFICATION",
            actions: [viewAlertAction, dismissAlertAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        // Register categories
        notificationCenter.setNotificationCategories([
            tripCategory,
            inspectionCategory,
            messageCategory,
            alertCategory
        ])

        print("📱 Notification categories configured")
    }

    // MARK: - Local Notifications

    func scheduleLocalNotification(
        title: String,
        body: String,
        categoryIdentifier: String? = nil,
        userInfo: [AnyHashable: Any]? = nil,
        trigger: UNNotificationTrigger? = nil
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        if let category = categoryIdentifier {
            content.categoryIdentifier = category
        }

        if let info = userInfo {
            content.userInfo = info
        }

        let identifier = UUID().uuidString
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )

        notificationCenter.add(request) { error in
            if let error = error {
                print("❌ Failed to schedule notification: \(error.localizedDescription)")
            } else {
                print("📱 Local notification scheduled")
            }
        }
    }

    func scheduleInspectionReminder(vehicleId: Int, vehicleName: String, timeInterval: TimeInterval) {
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: timeInterval,
            repeats: false
        )

        scheduleLocalNotification(
            title: "Inspection Required",
            body: "Time to perform inspection for \(vehicleName)",
            categoryIdentifier: "INSPECTION_REMINDER",
            userInfo: [
                "type": "inspection_reminder",
                "vehicleId": vehicleId
            ],
            trigger: trigger
        )
    }

    func scheduleTripEndReminder(tripId: Int64, duration: TimeInterval) {
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: duration,
            repeats: false
        )

        scheduleLocalNotification(
            title: "Trip Duration Alert",
            body: "You've been on this trip for a while. Remember to log your end time.",
            categoryIdentifier: "TRIP_NOTIFICATION",
            userInfo: [
                "type": "trip_reminder",
                "tripId": tripId
            ],
            trigger: trigger
        )
    }

    // MARK: - Badge Management

    func updateBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }

    func clearBadge() {
        updateBadgeCount(0)
    }

    func incrementBadge() {
        let current = UIApplication.shared.applicationIconBadgeNumber
        updateBadgeCount(current + 1)
    }

    // MARK: - Deep Linking

    func handleNotificationAction(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier

        print("📱 Handling notification action: \(actionIdentifier)")

        switch actionIdentifier {
        case "START_TRIP":
            handleStartTripAction(userInfo)

        case "END_TRIP":
            handleEndTripAction(userInfo)

        case "PERFORM_INSPECTION":
            handlePerformInspectionAction(userInfo)

        case "SNOOZE":
            handleSnoozeAction(userInfo)

        case "REPLY_MESSAGE":
            if let response = response as? UNTextInputNotificationResponse {
                handleReplyMessageAction(userInfo, text: response.userText)
            }

        case "MARK_READ":
            handleMarkReadAction(userInfo)

        case "VIEW_ALERT":
            handleViewAlertAction(userInfo)

        case UNNotificationDefaultActionIdentifier:
            handleDefaultAction(userInfo)

        default:
            break
        }
    }

    private func handleStartTripAction(_ userInfo: [AnyHashable: Any]) {
        NotificationCenter.default.post(
            name: .openTripStart,
            object: nil,
            userInfo: userInfo
        )
    }

    private func handleEndTripAction(_ userInfo: [AnyHashable: Any]) {
        NotificationCenter.default.post(
            name: .openTripEnd,
            object: nil,
            userInfo: userInfo
        )
    }

    private func handlePerformInspectionAction(_ userInfo: [AnyHashable: Any]) {
        NotificationCenter.default.post(
            name: .openInspection,
            object: nil,
            userInfo: userInfo
        )
    }

    private func handleSnoozeAction(_ userInfo: [AnyHashable: Any]) {
        // Reschedule notification for 1 hour later
        if let vehicleId = userInfo["vehicleId"] as? Int,
           let vehicleName = userInfo["vehicleName"] as? String {
            scheduleInspectionReminder(
                vehicleId: vehicleId,
                vehicleName: vehicleName,
                timeInterval: 3600 // 1 hour
            )
        }
    }

    private func handleReplyMessageAction(_ userInfo: [AnyHashable: Any], text: String) {
        // Send message reply
        if let messageId = userInfo["messageId"] as? Int {
            print("📱 Sending reply to message \(messageId): \(text)")
            // Implement message reply logic
        }
    }

    private func handleMarkReadAction(_ userInfo: [AnyHashable: Any]) {
        if let messageId = userInfo["messageId"] as? Int {
            print("📱 Marking message \(messageId) as read")
            // Implement mark as read logic
        }
    }

    private func handleViewAlertAction(_ userInfo: [AnyHashable: Any]) {
        NotificationCenter.default.post(
            name: .openAlert,
            object: nil,
            userInfo: userInfo
        )
    }

    private func handleDefaultAction(_ userInfo: [AnyHashable: Any]) {
        // Handle default tap on notification
        if let type = userInfo["type"] as? String {
            switch type {
            case "inspection_reminder":
                handlePerformInspectionAction(userInfo)
            case "trip_reminder":
                handleEndTripAction(userInfo)
            case "message":
                handleViewAlertAction(userInfo)
            default:
                break
            }
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension PushNotificationManager: UNUserNotificationCenterDelegate {
    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        print("📱 Received notification while app is active")

        // Show notification even when app is active
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        print("📱 User tapped notification")

        handleNotificationAction(response)
        completionHandler()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let openTripStart = Notification.Name("openTripStart")
    static let openTripEnd = Notification.Name("openTripEnd")
    static let openInspection = Notification.Name("openInspection")
    static let openAlert = Notification.Name("openAlert")
}
