export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  dismissible?: boolean;
  category?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface AlertFilter {
  type?: Alert['type'][];
  priority?: Alert['priority'][];
  read?: boolean;
  actionRequired?: boolean;
  category?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface AlertStats {
  total: number;
  unread: number;
  byType: Record<Alert['type'], number>;
  byPriority: Record<NonNullable<Alert['priority']>, number>;
  actionRequired: number;
}

export interface AlertNotification {
  alertId: string;
  channels: ('email' | 'sms' | 'push' | 'in-app')[];
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

export interface AlertPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: Alert['type'][];
  notificationPriorities: Alert['priority'][];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}