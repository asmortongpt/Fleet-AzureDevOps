# Scheduling Notifications System

A comprehensive notification system for the Fleet Management scheduling module, providing multi-channel notifications for vehicle reservations and maintenance appointments.

## Overview

The scheduling notifications system sends automated notifications for:
- **Vehicle Reservations**: Request submissions, approvals, rejections, and reminders
- **Maintenance Appointments**: Scheduled maintenance reminders
- **Scheduling Conflicts**: Alerts for double-bookings and conflicts

### Supported Channels
- ✉️ **Email** - Via Microsoft Outlook/Graph API
- 📱 **SMS** - Via Twilio
- 💬 **Microsoft Teams** - Adaptive cards in Teams channels
- 🔔 **In-App** - Database-backed notifications

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Scheduling Module                         │
│  (Vehicle Reservations, Maintenance Appointments)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Triggers notification events
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          scheduling-notification.service.ts                  │
│  • Template selection & rendering                            │
│  • User preference checking                                  │
│  • Multi-channel delivery orchestration                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────────┐
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐
│  Outlook  │  │  Twilio  │  │   Teams   │  │ Communication│
│  Service  │  │   SMS    │  │  Service  │  │     Logs     │
└───────────┘  └──────────┘  └───────────┘  └──────────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐
│   Email   │  │   SMS    │  │   Teams   │  │   Database   │
│ Delivery  │  │ Delivery │  │  Channel  │  │   Logging    │
└───────────┘  └──────────┘  └───────────┘  └──────────────┘
```

### Background Job

```
┌─────────────────────────────────────────────────────────────┐
│         scheduling-reminders.job.ts (Cron: */15 min)         │
│  • Checks for upcoming reservations & appointments           │
│  • Sends reminders at configured times (24h, 1h before)      │
│  • Tracks sent reminders to avoid duplicates                 │
│  • Respects user notification preferences                    │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
api/src/
├── services/
│   ├── scheduling-notification.service.ts    # Main notification service
│   ├── outlook.service.ts                    # Email via Outlook/Graph API
│   ├── teams.service.ts                      # Teams notifications
│   └── queue.service.ts                      # Job queue management
├── jobs/
│   └── scheduling-reminders.job.ts           # Background reminder job
├── routes/
│   ├── scheduling.routes.ts                  # Updated with notifications
│   └── scheduling-notifications.routes.ts    # Notification preferences API
├── templates/scheduling/
│   ├── reservation_request.html              # Email: New request
│   ├── reservation_approved.html             # Email: Approval
│   ├── reservation_rejected.html             # Email: Rejection
│   ├── reservation_reminder.html             # Email: Upcoming reminder
│   ├── maintenance_reminder.html             # Email: Maintenance reminder
│   └── conflict_detected.html                # Email: Conflict alert
└── migrations/
    └── 030_scheduling_notifications.sql      # Database schema
```

## Database Schema

### Tables

#### `scheduling_notification_preferences`
User-level notification preferences:
```sql
- user_id (FK to users)
- email_enabled (boolean)
- sms_enabled (boolean)
- teams_enabled (boolean)
- reminder_times (integer[])  -- e.g., [24, 1] for 24h and 1h before
- quiet_hours_start (time)    -- e.g., '22:00'
- quiet_hours_end (time)      -- e.g., '07:00'
```

#### `scheduling_reminders_sent`
Tracks sent reminders to prevent duplicates:
```sql
- entity_id (varchar)         -- Reservation or appointment ID
- entity_type (varchar)       -- 'reservation' or 'maintenance'
- hours_before (integer)      -- When reminder was sent (24, 1, etc.)
- sent_at (timestamp)
```

#### `tenant_teams_config`
Maps tenants to Teams channels for notifications:
```sql
- tenant_id (FK to tenants)
- team_id (varchar)
- channel_id (varchar)
- is_default (boolean)
- notification_types (text[])
```

#### `notification_templates`
Reusable notification templates:
```sql
- template_key (varchar)      -- 'reservation_request', etc.
- email_subject_template (text)
- email_body_template (text)
- sms_text_template (text)
- teams_message_template (text)
- required_variables (text[])
```

## API Endpoints

### Notification Preferences

#### Get User Preferences
```http
GET /api/scheduling-notifications/preferences
Authorization: Bearer <token>

