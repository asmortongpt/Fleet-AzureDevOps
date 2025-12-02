# Storybook Quick Start Guide

Get up and running with Storybook in 3 minutes!

## Step 1: Install Dependencies

```bash
# Install all required Storybook packages
npm install -D \
  storybook@^10 \
  @storybook/react-vite@^10 \
  @storybook/react@^10 \
  @storybook/addon-essentials@^10 \
  @storybook/addon-interactions@^10 \
  @storybook/addon-a11y@^10 \
  @storybook/addon-links@^10 \
  @storybook/blocks@^10 \
  @storybook/test@^10
```

## Step 2: Start Storybook

```bash
npm run storybook
```

Storybook will open automatically at `http://localhost:6006`

## Step 3: Explore the Stories

You'll see 4 main sections:

### 📖 Introduction
Start here for an overview of all components and features.

### 🗺️ Maps
- **UniversalMap** (11 stories) - Smart dual-provider system
- **LeafletMap** (15 stories) - Free OpenStreetMap implementation  
- **GoogleMap** (13 stories) - Google Maps Platform integration

### 📄 Pages
- **GPSTracking** (9 stories) - Full GPS tracking interface

## What You Can Do

### Interactive Controls
Click any story, then use the **Controls** tab to:
- Change map styles
- Adjust marker counts
- Toggle visibility
- Change center/zoom
- Switch providers

### Test Accessibility
Click the **Accessibility** tab to:
- See any accessibility violations
- Check color contrast
- Verify ARIA labels
- Test keyboard navigation

### View Documentation
Click the **Docs** tab to:
- Read component descriptions
- See prop tables
- View usage examples
- Learn best practices

### Change Viewport
Use the viewport toolbar to test:
- 📱 Mobile (375x667)
- 📱 Tablet (768x1024)
- 💻 Desktop (1280x800)
- 🖥️ Wide (1920x1080)

### Switch Theme
Use the theme toolbar to test:
- ☀️ Light mode
- 🌙 Dark mode

## Optional: Google Maps API Key

To see Google Maps stories:

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Add to `.env` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
3. Restart Storybook

**Note:** Free tier includes $200/month credit!

## Key Stories to Check Out

### For Developers
- **UniversalMap > Default** - See the smart provider switching
- **LeafletMap > All Map Styles** - Compare visual styles
- **LeafletMap > With Clustering** - See performance optimization
- **GPSTracking > Large Fleet** - Test with 100 vehicles

### For Designers
- **LeafletMap > Dark Theme** - See dark mode support
- **GoogleMap > All Map Types** - Compare Google Maps views
- **UniversalMap > All Markers** - See marker variety

### For QA
- **GPSTracking > Error State** - See error handling
- **GPSTracking > Loading State** - See loading UI
- **LeafletMap > Empty Map** - See empty state
- **UniversalMap > With Clustering** - Test performance

## Common Tasks

### Test with Different Data
```tsx
// In Controls tab:
vehicles: generateMockVehicles(100) // Change 10 to 100
```

### Force a Map Provider
```tsx
// In UniversalMap stories, set control:
forceProvider: "leaflet" // or "google"
```

### Test Mobile View
1. Click viewport toolbar
2. Select "Mobile"
3. Interact with component

### Check Accessibility
1. Open any story
2. Click "Accessibility" tab
3. Review violations (should be 0!)

## Build for Production

```bash
# Build static Storybook
npm run build-storybook

# Output is in storybook-static/
# Deploy to any static host
```

## Need Help?

- 📖 Read `.storybook/README.md` for detailed docs
- 📝 Check `STORYBOOK_SETUP.md` for complete setup info
- 🗺️ Explore existing stories for examples
- 📚 Visit [Storybook Docs](https://storybook.js.org/docs)

## What's Included

✅ **48 interactive stories** showcasing all variations  
✅ **Complete documentation** with usage examples  
✅ **Mock data generators** for realistic testing  
✅ **Accessibility testing** built-in with a11y addon  
✅ **Responsive testing** with viewport presets  
✅ **Theme support** for light/dark mode  
✅ **Performance examples** with large datasets  
✅ **Error states** and loading states  
✅ **Best practices** and guidelines  

That's it! You're ready to explore and use Storybook. Happy documenting! 🚀
