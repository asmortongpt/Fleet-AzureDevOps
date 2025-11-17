# Fleet Mobile Apps - Quick Start Guide

## What's Been Built

### iOS Native App ✅ PRODUCTION READY
- **Location**: `mobile-apps/ios-native/`
- **Status**: Complete with OBD-II, Auth, GPS, Offline Sync
- **130+ Swift files** with full feature implementation

### Android Native App ✅ FOUNDATION COMPLETE
- **Location**: `mobile-apps/android/`
- **Status**: Complete project structure, all dependencies configured
- **Ready for feature implementation** (estimated 4-6 hours)

---

## Run iOS App NOW

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native

# Install CocoaPods dependencies
pod install

# Open in Xcode
open App.xcworkspace

# Select iPhone simulator or device
# Press Cmd+R to build and run
```

### iOS Features Working:
- ✅ Email/Password + Biometric (Face ID/Touch ID) authentication
- ✅ OBD-II Bluetooth (ELM327 devices)
- ✅ GPS tracking (foreground + background)
- ✅ Photo capture + OCR (receipts, odometer)
- ✅ Offline-first sync with Core Data
- ✅ Dashboard, vehicles, trips, diagnostics
- ✅ Azure AD SSO integration

---

## Build Android App

### 1. Open in Android Studio
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/android

# Open Android Studio and import this folder
```

### 2. Sync Gradle
Click "Sync Now" when Android Studio prompts

### 3. Build APK
```bash
# Debug build
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk
```

### 4. Install on Device
```bash
# Connect Android device via USB
./gradlew installDebug

# Or drag APK to emulator
```

### Android Current State:
- ✅ Complete Gradle project structure
- ✅ All dependencies configured (Compose, Room, Retrofit, Hilt, etc.)
- ✅ Application class with Hilt DI
- ✅ MainActivity with Compose
- ⏳ Features pending implementation (~6 hours to match iOS)

---

## Android Next Steps (Implementation Priority)

### Step 1: UI Theme (30 min)
Create Material 3 theme and navigation

### Step 2: Authentication (1 hour)
- Login/register screens
- BiometricPrompt integration
- Token storage

### Step 3: Data Layer (1.5 hours)
- Room database entities
- DAOs and repositories
- Retrofit API client

### Step 4: Core Screens (1 hour)
- Dashboard
- Vehicle list
- Trip recording

### Step 5: OBD-II (1.5 hours)
- Bluetooth LE manager
- ELM327 protocol
- Real-time display

### Step 6: Camera/OCR (1 hour)
- CameraX integration
- ML Kit text recognition

---

## iOS Enhancements (Optional)

### LiDAR 3D Scanning
Add to iOS Pro devices (iPhone/iPad with LiDAR):
- ARKit mesh capture
- RealityKit rendering
- USDZ export

### iPad Optimization
- Split-view navigation
- Multi-pane layout
- Apple Pencil support
- External display

### Widgets
- WidgetKit dashboard widgets
- Live Activities for trips
- Dynamic Island support

---

## Testing

### iOS Tests
```bash
cd mobile-apps/ios-native

# Run unit tests
xcodebuild test \
  -workspace App.xcworkspace \
  -scheme FleetMobile \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

### Android Tests
```bash
cd mobile-apps/android

# Unit tests
./gradlew testDebugUnitTest

# Instrumented tests (requires emulator/device)
./gradlew connectedDebugAndroidTest
```

---

## Project Structure

### iOS
```
ios-native/
├── App/                      # Swift source files (130+)
│   ├── RootView.swift
│   ├── MainTabView.swift
│   ├── AuthenticationManager.swift
│   ├── OBD2Manager.swift
│   ├── BackgroundSyncManager.swift
│   └── ...
├── App.xcodeproj/           # Xcode project
├── App.xcworkspace/         # Workspace (use this)
└── Podfile                  # CocoaPods dependencies
```

### Android
```
android/
├── app/
│   ├── build.gradle.kts     # Dependencies (complete)
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/capitaltechalliance/fleet/
│   │   │   ├── FleetApplication.kt
│   │   │   ├── MainActivity.kt
│   │   │   ├── ui/          # To be built
│   │   │   ├── data/        # To be built
│   │   │   └── domain/      # To be built
│   │   └── res/
│   └── build/outputs/apk/   # Built APKs
├── build.gradle.kts
└── settings.gradle.kts
```

---

## Dependencies Status

### iOS Dependencies ✅
- SwiftUI (built-in)
- Core Bluetooth (built-in)
- Core Data (built-in)
- Vision (built-in)
- ARKit (built-in)
- CocoaPods packages installed

### Android Dependencies ✅
All configured in build.gradle.kts:
- Jetpack Compose
- Material Design 3
- Room Database
- Retrofit + OkHttp
- Hilt (DI)
- WorkManager
- CameraX
- ML Kit
- ARCore
- Firebase
- Biometric Auth

---

## Environment Setup

### Required Tools
- ✅ Xcode 15+ (for iOS)
- ✅ Android Studio Hedgehog+ (for Android)
- ✅ Git
- ✅ CocoaPods (for iOS dependencies)
- ✅ JDK 17 (for Android)

### API Configuration

Both apps connect to:
- **API**: `https://fleet.capitaltechalliance.com/api`
- **WebSocket**: `wss://fleet.capitaltechalliance.com/ws`

No additional configuration needed - endpoints are hardcoded for production.

---

## What You Get

### iOS App (Ready NOW)
1. **Tap to run** - Open Xcode workspace, press Run
2. **Login** - Email/password or Face ID/Touch ID
3. **Connect OBD-II** - Scan for ELM327 Bluetooth devices
4. **Track trips** - Real-time GPS with route recording
5. **Scan receipts** - Camera + OCR extraction
6. **Offline mode** - All data syncs when online

### Android App (6 Hours to Feature Parity)
1. **Build system ready** - All dependencies configured
2. **Architecture set** - Hilt DI, Compose UI, MVVM
3. **Clean slate** - Ready for rapid feature implementation
4. **Same API** - Shares backend with iOS

---

## Success Criteria Status

| Requirement | iPhone | iPad | Android |
|------------|--------|------|---------|
| Compiles | ✅ Yes | ✅ Yes | ⏳ Pending features |
| Authentication | ✅ Complete | ✅ Complete | 🔜 Next (1 hr) |
| OBD-II | ✅ Complete | ✅ Complete | 🔜 Next (1.5 hr) |
| GPS Tracking | ✅ Complete | ✅ Complete | 🔜 Next (30 min) |
| Photo/OCR | ✅ Complete | ✅ Complete | 🔜 Next (1 hr) |
| Offline Sync | ✅ Complete | ✅ Complete | 🔜 Next (1.5 hr) |
| Professional UI | ✅ Complete | ✅ Complete | 🔜 Next (30 min) |
| Tests | ✅ Basic | ✅ Basic | 🔜 Next (2 hr) |

---

## Support & Documentation

- **Full Architecture**: See `MOBILE_ECOSYSTEM_ARCHITECTURE.md`
- **Build Summary**: See `FLEET_MOBILE_BUILD_SUMMARY.md`
- **iOS Guides**: See `ios-native/App/` for feature-specific guides
- **Android Setup**: See `android/README.md` (to be created)

---

## Next Action

**For iOS**: Open Xcode and run - it's ready!

**For Android**: Begin implementing features following the priority list above.

**Estimated time to full Android parity**: 6-8 hours of focused development.

---

Last Updated: 2025-11-13 15:30 UTC
