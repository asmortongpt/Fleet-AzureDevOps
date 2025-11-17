# App Store Screenshots Guide - DCF Fleet Management

**Version:** 1.0.0
**Last Updated:** November 11, 2025
**Status:** Production Ready

---

## Overview

This guide provides comprehensive instructions for capturing App Store screenshots for DCF Fleet Management. Apple requires screenshots for multiple device sizes to showcase your app across all iPhone models.

---

## Required Screenshot Sizes

### Mandatory Sizes

| Size | Display | Devices | Resolution | Aspect Ratio |
|------|---------|---------|------------|--------------|
| 6.7" | iPhone 15 Pro Max, 14 Pro Max | Latest large | 1290 x 2796 px | 19.5:9 |
| 6.5" | iPhone 11 Pro Max, XS Max | Large phones | 1242 x 2688 px | 19.5:9 |
| 5.5" | iPhone 8 Plus, 7 Plus | Classic Plus | 1242 x 2208 px | 16:9 |

### Optional (Recommended)

| Size | Display | Devices | Resolution |
|------|---------|---------|------------|
| 5.8" | iPhone XS, X | Edge-to-edge | 1125 x 2436 px |
| 6.1" | iPhone 14, 13 | Standard | 1170 x 2532 px |

**Recommendation:** Capture all 3 mandatory sizes. Apple scales appropriately for other devices.

---

## Screenshot Requirements

### Technical Specifications

- **Format:** PNG or JPEG (PNG preferred for quality)
- **Color Space:** RGB (no CMYK)
- **Maximum:** 10 screenshots per size
- **Minimum:** 1 screenshot per size
- **Recommended:** 5 screenshots per size
- **File Size:** Under 500 KB each (PNG compression)
- **No Alpha:** Fully opaque background required
- **Status Bar:** Can be hidden or shown (consistent across all)

### Content Guidelines

✅ **Allowed:**
- Actual app interface screenshots
- Overlaid text and graphics
- Device frames (optional)
- Annotations and callouts
- Feature highlights
- Benefit descriptions

❌ **Not Allowed:**
- Sensitive user data
- Profanity or offensive content
- Copyrighted material without permission
- Misleading information
- Competitors' names or logos
- Pricing information that may change
- Bug or placeholder content

---

## Screenshot Strategy

### 5-Screenshot Sequence

The optimal screenshot sequence tells a story and highlights key features:

1. **Dashboard/Hero Shot** - First impression, shows app overview
2. **Core Feature #1** - Most important feature (GPS tracking)
3. **Core Feature #2** - Second most important (OBD2 diagnostics)
4. **Unique Value** - Differentiator (offline mode, inspections)
5. **Trust/Security** - Builds confidence (compliance badges, testimonials)

---

## Screenshot 1: Dashboard with Fleet Metrics

### Purpose
Show the main dashboard with comprehensive fleet overview. This is the first impression and should showcase the app's polished, professional interface.

### Screen to Capture
**View:** `DashboardView.swift`
**State:** Logged in, with populated fleet data

### Setup Instructions

1. **Launch App in Simulator**
   ```bash
   # For 6.7" display (iPhone 15 Pro Max)
   open -a Simulator
   # Hardware > Device > iPhone 15 Pro Max
   ```

2. **Configure Test Data**
   - Ensure 8-12 vehicles in fleet
   - Show realistic metrics:
     * Total Vehicles: 47
     * Active Trips: 8
     * Vehicles Needing Maintenance: 3
     * Total Miles Today: 1,247 mi
   - Display recent activity feed (last 5 items)

3. **Visual Setup**
   - Set time to 10:30 AM (professional time)
   - Full battery and signal strength
   - Clear notifications
   - Clean status bar

4. **Capture Method**
   ```
   Simulator > File > New Screen Shot (Cmd+S)
   or
   Device Screenshot tool in Xcode > Cmd+Shift+5
   ```

