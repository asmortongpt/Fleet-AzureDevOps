# Xcode Setup Instructions - iOS Fleet Management App

**Last Updated:** November 11, 2025
**Status:** Complete - All files properly referenced in Xcode project
**Deployment Target:** iOS 15.0
**Swift Version:** 5.7+

---

## Overview

The iOS Fleet Management app is fully configured in Xcode. This guide covers:
- Complete file structure
- Project setup verification
- Build configuration
- Installation of dependencies
- Running on simulator and device

---

## Project Structure

All 53 Swift files are properly organized and referenced in the Xcode build target:

### Core App Files (Root Level)
```
App/
├── FleetManagementApp.swift          # Main app entry point (@main)
├── RootView.swift                    # Authentication gating and root navigation
├── AppDelegate.swift                 # iOS lifecycle management
└── Info.plist                        # App configuration and permissions
```

### Services Layer (API, Network, Data)
```
App/Services/
├── APIConfiguration.swift            # API base URLs and endpoints (dev/prod)
├── AzureNetworkManager.swift         # RESTful network client
├── AzureConfig.swift                 # Azure-specific configuration
├── DataPersistenceManager.swift      # Core Data wrapper
├── LocationManager.swift             # GPS location services
├── TripTrackingService.swift         # Trip recording and tracking
├── NetworkMonitor.swift              # Network reachability monitoring
├── OBD2Manager.swift                 # OBD2 device management
├── OBD2ConnectionManager.swift       # Bluetooth connection handler
└── OBD2DataParser.swift              # OBD2 diagnostic data parsing
```

### Authentication & Security Layer
```
App/Authentication/
├── AuthenticationManager.swift       # Session and token management (MVVM)
├── AuthenticationService.swift       # Login/logout implementation
└── LoginView.swift                   # Login UI

App/Security/
├── KeychainManager.swift             # Secure credential storage
├── CertificatePinningManager.swift   # SSL/TLS certificate pinning
├── EncryptionManager.swift           # AES-256 encryption
├── JailbreakDetector.swift           # Device security detection
├── SecureConfigManager.swift         # Configuration encryption
└── SecurityLogger.swift              # Security event logging
```

### Models Layer (Data Structures)
```
App/Models/
├── Vehicle.swift                     # Basic vehicle model
├── VehicleModel.swift                # Extended vehicle data
├── TripModel.swift                   # Trip data structure
└── FleetModels.swift                 # Shared model definitions
```

### ViewModels Layer (MVVM Business Logic)
```
App/ViewModels/
├── VehicleViewModel.swift            # Vehicle list and detail logic
└── DashboardViewModel.swift          # Dashboard data aggregation
```

### Views Layer (SwiftUI)
```
App/Views/
├── MainTabView.swift                 # Tab-based navigation
├── DashboardView.swift               # Fleet metrics dashboard
├── VehicleListView.swift             # Vehicle list screen
├── VehicleDetailView.swift           # Vehicle detail screen
├── VehicleInspectionView.swift       # Multi-step inspection workflow
├── TripTrackingView.swift            # Active trip tracking
├── TripHistoryView.swift             # Trip history and analytics
├── TripDetailView.swift              # Individual trip details
├── OBD2DiagnosticsView.swift         # OBD2 real-time diagnostics
└── ErrorView.swift                   # Error display component
```

### Components Layer (Reusable UI)
```
App/Components/
├── VehicleCard.swift                 # Vehicle listing card
└── FleetMetricsCard.swift            # Metrics display card
```

### Utilities Layer (Supporting Services)
```
App/Utilities/
├── LoggingManager.swift              # Comprehensive logging
├── ErrorHandler.swift                # Centralized error management
├── NavigationCoordinator.swift       # Navigation state management
└── QuickActionsView.swift            # Quick action shortcuts
```

### Assets
```
App/Assets.xcassets/
├── AppIcon.appiconset/               # App icon variants
├── LaunchScreen.storyboard           # Splash screen
└── [Various image assets]
```

