# Facility Mapping & Innovative Dispatch Features

**New features for job site GPS tracking and advanced event visualization**

---

## Overview

The Radio Fleet Dispatch system now includes two major innovative features:

1. **Custom Facility Sitemaps** - Track radio GPS positions locally at job sites with custom coordinate systems
2. **Innovative Dispatch Displays** - Advanced visualizations for dispatch events with timeline, flow, and heat map views

---

## Feature 1: Custom Facility Sitemaps

### What It Does

Allows organizations to create custom facility/job site maps with:
- **Local Coordinate System**: Convert GPS coordinates to local site coordinates (e.g., meters from building entrance)
- **Site Map Overlays**: Upload floor plans or site maps as visual backgrounds
- **Zone Management**: Define zones within facilities (e.g., "Loading Dock", "Storage Area", "Office") with polygon boundaries
- **Real-time Tracking**: Display asset positions on the custom map in real-time
- **Reference Points**: Align GPS to local coordinates using known reference points

### Use Cases

1. **Construction Sites**: Track equipment and personnel across large job sites
2. **Warehouses**: Monitor forklift positions within warehouse zones
3. **Manufacturing Facilities**: Track workers and assets across production floors
4. **Emergency Response**: Position first responders on building floor plans
5. **Ports/Airports**: Track vehicles across large facilities with multiple zones

### How It Works

#### 1. Create a Facility

```bash
POST /facilities
```

```json
{
  "name": "Main Construction Site",
  "facility_type": "job_site",
  "organization_id": "org-uuid",

  // Geographic center point
  "latitude": 38.9072,
  "longitude": -77.0369,

  // Local coordinate system origin (typically same as center)
  "local_origin_lat": 38.9072,
  "local_origin_lng": -77.0369,
  "rotation_degrees": 0,
  "scale_factor": 1.0,

  // Site map image (optional)
  "map_image_url": "https://storage.example.com/sitemap.png",
  "map_width_meters": 200,
  "map_height_meters": 150,

  // Define zones
  "zones": [
    {
      "name": "Loading Area",
      "type": "restricted",
      "polygon": [[0, 0], [50, 0], [50, 30], [0, 30]],
      "color": "#ff6b6b",
      "alert_on_entry": true
    },
    {
      "name": "Storage Zone",
      "type": "normal",
      "polygon": [[60, 0], [150, 0], [150, 80], [60, 80]],
      "color": "#3b82f6"
    }
  ],

  // Reference points for calibration
  "reference_points": {
    "entrance": {
      "name": "Main Entrance",
      "lat": 38.9072,
      "lng": -77.0369,
      "local_x": 0,
      "local_y": 0
    },
    "corner": {
      "name": "NE Corner",
      "lat": 38.9080,
      "lng": -77.0360,
      "local_x": 100,
      "local_y": 100
    }
  }
}
```

#### 2. Log GPS Positions

When a radio/asset transmits GPS coordinates, the system automatically:

1. Converts GPS (lat/lng) to local coordinates (x, y)
2. Determines which zone the asset is in
3. Stores both GPS and local coordinates
4. Emits WebSocket event for real-time updates

```bash
POST /facilities/{facility_id}/positions
```

```json
{
  "asset_id": "asset-uuid",
  "radio_id": "RADIO-123",
  "unit_id": "UNIT-456",

  // GPS coordinates
  "latitude": 38.9075,
  "longitude": -77.0365,
  "altitude": 42.5,

  // Local coordinates (calculated automatically)
  "local_x": 25.3,
  "local_y": 18.7,
  "floor_level": 0,

  // GPS quality
  "speed_kmh": 5.2,
  "heading_degrees": 87,
  "satellites": 9,
  "hdop": 1.2,

  "position_timestamp": "2025-10-17T14:32:15Z"
}
```

#### 3. View Facility Map

Navigate to: **`/facility-map?facility_id=<uuid>`**

The interactive map shows:
- Real-time asset positions in local coordinates
- Zone boundaries with color coding
- Reference points for calibration
- Asset labels and movement indicators (heading arrows)
- Click on assets to highlight and see details

**Map Controls:**
- **Mouse Drag**: Pan the map
- **Mouse Wheel**: Zoom in/out
- **Zoom Buttons**: Precise zoom control
- **Reset Button**: Return to default view
- **Zones Toggle**: Show/hide zone boundaries
- **Labels Toggle**: Show/hide asset labels

