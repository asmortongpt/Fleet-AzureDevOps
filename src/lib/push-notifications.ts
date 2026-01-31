/**
 * Push Notifications System
 *
 * Features:
 * - Web Push API integration
 * - VAPID key management
 * - Subscription management
 * - Permission handling
 * - Notification customization
 */
import logger from '@/utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

export interface CustomNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[] | number;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// VAPID public key - should be environment variable in production
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return isPushSupported() && getNotificationPermission() === 'granted';
}

// ============================================================================
// PERMISSION MANAGEMENT
// ============================================================================

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    logger.warn('[Push] Notifications not supported');
    return 'denied';
  }

  // Permission already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Permission already denied
  if (Notification.permission === 'denied') {
    logger.warn('[Push] Notification permission denied');
    return 'denied';
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    logger.info('[Push] Permission result:', permission);
    return permission;
  } catch (error) {
    logger.error('[Push] Permission request failed:', error);
    return 'denied';
  }
}

/**
 * Show a local notification (doesn't require push subscription)
 */
export async function showLocalNotification(
  options: CustomNotificationOptions
): Promise<Notification | null> {
  if (!('Notification' in window)) {
    logger.warn('[Push] Notifications not supported');
    return null;
  }

  // Request permission if needed
  if (Notification.permission === 'default') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }
  }

  if (Notification.permission !== 'granted') {
    logger.warn('[Push] Notification permission not granted');
    return null;
  }

  try {
    // Cast to any to allow extended notification options (vibrate, etc.)
    // These are valid in most browsers but not in TypeScript's strict types
    const notificationOptions: NotificationOptions & Record<string, unknown> = {
      body: options.body,
      icon: options.icon || '/icons/icon-192.png',
      badge: options.badge || '/icons/badge-72.png',
      vibrate: options.vibrate || [200, 100, 200],
      tag: options.tag || `notification-${Date.now()}`,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data,
    };

    const notification = new Notification(options.title, notificationOptions as NotificationOptions);

    logger.info('[Push] Local notification shown');
    return notification;
  } catch (error) {
    logger.error('[Push] Failed to show notification:', error);
    return null;
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    logger.warn('[Push] Push notifications not supported');
    return null;
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      logger.info('[Push] Already subscribed');
      return subscriptionToJSON(subscription);
    }

    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      logger.warn('[Push] Permission not granted');
      return null;
    }

    // Create new subscription
    if (!VAPID_PUBLIC_KEY) {
      logger.error('[Push] VAPID public key not configured');
      return null;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    logger.info('[Push] Subscribed successfully');

    // Send subscription to server
    const subscriptionData = subscriptionToJSON(subscription);
    await sendSubscriptionToServer(subscriptionData);

    return subscriptionData;
  } catch (error) {
    logger.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return null;
    }

    return subscriptionToJSON(subscription);
  } catch (error) {
    logger.error('[Push] Failed to get subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      logger.info('[Push] No active subscription');
      return true;
    }

    // Unsubscribe
    const success = await subscription.unsubscribe();

    if (success) {
      logger.info('[Push] Unsubscribed successfully');

      // Notify server
      await deleteSubscriptionFromServer(subscriptionToJSON(subscription));
    }

    return success;
  } catch (error) {
    logger.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Check if user is subscribed
 */
export async function isSubscribed(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}

// ============================================================================
// SERVER COMMUNICATION
// ============================================================================

/**
 * Send subscription to server
 */
async function sendSubscriptionToServer(
  subscription: PushSubscriptionData
): Promise<void> {
  try {
    const response = await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    logger.info('[Push] Subscription sent to server');
  } catch (error) {
    logger.error('[Push] Failed to send subscription to server:', error);
    // Don't throw - subscription is still active locally
  }
}

/**
 * Delete subscription from server
 */
async function deleteSubscriptionFromServer(
  subscription: PushSubscriptionData
): Promise<void> {
  try {
    const response = await fetch('/api/v1/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    logger.info('[Push] Subscription deleted from server');
  } catch (error) {
    logger.error('[Push] Failed to delete subscription from server:', error);
  }
}

/**
 * Test push notification
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/push/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    logger.info('[Push] Test notification sent');
    return true;
  } catch (error) {
    logger.error('[Push] Failed to send test notification:', error);
    return false;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert PushSubscription to JSON object
 */
function subscriptionToJSON(subscription: PushSubscription): PushSubscriptionData {
  const rawKey = subscription.getKey('p256dh');
  const rawAuthSecret = subscription.getKey('auth');

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: rawKey ? arrayBufferToBase64(rawKey) : '',
      auth: rawAuthSecret ? arrayBufferToBase64(rawAuthSecret) : '',
    },
    expirationTime: subscription.expirationTime,
  };
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Setup notification click handlers
 */
export function setupNotificationHandlers(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
      logger.info('[Push] Notification clicked:', event.data);

      // Handle notification click
      if (event.data.url) {
        window.location.href = event.data.url;
      }
    }
  });
}

