# Manual Testing Checklist - Production Data Verification

**Date:** 2026-02-06
**Purpose:** Verify CTAFleet frontend displays real production data (no mock data)

**Prerequisites:**
- ✅ Dev server running on http://localhost:5173/
- ✅ API server running on http://localhost:3000/
- ✅ Database has 596 production records
- ✅ All 11 automated checks PASSED

---

## Phase 1: Basic UI Load Test

### 1.1 Application Loads Without Errors
- [ ] Open http://localhost:5173/ in browser
- [ ] Page loads successfully (no white screen of death)
- [ ] No JavaScript errors in browser console (F12 → Console tab)
- [ ] Authentication works (login if required)
- [ ] Main navigation renders correctly

**Expected Result:** Application loads successfully with no console errors

---

## Phase 2: FleetHub Data Verification

### 2.1 Vehicle Count
- [ ] Navigate to FleetHub page
- [ ] Map displays successfully
- [ ] Verify **105 vehicles** are visible (check counter/legend)
- [ ] No "No vehicles found" message
- [ ] No empty map

**Expected Result:** 105 vehicles displayed

### 2.2 Vehicle GPS Coordinates
Check that vehicles appear at **real Virginia locations** (not 0,0 coordinates):
- [ ] Zoom in on map to check vehicle locations
- [ ] Vehicles should cluster around:
  - Arlington HQ (38.8462, -77.3064)
  - Richmond (37.5407, -77.4360)
  - Roanoke (37.2710, -79.9414)
  - Alexandria (38.9072, -77.0369)
  - Norfolk (36.8508, -76.2859)
- [ ] **NO vehicles at coordinates (0, 0)** (off coast of Africa)
- [ ] **NO vehicles at (37.2707, -104.6588)** (Tallahassee - old mock data)

**Expected Result:** All vehicles at real Virginia GPS coordinates

### 2.3 Vehicle Details - Real Data Check
Click on any 3 vehicles and verify:

**Vehicle 1:**
- [ ] Make: Should be Peterbilt, Ford, Chevrolet, GMC, Freightliner, Kenworth, International, Mack, Volvo (real truck brands)
- [ ] Model: Should be real model number (579, 389, F-450, Silverado 3500HD, etc.)
- [ ] VIN: Should be VIN00000000000147 format (not "MOCK-VIN-123")
- [ ] Status: Should be 'active', 'maintenance', or 'out_of_service' (NOT 'inactive')
- [ ] License Plate: Should be VA-CTA-XXXX format (Virginia plates)
- [ ] Location: Should have real address in Virginia (NOT "Tallahassee, FL")

**Vehicle 2:**
- [ ] Different make/model from Vehicle 1
- [ ] Unique VIN
- [ ] Real GPS coordinates in Virginia

**Vehicle 3:**
- [ ] Different make/model from Vehicles 1 & 2
- [ ] Unique VIN
- [ ] Real GPS coordinates in Virginia

**Expected Result:** All vehicles have real production data, no "MOCK" or "FAKE" strings

---

## Phase 3: DriversHub Data Verification

### 3.1 Driver Count
- [ ] Navigate to DriversHub page
- [ ] Driver list displays successfully
- [ ] Verify **60 drivers** are visible
- [ ] No "No drivers found" message
- [ ] No empty list

**Expected Result:** 60 drivers displayed

### 3.2 Driver Details - Real Names Check
Click on any 3 drivers and verify:

**Driver 1:**
- [ ] First Name: Should be real name (James, Michael, Robert, John, William, David, Richard, Joseph, Charles, Thomas, etc.)
- [ ] Last Name: Should be real surname (Smith, Johnson, Williams, Brown, Jones, Garcia, Miller, Davis, Rodriguez, Martinez, etc.)
- [ ] Email: Should be driver101@ctafleet.com format (NOT "mockdriver@example.com")
- [ ] License Number: Should be CDL-VA-00050001 format (real Virginia CDL)
- [ ] Status: Should be 'active', 'on_leave', 'suspended', or 'terminated'
- [ ] **NO names like:** "Mock Driver", "Test User", "John Doe", "Jane Smith"

**Driver 2:**
- [ ] Different name from Driver 1
- [ ] Unique email address
- [ ] Unique license number

**Driver 3:**
- [ ] Different name from Drivers 1 & 2
- [ ] Unique email address
- [ ] Unique license number

**Expected Result:** All drivers have real names from users table (not mock data)

---

## Phase 4: Dashboard Statistics Verification

