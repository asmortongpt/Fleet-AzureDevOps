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
