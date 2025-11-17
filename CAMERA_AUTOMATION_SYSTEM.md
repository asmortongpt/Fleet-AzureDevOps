# Traffic Camera Automation System

## Overview

A comprehensive system for automatically synchronizing traffic camera data from external sources (starting with City of Tallahassee).

## System Architecture

### Components

1. **Database Layer**
   - `camera_data_sources` - Configuration for external data sources
   - `traffic_cameras` - Synchronized camera records with location and metadata

2. **Synchronization Service** (`api/src/services/camera-sync.ts`)
   - Fetches data from ArcGIS REST APIs
   - Transforms data using configurable field mappings
   - Upserts cameras to database
   - Tracks sync status and errors

3. **API Endpoints** (`api/src/routes/traffic-cameras.ts`)
   - Camera listing and filtering
   - Nearby camera search
   - Manual sync triggers
   - Data source management

4. **Automated Sync** (`k8s/camera-sync-cronjob.yaml`)
   - Kubernetes CronJob runs every 15 minutes
   - Pulls latest camera data automatically
   - Runs via `api/src/scripts/sync-cameras.ts`

## Pre-configured Data Sources

### City of Tallahassee Traffic Cameras
- **Count**: 243 cameras
- **Provider**: Tallahassee-Leon County GIS
- **Service URL**: `https://cotinter.leoncountyfl.gov/cotinter/rest/services/Vector/COT_DriverInfoCenter_D_WM/MapServer/0`
- **Sync Interval**: Every 15 minutes
- **Coverage**: Tallahassee, FL metropolitan area

## API Usage

### Get All Cameras

```bash
GET /api/traffic-cameras

# Query parameters
?enabled=true        # Filter by enabled status
?source_id={uuid}    # Filter by data source
?limit=1000          # Limit results (default: 1000)
?offset=0            # Pagination offset
```

### Get Camera by ID

```bash
GET /api/traffic-cameras/:id
```

### Find Nearby Cameras

```bash
GET /api/traffic-cameras/nearby?lat=30.4383&lng=-84.2807&radius_miles=5
```

### List Data Sources with Sync Status

```bash
GET /api/traffic-cameras/sources/list
```

Response includes:
- Last sync time
- Sync status (success/failed/pending)
- Total cameras synced
- Error messages (if any)

### Manual Sync Trigger (Admin only)

```bash
POST /api/traffic-cameras/sync

# Or sync specific source
POST /api/traffic-cameras/sources/:source_id/sync
```

## Adding New Data Sources

### Via Database

```sql
INSERT INTO camera_data_sources (
  name,
  description,
  source_type,
  service_url,
  enabled,
  sync_interval_minutes,
  field_mapping,
  metadata
) VALUES (
  'Your Data Source Name',
  'Description of the data source',
  'arcgis',  -- or 'rest_api', 'csv', 'geojson'
  'https://your-arcgis-endpoint.com/FeatureServer/0',
  true,
  30,  -- Sync every 30 minutes
  jsonb_build_object(
    'EXTERNAL_ID_FIELD', 'external_id',
    'NAME_FIELD', 'name',
    'ADDRESS_FIELD', 'address',
    'CAMERA_URL_FIELD', 'camera_url',
    'LATITUDE_FIELD', 'latitude',
    'LONGITUDE_FIELD', 'longitude'
  ),
  jsonb_build_object(
    'provider', 'Provider Name',
    'coverage_area', 'Geographic Area'
  )
);
```

### Field Mapping

The `field_mapping` JSON maps external field names to internal schema:

| Internal Field | Purpose |
|---------------|---------|
| `external_id` | Unique identifier from source (required) |
| `name` | Camera name (required) |
| `address` | Street address |
| `camera_url` | URL to camera view/stream |
| `stream_url` | Direct video stream URL |
| `image_url` | Static image URL |
| `latitude` | Latitude (decimal degrees) |
| `longitude` | Longitude (decimal degrees) |
| `cross_street1` | First cross street |
| `cross_street2` | Second cross street |
| `cross_streets` | Combined cross streets text |

## Deployment

### Initial Setup

1. **Deploy database migration**:
   ```bash
   kubectl apply -f k8s/camera-migration-job.yaml
   kubectl wait --for=condition=complete job/camera-system-migration -n fleet-management
   ```

