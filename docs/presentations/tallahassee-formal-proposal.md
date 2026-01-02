# FLEET MANAGEMENT PLATFORM PROPOSAL

**Prepared for:**
**City of Tallahassee**
**Fleet Management Division**

**Prepared by:**
**Capital Technology Alliance, LLC**
2509 Lantana Lane
Tallahassee, FL 32311

**Proposal Date:** January 2026

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [About Capital Technology Alliance](#2-about-capital-technology-alliance)
3. [Understanding Your Needs](#3-understanding-your-needs)
4. [Proposed Solution](#4-proposed-solution)
5. [Platform Capabilities](#5-platform-capabilities)
6. [Samsara Integration](#6-samsara-integration)
7. [Fuel Management Consolidation](#7-fuel-management-consolidation)
8. [Maintenance Operations](#8-maintenance-operations)
9. [Vendor Management](#9-vendor-management)
10. [Government Compliance](#10-government-compliance)
11. [Analytics & Reporting](#11-analytics--reporting)
12. [Implementation Approach](#12-implementation-approach)
13. [Investment & ROI](#13-investment--roi)
14. [Why Capital Technology Alliance](#14-why-capital-technology-alliance)
15. [Next Steps](#15-next-steps)

---

## 1. EXECUTIVE SUMMARY

### The Opportunity

The City of Tallahassee seeks to modernize its fleet management operations while maintaining its existing investment in Samsara telematics devices. Currently operating with fragmented systems - Samsara for some fleet segments and a separate fuel management application for others - the City faces operational inefficiencies and data silos that impact decision-making and cost control.

### Our Solution

Capital Technology Alliance proposes implementing our enterprise Fleet Management Platform - a unified solution that:

- **Integrates seamlessly with existing Samsara devices** - No hardware replacement required
- **Consolidates fuel management** into a single, AI-optimized platform
- **Unifies internal and vendor maintenance operations** in one system
- **Ensures government compliance** with DOT, IFTA, OSHA, and municipal requirements
- **Provides real-time visibility** across all city fleet operations

### Key Benefits

| Benefit | Expected Impact |
|---------|-----------------|
| Fuel Cost Reduction | 15-25% through AI optimization |
| Maintenance Efficiency | 20% cost reduction |
| Administrative Time Savings | 30% reduction |
| Compliance Assurance | Avoid penalties with proactive monitoring |
| Unified Operations | Single platform for all fleet needs |

---

## 2. ABOUT CAPITAL TECHNOLOGY ALLIANCE

### Company Overview

**Capital Technology Alliance, LLC** is a Tallahassee-based technology company specializing in enterprise software solutions for fleet management, asset tracking, and operational optimization.

**Legal Entity:** Florida Limited Liability Company
**Document Number:** L24000075432
**EIN:** 99-1388520
**Status:** ACTIVE
**Headquarters:** Tallahassee, Florida

### Our Mission

To empower organizations with intelligent technology solutions that transform operational efficiency, reduce costs, and enable data-driven decision-making.

### Local Presence

As a Tallahassee-based company, Capital Technology Alliance understands the unique needs of Florida municipalities and maintains close proximity for:

- Rapid on-site support and training
- Face-to-face implementation meetings
- Local accountability and partnership
- Understanding of Florida regulatory requirements

### Technical Expertise

- **Platform Architecture:** React, Node.js, PostgreSQL, Azure Cloud
- **AI/ML Capabilities:** 104 specialized AI agents for fleet optimization
- **Security:** FedRAMP-aligned security controls, SOC 2 ready
- **Integration:** Native Samsara, Smartcar, and third-party API support

---

## 3. UNDERSTANDING YOUR NEEDS

### Current State Assessment

Based on our understanding of the City of Tallahassee's fleet operations:

| Current System | Challenge | Impact |
|----------------|-----------|--------|
| Samsara (partial fleet) | Data fragmentation | Incomplete fleet visibility |
| Separate Fuel App | System silos | Manual data reconciliation |
| Multiple logins | Staff inefficiency | Training overhead, errors |
| No unified compliance | Audit burden | Risk of violations |
| Separate vendor tracking | Manual processes | Delayed payments, poor visibility |

### Requirements Summary

1. **Keep Samsara Hardware** - Protect existing investment
2. **Consolidate Fuel Management** - Single platform for all fuel operations
3. **Unified Maintenance** - Both internal technicians and external vendors
4. **Government Compliance** - DOT, IFTA, OSHA tracking
5. **Real-time Visibility** - All departments, all vehicles
6. **Cost Optimization** - AI-powered recommendations

---

## 4. PROPOSED SOLUTION

### Fleet Management Platform Overview

Our enterprise Fleet Management Platform provides a unified command center for all fleet operations.

**[Screenshot: Fleet Dashboard]**
*See: tests/e2e/complete-system.spec.ts-snapshots/fleet-dashboard-chromium-darwin.png*

### Platform Architecture

```
+------------------------------------------------------------------+
|                    FLEET MANAGEMENT PLATFORM                      |
|                                                                   |
|  +------------+  +------------+  +------------+  +------------+   |
|  |  Samsara   |  |   Fuel     |  |   Asset    |  | Compliance |   |
|  | Integration|  | Management |  | Management |  |  & Safety  |   |
|  +------------+  +------------+  +------------+  +------------+   |
|                                                                   |
|  +------------+  +------------+  +------------+  +------------+   |
|  |   Driver   |  |Maintenance |  | Operations |  | Analytics  |   |
|  | Management |  |    Hub     |  |  Dispatch  |  | & Reports  |   |
|  +------------+  +------------+  +------------+  +------------+   |
|                                                                   |
+------------------------------------------------------------------+
                              |
        +--------------------+--------------------+
        |                    |                    |
   Your Samsara        Your Vehicles        Your Staff
     Devices           & Equipment          & Drivers
```

### Key Differentiators

| Feature | Traditional Systems | Our Platform |
|---------|---------------------|--------------|
| Samsara Integration | Limited/Manual | Native, Real-time |
| AI Optimization | None | 104 Specialized Agents |
| Vendor Management | Basic | Full Lifecycle |
| Compliance | Manual Tracking | Automated Monitoring |
| Reporting | Static Reports | Dynamic, AI-Powered |

---

## 5. PLATFORM CAPABILITIES

### 5.1 Operations Command Center

**[Screenshot: GIS Command Center]**
*See: tests/e2e/complete-system.spec.ts-snapshots/gis-command-center-chromium-darwin.png*

- Real-time vehicle tracking on interactive maps
- Live job tracking and dispatch
- Geofencing for city facilities and zones
- Automatic entry/exit alerts

**[Screenshot: GPS Tracking]**
*See: tests/e2e/complete-system.spec.ts-snapshots/gps-tracking-chromium-darwin.png*

### 5.2 Driver Safety & Performance

**[Screenshot: Driver Performance]**
*See: tests/e2e/complete-system.spec.ts-snapshots/driver-performance-chromium-darwin.png*

| Capability | Description |
|------------|-------------|
| Safety Scoring | AI-powered driver safety analysis |
| Certification Tracking | License and certification expiration alerts |
| Training Monitoring | Completion rates and compliance |
| Performance Metrics | On-time rates, efficiency tracking |

**[Screenshot: Video Telematics]**
*See: tests/e2e/complete-system.spec.ts-snapshots/video-telematics-chromium-darwin.png*

- Dash camera integration via Samsara
- Safety event video review
- Distraction and drowsiness detection
- Incident documentation and evidence

### 5.3 Asset Management

**[Screenshot: Parts Inventory]**
*See: tests/e2e/complete-system.spec.ts-snapshots/parts-inventory-chromium-darwin.png*

- Complete asset lifecycle tracking
- Equipment inventory management
- Depreciation tracking for budget planning
- Vehicle compatibility matrices

---

## 6. SAMSARA INTEGRATION

### Seamless Data Synchronization

Our platform provides native integration with Samsara's telematics ecosystem:

| Samsara Data Point | Platform Usage |
|--------------------|----------------|
| Real-time GPS | Live vehicle tracking on city maps |
| OBD-II Telemetry | Fuel levels, odometer, engine state |
| Dash Cameras | Video telematics for safety events |
| Driver Behavior | Safety scoring and coaching |
| Speed & Heading | Route verification and compliance |
| Harsh Events | Incident detection and alerts |

### What This Means for Tallahassee

- **No new hardware purchases** for Samsara-equipped vehicles
- **No driver retraining** on hardware operation
- **Instant data flow** from existing devices
- **Unified view** of both Samsara and non-Samsara vehicles
- **Preserved investment** in current telematics infrastructure

### Integration Architecture

```
Samsara Cloud API
        |
        v
+------------------+
| Fleet Platform   |
| Integration Hub  |
+------------------+
        |
        +---> Real-time Tracking
        +---> Safety Alerts
        +---> Video Events
        +---> Telemetry Data
        +---> Driver Behavior
```

---

## 7. FUEL MANAGEMENT CONSOLIDATION

### Replace Your Separate Fuel App

**[Screenshot: Cost Analysis]**
*See: tests/screenshots/agent-6-cost-analysis.png*

| Current State | With Our Platform |
|---------------|-------------------|
| Separate login | Single unified dashboard |
| Basic tracking | AI-powered optimization |
| Manual price comparison | Real-time fuel pricing (25-mile radius) |
| No telematics integration | Idling detection with fuel waste calculation |
| Limited reporting | Advanced analytics and forecasting |

### Fuel Optimization Features

**Real-Time Fuel Intelligence:**
- Nearby station discovery with live pricing
- Fleet card optimization recommendations
- Bulk vs. retail cost analysis
- Price alerts when thresholds are met

**Idling Detection & Waste Prevention:**
- Real-time idling monitoring across all vehicles
- Fuel waste quantification (gallons + cost)
- CO2 emission tracking for sustainability reports
- Authorized vs. unauthorized idling classification
- Driver alerts and manager notifications

**Cost Hedging & Forecasting:**
- Price trend analysis
- Fixed price recommendations
- Volume discount optimization
- Budget forecasting tools

### Projected Fuel Savings

Based on industry benchmarks for a 150-vehicle municipal fleet:

| Metric | Current | With Platform | Savings |
|--------|---------|---------------|---------|
| Annual Fuel Cost | $500,000 | $400,000 | $100,000 |
| Idle Time Waste | 15% | 5% | $50,000 |
| Price Optimization | - | Active | $25,000 |
| **Total Annual** | | | **$175,000** |

---

## 8. MAINTENANCE OPERATIONS

### Internal & Vendor Operations Unified

**[Screenshot: Garage & Service View]**
*See: tests/e2e/complete-system.spec.ts-snapshots/garage---service-chromium-darwin.png*

Tallahassee maintains vehicles both internally AND through external vendors. Our platform handles both seamlessly in one unified system.

### 8.1 Internal Maintenance Operations

**Technician Management:**
- Assign work orders to individual city technicians
- Track labor hours with configurable hourly rates
- Monitor technician workload and availability
- Performance tracking per technician

**Service Bay Management:**
- Track service bay capacity per city facility
- Real-time bay utilization monitoring
- Facility-based work order assignment
- Multiple facility support across city locations

### 8.2 Work Order System

| Work Order Type | Internal | Vendor | Both |
|-----------------|----------|--------|------|
| Preventive Maintenance | Yes | Yes | Yes |
| Corrective Repairs | Yes | Yes | Yes |
| Inspections | Yes | Yes | Yes |
| Recalls | - | Yes | Yes |
| Warranty Work | - | Yes | Yes |
| Accident Repairs | Yes | Yes | Yes |
| Tire Service | Yes | Yes | Yes |
| Emergency Work | Yes | Yes | Yes |
| Bodywork | Yes | Yes | Yes |

### 8.3 Work Order Assignment Flow

```
New Work Order Created
        |
        v
+-------+-------+
|               |
v               v
INTERNAL        EXTERNAL
Assign to       Assign to
Technician      Vendor
+ Facility      + PO Creation
|               |
v               v
Track Labor     Track Invoice
& Parts         & Payment
|               |
v               v
+-------+-------+
        |
        v
   Complete &
   Close Order
```

### 8.4 Recurring Maintenance Automation

| Trigger Type | Example |
|--------------|---------|
| Mileage-based | Oil change every 5,000 miles |
| Time-based | Inspection every 90 days |
| Engine hours | Service every 250 hours |
| Combined | First trigger wins |

**Auto-Assignment Features:**
- Default technician assignment per schedule
- Default vendor assignment per schedule
- Estimated cost and duration
- Priority and parts list templates
- Due date predictions with confidence scoring

---

## 9. VENDOR MANAGEMENT

### Complete Vendor Lifecycle Management

**[Screenshot: Vendor Management]**
*See: tests/e2e/complete-system.spec.ts-snapshots/vendor-management-chromium-darwin.png*

### 9.1 Supported Vendor Types

- Service providers (repair shops, dealerships)
- Parts suppliers
- Body shops
- Tire shops
- Towing services
- Equipment rental companies
- Specialty contractors

### 9.2 Vendor Status Tracking

| Status | Description |
|--------|-------------|
| Active | Approved and available for work |
| Preferred | Priority vendors with negotiated rates |
| Pending Approval | New vendors under review |
| On Hold | Temporarily unavailable |
| Blacklisted | Do not use |

### 9.3 Vendor Capabilities Tracked

- Ratings (0-5 stars) based on performance
- Insurance verification with expiration alerts
- License and certification tracking
- Service categories and service areas
- Emergency/24/7 availability
- Contact persons and primary contacts

### 9.4 Purchase Order System

**[Screenshot: Purchase Orders]**
*See: tests/e2e/complete-system.spec.ts-snapshots/purchase-orders-chromium-darwin.png*

**Full PO Lifecycle:**
1. **Draft** - Create PO with line items
2. **Submitted** - Sent for approval
3. **Approved** - Approved by supervisor
4. **Ordered** - Sent to vendor
5. **Received** - Parts/services delivered
6. **Cancelled** - If needed

### 9.5 Vendor Invoicing & Payment

**[Screenshot: Invoices]**
*See: tests/e2e/complete-system.spec.ts-snapshots/invoices-chromium-darwin.png*

| Field | Purpose |
|-------|---------|
| Invoice Number | Vendor's invoice reference |
| Invoice Date | Date of invoice |
| Payment Status | Unpaid / Partial / Paid / Refunded |
| Linked Work Order | Connect invoice to work performed |
| Linked PO | Connect to purchase order |

### 9.6 Vendor Performance Analytics

**Track vendor performance over time:**

| Metric Category | What We Track |
|-----------------|---------------|
| Quote Response | Quotes requested, responded, avg response time |
| Orders | Orders placed, completed, cancelled, total value |
| Delivery | On-time %, late %, wrong parts % |
| Quality | Parts returned, warranty claims, quality rating |
| Pricing | Competitiveness score, contract compliance |
| Overall Score | 0-100 performance score |

**Use for:**
- Vendor selection decisions
- Contract negotiations
- Performance reviews
- Preferred vendor designation

### 9.7 Warranty Management

- Mark work orders as warranty claims
- Warranty claim number tracking
- Parts warranty by months and mileage
- OEM vs. aftermarket warranty differences
- Return policy tracking
- Link warranty work to related maintenance schedules

---

## 10. GOVERNMENT COMPLIANCE

### Comprehensive Regulatory Coverage

**[Screenshot: OSHA Safety Forms]**
*See: tests/e2e/complete-system.spec.ts-snapshots/osha-safety-forms-chromium-darwin.png*

| Compliance Area | Platform Capabilities |
|-----------------|----------------------|
| **DOT Compliance** | Vehicle inspections, HOS tracking, ELD status |
| **IFTA Reporting** | International Fuel Tax Agreement automation |
| **OSHA Standards** | Safety compliance monitoring |
| **CSA Ratings** | Compliance, Safety & Accountability tracking |
| **Municipal Requirements** | Customizable compliance rules |

**[Screenshot: Policy Engine]**
*See: tests/e2e/complete-system.spec.ts-snapshots/policy-engine-chromium-darwin.png*

### Audit-Ready Documentation

- Complete audit trails for all fleet operations
- Encrypted log storage for sensitive data
- Automated retention policies per city requirements
- One-click compliance reports for inspections
- Role-Based Access Control for department-level security

### ELD & HOS Management

- 100% Electronic Logging Device compliance
- Hours of Service violation prevention
- Real-time driver availability status
- Automatic violation alerts

---

## 11. ANALYTICS & REPORTING

### Executive Dashboard

**[Screenshot: Executive Dashboard]**
*See: tests/screenshots/agent-6-executive-dashboard.png*

Real-time KPIs visible at a glance:
- Fleet utilization rates
- Cost per mile tracking
- Safety and compliance scores
- Trend analysis

### Fleet Analytics

**[Screenshot: Fleet Analytics]**
*See: tests/screenshots/agent-6-fleet-analytics.png*

### Custom Report Builder

**[Screenshot: Data Workbench]**
*See: tests/screenshots/agent-6-data-workbench.png*

- Drag-and-drop report creation
- Multiple data sources
- Advanced filtering and aggregations
- Excel export with automated delivery

### Key Metrics for City Leadership

| Metric | Typical Value | City Benefit |
|--------|---------------|--------------|
| Fleet Utilization | 87% | Maximize vehicle ROI |
| Cost Per Mile | $0.42 | Budget accuracy |
| On-Time Rate | 94% | Service quality |
| Fuel Savings | 15-25% | Tax dollar efficiency |

---

## 12. IMPLEMENTATION APPROACH

### Phased Implementation

#### Phase 1: Foundation (Weeks 1-2)
- Platform provisioning and configuration
- Samsara integration setup and testing
- User account creation and role assignment
- Initial vehicle and asset data import

#### Phase 2: Integration (Weeks 3-4)
- Complete Samsara device synchronization
- Fuel management data migration
- Geofence configuration for city zones
- Compliance rules customization

#### Phase 3: Training & Rollout (Weeks 5-6)
- Administrator training sessions
- Dispatcher and operations training
- Driver app deployment
- Management dashboard orientation

#### Phase 4: Optimization (Weeks 7-8)
- AI optimization tuning
- Custom report development
- Performance baseline establishment
- Go-live support and monitoring

### Support & Training

- Dedicated implementation manager
- On-site training at city facilities
- Video training library access
- 24/7 technical support
- Quarterly business reviews

---

## 13. INVESTMENT & ROI

### Projected Annual Savings

| Category | Estimated Savings | How |
|----------|-------------------|-----|
| **Fuel Optimization** | 15-25% reduction | AI-powered routing, idling detection |
| **Maintenance** | 20% cost reduction | Predictive maintenance, efficient scheduling |
| **Administrative** | 30% time savings | Unified platform, automated reporting |
| **Compliance** | Avoid penalties | Proactive violation prevention |
| **Safety** | Reduced liability | Lower accident rates, better training |

### Example: 150-Vehicle Fleet

| Current Annual Cost | With Platform | Savings |
|---------------------|---------------|---------|
| Fuel: $500,000 | $400,000 | $100,000 |
| Maintenance: $200,000 | $160,000 | $40,000 |
| Admin Time: $80,000 | $56,000 | $24,000 |
| **Total** | | **$164,000/year** |

*Actual savings vary based on fleet size, vehicle types, and current operational efficiency.*

### Return on Investment

- **Payback Period:** 6-12 months typical
- **5-Year NPV:** Significant positive return
- **Ongoing Savings:** Compound year over year

---

## 14. WHY CAPITAL TECHNOLOGY ALLIANCE

### Key Differentiators

| Factor | Our Advantage |
|--------|---------------|
| **Local Presence** | Tallahassee-based, on-site support |
| **Samsara Expertise** | Native integration, no data loss |
| **Municipal Experience** | Understanding of government requirements |
| **AI Capabilities** | 104 specialized optimization agents |
| **Unified Platform** | Single system for all fleet needs |
| **Production-Proven** | Live platform with demonstrated stability |

### Additional Value for Tallahassee

1. **Unified Internal & Vendor Management**
   - Single system for all maintenance regardless of who does the work
   - Clear visibility into internal vs. outsourced costs
   - Vendor performance tracking for contract negotiations

2. **Government-Ready Compliance**
   - Pre-built compliance modules for DOT, IFTA, OSHA
   - Audit trails meet municipal record-keeping requirements
   - Role-based access for department separation

3. **Future-Proof Platform**
   - EV charging ready for fleet transition
   - AI capabilities that improve over time
   - Regular feature updates included

4. **Consolidation Savings**
   - Eliminate fuel management app subscription
   - Reduce administrative time reconciling systems
   - Single training requirement for staff

### Electric Vehicle Readiness

**[Screenshot: EV Charging]**
*See: tests/e2e/complete-system.spec.ts-snapshots/ev-charging-chromium-darwin.png*

As Tallahassee transitions to electric vehicles:
- Charging station tracking and management
- Charge level monitoring across EV fleet
- Charging schedule optimization
- Range analysis for route planning
- Energy cost tracking

---

## 15. NEXT STEPS

### Getting Started

1. **Discovery Session**
   - Review current fleet composition
   - Identify priority pain points
   - Map Samsara device coverage
   - Document fuel management requirements

2. **Technical Assessment**
   - Samsara account integration requirements
   - Data migration from fuel app
   - User role requirements
   - Compliance customization needs

3. **Pilot Program**
   - Select department for initial rollout
   - 30-day pilot with full functionality
   - Success metrics establishment
   - Staff feedback collection

4. **Full Deployment**
   - City-wide rollout plan
   - Training program execution
   - Legacy system retirement
   - Ongoing optimization support

### Contact Information

**Capital Technology Alliance, LLC**

**Address:**
2509 Lantana Lane
Tallahassee, FL 32311

**Schedule a Demo:** See the platform in action with your data

**Technical Questions:** Deep-dive on Samsara integration

**Pilot Program:** Start a 30-day evaluation

---

## APPENDICES

### Appendix A: Feature Comparison Matrix

| Feature | Our Platform | Samsara Standalone | Typical Fuel App |
|---------|--------------|-------------------|------------------|
| Real-time GPS Tracking | Yes | Yes | No |
| Video Telematics | Yes (via Samsara) | Yes | No |
| Driver Safety Scoring | Yes | Yes | No |
| Fuel Price Optimization | Yes | No | Basic |
| Idling Detection | Yes | Yes | No |
| Fuel Cost Forecasting | Yes | No | Limited |
| Asset Management | Yes | Limited | No |
| Work Order Management | Yes | No | No |
| Predictive Maintenance | Yes | No | No |
| DOT Compliance | Yes | Partial | No |
| IFTA Reporting | Yes | No | Partial |
| Custom Reports | Yes | Limited | Limited |
| AI Optimization | Yes | Limited | No |
| Unified Dashboard | Yes | No | No |
| Government Audit Tools | Yes | No | No |
| Vendor Management | Yes | No | No |
| Purchase Orders | Yes | No | No |
| Internal Maintenance | Yes | No | No |

### Appendix B: Technical Specifications

**Platform Architecture:**
- Frontend: React 18 + TypeScript
- Backend: Node.js + Express (263 service classes)
- Database: PostgreSQL 15 with Row-Level Security
- Real-time: WebSocket connections
- Cloud: Azure Cloud infrastructure
- APIs: 142 REST endpoints

**Performance Metrics:**
- Response Time: Sub-1 second
- Availability: 99.9% uptime SLA
- Bundle Size: 272 KB (optimized)
- Lazy Loading: 50+ modules
- Testing: 122+ E2E tests

**Security Features:**
- SSL/TLS A+ Rating
- Azure security compliance
- SSRF/CSRF protection
- Encrypted audit logs
- RBAC with RLS

### Appendix C: Screenshot Reference Guide

| Section | Screenshot File |
|---------|-----------------|
| Fleet Dashboard | fleet-dashboard-chromium-darwin.png |
| GIS Command Center | gis-command-center-chromium-darwin.png |
| GPS Tracking | gps-tracking-chromium-darwin.png |
| Driver Performance | driver-performance-chromium-darwin.png |
| Video Telematics | video-telematics-chromium-darwin.png |
| Garage & Service | garage---service-chromium-darwin.png |
| Vendor Management | vendor-management-chromium-darwin.png |
| Parts Inventory | parts-inventory-chromium-darwin.png |
| Purchase Orders | purchase-orders-chromium-darwin.png |
| Invoices | invoices-chromium-darwin.png |
| OSHA Safety Forms | osha-safety-forms-chromium-darwin.png |
| Policy Engine | policy-engine-chromium-darwin.png |
| EV Charging | ev-charging-chromium-darwin.png |
| People Management | people-management-chromium-darwin.png |
| Tablet View | tablet-view-chromium-darwin.png |
| Executive Dashboard | agent-6-executive-dashboard.png |
| Fleet Analytics | agent-6-fleet-analytics.png |
| Data Workbench | agent-6-data-workbench.png |
| Cost Analysis | agent-6-cost-analysis.png |

---

*This proposal was prepared specifically for the City of Tallahassee Fleet Management Division*

*Capital Technology Alliance, LLC*
*Tallahassee, Florida*

*Proposal Date: January 2026*

---

**CONFIDENTIAL**

This document contains proprietary information belonging to Capital Technology Alliance, LLC. The information contained herein is intended solely for the use of the City of Tallahassee in evaluating the proposed fleet management solution. Distribution or reproduction of this document without written consent is prohibited.
