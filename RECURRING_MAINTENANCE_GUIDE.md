# Recurring Maintenance Schedule System - Complete Guide

## Overview

The Recurring Maintenance Schedule system provides automated, production-ready maintenance scheduling and work order generation for fleet vehicles. It supports time-based, mileage-based, engine hours-based, and combined scheduling patterns with automatic work order creation.

## Features

- **Flexible Scheduling**: Time-based (days/weeks/months), mileage-based, engine hours, or combined patterns
- **Automated Work Orders**: Automatically generate work orders when maintenance is due
- **Smart Calculations**: Intelligent next-due-date calculations based on vehicle telemetry
- **Notifications**: Automatic notifications to technicians and fleet managers
- **Audit Trail**: Complete history of all generated work orders
- **Configurable Templates**: Customizable work order templates with defaults
- **Cron-based Processing**: Hourly automated checks for due maintenance
- **Dashboard Statistics**: Real-time stats on recurring maintenance

---

## Database Schema

### New Tables

#### `maintenance_schedule_history`
Tracks all automatically generated work orders from recurring schedules.

```sql
CREATE TABLE maintenance_schedule_history (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  schedule_id UUID NOT NULL,
  work_order_id UUID REFERENCES work_orders(id),
  execution_type VARCHAR(50),
  next_due_before TIMESTAMP,
  next_due_after TIMESTAMP,
  mileage_at_creation INTEGER,
  engine_hours_at_creation INTEGER,
  error_message TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

#### `vehicle_telemetry_snapshots`
Stores periodic vehicle data for mileage/hours-based scheduling.

```sql
CREATE TABLE vehicle_telemetry_snapshots (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  odometer_reading INTEGER,
  engine_hours INTEGER,
  fuel_level INTEGER,
  battery_level INTEGER,
  last_gps_location JSONB,
  snapshot_date TIMESTAMP,
  created_at TIMESTAMP
);
```

#### `maintenance_notifications`
User notifications for maintenance events.

```sql
CREATE TABLE maintenance_notifications (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  schedule_id UUID REFERENCES maintenance_schedules(id),
  work_order_id UUID REFERENCES work_orders(id),
  user_id UUID NOT NULL,
  notification_type VARCHAR(100),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  sent_via VARCHAR(50)[],
  sent_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Modified Tables

#### `maintenance_schedules` - New Columns

```sql
ALTER TABLE maintenance_schedules ADD COLUMN:
  - is_recurring BOOLEAN DEFAULT FALSE
  - recurrence_pattern JSONB
  - auto_create_work_order BOOLEAN DEFAULT TRUE
  - work_order_template JSONB
  - last_work_order_created_at TIMESTAMP
  - current_mileage INTEGER
  - current_engine_hours INTEGER
```

---

## API Endpoints

### Create Recurring Schedule

**POST** `/api/maintenance-schedules/recurring`

Creates a new recurring maintenance schedule with automatic work order generation.

**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "service_type": "Oil Change",
  "priority": "medium",
  "estimated_cost": 75.00,
  "recurrence_pattern": {
    "type": "time",
    "interval_value": 90,
    "interval_unit": "days",
    "lead_time_days": 7,
    "warning_threshold_days": 14
  },
  "auto_create_work_order": true,
  "work_order_template": {
    "priority": "medium",
    "assigned_technician": "tech@fleet.com",
    "estimated_cost": 75.00,
    "estimated_duration_hours": 2,
    "description": "Regular oil change service",
    "parts": ["Oil Filter", "Motor Oil 5W-30"],
    "instructions": "Check all fluid levels"
  },
  "notes": "Every 90 days or 3000 miles"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "vehicle_id": "uuid",
  "service_type": "Oil Change",
  "next_due": "2025-04-08T00:00:00Z",
  "is_recurring": true,
  "recurrence_pattern": {...},
  "auto_create_work_order": true,
  "work_order_template": {...},
  "created_at": "2025-01-08T00:00:00Z"
}
```

---

### Update Recurrence Pattern

**PUT** `/api/maintenance-schedules/:id/recurrence`

Updates the recurrence pattern and/or work order template for an existing schedule.

**Request Body:**
```json
{
  "recurrence_pattern": {
    "type": "combined",
    "interval_value": 3000,
    "interval_unit": "miles",
    "lead_time_days": 5
  },
  "auto_create_work_order": true,
  "work_order_template": {
    "priority": "high",
    "estimated_cost": 100.00
  }
}
```

---

### Get Due Schedules

**GET** `/api/maintenance-schedules/due`

Retrieves all schedules due within a specified timeframe.

**Query Parameters:**
- `days_ahead` (default: 7) - Number of days to look ahead
- `include_overdue` (default: true) - Include overdue schedules
- `vehicle_id` (optional) - Filter by vehicle
- `service_type` (optional) - Filter by service type
- `priority` (optional) - Filter by priority

**Response:** `200 OK`
```json
{
  "data": [
    {
      "schedule": {...},
      "vehicle": {
        "id": "uuid",
        "vehicle_number": "FLEET-001",
        "make": "Ford",
        "model": "F-150"
      },
      "telemetry": {
        "odometer_reading": 45230,
        "engine_hours": 1200
      },
      "days_until_due": 3,
      "miles_until_due": 500,
      "is_overdue": false
    }
  ],
  "summary": {
    "total": 15,
    "overdue": 2,
    "due_within_7_days": 8,
    "total_estimated_cost": 2500.00
  }
}
```

---

### Manual Work Order Generation

**POST** `/api/maintenance-schedules/:id/generate-work-order`

Manually trigger work order creation for a schedule (bypasses due-date check if specified).

**Request Body:**
```json
{
  "override_template": {
    "priority": "urgent",
    "assigned_technician": "emergency@fleet.com"
  },
  "skip_due_check": false
}
```

**Response:** `201 Created`
```json
{
  "message": "Work order created successfully",
  "work_order": {
    "id": "uuid",
    "work_order_number": "WO-000123",
    "status": "open",
    "scheduled_date": "2025-01-10T00:00:00Z"
  },
  "schedule": {...}
}
```

---

### Get Schedule History

**GET** `/api/maintenance-schedules/:id/history`

View the complete history of work orders generated from a schedule.

**Response:** `200 OK`
```json
{
  "schedule": {...},
  "history": [
    {
      "id": "uuid",
      "work_order_id": "uuid",
      "work_order_number": "WO-000123",
      "execution_type": "auto_scheduled",
      "next_due_before": "2025-01-08T00:00:00Z",
      "next_due_after": "2025-04-08T00:00:00Z",
      "mileage_at_creation": 45000,
      "status": "success",
      "created_at": "2025-01-08T10:00:00Z"
    }
  ],
  "stats": {
    "total_work_orders": 12,
    "total_cost": 900.00,
    "success_rate": 100
  }
}
```

---

### Get Recurring Statistics

**GET** `/api/maintenance-schedules/stats/recurring`

Get comprehensive statistics for all recurring schedules.

**Response:** `200 OK`
```json
{
  "total_recurring": 45,
  "total_active": 42,
  "total_paused": 3,
  "due_within_7_days": 8,
  "due_within_30_days": 25,
  "overdue": 2,
  "work_orders_created_last_30_days": 18,
  "avg_cost_per_schedule": 125.50,
  "total_estimated_cost_next_30_days": 3137.50
}
```

---

### Pause/Resume Schedule

**PATCH** `/api/maintenance-schedules/:id/pause`
**PATCH** `/api/maintenance-schedules/:id/resume`

Pause or resume automatic work order generation.

**Response:** `200 OK`
```json
{
  "message": "Auto work order generation paused",
  "schedule": {...}
}
```

---

## Recurrence Pattern Types

### 1. Time-Based

Schedule maintenance at fixed time intervals.

```json
{
  "type": "time",
  "interval_value": 90,
  "interval_unit": "days"
}
```

**Supported Units:** `days`, `weeks`, `months`

**Example Use Cases:**
- Oil change every 90 days
- Inspection every 6 months
- Safety check weekly

---

### 2. Mileage-Based

Schedule maintenance based on vehicle mileage.

```json
{
  "type": "mileage",
  "interval_value": 3000,
  "interval_unit": "miles"
}
```

**Note:** Requires vehicle telemetry data for accurate tracking.

**Example Use Cases:**
- Oil change every 3,000 miles
- Tire rotation every 5,000 miles
- Major service every 30,000 miles

---

### 3. Engine Hours-Based

Schedule maintenance based on engine running hours (for equipment/heavy machinery).

```json
{
  "type": "engine_hours",
  "interval_value": 250,
  "interval_unit": "engine_hours"
}
```

**Example Use Cases:**
- Forklift service every 250 hours
- Generator maintenance every 500 hours
- Construction equipment service

---

### 4. Combined (Time + Mileage)

Schedule maintenance based on whichever comes first: time or mileage.

```json
{
  "type": "combined",
  "interval_value": 3000,
  "interval_unit": "miles"
}
```

**Example:** Oil change every 90 days OR 3,000 miles, whichever comes first.

---

## Cron Job Configuration

The maintenance scheduler runs automatically on a configurable schedule.

### Environment Variables

Add to your `.env` file:

```bash
# Maintenance Scheduler Configuration
ENABLE_MAINTENANCE_SCHEDULER=true
MAINTENANCE_CRON_SCHEDULE=0 * * * *  # Every hour at minute 0
MAINTENANCE_DAYS_AHEAD=1              # Check schedules due within 1 day
TZ=America/New_York                   # Timezone for scheduling
```

### Cron Schedule Examples

```bash
# Every hour
0 * * * *