Response:
{
  "success": true,
  "preferences": {
    "userId": "123",
    "emailEnabled": true,
    "smsEnabled": false,
    "teamsEnabled": true,
    "reminderTimes": [24, 1],
    "quietHoursStart": "22:00",
    "quietHoursEnd": "07:00"
  }
}
```

#### Update Preferences
```http
PUT /api/scheduling-notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailEnabled": true,
  "smsEnabled": true,
  "teamsEnabled": true,
  "reminderTimes": [48, 24, 2, 1],
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}

Response:
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "preferences": { ... }
}
```

#### Send Test Notification
```http
POST /api/scheduling-notifications/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "channels": ["email", "sms", "teams"]
}

Response:
{
  "success": true,
  "message": "Test notifications sent via: email, sms, teams",
  "channels": ["email", "sms", "teams"]
}
```

#### Get Notification History
```http
GET /api/scheduling-notifications/history?limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 15,
  "history": [
    {
      "id": 1,
      "subject": "Reservation Reminder",
      "communication_datetime": "2025-01-15T10:00:00Z",
      "entity_type": "reservation",
      "entity_id": "456"
    }
  ]
}
```

#### Get Notification Stats
```http
GET /api/scheduling-notifications/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "stats": {
    "totalReservationNotifications": 45,
    "totalMaintenanceNotifications": 12,
    "last30Days": 20,
    "last7Days": 5
  }
}
```

## Usage Examples

### Sending Notifications from Code

#### Reservation Request (to Approvers)
```typescript
import schedulingNotificationService from '../services/scheduling-notification.service'

// After creating a reservation
const approvers = ['approver_user_id_1', 'approver_user_id_2']
await schedulingNotificationService.sendReservationRequest(
  tenantId,
  reservation,  // Full reservation object with vehicle & user details
  approvers
)
```

#### Reservation Approved (to Requester)
```typescript
// After approving a reservation
await schedulingNotificationService.sendReservationApproved(
  tenantId,
  reservation  // Full reservation object
)
```

#### Reservation Rejected (to Requester)
```typescript
// After rejecting a reservation
await schedulingNotificationService.sendReservationRejected(
  tenantId,
  reservation,
  'Vehicle is scheduled for maintenance during this period'
)
```

#### Upcoming Reminder
```typescript
// Called by background job
await schedulingNotificationService.sendReservationReminder(
  tenantId,
  reservation,
  24  // Hours until event
)
```

#### Maintenance Reminder
```typescript
// Called by background job
await schedulingNotificationService.sendMaintenanceReminder(
  tenantId,
  appointment,
  1  // Hours until event
)
```

#### Conflict Detection
```typescript
const conflict = {
  type: 'vehicle_double_booked',
  severity: 'high',
  description: 'Vehicle has overlapping reservations'
}
const affectedUsers = ['user1', 'user2']

await schedulingNotificationService.sendConflictDetected(
  tenantId,
  conflict,
  affectedUsers
)
```

## Configuration

### Environment Variables

```bash
# Email Configuration (via Outlook)
OUTLOOK_DEFAULT_USER_EMAIL=fleet@company.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15555551234

# Microsoft Teams (configured via Graph API)
# Teams integration uses existing Graph API credentials

# Application URL (for email links)
APP_URL=https://fleet.company.com

# Background Job Configuration
ENABLE_SCHEDULING_REMINDERS=true
SCHEDULING_REMINDERS_CRON="*/15 * * * *"  # Every 15 minutes

