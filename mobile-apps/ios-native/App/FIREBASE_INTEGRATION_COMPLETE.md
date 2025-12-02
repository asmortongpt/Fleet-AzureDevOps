# Firebase Integration - Complete Documentation

## Overview

The DCF Fleet Management iOS app now includes a complete Firebase integration with the following services:
- **Firebase Analytics** - User behavior tracking and conversion analytics
- **Firebase Crashlytics** - Crash reporting and error tracking
- **Firebase Cloud Messaging (FCM)** - Push notifications and background sync
- **Firebase Remote Config** - Feature flags and A/B testing
- **Firebase Performance Monitoring** - App performance metrics

## Architecture

### Components

1. **FirebaseManager.swift** - Central Firebase initialization and configuration
2. **PushNotificationManager.swift** - Handles FCM push notifications
3. **AnalyticsManager.swift** - Analytics event tracking
4. **RemoteConfigManager.swift** - Remote configuration and feature flags

### Integration Points

- **AppDelegate.swift** - Firebase initialization on app launch
- **FleetManagementApp.swift** - App-level configuration
- **View Controllers** - Analytics tracking and feature flag checks

## File Structure

```
/mobile-apps/ios-native/App/
├── FirebaseManager.swift                    # Core Firebase setup
├── PushNotificationManager.swift            # Push notification handling
├── AnalyticsManager.swift                   # Analytics tracking
├── RemoteConfigManager.swift                # Remote config & feature flags
├── GoogleService-Info.plist.template        # Firebase config template
├── GoogleService-Info.plist                 # Actual config (gitignored)
├── FIREBASE_SETUP_INSTRUCTIONS.md           # Setup guide
└── FIREBASE_INTEGRATION_COMPLETE.md         # This file
```

## Setup Guide

See [FIREBASE_SETUP_INSTRUCTIONS.md](./FIREBASE_SETUP_INSTRUCTIONS.md) for detailed setup instructions.

**Quick Start:**
1. Add `GoogleService-Info.plist` to project
2. Install Firebase SDK via SPM or CocoaPods
3. Uncomment Firebase SDK code in managers
4. Build and run

## Features

### 1. Firebase Manager

**Location**: `/App/FirebaseManager.swift`

Central manager that initializes all Firebase services with graceful degradation.

**Key Features:**
- Safe initialization (no crashes if credentials missing)
- Validates GoogleService-Info.plist before initialization
- Configures all Firebase services
- Provides status flags for each service
- Handles user properties and error logging

**Usage:**

```swift
// Check if Firebase is available
if FirebaseManager.shared.isFirebaseAvailable {
    print("Firebase is ready")
}

// Set user ID (automatically hashed for privacy)
FirebaseManager.shared.setUserId(userId)

// Set user properties
FirebaseManager.shared.setUserProperty("premium", forName: "user_tier")

// Log error to Crashlytics
FirebaseManager.shared.logError(error, additionalInfo: ["context": "upload"])
```

**Status Flags:**
- `isFirebaseAvailable` - Firebase SDK initialized
- `isAnalyticsEnabled` - Analytics active
- `isCrashlyticsEnabled` - Crashlytics active
- `isMessagingEnabled` - FCM active
- `isRemoteConfigEnabled` - Remote Config active
- `isPerformanceEnabled` - Performance monitoring active

### 2. Push Notification Manager

**Location**: `/App/PushNotificationManager.swift`

Manages FCM push notifications with deep linking and background sync support.

**Key Features:**
- Permission request handling
- APNS token registration
- FCM token management
- Notification payload processing
- Deep link handling
- Silent push for background sync
- Badge count management

**Usage:**

