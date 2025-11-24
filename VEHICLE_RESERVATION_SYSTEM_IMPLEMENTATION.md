# Vehicle Reservation System Implementation

## Overview

Complete implementation of a vehicle reservation system with Microsoft Calendar/Outlook/Teams integration for the Fleet Management application.

**Status:** Backend Complete (API + Database + Integration) - Frontend Components In Progress

**Date:** 2025-11-24

---

## ✅ Completed Components

### 1. Database Layer

**File:** `api/database/migrations/011_vehicle_reservations.sql`

**Features:**
- ✅ `vehicle_reservations` table with full schema
- ✅ Reservation status enum (`pending`, `confirmed`, `cancelled`, `completed`)
- ✅ Reservation purpose enum (`business`, `personal`)
- ✅ Microsoft integration fields (calendar_event_id, teams_notification_sent)
- ✅ Multi-tenancy support (tenant_id, org_id)
- ✅ Soft delete support (deleted_at)
- ✅ Comprehensive indexes for performance
- ✅ `vehicle_reservation_history` audit trail table
- ✅ Database functions:
  - `check_reservation_conflict()` - Prevent overlapping reservations
  - `get_vehicle_availability()` - Get availability calendar
  - `auto_approve_business_reservation()` - Auto-approve business use
  - `complete_past_reservations()` - Auto-complete past reservations
  - `log_reservation_change()` - Automatic audit logging
- ✅ Database views:
  - `active_reservations` - Currently active reservations
  - `pending_approval_reservations` - Awaiting approval
  - `vehicle_utilization_summary` - Statistics and analytics
- ✅ Triggers for automatic timestamp updates and history logging

**Security:**
- Parameterized query support ($1, $2, $3...)
- Row-level security ready
- Audit trail for all changes

---

### 2. Microsoft Graph Integration Service

**File:** `api/src/services/microsoft-integration.service.ts`

**Features:**
- ✅ OAuth 2.0 authentication with Microsoft Graph API
- ✅ Token caching with automatic renewal
- ✅ **Calendar Integration:**
  - Create calendar events
  - Update calendar events
  - Delete calendar events
  - Automatic attendee management
- ✅ **Teams Integration:**
  - Send formatted notifications to Teams channels
  - Configurable team/channel via environment variable
  - Rich HTML message formatting
- ✅ **Outlook Integration:**
  - Send email confirmations to users
  - Send notifications to fleet managers
  - HTML-formatted emails with reservation details
- ✅ **Helper Functions:**
  - `notifyFleetManagers()` - Bulk notify all fleet managers
  - `testConnection()` - Verify Microsoft Graph connectivity
  - Email/Teams message formatting with status colors

**Environment Variables Required:**
```bash
MICROSOFT_GRAPH_CLIENT_ID=<your-client-id>
MICROSOFT_GRAPH_CLIENT_SECRET=<your-client-secret>
MICROSOFT_GRAPH_TENANT_ID=<your-tenant-id>
MICROSOFT_TEAMS_CHANNEL_ID=<optional-teams-channel-id>
```

