# Microsoft Integration Setup Guide

## Table of Contents

1. [Azure AD App Registration](#azure-ad-app-registration)
2. [Required Permissions](#required-permissions)
3. [Environment Configuration](#environment-configuration)
4. [Webhook Setup](#webhook-setup)
5. [Testing the Integration](#testing-the-integration)

## Azure AD App Registration

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Fleet Management System
   - **Supported account types**: Single tenant (or multi-tenant as needed)
   - **Redirect URI**: `https://your-domain.com/auth/callback`

### Step 2: Generate Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set description: "Fleet Management API"
4. Set expiration: 24 months (recommended)
5. **Copy the secret value immediately** (you won't see it again)

### Step 3: Configure API Permissions

Required Microsoft Graph API permissions:

**Delegated Permissions** (for user context):
- `User.Read` - Read user profile
- `Mail.Read` - Read user mail
- `Mail.ReadWrite` - Read and write user mail
- `Mail.Send` - Send mail as user
- `ChannelMessage.Read.All` - Read Teams messages
- `ChannelMessage.Send` - Send Teams messages
- `Channel.ReadBasic.All` - Read basic channel info

**Application Permissions** (for app context):
- `Mail.Read` - Read mail in all mailboxes
- `Mail.ReadWrite` - Read and write mail in all mailboxes
- `ChannelMessage.Read.All` - Read all channel messages
- `ChannelMessage.Send` - Send messages to all channels

### Step 4: Grant Admin Consent

1. Click **Grant admin consent for [Your Tenant]**
2. Confirm the consent

## Required Permissions

### Microsoft Graph Scopes

```
https://graph.microsoft.com/.default
https://graph.microsoft.com/User.Read
https://graph.microsoft.com/Mail.ReadWrite
https://graph.microsoft.com/Mail.Send
https://graph.microsoft.com/ChannelMessage.Read.All
https://graph.microsoft.com/ChannelMessage.Send
```

### Azure Storage Permissions

- Storage Blob Data Contributor
- Storage Blob Data Reader

## Environment Configuration

### Backend Environment Variables

Create `/home/user/Fleet/api/.env`:

```bash
# Microsoft Graph API
MS_GRAPH_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
MS_GRAPH_CLIENT_SECRET=your-client-secret-here
MS_GRAPH_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
MS_GRAPH_SCOPE=https://graph.microsoft.com/.default

# Webhook Configuration
MS_GRAPH_WEBHOOK_SECRET=generate-random-secret-here
MS_GRAPH_WEBHOOK_URL=https://your-domain.com/api/webhooks/microsoft

# Azure Storage (for attachments)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=fleetattachments
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER=attachments

# Redis (optional, for queue)
REDIS_URL=redis://localhost:6379
REDIS_QUEUE_PREFIX=fleet:queue

# Feature Flags
ENABLE_TEAMS_INTEGRATION=true
ENABLE_OUTLOOK_INTEGRATION=true
ENABLE_ADAPTIVE_CARDS=true
ENABLE_CALENDAR_INTEGRATION=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fleetdb

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRY=24h
```

### Frontend Environment Variables

Create `/home/user/Fleet/.env`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Microsoft Authentication
VITE_AZURE_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
VITE_AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/auth/callback

# Feature Flags
VITE_ENABLE_TEAMS=true
VITE_ENABLE_EMAIL=true
```

## Webhook Setup

### 1. Configure Public Endpoint

Webhooks require a publicly accessible HTTPS endpoint. Options:

**Option A: ngrok (Development)**
```bash
ngrok http 3000
# Copy the HTTPS URL: https://abc123.ngrok.io
```

**Option B: Production Domain**
```
https://your-domain.com/api/webhooks/microsoft
```

### 2. Create Graph API Subscriptions

Run the setup script:

```bash
cd /home/user/Fleet/api
npm run setup:webhooks
```

Or manually create subscriptions:

```typescript
// Teams subscription
POST https://graph.microsoft.com/v1.0/subscriptions
{
  "changeType": "created,updated",
  "notificationUrl": "https://your-domain.com/api/webhooks/teams",
  "resource": "/teams/{team-id}/channels/{channel-id}/messages",
  "expirationDateTime": "2025-02-15T11:00:00.0000000Z",
  "clientState": "your-secret-state"
}

// Outlook subscription
POST https://graph.microsoft.com/v1.0/subscriptions
{
  "changeType": "created,updated",
  "notificationUrl": "https://your-domain.com/api/webhooks/outlook",
  "resource": "/users/{user-id}/messages",
  "expirationDateTime": "2025-02-15T11:00:00.0000000Z",
  "clientState": "your-secret-state"
}
```

### 3. Validate Webhooks

Microsoft will send a validation request:

```http
POST /api/webhooks/teams?validationToken=abc123
```

Your endpoint must respond with the validation token:

```json
"abc123"
```

### 4. Renew Subscriptions

Subscriptions expire after 3 days (4230 minutes). Set up automatic renewal:

```bash
# Add to crontab
0 */12 * * * cd /home/user/Fleet/api && npm run renew:webhooks
```

## Testing the Integration

### 1. Test Authentication

```bash
curl -X POST http://localhost:3000/api/auth/microsoft \
  -H "Content-Type: application/json" \
  -d '{"code": "your-auth-code"}'
```

### 2. Test Teams Integration

```bash
curl -X POST http://localhost:3000/api/teams/messages \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team-id",
    "channelId": "channel-id",
    "message": "Test message from Fleet Management"
  }'
```

### 3. Test Outlook Integration

```bash
curl -X POST http://localhost:3000/api/outlook/send \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Test Email",
    "body": "<p>Test email from Fleet Management</p>"
  }'
```

### 4. Test Webhooks

Use ngrok or production URL to receive webhook notifications:

1. Send a message in Teams
2. Check API logs: `tail -f api/logs/app.log`
3. Verify webhook received and processed

### 5. Run Test Suite

```bash
# Backend tests
cd api
npm test

# Integration tests
npm run test:integration

# Frontend tests
cd ..
npm run test:unit
```

### Verification Checklist

- [ ] Azure AD app registered with correct permissions
- [ ] Admin consent granted
- [ ] Environment variables configured
- [ ] Backend API starts without errors
- [ ] Frontend connects to backend
- [ ] Can authenticate with Microsoft
- [ ] Can send Teams messages
- [ ] Can send emails
- [ ] Webhooks receive notifications
- [ ] Adaptive Cards render correctly
- [ ] File attachments upload/download
- [ ] All tests pass

## Troubleshooting Setup

### Issue: "Invalid client secret"

**Solution**: Verify the client secret in Azure Portal matches your `.env` file. Regenerate if needed.

### Issue: "Insufficient permissions"

**Solution**: Ensure admin consent is granted for all required permissions.

### Issue: "Webhook validation failed"

**Solution**:
1. Check that endpoint is publicly accessible
2. Verify HTTPS is enabled (required for webhooks)
3. Check that validation token is returned correctly

### Issue: "Token acquisition failed"

**Solution**:
1. Verify tenant ID and client ID are correct
2. Check that app registration is not disabled
3. Ensure correct scopes are requested

## Next Steps

- [API Reference](./api-reference.md)
- [Webhooks Guide](./webhooks.md)
- [Troubleshooting](./troubleshooting.md)
