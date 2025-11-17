# Development Setup Guide - iOS Fleet Management

**Last Updated:** November 11, 2025
**Status:** Complete and ready for development
**Difficulty:** Intermediate

---

## Overview

This guide provides step-by-step instructions to set up your local development environment for the iOS Fleet Management app. By following this guide, you'll be able to build, test, and debug the application on both simulator and physical devices.

**Estimated Setup Time:** 30-45 minutes (first time setup)

---

## System Requirements

### Hardware
- Mac running macOS 12.0 or later
- Minimum 8GB RAM (16GB recommended for simulator)
- 50GB free disk space for Xcode and dependencies
- For device testing: iPhone with iOS 15.0 or later

### Software
- Xcode 14.0 or later (from App Store)
- macOS Command Line Tools
- CocoaPods 1.11.0 or later
- Git

### Recommended
- Visual Studio Code or other text editor (for markdown docs)
- TestFlight app on physical device (for beta testing)
- Simulator for at least one iPhone model

---

## Step 1: Install Xcode

### Via Mac App Store (Recommended)
```bash
# Open App Store and search for "Xcode"
# Or use direct link
open "macappstore://apps.apple.com/app/xcode/id497799835"

# This will take 10-30 minutes depending on internet speed
```

### Verify Installation
```bash
xcode-select --print-path
# Should output: /Applications/Xcode.app/Contents/Developer

xcodebuild -version
# Should show: Xcode 14.0 or later
```

### Install Command Line Tools
```bash
xcode-select --install

# Or if already have Xcode:
sudo xcode-select --reset
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

---

## Step 2: Install CocoaPods

CocoaPods is the dependency manager used in this project.

```bash
# Install CocoaPods (if not already installed)
sudo gem install cocoapods

# Verify installation
pod --version
# Should show: 1.11.0 or later

# Update CocoaPods repository
pod repo update
```

---

## Step 3: Clone or Download the Project

### Option A: Clone from Git
```bash
# Clone the repository
git clone https://github.com/your-repo/Fleet.git
cd Fleet/mobile-apps/ios-native

# Verify you're in correct directory
pwd
# Should end with: /Fleet/mobile-apps/ios-native
```

### Option B: Download ZIP
1. Download ZIP from GitHub/GitLab
2. Extract to desired location
3. Navigate to the directory:
```bash
cd /path/to/Fleet/mobile-apps/ios-native
```

---

## Step 4: Install Project Dependencies

### Install CocoaPods for This Project
```bash
# Navigate to project root
cd /home/user/Fleet/mobile-apps/ios-native

# Install pods specified in Podfile
pod install

# This will:
# - Download KeychainSwift for secure storage
# - Download Sentry for error tracking
# - Download Firebase pods (Analytics, Crashlytics, Messaging)
# - Generate App.xcworkspace
```

### Output Should Show:
```
Analyzing dependencies
Downloading dependencies
Installing KeychainSwift (~> 20.0)
Installing Sentry (~> 8.0)
Installing Firebase pods...
Generating Pods project
Integration complete!
```

### Verify Installation
```bash
# Check that workspace was created
ls -la App.xcworkspace
# Should show: App.xcworkspace directory exists

# Check pods were installed
ls -la Pods
# Should show: Pods directory with all dependencies
```

---

## Step 5: Open Xcode Project

### Important: Use Workspace, Not Project
```bash
# CORRECT: Use workspace (includes CocoaPods)
open App.xcworkspace

# WRONG: Don't use project (missing dependencies)
# open App.xcodeproj  ❌
```

### Verify Project Opens Correctly
1. Xcode should launch
2. Project navigator shows all files and folders
3. No red error icons in file tree
4. Build settings show iOS 15.0 target

---

## Step 6: Configure Development Team

### Set Up Apple Developer Account
1. **Open Xcode Preferences**
   ```
   Xcode > Settings > Accounts
   ```
2. **Click "+" to add account**
3. **Select "Apple ID"**
4. **Sign in with your Apple ID**
5. **Wait for team to appear**

### Configure Project Team
1. **Select "App" target** in Xcode
2. **Go to Signing & Capabilities**
3. **Select your team** from dropdown:
   - Team ID: `FFC6NRQ5U5`
   - Team name: Capital Tech Alliance
4. **Automatic provisioning** should be enabled
5. **Verification status** should show checkmark

### Verify Team Setup
```bash
# Check team configuration
cat App.xcodeproj/project.pbxproj | grep DEVELOPMENT_TEAM
# Should show: DEVELOPMENT_TEAM = FFC6NRQ5U5;
```

---

## Step 7: Build & Run on Simulator

### Select Simulator
1. **Top left of Xcode:**
   ```
   App > iPhone 15 (or preferred model)
   ```
2. **Available simulators:**
   - iPhone 15 Pro
   - iPhone 15
   - iPhone 14 Pro
   - iPhone SE (3rd generation)

### Build Project
```bash
# Keyboard shortcut
Cmd + B

