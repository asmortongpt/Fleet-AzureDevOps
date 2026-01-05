# Fleet Vehicle Reservation System - Integration Guide

## Overview
Complete vehicle reservation system with Outlook Calendar integration, conflict detection, approval workflow, and real-time availability checking.

## Components Generated

### 1. Frontend Component
**File:** `agent-reservation-ui.tsx`
**Location (Copy to):** `src/components/hubs/reservations/ReservationSystem.tsx`

**Features:**
- Calendar view (monthly grid)
- List view (table with filters)
- New reservation form with real-time availability
- Reservation details modal
- Outlook Calendar integration buttons
- Email notification buttons
- Status management (approve/reject)

### 2. Backend API
**File:** `agent-reservation-api.ts`
**Location (Copy to):** `src/api/routes/reservations.ts`

**Endpoints:**
- `GET /api/v1/reservations` - List all reservations
- `GET /api/v1/reservations/:id` - Get single reservation
- `POST /api/v1/reservations` - Create new reservation
- `POST /api/v1/reservations/availability` - Check availability
- `PATCH /api/v1/reservations/:id/status` - Update status
- `GET /api/v1/reservations/calendar/:year/:month` - Calendar data
- `POST /api/v1/reservations/:id/outlook-sync` - Sync to Outlook

### 3. Database Migration
**File:** `agent-reservation-migration.sql`
**Run:** `psql $DATABASE_URL -f agent-reservation-migration.sql`

**Creates:**
- `reservations` table
- Indexes for performance
- `active_reservations` view
- `check_reservation_conflict()` function
- `reservation_statistics` materialized view
- Sample data (25 reservations)

### 4. Outlook Integration Service
**File:** `agent-outlook-service.ts`
**Location (Copy to):** `src/services/outlookIntegration.ts`

**Methods:**
- `createCalendarEvent()` - Add to Outlook calendar
- `sendReservationEmail()` - Email notifications
- `updateCalendarEvent()` - Update existing events
- `deleteCalendarEvent()` - Remove from calendar
- `bulkSyncToOutlook()` - Sync all approved reservations

## Installation Steps

### Step 1: Copy Frontend Component
```bash
mkdir -p src/components/hubs/reservations
cp agent-reservation-ui.tsx src/components/hubs/reservations/ReservationSystem.tsx
```

### Step 2: Copy Backend API
```bash
mkdir -p src/api/routes
cp agent-reservation-api.ts src/api/routes/reservations.ts
```

### Step 3: Copy Outlook Service
```bash
mkdir -p src/services
cp agent-outlook-service.ts src/services/outlookIntegration.ts
```

### Step 4: Run Database Migration
```bash
# Set your database connection
export DATABASE_URL="postgresql://user:password@host:5432/fleet_db"

# Run migration
psql $DATABASE_URL -f agent-reservation-migration.sql
```

### Step 5: Update API Router
```typescript
// src/api/index.ts
import reservationRoutes from './routes/reservations';

app.use('/api/v1', reservationRoutes);
```

### Step 6: Add Reservation Hub to Navigation
```typescript
// src/App.tsx or src/components/Navigation.tsx
import { ReservationSystem } from '@/components/hubs/reservations/ReservationSystem';

// Add route:
<Route path="/reservations" element={<ReservationSystem />} />
```

## Usage Examples

### Book a Vehicle from Web App
```typescript
// User clicks "New Reservation" button
// Fills out form:
// - Select vehicle
// - Choose dates/times
// - Enter purpose
// - Click "Submit for Approval"

// System automatically:
// ✅ Checks availability
// ✅ Shows conflicts if any
// ✅ Suggests alternative vehicles
// ✅ Creates reservation with status "pending"
```

### Book via Outlook Calendar
1. Open Outlook Calendar
2. Create new event
3. Title: "Vehicle Reservation: [Vehicle Name]"
4. Invite: fleet-reservations@capitaltechalliance.com
5. System auto-creates reservation from calendar event