/**
 * Request notification permission with custom UI
 */
export async function requestPermissionWithUI(
  onGranted?: () => void,
  onDenied?: () => void
): Promise<NotificationPermission> {
  const permission = await requestNotificationPermission();

  if (permission === 'granted') {
    logger.info('[Push] Permission granted');
    if (onGranted) onGranted();
  } else {
    logger.info('[Push] Permission denied or dismissed');
    if (onDenied) onDenied();
  }

  return permission;
}

/**
 * Initialize push notification system
 */
export async function initPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    logger.warn('[Push] Push notifications not supported');
    return false;
  }

  try {
    // Setup handlers
    setupNotificationHandlers();

    // Check if already subscribed
    const currentSubscription = await getCurrentSubscription();

    if (currentSubscription) {
      logger.info('[Push] Already subscribed and initialized');
      return true;
    }

    // If permission is already granted, subscribe automatically
    if (Notification.permission === 'granted') {
      await subscribeToPushNotifications();
      return true;
    }

    logger.info('[Push] Initialization complete - waiting for user permission');
    return true;
  } catch (error) {
    logger.error('[Push] Initialization failed:', error);
    return false;
  }
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

/**
 * Show a fleet alert notification
 */
export async function showFleetAlert(
  message: string,
  vehicleId?: string
): Promise<void> {
  await showLocalNotification({
    title: 'Fleet Alert',
    body: message,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: vehicleId ? `vehicle-${vehicleId}` : undefined,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      type: 'fleet-alert',
      vehicleId,
      timestamp: Date.now(),
    },
  });
}

/**
 * Show a maintenance reminder notification
 */
export async function showMaintenanceReminder(
  vehicleName: string,
  maintenanceType: string
): Promise<void> {
  await showLocalNotification({
    title: 'Maintenance Reminder',
    body: `${vehicleName}: ${maintenanceType} due soon`,
    icon: '/icons/maintenance-icon.png',
    badge: '/icons/badge-72.png',
    tag: 'maintenance-reminder',
    data: {
      type: 'maintenance',
      vehicle: vehicleName,
      maintenanceType,
      timestamp: Date.now(),
    },
  });
}

/**
 * Show a driver assignment notification
 */
export async function showDriverAssignment(
  driverName: string,
  vehicleName: string
): Promise<void> {
  await showLocalNotification({
    title: 'Vehicle Assignment',
    body: `${driverName} assigned to ${vehicleName}`,
    icon: '/icons/icon-192.png',
    tag: 'driver-assignment',
    data: {
      type: 'assignment',
      driver: driverName,
      vehicle: vehicleName,
      timestamp: Date.now(),
    },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  isPushSupported,
  getNotificationPermission,
  areNotificationsEnabled,
  requestNotificationPermission,
  showLocalNotification,
  subscribeToPushNotifications,
  getCurrentSubscription,
  unsubscribeFromPushNotifications,
  isSubscribed,
  sendTestNotification,
  setupNotificationHandlers,
  requestPermissionWithUI,
  initPushNotifications,
  showFleetAlert,
  showMaintenanceReminder,
  showDriverAssignment,
};
