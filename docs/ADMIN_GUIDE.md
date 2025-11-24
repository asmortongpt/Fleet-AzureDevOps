# Fleet Management System - Administrator Guide

**Complete guide for system administrators and configuration managers**

---

## Table of Contents

1. [Admin Responsibilities](#admin-responsibilities)
2. [Initial System Setup](#initial-system-setup)
3. [User Management](#user-management)
4. [Role-Based Access Control](#role-based-access-control)
5. [Tenant Configuration](#tenant-configuration)
6. [Fleet Setup](#fleet-setup)
7. [Integration Setup](#integration-setup)
8. [Security Configuration](#security-configuration)
9. [Backup and Recovery](#backup-and-recovery)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Admin Responsibilities

As a Fleet Management System administrator, you are responsible for:

**Daily Tasks:**
- Monitor system health and performance
- Review and respond to user access requests
- Address user support tickets
- Monitor security alerts

**Weekly Tasks:**
- Review user activity logs
- Verify backup completion
- Update user roles and permissions as needed
- Review system usage reports

**Monthly Tasks:**
- Review and update security policies
- Audit user access and remove inactive accounts
- Test disaster recovery procedures
- Review integration health (Azure Maps, Microsoft Teams, etc.)
- Update system documentation

**Quarterly Tasks:**
- Conduct security audit
- Review and renew API keys and certificates
- Plan and execute system updates
- Train new administrators

---

## Initial System Setup

### Prerequisites

Before configuring the system, ensure you have:

- [ ] Azure Active Directory (Azure AD) administrator access
- [ ] Fleet system administrator credentials
- [ ] Organization's tenant information
- [ ] List of initial users and their roles
- [ ] Vehicle data (VINs, license plates, make/model)
- [ ] Integration credentials (Azure Maps, Microsoft Graph, etc.)

### First-Time Configuration Checklist

**Phase 1: Authentication Setup (1-2 hours)**

1. **Configure Azure AD Integration**
   - Register the Fleet app in Azure AD
   - Set redirect URIs
   - Configure API permissions
   - Generate client secret
   - Document: [Microsoft Integration Guide](microsoft-integration/README.md)

2. **Test SSO Login**
   - Verify Microsoft login works
   - Test with your admin account first
   - Verify token exchange
   - Check audit logs

**Phase 2: Tenant Configuration (30 minutes)**

3. **Set Up Organization Profile**
   - Navigate to: **Settings** → **Organization Profile**
   - Enter:
     - Organization name
     - Primary contact
     - Address and phone
     - Timezone
     - Business hours
   - Upload company logo (appears on login page and reports)

4. **Configure System Settings**
   - Navigate to: **Settings** → **System Configuration**
   - Set:
     - Default map provider (Azure Maps, Google Maps, Mapbox)
     - Distance units (miles/kilometers)
     - Fuel units (gallons/liters)
     - Currency
     - Date/time format

**Phase 3: User Setup (1-2 hours)**

5. **Create User Accounts**
   - See: [User Management](#user-management) section
   - Create admin accounts first
   - Then create manager accounts
   - Finally, create driver/employee accounts

6. **Assign Roles and Permissions**
   - See: [Role-Based Access Control](#role-based-access-control) section
   - Configure default role permissions
   - Create custom roles if needed

**Phase 4: Fleet Data (2-4 hours)**

7. **Add Facilities/Locations**
   - Navigate to: **Settings** → **Facilities**
   - Add garages, parking lots, fuel stations
   - Set geofences for each facility

8. **Add Vehicles**
   - See: [Fleet Setup](#fleet-setup) section
   - Option A: Bulk import via CSV
   - Option B: Add individually via UI

9. **Add Drivers**
   - Navigate to: **People Management**
   - Add driver profiles
   - Upload license information
   - Assign vehicles

**Phase 5: Integrations (1-2 hours)**

10. **Configure Integrations**
    - See: [Integration Setup](#integration-setup) section
    - Azure Maps API (required for GPS tracking)
    - Microsoft Teams (optional)
    - Email service (SMTP)
    - Fuel card providers (optional)

**Phase 6: Testing & Training (2-3 hours)**

11. **Test Critical Workflows**
    - Test login (Microsoft SSO and email/password)
    - Test GPS tracking with a vehicle
    - Create a test maintenance request
    - Generate a test report
    - Send a test notification

12. **Train Initial Users**
    - Conduct admin training session
    - Provide User Guide to all users
    - Schedule follow-up Q&A sessions

---

## User Management

### Adding Users

**Method 1: Single User (Manual)**

1. Navigate to: **Settings** → **User Management**
2. Click **"+ Add User"**
3. Enter user details:
   - **Email**: User's work email (must match Microsoft account if using SSO)
   - **First Name** & **Last Name**
   - **Role**: Select appropriate role (see roles section)
   - **Employee ID**: (optional) Internal identifier
   - **Department**: (optional)
   - **Phone Number**: (optional)
4. Select **Authentication Method**:
   - **Microsoft SSO Only**: User must use Microsoft login (recommended)
   - **Email/Password**: System generates temporary password, user must change on first login
   - **Both**: User can use either method
5. Click **"Create User"**
6. System sends welcome email with login instructions

**Method 2: Bulk Import (CSV)**

1. Navigate to: **Settings** → **User Management**
2. Click **"Bulk Import"**
3. Download CSV template
4. Fill in user information:
   ```csv
   email,first_name,last_name,role,employee_id,department,phone
   john.doe@company.com,John,Doe,driver,EMP001,Operations,555-1234
   jane.smith@company.com,Jane,Smith,manager,EMP002,Fleet,555-5678
   ```
5. Upload completed CSV
6. Review and confirm import
7. System sends welcome emails to all users

**Method 3: Azure AD Sync (Automatic)**

If enabled, the system can automatically provision users from Azure AD:

1. Navigate to: **Settings** → **Integrations** → **Azure AD Sync**
2. Enable **"Auto-Provision Users"**
3. Configure sync settings:
   - Select Azure AD groups to sync
   - Map Azure AD roles to Fleet roles
   - Set sync frequency (hourly, daily)
4. Click **"Save & Sync Now"**
5. Review synced users

### Modifying Users

**Update User Information:**
1. Go to: **Settings** → **User Management**
2. Search for user
3. Click user's name
4. Click **"Edit"**
5. Update fields as needed
6. Click **"Save Changes"**

**Change User Role:**
1. Find user in **User Management**
2. Click **"Change Role"** dropdown
3. Select new role
4. Confirm change
5. User's permissions update immediately

**Reset User Password:**
1. Find user in **User Management**
2. Click **"Reset Password"**
3. System generates temporary password
4. Click **"Send Reset Email"** or copy password to give to user
5. User must change password on next login

### Disabling/Removing Users

**Disable User (Temporary):**
- Use this when an employee is on leave but will return
- User cannot log in but data is preserved
- Steps:
  1. Find user in **User Management**
  2. Click **"Disable Account"**
  3. Confirm
  4. To re-enable: Click **"Enable Account"**

**Remove User (Permanent):**
- Use this when an employee leaves permanently
- User account is deleted but historical data (trips, maintenance) is preserved
- Steps:
  1. Find user in **User Management**
  2. Click **"Delete User"**
  3. Review warning (this cannot be undone)
  4. Type user's email to confirm
  5. Click **"Permanently Delete"**

**Best Practice:** Disable first, then delete after 30-90 days if user doesn't return.

---

## Role-Based Access Control

### Default Roles

The system includes 6 pre-configured roles:

#### 1. System Administrator
**Full system access - use sparingly**

**Permissions:**
- All user management functions
- All configuration and settings
- View and edit all fleet data
- Access to audit logs and security settings
- Can delete records
- Integration management

**Typical users:** IT administrators, Fleet Directors

---

#### 2. Fleet Manager
**Manages daily fleet operations**

**Permissions:**
- View and edit vehicles, drivers, maintenance
- Create and assign work orders
- Run reports and analytics
- Approve maintenance requests
- Manage geofences and routes
- View GPS tracking
- Cannot: Manage users, change system settings, access audit logs

**Typical users:** Fleet Managers, Operations Managers

---

#### 3. Dispatcher
**Coordinates vehicle assignments and routing**

**Permissions:**
- View live GPS tracking
- Assign vehicles to drivers
- Create and modify routes
- Send messages to drivers
- View vehicle availability
- Cannot: Edit vehicle details, approve expenses, run financial reports

**Typical users:** Dispatch Coordinators, Operations Staff

---

#### 4. Maintenance Supervisor
**Oversees maintenance and repairs**

**Permissions:**
- View and edit maintenance records
- Create and assign work orders
- Manage parts inventory
- Schedule service appointments
- View vehicle telemetry
- Run maintenance reports
- Cannot: Manage users, assign vehicles, view financial data (unless granted)

**Typical users:** Maintenance Managers, Shop Supervisors

---

#### 5. Driver
**Basic access for vehicle operators**

**Permissions:**
- View assigned vehicle(s)
- Log trips and mileage
- Report maintenance issues
- Complete pre-trip inspections
- View assigned routes
- Submit expense reimbursements
- Cannot: View other vehicles (unless assigned), access admin functions, run reports

**Typical users:** Vehicle Operators, Field Staff

---

#### 6. Read-Only User
**View-only access for auditors and executives**

**Permissions:**
- View all fleet data (vehicles, drivers, trips, maintenance)
- Run and export reports
- View analytics dashboards
- Cannot: Create, edit, or delete any records

**Typical users:** Executives, Auditors, Compliance Officers

---

### Creating Custom Roles

Need more granular control? Create custom roles:

1. Navigate to: **Settings** → **Roles & Permissions**
2. Click **"+ Create Custom Role"**
3. Enter role name (e.g., "Fuel Coordinator")
4. Select base role to copy permissions from (optional)
5. Configure permissions:

**Permission Categories:**

- **Vehicles**
  - [ ] View vehicles
  - [ ] Create/edit vehicles
  - [ ] Delete vehicles
  - [ ] Assign drivers

- **Drivers**
  - [ ] View drivers
  - [ ] Create/edit drivers
  - [ ] Delete drivers
  - [ ] View driver performance

- **Maintenance**
  - [ ] View maintenance records
  - [ ] Create maintenance requests
  - [ ] Approve maintenance
  - [ ] Complete work orders
  - [ ] Manage parts inventory

- **GPS & Tracking**
  - [ ] View live GPS tracking
  - [ ] View trip history
  - [ ] Create/edit geofences
  - [ ] View telemetry data

- **Financial**
  - [ ] View fuel data
  - [ ] Record fuel purchases
  - [ ] Approve reimbursements
  - [ ] View cost reports

- **Reports**
  - [ ] Run standard reports
  - [ ] Create custom reports
  - [ ] Schedule reports
  - [ ] Export data

- **Communication**
  - [ ] Send messages
  - [ ] View communication logs
  - [ ] Manage notifications

- **Administration**
  - [ ] Manage users
  - [ ] Configure system settings
  - [ ] View audit logs
  - [ ] Manage integrations

6. Click **"Save Role"**
7. Assign users to this new role

---

## Tenant Configuration

### Multi-Tenant Setup

If your organization has multiple divisions or operates multiple fleets separately, you can configure multiple tenants.

**When to use tenants:**
- Separate business units with independent fleets
- Multiple subsidiaries
- Client fleets (if you manage fleets for other organizations)

**How tenants work:**
- Each tenant has isolated data (vehicles, drivers, users)
- Users can only access one tenant at a time
- Some users (super admins) can switch between tenants

**Creating a new tenant:**

1. Navigate to: **Settings** → **Tenant Management** (System Admin only)
2. Click **"+ Add Tenant"**
3. Enter tenant details:
   - Tenant name (e.g., "Western Region Fleet")
   - Tenant code (short identifier, e.g., "WEST")
   - Contact information
4. Configure tenant settings:
   - Inherit parent settings or customize
   - Set timezone, units, currency
5. Click **"Create Tenant"**
6. Add tenant administrator
7. Tenant admin can now add users and vehicles

### Organization Branding

Customize the system's appearance:

1. Navigate to: **Settings** → **Branding**
2. Upload **Company Logo**:
   - Recommended: PNG with transparent background
   - Size: 200x60 pixels
   - Max file size: 500KB
3. Set **Brand Colors**:
   - Primary color (used for buttons, headers)
   - Secondary color
   - Accent color
4. Upload **Login Page Background** (optional):
   - Recommended: 1920x1080 pixels
   - Shows behind login form
5. Set **Email Template**:
   - Customize email header/footer
   - Add company contact info
6. Click **"Save & Preview"**
7. Verify changes on login page

### Notification Settings

Configure system-wide notification defaults:

1. Navigate to: **Settings** → **Notifications**
2. **Email Notifications**:
   - [ ] Send welcome email to new users
   - [ ] Send password reset emails
   - [ ] Send maintenance reminders
   - [ ] Send expense approval notifications
   - [ ] Daily summary email (to managers)
3. **Push Notifications** (mobile app):
   - [ ] Trip assignments
   - [ ] Route changes
   - [ ] Maintenance alerts
   - [ ] Emergency messages
4. **In-App Notifications**:
   - [ ] Show notification badge
   - [ ] Play sound for critical alerts
5. **Notification Schedule**:
   - Set quiet hours (e.g., 8pm - 6am, no non-critical alerts)
   - Set weekend notification policy
6. Click **"Save Settings"**

Users can override these defaults in their personal settings.

---

## Fleet Setup

### Adding Vehicles

**Method 1: Add Vehicle Manually**

1. Navigate to: **Garage & Service** or **Fleet Dashboard**
2. Click **"+ Add Vehicle"**
3. Fill in **Basic Information**:
   - **VIN**: Vehicle Identification Number (17 characters)
   - **License Plate**: Include state/province
   - **Make**: (e.g., Ford, Chevrolet, Toyota)
   - **Model**: (e.g., F-150, Silverado, Camry)
   - **Year**: Model year
   - **Color**: Exterior color
   - **Vehicle Type**: Car, Truck, Van, SUV, Trailer, Equipment
   - **Fuel Type**: Gasoline, Diesel, Electric, Hybrid, CNG
4. Fill in **Fleet Information**:
   - **Fleet Number**: Internal identifier
   - **Department**: Which department uses this vehicle
   - **Home Location**: Primary garage/facility
   - **Status**: Available, In Use, Maintenance, Out of Service
5. Fill in **Specifications** (optional but recommended):
   - **Odometer Reading**: Current mileage
   - **Engine Size**: (e.g., 5.0L V8)
   - **Transmission**: Automatic/Manual
   - **Seating Capacity**
   - **Cargo Capacity**
   - **GVWR** (Gross Vehicle Weight Rating)
6. Fill in **Ownership**:
   - **Ownership Type**: Owned, Leased, Rented
   - **Purchase Date**
   - **Purchase Price**
   - **Lease Expiration** (if applicable)
   - **Lienholder** (if applicable)
7. Fill in **Insurance**:
   - **Policy Number**
   - **Insurance Provider**
   - **Expiration Date**
8. Fill in **Registration**:
   - **Registration Expiration**
   - **State/Province**
9. Upload **Photos** (optional):
   - Front, rear, sides
   - Interior
   - Any existing damage
10. Click **"Save Vehicle"**

**Method 2: Bulk Import (CSV)**

For adding many vehicles at once:

1. Navigate to: **Garage & Service**
2. Click **"Bulk Import"**
3. Download **Vehicle Import Template** (CSV)
4. Fill in vehicle data:
   ```csv
   vin,license_plate,make,model,year,color,vehicle_type,fuel_type,fleet_number,department,odometer
   1FTFW1ET5DFC12345,ABC-1234,Ford,F-150,2023,White,Truck,Gasoline,FLT-001,Operations,15234
   1G1BE5SM8H7123456,XYZ-5678,Chevrolet,Malibu,2022,Silver,Car,Gasoline,FLT-002,Sales,28901
   ```
5. Upload CSV file
6. Review import preview
7. Fix any validation errors
8. Click **"Confirm Import"**
9. Vehicles are created in batch

**Method 3: Integration (Advanced)**

If your organization uses a separate asset management system, you can set up automatic vehicle sync. Contact support for integration options.

### Configuring GPS Devices

For vehicles with GPS tracking:

1. Go to vehicle detail page
2. Click **"GPS Settings"**
3. Enter **GPS Device Information**:
   - Device ID/IMEI
   - Device type (OBD2, hardwired, battery-powered)
   - Cellular provider
   - Activation date
4. Set **Tracking Settings**:
   - Update interval (30 seconds - 5 minutes)
   - Idle detection threshold
   - Speeding threshold
   - Harsh braking threshold
5. Enable **Telemetry** (if OBD2-equipped):
   - [ ] Engine RPM
   - [ ] Fuel level
   - [ ] Engine temperature
   - [ ] Battery voltage
   - [ ] Diagnostic codes
6. Click **"Save GPS Settings"**
7. Test tracking: Click **"Locate Now"** to verify GPS works

### Vehicle Maintenance Schedules

Set up automatic maintenance reminders:

1. Go to vehicle detail page
2. Click **"Maintenance Schedule"**
3. Configure **Service Intervals**:

**Oil Change:**
- Every 5,000 miles or 6 months (whichever comes first)
- Alert 500 miles before due

**Tire Rotation:**
- Every 7,500 miles or 6 months

**State Inspection:**
- Annually (based on registration expiration)
- Alert 30 days before due

**Brake Inspection:**
- Every 15,000 miles or 12 months

**Custom Maintenance:**
- Add manufacturer-specific service schedules
- E.g., transmission service every 60,000 miles

4. Set **Alert Recipients**:
   - Fleet Manager
   - Maintenance Supervisor
   - Assigned driver
5. Click **"Save Schedule"**

The system will automatically create maintenance reminders based on these rules.

### Assigning Vehicles to Drivers

**Option A: From Vehicle Page**
1. Go to vehicle detail page
2. Click **"Assign Driver"**
3. Search for driver by name
4. Select driver
5. Set assignment type:
   - **Permanent**: Driver is always assigned to this vehicle
   - **Temporary**: Set start and end dates
6. Click **"Assign"**

**Option B: From Driver Page**
1. Go to: **People Management**
2. Find driver
3. Click **"Assign Vehicle"**
4. Select vehicle(s)
5. Click **"Assign"**

**Multi-Driver Vehicles:**
Some vehicles (e.g., pool vehicles) have multiple drivers. You can assign multiple drivers to one vehicle and specify scheduling.

---

## Integration Setup

### Azure Maps Integration (Required for GPS)

Azure Maps provides the mapping and geocoding services for GPS tracking.

**Prerequisites:**
- Azure subscription
- Azure Maps account

**Setup Steps:**

1. **Create Azure Maps Account** (if not already done):
   - Go to Azure Portal
   - Create resource: **Azure Maps**
   - Note your **Subscription Key**

2. **Configure in Fleet System**:
   - Navigate to: **Settings** → **Integrations** → **Azure Maps**
   - Enter **Azure Maps Subscription Key**
   - Select **Map Style**: Road, Satellite, Hybrid
   - Set **Default Zoom Level**: 10-15 (city-level)
   - Enable **Traffic Layer**: Yes/No
   - Enable **Weather Layer**: Yes/No
   - Click **"Test Connection"**
   - If successful, click **"Save"**

3. **Verify GPS Tracking**:
   - Go to **Live GPS Tracking**
   - Verify map loads properly
   - Test with a vehicle that has GPS device

**Troubleshooting:**
- If map doesn't load, verify subscription key is correct
- Check Azure Maps quota (free tier has limits)
- Verify firewall allows connections to Azure Maps API

---

### Microsoft Teams Integration (Optional)

Integrate with Microsoft Teams for in-app messaging.

**Prerequisites:**
- Microsoft 365 subscription with Teams
- Azure AD app registration
- Microsoft Graph API permissions

**Setup Steps:**

1. **Configure Azure AD App**:
   - Already done during SSO setup
   - Verify Microsoft Graph permissions:
     - `ChannelMessage.Send`
     - `Chat.ReadWrite`
     - `User.Read.All`

2. **Enable in Fleet System**:
   - Navigate to: **Settings** → **Integrations** → **Microsoft Teams**
   - Toggle **"Enable Teams Integration"**
   - Enter **Azure AD App ID** (same as SSO)
   - Enter **Tenant ID**
   - Click **"Authorize"** → Sign in with admin account
   - Grant permissions
   - Click **"Test Connection"**

3. **Configure Team/Channel**:
   - Select default **Team** for fleet messages
   - Select default **Channel** (e.g., "Fleet Operations")
   - Set notification preferences

4. **Usage**:
   - Users can now send/receive Teams messages from **Teams Messages** module
   - System can send automated alerts to Teams channel

---

### Email Integration (SMTP)

Configure email for system notifications.

**Setup Steps:**

1. Navigate to: **Settings** → **Integrations** → **Email (SMTP)**
2. Enter **SMTP Server Settings**:
   - **SMTP Host**: `smtp.office365.com` (for Microsoft 365)
   - **SMTP Port**: `587` (TLS) or `465` (SSL)
   - **Encryption**: TLS (recommended)
   - **Username**: System email account (e.g., `fleetalerts@company.com`)
   - **Password**: Email account password or app password
3. Configure **Sender Settings**:
   - **From Name**: "Fleet Management System"
   - **From Email**: `fleetalerts@company.com`
   - **Reply-To Email**: Support email address
4. Click **"Test Email"**:
   - Enter your email address
   - Click **"Send Test"**
   - Verify you receive the test email
5. If successful, click **"Save Settings"**

**Common SMTP Providers:**

| Provider | SMTP Host | Port | Encryption |
|----------|-----------|------|------------|
| Microsoft 365 | smtp.office365.com | 587 | TLS |
| Gmail | smtp.gmail.com | 587 | TLS |
| SendGrid | smtp.sendgrid.net | 587 | TLS |
| Amazon SES | email-smtp.us-east-1.amazonaws.com | 587 | TLS |

---

### Fuel Card Integration (Optional)

Automatically import fuel purchases from fleet fuel card providers.

**Supported Providers:**
- WEX Fleet
- Fuelman
- Shell Fleet Plus
- BP Business Solutions

**Setup Steps** (example: WEX Fleet):

1. **Obtain API Credentials from WEX**:
   - Contact WEX support
   - Request API access for your fleet account
   - Receive API key and account ID

2. **Configure in Fleet System**:
   - Navigate to: **Settings** → **Integrations** → **Fuel Cards**
   - Click **"+ Add Provider"**
   - Select **"WEX Fleet"**
   - Enter **API Key** and **Account ID**
   - Set **Sync Frequency**: Hourly, Daily
   - Click **"Test Connection"**
   - If successful, click **"Save & Sync Now"**

3. **Verify Import**:
   - Go to **Fuel Management**
   - Check for imported fuel purchases
   - Verify vehicle matching is correct

**Benefits:**
- Eliminates manual fuel entry
- Real-time fuel data
- Automatic vehicle matching by fleet number or license plate

---

## Security Configuration

### Password Policies

Configure password requirements for users with email/password authentication:

1. Navigate to: **Settings** → **Security** → **Password Policy**
2. Set **Password Requirements**:
   - [ ] Minimum length: 12 characters (recommended)
   - [ ] Require uppercase letter
   - [ ] Require lowercase letter
   - [ ] Require number
   - [ ] Require special character (!@#$%^&*)
   - [ ] Prevent password reuse (last 5 passwords)
3. Set **Password Expiration**:
   - Password expires every: 90 days (recommended)
   - Warn user 14 days before expiration
4. Set **Account Lockout Policy**:
   - Lock account after 5 failed login attempts
   - Lockout duration: 30 minutes
   - Reset lockout counter after 15 minutes of no attempts
5. Click **"Save Policy"**

**Note:** Password policies do NOT apply to Microsoft SSO users (they follow Azure AD policies).

---

### Audit Logging

All administrative and security-sensitive actions are logged.

**Viewing Audit Logs:**
1. Navigate to: **Settings** → **Security** → **Audit Logs**
2. Filter by:
   - Date range
   - User
   - Action type (login, edit, delete, etc.)
   - Resource type (vehicle, driver, user)
3. Click **"Search"**
4. View log entries with:
   - Timestamp
   - User who performed action
   - Action type
   - Resource affected
   - IP address
   - Result (success/failure)

**Audit Log Retention:**
- Default: Logs retained for 1 year
- Can be exported for long-term archival

**Exportable for compliance audits:**
- SOC 2
- ISO 27001
- Internal audits

---

### API Access & Keys

If you need to integrate external systems with the Fleet API:

1. Navigate to: **Settings** → **Security** → **API Keys**
2. Click **"+ Generate API Key"**
3. Enter **Key Details**:
   - Name (e.g., "Accounting System Integration")
   - Purpose/Description
   - Expiration date (recommended: 1 year)
4. Set **Permissions**:
   - Read-only or Read/Write
   - Specific resources (vehicles, maintenance, fuel, etc.)
5. Click **"Generate"**
6. **IMPORTANT**: Copy the API key immediately (it won't be shown again)
7. Store securely (password manager or key vault)

**Using API Keys:**
- Include in HTTP header: `Authorization: Bearer YOUR_API_KEY`
- See: [API Documentation](API_DOCUMENTATION.md)

**Revoking API Keys:**
1. Go to **API Keys** page
2. Find key to revoke
3. Click **"Revoke"**
4. Confirm
5. Key is immediately invalidated

---

### Two-Factor Authentication (2FA)

**Coming Soon:** 2FA will be available in a future release. Currently, Microsoft SSO users can leverage Azure AD MFA.

---

## Backup and Recovery

### Automated Backups

The system automatically backs up all data.

**Backup Schedule:**
- **Database**: Daily at 2:00 AM (UTC)
- **File Storage**: Daily at 3:00 AM (UTC)
- **Retention**: 30 daily, 12 weekly, 12 monthly backups

**Viewing Backup Status:**
1. Navigate to: **Settings** → **System** → **Backup Status**
2. View recent backups:
   - Date/time
   - Size
   - Status (successful/failed)
   - Download link (admin only)

**Backup Alerts:**
- Email sent to system admins if backup fails
- Check **Audit Logs** for backup history

---

### Disaster Recovery

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours (last nightly backup)

**In Case of System Failure:**

1. **Contact Support Immediately**:
   - Email: `support@capitaltechalliance.com`
   - Phone: 1-800-FLEET-HELP
   - Mark as **CRITICAL ISSUE**

2. **Provide Information**:
   - Tenant name and ID
   - Description of issue
   - When issue started
   - Error messages (if any)

3. **Recovery Process** (handled by support):
   - Identify root cause
   - Restore from most recent backup
   - Verify data integrity
   - Restore system access
   - Notify users

**Testing Disaster Recovery:**
- Admins should test recovery procedures quarterly
- Contact support to schedule a DR test

---

### Data Export

Export your data for archival or migration:

1. Navigate to: **Settings** → **Data Management** → **Export**
2. Select **Data to Export**:
   - [ ] Vehicles
   - [ ] Drivers
   - [ ] Trips
   - [ ] Maintenance records
   - [ ] Fuel data
   - [ ] Users
   - [ ] All data
3. Select **Date Range** (optional)
4. Select **Format**:
   - CSV (recommended for Excel)
   - JSON (recommended for developers)
   - SQL dump (recommended for migration)
5. Click **"Export"**
6. Download link sent to your email when ready (large exports may take time)

**Data Retention Policy:**
- Active data: Indefinite
- Deleted records: Soft-deleted for 90 days, then permanently purged
- Audit logs: Retained for 1 year

---

## Monitoring and Maintenance

### System Health Dashboard

Monitor system performance in real-time:

1. Navigate to: **Settings** → **System** → **Health Dashboard**
2. View metrics:
   - **API Response Time**: Should be < 200ms
   - **Database Performance**: Query time < 100ms
   - **GPS Update Rate**: Should be 30 seconds
   - **Active Users**: Current logged-in users
   - **Error Rate**: Should be < 0.1%

**Setting Up Alerts:**
1. Click **"Configure Alerts"**
2. Set thresholds:
   - Alert if API response time > 1000ms
   - Alert if error rate > 1%
   - Alert if GPS update lag > 5 minutes
3. Enter **Alert Recipients** (admin emails)
4. Click **"Save Alerts"**

---

### Usage Analytics

View system usage statistics:

1. Navigate to: **Settings** → **Analytics** → **Usage Reports**
2. View metrics:
   - **Active Users**: Daily, weekly, monthly
   - **Most Used Modules**: Which features are used most
   - **Login Activity**: Peak usage times
   - **Vehicle Utilization**: Which vehicles are used most
   - **Report Generation**: Most run reports

**Why this matters:**
- Identify underused features (opportunity for training)
- Plan capacity (if usage is growing)
- Optimize maintenance schedules based on actual usage

---

### Performance Optimization

If the system is running slowly:

**1. Check Database Size**
- Navigate to: **Settings** → **System** → **Database**
- View database size and table sizes
- If large (> 10GB), consider archiving old data

**2. Archive Old Data**
- Navigate to: **Settings** → **Data Management** → **Archive**
- Select data older than: 3 years (example)
- Archive trips, maintenance records, etc.
- Archived data is moved to cold storage but still accessible

**3. Review Integrations**
- Check if any integrations are slow or timing out
- Disable unused integrations

**4. Clear Cache**
- Navigate to: **Settings** → **System** → **Cache**
- Click **"Clear System Cache"**
- Click **"Clear User Sessions"** (forces all users to re-login)

---

## Troubleshooting Common Issues

### Users Can't Log In

**Issue:** User sees "Invalid credentials" or "Account not found"

**Troubleshooting steps:**

1. **Verify account exists**:
   - Go to **User Management**
   - Search for user by email
   - If not found, create account

2. **Check account status**:
   - Make sure account is not disabled
   - Verify email address is correct

3. **Password issues**:
   - Reset user's password
   - Send new temporary password

4. **Microsoft SSO issues**:
   - Verify user's Microsoft account email matches Fleet system email exactly
   - Check Azure AD integration is working: **Settings** → **Integrations** → **Microsoft**
   - Test with another Microsoft user to see if SSO is broken system-wide
   - Check Azure AD audit logs for denied authentication

5. **Browser issues**:
   - Clear browser cache and cookies
   - Try incognito/private mode
   - Try different browser

---

### GPS Tracking Not Working

**Issue:** Vehicle not showing on map or location is outdated

**Troubleshooting steps:**

1. **Check GPS device**:
   - Verify GPS device is installed and powered
   - Check cellular signal (GPS uses cellular data)
   - Check device status: Go to vehicle → GPS Settings → Device Status

2. **Check Azure Maps integration**:
   - Go to **Settings** → **Integrations** → **Azure Maps**
   - Click **"Test Connection"**
   - If fails, verify API key is valid

3. **Check vehicle configuration**:
   - Go to vehicle detail page
   - Verify GPS device ID is entered correctly
   - Check tracking is enabled

4. **Check GPS update settings**:
   - Verify update interval is set appropriately (30 seconds - 5 minutes)
   - Very long intervals may make tracking appear broken

5. **Check audit logs**:
   - Go to **Audit Logs**
   - Filter by vehicle and "GPS update"
   - Look for errors

---

### Email Notifications Not Sending

**Issue:** Users not receiving email notifications

**Troubleshooting steps:**

1. **Check SMTP configuration**:
   - Go to **Settings** → **Integrations** → **Email**
   - Click **"Test Email"**
   - If test fails, verify SMTP credentials

2. **Check user notification preferences**:
   - Go to **User Management** → Select user → **Notification Settings**
   - Verify email notifications are enabled

3. **Check spam folder**:
   - Ask user to check spam/junk folder
   - If found there, add sender to safe senders list

4. **Check email server logs**:
   - Go to **Settings** → **System** → **Email Logs**
   - Look for bounces or delivery failures

5. **Verify email address**:
   - Make sure user's email address is correct in their profile

---

### Reports Not Generating

**Issue:** Report shows error or doesn't complete

**Troubleshooting steps:**

1. **Check date range**:
   - Very large date ranges (e.g., 10 years) may timeout
   - Try shorter date range

2. **Check filters**:
   - Invalid filter selections may cause errors
   - Try removing filters

3. **Check system load**:
   - If many users are running reports simultaneously, system may be slow
   - Try again during off-peak hours

4. **Check data integrity**:
   - Corrupted data may cause report failures
   - Contact support if issue persists

---

### Integration Not Syncing

**Issue:** Fuel card data, Teams messages, etc. not syncing

**Troubleshooting steps:**

1. **Check integration status**:
   - Go to **Settings** → **Integrations**
   - Find integration
   - Check status indicator (green = working, red = error)

2. **Test connection**:
   - Click **"Test Connection"**
   - If fails, verify API credentials are valid

3. **Check sync logs**:
   - Click **"View Sync Logs"**
   - Look for errors

4. **Re-authorize**:
   - Some integrations (Teams, fuel cards) require periodic re-authorization
   - Click **"Re-authorize"** and sign in again

5. **Check API quotas**:
   - Some third-party APIs have rate limits or quotas
   - Verify your account is within limits

---

### Performance Issues

**Issue:** System is slow or unresponsive

**Troubleshooting steps:**

1. **Check system health**:
   - Go to **Settings** → **System** → **Health Dashboard**
   - Look for red indicators

2. **Check active users**:
   - High number of concurrent users may slow system
   - Consider scaling resources (contact support)

3. **Clear cache**:
   - Go to **Settings** → **System** → **Cache**
   - Click **"Clear System Cache"**

4. **Check browser**:
   - User's browser may be slow due to extensions, outdated version
   - Try different browser
   - Clear browser cache

5. **Check network**:
   - Slow internet connection
   - Run speed test
   - Check if issue is specific to certain locations/networks

---

## Getting Help

**Support Resources:**

- **Documentation**: [docs/README.md](README.md)
- **User Guide**: [docs/USER_GUIDE.md](USER_GUIDE.md)
- **API Documentation**: [docs/API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Troubleshooting Guide**: [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Contact Support:**

- **Email**: `support@capitaltechalliance.com`
- **Phone**: 1-800-FLEET-HELP (Mon-Fri, 8am-5pm EST)
- **Emergency** (system down): Call main number, press 1 for critical support

**When contacting support, provide:**
- Tenant name and admin email
- Detailed description of issue
- Steps to reproduce
- Screenshots or error messages
- Browser and device information
- Urgency level (low, medium, high, critical)

---

## Appendix

### Admin Checklist - Daily

- [ ] Review system health dashboard
- [ ] Check for critical alerts
- [ ] Review new user requests
- [ ] Monitor support tickets

### Admin Checklist - Weekly

- [ ] Review audit logs for anomalies
- [ ] Verify backup completion
- [ ] Update user roles/permissions as needed
- [ ] Review system usage reports

### Admin Checklist - Monthly

- [ ] Review security policies
- [ ] Audit user access (remove inactive accounts)
- [ ] Review integration health
- [ ] Test disaster recovery procedures
- [ ] Update documentation

### Admin Checklist - Quarterly

- [ ] Conduct security audit
- [ ] Renew API keys and certificates
- [ ] Plan system updates
- [ ] Train new administrators
- [ ] Review and optimize system performance

---

**Version:** 1.0
**Last Updated:** November 2025
**Maintained by:** Capital Tech Alliance
