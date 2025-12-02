# Configuration Integration Examples

This document shows how to integrate the configuration system into your app.

## AppDelegate Integration

### Complete AppDelegate Example

```swift
import UIKit
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Step 1: Initialize configuration system
        Task {
            await initializeConfiguration()
        }

        // Step 2: Request user permissions
        requestNotificationPermissions()

        // Step 3: Initialize analytics
        Task {
            await initializeAnalytics()
        }

        return true
    }

    // MARK: - Configuration Initialization

    private func initializeConfiguration() async {
        do {
            // Load environment-specific configuration
            try await EnvironmentManager.shared.loadConfiguration()

            // Initialize feature flags
            await FeatureFlagsManager.shared.initialize()

            // Log build information
            BuildInfoLogger.logBuildInfo()
            BuildInfoLogger.logWarningsIfNeeded()

            // Validate configuration
            try EnvironmentManager.shared.validate()

            print("Configuration loaded successfully")

        } catch EnvironmentError.configurationNotLoaded {
            print("ERROR: Configuration failed to load")
            showConfigurationError()

        } catch EnvironmentError.securityViolation(let message) {
            print("SECURITY ERROR: \(message)")
            fatalError("Security validation failed: \(message)")

        } catch {
            print("Configuration error: \(error)")
            showConfigurationError()
        }
    }

    // MARK: - Analytics Initialization

    private func initializeAnalytics() async {
        guard let config = EnvironmentManager.shared.configuration else {
            return
        }

        // Only initialize analytics if enabled in configuration
        guard config.enableAnalytics else {
            print("Analytics disabled in configuration")
            return
        }

        // Initialize Amplitude
        // Amplitude.instance.initializeAmplitude(with: config.amplitudeAPIKey)

        // Initialize crash reporting if enabled
        if config.enableCrashReporting {
            initializeCrashReporting()
        }
    }

    private func initializeCrashReporting() {
        // Initialize Sentry or similar crash reporting service
        // Sentry.start { options in
        //     options.dsn = "your-sentry-dsn"
        //     options.environment = EnvironmentManager.shared.currentEnvironment.rawValue
        //     options.release = BuildConfiguration.versionString
        // }
    }

    // MARK: - Notifications

    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
    }

    // MARK: - Error Handling

    private func showConfigurationError() {
        // Show user-friendly error message
        let alert = UIAlertController(
            title: "Configuration Error",
            message: "Failed to load application configuration. Please restart the app.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))

        if let window = window?.rootViewController {
            window.present(alert, animated: true)
        }
    }

    // MARK: - Lifecycle Methods

    func applicationWillTerminate(_ application: UIApplication) {
        // Clean up resources if needed
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Pause background sync if needed
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Resume background sync if needed
    }
}
```

## Network Configuration Integration

### URLSession Configuration Example

```swift
class NetworkManager {

    static let shared = NetworkManager()

    private var session: URLSession?

    private init() {
        configureSession()
    }

    // MARK: - Session Configuration

    private func configureSession() {
        Task {
            await setupURLSession()
        }
    }

    private func setupURLSession() async {
        guard let config = EnvironmentManager.shared.configuration else {
            session = URLSession.shared
            return
        }

        let sessionConfig = URLSessionConfiguration.default

        // Set timeout intervals
        sessionConfig.timeoutIntervalForRequest = config.connectionTimeout
        sessionConfig.timeoutIntervalForResource = config.readTimeout

        // Configure cache
        if config.cacheEnabled {
            let cacheConfig = URLCache(
                memoryCapacity: 10_000_000,
                diskCapacity: Int(config.imageCacheSize),
                diskPath: "network_cache"
            )
            sessionConfig.urlCache = cacheConfig
            sessionConfig.requestCachePolicy = .useProtocolCachePolicy
        } else {
            sessionConfig.urlCache = nil
            sessionConfig.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        }

        // Configure SSL/TLS
        sessionConfig.tlsMinimumSupportedProtocolVersion = .tlsVersion12

        // Create session with delegate for certificate pinning
        let delegate = CertificatePinningDelegate(
            pinningSEnabled: config.certificatePinningEnabled
        )
        session = URLSession(configuration: sessionConfig, delegate: delegate, delegateQueue: nil)
    }

    // MARK: - API Requests

    func makeRequest(path: String, method: HTTPMethod = .GET) async throws -> (data: Data, response: URLResponse) {
        guard let session = session else {
            throw NetworkError.sessionNotConfigured
        }

        let endpoint = EnvironmentManager.shared.apiEndpoint(path)
        guard let url = URL(string: endpoint) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        return try await session.data(for: request)
    }
}

enum NetworkError: Error {
    case sessionNotConfigured
    case invalidURL
}

enum HTTPMethod: String {
    case GET
    case POST
    case PUT
    case DELETE
    case PATCH
}
```

## API Configuration Integration

### Update APIConfiguration.swift