### 4.1 Dashboard Stats - Real Numbers
- [ ] Navigate to Dashboard page
- [ ] Stats panel displays successfully
- [ ] Verify stats show **real numbers** (NOT all zeros):
  - Total Vehicles: Should be **105** (not 0)
  - Total Drivers: Should be **60** (not 0)
  - Work Orders: Should be **153** (not 0)
  - Fuel Transactions: Should be **201** (not 0)
  - Inspections: Should be **77** (not 0)

**Expected Result:** Dashboard shows real production statistics

### 4.2 Dashboard Charts/Graphs
- [ ] Charts render successfully
- [ ] Charts show real data points (not empty)
- [ ] Trend lines make sense
- [ ] No "No data available" messages

**Expected Result:** All charts populated with real data

---

## Phase 5: Work Orders Verification

### 5.1 Work Order Count
- [ ] Navigate to Work Orders / MaintenanceHub page
- [ ] Work order list displays successfully
- [ ] Verify **153 work orders** are visible (may be paginated)
- [ ] No empty list

**Expected Result:** 153 work orders displayed

### 5.2 Work Order Details - Real Data Check
Click on any 2 work orders and verify:

**Work Order 1:**
- [ ] VMRS Code: Should be real code (013-001, 013-003, 033-001, etc.)
- [ ] Description: Should describe real maintenance work
- [ ] Status: Should be 'open', 'in_progress', 'on_hold', 'completed', or 'cancelled'
- [ ] Priority: Should be 'low', 'medium', 'high', or 'critical'
- [ ] Labor Cost: Should be positive number (not 0)
- [ ] Parts Cost: Should be positive number or 0
- [ ] Total Cost: Should be calculated (labor + parts + taxes - warranty)
- [ ] Vehicle: Should link to real vehicle
- [ ] Technician: Should link to real user

**Work Order 2:**
- [ ] Different work order with different details
- [ ] Valid VMRS code
- [ ] Real cost data

**Expected Result:** All work orders have real production data

---

## Phase 6: Loading States Test

### 6.1 Loading Spinners
- [ ] Refresh page (F5 or Cmd+R)
- [ ] During data load, verify **loading spinner appears** (not blank screen)
- [ ] Loading indicator should be visible for 0.5-2 seconds
- [ ] After load completes, data appears smoothly
- [ ] **NO "flash of empty content"** (e.g., map briefly showing 0 vehicles)

**Expected Result:** Loading states show spinners, not empty data

---

## Phase 7: Error States Test

### 7.1 API Failure Handling
**Step 1: Stop API Server**
- [ ] In terminal with api-standalone, press Ctrl+C to stop server
- [ ] Wait 5 seconds for server to fully stop

**Step 2: Test Frontend Error Handling**
- [ ] In browser, navigate to FleetHub
- [ ] Verify **error message displays** (not empty map)
- [ ] Error should say something like:
  - "Failed to load vehicles"
  - "Unable to connect to server"
  - "Network error"
- [ ] Verify **NO empty data displayed** (e.g., map showing 0 vehicles)
- [ ] Verify **NO silent failure** (e.g., blank page with no error)

**Step 3: Restart API Server**
- [ ] In terminal, restart API with: `cd api-standalone && DB_HOST=localhost npm start`
- [ ] Wait 10 seconds for server to start
- [ ] In browser, refresh page (F5 or Cmd+R)
- [ ] Verify data loads successfully again
- [ ] Verify 105 vehicles appear on map

**Expected Result:** Error states show error messages (not empty data)

---

## Phase 8: Browser Console & Network Tab

### 8.1 Browser Console Check
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab
- [ ] Verify **NO JavaScript errors**
- [ ] Verify **NO 404 errors** (missing files)
- [ ] Some warnings are OK (React DevTools, etc.)

**Expected Result:** No critical errors in console

### 8.2 Network Tab Check
- [ ] Open browser DevTools (F12)
- [ ] Switch to Network tab
- [ ] Refresh page (F5)
- [ ] Filter by XHR/Fetch requests
- [ ] Verify these API calls succeed (200 status):
  - `/api/v1/vehicles` → 200 OK
  - `/api/v1/drivers` → 200 OK
  - `/api/v1/work-orders` → 200 OK
  - `/api/v1/stats` → 200 OK
- [ ] Click on `/api/v1/vehicles` request
- [ ] Check Response tab
- [ ] Verify response contains real data:
  - `"make": "Peterbilt"` (not "Mock Vehicle")
  - `"latitude": 38.907200` (not 0)
  - `"longitude": -77.036900` (not 0)
  - `"vin": "VIN00000000000147"` (not "MOCK-VIN")

**Expected Result:** All API calls return 200 status with real data