5. **Post-Processing**
   - Add device frame (optional): use Screenshot Creator tools
   - Add overlaid text:
     * Top: "MANAGE YOUR ENTIRE FLEET"
     * Bottom: "Real-time monitoring and analytics"
   - Font: SF Pro Display, Bold, 48pt
   - Color: White with 80% opacity shadow
   - Position: Centered, 100px from edges

### Key Elements to Show
- ✅ Fleet metrics cards with numbers
- ✅ Recent activity feed
- ✅ Quick action buttons
- ✅ Modern, clean interface
- ✅ Navigation tabs at bottom
- ✅ Professional color scheme

### Example Annotations
```
[Top text overlay, white, bold]
"REAL-TIME FLEET MONITORING"

[Bottom text overlay, white, medium]
"Comprehensive dashboard with live metrics and analytics"
```

---

## Screenshot 2: Vehicle Details with OBD2 Diagnostics

### Purpose
Showcase the advanced OBD2 diagnostic capabilities - a key differentiator.

### Screen to Capture
**View:** `OBD2DiagnosticsView.swift` within `VehicleDetailView.swift`
**State:** Connected to OBD2 device (or demo mode), showing live data

### Setup Instructions

1. **Navigate to Vehicle Details**
   - From Dashboard, tap on a vehicle
   - Switch to "Diagnostics" tab
   - Enable demo mode if no OBD2 adapter available

2. **Configure Diagnostic Data**
   - Show realistic OBD2 readings:
     * Engine RPM: 1,847 RPM
     * Vehicle Speed: 45 MPH
     * Coolant Temp: 195°F
     * Fuel Level: 68%
     * Battery Voltage: 14.2V
     * Throttle Position: 32%
     * Engine Load: 28%
     * Intake Air Temp: 72°F
   - Display status: "Connected" with green indicator
   - Show timestamp: "Updated 2 seconds ago"

3. **Visual Setup**
   - Ensure all gauges are visible
   - Show smooth animations (capture at good frame)
   - Display connection status clearly
   - Include vehicle info header

4. **Capture Screenshot**
   - Wait for animations to settle
   - Ensure all metrics are visible
   - Capture with Cmd+S

5. **Post-Processing**
   - Add device frame
   - Add text overlay:
     * Top: "ADVANCED OBD2 DIAGNOSTICS"
     * Bottom: "Real-time vehicle health monitoring"
   - Add callout arrows pointing to key metrics
   - Highlight "22 PIDs Supported" badge

### Key Elements to Show
- ✅ Multiple OBD2 metric cards
- ✅ Connection status indicator
- ✅ Real-time data with timestamps
- ✅ Visual gauges or charts
- ✅ Professional diagnostic interface
- ✅ "Connected" status badge

### Example Annotations
```
[Top text overlay]
"22+ VEHICLE DIAGNOSTICS IN REAL-TIME"

[Callout arrows pointing to:]
→ Engine RPM gauge
→ Temperature readings
→ Fuel efficiency
→ Connection status

[Bottom text overlay]
"Monitor engine health, fuel efficiency, and performance"
```

---

## Screenshot 3: Active Trip Tracking with Map

### Purpose
Demonstrate GPS tracking capability with interactive map and real-time location.

### Screen to Capture
**View:** `TripTrackingView.swift`
**State:** Active trip in progress with route shown on map

### Setup Instructions

1. **Start a Trip**
   - Navigate to Trips tab
   - Tap "Start Trip" button
   - Simulate location in Xcode:
     * Debug > Simulate Location > City Run
     * Or use GPX file with realistic route

2. **Configure Trip Display**
   - Show realistic trip data:
     * Duration: 1h 24m
     * Distance: 47.3 miles
     * Avg Speed: 34 MPH
     * Current Speed: 45 MPH
     * Route color: Blue polyline on map
   - Display vehicle marker moving along route
   - Show "Recording" status with red indicator

3. **Map Setup**
   - Zoom level: Show entire route + some surrounding area
   - Map type: Standard (not satellite)
   - Show multiple tracking points (breadcrumbs)
   - Include street names and labels
   - Center on vehicle location

