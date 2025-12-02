import Foundation
import UIKit
import UserNotifications

// MARK: - Push Notification Manager
/// Manages Firebase Cloud Messaging (FCM) push notifications
/// Handles permissions, registration, notification handling, and deep linking
class PushNotificationManager: NSObject {

    // MARK: - Singleton
    static let shared = PushNotificationManager()

    // MARK: - Properties
    private(set) var fcmToken: String?
    private(set) var apnsToken: String?
    private(set) var isRegistered: Bool = false
    private(set) var notificationPermissionStatus: UNAuthorizationStatus = .notDetermined

    private var pendingNotificationHandler: ((UNNotificationResponse) -> Void)?

    // MARK: - Initialization
    private override init() {
        super.init()
    }

    // MARK: - Configuration

    /// Initialize push notification manager
    func configure(application: UIApplication) {
        print("🔔 PushNotificationManager: Configuring...")

        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self

        // Check current authorization status
        checkNotificationPermissionStatus()

        print("✅ PushNotificationManager: Configured")
    }

    // MARK: - Permission Management

    /// Request notification permissions from user
    func requestNotificationPermissions(completion: ((Bool, Error?) -> Void)? = nil) {
        let center = UNUserNotificationCenter.current()

        center.requestAuthorization(options: [.alert, .badge, .sound]) { [weak self] granted, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("🔴 Notification permission error: \(error.localizedDescription)")
                    completion?(false, error)
                    return
                }

                if granted {
                    print("✅ Notification permissions granted")
                    self?.registerForRemoteNotifications()
                    completion?(true, nil)
                } else {
                    print("⚠️ Notification permissions denied")
                    completion?(false, nil)
                }

                self?.checkNotificationPermissionStatus()
            }
        }
    }

    /// Check current notification permission status
    func checkNotificationPermissionStatus() {
        UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.notificationPermissionStatus = settings.authorizationStatus
                print("📊 Notification permission status: \(settings.authorizationStatus.description)")
            }
        }
    }

    /// Register for remote notifications (APNS)
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
            print("📱 Registering for remote notifications...")
        }
    }

    // MARK: - Token Management

    /// Handle successful APNS token registration
    func didRegisterForRemoteNotifications(withDeviceToken deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()

        apnsToken = token
        print("✅ APNS Token: \(token)")

        // Uncomment when Firebase SDK is added:
        /*
        Messaging.messaging().apnsToken = deviceToken
        */

        // Send token to backend
        sendTokenToBackend(token)
    }

    /// Handle failed APNS token registration
    func didFailToRegisterForRemoteNotifications(withError error: Error) {
        print("🔴 Failed to register for remote notifications: \(error.localizedDescription)")
        FirebaseManager.shared.logError(error, additionalInfo: ["context": "push_notification_registration"])
    }

    /// Store FCM token when received
    func setFCMToken(_ token: String) {
        fcmToken = token
        isRegistered = true
        print("✅ FCM Token received: \(token)")

        // Send to backend
        sendTokenToBackend(token)

        // Store in UserDefaults for offline access
        UserDefaults.standard.set(token, forKey: "fcm_token")
    }

    /// Send token to backend server
    private func sendTokenToBackend(_ token: String) {
        // TODO: Implement backend API call to register device token
        print("📤 Sending token to backend: \(token)")

        // Example implementation:
        /*
        guard let url = URL(string: "\(APIConfiguration.baseURL)/api/devices/register") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "deviceToken": token,
            "platform": "ios",
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("🔴 Failed to send token to backend: \(error.localizedDescription)")
                return
            }
            print("✅ Token registered with backend")
        }.resume()
        */
    }

    // MARK: - Notification Handling

    /// Handle notification received while app is in foreground
    func handleForegroundNotification(_ notification: UNNotification) {
        let userInfo = notification.request.content.userInfo
        print("📬 Foreground notification received: \(userInfo)")

        // Log to analytics
        AnalyticsManager.shared.logEvent("notification_received_foreground", parameters: [
            "notification_type": userInfo["type"] as? String ?? "unknown"
        ])

        // Process notification payload
        processNotificationPayload(userInfo)
    }

    /// Handle notification tap/interaction
    func handleNotificationResponse(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        print("👆 Notification tapped: \(userInfo)")

        // Log to analytics
        AnalyticsManager.shared.logEvent("notification_tapped", parameters: [
            "notification_type": userInfo["type"] as? String ?? "unknown",
            "action_id": response.actionIdentifier
        ])

        // Process notification payload
        processNotificationPayload(userInfo)

        // Handle deep link if present
        if let deepLink = userInfo["deepLink"] as? String {
            handleDeepLink(deepLink)
        }
    }

    /// Handle silent push notification for background sync
    func handleSilentNotification(_ userInfo: [AnyHashable: Any], completion: @escaping (UIBackgroundFetchResult) -> Void) {
        print("🔇 Silent notification received: \(userInfo)")

        // Check if this is a background sync trigger
        if let syncType = userInfo["syncType"] as? String {
            handleBackgroundSync(syncType: syncType, completion: completion)
        } else {
            completion(.noData)
        }
    }

    // MARK: - Payload Processing

    /// Process notification payload and extract relevant data
    private func processNotificationPayload(_ userInfo: [AnyHashable: Any]) {
        // Extract notification type
        guard let notificationType = userInfo["type"] as? String else {
            print("⚠️ Notification missing type field")
            return
        }

        print("📋 Processing notification type: \(notificationType)")

        // Handle different notification types
        switch notificationType {
        case "trip_alert":
            handleTripAlert(userInfo)

        case "maintenance_reminder":
            handleMaintenanceReminder(userInfo)

        case "vehicle_alert":
            handleVehicleAlert(userInfo)

        case "inspection_due":
            handleInspectionDue(userInfo)

        case "message":
            handleMessage(userInfo)

        default:
            print("⚠️ Unknown notification type: \(notificationType)")
        }
    }

    // MARK: - Notification Type Handlers

    private func handleTripAlert(_ userInfo: [AnyHashable: Any]) {
        guard let tripId = userInfo["tripId"] as? String else { return }
        print("🚗 Trip alert for trip: \(tripId)")

        // Post notification to update UI
        NotificationCenter.default.post(
            name: .tripAlertReceived,
            object: nil,
            userInfo: ["tripId": tripId]
        )
    }

    private func handleMaintenanceReminder(_ userInfo: [AnyHashable: Any]) {
        guard let vehicleId = userInfo["vehicleId"] as? String else { return }
        print("🔧 Maintenance reminder for vehicle: \(vehicleId)")

        NotificationCenter.default.post(
            name: .maintenanceReminderReceived,
            object: nil,
            userInfo: ["vehicleId": vehicleId]
        )
    }

    private func handleVehicleAlert(_ userInfo: [AnyHashable: Any]) {
        guard let vehicleId = userInfo["vehicleId"] as? String else { return }
        guard let alertType = userInfo["alertType"] as? String else { return }

        print("⚠️ Vehicle alert for vehicle: \(vehicleId), type: \(alertType)")

        NotificationCenter.default.post(
            name: .vehicleAlertReceived,
            object: nil,
            userInfo: ["vehicleId": vehicleId, "alertType": alertType]
        )
    }

    private func handleInspectionDue(_ userInfo: [AnyHashable: Any]) {
        guard let vehicleId = userInfo["vehicleId"] as? String else { return }
        print("📋 Inspection due for vehicle: \(vehicleId)")

        NotificationCenter.default.post(
            name: .inspectionDueReceived,
            object: nil,
            userInfo: ["vehicleId": vehicleId]
        )
    }

    private func handleMessage(_ userInfo: [AnyHashable: Any]) {
        guard let messageId = userInfo["messageId"] as? String else { return }
        print("💬 Message notification: \(messageId)")

        NotificationCenter.default.post(
            name: .messageReceived,
            object: nil,
            userInfo: ["messageId": messageId]
        )
    }

    // MARK: - Background Sync

    private func handleBackgroundSync(syncType: String, completion: @escaping (UIBackgroundFetchResult) -> Void) {
        print("🔄 Background sync triggered: \(syncType)")

        // Trigger appropriate sync operation
        switch syncType {
        case "full":
            triggerFullSync(completion: completion)

        case "incremental":
            triggerIncrementalSync(completion: completion)

        case "trips":
            triggerTripSync(completion: completion)

        default:
            completion(.noData)
        }
    }

    private func triggerFullSync(completion: @escaping (UIBackgroundFetchResult) -> Void) {
        // Integrate with BackgroundSyncManager
        // BackgroundSyncManager.shared.performSync { success in
        //     completion(success ? .newData : .failed)
        // }
        print("🔄 Full sync triggered")
        completion(.newData)
    }

    private func triggerIncrementalSync(completion: @escaping (UIBackgroundFetchResult) -> Void) {
        print("🔄 Incremental sync triggered")
        completion(.newData)
    }

    private func triggerTripSync(completion: @escaping (UIBackgroundFetchResult) -> Void) {
        print("🔄 Trip sync triggered")
        completion(.newData)
    }

    // MARK: - Deep Linking

    /// Handle deep link from notification
    private func handleDeepLink(_ deepLink: String) {
        guard let url = URL(string: deepLink) else {
            print("⚠️ Invalid deep link URL: \(deepLink)")
            return
        }

        print("🔗 Handling deep link: \(deepLink)")

        // Post notification to navigation coordinator
        NotificationCenter.default.post(
            name: .handleDeepLink,
            object: nil,
            userInfo: ["url": url]
        )
    }

    // MARK: - Badge Management

    /// Set app badge count
    func setBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
            print("🔵 Badge count set to: \(count)")
        }
    }

    /// Clear app badge
    func clearBadge() {
        setBadgeCount(0)
    }

    /// Increment badge count
    func incrementBadge() {
        DispatchQueue.main.async {
            let currentCount = UIApplication.shared.applicationIconBadgeNumber
            UIApplication.shared.applicationIconBadgeNumber = currentCount + 1
            print("🔵 Badge incremented to: \(currentCount + 1)")
        }
    }

    // MARK: - Helper Methods

    /// Check if notifications are enabled
    var areNotificationsEnabled: Bool {
        return notificationPermissionStatus == .authorized
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension PushNotificationManager: UNUserNotificationCenterDelegate {

    /// Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        handleForegroundNotification(notification)

        // Show notification banner even in foreground
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    /// Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        handleNotificationResponse(response)
        completionHandler()
    }
}

// MARK: - UNAuthorizationStatus Extension
extension UNAuthorizationStatus {
    var description: String {
        switch self {
        case .notDetermined: return "Not Determined"
        case .denied: return "Denied"
        case .authorized: return "Authorized"
        case .provisional: return "Provisional"
        case .ephemeral: return "Ephemeral"
        @unknown default: return "Unknown"
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let tripAlertReceived = Notification.Name("tripAlertReceived")
    static let maintenanceReminderReceived = Notification.Name("maintenanceReminderReceived")
    static let vehicleAlertReceived = Notification.Name("vehicleAlertReceived")
    static let inspectionDueReceived = Notification.Name("inspectionDueReceived")
    static let messageReceived = Notification.Name("messageReceived")
    static let handleDeepLink = Notification.Name("handleDeepLink")
}