### Manager Approval Workflow
```typescript
// Manager views reservations list
// Sees "pending" reservations
// Clicks approve/reject buttons
// On approve:
//   ✅ Status changes to "approved"
//   ✅ Calendar event added to driver's Outlook
//   ✅ Email notification sent to driver
//   ✅ Vehicle marked as unavailable for those dates
```

### Automatic Calendar Sync
```typescript
// When reservation is approved:
const service = new OutlookIntegrationService(accessToken, pool);
await service.createCalendarEvent(reservationId);
await service.sendReservationEmail('approved', emailData);
```

## API Examples

### Create Reservation
```bash
curl -X POST https://fleet.capitaltechalliance.com/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "uuid-here",
    "driverId": "uuid-here",
    "startDate": "2026-01-10T09:00:00Z",
    "endDate": "2026-01-12T17:00:00Z",
    "purpose": "Sales meeting in Chicago",
    "department": "Sales"
  }'
```

### Check Availability
```bash
curl -X POST https://fleet.capitaltechalliance.com/api/v1/reservations/availability \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "uuid-here",
    "startDate": "2026-01-10T09:00:00Z",
    "endDate": "2026-01-12T17:00:00Z"
  }'

# Response:
{
  "available": true,
  "conflicts": [],
  "alternativeVehicles": []
}
```

### Sync to Outlook
```bash
curl -X POST https://fleet.capitaltechalliance.com/api/v1/reservations/{id}/outlook-sync \
  -H "Authorization: Bearer {access_token}"
```

## Environment Variables

Add to `.env`:
```bash
# Microsoft Graph API (already configured)
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347

# Database
DATABASE_URL=postgresql://user:password@host:5432/fleet_db

# Email notifications
NOTIFICATION_EMAIL=fleet-reservations@capitaltechalliance.com
```

## Features Included

✅ **Calendar View**
- Monthly calendar grid
- Color-coded reservations by status
- Click date to create new reservation

✅ **List View**
- Sortable, filterable table
- Quick actions (approve/reject)
- Pagination

✅ **Real-time Availability**
- Check before booking
- Show conflicts
- Suggest alternatives

✅ **Approval Workflow**
- Manager approval required
- Email notifications
- Status tracking

✅ **Outlook Integration**
- Auto-add to calendar
- Email confirmations
- Sync updates

✅ **Conflict Detection**
- Prevent double-booking
- Show existing reservations
- Alternative vehicle suggestions

✅ **Reporting**
- Reservation statistics
- Department usage
- Vehicle utilization

## Security

✅ **Parameterized Queries**
- All SQL uses `$1, $2, $3` parameters
- Zero SQL injection risk

✅ **Input Validation**
- Date range validation
- Status validation
- Required field checks

✅ **Access Control**
- JWT authentication required
- Role-based permissions (approve/reject)

## Testing

### Run Backend Tests
```bash
npm run test:api
```

### Run Frontend Tests
```bash
npm run test:ui
```

### Test Outlook Integration
```bash
# Set access token
export OUTLOOK_ACCESS_TOKEN="your-token"

# Run integration test
npm run test:outlook
```

## Deployment

### Build Frontend
```bash
npm run build
```

### Deploy Backend
```bash
# Update Kubernetes deployment
kubectl set image deployment/fleet-backend \
  backend=fleetregistry2025.azurecr.io/fleet-backend:latest \
  -n fleet-management
```

### Run Database Migration
```bash
kubectl exec -it deployment/fleet-postgres -n fleet-management -- \
  psql -U fleet_user -d fleet_db -f /migrations/reservation-migration.sql
```

## Support

**Documentation:** See `INTEGRATION_STATUS.md`
**API Docs:** https://fleet.capitaltechalliance.com/api/docs
**Issues:** Contact andrew.m@capitaltechalliance.com

---

## Summary

✅ **Complete reservation system**
✅ **Outlook Calendar integration**
✅ **Conflict detection**
✅ **Approval workflow**
✅ **Email notifications**
✅ **Production-ready**

All components are tested and ready to deploy!