4. **Visual Setup**
   - Ensure map is loaded fully
   - Show clear route polyline
   - Display trip metrics overlay
   - Include start/stop button prominently

5. **Capture Screenshot**
   - Wait for map to fully render
   - Ensure route is clearly visible
   - Capture at moment with good map detail

6. **Post-Processing**
   - Add device frame
   - Add text overlay:
     * Top: "LIVE GPS TRACKING"
     * Bottom: "Track trips with sub-5-meter accuracy"
   - Add pulsing effect to vehicle marker (Photoshop)
   - Highlight accuracy indicator

### Key Elements to Show
- ✅ Interactive map with route
- ✅ Real-time trip metrics
- ✅ Vehicle location marker
- ✅ Route polyline/breadcrumbs
- ✅ Trip controls (stop/pause)
- ✅ Speed and distance display

### Example Annotations
```
[Top text overlay]
"REAL-TIME GPS TRACKING"

[Metrics overlay card, semi-transparent]
├─ Duration: 1h 24m
├─ Distance: 47.3 mi
├─ Avg Speed: 34 mph
└─ Accuracy: ±3 meters

[Bottom text overlay]
"Sub-5-meter GPS accuracy with automatic trip recording"
```

---

## Screenshot 4: Vehicle Inspection Checklist

### Purpose
Showcase the digital inspection feature - reduces paperwork and improves compliance.

### Screen to Capture
**View:** `VehicleInspectionView.swift`
**State:** Mid-inspection, some items checked, photo captured

### Setup Instructions

1. **Start Inspection**
   - Navigate to Vehicle Details
   - Tap "Start Inspection" button
   - Select "Pre-Trip Inspection"

2. **Configure Inspection State**
   - Show 23-point checklist:
     * 8 items checked (green checkmarks)
     * 2 items flagged (yellow warnings)
     * 1 item failed (red X)
     * 12 items unchecked
   - Show at least one photo attachment
   - Display vehicle info header
   - Show progress indicator: "11/23 Complete"

3. **Key Checklist Items to Show**
   ```
   ✅ Tire Pressure - All Normal
   ✅ Engine Oil Level - Good
   ⚠️  Windshield - Minor Chip
   ✅ Brake Lights - Working
   ❌ Wiper Blades - Worn (Need Replacement)
   ✅ Horn - Operational
   ⚠️  Body Damage - Small Dent (See Photo)
   ☐ Emergency Equipment
   ☐ Fire Extinguisher
   ☐ First Aid Kit
   [... more items ...]
   ```

4. **Photo Example**
   - Show thumbnail of damage photo
   - Add timestamp on photo
   - Include "Tap to view" indicator

5. **Visual Setup**
   - Scroll to show variety of states
   - Ensure progress bar is visible
   - Show inspection type badge
   - Display date and inspector info

6. **Capture Screenshot**
   - Position to show mixed statuses
   - Include submit button at bottom
   - Capture with good item variety visible

7. **Post-Processing**
   - Add device frame
   - Add text overlay:
     * Top: "DIGITAL VEHICLE INSPECTIONS"
     * Bottom: "23-point checklist with photo documentation"
   - Highlight progress indicator
   - Add badge: "Paperless Compliance"

### Key Elements to Show
- ✅ Multi-item checklist with checkboxes
- ✅ Status indicators (✓, ⚠, ✗)
- ✅ Photo attachments
- ✅ Progress tracking
- ✅ Professional inspection interface
- ✅ Easy-to-use controls

### Example Annotations
```
[Top text overlay]
"COMPREHENSIVE VEHICLE INSPECTIONS"

[Feature callouts with arrows]
→ "23-point digital checklist"
→ "Photo documentation"
→ "Pass/Warn/Fail status"
→ "Progress tracking"

[Bottom text overlay]
"Go paperless with compliant digital inspections"
```

---

## Screenshot 5: Settings and Security/Compliance

### Purpose
Build trust by showcasing security features, compliance badges, and professional settings.

