# Microsoft Integration Guide

## Overview

The Fleet Management System includes comprehensive integration with Microsoft 365 services, providing seamless communication, collaboration, and workflow automation capabilities.

### Features

- **Microsoft Teams Integration**
  - Send and receive messages in Teams channels
  - Adaptive Cards for rich notifications
  - @mentions and reactions
  - Real-time sync via webhooks
  - Channel and team management

- **Outlook Email Integration**
  - Send and receive emails
  - Attachment handling with Azure Blob Storage
  - Email categorization and filtering
  - AI-powered receipt scanning
  - Reply and forward functionality
  - Folder management

- **Calendar Integration** (Coming Soon)
  - Schedule maintenance appointments
  - Team availability checking
  - Meeting room booking
  - Calendar event synchronization

- **Real-time Synchronization**
  - Delta query for efficient syncing
  - Webhook notifications for instant updates
  - Conflict resolution
  - Background sync jobs

- **File Attachments**
  - Azure Blob Storage for large files
  - SAS URL generation for secure sharing
  - File type validation
  - Image optimization

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Teams UI   │  │  Email UI    │  │  Notifications      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘   │
│         │                 │                     │              │
│         └─────────────────┴─────────────────────┘              │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │ REST API / WebSocket
┌───────────────────────────┼────────────────────────────────────┐
│                           │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Backend API (Express/Node.js)              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │   │
│  │  │   Teams    │  │  Outlook   │  │   Adaptive      │   │   │
│  │  │  Service   │  │  Service   │  │   Cards Svc     │   │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────────────────┘   │   │
│  │        │               │                                │   │
│  │  ┌─────┴───────────────┴──────┐                        │   │
│  │  │  Microsoft Graph Service   │                        │   │
│  │  └──────────────┬──────────────┘                        │   │
│  └─────────────────┼───────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────┼───────────────────────────────────────┐   │
│  │  Webhook Handlers   │   Queue Service   │  Sync Service │   │
│  └─────────────────┼───────────────────────────────────────┘   │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────────────┐
│                    │                                            │
│  ┌─────────────────┴───────────────────────────────────────┐   │
│  │              Microsoft Graph API                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │   │
│  │  │  Teams   │  │ Outlook  │  │  Notifications        │ │   │
│  │  └──────────┘  └──────────┘  └───────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  External Services:                                             │
│  - Azure Blob Storage (file attachments)                       │
│  - Azure AD (authentication)                                   │
│  - Redis (queue, optional)                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### Backend Services

1. **Microsoft Graph Service** (`/api/src/services/microsoft-graph.service.ts`)
   - Token acquisition and refresh
   - Graph API request wrapper
   - Rate limiting handling
   - Error handling

2. **Teams Service** (`/api/src/services/teams.service.ts`)
   - Send/receive messages
   - Channel management
   - @mentions parsing
   - Reactions

3. **Outlook Service** (`/api/src/services/outlook.service.ts`)
   - Email operations
   - Attachment handling
   - Folder management
   - Search and filtering

4. **Adaptive Cards Service** (`/api/src/services/adaptive-cards.service.ts`)
   - Card generation
   - Template management
   - Action handling

5. **Attachment Service** (`/api/src/services/attachment.service.ts`)
   - Azure Blob upload/download
   - File validation
   - SAS URL generation

6. **Queue Service** (`/api/src/services/queue.service.ts`)
   - Job enqueueing
   - Retry logic
   - Dead letter queue

7. **Sync Service** (`/api/src/services/sync.service.ts`)
   - Delta query implementation
   - Sync state management
   - Conflict resolution

### Frontend Components

1. **Teams Integration** (`/src/components/modules/TeamsIntegration.tsx`)
   - Teams UI
   - Message composition
   - Real-time updates

2. **Email Center** (`/src/components/modules/EmailCenter.tsx`)
   - Email inbox
   - Compose/reply/forward
   - Attachment management

### Webhooks

1. **Teams Webhook** (`/api/src/webhooks/teams.webhook.ts`)
   - Message notifications
   - Signature verification
   - Subscription management

2. **Outlook Webhook** (`/api/src/webhooks/outlook.webhook.ts`)
   - Email notifications
   - Subscription renewal

## Quick Start

### Prerequisites

- Node.js 18+
- Azure AD tenant and app registration
- Microsoft 365 account
- Azure Storage account (for attachments)
- PostgreSQL database

### Installation

1. **Install dependencies**:
   ```bash
   cd /home/user/Fleet/api
   npm install

   cd /home/user/Fleet
   npm install
   ```

2. **Configure environment variables**:

   Create `/home/user/Fleet/api/.env`:
   ```bash
   MS_GRAPH_CLIENT_ID=your-client-id
   MS_GRAPH_CLIENT_SECRET=your-client-secret
   MS_GRAPH_TENANT_ID=your-tenant-id
   MS_GRAPH_WEBHOOK_SECRET=your-webhook-secret
   AZURE_STORAGE_CONNECTION_STRING=your-connection-string
   ```

3. **Run database migrations**:
   ```bash
   npm run migrate
   ```

4. **Start the services**:
   ```bash
   # Backend
   cd api
   npm run dev

   # Frontend
   cd ..
   npm run dev
   ```

### Testing

Run the comprehensive test suite:

```bash
# Backend tests
cd api
npm test

# Frontend tests
cd ..
npm run test:unit

# Integration tests
npm run test:integration
```

## Documentation

- [Setup Guide](./setup.md) - Detailed setup instructions
- [API Reference](./api-reference.md) - Complete API documentation
- [Webhooks Guide](./webhooks.md) - Webhook configuration and testing
- [Adaptive Cards](./adaptive-cards.md) - Creating custom cards
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [Monitoring](./monitoring.md) - Metrics and alerts
- [Security](./security.md) - Security best practices

## User Guides

- [Teams Integration User Guide](../user-guides/teams-integration.md)
- [Email Integration User Guide](../user-guides/email-integration.md)

## Runbooks

- [Microsoft Integration Runbook](../runbooks/microsoft-integration-runbook.md)

## Examples

### Sending a Teams Message

```typescript
import { TeamsService } from './services/teams.service';

const teamsService = new TeamsService(graphService);

await teamsService.sendMessage(
  'team-id',
  'channel-id',
  'Hello from Fleet Management!'
);
```

### Sending an Email

```typescript
import { OutlookService } from './services/outlook.service';

const outlookService = new OutlookService(graphService);

await outlookService.sendEmail(
  ['recipient@example.com'],
  'Vehicle Maintenance Due',
  '<p>Your vehicle maintenance is due soon.</p>'
);
```

### Creating an Adaptive Card

```typescript
import { AdaptiveCardsService } from './services/adaptive-cards.service';

const cardsService = new AdaptiveCardsService();

const card = cardsService.createVehicleAlertCard({
  vehicleId: 'VEH-001',
  alertType: 'Low Fuel',
  message: 'Fuel level is below 10%',
  severity: 'high',
  timestamp: new Date().toISOString()
});

await teamsService.sendAdaptiveCard('team-id', 'channel-id', card);
```

## Support

For issues, questions, or contributions:

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review API logs: `kubectl logs -f deployment/fleet-api`
- Contact the development team

## License

Copyright © 2025 Fleet Management System
