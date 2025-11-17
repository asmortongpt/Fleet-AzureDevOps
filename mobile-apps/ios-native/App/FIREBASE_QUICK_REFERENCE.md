# Firebase Quick Reference

## Quick Start

### 1. Check if Firebase is Available
```swift
if FirebaseManager.shared.isFirebaseAvailable {
    // Firebase ready
}
```

### 2. Track Screen View
```swift
AnalyticsManager.shared.logScreenView(
    screenName: "vehicle_list",
    screenClass: "VehicleListView"
)
```

### 3. Check Feature Flag
```swift
if RemoteConfigManager.shared.isOBDDiagnosticsEnabled {
    // Show feature
}
```

### 4. Request Notifications
```swift
PushNotificationManager.shared.requestNotificationPermissions { granted, error in
    // Handle result
}
```

## Common Analytics Events

```swift
// Authentication
AnalyticsManager.shared.logLogin(method: "email")
AnalyticsManager.shared.logSignup(method: "google")

// Trips
AnalyticsManager.shared.logTripStarted(vehicleId: id, tripType: "business")
AnalyticsManager.shared.logTripCompleted(vehicleId: id, duration: 3600, distance: 50)

// Vehicles
AnalyticsManager.shared.logVehicleViewed(vehicleId: id, source: "dashboard")
AnalyticsManager.shared.logInspectionCompleted(vehicleId: id, inspectionType: "pre_trip", issuesFound: 2)

// Maintenance
AnalyticsManager.shared.logMaintenanceScheduled(vehicleId: id, maintenanceType: "oil_change")

// Media
AnalyticsManager.shared.logPhotoCaptured(context: "vehicle_damage", vehicleId: id)
AnalyticsManager.shared.logBarcodeScanned(barcodeType: "vin", source: "scanner")

// Features
AnalyticsManager.shared.logFeatureUsed(featureName: "obd_diagnostics", context: "vehicle_detail")

// Errors
AnalyticsManager.shared.logError(errorType: "api_error", errorCode: "500", context: "sync")

// Custom
AnalyticsManager.shared.logEvent("custom_action", parameters: ["key": "value"])
```

## Feature Flags

```swift
// Check flags
RemoteConfigManager.shared.isOBDDiagnosticsEnabled
RemoteConfigManager.shared.isOfflineModeEnabled
RemoteConfigManager.shared.isVoiceCommandsEnabled
RemoteConfigManager.shared.isBiometricAuthEnabled

// Get config values
let maxPhotos = RemoteConfigManager.shared.maxPhotoUploads
let syncInterval = RemoteConfigManager.shared.syncIntervalMinutes
let dashboardLayout = RemoteConfigManager.shared.dashboardLayout

// Check maintenance mode
if RemoteConfigManager.shared.isMaintenanceModeActive {
    // Show maintenance screen
}

// Force update check
if RemoteConfigManager.shared.shouldForceUpdate {
    // Show update dialog
}

// Version check
if RemoteConfigManager.shared.isAppVersionSupported() {
    // Continue
} else {
    // Show update required
}

// Refresh config
RemoteConfigManager.shared.refreshIfNeeded { success in
    // Config updated
}
```

## Push Notifications

```swift
// Request permissions
PushNotificationManager.shared.requestNotificationPermissions { granted, error in
    if granted {
        print("Notifications enabled")
    }
}

// Check if enabled
if PushNotificationManager.shared.areNotificationsEnabled {
    // Notifications enabled
}

// Badge management
PushNotificationManager.shared.setBadgeCount(5)
PushNotificationManager.shared.clearBadge()
PushNotificationManager.shared.incrementBadge()

// Observe notification events
NotificationCenter.default.addObserver(
    forName: .tripAlertReceived,
    object: nil,
    queue: .main
) { notification in
    if let tripId = notification.userInfo?["tripId"] as? String {
        // Handle trip alert
    }
}
```

## Available Notification Events
- `.tripAlertReceived`
- `.maintenanceReminderReceived`
- `.vehicleAlertReceived`
- `.inspectionDueReceived`
- `.messageReceived`
- `.handleDeepLink`
- `.fcmTokenRefreshed`

## Error Logging

```swift
// Log error to Crashlytics
FirebaseManager.shared.logError(error, additionalInfo: [
    "context": "vehicle_sync",
    "vehicleId": vehicleId
])

// Log message
FirebaseManager.shared.logMessage("User performed action X")
```

## User Properties