#### 4. Query Historical Positions

Get position history for analysis:

```bash
GET /facilities/{facility_id}/positions?asset_id=<uuid>&start_time=<iso>&end_time=<iso>
```

### Coordinate Transformation

The system uses a simple Mercator-like projection for small areas (< 1 km):

**GPS → Local:**
```python
def gps_to_local(lat, lng, origin_lat, origin_lng, rotation, scale):
    # Convert to meters from origin
    R = 6371000  # Earth radius
    d_lat = radians(lat - origin_lat)
    d_lng = radians(lng - origin_lng)

    x_meters = R * d_lng * cos(radians(origin_lat))
    y_meters = R * d_lat

    # Apply rotation (if site is not aligned with north)
    if rotation != 0:
        x_rotated = x_meters * cos(rotation) - y_meters * sin(rotation)
        y_rotated = x_meters * sin(rotation) + y_meters * cos(rotation)
        x_meters, y_meters = x_rotated, y_rotated

    # Apply scale factor (meters per unit)
    local_x = x_meters / scale
    local_y = y_meters / scale

    return local_x, local_y
```

**Local → GPS:**
```python
def local_to_gps(local_x, local_y, origin_lat, origin_lng, rotation, scale):
    # Reverse transformation
    x_meters = local_x * scale
    y_meters = local_y * scale

    # Undo rotation
    if rotation != 0:
        x_rotated = x_meters * cos(-rotation) - y_meters * sin(-rotation)
        y_rotated = x_meters * sin(-rotation) + y_meters * cos(-rotation)
        x_meters, y_meters = x_rotated, y_rotated

    # Convert meters to degrees
    R = 6371000
    d_lat = degrees(y_meters / R)
    d_lng = degrees(x_meters / (R * cos(radians(origin_lat))))

    lat = origin_lat + d_lat
    lng = origin_lng + d_lng

    return lat, lng
```

### Zone Detection

Uses ray-casting algorithm to determine if a point is inside a polygon:

```python
def point_in_zone(x, y, polygon):
    inside = False
    n = len(polygon)
    p1x, p1y = polygon[0]

    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/facilities` | List all facilities |
| `POST` | `/facilities` | Create new facility |
| `GET` | `/facilities/{id}` | Get facility details |
| `PATCH` | `/facilities/{id}` | Update facility |
| `DELETE` | `/facilities/{id}` | Delete facility (soft) |
| `POST` | `/facilities/{id}/positions` | Log GPS position |
| `GET` | `/facilities/{id}/positions` | Get position history |
| `GET` | `/facilities/{id}/positions/active` | Get current positions |
| `POST` | `/facilities/transform/gps-to-local` | Convert GPS to local |
| `POST` | `/facilities/transform/local-to-gps` | Convert local to GPS |

### WebSocket Events

Subscribe to facility updates:

```javascript
socket.emit('subscribe', { room: 'facility:<facility-id>' });

socket.on('position_update', (position) => {
  console.log('New position:', position);
  // Update map in real-time
});
```

---

## Feature 2: Innovative Dispatch Displays

### What It Does

Advanced visualizations for dispatch events with multiple view modes:

1. **Timeline View**: Animated timeline showing events over time
2. **Flow Diagram**: Network graph showing relationships between events
3. **Heat Map**: Activity density by hour and priority
4. **3D View**: (Coming soon) Events in 3D space

### View Modes

#### 1. Timeline View

**Interactive animated timeline** showing events chronologically:

- Events positioned along time axis (last 24 hours)
- Color-coded by priority (red=critical, orange=high, blue=normal, green=low)
- Vertical lines connect events to timeline
- Labels show source (unit ID/radio ID)
- Hover to see event details
- Playback controls to animate event flow

**Use Cases:**
- Understand event sequence during incidents
- Identify patterns in radio traffic
- Review shift activity

#### 2. Flow Diagram View

**Network visualization** showing event relationships:

- Nodes sized by event count
- Connections show event flow
- Group by event type (transmission, incident, task, alert)
- See which event types trigger others
- Identify bottlenecks or delays

**Use Cases:**
- Analyze dispatch workflow
- Optimize response procedures
- Identify system bottlenecks

#### 3. Heat Map View

**Activity density visualization**:

- Grid: Hours (0-23) × Priority (Critical, High, Normal, Low)
- Color intensity = event count
- Identify busy hours
- Spot priority patterns
- Plan shift coverage

**Use Cases:**
- Shift planning (when are critical events most common?)
- Resource allocation (do we need more staff at certain hours?)
- Trend analysis (is activity increasing?)

#### 4. 3D View (Coming Soon)

**Three-dimensional event space**:

- X-axis: Time
- Y-axis: Priority
- Z-axis: Event type
- Animated particle effects
- VR/AR support

### Features

**Filters:**
- Filter by priority (Critical, High, Normal, Low)
- Filter by type (Transmission, Incident, Task, Alert)
- Filter by time range (1h, 6h, 24h, 7d)
- Filter by unit/channel

**Playback:**
- Play/Pause animation
- Adjustable speed (0.25x - 4x)
- Scrub timeline

**Export:**
- Export events as CSV
- Generate activity reports
- Screenshot visualizations

### How to Use

#### 1. View Dispatch Events

Navigate to: **`/dispatch-events`**

The page displays:
- Event count and time range
- Connection status (Live/Offline)
- Visualization canvas
- Event list with details

#### 2. Change View Mode

Use the tabs to switch between:
- **Timeline** - Event sequence over time
- **Flow** - Event relationships
- **Heat Map** - Activity density
- **3D** - (Coming soon)

#### 3. Apply Filters

Use the dropdowns to filter:
- **Priority**: All, Critical, High, Normal, Low
- **Type**: All, Transmission, Incident, Task, Alert

Events update in real-time as you filter.

#### 4. Control Playback

For animated views (Timeline, 3D):
- Click **Play** to start animation
- Use **Speed slider** to adjust (0.25x - 4x)
- Events will animate in chronological order

### Real-time Updates

The display automatically updates when new events occur:

1. WebSocket connection to backend
2. Listen for `dispatch_event` messages
3. Add new events to visualization
4. Animate entry (fade in, position transition)
5. Update statistics

```javascript
socket.on('dispatch_event', (event) => {
  // Add to event list
  setEvents(prev => [event, ...prev].slice(0, 1000));

  // Animate on canvas
  animateNewEvent(event);

  // Update counters
  updateStatistics();
});
```

### Event Types

The system tracks these event types:

1. **Transmission**: Radio transmission received
   - Includes duration, unit ID, channel
   - Voice or data transmission

2. **Incident**: Incident created or updated
   - Includes priority, location, status
   - Links to related transmissions

3. **Task**: Task assigned or completed
   - Includes assignee, status, deadline
   - Links to incident

4. **Alert**: System alert or notification
   - Includes alert type, severity
   - Triggered by policy rules

5. **Status Change**: Asset/unit status change
   - Includes old/new status
   - Location update

### Statistics

The display shows key metrics:

- **Total Events**: Count in time range
- **Critical Events**: High-priority count
- **Response Time**: Average time from transmission to task assignment
- **Active Units**: Unique units with events
- **Busiest Hour**: Hour with most activity
- **Top Channels**: Most active radio channels

---

## Database Schema

### `facilities` Table

```sql
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL DEFAULT 'job_site',
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Geographic location
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    boundary GEOMETRY(POLYGON, 4326),

    -- Local coordinate system
    local_origin_lat FLOAT NOT NULL,
    local_origin_lng FLOAT NOT NULL,
    rotation_degrees FLOAT NOT NULL DEFAULT 0.0,
    scale_factor FLOAT NOT NULL DEFAULT 1.0,
    reference_points JSONB NOT NULL DEFAULT '{}',

    -- Site map
    map_image_url VARCHAR(500),
    map_width_meters FLOAT,
    map_height_meters FLOAT,
    zones JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    postal_code VARCHAR(20),
    primary_contact VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX ix_facilities_name ON facilities(name);
CREATE INDEX ix_facilities_organization_id ON facilities(organization_id);
CREATE INDEX ix_facilities_status ON facilities(status);
CREATE INDEX ix_facilities_org_status ON facilities(organization_id, status)
    WHERE is_deleted = FALSE;
CREATE INDEX ix_facilities_boundary ON facilities USING GIST(boundary);
CREATE INDEX ix_facilities_zones ON facilities USING GIN(zones);
```

### `facility_position_logs` Table

