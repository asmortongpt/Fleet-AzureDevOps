# Asset Type Filter - Usage Examples

## Example Use Cases

### Use Case 1: Find Available Heavy Equipment

**Scenario:** Fleet manager needs to see all available excavators for a new project.

**Steps:**
1. Open Fleet Dashboard
2. Click "Asset Filters" button
3. Select Asset Category: "Heavy Equipment"
4. Select Asset Type: "Excavator"
5. Select Operational Status: "Available"

**Result URL:**
```
http://localhost:3000/dashboard?asset_category=HEAVY_EQUIPMENT&asset_type=EXCAVATOR&operational_status=AVAILABLE
```

**Expected Result:**
- List shows only available excavators
- Map view updates to show their locations
- Metrics update to reflect filtered count

---

### Use Case 2: Track All Road-Legal Vehicles

**Scenario:** Safety manager needs to verify all road-legal vehicles for DOT compliance.

**Steps:**
1. Open Fleet Dashboard
2. Click "Asset Filters" button
3. Check "Road Legal Only" checkbox

**Result URL:**
```
http://localhost:3000/dashboard?is_road_legal=true
```

**Expected Result:**
- List shows only vehicles that can operate on public roads
- Includes passenger vehicles, commercial trucks
- Excludes off-road only equipment

---

### Use Case 3: Find Towed Assets for Transport

**Scenario:** Operations manager needs to plan transport for all towed equipment.

**Steps:**
1. Open Fleet Dashboard
2. Click "Asset Filters" button
3. Select Power Type: "Towed"

**Result URL:**
```
http://localhost:3000/dashboard?power_type=TOWED
```

**Expected Result:**
- List shows all trailers and towed equipment
- Helps plan which tractors are needed
- Identifies assets that need transport

---

### Use Case 4: Maintenance Schedule by Metric Type

**Scenario:** Maintenance supervisor wants to see all equipment tracked by engine hours.

**Steps:**
1. Open Fleet Dashboard
2. Click "Asset Filters" button
3. Select Primary Metric: "Engine Hours"

**Result URL:**
```
http://localhost:3000/dashboard?primary_metric=ENGINE_HOURS
```

**Expected Result:**
- Shows all equipment tracked by engine hours
- Useful for scheduling hour-based maintenance
- Excludes odometer-based vehicles

---

### Use Case 5: In-Use Specialty Equipment

**Scenario:** Project coordinator needs to see which specialty equipment is currently deployed.

**Steps:**
1. Open Fleet Dashboard
2. Click "Asset Filters" button
3. Select Asset Category: "Specialty Equipment"
4. Select Operational Status: "In Use"

**Result URL:**
```
http://localhost:3000/dashboard?asset_category=SPECIALTY&operational_status=IN_USE
```

**Expected Result:**
- Shows generators, compressors, pumps, welders in use
- Helps identify what's available for new projects
- Shows current deployment status

---

## Sharing Filtered Views

### Example 1: Email to Team

**Subject:** Available Excavators for Project Alpha

**Body:**
```
Team,

Here are the available excavators for Project Alpha:
http://localhost:3000/dashboard?asset_category=HEAVY_EQUIPMENT&asset_type=EXCAVATOR&operational_status=AVAILABLE

Please review and let me know which one works best for the site conditions.

Thanks,
Fleet Manager
```

### Example 2: Dashboard Bookmark

**Name:** Maintenance - Engine Hour Equipment
**URL:** `http://localhost:3000/dashboard?primary_metric=ENGINE_HOURS`

### Example 3: Report Generation

**Filter:** All road-legal passenger vehicles requiring maintenance
**URL:** `http://localhost:3000/dashboard?asset_category=PASSENGER_VEHICLE&is_road_legal=true&operational_status=MAINTENANCE`

---

## API Integration Examples

### Example 1: Fetch Heavy Equipment

```typescript
const filters = {
  asset_category: 'HEAVY_EQUIPMENT',
  operational_status: 'AVAILABLE'
}

const response = await apiClient.vehicles.list(filters)
// Returns: All available heavy equipment
```

