import Foundation

// MARK: - Environment Configuration Manager
/// Centralized configuration management for different environments (Development, Staging, Production)
/// Handles environment detection, configuration loading, and validation
actor EnvironmentManager {

    // MARK: - Singleton Instance
    static let shared = EnvironmentManager()

    // MARK: - Properties
    private(set) var currentEnvironment: AppEnvironment = .development
    private(set) var configuration: EnvironmentConfiguration?
    private var configurationDidLoadSubject = EnvironmentConfigurationSubject()

    // MARK: - Initialization
    private init() {
        detectEnvironment()
    }

    // MARK: - Public Interface

    /// Load configuration for the current environment
    func loadConfiguration() async throws {
        switch currentEnvironment {
        case .development:
            configuration = EnvironmentConfiguration.development()
        case .staging:
            configuration = EnvironmentConfiguration.staging()
        case .production:
            configuration = EnvironmentConfiguration.production()
        }

        // Validate configuration
        try validate()

        // Notify observers
        configurationDidLoadSubject.send(configuration!)
    }

    /// Switch environment (primarily for testing)
    func switchEnvironment(to environment: AppEnvironment) async throws {
        currentEnvironment = environment
        try await loadConfiguration()
    }

    /// Validate that all required configuration values are present
    func validate() throws {
        guard let config = configuration else {
            throw EnvironmentError.configurationNotLoaded
        }

        // Validate required URLs
        guard !config.apiBaseURL.isEmpty else {
            throw EnvironmentError.missingConfiguration("apiBaseURL")
        }

        // Validate environment name
        guard !config.environmentName.isEmpty else {
            throw EnvironmentError.missingConfiguration("environmentName")
        }

        // Production-specific validations
        if currentEnvironment == .production {
            // Require HTTPS in production
            guard config.apiBaseURL.lowercased().starts(with: "https://") else {
                throw EnvironmentError.securityViolation("Production must use HTTPS")
            }

            // Require certificate pinning in production
            guard config.certificatePinningEnabled else {
                throw EnvironmentError.securityViolation("Certificate pinning must be enabled in production")
            }
        }
    }

    /// Get configuration value with fallback
    func configValue<T>(for key: String, fallback: T) -> T {
        guard let config = configuration else {
            return fallback
        }

        // Use reflection to get value from configuration
        if let value = getConfigurationValue(key, from: config) as? T {
            return value
        }

        return fallback
    }

    /// Check if feature is enabled
    func isFeatureEnabled(_ feature: Feature) -> Bool {
        guard let config = configuration else {
            return feature.defaultValue
        }

        return config.featureFlags[feature.rawValue] ?? feature.defaultValue
    }

    /// Get API endpoint
    func apiEndpoint(_ path: String) -> String {
        guard let config = configuration else {
            return path
        }

        let baseURL = config.apiBaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let cleanPath = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))

        return "\(baseURL)/\(cleanPath)"
    }

    /// MARK: - Private Methods

    private func detectEnvironment() {
        #if DEBUG
        currentEnvironment = .development
        #else
        currentEnvironment = .production
        #endif
    }

    private func getConfigurationValue(_ key: String, from config: EnvironmentConfiguration) -> Any? {
        let mirror = Mirror(reflecting: config)
        for child in mirror.children {
            if let label = child.label, label == key {
                return child.value
            }
        }
        return nil
    }
}

// MARK: - Environment Type
enum AppEnvironment: String, Equatable {
    case development
    case staging
    case production

    var displayName: String {
        switch self {
        case .development:
            return "Development"
        case .staging:
            return "Staging"
        case .production:
            return "Production"
        }
    }
}

// MARK: - Feature Flags
enum Feature: String {
    case crashReporting = "enable_crash_reporting"
    case analytics = "enable_analytics"
    case offlineMode = "enable_offline_mode"
    case backgroundSync = "enable_background_sync"
    case darkMode = "enable_dark_mode"
    case biometricAuth = "enable_biometric_auth"
    case barcodeScanner = "enable_barcode_scanner"
    case cameraSupport = "enable_camera"
    case locationTracking = "enable_location_tracking"
    case obd2Support = "enable_obd2_support"
    case documentScanning = "enable_document_scanning"

    var defaultValue: Bool {
        switch self {
        case .crashReporting, .analytics:
            return false
        default:
            return true
        }
    }
}

// MARK: - Environment Configuration
struct EnvironmentConfiguration {

    // MARK: - API Configuration
    let apiBaseURL: String
    let apiTimeout: TimeInterval

    // MARK: - Azure Configuration
    let azureBaseURL: String
    let azureAPIURL: String
    let azureAppServiceName: String
    let azureResourceGroup: String

    // MARK: - Firebase Configuration
    let firebaseProjectID: String
    let firebaseDatabaseURL: String
    let firebaseStorageBucket: String
    let firebaseAPIKey: String
    let firebaseAppID: String

    // MARK: - Environment Settings
    let environmentName: String
    let environmentID: String
    let isDebugBuild: Bool
    let enableLogging: Bool
    let logLevel: LogLevel

