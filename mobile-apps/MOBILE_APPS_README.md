# Fleet Manager Mobile Applications

Production-ready native mobile applications for iOS and Android.

## 📱 Overview

The Fleet Manager mobile apps provide native iOS and Android applications that wrap the production web application (`https://fleet.capitaltechalliance.com`) in a native app shell. This hybrid approach provides:

- **Native User Experience**: Platform-specific UI elements and navigation
- **App Store Distribution**: Available on both Apple App Store and Google Play Store
- **Full Feature Access**: All 40+ web features accessible through native WebView
- **Enhanced Mobile Features**: Camera, GPS, biometric auth (Phase 2+)
- **Offline Capabilities**: Local storage and sync (Phase 2+)

## 🏗️ Architecture

Both apps use a **hybrid WebView architecture**:

### iOS App (`ios-native/`)
- **Technology**: Native Swift with SwiftUI
- **WebView**: WKWebView
- **Project**: Xcode workspace with CocoaPods
- **Bundle ID**: `com.capitaltechalliance.fleetmanagement`
- **Minimum iOS**: 15.0
- **Target iOS**: 17.0

### Android App (`android-native/`)
- **Technology**: Native Kotlin with Jetpack Compose
- **WebView**: Android WebView with AndroidX
- **Project**: Gradle-based Android Studio project
- **Package Name**: `com.capitaltechalliance.fleet`
- **Minimum SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)

## 🔗 Production URLs

Both apps point to the production Fleet application:
- **Production**: `https://fleet.capitaltechalliance.com`
- **Development**: `http://localhost:3000` (DEBUG builds only)

## 🚀 Quick Start

### iOS Development

1. **Prerequisites**:
   ```bash
   # Xcode 15+ required
   xcode-select --install

   # Install CocoaPods
   sudo gem install cocoapods
   ```

2. **Setup**:
   ```bash
   cd mobile-apps/ios-native
   pod install
   open App.xcworkspace
   ```

3. **Run**:
   - Select simulator (iPhone 14 Pro or later)
   - Press `⌘R` or click ▶ Run button
   - App will open in simulator connected to production

### Android Development

1. **Prerequisites**:
   - Android Studio Hedgehog (2023.1.1) or later
   - Java JDK 17+
   - Android SDK 34

2. **Setup**:
   ```bash
   cd mobile-apps/android-native
   # Open in Android Studio
   open -a "Android Studio" .
   ```

3. **Run**:
   - Select emulator (Pixel 7 API 34 or later)
   - Click ▶ Run button
   - App will open in emulator connected to production

## 📦 App Store Deployment

### iOS - TestFlight & App Store

1. **Archive the App**:
   ```bash
   cd mobile-apps/ios-native

   # Build archive
   xcodebuild -workspace App.xcworkspace \
     -scheme App \
     -configuration Release \
     -archivePath build/App.xcarchive \
     archive

   # Export for App Store
   xcodebuild -exportArchive \
     -archivePath build/App.xcarchive \
     -exportPath build/Export \
     -exportOptionsPlist ExportOptions.plist
   ```

2. **Upload to App Store Connect**:
   - Option A: Xcode Organizer
     - Window → Organizer
     - Select archive → Distribute App
     - Choose App Store Connect → Upload

   - Option B: Transporter App
     - Download from Mac App Store
     - Drag `Export/App.ipa` to Transporter
     - Click "Deliver"

3. **TestFlight**:
   - Go to App Store Connect
   - Select your app
   - TestFlight tab → Add testers
   - Testers receive invitation via email

4. **Production Release**:
   - App Store Connect → App Information
   - Add screenshots, description, keywords
   - Submit for Review
   - Average review time: 24-48 hours

### Android - Google Play Store

1. **Build Release APK/AAB**:
   ```bash
   cd mobile-apps/android-native

   # Build release bundle (recommended for Play Store)
   ./gradlew bundleRelease

   # Output: app/build/outputs/bundle/release/app-release.aab
   ```

2. **Sign the App**:
   ```bash
   # Generate keystore (first time only)
   keytool -genkey -v \
     -keystore fleet-release.keystore \
     -alias fleet-key \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000

   # Sign the bundle
   jarsigner -verbose \
     -sigalg SHA256withRSA \
     -digestalg SHA-256 \
     -keystore fleet-release.keystore \
     app/build/outputs/bundle/release/app-release.aab \
     fleet-key
   ```

3. **Upload to Play Console**:
   - Go to Google Play Console
   - Create app → Fleet Manager
   - Production → Create new release
   - Upload `app-release.aab`
   - Add release notes
   - Review and rollout

