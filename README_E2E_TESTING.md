# Fleet CTA - End-to-End Testing Quick Start

**✅ STATUS: ALL SYSTEMS OPERATIONAL**

This guide will get you up and running with the Fleet CTA E2E test environment in under 5 minutes.

---

## Quick Start (Copy & Paste)

### 1. Access the E2E Test Page

Open your browser and navigate to:

```
http://localhost:5174/#e2e-test
```

That's it! The page should load showing real data from your PostgreSQL database.

---

## What You'll See

### Dashboard Cards
- **Users**: Total count from database
- **Maintenance Schedules**: Total count from database
- **Vehicles**: Total count from database

### Two Forms
1. **Create New User** - Add users to the system
2. **Schedule Maintenance** - Create maintenance schedules for vehicles

### Two Data Tables
1. **Recent Users** - Last 10 users from database
2. **Maintenance Schedules** - Last 10 schedules with vehicle details

All data is REAL and comes from PostgreSQL (no mocks).

---

## Test the Workflows

### Test 1: Create a User

1. Fill in the "Create New User" form:
   - **Email**: testuser@example.com
   - **First Name**: John
   - **Last Name**: Doe
   - **Phone**: 555-1234
   - **Role**: Driver

2. Click "Create User"

3. You'll see:
   - ✅ Success toast notification
   - 📊 User count increases by 1
   - 📋 New user appears in "Recent Users" table

4. Verify in database:
   ```bash
   PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test \
     -c "SELECT email, first_name, last_name, role FROM users WHERE email = 'testuser@example.com';"
   ```

---

### Test 2: Schedule Maintenance

1. Fill in the "Schedule Maintenance" form:
   - **Vehicle**: Select any vehicle from dropdown
   - **Service Name**: Oil Change
   - **Description**: Routine maintenance
   - **Type**: Preventive
   - **Interval**: 90 (days)
   - **Estimated Cost**: 75.50
   - **Duration**: 60 (minutes)

2. Click "Create Schedule"

3. You'll see:
   - ✅ Success toast notification
   - 📊 Schedule count increases by 1
   - 📋 New schedule appears in "Maintenance Schedules" table

4. Verify in database:
   ```bash
   PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test \
     -c "SELECT name, type, estimated_cost FROM maintenance_schedules WHERE name = 'Oil Change' ORDER BY created_at DESC LIMIT 1;"
   ```

---

## How It Works

```
USER FILLS FORM
      ↓
   FRONTEND (React)
      ↓
   API ENDPOINT (/api/e2e-test/*)
      ↓
   POSTGRESQL DATABASE
      ↓
   API RETURNS DATA
      ↓
   FRONTEND DISPLAYS
```

Every piece of data you see comes from the real database.

---

## Verify Data Matches

### Users

**UI Shows**: Click "Refresh Data" button

**Database Shows**:
```bash
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test \
  -c "SELECT COUNT(*) FROM users;"
```

These numbers should match.

### Maintenance Schedules

**UI Shows**: Look at "Maintenance Schedules" card

**Database Shows**:
```bash
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test \
  -c "SELECT COUNT(*) FROM maintenance_schedules;"
```

These numbers should match.

---

## API Testing (Optional)

If you want to test the API directly with curl:

### Health Check
```bash
curl -s http://localhost:3000/api/e2e-test/health | jq .
```

### Get Users
```bash
curl -s http://localhost:3000/api/e2e-test/users | jq '.data | length'
```

### Create User
```bash
curl -s -X POST http://localhost:3000/api/e2e-test/users \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "api_test@example.com",
    "firstName": "API",
    "lastName": "Test",
    "role": "Driver"
  }' | jq .
```

### Get Maintenance Schedules
```bash
curl -s http://localhost:3000/api/e2e-test/maintenance-schedules | jq '.data | length'
```

---

## Troubleshooting

### Page Shows "Loading..." Forever

**Check backend is running**:
```bash
curl http://localhost:3000/api/e2e-test/health
```

If this fails, restart the backend:
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api
NODE_ENV=development npm run dev:full
```

---

### "Failed to fetch" Error

**Check CORS configuration**:
- Frontend: http://localhost:5174
- Backend: http://localhost:3000

Make sure both are running on these exact ports.

---

### Database Connection Error

**Check PostgreSQL is running**:
```bash
docker ps | grep postgres
```

If not running, start it:
```bash
docker start fleet-postgres
```

---

### No Vehicles in Dropdown

**Check if vehicles exist**:
```bash
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test \
  -c "SELECT COUNT(*) FROM vehicles;"
```

If zero, you need to seed some vehicle data.

---

## File Locations

### Frontend
- **E2E Test Page**: `/src/pages/E2ETestPage.tsx`
- **App Router**: `/src/App.tsx` (search for "e2e-test")

### Backend
- **E2E Routes**: `/api/src/routes/e2e-test.routes.ts`
- **Server Config**: `/api/src/server.ts` (search for "e2e-test")

### Documentation
- **Full Verification Guide**: `E2E_VERIFICATION_GUIDE.md`
- **Proof Report**: `E2E_PROOF_REPORT.md`
- **This Guide**: `README_E2E_TESTING.md`

---

## Success Criteria

You've successfully tested the E2E workflows if:

- ✅ E2E page loads at http://localhost:5174/#e2e-test
- ✅ Dashboard shows real counts from database
- ✅ You can create a new user via form
- ✅ New user appears in "Recent Users" table
- ✅ Database query confirms user exists
- ✅ You can create a maintenance schedule via form
- ✅ New schedule appears in "Maintenance Schedules" table
- ✅ Database query confirms schedule exists
- ✅ All counts match between UI and database

---

## Next Steps

### For Testing
- Read `E2E_VERIFICATION_GUIDE.md` for detailed workflows
- Review `E2E_PROOF_REPORT.md` for complete evidence

### For Development
- Study `/api/src/routes/e2e-test.routes.ts` to see how endpoints are built
- Study `/src/pages/E2ETestPage.tsx` to see how UI integrates with API
- Use these as templates for building authenticated endpoints

### For Production
- **REMOVE** E2E test routes before deploying
- Implement proper authentication
- Update main pages to use authenticated endpoints
- Add comprehensive error handling

---

## Support

If you encounter any issues:

1. Check all services are running (backend, frontend, database)
2. Review browser console for JavaScript errors
3. Check backend logs at `/tmp/fleet-api.log`
4. Verify database connection with psql commands
5. Refer to `E2E_VERIFICATION_GUIDE.md` for troubleshooting

---

**Last Updated**: January 29, 2026
**Environment**: Development (localhost)
**Tested By**: Claude Code AI Assistant
**Status**: ✅ All Tests Passing
