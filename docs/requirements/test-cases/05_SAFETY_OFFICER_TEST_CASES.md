# Safety Officer - Test Cases

**Role**: Safety Officer
**Test Suite Version**: 1.0
**Date**: November 10, 2025
**Total Test Cases**: 25
**Coverage**: Incident Investigation, Video Telematics, Training Tracking, DOT Compliance

---

## Test Case Format Guide

| Field | Description |
|-------|-------------|
| **TC ID** | Test Case Identifier (TC-SO-XXX) |
| **Name** | Descriptive test case name |
| **Related US** | Linked User Story (US-SO-XXX) |
| **Related UC** | Linked Use Case (UC-SO-XXX) |
| **Priority** | Critical / High / Medium / Low |
| **Test Type** | Functional / Integration / Regression / Usability / Performance / Security |
| **Preconditions** | System state before test execution |
| **Test Steps** | Numbered sequence of actions |
| **Expected Results** | Outcomes after each step |
| **Acceptance Criteria** | Conditions that determine pass/fail |
| **Test Data** | Specific data required for test execution |

---

## Epic 1: Incident Investigation and Analysis

### TC-SO-001: Create and View Incident Report

**TC ID**: TC-SO-001
**Name**: Create and View Incident Report
**Related US**: US-SO-001 (Incident Report Management)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: Critical
**Test Type**: Functional

**Preconditions**:
- Safety Officer is logged in with valid credentials
- Incident management dashboard is accessible
- At least one reported incident exists in system
- Azure Blob Storage is operational

**Test Steps**:
1. Navigate to Safety Dashboard > Incidents tab
2. Verify incident list is displayed with columns: ID, Type, Severity, Status, Date, Driver, Vehicle
3. Click on first incident (INC-2025-0847)
4. Verify incident detail page loads with full information
5. Scroll through incident details verifying all sections are visible
6. Click "Begin Investigation" button
7. Verify investigation form appears with required fields
8. Verify 5 Whys template is visible and editable
9. Verify fishbone diagram builder is accessible
10. Verify document upload section is present

**Expected Results**:
- Step 2: Incident list displays all incidents with correct columns
- Step 4: Full incident details load within 2 seconds
- Step 6: Investigation form appears without errors
- Step 7: All form fields are editable and properly formatted
- Step 10: Upload section accepts PDF, JPG, PNG files

**Acceptance Criteria**:
- [x] Incident list loads within 3 seconds
- [x] All incident detail sections are visible without errors
- [x] Investigation form has all required fields per US-SO-001
- [x] Document upload validates file types correctly
- [x] No data loss when form is submitted
- [x] Incident status transitions to "Under Investigation"

**Test Data**:
```json
{
  "incident_id": "INC-2025-0847",
  "incident_type": "Collision - Rear-end",
  "severity": "Major",
  "location": "I-95 North, MM 47, Springfield, MA",
  "driver_id": "DRV-001",
  "driver_name": "John Smith",
  "vehicle_id": "VEH-455",
  "vehicle_model": "2022 Freightliner Cascadia",
  "timestamp": "2025-11-10T14:47:00Z",
  "status": "Reported"
}
```

---

### TC-SO-002: Upload and Store Supporting Documents

**TC ID**: TC-SO-002
**Name**: Upload and Store Supporting Documents
**Related US**: US-SO-001 (Incident Report Management)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: Critical
**Test Type**: Functional, Integration

**Preconditions**:
- Incident investigation is in progress
- User has edit permissions
- Azure Blob Storage is configured and accessible
- Test documents are prepared (PDF, JPG, PNG files)

**Test Steps**:
1. Open incident INC-2025-0847 in investigation mode
2. Scroll to "Supporting Documents" section
3. Click "Upload Document" button
4. Select police_report.pdf (2.5 MB file)
5. Verify file upload progress bar appears
6. Wait for upload to complete
7. Verify document appears in document list with metadata
8. Click "Upload Document" again
9. Select vehicle_damage_photo_1.jpg (4.2 MB file)
10. Select vehicle_damage_photo_2.jpg simultaneously (drag and drop)
11. Verify multi-file upload initiates
12. Wait for all uploads to complete
13. Verify all three documents appear with correct names and upload timestamps
14. Click on document to preview
15. Verify preview displays correctly (PDF viewer, image viewer)
16. Click download icon next to document
17. Verify file downloads to local system
18. Verify document metadata includes: filename, upload date, file size, uploader name

**Expected Results**:
- Step 5: Progress bar shows real-time upload status (0-100%)
- Step 7: Document appears immediately with correct metadata
- Step 13: All documents listed with correct file information
- Step 14: Preview opens without errors
- Step 17: File downloads with correct name and size
- Step 18: Metadata is complete and accurate

**Acceptance Criteria**:
- [x] All file types (PDF, JPG, PNG) upload successfully
- [x] File size validation prevents files >10 MB
- [x] Multi-file upload works without errors
- [x] Document preview works for all supported formats
- [x] Metadata is automatically captured and stored
- [x] Documents are encrypted in Azure Blob Storage
- [x] Download retains original file integrity
- [x] Access logging is maintained for compliance

**Test Data**:
```json
{
  "documents": [
    {
      "filename": "police_report.pdf",
      "size": "2.5MB",
      "type": "application/pdf",
      "upload_time": "2025-11-10T15:12:00Z"
    },
    {
      "filename": "vehicle_damage_photo_1.jpg",
      "size": "4.2MB",
      "type": "image/jpeg",
      "upload_time": "2025-11-10T15:13:15Z"
    },
    {
      "filename": "vehicle_damage_photo_2.jpg",
      "size": "3.8MB",
      "type": "image/jpeg",
      "upload_time": "2025-11-10T15:13:20Z"
    }
  ],
  "max_file_size": "10MB",
  "supported_types": ["pdf", "jpg", "jpeg", "png"]
}
```

---

### TC-SO-003: Create Incident Root Cause Analysis Using 5 Whys

**TC ID**: TC-SO-003
**Name**: Create Incident Root Cause Analysis Using 5 Whys
**Related US**: US-SO-001 (Incident Report Management)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Incident investigation is open
- 5 Whys template is available
- User has edit permissions
- All supporting documents are uploaded

**Test Steps**:
1. Open incident INC-2025-0847 in investigation mode
2. Locate "5 Whys Analysis" section
3. Click "Start Analysis" button
4. Verify analysis form appears with 5 input fields (Why 1 through Why 5)
5. Enter in "Why 1" field: "Why did collision occur?"
6. Enter in "Why 1 Answer" field: "Driver John struck stationary vehicle"
7. Click "Next Step" or Tab key to advance
8. Enter in "Why 2" field: "Why was vehicle stationary?"
9. Enter in "Why 2 Answer" field: "Traffic signal was red"
10. Continue through all 5 steps, entering analysis data
11. Verify root cause conclusion field is displayed
12. Enter root cause: "Sun glare from low angle position obscured brake light visibility"
13. Click "Save Analysis"
14. Verify success message appears
15. Reload page and verify analysis is persisted
16. Click "Generate Fishbone Diagram"
17. Verify fishbone diagram is created with categories: People, Process, Equipment, Environment
18. Verify all 5 Whys are mapped to diagram sections

**Expected Results**:
- Step 4: Form displays with all 5 input fields properly formatted
- Step 7: Navigation between steps works smoothly
- Step 13: Success message confirms save
- Step 15: Analysis data is preserved after page reload
- Step 17: Fishbone diagram generates without errors
- Step 18: All analysis factors are correctly mapped

**Acceptance Criteria**:
- [x] 5 Whys template has exactly 5 analysis levels
- [x] Each step requires both question and answer fields
- [x] Root cause conclusion field is mandatory
- [x] Analysis saves without data loss
- [x] Fishbone diagram generates automatically from 5 Whys data
- [x] Both text and visual analysis methods are available
- [x] Analysis can be edited after initial save
- [x] Audit trail tracks all changes with timestamps

**Test Data**:
```json
{
  "five_whys_analysis": {
    "why_1": "Why did collision occur?",
    "answer_1": "Driver John struck stationary vehicle",
    "why_2": "Why was vehicle stationary?",
    "answer_2": "Traffic signal was red",
    "why_3": "Why didn't John stop in time?",
    "answer_3": "Driver did not see brake light in time (reaction delay)",
    "why_4": "Why was there reaction delay?",
    "answer_4": "Glare from sun obscured brake light visibility",
    "why_5": "Why was sun glare a factor?",
    "answer_5": "Vehicle positioned in low sun angle position at 2:47 PM",
    "root_cause": "Sun glare from low angle position obscured brake light visibility",
    "timestamp": "2025-11-10T15:30:00Z"
  }
}
```

---

### TC-SO-004: Track Incident Status Transitions and Timeline

**TC ID**: TC-SO-004
**Name**: Track Incident Status Transitions and Timeline
**Related US**: US-SO-001 (Incident Report Management)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Incident INC-2025-0847 is in "Reported" status
- Investigation has been initiated
- Supporting documents uploaded
- Root cause analysis completed

