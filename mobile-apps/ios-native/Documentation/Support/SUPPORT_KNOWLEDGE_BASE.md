# Fleet Management iOS App - Support Knowledge Base

**Version:** 1.0
**Last Updated:** November 2025
**Platform:** iOS 14.0+

---

## Table of Contents

1. [Authentication & Login Issues](#authentication--login-issues)
2. [GPS & Location Tracking Issues](#gps--location-tracking-issues)
3. [OBD2 Connection Issues](#obd2-connection-issues)
4. [Data Synchronization Issues](#data-synchronization-issues)
5. [Camera & Photo Upload Issues](#camera--photo-upload-issues)
6. [Push Notifications Issues](#push-notifications-issues)
7. [Performance Issues](#performance-issues)
8. [Network Connectivity Issues](#network-connectivity-issues)
9. [App Crashes & Stability](#app-crashes--stability)
10. [Data & Privacy Issues](#data--privacy-issues)

---

## Authentication & Login Issues

### KB-001: Cannot Login - Invalid Credentials Error

**Symptoms:**
- Error message: "Invalid email or password"
- Login button becomes inactive after multiple attempts
- Unable to access account despite correct credentials

**Root Causes:**
- Incorrect email or password
- Account locked due to multiple failed attempts
- Network connectivity issues
- Backend authentication service unavailable
- Cached credentials expired

**Resolution Steps:**
1. **Verify Credentials:**
   - Check email address for typos
   - Ensure password is entered correctly (case-sensitive)
   - Try the "Show Password" toggle to verify input

2. **Reset Password:**
   - Tap "Forgot Password" link on login screen
   - Enter registered email address
   - Check email for password reset link (check spam folder)
   - Create new password following requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one number
     - At least one special character

3. **Check Network Connection:**
   - Ensure device has active internet connection
   - Try switching between Wi-Fi and cellular data
   - Test with other apps to verify connectivity

4. **Clear App Cache:**
   - Go to iOS Settings > Fleet Management
   - Tap "Clear Cache"
   - Restart the app
   - Try logging in again

5. **Contact Administrator:**
   - If issue persists, account may be locked
   - Contact fleet administrator to unlock account
   - Verify account is active and has correct permissions

**Prevention Tips:**
- Use password manager to store credentials securely
- Enable biometric authentication after first successful login
- Update password every 90 days as per security policy
- Avoid using public Wi-Fi for initial login

**Estimated Resolution Time:** 5-15 minutes
**Escalation Path:** If unresolved after 15 minutes, escalate to Tier 2 Support

---

### KB-002: Session Expires Too Quickly

**Symptoms:**
- Logged out unexpectedly during use
- "Session expired, please login again" message
- Token refresh failures in logs

**Root Causes:**
- Token expiration (default: 1 hour)
- Network interruption during token refresh
- Device time/date incorrect
- Backend token validation issues

**Resolution Steps:**
1. **Check Device Time Settings:**
   - Go to iOS Settings > General > Date & Time
   - Enable "Set Automatically"
   - Ensure correct timezone is selected

2. **Enable Background App Refresh:**
   - Go to iOS Settings > General > Background App Refresh
   - Enable for Fleet Management app
   - This allows token refresh when app is in background

3. **Check Network Stability:**
   - Ensure stable internet connection
   - Background token refresh requires connectivity
   - Use Wi-Fi when possible for better stability

4. **Re-authenticate:**
   - Log out completely from app
   - Close app completely (swipe up from app switcher)
   - Reopen app and login again
   - This generates fresh authentication tokens

5. **Update App:**
   - Check App Store for updates
   - Install latest version which may have token management fixes

**Prevention Tips:**
- Keep app updated to latest version
- Maintain stable network connection
- Enable biometric login for quick re-authentication
- Don't manually change device time/date

**Estimated Resolution Time:** 5 minutes
**Escalation Path:** If sessions expire within 5 minutes consistently, escalate to Tier 2

---

### KB-003: Biometric Authentication Not Working

**Symptoms:**
- Face ID or Touch ID prompt doesn't appear
- "Biometric authentication failed" error
- Falls back to password every time

**Root Causes:**
- Biometric authentication not enabled in app settings
- iOS biometric permissions denied
- Face ID/Touch ID not configured on device
- Keychain access issues

**Resolution Steps:**
1. **Verify iOS Biometric Setup:**
   - Go to iOS Settings > Face ID & Passcode (or Touch ID & Passcode)
   - Ensure Face ID or Touch ID is properly configured
   - Test with another app to verify it works

2. **Enable in App Settings:**
   - Open Fleet Management app
   - Go to Settings > Security
   - Enable "Use Face ID" or "Use Touch ID"
   - Authenticate once with password to enable

3. **Check App Permissions:**
   - Go to iOS Settings > Fleet Management
   - Verify app has permission to use Face ID/Touch ID
   - Enable if disabled

4. **Reset Biometric Data:**
   - In app: Settings > Security > Reset Biometric Login
   - Log out and log back in
   - Re-enable biometric authentication

5. **Clear Keychain Entry:**
   - If issue persists, uninstall and reinstall app
   - Note: This will clear all local data
   - Login and re-enable biometric authentication

**Prevention Tips:**
- Keep iOS updated to latest version
- Don't disable Face ID/Touch ID at system level
- Ensure app has latest updates

**Estimated Resolution Time:** 5-10 minutes
**Escalation Path:** If biometric auth fails after reinstall, escalate to Tier 2

---

## GPS & Location Tracking Issues

### KB-004: GPS Not Working - Location Services Disabled

**Symptoms:**
- "Location services disabled" message
- Cannot start trip tracking
- Map shows no location
- Location accuracy indicator shows "No Signal"

**Root Causes:**
- Location services disabled at iOS level
- Location permission denied for app
- GPS hardware issues
- Airplane mode enabled

**Resolution Steps:**
1. **Enable Location Services:**
   - Go to iOS Settings > Privacy > Location Services
   - Toggle Location Services ON (green)

2. **Grant App Permission:**
   - In Location Services, scroll to "Fleet Management"
   - Select "Always" (required for trip tracking)
   - Enable "Precise Location"

3. **Check Airplane Mode:**
   - Swipe down from top-right (or up from bottom)
   - Ensure Airplane Mode is OFF

4. **Restart Location Services:**
   - Toggle Location Services OFF, wait 10 seconds, toggle back ON
   - Restart device if issue persists

5. **Test GPS Signal:**
   - Go outdoors to open area
   - Wait 1-2 minutes for GPS to acquire satellites
   - Check if location appears on map

6. **Verify Background Location:**
   - Go to Settings > Fleet Management > Location
   - Ensure "Always" is selected (not "While Using")
   - This is critical for trip tracking

**Prevention Tips:**
- Always grant "Always" location permission
- Keep device GPS enabled
- Avoid using app in GPS-blocked areas (underground, tunnels)
- Ensure device has clear view of sky for best signal

**Estimated Resolution Time:** 5-10 minutes
**Escalation Path:** If GPS doesn't work after permissions granted, escalate to Tier 2

---

### KB-005: Inaccurate GPS Tracking - Location Jumps

**Symptoms:**
- Trip route shows irregular jumps
- Location jumps between points
- Distance calculations incorrect
- Speed readings unrealistic (e.g., 200 mph)

**Root Causes:**
- Poor GPS signal strength
- Interference from buildings/structures
- Multiple location sources conflicting
- Device GPS calibration issues
- Background location restrictions

**Resolution Steps:**
1. **Improve GPS Signal:**
   - Move to open area with clear sky view
   - Avoid starting trips in parking garages
   - Wait for "High Accuracy" indicator before starting trip

2. **Calibrate Compass:**
   - Open Apple Maps
   - Move device in figure-8 motion
   - This calibrates internal compass and GPS

3. **Check Location Settings:**
   - iOS Settings > Privacy > Location Services > Fleet Management
   - Ensure "Precise Location" is enabled
   - Verify "Always" permission is granted

4. **Disable Wi-Fi Scanning (if applicable):**
   - While using GPS, disable Wi-Fi if causing interference
   - iOS Settings > Wi-Fi > OFF (temporarily)

5. **Reset Location & Privacy:**
   - iOS Settings > General > Transfer or Reset iPhone
   - Reset > Reset Location & Privacy
   - Re-grant permissions to Fleet Management app

6. **Update App:**
   - Check for app updates that may improve GPS accuracy
   - Latest versions include enhanced filtering algorithms

**Prevention Tips:**
- Start trips outdoors when possible
- Allow GPS to stabilize (30-60 seconds) before driving
- Keep device firmware updated
- Avoid phone cases that block GPS antenna
- Monitor battery level (low battery can reduce GPS accuracy)

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If accuracy doesn't improve in open areas, escalate to Tier 2

---

### KB-006: Background Location Tracking Stops

**Symptoms:**
- Trip stops recording after app backgrounds
- Partial trip data only
- "Trip ended unexpectedly" message
- Gap in trip timeline

**Root Causes:**
- Location permission set to "While Using" instead of "Always"
- Background App Refresh disabled
- Low Power Mode enabled
- iOS limiting background location access
- App terminated by system

**Resolution Steps:**
1. **Verify "Always" Permission:**
   - iOS Settings > Privacy > Location Services > Fleet Management
   - Must show "Always" (not "While Using")
   - Re-select "Always" if needed

2. **Enable Background App Refresh:**
   - iOS Settings > General > Background App Refresh
   - Enable system-wide toggle
   - Enable for Fleet Management specifically

3. **Disable Low Power Mode:**
   - Low Power Mode restricts background activities
   - iOS Settings > Battery > Low Power Mode > OFF
   - Or disable from Control Center

4. **Check Battery Settings:**
   - iOS Settings > Battery
   - Scroll to Fleet Management
   - Ensure not showing "Background Activity: Restricted"

5. **Keep App Active:**
   - Leave app screen active while driving (use car mount)
   - Or keep app in foreground by returning to it periodically
   - This prevents iOS from suspending background tasks

6. **Update iOS:**
   - iOS 14.5+ has improved background location
   - Update to latest iOS version if available

**Prevention Tips:**
- Always select "Always" for location permission
- Disable Low Power Mode during trips
- Keep app updated
- Charge device during long trips
- Use location permission prompts carefully

**Estimated Resolution Time:** 5 minutes
**Escalation Path:** If background tracking still fails, escalate to Tier 2

---

## OBD2 Connection Issues

### KB-007: Cannot Find OBD2 Device

**Symptoms:**
- "No OBD2 device found" error
- Scanning never finds device
- Empty device list after scan
- Scan times out after 15 seconds

**Root Causes:**
- OBD2 adapter not plugged in
- Vehicle ignition not in ON position
- Bluetooth disabled on device
- OBD2 adapter incompatible
- Adapter not paired with iPhone

**Resolution Steps:**
1. **Verify OBD2 Adapter Installation:**
   - Locate OBD2 port (usually under dashboard, driver side)
   - Ensure adapter is fully inserted into port
   - Look for LED lights on adapter indicating power

2. **Turn Vehicle Ignition ON:**
   - Turn key to ON position (or press Start without brake)
   - Engine doesn't need to run, but ignition must be ON
   - OBD2 port only powered when ignition is ON

3. **Enable Bluetooth:**
   - iOS Settings > Bluetooth > ON
   - Don't pre-pair adapter in iOS Settings
   - Let the app handle pairing

4. **Check Adapter Compatibility:**
   - Supported adapters: ELM327 Bluetooth (v1.5 or higher)
   - Wi-Fi adapters NOT supported
   - Cheap clone adapters may not work properly

5. **Reset OBD2 Adapter:**
   - Unplug adapter from vehicle
   - Wait 10 seconds
   - Plug back in and wait for LED to indicate ready
   - Try scanning again in app

6. **Move Closer:**
   - Bluetooth range ~30 feet
   - Ensure phone is inside vehicle during scan
   - Metal vehicle body can reduce signal strength

**Prevention Tips:**
- Use certified ELM327 v1.5 or higher adapters
- Keep adapter plugged in when vehicle not in use
- Document adapter MAC address for troubleshooting
- Test adapter immediately after purchase

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If compatible adapter not found after reset, escalate to Tier 2

---

### KB-008: OBD2 Connection Keeps Dropping

**Symptoms:**
- "Device disconnected unexpectedly" error
- Connection drops every few minutes
- Data stops updating mid-trip
- Must reconnect repeatedly

**Root Causes:**
- Poor Bluetooth signal strength
- Adapter overheating
- Low adapter firmware quality
- Electrical interference
- Phone Bluetooth issues
- Multiple devices trying to connect

**Resolution Steps:**
1. **Improve Signal Strength:**
   - Keep phone within 10 feet of adapter
   - Don't put phone in glove compartment or trunk
   - Remove phone case if very thick

2. **Check Adapter Temperature:**
   - OBD2 adapters can overheat
   - Touch adapter (carefully) to check temperature
   - If very hot, unplug for 5 minutes to cool
   - Consider adapter with better heat dissipation

3. **Reduce Bluetooth Interference:**
   - Disconnect other Bluetooth devices (headphones, etc.)
   - Disable Wi-Fi temporarily
   - Move phone away from other electronics

4. **Reset Bluetooth Connection:**
   - In app: Settings > OBD2 > Forget Device
   - iOS Settings > Bluetooth > Forget device
   - Restart app and re-scan for adapter

5. **Update Adapter Firmware (if possible):**
   - Some adapters support firmware updates
   - Check manufacturer website for updates
   - Follow update instructions carefully

6. **Try Different Adapter:**
   - If issue persists, adapter may be faulty
   - Test with known-good adapter
   - Consider upgrading to higher-quality adapter

**Prevention Tips:**
- Use quality ELM327 adapters from reputable brands
- Keep adapter firmware updated
- Monitor adapter temperature during long trips
- Limit other Bluetooth connections while using OBD2
- Position phone optimally in vehicle

**Estimated Resolution Time:** 15-20 minutes
**Escalation Path:** If dropouts continue with multiple adapters, escalate to Tier 2

---

### KB-009: OBD2 Data Not Updating

**Symptoms:**
- Connected to adapter but no data
- RPM, speed, etc. show "---" or zero
- "Initialization failed" error
- Data frozen at old values

**Root Causes:**
- Vehicle not fully initialized
- OBD2 protocol mismatch
- Adapter not communicating with ECU
- Vehicle in accessory mode (not ON)
- Incompatible vehicle (pre-1996)

**Resolution Steps:**
1. **Verify Vehicle State:**
   - Engine should be running (not just ignition ON)
   - Let engine warm up 30 seconds before checking data
   - Ensure vehicle not in error state

2. **Re-initialize Connection:**
   - In app: Tap "Disconnect"
   - Wait 10 seconds
   - Tap "Connect" to re-establish connection
   - Initialization takes 5-10 seconds

3. **Check OBD2 Protocol:**
   - App auto-detects protocol, but may fail
   - In app: Settings > OBD2 > Advanced > Protocol
   - Try selecting protocol manually:
     - ISO 15765-4 CAN (most common for 2008+)
     - ISO 14230-4 KWP (older vehicles)
     - SAE J1850 PWM (Ford)
     - SAE J1850 VPW (GM)

4. **Test Basic PIDs:**
   - In app: OBD2 Diagnostics > Test Connection
   - This tests basic PIDs (0x01 0C - RPM)
   - If test fails, adapter can't communicate with ECU

5. **Check Vehicle Compatibility:**
   - All vehicles 1996+ (US) should support OBD2
   - Some hybrids/EVs have limited OBD2 support
   - European vehicles may use different protocols

6. **Verify Adapter Power:**
   - Check adapter LED indicators
   - Should show solid or blinking pattern
   - If no lights, port may not be powered

**Prevention Tips:**
- Always start engine before expecting data
- Document vehicle OBD2 protocol for future reference
- Test OBD2 connectivity before important trips
- Keep vehicle software/firmware updated

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If data never updates despite connection, escalate to Tier 2

---

### KB-010: Error Codes and DTC Issues

**Symptoms:**
- Cannot read diagnostic trouble codes (DTCs)
- "No codes found" when check engine light is on
- "Read failed" error
- Cannot clear codes after repair

**Root Causes:**
- Insufficient OBD2 permissions
- Adapter doesn't support Mode 03 (read DTCs)
- Vehicle hasn't set any pending codes yet
- Communication timing issues

**Resolution Steps:**
1. **Wait for Code Maturation:**
   - Check engine light may illuminate before codes are stored
   - Drive vehicle for 15-20 minutes
   - Try reading codes again

2. **Use Proper Read Function:**
   - In app: OBD2 Diagnostics > Read Codes
   - This reads both stored and pending codes
   - Takes 10-30 seconds to complete

3. **Check Adapter Capabilities:**
   - Not all cheap adapters support full DTC reading
   - Verify adapter supports OBD2 Mode 03 and 07
   - Check adapter documentation or test with other OBD2 apps

4. **Clear Codes Properly:**
   - Must read codes first before clearing
   - In app: OBD2 Diagnostics > Clear Codes
   - Confirm action in popup
   - Wait for "Codes cleared" confirmation
   - Note: This turns off check engine light

5. **Understand Code Types:**
   - **Stored Codes:** Confirmed issues
   - **Pending Codes:** Potential issues (one occurrence)
   - **Permanent Codes:** Cannot be cleared manually
   - Permanent codes clear automatically after fix is verified

6. **Verify Clear Success:**
   - After clearing, read codes again
   - Should show "No codes found"
   - Check engine light should turn off
   - If light returns immediately, issue not resolved

**Prevention Tips:**
- Read codes before clearing to document issue
- Take screenshot of codes for mechanic reference
- Don't clear codes before emissions testing
- Understand that clearing codes doesn't fix problems

**Estimated Resolution Time:** 10 minutes
**Escalation Path:** If adapter can't read codes on multiple vehicles, hardware issue - escalate to Tier 3

---

## Data Synchronization Issues

### KB-011: Data Not Syncing to Server

**Symptoms:**
- "Sync failed" error message
- Pending sync counter keeps increasing
- Data on web dashboard is outdated
- Offline indicator always showing

**Root Causes:**
- No internet connectivity
- Backend server unavailable
- Authentication token expired
- Sync queue corrupted
- Large data backlog

**Resolution Steps:**
1. **Check Internet Connection:**
   - Open Safari and visit any website
   - Check Wi-Fi or cellular data is enabled
   - Try switching between Wi-Fi and cellular
   - Look for "No Connection" indicator in app

2. **Force Sync:**
   - Pull down on any list screen to refresh
   - Or: Go to Settings > Sync > Sync Now
   - Watch for "Syncing..." indicator at top
   - Wait for completion (may take 1-2 minutes)

3. **Check Sync Queue:**
   - Go to Settings > Sync > View Queue
   - Shows pending items count
   - If very large (1000+), sync may take time
   - Clear old items if they're not needed

4. **Verify Authentication:**
   - If sync fails with 401 error, token expired
   - Log out and log back in
   - This refreshes authentication tokens
   - Try syncing again

5. **Clear Sync Queue (last resort):**
   - Settings > Sync > Advanced > Clear Queue
   - WARNING: This removes unsynced data
   - Only use if sync is permanently stuck
   - Ensure critical data is backed up first

6. **Check Server Status:**
   - Contact administrator to verify backend is operational
   - Check status page if available
   - Backend maintenance may be in progress

**Prevention Tips:**
- Enable automatic sync: Settings > Sync > Auto Sync
- Sync regularly when on Wi-Fi
- Don't accumulate large sync queues
- Monitor sync status indicator
- Keep app open longer to allow sync completion

**Estimated Resolution Time:** 5-15 minutes
**Escalation Path:** If sync fails consistently with good network, escalate to Tier 2

---

### KB-012: Duplicate Trips or Vehicles

**Symptoms:**
- Same trip appears twice
- Vehicle listed multiple times
- Conflict resolution dialogs appearing frequently
- Data inconsistency between mobile and web

**Root Causes:**
- Sync conflicts from offline editing
- Multiple devices logged into same account
- App crashed during sync
- Clock/timezone mismatch
- Database corruption

**Resolution Steps:**
1. **Identify Duplicates:**
   - Note trip IDs or vehicle IDs
   - Check if data is identical or slightly different
   - Take screenshots for reference

2. **Resolve Conflicts:**
   - If conflict dialog appears, review both versions carefully
   - Select "Keep Server Version" if web data is authoritative
   - Select "Keep Local Version" if mobile data is newer/correct
   - "Merge" option combines both (use carefully)

3. **Delete Duplicate Manually:**
   - Go to Trips or Vehicles list
   - Swipe left on duplicate entry
   - Tap "Delete"
   - Confirm deletion
   - Sync to propagate to server

4. **Check Multi-Device Usage:**
   - Are you logged in on multiple phones/tablets?
   - Coordinate edits to avoid conflicts
   - Log out from devices not in active use

5. **Verify Clock Settings:**
   - iOS Settings > General > Date & Time
   - Enable "Set Automatically"
   - Incorrect time causes sync conflicts

6. **Force Full Re-sync:**
   - Settings > Sync > Advanced > Force Full Sync
   - This reconciles all data with server
   - May take several minutes
   - Resolves most duplicate issues

**Prevention Tips:**
- Avoid editing same record on multiple devices simultaneously
- Sync before making major changes
- Keep device time synchronized automatically
- Don't force-close app during sync
- Use single device per user when possible

**Estimated Resolution Time:** 10-20 minutes
**Escalation Path:** If duplicates persist after full resync, escalate to Tier 2

---

### KB-013: Offline Mode Not Working

**Symptoms:**
- "Network required" errors when offline
- Cannot start trips without internet
- Data not available offline
- App unusable without connection

**Root Causes:**
- Offline data not downloaded
- Background sync disabled
- Local database not initialized
- Storage space insufficient
- First-time use (no cached data)

**Resolution Steps:**
1. **Download Offline Data:**
   - Connect to Wi-Fi
   - Go to Settings > Offline Mode
   - Tap "Download Data for Offline Use"
   - Wait for download to complete (may be large)
   - Shows progress indicator

2. **Enable Background Sync:**
   - Settings > Sync > Background Sync > ON
   - This downloads data automatically when connected
   - Keeps offline data up-to-date

3. **Verify Storage Space:**
   - iOS Settings > General > iPhone Storage
   - Need at least 500MB free for offline data
   - Delete unused apps or photos if needed

4. **Check Offline Data Status:**
   - Settings > Offline Mode > View Offline Data
   - Shows what's available offline:
     - Vehicles
     - Recent trips
     - User profile
     - Maps (if downloaded)

5. **Test Offline Mode:**
   - Enable Airplane Mode
   - Open app and verify functionality:
     - Can start new trip
     - Can view vehicles
     - Can view trip history
   - Data will sync when back online

6. **Re-initialize Offline Database:**
   - Settings > Offline Mode > Reset Offline Data
   - Re-download all offline data
   - This fixes database corruption

**Prevention Tips:**
- Download offline data before field use
- Keep background sync enabled
- Maintain adequate storage space
- Periodically refresh offline data (weekly)
- Monitor offline data size in settings

**Estimated Resolution Time:** 10-30 minutes (depending on download size)
**Escalation Path:** If offline mode unavailable after download, escalate to Tier 2

---

### KB-014: Sync Conflicts Cannot Be Resolved

**Symptoms:**
- Conflict resolution dialog appears repeatedly for same item
- "Unable to resolve conflict" error
- Data keeps reverting to old values
- Sync progress stuck at conflict

**Root Causes:**
- Complex three-way conflict (mobile, server, and another device)
- Backend validation preventing resolution
- Corrupted conflict metadata
- Circular dependency in data

**Resolution Steps:**
1. **Document Conflict Details:**
   - Take screenshot of conflict dialog
   - Note record type (trip, vehicle, etc.)
   - Note which version appears correct
   - Record any error messages

2. **Try Each Resolution Option:**
   - First try "Keep Server Version"
   - If conflict reappears, try "Keep Local Version"
   - Try "Merge" as last option
   - Note which options fail

3. **Check Backend Data:**
   - Log into web dashboard
   - View the conflicted record
   - Check if data looks valid
   - Try editing in web (may force resolution)

4. **Force Local or Server Win:**
   - Settings > Sync > Advanced > Conflict Resolution
   - Set to "Always Keep Local" or "Always Keep Server"
   - Trigger sync again
   - Change back to "Ask Me" after resolution

5. **Delete and Recreate:**
   - If conflict unresolvable, delete both versions
   - Manually recreate record with correct data
   - This breaks conflict chain
   - Ensure critical data not lost

6. **Contact Support:**
   - If conflict involves critical data, don't resolve manually
   - Contact support with screenshots
   - Backend team can force resolution
   - May need database repair

**Prevention Tips:**
- Avoid editing same records on multiple devices
- Sync frequently to catch conflicts early
- Use web dashboard for bulk edits
- Don't interrupt sync process
- Keep only one device active per user

**Estimated Resolution Time:** 15-30 minutes
**Escalation Path:** Escalate immediately to Tier 2 if conflict involves critical data or cannot be resolved after 3 attempts

---

## Camera & Photo Upload Issues

### KB-015: Cannot Take Photos - Camera Access Denied

**Symptoms:**
- "Camera access denied" error
- Camera screen is black
- Cannot capture inspection photos
- Photo button disabled or missing

**Root Causes:**
- Camera permission denied in iOS settings
- Camera being used by another app
- Hardware camera failure
- App bug preventing camera access

**Resolution Steps:**
1. **Grant Camera Permission:**
   - iOS Settings > Privacy > Camera
   - Find "Fleet Management" in list
   - Toggle ON (green)
   - Return to app

2. **Restart App:**
   - Force close app completely
   - Swipe up from bottom and swipe app away
   - Reopen app
   - Try camera again

3. **Close Other Camera Apps:**
   - Close any other apps using camera (FaceTime, Snapchat, etc.)
   - Double-click home button (or swipe up)
   - Swipe away camera apps
   - Try Fleet app camera again

4. **Test Camera Hardware:**
   - Open iOS Camera app
   - Try taking photo
   - If Camera app also fails, hardware issue
   - Restart device

5. **Reinstall App (if needed):**
   - Delete Fleet Management app
   - Reinstall from App Store
   - Login again
   - Grant camera permission when prompted

6. **Check Camera Restrictions:**
   - iOS Settings > Screen Time > Content & Privacy Restrictions
   - Tap "Allowed Apps"
   - Ensure "Camera" is enabled

**Prevention Tips:**
- Always grant camera permission on first use
- Keep camera lens clean
- Don't use camera immediately after other camera apps
- Ensure adequate lighting for photo quality

**Estimated Resolution Time:** 5-10 minutes
**Escalation Path:** If camera permission granted but still fails, escalate to Tier 2

---

### KB-016: Photos Not Uploading to Server

**Symptoms:**
- Photos stuck in upload queue
- "Upload failed" error
- Photos missing from web dashboard
- Upload progress stuck at 0%

**Root Causes:**
- Poor network connection
- Large photo file size
- Server storage quota exceeded
- Authentication issues
- Background upload restrictions

**Resolution Steps:**
1. **Check Network Connection:**
   - Photos require good internet connection
   - Use Wi-Fi for large uploads
   - Check network speed (Settings > Cellular > View)
   - Avoid uploading on weak cellular signal

2. **View Upload Queue:**
   - In app: Settings > Photos > Upload Queue
   - Shows pending uploads with status
   - Tap on failed item to see error details

3. **Retry Failed Uploads:**
   - In Upload Queue, tap failed photo
   - Tap "Retry Upload"
   - Or: Tap "Retry All" to retry all failed

4. **Check Photo Size:**
   - Large photos (>10MB) may time out
   - App should auto-compress, but check settings
   - Settings > Photos > Photo Quality
   - Set to "Optimized" instead of "Full Quality"

5. **Free Up Storage Quota:**
   - Contact administrator if quota exceeded
   - Delete old unnecessary photos from server
   - Web dashboard > Media Library > Delete old photos

6. **Enable Background Upload:**
   - Settings > Photos > Background Upload > ON
   - This uploads photos when app is backgrounded
   - Requires Background App Refresh enabled

7. **Clear Upload Queue (last resort):**
   - Settings > Photos > Upload Queue > Clear All
   - WARNING: This removes pending uploads
   - Photos remain on device but won't upload
   - Re-capture photos if critical

**Prevention Tips:**
- Use "Optimized" photo quality setting
- Upload photos on Wi-Fi when possible
- Don't take hundreds of photos at once
- Monitor upload queue regularly
- Keep adequate server storage quota

**Estimated Resolution Time:** 10-20 minutes
**Escalation Path:** If uploads fail consistently on good Wi-Fi, escalate to Tier 2

---

### KB-017: Photo Quality Poor or Blurry

**Symptoms:**
- Photos are blurry or pixelated
- Cannot read license plates or damage details
- Photos look worse than device camera app
- Compression artifacts visible

**Root Causes:**
- Auto-compression too aggressive
- Camera not focused properly
- Shaky hands during capture
- Low light conditions
- Photo quality setting too low

**Resolution Steps:**
1. **Adjust Photo Quality Settings:**
   - Settings > Photos > Photo Quality
   - Change from "Optimized" to "High Quality"
   - Note: File sizes will be larger
   - May impact upload times

2. **Ensure Proper Focus:**
   - Tap on subject before capturing
   - Wait for yellow focus box to appear
   - Ensure focus box is on important area
   - Hold phone steady for 1 second after tap

3. **Improve Lighting:**
   - Take photos in good lighting
   - Avoid direct sunlight (causes glare)
   - Use flash in low light
   - Position subject near light source

4. **Hold Phone Steady:**
   - Brace elbows against body
   - Take multiple shots to ensure one is sharp
   - Use volume button as shutter (more stable)
   - Lean against wall or vehicle for stability

5. **Clean Camera Lens:**
   - Wipe lens with soft cloth
   - Remove any protective film if present
   - Check for scratches on lens

6. **Use Rear Camera:**
   - Rear camera has better quality than front
   - Ensure using rear camera for important photos
   - Toggle camera in app if needed

7. **Disable Auto-HDR (if causing issues):**
   - iOS Settings > Camera
   - Turn off Auto HDR if photos are over-processed

**Prevention Tips:**
- Use "High Quality" setting for critical documentation
- Take photos in good lighting
- Clean lens regularly
- Take multiple shots of important items
- Review photos before submitting inspection

**Estimated Resolution Time:** 5 minutes
**Escalation Path:** If photos remain poor quality despite good conditions, device camera issue - not app issue

---

### KB-018: Cannot Access Photo Library

**Symptoms:**
- Cannot select existing photos
- "Photo library access denied" error
- Photo picker doesn't open
- Cannot attach photos from gallery

**Root Causes:**
- Photo library permission denied
- Photo library restrictions in Screen Time
- Storage full preventing photo access
- iOS bug with photo picker

**Resolution Steps:**
1. **Grant Photo Library Permission:**
   - iOS Settings > Privacy > Photos
   - Find "Fleet Management"
   - Select "All Photos" (or "Selected Photos" if limited)

2. **Check Screen Time Restrictions:**
   - iOS Settings > Screen Time > Content & Privacy Restrictions
   - Tap "Photos"
   - Ensure "Allow Changes" is selected

3. **Restart Photo Services:**
   - Force close app
   - Restart device (hold power button, slide to power off)
   - Reopen app
   - Try accessing photos again

4. **Free Up Storage:**
   - iOS Settings > General > iPhone Storage
   - If storage full, photos may not load
   - Delete unused apps or old photos
   - Need at least 1GB free

5. **Update iOS:**
   - Photo picker bugs fixed in iOS updates
   - Settings > General > Software Update
   - Install if update available

6. **Use Camera Instead:**
   - If photo picker continues to fail
   - Use in-app camera to capture directly
   - Don't rely on selecting from library

**Prevention Tips:**
- Grant photo library access when first prompted
- Keep iOS updated
- Maintain adequate storage space
- Use in-app camera for new photos when possible

**Estimated Resolution Time:** 5-10 minutes
**Escalation Path:** If permission granted but picker still fails after iOS restart, escalate to Tier 2

---

## Push Notifications Issues

### KB-019: Not Receiving Push Notifications

**Symptoms:**
- No notifications appear
- Missing alerts for trips, maintenance, etc.
- Badge count doesn't update
- Notification permission shows "Authorized" but still no notifications

**Root Causes:**
- Notifications disabled in app or iOS settings
- Do Not Disturb mode enabled
- Focus mode blocking notifications
- Backend not sending notifications
- Device token not registered
- Network connectivity issues preventing notification delivery

**Resolution Steps:**
1. **Check iOS Notification Settings:**
   - iOS Settings > Notifications > Fleet Management
   - Ensure "Allow Notifications" is ON
   - Enable "Lock Screen", "Notification Center", and "Banners"
   - Set Banner Style to "Persistent" for important notifications

2. **Verify App Notification Settings:**
   - In app: Settings > Notifications
   - Enable notification types you want:
     - Trip Alerts
     - Maintenance Reminders
     - Vehicle Alerts
     - Inspection Due

3. **Disable Do Not Disturb:**
   - Swipe down from top right (or up from bottom)
   - Ensure Do Not Disturb (moon icon) is OFF
   - Check if Focus mode is active

4. **Check Focus Mode Settings:**
   - iOS Settings > Focus
   - If using Focus mode, ensure Fleet Management is in allowed apps
   - Or disable Focus mode temporarily to test

5. **Re-register Device Token:**
   - In app: Settings > Notifications > Advanced
   - Tap "Re-register Device"
   - This refreshes push notification token
   - Log out and log back in to force re-registration

6. **Test Notification:**
   - In app: Settings > Notifications > Advanced
   - Tap "Send Test Notification"
   - Should receive test notification within seconds
   - If not received, issue confirmed

7. **Check Backend Configuration:**
   - Contact administrator to verify:
     - Push notifications enabled in backend
     - Certificate/API keys configured correctly
     - No errors in notification logs

**Prevention Tips:**
- Don't disable notifications after initial grant
- Configure Focus modes to allow Fleet Management
- Keep app updated for notification fixes
- Periodically test notifications

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If test notification fails, escalate to Tier 2

---

### KB-020: Notification Badges Not Clearing

**Symptoms:**
- App icon shows badge number
- Badge doesn't decrease when viewing items
- Badge shows wrong count
- Badge stuck at high number

**Root Causes:**
- App not clearing badge after viewing
- Multiple notification sources
- Badge clearing logic bug
- iOS notification cache

**Resolution Steps:**
1. **Clear Notifications Manually:**
   - Open Notification Center
   - Clear all Fleet Management notifications
   - Badge should update

2. **Open All Unread Items:**
   - Open each alert/message in app
   - Mark all as read
   - Badge should decrease as items are viewed

3. **Force Badge Reset:**
   - In app: Settings > Notifications
   - Tap "Clear Badge"
   - Badge should reset to zero immediately

4. **Restart App:**
   - Force close app completely
   - Reopen app
   - Badge count should recalculate

5. **Disable and Re-enable Badges:**
   - iOS Settings > Notifications > Fleet Management
   - Turn "Badges" OFF
   - Wait 10 seconds
   - Turn "Badges" back ON

6. **Clear Notification Center:**
   - In Notification Center
   - 3D Touch on Fleet Management notification
   - Tap "Clear All"

**Prevention Tips:**
- Open app regularly to clear notifications
- Don't accumulate large numbers of unread items
- Use "Mark All as Read" feature when available

**Estimated Resolution Time:** 5 minutes
**Escalation Path:** If badge persists after manual clear, app bug - escalate to Tier 2

---

### KB-021: Notifications Delayed or Arrive Late

**Symptoms:**
- Notifications arrive hours late
- Real-time alerts not real-time
- Batch of old notifications all at once
- Notification timestamps don't match arrival time

**Root Causes:**
- Low Power Mode delaying notifications
- Background App Refresh disabled
- Poor network connectivity
- Backend notification delays
- APNs (Apple Push Notification service) delays
- Focus mode blocking immediate delivery

**Resolution Steps:**
1. **Disable Low Power Mode:**
   - iOS Settings > Battery > Low Power Mode > OFF
   - Low Power Mode delays all background activities
   - Including push notifications

2. **Enable Background App Refresh:**
   - iOS Settings > General > Background App Refresh
   - Enable system toggle
   - Enable for Fleet Management specifically

3. **Check Network Connection:**
   - Poor connection delays notifications
   - Switch to Wi-Fi if on weak cellular
   - Test network speed

4. **Verify Focus Mode:**
   - Some Focus modes delay non-critical notifications
   - iOS Settings > Focus
   - Check "Delivery Schedule" settings
   - Set to "Deliver Immediately"

5. **Check Notification Priority:**
   - In app: Settings > Notifications
   - Some notification types may be "Low Priority"
   - Change critical alerts to "High Priority"

6. **Contact Backend Team:**
   - If many users affected, backend issue
   - Check notification service logs
   - Verify APNs certificate valid
   - Check notification queue depth

7. **Update iOS:**
   - Notification timing bugs fixed in updates
   - iOS Settings > General > Software Update

**Prevention Tips:**
- Disable Low Power Mode for timely notifications
- Keep Background App Refresh enabled
- Maintain good network connectivity
- Configure Focus modes to allow immediate delivery
- Keep iOS and app updated

**Estimated Resolution Time:** 10 minutes
**Escalation Path:** If delays persist with good network and settings, escalate to Tier 2

---

## Performance Issues

### KB-022: App Running Slow or Laggy

**Symptoms:**
- UI animations choppy
- Delayed response to taps
- Scrolling stutters
- Screen transitions slow
- App feels sluggish overall

**Root Causes:**
- Device running low on memory
- Large local database
- Background processes consuming resources
- Old device with limited performance
- App memory leak
- iOS needs restart

**Resolution Steps:**
1. **Close Background Apps:**
   - Double-click home button (or swipe up from bottom)
   - Swipe away unused apps
   - Free up device memory

2. **Restart App:**
   - Force close Fleet Management app
   - Wait 10 seconds
   - Reopen app
   - Performance should improve

3. **Restart Device:**
   - Hold power button and volume button
   - Slide to power off
   - Wait 30 seconds
   - Power back on
   - Clears memory and caches

4. **Clear App Cache:**
   - In app: Settings > Storage
   - Tap "Clear Cache"
   - This removes temporary files
   - Does NOT delete user data

5. **Check Storage Space:**
   - iOS Settings > General > iPhone Storage
   - Need at least 1GB free for good performance
   - Delete unused apps or photos if needed

6. **Reduce Data Size:**
   - In app: Settings > Storage
   - View what's using most space
   - Delete old trip history: Settings > Trips > Clear Old Trips
   - Keep only last 90 days

7. **Update App:**
   - Check App Store for updates
   - Performance improvements in new versions
   - Install latest version

8. **Reduce Visual Effects:**
   - iOS Settings > Accessibility > Motion
   - Enable "Reduce Motion"
   - Reduces animations, improves performance

**Prevention Tips:**
- Restart device weekly
- Clear app cache monthly
- Don't accumulate unlimited data
- Keep adequate storage space
- Update app regularly
- Close unused background apps

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If performance poor on newer devices (iPhone 11+), escalate to Tier 2

---

### KB-023: App Using Too Much Battery

**Symptoms:**
- Battery drains quickly when app running
- Device gets hot during use
- Battery usage shows Fleet Management at top
- Battery doesn't last full shift

**Root Causes:**
- GPS tracking continuously active
- OBD2 connection staying active
- Background refresh too frequent
- Screen brightness too high
- Location accuracy set to highest
- Multiple background processes

**Resolution Steps:**
1. **Check Battery Usage:**
   - iOS Settings > Battery
   - Scroll to Fleet Management
   - Review "Background Activity" and "Screen On" times
   - Identify which is using more

2. **Optimize GPS Settings:**
   - In app: Settings > Location
   - Change "Accuracy" from "Best" to "Balanced"
   - Change "Update Frequency" to "Normal" (not "High")
   - This reduces GPS power usage by 30-40%

3. **Disable OBD2 When Not Needed:**
   - Disconnect from OBD2 when not actively using diagnostics
   - In app: OBD2 > Disconnect
   - Bluetooth continuously active drains battery

4. **Reduce Background Sync:**
   - Settings > Sync > Background Sync Frequency
   - Change from "Frequent" to "Normal"
   - Syncs less often, saves battery

5. **Lower Screen Brightness:**
   - Swipe down Control Center
   - Reduce brightness slider
   - Or enable Auto-Brightness: iOS Settings > Accessibility > Display

6. **Enable Low Power Mode (when critical):**
   - iOS Settings > Battery > Low Power Mode
   - NOTE: This may affect trip tracking accuracy
   - Only use when battery critically low

7. **Close App When Not In Use:**
   - Don't leave app open in background unnecessarily
   - Force close after completing tasks
   - Only keep active during trips

8. **Check for Battery-Draining Bug:**
   - Update to latest app version
   - Some versions had battery bugs that were fixed

**Prevention Tips:**
- Use "Balanced" GPS accuracy unless precision needed
- Disconnect OBD2 when not in use
- Reduce screen brightness
- Charge device in vehicle during long trips
- Update app regularly for battery optimizations
- Monitor battery usage weekly

**Estimated Resolution Time:** 10 minutes
**Escalation Path:** If battery drain excessive (>20%/hour) after optimization, escalate to Tier 2

---

### KB-024: App Freezes or Becomes Unresponsive

**Symptoms:**
- App screen frozen, no response to taps
- Cannot navigate or close app
- Must force close to regain control
- Loading spinner spins indefinitely
- White screen or blank screen

**Root Causes:**
- Network request hanging
- Database query deadlock
- Memory exhausted
- Infinite loop in code
- Corrupted data causing crash
- iOS memory pressure

**Resolution Steps:**
1. **Wait 30 Seconds:**
   - Sometimes operations just need time
   - Complex sync or database operations may appear frozen
   - Check for subtle activity indicators

2. **Force Close App:**
   - Double-click home button (or swipe up)
   - Swipe Fleet Management app up and away
   - Wait 10 seconds
   - Reopen app

3. **Restart Device:**
   - If force close doesn't work
   - Hold power + volume button
   - Slide to power off
   - Wait 30 seconds, power on

4. **Check Network Connection:**
   - Freeze may be waiting for network response
   - Check if network is available
   - Try enabling Airplane Mode, wait 10 seconds, disable
   - This resets network connections

5. **Clear App Cache:**
   - After restarting app
   - Go to Settings > Storage > Clear Cache
   - Removes potentially corrupted cached data

6. **Check for Corrupted Trip:**
   - If freeze happens when viewing specific trip
   - That trip data may be corrupted
   - Contact support to delete corrupted trip

7. **Reinstall App (last resort):**
   - Delete app completely
   - Reinstall from App Store
   - Login again
   - WARNING: Unsynced data will be lost

8. **Document Freeze Scenario:**
   - Note what you were doing when freeze occurred
   - Take screenshot if possible
   - Report to support with details

**Prevention Tips:**
- Keep app updated (freezes often fixed in updates)
- Don't perform complex operations on weak network
- Sync regularly to prevent large data operations
- Restart app daily during heavy use
- Monitor memory-intensive operations

**Estimated Resolution Time:** 5-15 minutes
**Escalation Path:** If freezes occur frequently (>3 times/day), escalate to Tier 2 with crash logs

---

### KB-025: Large Data Loading Slowly

**Symptoms:**
- Trip list takes long time to load
- Vehicle list slow to appear
- Map pins load slowly
- Long delays when opening trip details

**Root Causes:**
- Large dataset (1000+ trips)
- Complex map rendering
- Slow database queries
- Network fetching all data instead of using local
- Inefficient pagination

**Resolution Steps:**
1. **Use Filters to Reduce Dataset:**
   - In trip/vehicle list, tap "Filter" button
   - Filter by date range (e.g., last 30 days)
   - Filter by specific vehicle
   - Smaller datasets load faster

2. **Clear Old Data:**
   - Settings > Storage > Manage Data
   - Delete old trips: "Clear trips older than 90 days"
   - Delete old vehicle history
   - Keeps most relevant data

3. **Sync to Latest Version:**
   - Pull down to refresh lists
   - Ensures local database has latest data
   - Reduces need to fetch from server

4. **Use Search Instead of Scrolling:**
   - In lists, use search bar
   - Search by vehicle name, trip date, etc.
   - Faster than loading and scrolling thousands of items

5. **Disable Map Clustering (if slow):**
   - In map view: Settings icon > Map Settings
   - Disable "Cluster Pins"
   - Shows individual pins (may be faster for small datasets)

6. **Rebuild Database Index:**
   - Settings > Storage > Advanced > Rebuild Index
   - Improves database query performance
   - Takes 1-2 minutes

7. **Reduce Map Detail:**
   - Settings > Maps > Detail Level
   - Set to "Low" or "Medium"
   - Faster rendering, less data

**Prevention Tips:**
- Regularly archive old data
- Use filters to work with smaller datasets
- Don't load "All Time" data unnecessarily
- Keep local database optimized
- Use search for specific items

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If loading slow with reasonable dataset size (<500 items), escalate to Tier 2

---

## Network Connectivity Issues

### KB-026: "No Internet Connection" Error Despite Having Network

**Symptoms:**
- "No internet connection" message appears
- Network indicator shows connected
- Other apps work fine
- Cannot sync or load data

**Root Causes:**
- App-specific network issue
- Firewall blocking app traffic
- VPN interfering with connection
- DNS resolution failure
- SSL/TLS certificate validation failure
- Backend server unreachable

**Resolution Steps:**
1. **Test Network Connection:**
   - Open Safari and visit any website
   - Confirms network actually works
   - Try visiting backend URL directly (if known)

2. **Toggle Airplane Mode:**
   - Enable Airplane Mode
   - Wait 10 seconds
   - Disable Airplane Mode
   - This resets all network connections

3. **Switch Network:**
   - If on Wi-Fi, try cellular data
   - If on cellular, try Wi-Fi
   - Determines if specific network is blocked

4. **Disable VPN:**
   - If using VPN, disable temporarily
   - Some VPNs block certain app traffic
   - Test app without VPN
   - If works, VPN configuration issue

5. **Check Firewall Settings:**
   - Enterprise networks may block app
   - Contact IT to whitelist app domains
   - Required domains:
     - api.fleetmanagement.com
     - auth.fleetmanagement.com
     - sync.fleetmanagement.com

6. **Verify Time and Date:**
   - iOS Settings > General > Date & Time
   - Enable "Set Automatically"
   - Incorrect time causes SSL certificate failures

7. **Clear Network Cache:**
   - In app: Settings > Advanced > Clear Network Cache
   - Force close app
   - Reopen and test

8. **Update App:**
   - Check for app updates
   - Network compatibility fixes in updates

**Prevention Tips:**
- Keep time/date set automatically
- Whitelist app domains on enterprise networks
- Use trusted networks when possible
- Update app regularly
- Document VPN compatibility issues

**Estimated Resolution Time:** 10-15 minutes
**Escalation Path:** If works on cellular but not Wi-Fi, likely firewall issue - escalate to Tier 3 / IT

---

### KB-027: Slow Network Performance

**Symptoms:**
- Data loads very slowly
- Sync takes extremely long time
- Timeouts occur frequently
- Photos take forever to upload

**Root Causes:**
- Weak cellular signal
- Slow Wi-Fi network
- Network congestion
- Backend server slow
- Large data transfer
- Throttled connection

**Resolution Steps:**
1. **Check Network Speed:**
   - Use speed test app (Speedtest by Ookla)
   - Need at least: 1 Mbps down, 0.5 Mbps up
   - If slower, network is issue (not app)

2. **Improve Signal Strength:**
   - If cellular: Move to better signal area
   - Check signal bars (need 3+ bars)
   - If Wi-Fi: Move closer to router
   - Avoid obstacles between device and router

3. **Switch to Better Network:**
   - If on 3G, switch to 4G/5G
   - iOS Settings > Cellular > Cellular Data Options
   - Enable LTE/5G
   - If on slow Wi-Fi, switch to cellular

4. **Reduce Data Usage:**
   - Settings > Photos > Photo Quality > Optimized
   - Reduces upload data size
   - Settings > Sync > Sync Media > Off
   - Sync media only on Wi-Fi

5. **Sync During Off-Peak Hours:**
   - Network may be congested during business hours
   - Schedule large syncs for evening
   - Settings > Sync > Schedule Sync

6. **Use Wi-Fi for Large Operations:**
   - Connect to Wi-Fi before major sync
   - Upload bulk photos on Wi-Fi only
   - Settings > Sync > Use Wi-Fi Only

7. **Check Backend Status:**
   - Contact administrator
   - Backend may be slow or under maintenance
   - Check status page if available

**Prevention Tips:**
- Use Wi-Fi for large operations
- Sync during good network conditions
- Monitor signal strength
- Don't accumulate large upload queues
- Schedule bulk operations

**Estimated Resolution Time:** 5-10 minutes
**Escalation Path:** If network speed good but app slow, escalate to Tier 2

---

## App Crashes & Stability

### KB-028: App Crashes on Launch

**Symptoms:**
- App closes immediately after opening
- Cannot get past splash screen
- Crash occurs during initialization
- "App quit unexpectedly" error

**Root Causes:**
- Corrupted app installation
- Database corruption
- iOS version incompatibility
- Low storage space
- Corrupted cache files
- App bug in latest version

**Resolution Steps:**
1. **Restart Device:**
   - Hold power + volume button
   - Slide to power off
   - Wait 30 seconds
   - Power on and try app

2. **Free Up Storage:**
   - iOS Settings > General > iPhone Storage
   - Need at least 1GB free
   - Delete unused apps or photos
   - Try app again

3. **Update App:**
   - Check App Store for updates
   - Update to latest version
   - Launch crash may be fixed

4. **Update iOS:**
   - iOS Settings > General > Software Update
   - Install if available
   - Compatibility fixes

5. **Reinstall App:**
   - Delete Fleet Management app
   - Restart device
   - Reinstall from App Store
   - Login and test
   - WARNING: Unsynced data will be lost

6. **Check iOS Compatibility:**
   - App requires iOS 14.0 or later
   - iOS Settings > General > About > Software Version
   - If older, update iOS first

7. **Restore from Backup (if recurring):**
   - If crash persists after reinstall
   - Device may have deeper issue
   - Consider iOS restore

8. **Contact Support:**
   - If crash continues after all steps
   - Provide crash logs:
     - iOS Settings > Privacy > Analytics & Improvements
     - Analytics Data > Search "Fleet"
     - Share crash logs with support

**Prevention Tips:**
- Keep iOS updated
- Keep app updated
- Maintain adequate storage space
- Sync regularly before major updates
- Restart device weekly

**Estimated Resolution Time:** 15-30 minutes
**Escalation Path:** If crashes persist after reinstall, escalate to Tier 2 with device info and crash logs

---

### KB-029: Random Crashes During Use

**Symptoms:**
- App crashes unexpectedly during normal use
- No pattern to when crashes occur
- May crash during any operation
- Frequency varies

**Root Causes:**
- App bug triggered by specific data
- Memory pressure
- iOS bug
- Corrupted data in database
- Background process crash

**Resolution Steps:**
1. **Document Crash Pattern:**
   - Note what you were doing when crash occurred
   - Note which screen you were on
   - Note any error messages before crash
   - Try to reproduce crash

2. **Update App:**
   - Check for latest version
   - Crash may be known and fixed
   - Install update if available

3. **Free Memory:**
   - Close background apps
   - Restart device to clear memory
   - Don't run memory-intensive apps simultaneously

4. **Check for Corrupted Data:**
   - If crash always on same screen/trip
   - That data may be corrupted
   - Contact support to identify and delete corrupted record

5. **Clear Cache:**
   - Settings > Storage > Clear Cache
   - Removes potentially corrupted cache files
   - Does not delete user data

6. **Reset App Settings:**
   - Settings > Advanced > Reset App Settings
   - Resets to defaults
   - May fix configuration-related crashes

7. **Reinstall App:**
   - If crashes frequent (>5 per day)
   - Delete and reinstall app
   - Fresh installation may resolve

8. **Provide Crash Logs:**
   - iOS Settings > Privacy > Analytics > Analytics Data
   - Find crashes starting with "Fleet"
   - Email to support for analysis
   - Helps developers fix root cause

**Prevention Tips:**
- Update app immediately when available
- Report crashes to support (crash logs sent automatically if opted in)
- Don't ignore patterns (e.g., always crashes on specific screen)
- Restart app and device regularly
- Maintain adequate storage and memory

**Estimated Resolution Time:** 20-30 minutes
**Escalation Path:** If crashes occur >5 times per day, escalate to Tier 2 with crash logs and reproduction steps

---

### KB-030: Crash When Viewing Specific Trip or Vehicle

**Symptoms:**
- App crashes when opening specific trip details
- Certain vehicle detail pages cause crash
- Other trips/vehicles work fine
- Crash reproducible with same item

**Root Causes:**
- Corrupted trip/vehicle data in database
- Invalid GPS coordinates
- Malformed JSON from server
- Data exceeds display limits
- Bug with specific data values

**Resolution Steps:**
1. **Confirm Reproducibility:**
   - Try opening item multiple times
   - If always crashes on same item, data issue
   - Note item ID/name

2. **View on Web Dashboard:**
   - Login to web dashboard
   - Try viewing same trip/vehicle there
   - If works on web, mobile rendering issue
   - If broken on web too, server data issue

3. **Sync Latest Data:**
   - Pull down to refresh list
   - Re-sync item from server
   - May fix if local copy corrupted

4. **Clear App Cache:**
   - Settings > Storage > Clear Cache
   - Force close app
   - Try opening item again

5. **Delete and Re-sync Item (if possible):**
   - In list, swipe left on item
   - Delete
   - Pull down to refresh
   - Item re-downloads from server
   - Try opening again

6. **Contact Support:**
   - Provide item ID or name
   - Provide steps to reproduce crash
   - Support can investigate server data
   - May need to repair data on backend

7. **Temporarily Skip Item:**
   - If item not critical, skip it
   - Use other trips/vehicles
   - Wait for fix from support

**Prevention Tips:**
- Report specific crash items to support immediately
- Don't repeatedly try to open crashing item
- Sync regularly to get data fixes
- Update app (fixes may include better error handling)

**Estimated Resolution Time:** 15-20 minutes (plus support investigation time)
**Escalation Path:** Escalate immediately to Tier 2 with item ID and reproduction steps

---

## Data & Privacy Issues

### KB-031: Cannot Delete Personal Data

**Symptoms:**
- Delete button doesn't work
- Data reappears after deletion
- "Cannot delete" error message
- GDPR data deletion request not honored

**Root Causes:**
- Data protection rules preventing deletion
- Record referenced by other data
- Insufficient permissions
- Backend retention policies
- Sync reverting deletion

**Resolution Steps:**
1. **Check Permissions:**
   - Only certain roles can delete data
   - Check your role: Settings > Profile
   - Contact administrator if need deletion permission

2. **Review Retention Policies:**
   - Some data must be retained per company policy
   - Example: Completed trips retained for 7 years (legal requirement)
   - Check policy documentation

3. **Soft Delete vs Hard Delete:**
   - Some deletions archive instead of removing
   - Archived data not visible but still exists
   - Settings > Privacy > View Archived Data

4. **Delete Dependencies First:**
   - Cannot delete vehicle with active trips
   - Delete or archive trips first
   - Then delete vehicle

5. **Request Data Deletion (GDPR):**
   - Settings > Privacy > Request Data Deletion
   - Submits official GDPR deletion request
   - Response within 30 days
   - May require account deactivation

6. **Contact Administrator:**
   - For company data deletion requests
   - Administrator has higher deletion privileges
   - Explain reason for deletion

**Prevention Tips:**
- Understand retention policies before creating data
- Use data minimization (don't collect unnecessary data)
- Archive instead of delete when possible
- Document deletion requests

**Estimated Resolution Time:** Variable (immediate to 30 days for GDPR)
**Escalation Path:** GDPR requests escalate to Tier 3 / Legal

---

### KB-032: Privacy Concerns - Location Tracking

**Symptoms:**
- Concerned about location tracking
- Want to disable tracking outside work hours
- Unclear what location data is collected
- Need to understand data retention

**Information & Resolution:**

**What Location Data is Collected:**
- GPS coordinates during trip tracking (only when trip active)
- Trip start/end locations
- Route taken during trip
- Speed and distance calculations
- Significant location changes (if background tracking enabled)

**What is NOT Collected:**
- Location when app not in use (unless trip active)
- Location when logged out
- Home address (unless you enter it)

**How to Control Location Tracking:**

1. **Disable Outside Work Hours:**
   - Only start trips during work hours
   - Don't leave trips running overnight
   - Settings > Privacy > Auto-End Trips (ends trips after 8 hours)

2. **Adjust Permissions:**
   - iOS Settings > Privacy > Location Services > Fleet Management
   - Change from "Always" to "While Using App"
   - NOTE: Background trip tracking won't work

3. **View Location History:**
   - Settings > Privacy > Location History
   - Shows all tracked locations
   - Can delete individual location records

4. **Disable Background Location:**
   - Settings > Location > Background Updates > OFF
   - Location only tracked when app is open
   - Reduces battery usage too

5. **Review Privacy Policy:**
   - Settings > About > Privacy Policy
   - Details what data is collected and why
   - Explains retention and sharing policies

6. **Request Location Data Export:**
   - Settings > Privacy > Export My Data
   - Receive all your location data
   - GDPR right to data portability

7. **Request Location Data Deletion:**
   - Settings > Privacy > Request Data Deletion
   - Select "Location Data Only"
   - Retains other data, deletes location history

**Data Retention:**
- Active trip data: Retained indefinitely (business records)
- Location history: 2 years default
- Deleted data: Removed from backups after 90 days

**Who Can See Your Location:**
- Your fleet manager/administrator
- Your organization's authorized users
- Not shared with third parties (except as required by law)

**Prevention Tips:**
- Only run trips during work hours
- End trips immediately when done
- Review privacy settings regularly
- Understand company policy on location tracking

**Estimated Resolution Time:** 15 minutes (information/configuration)
**Escalation Path:** If privacy concerns not addressed, escalate to Tier 3 / Privacy Officer

---

## Additional Resources

### Quick Reference - Error Codes

| Error Code | Description | Quick Fix |
|------------|-------------|-----------|
| AUTH-001 | Invalid credentials | Check email/password, reset if needed |
| AUTH-002 | Session expired | Log out and log back in |
| AUTH-003 | Account locked | Contact administrator |
| GPS-001 | Location services disabled | Enable in iOS Settings |
| GPS-002 | Permission denied | Grant "Always" permission |
| OBD-001 | Bluetooth unavailable | Enable Bluetooth |
| OBD-002 | Device not found | Check adapter is plugged in, ignition ON |
| OBD-003 | Connection failed | Reset adapter, try again |
| SYNC-001 | Network unavailable | Check internet connection |
| SYNC-002 | Sync conflict | Resolve conflict in app |
| SYNC-003 | Server error | Try again later, contact support if persists |
| CAM-001 | Camera permission denied | Enable in iOS Settings |
| CAM-002 | Photo upload failed | Check network, retry |
| NOTIF-001 | Notifications disabled | Enable in iOS Settings |
| PERF-001 | Low memory | Close background apps, restart device |
| NET-001 | Connection timeout | Check network stability |

### Escalation Contacts

- **Tier 1 Support:** support@fleetmanagement.com | Response: 4 hours
- **Tier 2 Technical:** technical@fleetmanagement.com | Response: 8 hours
- **Tier 3 Engineering:** engineering@fleetmanagement.com | Response: 24 hours
- **Emergency (Production Down):** +1-800-FLEET-911 | Response: 1 hour

### Useful Settings Locations

**iOS Settings:**
- Location: Settings > Privacy > Location Services > Fleet Management
- Notifications: Settings > Notifications > Fleet Management
- Bluetooth: Settings > Bluetooth
- Storage: Settings > General > iPhone Storage
- Background Refresh: Settings > General > Background App Refresh

**App Settings:**
- Account: Settings (in app) > Profile
- Sync: Settings > Sync
- OBD2: Settings > OBD2
- Privacy: Settings > Privacy
- Notifications: Settings > Notifications

### System Requirements

- **iOS Version:** 14.0 or later (iOS 15+ recommended)
- **Device:** iPhone 7 or newer
- **Storage:** Minimum 500MB free
- **Network:** 4G LTE or Wi-Fi recommended
- **Bluetooth:** 4.0 or later (for OBD2)

---

**Document Version:** 1.0
**Total Articles:** 32
**Last Review Date:** November 2025
**Next Review:** February 2026

For additional support, contact support@fleetmanagement.com or call 1-800-FLEET-911.