```swift
// Request notification permissions
PushNotificationManager.shared.requestNotificationPermissions { granted, error in
    if granted {
        print("Notifications enabled")
    }
}

// Check permission status
if PushNotificationManager.shared.areNotificationsEnabled {
    print("Notifications are enabled")
}

// Set badge count
PushNotificationManager.shared.setBadgeCount(5)

// Clear badge
PushNotificationManager.shared.clearBadge()

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

**Notification Types Supported:**
- `trip_alert` - Trip-related alerts
- `maintenance_reminder` - Maintenance due notifications
- `vehicle_alert` - Vehicle status alerts
- `inspection_due` - Inspection reminders
- `message` - User messages

**Notification Events:**
- `.tripAlertReceived`
- `.maintenanceReminderReceived`
- `.vehicleAlertReceived`
- `.inspectionDueReceived`
- `.messageReceived`
- `.handleDeepLink`

### 3. Analytics Manager

**Location**: `/App/AnalyticsManager.swift`

Privacy-compliant analytics tracking for user behavior and conversions.

**Key Features:**
- Screen view tracking
- User event logging
- Custom event parameters
- User properties
- Conversion tracking
- PII sanitization
- Event validation

**Usage:**

```swift
// Track screen views
AnalyticsManager.shared.logScreenView(
    screenName: "vehicle_list",
    screenClass: "VehicleListView"
)

// Track authentication
AnalyticsManager.shared.logLogin(method: "email")
AnalyticsManager.shared.logSignup(method: "google")

// Track trips
AnalyticsManager.shared.logTripStarted(
    vehicleId: vehicleId,
    tripType: "business"
)

AnalyticsManager.shared.logTripCompleted(
    vehicleId: vehicleId,
    duration: tripDuration,
    distance: distanceKm
)

// Track vehicle events
AnalyticsManager.shared.logVehicleViewed(
    vehicleId: vehicleId,
    source: "dashboard"
)

AnalyticsManager.shared.logInspectionCompleted(
    vehicleId: vehicleId,
    inspectionType: "pre_trip",
    issuesFound: 2
)

// Track maintenance
AnalyticsManager.shared.logMaintenanceScheduled(
    vehicleId: vehicleId,
    maintenanceType: "oil_change"
)

// Track media capture
AnalyticsManager.shared.logPhotoCaptured(
    context: "vehicle_damage",
    vehicleId: vehicleId
)

// Track sync operations
AnalyticsManager.shared.logSyncCompleted(
    syncType: "full",
    itemsSynced: 50,
    duration: 2.5
)

// Track feature usage
AnalyticsManager.shared.logFeatureUsed(
    featureName: "barcode_scanner",
    context: "vehicle_registration"
)

// Track errors
AnalyticsManager.shared.logError(
    errorType: "api_error",
    errorCode: "500",
    context: "vehicle_fetch"
)

// Track conversions
AnalyticsManager.shared.logConversion(
    conversionType: "first_trip_completed",
    value: 1.0
)

// Custom events
AnalyticsManager.shared.logEvent("custom_event", parameters: [
    "param1": "value1",
    "param2": 123
])

// Set user properties
AnalyticsManager.shared.setUserRole("driver")
AnalyticsManager.shared.setUserTier("premium")
AnalyticsManager.shared.setUserPreference("notifications", value: "enabled")
```

**Pre-defined Events:**
- Authentication: `login`, `sign_up`, `logout`
- Trips: `trip_started`, `trip_completed`, `trip_paused`, `trip_resumed`
- Vehicles: `vehicle_viewed`, `inspection_started`, `inspection_completed`
- Maintenance: `maintenance_scheduled`, `maintenance_completed`
- Media: `photo_captured`, `document_scanned`, `barcode_scanned`
- Sync: `sync_started`, `sync_completed`, `sync_failed`
- Features: `feature_used`, `button_tapped`
- Errors: `error_occurred`
- Conversions: `conversion`
- Sessions: `session_start`, `session_end`

**Privacy Compliance:**
- No PII (Personally Identifiable Information) logged
- User IDs are hashed before logging
- Search terms are hashed
- Sensitive parameters are automatically sanitized

### 4. Remote Config Manager

**Location**: `/App/RemoteConfigManager.swift`

Dynamic app configuration with feature flags and A/B testing.

**Key Features:**
- Feature flag management
- A/B testing support
- Value caching
- Fallback defaults
- Version checking
- Configuration validation

**Usage:**

```swift
// Fetch latest config
RemoteConfigManager.shared.fetchAndActivate { success in
    if success {
        print("Config updated")
    }
}

