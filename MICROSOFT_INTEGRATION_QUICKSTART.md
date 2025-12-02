# 🚀 Microsoft Integration - Quickstart Guide

Welcome to the world-class Microsoft Teams, Outlook, and Calendar integration for Fleet Management!

## ⚡ One-Click Setup

Run the automated setup script:

```bash
chmod +x setup-microsoft-integration.sh
./setup-microsoft-integration.sh
```

This will:
- ✅ Install all dependencies
- ✅ Run database migrations
- ✅ Verify TypeScript compilation
- ✅ Build the application
- ✅ Run tests
- ✅ Setup webhooks (optional)
- ✅ Verify integration health

## 🎯 Manual Setup (Alternative)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Microsoft Azure account with app registration

### 2. Azure App Registration

1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "Fleet Management Microsoft Integration"
5. Redirect URI: `https://your-domain.com/api/auth/microsoft/callback`
6. Click "Register"

### 3. Configure Permissions

In your app registration, grant these Microsoft Graph API permissions:

**Delegated Permissions:**
- `Team.ReadBasic.All`
- `Channel.ReadBasic.All`
- `ChannelMessage.Read.All`
- `ChannelMessage.Send`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `Calendars.ReadWrite`
- `Presence.Read`
- `User.Read`

**Application Permissions (for webhooks):**
- `ChannelMessage.Read.All`
- `Mail.Read`

Click "Grant admin consent" for your organization.

### 4. Environment Configuration

Create `/api/.env` with:

```bash
# Microsoft Graph API
MICROSOFT_CLIENT_ID=your-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here
MICROSOFT_TENANT_ID=your-tenant-id-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fleetdb

# Webhooks (optional - for real-time updates)
WEBHOOK_BASE_URL=https://your-domain.com/api/webhooks
WEBHOOK_SECRET=generate-a-secure-random-string

# Azure Storage (for file attachments)
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key

# Email Configuration
EMAIL_FROM=noreply@your-domain.com
OUTLOOK_DEFAULT_USER_EMAIL=user@your-domain.com
EMAIL_PROVIDER=auto  # Options: graph, smtp, auto
```

### 5. Install Dependencies

```bash
# Backend
cd api
npm install

# Frontend
cd ..
npm install
```

### 6. Database Migrations

```bash
cd api
npm run migrate
```

Or manually:

```bash
psql $DATABASE_URL -f api/db/migrations/022_attachment_enhancements.sql
psql $DATABASE_URL -f api/db/migrations/023_webhook_subscriptions.sql
psql $DATABASE_URL -f api/db/migrations/024_sync_metadata.sql
psql $DATABASE_URL -f api/db/migrations/025_job_queue.sql
psql $DATABASE_URL -f api/db/migrations/026_advanced_microsoft_integration.sql
psql $DATABASE_URL -f api/src/migrations/022_microsoft_teams_integration.sql
```

### 7. Build & Start

```bash
# Build
npm run build

# Start backend
cd api
npm run dev

# Start frontend (in another terminal)
npm run dev
```

## 🧪 Verify Installation

### Health Check

```bash
# Comprehensive health check
npm run health:check

# Simple health check
curl http://localhost:3000/api/health/microsoft/simple

# Prometheus metrics
npm run health:metrics
```

### Test the Integration

```bash
# Run tests
cd api
npm test

# Test Microsoft Graph connection
npm run verify:integration
```

## 📊 Generate Demo Data

```bash
cd api

# Generate all demo data (Teams, Outlook, Calendar)
npm run demo:generate

# Generate only Teams data
npm run demo:teams

# Generate only Outlook data
npm run demo:outlook

# Custom count
npm run demo:generate -- --count=100
```

## 🔔 Setup Webhooks (Optional but Recommended)

For real-time message updates:

```bash
cd api
npm run setup:webhooks
```

**Requirements:**
- Public HTTPS endpoint (use ngrok for local development)
- Set `WEBHOOK_BASE_URL` in `.env`

**For local development with ngrok:**

```bash
# In one terminal
ngrok http 3000

# Copy the HTTPS URL and update .env
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io/api/webhooks

# Setup webhooks
npm run setup:webhooks
```

