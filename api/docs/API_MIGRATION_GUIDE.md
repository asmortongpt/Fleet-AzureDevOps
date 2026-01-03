# API Migration Guide: Transition to Versioned Endpoints

**Last Updated:** November 20, 2025
**Effective Date:** November 20, 2025
**Sunset Date for Legacy Routes:** June 1, 2026

## Overview

The Fleet Management API has been upgraded to include comprehensive API versioning. All endpoints now use the `/api/v1/` prefix to ensure long-term stability and enable future API enhancements without breaking existing integrations.

## What's Changing

### Before (Legacy - Deprecated)
```
GET /api/vehicles
POST /api/drivers
PUT /api/work-orders/{id}
```

### After (Current - v1)
```
GET /api/v1/vehicles
POST /api/v1/drivers
PUT /api/v1/work-orders/{id}
```

## Migration Timeline

| Date | Phase | Action |
|------|-------|--------|
| **Nov 20, 2025** | Launch | v1 endpoints available |
| **Nov 20, 2025 - Jun 1, 2026** | Transition Period | Both legacy and v1 endpoints work (legacy redirects) |
| **Jun 1, 2026** | Sunset | Legacy unversioned endpoints removed |

## Breaking Changes

**None** - This is a non-breaking change during the transition period. Legacy routes will automatically redirect to v1 with a 307 status code.

## Quick Migration Checklist

- [ ] Update all API base URLs from `/api/` to `/api/v1/`
- [ ] Test all endpoints in development/staging
- [ ] Update API documentation
- [ ] Update environment variables/configuration
- [ ] Monitor deprecation warnings in response headers
- [ ] Deploy updated clients before June 1, 2026

## Detailed Migration Instructions

### 1. Update API Client Configuration

#### JavaScript/TypeScript
```typescript
// Before
const API_BASE_URL = 'https://api.fleet.example.com/api';

// After
const API_BASE_URL = 'https://api.fleet.example.com/api/v1';
```

#### Python
```python
# Before
API_BASE_URL = "https://api.fleet.example.com/api"

# After
API_BASE_URL = "https://api.fleet.example.com/api/v1"
```

#### cURL
```bash
# Before
curl https://api.fleet.example.com/api/vehicles

# After
curl https://api.fleet.example.com/api/v1/vehicles
```

### 2. Update Environment Variables

```bash
# .env file
# Before
API_URL=https://api.fleet.example.com/api

# After
API_URL=https://api.fleet.example.com/api/v1
```

### 3. Route Mapping Table

All routes have been migrated. Here's a comprehensive mapping:

| Legacy Route | New v1 Route | Category |
|-------------|-------------|----------|
| `/api/auth/*` | `/api/v1/auth/*` | Authentication |
| `/api/vehicles` | `/api/v1/vehicles` | Core Fleet |
| `/api/drivers` | `/api/v1/drivers` | Core Fleet |
| `/api/work-orders` | `/api/v1/work-orders` | Core Fleet |
| `/api/maintenance-schedules` | `/api/v1/maintenance-schedules` | Core Fleet |
| `/api/fuel-transactions` | `/api/v1/fuel-transactions` | Core Fleet |
| `/api/routes` | `/api/v1/routes` | Core Fleet |
| `/api/geofences` | `/api/v1/geofences` | Core Fleet |
| `/api/inspections` | `/api/v1/inspections` | Core Fleet |
| `/api/damage-reports` | `/api/v1/damage-reports` | Core Fleet |
| `/api/safety-incidents` | `/api/v1/safety-incidents` | Core Fleet |
| `/api/video-events` | `/api/v1/video-events` | Core Fleet |
| `/api/charging-stations` | `/api/v1/charging-stations` | EV Management |
| `/api/charging-sessions` | `/api/v1/charging-sessions` | EV Management |
| `/api/ev` | `/api/v1/ev` | EV Management |
| `/api/purchase-orders` | `/api/v1/purchase-orders` | Financial |
| `/api/mileage-reimbursement` | `/api/v1/mileage-reimbursement` | Financial |
| `/api/trip-usage` | `/api/v1/trip-usage` | Financial |
| `/api/trips` | `/api/v1/trips` | Financial |
| `/api/personal-use-policies` | `/api/v1/personal-use-policies` | Financial |
| `/api/personal-use-charges` | `/api/v1/personal-use-charges` | Financial |
| `/api/reimbursements` | `/api/v1/reimbursements` | Financial |
| `/api/billing-reports` | `/api/v1/billing-reports` | Financial |
| `/api/communication-logs` | `/api/v1/communication-logs` | Communication |
| `/api/policies` | `/api/v1/policies` | Communication |
| `/api/communications` | `/api/v1/communications` | Communication |
| `/api/policy-templates` | `/api/v1/policy-templates` | Communication |
| `/api/facilities` | `/api/v1/facilities` | Organization |
| `/api/vendors` | `/api/v1/vendors` | Organization |
| `/api/telemetry` | `/api/v1/telemetry` | Telematics |
| `/api/telematics` | `/api/v1/telematics` | Telematics |
| `/api/smartcar` | `/api/v1/smartcar` | Telematics |
| `/api/video` | `/api/v1/video` | Telematics |
| `/api/arcgis-layers` | `/api/v1/arcgis-layers` | Geospatial |
| `/api/traffic-cameras` | `/api/v1/traffic-cameras` | Geospatial |
| `/api/dispatch` | `/api/v1/dispatch` | Dispatch |
| `/api/route-optimization` | `/api/v1/route-optimization` | Dispatch |
| `/api/mobile/*` | `/api/v1/mobile/*` | Mobile |
| `/api/damage` | `/api/v1/damage` | Assessment |
| `/api/emulator` | `/api/v1/emulator` | Testing |
| `/api/quality-gates` | `/api/v1/quality-gates` | DevOps |
| `/api/deployments` | `/api/v1/deployments` | DevOps |
| `/api/osha-compliance` | `/api/v1/osha-compliance` | Enterprise |
| `/api/documents` | `/api/v1/documents` | Documents |
| `/api/fleet-documents` | `/api/v1/fleet-documents` | Documents |
| `/api/attachments` | `/api/v1/attachments` | Documents |
| `/api/task-management` | `/api/v1/task-management` | Task Management |
| `/api/asset-management` | `/api/v1/asset-management` | Asset Management |
| `/api/asset-relationships` | `/api/v1/asset-relationships` | Asset Management |
| `/api/ai` | `/api/v1/ai` | AI Features |
| `/api/teams` | `/api/v1/teams` | Microsoft 365 |
| `/api/outlook` | `/api/v1/outlook` | Microsoft 365 |
| `/api/sync` | `/api/v1/sync` | Microsoft 365 |
| `/api/cards` | `/api/v1/cards` | Microsoft 365 |
| `/api/calendar` | `/api/v1/calendar` | Microsoft 365 |
| `/api/presence` | `/api/v1/presence` | Microsoft 365 |
| `/api/scheduling` | `/api/v1/scheduling` | Microsoft 365 |
| `/api/scheduling-notifications` | `/api/v1/scheduling-notifications` | Microsoft 365 |
| `/api/permissions` | `/api/v1/permissions` | Security |
| `/api/break-glass` | `/api/v1/break-glass` | Security |
| `/api/monitoring/query-performance` | `/api/v1/monitoring/query-performance` | Monitoring |

### 4. Exception: Webhook Endpoints

**Webhook endpoints remain unversioned** because they are validated by external services (Microsoft Teams, Outlook).

These endpoints do **NOT** change:
- `/api/webhooks/teams`
- `/api/webhooks/outlook`

### 5. Detecting Deprecation in Your Code

During the transition period, legacy endpoints will return deprecation headers:

```http
HTTP/1.1 307 Temporary Redirect
X-API-Deprecation: This endpoint is deprecated. Please use /api/v1/* instead
Location: /api/v1/vehicles
Content-Type: application/json

{
  "message": "This endpoint has moved to /api/v1/vehicles",
  "redirectTo": "/api/v1/vehicles",
  "hint": "Update your API client to use /api/v1/* endpoints"
}
```

## Testing Your Migration

### 1. Test in Development
```bash
# Verify v1 endpoint works
curl -X GET https://dev.api.fleet.example.com/api/v1/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify legacy redirect works
curl -X GET https://dev.api.fleet.example.com/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -i  # Include headers to see deprecation warnings
```

### 2. Check for Deprecation Warnings

Monitor your application logs for:
- `X-API-Deprecation` headers
- `307 Temporary Redirect` responses
- Deprecation warnings in API responses

### 3. Update Tests

Update your integration tests to use v1 endpoints:

```javascript
// Before
describe('Vehicles API', () => {
  it('should list vehicles', async () => {
    const response = await request(app).get('/api/vehicles');
    expect(response.status).toBe(200);
  });
});

// After
describe('Vehicles API', () => {
  it('should list vehicles', async () => {
    const response = await request(app).get('/api/v1/vehicles');
    expect(response.status).toBe(200);
  });
});
```

## API Version Detection

The API supports three methods for specifying the version:

### 1. URL Path (Recommended)
```bash
GET /api/v1/vehicles
```

### 2. Accept-Version Header
```bash
curl -X GET https://api.fleet.example.com/api/vehicles \
  -H "Accept-Version: v1"
```

### 3. Query Parameter
```bash
GET /api/vehicles?version=v1
```

**Recommendation:** Use URL path versioning for clarity and cacheability.

## New Features with Versioning

### Version Information Endpoint

Get information about supported API versions:

```bash
GET /api/version
```

Response:
```json
{
  "currentVersion": "v1",
  "supportedVersions": [
    {
      "version": "v1",
      "deprecated": false,
      "releaseDate": "2025-01-01T00:00:00.000Z",
      "description": "Initial stable API version"
    }
  ],
  "deprecatedVersions": [],
  "documentation": "/api/docs",
  "changelog": "/api/docs/changelog"
}
```

### API Documentation

Updated Swagger/OpenAPI documentation:
```
https://api.fleet.example.com/api/docs
```

## Common Migration Issues

### Issue 1: Hardcoded URLs in Code

**Problem:** URLs hardcoded throughout codebase
**Solution:** Use environment variables or configuration constants

```javascript
// Bad
const url = 'https://api.fleet.example.com/api/vehicles';

// Good
const API_BASE = process.env.API_BASE_URL;
const url = `${API_BASE}/vehicles`;
```

### Issue 2: Mobile App Updates

**Problem:** Mobile apps with hardcoded endpoints
**Solution:** Implement dynamic configuration or force update

```javascript
// iOS/Android - Use remote config
const apiBase = await RemoteConfig.getValue('api_base_url');
// Or force minimum app version that includes v1 endpoints
```

### Issue 3: Third-Party Integrations

**Problem:** External systems using our API
**Solution:** Notify integration partners and provide migration timeline

## Support and Resources

### Documentation
- Swagger/OpenAPI: `https://api.fleet.example.com/api/docs`
- API Reference: `https://docs.fleet.example.com/api/reference`
- Migration Guide: This document

### Testing
- Development Environment: `https://dev.api.fleet.example.com`
- Staging Environment: `https://staging.api.fleet.example.com`

### Support Channels
- Email: api-support@fleet.example.com
- Slack: #api-support
- GitHub Issues: https://github.com/fleet/api/issues

## FAQs

### Q: Do I need to migrate immediately?
**A:** No, legacy endpoints will work until June 1, 2026. However, we recommend migrating as soon as possible.

### Q: Will v1 endpoints change?
**A:** No, v1 endpoints are stable and will not change. This is the benefit of versioning.

### Q: What happens after June 1, 2026?
**A:** Legacy unversioned endpoints will return 404 errors. Only v1 (and future versions) will work.

### Q: How do I know if I'm using legacy endpoints?
**A:** Check response headers for `X-API-Deprecation` or monitor for 307 redirects.

### Q: Will authentication change?
**A:** No, authentication remains the same. Just update endpoints from `/api/auth` to `/api/v1/auth`.

### Q: What about webhooks?
**A:** Webhook endpoints (`/api/webhooks/*`) remain unversioned as they're validated by external services.

### Q: Can I use multiple versions simultaneously?
**A:** Yes, but it's not recommended. Migrate all clients to v1 for consistency.

### Q: Will future versions (v2, v3) break my integration?
**A:** No, v1 endpoints will continue to work. You can upgrade to newer versions at your own pace.

## Conclusion

API versioning provides long-term stability and enables us to improve the API without breaking your integrations. The migration is straightforward - simply update your base URL from `/api/` to `/api/v1/`.

**Key Takeaways:**
✅ v1 endpoints available now
✅ Legacy endpoints redirect until June 1, 2026
✅ Non-breaking change during transition
✅ Simple migration: update base URL
✅ Better stability and future-proofing

**Next Steps:**
1. Update your API client configuration
2. Test in development
3. Deploy to production before June 1, 2026
4. Monitor for deprecation warnings

For questions or assistance, contact api-support@fleet.example.com.

---

**Document Version:** 1.0
**Last Updated:** November 20, 2025
**Maintained By:** Fleet API Team