// Check feature flags
if RemoteConfigManager.shared.isOBDDiagnosticsEnabled {
    // Show OBD diagnostics feature
}

if RemoteConfigManager.shared.isOfflineModeEnabled {
    // Enable offline mode
}

// Get configuration values
let maxPhotos = RemoteConfigManager.shared.maxPhotoUploads
let syncInterval = RemoteConfigManager.shared.syncIntervalMinutes

// A/B testing
let dashboardLayout = RemoteConfigManager.shared.dashboardLayout
switch dashboardLayout {
case "standard":
    // Show standard dashboard
case "compact":
    // Show compact dashboard
default:
    // Show default
}

// Check app version
if RemoteConfigManager.shared.isAppVersionSupported() {
    // Continue
} else {
    // Show update required screen
}

// Force update check
if RemoteConfigManager.shared.shouldForceUpdate {
    // Show force update dialog
}

// Maintenance mode
if RemoteConfigManager.shared.isMaintenanceModeActive {
    // Show maintenance screen
}

// Custom config values
let customValue = RemoteConfigManager.shared.bool(forKey: "custom_feature")
let apiTimeout = RemoteConfigManager.shared.integer(forKey: "api_timeout")
let configString = RemoteConfigManager.shared.string(forKey: "message")

// Debug
RemoteConfigManager.shared.printAllConfigValues()
```

**Available Config Keys:**

**Feature Flags:**
- `enable_obd_diagnostics` - OBD-II diagnostics feature
- `enable_advanced_analytics` - Advanced analytics
- `enable_offline_mode` - Offline mode support
- `enable_voice_commands` - Voice command feature
- `enable_dark_mode` - Dark mode support
- `enable_biometric_auth` - Biometric authentication

**UI Configuration:**
- `maintenance_mode` - App maintenance mode
- `force_update` - Force app update
- `min_app_version` - Minimum required version
- `show_welcome_screen` - Show onboarding

**Feature Limits:**
- `max_photo_uploads` - Maximum photo uploads
- `max_trip_duration_hours` - Max trip duration
- `sync_interval_minutes` - Sync interval

**A/B Testing:**
- `dashboard_layout` - Dashboard layout variant
- `onboarding_flow` - Onboarding flow variant

**API Configuration:**
- `api_timeout_seconds` - API timeout
- `max_retries` - Maximum retry attempts

### 5. Integration with Existing Code

#### Adding Analytics to Views

```swift
import SwiftUI

struct VehicleDetailView: View {
    let vehicleId: String

