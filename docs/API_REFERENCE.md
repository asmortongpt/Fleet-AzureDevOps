# CTAFleet API Reference - v1

Base URL: `http://your-domain.com/api/v1`

## Authentication

All endpoints require authentication via JWT bearer token:

```
Authorization: Bearer <your-token>
```

## Telematics Endpoints

### Get Asset Location

Get the latest GPS location for an asset.

```http
GET /api/v1/assets/:assetId/location
```

**Response:**
```json
{
  "data": {
    "assetId": "uuid",
    "latitude": 30.4383,
    "longitude": -84.2807,
    "speed": 45.5,
    "heading": 270,
    "timestamp": "2026-01-08T16:30:00Z"
  }
}
```

### Get Position History

Get historical GPS positions for an asset.

```http
GET /api/v1/assets/:assetId/position-history
```

**Query Parameters:**
- `start` (optional): ISO 8601 datetime
- `end` (optional): ISO 8601 datetime
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 100, max: 1000)

## Safety Endpoints

### Get Driver Safety Score

Get the latest safety score for a driver.

```http
GET /api/v1/drivers/:driverId/safety-score
```

**Response:**
```json
{
  "data": {
    "driverId": "uuid",
    "score": 85,
    "grade": "B",
    "riskLevel": "low",
    "totalEvents": 12,
    "periodStart": "2026-01-01T00:00:00Z",
    "periodEnd": "2026-01-07T23:59:59Z"
  }
}
```

### Get Behavior Events

Get behavior events for a driver.

```http
GET /api/v1/drivers/:driverId/behavior-events
```

**Query Parameters:**
- `start` (optional): ISO 8601 datetime
- `end` (optional): ISO 8601 datetime

## Analytics Endpoints

### Get Cost Per Mile

Calculate CPM for an asset over a period.

```http
GET /api/v1/analytics/costs/cpm
```

**Query Parameters:**
- `assetId` (required): Asset UUID
- `start` (optional): Period start date
- `end` (optional): Period end date

**Response:**
```json
{
  "data": {
    "assetId": "uuid",
    "cpm": 0.45,
    "totalCost": 1250.00,
    "milesDriven": 2777.78,
    "breakdown": {
      "fuel": 800.00,
      "maintenance": 350.00,
      "labor": 100.00
    }
  }
}
```

### Get Total Cost of Ownership

Calculate lifetime TCO for an asset.

```http
GET /api/v1/analytics/costs/tco?assetId=:id
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
