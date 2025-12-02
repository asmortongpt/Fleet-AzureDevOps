# Mobile Messaging Setup Guide

Quick setup guide for the Fleet mobile messaging system.

## Prerequisites

- Node.js 18+ and npm
- React Native development environment configured
- Microsoft Azure account (for Graph API)
- Twilio account (for SMS)

## Step 1: Install Dependencies

```bash
cd /home/user/Fleet/mobile
npm install
```

Required packages:
- `@react-native-async-storage/async-storage` - Local storage for drafts and queue
- `@react-native-community/netinfo` - Network connectivity detection
- `react-native-document-picker` - Document attachment picker
- `react-native-image-picker` - Photo attachment picker

## Step 2: iOS Configuration

### Install CocoaPods dependencies

```bash
cd ios
pod install
cd ..
```

### Update Info.plist

Add permissions for camera and photo library access:

```xml
<key>NSCameraUsageDescription</key>
<string>Take photos to attach to messages</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Select photos to attach to messages</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save photos from messages</string>
```

## Step 3: Android Configuration

### Update AndroidManifest.xml

Add permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Step 4: Backend Configuration

### Set Environment Variables

Create or update `/home/user/Fleet/api/.env`:

```bash
# Microsoft Graph API (for Email & Teams)
MICROSOFT_CLIENT_ID=your_azure_app_client_id
MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret
MICROSOFT_TENANT_ID=your_azure_tenant_id
OUTLOOK_DEFAULT_USER_EMAIL=noreply@yourcompany.com

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# API Base URL (for mobile app)
REACT_APP_API_URL=http://localhost:3001
```

### Microsoft Graph Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new app in Azure AD
3. Add API permissions:
   - `Mail.Send` - Send emails
   - `Mail.ReadWrite` - Read/write emails
   - `ChannelMessage.Send` - Send Teams messages
   - `Channel.ReadBasic.All` - Read Teams channels
4. Generate a client secret
5. Copy Client ID, Tenant ID, and Secret to `.env`

### Twilio Setup

