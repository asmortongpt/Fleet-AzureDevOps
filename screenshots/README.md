# Fleet Management Hub Screenshots

This folder contains standalone HTML files for each hub page, ready for screenshots.

## Available Hub Pages

1. **operations-hub.html** - Operations Hub (Dispatch, Routes, Tasks, Calendar)
2. **assets-hub.html** - Assets Hub (Assets, Equipment, Inventory)
3. **maintenance-hub.html** - Maintenance Hub (Garage, Predictive, Calendar, Requests)
4. **compliance-hub.html** - Compliance Hub (Dashboard, Map, DOT, IFTA, OSHA)

## How to Use

### Quick Start

1. **Open in Browser**: Simply double-click any HTML file to open it in your default browser
2. **Navigate Tabs**: Click the tabs at the top to switch between different views
3. **Take Screenshots**: Use your browser's screenshot tools or press F12 and use DevTools

### Screenshot Methods

#### Method 1: Browser Built-in (Recommended)
1. Open the HTML file in Chrome or Edge
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
4. Type "screenshot" and select:
   - **Capture full size screenshot** - Gets the entire page
   - **Capture screenshot** - Gets visible area only

#### Method 2: macOS Screenshot
1. Open the HTML file in any browser
2. Press `Cmd+Shift+4` then press `Space`
3. Click the browser window to capture it

#### Method 3: Windows Snipping Tool
1. Open the HTML file in any browser
2. Press `Windows+Shift+S`
3. Select the area to capture

#### Method 4: Browser Extensions
Install "Full Page Screenshot" or "Awesome Screenshot" from your browser's extension store

## Features

### All Pages Include:
- ✅ **Realistic Mock Data** - Industry-standard metrics and KPIs
- ✅ **Responsive Design** - Looks good at any screen size
- ✅ **Interactive Tabs** - Click to switch between different sections
- ✅ **Professional Styling** - Dark theme with glassmorphism effects
- ✅ **Phosphor Icons** - Modern, crisp iconography
- ✅ **No Dependencies** - Works completely offline (except icons CDN)

### Operations Hub
**4 Tabs with 20+ Metrics:**
- Dispatch Console (Active jobs, in transit, completed, delayed)
- Route Management (Active routes, optimizations)
- Task Management (Open, in progress, completed, overdue)
- Operations Calendar (Scheduled events, shifts)

### Assets Hub
**3 Tabs with 12+ Metrics:**
- Asset Management (Total, active, maintenance, retired)
- Equipment Dashboard (Heavy equipment tracking)
- Inventory Tracking (Parts and supplies)

### Maintenance Hub
**4 Tabs with 20+ Metrics:**
- Garage & Service (Work orders, bay utilization)
- Predictive Maintenance (AI predictions, alerts, savings)
- Maintenance Calendar (Scheduled services)
- Maintenance Requests (New, in review, approved)

### Compliance Hub
**5 Tabs with 18+ Metrics:**
- Compliance Dashboard (Overall scores)
- Compliance Map (Geographic zones)
- DOT Compliance (Vehicles, inspections, HOS, ELD)
- IFTA Compliance (Quarters filed, miles, taxes)
- OSHA Safety (Forms, incidents, safety days)

## Tips for Best Screenshots

1. **Full Width**: Resize your browser to at least 1400px wide for best results
2. **Default Tab**: Each file opens with the main/default tab active
3. **Capture All Tabs**: Take separate screenshots of each tab for comprehensive documentation
4. **Consistent Size**: Use the same browser window size for all screenshots
5. **Clean Background**: The gradient background is part of the design - include it!

## Viewing Tips

- **Zoom**: Use `Ctrl/Cmd +` or `-` to zoom in/out if needed
- **Full Screen**: Press `F11` for full-screen mode (exit with `F11` again)
- **Tab Navigation**: Use `Tab` key to highlight interactive elements
- **Print**: You can also use `Ctrl/Cmd+P` to "print to PDF" for documentation

## Technical Details

- **Framework**: Pure HTML/CSS/JavaScript (no build required)
- **Icons**: Phosphor Icons via CDN
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)
- **File Size**: ~15-20KB per file (very lightweight)
- **Load Time**: Instant (no API calls or external dependencies)

## Customization

If you need to modify the data:

1. Open the HTML file in any text editor
2. Find the section you want to change (search for the tab name)
3. Update the `stat-card-value` or other data elements
4. Save and refresh in browser

Example:
```html
<div class="stat-card-value">24</div>  <!-- Change this number -->
```

## File Locations

All files are in: `/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/`

- `operations-hub.html`
- `assets-hub.html`
- `maintenance-hub.html`
- `compliance-hub.html`
- `README.md` (this file)

## Need Help?

If a file doesn't display correctly:

1. **Check Internet Connection** - Icons load from CDN
2. **Try Different Browser** - Chrome/Edge recommended
3. **Clear Cache** - `Ctrl/Cmd+Shift+R` to hard refresh
4. **Check Console** - `F12` → Console tab for any errors

## Next Steps

After taking screenshots:

1. Save them to a dedicated folder (e.g., `/screenshots/final/`)
2. Name them descriptively (e.g., `operations-hub-dispatch-tab.png`)
3. Use in documentation, presentations, or stakeholder reviews
4. Consider creating a collage or comparison view

---

**Created**: 2026-01-05
**Version**: 1.0
**Purpose**: Fleet Management System Hub Screenshots
**Status**: Production Ready ✅
