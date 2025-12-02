# Fleet Mobile Messaging System

Complete mobile messaging implementation for email, SMS, and Microsoft Teams communication from the Fleet mobile app.

## Overview

This messaging system provides:
- **Email Composer**: Send rich HTML emails via Microsoft Graph with attachments and contact picker
- **SMS Composer**: Send SMS/MMS via Twilio with character counter and photo attachments
- **Teams Chat**: Real-time chat interface for Microsoft Teams channels
- **Template System**: Pre-filled message templates with variable substitution
- **Offline Support**: Queue messages for sending when connection is restored
- **Delivery Tracking**: Monitor message delivery status

## Architecture

```
Mobile App (React Native)
├── Components
│   ├── EmailComposer.tsx       - Email composition UI
│   ├── SMSComposer.tsx         - SMS composition UI
│   ├── TeamsChat.tsx           - Teams chat interface
│   └── MessageTemplateSelector.tsx - Template selection
├── Services
│   └── MessagingService.ts     - API integration & offline queue
└── Types
    └── messaging.types.ts      - TypeScript definitions

Backend API (Node.js/Express)
└── Routes
    └── mobile-messaging.routes.ts - Email/SMS/Teams endpoints
```

## Installation

### 1. Mobile App Dependencies

```bash
cd mobile
npm install --save \
  @react-native-async-storage/async-storage \
  @react-native-community/netinfo \
  react-native-document-picker \
  react-native-image-picker
```

### 2. Backend Dependencies

Already included in `api/package.json`:
- `@microsoft/microsoft-graph-client` - Microsoft Graph API
- `twilio` - SMS/MMS messaging
- `googleapis` - Gmail API (optional)

### 3. Environment Variables

Add to `.env`:

```bash
# Microsoft Graph (Email & Teams)
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
OUTLOOK_DEFAULT_USER_EMAIL=noreply@yourcompany.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# API Configuration
REACT_APP_API_URL=https://your-api.com
```

## Components

### 1. EmailComposer

Rich email composer with all the features needed for professional communication.

**Features:**
- To/CC/BCC fields with email validation
- Subject and HTML body
- Photo and document attachments
- Importance level selector
- Template integration
- Context-aware pre-filling
- Draft saving
- Offline queueing

**Usage:**

```tsx
import { EmailComposer } from './components/EmailComposer';

<EmailComposer
  context={{
    entityType: 'vehicle',
    entityId: '123',
    entityName: 'Toyota Camry #456',
    prefillData: {
      subject: 'Vehicle Issue Report',
      body: 'There is an issue with the vehicle...',
      recipients: ['fleet@company.com']
    }
  }}
  onSend={(draft) => console.log('Email sent:', draft)}
  onCancel={() => navigation.goBack()}
/>
```

### 2. SMSComposer

SMS/MMS composer with character counting and carrier compliance.

**Features:**
- Phone number input with formatting
- 160-character SMS / 1600-character MMS support
- Character counter with visual warnings
- Photo attachment (converts to MMS)
- Message splitting indicator
- Template integration
- Contact picker
- Draft saving

**Usage:**

```tsx
import { SMSComposer } from './components/SMSComposer';

<SMSComposer
  context={{
    entityType: 'work_order',
    entityId: '789',
    entityName: 'Work Order #789',
    prefillData: {
      body: 'Your vehicle is ready for pickup.',
      recipients: ['+15551234567']
    }
  }}
  availableContacts={contacts}
  onSend={(draft) => console.log('SMS sent:', draft)}
  onCancel={() => navigation.goBack()}
/>
```

### 3. TeamsChat

Real-time chat interface for Microsoft Teams channels.

**Features:**
- Message list with infinite scroll
- Send messages to channels
- Message bubbles (mine vs others)
- Avatar and sender name display
- Typing indicators
- Pull-to-refresh
- Adaptive card display (future)
- Read receipts (future)
- Context linking

**Usage:**

```tsx
import { TeamsChat } from './components/TeamsChat';

<TeamsChat
  teamId="team-uuid"
  channelId="channel-uuid"
  currentUserId="user123"
  currentUserName="John Doe"
  context={{
    entityType: 'damage_report',
    entityId: '456',
    entityName: 'Damage Report #456'
  }}
  onClose={() => navigation.goBack()}
/>
```