    // MARK: - Feature Flags
    var featureFlags: [String: Bool] {
        [
            Feature.crashReporting.rawValue: enableCrashReporting,
            Feature.analytics.rawValue: enableAnalytics,
            Feature.offlineMode.rawValue: enableOfflineMode,
            Feature.backgroundSync.rawValue: enableBackgroundSync,
            Feature.darkMode.rawValue: enableDarkMode,
            Feature.biometricAuth.rawValue: enableBiometricAuth,
            Feature.barcodeScanner.rawValue: enableBarcodeScanner,
            Feature.cameraSupport.rawValue: enableCamera,
            Feature.locationTracking.rawValue: enableLocationTracking,
            Feature.obd2Support.rawValue: enableOBD2Support,
            Feature.documentScanning.rawValue: enableDocumentScanning
        ]
    }

    // MARK: - Feature Flags
    let enableCrashReporting: Bool
    let enableAnalytics: Bool
    let enableOfflineMode: Bool
    let enableBackgroundSync: Bool
    let enableDarkMode: Bool
    let enableBiometricAuth: Bool
    let enableBarcodeScanner: Bool
    let enableCamera: Bool
    let enableLocationTracking: Bool
    let enableOBD2Support: Bool
    let enableDocumentScanning: Bool

    // MARK: - Security Configuration
    let certificatePinningEnabled: Bool
    let sslPinningEnabled: Bool
    let requireHTTPS: Bool

    // MARK: - Performance Configuration
    let cacheEnabled: Bool
    let cacheTTL: TimeInterval
    let imageCacheSize: Int

    // MARK: - Networking Configuration
    let requestRetryAttempts: Int
    let requestRetryDelay: TimeInterval
    let connectionTimeout: TimeInterval
    let readTimeout: TimeInterval

    // MARK: - Data Persistence
    let databaseEncryptionEnabled: Bool
    let keychainAccessEnabled: Bool
    let allowUnencryptedLocalStorage: Bool

    // MARK: - Version Information
    let versionNumber: String
    let buildNumber: String
    let buildConfiguration: String

    // MARK: - Compliance & Privacy
    let gdprEnabled: Bool
    let privacyPolicyURL: String
    let termsOfServiceURL: String
    let dataRetentionDays: Int

    // MARK: - Factory Methods

    static func development() -> EnvironmentConfiguration {
        EnvironmentConfiguration(
            apiBaseURL: "http://localhost:3000",
            apiTimeout: 10,
            azureBaseURL: "http://localhost:5555",
            azureAPIURL: "http://localhost:5555/api",
            azureAppServiceName: "cta-fleet-management-dev",
            azureResourceGroup: "fleet-management-dev-rg",
            firebaseProjectID: "cta-fleet-development",
            firebaseDatabaseURL: "http://localhost:8080",
            firebaseStorageBucket: "cta-fleet-development.appspot.com",
            firebaseAPIKey: ProcessInfo.processInfo.environment["FIREBASE_DEVELOPMENT_API_KEY"] ?? "dev-key",
            firebaseAppID: "1:111111111:ios:111111111111111",
            environmentName: "Development",
            environmentID: "development",
            isDebugBuild: true,
            enableLogging: true,
            logLevel: .debug,
            enableCrashReporting: false,
            enableAnalytics: false,
            enableOfflineMode: true,
            enableBackgroundSync: true,
            enableDarkMode: true,
            enableBiometricAuth: true,
            enableBarcodeScanner: true,
            enableCamera: true,
            enableLocationTracking: true,
            enableOBD2Support: true,
            enableDocumentScanning: true,
            certificatePinningEnabled: false,
            sslPinningEnabled: false,
            requireHTTPS: false,
            cacheEnabled: true,
            cacheTTL: 600,
            imageCacheSize: 26214400, // 25MB
            requestRetryAttempts: 1,
            requestRetryDelay: 0.5,
            connectionTimeout: 10,
            readTimeout: 10,
            databaseEncryptionEnabled: false,
            keychainAccessEnabled: true,
            allowUnencryptedLocalStorage: true,
            versionNumber: "1.0-dev",
            buildNumber: "0",
            buildConfiguration: "Debug",
            gdprEnabled: false,
            privacyPolicyURL: "http://localhost:3000/privacy",
            termsOfServiceURL: "http://localhost:3000/terms",
            dataRetentionDays: 30
        )
    }