**Test Steps**:
1. Open incident INC-2025-0847
2. Locate incident status indicator (currently shows "Reported")
3. Verify timeline view is accessible (should show: Reported → Under Investigation)
4. Click "Assign Investigation Team" button
5. Select "Mike Davis" (Dispatcher) from dropdown
6. Set due date to 7 days from today
7. Click "Assign" button
8. Verify assignment notification is sent (check in-app notification bell icon)
9. Verify status remains "Under Investigation"
10. Verify timeline now shows: Reported → Under Investigation (with assignment)
11. Click "Create Corrective Action" button
12. Enter corrective action: "Conduct refresher safety training on defensive driving"
13. Set responsible party to "John Smith" (driver)
14. Set due date to 30 days
15. Click "Save Corrective Action"
16. Verify timeline shows new corrective action item
17. Simulate corrective action completion (user would mark complete in 30 days)
18. Click status dropdown to transition to "Corrective Action in Progress"
19. Verify status changes and timeline updates
20. Click "Close Incident" button
21. Verify closure confirmation dialog appears
22. Verify final timeline shows all stages: Reported → Investigation → Corrective Action → Closed

**Expected Results**:
- Step 2: Status indicator shows current state clearly
- Step 8: Notification is sent to assigned user
- Step 10: Timeline updates with new status information
- Step 16: Corrective action appears in timeline with due date
- Step 22: Timeline displays complete incident lifecycle

**Acceptance Criteria**:
- [x] Incident statuses transition correctly: Reported → Under Investigation → Corrective Action → Closed
- [x] Timeline view shows all status changes with timestamps
- [x] Assignments trigger notifications to assigned users
- [x] Each timeline entry includes: action, timestamp, responsible party, status
- [x] Status transitions are validated (no invalid transitions allowed)
- [x] Previous statuses cannot be edited (audit trail integrity)
- [x] Incidents cannot be closed without completing corrective actions
- [x] Closure requires approval from Safety Officer

**Test Data**:
```json
{
  "incident_timeline": [
    {
      "event": "Incident Reported",
      "timestamp": "2025-11-10T14:47:00Z",
      "status": "Reported",
      "actor": "John Smith (Driver)",
      "description": "Rear-end collision at red light"
    },
    {
      "event": "Investigation Started",
      "timestamp": "2025-11-10T15:00:00Z",
      "status": "Under Investigation",
      "actor": "Safety Officer",
      "assigned_to": "Mike Davis"
    },
    {
      "event": "Corrective Action Created",
      "timestamp": "2025-11-10T15:30:00Z",
      "status": "Under Investigation",
      "actor": "Safety Officer",
      "corrective_action": "Refresher training",
      "due_date": "2025-12-10"
    },
    {
      "event": "Incident Closed",
      "timestamp": "2025-12-11T10:00:00Z",
      "status": "Closed",
      "actor": "Safety Officer",
      "closure_notes": "All corrective actions completed"
    }
  ]
}
```

---

### TC-SO-005: Assign Incident Investigation and Send Notifications

**TC ID**: TC-SO-005
**Name**: Assign Incident Investigation and Send Notifications
**Related US**: US-SO-001 (Incident Report Management)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: High
**Test Type**: Functional, Integration

**Preconditions**:
- Incident is in "Under Investigation" status
- Assigned user (dispatcher/manager) has valid email
- Notification system is operational
- Email service is configured

**Test Steps**:
1. Open incident INC-2025-0847
2. Click "Assign To" dropdown menu
3. Verify list of available assignees appears (filtered by role)
4. Select "Mike Davis" from list
5. Verify assignee is selected (name appears in field)
6. Set due date to 7 days from today using date picker
7. Enter assignment notes: "Review traffic conditions for this route and time"
8. Click "Send Assignment" button
9. Verify success message: "Assignment sent to Mike Davis"
10. Check inbox for notification email (verify contains: incident ID, assignment details, due date, notes)
11. Verify in-app notification appears in notification bell icon (shows "1" badge)
12. Click notification bell to open notification panel
13. Verify notification displays: "You have been assigned incident INC-2025-0847"
14. Verify timestamp shows assignment time
15. Open assigned incident from notification (click incident link)
16. Verify assigned user can see incident details and add comments/updates

**Expected Results**:
- Step 3: List shows only users with appropriate permissions (managers, dispatchers)
- Step 8: Success message confirms assignment
- Step 10: Email received within 30 seconds with all required information
- Step 13: In-app notification appears immediately
- Step 15: Assigned user can access and edit incident

**Acceptance Criteria**:
- [x] Assignment creates notification in both email and in-app channels
- [x] Assignee is restricted by role (only managers/dispatchers can be assigned)
- [x] Due date is mandatory and must be in future
- [x] Assignment notes are optional but recommended
- [x] Email includes: incident summary, assignment details, due date, action link
- [x] In-app notifications appear in real-time (within 5 seconds)
- [x] Notification includes direct link to incident
- [x] Assignment audit trail is maintained
- [x] Multiple reminder notifications sent at 3 days, 1 day before due date

**Test Data**:
```json
{
  "assignment": {
    "incident_id": "INC-2025-0847",
    "assigned_to": "Mike Davis",
    "assigned_by": "Safety Officer",
    "due_date": "2025-11-17",
    "assignment_notes": "Review traffic conditions for this route and time",
    "timestamp": "2025-11-10T15:45:00Z",
    "notification_sent": true,
    "email_sent": true,
    "assignee_email": "mike.davis@company.com"
  }
}
```

---

## Epic 2: Video Telematics and Accident Reconstruction

### TC-SO-006: Access and Review Incident Video Footage

**TC ID**: TC-SO-006
**Name**: Access and Review Incident Video Footage
**Related US**: US-SO-002 (Accident Reconstruction and Analysis)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: Critical
**Test Type**: Functional, Integration

**Preconditions**:
- Incident has associated vehicle with camera system
- Video footage is stored in secure video repository
- Video retention policy is active (minimum 30 seconds before/after incident)
- Security access controls are configured
- Incident timestamp is 2025-11-10T14:47:00Z

**Test Steps**:
1. Open incident INC-2025-0847 in detail view
2. Locate "Video Evidence" section
3. Verify "Pre-Incident Footage" is available (30 seconds before 14:47)
4. Verify "Incident Footage" is available (at 14:47)
5. Verify "Post-Incident Footage" is available (30 seconds after 14:47)
6. Click "Play Pre-Incident Footage" button
7. Verify video player loads with correct video
8. Verify video controls are available: play, pause, timeline, volume, fullscreen
9. Verify video duration shows approximately 30 seconds
10. Drag timeline slider to incident moment (14:47:00)
11. Verify synchronized telematics overlay appears on video
12. Verify overlay displays: speed, GPS coordinates, acceleration data, brake status
13. Click "Download Video" button
14. Verify download options appear: Original Format, Court-Admissible Format
15. Select "Court-Admissible Format" with metadata
16. Verify download includes: tamper-proof metadata, timestamp, GPS, speed, vehicle ID
17. Verify video file is encrypted during download
18. Verify chain-of-custody log entry is created

**Expected Results**:
- Step 6: Video loads within 5 seconds without buffering
- Step 8: All video controls are functional
- Step 12: Telematics data synchronizes with video playback
- Step 16: Metadata includes all required fields for legal admissibility
- Step 18: Chain-of-custody entry is timestamped and logged

**Acceptance Criteria**:
- [x] 30 seconds pre-incident and post-incident video is captured
- [x] Video player loads and plays without errors
- [x] Telematics data overlay is synchronized with video timeline
- [x] Video can be downloaded in court-admissible format
- [x] All downloads are logged with user, timestamp, and purpose
- [x] Metadata prevents tampering (tamper-proof format)
- [x] Video access is restricted to authorized users only
- [x] Audit trail tracks all video downloads and views
- [x] Video streaming uses encryption (HTTPS/TLS)
- [x] Video includes watermark with company branding (optional)

**Test Data**:
```json
{
  "video_evidence": {
    "incident_id": "INC-2025-0847",
    "vehicle_id": "VEH-455",
    "camera_id": "CAM-455-01",
    "incident_timestamp": "2025-11-10T14:47:00Z",
    "pre_incident_start": "2025-11-10T14:46:30Z",
    "incident_moment": "2025-11-10T14:47:00Z",
    "post_incident_end": "2025-11-10T14:47:30Z",
    "video_format": "H.264",
    "resolution": "1080p",
    "fps": 30,
    "total_duration": "60 seconds",
    "storage_location": "azure-blob-storage://fleet-videos/2025/11/10/...",
    "encryption": "AES-256"
  }
}
```

---

### TC-SO-007: Annotate Video with Markers and Notes

**TC ID**: TC-SO-007
**Name**: Annotate Video with Markers and Notes
**Related US**: US-SO-002 (Accident Reconstruction and Analysis)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Incident video is loaded and playing
- Video player supports annotation tools
- User has edit permissions on incident

**Test Steps**:
1. Open incident INC-2025-0847 video player
2. Locate annotation toolbar on video player
3. Click "Add Marker" button at 14:46:50 (approaching intersection)
4. Enter marker label: "Driver approaching red light"
5. Verify marker appears on timeline at correct timestamp
6. Click marker to edit and add color coding (red for critical event)
7. Click at 14:47:00 (moment of impact)
8. Click "Add Marker" button
9. Enter marker label: "Impact moment - collision occurs"
10. Set marker color to red (critical event)
11. Continue adding markers: 14:47:05, 14:47:15, 14:47:25
12. For each marker, add notes describing what's visible
13. Click "Draw/Highlight" annotation tool
14. Draw box around the vehicle that was struck to highlight in video
15. Add text annotation: "Vehicle struck - rear end damage visible"
16. Click "Add Text Annotation" tool
17. Click on video at specific location and enter: "Brake light not visible due to sun glare"
18. Verify all annotations are visible on timeline
19. Click "Save Annotations"
20. Verify success message: "Annotations saved"
21. Reload incident and verify annotations persist
22. Verify annotation summary displays all markers, highlights, and notes

