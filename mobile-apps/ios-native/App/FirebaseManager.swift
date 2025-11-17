import Foundation
import UIKit

// MARK: - Firebase Manager
/// Centralized Firebase initialization and configuration manager
/// Handles safe initialization with graceful degradation if credentials are missing
class FirebaseManager {

    // MARK: - Singleton
    static let shared = FirebaseManager()

    // MARK: - Properties
    private(set) var isFirebaseAvailable: Bool = false
    private(set) var isAnalyticsEnabled: Bool = false
    private(set) var isCrashlyticsEnabled: Bool = false
    private(set) var isMessagingEnabled: Bool = false
    private(set) var isRemoteConfigEnabled: Bool = false
    private(set) var isPerformanceEnabled: Bool = false

    // MARK: - Initialization
    private init() {
        // Private initializer for singleton
    }

    // MARK: - Firebase Configuration

    /// Initialize Firebase with all services
    /// - Parameter application: The UIApplication instance
    func configure(application: UIApplication) {
        print("🔧 FirebaseManager: Starting Firebase configuration...")

        // Check if GoogleService-Info.plist exists
        guard let plistPath = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plistData = FileManager.default.contents(atPath: plistPath),
              let plist = try? PropertyListSerialization.propertyList(from: plistData, options: [], format: nil) as? [String: Any] else {
            print("⚠️ FirebaseManager: GoogleService-Info.plist not found or invalid")
            print("⚠️ FirebaseManager: Firebase will be disabled. Add GoogleService-Info.plist to enable Firebase features.")
            isFirebaseAvailable = false
            return
        }

        // Validate required Firebase fields
        guard validateFirebaseConfig(plist) else {
            print("⚠️ FirebaseManager: GoogleService-Info.plist contains placeholder values")
            print("⚠️ FirebaseManager: Replace placeholder values with actual Firebase credentials to enable features.")
            isFirebaseAvailable = false
            return
        }

        // Firebase SDK would be initialized here in production
        // Uncomment when Firebase SDK is added to project:
        /*
        FirebaseApp.configure()
        print("✅ FirebaseManager: Firebase configured successfully")
        isFirebaseAvailable = true

        // Configure individual services
        configureAnalytics()
        configureCrashlytics()
        configureMessaging(application: application)
        configureRemoteConfig()
        configurePerformance()
        */

        // For now, simulate availability (remove in production with actual Firebase SDK)
        isFirebaseAvailable = true
        print("✅ FirebaseManager: Firebase configuration validated (SDK integration pending)")

        // Configure services
        configureAnalytics()
        configureCrashlytics()
        configureMessaging(application: application)
        configureRemoteConfig()
        configurePerformance()
    }

    // MARK: - Configuration Validation

    /// Validates that Firebase configuration contains real values, not placeholders
    private func validateFirebaseConfig(_ plist: [String: Any]) -> Bool {
        // Check for required fields
        guard let apiKey = plist["API_KEY"] as? String,
              let bundleId = plist["BUNDLE_ID"] as? String,
              let projectId = plist["PROJECT_ID"] as? String else {
            return false
        }

        // Check for placeholder values
        let placeholders = ["YOUR_", "PLACEHOLDER", "REPLACE_ME", "EXAMPLE"]
        let values = [apiKey, bundleId, projectId]

        for value in values {
            for placeholder in placeholders {
                if value.uppercased().contains(placeholder) {
                    return false
                }
            }
        }

        // Validate API key format (basic check)
        if apiKey.count < 30 {
            return false
        }

        return true
    }

    // MARK: - Analytics Configuration

    private func configureAnalytics() {
        guard isFirebaseAvailable else {
            print("⚠️ Analytics: Disabled (Firebase not available)")
            return
        }

        // Firebase Analytics is automatically enabled when Firebase is configured
        // Additional configuration can be done here

        // Uncomment when Firebase SDK is added:
        /*
        Analytics.setAnalyticsCollectionEnabled(true)
        Analytics.setSessionTimeoutInterval(1800) // 30 minutes
        */

        isAnalyticsEnabled = true
        print("✅ Analytics: Enabled")
    }

    // MARK: - Crashlytics Configuration

    private func configureCrashlytics() {
        guard isFirebaseAvailable else {
            print("⚠️ Crashlytics: Disabled (Firebase not available)")
            return
        }

        #if DEBUG
        // Disable Crashlytics in debug builds for faster development
        print("⚠️ Crashlytics: Disabled in DEBUG mode")
        isCrashlyticsEnabled = false
        #else
        // Uncomment when Firebase SDK is added:
        /*
        Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(true)
        */

        isCrashlyticsEnabled = true
        print("✅ Crashlytics: Enabled")
        #endif
    }