### Test Files
```
AppTests/
├── Unit Tests/
│   ├── AuthenticationTests.swift
│   ├── APIConfigurationTests.swift
│   ├── DataPersistenceTests.swift
│   └── [Additional unit tests]
│
├── UI Tests/
│   ├── NavigationTests.swift
│   └── [Additional UI tests]
│
└── Integration Tests/
    ├── APIIntegrationTests.swift
    └── [Additional integration tests]
```

---

## Verification Checklist

### In Xcode Project
- [ ] All 53 Swift files referenced in "App" target
- [ ] All 53 Swift files referenced in "AppTests" target (for testing)
- [ ] Info.plist present and configured
- [ ] Assets.xcassets exists with app icons
- [ ] Podfile configured with dependencies
- [ ] ExportOptions.plist configured for App Store
- [ ] Build scheme set to "App"

### Required Configuration
- [ ] Team ID set: `FFC6NRQ5U5`
- [ ] Bundle Identifier: `com.capitaltechalliance.fleetmanagement`
- [ ] iOS Deployment Target: 15.0
- [ ] Code Signing: Automatic

### In Project Settings
- [ ] Signing & Capabilities configured
- [ ] Required device capabilities: WiFi, GPS, Bluetooth
- [ ] Background Modes: Location Updates, Bluetooth Peripheral, Bluetooth Central

---

## Installation & Setup

### Prerequisites
```bash
# Minimum requirements
- Xcode 14.0 or later
- macOS 12.0 or later
- CocoaPods 1.11.0 or later
- iOS 15.0 target device/simulator
```

### Step 1: Install CocoaPods Dependencies
```bash
# Navigate to project directory
cd /home/user/Fleet/mobile-apps/ios-native

# Install pod dependencies
pod install

# Output should show:
# Analyzing dependencies
# Downloading dependencies
# Installing dependencies (KeychainSwift, Sentry, Firebase, etc.)
# Generating Pods project
```

### Step 2: Open Workspace (IMPORTANT!)
```bash
# ALWAYS use the workspace, not the project file
open App.xcworkspace

# NOT this:
# open App.xcodeproj  ❌

# The workspace includes CocoaPods dependencies
```

### Step 3: Build Configuration

#### Select Correct Scheme
1. In Xcode, select **"App"** from the Scheme dropdown (top left)
2. Verify "iOS 15.0" is the deployment target
3. Confirm Team ID is set to `FFC6NRQ5U5`

#### Build Settings Verification
```
File > Project Settings
- Build System: New Build System
- Automatic Code Signing: Enabled
- Team ID: FFC6NRQ5U5
```

### Step 4: Build & Run

#### Build for Simulator
```bash
# Keyboard shortcut
Cmd + B

# Or from command line
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator
```

#### Run on Simulator
```bash
# Keyboard shortcut
Cmd + R

# Or select Product > Run (or Cmd + R)
```

#### Run on Physical Device
1. Connect iPhone with USB cable
2. Select your iPhone from the device dropdown (top left)
3. Press Cmd + R
4. Trust the certificate on your device

### Step 5: Verify Installation

#### Check Build Success
```bash
# Build should complete with no errors
# Output should include:
# Build complete!
# ✅ App.app ready for installation
```

#### Run App and Verify
1. App should launch with splash screen
2. Login screen appears
3. Navigation tabs visible at bottom
4. No console errors

---

## Key Build Targets

### App Target
- **Type:** iOS Application
- **Framework:** SwiftUI
- **Files:** 53 Swift files
- **Dependencies:** KeychainSwift, Sentry, Firebase (3 pods)

### AppTests Target
- **Type:** Unit Test Bundle
- **Files:** Test files in AppTests/
- **Dependencies:** XCTest framework
- **Coverage:** Unit, UI, and integration tests

---

## API Endpoints Configuration

### Development Environment
```
Base URL: http://localhost:3000
API Version: /api
Full URL: http://localhost:3000/api

Endpoints:
- POST   /auth/login              # User login
- GET    /auth/me                 # Get current user
- POST   /auth/logout             # Logout
- POST   /auth/refresh            # Refresh token
- GET    /vehicles                # List vehicles
- GET    /vehicles/{id}           # Vehicle details
- GET    /drivers                 # List drivers
- GET    /maintenance             # Maintenance records
- GET    /fleet-metrics           # Fleet statistics
- GET    /health                  # Health check
```

