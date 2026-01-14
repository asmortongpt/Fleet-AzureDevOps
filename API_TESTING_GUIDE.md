# API Testing Guide - Role-Based Dashboard Endpoints

## Quick Start

### Prerequisites

```bash
# 1. Start PostgreSQL database
# 2. Start API server
cd /Users/andrewmorton/Documents/GitHub/Fleet-AzureDevOps/api
npm run dev

# 3. Create test users
psql $DATABASE_URL -f src/db/seeds/create-test-users.sql
```

---

## Authentication

### Login and Get Token

```bash
# Fleet Manager
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fleet.manager@test.com","password":"Test123!"}' \
  | jq -r '.token'

# Driver
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"Test123!"}' \
  | jq -r '.token'

# Save token to environment variable
export FLEET_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fleet.manager@test.com","password":"Test123!"}' | jq -r '.token')

export DRIVER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"Test123!"}' | jq -r '.token')
```

---

## Endpoint Tests

### 1. GET /api/dashboard/maintenance/alerts

**Expected:** Overdue and upcoming maintenance

```bash
curl -X GET http://localhost:3000/api/dashboard/maintenance/alerts \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
{
  "overdue_count": 2,
  "upcoming_count": 2,
  "open_work_orders": 0,
  "overdue": [
    {
      "id": 1,
      "vehicle_id": 1042,
      "vehicle_name": "1042",
      "type": "Oil Change",
      "days_overdue": 5
    }
  ],
  "upcoming": [...]
}
```

---

### 2. GET /api/dashboard/fleet/stats

**Expected:** Vehicle counts by status

```bash
curl -X GET http://localhost:3000/api/dashboard/fleet/stats \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
{
  "active_vehicles": 1,
  "maintenance_vehicles": 0,
  "idle_vehicles": 0,
  "out_of_service": 0
}
```

---

### 3. GET /api/dashboard/costs/summary

**Expected:** Fuel and maintenance costs with trends

```bash
# Monthly (default)
curl -X GET "http://localhost:3000/api/dashboard/costs/summary?period=monthly" \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  | jq '.'

# Weekly
curl -X GET "http://localhost:3000/api/dashboard/costs/summary?period=weekly" \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  | jq '.'

# Daily
curl -X GET "http://localhost:3000/api/dashboard/costs/summary?period=daily" \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
{
  "fuel_cost": 64,
  "fuel_trend": 0,
  "maintenance_cost": 0,
  "maintenance_trend": 0,
  "cost_per_mile": 0,
  "target_cost_per_mile": 2.10
}
```

---

### 4. GET /api/dashboard/drivers/me/vehicle

**Expected:** Driver's assigned vehicle

```bash
curl -X GET http://localhost:3000/api/dashboard/drivers/me/vehicle \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
{
  "id": 1042,
  "name": "1042",
  "year": 2022,
  "make": "Ford",
  "model": "F-150",
  "fuel_level": 85,
  "mileage": 45230,
  "status": "active",
  "last_inspection": "2025-12-30T00:00:00.000Z"
}
```

---

### 5. GET /api/dashboard/drivers/me/trips/today

**Expected:** Today's trips for driver

```bash
curl -X GET http://localhost:3000/api/dashboard/drivers/me/trips/today \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
[
  {
    "id": 4523,
    "route_name": "Downtown Delivery",
    "origin": "123 Main St",
    "destination": "456 Oak Ave",
    "scheduled_start": "2026-01-14T14:00:00.000Z",
    "scheduled_end": "2026-01-14T16:30:00.000Z",
    "status": "scheduled"
  }
]
```

---

### 6. POST /api/dashboard/inspections

**Expected:** Inspection submitted successfully

```bash
curl -X POST http://localhost:3000/api/dashboard/inspections \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": 1042,
    "inspection_items": [
      {"item": "tire_pressure", "status": "pass"},
      {"item": "fluid_levels", "status": "pass"},
      {"item": "lights_signals", "status": "pass"},
      {"item": "brakes", "status": "pass"},
      {"item": "emergency_equipment", "status": "pass"}
    ],
    "timestamp": "2026-01-14T08:00:00.000Z"
  }' \
  | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "inspection_id": 1234
}
```

---

### 7. POST /api/dashboard/reports/daily

**Expected:** PDF file downloaded

```bash
curl -X POST http://localhost:3000/api/dashboard/reports/daily \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-01-14T00:00:00.000Z"}' \
  --output fleet-report.pdf

# Verify PDF was downloaded
file fleet-report.pdf
```

---

## Error Testing

### Test Unauthorized Access (No Token)

```bash
curl -X GET http://localhost:3000/api/dashboard/maintenance/alerts
```

**Expected:** `401 Unauthorized`

### Test Forbidden Access (Wrong Role)

```bash
# Driver trying to access manager endpoint
curl -X GET http://localhost:3000/api/dashboard/maintenance/alerts \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected:** `403 Forbidden`

### Test Invalid Input

```bash
curl -X POST http://localhost:3000/api/dashboard/inspections \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "invalid"}'
```

**Expected:** `400 Bad Request` with validation errors

---

## Automated Test Script

Save as `test-dashboard-apis.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Dashboard APIs..."
echo ""

# Get tokens
echo "📋 Getting authentication tokens..."
FLEET_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fleet.manager@test.com","password":"Test123!"}' | jq -r '.token')

