// Queue Type Definitions

export enum QueueName {
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  REPORT = 'report',
  DATA_SYNC = 'data_sync',
  MAINTENANCE = 'maintenance',
  TELEMETRY = 'telemetry',
  AUDIT = 'audit',
  DEAD_LETTER = 'dead_letter',
}

export interface QueueHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  queues: {
    [key: string]: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: boolean;
      backlog?: number;
      failureRate?: number;
      avgProcessingTime?: number;
      isRunning?: boolean;
    };
  };
  deadLetterCount?: number;
  timestamp: string;
}

export interface QueueJob<T = any> {
  id: string;
  data: T;
  opts?: QueueJobOptions;
}

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: number | {
    type: string;
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export interface QueueProcessor<T = any> {
  (job: QueueJob<T>): Promise<any>;
}

export interface EmailJob {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
}

export interface NotificationJob {
  userId: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused'
}

export interface JobData {
  [key: string]: any
}

export interface JobOptions {
  priority?: number
  delay?: number
  attempts?: number
  backoff?: number | {
    type: string
    delay: number
  }
  removeOnComplete?: boolean
  removeOnFail?: boolean
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface RetryDecision {
  retry: boolean
  delay?: number
  errorType?: ErrorType
}

export interface TeamsMessagePayload {
  teamId: string
  channelId: string
  message: string
  importance?: 'normal' | 'high' | 'urgent'
  mentions?: string[]
  attachments?: any[]
}

export interface OutlookEmailPayload {
  to: string | string[]
  subject: string
  body: string
  from?: string
  cc?: string[]
  bcc?: string[]
  attachments?: any[]
  importance?: 'low' | 'normal' | 'high'
}

export interface AttachmentPayload {
  documentId: string
  tenantId: string
  userId: string
  fileUrl: string
  fileName: string
  mimeType: string
  source: 'teams' | 'outlook' | 'manual'
}

export interface WebhookPayload {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  retries?: number
}

export interface SyncPayload {
  entityType: 'vehicle' | 'driver' | 'maintenance' | 'trip' | 'fuel'
  entityId: string
  tenantId: string
  action: 'create' | 'update' | 'delete'
  data?: any
}
