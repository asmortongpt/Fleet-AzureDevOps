# Quick Start: Running Fleet Manager iOS App in Simulator

## Option 1: View in Safari (Already Working!)
The Fleet website is now open in Safari on your simulator. This is the PWA (Progressive Web App) version.

## Option 2: Build Native App in Xcode

Since you have Xcode open, here's how to create and run the native app:

### Step-by-Step:

1. **In Xcode (which should already be open):**
   - Go to: `File` → `New` → `Project...`

2. **Choose template:**
   - Select: `iOS` tab
   - Choose: `App`
   - Click: `Next`

3. **Project settings:**
   ```
   Product Name: FleetManager
   Team: (Leave as "None" for simulator)
   Organization Identifier: com.capitaltechalliance
   Bundle Identifier: com.capitaltechalliance.fleet (auto-fills)
   Interface: SwiftUI
   Language: Swift
   ☐ Use Core Data (unchecked)
   ☐ Include Tests (unchecked)
   ```
   - Click: `Next`

4. **Save location:**
   - Navigate to: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios`
   - Click: `Create`

5. **Replace code:**
   - In the Project Navigator (left sidebar), find and **DELETE** `ContentView.swift`
   - Drag `FleetMobileApp.swift` from Finder into the Project Navigator
   - Ensure "Copy items if needed" is checked
   - Click: `Finish`

6. **Update app entry point:**
   - Open `FleetManagerApp.swift` (the file with @main)
   - Replace its contents with:
   ```swift
   import SwiftUI

   @main
   struct FleetManagerApp: App {
       var body: some Scene {
           WindowGroup {
               ContentView()
                   .preferredColorScheme(.light)
           }
       }
   }
   ```

7. **Add Info.plist entries:**
   - In Project Navigator, click on `FleetManager` (blue icon at top)
   - Select the `FleetManager` target
   - Click the `Info` tab
   - Right-click in the Custom iOS Target Properties area
   - Add these entries:

   **Required entries:**
   - `App Transport Security Settings` (Dictionary)
     - `Allow Arbitrary Loads` = `NO`
     - `Exception Domains` (Dictionary)
       - `fleet.capitaltechalliance.com` (Dictionary)
         - `NSExceptionAllowsInsecureHTTPLoads` = `NO`
         - `NSIncludesSubdomains` = `YES`
         - `NSExceptionRequiresForwardSecrecy` = `YES`

   - `Privacy - Camera Usage Description` = "Camera access is needed to scan receipts and document vehicle damage"
   - `Privacy - Location When In Use Usage Description` = "Location access is needed to track mileage and vehicle location"
   - `Privacy - Microphone Usage Description` = "Microphone access is needed for voice commands"

8. **Select simulator:**
   - At the top left, click the device dropdown
   - Select: `iPhone 17 Pro`

9. **Build and run:**
   - Press: `⌘R` (or click the Play button)
   - Wait for build to complete (~30 seconds)

10. **Result:**
    The native Fleet Manager app will launch with:
    - Professional header with "Fleet Manager" branding
    - Network status indicator (green dot)
    - Loading indicator
    - Full Fleet application in WebView
    - Microsoft SSO login

## Troubleshooting

### Build fails with "No provisioning profile"
- This is only needed for real devices, not simulator
- Ensure you selected a **Simulator** (not "My Mac" or "Any iOS Device")

### "Cannot find ContentView in scope"
- Make sure you replaced the code in `FleetManagerApp.swift`
- Ensure `FleetMobileApp.swift` was added to the target (check the box)

### Simulator shows black screen
- Open Safari in simulator to test web version
- Check Xcode console for errors
- Make sure network is connected

## Files Location

All files are ready at:
- Swift Code: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios/FleetManager/FleetMobileApp.swift`
- Info.plist: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios/FleetManager/Info.plist`
- This Guide: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios/QUICKSTART.md`
