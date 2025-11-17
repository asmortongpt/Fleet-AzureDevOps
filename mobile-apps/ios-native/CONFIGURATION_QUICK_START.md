# Configuration Quick Start Guide

Quick reference for setting up and using the configuration management system.

## 5-Minute Setup

### 1. Copy Environment Templates

```bash
cd ios-native
cp .env.development.template .env.development
cp .env.staging.template .env.staging
cp .env.production.template .env.production
```

### 2. Edit Development File

```bash
# Edit .env.development with your local values
# Minimal required values:
FIREBASE_DEVELOPMENT_API_KEY=your-dev-key
AUTH_API_URL=http://localhost:3000/auth
```

### 3. Add to .gitignore

```bash
echo ".env.*" >> .gitignore  # Ignore all .env files
```

### 4. Initialize in App

```swift
// AppDelegate.swift or main app initialization
Task {
    try await EnvironmentManager.shared.loadConfiguration()
    await FeatureFlagsManager.shared.initialize()
}
```

## Common Tasks

### Get API Endpoint

```swift
let endpoint = EnvironmentManager.shared.apiEndpoint("/vehicles")
// Development: http://localhost:3000/vehicles
// Production: https://fleet.capitaltechalliance.com/vehicles
```

### Check Feature Flag

```swift
if EnvironmentManager.shared.isFeatureEnabled(.darkMode) {
    applyDarkMode()
}

// Or use FeatureFlagsManager
if await FeatureFlagsManager.shared.isEnabled(.offlineMode) {
    enableOfflineSync()
}
```

### Get Configuration Value

```swift
guard let config = EnvironmentManager.shared.configuration else {
    fatalError("Configuration not loaded")
}

let timeout = config.connectionTimeout  // 10.0 for dev, 30.0 for prod
let isDebug = config.isDebugBuild        // true for dev, false for prod
```

### Log Build Information

```swift
BuildInfoLogger.logBuildInfo()
// Outputs: Version, Build Date, Git Commit, iOS Version, Device, etc.
```

### Switch Environment (Testing Only)

```swift
try await EnvironmentManager.shared.switchEnvironment(to: .staging)
// Now uses staging configuration
```

## Available Features

### Feature Flags

```swift
enum AppFeature: String {
    case crashReporting
    case analytics
    case darkMode
    case biometricAuth
    case offlineMode
    case backgroundSync
    case barcodeScanner
    case camera
    case locationTracking
    case obd2Support
    case documentScanning
}

// Check
if EnvironmentManager.shared.isFeatureEnabled(.darkMode) { }

// Enable/disable
FeatureFlagsManager.shared.setLocalFlag("feature_dark_mode", enabled: true)
```

## File Locations

```
ios-native/
├── Config/
│   ├── Production.xcconfig
│   ├── Staging.xcconfig
│   └── Development.xcconfig
├── App/
│   ├── EnvironmentManager.swift
│   ├── FeatureFlags.swift
│   └── BuildConfiguration.swift
├── .env.development (not tracked by git)
├── .env.staging (not tracked by git)
├── .env.production (not tracked by git)
├── .env.development.template
├── .env.staging.template
├── .env.production.template
├── CONFIGURATION_GUIDE.md (full documentation)
└── CONFIGURATION_QUICK_START.md (this file)
```

## Environment-Specific Defaults

### Development
- API: `http://localhost:3000`
- HTTPS: No
- Logging: Debug level
- Crash Reporting: Disabled
- Certificate Pinning: Disabled

### Staging
- API: `https://staging-fleet.capitaltechalliance.com`
- HTTPS: Yes
- Logging: Warning level
- Crash Reporting: Enabled
- Certificate Pinning: Enabled

### Production
- API: `https://fleet.capitaltechalliance.com`
- HTTPS: Yes (enforced)
- Logging: Error level only
- Crash Reporting: Enabled
- Certificate Pinning: Required

## Secrets Management

### Store Secrets in Environment Variables

```swift
// Load from environment at runtime
let apiKey = ProcessInfo.processInfo.environment["FIREBASE_API_KEY"]
```