### Example 2: Fetch Excavators Needing Maintenance

```typescript
const filters = {
  asset_category: 'HEAVY_EQUIPMENT',
  asset_type: 'EXCAVATOR',
  operational_status: 'MAINTENANCE'
}

const response = await apiClient.vehicles.list(filters)
// Returns: All excavators currently in maintenance
```

### Example 3: Fetch All Trailers

```typescript
const filters = {
  asset_category: 'TRAILER'
}

const response = await apiClient.vehicles.list(filters)
// Returns: All trailers (flatbed, enclosed, dump, etc.)
```

---

## Component Usage in Other Pages

### Usage in Asset Management Page

```typescript
import { AssetTypeFilter, FilterState } from '@/components/filters/AssetTypeFilter'

function AssetManagementPage() {
  const [filters, setFilters] = useState<FilterState>({})

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    fetchAssets(newFilters)
  }

  return (
    <div>
      <AssetTypeFilter
        onFilterChange={handleFilterChange}
        onClear={() => setFilters({})}
        activeFilters={filters}
      />
      <AssetList filters={filters} />
    </div>
  )
}
```

### Usage in Maintenance Scheduling

```typescript
import { AssetTypeFilter } from '@/components/filters/AssetTypeFilter'

function MaintenanceScheduling() {
  const [assetFilters, setAssetFilters] = useState({
    primary_metric: 'ENGINE_HOURS'
  })

  return (
    <div>
      <h2>Schedule Hour-Based Maintenance</h2>
      <AssetTypeFilter
        onFilterChange={setAssetFilters}
        onClear={() => setAssetFilters({})}
        activeFilters={assetFilters}
      />
      {/* Maintenance scheduling UI */}
    </div>
  )
}
```

### Usage in Reports

```typescript
function AssetUtilizationReport() {
  const [filters, setFilters] = useState<FilterState>({
    operational_status: 'IN_USE'
  })

  return (
    <div>
      <h2>Asset Utilization Report</h2>
      <AssetTypeFilter
        onFilterChange={setFilters}
        onClear={() => setFilters({})}
        activeFilters={filters}
      />
      <UtilizationChart filters={filters} />
      <UtilizationTable filters={filters} />
    </div>
  )
}
```

---

## Filter Combinations

### Combination 1: Construction Equipment
```
asset_category=HEAVY_EQUIPMENT
power_type=SELF_POWERED
is_road_legal=false
```

### Combination 2: Long-Haul Fleet
```
asset_category=TRACTOR
asset_type=ROAD_TRACTOR
operational_status=AVAILABLE
is_road_legal=true
```

### Combination 3: Stationary Power Equipment
```
asset_category=SPECIALTY
power_type=STATIONARY
primary_metric=ENGINE_HOURS
```

### Combination 4: Available Trailers
```
asset_category=TRAILER
operational_status=AVAILABLE
power_type=TOWED
```

---

## Advanced Integration Patterns

### Pattern 1: Filter Presets

```typescript
const FILTER_PRESETS = {
  construction: {
    asset_category: 'HEAVY_EQUIPMENT',
    power_type: 'SELF_POWERED'
  },
  transport: {
    asset_category: 'TRACTOR',
    is_road_legal: true
  },
  generators: {
    asset_category: 'SPECIALTY',
    asset_type: 'GENERATOR',
    operational_status: 'AVAILABLE'
  }
}

function QuickFilterButtons() {
  return (
    <div>
      <Button onClick={() => setFilters(FILTER_PRESETS.construction)}>
        Construction Equipment
      </Button>
      <Button onClick={() => setFilters(FILTER_PRESETS.transport)}>
        Transport Fleet
      </Button>
      <Button onClick={() => setFilters(FILTER_PRESETS.generators)}>
        Available Generators
      </Button>
    </div>
  )
}
```

### Pattern 2: Filter State Persistence