4. **Internal/Beta Testing**:
   - Play Console → Testing → Internal testing
   - Create release and upload AAB
   - Add testers via email lists
   - Share test link with team

## 🧪 Testing Strategy

### iOS Testing
- **Unit Tests**: Run in Xcode (`⌘U`)
- **UI Tests**: Xcode UI Testing framework
- **Manual Testing**: TestFlight builds
- **Devices**: iPhone 14 Pro, iPhone 15 Pro Max, iPad Pro

### Android Testing
- **Unit Tests**: `./gradlew test`
- **Instrumentation Tests**: `./gradlew connectedAndroidTest`
- **Manual Testing**: Internal testing track
- **Devices**: Pixel 7, Samsung Galaxy S23, Pixel Tablet

## 📊 Features Roadmap

### ✅ Phase 1 (Complete)
- [x] Native iOS app with WebView
- [x] Native Android app with WebView
- [x] Production URL integration
- [x] Microsoft SSO authentication
- [x] All web features accessible
- [x] App Store submission ready

### 🔄 Phase 2 (In Progress)
- [ ] Push notifications for maintenance alerts
- [ ] Offline mode with local SQLite database
- [ ] Biometric authentication (Face ID/Fingerprint)
- [ ] Native camera integration
- [ ] Background location tracking

### 📅 Phase 3 (Planned)
- [ ] BLE/NFC integration for keyless entry
- [ ] Smartcar API integration
- [ ] Apple CarPlay / Android Auto support
- [ ] Apple Watch / Wear OS companion apps
- [ ] Voice commands via Siri/Google Assistant

## 🔧 Configuration

### iOS Configuration Files
- `App/APIConfiguration.swift` - API endpoints and environment selection
- `App/Info.plist` - App metadata and permissions
- `Podfile` - CocoaPods dependencies

### Android Configuration Files
- `app/src/main/java/.../ApiConfiguration.kt` - API endpoints
- `app/src/main/AndroidManifest.xml` - App metadata and permissions
- `app/build.gradle` - App dependencies and build config
- `build.gradle` - Project-level Gradle configuration

## 🔐 Security

### iOS Security
- ✅ HTTPS-only connections (App Transport Security)
- ✅ Certificate pinning ready
- ✅ Keychain storage for tokens
- ✅ Face ID/Touch ID integration ready
- ✅ Code obfuscation in release builds

### Android Security
- ✅ Network Security Config (HTTPS-only)
- ✅ Certificate pinning ready
- ✅ EncryptedSharedPreferences for tokens
- ✅ Biometric authentication ready
- ✅ ProGuard/R8 obfuscation enabled

## 📄 App Store Requirements

### iOS Requirements
- **Screenshots**: 6.7", 6.5", 5.5" iPhones + 12.9" iPad
- **App Icon**: 1024x1024 PNG (no alpha channel)
- **Privacy Policy**: Required URL
- **Support URL**: Required
- **Age Rating**: 4+ (Business)
- **Category**: Business / Productivity

### Android Requirements
- **Screenshots**: Phone (16:9), 7" Tablet, 10" Tablet
- **Feature Graphic**: 1024x500 PNG
- **App Icon**: 512x512 PNG (adaptive icon)
- **Privacy Policy**: Required URL
- **Content Rating**: Everyone (Business)
- **Category**: Business

## 🐛 Troubleshooting

### iOS Issues

**Build Fails**:
```bash
# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate && pod install
```

**Simulator Not Loading**:
```bash
# Reset simulator
xcrun simctl erase all
xcrun simctl boot "iPhone 17 Pro"
```

### Android Issues

**Gradle Sync Failed**:
```bash
# Clean and rebuild
./gradlew clean
./gradlew build --refresh-dependencies
```

**Emulator Not Starting**:
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_7_API_34
```

## 📞 Support

- **Development Team**: Capital Tech Alliance
- **iOS Team ID**: FFC6NRQ5U5
- **iOS Bundle ID**: com.capitaltechalliance.fleetmanagement
- **Android Package**: com.capitaltechalliance.fleet

## 📝 Release Notes

### Version 1.0.0 (Current)
- Initial release with WebView integration
- Microsoft SSO authentication
- Production URL: https://fleet.capitaltechalliance.com
- All 40+ web features accessible
- Native iOS and Android apps
- App Store and Play Store ready

---

**Mobile apps are now production-ready and aligned with the current Fleet project!** 🚀
