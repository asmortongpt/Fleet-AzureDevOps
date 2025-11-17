# Microsoft Graph Webhook Infrastructure

This directory contains webhook endpoints for receiving real-time notifications from Microsoft Teams and Outlook via Microsoft Graph API.

## Overview

The webhook infrastructure enables real-time synchronization of:
- **Teams Messages**: Receive notifications when new messages are posted or updated in Teams channels
- **Outlook Emails**: Receive notifications when new emails arrive in monitored mailboxes

## Architecture

```
┌─────────────────┐
│ Microsoft Graph │
│   Webhooks      │
└────────┬────────┘
         │ HTTPS POST
         ▼
┌─────────────────────────┐
│ Webhook Validation      │
│ Middleware              │
│ - Token validation      │
│ - Client state check    │
│ - Rate limiting         │
│ - Idempotency check     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Webhook Endpoints       │
│ - /api/webhooks/teams   │
│ - /api/webhooks/outlook │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Webhook Service         │
│ - Process notifications │
│ - Fetch full data       │
│ - AI categorization     │
│ - Store in DB           │
│ - Trigger WebSocket     │
└─────────────────────────┘
```

## Files

### Webhook Endpoints
- **`teams.webhook.ts`** - Teams message notification endpoint
- **`outlook.webhook.ts`** - Outlook email notification endpoint

### Supporting Files
- **`/middleware/webhook-validation.ts`** - Security and validation middleware
- **`/services/webhook.service.ts`** - Subscription management and notification processing
- **`/jobs/webhook-renewal.job.ts`** - Automatic subscription renewal cron job
- **`/db/migrations/023_webhook_subscriptions.sql`** - Database schema

## API Endpoints

### Teams Webhooks

#### `POST /api/webhooks/teams`
Receive Teams message notifications from Microsoft Graph.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "value": [
    {
      "subscriptionId": "uuid",
      "clientState": "secret-token",
      "changeType": "created",
      "resource": "/teams/{team-id}/channels/{channel-id}/messages/{message-id}",
      "resourceData": {
        "id": "message-id",
        "@odata.type": "#Microsoft.Graph.chatMessage"
      }
    }
  ]
}
```

**Response:**
- `202 Accepted` - Notification queued for processing

#### `GET /api/webhooks/teams/subscriptions`
List all active Teams subscriptions.

#### `POST /api/webhooks/teams/subscribe`
Create a new Teams channel subscription.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "teamId": "team-id",
  "channelId": "channel-id"
}
```

#### `DELETE /api/webhooks/teams/subscribe/:subscriptionId`
Delete a Teams subscription.

#### `POST /api/webhooks/teams/renew/:subscriptionId`
Manually renew a Teams subscription.

### Outlook Webhooks

#### `POST /api/webhooks/outlook`
Receive Outlook email notifications from Microsoft Graph.

#### `GET /api/webhooks/outlook/subscriptions`
List all active Outlook subscriptions.

#### `POST /api/webhooks/outlook/subscribe`
Create a new Outlook mailbox subscription.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "userEmail": "user@domain.com",
  "folderId": "inbox"
}
```

#### `DELETE /api/webhooks/outlook/subscribe/:subscriptionId`
Delete an Outlook subscription.

#### `POST /api/webhooks/outlook/renew/:subscriptionId`
Manually renew an Outlook subscription.

#### `GET /api/webhooks/outlook/stats`
Get email processing statistics.

## Setup

### 1. Azure App Registration

Register your application in Azure AD:
1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create new registration
3. Add required permissions:
   - `ChannelMessage.Read.All` (for Teams)
   - `Mail.Read` (for Outlook)
4. Create client secret
5. Note down:
   - Application (client) ID
   - Directory (tenant) ID
   - Client secret value

### 2. Environment Variables

Set the following environment variables:

```bash
# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Webhook Configuration
WEBHOOK_BASE_URL=https://your-domain.com/api/webhooks

