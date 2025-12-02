# Mobile Push Notification Integration Guide

Complete guide for integrating push notifications in your React Native mobile application for iOS and Android.

## Overview

The Fleet Management System supports push notifications via:
- **Firebase Cloud Messaging (FCM)** for Android
- **Apple Push Notification Service (APNS)** for iOS

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [iOS Setup](#ios-setup)
4. [Android Setup](#android-setup)
5. [Device Registration](#device-registration)
6. [Receiving Notifications](#receiving-notifications)
7. [Handling Actions](#handling-actions)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### iOS Requirements
- Apple Developer Account
- Push Notification certificate or Auth Key (p8)
- Xcode 14 or later
- iOS 13.0 or later deployment target

### Android Requirements
- Firebase project with FCM enabled
- google-services.json file
- Android Studio
- minSdkVersion 21 or higher

### Backend Configuration
```bash
# Environment variables required
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'  # FCM credentials
APNS_KEY_PATH=/path/to/AuthKey_XXXXXXXXX.p8
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=XXXXXXXXXX
APNS_BUNDLE_ID=com.fleet.app
```

---

## Installation

### Install React Native Firebase

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
# or
yarn add @react-native-firebase/app @react-native-firebase/messaging
```

### Install Additional Dependencies

```bash
npm install @notifee/react-native  # For rich notifications
# or
yarn add @notifee/react-native
```

---

## iOS Setup

### 1. Enable Push Notifications in Xcode

1. Open your project in Xcode
2. Select your target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "Push Notifications"
5. Add "Background Modes" capability and enable "Remote notifications"

### 2. Configure APNS

#### Option A: Using Auth Key (Recommended)

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys)
2. Create a new key with "Apple Push Notifications service (APNs)" enabled
3. Download the `.p8` file
4. Note your Key ID and Team ID
5. Upload to your backend server

#### Option B: Using Certificate

1. Generate a Certificate Signing Request (CSR) in Keychain Access
2. Create an APNs certificate in Apple Developer Portal
3. Download and install the certificate
4. Export as `.p12` file

### 3. Update AppDelegate.m

```objc
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Firebase initialization
  [FIRApp configure];

  // Request notification permissions
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge)
                        completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (granted) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] registerForRemoteNotifications];
      });
    }
  }];

  return YES;
}

// Handle registration success
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [FIRMessaging messaging].APNSToken = deviceToken;
}

// Handle foreground notifications
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  completionHandler(UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionSound | UNNotificationPresentationOptionBadge);
}

// Handle notification taps
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler {
  completionHandler();
}

@end
```

### 4. Pod Installation

```bash
cd ios
pod install
cd ..
```

---

## Android Setup

### 1. Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Your apps
4. Download `google-services.json`
5. Place it in `android/app/`

### 2. Update build.gradle Files

**android/build.gradle:**
```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

**android/app/build.gradle:**
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
  implementation platform('com.google.firebase:firebase-bom:32.0.0')
  implementation 'com.google.firebase:firebase-messaging'
}
```

### 3. Update AndroidManifest.xml

```xml
<manifest>
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

  <application>
    <!-- Firebase Messaging Service -->
    <service
      android:name=".FirebaseMessagingService"
      android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
      </intent-filter>
    </service>

    <!-- Default notification channel -->
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_channel_id"
      android:value="fleet_notifications" />
  </application>
</manifest>
```

### 4. Create Firebase Messaging Service

**android/app/src/main/java/.../FirebaseMessagingService.java:**
```java
package com.fleet.app;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class FleetFirebaseMessagingService extends FirebaseMessagingService {
  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    // Handle notification
  }

  @Override
  public void onNewToken(String token) {
    // Send token to server
    sendTokenToServer(token);
  }

  private void sendTokenToServer(String token) {
    // Implement token sending logic
  }
}
```

---

## Device Registration

### Request Permissions and Get Token

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  } else {
    // Android 13+ requires runtime permission
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
}

/**
 * Get FCM device token
 */
export async function getDeviceToken(): Promise<string | null> {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Error getting device token:', error);
    return null;
  }
}

/**
 * Register device with Fleet backend
 */
export async function registerDevice(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    const deviceToken = await getDeviceToken();
    if (!deviceToken) {
      console.error('Failed to get device token');
      return;
    }

    // Get device info
    const deviceInfo = {
      deviceToken,
      platform: Platform.OS,
      deviceName: await getDeviceName(),
      deviceModel: await getDeviceModel(),
      osVersion: Platform.Version.toString(),
      appVersion: getAppVersion(),
    };

    // Register with backend
    const response = await fetch('https://your-api.com/api/push-notifications/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(deviceInfo),
    });

    const data = await response.json();
    if (data.success) {
      console.log('Device registered successfully');
    }
  } catch (error) {
    console.error('Error registering device:', error);
  }
}
```

