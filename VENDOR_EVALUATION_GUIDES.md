# Vendor Evaluation Guides

**Agent 19: Vendor Evaluation Specialist**

Comprehensive framework for evaluating and selecting technology vendors and partners for the Fleet Management System.

---

## Table of Contents

1. [GPS/Telematics Vendor Evaluation](#section-1-gpstelematics-vendor-evaluation)
2. [Fuel Card Provider Evaluation](#section-2-fuel-card-provider-evaluation)
3. [Video Telematics Evaluation](#section-3-video-telematics-evaluation)
4. [Cloud/Infrastructure](#section-4-cloudinfrastructure)
5. [Mapping/Routing Providers](#section-5-mappingrouting-providers)
6. [Evaluation Process](#section-6-evaluation-process)
7. [RFP Templates](#section-7-rfp-templates)
8. [Negotiation Playbook](#section-8-negotiation-playbook)
9. [Vendor Scorecard](#section-9-vendor-scorecard)

---

## SECTION 1: GPS/TELEMATICS VENDOR EVALUATION

### Vendors to Evaluate

1. **Geotab** - Leader in open platform telematics
2. **CalAmp** - Hardware and telematics provider
3. **Samsara** - Modern IoT platform
4. **Verizon Connect (Networkfleet)** - Carrier-backed solution
5. **AT&T Fleet Complete** - AT&T's fleet management offering

### Evaluation Criteria (Total: 100 points)

#### A. Technical (40 points)

| Criterion | Max Points | Description |
|-----------|-----------|-------------|
| API Quality & Documentation | 10 | Comprehensive REST/GraphQL APIs, OpenAPI specs, code samples, SDKs |
| Real-time Data Latency | 10 | Target: <30 seconds from device to cloud to API |
| Data Accuracy | 10 | GPS accuracy (±5m), OBD-II data reliability |
| Scalability | 5 | Support for 10,000+ vehicles simultaneously |
| Reliability/Uptime SLA | 5 | Target: 99.9% uptime guarantee |

#### B. Features (30 points)

| Feature | Max Points | Priority |
|---------|-----------|----------|
| OBD-II Diagnostics | 5 | Essential for compliance & maintenance |
| Driver Identification | 5 | Critical for accountability |
| Harsh Event Detection | 5 | Safety monitoring (hard braking, acceleration) |
| Geofencing Capabilities | 5 | Zone alerts and compliance |
| Mobile SDK | 5 | Driver app and fleet manager portal |
| Offline Capability | 5 | Local caching during connectivity loss |

#### C. Business (20 points)

| Factor | Max Points | Consideration |
|--------|-----------|----------------|
| Pricing Competitiveness | 5 | Per-vehicle/month, volume discounts |
| Contract Flexibility | 5 | Term length, cancellation clauses |
| Support Quality | 5 | 24/7 availability, response time SLAs |
| Partnership Potential | 5 | Revenue sharing, white-label options |

#### D. Implementation (10 points)

| Aspect | Max Points | Details |
|--------|-----------|---------|
| Onboarding Process | 5 | Typical deployment timeline: 2-4 weeks |
| Migration Tools | 5 | Data import from competing systems |

### Scoring Rubric

| Score Range | Rating | Action |
|------------|--------|--------|
| 90-100 | Excellent | Proceed to POC immediately |
| 75-89 | Good | Acceptable, schedule demo |
| 60-74 | Marginal | Address concerns, request clarifications |
| <60 | Reject | Do not proceed |

### GPS/Telematics Vendor Comparison Matrix

```
Vendor         | Technical | Features | Business | Implementation | Total | Rating
               |    /40    |   /30    |   /20    |      /10       |  /100 |
===============|===========|==========|==========|================|=======|========
Geotab         |    35     |    28    |    18    |       9        |   90  | ✓ GOOD
CalAmp         |    32     |    26    |    16    |       8        |   82  | ✓ GOOD
Samsara        |    38     |    29    |    17    |       9        |   93  | ✓ EXCELLENT
Verizon Connect|    33     |    27    |    15    |       7        |   82  | ✓ GOOD
AT&T Fleet     |    30     |    25    |    14    |       6        |   75  | ✓ ACCEPTABLE
```

### Key Evaluation Questions

**Technical:**
- What is your actual API response time for real-time location updates?
- Can you support 10,000+ concurrent vehicle tracking?
- What SLA do you guarantee for uptime?
- Do you support WebSocket connections for real-time push updates?
- What is the maximum data retention period?

**Features:**
- How granular is your OBD-II data collection?
- What AI algorithms detect harsh events?
- Can we create custom geofences via API?
- Do you support driver app in offline mode?

**Business:**
- What volume discounts are available?
- Can we negotiate a 2-year contract with 3-month exit clause?
- What support tiers do you offer?

---

## SECTION 2: FUEL CARD PROVIDER EVALUATION

### Providers to Evaluate

1. **WEX Fleet Card** - Comprehensive fuel management
2. **FleetCor** - Global fleet payment solutions
3. **Voyager Fleet Systems** - Specialized fleet fueling
4. **Shell Fleet Plus** - OEM-affiliated program
5. **ExxonMobil BusinessPro** - Energy-backed offering

### Evaluation Criteria

| Category | Weight | Key Metrics |
|----------|--------|------------|
| API Availability & Quality | 20% | REST API availability, webhook support, documentation quality |
| Transaction Data Granularity | 15% | Real-time vs. batch reporting, transaction categorization |
| Reconciliation Accuracy | 15% | Automated reconciliation, dispute resolution, audit trails |
| Network Coverage | 15% | Number of fuel stations, geographic coverage, competitors |
| Pricing Structure | 15% | Base fee, per-transaction fee, volume discounts |
| Fraud Protection | 10% | Card controls, velocity checks, unauthorized use protection |
| Mobile App Quality | 5% | Driver experience, approval workflows, expense tracking |
| Customer Support | 5% | Response time, technical support, integration assistance |

### Fuel Card Provider Decision Matrix

```
Provider          | API  | Granular | Reconcil | Coverage | Pricing | Fraud | Mobile | Support | Score
                  | /20  |   /15    |   /15    |   /15    |  /15    | /10   |  /5   |  /5    | /100
==================|======|==========|==========|==========|=========|=======|=======|========|======
WEX Fleet         |  19  |    14    |    14    |    14    |   13    |   9   |   4   |   5    |  92
FleetCor          |  18  |    13    |    15    |    15    |   12    |   9   |   4   |   5    |  91
Voyager Fleet     |  16  |    12    |    14    |    13    |   14    |   8   |   3   |   4    |  84
Shell Fleet Plus  |  15  |    11    |    13    |    14    |   15    |   8   |   3   |   4    |  83
ExxonMobil Bus    |  14  |    10    |    12    |    12    |   16    |   7   |   2   |   3    |  76
```

### Critical Integration Requirements

- **Real-time API Access:** Must support transaction data push within 30 minutes
- **Reconciliation:** Automated daily reconciliation with accounting systems
- **Card Controls:** Ability to set per-card velocity limits and merchant category restrictions
- **Mobile Integration:** Driver receipt capture and approval workflows
- **IFTA Support:** Automated fuel tax reporting for multi-state operations

---

## SECTION 3: VIDEO TELEMATICS EVALUATION

### Vendors to Evaluate

1. **Samsara** - Integrated platform with video
2. **Lytx** - Pioneer in AI-powered video analytics
3. **Netradyne** - Machine learning-driven insights
4. **SmartWitness** - Rugged camera systems
5. **Rosco** - European specialist

### Evaluation Criteria

| Criterion | Points | Details |
|-----------|--------|---------|
| AI Event Detection | 15 | Accuracy of harsh braking, distraction, drowsiness detection |
| Camera Hardware | 15 | Resolution (1080p+), night vision (infrared), durability |
| Cloud Storage Costs | 15 | Per-GB monthly, compression, retention policies |
| Real-time Streaming | 10 | Live view capability, latency requirements |
| Driver Coaching | 10 | In-vehicle alerts, mobile coaching app, analytics |
| Privacy Compliance | 10 | GDPR/CCPA support, consent management, data retention |
| Hardware Durability | 10 | MTBF, temperature rating, vibration resistance |
| Pricing Model | 10 | Per-vehicle/month, storage fees, implementation costs |
| Integration API | 5 | Third-party integration, webhook support |

### Video Telematics Vendor Matrix

```
Vendor          | AI Event | Hardware | Storage | Streaming | Coaching | Privacy | Durability | Pricing | API | Score
                |   /15    |   /15    |   /15   |    /10    |    /10   |  /10    |    /10     |  /10   | /5  | /100
================|==========|==========|=========|===========|==========|=========|============|========|====|======
Samsara         |    14    |    14    |    13   |     9     |    10    |    9    |     9      |    8   |  5 |  91
Lytx            |    15    |    13    |    12   |     8     |    10    |    9    |     8      |    7   |  4 |  86
Netradyne       |    14    |    12    |    12   |     7     |    10    |    9    |     8      |    8   |  4 |  84
SmartWitness    |    12    |    14    |    11   |     6     |    8     |    8    |    10      |    7   |  3 |  79
Rosco           |    11    |    13    |    10   |     5     |    7     |    7    |     9      |    6   |  2 |  70
```

### Critical Integration Points

- **Incident Review:** Full integration with telematics system for contextual playback
- **Driver App:** Real-time alerts visible in driver mobile application
- **Compliance:** Automated coaching completion tracking and certification
- **Insurance:** Integration with insurance provider APIs for claims support

---

## SECTION 4: CLOUD/INFRASTRUCTURE

### Primary Selection: Azure

**Rationale:**
- Enterprise support and integration
- Strong AI/ML capabilities
- Competitive pricing for long-term commitment

### Alternative Providers (If Needed)

| Provider | Strengths | Weaknesses | Use Case |
|----------|-----------|-----------|----------|
| AWS | Market leader, broad services | Complex pricing, learning curve | Scalability, ML |
| Google Cloud | Cost-effective, AI leadership | Smaller ecosystem | Analytics, ML |

### Services Comparison

#### Real-time Communication Layer

| Option | Latency | Cost/1K msgs | Scaling | Recommendation |
|--------|---------|-------------|---------|----------------|
| Azure SignalR Service | 50-100ms | $0.50 | Automatic | ✓ Primary |
| Self-hosted WebSocket | 30-50ms | $0.80 | Manual | Fallback |
| AWS AppSync | 100-150ms | $0.60 | Automatic | Alternative |

#### Machine Learning

| Service | Capability | Cost | Recommendation |
|---------|-----------|------|----------------|
| Azure ML | Custom models, end-to-end | $0.30/hr compute | ✓ Primary |
| AWS SageMaker | Pre-built models, notebooks | $0.35/hr compute | Alternative |
| Google AI | Auto ML, vision API | Usage-based | Alternative |

#### Cognitive Services

| Service | Azure | AWS | Google |
|---------|-------|-----|--------|
| Vision/Image Recognition | Computer Vision API | Rekognition | Vision AI |
| Language Processing | Text Analytics | Comprehend | NLP API |
| Speech-to-Text | Speech Service | Transcribe | Cloud Speech |
| Price per 1K requests | $1.50-3.00 | $1.00-1.50 | $1.00-1.50 |

### Cost Projection (Expected Load)

**Assumptions:**
- 5,000 vehicles reporting every 30 seconds
- 10,000 API requests/hour
- 100GB monthly storage
- 2 million messages/month via SignalR

| Component | Azure Cost | AWS Cost | Google Cost |
|-----------|-----------|---------|------------|
| Compute (VMs) | $2,000 | $2,200 | $2,100 |
| Database (SQL/NoSQL) | $1,500 | $1,600 | $1,400 |
| Real-time (SignalR/AppSync) | $500 | $600 | $550 |
| Storage (100GB) | $300 | $350 | $320 |
| AI/ML Services | $800 | $900 | $700 |
| **Monthly Total** | **$5,100** | **$5,650** | **$5,070** |
| **Annual Total** | **$61,200** | **$67,800** | **$60,840** |

**Recommendation:** Continue with Azure (cost-competitive, integrated ecosystem)

---

## SECTION 5: MAPPING/ROUTING PROVIDERS

### Providers to Evaluate

1. **Google Maps Platform** - Most comprehensive, market leader
2. **Mapbox** - Developer-friendly, customizable
3. **HERE Maps** - Strong commercial licensing
4. **Azure Maps** - Native Azure integration
5. **TomTom** - European strength, real-time traffic

### Evaluation Criteria

| Criterion | Weight | Importance |
|-----------|--------|------------|
| API Pricing | 20% | Cost per 1,000 requests, volume discounts |
| Routing Quality | 20% | Accuracy, alternative routes, traffic awareness |
| Traffic Data | 15% | Real-time accuracy, historical patterns, predictive |
| Geocoding | 15% | Address accuracy, international support |
| Offline Support | 10% | Downloaded map data, offline routing |
| Custom Styling | 10% | White-label capability, branding options |
| React Components | 5% | Native library availability, documentation |
| Commercial Licensing | 5% | White-label terms, usage rights |

### Mapping/Routing Provider Matrix

```
Provider            | Pricing | Routing | Traffic | Geocoding | Offline | Custom | React | License | Score
                    |  /20    |  /20    |  /15    |   /15     |  /10    | /10    | /5    |  /5    | /100
====================|=========|=========|=========|===========|=========|========|=======|========|======
Google Maps         |   16    |   20    |   15    |    15     |    8    |   9    |   5   |   4    |  92
Mapbox              |   18    |   19    |   14    |    14     |    9    |   10   |   5   |   5    |  94 ✓
HERE Maps           |   17    |   19    |   15    |    15     |    7    |   8    |   4   |   5    |  90
Azure Maps          |   19    |   18    |   13    |    13     |    6    |   9    |   4   |   4    |  86
TomTom              |   16    |   18    |   15    |    14     |    7    |   8    |   3   |   4    |  85
```

### Pricing Detail Comparison

**Assumptions:** 1 million requests/month

| Provider | Per-Request | 1M Requests/mo | Volume Discount | Annual Cost |
|----------|------------|----------------|-----------------|------------|
| Google Maps | $0.005-0.012 | $5,000-12,000 | 25% @ 500k+ | $45,000-108,000 |
| Mapbox | $0.002-0.005 | $2,000-5,000 | 30% @ 1M+ | $16,800-60,000 |
| HERE Maps | $0.003-0.008 | $3,000-8,000 | 20% @ 500k+ | $28,800-76,800 |
| Azure Maps | $0.0015-0.0035 | $1,500-3,500 | **40% @ 1M+** | **$10,800-25,200** |
| TomTom | $0.004-0.010 | $4,000-10,000 | 25% @ 500k+ | $36,000-90,000 |

**Recommendation:** Azure Maps (lowest cost) or Mapbox (developer experience)

### React Component Libraries

| Provider | Official Library | Third-party Options | Recommendation |
|----------|-----------------|-------------------|----------------|
| Google Maps | @react-google-maps | google-map-react | Extensive |
| Mapbox | @react-map-gl | mapbox-gl | ✓ Best-in-class |
| HERE Maps | here-sdk-for-web | Limited | Basic |
| Azure Maps | azure-maps-react | Limited | Minimal |
| TomTom | TomTomSDK | Limited | Basic |

---

## SECTION 6: EVALUATION PROCESS

### Timeline Overview

**Total Duration: 6-8 weeks per vendor category**

### Phase 1: RFI (Request for Information)

**Duration: Week 1-2**

**Activities:**
1. Prepare comprehensive questionnaire (20-30 questions)
2. Send to all vendors simultaneously
3. Review marketing materials and case studies
4. Check analyst reports (Gartner, Forrester, G2)
5. Verify customer references from company website

**Deliverables:**
- Vendor questionnaire responses
- Analyst report summary
- Initial scoring (60+ to advance)

**Go/No-Go Decision:** Advance top 3 vendors to Phase 2

### Phase 2: Demo & Documentation Review

**Duration: Week 2-3**

**Activities:**
1. Schedule 2-hour product demo with each vendor
2. Review API documentation in detail
3. Test API sandbox/staging environment
4. Request code samples (JavaScript/Python)
5. Assess support documentation quality

**Evaluation Checklist:**
- [ ] Demo covers all required features
- [ ] API dashboard is intuitive
- [ ] Code samples execute without errors
- [ ] Documentation is comprehensive and current
- [ ] Support team is responsive

**Deliverables:**
- Demo notes and recordings
- API documentation assessment
- Updated scoring

**Go/No-Go Decision:** Select top 2 vendors for POC (minimum 75 points)

### Phase 3: POC (Proof of Concept)

**Duration: Week 4-5 (2 weeks each)**

**Objectives:**
- Validate technical integration feasibility
- Measure actual performance metrics
- Test with real or realistic data
- Verify SLA guarantees
- Identify integration challenges

**Technical POC Checklist:**

```
INTEGRATION TESTING
[ ] Successfully authenticate to API
[ ] Retrieve first 100 records without errors
[ ] Pagination/rate limiting documented
[ ] Error handling verified
[ ] Data model matches specification

PERFORMANCE TESTING
[ ] API response time: < 1 second (target)
[ ] Data accuracy: ≥ 95% (target)
[ ] Concurrent users: 100+ simultaneous requests
[ ] Load test: 10,000 vehicles/5-minute update cycle
[ ] Database query performance < 500ms

DATA VALIDATION
[ ] GPS accuracy within ±5 meters
[ ] OBD-II data matches vehicle specifications
[ ] Timestamps synchronized within ±1 second
[ ] No data loss during 48-hour test period

OPERATIONAL
[ ] Support team response time < 2 hours
[ ] Documentation clarity for developers
[ ] Error messages are actionable
[ ] Monitoring/alerting available
```

**POC Success Criteria:**
- ✓ 95%+ uptime during testing
- ✓ API response time < 1,500ms at p95
- ✓ Data accuracy ≥ 95%
- ✓ All integration points functional
- ✓ Support response time < 4 hours

**Deliverables:**
- POC technical report
- Performance metrics spreadsheet
- Integration architecture diagram
- Risk assessment

**Go/No-Go Decision:** Score ≥ 75 points AND all POC criteria met

### Phase 4: Commercial Negotiation

**Duration: Week 5-6**

**Activities:**
1. Request detailed pricing based on volume
2. Obtain contract template and review legal terms
3. Contact 3 customer references
4. Negotiate SLA and support terms
5. Discuss implementation timeline and costs

**Pricing Request Template:**
```
Volume: 5,000 vehicles
Contract term: 2 years
Expected features: [list all required]

Requested pricing:
- Per-vehicle monthly fee
- Setup/implementation costs
- Support tier options
- Volume discount schedule
- Price protection for term
```

**Customer Reference Calls (3 minimum):**
- Ask about implementation timeline
- Inquire about support quality
- Question API reliability/performance
- Discuss pricing vs. value
- Ask about challenges/issues

**Negotiation Points:**

| Term | Target | Rationale |
|------|--------|-----------|
| Contract length | 2 years | Avoid long lock-in, flexibility |
| Early exit | 90-day notice | Allows vendor change if issues |
| Price increase | Max 5%/year | Control costs, budget predictability |
| SLA | 99.9% uptime | Industry standard |
| Data portability | Included | Exit strategy |
| Support response | < 4 hours | Critical for operations |

**Deliverables:**
- Pricing comparison table
- Contract summary document
- Reference call notes
- Negotiation worksheet

### Phase 5: Final Decision & Approval

**Duration: Week 7**

**Activities:**
1. Score each vendor using complete rubric
2. Prepare executive summary (1-2 pages)
3. Present to selection committee
4. Obtain executive approval
5. Schedule contract signing

**Executive Summary Template:**

```
VENDOR SELECTION RECOMMENDATION

Recommendation: [Vendor Name]
Overall Score: XX/100
Status: ✓ APPROVED FOR PRODUCTION

COMPARATIVE SCORES:
- Vendor A: 92/100
- Vendor B: 88/100
- Vendor C: 82/100

KEY DIFFERENTIATORS:
1. [Most important factor]
2. [Secondary factor]
3. [Cost advantage/consideration]

RISKS & MITIGATION:
1. [Risk] → [Mitigation strategy]

FINANCIAL IMPACT:
- Year 1 cost: $XX,XXX
- Year 2+ cost: $XX,XXX/year
- Break-even: [timeframe]

IMPLEMENTATION:
- Go-live target: [Date]
- Resources required: [X people]
- Parallel run period: [X weeks]

NEXT STEPS:
1. Finalize contract
2. Kick-off implementation
3. Assign project manager
4. Schedule team training
```

**Go/No-Go Decision:** Executive approval required for contract signature

---

## SECTION 7: RFP TEMPLATES

### RFP Template: GPS/Telematics Vendor

```
REQUEST FOR PROPOSAL (RFP)
GPS/Telematics Solution for Fleet Management

ISSUED BY: [Company Name]
DATE: [Date]
RESPONSE DUE: [Date]
PROPOSAL VALID FOR: 30 days

═══════════════════════════════════════════════════════════

1. COMPANY OVERVIEW

1.1 Fleet Profile
- Current fleet size: 5,000 vehicles
- Vehicle types: Commercial trucks, vans, light duty
- Primary operational area: North America
- Growth projection: +1,000 vehicles/year

1.2 Current State
- Legacy telematics provider: [Name]
- Data sources: OBD-II, GPS, driver input
- Integration points: Accounting, maintenance, HR systems
- Current challenges: [Specific problems]

1.3 Strategic Goals
- Improve driver safety
- Reduce fuel costs
- Optimize routes
- Enhance compliance tracking
- Enable real-time dispatch

═══════════════════════════════════════════════════════════

2. FUNCTIONAL REQUIREMENTS

2.1 Data Collection (Critical)
- Real-time GPS location (latitude, longitude, altitude)
- Vehicle diagnostics (speed, RPM, fuel level, engine hours)
- OBD-II fault codes with descriptions
- Driver identification (badge, biometric, mobile app)
- Door open/close events
- Harsh event detection (acceleration, braking, cornering)

2.2 Data Availability (Critical)
- Real-time API access to current vehicle status
- Historical data retrieval (minimum 24 months)
- Bulk data export capability (CSV, JSON)
- WebSocket support for real-time updates
- Webhook callbacks for critical events

2.3 Geofencing (Important)
- Create/update/delete geofences via API
- Support for polygon, circular, and point-based zones
- Alert routing to mobile app and backend
- Historical breach reporting
- Custom field support (zone type, priority)

2.4 Reporting (Important)
- Pre-built report templates (safety, compliance, efficiency)
- Custom report builder
- Scheduled email delivery
- Export to Excel/PDF
- Real-time dashboard with alerts

═══════════════════════════════════════════════════════════

3. TECHNICAL SPECIFICATIONS

3.1 API Requirements
- RESTful API with JSON payloads
- OAuth 2.0 authentication
- Comprehensive API documentation
- Sandbox environment for testing
- Rate limiting: ≥ 10,000 requests/minute
- Response time: < 1 second (p95)
- Uptime SLA: 99.9%

3.2 Data Integration
- SFTP import/export capability
- FTP file transfer for bulk data
- Database replication options
- Real-time event streaming
- Standard data formats (JSON, CSV, SQL Server compatible)

3.3 Security & Compliance
- Data encryption in transit (TLS 1.2+)
- Data encryption at rest
- HIPAA compliance (if health data involved)
- SOC 2 Type II certification
- GDPR/CCPA compliance
- Role-based access control (RBAC)
- Audit logging of all API access

3.4 Scalability
- Support minimum 10,000 concurrent vehicles
- Handle 100,000+ API requests/hour
- Sub-second query response for 24-month historical data
- Automatic scaling with load
- Disaster recovery with <4 hour RTO

═══════════════════════════════════════════════════════════

4. COMMERCIAL TERMS

4.1 Pricing
Please provide pricing for the following scenarios:
a) Year 1-2: 5,000 vehicles
b) Year 3-4: 7,500 vehicles
c) Year 5+: 10,000+ vehicles

Include:
- Per-vehicle monthly fee
- Setup/implementation costs
- Training costs
- Annual support costs
- Professional services rates ($/hour)

4.2 Contract Terms
- Preferred contract length: 2 years
- Preferred renewal terms: Annual
- Required SLA: 99.9% uptime
- Data portability: Required upon exit
- Price protection: Maximum 5% annual increase

4.3 Support & Services
- Minimum support: 24/7 availability
- Response time: Critical issues < 4 hours
- Implementation manager assigned
- Dedicated technical contact
- Quarterly business reviews
- Training for 10+ team members included

═══════════════════════════════════════════════════════════

5. RESPONSE FORMAT

5.1 Executive Summary (max 1 page)
- Company overview
- Why your solution is best fit
- Key competitive advantages

5.2 Technical Proposal (max 10 pages)
- Functional requirement coverage
- Technical architecture
- Integration approach
- Security/compliance details
- Scalability demonstration

5.3 Commercial Proposal (max 5 pages)
- Detailed pricing table
- Contract terms (include template)
- Support service level details
- Implementation timeline

5.4 References (min 3)
- Company name, industry
- Fleet size, deployment date
- Contact name and phone number
- Specific use cases implemented

5.5 Supporting Documentation
- Product brochures
- API documentation
- Customer case studies
- Compliance certifications
- SLA documentation

═══════════════════════════════════════════════════════════

6. EVALUATION CRITERIA

| Criterion | Weight | Score |
|-----------|--------|-------|
| Functional completeness | 30% | /10 |
| Technical architecture | 25% | /10 |
| Implementation capability | 20% | /10 |
| Commercial terms | 15% | /10 |
| References/customer success | 10% | /10 |
| **TOTAL** | **100%** | **/50** |

**Selection Criteria:**
- Minimum acceptable score: 40/50
- Technical evaluation: ≥ 75%
- Reference feedback: Positive from 100% of contacts

═══════════════════════════════════════════════════════════

7. EVALUATION TIMELINE

Date | Activity
-----|----------
[D-30] | RFP issued to vendors
[D-21] | Vendor questions deadline
[D-14] | Written responses due
[D-7] | Initial proposal review
[D-0] | Demo & Q&A session
[D+7] | Final clarifications requested
[D+14] | Vendor finalists announced
[D+21] | POC begins (2-week duration)
[D+35] | Final decision & contract signature

═══════════════════════════════════════════════════════════

8. TERMS & CONDITIONS

- All responses become property of [Company]
- NDA required before proprietary data sharing
- No response guarantee; right to reject all proposals
- Pricing valid for 30 days from submission
- Verbal responses do not constitute commitment
- One mandatory in-person meeting required

═══════════════════════════════════════════════════════════

CONTACT INFORMATION

RFP Manager: [Name]
Email: [Email]
Phone: [Phone]
Address: [Address]

Submit responses by [Date] to: [Email]

```

### RFP Template: Fuel Card Provider

Similar structure to above, with sections focused on:
- Network coverage requirements (station count by region)
- Transaction data feed specifications (API polling frequency)
- Reconciliation requirements (daily/hourly)
- Fraud prevention capabilities
- Mobile app requirements
- Integration with accounting systems
- Pricing based on transaction volume (not just flat fees)

### RFP Template: Video Telematics

Similar structure with emphasis on:
- Camera specifications (resolution, night vision, durability)
- Cloud storage architecture and retention
- AI detection accuracy benchmarks
- Driver coaching workflow integration
- Privacy and consent management
- Real-time streaming requirements
- Mobile app functionality

---

## SECTION 8: NEGOTIATION PLAYBOOK

### Pre-Negotiation Preparation

**Competitive Intelligence:**
1. Obtain pricing from minimum 3 competitors
2. Research industry benchmarks (G2, Gartner)
3. Identify your walk-away price
4. Know your true urgency level
5. Calculate total cost of ownership vs. alternatives

**Internal Alignment:**
- [ ] Executive approval on budget
- [ ] Consensus on must-haves vs. nice-to-haves
- [ ] Authority level established (who can approve)
- [ ] Timeline communicated to vendor
- [ ] Escalation path defined

### Price Negotiation Strategy

#### Volume Discounts

**Approach:**
```
Current Request: 5,000 vehicles @ $X/month = $60X/year

Present scenario:
"We have opportunity to expand to 10,000 vehicles
in Year 3 if performance meets targets.
What volume discount can you offer?"

Expected Progression:
- 5,000 units: $X/month (baseline)
- 7,500 units: $X/month × 0.90 (10% discount)
- 10,000 units: $X/month × 0.85 (15% discount)
```

**Negotiation Tactic:** Frame growth opportunity to unlock discounts now

#### Multi-Year Commitment

**Approach:**
```
Standard: Year 1 = $X, Year 2 = $X
Proposed: Commit to 2-year deal for discount

Calculation:
If monthly fee is $300/vehicle:
- Annual total (5,000 vehicles): $18,000,000
- Multi-year commitment discount: 8-12% typical
- Savings: $1,440,000 - $2,160,000 over 2 years
```

**Negotiation Tactic:** Position as cost certainty for both parties

#### Bundling Discounts

**Approach:**
```
If evaluating multiple vendors:
"We're considering bundling GPS + Video + Fuel Card
if pricing becomes competitive. What bundling
discounts can you offer?"
```

**Bundling Combinations:**
- GPS + Video Telematics: 5-10% discount
- GPS + Fuel Card Integration: 3-5% discount
- All three: 10-15% discount possible

**Negotiation Tactic:** Create competitive urgency through bundling

#### Competitor Pricing Leverage

**Approach:**
```
Competitor A quote: $25/vehicle/month
Your quote: $30/vehicle/month

"Competitor A quoted $25/month. To proceed with you,
we'd need to match or beat that pricing. Can you?"

Typical responses:
1. "We can match at $25" → Success
2. "Best we can do is $27" → Negotiate difference
3. "Our service is worth $30" → Walk or find compromise
```

**Negotiation Tactic:** Use actual competing quotes (not hypothetical)

### Contract Term Negotiations

#### Contract Length

**Current Trend:**
- Vendors prefer: 3-year minimum
- Industry standard: 2-year
- Your position: 1-2 year preferred

**Negotiation Strategy:**
```
Position A (Weak): "We want 1 year"
→ Vendor rejects immediately

Position B (Strong): "We prefer 2 years. This allows us
time to evaluate your solution fully. For Year 3, we'd
renew if performance meets SLA targets."
→ Vendor sees path to renewal

Position C (Strongest): "To justify technology
transition costs internally, we need minimum 2-year
term with option to renew at 5% discount for Year 3+
based on performance."
→ Positions as mutual partnership
```

**Acceptable Terms:**
- 2-year initial term + optional 1-year renewal at locked price
- 3-year term with 90-day cancellation clause
- Monthly commitment with 60-day notice required

#### Exit Clauses

**Critical to Negotiate:**

```
Scenario 1: Vendor underperformance
"If you fail to meet 99.9% SLA for 2 consecutive months,
we can terminate with 30-day notice and no penalty."

Scenario 2: Merger/acquisition
"If our company is acquired or merged, we can terminate
within 60 days of transaction closing."

Scenario 3: API/integration issues
"If API response time exceeds 2 seconds (p95) for
30 consecutive days, we can terminate with notice."

Scenario 4: Data portability
"You must provide complete historical data export within
30 days of termination in industry-standard formats
(CSV, JSON, SQL dump)."
```

**Negotiation Language:**
- "Can we add a clause for system performance failures?"
- "What's your policy if integration doesn't work as expected?"
- "We need assurance that we can exit if..."

#### Price Protection

**Standard Approach:**
```
Year 1: $300/vehicle/month
Year 2: $300 + CPI (max 5%) = ~$315
Year 3 (if renewing): $315 + CPI (max 5%) = ~$330
```

**Negotiation Tactic:**
"For contract stability, we need price increases capped at 5% annually,
with CPI as the baseline mechanism."

**Alternative**: Fixed price guarantee for full contract term
"Can you offer a locked price through year 2?"
- Beneficial if current rates are competitive
- Protects against market rate increases

### Support & SLA Negotiations

#### Uptime SLA

```
Your requirement: 99.9% uptime (8.7 hours downtime/month)

Negotiate:
- Definition of "uptime" (API availability, not UI)
- Exclusions (scheduled maintenance window)
- Measurement method (third-party monitoring)
- Penalties for breach (service credits)

Example clause:
"Vendor guarantees 99.9% API availability, measured
minute-by-minute. Scheduled maintenance windows (max
4 hours/month with 7-day notice) excluded.
Breaches result in 10% monthly credit per 0.1% below SLA."
```

#### Support Response Time

```
Critical Issue (system down):
- Your target: 30-minute response, 2-hour resolution
- Negotiate: Dedicated phone line, escalation path

Important Issue (degraded performance):
- Your target: 4-hour response, 8-hour resolution
- Negotiate: Named contact, email + phone support

Routine Issue (questions, data):
- Your target: 24-hour response
- Negotiate: Support portal with ticket tracking
```

#### Dedicated Resources

**Negotiate for:**
- Dedicated account manager (1 FTE equivalent)
- Named technical contact for API issues
- Quarterly business review meetings
- Annual onsite visit (2 days) included
- Access to senior engineers for complex issues

### Data & Integration Negotiations

#### Data Ownership

**Critical Language:**
```
"All data collected about our vehicles and drivers
remains our property. You provide warehouse and API
access, but we retain all intellectual property rights
to the data and insights derived from it."
```

#### API Access

```
"We require:
- Unrestricted API access to all current and historical data
- No artificial limits on query volume (within reason)
- Ability to export complete dataset in standard formats
- Right to integrate with third-party analytics tools"
```

#### Data Residency

```
"All data must be stored in [specific region].
If you do not have a local data center, we require
contractual commitment to either:
1. Build within 12 months, or
2. Provide pricing discount to competitor"
```

### Negotiation Playbook Summary

**Before Negotiation:**
1. ✓ Know your walk-away price (BATNA)
2. ✓ Obtain 3+ competing quotes
3. ✓ Identify vendor's motivation
4. ✓ Get executive approval on negotiation authority

**During Negotiation:**
1. ✓ Start with "most important" item (usually price)
2. ✓ Use data to justify positions
3. ✓ Look for creative trade-offs
4. ✓ Never accept "standard terms" without pushback
5. ✓ Always ask "Can you do better?"

**Negotiation Wins to Prioritize:**
1. Price (largest financial impact)
2. Contract length (flexibility)
3. Exit clauses (risk mitigation)
4. SLA/uptime (operational reliability)
5. Support response time (business continuity)

**Red Flags During Negotiation:**
- Vendor unwilling to discuss terms
- "Take it or leave it" ultimatum
- Vague SLA definitions
- Refusal to commit to data portability
- No customer references available

---

## SECTION 9: VENDOR SCORECARD

### Quarterly Vendor Performance Review

Use this template quarterly to assess vendor performance and identify improvement opportunities.

#### Scorecard Template

```
═══════════════════════════════════════════════════════════
VENDOR SCORECARD - QUARTERLY REVIEW
═══════════════════════════════════════════════════════════

Vendor Name: [Vendor]
Review Period: Q1 2025 (Jan 1 - Mar 31)
Report Date: Apr 15, 2025
Prepared By: [Name], [Title]

─────────────────────────────────────────────────────────────
PERFORMANCE METRICS
─────────────────────────────────────────────────────────────

Category: Technical Performance
┌─────────────────────────────────────┬────────┬─────────┬───────┐
│ Metric                              │ Target │ Actual  │ Score │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ API Uptime                          │ 99.9%  │ 99.73%  │  8/10 │
│ API Response Time (p95)             │ <1s    │ 1.2s    │  7/10 │
│ Data Accuracy (GPS)                 │ >95%   │ 96.5%   │  9/10 │
│ Data Accuracy (OBD-II)              │ >98%   │ 97.2%   │  8/10 │
│ Scheduled Maintenance Windows       │ 0      │ 1 (4h)  │  9/10 │
│ Data Loss Events                    │ 0      │ 0       │ 10/10 │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ TECHNICAL SCORE (Weighted Average)  │        │         │  8.2  │
└─────────────────────────────────────┴────────┴─────────┴───────┘

Category: Support Quality
┌─────────────────────────────────────┬────────┬─────────┬───────┐
│ Metric                              │ Target │ Actual  │ Score │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ Critical Issue Response Time        │ <30m   │ 22m     │ 10/10 │
│ Critical Issue Resolution Time      │ <2h    │ 1.5h    │  9/10 │
│ Important Issue Response Time       │ <4h    │ 3.5h    │  9/10 │
│ Important Issue Resolution Time     │ <8h    │ 6.2h    │  9/10 │
│ Routine Issue Response Time         │ <24h   │ 18h     │ 10/10 │
│ Support Ticket Resolution Rate      │ 100%   │ 98%     │  8/10 │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ SUPPORT SCORE (Weighted Average)    │        │         │  9.2  │
└─────────────────────────────────────┴────────┴─────────┴───────┘

Category: Cost Management
┌─────────────────────────────────────┬────────┬─────────┬───────┐
│ Metric                              │ Target │ Actual  │ Score │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ Monthly Cost (5,000 vehicles)       │$60,000 │$61,200  │  7/10 │
│ Overage Charges                     │ $0     │ $0      │ 10/10 │
│ API Rate Limit Compliance           │ 100%   │ 99%     │  8/10 │
│ Unexpected Fees/Charges             │ $0     │ $0      │ 10/10 │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ COST SCORE (Weighted Average)       │        │         │  8.75 │
└─────────────────────────────────────┴────────┴─────────┴───────┘

Category: Product Features
┌─────────────────────────────────────┬────────┬─────────┬───────┐
│ Metric                              │ Target │ Actual  │ Score │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ Feature Availability (per roadmap)  │ 100%   │ 85%     │  7/10 │
│ Feature Stability (no regressions)  │ 100%   │ 100%    │ 10/10 │
│ API Enhancement Releases            │ 2/qtr  │ 1       │  5/10 │
│ Documentation Updates               │ 4/qtr  │ 3       │  7/10 │
├─────────────────────────────────────┼────────┼─────────┼───────┤
│ FEATURES SCORE (Weighted Average)   │        │         │  7.25 │
└─────────────────────────────────────┴────────┴─────────┴───────┘

─────────────────────────────────────────────────────────────
OVERALL SCORECARD
─────────────────────────────────────────────────────────────

┌──────────────────────┬────────┬────────┬────────┬────────┐
│ Category             │ Weight │ Score  │ Weight │ Overall│
├──────────────────────┼────────┼────────┼────────┼────────┤
│ Technical            │  40%   │  8.2   │  3.28  │        │
│ Support              │  30%   │  9.2   │  2.76  │        │
│ Cost                 │  20%   │  8.75  │  1.75  │        │
│ Features             │  10%   │  7.25  │  0.73  │        │
├──────────────────────┼────────┼────────┼────────┼────────┤
│ **OVERALL SCORE**    │ **100%**│        │        │**8.52**│
└──────────────────────┴────────┴────────┴────────┴────────┘

PERFORMANCE RATING: ★★★★☆ (GOOD - 8.5/10)

─────────────────────────────────────────────────────────────
ISSUES & INCIDENTS
─────────────────────────────────────────────────────────────

**Reported Issues:**
1. API response time degradation during peak hours
   - Impact: Batch imports slowed from 1m to 1.2s
   - Root cause: Database query optimization needed
   - Resolution: In progress, target fix Q2
   - Status: ⚠ IN PROGRESS

2. Mobile app crashes on Android 12
   - Impact: 50 users affected
   - Root cause: API deprecated endpoint
   - Resolution: Completed, app updated
   - Status: ✓ RESOLVED

3. Documentation out of date for new API endpoints
   - Impact: Developer confusion, support tickets
   - Root cause: Documentation update process
   - Resolution: Adding to Q2 roadmap
   - Status: ⚠ PLANNED

**Unresolved Items:**
- [ ] Missing webhook callback for [specific event]
- [ ] Rate limiting unclear in documentation
- [ ] Historical data export limited to 90 days

─────────────────────────────────────────────────────────────
VENDOR ROADMAP REVIEW
─────────────────────────────────────────────────────────────

**Q2 2025 Roadmap (per vendor):**
- New real-time dashboard
- GraphQL API support
- Enhanced geofencing (polygon support)
- Historical data retention (5 years)

**Our Requirements Alignment:**
✓ Real-time dashboard - NEEDED
✓ GraphQL API - NICE TO HAVE
✓ Geofencing enhancements - NEEDED
✓ 5-year history - NEEDED (we requested this)

**Recommendation:** Roadmap aligns well with requirements

─────────────────────────────────────────────────────────────
RENEWAL CONSIDERATION
─────────────────────────────────────────────────────────────

Current contract expires: Dec 31, 2025
Auto-renewal trigger: If score ≥ 8.0 → PROCEED
Renegotiation needed: Cost should not increase >5%

**Renewal Status:** ✓ ON TRACK FOR RENEWAL
**Next Review:** Q3 2025 (should check renewal pricing)

─────────────────────────────────────────────────────────────
EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────

Vendor is performing well overall with 8.52/10 score.
Technical performance is solid (99.73% uptime vs 99.9% target).
Support team is responsive and helpful (9.2/10).

Key areas for improvement:
1. API response time during peak hours (currently 1.2s vs 1s target)
2. Feature delivery pace (1 vs 2 expected releases this quarter)
3. Documentation maintenance process

Recommended actions:
1. Schedule quarterly business review to discuss API optimization
2. Request detailed Q2 roadmap with dates
3. Request discount review ahead of renewal
4. Start evaluating competing vendors for comparison pricing

Recommendation: **CONTINUE PARTNERSHIP**
- Cost is reasonable and includes undisclosed volume discount
- Support quality is excellent
- Technical performance is acceptable
- Switching costs would exceed any savings

─────────────────────────────────────────────────────────────
NEXT REVIEW: Q2 2025 (approx Jun 30, 2025)
─────────────────────────────────────────────────────────────
```

### Vendor Scorecard Metrics Definitions

#### Technical Performance Metrics

| Metric | Definition | Measurement | Target |
|--------|-----------|------------|--------|
| API Uptime | Percentage of time API is responding within SLA | External monitoring tool (e.g., StatusPage) | 99.9% |
| Response Time (p95) | 95th percentile of API response time | Log analysis from your API clients | <1 second |
| Data Accuracy | Percentage of data points matching ground truth | Monthly spot checks (5% sample) | >95% |
| Data Loss Events | Number of records lost due to vendor issue | Count from incident reports | 0 |
| Maintenance Windows | Number/duration of planned downtime | Per contract SLA | ≤4 hours/month |

#### Support Quality Metrics

| Metric | Definition | Measurement | Target |
|--------|-----------|------------|--------|
| Response Time | Time from ticket creation to first response | Ticket system timestamp | <4 hours (important) |
| Resolution Time | Time from ticket creation to resolution | Ticket system timestamp | <8 hours (important) |
| Resolution Rate | Percentage of tickets closed without reopening | Closed tickets / total tickets | ≥95% |
| Satisfaction | NPS or CSAT from support interactions | Survey after each support ticket | ≥8/10 |
| Escalation Rate | Percentage of tickets escalated to engineering | Escalated / total tickets | <20% |

#### Cost Management Metrics

| Metric | Definition | Measurement | Target |
|--------|-----------|------------|--------|
| Cost vs. Budget | Actual monthly cost vs. contracted rate | Invoice amount | ≤ budget |
| Overage Charges | Unexpected fees beyond contracted scope | Invoice review | $0 |
| Volume Compliance | Actual vehicle count vs. contracted | Fleet database count | ≤ contracted |
| Rate Increase | Year-over-year price change | Compare annual contracts | ≤5% |

#### Feature & Product Metrics

| Metric | Definition | Measurement | Target |
|--------|-----------|------------|--------|
| Roadmap Alignment | % of roadmap items matching your needs | Compare roadmap to requirements | ≥80% |
| API Releases | Number of new/updated API endpoints | Release notes | ≥2/quarter |
| Documentation Currency | % of documentation reflecting current API | Check examples vs. live API | ≥95% |
| Regression Bugs | Critical bugs in existing features | Incident reports | <1/quarter |

### Escalation Triggers

Automatic escalation if any of these occur:

```
CRITICAL (Escalate to executive sponsor):
- Uptime falls below 99.0% in a month
- Unresolved critical issue >24 hours
- Unexpected fees >5% of monthly contract
- Data loss or corruption incident
- API breaking change without notice
- Vendor indicates potential bankruptcy/acquisition

IMPORTANT (Escalate to product team):
- Average response time >8 hours (2 consecutive weeks)
- Feature roadmap misses >20% of committed items
- Documentation out of date by >30 days
- Data accuracy falls below 90%

STANDARD (Address in next vendor call):
- Minor bugs or documentation issues
- Feature requests from product team
- Pricing increase discussion
- Service improvement suggestions
```

---

## APPENDIX: VENDOR EVALUATION CHECKLIST

### Pre-RFP Checklist

- [ ] Identified all vendor categories requiring evaluation
- [ ] Assembled evaluation committee (technical, product, finance)
- [ ] Defined scoring rubric and weights
- [ ] Identified must-have vs. nice-to-have requirements
- [ ] Set timeline for evaluation process
- [ ] Obtained budget approval from finance/executive team
- [ ] Assigned project manager for vendor evaluation
- [ ] Created evaluation scoresheet template

### RFP Checklist

- [ ] RFP document comprehensive and clear
- [ ] Evaluation criteria clearly stated
- [ ] Response format and deadline specified
- [ ] Sent to minimum 5 vendors per category
- [ ] Confirmed vendors received and understood RFP
- [ ] Tracked RFP Q&A and vendor clarifications
- [ ] Scheduled demos for all responding vendors

### Demo & Documentation Review

- [ ] Attended live product demos
- [ ] Tested API sandbox environment
- [ ] Reviewed API documentation
- [ ] Ran code examples from documentation
- [ ] Documented feature coverage for each vendor
- [ ] Scored each vendor on demo performance
- [ ] Submitted follow-up questions based on demo

### POC Checklist

- [ ] Signed POC agreement and NDA if needed
- [ ] Received API credentials and access
- [ ] Set up test environment
- [ ] Created test data set (representative of production)
- [ ] Implemented basic API integration
- [ ] Ran performance/load tests
- [ ] Tested error handling and edge cases
- [ ] Documented findings and issues
- [ ] Scored POC based on success criteria

### Commercial Negotiation

- [ ] Obtained detailed pricing from finalists
- [ ] Conducted reference calls (3+ customers per vendor)
- [ ] Reviewed standard contract terms
- [ ] Identified contract items to negotiate
- [ ] Obtained competing quotes for leverage
- [ ] Negotiated pricing, terms, and support SLAs
- [ ] Had legal review final contract
- [ ] Obtained executive approval for contract terms

### Vendor Selection & Onboarding

- [ ] Notified winning vendor and runner-ups
- [ ] Executed final contract
- [ ] Assigned dedicated account manager
- [ ] Scheduled kickoff meeting
- [ ] Created implementation project plan
- [ ] Set up monitoring and alerting for production
- [ ] Scheduled initial training session
- [ ] Established escalation procedures

### Ongoing Management

- [ ] Created quarterly review schedule
- [ ] Assigned scorecard owner
- [ ] Set up vendor communication cadence (monthly calls)
- [ ] Established renewal process (6 months before expiration)
- [ ] Configured vendor scorecard dashboard
- [ ] Created incident response procedures
- [ ] Planned annual business review meeting

---

## QUICK REFERENCE

### Vendor Selection Timeline

```
Week 1-2:  RFI Phase (Questionnaire & Initial Screening)
Week 2-3:  Demo & Documentation Review
Week 4-5:  POC (Proof of Concept)
Week 5-6:  Commercial Negotiation & References
Week 7:    Final Decision & Contract Signature
```

### Scoring Decision Points

```
RFI Phase:        ≥60 points → Advance to Demo
Demo Phase:       ≥75 points → Advance to POC
POC Phase:        ≥75 points + SLA met → Advance to Commercial
Commercial Phase: ≥80 points + terms acceptable → Award contract
```

### Key Negotiation Wins (Priority Order)

1. **Price** - Largest financial impact
2. **Contract Length** - Risk mitigation (prefer 2 years max)
3. **Exit Clauses** - Flexibility to change vendors
4. **SLA/Uptime** - Operational reliability
5. **Support Response** - Business continuity
6. **Data Portability** - Exit strategy

### Red Flags

- Vendor unwilling to negotiate key terms
- No customer references available
- SLA includes excessive exclusions
- Long contract lock-in (>3 years)
- High switching costs documented in contract
- Unclear pricing with hidden fees

---

**Document Version:** 1.0
**Last Updated:** November 2024
**Next Review:** Quarterly with Procurement Team
