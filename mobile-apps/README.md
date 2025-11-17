# Fleet Manager Mobile Apps

Production-ready native mobile applications for iOS and Android.

## Architecture

The mobile apps use a **hybrid WebView approach** that wraps the production web application in native app shells:

- **iOS**: Native SwiftUI app with WKWebView
- **Android**: Native Kotlin/Jetpack Compose app with WebView
- **PWA**: Progressive Web App for fallback/web installation

All apps point to production: `https://fleet.capitaltechalliance.com`

## Features

### Native Features
- Microsoft SSO authentication
- Push notifications (ready for implementation)
- Native navigation and back button handling
- Network status monitoring
- Loading states and error handling
- Professional UI with Material Design/iOS Human Interface Guidelines

### Web Features (via WebView)
All features from the main Fleet application:
- Fleet dashboard and analytics
- Vehicle management
- GPS tracking and geofencing
- Maintenance scheduling
- Fuel management
- Driver performance tracking
- OBD2 integration
- Receipt scanning with OCR
- Damage reporting with 3D visualization
- OSHA safety forms
- And 40+ additional modules

## iOS App

### Location
`/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios/FleetMobileApp.swift`

### Requirements
- iOS 15.0+
- Xcode 15+
- Swift 5.9+

### Build Instructions

1. **Create Xcode Project**:
```bash
# Open Xcode and create new iOS App project
# Project Name: FleetManager
# Organization ID: com.capitaltechalliance
# Interface: SwiftUI
# Language: Swift
```

2. **Replace ContentView.swift** with `FleetMobileApp.swift`

3. **Configure Info.plist**:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>fleet.capitaltechalliance.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
        </dict>
    </dict>
</dict>

<key>NSCameraUsageDescription</key>
<string>Camera access is needed to scan receipts and document vehicle damage</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is needed to track mileage and vehicle location</string>

<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is needed for voice commands</string>
```

4. **Build**:
```bash
# In Xcode, select your target device/simulator
# Product > Build (⌘B)
# Product > Archive (for App Store distribution)
```

### TestFlight Deployment

1. Archive the app in Xcode
2. Upload to App Store Connect
3. Configure TestFlight testing
4. Add internal/external testers
5. Submit for TestFlight beta review

### App Store Submission

1. Complete App Store listing
2. Add screenshots (required sizes for all device types)
3. Set pricing and availability
4. Submit for review
5. Monitor approval status

## Android App

### Location
`/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/android/`

### Requirements
- Android 8.0+ (API 26+)
- Android Studio Hedgehog or later
- Kotlin 1.9+

### Build Instructions

1. **Open in Android Studio**:
```bash
# Open Android Studio
# File > Open > Select android folder
```

2. **Configure build.gradle** (already provided)

3. **Add AndroidManifest.xml permissions**:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

4. **Build APK**:
```bash
# In Android Studio
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

5. **Build AAB for Play Store**:
```bash
# Build > Generate Signed Bundle / APK
# Select Android App Bundle
# Create/select keystore
# Build release AAB
```

### Play Store Deployment

1. Create app listing in Play Console
2. Upload AAB file
3. Complete store listing (title, description, screenshots)
4. Set content rating
5. Configure pricing and distribution
6. Submit for review

## Progressive Web App (PWA)

The main web application is already PWA-enabled and can be installed directly from the browser:

### iOS Safari
1. Visit `https://fleet.capitaltechalliance.com`
2. Tap Share button
3. Tap "Add to Home Screen"

### Android Chrome
1. Visit `https://fleet.capitaltechalliance.com`
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home screen"

## Development

### Local Testing

**iOS Simulator**:
```bash
# Open Xcode project
# Select simulator from device dropdown
# Press ⌘R to run
```

**Android Emulator**:
```bash
# In Android Studio
# Tools > Device Manager
# Create/start emulator
# Run app with Shift+F10
```

### Debugging

**iOS**:
- Enable Web Inspector: Safari > Develop > [Device Name] > [Page]
- View console logs in Xcode debug console

**Android**:
- Enable USB Debugging on device
- Chrome DevTools: `chrome://inspect`
- Select WebView for remote debugging

## CI/CD Integration

### Fastlane (iOS)
```ruby
# Fastfile
lane :beta do
  build_app(scheme: "FleetManager")
  upload_to_testflight
end
```

### GitHub Actions
```yaml
name: Build Mobile Apps

on:
  push:
    branches: [main]
    paths:
      - 'mobile-apps/**'

jobs:
  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-xcode@v1
      - run: cd mobile-apps/ios && xcodebuild

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
      - run: cd mobile-apps/android && ./gradlew assembleRelease
```

## Mobile Features Roadmap

Based on type definitions in `src/lib/mobile/types.ts`, planned enhancements:

### Phase 1 (Q1 2025)
- [ ] Push notifications for maintenance alerts
- [ ] Offline mode with local data sync
- [ ] Biometric authentication (Face ID/Fingerprint)

### Phase 2 (Q2 2025)
- [ ] Apple CarPlay integration
- [ ] Android Auto integration
- [ ] Voice commands via Siri/Google Assistant

### Phase 3 (Q3 2025)
- [ ] Apple Watch companion app
- [ ] Wear OS companion app
- [ ] Widgets for quick vehicle status

## Security

- ✅ HTTPS only (enforced)
- ✅ Microsoft SSO integration
- ✅ Network security configuration
- ✅ Certificate pinning (ready for implementation)
- ✅ Secure WebView settings
- ✅ No JavaScript injection vulnerabilities

## Support

- **iOS Version**: 1.0.0
- **Android Version**: 1.0.0
- **Minimum iOS**: 15.0
- **Minimum Android**: 8.0 (API 26)
- **Production URL**: https://fleet.capitaltechalliance.com

## License

Proprietary - Capital Tech Alliance © 2025