# Or via menu: Product > Build
```

### Expected Build Output
```
Build Succeeded!
0 errors, 0 warnings
Time: X.XXs
```

### Run on Simulator
```bash
# Keyboard shortcut
Cmd + R

# Or via menu: Product > Run
```

### Verify App Launches
1. Simulator opens (if not already)
2. App icon appears on home screen
3. App launches and shows loading screen
4. Login screen appears
5. No console errors in Xcode

### Console Debugging
```
View > Debug Area > Show Console
# Cmd + Shift + C to toggle console
```

---

## Step 8: Run on Physical Device

### Prerequisites
1. iPhone with iOS 15.0+ connected via USB cable
2. Xcode configured with development team
3. Project built for physical device

### Connect iPhone
1. **Plug iPhone into Mac** via USB cable
2. **Trust the computer** on iPhone
3. **Wait for Xcode to recognize device**

### Select Physical Device
1. **Click simulator selector** (top left)
2. **Your iPhone name** appears under "iOS Devices"
3. **Select your iPhone**

### Build for Device
```bash
# Build for your connected device
Cmd + B
```

### Run on Device
```bash
# Run app on physical device
Cmd + R

# This will:
# 1. Build the app
# 2. Sign with development certificate
# 3. Deploy to your iPhone
# 4. Launch the app
# 5. Show console output in Xcode
```

### First-Time Device Setup

If you see "Developer not trusted" error:
1. Go to iPhone Settings > General > VPN & Device Management
2. Trust the developer certificate
3. Retry Cmd + R

---

## Step 9: Configure Firebase (Required for Production)

### Create Firebase Project
1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com
   ```
2. **Create new project:**
   - Project name: `DCF Fleet Management`
   - Accept Firebase terms
   - Create project

### Add iOS App to Firebase
1. **In Firebase Console > Project Settings**
2. **Click "Add app" > iOS**
3. **Enter Bundle ID:**
   ```
   com.capitaltechalliance.fleetmanagement
   ```
4. **Click Register app**

### Download Google Service Info
1. **Click "Download GoogleService-Info.plist"**
2. **Save file to your Downloads folder**
3. **Copy to project root:**
   ```bash
   cp ~/Downloads/GoogleService-Info.plist \
      /home/user/Fleet/mobile-apps/ios-native/
   ```

### Add to Xcode Project
1. **In Xcode, right-click project root**
2. **"Add Files to 'App'..."**
3. **Select GoogleService-Info.plist**
4. **Check "Add to target: App"**
5. **Click Add**

### Verify Firebase Installation
1. **Build the project:** Cmd + B
2. **Should compile without errors**
3. **Firebase pods included in build**

---

## Step 10: Connect to Backend API

### Development Server
```
Backend URL: http://localhost:3000/api
```

### Check Backend Status
```bash
# Test backend connection
curl -X GET http://localhost:3000/api/health

# Should return:
# {"status":"healthy",...}
```

### Configure Localhost in Xcode

If simulator can't reach localhost, use computer IP:

```bash
# Get your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# In APIConfiguration.swift, change:
# static let developmentBaseURL = "http://192.168.x.x:3000"
```

### Verify API Connection
1. **Launch app on simulator**
2. **Try login with test credentials**
3. **Should connect to backend**
4. **Check Xcode console for network logs**

---

## Environment Configuration

### Development Environment
- **API Base URL:** `http://localhost:3000`
- **Configuration:** Automatic (when building with Xcode)
- **Debug Info:** Enabled
- **Logging:** Verbose

### Production Environment
- **API Base URL:** `https://fleet.capitaltechalliance.com`
- **Configuration:** Set via build scheme
- **Debug Info:** Disabled
- **Logging:** Errors only

### Switching Environments
```bash
# In Xcode, edit scheme:
Product > Scheme > Edit Scheme

# Run tab > Build Configuration:
# - Debug (for development)
# - Release (for production testing)
```

---

## Common Development Tasks

### View App Logs
```bash
# In Xcode:
Cmd + Shift + C  # Show console
Cmd + Y          # Show debugger

# In console, search for your app's logs:
LoggingManager
SecurityLogger
ErrorHandler
```

### Simulate Location
```
In simulator:
Features > Location > None / Freeway Drive / City Bike
```

### Simulate Network Conditions
```
Debug > Simulate Network Condition > (select condition)
```

### Inspect Network Requests
```
In Xcode:
Product > Scheme > Edit Scheme > Run tab > Arguments
Add environment variable: CFNETWORK_DIAGNOSTICS=1
```

### Debug Performance
```bash
# Xcode Instruments
Cmd + I

# Select profiling template:
- System Trace
- Time Profiler
- Memory Leaks
- Core Animation
```

---

## Troubleshooting Common Issues

### Issue: "No such module 'KeychainSwift'"

