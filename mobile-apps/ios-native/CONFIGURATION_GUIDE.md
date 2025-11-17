# iOS Configuration Management Guide

This guide provides comprehensive documentation for the production-ready configuration management system for the DCF Fleet Management iOS native app.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Configuration Files](#configuration-files)
- [Environment Setup](#environment-setup)
- [Using Configuration Manager](#using-configuration-manager)
- [Feature Flags](#feature-flags)
- [Build Configuration](#build-configuration)
- [Environment Variables](#environment-variables)
- [Security Best Practices](#security-best-practices)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

The configuration management system provides:

- **Environment-specific configurations** (Development, Staging, Production)
- **Centralized configuration management** via `EnvironmentManager`
- **Feature flag system** with local, remote, and A/B testing support
- **Build metadata** and version management
- **Security-first approach** with no hardcoded secrets
- **Easy environment switching** for development and testing

## Architecture

### Components

```
Configuration System
├── Config/
│   ├── Production.xcconfig
│   ├── Staging.xcconfig
│   └── Development.xcconfig
├── App/
│   ├── EnvironmentManager.swift      (Central configuration manager)
│   ├── FeatureFlags.swift            (Feature flag system)
│   └── BuildConfiguration.swift      (Build metadata)
├── .env.development.template         (Template for development secrets)
├── .env.staging.template             (Template for staging secrets)
└── .env.production.template          (Template for production secrets)
```

### Configuration Flow

```
Build Configuration (xcconfig)
          ↓
Environment Detected (DEBUG vs RELEASE)
          ↓
EnvironmentManager.loadConfiguration()
          ↓
EnvironmentConfiguration (environment-specific)
          ↓
FeatureFlags + BuildInfo
          ↓
Application Runtime
```

## Configuration Files

### XCConfig Files

The `.xcconfig` files contain build-time constants and settings for each environment.

#### Production.xcconfig
- **Location**: `Config/Production.xcconfig`
- **Used for**: App Store releases
- **Key Features**:
  - HTTPS enforced
  - Certificate pinning enabled
  - Crash reporting enabled
  - Analytics enabled
  - Minimal logging

#### Staging.xcconfig
- **Location**: `Config/Staging.xcconfig`
- **Used for**: QA and pre-production testing
- **Key Features**:
  - HTTPS enforced
  - Certificate pinning enabled
  - Full logging enabled
  - Analytics enabled
  - Mirrors production behavior

#### Development.xcconfig
- **Location**: `Config/Development.xcconfig`
- **Used for**: Local development
- **Key Features**:
  - HTTP allowed for local testing
  - Certificate pinning disabled
  - Debug logging enabled
  - Analytics disabled
  - Full feature flags enabled

### Swift Configuration Classes

#### EnvironmentManager

Central manager for environment-specific configurations.

**Usage**:
```swift
// Load configuration for current environment
try await EnvironmentManager.shared.loadConfiguration()

// Get API endpoint
let endpoint = EnvironmentManager.shared.apiEndpoint("/vehicles")

// Check if feature is enabled
if EnvironmentManager.shared.isFeatureEnabled(.crashReporting) {
    // Initialize crash reporting
}

// Switch environment (for testing)
try await EnvironmentManager.shared.switchEnvironment(to: .staging)
```

#### FeatureFlagsManager

Comprehensive feature flag management system.

**Usage**:
```swift
// Initialize feature flags
await FeatureFlagsManager.shared.initialize()

// Check if feature is enabled
if FeatureFlagsManager.shared.isEnabled(.crashReporting) {
    // Feature is enabled
}

// Check using typed enums
if await FeatureFlagsManager.shared.isEnabled(.darkMode) {
    // Enable dark mode
}

// Check multiple features
if await FeatureFlagsManager.shared.areAllEnabled([.darkMode, .biometricAuth]) {
    // Both features enabled
}

// Set A/B test group
FeatureFlagsManager.shared.setABTestGroup("feature_new_ui", group: "control")

// Set rollout percentage for gradual deployment
FeatureFlagsManager.shared.setRolloutPercentage("feature_new_ui", percentage: 50)

// Update remote flags from Firebase
await FeatureFlagsManager.shared.updateRemoteFlags()

// Get debug statistics
let stats = FeatureFlagsManager.shared.getStatistics()
print("Total flags: \(stats.totalFlags), Enabled: \(stats.enabledFlags)")
```

#### BuildConfiguration

Build metadata and version information.

**Usage**:
```swift
// Get version information
print("Version: \(BuildConfiguration.versionString)")
print("Build Date: \(BuildConfiguration.buildDateString)")

// Get device information
print("Device: \(BuildConfiguration.deviceModelName)")
print("iOS Version: \(BuildConfiguration.iOSVersion)")

// Check build type
if BuildConfiguration.isDebugBuild {
    print("Debug build")
} else {
    print("Release build")
}

// Get all debug info
print(BuildConfiguration.debugInfoString)

// Compare versions
if BuildConfiguration.isVersionNewer(than: "1.0.0") {
    // Current version is newer
}

// Log build info at startup
BuildInfoLogger.logBuildInfo()
BuildInfoLogger.logWarningsIfNeeded()
```

## Environment Setup

### Step 1: Copy Environment Templates

```bash
cd /path/to/ios-native

# Copy templates for each environment
cp .env.development.template .env.development
cp .env.staging.template .env.staging
cp .env.production.template .env.production
```

### Step 2: Fill in Secrets

**Development**:
```bash
# .env.development
# Replace placeholders with your local development values
FIREBASE_DEVELOPMENT_API_KEY=your-dev-firebase-key
AUTH_API_URL=http://localhost:3000/auth
```

**Staging**:
```bash
# .env.staging
# Use Azure Key Vault for secrets in staging
FIREBASE_STAGING_API_KEY=$(az keyvault secret show --vault-name fleet-staging-kv --name firebase-api-key --query value -o tsv)
AZURE_TENANT_ID=$(az keyvault secret show --vault-name fleet-staging-kv --name azure-tenant-id --query value -o tsv)
```

**Production**:
```bash
# .env.production
# NEVER commit this file
# Use CI/CD pipeline to inject secrets at build time
# Example using GitHub Actions:
# env:
#   FIREBASE_PRODUCTION_API_KEY: ${{ secrets.FIREBASE_PRODUCTION_API_KEY }}
#   AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

### Step 3: Load Secrets in App Initialization

```swift
// In AppDelegate.swift or main app initialization

func application(_ application: UIApplication,
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    // Load environment configuration
    Task {
        do {
            try await EnvironmentManager.shared.loadConfiguration()
            await FeatureFlagsManager.shared.initialize()
            BuildInfoLogger.logBuildInfo()
        } catch {
            print("Configuration error: \(error)")
            // Handle configuration loading error
        }
    }

    return true
}
```

### Step 4: Add to .gitignore

```bash
# Environment-specific files
.env.development
.env.staging
.env.production
.env.local

# Secrets and credentials
*.mobileprovision
*.p8
*.p12
*.cer
*.key
Certificates.p12
```

## Using Configuration Manager

### Basic Usage

```swift
import Foundation

class MyViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Load configuration
        Task {
            do {
                try await EnvironmentManager.shared.loadConfiguration()
                setupAPI()
            } catch {
                showError(error)
            }
        }
    }

    func setupAPI() {
        let envManager = EnvironmentManager.shared

        // Get API endpoint
        let endpoint = envManager.apiEndpoint("/vehicles")

        // Get timeout configuration
        if let config = envManager.configuration {
            let timeout = config.apiTimeout
            // Use timeout in URLSession configuration
        }

        // Check feature flags
        if envManager.isFeatureEnabled(.offlineMode) {
            enableOfflineSupport()
        }
    }
}
```

### API Configuration Example

```swift
class APIClient {

    static func configureSession() -> URLSession {
        let envManager = EnvironmentManager.shared
        guard let config = envManager.configuration else {
            return URLSession.shared
        }

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = config.connectionTimeout
        configuration.timeoutIntervalForResource = config.readTimeout

        // Add certificate pinning if enabled
        if config.certificatePinningEnabled {
            // Configure certificate pinning
        }

        return URLSession(configuration: configuration)
    }

    static func createRequest(path: String) -> URLRequest? {
        let envManager = EnvironmentManager.shared
        let url = envManager.apiEndpoint(path)

        guard let fullURL = URL(string: url) else { return nil }

        var request = URLRequest(url: fullURL)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        return request
    }
}
```

## Feature Flags

### Local Feature Flags

Feature flags defined in the app code and configuration:

```swift
enum AppFeature: String {
    case crashReporting = "feature_crash_reporting"
    case darkMode = "feature_dark_mode"
    case newUI = "feature_new_ui"
    // ... more features
}
```

### Remote Feature Flags

Feature flags from Firebase Remote Config:

```swift
// Update remote flags (cached for 1 hour)
await FeatureFlagsManager.shared.updateRemoteFlags()

// Check remote flag
if FeatureFlagsManager.shared.isEnabled("feature_new_ui") {
    // Use new UI
}
```

### A/B Testing

```swift
// Set A/B test group
FeatureFlagsManager.shared.setABTestGroup("feature_new_ui", group: "variant_a")

// Check if feature is enabled for this user's A/B group
if FeatureFlagsManager.shared.isEnabled("feature_new_ui") {
    // Show variant A
}
```

### Gradual Rollout

```swift
// Gradually rollout a new feature to 25% of users
FeatureFlagsManager.shared.setRolloutPercentage("feature_new_ui", percentage: 25)

// Later increase to 50%
FeatureFlagsManager.shared.setRolloutPercentage("feature_new_ui", percentage: 50)

// Finally rollout to everyone
FeatureFlagsManager.shared.setRolloutPercentage("feature_new_ui", percentage: 100)
```

### Debug Information

```swift
// Get all enabled features
let enabled = FeatureFlagsManager.shared.getEnabledFeatures()

// Get statistics
let stats = FeatureFlagsManager.shared.getStatistics()
print("Total: \(stats.totalFlags), Enabled: \(stats.enabledFlags)")
print("A/B Tests: \(stats.abTestCount), Rollouts: \(stats.rolloutCount)")

// Get detailed info for a feature
if let info = FeatureFlagsManager.shared.getDebugInfo(for: "feature_new_ui") {
    print("Feature: \(info.feature)")
    print("Enabled: \(info.isEnabled)")
    print("Source: \(info.source)")
    print("A/B Group: \(info.abGroup ?? "none")")
    print("Rollout: \(info.rolloutPercentage ?? 0)%")
}
```

## Build Configuration

### Version Information

```swift
// Get version string
let version = BuildConfiguration.versionString // "1.0.0 (2)"

// Check version
if BuildConfiguration.isVersionNewer(than: "0.9.0") {
    // Show upgrade prompt
}
```

### Build Information

```swift
// Get git information
let commit = BuildConfiguration.gitCommitSHAShort // "a1b2c3d"
let branch = BuildConfiguration.gitBranch // "main"

// Use in crash reports
crashReporter.setTag("git_commit", value: BuildConfiguration.gitCommitSHA)
crashReporter.setTag("build_date", value: BuildConfiguration.buildDateString)
```

### Device Information

```swift
// Get device details
let model = BuildConfiguration.deviceModelName // "iPhone14,2"
let os = BuildConfiguration.iOSVersion // "17.0"
let disk = BuildConfiguration.availableDiskSpaceFormatted // "256 GB"

// Include in analytics
analytics.setProperty("device_model", value: model)
analytics.setProperty("ios_version", value: os)
```

### Debug Logging

```swift
// Log all build info at app startup
BuildInfoLogger.logBuildInfo()

// Check for warnings
BuildInfoLogger.logWarningsIfNeeded()

// In debug builds, log detailed info
#if DEBUG
print(BuildConfiguration.debugInfoString)
#endif
```

## Environment Variables

### Development Environment

| Variable | Example | Description |
|----------|---------|-------------|
| `FLEET_API_BASE_URL` | `http://localhost:3000` | Local API server |
| `LOG_LEVEL` | `debug` | Verbose logging |
| `FEATURE_CRASH_REPORTING` | `false` | Disable crash reporting in dev |
| `ALLOW_HTTP_CONNECTIONS` | `true` | Allow insecure connections |
| `CERTIFICATE_PINNING_ENABLED` | `false` | Disable pinning for local testing |

### Staging Environment

| Variable | Example | Description |
|----------|---------|-------------|
| `FLEET_API_BASE_URL` | `https://staging-fleet.capitaltechalliance.com` | Staging API |
| `LOG_LEVEL` | `warning` | Limited logging |
| `FEATURE_CRASH_REPORTING` | `true` | Enable crash reporting |
| `CERTIFICATE_PINNING_ENABLED` | `true` | Enable pinning |

### Production Environment

| Variable | Example | Description |
|----------|---------|-------------|
| `FLEET_API_BASE_URL` | `https://fleet.capitaltechalliance.com` | Production API |
| `LOG_LEVEL` | `error` | Minimal logging |
| `CERTIFICATE_PINNING_ENABLED` | `true` | Enforce pinning |
| `ALLOW_HTTP_CONNECTIONS` | `false` | HTTPS only |

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env.development
.env.staging
.env.production
.env.local
```

### 2. Use Environment Variables for Secrets

```swift
// ✓ Good: Get from environment
let apiKey = ProcessInfo.processInfo.environment["FIREBASE_API_KEY"]

// ✗ Bad: Hardcoded secret
let apiKey = "AIzaSyDu3opH0_9uKc5K3_dKyX2P" // NEVER!
```

### 3. Use Keychain for Sensitive Data

```swift
// Store sensitive data in Keychain
KeychainManager.shared.save(token: token, for: key: "auth_token")

// Retrieve from Keychain
let token = KeychainManager.shared.retrieve(for: "auth_token")
```

### 4. Enforce HTTPS in Production

```swift
// In Production.xcconfig
REQUIRE_HTTPS = YES

// Verify in code
if BuildConfiguration.isReleaseBuild {
    assert(config.requireHTTPS, "HTTPS must be required in production")
}
```

### 5. Enable Certificate Pinning

```swift
// In Production.xcconfig
CERTIFICATE_PINNING_ENABLED = YES
SSL_PINNING_ENABLED = YES

// Implement certificate pinning in APIClient
let certificateData = Bundle.main.data(withName: "certificate.cer")
URLSessionConfiguration.configureCertificatePinning(with: certificateData)
```

### 6. Disable Debug Features in Production

```swift
// Development tools should be disabled
if BuildConfiguration.isReleaseBuild {
    assert(!isLoggingEnabled, "Logging must be disabled in production")
    assert(!debuggingToolsEnabled, "Debugging tools must be disabled")
}
```

### 7. Validate Configuration at Startup

```swift
do {
    try await EnvironmentManager.shared.loadConfiguration()
    try EnvironmentManager.shared.validate()
} catch EnvironmentError.securityViolation(let message) {
    fatalError("Security validation failed: \(message)")
}
```

## Deployment Checklist

### Pre-Release Checks

- [ ] All environment-specific configuration files are properly configured
- [ ] Production configuration has HTTPS enforced
- [ ] Certificate pinning is enabled in production
- [ ] All secrets are externalized (not in code)
- [ ] Debug logging is disabled in production build
- [ ] Crash reporting is enabled in staging and production
- [ ] Feature flags are properly set for release
- [ ] Analytics is enabled in staging and production
- [ ] Version number and build number are incremented

### Build Configuration

```bash
# Build for production
xcodebuild archive \
  -workspace App.xcworkspace \
  -scheme FleetManagement \
  -configuration Release \
  -archivePath build/FleetManagement.xcarchive
```

### Pre-Deployment Testing

- [ ] Test in development environment
- [ ] Test in staging environment
- [ ] Verify all feature flags work correctly
- [ ] Test crash reporting
- [ ] Test analytics events
- [ ] Verify API connectivity
- [ ] Test offline functionality
- [ ] Verify version information displays correctly

### Production Deployment

- [ ] Secrets are injected via CI/CD pipeline
- [ ] Configuration is validated at startup
- [ ] Monitoring is enabled
- [ ] Rollback plan is ready
- [ ] Release notes are prepared

## Troubleshooting

### Configuration Not Loading

```swift
// Enable debug logging
if let config = EnvironmentManager.shared.configuration {
    print("Config loaded: \(config.environmentName)")
} else {
    print("Configuration not loaded")
    // Check if loadConfiguration() was called
    try await EnvironmentManager.shared.loadConfiguration()
}
```

### Feature Flag Not Working

```swift
// Check feature flag status
let flags = FeatureFlagsManager.shared.getAllDebugInfo()
for flag in flags {
    print("\(flag.feature): \(flag.isEnabled) (source: \(flag.source))")
}
```

### API Connection Issues

```swift
// Check API configuration
let endpoint = EnvironmentManager.shared.apiEndpoint("/health")
print("API Endpoint: \(endpoint)")

// Verify HTTPS requirement in production
if BuildConfiguration.isReleaseBuild {
    let hasHTTPS = endpoint.lowercased().starts(with: "https://")
    print("HTTPS enforced: \(hasHTTPS)")
}
```

### Build Information Missing

```swift
// Verify Info.plist has required keys
let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"]
let build = Bundle.main.infoDictionary?["CFBundleVersion"]
print("Version: \(version ?? "missing"), Build: \(build ?? "missing")")
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Build iOS App

on: [push, pull_request]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Load Secrets
        env:
          FIREBASE_PROD_KEY: ${{ secrets.FIREBASE_PROD_API_KEY }}
          AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
        run: |
          echo "export FIREBASE_PRODUCTION_API_KEY=${FIREBASE_PROD_KEY}" >> build.env
          echo "export AZURE_SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}" >> build.env

      - name: Build App
        run: |
          source build.env
          xcodebuild archive \
            -workspace ios-native/App.xcworkspace \
            -scheme FleetManagement \
            -configuration Release
```

## Additional Resources

- [Apple Configuration Guide](https://developer.apple.com/documentation/xcode/configuring-the-build-settings-of-your-project)
- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)
- [OWASP iOS Security](https://cheatsheetseries.owasp.org/cheatsheets/IOS_Security_Testing_Cheat_Sheet.html)

---

For questions or issues with the configuration system, please contact the DevOps team or refer to the main architecture documentation.