**Expected Results**:
- Step 5: Marker appears at correct timestamp on timeline
- Step 12: Notes are associated with markers and visible on hover
- Step 15: Drawn highlight persists on video
- Step 20: Save confirmation received
- Step 22: All annotations are preserved after reload

**Acceptance Criteria**:
- [x] Markers can be added at any timestamp in video
- [x] Markers support color coding for severity/criticality
- [x] Each marker can have associated notes (up to 500 characters)
- [x] Drawing/highlighting tool allows visual annotation on video frames
- [x] Text annotations can be placed at specific coordinates
- [x] All annotations save without loss
- [x] Annotations persist across sessions
- [x] Annotation timeline shows all markers in chronological order
- [x] Annotations can be edited or deleted
- [x] Annotation history is maintained (audit trail)

**Test Data**:
```json
{
  "annotations": [
    {
      "annotation_id": "ANN-001",
      "type": "marker",
      "timestamp": "2025-11-10T14:46:50Z",
      "label": "Driver approaching red light",
      "color": "yellow",
      "notes": "Vehicle slowing down, traffic visible"
    },
    {
      "annotation_id": "ANN-002",
      "type": "marker",
      "timestamp": "2025-11-10T14:47:00Z",
      "label": "Impact moment - collision occurs",
      "color": "red",
      "notes": "Collision with stationary vehicle in same lane"
    },
    {
      "annotation_id": "ANN-003",
      "type": "highlight",
      "timestamp": "2025-11-10T14:47:00Z",
      "coordinates": {"x": 450, "y": 300, "width": 100, "height": 80},
      "label": "Vehicle struck - rear end damage visible"
    }
  ]
}
```

---

### TC-SO-008: View Synchronized Telematics Data with Video

**TC ID**: TC-SO-008
**Name**: View Synchronized Telematics Data with Video
**Related US**: US-SO-002 (Accident Reconstruction and Analysis)
**Priority**: High
**Test Type**: Functional, Integration

**Preconditions**:
- Incident video is loaded
- Telematics data is available for incident timestamp
- Video and telematics systems are synchronized
- GPS data is available

**Test Steps**:
1. Open incident INC-2025-0847 video player
2. Verify telematics overlay panel is visible on right side
3. Start video playback at pre-incident time (14:46:30)
4. Verify overlay shows telematics data that updates with video playback
5. Verify overlay displays: Speed (in mph/kph), GPS coordinates (latitude/longitude)
6. Verify overlay displays: Acceleration (g-forces), Brake status (on/off)
7. Verify overlay displays: Turn indicator, Heading direction
8. As video plays, verify telematics values change synchronously
9. At 14:46:45, verify speed shows ~45 mph (approaching intersection)
10. At 14:47:00 (impact), verify speed shows sudden drop
11. Verify acceleration shows negative value (deceleration/impact)
12. Verify brake status changes during impact sequence
13. Click on telematics data to view detailed metrics
14. Verify detailed view shows: precise speed values, acceleration curves, GPS accuracy
15. Click "View GPS Map" button
16. Verify map displays route with incident location marked
17. Verify map shows street view and traffic conditions
18. Verify street view shows intersection where collision occurred
19. Create data export of telematics for 60-second window
20. Verify export includes all telematics parameters with 10Hz sampling rate

**Expected Results**:
- Step 4: Overlay values update in real-time with video playback
- Step 8: Synchronization between video and telematics is exact (no lag)
- Step 11: Acceleration shows negative values during braking/impact
- Step 16: Map displays correct location with incident marker
- Step 20: Export includes complete telematics dataset

**Acceptance Criteria**:
- [x] Telematics data is synchronized with video playback (±100ms tolerance)
- [x] All key metrics are displayed: speed, acceleration, GPS, brake status
- [x] Data updates in real-time as video plays
- [x] Detailed metrics view provides precise values
- [x] GPS map integration shows incident location and route
- [x] Street view provides context for incident analysis
- [x] Telematics data can be exported for external analysis
- [x] Data export includes proper timestamp and sampling rate
- [x] Historical telematics data is preserved with 2-year retention
- [x] Telematics data includes forward/inward facing camera triggers

**Test Data**:
```json
{
  "telematics_data": [
    {
      "timestamp": "2025-11-10T14:46:30Z",
      "speed_mph": 35,
      "speed_kph": 56,
      "acceleration_g": 0.1,
      "latitude": 42.1015,
      "longitude": -71.3924,
      "heading": 45,
      "brake_status": false,
      "turn_indicator": false
    },
    {
      "timestamp": "2025-11-10T14:46:45Z",
      "speed_mph": 45,
      "speed_kph": 72,
      "acceleration_g": -0.2,
      "latitude": 42.1018,
      "longitude": -71.3920,
      "heading": 45,
      "brake_status": true,
      "turn_indicator": false
    },
    {
      "timestamp": "2025-11-10T14:47:00Z",
      "speed_mph": 15,
      "speed_kph": 24,
      "acceleration_g": -0.8,
      "latitude": 42.1020,
      "longitude": -71.3918,
      "heading": 45,
      "brake_status": true,
      "turn_indicator": false,
      "impact_detected": true
    }
  ]
}
```

---

### TC-SO-009: Generate Accident Reconstruction Report

**TC ID**: TC-SO-009
**Name**: Generate Accident Reconstruction Report
**Related US**: US-SO-002 (Accident Reconstruction and Analysis)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Incident investigation is complete
- Video evidence is reviewed and annotated
- Telematics data is analyzed
- Root cause analysis is documented
- Report generation system is operational

**Test Steps**:
1. Open incident INC-2025-0847 in investigation view
2. Scroll to bottom of investigation form
3. Click "Generate Accident Reconstruction Report" button
4. Verify report generation dialog appears with options
5. Select options: Include Video Evidence (checkbox), Include Telematics Charts (checkbox)
6. Select output format: PDF (default) or Word Document
7. Verify template selection shows: Detailed Analysis, Executive Summary
8. Select "Detailed Analysis" template
9. Click "Generate Report" button
10. Verify report generates and displays progress (generating report...)
11. Wait for report generation to complete (typically 30-60 seconds)
12. Verify report displays in preview window
13. Verify report includes sections:
    - Executive Summary
    - Incident Overview (date, time, location, parties involved)
    - Root Cause Analysis (5 Whys results)
    - Video Evidence Summary with thumbnails
    - Telematics Analysis (speed, acceleration charts)
    - Timeline of Events
    - Conclusions and Recommendations
14. Verify charts display correctly (speed over time, acceleration profile, GPS track)
15. Verify video evidence section includes: thumbnails, captions, incident markers
16. Click "Download Report" button
17. Verify PDF downloads with professional formatting
18. Verify report metadata includes: generation date, preparer name, incident ID, case number
19. Verify report can be opened in standard PDF reader
20. Verify document has security settings (printable, not editable)

**Expected Results**:
- Step 10: Report generation confirms with progress indicator
- Step 13: All required sections are present in report
- Step 14: Charts and visualizations render correctly
- Step 17: PDF downloads with proper formatting
- Step 20: Document security is enforced

**Acceptance Criteria**:
- [x] Report generates successfully with all incident data
- [x] Report includes video evidence with proper quality
- [x] Telematics data is presented in charts and graphs
- [x] Root cause analysis is clearly documented
- [x] Report is court-admissible format (PDF with metadata)
- [x] Report can be customized with company logo/branding
- [x] Report generation completes within 2 minutes
- [x] Multiple report templates are available
- [x] Report can be exported to Word/Excel for further editing
- [x] Report includes confidence/accuracy metrics for analysis

**Test Data**:
```json
{
  "report_config": {
    "incident_id": "INC-2025-0847",
    "template": "Detailed Analysis",
    "format": "PDF",
    "include_video": true,
    "include_telematics": true,
    "include_root_cause": true,
    "include_recommendations": true,
    "preparer": "Safety Officer",
    "generation_timestamp": "2025-11-10T16:00:00Z"
  }
}
```

---

## Epic 3: Driver Training and Certification Tracking

### TC-SO-010: Create and Assign Training Program

**TC ID**: TC-SO-010
**Name**: Create and Assign Training Program
**Related US**: US-SO-004 (Driver Safety Training Management)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Safety Officer is logged in
- Training management module is accessible
- Training content is available (videos, PDFs, quizzes)
- At least 5 drivers are in the system

**Test Steps**:
1. Navigate to Safety Dashboard > Training > Programs
2. Click "Create New Training Program" button
3. Verify training program creation form appears
4. Enter program name: "Defensive Driving Refresher 2025"
5. Enter description: "Annual defensive driving training for all drivers"
6. Select program type from dropdown: Safety Training (other options: Compliance, Skill-based, Hazmat)
7. Set target audience: "All CDL Drivers" (checkbox filter)
8. Select training content modules:
   - Module 1: "Hazard Recognition" (30 min video)
   - Module 2: "Defensive Driving Techniques" (45 min video)
   - Module 3: "Quiz: Defensive Driving" (10 question, 80% pass required)
