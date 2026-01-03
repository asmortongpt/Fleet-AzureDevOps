# CITY OF TALLAHASSEE FLEET MANAGEMENT PRESENTATION

## Meeting Agenda & Presenter Guide

**Meeting Goal:** Share app, gain trust/confidence, get requirements from them, leave with promise of proposal. DELIVER Proposal.

**Duration:** 1 Hour

---

## TIMELINE OVERVIEW

| Time | Section | Duration |
|------|---------|----------|
| 0:00-0:05 | Introduction & Setup | 5 min |
| 0:05-0:10 | CTA Overview | 5 min |
| 0:10-0:40 | Fleet App Demo | 30 min |
| 0:40-1:00 | Q&A and Closing | 20 min |

---

## 0:00-0:05 — INTRODUCTION & SETUP (5 minutes)

### Activities
- Shake hands, introductions
- Get laptop connected to display
- Ensure demo environment is loaded
- Hand out any printed materials

### Talking Points
- "Thank you for having us today"
- "We're excited to show you what we've built specifically for municipal fleet operations"
- Quick round of introductions (names, roles)

---

## 0:05-0:10 — CTA OVERVIEW (5 minutes)

### About Capital Technology Alliance

**Company Information:**
- **Legal Name:** Capital Technology Alliance, LLC
- **Location:** 2509 Lantana Lane, Tallahassee, FL 32311
- **Status:** Active Florida LLC (Document #L24000075432)
- **Founded:** 2024

### Key Talking Points

> "We're a Tallahassee-based technology company. We're local, which means we understand Florida municipal operations and we're here when you need us."

> "Our team has deep expertise in enterprise software development, cloud infrastructure, and AI/ML technologies."

> "We built this platform because we saw a gap in the market — existing solutions either do too little or are overly complex. We wanted something that just works."

### Why We're Different
- Local presence in Tallahassee
- Purpose-built for municipal fleet operations
- Modern technology stack (not legacy software)
- AI-powered optimization
- Seamless integration with existing systems (like Samsara)

---

## 0:10-0:40 — FLEET APP DEMO (30 minutes)

### Opening Statement

> **"Why did we build this?"**
>
> "We saw a need. Municipal fleets are using fragmented systems — one for telematics, another for fuel, spreadsheets for maintenance. We knew we could do it better."
>
> "Our goal was to create something simplified and streamlined — one platform that does everything you need."

---

### START: Fleet Dashboard Screen (2 minutes)

**Screenshot:** `fleet-dashboard-chromium-darwin.png`

![Fleet Dashboard](../../tests/e2e/complete-system.spec.ts-snapshots/fleet-dashboard-chromium-darwin.png)

**Discuss what they are seeing:**
- Real-time fleet status at a glance
- Key metrics: vehicles active, maintenance due, compliance status
- Quick actions for common tasks
- Recent activity feed

> "This is your command center. Everything starts here. At a glance, you can see the health of your entire fleet."

**Then lead into navigation options:**
> "From here, let me show you where you can go..."

---

### OPERATIONS HUB (5 minutes)

**Screenshot:** `gis-command-center-chromium-darwin.png`

![GIS Command Center](../../tests/e2e/complete-system.spec.ts-snapshots/gis-command-center-chromium-darwin.png)

#### Dispatch
- Live vehicle tracking on map
- Real-time job assignment
- Driver availability status
- Route optimization

**Screenshot:** `gps-tracking-chromium-darwin.png`

![GPS Tracking](../../tests/e2e/complete-system.spec.ts-snapshots/gps-tracking-chromium-darwin.png)

> "You can see every vehicle in real-time. Dispatch jobs, track progress, and know exactly where your assets are."

#### Routes
- Planned vs. actual routes
- Deviation alerts
- Fuel-efficient routing
- Historical route analysis

#### Tasks
- Job queue management
- Priority assignment
- Status tracking
- Completion verification

#### Calendar
- Scheduled maintenance
- Driver assignments
- Inspection due dates
- Recurring tasks

---

### MAINTENANCE HUB (8 minutes)

**Screenshot:** `garage---service-chromium-darwin.png`

![Garage & Service](../../tests/e2e/complete-system.spec.ts-snapshots/garage---service-chromium-darwin.png)

> "This is where Tallahassee's needs really align with what we've built. You do both internal maintenance AND use external vendors. Our system handles both."

#### Fuel Consumption
- Real-time fuel level tracking (via Samsara)
- Fuel purchase tracking
- Cost per mile calculations
- Idling detection and fuel waste
- AI-powered fuel price optimization

> "We can replace your separate fuel management app. All fuel data flows into one system."

#### Service Dates
- Preventive maintenance scheduling
- Mileage-based triggers
- Time-based triggers
- Engine hour triggers
- Automated work order creation

#### Maintenance Records
- Complete service history per vehicle
- Parts used and costs
- Labor hours and rates
- Warranty claim tracking

**Screenshot:** `parts-inventory-chromium-darwin.png`

![Parts Inventory](../../tests/e2e/complete-system.spec.ts-snapshots/parts-inventory-chromium-darwin.png)

> "Every part, every repair, every cost — all tracked and searchable."

---

### ANALYTICS (3 minutes)

**Screenshot:** `agent-6-executive-dashboard.png`

![Executive Dashboard](../../tests/screenshots/agent-6-executive-dashboard.png)

**Screenshot:** `agent-6-fleet-analytics.png`

![Fleet Analytics](../../tests/screenshots/agent-6-fleet-analytics.png)

**Screenshot:** `agent-6-cost-analysis.png`

![Cost Analysis](../../tests/screenshots/agent-6-cost-analysis.png)

- Fleet utilization rates
- Cost per mile tracking
- Trend analysis
- Custom report builder
- Scheduled report delivery
- Excel export

> "For leadership, this gives you the data you need for budget discussions, performance reviews, and strategic planning."

---

### COMPLIANCE (3 minutes)

**Screenshot:** `osha-safety-forms-chromium-darwin.png`

![OSHA Safety Forms](../../tests/e2e/complete-system.spec.ts-snapshots/osha-safety-forms-chromium-darwin.png)

**Screenshot:** `policy-engine-chromium-darwin.png`

![Policy Engine](../../tests/e2e/complete-system.spec.ts-snapshots/policy-engine-chromium-darwin.png)

#### DOT and OSHA Compliance
- Vehicle inspection tracking
- Hours of Service (HOS) monitoring
- ELD status (100% compliant)
- OSHA safety forms
- CSA ratings

#### Records, Audit, Reporting
- Complete audit trails
- One-click compliance reports
- Automated record retention
- Inspection-ready documentation

> "When an auditor shows up, you can pull any record in seconds. Everything is timestamped and tamper-proof."

---

### SAFETY (3 minutes)

**Screenshot:** `driver-performance-chromium-darwin.png`

![Driver Performance](../../tests/e2e/complete-system.spec.ts-snapshots/driver-performance-chromium-darwin.png)

**Screenshot:** `video-telematics-chromium-darwin.png`

![Video Telematics](../../tests/e2e/complete-system.spec.ts-snapshots/video-telematics-chromium-darwin.png)

#### Incidents
- Accident tracking and documentation
- Flat tires and breakdowns
- Incident resolution workflow
- Days-without-incident tracking

#### Safety Feature Tracking
- **Speeding** — Real-time alerts and history
- **Seatbelt use** — Compliance monitoring
- **Harsh driving** — Acceleration, braking, cornering
- **Distraction detection** — Via dash cam (Samsara integration)

> "Safety isn't just about tracking accidents after they happen. We give you the tools to prevent them."

---

### DRIVERS (2 minutes)

**Screenshot:** `people-management-chromium-darwin.png`

![People Management](../../tests/e2e/complete-system.spec.ts-snapshots/people-management-chromium-darwin.png)

- Driver roster management
- License and certification tracking
- Expiration alerts
- Performance scoring
- Training completion
- Assignment history

> "Know who's available, who needs training, and who's performing well."

---

### PROCUREMENT (3 minutes)

**Screenshot:** `purchase-orders-chromium-darwin.png`

![Purchase Orders](../../tests/e2e/complete-system.spec.ts-snapshots/purchase-orders-chromium-darwin.png)

**Screenshot:** `invoices-chromium-darwin.png`

![Invoices](../../tests/e2e/complete-system.spec.ts-snapshots/invoices-chromium-darwin.png)

**Screenshot:** `vendor-management-chromium-darwin.png`

![Vendor Management](../../tests/e2e/complete-system.spec.ts-snapshots/vendor-management-chromium-darwin.png)

#### Purchase Orders
- Full PO lifecycle: Draft → Submitted → Approved → Ordered → Received
- Line item tracking
- Approval workflows
- Vendor assignment

#### Vendor Management
- Vendor database with ratings
- Insurance verification
- Performance tracking
- Preferred vendor designation

#### Invoice Tracking
- Link invoices to work orders and POs
- Payment status tracking
- Audit trail

> "For your vendors, we track everything — from the initial quote to the final payment. You'll know exactly who's performing and who isn't."

---

### COMMUNICATIONS HUB (1 minute)

- In-app notifications
- Email integration
- Microsoft Teams integration
- Outlook calendar sync
- Driver messaging

> "We integrate with the tools you already use — Teams, Outlook. No need to switch between systems."

---

### ASSETS (2 minutes)

#### All Assets (Not Just Vehicles)
- Heavy equipment
- Trailers
- Tools and equipment
- Inventory items

**Screenshot:** `parts-inventory-chromium-darwin.png`

- Complete asset lifecycle tracking
- Depreciation calculations
- Utilization rates
- Maintenance history for all assets

> "If it has a value and needs maintenance, we track it."

---

### TECHNICAL OVERVIEW (2 minutes)

#### Security
- SSL/TLS A+ rating
- Encrypted data at rest and in transit
- Role-based access control
- Audit logging
- SSRF/CSRF protection

#### Authentication
- Single sign-on (SSO) capable
- Multi-factor authentication
- Azure AD integration
- Session management

#### Infrastructure
- Azure Cloud hosting
- 99.9% uptime SLA
- Automatic backups
- Disaster recovery

#### Hardware
- Works with existing Samsara devices
- No hardware replacement needed
- OBD-II integration
- Dash cam support

> "Your investment in Samsara is protected. We integrate directly with your existing hardware."

---

### POLICY HUB (1 minute)

- Upload standard procedures
- Document management
- Policy templates
- Version control
- Acknowledgment tracking

> "Build and distribute policies right from the platform. Track who's read and acknowledged them."

---

## 0:40-1:00 — Q&A AND CLOSING (20 minutes)

### Anticipated Questions

**"How does this work with our Samsara devices?"**
> "We integrate directly with Samsara's API. All your telemetry data — GPS, fuel levels, harsh events, dash cam footage — flows into our platform in real-time. No new hardware needed."

**"What about our existing fuel management app?"**
> "Our platform replaces it entirely. You'll have better fuel tracking plus AI-powered optimization that finds savings opportunities."

**"Can we do internal AND vendor maintenance?"**
> "Absolutely. That's exactly what we built for. Assign work orders to your technicians or to external vendors. Track labor and invoices either way. See the cost split between internal and outsourced work."

**"How long does implementation take?"**
> "Typically 6-8 weeks for full deployment. We start with Samsara integration and core features, then add customizations based on your specific needs."

**"What about training?"**
> "We provide on-site training at your facilities. We're local, so we're here when you need us."

---

### Connected Vehicle Discussion

#### Sensor-Based (OBD-II / Samsara)
- Sensor has cellular connectivity
- Real-time data transmission
- GPS, fuel, engine diagnostics
- Dash cam integration

#### Through Driver/Operator Cellular Device
- Limited functionality
- Location tracking
- Basic status updates
- Good for backup/secondary tracking

> "Your Samsara devices give us the richest data. For vehicles without sensors, we can use driver mobile apps as a backup."

---

### Closing & Next Steps

**Key Takeaways:**
1. One platform for everything — no more fragmented systems
2. Keeps your Samsara investment — native integration
3. Replaces your fuel app — with better features
4. Handles both internal and vendor maintenance
5. Built for government compliance
6. Local Tallahassee support

**Ask for Requirements:**
> "What are the specific pain points you're facing today?"
> "Which features are most important to you?"
> "What would make this a success for your team?"

**Promise of Proposal:**
> "Based on what we've discussed today, we'll prepare a detailed proposal tailored to Tallahassee's specific needs. We can have that to you within [X days]."

**Leave Behind:**
- Business cards
- Printed overview (if applicable)
- Contact information for follow-up

---

## APPENDIX: SCREENSHOT QUICK REFERENCE

| Demo Section | Screenshot File |
|--------------|-----------------|
| Fleet Dashboard | `fleet-dashboard-chromium-darwin.png` |
| GIS Command Center | `gis-command-center-chromium-darwin.png` |
| GPS Tracking | `gps-tracking-chromium-darwin.png` |
| Garage & Service | `garage---service-chromium-darwin.png` |
| Parts Inventory | `parts-inventory-chromium-darwin.png` |
| Executive Dashboard | `agent-6-executive-dashboard.png` |
| Fleet Analytics | `agent-6-fleet-analytics.png` |
| Cost Analysis | `agent-6-cost-analysis.png` |
| OSHA Safety Forms | `osha-safety-forms-chromium-darwin.png` |
| Policy Engine | `policy-engine-chromium-darwin.png` |
| Driver Performance | `driver-performance-chromium-darwin.png` |
| Video Telematics | `video-telematics-chromium-darwin.png` |
| People Management | `people-management-chromium-darwin.png` |
| Purchase Orders | `purchase-orders-chromium-darwin.png` |
| Invoices | `invoices-chromium-darwin.png` |
| Vendor Management | `vendor-management-chromium-darwin.png` |
| EV Charging | `ev-charging-chromium-darwin.png` |
| Tablet View | `tablet-view-chromium-darwin.png` |

**Screenshot Locations:**
- E2E snapshots: `tests/e2e/complete-system.spec.ts-snapshots/`
- Agent screenshots: `tests/screenshots/`

---

## PRE-MEETING CHECKLIST

- [ ] Demo environment loaded and tested
- [ ] Laptop charged and display adapter ready
- [ ] Screenshots loaded as backup
- [ ] Business cards available
- [ ] Printed materials (if any)
- [ ] Know attendee names and roles
- [ ] Proposal template ready for customization

---

*Prepared for City of Tallahassee Fleet Management Meeting*
*Capital Technology Alliance, LLC*
*January 2026*
