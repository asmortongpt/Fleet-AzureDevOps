# OSHA + 3D Workflow Testing Guide

**Date:** November 9, 2025
**Purpose:** End-to-end testing of Virtual Garage 3D integration with OSHA Forms

---

## 🧪 Test Environment Setup

### Prerequisites
```bash
# 1. Database migration applied
psql -h localhost -U fleet_user -d fleet_db -f database/migrations/001_add_damage_reports.sql

# 2. API server running
cd api
npm install
npm run dev

# 3. Frontend dev server running
cd ..
npm install
npm run dev

# 4. TripoSR service available (optional for full 3D testing)
kubectl get pods -n fleet-management -l app=triposr
```

### Test Data Requirements
- At least 1 vehicle in database
- At least 1 driver in database
- Sample damage photos (JPG/PNG format)

---

## 📋 Test Cases

### TC-01: OSHA Form Creation with Photos

**Objective:** Verify OSHA forms can be created with photo attachments

**Steps:**
1. Navigate to OSHA Forms module from sidebar
2. Click "+ New Form" button
3. Fill in form details:
   - Form Type: "Incident"
   - Title: "Test Vehicle Damage Report"
   - Description: "Front bumper damage from parking incident"
   - Incident Date: Today's date
   - Location: "Main Parking Lot"
   - Severity: "Moderate"
   - Photos: Upload at least 1 damage photo
4. Click "Create Form"

**Expected Result:**
- ✅ Form created successfully
- ✅ Toast notification: "Form created successfully"
- ✅ Form appears in table with "Draft" status
- ✅ Photo count shown in form metadata

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-02: View in 3D Button Visibility

**Objective:** Verify Cube icon button appears only for forms with photos

**Steps:**
1. Navigate to OSHA Forms module
2. Locate the test form created in TC-01 (with photos)
3. Check Actions column for Cube icon
4. Create another form WITHOUT photos
5. Check Actions column for new form

**Expected Result:**
- ✅ Cube icon visible for form WITH photos
- ✅ Cube icon NOT visible for form WITHOUT photos
- ✅ Tooltip shows "View damage in 3D" on hover

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-03: Navigation to Virtual Garage

**Objective:** Verify clicking Cube icon navigates to Virtual Garage 3D viewer

**Steps:**
1. Navigate to OSHA Forms module
2. Find form with photos (TC-01)
3. Click Cube icon button in Actions column
4. Observe navigation

**Expected Result:**
- ✅ Page navigates to Virtual Garage module
- ✅ Toast notification shows: "Opening 3D viewer with X photos"
- ✅ Sidebar highlights "Virtual Garage 3D" menu item
- ✅ Page title shows "Virtual Garage 3D"

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-04: Virtual Garage 3D Viewer Load

**Objective:** Verify Virtual Garage component loads correctly

**Steps:**
1. Complete TC-03 to reach Virtual Garage
2. Wait for component to render
3. Check browser console for errors

**Expected Result:**
- ✅ 3D scene renders with garage floor
- ✅ Lighting visible (ambient + directional)
- ✅ Camera controls responsive (mouse drag to rotate)
- ✅ Stats panel visible with vehicle count
- ✅ No console errors related to Three.js

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

**Console Errors:** _____________

---

### TC-05: Procedural Vehicle Generation

**Objective:** Verify procedural 3D vehicles render correctly

**Steps:**
1. In Virtual Garage, use vehicle selector dropdown
2. Select different vehicle types: Sedan, SUV, Truck, Van
3. Observe 3D model changes

**Expected Result:**
- ✅ Vehicle model updates when selection changes
- ✅ Different vehicle types have different dimensions:
  - Sedan: Smaller, lower profile
  - SUV: Taller, wider
  - Truck: Longest, boxy shape
  - Van: Tallest, commercial look
- ✅ Vehicles have realistic materials (paint, windows, wheels)
- ✅ Smooth transitions between vehicle types

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-06: Photo Upload Interface

**Objective:** Verify damage photo upload functionality

**Steps:**
1. In Virtual Garage, locate photo upload area
2. Test drag-and-drop:
   - Drag a damage photo over upload zone
   - Drop the photo
3. Test click-to-upload:
   - Click "Browse" or upload area
   - Select photo from file dialog

