/**
 * Local Notifications Service
 * Handles scheduling, recurring, and reminder notifications
 */

import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  IOSNotificationPermissions,
  AndroidNotificationSetting,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalNotificationOptions {
  id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  sound?: string;
  vibration?: boolean;
  badgeCount?: number;
  imageUrl?: string;
  actions?: Array<{
    id: string;
    title: string;
  }>;
}

export interface ScheduledNotificationOptions extends LocalNotificationOptions {
  fireDate: Date;
}

export interface RecurringNotificationOptions extends LocalNotificationOptions {
  fireDate: Date;
  repeatFrequency: RepeatFrequency;
  repeatInterval?: number;
}

export interface ReminderOptions {
  id: string;
  title: string;
  body: string;
  reminderDate: Date;
  data?: Record<string, any>;
}

class LocalNotifications {
  private readonly STORAGE_KEY = '@local_notifications';

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    options: ScheduledNotificationOptions
  ): Promise<string> {
    try {
      const notificationId = options.id || this.generateId();

      // Create timestamp trigger
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: options.fireDate.getTime(),
      };

      // Display notification
      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title: options.title,
          body: options.body,
          data: options.data as any,
          android: {
            channelId: options.channelId || 'administrative',
            importance: AndroidImportance.HIGH,
            sound: options.sound || 'default',
            smallIcon: 'ic_launcher',
            largeIcon: options.imageUrl,
            vibrationPattern: options.vibration ? [300, 500] : undefined,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            actions: options.actions?.map((action) => ({
              title: action.title,
              pressAction: {
                id: action.id,
              },
            })),
          },
          ios: {
            sound: options.sound || 'default',
            badgeCount: options.badgeCount,
            attachments: options.imageUrl
              ? [{ url: options.imageUrl }]
              : undefined,
          },
        },
        trigger
      );

      // Store notification info
      await this.storeNotification(notificationId, {
        ...options,
        fireDate: options.fireDate.toISOString(),
        type: 'scheduled',
      });

      console.log('Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a recurring notification
   */
  async scheduleRecurringNotification(
    options: RecurringNotificationOptions
  ): Promise<string> {
    try {
      const notificationId = options.id || this.generateId();

      // Create repeating timestamp trigger
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: options.fireDate.getTime(),
        repeatFrequency: options.repeatFrequency,
        alarmManager: Platform.OS === 'android' ? {
          allowWhileIdle: true,
        } : undefined,
      };

      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title: options.title,
          body: options.body,
          data: options.data as any,
          android: {
            channelId: options.channelId || 'maintenance_reminder',
            importance: AndroidImportance.HIGH,
            sound: options.sound || 'default',
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            actions: options.actions?.map((action) => ({
              title: action.title,
              pressAction: {
                id: action.id,
              },
            })),
          },
          ios: {
            sound: options.sound || 'default',
            badgeCount: options.badgeCount,
          },
        },
        trigger
      );

      // Store notification info
      await this.storeNotification(notificationId, {
        ...options,
        fireDate: options.fireDate.toISOString(),
        type: 'recurring',
        repeatFrequency: options.repeatFrequency,
      });

      console.log('Recurring notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling recurring notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a reminder notification
   */
  async scheduleReminder(options: ReminderOptions): Promise<string> {
    return this.scheduleNotification({
      id: options.id,
      title: options.title,
      body: options.body,
      fireDate: options.reminderDate,
      data: {
        ...options.data,
        type: 'reminder',
      },
      channelId: 'maintenance_reminder',
    });
  }

  /**
   * Schedule maintenance reminder
   */
  async scheduleMaintenanceReminder(
    vehicleId: string,
    vehicleName: string,
    maintenanceType: string,
    dueDate: Date
  ): Promise<string> {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3); // Remind 3 days before

    return this.scheduleNotification({
      id: `maintenance_${vehicleId}_${Date.now()}`,
      title: `Maintenance Due: ${vehicleName}`,
      body: `${maintenanceType} is due on ${dueDate.toLocaleDateString()}`,
      fireDate: reminderDate,
      data: {
        type: 'maintenance_reminder',
        vehicleId,
        maintenanceType,
        dueDate: dueDate.toISOString(),
      },
      channelId: 'maintenance_reminder',
      actions: [
        { id: 'view', title: 'View Details' },
        { id: 'snooze', title: 'Remind Later' },
      ],
    });
  }

  /**
   * Schedule inspection reminder
   */
  async scheduleInspectionReminder(
    vehicleId: string,
    vehicleName: string,
    inspectionType: string,
    dueDate: Date
  ): Promise<string> {
    return this.scheduleNotification({
      id: `inspection_${vehicleId}_${Date.now()}`,
      title: `Inspection Required: ${vehicleName}`,
      body: `${inspectionType} inspection is required`,
      fireDate: dueDate,
      data: {
        type: 'inspection_reminder',
        vehicleId,
        inspectionType,
      },
      channelId: 'maintenance_reminder',
      actions: [
        { id: 'start_inspection', title: 'Start Inspection' },
        { id: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Schedule daily reminder
   */
  async scheduleDailyReminder(
    title: string,
    body: string,
    hour: number,
    minute: number
  ): Promise<string> {
    const fireDate = new Date();
    fireDate.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (fireDate < new Date()) {
      fireDate.setDate(fireDate.getDate() + 1);
    }

    return this.scheduleRecurringNotification({
      title,
      body,
      fireDate,
      repeatFrequency: RepeatFrequency.DAILY,
      channelId: 'administrative',
    });
  }

  /**
   * Schedule weekly reminder
   */
  async scheduleWeeklyReminder(
    title: string,
    body: string,
    dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
    hour: number,
    minute: number
  ): Promise<string> {
    const fireDate = new Date();
    const currentDay = fireDate.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

    fireDate.setDate(fireDate.getDate() + daysUntilTarget);
    fireDate.setHours(hour, minute, 0, 0);

    return this.scheduleRecurringNotification({
      title,
      body,
      fireDate,
      repeatFrequency: RepeatFrequency.WEEKLY,
      channelId: 'administrative',
    });
  }

  /**
   * Schedule shift start reminder
   */
  async scheduleShiftReminder(
    shiftStart: Date,
    minutesBefore: number = 15
  ): Promise<string> {
    const reminderTime = new Date(shiftStart);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);

    return this.scheduleNotification({
      id: `shift_${shiftStart.getTime()}`,
      title: 'Shift Starting Soon',
      body: `Your shift starts in ${minutesBefore} minutes`,
      fireDate: reminderTime,
      data: {
        type: 'shift_reminder',
        shiftStart: shiftStart.toISOString(),
      },
      channelId: 'task_assignment',
    });
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      await this.removeStoredNotification(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Cancel notifications by type
   */
  async cancelNotificationsByType(type: string): Promise<void> {
    try {
      const stored = await this.getStoredNotifications();
      const notificationsToCancel = Object.entries(stored)
        .filter(([_, data]: [string, any]) => data.data?.type === type)
        .map(([id]) => id);

      for (const id of notificationsToCancel) {
        await this.cancelNotification(id);
      }

      console.log(`Cancelled ${notificationsToCancel.length} notifications of type:`, type);
    } catch (error) {
      console.error('Error cancelling notifications by type:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<any[]> {
    try {
      const triggers = await notifee.getTriggerNotifications();
      return triggers;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get stored notification data
   */
  async getStoredNotifications(): Promise<Record<string, any>> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return {};
    }
  }

  /**
   * Store notification info
   */
  private async storeNotification(id: string, data: any): Promise<void> {
    try {
      const stored = await this.getStoredNotifications();
      stored[id] = {
        ...data,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Remove stored notification
   */
  private async removeStoredNotification(id: string): Promise<void> {
    try {
      const stored = await this.getStoredNotifications();
      delete stored[id];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Error removing stored notification:', error);
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check notification permissions
   */
  async checkPermissions(): Promise<{
    granted: boolean;
    settings: IOSNotificationPermissions | AndroidNotificationSetting;
  }> {
    try {
      const settings = await notifee.requestPermission();

      return {
        granted: settings.authorizationStatus >= 1, // AUTHORIZED or PROVISIONAL
        settings,
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        granted: false,
        settings: {} as any,
      };
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= 1;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Display immediate local notification (not scheduled)
   */
  async displayNotification(options: LocalNotificationOptions): Promise<string> {
    try {
      const notificationId = options.id || this.generateId();

      await notifee.displayNotification({
        id: notificationId,
        title: options.title,
        body: options.body,
        data: options.data as any,
        android: {
          channelId: options.channelId || 'administrative',
          importance: AndroidImportance.HIGH,
          sound: options.sound || 'default',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
        ios: {
          sound: options.sound || 'default',
          badgeCount: options.badgeCount,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error displaying notification:', error);
      throw error;
    }
  }

  /**
   * Update badge count
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
   * Increment badge count
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
   * Decrement badge count
   */
  async decrementBadge(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        const currentBadge = await notifee.getBadgeCount();
        if (currentBadge > 0) {
          await notifee.setBadgeCount(currentBadge - 1);
        }
      } catch (error) {
        console.error('Error decrementing badge:', error);
      }
    }
  }
}

export const localNotifications = new LocalNotifications();
export default localNotifications;