**Error Handling:**
- Non-blocking integration failures (won't fail reservation creation)
- Comprehensive logging for troubleshooting
- Graceful degradation when Teams/Calendar unavailable

---

### 3. Backend API Routes

**File:** `api/src/routes/reservations.routes.ts`

**Endpoints:**

#### Core CRUD Operations
- ✅ `GET /api/v1/reservations` - List reservations (permission-filtered)
- ✅ `GET /api/v1/reservations/:id` - Get single reservation
- ✅ `POST /api/v1/reservations` - Create new reservation
- ✅ `PUT /api/v1/reservations/:id` - Update reservation
- ✅ `DELETE /api/v1/reservations/:id` - Cancel reservation (soft delete)

#### Approval Workflow
- ✅ `POST /api/v1/reservations/:id/approve` - Approve/reject reservation
- ✅ `GET /api/v1/reservations/pending` - Get pending approvals (FleetManager/Admin only)

#### Vehicle Availability
- ✅ `GET /api/vehicles/:vehicleId/availability` - Check availability for date range
- ✅ `GET /api/vehicles/:vehicleId/reservations` - Get vehicle reservation history

**Business Logic:**
- ✅ Conflict detection using database function
- ✅ Business vs Personal use approval logic:
  - Business reservations by Admin/FleetManager: Auto-approved
  - Business reservations by Driver: Require approval
  - Personal reservations: Always require approval
- ✅ Microsoft Calendar event creation on reservation
- ✅ Teams notification to fleet managers on new reservation
- ✅ Outlook email confirmation to user
- ✅ Calendar event updates when reservation modified
- ✅ Calendar event deletion when reservation cancelled
- ✅ Transaction support for data integrity

**Security:**
- ✅ All routes require authentication
- ✅ Permission-based access control (using RBAC system)
- ✅ Parameterized queries only (no SQL injection)
- ✅ Input validation with Zod
- ✅ Users can only see/modify their own reservations (unless Admin/FleetManager)

**Input Validation:**
```typescript
// Create Reservation
{
  vehicle_id: UUID,
  start_datetime: ISO8601,
  end_datetime: ISO8601,
  purpose: 'business' | 'personal',
  notes?: string (max 1000 chars),
  approval_required?: boolean
}

// Constraints:
- end_datetime must be after start_datetime
- No overlapping reservations
- Vehicle must exist
```

---

### 4. Permissions Configuration

**File:** `api/src/permissions/config/actions.json`

**New Permissions Added:**
- ✅ `reservation.create` - Create reservations (Admin, FleetManager, Driver)
- ✅ `reservation.update` - Update own reservations (conditional on ownership)
- ✅ `reservation.cancel` - Cancel reservations (conditional on ownership)
- ✅ `reservation.approve` - Approve reservations (Admin, FleetManager only)
- ✅ `reservation.reject` - Reject reservations (Admin, FleetManager only)
- ✅ `reservation.viewAll` - View all reservations (Admin, FleetManager, Auditor)
- ✅ `reservation.viewOwn` - View own reservations (all authenticated users)
- ✅ `reservation.viewTeam` - View team reservations (Admin, FleetManager)

**Permission Conditions:**
```json
{
  "reservation.update": {
    "conditions": ["reservation.user_id == user.id OR user.role IN ['Admin', 'FleetManager']"]
  },
  "reservation.cancel": {
    "conditions": ["reservation.user_id == user.id OR user.role IN ['Admin', 'FleetManager']"]
  }
}
```

---

### 5. Server Integration

**File:** `api/src/server.ts`

**Changes:**
- ✅ Import statement added: `import reservationsRoutes from './routes/reservations.routes'`
- ✅ Route registered: `app.use('/api/v1/reservations', reservationsRoutes)`
- ✅ Positioned logically with vehicle-related routes

**Integration Pattern:**
```typescript
// The route uses setDatabasePool() pattern for pool injection
// Pool is automatically injected during app initialization
import reservationsRoutes from './routes/reservations.routes'
app.use('/api/v1/reservations', reservationsRoutes)
```

---

## 🔄 In Progress / Remaining Components

### 6. Frontend Components (To Be Created)

**Component Files Needed:**

1. **`src/components/reservations/VehicleReservationModal.tsx`**
   - Date/time picker (start and end)
   - Purpose selector (Business/Personal)
   - Notes field
   - Vehicle details preview
   - Availability checker (shows conflicts)
   - Submit button with loading state

2. **`src/components/reservations/ReservationCalendar.tsx`**
   - Full calendar view showing all reservations
   - Color-coded by status:
     - Pending: Yellow
     - Confirmed: Green
     - Personal: Blue
     - Business: Purple
   - Click event to view details
   - Filter by vehicle, user, date range

3. **`src/components/reservations/MyReservations.tsx`**
   - List view of user's reservations
   - Tabs: Upcoming / Past / Cancelled
   - Cancel button for each reservation
   - "View Vehicle" link to VirtualGarage3D

4. **`src/pages/ReservationsPage.tsx`**
   - Wrapper for ReservationCalendar component
   - Page header with "New Reservation" button

5. **`src/pages/MyReservationsPage.tsx`**
   - Wrapper for MyReservations component
   - Page header with stats

### 7. VirtualGarage3D Integration (To Be Updated)

**File:** `src/components/modules/VirtualGarage3D.tsx`

**Changes Needed:**
- Add reservation badge on vehicles (show "Reserved" status)
- Add "Reserve This Vehicle" button to vehicle detail panel
- Show current reservation details if vehicle is reserved
- Link to reservation system

### 8. Navigation Integration

**Files to Update:**

1. **`src/components/layout/Sidebar.tsx`**
   - Add "Reservations" menu item in MANAGEMENT section
   - Add "My Reservations" menu item

2. **`src/App.tsx`**
   - Add routes:
     ```tsx
     <Route path="/reservations" element={<ReservationsPage />} />
     <Route path="/my-reservations" element={<MyReservationsPage />} />
     ```

### 9. Testing

**Test File:** `api/tests/routes/reservations.test.ts`

**Test Scenarios Needed:**
- ✅ Create reservation with valid data
- ✅ Prevent overlapping reservations
- ✅ Business vs personal use approval workflow
- ✅ Cancel reservation
- ✅ Check vehicle availability
- ✅ Microsoft Graph integration (mocked)
- ✅ Permission enforcement
- ✅ Input validation

---

## 📋 API Usage Examples

### Create a Reservation

```bash
POST /api/v1/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicle_id": "123e4567-e89b-12d3-a456-426614174000",
  "start_datetime": "2025-11-25T09:00:00Z",
  "end_datetime": "2025-11-25T17:00:00Z",
  "purpose": "business",
  "notes": "Client meeting in downtown"
}

Response:
{
  "message": "Reservation created successfully",
  "reservation": { ...reservation object... },
  "requires_approval": false
}
```

### Check Vehicle Availability

```bash
GET /api/vehicles/:vehicleId/availability?start_date=2025-11-25&end_date=2025-11-30
Authorization: Bearer <token>

Response:
{
  "vehicle_id": "123e4567-e89b-12d3-a456-426614174000",
  "start_date": "2025-11-25",
  "end_date": "2025-11-30",
  "availability": [
    {
      "date": "2025-11-25",
      "is_available": false,
      "reservation_id": "...",
      "reserved_by_name": "John Doe",
      "start_time": "09:00:00",
      "end_time": "17:00:00"
    },
    {
      "date": "2025-11-26",
      "is_available": true,
      "reservation_id": null,
      "reserved_by_name": null,
      "start_time": null,
      "end_time": null
    }
    ...
  ]
}
```

### Approve a Reservation (FleetManager/Admin)

```bash
POST /api/v1/reservations/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve",
  "notes": "Approved for business use"
}

Response:
{
  "message": "Reservation approved successfully",
  "reservation": { ...updated reservation... }
}
```

### Get Pending Approvals

```bash
GET /api/v1/reservations/pending
Authorization: Bearer <token>

Response:
{
  "pending_reservations": [ ...array of reservations... ],
  "count": 5
}
```

---

## 🗄️ Database Schema

### vehicle_reservations Table

```sql
id                              UUID PRIMARY KEY
vehicle_id                      UUID NOT NULL (FK to vehicles)
user_id                         UUID NOT NULL (FK to users)
reserved_by_name                TEXT NOT NULL
reserved_by_email               TEXT NOT NULL
start_datetime                  TIMESTAMPTZ NOT NULL
end_datetime                    TIMESTAMPTZ NOT NULL
purpose                         reservation_purpose NOT NULL ('business'/'personal')
status                          reservation_status NOT NULL ('pending'/'confirmed'/'cancelled'/'completed')
notes                           TEXT
approval_required               BOOLEAN DEFAULT true
approved_by                     UUID (FK to users)
approved_at                     TIMESTAMPTZ
microsoft_calendar_event_id     TEXT
microsoft_teams_notification_sent BOOLEAN DEFAULT false
tenant_id                       UUID
org_id                          UUID
created_at                      TIMESTAMPTZ DEFAULT NOW()
updated_at                      TIMESTAMPTZ DEFAULT NOW()
deleted_at                      TIMESTAMPTZ

CONSTRAINTS:
- end_datetime > start_datetime
- start_datetime >= NOW() - 1 hour

INDEXES:
- vehicle_id, user_id, start_datetime, end_datetime, status
- (vehicle_id, start_datetime, end_datetime) for conflict checks
```

### vehicle_reservation_history Table

```sql
id                              UUID PRIMARY KEY
reservation_id                  UUID NOT NULL (FK to vehicle_reservations)
changed_by                      UUID (FK to users)
change_type                     VARCHAR(50) NOT NULL
previous_status                 reservation_status
new_status                      reservation_status
previous_data                   JSONB
new_data                        JSONB
change_reason                   TEXT
ip_address                      INET
user_agent                      TEXT
timestamp                       TIMESTAMPTZ DEFAULT NOW()
```

---

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication required for all endpoints
- Role-based access control (RBAC)
- Permission conditions enforce ownership checks
- Users can only see/modify their own reservations (unless privileged)

### Data Protection
- Parameterized queries prevent SQL injection
- Input validation with Zod
- Soft deletes preserve audit trail
- All changes logged to history table

### Multi-Tenancy
- Tenant isolation via tenant_id
- Organization scoping via org_id
- Row-level security ready

### Audit Trail
- All reservation changes automatically logged
- Includes: who, what, when, why
- IP address and user agent captured
- Previous and new data stored as JSONB

---

## 📊 Integration Points

### Microsoft Graph API
- **Calendar API:** `/me/calendar/events`
- **Teams API:** `/teams/{team-id}/channels/{channel-id}/messages`
- **Mail API:** `/me/sendMail`

### OAuth 2.0 Flow
- Client credentials grant type
- Token caching with automatic renewal
- 5-minute expiration buffer

### Webhook Support (Future)
- Microsoft Graph webhooks can be added for calendar changes
- Bidirectional sync capabilities

---

## 🚀 Deployment Notes

### Environment Variables

Required:
```bash
# Database (already configured)
DATABASE_URL=postgresql://...

# Microsoft Graph Integration
MICROSOFT_GRAPH_CLIENT_ID=<Azure AD App ID>
MICROSOFT_GRAPH_CLIENT_SECRET=<Azure AD App Secret>
MICROSOFT_GRAPH_TENANT_ID=<Azure AD Tenant ID>
```

Optional:
```bash
# Teams Integration
MICROSOFT_TEAMS_CHANNEL_ID=<Teams Channel ID>

# Email Configuration
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASS=<password>
EMAIL_USE_TLS=True
```

### Database Migration

1. Run the migration:
```bash
psql $DATABASE_URL -f api/database/migrations/011_vehicle_reservations.sql
```

2. Verify tables created:
```sql
SELECT * FROM schema_version WHERE version = 11;
```

3. Check functions created:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%reservation%';
```

### Microsoft Azure AD App Setup

1. Register app in Azure AD
2. Add Microsoft Graph API permissions:
   - `Calendars.ReadWrite`
   - `ChannelMessage.Send`
   - `Mail.Send`
3. Grant admin consent
4. Copy client ID, secret, and tenant ID to environment variables

---

## 📈 Performance Considerations

### Database Optimization
- Composite index on (vehicle_id, start_datetime, end_datetime) for fast conflict checks
- Partial indexes exclude soft-deleted records
- Database function for conflict detection (single query)

### API Optimization
- Non-blocking Microsoft integrations (using setImmediate)
- Token caching reduces auth API calls
- Pagination support for list endpoints

### Scalability
- Stateless API design
- Connection pooling for database
- Async/await pattern throughout

---

## 🧪 Testing Strategy

### Unit Tests
- Input validation
- Business logic (conflict detection, approval rules)
- Permission enforcement

### Integration Tests
- Full API request/response cycle
- Database transactions
- Microsoft Graph integration (mocked)

### E2E Tests (Future)
- Frontend + Backend integration
- User workflows (create, approve, cancel)
- Calendar synchronization

---

## 📝 Future Enhancements

### Phase 2 (Frontend)
- [ ] React components
- [ ] Calendar UI integration
- [ ] Real-time updates via WebSocket
- [ ] Mobile-responsive design

### Phase 3 (Advanced Features)
- [ ] Recurring reservations
- [ ] Vehicle checkout/checkin workflow
- [ ] Mileage tracking integration
- [ ] Fuel card integration
- [ ] Maintenance alerts before reservation

### Phase 4 (Analytics)
- [ ] Utilization reports
- [ ] Popular vehicle analysis
- [ ] Cost per reservation
- [ ] Booking patterns dashboard

---

## ✅ Acceptance Criteria Status

- ✅ Users can create reservations for vehicles
- ✅ Prevent overlapping reservations (validation)
- ✅ Business vs Personal use designation
- ✅ Fleet managers can approve/reject reservations
- ✅ Calendar events created in Microsoft Calendar
- ✅ Teams notifications sent to fleet managers
- ✅ Outlook email confirmations sent
- ⏳ VirtualGarage3D shows reservation status (pending frontend)
- ⏳ "Reserve This Vehicle" button in garage (pending frontend)
- ⏳ View all reservations in calendar view (pending frontend)
- ⏳ View "My Reservations" list (pending frontend)
- ✅ Permission system enforced
- ✅ Audit trail for all actions
- ⏳ Tests passing (pending test implementation)

**Overall Progress: 70% Complete (Backend Done, Frontend In Progress)**

---

## 🆘 Troubleshooting

### Issue: Microsoft Graph Integration Failing

**Check:**
1. Environment variables are set correctly
2. Azure AD app has correct permissions
3. Admin consent has been granted
4. Test connection: `microsoftService.testConnection()`

**Logs:**
```bash
# Check server logs for Microsoft Graph errors
grep "Microsoft Graph" /path/to/logs
```

### Issue: Reservation Conflicts Not Detected

**Check:**
1. Database function `check_reservation_conflict()` exists
2. Times are in UTC
3. Soft-deleted reservations are excluded

**Test:**
```sql
SELECT check_reservation_conflict(
  '<vehicle-id>',
  '2025-11-25 09:00:00+00',
  '2025-11-25 17:00:00+00'
);
```

### Issue: Permissions Not Working

**Check:**
1. User has correct role in `user_module_roles` table
2. Permission action exists in `actions.json`
3. JWT token includes roles claim

**Debug:**
```sql
SELECT * FROM user_module_roles WHERE user_id = '<user-id>';
SELECT get_user_roles('<user-id>');
```

---

## 👥 Contributors

- Backend API: Claude Code Agent
- Database Design: Claude Code Agent
- Microsoft Integration: Claude Code Agent
- Documentation: Claude Code Agent

---

## 📄 License

Part of the Fleet Management System - © 2025 Capital Tech Alliance

---

## 🔗 Related Documentation

- [RBAC System Documentation](./api/src/permissions/README.md)
- [Microsoft Graph API Docs](https://learn.microsoft.com/en-us/graph/)
- [Database Migration Guide](./api/database/migrations/README.md)
- [API Documentation](http://localhost:3001/api/docs)

---

**Last Updated:** 2025-11-24
**Version:** 1.0.0
**Status:** Backend Complete, Frontend In Progress
