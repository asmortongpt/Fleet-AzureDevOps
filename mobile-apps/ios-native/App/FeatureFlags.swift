import Foundation

// MARK: - Feature Flags Manager
/// Comprehensive feature flag management system supporting:
/// - Local feature flags
/// - Remote feature flags (Firebase Remote Config)
/// - A/B testing
/// - Gradual rollouts
actor FeatureFlagsManager {

    // MARK: - Singleton Instance
    static let shared = FeatureFlagsManager()

    // MARK: - Properties
    private var localFlags: [String: FeatureFlag] = [:]
    private var remoteFlags: [String: FeatureFlag] = [:]
    private var abTestingGroups: [String: String] = [:]
    private var rolloutPercentages: [String: Int] = [:]
    private var lastRemoteUpdateTime: Date?
    private let remoteUpdateInterval: TimeInterval = 3600 // 1 hour
    private let userID: String = UUID().uuidString

    // MARK: - Initialization
    private init() {
        initializeLocalFlags()
    }

    // MARK: - Public Interface

    /// Initialize feature flags from configuration
    func initialize() async {
        await initializeFromEnvironment()
        await updateRemoteFlags()
    }

    /// Check if a feature is enabled
    func isEnabled(_ featureName: String) -> Bool {
        // Check for A/B test override
        if let abGroup = abTestingGroups[featureName] {
            return evaluateABTest(featureName: featureName, group: abGroup)
        }

        // Check for rollout percentage
        if let percentage = rolloutPercentages[featureName] {
            return evaluateRollout(featureName: featureName, percentage: percentage)
        }

        // Check local flags first
        if let localFlag = localFlags[featureName], localFlag.enabled {
            return true
        }

        // Check remote flags
        if let remoteFlag = remoteFlags[featureName] {
            return remoteFlag.enabled
        }

        // Default to disabled
        return false
    }

    /// Get feature flag metadata
    func getFlag(_ featureName: String) -> FeatureFlag? {
        return localFlags[featureName] ?? remoteFlags[featureName]
    }

    /// Update a local feature flag
    func setLocalFlag(_ featureName: String, enabled: Bool) {
        localFlags[featureName] = FeatureFlag(
            name: featureName,
            enabled: enabled,
            source: .local,
            lastUpdated: Date()
        )
    }

    /// Set A/B testing group for a feature
    func setABTestGroup(_ featureName: String, group: String) {
        abTestingGroups[featureName] = group
    }

    /// Set rollout percentage for gradual deployment
    func setRolloutPercentage(_ featureName: String, percentage: Int) {
        guard percentage >= 0 && percentage <= 100 else {
            return
        }
        rolloutPercentages[featureName] = percentage
    }

    /// Update remote flags from Firebase Remote Config
    func updateRemoteFlags() async {
        let now = Date()

        // Check if enough time has passed since last update
        if let lastUpdate = lastRemoteUpdateTime {
            let timeSinceUpdate = now.timeIntervalSince(lastUpdate)
            if timeSinceUpdate < remoteUpdateInterval {
                return
            }
        }

        // In a real implementation, this would fetch from Firebase Remote Config
        // For now, we'll use a mock implementation
        await fetchRemoteConfiguration()
        lastRemoteUpdateTime = now
    }

    /// Get all enabled features
    func getEnabledFeatures() -> [String] {
        let allFlagNames = Set(localFlags.keys).union(Set(remoteFlags.keys))
        return allFlagNames.filter { isEnabled($0) }
    }

    /// Get feature flag statistics for debugging
    func getStatistics() -> FeatureFlagsStatistics {
        let allFlags = Set(localFlags.keys).union(Set(remoteFlags.keys))
        let enabledCount = allFlags.filter { isEnabled($0) }.count

        return FeatureFlagsStatistics(
            totalFlags: allFlags.count,
            enabledFlags: enabledCount,
            disabledFlags: allFlags.count - enabledCount,
            abTestCount: abTestingGroups.count,
            rolloutCount: rolloutPercentages.count,
            lastRemoteUpdate: lastRemoteUpdateTime
        )
    }

    // MARK: - Private Methods

    private func initializeLocalFlags() {
        localFlags = [
            "feature_crash_reporting": FeatureFlag(
                name: "feature_crash_reporting",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_analytics": FeatureFlag(
                name: "feature_analytics",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_offline_mode": FeatureFlag(
                name: "feature_offline_mode",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_background_sync": FeatureFlag(
                name: "feature_background_sync",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_dark_mode": FeatureFlag(
                name: "feature_dark_mode",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_biometric_auth": FeatureFlag(
                name: "feature_biometric_auth",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_barcode_scanner": FeatureFlag(
                name: "feature_barcode_scanner",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_camera": FeatureFlag(
                name: "feature_camera",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_location_tracking": FeatureFlag(
                name: "feature_location_tracking",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_obd2_support": FeatureFlag(
                name: "feature_obd2_support",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            ),
            "feature_document_scanning": FeatureFlag(
                name: "feature_document_scanning",
                enabled: true,
                source: .local,
                lastUpdated: Date()
            )
        ]
    }

    private func initializeFromEnvironment() async {
        let envManager = EnvironmentManager.shared
        guard let config = try? await envManager.configuration else {
            return
        }

        // Initialize flags from environment configuration
        for (flagName, enabled) in config.featureFlags {
            localFlags[flagName] = FeatureFlag(
                name: flagName,
                enabled: enabled,
                source: .environment,
                lastUpdated: Date()
            )
        }
    }

    private func fetchRemoteConfiguration() async {
        // This would typically call Firebase Remote Config
        // For now, we'll simulate a successful fetch
        let mockRemoteFlags: [String: FeatureFlag] = [
            "feature_new_ui": FeatureFlag(
                name: "feature_new_ui",
                enabled: false,
                source: .remote,
                lastUpdated: Date()
            ),
            "feature_experimental_sync": FeatureFlag(
                name: "feature_experimental_sync",
                enabled: false,
                source: .remote,
                lastUpdated: Date()
            )
        ]

        remoteFlags = mockRemoteFlags
    }

    private func evaluateABTest(featureName: String, group: String) -> Bool {
        // Simple hash-based A/B test evaluation
        // In production, use proper A/B testing framework
        let combined = "\(featureName)_\(group)_\(userID)"
        let hash = combined.hashValue
        return hash % 2 == 0
    }

    private func evaluateRollout(featureName: String, percentage: Int) -> Bool {
        // Hash-based rollout percentage calculation
        let combined = "\(featureName)_\(userID)"
        let hash = abs(combined.hashValue)
        let userPercentage = hash % 100
        return userPercentage < percentage
    }
}