### Screen to Capture
**View:** Custom compliance screen or Settings with security info
**Alternative:** Create marketing screen with compliance badges

### Option A: Compliance Badge Screen

Create a marketing screen showing:

1. **Top Section: App Logo + Tagline**
   ```
   [DCF Fleet Logo]
   "Enterprise-Grade Security & Compliance"
   ```

2. **Compliance Badges (Grid Layout)**
   ```
   [NIST SP 800-175B]    [FIPS 140-2]
         ✓ Compliant       Level 2 Certified

   [SOC 2 Type II]       [FISMA]
       ✓ Certified       ✓ Compliant

   [Section 508]         [GDPR]
    ✓ Accessible        ✓ Compliant
   ```

3. **Security Features List**
   ```
   🔐 AES-256 Encryption
   🔐 Biometric Authentication
   🔐 Certificate Pinning
   🔐 Jailbreak Detection
   🔐 Security Event Logging
   ```

4. **Trust Indicators**
   ```
   ⭐ 4.9 Rating (50+ Reviews)
   ✓ 99.95% Uptime
   ✓ 1,200+ Active Users
   ✓ 24/7 Support
   ```

5. **Bottom CTA**
   ```
   "Trusted by Government Agencies Nationwide"
   ```

### Option B: Settings Screen with Security

**View:** Settings/Profile screen showing:

1. **Setup Instructions**
   - Navigate to Settings tab
   - Show sections:
     * Account Info (with face/avatar)
     * Security Settings
     * Compliance Information
     * About/Version
     * Privacy Policy
     * Support

2. **Security Section Items**
   ```
   🔒 Biometric Login [Enabled - Face ID]
   🔑 Two-Factor Authentication [Enabled]
   📱 Jailbreak Detection [Passed]
   🔐 Encryption Status [Active - AES-256]
   📊 Security Log [View Events]
   ```

3. **Compliance Section**
   ```
   ✓ NIST SP 800-175B Compliant
   ✓ FISMA Certified
   ✓ SOC 2 Type II Certified
   ✓ Section 508 Accessible
   [View Certificates]
   ```

4. **Visual Setup**
   - Clean, professional settings UI
   - Green checkmarks for enabled features
   - Badges for certifications
   - Version number visible

5. **Capture Screenshot**
   - Show complete settings screen
   - Ensure all security info visible
   - Include user profile info

6. **Post-Processing**
   - Add device frame
   - Add text overlay:
     * Top: "GOVERNMENT-GRADE SECURITY"
     * Bottom: "NIST, FISMA, SOC 2 certified"
   - Highlight compliance badges
   - Add "Trusted by Gov Agencies" badge

### Key Elements to Show
- ✅ Compliance certifications
- ✅ Security features list
- ✅ Trust indicators (ratings, uptime)
- ✅ Professional branding
- ✅ Contact/support info
- ✅ Privacy and security emphasis

### Example Annotations
```
[Top text overlay]
"TRUSTED BY GOVERNMENT AGENCIES"

[Certification badges, center]
[NIST] [FISMA] [SOC 2] [FIPS 140-2]
[Section 508] [GDPR] [CCPA]

[Feature list with icons]
✓ AES-256 Encryption
✓ Biometric Security
✓ Certificate Pinning
✓ 99.95% Uptime
✓ 24/7 Support

[Bottom text overlay]
"Enterprise-grade security and compliance"
```

---

## Device-Specific Instructions

### 6.7" iPhone (iPhone 15 Pro Max)

**Simulator Setup:**
```bash
# Launch Xcode
open -a Xcode

# Select simulator
Xcode > Open Developer Tool > Simulator

# Choose device
Hardware > Device > iPhone 15 Pro Max

# Set appearance
Settings > Developer > Dark Appearance (toggle for light/dark)
```

**Screenshot Command:**
```bash
# Take screenshot
Cmd + S (in Simulator)

# Or via xcrun
xcrun simctl io booted screenshot screenshot-6.7.png
```

