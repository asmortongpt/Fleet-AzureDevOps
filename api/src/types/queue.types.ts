/**
 * Queue System Type Definitions
 * Defines all types, interfaces, and enums for the message queue system
 */

// Queue names for different job types
export enum QueueName {
  TEAMS_OUTBOUND = 'teams-outbound',
  OUTLOOK_OUTBOUND = 'outlook-outbound',
  TEAMS_INBOUND = 'teams-inbound',
  OUTLOOK_INBOUND = 'outlook-inbound',
  ATTACHMENTS = 'attachments',
  SYNC = 'sync',
  NOTIFICATIONS = 'notifications',
  WEBHOOKS = 'webhooks',
  DEAD_LETTER = 'dead-letter'
}

// Job priority levels
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 3,
  NORMAL = 5,
  LOW = 8,
  VERY_LOW = 10
}

// Job status
export enum JobStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DEAD_LETTER = 'dead-letter'
}

// Retry strategies
export enum RetryStrategy {
  EXPONENTIAL = 'exponential',
  LINEAR = 'linear',
  FIXED = 'fixed',
  NONE = 'none'
}

// Teams message payload
export interface TeamsMessagePayload {
  chatId?: string;
  channelId?: string;
  teamId?: string;
  content: string;
  contentType?: 'text' | 'html';
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    contentUrl: string;
  }>;
  mentions?: Array<{
    id: string;
    mentionText: string;
    userId: string;
  }>;
  importance?: 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

// Outlook email payload
export interface OutlookEmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType?: 'text' | 'html';
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBytes: string; // base64 encoded
    size?: number;
  }>;
  importance?: 'low' | 'normal' | 'high';
  isDeliveryReceiptRequested?: boolean;
  isReadReceiptRequested?: boolean;
  replyTo?: string[];
  metadata?: Record<string, any>;
}

// Attachment processing payload
export interface AttachmentPayload {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  operation: 'upload' | 'download' | 'delete' | 'scan';
  source?: 'teams' | 'outlook' | 'manual';
  destinationPath?: string;
  metadata?: Record<string, any>;
}

// Webhook processing payload
export interface WebhookPayload {
  webhookId: string;
  source: 'teams' | 'outlook' | 'graph' | 'other';
  eventType: string;
  data: Record<string, any>;
  receivedAt: Date;
  subscriptionId?: string;
}

// Sync operation payload
export interface SyncPayload {
  resourceType: 'messages' | 'emails' | 'calendar' | 'contacts' | 'files';
  userId?: string;
  teamId?: string;
  channelId?: string;
  deltaToken?: string;
  fullSync?: boolean;
  filters?: Record<string, any>;
}

// Generic job data
export interface JobData {
  type: string;
  payload: TeamsMessagePayload | OutlookEmailPayload | AttachmentPayload | WebhookPayload | SyncPayload | any;
  priority?: JobPriority;
  metadata?: {
    userId?: string;
    organizationId?: string;
    correlationId?: string;
    source?: string;
    timestamp?: Date;
    [key: string]: any;
  };
}

// Job options
export interface JobOptions {
  priority?: JobPriority;
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
  expireInSeconds?: number;
  retentionSeconds?: number;
  startAfter?: Date | string;
  singletonKey?: string; // For job deduplication
  onComplete?: boolean;
}

// Job result
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime?: number;
  timestamp?: Date;
}

// Queue statistics
export interface QueueStats {
  queueName: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  avgProcessingTimeMs: number;
  jobsPerMinute: number;
  lastUpdated: Date;
}

// Job tracking record
export interface JobTracking {
  id: string;
  jobId: string;
  queueName: string;
  jobType: string;
  status: JobStatus;
  priority: number;
  payload: any;
  result?: any;
  error?: string;
  stackTrace?: string;
  retryCount: number;
  maxRetries: number;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dead letter queue record
export interface DeadLetterJob {
  id: string;
  jobId: string;
  queueName: string;
  jobType: string;
  payload: any;
  error: string;
  stackTrace?: string;
  retryCount: number;
  originalCreatedAt: Date;
  movedToDlqAt: Date;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  resolutionNotes?: string;
  retryAttempted: boolean;
  retryAttemptedAt?: Date;
}

// Rate limit configuration
export interface RateLimitConfig {
  serviceName: string;
  endpoint: string;
  requestsPerWindow: number;
  windowSizeMs: number;
  strategy?: 'sliding' | 'fixed';
}

// Scheduled job
export interface ScheduledJob {
  id: string;
  jobName: string;
  queueName: string;
  cronExpression?: string;
  payload: any;
  nextRunAt: Date;
  lastRunAt?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Queue processor function type
export type QueueProcessor<T = any> = (job: {
  id: string;
  data: T;
  name: string;
  done: (error?: Error, result?: any) => void;
}) => Promise<any>;

// Error types for retry logic
export enum ErrorType {
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

// Retry decision
export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason?: string;
  errorType: ErrorType;
}

// Queue health status
export interface QueueHealth {
  healthy: boolean;
  queues: {
    [queueName: string]: {
      isRunning: boolean;
      backlog: number;
      failureRate: number;
      avgProcessingTime: number;
    };
  };
  deadLetterCount: number;
  lastChecked: Date;
}

// Queue event types
export enum QueueEvent {
  JOB_CREATED = 'job:created',
  JOB_STARTED = 'job:started',
  JOB_COMPLETED = 'job:completed',
  JOB_FAILED = 'job:failed',
  JOB_RETRY = 'job:retry',
  JOB_DEAD_LETTER = 'job:dead-letter',
  QUEUE_PAUSED = 'queue:paused',
  QUEUE_RESUMED = 'queue:resumed',
  QUEUE_ERROR = 'queue:error'
}
