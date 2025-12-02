# iOS Assets.xcassets Structure Documentation

## Overview
This document describes the Assets.xcassets directory structure for the Fleet iOS Native App and the required icon sizes and image assets.

## Directory Structure

```
Assets.xcassets/
├── AppIcon.appiconset/
│   ├── Contents.json
│   ├── iphone_120x120.png
│   ├── iphone_180x180.png
│   ├── ipad_76x76.png
│   ├── ipad_152x152.png
│   ├── ipad_167x167.png
│   ├── iphone_40x40.png
│   ├── iphone_60x60.png
│   ├── ipad_40x40.png
│   ├── ipad_80x80.png
│   ├── iphone_29x29.png
│   ├── iphone_87x87.png
│   ├── ipad_29x29.png
│   ├── ipad_58x58.png
│   ├── ipad_20x20.png
│   ├── ipad_40x40_notif.png
│   ├── iphone_40x40_notif.png
│   ├── iphone_60x60_notif.png
│   └── app_store_1024x1024.png
├── LaunchScreen.imageset/
│   ├── Contents.json
│   ├── launch_screen_1x.png
│   ├── launch_screen_2x.png
│   └── launch_screen_3x.png
├── AccentColor.colorset/
│   └── Contents.json
└── Contents.json
```

## App Icon Sizes Required

### iPhone App Icons

| Size | Scale | Logical Size | Usage |
|------|-------|--------------|-------|
| 120x120 | 2x | 60x60 | iPhone Home Screen |
| 180x180 | 3x | 60x60 | iPhone Home Screen (Plus) |
| 40x40 | 2x | 40x40 | iPhone Spotlight Search |
| 60x60 | 3x | 40x40 | iPhone Spotlight Search (Plus) |
| 29x29 | 2x | 29x29 | iPhone Settings |
| 87x87 | 3x | 29x29 | iPhone Settings (Plus) |
| 20x20 | 2x | 20x20 | iPhone Notification |
| 60x60 | 3x | 20x20 | iPhone Notification (Plus) |

### iPad App Icons

| Size | Scale | Logical Size | Usage |
|------|-------|--------------|-------|
| 76x76 | 1x | 76x76 | iPad Home Screen (Standard) |
| 152x152 | 2x | 76x76 | iPad Home Screen (Retina) |
| 167x167 | 2x | 83.5x83.5 | iPad Pro Home Screen |
| 40x40 | 1x | 40x40 | iPad Spotlight Search |
| 80x80 | 2x | 40x40 | iPad Spotlight Search (Retina) |
| 29x29 | 1x | 29x29 | iPad Settings |
| 58x58 | 2x | 29x29 | iPad Settings (Retina) |
| 20x20 | 1x | 20x20 | iPad Notification |
| 40x40 | 2x | 20x20 | iPad Notification (Retina) |

### App Store Icon

| Size | Scale | Usage |
|------|-------|-------|
| 1024x1024 | 1x | App Store Marketing Image |

**Important:** The App Store icon (1024x1024) is only used for App Store Connect and should have no rounded corners, transparency, or app badge. It represents the actual design without iOS applied icon appearance.

## Launch Screen Image

The launch screen image supports three scales:
- **1x**: 320x480 (iPhone 5/5s baseline)
- **2x**: 640x960 (iPhone 6/7 and other Retina displays)
- **3x**: 960x1440 (iPhone Plus and newer models)

For best results, create a launch screen that:
- Matches the app's visual style
- Avoids text (may look different across devices)
- Uses a simple design that loads quickly

## Accent Color (App Theming)

The AccentColor.colorset provides the primary app accent color used throughout the app for:
- Interactive elements (buttons, links, highlights)
- Accent UI components
- Navigation highlights

The color set includes:
- **Light mode**: Primary accent color for light backgrounds
- **Dark mode**: Adjusted accent color for dark backgrounds

The current configuration uses:
- Light mode: RGB(1, 122, 0) - iOS green accent
- Dark mode: RGB(26, 144, 10) - Lighter green for dark backgrounds

To customize, edit the `color-space` and `components` values in `AccentColor.colorset/Contents.json`.

## Adding Images to Your Project

1. **Using Xcode UI:**
   - Open your project in Xcode
   - Select Assets.xcassets
   - Right-click and select "Show in Finder"
   - Place image files in the respective `.imageset` or `.appiconset` folders
   - The Contents.json files already define the expected filenames

2. **Using Command Line:**
   ```bash
   # Copy your images to the appropriate directories
   cp your_image.png Assets.xcassets/AppIcon.appiconset/

   # Xcode will automatically recognize them
   ```

3. **Image Format Requirements:**
   - **Format**: PNG (recommended) or JPEG
   - **Color Space**: sRGB or Display P3
   - **Alpha Channel**: Include for transparency (especially for App Store icon)
   - **No Compression**: Use lossless compression

## Recommended Workflow

1. Design your app icon at 1024x1024 pixels
2. Use a tool like ImageOptim or Xcode's built-in tools to generate all required sizes
3. Place generated images in their respective folders
4. Verify in Xcode that all images are properly recognized
5. Test on device to ensure appearance is correct

## Important Notes

- All dimensions in this documentation are in pixels
- The scale factor (1x, 2x, 3x) refers to point-to-pixel ratio
- Xcode automatically handles the display of correct sizes based on device
- Some icon sizes are only available on specific devices (e.g., 83.5x83.5 iPad Pro)
- Always test icons on actual devices to verify appearance
- The App Store icon must be a perfect square and cannot exceed 512x512 MB file size

## Common Issues and Solutions

### Icons appear blurry
- Ensure image dimensions exactly match the required size
- Verify the image is not scaled incorrectly in the Contents.json

### Missing icons in build
- Check that all filenames in Contents.json exactly match the actual image filenames
- Verify all image files are in the correct `.imageset` folder
- Build again after adding images

### Color not applying app-wide
- Ensure you're referencing the correct color asset name
- In SwiftUI: `.foregroundColor(.accentColor)`
- In UIKit: `UIColor(named: "AccentColor")`

## References

- [Apple Human Interface Guidelines - App Icon](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)
- [Xcode Asset Catalog Documentation](https://developer.apple.com/documentation/xcode/asset-catalog/)
- [App Store Connect - App Icon Requirements](https://help.apple.com/app-store-connect/#/devd274dd925)
