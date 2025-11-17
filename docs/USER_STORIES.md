# Fleet Management System - User Stories & Acceptance Criteria

**Version:** 1.0.0
**Date:** 2025-11-09
**Project:** Enterprise Fleet Management System

---

## Table of Contents

1. [Overview](#overview)
2. [Epic: Authentication & Security](#epic-authentication--security)
3. [Epic: Vehicle Management](#epic-vehicle-management)
4. [Epic: Maintenance Operations](#epic-maintenance-operations)
5. [Epic: Driver Management](#epic-driver-management)
6. [Epic: Reporting & Analytics](#epic-reporting--analytics)
7. [Epic: Vendor Management](#epic-vendor-management)
8. [Epic: Safety & Compliance](#epic-safety--compliance)
9. [Non-Functional Requirements](#non-functional-requirements)

---

## Overview

This document contains user stories and acceptance criteria for the Fleet Management System. Stories are organized by epic and prioritized using MoSCoW method (Must Have, Should Have, Could Have, Won't Have).

### Story Format

**User Story Template:**
```
As a [role]
I want [feature/capability]
So that [business value/benefit]
```

**Priority Levels:**
- 🔴 **P0 - Critical:** Must have for MVP
- 🟠 **P1 - High:** Important for launch
- 🟡 **P2 - Medium:** Should have post-launch
- 🟢 **P3 - Low:** Nice to have

**Story Status:**
- ✅ Complete
- 🚧 In Progress
- 📋 Planned
- ⏸️ Deferred

---

## Epic: Authentication & Security

### Story 1.1: User Login with Email/Password ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to log in securely using my email and password
So that I can access the fleet management system with proper authentication
```

**Acceptance Criteria:**

✅ **AC 1.1.1:** User can navigate to login page at `/login`
- GIVEN I navigate to the application root
- WHEN the page loads
- THEN I am redirected to `/login` if not authenticated

✅ **AC 1.1.2:** User can enter credentials
- GIVEN I am on the login page
- WHEN I enter my email address and password
- THEN the form accepts valid email format
- AND password field masks characters

✅ **AC 1.1.3:** Successful authentication
- GIVEN I enter valid credentials (admin@demofleet.com / Demo@123)
- WHEN I click "Login"
- THEN I receive a JWT token
- AND I am redirected to the dashboard
- AND the token is stored securely

✅ **AC 1.1.4:** Failed authentication handling
- GIVEN I enter invalid credentials
- WHEN I click "Login"
- THEN I see an error message "Invalid credentials"
- AND I remain on the login page
- AND my failed attempt is logged

✅ **AC 1.1.5:** Account lockout after failed attempts
- GIVEN I have failed to login 3 times
- WHEN I attempt to login again
- THEN I see "Account locked due to multiple failed login attempts"
- AND I cannot login for 30 minutes
- AND I am shown when the account will unlock

**Technical Notes:**
- Implementation: `/api/src/routes/auth.ts` (lines 98-234)
- JWT expiration: 24 hours
- Password hashing: bcrypt (10 rounds)
- Audit logging: All login attempts recorded

---

### Story 1.2: Microsoft Single Sign-On (SSO) 📋
**Priority:** 🟡 P2 - Medium
**Status:** 📋 Planned

**User Story:**
```
As a fleet manager
I want to log in using my Microsoft/Azure AD account
So that I can use single sign-on and don't need a separate password
```

**Acceptance Criteria:**

📋 **AC 1.2.1:** Microsoft sign-in button visible
- GIVEN I am on the login page
- WHEN the page loads
- THEN I see a "Sign in with Microsoft" button
- AND it displays the Microsoft logo

📋 **AC 1.2.2:** Redirect to Microsoft login
- GIVEN I click "Sign in with Microsoft"
- WHEN the request is processed
- THEN I am redirected to Microsoft's login page
- AND the redirect URI is `https://fleet.capitaltechalliance.com/auth/callback`

📋 **AC 1.2.3:** Successful Microsoft authentication
- GIVEN I successfully authenticate with Microsoft
- WHEN I am redirected back to the application
- THEN my user account is created or updated
- AND I receive a JWT token
- AND I am redirected to the dashboard

📋 **AC 1.2.4:** Handle Microsoft auth errors
- GIVEN Microsoft authentication fails
- WHEN I am redirected back with an error
- THEN I see a user-friendly error message
- AND I can retry or use email/password login

**Technical Notes:**
- Currently disabled due to TypeScript errors
- Files: `api/src/routes/microsoft-auth.ts.disabled`
- Azure AD Client ID: 80fe6628-1dc4-41fe-894f-919b12ecc994
- Requires fixing Request type definitions

---

### Story 1.3: Role-Based Access Control (RBAC) ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a system administrator
I want users to have role-based permissions
So that users can only access features appropriate for their role
```

**Acceptance Criteria:**

✅ **AC 1.3.1:** User roles defined
- GIVEN the system has user roles
- WHEN a user is created
- THEN they must be assigned one of: admin, fleet_manager, driver, technician, viewer

✅ **AC 1.3.2:** Admin full access
- GIVEN I am logged in as admin
- WHEN I navigate through the application
- THEN I can access all features
- AND I can create/edit/delete all resources

✅ **AC 1.3.3:** Fleet manager access
- GIVEN I am logged in as fleet_manager
- WHEN I navigate through the application
- THEN I can manage vehicles, drivers, and maintenance
- AND I can view reports
- BUT I cannot manage users or system settings

✅ **AC 1.3.4:** Technician limited access
- GIVEN I am logged in as technician
- WHEN I navigate through the application
- THEN I can view and update work orders
- AND I can view vehicle information
- BUT I cannot create new vehicles or drivers

✅ **AC 1.3.5:** API endpoint protection
- GIVEN I attempt to access a protected API endpoint
- WHEN I send a request without proper role
- THEN I receive a 403 Forbidden response
- AND the attempt is logged

**Technical Notes:**
- Implementation: `api/src/middleware/auth.ts`
- Roles stored in JWT token
- Database field: `users.role`

---

## Epic: Vehicle Management

### Story 2.1: View Vehicle Dashboard ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to view a dashboard of all vehicles
So that I can see the overall status of my fleet at a glance
```

**Acceptance Criteria:**

✅ **AC 2.1.1:** Dashboard displays key metrics
- GIVEN I navigate to the dashboard
- WHEN the page loads
- THEN I see total vehicle count
- AND I see active vehicles count
- AND I see vehicles in maintenance count
- AND I see total fuel cost for the month

✅ **AC 2.1.2:** Vehicle list table
- GIVEN I am viewing the dashboard
- WHEN I scroll to the vehicle list
- THEN I see a sortable table with columns: Vehicle Number, Make/Model, Year, Status, Mileage, Location
- AND I can sort by any column
- AND I can search/filter vehicles

✅ **AC 2.1.3:** Interactive map view
- GIVEN I am viewing the dashboard
- WHEN I look at the map section
- THEN I see an Azure Map displaying vehicle locations
- AND each vehicle is marked with a pin
- AND I can click a pin to see vehicle details

✅ **AC 2.1.4:** Real-time status updates
- GIVEN I am viewing the dashboard
- WHEN vehicle data changes
- THEN the display updates within 30 seconds
- AND status badges reflect current state

**Technical Notes:**
- Implementation: `src/components/modules/FleetDashboard.tsx`
- Azure Maps integration
- Real-time updates via polling (30s interval)

---

### Story 2.2: Add New Vehicle ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to add a new vehicle to the system
So that I can track and manage it as part of my fleet
```

**Acceptance Criteria:**

✅ **AC 2.2.1:** Access add vehicle form
- GIVEN I am on the vehicles page
- WHEN I click "Add Vehicle" button
- THEN a modal/form appears with all required fields

✅ **AC 2.2.2:** Required fields validation
- GIVEN I am filling out the add vehicle form
- WHEN I attempt to submit without required fields
- THEN I see validation errors highlighting: VIN, Make, Model, Year, License Plate
- AND the form does not submit

✅ **AC 2.2.3:** VIN uniqueness validation
- GIVEN I enter a VIN that already exists
- WHEN I submit the form
- THEN I see an error "Vehicle with this VIN already exists"
- AND the form does not submit

✅ **AC 2.2.4:** Successful vehicle creation
- GIVEN I enter all valid information
- WHEN I submit the form
- THEN the vehicle is created with a unique ID
- AND I see a success message
- AND the vehicle appears in the vehicle list
- AND I am redirected to the vehicle details page

✅ **AC 2.2.5:** Multi-tenant isolation
- GIVEN I create a vehicle
- WHEN the vehicle is saved
- THEN it is associated with my tenant_id
- AND other tenants cannot see or access this vehicle

**Technical Notes:**
- API Endpoint: `POST /api/vehicles`
- Implementation: `api/src/routes/vehicles.ts`
- Database table: `vehicles`

---

### Story 2.3: Track Vehicle Location ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to see vehicle locations on a map
So that I can track where my vehicles are in real-time
```

**Acceptance Criteria:**

✅ **AC 2.3.1:** Map displays all vehicle locations
- GIVEN I navigate to the fleet dashboard
- WHEN I view the map
- THEN I see pins for all active vehicles
- AND each pin shows the vehicle number

✅ **AC 2.3.2:** Vehicle pin details
- GIVEN I am viewing the map
- WHEN I click on a vehicle pin
- THEN I see a popup with: Vehicle Number, Make/Model, Current Status, Last Updated
- AND I can click "View Details" to see full vehicle information

✅ **AC 2.3.3:** Map controls
- GIVEN I am viewing the map
- WHEN I interact with the map
- THEN I can zoom in/out
- AND I can pan/drag the map
- AND I can toggle between map/satellite view

✅ **AC 2.3.4:** Location accuracy indicator
- GIVEN a vehicle has a GPS location
- WHEN I view the pin
- THEN I see the timestamp of the last location update
- AND locations older than 1 hour are marked with a different color

**Technical Notes:**
- Azure Maps subscription key configured
- Implementation: `src/components/modules/AzureMap.tsx`
- Location updates stored in `vehicles.current_location` (JSONB)

---

## Epic: Maintenance Operations

### Story 3.1: Create Recurring Maintenance Schedule ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to create recurring maintenance schedules
So that preventive maintenance is automatically tracked and work orders are generated
```

**Acceptance Criteria:**

✅ **AC 3.1.1:** Access schedule creation
- GIVEN I am on the maintenance schedules page
- WHEN I click "Create Recurring Schedule"
- THEN a dialog appears with schedule configuration options

✅ **AC 3.1.2:** Select recurrence type
- GIVEN I am creating a schedule
- WHEN I select recurrence type
- THEN I can choose from: Time-based, Mileage-based, Engine Hours-based, Combined
- AND the form updates to show relevant fields

✅ **AC 3.1.3:** Time-based schedule configuration
- GIVEN I select "Time-based" recurrence
- WHEN I configure the schedule
- THEN I can set interval value (number)
- AND I can set interval unit (days, weeks, months)
- AND I can set the first due date

✅ **AC 3.1.4:** Mileage-based schedule configuration
- GIVEN I select "Mileage-based" recurrence
- WHEN I configure the schedule
- THEN I can set mileage interval (e.g., 5000 miles)
- AND the schedule tracks vehicle odometer readings
- AND work orders generate when mileage threshold is reached

✅ **AC 3.1.5:** Work order template configuration
- GIVEN I am creating a recurring schedule
- WHEN I configure the work order template
- THEN I can set: Priority, Estimated Cost, Assigned Technician, Description
- AND I can add required parts as a list
- AND this template is used for all auto-generated work orders

✅ **AC 3.1.6:** Successful schedule creation
- GIVEN I complete all required fields
- WHEN I submit the form
- THEN the schedule is created with `is_recurring = true`
- AND I see a success message
- AND the schedule appears in the recurring schedules list

**Technical Notes:**
- Implementation: `api/src/services/recurring-maintenance.ts`
- Database migration: `003-recurring-maintenance.sql`
- Frontend: `src/components/modules/RecurringScheduleDialog.tsx`

---

### Story 3.2: Automatic Work Order Generation ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want work orders to be automatically generated from recurring schedules
So that I don't have to manually create repetitive maintenance tasks
```

**Acceptance Criteria:**

✅ **AC 3.2.1:** Scheduler runs on schedule
- GIVEN the system is running
- WHEN the cron job executes (every hour)
- THEN the maintenance scheduler processes all active recurring schedules
- AND I can see scheduler execution in logs

✅ **AC 3.2.2:** Due schedules identified
- GIVEN a recurring schedule has reached its due date
- WHEN the scheduler runs
- THEN the schedule is identified as due
- AND a work order is created automatically

✅ **AC 3.2.3:** Work order created from template
- GIVEN a work order is auto-generated
- WHEN I view the work order
- THEN it includes: Service Type, Priority, Estimated Cost, Assigned Technician, Description, Required Parts
- AND all values match the schedule template
- AND the work order is linked to the schedule

✅ **AC 3.2.4:** Next due date calculated
- GIVEN a work order has been generated
- WHEN the schedule is updated
- THEN `next_due` is recalculated based on recurrence pattern
- AND `last_work_order_created_at` is updated
- AND the schedule is ready for the next cycle

✅ **AC 3.2.5:** Scheduler history tracked
- GIVEN work orders are auto-generated
- WHEN I view schedule history
- THEN I see a log of all generated work orders
- AND each entry shows: Execution Type, Work Order ID, Created Date, Status
- AND any errors are logged

✅ **AC 3.2.6:** Notifications sent
- GIVEN a work order is auto-generated
- WHEN the creation completes
- THEN assigned technicians receive a notification
- AND fleet managers receive a summary
- AND notifications are logged in `maintenance_notifications`

**Technical Notes:**
- Scheduler: `api/src/jobs/maintenance-scheduler.ts`
- Cron schedule: `0 * * * *` (every hour)
- Function: `processRecurringSchedules()`

---

### Story 3.3: View Maintenance Schedule History ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to view the history of work orders generated from a recurring schedule
So that I can track maintenance patterns and ensure schedules are working correctly
```

**Acceptance Criteria:**

✅ **AC 3.3.1:** Access schedule history
- GIVEN I am viewing a recurring schedule
- WHEN I click "View History"
- THEN I see a chronological list of all generated work orders

✅ **AC 3.3.2:** History details displayed
- GIVEN I am viewing schedule history
- WHEN I look at each history entry
- THEN I see: Date Created, Work Order ID, Execution Type, Mileage at Creation, Status
- AND I can click the Work Order ID to view full details

✅ **AC 3.3.3:** Filter and search history
- GIVEN I am viewing schedule history
- WHEN I use filters
- THEN I can filter by: Date Range, Status (Success/Failed/Skipped), Execution Type
- AND I can search by Work Order ID

✅ **AC 3.3.4:** Error tracking
- GIVEN a work order generation failed
- WHEN I view the history
- THEN I see the error entry with status "failed"
- AND I can see the error message
- AND I can manually retry generation

**Technical Notes:**
- Database table: `maintenance_schedule_history`
- API Endpoint: `GET /api/maintenance-schedules/:id/history`

---

### Story 3.4: Manual Work Order Creation ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a technician
I want to create one-time work orders for unscheduled repairs
So that I can track ad-hoc maintenance work
```

**Acceptance Criteria:**

✅ **AC 3.4.1:** Access work order form
- GIVEN I am on the work orders page
- WHEN I click "Create Work Order"
- THEN a form appears with all required fields

✅ **AC 3.4.2:** Required fields
- GIVEN I am creating a work order
- WHEN I fill out the form
- THEN I must provide: Vehicle, Service Type, Priority, Description
- AND I can optionally add: Assigned Technician, Estimated Cost, Due Date, Parts

✅ **AC 3.4.3:** Work order created successfully
- GIVEN I complete all required fields
- WHEN I submit the form
- THEN the work order is created with status "pending"
- AND I see a success message
- AND the work order appears in the work orders list

✅ **AC 3.4.4:** Work order assignment notification
- GIVEN I assign a work order to a technician
- WHEN the work order is created
- THEN the assigned technician receives a notification
- AND the work order appears in their queue

**Technical Notes:**
- API Endpoint: `POST /api/work-orders`
- Implementation: `api/src/routes/work-orders.ts`

---

## Epic: Driver Management

### Story 4.1: View Driver Profiles ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to view detailed driver profiles
So that I can manage driver information and track their assignments
```

**Acceptance Criteria:**

✅ **AC 4.1.1:** Driver list displayed
- GIVEN I navigate to the drivers page
- WHEN the page loads
- THEN I see a table of all drivers with: Name, Employee ID, License Number, Status, Current Assignment

✅ **AC 4.1.2:** View driver details
- GIVEN I am viewing the driver list
- WHEN I click on a driver
- THEN I see full profile including: Contact Information, License Details, Employment Info, Vehicle Assignment, Performance Metrics

✅ **AC 4.1.3:** Driver search and filter
- GIVEN I am on the drivers page
- WHEN I use the search box
- THEN I can search by: Name, Employee ID, License Number
- AND I can filter by: Status (Active/Inactive), Current Assignment

✅ **AC 4.1.4:** Driver status indicators
- GIVEN I am viewing drivers
- WHEN I look at the status column
- THEN I see color-coded badges: Active (green), On Leave (yellow), Inactive (gray)

**Technical Notes:**
- API Endpoint: `GET /api/drivers`
- Implementation: `src/components/modules/DriverPerformance.tsx`

---

### Story 4.2: Track Driver Performance ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to track driver performance metrics
So that I can identify top performers and areas for improvement
```

**Acceptance Criteria:**

✅ **AC 4.2.1:** Performance metrics displayed
- GIVEN I view a driver's profile
- WHEN I navigate to the performance section
- THEN I see: Safety Score, Fuel Efficiency, On-Time Delivery Rate, Total Miles Driven

✅ **AC 4.2.2:** Safety incidents tracked
- GIVEN a driver has safety incidents
- WHEN I view their performance
- THEN I see a count and list of incidents
- AND each incident shows: Date, Type, Severity, Description

✅ **AC 4.2.3:** Performance trends
- GIVEN a driver has historical data
- WHEN I view performance
- THEN I see trend charts for: Safety Score (monthly), Fuel Efficiency (monthly)
- AND I can compare to fleet average

✅ **AC 4.2.4:** Performance alerts
- GIVEN a driver's performance drops below threshold
- WHEN metrics are updated
- THEN the driver's profile shows a warning badge
- AND fleet managers receive a notification

**Technical Notes:**
- Database tables: `drivers`, `safety_incidents`, `fuel_transactions`
- Metrics calculated via SQL aggregations

---

## Epic: Reporting & Analytics

### Story 5.1: Fleet Dashboard Overview ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to see a comprehensive dashboard of fleet operations
So that I can make informed decisions about my fleet
```

**Acceptance Criteria:**

✅ **AC 5.1.1:** Key performance indicators (KPIs)
- GIVEN I navigate to the dashboard
- WHEN the page loads
- THEN I see KPI cards displaying: Total Vehicles, Active Vehicles, In Maintenance, Total Monthly Fuel Cost
- AND each KPI shows trend vs previous period

✅ **AC 5.1.2:** Maintenance overview
- GIVEN I am viewing the dashboard
- WHEN I look at the maintenance section
- THEN I see: Upcoming Maintenance Count, Overdue Maintenance Count, Work Orders in Progress
- AND I can click to view details

✅ **AC 5.1.3:** Cost analytics
- GIVEN I am viewing the dashboard
- WHEN I look at the cost section
- THEN I see: Total Fleet Cost, Cost per Vehicle, Cost per Mile
- AND I see a breakdown by category (Fuel, Maintenance, Insurance)

✅ **AC 5.1.4:** Real-time data updates
- GIVEN I am viewing the dashboard
- WHEN data changes in the system
- THEN the dashboard updates automatically within 30 seconds
- AND I see a "Last Updated" timestamp

**Technical Notes:**
- Implementation: `src/components/modules/FleetDashboard.tsx`
- Data aggregation via PostgreSQL views

---

### Story 5.2: Generate Custom Reports 🚧
**Priority:** 🟡 P2 - Medium
**Status:** 🚧 In Progress

**User Story:**
```
As a fleet manager
I want to generate custom reports
So that I can analyze specific aspects of fleet operations
```

**Acceptance Criteria:**

📋 **AC 5.2.1:** Report builder interface
- GIVEN I navigate to reports
- WHEN I click "Create Report"
- THEN I see a report builder with options for: Report Type, Date Range, Filters, Grouping

📋 **AC 5.2.2:** Report types available
- GIVEN I am creating a report
- WHEN I select report type
- THEN I can choose from: Vehicle Utilization, Maintenance Costs, Fuel Consumption, Driver Performance, Safety Incidents

📋 **AC 5.2.3:** Export options
- GIVEN I have generated a report
- WHEN I click "Export"
- THEN I can download as: PDF, Excel, CSV
- AND the export includes all data and charts

📋 **AC 5.2.4:** Scheduled reports
- GIVEN I have created a report
- WHEN I configure scheduling
- THEN I can set the report to run: Daily, Weekly, Monthly
- AND I can specify email recipients

**Technical Notes:**
- Planned feature - not yet implemented
- Will use report generation library

---

## Epic: Vendor Management

### Story 6.1: Manage Vendor Information ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**User Story:**
```
As a fleet manager
I want to manage vendor information
So that I can track who provides services and parts for my fleet
```

**Acceptance Criteria:**

✅ **AC 6.1.1:** View vendor list
- GIVEN I navigate to vendors page
- WHEN the page loads
- THEN I see a table of all vendors with: Name, Service Type, Contact Info, Status, Performance Rating

✅ **AC 6.1.2:** Add new vendor
- GIVEN I click "Add Vendor"
- WHEN I fill out the form with: Name, Service Type, Contact Info, Address
- THEN the vendor is created
- AND I see a success message

✅ **AC 6.1.3:** Edit vendor information
- GIVEN I am viewing a vendor
- WHEN I click "Edit"
- THEN I can update any vendor field
- AND changes are saved with an audit log entry

✅ **AC 6.1.4:** Vendor contact actions
- GIVEN I am viewing vendor details
- WHEN I click contact buttons
- THEN "Call" opens phone dialer with vendor's phone number
- AND "Email" opens email client with vendor's email
- AND "View Details" shows full vendor information in a modal

✅ **AC 6.1.5:** Track vendor performance
- GIVEN a vendor has completed services
- WHEN I view their profile
- THEN I see: Total Services, Average Rating, On-Time Rate, Total Cost
- AND I can view service history

**Technical Notes:**
- Implementation: `src/components/modules/VendorManagement.tsx`
- API Endpoint: `GET/POST/PUT /api/vendors`
- Fixed buttons: Call, Email, View Details all functional

---

## Epic: Safety & Compliance

### Story 7.1: Track Safety Incidents ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**User Story:**
```
As a safety manager
I want to track and manage safety incidents
So that I can maintain compliance and improve fleet safety
```

**Acceptance Criteria:**

✅ **AC 7.1.1:** Record safety incident
- GIVEN an incident occurs
- WHEN I create an incident report
- THEN I must provide: Date, Vehicle, Driver, Incident Type, Severity, Description
- AND I can optionally attach: Photos, Police Report, Witness Statements

✅ **AC 7.1.2:** Incident severity levels
- GIVEN I am recording an incident
- WHEN I select severity
- THEN I can choose from: Minor (no injury, minimal damage), Moderate (minor injuries), Severe (serious injuries), Critical (fatalities)
- AND severity affects notification escalation

✅ **AC 7.1.3:** Automatic notifications
- GIVEN I report a severe or critical incident
- WHEN the incident is saved
- THEN safety managers are immediately notified
- AND the driver's status is flagged for review
- AND the vehicle is flagged for inspection

✅ **AC 7.1.4:** Incident investigation tracking
- GIVEN an incident is reported
- WHEN I view the incident
- THEN I can track: Investigation Status, Findings, Corrective Actions, Resolution Date
- AND I can attach investigation documents

✅ **AC 7.1.5:** Safety metrics dashboard
- GIVEN I navigate to safety dashboard
- WHEN the page loads
- THEN I see: Total Incidents (current month), Incident Rate Trend, Incidents by Type, Incidents by Severity
- AND I can compare to previous periods

**Technical Notes:**
- Database table: `safety_incidents`
- API Endpoint: `POST /api/safety-incidents`
- Implements FedRAMP audit requirements

---

### Story 7.2: Compliance Document Management 📋
**Priority:** 🟡 P2 - Medium
**Status:** 📋 Planned

**User Story:**
```
As a compliance officer
I want to manage compliance documents
So that I ensure all vehicles and drivers have required documentation
```

**Acceptance Criteria:**

📋 **AC 7.2.1:** Document upload
- GIVEN I am viewing a vehicle or driver profile
- WHEN I upload a compliance document
- THEN I must specify: Document Type, Expiration Date, Issuing Authority
- AND the document is stored securely

📋 **AC 7.2.2:** Expiration tracking
- GIVEN documents have expiration dates
- WHEN a document is within 30 days of expiration
- THEN I see a warning notification
- AND the vehicle/driver is flagged

📋 **AC 7.2.3:** Compliance dashboard
- GIVEN I navigate to compliance
- WHEN I view the dashboard
- THEN I see: Expiring Documents (next 30 days), Expired Documents, Compliance Rate by Document Type

📋 **AC 7.2.4:** Document types tracked
- GIVEN I am managing documents
- WHEN I categorize documents
- THEN I can use types: Vehicle Registration, Insurance, Inspection Certificate, Driver License, DOT Medical Card

**Technical Notes:**
- Planned feature - not yet implemented
- Will use Azure Blob Storage for documents

---

## Non-Functional Requirements

### NFR-1: Performance ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**Requirements:**

✅ **NFR-1.1:** Page load time
- GIVEN I navigate to any page
- WHEN the page loads
- THEN initial render completes in < 2 seconds
- AND interactive elements are ready in < 3 seconds

✅ **NFR-1.2:** API response time
- GIVEN I make an API request
- WHEN the server processes the request
- THEN 95% of requests complete in < 500ms
- AND 99% of requests complete in < 1 second

✅ **NFR-1.3:** Database query performance
- GIVEN database queries are executed
- WHEN queries run
- THEN complex aggregations complete in < 2 seconds
- AND simple CRUD operations complete in < 100ms

✅ **NFR-1.4:** Concurrent users
- GIVEN the system is under load
- WHEN 100 concurrent users access the system
- THEN performance remains within acceptable thresholds
- AND no errors occur

**Technical Implementation:**
- Horizontal Pod Autoscaling configured
- Database indexes optimized
- React code splitting and lazy loading
- Redis caching for session data

---

### NFR-2: Security ✅
**Priority:** 🔴 P0 - Critical
**Status:** ✅ Complete

**Requirements:**

✅ **NFR-2.1:** Authentication security
- GIVEN users authenticate
- WHEN passwords are stored
- THEN they are hashed using bcrypt (10 rounds)
- AND JWT tokens expire after 24 hours
- AND failed login attempts are rate limited

✅ **NFR-2.2:** Data encryption
- GIVEN data is transmitted
- WHEN requests are made
- THEN all traffic uses TLS 1.2 or higher
- AND sensitive data in database is encrypted

✅ **NFR-2.3:** Multi-tenant isolation
- GIVEN the system has multiple tenants
- WHEN queries are executed
- THEN data is filtered by tenant_id
- AND tenants cannot access each other's data
- AND all tables enforce tenant_id foreign keys

✅ **NFR-2.4:** Audit logging
- GIVEN users perform actions
- WHEN actions occur
- THEN all CRUD operations are logged with: User, Action, Resource, Timestamp, IP Address
- AND logs are retained for 1 year minimum

✅ **NFR-2.5:** Security headers
- GIVEN HTTP responses are sent
- WHEN headers are set
- THEN Helmet.js security headers are applied
- AND CORS is properly configured

**Technical Implementation:**
- FedRAMP compliant design
- Helmet.js middleware
- PostgreSQL row-level security ready
- Audit log table with 1-year retention

---

### NFR-3: Scalability ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**Requirements:**

✅ **NFR-3.1:** Horizontal scaling
- GIVEN load increases
- WHEN CPU utilization exceeds 70%
- THEN Kubernetes automatically scales pods
- AND load is distributed across instances

✅ **NFR-3.2:** Database scalability
- GIVEN data volume grows
- WHEN database reaches 80% capacity
- THEN storage automatically expands
- AND read replicas can be added

✅ **NFR-3.3:** Caching strategy
- GIVEN frequently accessed data exists
- WHEN requests are made
- THEN Redis cache is checked first
- AND cache hit rate is > 80%

**Technical Implementation:**
- Kubernetes HPA configured
- PostgreSQL StatefulSet with PVC
- Redis for caching and sessions

---

### NFR-4: Availability ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**Requirements:**

✅ **NFR-4.1:** Uptime target
- GIVEN the system is deployed
- WHEN measured over 30 days
- THEN uptime is ≥ 99.5%
- AND planned maintenance is scheduled during low-usage windows

✅ **NFR-4.2:** Health checks
- GIVEN the application is running
- WHEN health endpoints are called
- THEN `/api/health` returns status within 1 second
- AND Kubernetes monitors pod health

✅ **NFR-4.3:** Graceful degradation
- GIVEN a component fails
- WHEN the failure occurs
- THEN the system continues operating in degraded mode
- AND users see appropriate error messages

✅ **NFR-4.4:** Disaster recovery
- GIVEN a catastrophic failure occurs
- WHEN recovery is initiated
- THEN system can be restored within 4 hours (RTO)
- AND data loss is limited to 1 hour (RPO)

**Technical Implementation:**
- Multiple replica pods
- Kubernetes self-healing
- Health check endpoints
- Database backup strategy documented

---

### NFR-5: Observability ✅
**Priority:** 🟠 P1 - High
**Status:** ✅ Complete

**Requirements:**

✅ **NFR-5.1:** Application monitoring
- GIVEN the application is running
- WHEN errors or slow requests occur
- THEN telemetry is sent to Azure Application Insights
- AND logs include: Request ID, User ID, Tenant ID, Duration

✅ **NFR-5.2:** Structured logging
- GIVEN events occur
- WHEN logs are written
- THEN logs use JSON format
- AND include correlation IDs for tracing

✅ **NFR-5.3:** Metrics collection
- GIVEN the system operates
- WHEN metrics are collected
- THEN we track: Request rate, Error rate, Duration, Active users
- AND metrics are queryable in real-time

✅ **NFR-5.4:** Alerting
- GIVEN monitoring is active
- WHEN thresholds are exceeded
- THEN alerts are sent to operations team
- AND alerts include: Severity, Description, Remediation steps

**Technical Implementation:**
- OpenTelemetry instrumentation
- Azure Application Insights integration
- Structured JSON logging
- Kubernetes metrics server

---

## Appendix

### Story Status Summary

| Epic | Total Stories | ✅ Complete | 🚧 In Progress | 📋 Planned |
|------|--------------|-------------|----------------|------------|
| Authentication & Security | 3 | 2 | 0 | 1 |
| Vehicle Management | 3 | 3 | 0 | 0 |
| Maintenance Operations | 4 | 4 | 0 | 0 |
| Driver Management | 2 | 2 | 0 | 0 |
| Reporting & Analytics | 2 | 1 | 1 | 0 |
| Vendor Management | 1 | 1 | 0 | 0 |
| Safety & Compliance | 2 | 1 | 0 | 1 |
| **Total** | **17** | **14** | **1** | **2** |

### Priority Distribution

- 🔴 **P0 Critical:** 12 stories (71%)
- 🟠 **P1 High:** 4 stories (24%)
- 🟡 **P2 Medium:** 1 story (6%)
- 🟢 **P3 Low:** 0 stories (0%)

### Definition of Done

A user story is considered complete when:

1. ✅ All acceptance criteria are met
2. ✅ Code is reviewed and approved
3. ✅ Unit tests pass with >80% coverage
4. ✅ Integration tests pass
5. ✅ Documentation is updated
6. ✅ Deployed to staging environment
7. ✅ User acceptance testing completed
8. ✅ Deployed to production
9. ✅ No critical or high-severity bugs
10. ✅ Performance benchmarks met

### Estimation Guidelines

**Story Points (Fibonacci):**
- 1 point: < 4 hours (simple CRUD)
- 2 points: < 1 day (basic feature)
- 3 points: 1-2 days (moderate feature)
- 5 points: 3-5 days (complex feature)
- 8 points: 1-2 weeks (very complex)
- 13 points: 2-3 weeks (epic-level)

---

**Document Owner:** Product Team
**Last Review:** 2025-11-09
**Next Review:** 2025-12-09

---

*This document is a living artifact and should be updated as requirements evolve.*