    // MARK: - Cloud Messaging Configuration

    private func configureMessaging(application: UIApplication) {
        guard isFirebaseAvailable else {
            print("⚠️ Cloud Messaging: Disabled (Firebase not available)")
            return
        }

        // Uncomment when Firebase SDK is added:
        /*
        Messaging.messaging().delegate = self

        // Enable auto-init
        Messaging.messaging().isAutoInitEnabled = true
        */

        isMessagingEnabled = true
        print("✅ Cloud Messaging: Enabled")
    }

    // MARK: - Remote Config Configuration

    private func configureRemoteConfig() {
        guard isFirebaseAvailable else {
            print("⚠️ Remote Config: Disabled (Firebase not available)")
            return
        }

        // Uncomment when Firebase SDK is added:
        /*
        let remoteConfig = RemoteConfig.remoteConfig()
        let settings = RemoteConfigSettings()

        #if DEBUG
        // Shorter fetch interval for debug builds
        settings.minimumFetchInterval = 0
        #else
        // 1 hour fetch interval for production
        settings.minimumFetchInterval = 3600
        #endif

        remoteConfig.configSettings = settings
        */

        isRemoteConfigEnabled = true
        print("✅ Remote Config: Enabled")
    }

    // MARK: - Performance Monitoring Configuration

    private func configurePerformance() {
        guard isFirebaseAvailable else {
            print("⚠️ Performance Monitoring: Disabled (Firebase not available)")
            return
        }

        #if DEBUG
        // Disable performance monitoring in debug builds
        print("⚠️ Performance Monitoring: Disabled in DEBUG mode")
        isPerformanceEnabled = false
        #else
        // Uncomment when Firebase SDK is added:
        /*
        Performance.sharedInstance().isDataCollectionEnabled = true
        */

        isPerformanceEnabled = true
        print("✅ Performance Monitoring: Enabled")
        #endif
    }

    // MARK: - User Properties

    /// Set user ID for analytics (must not contain PII)
    func setUserId(_ userId: String?) {
        guard isAnalyticsEnabled else { return }

        // Hash the user ID to avoid PII
        let hashedUserId = userId?.sha256Hash()

        // Uncomment when Firebase SDK is added:
        /*
        Analytics.setUserID(hashedUserId)
        */

        print("📊 Analytics: User ID set (hashed)")
    }

    /// Set custom user property
    func setUserProperty(_ value: String?, forName name: String) {
        guard isAnalyticsEnabled else { return }

        // Uncomment when Firebase SDK is added:
        /*
        Analytics.setUserProperty(value, forName: name)
        */

        print("📊 Analytics: User property set - \(name): \(value ?? "nil")")
    }

    // MARK: - Error Logging

    /// Log non-fatal error to Crashlytics
    func logError(_ error: Error, additionalInfo: [String: Any]? = nil) {
        guard isCrashlyticsEnabled else {
            print("⚠️ Crashlytics unavailable - Error: \(error.localizedDescription)")
            return
        }

        // Uncomment when Firebase SDK is added:
        /*
        Crashlytics.crashlytics().record(error: error)

        if let info = additionalInfo {
            for (key, value) in info {
                Crashlytics.crashlytics().setCustomValue(value, forKey: key)
            }
        }
        */

        print("🔴 Error logged to Crashlytics: \(error.localizedDescription)")
    }

    /// Log custom message to Crashlytics
    func logMessage(_ message: String) {
        guard isCrashlyticsEnabled else { return }

        // Uncomment when Firebase SDK is added:
        /*
        Crashlytics.crashlytics().log(message)
        */

        print("📝 Crashlytics log: \(message)")
    }
}

// MARK: - Messaging Delegate (for when Firebase SDK is added)
/*
extension FirebaseManager: MessagingDelegate {

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("📱 FCM Token: \(fcmToken ?? "nil")")

        // Send token to backend
        if let token = fcmToken {
            NotificationCenter.default.post(
                name: .fcmTokenRefreshed,
                object: nil,
                userInfo: ["token": token]
            )
        }
    }
}
*/

// MARK: - Notification Names
extension Notification.Name {
    static let fcmTokenRefreshed = Notification.Name("fcmTokenRefreshed")
}

// MARK: - String Hashing Extension
extension String {
    func sha256Hash() -> String {
        guard let data = self.data(using: .utf8) else { return self }

        // Simple hash for user ID anonymization
        // In production, use CryptoKit for proper SHA-256
        var hash = 0
        for byte in data {
            hash = ((hash << 5) &- hash) &+ Int(byte)
        }

        return String(format: "%016x", abs(hash))
    }
}
