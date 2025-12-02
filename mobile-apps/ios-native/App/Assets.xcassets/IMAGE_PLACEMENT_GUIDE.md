# Image Placement Guide for Assets.xcassets

## Quick Reference: Where to Place Your Images

### App Icons (18 total images)
Place these image files in: `/Assets.xcassets/AppIcon.appiconset/`

```
Required Images:
- iphone_120x120.png (60x60 pt @ 2x - Home Screen)
- iphone_180x180.png (60x60 pt @ 3x - Home Screen Plus)
- iphone_40x40.png (40x40 pt @ 2x - Spotlight)
- iphone_60x60.png (40x40 pt @ 3x - Spotlight Plus)
- iphone_29x29.png (29x29 pt @ 2x - Settings)
- iphone_87x87.png (29x29 pt @ 3x - Settings Plus)
- iphone_40x40_notif.png (20x20 pt @ 2x - Notification)
- iphone_60x60_notif.png (20x20 pt @ 3x - Notification Plus)
- ipad_76x76.png (76x76 pt @ 1x - Home Screen)
- ipad_152x152.png (76x76 pt @ 2x - Home Screen Retina)
- ipad_167x167.png (83.5x83.5 pt @ 2x - iPad Pro)
- ipad_40x40.png (40x40 pt @ 1x - Spotlight)
- ipad_80x80.png (40x40 pt @ 2x - Spotlight Retina)
- ipad_29x29.png (29x29 pt @ 1x - Settings)
- ipad_58x58.png (29x29 pt @ 2x - Settings Retina)
- ipad_20x20.png (20x20 pt @ 1x - Notification)
- ipad_40x40_notif.png (20x20 pt @ 2x - Notification Retina)
- app_store_1024x1024.png (App Store ONLY - 1024x1024)
```

### Launch Screen Image
Place these image files in: `/Assets.xcassets/LaunchScreen.imageset/`

```
Required Images:
- launch_screen_1x.png (base resolution)
- launch_screen_2x.png (2x scale for Retina)
- launch_screen_3x.png (3x scale for Plus models)

Recommended Sizes:
- 1x: 320x480 pixels (baseline)
- 2x: 640x960 pixels (Retina)
- 3x: 960x1440 pixels (Plus models)

Recommended: Use a simple, branded design without text
```

### Accent Color
Color assets in: `/Assets.xcassets/AccentColor.colorset/`

Already configured with:
- Light mode: RGB(1, 122, 0) - iOS green
- Dark mode: RGB(26, 144, 10) - Lighter green

Edit `Contents.json` to change colors if needed.

## Steps to Add Images

### Option 1: Drag & Drop in Xcode
1. Open your project in Xcode
2. Select Assets.xcassets in the Project Navigator
3. Select the appropriate .imageset or .appiconset folder
4. Drag your image files from Finder into Xcode
5. Xcode will automatically organize them

### Option 2: Manual File Placement
1. In Finder, navigate to your project folder
2. Go to: `mobile-apps/ios-native/App/Assets.xcassets/[ImageSetName]/`
3. Copy your image files directly into the folder
4. Xcode will recognize them on next build

### Option 3: Command Line
```bash
# Copy app icons
cp your_icons/*.png /home/user/Fleet/mobile-apps/ios-native/App/Assets.xcassets/AppIcon.appiconset/

# Copy launch screen images
cp your_launch_screens/*.png /home/user/Fleet/mobile-apps/ios-native/App/Assets.xcassets/LaunchScreen.imageset/
```

## Image Generation Tools

### Recommended Tools
- **ImageOptim**: Free macOS tool for batch resizing and optimization
- **Figma**: Design tool with iOS export presets
- **Sketch**: Design tool with iOS asset export
- **Xcode**: Built-in image set generator
- **Web-based**: Icons8, Iconion, or Asset Studio online tools

### Batch Generation Script (macOS)
```bash
#!/bin/bash
INPUT="icon_1024.png"
OUTPUT_DIR="Assets.xcassets/AppIcon.appiconset"

# Generate all sizes using ImageMagick
convert $INPUT -resize 120x120 $OUTPUT_DIR/iphone_120x120.png
convert $INPUT -resize 180x180 $OUTPUT_DIR/iphone_180x180.png
convert $INPUT -resize 40x40 $OUTPUT_DIR/iphone_40x40.png
# ... etc for all sizes
```

## Verification Checklist

After placing all images:

- [ ] All 18 app icon PNG files are in AppIcon.appiconset/
- [ ] All 3 launch screen PNG files are in LaunchScreen.imageset/
- [ ] Filenames exactly match the names in Contents.json
- [ ] Images are in PNG format (recommended) or JPEG
- [ ] App icon sizes are exactly as specified (no rounding)
- [ ] Project builds without errors
- [ ] Simulator displays correct app icon
- [ ] Device test shows crisp, clear icons (not blurry)

## Common Troubleshooting

| Problem | Solution |
|---------|----------|
| Icons don't appear | Check filename spelling matches Contents.json |
| Blurry icons | Verify image dimensions exactly match requirements |
| Color looks wrong | Check image is sRGB, not other color profile |
| Simulator shows generic icon | Clean build folder, rebuild project |
| Launch screen doesn't show | Verify images are in LaunchScreen.imageset |
| Missing icons error in Xcode | Ensure all filenames from Contents.json are present |

## Important Reminders

1. **App Store Icon (1024x1024)**: Should have NO rounded corners, transparency, or badges
2. **Other Icons**: Will have rounded corners applied by iOS automatically
3. **Icon Safety Area**: Keep important elements away from edges (suggest 10% margin)
4. **Testing**: Always test on real devices, not just simulator
5. **Formats**: PNG recommended over JPEG for icon clarity
6. **Color Space**: Use sRGB unless your app specifically needs Display P3

## References

- [Apple Icon Design Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)
- [iOS App Icon Specifications](https://help.apple.com/app-store-connect/#/devd274dd925)
- [Xcode Asset Catalog Help](https://developer.apple.com/documentation/xcode/asset-catalog/)
