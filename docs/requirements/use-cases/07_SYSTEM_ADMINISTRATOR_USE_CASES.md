# System Administrator - Use Cases

**Role**: System Administrator
**Access Level**: Full Administrative
**Primary Interface**: Web Dashboard (Admin Portal)
**Version**: 1.0
**Date**: November 11, 2025

---

## Table of Contents
1. [User and Role Management](#epic-1-user-and-role-management)
2. [System Configuration and Integration](#epic-2-system-configuration-and-integration)
3. [Data Backup and Recovery](#epic-3-data-backup-and-recovery)
4. [Security and Audit Logging](#epic-4-security-and-audit-logging)
5. [System Monitoring and Operations](#epic-5-system-monitoring-and-operations)

---

## Epic 1: User and Role Management

### UC-SA-001: Provision and Manage User Accounts

**Use Case ID**: UC-SA-001
**Use Case Name**: Provision and Manage User Accounts
**Actor**: System Administrator (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal with appropriate privileges
- User database and email service are operational
- Role definitions have been pre-configured in the system
- Organization structure exists (tenants/companies)

#### Trigger:
- New employee joins the organization and requires system access
- Existing user requires role/permission changes
- Employee is terminated and account must be deactivated
- Bulk user import required from CSV file

#### Main Success Scenario:
1. System Administrator navigates to User Management section
2. Administrator clicks "Create New User"
3. System displays user creation form with fields:
   - Email address: sara@capitaltechalliance.com
   - First Name: Sara
   - Last Name: Johnson
   - Phone: 555-0123
   - Job Title: Fleet Operations Manager
   - Department: Operations
   - Office Location: Boston MA
4. Administrator assigns primary role: Fleet Manager
5. Administrator selects additional permissions:
   - View Reports: Yes
   - Approve Work Orders: Yes
   - Manage Drivers: Yes
6. Administrator sets account expiration date: None (permanent)
7. Administrator enables Multi-Factor Authentication (MFA): Required
8. Administrator clicks "Create User"
9. System validates all required fields are complete
10. System generates temporary password: "Temp@2025Nov1234"
11. System sends automated welcome email to sara@capitaltechalliance.com containing:
    - Login URL
    - Temporary password
    - Instructions to set permanent password
    - System access guide for Fleet Manager role
    - Security policies and requirements
12. System logs user creation: "User created: sara@capitaltechalliance.com by admin@fleet.com at 2025-11-11 09:15:00"
13. Administrator confirms user creation: "User Sara Johnson (sara@capitaltechalliance.com) created successfully"
14. Sara receives email and logs in with temporary password
15. Sara is prompted to set permanent password and enroll in MFA
16. Sara sets new password and scans QR code to activate authenticator app
17. Sara completes account setup and gains access to system

#### Alternative Flows:

**A1: Bulk User Import from CSV**
- 2a. If administrator needs to create multiple users:
  - Administrator clicks "Bulk Import Users"
  - System displays CSV template with required fields
  - Administrator downloads template and populates with user data (150 users)
  - Administrator uploads CSV file
  - System validates each row:
    - Email format valid
    - Required fields present
    - No duplicate emails
  - System shows validation results: "149 records valid, 1 record with error"
  - Administrator fixes error in invalid record
  - System re-validates: "All 150 records valid"
  - Administrator confirms import
  - System creates all 150 user accounts
  - System sends welcome emails to all users with setup instructions

**A2: User Role Assignment with Tenure-Based Escalation**
- 4a. If user is contractor or seasonal staff:
  - Administrator selects role: "Contractor - Driver"
  - Administrator sets account expiration date: 2025-12-31
  - System displays warning: "Account will auto-deactivate on expiration date"
  - Administrator enables early warning: "Send deactivation notice 30 days before expiration"
  - After 30 days, system sends admin reminder to re-evaluate contractor
  - On expiration date, system auto-deactivates account (no access, data preserved)

**A3: Modify Existing User Permissions**
- 5a. If user's role changes:
  - Administrator searches for user "John Smith"
  - System displays John's current profile:
    - Email: john.smith@company.com
    - Role: Driver
    - Status: Active
    - Last login: 2025-11-10 14:23
  - Administrator updates role: Driver → Dispatcher
  - System displays new permission set for Dispatcher role
  - Administrator reviews permission changes summary
  - Administrator clicks "Update User"
  - System logs permission change with timestamp and reason
  - System invalidates John's active sessions (force re-login)
  - John's next login shows new Dispatcher interface
  - System sends notification email to John: "Your account roles have been updated"

**A4: Deactivate User Account**
- 3a. If employee is terminated:
  - Administrator searches for user "Mike Torres"
  - Administrator clicks "Deactivate Account"
  - System displays deactivation confirmation dialog
  - Administrator selects reason: "Employee Terminated - 2025-11-10"
  - Administrator adds notes: "Last day of employment"
  - System displays affected access:
    - Current active sessions: 1 (will be terminated immediately)
    - Active API keys: 2 (will be revoked)
    - Scheduled jobs: 3 (will be cancelled)
  - Administrator confirms deactivation
  - System immediately:
    - Terminates all active sessions
    - Revokes all API keys
    - Marks account as inactive
    - Preserves all historical data (soft delete)
  - System logs deactivation audit trail
  - Administrator verifies account shows "Inactive" status

#### Exception Flows:

**E1: Email Address Already Exists**
- If duplicate email is entered:
  - System displays error: "Email address already exists in system"
  - System shows existing user: "Sara Johnson (sara@capitaltechalliance.com) - Active since 2025-01-15"
  - Administrator options:
    - Use different email address
    - Contact existing user regarding duplicate
  - Administrator must resolve before proceeding

**E2: Email Service Unavailable**
- If welcome email cannot be sent:
  - System displays error: "Unable to send welcome email - email service unavailable"
  - User account created successfully (email is secondary)
  - System generates downloadable invitation document with:
    - Login URL
    - Temporary credentials
    - Setup instructions
  - Administrator manually sends invitation or prints for distribution
  - System retries email delivery every 10 minutes for 24 hours
  - Administrator receives notification when email finally delivers

**E3: User Attempts Login Before Setup**
- If user logs in before completing initial setup:
  - System prompts: "Account setup required"
  - User is taken to forced setup wizard
  - User cannot access system until:
    - Password changed from temporary
    - MFA enrolled
  - Setup completion verified

**E4: CSV Import Contains Invalid Role**
- If CSV references non-existent role:
  - System validation fails: "Row 45 - Invalid role 'SysAdmin' does not exist"
  - System lists available roles
  - Administrator corrects CSV file
  - Administrator re-uploads corrected file

#### Postconditions:
- User account is created with appropriate role assignments
- User receives welcome notification with access instructions
- User can log in and access assigned features
- All account creation is logged in audit trail
- Account status is visible in user management dashboard

#### Business Rules:
- BR-SA-001: All user account creation requires MFA enrollment
- BR-SA-002: Temporary passwords must be changed on first login
- BR-SA-003: User email addresses must be unique system-wide
- BR-SA-004: Account creation must include role assignment (no user without role)
- BR-SA-005: Bulk imports must pass 100% validation before execution
- BR-SA-006: Deactivated accounts preserve all historical data (soft delete only)
- BR-SA-007: User creation logged with timestamp, IP address, and admin identity

#### Related User Stories:
- US-SA-001: User Account Provisioning and Management

---

### UC-SA-002: Configure Role-Based Access Control (RBAC)

**Use Case ID**: UC-SA-002
**Use Case Name**: Configure Role-Based Access Control (RBAC)
**Actor**: System Administrator (primary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Role management module is accessible
- At least one default admin role exists
- Permission matrix is configured in system

#### Trigger:
- Organization requires new custom role definition
- Existing role permissions need modification
- Compliance requirements mandate specific access controls
- New system module added requiring role permission updates

#### Main Success Scenario:
1. System Administrator navigates to RBAC Configuration
2. Administrator reviews existing roles:
   - Fleet Manager (40 permissions)
   - Driver (12 permissions)
   - Dispatcher (28 permissions)
   - Safety Officer (25 permissions)
   - Maintenance Technician (18 permissions)
3. Administrator identifies need for new role: "Regional Fleet Manager"
4. Administrator clicks "Create Custom Role"
5. Administrator enters role details:
   - Role Name: Regional Fleet Manager
   - Description: Manages fleet operations for assigned region(s)
   - Department: Operations
   - Category: Management
6. System displays feature/permission matrix with 200+ permissions
7. Administrator configures permissions by module:

   **Vehicle Management Module**:
   - View all vehicles in assigned region: ✓
   - Create/edit vehicle records: ✓
   - Delete vehicles: ✗ (only if inactive)
   - View vehicle location: ✓
   - Assign vehicles to drivers: ✓

   **Driver Management Module**:
   - View drivers in assigned region: ✓
   - Create/edit driver records: ✓
   - View driver performance data: ✓
   - Approve driver certifications: ✓
   - Assign drivers to routes: ✓

   **Route Management Module**:
   - View routes: ✓
   - Create/edit routes: ✓
   - Approve routes: ✓
   - Override route restrictions: ✗ (only fleet manager)

   **Reporting Module**:
   - View regional reports: ✓
   - Generate custom reports: ✓
   - Export data: ✓
   - Share reports: ✓

   **Financial Module**:
   - View regional costs: ✓ (read-only)
   - Approve expenses: ✗ (only accountant/manager)
   - View budgets: ✓ (read-only)
   - Submit cost reports: ✓

8. Administrator assigns location/data restrictions:
   - Accessible regions: Boston, New York, Philadelphia (not corporate HQ)
   - Vehicle types: Can manage vehicles assigned to accessible regions only
   - Driver scope: Can manage drivers with home region in accessible areas
9. Administrator previews permission summary:
   - 89 permissions enabled
   - 111 permissions disabled
   - Permission breakdown: Vehicle Mgmt (15/20), Driver Mgmt (12/15), Route Mgmt (18/25), etc.
10. Administrator tests role by clicking "Preview as this role"
11. System displays interface as it would appear to a Regional Fleet Manager user
12. Administrator verifies:
    - Dashboard shows only Boston/NY/Philadelphia regions
    - Report section shows regional reports only
    - Financial section is read-only
    - Cannot access system settings or user management
13. Administrator exits preview and clicks "Save Role"
14. System validates:
    - Role has meaningful permission set (not empty)
    - At least one admin role with full access exists
    - No permission escalation issues
15. System displays confirmation: "Role 'Regional Fleet Manager' created successfully"
16. Administrator assigns existing user to test role: "Select test user: Tom Rodriguez"
17. System applies role to Tom immediately
18. Tom's next login shows Regional Fleet Manager interface
19. Administrator monitors for issues and receives automatic validation

#### Alternative Flows:

**A1: Clone Existing Role to Create Similar Role**
- 3a. If new role is similar to existing role:
  - Administrator clicks "Clone Role"
  - System displays list of roles to clone from
  - Administrator selects "Fleet Manager" as template
  - System displays cloned role configuration
  - Administrator modifies permissions:
    - Removes: "Manage users" permission
    - Removes: "View system settings" permission
    - Keeps all other Fleet Manager permissions
  - System identifies this creates "Limited Fleet Manager" role
  - Administrator updates role name and description
  - Administrator saves new role

**A2: Modify Permissions of Existing Role**
- 3a. If role requires permission updates:
  - Administrator selects existing role: "Dispatcher"
  - System displays current 28 permissions
  - Administrator notices: "Dispatcher cannot approve work orders"
  - Administrator needs to add this permission for operational efficiency
  - Administrator clicks "Approve Work Orders" permission
  - System displays permission change summary
  - Administrator clicks "Apply Changes"
  - System calculates impact: "96 active Dispatcher users will gain this permission"
  - System displays warning: "Permission change is effective immediately for all users"
  - Administrator confirms
  - System immediately applies to all 96 active Dispatcher users
  - All active sessions remain valid (permission cache refreshed on next action)
  - System logs permission change with reason and affected users

**A3: Data Access Restriction by Location**
- 8a. If role requires location-based data filtering:
  - Administrator creates role: "Branch Manager - Boston"
  - Administrator sets location restriction: "Boston office only"
  - System automatically restricts access to:
    - Vehicles assigned to Boston office
    - Drivers with Boston office assignment
    - Routes in Boston region
    - Reports filtered by Boston data
  - Branch Manager cannot view data for other locations (Philadelphia, New York offices)

**A4: Time-Based Permission Escalation**
- 8a. If role needs time-based permissions:
  - Administrator creates role: "Temporary Safety Auditor"
  - Administrator assigns permissions for audit purposes
  - Administrator sets role expiration: 2025-12-31
  - System auto-deactivates role after expiration date
  - Users assigned to temporary role lose access after expiration
  - System logs automatic role deactivation

#### Exception Flows:

**E1: Privilege Escalation Prevented**
- If administrator tries to create role with escalated privileges:
  - Administrator tries to give user "Create System Administrator" permission
  - System displays error: "User cannot grant permissions they don't possess"
  - System prevents escalation of privileges beyond current user's level
  - Administrator must escalate to higher-level admin to grant high-privilege permissions

**E2: Last Admin Role Deletion Prevention**
- If attempting to disable all admin roles:
  - Administrator tries to modify admin role and remove all permissions
  - System detects no other admin roles exist
  - System displays error: "Cannot remove all administrative permissions - system would be unmanageable"
  - System requires at least one full-access admin role always exists

**E3: Role Conflict Detection**
- If permissions create logical conflicts:
  - Administrator sets: Can "View Financial Data" (read-only) but NOT "View Budgets"
  - System detects logical inconsistency: "Financial data includes budgets"
  - System suggests: "If viewing financial data, logically should view budgets"
  - Administrator confirms or adjusts permissions

**E4: Role Usage Impact Assessment Fails**
- If system cannot calculate impact of permission change:
  - Administrator attempts to modify permission
  - System displays: "Cannot calculate impact - 2,500+ users affected"
  - System provides alternative: "Change will be applied in scheduled maintenance window"
  - Administrator schedules change for off-peak time (2:00 AM Sunday)

#### Postconditions:
- New role is configured with appropriate permission set
- Role is immediately available for user assignment
- All users with role have consistent access controls
- Permission changes are applied to all users holding that role
- All RBAC changes are logged in audit trail
- Permission inheritance and restrictions function correctly

#### Business Rules:
- BR-SA-008: All roles must have at least one assigned permission
- BR-SA-009: System must have at least one role with full administrative access
- BR-SA-010: Users cannot grant permissions they do not possess themselves
- BR-SA-011: Role permission changes apply immediately to all assigned users
- BR-SA-012: Location/data restrictions enforced at query level (database row-level security)
- BR-SA-013: Permission combinations must not create logical conflicts
- BR-SA-014: Role modifications logged with timestamp, admin, and specific changes

#### Related User Stories:
- US-SA-002: Role-Based Access Control (RBAC) Configuration

---

### UC-SA-003: Configure Multi-Tenant Organizations

**Use Case ID**: UC-SA-003
**Use Case Name**: Configure Multi-Tenant Organizations
**Actor**: System Administrator (primary), Fleet Manager (secondary - tenant admin)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Multi-tenant architecture is deployed
- Database supports tenant isolation (row-level security, partitioning)
- Subdomain DNS configuration available

#### Trigger:
- New customer organization requires system access
- Existing tenant requires configuration changes
- Organization expansion requires additional tenant setup
- Data segregation requirements mandate multi-tenant approach

#### Main Success Scenario:
1. System Administrator navigates to Tenant Management
2. Administrator clicks "Create New Tenant"
3. System displays tenant creation form:
   - Company Name: "Northeast Logistics Corp"
   - Industry: Transportation & Logistics
   - Company Website: northeastlogistics.com
   - Subdomain: northeastlogistics (will become northeastlogistics.fleetapp.com)
   - Country: United States
   - Time Zone: America/New_York
   - Number of vehicles: 150
4. Administrator selects tenant type:
   - Standard (shared infrastructure, dedicated database partition)
   - Enterprise (dedicated resources, custom features)
5. Administrator sets up branding:
   - Company Logo: [upload PNG]
   - Primary Color: #003366
   - Secondary Color: #0066CC
   - Custom domain: fleet.northeastlogistics.com (optional)
6. Administrator configures data isolation:
   - Level: Strict (complete data separation)
   - Shared resources: Backup infrastructure, monitoring only
   - Cross-tenant access: None
7. Administrator sets storage quotas:
   - Maximum storage: 100 GB
   - Maximum users: 250 users
   - Maximum vehicles: 200 vehicles
   - Alert thresholds: 80% usage
8. Administrator assigns tenant administrator:
   - Tenant Admin: Bob Richardson (bob@northeastlogistics.com)
   - Secondary Admin: Lisa Martinez (lisa@northeastlogistics.com)
9. Administrator configures feature set:
   - Enable ELD compliance: Yes
   - Enable Hours of Service tracking: Yes
   - Enable Telematics integration: Yes
   - Enable Safety modules: Yes
   - Enable Advanced reporting: Yes
   - Enable Custom API access: Yes
10. Administrator reviews tenant configuration summary:
    - Company: Northeast Logistics Corp
    - Users: 0 (can support up to 250)
    - Storage: 0 GB (allocated 100 GB)
    - Subdomain: northeastlogistics.fleetapp.com
    - Features: 8 modules enabled
11. Administrator clicks "Create Tenant"
12. System validates configuration:
    - Subdomain is unique and not already registered
    - No naming conflicts
    - Resources allocated correctly
13. System performs setup:
    - Creates tenant database partition
    - Allocates storage quota
    - Generates API credentials for tenant admin
    - Creates admin account for Bob Richardson
    - Sends welcome email to tenant admin with:
      - Login URL
      - Temporary admin credentials
      - Tenant onboarding guide
      - Feature overview
14. System displays confirmation: "Tenant created successfully"
15. Administrator provides Bob's contact info and sends onboarding materials
16. Bob logs in and completes tenant setup:
    - Invites users
    - Configures additional settings
    - Uploads vehicle data
    - Sets up integrations

#### Alternative Flows:

**A1: Migrate Existing User to New Tenant**
- 8a. If users need to be transferred between tenants:
  - Administrator selects "Migrate Users"
  - System displays list of users to migrate: 50 users from old tenant
  - Administrator selects migration type: "Full transfer with data"
  - System displays affected data:
    - Users: 50
    - Vehicles: 25
    - Routes: 150
    - Historical data: 2 years of records
  - Administrator sets migration window: "2025-11-15 10:00 PM to 11:00 PM"
  - System performs migration:
    - Copies user records and permissions
    - Assigns users to new tenant
    - Transfers vehicle assignments
    - Migrates historical data
    - Updates audit logs with migration markers
  - Administrator verifies migration completed successfully
  - Old tenant data archived (available for 30 days before purge)

**A2: Configure Tenant-Specific Features**
- 9a. If tenant requires custom feature set:
  - Administrator selects existing tenant: "SafeHaul Logistics"
  - Administrator clicks "Configure Features"
  - System displays feature selection matrix
  - Administrator disables features:
    - Driver training module (not needed)
    - Advanced safety analytics (not ready)
    - Custom API access (cost optimization)
  - Administrator enables beta features:
    - Next-generation route optimization (early access)
  - System updates feature flags for tenant
  - All users in tenant see updated feature set on next login

**A3: Set Up Custom Subdomain and Branding**
- 6a. If tenant requires white-label setup:
  - Administrator sets up custom domain: "ops.safehauler.com"
  - Administrator uploads custom CSS for full branding
  - Administrator uploads company logo and brand assets
  - System generates branded login page with company colors
  - Users accessing fleet.safehauler.com see fully customized experience
  - All emails and communications branded with company colors/logo

**A4: Configure Tenant Billing and Usage Limits**
- 7a. If billing-based access control required:
  - Administrator sets up billing plan:
    - Plan: "Standard - $99/month per vehicle"
    - Minimum vehicles: 50
    - Maximum vehicles: 200
    - Overage charges: $1.50/vehicle/month
  - Administrator sets usage limits:
    - Max API calls: 10,000/day
    - Max concurrent users: 25
    - Max stored data: 100 GB
  - System monitors usage and enforces limits:
    - When approaching 90% API limit: Alert sent to tenant admin
    - When exceeding limit: Requests throttled with error messages
    - When approaching storage limit: Alert sent to upgrade
  - Monthly billing calculated and invoiced automatically

#### Exception Flows:

**E1: Subdomain Already in Use**
- If selected subdomain is taken:
  - Administrator enters: "logistics" (already used by another tenant)
  - System displays error: "Subdomain 'logistics' already registered"
  - System suggests alternatives: "logistics2", "ne-logistics", "northeast-logistics"
  - Administrator selects alternative: "northeast-logistics"
  - Subdomain reserved successfully

**E2: Insufficient Storage Capacity**
- If system cannot allocate requested storage:
  - Administrator requests: 200 GB storage allocation
  - System displays error: "Insufficient available storage - only 50 GB available"
  - Administrator options:
    - Reduce allocation to 50 GB
    - Request infrastructure upgrade (requires billing)
    - Use external storage for archival
  - Administrator selects external storage option

**E3: Tenant Admin Account Creation Fails**
- If email service unavailable for tenant admin setup:
  - System fails to send invitation to Bob Richardson
  - System displays error: "Email service unavailable"
  - Tenant is created but admin account not activated
  - Administrator manually sends invitation via alternative method
  - Bob completes activation with alternative verification
  - System retries email service connection every 10 minutes

**E4: Tenant Deletion Requested**
- If tenant organization closes and wants complete removal:
  - Administrator initiates: "Deactivate Tenant"
  - System displays data impact:
    - Users affected: 150
    - Vehicles: 200
    - Data to be deleted: 150 GB
    - Historical records: 3 years
  - Administrator confirms with 2FA and backup code
  - System offers data export options:
    - Export to administrator (CSV/backup)
    - Retain for 30 days (recovery window)
    - Permanent deletion
  - Administrator selects: Retain 30 days then delete
  - System schedules deletion for 2025-12-15
  - Tenant marked as "Deactivating" - users can export data
  - After 30 days, automatic permanent deletion

#### Postconditions:
- New tenant organization is fully configured and operational
- Tenant administrator can manage their organization independently
- Data isolation is enforced at database level
- Branding and customization applied across all tenant interfaces
- Feature set is appropriate for tenant requirements
- Billing and usage limits enforced automatically
- Tenant creation and configuration logged in system audit trail

#### Business Rules:
- BR-SA-015: Each tenant must have at least one administrative user
- BR-SA-016: Tenant subdomains must be unique system-wide
- BR-SA-017: Cross-tenant data access strictly prohibited (enforced at database level)
- BR-SA-018: Each tenant isolated in separate database partition or schema
- BR-SA-019: Storage quotas enforced with 80% warning threshold
- BR-SA-020: Tenant data exported before deletion (available for 30 days)
- BR-SA-021: All tenant configuration changes logged with timestamp and admin identity

#### Related User Stories:
- US-SA-003: Multi-Tenant Organization Management

---

## Epic 2: System Configuration and Integration

### UC-SA-004: Configure Single Sign-On (SSO) Integration

**Use Case ID**: UC-SA-004
**Use Case Name**: Configure Single Sign-On (SSO) Integration
**Actor**: System Administrator (primary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- SSO configuration module is accessible
- Organization has corporate identity provider (Azure AD, Okta, etc.)
- SSL certificates are valid and deployed
- Network access to identity provider available

#### Trigger:
- Organization requires SSO integration with corporate directory
- SAML integration needed for enterprise deployment
- Multi-tenant environment requires separate SSO per tenant
- Compliance requirements mandate centralized authentication

#### Main Success Scenario:
1. System Administrator navigates to SSO Configuration
2. Administrator selects SSO provider type:
   - Azure Active Directory (selected)
   - Okta
   - OneLogin
   - Generic SAML 2.0
3. Administrator enters Azure AD configuration details:
   - Tenant ID: 0ec14b81-7b82-45ee-8f3d-cbc31ced5347
   - Client ID: baae0851-0c24-4214-8587-e3fabc46bd4a
   - Client Secret: [encrypted value]
4. System displays SAML metadata for IdP configuration:
   - Service Provider Entity ID: https://fleetapp.company.com/saml/metadata
   - Assertion Consumer Service (ACS) URL: https://fleetapp.company.com/auth/saml/acs
   - Single Logout Service URL: https://fleetapp.company.com/auth/saml/slo
5. Administrator configures attribute mapping (Azure AD → Fleet App):
   - Azure AD 'mail' → Fleet App 'email'
   - Azure AD 'givenName' → Fleet App 'firstName'
   - Azure AD 'surname' → Fleet App 'lastName'
   - Azure AD 'jobTitle' → Fleet App 'jobTitle'
   - Azure AD 'officeLocation' → Fleet App 'location'
   - Azure AD 'groups' → Fleet App 'roles' (custom mapping)
6. Administrator sets up group-to-role mapping:
   - Azure AD group 'Fleet-Managers' → Fleet App role 'Fleet Manager'
   - Azure AD group 'Fleet-Drivers' → Fleet App role 'Driver'
   - Azure AD group 'Fleet-Safety' → Fleet App role 'Safety Officer'
7. Administrator enables Just-In-Time (JIT) provisioning:
   - Option: Automatically create user on first SSO login
   - Default role for new users: Driver (can be overridden by groups)
   - Auto-assign roles based on Azure AD groups: Enabled
8. Administrator configures SSO fallback options:
   - Fallback to local authentication if SSO unavailable: Yes
   - Allow password login after SSO failure: Yes
   - Timeout for SSO fallback: 30 seconds
9. Administrator uploads Azure AD SAML metadata (XML file)
10. System validates SAML configuration:
    - Certificate validity: Valid until 2026-11-11
    - Endpoints reachable: All accessible
    - Metadata structure: Valid
11. Administrator clicks "Test SSO Connection"
12. System performs test:
    - Initiates SAML authentication flow
    - Contacts Azure AD SAML endpoint
    - Requests test authentication
    - System displays: "SAML authentication successful - Test User returned"
13. Administrator reviews test results:
    - User mapping: "Test User" mapped correctly
    - Groups: ['Fleet-Managers', 'IT-Admins']
    - Roles assigned: 'Fleet Manager', plus custom mappings
    - Email extracted: test.user@company.com
14. Administrator confirms test passed and activates SSO
15. System displays SSO enablement options:
    - Make SSO primary login method (replace password login)
    - Keep both SSO and password login available
16. Administrator selects: "SSO primary, password backup only"
17. Administrator enables Single Logout (SLO): Yes
18. System displays confirmation:
    - SSO configured and tested successfully
    - Configuration effective immediately
    - Azure AD users can now log in via SSO
19. Administrator notifies users: "SSO login is now available"
20. Users test SSO login:
    - Click "Login with Azure AD"
    - Redirected to Azure AD login
    - Enter corporate credentials
    - Returned to Fleet App with session established
    - User roles populated from Azure AD groups

#### Alternative Flows:

**A1: Configure Okta SSO**
- 2a. If organization uses Okta instead of Azure AD:
  - Administrator selects: Okta as provider
  - Administrator enters Okta configuration:
    - Okta domain: company.okta.com
    - Client ID: [from Okta]
    - Client Secret: [from Okta]
  - System generates SAML metadata for Okta
  - Administrator uploads to Okta application
  - System tests connection to Okta
  - Configuration proceeds as normal

**A2: Configure Multiple SSO Providers (Multi-Tenant)**
- 3a. If system has multiple tenants with different IdPs:
  - Administrator creates SSO configuration: "Tenant A - Azure AD"
  - Administrator creates SSO configuration: "Tenant B - Okta"
  - Administrator creates SSO configuration: "Tenant C - OneLogin"
  - System routes users to appropriate SSO endpoint based on tenant/subdomain
  - Each tenant has independent SSO configuration
  - Tenant-specific SAML endpoints

**A3: Configure SCIM User Provisioning (Advanced)**
- 7a. If advanced user synchronization required:
  - Administrator enables: "SCIM 2.0 User Provisioning"
  - System generates SCIM endpoint: https://fleetapp.company.com/scim/v2/
  - Administrator configures in Azure AD:
    - Provisioning mode: Automatic (sync from Azure AD)
    - Sync scope: All users in group 'Fleet-Users'
    - Attribute mappings: Custom mappings
  - System automatically:
    - Creates users in Fleet App when added to Fleet-Users group
    - Updates user attributes when changed in Azure AD
    - Deactivates users when removed from group
    - Keeps user data synchronized continuously

**A4: Configure Conditional Access and Multi-Factor Auth**
- 8a. If conditional access policies required:
  - Administrator enables: "Conditional Access Integration"
  - Administrator configures policy: "Require MFA for high-risk sign-ins"
  - System honors Azure AD Conditional Access policies
  - When risk detected: Azure AD triggers MFA
  - User completes MFA in Azure AD
  - Returns to Fleet App with established session

#### Exception Flows:

**E1: SAML Certificate Expired**
- If SAML certificate is expired or expiring:
  - System detects: "SAML certificate expires in 30 days"
  - System sends alert to administrator
  - Administrator uploads new certificate from Azure AD
  - System validates new certificate
  - SSO continues without interruption

**E2: IdP Connection Fails During Testing**
- If Azure AD is unreachable:
  - Administrator clicks "Test Connection"
  - System displays error: "Cannot reach Azure AD endpoint"
  - System displays troubleshooting info:
    - Network connectivity: Blocked
    - Certificate validation: OK
    - Endpoint URL: Verified correct
  - Administrator checks firewall/network access
  - Administrator retests after network issues resolved

**E3: Attribute Mapping Incorrect**
- If Azure AD attributes don't match expected values:
  - Administrator configured mapping: Azure 'location' → Fleet 'office'
  - User logs in via SSO
  - User's office location is blank (Azure attribute named differently)
  - Administrator edits mapping: Azure 'physicalDeliveryOfficeName' → Fleet 'office'
  - Users logging in after mapping fix receive correct office location

**E4: User SSO Login Fails Due to Group Mismatch**
- If user not in mapped groups:
  - User attempts SSO login
  - User authenticated successfully in Azure AD
  - User NOT in any Fleet-mapped groups
  - System displays message: "Your organization has not yet provisioned access"
  - Administrator adds user to Fleet-Drivers group in Azure AD
  - User logs in again, now receives Driver role

#### Postconditions:
- SSO integration is fully configured and tested
- Users can authenticate via corporate identity provider
- User roles and attributes automatically populated from IdP
- Fallback authentication available if SSO fails
- All SSO configuration and testing logged in audit trail
- Single Sign-Out (SLO) functional across all systems

#### Business Rules:
- BR-SA-022: SSO configuration must be tested before activation
- BR-SA-023: SAML certificates must be rotated before expiration
- BR-SA-024: Fallback authentication required as backup to SSO
- BR-SA-025: User attribute mappings must result in valid system users
- BR-SA-026: SSO configurations are tenant-specific or global per deployment
- BR-SA-027: IdP connection failures logged with detailed error information
- BR-SA-028: Automatic user provisioning (JIT) disabled by default

#### Related User Stories:
- US-SA-004: Single Sign-On (SSO) and SAML Configuration

---

### UC-SA-005: Manage API Keys and Rate Limiting

**Use Case ID**: UC-SA-005
**Use Case Name**: Manage API Keys and Rate Limiting
**Actor**: System Administrator (primary), Developer (secondary)
**Priority**: Medium

#### Preconditions:
- System Administrator is logged into admin portal
- API management module is accessible
- Third-party integrations require API access
- Rate limiting infrastructure (Redis) is operational

#### Trigger:
- New third-party integration requires API key
- Existing API key needs rotation or revocation
- API rate limits need adjustment
- Security incident requires key regeneration

#### Main Success Scenario:
1. System Administrator navigates to API Key Management
2. Administrator clicks "Generate New API Key"
3. System displays API key creation form:
   - Name: "Geotab Telematics Integration"
   - Owner: [select user or service account]
   - Service Account Email: geotab-integration@company.com
4. Administrator assigns API permissions:
   - GET /api/vehicles: Read vehicle data (✓ selected)
   - GET /api/routes: Read route data (✓)
   - GET /api/drivers: Read driver data (✓)
   - POST /api/gps-data: Write GPS updates (✓)
   - GET /api/incidents: Read incident data (✓)
   - All other endpoints: ✗ (not granted)
5. Administrator sets API key expiration: 365 days (2026-11-11)
6. Administrator configures rate limiting:
   - Requests per minute: 100
   - Requests per hour: 5,000
   - Requests per day: 50,000
   - Daily quota: 50,000 requests/day
   - Burst capacity: 500 requests/10 seconds
7. Administrator enables IP whitelisting:
   - Allowed IPs:
     - 192.168.1.10 (Geotab production server)
     - 192.168.1.11 (Geotab backup server)
     - 203.45.67.89 (Geotab cloud API gateway)
8. Administrator configures key renewal reminders:
   - Send warning 30 days before expiration: Enabled
   - Send warning 7 days before expiration: Enabled
   - Allow grace period after expiration: 7 days
9. Administrator adds webhook configuration:
   - Webhook URL: https://geotab.company.com/webhooks/fleet-updates
   - Events to notify: vehicle_location_update, incident_created
   - Authentication: API key signature validation
10. Administrator reviews API key configuration summary
11. Administrator clicks "Create API Key"
12. System generates secure API key: "fleet_live_w7K9mPqRsT2uVxYzAbCdEfGh"
13. System displays one-time API key (with warning to save securely):
    - API Key: fleet_live_w7K9mPqRsT2uVxYzAbCdEfGh
    - Secret: [shown once, cannot be retrieved]
    - Status: Active
    - Created: 2025-11-11 09:30:00
    - Expires: 2026-11-11
14. Administrator copies key and provides to Geotab development team via secure channel
15. System logs API key creation with full details
16. Geotab team uses API key:
    - Include in Authorization header: "Authorization: Bearer fleet_live_w7K9mPqRsT2uVxYzAbCdEfGh"
    - Submits API requests
    - System validates key, checks permissions, enforces rate limits
17. Administrator monitors API key usage via dashboard:
    - Requests today: 35,420 (71% of daily quota)
    - Requests this minute: 87 (87% of 100 limit)
    - Last request: 2025-11-11 14:23:15
    - Errors: 12 (0.03% error rate)
    - Top endpoints:
      - GET /api/vehicles: 15,234 requests
      - POST /api/gps-data: 12,156 requests
      - GET /api/routes: 8,030 requests

#### Alternative Flows:

**A1: Regenerate Existing API Key**
- 2a. If key needs rotation:
  - Administrator searches for API key: "Geotab Telematics Integration"
  - System displays key details and usage
  - Administrator clicks "Regenerate Key"
  - System displays warning: "Old key will be revoked - current integrations will fail"
  - System displays grace period: "7-day overlap period to update integration"
  - Administrator confirms regeneration
  - System generates new key: "fleet_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ"
  - System keeps old key active for 7 days (grace period)
  - Geotab team updates their integration with new key within 7 days
  - After 7 days, old key automatically revoked
  - Geotab team must use new key

**A2: Adjust Rate Limits for Spike**
- 6a. If integration temporarily needs higher limits:
  - Geotab notifies: "Our system is doing a one-time data migration - need 2x normal limits"
  - Administrator opens API key settings
  - Administrator temporarily increases limits:
    - Requests per minute: 100 → 200
    - Requests per hour: 5,000 → 10,000
    - Requests per day: 50,000 → 100,000
  - Administrator sets expiration: 24 hours (back to normal tomorrow)
  - System logs temporary limit adjustment
  - After 24 hours, limits automatically revert to standard
  - Geotab migration completes successfully

**A3: Revoke API Key Due to Security Incident**
- 2a. If key is compromised:
  - Administrator detects suspicious API activity
  - Geotab integration making requests from unauthorized IP: 185.220.101.10
  - Administrator immediately revokes key
  - System sends notification to Geotab: "API key revoked - suspicious activity detected"
  - System logs security incident and revocation reason
  - All requests using revoked key immediately fail with 401 Unauthorized
  - Geotab team must request new key and provide explanation
  - Administrator investigates suspicious activity
  - After security review, administrator creates new API key with additional restrictions

**A4: Monitor Rate Limit Violations**
- 17a. If integration exceeds configured limits:
  - Integration making 200 requests/minute (exceeds 100 limit)
  - System throttles requests: Returns 429 Too Many Requests
  - System logs rate limit violation
  - Administrator receives alert: "API rate limit exceeded - Geotab integration"
  - Administrator views detailed violation info:
    - Time of violation: 2025-11-11 14:45:30
    - Limit exceeded: Requests per minute (200 vs 100 limit)
    - Duration: 8 minutes of sustained high request rate
    - Requests rejected: 847
  - Administrator contacts Geotab: "High request rate detected"
  - Geotab explains: "We upgraded our processing, will reduce request rate"
  - Administrator increases limit temporarily while they optimize

#### Exception Flows:

**E1: API Key Not Used After Creation**
- If API key unused for extended period:
  - API key created 90 days ago, never used
  - System sends warning: "API key 'Geotab Integration' unused for 90 days"
  - Administrator can choose to:
    - Keep key active
    - Mark for automatic revocation in 30 days
    - Revoke immediately
  - After 120 days unused, system auto-revokes key with notification

**E2: IP Whitelist Too Restrictive**
- If integration fails due to IP filtering:
  - Geotab reports: "API requests being rejected with 403 Forbidden"
  - Administrator checks: IP whitelist only has old server IP
  - Geotab has migrated to new cloud infrastructure
  - Administrator adds new IP: 203.45.67.100 (new Geotab cloud provider)
  - Geotab retries, requests now succeed

**E3: Webhook Delivery Failing**
- If configured webhook endpoint unavailable:
  - System attempts to deliver webhook events
  - Endpoint returns: 503 Service Unavailable
  - System retries with exponential backoff (1s, 2s, 4s, 8s, etc.)
  - After 5 failed attempts over 1 hour, system logs failed delivery
  - Administrator receives alert: "Webhook delivery failing - endpoint unavailable"
  - Administrator contacts Geotab to restore their webhook endpoint
  - System resumes successful webhook delivery

**E4: API Key Secret Already Leaked**
- If administrator discovers key was displayed in logs/error:
  - Administrator finds API key in error message visible to users
  - Administrator immediately revokes key
  - System sends alert to all using the key
  - Administrator generates new key
  - System checks logs for any unauthorized use of exposed key
  - If unauthorized use detected, escalates to security team
  - Post-incident review to prevent key exposure in future

#### Postconditions:
- API key is generated with appropriate permissions
- Rate limits are configured and enforced
- IP whitelisting restricts unauthorized access
- Key usage is monitored and logged
- API key rotation and revocation processes are functioning
- Integration can successfully authenticate and use API
- All API key operations logged in audit trail

#### Business Rules:
- BR-SA-029: API keys must expire (minimum 365 days)
- BR-SA-030: Rate limits enforced at API gateway level
- BR-SA-031: IP whitelisting recommended for sensitive integrations
- BR-SA-032: Webhook signatures required for authentication
- BR-SA-033: Key regeneration provides grace period for migration
- BR-SA-034: Rate limit violations return 429 Too Many Requests
- BR-SA-035: API key secret shown only once at creation

#### Related User Stories:
- US-SA-005: API Key Management and Rate Limiting

---

### UC-SA-006: Configure Third-Party Integrations

**Use Case ID**: UC-SA-006
**Use Case Name**: Configure Third-Party Integrations
**Actor**: System Administrator (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Integration module is accessible
- Third-party service API credentials available
- Network connectivity to integration endpoints verified
- Database and message queue infrastructure operational

#### Trigger:
- New telematics provider integration required
- Fuel card system needs to sync data
- ERP system integration for accounting
- Legacy system needs data exchange

#### Main Success Scenario:
1. System Administrator navigates to Third-Party Integrations
2. Administrator clicks "Add New Integration"
3. System displays integration template library:
   - Telematics: Geotab, Samsara, Verizon Connect, Omnitracs
   - Fuel Cards: WEX, FleetCor, Comdata
   - ERP: QuickBooks, SAP, Oracle NetSuite
   - Other: GPS Tracking, Fuel Cost API, Weather Service
4. Administrator selects: "Geotab - Telematics Integration"
5. System displays integration configuration form:
   - Integration Name: "Geotab Vehicle Tracking"
   - Description: "Real-time vehicle location and diagnostics from Geotab"
   - Status: Disabled (until configured)
6. Administrator enters Geotab API credentials:
   - API Username: [from Geotab]
   - API Password: [encrypted]
   - Database URL: https://geotab.company.com/api
7. Administrator configures data synchronization:
   - Sync frequency: Every 5 minutes (real-time)
   - Data fields to sync:
     - Vehicle Location (GPS): ✓
     - Speed: ✓
     - Heading: ✓
     - Odometer: ✓
     - Engine Hours: ✓
     - Fault Codes: ✓
     - Harsh Events (braking, acceleration): ✓
8. Administrator maps external fields to internal system:
   - Geotab 'deviceId' → Fleet 'vehicleId'
   - Geotab 'latitude'/'longitude' → Fleet 'gpsLocation'
   - Geotab 'dateTime' → Fleet 'timestamp'
   - Geotab 'speed' → Fleet 'currentSpeed'
9. Administrator sets data sync destination:
   - Write to: Fleet database (real-time GPS table)
   - Archive to: Azure Blob Storage (historical data)
   - Real-time retention: 7 days (memory cache)
   - Archive retention: 7 years (compliance)
10. Administrator configures error handling:
    - Retry failed syncs: Yes
    - Retry interval: 30 seconds
    - Max retries: 3 times
    - Failed data logging: Full error details
11. Administrator sets up webhook notifications:
    - Notify on critical fault codes: Yes
    - Notify on harsh driving events: Yes
    - Notification channel: Dispatcher dashboard + email alerts
12. Administrator configures background job scheduling:
    - Worker queue: Integration processing queue
    - Concurrency: 5 simultaneous workers
    - Memory allocation: 2GB per worker
13. Administrator clicks "Test Integration"
14. System performs connection test:
    - Authenticates with Geotab API: ✓
    - Retrieves sample data: ✓ (15 vehicles)
    - Maps fields correctly: ✓
    - Writes test data to database: ✓
    - Validates data integrity: ✓
15. System displays test results:
    - Connection: Successful
    - Sample vehicles: 15
    - Sample data points: 450 records
    - Field mapping: All fields correctly mapped
    - Data quality: No errors detected
16. Administrator reviews test data sample:
    - Vehicle #1: GPS location accurate, speed correct, timestamp valid
    - Vehicle #12: Engine hours increasing correctly, odometer incrementing
    - All fault codes properly categorized
17. Administrator enables integration: Clicks "Activate"
18. System starts real-time data synchronization:
    - Background workers begin pulling data from Geotab every 5 minutes
    - Data immediately available in Fleet app
    - Dispatchers see live vehicle locations from Geotab
    - Harsh driving events trigger dispatcher notifications
19. Administrator monitors integration status:
    - Uptime: 99.8%
    - Data freshness: <30 seconds
    - Last successful sync: 2 minutes ago
    - Vehicles synced: 215 active vehicles
    - Sync errors: 0 in last 24 hours
20. Administrator configures integration alerts:
    - Alert if sync fails for >5 minutes: Enabled
    - Alert if vehicle data becomes stale (>10 min old): Enabled
    - Alert on field mapping errors: Enabled

#### Alternative Flows:

**A1: Configure Fuel Card Integration**
- 4a. If adding fuel card system:
  - Administrator selects: "WEX Fuel Card"
  - Administrator enters WEX API credentials:
    - API Key: [from WEX]
    - Merchant IDs: [list of company fuel cards]
  - Administrator configures data mapping:
    - WEX 'transactionDate' → Fleet 'fuelDate'
    - WEX 'amount' → Fleet 'fuelCost'
    - WEX 'quantity' → Fleet 'fuelGallons'
    - WEX 'location' → Fleet 'fuelStopLocation'
    - WEX 'odometer' → Fleet 'vehicleOdometer'
  - Administrator sets sync frequency: Daily (overnight batch)
  - Administrator maps driver/vehicle from fuel card transaction
  - System tests connection and retrieves sample fuel transactions
  - Integration activated and fuel costs automatically sync daily

**A2: Configure ERP/Accounting Integration**
- 4a. If connecting to accounting system:
  - Administrator selects: "QuickBooks Online"
  - Administrator authenticates with QuickBooks OAuth
  - System displays available QuickBooks entities:
    - Chart of Accounts
    - Vendors
    - Invoices
    - Bills
  - Administrator configures two-way sync:
    - Send: Fleet costs → QuickBooks Expenses
    - Send: Fuel costs → QuickBooks Category: Vehicle Fuel
    - Send: Maintenance costs → QuickBooks Category: Vehicle Repairs
    - Receive: Vendor information (keep updated)
  - Administrator maps cost categories:
    - Fuel transactions → Vehicle Fuel category
    - Maintenance → Vehicle Maintenance category
    - Insurance → Vehicle Insurance category
  - System tests connection and syncs sample data
  - Accounting team confirms receipt of vehicle cost data

**A3: Configure Custom API Integration**
- 4a. If third-party system not in template library:
  - Administrator selects: "Custom API Integration"
  - Administrator enters custom integration details:
    - Name: "Custom GPS Tracking API"
    - API base URL: https://custom-provider.com/api/v2
    - Authentication method: OAuth 2.0
  - Administrator configures API endpoints:
    - Vehicle data endpoint: GET /vehicles
    - Location data endpoint: GET /vehicles/{id}/locations
    - Field mapping: [custom mappings]
  - System generates sample API calls
  - Administrator verifies endpoints are correct
  - System tests integration with sample data

**A4: Configure Scheduled Data Sync**
- 11a. If real-time sync not required:
  - Administrator sets sync frequency: Daily at 2:00 AM
  - System schedules background job for integration
  - Sync runs during off-peak hours
  - Data available in system by 2:30 AM
  - No real-time updates, but cost-efficient

#### Exception Flows:

**E1: Integration Credentials Expired**
- If API credentials expire:
  - Geotab password expires after 90 days (password rotation policy)
  - System detects authentication failure
  - System logs integration error: "Authentication failed"
  - Administrator receives alert: "Geotab integration authentication failed"
  - Administrator updates credentials: New password entered
  - System retests connection
  - Integration resumes normal operation

**E2: Field Mapping Produces Data Conflicts**
- If mapped fields create inconsistent data:
  - Geotab sends 'deviceId' but Fleet system expects 'vehicleId'
  - Mapping configured incorrectly causes unmatched records
  - Administrator notices: Unmatched vehicles (200) in system
  - Administrator reviews mapping: Geotab 'deviceId' ≠ Fleet 'vehicleId'
  - Administrator corrects mapping with lookup table
  - System re-processes records with corrected mapping

**E3: Sync Data Rate Exceeds Quota**
- If integration generates excessive data:
  - Real-time Geotab sync generating 1 million records/hour
  - System detects quota exceeded: "30 million records/day quota reached"
  - Administrator receives alert and options:
    - Increase sync frequency (reduce real-time to every 30 seconds vs 5)
    - Request infrastructure upgrade
    - Reduce data fields synced
  - Administrator reduces sync frequency to every 15 minutes
  - Data rate reduces to acceptable level

**E4: Third-Party Service Outage**
- If integration endpoint unavailable:
  - Geotab API unreachable for 2 hours (maintenance)
  - System detects repeated connection failures
  - System displays: "Geotab service temporarily unavailable"
  - System switches to queue backlog mode
  - When Geotab returns online, queued updates are processed
  - No data loss, slight delay in vehicle location updates

#### Postconditions:
- Integration is configured and tested successfully
- Data flows in real-time (or on schedule) from external system
- Fields are correctly mapped to internal system structure
- Errors are logged and monitored
- Integration status is visible to administrators
- Data quality is validated
- System Administrator can troubleshoot integration issues

#### Business Rules:
- BR-SA-036: All integrations must be tested before activation
- BR-SA-037: API credentials stored encrypted in Azure Key Vault
- BR-SA-038: Field mapping must maintain data type compatibility
- BR-SA-039: Sync frequency configurable per integration type
- BR-SA-040: Failed syncs logged with root cause analysis
- BR-SA-041: Integration health monitored with automated alerts
- BR-SA-042: Webhook endpoints must validate signatures

#### Related User Stories:
- US-SA-006: Third-Party Integration Configuration

---

## Epic 3: Data Backup and Recovery

### UC-SA-007: Configure Automated Backups

**Use Case ID**: UC-SA-007
**Use Case Name**: Configure Automated Backups
**Actor**: System Administrator (primary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Database backup infrastructure is operational (Azure Backup, SQL backups)
- Azure Storage accounts configured for backup storage
- Key Vault configured for encryption key management
- Backup monitoring and alerting system operational

#### Trigger:
- Initial system deployment requires backup configuration
- Backup retention policies need adjustment
- Recovery time objective (RTO) requirements change
- Compliance requirements mandate specific backup strategy

#### Main Success Scenario:
1. System Administrator navigates to Backup Configuration
2. Administrator accesses Automated Backup settings
3. System displays current backup status:
   - Database size: 450 GB
   - Last backup: 2025-11-11 02:00 AM (successful)
   - Backup location: Azure Blob Storage (geo-redundant)
   - Retention policy: 7 daily, 4 weekly, 12 monthly, 7 yearly
4. Administrator configures backup schedule:
   - Full backup: Sundays at 2:00 AM (weekly)
   - Differential backup: Daily at 2:00 AM (Monday-Saturday)
   - Transaction log backup: Every 30 minutes (continuous protection)
5. Administrator sets retention policies:
   - Daily backups: Keep 7 days
   - Weekly backups: Keep 4 weeks
   - Monthly backups: Keep 12 months
   - Yearly backups: Keep 7 years
   - After retention expires: Auto-delete from storage
6. Administrator configures backup encryption:
   - Encryption method: AES-256
   - Key storage: Azure Key Vault
   - Customer-managed keys: Enabled
   - Key rotation: Annual
7. Administrator enables geo-redundant backup storage:
   - Primary storage location: East US 2
   - Redundancy: Geo-redundant (automatically replicated to West US)
   - Data residency: United States only
8. Administrator configures backup monitoring and alerts:
   - Alert if backup fails: Enabled
   - Alert if backup takes >4 hours: Enabled
   - Alert if backup storage usage exceeds 80%: Enabled
   - Email recipients: admin@company.com, ops-team@company.com
9. Administrator configures backup compression:
   - Enable compression: Yes
   - Expected compression ratio: 70% (reduces 450 GB to ~135 GB)
   - Storage savings: Significant cost reduction
10. Administrator excludes transient data from backups:
    - Exclude: Temporary log files (cache)
    - Exclude: Session data (recreated at startup)
    - Exclude: Real-time GPS cache (>10GB, recoverable from telematics)
    - Include: All transactional data, user data, configuration
11. Administrator reviews backup capacity projections:
    - Current retention size: 180 GB
    - Projected monthly growth: 15 GB
    - Projected 1-year storage size: 360 GB
    - Projected 1-year storage cost: $8,640
12. Administrator enables backup testing:
    - Test restore monthly: Automated monthly restore validation
    - Test date: First Sunday of each month at 6:00 AM
    - Validate against: Checksum, row counts, referential integrity
    - Report results to: Administrator email
13. Administrator saves backup configuration
14. System displays confirmation:
    - Backup schedule configured
    - Next full backup: Sunday 2025-11-15 at 2:00 AM
    - Next differential backup: Thursday 2025-11-12 at 2:00 AM
    - Transaction log backup every 30 minutes
15. System initiates scheduled backup process:
    - Full backup runs and completes in 2.5 hours
    - 450 GB compressed to 135 GB with AES-256 encryption
    - Stored in Azure Blob Storage (geo-redundant)
    - Verification checksum computed and stored
16. Administrator monitors backup jobs dashboard:
    - Last 5 backups: All successful
    - Backup duration trend: Consistent 2.5 hours
    - Storage efficiency: 70% compression ratio achieved
    - Next backup: Today 2:00 AM (differential) - 15 min estimated
17. Administrator receives daily backup status email:
    - Backup summary: 1 full, 4 differential, 30 transaction log
    - Total size: 180 GB across all retention tiers
    - All backups verified: Integrity check passed
    - Recommend action: None (all normal)

#### Alternative Flows:

**A1: Configure Copy-Only Backup for Testing**
- 3a. If testing requires independent backup:
  - Administrator creates: "Test Backup Copy"
  - Configuration: Full database copy every week (Thursday 8:00 PM)
  - Storage: Separate test backup location
  - Retention: Keep only current copy (replace weekly)
  - This enables restore testing without affecting production backups

**A2: Configure Backup Exclusions for GDPR Compliance**
- 10a. If personally identifiable information (PII) needs exclusion:
  - Administrator excludes from backup:
    - Driver contact information (phone, personal email)
    - Driver personal identification (SSN, license numbers)
    - Vehicle owner information (personal names, addresses)
  - These excluded fields can be restored from anonymized backups
  - Useful for GDPR "right to be forgotten" compliance

**A3: Configure Off-Site Backup to Third-Party Provider**
- 7a. If additional backup vendor required:
  - Administrator enables: Secondary backup to Veeam
  - Veeam configuration:
    - Schedule: Daily full backup at 4:00 AM (after Azure backup)
    - Retention: 30-day rolling window
    - Location: Veeam Cloud Datacenter (different geographic region)
    - Cost: Paid backup service, $15K/year
  - Provides additional recovery option for disaster scenarios

**A4: Configure Backup Before Major System Change**
- 1a. If system upgrade or migration planned:
  - Administrator creates: "Pre-migration backup"
  - Type: Full backup taken immediately before change
  - Retention: Extended 90-day hold (beyond normal policy)
  - Access: Easy restore point if migration fails
  - After successful migration: Can revert to normal retention

#### Exception Flows:

**E1: Backup Storage Quota Exceeded**
- If backup storage reaches allocated capacity:
  - System detects: 95% of 500 GB quota used
  - System sends alert: "Backup storage nearing limit"
  - Administrator options:
    - Increase storage quota (cost)
    - Reduce retention policy (shorter history)
    - Compress older backups (takes CPU)
  - Administrator increases quota to 1 TB (handles 2 years of backups)

**E2: Backup Encryption Key Unavailable**
- If encryption key is deleted/lost:
  - System cannot decrypt existing backups
  - Recent backups (without key): Cannot be restored
  - Recovery options:
    - Restore from backup created before key deletion
    - Request key recovery from Key Vault (90-day recovery window)
    - Use geographically replicated backup (if encrypted with different key)
  - Administrator immediately contacts Microsoft support
  - Key recovered from Key Vault soft-delete recovery
  - Backup decryption resumes normally

**E3: Backup Fails Due to Database Lock**
- If long-running transaction blocks backup:
  - System attempts backup at 2:00 AM
  - Large ETL job running, database locked
  - Backup cannot acquire necessary locks
  - System waits 5 minutes, retries
  - Still locked, backup fails
  - Administrator receives alert: "Backup failed - database locked"
  - Administrator investigates: ETL job stuck in transaction
  - Administrator kills blocking process
  - Manual backup initiated immediately
  - Automated retry attempted for next backup window

**E4: Backup Storage Account Becomes Inaccessible**
- If storage account connectivity issues:
  - Network firewall rule blocks backup service
  - System cannot write backup files to Azure Storage
  - Administrator receives alert: "Backup storage unavailable"
  - System retries connection every 10 minutes
  - After 60 minutes of failure, escalates to critical alert
  - Administrator investigates firewall rules
  - Restores network connectivity
  - Backup immediately re-runs

#### Postconditions:
- Automated backups are scheduled and operational
- Backups are encrypted and stored geo-redundantly
- Retention policy automatically manages backup lifecycle
- Backup integrity validated monthly
- Backup status monitored with automated alerts
- Recovery procedures tested regularly
- Backup cost projections understood and budgeted
- Compliance requirements met (encryption, retention, testing)

#### Business Rules:
- BR-SA-043: Backups must be encrypted with customer-managed keys
- BR-SA-044: Geo-redundant backup storage required for production
- BR-SA-045: Monthly automated backup restoration tests required
- BR-SA-046: Backup encryption keys backed up separately in Key Vault
- BR-SA-047: Audit logs and PII excluded based on compliance requirements
- BR-SA-048: Backup retention: Minimum 7 days, maximum 7 years
- BR-SA-049: Transaction log backups enable point-in-time recovery

#### Related User Stories:
- US-SA-007: Automated Backup Configuration

---

### UC-SA-008: Perform Disaster Recovery and Point-in-Time Restore

**Use Case ID**: UC-SA-008
**Use Case Name**: Perform Disaster Recovery and Point-in-Time Restore
**Actor**: System Administrator (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Automated backups are configured and current
- Disaster recovery procedures are documented
- Isolated restore environment (staging database) available
- Database restore tools and expertise available
- Backup encryption keys accessible in Key Vault

#### Trigger:
- Data corruption discovered requiring point-in-time recovery
- Accidental data deletion requires restoration
- Major system failure requires disaster recovery
- Audit investigation requires restore to specific timestamp
- Ransomware attack requires restore from clean backup

#### Main Success Scenario:
1. System Administrator discovers data corruption issue:
   - Driver records show missing delivery addresses
   - Issue discovered: 2025-11-11 at 10:30 AM
   - Corruption detected at: Last modified 2025-11-10 at 11:45 PM
   - Root cause: Failed data migration script
2. Administrator navigates to Disaster Recovery and Restore
3. Administrator clicks "Initiate Point-in-Time Restore"
4. System displays restore options:
   - Restore to staging database (test environment): Recommended
   - Restore to production: Requires approval and maintenance window
5. Administrator selects: Restore to staging database for testing
6. Administrator selects recovery point:
   - Available restore window: Last 35 days
   - Select: 2025-11-10 at 11:00 PM (before corruption occurred)
7. Administrator selects scope:
   - Option 1: Full database restore
   - Option 2: Specific table restore
   - Option 3: Selective restore (tables and date range)
   - Administrator selects: Option 3 (selective)
8. Administrator selects tables to restore:
   - drivers ✓
   - driver_routes ✓
   - delivery_addresses ✓
   - (all other tables remain unchanged)
9. Administrator configures restore parameters:
   - Restore point: 2025-11-10 at 11:00 PM
   - Target database: Staging (recovery_test_db)
   - Overwrite existing data: Yes (in staging only)
   - Verify integrity after restore: Yes
   - Generate restore report: Yes
10. Administrator reviews pre-restore checklist:
    - Backups available: ✓
    - Restore environment prepared: ✓
    - Encryption keys accessible: ✓
    - Stakeholders notified: ✓ (Fleet Manager and Safety Officer)
    - Rollback plan in place: ✓
11. Administrator clicks "Start Restore"
12. System displays restore progress:
    - Retrieving backup from Azure Storage: 2 minutes
    - Decrypting backup with customer key: 1 minute
    - Extracting database files: 5 minutes
    - Restoring to staging database: 8 minutes
    - Total elapsed: 16 minutes
13. System performs integrity validation:
    - Row count verification: drivers (2,450 rows) ✓
    - Referential integrity checks: All foreign keys valid ✓
    - Index validation: All indexes intact ✓
    - Checksum verification: Data integrity confirmed ✓
14. System displays restore completion:
    - Restore successful at 2025-11-11 10:46 AM
    - Restored records: 2,450 drivers, 12,340 routes, 8,920 addresses
    - Data timestamp: 2025-11-10 at 11:00 PM (35 hours ago)
    - Restore report generated: Available for download
15. Administrator validates restored data:
    - Connects to staging database
    - Spot-checks driver records: All delivery addresses present ✓
    - Verifies route assignments: Intact ✓
    - Compares record counts to baseline: Match ✓
16. Administrator confirms restored data is correct
17. Administrator notifies stakeholders: "Data recovery validated - ready for production restore"
18. Administrator schedules production restore:
    - Maintenance window: 2025-11-11 11:00 PM to 12:30 AM (90 minutes)
    - Notification: All users notified of system downtime
    - Backup before production restore: Yes (pre-restore snapshot taken)
19. Administrator initiates production restore:
    - System display: "Restoring production database..."
    - Restore in progress: Users unable to access system
    - Restore duration: 45 minutes
20. Production restore completes successfully
21. Administrator verifies production data restored
22. System comes back online at 11:45 PM
23. All users can access system with recovered data
24. Administrator generates restore report:
    - Data recovered: 2,450 drivers, 12,340 routes, 8,920 addresses
    - Restore duration: 45 minutes
    - Data loss: 35 hours (from 11:00 PM to 10:30 AM next day)
    - Impact: No data loss, system fully operational
25. Administrator archive restore report for compliance

#### Alternative Flows:

**A1: Granular Table-Level Restore Without Full Database Restore**
- 7a. If only specific table needs recovery:
  - Administrator identifies: "delivery_addresses table corrupted"
  - All other tables are fine and current
  - Administrator selects: "Restore single table" option
  - System extracts only delivery_addresses table from backup
  - System maps recovered records to current system (matching drivers)
  - Restore completes in 5 minutes vs 45 minutes for full database
  - Minimal system disruption

**A2: Restore from Previous Day if Staging Restore Not Sufficient**
- 16a. If staging restore shows different corruption issue:
  - Staging restore shows: Driver names corrupted in 11:00 PM backup
  - Issue must have happened earlier
  - Administrator initiates second restore attempt
  - Select restore point: 2025-11-09 at 11:00 PM (day earlier)
  - Restore to staging again
  - Validation shows: Data clean at this point
  - Use this restore point for production recovery

**A3: Ransomware Attack Requires Clean Backup Recovery**
- 1a. If malware detected:
  - Security team detects ransomware in system
  - All production data encrypted
  - Administrator immediately initiates disaster recovery
  - Selects restore point: Before malware infection
  - System determines: "Infection started 2025-11-08 at 3:00 AM"
  - Selects restore point: 2025-11-07 at 11:00 PM
  - Restores clean database to new infrastructure
  - Isolates infected systems for forensic analysis
  - Users cut over to recovered system

**A4: Tenant-Level Restore (Multi-Tenant Environment)**
- 6a. If multi-tenant system and one tenant affected:
  - Tenant "SafeHaul Logistics" has data corruption
  - Other tenants (100+ companies) unaffected
  - Administrator selects: "Restore single tenant"
  - System restores only SafeHaul's database partition
  - Other tenants remain operational during restore
  - Only SafeHaul users experience brief restore window

#### Exception Flows:

**E1: Restore Point Encryption Key Not Available**
- If encryption key for backup was deleted:
  - System retrieves backup from Azure Storage
  - Attempts to decrypt with key from Key Vault
  - Key not found (deleted 60 days ago)
  - System enters recovery mode:
    - Check Key Vault soft-delete recovery (90-day window)
    - Key found in soft-delete recovery window
    - Administrator recovers key from Key Vault
    - Backup now decryptable
  - If key not recoverable: Restore from unencrypted backup (if available)

**E2: Staging Database Insufficient Storage**
- If restore target lacks capacity:
  - Staging database: 100 GB available
  - Restore size: 450 GB
  - System displays error: "Target database insufficient storage"
  - Administrator options:
    - Expand staging database storage (add 400 GB)
    - Use different staging environment with more space
    - Perform table-level restore (smaller subset)
  - Administrator expands staging storage
  - Restore retry succeeds

**E3: Restore Validation Failures Detected**
- If integrity check finds issues:
  - Restore completes but validation shows problems
  - Referential integrity error: 5 orphaned records found
  - Checksum mismatch on 10 records
  - System displays: "Restore completed with validation warnings"
  - Administrator investigates:
    - Corruption existed in backup also (before corruption event)
    - Safe to use this restore point
    - Orphaned records can be manually cleaned
  - Administrator proceeds with production restore

**E4: Production Restore Cannot Acquire Database Locks**
- If production database in use during restore:
  - Maintenance window started at 11:00 PM
  - Restore initiated but system still accessing database
  - Long-running batch job not completed
  - System waits for batch job completion
  - Batch takes 5 more minutes to finish
  - Database locks released
  - Restore completes successfully
  - Total downtime: 50 minutes (expected 45 minutes)

#### Postconditions:
- Data is recovered to specified point-in-time
- Recovery validated in staging environment before production restore
- Production system restored with recovered data
- System is fully operational after recovery
- All stakeholders notified of recovery status
- Recovery process documented in audit trail
- Post-recovery analysis performed
- Backup restoration test case added to disaster recovery playbook

#### Business Rules:
- BR-SA-050: All restores must be tested in staging before production
- BR-SA-051: Point-in-time recovery window: 35 days minimum
- BR-SA-052: Pre-restore backup snapshot created before production restore
- BR-SA-053: Encryption keys must be separately backed up from database backups
- BR-SA-054: Restore reports generated and archived for compliance
- BR-SA-055: Production restores require change approval and maintenance window
- BR-SA-056: System automatically validates restored data integrity

#### Related User Stories:
- US-SA-008: Disaster Recovery and Point-in-Time Restore

---

## Epic 4: Security and Audit Logging

### UC-SA-009: Monitor Security and Audit Logs

**Use Case ID**: UC-SA-009
**Use Case Name**: Monitor Security and Audit Logs
**Actor**: System Administrator (primary), Security Officer (secondary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Audit logging infrastructure is operational
- Log aggregation and search system is accessible (Azure Monitor, ELK)
- Retention storage is configured (7-year compliance requirement)
- Real-time alerting system is operational

#### Trigger:
- Daily audit log review process
- Security incident investigation
- Compliance audit requiring audit trail evidence
- Suspicious activity detected by monitoring system

#### Main Success Scenario:
1. System Administrator navigates to Audit Logging Dashboard
2. Administrator views real-time security summary:
   - Total users active today: 325
   - Total API calls: 2.5 million
   - Failed authentication attempts: 47
   - Data modification events: 3,240
   - Permission changes: 12
   - System config changes: 3
3. Administrator reviews authentication audit logs:
   - Filter: Failed login attempts, Last 24 hours
   - Results:
     - 47 failed attempts detected
     - Most from IP: 192.168.1.45 (internal user, multiple failures)
     - User: John Smith (johns@company.com)
     - Reason: Incorrect password (4 attempts in 10 minutes, then successful)
4. Administrator clicks on John Smith's failed attempts
5. System displays detailed log entries:
   - 2025-11-11 09:15:23 - Failed attempt #1 from 192.168.1.45
   - 2025-11-11 09:15:47 - Failed attempt #2 from 192.168.1.45 (new password?)
   - 2025-11-11 09:16:12 - Failed attempt #3 from 192.168.1.45
   - 2025-11-11 09:16:44 - Failed attempt #4 from 192.168.1.45
   - 2025-11-11 09:17:15 - Successful login from 192.168.1.45
6. Administrator determines: No security issue, user just forgot password
7. Administrator reviews data modification audit log:
   - Filter: Records modified, Last 24 hours
   - Top tables modified:
     - driver_vehicles (234 records): Vehicle reassignments
     - route_assignments (156 records): Route planning
     - work_orders (89 records): Maintenance assignments
     - vehicle_locations (1,234,567 records): Real-time GPS updates
8. Administrator spot-checks suspicious modification:
   - Modified record: Vehicle #247 ownership changed from Driver A to Driver B
   - User: Dispatcher Sarah Chen (sarah.chen@company.com)
   - Timestamp: 2025-11-11 08:30:00
   - Reason: [None recorded]
9. Administrator clicks on record for full change details:
   - Before: driver_id = 1045 (Driver A)
   - After: driver_id = 1087 (Driver B)
   - Field modified: driver_vehicles.assigned_driver
   - User: Sarah Chen
   - IP address: 192.168.1.89 (corporate network)
   - Device/Browser: Chrome Windows
   - Change appears legitimate (routine dispatch assignment)
10. Administrator reviews permission change audit:
    - Filter: Role or permission changes, Last 7 days
    - Results:
      - User Alice Johnson: Added "Approval Authority" permission (2025-11-10)
      - User Bob Richardson: Removed "API Key Management" permission (2025-11-09)
      - User Carol Davis: Role changed from "Dispatcher" to "Fleet Manager" (2025-11-08)
11. Administrator reviews system configuration changes:
    - API rate limit adjusted: 5,000 → 10,000 requests/minute (2025-11-11)
    - SSO configuration updated: Azure AD certificate replaced (2025-11-10)
    - Backup retention: 7 years → 5 years (2025-11-09)
12. Administrator exports audit log for compliance:
    - Date range: 2025-10-11 to 2025-11-11 (30 days)
    - Log types: All (authentication, data modification, permission changes, system config)
    - Format: CSV with all fields
    - File generated: fleet-audit-logs-2025-10-11-to-11-11.csv (2.3 MB)
13. Administrator sets up continuous monitoring for suspicious patterns:
    - Alert: >10 failed logins from same IP in 1 hour
    - Alert: Privilege escalation (user adds themselves admin permission)
    - Alert: Bulk data exports (>1 million records)
    - Alert: After-hours system configuration changes
    - Alert: Failed access to sensitive tables (PII, credentials)
14. Administrator reviews alert summary:
    - Alerts triggered last 24 hours: 3
    - Alert #1: After-hours access to salary data by Accountant Mike (2:00 AM)
      - Reviewed: Mike was doing month-end processing (approved)
    - Alert #2: 15 failed login attempts from new IP address
      - Reviewed: New office location, user eventually succeeded
    - Alert #3: API key regenerated by developer
      - Reviewed: Routine key rotation (normal)
15. Administrator determines: No security incidents detected
16. Administrator generates daily security report:
    - Failed authentication attempts: 47 (normal)
    - Data modifications: 3,240 (expected)
    - Permission changes: 12 (routine)
    - System alerts: 3 (all reviewed, all benign)
    - Recommendation: Continue normal monitoring
17. Report emailed to Security Officer and Compliance Officer

#### Alternative Flows:

**A1: Investigate Suspicious Data Access Pattern**
- 7a. If concerning activity detected:
  - Alert triggered: "User accessing unusually large number of records"
  - User: Dispatcher Tom Rodriguez
  - Activity: Exported 250,000 driver records at 3:00 AM
  - Normal activity: <1,000 records per month
  - Administrator investigates:
    - Is Tom authorized to export records? No (Dispatcher cannot export)
    - Was this action approved? No request in system
  - Administrator reviews actual log:
    - Actual export: Only 250 records (alert threshold too low)
    - But: User not supposed to have export permission
  - Administrator discovers: Permission accidentally granted during role migration
  - Administrator removes export permission from Dispatcher role
  - Reviews Tom's previous exports: No sensitive data exported
  - Escalates to Security Officer for review

**A2: Trace Data Modification to Root Cause**
- 9a. If data corruption source needs identification:
  - Corrupted data discovered: Driver names show garbled characters
  - Administrator searches audit logs for modifications
  - Administrator filters:
    - Table: drivers
    - Field: driver_name
    - Before value: "John Smith"
    - After value: "[corrupt characters]"
    - Date range: 2025-11-10 to 2025-11-11
  - Results: 2 modifications found
    - Modification #1: 2025-11-10 11:45 AM by User Tom Richardson (valid user)
    - Modification #2: 2025-11-10 11:45:33 AM by System [batch process]
  - Administrator investigates batch process
  - Root cause: Database migration script had encoding bug
  - Administrator identifies which batch run caused issue
  - Restores from backup before batch run
  - Fixes and re-runs batch with correction

**A3: Audit Log Search for Compliance Investigation**
- 1a. If external auditor requests evidence:
  - Auditor: "Show all changes to financial data for last 2 years"
  - Administrator searches:
    - Tables: costs, expenses, fuel_transactions, maintenance_costs
    - Date range: 2023-11-11 to 2025-11-11
    - Field changes: All modifications
  - System returns: 45,000 audit log records (2-year window)
  - Administrator exports to CSV for auditor review
  - Auditor can see:
    - Who made each change
    - When change was made
    - What changed (before/after values)
    - Why (reason field if populated)
  - Auditor uses for compliance verification

**A4: Real-Time Alert on Sensitive Operation**
- 6a. If real-time monitoring detects issue:
  - Alert: "SSO configuration modified by unknown admin user"
  - System immediately notifies administrator
  - Administrator reviews:
    - User: Mike Davis (unknown admin account?)
    - Actual: Account created during testing 6 months ago
    - Activity: Updated Azure AD SAML certificate (legitimate)
    - Issue: Mike's test account should have been deleted
  - Administrator:
    - Deactivates test account immediately
    - Reviews all changes made by test account
    - Audits all test accounts for cleanup
    - Schedules cleanup of unused test accounts

#### Exception Flows:

**E1: Audit Log Query Timeout (Too Much Data)**
- If query returns too many results:
  - Administrator searches: All log events for last year (365 days)
  - System attempts to return: 100+ million log records
  - Query times out after 5 minutes
  - Administrator refines search:
    - Narrows date range to 30 days
    - Adds user filter
    - Adds event type filter
    - Now returns: 5,000 records
    - Query completes in 3 seconds

**E2: Log Retention Exceeded, Older Records Archived**
- If records older than hot storage period:
  - Administrator searches: All logs from 2 years ago
  - System displays: "Records archived to cold storage"
  - Options:
    - Request restore from cold storage (2-4 hour wait)
    - Use pre-generated compliance reports (faster)
  - Administrator uses pre-generated 2-year compliance report
  - If need specific record, submits restore request
  - System restores record from cold storage within 4 hours

**E3: Sensitive Field Values Masked in Audit Log**
- If PII should not be displayed:
  - Audit log shows password change attempt
  - Old password: [MASKED]
  - New password: [MASKED]
  - System: Passwords never logged (security best practice)
  - Administrator can verify: Password changed, but value not stored
  - Protects against log file compromise exposing passwords

**E4: Audit Log Integrity Verification Fails**
- If tamper detection triggered:
  - System detects: Log record modified (integrity check failed)
  - Timestamp: 2025-10-15 (1 month old)
  - Change: User tried to modify historical record
  - System logs: Tamper attempt detected and blocked
  - Administrator receives alert: "Audit log tamper attempt"
  - Administrator investigates who tried to modify logs
  - Escalates to Security and Legal teams

#### Postconditions:
- Audit logs are reviewed for security and compliance
- Security incidents are identified and investigated
- Suspicious activities are tracked and escalated appropriately
- Compliance evidence is collected and archived
- Audit trails demonstrate system accountability
- Real-time monitoring detects anomalous activities
- All audit activities are logged (audit of audit)

#### Business Rules:
- BR-SA-057: All data modifications logged with user, timestamp, before/after values
- BR-SA-058: Authentication attempts logged (success and failure)
- BR-SA-059: Permission changes logged immediately
- BR-SA-060: System configuration changes logged with justification
- BR-SA-061: Audit logs retained for 7 years minimum (compliance)
- BR-SA-062: Audit logs encrypted at rest in storage
- BR-SA-063: Audit log tampering detected and alerted immediately

#### Related User Stories:
- US-SA-009: Security Audit Logging and Monitoring

---

### UC-SA-010: Manage System Security Compliance Dashboard

**Use Case ID**: UC-SA-010
**Use Case Name**: Manage System Security Compliance Dashboard
**Actor**: System Administrator (primary), Security Officer (secondary), Compliance Officer (secondary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Compliance monitoring framework is deployed
- Security scanning tools integrated (OWASP ZAP, Nessus)
- Compliance evidence collection system operational
- Reporting and export functions available

#### Trigger:
- Daily compliance posture review
- Quarterly compliance audit preparation
- Security certification (SOC 2, ISO 27001) maintenance
- Vulnerability scanning results review
- Failed compliance check requires remediation

#### Main Success Scenario:
1. System Administrator navigates to Compliance Dashboard
2. Administrator views overall compliance score:
   - SOC 2 Type II Compliance: 94/100 (Excellent)
   - ISO 27001 Compliance: 91/100 (Excellent)
   - HIPAA Compliance: N/A (Not applicable)
   - FedRAMP Moderate: 88/100 (Good)
3. Administrator reviews SOC 2 Trust Principles status:
   - **Principle 1: Security** (22/25 points)
     - User access controls: 5/5 ✓
     - Logical access restrictions: 5/5 ✓
     - Encryption standards: 4/5 (Minor gap: Some test data not encrypted)
     - Monitoring and logging: 5/5 ✓
     - Password requirements: 3/5 (Gap: 12-char minimum not enforced everywhere)

   - **Principle 2: Availability** (25/25 points) ✓
     - Uptime metrics: 99.95% SLA (exceeds 99.9% target)
     - Redundancy: Multi-region failover configured
     - Disaster recovery: RTO/RPO met

   - **Principle 3: Processing Integrity** (23/25 points)
     - Data validation: Comprehensive input validation ✓
     - Error detection: All errors logged ✓
     - Audit trail: Complete (Minor: Some API errors not logged)

   - **Principle 4: Confidentiality** (24/25 points)
     - Data classification: Complete mapping ✓
     - Encryption: In-transit and at-rest (Minor: Legacy API endpoint uses HTTP)

   - **Principle 5: Privacy** (25/25 points) ✓
     - Privacy policies: Documented and enforced ✓
     - Data retention: Configured per compliance rules ✓

4. Administrator reviews compliance gaps and remediation status:
   - **Gap #1: Test Data Encryption** (Priority: High)
     - Status: In Progress
     - Assigned to: Database team
     - Target date: 2025-11-30
     - Effort: 40 hours
     - Evidence: Encryption audit log will show all test data encrypted

   - **Gap #2: API Password Minimum Length** (Priority: Medium)
     - Status: Scheduled
     - Assigned to: Security team
     - Target date: 2025-12-15
     - Effort: 20 hours
     - Evidence: Password policy configuration updated

   - **Gap #3: API HTTP Endpoint Migration** (Priority: Medium)
     - Status: Planned
     - Assigned to: Infrastructure team
     - Target date: 2025-12-31
     - Effort: 60 hours
     - Evidence: All API traffic will use HTTPS

5. Administrator reviews password policy compliance:
   - Compliance metrics displayed:
     - Users with weak passwords: 0 (0%)
     - Users with expired passwords: 0 (0%)
     - MFA enrollment: 100% (850/850 required users)
     - Accounts inactive >90 days: 0 (monthly cleanup enforced)
     - Privileged accounts with MFA: 100% (45/45)
   - Status: All green ✓

6. Administrator reviews SSL certificate expiration status:
   - Primary certificate: Valid until 2026-11-15 (370 days remaining)
   - Backup certificate: Valid until 2026-05-20 (190 days remaining)
   - Alert threshold: 60 days before expiration
   - Next renewal: 2026-10-15 (scheduled)
   - Status: No action required

7. Administrator views vulnerability scan results (last 30 days):
   - Vulnerability scan date: 2025-11-10
   - OWASP ZAP scan results:
     - Critical vulnerabilities: 0 ✓
     - High vulnerabilities: 1 (SQL injection risk in legacy API)
       - Status: Mitigated (parameterized queries implemented)
       - Verification: Re-scan scheduled for 2025-11-15
     - Medium vulnerabilities: 3
     - Low vulnerabilities: 8
   - Trend: Vulnerability count decreasing (12 last month, 8 this month)

8. Administrator views threat and risk assessment status:
   - Last assessment: 2025-10-01
   - High-risk findings: 0 ✓
   - Medium-risk findings: 2
     - Risk #1: Third-party API integration (WEX) lacks rate limiting
       - Status: Mitigated (rate limiting implemented)
     - Risk #2: Employee access to database from non-corporate networks
       - Status: Monitoring (VPN requirement enforced)
   - Low-risk findings: 5

9. Administrator generates SOC 2 compliance report:
   - Report period: October 1, 2025 - November 10, 2025
   - Type: SOC 2 Type II (10-month audit period)
   - Evidence collected:
     - Access control procedures documented
     - Audit logs demonstrating enforcement
     - Change management records
     - Incident response documentation
     - Employee training records
     - Disaster recovery test results
10. Administrator schedules evidence collection for external auditor:
    - Meeting: 2025-12-01 with Big 4 audit firm
    - Documents to provide:
      - Policy documentation (40 pages)
      - Control evidence (500 log entries)
      - Testing results (test cases and outcomes)
      - Risk assessments
      - Remediation evidence
11. Administrator exports compliance dashboard as PDF report
12. Report sent to:
    - CISO (Chief Information Security Officer)
    - Compliance Officer
    - Executive Management
    - External auditors (upon request)

#### Alternative Flows:

**A1: Critical Vulnerability Detected**
- 7a. If high-risk vulnerability found:
  - Vulnerability scan detects: "Unpatched SQL injection in API endpoint"
  - Severity: Critical (10/10 CVSS score)
  - Administrator immediately:
    - Marks endpoint as "At Risk" in compliance dashboard
    - Disables vulnerable endpoint if possible
    - Escalates to development team
    - Creates incident ticket with 24-hour remediation deadline
  - Development team patches vulnerability
  - Compliance verification scan confirms fix
  - Vulnerability marked as "Resolved" in dashboard
  - Time to remediation: <4 hours

**A2: Compliance Check Fails - Remediation Started**
- 5a. If compliance requirement fails:
  - Password policy check: "5 users still have 90+ day old passwords"
  - Compliance: Failed (should be 0 users)
  - Administrator sends notification to users:
    - "Your password is 90+ days old - please reset immediately"
    - Link to password reset page
    - Deadline: 7 days
  - Monitor compliance over next 7 days
  - If not reset by deadline: Account suspended
  - Re-check in 8 days: All users now compliant

**A3: Annual SOC 2 Re-audit Preparation**
- 1a. If annual audit approaching:
  - Audit date: 2025-12-15 (34 days away)
  - Administrator reviews compliance checklist:
    - Policy updates: Complete
    - Training records: Current for all employees
    - Access control evidence: Collected and organized
    - Incident response: Documentation current
    - Disaster recovery: Annual test completed
    - Backup/restore: Monthly tests completed
  - Administrator identifies gap: "Annual disaster recovery test due"
  - Schedules test for 2025-11-20 (before audit)
  - Plans for full day system downtime: 2-3 hours
  - Notifies stakeholders of maintenance window

**A4: Export Compliance Evidence for Customer Audit**
- 12a. If customer requests compliance documentation:
  - Customer: "Can you provide SOC 2 evidence?"
  - Administrator exports:
    - SOC 2 audit report (auditor engagement letter + findings)
    - System architecture documentation
    - Access control procedures
    - Encryption standards documentation
    - Business continuity plan
    - Incident response procedures
  - Generates into secure PDF with watermark
  - Sends via encrypted channel
  - Tracks evidence delivery in compliance log

#### Exception Flows:

**E1: Compliance Check Cannot Complete (Tool Failure)**
- If compliance scanning tool fails:
  - OWASP ZAP scanner crashes during scan
  - Scan result: Failed to complete
  - Administrator notified of failure
  - Options:
    - Retry scan immediately (tool may have recovered)
    - Use previous scan results (if recent)
    - Escalate to security team for investigation
  - Administrator retries scan manually
  - Scan completes successfully

**E2: Compliance Evidence Incomplete for Audit**
- If auditor needs additional evidence:
  - Auditor requests: "Need weekly backup test logs for 12 months"
  - System only retains: Last 3 months of test logs
  - Administrator responds:
    - Provides available 3-month logs
    - Explains retention policy (3-month current, older archived)
    - Offers to retrieve archived logs (3-5 day turnaround)
    - Auditor accepts 3-month logs + archival recovery capability
  - Generates retrieval plan for archived logs if needed

**E3: False Positive in Vulnerability Scan**
- If scan detects non-existent vulnerability:
  - Vulnerability reported: "SQL injection in login form"
  - Administrator investigates
  - Login form uses parameterized queries (immune to SQL injection)
  - Conclusion: False positive due to tool limitation
  - Administrator:
    - Marks finding as "Verified False Positive"
    - Documents reason in compliance record
    - Configures scan tool to exclude this check
    - Retests to confirm
  - Finding removed from compliance dashboard

**E4: Compliance Requirement Conflict**
- If two requirements contradict:
  - SOC 2 requirement: Encrypt all sensitive data
  - Operational requirement: Search driver by SSN (requires plaintext)
  - Administrator consults with:
    - Security Officer
    - Compliance Officer
    - Auditors
  - Resolution: Use tokenization instead of plaintext
    - Store token in searchable field
    - SSN encrypted separately
    - Meets both security and operational needs

#### Postconditions:
- Compliance posture is clearly visible in dashboard
- Security gaps are identified and tracked for remediation
- Vulnerability scan results reviewed and addressed
- Compliance evidence is collected and organized for audits
- Remediation efforts tracked to completion
- Overall compliance score improving or maintained
- External audit readiness evaluated and communicated
- Security and compliance teams aligned on priorities

#### Business Rules:
- BR-SA-064: Compliance checks performed daily (automated)
- BR-SA-065: Critical vulnerabilities require remediation within 24 hours
- BR-SA-066: SOC 2 re-audit performed annually
- BR-SA-067: Compliance evidence archived for 7 years minimum
- BR-SA-068: MFA required for all privileged users (100% compliance)
- BR-SA-069: SSL certificates renewed 60 days before expiration
- BR-SA-070: Vulnerability scanning performed at least weekly

#### Related User Stories:
- US-SA-010: Security Compliance Dashboard

---

## Epic 5: System Monitoring and Operations

### UC-SA-011: Monitor System Health and Performance

**Use Case ID**: UC-SA-011
**Use Case Name**: Monitor System Health and Performance
**Actor**: System Administrator (primary), DevOps Engineer (secondary)
**Priority**: High

#### Preconditions:
- System Administrator is logged into admin portal
- Application Performance Monitoring (APM) system deployed (Azure Monitor, New Relic, etc.)
- Infrastructure monitoring tools operational (Azure Metrics, CloudWatch)
- Distributed tracing enabled across microservices
- Alerting system configured with notification channels

#### Trigger:
- Start of business day operations monitoring
- Performance degradation detected
- Scheduled maintenance or capacity planning
- Investigation of user-reported slowness
- Post-deployment verification

#### Main Success Scenario:
1. System Administrator navigates to System Health Dashboard at 8:00 AM
2. Administrator views overall system status:
   - Overall Status: **HEALTHY** (green)
   - Uptime: 99.97% (current month)
   - Last incident: 2025-11-08 (3 days ago, resolved)
3. Administrator reviews infrastructure metrics (real-time):
   - **Compute Resources**:
     - Web servers (10 instances): 45% CPU average
     - App servers (8 instances): 38% CPU average
     - Database server: 35% CPU, 2.1 GB memory
     - Cache server (Redis): 22% memory utilization
     - Message queue: 1,200 messages in queue (normal: 500-2000)

   - **Network**:
     - Inbound traffic: 85 Mbps (peak 1,200 Mbps)
     - Outbound traffic: 120 Mbps
     - API requests: 2,400 req/sec (healthy, below 10,000 peak)

   - **Disk**:
     - Database storage: 640 GB used of 1 TB allocated (64%)
     - Log storage: 120 GB used of 250 GB allocated (48%)
     - Cache: 8 GB used of 32 GB allocated (25%)

4. Administrator reviews application performance metrics:
   - **API Latency**:
     - P50 (median): 45 ms
     - P95: 250 ms
     - P99: 890 ms
     - Max: 3,200 ms
     - Trend: Stable (no increase vs yesterday)

   - **Page Load Times**:
     - Home page: 1.2 seconds
     - Dashboard: 1.8 seconds
     - Maps: 2.1 seconds
     - Reports: 2.5 seconds
     - All within SLA (<3 seconds)

   - **Database Performance**:
     - Query execution time (P95): 120 ms
     - Slow queries (>1 second): 5 queries in last hour
     - Connection pool: 85 of 100 connections in use (85%)
     - Deadlocks: 0 in last 24 hours

5. Administrator views dependency health:
   - **External APIs**:
     - Geotab telematics: 99.99% available ✓
     - WEX fuel card API: 99.98% available ✓
     - Google Maps: 100% available ✓
     - Weather API: 99.87% available ✓

   - **Internal Services**:
     - Authentication service: 99.99% ✓
     - Notification service: 99.97% ✓
     - File storage service: 99.99% ✓
     - Report generation: 99.94% ✓

6. Administrator views error rate metrics:
   - **Application Errors**:
     - 5xx server errors: 0 in last hour (0.000%)
     - 4xx client errors: 45 in last hour (0.002%)
     - Most common: 404 Not Found (old URL references)
     - No critical errors

   - **Unhandled Exceptions**: 0 in last 24 hours ✓

7. Administrator configures custom alerts:
   - Alert: CPU >80% on any server → Email admin@company.com
   - Alert: Response time P95 >500ms → Slack #ops channel
   - Alert: Error rate >0.1% → Email + PagerDuty
   - Alert: Database connections >90% → Email + PagerDuty
   - Alert: Disk usage >80% → Email (planning alert)

8. Administrator reviews recent alerts and trends:
   - Alert history (last 24 hours): 0 critical, 2 warning
   - Warning #1: Database connection pool at 87% (2:15 PM)
     - Duration: 8 minutes (brief spike during batch job)
     - Resolution: Automatic (batch job completed)
   - Warning #2: High error rate (0.08% at 3:45 PM)
     - Cause: Third-party API temporary unavailability
     - Resolution: Automatic (API recovered)

9. Administrator views capacity projections:
   - Current database growth: +15 GB per month
   - Current growth rate sustainable for: 24 months (1 TB capacity)
   - Projected scale: 200% growth in user base next year
   - Recommendation: Plan database upgrade 6 months ahead (2026-05)

10. Administrator reviews performance during peak hours:
    - Peak hour (11:00 AM): 4,200 requests/sec
    - Performance metrics at peak:
      - P95 latency: 280 ms (still healthy, well within SLA)
      - Error rate: 0.01% (excellent)
      - CPU: 72% average (comfortable headroom)
    - Peak hours well-managed, no scaling issues

11. Administrator exports performance report:
    - Daily summary: Generated at end of business hours
    - Metrics included: Uptime, latency, errors, capacity
    - Recipients: CTO, DevOps team, Operations Manager
    - Report format: PDF with charts and analysis

#### Alternative Flows:

**A1: Investigate Performance Degradation**
- 7a. If slowness detected:
  - Users report: "Dashboard is slow this morning"
  - Administrator checks dashboard latency: P95 = 1,200 ms (was 1.8s, now 4.2s)
  - Administrator drills down to identify root cause:
    - Check database query times: Slow query detected!
    - Specific query: Join on 5 large tables, no index optimization
    - Executed by report generation service
    - Frequency: Every 30 seconds as scheduled background job
  - Administrator investigates database:
    - Table scan on `vehicle_locations` (100 million rows)
    - Index missing on `timestamp` column
  - Administrator creates index:
    - Query execution time: 8 seconds → 200 ms
    - Dashboard latency returns to normal: 1.8 seconds
  - Problem resolved, performance restored

**A2: Monitor During Infrastructure Upgrade**
- 1a. If performing system upgrade:
  - Planned: Upgrade database from SQL Server 2019 to 2022
  - Maintenance window: 2025-11-15 11:00 PM - 1:00 AM
  - Administrator monitors:
    - Service availability during switchover
    - Data migration completion
    - Performance on new version
  - Monitoring during upgrade:
    - 11:05 PM: Backup started (5 min expected)
    - 11:10 PM: Backup completed
    - 11:12 PM: Service switched to new version
    - 11:15 PM: Connection tests passing
    - 11:18 PM: All services recovered
    - 11:25 PM: Performance baseline verified
  - Upgrade complete, zero downtime achieved

**A3: Identify Resource Bottleneck**
- 7a. If one resource consistently high utilization:
  - Administrator notices: Web server #3 consistently 92% CPU
  - Others: 45-55% CPU (healthy)
  - Investigate root cause:
    - Check running processes: Background job running on #3 only
    - Job: Batch report generation (every hour)
    - Fix: Distribute job across all servers (load balancing)
  - After fix: All servers 50% CPU during batch job
  - Utilization balanced across infrastructure

**A4: Prepare for Expected Load Spike**
- 1a. If known high-traffic event approaching:
  - Event: Monthly report generation (all users pull reports simultaneously)
  - Scheduled: 2025-11-15 at 8:00 AM
  - Projected load: 10x normal (from 2,400 to 24,000 req/sec)
  - Administrator prepares:
    - Scales infrastructure: Deploy 5 additional web servers
    - Optimizes queries: Indexes added to report tables
    - Caches common reports: Pre-compute and cache
    - Monitors closely: Additional alerts configured
  - Event day performance:
    - Peak load: 22,000 req/sec (within capacity)
    - P95 latency: 450 ms (still acceptable)
    - Error rate: 0.01% (excellent)
    - No incidents, event successful

#### Exception Flows:

**E1: Monitoring System Itself Fails**
- If monitoring tools become unavailable:
  - New Relic monitoring service down
  - Administrator detects: Dashboard shows "No data (last 15 min)"
  - System continues operating normally (monitoring failure isolated)
  - Administrator options:
    - Wait for monitoring service recovery (~5-15 min)
    - Switch to backup monitoring (Azure Monitor as backup)
    - Use basic system metrics (OS-level monitoring)
  - New Relic recovers after 8 minutes
  - Dashboard restored to normal operation
  - Post-incident: Review monitoring tool redundancy

**E2: Alert Storm (Too Many Alerts)**
- If too many simultaneous alerts fire:
  - Scenario: Cascading failures trigger 100+ alerts
  - Alert system flooded: Can't process notifications fast
  - Administrator receives bursts of alerts but loses visibility
  - Solution:
    - Alert aggregation: Group similar alerts
    - Alert deduplication: Single alert per issue (not repeated)
    - Alert severity filtering: Only show critical initially
  - Administrator tunes alert thresholds to reduce noise

**E3: Historical Data Unavailable**
- If long-term trends cannot be displayed:
  - Administrator tries to view: "Performance for last 6 months"
  - System shows: "Data only available for last 30 days"
  - Reason: Metrics retention set to 30 days (cost optimization)
  - Options:
    - Increase retention period (costs money)
    - Use pre-generated monthly reports (available in archives)
  - Administrator uses archived reports for historical view

**E4: Metric Accuracy Disputed**
- If metrics appear incorrect:
  - Performance dashboard shows: P95 latency 250 ms
  - User reports: "Page always takes 5+ seconds"
  - Discrepancy: Could be user network, client-side metrics, or tool issue
  - Administrator:
    - Checks APM: Confirms 250 ms server response time
    - Checks client-side: Confirms 4.5 sec page load time (includes client rendering)
    - Conclusion: Server is fast, client-side rendering is bottleneck
    - Optimization needed: JavaScript/rendering optimization, not server

#### Postconditions:
- System health status is clearly visible
- Performance metrics confirm healthy operation
- Alerts notify administrators of issues
- Capacity planning informed by growth trends
- Performance degradation quickly identified and investigated
- Infrastructure optimized for current and projected load
- System operates within established SLAs

#### Business Rules:
- BR-SA-071: System monitoring dashboard updated every 30 seconds (real-time)
- BR-SA-072: Critical metrics tracked: CPU, memory, disk, latency, error rate, uptime
- BR-SA-073: SLA targets: 99.9% uptime, <3 sec page load, <100 ms API latency
- BR-SA-074: Performance alerts fired when metrics exceed thresholds
- BR-SA-075: Metrics retained: 30 days hot storage, 7 years cold storage
- BR-SA-076: Daily performance reports generated automatically
- BR-SA-077: Capacity planning review conducted quarterly

#### Related User Stories:
- US-SA-011: System Health and Performance Monitoring

---

### UC-SA-012: Manage Tenant Usage and Billing

**Use Case ID**: UC-SA-012
**Use Case Name**: Manage Tenant Usage and Billing
**Actor**: System Administrator (primary), Finance Manager (secondary)
**Priority**: Medium

#### Preconditions:
- System Administrator is logged into admin portal
- Multi-tenant system with usage tracking enabled
- Billing module configured with pricing models
- Usage aggregation and reporting system operational
- Tenant billing integration with Stripe/payment processor

#### Trigger:
- Monthly billing cycle (1st of each month)
- Tenant requests usage information
- Billing dispute requires investigation
- Pricing adjustment required
- Tenant upgrade/downgrade requested

#### Main Success Scenario:
1. System Administrator navigates to Tenant Usage and Billing Dashboard
2. Administrator views overall tenant metrics (all 42 tenants):
   - Total active vehicles: 12,450 across all tenants
   - Total active users: 3,890 across all tenants
   - Total monthly API calls: 8.5 billion
   - Total monthly storage: 3.2 TB
   - Billing forecast: $245,000 total monthly revenue

3. Administrator reviews individual tenant: "SafeHaul Logistics"
4. System displays tenant usage summary:
   - **Active vehicles**: 215 vehicles
   - **Active users**: 45 users
   - **Monthly API calls**: 125 million calls
   - **Storage used**: 42 GB
   - **Plan type**: Standard - $99/vehicle/month
   - **Billing status**: Current (paid on 2025-11-03)

5. Administrator views detailed usage breakdown for SafeHaul:
   - **API call usage**:
     - Vehicle data: 45 million (36%)
     - GPS updates: 55 million (44%)
     - Incident reports: 15 million (12%)
     - Other endpoints: 10 million (8%)
     - Daily average: 4.2 million calls
     - Usage trend: Stable month-over-month

   - **Feature usage**:
     - Real-time tracking: High (94% of daily active time)
     - Route optimization: Medium (42% usage)
     - Safety analytics: High (78% usage)
     - Advanced reporting: Low (8% usage)

   - **User activity**:
     - Daily active users: 35 of 45 (78%)
     - Peak concurrent users: 12 (simultaneous)
     - Least used feature: Custom API (only 2 users)

6. Administrator views SafeHaul billing details:
   - **Pricing plan**: Standard - 215 vehicles @ $99/vehicle = $21,285/month
   - **Current usage month**: October 1 - October 31, 2025
   - **Billing charges breakdown**:
     - Base vehicles (215): $21,285.00
     - API overage (125M calls): $0 (included in plan, no overage)
     - Storage (42 GB): $0 (included in plan, no additional charges)
     - Total: $21,285.00

   - **Previous month comparison** (September):
     - Base vehicles: 210 @ $99 = $20,790.00 (5 new vehicles added)
     - Month-over-month growth: 0.5% (1 vehicle per month average)

7. Administrator projects tenant growth and upsell opportunities:
   - SafeHaul growth rate: 1.2% per month
   - Projected vehicles in 12 months: 229 vehicles (+14)
   - Projected monthly revenue: $22,671 (+$1,386/month)
   - Upsell opportunity: Advanced reporting module (currently 8% usage)
     - Potential value: $2,000/month if engaged
     - Recommendation: Outreach to customer

8. Administrator views all tenants sorted by usage/revenue:
   - **Top 5 tenants by revenue**:
     1. Northeast Logistics (650 vehicles): $64,350/month
     2. SafeHaul Logistics (215 vehicles): $21,285/month
     3. CapitalTech Alliance (187 vehicles): $18,513/month
     4. Florida Transport (156 vehicles): $15,444/month
     5. GreenRoute Delivery (142 vehicles): $14,058/month

   - **Total top 5 revenue**: $133,650 (54.6% of total)
   - **Remaining 37 tenants**: $111,350 (45.4% of total)

9. Administrator reviews billing exceptions and disputes:
   - **Outstanding invoices**: 0 (all current)
   - **Disputed invoices**: 1
     - Tenant: MidState Logistics
     - Amount: $12,450 (November billing)
     - Issue: Claims to have only 120 vehicles, billed for 125
     - Status: Investigating

10. Administrator investigates MidState dispute:
    - Check actual vehicle records: 125 vehicles confirmed active in November
    - Check October records: 120 vehicles in October (5 added during month)
    - Proration calculation:
      - Oct vehicles (120 @ $99): $11,880
      - New vehicles added Nov 1-5 (5 vehicles): $412.50 prorated
      - Total: $12,292.50 (matches billing)
    - Administrator finds: Customer misremembered vehicle count
    - Administrator sends clarification email with vehicle breakdown

11. Administrator configures November billing cycle:
    - Billing date: 2025-11-01 (today)
    - Billing period: October 1 - October 31, 2025
    - Calculation method: Vehicle count as of 2025-10-31 at 11:59 PM
    - Invoice generation: Run now
    - Payment collection: Attempt October 31 + November 1-3 retries

12. System generates invoices:
    - Invoices created: 42 tenants
    - Total revenue: $247,340 (this month)
    - Invoices emailed to: Finance@each-tenant-domain
    - Payment processor: Stripe (automatic collection)

13. Administrator monitors payment collection:
    - Successful payments: 40 tenants within 24 hours
    - Pending payments: 2 tenants (payment in progress)
    - Failed payments: 0 (excellent payment success rate)
    - Collection rate: 100% historical (excellent)

14. Administrator sets up billing alerts:
    - Alert: Tenant usage increase >50% month-over-month
    - Alert: Tenant payment failure (retry exhausted)
    - Alert: Tenant approaching storage quota (>90% used)
    - Alert: Tenant new feature adoption (enables marketing outreach)

15. Administrator generates monthly billing report:
    - Report date: 2025-11-01
    - Total tenant revenue: $247,340
    - Invoice count: 42
    - Payment success rate: 100%
    - Billing metrics for finance team email

#### Alternative Flows:

**A1: Tenant Requests Downgrade**
- 2a. If tenant wants to reduce features:
  - Tenant: "We want to move from Standard to Basic plan"
  - Basic plan: $49/vehicle/month (vs $99 for Standard)
  - Vehicles: 215 vehicles
  - Monthly savings: $10,750
  - Downgrade effective: 2025-12-01 (next billing cycle)
  - Administrator configures downgrade:
    - Marks downgrade in system
    - Effective date: 2025-12-01
    - Features disabled: Advanced reporting, custom API (Basic plan)
    - Pro-rate: Credit 1/2 month difference for remainder of November
  - Next invoice (Dec 1): 215 @ $49 = $10,535

**A2: Tenant Requests Custom Pricing**
- 2a. If large enterprise tenant negotiates:
  - Tenant: "We want 500 vehicle package with 20% discount"
  - Standard pricing: 500 @ $99 = $49,500/month
  - Requested: 500 @ $79.20 = $39,600/month
  - Enterprise discount: 20% (justified by volume)
  - Administrator creates custom contract:
    - Custom pricing: $79.20/vehicle/month
    - Effective: 2025-12-01 to 2026-11-30 (1-year term)
    - Auto-renewal: Standard pricing unless renegotiated
  - Billing system updated with custom pricing
  - New invoice: $39,600/month (with approval)

**A3: Calculate Trial Tenant Promotion**
- 2a. If new tenant needs free trial:
  - New tenant: Northeast Logistics Demo
  - Plan: Free trial for 30 days (up to 50 vehicles)
  - Start: 2025-11-01
  - End: 2025-11-30
  - Conversion: If converted to paid by Nov 30, charges begin Dec 1
  - Administrator configures:
    - Trial period set to auto-disable account Dec 1 if not converted
    - Conversion reminder email sent Nov 20, Nov 25, Nov 29
    - Billing flag: No charges for November

**A4: Investigate Unusual Usage Spike**
- 3a. If tenant usage abnormal:
  - Alert: "MidState Logistics API calls jumped 400% this month"
  - Normal: 8 million calls/month
  - This month: 32 million calls/month (4x normal)
  - Administrator investigates:
    - Check for system changes: No (usage same endpoints)
    - Check for new features: No new features enabled
    - Check for integration changes: No API integrations changed
    - Contact tenant: "We added new warehouse locations, increased vehicle count"
    - Actual issue: 4 new warehouses, 50 new vehicles (not yet updated in billing)
  - Resolution: Confirm vehicle count increase, adjust billing

#### Exception Flows:

**E1: Payment Processor Unavailable**
- If Stripe payment processing fails:
  - Billing run scheduled for 2025-11-01 at 2:00 AM
  - Stripe API unreachable
  - Payment collection fails
  - Administrator notified: "Payment processing failed"
  - System retries: Every 1 hour for 24 hours
  - After 24 hours: Manual intervention required
  - Administrator contacts Stripe support
  - Stripe restored after 4 hours
  - Payment collection resumed
  - Late payment fees waived for tenants

**E2: Tenant Disputes Billing Amount**
- If tenant claims incorrect bill:
  - Tenant: "We were charged for 200 vehicles but only have 150"
  - Administrator audits:
    - Check billing system: 200 vehicles recorded
    - Check actual vehicle count: 150 vehicles active
    - Discrepancy: 50 vehicle billing error (high impact)
  - Investigation:
    - Check historical records: 150-160 vehicles normal range
    - Check vehicle deactivation logs: 50 vehicles deleted Nov 1 (not processed for billing)
    - Issue: Deleted vehicles still counted in billing
  - Resolution:
    - Refund: 50 vehicles x $99 = $4,950 credit
    - System fix: Exclude deleted vehicles from billing calculations
    - Future months: Billing calculated correctly

**E3: Billing System Cannot Calculate Usage (Data Issue)**
- If usage data is corrupted:
  - Billing calculation starts for November
  - System cannot retrieve API call counts (data missing)
  - Billing run fails: "Usage data unavailable"
  - Options:
    - Defer billing 1 day (recover data)
    - Estimate usage based on average (risky)
    - Calculate billing manually (time-consuming)
  - Administrator defers billing 1 day
  - Data recovered from backup
  - Billing run succeeds next day (1-day delay)

**E4: Tenant Currency/Pricing Conversion**
- If tenant in non-US currency:
  - Tenant: "We need invoices in EUR, not USD"
  - Pricing: $99/vehicle in USD
  - Exchange rate: 1 USD = 0.92 EUR
  - Converted pricing: EUR 90.85/vehicle
  - Administrator:
    - Creates EUR pricing variant
    - Sets exchange rate (updated daily from external source)
    - Invoices generated in EUR for this tenant
    - Payment collected in EUR (Stripe handles conversion)

#### Postconditions:
- Monthly tenant billing is accurate and timely
- Usage metrics provide insights for product management
- Payment collection successful
- Billing disputes resolved
- Tenant communication clear and transparent
- Revenue forecast accurate
- Upsell opportunities identified
- Billing compliance maintained

#### Business Rules:
- BR-SA-078: Monthly billing run on 1st of each month
- BR-SA-079: Vehicle count measured as of last day of billing month
- BR-SA-080: Pro-ration calculated for mid-month changes (additions/deletions)
- BR-SA-081: Payment retry attempted 3 times over 3 days before failure
- BR-SA-082: Usage overages subject to plan-specific limits
- BR-SA-083: Custom pricing requires management approval
- BR-SA-084: Billing disputes investigated and resolved within 5 business days

#### Related User Stories:
- US-SA-012: Tenant Usage Analytics and Billing

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 12
- **High Priority**: 8 use cases
- **Medium Priority**: 4 use cases
- **Low Priority**: 0 use cases

### Epic Distribution:
1. **User and Role Management**: 3 use cases (UC-SA-001, UC-SA-002, UC-SA-003)
2. **System Configuration and Integration**: 3 use cases (UC-SA-004, UC-SA-005, UC-SA-006)
3. **Data Backup and Recovery**: 2 use cases (UC-SA-007, UC-SA-008)
4. **Security and Audit Logging**: 2 use cases (UC-SA-009, UC-SA-010)
5. **System Monitoring and Operations**: 2 use cases (UC-SA-011, UC-SA-012)

### Key System Administration Capabilities:
- **User Management**: Account provisioning, role assignment, bulk import/export, deactivation
- **RBAC Configuration**: Custom roles, granular permissions, location-based access, data restrictions
- **Multi-Tenant Setup**: Tenant creation, branding, feature flags, data isolation, billing configuration
- **SSO Integration**: SAML 2.0, OAuth 2.0, JIT provisioning, multi-provider support
- **API Management**: Key generation, rate limiting, IP whitelisting, webhook configuration
- **Third-Party Integrations**: Telematics, fuel cards, ERP systems, data mapping, sync scheduling
- **Backup & Disaster Recovery**: Automated backups, geo-redundancy, point-in-time restore, encryption
- **Security & Audit**: Comprehensive audit logging, compliance monitoring, vulnerability scanning
- **System Monitoring**: Real-time health dashboard, performance metrics, capacity planning
- **Usage & Billing**: Tenant usage tracking, pricing models, invoicing, revenue forecasting

### Integration Points:
- **Identity & Access**: Azure AD, Okta, OneLogin, SAML 2.0
- **Data Management**: Azure Backup, Azure SQL, Key Vault, Blob Storage
- **Monitoring**: Azure Monitor, New Relic, Application Insights
- **Security**: OWASP ZAP, Nessus, Azure Security Center
- **Payment**: Stripe, Chargebee, custom billing engines
- **Third-Party APIs**: 20+ pre-built integrations supported

---

## Related Documents

- **User Stories**: `user-stories/07_SYSTEM_ADMINISTRATOR_USER_STORIES.md`
- **Test Cases**: `test-cases/07_SYSTEM_ADMINISTRATOR_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/07_SYSTEM_ADMINISTRATOR_WORKFLOWS.md` (to be created)
- **Admin Portal Mockups**: `mockups/admin-portal/` (to be created)
- **API Documentation**: `api/admin-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | Requirements Team | Initial system administrator use cases created |

---

*This document provides comprehensive use case scenarios supporting the System Administrator user stories and administrative workflows.*