**Solution:**
```bash
# Remove and reinstall pods
rm -rf Pods
rm Podfile.lock
pod install

# Clean Xcode
Cmd + Shift + K

# Rebuild
Cmd + B
```

### Issue: Simulator Black Screen

**Solution:**
```bash
# Restart simulator
xcrun simctl erase all

# Or in Xcode:
Device > Erase All Content and Settings...
```

### Issue: Cannot Connect to Localhost

**Solution:**
```bash
# Use computer's actual IP instead
ifconfig | grep "inet "

# Update APIConfiguration.swift:
static let developmentBaseURL = "http://192.168.1.100:3000"

# Or use ngrok for tunneling
brew install ngrok
ngrok http 3000
# Copy ngrok URL and use in app
```

### Issue: Code Signing Error

**Solution:**
```bash
# Reset code signing
rm -rf ~/Library/Developer/Xcode/DerivedData

# Verify team is configured
Xcode > Settings > Accounts > [Your Team] > Download Certificates

# Rebuild
Cmd + B
```

### Issue: Build Takes Too Long

**Solution:**
```
Xcode > Settings > Locations
Check that derived data is on SSD (not external drive)
```

---

## IDE and Tools Setup

### Recommended Extensions for VS Code
```bash
# For editing Swift files outside Xcode:
- Swift for VS Code
- Xcode Extension Pack
- iOS Swift Snippets
```

### Git Configuration
```bash
# Set up git for this project
git config user.name "Your Name"
git config user.email "your.email@example.com"

# View commits
git log --oneline

# Create feature branch
git checkout -b feature/my-feature
```

### Code Formatting
```
In Xcode:
Editor > Action Allows
- Automatically format code on save
- Auto-indent
```

---

## Testing Setup

### Run Unit Tests
```bash
# Run all tests
Cmd + U

# Run specific test class
Cmd + click on test file > Test
```

### View Test Results
```
In Xcode:
View > Navigators > Show Test Navigator (Cmd + 6)
```

### Code Coverage
```
In Xcode:
Product > Scheme > Edit Scheme > Test tab
Check: Gather coverage for target "App"
```

---

## Performance Profiling

### Memory Profiling
```
In Xcode Instruments:
Cmd + I > Memory Leaks

Check for:
- Memory leaks
- Unreleased objects
- Memory growth over time
```

### CPU Profiling
```
In Xcode Instruments:
Cmd + I > System Trace or Time Profiler

Check for:
- Long-running operations
- Main thread blocking
- Frame rate drops
```

### Network Profiling
```
In Xcode Instruments:
Cmd + I > Network

Check for:
- Unnecessary network calls
- Large responses
- Connection latency
```

---

## Documentation & Resources

### Apple Developer Resources
- **SwiftUI Documentation:** https://developer.apple.com/documentation/swiftui
- **Foundation Framework:** https://developer.apple.com/documentation/foundation
- **iOS Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/ios

### Third-Party Libraries
- **KeychainSwift:** https://github.com/evgenyneu/keychain-swift
- **Sentry:** https://docs.sentry.io/platforms/apple/
- **Firebase iOS:** https://firebase.google.com/docs/ios/setup

### Project Documentation
- See `ARCHITECTURE.md` for system design
- See `API_INTEGRATION.md` for backend integration
- See `SECURITY.md` for security implementation
- See `TESTING_GUIDE.md` for testing procedures

---

## Next Steps

After completing setup:

1. **Familiarize Yourself with Code**
   - Read ARCHITECTURE.md
   - Explore project structure
   - Understand MVVM pattern used

2. **Run Tests**
   - Press Cmd + U to run all tests
   - Review test coverage
   - Add tests for your changes

3. **Try Debugging**
   - Set breakpoints (Cmd + click on line number)
   - Step through code (F6 step over, F7 step into)
   - Inspect variables in debugger

4. **Make Your First Change**
   - Create feature branch
   - Modify something small
   - Build and test changes
   - Commit to git

5. **Read Security Guide**
   - See SECURITY.md
   - Understand security implementations
   - Follow secure coding practices

---

## Common Development Commands

```bash
# Navigate to project
cd /home/user/Fleet/mobile-apps/ios-native

# Open Xcode
open App.xcworkspace

# Build project
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug

# Run tests
xcodebuild test -workspace App.xcworkspace -scheme App

# Clean build
xcodebuild clean -workspace App.xcworkspace -scheme App

# Update dependencies
pod install --repo-update

# Check for outdated pods
pod outdated
```

---

## Support & Help

**Getting Help:**
1. Check project README files
2. Review inline code documentation
3. Search GitHub issues
4. Ask team members
5. Check Apple Developer forums

**Reporting Issues:**
1. Describe the problem clearly
2. Include error messages
3. Mention Xcode version
4. Provide reproduction steps
5. Create GitHub issue with details

---

**Setup Complete!** You're now ready to develop on the iOS Fleet Management app.

**Next:** Read `ARCHITECTURE.md` to understand the codebase structure.
