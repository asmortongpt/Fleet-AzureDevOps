# Microsoft Graph Service - Documentation for Integration Agents

## Overview

This directory contains the core Microsoft Graph service infrastructure that provides production-ready integration with Microsoft 365 services (Teams, Outlook, Calendar, OneDrive, etc.).

## Files Created

### 1. `/home/user/Fleet/api/src/types/microsoft-graph.types.ts`
Comprehensive TypeScript type definitions for:
- OAuth token responses and cached tokens
- Microsoft Graph entities (Users, Teams, Channels, Messages, Calendar Events, Emails)
- Error types (MicrosoftGraphError, RateLimitError, TokenError)
- Request/response types
- Permission scopes enum

### 2. `/home/user/Fleet/api/src/config/microsoft-graph.config.ts`
Configuration and constants:
- API endpoints (base URLs, common endpoints)
- Retry policies (default, aggressive, conservative)
- Scopes for different operations
- Rate limiting configuration
- Error code mappings
- Helper functions for building auth URLs

### 3. `/home/user/Fleet/api/src/services/microsoft-graph.service.ts`
Main service implementation with:
- **Singleton pattern** for service instance
- **Token management** with LRU cache (up to 1000 tokens)
- **Automatic token refresh** (5-minute expiration buffer)
- **Retry logic** with exponential backoff and jitter
- **Rate limiting handling** (429 responses)
- **Both delegated and application permissions** support
- **Graph Client instances** (from @microsoft/microsoft-graph-client)
- **Batch request** support
- **Pagination** support

### 4. `/home/user/Fleet/api/src/utils/microsoft-graph-integration.ts`
Helper utilities for easy integration

## How to Use

### For Application-Level Operations (App-Only Access)

```typescript
import { microsoftGraphService } from '../services/microsoft-graph.service'

// Get application client
const client = await microsoftGraphService.getClientForApp()

// Or make direct requests
const users = await microsoftGraphService.makeGraphRequest('/users', 'GET')
```

### For User-Specific Operations (Delegated Access)

```typescript
import { microsoftGraphService } from '../services/microsoft-graph.service'

// Store user token (from OAuth callback)
microsoftGraphService.storeUserToken(userId, tenantId, tokenResponse)

// Get user-specific client
const client = await microsoftGraphService.getClientForUser(userId, tenantId)

// Or make direct requests
const events = await microsoftGraphService.makeGraphRequestForUser(
  userId,
  tenantId,
  '/me/events',
  'GET'
)
```

### Using the Helper Utilities

```typescript
import {
  getUserGraphClient,
  makeUserGraphRequest,
  storeUserGraphToken
} from '../utils/microsoft-graph-integration'

// In your OAuth callback
await storeUserGraphToken(userId, tenantId, tokenResponse)

// Make requests
const profile = await makeUserGraphRequest(userId, tenantId, '/me', 'GET')
```

## Integration with Existing Auth

The existing Microsoft auth flow at `/home/user/Fleet/api/src/routes/microsoft-auth.ts` handles OAuth callbacks and user authentication. You should integrate the Graph service as follows:

```typescript
// In microsoft-auth.ts, after receiving tokens:
import { microsoftGraphService } from '../services/microsoft-graph.service'

// Store the tokens in the Graph service
microsoftGraphService.storeUserToken(
  user.id.toString(),
  user.tenant_id.toString(),
  {
    access_token: access_token,
    token_type: 'Bearer',
    expires_in: 3600, // from response
    scope: 'openid profile email User.Read',
    refresh_token: refresh_token // if available
  }
)
```

## Environment Variables

The service uses these environment variables (already configured):
- `AZURE_AD_CLIENT_ID` or `MICROSOFT_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET` or `MICROSOFT_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID` or `MICROSOFT_TENANT_ID`
- `AZURE_AD_REDIRECT_URI` or `MICROSOFT_REDIRECT_URI` (optional)

## Key Features

### 1. Automatic Token Management
- Tokens are cached in memory with LRU eviction
- Automatic expiration checking (5-minute buffer)
- Supports up to 1000 cached tokens
- Thread-safe token operations

### 2. Retry Logic
- Exponential backoff with jitter
- Configurable retry policies
- Automatic retry on transient errors (408, 429, 500, 502, 503, 504)
- Special handling for rate limits (429)

### 3. Error Handling
- Custom error types for better debugging
- Structured error responses
- Request ID tracking
- Comprehensive logging

### 4. Rate Limiting
- Automatic detection of 429 responses
- Respects `Retry-After` header
- Configurable backoff strategies

### 5. Pagination Support
```typescript
// Automatically fetch all pages
const allEvents = await microsoftGraphService.getPaginatedResults(
  '/me/events',
  10 // max pages
)
```

### 6. Batch Requests
```typescript
const batchRequests = [
  { id: '1', method: 'GET', url: '/me' },
  { id: '2', method: 'GET', url: '/me/events' }
]
const results = await microsoftGraphService.executeBatch(batchRequests)
```

## Common Endpoints (from config)

All common endpoints are available in `GRAPH_ENDPOINTS`:

```typescript
import { GRAPH_ENDPOINTS } from '../config/microsoft-graph.config'

// Calendar
GRAPH_ENDPOINTS.MY_EVENTS // '/me/events'
GRAPH_ENDPOINTS.MY_CALENDAR_VIEW // '/me/calendarView'

// Mail
GRAPH_ENDPOINTS.MY_MESSAGES // '/me/messages'
GRAPH_ENDPOINTS.SEND_MAIL // '/me/sendMail'

// Teams
GRAPH_ENDPOINTS.MY_TEAMS // '/me/joinedTeams'
GRAPH_ENDPOINTS.TEAM_CHANNELS(teamId) // '/teams/{teamId}/channels'
GRAPH_ENDPOINTS.CHANNEL_MESSAGES(teamId, channelId)

// Files
GRAPH_ENDPOINTS.MY_DRIVE // '/me/drive'
GRAPH_ENDPOINTS.MY_DRIVE_CHILDREN // '/me/drive/root/children'
```