# Optional Configuration
WEBHOOK_RENEWAL_CRON_SCHEDULE="0 * * * *"  # Every hour
WEBHOOK_RENEWAL_THRESHOLD_HOURS=12          # Renew 12 hours before expiry
ENABLE_WEBHOOK_RENEWAL=true
```

### 3. Database Migration

Run the database migration to create webhook tables:

```bash
psql -U postgres -d fleet_db -f api/db/migrations/023_webhook_subscriptions.sql
```

### 4. Public HTTPS Endpoint

Microsoft Graph webhooks require a publicly accessible HTTPS endpoint. Options:

**Production:**
- Deploy to Azure App Service, AWS, or similar
- Ensure SSL/TLS certificate is valid

**Development:**
- Use ngrok: `ngrok http 3000`
- Update `WEBHOOK_BASE_URL` with ngrok URL

### 5. Create Subscriptions

Use the API or directly via service:

```typescript
import webhookService from './services/webhook.service'

// Subscribe to Teams channel
await webhookService.subscribeToTeamsMessages({
  tenantId: 'uuid',
  subscriptionType: 'teams_messages',
  teamId: 'team-id',
  channelId: 'channel-id'
})

// Subscribe to Outlook emails
await webhookService.subscribeToOutlookEmails({
  tenantId: 'uuid',
  subscriptionType: 'outlook_emails',
  userEmail: 'user@domain.com',
  folderId: 'inbox'
})
```

## Security

### Validation Token
Microsoft Graph sends a validation token when creating subscriptions. The webhook endpoint must return this token in plain text to confirm ownership.

### Client State
Each subscription has a unique `clientState` token that's validated on every webhook notification to ensure authenticity.

### Rate Limiting
Webhook endpoints are rate-limited to 100 requests per minute per IP address.

### Idempotency
Duplicate notifications (within 1 hour) are automatically detected and ignored.

### Origin Validation
Request origin is validated to ensure webhooks come from Microsoft servers.

## Subscription Lifecycle

### Expiration Times
- **Teams messages**: 60 minutes maximum
- **Outlook emails**: 4230 minutes (≈3 days) maximum

### Auto-Renewal
The webhook renewal job runs every hour and:
1. Checks for subscriptions expiring within 12 hours
2. Renews them before expiration
3. Recreates failed subscriptions (after 3 failures)
4. Logs all renewal activity

### Manual Renewal
You can manually renew subscriptions via API:

```bash
POST /api/webhooks/teams/renew/:subscriptionId
POST /api/webhooks/outlook/renew/:subscriptionId
```

## Processing Pipeline

### 1. Notification Received
Webhook endpoint receives notification from Microsoft Graph.

### 2. Validation
Middleware validates:
- Client state token
- Request origin
- Rate limits
- Duplicate detection

### 3. Queuing
Notification is queued for async processing and `202 Accepted` returned immediately.

### 4. Fetch Full Data
Full message/email details are fetched from Graph API.

### 5. AI Categorization
Content is categorized using OpenAI:
- Teams: Vehicle Issue, Driver Question, Maintenance Request, etc.
- Outlook: Receipt, Invoice, Vendor Communication, etc.

### 6. Storage
Message/email is stored in `communications` table.

### 7. Attachments
Attachments are downloaded and processed:
- Images are analyzed with OCR
- Receipts are extracted with structured data

### 8. Real-time Updates
WebSocket notification is sent to connected clients.

## Database Schema

### webhook_subscriptions
Stores active Microsoft Graph subscriptions.

```sql
id                  UUID PRIMARY KEY
subscription_id     VARCHAR(255) UNIQUE    -- Graph API subscription ID
resource            VARCHAR(500)           -- Graph resource path
change_type         VARCHAR(100)           -- created, updated, deleted
notification_url    TEXT                   -- Webhook URL
expiration_date_time TIMESTAMP             -- Subscription expiry
client_state        VARCHAR(255)           -- Validation token
status              VARCHAR(50)            -- active, expired, failed
subscription_type   VARCHAR(50)            -- teams_messages, outlook_emails
tenant_id           UUID
team_id             VARCHAR(255)           -- For Teams subscriptions
channel_id          VARCHAR(255)           -- For Teams subscriptions
user_email          VARCHAR(255)           -- For Outlook subscriptions
folder_id           VARCHAR(255)           -- For Outlook subscriptions
last_renewed_at     TIMESTAMP
renewal_failure_count INTEGER
```

### webhook_events
Logs all incoming webhook notifications.

```sql
id                  UUID PRIMARY KEY
subscription_id     VARCHAR(255)
change_type         VARCHAR(100)
resource            VARCHAR(500)
resource_data       JSONB                  -- Full notification payload
processed           BOOLEAN
error               TEXT
communication_id    UUID                   -- Link to created communication
received_at         TIMESTAMP
processed_at        TIMESTAMP
```

### webhook_processing_queue
Queue for async notification processing.

```sql
id                  UUID PRIMARY KEY
webhook_event_id    UUID
priority            INTEGER
status              VARCHAR(50)            -- pending, processing, completed, failed
attempts            INTEGER
max_attempts        INTEGER
next_retry_at       TIMESTAMP
error_message       TEXT
```

## Monitoring

### Health Checks
```bash
GET /api/webhooks/teams/health
GET /api/webhooks/outlook/health
```

### Statistics
```bash
GET /api/webhooks/outlook/stats
GET /api/webhooks/teams/events?limit=50&processed=false
```

### Logs
All webhook activity is logged with structured logging:
- Request received
- Validation results
- Processing status
- Errors and retries

## Troubleshooting

### Subscription Not Receiving Notifications

1. **Check subscription status:**
   ```sql
   SELECT * FROM webhook_subscriptions WHERE status = 'active';
   ```

2. **Verify webhook URL is accessible:**
   - Must be HTTPS
   - Must be publicly accessible
   - Must return 200 OK for validation token

3. **Check logs for errors:**
   ```sql
   SELECT * FROM webhook_events WHERE processed = false ORDER BY received_at DESC;
   ```

### Subscription Keeps Failing Renewal

1. **Check Azure AD permissions:**
   - Ensure app has required Graph API permissions
   - Verify admin consent is granted

2. **Check client secret:**
   - Ensure secret hasn't expired
   - Verify correct secret in environment variables

3. **Check renewal failure count:**
   ```sql
   SELECT subscription_id, renewal_failure_count, status
   FROM webhook_subscriptions
   WHERE renewal_failure_count > 0;
   ```

### Duplicate Notifications

Idempotency check automatically handles duplicates. If issues persist:

1. **Check idempotency window:**
   Currently set to 1 hour in middleware

2. **Review webhook_events for duplicates:**
   ```sql
   SELECT resource, COUNT(*)
   FROM webhook_events
   WHERE received_at > NOW() - INTERVAL '1 hour'
   GROUP BY resource
   HAVING COUNT(*) > 1;
   ```

## Testing

### Testing with Mock Notifications

Create a test notification file:

```json
{
  "value": [
    {
      "subscriptionId": "test-subscription-id",
      "clientState": "test-client-state",
      "changeType": "created",
      "resource": "/teams/test-team/channels/test-channel/messages/test-message",
      "resourceData": {
        "id": "test-message",
        "@odata.type": "#Microsoft.Graph.chatMessage"
      }
    }
  ]
}
```

Send via curl:

```bash
curl -X POST https://your-domain.com/api/webhooks/teams \
  -H "Content-Type: application/json" \
  -d @test-notification.json
