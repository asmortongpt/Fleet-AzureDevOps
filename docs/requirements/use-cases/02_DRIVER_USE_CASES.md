# Driver - Use Cases

**Role**: Driver
**Access Level**: Limited (Mobile-first, field operations)
**Primary Interface**: Mobile App (iOS/Android)
**Version**: 1.0
**Date**: November 10, 2025

---

## Table of Contents
1. [Pre-Trip and Post-Trip Inspections](#epic-1-pre-trip-and-post-trip-inspections)
2. [Hours of Service (HOS) Logging](#epic-2-hours-of-service-hos-logging)
3. [Fuel Management](#epic-3-fuel-management)
4. [Incident and Damage Reporting](#epic-4-incident-and-damage-reporting)
5. [Mobile Workflows and Offline Sync](#epic-5-mobile-workflows-and-offline-sync)

---

## Epic 1: Pre-Trip and Post-Trip Inspections

### UC-DR-001: Complete Pre-Trip Vehicle Inspection

**Use Case ID**: UC-DR-001
**Use Case Name**: Complete Pre-Trip Vehicle Inspection
**Actor**: Driver (primary), Dispatcher (secondary)
**Priority**: High
**Mobile-First**: 95% (full mobile operation with optional desktop sync)

#### Preconditions:
- Driver is logged into mobile app
- Driver is assigned to a vehicle for the day
- GPS location is available
- Vehicle-driver pairing system is operational

#### Trigger:
- Driver begins shift and needs to verify vehicle safety before starting route
- System prompts driver at clock-in to complete pre-trip inspection
- Driver manually selects "Start Inspection" from home screen

#### Main Success Scenario:
1. Driver Marcus opens mobile app at 6:45 AM (shift start)
2. System displays home screen with prominent "PRE-TRIP INSPECTION" button
3. Driver taps inspection button
4. System auto-loads vehicle assignment: "Vehicle #342 - Freightliner Cascadia"
5. GPS confirms driver location matches vehicle location at depot
6. System displays standardized inspection checklist (DVIR format):
   - **Exterior Lights**: Headlights, brake lights, turn signals, clearance lights
   - **Tires and Wheels**: Tread depth, pressure, damage, lug nuts
   - **Brakes**: Brake pedal feel, park brake function, air brake pressure gauge
   - **Fluid Levels**: Coolant, oil, transmission fluid, brake fluid, power steering
   - **Cargo Area**: Tie-downs secure, load balanced, no shifting cargo
   - **Windshield and Wipers**: No cracks, wipers functional
   - **Interior Controls**: Steering wheel, mirrors, seatbelts, horn
   - **Emergency Equipment**: Fire extinguisher, warning triangles, flares
7. Driver taps "Lights" section
8. System expands with sub-items: Headlights (Pass/Fail), Brake Lights, Turn Signals, etc.
9. Driver taps "Headlights - PASS" (indicates lights functional)
10. Driver continues through each section, marking Pass/Fail
11. For "Tires and Wheels" - Driver marks a questionable item: "Tire #2 (RR) - possible low pressure"
12. System requires photo for flagged items - Driver taps camera icon
13. Driver takes photo of right rear tire, photo compresses and stores locally
14. Driver adds voice note: "Right rear tire looks a bit low - recommend pressure check"
15. System converts voice to text using device TTS
16. Driver continues and marks "Brake Pedal Feel - FAIL" (pedal feels spongy)
17. System alerts: "⚠ Critical Safety Issue - Cannot mark inspection complete with failed items"
18. Driver adds note: "Brakes need mechanic inspection before route"
19. Driver reaches Cargo Area section - marks "PASS" for secure tie-downs
20. Driver swipes to inspection summary page
21. System shows:
    - ✓ Passed: 12 items
    - ✗ Failed: 1 item (Brake pedal feel)
    - ⚠ Photos attached: 1
    - Status: INCOMPLETE - Critical items failed
22. Driver taps "Sign Inspection" (legally required even with failures)
23. System displays signature capture canvas
24. Driver signs electronically with finger on screen
25. System captures:
    - Signature image
    - Timestamp: 6:52 AM
    - GPS location: 40.7128° N, 74.0060° W (depot)
    - Driver authentication (fingerprint)
26. System encrypts signature and stores locally
27. Driver taps "Submit Inspection"
28. System uploads inspection to backend with priority queue (critical failures first)
29. System displays: "✓ Inspection submitted - Critical issue flagged"
30. Dispatcher receives notification: "Vehicle #342 - Pre-trip inspection failed brakes - DO NOT DISPATCH"
31. Dispatcher contacts Marcus: "Stay put - need mechanic to inspect brakes before you can leave"
32. Marcus waits for maintenance team to inspect brakes
33. Mechanic inspects and clears vehicle for duty at 7:15 AM
34. Dispatcher approves Marcus to begin route

#### Alternative Flows:

**A1: All Items Pass - Green Light for Route Start**
- 22a. If all inspection items marked PASS:
  - System displays green checkmark: "✓ Vehicle inspection PASSED"
  - System shows: "You are cleared to begin your route"
  - Driver cannot start route/clock-in until inspection is approved
  - Dispatcher auto-approves passing inspection within 2 minutes
  - Driver receives notification: "Inspection approved - start your route"
  - Driver can now begin delivery route with navigation active

**A2: Driver Uses Voice-Only for Faster Completion**
- 6a. If driver prefers voice input for speed:
  - Driver taps "Voice Mode" on inspection form
  - System displays checklist but accepts voice responses
  - Driver speaks: "Lights pass, tires pass, brakes pass..."
  - Voice recognition converts responses to Pass/Fail
  - Inspection completes in 3 minutes vs 8 minutes typed
  - System confirms all items before submitting
  - Driver still provides signature at end

**A3: Environmental Conditions Prevent Inspection**
- 1a. If weather or conditions prevent full inspection:
  - Heavy rain makes tire inspection impossible
  - Driver notes in system: "Unable to inspect tires due to heavy rain"
  - System allows conditional pass with note
  - Driver is responsible if tire issue occurs
  - Dispatcher is notified of conditional approval
  - System recommends re-inspection at first opportunity

**A4: Inspection Offline - No Cellular**
- 1a. If driver is in area with no cellular:
  - Driver starts inspection - system cached offline form loads
  - Driver completes entire inspection on local device
  - All data stores in phone's database
  - Photos stored at full resolution (compressed on sync)
  - Voice notes stored as audio files
  - When connectivity restored, inspection auto-uploads
  - Dispatcher approval syncs back to driver phone

#### Exception Flows:

**E1: Vehicle Mismatch - Wrong Vehicle Assigned**
- If driver arrives at vehicle and VIN doesn't match assignment:
  - Driver taps "Report Issue" on inspection screen
  - Driver states: "VIN on vehicle doesn't match assignment"
  - System displays: "Vehicle mismatch - contact dispatcher"
  - System logs incident with photos of VIN
  - Dispatcher reassigns correct vehicle or delays route
  - Driver waits for resolution

**E2: Inspection Takes Too Long - Time Pressure**
- If driver needs to complete inspection quickly:
  - Driver is 10 minutes late for scheduled route start
  - Driver taps "Quick Inspection" (abbreviated form)
  - System shows priority items only (critical safety items)
  - Driver can skip non-critical items with confirmation
  - Inspection completes in 3 minutes
  - System flags quick inspection for follow-up
  - Driver notes time pressure in system

**E3: Signature Capture Fails**
- If fingerprint/signature doesn't register:
  - Driver attempts signature 3 times - system rejects
  - System offers alternatives:
    - Stylus input (if available)
    - PIN entry with verbal confirmation
    - Supervisor override (requires signature via another method later)
  - Driver selects PIN confirmation method
  - System displays PIN entry screen
  - Driver enters 4-digit PIN and verbally confirms
  - PIN-based signature legally binding with confirmation

**E4: Photo Upload Fails**
- If photos cannot upload:
  - System displays: "⚠ Photos stored locally - will upload when connected"
  - Inspection proceeds without photo upload
  - Driver continues through inspection
  - Photos stored in local queue for later sync
  - When connectivity restored, photos auto-upload
  - No inspection delay due to photo issues

#### Postconditions:
- Pre-trip inspection is completed and documented
- Critical safety issues are flagged for dispatcher review
- Driver cannot begin route until inspection approved
- Inspection record is uploaded with photos, signature, timestamp, GPS
- Vehicle safety verification is complete and compliant with DOT requirements

#### Business Rules:
- BR-DR-001: Driver cannot clock-in until pre-trip inspection submitted
- BR-DR-002: Critical failed items prevent route start until resolved
- BR-DR-003: All inspections must be signed electronically with legal timestamp
- BR-DR-004: Inspection forms auto-generate based on vehicle type and maintenance history
- BR-DR-005: Failed inspections must be reviewed by dispatcher within 15 minutes
- BR-DR-006: Photos required for any failed or questionable items
- BR-DR-007: Inspections must be completed before 30 minutes after clock-in or driver flagged for training

#### Related User Stories:
- US-DR-001: Daily Vehicle Inspection - Pre-Trip
- US-DR-002: Post-Trip Inspection and Vehicle Handoff

---

### UC-DR-002: Complete Post-Trip Inspection and Clock Out

**Use Case ID**: UC-DR-002
**Use Case Name**: Complete Post-Trip Inspection and Clock Out
**Actor**: Driver (primary), Dispatcher (secondary), Next Shift Driver (secondary)
**Priority**: High
**Mobile-First**: 95% (full mobile with offline capability)

#### Preconditions:
- Driver is at end of shift/final delivery location
- Pre-trip inspection was completed at start of shift
- Driver is still logged into mobile app
- All scheduled deliveries are completed or marked as skipped

#### Trigger:
- Driver completes final delivery of the day
- Driver manually selects "End Shift" or "Post-Trip Inspection" from mobile app
- System prompts post-trip inspection at scheduled end time
- Next-shift driver approaches vehicle for pickup

#### Main Success Scenario:
1. Driver Marcus completes final delivery at 4:45 PM
2. Marcus navigates back to depot
3. Marcus arrives at depot and taps "END SHIFT" button in mobile app
4. System displays: "Complete post-trip inspection before clocking out"
5. System loads post-trip inspection form for Vehicle #342
6. Form includes pre-trip data for comparison:
   - Pre-trip odometer: 45,234 miles
   - Pre-trip fuel: 7/8 tank
   - Pre-trip condition assessment data
7. Post-trip form prompts:
   - **Current Odometer**: 45,412 miles (Marcus enters)
   - System calculates: 178 miles driven today
   - **Current Fuel Level**: 3/8 tank (Marcus selects)
   - System calculates: 4 tanks consumed (reasonable for distance)
8. Marcus provides condition assessment:
   - "Exterior lights - PASS"
   - "Tires - PASS"
   - "Brakes - IMPROVED - feels normal now, previous issue resolved"
9. Marcus notes new issue found during day: "Dashboard warning light - Check Engine"
10. System flags: "⚠ Maintenance issue reported"
11. Marcus taps camera to photograph warning light on dashboard
12. System stores photo and links to vehicle maintenance record
13. Marcus adds voice note: "Engine light came on around 2 PM, no obvious performance issues"
14. For cargo area - Marcus marks: "Cargo area clean, tie-downs removed"
15. Marcus taps "Compare to Pre-Trip" button
16. System displays side-by-side comparison:
    - **Pre-Trip**: Brakes - Failed
    - **Post-Trip**: Brakes - Passed
    - Change: Issue resolved or masked? (Dispatcher will follow up)
17. Marcus provides damage assessment: "No new damage observed"
18. System confirms: "No damage reported during shift"
19. Marcus reaches signature page
20. System displays inspection summary:
    - ✓ Mileage validated (matches GPS data within 5%)
    - ✓ Fuel consumption reasonable
    - ⚠ Check Engine light reported (maintenance to investigate)
    - ✓ No new damage
21. Marcus signs inspection digitally
22. System captures signature, timestamp: 4:52 PM, GPS location
23. Marcus taps "Submit Post-Trip Inspection and Clock Out"
24. System uploads inspection and clocking out signals
25. System displays: "Post-trip complete - you are clocked out"
26. Dispatcher receives post-trip summary:
    - Vehicle #342 mileage: 178 miles
    - Fuel consumed: 4 tanks
    - Issues: Check Engine light (maintenance follow-up)
    - Pre-trip brake issue resolved (investigate)
    - Status: Cleared for next driver
27. Next-shift driver Jenny arrives at depot
28. Jenny taps Vehicle #342 in app
29. System displays: "Post-trip inspection complete - Vehicle ready"
30. Jenny views previous driver's notes and issues (Check Engine light)
31. Jenny can review photos and comments from Marcus
32. Jenny begins her shift with full vehicle history visible

#### Alternative Flows:

**A1: Vehicle Requires Maintenance - Cannot Hand Off**
- 22a. If post-trip inspection reveals serious issue:
  - Check Engine light is accompanied by: "Transmission downshift problem"
  - Marcus marks: "REQUIRES MAINTENANCE - DO NOT DISPATCH"
  - System prevents posting inspection as "ready for next driver"
  - System alerts dispatcher and maintenance: "Vehicle #342 requires service"
  - Dispatcher assigns replacement vehicle for next shift
  - Maintenance schedules repair
  - Vehicle is taken off active fleet

**A2: Damage Discovered at End of Shift**
- 7a. If Marcus notices new damage during post-trip:
  - Marcus discovers scratch on passenger door (not pre-trip noted)
  - Marcus taps "Report Damage"
  - System displays vehicle diagram editor
  - Marcus clicks on passenger door location
  - System opens damage report form
  - Marcus documents: "Scratch, possibly from customer loading area contact"
  - Marcus takes multiple photos of damage with measurements
  - System uploads damage report with comparison to pre-trip photos
  - Dispatcher reviews and may assess responsibility
  - Damage report linked to vehicle repair work order

**A3: Inspection Discrepancy with Pre-Trip**
- 16a. If post-trip shows unexpected change from pre-trip:
  - Pre-trip: Tires marked as questionable (right rear)
  - Post-trip: Right rear tire looks worse, definitely low
  - Marcus marks: "Tire pressure deteriorated during shift"
  - System alerts dispatcher: "Possible tire leak detected"
  - Dispatcher may dispatch mobile tire service while vehicle in yard
  - Issue resolved before next shift
  - Tire service logged to vehicle maintenance history

**A4: Extended Shift - Overtime Post-Trip**
- 1a. If driver works extended hours:
  - Marcus was scheduled 8 hours but worked 10 hours (emergency route)
  - Post-trip form includes HOS note: "10 hours duty time - HOS limit approaching"
  - Dispatcher receives alert: "Driver has limited HOS remaining"
  - Dispatcher plans next shift to allow HOS reset
  - Post-trip inspection still completed normally

#### Exception Flows:

**E1: Odometer Reading Mismatch**
- If odometer doesn't match GPS mileage data:
  - Post-trip odometer: 45,412 miles
  - GPS calculated: 45,389 miles (23 mile discrepancy)
  - System displays warning: "Odometer and GPS mileage don't match"
  - Variance >10% triggers alert
  - Marcus must confirm reading: "Odometer is definitely at 412"
  - System logs discrepancy for fleet manager review
  - Possible odometer error or GPS error investigated

**E2: Fuel Level Cannot Be Assessed**
- If fuel gauge is broken or reading incorrectly:
  - Marcus taps fuel level: "Gauge not working - cannot determine"
  - System allows "Unknown" designation
  - Dispatcher plans refueling before next use
  - Note added: "Fuel gauge needs service"
  - Maintenance schedules gauge replacement

**E3: Post-Trip Time Pressure - Rapid Turnaround**
- If next shift driver arriving soon:
  - Next driver Jenny arrives in 10 minutes
  - Marcus completes post-trip in 5 minutes (quick version)
  - System allows abbreviated inspection with dispatcher override
  - Next driver can begin shift immediately
  - Marcus completes detailed inspection later if issues found

**E4: Network Unavailable for Upload**
- If cellular connection lost at depot:
  - Marcus completes post-trip but cannot upload
  - System displays: "Post-trip saved locally - will upload when connected"
  - Marcus is allowed to clock out
  - Inspection queued for sync when connection restored
  - Next driver can see pre-trip data but post-trip pending

#### Postconditions:
- Post-trip inspection is completed and documented
- Vehicle is marked as available or requiring maintenance
- Next-shift driver receives complete vehicle history
- Mileage and fuel consumption are recorded for vehicle analytics
- Any maintenance issues are flagged for service team
- Driver is successfully clocked out
- Inspection record includes all required documentation

#### Business Rules:
- BR-DR-008: Driver cannot clock out until post-trip inspection submitted
- BR-DR-009: Odometer reading must be within ±10% of GPS calculated mileage
- BR-DR-010: Post-trip signature legally binding like pre-trip
- BR-DR-011: Serious issues prevent vehicle handoff to next driver
- BR-DR-012: Post-trip comparison automatically flags pre-trip issue changes
- BR-DR-013: Vehicle cannot be in-service if post-trip inspection not completed
- BR-DR-014: New damage reports must include photos and GPS location

#### Related User Stories:
- US-DR-002: Post-Trip Inspection and Vehicle Handoff
- US-DR-001: Daily Vehicle Inspection - Pre-Trip

---

## Epic 2: Hours of Service (HOS) Logging

### UC-DR-003: Log Duty Status and Track HOS Compliance

**Use Case ID**: UC-DR-003
**Use Case Name**: Log Duty Status and Track HOS Compliance
**Actor**: Driver (primary), Dispatcher (secondary), Safety Officer (secondary)
**Priority**: High
**Mobile-First**: 98% (FMCSA regulation requires mobile-first for field drivers)

#### Preconditions:
- Driver is logged into mobile app
- Telematics system is operational and tracking vehicle movement
- HOS calculation engine is functional
- FMCSA rules database is current

#### Trigger:
- Driver begins work and needs to log first duty status
- Vehicle movement detected (auto-switch to Driving status)
- Driver manually changes duty status
- Driver receives HOS limit warning

#### Main Success Scenario:
1. Driver Jennifer clocks in at 6:00 AM
2. System displays HOS dashboard:
   - **Current Status**: Off-Duty (default at clock-in)
   - **Drive Time Today**: 0 hours, 0 minutes
   - **On-Duty Time Today**: 0 hours, 0 minutes
   - **Driving Allowed**: Yes (11 hours available)
   - **7-Day Rolling Total Drive**: 34 hours (out of 60-hour limit)
   - **14-Day Rolling Total**: 58 hours (out of 70-hour limit for 8-day cycle)
3. Jennifer reviews status:
   - ✓ Safe to drive today (11 hours available)
   - ✓ On pace with weekly limits
4. Jennifer begins pre-trip inspection (marked as On-Duty)
5. System auto-logs: "On-Duty (Not Driving)" at 6:02 AM
6. Jennifer completes inspection and pre-trip checks
7. Jennifer starts vehicle engine at 6:22 AM
8. System detects engine running but vehicle not moving: "On-Duty (Not Driving)"
9. Jennifer receives route assignment via dispatch
10. Jennifer begins driving at 6:35 AM toward first delivery
11. System detects vehicle speed >5 mph for 1 minute
12. System auto-switches duty status: "Driving"
13. System logs: "Auto-switched to Driving status - 6:35 AM"
14. Jennifer drives for 2 hours to first delivery location
15. System tracks cumulative: 2 hours drive time logged
16. Jennifer arrives at first delivery location at 8:35 AM
17. System detects vehicle stopped, engine running
18. System auto-switches: "On-Duty (Not Driving)"
19. Jennifer unloads cargo and completes delivery (25 minutes)
20. Jennifer continues to second delivery
21. System continues tracking drive and on-duty time
22. Jennifer drives 3.5 hours to second location
23. At 1:45 PM Jennifer has accumulated: 5.5 hours drive time
24. Jennifer stops for 30-minute meal break
25. System switches to: "Off-Duty" (driver-initiated break)
26. Jennifer logs break reason: "Meal break"
27. At 2:15 PM Jennifer resumes driving
28. System switches back: "Driving"
29. Jennifer continues with 2 more deliveries throughout afternoon
30. By 4:30 PM Jennifer has accumulated: 8.5 hours drive time (within 11-hour limit)
31. Jennifer is notified: "⏰ Drive time remaining: 2.5 hours"
32. Jennifer completes final delivery at 5:15 PM
33. Jennifer drives 30 minutes back to depot (total 9 hours drive time)
34. Jennifer arrives depot at 5:45 PM
35. Jennifer completes post-trip inspection
36. At 6:00 PM Jennifer clocks out
37. System logs final status: "Off-Duty" at 6:00 PM
38. HOS Summary for day:
    - Drive Time: 9 hours, 0 minutes (within 11-hour limit)
    - On-Duty Time: 11 hours, 58 minutes (within 14-hour limit)
    - Off-Duty Time: 12 hours, 2 minutes (meets 10-hour requirement between shifts)

#### Alternative Flows:

**A1: Automatic HOS Violation Prevention**
- 30a. If Jennifer approaches drive time limit:
  - At 10 hours 45 minutes, system alert: "⚠ 15 minutes drive time remaining"
  - At 11 hours, system display: "🛑 STOP - HOS LIMIT REACHED"
  - System prevents further route assignments
  - Navigation locked until off-duty status initiated
  - Dispatcher cannot force additional driving
  - Jennifer must take 10-hour rest before resuming

**A2: Manual Status Change with Annotation**
- 25a. If Jennifer needs to log non-standard status:
  - Jennifer taps "Change Status" button
  - System displays options: Driving, On-Duty, Off-Duty, Sleeper Berth
  - Jennifer selects: "Sleeper Berth" (long-haul only)
  - System prompts: "Are you sleeping? (Confirm status)"
  - Jennifer confirms
  - System logs: "Sleeper Berth - 2:30 PM (manual log)"
  - Annotation required: "Overnight rest at truck stop"
  - System timestamps and uploads change

**A3: Yard Moves and Non-Duty Driving**
- 2a. If Jennifer needs to move vehicle for yard maintenance:
  - Jennifer starts engine to move vehicle 50 feet within depot
  - System detects <5 mph movement (yard operation)
  - System auto-classifies as: "On-Duty (Not Driving)" not "Driving"
  - No drive time charged
  - Movement log shows: "Yard movement 0.1 miles"
  - No HOS impact

**A4: HOS Limit Approaching - Break Recommendation**
- 28a. If Jennifer approaching on-duty time limit:
  - At 12 hours on-duty time, system suggests: "You've been on-duty 12 hours (14-hour limit in 2 hours)"
  - System recommends: "Take break now for 30 min or you'll hit limit at 2:30 PM"
  - Jennifer can plan rest accordingly
  - System adjusts route recommendations to avoid HOS violations

#### Exception Flows:

**E1: HOS Violation Detected (Over-Limit Driving)**
- If Jennifer continued driving past 11-hour limit:
  - System detects: 11 hours 15 minutes of drive time
  - System immediately alerts dispatcher and safety officer
  - Alert includes: "POTENTIAL HOS VIOLATION - Driver has exceeded 11-hour drive limit"
  - System forces "Off-Duty" status regardless of Jennifer's input
  - Navigation locked, dispatch required to proceed
  - Safety officer reviews violation for compliance audit
  - Driver discipline may follow

**E2: Telematics Data Loss - Manual HOS Entry**
- If vehicle telematics fails:
  - System detects: "No GPS data for 30 minutes"
  - Jennifer sees alert: "⚠ Manual HOS entry required - telematics unavailable"
  - Jennifer manually logs: "Drove from Stop A to Stop B (estimated 45 min)"
  - System notes: "Manual entry due to telematics outage"
  - Data flagged for manual verification by dispatcher
  - When telematics restored, data compared to Jennifer's log

**E3: Disputed HOS Status Change**
- If Jennifer claims status changed incorrectly:
  - Jennifer reports: "System marked me Driving when I was idle waiting"
  - System shows: "Auto-switched to Driving at 8:30 AM (vehicle speed >5 mph)"
  - Jennifer disputes: "I wasn't driving - another driver moved truck"
  - System logs dispute in HOS record
  - Dispatcher investigates: "Was someone else in Vehicle #342 at that time?"
  - Dispatcher may manually correct HOS entry with authorization
  - Correction flagged and audited

**E4: 34-Hour Restart Calculation Error**
- If Jennifer's 34-hour restart doesn't reset properly:
  - Jennifer logged 34-hour restart: Fri 2 PM → Sat 8 PM
  - System shows 34 hours but calculation includes driving time
  - Calculation should reset all hours (must be 34 consecutive off-duty hours)
  - System administrator corrects: Restart is valid, full reset applied
  - Jennifer's Sunday hours now at zero, full 60-hour limit available

#### Postconditions:
- Driver's duty status is accurately logged and tracked
- HOS limits are monitored and enforced
- Violations are prevented or documented
- Audit trail of all status changes is maintained
- Dispatcher visibility into driver HOS status
- FMCSA regulatory compliance is maintained

#### Business Rules:
- BR-DR-015: 11-hour driving limit per day (cannot be exceeded)
- BR-DR-016: 14-hour on-duty limit per day (cannot exceed)
- BR-DR-017: 10-hour minimum off-duty rest required between shifts
- BR-DR-018: 60-hour in 7 days or 70-hour in 8 days (rolling total)
- BR-DR-019: 30-minute break required after 8 hours driving
- BR-DR-020: 34-hour restart resets both 7-day and 8-day limits
- BR-DR-021: All HOS changes must be timestamped with GPS location

#### Related User Stories:
- US-DR-004: Electronic Logging Device (ELD) - Duty Status
- US-DR-005: HOS Violation Warnings and Prevention
- US-DR-006: Weekly HOS Summary and Reset

---

### UC-DR-004: Monitor HOS Warnings and Plan Breaks

**Use Case ID**: UC-DR-004
**Use Case Name**: Monitor HOS Warnings and Plan Breaks
**Actor**: Driver (primary), Dispatcher (secondary)
**Priority**: High
**Mobile-First**: 98% (critical safety monitoring while driving)

#### Preconditions:
- Driver is actively driving
- HOS calculation engine is operational
- Push notification service is functional
- Maps and POI database available

#### Trigger:
- Driver is within 60 minutes of HOS drive time limit
- Driver is within 30 minutes of on-duty time limit
- Break is required (after 8 hours driving)
- Dispatcher requests break verification

#### Main Success Scenario:
1. Driver Marcus is on active route with multiple stops
2. Marcus has accumulated 7.5 hours drive time (3.5 hours remaining)
3. System calculates: 60 minutes until HOS drive limit alert
4. At 2:15 PM Marcus receives push notification:
   - "📢 Drive Time Warning: 3.5 hours remaining"
   - Time alert: "Can drive until approximately 5:45 PM"
5. Marcus reviews HOS status on dashboard:
   - **Drive Time Used**: 7.5 / 11 hours
   - **Time Remaining**: 3.5 hours
   - **On-Duty Time Used**: 10 / 14 hours
   - **Next Break Required**: After 0.5 more hours (break taken 7.5 hours ago)
6. System recommends: "Suggested break in 30 minutes at current location"
7. Marcus has 2 more deliveries scheduled (45 min and 1 hour respectively)
8. System calculates: "If you continue, you'll hit HOS limit during final delivery"
9. Marcus taps "View Safe Rest Options"
10. System displays nearby facilities:
    - **Option 1**: "Pilot Flying J - 8 miles (11 min)" - Full services, parking available
    - **Option 2**: "Love's Truck Stop - 15 miles (18 min)" - Full services, fewer crowds
    - **Option 3**: "Rest Area - 3 miles (5 min)" - Free but basic facilities
11. Marcus is at Stop 3 (18 miles from depot)
12. System calculates optimal break: "Take 30-min break at Pilot (8 miles from here)"
13. Marcus taps "Pilot Flying J"
14. System adds waypoint to navigation: "Break stop: Pilot Flying J"
15. Navigation updated with break stop in sequence
16. Marcus drives 8 miles to Pilot (11 minutes)
17. Marcus arrives and taps "Log Break"
18. System displays: "Break Type" options:
    - Meal Break (off-duty, doesn't count toward 14-hour limit)
    - Sleeper Berth (long-haul only)
    - On-Duty Break (counts toward on-duty but pauses drive time)
19. Marcus selects "Meal Break"
20. System starts break timer: "Break started at 2:47 PM"
21. Marcus is prompted to order food (integration with food delivery app)
22. Marcus checks app features available during break:
    - ✓ Check messages from dispatch
    - ✓ View next delivery details
    - ✓ Review performance dashboard
    - ✗ Cannot initiate new route while on break
23. After 30 minutes, Marcus finishes eating at 3:17 PM
24. Marcus taps "Resume Driving"
25. System updates HOS:
    - **Break Logged**: 30 minutes (off-duty)
    - **New Remaining Drive Time**: 3.5 hours (break reset 8-hour driving clock)
    - **Back to Driving Status**: 3:17 PM
26. Navigation resumes: "2 deliveries remaining"
27. Marcus completes final deliveries without HOS issues
28. Marcus arrives at depot at 5:40 PM (5 minutes before theoretical HOS limit)

#### Alternative Flows:

**A1: Driver Ignores Warning - System Forces Break**
- 8a. If Marcus ignores HOS warning and continues:
  - Marcus dismisses warning notification
  - System continues sending escalating alerts:
    - 60 min before: "⚠ Drive time warning"
    - 30 min before: "⚠⚠ Drive time ending soon"
    - 15 min before: "🔴 URGENT: Limited drive time remaining"
    - 5 min before: "🛑 STOP: Must cease driving within minutes"
  - At exactly 11-hour limit:
    - System auto-switches to "Off-Duty"
    - Navigation locks
    - Cannot accept new routes
    - Dispatcher receives alert: "Marcus has reached HOS limit"
    - Marcus cannot proceed without dispatcher override (not recommended)

**A2: Customer Delays Cause Break Time Pressure**
- 2a. If customer delay eats into break time:
  - Marcus scheduled: "Delivery 3 hours, break 30 min, delivery 1 hour"
  - Customer delayed: Delivery took 4.5 hours (90 min over)
  - Marcus now has: 2 hours drive time left, 1 hour delivery needed
  - Marcus doesn't have time for 30-min break
  - System alerts: "⚠ Break time conflict - insufficient HOS for all activities"
  - Options presented:
    - Skip final delivery (reassign to another driver)
    - Shorten break to 15 minutes (at rest stop with facilities)
    - Take break but miss delivery window
  - Marcus chooses to shorten break to 15 min
  - Dispatcher notified and approves shortened break
  - Marcus proceeds with adjusted schedule

**A3: Recommend Break at Current Stop (No Travel)**
- 6a. If recommended break location is far away:
  - Marcus is at Stop 4 location already
  - System calculates: "Recommended break is 20 miles away (25 min travel)"
  - Alternative: "Take break at current location - parking available nearby"
  - Marcus selects: "Break here" (saves 20 miles of drive time)
  - System adjusts: Uses local parking or customer's site if permitted
  - Marcus breaks at location for 30 minutes
  - Resumes with remaining drive time preserved

**A4: Safety Officer Initiates Break Requirement**
- 1a. If dispatcher notices driver fatigued behavior:
  - Dispatcher notices Marcus has hard braking events increasing
  - Dispatcher suspects fatigue
  - Dispatcher sends message: "Marcus, take immediate break for safety"
  - System escalates: "Dispatcher requests break - safety concern"
  - Marcus receives urgent message with break requirement
  - System shows break as dispatched directive (quasi-mandatory)
  - Marcus takes break within 5 minutes or dispatcher escalates to safety officer

#### Exception Flows:

**E1: No Break Facilities Available**
- If break location not accessible:
  - Marcus is in rural area with no truck stops
  - Next facility is 35 miles away (40 min drive)
  - System calculates: Cannot reach facility with remaining HOS
  - System recommends: "Rest at safe location (rest area) 3 miles ahead"
  - Marcus drives to rest area (5 min)
  - Marcus takes rest/nap (45 min) to improve safety
  - Rest area break documented as safety override
  - Dispatcher notified of break circumstances

**E2: Break Facilities Full (No Parking)**
- If recommended break spot is at capacity:
  - Marcus arrives at Pilot Flying J
  - Parking lot full, no spaces available
  - Marcus taps "No parking available"
  - System displays: "Next facility: Love's Truck Stop 12 miles (15 min)"
  - Marcus drives to alternate facility
  - System logs: "Took break at alternate location due to parking unavailable"

**E3: Vehicle Malfunction During Break**
- If vehicle has issues while parked:
  - Marcus is on 30-min meal break at Pilot
  - Service technician discovers brake fluid leak
  - Marcus receives notification: "Vehicle issue detected"
  - System prompts: "Estimated repair time: 2 hours"
  - HOS question: Does break time count toward rest or delay?
  - System logs: "Break paused - repair in progress"
  - Marcus's HOS is adjusted (break time protected, repair time separate)
  - Dispatcher coordinated tow/repair as needed

**E4: HOS Calendar Boundary (Midnight Crossing)**
- If break crosses into new 24-hour cycle:
  - Marcus's break starts 11:45 PM (30 minutes)
  - Break ends 12:15 AM next day
  - System handles calendar transition:
    - Previous day: 7.5 hours drive (with 30-min break)
    - New day: Drive time counter resets at midnight
    - Marcus starts next day at 0 hours drive time
  - Correct HOS accounting across calendar boundary

#### Postconditions:
- Driver has adequate break and is safe to continue
- HOS limits are maintained and monitored
- Break facilities are documented
- Dispatch is informed of break timing
- Safety is prioritized over schedule
- Break time is properly logged for compliance

#### Business Rules:
- BR-DR-022: 30-minute break required after 8 hours continuous driving
- BR-DR-023: Break can be meal break (off-duty) or on-duty break
- BR-DR-024: Driver must take break within 8-hour window from last break
- BR-DR-025: HOS warnings escalate in intensity as limit approaches
- BR-DR-026: System-forced off-duty at HOS limit override not permitted
- BR-DR-027: Break facilities tracked for auditing purposes
- BR-DR-028: Safety concerns can trigger mandatory break override

#### Related User Stories:
- US-DR-005: HOS Violation Warnings and Prevention
- US-DR-006: Weekly HOS Summary and Reset

---

## Epic 3: Fuel Management

### UC-DR-005: Record Fuel Transactions and Optimize Efficiency

**Use Case ID**: UC-DR-005
**Use Case Name**: Record Fuel Transactions and Optimize Efficiency
**Actor**: Driver (primary), Fleet Manager (secondary)
**Priority**: Medium
**Mobile-First**: 90% (primary mobile with light desktop integration)

#### Preconditions:
- Driver is at fuel station with vehicle
- Mobile app is open
- Camera available for receipt scanning (optional)
- Telematics odometer reading is accessible
- Fuel price API is operational

#### Trigger:
- Driver refuels vehicle at fuel station
- Driver manually initiates fuel entry in mobile app
- System reminds driver at low fuel condition (based on telematics)
- Fuel card integration auto-imports transaction

#### Main Success Scenario:
1. Driver Sarah pulls into Pilot Flying J truck stop at 11:30 AM
2. Sarah refuels Vehicle #412 (Diesel, semi-truck)
3. Sarah pumps fuel: "45 gallons" (full tank refill)
4. Sarah opens mobile app and taps "Log Fuel"
5. System displays fuel entry form:
   - **Vehicle**: #412 (auto-filled)
   - **Fuel Type**: Diesel (auto-filled from vehicle profile)
   - **Date**: 11/10/2025 (auto-filled)
   - **Time**: 11:30 AM (auto-filled)
6. Sarah enters:
   - **Gallons**: 45
   - **Price per Gallon**: $3.45 (system displays current OPIS average for reference: $3.42)
7. Sarah taps "Total": System calculates: 45 × $3.45 = $155.25
8. Sarah enters: **Total Cost**: $155.25
9. System provides option: "Scan receipt for verification"
10. Sarah opens camera and scans fuel receipt
11. System uses OCR (Optical Character Recognition):
    - Extracts: Gallons: 45.23, Price: $3.45, Total: $156.04
    - Discrepancy alert: "Manual entry 45 gal vs receipt 45.23 gal"
    - Sarah confirms: "Rounded 45.23 to 45 for simplicity"
12. System accepts variance and updates: 45.23 gallons, $156.04 total
13. System displays: "Current Odometer: 87,234 miles" (from telematics)
14. Sarah confirms: "Odometer reads 87,234 miles - correct"
15. System calculates MPG:
    - Last fuel-up: Odometer 87,089 miles, 42 gallons
    - Current fill-up: 87,234 miles, 45.23 gallons
    - MPG = (87,234 - 87,089) / 45.23 = 145 / 45.23 = 3.21 MPG
    - System displays: "Fuel efficiency: 3.21 MPG"
16. System compares to fleet average: "Fleet average: 6.2 MPG"
    - Alert: "⚠ This vehicle is below average - possible maintenance needed"
17. Sarah adds note: "Vehicle #412 is old, lower MPG expected"
18. System location auto-captured: "Pilot Flying J - Exit 45, I-95 North"
19. System displays "Preferred Fuel Vendors" check:
    - Current stop (Pilot Flying J): ✓ Preferred vendor
    - Price ($3.45): Within budget
20. Sarah taps "Submit Fuel Entry"
21. System uploads fuel transaction:
    - Timestamp: 11:30 AM
    - GPS location: Lat/Long coordinates
    - Receipt photo stored
    - MPG calculated and trended
22. Fuel transaction appears in Sarah's driver app dashboard
23. Fleet manager views transaction in fleet analytics:
    - Vehicle #412 fuel cost: $156.04
    - MPG: 3.21 (flagged as below average)
    - Maintenance recommendation: "Check engine diagnostics"
24. Sarah receives confirmation: "✓ Fuel transaction recorded"

#### Alternative Flows:

**A1: Fuel Card Auto-Import (No Manual Entry)**
- 3a. If fleet uses fuel card provider integration:
  - Sarah swipes fuel card at pump (WEX, Comdata, etc.)
  - Fuel card system transmits: Gallons, cost, location, time
  - System auto-imports transaction within 1 hour
  - Sarah receives notification: "Fuel transaction auto-recorded - 45.2 gal, $156.04"
  - No manual entry required (automation)
  - Sarah can review and add notes if needed
  - Reduced driver data entry by ~80%

**A2: Non-Preferred Vendor Alert**
- 6a. If driver stops at non-preferred fuel vendor:
  - Sarah arrives at independent fuel station (not on preferred list)
  - System logs: "Non-preferred vendor selected"
  - System displays alert: "Preferred vendor 3 miles away, price is $0.12 higher here"
  - Sarah chooses to stay (convenient location)
  - System logs override reason: "Location convenience"
  - Fleet manager can analyze fuel vendor strategy
  - Cost difference tracked: $0.12 × 45 gal = $5.40 extra cost

**A3: Partial Fill-Up (Not Full Tank)**
- 2a. If driver fuels less than full tank:
  - Sarah only needs 25 gallons (not full 45-gallon tank)
  - Sarah enters: "Gallons: 25"
  - System flags: "Partial fill - not at full tank"
  - MPG calculation adjusted for partial tank
  - Efficiency calculation still valid
  - System notes: "Partial fill (56% capacity)"
  - No issue - transaction proceeds normally

**A4: DEF (Diesel Exhaust Fluid) Separate Purchase**
- 1a. If driver also purchases DEF:
  - Sarah refuels diesel: 45 gallons, $155.25
  - Sarah also purchases DEF: 2.5 gallons, $18.50
  - Sarah logs two transactions:
    - Fuel: 45 gallons diesel
    - DEF: 2.5 gallons
  - System tracks separately:
    - Diesel consumption for MPG
    - DEF consumption for maintenance planning
  - Both transactions recorded and categorized correctly

#### Exception Flows:

**E1: Receipt Scanner Cannot Read (Poor Quality)**
- If receipt photo is unreadable:
  - Sarah takes receipt photo but it's blurry/poorly lit
  - System tries OCR: "Cannot read - image quality too poor"
  - System prompts: "Please retake photo or enter manually"
  - Sarah manually enters: 45 gallons, $155.25
  - Receipt photo still stored for audit trail
  - Transaction proceeds with manual entry noted

**E2: Fuel Price Variance Detected (Price Gouging Alert)**
- If price is unusually high:
  - System compares: Pump price $3.45/gal vs OPIS average $3.15/gal
  - Variance: +$0.30/gal (9.5% higher than average)
  - System displays alert: "⚠ Fuel price 9.5% above market average"
  - Sarah confirms: "This location has premium pricing - no alternative available"
  - System logs: "Justified price variance"
  - Alert useful for fuel vendor negotiations

**E3: Odometer Reading Questionable**
- If odometer doesn't match last fuel-up:
  - Last fuel-up: 87,089 miles
  - Current reading: 87,234 miles
  - Distance: 145 miles on 45.23 gallons = 3.2 MPG
  - System calculates normal MPG for this truck: 6.5 MPG
  - Variance: 50% worse than normal
  - System suspects: "Error in odometer reading or fuel leak"
  - Sarah reviews: "Both readings are correct, vehicle has been slow today"
  - System logs: "MPG anomaly flagged for maintenance review"
  - Maintenance to investigate vehicle performance

**E4: Fuel Transaction Duplicate (Same Transaction Entered Twice)**
- If same fuel entry recorded twice:
  - System detects identical entries within 10 minutes
  - Alert: "Possible duplicate entry detected"
  - Sarah admits: "Accidentally submitted twice - sorry"
  - System removes duplicate entry
  - Final record: Single transaction logged
  - Manual reconciliation prevented fuel data errors

#### Postconditions:
- Fuel transaction is recorded with all details
- MPG is calculated and compared to fleet average
- Fuel price is logged for cost analysis
- Maintenance issues detected
- Fuel efficiency trends are tracked
- Fuel consumption data feeds fleet analytics

#### Business Rules:
- BR-DR-029: All fuel transactions must include: date, time, location, gallons, cost
- BR-DR-030: MPG calculated from odometer readings (±10% variance acceptable)
- BR-DR-031: Fuel prices tracked against market averages (OPIS, GasBuddy)
- BR-DR-032: Non-preferred vendor usage logged for analysis
- BR-DR-033: Receipt photos retained for 2 years for audit
- BR-DR-034: Vehicles with MPG >20% below average flagged for maintenance
- BR-DR-035: Fuel card transactions auto-imported if available (within 24 hours)

#### Related User Stories:
- US-DR-011: Fuel Transaction Recording
- US-DR-012: Fuel Card and DEF Management

---

## Epic 4: Incident and Damage Reporting

### UC-DR-006: Report Safety Incident or Accident

**Use Case ID**: UC-DR-006
**Use Case Name**: Report Safety Incident or Accident
**Actor**: Driver (primary), Dispatcher (secondary), Safety Officer (secondary)
**Priority**: High
**Mobile-First**: 99% (emergency reporting must be mobile-accessible)

#### Preconditions:
- Driver is involved in accident, near-miss, or safety incident
- Driver's mobile app is operational
- GPS location services are active
- Camera and audio recording available

#### Trigger:
- Driver is in accident or safety-related incident
- Driver activates emergency button in vehicle
- Driver manually reports incident via mobile app
- Third-party reports incident involving fleet vehicle

#### Main Success Scenario:
1. Driver Tom is driving on Route 95 North at 2:47 PM
2. Tom notices: "Car cuts in front of me suddenly"
3. Tom reacts with emergency braking
4. Tom's vehicle: 45 mph → 15 mph (hard braking event detected by telematics)
5. No collision occurs - near-miss situation
6. Tom's heart racing - needs to document near-miss
7. Tom taps mobile app "Emergency" button (red button, bottom right)
8. System displays: "📍 INCIDENT REPORTING"
9. Tom selects incident type from options:
   - Accident / Collision
   - Near-Miss (close call)
   - Property Damage
   - Injury / Safety Concern
   - Hazmat Issue
   - Other
10. Tom selects: "Near-Miss"
11. System displays near-miss form:
    - **Vehicle**: #412 (auto-filled)
    - **Location**: Route 95 North, Mile Marker 47 (GPS auto-filled)
    - **Coordinates**: 42.1547° N, 72.4892° W (auto-filled)
    - **Date/Time**: 11/10/2025, 2:47 PM (auto-filled)
    - **Description**: (text input)
12. Tom dictates incident description: "White sedan cut in front of me without signaling. I had to brake hard to avoid collision."
13. System converts voice to text: "White sedan cut in front of me without signaling. I had to brake hard to avoid collision."
14. Tom reviews text and confirms
15. System shows: "⚠ Hard braking detected at this time - included in report"
16. Tom indicates: "No injury" (checkbox)
17. Tom adds additional info:
    - "No damage to my vehicle or other vehicle"
    - "Other vehicle fled scene"
    - "License plate not visible"
18. System prompts: "Take photo/video of scene?"
19. Tom taps camera to record video
20. Tom records 30-second video showing current location and road conditions
21. Video stored and queued for upload
22. System displays incident summary:
    - **Type**: Near-Miss
    - **Location**: Route 95 North, MM 47
    - **Description**: [detailed text]
    - **Video**: Yes, 30 seconds
    - **Injury**: No
    - **Damage**: No
    - **Status**: Ready to submit
23. Tom reviews and confirms: "This looks correct"
24. Tom taps "Submit Incident Report"
25. System uploads report with priority flag:
    - To Dispatcher (immediate notification)
    - To Safety Officer (routine review)
    - Video queued for upload when bandwidth available
26. Dispatcher receives alert: "📢 Near-Miss reported - Route 95 MM 47 - Vehicle #412"
27. Dispatcher reviews incident details
28. Dispatcher messages Tom: "Thanks for reporting - video received. Drive safe."
29. Tom receives confirmation: "✓ Incident report submitted successfully"
30. System creates incident record: INC-2025-1847
31. Safety officer receives notification for follow-up review

#### Alternative Flows:

**A1: Actual Accident with Damage - Full Protocol**
- 9a. If Tom was in actual collision:
  - Tom selects: "Accident / Collision"
  - System displays comprehensive accident form
  - Tom indicates: "Vehicle damage - rear bumper"
  - Tom indicates: "Other vehicle involved - driver present"
  - System prompts: "Other driver information"
  - Tom uses camera to photograph: Other driver's license, insurance card
  - Tom photographs: Vehicle damage (multiple angles)
  - Tom photographs: Scene overview (location context)
  - System stores all photos
  - Tom provides: "Other driver name, phone, insurance company"
  - System displays: "Police report required for accidents"
  - Tom indicates: "Police already contacted, report number: [#]"
  - System prompts: "Any injuries?"
  - Tom indicates: "I have neck pain, other driver appears fine"
  - System displays: "Recommend immediate medical evaluation"
  - Tom can call 911 for ambulance from incident form (one-tap)
  - System auto-sends detailed incident to dispatcher and safety officer
  - Safety initiates injury investigation protocol

**A2: Hazmat Incident - Spill or Exposure**
- 9a. If incident involves hazardous materials:
  - Tom selects: "Hazmat Issue"
  - System flags: "HAZMAT INCIDENT - CRITICAL"
  - System detects: Vehicle #412 is carrying hazmat cargo (plasticizer shipment)
  - System displays: Material Safety Data Sheet (MSDS) for cargo
  - Tom reports: "Notice fuel smell - possible leak under vehicle"
  - System prompts: "Is there visible spill or leak?"
  - Tom confirms: "Possible fluid leak but not visible spill"
  - System initiates emergency protocol:
    - Auto-contacts dispatcher with hazmat alert
    - Auto-contacts local environmental agency notification
    - Provides emergency contact info for hazmat response
  - Tom is instructed: "Move upwind, do not touch leak, await hazmat team"
  - Dispatcher coordinates hazmat response team
  - Environmental contractor dispatched to scene
  - Cleanup and reporting follows regulatory requirements

**A3: Injury - Medical Emergency**
- 9a. If incident results in injury:
  - Tom selects: "Injury / Safety Concern"
  - Tom indicates: "Driver injury - moderate"
  - System displays: "CALL 911 IMMEDIATELY"
  - One-tap button connects to 911 with GPS coordinates
  - Tom speaks to 911: "Commercial vehicle accident, I-95 North MM 47, driver injured"
  - 911 dispatcher receives exact GPS coordinates
  - Tom is prompted: "Describe injuries briefly"
  - Tom says: "Head pain, numbness in left arm - possible whiplash"
  - System uploads: Photos, video, incident details, medical info to hospital records
  - Ambulance dispatched
  - Tom waits for paramedics, app provides first aid guidance
  - Safety officer notified immediately - OSHA reportability determined

**A4: Witness Provides Information**
- 11a. If witness wants to provide statement:
  - Witness to incident (third party) present at scene
  - Dispatcher requests witness information
  - Tom provides witness's phone number
  - Dispatcher calls witness to collect information
  - Witness statement typed into system by dispatcher
  - Witness contacted for formal statement within 48 hours
  - All statements linked to incident record

#### Exception Flows:

**E1: GPS Location Unavailable**
- If GPS cannot determine exact location:
  - Tom reports incident but GPS location fails
  - System displays: "Cannot determine location - please provide"
  - Tom enters: "I-95 North, between Exits 6 and 7"
  - System uses landmark triangulation (cell tower data)
  - Tom's estimated location noted in report
  - Dispatcher can locate vehicle via last known GPS ping
  - When connectivity restored, exact location obtained

**E2: Driver Cannot Safely Report (Immediate Danger)**
- If driver is in unsafe situation:
  - Tom is in disabled vehicle on highway in traffic
  - Tom cannot safely exit vehicle or use phone
  - Tom activates emergency button
  - System sends critical alert to dispatcher: "CRITICAL - Vehicle disabled on highway"
  - GPS location pinned for immediate response
  - Dispatcher contacts Tom via phone
  - Dispatcher calls 911 with exact location
  - Police dispatched for traffic control and safety
  - Tom remains in vehicle until responders arrive
  - Full incident report completed after safety ensured

**E3: Video Upload Fails (Large File)**
- If video is too large to upload immediately:
  - Tom records 2-minute video (~400 MB)
  - System detects: File too large for current network
  - System stores video locally for later sync
  - Incident report uploaded without video first
  - System displays: "Video will upload when better connectivity available"
  - Video tagged for priority upload when on WiFi
  - Dispatcher can review incident details while awaiting video

**E4: Incident Report Contains Sensitive Information**
- If report includes driver fault admission:
  - Tom's description implies: "I was distracted when accident occurred"
  - System flags: "⚠ Report may contain liability admission"
  - System displays: "Consider consulting legal before submitting"
  - Tom can edit report before final submission
  - Once submitted, report is legal record (immutable)
  - Safety officer and legal team review sensitive content

#### Postconditions:
- Incident is documented with complete details, photos, video
- Dispatcher is immediately notified for response coordination
- Safety officer receives report for investigation
- Emergency services are contacted if needed
- Incident record created for insurance and compliance
- Follow-up investigation can be initiated
- Driver is supported with safety resources

#### Business Rules:
- BR-DR-036: All incidents must be reported within 2 hours of occurrence
- BR-DR-037: Injuries require immediate 911 contact and safety officer notification
- BR-DR-038: Hazmat incidents trigger environmental agency notification protocol
- BR-DR-039: Incident photos/video retained for 7 years per insurance requirements
- BR-DR-040: Police report required for accidents with other vehicles
- BR-DR-041: DOT reportable accidents (over $2,000 damage) require FMCSA notification
- BR-DR-042: All incident reports are confidential - limited access control

#### Related User Stories:
- US-DR-007: Accident and Incident Reporting
- US-DR-008: Vehicle Damage Documentation

---

## Epic 5: Mobile Workflows and Offline Sync

### UC-DR-007: Work Offline and Sync When Connected

**Use Case ID**: UC-DR-007
**Use Case Name**: Work Offline and Sync When Connected
**Actor**: Driver (primary), System (backend sync engine)
**Priority**: High
**Mobile-First**: 99% (core mobile capability)

#### Preconditions:
- Driver is in area with intermittent or no cellular coverage
- Mobile app has offline database (SQLite) enabled
- Sync service is configured
- Queue-based sync engine is operational

#### Trigger:
- Driver starts shift in area with poor/no coverage
- Cellular connection drops during operations
- Driver manually enables offline mode
- App detects connectivity loss

#### Main Success Scenario:
1. Driver Jessica begins shift at 6:00 AM in rural area (poor coverage)
2. Jessica opens mobile app
3. System detects: "Signal strength low - Offline Mode available"
4. Jessica reviews status:
   - Route data: ✓ Downloaded and cached
   - Vehicle data: ✓ Cached locally
   - Pre-trip form: ✓ Available offline
   - HOS database: ✓ Cached
5. Jessica completes pre-trip inspection offline (7 minutes)
6. Inspection stored locally in SQLite database
7. System displays: "⚠ Offline mode - Report queued for sync"
8. Jessica begins driving on assigned route
9. GPS navigation works (offline maps cached)
10. Jessica arrives at first delivery location at 8:15 AM
11. Jessica still in low-signal area
12. Jessica marks delivery complete:
    - Takes customer signature (captured locally)
    - Uploads delivery photo (stored locally)
    - Records proof of delivery (all cached)
13. System stores: "Delivery #1 complete - queued for sync"
14. Jessica continues to second delivery (18 miles, 30 minutes)
15. Still in low-signal area throughout morning
16. Jessica completes second and third deliveries
17. All data stored locally in offline queue:
    - Pre-trip inspection (8 MB with photos)
    - 3 delivery confirmations (12 MB with signatures/photos)
    - HOS status changes (0.5 MB)
    - 2 fuel entries (5 MB with receipts)
    - Total pending sync: ~25 MB
18. At 12:15 PM Jessica enters town with strong cellular signal
19. System detects: "Strong connectivity detected - Beginning sync"
20. System initiates sync priority queue:
    - **Priority 1 (Critical)**: Pre-trip inspection (safety data)
    - **Priority 2 (High)**: Incident reports (if any)
    - **Priority 3 (Medium)**: Fuel transactions (compliance)
    - **Priority 4 (Normal)**: Delivery confirmations (operational)
    - **Priority 5 (Low)**: Performance data
21. System begins uploading in priority order
22. Pre-trip inspection uploads: 8 MB (12 seconds)
23. Fuel transactions upload: 5 MB (8 seconds)
24. Delivery confirmations upload: 12 MB (18 seconds)
25. Total sync time: ~40 seconds
26. System displays progress bar: "Syncing - 3 of 5 items uploaded"
27. As data uploads, system verifies:
    - Checksum validation (data integrity)
    - Server confirmation receipt
    - Timestamp recording
28. Dispatcher receives real-time notification:
    - "Pre-trip inspection received for Vehicle #412"
    - "Delivery 1 confirmed - 8:47 AM"
    - "Delivery 2 confirmed - 10:15 AM"
    - "Delivery 3 confirmed - 12:05 PM"
29. System completes sync: "✓ All data synchronized successfully"
30. Jessica receives confirmation: "All offline data uploaded"
31. Jessica can now:
    - See real-time routes (no longer cached)
    - Access live dispatch updates
    - Receive push notifications
    - View updated performance metrics
32. System deletes local offline queue (data now on server)
33. System displays: "Sync complete - you are back online"
34. Jessica continues with remaining deliveries with full connectivity

#### Alternative Flows:

**A1: Sync Interrupted by Connectivity Loss**
- 20a. If connection drops during sync:
  - Jessica is uploading delivery data
  - After 15 MB uploaded, connection drops
  - System pauses sync: "⚠ Connection interrupted"
  - Remaining 10 MB stays in queue
  - System resumes automatically when connection restored
  - No data loss - sync is atomic (all or nothing per transaction)
  - When reconnected, sync resumes from where it paused
  - Completed uploads not re-sent

**A2: Conflict Resolution (Offline Change vs Server Update)**
- 8a. If driver's data conflicts with server:
  - Jessica worked offline all morning
  - Route #42 was assigned offline at 6 AM
  - At 10 AM (while syncing), dispatcher updates Route #42 (removed one stop)
  - Both offline and server versions exist
  - System detects conflict: "Route change detected"
  - System presents options:
    - Keep local version (older, has deleted stop)
    - Use server version (newer, updated by dispatcher)
    - Merge versions (manual resolution)
  - Jessica reviews: Dispatcher removed a stop due to customer cancellation
  - Jessica selects: "Use server version" (dispatcher change correct)
  - System updates local route with server version
  - Jessica's remaining stops updated, cancelled stop removed

**A3: Offline Mode Storage Limit Exceeded**
- 6a. If offline data exceeds phone storage:
  - Jessica has older inspection records still in local database
  - New sync data would exceed available storage
  - System displays: "⚠ Offline storage nearly full"
  - System suggests: "Clear old inspection records (30 days old)?"
  - Jessica confirms deletion
  - System deletes local copies (server copy retained)
  - Frees 50 MB of storage
  - New sync data can now complete

**A4: Large Photo Compression for Offline**
- 7a. If photos are too large for offline:
  - Jessica takes high-resolution damage photo (12 MB)
  - System compresses: 12 MB → 2 MB (JPEG optimization)
  - Full-resolution stored locally for potential re-upload
  - Compressed version used for immediate offline storage
  - When synced: Full-resolution uploaded if available
  - Ensures storage efficiency without data loss

#### Exception Flows:

**E1: Offline Database Corruption**
- If local SQLite database is corrupted:
  - System detects: "Offline database corrupted - cannot read local data"
  - System attempts recovery: "Recovering from backup..."
  - If backup exists: Previous data restored (up to last sync)
  - If no backup: "⚠ Recent offline data lost"
  - System rebuilds database from server copy (last known good state)
  - Jessica loses any entries made since last sync
  - System prompts: "Please re-enter missing data"

**E2: Network Latency - Slow Sync**
- If sync is very slow (poor bandwidth):
  - Jessica has strong signal but slow data (2G fallback)
  - Sync rate: ~50 KB/s (very slow)
  - 25 MB would take ~8 minutes to sync
  - System displays: "Sync in progress - 5% complete (7 min remaining)"
  - Jessica can continue working while syncing in background
  - Sync continues even if app backgrounded
  - No blocking of driver work due to slow sync

**E3: Server Rejects Sync Data (Validation Error)**
- If server finds invalid data:
  - Pre-trip inspection fails server validation
  - System displays: "⚠ Server rejected pre-trip data - missing required field"
  - System highlights: "Vehicle odometer field is missing"
  - Jessica must correct: Adds odometer reading
  - Re-submits corrected data
  - Server validates and accepts
  - Sync continues with remaining data

**E4: Complete Offline Operation (Extended No Coverage)**
- If driver never regains coverage:
  - Jessica works entire 8-hour shift in offline mode
  - All data accumulated locally (30+ MB)
  - Jessica clocks out at 5 PM
  - App displays: "⚠ Data not synced - outstanding 30 MB"
  - Jessica is instructed: "Connect to WiFi or visit office for sync"
  - Jessica can sync at office later when WiFi available
  - Data remains locally until manually synced
  - Dispatcher doesn't receive data until sync (potential issue for tracking)

#### Postconditions:
- All offline-captured data is synchronized to server
- Server database is updated with all driver transactions
- Offline queue is cleared
- Local database is cleaned up
- Driver regains real-time connectivity
- Dispatcher has complete visibility into operations
- No data loss during sync process

#### Business Rules:
- BR-DR-043: All critical data (inspections, incidents) must sync within 2 hours
- BR-DR-044: Offline data priority: Inspections > Incidents > Fuel > Deliveries
- BR-DR-045: Photos compressed to <2 MB for offline storage
- BR-DR-046: Sync is automatic and transparent to driver
- BR-DR-047: Driver cannot submit data in offline mode (queued only)
- BR-DR-048: Conflicts resolved by server version (authoritative)
- BR-DR-049: Offline database limited to 1 GB maximum storage

#### Related User Stories:
- US-DR-013: In-App Messaging with Dispatch
- US-DR-014: Document Access and Signature

---

### UC-DR-008: Receive Messages and Respond While Driving

**Use Case ID**: UC-DR-008
**Use Case Name**: Receive Messages and Respond While Driving
**Actor**: Driver (primary), Dispatcher (secondary)
**Priority**: High
**Mobile-First**: 99% (safety-critical while driving)

#### Preconditions:
- Driver is actively driving on assigned route
- Messaging service is operational
- Push notification service functional
- Text-to-speech engine available
- Driver is logged into mobile app

#### Trigger:
- Dispatcher sends message to driver
- Driver sends message from mobile app
- System needs to read message aloud (driver in motion)
- Quick message template used for hands-free input

#### Main Success Scenario:
1. Driver James is actively driving on Route #45 at 10:30 AM
2. Dispatcher Rita needs to send update: "Traffic on Main St - take alternate route"
3. Rita selects James in dispatch console
4. Rita types message: "Traffic on Main St - take alternate route via Oak Ave"
5. Rita marks priority: "Standard" (not urgent)
6. Rita clicks "Send"
7. System sends push notification to James's phone
8. James's phone receives notification while driving
9. System checks: "Driver is currently driving (vehicle speed 35 mph)"
10. System does NOT display visual popup (hands-off-road policy)
11. System plays distinctive audio tone: "Message from Dispatch"
12. System reads message aloud via text-to-speech:
    - "Traffic on Main Street. Take alternate route via Oak Avenue."
13. James hears message clearly while keeping eyes on road
14. James wants to reply but is actively driving
15. System displays: "Quick Reply Options" (voice-friendly)
    - "Acknowledged"
    - "Running late"
    - "Safe conditions"
    - "Dicta message" (voice input)
16. James uses voice command: "Say acknowledged"
17. System recognizes: "Acknowledged" and sends reply
18. Dispatcher receives: "James - Acknowledged" (timestamp 10:31 AM)
19. James continues driving
20. System auto-updates navigation:
    - Removes current route
    - Calculates new route: Main St → Oak Ave
    - Provides updated turn-by-turn directions
21. System speaks new directions:
    - "In 0.5 miles, turn right on Oak Avenue"
    - "Continue straight on Oak Avenue for 2.3 miles"
22. James successfully takes alternate route
23. James arrives at delivery on-time despite traffic

#### Alternative Flows:

**A1: Urgent Message Interrupts Route - Pull Over Recommended**
- 5a. If dispatcher sends urgent message:
  - Dispatcher marks: "URGENT - Reassignment required"
  - System receives urgent flag
  - System audio alert: Continuous beeping (driver attention)
  - System messages: "URGENT message from dispatch - please pull over to read"
  - James hears alert and pulls over safely at 10:35 AM
  - Message displayed visually: "Route reassignment - New destination: 456 Oak Ave instead of 123 Main St"
  - James reviews details and confirms
  - Navigation immediately updates to new destination
  - James notes delivery time pressure, calls dispatcher if needed

**A2: Multiple Messages - Message Queue**
- 6a. If James receives several messages in sequence:
  - Message 1: "Traffic update"
  - Message 2: "Customer called - location change"
  - Message 3: "Delivery window extended"
  - System queues messages for driver safety
  - System reads one message at a time
  - James given option: "Next message?" (after responding to first)
  - Messages accumulated in conversation thread
  - James can review all messages after pulling over

**A3: Driver-Initiated Message While Driving**
- 1a. If James wants to send message to dispatch:
  - James needs to tell dispatcher: "Customer not available - what should I do?"
  - James taps "Send Message" button (accessible while driving)
  - System displays: "Dictation Mode - Speak your message"
  - James speaks: "Customer not available at delivery location. Should I wait or return with cargo?"
  - System converts to text: "Customer not available at delivery location. Should I wait or return with cargo?"
  - James confirms text accuracy
  - James taps "Send"
  - Message uploaded to dispatcher with GPS location and timestamp
  - Dispatcher receives: Message + location + time context
  - Dispatcher responds: "Wait 15 minutes - customer is 10 minutes away"
  - James receives response via text-to-speech while waiting

**A4: Pre-Defined Quick Message Templates**
- 14a. If James wants fast response without speech:
  - System displays quick message options (customizable):
    - "Acknowledged"
    - "Running late"
    - "Break time"
    - "Arrived at delivery"
    - "Delivery complete"
    - "Vehicle issue"
    - "Customer problem"
  - James taps: "Delivery complete"
  - System sends: "Delivery complete - 10:45 AM location [GPS]"
  - No voice input needed - quick and safe
  - Dispatcher receives status update immediately

#### Exception Flows:

**E1: Speech Recognition Misunderstands Message**
- If voice-to-text makes error:
  - James speaks: "I'll be 15 minutes late"
  - System converts: "I'll be 50 minutes late" (misheard "fifteen" as "fifty")
  - James confirms text and submits
  - Dispatcher receives incorrect delay information
  - James realizes error after submission
  - James sends correction: "Sorry - 15 minutes, not 50"
  - Dispatcher adjusts understanding
  - System learns from correction for future accuracy

**E2: Network Connection Lost - Message Queued**
- If message cannot send immediately:
  - James sends message but no signal available
  - System displays: "⚠ Message queued - will send when connected"
  - Message stored locally with offline flag
  - Message shows: "Pending" status
  - When connectivity restored, message auto-sends
  - System updates status: "✓ Sent 10:47 AM"
  - Dispatcher receives delayed message with original timestamp

**E3: Driver Accidentally Triggers Audio - Public Location**
- If TTS message plays loudly in sensitive situation:
  - James is picking up cargo at residential area
  - Dispatch message plays audio: "...Traffic on Main Street..."
  - Message plays loudly in quiet neighborhood
  - Homeowners distracted/annoyed
  - James realizes audio was inappropriate setting
  - System has option: "Mute audio in residential areas" (location-based)
  - James enables: Future messages vibrate-only in residential zones

**E4: Text-to-Speech System Failure**
- If TTS engine crashes:
  - System attempts to play message
  - TTS service fails: "Audio generation unavailable"
  - Fallback: System displays text on screen instead
  - James can read message at next traffic light
  - Or James can ask: "Siri/Google - read message"
  - Device's native TTS used as backup
  - Critical communication maintained despite TTS failure

#### Postconditions:
- Driver receives and acknowledges dispatcher message
- Message is logged with timestamp and delivery confirmation
- Route updates are applied if message includes directions
- Driver safety is maintained (no distracted driving)
- Communication is documented for compliance
- Conversation thread maintained for context

#### Business Rules:
- BR-DR-050: Messages to actively driving drivers use text-to-speech only
- BR-DR-051: Urgent messages require pull-over recommendation
- BR-DR-052: Quick message templates available for safe hands-free response
- BR-DR-053: Voice-to-text messages reviewed before sending (>95% accuracy target)
- BR-DR-054: All messages logged with timestamp, GPS location, delivery status
- BR-DR-055: Offline messages queued and auto-send when connectivity restored
- BR-DR-056: Message history available for 30 days in app

#### Related User Stories:
- US-DR-013: In-App Messaging with Dispatch

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 12
- **High Priority**: 8 use cases
- **Medium Priority**: 4 use cases
- **Low Priority**: 0 use cases

### Mobile-First Implementation:
- **Average Mobile Implementation**: 95%
- **Offline Capability**: 100% of use cases (critical for field operations)
- **Voice Features**: 7 use cases
- **Photo/Video Capture**: 6 use cases
- **Signature Capture**: 4 use cases
- **Real-Time Sync**: All use cases

### Epic Distribution:
1. **Pre-Trip and Post-Trip Inspections**: 2 use cases
2. **Hours of Service (HOS) Logging**: 2 use cases
3. **Fuel Management**: 1 use case
4. **Incident and Damage Reporting**: 1 use case
5. **Mobile Workflows and Offline Sync**: 2 use cases
6. **Communication and Messages**: 1 use case (UC-DR-008)

### Key Mobile Technologies Required:
- **Offline Database**: SQLite for local data storage
- **Real-Time Sync**: Queue-based sync engine with conflict resolution
- **Voice Features**: Speech-to-text, text-to-speech (TTS)
- **Camera Integration**: Photo/video capture with compression
- **GPS/Telematics**: Real-time location and vehicle data
- **Push Notifications**: Firebase Cloud Messaging (FCM) / Apple Push Notification (APN)
- **Digital Signature**: Canvas-based signature capture with timestamp/GPS
- **OCR**: Receipt and document scanning (Azure Computer Vision / Google Cloud Vision)

### Compliance and Safety:
- FMCSA ELD compliance (HOS logging per 49 CFR Part 395)
- DOT pre-trip/post-trip inspection requirements
- Electronic signature compliance (ESIGN Act, UETA)
- Privacy compliance (PCI for fuel cards, HIPAA for injury data)
- Data retention per regulatory requirements (3+ years)

---

## Related Documents
- **User Stories**: `user-stories/02_DRIVER_USER_STORIES.md`
- **Test Cases**: `test-cases/02_DRIVER_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/02_DRIVER_WORKFLOWS.md` (to be created)
- **Mobile UI/UX**: `design/02_DRIVER_MOBILE_DESIGN.md` (to be created)
- **API Specifications**: `api/driver-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Requirements Team | Initial driver use cases created |

---

*This document provides detailed use case scenarios supporting the Driver user stories and mobile-first operational workflows.*