### 4. MessageTemplateSelector

Select and customize pre-defined message templates.

**Features:**
- Template browsing by category
- Search functionality
- Variable substitution ({{driver_name}}, {{vehicle_id}}, etc.)
- Live preview
- Context-aware variable pre-filling
- Custom template creation

**Usage:**

```tsx
import { MessageTemplateSelector } from './components/MessageTemplateSelector';

<MessageTemplateSelector
  type="email"  // or 'sms' or 'teams'
  onSelect={(template, variables) => {
    console.log('Template selected:', template);
    console.log('Variables:', variables);
  }}
  onClose={() => setShowTemplates(false)}
  context={{
    entityType: 'vehicle',
    entityId: '123'
  }}
/>
```

## MessagingService API

The `MessagingService` class handles all communication with the backend API.

### Methods

#### Email

```typescript
const service = new MessagingService();
service.setAuthToken(authToken);

// Send email
const result = await service.sendEmail({
  to: 'driver@company.com',
  cc: ['manager@company.com'],
  subject: 'Vehicle Inspection Due',
  body: '<p>Your vehicle inspection is due this week.</p>',
  bodyType: 'html',
  importance: 'high',
  entityLinks: [{
    entity_type: 'vehicle',
    entity_id: '123',
    link_type: 'Related'
  }]
});

if (result.success) {
  console.log('Email sent:', result.messageId);
}
```

#### SMS

```typescript
// Send SMS
const result = await service.sendSMS({
  to: '+15551234567',
  body: 'Your vehicle service is complete. Ready for pickup.',
  entityLinks: [{
    entity_type: 'work_order',
    entity_id: '789'
  }]
});

// Send MMS (with photo)
const result = await service.sendSMS({
  to: '+15551234567',
  body: 'Damage photo attached',
  mediaUrl: 'file:///path/to/photo.jpg'
});
```

#### Teams

```typescript
// Send Teams message
const result = await service.sendTeamsMessage({
  teamId: 'team-uuid',
  channelId: 'channel-uuid',
  message: 'Work order completed for Vehicle #123',
  contentType: 'html',
  importance: 'high',
  entityLinks: [{
    entity_type: 'work_order',
    entity_id: '789'
  }]
});

// Get Teams messages
const { messages } = await service.getTeamsMessages(
  'team-uuid',
  'channel-uuid',
  50  // limit
);
```

#### Templates

```typescript
// Get templates
const { templates } = await service.getTemplates('email');

// Create custom template
await service.createTemplate({
  name: 'Vehicle Ready Notification',
  type: 'sms',
  category: 'notification',
  body: 'Hi {{driver_name}}, your {{vehicle}} is ready for pickup.',
  variables: ['driver_name', 'vehicle']
});
```

#### Drafts

```typescript
// Save draft
await service.saveDraft('email', {
  to: [{ email: 'driver@company.com', name: 'John Doe' }],
  subject: 'Draft subject',
  body: 'Draft body...',
  bodyType: 'html'
});

// Get all drafts
const drafts = await service.getDrafts();

// Delete draft
await service.deleteDraft('draft-id');
```

#### Offline Queue

```typescript
// Messages are automatically queued when offline
// They will be sent automatically when connection is restored

// Get failed messages
const failed = await service.getFailedMessages();

// Retry failed message
await service.retryMessage('message-id');

// Clear failed messages
await service.clearFailedMessages();
```

#### Delivery Status

```typescript
// Get delivery status
const status = await service.getDeliveryStatus('message-id', 'sms');

console.log(status);
// {
//   messageId: 'SM1234...',
//   type: 'sms',
//   status: 'delivered',
//   timestamp: '2024-01-01T12:00:00Z'
// }
```

## API Endpoints

### Email

```
POST   /api/mobile/email/send        Send email via Microsoft Graph
```

