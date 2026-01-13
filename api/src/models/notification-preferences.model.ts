export interface NotificationPreferences {
  id: number;
  userId: number;
  tenantId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}
