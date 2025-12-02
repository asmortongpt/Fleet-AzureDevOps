# Driver Role - Test Cases

**Role**: Driver
**Version**: 1.0
**Date**: November 10, 2025
**Total Test Cases**: 22

---

## Test Case Structure

**Format**: TC-DR-XXX (Test Case - Driver - Sequential Number)

Each test case includes:
- **TC ID**: Unique identifier
- **Test Name**: Descriptive title
- **Related US/UC**: User Story and Use Case references
- **Priority**: Critical/High/Medium/Low
- **Test Type**: Functional/Mobile/Offline/Security/Integration
- **Preconditions**: Required setup and state
- **Test Steps**: Numbered procedure
- **Expected Results**: Desired outcomes
- **Acceptance Criteria**: Pass/Fail conditions
- **Test Data**: Required test inputs
- **Mobile Emphasis**: Specific mobile device considerations

---

## Test Cases

### TC-DR-001: Pre-Trip Inspection Completion on Mobile (All Items Pass)

**TC ID**: TC-DR-001
**Test Name**: Pre-Trip Inspection Completion - All Items Pass
**Related US/UC**: US-DR-001, UC-DR-001
**Priority**: Critical
**Test Type**: Functional, Mobile
**Platform**: iOS 14+, Android 8+

#### Preconditions:
- Driver is logged into mobile app
- Driver has valid vehicle assignment (Vehicle #342)
- GPS location is active and driver is at depot
- Device has internet connectivity
- Pre-trip inspection form template is cached on device

#### Test Steps:
1. Driver taps "PRE-TRIP INSPECTION" from home screen
2. System auto-loads vehicle #342 assignment
3. System verifies GPS location matches depot location (±50 meters)
4. Driver reviews standardized inspection checklist: Lights, Tires, Brakes, Fluids, Cargo, Wipers, Controls, Emergency Equipment
5. Driver marks each section "PASS" for all items
6. Driver swipes to summary page
7. System displays: "✓ All 8 sections passed"
8. Driver taps "Sign Inspection"
9. Driver provides fingerprint or stylus signature on capture canvas
10. System captures signature, timestamp, and GPS location
11. Driver taps "Submit Inspection"
12. System uploads inspection with confirmation

#### Expected Results:
- All form fields populate correctly
- Vehicle assignment matches location
- Signature capture interface functions smoothly
- System shows success message: "✓ Pre-trip inspection submitted"
- Inspection record created in backend database
- GPS coordinates and timestamp recorded
- Dispatcher receives notification within 30 seconds
- Driver receives green confirmation, cleared to drive

#### Acceptance Criteria:
- [ ] Vehicle matches assignment within 5 minutes of submission
- [ ] All 8 checklist sections completed
- [ ] Signature captured and encrypted
- [ ] Timestamp accurate to within 1 second
- [ ] GPS location recorded within ±10 meters
- [ ] No form validation errors
- [ ] Upload completes within 5 seconds on 4G/LTE
- [ ] Dispatcher console shows inspection within 1 minute
- [ ] Driver cannot start route until inspection approved
- [ ] Completion time <8 minutes from start to finish

#### Test Data:
- Vehicle ID: #342 (Freightliner Cascadia)
- Driver ID: DR-001 (Marcus)
- GPS Coordinates: 40.7128° N, 74.0060° W (depot)
- Inspection Sections: Lights, Tires, Brakes, Fluids, Cargo, Wipers, Controls, Emergency
- Test Environment: QA staging with mock dispatcher

#### Mobile Emphasis:
- Test on 5" and 6.5" screen sizes
- Test with single-hand operation
- Test with 4G, LTE, and WiFi connectivity
- Verify touch responsiveness (<200ms)
- Test battery drain during 8-minute operation (<2% on modern device)

---

### TC-DR-002: Pre-Trip Inspection Offline Operation

**TC ID**: TC-DR-002
**Test Name**: Pre-Trip Inspection Works Offline with Sync
**Related US/UC**: US-DR-001, UC-DR-007
**Priority**: Critical
**Test Type**: Mobile, Offline, Sync

#### Preconditions:
- Driver is logged into mobile app
- Device has pre-trip form cached locally (SQLite)
- Cellular connectivity is DISABLED (airplane mode)
- Vehicle assignment cached on device
- Vehicle-driver pairing data available offline

#### Test Steps:
1. Driver enables Airplane Mode (disable all cellular/WiFi)
2. Driver opens mobile app
3. System displays: "⚠ Offline mode - Data queued for sync when connected"
4. Driver taps "PRE-TRIP INSPECTION"
5. System loads cached form from local SQLite database
6. Driver completes all inspection items (all pass)
7. Driver takes 3 photos of vehicle condition (stored locally)
8. Driver provides voice note: "Vehicle looks good today"
9. System converts voice to text and stores locally
10. Driver signs inspection digitally (signature image stored locally)
11. Driver taps "Submit Inspection"
12. System displays: "✓ Inspection saved locally - will upload when connected"
13. System queues inspection data to offline sync queue (Priority 1 - Critical)
14. Driver continues shift while offline
15. [After 2 hours] Driver enters area with cellular signal
16. System detects connectivity and initiates auto-sync
17. System uploads queued inspection data to backend
18. Inspection data validates on server (checksum verification)
19. Backend confirms receipt
20. System displays: "✓ All offline data synchronized"

#### Expected Results:
- App remains fully functional in offline mode
- Pre-trip form loads within 2 seconds from cache
- Photos stored at reduced resolution (compressed)
- Voice note recorded and converted to text offline
- Signature captured and stored locally with timestamp
- Submission succeeds with offline message
- Data queued with Priority 1 flag
- On reconnection, sync completes within 60 seconds
- No data loss during offline operation
- Backend receives all data intact after sync
- Dispatcher notified of inspection after sync completes
- Inspection timestamp reflects original offline time

#### Acceptance Criteria:
- [ ] Offline form loads without cellular connection
- [ ] All form fields functional without internet
- [ ] Photos captured and compressed to <2 MB each
- [ ] Voice recording saved locally
- [ ] Digital signature captured offline
- [ ] Form submission successful in offline mode
- [ ] Data queued with correct priority level
- [ ] Auto-sync triggered within 30 seconds of connectivity restoration
- [ ] Sync completes without data corruption
- [ ] Original timestamps preserved after sync
- [ ] Total offline operation time: <10 minutes
- [ ] Storage used: <20 MB for one inspection

#### Test Data:
- Offline inspection: All pass items
- Photos: 3 test images (pre-downloaded to device)
- Voice note: 30-second test audio
- GPS coordinates (cached): Last known location
- Test environment: QA device with offline mode enabled

#### Mobile Emphasis:
- Test on iOS with WiFi + Cellular toggled off
- Test on Android with Airplane Mode enabled
- Verify photo compression without quality loss
- Monitor memory usage during offline operation
- Test storage cleanup after sync
- Verify battery impact of offline-to-online transition

---

### TC-DR-003: Pre-Trip Inspection with Critical Failed Item

**TC ID**: TC-DR-003
**Test Name**: Pre-Trip Inspection - Critical Item Failed (Brake Issue)
**Related US/UC**: US-DR-001, UC-DR-001
**Priority**: Critical
**Test Type**: Functional, Mobile

#### Preconditions:
- Driver is logged into mobile app
- Vehicle #342 assigned and located at depot
- GPS connectivity available
- Inspection form loaded
- Backend is monitoring for critical failures

#### Test Steps:
1. Driver taps "PRE-TRIP INSPECTION"
2. System loads vehicle #342 form
3. Driver completes Lights section - all pass
4. Driver completes Tires section - all pass
5. Driver reaches Brakes section
6. Driver marks "Brake Pedal Feel - FAIL" (pedal feels spongy)
7. System displays alert: "⚠ Critical Safety Issue Detected"
8. System requires photo for failed item
9. Driver taps camera icon and photographs brake pedal area
10. System stores photo with failed item annotation
11. Driver adds voice note: "Brakes need mechanic inspection before route"
12. Driver continues through remaining sections (all pass except brakes)
13. Driver swipes to summary page
14. System displays: "✗ Inspection Incomplete - 1 Critical Item Failed"
15. System shows: "Cannot mark Pass - Brake failure requires resolution"
16. Driver can still sign inspection (legal requirement)
17. Driver provides signature
18. System displays warning: "Critical items present in inspection"
19. Driver taps "Submit Inspection"
20. System queues inspection with CRITICAL priority flag
21. System immediately notifies Dispatcher with alert sound

#### Expected Results:
- Critical item prevents "All Pass" status
- Photo requirement enforced for failed items
- Voice note captured and converted
- Summary page clearly shows failed items
- Signature still captured (for compliance)
- Inspection submitted with critical flag
- Dispatcher receives urgent notification within 10 seconds
- Dispatcher console shows critical failure with photo
- Vehicle marked as unavailable for dispatch
- Driver prevented from clocking in until cleared

#### Acceptance Criteria:
- [ ] System prevents "All Pass" submission with failed items
- [ ] Photo capture required for each failed item
- [ ] Failed items display prominently in summary
- [ ] Voice notes recorded with timestamp
- [ ] Critical flag triggers dispatcher alert
- [ ] Dispatcher notification includes photo and notes
- [ ] Vehicle status updated to "Unavailable" immediately
- [ ] Driver cannot clock in or start route
- [ ] Inspection timestamp accurate
- [ ] All failed item data preserved for investigation

#### Test Data:
- Vehicle: #342 (Freightliner Cascadia)
- Failed Item: Brake Pedal Feel
- Photo: Test image of brake area
- Voice Note: "Brakes need mechanic inspection"
- Dispatcher ID: DP-001

#### Mobile Emphasis:
- Test on small screen (5") - ensure form navigation smooth
- Test camera functionality on both iOS and Android
- Test voice recording quality in noisy environment (vehicle depot)
- Verify alert notification reaches dispatcher mobile device
- Test accessibility features for failed item highlighting

---

### TC-DR-004: Post-Trip Inspection with Mileage Validation

**TC ID**: TC-DR-004
**Test Name**: Post-Trip Inspection - Mileage Matches GPS Data
**Related US/UC**: US-DR-002, UC-DR-002
**Priority**: High
**Test Type**: Functional, Mobile, Integration

#### Preconditions:
- Pre-trip inspection completed earlier
- Driver completed 3 deliveries (178 miles driven)
- Driver at depot, shift end
- Pre-trip odometer: 45,234 miles
- GPS has tracked full route with accurate mileage data
- Post-trip form can access pre-trip data for comparison

#### Test Steps:
1. Driver taps "END SHIFT" button
2. System prompts: "Complete post-trip inspection before clocking out"
3. System displays post-trip form with pre-trip comparison view
4. System shows pre-trip odometer: 45,234 miles
5. Driver reviews odometer on vehicle: currently 45,412 miles
6. Driver enters post-trip odometer: 45,412 miles
7. System calculates distance: 45,412 - 45,234 = 178 miles
8. System compares to GPS calculated mileage: 179 miles (from telematics)
9. Variance calculation: |178 - 179| / 179 = 0.56% (within ±10% tolerance)
10. System displays: "✓ Odometer matches GPS data - Mileage validated"
11. Driver enters fuel level: 3/8 tank (system shows pre-trip: 7/8 tank)
12. System calculates: 4 tanks consumed (reasonable for 178 miles)
13. Driver marks all condition items: Pass (no new damage)
14. Driver adds note: "Check Engine light came on around 2 PM"
15. Driver signs post-trip inspection
16. Driver taps "Submit Post-Trip Inspection and Clock Out"
17. System validates all data, confirms mileage within tolerance
18. System uploads inspection
19. System marks driver as clocked out
20. Next-shift driver receives notification: "Vehicle #342 ready for pickup"

#### Expected Results:
- Pre-trip and post-trip data compared successfully
- Odometer reading accepted (within ±10% of GPS)
- Mileage variance displayed to driver
- Fuel consumption calculated and validated
- GPS comparison stored with inspection record
- Post-trip signature captured
- Clock-out timestamp recorded
- System prevents clock-out until inspection complete
- Next driver receives handoff summary
- Maintenance alert for Check Engine light created
- System notifies dispatcher of condition changes

#### Acceptance Criteria:
- [ ] Pre-trip odometer correctly retrieved and displayed
- [ ] Odometer variance calculated correctly
- [ ] Variance within ±10% tolerance accepted
- [ ] Fuel consumption reasonable (within historical range)
- [ ] All required fields populated before submission
- [ ] GPS mileage comparison shows <1% variance
- [ ] Post-trip timestamp accurate
- [ ] Next driver sees maintenance alert in app
- [ ] Dispatcher receives handoff summary
- [ ] Driver cannot clock out without complete post-trip

#### Test Data:
- Vehicle: #342
- Pre-trip Odometer: 45,234 miles
- Post-trip Odometer: 45,412 miles
- Actual GPS Mileage: 179 miles
- Fuel Consumption: 4 tanks (realistic)
- Check Engine Light: Yes (maintenance note)

#### Mobile Emphasis:
- Test form navigation with large odometer entry field
- Test numeric input validation
- Test comparison view responsiveness
- Verify calculations visible to user
- Test accessibility of "Clock Out" button
- Monitor memory during data comparison

---

### TC-DR-005: Pre-Trip Photo Capture and Voice Annotation

**TC ID**: TC-DR-005
**Test Name**: Pre-Trip Photo Capture with Voice-to-Text Annotation
**Related US/UC**: US-DR-001, UC-DR-001
**Priority**: High
**Test Type**: Mobile, Functional

#### Preconditions:
- Driver at vehicle with inspection in progress
- Device camera functional (rear or front)
- Device microphone functional
- Good lighting conditions
- Connected to network or offline mode enabled

#### Test Steps:
1. Driver marks tire item as "Needs attention" (not full fail yet)
2. System prompts: "Photo required - tap camera icon"
3. Driver taps camera icon in inspection form
4. System opens device camera in portrait orientation
5. Camera displays live preview of tire area
6. System provides visual guide frame (white rectangle) for composition
7. Driver positions camera on tire area and captures photo
8. System displays captured image in preview
9. Driver reviews photo quality: "OK" or "Retake"
10. Driver selects "OK" - photo saved to inspection record
11. System prompts: "Add notes or voice annotation"
12. Driver taps microphone icon
13. System starts voice recording indicator (red dot pulsing)
14. Driver speaks: "Right rear tire looks a bit low - recommend pressure check"
15. Driver completes recording and taps "Done"
16. System processes voice-to-text conversion
17. System displays transcribed text: "Right rear tire looks a bit low - recommend pressure check"
18. Driver reviews transcription: accurate, taps "Confirm"
19. Voice note linked to photo with timestamp
20. Photo and note stored in inspection record
21. Driver continues inspection

#### Expected Results:
- Camera app launches quickly (<1 second)
- Photo captures clearly with good detail
- Visual guide helps driver compose photo
- Photo preview allows retake option
- Voice recording captures cleanly
- Voice-to-text conversion accurate (>95%)
- Photo and voice note linked together
- Timestamp recorded for both
- Data stored locally or uploaded based on connectivity
- Photo displayed in inspection summary

#### Acceptance Criteria:
- [ ] Camera launches and previews within 2 seconds
- [ ] Photo resolution minimum 2 MP (suitable for annotation)
- [ ] Voice recording captures without background noise filtering
- [ ] Voice-to-text accuracy >90%
- [ ] Photo-voice association preserved in data
- [ ] Timestamp accurate to within 1 second
- [ ] Storage efficient (photo <2 MB, voice <500 KB)
- [ ] Retake option functional
- [ ] Annotation visible in inspection summary
- [ ] Works on both iOS and Android camera systems

#### Test Data:
- Vehicle: #342
- Tire: Right rear (RR)
- Photo: Test image of underinflated tire
- Voice Note: "Right rear tire looks a bit low - recommend pressure check"
- Lighting: Daylight conditions

#### Mobile Emphasis:
- Test on iOS with camera permissions
- Test on Android with camera permissions
- Test with various device orientations (portrait/landscape)
- Test voice clarity in vehicle depot environment
- Test photo compression during offline storage
- Monitor battery usage during photo/audio operations
- Test accessibility of microphone icon (size/placement)

---

### TC-DR-006: HOS Duty Status Auto-Switch (Speed >5 mph)

**TC ID**: TC-DR-006
**Test Name**: HOS Duty Status Auto-Switch to Driving
**Related US/UC**: US-DR-004, UC-DR-003
**Priority**: Critical
**Test Type**: Functional, Integration, Mobile

#### Preconditions:
- Driver clocked in and in "On-Duty" status
- Vehicle equipped with telematics (speed sensor)
- GPS location tracking active
- HOS calculation engine operational
- Speed detection threshold: >5 mph for 1 minute = auto-switch to Driving

#### Test Steps:
1. Driver clock-in at 6:35 AM in "On-Duty" status
2. HOS dashboard shows: "Status: On-Duty (Not Driving)"
3. HOS dashboard shows: "Drive time today: 0 hours"
4. Driver starts vehicle engine
5. System detects: Engine running, speed 0 mph
6. Status remains: "On-Duty (Not Driving)"
7. Driver begins driving at 6:36 AM
8. Vehicle speed increases: 5 mph
9. System monitors speed for 60 seconds continuously >5 mph
10. At 6:37 AM (after 1 minute at >5 mph):
11. System auto-switches duty status: "Driving"
12. System logs: "Auto-switched to Driving - 6:37 AM"
13. Driver receives notification: "Status changed to Driving"
14. HOS dashboard now shows:
    - **Status**: Driving
    - **Drive Time**: 0 minutes, 0 seconds (just started)
    - **Drive Time Today**: 1 minute cumulative
15. Driver continues driving for 2 hours to first delivery
16. HOS tracks cumulative: 2 hours drive time
17. System maintains continuous speed monitoring
18. At first delivery (vehicle stops for 25 minutes):
19. System detects: Speed = 0 mph for >2 minutes
20. System auto-switches: "On-Duty (Not Driving)"
21. System logs transition
22. Driver resumes driving
23. System auto-switches back to "Driving" after 1 minute >5 mph

#### Expected Results:
- Status auto-switches accurately based on speed
- Transition logged with exact timestamp
- HOS time accumulates correctly
- Driver notified of status change
- No manual action required from driver
- Speed threshold (5 mph, 1 minute) honored
- Dashboard updates in real-time
- Telematics data matches recorded status
- Mobile app responsive to status changes

#### Acceptance Criteria:
- [ ] Auto-switch to Driving occurs within 2 seconds of 1-min threshold met
- [ ] Auto-switch to On-Duty occurs within 2 seconds of stopped
- [ ] Status never switches during 1-minute ramp-up
- [ ] Drive time accumulates in 1-second increments
- [ ] Timestamp accurate to within 1 second
- [ ] Speed data from telematics matches GPS speed verification
- [ ] All status changes logged to audit trail
- [ ] Driver notification appears within 5 seconds
- [ ] HOS calculation reflects accurate time
- [ ] No missed transitions during connectivity gaps

#### Test Data:
- Vehicle: #342 with active telematics
- Driver: DR-001 (Marcus)
- Start Time: 6:35 AM
- Speed Threshold: 5 mph
- Duration Threshold: 1 minute (60 seconds)
- Test Route: Route #45 (predetermined path)

#### Mobile Emphasis:
- Test notification delivery on locked phone screen
- Test on both active app and backgrounded app
- Test with variable network connectivity
- Monitor battery impact of continuous speed monitoring
- Test dashboard update responsiveness
- Verify notification doesn't interfere with navigation

---

### TC-DR-007: HOS Drive Time Warning (60 Minutes Before Limit)

**TC ID**: TC-DR-007
**Test Name**: HOS Warning - 60 Minutes Before Drive Limit
**Related US/UC**: US-DR-005, UC-DR-004
**Priority**: High
**Test Type**: Functional, Integration, Mobile

#### Preconditions:
- Driver has accumulated 10 hours drive time (11-hour limit)
- Driver is currently driving
- Mobile app has HOS tracking enabled
- Push notification service operational
- System time: 2:15 PM (60 minutes before 3:15 PM limit)

#### Test Steps:
1. Driver Marcus has been driving since 6:45 AM
2. Current accumulated drive time: 10 hours, 0 minutes
3. Time until HOS limit: 60 minutes (3:15 PM)
4. System calculates: 60 minutes to alert threshold
5. At 2:15 PM system triggers: "HOS Warning - 60 Minutes"
6. Push notification sent: "📢 Drive Time Warning: 1 hour remaining"
7. Notification includes: "Can drive until approximately 3:15 PM"
8. Driver receives notification on mobile device
9. Driver checks HOS dashboard
10. Dashboard displays:
    - **Drive Time Used**: 10 / 11 hours
    - **Time Remaining**: 1 hour (60 minutes)
    - **Estimated Stop Time**: 3:15 PM
11. System shows color coding: Yellow (warning state)
12. System recommends: "Break suggested in 30 minutes"
13. Driver has 2 deliveries remaining (45 min and 1 hour)
14. System calculates: "If you continue, you'll hit limit during final delivery"
15. Driver taps "View Safe Rest Options"
16. System displays nearby facilities:
    - "Pilot Flying J - 8 miles (11 min)" - Full services
    - "Rest Area - 3 miles (5 min)" - Free parking
17. Driver selects Pilot Flying J
18. Navigation updated with break stop
19. Driver completes current delivery at 2:35 PM
20. Driver drives to Pilot (11 minutes) and arrives at 2:46 PM
21. Driver taps "Log Break" in app
22. System starts break timer

#### Expected Results:
- 60-minute warning delivered accurately
- Notification contains estimated stop time
- Dashboard shows accurate remaining drive time
- Color coding reflects warning state
- Rest area recommendations provided
- System calculates delivery vs. HOS conflict
- Navigation updates with break stop
- Driver has opportunity to plan break proactively
- Break can be logged in app easily
- Notification accessible from lock screen

#### Acceptance Criteria:
- [ ] Warning triggered at exactly 60 minutes before limit
- [ ] Notification delivered within 10 seconds of trigger time
- [ ] Remaining time calculated correctly
- [ ] Estimated stop time accurate
- [ ] Color coding visible and clear
- [ ] Rest area recommendations within 20 miles
- [ ] Navigation integration works smoothly
- [ ] Break logging interface accessible
- [ ] All times in 12-hour format with AM/PM
- [ ] Notification visible on locked device

#### Test Data:
- Driver: Marcus (DR-001)
- Current Drive Time: 10 hours, 0 minutes
- HOS Limit: 11 hours
- Warning Threshold: 60 minutes before limit
- Current Location: On Route #45, Mile 25
- Rest Areas Nearby: Pilot Flying J (8 mi), Rest Area (3 mi)

#### Mobile Emphasis:
- Test notification on locked screen
- Test notification with Do Not Disturb enabled
- Test on both iOS (APN) and Android (FCM)
- Test sound/vibration patterns
- Monitor battery impact of HOS polling
- Test accessibility of notification action buttons
- Verify notification persists until dismissed

---

### TC-DR-008: HOS Break Logging (30-Minute Meal Break)

**TC ID**: TC-DR-008
**Test Name**: HOS Break Logging - 30-Minute Meal Break
**Related US/UC**: US-DR-005, UC-DR-004
**Priority**: High
**Test Type**: Functional, Integration, Mobile

#### Preconditions:
- Driver received HOS warning (TC-DR-007 completed)
- Driver at Pilot Flying J truck stop
- Current drive time: 10 hours, 0 minutes
- Break type: Meal break (off-duty, doesn't count toward 14-hour limit)
- Current time: 2:46 PM

#### Test Steps:
1. Driver arrives at Pilot Flying J
2. Driver taps "Log Break" in HOS section of app
3. System displays: "Break Type Selection"
4. Options shown:
   - Meal Break (off-duty, no 14-hour clock impact)
   - Sleeper Berth (long-haul only)
   - On-Duty Break (counts toward 14-hour limit)
5. Driver selects: "Meal Break"
6. System displays: "Break started at 2:46 PM"
7. Break timer begins: 0:00 / 30:00
8. System automatically:
   - Pauses drive time accumulation
   - Resets 8-hour driving clock (for break requirement)
   - Logs break start with GPS location and timestamp
9. Driver can view:
   - HOS status: "On Break - Meal Break"
   - Remaining drive time: Still 1 hour (paused, not accumulating)
   - Break duration: 00:02 elapsed
10. Driver can use app features during break:
    - ✓ Check messages from dispatch
    - ✓ View next delivery details
    - ✓ Review performance dashboard
    - ✗ Cannot start new route (grayed out)
    - ✗ Cannot complete deliveries (disabled)
11. After 15 minutes: Driver eats lunch
12. After 30 minutes: Driver finishes break at 3:16 PM
13. Driver taps "Resume Driving" in app
14. System updates HOS:
    - **Break Logged**: 30 minutes (off-duty)
    - **Drive Time Remaining**: Still 1 hour (break reset 8-hour clock)
    - **New Status**: Driving (immediately transitions back)
15. System logs: "Break completed at 3:16 PM, resume driving"
16. Navigation automatically resumes showing remaining deliveries
17. HOS dashboard shows:
    - **Status**: Driving (updated)
    - **Drive Time Used Today**: 10 hours, 0 minutes (unchanged)
    - **Time Remaining**: 1 hour
    - **8-Hour Clock**: 0 hours (reset by break)

#### Expected Results:
- Break type selection clear and accessible
- Break timer starts immediately
- GPS location captured at break start
- Drive time pauses during break
- 8-hour driving clock resets properly
- Driver notifications about restricted functions
- Break duration accurately measured
- On resume, HOS updated correctly
- Drive time remaining unchanged after break
- 8-hour clock reset for next driving period
- Navigation resumes automatically

#### Acceptance Criteria:
- [ ] Break type selection interface responsive
- [ ] Timer displays correctly (MM:SS format)
- [ ] GPS location accurate within ±10 meters
- [ ] Drive time pause confirmed in dashboard
- [ ] 8-hour clock reset upon break completion
- [ ] Restricted functions properly disabled
- [ ] Break duration within ±2 seconds accuracy
- [ ] HOS calculations updated immediately on resume
- [ ] Timestamp for break accurate to 1 second
- [ ] All break data stored for compliance audit

#### Test Data:
- Location: Pilot Flying J Truck Stop
- Break Type: Meal Break
- Break Duration: 30 minutes
- GPS Coordinates: Truck stop location (pre-defined)
- Current Drive Time: 10 hours, 0 minutes
- Break Start: 2:46 PM
- Break End: 3:16 PM

#### Mobile Emphasis:
- Test timer display on small screen
- Test gesture control (swipe to resume)
- Test notification when break time ending (at 25 min)
- Test with app backgrounded during break
- Monitor background location tracking during break
- Test accessibility of break options
- Verify app doesn't auto-close during extended break

---

### TC-DR-009: Offline Sync with Conflict Resolution

**TC ID**: TC-DR-009
**Test Name**: Offline Sync with Conflict - Route Updated While Offline
**Related US/UC**: US-DR-013, UC-DR-007
**Priority**: High
**Test Type**: Mobile, Offline, Sync, Integration

#### Preconditions:
- Driver working offline for 4 hours
- Route #42 assigned before going offline (5 stops)
- While offline, dispatcher removes 1 stop from route (customer cancellation)
- Driver has accumulated offline data: inspections, deliveries, HOS
- Driver reconnects to network after 4 hours

#### Test Steps:
1. Driver begins shift at 6:00 AM in offline area
2. Route #42 assigned: 5 stops
   - Stop A: 6:45 AM
   - Stop B: 8:15 AM
   - Stop C: 9:45 AM
   - Stop D: 11:15 AM
   - Stop E: 1:00 PM
3. Driver works offline for 4 hours (6:00 AM - 10:00 AM)
4. Driver completes Stop A (6:47 AM - offline)
5. Driver en route to Stop B
6. [Meanwhile - at 7:30 AM]: Dispatcher updates route #42
   - Removes Stop C due to customer cancellation
   - Route now has 4 stops instead of 5
   - Change queued for dispatch to offline driver
7. Driver continues offline, completes Stop B (8:20 AM)
8. At 10:00 AM: Driver enters area with cellular coverage
9. System detects connectivity and initiates sync
10. System shows: "Syncing with 4 hours of offline data"
11. System uploads (Priority order):
    - Pre-trip inspection (critical)
    - Completed deliveries (Stop A, Stop B)
    - HOS logs
12. System downloads dispatcher updates while uploading
13. System detects conflict: "Route #42 changed while offline"
14. System displays conflict resolution dialog:
    - **Original (Offline)**: 5 stops including Stop C
    - **Current (Server)**: 4 stops, Stop C removed
    - **Your Progress**: Completed Stop A and B
15. Driver sees: "Customer cancelled Stop C - Route updated"
16. System presents option: "Accept updated route?"
17. Driver reviews: Updated route still includes Stops D and E
18. Driver confirms: "Accept updated route"
19. System resolves conflict: Uses server version (authoritative)
20. Route updated on driver's device:
    - Stop A: ✓ Complete
    - Stop B: ✓ Complete
    - Stop C: ✗ Removed
    - Stop D: Next (new ETA: 10:45 AM)
    - Stop E: (new ETA: 12:30 PM)
21. Navigation automatically recalculates to Stop D
22. HOS and delivery data synced successfully
23. System displays: "✓ All offline data synchronized"
24. Driver continues with updated route

#### Expected Results:
- Sync initiates automatically on reconnection
- Offline data uploads with correct priority
- Conflict detected and flagged to driver
- Conflict resolution options clear
- Driver can accept server version (preferred)
- Route updates automatically after resolution
- Navigation recalculates with new route
- Previous completed stops preserved
- ETA updates for remaining stops
- All data consistent between app and server

#### Acceptance Criteria:
- [ ] Sync completes within 60 seconds
- [ ] Conflict detection accurate
- [ ] Conflict resolution options clear
- [ ] Server version authoritative (accepted)
- [ ] Route updates complete within 10 seconds
- [ ] Navigation recalculates correctly
- [ ] Completed deliveries preserved
- [ ] Cancelled stop removed from route
- [ ] ETA updates accurate
- [ ] All HOS data synchronized correctly

#### Test Data:
- Driver: Jessica (DR-002)
- Route: #42 (5 stops initially)
- Offline Duration: 4 hours (6:00 AM - 10:00 AM)
- Completed Stops: A, B
- Updated Route: 4 stops (C removed)
- Sync Time: 10:00 AM
- Remaining Stops: D, E

#### Mobile Emphasis:
- Test conflict dialog on various screen sizes
- Test gesture navigation of conflict options
- Test automatic route recalculation
- Monitor memory during large sync operation
- Test with variable network speeds
- Verify notification of conflict and resolution
- Test undo/redo of conflict resolution

---

### TC-DR-010: Biometric Authentication (Fingerprint Signature)

**TC ID**: TC-DR-010
**Test Name**: Biometric Authentication - Fingerprint for Signature
**Related US/UC**: US-DR-001, US-DR-002
**Priority**: High
**Test Type**: Mobile, Security

#### Preconditions:
- Driver device supports biometric (Face ID or Touch ID)
- Biometric enrolled on device
- Driver at signature screen of inspection form
- Biometric authentication service operational
- Device in online mode

#### Test Steps:
1. Driver completes pre-trip or post-trip inspection
2. System displays: "Sign Inspection" button
3. Driver taps "Sign Inspection"
4. System displays signature screen with options:
   - Biometric (Fingerprint/Face ID)
   - Stylus/Finger Drawing
   - PIN with Verbal Confirmation
5. Driver selects: "Biometric Signature"
6. System displays: "Place finger on sensor" (iOS Touch ID)
   OR "Look at camera" (iOS Face ID)
   OR "Fingerprint sensor" (Android)
7. Driver places finger on sensor
8. System processes biometric data
9. Biometric matches enrolled fingerprint
10. System captures:
    - Biometric match confirmation
    - Timestamp: 6:52 AM (accurate to millisecond)
    - GPS location: 40.7128° N, 74.0060° W
    - Device ID
    - Driver ID (authenticated)
11. System displays: "✓ Signature captured via biometric"
12. System generates signature record (biometric hash)
13. Signature stored encrypted with AES-256
14. System displays: "Signature confirmed - inspection ready for submission"
15. Driver taps "Submit Inspection"
16. System includes biometric signature in inspection record
17. Backend verifies biometric hash matches

#### Expected Results:
- Biometric prompt appears within 1 second of selection
- Biometric authentication succeeds (>95% match confidence)
- Timestamp accurate to within 500ms
- GPS coordinates recorded within ±10 meters
- Biometric hash generated and encrypted
- Signature data legally binding
- Audit trail includes biometric method
- No storage of actual fingerprint data
- Signature verification possible by legal team
- Compliance with ESIGN Act

#### Acceptance Criteria:
- [ ] Biometric prompt appears within 1 second
- [ ] Biometric authentication succeeds on first attempt
- [ ] Timestamp accurate to within 1 second
- [ ] GPS location within ±10 meters
- [ ] Biometric data encrypted before storage
- [ ] No plaintext fingerprint data in logs
- [ ] Signature record includes authentication method
- [ ] Audit trail complete and tamper-proof
- [ ] Legal compliance verified
- [ ] Works on iOS 14+ and Android 10+

#### Test Data:
- Device: iPhone 13 Pro (Touch ID) or Pixel 6 (Biometric)
- Enrolled Fingerprint: Test fingerprint on device
- Driver: DR-001
- Signature Context: Pre-trip inspection
- GPS Location: Depot (40.7128° N, 74.0060° W)

#### Mobile Emphasis:
- Test on iOS with Touch ID
- Test on iOS with Face ID
- Test on Android with fingerprint sensor
- Test with wet fingers (moisture on sensor)
- Test fallback to PIN if biometric fails
- Test accessibility for drivers with biometric disabilities
- Test performance impact on app responsiveness
- Verify no biometric data leakage in logs

---

### TC-DR-011: Damage Report with Vehicle Diagram Annotation

**TC ID**: TC-DR-011
**Test Name**: Vehicle Damage Report with Interactive Diagram
**Related US/UC**: US-DR-008, UC-DR-001
**Priority**: High
**Test Type**: Mobile, Functional

#### Preconditions:
- Driver discovered damage during post-trip inspection
- Vehicle diagram SVG template loaded on device
- Camera available for photo capture
- Device has annotation tools enabled
- Post-trip inspection form open

#### Test Steps:
1. Driver completing post-trip inspection
2. Driver notices: Scratch on passenger door
3. Driver taps "Report Damage" button
4. System displays: "Vehicle Diagram - Select Damage Location"
5. System shows interactive SVG vehicle diagram (top-down view)
6. Vehicle shows all external panels: roof, hood, doors (L/R), windows, bumpers
7. Driver taps: Passenger door area on diagram
8. System highlights: Passenger door with red border
9. System displays: "Damage Details - Passenger Door Selected"
10. Damage type selection appears:
    - Dent
    - Scratch
    - Broken
    - Missing
    - Crack
    - Other
11. Driver selects: "Scratch"
12. Damage severity options:
    - Minor (cosmetic, no function impact)
    - Moderate (visible, minor function impact)
    - Major (significant damage, function impact)
13. Driver selects: "Minor" (cosmetic scratch only)
14. System prompts: "Take photos of damage (1-10 photos)"
15. Driver taps camera icon
16. Camera launches in damage photo mode
17. System provides annotation overlay:
    - Grid lines for composition
    - Dimension reference (ruler)
    - Light level indicator
18. Driver takes 3 photos:
    - Photo 1: Wide angle (passenger door full view)
    - Photo 2: Close-up (scratch detail)
    - Photo 3: Lighting angle (visibility of damage)
19. System stores all 3 photos with timestamps
20. Driver can annotate photos:
    - Draws arrow pointing to scratch
    - Adds text label: "Scratch on passenger door - 12 inches"
21. System overlays annotations on photo
22. Driver taps: "Damage Estimate" (optional)
23. System shows: Estimated repair cost range ($200-$500) based on damage type/severity
24. Driver adds: "Estimate provided is helpful for insurance"
25. System displays damage summary:
    - Location: Passenger Door
    - Type: Scratch
    - Severity: Minor
    - Photos: 3 (with annotations)
    - Estimated Cost: $200-$500
26. System includes vehicle diagram with damage location marked
27. System captures: GPS location, timestamp, driver info
28. Driver taps "Submit Damage Report"
29. System uploads report with all photos and annotations
30. Maintenance team receives notification with damage details

#### Expected Results:
- Vehicle diagram loads quickly and is responsive
- Touch interaction on diagram works smoothly
- Damage location clearly marked on diagram
- Photo capture interface intuitive
- Annotation tools available and easy to use
- Photos stored with location and timestamp
- Damage summary clear and complete
- Maintenance team receives all details
- Estimate provided for insurance
- Audit trail includes all damage documentation

#### Acceptance Criteria:
- [ ] Vehicle diagram loads within 2 seconds
- [ ] Touch selection accurate within 5% of diagram area
- [ ] Damage type selection complete (6+ options)
- [ ] Severity clear and consistent
- [ ] Photo capture within 3 seconds of tap
- [ ] Annotation tools available and responsive
- [ ] Up to 10 photos supported
- [ ] GPS location accurate within ±10 meters
- [ ] Timestamp accurate to 1 second
- [ ] Maintenance notification includes all details

#### Test Data:
- Vehicle: #342
- Damage Location: Passenger Door
- Damage Type: Scratch
- Severity: Minor
- Photos: 3 test images (damage area)
- Estimated Cost: $200-$500
- GPS: Depot location

#### Mobile Emphasis:
- Test diagram responsiveness on 5" and 6.5" screens
- Test touch accuracy with different finger sizes
- Test camera functionality on both iOS and Android
- Test annotation tool performance
- Test photo storage efficiency
- Monitor battery impact during multi-photo capture
- Test accessibility of diagram interaction
- Verify photo compression without quality loss

---

### TC-DR-012: In-App Messaging from Dispatch (Hands-Free)

**TC ID**: TC-DR-012
**Test Name**: In-App Messaging from Dispatch - Text-to-Speech While Driving
**Related US/UC**: US-DR-013, UC-DR-008
**Priority**: High
**Test Type**: Mobile, Functional, Accessibility

#### Preconditions:
- Driver actively driving on assigned route
- Vehicle speed >5 mph (detected as driving)
- Messaging service operational
- Text-to-speech engine available
- Push notification service functional
- Dispatcher logged into dispatch console

#### Test Steps:
1. Driver James driving on Route #45 at 10:30 AM (35 mph)
2. Dispatcher Rita sends message: "Traffic on Main St - take alternate route via Oak Ave"
3. Message marked: Priority "Standard"
4. Dispatcher clicks "Send" to James
5. System detects: James is currently driving (speed 35 mph)
6. Message transmission: Push notification sent
7. James's phone receives notification
8. System checks: Driver status = "Driving" (vehicle speed >5 mph)
9. No visual popup displayed (safety - no distracted driving)
10. Audio alert sounds: Distinctive tone "Message from Dispatch"
11. Text-to-speech engine processes message
12. System speaks aloud: "Traffic on Main Street. Take alternate route via Oak Avenue."
13. James hears message clearly through speaker (or Bluetooth)
14. Message read completely before next interaction
15. System displays: "Quick Reply Options" (voice-enabled)
    - "Acknowledged"
    - "Running late"
    - "Safe conditions"
    - "Dictate message"
16. James uses voice command: "Say acknowledged"
17. System processes voice input: "Acknowledged"
18. James's response sent: "Acknowledged" (timestamp 10:31 AM)
19. Dispatcher receives: "James - Acknowledged"
20. System auto-updates navigation:
    - Removes Main St from route
    - Recalculates: Main St → Oak Ave alternate
    - Provides new turn-by-turn directions
21. System announces direction: "In 0.5 miles, turn right on Oak Avenue"
22. Navigation updated, James follows new route
23. James arrives at next delivery on-time

#### Expected Results:
- Notification delivery within 5 seconds of send
- Message read aloud via TTS without visual popup
- Audio quality clear and intelligible
- TTS voice matches driver app profile
- Quick reply options available hands-free
- Voice recognition accurate (>95%)
- Navigation updates automatic
- Driver can respond via voice
- Message logged with timestamp
- Safety maintained (no visual distraction)

#### Acceptance Criteria:
- [ ] Notification delivered within 5 seconds
- [ ] TTS audio clear at >70 dB
- [ ] Message words spoken at natural pace (120-150 WPM)
- [ ] No visual popup when driving detected
- [ ] Quick reply options accessible via voice
- [ ] Voice recognition accuracy >90%
- [ ] Response sent within 10 seconds
- [ ] Navigation updates within 5 seconds
- [ ] Message logged with delivery confirmation
- [ ] Works on both iOS (Siri) and Android (Google)

#### Test Data:
- Driver: James (actively driving, speed 35 mph)
- Dispatcher: Rita
- Message: "Traffic on Main St - take alternate route via Oak Ave"
- Response: "Acknowledged"
- Location: Route #45, approaching Main St
- TTS Engine: Device native (iOS/Android)

#### Mobile Emphasis:
- Test TTS on various device speakers
- Test with Bluetooth audio (car audio system)
- Test with headphones
- Test voice recognition in vehicle noise environment
- Test message interruption of music/podcasts
- Test with Do Not Disturb enabled
- Test on locked screen device
- Verify accessibility for hearing-impaired drivers
- Monitor battery impact of TTS engine
- Test message delivery with poor signal

---

### TC-DR-013: Vehicle Incident Report (Near-Miss)

**TC ID**: TC-DR-013
**Test Name**: Vehicle Incident Report - Near-Miss Scenario
**Related US/UC**: US-DR-007, UC-DR-006
**Priority**: Critical
**Test Type**: Mobile, Functional, Emergency

#### Preconditions:
- Driver on Route 95 North (high-speed highway)
- Hard braking detected by telematics
- Driver experiencing stressful situation (near-miss)
- Mobile app accessible and operational
- GPS location tracking active
- Emergency button visible on home screen

#### Test Steps:
1. Driver Tom driving at 45 mph on Route 95 North at 2:47 PM
2. Oncoming traffic: White sedan cuts in front without signaling
3. Tom performs emergency braking: 45 mph → 15 mph (hard braking event)
4. No collision occurs (near-miss situation)
5. Tom's heart racing, needs to report incident
6. Tom taps red "EMERGENCY" button (bottom right of home screen)
7. System displays: "📍 INCIDENT REPORTING"
8. Incident type selection shown:
   - Accident / Collision
   - Near-Miss (close call)
   - Property Damage
   - Injury / Safety Concern
   - Hazmat Issue
   - Other
9. Tom selects: "Near-Miss"
10. System auto-fills fields:
    - **Vehicle**: #412
    - **Location**: Route 95 North, Mile Marker 47
    - **Coordinates**: 42.1547° N, 72.4892° W
    - **Date/Time**: 11/10/2025, 2:47 PM
11. System shows: "⚠ Hard braking detected at this time - included in report"
12. Tom adds description: Voice dictation enabled
13. Tom speaks: "White sedan cut in front of me without signaling. I had to brake hard to avoid collision."
14. System converts to text
15. Tom reviews and confirms text accuracy
16. Tom indicates: "No injury"
17. Tom adds details:
    - "No damage to my vehicle or other vehicle"
    - "Other vehicle fled scene"
    - "License plate not visible"
18. System prompts: "Take photo/video of scene?"
19. Tom taps camera icon
20. Tom records 30-second video of current location and road conditions
21. Video queued for upload (may compress for transmission)
22. System displays incident summary:
    - **Type**: Near-Miss
    - **Location**: Route 95 North, MM 47
    - **Description**: [Full text]
    - **Telematics Data**: Hard braking event at 2:47 PM (45→15 mph)
    - **Video**: Yes, 30 seconds
    - **Injury**: No
    - **Damage**: No
    - **Status**: Ready to submit
23. Tom reviews and taps: "Submit Incident Report"
24. System uploads report with priority flag
    - To Dispatcher (immediate notification)
    - To Safety Officer (routine review)
    - Video queued for upload
25. Dispatcher receives alert: "📢 Near-Miss reported - Route 95 MM 47 - Vehicle #412"
26. Dispatcher reviews incident on console
27. Dispatcher messages Tom: "Thanks for reporting - video received. Drive safe."
28. Tom receives confirmation: "✓ Incident report submitted successfully"
29. System creates incident record: INC-2025-1847
30. Safety officer receives notification for follow-up

#### Expected Results:
- Emergency button accessible within 2 taps
- Incident type selection clear
- Auto-fill of vehicle/location/time accurate
- Voice dictation captured cleanly
- Hard braking data linked to incident
- Video capture functional
- All incident details visible in summary
- Incident submitted successfully
- Dispatcher notified immediately
- Incident record created for investigation
- Safety officer can follow up

#### Acceptance Criteria:
- [ ] Emergency button accessible from any screen
- [ ] Incident type selection within 3 taps
- [ ] Auto-fill accurate (vehicle, location, time)
- [ ] Voice dictation accuracy >90%
- [ ] Hard braking data linked to incident timestamp
- [ ] Video captures at minimum 720p quality
- [ ] Video upload queued (may be deferred for bandwidth)
- [ ] Incident summary complete and clear
- [ ] Dispatcher notification within 30 seconds
- [ ] Incident record persists for 7 years

#### Test Data:
- Driver: Tom
- Vehicle: #412
- Location: Route 95 North, Mile Marker 47
- Time: 2:47 PM
- Hard Braking: 45 mph → 15 mph
- Description: "White sedan cut in front..."
- Video: 30 seconds at incident location
- No Injury: Confirmed
- No Damage: Confirmed

#### Mobile Emphasis:
- Test Emergency button visibility on various screens
- Test quick access (2 taps maximum)
- Test voice dictation in moving vehicle
- Test video quality on 4G/LTE
- Test with poor network (video upload deferred)
- Test notification delivery to dispatcher
- Monitor battery impact of video recording
- Test accessibility of incident form
- Verify incident data persists if app crashes
- Test offline operation (incident queued for sync)

---

### TC-DR-014: HOS Violation Prevention (Limit Reached)

**TC ID**: TC-DR-014
**Test Name**: HOS Violation Prevention - Drive Limit Reached
**Related US/UC**: US-DR-004, US-DR-005
**Priority**: Critical
**Test Type**: Functional, Integration, Compliance

#### Preconditions:
- Driver has 10 hours 55 minutes accumulated drive time
- 11-hour limit approaching (5 minutes remaining)
- Driver is currently driving
- Dispatcher cannot override without documentation
- System is in strict compliance mode

#### Test Steps:
1. Driver Jennifer driving with 10 hours 55 minutes accumulated
2. Time until HOS limit: 5 minutes
3. System displays: "🛑 STOP - HOS LIMIT REACHED IN 5 MINUTES"
4. Alert sound: Continuous beeping (driver attention)
5. Dashboard color: Red (critical state)
6. Jennifer receives escalating alerts:
   - 15 min before: "⚠⚠ Drive time ending soon"
   - 5 min before: "🔴 URGENT: Limited drive time remaining"
7. At 11 hours exactly:
8. System detects: Drive time = 11 hours 0 minutes (limit reached)
9. System triggers automatic off-duty status switch
10. Navigation locked: "HOS Limit Reached - Driving Not Permitted"
11. Current route cannot continue
12. System sends alert to Dispatcher: "CRITICAL - Jennifer has reached HOS limit"
13. Dispatcher cannot force continued driving
14. Dispatch options:
    - Reassign route to another driver
    - Continue route after Jennifer's 10-hour rest
    - Accept route cancellation
15. System displays to Jennifer: "You must stop driving"
16. Jennifer receives notification: "10-hour rest required before resuming"
17. Jennifer safely completes current task and pulls over
18. Jennifer logs off for rest period
19. System tracks: Rest period begins
20. After 10 hours rest (starting 5:00 PM → 3:00 AM):
21. Jennifer can resume driving with new 11-hour limit

#### Expected Results:
- HOS limit prevents further driving automatically
- Navigation locked at limit
- Dispatcher notified immediately
- Route reassignment possible
- Driver cannot override limit
- System enforces 10-hour rest requirement
- Audit trail shows violation prevention
- Compliance maintained
- Telematics validates no further driving
- FMCSA regulation met

#### Acceptance Criteria:
- [ ] Navigation locked exactly at 11-hour mark
- [ ] Alert escalates from 15 min to 5 min
- [ ] Dispatcher receives immediate notification
- [ ] Route lock prevents new stop assignments
- [ ] System forces off-duty status
- [ ] No override option without legal documentation
- [ ] 10-hour rest enforced before re-engagement
- [ ] Violation logged for compliance audit
- [ ] Telematics confirms speed = 0 at limit
- [ ] All times accurate to within 1 second

#### Test Data:
- Driver: Jennifer
- Current Drive Time: 10 hours 55 minutes
- HOS Limit: 11 hours (FMCSA regulation)
- Remaining Time: 5 minutes
- Alert Escalation: 15 min, 5 min before limit
- Required Rest: 10 hours

#### Mobile Emphasis:
- Test alert notification on locked screen
- Test sound/vibration with Do Not Disturb
- Test dashboard alert visibility
- Test navigation lock responsiveness
- Test with various network speeds
- Monitor battery impact of continuous HOS monitoring
- Test accessibility of rest period counter
- Verify alert doesn't interfere with safe stop

---

### TC-DR-015: Fuel Transaction with Receipt OCR

**TC ID**: TC-DR-015
**Test Name**: Fuel Transaction Logging with Receipt OCR
**Related US/UC**: US-DR-011, UC-DR-005
**Priority**: Medium
**Test Type**: Mobile, Functional, Integration

#### Preconditions:
- Driver at fuel station (Pilot Flying J)
- Vehicle refueled (45 gallons)
- Physical fuel receipt available
- Device camera functional
- OCR service operational (Azure Computer Vision or similar)
- Last fuel-up odometer data available: 87,089 miles

#### Test Steps:
1. Driver Sarah pulls into Pilot Flying J at 11:30 AM
2. Sarah refuels Vehicle #412: 45 gallons diesel
3. Sarah opens mobile app
4. Sarah taps "Log Fuel"
5. System displays fuel entry form:
   - **Vehicle**: #412 (auto-filled)
   - **Fuel Type**: Diesel (auto-filled)
   - **Date**: 11/10/2025 (auto-filled)
   - **Time**: 11:30 AM (auto-filled)
6. Sarah enters:
   - **Gallons**: 45
   - **Price per Gallon**: $3.45
   - System calculates: **Total Cost**: $155.25
7. System prompts: "Scan receipt for verification?"
8. Sarah taps camera icon
9. System opens camera for receipt scanning
10. Sarah positions fuel receipt in frame
11. System displays OCR processing indicator
12. OCR extracts receipt data:
    - Gallons: 45.23
    - Price: $3.45
    - Total: $156.04
13. System displays discrepancy: "Manual entry 45 gal vs receipt 45.23 gal"
14. Sarah reviews and confirms: "Receipt is 45.23 gallons - I'll update"
15. Sarah updates entry: 45.23 gallons, $156.04 total
16. System validates data against OPIS fuel price average: $3.42
17. Variance: $3.45 vs $3.42 = +$0.03/gal (0.9% variance - acceptable)
18. System displays: "Fuel price within expected range"
19. System requests odometer: "Current Odometer"
20. Sarah enters: 87,234 miles (from telematics confirmation)
21. System calculates MPG:
    - Distance: 87,234 - 87,089 = 145 miles
    - Gallons: 45.23
    - MPG: 145 / 45.23 = 3.21 MPG
22. System displays: "Fuel efficiency: 3.21 MPG"
23. System compares to fleet average: "Fleet average: 6.2 MPG"
24. Alert: "⚠ This vehicle is below average - possible maintenance needed"
25. Sarah adds note: "Vehicle #412 is older model, lower MPG expected"
26. System auto-captures GPS location: "Pilot Flying J - Exit 45, I-95 North"
27. System checks preferred vendor: "Pilot Flying J - Preferred vendor"
28. Sarah taps "Submit Fuel Entry"
29. System validates all data
30. System uploads fuel transaction with receipt photo

#### Expected Results:
- Fuel entry form loads quickly
- OCR accurately extracts receipt data (>95% accuracy)
- Discrepancies flagged for driver review
- Price variance checked against market data
- MPG calculated correctly
- Fleet average comparison provided
- Maintenance alert if MPG below threshold
- GPS location captured
- Preferred vendor status checked
- Receipt photo stored for audit trail

#### Acceptance Criteria:
- [ ] Fuel entry form accessible within 2 taps
- [ ] OCR accuracy >95% for receipt data
- [ ] Price variance detected and flagged
- [ ] MPG calculation accurate to 2 decimal places
- [ ] Fleet average comparison correct
- [ ] Maintenance alert triggered for >20% variance
- [ ] GPS location accurate within ±20 meters
- [ ] Receipt photo stored with transaction
- [ ] All data uploaded within 10 seconds
- [ ] No duplicate transaction detection

#### Test Data:
- Vehicle: #412
- Location: Pilot Flying J, Exit 45, I-95 North
- Gallons: 45.23
- Price per Gallon: $3.45
- Total Cost: $156.04
- Previous Odometer: 87,089 miles
- Current Odometer: 87,234 miles
- Distance: 145 miles
- MPG: 3.21 (below fleet average 6.2)
- Receipt: Fuel station receipt image

#### Mobile Emphasis:
- Test camera OCR on various lighting conditions
- Test receipt positioning and angle tolerance
- Test OCR accuracy with different receipt formats
- Monitor battery impact of camera/OCR operation
- Test with poor lighting (indoor pump)
- Test on both iOS and Android devices
- Verify receipt photo quality
- Test OCR timeout (if service unavailable)
- Monitor data usage for OCR processing

---

### TC-DR-016: Voice-to-Text Incident Description

**TC ID**: TC-DR-016
**Test Name**: Voice-to-Text for Incident Description
**Related US/UC**: US-DR-007, UC-DR-006
**Priority**: High
**Test Type**: Mobile, Functional, Accessibility

#### Preconditions:
- Driver involved in near-miss incident
- Mobile app incident reporting open
- Device microphone functional
- Voice-to-text service operational
- Noisy vehicle environment

#### Test Steps:
1. Driver Tom opens incident report (from TC-DR-013)
2. Description field displayed for incident details
3. Tom taps microphone icon for voice input
4. System displays: "Speak your description - speak clearly"
5. Recording indicator shows: Red dot pulsing
6. Tom speaks: "White sedan cut in front of me without signaling. I had to brake hard to avoid collision. No injuries or damage."
7. Voice recorded for 8 seconds
8. Tom completes speaking and taps "Stop Recording"
9. System processes voice-to-text conversion
10. System displays transcription:
    - "White sedan cut in front of me without signaling."
    - "I had to brake hard to avoid collision."
    - "No injuries or damage."
11. System accuracy check: Matches spoken input
12. Tom reviews text and confirms: "This is accurate"
13. Text embedded in incident record
14. System displays: "✓ Description recorded via voice"
15. Tom can add additional details if needed
16. Tom taps "Submit Incident Report"

#### Expected Results:
- Voice-to-text interface accessible and intuitive
- Recording captures voice clearly in vehicle environment
- Text conversion accurate (>90% accuracy target)
- Transcription readable and complete
- Driver can confirm or edit transcription
- Voice data stored securely
- Transcript preserved in incident record
- Timestamp recorded for voice input
- Works in noisy environment
- Fallback available if accuracy insufficient

#### Acceptance Criteria:
- [ ] Voice-to-text interface loads within 1 second
- [ ] Recording indicator visible and responsive
- [ ] Voice capture quality >80 dB minimum
- [ ] Text conversion accuracy >85%
- [ ] Transcription complete and readable
- [ ] Driver confirmation required before submission
- [ ] Voice data encrypted during transmission
- [ ] Timestamp recorded with transcription
- [ ] Storage efficient (<500 KB per minute of audio)
- [ ] Fallback manual entry available

#### Test Data:
- Incident: Near-miss situation
- Voice Input: "White sedan cut in front of me without signaling. I had to brake hard to avoid collision. No injuries or damage."
- Environment: Vehicle cabin (moderate noise)
- Audio Quality: 16 kHz sample rate minimum

#### Mobile Emphasis:
- Test voice capture in vehicle environment (road noise)
- Test with driver fatigue or stress (elevated voice)
- Test with various accents and speech patterns
- Monitor battery impact of voice processing
- Test with Bluetooth microphone (vehicle audio system)
- Test fallback to manual entry if accuracy low
- Verify voice data not stored locally (privacy)
- Test accessibility for non-English speakers

---

### TC-DR-017: Navigation Offline with Cached Maps

**TC ID**: TC-DR-017
**Test Name**: Turn-by-Turn Navigation Works Offline
**Related US/UC**: US-DR-009, UC-DR-007
**Priority**: High
**Test Type**: Mobile, Offline, Integration

#### Preconditions:
- Route #45 assigned and downloaded to device
- Offline maps cached for route region
- GPS location services active
- Driver in area with no cellular coverage
- Telematics GPS providing location data

#### Test Steps:
1. Driver Jessica begins shift in rural area (poor coverage)
2. Route #45 assigned: 5 stops across rural region
3. System checks: Offline maps available for region
4. Jessica taps "Navigation" button
5. System displays: "✓ Offline Navigation Available"
6. Navigation starts with cached maps
7. Turn-by-turn directions displayed without cellular
8. System shows:
   - Current location (GPS-based)
   - Route waypoints (5 stops)
   - Estimated arrival times
   - Voice navigation (audio files cached)
9. Jessica begins driving
10. System announces: "In 0.5 miles, turn right on Main Street"
11. Voice guidance works from offline audio files
12. Navigation updates GPS position in real-time (no cellular needed)
13. Jessica follows turn-by-turn directions
14. Route progress shows: Stop 1 of 5 approaching
15. Jessica arrives at Stop 1
16. System automatically transitions: "Stop 1 - arrived"
17. Jessica completes delivery
18. Jessica marks stop complete: "Taps delivery complete"
19. Navigation recalculates to Stop 2
20. System announces updated directions
21. Jessica continues entire route with offline navigation
22. All 5 stops completed without cellular connectivity
23. Navigation calculates mileage: 87 miles (accurate)
24. Jessica returns to depot
25. Navigation concludes: "Route complete"
26. [Later] Jessica enters area with connectivity
27. System syncs navigation history with backend

#### Expected Results:
- Offline maps load from cache within 1 second
- Turn-by-turn directions work without cellular
- Voice guidance from cached audio files
- GPS location tracking continuous (no cellular needed)
- Route progress updated in real-time
- Stop transitions automatic
- Navigation accurate for entire route
- Mileage calculated correctly
- All features available offline except live traffic
- Data synced on reconnection

#### Acceptance Criteria:
- [ ] Offline maps cache complete for route region
- [ ] Turn-by-turn directions function without cellular
- [ ] Voice guidance audio quality acceptable
- [ ] GPS position updates every 1-2 seconds
- [ ] Route progress accurate
- [ ] Stop transitions automatic
- [ ] Mileage calculation within ±2% of actual
- [ ] Navigation responsive to user input
- [ ] No cellular data transmitted during offline use
- [ ] All data preserved for sync on reconnection

#### Test Data:
- Route: #45 (5 stops)
- Region: Rural area, ~87 miles
- Offline Maps: Pre-cached for region
- GPS: Active but no cellular
- Voice Guidance: Cached audio files

#### Mobile Emphasis:
- Test offline map quality (resolution/detail)
- Test GPS accuracy without cellular (±10-30 meters typical)
- Test voice guidance quality
- Test route recalculation if off-route
- Monitor battery impact of GPS-only mode
- Test screen readability in various lighting
- Test gesture controls (pinch/zoom) on cached maps
- Verify no cellular data leakage

---

### TC-DR-018: HOS Certification and Audit Trail

**TC ID**: TC-DR-018
**Test Name**: HOS Daily Certification with Audit Trail
**Related US/UC**: US-DR-004, UC-DR-003
**Priority**: Critical
**Test Type**: Functional, Compliance, Security

#### Preconditions:
- Driver has completed full shift with HOS entries
- All duty status changes logged
- Daily HOS summary available
- Certification signature required per FMCSA
- Audit trail system operational

#### Test Steps:
1. Driver Jennifer completes shift at 6:00 PM
2. System displays: "Daily HOS Certification Required"
3. Jennifer taps "View Daily Summary"
4. System shows HOS summary:
   - Date: 11/10/2025
   - Drive Time: 9 hours 15 minutes
   - On-Duty Time: 11 hours 45 minutes
   - Off-Duty Time: 12 hours 0 minutes
   - Compliance: ✓ Within all limits
5. System displays: "Certify these logs - I hereby certify that my records are true and accurate"
6. Jennifer taps "Certify"
7. System requires signature for legal binding
8. Jennifer provides fingerprint signature
9. System captures:
   - Signature (biometric or canvas)
   - Timestamp: 6:00 PM (exact)
   - GPS location: Depot
   - Device ID
   - Driver ID
   - Signature method (fingerprint)
10. System creates certification record:
    - Certifier: Jennifer
    - Date/Time: 11/10/2025, 6:00 PM
    - HOS Summary: [complete data]
    - Signature: [encrypted hash]
11. System generates audit trail entry:
    - Action: "HOS Certification"
    - User: Jennifer (DR-002)
    - Timestamp: 6:00:23 PM (to millisecond)
    - Location: GPS coordinates
    - Device: iPhone 13 Pro
    - IP Address: [network address]
    - Changes Certified: 12 HOS entries
12. System logs: "Certification valid for 13 days per FMCSA"
13. System displays: "✓ HOS logs certified"
14. Backend receives and validates certification
15. Compliance officer can view full audit trail
16. System prevents modification of certified logs
17. Jennifer views completed: "HOS certified - next certification due 11/23/2025"

#### Expected Results:
- HOS summary accurate and complete
- Certification interface clear and legal
- Signature captured with full audit trail
- Timestamp accurate to millisecond
- All changes linked to certification
- Audit trail immutable (tamper-proof)
- Certification valid per FMCSA (13 days)
- Compliance officer can review
- No post-certification modifications permitted
- Records retained per regulatory requirements

#### Acceptance Criteria:
- [ ] HOS summary reflects all entries correctly
- [ ] Certification signature required and captured
- [ ] Timestamp accurate to 1 second
- [ ] Audit trail entry created automatically
- [ ] All HOS changes linked to certification
- [ ] Signature validation matches driver ID
- [ ] Certification marked valid for 13 days
- [ ] Attempts to modify certified logs prevented
- [ ] Compliance officer can generate audit report
- [ ] Records retained for 3 years minimum

#### Test Data:
- Driver: Jennifer (DR-002)
- Date: 11/10/2025
- Drive Time: 9 hours 15 minutes
- On-Duty Time: 11 hours 45 minutes
- Off-Duty Time: 12 hours 0 minutes
- Certification Time: 6:00 PM
- HOS Entries: 12 (various status changes)
- Next Certification Due: 11/23/2025

#### Mobile Emphasis:
- Test signature capture responsiveness
- Test timestamp accuracy on mobile device
- Test GPS location capture accuracy
- Test audit trail display
- Test compliance report generation
- Monitor memory during large audit trail operations
- Test accessibility of certification summary
- Verify immutability of certified records

---

### TC-DR-019: Delivery Proof of Delivery (POD) with Signature

**TC ID**: TC-DR-019
**Test Name**: Delivery Proof of Delivery - Customer Signature Capture
**Related US/UC**: US-DR-010, UC-DR-002
**Priority**: High
**Test Type**: Mobile, Functional

#### Preconditions:
- Driver arrived at delivery location
- Customer present and ready to receive cargo
- Mobile app navigation showing delivery location
- Delivery form loaded
- Signature capture interface available
- Camera for photo capture (optional)

#### Test Steps:
1. Driver Marcus arrives at delivery location (Stop #3)
2. System displays: "Arrived at Stop #3 - 8:47 AM"
3. Marcus taps "Delivery Details"
4. System shows:
   - Customer: ABC Corporation
   - Address: 456 Oak Ave
   - Delivery: 2 pallets (Weight: 1,200 lbs)
   - Special Instructions: "Leave at loading dock"
5. Marcus completes delivery (unloads cargo, 23 minutes)
6. Customer ready to sign
7. Marcus taps "Complete Delivery"
8. System displays: "Get Customer Signature"
9. Marcus shows tablet to customer
10. System displays signature capture canvas:
    - Blank canvas (white background)
    - "Customer Signature" label
    - "Customer Name" field (optional)
    - "Clear" button to restart
11. Customer signs on tablet using finger
12. Customer completes signature in 10 seconds
13. System captures signature image
14. Marcus can review signature quality
15. Marcus confirms: "Signature looks good"
16. Marcus can add customer name (if not on file)
17. Marcus taps "Accept Signature"
18. System captures:
    - Signature image (stored as PNG)
    - Customer name (if provided)
    - Timestamp: 9:10 AM
    - GPS location: 456 Oak Ave
    - Photo of delivery (optional)
19. Marcus can take photo of completed delivery if needed
20. Marcus taps "Delivery Complete"
21. System uploads POD data:
    - Signature image
    - Timestamp
    - GPS location
    - Delivery photo (if captured)
22. Dispatcher receives: "Delivery #3 completed - POD received 9:10 AM"
23. Customer record updated with signature
24. System displays: "✓ Delivery Confirmed - Signature Received"

#### Expected Results:
- Delivery form displays complete information
- Signature capture interface responsive and intuitive
- Customer signature captured clearly
- Signature stored securely (encrypted)
- Timestamp accurate to delivery
- GPS location recorded
- Photo optional but available
- POD data uploaded successfully
- Dispatcher receives confirmation immediately
- Signature legally binding for delivery proof

#### Acceptance Criteria:
- [ ] Delivery form loads within 2 seconds
- [ ] Signature canvas responsive to touch
- [ ] Signature image resolution >300 DPI
- [ ] Signature stored with encryption
- [ ] Timestamp accurate to 1 second
- [ ] GPS location within ±20 meters
- [ ] POD upload within 10 seconds
- [ ] Dispatcher notification within 30 seconds
- [ ] Signature retrievable for dispute resolution
- [ ] Works on both iOS and Android tablets

#### Test Data:
- Customer: ABC Corporation
- Address: 456 Oak Ave
- Delivery: 2 pallets, 1,200 lbs
- Customer Signature: Test signature image
- Timestamp: 9:10 AM
- GPS: Delivery location coordinates
- Photo: Optional delivery photo

#### Mobile Emphasis:
- Test signature canvas responsiveness on tablet (vs phone)
- Test signature quality with various finger types
- Test with gloved hands (delivery drivers often wear gloves)
- Test signature storage efficiency
- Test photo capture integration
- Monitor battery impact of signature capture
- Test accessibility of signature acceptance
- Verify signature not transmitted in plaintext

---

### TC-DR-020: Mobile App Crash Recovery with Data Preservation

**TC ID**: TC-DR-020
**Test Name**: App Crash During Inspection - Data Recovery
**Related US/UC**: US-DR-001, UC-DR-007
**Priority**: High
**Test Type**: Mobile, Robustness, Recovery

#### Preconditions:
- Driver in middle of pre-trip inspection
- Inspection 60% complete (6 of 10 sections done)
- Photos captured (2 of 3)
- Voice notes recorded
- Device memory pressure causing instability
- App crashes suddenly

#### Test Steps:
1. Driver Marcus completing pre-trip inspection
2. Current progress: 6 sections complete, 4 remaining
3. Photos captured: 2 of 3
4. Voice notes: 1 recorded
5. [Device memory issue triggers]
6. App crashes unexpectedly
7. Marcus re-opens mobile app
8. System detects: App was terminated unexpectedly
9. System checks: Local SQLite database for unsaved data
10. System displays: "Recovery - Resuming inspection from 6 sections complete"
11. System recovers:
    - 6 completed sections and their data
    - 2 captured photos (full resolution from cache)
    - 1 voice note (audio file from local storage)
12. System prompts: "Resume inspection?"
13. Marcus confirms: "Yes, resume"
14. System displays inspection form at point of termination
15. Section 7 (Fluids) - next section to complete
16. Marcus can review completed sections:
    - Lights: ✓ Pass
    - Tires: ✓ Pass
    - Brakes: ✓ Pass
    - Cargo: ✓ Pass
    - Wipers: ✓ Pass
    - Controls: ✓ Pass
17. Marcus continues with remaining sections (7-10)
18. Marcus adds 3rd photo
19. Marcus adds voice note
20. Marcus completes inspection
21. System detects all data recovered: No loss of captured data
22. Marcus signs and submits inspection

#### Expected Results:
- App detects previous session state
- Unsaved data recovered from local database
- Photos and voice notes preserved
- Completed sections data intact
- Recovery prompt clear and actionable
- Driver can resume without reentering data
- No data corruption
- Inspection completes successfully
- All recovered data uploaded with submission

#### Acceptance Criteria:
- [ ] App crash detected and logged
- [ ] Local database recovery successful
- [ ] Completed sections preserved completely
- [ ] All photos recovered
- [ ] Voice notes recovered
- [ ] Recovery prompt appears within 5 seconds of restart
- [ ] Recovered data matches original entry
- [ ] No requirement for re-entry of completed sections
- [ ] Inspection can complete without re-starting
- [ ] Sync includes recovered data

#### Test Data:
- Inspection: Pre-trip (partial)
- Completed: 6 of 10 sections
- Photos: 2 captured (to be 3)
- Voice Notes: 1 recorded (to be 2)
- Crash Point: During section 7
- Recovery Data: ~10 MB (inspections + media)

#### Mobile Emphasis:
- Test on low-memory device (simulated memory pressure)
- Test data persistence across app termination
- Test recovery UI responsiveness
- Test on both iOS and Android
- Verify no data corruption
- Monitor recovery time
- Test accessibility of recovery prompt
- Verify all media files preserved

---

### TC-DR-021: Biometric Fallback to PIN When Fingerprint Fails

**TC ID**: TC-DR-021
**Test Name**: Biometric Signature Fallback to PIN
**Related US/UC**: US-DR-001, US-DR-002
**Priority**: High
**Test Type**: Mobile, Security, Functional

#### Preconditions:
- Driver at signature screen
- Biometric signature selected
- Biometric authentication fails multiple times
- PIN alternative available
- Device unlocked and ready

#### Test Steps:
1. Driver Jessica at signature screen (post-trip inspection)
2. System displays: "Place finger on sensor"
3. Jessica attempts fingerprint signature
4. Biometric attempt 1: Failed (no match detected)
5. System displays: "Try again"
6. Jessica attempts biometric signature
7. Biometric attempt 2: Failed (finger position wrong)
8. System displays: "Try again"
9. Jessica attempts biometric signature
10. Biometric attempt 3: Failed (insufficient contact)
11. System displays: "Maximum attempts failed"
12. System offers fallback options:
    - Retake biometric photo
    - Use stylus/finger drawing
    - PIN with verbal confirmation
13. Jessica taps: "PIN with verbal confirmation"
14. System displays: "Enter your 4-digit PIN"
15. Jessica enters: 1-2-3-4 (masked input)
16. System verifies PIN against stored hash
17. PIN matches in backend database
18. System prompts: "Please confirm your identity verbally"
19. Jessica speaks: "I confirm that I am Jessica approving this inspection"
20. System records verbal confirmation
21. System creates signature record:
    - Method: PIN + Verbal Confirmation
    - Timestamp: 5:47 PM
    - GPS Location: Depot
    - Device ID: [stored]
22. System displays: "✓ Signature captured via PIN and verbal confirmation"
23. System includes note: "Biometric unavailable - PIN fallback used"
24. Signature legally binding (with PIN + verbal confirmation)
25. Jessica taps "Submit Inspection"
26. Inspection submitted with fallback signature method noted

#### Expected Results:
- Biometric failures detected after 3 attempts
- Clear fallback options presented
- PIN alternative accessible
- Verbal confirmation adds security layer
- Signature legally binding via PIN method
- Fallback method documented in record
- All signature elements captured (PIN, confirmation, timestamp, GPS)
- Signature stored securely
- Audit trail includes fallback method

#### Acceptance Criteria:
- [ ] Biometric attempts limited to 3
- [ ] Fallback options clear and accessible
- [ ] PIN interface secure (masked input)
- [ ] PIN verification <1 second
- [ ] Verbal confirmation recorded
- [ ] Signature method documented
- [ ] Timestamp accurate
- [ ] GPS location within ±10 meters
- [ ] Signature legally compliant
- [ ] Audit trail complete

#### Test Data:
- Driver: Jessica (DR-003)
- PIN: 1-2-3-4 (test PIN)
- Verbal Confirmation: "I confirm that I am Jessica approving this inspection"
- Signature Context: Post-trip inspection
- GPS: Depot location
- Fallback Reason: Biometric device unavailable/failed

#### Mobile Emphasis:
- Test PIN entry security (masked display)
- Test verbal confirmation clarity
- Test on various device biometric sensors
- Test fallback responsiveness
- Monitor security of PIN storage
- Test accessibility of fallback options
- Verify no plaintext PIN in logs
- Test timeout for PIN entry

---

### TC-DR-022: Multi-Photo Capture with Annotation for Damage

**TC ID**: TC-DR-022
**Test Name**: Multi-Photo Damage Documentation with Annotation
**Related US/UC**: US-DR-008, UC-DR-001
**Priority**: High
**Test Type**: Mobile, Functional

#### Preconditions:
- Driver discovered vehicle damage
- Damage report form open
- Camera available and functional
- Annotation tools enabled
- GPS location tracking active
- Lighting conditions adequate

#### Test Steps:
1. Driver Tom discovers damage during inspection
2. Damage: Dent in cargo area floor
3. Tom taps "Report Damage"
4. System displays damage report form
5. Tom selects damage location on vehicle diagram: Cargo Area (floor)
6. Tom selects damage type: "Dent"
7. Tom selects severity: "Moderate"
8. System prompts: "Capture photos (1-10 photos)"
9. Tom taps camera icon to start photo capture
10. Photo 1 - Wide angle:
    - Tom captures full cargo area view
    - Shows dent in context of surrounding area
    - Resolution: 4032 x 3024 (12 MP)
11. System stores Photo 1: "Wide_Angle_001.jpg" (3.2 MB)
12. Tom taps "Next photo"
13. Photo 2 - Close-up:
    - Tom captures dent detail (close-up, ~2 feet)
    - Shows dent depth and edges clearly
    - Resolution: 4032 x 3024 (12 MP)
14. System stores Photo 2: "Closeup_001.jpg" (3.1 MB)
15. Tom taps "Next photo"
16. Photo 3 - Lighting angle:
    - Tom repositions for raking light (highlights dent edges)
    - Shows depth of dent clearly
    - Resolution: 4032 x 3024 (12 MP)
17. System stores Photo 3: "Raking_Light_001.jpg" (3.2 MB)
18. Tom completes photo capture: Taps "Done - 3 photos"
19. System displays photo gallery with thumbnails
20. Tom taps to review Photo 1
21. System enables annotation tools:
    - Drawing pen (various colors and widths)
    - Text labels
    - Measurement overlay
    - Pointer/arrow annotations
22. Tom draws arrow pointing to dent center
23. Tom adds text label: "Dent ~6 inches diameter"
24. Tom adds measurement: Dimension line showing ~6 inches
25. Tom saves annotation on Photo 1
26. Tom reviews Photos 2 and 3 (no annotation needed)
27. System displays damage summary:
    - Location: Cargo Area (floor)
    - Type: Dent
    - Severity: Moderate
    - Photos: 3 (1 annotated)
    - Estimated Cost: $500-$1,000
28. Tom adds note: "Dent occurred during loading - recommend repair"
29. Tom taps "Submit Damage Report"
30. System compresses photos for upload:
    - Photo 1: 3.2 MB → 1.2 MB (JPEG compression)
    - Photo 2: 3.1 MB → 1.1 MB
    - Photo 3: 3.2 MB → 1.1 MB
    - Annotations: Embedded in compressed images
31. System uploads all data with GPS and timestamp
32. Maintenance team receives damage report with annotated photos

#### Expected Results:
- Multi-photo capture interface responsive
- Photo quality maintained (minimum 2 MP)
- Annotation tools intuitive and functional
- Text labels readable on photos
- Drawing/arrow annotations clear
- Photo compression efficient (>60% reduction)
- Metadata preserved (timestamp, GPS, camera info)
- Damage estimate provided
- All photos stored and retrievable
- Maintenance team receives complete documentation

#### Acceptance Criteria:
- [ ] Photo capture within 3 seconds of tap
- [ ] Photo resolution minimum 2 MP
- [ ] Up to 10 photos supported
- [ ] Annotation tools responsive (<200ms)
- [ ] Text labels readable (min 12pt)
- [ ] Drawing precision within 5 pixels
- [ ] Photo compression >60% without quality loss
- [ ] GPS location accurate within ±10 meters
- [ ] Timestamp accurate to 1 second
- [ ] All photos retrievable for inspection

#### Test Data:
- Vehicle: #342
- Damage Location: Cargo Area (floor)
- Damage Type: Dent
- Severity: Moderate
- Photos: 3 (Wide, Close-up, Raking Light)
- Annotations: Arrow + text label
- Estimated Cost: $500-$1,000
- GPS: Vehicle location at time of report

#### Mobile Emphasis:
- Test photo capture on various screen sizes
- Test camera responsiveness on low-power device
- Test annotation tool responsiveness
- Test photo storage efficiency
- Test multi-touch gestures (pinch to zoom)
- Monitor battery impact during photo operations
- Test accessibility of annotation tools
- Verify photo EXIF data preservation

---

## Test Case Summary Statistics

### Distribution by Priority:
- **Critical**: 6 test cases (TC-DR-001, TC-DR-003, TC-DR-006, TC-DR-014, TC-DR-018, TC-DR-013)
- **High**: 14 test cases (TC-DR-002, TC-DR-004, TC-DR-005, TC-DR-007, TC-DR-008, TC-DR-009, TC-DR-010, TC-DR-011, TC-DR-012, TC-DR-017, TC-DR-019, TC-DR-020, TC-DR-021, TC-DR-022)
- **Medium**: 2 test cases (TC-DR-015, TC-DR-016)

### Distribution by Test Type:
- **Mobile**: 22 (100% - all tests emphasize mobile)
- **Functional**: 16
- **Offline/Sync**: 4
- **Integration**: 6
- **Security**: 3
- **Compliance**: 3
- **Robustness**: 1
- **Accessibility**: 2
- **Emergency**: 1

### Mobile Workflow Coverage:
- **Inspections (Pre/Post)**: 4 test cases
- **HOS Compliance**: 5 test cases
- **Offline Operation**: 3 test cases
- **Fuel Management**: 1 test case
- **Incident Reporting**: 2 test cases
- **Biometric Authentication**: 2 test cases
- **Damage Reporting**: 2 test cases
- **Messaging**: 1 test case
- **Navigation**: 1 test case
- **Proof of Delivery**: 1 test case

### Mobile Technology Emphasis:
- **Camera/Photo Capture**: 7 test cases
- **Voice Features**: 3 test cases
- **Biometric Authentication**: 2 test cases
- **GPS/Location Services**: 8 test cases
- **Offline Storage/Sync**: 4 test cases
- **Push Notifications**: 3 test cases
- **Digital Signature**: 5 test cases
- **Touch/Gesture Interaction**: 6 test cases

### Compliance Coverage:
- **FMCSA HOS Regulations**: 5 test cases
- **Electronic Signature (ESIGN)**: 5 test cases
- **DOT Inspection Requirements**: 2 test cases
- **Data Retention/Audit Trail**: 3 test cases

---

## Related Documents

- **User Stories**: `/docs/requirements/user-stories/02_DRIVER_USER_STORIES.md`
- **Use Cases**: `/docs/requirements/use-cases/02_DRIVER_USE_CASES.md`
- **Workflows**: `/docs/requirements/workflows/02_DRIVER_WORKFLOWS.md` (to be created)
- **Mobile Design**: `/docs/design/02_DRIVER_MOBILE_DESIGN.md` (to be created)
- **API Specifications**: `/api/driver-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | QA Team | Initial test cases created - 22 comprehensive tests |

---

## Test Execution Notes

### Environment Setup:
- QA Staging environment for backend
- Sandbox telematics system
- Mock GPS locations
- Test device fleet (iOS 14+, Android 8+)
- Offline simulation capability
- Network throttling tools (4G, LTE, 3G, 2G simulation)

### Test Sequence Recommended:
1. Priority Critical tests first (security/compliance/safety)
2. Mobile-specific tests with various network conditions
3. Offline scenario tests
4. Integration tests with backend systems
5. Recovery and error handling tests
6. Performance and battery impact tests

### Success Criteria:
- All Critical tests must pass before release
- 95%+ pass rate on High priority tests
- Mobile responsiveness <200ms for user interactions
- Offline operations without data loss
- Compliance audit trail complete and immutable

---

*This test case document provides comprehensive coverage of Driver role functionality with emphasis on mobile workflows, offline capabilities, and regulatory compliance.*
