export interface NotificationPreferences {
  id: number;
  userId: number;
  tenantId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