```typescript
// Save filters to localStorage
const saveFilters = (filters: FilterState) => {
  localStorage.setItem('assetFilters', JSON.stringify(filters))
}

// Load filters from localStorage
const loadFilters = (): FilterState => {
  const saved = localStorage.getItem('assetFilters')
  return saved ? JSON.parse(saved) : {}
}

// Use in component
useEffect(() => {
  const savedFilters = loadFilters()
  if (Object.keys(savedFilters).length > 0) {
    setFilters(savedFilters)
  }
}, [])
```

### Pattern 3: Filter Analytics

```typescript
// Track filter usage
const trackFilterChange = (filters: FilterState) => {
  analytics.track('Asset Filter Changed', {
    filterCount: Object.keys(filters).length,
    filters: filters,
    timestamp: new Date()
  })
}

// Use in component
const handleFilterChange = (newFilters: FilterState) => {
  setFilters(newFilters)
  trackFilterChange(newFilters)
  fetchAssets(newFilters)
}
```

---

## Testing Data

### Sample Test Vehicles

```typescript
const testVehicles = [
  {
    id: "1",
    make: "Caterpillar",
    model: "320",
    asset_category: "HEAVY_EQUIPMENT",
    asset_type: "EXCAVATOR",
    power_type: "SELF_POWERED",
    operational_status: "AVAILABLE",
    primary_metric: "ENGINE_HOURS",
    is_road_legal: false,
    engine_hours: 1250
  },
  {
    id: "2",
    make: "John Deere",
    model: "410L",
    asset_category: "HEAVY_EQUIPMENT",
    asset_type: "BACKHOE",
    power_type: "SELF_POWERED",
    operational_status: "IN_USE",
    primary_metric: "ENGINE_HOURS",
    is_road_legal: true,
    engine_hours: 3420
  },
  {
    id: "3",
    make: "Utility",
    model: "53' Van",
    asset_category: "TRAILER",
    asset_type: "ENCLOSED",
    power_type: "TOWED",
    operational_status: "AVAILABLE",
    primary_metric: "CALENDAR",
    is_road_legal: true
  },
  {
    id: "4",
    make: "Generac",
    model: "G200",
    asset_category: "SPECIALTY",
    asset_type: "GENERATOR",
    power_type: "STATIONARY",
    operational_status: "MAINTENANCE",
    primary_metric: "ENGINE_HOURS",
    is_road_legal: false,
    engine_hours: 850
  }
]
```

---

## Filter Logic Reference

```typescript
// Asset type filtering logic
const matchesAssetCategory = !filters.asset_category ||
  vehicle.asset_category === filters.asset_category

const matchesAssetType = !filters.asset_type ||
  vehicle.asset_type === filters.asset_type

const matchesPowerType = !filters.power_type ||
  vehicle.power_type === filters.power_type

const matchesOperationalStatus = !filters.operational_status ||
  vehicle.operational_status === filters.operational_status

const matchesPrimaryMetric = !filters.primary_metric ||
  vehicle.primary_metric === filters.primary_metric

const matchesRoadLegal = filters.is_road_legal === undefined ||
  vehicle.is_road_legal === filters.is_road_legal

// Combine all conditions
const matchesAllFilters =
  matchesAssetCategory &&
  matchesAssetType &&
  matchesPowerType &&
  matchesOperationalStatus &&
  matchesPrimaryMetric &&
  matchesRoadLegal
```

---

## Common Workflows

### Workflow 1: Daily Equipment Check
1. Open dashboard with: `?operational_status=IN_USE`
2. Review all deployed equipment
3. Check for maintenance alerts
4. Update assignments as needed

### Workflow 2: Project Planning
1. Filter: `?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE`
2. Select equipment for project
3. Reserve selected assets
4. Generate work order

### Workflow 3: Maintenance Review
1. Filter: `?operational_status=MAINTENANCE`
2. Review all items in maintenance
3. Check completion status
4. Update operational status

### Workflow 4: Fleet Optimization
1. Filter: `?asset_category=TRAILER&operational_status=AVAILABLE`
2. Identify underutilized trailers
3. Adjust fleet composition
4. Generate utilization report

---

**Documentation Complete:** Ready for user training and deployment