# Every 6 hours
0 */6 * * *

# Daily at 6 AM
0 6 * * *

# Every Monday at 8 AM
0 8 * * 1

# Twice daily (6 AM and 6 PM)
0 6,18 * * *
```

### Manual Trigger

You can manually trigger the scheduler via code:

```typescript
import maintenanceScheduler from './jobs/maintenance-scheduler'

// Trigger now
await maintenanceScheduler.triggerNow()

// Get status
const status = maintenanceScheduler.getStatus()
console.log(status)
// { enabled: true, schedule: '0 * * * *', daysAhead: 1 }
```

---

## Work Order Templates

Define default work order settings for automated creation.

```json
{
  "priority": "medium",
  "assigned_technician": "tech@fleet.com",
  "estimated_cost": 150.00,
  "estimated_duration_hours": 3,
  "description": "Comprehensive vehicle inspection including:\n- Brake system check\n- Fluid levels\n- Tire condition\n- Light operation",
  "parts": [
    "Oil Filter",
    "Air Filter",
    "Wiper Blades"
  ],
  "service_provider": "Main Street Auto",
  "instructions": "Follow manufacturer service manual procedure",
  "checklist": [
    "Check all fluid levels",
    "Inspect brake pads",
    "Test all lights",
    "Check tire pressure and tread depth",
    "Test battery"
  ]
}
```

---

## Vehicle Telemetry Integration

For mileage-based and engine hours scheduling, you need to populate telemetry data.

### Creating Telemetry Snapshots

```sql
INSERT INTO vehicle_telemetry_snapshots (
  tenant_id, vehicle_id, odometer_reading, engine_hours,
  fuel_level, battery_level, snapshot_date
) VALUES (
  'tenant-uuid',
  'vehicle-uuid',
  45230,  -- Current odometer
  1200,   -- Current engine hours
  75,     -- Fuel level %
  95,     -- Battery level %
  NOW()
);
```

### Automated Telemetry Collection

Integrate with your vehicle telematics system to automatically create snapshots:

```typescript
// Example: Collect telemetry from GPS devices
async function collectVehicleTelemetry(vehicleId: string) {
  const telemetry = await gpsDevice.getLatestData(vehicleId)

  await pool.query(
    `INSERT INTO vehicle_telemetry_snapshots (
      tenant_id, vehicle_id, odometer_reading, engine_hours,
      last_gps_location, snapshot_date
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    [
      tenantId,
      vehicleId,
      telemetry.odometer,
      telemetry.engineHours,
      JSON.stringify({
        latitude: telemetry.lat,
        longitude: telemetry.lng,
        timestamp: new Date()
      })
    ]
  )
}
```

---

## Testing

### Run Test Suite

```bash
# All tests
npm test

# Specific test file
npm test recurring-maintenance.test.ts

# With coverage
npm test:coverage
```

### Test Coverage

The test suite includes:
- Recurrence pattern validation
- Next due date calculations
- Due schedule detection
- Work order generation
- Schedule processing
- Statistics calculation

---

## Deployment Checklist

### Database Migration

1. **Run migration:**
   ```bash
   psql -U fleetadmin -d fleetdb -f api/src/migrations/003-recurring-maintenance.sql
   ```

2. **Verify tables created:**
   ```sql
   \dt maintenance_schedule_history
   \dt vehicle_telemetry_snapshots
   \dt maintenance_notifications
   ```

3. **Verify columns added:**
   ```sql
   \d+ maintenance_schedules
   ```

### Application Configuration

1. **Update environment variables** (`.env`):
   ```bash
   ENABLE_MAINTENANCE_SCHEDULER=true
   MAINTENANCE_CRON_SCHEDULE=0 * * * *
   MAINTENANCE_DAYS_AHEAD=1
   ```

2. **Create logs directory:**
   ```bash
   mkdir -p api/logs
   chmod 755 api/logs
   ```

3. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```

4. **Build TypeScript:**
   ```bash
   npm run build
   ```

### Testing

1. **Create test schedule:**
   ```bash
   curl -X POST http://localhost:3000/api/maintenance-schedules/recurring \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "vehicle_id": "vehicle-uuid",
       "service_type": "Test Service",
       "priority": "medium",
       "estimated_cost": 100,
       "recurrence_pattern": {
         "type": "time",
         "interval_value": 1,
         "interval_unit": "days"
       },
       "auto_create_work_order": true,
       "work_order_template": {
         "priority": "medium",
         "estimated_cost": 100
       }
     }'
   ```

2. **Manually trigger scheduler:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/trigger-scheduler \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

3. **Check work order created:**
   ```sql
   SELECT * FROM work_orders ORDER BY created_at DESC LIMIT 1;
   ```

---

## Monitoring & Logging

### Log Files

Logs are written to:
- `api/logs/maintenance-scheduler.log` - Scheduler execution logs
- Console output for real-time monitoring

### Log Format

```json
{
  "timestamp": "2025-01-08T10:00:00.000Z",
  "level": "info",
  "message": "Work order generated successfully",
  "scheduleId": "uuid",
  "workOrderId": "uuid",
  "workOrderNumber": "WO-000123",
  "nextDueDate": "2025-04-08T00:00:00Z"
}
```

### Audit Trail

All scheduler runs are logged to `audit_logs` table:

```sql
SELECT * FROM audit_logs
WHERE action = 'MAINTENANCE_SCHEDULER_RUN'
ORDER BY created_at DESC;
```

---

## Best Practices

1. **Set Realistic Lead Times**: Configure `lead_time_days` to give technicians adequate notice
2. **Monitor Telemetry Data**: Ensure vehicle telemetry is updated regularly for accurate mileage-based scheduling
3. **Review Generated Work Orders**: Periodically audit auto-generated work orders for accuracy
4. **Use Combined Patterns**: For critical maintenance, use "combined" type to ensure service happens on time
5. **Configure Notifications**: Set up email/SMS notifications for high-priority maintenance
6. **Regular Testing**: Test the scheduler in staging before production deployment
7. **Backup Before Migration**: Always backup your database before running migrations

---

## Troubleshooting

### Work Orders Not Being Created

**Check:**
1. Scheduler is enabled: `ENABLE_MAINTENANCE_SCHEDULER=true`
2. Schedule has `auto_create_work_order=true`
3. Schedule `next_due` is within `MAINTENANCE_DAYS_AHEAD`
4. No recent work order created (`last_work_order_created_at`)
5. Check logs: `api/logs/maintenance-scheduler.log`

### Incorrect Next Due Dates

**Check:**
1. Recurrence pattern is valid
2. Vehicle telemetry data exists for mileage-based schedules
3. Timezone configuration matches your region

### Scheduler Not Running

**Check:**
1. Cron expression is valid
2. Server time zone is correct
3. Logs for errors: `grep ERROR api/logs/maintenance-scheduler.log`

---

## Support

For issues or questions:
- Review logs: `api/logs/maintenance-scheduler.log`
- Check database for errors: `SELECT * FROM maintenance_schedule_history WHERE status = 'failed'`
- Run test suite: `npm test`
- Contact: support@fleet.com

---

## Future Enhancements

Planned features:
- [ ] Email/SMS notifications
- [ ] Integration with parts inventory
- [ ] Predictive maintenance using AI/ML
- [ ] Mobile app notifications
- [ ] Calendar sync (Google/Outlook)
- [ ] Vendor management integration
- [ ] Cost tracking and budgeting
- [ ] Performance analytics dashboard