9. Set due date: 30 days from today
10. Set reminder notifications: 30 days, 14 days, 7 days, 1 day
11. Enable auto-reminder emails (checkbox)
12. Click "Create Program" button
13. Verify program is created with status "Active"
14. Click "Assign to Drivers" button
15. Verify driver selection dialog appears
16. Apply filter: "Status = Active", "License Type = CDL"
17. Verify 23 drivers match criteria
18. Click "Select All" checkbox
19. Click "Assign Program to Selected Drivers" button
20. Verify assignment confirmation dialog appears
21. Confirm assignment by clicking "Assign" button
22. Verify success message: "Training assigned to 23 drivers"
23. Verify notification emails are queued
24. Open driver training status dashboard and verify program appears for all 23 drivers

**Expected Results**:
- Step 3: Creation form displays all required fields
- Step 12: Program is created successfully
- Step 22: Confirmation shows correct number of drivers assigned
- Step 24: All assigned drivers appear in training status dashboard

**Acceptance Criteria**:
- [x] Training program creation requires: name, description, content modules, due date
- [x] Programs can be assigned to individual drivers or groups
- [x] Group assignment supports filtering by driver type (CDL, non-CDL, hazmat)
- [x] Due date is mandatory and must be in future
- [x] Reminder notifications are configurable (multiple dates)
- [x] Program status shows: Active, Completed, Expired, Cancelled
- [x] Drivers cannot be assigned same program twice
- [x] Assignment creates audit trail with timestamp
- [x] Notification emails are sent to all assigned drivers
- [x] Auto-reminders send at configured intervals

**Test Data**:
```json
{
  "training_program": {
    "program_id": "TRN-2025-001",
    "program_name": "Defensive Driving Refresher 2025",
    "description": "Annual defensive driving training for all drivers",
    "program_type": "Safety Training",
    "target_audience": "All CDL Drivers",
    "created_date": "2025-11-10",
    "due_date": "2025-12-10",
    "status": "Active",
    "modules": [
      {
        "module_id": "MOD-001",
        "name": "Hazard Recognition",
        "type": "video",
        "duration_minutes": 30
      },
      {
        "module_id": "MOD-002",
        "name": "Defensive Driving Techniques",
        "type": "video",
        "duration_minutes": 45
      },
      {
        "module_id": "MOD-003",
        "name": "Quiz: Defensive Driving",
        "type": "quiz",
        "questions": 10,
        "pass_percentage": 80
      }
    ],
    "assigned_drivers": 23,
    "reminders": ["30 days", "14 days", "7 days", "1 day"]
  }
}
```

---

### TC-SO-011: Track Driver Training Completion and Scores

**TC ID**: TC-SO-011
**Name**: Track Driver Training Completion and Scores
**Related US**: US-SO-004 (Driver Safety Training Management)
**Priority**: High
**Test Type**: Functional, Integration

**Preconditions**:
- Training program "Defensive Driving Refresher 2025" is active
- Training is assigned to drivers
- Drivers can access training via mobile app or web portal
- At least 3 drivers have completed training

**Test Steps**:
1. Navigate to Training > Driver Status Dashboard
2. Verify dashboard displays all drivers and their training status
3. Verify columns: Driver Name, Training Program, Status, Start Date, Completion Date, Score, % Complete
4. Filter by Program: "Defensive Driving Refresher 2025"
5. Verify dashboard shows all 23 assigned drivers
6. Verify status indicators show:
   - "Not Started" (gray) for 12 drivers
   - "In Progress" (yellow) for 8 drivers
   - "Completed" (green) for 3 drivers
7. Click on "John Smith" (In Progress status, 40% complete)
8. Verify detail view shows:
   - Module 1: "Hazard Recognition" - Completed (30 min, 100%)
   - Module 2: "Defensive Driving Techniques" - In Progress (18 min / 45 min, 40%)
   - Module 3: "Quiz" - Not Started (0%)
9. Verify progress bar shows overall progress: 40%
10. Verify last accessed timestamp shows: "2025-11-10 10:45 AM"
11. Click on "Mike Davis" (Completed status)
12. Verify completion details show:
    - Start Date: 2025-11-05
    - Completion Date: 2025-11-08
    - All modules completed
    - Quiz score: 92/100 (92%, PASSED)
    - Time to complete: 2 hours 15 minutes
13. Verify completion certificate is available for download
14. Verify electronic signature and timestamp on certificate
15. Click "View Training Records" to export
16. Select export format: Excel
17. Verify export includes: driver name, program name, status, scores, completion date
18. Download and verify file contains all training data
19. Verify completion records are stored in audit-compliant database
20. Verify quiz attempts are tracked (number of attempts for scoring)

**Expected Results**:
- Step 5: Dashboard shows all 23 drivers
- Step 6: Status indicators display correctly with accurate counts
- Step 9: Progress percentage updates as driver completes modules
- Step 12: Completion details are accurate and timestamped
- Step 18: Export file contains all required training data

**Acceptance Criteria**:
- [x] Training status dashboard shows real-time progress for all drivers
- [x] Status categories: Not Started, In Progress, Completed, Overdue, Expired
- [x] Quiz scores are tracked with pass/fail threshold (80% pass required)
- [x] Multiple quiz attempts are allowed with highest score recorded
- [x] Completion certificates are automatically generated
- [x] Certificates include: program name, driver name, score, completion date, electronic signature
- [x] Training records can be exported in Excel format for audits
- [x] Completion data is retained for minimum 3 years (DOT compliance)
- [x] Training status can trigger dispatch holds if overdue
- [x] Email notifications sent on completion

**Test Data**:
```json
{
  "driver_training_status": [
    {
      "driver_id": "DRV-001",
      "driver_name": "John Smith",
      "program_id": "TRN-2025-001",
      "status": "In Progress",
      "percent_complete": 40,
      "start_date": "2025-11-07",
      "last_accessed": "2025-11-10T10:45:00Z",
      "modules": [
        {
          "module_id": "MOD-001",
          "status": "Completed",
          "progress": 100,
          "completion_time": "2025-11-07T14:30:00Z"
        },
        {
          "module_id": "MOD-002",
          "status": "In Progress",
          "progress": 40,
          "time_spent_minutes": 18
        }
      ]
    },
    {
      "driver_id": "DRV-002",
      "driver_name": "Mike Davis",
      "program_id": "TRN-2025-001",
      "status": "Completed",
      "percent_complete": 100,
      "start_date": "2025-11-05",
      "completion_date": "2025-11-08",
      "total_time_minutes": 135,
      "quiz_score": 92,
      "quiz_pass": true,
      "certificate_id": "CERT-2025-001"
    }
  ]
}
```

---

### TC-SO-012: Monitor Driver License and Certification Expiration

**TC ID**: TC-SO-012
**Name**: Monitor Driver License and Certification Expiration
**Related US**: US-SO-005 (Driver Certification and License Tracking)
**Priority**: Critical
**Test Type**: Functional, Integration

**Preconditions**:
- Driver credential system is operational
- OCR service is configured for document parsing
- At least 10 drivers have uploaded license documents
- Alert system is operational

**Test Steps**:
1. Navigate to Safety Dashboard > Credentials > Driver Licenses
2. Verify dashboard displays all drivers with license status
3. Verify columns: Driver Name, License #, Expiration Date, Status, Days Remaining, Actions
4. Sort by "Expiration Date" (ascending) to see soonest expirations
5. Verify status indicators:
   - "Compliant" (green) for licenses expiring >60 days
   - "Expiring Soon" (yellow) for licenses expiring 30-60 days
   - "Critical" (red) for licenses expiring <30 days
   - "Expired" (dark red) for expired licenses
6. Click on "Sarah Johnson" (expiring in 25 days)
7. Verify credential detail view shows:
   - License Type: CDL (Class A)
   - License #: A123456789
   - Issued Date: 2019-11-10
   - Expiration Date: 2025-12-05
   - Status: Expiring Soon
   - Days Remaining: 25
   - Endorsements: Tanker, Hazmat (verified)
8. Verify document section shows uploaded license image
9. Verify OCR extracted data: license number, expiration date, endorsements
10. Click "OCR Accuracy" link to verify extraction accuracy: 98%
11. Verify renewal reminder has been sent (2025-10-11, 60 days before expiration)
12. Verify system has created task: "Sarah Johnson - CDL Renewal Required"
13. Click "Upload Renewal Documents" button
14. Upload renewed license image file
15. System performs OCR on new document and extracts expiration date: 2027-11-09
16. Verify system updates license record with new expiration date
17. Verify status changes from "Expiring Soon" to "Compliant"
18. Click "MVR Check" button to request Motor Vehicle Record check
19. Verify system initiates MVR request to provider (HireRight)
20. Verify MVR results are received and flagged (e.g., "Clean" or violations listed)

**Expected Results**:
- Step 5: Status indicators display correctly based on expiration dates
- Step 8: Uploaded license document is visible
- Step 15: OCR accurately extracts expiration date from new license
- Step 16: Database updates with new expiration date
- Step 17: Status automatically updates based on new date
- Step 20: MVR results are received and displayed

**Acceptance Criteria**:
- [x] All driver licenses are tracked with expiration dates
- [x] Status indicators accurately reflect expiration timeline
- [x] OCR extraction has >95% accuracy for license documents
- [x] Automated alerts sent at 90, 60, 30 days before expiration
- [x] System prevents dispatch of drivers with expired credentials
- [x] Renewal documents can be uploaded and verified
- [x] MVR checks are conducted per policy (e.g., annually)
- [x] Compliance dashboard shows fleet-wide credential status
- [x] Credential history maintained for 3 years (DOT requirement)
- [x] Endorsements and restrictions are tracked (Tanker, Hazmat, etc.)