## Scopes (from config)

Predefined scope collections in `GRAPH_SCOPES`:

```typescript
import { GRAPH_SCOPES } from '../config/microsoft-graph.config'

GRAPH_SCOPES.USER_BASIC // ['User.Read', 'openid', 'profile', 'email']
GRAPH_SCOPES.CALENDAR_READ // ['User.Read', 'Calendars.Read']
GRAPH_SCOPES.MAIL_SEND // ['User.Read', 'Mail.Read', 'Mail.Send']
GRAPH_SCOPES.TEAMS_WRITE // ['User.Read', 'Team.ReadBasic.All', ...]
```

## Error Types

```typescript
import {
  MicrosoftGraphError,
  RateLimitError,
  TokenError
} from '../types/microsoft-graph.types'

try {
  await microsoftGraphService.makeGraphRequest(endpoint)
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter)
  } else if (error instanceof TokenError) {
    console.log('Auth error:', error.code)
  } else if (error instanceof MicrosoftGraphError) {
    console.log('Graph error:', error.code, error.statusCode)
  }
}
```

## For Other Agents

### Teams Integration Agent
- Use `GRAPH_ENDPOINTS.MY_TEAMS`, `TEAM_CHANNELS`, `CHANNEL_MESSAGES`
- Use `GRAPH_SCOPES.TEAMS_WRITE` for required permissions
- Types: `TeamsTeam`, `TeamsChannel`, `TeamsMessage`

### Calendar Integration Agent
- Use `GRAPH_ENDPOINTS.MY_EVENTS`, `MY_CALENDAR_VIEW`
- Use `GRAPH_SCOPES.CALENDAR_WRITE` for required permissions
- Types: `OutlookEvent`, `OutlookCalendar`, `OutlookAttendee`

### Email Integration Agent
- Use `GRAPH_ENDPOINTS.MY_MESSAGES`, `SEND_MAIL`
- Use `GRAPH_SCOPES.MAIL_FULL` for required permissions
- Types: `OutlookMessage`

### OneDrive/Files Agent
- Use `GRAPH_ENDPOINTS.MY_DRIVE`, `MY_DRIVE_CHILDREN`
- Use `GRAPH_SCOPES.FILES_WRITE` for required permissions

## Monitoring and Debugging

```typescript
// Check service configuration
const status = microsoftGraphService.getConfigStatus()
console.log('Configured:', status.configured)
console.log('Missing:', status.missing)

// Get cache statistics
const stats = microsoftGraphService.getCacheStats()
console.log('Cached tokens:', stats.size, '/', stats.maxSize)

// Clear caches (for testing)
microsoftGraphService.clearCaches()
```

## Important Notes

1. **Token Storage**: Currently uses in-memory storage. For production with multiple server instances, consider migrating to Redis (infrastructure is ready for this).

2. **Refresh Tokens**: The OAuth callback should request `offline_access` scope to receive refresh tokens. Store these in the database for long-term access.

3. **User Logout**: Always call `microsoftGraphService.revokeToken(userId, tenantId)` when users log out.

4. **Error Handling**: All methods can throw `MicrosoftGraphError`, `RateLimitError`, or `TokenError`. Always wrap in try-catch.

5. **Rate Limits**: The service automatically handles rate limits, but you should still be mindful of API quotas.

6. **Logging**: The service logs extensively when `NODE_ENV !== 'production'`. Check logs for debugging.

## Package Dependencies

Required packages (already installed):
- `@microsoft/microsoft-graph-client` (^3.0.7)
- `axios` (^1.13.2)

## Next Steps for Integration Agents

1. **Import the service** in your implementation files
2. **Use the types** from `microsoft-graph.types.ts` for type safety
3. **Use the config** from `microsoft-graph.config.ts` for endpoints and scopes
4. **Handle errors** appropriately using the custom error types
5. **Test with real data** using the configured Azure AD app

## Example: Complete Integration Flow

```typescript
// 1. User authenticates via OAuth (microsoft-auth.ts)
// 2. Store tokens
microsoftGraphService.storeUserToken(userId, tenantId, tokenResponse)

// 3. Use in your service
import { microsoftGraphService } from '../services/microsoft-graph.service'
import { GRAPH_ENDPOINTS } from '../config/microsoft-graph.config'
import { OutlookEvent } from '../types/microsoft-graph.types'

async function getUserCalendarEvents(userId: string, tenantId: string) {
  try {
    const events = await microsoftGraphService.makeGraphRequestForUser<{value: OutlookEvent[]}>(
      userId,
      tenantId,
      GRAPH_ENDPOINTS.MY_EVENTS,
      'GET',
      null,
      { queryParams: { $top: 50, $orderby: 'start/dateTime' } }
    )

    return events.value
  } catch (error) {
    // Handle errors
    throw error
  }
}
```

## Questions?

This infrastructure is production-ready and tested. If you have questions or need additional features:
1. Check the JSDoc comments in the service files
2. Review the type definitions in `microsoft-graph.types.ts`
3. Look at the configuration options in `microsoft-graph.config.ts`
4. Use the helper functions in `microsoft-graph-integration.ts`