### Monitor Token Refresh

```typescript
import messaging from '@react-native-firebase/messaging';

/**
 * Listen for token refresh
 */
export function setupTokenRefreshListener() {
  return messaging().onTokenRefresh(async (token) => {
    console.log('Token refreshed:', token);

    // Update token on server
    try {
      await fetch('https://your-api.com/api/push-notifications/register-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          deviceToken: token,
          platform: Platform.OS,
        }),
      });
    } catch (error) {
      console.error('Error updating token:', error);
    }
  });
}
```

---

## Receiving Notifications

### Setup Message Listeners

```typescript
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

/**
 * Handle foreground notifications
 */
export function setupForegroundNotificationHandler() {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground notification:', remoteMessage);

    // Display notification using Notifee for better control
    await displayNotification(remoteMessage);
  });
}

/**
 * Handle background notifications
 */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification:', remoteMessage);

  // Process notification in background
  await displayNotification(remoteMessage);
});

/**
 * Display notification with Notifee
 */
async function displayNotification(remoteMessage: any) {
  const { notification, data } = remoteMessage;

  // Create notification channel (Android)
  const channelId = await notifee.createChannel({
    id: data?.category || 'default',
    name: getCategoryName(data?.category),
    importance: getImportance(data?.priority),
    sound: data?.sound || 'default',
  });

  // Prepare action buttons
  const actions = [];
  if (data?.actionButtons) {
    const buttons = JSON.parse(data.actionButtons);
    actions.push(
      ...buttons.map((btn: any) => ({
        title: btn.title,
        pressAction: { id: btn.id },
      }))
    );
  }

  // Display notification
  await notifee.displayNotification({
    title: notification?.title,
    body: notification?.body,
    data: data,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      actions,
      smallIcon: 'ic_notification',
      largeIcon: data?.imageUrl,
      importance: getImportance(data?.priority),
      sound: data?.sound || 'default',
    },
    ios: {
      categoryId: data?.category,
      attachments: data?.imageUrl ? [{ url: data.imageUrl }] : [],
      sound: data?.sound || 'default',
    },
  });
}

/**
 * Map category to display name
 */
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    critical_alert: 'Critical Alerts',
    maintenance_reminder: 'Maintenance',
    task_assignment: 'Tasks',
    driver_alert: 'Driver Alerts',
    administrative: 'Administrative',
    performance: 'Performance',
  };
  return names[category] || 'Notifications';
}

/**
 * Map priority to Android importance
 */
function getImportance(priority: string): number {
  const { Importance } = notifee.Android;
  switch (priority) {
    case 'critical': return Importance.HIGH;
    case 'high': return Importance.HIGH;
    case 'normal': return Importance.DEFAULT;
    case 'low': return Importance.LOW;
    default: return Importance.DEFAULT;
  }
}
```

### Handle Notification Open

```typescript
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

/**
 * Handle notification opened from quit state
 */
export async function handleInitialNotification() {
  const remoteMessage = await messaging().getInitialNotification();

  if (remoteMessage) {
    console.log('Notification opened app from quit state:', remoteMessage);
    handleNotificationOpen(remoteMessage.data);
  }
}

/**
 * Handle notification opened from background
 */
export function setupNotificationOpenedListener() {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);
    handleNotificationOpen(remoteMessage.data);
  });
}

/**
 * Handle Notifee events (for action buttons)
 */
export function setupNotifeeEventHandler() {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('Notification pressed:', detail);
      handleNotificationOpen(detail.notification?.data);
    } else if (type === EventType.ACTION_PRESS) {
      console.log('Action pressed:', detail);
      handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
    }
  });
}

/**
 * Handle background events
 */
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    console.log('Background action pressed:', detail);
    await handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
  }
});
```

---

## Handling Actions

### Process Notification Actions

