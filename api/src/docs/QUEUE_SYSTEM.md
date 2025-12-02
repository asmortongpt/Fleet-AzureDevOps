# Message Queue System Documentation

## Overview

The Fleet Management System includes a robust message queue system built with **pg-boss** (PostgreSQL-based queue) for reliable asynchronous message delivery and processing. This system ensures no messages are lost and provides comprehensive retry logic, dead letter queue handling, and monitoring capabilities.

## Architecture

### Components

1. **Queue Service** (`/api/src/services/queue.service.ts`)
   - Core queue management
   - Job enqueuing and processing
   - Retry logic with exponential backoff
   - Rate limiting integration

2. **Queue Processors** (`/api/src/jobs/queue-processors.ts`)
   - Handlers for each queue type
   - Business logic for message processing
   - Integration with Microsoft Graph API

3. **Queue Routes** (`/api/src/routes/queue.routes.ts`)
   - REST API for queue management
   - Monitoring endpoints
   - Admin operations

4. **Queue Monitor** (`/api/src/utils/queue-monitor.ts`)
   - Health checking
   - Metrics collection
   - Alert generation

## Queue Types

### High Priority Queues
- `teams-outbound` - Sending Teams messages
- `outlook-outbound` - Sending emails
- `notifications` - Push notifications

### Medium Priority Queues
- `teams-inbound` - Processing incoming Teams messages
- `outlook-inbound` - Processing incoming emails
- `webhooks` - Webhook processing

### Low Priority Queues
- `attachments` - File upload/download operations
- `sync` - Sync operations

### Special Queues
- `dead-letter` - Failed jobs requiring manual intervention

## Usage

### Initialization

Add to your server startup (`server.ts`):

```typescript
import { initializeQueueSystem } from './config/queue-init';

// Initialize queue system
await initializeQueueSystem();
```

### Enqueuing Jobs

#### Send Teams Message

```typescript
import { queueService } from './services/queue.service';
import { JobPriority } from './types/queue.types';

await queueService.enqueueTeamsMessage({
  chatId: 'chat-id',
  content: 'Hello from Fleet System!',
  contentType: 'text',
  importance: 'high'
}, JobPriority.HIGH);
```

#### Send Outlook Email

```typescript
await queueService.enqueueOutlookEmail({
  to: ['user@example.com'],
  subject: 'Important Update',
  body: '<h1>Hello!</h1><p>This is an important update.</p>',
  bodyType: 'html',
  importance: 'high'
}, JobPriority.NORMAL);
```

#### Process Attachment

```typescript
await queueService.enqueueAttachmentUpload({
  fileId: 'file-123',
  fileName: 'document.pdf',
  fileSize: 1024000,
  contentType: 'application/pdf',
  operation: 'upload',
  source: 'teams'
});
```

#### Queue Webhook Processing

```typescript
await queueService.enqueueWebhookProcessing({
  webhookId: 'webhook-123',
  source: 'teams',
  eventType: 'message.received',
  data: { /* webhook payload */ },
  receivedAt: new Date()
});
```

#### Schedule Sync Operation

```typescript
await queueService.enqueueSync({
  resourceType: 'messages',
  userId: 'user-123',
  teamId: 'team-456',
  fullSync: false
});
```

### Scheduled Jobs

Schedule a job for future execution:

```typescript
// Schedule for specific time
const scheduledTime = new Date('2025-12-01T10:00:00Z');
await queueService.scheduleJob('teams-outbound', messageData, scheduledTime);

// Schedule with delay (in milliseconds)
await queueService.scheduleJob('outlook-outbound', emailData, 3600000); // 1 hour
```

## Retry Logic

### Automatic Retries

Jobs automatically retry based on error type:

1. **Rate Limit (429)**
   - Retry with exponential backoff
   - Respects API rate limit reset time
   - Max retries: 5

2. **Network Errors**
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Max retries: 5

3. **Authentication Errors**
   - Retry once (token refresh happens automatically)
   - Max retries: 1

4. **Validation Errors**
   - No retry (moved to dead letter queue immediately)

### Manual Retry

Retry a failed job manually:

```typescript
await queueService.retryFailedJob('job-id-123');
```

## Monitoring

### Health Check

```bash
GET /api/queue/health
```

Response:
```json
{
  "healthy": true,
  "queues": {
    "teams-outbound": {
      "isRunning": true,
      "backlog": 15,
      "failureRate": 2.5,
      "avgProcessingTime": 250
    }
  },
  "deadLetterCount": 3,
  "lastChecked": "2025-11-16T00:00:00Z"
}
```

### Queue Statistics

```bash
GET /api/queue/stats
```

### Queue Metrics

```bash
GET /api/queue/metrics?timeRange=24h
```

### List Jobs

```bash
GET /api/queue/teams-outbound/jobs?status=pending&limit=50&offset=0
```

### List Failed Jobs

```bash
GET /api/queue/teams-outbound/failed
```

### Dead Letter Queue

```bash
GET /api/queue/dead-letter?reviewed=false
```

## Administration

### Pause Queue

```bash
POST /api/queue/teams-outbound/pause
Header: x-admin-key: your-admin-key
```

### Resume Queue

```bash
POST /api/queue/teams-outbound/resume
Header: x-admin-key: your-admin-key
```

