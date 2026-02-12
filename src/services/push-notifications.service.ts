/**
 * Push Notifications Service
 *
 * Comprehensive push notification system for Fleet Management mobile app
 *
 * Features:
 * - Web Push API integration
 * - Service Worker notification handling
 * - Notification categories and priorities
 * - Action buttons in notifications
 * - Badge and icon management
 * - Notification history tracking
 * - Do Not Disturb support
 *
 * Security: VAPID authentication, secure subscription storage
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  category?: NotificationCategory;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationCategory =
  | 'maintenance'
  | 'inspection'
  | 'damage'
  | 'assignment'
  | 'alert'
  | 'message'
  | 'system';

interface NotificationSettings {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  doNotDisturbStart?: string; // HH:MM format
  doNotDisturbEnd?: string; // HH:MM format
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private settings: NotificationSettings;
  private readonly VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  private notificationQueue: NotificationPayload[] = [];

  constructor() {
    this.settings = this.loadSettings();
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PushNotificationService] Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('[PushNotificationService] Service Worker ready');

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('[PushNotificationService] Existing subscription found');
        await this.sendSubscriptionToServer(this.subscription);
      }

      // Setup message listener for notifications from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    } catch (error) {
      console.error('[PushNotificationService] Failed to initialize:', error);
    }
  }

  /**
   * Request notification permission and subscribe
   */
  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[PushNotificationService] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('[PushNotificationService] Permission granted');
        await this.subscribe();
        return true;
      } else if (permission === 'denied') {
        console.warn('[PushNotificationService] Permission denied');
        return false;
      } else {
        console.log('[PushNotificationService] Permission dismissed');
        return false;
      }
    } catch (error) {
      console.error('[PushNotificationService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('[PushNotificationService] Service Worker not ready');
      return null;
    }

    try {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY),
      };

      this.subscription = await this.registration.pushManager.subscribe(subscribeOptions);
      console.log('[PushNotificationService] Subscribed successfully');

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('[PushNotificationService] Subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('[PushNotificationService] No active subscription');
      return false;
    }

    try {
      await this.subscription.unsubscribe();
      await this.deleteSubscriptionFromServer(this.subscription);
      this.subscription = null;
      console.log('[PushNotificationService] Unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Show local notification
   */
  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.settings.enabled) {
      console.log('[PushNotificationService] Notifications disabled');
      return;
    }

    // Check category permissions
    if (payload.category && !this.settings.categories[payload.category]) {
      console.log(`[PushNotificationService] Category ${payload.category} disabled`);
      return;
    }

    // Check Do Not Disturb
    if (this.isDoNotDisturbActive()) {
      console.log('[PushNotificationService] Do Not Disturb active');
      this.queueNotification(payload);
      return;
    }

    try {
      if (!this.registration) {
        // Fallback to browser notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/fleet-icon-192.png',
          badge: payload.badge || '/fleet-badge-72.png',
          tag: payload.tag,
          data: payload.data,
        });
      } else {
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/fleet-icon-192.png',
          badge: payload.badge || '/fleet-badge-72.png',
          tag: payload.tag || `notification-${Date.now()}`,
          data: { ...payload.data, image: payload.image },
          actions: payload.actions || this.getDefaultActions(payload.category),
          requireInteraction: payload.requireInteraction || payload.priority === 'critical',
          silent: payload.silent || false,
          vibrate: this.settings.vibrationEnabled ? (payload.vibrate || [200, 100, 200]) : [],
          timestamp: payload.timestamp || Date.now(),
        } as NotificationOptions);
      }

      // Track notification
      this.trackNotification(payload);
    } catch (error) {
      console.error('[PushNotificationService] Failed to show notification:', error);
    }
  }

  /**
   * Send push notification via server
   */
  public async sendPushNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/notifications/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          userId,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('[PushNotificationService] Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Update notification settings
   */
  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Get notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Check if subscribed
   */
  public isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get notification history
   */
  public getNotificationHistory(limit = 50): NotificationPayload[] {
    const history = localStorage.getItem('notification-history');
    if (!history) return [];

    try {
      const parsed = JSON.parse(history);
      return parsed.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Clear notification history
   */
  public clearNotificationHistory(): void {
    localStorage.removeItem('notification-history');
  }

  // Helper methods

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[PushNotificationService] Subscription sent to server');
    } catch (error) {
      console.error('[PushNotificationService] Failed to send subscription:', error);
    }
  }

  private async deleteSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[PushNotificationService] Subscription deleted from server');
    } catch (error) {
      console.error('[PushNotificationService] Failed to delete subscription:', error);
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    if (event.data.type === 'NOTIFICATION_CLICK') {
      console.log('[PushNotificationService] Notification clicked:', event.data);
      // Handle notification click
      window.focus();
      if (event.data.url) {
        window.location.href = event.data.url;
      }
    }
  }

  private getDefaultActions(category?: NotificationCategory): NotificationAction[] {
    const actions: Record<NotificationCategory, NotificationAction[]> = {
      maintenance: [
        { action: 'view', title: 'View Details', icon: '/icons/view.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
      ],
      inspection: [
        { action: 'start', title: 'Start Inspection', icon: '/icons/start.png' },
        { action: 'later', title: 'Remind Later', icon: '/icons/later.png' },
      ],
      damage: [
        { action: 'urgent', title: 'View Damage', icon: '/icons/urgent.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
      ],
      assignment: [
        { action: 'accept', title: 'Accept', icon: '/icons/accept.png' },
        { action: 'decline', title: 'Decline', icon: '/icons/decline.png' },
      ],
      alert: [
        { action: 'view', title: 'View Alert', icon: '/icons/alert.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
      ],
      message: [
        { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
        { action: 'view', title: 'View', icon: '/icons/view.png' },
      ],
      system: [
        { action: 'ok', title: 'OK', icon: '/icons/ok.png' },
      ],
    };

    return category ? actions[category] : actions.system;
  }

  private isDoNotDisturbActive(): boolean {
    if (!this.settings.doNotDisturbStart || !this.settings.doNotDisturbEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= this.settings.doNotDisturbStart && currentTime <= this.settings.doNotDisturbEnd;
  }

  private queueNotification(payload: NotificationPayload): void {
    this.notificationQueue.push(payload);
    localStorage.setItem('notification-queue', JSON.stringify(this.notificationQueue));
  }

  private trackNotification(payload: NotificationPayload): void {
    const history = this.getNotificationHistory(100);
    history.unshift(payload);
    localStorage.setItem('notification-history', JSON.stringify(history.slice(0, 100)));
  }

  private loadSettings(): NotificationSettings {
    const stored = localStorage.getItem('notification-settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.getDefaultSettings();
      }
    }
    return this.getDefaultSettings();
  }

  private saveSettings(): void {
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      categories: {
        maintenance: true,
        inspection: true,
        damage: true,
        assignment: true,
        alert: true,
        message: true,
        system: true,
      },
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Predefined notification templates
export const NotificationTemplates = {
  maintenanceDue: (vehicleNumber: string, dueDate: string): NotificationPayload => ({
    title: 'Maintenance Due',
    body: `Vehicle ${vehicleNumber} has maintenance due on ${dueDate}`,
    category: 'maintenance',
    priority: 'normal',
    icon: '/icons/maintenance.png',
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'schedule', title: 'Schedule' },
    ],
  }),

  inspectionRequired: (vehicleNumber: string): NotificationPayload => ({
    title: 'Inspection Required',
    body: `Vehicle ${vehicleNumber} requires inspection`,
    category: 'inspection',
    priority: 'high',
    icon: '/icons/inspection.png',
    requireInteraction: true,
    actions: [
      { action: 'start', title: 'Start Now' },
      { action: 'later', title: 'Remind Me' },
    ],
  }),

  damageReported: (vehicleNumber: string, severity: string): NotificationPayload => ({
    title: 'Damage Reported',
    body: `${severity} damage reported on vehicle ${vehicleNumber}`,
    category: 'damage',
    priority: severity === 'critical' ? 'critical' : 'high',
    icon: '/icons/damage.png',
    requireInteraction: severity === 'critical',
    vibrate: [300, 100, 300, 100, 300],
    actions: [
      { action: 'view', title: 'View Report' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  assignmentNew: (vehicleNumber: string, task: string): NotificationPayload => ({
    title: 'New Assignment',
    body: `You've been assigned ${task} for vehicle ${vehicleNumber}`,
    category: 'assignment',
    priority: 'normal',
    icon: '/icons/assignment.png',
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'decline', title: 'Decline' },
    ],
  }),

  criticalAlert: (message: string): NotificationPayload => ({
    title: 'Critical Alert',
    body: message,
    category: 'alert',
    priority: 'critical',
    icon: '/icons/alert.png',
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500],
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'acknowledge', title: 'Acknowledge' },
    ],
  }),
};
