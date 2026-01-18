export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface ActivityLogFilter {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityLogCreateInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityLogResponse {
  data: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

export enum ActivityLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  SHARE = 'share',
  ARCHIVE = 'archive',
  RESTORE = 'restore'
}

export enum ActivityLogEntityType {
  USER = 'user',
  PROJECT = 'project',
  DOCUMENT = 'document',
  COMMENT = 'comment',
  FILE = 'file',
  SETTING = 'setting',
  REPORT = 'report',
  TASK = 'task',
  NOTIFICATION = 'notification'
}