```sql
CREATE TABLE facility_position_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,

    -- Asset identification
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    radio_id VARCHAR(50),
    unit_id VARCHAR(50),

    -- GPS coordinates
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    altitude FLOAT,

    -- Local coordinates
    local_x FLOAT NOT NULL,
    local_y FLOAT NOT NULL,
    floor_level INTEGER NOT NULL DEFAULT 0,
    zone_name VARCHAR(100),

    -- GPS quality
    speed_kmh FLOAT,
    heading_degrees FLOAT,
    satellites INTEGER,
    hdop FLOAT,

    -- Timestamp
    position_timestamp VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX ix_facility_position_logs_facility_id ON facility_position_logs(facility_id);
CREATE INDEX ix_facility_position_logs_asset_id ON facility_position_logs(asset_id);
CREATE INDEX ix_facility_position_logs_position_timestamp ON facility_position_logs(position_timestamp);
CREATE INDEX ix_facility_position_logs_facility_timestamp
    ON facility_position_logs(facility_id, position_timestamp);
CREATE INDEX ix_facility_position_logs_zone ON facility_position_logs(facility_id, zone_name);
```

---

## Migration

Run the database migration to add the new tables:

```bash
cd services/api
alembic upgrade head
```

This will run migration `002_add_facilities.py` which creates:
- `facilities` table with all columns and indexes
- `facility_position_logs` table with all columns and indexes
- GiST index for spatial queries on boundary polygons
- GIN indexes for JSONB columns (reference_points, zones, metadata)

---

## Testing

### Test Facility Creation

```bash
curl -X POST http://localhost:8000/facilities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Site",
    "facility_type": "job_site",
    "organization_id": "<org-uuid>",
    "latitude": 38.9072,
    "longitude": -77.0369,
    "local_origin_lat": 38.9072,
    "local_origin_lng": -77.0369,
    "rotation_degrees": 0,
    "scale_factor": 1.0,
    "zones": [
      {
        "name": "Zone A",
        "type": "normal",
        "polygon": [[0, 0], [50, 0], [50, 50], [0, 50]],
        "color": "#3b82f6"
      }
    ]
  }'
```

### Test Position Logging

```bash
curl -X POST http://localhost:8000/facilities/<facility-id>/positions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "radio_id": "RADIO-123",
    "unit_id": "UNIT-456",
    "latitude": 38.9075,
    "longitude": -77.0365,
    "local_x": 25.3,
    "local_y": 18.7,
    "position_timestamp": "2025-10-17T14:32:15Z"
  }'
```

### Test Coordinate Transformation

```bash
curl -X POST http://localhost:8000/facilities/transform/gps-to-local \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": "<facility-uuid>",
    "latitude": 38.9075,
    "longitude": -77.0365
  }'
```

---

## Production Deployment

1. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

2. **Update frontend navigation** to include:
   - Link to `/facility-map` in main menu
   - Link to `/dispatch-events` in main menu

3. **Configure WebSocket** server to emit:
   - `position_update` events for facility tracking
   - `dispatch_event` events for display visualization

4. **Set up GPS integration**:
   - Configure radio simulators to send GPS data
   - Update transmission handlers to log positions
   - Enable real-time position streaming

5. **Performance optimization**:
   - Add Redis caching for active positions
   - Use PostGIS extensions for advanced spatial queries
   - Enable canvas hardware acceleration

---

## Future Enhancements

### Facility Features
- [ ] Multi-floor support with floor switcher
- [ ] 3D building visualization
- [ ] Historical playback (replay movement over time)
- [ ] Geofence alerts (SMS/email when entering/exiting zones)
- [ ] Indoor positioning (Bluetooth/WiFi triangulation)
- [ ] Asset heatmaps (where assets spend most time)
- [ ] Route optimization (suggest best paths)

### Dispatch Display Features
- [ ] Voice waveform visualization
- [ ] Incident correlation graph (show related events)
- [ ] Predictive analytics (forecast busy periods)
- [ ] Sentiment analysis visualization
- [ ] Custom dashboard builder
- [ ] Export to PowerPoint/PDF
- [ ] AR/VR immersive view

---

## Support

For questions or issues with these features:

1. Check API documentation: http://localhost:8000/docs
2. Review ARCHITECTURE.md for system design
3. See QUICKSTART.md for setup instructions
4. Open an issue on GitHub

---

**Ready to track assets at job sites with custom facility maps!** 🗺️