```typescript
/**
 * Handle notification opened
 */
async function handleNotificationOpen(data: any) {
  // Track notification opened
  await trackNotificationOpened(data?.recipientId);

  // Navigate to relevant screen
  if (data?.entity_type && data?.entity_id) {
    navigateToEntity(data.entity_type, data.entity_id);
  }
}

/**
 * Handle action button press
 */
async function handleNotificationAction(actionId: string, data: any) {
  console.log('Action:', actionId, 'Data:', data);

  // Track notification clicked
  await trackNotificationClicked(data?.recipientId, actionId);

  switch (actionId) {
    case 'acknowledge':
      await acknowledgeAlert(data?.alert_id);
      break;
    case 'view':
      navigateToEntity(data?.entity_type, data?.entity_id);
      break;
    case 'dismiss':
      // Just dismiss the notification
      break;
    case 'call_driver':
      // Initiate phone call
      callDriver(data?.driver_phone);
      break;
    case 'view_map':
      // Open map view
      openMap(data?.location);
      break;
  }
}

/**
 * Track notification opened
 */
async function trackNotificationOpened(recipientId: string) {
  if (!recipientId) return;

  try {
    await fetch(`https://your-api.com/api/push-notifications/${recipientId}/opened`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
  } catch (error) {
    console.error('Error tracking notification open:', error);
  }
}

/**
 * Track notification action clicked
 */
async function trackNotificationClicked(recipientId: string, action: string) {
  if (!recipientId) return;

  try {
    await fetch(`https://your-api.com/api/push-notifications/${recipientId}/clicked`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({ action }),
    });
  } catch (error) {
    console.error('Error tracking notification click:', error);
  }
}

/**
 * Navigate to entity
 */
function navigateToEntity(entityType: string, entityId: string) {
  // Implement your navigation logic
  switch (entityType) {
    case 'vehicle':
      navigation.navigate('VehicleDetails', { vehicleId: entityId });
      break;
    case 'task':
      navigation.navigate('TaskDetails', { taskId: entityId });
      break;
    case 'incident':
      navigation.navigate('IncidentDetails', { incidentId: entityId });
      break;
  }
}
```

---

## Testing

### Test Push Notifications

#### Using Backend Test Endpoint

```bash
curl -X POST https://your-api.com/api/push-notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Using Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter title and message
4. Select your app
5. Send test message to your device token

#### Using FCM API Directly

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test"
    },
    "data": {
      "category": "administrative",
      "priority": "normal"
    }
  }'
```

### Test Notification Categories

```typescript
// Test different notification types
const testNotifications = [
  {
    category: 'critical_alert',
    title: 'Vehicle Breakdown',
    message: 'Vehicle V-001 has broken down',
    priority: 'critical',
  },
  {
    category: 'maintenance_reminder',
    title: 'Maintenance Due',
    message: 'Oil change due in 2 days',
    priority: 'normal',
  },
  {
    category: 'task_assignment',
    title: 'New Task Assigned',
    message: 'Pickup delivery at Warehouse A',
    priority: 'high',
  },
];
```

---

## Troubleshooting

### iOS Issues

**Problem: Not receiving notifications**
- Check if push notifications capability is enabled
- Verify APNS credentials are correct
- Check device token is being sent to backend
- Ensure app has notification permissions

**Problem: Notifications not showing in foreground**
- Implement `willPresentNotification` delegate method
- Set presentation options

### Android Issues

**Problem: Not receiving notifications**
- Verify google-services.json is in the correct location
- Check Firebase Cloud Messaging is enabled
- Ensure device token is valid
- Check notification channels are created

**Problem: No notification sound**
- Create notification channel with sound
- Check device notification settings
- Verify sound file exists in res/raw

### General Issues

**Problem: Token not refreshing**
- Implement `onTokenRefresh` listener
- Update token on server when it changes

**Problem: Notifications not tracking**
- Verify recipient IDs are being sent
- Check API endpoints are reachable
- Implement error handling

### Debug Logging

```typescript
// Enable Firebase debug logging
if (__DEV__) {
  messaging().setLogLevel('debug');
}

// Log all notification events
messaging().onMessage((message) => {
  console.log('[FCM] Foreground:', JSON.stringify(message, null, 2));
});

notifee.onForegroundEvent(({ type, detail }) => {
  console.log('[Notifee] Event:', type, JSON.stringify(detail, null, 2));
});
```

---

## Best Practices

1. **Always request permissions at the right time** - Don't ask on app launch
2. **Handle token refresh** - Tokens can expire or change
3. **Implement deep linking** - Navigate users to relevant screens
4. **Track analytics** - Monitor delivery, opens, and clicks
5. **Test on real devices** - Simulators have limitations
6. **Handle notification channels** - Organize notifications by type
7. **Respect user preferences** - Allow users to opt out of categories
8. **Test background scenarios** - App killed, background, foreground
9. **Implement retry logic** - For failed registrations
10. **Monitor performance** - Don't block the main thread

---

## Additional Resources

- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Notifee Documentation](https://notifee.app/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

---

## Support

For issues or questions:
- Email: support@fleet.capitaltechalliance.com
- GitHub: https://github.com/your-org/fleet-management
- Documentation: https://docs.fleet.capitaltechalliance.com