DRIVER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"Test123!"}' | jq -r '.token')

if [ "$FLEET_TOKEN" == "null" ] || [ -z "$FLEET_TOKEN" ]; then
  echo "❌ Failed to get fleet manager token"
  exit 1
fi

if [ "$DRIVER_TOKEN" == "null" ] || [ -z "$DRIVER_TOKEN" ]; then
  echo "❌ Failed to get driver token"
  exit 1
fi

echo "✅ Tokens obtained successfully"
echo ""

# Test 1: Maintenance Alerts
echo "1️⃣  Testing GET /api/dashboard/maintenance/alerts"
RESPONSE=$(curl -s -X GET http://localhost:3000/api/dashboard/maintenance/alerts \
  -H "Authorization: Bearer $FLEET_TOKEN")
if echo "$RESPONSE" | jq -e '.overdue_count' > /dev/null 2>&1; then
  echo "✅ Maintenance alerts endpoint working"
else
  echo "❌ Maintenance alerts endpoint failed"
  echo "$RESPONSE"
fi
echo ""

# Test 2: Fleet Stats
echo "2️⃣  Testing GET /api/dashboard/fleet/stats"
RESPONSE=$(curl -s -X GET http://localhost:3000/api/dashboard/fleet/stats \
  -H "Authorization: Bearer $FLEET_TOKEN")
if echo "$RESPONSE" | jq -e '.active_vehicles' > /dev/null 2>&1; then
  echo "✅ Fleet stats endpoint working"
else
  echo "❌ Fleet stats endpoint failed"
  echo "$RESPONSE"
fi
echo ""

# Test 3: Cost Summary
echo "3️⃣  Testing GET /api/dashboard/costs/summary"
RESPONSE=$(curl -s -X GET "http://localhost:3000/api/dashboard/costs/summary?period=monthly" \
  -H "Authorization: Bearer $FLEET_TOKEN")
if echo "$RESPONSE" | jq -e '.fuel_cost' > /dev/null 2>&1; then
  echo "✅ Cost summary endpoint working"
else
  echo "❌ Cost summary endpoint failed"
  echo "$RESPONSE"
fi
echo ""

# Test 4: Driver Vehicle
echo "4️⃣  Testing GET /api/dashboard/drivers/me/vehicle"
RESPONSE=$(curl -s -X GET http://localhost:3000/api/dashboard/drivers/me/vehicle \
  -H "Authorization: Bearer $DRIVER_TOKEN")
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  echo "✅ Driver vehicle endpoint working"
else
  echo "❌ Driver vehicle endpoint failed"
  echo "$RESPONSE"
fi
echo ""

# Test 5: Driver Trips
echo "5️⃣  Testing GET /api/dashboard/drivers/me/trips/today"
RESPONSE=$(curl -s -X GET http://localhost:3000/api/dashboard/drivers/me/trips/today \
  -H "Authorization: Bearer $DRIVER_TOKEN")
if echo "$RESPONSE" | jq -e '.[0].id' > /dev/null 2>&1; then
  echo "✅ Driver trips endpoint working"
else
  echo "❌ Driver trips endpoint failed"
  echo "$RESPONSE"
fi
echo ""

# Test 6: Submit Inspection
echo "6️⃣  Testing POST /api/dashboard/inspections"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/dashboard/inspections \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": 1042,
    "inspection_items": [
      {"item": "tire_pressure", "status": "pass"},
      {"item": "fluid_levels", "status": "pass"}
    ],
    "timestamp": "2026-01-14T08:00:00.000Z"
  }')
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Inspections endpoint working"
else
  echo "❌ Inspections endpoint failed"
  echo "$RESPONSE"
fi
echo ""

# Test 7: Daily Report
echo "7️⃣  Testing POST /api/dashboard/reports/daily"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/dashboard/reports/daily \
  -H "Authorization: Bearer $FLEET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-01-14T00:00:00.000Z"}')
if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Daily report endpoint working"
else
  echo "❌ Daily report endpoint failed (HTTP $HTTP_CODE)"
fi
echo ""

echo "🎉 All tests complete!"
```

Make executable and run:

```bash
chmod +x test-dashboard-apis.sh
./test-dashboard-apis.sh
```

---

## Performance Testing

### Apache Bench

```bash
# Test maintenance alerts endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer $FLEET_TOKEN" \
  http://localhost:3000/api/dashboard/maintenance/alerts

# Test fleet stats endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer $FLEET_TOKEN" \
  http://localhost:3000/api/dashboard/fleet/stats
```

### k6 Load Testing

Save as `load-test.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '20s', target: 0 },
  ],
};

const TOKEN = 'your_jwt_token_here';

export default function () {
  const response = http.get('http://localhost:3000/api/dashboard/fleet/stats', {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });

  check(response, {
    'is status 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

Run:

```bash
k6 run load-test.js
```

---

## Troubleshooting

### Check Server Logs

```bash
# View API server logs
cd /Users/andrewmorton/Documents/GitHub/Fleet-AzureDevOps/api
npm run dev | tee api-test.log
```

### Check Database Connection

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Verify Test Users Exist

```bash
psql $DATABASE_URL -c "SELECT email, role FROM users WHERE email LIKE '%@test.com';"
```

### Reset Test Data

```bash
# Re-run seed script
psql $DATABASE_URL -f src/db/seeds/create-test-users.sql
```

---

**Last Updated:** 2026-01-14