# Timezone
TZ=America/New_York
```

### Reminder Times

Default reminder times are configured in the background job:
```typescript
const REMINDER_TIMES = [24, 1] // 24 hours and 1 hour before event
```

Users can customize their reminder times via notification preferences:
- Supported range: 0 to 168 hours (1 week)
- Multiple reminder times per event
- Example: `[48, 24, 2, 1]` = 2 days, 1 day, 2 hours, 1 hour before

## Email Templates

### Template Variables

All templates support variable substitution using `{{variable_name}}` syntax:

**Common Variables:**
- `{{make}}` - Vehicle make
- `{{model}}` - Vehicle model
- `{{license_plate}}` - License plate number
- `{{start_time}}` - Formatted start time
- `{{end_time}}` - Formatted end time
- `{{reserved_by_name}}` - User's full name
- `{{purpose}}` - Reservation purpose
- `{{pickup_location}}` - Pickup location
- `{{hours_until}}` - Hours until event

**Approval/Rejection:**
- `{{rejection_reason}}` - Reason for rejection
- `{{approve_url}}` - Link to approve reservation
- `{{view_url}}` - Link to view details

**Maintenance:**
- `{{appointment_type}}` - Type of maintenance
- `{{bay_name}}` - Service bay name
- `{{technician_name}}` - Assigned technician
- `{{work_order_number}}` - Work order reference

### Customizing Templates

Templates are located in `/api/src/templates/scheduling/`. To customize:

1. Edit the HTML file directly
2. Use `{{variable_name}}` for dynamic content
3. Maintain responsive design (templates use inline CSS)
4. Test with the test notification endpoint

## Background Job Setup

### Starting the Job

The scheduling reminders job is initialized in `server.ts`:

```typescript
import schedulingReminders from './jobs/scheduling-reminders.job'

// Start the job
schedulingReminders.start()

// Or manually trigger (for testing)
await schedulingReminders.triggerNow()
```

### Job Execution Flow

1. **Every 15 minutes:**
   - Query upcoming reservations (within reminder window)
   - Query upcoming maintenance appointments
   - Check user notification preferences
   - Verify reminder not already sent
   - Send notifications via enabled channels
   - Mark reminders as sent

2. **Reminder Windows:**
   - For 24h reminder: Check events starting in 23h 45m to 24h 15m
   - For 1h reminder: Check events starting in 45m to 1h 15m
   - 30-minute window prevents missed notifications

3. **Duplicate Prevention:**
   - Each reminder is logged in `scheduling_reminders_sent`
   - Uniqueness constraint: `(entity_id, entity_type, hours_before)`
   - Prevents same reminder being sent twice

## Integration with Communication Logs

All notifications are automatically logged to the `communications` table:

```typescript
// Automatically logged by notification service
{
  communication_type: 'Email',
  direction: 'Outbound',
  subject: 'Reservation Approved',
  body: '<html>...</html>',
  to_contact_emails: ['user@example.com'],
  communication_datetime: '2025-01-15T10:00:00Z',
  status: 'Sent'
}
```

Entity links are created automatically:
```sql
INSERT INTO communication_entity_links (
  communication_id,
  entity_type,    -- 'reservation' or 'maintenance'
  entity_id,      -- Reservation/appointment ID
  link_type       -- 'Primary Subject'
)
```

## Teams Integration

### Adaptive Cards

Teams notifications use Adaptive Cards for rich formatting:

```json
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "🚗 New Reservation Request",
      "weight": "Bolder",
      "size": "Large"
    },
    {
      "type": "FactSet",
      "facts": [
        {"title": "Vehicle", "value": "Ford F-150"},
        {"title": "Start Time", "value": "Jan 15, 2025 10:00 AM"}
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "Approve",
      "url": "https://fleet.company.com/reservations/123/approve"
    }
  ]
}
```

### Configuration

Teams channels are configured per tenant:

```sql
INSERT INTO tenant_teams_config (
  tenant_id,
  team_id,
  channel_id,
  channel_name,
  is_default,
  notification_types
) VALUES (
  1,
  'team-guid-here',
  'channel-guid-here',
  'Fleet Notifications',
  true,
  ARRAY['reservation_request', 'conflict_detected']
);
```

## SMS Integration (Twilio)

### Setup

1. Create a Twilio account: https://www.twilio.com
2. Get your Account SID, Auth Token, and phone number
3. Add to environment variables
4. Enable SMS in notification preferences

### Message Format

SMS messages are concise (160 chars or less when possible):

```
New reservation request for Ford F-150 from John Doe. Approve/reject in Fleet app.

