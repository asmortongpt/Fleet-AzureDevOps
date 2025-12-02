# Microsoft Teams Integration Guide

## Overview

The Fleet Management System now includes a comprehensive Microsoft Teams integration that allows seamless communication between your fleet operations and Microsoft Teams. All communications are automatically logged to the database and can be linked to fleet entities like vehicles, drivers, and work orders.

## Features

- ✅ Send messages to Teams channels
- ✅ Retrieve messages and channel history
- ✅ Reply to messages (threading support)
- ✅ Add emoji reactions to messages
- ✅ Create and manage channels
- ✅ Update and delete messages
- ✅ Support for @mentions
- ✅ Support for file attachments
- ✅ Adaptive Card formatting
- ✅ Automatic communication logging to database
- ✅ Link communications to fleet entities (vehicles, drivers, work orders)

## Setup

### 1. Microsoft Azure Configuration

First, ensure you have configured your Microsoft Azure AD application with the following permissions:

**Application Permissions (for app-only access):**
- `Team.ReadBasic.All` - Read basic team information
- `Channel.ReadBasic.All` - Read basic channel information
- `ChannelMessage.Read.All` - Read all channel messages
- `ChannelMessage.Send` - Send messages to channels

**Delegated Permissions (for user context):**
- `Team.ReadBasic.All`
- `Channel.ReadBasic.All`
- `ChannelMessage.Read.All`
- `ChannelMessage.Send`

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Microsoft Graph API Configuration
MICROSOFT_CLIENT_ID=your-azure-ad-client-id
MICROSOFT_CLIENT_SECRET=your-azure-ad-client-secret
MICROSOFT_TENANT_ID=your-azure-ad-tenant-id

# Or use AZURE_AD prefix
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
```

### 3. Database Migration

Run the Teams integration migration:

```bash
psql -d fleetdb -f api/src/migrations/022_microsoft_teams_integration.sql
```

This adds the required columns to the `users` table for storing Microsoft access tokens.

## API Endpoints

All endpoints require authentication via JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### List All Teams

```http
GET /api/teams
```

**Response:**
```json
{
  "success": true,
  "teams": [
    {
      "id": "team-id-1234",
      "displayName": "Fleet Operations",
      "description": "Main fleet operations team"
    }
  ]
}
```

### List Channels in a Team

```http
GET /api/teams/{teamId}/channels
```

**Response:**
```json
{
  "success": true,
  "channels": [
    {
      "id": "channel-id-5678",
      "displayName": "General",
      "description": "General discussion"
    }
  ]
}
```

### Get Messages from a Channel

```http
GET /api/teams/{teamId}/channels/{channelId}/messages?limit=50
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "message-id-9012",
      "createdDateTime": "2025-11-16T10:30:00Z",
      "from": {
        "user": {
          "id": "user-id",
          "displayName": "John Doe"
        }
      },
      "body": {
        "contentType": "html",
        "content": "<p>Vehicle 123 completed maintenance</p>"
      }
    }
  ]
}
```

### Send a Message

```http
POST /api/teams/{teamId}/channels/{channelId}/messages
Content-Type: application/json

