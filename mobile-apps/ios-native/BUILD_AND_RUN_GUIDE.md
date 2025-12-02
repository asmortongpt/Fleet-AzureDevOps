# iOS App Build and Run Guide

## Current Status

✅ **Multi-Environment Configuration**: Complete and committed to both GitHub and Azure DevOps (commit `41b1b8b`)

⚠️ **Build Process**: Requires manual intervention in Xcode

## What Has Been Completed

1. **Environment Configuration** (`APIConfiguration.swift`)
   - 4 environments configured: Local, Development, Staging, Production
   - Compiler flag-based switching (no code duplication)
   - Production is default (safest for App Store builds)

2. **Documentation** (`ENVIRONMENT_CONFIG.md`)
   - Complete setup instructions
   - Xcode build scheme configuration
   - Troubleshooting guide

3. **Repository Synchronization**
   - All changes committed to local repo
   - Pushed to GitHub: ✅
   - Pushed to Azure DevOps: ✅

## How to Build and Run the App

### Step 1: Open Xcode (Already Open)

The project is currently open in Xcode at:
`/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcworkspace`

### Step 2: Configure Signing & Capabilities

1. In Xcode, select **App** project in the navigator (left sidebar)
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Under "Team", select your Apple Developer account
5. If you see "Automatically manage signing", enable it
6. Xcode will automatically create a provisioning profile

### Step 3: Select Build Destination

1. In the toolbar (top of Xcode), look for the scheme selector
2. Make sure **App** is selected (should be by default)
3. Next to it, select **iPhone 17 Pro** as the destination
   - If not visible, click destination dropdown → "iPhone 17 Pro"

### Step 4: Build the Project

Press **⌘B** (Command + B) or click **Product** → **Build**

Watch for:
- Build progress bar at the top
- Any errors or warnings in the Issue Navigator (⌘5)
- Console output at the bottom

### Step 5: Run in Simulator

Once build succeeds, press **⌘R** (Command + R) or click **Product** → **Run**

The app will:
1. Install to the iPhone 17 Pro simulator
2. Launch automatically
3. Connect to production backend: `https://fleet.capitaltechalliance.com`

## Common Issues and Solutions

### Issue: "No account for team"
**Solution**: Add your Apple ID in Xcode → Settings → Accounts

### Issue: "Signing certificate not found"
**Solution**: In Signing & Capabilities, enable "Automatically manage signing"

###Issue: Build hangs or stalls
**Solution**:
1. Press **⌘.** (Command + Period) to stop the build
2. Clean build folder: **Product** → **Clean Build Folder** (⇧⌘K)
3. Close and reopen Xcode
4. Try building again

### Issue: "App" scheme not found
**Solution**:
1. Click scheme selector in toolbar
2. Click **Manage Schemes...**
3. Ensure "App" scheme is checked and visible

## Environment URLs

Your multi-environment configuration is active:

| Environment | URL | Use Case |
|-------------|-----|----------|
| **Production** (default) | `https://fleet.capitaltechalliance.com` | App Store builds, production use |
| **Staging** | `https://staging.fleet.capitaltechalliance.com` | Pre-production testing |
| **Development** | `http://172.168.84.37` | Team integration testing |
| **Local** | `http://localhost:3000` | Local development |

## Switching Environments

To build for a different environment, you need to set compiler flags:

1. Select **App** scheme → **Edit Scheme...**
2. Go to **Build** → Select **App** target
3. In **Build Settings**, find "Other Swift Flags"
4. Add one of:
   - `-DLOCAL` for local development
   - `-DDEVELOPMENT` for development server
   - `-DSTAGING` for staging environment
   - (Nothing) for production (default)

Or create separate build schemes as documented in `ENVIRONMENT_CONFIG.md`.

## Next Steps

1. ✅ Xcode is open with the project loaded
2. 📋 Configure signing in Xcode (Step 2 above)
3. 🔨 Build the project (⌘B)
4. 🚀 Run in simulator (⌘R)

## Documentation Files

- **Full environment setup**: `ENVIRONMENT_CONFIG.md`
- **API configuration code**: `App/APIConfiguration.swift`
- **This guide**: `BUILD_AND_RUN_GUIDE.md`

## Support

All changes are properly stored in:
- **Local**: `/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/`
- **GitHub**: Synchronized ✅
- **Azure DevOps**: Synchronized ✅
- **Commit**: `41b1b8b`

The multi-environment configuration is production-ready and follows iOS best practices.