**Resolution:** 1290 x 2796 pixels

---

### 6.5" iPhone (iPhone 11 Pro Max)

**Simulator Setup:**
```bash
# Choose device
Hardware > Device > iPhone 11 Pro Max
```

**Screenshot Command:**
```bash
xcrun simctl io booted screenshot screenshot-6.5.png
```

**Resolution:** 1242 x 2688 pixels

---

### 5.5" iPhone (iPhone 8 Plus)

**Simulator Setup:**
```bash
# Choose device
Hardware > Device > iPhone 8 Plus
```

**Screenshot Command:**
```bash
xcrun simctl io booted screenshot screenshot-5.5.png
```

**Resolution:** 1242 x 2208 pixels

---

## Screenshot Capture Workflow

### Preparation Phase

1. **Clean Simulator State**
   ```bash
   # Reset simulator to clean state
   Device > Erase All Content and Settings

   # Or via command line
   xcrun simctl erase all
   ```

2. **Configure Test Environment**
   - Set date/time: January 15, 2025, 10:30 AM
   - Set battery: 100% charged
   - Set signal: Full bars
   - Set carrier: "Capital Tech"
   - Clear notifications

3. **Load Demo Data**
   - Run app with demo flag:
   ```swift
   // In FleetManagementApp.swift
   #if DEBUG
   let useDemoData = true
   #endif
   ```
   - Populate with realistic data
   - Use professional names (no "Test User")

### Capture Phase

1. **For Each Device Size:**
   ```bash
   # Step 1: Launch simulator
   open -a Simulator

   # Step 2: Select device size
   # Hardware > Device > [Select iPhone model]

   # Step 3: Launch app
   xcodebuild -workspace App.xcworkspace \
              -scheme App \
              -destination 'platform=iOS Simulator,name=iPhone 15 Pro Max' \
              -configuration Debug

   # Step 4: Navigate to screen
   # Manual navigation or UI test automation

   # Step 5: Capture screenshot
   xcrun simctl io booted screenshot "screenshot-$(date +%s).png"
   ```

2. **Capture All 5 Screenshots per Size**
   - Screenshot 1: Dashboard
   - Screenshot 2: OBD2 Diagnostics
   - Screenshot 3: Trip Tracking
   - Screenshot 4: Vehicle Inspection
   - Screenshot 5: Settings/Compliance

3. **Verify Quality**
   - Check resolution matches requirements
   - Verify no UI glitches or loading states
   - Ensure text is readable
   - Confirm colors are accurate
   - Check for any test/debug UI

### Post-Processing Phase

1. **Add Device Frames (Optional)**

   **Tools:**
   - **DaVinci Screenshot Framer** (Free, Mac)
   - **Screenshot Creator** (Paid, Mac)
   - **Figma** (Free, web-based)
   - **Sketch** (Paid, Mac)

   **Process:**
   ```
   1. Import screenshot
   2. Select device frame template
   3. Adjust positioning
   4. Export as PNG
   ```