### Clear Queue

```bash
DELETE /api/queue/teams-outbound/clear?confirm=yes
Header: x-admin-key: your-admin-key
```

### Retry Failed Job

```bash
POST /api/queue/teams-outbound/retry/job-id-123
Header: x-admin-key: your-admin-key
```

### Review Dead Letter Job

```bash
POST /api/queue/dead-letter/job-id-123/review
Header: x-admin-key: your-admin-key
Body: {
  "reviewedBy": "admin@example.com",
  "resolutionNotes": "Fixed upstream API issue"
}
```

## Rate Limiting

The queue system includes built-in rate limiting for Microsoft Graph API:

- **Teams**: 50 requests/second
- **Outlook**: 10,000 requests/10 minutes
- **Attachments**: 5 concurrent operations

Rate limiting is handled automatically using the Bottleneck library.

## Monitoring & Alerts

### Automatic Monitoring

The queue monitor runs automatically:

- **Every 5 minutes**: Collect queue statistics
- **Every minute**: Health check
- **Daily at midnight**: Generate performance report
- **Daily at 2 AM**: Clean up old statistics
- **Weekly on Sunday**: Clean up old job records

### Alert Thresholds

Default alert thresholds:

```typescript
{
  maxBacklog: 1000,          // Maximum pending jobs
  maxFailureRate: 10,        // Maximum failure rate (%)
  maxProcessingTime: 60000,  // Maximum avg processing time (ms)
  maxDeadLetterJobs: 50      // Maximum jobs in DLQ
}
```

Update thresholds:

```typescript
import { queueMonitor } from './utils/queue-monitor';

queueMonitor.updateThresholds({
  maxBacklog: 2000,
  maxFailureRate: 15
});
```

## Database Schema

### Tables Created

1. `job_tracking` - Tracks all jobs with detailed metadata
2. `queue_statistics` - Stores performance metrics
3. `dead_letter_queue` - Stores failed jobs
4. `rate_limit_tracking` - Tracks API rate limiting
5. `scheduled_jobs` - Manages scheduled jobs
6. `queue_alerts` - Stores monitoring alerts
7. `webhook_events` - Stores webhook notifications
8. `sync_history` - Tracks sync operations

Plus pg-boss internal tables (`job`, `version`, `schedule`, etc.)

### Migration

Run the migration:

```bash
psql -h localhost -U fleetadmin -d fleetdb -f db/migrations/025_job_queue.sql
```

## Environment Variables

```bash
# Database (already configured)
DB_HOST=fleet-postgres-service
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=your-password

# Admin key for queue management
ADMIN_KEY=your-secure-admin-key

# Optional: Custom configuration
QUEUE_ARCHIVE_HOURS=24
QUEUE_DELETE_DAYS=7
QUEUE_MONITOR_INTERVAL=60
```

## Best Practices

### 1. Job Idempotency

Always design jobs to be idempotent (can be safely retried):

```typescript
// Good: Check if already processed
const existing = await findExistingMessage(messageId);
if (existing) {
  return existing;
}
await createMessage(messageId, content);
```

### 2. Use Singleton Keys

Prevent duplicate jobs for the same operation:

```typescript
await queueService.enqueueJob('sync', data, {
  singletonKey: `sync-messages-${userId}`
});
```

### 3. Set Appropriate Priorities

- `CRITICAL (1)`: Emergency alerts, system failures
- `HIGH (3)`: Important user-facing messages
- `NORMAL (5)`: Regular operations
- `LOW (8)`: Background tasks
- `VERY_LOW (10)`: Cleanup, analytics

### 4. Monitor Dead Letter Queue

Regularly review and resolve dead letter jobs:

```typescript
const dlqJobs = await fetch('/api/queue/dead-letter?reviewed=false');
// Review and retry or mark as resolved
```

### 5. Graceful Degradation

Handle queue failures gracefully:

```typescript
try {
  await queueService.enqueueTeamsMessage(message);
} catch (error) {
  // Fallback: Log for manual processing
  logger.error('Failed to queue message', { message, error });
  // Or: Store in emergency fallback table
}
```

## Troubleshooting

### Queue Not Processing Jobs

1. Check if queue service is initialized
2. Check if processors are registered
3. Check queue health: `GET /api/queue/health`
4. Check database connectivity

### High Failure Rate

1. Review failed jobs: `GET /api/queue/:queueName/failed`
2. Check error patterns in job_tracking table
3. Review API credentials and permissions
4. Check rate limiting status

### Dead Letter Queue Growing

1. Review dead letter jobs: `GET /api/queue/dead-letter`
2. Identify common error patterns
3. Fix upstream issues
4. Retry resolved jobs

### Performance Issues

1. Check queue backlog
2. Review processing times
3. Consider increasing queue workers
4. Review database performance
5. Check rate limiting configuration

## Future Enhancements

- [ ] Web UI dashboard for queue monitoring
- [ ] Webhook notifications for critical alerts
- [ ] Advanced scheduling with cron expressions
- [ ] Job dependencies and workflows
- [ ] A/B testing for retry strategies
- [ ] Real-time queue metrics with WebSocket

## Support

For issues or questions:
1. Check logs in the database (`job_tracking`, `queue_alerts`)
2. Review queue health endpoint
3. Contact the development team
