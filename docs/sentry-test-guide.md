# Sentry Error Tracking - Testing Guide

## Overview

Sentry has been fully integrated into the Fleet Management System for comprehensive error tracking. This guide demonstrates how to test the integration.

## Configuration

### Backend Configuration

Add to your `.env` file:
```env
# Sentry Error Tracking (Backend)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=fleet-api@1.0.0
```

### Frontend Configuration

Add to your `.env` file:
```env
# Sentry Error Tracking (Frontend)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_RELEASE=fleet-ui@1.0.0
```

## Testing Backend Error Tracking

### 1. Test Endpoint

When running in development mode, access the test endpoint:

```bash
# Test error capture
curl http://localhost:3001/api/test-sentry

# Test message capture
curl http://localhost:3001/api/test-sentry?type=message
```

### 2. API Error Scenarios

#### 404 Not Found
```bash
curl http://localhost:3001/api/nonexistent-endpoint
```

#### 500 Server Error
Create an intentional database connection error by providing invalid credentials.

#### Validation Error
```bash
curl -X POST http://localhost:3001/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

### 3. Process Errors

#### Unhandled Promise Rejection
Add this temporary test code to any route:
```javascript
router.get('/test-promise', async (req, res) => {
  Promise.reject(new Error('Test unhandled rejection'))
  res.json({ message: 'Check Sentry for error' })
})
```

## Testing Frontend Error Tracking

### 1. Component Errors

#### Test Error Boundary
Add a test button to trigger an error:

```jsx
// In any component
const TestErrorButton = () => {
  const handleError = () => {
    throw new Error('Test error boundary!')
  }

  return (
    <button onClick={handleError}>
      Test Sentry Error
    </button>
  )
}
```

### 2. API Call Errors

The system automatically tracks failed API calls:
```javascript
// This will be tracked if it fails
const response = await fetch('/api/vehicles')
if (!response.ok) {
  // Error is automatically reported to Sentry
}
```

### 3. User Feedback

When an error occurs, users can report feedback:
```javascript
import { showFeedbackWidget } from '@/lib/sentry'

// Show feedback dialog
showFeedbackWidget({
  name: 'User Name',
  email: 'user@example.com'
})
```

### 4. Performance Monitoring

Slow component renders are automatically tracked:
```jsx
import { profileComponent } from '@/lib/sentry'

// Wrap component with profiler
const MyComponent = () => {
  return <div>Content</div>
}

export default React.Profiler(
  'MyComponent',
  profileComponent('MyComponent').onRender
)(MyComponent)
```

## Viewing Errors in Sentry

### Without Sentry Account (Development)

If no DSN is configured, errors are logged to console with full details:

1. **Backend**: Check server console for error logs
2. **Frontend**: Check browser console for error logs

### With Sentry Account

1. Go to [Sentry.io](https://sentry.io)
2. Navigate to your project
3. View errors in the Issues tab
4. Check Performance tab for transaction tracking
5. Review User Feedback for reports

## Error Information Captured

### Backend Errors Include:
- Error message and stack trace
- Request context (URL, method, headers)
- User information (if authenticated)
- Custom breadcrumbs (user actions before error)
- Environment and release version
- Server metrics (memory, uptime)

### Frontend Errors Include:
- Error message and stack trace
- Component stack (for React errors)
- Browser information
- User actions (breadcrumbs)
- Network requests
- Session replay (if enabled)

## Breadcrumb Examples

### Backend Breadcrumbs
```javascript
// Automatically captured:
- HTTP requests
- Database queries
- Console logs
- User authentication events
```

### Frontend Breadcrumbs
```javascript
// Automatically captured:
- User clicks
- Navigation changes
- Console logs
- API calls
- Component lifecycle events
```

## Custom Error Tracking

### Backend Custom Events
```javascript
import { sentryService } from './monitoring/sentry'

// Capture custom exception
sentryService.captureException(new Error('Custom error'), {
  user: { id: '123', email: 'user@example.com' },
  custom: { module: 'vehicles', action: 'update' }
})

// Capture message
sentryService.captureMessage('Important event occurred', 'info')

// Add breadcrumb
sentryService.addBreadcrumb('User action', 'user', {
  action: 'clicked_button',
  target: 'save_vehicle'
})
```

### Frontend Custom Events
```javascript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry'

// Capture exception
try {
  // risky operation
} catch (error) {
  captureException(error, {
    context: { component: 'VehicleForm' }
  })
}

// Track user interaction
addBreadcrumb('Form submitted', 'ui.form', {
  formName: 'vehicle_edit'
})

// Track important events
captureMessage('User completed onboarding', 'info')
```

## Security & Privacy

### Data Filtering

Sensitive data is automatically filtered:
- Passwords
- API keys
- Tokens
- Credit card numbers
- Social security numbers
- Email addresses (configurable)

### Example Filtered Output
```json
{
  "user": {
    "email": "[REDACTED]",
    "password": "[REDACTED]",
    "name": "John Doe"
  }
}
```

## Performance Impact

- **Backend**: Minimal overhead (~1-2ms per request)
- **Frontend**: Lightweight integration (~30KB gzipped)
- **Sampling**: Production uses 10% sample rate for performance data
- **Breadcrumbs**: Limited to 100 entries (FIFO)

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN configuration in `.env`
2. Verify environment variables are loaded
3. Check console for initialization messages
4. Ensure error is not filtered (check ignoreErrors config)

### Too Many Errors

1. Adjust sample rate in configuration
2. Filter client-side errors (4xx)
3. Ignore browser extension errors
4. Set up alert rules in Sentry dashboard

### Performance Issues

1. Reduce tracesSampleRate in production
2. Disable session replay if not needed
3. Limit breadcrumb categories
4. Use error sampling for high-traffic apps

## Best Practices

1. **Use Environment Variables**: Never commit DSN to source control
2. **Set Release Versions**: Track which version caused errors
3. **Add Context**: Include user and custom context for debugging
4. **Monitor Performance**: Use transaction tracking for slow endpoints
5. **Review Regularly**: Check Sentry dashboard weekly
6. **Set Up Alerts**: Configure alerts for critical errors
7. **Clean Up**: Resolve or ignore irrelevant errors

## Summary

Sentry integration provides:
- ✅ Automatic error capture
- ✅ User feedback collection
- ✅ Performance monitoring
- ✅ Session replay
- ✅ Custom event tracking
- ✅ Secure data filtering
- ✅ Real-time alerts

The system is now ready to track and report errors in both development and production environments.