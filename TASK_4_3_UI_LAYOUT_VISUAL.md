# Task 4.3: Visual UI Layout Guide

## VehicleDetailPanel - Updated Layout Structure

This document shows the visual structure of the updated VehicleDetailPanel component.

---

## Complete Panel Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VEHICLE DETAIL PANEL                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [1] VEHICLE HEADER                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Excavator CAT 320                               [Car Icon] │   │
│  │  2020 Caterpillar 320                                       │   │
│  │  [Active] [Assigned to: John Doe]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [2] QUICK STATS (2x2 Grid)                                        │
│  ┌──────────────────────────┬──────────────────────────┐           │
│  │ [Gauge] Mileage          │ [Fuel] Fuel Level        │           │
│  │ 0 mi                     │ 75%                      │           │
│  │ ────────────             │ ████████░░ 75%           │           │
│  ├──────────────────────────┼──────────────────────────┤           │
│  │ [Activity] Health        │ [Clock] Uptime           │           │
│  │ 92%                      │ 87%                      │           │
│  │ ████████████░ 92%        │ ██████████░░ 87%         │           │
│  └──────────────────────────┴──────────────────────────┘           │
│                                                                     │
│  [3] VEHICLE INFORMATION                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Vehicle Information                                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  VIN                    │ CAT320EXC123456                   │   │
│  │  License Plate          │ N/A                               │   │
│  │  Type                   │ Excavator                         │   │
│  │  Department             │ Construction                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ╔═════════════════════════════════════════════════════════════╗   │
│  ║ [4] ASSET CLASSIFICATION ⭐ NEW                              ║   │
│  ╠═════════════════════════════════════════════════════════════╣   │
│  ║  [Car Icon] Asset Classification                            ║   │
│  ╟─────────────────────────────────────────────────────────────╢   │
│  ║  Category               │ Heavy Equipment                   ║   │
│  ║  Type                   │ Excavator                         ║   │
│  ║  Power Type             │ Self-Powered                      ║   │
│  ║  Operational Status     │ [In Use]                          ║   │
│  ╚═════════════════════════════════════════════════════════════╝   │
│                                                                     │
│  ╔═════════════════════════════════════════════════════════════╗   │
│  ║ [5] MULTI-METRIC TRACKING ⭐ NEW                             ║   │
│  ╠═════════════════════════════════════════════════════════════╣   │
│  ║  [Activity Icon] Usage Metrics                              ║   │
│  ╟─────────────────────────────────────────────────────────────╢   │
│  ║  ┌────────────┬────────────┬────────────┬────────────┐      ║   │
│  ║  │ [Timer]    │ [Gauge]    │ [Zap]      │ [Clock]    │      ║   │
│  ║  │ Engine Hrs │ Odometer   │ PTO Hours  │ Aux Hours  │      ║   │
│  ║  │ [Primary]  │            │            │            │      ║   │
│  ║  │ 1,250 hrs  │ 0 mi       │ 450 hrs    │ 0 hrs      │      ║   │
│  ║  └────────────┴────────────┴────────────┴────────────┘      ║   │
│  ║  Last updated: 11/19/2025, 10:30:00 AM                      ║   │
│  ╚═════════════════════════════════════════════════════════════╝   │
│                                                                     │
│  ╔═════════════════════════════════════════════════════════════╗   │
│  ║ [6] EQUIPMENT SPECIFICATIONS ⭐ NEW                          ║   │
│  ║     (Only shown for HEAVY_EQUIPMENT)                         ║   │
│  ╠═════════════════════════════════════════════════════════════╣   │
│  ║  [Settings Icon] Equipment Specifications                   ║   │
│  ╟─────────────────────────────────────────────────────────────╢   │
│  ║  ┌──────────────┬──────────────┬──────────────┐             ║   │
│  ║  │ Capacity     │ Lift Height  │ Max Reach    │             ║   │
│  ║  │ 25 tons      │ 28 ft        │ 32 ft        │             ║   │
│  ║  ├──────────────┼──────────────┼──────────────┤             ║   │
│  ║  │ Bucket Cap.  │ Operating Wt.│              │             ║   │
│  ║  │ 2.5 yd³      │ 52,000 lbs   │              │             ║   │
│  ║  └──────────────┴──────────────┴──────────────┘             ║   │
│  ╚═════════════════════════════════════════════════════════════╝   │
│                                                                     │
│  ╔═════════════════════════════════════════════════════════════╗   │
│  ║ [7] ATTACHED ASSETS ⭐ NEW                                   ║   │
│  ╠═════════════════════════════════════════════════════════════╣   │
│  ║  [Link2 Icon] Attached Assets                               ║   │
│  ╟─────────────────────────────────────────────────────────────╢   │
│  ║  ┌───────────────────────────────────────────────────────┐  ║   │
│  ║  │ [Link2] Flatbed Trailer 53ft        [TOWS]  [View]   │  ║   │
│  ║  │ VIN: FLT53BED789012                                   │  ║   │
│  ║  │ Attached: 11/15/2025                                  │  ║   │
│  ║  └───────────────────────────────────────────────────────┘  ║   │
│  ║  [Manage Attachments]                                       ║   │
│  ╚═════════════════════════════════════════════════════════════╝   │
│                                                                     │
│  [8] CURRENT LOCATION                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [MapPin Icon] Current Location                             │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Lat: 40.712776, Lng: -74.005974                           │   │
│  │  123 Construction Site, New York, NY                        │   │
│  │  Last updated: 11/19/2025, 10:15 AM                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [9] ACTIVE ALERTS                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [AlertTriangle] Active Alerts (1)                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ⚠ Maintenance Due                                          │   │
│  │    500-hour service interval reached                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [10] ACTION BUTTONS                                               │
│  ┌──────────────────────────┬──────────────────────────┐           │
│  │  [Route] View Trips      │  [Calendar] Maintenance  │           │
│  └──────────────────────────┴──────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

