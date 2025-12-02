# How to Add the DCF Logo as the iOS App Icon

## Quick Steps:

### Option 1: Using the Script (Recommended)
1. Save the DCF logo image to your computer (e.g., Desktop)
2. Open Terminal and navigate to the app directory:
   ```bash
   cd /Users/andrewmorton/Documents/GitHub/fleet-management/fleet-management-system/ios/App/App
   ```

3. Run the icon generation script with your image:
   ```bash
   ./generate_app_icons.sh ~/Desktop/dcf_logo.png
   ```
   (Replace `~/Desktop/dcf_logo.png` with the actual path to your saved logo)

4. Rebuild the app in Xcode:
   ```bash
   cd ..
   xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator clean build
   ```

### Option 2: Manual in Xcode
1. Open Xcode:
   ```bash
   open /Users/andrewmorton/Documents/GitHub/fleet-management/fleet-management-system/ios/App/App.xcworkspace
   ```

2. In Xcode:
   - Click on "App" in the project navigator (left sidebar)
   - Select the "App" target
   - Go to the "General" tab
   - Scroll to "App Icons and Launch Screen"
   - Click on the "AppIcon" arrow to open Assets catalog

3. Drag and drop your DCF logo image onto the 1024x1024 placeholder

4. Build and run the app (Cmd+R)

## The Logo Will Appear:
- On the iPhone home screen as the app icon
- In the app switcher
- In Settings > General > iPhone Storage
- In Spotlight search results

## Current Status:
✅ Icon generation script created and ready
✅ App configured to use custom icon
✅ DCF branding colors implemented in app
⏳ Waiting for actual logo image file to be processed

## Notes:
- The logo image should ideally be square (1:1 aspect ratio)
- A high-resolution image (at least 1024x1024) works best
- iOS will automatically round the corners and add effects
- The script will generate all required sizes automatically