{
  "message": "<p>Vehicle <strong>TRUCK-001</strong> maintenance complete. All systems operational.</p>",
  "subject": "Maintenance Update",
  "contentType": "html",
  "importance": "high",
  "mentions": [
    {
      "userId": "user-id-1234",
      "displayName": "Jane Smith"
    }
  ],
  "entityLinks": [
    {
      "entity_type": "vehicle",
      "entity_id": 123,
      "link_type": "Primary Subject"
    },
    {
      "entity_type": "work_order",
      "entity_id": 456,
      "link_type": "Related"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "message-id-3456",
    "createdDateTime": "2025-11-16T10:35:00Z"
  },
  "communicationId": 789
}
```

The `communicationId` is the ID of the record created in the `communications` table, which links this Teams message to your fleet entities.

### Reply to a Message (Threading)

```http
POST /api/teams/{teamId}/channels/{channelId}/messages/{messageId}/replies
Content-Type: application/json

{
  "message": "<p>Thanks for the update! Driver has been notified.</p>",
  "contentType": "html",
  "mentions": [
    {
      "userId": "user-id-5678",
      "displayName": "Mike Johnson"
    }
  ]
}
```

### Add a Reaction

```http
POST /api/teams/{teamId}/channels/{channelId}/messages/{messageId}/reactions
Content-Type: application/json

{
  "reactionType": "like"
}
```

Common reaction types: `like`, `heart`, `laugh`, `surprised`, `sad`, `angry`

### Create a Channel

```http
POST /api/teams/{teamId}/channels
Content-Type: application/json

{
  "displayName": "Maintenance Updates",
  "description": "Channel for all vehicle maintenance updates",
  "membershipType": "standard"
}
```

Membership types: `standard` (public) or `private`

### Update a Message

```http
PATCH /api/teams/{teamId}/channels/{channelId}/messages/{messageId}
Content-Type: application/json

{
  "content": "<p>Updated message content</p>",
  "contentType": "html"
}
```

### Delete a Message

```http
DELETE /api/teams/{teamId}/channels/{channelId}/messages/{messageId}
```

## Usage Examples

### Example 1: Send Maintenance Notification

```javascript
// Send a maintenance notification to the fleet team
const response = await fetch('https://api.fleet.com/api/teams/team-123/channels/channel-456/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    message: `
      <h3>🔧 Maintenance Completed</h3>
      <p><strong>Vehicle:</strong> TRUCK-001</p>
      <p><strong>Type:</strong> Oil Change + Tire Rotation</p>
      <p><strong>Status:</strong> ✅ Complete</p>
      <p><strong>Next Service:</strong> 3 months</p>
    `,
    subject: 'Maintenance Update - TRUCK-001',
    importance: 'normal',
    entityLinks: [
      { entity_type: 'vehicle', entity_id: 123, link_type: 'Primary Subject' },
      { entity_type: 'work_order', entity_id: 789, link_type: 'Related' }
    ]
  })
})

const data = await response.json()
console.log('Message sent! Communication ID:', data.communicationId)
```

### Example 2: Send Safety Alert with Mentions

```javascript
// Send urgent safety alert and mention the safety officer
const response = await fetch('https://api.fleet.com/api/teams/team-123/channels/channel-456/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    message: `
      <h3>⚠️ SAFETY ALERT</h3>
      <p><at id="0">Sarah Johnson</at> - Immediate attention required!</p>
      <p><strong>Incident:</strong> Minor collision reported</p>
      <p><strong>Vehicle:</strong> VAN-007</p>
      <p><strong>Driver:</strong> John Smith</p>
      <p><strong>Location:</strong> 123 Main St, Downtown</p>
      <p><strong>Status:</strong> No injuries, vehicle drivable</p>
    `,
    subject: '⚠️ URGENT: Safety Incident - VAN-007',
    importance: 'urgent',
    mentions: [
      { userId: 'user-id-safety-officer', displayName: 'Sarah Johnson' }
    ],
    entityLinks: [
      { entity_type: 'vehicle', entity_id: 7, link_type: 'Primary Subject' },
      { entity_type: 'driver', entity_id: 42, link_type: 'Related' },
      { entity_type: 'incident', entity_id: 99, link_type: 'Primary Subject' }
    ]
  })
})
```

### Example 3: Use Adaptive Cards (Advanced)

```javascript
import teamsService from './services/teams.service'

// Create an Adaptive Card for rich formatting
const adaptiveCard = teamsService.formatAdaptiveCard({
  title: '🚛 Daily Fleet Summary',
  subtitle: 'November 16, 2025',
  text: 'Here is your daily fleet operations summary',
  facts: [
    { key: 'Active Vehicles', value: '42' },
    { key: 'Maintenance Due', value: '5' },
    { key: 'Fuel Efficiency', value: '12.5 MPG' },
    { key: 'Total Miles', value: '2,450' }
  ],
  actions: [
    { title: 'View Details', url: 'https://fleet.com/dashboard' }
  ]
})

// Send the adaptive card as an attachment
await fetch('https://api.fleet.com/api/teams/team-123/channels/channel-456/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    message: 'Daily Fleet Summary',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: JSON.stringify(adaptiveCard)
      }
    ]
  })
})
```

## Communication Logging

Every message sent through the Teams integration is automatically logged to the `communications` table with the following benefits:

1. **Full Audit Trail**: All Teams communications are searchable and archived
2. **Entity Linking**: Messages are linked to vehicles, drivers, work orders, incidents, etc.
3. **AI Analysis**: Messages can be analyzed for sentiment, priority, and categorization
4. **Reporting**: Generate communication reports by entity, date, or category

### Query Communications by Vehicle

```sql
SELECT
  c.id,
  c.subject,
  c.body,
  c.communication_datetime,
  c.from_user_id,
  v.unit_number
FROM communications c
JOIN communication_entity_links cel ON c.id = cel.communication_id
JOIN vehicles v ON cel.entity_id = v.id
WHERE cel.entity_type = 'vehicle'
  AND v.id = 123
ORDER BY c.communication_datetime DESC;
```

### Query All Teams Messages

```sql
SELECT *
FROM communications
WHERE communication_type = 'Chat'
  AND thread_id IS NOT NULL
ORDER BY communication_datetime DESC
LIMIT 50;
```

## Error Handling

All API endpoints return standard error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Resource created
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

## Best Practices

1. **Use Entity Links**: Always link Teams messages to relevant fleet entities for better tracking
2. **Set Importance Appropriately**: Use `urgent` sparingly for truly critical messages
3. **Use @Mentions Wisely**: Only mention people who need to take action
4. **Format with HTML**: Use HTML formatting for better readability
5. **Include Context**: Add vehicle numbers, driver names, and other identifiers
6. **Monitor Communications**: Regularly review the communications log for insights

## Security Considerations

- All API endpoints require authentication via JWT token
- Microsoft Graph API tokens are securely stored in the database
- Tokens are automatically refreshed when expired
- Rate limiting is applied to prevent abuse
- All communications are logged for audit purposes

## Support

For questions or issues with the Teams integration:
- Check the API documentation at `/api/docs`
- Review the OpenAPI spec at `/api/openapi.json`
- Contact the development team

## Future Enhancements

Planned features for future releases:
- Bot integration for automated responses
- Custom Teams apps
- Meeting scheduling integration
- File sharing and management
- Advanced notification routing