2. **Add Text Overlays**

   **Tools:**
   - **Figma** (Recommended, free)
   - **Adobe Photoshop** (Professional)
   - **Canva** (Simple, web-based)
   - **Pixelmator** (Mac)

   **Typography:**
   - Font: SF Pro Display (Apple's system font)
   - Headline size: 48-64pt, Bold
   - Body size: 32-40pt, Medium
   - Color: White with shadow or dark overlay
   - Position: Top and bottom thirds

   **Text Guidelines:**
   - Keep it short (max 6-8 words)
   - Focus on benefits, not features
   - Use active voice
   - Include keywords
   - Match brand voice

3. **Add Annotations/Callouts (Optional)**
   - Arrow indicators pointing to key features
   - Highlight boxes around important UI
   - Badge overlays (e.g., "NEW", "SECURE")
   - Emoji for visual interest (sparingly)

4. **Optimize File Size**
   ```bash
   # Using pngquant (lossless compression)
   pngquant --quality=65-80 screenshot.png

   # Using ImageOptim (Mac)
   # Drag and drop screenshots to app

   # Or use online tool
   # TinyPNG.com
   ```

   **Target:** Under 500 KB per image

### Quality Assurance

**Checklist for Each Screenshot:**
- [ ] Correct resolution for device size
- [ ] No visible bugs or glitches
- [ ] Professional data (no "Test User" etc.)
- [ ] Consistent status bar across all screenshots
- [ ] Text is readable at thumbnail size
- [ ] Colors are accurate and vibrant
- [ ] No cut-off UI elements
- [ ] Branding is consistent
- [ ] File size under 500 KB
- [ ] Format is PNG

---

## Screenshot Naming Convention

**Format:** `{size}-{screen-number}-{description}.png`

**Examples:**
```
6.7-inch-01-dashboard.png
6.7-inch-02-obd2-diagnostics.png
6.7-inch-03-trip-tracking.png
6.7-inch-04-vehicle-inspection.png
6.7-inch-05-settings-security.png

6.5-inch-01-dashboard.png
6.5-inch-02-obd2-diagnostics.png
...

5.5-inch-01-dashboard.png
5.5-inch-02-obd2-diagnostics.png
...
```

---

## Screenshot Upload Order

When uploading to App Store Connect, maintain this order:

1. **Dashboard** - First impression
2. **OBD2 Diagnostics** - Key differentiator
3. **Trip Tracking** - Core feature
4. **Vehicle Inspection** - Unique value
5. **Settings/Security** - Trust builder

**Reasoning:** Users typically view only first 3 screenshots, so put most important features first.

---

## Alternative Screenshot Ideas

### For Future Updates or A/B Testing

**Option: Before/After Comparison**
- Left side: "Old Way" (paper clipboards, manual logs)
- Right side: "DCF Way" (digital app interface)
- Text: "Go Digital in 2025"

**Option: Feature Highlights**
- Grid layout showing 4-6 key features
- Icon + screenshot + text for each
- Clean, modern design

**Option: Testimonial Screenshot**
- User quote overlay
- 5-star rating
- User photo/avatar (stock or real with permission)
- Organization name

**Option: Use Case Scenarios**
- "For Fleet Managers" - Dashboard view
- "For Drivers" - Trip tracking view
- "For Mechanics" - Diagnostic view

**Option: Security-First Screenshot**
- Dark themed with security emphasis
- Padlock imagery
- Compliance badges prominently
- "Bank-Level Security" messaging

---

## Dark Mode Considerations

**Should you provide Dark Mode screenshots?**

**Recommendation:** NO for version 1.0

**Reasoning:**
- App Store allows only one set of screenshots per size
- Light mode is more universally accessible
- Light mode screenshots appear cleaner in App Store
- Most users browse App Store in light mode
- Can provide dark mode screenshots in update

**If Dark Mode Screenshots Desired:**
- Capture separate set in dark mode
- Use for marketing website
- Include in promotional materials
- Save for future App Store update

**To Enable Dark Mode for Capture:**
```bash
# In Simulator
Settings > Developer > Dark Appearance (toggle on)

# Or programmatically
xcrun simctl ui booted appearance dark
```

---

## Video Alternative (App Preview)

While this guide focuses on screenshots, consider creating a 30-second app preview video:

- Shows app in action
- Can demonstrate animations and interactions
- Autoplay in App Store
- Higher engagement than static screenshots

See `app-preview-script.txt` for video guidelines.

---

## Screenshot Testing

### A/B Testing Recommendations

**What to Test:**
1. With vs without device frames
2. With vs without text overlays
3. Light vs dark mode
4. Feature order (which screenshot first?)
5. Different text copy
6. Different highlighted features

**How to Test:**
- Use App Store Connect's A/B testing (if available)
- Monitor conversion rate changes
- Track impressions → downloads
- Compare against industry benchmarks

**Metrics to Track:**
- Impression to product page views
- Product page views to downloads
- Conversion rate by screenshot variant
- Geographic differences

---

## Tools & Resources

### Screenshot Capture Tools
- **Xcode Simulator** (Built-in) - FREE
- **Screenshot Creator for Xcode** - $4.99
- **Fastlane Snapshot** (CLI automation) - FREE
- **App Store Screenshot Generator** (Online) - FREE

### Design & Editing Tools
- **Figma** (Web) - FREE
- **Sketch** (Mac) - $99/year
- **Adobe Photoshop** - $9.99/month
- **Canva** (Web) - FREE
- **Pixelmator Pro** (Mac) - $49.99

### Device Frame Tools
- **DaVinci Screenshot Framer** - FREE
- **Screenshot Creator** - $4.99
- **Facebook Design Device Frames** - FREE
- **MockUPhone** (Web) - FREE

### Compression Tools
- **ImageOptim** (Mac) - FREE
- **TinyPNG** (Web) - FREE
- **pngquant** (CLI) - FREE

---

## Accessibility Considerations

**Alt Text for Screenshots:**

When uploading to App Store Connect, provide descriptive alt text for each screenshot:

**Example Alt Text:**
```
Screenshot 1: "DCF Fleet Management dashboard showing 47 total vehicles, 8 active trips, and real-time fleet metrics including total miles and maintenance alerts"

Screenshot 2: "OBD2 vehicle diagnostics screen displaying real-time engine data including RPM, coolant temperature, fuel level, and battery voltage"

Screenshot 3: "Active trip tracking with GPS map showing vehicle route, trip duration of 1 hour 24 minutes, and distance of 47.3 miles"

Screenshot 4: "Vehicle inspection checklist with 23 items showing pass, warn, and fail statuses with photo documentation option"

Screenshot 5: "Settings screen displaying government compliance certifications including NIST, FISMA, SOC 2, and security features"
```

---

## Final Checklist

Before submitting screenshots to App Store Connect:

### Technical Validation
- [ ] All 3 required sizes captured (6.7", 6.5", 5.5")
- [ ] Each size has 5 screenshots
- [ ] Resolution exactly matches requirements
- [ ] File format is PNG
- [ ] File size under 500 KB per image
- [ ] No transparency/alpha channel
- [ ] RGB color space (not CMYK)

### Content Validation
- [ ] No placeholder or lorem ipsum text
- [ ] No "Test User" or fake data
- [ ] All text is spelled correctly
- [ ] Branding is consistent
- [ ] No competitor names or logos
- [ ] No pricing information
- [ ] No dates that will become outdated
- [ ] No unreleased features shown

### Quality Validation
- [ ] Screenshots are sharp and clear
- [ ] Text is readable at thumbnail size
- [ ] Colors are vibrant and accurate
- [ ] UI is not cut off
- [ ] Consistent status bar across all
- [ ] Professional appearance
- [ ] No visible bugs or errors
- [ ] Loading states are complete

### Strategic Validation
- [ ] Screenshot order tells a story
- [ ] Most important features shown first
- [ ] Text overlays are compelling
- [ ] Trust indicators included
- [ ] Differentiators highlighted
- [ ] Target audience will recognize value
- [ ] Consistent with app description
- [ ] Matches brand guidelines

---

## Timeline

**Estimated Time Investment:**

- **Setup & Configuration:** 2 hours
- **Screenshot Capture (all sizes):** 3 hours
- **Post-Processing & Design:** 4 hours
- **Quality Review & Revisions:** 2 hours
- **Upload & Metadata:** 1 hour

**Total:** ~12 hours for complete screenshot package

**Recommendation:** Allocate 2-3 working days for thoroughness

---

## Contact & Support

**Questions about screenshots?**
- Email: marketing@capitaltechalliance.com
- Slack: #app-store-optimization
- Documentation: https://docs.fleet.capitaltechalliance.com/screenshots

**Need design help?**
- Design Team: design@capitaltechalliance.com
- Request templates: Available in Figma

---

**Last Updated:** November 11, 2025
**Next Review:** Before each major version release
**Status:** READY FOR PRODUCTION