1. Sign up at [Twilio](https://www.twilio.com)
2. Get a phone number
3. Copy Account SID and Auth Token to `.env`
4. Configure messaging services if needed

## Step 5: Database Migration

The messaging system uses existing tables. Verify they exist:

```sql
-- Check communications table
SELECT * FROM communications LIMIT 1;

-- Check communication_entity_links table
SELECT * FROM communication_entity_links LIMIT 1;

-- Check communication_templates table
SELECT * FROM communication_templates LIMIT 1;
```

If tables don't exist, they should be created by the main migration system.

## Step 6: Create Sample Templates

Insert some sample message templates:

```sql
-- Email template for damage reports
INSERT INTO communication_templates (
  template_name, template_type, template_category,
  subject, body, variables, is_active, created_by
) VALUES (
  'Damage Report Notification',
  'email',
  'damage',
  'Damage Report: {{vehicle}}',
  '<p>A damage report has been filed for {{vehicle}}.</p>
   <p><strong>Description:</strong> {{description}}</p>
   <p><strong>Driver:</strong> {{driver_name}}</p>
   <p>Please review and take appropriate action.</p>',
  ARRAY['vehicle', 'description', 'driver_name'],
  TRUE,
  1
);

-- SMS template for vehicle ready notification
INSERT INTO communication_templates (
  template_name, template_type, template_category,
  subject, body, variables, is_active, created_by
) VALUES (
  'Vehicle Ready Notification',
  'sms',
  'notification',
  NULL,
  'Hi {{driver_name}}, your {{vehicle}} is ready for pickup at {{location}}.',
  ARRAY['driver_name', 'vehicle', 'location'],
  TRUE,
  1
);

-- Teams template for work order completion
INSERT INTO communication_templates (
  template_name, template_type, template_category,
  subject, body, variables, is_active, created_by
) VALUES (
  'Work Order Completed',
  'teams',
  'maintenance',
  NULL,
  'Work order #{{work_order_id}} has been completed for {{vehicle}}. Duration: {{duration}}.',
  ARRAY['work_order_id', 'vehicle', 'duration'],
  TRUE,
  1
);
```

## Step 7: Start the Services

### Start Backend API

```bash
cd /home/user/Fleet/api
npm run dev
```

API should be running on http://localhost:3001

### Start Mobile App

#### iOS

```bash
cd /home/user/Fleet/mobile
npm run ios
```

#### Android

```bash
cd /home/user/Fleet/mobile
npm run android
```

## Step 8: Test Messaging

### Test Email

1. Open the app
2. Navigate to any vehicle or work order
3. Tap "Send Email"
4. Fill in recipient, subject, body
5. Tap "Send Email"
6. Check logs and email inbox

### Test SMS

1. Navigate to any entity
2. Tap "Send SMS"
3. Enter phone number (format: +1XXXXXXXXXX)
4. Enter message
5. Tap "Send SMS"
6. Check Twilio logs and recipient's phone

### Test Teams

1. Get your Teams channel ID:
   - Open Teams in browser
   - Navigate to channel
   - Copy IDs from URL
2. Update TeamsChat component with IDs
3. Send test message
4. Check Teams channel

## Common Issues

### "Network request failed"

- Check API is running on correct port
- Update `REACT_APP_API_URL` in mobile app config
- Check CORS settings in API

### "Failed to send email"

- Verify Microsoft Graph credentials
- Check user has `Mail.Send` permission
- Verify `OUTLOOK_DEFAULT_USER_EMAIL` is valid

### "Failed to send SMS"

- Verify Twilio credentials
- Check phone number format (+1XXXXXXXXXX)
- Verify Twilio account has balance
- Check phone number is SMS-enabled

### "Teams message not appearing"

- Verify team and channel IDs are correct
- Check user has access to channel
- Verify Microsoft Graph Teams permissions

### Images not attaching

- Check camera/photo library permissions
- Verify iOS Info.plist has usage descriptions
- Check Android permissions in manifest

## Development Tips

### Enable Debug Mode

Set in mobile app:

```typescript
// In MessagingService.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Sending email:', request);
}
```

### Test Offline Mode

1. Enable Airplane Mode on device
2. Send a message (should be queued)
3. Disable Airplane Mode
4. Message should send automatically

### View Message Queue

```typescript
import { MessagingService } from './services/MessagingService';

const service = new MessagingService();
const queue = await service.getQueue(); // Private, add public method
console.log('Queued messages:', queue);
```

### Monitor Twilio

View SMS logs:
1. Go to [Twilio Console](https://console.twilio.com)
2. Monitor → Logs → Messaging
3. View delivery status for each message

### Monitor Microsoft Graph

Enable logging:

```typescript
// In MessagingService.ts
const response = await fetch(url, {
  // ... config
});

console.log('Graph API Response:', await response.json());
```

## Next Steps

1. Customize templates for your use case
2. Add custom template categories
3. Implement push notifications for new messages
4. Add message search functionality
5. Implement conversation threading
6. Add rich text editor
7. Implement scheduled messages

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] API requires authentication for all endpoints
- [ ] Users have proper permissions (communication:send:global)
- [ ] Phone numbers are validated before sending SMS
- [ ] Email addresses are validated before sending
- [ ] File attachments are virus-scanned (if applicable)
- [ ] Rate limiting is enabled on API
- [ ] HTTPS is used in production

## Production Deployment

Before deploying to production:

1. Update `REACT_APP_API_URL` to production URL
2. Enable SSL/TLS on API server
3. Configure proper CORS origins
4. Set up proper logging and monitoring
5. Configure push notifications
6. Set up error tracking (Sentry, etc.)
7. Enable Microsoft Graph webhook subscriptions
8. Configure Twilio status callbacks

## Support

For help:
- Check [MOBILE_MESSAGING_SYSTEM.md](./MOBILE_MESSAGING_SYSTEM.md) for detailed docs
- Review API logs in Application Insights
- Check Twilio logs for SMS delivery
- Review Microsoft Graph API responses
- Contact development team

---

Last updated: 2024-11-17