### Or Use Keychain for App Runtime

```swift
// After user logs in
KeychainManager.shared.save(token: token, for: "auth_token")

// Later retrieve
let token = KeychainManager.shared.retrieve(for: "auth_token")
```

### CI/CD Pipeline Secrets

```yaml
# GitHub Actions
env:
  FIREBASE_PRODUCTION_API_KEY: ${{ secrets.FIREBASE_PROD_KEY }}
  AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

## Common Gotchas

### Configuration Not Available

```swift
// ✗ Wrong: Access configuration directly
let timeout = EnvironmentManager.shared.configuration?.connectionTimeout

// ✓ Right: Check it's loaded first
guard let config = EnvironmentManager.shared.configuration else {
    return // Configuration not loaded yet
}
let timeout = config.connectionTimeout
```

### Feature Flag Not Responding to Remote Updates

```swift
// ✓ Call this periodically to check Firebase Remote Config
await FeatureFlagsManager.shared.updateRemoteFlags()

// Check timing - updates are cached for 1 hour by default
```

### HTTPS Certificate Issues in Production

```swift
// ✓ Enable certificate pinning in Production.xcconfig
CERTIFICATE_PINNING_ENABLED = YES

// ✗ Don't disable HTTPS validation for "testing"
// This opens a security vulnerability
```

### Hardcoded Secrets Accidentally Committed

```bash
# Search for secrets in git history
git log -p -S "FIREBASE_API_KEY" -- *.swift

# Or use secret scanning tools
# github.com/zricethezav/gitleaks
```

## Debugging Configuration

### Print All Configuration

```swift
if let config = EnvironmentManager.shared.configuration {
    print("Environment: \(config.environmentName)")
    print("API URL: \(config.apiBaseURL)")
    print("Debug: \(config.isDebugBuild)")
    print("Logging: \(config.logLevel)")
}
```

### Check Feature Flag Status

```swift
let debugInfo = FeatureFlagsManager.shared.getAllDebugInfo()
for flag in debugInfo {
    print("\(flag.feature): \(flag.isEnabled) (\(flag.source))")
}
```

### Verify Build Information

```swift
print(BuildConfiguration.debugInfoString)
// Outputs: Version, Build Date, Device Model, iOS Version, etc.
```

## Testing Different Environments

### Test Staging Configuration

```swift
// In test setup
try await EnvironmentManager.shared.switchEnvironment(to: .staging)

// Now run tests with staging config
// Revert when done
try await EnvironmentManager.shared.switchEnvironment(to: .development)
```

### Test Feature Flags

```swift
// Test with feature disabled
FeatureFlagsManager.shared.setLocalFlag("feature_dark_mode", enabled: false)
assert(!FeatureFlagsManager.shared.isEnabled(.darkMode))

// Test with feature enabled
FeatureFlagsManager.shared.setLocalFlag("feature_dark_mode", enabled: true)
assert(FeatureFlagsManager.shared.isEnabled(.darkMode))
```

## Release Checklist

Before releasing to App Store:

- [ ] All secrets are in `.env.production` (not committed)
- [ ] Production configuration has HTTPS enforced
- [ ] Certificate pinning is enabled
- [ ] Logging is set to `.error` only
- [ ] Crash reporting is enabled
- [ ] Version number is incremented
- [ ] Build number is incremented
- [ ] All feature flags are set for release
- [ ] No debug code remains

## Getting Help

### Configuration Errors

```
Error: "Missing required configuration: apiBaseURL"
→ Check if loadConfiguration() was called
→ Check .env file exists and is readable
```

```
Error: "Security violation: Production must use HTTPS"
→ Check Production.xcconfig has HTTPS enabled
→ Check environment variable FLEET_API_BASE_URL starts with https://
```

### Feature Flags Not Working

```
→ Call await FeatureFlagsManager.shared.initialize()
→ Check feature name matches exactly
→ Check if remote flags were updated with updateRemoteFlags()
```

## Related Documentation

- **Full Guide**: See `CONFIGURATION_GUIDE.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Security**: See `SECURITY.md`

---

**Last Updated**: November 2024
