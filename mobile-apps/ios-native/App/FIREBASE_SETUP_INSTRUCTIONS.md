# Firebase Setup Instructions

This guide will help you set up Firebase for the DCF Fleet Management iOS app.

## Prerequisites

- Xcode 14.0 or later
- iOS 14.0+ deployment target
- Active Firebase account
- CocoaPods or Swift Package Manager

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or select an existing project
3. Enter project name: `DCF Fleet Management`
4. Enable/disable Google Analytics (recommended: enable)
5. Click **"Create project"**

## Step 2: Add iOS App to Firebase

1. In Firebase Console, click the iOS icon to add iOS app
2. Enter your iOS bundle ID: `com.dcffleet.app` (or your custom bundle ID)
3. Enter App nickname: `DCF Fleet iOS`
4. Enter App Store ID: (optional, can add later)
5. Click **"Register app"**

## Step 3: Download Configuration File

1. Download the `GoogleService-Info.plist` file
2. Place it in the project directory: `/mobile-apps/ios-native/App/`
3. Make sure to **add it to your Xcode project**:
   - Drag the file into Xcode
   - Check "Copy items if needed"
   - Select your app target
4. **IMPORTANT**: Add `GoogleService-Info.plist` to `.gitignore`

```bash
echo "GoogleService-Info.plist" >> .gitignore
```

## Step 4: Install Firebase SDK

### Option A: Swift Package Manager (Recommended)

1. In Xcode, go to **File > Add Packages...**
2. Enter Firebase SDK URL: `https://github.com/firebase/firebase-ios-sdk`
3. Select version: **10.0.0** or later
4. Select the following packages:
   - FirebaseAnalytics
   - FirebaseCrashlytics
   - FirebaseMessaging
   - FirebaseRemoteConfig
   - FirebasePerformance
5. Click **"Add Package"**

### Option B: CocoaPods

Add to your `Podfile`:

```ruby
platform :ios, '14.0'

target 'FleetManagement' do
  use_frameworks!

  # Firebase
  pod 'Firebase/Analytics'
  pod 'Firebase/Crashlytics'
  pod 'Firebase/Messaging'
  pod 'Firebase/RemoteConfig'
  pod 'Firebase/Performance'
end
```

Then run:

```bash
cd mobile-apps/ios-native
pod install
```

## Step 5: Update Code

### Uncomment Firebase SDK Code

The Firebase integration code is already written but commented out. Uncomment the following sections:

**FirebaseManager.swift**:
- Line ~40: `FirebaseApp.configure()`
- Line ~50+: All Firebase service configurations
- Line ~220+: MessagingDelegate extension

**PushNotificationManager.swift**:
- Line ~140: `Messaging.messaging().apnsToken = deviceToken`

**AnalyticsManager.swift**:
- Line ~50+: All Analytics.logEvent() calls

**RemoteConfigManager.swift**:
- Line ~80+: All RemoteConfig API calls

### Initialize Firebase in AppDelegate

The AppDelegate.swift should already be updated. If not, add this to `didFinishLaunchingWithOptions`:

```swift
// Initialize Firebase
FirebaseManager.shared.configure(application: application)

// Initialize Push Notifications
PushNotificationManager.shared.configure(application: application)

// Initialize Remote Config
RemoteConfigManager.shared.configure()

// Request notification permissions
PushNotificationManager.shared.requestNotificationPermissions()
```

## Step 6: Configure Services in Firebase Console

### Analytics

1. In Firebase Console, go to **Analytics**
2. Analytics is automatically enabled
3. View real-time events in **DebugView** (requires debug device)

### Crashlytics

1. Go to **Crashlytics** in Firebase Console
2. Follow setup instructions
3. Build and run app once to initialize
4. Force a test crash to verify setup:

```swift
fatalError("Test crash")
```

### Cloud Messaging