**Expected Result:**
- ✅ Upload zone shows visual feedback on drag-over
- ✅ Photo preview appears after successful upload
- ✅ File name displayed
- ✅ Photo size/type validated
- ✅ Multiple photos can be uploaded
- ✅ Remove photo button works

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-07: Damage Report Form

**Objective:** Verify damage report creation form

**Steps:**
1. Upload at least 1 photo (TC-06)
2. Fill in damage report fields:
   - Description: "Front bumper dent and scratch"
   - Severity: "Moderate"
   - Location: "Front Left Corner"
3. Click "Submit Report"

**Expected Result:**
- ✅ Form fields validate required inputs
- ✅ Severity dropdown has options: minor, moderate, severe
- ✅ Submit button enabled only when required fields filled
- ✅ Loading state shown during submission

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-08: Damage Report API Integration (WITHOUT TripoSR)

**Objective:** Verify damage report saved to database

**Steps:**
1. Complete TC-07 (submit damage report)
2. Check network tab for API call
3. Query database directly:
   ```sql
   SELECT * FROM damage_reports ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Result:**
- ✅ POST request to `/api/damage-reports` returns 201 status
- ✅ Response includes damage report ID
- ✅ Database record created with correct data:
  - vehicle_id matches selected vehicle
  - damage_description matches input
  - damage_severity matches selection
  - photos array contains uploaded photo URLs
  - triposr_status = 'pending' (no TripoSR yet)
- ✅ Toast notification: "Damage report submitted successfully"

**Actual Result:** _____________

**Database Query Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-09: TripoSR Integration (REQUIRES TripoSR SERVICE)

**Objective:** Verify photo-to-3D conversion with TripoSR

**Prerequisites:**
- TripoSR service deployed and running
- Service health check passes:
  ```bash
  kubectl get pods -n fleet-management -l app=triposr
  curl http://triposr-service.fleet-management.svc.cluster.local:8000/
  ```

**Steps:**
1. Upload damage photo in Virtual Garage
2. Submit damage report
3. Observe TripoSR processing status
4. Wait for 3D model generation (1-2 seconds)

**Expected Result:**
- ✅ POST to TripoSR service succeeds
- ✅ task_id returned and stored in database
- ✅ triposr_status updates: pending → processing → completed
- ✅ GLB model URL returned
- ✅ 3D model loads in viewer
- ✅ Model shows uploaded photo transformed to 3D

**Actual Result:** _____________

**TripoSR Response:** _____________

**Status:** [ ] Pass [ ] Fail [ ] Skip (TripoSR not available)

---

### TC-10: 3D Model Viewer Controls

**Objective:** Verify 3D viewer interactive controls

**Steps:**
1. Load a 3D model (procedural or TripoSR-generated)
2. Test camera controls:
   - Left mouse button + drag: Rotate camera
   - Right mouse button + drag: Pan view
   - Mouse wheel scroll: Zoom in/out
3. Test auto-rotate:
   - Toggle auto-rotate checkbox
   - Observe vehicle rotation

**Expected Result:**
- ✅ Rotation smooth and responsive
- ✅ Pan allows viewing from different angles
- ✅ Zoom maintains center focus
- ✅ Auto-rotate toggles on/off correctly
- ✅ Camera limits prevent extreme angles
- ✅ Double-click resets camera position

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-11: Damage Reports List in Virtual Garage

**Objective:** Verify damage reports list displays correctly

**Steps:**
1. Create multiple damage reports (2-3)
2. Scroll to "Recent Damage Reports" section
3. Check report cards

**Expected Result:**
- ✅ Reports listed in reverse chronological order
- ✅ Each card shows:
  - Report ID (truncated UUID)
  - Severity badge with color coding
  - Description (truncated if long)
  - Timestamp
  - TripoSR status indicator
- ✅ Color coding by severity:
  - Minor: Blue/Info
  - Moderate: Yellow/Warning
  - Severe: Red/Destructive

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-12: Stats Dashboard

**Objective:** Verify statistics update correctly

**Steps:**
1. Note initial stats values
2. Create new damage report
3. Check stats update

**Expected Result:**
- ✅ Stats show correct counts:
  - Total Vehicles (from database)
  - Total Damage Reports (increments)
  - Pending 3D Models (when TripoSR available)
  - Active Inspections (from OSHA forms)
- ✅ Stats update in real-time after report submission

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-13: Round-Trip OSHA → 3D → OSHA

**Objective:** Verify complete workflow from OSHA form to 3D and back

**Steps:**
1. Create OSHA form with photos
2. Click Cube icon → navigate to Virtual Garage
3. Verify photos visible/accessible
4. Create damage report from photos
5. Navigate back to OSHA Forms
6. Find original form
7. Check if damage report linked

**Expected Result:**
- ✅ Seamless navigation between modules
- ✅ Data persists across navigation
- ✅ OSHA form and damage report linked via inspection_id
- ✅ User can access both views of same incident

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-14: Multi-Tenant Isolation

**Objective:** Verify tenant data isolation

**Prerequisites:**
- Multiple tenants in database
- Damage reports for different tenants

**Steps:**
1. Login as Tenant A user
2. Create damage report
3. Note damage report count
4. Logout and login as Tenant B user
5. Check damage reports list

**Expected Result:**
- ✅ Tenant A sees only their damage reports
- ✅ Tenant B sees only their damage reports
- ✅ API calls include tenant_id in queries
- ✅ Database queries filtered by tenant_id

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail [ ] Skip (single tenant setup)

---

### TC-15: Error Handling - No Photos

**Objective:** Verify error handling when clicking 3D button with no photos

**Steps:**
1. Create OSHA form WITHOUT photos
2. Attempt to access 3D view (should not be possible)
3. Verify Cube button not visible

**Expected Result:**
- ✅ Cube icon button NOT visible
- ✅ User cannot accidentally navigate to 3D view without photos

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-16: Error Handling - TripoSR Service Down

**Objective:** Verify graceful degradation when TripoSR unavailable

**Prerequisites:**
- TripoSR service stopped or unreachable

**Steps:**
1. Upload photo in Virtual Garage
2. Submit damage report
3. Observe behavior

**Expected Result:**
- ✅ Report still saved to database
- ✅ triposr_status = 'failed' or 'pending'
- ✅ User notified of 3D generation failure
- ✅ App continues functioning for other features
- ✅ Retry mechanism available

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail [ ] Skip (TripoSR available)

---

### TC-17: Performance - Large Photo Upload

**Objective:** Verify handling of large photo files

**Steps:**
1. Prepare large damage photo (5MB+)
2. Upload to Virtual Garage
3. Monitor performance

**Expected Result:**
- ✅ Upload progress indicator shown
- ✅ File size validated (max 10MB per API config)
- ✅ Error message for oversized files
- ✅ No browser freeze during upload
- ✅ Memory usage remains reasonable

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-18: Accessibility - Keyboard Navigation

**Objective:** Verify keyboard accessibility

**Steps:**
1. Use Tab key to navigate Virtual Garage interface
2. Test keyboard controls:
   - Tab through buttons
   - Enter to activate
   - Arrow keys for 3D camera (if implemented)

**Expected Result:**
- ✅ Logical tab order
- ✅ Focus indicators visible
- ✅ All interactive elements reachable
- ✅ ARIA labels present
- ✅ Screen reader compatible

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

### TC-19: Mobile Responsiveness

**Objective:** Verify 3D viewer works on mobile devices

**Steps:**
1. Access Virtual Garage on tablet/mobile
2. Test touch controls:
   - Pinch to zoom
   - Swipe to rotate
   - Two-finger pan
3. Check layout responsiveness

**Expected Result:**
- ✅ 3D scene renders on mobile
- ✅ Touch controls responsive
- ✅ UI elements not overlapping
- ✅ Performance acceptable
- ✅ Photo upload works on mobile

**Actual Result:** _____________

**Device Tested:** _____________

**Status:** [ ] Pass [ ] Fail [ ] Skip

---

### TC-20: Database Foreign Key Constraints

**Objective:** Verify foreign key relationships work correctly

**Steps:**
1. Create damage report linked to vehicle and inspection
2. Attempt to delete vehicle
3. Check damage report status

**Expected Result:**
- ✅ ON DELETE CASCADE from tenants works
- ✅ ON DELETE CASCADE from vehicles works
- ✅ ON DELETE SET NULL from drivers works
- ✅ Orphaned records handled gracefully
- ✅ Referential integrity maintained

**SQL Test:**
```sql
-- Create test data
INSERT INTO damage_reports (tenant_id, vehicle_id, damage_description, damage_severity)
VALUES ('test-tenant-id', 'test-vehicle-id', 'Test damage', 'minor');