    var body: some View {
        VStack {
            // View content
        }
        .onAppear {
            // Track screen view
            AnalyticsManager.shared.logScreenView(
                screenName: "vehicle_detail",
                screenClass: "VehicleDetailView"
            )

            // Track vehicle viewed
            AnalyticsManager.shared.logVehicleViewed(
                vehicleId: vehicleId,
                source: "navigation"
            )
        }
    }
}
```

#### Feature Flag Gating

```swift
struct AdvancedFeaturesView: View {
    var body: some View {
        VStack {
            // Always visible features

            if RemoteConfigManager.shared.isVoiceCommandsEnabled {
                VoiceCommandButton()
            }

            if RemoteConfigManager.shared.isOBDDiagnosticsEnabled {
                OBDDiagnosticsView()
            }
        }
    }
}
```

#### Push Notification Handling

```swift
class AppCoordinator: ObservableObject {
    init() {
        // Observe notification events
        NotificationCenter.default.addObserver(
            forName: .tripAlertReceived,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let tripId = notification.userInfo?["tripId"] as? String {
                self?.navigateToTrip(tripId: tripId)
            }
        }
    }
}
```

## Testing

### Testing Analytics

1. Enable debug mode:
   ```
   -FIRAnalyticsDebugEnabled
   ```

2. Log test events:
   ```swift
   AnalyticsManager.shared.logEvent("test_event", parameters: ["test": true])
   ```

3. View in Firebase Console:
   - Go to Analytics > DebugView
   - Select your device
   - Watch events in real-time

### Testing Crashlytics

1. Log test error:
   ```swift
   let error = NSError(domain: "test", code: 1, userInfo: [
       NSLocalizedDescriptionKey: "Test error"
   ])
   FirebaseManager.shared.logError(error)
   ```

2. View in Firebase Console:
   - Go to Crashlytics
   - Check for errors (may take 5-10 minutes)

### Testing Push Notifications

1. Get FCM token from console logs
2. Go to Firebase Console > Cloud Messaging
3. Click "Send test message"
4. Enter FCM token
5. Compose notification
6. Send

**Test Payload Examples:**

**Trip Alert:**
```json
{
  "notification": {
    "title": "Trip Alert",
    "body": "Your trip has started"
  },
  "data": {
    "type": "trip_alert",
    "tripId": "trip123",
    "deepLink": "dcffleet://trip/trip123"
  }
}
```

**Maintenance Reminder:**
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

**Silent Push (Background Sync):**
```json
{
  "content_available": true,
  "data": {
    "syncType": "incremental"
  }
}
```

### Testing Remote Config

1. Configure values in Firebase Console
2. Fetch in app:
   ```swift
   RemoteConfigManager.shared.fetchAndActivate { success in
       print("Fetch success: \(success)")
       RemoteConfigManager.shared.printAllConfigValues()
   }
   ```
3. Verify values are updated

## Notification Payload Formats

### Standard Notification

```json
{
  "aps": {
    "alert": {
      "title": "Notification Title",
      "body": "Notification message"
    },
    "badge": 1,
    "sound": "default"
  },
  "type": "notification_type",
  "customData": "value"
}
```

### With Deep Link

```json
{
  "aps": {
    "alert": {
      "title": "Vehicle Alert",
      "body": "Check engine light on"
    }
  },
  "type": "vehicle_alert",
  "vehicleId": "vehicle123",
  "alertType": "check_engine",
  "deepLink": "dcffleet://vehicle/vehicle123/alerts"
}
```

### Silent Push

```json
{
  "aps": {
    "content-available": 1
  },
  "syncType": "full"
}
```

## Analytics Events Reference

### Event Naming Convention

- Use **snake_case** for event names
- Use descriptive names (e.g., `trip_started` not `ts`)
- Keep names under 40 characters
- Use consistent verb tense (past tense for completed actions)

### Common Parameters

- `vehicle_id` - Vehicle identifier
- `trip_id` - Trip identifier
- `user_id` - User identifier (hashed)
- `duration_seconds` - Duration in seconds
- `source` - Event source/context
- `error_code` - Error code
- `result_count` - Number of results

### Best Practices

1. **Don't over-track** - Only log meaningful events
2. **Use parameters** - Add context with parameters
3. **Batch events** - Don't log every touch/scroll
4. **Test events** - Verify events in DebugView
5. **Document events** - Keep event catalog up to date

## Security & Privacy

### Privacy Compliance

1. **No PII Logging**
   - Never log email, phone, name, address
   - Hash user IDs before logging
   - Sanitize search terms

2. **Data Minimization**
   - Only log necessary data
   - Use aggregated data when possible
   - Delete old data regularly

3. **User Consent**
   - Request analytics consent
   - Allow opt-out
   - Respect privacy settings

### Security Best Practices

1. **Credential Management**
   - Never commit `GoogleService-Info.plist`
   - Use different Firebase projects for environments
   - Rotate credentials regularly

2. **API Security**
   - Implement Firebase App Check
   - Use Firebase Security Rules
   - Enable certificate pinning

3. **Error Handling**
   - Don't log sensitive data in errors
   - Sanitize error messages
   - Use error codes instead of descriptions

## Troubleshooting

### Firebase Not Initializing

**Symptoms:**
- Console logs "GoogleService-Info.plist not found"
- Firebase features not working

**Solutions:**
1. Verify `GoogleService-Info.plist` exists in project
2. Check file is added to target
3. Validate plist contains real values (not placeholders)
4. Clean build folder and rebuild

### Analytics Not Tracking

**Symptoms:**
- Events not appearing in Firebase Console
- DebugView shows no events

**Solutions:**
1. Enable debug logging: `-FIRAnalyticsDebugEnabled`
2. Wait 24 hours for non-debug events
3. Check Analytics is enabled in Firebase Console
4. Verify event names follow naming conventions

### Push Notifications Not Working

**Symptoms:**
- Notifications not received
- FCM token not generated

**Solutions:**
1. Check notification permissions granted
2. Verify APNs certificate uploaded to Firebase
3. Test with Firebase Console test message
4. Check device token in logs
5. Verify app is registered for remote notifications

### Remote Config Not Updating

**Symptoms:**
- Config values not changing
- Fetch always returns cached values

**Solutions:**
1. Check fetch was successful
2. Call `activate()` after fetch
3. Wait for minimum fetch interval
4. Clear app data and reinstall
5. Check values in Firebase Console

### Crashlytics Not Reporting

**Symptoms:**
- Crashes not appearing in console
- No crash reports

**Solutions:**
1. Build with Release configuration
2. Verify run script added to build phases
3. Wait 5-10 minutes for reports
4. Force quit and restart app
5. Check Crashlytics enabled in Firebase

## Performance Optimization

### Analytics Optimization

1. **Batch Events**
   - Don't log every user action
   - Batch similar events
   - Use sampling for high-frequency events

2. **Reduce Parameters**
   - Limit parameters per event
   - Use simple data types
   - Avoid nested objects

### Remote Config Optimization

1. **Caching**
   - Cache config values locally
   - Set appropriate fetch intervals
   - Use defaults for offline mode

2. **Fetch Strategy**
   - Fetch on app start
   - Refresh when stale
   - Use background fetch

### Notification Optimization

1. **Token Management**
   - Cache FCM token locally
   - Update only when changed
   - Send to backend once

2. **Payload Size**
   - Keep payloads under 4KB
   - Use data-only for silent push
   - Compress large data

## Best Practices

### Analytics

1. Track user journeys, not just actions
2. Use consistent naming conventions
3. Document all events and parameters
4. Review analytics regularly
5. A/B test new features

### Push Notifications

1. Respect user preferences
2. Don't over-notify
3. Use rich notifications when appropriate
4. Test notification copy
5. Handle errors gracefully

### Remote Config

1. Use feature flags for gradual rollouts
2. Test config changes before production
3. Document all config keys
4. Set sensible defaults
5. Monitor config fetch success rates

### Error Handling

1. Log errors with context
2. Don't crash on Firebase errors
3. Provide fallback behavior
4. Monitor error rates
5. Fix recurring errors

## Migration Guide

### From No Firebase

1. Install Firebase SDK
2. Add `GoogleService-Info.plist`
3. Uncomment Firebase code
4. Test each service
5. Deploy gradually

### Updating Firebase SDK

1. Update dependency version
2. Review breaking changes
3. Test all Firebase features
4. Update deprecated APIs
5. Monitor for issues

## Support & Resources

### Documentation

- [Firebase iOS Documentation](https://firebase.google.com/docs/ios/setup)
- [Analytics Events Reference](https://firebase.google.com/docs/reference/android/com/google/firebase/analytics/FirebaseAnalytics.Event)
- [FCM iOS Guide](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Remote Config Best Practices](https://firebase.google.com/docs/remote-config/best-practices)

### Tools

- [Firebase Console](https://console.firebase.google.com)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [DebugView](https://support.google.com/firebase/answer/7201382)

### Support

- [Firebase Status](https://status.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## Changelog

### Version 1.0.0 (2025-11-11)

**Initial Firebase Integration**
- ✅ FirebaseManager with core initialization
- ✅ PushNotificationManager with FCM support
- ✅ AnalyticsManager with comprehensive event tracking
- ✅ RemoteConfigManager with feature flags
- ✅ AppDelegate integration
- ✅ Template configuration files
- ✅ Complete documentation

**Features**
- Graceful degradation if Firebase unavailable
- Privacy-compliant analytics (no PII)
- Deep linking from notifications
- Silent push for background sync
- Badge count management
- A/B testing support
- Version checking
- Error logging to Crashlytics

---

**Firebase Integration Complete** ✅

For setup instructions, see [FIREBASE_SETUP_INSTRUCTIONS.md](./FIREBASE_SETUP_INSTRUCTIONS.md)
