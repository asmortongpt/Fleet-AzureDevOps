/**
 * Notification Handler
 * Parses notification payloads, routes to screens, and handles actions
 */

import { Vibration, Platform } from 'react-native';
import notifee, { AndroidGroupAlertBehavior } from '@notifee/react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export interface ParsedNotification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  screen?: string;
  screenParams?: Record<string, any>;
  imageUrl?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
}

export interface NotificationRoute {
  screen: string;
  params?: Record<string, any>;
}

class NotificationHandler {
  /**
   * Parse notification payload
   */
  parseNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): ParsedNotification | null {
    try {
      const { notification, data, messageId } = remoteMessage;

      if (!notification || !data) {
        console.warn('Invalid notification payload');
        return null;
      }

      return {
        id: data.notificationId || messageId || '',
        type: data.type || 'general',
        category: data.category || 'administrative',
        title: notification.title || '',
        message: notification.body || '',
        data: data,
        priority: this.parsePriority(data.priority),
        screen: data.screen,
        screenParams: this.parseScreenParams(data),
        imageUrl: notification.android?.imageUrl || notification.ios?.imageUrl,
        actions: this.parseActions(data.actions),
      };
    } catch (error) {
      console.error('Error parsing notification:', error);
      return null;
    }
  }

  /**
   * Parse priority level
   */
  private parsePriority(priority?: string): 'low' | 'normal' | 'high' | 'critical' {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * Parse screen parameters from notification data
   */
  private parseScreenParams(data: any): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract common parameters
    if (data.vehicleId) params.vehicleId = data.vehicleId;
    if (data.driverId) params.driverId = data.driverId;
    if (data.workOrderId) params.workOrderId = data.workOrderId;
    if (data.taskId) params.taskId = data.taskId;
    if (data.maintenanceId) params.maintenanceId = data.maintenanceId;
    if (data.incidentId) params.incidentId = data.incidentId;
    if (data.tripId) params.tripId = data.tripId;

    // Parse any additional params
    if (data.params) {
      try {
        const additionalParams =
          typeof data.params === 'string' ? JSON.parse(data.params) : data.params;
        Object.assign(params, additionalParams);
      } catch (error) {
        console.error('Error parsing additional params:', error);
      }
    }

    return params;
  }

  /**
   * Parse notification actions
   */
  private parseActions(actionsData?: string | any[]): NotificationAction[] {
    if (!actionsData) return [];

    try {
      const actions =
        typeof actionsData === 'string' ? JSON.parse(actionsData) : actionsData;

      if (!Array.isArray(actions)) return [];

      return actions.map((action) => ({
        id: action.id,
        title: action.title,
        icon: action.icon,
        destructive: action.destructive || false,
      }));
    } catch (error) {
      console.error('Error parsing actions:', error);
      return [];
    }
  }

  /**
   * Route notification to appropriate screen
   */
  getRouteFromNotification(notification: ParsedNotification): NotificationRoute | null {
    const { type, category, screen, screenParams, data } = notification;

    // If screen is explicitly provided, use it
    if (screen) {
      return {
        screen,
        params: screenParams,
      };
    }

    // Route based on notification type
    switch (type) {
      case 'maintenance_due':
        return {
          screen: 'MaintenanceDetail',
          params: { maintenanceId: data.maintenanceId },
        };

      case 'task_assigned':
        return {
          screen: 'TaskDetail',
          params: { taskId: data.taskId },
        };

      case 'vehicle_alert':
        return {
          screen: 'VehicleDetail',
          params: { vehicleId: data.vehicleId },
        };

      case 'driver_alert':
        return {
          screen: 'DriverDetail',
          params: { driverId: data.driverId },
        };

      case 'work_order_update':
        return {
          screen: 'WorkOrderDetail',
          params: { workOrderId: data.workOrderId },
        };

      case 'inspection_required':
        return {
          screen: 'InspectionForm',
          params: { vehicleId: data.vehicleId },
        };

      case 'incident_report':
        return {
          screen: 'IncidentDetail',
          params: { incidentId: data.incidentId },
        };

      case 'fuel_purchase':
        return {
          screen: 'FuelTransactions',
          params: { vehicleId: data.vehicleId },
        };

      case 'trip_completed':
        return {
          screen: 'TripDetail',
          params: { tripId: data.tripId },
        };

      case 'message_received':
        return {
          screen: 'Messages',
          params: { messageId: data.messageId },
        };

      case 'schedule_update':
        return {
          screen: 'Schedule',
          params: screenParams,
        };

      default:
        // Route based on category if type-specific routing fails
        return this.getRouteFromCategory(category, screenParams);
    }
  }

  /**
   * Route based on notification category
   */
  private getRouteFromCategory(
    category: string,
    params?: Record<string, any>
  ): NotificationRoute | null {
    switch (category) {
      case 'critical_alert':
        return { screen: 'Alerts', params };

      case 'maintenance_reminder':
        return { screen: 'Maintenance', params };

      case 'task_assignment':
        return { screen: 'Tasks', params };

      case 'driver_alert':
        return { screen: 'DriverDashboard', params };

      case 'administrative':
        return { screen: 'Home', params };

      case 'performance':
        return { screen: 'Performance', params };

      default:
        return { screen: 'Notifications', params };
    }
  }

  /**
   * Handle action button press
   */
  async handleActionPress(
    actionId: string,
    notification: ParsedNotification,
    navigationCallback?: (route: NotificationRoute) => void
  ): Promise<void> {
    console.log('Handling action press:', actionId);

    switch (actionId) {
      case 'acknowledge':
        await this.handleAcknowledge(notification);
        break;

      case 'view':
      case 'open':
        const route = this.getRouteFromNotification(notification);
        if (route && navigationCallback) {
          navigationCallback(route);
        }
        break;

      case 'accept':
        await this.handleAccept(notification);
        break;

      case 'decline':
        await this.handleDecline(notification);
        break;

      case 'complete':
        await this.handleComplete(notification);
        break;

      case 'snooze':
        await this.handleSnooze(notification);
        break;

      case 'dismiss':
        // Just dismiss (default behavior)
        break;

      default:
        console.warn('Unknown action:', actionId);
    }
  }

  /**
   * Handle acknowledge action
   */
  private async handleAcknowledge(notification: ParsedNotification): Promise<void> {
    // API call to acknowledge notification
    console.log('Acknowledging notification:', notification.id);
    // await apiClient.post(`/api/notifications/${notification.id}/acknowledge`);
  }

  /**
   * Handle accept action
   */
  private async handleAccept(notification: ParsedNotification): Promise<void> {
    console.log('Accepting:', notification.type);
    // Handle based on notification type
    // await apiClient.post(`/api/notifications/${notification.id}/accept`);
  }

  /**
   * Handle decline action
   */
  private async handleDecline(notification: ParsedNotification): Promise<void> {
    console.log('Declining:', notification.type);
    // await apiClient.post(`/api/notifications/${notification.id}/decline`);
  }

  /**
   * Handle complete action
   */
  private async handleComplete(notification: ParsedNotification): Promise<void> {
    console.log('Completing:', notification.type);
    // await apiClient.post(`/api/notifications/${notification.id}/complete`);
  }

  /**
   * Handle snooze action
   */
  private async handleSnooze(notification: ParsedNotification): Promise<void> {
    console.log('Snoozing notification:', notification.id);
    // Reschedule notification for later
    // await apiClient.post(`/api/notifications/${notification.id}/snooze`);
  }

  /**
   * Group notifications by type
   */
  async groupNotification(notification: ParsedNotification): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const groupId = `${notification.category}_group`;
      const groupSummary = this.getGroupSummary(notification.category);

      // Create notification group
      await notifee.displayNotification({
        id: notification.id,
        title: notification.title,
        body: notification.message,
        data: notification.data as any,
        android: {
          channelId: notification.category,
          groupId,
          groupSummary: false,
          groupAlertBehavior: AndroidGroupAlertBehavior.CHILDREN,
        },
      });

      // Update group summary
      await notifee.displayNotification({
        id: `${groupId}_summary`,
        title: groupSummary.title,
        body: groupSummary.body,
        android: {
          channelId: notification.category,
          groupId,
          groupSummary: true,
        },
      });
    } catch (error) {
      console.error('Error grouping notification:', error);
    }
  }

  /**
   * Get group summary for category
   */
  private getGroupSummary(category: string): { title: string; body: string } {
    switch (category) {
      case 'critical_alert':
        return {
          title: 'Critical Alerts',
          body: 'You have multiple critical alerts',
        };

      case 'maintenance_reminder':
        return {
          title: 'Maintenance Reminders',
          body: 'You have upcoming maintenance tasks',
        };

      case 'task_assignment':
        return {
          title: 'Task Assignments',
          body: 'You have new task assignments',
        };

      case 'driver_alert':
        return {
          title: 'Driver Alerts',
          body: 'You have driver alerts',
        };

      default:
        return {
          title: 'Notifications',
          body: 'You have multiple notifications',
        };
    }
  }

  /**
   * Apply sound pattern based on priority
   */
  getSoundPattern(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'urgent';
      case 'high':
        return 'high_priority';
      case 'low':
        return 'low_priority';
      default:
        return 'default';
    }
  }

  /**
   * Apply vibration pattern based on priority
   */
  applyVibrationPattern(priority: string): void {
    if (Platform.OS === 'android') {
      switch (priority) {
        case 'critical':
          // Long vibration pattern for critical
          Vibration.vibrate([0, 500, 200, 500, 200, 500]);
          break;
        case 'high':
          // Medium vibration pattern
          Vibration.vibrate([0, 300, 100, 300]);
          break;
        case 'normal':
          // Standard vibration
          Vibration.vibrate(300);
          break;
        case 'low':
          // Light vibration
          Vibration.vibrate(100);
          break;
      }
    } else {
      // iOS uses default vibration
      Vibration.vibrate();
    }
  }

  /**
   * Get LED light color for Android
   */
  getLedColor(category: string): string {
    switch (category) {
      case 'critical_alert':
        return '#FF0000'; // Red
      case 'maintenance_reminder':
        return '#FFA500'; // Orange
      case 'task_assignment':
        return '#0000FF'; // Blue
      case 'driver_alert':
        return '#FFFF00'; // Yellow
      case 'performance':
        return '#00FF00'; // Green
      default:
        return '#FFFFFF'; // White
    }
  }
}

export const notificationHandler = new NotificationHandler();
export default notificationHandler;