**Request Body:**
```json
{
  "to": ["driver@company.com"],
  "cc": ["manager@company.com"],
  "subject": "Vehicle Inspection Due",
  "body": "<p>Your inspection is due.</p>",
  "bodyType": "html",
  "importance": "high",
  "entityLinks": [{
    "entity_type": "vehicle",
    "entity_id": "123",
    "link_type": "Related"
  }]
}
```

### SMS

```
POST   /api/mobile/sms/send           Send SMS via Twilio
```

**Request Body:**
```json
{
  "to": "+15551234567",
  "body": "Your vehicle is ready.",
  "mediaUrl": "https://example.com/photo.jpg",
  "entityLinks": [{
    "entity_type": "work_order",
    "entity_id": "789"
  }]
}
```

### Teams

```
POST   /api/mobile/teams/send         Send Teams message
```

**Request Body:**
```json
{
  "teamId": "team-uuid",
  "channelId": "channel-uuid",
  "message": "Work order completed",
  "contentType": "html",
  "importance": "high",
  "entityLinks": [{
    "entity_type": "work_order",
    "entity_id": "789"
  }]
}
```

### Templates

```
GET    /api/mobile/templates          Get message templates
POST   /api/mobile/templates          Create custom template
```

**Query Parameters:**
- `type`: Filter by type (email, sms, teams)
- `category`: Filter by category

### Contacts

```
GET    /api/mobile/contacts           Get contact list
```

**Query Parameters:**
- `type`: Filter by type (driver, manager, technician)

### Delivery Status

```
GET    /api/mobile/status/:type/:messageId   Get delivery status
```

## Database Schema

The system uses existing `communications` and `communication_entity_links` tables:

```sql
-- Communications table (already exists)
CREATE TABLE communications (
  id SERIAL PRIMARY KEY,
  communication_type VARCHAR(50),  -- 'Email', 'SMS', 'Teams'
  direction VARCHAR(20),            -- 'Inbound', 'Outbound'
  subject TEXT,
  body TEXT,
  to_contact_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  to_contact_phone VARCHAR(20),
  from_contact_phone VARCHAR(20),
  external_message_id VARCHAR(255),
  status VARCHAR(50),
  created_by INTEGER,
  communication_datetime TIMESTAMP,
  -- ... other fields
);

-- Entity links (already exists)
CREATE TABLE communication_entity_links (
  id SERIAL PRIMARY KEY,
  communication_id INTEGER REFERENCES communications(id),
  entity_type VARCHAR(50),  -- 'vehicle', 'driver', 'work_order', etc.
  entity_id VARCHAR(50),
  link_type VARCHAR(50),     -- 'Related', 'Primary', etc.
  manually_added BOOLEAN DEFAULT FALSE
);

-- Templates (already exists)
CREATE TABLE communication_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255),
  template_type VARCHAR(50),      -- 'email', 'sms', 'teams'
  template_category VARCHAR(50),  -- 'damage', 'maintenance', etc.
  subject TEXT,
  body TEXT,
  variables TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER
);
```

## Context-Aware Pre-filling

The messaging components support context-aware pre-filling from various entities:

### Damage Reports

```typescript
<EmailComposer
  context={{
    entityType: 'damage_report',
    entityId: damageReport.id,
    entityName: `Damage Report #${damageReport.id}`,
    prefillData: {
      subject: `Damage Report: ${vehicle.name}`,
      body: `
        <p>A damage report has been filed for ${vehicle.name}.</p>
        <p><strong>Description:</strong> ${damageReport.description}</p>
        <p><strong>Location:</strong> ${damageReport.location}</p>
      `,
      recipients: [driver.email, manager.email]
    }
  }}
/>
```

### Work Orders

```typescript
<SMSComposer
  context={{
    entityType: 'work_order',
    entityId: workOrder.id,
    entityName: `Work Order #${workOrder.id}`,
    prefillData: {
      body: `Your vehicle service is complete. Work Order #${workOrder.id}. Ready for pickup.`,
      recipients: [driver.phone_number]
    }
  }}
/>
```

### Inspections

```typescript
<TeamsChat
  teamId="maintenance-team"
  channelId="inspections"
  context={{
    entityType: 'inspection',
    entityId: inspection.id,
    entityName: `Inspection #${inspection.id}`
  }}