### Production Environment
```
Base URL: https://fleet.capitaltechalliance.com
API Version: /api
Full URL: https://fleet.capitaltechalliance.com/api

Same endpoints as development
(Environment switching handled in APIConfiguration.swift)
```

---

## Building for Different Configurations

### Development Build
```bash
# Default configuration
Cmd + B

# Debug information included
# Connects to localhost:3000
# All logging enabled
```

### Release Build
```bash
# For TestFlight/App Store
Product > Scheme > Edit Scheme
- Run configuration: Release
- Build configuration: Release

Cmd + B  # Build for Release
```

### Create Archive for App Store
```bash
# Method 1: Via Xcode Organizer
Product > Archive

# Method 2: Via command line
xcodebuild archive \
  -workspace App.xcworkspace \
  -scheme App \
  -archivePath "build/App.xcarchive"
```

---

## Troubleshooting

### Common Build Issues

#### Error: "No such module 'KeychainSwift'"
```bash
# Solution: Reinstall pods
pod install --repo-update

# Then clean and rebuild
Cmd + Shift + K  # Clean
Cmd + B          # Build
```

#### Error: "Signing for 'App' requires a development team"
```
1. Open App.xcodeproj (not workspace)
2. Select "App" target
3. Go to "Signing & Capabilities"
4. Select your team from dropdown
5. Automatic provisioning will be enabled
```

#### Error: "Build failed with exit code 65"
```bash
# Common solutions:
# 1. Clean build folder
Cmd + Shift + K

# 2. Delete derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 3. Reinstall pods
pod install --repo-update

# 4. Rebuild
Cmd + B
```

#### Simulator Issues
```bash
# Reset simulator
xcrun simctl erase all

# Or in Xcode:
Device > Erase All Content and Settings...
```

### File Reference Issues

If Swift files are marked with red warning in Xcode:
1. Select "App" target
2. Go to "Build Phases"
3. Expand "Compile Sources"
4. Verify all .swift files are listed
5. If missing, click "+" and add missing files

### CocoaPods Issues
```bash
# Update CocoaPods database
pod repo update

# Reinstall pods
pod install --repo-update

# Update specific pod
pod update KeychainSwift
```

---

## Performance Optimization

### Disable App Thinning for Testing
```
Project Settings > Build Settings
Search: "App Thinning"
Set to: Don't Thin
```

### Enable Code Optimization
```
Project Settings > Build Settings
Search: "Optimization Level"
Release: Fastest, Smallest [-Oz]
Debug: No Optimization [-O0]
```

### Enable Whole Module Optimization
```
Project Settings > Build Settings
Search: "Whole Module Optimization"
Release: Yes
Debug: No
```

---

## Next Steps

1. **Verify Build Success**
   ```bash
   xcodebuild -workspace App.xcworkspace \
     -scheme App \
     -configuration Debug \
     -sdk iphonesimulator \
     build
   ```

2. **Run on Simulator**
   - Open App.xcworkspace
   - Select iPhone 15 simulator
   - Press Cmd + R

3. **Test Core Features**
   - Authentication (login/logout)
   - Vehicle list loading
   - Trip tracking
   - OBD2 connection (on device)

4. **Configure Firebase** (Required for production)
   - See CURRENT_STATUS.md for details
   - Download GoogleService-Info.plist
   - Place in project root

5. **Run Tests**
   - Press Cmd + U to run all tests
   - View coverage report in Xcode

---

## File Size Reference

| Component | Count | Size |
|-----------|-------|------|
| Swift Files | 53 | ~19,488 lines |
| App Bundle | - | ~8-12 MB |
| With Dependencies | - | ~25-30 MB |
| App Store Size | - | ~15-20 MB |

---

## Support Resources

- **Apple Documentation:** https://developer.apple.com/documentation
- **SwiftUI Guides:** https://developer.apple.com/tutorials/swiftui
- **Xcode Help:** Xcode > Help > Xcode Help
- **Project Documentation:** See other .md files in project root

---

**Status:** Ready for build and deployment
**Last Verified:** November 11, 2025