2. **Deploy updated API**:
   ```bash
   kubectl set image deployment/fleet-api fleet-api=fleetappregistry.azurecr.io/fleet-api:v1.3-cameras -n fleet-management
   kubectl rollout status deployment/fleet-api -n fleet-management
   ```

3. **Deploy CronJob**:
   ```bash
   kubectl apply -f k8s/camera-sync-cronjob.yaml
   ```

### Manual Sync

Trigger immediate sync:
```bash
kubectl create job --from=cronjob/camera-sync camera-sync-manual -n fleet-management
```

### Monitor Sync Status

```bash
# Check CronJob status
kubectl get cronjobs -n fleet-management

# View sync job logs
kubectl logs -l job-name=camera-sync -n fleet-management

# Check database sync status
curl https://fleet.capitaltechalliance.com/api/traffic-cameras/sources/list
```

## Database Schema

### camera_data_sources

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Unique source name |
| source_type | VARCHAR(50) | 'arcgis', 'rest_api', 'csv', 'geojson', 'manual' |
| service_url | TEXT | API endpoint URL |
| enabled | BOOLEAN | Enable/disable syncing |
| sync_interval_minutes | INTEGER | How often to sync (default: 60) |
| field_mapping | JSONB | External to internal field mapping |
| authentication | JSONB | Auth configuration (token, OAuth, etc.) |
| last_sync_at | TIMESTAMP | Last successful sync time |
| last_sync_status | VARCHAR(20) | 'success', 'failed', 'pending' |
| last_sync_error | TEXT | Error message from last sync |
| total_cameras_synced | INTEGER | Count of synced cameras |
| metadata | JSONB | Additional metadata |

### traffic_cameras

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source_id | UUID | Foreign key to camera_data_sources |
| external_id | VARCHAR(255) | ID from external source |
| name | VARCHAR(255) | Camera name |
| address | TEXT | Street address |
| cross_street1 | VARCHAR(255) | First cross street |
| cross_street2 | VARCHAR(255) | Second cross street |
| cross_streets | TEXT | Combined cross streets |
| camera_url | TEXT | Camera view URL |
| stream_url | TEXT | Video stream URL |
| image_url | TEXT | Static image URL |
| latitude | DECIMAL(10,7) | Latitude (WGS84) |
| longitude | DECIMAL(10,7) | Longitude (WGS84) |
| enabled | BOOLEAN | Camera is active |
| operational | BOOLEAN | Camera is operational |
| last_checked_at | TIMESTAMP | Last health check |
| metadata | JSONB | Additional metadata |
| synced_at | TIMESTAMP | Last sync time |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Extensibility

The system is designed to support multiple data source types:

- **ArcGIS Feature Services** (implemented)
- **REST APIs** (add support in CameraSyncService)
- **CSV files** (add CSV parsing logic)
- **GeoJSON** (add GeoJSON parsing logic)
- **Manual entry** (via admin UI)

To add support for new source types, extend `CameraSyncService` in `api/src/services/camera-sync.ts`.

## Monitoring & Maintenance

### Health Checks

1. **CronJob Running**: `kubectl get cronjobs -n fleet-management`
2. **Recent Syncs**: Check `last_sync_at` in `camera_data_sources`
3. **Error Rate**: Monitor `last_sync_status` and `last_sync_error`
4. **Camera Count**: Verify `total_cameras_synced` matches expectations

### Troubleshooting

**Sync Failures:**
1. Check CronJob logs: `kubectl logs -l job-name=camera-sync -n fleet-management`
2. Verify database connectivity
3. Check external API availability
4. Review field_mapping configuration

**No Cameras Appearing:**
1. Verify data source is `enabled`
2. Check `last_sync_status` for errors
3. Manually trigger sync and check logs
4. Verify field_mapping matches external API response

## Future Enhancements

- [ ] Add support for camera health monitoring
- [ ] Implement camera image caching
- [ ] Add alerting for sync failures
- [ ] Create admin UI for data source management
- [ ] Add support for video stream validation
- [ ] Implement camera availability tracking
- [ ] Add geospatial queries using PostGIS
- [ ] Create camera map visualization component

---

**Last Updated**: November 10, 2025
**System Version**: v1.3-cameras