-- Test cascade delete
DELETE FROM vehicles WHERE id = 'test-vehicle-id';

-- Verify damage report also deleted
SELECT * FROM damage_reports WHERE vehicle_id = 'test-vehicle-id';
-- Should return 0 rows
```

**Actual Result:** _____________

**Status:** [ ] Pass [ ] Fail

---

## 📊 Test Summary Report

### Overall Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-01: OSHA Form Creation | [ ] | |
| TC-02: Cube Button Visibility | [ ] | |
| TC-03: Navigation | [ ] | |
| TC-04: 3D Viewer Load | [ ] | |
| TC-05: Procedural Vehicles | [ ] | |
| TC-06: Photo Upload | [ ] | |
| TC-07: Damage Report Form | [ ] | |
| TC-08: API Integration | [ ] | |
| TC-09: TripoSR Integration | [ ] | |
| TC-10: 3D Controls | [ ] | |
| TC-11: Reports List | [ ] | |
| TC-12: Stats Dashboard | [ ] | |
| TC-13: Round-Trip Workflow | [ ] | |
| TC-14: Multi-Tenant | [ ] | |
| TC-15: Error - No Photos | [ ] | |
| TC-16: Error - Service Down | [ ] | |
| TC-17: Large Files | [ ] | |
| TC-18: Accessibility | [ ] | |
| TC-19: Mobile | [ ] | |
| TC-20: Foreign Keys | [ ] | |

### Statistics

- **Total Tests:** 20
- **Passed:** _____
- **Failed:** _____
- **Skipped:** _____
- **Success Rate:** _____%

### Critical Issues Found

1. _________________
2. _________________
3. _________________

### Recommendations

1. _________________
2. _________________
3. _________________

---

## 🐛 Bug Report Template

If you encounter issues during testing:

```markdown
### Bug Report