```

### Testing Validation Token

```bash
curl "https://your-domain.com/api/webhooks/teams?validationToken=test-token-12345"
```

Should return: `test-token-12345`

## Performance

### Async Processing
All notifications are processed asynchronously to ensure fast response times (<100ms).

### Queue Priority
Processing queue priorities:
- Created events: Priority 7
- Updated events: Priority 5
- Deleted events: Priority 3

### Retry Logic
Failed processing attempts are retried up to 3 times with exponential backoff.

## Best Practices

1. **Always use HTTPS** - Required by Microsoft Graph
2. **Monitor subscription expiry** - Renewal job handles this automatically
3. **Handle duplicates** - Idempotency middleware handles this
4. **Log all activity** - Comprehensive logging is built-in
5. **Set up alerts** - Monitor for failed subscriptions
6. **Keep secrets secure** - Use Azure Key Vault for production

## References

- [Microsoft Graph Webhooks Documentation](https://learn.microsoft.com/en-us/graph/webhooks)
- [Teams Change Notifications](https://learn.microsoft.com/en-us/graph/teams-change-notification-in-microsoft-teams-overview)
- [Outlook Change Notifications](https://learn.microsoft.com/en-us/graph/outlook-change-notification-overview)
- [Subscription Lifecycle](https://learn.microsoft.com/en-us/graph/webhooks-lifecycle)
