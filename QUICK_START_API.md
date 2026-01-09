# 🚀 Fleet API - Quick Start

## Database Status: ✅ CONNECTED

**PostgreSQL**: localhost:5432/fleet_db
**Records**: 1,000+ across vehicles, drivers, work orders, maintenance, fuel
**Latency**: ~20-400ms (healthy)

## Test the API in 3 Steps

### 1. Generate JWT Token
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
node test-api-access.js
```

### 2. Copy the Token & Test
Use the generated Bearer token with curl:
```bash
TOKEN="<paste_token_here>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/vehicles | jq '.[0:3]'
```

### 3. Query Database Directly
```bash
psql postgresql://andrewmorton:password@localhost:5432/fleet_db
```

## Quick Verification
```bash
# Health check (no auth needed)
curl http://localhost:3000/api/health | jq .

# Database counts
psql postgresql://andrewmorton:password@localhost:5432/fleet_db \
  -c "SELECT 'Vehicles:' as table, COUNT(*)::text as count FROM vehicles 
      UNION ALL SELECT 'Drivers:', COUNT(*)::text FROM drivers 
      UNION ALL SELECT 'Work Orders:', COUNT(*)::text FROM work_orders;"
```

## Test User
- **Email**: toby.deckow@capitaltechalliance.com
- **Role**: SuperAdmin
- **Password**: Demo123!

---
✅ **Status**: Backend fully operational with real PostgreSQL data
📝 **Commit**: 4f4744711
⏱️ **Completed**: 2026-01-09
