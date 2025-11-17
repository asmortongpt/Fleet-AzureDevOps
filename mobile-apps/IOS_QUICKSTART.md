# iOS Native App - Quick Start Guide

## 🎯 Goal
Create a native iOS app that wraps the Fleet Manager web application in a native SwiftUI interface.

## ✅ What You Have
- ✅ Production web app running at `https://fleet.capitaltechalliance.com`
- ✅ Web app working in simulator Safari (already open!)
- ✅ Complete Swift code ready to use (`/mobile-apps/ios/FleetMobileApp.swift`)
- ✅ Updated API configuration pointing to production

## 🚀 Method 1: Create New Xcode Project (Recommended - 5 minutes)

### Step 1: Create New Project in Xcode

1. Open Xcode (should already be open)
2. **File → New → Project**
3. Select **iOS → App**
4. Click **Next**

### Step 2: Configure Project

Fill in these details:
- **Product Name**: `FleetManager`
- **Team**: Select your Apple Developer account
- **Organization Identifier**: `com.capitaltechalliance`
- **Bundle Identifier**: (auto-filled) `com.capitaltechalliance.FleetManager`
- **Interface**: **SwiftUI**
- **Language**: **Swift**
- **Storage**: Core Data **OFF**
- **Include Tests**: **OFF** (optional)

Click **Next**, then save to:
```
/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/FleetManager
```

### Step 3: Replace Generated Code

1. In Xcode project navigator, find `ContentView.swift`
2. **Delete** `ContentView.swift` (right-click → Delete → Move to Trash)
3. Drag this file into your project:
   ```
   /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios/FleetMobileApp.swift
   ```
4. When prompted:
   - ✅ Check "Copy items if needed"
   - ✅ Check "FleetManager" target
   - Click **Finish**

### Step 4: Update Info.plist

1. Select `Info.plist` in project navigator
2. Add these permissions (click **+** to add new entries):

   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Fleet Manager needs camera access for receipt scanning and damage reporting</string>

   <key>NSLocationWhenInUseUsageDescription</key>
   <string>Fleet Manager needs location access for GPS tracking and mileage calculation</string>

   <key>NSPhotoLibraryUsageDescription</key>
   <string>Fleet Manager needs photo library access to save and upload images</string>

   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <false/>
       <key>NSExceptionDomains</key>
       <dict>
           <key>fleet.capitaltechalliance.com</key>
           <dict>
               <key>NSIncludesSubdomains</key>
               <true/>
               <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
               <false/>
           </dict>
       </dict>
   </dict>
   ```

### Step 5: Run in Simulator

1. At the top of Xcode, select device: **iPhone 17 Pro**
2. Press **⌘R** or click the **▶ Play** button
3. Wait for build (30-60 seconds)
4. App will launch in simulator!

You should see:
- Native header with "Fleet Manager" and status indicator
- Production Fleet app loaded at `https://fleet.capitaltechalliance.com`
- Microsoft SSO login working
- All features accessible

## 🔧 Method 2: Fix Existing Capacitor App (Advanced - 15 minutes)

The old app at `/mobile-apps/ios-native` is Capacitor-based and has missing dependencies. To fix it:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native

# Install Capacitor CLI
npm install -g @capacitor/cli

# Create missing config.xml
echo '<?xml version="1.0" encoding="UTF-8"?>' > App/config.xml
echo '<widget></widget>' >> App/config.xml

# Create missing storyboards (or remove from project)
# Open App.xcworkspace in Xcode
# In Build Phases → Copy Bundle Resources
# Remove references to LaunchScreen.storyboard and Main.storyboard

# Install pods
pod install

# Try building again
open App.xcworkspace
```

**Recommendation**: Method 1 is cleaner and faster!

## 📱 Testing Checklist

Once the app is running, test:
- [ ] App launches without errors
- [ ] Fleet Manager header displays
- [ ] Status indicator shows green (connected)
- [ ] Web content loads: `https://fleet.capitaltechalliance.com`
- [ ] Microsoft SSO login works
- [ ] Navigation works smoothly
- [ ] All features accessible (dashboard, vehicles, etc.)

## 🚀 Next Steps: TestFlight Deployment

### 1. Archive the App

1. In Xcode: **Product → Archive**
2. Wait for archive to complete (2-3 minutes)
3. Organizer window opens automatically

### 2. Upload to App Store Connect

1. In Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Choose **Upload**
5. Select your team: **Capital Tech Alliance**
6. Click **Upload**
7. Wait for processing (5-30 minutes)

### 3. Add to TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **TestFlight** tab
4. Click **Internal Testing** or **External Testing**
5. Click **+** to add testers
6. Enter email addresses
7. Testers receive invitation email

### 4. Production Release

1. In App Store Connect, go to **App Information**
2. Add:
   - App description
   - Screenshots (iPhone 6.7" and iPad 12.9")
   - Keywords
   - Support URL
   - Privacy Policy URL
3. Submit for Review
4. Typically approved in 24-48 hours

## 🔍 Troubleshooting

### "Build Failed" in Xcode
```bash
# Clean build folder
⌘ + Shift + K

# Or completely clean
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### "Code Signing" errors
1. Go to project settings → Signing & Capabilities
2. Ensure your team is selected
3. Enable "Automatically manage signing"

### "Simulator not loading"
```bash
# Kill and restart simulator
killall Simulator
open -a Simulator
```

## 📊 Current Status

- ✅ **Web App**: Running in simulator Safari (you can see it now!)
- ✅ **Swift Code**: Ready at `/mobile-apps/ios/FleetMobileApp.swift`
- ✅ **API Config**: Updated to production URL
- ⏳ **Native App**: Waiting for you to create Xcode project (5 min)
- 📱 **TestFlight**: Ready to deploy once app is built

## 💡 Pro Tip

The web app is already working perfectly in Safari on the simulator (you should see it now!). The native app will:
- Add native iOS header and branding
- Enable push notifications (Phase 2)
- Add biometric authentication (Phase 2)
- Improve performance with native caching
- Allow App Store distribution

But the core functionality is already accessible via the web app!

---

**Ready to build?** Follow Method 1 above - it takes just 5 minutes! 🚀