⭐ = New sections added in Task 4.3
```

---

## Section-by-Section Visual Breakdown

### Section 4: Asset Classification (NEW)

```
┌──────────────────────────────────────────────────────┐
│  [Car Icon] Asset Classification                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Category               │ Heavy Equipment            │
│  ─────────                ─────────────────          │
│                                                      │
│  Type                   │ Excavator                  │
│  ────                     ─────────                  │
│                                                      │
│  Power Type             │ Self-Powered               │
│  ──────────               ────────────               │
│                                                      │
│  Operational Status     │ [Badge: In Use]            │
│  ──────────────────       ────────────────           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Badge Colors:**
- Available: Blue (default)
- In Use: Gray (secondary)
- Maintenance: Red (destructive)
- Reserved: Border only (outline)
- Out of Service: Border only (outline)

---

### Section 5: Multi-Metric Tracking (NEW)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Activity Icon] Usage Metrics                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │ [Timer] ⭐    │ │ [Gauge]       │ │ [Zap]         │         │
│  │ Engine Hours  │ │ Odometer      │ │ PTO Hours     │         │
│  │ ┌──────────┐  │ │               │ │               │         │
│  │ │ Primary  │  │ │               │ │               │         │
│  │ └──────────┘  │ │               │ │               │         │
│  │               │ │               │ │               │         │
│  │ 1,250 hrs     │ │ 0 mi          │ │ 450 hrs       │         │
│  │               │ │               │ │               │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ [Clock]       │                                              │
│  │ Aux Hours     │                                              │
│  │               │                                              │
│  │ 0 hrs         │                                              │
│  │               │                                              │
│  └───────────────┘                                              │
│                                                                  │
│  Last updated: 11/19/2025, 10:30:00 AM                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Primary Metric Styling:**
- 2px border in primary color (blue)
- Shadow effect for elevation
- "Primary" badge in top-right
- Value text in primary color

**Responsive Layout:**
- Mobile: 2 columns
- Tablet (md): 3 columns
- Desktop (lg): 4 columns

---

### Section 6: Equipment Specifications (NEW)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Settings Icon] Equipment Specifications                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Capacity               Lift Height            Max Reach         │
│  ────────               ───────────            ─────────         │
│  25 tons                28 ft                  32 ft             │
│                                                                  │
│  Bucket Capacity        Operating Weight                        │
│  ────────────────       ────────────────                        │
│  2.5 yd³                52,000 lbs                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Conditional Display:**
- Only shown when `asset_category === 'HEAVY_EQUIPMENT'`
- Only shown if at least one spec field has a value
- Gracefully handles missing fields

**Number Formatting:**
- Large font for numbers
- Small font for units
- Locale-aware formatting (52,000 lbs)

---

### Section 7: Attached Assets (NEW)

#### When API is Available

```
┌──────────────────────────────────────────────────────────────────┐
│  [Link2 Icon] Attached Assets                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Link2] Flatbed Trailer 53ft          [TOWS]      [View] │ │
│  │                                                            │ │
│  │  VIN: FLT53BED789012                                       │ │
│  │  Type: Flatbed Trailer                                     │ │
│  │  Attached: 11/15/2025                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Link2] Generator #42              [POWERS]      [View]  │ │
│  │                                                            │ │
│  │  VIN: GEN42UNIT000123                                      │ │
│  │  Type: Generator                                           │ │
│  │  Attached: 11/18/2025                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │  [Link2] Manage Attachments  │                               │
│  └──────────────────────────────┘                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### When No Attachments

```
┌──────────────────────────────────────────────────────────────────┐
│  [Link2 Icon] Attached Assets                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      [Link2 Icon (Large)]                        │
│                                                                  │
│                      No attached assets                          │
│                                                                  │
│           This vehicle has no currently attached                 │
│               trailers or equipment                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### When API Not Implemented (Placeholder)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Link2 Icon] Attached Assets                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [AlertCircle]  Asset Relationships Feature                │ │
│  │                                                            │ │
│  │  This feature will display attached trailers, equipment,  │ │
│  │  and other related assets. API endpoint not yet           │ │
│  │  implemented.                                              │ │
│  │                                                            │ │
│  │  Expected endpoint:                                        │ │
│  │  GET /api/asset-relationships/active?parent_asset_id=...  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## MetricCard Component Variants

