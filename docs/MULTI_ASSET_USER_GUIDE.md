# Multi-Asset Fleet Management - User Guide

**Version**: 1.0
**Last Updated**: 2025-11-19
**Migration**: 032_multi_asset_vehicle_extensions.sql

---

## Table of Contents

1. [Introduction to Asset Types](#1-introduction-to-asset-types)
2. [How to Add Different Asset Types](#2-how-to-add-different-asset-types)
3. [How to Attach Trailers to Tractors](#3-how-to-attach-trailers-to-tractors)
4. [How to Track Equipment Hours](#4-how-to-track-equipment-hours)
5. [Setting Up Hour-Based Maintenance](#5-setting-up-hour-based-maintenance)
6. [Filtering by Asset Type](#6-filtering-by-asset-type)
7. [Multi-Metric Maintenance Tracking](#7-multi-metric-maintenance-tracking)
8. [Equipment Specifications](#8-equipment-specifications)
9. [Best Practices](#9-best-practices)
10. [FAQ](#10-faq)

---

## 1. Introduction to Asset Types

The Fleet Management System now supports tracking for a wide variety of assets beyond traditional passenger vehicles, including:

### Asset Categories

- **PASSENGER_VEHICLE** - Cars, SUVs, passenger vans
- **HEAVY_EQUIPMENT** - Construction equipment, excavators, loaders
- **TRAILER** - Flatbeds, enclosed trailers, refrigerated units
- **TRACTOR** - Semi-tractors, farm tractors, road tractors
- **SPECIALTY** - Generators, compressors, pumps, welders
- **NON_POWERED** - Storage containers, portable equipment

### Key Features

- **Multi-Metric Tracking**: Track odometer, engine hours, PTO hours, auxiliary hours, and cycles
- **Asset Relationships**: Link tractors to trailers, equipment to attachments
- **Equipment-Specific Fields**: Capacity, reach, lift height, bucket capacity
- **Operational Status**: Available, In Use, Maintenance, Reserved
- **Specialized Maintenance**: Hour-based and cycle-based maintenance schedules

---

## 2. How to Add Different Asset Types

### Adding a Passenger Vehicle

1. Navigate to **Vehicles** > **Add Vehicle**
2. Fill in basic information:
   - VIN, Make, Model, Year
   - License Plate
3. Select **Asset Category**: `PASSENGER_VEHICLE`
4. Select **Asset Type**: `SEDAN`, `SUV`, `TRUCK`, or `VAN`
5. Set **Power Type**: `SELF_POWERED`
6. Set **Primary Metric**: `ODOMETER`
7. Enter current odometer reading
8. Click **Save**

### Adding Heavy Equipment (Excavator)

1. Navigate to **Vehicles** > **Add Vehicle**
2. Fill in basic information:
   - Make, Model, Year (VIN optional for equipment)
   - Equipment ID or Serial Number
3. Select **Asset Category**: `HEAVY_EQUIPMENT`
4. Select **Asset Type**: `EXCAVATOR`
5. Set **Power Type**: `SELF_POWERED`
6. Set **Primary Metric**: `ENGINE_HOURS`
7. Fill in equipment specifications:
   - **Capacity (tons)**: Maximum lifting capacity
   - **Max Reach (feet)**: Arm reach
   - **Bucket Capacity (cubic yards)**: Bucket size
   - **Operating Weight (lbs)**: Total weight
8. Set operational parameters:
   - **Has PTO**: Check if has Power Take-Off
   - **Is Road Legal**: Usually `No` for heavy equipment
   - **Requires Special License**: Check if operator needs certification
9. Enter current metrics:
   - Engine Hours
   - PTO Hours (if applicable)
10. Click **Save**

### Adding a Semi-Trailer

1. Navigate to **Vehicles** > **Add Vehicle**
2. Fill in basic information:
   - VIN, Make, Model, Year
   - License Plate
3. Select **Asset Category**: `TRAILER`
4. Select **Asset Type**: `DRY_VAN_TRAILER`, `FLATBED_TRAILER`, etc.
5. Set **Power Type**: `TOWED`
6. Set **Primary Metric**: `CALENDAR` (trailers typically use calendar-based maintenance)
7. Fill in trailer specifications:
   - **Axle Count**: Number of axles
   - **Max Payload (kg)**: Maximum cargo weight
   - **Tank Capacity (L)**: For refrigerated trailers
8. Set **Operational Status**: `AVAILABLE`
9. Click **Save**

### Adding a Semi-Tractor

1. Navigate to **Vehicles** > **Add Vehicle**
2. Fill in basic information:
   - VIN, Make, Model, Year
   - License Plate
3. Select **Asset Category**: `TRACTOR`
4. Select **Asset Type**: `SEMI_TRACTOR`, `DAY_CAB_TRACTOR`, or `SLEEPER_CAB_TRACTOR`
5. Set **Power Type**: `SELF_POWERED`
6. Set **Primary Metric**: `ODOMETER`
7. Set **Requires CDL**: `Yes`
8. Enter current metrics:
   - Odometer
   - Engine Hours
9. Click **Save**

### Adding Specialty Equipment (Generator)

1. Navigate to **Vehicles** > **Add Vehicle**
2. Fill in basic information:
   - Make, Model, Serial Number
3. Select **Asset Category**: `SPECIALTY`
4. Select **Asset Type**: `GENERATOR`
5. Set **Power Type**: `PORTABLE` or `STATIONARY`
6. Set **Primary Metric**: `ENGINE_HOURS` or `AUX_HOURS`
7. Set **Has Aux Power**: `Yes`
8. Enter specifications:
   - **Capacity (tons)**: Power output capacity
   - **Tank Capacity (L)**: Fuel tank size
9. Enter current hours
10. Click **Save**

---

## 3. How to Attach Trailers to Tractors

### Creating a Tractor-Trailer Combination

1. Navigate to **Assets** > **Asset Relationships**
2. Click **Create Relationship**
3. Select **Parent Asset** (the tractor):
   - Use search or dropdown to find the semi-tractor
4. Select **Child Asset** (the trailer):
   - Filter by `Asset Category = TRAILER`
   - Select the specific trailer
5. Select **Relationship Type**: `TOWS`
6. Set **Effective From**: Date/time when attached (defaults to now)
7. Add optional **Notes**: "Attached for cross-country haul #1234"
8. Click **Create**

### Viewing Active Combinations

1. Navigate to **Assets** > **Active Combinations**
2. See all currently attached asset pairs:
   - Parent Asset (Tractor)
   - Child Asset (Trailer)
   - Relationship Type
   - Since When (Effective From)

### Detaching a Trailer

**Method 1: Deactivate Relationship**
1. Navigate to **Assets** > **Asset Relationships**
2. Find the relationship in the list
3. Click **Deactivate**
4. Relationship is ended (sets `effective_to = NOW()`)

**Method 2: From Vehicle Detail Page**
1. View the tractor's detail page
2. Scroll to **Attached Assets** section
3. Click **Detach** next to the trailer
4. Confirm the action

### Relationship History

1. Navigate to a specific vehicle's detail page
2. Scroll to **Relationship History**
3. View complete history of all attachments:
   - When attached
   - When detached
   - Who made the change
   - Notes

---

## 4. How to Track Equipment Hours

### Understanding Multi-Metric Tracking

Different assets use different primary metrics:

| Asset Type | Primary Metric | Secondary Metrics |
|------------|----------------|-------------------|
| Passenger Vehicle | Odometer | Engine Hours |
| Semi-Tractor | Odometer | Engine Hours |
| Trailer | Calendar | N/A |
| Excavator | Engine Hours | PTO Hours, Cycles |
| Generator | Aux Hours | Engine Hours |
| Compressor | Cycles | Engine Hours |
| Forklift | Engine Hours | Cycles |

### Recording Equipment Hours

**Method 1: Manual Entry**
1. Navigate to the vehicle/equipment detail page
2. Click **Update Metrics**
3. Enter current readings:
   - Engine Hours
   - PTO Hours (if applicable)
   - Aux Hours (if applicable)
   - Cycle Count (for compressors, etc.)
4. System auto-updates **Last Metric Update** timestamp
5. Click **Save**

**Method 2: Telemetry Integration**
- Equipment with telematics automatically reports hours
- View in **Telemetry** > **Equipment Events**
- Data syncs every 15 minutes (configurable)

### Viewing Equipment Metrics

1. Navigate to **Vehicles** page
2. For heavy equipment, you'll see:
   - **Primary Metric** badge (e.g., "ENGINE_HOURS")
   - Current reading displayed prominently
   - Time since last update
3. Click on an asset to see all metrics:
   - Engine Hours
   - PTO Hours
   - Aux Hours
   - Cycle Count
   - Odometer (if applicable)

### Equipment Dashboard

Navigate to **Dashboard** > **Equipment Overview**:
- **Total Equipment Hours** across fleet
- **Average PTO Hours** per equipment type
- **Equipment Utilization** charts
- **Metrics by Asset Type**

---

## 5. Setting Up Hour-Based Maintenance

### Creating Hour-Based Maintenance Schedules

**Example: Excavator Oil Change Every 250 Engine Hours**

1. Navigate to **Maintenance** > **Schedules**
2. Click **Create Schedule**
3. Fill in the form:
   - **Vehicle/Asset**: Select the excavator
   - **Service Type**: `Oil Change`
   - **Trigger Metric**: `ENGINE_HOURS`
   - **Service Interval Hours**: `250`
   - **Last Service Engine Hours**: Current reading (e.g., `1000`)
   - **Next Service Due**: Auto-calculated as `1250`
   - **Priority**: `Medium`
   - **Estimated Cost**: `$350`
4. Click **Save**

**Example: PTO-Based Maintenance**

For equipment with Power Take-Off (like some excavators):

1. Create Schedule
2. Set **Trigger Metric**: `PTO_HOURS`
3. Set **Service Interval**: `100` (PTO hours)
4. System tracks PTO hours separately from engine hours

### Multi-Metric Maintenance (AND/OR Logic)

**Example: Service Due When 500 Hours OR 6 Months**

1. Create Schedule
2. Set **Trigger Metric**: `ENGINE_HOURS`
3. Set **Service Interval Hours**: `500`
4. Set **Service Interval Days**: `180` (6 months)
5. Set **Trigger Condition**: `OR`
6. Maintenance becomes due when **either** condition is met

**Example: Service Due When 1000 Miles AND 3 Months**

1. Create Schedule
2. Set **Trigger Metric**: `ODOMETER`
3. Set **Service Interval Miles**: `1000`
4. Set **Service Interval Days**: `90`
5. Set **Trigger Condition**: `AND`
6. Maintenance becomes due only when **both** conditions are met

### Viewing Hour-Based Maintenance Due

Navigate to **Maintenance** > **Due Soon**:
- Filter by **Trigger Metric** (e.g., `ENGINE_HOURS`)
- See remaining hours until due
- Color coding:
  - Green: >100 hours remaining
  - Yellow: 50-100 hours remaining
  - Orange: 10-50 hours remaining
  - Red: Overdue

### Maintenance Alerts

1. Navigate to **Settings** > **Notifications**
2. Configure hour-based alerts:
   - Alert when within 50 hours of due
   - Alert when within 25 hours of due
   - Alert when overdue
3. Choose notification methods:
   - Email
   - SMS
   - In-app notification
   - Microsoft Teams message

---

## 6. Filtering by Asset Type

### Using Asset Type Filters

**On the Vehicles Page:**

1. Navigate to **Vehicles**
2. Use the filter panel on the left:
   - **Asset Category**: Select one or multiple
   - **Asset Type**: Filtered based on category
   - **Power Type**: Self-powered, Towed, Stationary
   - **Operational Status**: Available, In Use, etc.
   - **Primary Metric**: Filter by tracking method
   - **Road Legal**: Yes/No
3. Apply filters
4. Results update in real-time

### Filter Examples

**Show all available excavators:**
- Asset Category = `HEAVY_EQUIPMENT`
- Asset Type = `EXCAVATOR`
- Operational Status = `AVAILABLE`

**Show all trailers in maintenance:**
- Asset Category = `TRAILER`
- Operational Status = `MAINTENANCE`

**Show all equipment requiring special licenses:**
- Requires Special License = `Yes`
- Group results by Asset Type

**Show all equipment due for maintenance:**
- Navigate to **Maintenance** > **Due Soon**
- Filter by Asset Category
- Sort by hours until due

### Saved Filters

1. Create your filter combination
2. Click **Save Filter**
3. Name it (e.g., "Available Heavy Equipment")
4. Access from **Saved Filters** dropdown

---

## 7. Multi-Metric Maintenance Tracking

### Understanding Metrics

| Metric | Description | Typical Use Case |
|--------|-------------|------------------|
| **ODOMETER** | Miles/kilometers driven | Vehicles that travel on roads |
| **ENGINE_HOURS** | Total engine running time | Heavy equipment, stationary generators |
| **PTO_HOURS** | Power Take-Off hours | Excavators, agricultural equipment |
| **AUX_HOURS** | Auxiliary power hours | Generators, mobile welders |
| **CYCLES** | Operation cycles | Compressors, automated equipment |
| **CALENDAR** | Time-based only | Trailers, non-powered assets |

### Setting Primary Metric

When adding or editing an asset:

1. Select **Primary Metric** based on primary usage
2. This determines:
   - What displays prominently on vehicle card
   - Default maintenance scheduling metric
   - Dashboard metric tracking

### Tracking Multiple Metrics

Even with a primary metric, you can track all applicable metrics:

**Example: Excavator**
- Primary Metric: `ENGINE_HOURS`
- Also tracked:
  - PTO Hours (for hydraulic system maintenance)
  - Cycle Count (for bucket operations)
  - Odometer (if road-legal and transported)

### Maintenance Due Calculation

System automatically calculates maintenance due based on:

1. **Current metric values** (from last update)
2. **Service interval** for each metric
3. **Last service readings**
4. **Trigger condition** (AND/OR logic)

**Example Calculation:**
- Last oil change at 1000 engine hours
- Service interval: every 250 hours
- Current reading: 1220 hours
- Next due at: 1250 hours
- Remaining: 30 hours

---

## 8. Equipment Specifications

### Heavy Equipment Specifications

When adding heavy equipment, specify:

| Field | Description | Example |
|-------|-------------|---------|
| **Capacity (tons)** | Maximum lifting/loading capacity | 25 tons |
| **Max Reach (feet)** | Maximum reach distance | 30 feet |
| **Lift Height (feet)** | Maximum lift height | 25 feet |
| **Bucket Capacity (yd³)** | Bucket volume | 2.5 cubic yards |
| **Operating Weight (lbs)** | Total equipment weight | 45,000 lbs |

### Trailer Specifications

| Field | Description | Example |
|-------|-------------|---------|
| **Axle Count** | Number of axles | 3 |
| **Max Payload (kg)** | Maximum cargo weight | 20,000 kg |
| **Tank Capacity (L)** | Fuel tank for refrigeration | 200 liters |

### Using Specifications

**Job Assignment:**
- Find excavators with capacity ≥ 20 tons
- Filter: Capacity (tons) ≥ 20

**Equipment Selection:**
- Need to lift 15 feet high
- Filter: Lift Height ≥ 15 feet

**Trailer Matching:**
- Need 18,000 kg capacity
- Filter: Max Payload ≥ 18,000 kg

---

## 9. Best Practices

### Asset Organization

1. **Use Consistent Naming**:
   - Excavators: "EX-001", "EX-002"
   - Tractors: "TR-001", "TR-002"
   - Trailers: "TL-001", "TL-002"

2. **Set Operational Status**:
   - Update status when equipment goes into maintenance
   - Mark as "Reserved" when allocated to projects
   - Keep status current for accurate availability

3. **Group Similar Assets**:
   - Use Group ID for project-specific fleets
   - Use Fleet ID for geographic divisions
   - Use Location ID to track current facility

### Maintenance Scheduling

1. **Choose Appropriate Metrics**:
   - Use engine hours for equipment that idles
   - Use PTO hours for hydraulic-intensive operations
   - Use calendar for trailers and non-powered assets

2. **Set Realistic Intervals**:
   - Follow manufacturer recommendations
   - Adjust based on operating conditions
   - Heavy use = shorter intervals

3. **Use Multi-Metric Triggers**:
   - "500 hours OR 6 months" ensures timely service
   - Prevents over-service and under-service

### Hour Tracking

1. **Update Regularly**:
   - Update hours at end of each shift (manual)
   - Or use telematics for automatic tracking
   - Accurate hours = accurate maintenance scheduling

2. **Track All Metrics**:
   - Even if not primary, track secondary metrics
   - Helps identify usage patterns
   - Supports equipment lifecycle analysis

### Asset Relationships

1. **Document Combinations**:
   - Always create relationship when attaching
   - Add notes about the purpose (e.g., "Job #1234")
   - Deactivate when detached

2. **Track History**:
   - Use relationship history for utilization analysis
   - Identify frequent pairings
   - Optimize future assignments

---

## 10. FAQ

### General Questions

**Q: Can I change an asset's category after creation?**
A: Yes, but be cautious. Changing category may affect:
- Available maintenance schedules
- Reporting dashboards
- Filter results

**Q: What if my equipment doesn't have a VIN?**
A: VIN is optional for heavy equipment. Use:
- Serial number in the VIN field
- Equipment ID
- Manufacturer part number

**Q: Can one tractor tow multiple trailers?**
A: Yes, create multiple relationships from the same parent tractor to different trailers. However, typically only one relationship is active at a time.

### Metrics & Maintenance

**Q: What if I don't know the current equipment hours?**
A: Start from 0 or your best estimate. Future tracking will still be accurate relative to the starting point.

**Q: Can I track custom metrics?**
A: Currently limited to: Odometer, Engine Hours, PTO Hours, Aux Hours, Cycles. Custom metrics can be tracked in the Notes field.

**Q: How do I handle equipment with multiple engines?**
A: Track total combined hours in Engine Hours. Add notes specifying "Engine A: X hours, Engine B: Y hours".

### Asset Relationships

**Q: Can I attach equipment to equipment (e.g., backhoe to tractor)?**
A: Yes, use relationship type `ATTACHED`. Parent = tractor, Child = backhoe attachment.

**Q: What's the difference between TOWS and ATTACHED?**
A:
- **TOWS**: Trailer behind a tractor (separate assets)
- **ATTACHED**: Equipment mounted/attached (bucket, blade, etc.)

**Q: Can I see all trailers that have ever been paired with a specific tractor?**
A: Yes, view the tractor's detail page and check "Relationship History".

### Filtering & Reporting

**Q: How do I export a list of all heavy equipment?**
A:
1. Filter by Asset Category = `HEAVY_EQUIPMENT`
2. Click **Export** > **CSV** or **Excel**

**Q: Can I create custom reports by asset type?**
A: Yes, navigate to **Reports** > **Custom Report Builder** and select filters by asset category, type, and metrics.

**Q: How do I find all equipment needing service this week?**
A:
1. Navigate to **Maintenance** > **Due Soon**
2. Filter by date range: Next 7 days
3. Optionally filter by Asset Category

### Advanced Features

**Q: Can I set different maintenance schedules based on usage intensity?**
A: Yes, create multiple schedules for the same asset with different metrics and intervals.

**Q: How do I track equipment that's rented vs owned?**
A: Use custom fields or tags in the Notes section. Future updates will include ownership status.

**Q: Can I track fuel consumption by asset type?**
A: Yes, navigate to **Fuel** > **Transactions** and filter by Asset Type for fuel analysis by category.

---

## Support & Training

For additional assistance:

- **Email**: support@fleetmanagement.com
- **Documentation**: [https://docs.fleetmanagement.com](https://docs.fleetmanagement.com)
- **Video Tutorials**: Available in-app under **Help** > **Video Library**
- **Training Sessions**: Contact your account manager

---

**Document Version History:**
- v1.0 (2025-11-19): Initial release with multi-asset support
