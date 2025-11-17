import Foundation

// MARK: - Remote Config Manager
/// Manages Firebase Remote Config for feature flags and A/B testing
/// Provides dynamic app configuration without requiring app updates
class RemoteConfigManager {

    // MARK: - Singleton
    static let shared = RemoteConfigManager()

    // MARK: - Properties
    private var isEnabled: Bool {
        return FirebaseManager.shared.isRemoteConfigEnabled
    }

    private var cachedConfig: [String: Any] = [:]
    private var lastFetchTime: Date?
    private var isFetching: Bool = false

    // MARK: - Config Keys
    /// Define all remote config keys as constants to avoid typos
    struct ConfigKeys {
        // Feature Flags
        static let enableOBDDiagnostics = "enable_obd_diagnostics"
        static let enableAdvancedAnalytics = "enable_advanced_analytics"
        static let enableOfflineMode = "enable_offline_mode"
        static let enableVoiceCommands = "enable_voice_commands"
        static let enableDarkMode = "enable_dark_mode"
        static let enableBiometricAuth = "enable_biometric_auth"

        // UI Configuration
        static let maintenanceMode = "maintenance_mode"
        static let forceUpdate = "force_update"
        static let minAppVersion = "min_app_version"
        static let showWelcomeScreen = "show_welcome_screen"

        // Feature Limits
        static let maxPhotoUploads = "max_photo_uploads"
        static let maxTripDuration = "max_trip_duration_hours"
        static let syncIntervalMinutes = "sync_interval_minutes"

        // A/B Testing
        static let dashboardLayout = "dashboard_layout"
        static let onboardingFlow = "onboarding_flow"

        // API Configuration
        static let apiTimeout = "api_timeout_seconds"
        static let maxRetries = "max_retries"
    }

    // MARK: - Default Values
    private let defaults: [String: Any] = [
        // Feature Flags (default to false for new features)
        ConfigKeys.enableOBDDiagnostics: true,
        ConfigKeys.enableAdvancedAnalytics: true,
        ConfigKeys.enableOfflineMode: true,
        ConfigKeys.enableVoiceCommands: false,
        ConfigKeys.enableDarkMode: true,
        ConfigKeys.enableBiometricAuth: true,

        // UI Configuration
        ConfigKeys.maintenanceMode: false,
        ConfigKeys.forceUpdate: false,
        ConfigKeys.minAppVersion: "1.0.0",
        ConfigKeys.showWelcomeScreen: true,

        // Feature Limits
        ConfigKeys.maxPhotoUploads: 10,
        ConfigKeys.maxTripDuration: 24,
        ConfigKeys.syncIntervalMinutes: 15,

        // A/B Testing
        ConfigKeys.dashboardLayout: "standard",
        ConfigKeys.onboardingFlow: "default",

        // API Configuration
        ConfigKeys.apiTimeout: 30,
        ConfigKeys.maxRetries: 3
    ]

    // MARK: - Initialization
    private init() {
        // Load defaults into cache
        cachedConfig = defaults
    }

    // MARK: - Configuration

    /// Initialize Remote Config with defaults
    func configure() {
        guard isEnabled else {
            print("⚠️ RemoteConfigManager: Remote Config disabled")
            return
        }

        print("🔧 RemoteConfigManager: Configuring...")

        // Set default values
        setDefaults()

        // Fetch fresh values
        fetchConfig()

        print("✅ RemoteConfigManager: Configured")
    }

    /// Set default config values
    private func setDefaults() {
        // Uncomment when Firebase SDK is added:
        /*
        let remoteConfig = RemoteConfig.remoteConfig()
        remoteConfig.setDefaults(defaults as [String: NSObject])
        */

        print("📋 Remote Config: Defaults set")
    }

    // MARK: - Fetching