```swift
import Foundation

struct APIConfiguration {

    // MARK: - Get Configuration from EnvironmentManager

    static func getBaseURL() -> String {
        return EnvironmentManager.shared.apiEndpoint("")
    }

    static func getTimeout() -> TimeInterval {
        return EnvironmentManager.shared.configuration?.apiTimeout ?? 30
    }

    static func getRetryCount() -> Int {
        return EnvironmentManager.shared.configuration?.requestRetryAttempts ?? 3
    }

    // MARK: - API Endpoints

    static func vehiclesEndpoint() -> String {
        return EnvironmentManager.shared.apiEndpoint("/vehicles")
    }

    static func driversEndpoint() -> String {
        return EnvironmentManager.shared.apiEndpoint("/drivers")
    }

    static func maintenanceEndpoint() -> String {
        return EnvironmentManager.shared.apiEndpoint("/maintenance")
    }

    static func fleetMetricsEndpoint() -> String {
        return EnvironmentManager.shared.apiEndpoint("/fleet-metrics")
    }

    // MARK: - Request Headers

    static func defaultHeaders() -> [String: String] {
        var headers: [String: String] = [
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "DCF-Fleet-iOS/\(BuildConfiguration.versionNumber)",
            "X-App-Version": BuildConfiguration.versionString,
            "X-Build-Date": BuildConfiguration.buildDateString,
            "X-Git-Commit": BuildConfiguration.gitCommitSHAShort
        ]

        if let environment = EnvironmentManager.shared.configuration?.environmentName {
            headers["X-Environment"] = environment
        }

        return headers
    }

    // MARK: - Health Check

    static func healthCheckEndpoint() -> String {
        return EnvironmentManager.shared.apiEndpoint("/health")
    }

    static func testConnection() async -> ConnectionStatus {
        let endpoint = healthCheckEndpoint()
        guard let url = URL(string: endpoint) else {
            return .failed("Invalid URL")
        }

        do {
            let (data, response) = try await URLSession.shared.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse else {
                return .failed("Invalid response")
            }

            if httpResponse.statusCode == 200 {
                return .connected
            } else {
                return .failed("HTTP \(httpResponse.statusCode)")
            }

        } catch {
            return .failed(error.localizedDescription)
        }
    }
}

enum ConnectionStatus {
    case connected
    case degraded(String)
    case failed(String)

    var isAvailable: Bool {
        switch self {
        case .connected:
            return true
        default:
            return false
        }
    }
}
```

## View Controller Integration

### Example: Dashboard View Controller

```swift
import UIKit

class DashboardViewController: UIViewController {

    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var featureToggleSwitch: UISwitch!

    override func viewDidLoad() {
        super.viewDidLoad()

        setupUI()
        setupFeatureFlags()
        loadData()
    }

    // MARK: - UI Setup

    private func setupUI() {
        // Use environment-specific theme
        if let config = EnvironmentManager.shared.configuration {
            if config.enableDarkMode {
                applyDarkTheme()
            }

            // Show environment indicator in development
            if config.isDebugBuild {
                titleLabel.text = "Dashboard [\(config.environmentName)]"
            } else {
                titleLabel.text = "Dashboard"
            }
        }
    }

    private func setupFeatureFlags() {
        // Configure UI based on feature flags
        if EnvironmentManager.shared.isFeatureEnabled(.barcodeScanner) {
            addBarcodeScannerButton()
        }

        if EnvironmentManager.shared.isFeatureEnabled(.documentScanning) {
            addDocumentScannerButton()
        }

        if EnvironmentManager.shared.isFeatureEnabled(.darkMode) {
            featureToggleSwitch.isOn = true
        }
    }

    private func loadData() {
        Task {
            await fetchFleetData()
            updateStatus()
        }
    }

    // MARK: - Data Loading

    private func fetchFleetData() async {
        do {
            // Use configured API endpoint
            let endpoint = EnvironmentManager.shared.apiEndpoint("/vehicles")
            print("Fetching from: \(endpoint)")

            // Make API request
            // let vehicles = try await APIClient.shared.fetchVehicles()
            // updateUI(with: vehicles)

        } catch {
            showError(error)
        }
    }

    private func updateStatus() {
        guard let config = EnvironmentManager.shared.configuration else {
            statusLabel.text = "Configuration not loaded"
            return
        }

        let status = """
        Environment: \(config.environmentName)
        API: \(config.apiBaseURL)
        Debug: \(config.isDebugBuild)
        """

        statusLabel.text = status
    }

    // MARK: - Theming

    private func applyDarkTheme() {
        view.backgroundColor = .darkGray
        titleLabel.textColor = .white
        statusLabel.textColor = .lightGray
    }

    // MARK: - Error Handling

    private func showError(_ error: Error) {
        let alert = UIAlertController(
            title: "Error",
            message: error.localizedDescription,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    // MARK: - Actions

    @IBAction func addBarcodeScannerButton() {
        // Add barcode scanner button to UI
    }

    @IBAction func addDocumentScannerButton() {
        // Add document scanner button to UI
    }
}
```