**Test Data**:
```json
{
  "driver_credential": {
    "driver_id": "DRV-003",
    "driver_name": "Sarah Johnson",
    "license_type": "CDL",
    "license_class": "A",
    "license_number": "A123456789",
    "issued_date": "2019-11-10",
    "expiration_date": "2025-12-05",
    "status": "Expiring Soon",
    "days_remaining": 25,
    "endorsements": ["Tanker", "Hazmat"],
    "restrictions": ["None"],
    "document_id": "DOC-2019-001",
    "ocr_accuracy": 98,
    "last_mvr_check": "2024-11-10",
    "next_mvr_check_due": "2025-11-10"
  }
}
```

---

### TC-SO-013: Manage DOT Driver Qualification Files

**TC ID**: TC-SO-013
**Name**: Manage DOT Driver Qualification Files
**Related US**: US-SO-005 (Driver Certification and License Tracking)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: High
**Test Type**: Functional, Compliance

**Preconditions**:
- Driver records are complete with required documents
- DOT file generation system is configured
- At least 5 drivers have all required documents

**Test Steps**:
1. Navigate to Safety Dashboard > Compliance > DOT Files
2. Verify list displays all drivers with DOT file status
3. Verify columns: Driver Name, Employee ID, Status, Last Updated, File Completeness, Actions
4. Verify status indicators:
   - "Complete" (green) - all required documents present
   - "Incomplete" (yellow) - missing documents
   - "Ready for Audit" (blue) - complete and recent
5. Click on "John Smith" (Complete status)
6. Verify DOT qualification file shows all required sections:
   - Application and Certification by Driver (Form needed)
   - Certificate of Road Test
   - Driver's License and Medical Certificate copies
   - Driver's Driving Record (MVR)
   - Previous Employment Records (if applicable)
   - Verification of Safe Driving Practices
7. Verify each document section shows: document name, date received, status (verified/pending)
8. Click "Generate DOT File Report" button
9. Verify report generation options appear
10. Select format: PDF (standard for DOT audits)
11. Click "Generate" button
12. Verify file generates with all required documents compiled
13. Download DOT file and verify PDF contains:
    - Driver name, address, DOT number
    - License expiration date
    - Medical card expiration date
    - MVR check date and results
    - Training records references
    - Incident history summary
14. Verify PDF is read-only and contains metadata: generated date, preparer name
15. Verify file can be printed for physical file retention
16. Click "Archive File" button to mark as stored
17. Verify archival date is recorded
18. Verify file is retained in system for minimum 3 years per DOT requirements
19. Navigate to DOT Compliance Report
20. Verify report shows: % of drivers with complete files, audit readiness status

**Expected Results**:
- Step 6: All required sections are present in DOT file
- Step 12: File generates without errors
- Step 13: PDF contains all required information
- Step 20: Compliance report shows accurate statistics

**Acceptance Criteria**:
- [x] DOT files include all 49 CFR Part 391 required documents
- [x] Files are complete, organized, and audit-ready
- [x] PDF generation includes all required information
- [x] Files can be exported for regulatory audits
- [x] File retention meets DOT requirement (3 years minimum)
- [x] System validates file completeness before marking ready for audit
- [x] File updates trigger re-validation
- [x] Archived files are immutable (cannot be edited)
- [x] Compliance dashboard tracks % of complete DOT files fleet-wide
- [x] Missing documents are flagged with due dates

**Test Data**:
```json
{
  "dot_file": {
    "driver_id": "DRV-001",
    "driver_name": "John Smith",
    "employee_id": "EMP-001",
    "dot_number": "4051234",
    "file_status": "Complete",
    "last_updated": "2025-11-01",
    "completeness_percent": 100,
    "documents": [
      {
        "doc_type": "Application and Certification",
        "date_received": "2023-11-01",
        "status": "Verified"
      },
      {
        "doc_type": "Road Test Certificate",
        "date_received": "2023-11-02",
        "status": "Verified"
      },
      {
        "doc_type": "License Copy",
        "date_received": "2025-10-15",
        "status": "Verified",
        "expires": "2025-12-05"
      },
      {
        "doc_type": "Medical Certificate",
        "date_received": "2025-08-20",
        "status": "Verified",
        "expires": "2027-08-20"
      }
    ]
  }
}
```

---

## Epic 4: Safety Compliance Monitoring

### TC-SO-014: Monitor DOT Compliance Status

**TC ID**: TC-SO-014
**Name**: Monitor DOT Compliance Status
**Related US**: US-SO-009 (DOT and FMCSA Compliance Management)
**Priority**: Critical
**Test Type**: Functional, Integration, Compliance

**Preconditions**:
- DOT compliance monitoring system is operational
- ELD system is integrated
- Driver qualification files are configured
- At least 20 drivers in system with current records
- SMS (Safety Measurement System) data feed is active

**Test Steps**:
1. Navigate to Safety Dashboard > Compliance > DOT Status
2. Verify compliance dashboard displays overall fleet DOT compliance score
3. Verify score is displayed prominently: "Fleet DOT Compliance: 94%"
4. Verify dashboard sections:
   - Overview (compliance score, trend)
   - Driver Qualification Files (% complete)
   - Hours of Service (HOS) - ELD Compliance
   - Vehicle Inspections (Annual Vehicle Inspections - AVI)
   - Drug Testing Program
   - Safety Violations & Incidents
5. Click on "Driver Qualification Files" section
6. Verify status shows: "23 of 25 complete (92%)"
7. Verify list shows which 2 drivers have incomplete files
8. Click on "Hours of Service" section
9. Verify ELD compliance status shows
10. Verify list shows any HOS violations from past 30 days: None detected
11. Click on "Vehicle Inspections" section
12. Verify annual inspection status shows vehicle-by-vehicle:
    - Vehicle #455: Valid, Expires 2025-12-15 (35 days remaining)
    - Vehicle #456: Valid, Expires 2025-11-25 (15 days remaining - ALERT)
    - Vehicle #457: Expired 2025-11-05 (OUT OF SERVICE)
