# Phase 1 Implementation Plan - Quick Wins

**Target**: Real-Time Task Management, Mobile Asset Check-In/Out, Asset Utilization Dashboard
**Timeline**: 4 weeks
**Deployment**: Azure VM AI Agents

---

## Agent Deployment Strategy

### Agent 1: Real-Time Task WebSocket Server
**File**: `azure-agents/agents/realtime-task-builder.ts`
**Responsibility**: Build WebSocket server for real-time task updates

**Deliverables**:
1. WebSocket server with Socket.IO
2. Redis pub/sub for multi-server scaling
3. Event handlers: TASK_CREATED, TASK_UPDATED, TASK_ASSIGNED, COMMENT_ADDED
4. Presence tracking (who's viewing which task)
5. Optimistic UI conflict resolution
6. Authentication middleware for WebSocket connections

**Technical Stack**:
- Socket.IO 4.x
- Redis 7.x (pub/sub)
- JWT authentication
- TypeScript strict mode

---

### Agent 2: Mobile Asset QR System Builder
**File**: `azure-agents/agents/mobile-asset-qr-builder.ts`
**Responsibility**: Build mobile-first asset check-in/out with QR scanning

**Deliverables**:
1. API endpoints:
   - POST /api/assets/:id/checkout (with photo upload)
   - POST /api/assets/:id/checkin (with condition report)
   - GET /api/assets/:id/qr-code (generate QR code)
2. Azure Blob Storage integration for photos
3. Photo compression and optimization
4. Offline-capable endpoint design (idempotent)
5. Location tracking (GPS coordinates)
6. Digital signature capture

**Technical Stack**:
- Multer for file uploads
- Sharp for image processing
- QRCode library for generation
- Azure Blob Storage SDK
- Geolocation validation

---

### Agent 3: Asset Utilization Analytics Builder
**File**: `azure-agents/agents/asset-analytics-builder.ts`
**Responsibility**: Build comprehensive asset utilization and ROI dashboard

**Deliverables**:
1. Analytics endpoints:
   - GET /api/assets/analytics/utilization
   - GET /api/assets/analytics/roi
   - GET /api/assets/analytics/idle-assets
   - GET /api/assets/analytics/cost-per-mile
2. Database views for performance:
   - vw_asset_daily_utilization
   - vw_asset_roi_summary
3. Cron job for daily metrics calculation
4. CSV/PDF export functionality
5. Real-time metric updates via WebSocket

**Technical Stack**:
- PostgreSQL window functions
- Materialized views for performance
- PDFKit for reports
- Fast-CSV for exports
- Recharts-compatible data format

---

## Implementation Files Structure

```
fleet-local/
├── api/
│   ├── src/
│   │   ├── websocket/
│   │   │   ├── task-realtime.server.ts         [Agent 1]
│   │   │   ├── presence.service.ts             [Agent 1]
│   │   │   └── conflict-resolution.service.ts  [Agent 1]
│   │   ├── routes/
│   │   │   ├── assets-mobile.routes.ts         [Agent 2]
│   │   │   └── asset-analytics.routes.ts       [Agent 3]
│   │   ├── services/
│   │   │   ├── qr-generator.service.ts         [Agent 2]
│   │   │   ├── photo-storage.service.ts        [Agent 2]
│   │   │   ├── utilization-calc.service.ts     [Agent 3]
│   │   │   └── roi-calculator.service.ts       [Agent 3]
│   │   └── workers/
│   │       └── daily-metrics.worker.ts         [Agent 3]
│   └── migrations/
│       ├── 020_websocket_events.sql            [Agent 1]
│       ├── 021_asset_checkout_history.sql      [Agent 2]
│       └── 022_asset_utilization_views.sql     [Agent 3]
└── src/
    ├── components/
    │   ├── realtime/
    │   │   ├── TaskRealtimeProvider.tsx        [Agent 1]
    │   │   └── PresenceIndicator.tsx           [Agent 1]
    │   ├── mobile/
    │   │   ├── QRScanner.tsx                   [Agent 2]
    │   │   ├── PhotoCapture.tsx                [Agent 2]
    │   │   └── AssetCheckInOut.tsx             [Agent 2]
    │   └── analytics/
    │       ├── UtilizationDashboard.tsx        [Agent 3]
    │       └── ROIChart.tsx                    [Agent 3]
    └── hooks/
        ├── useRealtimeTasks.ts                 [Agent 1]
        ├── useQRScanner.ts                     [Agent 2]
        └── useAssetAnalytics.ts                [Agent 3]
```

---

## Database Schema Changes

### Migration 020: WebSocket Events
```sql
CREATE TABLE websocket_events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  event_type VARCHAR(50) NOT NULL, -- TASK_CREATED, TASK_UPDATED, etc.
  resource_type VARCHAR(50) NOT NULL, -- task, asset, etc.
  resource_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_websocket_events_tenant ON websocket_events(tenant_id, created_at DESC);
CREATE INDEX idx_websocket_events_resource ON websocket_events(resource_type, resource_id);

CREATE TABLE task_presence (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  last_seen TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
```

### Migration 021: Asset Checkout History
```sql
CREATE TABLE asset_checkout_history (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL, -- checkout, checkin
  checkout_time TIMESTAMP,
  checkin_time TIMESTAMP,
  checkout_location GEOGRAPHY(POINT),
  checkin_location GEOGRAPHY(POINT),
  checkout_photo_url TEXT,
  checkin_photo_url TEXT,
  condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
  condition_notes TEXT,
  signature_data TEXT, -- base64 signature
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkout_history_asset ON asset_checkout_history(asset_id, checkout_time DESC);
CREATE INDEX idx_checkout_history_user ON asset_checkout_history(user_id);
```

### Migration 022: Asset Utilization Views
```sql
CREATE MATERIALIZED VIEW vw_asset_daily_utilization AS
SELECT
  a.id as asset_id,
  a.asset_name,
  a.asset_type,
  DATE(t.start_time) as date,
  COUNT(DISTINCT t.id) as trips_count,
  SUM(t.duration_minutes) as total_active_minutes,
  (SUM(t.duration_minutes) / 1440.0 * 100) as utilization_percentage,
  SUM(t.distance_miles) as total_miles,
  SUM(t.fuel_consumed_gallons) as total_fuel_gallons
FROM assets a
LEFT JOIN trips t ON a.id = t.asset_id
WHERE t.start_time >= NOW() - INTERVAL '90 days'
GROUP BY a.id, a.asset_name, a.asset_type, DATE(t.start_time);

CREATE INDEX idx_utilization_asset_date ON vw_asset_daily_utilization(asset_id, date DESC);

CREATE MATERIALIZED VIEW vw_asset_roi_summary AS
SELECT
  a.id as asset_id,
  a.asset_name,
  a.purchase_price::DECIMAL as initial_investment,
  a.current_value::DECIMAL as current_value,
  COALESCE(SUM(m.total_cost), 0) as total_maintenance_cost,
  COALESCE(SUM(t.fuel_consumed_gallons * 3.50), 0) as total_fuel_cost,
  DATE_PART('day', NOW() - a.purchase_date) as days_owned,
  (a.purchase_price::DECIMAL - a.current_value::DECIMAL + COALESCE(SUM(m.total_cost), 0)) / NULLIF(DATE_PART('day', NOW() - a.purchase_date), 0) as daily_cost,
  COALESCE(SUM(t.distance_miles), 0) as total_miles,
  (a.purchase_price::DECIMAL + COALESCE(SUM(m.total_cost), 0) + COALESCE(SUM(t.fuel_consumed_gallons * 3.50), 0)) / NULLIF(SUM(t.distance_miles), 0) as cost_per_mile
FROM assets a
LEFT JOIN maintenance_records m ON a.id = m.asset_id
LEFT JOIN trips t ON a.id = t.asset_id
GROUP BY a.id, a.asset_name, a.purchase_price, a.current_value, a.purchase_date;

-- Refresh views daily
CREATE OR REPLACE FUNCTION refresh_asset_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vw_asset_daily_utilization;
  REFRESH MATERIALIZED VIEW CONCURRENTLY vw_asset_roi_summary;
END;
$$ LANGUAGE plpgsql;
```

---

## Azure VM Deployment Commands

### Step 1: Deploy All Three Agents in Parallel
```bash
# SSH to Azure VM
ssh azureuser@172.191.51.49

# Navigate to project
cd /home/azureuser/fleet-local

# Pull latest code
git pull origin main

# Set environment variables
export OPENAI_API_KEY="sk-proj-..."
export AZURE_STORAGE_ACCOUNT="fleetassetstorage"
export AZURE_STORAGE_KEY="..."

# Deploy agents in parallel (3 concurrent workers)
nohup npx tsx azure-agents/agents/realtime-task-builder.ts > /tmp/agent1-realtime.log 2>&1 &
nohup npx tsx azure-agents/agents/mobile-asset-qr-builder.ts > /tmp/agent2-mobile.log 2>&1 &
nohup npx tsx azure-agents/agents/asset-analytics-builder.ts > /tmp/agent3-analytics.log 2>&1 &

# Monitor progress
tail -f /tmp/agent1-realtime.log
tail -f /tmp/agent2-mobile.log
tail -f /tmp/agent3-analytics.log
```

### Step 2: Run Database Migrations
```bash
# After agents complete code generation
cd api
npm run migrate
```

### Step 3: Test Endpoints
```bash
# Test WebSocket connection
wscat -c ws://localhost:3000/tasks/realtime

# Test QR code generation
curl -X GET http://localhost:3000/api/assets/123/qr-code

# Test asset checkout
curl -X POST http://localhost:3000/api/assets/123/checkout \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "photo=@test-photo.jpg" \
  -F "location={\"lat\":28.5383,\"lng\":-81.3792}"

# Test utilization analytics
curl -X GET http://localhost:3000/api/assets/analytics/utilization?date_from=2025-01-01
```

---

## Agent Implementation Details

### Agent 1: Real-Time Task Builder

**AI Prompt Template**:
```
You are building an enterprise-grade real-time task management system using WebSocket.

REQUIREMENTS:
1. Socket.IO 4.x server with JWT authentication
2. Redis pub/sub for horizontal scaling
3. Event types: TASK_CREATED, TASK_UPDATED, TASK_ASSIGNED, TASK_DELETED, COMMENT_ADDED
4. Presence tracking: Store who's viewing each task, emit JOIN/LEAVE events
5. Conflict resolution: Last-write-wins with version vectors
6. Multi-tenant isolation: Users only see events for their tenant
7. Reconnection logic with exponential backoff
8. Rate limiting: 100 events/minute per connection

SECURITY:
- Validate JWT on connection
- Verify user has permission to subscribe to resource
- Sanitize all emitted data (no sensitive fields)
- Log all connection events for audit

PERFORMANCE:
- Use Redis keyspace notifications for scalability
- Batch events (max 50ms delay) to reduce network traffic
- Compress large payloads with zlib

Generate COMPLETE, PRODUCTION-READY code for:
1. websocket/task-realtime.server.ts
2. websocket/presence.service.ts
3. websocket/conflict-resolution.service.ts
4. migrations/020_websocket_events.sql
5. React hook: hooks/useRealtimeTasks.ts
```

**Expected Output**:
- 5 complete files
- Full TypeScript types
- Unit tests (Vitest)
- Integration test (WebSocket client)

---

### Agent 2: Mobile Asset QR Builder

**AI Prompt Template**:
```
You are building a mobile-first asset management system with QR code scanning and photo documentation.

REQUIREMENTS:
1. QR code generation: SVG format, embed asset ID + tenant ID
2. Photo upload: Azure Blob Storage, compress to WebP, max 2MB
3. Checkout workflow:
   - Scan QR → Show asset details
   - Capture photo → Compress and upload
   - Record GPS location → Validate coordinates
   - Digital signature → Base64 encode
   - Submit → Create checkout record
4. Checkin workflow:
   - Scan QR → Show current checkout
   - Capture photo → Compare to checkout photo (AI damage detection optional)
   - Condition rating → 1-5 stars
   - Submit → Update checkout record, set checkin_time
5. Offline mode:
   - Queue requests in IndexedDB
   - Retry on reconnection
   - Show pending sync indicator

SECURITY:
- Verify user has permission to checkout asset
- Validate GPS coordinates (within reasonable bounds)
- Scan photos for malware (ClamAV integration optional)
- Rate limit: 10 checkouts/minute per user

PERFORMANCE:
- Stream photo uploads (don't load full file in memory)
- Generate thumbnails (150x150) for list views
- Cache QR codes (1 hour TTL)

Generate COMPLETE, PRODUCTION-READY code for:
1. routes/assets-mobile.routes.ts
2. services/qr-generator.service.ts
3. services/photo-storage.service.ts
4. migrations/021_asset_checkout_history.sql
5. React component: components/mobile/AssetCheckInOut.tsx
```

**Expected Output**:
- 5 complete files
- Photo upload pipeline
- QR code generation
- Mobile-optimized UI

---

### Agent 3: Asset Analytics Builder

**AI Prompt Template**:
```
You are building advanced asset analytics with utilization tracking and ROI calculation.

REQUIREMENTS:
1. Utilization Metrics:
   - Daily utilization percentage (active hours / 24 * 100)
   - Idle time alerts (>7 days idle)
   - Compare to industry benchmarks
   - Heatmap visualization data (hourly usage patterns)

2. ROI Calculation:
   - Total Cost of Ownership = Purchase Price + Maintenance + Fuel + Insurance
   - Revenue Generated (if billable asset)
   - Payback Period = Initial Investment / (Annual Revenue - Annual Costs)
   - Cost per Mile = Total Costs / Total Miles
   - Depreciation tracking

3. Reporting:
   - CSV export (daily/weekly/monthly)
   - PDF report generation (charts + tables)
   - Email scheduled reports (cron)
   - Real-time dashboard via WebSocket

4. Performance:
   - Materialized views refreshed daily
   - Indexed queries (<100ms p95)
   - Aggregate 90 days of data in <500ms

SECURITY:
- RBAC: Only managers can view cost data
- Multi-tenant isolation
- Audit log all report generations

PERFORMANCE:
- Use window functions for moving averages
- Partition tables by month
- Cache dashboard data (5min TTL)

Generate COMPLETE, PRODUCTION-READY code for:
1. routes/asset-analytics.routes.ts
2. services/utilization-calc.service.ts
3. services/roi-calculator.service.ts
4. workers/daily-metrics.worker.ts
5. migrations/022_asset_utilization_views.sql
6. React component: components/analytics/UtilizationDashboard.tsx
```

**Expected Output**:
- 6 complete files
- Analytics calculations
- Report generation
- Dashboard visualizations

---

## Testing Plan

### Unit Tests (Vitest)
```bash
# Test WebSocket server
npm test websocket/task-realtime.server.test.ts

# Test QR generation
npm test services/qr-generator.service.test.ts

# Test ROI calculation
npm test services/roi-calculator.service.test.ts
```

### Integration Tests (Playwright)
```bash
# Test real-time task updates
npx playwright test realtime-tasks.spec.ts

# Test mobile asset checkout
npx playwright test mobile-checkout.spec.ts

# Test analytics dashboard
npx playwright test asset-analytics.spec.ts
```

### Load Tests (k6)
```bash
# Test WebSocket server capacity
k6 run tests/load/websocket-connections.js

# Test photo upload throughput
k6 run tests/load/photo-uploads.js
```

---

## Success Criteria

### Agent 1: Real-Time Tasks ✅
- [ ] WebSocket server handles 1,000 concurrent connections
- [ ] Events delivered <100ms latency
- [ ] Presence tracking shows accurate user count
- [ ] Reconnection works after network failure
- [ ] Multi-tenant isolation verified

### Agent 2: Mobile Asset QR ✅
- [ ] QR code generates in <50ms
- [ ] Photo upload completes in <3 seconds
- [ ] Offline mode queues requests
- [ ] GPS validation rejects invalid coordinates
- [ ] Digital signature captures correctly

### Agent 3: Asset Analytics ✅
- [ ] Dashboard loads in <2 seconds
- [ ] Utilization calculation accurate (verified manually)
- [ ] ROI formula matches financial team's spreadsheet
- [ ] PDF export generates in <5 seconds
- [ ] Daily metrics cron job completes in <1 minute

---

## Rollout Plan

### Week 1: Agent Development
- Day 1-2: Create and test agents on Azure VM
- Day 3-4: Code generation and initial testing
- Day 5: Integration and bug fixes

### Week 2: Database & Backend
- Day 1: Run migrations in dev environment
- Day 2-3: Backend API testing
- Day 4-5: Performance optimization

### Week 3: Frontend Development
- Day 1-2: Real-time task UI
- Day 3: Mobile asset checkout UI
- Day 4-5: Analytics dashboard

### Week 4: Testing & Deployment
- Day 1-2: Integration testing
- Day 3: Beta deployment to 3 customers
- Day 4: Gather feedback, fix bugs
- Day 5: Production deployment

---

**Next Steps**:
1. Create the 3 agent files (realtime-task-builder.ts, mobile-asset-qr-builder.ts, asset-analytics-builder.ts)
2. Deploy to Azure VM
3. Monitor logs and verify completion
4. Run tests and validate output
5. Deploy to production

---

**Generated**: 2025-11-27
🤖 Generated with [Claude Code](https://claude.com/claude-code)