```swift
// Set user ID (automatically hashed)
FirebaseManager.shared.setUserId(userId)

// Set user properties
AnalyticsManager.shared.setUserRole("driver")
AnalyticsManager.shared.setUserTier("premium")
AnalyticsManager.shared.setUserPreference("notifications", value: "enabled")

// Custom property
FirebaseManager.shared.setUserProperty("value", forName: "property_name")
```

## SwiftUI View Integration

```swift
struct MyView: View {
    var body: some View {
        VStack {
            // Content
        }
        .onAppear {
            // Track screen view
            AnalyticsManager.shared.logScreenView(
                screenName: "my_screen",
                screenClass: "MyView"
            )
        }
        .toolbar {
            if RemoteConfigManager.shared.isFeatureEnabled("new_feature") {
                Button("New Feature") {
                    // Feature code
                }
            }
        }
    }
}
```

## Notification Payload Examples

### Trip Alert
```json
{
  "notification": {
    "title": "Trip Started",
    "body": "Your trip has begun"
  },
  "data": {
    "type": "trip_alert",
    "tripId": "trip123",
    "deepLink": "dcffleet://trip/trip123"
  }
}
```

### Maintenance Reminder
```json
{
  "notification": {
    "title": "Maintenance Due",
    "body": "Oil change due for Vehicle ABC123"
  },
  "data": {
    "type": "maintenance_reminder",
    "vehicleId": "vehicle123",
    "maintenanceType": "oil_change"
  }
}
```

### Silent Push (Background Sync)
```json
{
  "content_available": true,
  "data": {
    "syncType": "incremental"
  }
}
```

## Debugging

```swift
// Enable Firebase debug logging
// Add to scheme launch arguments:
// -FIRDebugEnabled
// -FIRAnalyticsDebugEnabled

// Print all config values
RemoteConfigManager.shared.printAllConfigValues()

// Check Firebase status
print("Firebase available: \(FirebaseManager.shared.isFirebaseAvailable)")
print("Analytics enabled: \(FirebaseManager.shared.isAnalyticsEnabled)")
print("FCM enabled: \(FirebaseManager.shared.isMessagingEnabled)")
print("Remote Config enabled: \(FirebaseManager.shared.isRemoteConfigEnabled)")

// Check notification status
print("Notifications enabled: \(PushNotificationManager.shared.areNotificationsEnabled)")
print("Permission status: \(PushNotificationManager.shared.notificationPermissionStatus)")
```

## Best Practices

### Analytics
- ✅ Track meaningful user actions
- ✅ Use descriptive event names (snake_case)
- ✅ Add context with parameters
- ❌ Don't log PII (email, phone, name)
- ❌ Don't over-track (every touch/scroll)

### Feature Flags
- ✅ Use for gradual feature rollouts
- ✅ Set sensible defaults
- ✅ Refresh config on app start
- ❌ Don't rely on immediate config updates
- ❌ Don't use for critical app logic

### Push Notifications
- ✅ Request permissions at appropriate time
- ✅ Provide value in notifications
- ✅ Handle deep links gracefully
- ❌ Don't spam users
- ❌ Don't assume notifications always work

### Error Logging
- ✅ Log errors with context
- ✅ Use error codes
- ✅ Add additional info
- ❌ Don't log sensitive data
- ❌ Don't log expected errors excessively

## Testing

### Test Analytics
```bash
# Add to scheme launch arguments
-FIRAnalyticsDebugEnabled
```

Then view in Firebase Console: **Analytics > DebugView**

### Test Crashlytics
```swift
// Log test error
let error = NSError(domain: "test", code: 1)
FirebaseManager.shared.logError(error)
```

View in Firebase Console: **Crashlytics** (wait 5-10 min)

### Test Push Notifications
1. Get FCM token from console logs
2. Firebase Console > Cloud Messaging > Send test message
3. Enter FCM token and send

### Test Remote Config
```swift
RemoteConfigManager.shared.fetchAndActivate { success in
    print("Config updated: \(success)")
    RemoteConfigManager.shared.printAllConfigValues()
}
```

## Common Issues

### Issue: Firebase not initializing
**Fix:** Check `GoogleService-Info.plist` exists and is added to target

### Issue: Analytics not tracking
**Fix:** Enable debug mode and check DebugView

### Issue: Notifications not received
**Fix:** Check permissions granted and APNs certificate uploaded

### Issue: Remote Config not updating
**Fix:** Wait for fetch interval or manually call `fetchAndActivate()`

## More Info

- Full documentation: `FIREBASE_INTEGRATION_COMPLETE.md`
- Setup guide: `FIREBASE_SETUP_INSTRUCTIONS.md`
- [Firebase Console](https://console.firebase.google.com)
