# Fleet Management iOS App - Administrator Guide

**Version:** 1.0
**Last Updated:** November 2025
**Target Audience:** Fleet Administrators, IT Managers, System Administrators

---

## Table of Contents

1. [Introduction](#introduction)
2. [User Management](#user-management)
3. [Fleet Configuration](#fleet-configuration)
4. [Report Generation and Interpretation](#report-generation-and-interpretation)
5. [Data Export Procedures](#data-export-procedures)
6. [Integration with Backend Systems](#integration-with-backend-systems)
7. [Security and Compliance Management](#security-and-compliance-management)
8. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting Common Admin Issues](#troubleshooting-common-admin-issues)

---

## Introduction

### Purpose of This Guide

This guide provides fleet administrators with comprehensive instructions for managing the Fleet Management iOS mobile application, including user provisioning, configuration, reporting, security, and integration with backend systems.

### Administrator Roles

The Fleet Management system supports three administrator levels:

| Role | Permissions | Typical Use Case |
|------|-------------|------------------|
| **Super Admin** | Full system access, all configurations, user management | IT Directors, System Administrators |
| **Fleet Manager** | Fleet operations, driver management, reports | Fleet Managers, Operations Managers |
| **Team Lead** | Limited driver management, view reports | Team Supervisors, Shift Leads |

### Access Requirements

- **Web Dashboard Access:** https://dashboard.fleetmanagement.com
- **Admin Portal:** https://admin.fleetmanagement.com
- **API Console:** https://api.fleetmanagement.com/console
- **Admin Credentials:** Contact IT department for initial setup

### System Architecture Overview

```
Mobile App (iOS) <-> API Gateway <-> Backend Services <-> Database
                        |
                        +--> Azure App Services
                        +--> Azure Cosmos DB
                        +--> Azure Storage (photos)
                        +--> Azure Active Directory (auth)
```

---

## User Management

### Adding New Drivers

#### Via Web Dashboard

1. **Navigate to User Management:**
   - Login to admin dashboard
   - Click "Users" in left sidebar
   - Click "+ Add User" button

2. **Enter Driver Information:**
   - **Email Address:** Driver's work email (required, used for login)
   - **Full Name:** First and last name
   - **Employee ID:** Company employee identifier
   - **Phone Number:** Mobile phone for notifications
   - **License Number:** Driver's license number
   - **License Expiration:** DL expiration date (triggers renewal alerts)
   - **Department:** Assign to department/team
   - **Manager:** Select reporting manager

3. **Set User Role:**
   - **Driver:** Standard mobile app access
   - **Team Lead:** Can view team member data
   - **Fleet Manager:** Elevated access to fleet operations

4. **Configure Permissions:**
   - **Trip Tracking:** Enable/disable trip recording
   - **OBD2 Access:** Allow OBD2 diagnostics
   - **Vehicle Assignment:** Allow driver to change assigned vehicle
   - **Maintenance Reporting:** Can report maintenance issues
   - **Photo Upload:** Can upload inspection photos

5. **Send Invitation:**
   - Click "Send Invitation Email"
   - Driver receives email with:
     - App Store download link
     - Temporary password
     - Setup instructions
   - Driver must change password on first login

6. **Assign Initial Vehicle (optional):**
   - Select vehicle from dropdown
   - Set as default vehicle
   - Driver can change if permission granted

#### Via Bulk Import

For adding multiple drivers:

1. **Download Template:**
   - Users > Import Users > Download CSV Template
   - Template includes all required fields

2. **Populate CSV:**
   ```csv
   email,first_name,last_name,employee_id,phone,license_number,license_expiration,department,role
   jsmith@company.com,John,Smith,EMP001,555-0100,DL123456,2025-12-31,Operations,driver
   mjohnson@company.com,Mary,Johnson,EMP002,555-0101,DL789012,2026-03-15,Maintenance,driver
   ```

3. **Upload and Validate:**
   - Users > Import Users > Upload CSV
   - System validates data format
   - Review validation errors if any
   - Correct errors and re-upload

4. **Confirm Import:**
   - Review summary of users to be created
   - Click "Confirm Import"
   - Invitation emails sent automatically

5. **Monitor Import Progress:**
   - View import status in "Import History"
   - Failed imports listed with error reasons
   - Re-try failed imports individually

#### Via API (Programmatic)

For integration with HR systems:

```bash
curl -X POST https://api.fleetmanagement.com/v1/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "employee_id": "EMP123",
    "role": "driver",
    "department": "Operations",
    "send_invitation": true
  }'
```

### Managing Existing Users

#### Modifying User Details

1. **Locate User:**
   - Users > Search by name or email
   - Or filter by department, role, status

2. **Edit User Profile:**
   - Click on user name
   - Click "Edit Profile"
   - Update any field
   - Click "Save Changes"

3. **Update Permissions:**
   - User Profile > Permissions tab
   - Toggle permissions on/off
   - Changes take effect immediately
   - Driver sees permission changes after next sync

#### Deactivating Users

When driver leaves company:

1. **Deactivate Account:**
   - User Profile > Actions > Deactivate
   - Confirm deactivation
   - User cannot login after deactivation
   - Data preserved for records

2. **Reassign Data:**
   - Active trips reassigned to manager
   - Assigned vehicles released
   - Pending tasks reassigned

3. **Archive User Data:**
   - User Profile > Actions > Archive Data
   - Moves historical data to archive storage
   - Reduces active database size
   - Data retrievable if needed

#### Resetting Passwords

**User-Initiated Reset:**
- Driver uses "Forgot Password" in mobile app
- Reset link sent to registered email
- No admin action required

**Admin-Initiated Reset:**
1. User Profile > Security > Reset Password
2. Choose reset method:
   - Send reset email to user
   - Generate temporary password
3. If temporary password:
   - Copy password
   - Securely provide to user
   - User must change on first login

#### Managing User Roles

Promoting or demoting users:

1. User Profile > Role tab
2. Select new role from dropdown
3. Review permission changes
4. Click "Update Role"
5. User notified via email
6. Changes reflected after next app sync

### Group Management

#### Creating User Groups

Groups simplify bulk user management:

1. **Create Group:**
   - Users > Groups > Create Group
   - Group Name: e.g., "Night Shift Drivers"
   - Description: Group purpose
   - Department: Optional association

2. **Add Members:**
   - Search and select users
   - Or import from CSV
   - Click "Add to Group"

3. **Set Group Permissions:**
   - Apply default permissions to all members
   - Override individual permissions if needed

4. **Assign Group Vehicle Pool:**
   - Select vehicles available to group
   - Members can only use assigned vehicles

#### Using Groups Effectively

- **Shift Groups:** Night shift, day shift, weekend
- **Department Groups:** Sales, delivery, maintenance
- **Region Groups:** North region, south region
- **Role Groups:** Senior drivers, trainee drivers

### Vehicle Assignment

#### Assigning Vehicles to Drivers

**Permanent Assignment:**
1. Vehicle Profile > Assigned Driver
2. Select driver from dropdown
3. Set assignment type: "Primary Driver"
4. Driver always sees this vehicle first in app

**Temporary Assignment:**
1. Vehicle Profile > Assigned Driver
2. Select driver and set date range
3. Assignment auto-expires after end date
4. Useful for vacation coverage

**Pool Assignment:**
1. Create vehicle pool: Fleet > Pools > Create
2. Add vehicles to pool
3. Assign pool to driver group
4. Drivers select from pool at trip start

#### Managing Vehicle Reassignments

When vehicles change drivers:

1. **End Current Assignment:**
   - Vehicle Profile > Assignments > Current
   - Click "End Assignment"
   - Select end date (today or future)

2. **Create New Assignment:**
   - Click "Assign to New Driver"
   - Select driver and start date
   - Gap in assignment allowed if vehicle in maintenance

3. **View Assignment History:**
   - Vehicle Profile > Assignments > History
   - Shows all past drivers
   - Useful for maintenance tracking

### License and Certification Management

#### Tracking Driver Licenses

1. **View Expiring Licenses:**
   - Users > Licenses > Expiring Soon
   - Shows licenses expiring in next 60 days
   - Sort by expiration date

2. **Set Renewal Reminders:**
   - User Profile > Licenses > Settings
   - Set reminder days before expiration (30, 60, 90 days)
   - Automatic email/push notifications

3. **Update License Information:**
   - User Profile > Licenses > Edit
   - Upload new license image
   - Update expiration date
   - System clears "expiring" flag

4. **Block Expired Drivers:**
   - Settings > Security > License Enforcement
   - Enable "Block app access for expired licenses"
   - Drivers cannot start trips if license expired
   - Automatic enforcement

#### Managing Certifications

Track special certifications (CDL, hazmat, etc.):

1. **Add Certification Type:**
   - Settings > Certifications > Add Type
   - Name: e.g., "Hazmat Certification"
   - Expiration tracking: Yes/No
   - Required for: Select vehicle types

2. **Assign to Driver:**
   - User Profile > Certifications > Add
   - Select certification type
   - Enter ID number and expiration
   - Upload certificate image

3. **Enforce Requirements:**
   - Vehicle Profile > Requirements
   - Select required certifications
   - Drivers without certification cannot select vehicle

---

## Fleet Configuration

### Vehicle Management

#### Adding New Vehicles

1. **Navigate to Fleet:**
   - Dashboard > Fleet > Add Vehicle

2. **Enter Vehicle Information:**
   ```
   Required Fields:
   - VIN (17 characters)
   - Make (e.g., Ford, Chevrolet)
   - Model (e.g., F-150, Silverado)
   - Year (4 digits)
   - License Plate
   - Vehicle Type (truck, van, sedan, etc.)

   Optional Fields:
   - Color
   - Odometer reading
   - Purchase date
   - Purchase price
   - Department assignment
   - Custom ID/Number
   ```

3. **Upload Vehicle Photos:**
   - Front, rear, sides
   - Interior
   - VIN plate photo
   - Useful for identification and damage comparison

4. **Configure Tracking Settings:**
   - **Trip Auto-Start:** Automatically start trip when vehicle moves
   - **OBD2 Required:** Require OBD2 connection for trips
   - **Geofence Alerts:** Alert when vehicle leaves designated area
   - **Speed Limit Alerts:** Set max speed threshold
   - **Idle Time Alerts:** Alert after X minutes idle

5. **Set Maintenance Schedule:**
   - Oil change interval (miles or days)
   - Tire rotation interval
   - Inspection intervals
   - Custom maintenance tasks

6. **Save Vehicle:**
   - Click "Create Vehicle"
   - Vehicle appears in fleet list
   - Immediately available for assignment

#### Editing Vehicle Information

1. **Locate Vehicle:**
   - Fleet > All Vehicles
   - Search by VIN, plate, or custom ID
   - Or filter by type, status, department

2. **Update Details:**
   - Click vehicle name
   - Click "Edit" button
   - Modify any field
   - Click "Save Changes"

3. **Update Odometer:**
   - Vehicle Profile > Odometer > Update
   - Enter current reading
   - Date/time auto-recorded
   - Used for maintenance scheduling

#### Decommissioning Vehicles

When retiring vehicles:

1. **Mark as Decommissioned:**
   - Vehicle Profile > Status > Decommission
   - Select decommission date
   - Select reason: Sold, Scrapped, Transferred, etc.

2. **Close Open Items:**
   - End any active trips
   - Complete pending maintenance
   - Upload final photos

3. **Archive Data:**
   - Vehicle Profile > Archive
   - Historical data preserved
   - Vehicle removed from active fleet

4. **Update Records:**
   - Update disposal documentation
   - Record sale price or disposal cost

### Maintenance Configuration

#### Setting Maintenance Schedules

**Recurring Maintenance:**

1. **Create Maintenance Template:**
   - Fleet > Maintenance > Templates > Create
   - Template name: "Oil Change - 5000 miles"
   - Trigger type: Mileage or Time
   - Interval: 5000 miles or 90 days
   - Cost estimate: $50
   - Service items checklist

2. **Assign to Vehicles:**
   - Apply template to:
     - Individual vehicles
     - Vehicle types (all trucks)
     - Entire fleet
   - Set start date/mileage

3. **Configure Reminders:**
   - Reminder at 80% interval (4000 miles)
   - Reminder at 100% interval (5000 miles)
   - Overdue alert at 110% (5500 miles)
   - Notifications to: Driver, Manager, Admin

**One-Time Maintenance:**

1. **Schedule Service:**
   - Vehicle Profile > Maintenance > Schedule
   - Service type: Repair, Inspection, Upgrade
   - Due date
   - Assign to service provider
   - Estimated cost and duration

2. **Track Completion:**
   - Service provider or admin marks complete
   - Upload invoice
   - Update vehicle status
   - Record actual cost and parts used

#### Maintenance Tracking

1. **View Due Maintenance:**
   - Dashboard > Maintenance > Due Soon
   - Color coded:
     - Green: Not due yet
     - Yellow: Due soon (within 500 miles or 7 days)
     - Red: Overdue

2. **Review Maintenance History:**
   - Vehicle Profile > Maintenance > History
   - Filterable by date range, type
   - Export to CSV for records

3. **Analyze Maintenance Costs:**
   - Reports > Maintenance Costs
   - View by vehicle, type, time period
   - Identify high-cost vehicles
   - Budget planning

### OBD2 Adapter Management

#### Registering OBD2 Adapters

1. **Add Adapter to Inventory:**
   - Fleet > OBD2 Adapters > Add
   - Enter:
     - MAC Address (found on adapter)
     - Serial Number
     - Model (ELM327 v1.5, etc.)
     - Purchase date
     - Purchase order number

2. **Assign to Vehicle:**
   - Adapter Profile > Assign to Vehicle
   - Select vehicle
   - Document installation date
   - Note installation location (for retrieval)

3. **Configure Adapter Settings:**
   - Protocol: Auto-detect or manual
   - Data collection frequency
   - Diagnostic trouble codes monitoring
   - Real-time data parameters

#### Monitoring Adapter Health

1. **View Adapter Status:**
   - Fleet > OBD2 Adapters > Status Dashboard
   - Shows:
     - Online/offline status
     - Last connection time
     - Connection stability %
     - Data quality metrics

2. **Troubleshoot Issues:**
   - Identify adapters with frequent disconnections
   - Review connection logs
   - Schedule replacement for failing adapters

3. **Track Adapter Lifecycle:**
   - Monitor usage hours
   - Track failure rates
   - Plan replacements proactively

### Geofencing and Zones

#### Creating Geofences

1. **Define Geofence:**
   - Fleet > Geofences > Create
   - Geofence name: "Main Office"
   - Type: Circle or Polygon
   - Draw on map or enter coordinates

2. **Set Geofence Rules:**
   - **Entry Alerts:** Notify when vehicle enters
   - **Exit Alerts:** Notify when vehicle leaves
   - **Allowed Hours:** Vehicle should only be in zone during specific hours
   - **Speed Limit:** Max speed within zone

3. **Assign Vehicles:**
   - Select which vehicles geofence applies to
   - Or apply to all vehicles

4. **Configure Notifications:**
   - Who to notify: Driver, Manager, Admin
   - Notification method: Push, Email, SMS
   - Notification frequency: Every time or daily summary

#### Monitoring Geofence Violations

1. **View Violations Dashboard:**
   - Reports > Geofences > Violations
   - Filter by:
     - Geofence
     - Vehicle
     - Date range
     - Violation type

2. **Review Individual Violations:**
   - Click violation to see details:
     - Timestamp
     - Vehicle and driver
     - Location on map
     - Duration outside zone
     - Photos (if captured)

3. **Take Action:**
   - Contact driver for explanation
   - Document in driver file
   - Adjust geofence if boundaries incorrect
   - Escalate if policy violation

---

## Report Generation and Interpretation

### Standard Reports

#### Trip Reports

**Generating Trip Reports:**

1. **Navigate to Reports:**
   - Dashboard > Reports > Trips

2. **Select Report Parameters:**
   - Date range: Custom, Last 7 days, Last 30 days, etc.
   - Vehicles: All or specific vehicles
   - Drivers: All or specific drivers
   - Departments: Filter by department
   - Trip type: All, Business, Personal (if tracked)

3. **Choose Report Format:**
   - **Summary:** Total trips, miles, hours
   - **Detailed:** Every trip with full details
   - **Comparison:** Compare time periods or drivers

4. **Generate Report:**
   - Click "Generate Report"
   - Processing time: 5-60 seconds depending on data size
   - View in browser or download

**Interpreting Trip Reports:**

| Metric | What It Means | Typical Values | Action If Abnormal |
|--------|---------------|----------------|-------------------|
| Total Miles | Sum of all trip distances | Varies by role | Very low: Underutilization<br>Very high: Excessive use |
| Average Trip Length | Miles per trip | 10-50 miles | Short trips: Inefficient routing<br>Long trips: Review necessity |
| Idle Time % | % of trip time not moving | 10-20% | >30%: Excessive idling, wasted fuel |
| Average Speed | Mean speed across trips | 25-45 mph | <20: Traffic congestion<br>>60: Speeding concerns |
| Hard Braking Events | Sudden stops | <5 per 100 miles | >10: Unsafe driving, need training |
| After Hours Usage | Trips outside work hours | 0-5% | >10%: Unauthorized use |

#### Maintenance Reports

**Generating Maintenance Reports:**

1. **Reports > Maintenance > Overview**

2. **Select Filters:**
   - Date range
   - Vehicles or vehicle types
   - Maintenance types: All, Oil Change, Repairs, Inspections
   - Status: Completed, Pending, Overdue

3. **Key Reports:**
   - **Maintenance Costs by Vehicle:** Identify expensive vehicles
   - **Maintenance Schedule Adherence:** On-time vs overdue
   - **Breakdown Analysis:** Frequency and causes
   - **Service Provider Performance:** Compare vendors

**Interpreting Maintenance Reports:**

- **High Cost Vehicles:** Consider retirement if costs exceed 50% of value
- **Frequent Repairs:** May indicate driver issues or vehicle defects
- **Overdue Maintenance:** Risk of breakdowns, safety issues, warranty voidance
- **Service Provider Delays:** Consider alternative vendors

#### Fuel Efficiency Reports

**Generating Fuel Reports:**

1. **Reports > Fuel > Efficiency**

2. **Data Sources:**
   - OBD2 calculated MPG
   - Manual fuel entry (if used)
   - Fuel card integration (if configured)

3. **Report Types:**
   - MPG by vehicle
   - MPG by driver
   - Fuel cost analysis
   - Trend over time

**Interpreting Fuel Reports:**

| Vehicle Type | Expected MPG | Action Threshold |
|--------------|--------------|------------------|
| Sedan | 25-30 MPG | <20 MPG: Investigate |
| SUV | 18-24 MPG | <15 MPG: Investigate |
| Truck (half-ton) | 15-20 MPG | <12 MPG: Investigate |
| Van | 14-18 MPG | <11 MPG: Investigate |

**Low MPG Causes:**
- Aggressive driving (hard acceleration, speeding)
- Excessive idling
- Poor maintenance (tire pressure, air filter, etc.)
- Vehicle mechanical issues
- Frequent short trips (engine doesn't warm up)

#### Driver Performance Reports

**Generating Driver Reports:**

1. **Reports > Drivers > Performance**

2. **Metrics Included:**
   - **Safety Scores:**
     - Hard braking count
     - Rapid acceleration count
     - Speeding incidents
     - Hours of violation
   - **Efficiency:**
     - Miles per day
     - Trips per day
     - Idle time
     - Fuel efficiency
   - **Compliance:**
     - Trip logging compliance
     - Inspection completion rate
     - Maintenance reporting

3. **Scoring System:**
   - Each driver receives score 0-100
   - Based on weighted metrics
   - Benchmarked against fleet average

**Using Driver Reports:**

- **High Performers (85-100):** Recognition, bonuses, mentoring opportunities
- **Average Performers (70-84):** Standard monitoring
- **Low Performers (<70):** Coaching, training, review

**Driver Counseling Process:**

1. Review report with driver
2. Identify specific improvement areas
3. Set measurable goals (e.g., reduce hard braking by 50%)
4. Schedule follow-up in 30 days
5. Document in personnel file

### Custom Reports

#### Creating Custom Reports

1. **Reports > Custom > New Report**

2. **Select Data Sources:**
   - Trips
   - Vehicles
   - Drivers
   - Maintenance
   - OBD2 diagnostics
   - Geofences
   - Photos

3. **Choose Fields:**
   - Drag and drop desired fields
   - Configure calculated fields
   - Set filters and conditions

4. **Configure Grouping:**
   - Group by vehicle, driver, date, etc.
   - Aggregate functions: Sum, Average, Count, Min, Max

5. **Set Schedule:**
   - Run on demand
   - Or schedule: Daily, Weekly, Monthly
   - Email to recipients automatically

6. **Save Report Template:**
   - Name template for reuse
   - Share with other admins
   - Export template for backup

#### Report Automation

**Scheduled Reports:**

1. **Create Schedule:**
   - Custom Report > Schedule > New
   - Frequency: Daily, Weekly, Monthly, Quarterly
   - Day/time to generate
   - Time zone

2. **Configure Recipients:**
   - Email addresses (internal or external)
   - CC and BCC options
   - Custom email message

3. **Set Delivery Options:**
   - Inline in email or attachment
   - Format: PDF, Excel, CSV
   - Compression for large reports

4. **Monitor Scheduled Reports:**
   - Reports > Scheduled > Status
   - View generation history
   - Failed deliveries with error details

**Report API Access:**

For integration with BI tools:

```bash
# Get trip report data
curl -X GET "https://api.fleetmanagement.com/v1/reports/trips?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Data Export Procedures

### Exporting Fleet Data

#### Standard Data Exports

**Exporting Trip Data:**

1. **Navigate to Trips:**
   - Dashboard > Trips > All Trips

2. **Apply Filters:**
   - Date range
   - Vehicles, drivers, departments

3. **Export:**
   - Click "Export" button
   - Choose format:
     - **CSV:** For Excel, data analysis
     - **JSON:** For API integration
     - **PDF:** For documentation, reports
   - Download file

**Trip Export Fields:**

```csv
trip_id,vehicle_id,driver_id,start_time,end_time,start_location,end_location,distance_miles,duration_minutes,idle_time_minutes,max_speed_mph,average_speed_mph,fuel_used_gallons,trip_purpose,notes
```

**Exporting Vehicle Data:**

1. Fleet > All Vehicles > Export
2. Format: CSV, JSON, PDF
3. Includes:
   - Vehicle details
   - Current odometer
   - Assigned driver
   - Maintenance status
   - Last trip date

**Exporting User Data:**

1. Users > All Users > Export
2. Includes:
   - User profile information
   - Role and permissions
   - Assigned vehicles
   - License information
   - Last login date

### Compliance Exports

#### IFTA (International Fuel Tax Agreement) Reports

For tax reporting:

1. **Reports > Compliance > IFTA**

2. **Select Parameters:**
   - Quarter: Q1, Q2, Q3, Q4
   - Year
   - Jurisdiction: Select states/provinces

3. **Generate Report:**
   - Calculates miles driven per jurisdiction
   - Fuel consumed per jurisdiction
   - Tax owed/credited per jurisdiction

4. **Export:**
   - Format: IFTA-compliant PDF or CSV
   - Include supporting documentation
   - Detailed trip logs by state

#### Hours of Service (HOS) Exports

For DOT compliance:

1. **Reports > Compliance > HOS**

2. **Select Driver and Date Range**

3. **Export includes:**
   - Daily driving hours
   - On-duty hours
   - Off-duty hours
   - Violations (if any)
   - Certification statements

4. **Format:** DOT-compliant PDF

#### Vehicle Inspection Reports (DVIR)

1. **Reports > Compliance > DVIR**

2. **Export includes:**
   - Pre-trip inspections
   - Post-trip inspections
   - Defects reported
   - Repairs completed
   - Inspector signatures

3. **Format:** PDF with photos

### Bulk Data Operations

#### Backing Up All Data

**Manual Backup:**

1. **Settings > Data Management > Backup**

2. **Select Data Types:**
   - [ ] Users
   - [ ] Vehicles
   - [ ] Trips
   - [ ] Maintenance records
   - [ ] Photos
   - [ ] Reports

3. **Initiate Backup:**
   - Click "Start Backup"
   - Processing time: 10 minutes to 2 hours
   - Large photo libraries take longest

4. **Download Backup:**
   - Backup available as ZIP file
   - Contains:
     - CSV files for structured data
     - JSON files for complex data
     - Photos in folders
     - README with file descriptions

**Automated Backups:**

1. **Settings > Data Management > Automated Backups**

2. **Configure Schedule:**
   - Frequency: Daily, Weekly, Monthly
   - Time: Select off-peak hours
   - Retention: Keep last X backups

3. **Storage Location:**
   - Download to local storage
   - Upload to Azure Blob Storage
   - Upload to AWS S3
   - Upload to company NAS

4. **Notifications:**
   - Email on completion
   - Alert if backup fails

#### Restoring Data

**From Backup File:**

1. **Settings > Data Management > Restore**

2. **Upload Backup:**
   - Select ZIP file
   - System validates backup integrity

3. **Select Restore Options:**
   - **Full Restore:** Replace all data (DANGER)
   - **Selective Restore:** Choose specific records
   - **Merge:** Add backup data to existing data

4. **Conflict Resolution:**
   - If records exist:
     - Keep existing
     - Replace with backup
     - Merge (combine)

5. **Initiate Restore:**
   - Click "Start Restore"
   - Processing time varies
   - System offline during full restore

**Warning:** Full restore is destructive. Always backup current data first.

### Data Retention and Archiving

#### Setting Retention Policies

1. **Settings > Data Management > Retention**

2. **Configure Policies:**
   ```
   Trip Data: Retain 7 years (legal requirement)
   Photos: Retain 3 years
   Maintenance Records: Retain 5 years
   User Activity Logs: Retain 1 year
   System Logs: Retain 90 days
   ```

3. **Auto-Archive:**
   - Enable automatic archiving
   - Data older than retention period moved to archive
   - Archive storage cheaper than active database

4. **Archive Access:**
   - Archived data searchable
   - Retrieval time: 24-48 hours
   - Restore to active if needed

#### Deleting Old Data

**Permanent Deletion:**

1. **Settings > Data Management > Delete Old Data**

2. **Danger Zone - Permanent Actions:**
   - Delete trips older than X years
   - Delete deactivated user data
   - Delete archived vehicles

3. **Confirmation Required:**
   - Enter admin password
   - Type "DELETE" to confirm
   - No undo after deletion

4. **Compliance Check:**
   - System warns if deletion violates retention policy
   - Legal hold prevents deletion of certain data

---

## Integration with Backend Systems

### API Configuration

#### Generating API Keys

1. **Settings > Integrations > API Keys**

2. **Create New Key:**
   - Key name: "HR System Integration"
   - Permissions:
     - [ ] Read users
     - [ ] Write users
     - [ ] Read vehicles
     - [ ] Write vehicles
     - [ ] Read trips
     - [ ] Write trips
   - IP whitelist: Optional, restrict to specific IPs
   - Expiration: Never, or set expiration date

3. **Save and Copy Key:**
   - API key displayed once
   - Copy and store securely (password manager)
   - Cannot be retrieved later

4. **Test API Key:**
   ```bash
   curl -X GET "https://api.fleetmanagement.com/v1/test" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

5. **Monitor API Usage:**
   - Settings > Integrations > API Usage
   - View calls per day, errors, rate limits

#### API Rate Limits

| Plan | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Standard | 1,000 | 50/minute |
| Professional | 10,000 | 100/minute |
| Enterprise | 100,000 | 500/minute |

Rate limit headers in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1635724800
```

### HR System Integration

#### Automatic User Provisioning

**Integration Flow:**

1. New employee in HR system
2. HR system calls Fleet API to create user
3. User account created automatically
4. Invitation email sent
5. User appears in Fleet system

**API Endpoint:**

```bash
POST /v1/users
{
  "email": "newdriver@company.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "employee_id": "EMP9999",
  "department": "Sales",
  "role": "driver",
  "start_date": "2025-02-01",
  "send_invitation": true
}
```

**Sync Schedule:**
- Real-time: API call on each HR change
- Batch: Nightly sync at 2 AM
- Manual: Admin triggers sync

**Handling Departures:**

- HR system sends termination date
- Fleet system auto-deactivates user on that date
- Data archived, vehicles reassigned

### Telematics Integration

#### GPS Provider Integration

If using external GPS hardware:

1. **Settings > Integrations > GPS Providers**

2. **Add Provider:**
   - Provider: Geotab, Verizon Connect, Samsara, etc.
   - API credentials
   - Data sync interval: Real-time or batched

3. **Map Data Fields:**
   - Provider location → Fleet location
   - Provider speed → Fleet speed
   - Provider odometer → Fleet odometer

4. **Configure Sync:**
   - Pull trip data from GPS system
   - Or push trip data to GPS system
   - Bidirectional sync if needed

#### Fuel Card Integration

**Supported Providers:**
- WEX Fleet
- Comdata
- Voyager
- EFS

**Setup:**

1. **Settings > Integrations > Fuel Cards**

2. **Add Provider:**
   - Select provider
   - Enter account number
   - API credentials

3. **Auto-Match Transactions:**
   - System matches fuel transactions to trips
   - Based on date, time, location, vehicle
   - Manual review for unmatched

4. **Fuel Report:**
   - Compare fuel card data to OBD2 calculated fuel
   - Identify discrepancies (theft, inaccurate OBD2)

### Accounting System Integration

#### Expense Export

Export trip expenses to accounting systems:

1. **Reports > Accounting > Expense Export**

2. **Format Selection:**
   - QuickBooks (IIF or QBO)
   - Xero (CSV)
   - SAP (XML)
   - Generic CSV

3. **Export includes:**
   - Trip date and ID
   - Vehicle and driver
   - Mileage
   - Fuel cost
   - Maintenance costs
   - Cost center/department code

4. **Import to Accounting:**
   - Follow accounting system import procedure
   - Match chart of accounts

#### Asset Management Integration

Sync vehicle fleet with asset management:

1. **Settings > Integrations > Asset Management**

2. **Configure:**
   - Asset system: API or file export
   - Sync frequency: Daily
   - Asset fields mapping

3. **Sync Data:**
   - Vehicle details
   - Purchase information
   - Depreciation data
   - Current value
   - Disposal information

---

## Security and Compliance Management

### Access Control

#### Role-Based Access Control (RBAC)

**Predefined Roles:**

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Full system access, all settings, all data |
| **Fleet Manager** | Manage fleet, drivers, reports; no system config |
| **Team Lead** | View team data, assign vehicles; no editing |
| **Driver** | Mobile app only, own data only |
| **Viewer** | Read-only access to reports |
| **Maintenance** | Manage maintenance records and schedules |

**Custom Roles:**

1. **Settings > Security > Roles > Create Custom Role**

2. **Define Permissions:**
   - Select from 50+ granular permissions
   - Examples:
     - View all trips
     - Edit own trips only
     - Delete trips
     - Manage users in own department
     - Export data
     - Configure integrations

3. **Assign to Users:**
   - User can have multiple roles
   - Permissions are cumulative

#### Multi-Factor Authentication (MFA)

**Enforcing MFA:**

1. **Settings > Security > MFA**

2. **Configuration:**
   - Require MFA for: All users, Admins only, or Optional
   - MFA methods:
     - [ ] Authenticator app (TOTP)
     - [ ] SMS code
     - [ ] Email code
   - Grace period: Days before enforcement

3. **User Setup:**
   - User receives email to set up MFA
   - Scans QR code with authenticator app
   - Enters backup codes
   - MFA required on next login

4. **Admin Override:**
   - Can temporarily disable MFA for user
   - If user loses phone/access
   - Log all overrides

#### Session Management

**Session Settings:**

1. **Settings > Security > Sessions**

2. **Configure:**
   - Session timeout: 1 hour, 4 hours, 8 hours, 1 day
   - Idle timeout: 15, 30, 60 minutes
   - Concurrent sessions: Allow/block multiple logins
   - Remember device: 30 days

3. **Active Sessions:**
   - View all active user sessions
   - See device, location, IP address
   - Force logout suspicious sessions

### Data Security

#### Encryption

**Data at Rest:**
- All data encrypted using AES-256
- Database encryption enabled by default
- Encryption keys rotated annually
- Keys stored in Azure Key Vault

**Data in Transit:**
- All API calls use TLS 1.2 or higher
- Certificate pinning in mobile app
- HTTPS enforced (HTTP disabled)

**Mobile App Encryption:**
- Local database encrypted using SQLCipher
- Encryption key derived from user password
- Photos encrypted before upload
- Secure keychain for credentials

#### Audit Logging

**What's Logged:**
- All user logins and logouts
- Permission changes
- Data modifications (create, update, delete)
- Report generation
- Data exports
- API calls
- Configuration changes

**Viewing Audit Logs:**

1. **Settings > Security > Audit Logs**

2. **Filter Logs:**
   - Date range
   - User
   - Action type
   - Resource (users, vehicles, trips, etc.)

3. **Export Logs:**
   - Download as CSV for external analysis
   - Required for compliance audits

**Log Retention:**
- Standard: 1 year
- Compliance mode: 7 years
- Immutable (cannot be modified or deleted)

### Compliance Management

#### GDPR Compliance

**Right to Access:**

1. **User Profile > Privacy > Export My Data**
2. Generates ZIP with all user's personal data
3. Delivered within 30 days (usually immediate)

**Right to Erasure:**

1. **User Profile > Privacy > Request Deletion**
2. Admin reviews request
3. If approved:
   - Personal data deleted
   - Trip data anonymized (removed PII, kept for records)
   - Process logged
4. User notified of completion

**Data Processing Agreement:**
- Template available: Settings > Compliance > DPA
- Customizable for each customer
- Signed copy stored

#### CCPA Compliance

Similar to GDPR, with additional requirements:

1. **Do Not Sell My Data:**
   - User can opt out of data selling
   - Fleet app doesn't sell data, but option provided

2. **Notice at Collection:**
   - Privacy policy shown during signup
   - Explains what data is collected and why

#### DOT Compliance (for commercial fleets)

**ELD (Electronic Logging Device) Mode:**

1. **Settings > Compliance > ELD Mode > Enable**

2. **Configuration:**
   - Automatic duty status changes
   - Hours of service tracking
   - RODS (Record of Duty Status) generation
   - Driver certification prompts

3. **HOS Rules:**
   - 11-hour driving limit
   - 14-hour on-duty limit
   - 10-hour off-duty requirement
   - 30-minute break requirement

4. **Violations:**
   - Automatic alerts to driver and dispatcher
   - Cannot be overridden
   - Logged for DOT inspection

**Roadside Inspection:**

1. Driver provides login to inspector
2. Inspector views last 8 days of logs
3. Can print or email logs on-demand
4. Supports DOT Inspection via mobile app

### Privacy Settings

#### Configuring Privacy Controls

1. **Settings > Privacy > Controls**

2. **Location Tracking:**
   - Only during trips (default)
   - Always (background tracking)
   - Manual only (driver starts/stops)

3. **Data Sharing:**
   - Share anonymized data for app improvement
   - Share crash reports
   - Marketing communications opt-in

4. **Photo Privacy:**
   - Automatically strip EXIF location data
   - Blur faces in uploaded photos (AI-powered)
   - Watermark photos with timestamp

---

## Backup and Disaster Recovery

### Backup Strategy

#### Automated Backups

**Database Backups:**

- **Frequency:** Every 6 hours
- **Retention:**
  - Hourly backups: Last 48 hours
  - Daily backups: Last 30 days
  - Monthly backups: Last 12 months
  - Yearly backups: 7 years
- **Storage:** Azure Blob Storage (geo-redundant)
- **Encryption:** AES-256

**Photo Backups:**

- **Frequency:** Continuous (as uploaded)
- **Storage:** Azure Blob Storage with replication to secondary region
- **Retention:** Per retention policy
- **Redundancy:** 3 copies in primary region, 3 in secondary

**Configuration Backups:**

- **Frequency:** After each change
- **Retention:** Last 100 versions
- **Use Case:** Rollback configuration errors

#### Manual Backups

**Creating Manual Backup:**

1. **Settings > Data Management > Backup > Create Manual Backup**

2. **Select Scope:**
   - Entire system
   - Specific date range
   - Specific data types

3. **Backup Process:**
   - Queued for processing
   - Email notification on completion
   - Download link valid for 7 days

**Best Practices:**
- Manual backup before major changes (bulk imports, config changes)
- Before/after major version upgrades
- Before/after integrations setup

### Disaster Recovery

#### Recovery Time Objective (RTO) and Recovery Point Objective (RPO)

| Scenario | RTO | RPO | Explanation |
|----------|-----|-----|-------------|
| Server failure | 2 hours | 1 hour | Failover to standby server |
| Database corruption | 4 hours | 6 hours | Restore from last backup |
| Regional outage | 8 hours | 6 hours | Failover to secondary region |
| Complete disaster | 24 hours | 6 hours | Rebuild from backups |

#### Disaster Recovery Procedures

**Scenario 1: Database Corruption**

1. **Identify corruption:**
   - Monitoring alerts
   - User reports of missing/incorrect data

2. **Assess damage:**
   - Run database integrity check
   - Identify affected tables/records

3. **Isolate system:**
   - Put app in maintenance mode
   - Display message to users

4. **Restore from backup:**
   ```bash
   # Connect to Azure CLI
   az login

   # List available backups
   az sql db list-backups --resource-group fleet-rg --server fleet-server --database fleet-db

   # Restore to point in time
   az sql db restore --dest-name fleet-db-restored --edition Premium \
     --resource-group fleet-rg --server fleet-server \
     --name fleet-db --time "2025-01-15T10:00:00Z"
   ```

5. **Validate restore:**
   - Check row counts
   - Spot check critical records
   - Run data integrity tests

6. **Bring system online:**
   - Update connection strings to restored database
   - Remove maintenance mode
   - Monitor for issues

7. **Post-mortem:**
   - Document what happened
   - Identify root cause
   - Implement preventive measures

**Scenario 2: Regional Azure Outage**

1. **Confirm outage:**
   - Check Azure status page
   - Verify secondary region is healthy

2. **Initiate failover:**
   ```bash
   # Failover database to secondary region
   az sql failover-group failover --name fleet-fg \
     --resource-group fleet-rg --server fleet-server-secondary

   # Update DNS to point to secondary region
   az network dns record-set a update \
     --resource-group fleet-rg --zone-name fleetmanagement.com \
     --name api --set aRecords[0].ipv4Address=<secondary-ip>
   ```

3. **Notify users:**
   - Send status email
   - Update status page
   - Inform of any limitations in secondary region

4. **Monitor performance:**
   - Secondary region may have different capacity
   - Scale up if needed

5. **Failback (when primary recovered):**
   - Wait for primary region to be fully operational
   - Schedule maintenance window
   - Failback to primary region
   - Sync any data created in secondary

**Scenario 3: Data Loss (Accidental Deletion)**

1. **Stop sync:**
   - Prevent deletion from propagating
   - Settings > Sync > Pause All Syncs

2. **Identify extent:**
   - How much data deleted?
   - When did deletion occur?
   - Who initiated deletion?

3. **Restore options:**
   - **Option A:** Restore from backup (loses recent data)
   - **Option B:** Selective restore of deleted items only

4. **Selective restore process:**
   ```bash
   # Restore to temporary database
   # Query for deleted records
   # Export deleted records
   # Import back into production
   ```

5. **Resume sync:**
   - Settings > Sync > Resume Syncs
   - Monitor for conflicts

### Business Continuity Planning

#### Failover Testing

**Quarterly Failover Drills:**

1. **Schedule drill:**
   - Select low-usage time window
   - Notify stakeholders

2. **Execute failover:**
   - Failover to secondary region
   - Run through DR procedures
   - Time each step

3. **Validate functionality:**
   - Test mobile app connectivity
   - Test web dashboard
   - Test API integrations
   - Generate test reports

4. **Failback:**
   - Return to primary region
   - Verify normal operations

5. **Document results:**
   - Update RTO/RPO if needed
   - Refine procedures
   - Train staff on improvements

#### Alternative Procedures

**If Primary Admin Unavailable:**

- Secondary admin contacts: List in Settings > Security > Emergency Contacts
- Emergency admin credentials: Stored in company safe
- Escalation tree defined

**If Support Staff Unavailable:**

- Cross-train administrators
- Maintain runbooks for common tasks
- External support contract with vendor

---

## Monitoring and Maintenance

### System Health Monitoring

#### Dashboard Overview

**Admin Dashboard:**

1. **Login to Admin Portal**

2. **Key Metrics Display:**
   - **Users:** Total, Active (logged in last 7 days), Inactive
   - **Vehicles:** Total, Active (trip last 7 days), Maintenance Due
   - **Trips:** Today, This Week, This Month
   - **Data Sync:** Pending items, Last sync time, Errors
   - **System Health:** API response time, Error rate, Uptime %

3. **Alerts:**
   - Red: Critical issues requiring immediate attention
   - Yellow: Warnings to investigate
   - Green: All systems operational

#### Performance Monitoring

**Response Time Tracking:**

1. **Monitor > Performance**

2. **Metrics:**
   - API response time: Target <200ms average
   - Database query time: Target <100ms average
   - Page load time: Target <2s
   - Mobile sync time: Target <5s

3. **Set Alerts:**
   - Alert if response time >500ms for 5 minutes
   - Alert if error rate >1%
   - Alert if uptime <99.9%

**Resource Utilization:**

1. **Monitor > Resources**

2. **Track:**
   - CPU usage: Target <70% average
   - Memory usage: Target <80%
   - Database size: Monitor growth rate
   - Storage usage: Alert at 80% full
   - Bandwidth: Monitor for spikes

### User Activity Monitoring

#### Active Users

1. **Monitor > Users > Activity**

2. **Metrics:**
   - Currently online users
   - Peak concurrent users
   - Login frequency per user
   - Average session duration
   - Most active users

3. **Identify Issues:**
   - Users not logging in (training needed?)
   - Unusually high activity (bot/automation?)
   - Login failures (password issues?)

#### Feature Usage

1. **Monitor > Features > Usage Statistics**

2. **Track:**
   - Trip tracking: % of drivers using
   - OBD2 connection: % of vehicles with adapters
   - Photo upload: Photos per inspection
   - Report generation: Most popular reports
   - Mobile app version: Adoption of latest version

3. **Insights:**
   - Underutilized features: Need training or promotion
   - Overutilized features: Consider optimization
   - Old app versions: Push users to upgrade

### Maintenance Windows

#### Scheduling Maintenance

1. **Settings > System > Maintenance Windows**

2. **Configure:**
   - Frequency: Weekly, Monthly, Quarterly
   - Day and time: Select low-usage window
   - Duration: Typical 1-2 hours
   - Auto-notify users: 48 hours, 24 hours, 1 hour before

3. **During Maintenance:**
   - Display maintenance page to users
   - Block new logins (existing sessions continue)
   - Disable background sync
   - Monitor error logs

4. **Post-Maintenance:**
   - Verify all services running
   - Check key functionality
   - Send "all clear" notification

**Typical Maintenance Tasks:**
- Database index optimization
- Log file cleanup
- Security patches
- Configuration updates
- Cache clearing

---

## Troubleshooting Common Admin Issues

### User Cannot Login

**Diagnosis:**

1. Check user status: Active, Deactivated, Locked?
2. Check password reset attempts
3. Check MFA status
4. Check account expiration date
5. Review audit logs for failed login attempts

**Solutions:**

- **Account locked:** Unlock in user profile
- **Expired password:** Force password reset
- **MFA issue:** Temporarily disable MFA, have user reconfigure
- **Deactivated:** Reactivate account

### Data Not Syncing

**Diagnosis:**

1. Check network connectivity from mobile device
2. Check API status: Monitor > API Health
3. Check sync queue size: Large backlog?
4. Check for sync conflicts
5. Review sync error logs

**Solutions:**

- **Network issue:** User to switch to Wi-Fi or better signal
- **API down:** Investigate and restore service
- **Large queue:** Increase sync worker capacity
- **Conflicts:** Manually resolve conflicts
- **Error:** Fix root cause (bad data, permission issue, etc.)

### Report Generation Failing

**Diagnosis:**

1. Check report parameters: Too large date range?
2. Check database performance
3. Check report timeout settings
4. Review error message

**Solutions:**

- **Timeout:** Increase timeout or reduce date range
- **Database slow:** Optimize queries, add indexes
- **Too much data:** Use filters to reduce dataset
- **Corrupted data:** Identify and repair

### Integration Not Working

**Diagnosis:**

1. Check API key: Valid, not expired?
2. Check API permissions: Has required scopes?
3. Test API endpoint manually
4. Check firewall rules
5. Review API error logs

**Solutions:**

- **Invalid key:** Generate new API key
- **Permissions:** Update API key permissions
- **Endpoint error:** Fix endpoint configuration
- **Firewall:** Whitelist IP addresses
- **API bug:** Report to engineering

---

## Appendix

### Admin Checklist - Daily Tasks

- [ ] Review dashboard for alerts
- [ ] Check sync queue (should be <100 pending)
- [ ] Review failed logins (investigate unusual activity)
- [ ] Check system health (API response time, uptime)
- [ ] Review overnight automated reports

### Admin Checklist - Weekly Tasks

- [ ] Review user activity (identify inactive users)
- [ ] Check vehicles with maintenance due
- [ ] Review driver performance reports
- [ ] Check expired/expiring licenses
- [ ] Review data backup status
- [ ] Check for app updates

### Admin Checklist - Monthly Tasks

- [ ] Generate executive summary report
- [ ] Review and approve budget/costs
- [ ] Audit user permissions (remove unnecessary access)
- [ ] Review integration health
- [ ] Check compliance requirements (DOT, GDPR, etc.)
- [ ] Review and update documentation
- [ ] Security audit (review audit logs)
- [ ] Test disaster recovery procedures

### Glossary

- **API:** Application Programming Interface
- **DTC:** Diagnostic Trouble Code
- **ELD:** Electronic Logging Device
- **GDPR:** General Data Protection Regulation
- **HOS:** Hours of Service
- **IFTA:** International Fuel Tax Agreement
- **MFA:** Multi-Factor Authentication
- **OBD2:** On-Board Diagnostics (second generation)
- **RBAC:** Role-Based Access Control
- **RPO:** Recovery Point Objective
- **RTO:** Recovery Time Objective
- **SLA:** Service Level Agreement
- **VIN:** Vehicle Identification Number

### Support Contacts

- **Admin Support:** admin-support@fleetmanagement.com
- **Technical Support:** technical@fleetmanagement.com
- **Sales/Billing:** sales@fleetmanagement.com
- **Emergency Hotline:** +1-800-FLEET-911
- **Documentation:** https://docs.fleetmanagement.com
- **API Documentation:** https://api.fleetmanagement.com/docs

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Next Review:** February 2026
**Document Owner:** Fleet Management Admin Team

For questions or feedback on this guide, contact admin-support@fleetmanagement.com.
