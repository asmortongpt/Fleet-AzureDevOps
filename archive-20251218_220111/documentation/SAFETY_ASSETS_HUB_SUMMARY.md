# Safety & Assets Hubs - Quick Reference

## SafetyHub - Incident Tracking & OSHA Compliance

### Map Views (Left Panel)
1. **Incident Location Map** - All safety incidents with severity markers
2. **Hazard Zones Map** - Geographic hazard areas with radius overlays
3. **Inspection Routes** - Safety inspection route planning

### Data Panels (Right Panel)
1. **Incidents List** - Filterable incident reports table
2. **Inspections List** - Vehicle safety inspection records
3. **Hazard Zones List** - Active hazard zone details

### Metrics Dashboard (Top)
- Days Without Incident: 2 days (Target: 30)
- OSHA Compliance Score: 87% (+3% trend)
- Recordable Incidents: 3 (of 5 total)
- Work Days Lost: 8 days (Severity Rate: 1.2)

### Demo Data
- 5 safety incidents (1 critical, 1 high, 2 medium, 1 low)
- 3 hazard zones (construction, flood-prone, chemical)
- 3 safety inspections (2 passed, 1 failed)

---

## AssetsHub - Asset Management & Lifecycle Planning

### Map Views (Left Panel)
1. **Asset Locations** - Real-time asset tracking with status colors
2. **Utilization Heatmap** - Usage intensity visualization
3. **Asset Value Overlay** - Financial value distribution

### Data Panels (Right Panel)
1. **Asset Inventory** - Complete asset listing with status/value
2. **Utilization & ROI** - Performance metrics with revenue/cost
3. **Replacement Planning** - Lifecycle management recommendations

### Metrics Dashboard (Top)
- Total Asset Value: $8.45M (+trend)
- Utilization Rate: 78.5% (94 of 127 assets active)
- Average ROI: 18.4% (+2.4% from last quarter)
- Maintenance Cost: $245K (2.9% of total value)

### Demo Data
- 6 tracked assets (excavator, dump truck, forklift, etc.)
- 6 utilization records with full financial data
- 4 replacement recommendations (2 high, 1 medium, 1 low priority)

---

## Navigation

**Access:** Sidebar → Hubs Section → Safety Hub / Assets Hub

**URLs:**
- `/safety-hub`
- `/assets-hub`

---

## Tech Stack

- **Maps:** Google Maps JavaScript API with dark theme
- **UI:** Shadcn/UI components (Card, Tabs, Table, etc.)
- **Icons:** Phosphor Icons
- **State:** React hooks (useState, useMemo)
- **Types:** Full TypeScript with asset.types.ts integration

---

## Color Schemes

### Safety Hub
- 🔴 Critical: Red
- 🟠 High: Orange
- 🟡 Medium: Yellow
- 🟢 Low: Green

### Assets Hub
- 🟢 Available: Green
- 🔵 In Use: Blue
- 🟠 Maintenance: Orange
- 🟣 Reserved: Purple

---

**Status:** ✅ COMPLETE AND READY FOR TESTING
