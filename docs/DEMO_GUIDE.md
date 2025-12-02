# Fleet Management System - Demo Guide

**Version:** 1.0
**Last Updated:** November 8, 2024
**Demo Tenant:** Demo Fleet Corporation

---

## Table of Contents

1. [Overview](#overview)
2. [Demo Credentials](#demo-credentials)
3. [Quick Start](#quick-start)
4. [Demo Data Overview](#demo-data-overview)
5. [Step-by-Step Walkthrough](#step-by-step-walkthrough)
6. [Key Features to Showcase](#key-features-to-showcase)
7. [Demo Scenarios](#demo-scenarios)
8. [Troubleshooting](#troubleshooting)
9. [Resetting the Demo](#resetting-the-demo)

---

## Overview

This demo environment showcases a fully operational fleet management system with realistic data for **Demo Fleet Corporation**, a mid-sized logistics company operating across 5 major US cities with a diverse fleet of 50 vehicles.

### Demo Highlights

- **50 Vehicles**: Sedans, trucks, vans, SUVs, and EVs
- **7 Users**: Multiple roles (Admin, Manager, Technician, Drivers)
- **5 Facilities**: New York, Los Angeles, Chicago, Atlanta, Seattle
- **30 Work Orders**: Active maintenance operations
- **100+ Fuel Transactions**: 3 months of historical data
- **30 EV Charging Sessions**: Electric vehicle operations
- **15 Routes**: Delivery and service routes
- **Live Issues**: Overdue maintenance, safety incidents, policy violations

---

## Demo Credentials

All demo accounts use the same password: **`Demo@123`**

### Admin Account
```
Email:    admin@demofleet.com
Password: Demo@123
Name:     Sarah Williams
Role:     System Administrator
```

**Full access to all features including:**
- User management
- Fleet-wide analytics
- System configuration
- Audit logs
- All reports

---

### Fleet Manager Account
```
Email:    manager@demofleet.com
Password: Demo@123
Name:     Michael Chen
Role:     Fleet Manager
```

**Responsibilities:**
- Vehicle assignments
- Maintenance scheduling
- Route planning
- Driver management
- Performance reporting

---

### Technician Account
```
Email:    tech@demofleet.com
Password: Demo@123
Name:     Robert Martinez
Role:     Technician
```

**Access to:**
- Work orders
- Vehicle maintenance records
- Parts inventory
- Service schedules
- Inspection forms

---

### Driver Accounts

**Driver 1 (Primary Demo Driver)**
```
Email:    driver1@demofleet.com
Password: Demo@123
Name:     James Thompson
License:  D1234567 (NY, CDL Class A)
Vehicle:  Honda Accord (NYC-1001)
```

**Driver 2**
```
Email:    driver2@demofleet.com
Password: Demo@123
Name:     Maria Rodriguez
License:  D2345678 (NY, CDL Class B)
Vehicle:  Honda Accord (NYC-1002)
```

**Driver 3**
```
Email:    driver3@demofleet.com
Password: Demo@123
Name:     David Anderson
License:  D3456789 (NY, CDL Class A)
Vehicle:  Tesla Model 3 (NYC-1005)
```

**Driver 4**
```
Email:    driver4@demofleet.com
Password: Demo@123
Name:     Jennifer Taylor
License:  D4567890 (NY, CDL Class B)
```

**Driver access includes:**
- Assigned vehicle information
- Pre-trip inspections
- Route details
- Fuel logging
- Basic notifications

---

## Quick Start

### 1. Access the System

Navigate to your Fleet Management System URL:
```
http://localhost:3000
OR
https://your-domain.com
```

### 2. Login as Admin

Use the admin credentials to get full system overview:
- Email: `admin@demofleet.com`
- Password: `Demo@123`

### 3. Explore the Dashboard

You'll immediately see:
- **50 total vehicles** across the fleet
- **Critical alerts**: 1 overdue inspection
- **Active work orders**: 8 in progress
- **Fuel costs**: Real data over 3 months
- **Fleet utilization**: Active operations

### 4. Navigate Key Sections

| Section | What to Show |
|---------|-------------|
| **Vehicles** | 50 diverse vehicles with real specs |
| **Work Orders** | Active maintenance, including overdue items |
| **Drivers** | Complete driver profiles with CDL info |
| **Routes** | Active delivery routes with tracking |
| **Maintenance** | Scheduled services and overdue alerts |
| **Reports** | Fleet analytics and cost tracking |

---

## Demo Data Overview

### Fleet Composition

| Vehicle Type | Quantity | Examples |
|-------------|----------|----------|
| Sedans | 15 | Honda Accord, Toyota Camry, Tesla Model 3 |
| Trucks | 10 | Ford F-150, Chevy Silverado, Ram 1500 |
| Vans | 10 | Ford Transit, Mercedes Sprinter, Dodge ProMaster |
| SUVs | 10 | Ford Explorer, Chevy Tahoe, Toyota Highlander |
| EVs | 5 | Tesla Model Y, Chevy Bolt, Nissan Leaf |

### Geographic Distribution

| Facility | Location | Vehicles | Service Bays |
|----------|----------|----------|--------------|
| HQ Depot | New York, NY | 15 | 8 |
| West Coast Hub | Los Angeles, CA | 10 | 6 |
| Central Operations | Chicago, IL | 10 | 5 |
| East Service Center | Atlanta, GA | 8 | 4 |
| Northwest Facility | Seattle, WA | 7 | 5 |

### Work Order Status

- **Completed**: 10 (last month)
- **In Progress**: 8 (current)
- **Scheduled**: 7 (upcoming)
- **Overdue**: 5 (⚠️ needs attention)

### Key Issues to Address (for demo scenarios)

1. **CRITICAL**: Vehicle NYC-1302 - Annual DOT inspection expired Oct 25
2. **HIGH**: 5 vehicles need oil changes within 7 days
3. **MEDIUM**: Transmission repair in progress (LA-2002)
4. **ONGOING**: Minor safety incident under investigation

---

## Step-by-Step Walkthrough

### Walkthrough 1: Admin Overview (10 minutes)

**Goal:** Show complete system capabilities

1. **Login as Admin**
   - Use admin@demofleet.com / Demo@123
   - Note the comprehensive dashboard

2. **Review Dashboard Alerts**
   ```
   ⚠️ CRITICAL: 1 vehicle inspection overdue
   ⚠️ HIGH: 5 maintenance items due soon
   ℹ️ INFO: 8 work orders in progress
   ```

3. **Explore Vehicle Fleet**
   - Navigate to Vehicles
   - Show filters: Status, Type, Location
   - Open vehicle detail: NYC-1001 (Honda Accord)
   - Review: Specs, Odometer, Maintenance history, Fuel logs

4. **Check Work Orders**
   - Navigate to Work Orders
   - Filter by Status: "Overdue"
   - Show critical item: WO-2024-027 (inspection)
   - Demonstrate work order assignment

5. **Review Maintenance Schedules**
   - Navigate to Maintenance > Schedules
   - Show upcoming services
   - Highlight overdue items
   - Create new schedule (demo)

6. **Examine Fleet Analytics**
   - Navigate to Reports
   - Show fuel cost trends
   - Display maintenance costs
   - Review fleet utilization

---

### Walkthrough 2: Fleet Manager Daily Operations (15 minutes)

**Goal:** Show day-to-day fleet management

1. **Login as Fleet Manager**
   - Use manager@demofleet.com / Demo@123

2. **Morning Dashboard Review**
   - Check notifications (5 unread)
   - Review critical alerts
   - Note vehicles requiring attention

3. **Address Overdue Maintenance**
   - Navigate to WO-2024-027 (overdue inspection)
   - Assign to technician
   - Schedule for today
   - Send notification to driver

4. **Plan Daily Routes**
   - Navigate to Routes
   - Review in-progress routes:
     - NYC-PHI Run (in progress)
     - SEA-PORT Route (in progress)
   - Create new route (demo):
     - Select vehicle
     - Define waypoints
     - Estimate duration

5. **Monitor Vehicle Status**
   - Check real-time vehicle locations
   - Review fuel levels
   - Identify vehicles needing service

6. **Assign Drivers**
   - Navigate to Drivers
   - View available drivers
   - Assign driver to vehicle
   - Check license expiration dates

7. **Review Costs**
   - Open Cost Reports
   - Filter by last 30 days
   - Show fuel costs by vehicle
   - Display maintenance expenses

---

### Walkthrough 3: Technician Work Order Management (12 minutes)

**Goal:** Show maintenance workflow

1. **Login as Technician**
   - Use tech@demofleet.com / Demo@123

2. **View Assigned Work Orders**
   - Navigate to My Work Orders
   - Show 8 active assignments
   - Sort by priority

3. **Work on Critical Repair**
   - Open WO-2024-011 (transmission repair)
   - Review job details
   - Add progress notes
   - Log parts used
   - Update labor hours

4. **Complete Simple Service**
   - Open WO-2024-015 (oil change)
   - Mark as in-progress
   - Add completion notes:
     ```
     Oil change completed
     Filter replaced
     Multi-point inspection: OK
     Next service: 23,500 miles
     ```
   - Log parts: $45
   - Log labor: 1 hour @ $100
   - Mark as completed

5. **Create New Work Order**
   - Vehicle needs attention
   - Create work order:
     - Vehicle: CHI-3002
     - Type: Brake inspection
     - Priority: Medium
     - Description: Customer reports squeaking
   - Assign to self
   - Schedule for tomorrow

---

### Walkthrough 4: Driver Experience (8 minutes)

**Goal:** Show driver-facing features

1. **Login as Driver**
   - Use driver1@demofleet.com / Demo@123

2. **View Assigned Vehicle**
   - See assigned vehicle: NYC-1001
   - Check vehicle status
   - Review current odometer: 28,500 miles

3. **Complete Pre-Trip Inspection**
   - Navigate to Inspections
   - Start new pre-trip inspection
   - Check all items:
     - ✅ Tires
     - ✅ Lights
     - ✅ Fluids
     - ✅ Brakes
     - ✅ Mirrors
   - Submit inspection

4. **View Assigned Route**
   - Navigate to Routes
   - Open NYC-PHI Run
   - Review waypoints
   - Check estimated arrival time

5. **Log Fuel Purchase**
   - Navigate to Fuel
   - Add transaction:
     - Location: Shell - 42nd Street, NY
     - Gallons: 12.5
     - Price: $3.89/gal
     - Odometer: 28,500
   - Submit

---

## Key Features to Showcase

### 1. Vehicle Management
- **Complete vehicle profiles** with VIN, make, model, year
- **Real-time status tracking** (active, maintenance, out of service)
- **Odometer and engine hours** tracking
- **GPS tracking** (simulated with lat/long)
- **Telematics integration** ready
- **Photo attachments** for vehicle documentation

### 2. Maintenance Operations
- **Automated scheduling** based on miles/time/hours
- **Work order workflow** (open → in progress → completed)
- **Parts and labor cost tracking**
- **Overdue alerts** with priority levels
- **Technician assignments**
- **Service history** for each vehicle

### 3. Fuel Management
- **Transaction logging** with location
- **Price per gallon tracking**
- **Fuel type** (gasoline, diesel, electric)
- **Cost analytics** by vehicle, driver, time period
- **Fuel card integration** ready
- **MPG calculations**

### 4. Electric Vehicle Support
- **Charging station management**
- **Charging session tracking** (kWh, cost, duration)
- **Battery level monitoring**
- **Public vs. private charging**
- **Power level tracking** (Level 2, DC Fast)
- **Cost per kWh analytics**

### 5. Route Planning
- **Multi-stop route creation**
- **Distance and duration estimates**
- **Vehicle and driver assignment**
- **Real-time status tracking**
- **Actual vs. planned comparison**
- **Route optimization** ready

### 6. Driver Management
- **Complete driver profiles**
- **CDL tracking** with class and endorsements
- **License expiration alerts**
- **Medical card tracking**
- **Safety scores**
- **Performance metrics** (miles driven, incidents)
- **Emergency contact information**

### 7. Safety & Compliance
- **Incident tracking** with severity levels
- **OSHA reporting** capability
- **Insurance claim integration**
- **Root cause analysis**
- **Corrective action tracking**
- **DOT compliance** features

### 8. Inspections
- **Customizable inspection forms**
- **Pre-trip / post-trip / annual**
- **Pass / fail / needs repair status**
- **Defect documentation**
- **Digital signatures**
- **Photo attachments**

### 9. Geofencing
- **Service territory definitions**
- **Facility perimeter monitoring**
- **Restricted zone alerts**
- **Entry/exit notifications**
- **Radius-based fencing**
- **Polygon fencing** ready

### 10. Fleet Policies
- **Speed limit enforcement**
- **Idle time restrictions**
- **Operating hours policies**
- **Maintenance requirements**
- **Safety thresholds** (harsh braking, acceleration)
- **Violation tracking** and alerts

### 11. Vendor Management
- **Parts supplier tracking**
- **Service center relationships**
- **Fuel provider management**
- **Contact information**
- **Purchase order integration** ready

### 12. Analytics & Reporting
- **Fleet dashboard** with KPIs
- **Cost analysis** (fuel, maintenance, total)
- **Utilization metrics**
- **Maintenance trends**
- **Safety analytics**
- **Custom date ranges**
- **Export capabilities**

### 13. Notifications
- **Real-time alerts** (maintenance, violations, incidents)
- **Priority levels** (low, normal, high, urgent)
- **Read/unread tracking**
- **Email integration** ready
- **SMS capability** ready

### 14. Multi-Tenant Architecture
- **Complete data isolation** by tenant
- **Tenant-specific settings**
- **Scalable design**
- **Custom domains** supported

---

## Demo Scenarios

### Scenario 1: Critical Maintenance Issue

**Situation:** A vehicle's annual inspection has expired and must be addressed immediately.

**Steps:**
1. Login as Fleet Manager
2. Navigate to Notifications
3. See CRITICAL alert: "Vehicle NYC-1302 inspection overdue"
4. Click alert → opens Work Order WO-2024-027
5. Take the vehicle out of service:
   - Navigate to Vehicles
   - Find NYC-1302
   - Change status to "Out of Service"
6. Assign work order to technician
7. Schedule for immediate service
8. Send notification to driver (if assigned)

**Talking Points:**
- System automatically tracks compliance deadlines
- Critical alerts ensure nothing falls through cracks
- One-click workflow from alert to action
- Automatic status updates prevent unsafe operation

---

### Scenario 2: Route Planning & Execution

**Situation:** Need to plan and execute a delivery route from NYC to Philadelphia.

**Steps:**
1. Login as Fleet Manager
2. Navigate to Routes
3. See in-progress route: NYC-PHI Run
4. Review details:
   - Vehicle: NYC-1002 (Honda Accord)
   - Driver: James Thompson
   - Distance: 95 miles
   - Status: In Progress (started at 8:05 AM)
5. Monitor progress on map (simulated)
6. Create new route for tomorrow:
   - Click "New Route"
   - Name: "NYC-BOS Express"
   - Select vehicle with appropriate range
   - Add waypoints
   - Assign driver
   - Set departure time

**Talking Points:**
- Simple route creation interface
- Real-time tracking capability
- Historical data for route optimization
- Driver and vehicle assignment in one place

---

### Scenario 3: Preventive Maintenance Workflow

**Situation:** Vehicle is approaching oil change interval.

**Steps:**
1. Login as Admin
2. Navigate to Maintenance → Schedules
3. Filter for "Due Soon"
4. Find: Honda Accord NYC-1003, Oil Change due at 18,500 miles (currently 18,200)
5. Create work order:
   - Auto-populated from schedule
   - Assign to technician
   - Schedule date
6. Switch to Technician view
7. Complete the work order:
   - Mark in progress
   - Add notes
   - Log parts ($45) and labor (1.5 hrs)
   - Mark completed
8. System automatically:
   - Updates maintenance schedule
   - Calculates next service date
   - Clears due-soon alert

**Talking Points:**
- Proactive maintenance prevents breakdowns
- Automated scheduling based on business rules
- Complete cost tracking per service
- Service history always available

---

### Scenario 4: EV Fleet Management

**Situation:** Managing electric vehicle charging and range.

**Steps:**
1. Login as Fleet Manager
2. Navigate to Vehicles
3. Filter by Fuel Type: "Electric"
4. View 5 EVs across fleet
5. Select Tesla Model 3 (NYC-1005)
6. Review:
   - Current battery level (in telematics)
   - Recent charging sessions
   - Cost per kWh vs. gasoline equivalent
7. Navigate to Charging Stations
8. Show 8 charging locations
9. View charging session history:
   - 30 sessions over 3 months
   - Average cost: $12-15 per session
   - Average kWh: 35-40
10. Compare costs to gas vehicles

**Talking Points:**
- Complete EV fleet support
- Charging station management
- Cost comparison tools
- Range monitoring
- Public vs. private charging tracking

---

### Scenario 5: Safety Incident Response

**Situation:** A minor safety incident has been reported.

**Steps:**
1. Login as Admin
2. Navigate to Safety → Incidents
3. Review incident INC-2024-005:
   - Type: Equipment damage
   - Severity: Minor
   - Vehicle: NYC-1202 (Ford Transit)
   - Status: Investigating
   - Description: Side mirror damaged entering service bay
4. Review incident details:
   - Date/time: Nov 1, 8:30 AM
   - Location: HQ Depot
   - Damage cost estimate: $225
   - No injuries
5. Take action:
   - Create work order for repair
   - Document root cause
   - Add corrective actions
   - Update status to "Resolved"
6. Review incident trends:
   - 5 incidents in 3 months
   - All minor severity
   - $2,075 total damage cost

**Talking Points:**
- Complete incident tracking
- Root cause analysis
- Integration with work orders
- Safety trend analysis
- Compliance ready (OSHA reporting)

---

### Scenario 6: Driver Performance Review

**Situation:** Review driver performance and compliance.

**Steps:**
1. Login as Fleet Manager
2. Navigate to Drivers
3. Select driver: Maria Rodriguez
4. Review profile:
   - License: D2345678 (NY, CDL Class B)
   - Expires: Nov 20, 2025 (expiring soon!)
   - Medical card: Valid until Jan 15, 2026
   - Safety score: 99.2 (excellent)
   - Total miles: 145,000
   - Violations: 0
   - Incidents: 0
5. Create alert for license renewal
6. Assign vehicle based on CDL class
7. Review recent activities:
   - Routes completed
   - Fuel transactions
   - Inspections performed

**Talking Points:**
- Complete driver compliance tracking
- Automated expiration alerts
- Performance metrics
- Safety scoring
- Proper vehicle assignment based on qualifications

---

## Troubleshooting

### Cannot Login

**Issue:** Login fails with correct credentials

**Solutions:**
1. Verify you're using the correct email format
2. Password is case-sensitive: `Demo@123`
3. Clear browser cache and cookies
4. Try a different browser
5. Check if demo has been reset recently

---

### Missing Data

**Issue:** Fewer vehicles/records than expected

**Solutions:**
1. Check tenant filter (should show Demo Fleet Corporation)
2. Verify data was loaded correctly:
   ```sql
   SELECT COUNT(*) FROM vehicles WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
   ```
3. Reset demo environment (see below)

---

### Slow Performance

**Issue:** System running slowly

**Solutions:**
1. Check database connection
2. Verify adequate resources (RAM, CPU)
3. Clear browser cache
4. Check for database index issues
5. Restart application server

---

### Database Connection Error

**Issue:** Cannot connect to database

**Solutions:**
1. Verify PostgreSQL is running
2. Check connection settings in `.env`
3. Verify database exists: `fleetmanagement`
4. Test connection:
   ```bash
   psql -h localhost -U postgres -d fleetmanagement
   ```

---

## Resetting the Demo

### Quick Reset

To restore demo to fresh state:

```bash
cd /path/to/fleet
./scripts/reset-demo.sh
```

This will:
1. ✅ Backup current demo data
2. ✅ Load fresh demo data
3. ✅ Clear user sessions
4. ✅ Verify data integrity
5. ✅ Display credentials

### Manual Reset

If script fails, manually reset:

```bash
# Connect to database
psql -U postgres -d fleetmanagement

# Run demo data script
\i /path/to/fleet/scripts/seed-demo-data.sql

# Verify
SELECT COUNT(*) FROM vehicles WHERE tenant_id = '11111111-1111-1111-1111-111111111111';
```

### Environment Variables

The reset script uses these environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=fleetmanagement
export DB_USER=postgres
export DB_PASSWORD=your_password
export BACKUP_DIR=/path/to/backups
```

---

## Tips for Successful Demos

### Before the Demo

1. **Reset the environment** to ensure fresh data
2. **Test all login credentials**
3. **Identify 2-3 key scenarios** to show
4. **Have backup browser** ready
5. **Close unnecessary browser tabs**
6. **Disable notifications** on your computer
7. **Prepare notes** on talking points

### During the Demo

1. **Start with the dashboard** - immediate impact
2. **Show critical alerts** - demonstrate value
3. **Use realistic scenarios** - tell a story
4. **Highlight automation** - show time savings
5. **Compare to manual processes** - emphasize ROI
6. **Ask questions** - engage the audience
7. **Be prepared to go off-script** - follow interest

### After the Demo

1. **Provide credentials** for self-exploration
2. **Share documentation** links
3. **Schedule follow-up** if interested
4. **Collect feedback**
5. **Reset demo** for next presentation

---

## Next Steps

- See [DEMO_TOUR.md](./DEMO_TOUR.md) for guided presentation scripts
- See [SALES_PRESENTATION.md](./SALES_PRESENTATION.md) for ROI and pricing
- See [API.md](./API.md) for technical integration details
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

---

## Support

For questions or issues with the demo environment:

- Documentation: `/docs` folder
- API Reference: `/docs/API.md`
- Technical Support: tech@fleetmanagement.com
- Sales Inquiries: sales@fleetmanagement.com

---

**Demo Version:** 1.0
**Last Updated:** November 8, 2024
**Maintained By:** Fleet Management System Team
