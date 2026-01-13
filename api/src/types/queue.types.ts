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
  TEAMS_OUTBOUND = 'teams_outbound',
  OUTLOOK_OUTBOUND = 'outlook_outbound',
  ATTACHMENTS = 'attachments',
  WEBHOOKS = 'webhooks',
  SYNC = 'sync'
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
  PAUSED = 'paused',
  PENDING = 'pending',
  DEAD_LETTER = 'dead_letter'
}

export interface JobData {
  payload?: any
  metadata?: Record<string, any>
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
  retryLimit?: number
  retryDelay?: number
  retryBackoff?: boolean
  expireInSeconds?: number
  retentionSeconds?: number
  startAfter?: Date | string
  singletonKey?: string
  onComplete?: boolean
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
  pending: number
  avgProcessingTimeMs: number
  queueName?: string
  jobsPerMinute?: number
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export interface RetryDecision {
  retry: boolean
  shouldRetry?: boolean
  delay?: number
  errorType?: ErrorType
}

export interface TeamsMessagePayload {
  teamId?: string
  channelId?: string
  chatId?: string
  message?: string
  content?: string
  contentType?: 'text' | 'html'
  importance?: 'normal' | 'high' | 'urgent'
  mentions?: string[]
  attachments?: any[]
}

export interface OutlookEmailPayload {
  to: string | string[]
  subject: string
  body: string
  bodyType?: 'text' | 'html'
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: any[]
  importance?: 'low' | 'normal' | 'high'
  isDeliveryReceiptRequested?: boolean
  isReadReceiptRequested?: boolean
}

export interface AttachmentPayload {
  documentId?: string
  tenantId?: string
  userId?: string
  fileId?: string
  fileUrl?: string
  fileName: string
  fileSize?: number
  mimeType?: string
  contentType?: string
  operation?: 'upload' | 'download' | 'delete' | 'scan'
  destinationPath?: string
  source?: 'teams' | 'outlook' | 'manual'
}

export interface WebhookPayload {
  webhookId: string
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  data?: any
  retries?: number
  eventType?: string
  source?: string
}

export interface SyncPayload {
  entityType?: 'vehicle' | 'driver' | 'maintenance' | 'trip' | 'fuel'
  resourceType: 'messages' | 'emails' | 'calendar' | 'contacts' | 'files'
  entityId?: string
  tenantId?: string
  userId: string
  teamId?: string
  channelId?: string
  deltaToken?: string
  action?: 'create' | 'update' | 'delete'
  data?: any
}