    static func staging() -> EnvironmentConfiguration {
        EnvironmentConfiguration(
            apiBaseURL: "https://staging-fleet.capitaltechalliance.com",
            apiTimeout: 30,
            azureBaseURL: "https://cta-fleet-management-staging.azurewebsites.net",
            azureAPIURL: "https://cta-fleet-management-staging.azurewebsites.net/api",
            azureAppServiceName: "cta-fleet-management-staging",
            azureResourceGroup: "fleet-management-staging-rg",
            firebaseProjectID: "cta-fleet-staging",
            firebaseDatabaseURL: "https://cta-fleet-staging.firebaseio.com",
            firebaseStorageBucket: "cta-fleet-staging.appspot.com",
            firebaseAPIKey: ProcessInfo.processInfo.environment["FIREBASE_STAGING_API_KEY"] ?? "staging-key",
            firebaseAppID: "1:987654321:ios:0987654321fedcba",
            environmentName: "Staging",
            environmentID: "staging",
            isDebugBuild: true,
            enableLogging: true,
            logLevel: .warning,
            enableCrashReporting: true,
            enableAnalytics: true,
            enableOfflineMode: true,
            enableBackgroundSync: true,
            enableDarkMode: true,
            enableBiometricAuth: true,
            enableBarcodeScanner: true,
            enableCamera: true,
            enableLocationTracking: true,
            enableOBD2Support: true,
            enableDocumentScanning: true,
            certificatePinningEnabled: true,
            sslPinningEnabled: true,
            requireHTTPS: true,
            cacheEnabled: true,
            cacheTTL: 3600,
            imageCacheSize: 52428800, // 50MB
            requestRetryAttempts: 3,
            requestRetryDelay: 1.0,
            connectionTimeout: 30,
            readTimeout: 30,
            databaseEncryptionEnabled: true,
            keychainAccessEnabled: true,
            allowUnencryptedLocalStorage: false,
            versionNumber: "1.0",
            buildNumber: "1",
            buildConfiguration: "Debug",
            gdprEnabled: true,
            privacyPolicyURL: "https://staging-fleet.capitaltechalliance.com/privacy",
            termsOfServiceURL: "https://staging-fleet.capitaltechalliance.com/terms",
            dataRetentionDays: 365
        )
    }

    static func production() -> EnvironmentConfiguration {
        EnvironmentConfiguration(
            apiBaseURL: "https://fleet.capitaltechalliance.com",
            apiTimeout: 30,
            azureBaseURL: "https://cta-fleet-management.azurewebsites.net",
            azureAPIURL: "https://cta-fleet-management.azurewebsites.net/api",
            azureAppServiceName: "cta-fleet-management",
            azureResourceGroup: "fleet-management-rg",
            firebaseProjectID: "cta-fleet-production",
            firebaseDatabaseURL: "https://cta-fleet-production.firebaseio.com",
            firebaseStorageBucket: "cta-fleet-production.appspot.com",
            firebaseAPIKey: ProcessInfo.processInfo.environment["FIREBASE_PRODUCTION_API_KEY"] ?? "prod-key",
            firebaseAppID: "1:123456789:ios:abcdef1234567890",
            environmentName: "Production",
            environmentID: "production",
            isDebugBuild: false,
            enableLogging: false,
            logLevel: .error,
            enableCrashReporting: true,
            enableAnalytics: true,
            enableOfflineMode: true,
            enableBackgroundSync: true,
            enableDarkMode: true,
            enableBiometricAuth: true,
            enableBarcodeScanner: true,
            enableCamera: true,
            enableLocationTracking: true,
            enableOBD2Support: true,
            enableDocumentScanning: true,
            certificatePinningEnabled: true,
            sslPinningEnabled: true,
            requireHTTPS: true,
            cacheEnabled: true,
            cacheTTL: 3600,
            imageCacheSize: 52428800, // 50MB
            requestRetryAttempts: 3,
            requestRetryDelay: 1.0,
            connectionTimeout: 30,
            readTimeout: 30,
            databaseEncryptionEnabled: true,
            keychainAccessEnabled: true,
            allowUnencryptedLocalStorage: false,
            versionNumber: "1.0",
            buildNumber: "1",
            buildConfiguration: "Release",
            gdprEnabled: true,
            privacyPolicyURL: "https://fleet.capitaltechalliance.com/privacy",
            termsOfServiceURL: "https://fleet.capitaltechalliance.com/terms",
            dataRetentionDays: 365
        )
    }
}

// MARK: - Error Types
enum EnvironmentError: LocalizedError {
    case configurationNotLoaded
    case missingConfiguration(String)
    case securityViolation(String)
    case invalidEnvironment

    var errorDescription: String? {
        switch self {
        case .configurationNotLoaded:
            return "Configuration has not been loaded"
        case .missingConfiguration(let key):
            return "Missing required configuration: \(key)"
        case .securityViolation(let message):
            return "Security violation: \(message)"
        case .invalidEnvironment:
            return "Invalid environment specified"
        }
    }
}

// MARK: - Log Levels
enum LogLevel: String {
    case debug
    case info
    case warning
    case error
    case critical
}

// MARK: - Configuration Change Observer
class EnvironmentConfigurationSubject {
    private var observers: [(EnvironmentConfiguration) -> Void] = []

    func subscribe(_ observer: @escaping (EnvironmentConfiguration) -> Void) {
        observers.append(observer)
    }

    func send(_ configuration: EnvironmentConfiguration) {
        observers.forEach { $0(configuration) }
    }
}