/>
```

## Offline Support

The messaging service automatically queues messages when offline:

1. **Automatic Detection**: Uses `@react-native-community/netinfo` to detect connectivity
2. **Queue Storage**: Messages stored in AsyncStorage
3. **Automatic Retry**: Messages sent automatically when connection restored
4. **Retry Logic**: Up to 3 attempts with exponential backoff
5. **Failed Message Management**: View and manually retry failed messages

## Template Variables

Supported template variables:

- `{{driver_name}}` - Driver's full name
- `{{driver_email}}` - Driver's email
- `{{driver_phone}}` - Driver's phone number
- `{{vehicle}}` - Vehicle name/identifier
- `{{vehicle_vin}}` - Vehicle VIN
- `{{work_order_id}}` - Work order number
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{company_name}}` - Company name
- `{{manager_name}}` - Manager's name
- `{{location}}` - Facility/location name

## Security & Permissions

All endpoints require authentication and proper permissions:

- `communication:send:global` - Send messages
- `communication:view:global` - View messages and templates
- `communication:broadcast:global` - Create templates

## Testing

### Test Email

```bash
curl -X POST http://localhost:3001/api/mobile/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test",
    "bodyType": "text"
  }'
```

### Test SMS

```bash
curl -X POST http://localhost:3001/api/mobile/sms/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "body": "Test SMS"
  }'
```

### Test Teams Message

```bash
curl -X POST http://localhost:3001/api/mobile/teams/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "TEAM_ID",
    "channelId": "CHANNEL_ID",
    "message": "Test message"
  }'
```

## Best Practices

1. **Always use context linking**: Link messages to relevant entities (vehicles, work orders, etc.)
2. **Use templates**: Create reusable templates for common communications
3. **Handle offline gracefully**: The service automatically queues, but inform users
4. **Validate phone numbers**: SMS requires properly formatted phone numbers
5. **Check permissions**: Ensure users have proper permissions before showing composers
6. **Monitor delivery**: Use delivery status API for critical communications
7. **Respect rate limits**: Microsoft Graph and Twilio have rate limits

## Troubleshooting

### Email not sending

- Verify Microsoft Graph credentials in `.env`
- Check user has `Mail.Send` permission
- Verify OUTLOOK_DEFAULT_USER_EMAIL is set

### SMS not sending

- Verify Twilio credentials
- Check phone number format (+1XXXXXXXXXX)
- Verify TWILIO_PHONE_NUMBER is set
- Check Twilio account balance

### Teams messages not appearing

- Verify team and channel IDs
- Check user has access to the channel
- Verify Microsoft Graph Teams permissions

## Future Enhancements

- [ ] Rich text editor (bold, italic, lists)
- [ ] Email signatures
- [ ] Message scheduling
- [ ] Bulk messaging
- [ ] Message search
- [ ] Conversation threading
- [ ] Voice messages
- [ ] Video attachments
- [ ] Message encryption
- [ ] Delivery receipts UI
- [ ] Push notifications for new messages

## Files Created

### Mobile App
- `/mobile/src/types/messaging.types.ts` - TypeScript type definitions
- `/mobile/src/components/EmailComposer.tsx` - Email composition UI
- `/mobile/src/components/SMSComposer.tsx` - SMS composition UI
- `/mobile/src/components/TeamsChat.tsx` - Teams chat interface
- `/mobile/src/components/MessageTemplateSelector.tsx` - Template selector
- `/mobile/src/services/MessagingService.ts` - API service with offline support

### Backend API
- `/api/src/routes/mobile-messaging.routes.ts` - API endpoints for messaging

### Documentation
- `/mobile/MOBILE_MESSAGING_SYSTEM.md` - This file

## Support

For issues or questions:
1. Check this documentation
2. Review API logs in Application Insights
3. Check Twilio logs for SMS issues
4. Review Microsoft Graph API responses
5. Contact the development team

---

**Built with:**
- React Native
- TypeScript
- Microsoft Graph API
- Twilio SMS API
- Express.js
- PostgreSQL