**Test Case:** TC-XX
**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
**Environment:** Development / Staging / Production

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**


**Actual Result:**


**Screenshots:**
[Attach here]

**Console Errors:**
```
[Paste errors here]
```

**Network Activity:**
[API calls, status codes]

**Browser/Device:**
Chrome 120 / Safari 17 / Mobile Android

**Additional Context:**

```

---

## 🔧 Troubleshooting Guide

### Issue: 3D Scene Not Rendering

**Possible Causes:**
- WebGL not supported by browser
- React Three Fiber not installed
- Three.js version mismatch

**Solutions:**
1. Check WebGL support: Visit `chrome://gpu`
2. Verify dependencies: `npm list @react-three/fiber three`
3. Check console for errors
4. Clear browser cache

---

### Issue: Photos Not Uploading

**Possible Causes:**
- File size too large
- Invalid file format
- Azure Blob Storage credentials

**Solutions:**
1. Check file size (max 10MB)
2. Verify file type: JPG, PNG, GIF
3. Check API logs for upload errors
4. Verify Azure Storage connection string

---

### Issue: Cube Button Not Appearing

**Possible Causes:**
- Form has no photos
- Photos array empty in database
- React state not updating

**Solutions:**
1. Verify `form.photos.length > 0`
2. Check database: `SELECT photos FROM safety_incidents WHERE id = 'form-id'`
3. Check React DevTools for form state
4. Refresh page to reload data

---

### Issue: TripoSR Not Generating Models

**Possible Causes:**
- Service not running
- Network connectivity
- Invalid photo format

**Solutions:**
1. Check service health: `kubectl get pods -l app=triposr`
2. Test endpoint: `curl http://triposr-service:8000/`
3. Check service logs: `kubectl logs -l app=triposr`
4. Verify photo is valid image file

---

## ✅ Sign-Off

**Tester Name:** _________________
**Date:** _________________
**Version Tested:** _________________
**Environment:** Development / Staging / Production

**Overall Assessment:**
[ ] Ready for Production
[ ] Needs Minor Fixes
[ ] Needs Major Fixes
[ ] Not Ready

**Signature:** _________________

---

**Last Updated:** November 9, 2025
**Document Version:** 1.0.0
