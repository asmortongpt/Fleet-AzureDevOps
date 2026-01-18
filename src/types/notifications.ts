export interface NotificationSent {
  id: string;
  notification_id: string;
  user_id: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  channel: 'email' | 'sms' | 'push' | 'in_app';
  recipient: string;
  error_message?: string;
  delivered_at?: string;
  read_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationsSentFilters {
  user_id?: string;
  notification_id?: string;
  status?: NotificationSent['status'];
  channel?: NotificationSent['channel'];
  sent_after?: string;
  sent_before?: string;
  delivered_after?: string;
  delivered_before?: string;
  read?: boolean;
}

export interface NotificationsSentStats {
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  by_channel: Record<NotificationSent['channel'], number>;
  by_status: Record<NotificationSent['status'], number>;
}

export interface NotificationDeliveryReport {
  notification_sent_id: string;
  status: NotificationSent['status'];
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  provider_response?: Record<string, any>;
}

export interface BulkNotificationResult {
  notification_id: string;
  total_recipients: number;
  sent: number;
  failed: number;
  pending: number;
  errors: Array<{
    user_id: string;
    error: string;
  }>;
}