    /// Fetch latest config from Firebase
    func fetchConfig(completion: ((Bool) -> Void)? = nil) {
        guard isEnabled else {
            completion?(false)
            return
        }

        guard !isFetching else {
            print("⚠️ Remote Config: Already fetching")
            completion?(false)
            return
        }

        isFetching = true
        print("🔄 Remote Config: Fetching...")

        // Uncomment when Firebase SDK is added:
        /*
        let remoteConfig = RemoteConfig.remoteConfig()
        remoteConfig.fetch { [weak self] status, error in
            self?.isFetching = false

            if let error = error {
                print("🔴 Remote Config fetch error: \(error.localizedDescription)")
                completion?(false)
                return
            }

            if status == .success {
                remoteConfig.activate { [weak self] changed, error in
                    if let error = error {
                        print("🔴 Remote Config activation error: \(error.localizedDescription)")
                        completion?(false)
                        return
                    }

                    print("✅ Remote Config: Fetched and activated")
                    self?.lastFetchTime = Date()
                    self?.updateCache()
                    completion?(true)
                }
            } else {
                print("⚠️ Remote Config fetch status: \(status)")
                completion?(false)
            }
        }
        */

        // Simulate fetch for now (remove in production with actual Firebase SDK)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.isFetching = false
            self?.lastFetchTime = Date()
            print("✅ Remote Config: Fetched (simulated)")
            completion?(true)
        }
    }

    /// Fetch config and activate immediately
    func fetchAndActivate(completion: ((Bool) -> Void)? = nil) {
        guard isEnabled else {
            completion?(false)
            return
        }

        // Uncomment when Firebase SDK is added:
        /*
        let remoteConfig = RemoteConfig.remoteConfig()
        remoteConfig.fetchAndActivate { [weak self] status, error in
            if let error = error {
                print("🔴 Remote Config fetch and activate error: \(error.localizedDescription)")
                completion?(false)
                return
            }

            switch status {
            case .successFetchedFromRemote, .successUsingPreFetchedData:
                print("✅ Remote Config: Fetched and activated")
                self?.lastFetchTime = Date()
                self?.updateCache()
                completion?(true)

            case .error:
                print("🔴 Remote Config: Error fetching and activating")
                completion?(false)

            @unknown default:
                completion?(false)
            }
        }
        */

        // Simulate for now
        fetchConfig(completion: completion)
    }

    /// Update local cache from Remote Config
    private func updateCache() {
        // Uncomment when Firebase SDK is added:
        /*
        let remoteConfig = RemoteConfig.remoteConfig()

        for (key, _) in defaults {
            let value = remoteConfig[key]

            switch value.source {
            case .remote:
                // Value came from server
                if let boolValue = value.boolValue as? Bool {
                    cachedConfig[key] = boolValue
                } else if let numberValue = value.numberValue as? NSNumber {
                    cachedConfig[key] = numberValue
                } else if let stringValue = value.stringValue {
                    cachedConfig[key] = stringValue
                }

            case .default:
                // Using default value
                break

            case .static:
                // Static value set by developer
                break

            @unknown default:
                break
            }
        }
        */

        print("💾 Remote Config: Cache updated")
    }

    // MARK: - Getters

    /// Get boolean config value
    func bool(forKey key: String) -> Bool {
        if let cached = cachedConfig[key] as? Bool {
            return cached
        }

        // Uncomment when Firebase SDK is added:
        /*
        if isEnabled {
            let remoteConfig = RemoteConfig.remoteConfig()
            return remoteConfig[key].boolValue
        }
        */

        return defaults[key] as? Bool ?? false
    }

    /// Get integer config value
    func integer(forKey key: String) -> Int {
        if let cached = cachedConfig[key] as? Int {
            return cached
        }

        if let cached = cachedConfig[key] as? NSNumber {
            return cached.intValue
        }

        // Uncomment when Firebase SDK is added:
        /*
        if isEnabled {
            let remoteConfig = RemoteConfig.remoteConfig()
            return remoteConfig[key].numberValue.intValue
        }
        */

        return defaults[key] as? Int ?? 0
    }

    /// Get double config value
    func double(forKey key: String) -> Double {
        if let cached = cachedConfig[key] as? Double {
            return cached
        }

        if let cached = cachedConfig[key] as? NSNumber {
            return cached.doubleValue
        }

        // Uncomment when Firebase SDK is added:
        /*
        if isEnabled {
            let remoteConfig = RemoteConfig.remoteConfig()
            return remoteConfig[key].numberValue.doubleValue
        }
        */

        return defaults[key] as? Double ?? 0.0
    }

    /// Get string config value
    func string(forKey key: String) -> String {
        if let cached = cachedConfig[key] as? String {
            return cached
        }

        // Uncomment when Firebase SDK is added:
        /*
        if isEnabled {
            let remoteConfig = RemoteConfig.remoteConfig()
            return remoteConfig[key].stringValue ?? ""
        }
        */

        return defaults[key] as? String ?? ""
    }

    // MARK: - Feature Flags

    /// Check if a feature is enabled
    func isFeatureEnabled(_ featureName: String) -> Bool {
        return bool(forKey: featureName)
    }

    /// Get feature flag value with custom key
    func getFeatureFlag(_ key: String) -> Bool {
        return bool(forKey: key)
    }

    // MARK: - Convenience Methods

    // Feature Flags
    var isOBDDiagnosticsEnabled: Bool {
        bool(forKey: ConfigKeys.enableOBDDiagnostics)
    }

    var isAdvancedAnalyticsEnabled: Bool {
        bool(forKey: ConfigKeys.enableAdvancedAnalytics)
    }

    var isOfflineModeEnabled: Bool {
        bool(forKey: ConfigKeys.enableOfflineMode)
    }

    var isVoiceCommandsEnabled: Bool {
        bool(forKey: ConfigKeys.enableVoiceCommands)
    }

    var isDarkModeEnabled: Bool {
        bool(forKey: ConfigKeys.enableDarkMode)
    }

    var isBiometricAuthEnabled: Bool {
        bool(forKey: ConfigKeys.enableBiometricAuth)
    }

    // UI Configuration
    var isMaintenanceModeActive: Bool {
        bool(forKey: ConfigKeys.maintenanceMode)
    }

    var shouldForceUpdate: Bool {
        bool(forKey: ConfigKeys.forceUpdate)
    }

    var minimumAppVersion: String {
        string(forKey: ConfigKeys.minAppVersion)
    }

    var shouldShowWelcomeScreen: Bool {
        bool(forKey: ConfigKeys.showWelcomeScreen)
    }

    // Feature Limits
    var maxPhotoUploads: Int {
        integer(forKey: ConfigKeys.maxPhotoUploads)
    }

    var maxTripDurationHours: Int {
        integer(forKey: ConfigKeys.maxTripDuration)
    }

    var syncIntervalMinutes: Int {
        integer(forKey: ConfigKeys.syncIntervalMinutes)
    }

    // A/B Testing
    var dashboardLayout: String {
        string(forKey: ConfigKeys.dashboardLayout)
    }

    var onboardingFlow: String {
        string(forKey: ConfigKeys.onboardingFlow)
    }

    // API Configuration
    var apiTimeoutSeconds: Int {
        integer(forKey: ConfigKeys.apiTimeout)
    }

    var maxRetries: Int {
        integer(forKey: ConfigKeys.maxRetries)
    }

    // MARK: - Version Checking

    /// Check if current app version meets minimum requirement
    func isAppVersionSupported() -> Bool {
        let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let minVersion = minimumAppVersion

        return compareVersions(currentVersion, minVersion) >= 0
    }

    /// Compare two version strings (e.g., "1.2.3" vs "1.2.0")
    /// Returns: 1 if v1 > v2, 0 if equal, -1 if v1 < v2
    private func compareVersions(_ v1: String, _ v2: String) -> Int {
        let v1Components = v1.split(separator: ".").compactMap { Int($0) }
        let v2Components = v2.split(separator: ".").compactMap { Int($0) }

        let maxLength = max(v1Components.count, v2Components.count)

        for i in 0..<maxLength {
            let v1Value = i < v1Components.count ? v1Components[i] : 0
            let v2Value = i < v2Components.count ? v2Components[i] : 0

            if v1Value > v2Value {
                return 1
            } else if v1Value < v2Value {
                return -1
            }
        }

        return 0
    }

    // MARK: - Cache Management

    /// Get time since last fetch
    var timeSinceLastFetch: TimeInterval? {
        guard let lastFetch = lastFetchTime else { return nil }
        return Date().timeIntervalSince(lastFetch)
    }

    /// Check if cache is stale (older than 1 hour)
    var isCacheStale: Bool {
        guard let timeSince = timeSinceLastFetch else { return true }
        return timeSince > 3600 // 1 hour
    }

    /// Force refresh if cache is stale
    func refreshIfNeeded(completion: ((Bool) -> Void)? = nil) {
        if isCacheStale {
            fetchAndActivate(completion: completion)
        } else {
            completion?(false)
        }
    }

    // MARK: - Debugging

    /// Print all current config values (for debugging)
    func printAllConfigValues() {
        print("📋 Remote Config Values:")
        for (key, value) in cachedConfig.sorted(by: { $0.key < $1.key }) {
            print("   \(key): \(value)")
        }

        if let lastFetch = lastFetchTime {
            print("   Last fetch: \(lastFetch)")
        } else {
            print("   Never fetched")
        }
    }

    /// Get all config values as dictionary
    func getAllConfigValues() -> [String: Any] {
        return cachedConfig
    }

    // MARK: - Reset

    /// Reset to default values (useful for testing)
    func resetToDefaults() {
        cachedConfig = defaults
        lastFetchTime = nil
        print("🔄 Remote Config: Reset to defaults")
    }
}