Your reservation for Ford F-150 has been approved. Pickup: Jan 15, 10:00 AM

Reminder: Your reservation for Ford F-150 starts in 1 hour(s) at Main Facility
```

### Twilio Dependency

The system uses Twilio's Node.js SDK:

```bash
npm install twilio
```

## Testing

### Manual Testing

1. **Test Notification Endpoint:**
```bash
curl -X POST http://localhost:3000/api/scheduling-notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channels": ["email"]}'
```

2. **Trigger Background Job:**
```typescript
import schedulingReminders from './jobs/scheduling-reminders.job'
await schedulingReminders.triggerNow()
```

3. **Check Logs:**
```bash
tail -f logs/scheduling-reminders.log
```

### Integration Testing

Create test reservations with near-future times:

```typescript
// Create reservation starting in 25 minutes
const testReservation = {
  vehicleId: '123',
  reservedBy: 'user456',
  startTime: new Date(Date.now() + 25 * 60 * 1000),
  endTime: new Date(Date.now() + 125 * 60 * 1000),
  ...
}
```

Then wait for the background job to run (or trigger manually).

## Monitoring

### Database Queries

**Check pending reminders:**
```sql
SELECT
  entity_type,
  COUNT(*) as count
FROM scheduling_reminders_sent
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY entity_type;
```

**View notification stats:**
```sql
SELECT * FROM v_scheduling_notification_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

**Check user preferences:**
```sql
SELECT
  COUNT(*) FILTER (WHERE email_enabled) as email_users,
  COUNT(*) FILTER (WHERE sms_enabled) as sms_users,
  COUNT(*) FILTER (WHERE teams_enabled) as teams_users
FROM scheduling_notification_preferences;
```

### Logs

The system logs to:
- `logs/scheduling-reminders.log` - Background job execution
- Application logs - Individual notification sends
- Database `audit_logs` table - Job metrics

## Troubleshooting

### Notifications Not Sending

1. **Check user preferences:**
```sql
SELECT * FROM scheduling_notification_preferences WHERE user_id = 'USER_ID';
```

2. **Verify channel configuration:**
   - Email: Check `OUTLOOK_DEFAULT_USER_EMAIL` in env
   - SMS: Verify Twilio credentials
   - Teams: Check `tenant_teams_config` table

3. **Check reminder tracking:**
```sql
SELECT * FROM scheduling_reminders_sent
WHERE entity_id = 'RESERVATION_ID';
```

### Background Job Not Running

1. **Check if job is enabled:**
```bash
echo $ENABLE_SCHEDULING_REMINDERS  # Should be 'true'
```

2. **Validate cron expression:**
```typescript
const cron = require('node-cron');
console.log(cron.validate('*/15 * * * *'));  // Should be true
```

3. **Check logs:**
```bash
tail -f logs/scheduling-reminders.log
```

### Email Template Issues

1. **Missing variables:** Check template for `{{variable_name}}`
2. **Test with fallback:** Notification service has inline fallback templates
3. **Verify file paths:** Templates should be in `api/src/templates/scheduling/`

## Performance Considerations

### Database Indexes

The migration creates optimized indexes:
```sql
idx_sched_notif_prefs_user
idx_reminders_sent_entity
idx_reminders_sent_time
idx_scheduled_notifs_scheduled
```

### Rate Limiting

- Outlook: Handled by `outlook.service.ts`
- Teams: Handled by `teams.service.ts`
- SMS (Twilio): Default 1 message/second

### Batch Processing

The background job processes:
- Up to 100 reminders per run
- Separate batches for reservations and maintenance
- 15-minute execution window prevents overlap

## Future Enhancements

Potential improvements:
- [ ] Slack integration
- [ ] Push notifications (mobile app)
- [ ] In-app notification center
- [ ] Digest emails (daily/weekly summaries)
- [ ] Calendar file attachments (.ics)
- [ ] Rich text editor for template customization
- [ ] A/B testing for notification effectiveness
- [ ] Notification analytics dashboard

## Support

For issues or questions:
- Check logs: `logs/scheduling-reminders.log`
- Review database audit logs
- Test with `/test` endpoint
- Contact fleet system administrator