13. Verify alert for expired inspection (Vehicle #457)
14. Click on "Drug Testing Program" section
15. Verify program status: "Random testing program active"
16. Verify testing records show:
    - Random tests scheduled: 5 per month minimum (randomized)
    - Post-accident tests: 2 conducted this month
    - Reasonable suspicion tests: 0 this month
    - Testing compliance rate: 100%
17. Click on "Safety Violations" section
18. Verify SMS (Safety Measurement System) score display:
    - BASIC Category: Unsafe Driving
    - Score: 85 (Scale 0-100, lower is better)
    - Percentile: 35th percentile (Fleet is better than 35% of carriers)
19. Click "Detailed SMS Analysis" button
20. Verify SMS BASIC categories displayed:
    - Unsafe Driving
    - Hours of Service Compliance
    - Vehicle Maintenance
    - Driver Fitness
    - Crash Indicator
21. Verify fleet trend chart shows compliance trend over last 12 months
22. Click "Generate DOT Compliance Report" button
23. Verify report generation options appear
24. Select "Pre-Audit Compliance Checklist"
25. Click "Generate" button
26. Verify report generates with all compliance categories
27. Download report and verify includes:
    - Overall compliance percentage
    - Status of each DOT requirement
    - Missing items requiring attention
    - Recommendations for improvement
    - Audit readiness assessment

**Expected Results**:
- Step 2: Overall compliance score is displayed prominently
- Step 6: Driver file completion percentage is accurate
- Step 12: Vehicle inspection status is current and alerts are shown
- Step 18: SMS score and percentile are displayed correctly
- Step 27: Report includes comprehensive compliance assessment

**Acceptance Criteria**:
- [x] Dashboard shows overall DOT compliance score (0-100%)
- [x] All major DOT compliance categories are monitored
- [x] Alerts are generated for non-compliance items (expired inspections, incomplete files)
- [x] ELD data is integrated for HOS compliance tracking
- [x] Vehicle inspection status is tracked with expiration alerts
- [x] Drug testing program compliance is monitored
- [x] SMS scores are updated from FMCSA data feed
- [x] Compliance reports can be generated for audits
- [x] System prevents dispatch of non-compliant drivers/vehicles
- [x] Compliance trend is tracked over time (12-month history)

**Test Data**:
```json
{
  "dot_compliance_status": {
    "overall_compliance_score": 94,
    "compliance_last_updated": "2025-11-10",
    "sections": {
      "driver_qualification_files": {
        "total_drivers": 25,
        "complete_files": 23,
        "completion_percent": 92
      },
      "hours_of_service": {
        "eld_compliant": true,
        "violations_30_days": 0
      },
      "vehicle_inspections": {
        "total_vehicles": 25,
        "valid_inspections": 24,
        "expired_inspections": 1,
        "out_of_service": ["VEH-457"]
      },
      "drug_testing": {
        "program_active": true,
        "random_tests_monthly": 5,
        "tests_conducted": 2,
        "compliance_rate": 100
      },
      "sms_score": {
        "unsafe_driving": 85,
        "hours_of_service": 72,
        "vehicle_maintenance": 68,
        "percentile": 35
      }
    }
  }
}
```

---

### TC-SO-015: Track and Report OSHA Compliance

**TC ID**: TC-SO-015
**Name**: Track and Report OSHA Compliance
**Related US**: US-SO-010 (OSHA Compliance and Workplace Safety)
**Priority**: High
**Test Type**: Functional, Compliance

**Preconditions**:
- OSHA incident tracking system is operational
- Incident classification categories are defined
- At least 5 workplace incidents have been recorded
- OSHA 300 Log form template is configured

**Test Steps**:
1. Navigate to Safety Dashboard > Compliance > OSHA
2. Verify dashboard displays OSHA tracking overview
3. Verify key metrics displayed:
   - TRIR (Total Recordable Incident Rate): 2.5
   - DART Rate (Days Away/Restricted/Transfer): 1.2
   - Lost Workday Case Rate: 0.8
   - Total Recordable Incidents (YTD): 5
   - Days Away Cases: 2
4. Verify year-over-year comparison chart
5. Verify current year metrics are better/worse than previous year
6. Click on "OSHA 300 Log" section
7. Verify incident log displays all recordable incidents:
   - Case #1: Sprained ankle (warehouse), 7/15/2025, 5 days away
   - Case #2: Back injury (delivery), 8/22/2025, 3 days away
   - Case #3: Cut (warehouse), 9/10/2025, First aid only
   - Case #4: Respiratory issue (maintenance), 10/5/2025, Restricted duty
8. Verify OSHA 300 Log table includes columns:
   - Case #, Employee, Date of Injury, Description, Days Away, Restricted Duty, Type of Illness
9. Click "Export OSHA 300 Log" button
10. Verify export format options: PDF, Excel
11. Select PDF format
12. Verify PDF export generates OSHA 300 form (standard format)
13. Download PDF and verify form contains:
    - Company name and location
    - Year (2025)
    - All recorded cases
    - Correct classification (Injury vs Illness)
14. Click "Generate OSHA 300A" button (for annual posting)
15. Verify 300A form is generated with summary data:
    - Total number of deaths: 0
    - Total recordable cases: 5
    - TRIR calculation: (5 * 200,000) / Employee hours = 2.5
16. Verify OSHA 300A includes establishment information
17. Click "Generate Annual Summary Report" button
18. Verify report summarizes year-to-date safety performance
19. Report includes recommendations for workplace safety improvement
20. Verify system maintains records in compliance with OSHA 29 CFR 1904

**Expected Results**:
- Step 3: All OSHA metrics display correctly
- Step 8: OSHA 300 Log includes all incidents with correct details
- Step 13: PDF form matches OSHA standard format
- Step 15: TRIR calculation is mathematically correct
- Step 19: Report includes actionable improvement recommendations

**Acceptance Criteria**:
- [x] OSHA incident tracking captures all recordable incidents
- [x] Incidents are correctly classified (Injury vs Illness)
- [x] TRIR and DART rates are calculated per OSHA formulas
- [x] OSHA 300 Log can be exported in standard format
- [x] OSHA 300A annual summary is generated automatically
- [x] Records are retained for minimum 5 years (OSHA requirement)
- [x] System prevents modification of closed incident records
- [x] Year-over-year trend comparison shows improvement/decline
- [x] Reports are audit-ready and DOT-compliant
- [x] System flags trends requiring safety intervention

**Test Data**:
```json
{
  "osha_tracking": {
    "trir": 2.5,
    "dart_rate": 1.2,
    "lost_workday_rate": 0.8,
    "total_recordable_incidents": 5,
    "incidents": [
      {
        "case_number": 1,
        "employee_name": "John Smith",
        "date_of_incident": "2025-07-15",
        "description": "Sprained ankle in warehouse",
        "type": "Injury",
        "days_away": 5,
        "restricted_duty": false,
        "recordable": true
      },
      {
        "case_number": 2,
        "employee_name": "Sarah Johnson",
        "date_of_incident": "2025-08-22",
        "description": "Back injury during delivery",
        "type": "Injury",
        "days_away": 3,
        "restricted_duty": false,
        "recordable": true
      }
    ]
  }
}
```

---

## Epic 5: Risk Assessment and Driver Coaching

### TC-SO-016: Calculate and Monitor Driver Safety Scores

**TC ID**: TC-SO-016
**Name**: Calculate and Monitor Driver Safety Scores
**Related US**: US-SO-006 (Driver Coaching and Performance Improvement)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Driver safety scoring system is configured
- Telematics data is available for drivers
- Incident history is complete
- Training records are current

**Test Steps**:
1. Navigate to Safety Dashboard > Drivers > Safety Scores
2. Verify driver list displays all active drivers with safety scores
3. Verify columns: Driver Name, Safety Score, Rank, Risk Tier, Trend, Last Updated
4. Verify scores range from 0-100 (higher is better)
5. Verify drivers are segmented into risk tiers:
   - Green (Low Risk): Scores 80-100 (2 drivers)
   - Yellow (Medium Risk): Scores 60-79 (8 drivers)
   - Orange (High Risk): Scores 40-59 (6 drivers)
   - Red (Critical Risk): Scores <40 (2 drivers)
6. Click on "John Smith" (Safety Score: 72, Medium Risk)
7. Verify score detail breakdown shows:
   - Incident History (25% weight): 85/100
   - Traffic Violations (20% weight): 60/100
   - Telematics Events (25% weight): 70/100
   - Training Completion (20% weight): 90/100
   - Coaching Effectiveness (10% weight): 55/100
   - Overall Score: 72
8. Verify chart shows score trend over last 90 days
9. Verify trend is upward (improving)
10. Click on "Telematics Events" section
11. Verify last 30 days of telematics events:
    - Harsh braking: 3 events
    - Speeding: 2 events
    - Following too close: 1 event
    - Distraction: 0 events
12. Click on "Mike Davis" (Safety Score: 38, Critical Risk)
13. Verify score breakdown shows multiple risk factors
14. Verify scores are color-coded by risk level
15. Verify trend shows declining score (decreasing)
16. Click "Recommend Coaching" button
17. Verify coaching recommendation workflow appears
18. Verify system suggests: "Urgent coaching needed - Critical Risk"
19. Click "Escalate to Management" button
20. Verify escalation email is sent to manager
21. Navigate to Safety Scores Summary Report
22. Verify report shows:
    - Overall fleet average safety score
    - Score distribution (% in each risk tier)
    - Top 5 drivers (highest scores)
    - Bottom 5 drivers (requiring intervention)
    - Trend analysis (improving vs declining)

**Expected Results**:
- Step 5: Drivers are correctly categorized into risk tiers
- Step 8: Score history displays trend chart
- Step 12: Critical risk drivers are highlighted
- Step 20: Escalation email is sent successfully
- Step 22: Summary report shows fleet-wide safety metrics

**Acceptance Criteria**:
- [x] Safety scores are calculated from multiple factors: incidents, violations, telematics, training
- [x] Scores range 0-100 with clear risk tier segmentation
- [x] Scores update daily based on new telematics/incident data
- [x] Historical trend is tracked (90-day minimum)
- [x] Critical risk drivers trigger automatic escalation alerts
- [x] Scoring formula is transparent and documented
- [x] Drivers can view their own scores and improve suggestions
- [x] Risk tier changes trigger notifications
- [x] Score improvements are recognized (gamification)
- [x] Executive dashboard shows fleet-wide safety score trends

**Test Data**:
```json
{
  "driver_safety_score": {
    "driver_id": "DRV-001",
    "driver_name": "John Smith",
    "overall_score": 72,
    "risk_tier": "Medium Risk",
    "last_updated": "2025-11-10",
    "score_components": {
      "incident_history": {
        "weight": 0.25,
        "score": 85,
        "factors": "2 incidents in past 12 months"
      },
      "traffic_violations": {
        "weight": 0.20,
        "score": 60,
        "factors": "1 speeding ticket in past 12 months"
      },
      "telematics_events": {
        "weight": 0.25,
        "score": 70,
        "factors": "3 harsh braking, 2 speeding events in past 30 days"
      },
      "training_completion": {
        "weight": 0.20,
        "score": 90,
        "factors": "All required training current"
      },
      "coaching_effectiveness": {
        "weight": 0.10,
        "score": 55,
        "factors": "1 coaching session, minimal improvement"
      }
    },
    "trend_90_days": "Improving (+5 points)",
    "last_incident": "2025-09-15"
  }
}
```

---

### TC-SO-017: Conduct Driver Coaching Session

**TC ID**: TC-SO-017
**Name**: Conduct Driver Coaching Session
**Related US**: US-SO-006 (Driver Coaching and Performance Improvement)
**Related UC**: UC-SO-001 (Manage and Investigate Fleet Incidents)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Driver has multiple safety concerns (harsh braking, speeding)
- Video clips of unsafe events are available
- Coaching templates are configured
- Driver and Safety Officer are available for scheduling

**Test Steps**:
1. Navigate to Safety Dashboard > Coaching > Schedule Session
2. Click "Create New Coaching Session" button
3. Verify coaching creation form appears
4. Select driver: "John Smith"
5. Select coaching reason: "Harsh Braking Events"
6. Verify system suggests video clips:
   - Clip 1: Harsh braking on I-95 North, 2025-11-08 at 14:32
   - Clip 2: Harsh braking on Route 128, 2025-11-09 at 10:15
7. Select both video clips to include in session
8. Select coaching template: "Defensive Driving - Braking Techniques"
9. Verify template includes:
   - Learning objectives
   - Discussion points
   - Video review sections
   - Q&A areas
10. Schedule session: Date 2025-11-15, Time 2:00 PM
11. Enter session notes: "Focus on anticipatory braking and speed management"
12. Click "Schedule Coaching Session" button
13. Verify confirmation: "Coaching session scheduled"
14. Verify calendar invitation sent to driver
15. Simulate coaching session (advance date to 2025-11-15)
16. Open session at scheduled time
17. Verify coaching interface displays:
    - Learning objectives for session
    - Video clips with timestamps
    - Coaching template guidance
    - Notes section for session observations
18. Watch video clip with driver (simulated)
19. Add coaching notes: "Driver acknowledged harsh braking issue. Discussed anticipatory braking technique."
20. Ask question to driver: "What could you have done differently?"
21. Record driver response: "I could have anticipated the traffic slow-down and reduced speed gradually."
22. Mark session complete
23. Click "Create Follow-up Action" button
24. Enter follow-up action: "Monitor for improvement in harsh braking events over next 30 days"
25. Click "Save Session"
26. Verify session is saved with all documentation
27. Navigate to coaching history and verify session appears
28. Verify electronic signature option for attendance confirmation
29. Verify coaching effectiveness tracking shows initial coaching completed

**Expected Results**:
- Step 3: Creation form displays all required fields
- Step 12: Session is scheduled successfully
- Step 26: All session details are saved
- Step 27: Session appears in driver's coaching history
- Step 29: Effectiveness tracking begins

**Acceptance Criteria**:
- [x] Coaching sessions can be scheduled with specific dates/times
- [x] Video clips of unsafe events can be selected and reviewed
- [x] Coaching templates provide structured guidance
- [x] Session notes document discussion and driver feedback
- [x] Follow-up actions track coaching effectiveness
- [x] Electronic attendance confirmation/signature available
- [x] Coaching records are audit-ready (timestamps, evidence)
- [x] Multiple coaching sessions can be tracked per driver
- [x] Coaching effectiveness is measured (behavioral change tracking)
- [x] Coaching ROI is calculated (incident reduction post-coaching)

**Test Data**:
```json
{
  "coaching_session": {
    "session_id": "COACH-001",
    "driver_id": "DRV-001",
    "driver_name": "John Smith",
    "coaching_topic": "Harsh Braking Events",
    "template": "Defensive Driving - Braking Techniques",
    "scheduled_date": "2025-11-15",
    "scheduled_time": "14:00",
    "video_clips": [
      {
        "clip_id": "VID-001",
        "event": "Harsh braking on I-95 North",
        "date": "2025-11-08",
        "time": "14:32",
        "severity": "High"
      },
      {
        "clip_id": "VID-002",
        "event": "Harsh braking on Route 128",
        "date": "2025-11-09",
        "time": "10:15",
        "severity": "Medium"
      }
    ],
    "coaching_notes": "Driver acknowledged harsh braking issue. Discussed anticipatory braking technique.",
    "follow_up_action": "Monitor for improvement in harsh braking events over next 30 days",
    "status": "Completed",
    "completion_date": "2025-11-15T14:45:00Z"
  }
}
```

---

### TC-SO-018: Generate Incident Trend Analysis Report

**TC ID**: TC-SO-018
**Name**: Generate Incident Trend Analysis Report
**Related US**: US-SO-003 (Incident Trend Analysis and Reporting)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- At least 12 months of incident history available
- Telematics harsh event data available
- Historical trend data is complete
- Analytics engine is operational

**Test Steps**:
1. Navigate to Safety Dashboard > Reports > Incident Trends
2. Click "Generate Trend Analysis Report" button
3. Verify report customization options appear
4. Select time period: "Last 12 months" (2024-11-10 to 2025-11-10)
5. Select incident types: All (Collision, Injury, Property Damage, Near-Miss, DOT Violation)
6. Select filters: None (fleet-wide analysis)
7. Select report details: Include Charts, Include Heat Map, Include Predictions
8. Click "Generate Report" button
9. Verify report generates with status message "Generating report..."
10. Wait for report generation (typically 30-60 seconds)
11. Verify report displays with sections:
    - Executive Summary
    - Incident Frequency Trends (daily/weekly/monthly/yearly)
    - Incident Distribution by Type
    - Incident Distribution by Severity
    - Top 10 High-Risk Drivers
    - Top 10 High-Risk Locations
    - Heat Map (visual geographic distribution)
    - Leading Indicators (near-misses, harsh events)
12. Verify frequency trend chart shows:
    - 45 total incidents in 12-month period
    - Monthly trend: 2.5 incidents/month average
    - Trend line showing variation (peak in summer months)
13. Verify incident type distribution pie chart:
    - Collisions: 30%
    - Near-Miss: 40%
    - Property Damage: 20%
    - Injuries: 10%
14. Verify High-Risk Drivers list shows top 3:
    - John Smith: 5 incidents
    - Mike Davis: 4 incidents
    - Sarah Johnson: 3 incidents
15. Verify High-Risk Locations heat map shows:
    - I-95 Corridor (highest density)
    - Route 128 junction (high density)
    - Downtown area (moderate density)
16. Verify heat map is color-coded (red = highest risk)
17. Verify Leading Indicators section shows:
    - Near-miss trend (increasing/decreasing)
    - Harsh event trend
    - Speeding violation trend
18. Click "Predictive Analytics" section
19. Verify prediction shows: "Drivers identified at elevated risk in next 30 days"
20. Verify predicted high-risk drivers are listed with risk percentage:
    - Driver A: 75% risk of incident
    - Driver B: 60% risk of incident
21. Verify report can be exported to PDF and Excel
22. Click "Download PDF" button
23. Verify PDF downloads with professional formatting
24. Verify PDF includes all charts, tables, and analysis
25. Click "Email Report" button
26. Verify report can be sent to management distribution list

**Expected Results**:
- Step 10: Report generates successfully within 2 minutes
- Step 12: Incident frequency data is accurate
- Step 20: Predictive risk scores are displayed
- Step 24: PDF includes all required information
- Step 26: Email option allows distribution to stakeholders

**Acceptance Criteria**:
- [x] Report captures all incidents within selected time period
- [x] Incident categorization by type and severity is accurate
- [x] Trend charts display historical patterns correctly
- [x] Heat map visualization shows geographic incident distribution
- [x] Top high-risk drivers are identified accurately
- [x] Leading indicators (near-misses, harsh events) are tracked
- [x] Predictive analytics identifies at-risk drivers
- [x] Report can be exported in PDF and Excel formats
- [x] Report generation completes within 3 minutes
- [x] Trend analysis includes comparison to previous periods
- [x] Industry benchmark comparison included (optional)

**Test Data**:
```json
{
  "incident_trend_analysis": {
    "period": "2024-11-10 to 2025-11-10",
    "total_incidents": 45,
    "average_per_month": 2.5,
    "incident_types": {
      "collisions": {"count": 14, "percent": 31},
      "near_miss": {"count": 18, "percent": 40},
      "property_damage": {"count": 9, "percent": 20},
      "injuries": {"count": 4, "percent": 9}
    },
    "top_drivers": [
      {"driver_name": "John Smith", "incidents": 5},
      {"driver_name": "Mike Davis", "incidents": 4},
      {"driver_name": "Sarah Johnson", "incidents": 3}
    ],
    "top_locations": [
      {"location": "I-95 Corridor", "incidents": 12},
      {"location": "Route 128 Junction", "incidents": 8},
      {"location": "Downtown Area", "incidents": 6}
    ]
  }
}
```

---

### TC-SO-019: Manage Safety Programs and Track ROI

**TC ID**: TC-SO-019
**Name**: Manage Safety Programs and Track ROI
**Related US**: US-SO-012 (Safety Program Management and ROI Tracking)
**Priority**: Medium
**Test Type**: Functional

**Preconditions**:
- Safety program database is operational
- Financial data (accident costs, insurance premiums) is available
- Baseline safety metrics are established
- Programs have been running for minimum 6 months

**Test Steps**:
1. Navigate to Safety Dashboard > Programs > Safety Initiatives
2. Click "Create New Program" button
3. Verify program creation form appears
4. Enter program name: "Driver Coaching Initiative 2025"
5. Enter description: "Intensive coaching for high-risk drivers to reduce incidents"
6. Set program type: "Driver Coaching"
7. Set program timeline: Start 2025-01-01, End 2025-12-31
8. Set program budget: $25,000 (staff time and resources)
9. Define program target: "Reduce incidents by 20%"
10. Define metrics to track:
    - Incident reduction (baseline: 45/year)
    - Cost savings (avoided accident costs, insurance savings)
    - Driver behavior improvement (telematics data)
    - Training completion rate
11. Set responsible party: "Safety Officer"
12. Click "Create Program" button
13. Verify program is created with status "Active"
14. Simulate program execution and data collection (advance to mid-year review)
15. Open program to view performance metrics
16. Verify program dashboard shows:
    - Program Status: Active
    - Start Date: 2025-01-01
    - Baseline Incidents: 45/year
    - YTD Incidents: 18 (on track for 36/year, 20% reduction achieved)
    - Estimated Cost Savings: $50,000 (avoided accident costs)
    - Program Cost: $12,500 (half-year spent)
    - Estimated ROI: 300% ((50,000 - 12,500) / 12,500)
17. Verify program metrics chart shows trend:
    - Incident reduction over time (declining trend)
    - Cost savings accumulation
    - ROI improvement
18. Click "Program Effectiveness" section
19. Verify effectiveness analysis shows:
    - Drivers coached: 8
    - Drivers showing improvement: 7 (87.5%)
    - Average safety score improvement: +12 points
    - Incident reduction rate: 20%
20. Click "Compare to Baseline" button
21. Verify comparison shows:
    - Baseline incidents (Jan-Jun 2024): 23
    - Current incidents (Jan-Jun 2025): 18 (22% reduction)
    - Baseline near-misses: 20
    - Current near-misses: 15 (25% reduction)
22. Click "Generate Program Report" button
23. Verify report options appear
24. Select "Executive Summary"
25. Click "Generate" button
26. Verify report generates showing:
    - Program objectives and timeline
    - Key metrics and results
    - ROI calculation
    - Participant feedback (optional)
    - Recommendations for continuation/expansion
27. Download report in PDF format
28. Verify report can be shared with management

**Expected Results**:
- Step 12: Program is created successfully
- Step 16: Program dashboard shows accurate metrics and ROI
- Step 20: Baseline comparison is correct
- Step 27: Report generates and downloads successfully

**Acceptance Criteria**:
- [x] Safety programs can be created with clear objectives and budget
- [x] Program metrics are tracked throughout duration
- [x] ROI is calculated: (Benefits - Costs) / Costs × 100%
- [x] Baseline and current metrics can be compared
- [x] Program effectiveness is measured against goals
- [x] Cost savings are tracked (avoided accident costs, insurance savings)
- [x] Participant engagement is measured
- [x] Program reports can be generated for stakeholders
- [x] Multiple programs can be tracked simultaneously
- [x] Program results inform future safety initiatives

**Test Data**:
```json
{
  "safety_program": {
    "program_id": "PRG-2025-001",
    "program_name": "Driver Coaching Initiative 2025",
    "program_type": "Driver Coaching",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "status": "Active",
    "budget": 25000,
    "baseline_incidents": 45,
    "ytd_incidents": 18,
    "incident_reduction_percent": 20,
    "estimated_cost_savings": 50000,
    "program_cost_ytd": 12500,
    "estimated_roi_percent": 300,
    "drivers_coached": 8,
    "drivers_improving": 7,
    "avg_safety_score_improvement": 12,
    "program_metrics": [
      {
        "metric": "Incident Reduction",
        "baseline": 45,
        "target": 36,
        "current": 18,
        "progress_percent": 60
      },
      {
        "metric": "Cost Savings",
        "baseline": 0,
        "target": 60000,
        "current": 50000,
        "progress_percent": 83
      }
    ]
  }
}
```

---

### TC-SO-020: Manage Fleet Risk Assessment

**TC ID**: TC-SO-020
**Name**: Manage Fleet Risk Assessment
**Related US**: US-SO-011 (Fleet Risk Assessment and Scoring)
**Priority**: High
**Test Type**: Functional

**Preconditions**:
- Risk assessment engine is operational
- Historical incident data is available
- Telematics data is available
- Driver profiles are complete

**Test Steps**:
1. Navigate to Safety Dashboard > Risk Management > Fleet Risk Assessment
2. Verify fleet risk dashboard displays:
   - Overall Fleet Risk Score: 65/100 (Medium Risk)
   - Risk Trend: Decreasing (improving)
   - Drivers by Risk Level (distribution chart)
3. Verify risk components shown:
   - Incident History Weight: 30%
   - Violation History Weight: 25%
   - Telematics Events Weight: 25%
   - Training & Certification Weight: 20%
4. Click "Driver Risk Tiers" section
5. Verify driver segmentation:
   - Low Risk (0-35%): 5 drivers
   - Medium Risk (35-65%): 12 drivers
   - High Risk (65-85%): 6 drivers
   - Critical Risk (85-100%): 2 drivers
6. Click on Critical Risk driver: "Mike Davis"
7. Verify risk profile shows:
   - Risk Score: 92%
   - Risk Factors:
     - 4 incidents in past 12 months (high)
     - 2 traffic violations (recent)
     - 15 harsh events in past 30 days (critical)
     - Missing training certifications (overdue)
8. Click "Risk Mitigation Plan" button
9. Verify system generates recommended interventions:
   - Immediate coaching (within 7 days)
   - Refresher training (within 30 days)
   - Temporary route restrictions (avoid high-risk routes)
   - Weekly safety check-ins
10. Click "Create Mitigation Plan" button
11. Accept recommended interventions
12. Set plan timeline: 90 days
13. Assign responsible party: Safety Manager
14. Click "Activate Plan" button
15. Verify plan is created and notifications sent to manager
16. Click on "Route Risk Analysis" section
17. Verify system identifies high-risk routes:
    - I-95 Corridor (North of Boston): High Risk
    - Downtown Area (congested): Medium Risk
    - Highway 128 (complex intersections): High Risk
18. Click on I-95 Corridor route
19. Verify route risk factors shown:
    - Accident history: 8 incidents in past 12 months
    - Traffic conditions: Heavy congestion during rush hours
    - Road conditions: Some hazardous stretches
    - Time of day analysis: Risk increases 4-6 PM
20. Verify recommendations: Assign experienced drivers, avoid peak hours
21. Click "Predictive Risk Model" section
22. Verify prediction shows drivers likely to have incidents in next 30 days:
    - Mike Davis: 85% probability
    - John Smith: 45% probability
    - Sarah Johnson: 30% probability
23. Click "Risk Score Improvement" to view historical trend
24. Verify improvement chart shows fleet risk declining over past 6 months
25. Verify improvement is correlated with coaching program implementation
26. Click "Export Risk Assessment" button
27. Verify export includes: Driver profiles, Risk scores, Recommendations, Program ROI
28. Download assessment in PDF format
29. Verify assessment can be used for insurance underwriting discussions

**Expected Results**:
- Step 2: Fleet risk score is displayed prominently
- Step 7: Critical risk driver profile is comprehensive
- Step 15: Mitigation plan is created and assigned
- Step 22: Predictive model identifies at-risk drivers
- Step 29: Assessment is export-ready for external parties

**Acceptance Criteria**:
- [x] Fleet risk score is calculated from multiple data sources
- [x] Drivers are segmented into risk tiers based on score
- [x] Critical risk drivers trigger automatic intervention recommendations
- [x] Risk mitigation plans can be created and tracked
- [x] Route risk analysis identifies high-risk corridors
- [x] Predictive model identifies drivers at elevated risk
- [x] Risk improvements are tracked and correlated with programs
- [x] Risk assessments can be exported for insurance/stakeholders
- [x] Risk scores update daily based on new data
- [x] Historical risk trends show improvement over time

**Test Data**:
```json
{
  "fleet_risk_assessment": {
    "overall_fleet_risk_score": 65,
    "risk_trend": "Decreasing",
    "risk_components": {
      "incident_history": {"weight": 0.30, "value": 60},
      "violation_history": {"weight": 0.25, "value": 55},
      "telematics_events": {"weight": 0.25, "value": 70},
      "training_certification": {"weight": 0.20, "value": 75}
    },
    "risk_tier_distribution": {
      "low_risk": 5,
      "medium_risk": 12,
      "high_risk": 6,
      "critical_risk": 2
    },
    "high_risk_routes": [
      {"route": "I-95 Corridor (North Boston)", "risk_level": "High", "incidents_12m": 8},
      {"route": "Highway 128", "risk_level": "High", "incidents_12m": 6},
      {"route": "Downtown Area", "risk_level": "Medium", "incidents_12m": 4}
    ]
  }
}
```

---

## Test Execution Summary

**Total Test Cases**: 20
**Coverage Areas**:
- Incident Investigation: TC-SO-001 to TC-SO-005 (5 cases)
- Video Telematics: TC-SO-006 to TC-SO-009 (4 cases)
- Driver Training: TC-SO-010 to TC-SO-013 (4 cases)
- Compliance Monitoring: TC-SO-014 to TC-SO-015 (2 cases)
- Risk Assessment & Coaching: TC-SO-016 to TC-SO-020 (5 cases)

**Test Environment Requirements**:
- Safety Officer role access
- Video telematics system integration
- Incident management database
- Training management system
- DOT compliance monitoring system
- OSHA tracking capability
- Telematics data pipeline
- Azure Blob Storage
- Email notification system
- Analytics/reporting engine

---

## Regression Test Checklist

- [ ] All incident statuses transition correctly
- [ ] Video footage loads without errors
- [ ] Telematics data synchronizes with video
- [ ] Documents upload and store securely
- [ ] Training completion tracking is accurate
- [ ] License expiration alerts trigger correctly
- [ ] DOT compliance scores are calculated correctly
- [ ] Safety scores update daily
- [ ] Coaching sessions are properly documented
- [ ] Reports generate in required formats
- [ ] Notifications are sent to appropriate recipients
- [ ] Audit trails are maintained for all changes
- [ ] Data exports maintain integrity
- [ ] System performance meets SLA (pages load <3 seconds)
- [ ] Mobile responsiveness works for critical functions (10% usage)

---

*Test Cases Created: November 10, 2025*
*Related Documents*:
- User Stories: `/users/andrewmorton/Documents/GitHub/Fleet/docs/requirements/user-stories/05_SAFETY_OFFICER_USER_STORIES.md`
- Use Cases: `/Users/andrewmorton/Documents/GitHub/Fleet/docs/requirements/use-cases/05_SAFETY_OFFICER_USE_CASES.md`