1. Go to **Cloud Messaging** in Firebase Console
2. Upload your APNs authentication key:
   - Go to [Apple Developer](https://developer.apple.com)
   - Certificates, Identifiers & Profiles > Keys
   - Create new key with APNs enabled
   - Download `.p8` file
   - Upload to Firebase: Settings > Cloud Messaging > APNs Authentication Key

### Remote Config

1. Go to **Remote Config** in Firebase Console
2. Click **"Create configuration"**
3. Add parameters matching `RemoteConfigManager.ConfigKeys`
4. Set default values
5. Publish changes

### Performance Monitoring

1. Go to **Performance** in Firebase Console
2. Performance monitoring is automatically enabled
3. View metrics after app launch

## Step 7: Update Xcode Build Settings

### Add Run Script for Crashlytics

1. In Xcode, select your target
2. Go to **Build Phases**
3. Click **+** and select **"New Run Script Phase"**
4. Add this script:

```bash
"${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/run"
```

5. Add input files:
   - `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${TARGET_NAME}`
   - `$(SRCROOT)/$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)`

### Enable Debug Logging (Optional)

Add to your scheme's launch arguments:

```
-FIRDebugEnabled
-FIRAnalyticsDebugEnabled
```

## Step 8: Update Info.plist

Add the following keys if not already present:

```xml
<!-- Firebase Background Modes -->
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>fetch</string>
</array>

<!-- Firebase Deep Linking -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

## Step 9: Test Firebase Integration

### Test Analytics

```swift
AnalyticsManager.shared.logEvent("test_event", parameters: ["test": "value"])
```

View in Firebase Console: **Analytics > DebugView**

### Test Crashlytics

```swift
FirebaseManager.shared.logError(NSError(domain: "test", code: 1))
```

View in Firebase Console: **Crashlytics**

### Test Remote Config

```swift
RemoteConfigManager.shared.fetchAndActivate { success in
    print("Remote Config fetch: \(success)")
    RemoteConfigManager.shared.printAllConfigValues()
}
```

### Test Push Notifications

1. Get FCM token from logs
2. Use Firebase Console: **Cloud Messaging > Send test message**
3. Enter FCM token
4. Send notification

## Step 10: Production Configuration

### Disable Debug Features

Remove debug launch arguments for production builds.

### Configure Analytics Data Retention

1. Go to **Analytics > Data Retention**
2. Set retention period (14 months recommended)

### Set Up App Distribution (Optional)

1. Go to **App Distribution** in Firebase Console
2. Upload IPA for beta testing
3. Add testers

### Configure Audience and Attribution

1. Go to **Analytics > Audiences**
2. Create custom audiences for targeted messaging

## Troubleshooting

### Firebase Not Initializing

**Problem**: Console shows "GoogleService-Info.plist not found"

**Solution**:
- Verify file is in project root
- Check file is added to target
- Clean build folder (Cmd+Shift+K)

### Notifications Not Received

**Problem**: Push notifications not arriving

**Solution**:
- Check APNs certificate uploaded
- Verify notification permissions granted
- Check device is registered in Firebase Console
- Test with Firebase Console test message

### Crashlytics Not Reporting

**Problem**: Crashes not appearing in console

**Solution**:
- Verify run script added to build phases
- Build with Release configuration
- Wait 5-10 minutes for crashes to appear
- Force quit and restart app

### Analytics Not Tracking

**Problem**: Events not appearing in DebugView

**Solution**:
- Enable debug logging with `-FIRDebugEnabled`
- Check device appears in DebugView
- Verify `GoogleService-Info.plist` has correct IDs

## Security Best Practices

1. **Never commit GoogleService-Info.plist to public repos**
2. **Use different Firebase projects for dev/staging/production**
3. **Configure Firebase App Check for API security**
4. **Set up Firebase Security Rules**
5. **Enable Google Cloud Armor for DDoS protection**
6. **Use Firebase Authentication for user management**
7. **Implement certificate pinning for API calls**

## Additional Resources

- [Firebase iOS Documentation](https://firebase.google.com/docs/ios/setup)
- [Firebase Analytics Events Reference](https://firebase.google.com/docs/reference/android/com/google/firebase/analytics/FirebaseAnalytics.Event)
- [FCM iOS Setup Guide](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Crashlytics iOS Guide](https://firebase.google.com/docs/crashlytics/get-started?platform=ios)
- [Remote Config Best Practices](https://firebase.google.com/docs/remote-config/best-practices)

## Support

For issues with Firebase integration:
- Check [Firebase Status Dashboard](https://status.firebase.google.com/)
- Visit [Firebase Support](https://firebase.google.com/support)
- Review [Stack Overflow Firebase tag](https://stackoverflow.com/questions/tagged/firebase)

---

**Next Steps**: After completing setup, refer to `FIREBASE_INTEGRATION_COMPLETE.md` for usage documentation.