### Basic Metric Card

```
┌───────────────────┐
│ [Icon] Label      │
├───────────────────┤
│                   │
│  1,250 hrs        │
│                   │
└───────────────────┘
```

### Primary Metric Card

```
╔═══════════════════╗  ← 2px primary border
║ [Icon] Label      ║
║          ┌──────┐ ║
║          │Primary│ ║  ← Primary badge
║          └──────┘ ║
╟───────────────────╢
║                   ║
║  1,250 hrs        ║  ← Primary color text
║                   ║
╚═══════════════════╝
    ↑ Shadow effect
```

### Metric Card with Progress

```
┌───────────────────────────┐
│ [Icon] Label     [Warning]│  ← Warning badge
├───────────────────────────┤
│                           │
│  1,250 hrs                │
│  of 1,500 hrs (83%)       │
│                           │
│  ████████████░░░░         │  ← Progress bar (yellow)
│                           │
└───────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile View (< 768px)

```
┌─────────────────────┐
│ Asset Classification│
├─────────────────────┤
│ Category    | Type  │  ← 2 columns
│ Power       | Status│
└─────────────────────┘

┌─────────────────────┐
│ Usage Metrics       │
├─────────────────────┤
│ [Engine]  | [Odo]  │  ← 2 columns
│ [PTO]     | [Aux]  │
└─────────────────────┘
```

### Tablet View (768px - 1024px)

```
┌───────────────────────────────┐
│ Asset Classification          │
├───────────────────────────────┤
│ Category    | Type    | Power │  ← Still 2 columns
│ Status      |         |       │     (better readability)
└───────────────────────────────┘

┌───────────────────────────────┐
│ Usage Metrics                 │
├───────────────────────────────┤
│ [Engine]  | [Odo]   | [PTO]  │  ← 3 columns
│ [Aux]     | [Cycle] |        │
└───────────────────────────────┘
```

### Desktop View (> 1024px)

```
┌─────────────────────────────────────────┐
│ Asset Classification                    │
├─────────────────────────────────────────┤
│ Category    | Type    | Power | Status │  ← 2 columns still
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Usage Metrics                           │
├─────────────────────────────────────────┤
│ [Engine] | [Odo] | [PTO] | [Aux] | ... │  ← 4 columns
└─────────────────────────────────────────┘
```

---

## Color Scheme

### Operational Status Colors

- **Available**: Blue (default badge)
- **In Use**: Gray (secondary badge)
- **Maintenance**: Red (destructive badge)
- **Reserved**: Gray border (outline badge)
- **Out of Service**: Gray border (outline badge)

### Primary Metric Highlighting

- **Border**: `border-primary border-2` (2px blue)
- **Shadow**: `shadow-md` (elevated appearance)
- **Text**: `text-primary` (blue value text)
- **Badge**: Default variant (blue background)

### Progress Bar Colors

- **Normal**: Blue (`bg-primary`)
- **Warning**: Yellow (`bg-yellow-500`) - Above 80%
- **Critical**: Red (`bg-destructive`) - Above 95%

---

## Icon Reference

### Section Headers (h-5 w-5)

- Car - Asset Classification
- Activity - Usage Metrics
- Settings - Equipment Specifications
- Link2 - Attached Assets
- MapPin - Current Location
- AlertTriangle - Active Alerts

### Metric Cards (h-4 w-4)

- Gauge - Odometer
- Timer - Engine Hours
- Zap - PTO Hours
- Clock - Auxiliary Hours
- RotateCw - Cycles

### Action Buttons (h-4 w-4)

- Route - View Trips
- Calendar - Maintenance

---

## Typography Hierarchy

### Card Titles
- **Size**: text-base (16px)
- **Weight**: font-semibold
- **With Icon**: flex items-center gap-2

### Field Labels
- **Size**: text-sm (14px)
- **Color**: text-muted-foreground (gray)
- **Weight**: font-normal

### Field Values
- **Size**: text-base (16px) or text-lg (18px) for specs
- **Weight**: font-medium
- **Color**: Default text color

### Metric Values
- **Size**: text-2xl (24px)
- **Weight**: font-bold
- **Color**: Primary color if isPrimary, default otherwise

### Units
- **Size**: text-sm (14px)
- **Weight**: font-normal
- **Color**: text-muted-foreground

---

## Summary

The VehicleDetailPanel now contains **10 major sections**:

1. Vehicle Header (existing)
2. Quick Stats (existing)
3. Vehicle Information (existing)
4. **Asset Classification (NEW)** ⭐
5. **Multi-Metric Tracking (NEW)** ⭐
6. **Equipment Specifications (NEW)** ⭐
7. **Attached Assets (NEW)** ⭐
8. Current Location (existing)
9. Active Alerts (existing)
10. Action Buttons (existing)

**Layout is:**
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Clean and organized
- ✅ Follows existing patterns
- ✅ Conditionally rendered
- ✅ Type-safe
- ✅ Accessible