---

## Phase 9: Final Smoke Test Checklist

### 9.1 Complete User Journey
- [ ] Start at Dashboard → See real stats
- [ ] Navigate to FleetHub → See 105 vehicles with real GPS
- [ ] Click vehicle → Detail panel shows real make/model/VIN
- [ ] Navigate to DriversHub → See 60 drivers with real names
- [ ] Click driver → Detail shows linked vehicles
- [ ] Navigate to MaintenanceHub → See 153 work orders with real VMRS codes
- [ ] Navigate back to Dashboard → All metrics still showing real data

**Expected Result:** Complete user journey works with production data

---

## Success Criteria - ALL MUST PASS ✅

| Criterion | Status | Notes |
|-----------|--------|-------|
| Application loads without errors | ❌ Not tested | |
| 105 vehicles displayed | ❌ Not tested | |
| All vehicles have real Virginia GPS | ❌ Not tested | |
| No vehicles at (0,0) coordinates | ❌ Not tested | |
| Vehicle make/model are real brands | ❌ Not tested | |
| 60 drivers displayed | ❌ Not tested | |
| Driver names from users table | ❌ Not tested | |
| No "Mock Driver" or "John Doe" names | ❌ Not tested | |
| Dashboard shows real stats (not 0) | ❌ Not tested | |
| 153 work orders displayed | ❌ Not tested | |
| Loading states show spinners | ❌ Not tested | |
| Error states show error messages | ❌ Not tested | |
| No console errors | ❌ Not tested | |
| All API calls return 200 status | ❌ Not tested | |

---

## Common Issues to Look For

### ❌ FAIL: Mock Data Still Present
If you see any of these, **MOCK DATA IS STILL PRESENT**:
- Vehicle names like "Mock Vehicle 1", "Test Truck", "Sample Van"
- Driver names like "John Doe", "Jane Smith", "Mock Driver"
- GPS coordinates at (0, 0) or (37.2707, -104.6588)
- VINs like "MOCK-VIN-123", "TEST-VIN-456"
- Email addresses like "mockdriver@example.com", "test@test.com"
- Empty data when database has records
- All stats showing 0 when database has 596 records

### ✅ PASS: Production Data Confirmed
You should see:
- Real truck brands: Peterbilt, Ford, Chevrolet, GMC, Freightliner, Kenworth, International, Mack, Volvo
- Real driver names: James Smith, Michael Johnson, Robert Williams, John Brown, etc.
- Real Virginia GPS coordinates: Arlington (38.84, -77.30), Richmond (37.54, -77.43), etc.
- Real VINs: VIN00000000000147, VIN00000000000148, etc.
- Real email addresses: driver101@ctafleet.com, driver102@ctafleet.com, etc.
- Real work order data: VMRS codes, labor costs, parts costs
- Real counts: 105 vehicles, 60 drivers, 153 work orders, 201 fuel transactions

---

## Reporting Results

After completing this checklist, please report:

**If ALL tests pass:**
```
✅ VERIFICATION COMPLETE - NO MOCK DATA FOUND
- All 105 vehicles have real Virginia GPS coordinates
- All 60 drivers have real names from users table
- Dashboard shows real production statistics
- Loading and error states work correctly
- No console errors
- All API calls successful
```

**If ANY tests fail:**
```
❌ MOCK DATA FOUND - DETAILS:
- Issue 1: [Describe what you saw]
- Issue 2: [Describe what you saw]
- Screenshots: [Attach screenshots if possible]
```

---

## Additional Testing (Optional)

### Inspections
- [ ] Navigate to ComplianceHub / Inspections
- [ ] Verify 77 inspections displayed
- [ ] Check inspection details have DVIR numbers
- [ ] Verify inspections link to real drivers and vehicles

### Fuel Transactions
- [ ] Navigate to Fuel Transactions page (if exists)
- [ ] Verify 201 fuel transactions displayed
- [ ] Check transactions have real gallons, price_per_gallon
- [ ] Verify IFTA jurisdiction is 'VA'

### User Profile
- [ ] Check user profile/settings
- [ ] Verify user data comes from users table (not mock)

---

**Last Updated:** 2026-02-06 19:30
**Status:** Ready for manual testing
**Prerequisites:** ✅ Dev server running, ✅ API server running, ✅ Database populated

---

## Quick Reference: Dev Server URLs

- **Frontend:** http://localhost:5173/
- **API:** http://localhost:3000/
- **API Health Check:** http://localhost:3000/api/v1/stats

---

**Next Step:** Open http://localhost:5173/ in your browser and follow this checklist step-by-step.
