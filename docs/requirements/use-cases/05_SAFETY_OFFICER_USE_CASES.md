# Safety Officer - Use Cases

**Role**: Safety Officer
**Access Level**: Specialized (Safety and compliance focus)
**Primary Interface**: Web Dashboard (Desktop-first: 90% desktop, 10% mobile)
**Version**: 1.0
**Date**: November 10, 2025

---

## Table of Contents
1. [Incident Investigation and Analysis](#epic-1-incident-investigation-and-analysis)
2. [Driver Training and Certification Tracking](#epic-2-driver-training-and-certification-tracking)
3. [Video Telematics Review and Coaching](#epic-3-video-telematics-review-and-coaching)
4. [Safety Compliance Monitoring](#epic-4-safety-compliance-monitoring)
5. [Risk Assessment and Mitigation](#epic-5-risk-assessment-and-mitigation)

---

## Epic 1: Incident Investigation and Analysis

### UC-SO-001: Manage and Investigate Fleet Incidents

**Use Case ID**: UC-SO-001
**Use Case Name**: Manage and Investigate Fleet Incidents
**Actor**: Safety Officer (primary), Dispatcher (secondary), Driver (secondary)
**Priority**: High

#### Preconditions:
- Safety Officer is logged into the safety dashboard
- Incident reporting system is operational
- Telematics data is available for incident vehicles
- Document storage (Azure Blob Storage) is accessible

#### Trigger:
- New incident is reported by driver or detected by telematics system
- Safety Officer opens incident management dashboard
- Safety Officer searches for specific incident

#### Main Success Scenario:
1. Driver reports accident via mobile app: "Rear-end collision at red light"
2. System creates incident record: INC-2025-0847
3. Safety Officer receives notification and opens incident details
4. System displays incident overview:
   - Incident ID: INC-2025-0847
   - Type: Collision - Rear-end
   - Severity: Major (vehicle damage, driver shaken)
   - Time: 2:47 PM
   - Location: I-95 North, MM 47, Springfield, MA
   - Driver: John Smith (Employee ID: DRV-001)
   - Vehicle: #455 (2022 Freightliner Cascadia)
   - Status: Reported (not under investigation yet)

5. Safety Officer clicks "Begin Investigation"
6. System displays incident investigation form with required fields:
   - 5 Whys analysis template
   - Fishbone diagram builder
   - Supporting document upload section
   - Investigation notes text area
   - Timeline tracker

7. Safety Officer gathers initial information:
   - Contacts driver John: "Were you injured? Any other parties involved?"
   - John confirms: "Minor soreness, other driver in blue sedan, police on scene"

8. Safety Officer uploads supporting documents:
   - Police accident report PDF (scanned)
   - Photos of vehicle damage (3 images)
   - Medical assessment form (driver cleared)
   - Witness statement from other driver

9. Safety Officer performs 5 Whys analysis:
   - Why did collision occur? → Driver John struck stationary vehicle
   - Why was vehicle stationary? → Traffic signal was red
   - Why didn't John stop? → Driver did not see brake light in time (reaction delay)
   - Why was there reaction delay? → Glare from sun obscured brake light visibility
   - Why was sun glare a factor? → Vehicle positioned in low sun angle position

10. Safety Officer creates corrective action plan:
    - Action 1: Advise John on mirror adjustment and sun glare awareness (coaching)
    - Action 2: Schedule refresher safety training on defensive driving (due in 30 days)
    - Action 3: Flag for incident trend review (assess if glare-related incidents increasing)

11. Safety Officer assigns investigation to Dispatcher Mike: "Review traffic conditions and identify if other drivers report similar visibility issues"

12. System creates workflow with status: "Under Investigation" with due date 7 days

13. Investigation progresses over 5 days:
    - Mike provides feedback: "No other incidents on this route this week"
    - Safety Officer updates status: "No pattern identified - isolated incident"
    - Corrective actions recorded as assigned

14. After John completes refresher training, Safety Officer marks action complete

15. Safety Officer closes incident with final notes: "Incident appears isolated. Driver coaching provided, training completed. Recommend standard follow-up in 30 days."

16. System transitions incident to "Closed" status with closure timestamp and documentation

17. Safety Officer exports incident report for insurance claim submission

#### Alternative Flows:

**A1: Incident Escalation - Serious Injury**
- 4a. If incident involves serious injury:
  - System flags incident as "Critical" with red status
  - Safety Officer immediately contacts medical personnel
  - OSHA Form 301 injury form initiated
  - Incident escalated to Risk Management and Legal teams
  - Investigation timeline extended to 30 days (complex causation)
  - Additional documentation required: Medical records, witness interviews

**A2: Multiple Incidents by Same Driver**
- 3a. If driver has multiple incidents in system:
  - System displays: "⚠ This driver has 3 incidents in last 12 months"
  - Safety Officer flags for performance improvement plan (PIP)
  - Mandatory retraining and heightened monitoring assigned
  - Dispatcher notified to restrict assignments to lower-risk routes

**A3: Assign Investigation to Team Member**
- 10a. If Safety Officer delegates investigation:
  - Safety Officer clicks "Assign Investigation"
  - System displays list of available investigators
  - Safety Officer assigns to Senior Safety Investigator Tom Davis
  - Tom receives assignment notification with due date
  - Tom performs investigation steps and updates Safety Officer with findings

**A4: Near-Miss Incident (No Damage)**
- 2a. If incident is near-miss with no vehicle damage:
  - System marks as "Near-Miss" category (lower severity)
  - Investigation still required per safety policy
  - Process streamlined - simplified investigation form
  - Focus on prevention and trending to identify risk patterns
  - Opportunity for coaching without serious consequences

#### Exception Flows:

**E1: Incident Video Footage Unavailable**
- If telematics video not captured:
  - System displays: "No video available for this incident"
  - Safety Officer relies on driver statement and witness accounts
  - Reconstruction less definitive - investigation takes longer
  - Video review skipped, investigative focus on interviews and external evidence

**E2: Driver Disputes Incident Details**
- If driver disagrees with incident report:
  - Safety Officer contacts driver: "Can you explain your account of the incident?"
  - Driver provides different version of events
  - Safety Officer documents both accounts in investigation record
  - If discrepancy significant: Third-party investigator engaged
  - All versions documented for resolution

**E3: Investigation Cannot Be Completed**
- If investigation reaches dead-end without clear root cause:
  - Safety Officer documents investigation effort and findings
  - Incident marked as "Closed - Insufficient Evidence"
  - Preventive measures still implemented where applicable
  - Case archived but monitored for similar future incidents

#### Postconditions:
- Complete incident investigation documented in system
- Root causes identified and documented
- Corrective actions assigned with responsible parties and due dates
- Incident closed with supporting documentation
- Investigation history available for audit and compliance review

#### Business Rules:
- BR-SO-001: All incidents must be reported within 24 hours of occurrence
- BR-SO-002: Critical incidents (injuries) require investigation initiation within 2 hours
- BR-SO-003: Investigations must be completed within 7-14 days depending on severity
- BR-SO-004: All incident investigations must include root cause analysis
- BR-SO-005: Corrective actions must have responsible party and completion date
- BR-SO-006: Investigations exceeding 14 days without closure escalate to Safety Director
- BR-SO-007: Incident documentation retained for 5 years minimum per DOT regulations

#### Related User Stories:
- US-SO-001: Incident Report Management
- US-SO-002: Accident Reconstruction and Analysis

---

### UC-SO-002: Reconstruct Accidents Using Telematics and Video

**Use Case ID**: UC-SO-002
**Use Case Name**: Reconstruct Accidents Using Telematics and Video
**Actor**: Safety Officer (primary), Insurance Adjuster (secondary), Legal Team (secondary)
**Priority**: High

#### Preconditions:
- Incident occurred with telematics-equipped vehicle
- Video telematics footage captured incident (30 seconds before/after)
- Telematics data (speed, braking, acceleration) is available
- Video player interface is operational
- Court-admissible export format available

#### Trigger:
- Safety Officer investigates collision or severe incident
- Liability question requires evidence for insurance claim
- Legal team requests accident reconstruction documentation

#### Main Success Scenario:
1. Safety Officer receives incident notification: Major collision at intersection
2. Safety Officer opens accident reconstruction module
3. System displays available evidence:
   - Telematics data: Available (10 seconds before to 15 seconds after)
   - Video footage: Available (complete 45-second clip)
   - GPS coordinates: Available (precise location)
   - Weather conditions: Partly cloudy, dry
   - Traffic conditions: Light traffic

4. Safety Officer clicks on video player to view footage
5. System displays synchronized view:
   - Video on left: Driver's perspective from cabin camera
   - Telematics overlay on right: Speed, braking, acceleration metrics
   - Timeline slider: Position in incident progression

6. Safety Officer uses video controls:
   - Play: Watch incident develop at 0.25x speed for detailed viewing
   - Pause: Stop at moment of impact (0:32 in video)
   - Rewind 5 seconds: Re-examine events leading to collision
   - Zoom: Enlarge video to see details (traffic signals, road markings)

7. System shows critical data points:
   - Pre-collision speed: 42 mph (constant)
   - Post-impact speed: 15 mph (dropped from impact)
   - Braking event: Sudden deceleration 0.8g (hard braking)
   - Acceleration: 0.3g reverse (backing from scene not detected - contradicts impact)
   - GPS: Intersection of Main St & 5th Ave, coordinates (42.1015, -72.5898)

8. Safety Officer adds annotation markers:
   - 0:25 - Vehicle enters intersection on green signal
   - 0:28 - Oncoming vehicle in left lane (dash cam perspective)
   - 0:30 - Other driver turns left (cutting off company vehicle)
   - 0:32 - Collision impact (t-bone on driver's side)
   - 0:34 - Both vehicles come to rest after collision

9. Safety Officer performs timeline analysis:
   - 10 seconds before impact: Both vehicles traveling normally
   - 5 seconds before: Oncoming vehicle signaling left turn (turn indicator visible)
   - 2 seconds before: Other vehicle commits to left turn crossing lanes
   - 0 seconds: Collision impact
   - +3 seconds: Both vehicles stopped post-impact

10. Safety Officer extracts hard event data from telematics:
    - Harsh acceleration: 0.8g (impact, not driver action)
    - Impact detection: Confirmed by accelerometer spike
    - Speed validation: GPS confirms 42 mph at impact
    - Brake application: 0.45 seconds before impact (reaction time appropriate for 42 mph)

11. Safety Officer compares to safe driving standards:
    - Speed in 25 mph school zone: 42 mph (VIOLATION - 17 mph over limit)
    - Reaction time to obstacle: 0.45 seconds (GOOD - adequate response)
    - Vehicle control post-impact: GOOD - safe control maintained
    - Assessment: Driver speed excessive for zone, but other driver at fault for unsafe turn

12. Safety Officer generates accident reconstruction report:
    - Title: "Accident Reconstruction Analysis - INC-2025-0847"
    - Summary: "Vehicle traveling 42 mph in 25 mph zone was t-boned by vehicle making illegal left turn"
    - Liability assessment: "Company vehicle appears not at fault for collision, but speed violation exists"
    - Recommendations: Safety training on school zone compliance

13. Safety Officer prepares evidence package for insurance:
    - Exports video in court-admissible format (H.264, MP4 with metadata)
    - Video includes metadata: Timestamp, GPS, speed data embedded
    - Certificate of authenticity generated: Chain of custody documented
    - Report includes: Photos, telematics data, timeline analysis

14. Safety Officer creates secure sharing link for insurance adjuster
    - Adjuster receives email with link to accident reconstruction evidence
    - Adjuster reviews video and analysis (7-day access window)
    - Adjuster confirms receipt and downloads evidence package

15. System generates exoneration assessment:
    - Conclusion: Driver not at fault for collision
    - Speed violation documented but separate from liability
    - Exoneration rate improves for fleet insurance premium negotiations

#### Alternative Flows:

**A1: Reconstruction Shows Driver at Fault**
- 11a. If analysis shows company driver responsible:
  - Safety Officer documents: "Driver failed to yield right-of-way"
  - Liability assessment: "Company vehicle at fault"
  - Incident escalates to Risk Management and driver's manager
  - Driver coaching and retraining mandated
  - Insurance claim prepared with liability admission

**A2: Multiple Impact Events**
- 8a. If collision involves multiple vehicles in sequence:
  - System displays: "Multiple collision impacts detected"
  - Safety Officer reviews primary impact: 0:32 (t-bone)
  - Secondary impact: 0:38 (second vehicle hits stationary car)
  - Analysis expanded: Determine causation chain and fault allocation

**A3: No Video Available - Telematics Only**
- 3a. If video footage missing but telematics available:
  - Safety Officer relies on telematics data alone
  - GPS track shows vehicle path and movement
  - Speed profile shows acceleration/deceleration pattern
  - Reconstruction less detailed but still possible
  - Investigation notes indicate "Video unavailable - analysis based on telematics"

**A4: Weather Factor Analysis**
- 7a. If weather conditions may have contributed:
  - Weather data shows: Rain, 35 mph wind, visibility 0.25 miles
  - Safety Officer notes: "Adverse weather - reduced visibility may have affected driver perception"
  - Analysis includes: "Driver speed excessive for weather conditions (42 mph in fog)"
  - Coaching focuses on defensive driving in adverse weather

#### Exception Flows:

**E1: Telematics Data Corrupted or Incomplete**
- If telematics data missing for incident timeframe:
  - System displays: "Telematics data unavailable for 0:20-0:40 timeframe"
  - Safety Officer reviews video only (no speed/acceleration data)
  - Video analysis provides partial reconstruction
  - Investigation flagged as "Incomplete Data" - higher uncertainty

**E2: Video Quality Insufficient**
- If video is blurry, dark, or unclear:
  - Safety Officer attempts to enhance video (brightness, contrast adjustment)
  - If enhancement insufficient: Conclusion limited by video quality
  - System recommends: "Consider upgrading to HD cameras for better evidence quality"

**E3: GPS Location Inaccurate**
- If GPS data doesn't match actual location:
  - Safety Officer verifies location independently (maps, street view)
  - GPS error documented but does not invalidate other data
  - Speed and acceleration data remain valid for analysis

**E4: Legal Challenge to Evidence**
- If evidence admissibility questioned in litigation:
  - Chain of custody documentation crucial
  - Metadata integrity verified by IT
  - Expert witness testimony may be required
  - Insurance and legal team coordinate defense

#### Postconditions:
- Complete accident reconstruction documented with visual evidence
- Liability assessment determined with supporting analysis
- Evidence package prepared for insurance and legal teams
- Court-admissible video export created
- Fleet exoneration rate calculated for premium negotiations
- Driver coaching implemented if necessary

#### Business Rules:
- BR-SO-008: All accident videos must include metadata (timestamp, GPS, speed) for court admissibility
- BR-SO-009: Video retention for incidents minimum 90 days, extended for litigation
- BR-SO-010: Exoneration assessment required for all collision incidents
- BR-SO-011: Video evidence must have unbroken chain of custody documentation
- BR-SO-012: Reconstruction analysis must compare to safe driving standards
- BR-SO-013: Report must include liability determination and recommendations
- BR-SO-014: Evidence sharing with external parties requires secure links with access logging

#### Related User Stories:
- US-SO-002: Accident Reconstruction and Analysis
- US-SO-008: Driver Exoneration and Liability Protection

---

### UC-SO-003: Analyze Incident Trends and Identify Risk Patterns

**Use Case ID**: UC-SO-003
**Use Case Name**: Analyze Incident Trends and Identify Risk Patterns
**Actor**: Safety Officer (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- Historical incident data available (minimum 12 months)
- Telematics harsh event data available
- Fleet and driver information current
- Analytics engine operational

#### Trigger:
- Safety Officer opens incident trend analysis dashboard
- Monthly safety meeting requires trend analysis
- Fleet Manager requests risk assessment

#### Main Success Scenario:
1. Safety Officer opens Incident Trends Dashboard
2. System displays incident analysis for past 12 months:

   **Fleet Incident Overview**:
   - Total incidents: 147 (up 12% from prior year)
   - Severity breakdown:
     - Critical: 3 (2%) - serious injuries or major damage
     - Major: 18 (12%) - vehicle damage, minor injury
     - Minor: 76 (52%) - fender bender, no injury
     - Near-miss: 50 (34%) - avoided incident, learning opportunity

3. Safety Officer applies filters to drill deeper:
   - Filter by driver: Top 5 drivers with most incidents
   - Filter by location: Identify high-risk corridors
   - Filter by time: Peak incident times
   - Filter by type: Collision, speeding, harsh braking, etc.

4. System displays incident frequency trends:
   - January: 11 incidents (average)
   - February: 14 incidents (seasonal weather increase)
   - March: 18 incidents (highest - spring weather volatility)
   - April-November: 12-15 incidents/month (stabilized)
   - December: 13 incidents (holiday traffic)

5. Safety Officer views heat map showing high-risk locations:
   - Downtown Boston intersections: 23 incidents (16%)
   - I-95 northbound MM 40-60: 18 incidents (12%)
   - Route 128 exits 25-30: 15 incidents (10%)
   - Other locations: 91 incidents (62%)

6. Safety Officer identifies high-risk time periods:
   - Rush hours (7-9 AM, 4-6 PM): 45% of incidents
   - Weekday afternoon (2-4 PM): Highest concentration
   - Friday/Monday: More incidents than mid-week
   - Night shift (10 PM-6 AM): Lower incident rate despite fatigue factor

7. Safety Officer reviews leading indicators:
   - Harsh braking events: 342 in past month (up 18% from prior month)
   - Speeding violations: 89 in past month (up 8%)
   - Hard acceleration: 156 in past month (stable)
   - Following too close events: 203 in past month (up 23%)

8. System performs predictive analysis:
   - Identifies 12 drivers with elevated risk factors
   - Predicts: 3 drivers likely to have incident in next 30 days
   - Recommendations: Immediate coaching for high-risk drivers
   - Confidence level: 78% accuracy based on historical patterns

9. Safety Officer calculates safety metrics:
   - Total Recordable Incident Rate (TRIR): 4.2 per 100 employees
   - Days Away/Restricted/Transfer (DART) Rate: 2.1 per 100 employees
   - Preventable incident rate: 2.8 per 1M miles (industry benchmark: 3.2)
   - Fleet performing 12% better than industry average

10. Safety Officer compares to industry benchmarks:
    - Fleet TRIR: 4.2 (benchmark: 5.5) ✓ Better
    - Fleet DART: 2.1 (benchmark: 3.0) ✓ Better
    - Incident rate: 2.8 per 1M miles (benchmark: 3.2) ✓ Better
    - Overall assessment: Fleet performing above industry standard

11. Safety Officer identifies incident patterns:
    - Pattern 1: Downtown Boston intersections have high collision rate
    - Pattern 2: March weather volatility correlates with incident spike
    - Pattern 3: Friday and Monday show elevated incidents (possibly driver fatigue)
    - Pattern 4: New drivers (first 90 days) have 3x incident rate

12. Safety Officer develops targeted interventions:
    - Action 1: Enhanced training for downtown routes (defensive driving at intersections)
    - Action 2: Driver coaching for 12 high-risk drivers (personalized safety plans)
    - Action 3: Structured onboarding for new hires (reduced initial assignments)
    - Action 4: Flexible scheduling to reduce Friday/Monday fatigue

13. Safety Officer exports incident trend report for management meeting:
    - Visual charts showing trends and patterns
    - Comparison to industry benchmarks
    - Risk assessment and recommended interventions
    - ROI projection for proposed safety programs

14. Report presented to Fleet Manager with findings:
    - "Incidents trending up 12% YoY - concerning trend"
    - "Following-too-close events increasing 23% - leading indicator"
    - "High-risk drivers identified for immediate coaching"
    - "New hire training enhancement recommended"

15. Safety Officer monitors interventions over next 90 days:
    - Coaching program assigned to high-risk drivers
    - New hire training enhanced with extended ride-along
    - Downtown route training deployed
    - System tracks incident reduction in targeted areas

#### Alternative Flows:

**A1: Incident Spike Detected - Emergency Response**
- 2a. If incident trend shows sudden spike:
  - System alerts: "⚠ Incident spike detected - 8 incidents in past 5 days (3x normal)"
  - Safety Officer investigates cause (weather event, new route, staff changes)
  - Root cause identified: Weather event caused multiple weather-related incidents
  - Immediate intervention: Send weather safety alert to all drivers
  - Monitor for return to normal incident levels

**A2: Focus on Specific Driver Population**
- 3a. If Safety Officer wants to analyze subgroup:
  - Filter by: "New drivers (0-90 days service)"
  - System displays: New hire incident rate 8.2% vs fleet average 2.8%
  - Finding: New drivers are 3x more likely to have incidents
  - Recommendation: Enhanced new driver training and ride-along program
  - Program implemented and effectiveness tracked

**A3: Cost Impact Analysis**
- 10a. If Safety Officer calculates financial impact:
  - System estimates incident costs:
    - Average incident cost: $8,200 (damage, downtime, medical)
    - Total annual incident cost: $1.21M (147 incidents × $8,200)
    - Safety program cost: $150K (coaching, training, incentives)
    - Projected savings if incident rate reduced 20%: $242K
    - ROI: 161% over one year

**A4: Comparison to Prior Year**
- 9a. If Safety Officer compares yearly performance:
  - Current year incidents: 147
  - Prior year incidents: 131
  - Change: +16 incidents (+12% increase)
  - Trend analysis: Increasing trajectory concerning
  - Investigation: What changed in operations year-over-year?

#### Exception Flows:

**E1: Historical Data Incomplete**
- If incident data missing for some time periods:
  - System displays: "⚠ Data gaps in February (4-day system outage)"
  - Analysis continues with available data
  - Trend calculation adjusted for missing data period
  - Note added: "Analysis based on 11 of 12 months available data"

**E2: Telematics Data Unavailable**
- If harsh event data not captured for some vehicles:
  - Leading indicator analysis limited to available data
  - Safety Officer notes: "Harsh event analysis incomplete - 3 vehicles without telematics"
  - Recommendation: Ensure all vehicles equipped with telematics
  - Analysis focuses on incident outcomes rather than precursor events

**E3: Data Quality Issues**
- If incident classification inconsistent:
  - Safety Officer discovers: Some "minor" incidents classified as "near-miss"
  - Data quality review initiated
  - Incident reclassification for consistency
  - Analysis re-run with corrected data

#### Postconditions:
- Comprehensive incident trend analysis completed
- High-risk patterns identified with supporting data
- Leading indicators tracked for predictive analytics
- Targeted interventions recommended and implemented
- Safety performance compared to industry benchmarks
- Trend report available for management decision-making

#### Business Rules:
- BR-SO-015: Incident trend analysis updated monthly minimum
- BR-SO-016: Predictive analytics require 12 months minimum historical data
- BR-SO-017: Leading indicator thresholds trigger automatic alerts
- BR-SO-018: Industry benchmark comparisons updated quarterly
- BR-SO-019: Incident spike >3x normal rate triggers emergency response protocol
- BR-SO-020: All intervention recommendations must include cost-benefit analysis
- BR-SO-021: Trend analysis data retained for 5 years for compliance

#### Related User Stories:
- US-SO-003: Incident Trend Analysis and Reporting

---

## Epic 2: Driver Training and Certification Tracking

### UC-SO-004: Manage Driver Safety Training Programs

**Use Case ID**: UC-SO-004
**Use Case Name**: Manage Driver Safety Training Programs
**Actor**: Safety Officer (primary), Driver (secondary), Training Provider (external)
**Priority**: High

#### Preconditions:
- Training program library available (LMS integration or built-in module)
- Driver roster current with training history
- Training completion tracking system operational
- Electronic signature capability available

#### Trigger:
- Safety Officer creates new training program requirement
- Driver becomes due for renewal training
- Regulatory training requirement identified (DOT, OSHA, etc.)

#### Main Success Scenario:
1. Safety Officer opens Training Programs module
2. System displays existing training programs:
   - Defensive Driving (required annually)
   - Hazmat Operations (required for hazmat drivers)
   - Vehicle Inspection (required annually)
   - Hours of Service (HOS) Compliance (new hire + renewal)
   - Emergency Response (required annually)

3. Safety Officer clicks "Create New Training Program"
4. System displays training creation form with fields:
   - Program name: "Accident Prevention - Intersection Safety"
   - Target audience: All drivers in Boston region
   - Duration: 2 hours
   - Required passing score: 80%
   - Renewal cycle: Annually
   - Due date for assignment: Immediately
   - Expiration date for compliance: 90 days

5. Safety Officer uploads training materials:
   - Video content (30 minutes): "Intersection Safety Best Practices"
   - PDF workbook (15 pages): Scenario-based learning
   - Quiz with 20 questions
   - Practical assessment: In-app driving simulation scenarios

6. Safety Officer configures program parameters:
   - Delivery method: Online (self-paced) + 1 live webinar (optional)
   - Webinar scheduled: Thursday 2:00 PM (2 sessions)
   - Quiz attempts allowed: 2 (minimum 80% to pass)
   - Certificate issued upon completion: Yes
   - Print certificate: Yes (for driver records)

7. Safety Officer assigns program to driver group:
   - Filter: "All drivers in Boston region" (23 drivers)
   - System displays: "This program will be assigned to 23 drivers"
   - Confirm assignment
   - System sends training assignment notifications to all 23 drivers

8. Drivers receive training notification:
   - Driver Mike receives email: "New Required Training: Accident Prevention - Intersection Safety"
   - Training due by: 30 days from today
   - Assignment link provided

9. Driver Mike accesses training via mobile app:
   - Views training objectives
   - Watches video content (paused/resumed over 3 days)
   - Downloads workbook and completes exercises
   - Takes practice quiz (scores 75% - not passing)
   - Reviews missed questions
   - Retakes quiz (scores 85% - passing)
   - Receives electronic certificate

10. Safety Officer monitors training progress via dashboard:
    - Overall progress: 19 of 23 drivers enrolled
    - In progress: 12 drivers
    - Completed: 5 drivers (100% passing)
    - Not started: 4 drivers (reminder needed)
    - Not passing: 2 drivers (need additional support)

11. Safety Officer sends reminder to 4 drivers not yet enrolled:
    - Email reminder: "Training due in 15 days - action required"
    - System tracks reminder sent with timestamp

12. Two drivers struggling with quiz get offered support:
    - Safety Officer sends message: "I see you're taking the quiz - need help? I can schedule a 1-on-1 coaching call"
    - Driver John responds: "Yes, confusing on intersection right-of-way rules"
    - Safety Officer schedules 30-minute coaching call
    - John completes training with 82% passing score

13. By due date, 22 of 23 drivers completed training:
    - Safety Officer flags 1 non-compliant driver (Sarah)
    - Sarah reports: "Was out on sick leave - can I get extension?"
    - Safety Officer approves 14-day extension with new due date
    - Sarah completes training within extension period

14. Safety Officer generates training completion report:
    - Program: Accident Prevention - Intersection Safety
    - Assigned: 23 drivers
    - Completed: 23 drivers (100% compliance)
    - Completion timeline: 45 days average
    - Average score: 84% (exceeds 80% requirement)
    - Completion status: ✓ Successful
    - Certificates issued: 23 (available for audit files)

15. Safety Officer tracks training effectiveness:
    - Baseline intersection incident rate: 2.4 per month
    - Post-training incident rate (30 days): 1.6 per month
    - Incident reduction: 33%
    - Training ROI: Positive impact on safety metrics

#### Alternative Flows:

**A1: Live Webinar Attendance Required**
- 6a. If training includes mandatory live component:
  - Safety Officer schedules 2 webinar sessions (Thursday 2 PM, Friday 10 AM)
  - Drivers choose preferred time slot during enrollment
  - Session links sent via email
  - Attendance tracked automatically
  - Recording available for drivers unable to attend live

**A2: Third-Party Training Provider Integration**
- 5a. If training provided by external vendor:
  - Safety Officer integrates training from external LMS
  - Training content accessed via single sign-on (SSO)
  - Completion data synchronized back to safety system
  - Certificate auto-imported to driver training records
  - No manual tracking required

**A3: Tiered Training for Different Driver Types**
- 4a. If training tailored to driver classification:
  - Create program variant: "Hazmat Drivers Only"
  - Create program variant: "Non-CDL Drivers"
  - Create program variant: "New Hire Training"
  - Assignment filtered automatically by driver type
  - All variants tracked under single program umbrella

**A4: Prerequisite Training Required**
- 4a. If training has prerequisites:
  - Program: "Advanced Hazmat Handling" requires "Basic Hazmat Operations"
  - System prevents enrollment until prerequisite completed
  - Driver notified: "Complete Basic Hazmat first"
  - Once basic training completed: Advanced training auto-opens

#### Exception Flows:

**E1: LMS System Unavailable**
- If training provider system offline:
  - System displays: "Training provider temporarily unavailable"
  - Drivers can access cached content (previously downloaded)
  - Completion data queued for sync when service restored
  - Alternative: Postpone training enrollment until service restored

**E2: Driver Fails Training - Remediation Required**
- If driver cannot achieve passing score:
  - Driver Tom fails quiz 2 times (scores 72% and 75%)
  - System notifies Safety Officer: "Tom unable to pass training"
  - Safety Officer options:
    - Schedule 1-on-1 coaching session
    - Provide supplemental learning materials
    - Extend deadline for additional study
  - If still fails after remediation: Escalate to manager for possible restrictions

**E3: Training Content Update During Active Program**
- If training materials need to be updated mid-deployment:
  - Safety Officer updates video content or quiz
  - New drivers see updated content immediately
  - Drivers already in progress: Choose to complete with old or new version
  - Completion dates may be adjusted for major updates

#### Postconditions:
- Training program successfully assigned to driver group
- All drivers enrolled and notified
- Training completed with required passing scores documented
- Electronic certificates issued and retained
- Training effectiveness measured against safety metrics
- Completion data available for audit compliance

#### Business Rules:
- BR-SO-022: All safety-related training requires passing grade (minimum 80%)
- BR-SO-023: Training completion must be documented with date and score for audit
- BR-SO-024: Non-compliant drivers (failed training) flagged for management review
- BR-SO-025: Training certificates valid for configured renewal period (e.g., 1 year)
- BR-SO-026: Expired training prevents driver dispatch until renewal completed
- BR-SO-027: Training completion rates tracked as performance KPI (target: 95%)
- BR-SO-028: All training records retained per DOT requirements (3 years minimum)

#### Related User Stories:
- US-SO-004: Driver Safety Training Management

---

### UC-SO-005: Track Driver Licenses and Certifications

**Use Case ID**: UC-SO-005
**Use Case Name**: Track Driver Licenses and Certifications
**Actor**: Safety Officer (primary), Driver (secondary), HR (secondary)
**Priority**: High

#### Preconditions:
- Driver credential database established
- Document management system with OCR capability available
- Expiration alert system operational
- MVR provider integration functional (optional)

#### Trigger:
- New driver hired requiring credential verification
- Driver credential approaching expiration
- Safety Officer reviews compliance dashboard
- MVR (Motor Vehicle Record) check interval reached

#### Main Success Scenario:
1. New driver John hired - Safety Officer initiates credential verification workflow
2. System displays driver credential form with required documents:
   - Driver's License (CDL)
   - Medical Certification Card
   - HAZMAT Endorsement (if applicable)
   - Doubles/Triples Endorsement (if applicable)
   - Background check results

3. Driver John uploads documents via mobile app:
   - Takes photo of driver's license front and back
   - Uploads medical card photo
   - Uploads HAZMAT endorsement certificate

4. System processes documents with OCR:
   - Driver's License: Extracted data
     - Name: John Smith
     - License #: MA-1234567
     - Class: CDL Class A
     - Endorsements: None
     - Restrictions: None
     - **Expiration Date: March 15, 2026**

   - Medical Card: Extracted data
     - FMCSA Medical Certificate
     - **Expiration Date: September 10, 2025**

   - HAZMAT: Extracted data
     - **Expiration Date: July 22, 2026**

5. Safety Officer reviews extracted data for accuracy:
   - Verifies expiration dates match physical documents
   - Confirms all endorsements and restrictions
   - Approves credential verification
   - Status: ✓ Compliant

6. System adds John's credentials to driver profile:
   - License expiration tracker: 503 days remaining
   - Medical card expiration tracker: 274 days remaining (⚠ First to expire)
   - HAZMAT expiration tracker: 623 days remaining

7. System automatically sends alert at credential milestones:
   - 90 days before expiration: Email to John and Safety Officer
   - 60 days before expiration: SMS reminder to John
   - 30 days before expiration: Escalated alert to manager

8. Three months later (June 2025):
   - System detects: Medical card expires in 90 days (September 10)
   - Alert sent to John: "Your medical certification expires September 10 - renew soon"
   - Safety Officer dashboard shows: "John Smith - Medical renewal due"

9. John schedules medical exam and receives new certification:
   - John completes FMCSA medical exam
   - Receives new medical card: Valid September 15, 2025 - September 14, 2026
   - Uploads new card photo

10. System updates John's credentials:
    - Medical card expiration tracker: 366 days remaining (updated)
    - Dashboard status: ✓ Compliant

11. Safety Officer configures MVR (Motor Vehicle Record) check:
    - MVR recurrence: Annually (required by DOT policy)
    - Last MVR check: Upon hire (June 2024)
    - Next MVR due: June 2025

12. System automatically requests MVR from provider:
    - HireRight MVR check initiated
    - Results received: 3 days later
    - Results: **Clean - No violations, suspensions, or accidents**
    - Updated in driver record

13. Six months later (December 2024):
   - System alerts: "John's driver's license expires March 15, 2026 (90 days remaining)"
   - John contacts: "Can I renew my license early?"
   - Safety Officer approves early renewal
   - John completes renewal process
   - New license received: March 10, 2025
   - System updates: Expiration March 10, 2027

14. Safety Officer runs compliance dashboard report:
    - All drivers credential status view:
      - Compliant: 48 drivers (96%)
      - Expiring soon (30 days): 1 driver
      - Expired/Non-compliant: 1 driver
    - Actions taken:
      - Renewal reminder sent to driver with 30-day expiration
      - Non-compliant driver restriction: No dispatch until renewed
      - Management alert: 1 non-compliant driver requires action

15. Safety Officer generates DOT compliance certification:
    - Document states: "All driver credentials verified and compliant per 49 CFR Part 391"
    - Signed and dated for audit file

#### Alternative Flows:

**A1: Multi-Endorsement Management**
- 2a. If driver has multiple endorsements requiring tracking:
  - Driver Sarah has: CDL (exp. 2025), HAZMAT (exp. 2026), Tanker (exp. 2024)
  - System displays all expirations separately
  - Tanker endorsement expires first - alert sent
  - Sarah renews Tanker endorsement
  - Each tracked independently on different timelines

**A2: Out-of-State License**
- 2a. If driver holds non-state-of-residence license:
  - Driver Mike holds: New Jersey CDL (home state)
  - Operating in: Massachusetts (work location)
  - System tracks: New Jersey expiration (primary)
  - Alerts follow New Jersey renewal cycle
  - No compliance issue if valid in current operating state

**A3: Credential Suspension or Revocation**
- 10a. If driver loses credential during employment:
  - System alert: "Driver license suspended - court action for traffic violation"
  - Credential status: ❌ Non-compliant
  - Dispatch system prevents route assignment immediately
  - Safety Officer contacts driver for explanation and suspension period
  - Suspended periods tracked; resolution documented

**A4: Restricted Endorsements or Limitations**
- 2a. If credential has operating restrictions:
  - Driver Tom's license has: Restriction "Corrective lenses required"
  - System logs restriction: "Cannot operate without eyeglasses"
  - Dispatch notes visible: Verify driver wearing corrective lenses before assignment
  - Periodic verification reminder during assignments

#### Exception Flows:

**E1: OCR Extraction Error**
- If extracted data is incorrect:
  - System extracts expiration date: "March 15, 2020" (obvious error - past date)
  - Safety Officer reviews document manually
  - Correct date entered: March 15, 2026
  - System processes with corrected data

**E2: Credential Document Missing**
- If driver unable to provide required credential:
  - Driver cannot locate medical card before hire date
  - Safety Officer options:
    - Allow conditional start with 14-day deadline to provide document
    - Request expedited medical exam appointment
    - Place hold on dispatch assignment until credential received
  - Deadline enforced: Credential provided or employment conditional status lapses

**E3: Credential Status Ambiguous**
- If credential validity unclear (e.g., states not recognized in system):
  - Safety Officer manually researches credential validity
  - Contacts state DMV or regulatory agency for verification
  - Documents research and conclusion in credential record

**E4: Recursive Renewal Cycles**
- If credential renewal timing creates scheduling challenge:
  - Medical card expires September 10 (requires 60-day renewal notice to scheduling)
  - Driver busy with long-haul trips - difficult to schedule exam
  - Safety Officer proactively schedules exam at start of July (70 days prior)
  - Ensures renewal completed with buffer before expiration

#### Postconditions:
- All driver credentials verified and documented
- Expiration dates tracked with automated alerts
- Compliance status visible on driver profiles
- Non-compliant drivers flagged from dispatch
- Documentation available for DOT audit compliance
- MVR checks completed per regulatory frequency
- All credential documents retained per retention policy

#### Business Rules:
- BR-SO-029: All drivers must have valid license and medical card to operate vehicles
- BR-SO-030: Medical card expiration is primary constraint (most frequently expires first)
- BR-SO-031: Non-compliant drivers prevented from dispatch (hard block)
- BR-SO-032: Alerts sent 90/60/30 days before credential expiration
- BR-SO-033: MVR checks required annually minimum per DOT 49 CFR 391.23
- BR-SO-034: Credential documents retained 3 years minimum per DOT requirements
- BR-SO-035: Suspended/revoked credentials must be escalated to management same day

#### Related User Stories:
- US-SO-005: Driver Certification and License Tracking

---

### UC-SO-006: Conduct Driver Coaching Sessions

**Use Case ID**: UC-SO-006
**Use Case Name**: Conduct Driver Coaching Sessions
**Actor**: Safety Officer (primary), Driver (secondary), Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Unsafe driving event identified (video event, harsh braking, speeding violation)
- Driver available for coaching session
- Video or event evidence available (if applicable)
- Communication tools (email, video call, in-app messaging) operational

#### Trigger:
- Telematics system flags harsh driving event requiring coaching
- Safety Officer reviews video event and determines coaching needed
- Driver performance review indicates need for behavioral intervention
- Incident investigation identifies coaching opportunity

#### Main Success Scenario:
1. Safety Officer reviews video event: Driver Tom harsh braking - sudden deceleration 0.8g
2. Video shows: Tom was following closely behind traffic, sudden brake by vehicle ahead
3. Safety Officer assesses: "Coaching opportunity - Tom should increase following distance"
4. Safety Officer opens Coaching Module and selects: "Create New Coaching Session"
5. System displays coaching form:
   - Driver: Tom Rodriguez
   - Event: Harsh Braking - Following Too Close
   - Date/Time: November 8, 2025, 2:47 PM
   - Location: I-95 North, MM 47
   - Evidence: Video clip attached, Telematics data (0.8g deceleration)

6. Safety Officer schedules coaching session:
   - Proposed date: November 10, 2025
   - Time: 2:00 PM
   - Duration: 30 minutes
   - Format: Virtual (via Zoom call) or in-person
   - Sends meeting invite to Tom

7. Tom receives coaching notification:
   - "You're invited to a safety coaching session"
   - Purpose: "Discuss harsh braking event from November 8"
   - Date/Time: November 10, 2:00 PM (with Zoom link)
   - Tom confirms attendance

8. Coaching session conducted (November 10, 2:00 PM):
   - Safety Officer starts with positive tone: "Tom, you're a good driver overall - I want to help you improve"
   - Safety Officer reviews video event with Tom
   - Tom's perspective: "I was caught off guard - the car ahead stopped suddenly"
   - Safety Officer explains: "At 45 mph, you needed 3-4 car lengths distance. You had about 2"
   - Safety Officer teaches: "Following distance formula - 1 second per 10 mph = 4.5 seconds at 45 mph"
   - Tom demonstrates understanding: "So I should count to 4 between me and the car ahead"
   - Safety Officer provides defensive driving tip: "Assume other drivers will brake suddenly"

9. Safety Officer assigns follow-up action:
   - Tom assigns practice exercise: "Drive 50 miles with increased following distance"
   - Tom agrees to practice and report back
   - Next check-in scheduled: One week later
   - Safety Officer sends summary email to Tom with key points

10. Tom completes practice assignment:
    - Tom drives with intentional increased following distance
    - Notes improvement: "I feel much safer with more space"
    - Reports to Safety Officer: "Completed practice - feels more comfortable now"

11. Follow-up coaching session (One week later):
    - Safety Officer reviews subsequent video events (past 7 days)
    - No harsh braking events detected since coaching
    - Safety Officer provides positive feedback: "Excellent improvement! Zero harsh events this week"
    - Tom confirms: "Following distance practice helped - I'm more aware now"
    - Session marked successful: Behavior improved

12. Safety Officer documents coaching outcome:
    - Session type: One-on-one coaching
    - Topic: Following distance and harsh braking prevention
    - Outcome: Positive - driver behavior improved
    - Status: ✓ Coaching successful
    - Notes: "Driver receptive and made behavioral change. Continue monitoring"

13. System tracks coaching effectiveness:
    - Pre-coaching harsh events: 3 in prior month
    - Post-coaching harsh events: 0 in following month
    - Coaching effectiveness: ✓ Successful
    - Driver performance score improved from 82 to 89

#### Alternative Flows:

**A1: Group Coaching Session (Multiple Drivers)**
- 3a. If multiple drivers share similar unsafe behavior:
  - Safety Officer identifies: 5 drivers with excessive speeding violations
  - Creates group coaching session: "Speed Limit Compliance Workshop"
  - Invites all 5 drivers plus supervisor
  - Conducts group discussion on defensive driving and speed compliance
  - More efficient than individual coaching for common issues

**A2: Reluctant Driver Requires Manager Escalation**
- 8a. If driver resistant to coaching feedback:
  - Driver Sarah disputes: "That video isn't showing what really happened"
  - Safety Officer explains: "The telematics data confirms the event"
  - Sarah remains defensive and dismissive
  - Safety Officer escalates: "Your manager will need to get involved"
  - Manager conducts follow-up conversation with performance expectations
  - Non-compliance may result in performance improvement plan (PIP)

**A3: Coaching Conducted via Mobile App (Synchronous)**
- 5a. If driver in field and coaching needed immediately:
  - Safety Officer sends urgent message: "I see a harsh braking event - can we talk?"
  - Driver Tom responds: "Yes, on break now"
  - Safety Officer calls Tom (voice or video)
  - Real-time discussion of event and corrective action
  - Session documented in system with timestamp

**A4: Coaching for Safety Award/Recognition**
- 3a. If coaching given for positive behavior:
  - Safety Officer identifies: Driver Mike - 30 days with zero safety violations
  - Safety Officer schedules: "Congratulations coaching session"
  - Recognizes excellent performance and reinforces positive behavior
  - Motivational coaching to maintain excellence
  - Employee morale boost and positive culture building

#### Exception Flows:

**E1: Video Evidence Inconclusive**
- If video doesn't clearly show the event:
  - Safety Officer reviews video - grainy quality, unclear context
  - Alternative: Use only telematics data (acceleration data is clear)
  - Coaching still conducted: "Telematics show a harsh event - let's discuss what happened"
  - Less detailed but still effective conversation

**E2: Driver Disputes Event Data**
- If driver claims false positive:
  - Driver Tom: "My truck's traction control is sensitive - that wasn't harsh braking"
  - Safety Officer reviews telematics logs - potential false positive flag present
  - Safety Officer: "You may be right - your vehicle has been flagged for sensor sensitivity"
  - Coaching adjusted: Focus on other observed behaviors or general safety discussion
  - Vehicle maintenance reviewed to ensure sensors calibrated correctly

**E3: Coaching Leads to Discipline Requirement**
- If coaching reveals serious or repeated violation:
  - During coaching, Tom admits: "I was texting while driving"
  - Safety Officer escalates to management: "Distracted driving admission"
  - Coaching supplemented with formal discipline (warning, suspension, etc.)
  - Coaching may not be appropriate if serious violation present

**E4: Driver Unable to Attend Scheduled Coaching**
- If driver misses scheduled session:
  - Tom fails to attend scheduled coaching on November 10
  - Safety Officer sends reminder: "Missed our coaching - let's reschedule"
  - Tom apologizes - too busy with deliveries
  - Safety Officer reschedules for November 12
  - If repeated no-shows: Escalate to manager for non-compliance

#### Postconditions:
- Coaching session completed with driver attendance documented
- Behavioral issue discussed and improvement plan agreed
- Follow-up action assigned and completion tracked
- Driver performance improvement measured post-coaching
- Session documented in driver record for audit trail
- Coaching effectiveness evaluated through subsequent behavior monitoring

#### Business Rules:
- BR-SO-036: All safety coaching sessions must be documented with date, topic, attendees
- BR-SO-037: Coaching should be positive and constructive, not punitive
- BR-SO-038: Follow-up monitoring required minimum 30 days post-coaching
- BR-SO-039: Repeated safety coaching without improvement triggers escalation
- BR-SO-040: Coaching effectiveness measured by reduction in unsafe events
- BR-SO-041: All coaching sessions recorded/documented (audio or written summary) for audit
- BR-SO-042: Drivers can request coaching notes and dispute findings within 30 days

#### Related User Stories:
- US-SO-006: Driver Coaching and Performance Improvement

---

## Epic 3: Video Telematics Review and Coaching

### UC-SO-007: Review Video Events and Prioritize Coaching

**Use Case ID**: UC-SO-007
**Use Case Name**: Review Video Events and Prioritize Coaching
**Actor**: Safety Officer (primary), Dispatcher (secondary), Driver (secondary)
**Priority**: High

#### Preconditions:
- Video telematics system operational and capturing events
- AI event classification system functional
- Video storage and playback infrastructure available
- Event database populated with captured incidents

#### Trigger:
- Safety Officer opens video event review dashboard
- AI system flags critical event requiring immediate review
- Safety Officer initiates daily event review process
- Driver submits event for review/exoneration

#### Main Success Scenario:
1. Safety Officer opens Video Events Dashboard
2. System displays summary of unreviewed video events:
   - Total unreviewed events: 47
   - Critical priority (requires immediate review): 3
   - High priority: 12
   - Medium priority: 22
   - Low priority: 10

3. System displays critical events first (auto-sorted by severity):

   **Critical Event #1: Distraction - Phone Use**
   - Driver: Sarah Chen
   - Vehicle: #287
   - Time: Today 2:15 PM
   - Location: I-95 North, MM 32
   - AI Confidence: 94% (phone detected in hand)
   - Duration: 8 seconds (phone in hand)
   - Status: Unreviewed
   - Recommended Action: Coaching required

4. Safety Officer clicks on Critical Event #1 to view video
5. Video player displays:
   - Telematics overlay: Speed 52 mph, GPS coordinates
   - Driver camera: Clear view of driver's face and hand holding phone
   - Forward camera: Road ahead, traffic conditions
   - Timeline: 0:00-0:08 (8-second event)

6. Safety Officer reviews video:
   - 0:00 - Driver's hand moves to phone location
   - 0:02 - Phone visible in hand
   - 0:04 - Driver glances down at phone (eyes off road)
   - 0:06 - Driver returns eyes to road
   - 0:08 - Driver replaces phone (event ends)
   - Road conditions: Moderate traffic, clear visibility
   - Risk assessment: High risk - eyes off road for 4 seconds at highway speed

7. Safety Officer provides event classification:
   - Marks as: ✓ Valid safety concern (not false positive)
   - Severity: High (distracted driving on highway)
   - Recommended action: Coaching required

8. Safety Officer adds notes to event:
   - "Clear phone usage while operating vehicle. Driver distracted for ~4 seconds at highway speed. This is serious safety violation - coaching and counseling required."

9. Safety Officer creates coaching session from event:
   - Click: "Create Coaching Session"
   - System auto-populates: Driver, event date/time, event type, video link
   - Schedule coaching: Tomorrow 10:00 AM
   - Send message to Sarah: "Need to discuss event from today - important safety issue"

10. Safety Officer moves to next event:

    **High Priority Event #2: Harsh Braking - Following Too Close**
    - Driver: Tom Rodriguez
    - Vehicle: #301
    - Time: Today 3:45 PM
    - Deceleration: 0.7g (sudden braking)
    - Status: Unreviewed

11. Safety Officer reviews video:
    - Situation: Tom was following vehicle at close distance
    - Preceding vehicle braked suddenly
    - Tom executed hard braking to avoid collision
    - No impact (successful evasion)
    - Assessment: Tom's braking was appropriate response (good reaction)
    - Following distance could have been better (preventive measure)

12. Safety Officer marks event:
    - Valid concern: Yes (but driver response was good)
    - Classification: Learning opportunity (not critical)
    - Recommended action: Coaching - improve following distance
    - Notes: "Driver reacted well to avoid collision. Good defensive driving response. Focus coaching on proactive following distance maintenance."

13. Safety Officer reviews remaining 45 events using filtering:
    - Filter: "Medium/Low priority events"
    - Applies bulk classification: "Process similar events together"
    - Events type: Speeding violation (9 events by different drivers)
    - Reviews representative sample: 3 events
    - Notes pattern: Speeding on Route 128 off-ramps (common issue)
    - Bulk action: "Mark all speeding events for group coaching - Route 128 speed management"

14. Safety Officer utilizes AI learning from reviews:
    - System tracks: Event classifications and Safety Officer decisions
    - Machine learning improves: AI model accuracy based on Safety Officer feedback
    - Over time: False positive rate decreases as AI learns from actual coaching decisions
    - Safety Officer impact: Training better AI classification system

15. Safety Officer generates event review summary:
    - Total events reviewed: 47
    - Critical coaching needed: 2 drivers
    - Group coaching scheduled: Route 128 speeding (7 drivers)
    - False positives marked: 4 events (sensor noise misclassified)
    - Follow-up actions: 14 coaching sessions scheduled

16. Dashboard metrics update:
    - Events reviewed today: 47 (100%)
    - Average review time per event: 2.3 minutes
    - Events requiring coaching: 11 (23%)
    - Coaching sessions scheduled: 6
    - True positive rate: 91% (good AI accuracy)

#### Alternative Flows:

**A1: Driver Self-Reports Event for Exoneration**
- 3a. If driver submits event for review:
  - Driver Mike sends request: "Please review harsh braking event on I-95"
  - Mike explains: "I had to brake for accident - avoided collision"
  - Safety Officer reviews: Mike's explanation matches video (0.8g deceleration, successful evasion)
  - Safety Officer marks: "Exonerated - appropriate defensive driving response"
  - Mike receives notification: "Event reviewed - no coaching required, good job avoiding collision"

**A2: Bulk False Positive Dismissal**
- 13a. If multiple false positives identified:
  - Vehicle #287 camera malfunctioning - generating false "distraction" events
  - Safety Officer identifies pattern: 6 false positive events from same camera
  - Bulk action: Mark all 6 as false positives (sensor malfunction)
  - Submit maintenance ticket: "Vehicle #287 cabin camera needs recalibration"
  - Driver receives apology: "We identified false positives in your events - no action needed"

**A3: Escalate Event to Management**
- 7a. If event reveals serious safety/policy violation:
  - Video shows: Driver Sarah sleeping while vehicle stopped at red light (clearly asleep)
  - Safety Officer escalates: Submit event to dispatch manager and HR
  - Serious concern: Driver safety and fatigue management
  - Escalation: Management investigation and possible disciplinary action

**A4: Share Event with Driver for Self-Improvement**
- 7a. If Safety Officer wants driver feedback:
  - Safety Officer sends message: "Review this event and tell me what you think happened"
  - Driver Tom watches video and responds: "I see now - I should have maintained more distance"
  - Safety Officer replies: "Exactly - good self-awareness. Let's talk about prevention"
  - Driver self-learning before formal coaching session

#### Exception Flows:

**E1: Video Quality Insufficient**
- If video is blurry or unclear:
  - Video shows event but image quality poor - can't definitively see driver's hands
  - Safety Officer notes: "Event marked as valid but low confidence due to video quality"
  - Still conduct coaching but acknowledge image quality limitation
  - Recommend: Camera upgrade or cleaning for this vehicle

**E2: AI Confidence Score Very Low**
- If AI classification uncertain:
  - Event shows "Possible distraction" but AI confidence only 35%
  - Safety Officer decides: "Not enough evidence - mark as inconclusive"
  - No coaching initiated without stronger evidence
  - Event flagged for follow-up if pattern emerges

**E3: Driver Disagrees with Event Classification**
- If driver contests classification:
  - Driver Sarah claims: "That's not distraction - I was adjusting AC"
  - Safety Officer reviews video again with Sarah's context
  - If unconvinced: "I see what you mean, but the risk is still there - let's discuss prevention"
  - Document disagreement and Safety Officer's final determination

**E4: Event Occurred During Legitimate Break**
- If event occurred during authorized rest:
  - Event flagged: "Distraction event during scheduled rest"
  - Safety Officer verifies: Event time matches authorized break (parking lot, engine off)
  - Determination: Event not safety concern (vehicle not in operation)
  - Mark event as "false positive - vehicle not in operation"

#### Postconditions:
- All flagged video events reviewed and classified
- Coaching needs identified and documented
- Coaching sessions scheduled for drivers requiring intervention
- AI system trained with feedback for improved future classifications
- Event review metrics tracked for performance measurement
- Safety-conscious culture reinforced through proactive review

#### Business Rules:
- BR-SO-043: Critical events must be reviewed within 24 hours
- BR-SO-044: All reviewed events documented with classification and notes
- BR-SO-045: Coaching required for any valid safety concern event
- BR-SO-046: False positive events marked to improve AI accuracy
- BR-SO-047: Video events must be reviewed before driver coaching conversation
- BR-SO-048: Review metrics tracked for safety officer productivity and accuracy
- BR-SO-049: AI model retraining occurs weekly based on cumulative feedback

#### Related User Stories:
- US-SO-007: Video Event Review and Prioritization

---

### UC-SO-008: Exonerate Drivers Using Video Evidence

**Use Case ID**: UC-SO-008
**Use Case Name**: Exonerate Drivers Using Video Evidence
**Actor**: Safety Officer (primary), Insurance Adjuster (secondary), Legal Team (secondary)
**Priority**: High

#### Preconditions:
- Incident occurred with video telematics equipped vehicle
- Video footage captured incident
- Insurance claim filed for incident
- Secure video sharing platform available
- Video in court-admissible format with metadata

#### Trigger:
- Driver reports not-at-fault incident
- Insurance claim filed requiring evidence
- Liability question raised by third party
- Safety Officer reviews incident and identifies exonerating evidence

#### Main Success Scenario:
1. Driver Mike reports: "Had an accident today - other driver at fault"
2. Dispatch creates incident: INC-2025-1234 (collision)
3. Insurance claim filed with estimate: $12,000 damage to company vehicle
4. Third-party insurer disputes: "Your driver may be partially at fault"
5. Safety Officer investigates and opens video for review
6. System displays available evidence:
   - Video footage: 45 seconds (15 sec before to 30 sec after)
   - Telematics: Speed, braking, acceleration data
   - GPS: Exact location coordinates
   - Metadata: Timestamp, vehicle ID, driver ID

7. Safety Officer reviews video evidence:
   - 0:00 - Company vehicle (Mike) traveling straight through green light, speed 35 mph
   - 0:10 - Other vehicle (sedan) approaching from left, stopped at red light
   - 0:15 - Other vehicle accelerates through red light (running traffic signal)
   - 0:18 - Other vehicle enters company vehicle's path
   - 0:20 - Mike brakes (0.6g deceleration) attempting to avoid
   - 0:22 - Collision (t-bone impact on driver's side)
   - 0:25-0:45 - Both vehicles at rest after collision

8. Safety Officer analyzes liability from video:
   - Company vehicle: Traveling through properly lighted green signal
   - Other vehicle: Ran red light (clear violation of right-of-way)
   - Company driver (Mike): No violation, appropriate reaction time
   - Conclusion: **Company vehicle NOT at fault**

9. Safety Officer extracts court-admissible video evidence:
   - Exports video in H.264 format (.mp4)
   - Includes metadata: Timestamp, GPS coordinates, speed data
   - Generates certificate of authenticity
   - Documents chain of custody
   - Signs digital evidence package

10. Safety Officer prepares exoneration report:
    - Title: "Accident Reconstruction - Not-At-Fault Determination"
    - Summary: "Video evidence clearly shows other vehicle ran traffic signal"
    - Liability conclusion: "Company vehicle has right-of-way, not at fault"
    - Recommendations: "Deny claim liability, provide video evidence to insurer"

11. Safety Officer sends evidence package to insurance adjuster:
    - Creates secure sharing link (7-day access window)
    - Email to adjuster: "Accident evidence for claim INC-2025-1234"
    - Link expires automatically after 7 days (security)
    - Access logs recorded (who viewed, when viewed)

12. Insurance adjuster reviews evidence:
    - Adjuster views video: "Clear as day - other vehicle ran red light"
    - Adjuster reviews metadata: Timestamp and GPS verify location
    - Adjuster downloads video and evidence report
    - Adjuster determination: Not-at-fault claim denial to other party

13. Third-party insurer receives evidence package:
    - Views video evidence from company
    - Accepts determination: "Your vehicle has clear right-of-way"
    - Settles claim without company liability
    - Rejects their policyholder's claim as at-fault accident

14. Claim resolution:
    - Company deductible waived (due to clear not-at-fault determination)
    - Other party's insurance pays for all damage
    - Company receives full repair reimbursement: $12,000
    - Repair completed, vehicle returned to service

15. Safety Officer documents exoneration outcome:
    - Incident: INC-2025-1234
    - Determination: Not-at-fault
    - Evidence: Video exoneration
    - Insurance outcome: ✓ Favorable (no company liability)
    - Financial impact: +$12,000 (full reimbursement)
    - Driver impact: ✓ Exonerated (no mark against record)

16. System calculates exoneration metrics:
    - Exonerations YTD: 18 of 28 incidents = 64% exoneration rate
    - Estimated insurance savings: 64% × avg settlement = $156,000
    - Driver exoneration: Protects driver reputation and driving record

#### Alternative Flows:

**A1: Video Shows Driver Partially At Fault**
- 8a. If video evidence shows company driver contribution:
  - Video shows: Mike was speeding (45 mph in 35 mph zone)
  - Other vehicle: Also ran red light (both at fault)
  - Liability assessment: "Both drivers contributed - comparative fault"
  - Insurance settlement: Company accepts 30% fault liability
  - Driver coaching: Speed compliance training required

**A2: No Video Available - Legal Team Requests Support**
- 5a. If video footage missing but legal action threatened:
  - Video unavailable (telematics malfunction that day)
  - Third-party claims company at fault
  - Legal team requests: Telematics data for reconstruction
  - Safety Officer provides: Speed data, acceleration data (no video)
  - Data suggests: Company vehicle appropriate response
  - Legal argument: Telematics data supports driver testimony of innocence

**A3: Driver Video Testimony Prepared for Legal**
- 1a. If case may proceed to litigation:
  - Safety Officer schedules: Detailed interview with driver Mike
  - Prepares Mike: "Here's what the video shows, here's your testimony"
  - Mike provided with: Copy of video, timeline, analysis
  - Legal team trains Mike: Testimony consistency with video evidence
  - Video used in: Deposition or trial if case goes to litigation

**A4: Multiple Incident Exonerations Show Pattern**
- 15a. If fleet shows high exoneration rate:
  - Year-to-date: 18 exonerations of 28 incidents = 64%
  - Trend: Exoneration rate increasing (previous year was 52%)
  - Analysis: Better driver training and vehicle equipment improving fault avoidance
  - Insurance conversation: Present data for premium negotiation
  - Insurance carrier impressed: "Your fleet has excellent not-at-fault rate"

#### Exception Flows:

**E1: Video Shows Ambiguous Fault**
- If video doesn't clearly show fault:
  - Video captured but angle doesn't clearly show traffic signal status
  - Both vehicles' actions partially visible but timing unclear
  - Safety Officer assessment: "Video inconclusive - fault undetermined"
  - Insurance settlement: Comparative fault likely (50/50 split)
  - Legal team must rely on other evidence (witness statements, police report)

**E2: Video Reveals Driver Misconduct**
- If video shows driver violation unrelated to accident:
  - Video shows: Driver not wearing seatbelt (separate violation)
  - Liability assessment: "Driver not at fault for collision but has compliance violation"
  - Safety Officer actions: Report seatbelt violation to management
  - Driver coaching: Compliance training required
  - Insurance claim: Still not-at-fault but driver discipline imposed

**E3: Chain of Custody Challenged**
- If opposing counsel questions evidence integrity:
  - Defense attorney: "How do we know this video hasn't been edited?"
  - Safety Officer documents: Chain of custody from capture to present
  - IT department provides: Metadata authentication (digital signature)
  - Video forensics expert called: Testifies to video authenticity
  - Challenge overcome through documentation and expert testimony

**E4: Secure Link Expires Before Review**
- If adjuster unable to access evidence within window:
  - Insurance adjuster on vacation - 7-day link expires before review
  - Adjuster requests: "Can you resend the link?"
  - Safety Officer sends: New 7-day secure link
  - Evidence access maintained without security compromise

#### Postconditions:
- Video evidence reviewed and exoneration determination documented
- Secure evidence package prepared for insurance/legal
- Exoneration documented in driver record (positive)
- Insurance claim resolved favorably
- Driver reputation and record protected
- Exoneration metrics tracked for insurance negotiations

#### Business Rules:
- BR-SO-050: Video evidence for incidents retained minimum 90 days, extended for litigation
- BR-SO-051: All exoneration evidence must have unbroken chain of custody
- BR-SO-052: Video exports for external sharing use secure links with time expiration
- BR-SO-053: Access logs for shared evidence maintained for audit trail
- BR-SO-054: Exoneration determinations require documented analysis and conclusion
- BR-SO-055: Court-admissible video must include metadata (timestamp, GPS, speed)
- BR-SO-056: Exoneration rate tracked as metric for insurance premium negotiations

#### Related User Stories:
- US-SO-008: Driver Exoneration and Liability Protection

---

## Epic 4: Safety Compliance Monitoring

### UC-SO-009: Monitor DOT and FMCSA Compliance

**Use Case ID**: UC-SO-009
**Use Case Name**: Monitor DOT and FMCSA Compliance
**Actor**: Safety Officer (primary), Compliance Manager (secondary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- DOT compliance requirements configured in system
- FMCSA data feeds available (Safety Measurement System scores)
- ELD system integration operational
- Drug testing provider integration available
- Compliance tracking database operational

#### Trigger:
- Safety Officer opens compliance dashboard at start of week
- FMCSA SMS score update received
- Compliance deadline approaching (inspection, MVR, testing)
- DOT audit preparation required

#### Main Success Scenario:
1. Safety Officer opens Compliance Dashboard
2. System displays comprehensive DOT/FMCSA compliance status:

   **FMCSA Safety Measurement System (SMS) Status**:
   - Current SMS Score: 78.5
   - Percentile: 35th (better than 65% of carriers)
   - Last updated: 5 days ago
   - Trend: Stable (was 79.2 three months ago - improving)

   **FMCSA BASICs Performance**:
   - Unsafe Driving: 68/100 (below average) ⚠
   - Crash Indicator: 45/100 (good)
   - HOS Compliance: 82/100 (good)
   - Vehicle Maintenance: 75/100 (average)
   - Driver Fitness: 88/100 (excellent)
   - Controlled Substance/Alcohol: 95/100 (excellent)

3. System highlights areas needing attention:
   - **Unsafe Driving score (68) below target (75)**
   - Root cause analysis: "Multiple speeding violations and harsh events reported"
   - Recommendation: "Implement enhanced driver coaching program"

4. Safety Officer reviews compliance requirements checklist:

   **Annual Vehicle Inspections**:
   - Required by: 49 CFR Part 396
   - Fleet size: 50 vehicles
   - Compliant: 47 vehicles (94%) ✓
   - Overdue: 2 vehicles (4%) ⚠
   - Action: Schedule inspections for 2 overdue vehicles (due in 7 days)
   - Next due dates for all vehicles visible in calendar

5. **Hours of Service (HOS) Compliance**:
   - Regulation: 49 CFR Part 395
   - ELD integration: ✓ Active
   - Violations past 30 days: 2 (below 3% threshold) ✓
   - Recent violations:
     - Driver Tom: Exceeded 11-hour drive limit by 23 minutes
     - Driver Sarah: Recorded 8 hours on-duty time in 24-hour period
   - Violations documented and driver training assigned

6. **Drug and Alcohol Testing Program**:
   - Required by: 49 CFR Part 382
   - Random testing rate: 50% of drivers (compliant with regulation)
   - Tests completed this quarter: 18 of 50 drivers (36% progress)
   - Testing plan for remaining quarter: 32 additional tests needed
   - Last positive result: None (clean fleet)

7. **Driver Qualification Files (DQF)**:
   - Requirement: 49 CFR Part 391
   - Required documents per driver:
     - Application (Form MCSA-5876)
     - License copy
     - Medical certificate
     - MVR check (annual)
     - Training records
   - Audit status: 48/50 drivers have complete DQF ✓
   - Incomplete: 2 new hires (assigned DQF preparation)

8. **Motor Vehicle Record (MVR) Checks**:
   - Requirement: Annual minimum per 49 CFR 391.23
   - Last cycle: Completed 6 months ago (45 drivers)
   - Due in next 6 months: All 50 drivers
   - Upcoming MVR dates: Scheduled monthly (12 drivers next month)
   - Plan: All drivers rechecked before annual anniversary

9. **Safety Officer reviews upcoming compliance deadlines**:
   - Next 30 days:
     - 12 MVR checks due
     - 2 vehicle inspections due
     - 8 drug tests scheduled
     - 6 drivers' medical cards expiring (need renewal reminders)
   - Next 90 days: 18 more vehicle inspections due (quarterly schedule)

10. Safety Officer addresses non-compliance issues:
    - Issue 1: Unsafe Driving score (68) below target
      - Action plan: Implement defensive driving training program
      - Target audience: All drivers
      - Timeline: Implement within 30 days
      - Expected outcome: Unsafe Driving score improve to 75+

    - Issue 2: Two vehicle inspections overdue
      - Action: Email maintenance department - schedule immediately
      - Vehicles: #342, #407
      - Required by: 7 days (before compliance deadline)
      - Responsible: Maintenance Manager

11. Safety Officer prepares DOT Audit Readiness Assessment:
    - Audit preparation checklist:
      - Driver Qualification Files: 48/50 complete ✓
      - Vehicle Maintenance Records: All current ✓
      - HOS Records: All current ✓
      - Drug Testing Documentation: Complete ✓
      - Inspection Records: 47/50 current ✓ (2 due in 7 days)
    - Overall Readiness: 97% (excellent - only minor issues)
    - Recommendation: "Fleet ready for DOT audit - address 2 inspections before audit"

12. Safety Officer generates compliance scorecard for monthly management meeting:
    - SMS Score: 78.5 (trend: improving) ✓
    - Annual Inspections: 94% compliant
    - HOS Violations: 2 this month (below threshold) ✓
    - Drug Test Program: On schedule
    - DQF Completeness: 96% ✓
    - Overall compliance grade: A (good standing)

13. System sends automated compliance notifications:
    - Email to Maintenance Manager: "2 vehicle inspections due in 7 days"
    - Email to Driver Manager: "6 medical card renewals due in 30 days"
    - Email to HR: "Drug testing schedule for next month (8 tests)"
    - SMS to Safety Officer: "Overdue vehicle inspections alert"

14. Safety Officer monitors compliance trend over time:
    - SMS Score history (12 months):
      - 12 months ago: 85.2 (declining)
      - 9 months ago: 82.1
      - 6 months ago: 80.5
      - 3 months ago: 79.2
      - Current: 78.5 (trend: declining ⚠)
    - Analysis: Score declining despite recent safety initiatives
    - Investigation needed: Determine why trend is negative

#### Alternative Flows:

**A1: FMCSA SMS Score Triggers Critical Alert**
- 1a. If SMS score falls into critical range:
  - SMS score: 92.5 (above 80 threshold = high risk)
  - System alert: "⚠ CRITICAL: SMS score indicates elevated safety risk"
  - Escalation: Immediate notification to Fleet Manager and Safety Director
  - Action required: Develop corrective action plan within 5 days
  - Likely causes: Multiple crashes, HOS violations, or safety incidents

**A2: DOT Audit Scheduled - Full Readiness Assessment**
- 11a. If DOT audit notification received:
  - DOT notification: Audit scheduled for 30 days from now
  - Safety Officer initiates: Full compliance audit preparation
  - Checklist created: All required documents and systems reviewed
  - Identified gaps: 2 vehicle inspections overdue, 3 incomplete DQFs
  - Remediation: 30-day plan to address all gaps before audit
  - Weekly tracking: Monitor progress toward audit readiness

**A3: Corrective Action Plan Required for Violations**
- 10a. If violations identified requiring response:
  - HOS violations: 5 violations in past 60 days (above 3% threshold)
  - FMCSA violation notice received: "Implement HOS compliance program"
  - Safety Officer develops: Detailed corrective action plan
  - Plan includes: Driver training, ELD enhancements, monitoring protocols
  - Submission: Plan submitted to FMCSA within 30 days
  - Follow-up: Monthly reporting on plan execution

**A4: State-Specific Compliance Requirements**
- 1a. If operating in states with additional requirements:
  - Massachusetts vehicle registration: Requires annual inspection certification
  - New York hazmat permit: Requires company safety certification
  - Connecticut drug testing: Requires state-level documentation
  - Safety Officer ensures: All state-level requirements met in addition to federal

#### Exception Flows:

**E1: FMCSA Data Feed Unavailable**
- If SMS score cannot be updated:
  - System displays: "FMCSA data feed unavailable - last update 12 days ago"
  - Safety Officer uses: Previous score as current indicator
  - Note added: "Compliance dashboard using cached data due to data feed issue"
  - IT team investigates: FMCSA API connectivity
  - Once restored: Dashboard updated with current data

**E2: Incomplete or Conflicting Compliance Data**
- If data inconsistencies detected:
  - Safety Officer notes: "Vehicle #342 shows 2 inspection dates in system"
  - Investigation: Which inspection record is correct?
  - Resolution: Maintenance confirms actual inspection date
  - System corrected: Accurate data entered
  - Process review: Implement controls to prevent future conflicts

**E3: Non-Compliance Discovered During Audit**
- If compliance gap found too late:
  - Safety Officer reviewing files: Driver Tom's DQF missing medical certificate
  - Discovery date: 2 days before DOT audit
  - Emergency action: Tom's medical exam scheduled immediately
  - Result: Certificate obtained 1 day before audit (last-minute resolution)
  - Lesson learned: Implement earlier automated alerts for upcoming deadlines

**E4: Supplier/Vendor Non-Compliance Affects Fleet**
- If third-party creates compliance issue:
  - Drug testing provider: Lab fails quality audit (results now suspect)
  - Impact: Fleet's drug testing program results questioned
  - Response: Independent retest of all drivers
  - Documentation: All retesting results submitted to FMCSA
  - Vendor change: Contracted with new testing provider

#### Postconditions:
- Comprehensive DOT/FMCSA compliance status documented
- Non-compliance issues identified with action plans
- Automated notifications ensure no deadlines missed
- Audit readiness assessed and gaps remediated
- SMS score trend analyzed for long-term compliance strategy
- Monthly compliance scorecard provided to management
- DOT audit preparation completed before inspection

#### Business Rules:
- BR-SO-057: Compliance dashboard reviewed minimum weekly
- BR-SO-058: Non-compliance issues must have corrective action plan within 48 hours
- BR-SO-059: Annual vehicle inspection deadline is hard stop (cannot operate if expired)
- BR-SO-060: MVR checks completed within 30 days of requirement deadline
- BR-SO-061: Drug testing program maintained at required percentage (50% random minimum)
- BR-SO-062: SMS score trend monitored - score increase above 80 triggers alert
- BR-SO-063: All compliance documentation retained 5 years per DOT requirements

#### Related User Stories:
- US-SO-009: DOT and FMCSA Compliance Management

---

### UC-SO-010: Manage OSHA Compliance and Recordkeeping

**Use Case ID**: UC-SO-010
**Use Case Name**: Manage OSHA Compliance and Recordkeeping
**Actor**: Safety Officer (primary), HR Manager (secondary), Occupational Health Provider (external)
**Priority**: Medium

#### Preconditions:
- OSHA 300 Log system available
- Incident reporting system capturing workplace injuries
- OSHA form templates available (300, 300A, 301)
- 3-year injury history available for baseline

#### Trigger:
- Workplace injury or illness reported
- OSHA Form 300A annual posting deadline (February 1)
- OSHA compliance audit required
- Injury trend analysis for preventive intervention

#### Main Success Scenario:
1. Fleet maintenance technician (Ben) reports workplace injury:
   - Event: Cut hand while removing sharp part from vehicle
   - Time: 2:15 PM during maintenance shift
   - Location: Main facility maintenance shop
   - Severity: Minor laceration requiring first aid treatment

2. Safety Officer receives injury report through incident management system
3. System prompts: "Workplace injury report - OSHA classification required"
4. Safety Officer gathers injury details:
   - Employee: Ben Johnson
   - Injury: Laceration on right hand (palm area)
   - First aid provided: Cleaned, bandaged, antibiotic applied (no stitches needed)
   - Medical visit: Attended occupational health clinic same day
   - Medical assessment: First aid + observation (no lost time)
   - Return to work: Full duty next day

5. Safety Officer classifies injury for OSHA:
   - Classification options:
     - First aid only (not OSHA recordable)
     - Recordable injury
     - Lost workday case
     - Restricted duty case

6. Safety Officer determines classification:
   - Severity: Minor laceration
   - Medical treatment: First aid + occupational health exam
   - Work restriction: None - returned to full duty next day
   - Classification: **Recordable injury** (occupational health involvement = recordable)
   - OSHA 300 Log entry: Required

7. Safety Officer enters injury into OSHA 300 Log:
   - Employee name: Ben Johnson
   - Date of injury: Today's date
   - Date employee noticed condition: Same day
   - Where injury occurred: Maintenance shop floor
   - Department: Vehicle Maintenance
   - Injury description: Laceration to palm of right hand
   - Parts of body affected: Right hand - finger/palm area
   - Cause: Cut from sharp metal part of vehicle
   - Type of injury: Cut/puncture
   - Treatment received: First aid + occupational health clinic visit
   - Outcome status: Returned to full duty (no lost time, no restrictions)
   - Form 301 incident report: Generated automatically

8. System provides OSHA Form 301 (Injury and Illness Incident Report):
   - Employee name and identification: Ben Johnson, EMP-2847
   - Employer name and address: Capital Tech Alliance, main facility
   - Injury description: "Laceration to right hand palm while removing vehicle component"
   - Date and time of incident: Today, 2:15 PM
   - Witness information: Mike Torres (coworker), Sarah Chen (supervisor)
   - Area of body affected: Right hand/palm area
   - What object/substance caused injury: Sharp metal vehicle part edge
   - Corrective action recommended: Implement protective gloves requirement for this task

9. Safety Officer reviews OSHA 300 Log dashboard:
   - Calendar Year 2025 (current):
     - Total injuries recorded: 7
     - Lost workday cases: 1 (broken ankle - 45 days lost)
     - Restricted duty cases: 2 (other incidents)
     - First aid only cases: 4 (not recordable)
   - TRIR calculation:
     - Formula: (Recordable cases × 200,000) / Employee hours worked
     - Data: 7 recordable cases, 50 FTE employees, 2,080 hours/year = 100,000 employee hours
     - TRIR: (7 × 200,000) / 100,000 = 14.0
     - Industry benchmark (fleet operations): 4.5-5.5
     - Assessment: Fleet TRIR above industry average (concerning)

10. Safety Officer calculates DART Rate:
    - DART: Days Away/Restricted/Transfer injuries
    - Calculation: 1 lost workday case (45 days) + 2 restricted duty cases (7 days + 14 days)
    - Total: 3 DART cases, 66 days total
    - DART Rate: (3 × 200,000) / 100,000 = 6.0
    - Industry benchmark: 2.5-3.5
    - Assessment: Fleet DART rate significantly above industry average (high concern)

11. Safety Officer identifies injury trend and patterns:
    - Injuries by category:
      - Vehicle maintenance: 4 injuries (57%) - HIGH concentration
      - Warehouse/storage: 2 injuries
      - Administrative: 1 injury
    - Root causes:
      - Sharp edges/points: 3 injuries
      - Lifting/strain: 2 injuries
      - Cuts/abrasions: 4 injuries
    - Pattern: Maintenance department safety risk disproportionately high

12. Safety Officer develops corrective action plan for maintenance:
    - Action 1: Require cut-resistant gloves for all maintenance tasks (by week 1)
    - Action 2: Safety toolbox talk on hazard identification (by week 2)
    - Action 3: Inspect work area for sharp edges and implement shields/covers (by week 3)
    - Action 4: Provide ergonomic training for lifting tasks (by week 4)
    - Target outcome: Reduce maintenance injuries 50% within 3 months

13. Safety Officer ensures OSHA posting compliance:
    - OSHA Form 300A (Annual Summary) generation timeline:
      - Due by February 1 each year (posting deadline)
      - Current date: November 10, 2025
      - Posting deadline: February 1, 2026 (about 3 months away)
    - System reminder: "OSHA 300A posting due in 84 days"

14. Ben receives follow-up care confirmation:
    - Safety Officer check-in: "How's your hand healing? Any concerns?"
    - Ben reports: "Much better - no pain today. Ready for work"
    - Safety Officer documents: "Employee progressing normally - return to work confirmed"
    - File note: "Occupational health cleared for full duty"

15. Safety Officer implements prevention measure:
    - Orders cut-resistant gloves for all maintenance staff
    - Schedules safety meeting on sharp edge hazards
    - Coordinates with maintenance supervisor on hazard mitigation
    - Budget approved: $300 for gloves + $200 for hazard improvements

#### Alternative Flows:

**A1: Serious Injury Requiring Lost Workday**
- 4a. If employee sustains serious injury:
  - Employee fractures leg in equipment accident
  - Medical assessment: Surgery required, 90 days lost work expected
  - OSHA classification: **Lost workday case** (serious injury)
  - Form 300 entry: Marked as lost workday injury
  - Regulatory notification: May require OSHA reporting if >3 days lost work
  - Return-to-work protocol: Occupational medicine consultation required before return

**A2: OSHA On-Site Inspection**
- 11a. If OSHA inspection triggered:
  - OSHA inspector arrives: Random workplace inspection
  - Safety Officer conducts: Facility walkthrough with inspector
  - Inspector reviews: OSHA 300 Log, safety procedures, incident reports
  - Findings: 2 violations identified (inadequate guards on machinery)
  - Corrective action plan: Safety Officer develops remediation plan
  - Follow-up inspection: 30 days to verify corrections completed

**A3: Work-Related Illness Claim**
- 4a. If employee reports occupational illness:
  - Employee reports: Persistent back pain from repetitive lifting
  - Medical evaluation: Occupational medicine assessment
  - Assessment: Work-related strain injury (causation linked to job duties)
  - OSHA classification: Recordable occupational illness
  - Log entry: Illness recorded in OSHA 300 Log
  - Treatment: Physical therapy, ergonomic modifications, potential work restrictions

**A4: Injury Data Used for Safety Program ROI**
- 11a. If demonstrating safety program effectiveness:
  - Before program (2024): 12 recordable injuries, TRIR 24.0
  - Program implemented (2025): Hazard training, equipment upgrades, PPE
  - After program (2025 YTD): 7 recordable injuries (trending toward 10-11 annual)
  - TRIR improvement: 24.0 → estimated 14-15 (40% reduction)
  - Cost-benefit: Program cost $5K, injury cost savings $80K+ → strong ROI

#### Exception Flows:

**E1: Injury Classification Dispute**
- If employee disagrees with OSHA classification:
  - Employee claims: Injury should be classified as lost workday (to receive benefits)
  - Medical evidence: Shows employee capable of full duty return
  - Safety Officer determination: Classifies as recordable, non-lost-workday
  - Employee appeals: HR and occupational health review classification
  - Final decision: Medical evidence supports non-lost-workday status
  - Documentation: All evaluations retained for potential audit challenge

**E2: OSHA 300A Posting Deadline Missed**
- If annual posting deadline passes without Form 300A:
  - Deadline date: February 1 (passing unmeet)
  - Violation discovered: April 15 during routine compliance check
  - Corrective action: Form 300A posted immediately (late but now compliant)
  - Potential liability: OSHA could fine for late posting ($16,131 per violation)
  - Prevention: Implement calendar reminder system for deadline tracking

**E3: Employee Injury Claim Conflicts with OSHA Recording**
- If workers' compensation claim conflicts with OSHA classification:
  - Injury classified as: Recordable (OSHA) but first aid only (workers' comp)
  - Discrepancy: Different evaluations by different providers
  - Resolution: Independent medical evaluation requested
  - Final determination: OSHA classification supersedes workers' comp classification
  - All records updated for consistency

**E4: Multiple Employees from Same Incident**
- If single incident injures multiple employees:
  - Equipment malfunction injures 2 maintenance workers
  - Employee 1: Minor laceration - recordable
  - Employee 2: Serious laceration - lost workday
  - OSHA entries: Separate 300 Log entries for each employee
  - Root cause: Equipment maintenance failure - corrective action addresses root
  - All employees: Safety investigation and incident review conducted

#### Postconditions:
- Workplace injury properly classified and OSHA documented
- Corrective actions identified and implemented
- Employee follow-up and return-to-work coordination completed
- Injury trend analysis performed for prevention planning
- OSHA compliance confirmed and documented
- Annual Form 300A prepared for February posting deadline

#### Business Rules:
- BR-SO-064: All workplace injuries evaluated for OSHA recordability within 48 hours
- BR-SO-065: Recordable injuries entered in OSHA 300 Log within 7 days of determination
- BR-SO-066: OSHA Form 300A annual summary posted by February 1 each year
- BR-SO-067: Injury records retained for 5 years per OSHA requirements
- BR-SO-068: TRIR and DART calculations updated monthly for trend monitoring
- BR-SO-069: Injuries with TRIR contribution corrective action developed within 14 days
- BR-SO-070: Employee follow-up and return-to-work plan documented for all lost-time injuries

#### Related User Stories:
- US-SO-010: OSHA Compliance and Workplace Safety

---

## Epic 5: Risk Assessment and Mitigation

### UC-SO-011: Assess Fleet Risk and Identify High-Risk Drivers

**Use Case ID**: UC-SO-011
**Use Case Name**: Assess Fleet Risk and Identify High-Risk Drivers
**Actor**: Safety Officer (primary), Fleet Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Comprehensive data integration: incidents, telematics, violations, training
- Predictive analytics engine operational
- Historical risk and outcome data available (12+ months)
- Industry risk benchmarks available

#### Trigger:
- Safety Officer opens risk assessment dashboard
- Monthly risk review process conducted
- Quarterly strategic safety planning
- Insurance renewal or premium negotiation

#### Main Success Scenario:
1. Safety Officer opens Risk Assessment Dashboard
2. System displays comprehensive fleet risk analysis:

   **Fleet Risk Summary**:
   - Overall fleet risk score: 62/100 (Moderate risk)
   - Change from last month: +3 points (increasing risk trend ⚠)
   - Number of drivers: 50
   - Risk distribution:
     - Low risk (0-40): 28 drivers (56%)
     - Moderate risk (41-70): 18 drivers (36%)
     - High risk (71-85): 3 drivers (6%)
     - Critical risk (86-100): 1 driver (2%)

3. Safety Officer reviews driver risk assessment model:
   - Factors included in risk scoring:
     - Accident history (25% weight)
     - Traffic violations (20% weight)
     - Telematics behavior (25% weight)
     - Training completion (15% weight)
     - HOS compliance (15% weight)

4. System calculates individual driver risk scores:

   **Driver: Mike Torres (Risk Score: 28/100 - Low Risk)**
   - Accident history: 0 incidents in 3 years
   - Traffic violations: 0 speeding, 0 major violations
   - Telematics: Few harsh events, safe following distance
   - Training: 100% current, all certifications valid
   - HOS compliance: Perfect compliance history
   - Assessment: Excellent driver - suitable for high-priority routes

   **Driver: Tom Rodriguez (Risk Score: 54/100 - Moderate Risk)**
   - Accident history: 2 incidents in 3 years (preventable)
   - Traffic violations: 3 speeding, 2 reckless driving
   - Telematics: 5 harsh braking events in past month
   - Training: Training up to date but quality of performance uncertain
   - HOS compliance: 1 violation in past 6 months (within threshold)
   - Assessment: Adequate driver - needs behavior improvement

   **Driver: John Davis (Risk Score: 78/100 - High Risk)**
   - Accident history: 4 incidents in 3 years (concerning)
   - Traffic violations: 8 speeding, 3 reckless driving, 1 suspension
   - Telematics: 12 harsh braking events in past month (red flag)
   - Training: Overdue on safety training (not completed)
   - HOS compliance: 2 violations in past 6 months
   - Assessment: High-risk driver - requires intervention

   **Driver: Sarah Chen (Risk Score: 92/100 - Critical Risk) ⚠ ALERT**
   - Accident history: 6 incidents in 3 years (very concerning)
   - Traffic violations: 12+ violations, 2 point suspensions
   - Telematics: 24 harsh braking events in past month (severe)
   - Training: Multiple overdue trainings, not current
   - HOS compliance: 4 violations in past 6 months
   - Assessment: **CRITICAL - Driver poses significant risk - immediate action required**

5. Safety Officer reviews predictive risk analysis:
   - Prediction model (uses machine learning):
     - Drivers likely to have incident in next 30 days: 5 drivers
     - Predicted probability accuracy: 73% (based on historical validation)
     - Highest risk drivers identified:
       1. Sarah Chen - 87% probability of incident
       2. John Davis - 64% probability of incident
       3. Tom Rodriguez - 42% probability of incident

6. Safety Officer assesses risk by location/route:
   - High-risk routes (by incident history):
     - I-95 Boston corridor: 8 incidents YTD (23% of total)
     - Downtown Boston intersections: 6 incidents YTD (17%)
     - Route 128: 5 incidents YTD (14%)
   - High-risk times:
     - Rush hours (7-9 AM, 4-6 PM): 45% of incidents occur
     - Friday afternoons: Elevated incident rate

7. Safety Officer compares to industry benchmarks:
   - Fleet incident rate: 2.8 per 1M miles (industry benchmark: 3.2)
   - Fleet performance: Better than industry average ✓
   - Risk profile: Comparable to peer fleets
   - Benchmark analysis: Fleet is in good standing overall

8. Safety Officer identifies high-risk drivers requiring intervention:
   - **Critical Priority - Sarah Chen:**
     - Risk score: 92/100 (critical)
     - Recommendation: Immediate suspension from driving pending assessment
     - Action: Meeting with driver and manager to discuss safety concerns
     - Options: Intensive coaching, retraining, or termination
     - Timeline: Decision within 5 days

   - **High Priority - John Davis:**
     - Risk score: 78/100 (high risk)
     - Recommendation: Restricted to local low-risk routes
     - Action: Mandatory safety retraining + intensive coaching
     - Plan: 30-day performance improvement plan
     - Monitoring: Weekly check-ins and telematics review

   - **Moderate Priority - Tom Rodriguez:**
     - Risk score: 54/100 (moderate)
     - Recommendation: Standard coaching + performance monitoring
     - Action: Schedule coaching session on harsh braking/following distance
     - Plan: 60-day performance monitoring
     - Success criteria: Reduce harsh events 50%, maintain compliance

9. Safety Officer develops mitigation strategies:
   - **For Sarah Chen (Critical Risk):**
     - Immediate: Suspend from regular operations
     - Week 1: Mandatory meeting with Safety Officer and HR
     - Week 2-3: Intensive in-person safety assessment and retraining
     - Week 4: Evaluation of safety knowledge and attitude
     - Decision: Return to duty (with restrictions) or termination

   - **For John Davis (High Risk):**
     - Week 1: Route assignment to local low-risk routes only
     - Week 2: Begin defensive driving retraining course
     - Week 3-4: Intensive coaching on speeding/harsh braking
     - Week 5-6: Supervised ride-along with senior driver
     - Monthly: Performance review and continuation of restrictions

   - **For Tom Rodriguez (Moderate Risk):**
     - Week 1: Coaching session on harsh braking prevention
     - Week 2-4: Telematics monitoring and self-reflection exercises
     - Week 4: Follow-up coaching to assess improvement
     - Decision: Continue standard operations or escalate if no improvement

10. Safety Officer prepares risk mitigation report for Fleet Manager:
    - Fleet risk summary: Moderate overall, some elevated individual drivers
    - Critical issues: 1 driver (Sarah) requires immediate intervention
    - High-risk drivers: 2 drivers (John, others) requiring intensive coaching
    - Route-based risks: Boston urban routes elevated - consider enhanced training
    - Time-based risks: Rush hour incidents elevated - could consider trip scheduling

11. Safety Officer calculates risk-based insurance impact:
    - Current fleet risk score: 62/100 (moderate)
    - Insurance premium estimate: $X per vehicle annually
    - Scenario: Risk score improved to 50/100 (low-moderate)
    - Estimated premium reduction: 8-12% savings ($40K-60K annually)
    - ROI of safety program: Well-documented and quantified

#### Alternative Flows:

**A1: Flash Alert for Acute Risk Change**
- 1a. If individual driver risk score spikes suddenly:
  - Driver previously: Risk 45/100 (moderate)
  - Today's update: Risk 78/100 (high risk) - sudden 33-point increase
  - System alert: "⚠ RISK ALERT: Driver risk score significantly increased"
  - Investigation: Review recent incidents/violations
  - Cause: 3 speeding violations in past 2 days + harsh braking events
  - Action: Immediate supervisor contact to understand situation

**A2: Risk Score Improvement Recognized**
- 10a. If driver demonstrates risk improvement:
  - Driver previously: Risk 72/100 (high risk)
  - After intervention: Risk 42/100 (moderate) - 30-point improvement
  - Recognition: "Excellent improvement - driver responding well to coaching"
  - Action: Consider for increased responsibilities, preferred route assignments
  - Incentive: Performance bonus or recognition for improvement

**A3: External Factor Impacts Risk Profile**
- 2a. If external factors change risk landscape:
  - Weather event: Winter storm causing route hazard
  - System alert: "Weather hazard detected - route risk elevated"
  - Recommendation: Reduce assignments on high-risk routes during weather
  - Temporary risk scores adjusted: All drivers on affected routes +10 risk points
  - Revert when weather clears: Risk scores return to baseline

**A4: Predictive Model Accuracy Assessment**
- 5a. If Safety Officer validates predictive model:
  - Model prediction last month: 5 drivers at high risk of incident
  - Actual outcome: 3 of 5 drivers had incidents (60% accuracy)
  - 2 predicted drivers no incident (false positive)
  - Model refinement: Adjust weighting to improve accuracy
  - Ongoing validation: Model continuously validated and improved

#### Exception Flows:

**E1: Insufficient Data for New Driver Risk Assessment**
- If new driver lacks historical data:
  - New driver hired: Only 2 weeks of telematics data available
  - Risk assessment system: Cannot calculate reliable risk score
  - Status: "Insufficient data - recommend re-assessment after 90 days"
  - Interim assessment: Assign to supervised/mentor routes only
  - Data collection: Monitor intensively for baseline establishment

**E2: Risk Model Conflict with Actual Performance**
- If risk score contradicts observed behavior:
  - Driver Mark: Risk score 65/100 (high) based on historical data
  - Observation: Mark demonstrates consistently safe driving recently
  - Investigation: Previous incidents were 2+ years old, driver may have improved
  - Recommendation: Update risk model to weight recent data more heavily
  - Decision: Assign to standard routes despite historical risk score

**E3: Driver Termination Decision Based on Risk Assessment**
- If driver poses unacceptable risk:
  - Driver Sarah: Risk score 92/100 (critical)
  - Investigation: Multiple incidents, violations, non-compliance with training
  - Risk assessment: Unacceptable level of risk to fleet and public
  - HR decision: Terminate employment for safety reasons
  - Documentation: Risk assessment supports termination decision
  - Legal review: Safety rationale documented for potential legal challenge

#### Postconditions:
- Comprehensive risk assessment completed for all drivers
- High-risk drivers identified and intervention plans developed
- Predictive risk model provides proactive guidance
- Risk mitigation strategies implemented
- Insurance impact calculated based on fleet risk profile
- Monthly risk trends monitored and reported

#### Business Rules:
- BR-SO-071: Risk assessments conducted monthly minimum
- BR-SO-072: Critical risk drivers (>85) require immediate intervention
- BR-SO-073: High-risk drivers (71-85) require formal corrective action plan
- BR-SO-074: Risk scores recalculated weekly based on new incident/violation data
- BR-SO-075: Predictive risk model validated quarterly for accuracy
- BR-SO-076: Risk-based route assignment: Low-risk routes for high-risk drivers
- BR-SO-077: All risk assessment data available for insurance negotiations

#### Related User Stories:
- US-SO-011: Fleet Risk Assessment and Scoring

---

### UC-SO-012: Track Safety Program Performance and ROI

**Use Case ID**: UC-SO-012
**Use Case Name**: Track Safety Program Performance and ROI
**Actor**: Safety Officer (primary), Fleet Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Safety programs defined with objectives and targets
- Baseline safety metrics established
- Program participation data tracked
- Cost data available for programs and avoided incidents
- Historical incident data for comparison

#### Trigger:
- Safety Officer reviews program performance dashboard
- Program completion milestone reached
- Monthly safety program review meeting
- Annual budget review and program evaluation

#### Main Success Scenario:
1. Safety Officer opens Safety Programs Dashboard
2. System displays all active safety programs with status:

   **Active Programs (2025)**:

   **Program 1: Defensive Driving Training**
   - Status: Active
   - Start date: January 15, 2025
   - Objective: Improve driver awareness and reaction time to prevent collisions
   - Target audience: All drivers (50 total)
   - Timeline: Complete by December 31, 2025
   - Progress: 45 of 50 drivers completed (90% completion)
   - Budget: $8,500 (training costs)
   - Cost per driver: $170

   **Program 2: Telematics-Based Coaching**
   - Status: Active
   - Start date: March 1, 2025
   - Objective: Reduce harsh driving events and speeding violations
   - Target audience: All drivers with elevated safety event rates (20 drivers)
   - Timeline: 90-day coaching period (Mar-May)
   - Progress: 18 of 20 drivers completed coaching (90% completion)
   - Budget: $12,000 (Safety Officer time + admin)
   - Cost per driver: $600

   **Program 3: Vehicle Maintenance Optimization**
   - Status: Planned (not yet started)
   - Objective: Reduce mechanical breakdowns and improve vehicle reliability
   - Target: All vehicles (50 vehicles)
   - Timeline: July-December 2025
   - Budget: $25,000 (parts + labor)
   - Expected benefit: Reduced roadside breakdowns and driver stress

3. Safety Officer selects Defensive Driving Training to review performance:
4. System displays detailed program metrics:

   **Program: Defensive Driving Training**

   **Participation Metrics**:
   - Enrollment: 50 drivers invited
   - Completed: 45 drivers (90%) ✓ Exceeds 85% target
   - In progress: 3 drivers
   - Not started: 2 drivers
   - Average completion time: 14 days
   - Completion deadline: December 31, 2025
   - Status: On track for completion

   **Training Effectiveness**:
   - Quiz average score: 86% (exceeds 80% requirement)
   - Completion rate by region:
     - Boston region: 95% (19/20 drivers) ✓
     - Springfield region: 87% (13/15 drivers) ✓
     - Western region: 82% (8/10 drivers) ✓
   - Completion rate by driver category:
     - Experienced drivers (10+ years): 94%
     - Mid-career drivers (3-10 years): 89%
     - New drivers (<3 years): 88%
   - Barrier analysis: 2 drivers unable to complete cite scheduling conflicts

5. Safety Officer reviews incident impact of Defensive Driving Training:

   **Baseline Metrics (Pre-Training: Jan 2025)**:
   - Total incidents: 12 (January only)
   - Hard braking events: 45 (per month average)
   - Speeding violations: 18 (per month average)

   **Program Period Metrics (Post-Training: Apr-Jun 2025)**:
   - Trained drivers (45): 6 total incidents (3 months) = 2 incidents/month average
   - Untrained drivers (5): 4 total incidents (3 months) = 1.3 incidents/month average
   - Hard braking events: 28/month average (38% reduction) ✓
   - Speeding violations: 11/month average (39% reduction) ✓

   **Incident Reduction Analysis**:
   - Pre-training incident rate: 12/month
   - Post-training incident rate: 8.3/month
   - Overall reduction: 31% incident reduction
   - Confidence: Statistically significant (p<0.05)

6. Safety Officer calculates program ROI:

   **Program Costs**:
   - Training course license fees: $5,000
   - Instructor time (Safety Officer): $2,500
   - Administrative/system costs: $1,000
   - **Total Program Cost: $8,500**

   **Benefits Calculation**:
   - Incident cost baseline: $8,200 average per incident
   - Incidents prevented (estimated): 3.6 incidents/month × 9 months = 32.4 prevented incidents
   - Cost avoidance: 32.4 × $8,200 = $265,680
   - Insurance premium savings: 31% reduction = $18,000 (conservative estimate)
   - **Total Benefits: $283,680**

   **ROI Calculation**:
   - Formula: (Benefits - Costs) / Costs × 100%
   - ROI: ($283,680 - $8,500) / $8,500 × 100% = **3,240% ROI**
   - Payback period: <1 week (benefits exceed costs almost immediately)
   - Assessment: **Exceptional ROI - Outstanding program success**

7. Safety Officer compares program to industry benchmarks:
   - Industry average incident reduction from defensive driving: 15-20%
   - Fleet program achievement: 31% reduction ✓ Exceeds industry average
   - Industry average ROI: 200-300%
   - Fleet program ROI: 3,240% ✓ Significantly exceeds industry
   - Conclusion: Program more effective than industry average

8. Safety Officer reviews Telematics-Based Coaching program:

   **Program Results (90-day coaching)**:
   - Participating drivers: 20 high-risk drivers
   - Coaching completion: 18 of 20 (90%)
   - Coaching sessions completed: 54 total (average 3 per driver)
   - Average session duration: 45 minutes

   **Driver Behavior Improvement**:
   - Pre-coaching harsh events: Average 12/month per driver
   - Post-coaching harsh events: Average 5/month per driver
   - Reduction: 58% decrease in harsh driving events ✓
   - Speeding violations: 8 → 3 per driver (62% reduction) ✓
   - Following distance improvement: Measured via telematics sensors

   **Driver Engagement**:
   - Driver satisfaction with coaching: 4.2/5.0 stars
   - Driver comments: "Helpful and supportive," "Made me more aware"
   - Repeat coaching interest: 85% of drivers would continue if offered
   - Job satisfaction impact: 18% increase in driver satisfaction scores

   **Coaching Program ROI**:
   - Program costs: $12,000
   - Benefits: Reduced incident rate (58% reduction) × 20 drivers
   - Estimated cost avoidance: $95,000
   - Additional benefit: Improved driver retention (estimated $25K value)
   - **Total Benefits: $120,000**
   - **ROI: ($120,000 - $12,000) / $12,000 × 100% = 900% ROI**

9. Safety Officer prepares program summary for management:
   - Programs implemented: 2 active programs
   - Combined investment: $20,500
   - Combined benefits: $403,680
   - **Combined ROI: 1,868%**
   - Incident reduction achieved: 31% overall
   - Driver satisfaction improvement: Positive feedback
   - Insurance impact: 31% reduction translates to premium negotiation leverage

10. Safety Officer develops program recommendations:
    - Continue Defensive Driving Training (excellent results)
    - Expand Telematics-Based Coaching (high ROI, driver engagement)
    - Launch Vehicle Maintenance Optimization program (scheduled July)
    - Propose new program: Fatigue Management Training (address Friday incident spike)

11. Safety Officer prepares annual report for Fleet Manager:
    - Programs launched: 2 programs (1 more planned)
    - Estimated total annual benefit: $400,000+
    - Estimated total annual cost: $50,000
    - **Estimated annual ROI: 700%+**
    - Business case for safety investment: Strong evidence of value
    - Recommendation: Increase safety program budget by 20% for 2026

#### Alternative Flows:

**A1: Program Underperformance Triggers Review**
- 3a. If program results fall short of targets:
  - Program: Safety Leadership Workshop
  - Target: 80% completion rate
  - Actual: 62% completion rate
  - Issue: Low attendance and engagement
  - Investigation: Feedback indicates scheduling conflicts and relevance concerns
  - Adjustment: Reschedule sessions and revise content based on feedback
  - Re-launch: Retarget with improved approach

**A2: Negative ROI Program Recommendation**
- 10a. If program shows poor cost-benefit:
  - Program: Advanced Telematics Monitoring (very expensive system upgrade)
  - Cost: $50,000 annually
  - Benefit: Marginal incident reduction (5%) = $20,000 value
  - ROI: ($20,000 - $50,000) / $50,000 = -60% ROI (negative)
  - Recommendation: Discontinue program, reallocate budget to better-performing programs
  - Lesson learned: Not all safety investments generate positive ROI

**A3: Program Success Leads to Expansion**
- 10a. If program highly successful, expand scope:
  - Program: Defensive Driving Training (exceptional results)
  - Expansion: Add sessions for contractor drivers (currently excluded)
  - Expansion: Increase frequency (currently annual, propose biennial)
  - Expansion: Add supplementary virtual coaching modules
  - Budget increase: $15,000 additional investment projected
  - Expected additional benefit: $120,000 from expanded reach

**A4: Program Delayed - Timeline Impact**
- 10a. If program start date slips:
  - Vehicle Maintenance Optimization program: Planned July start
  - Delay: Parts procurement delayed (supply chain issue)
  - New start: September (2-month delay)
  - Impact: Reduced benefit window (5 months vs 6 months)
  - Adjustment: Extend program end date to maintain full benefit realization

#### Exception Flows:

**E1: Baseline Data Incomplete**
- If pre-program baseline data missing:
  - Defensive Driving program: No incident data available before training
  - Issue: Cannot calculate precise improvement percentage
  - Workaround: Use comparable fleet data as proxy baseline
  - Limitation: ROI calculation less precise but still positive
  - Improvement: Implement baseline capture process for future programs

**E2: External Factor Skews Program Results**
- If external factors affect outcome measurement:
  - Weather event: Winter storm causes spike in incidents
  - Incident spike during training period (unrelated to program)
  - Analysis: Separate weather-related incidents from program-affected incidents
  - Adjustment: Calculate ROI excluding weather-related outliers
  - Conclusion: Program effective despite external factor interference

**E3: Driver Attrition Affects Program Completion**
- If drivers leave during program:
  - Program participant: Driver John leaves company mid-program
  - Completion status: Unable to complete training (employee departed)
  - Calculation: Exclude John from completion rate but count as benefit loss
  - Impact: Completion rate slightly lower, but ROI still positive
  - Recommendation: Account for expected attrition in future program planning

**E4: Cost Overrun on Program Implementation**
- If actual program costs exceed budget:
  - Defensive Driving Training budget: $8,500
  - Actual costs: $10,200 (20% overrun)
  - Reason: Additional instructor time required for makeup sessions
  - Adjusted ROI: ($283,680 - $10,200) / $10,200 × 100% = 2,681% ROI
  - Still exceptional despite overrun
  - Process improvement: Better estimation for future programs

#### Postconditions:
- Program performance metrics documented and analyzed
- ROI calculated and compared to benchmarks
- Participant engagement and satisfaction assessed
- Program effectiveness proven through incident reduction data
- Program recommendations provided to management
- Successful programs continued, underperforming programs revised or discontinued
- Annual safety program ROI report provided to executive leadership

#### Business Rules:
- BR-SO-078: All safety programs have defined metrics for success measurement
- BR-SO-079: Program effectiveness evaluated minimum quarterly
- BR-SO-080: ROI calculations include both quantifiable and estimated benefits
- BR-SO-081: Programs with negative ROI reviewed for improvement or discontinuation
- BR-SO-082: Program baseline metrics established before implementation
- BR-SO-083: Safety program budget allocation justified through ROI analysis
- BR-SO-084: Program success stories documented and shared for company morale

#### Related User Stories:
- US-SO-012: Safety Program Management and ROI Tracking

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 12
- **High Priority**: 7 use cases
- **Medium Priority**: 5 use cases
- **Low Priority**: 0 use cases

### Epic Distribution:
1. **Incident Investigation and Analysis**: 3 use cases
2. **Driver Training and Certification Tracking**: 3 use cases
3. **Video Telematics Review and Coaching**: 2 use cases
4. **Safety Compliance Monitoring**: 2 use cases
5. **Risk Assessment and Mitigation**: 2 use cases

### Key Integration Points:
- **Video Telematics Platforms**: Samsara, Lytx, Netradyne, Motive
- **Learning Management Systems**: Moodle, TalentLMS, Cornerstone
- **Document Storage**: Azure Blob Storage with OCR capability
- **Real-Time Communication**: Email, SMS, in-app messaging, video conferencing
- **Compliance Data Feeds**: FMCSA DataQs, DOT Safety Measurement System
- **ELD Systems**: KeepTruckin, Samsara, Verizon Connect
- **MVR Providers**: HireRight, Sterling, Checkr
- **Predictive Analytics**: Machine learning models for risk assessment
- **Insurance Systems**: Claims management, premium negotiation platforms

### Safety Officer-Specific Capabilities:
- **Incident investigation** with root cause analysis templates
- **Video reconstruction** with synchronized telematics overlay
- **Automated compliance monitoring** with deadline tracking
- **Driver risk assessment** with predictive analytics
- **Training management** with LMS integration
- **Coaching session** scheduling and effectiveness tracking
- **OSHA 300 Log** auto-generation and form management
- **DOT/FMCSA compliance** status dashboard with audit readiness
- **Safety program ROI** tracking and impact measurement
- **Exoneration evidence** management for insurance claims

---

## Related Documents

- **User Stories**: `user-stories/05_SAFETY_OFFICER_USER_STORIES.md`
- **Test Cases**: `test-cases/05_SAFETY_OFFICER_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/05_SAFETY_OFFICER_WORKFLOWS.md` (to be created)
- **UI Mockups**: `mockups/safety-officer-dashboard/` (to be created)
- **API Specifications**: `api/safety-officer-endpoints.md` (to be created)
- **Compliance Matrix**: `compliance/DOT_FMCSA_COMPLIANCE_MATRIX.md`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Requirements Team | Initial safety officer use cases created |

---

*This document provides detailed use case scenarios supporting the Safety Officer user stories and operational workflows.*