// MARK: - Feature Flag Model
struct FeatureFlag {
    let name: String
    let enabled: Bool
    let source: FlagSource
    let lastUpdated: Date
    var abGroup: String? = nil
    var rolloutPercentage: Int? = nil
    var tags: [String] = []
}

// MARK: - Flag Source
enum FlagSource: String {
    case local
    case environment
    case remote
    case abTest
}

// MARK: - Feature Flag Statistics
struct FeatureFlagsStatistics {
    let totalFlags: Int
    let enabledFlags: Int
    let disabledFlags: Int
    let abTestCount: Int
    let rolloutCount: Int
    let lastRemoteUpdate: Date?

    var enabledPercentage: Double {
        guard totalFlags > 0 else { return 0 }
        return Double(enabledFlags) / Double(totalFlags) * 100
    }
}

// MARK: - Feature Flag Enums for Type Safety
enum AppFeature: String {
    // Core Features
    case crashReporting = "feature_crash_reporting"
    case analytics = "feature_analytics"

    // Connectivity Features
    case offlineMode = "feature_offline_mode"
    case backgroundSync = "feature_background_sync"

    // UI Features
    case darkMode = "feature_dark_mode"
    case newUI = "feature_new_ui"

    // Authentication Features
    case biometricAuth = "feature_biometric_auth"

    // Camera & Scanning Features
    case barcodeScanner = "feature_barcode_scanner"
    case camera = "feature_camera"
    case documentScanning = "feature_document_scanning"

    // Location & Tracking Features
    case locationTracking = "feature_location_tracking"

    // Vehicle Features
    case obd2Support = "feature_obd2_support"

    // Experimental Features
    case experimentalSync = "feature_experimental_sync"
}

// MARK: - Convenience Extension for Feature Checks
extension FeatureFlagsManager {

    /// Check if a feature is enabled using typed enum
    func isEnabled(_ feature: AppFeature) -> Bool {
        return isEnabled(feature.rawValue)
    }

    /// Check multiple features - all must be enabled
    func areAllEnabled(_ features: [AppFeature]) -> Bool {
        return features.allSatisfy { isEnabled($0) }
    }

    /// Check multiple features - any must be enabled
    func isAnyEnabled(_ features: [AppFeature]) -> Bool {
        return features.contains { isEnabled($0) }
    }
}

// MARK: - Feature Flag Debug Helper
struct FeatureFlagDebugInfo {
    let feature: String
    let isEnabled: Bool
    let source: FlagSource
    let lastUpdated: Date?
    let abGroup: String?
    let rolloutPercentage: Int?
}

// MARK: - Extension for Debug Information
extension FeatureFlagsManager {

    func getDebugInfo(for featureName: String) -> FeatureFlagDebugInfo? {
        guard let flag = getFlag(featureName) else {
            return nil
        }

        return FeatureFlagDebugInfo(
            feature: featureName,
            isEnabled: isEnabled(featureName),
            source: flag.source,
            lastUpdated: flag.lastUpdated,
            abGroup: abTestingGroups[featureName],
            rolloutPercentage: rolloutPercentages[featureName]
        )
    }

    func getAllDebugInfo() -> [FeatureFlagDebugInfo] {
        let allFlags = Set(localFlags.keys).union(Set(remoteFlags.keys))
        return allFlags.compactMap { getDebugInfo(for: $0) }
    }
}
