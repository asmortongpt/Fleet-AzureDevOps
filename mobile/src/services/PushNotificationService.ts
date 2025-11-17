/**
 * Push Notification Service for React Native
 * Handles Firebase Cloud Messaging, permissions, and notification management
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './ApiClient';

export interface NotificationPayload {
  notificationId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actions?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  importance: AndroidImportance;
  sound?: string;
  vibration?: boolean;
  lights?: boolean;
}

class PushNotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private unsubscribeForeground?: () => void;
  private unsubscribeBackground?: () => void;

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('PushNotificationService already initialized');
      return;
    }

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();

      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Create notification channels (Android)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Get FCM token
      await this.getFCMToken();

      // Setup message handlers
      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenedHandler();

      // Setup notification action handlers
      this.setupNotificationActionHandlers();

      this.isInitialized = true;
      console.log('PushNotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing PushNotificationService:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('iOS notification permission granted:', authStatus);
        }

        return enabled;
      } else {
        // Android - request permission from notifee
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get FCM token and register with backend
   */
  async getFCMToken(): Promise<string | null> {
    try {
      // Get FCM token
      const token = await messaging().getToken();

      if (token) {
        this.fcmToken = token;
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');

        // Store token locally
        await AsyncStorage.setItem('fcm_token', token);

        // Register token with backend
        await this.registerDeviceWithBackend(token);

        // Listen for token refresh
        this.setupTokenRefreshListener();

        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  private async registerDeviceWithBackend(deviceToken: string): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();

      await apiClient.post('/api/mobile/notifications/register-device', {
        deviceToken,
        platform: Platform.OS,
        ...deviceInfo,
      });

      console.log('Device registered with backend successfully');
    } catch (error) {
      console.error('Error registering device with backend:', error);
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    const DeviceInfo = require('react-native-device-info');

    return {
      deviceName: await DeviceInfo.getDeviceName(),
      deviceModel: DeviceInfo.getModel(),
      osVersion: DeviceInfo.getSystemVersion(),
      appVersion: DeviceInfo.getVersion(),
    };
  }

  /**
   * Setup token refresh listener
   */
  private setupTokenRefreshListener(): void {
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed');
      this.fcmToken = token;
      await AsyncStorage.setItem('fcm_token', token);
      await this.registerDeviceWithBackend(token);
    });
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    const channels: NotificationChannel[] = [
      {
        id: 'critical_alert',
        name: 'Critical Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'urgent',
        vibration: true,
        lights: true,
      },
      {
        id: 'maintenance_reminder',
        name: 'Maintenance Reminders',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
        vibration: true,
      },
      {
        id: 'task_assignment',
        name: 'Task Assignments',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      },
      {
        id: 'driver_alert',
        name: 'Driver Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      },
      {
        id: 'administrative',
        name: 'Administrative',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      },
      {
        id: 'performance',
        name: 'Performance Updates',
        importance: AndroidImportance.LOW,
      },
    ];

    for (const channel of channels) {
      await notifee.createChannel({
        id: channel.id,
        name: channel.name,
        importance: channel.importance,
        sound: channel.sound,
        vibration: channel.vibration,
        lights: channel.lights,
      });
    }

    console.log('Notification channels created');
  }

  /**
   * Setup foreground message handler
   */
  private setupForegroundHandler(): void {
    this.unsubscribeForeground = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('Foreground notification received:', remoteMessage);
        await this.displayNotification(remoteMessage);
      }
    );
  }

  /**
   * Setup background message handler
   */
  private setupBackgroundHandler(): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification received:', remoteMessage);
      await this.displayNotification(remoteMessage);
    });
  }

  /**
   * Setup notification opened handler
   */
  private setupNotificationOpenedHandler(): void {
    // Handle notification opened app from background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      this.handleNotificationOpened(remoteMessage);
    });

    // Handle notification opened app from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          this.handleNotificationOpened(remoteMessage);
        }
      });
  }

  /**
   * Setup notification action handlers (button taps)
   */
  private setupNotificationActionHandlers(): void {
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        console.log('Notification action pressed:', detail.pressAction?.id);
        await this.handleNotificationAction(detail);
      } else if (type === EventType.PRESS) {
        console.log('Notification pressed');
        await this.handleNotificationPress(detail);
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        console.log('Background notification action pressed:', detail.pressAction?.id);
        await this.handleNotificationAction(detail);
      }
    });
  }

  /**
   * Display notification using Notifee
   */
  private async displayNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    try {
      const { notification, data } = remoteMessage;

      if (!notification) {
        console.warn('No notification payload in remote message');
        return;
      }

      const channelId = data?.category || 'administrative';

      await notifee.displayNotification({
        id: data?.notificationId || remoteMessage.messageId,
        title: notification.title,
        body: notification.body,
        data: data as any,
        android: {
          channelId,
          importance: this.getAndroidImportance(data?.priority),
          sound: data?.sound || 'default',
          largeIcon: notification.android?.imageUrl,
          style: notification.android?.imageUrl
            ? {
                type: AndroidStyle.BIGPICTURE,
                picture: notification.android.imageUrl,
              }
            : undefined,
          actions: this.parseActions(data?.actions),
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
        ios: {
          sound: data?.sound || 'default',
          badgeCount: data?.badgeCount ? parseInt(data.badgeCount) : undefined,
          categoryId: channelId,
          attachments: notification.ios?.imageUrl
            ? [{ url: notification.ios.imageUrl }]
            : undefined,
        },
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  }

  /**
   * Parse notification actions from data
   */
  private parseActions(actionsData?: string): any[] {
    if (!actionsData) return [];

    try {
      const actions = typeof actionsData === 'string' ? JSON.parse(actionsData) : actionsData;
      return actions.map((action: any) => ({
        title: action.title,
        pressAction: {
          id: action.id,
        },
        icon: action.icon,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get Android importance level
   */
  private getAndroidImportance(priority?: string): AndroidImportance {
    switch (priority) {
      case 'critical':
        return AndroidImportance.HIGH;
      case 'high':
        return AndroidImportance.HIGH;
      case 'low':
        return AndroidImportance.LOW;
      default:
        return AndroidImportance.DEFAULT;
    }
  }

  /**
   * Handle notification opened (navigation)
   */
  private handleNotificationOpened(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const { data } = remoteMessage;

    // Track notification opened
    if (data?.notificationId) {
      this.trackNotificationOpened(data.notificationId);
    }

    // Navigate to appropriate screen
    if (data?.screen) {
      this.navigateToScreen(data.screen, data);
    }
  }

  /**
   * Handle notification press
   */
  private async handleNotificationPress(detail: any): Promise<void> {
    const { notification } = detail;

    // Track opened
    if (notification?.data?.notificationId) {
      await this.trackNotificationOpened(notification.data.notificationId);
    }

    // Navigate
    if (notification?.data?.screen) {
      this.navigateToScreen(notification.data.screen, notification.data);
    }
  }

  /**
   * Handle notification action (button tap)
   */
  private async handleNotificationAction(detail: any): Promise<void> {
    const { pressAction, notification } = detail;

    // Track action
    if (notification?.data?.notificationId && pressAction?.id) {
      await this.trackNotificationClicked(
        notification.data.notificationId,
        pressAction.id
      );
    }

    // Handle specific actions
    switch (pressAction?.id) {
      case 'acknowledge':
        // Handle acknowledge action
        break;
      case 'view':
        // Navigate to detail view
        if (notification?.data?.screen) {
          this.navigateToScreen(notification.data.screen, notification.data);
        }
        break;
      case 'dismiss':
        // Just dismiss (default behavior)
        break;
      default:
        console.log('Unknown action:', pressAction?.id);
    }
  }

  /**
   * Navigate to screen based on notification data
   */
  private navigateToScreen(screenName: string, data: any): void {
    // This will be handled by the navigation service
    // Import and use your navigation service here
    console.log('Navigate to screen:', screenName, data);

    // Example:
    // NavigationService.navigate(screenName, { ...data });
  }

  /**
   * Track notification opened with backend
   */
  private async trackNotificationOpened(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`/api/push-notifications/${notificationId}/opened`);
    } catch (error) {
      console.error('Error tracking notification opened:', error);
    }
  }

  /**
   * Track notification clicked with backend
   */
  private async trackNotificationClicked(
    notificationId: string,
    action: string
  ): Promise<void> {
    try {
      await apiClient.put(`/api/push-notifications/${notificationId}/clicked`, {
        action,
      });
    } catch (error) {
      console.error('Error tracking notification clicked:', error);
    }
  }

  /**
   * Set badge count (iOS)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await notifee.setBadgeCount(count);
      } catch (error) {
        console.error('Error setting badge count:', error);
      }
    }
  }

  /**
   * Increment badge count (iOS)
   */
  async incrementBadge(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        const currentBadge = await notifee.getBadgeCount();
        await notifee.setBadgeCount(currentBadge + 1);
      } catch (error) {
        console.error('Error incrementing badge:', error);
      }
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    if (this.unsubscribeBackground) {
      this.unsubscribeBackground();
    }
    this.isInitialized = false;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
