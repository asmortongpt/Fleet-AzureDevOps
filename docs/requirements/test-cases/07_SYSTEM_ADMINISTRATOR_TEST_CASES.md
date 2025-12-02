# System Administrator - Test Cases

**Role**: System Administrator
**Access Level**: Full Administrative
**Primary Interface**: Web Dashboard (Admin Portal)
**Version**: 1.0
**Date**: November 10, 2025
**Total Test Cases**: 24

---

## Table of Contents

1. [User Management Test Cases (TC-SA-001 to TC-SA-006)](#user-management)
2. [Role-Based Access Control Test Cases (TC-SA-007 to TC-SA-010)](#rbac)
3. [Single Sign-On & Integration Test Cases (TC-SA-011 to TC-SA-014)](#sso-integration)
4. [API Management Test Cases (TC-SA-015 to TC-SA-017)](#api-management)
5. [Backup & Recovery Test Cases (TC-SA-018 to TC-SA-020)](#backup-recovery)
6. [Security & Audit Test Cases (TC-SA-021 to TC-SA-024)](#security-audit)

---

## User Management

### TC-SA-001: Create Single User Account with Role Assignment

**Test Case ID**: TC-SA-001
**Test Case Name**: Create Single User Account with Role Assignment
**Related User Story**: US-SA-001
**Related Use Case**: UC-SA-001
**Priority**: High
**Test Type**: Functional / Regression
**Complexity**: Medium

#### Preconditions:
- System Administrator is logged into admin portal with full privileges
- User database is accessible and operational
- Email service (SMTP/SendGrid) is configured and operational
- At least one role definition exists in the system (e.g., "Fleet Manager")
- Network connectivity to email provider is active

#### Test Steps:
1. Navigate to **Admin Portal > User Management > Create User**
2. Complete user creation form with following data:
   - Email: newuser@company.com
   - First Name: Sarah
   - Last Name: Johnson
   - Phone: (555) 123-4567
   - Job Title: Fleet Operations Manager
   - Department: Operations
   - Office Location: Boston, MA
3. Click **Select Role** dropdown and select "Fleet Manager"
4. Verify permission checkboxes appear for selected role
5. Enable checkboxes: "View Reports", "Approve Work Orders"
6. Leave account expiration date blank (permanent account)
7. Enable "Require Multi-Factor Authentication" toggle
8. Click **Create User** button
9. Verify confirmation message appears
10. Check system-generated temporary password is displayed
11. Verify welcome email is sent to newuser@company.com

#### Expected Results:
- User account created successfully with status "Active"
- Temporary password generated and displayed to administrator
- Welcome email received containing:
  - Login URL
  - Temporary password
  - Instructions to set permanent password
  - System access guide for Fleet Manager role
  - Security policies document
- Audit log entry created: "User created: newuser@company.com by admin@company.com at [timestamp]"
- User appears in User Directory with all entered information

#### Acceptance Criteria:
- User account record created in database
- Email delivered within 30 seconds
- Temporary password meets complexity requirements (12+ chars, uppercase, lowercase, numbers, special)
- User can login with temporary password and forced password reset
- Role permissions applied correctly to new user
- All required fields validated before creation
- Audit trail captures creator identity and timestamp

#### Test Data:
```
Email: newuser@company.com
First Name: Sarah
Last Name: Johnson
Phone: (555) 123-4567
Job Title: Fleet Operations Manager
Department: Operations
Location: Boston, MA
Role: Fleet Manager
Permissions: View Reports, Approve Work Orders
Account Expiration: None
MFA Required: Yes
```

---

### TC-SA-002: Bulk Import Users from CSV File

**Test Case ID**: TC-SA-002
**Test Case Name**: Bulk Import Users from CSV File
**Related User Story**: US-SA-001
**Related Use Case**: UC-SA-001
**Priority**: High
**Test Type**: Functional / Integration
**Complexity**: High

#### Preconditions:
- System Administrator has bulk import permission
- CSV template is available for download
- Email service configured for bulk welcome emails (queue-based)
- Database batch insert capability operational
- Validation rules defined for CSV import

#### Test Steps:
1. Navigate to **Admin Portal > User Management > Bulk Import**
2. Click **Download CSV Template** button
3. Populate CSV file with 50 user records containing:
   - Column A: Email addresses (unique, valid format)
   - Column B: First Names
   - Column C: Last Names
   - Column D: Phone Numbers
   - Column E: Job Titles
   - Column F: Departments
   - Column G: Office Locations
   - Column H: Role (single role per user)
4. Add test data: 48 valid records, 2 with errors (duplicate email, invalid email format)
5. Click **Select File** and upload CSV
6. System displays validation results page
7. Verify system identifies: "48 valid records, 2 invalid records"
8. Review invalid records details
9. Click **Fix Errors** and correct invalid records in place
10. System re-validates: "All 50 records valid"
11. Click **Import Users** to confirm
12. Monitor import progress bar
13. Verify completion message
14. Validate all 50 users appear in User Directory

#### Expected Results:
- CSV validation succeeds with detailed error reporting
- Invalid records clearly identified with specific error messages
- User can correct errors and re-validate
- All 50 users created successfully in one batch operation
- Each user receives welcome email (may be queued for delivery)
- Import operation logged with timestamp, number of records, admin identity
- Database transaction handles all-or-nothing consistency
- No partial imports (rollback on any critical error)

#### Acceptance Criteria:
- CSV parser validates file format and required columns
- Email format validation (RFC 5322 compliant)
- Duplicate email detection prevents duplicates
- Batch creation completes within 5 minutes for 50 users
- Each user receives unique temporary password
- All audit logs created for each user
- Email sending queued and trackable
- Import operation is atomic (all succeed or all rollback)

#### Test Data:
```
CSV with 50 rows:
- Row 1-48: Valid user data with unique emails
- Row 49: Duplicate email from Row 1
- Row 50: Invalid email format (missing @domain)

Sample data:
email1@company.com,John,Smith,5551234567,Driver,Operations,Boston
email2@company.com,Jane,Doe,5552345678,Dispatcher,Operations,New York
[... 48 rows total ...]
email1@company.com,Duplicate,Email,5553456789,Driver,Operations,Atlanta
invalidemail,Invalid,Format,5554567890,Manager,Operations,Chicago
```

---

### TC-SA-003: Modify User Permissions and Role Assignment

**Test Case ID**: TC-SA-003
**Test Case Name**: Modify User Permissions and Role Assignment
**Related User Story**: US-SA-001
**Related Use Case**: UC-SA-001
**Priority**: High
**Test Type**: Functional / Regression
**Complexity**: Medium

#### Preconditions:
- System Administrator has user modification privileges
- Target user account exists and is active
- Target user currently logged out or session will be invalidated
- Role definitions exist with different permission sets
- Audit logging configured

#### Test Steps:
1. Navigate to **Admin Portal > User Management > User Directory**
2. Search for user: "john.smith@company.com"
3. Click on user record to open user detail view
4. Verify current role displays: "Driver"
5. Click **Edit** button
6. Verify current permissions displayed:
   - View Own Trips: Enabled
   - View Reports: Disabled
   - Approve Work Orders: Disabled
7. Click **Role** dropdown and change role to "Dispatcher"
8. System updates permission checkboxes to reflect new role:
   - View Reports: Now available
   - Approve Work Orders: Now available
   - View All Trips: Now available
9. Enable "View Reports" and "Approve Work Orders" checkboxes
10. Leave other permissions at role defaults
11. Click **Save Changes** button
12. Verify success message: "User permissions updated successfully"
13. Verify audit log entry created
14. If user is currently logged in, verify forced re-login occurs
15. User logs back in and verifies new permissions functional

#### Expected Results:
- Role changed from Driver to Dispatcher in database
- Permissions updated immediately (within 5 seconds)
- Previous session invalidated if user currently logged in
- User required to re-authenticate after permission change
- Audit log captures: user ID, old role, new role, changed permissions, timestamp, admin ID
- Permission matrix reflects changes correctly
- User's API tokens scoped to new permissions on next refresh

#### Acceptance Criteria:
- Role change applies atomically (all-or-nothing)
- Session invalidation forces immediate re-authentication
- Permission changes visible in audit logs
- User interface updates reflect new permissions immediately
- Role change prevented if would violate privilege escalation rules
- Change preview shows before/after permission comparison

#### Test Data:
```
User Email: john.smith@company.com
Original Role: Driver
New Role: Dispatcher
Permissions to Enable:
- View Reports: Yes
- Approve Work Orders: Yes
Change Reason: "Promotion to Dispatcher position"
Admin: admin@company.com
```

---

### TC-SA-004: Deactivate User Account (Soft Delete)

**Test Case ID**: TC-SA-004
**Test Case Name**: Deactivate User Account (Soft Delete)
**Related User Story**: US-SA-001
**Related Use Case**: UC-SA-001
**Priority**: High
**Test Type**: Functional / Regression
**Complexity**: Medium

#### Preconditions:
- Target user account exists and is active
- User may have active sessions, API keys, or scheduled jobs
- User's historical data exists and must be preserved
- Audit logging configured

#### Test Steps:
1. Navigate to **Admin Portal > User Management > User Directory**
2. Search and open user record for "mike.torres@company.com"
3. Verify user status: "Active"
4. Click **Deactivate Account** button
5. System displays deactivation confirmation dialog with:
   - Current active sessions: 2
   - Active API keys: 3
   - Scheduled jobs: 5
   - Data to be preserved (read-only)
6. Select deactivation reason: "Employee Terminated"
7. Enter deactivation notes: "Last day of employment 2025-11-10"
8. Check acknowledgment: "I understand all active access will be revoked"
9. Click **Confirm Deactivation** button
10. System displays progress:
    - Terminating active sessions...
    - Revoking API keys...
    - Cancelling scheduled jobs...
    - Marking account inactive...
11. Verify completion message
12. Verify user status changed to "Inactive" in directory
13. Attempt to login as deactivated user
14. Verify login fails with message: "Account is inactive"

#### Expected Results:
- User account status changed to "Inactive" (soft delete)
- All active sessions immediately terminated
- All API keys revoked and invalidated
- All scheduled jobs cancelled without data loss
- User cannot login (authentication denied)
- User's historical data remains intact and queryable
- Audit log entry captures deactivation details
- Administrator receives confirmation of completion
- User's data visible in reports if date-scoped before deactivation

#### Acceptance Criteria:
- Deactivation is reversible (account can be reactivated)
- No data deletion (soft delete only, not hard delete)
- Active sessions terminated within 10 seconds
- API keys invalidated immediately
- Login attempts logged and denied
- Audit trail includes deactivation reason and timestamp
- User data remains accessible for reporting and compliance

#### Test Data:
```
User Email: mike.torres@company.com
Original Status: Active
New Status: Inactive
Deactivation Reason: Employee Terminated
Deactivation Notes: Last day of employment 2025-11-10
Active Sessions Before: 2 (all terminated)
Active API Keys Before: 3 (all revoked)
Scheduled Jobs Before: 5 (all cancelled)
Data Preservation: Complete
Admin: admin@company.com
```

---

### TC-SA-005: Force Password Reset for User Account

**Test Case ID**: TC-SA-005
**Test Case Name**: Force Password Reset for User Account
**Related User Story**: US-SA-001
**Related Use Case**: UC-SA-001
**Priority**: High
**Test Type**: Functional / Security
**Complexity**: Low

#### Preconditions:
- Target user account exists and is active
- User is currently logged in to system
- Email service configured and operational
- Password reset token generation functional

#### Test Steps:
1. Navigate to **Admin Portal > User Management > User Directory**
2. Search for user: "sarah.williams@company.com"
3. Open user detail view
4. Click **Actions** menu dropdown
5. Select **Force Password Reset**
6. System displays confirmation dialog
7. Click **Confirm** button
8. System generates password reset token
9. System sends password reset email to user
10. Verify confirmation message: "Password reset email sent"
11. Check user's email for password reset link
12. Verify reset link contains token with 24-hour expiration
13. Click reset link in email
14. System prompts for new password
15. Enter new password meeting complexity requirements
16. Verify password accepted
17. Attempt login with new password
18. Verify login successful

#### Expected Results:
- Password reset email sent within 30 seconds
- Reset link valid for 24 hours
- Reset link one-time use (token consumed after use)
- User's current session not invalidated (password reset is for next login)
- Audit log captures force reset request: user, admin, timestamp
- New password validated against complexity policy:
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, special characters
  - Not in password history (last 5 passwords)
- User can login with new password

#### Acceptance Criteria:
- Password reset token generated and stored securely
- Email delivery within 30 seconds
- Reset link accessible and functional
- Reset link expires after 24 hours or first use
- New password meets complexity requirements
- Audit trail captures force reset action
- User can login with new password immediately

#### Test Data:
```
User Email: sarah.williams@company.com
Reset Reason: User forgot password / Security incident
New Password: NewSecurePass@2025
Password Requirements:
- Length: 12+ characters
- Uppercase: Yes (N)
- Lowercase: Yes (e, w, S, e, c, u, r, e, P, a, s, s)
- Numbers: Yes (2025)
- Special Characters: Yes (@)
- Not in history: Confirmed
```

---

### TC-SA-006: View User Activity and Login History

**Test Case ID**: TC-SA-006
**Test Case Name**: View User Activity and Login History
**Related User Story**: US-SA-001
**Related Use Case**: UC-SA-001
**Priority**: Medium
**Test Type**: Functional / Analytics
**Complexity**: Low

#### Preconditions:
- Target user account has activity history
- User has logged in at least once in the past 90 days
- Activity logging enabled and operational
- Audit logs stored and queryable

#### Test Steps:
1. Navigate to **Admin Portal > User Management > User Directory**
2. Search for user: "john.doe@company.com"
3. Open user detail view
4. Click **Activity History** tab
5. Verify last login information displays:
   - Date: 2025-11-10
   - Time: 14:23:15
   - Location/IP: 192.168.1.100
   - Device: Chrome on Windows 10
6. Scroll through activity timeline showing:
   - Login events
   - Permission changes
   - Data access events
   - Report generation
7. Filter activity by date range: Last 30 days
8. Filter activity by action type: "Login"
9. Verify filtered results show only login events for selected period
10. Click on specific activity entry to view details
11. Verify details include: timestamp, action, resource, result, IP address

#### Expected Results:
- User activity timeline displays all events in chronological order
- Last login information accurate and current
- Activity filters work correctly (date range, action type)
- Activity details include sufficient context for audit purposes
- Pagination handles large activity histories (1000+ events)
- Performance: Activity loads within 3 seconds
- Export option available to download activity report

#### Acceptance Criteria:
- Activity history accurate and complete
- Filters return correct subset of events
- Activity details sufficient for security investigation
- Performance acceptable for real-time queries
- Data retention meets compliance requirements (90+ days)

#### Test Data:
```
User Email: john.doe@company.com
Activity Period: Last 30 days
Last Login: 2025-11-10 14:23:15 UTC
Login Events in Period: 15
Data Access Events: 42
Report Generations: 8
Permission Changes: 1
Activity Filter: Login events only
Results: 15 events
```

---

## RBAC

### TC-SA-007: Create Custom Role with Granular Permissions

**Test Case ID**: TC-SA-007
**Test Case Name**: Create Custom Role with Granular Permissions
**Related User Story**: US-SA-002
**Related Use Case**: UC-SA-002
**Priority**: High
**Test Type**: Functional / Regression
**Complexity**: High

#### Preconditions:
- System Administrator has role management privileges
- Default roles exist in system
- Permission matrix defined and accessible
- Role definitions stored and queryable

#### Test Steps:
1. Navigate to **Admin Portal > Roles & Permissions > Roles**
2. Click **Create New Role** button
3. Enter role information:
   - Role Name: "Supervisor Driver"
   - Description: "Senior driver with limited supervisory duties"
   - Role Type: Custom
4. Display permission matrix with all modules vs. actions (Create, Read, Update, Delete)
5. Configure module-level permissions:
   - **Trips**: Create (No), Read (Yes), Update (Own only), Delete (No)
   - **Reports**: Create (No), Read (Yes), Update (No), Delete (No)
   - **Vehicles**: Create (No), Read (Yes), Update (No), Delete (No)
   - **Users**: Create (No), Read (Limited - own team), Update (No), Delete (No)
   - **Work Orders**: Create (Yes), Read (Yes), Update (Own only), Delete (No)
6. Configure data-level restrictions:
   - Location Access: Selected locations only (Boston, NYC)
   - Vehicle Type: All types
   - Team Access: Own team only
7. Verify each permission combination is valid
8. Click **Preview Permissions** to show effective permission set
9. System displays: "This role can: view all reports, manage own work orders, view team members"
10. Click **Create Role** button
11. Verify success message
12. Search for new role in role directory
13. Verify role appears with correct permissions

#### Expected Results:
- Custom role created successfully
- Permission matrix configuration saves correctly
- Permission preview shows accurate summary of effective access
- Role usable immediately for user assignment
- Role appears in role directory with creation timestamp and creator
- Permission changes to this role apply to all assigned users
- Audit log captures role creation with permission details
- No privilege escalation possible (can't grant permissions admin doesn't have)

#### Acceptance Criteria:
- Role definition stored in database with all permissions
- Permission matrix validates logical consistency
- Role preview matches actual permissions granted
- Role applied to users correctly
- Permission inheritance rules enforced
- Audit trail captures complete role definition

#### Test Data:
```
Role Name: Supervisor Driver
Description: Senior driver with limited supervisory duties
Role Type: Custom
Permissions:
  Trips:
    Create: No
    Read: Yes
    Update: Own only
    Delete: No
  Reports:
    Create: No
    Read: Yes
    Update: No
    Delete: No
  Vehicles:
    Create: No
    Read: Yes
    Update: No
    Delete: No
  Users:
    Create: No
    Read: Limited (own team)
    Update: No
    Delete: No
  Work Orders:
    Create: Yes
    Read: Yes
    Update: Own only
    Delete: No
Data Restrictions:
  Location: Boston, NYC
  Vehicle Type: All
  Team Access: Own team only
Created By: admin@company.com
```

---

### TC-SA-008: Clone Existing Role and Modify Permissions

**Test Case ID**: TC-SA-008
**Test Case Name**: Clone Existing Role and Modify Permissions
**Related User Story**: US-SA-002
**Related Use Case**: UC-SA-002
**Priority**: High
**Test Type**: Functional / Efficiency
**Complexity**: Medium

#### Preconditions:
- Source role exists in system (e.g., "Dispatcher")
- System Administrator has role modification privileges
- Permission matrix accessible

#### Test Steps:
1. Navigate to **Admin Portal > Roles & Permissions > Roles**
2. Search for existing role: "Dispatcher"
3. Click **Actions** menu
4. Select **Clone Role**
5. System displays clone dialog with fields pre-filled:
   - Base Role: "Dispatcher"
   - New Role Name: "Dispatcher (Premium)" [editable]
   - Description: [empty, editable]
6. Verify permissions copied from base role
7. Edit new role name to: "Dispatcher Premium"
8. Add description: "Enhanced dispatcher with advanced reporting access"
9. Click **Next** to proceed to permission editor
10. Modify permissions:
    - Add "Advanced Reports" (Create, Read) to base permissions
    - Add "API Access" (Read) permission
11. Review permission changes: Original vs. Cloned
12. Click **Create Cloned Role**
13. Verify success message
14. Confirm new role appears in role directory

#### Expected Results:
- Base role permissions copied completely to new role
- New role editable without affecting base role
- Permission modifications apply to cloned role only
- Base role remains unchanged
- New role immediately available for user assignment
- Audit log captures: source role, new role, permission changes, timestamp, admin
- Permission matrix shows both roles with their respective permissions

#### Acceptance Criteria:
- Clone operation completes successfully
- New role has independent permission set
- Base role unaffected by modifications
- Both roles visible and functional in system
- Permission changes restricted to new role only

#### Test Data:
```
Base Role: Dispatcher
New Role Name: Dispatcher Premium
Description: Enhanced dispatcher with advanced reporting access
Additional Permissions:
  - Advanced Reports: Create (Yes), Read (Yes)
  - API Access: Read (Yes)
Clone Created By: admin@company.com
```

---

### TC-SA-009: Prevent Privilege Escalation (Permission Validation)

**Test Case ID**: TC-SA-009
**Test Case Name**: Prevent Privilege Escalation (Permission Validation)
**Related User Story**: US-SA-002
**Related Use Case**: UC-SA-002
**Priority**: High
**Test Type**: Security / Regression
**Complexity**: Medium

#### Preconditions:
- Test User A has "Dispatcher" role (no user management permissions)
- Test Admin B has "System Administrator" role (all permissions)
- Privilege escalation prevention rules defined and enforced
- Role management interface operational

#### Test Steps:
1. Log in as Test User A (Dispatcher - no admin permissions)
2. Navigate to **Admin Portal > Roles & Permissions**
3. Verify page unavailable or read-only
4. Attempt to access role editing interface: /admin/roles/edit
5. System returns 403 Forbidden error
6. Log out and log in as Test Admin B (System Administrator)
7. Navigate to **Roles & Permissions > Roles > Dispatcher**
8. Click **Edit** to modify role
9. Attempt to add "User Management - Create" permission
10. System displays warning: "This action grants permissions you currently don't have"
11. Verify change is rejected or requires approval
12. Navigate to **Roles & Permissions > Create Role**
13. Attempt to assign "Super Admin" level permissions
14. System prevents assigning permissions beyond current user's scope
15. Verify confirmation message: "Cannot assign permissions not held by current user"

#### Expected Results:
- Non-admin user cannot access role management interface
- Permission validation prevents privilege escalation
- System logs all escalation attempts (attempted and blocked)
- Permission grants restricted to permissions held by current admin
- System enforces role hierarchy (no crossing privilege boundaries)
- All attempts to escalate captured in audit logs
- System sends alert on repeated escalation attempts

#### Acceptance Criteria:
- Permission validation enforced consistently
- Privilege escalation attempts blocked
- Audit trail captures all attempts (successful and failed)
- Error messages guide users to proper channels for permission requests
- No way to bypass privilege escalation controls

#### Test Data:
```
Test User A (Dispatcher):
- Current Permissions: View trips, Create work orders, View reports
- Attempted Action: Create new admin role
- Result: Access Denied (403 Forbidden)
- Audit Log: "Unauthorized access attempt - Dispatcher user attempting role creation"

Test Admin B (System Administrator):
- Current Permissions: All permissions
- Attempted Action: Grant "Super Admin" to new role
- Result: Permission validation warning shown
- Result: Admin can grant permissions, but within their scope
```

---

### TC-SA-010: Export Role Definitions for Documentation

**Test Case ID**: TC-SA-010
**Test Case Name**: Export Role Definitions for Documentation
**Related User Story**: US-SA-002
**Related Use Case**: UC-SA-002
**Priority**: Medium
**Test Type**: Functional / Compliance
**Complexity**: Low

#### Preconditions:
- Multiple roles exist in system
- Export functionality configured
- System Administrator has export permissions
- File system accessible for download

#### Test Steps:
1. Navigate to **Admin Portal > Roles & Permissions > Roles**
2. View list of all roles (minimum 5 roles)
3. Click **Export Roles** button
4. System displays export options:
   - Format: PDF, Excel, JSON (select PDF)
   - Include Permissions: Yes
   - Include Data Restrictions: Yes
   - Include Assigned Users: Yes
5. Select all roles to export (or filter to specific roles)
6. Click **Generate Export** button
7. System generates PDF document containing:
   - Role name and description
   - Permission matrix (all modules vs. actions)
   - Data access restrictions
   - Number of assigned users
   - Creation date and admin
8. Download completes within 10 seconds
9. Open PDF and verify:
   - All roles included
   - Permissions matrix accurate and readable
   - Data restrictions clearly listed
   - Professional formatting suitable for audit/documentation
   - Timestamp of export included

#### Expected Results:
- Export completes successfully in selected format
- All role data included in export
- Export file is valid and readable
- Document suitable for compliance documentation
- Export logged with timestamp and admin identity
- Can be printed and attached to audit reports
- Multiple format options available (PDF, Excel, JSON)

#### Acceptance Criteria:
- Export includes complete role definition
- Format is readable and audit-ready
- Export completed within 30 seconds
- File sizes reasonable (<10MB for 50 roles)
- Can be used for compliance audits

#### Test Data:
```
Roles to Export: All (5 roles)
  - Administrator
  - Dispatcher
  - Driver
  - Fleet Manager
  - Report Viewer
Export Format: PDF
Export Date: 2025-11-10
Include: Permissions, Data Restrictions, Assigned Users Count
File Name: Role_Definitions_Export_20251110.pdf
```

---

## SSO & Integration

### TC-SA-011: Configure SAML 2.0 Integration with Azure AD

**Test Case ID**: TC-SA-011
**Test Case Name**: Configure SAML 2.0 Integration with Azure AD
**Related User Story**: US-SA-004
**Related Use Case**: UC-SA-004
**Priority**: High
**Test Type**: Functional / Integration
**Complexity**: High

#### Preconditions:
- System Administrator has SSO configuration privileges
- Azure AD tenant configured with application registration
- SAML endpoints configured and accessible
- SSL certificates valid and installed
- Network connectivity to Azure AD

#### Test Steps:
1. Navigate to **Admin Portal > System Configuration > SSO Configuration**
2. Click **Add SSO Provider**
3. Select provider type: "SAML 2.0"
4. Select identity provider: "Azure AD"
5. System displays configuration form with fields:
   - Entity ID: (pre-filled with app URL)
   - SSO Service URL: (from IdP metadata)
   - Certificate: (upload IdP certificate)
   - Attribute Mapping: (configure claim mappings)
6. Upload Azure AD metadata XML file from tenant
7. System parses metadata and extracts:
   - SSO Endpoint URL
   - Logout Endpoint URL
   - Certificate information
8. Verify extracted values match expected configuration
9. Configure attribute mappings:
   - email (claim) → email_address (user field)
   - given_name (claim) → first_name
   - family_name (claim) → last_name
   - jobTitle (claim) → job_title
10. Enable "Just-In-Time Provisioning" toggle
11. Set provisioning rules:
    - Auto-create users on first SAML login: Yes
    - Assign default role: "Driver"
    - Require email verification: No
12. Click **Test Configuration** button
13. System initiates test SAML flow
14. System displays test result: "SAML configuration valid and operational"
15. Review metadata validation:
    - Certificate valid: Yes
    - Endpoints responsive: Yes
    - Signature verification: Passed
16. Click **Enable SSO Provider** button
17. Verify SSO provider appears as active in configuration list

#### Expected Results:
- SAML configuration saved successfully
- Metadata parsed and validated
- Attribute mappings configured correctly
- Test SAML authentication flow succeeds
- SSO provider active and ready for users
- Configuration securely stored (credentials encrypted)
- Audit log captures: SSO provider added, configuration details, timestamp
- JIT provisioning ready to create users on first login
- Fallback to local authentication configured

#### Acceptance Criteria:
- SAML metadata parsed successfully
- Attribute mappings validated
- Test authentication succeeds with real Azure AD
- SSO provider functional after configuration
- Users can login via SAML
- New users auto-created per JIT settings
- Audit trail captures configuration changes

#### Test Data:
```
SSO Provider: Azure AD
Provider Type: SAML 2.0
Entity ID: https://fleet.company.com
SSO Service URL: https://login.microsoftonline.com/[tenant-id]/saml2
Logout URL: https://login.microsoftonline.com/[tenant-id]/saml2
Certificate: [Azure AD certificate content]
Attribute Mappings:
  email → email_address
  given_name → first_name
  family_name → last_name
  jobTitle → job_title
JIT Provisioning: Enabled
Default Role: Driver
Auto-create Users: Yes
Configured By: admin@company.com
```

---

### TC-SA-012: Test SSO Connection and Fallback to Local Auth

**Test Case ID**: TC-SA-012
**Test Case Name**: Test SSO Connection and Fallback to Local Auth
**Related User Story**: US-SA-004
**Related Use Case**: UC-SA-004
**Priority**: High
**Test Type**: Functional / Reliability
**Complexity**: High

#### Preconditions:
- SAML SSO configuration completed and active (TC-SA-011)
- Azure AD accessible and operational
- Local authentication enabled as fallback
- Network connectivity to both systems

#### Test Steps:
1. Open login page in incognito/private browser window
2. Verify login interface displays SSO option: "Sign in with Azure AD"
3. Click SSO login button
4. System redirects to Azure AD login page
5. Enter valid Azure AD credentials: azureuser@company.onmicrosoft.com / Password123
6. Azure AD authenticates user
7. System receives SAML assertion
8. System processes SAML assertion and claims
9. User auto-logged in to fleet system
10. Verify user profile matches Azure AD attributes:
    - Email: azureuser@company.onmicrosoft.com
    - Name: Azure User
    - Role: Driver (auto-assigned per JIT settings)
11. Logout and return to login page
12. Simulate Azure AD outage: Disable SAML endpoint (block network access)
13. Click SSO login button
14. System attempts SAML connection and detects failure
15. System displays fallback message: "Sign in with your local account instead"
16. System redirects to local login form
17. Enter local credentials: localuser@fleet.com / LocalPass123
18. Verify user successfully logged in via local authentication
19. Re-enable Azure AD access
20. Verify SSO available again on next login

#### Expected Results:
- SSO login succeeds with valid Azure AD credentials
- User auto-provisioned with correct attributes
- User role assigned per JIT rules
- SSO failure triggers fallback to local authentication
- Fallback authentication works without SSO
- User seamlessly switches between SSO and local auth
- No data loss or session corruption during failover
- Audit logs capture both SSO and local auth events
- SSO automatically resumes when provider available

#### Acceptance Criteria:
- SSO authentication succeeds when available
- Fallback to local authentication works reliably
- No data inconsistency between authentication methods
- Audit trail shows both SSO and local auth attempts
- User session consistent regardless of auth method

#### Test Data:
```
SAML Test:
  Azure AD Credentials:
    Email: azureuser@company.onmicrosoft.com
    Password: [valid Azure AD password]
  Expected Result: SSO login succeeds

Fallback Test:
  SSO Status: Unavailable (network blocked)
  Local Credentials:
    Email: localuser@fleet.com
    Password: [valid local password]
  Expected Result: Local auth fallback succeeds

Audit Logs:
  SSO Login: "User azureuser@company.onmicrosoft.com authenticated via SAML"
  Local Login: "User localuser@fleet.com authenticated via local credentials"
```

---

### TC-SA-013: Configure Third-Party Telematics Integration

**Test Case ID**: TC-SA-013
**Test Case Name**: Configure Third-Party Telematics Integration
**Related User Story**: US-SA-006
**Related Use Case**: UC-SA-006
**Priority**: High
**Test Type**: Functional / Integration
**Complexity**: High

#### Preconditions:
- System Administrator has integration management privileges
- Third-party telematics account configured (e.g., Geotab)
- API credentials available and valid
- Integration configuration interface operational
- Network connectivity to telematics provider

#### Test Steps:
1. Navigate to **Admin Portal > System Configuration > Integrations**
2. Click **Add Integration**
3. Select integration category: "Telematics"
4. Select provider: "Geotab"
5. System displays configuration form with fields:
   - Provider: Geotab (selected)
   - API Endpoint: https://api.geotab.com
   - API Key: [text input]
   - API Secret: [text input, masked]
   - Authentication Type: OAuth 2.0
6. Enter credentials:
   - API Key: geotab_test_key_12345
   - API Secret: geotab_test_secret_67890
7. Configure field mappings:
   - Geotab Device → Fleet Vehicle ID
   - Geotab GPS → Trip Latitude/Longitude
   - Geotab Odometer → Vehicle Odometer
   - Geotab Fuel Level → Vehicle Fuel Level
8. Set synchronization parameters:
   - Sync Frequency: Real-time (push via webhook)
   - Retry Policy: Exponential backoff
   - Error Handling: Log and alert on critical errors
9. Configure webhook endpoint:
   - Webhook URL: https://fleet.company.com/webhooks/geotab
   - Webhook Secret: [auto-generated]
10. Click **Test Connection** button
11. System verifies API credentials:
    - Result: "Successfully connected to Geotab API"
    - Received test data: "5 vehicles and 15 recent trips"
12. Click **Validate Field Mappings**
13. System confirms mapping compatibility
14. Click **Enable Integration**
15. Verify integration shows as "Active" with timestamp
16. Monitor integration status dashboard:
    - Last successful sync: [timestamp]
    - Vehicles synced: 5
    - Trips synced: 15
    - Next sync: [scheduled time]

#### Expected Results:
- Integration configuration saved successfully
- Credentials stored securely (encrypted in Azure Key Vault)
- Field mappings validated and functional
- Test connection succeeds with valid credentials
- Webhook endpoint configured and operational
- Integration becomes active and begins syncing data
- Audit log captures: integration added, credentials hash, configuration
- Integration appears in status dashboard with health metrics
- Data sync begins immediately after activation
- Error handling configured per specifications

#### Acceptance Criteria:
- Integration connects successfully to provider
- Credentials validated before saving
- Field mappings correct and data flows properly
- Test data received confirms connectivity
- Integration status visible on dashboard
- Audit trail captures integration configuration

#### Test Data:
```
Provider: Geotab
API Endpoint: https://api.geotab.com
API Key: geotab_test_key_12345
API Secret: geotab_test_secret_67890
Auth Type: OAuth 2.0
Field Mappings:
  Geotab Device → Fleet Vehicle ID
  Geotab GPS → Trip Latitude/Longitude
  Geotab Odometer → Vehicle Odometer
  Geotab Fuel Level → Vehicle Fuel Level
Sync Frequency: Real-time (webhook)
Webhook URL: https://fleet.company.com/webhooks/geotab
Test Result: Connected successfully
Vehicles Synced: 5
Trips Synced: 15
Configured By: admin@company.com
```

---

### TC-SA-014: View Integration Health and Sync Status

**Test Case ID**: TC-SA-014
**Test Case Name**: View Integration Health and Sync Status
**Related User Story**: US-SA-006
**Related Use Case**: UC-SA-006
**Priority**: Medium
**Test Type**: Functional / Monitoring
**Complexity**: Low

#### Preconditions:
- Multiple integrations configured and active (TC-SA-013)
- Integration health monitoring operational
- Sync logs collected and stored
- Integration dashboard accessible

#### Test Steps:
1. Navigate to **Admin Portal > System Configuration > Integrations**
2. View integration list showing all configured integrations:
   - Geotab (Telematics)
   - WEX (Fuel Card)
   - QuickBooks (ERP)
3. Verify each integration shows status badge:
   - Status: "Active" (green), "Inactive" (gray), "Error" (red)
   - Last Sync: [timestamp]
   - Next Sync: [scheduled time]
4. Click on "Geotab" integration to view detail
5. System displays integration dashboard with:
   - Status: Active
   - Last successful sync: 2025-11-10 14:32:15
   - Sync count today: 47
   - Vehicles synced: 5
   - Trips synced: 142
   - Error count: 0
6. View sync history log:
   - Successful syncs: 10
   - Failed syncs: 0 (last 24 hours)
   - Average sync duration: 3.2 seconds
7. Click **View Detailed Logs** to see individual sync operations
8. Filter logs by date range: Last 7 days
9. Verify log shows:
   - Timestamp of each sync
   - Records processed (vehicles, trips, etc.)
   - Success/failure status
   - Any errors or warnings
10. Search logs for specific error: "Connection timeout"
11. Verify search returns only timeout-related logs
12. Click on error entry for details
13. View error details:
    - Error type: Connection Timeout
    - Timestamp: 2025-11-10 12:45:30
    - Resolution: Retry scheduled for 12:46:00
    - Resolution status: Retry succeeded

#### Expected Results:
- Integration dashboard shows current status
- Last sync time accurate and current
- Sync history available and searchable
- Error logs detailed with resolution information
- Dashboard updates in real-time as syncs occur
- Performance metrics (sync duration) tracked
- Error patterns identifiable (repeated failures)
- Health metrics indicate integration reliability

#### Acceptance Criteria:
- Integration status accurate and current
- Sync history logged completely
- Performance metrics tracked accurately
- Error details sufficient for troubleshooting
- Dashboard loads within 3 seconds

#### Test Data:
```
Integration: Geotab
Status: Active
Last Sync: 2025-11-10 14:32:15
Sync Count (24h): 47
Vehicles Synced: 5
Trips Synced: 142
Errors (24h): 0
Successful Syncs (7d): 156
Failed Syncs (7d): 2
Average Sync Duration: 3.2 seconds
```

---

## API Management

### TC-SA-015: Generate and Configure API Key with Rate Limits

**Test Case ID**: TC-SA-015
**Test Case Name**: Generate and Configure API Key with Rate Limits
**Related User Story**: US-SA-005
**Related Use Case**: UC-SA-005
**Priority**: High
**Test Type**: Functional / Security
**Complexity**: Medium

#### Preconditions:
- System Administrator has API key management privileges
- Target user or service account exists
- Rate limiting infrastructure (Redis) operational
- API gateway configured and functional

#### Test Steps:
1. Navigate to **Admin Portal > System Configuration > API Keys**
2. Click **Generate New API Key**
3. Complete API key form:
   - Key Name: "External Reporting System"
   - Key Type: "Service Account"
   - Description: "Used by analytics platform for data retrieval"
   - Associated User: [select or leave blank for service account]
4. Configure permissions:
   - Select permission type: "Custom"
   - Available endpoints:
     - GET /api/vehicles: Yes
     - GET /api/trips: Yes
     - GET /api/reports: Yes
     - POST /api/reports: No
     - DELETE /api/trips: No
5. Set rate limiting:
   - Limit type: "Requests per minute"
   - Rate: 100 requests per minute
   - Burst allowed: Yes (up to 150 requests)
   - Time window: Rolling 1-minute window
6. Configure additional limits:
   - Daily limit: 100,000 requests per day
   - Monthly limit: 2,000,000 requests per month
7. Set key expiration:
   - Expiration date: 2026-11-10 (1 year)
   - Renewal reminder: 30 days before expiration
8. Enable IP whitelisting:
   - Whitelisted IPs: 192.168.1.100, 10.0.0.50
   - Add IP ranges: 172.16.0.0/16
9. Click **Generate Key**
10. System displays generated key: "fleet_live_abc123def456ghi789jkl012"
11. Verify key appears as masked in future views (only first 8 chars visible: fleet_li...)
12. Download key configuration document
13. Copy key to clipboard (one-time display)
14. Verify key immediately active in system
15. Test API key functionality:
    - Make request with key in Authorization header
    - Verify request succeeds
    - Verify rate limit counter increments
    - Monitor rate limit status

#### Expected Results:
- API key generated successfully
- Key format: "fleet_live_" prefix + 32 random characters
- Permissions configured per specification
- Rate limits applied immediately
- Key active and usable for API requests
- Rate limit enforced (requests rejected after limit exceeded)
- Key expires after configured date
- Audit log captures: key generated, permissions, limits, timestamp, admin
- Key only displayed once (security best practice)
- Renewal reminders sent before expiration

#### Acceptance Criteria:
- API key generated with correct format
- Permissions validated and applied
- Rate limits enforced correctly
- IP whitelisting functional
- Key expiration tracked and enforced
- Audit trail captures key generation

#### Test Data:
```
API Key Name: External Reporting System
Key Type: Service Account
Permissions:
  GET /api/vehicles: Yes
  GET /api/trips: Yes
  GET /api/reports: Yes
  POST /api/reports: No
Rate Limits:
  Per Minute: 100 requests (burst up to 150)
  Per Day: 100,000 requests
  Per Month: 2,000,000 requests
Expiration: 2026-11-10
Whitelisted IPs:
  - 192.168.1.100
  - 10.0.0.50
  - 172.16.0.0/16
Generated Key: fleet_live_abc123def456ghi789jkl012
Created By: admin@company.com
```

---

### TC-SA-016: Revoke API Key and Track Usage

**Test Case ID**: TC-SA-016
**Test Case Name**: Revoke API Key and Track Usage
**Related User Story**: US-SA-005
**Related Use Case**: UC-SA-005
**Priority**: High
**Test Type**: Functional / Security
**Complexity**: Medium

#### Preconditions:
- API key exists and is active (from TC-SA-015)
- API key has been used to make requests
- Usage tracking operational
- Rate limiting logs collected

#### Test Steps:
1. Navigate to **Admin Portal > System Configuration > API Keys**
2. Search for API key: "External Reporting System"
3. Click on key to view detail
4. Verify key information displays:
   - Status: "Active"
   - Created: 2025-10-10
   - Expires: 2026-11-10
   - Whitelisted IPs: 192.168.1.100, 10.0.0.50, 172.16.0.0/16
5. View usage statistics:
   - Total requests (all-time): 15,847
   - Requests this month: 287,450
   - Requests today: 8,923
   - Last request: 2025-11-10 14:52:33
   - Average requests per day: 23,483
   - Peak usage time: 14:00-15:00 UTC
6. Click **View Usage Details** tab
7. Display usage breakdown by endpoint:
   - GET /api/vehicles: 6,234 requests (39%)
   - GET /api/trips: 7,102 requests (45%)
   - GET /api/reports: 2,511 requests (16%)
8. View rate limit violations:
   - Total violations: 3
   - Most recent: 2025-11-10 14:50:12 (exceeded per-minute limit)
   - Action taken: Request rejected, error returned
9. Click **Actions** menu
10. Select **Revoke API Key**
11. System displays revocation confirmation dialog:
    - Warning: "This key will be immediately disabled and cannot be recovered"
    - Option to generate replacement key: Yes / No
12. Select reason: "Key compromised"
13. Add notes: "Credentials found in public repository"
14. Click **Confirm Revocation**
15. System revokes key immediately
16. Verify key status changed to "Revoked"
17. Attempt to use revoked key in API request
18. Verify request rejected with error: "API key not found or invalid"
19. Verify audit log entry: "API key revoked: fleet_live_abc123... by admin@company.com at [timestamp]"

#### Expected Results:
- API key usage tracked and displayed
- Usage breakdown by endpoint available
- Rate limit violations logged and visible
- Key revocation immediate (no grace period)
- Revoked key cannot be used for any requests
- New requests with revoked key rejected with clear error
- Audit log captures: key revoked, reason, timestamp, admin
- Usage data retained for historical analysis
- Replacement key generation optional

#### Acceptance Criteria:
- Usage statistics accurate and current
- Rate limit violations tracked completely
- Key revocation effective immediately
- Revoked key rejects all requests
- Audit trail captures revocation details
- Usage data available for compliance reporting

#### Test Data:
```
API Key: fleet_live_abc123def456ghi789jkl012
Usage Statistics:
  Total Requests: 15,847
  Requests This Month: 287,450
  Requests Today: 8,923
  Last Request: 2025-11-10 14:52:33
  Rate Limit Violations: 3
Endpoint Breakdown:
  GET /api/vehicles: 6,234 (39%)
  GET /api/trips: 7,102 (45%)
  GET /api/reports: 2,511 (16%)
Revocation Reason: Key compromised
Revocation Notes: Credentials found in public repository
Revoked By: admin@company.com
Revocation Time: 2025-11-10 15:00:00 UTC
```

---

### TC-SA-017: Configure Webhook for Push-Based Integration

**Test Case ID**: TC-SA-017
**Test Case Name**: Configure Webhook for Push-Based Integration
**Related User Story**: US-SA-005, US-SA-006
**Related Use Case**: UC-SA-005, UC-SA-006
**Priority**: High
**Test Type**: Functional / Integration
**Complexity**: High

#### Preconditions:
- System Administrator has integration management privileges
- Webhook endpoint available and operational
- HTTPS SSL configured for webhook URLs
- Event system operational and capable of triggering webhooks

#### Test Steps:
1. Navigate to **Admin Portal > System Configuration > Webhooks**
2. Click **Create Webhook**
3. Complete webhook configuration form:
   - Webhook Name: "Vehicle Status Push"
   - Description: "Pushes vehicle status updates to external system"
   - Webhook URL: https://external-system.com/webhooks/fleet/vehicle-status
   - Authentication Type: "Bearer Token"
   - Auth Token: [paste Bearer token from external system]
4. Configure event triggers (select events to push):
   - Trip Started: Yes
   - Trip Ended: Yes
   - Vehicle Status Changed: Yes
   - Driver Assignment: No
   - Maintenance Alert: Yes
5. Set webhook delivery parameters:
   - Retry policy: Exponential backoff (max 5 retries)
   - Retry delay: 5, 10, 20, 40, 80 seconds
   - Timeout: 30 seconds
   - Delivery confirmation: Yes (wait for 200 response)
6. Configure payload format:
   - Format: JSON
   - Include metadata: Yes (timestamp, event ID, source)
   - Transform data: Custom mapping (optional)
7. Set rate limiting:
   - Max requests per second: 10
   - Burst allowed: 20
   - Queue behavior: Drop oldest if queue exceeds 100 events
8. Enable test mode:
   - Send test event: Yes
   - Event type: "Trip Started"
   - Vehicle: "VH-001"
9. Click **Send Test Event**
10. System sends test webhook to configured URL
11. Verify external system receives test event:
    - Event ID: [unique identifier]
    - Event Type: "Trip Started"
    - Vehicle ID: "VH-001"
    - Timestamp: [ISO 8601 format]
    - Signature: [HMAC-SHA256 signature]
12. System receives 200 OK response from webhook endpoint
13. Verify test result: "Webhook delivered successfully"
14. Click **Enable Webhook**
15. Verify webhook shows as "Active"
16. Monitor webhook activity:
    - Status: "Active"
    - Last event sent: 2025-11-10 15:05:22
    - Total events sent: 5
    - Failed deliveries: 0
    - Pending retries: 0

#### Expected Results:
- Webhook configuration saved successfully
- Test event delivered to configured endpoint
- External system receives properly formatted event
- Authentication (Bearer token) validated
- Webhook active and begins processing events
- Events queued and delivered asynchronously
- Failed deliveries retried per configured policy
- Rate limiting prevents overwhelming external system
- Audit log captures: webhook created, events configured, test result
- Webhook activity and status visible on dashboard
- Event signatures allow external system to verify source

#### Acceptance Criteria:
- Webhook endpoint receives test event successfully
- Event payload properly formatted and complete
- Authentication works correctly
- Retry logic functions per specification
- Rate limiting prevents high-volume overload
- Audit trail captures webhook activity

#### Test Data:
```
Webhook Name: Vehicle Status Push
Webhook URL: https://external-system.com/webhooks/fleet/vehicle-status
Auth Type: Bearer Token
Auth Token: [sample bearer token]
Events to Push:
  - Trip Started: Yes
  - Trip Ended: Yes
  - Vehicle Status Changed: Yes
  - Maintenance Alert: Yes
Retry Policy: Exponential backoff, 5 max retries
Retry Delays: 5, 10, 20, 40, 80 seconds
Timeout: 30 seconds
Rate Limit: 10 req/sec, burst 20
Test Event:
  Type: Trip Started
  Vehicle: VH-001
  Status: Delivered (200 OK)
Created By: admin@company.com
```

---

## Backup & Recovery

### TC-SA-018: Configure Automated Database Backups

**Test Case ID**: TC-SA-018
**Test Case Name**: Configure Automated Database Backups
**Related User Story**: US-SA-007
**Related Use Case**: UC-SA-007
**Priority**: High
**Test Type**: Functional / Reliability
**Complexity**: Medium

#### Preconditions:
- System Administrator has backup management privileges
- Database operational and accessible
- Azure Blob Storage or AWS S3 configured
- Backup encryption keys configured in Azure Key Vault
- Backup service operational

#### Test Steps:
1. Navigate to **Admin Portal > Data Management > Backups**
2. Click **Configure Backup Schedule**
3. Complete backup configuration form:
   - Backup destination: "Azure Blob Storage"
   - Storage account: "fleet-backups-eastus2"
   - Container: "database-backups"
4. Configure backup types and frequency:
   - Full backup schedule: Weekly (Sunday 2:00 AM UTC)
   - Differential backup schedule: Daily (2:30 AM UTC)
   - Transaction log backup: Hourly (every hour)
5. Configure retention policy:
   - Daily backups retention: 7 days
   - Weekly backups retention: 4 weeks
   - Monthly backups retention: 12 months
   - Yearly backups retention: 7 years
6. Configure encryption:
   - Encryption type: "Customer-Managed Keys"
   - Key vault: "fleet-prod-keyvault"
   - Encryption key: "backup-encryption-key-01"
   - Key rotation: Annual (Nov 10, 2026)
7. Configure geo-redundancy:
   - Primary region: "East US 2"
   - Secondary region: "West US 2" (geo-redundant replication)
   - Replication type: "Read-Access Geo-Redundant Storage" (RA-GRS)
8. Set storage optimization:
   - Compression: Enabled (LZ4)
   - Deduplication: Enabled
   - Expected monthly cost: $450-500
9. Configure backup alerts:
   - Email on failed backup: Yes (admin@company.com)
   - Email on successful backup: No
   - Alert on backup exceeding size threshold: Yes (500 GB)
   - Alert threshold: 500 GB
10. Configure data exclusions:
    - Exclude transient tables: Yes
      - Exclude: session_logs, temporary_data, cache_tables
    - Exclude large non-critical tables: No
11. Click **Validate Configuration**
12. System validates:
    - Storage account accessible: Yes
    - Encryption keys available: Yes
    - Network connectivity: Good
    - Database accessibility: Good
13. Verify validation result: "Configuration valid and ready to enable"
14. Click **Enable Backup Schedule**
15. Verify success message: "Backup schedule configured and activated"
16. Review backup schedule summary:
    - Full backup: Weekly (Sunday 2:00 AM UTC)
    - Differential backup: Daily (2:30 AM UTC)
    - Transaction log: Hourly
    - Retention: 7 days daily, 4 weeks weekly, 12 months monthly, 7 years yearly

#### Expected Results:
- Backup schedule configured successfully
- Configuration validated before activation
- Backups begin automatically per schedule
- First full backup completes within defined window
- Differential backups run daily
- Transaction log backups run hourly
- All backups encrypted with customer-managed keys
- Geo-redundant copies created
- Storage costs tracked and reported
- Audit log captures: backup configuration created, settings, timestamp
- Backup alerts configured and functional
- Backup storage optimization applied

#### Acceptance Criteria:
- Backup schedule configured and active
- Backups execute on schedule
- Encryption applied to all backups
- Geo-redundancy functional
- Audit trail captures configuration changes
- Cost tracking shows storage usage

#### Test Data:
```
Backup Destination: Azure Blob Storage
Storage Account: fleet-backups-eastus2
Container: database-backups
Full Backup Schedule: Weekly (Sunday 2:00 AM UTC)
Differential Backup Schedule: Daily (2:30 AM UTC)
Transaction Log Backup: Hourly
Retention Policy:
  Daily: 7 days
  Weekly: 4 weeks
  Monthly: 12 months
  Yearly: 7 years
Encryption: Customer-Managed Keys
Key Vault: fleet-prod-keyvault
Encryption Key: backup-encryption-key-01
Geo-Redundancy: RA-GRS (East US 2 to West US 2)
Compression: LZ4
Exclusions: session_logs, temporary_data, cache_tables
Monthly Cost Estimate: $450-500
Configured By: admin@company.com
```

---

### TC-SA-019: Perform Point-in-Time Restore

**Test Case ID**: TC-SA-019
**Test Case Name**: Perform Point-in-Time Restore
**Related User Story**: US-SA-008
**Related Use Case**: UC-SA-008
**Priority**: High
**Test Type**: Functional / Disaster Recovery
**Complexity**: High

#### Preconditions:
- Backups configured and available (TC-SA-018)
- Multiple backups available in retention window
- Isolated staging database available for test restore
- Restore prerequisites validated
- Point-in-time recovery enabled

#### Test Steps:
1. Navigate to **Admin Portal > Data Management > Disaster Recovery**
2. Click **Initiate Restore**
3. System displays restore options:
   - Restore scope: Full database / Single table / Single tenant
   - Restore target: Production / Staging (isolated environment)
4. Select restore scope: "Single table" (trips table)
5. Select target database: "trips" table in production
6. Select restore type: "Point-in-Time"
7. Select restore point:
   - Calendar shows available backup dates (green = backups exist)
   - Select date: 2025-11-08 (2 days ago)
   - Select time: 14:00 UTC (data state 2 days ago)
8. System displays restore preview:
   - Affected records: 2,547 trip records
   - Data size: 125 MB
   - Restore duration estimate: 3-5 minutes
   - Data loss from restore point to current: 847 newer records
9. Verify restoration scope and preview
10. Set restore execution parameters:
    - Restore to: Staging database (safe for testing)
    - Auto-backup before restore: Yes (creates restore point)
    - Parallel restore threads: 4
11. Click **Preview Restore** to see sample data
12. System displays sample rows from restore point:
    - Trip 1: 2025-11-08 13:55:00 (would be restored)
    - Trip 2: 2025-11-08 13:58:30 (would be restored)
    - Current Trip 1: 2025-11-10 13:55:00 (would be overwritten)
13. Click **Schedule Restore**
14. Select maintenance window: "2025-11-10 23:00-02:00 UTC"
15. Enable notification: "Send email when restore completes"
16. Click **Confirm Restore**
17. System shows restore queued for maintenance window
18. At scheduled time, restore begins:
    - Pre-restore backup created: "backup-20251110-2300"
    - Restore progress: 0% → 25% → 50% → 75% → 100%
    - Restore duration: 4 minutes
19. Verify restore completion message
20. Validate restored data in staging environment:
    - Query trip records in staging database
    - Verify data matches state from 2025-11-08 14:00
    - Verify newer records (after restore point) not present
21. Run data validation checks:
    - Referential integrity: Valid
    - Checksum verification: Passed
    - Record count matches: 2,547 records
22. If validation successful, approve production restore
23. Click **Promote Restore to Production**
24. System applies restore to production database
25. Verify production database updated with restored data

#### Expected Results:
- Restore point selected successfully
- Preview shows affected records and data scope
- Restore executed to staging environment
- Data integrity validated in staging
- Restore promoted to production successfully
- Production data rolled back to specified point-in-time
- Pre-restore backup created for rollback capability
- Restore duration within estimate
- Audit log captures: restore initiated, source point, target, duration, operator
- No data loss from other tables
- System remains operational during restore (if asynchronous)

#### Acceptance Criteria:
- Restore point accessible and valid
- Preview accurately shows affected data
- Restore executes without errors
- Data validation succeeds
- Restored data matches source point exactly
- Audit trail captures restore operation completely

#### Test Data:
```
Restore Type: Point-in-Time
Restore Scope: Single table (trips)
Target Database: Production
Restore Point Date: 2025-11-08
Restore Point Time: 14:00 UTC
Affected Records: 2,547 trip records
Data Size: 125 MB
Estimated Duration: 3-5 minutes
Staging Validation: Passed
Referential Integrity: Valid
Checksum Verification: Passed
Record Count: 2,547
Pre-Restore Backup: backup-20251110-2300
Restore Executed By: admin@company.com
Restore Time: 2025-11-10 23:15:00 UTC
```

---

### TC-SA-020: Test Restore Validation and Backup Integrity

**Test Case ID**: TC-SA-020
**Test Case Name**: Test Restore Validation and Backup Integrity
**Related User Story**: US-SA-007
**Related Use Case**: UC-SA-007
**Priority**: High
**Test Type**: Functional / Quality Assurance
**Complexity**: Medium

#### Preconditions:
- Backups configured and available (TC-SA-018)
- Multiple backups exist in retention window
- Staging database available for restore testing
- Backup validation tools configured

#### Test Steps:
1. Navigate to **Admin Portal > Data Management > Backup Maintenance**
2. Click **Run Backup Integrity Check**
3. System displays integrity check options:
   - Check scope: All backups / Last backup / Specific backup
   - Check type: Quick (metadata only) / Full (restore and validate)
4. Select scope: "Last backup" (most recent full backup)
5. Select check type: "Full" (restore and validate)
6. System runs validation:
   - Reading backup metadata: OK
   - Verifying backup signature: OK
   - Checking encryption keys accessible: OK
   - Validating compression: OK
   - Calculating checksum: In progress...
7. Wait for checksum calculation to complete
8. Verify checksum results:
   - Expected checksum: a1b2c3d4e5f6g7h8
   - Actual checksum: a1b2c3d4e5f6g7h8
   - Match: Yes (Integrity Valid)
9. System displays: "Backup integrity check passed"
10. Click **Automated Restore Test**
11. System initiates test restore to isolated staging database:
    - Creating temporary staging database: OK
    - Restoring backup to staging: In progress...
    - Restore progress: 0% → 50% → 100%
    - Restore duration: 8 minutes
12. Verify restore completion
13. System runs validation queries on restored data:
    - Record count validation: 2,547,890 records (expected: 2,547,890) ✓
    - Referential integrity checks: 0 violations ✓
    - Data type validation: All columns correct ✓
    - NULL constraints validation: 0 violations ✓
    - Unique constraint validation: 0 violations ✓
14. System compares restored data to production:
    - Row count match: Yes
    - Column count match: Yes
    - Data type match: Yes
    - Sample data comparison: 100 random rows match ✓
15. Verify validation report:
    - All tests passed: Yes
    - Data integrity: Valid
    - Backup usable: Yes
    - Recommendation: Backup safe for production restore
16. System cleans up staging database
17. Verify cleanup complete: "Staging database deleted"
18. Review test result summary:
    - Backup date: 2025-11-10 02:00 UTC
    - Integrity status: Valid
    - Restore test: Passed
    - Last tested: 2025-11-10 10:30 UTC
    - Test frequency: Monthly

#### Expected Results:
- Backup integrity check completes successfully
- Checksum verification passed (no corruption detected)
- Test restore completes successfully
- Restored data validates completely
- No referential integrity violations
- No data type inconsistencies
- Restored data matches production data exactly
- Staging database cleaned up after test
- Audit log captures: integrity check run, results, timestamp
- Test restore log shows all validation steps
- Backup marked as "Verified" and safe for production use

#### Acceptance Criteria:
- Integrity check passes for all backups
- Test restore executes successfully
- All data validation checks pass
- Backup usable for production restore
- Audit trail captures test results

#### Test Data:
```
Backup Tested: backup-20251110-0200
Backup Type: Full backup
Backup Size: 15.2 GB
Integrity Check:
  Metadata: Valid
  Signature: Valid
  Encryption Keys: Accessible
  Compression: Valid
  Checksum: a1b2c3d4e5f6g7h8
Test Restore:
  Target: Staging database
  Duration: 8 minutes
  Status: Completed successfully
Data Validation:
  Record Count: 2,547,890 (Expected: 2,547,890) ✓
  Referential Integrity: 0 violations ✓
  Data Types: All correct ✓
  NULL Constraints: 0 violations ✓
  Unique Constraints: 0 violations ✓
Result: Backup verified and safe for production restore
Test Run By: admin@company.com
Test Time: 2025-11-10 10:30:00 UTC
```

---

## Security & Audit

### TC-SA-021: Configure Security Audit Logging

**Test Case ID**: TC-SA-021
**Test Case Name**: Configure Security Audit Logging
**Related User Story**: US-SA-009
**Related Use Case**: UC-SA-009
**Priority**: High
**Test Type**: Functional / Compliance
**Complexity**: Medium

#### Preconditions:
- System Administrator has security configuration privileges
- Logging infrastructure operational (ELK stack / Azure Monitor)
- Log aggregation service configured
- Long-term storage configured

#### Test Steps:
1. Navigate to **Admin Portal > Security > Audit Logging Configuration**
2. Verify audit logging is enabled: Status = "Active"
3. Review logging configuration:
   - Log format: Structured JSON
   - Log level: All events captured
   - Retention: 7 years (per compliance)
   - Storage tiers:
     - Hot storage (90 days): Azure Monitor
     - Warm storage (1 year): Azure Blob Storage
     - Cold storage (6 years): Archive tier
4. Configure events to log:
   - Authentication attempts: All (success and failure)
   - Data modifications: All (create, update, delete)
   - Permission changes: All
   - API calls: All (request and response)
   - Admin actions: All
   - Role assignments: All
   - Backup operations: All
   - Integration changes: All
5. Verify each event category has log captures enabled
6. Configure log destination:
   - Primary: Azure Log Analytics Workspace
   - Secondary: Azure Blob Storage (archive)
   - Syslog forwarding: Enabled
7. Set log retention policies:
   - Default retention: 7 years
   - Compliance retention: Configurable per event type
   - Archive storage: Encrypted blob storage
8. Configure log alerting:
   - Alert on failed login attempts: 5+ in 10 minutes
   - Alert on privilege escalation attempts: 3+ in 1 hour
   - Alert on mass data access: 100+ records accessed by 1 user in 5 mins
   - Alert on API rate limit violations: Per configured limits
9. Test audit logging:
   - Perform test action: Create test user
   - Verify audit log entry created immediately
   - Log contains: Timestamp, user (admin@company.com), action, resource, result, IP
10. Perform multiple test actions:
    - Create user
    - Modify user role
    - Create API key
    - Revoke API key
    - View user activity
11. Verify all test actions logged in audit trail
12. Search audit logs for test actions:
    - Query: action = "Create User"
    - Results: Find test user creation entry
    - Verify: All fields populated correctly

#### Expected Results:
- Audit logging configured and active
- All configured event types logged to audit trail
- Logs formatted as structured JSON with standard fields
- Log entries include: timestamp, user, action, resource, result, IP address
- Logs stored in primary (hot) and secondary (archive) storage
- Long-term retention (7 years) configured
- Alert configuration enabled for security events
- Test actions logged correctly and immediately
- Audit logs queryable and searchable

#### Acceptance Criteria:
- Audit logging active for all event types
- Log entries accurate and complete
- Retention policies meet compliance requirements
- Search and query functions work correctly
- Alerts trigger on configured conditions

#### Test Data:
```
Logging Configuration:
  Format: Structured JSON
  Retention: 7 years
  Primary Storage: Azure Log Analytics
  Secondary Storage: Azure Blob (Archive)
Events Logged:
  - Authentication: All attempts
  - Data Modifications: All changes
  - Permission Changes: All assignments
  - API Calls: All requests
  - Admin Actions: All operations
  - Role Assignments: All changes
  - Backup Operations: All events
  - Integration Changes: All modifications
Alerts Configured:
  - Failed Logins: 5+ in 10 minutes
  - Privilege Escalation: 3+ attempts in 1 hour
  - Mass Data Access: 100+ records in 5 minutes
  - API Rate Limits: Per configured limits
Test Results: All test actions logged successfully
Configured By: admin@company.com
```

---

### TC-SA-022: View Security Compliance Dashboard

**Test Case ID**: TC-SA-022
**Test Case Name**: View Security Compliance Dashboard
**Related User Story**: US-SA-010
**Related Use Case**: UC-SA-010
**Priority**: High
**Test Type**: Functional / Compliance
**Complexity**: Low

#### Preconditions:
- Security monitoring infrastructure operational
- Compliance scanning tools configured
- Dashboard data collection active
- User has security admin privileges

#### Test Steps:
1. Navigate to **Admin Portal > Security > Compliance Dashboard**
2. Verify dashboard displays real-time security metrics:
   - Page load time: <3 seconds
   - Data refresh: Auto-update every 30 seconds
3. Review Password Policy Compliance section:
   - Users with weak passwords: 2 / 500 (shown in red)
   - Users with expired passwords: 0 / 500 (shown in green)
   - Users not meeting complexity: 1 / 500 (shown in orange)
   - Action available: Click "Force Password Reset" for non-compliant users
4. Review MFA Enrollment section:
   - MFA enrolled: 498 / 500 (99.6%)
   - MFA not enrolled: 2 / 500 (shown in red)
   - Users with MFA enforcement: 500 / 500
   - Action available: View users without MFA
5. Review Inactive User Accounts section:
   - Inactive 30+ days: 5 users
   - Inactive 60+ days: 2 users
   - Inactive 90+ days: 1 user
   - Recommendation: Deactivate inactive accounts
   - Action available: Bulk deactivate accounts
6. Review Excessive Permissions section:
   - Users with "Administrator" role: 2 users
   - Users with multiple admin roles: 0 users
   - Users with elevated permissions: 8 users
   - Recommendation: Review and minimize admin accounts
   - Action available: Review permission assignments
7. Review Authentication Trends section:
   - Failed authentication attempts (24h): 47
   - Failed authentication attempts (7d): 312
   - Peak failure time: 14:00-15:00 UTC
   - Potential brute force detected: No
   - Recommendation: Monitor for patterns
8. Review SSL Certificate Status:
   - Production certificate: Valid (expires 2026-02-15) - 97 days
   - Staging certificate: Valid (expires 2025-12-20) - 39 days
   - API certificate: Valid (expires 2026-05-10) - 182 days
   - Renewal reminders: 60 days before expiration
   - Action available: Request certificate renewal
9. Review Integration Credential Health:
   - Geotab API key: Expires 2026-11-10 (365 days)
   - WEX API key: Expires 2025-12-31 (50 days - renewal soon)
   - QuickBooks token: Expires 2025-12-15 (35 days - renewal soon)
   - Action available: View and rotate credentials
10. Click **Generate SOC 2 Report**
11. System displays report options:
    - Report type: SOC 2 Type II
    - Time period: Last 12 months
    - Include: Control testing, evidence, audit logs
12. Click **Generate**
13. Report generated: "SOC2_Compliance_Report_202511.pdf"
14. Download and review report structure:
    - Executive summary
    - Control environment findings
    - Evidence of controls
    - Audit log excerpts
    - Recommendations
15. Review automated security scans:
    - Latest scan: 2025-11-10 04:00 UTC
    - Vulnerabilities found: 2
    - Critical issues: 0
    - High priority: 1 (Outdated library)
    - Medium priority: 1 (Missing security header)
    - Action available: View scan details

#### Expected Results:
- Compliance dashboard loads within 3 seconds
- All metrics displayed with current data
- Color coding clearly shows compliant (green) vs. non-compliant (red) status
- Actionable recommendations provided
- Data refresh automatic and current
- SOC 2 report generation successful
- Report includes sufficient evidence for external auditors
- Automated security scans executed on schedule
- Vulnerability details available for remediation

#### Acceptance Criteria:
- Dashboard displays accurate compliance metrics
- All compliance frameworks supported (SOC 2, ISO 27001)
- Reports generate successfully for audit purposes
- Dashboard performance meets requirements
- Metrics update in real-time

#### Test Data:
```
Compliance Metrics:
  Password Compliance: 498/500 (99.6%)
  MFA Enrollment: 498/500 (99.6%)
  Inactive Users (30+ days): 5
  Inactive Users (60+ days): 2
  Inactive Users (90+ days): 1
  Admin Users: 2
  Failed Auth (24h): 47
  Failed Auth (7d): 312
  SSL Certificates Valid: 3/3
  Integration Keys Expiring Soon: 2
  Security Vulnerabilities: 2
    - Critical: 0
    - High: 1
    - Medium: 1
  Last Security Scan: 2025-11-10 04:00 UTC
  SOC 2 Report: Available for download
```

---

### TC-SA-023: Search and Export Audit Logs

**Test Case ID**: TC-SA-023
**Test Case Name**: Search and Export Audit Logs
**Related User Story**: US-SA-009
**Related Use Case**: UC-SA-009
**Priority**: High
**Test Type**: Functional / Analytics
**Complexity**: Medium

#### Preconditions:
- Audit logging configured and active (TC-SA-021)
- Substantial audit history available (90+ days)
- Search and export functionality operational
- User has audit log access privileges

#### Test Steps:
1. Navigate to **Admin Portal > Security > Audit Logs**
2. Display audit log browser with:
   - Date range filter: Default last 30 days
   - Action filter: All actions
   - User filter: All users
   - Resource filter: All resources
3. View latest audit entries in list:
   - Recent entry: "2025-11-10 15:30:45 | admin@company.com | Create User | newuser@company.com | Success"
   - Recent entry: "2025-11-10 15:25:12 | admin@company.com | Modify Role | Driver → Dispatcher | Success"
   - Recent entry: "2025-11-10 15:20:33 | admin@company.com | Revoke API Key | fleet_live_abc... | Success"
4. Search audit logs by user:
   - User filter: "john.smith@company.com"
   - Results show: 156 entries (all actions by this user in last 30 days)
   - List includes: Login events, data access, report generation
5. Search audit logs by action:
   - Action filter: "Permission Change"
   - Results show: 23 entries (all permission changes in last 30 days)
   - List includes: Role assignments, permission grants, role modifications
6. Search audit logs by date range:
   - Date from: 2025-11-01
   - Date to: 2025-11-10
   - Results update to show 10-day period
7. Search audit logs by resource:
   - Resource filter: "Trips" module
   - Results show: 432 entries (all trip-related changes in period)
8. Combine multiple filters:
   - User: "admin@company.com"
   - Action: "Create User"
   - Date: Last 7 days
   - Results show: 12 entries (all users created by this admin in last week)
9. Click on specific audit entry to view details:
   - Action: "Create User"
   - Timestamp: 2025-11-10 15:30:45 UTC
   - Admin: admin@company.com
   - IP Address: 192.168.1.100
   - User Created: newuser@company.com
   - Role Assigned: Fleet Manager
   - Success: Yes
   - Details: Complete audit trail with before/after values
10. Click **Export Logs** button
11. System displays export options:
    - Format: CSV, Excel, PDF, JSON (select CSV)
    - Filters to export: Current search results
    - Row limit: All rows (12,450 entries)
    - Include details: Yes (full audit trail)
12. Click **Generate Export**
13. System creates CSV file with columns:
    - Timestamp
    - User
    - Action
    - Resource
    - Details
    - IP Address
    - Result
14. Download completes within 30 seconds
15. File: "audit_logs_export_20251110.csv" (8.2 MB)
16. Open CSV file and verify:
    - All search result rows included
    - All column data present
    - Data properly escaped and formatted
    - Timestamps in ISO 8601 format
    - File readable in Excel and text editors

#### Expected Results:
- Audit log search filters work correctly
- Search results accurate and complete
- Multiple filters can be combined
- Individual log entries show full details
- Export completes successfully
- Exported file format valid and readable
- All requested rows and columns included
- Export file suitable for compliance review

#### Acceptance Criteria:
- Search results accurate and complete
- Filters work individually and in combination
- Export file valid and readable
- Performance acceptable for large result sets
- Data integrity maintained in export

#### Test Data:
```
Search Filters Applied:
  User: admin@company.com
  Action: Create User
  Date Range: 2025-11-01 to 2025-11-10
Results: 12 matching entries
Export Format: CSV
Export Rows: 12
Export File: audit_logs_export_20251110.csv
File Size: 8.2 MB
Sample Entries:
  1. 2025-11-10 15:30:45 | admin@company.com | Create User | newuser@company.com | Success
  2. 2025-11-09 14:22:10 | admin@company.com | Create User | user2@company.com | Success
  [... 10 more entries ...]
```

---

### TC-SA-024: Monitor Failed Login Attempts and Security Alerts

**Test Case ID**: TC-SA-024
**Test Case Name**: Monitor Failed Login Attempts and Security Alerts
**Related User Story**: US-SA-009, US-SA-010
**Related Use Case**: UC-SA-009, UC-SA-010
**Priority**: High
**Test Type**: Functional / Security
**Complexity**: Medium

#### Preconditions:
- Audit logging configured (TC-SA-021)
- Alert system configured and operational
- Security monitoring active
- User has security admin privileges

#### Test Steps:
1. Navigate to **Admin Portal > Security > Security Alerts**
2. Verify alert dashboard displays:
   - Alert summary: 3 active alerts, 0 critical, 1 high, 2 medium
   - Real-time alert feed showing recent alerts
   - Alert filtering options available
3. Review active alerts:
   - Alert 1: "High: Multiple Failed Login Attempts"
     - Severity: High
     - Status: Active
     - Detected: 2025-11-10 15:45:00
     - Details: User "testuser@company.com" 8 failed login attempts in 15 minutes
     - IP Address: 203.0.113.50
     - Actions: Block IP, Reset password, Investigate
   - Alert 2: "Medium: Unusual API Access Pattern"
     - Severity: Medium
     - Status: Active
     - Detected: 2025-11-10 14:30:00
     - Details: API key "fleet_live_xyz..." accessed 5000+ requests in 1 hour
     - Limit: 1000 requests/hour
     - Actions: Revoke key, Investigate client, Review requests
   - Alert 3: "Medium: Privilege Escalation Attempt"
     - Severity: Medium
     - Status: Active
     - Detected: 2025-11-10 13:15:00
     - Details: User "user@company.com" attempted to modify admin role
     - Attempt: 3 times in 20 minutes
     - Actions: Review user permissions, Reset password, Investigate
4. Click on "Multiple Failed Login Attempts" alert to expand
5. View detailed alert information:
   - Timeline: Shows all 8 failed login attempts
   - Timeline entry 1: 15:45:10 UTC - Failed login from 203.0.113.50
   - Timeline entry 2: 15:46:05 UTC - Failed login from 203.0.113.50
   - ... (8 attempts total over 15 minutes)
   - Account status: Active (not yet locked)
   - Current session: None
6. Verify failed login reasons:
   - Attempt 1-3: Invalid password
   - Attempt 4-5: Account locked after 3 failures (transient)
   - Attempt 6-8: Account locked errors
7. Click **Take Action** button
8. System displays action options:
   - Block IP address: 203.0.113.50 (for 24 hours)
   - Force password reset: testuser@company.com
   - Temporary account lock: Lock for 30 minutes (prevent more attempts)
   - Notify user: Send security alert email
9. Select actions:
   - Block IP address: Yes (24 hours)
   - Force password reset: Yes
   - Temporary lock: Already applied (auto-cleared)
   - Notify user: Yes
10. Click **Execute Actions**
11. System confirms action execution:
    - IP 203.0.113.50 blocked (expires 2025-11-11 15:45:00)
    - Password reset email sent to testuser@company.com
    - User notified of suspicious activity
12. Verify alert status changed to "Acknowledged"
13. View alert history:
    - Show resolved alerts from last 7 days
    - Filter by severity: High
    - Results show: 5 high-severity alerts resolved
    - Common pattern: 4 were API rate limit violations
14. Configure alert settings:
    - Navigate to **Admin Portal > Security > Alert Configuration**
    - Failed login threshold: 5+ failures in 10 minutes (trigger alert)
    - API rate limit violation: 80%+ of limit (trigger alert)
    - Privilege escalation attempts: 2+ in 30 minutes (trigger alert)
    - Data access anomaly: 1000+ records accessed by 1 user (trigger alert)
15. Test alert firing:
    - Simulate 6 failed login attempts in 10 minutes
    - System detects threshold exceeded
    - Alert generated and displayed in real-time
    - Alert notification sent to admin@company.com

#### Expected Results:
- Active security alerts displayed on dashboard
- Alert details include sufficient context for investigation
- Timeline of events shown clearly
- Action options available for common threats
- Actions executed successfully (IP blocking, password reset, etc.)
- Alert status updated after actions taken
- Alert history available for compliance review
- Alert thresholds configurable
- New alerts generated and displayed in real-time
- Audit log captures all alert actions and responses

#### Acceptance Criteria:
- Security alerts generated correctly on threshold exceeded
- Alert details sufficient for investigation
- Actions execute successfully
- Alert history queryable and analyzable
- Performance acceptable for real-time monitoring
- Audit trail captures all alert-related actions

#### Test Data:
```
Test Alert: Multiple Failed Login Attempts
User: testuser@company.com
Failed Attempts: 8 attempts in 15 minutes
IP Address: 203.0.113.50
Failure Reasons:
  - Invalid password: 3 attempts
  - Account locked: 5 attempts
Detected: 2025-11-10 15:45:00
Severity: High
Actions Taken:
  - Block IP: 203.0.113.50 (24 hours)
  - Force Password Reset: Yes
  - Notify User: Yes
Alert Status: Acknowledged
Alert Resolved: 2025-11-10 15:50:00
```

---

## Test Summary

| TC ID | Test Case Name | Priority | Type | Complexity | Status |
|-------|----------------|----------|------|------------|--------|
| TC-SA-001 | Create Single User Account | High | Functional | Medium | Ready |
| TC-SA-002 | Bulk Import Users from CSV | High | Functional | High | Ready |
| TC-SA-003 | Modify User Permissions | High | Functional | Medium | Ready |
| TC-SA-004 | Deactivate User Account | High | Functional | Medium | Ready |
| TC-SA-005 | Force Password Reset | High | Functional | Low | Ready |
| TC-SA-006 | View User Activity | Medium | Functional | Low | Ready |
| TC-SA-007 | Create Custom Role | High | Functional | High | Ready |
| TC-SA-008 | Clone Existing Role | High | Functional | Medium | Ready |
| TC-SA-009 | Prevent Privilege Escalation | High | Security | Medium | Ready |
| TC-SA-010 | Export Role Definitions | Medium | Functional | Low | Ready |
| TC-SA-011 | Configure SAML Integration | High | Integration | High | Ready |
| TC-SA-012 | Test SSO & Fallback Auth | High | Functional | High | Ready |
| TC-SA-013 | Configure Telematics Integration | High | Integration | High | Ready |
| TC-SA-014 | View Integration Health | Medium | Functional | Low | Ready |
| TC-SA-015 | Generate API Key | High | Functional | Medium | Ready |
| TC-SA-016 | Revoke API Key & Track Usage | High | Functional | Medium | Ready |
| TC-SA-017 | Configure Webhook | High | Integration | High | Ready |
| TC-SA-018 | Configure Backups | High | Functional | Medium | Ready |
| TC-SA-019 | Perform Point-in-Time Restore | High | Disaster Recovery | High | Ready |
| TC-SA-020 | Test Backup Validation | High | Quality Assurance | Medium | Ready |
| TC-SA-021 | Configure Audit Logging | High | Functional | Medium | Ready |
| TC-SA-022 | View Compliance Dashboard | High | Functional | Low | Ready |
| TC-SA-023 | Search & Export Audit Logs | High | Functional | Medium | Ready |
| TC-SA-024 | Monitor Failed Login Attempts | High | Functional | Medium | Ready |

**Total Test Cases**: 24
**High Priority**: 20 | **Medium Priority**: 4
**Total Story Points (Est.)**: 85

---

## References

- User Stories: `07_SYSTEM_ADMINISTRATOR_USER_STORIES.md`
- Use Cases: `07_SYSTEM_ADMINISTRATOR_USE_CASES.md`
- System Architecture: `/docs/architecture/`
- Security Framework: `/docs/security/`

---

*Document Version: 1.0*
*Last Updated: November 10, 2025*
*Created By: QA Team*
