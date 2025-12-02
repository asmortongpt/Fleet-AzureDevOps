# Fleet Management System - Troubleshooting Guide

**Solutions to common issues and problems**

---

## Table of Contents

1. [Login and Authentication Issues](#login-and-authentication-issues)
2. [GPS and Mapping Problems](#gps-and-mapping-problems)
3. [Performance and Loading Issues](#performance-and-loading-issues)
4. [Data and Saving Problems](#data-and-saving-problems)
5. [Mobile App Issues](#mobile-app-issues)
6. [Email and Notification Problems](#email-and-notification-problems)
7. [Report Generation Issues](#report-generation-issues)
8. [Integration Problems](#integration-problems)
9. [Browser Compatibility Issues](#browser-compatibility-issues)
10. [When to Contact Support](#when-to-contact-support)

---

## Login and Authentication Issues

### Can't Log In - "Invalid Credentials"

**Symptoms:**
- Error message: "Invalid username or password"
- Can't access the system

**Solutions:**

**Step 1: Verify Your Email**
- Make sure you're entering the correct email address
- Check for typos or extra spaces
- Email is case-sensitive? No, but check anyway

**Step 2: Reset Your Password**
1. Click **"Forgot Password?"** on login page
2. Enter your email address
3. Check email for reset link
4. Click link and create new password
5. Password requirements:
   - At least 12 characters
   - Include uppercase, lowercase, number, special character
   - Cannot be a previously used password

**Step 3: Try Microsoft SSO Instead**
- If your organization uses Microsoft 365:
  1. Click **"Sign in with Microsoft"** button
  2. Use your work Microsoft credentials
  3. This bypasses password issues

**Step 4: Check Account Status**
- Your account may be disabled
- Contact your administrator to verify account is active

**Step 5: Clear Browser Data**
1. Clear browser cache and cookies
2. Close browser completely
3. Reopen and try again

**Step 6: Try Different Browser**
- If using Chrome, try Edge or Firefox
- Helps identify browser-specific issues

**Still not working?** Contact your fleet administrator or support.

---

### Microsoft SSO Login Not Working

**Symptoms:**
- "Sign in with Microsoft" button redirects but fails
- Error: "Authorization failed" or "Access denied"
- Stuck on Microsoft login page

**Solutions:**

**Step 1: Verify Microsoft Account**
- Are you using your **work** Microsoft account (not personal)?
- Email should match your Fleet system email exactly
- Example: If Fleet email is `john@company.com`, Microsoft must be `john@company.com`

**Step 2: Check Organization Email**
- Your organization may use different email for Microsoft vs. Fleet
- Contact your administrator to verify correct email

**Step 3: Multi-Factor Authentication (MFA)**
- If your organization requires MFA:
  1. Complete MFA prompts (text code, app approval, etc.)
  2. Don't cancel or skip MFA steps
  3. If MFA setup is incomplete, contact IT

**Step 4: Browser Popup Blockers**
- Microsoft login uses popups
- Disable popup blocker for fleet site:
  1. Click browser settings
  2. Find popup blocker settings
  3. Add fleet URL to allowed sites

**Step 5: Clear Microsoft Session**
1. Go to https://login.microsoftonline.com
2. Sign out completely
3. Close all browser windows
4. Try Fleet login again

**Step 6: Incognito/Private Mode**
1. Open browser in incognito/private mode
2. Try logging in
3. If works, issue is with browser cache/extensions

**Step 7: Disable Browser Extensions**
- Ad blockers, privacy extensions may interfere
- Disable extensions temporarily
- Try login again

**Step 8: Check with IT Department**
- Azure AD integration may need configuration
- Your administrator may need to add you to Azure AD app

**Alternative:** Use email/password login if available

---

### Session Expires Too Quickly

**Symptoms:**
- Get logged out after short period of inactivity
- Have to log in multiple times per day

**Solutions:**

**Check Session Timeout Settings:**
- Default: 8 hours of inactivity
- If shorter, contact administrator

**Browser Settings:**
- Some browsers aggressively clear cookies
- Check browser privacy settings
- Allow cookies for fleet domain

**"Remember Me" Option:**
- Look for "Keep me signed in" checkbox on login
- Extends session to 30 days (if enabled by admin)

**Work-Around:**
- Keep Fleet tab open in browser
- Occasional activity (clicks) keeps session alive

---

### Two-Factor Authentication (2FA) Not Working

**Note:** 2FA is currently only available via Azure AD MFA (if using Microsoft SSO)

**If using Microsoft SSO with MFA:**

**Issue: Not Receiving MFA Code**

**Solutions:**
1. **Text Message Code:**
   - Verify phone number is correct in Azure AD profile
   - Check for delayed text (may take 1-2 minutes)
   - Check phone has signal
   - Try "Resend Code"

2. **Authenticator App:**
   - Make sure Microsoft Authenticator app is installed
   - Check for push notifications
   - If no push, enter code from app manually

3. **Backup Methods:**
   - Use alternate verification method (email, backup phone)
   - Contact IT to update MFA settings

---

## GPS and Mapping Problems

### Vehicle Not Showing on Map

**Symptoms:**
- Vehicle missing from GPS tracking map
- Location shows as "Unknown" or "No signal"

**Solutions:**

**Step 1: Check GPS Device**
- **Is device installed?**
  - New vehicles may not have GPS yet
  - Contact fleet administrator
- **Is device powered?**
  - Check vehicle ignition is on
  - Some devices only work when ignition is on
- **Check device connection:**
  - Loose OBD2 connection
  - Check if device LED is lit

**Step 2: Check Cellular Signal**
- GPS devices use cellular data
- Vehicle may be in area with no signal:
  - Underground parking garage
  - Remote rural area
  - Inside metal building
- Move vehicle to open area and wait 2-3 minutes

**Step 3: Check Vehicle Configuration**
1. Go to vehicle detail page
2. Click **"GPS Settings"**
3. Verify:
   - GPS device ID/IMEI is entered
   - Device is marked as "Active"
   - Tracking is enabled

**Step 4: Check Device Status**
- On GPS Settings page, click **"Device Status"**
- Shows:
  - Last communication time
  - Cellular signal strength
  - Battery status (if battery-powered)
- If "Last seen" is days/weeks ago, device may be faulty

**Step 5: Force Update**
- Click **"Request Location Update"** or **"Locate Now"**
- Sends command to GPS device to report immediately
- Wait 30-60 seconds for update

**Step 6: Check Integration**
- Administrator issue: Azure Maps integration may be broken
- Contact administrator

**Still not working?** GPS device may be faulty - contact support for replacement

---

### Map Not Loading or Showing Blank

**Symptoms:**
- GPS Tracking page loads but map is blank/gray
- Error: "Failed to load map"

**Solutions:**

**Step 1: Check Internet Connection**
- Map tiles require internet
- Check your connection speed
- Try loading another website to verify

**Step 2: Refresh Page**
- Press F5 or Ctrl+R (Cmd+R on Mac)
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R)

**Step 3: Clear Browser Cache**
1. Open browser settings
2. Clear browsing data
3. Select "Cached images and files"
4. Clear
5. Restart browser

**Step 4: Check Browser Console (Advanced)**
1. Press F12 to open developer tools
2. Click "Console" tab
3. Look for errors mentioning "maps" or "Azure"
4. Screenshot errors to send to support

**Step 5: Try Different Map Provider**
- If administrator has enabled multiple providers:
  1. Click map settings/layers icon
  2. Switch to different provider (Google, Mapbox, etc.)

**Administrator Issue:**
- Azure Maps API key may be invalid or expired
- Contact administrator to verify integration

---

### GPS Location is Inaccurate

**Symptoms:**
- Vehicle shows on map but location is wrong
- Shows vehicle in wrong city/state
- Location "jumps" around

**Solutions:**

**Understanding GPS Accuracy:**
- Typical accuracy: 10-30 feet
- Factors affecting accuracy:
  - Tall buildings (urban canyons)
  - Heavy tree cover
  - Weather (storms, heavy clouds)
  - GPS satellite visibility

**If Consistently Wrong (miles off):**

**Step 1: Wait for Better Position**
- Move vehicle to open area (clear view of sky)
- Wait 2-3 minutes for GPS to acquire satellites
- Accuracy improves as device gets more satellite locks

**Step 2: Check GPS Device**
- Device may be faulty
- Contact administrator to check device diagnostics

**Step 3: Check Vehicle Configuration**
- Wrong GPS device ID may be assigned to vehicle
- Administrator can verify in GPS settings

**If Location "Jumps" or Shows Wrong Path:**
- **Tall buildings:** GPS signals bounce off buildings
- **Tunnels/Bridges:** GPS lost temporarily, then reconnects
- **Poor signal:** GPS interpolates path, may be inaccurate
- This is normal behavior - not a device issue

**For Critical Accuracy:**
- Use higher-grade GPS devices (survey-grade)
- Contact support for device upgrade options

---

### Geofence Alerts Not Triggering

**Symptoms:**
- Vehicle enters/exits geofence but no alert received
- Geofence seems to not be working

**Solutions:**

**Step 1: Verify Geofence is Active**
1. Go to **"Geofence Management"**
2. Find your geofence
3. Check status is "Active" (not paused or disabled)

**Step 2: Check Alert Configuration**
1. Open geofence settings
2. Verify alert rules:
   - [ ] Alert on enter?
   - [ ] Alert on exit?
   - [ ] Dwell time threshold? (if set, vehicle must stay X minutes)
3. Verify alert recipients are correct (your email/phone)

**Step 3: Check Vehicle Assignment**
- Geofence may be configured for specific vehicles only
- Verify your vehicle is included in geofence rules

**Step 4: Check Notification Settings**
1. Go to your profile → **"Notification Settings"**
2. Verify geofence alerts are enabled
3. Check email address is correct

**Step 5: Check GPS Update Frequency**
- If GPS updates every 5 minutes, vehicle may enter/exit between updates
- May miss geofence crossing if:
  - Geofence is very small
  - Vehicle moves quickly through geofence
- Solution: Increase GPS update frequency (admin setting)

**Step 6: Test Geofence**
1. Click geofence → **"Test Alert"**
2. Sends test notification
3. If you receive test but not real alerts, issue is with GPS/timing

---

## Performance and Loading Issues

### Pages Loading Slowly

**Symptoms:**
- Pages take long time to load (> 5 seconds)
- Dashboard feels sluggish
- Clicking buttons has delay

**Solutions:**

**Step 1: Check Internet Connection**
- Run speed test: https://fast.com
- Minimum recommended: 10 Mbps download
- If slow, issue is your network (not Fleet system)

**Step 2: Close Other Tabs/Apps**
- Browser with many tabs uses memory
- Close unused tabs
- Close other applications using bandwidth (streaming video, downloads)

**Step 3: Refresh the Page**
- Press F5 or click browser refresh button
- Clears temporary issues

**Step 4: Clear Browser Cache**
1. Browser Settings → Privacy → Clear browsing data
2. Select "Cached images and files"
3. Select "All time"
4. Clear
5. Restart browser

**Step 5: Update Browser**
- Old browser versions are slower
- Check for updates: Browser menu → Help → About
- Install latest version

**Step 6: Disable Browser Extensions**
- Ad blockers, privacy tools may slow browsing
- Disable extensions temporarily:
  1. Browser menu → Extensions
  2. Disable all
  3. Test Fleet system
  4. Re-enable one by one to find culprit

**Step 7: Try Different Browser**
- Chrome usually fastest
- Try Edge, Firefox as alternatives

**Step 8: Check with Others**
- Ask colleagues if they're experiencing slowness
- If yes, may be system-wide issue
- If no, issue is with your computer/network

**Step 9: Restart Computer**
- Clears memory leaks
- Closes background processes

**Still slow?** Contact support - may be system issue

---

### Dashboard Shows "Loading..." Forever

**Symptoms:**
- Dashboard page stuck on loading screen
- Spinner spins indefinitely
- No data appears

**Solutions:**

**Step 1: Wait**
- First load may take 10-20 seconds with large fleets
- Give it a full minute before troubleshooting

**Step 2: Check Browser Console (Advanced)**
1. Press F12 → Console tab
2. Look for errors (red text)
3. Common errors:
   - "Failed to fetch" = network issue
   - "401 Unauthorized" = session expired (log out/in)
   - "500 Server Error" = backend issue (contact support)

**Step 3: Hard Refresh**
- Press Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Forces browser to reload everything

**Step 4: Log Out and Back In**
1. Click profile → Sign Out
2. Close browser
3. Reopen and log in again
4. Refreshes your session

**Step 5: Try Incognito Mode**
1. Open browser incognito/private window
2. Log into Fleet system
3. If dashboard loads, issue is with cache/extensions
4. Solution: Clear cache or disable extensions

**Step 6: Check System Status**
- Contact administrator to check if system is down
- Administrator can check health dashboard

**Still stuck?** Contact support with screenshot of browser console errors

---

### "Out of Memory" or Browser Crashes

**Symptoms:**
- Browser shows "Out of memory" error
- Browser tab crashes
- Computer freezes when using Fleet system

**Solutions:**

**Step 1: Close Other Tabs/Apps**
- Fleet system uses memory for maps and data
- Close unused browser tabs
- Close memory-intensive apps (photo editors, games)

**Step 2: Restart Browser**
- Clears memory leaks
- Close all browser windows
- Reopen

**Step 3: Upgrade Browser**
- 64-bit browsers handle more memory
- Verify you're using 64-bit version

**Step 4: Disable Heavy Features**
- **3D Virtual Garage:** Very memory-intensive
  - Avoid if computer has < 8GB RAM
- **Large reports:** Use filters to reduce data size
- **Satellite imagery:** Switch to road map view (uses less memory)

**Step 5: Increase Computer Memory (RAM)**
- Minimum recommended: 8GB RAM
- Ideal: 16GB+ RAM
- Consider hardware upgrade if persistent

**Step 6: Use Mobile App Instead**
- Mobile app optimized for lower-resource devices
- Good alternative for basic tasks

---

## Data and Saving Problems

### Changes Not Saving

**Symptoms:**
- Make edits to vehicle, driver, etc.
- Click "Save" but changes don't persist
- No error message or silent failure

**Solutions:**

**Step 1: Check Required Fields**
- Fields marked with red asterisk (*) are required
- Fill in all required fields
- System may not show error clearly

**Step 2: Check Field Validation**
- Some fields have validation rules:
  - Email must be valid email format
  - Phone must be valid format
  - VIN must be 17 characters
  - Dates must be valid
- Look for red underlines or error text below fields

**Step 3: Check Internet Connection**
- Verify you're still online
- Try loading another website
- If offline, changes can't save

**Step 4: Wait for Save to Complete**
- Don't navigate away immediately after clicking Save
- Wait for success message: "Changes saved successfully"
- Large files (photos, documents) take time to upload

**Step 5: Check Browser Console (Advanced)**
1. Press F12 → Console
2. Click Save again
3. Look for errors
4. Common: "403 Forbidden" = no permission to edit
5. Contact administrator if permission issue

**Step 6: Log Out and Back In**
- Session may have expired
- Log out, log back in, try again

**Step 7: Try Different Browser**
- Browser-specific bug
- Test in Chrome, Edge, or Firefox

**Still not saving?** Contact support with details of what you're trying to save

---

### "Permission Denied" or "Access Denied" Errors

**Symptoms:**
- Error message: "You don't have permission to perform this action"
- Can view data but can't edit
- Features are grayed out or disabled

**Solutions:**

**Understanding Permissions:**
- Your role determines what you can do
- Example: Drivers can view vehicles but not edit

**Step 1: Verify Your Role**
1. Click profile icon → Account Settings
2. Check your role (Driver, Manager, Admin, etc.)
3. See [USER_GUIDE.md](USER_GUIDE.md) for role permissions

**Step 2: Request Access**
- If you need additional permissions:
  1. Contact your fleet administrator
  2. Explain what access you need
  3. Administrator can change your role or grant specific permissions

**Step 3: Check Resource Ownership**
- Some resources restricted to creator/owner
- Example: You can only edit your own expense reports
- If you need to edit someone else's data, ask them to reassign to you

**Step 4: Log Out and Back In**
- Permissions cached in session
- If administrator just changed your role, log out/in to refresh

**If you believe you should have access:** Contact administrator

---

### Data Appears Incorrect or Outdated

**Symptoms:**
- Vehicle mileage seems wrong
- Fuel data doesn't match receipts
- Maintenance records missing

**Solutions:**

**Step 1: Refresh Page**
- Data cached in browser
- Press F5 to reload fresh data

**Step 2: Check Data Source**
- **Manual entry:** Someone may have entered wrong data
  - Check who last edited (audit log)
  - Correct the error
- **Imported/Synced:** Integration may have imported wrong data
  - Check integration sync logs
  - Contact administrator

**Step 3: Check Filters**
- You may be filtering data without realizing
- Look for active filters at top of page
- Clear all filters

**Step 4: Check Date Range**
- Reports and lists often filtered by date
- Expand date range to see all data

**Step 5: Check Vehicle Assignment**
- Data may be assigned to wrong vehicle
- Search for data by date/driver instead of vehicle

**Step 6: Check Audit Logs (Admin)**
- See who changed what and when
- Helps identify source of incorrect data

**For Missing Data:**
- May have been deleted
- Check with administrator - may be recoverable from backup

---

## Mobile App Issues

### Mobile App Won't Install

**Symptoms:**
- Can't download app from App Store/Google Play
- Error during installation

**Solutions:**

**For iPhone/iPad (iOS):**

**Step 1: Check iOS Version**
- Go to Settings → General → About → Software Version
- Fleet app requires iOS 13 or later
- Update iOS if needed: Settings → General → Software Update

**Step 2: Check Storage Space**
- App requires ~100MB
- Free up space: Delete unused apps, photos

**Step 3: Restart Device**
- Power off completely
- Power back on
- Try install again

**For Android:**

**Step 1: Check Android Version**
- Go to Settings → About Phone → Android Version
- Fleet app requires Android 8.0 or later
- If older, device may not be supported

**Step 2: Check Storage Space**
- App requires ~100MB
- Free up space in Settings → Storage

**Step 3: Enable "Unknown Sources" (if installing APK)**
- Only if installing outside Google Play
- Settings → Security → Unknown Sources

**Step 4: Clear Google Play Cache**
- Settings → Apps → Google Play Store → Storage → Clear Cache

**Both Platforms:**
- Check internet connection
- Try on WiFi instead of cellular
- Restart app store
- Sign out and back into app store account

---

### Can't Log Into Mobile App

**Symptoms:**
- App installed but can't log in
- "Invalid credentials" error on mobile

**Solutions:**

**Step 1: Verify URL**
- App asks for "Fleet URL" on first run
- Enter your organization's URL exactly:
  - Correct: `https://fleet.capitaltechalliance.com`
  - Wrong: `fleet.capitaltechalliance.com` (missing https://)
  - Wrong: `www.fleet.capitaltechalliance.com`
- Get correct URL from administrator or email welcome message

**Step 2: Use Same Credentials as Web**
- Mobile app uses same login as web version
- Try logging into web version first to verify credentials

**Step 3: Microsoft SSO on Mobile**
- If using Microsoft SSO:
  1. Tap "Sign in with Microsoft"
  2. May open browser for authentication
  3. Complete Microsoft login
  4. Approve any prompts
  5. Should redirect back to app

**Step 4: Grant Permissions**
- App may need permissions to function:
  - Location (for GPS tracking)
  - Camera (for photos)
  - Notifications (for alerts)
- Grant all requested permissions

**Step 5: Reinstall App**
1. Delete app
2. Restart device
3. Reinstall from app store
4. Try logging in again

---

### GPS Not Tracking on Mobile

**Symptoms:**
- Trips not recording location
- "Enable location services" message
- Location stuck or not updating

**Solutions:**

**Step 1: Enable Location Services**

**iPhone:**
1. Settings → Privacy → Location Services
2. Turn on Location Services
3. Find Fleet app
4. Select "Always" or "While Using"

**Android:**
1. Settings → Location
2. Turn on Location
3. Settings → Apps → Fleet → Permissions → Location
4. Select "Allow all the time" or "Allow only while using"

**Step 2: Check Location Accuracy**

**iPhone:**
- Settings → Privacy → Location Services
- Scroll down → System Services
- Turn on "Location Accuracy"

**Android:**
- Settings → Location → Google Location Accuracy
- Turn on "Improve Location Accuracy"

**Step 3: Disable Battery Saver**
- Battery saver modes limit GPS
- Disable or add Fleet app to exceptions

**Step 4: Check App Permissions**
- Open Fleet app → Settings
- Verify location permission is granted

**Step 5: Toggle Airplane Mode**
1. Turn on airplane mode
2. Wait 10 seconds
3. Turn off airplane mode
4. Resets GPS/cellular connections

**Step 6: Restart Device**
- Power off completely
- Power back on
- Launch app and test

**Still not working?**
- May be hardware GPS issue
- Try in different location (open area)
- Contact support

---

### Mobile App Battery Drain

**Symptoms:**
- Phone battery dies quickly when using Fleet app
- Battery gets hot

**Solutions:**

**Understanding Battery Usage:**
- GPS tracking is battery-intensive
- Normal to see increased battery usage
- Expected: ~10-20% battery per hour of active tracking

**To Reduce Battery Usage:**

**Step 1: Enable Battery Saver Mode (in app)**
1. Open Fleet app
2. Go to Settings
3. Turn on "Battery Saver Mode"
4. Reduces GPS update frequency (every 2 minutes instead of 30 seconds)

**Step 2: Close App When Not Needed**
- If not on active trip, close app
- Background tracking still works but uses less battery

**Step 3: Reduce Screen Brightness**
- Screen uses significant battery
- Lower brightness when not needed

**Step 4: Keep Phone Cool**
- Don't leave in direct sunlight
- Remove from hot dashboard

**Step 5: Use Car Charger**
- For long trips, keep phone plugged into car charger
- Prevents battery drain

**Step 6: Check Battery Health**
- Old batteries don't hold charge well
- iPhone: Settings → Battery → Battery Health
- Android: Settings → Battery → Battery Usage
- Replace battery if health < 80%

**If Excessive Battery Drain:**
- App may have bug
- Update to latest version
- Contact support if issue persists

---

## Email and Notification Problems

### Not Receiving Email Notifications

**Symptoms:**
- Should receive email alerts but nothing arrives
- Others receive emails but you don't

**Solutions:**

**Step 1: Check Email Address**
1. Click profile → Account Settings
2. Verify email address is correct
3. Update if wrong

**Step 2: Check Spam/Junk Folder**
- Fleet emails may be filtered as spam
- Search spam folder for emails from:
  - `fleetalerts@company.com`
  - `noreply@capitaltechalliance.com`
- If found in spam:
  1. Mark as "Not Spam"
  2. Add sender to contacts/safe senders list

**Step 3: Check Email Filters/Rules**
- Email client may have rules that move Fleet emails
- Check email rules/filters
- Disable or modify rules

**Step 4: Check Notification Preferences**
1. Profile → Notification Settings
2. Verify email notifications are enabled
3. Check which alerts you've subscribed to
4. Enable alerts you want to receive

**Step 5: Test Email**
1. Notification Settings
2. Click "Send Test Email"
3. Check if test email arrives
4. If yes, issue is with specific alert types
5. If no, issue is with email delivery

**Step 6: Whitelist Sender**
- Contact your IT department
- Ask them to whitelist Fleet email addresses:
  - `fleetalerts@company.com`
  - `noreply@capitaltechalliance.com`
  - Your organization's domain

**Step 7: Check Email Server (Admin)**
- Administrator can check SMTP settings and logs
- May be system-wide email delivery issue

**Still not receiving?** Contact support with:
- Your email address
- Which notifications you're missing
- When you last received an email (if ever)

---

### Push Notifications Not Working on Mobile

**Symptoms:**
- Mobile app installed but no push notifications
- Notifications work on web but not mobile

**Solutions:**

**Step 1: Enable Notifications in Device Settings**

**iPhone:**
1. Settings → Notifications
2. Find Fleet app
3. Turn on "Allow Notifications"
4. Enable: Alerts, Sounds, Badges

**Android:**
1. Settings → Apps → Fleet
2. Notifications
3. Turn on "Show Notifications"
4. Enable all notification categories

**Step 2: Enable Notifications in App**
1. Open Fleet app
2. Settings → Notifications
3. Turn on "Push Notifications"
4. Enable specific alert types you want

**Step 3: Check Do Not Disturb**
- Device may be in Do Not Disturb mode
- Disable or add Fleet to DND exceptions

**Step 4: Test Notification**
1. In app settings
2. Tap "Send Test Notification"
3. Should receive test notification immediately

**Step 5: Reinstall App**
- Notifications may not be registered properly
1. Delete app
2. Restart device
3. Reinstall app
4. Grant notification permissions
5. Test again

**Step 6: Check App Version**
- Update to latest app version
- Old versions may have notification bugs

**Still not working?** Contact support

---

## Report Generation Issues

### Report Shows "No Data" or Empty

**Symptoms:**
- Generated report is empty
- "No data available for selected criteria"
- Expected to see data but report is blank

**Solutions:**

**Step 1: Check Date Range**
- Most common issue: Date range doesn't include data
- Expand date range (e.g., last year instead of last week)
- Or narrow date range if looking for specific timeframe

**Step 2: Check Filters**
- You may have filters that exclude all data
- Example: Filtered by vehicle that had no activity
- Clear all filters and try again

**Step 3: Check Permissions**
- You may not have permission to view certain data
- Example: Drivers can only see their own vehicles
- Try report for data you know you can access

**Step 4: Verify Data Exists**
- Make sure data was actually entered
- Example: Can't run fuel report if no fuel purchases recorded
- Check source data before generating report

**Step 5: Try Different Report**
- Issue may be specific to one report type
- Try a different report to see if problem persists

**Step 6: Check with Others**
- Ask colleagues to run same report
- If works for them, issue is with your permissions/settings
- If fails for everyone, may be system bug

**Still no data?** Contact support with:
- Report type
- Filters and date range used
- What data you expected to see

---

### Report Generation Times Out or Fails

**Symptoms:**
- Click "Generate Report" but nothing happens
- Spinner spins then shows error
- "Report generation failed" or "Request timeout"

**Solutions:**

**Step 1: Reduce Data Size**
- Large date ranges timeout
- Try shorter date range:
  - Instead of 5 years, try 1 year
  - Instead of 1 year, try 1 month
- Run multiple smaller reports if needed

**Step 2: Reduce Filters**
- Too many filters can slow query
- Simplify filters
- Focus on essential criteria

**Step 3: Try Different Time**
- System may be busy during peak hours
- Try during off-peak (early morning, late evening)
- More computing resources available when fewer users online

**Step 4: Use Scheduled Reports**
- Instead of running on-demand:
1. Go to Custom Report Builder
2. Create report
3. Click "Schedule"
4. Set to run at specific time (e.g., 2am)
5. Receive emailed when complete
- Scheduled reports have longer timeout limits

**Step 5: Export Data and Analyze Externally**
- If report builder fails:
1. Go to Data Workbench
2. Export raw data (CSV)
3. Analyze in Excel or other tool

**Step 6: Contact Administrator**
- Report generation may be limited by system resources
- Administrator can increase timeout limits or optimize database

**For Large Fleets:**
- Reports on hundreds of vehicles may take time
- Be patient or use scheduled reports

---

### Report Data Seems Wrong

**Symptoms:**
- Numbers don't match expectations
- Totals don't add up
- Data conflicts with other reports

**Solutions:**

**Step 1: Understand Report Calculations**
- Read report description/help
- Check how metrics are calculated
- Example: "Average MPG" may exclude idling time

**Step 2: Verify Filters**
- Check what data is included/excluded
- Example: Report filtered by "Available vehicles" excludes "In Maintenance"

**Step 3: Compare with Source Data**
- Drill down to individual records
- Verify report matches source data
- Example: Check fuel report against individual fuel purchases

**Step 4: Check Date Range Boundaries**
- Partial periods may affect calculations
- Example: "Last month" may be incomplete if run mid-month

**Step 5: Check Data Quality**
- Report accuracy depends on data quality
- If fuel data entered wrong, fuel report will be wrong
- Audit source data for errors

**Step 6: Compare Report Types**
- Run different report types to cross-check
- Example: Compare "Fleet Summary" with "Vehicle Detail" reports
- Should tell same story

**Step 7: Contact Support**
- Provide specific examples of discrepancies
- Support can review report queries and calculations

---

## Integration Problems

### Fuel Card Data Not Importing

**Symptoms:**
- Fuel card integration enabled but no data
- Missing recent fuel purchases
- Integration status shows error

**Solutions:**

**Step 1: Check Integration Status**
1. Settings → Integrations → Fuel Cards
2. Check status indicator:
   - Green = working
   - Yellow = warning
   - Red = error
3. If error, read error message

**Step 2: Test Connection**
1. Click "Test Connection"
2. If fails:
   - API credentials may be expired
   - Contact fuel card provider for new credentials
   - Update credentials in Fleet system

**Step 3: Check Sync Schedule**
- Integration may sync hourly or daily
- Check last sync time
- Click "Sync Now" to force immediate sync

**Step 4: Check Vehicle Matching**
- Fuel purchases matched to vehicles by:
  - Fleet number
  - License plate
  - Card number
- If no match found, purchase not imported
- Verify your vehicles have correct identifiers

**Step 5: Review Sync Logs**
1. Click "View Sync Logs"
2. Look for errors:
   - "No matching vehicle" = vehicle matching issue
   - "API rate limit" = too many requests, wait and retry
   - "Authentication failed" = credentials invalid

**Step 6: Manual Import Workaround**
- While troubleshooting:
  1. Download fuel data from fuel card provider
  2. Use Fleet system's bulk import feature
  3. Upload CSV file

**Step 7: Contact Support**
- Provide integration name (WEX, Fuelman, etc.)
- Provide error messages from logs
- May require integration reconfiguration

---

### Microsoft Teams Integration Not Working

**Symptoms:**
- Can't send Teams messages from Fleet
- Messages not appearing in Teams channel
- "Authorization failed" error

**Solutions:**

**Step 1: Check Integration Status**
1. Settings → Integrations → Microsoft Teams
2. Check if enabled and connected

**Step 2: Re-Authorize**
- Authorization may have expired
1. Click "Re-Authorize"
2. Sign in with admin account
3. Grant permissions
4. Test connection

**Step 3: Check Permissions**
- Azure AD app needs Microsoft Graph permissions:
  - `ChannelMessage.Send`
  - `Chat.ReadWrite`
- Contact Azure AD administrator to verify

**Step 4: Check Team/Channel Selection**
- Verify correct Team and Channel are selected
- You must be member of selected Team
- Channel must allow posts

**Step 5: Test with Different Channel**
- Try selecting different channel
- Helps isolate issue to specific channel

**Step 6: Check Teams Policies**
- Your organization may have Teams policies blocking external apps
- Contact Microsoft Teams administrator

**Step 7: Use Alternative**
- While troubleshooting, use Email Center instead
- Or send Teams messages directly (not through Fleet)

**Contact Support:** Provide Teams administrator contact info for assistance

---

### Azure Maps Not Loading

**Symptoms:**
- GPS tracking shows blank map
- Error: "Failed to load map tiles"
- Map partially loads then stops

**Solutions:**

**Step 1: Check Azure Maps Integration**
1. Settings → Integrations → Azure Maps
2. Verify integration is enabled
3. Click "Test Connection"

**Step 2: Check API Key**
- Azure Maps subscription key may be invalid
- Administrator needs to verify key in Azure Portal
- Check Azure Maps account status (active, suspended, expired)

**Step 3: Check API Quota**
- Azure Maps free tier has transaction limits
- If exceeded, maps won't load
- Administrator can check usage in Azure Portal
- Solution: Upgrade Azure Maps tier or wait for quota reset

**Step 4: Check Firewall**
- Firewall may be blocking Azure Maps URLs
- Whitelist:
  - `*.atlas.microsoft.com`
  - `*.azure.com`
- Contact network administrator

**Step 5: Use Alternative Map Provider**
- If administrator has configured backup:
  1. Click map settings
  2. Switch to Google Maps or Mapbox

**This is Administrator Issue:**
- Regular users cannot fix Azure Maps integration
- Contact administrator or support

---

## Browser Compatibility Issues

### Features Not Working in Internet Explorer

**Symptoms:**
- Pages don't display correctly in IE
- Buttons don't work
- Error messages

**Solution:**

**Internet Explorer is NOT supported**

**Use a modern browser instead:**
- Google Chrome (recommended)
- Microsoft Edge (recommended)
- Mozilla Firefox
- Apple Safari

**Why not IE?**
- Internet Explorer is outdated and no longer maintained by Microsoft
- Modern web technologies used by Fleet system are not supported in IE

**To switch:**
1. Download Chrome or Edge
2. Install
3. Use Chrome/Edge to access Fleet system
4. Set as default browser

**If your organization requires IE for other applications:**
- Use Edge for Fleet system
- Use IE for legacy applications

---

### Display Issues on Small Screens

**Symptoms:**
- Layout broken on laptop or tablet
- Text overlapping
- Buttons cut off
- Horizontal scrolling required

**Solutions:**

**Step 1: Check Zoom Level**
- Browser may be zoomed in/out
- Reset zoom to 100%:
  - Press Ctrl+0 (Windows)
  - Press Cmd+0 (Mac)

**Step 2: Maximize Browser Window**
- Fleet optimized for larger screens
- Maximize browser window for best experience

**Step 3: Hide Browser Bookmarks Bar**
- Gives more vertical space
- Chrome/Edge: Ctrl+Shift+B to toggle
- Firefox: Ctrl+Shift+B
- Safari: Cmd+Shift+B

**Step 4: Use Mobile App**
- If on tablet:
  - Download mobile app instead
  - Better optimized for touch and smaller screens

**Step 5: Adjust Browser Settings**
- Some browsers have text size settings
- Reset to default size

**Minimum Recommended Resolution:**
- Desktop: 1366x768 or higher
- Tablet: 1024x768 or higher (landscape)

---

### Dark Mode Not Working

**Symptoms:**
- Dark mode toggle exists but doesn't change theme
- Stays in light mode

**Solutions:**

**Step 1: Check Dark Mode Setting**
1. Click profile → Settings
2. Look for "Appearance" or "Theme"
3. Toggle dark mode on

**Step 2: Clear Cache**
- Theme preference cached
- Clear browser cache
- Refresh page

**Step 3: Check Browser Settings**
- Some browsers override website themes
- Check browser appearance settings

**Step 4: Try Different Browser**
- Feature may not work in all browsers
- Test in Chrome or Edge

**Feature Not Yet Available?**
- Dark mode may be planned feature not yet released
- Check with administrator

---

## When to Contact Support

### Contact Support If:

- You've tried all troubleshooting steps above
- Issue affects multiple users
- Issue prevents critical work
- You see error messages you don't understand
- System is completely down
- Data loss or corruption
- Security concern

### Before Contacting Support, Gather:

**1. Issue Details:**
- What were you trying to do?
- What happened instead?
- Error messages (exact text)
- When did issue start?
- How often does it happen?

**2. Environment Information:**
- Browser and version (Chrome 120, Edge 119, etc.)
- Operating system (Windows 11, macOS 14, iOS 17, Android 13)
- Device type (laptop, desktop, phone, tablet)
- Network (office WiFi, home, cellular)

**3. Steps to Reproduce:**
- List exact steps that cause the issue
- Include which buttons you clicked
- Include what you typed/entered

**4. Screenshots:**
- Screenshot of error message
- Screenshot of browser console (F12 → Console) if available
- Screenshot showing issue

**5. Account Information:**
- Your email address
- Your organization/tenant name
- Your role (Driver, Manager, Admin)

### How to Contact Support:

**Email Support:**
- Address: `support@capitaltechalliance.com`
- Response time: Within 24 hours (weekdays)
- Best for: Non-urgent issues, detailed explanations

**Phone Support:**
- Phone: 1-800-FLEET-HELP
- Hours: Monday-Friday, 8am-5pm EST
- Best for: Urgent issues, walk-through troubleshooting

**Emergency Support (System Down):**
- Call main number, press 1 for critical support
- Available: 24/7
- Use only for: System completely down, critical data loss

**Portal/Ticket System:**
- Access: Profile menu → Help & Support → Submit Ticket
- Best for: Tracking issues, attaching files

### Response Time Expectations:

**Priority Levels:**

- **Critical (P1):** System down, data loss
  - Response: 1 hour
  - Resolution target: 4 hours

- **High (P2):** Major feature broken, many users affected
  - Response: 4 hours
  - Resolution target: 1 business day

- **Medium (P3):** Feature not working, workaround available
  - Response: 1 business day
  - Resolution target: 3 business days

- **Low (P4):** Minor issue, cosmetic, feature request
  - Response: 2 business days
  - Resolution target: As resources allow

### What to Expect:

1. **Initial Response:**
   - Acknowledgment of your issue
   - Assigned ticket number
   - Estimated resolution time

2. **Troubleshooting:**
   - Support may ask for additional information
   - May request remote session to see issue
   - May request test credentials

3. **Resolution:**
   - Fix applied or workaround provided
   - Explanation of what was wrong
   - Tips to prevent recurrence

4. **Follow-Up:**
   - Verification that issue is resolved
   - Satisfaction survey

---

## Escalation Process

If you're not satisfied with support response:

**Level 1: Support Team**
- Email: `support@capitaltechalliance.com`
- First point of contact

**Level 2: Support Manager**
- If issue not resolved in timely manner
- Request escalation in your support ticket

**Level 3: Fleet Administrator**
- Contact your organization's fleet administrator
- They have direct line to vendor support

**Level 4: Account Manager**
- For contractual issues or major problems
- Your organization's account manager contact

---

## Additional Resources

**Documentation:**
- [User Guide](USER_GUIDE.md) - Getting started
- [Admin Guide](ADMIN_GUIDE.md) - Administrator reference
- [Quick Reference](QUICK_REFERENCE.md) - Cheat sheet
- [API Documentation](API_DOCUMENTATION.md) - Developer reference

**Video Tutorials:**
- Access: Profile menu → Help & Support → Video Library
- Topics: Login, GPS Tracking, Reports, Mobile App, etc.

**Knowledge Base:**
- Access: Profile menu → Help & Support → Knowledge Base
- Searchable articles on common topics

**Community Forum:**
- Share tips with other Fleet users
- Ask questions
- See what's coming in future releases

**Release Notes:**
- Profile menu → What's New
- See latest features and bug fixes

---

**Version:** 1.0
**Last Updated:** November 2025
**Maintained by:** Capital Tech Alliance
**Need More Help?** Contact `support@capitaltechalliance.com`