## 📚 API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:3000/api/docs
- **Health Dashboard**: http://localhost:3000/api/health/microsoft
- **Queue Stats**: http://localhost:3000/api/queue/stats
- **Sync Status**: http://localhost:3000/api/sync/status

## 🎨 Features

### Microsoft Teams
- ✅ Send messages to channels
- ✅ Read messages from channels
- ✅ Reply to messages (threading)
- ✅ Add emoji reactions
- ✅ @mentions support
- ✅ File attachments
- ✅ Adaptive Cards
- ✅ Real-time webhooks

### Outlook Email
- ✅ Send emails with attachments
- ✅ Read emails with filters
- ✅ Reply/Reply All/Forward
- ✅ Move to folders
- ✅ Mark as read/unread
- ✅ Search emails
- ✅ Auto-categorization
- ✅ Receipt OCR extraction
- ✅ Real-time new email notifications

### Calendar
- ✅ Create events with attendees
- ✅ Update/delete events
- ✅ Accept/decline invitations
- ✅ Find available meeting times
- ✅ Schedule maintenance
- ✅ Schedule training sessions

### Advanced Features
- ✅ 7 Adaptive Card templates for fleet operations
- ✅ User presence tracking
- ✅ Message queue with retry logic
- ✅ Real-time sync service
- ✅ File attachment system with Azure Blob
- ✅ Comprehensive logging

## 🔧 Useful Commands

```bash
# Backend
cd api

# Check queue status
npm run queue:stats

# Check sync status
npm run sync:status

# Verify integration health
npm run verify:integration

# Cleanup old webhooks
npm run webhooks:cleanup

# Generate demo data
npm run demo:generate

# Run tests
npm test

# Run tests with coverage
npm test:coverage
```

## 📖 Documentation

Comprehensive guides available in `/docs/microsoft-integration/`:

- **Setup Guide**: `setup.md` - Detailed Azure configuration
- **Security Guide**: `security.md` - Security best practices
- **Operational Runbook**: `../runbooks/microsoft-integration-runbook.md`
- **Testing Guide**: `TESTING_AND_DEPLOYMENT_SUMMARY.md`

## 🐛 Troubleshooting

### Common Issues

**"Microsoft Graph API not configured"**
- Verify `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` in `.env`
- Ensure app registration has correct permissions
- Grant admin consent in Azure portal

**"Webhook validation failed"**
- Ensure webhook URL is publicly accessible (HTTPS required)
- Verify `WEBHOOK_SECRET` is set correctly
- Check firewall/network settings

**"Database connection failed"**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database exists and migrations ran

**"Queue jobs stuck"**
- Check queue stats: `npm run queue:stats`
- Review dead letter queue: `curl http://localhost:3000/api/queue/dead-letter`
- Restart the application

### Get Help

- Check logs: `tail -f api/logs/app.log`
- Health check: `npm run health:check`
- Review documentation in `/docs/microsoft-integration/`

## 🎉 Success!

Your Microsoft integration is ready! Try these next steps:

1. **Send a Teams message**: `POST /api/teams/{teamId}/channels/{channelId}/messages`
2. **Send an email**: `POST /api/outlook/send`
3. **Create a calendar event**: `POST /api/calendar/events`
4. **Send an Adaptive Card**: `POST /api/cards/vehicle-maintenance`

## 💡 Pro Tips

- Use webhooks for real-time updates (saves API calls)
- Enable queue system for reliable message delivery
- Monitor health dashboard regularly
- Review logs for debugging
- Use demo data to test UI components
- Check Swagger UI for interactive API testing

## 🔒 Security Best Practices

- Never commit `.env` files to version control
- Rotate secrets regularly
- Use Azure Key Vault in production
- Enable HTTPS for all endpoints
- Review security guide: `docs/microsoft-integration/security.md`

## 📊 Monitoring

- **Application Insights**: Integrated OpenTelemetry tracing
- **Health Checks**: `/api/health/microsoft`
- **Metrics**: `/api/health/microsoft/metrics` (Prometheus format)
- **Queue Stats**: `/api/queue/stats`
- **Sync Status**: `/api/sync/status`

---

**Built with ❤️ by 10 specialized AI agents working in parallel** 🤖

For questions or issues, check the documentation or create an issue on GitHub.
