# API v2 Migration Guide

## Overview

API v2 introduces several improvements for security, performance, and developer experience. This guide helps you migrate from v1 to v2.

**Important Dates:**
- **v1 Deprecation:** December 9, 2025
- **v1 Sunset (Removal):** June 1, 2026 (6 months notice)

## Breaking Changes

### 1. Authentication

**v1:** Session cookies or custom auth headers
```typescript
// v1
fetch('/api/v1/vehicles', {
  credentials: 'include', // Session cookie
  headers: {
    'X-Auth-Token': 'legacy-token'
  }
})
```

**v2:** JWT Bearer tokens only
```typescript
// v2
fetch('/api/v2/vehicles', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
```

**Migration:** Update your authentication to use JWT tokens from `/api/v2/auth/login`.

---

### 2. Date Formats

**v1:** Mixed formats (timestamps, custom strings)
```json
{
  "createdAt": "2025-12-09 10:30:00",
  "updatedAt": 1733740200000
}
```

**v2:** ISO 8601 format everywhere
```json
{
  "createdAt": "2025-12-09T10:30:00.000Z",
  "updatedAt": "2025-12-09T15:43:20.000Z"
}
```

**Migration:** Update date parsing to handle ISO 8601 strings.

---

### 3. Error Responses

**v1:** Custom error format
```json
{
  "error": "Vehicle not found"
}
```

**v2:** RFC 7807 Problem Details
```json
{
  "type": "https://fleet.example.com/errors/not-found",
  "title": "Vehicle Not Found",
  "status": 404,
  "detail": "Vehicle with ID 12345 does not exist",
  "instance": "/api/v2/vehicles/12345",
  "traceId": "abc-123-def-456"
}
```

**Migration:** Update error handling to parse RFC 7807 format.

---

### 4. Pagination

**v1:** Page-based pagination
```
GET /api/v1/vehicles?page=2&limit=20
```

**v2:** Cursor-based pagination (more efficient)
```
GET /api/v2/vehicles?cursor=eyJpZCI6MTAwfQ&limit=20
```

Response includes `next_cursor`:
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "next_cursor": "eyJpZCI6MTIwfQ",
    "has_more": true
  }
}
```

**Migration:** Update pagination logic to use cursors instead of page numbers.

---

## New Features in v2

### 1. GraphQL Support

v2 adds a GraphQL endpoint for flexible querying:

```graphql
query GetVehicleWithDriver($id: ID!) {
  vehicle(id: $id) {
    id
    make
    model
    vin
    currentDriver {
      id
      name
      email
    }
    recentMaintenance(limit: 5) {
      id
      type
      date
      cost
    }
  }
}
```

GraphQL endpoint: `POST /api/v2/graphql`

---

### 2. Batch Operations

v2 supports batch requests to reduce round-trips:

```typescript
POST /api/v2/batch

{
  "requests": [
    { "method": "GET", "url": "/api/v2/vehicles/123" },
    { "method": "GET", "url": "/api/v2/drivers/456" },
    { "method": "POST", "url": "/api/v2/maintenance", "body": {...} }
  ]
}

// Response
{
  "responses": [
    { "status": 200, "body": {...} },
    { "status": 200, "body": {...} },
    { "status": 201, "body": {...} }
  ]
}
```

---

### 3. Async Report Generation

**v1:** Synchronous (blocks for large reports)
```typescript
GET /api/v1/reports/fleet-summary
// Waits 30+ seconds for large fleets
```

**v2:** Asynchronous with webhooks
```typescript
POST /api/v2/reports/fleet-summary
{
  "format": "pdf",
  "webhook_url": "https://your-app.com/webhooks/reports"
}

// Immediate response
{
  "report_id": "rpt_abc123",
  "status": "processing",
  "estimated_completion": "2025-12-09T10:35:00Z"
}

// Poll status
GET /api/v2/reports/rpt_abc123
{
  "report_id": "rpt_abc123",
  "status": "completed",
  "download_url": "https://storage.example.com/reports/rpt_abc123.pdf"
}
```

---

### 4. Enhanced Telemetry Streaming

v2 adds WebSocket support for real-time vehicle telemetry:

```typescript
const ws = new WebSocket('wss://fleet.example.com/api/v2/telemetry/stream');

ws.send(JSON.stringify({
  action: 'subscribe',
  vehicle_ids: [123, 456, 789]
}));

ws.onmessage = (event) => {
  const telemetry = JSON.parse(event.data);
  // { vehicle_id: 123, speed: 65, lat: 40.7128, lng: -74.0060, ... }
};
```

---

## Version Negotiation

You can specify the API version in multiple ways:

### 1. URL Path (Recommended)
```
GET /api/v2/vehicles
```

### 2. API-Version Header
```
GET /api/vehicles
API-Version: v2
```

### 3. Accept Header (Content Negotiation)
```
GET /api/vehicles
Accept: application/vnd.fleet.v2+json
```

### 4. Query Parameter
```
GET /api/vehicles?version=v2
```

**Priority:** URL > Header > Accept > Query > Default (v1)

---

## Deprecation Headers

When using v1, the API returns deprecation headers:

```
Sunset: Mon, 01 Jun 2026 00:00:00 GMT
Warning: 299 - "API v1 is deprecated and will be removed on 2026-06-01. Please migrate to v2. See: /docs/api/v2-migration-guide"
X-API-Deprecation-Info: {"version":"v1","sunset":"2026-06-01T00:00:00.000Z","daysRemaining":174,"message":"..."}
```

Monitor these headers to track deprecation timelines.

---

## Testing Strategy

### 1. Parallel Testing
Run v1 and v2 in parallel during migration:

```typescript
// Dual-version testing
const v1Response = await fetch('/api/v1/vehicles/123');
const v2Response = await fetch('/api/v2/vehicles/123');

// Compare responses
assert.deepEqual(normalizeV1(v1Response), v2Response);
```

### 2. Canary Deployment
Gradually shift traffic from v1 to v2:
- Week 1: 10% v2
- Week 2: 25% v2
- Week 3: 50% v2
- Week 4: 100% v2

### 3. Backward Compatibility Testing
Ensure v2 doesn't break existing integrations:

```typescript
describe('v2 compatibility', () => {
  it('should support v1 authentication for 6 months', async () => {
    const response = await fetch('/api/v2/vehicles', {
      headers: { 'X-Auth-Token': 'legacy-token' }
    });
    expect(response.status).toBe(200);
  });
});
```

---

## Support & Resources

- **v2 API Documentation:** `/docs/api/v2`
- **Breaking Changes Log:** `/docs/api/v2/breaking-changes`
- **Migration Support:** fleetapi-support@capitaltechalliance.com
- **Slack Channel:** #fleet-api-v2-migration

---

## Timeline

| Date | Milestone |
|------|-----------|
| Dec 9, 2025 | v2 GA release, v1 deprecated |
| Feb 1, 2026 | v1 usage drops below 50% |
| Apr 1, 2026 | v1 usage drops below 10% |
| **Jun 1, 2026** | **v1 sunset (removed)** |

---

## FAQ

**Q: Can I use both v1 and v2 simultaneously?**
A: Yes, during the 6-month transition period.

**Q: Will v1 endpoints continue to receive bug fixes?**
A: Critical security fixes only. New features are v2-only.

**Q: What happens if I don't migrate by June 1, 2026?**
A: v1 endpoints will return HTTP 410 Gone.

**Q: Is there a breaking change between minor versions (e.g., v2.1 to v2.2)?**
A: No. Only major versions (v1 → v2) have breaking changes.

---

**Last Updated:** December 9, 2025