## Testing Integration

### Unit Tests with Configuration

```swift
import XCTest

class ConfigurationTests: XCTestCase {

    override func setUp() async throws {
        try await super.setUp()

        // Load test configuration
        try await EnvironmentManager.shared.switchEnvironment(to: .development)
    }

    override func tearDown() async throws {
        try await super.tearDown()
        // Clean up if needed
    }

    func testConfigurationLoads() async throws {
        try await EnvironmentManager.shared.loadConfiguration()
        XCTAssertNotNil(EnvironmentManager.shared.configuration)
    }

    func testDevelopmentEnvironment() async throws {
        try await EnvironmentManager.shared.switchEnvironment(to: .development)
        let config = EnvironmentManager.shared.configuration

        XCTAssertTrue(config?.isDebugBuild ?? false)
        XCTAssertTrue(config?.apiBaseURL.contains("localhost") ?? false)
    }

    func testProductionEnvironment() async throws {
        try await EnvironmentManager.shared.switchEnvironment(to: .production)
        let config = EnvironmentManager.shared.configuration

        XCTAssertFalse(config?.isDebugBuild ?? true)
        XCTAssertTrue(config?.apiBaseURL.starts(with: "https://") ?? false)
        XCTAssertTrue(config?.certificatePinningEnabled ?? false)
    }

    func testFeatureFlags() async throws {
        await FeatureFlagsManager.shared.initialize()

        // Test that features can be toggled
        FeatureFlagsManager.shared.setLocalFlag("feature_test", enabled: true)
        XCTAssertTrue(FeatureFlagsManager.shared.isEnabled("feature_test"))

        FeatureFlagsManager.shared.setLocalFlag("feature_test", enabled: false)
        XCTAssertFalse(FeatureFlagsManager.shared.isEnabled("feature_test"))
    }

    func testBuildConfiguration() {
        let version = BuildConfiguration.versionString
        XCTAssertFalse(version.isEmpty)

        let buildDate = BuildConfiguration.buildDateString
        XCTAssertFalse(buildDate.isEmpty)

        XCTAssertTrue(BuildConfiguration.supports64bit)
    }
}
```

## CI/CD Integration

### Build Script Example

```bash
#!/bin/bash

# build.sh - Build iOS app with configuration

set -e

ENVIRONMENT="${1:-development}"
BUILD_OUTPUT="build"

echo "Building for environment: $ENVIRONMENT"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    export $(cat ".env.${ENVIRONMENT}" | xargs)
    echo "Loaded .env.${ENVIRONMENT}"
else
    echo "ERROR: .env.${ENVIRONMENT} not found"
    exit 1
fi

# Select configuration based on environment
case $ENVIRONMENT in
    development)
        CONFIGURATION="Debug"
        SCHEME="FleetManagement"
        ;;
    staging)
        CONFIGURATION="Debug"
        SCHEME="FleetManagement"
        ;;
    production)
        CONFIGURATION="Release"
        SCHEME="FleetManagement"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "Building with configuration: $CONFIGURATION"

# Build archive
xcodebuild archive \
    -workspace ios-native/App.xcworkspace \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$BUILD_OUTPUT/FleetManagement.xcarchive" \
    -xcconfig "ios-native/Config/${ENVIRONMENT^}.xcconfig"

echo "Build completed successfully"
```

### GitHub Actions Workflow Example

```yaml
name: Build and Deploy iOS

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: macos-latest
    strategy:
      matrix:
        environment: [development, staging, production]

    steps:
      - uses: actions/checkout@v3

      - name: Setup environment
        env:
          FIREBASE_DEV_KEY: ${{ secrets.FIREBASE_DEV_API_KEY }}
          FIREBASE_STAGING_KEY: ${{ secrets.FIREBASE_STAGING_API_KEY }}
          FIREBASE_PROD_KEY: ${{ secrets.FIREBASE_PROD_API_KEY }}
        run: |
          if [ "${{ matrix.environment }}" = "development" ]; then
            export FIREBASE_DEVELOPMENT_API_KEY=$FIREBASE_DEV_KEY
          elif [ "${{ matrix.environment }}" = "staging" ]; then
            export FIREBASE_STAGING_API_KEY=$FIREBASE_STAGING_KEY
          elif [ "${{ matrix.environment }}" = "production" ]; then
            export FIREBASE_PRODUCTION_API_KEY=$FIREBASE_PROD_KEY
          fi

      - name: Build
        run: |
          bash build.sh ${{ matrix.environment }}

      - name: Upload to App Store Connect
        if: matrix.environment == 'production'
        run: |
          # Upload build to App Store
          xcrun altool --upload-app --type ios \
            --file "build/FleetManagement.ipa" \
            --username ${{ secrets.APP_STORE_USERNAME }} \
            --password ${{ secrets.APP_STORE_PASSWORD }}
```

---

For more information, see `CONFIGURATION_GUIDE.md` and `CONFIGURATION_QUICK_START.md`.
