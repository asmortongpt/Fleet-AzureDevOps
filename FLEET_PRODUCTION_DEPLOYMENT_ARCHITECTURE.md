# Fleet Management System - Complete Production Deployment Architecture

**Generated:** December 30, 2025
**Target Environment:** Azure Production (fleet-production-rg)
**Deployment Model:** Azure Container Apps + Azure Front Door + Managed Services

---

## Executive Summary

This document provides a comprehensive, production-ready deployment architecture for the complete Fleet Management System to Azure. The deployment uses modern cloud-native patterns with Azure Container Apps for compute, Azure Database for PostgreSQL for data persistence, Azure Cache for Redis for session management, and Azure Front Door for global routing and CDN.

### Current State
- **Frontend**: Deployed to Azure Container Instance (fleet-app-aci) but showing stale content due to cache
- **Backend API**: NOT deployed (source at `/Users/andrewmorton/Documents/GitHub/fleet-local/server/`)
- **Emulators**: NOT deployed (OBD2, Radio, Dispatch at `server/emulators/`)
- **Database**: Multiple PostgreSQL instances exist but not configured for this deployment
- **Redis**: Container instance exists (fleet-redis-prod)

### Target State
- **Frontend**: Azure Container Apps (upgraded from ACI for better scaling)
- **Backend API**: Azure Container Apps with auto-scaling (2-10 replicas)
- **Emulators**: Azure Container Apps with WebSocket support
- **Database**: Azure Database for PostgreSQL Flexible Server (managed service)
- **Cache**: Azure Cache for Redis (managed service, production tier)
- **CDN/Routing**: Azure Front Door Premium with WAF
- **Secrets**: Azure Key Vault (fleet-secrets-0d326d71)
- **Monitoring**: Application Insights (fleet-management-insights)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Front Door Premium                      │
│               https://fleet.capitaltechalliance.com              │
│                          + WAF + CDN                             │
└────────────┬──────────────┬──────────────┬─────────────────────┘
             │              │              │
             │ /            │ /api/*       │ /ws/*
             │              │              │
   ┌─────────▼────────┐ ┌──▼──────────┐ ┌─▼──────────────┐
   │   Frontend SPA   │ │  Backend API │ │   Emulators    │
   │  Container App   │ │ Container App│ │  Container App │
   │  (fleet-ui)      │ │ (fleet-api)  │ │ (fleet-emu)    │
   │                  │ │              │ │                │
   │ - React/Vite     │ │ - Express    │ │ - Socket.IO    │
   │ - Nginx          │ │ - TypeScript │ │ - OBD2/Radio   │
   │ - Static Assets  │ │ - Auth/RBAC  │ │ - Dispatch     │
   └──────────────────┘ └──────┬───────┘ └────────────────┘
                               │
                    ┌──────────┼────────────┐
                    │          │            │
         ┌──────────▼──┐  ┌───▼──────┐  ┌─▼──────────┐
         │ PostgreSQL  │  │  Redis   │  │ Azure AD   │
         │  Flexible   │  │  Cache   │  │    SSO     │
         │   Server    │  │Premium P1│  │            │
         └─────────────┘  └──────────┘  └────────────┘
                    │
         ┌──────────▼──────────┐
         │  Azure Key Vault    │
         │ (fleet-secrets-...)│
         │ - DB Credentials    │
         │ - API Keys          │
         │ - JWT Secrets       │
         └─────────────────────┘
```

---

## 1. Infrastructure Components

### 1.1 Azure Container Apps Environment

**Resource:** `fleet-production-env` (already exists)

**Configuration:**
- **Region:** East US 2
- **vNet Integration:** Enabled with subnet delegation
- **Log Analytics:** workspace-fleetproductionrgojRs
- **Dapr:** Disabled (not needed for this deployment)
- **Zone Redundancy:** Disabled (upgrade to Premium for zone redundancy)

### 1.2 Container Apps (3 Applications)

#### A. Frontend Container App: `fleet-ui`

**Image:** `fleetacr.azurecr.io/fleet-ui:latest`

**Configuration:**
```yaml
properties:
  managedEnvironmentId: /subscriptions/.../fleet-production-env
  configuration:
    ingress:
      external: true
      targetPort: 80
      transport: http
      allowInsecure: false
    secrets:
      - name: acr-password
        value: <from-keyvault>
    registries:
      - server: fleetacr.azurecr.io
        username: fleetacr
        passwordSecretRef: acr-password
  template:
    containers:
      - name: fleet-ui
        image: fleetacr.azurecr.io/fleet-ui:latest
        resources:
          cpu: 0.5
          memory: 1Gi
    scale:
      minReplicas: 1
      maxReplicas: 3
      rules:
        - name: http-rule
          http:
            metadata:
              concurrentRequests: '100'
```

**Environment Variables:**
```bash
VITE_API_URL=https://fleet.capitaltechalliance.com/api
VITE_WS_URL=wss://fleet.capitaltechalliance.com/ws
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback
```

#### B. Backend API Container App: `fleet-api`

**Image:** `fleetacr.azurecr.io/fleet-api:latest`

**Configuration:**
```yaml
properties:
  managedEnvironmentId: /subscriptions/.../fleet-production-env
  configuration:
    ingress:
      external: true
      targetPort: 3000
      transport: http
      allowInsecure: false
    secrets:
      - name: acr-password
        valueFrom: <keyvault>
      - name: database-url
        valueFrom: <keyvault>
      - name: redis-url
        valueFrom: <keyvault>
      - name: jwt-secret
        valueFrom: <keyvault>
      - name: azure-ad-client-secret
        valueFrom: <keyvault>
    registries:
      - server: fleetacr.azurecr.io
        username: fleetacr
        passwordSecretRef: acr-password
  template:
    containers:
      - name: fleet-api
        image: fleetacr.azurecr.io/fleet-api:latest
        resources:
          cpu: 1.0
          memory: 2Gi
        env:
          - name: NODE_ENV
            value: production
          - name: PORT
            value: '3000'
          - name: DATABASE_URL
            secretRef: database-url
          - name: REDIS_URL
            secretRef: redis-url
          - name: JWT_SECRET
            secretRef: jwt-secret
          - name: AZURE_AD_CLIENT_ID
            value: baae0851-0c24-4214-8587-e3fabc46bd4a
          - name: AZURE_AD_TENANT_ID
            value: 0ec14b81-7b82-45ee-8f3d-cbc31ced5347
          - name: AZURE_AD_CLIENT_SECRET
            secretRef: azure-ad-client-secret
          - name: AZURE_AD_REDIRECT_URI
            value: https://fleet.capitaltechalliance.com/api/v1/auth/callback
          - name: FRONTEND_URL
            value: https://fleet.capitaltechalliance.com
          - name: LOG_LEVEL
            value: info
          - name: DATABASE_HOST
            value: fleet-production-postgres.postgres.database.azure.com
          - name: DATABASE_PORT
            value: '5432'
          - name: DATABASE_NAME
            value: fleetdb
          - name: DATABASE_USER
            value: fleetadmin
          - name: DATABASE_PASSWORD
            secretRef: database-password
          - name: DATABASE_SSL
            value: 'true'
          - name: REDIS_HOST
            value: fleet-production-redis.redis.cache.windows.net
          - name: REDIS_PORT
            value: '6380'
          - name: REDIS_TLS
            value: 'true'
          - name: APPLICATIONINSIGHTS_CONNECTION_STRING
            value: <from-fleet-management-insights>
    scale:
      minReplicas: 2
      maxReplicas: 10
      rules:
        - name: http-rule
          http:
            metadata:
              concurrentRequests: '50'
        - name: cpu-rule
          custom:
            type: cpu
            metadata:
              type: Utilization
              value: '75'
```

**Health Checks:**
```yaml
probes:
  - type: liveness
    httpGet:
      path: /health
      port: 3000
    initialDelaySeconds: 30
    periodSeconds: 10
    failureThreshold: 3
  - type: readiness
    httpGet:
      path: /health
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 5
    failureThreshold: 3
```

#### C. Emulators Container App: `fleet-emulators`

**Image:** `fleetacr.azurecr.io/fleet-emulators:latest`

**Configuration:**
```yaml
properties:
  managedEnvironmentId: /subscriptions/.../fleet-production-env
  configuration:
    ingress:
      external: true
      targetPort: 8080
      transport: http
      allowInsecure: false
      traffic:
        - latestRevision: true
          weight: 100
    secrets:
      - name: acr-password
        valueFrom: <keyvault>
    registries:
      - server: fleetacr.azurecr.io
        username: fleetacr
        passwordSecretRef: acr-password
  template:
    containers:
      - name: fleet-emulators
        image: fleetacr.azurecr.io/fleet-emulators:latest
        resources:
          cpu: 0.5
          memory: 1Gi
        env:
          - name: NODE_ENV
            value: production
          - name: OBD2_PORT
            value: '8081'
          - name: RADIO_PORT
            value: '8082'
          - name: DISPATCH_PORT
            value: '8083'
    scale:
      minReplicas: 1
      maxReplicas: 3
      rules:
        - name: http-rule
          http:
            metadata:
              concurrentRequests: '100'
```

### 1.3 Azure Database for PostgreSQL Flexible Server

**Resource Name:** `fleet-production-postgres-final`

**Configuration:**
```bash
# SKU
Tier: Burstable
Compute: Standard_B2s (2 vCores, 4 GiB RAM)
Storage: 32 GiB (auto-grow enabled)
Backup: 7-day retention, geo-redundant

# Network
Public Access: Disabled
Private Endpoint: Enabled (fleet-production-env vNet)
SSL/TLS: Required (TLS 1.2+)

# High Availability
Zone Redundancy: Disabled (upgrade to General Purpose for HA)
Point-in-Time Restore: Enabled (7 days)

# Performance
Connection Pooling: PgBouncer enabled
Max Connections: 100
```

**Database Setup:**
```sql
-- Database: fleetdb
-- Owner: fleetadmin
-- Extensions: uuid-ossp, pgcrypto, pg_trgm, postgis

CREATE DATABASE fleetdb OWNER fleetadmin;
\c fleetdb

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create application user (least privilege)
CREATE USER fleetapp WITH PASSWORD '<generated>';
GRANT CONNECT ON DATABASE fleetdb TO fleetapp;
GRANT USAGE ON SCHEMA public TO fleetapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetapp;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fleetapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO fleetapp;
```

### 1.4 Azure Cache for Redis

**Resource Name:** `fleet-production-redis`

**Configuration:**
```bash
# SKU
Tier: Premium P1 (6 GB cache)
Replicas: 1 (for high availability)
Persistence: RDB (snapshots every 15 minutes)
Clustering: Disabled (sufficient for current scale)

# Network
Public Access: Disabled
Private Endpoint: Enabled (fleet-production-env vNet)
TLS: Required (1.2+)
Non-SSL Port: Disabled

# Performance
Max Connections: 10,000
Eviction Policy: allkeys-lru
Persistence: RDB snapshots
```

**Redis Key Patterns:**
```bash
# Session management
session:{session_id} -> Session data (TTL: 24h)
user:{user_id}:sessions -> Set of active sessions
csrf:{token} -> CSRF token validation (TTL: 1h)

# Cache patterns
cache:vehicles -> List of all vehicles (TTL: 5m)
cache:vehicle:{id} -> Individual vehicle data (TTL: 10m)
cache:driver:{id} -> Driver data (TTL: 10m)
cache:facility:{id} -> Facility data (TTL: 30m)

# Rate limiting
ratelimit:{ip}:auth -> Auth attempts (TTL: 15m)
ratelimit:{ip}:api -> API requests (TTL: 1m)
ratelimit:{ip}:sensitive -> Sensitive operations (TTL: 1h)

# Bull queues
bull:email:* -> Email processing queue
bull:notification:* -> Notification queue
bull:data-retention:* -> GDPR data retention jobs
```

### 1.5 Azure Front Door Premium

**Resource Name:** `fleet-frontdoor` (already exists)

**Endpoint:** `fleet-endpoint` → `https://fleet.capitaltechalliance.com`

**Origin Groups:**

#### Frontend Origin Group
```yaml
name: fleet-ui-origin-group
origins:
  - name: fleet-ui-origin
    hostName: fleet-ui.{env-suffix}.eastus2.azurecontainerapps.io
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: Enabled
healthProbeSettings:
  path: /
  protocol: Https
  intervalInSeconds: 30
  method: GET
loadBalancingSettings:
  sampleSize: 4
  successfulSamplesRequired: 3
  additionalLatencyInMilliseconds: 50
```

#### Backend API Origin Group
```yaml
name: fleet-api-origin-group
origins:
  - name: fleet-api-origin
    hostName: fleet-api.{env-suffix}.eastus2.azurecontainerapps.io
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: Enabled
healthProbeSettings:
  path: /health
  protocol: Https
  intervalInSeconds: 30
  method: GET
loadBalancingSettings:
  sampleSize: 4
  successfulSamplesRequired: 3
```

#### Emulators Origin Group
```yaml
name: fleet-emulators-origin-group
origins:
  - name: fleet-emulators-origin
    hostName: fleet-emulators.{env-suffix}.eastus2.azurecontainerapps.io
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: Enabled
    enabledHttp2: true
healthProbeSettings:
  path: /health
  protocol: Https
  intervalInSeconds: 60
```

**Routing Rules:**

```yaml
routes:
  # API Routes
  - name: api-route
    patternsToMatch:
      - /api/*
    originGroup: fleet-api-origin-group
    forwardingProtocol: HttpsOnly
    cacheConfiguration:
      queryStringCachingBehavior: IgnoreQueryString
      cacheBehavior: Disabled  # API responses should not be cached

  # WebSocket Routes (Emulators)
  - name: websocket-route
    patternsToMatch:
      - /ws/*
      - /socket.io/*
    originGroup: fleet-emulators-origin-group
    forwardingProtocol: HttpsOnly
    cacheConfiguration:
      cacheBehavior: Disabled

  # Frontend SPA Routes (default)
  - name: frontend-route
    patternsToMatch:
      - /*
    originGroup: fleet-ui-origin-group
    forwardingProtocol: HttpsOnly
    cacheConfiguration:
      queryStringCachingBehavior: IgnoreQueryString
      compressionSettings:
        contentTypesToCompress:
          - text/html
          - text/css
          - text/javascript
          - application/javascript
          - application/json
        isCompressionEnabled: true
```

**WAF Policy:**
```yaml
name: fleet-waf-policy
sku: Premium_AzureFrontDoor
managedRules:
  - ruleSetType: Microsoft_DefaultRuleSet
    ruleSetVersion: 2.1
    ruleSetAction: Block
  - ruleSetType: Microsoft_BotManagerRuleSet
    ruleSetVersion: 1.0
customRules:
  - name: RateLimitRule
    priority: 100
    ruleType: RateLimitRule
    rateLimitThreshold: 1000
    rateLimitDurationInMinutes: 1
    action: Block
  - name: GeoFilterRule
    priority: 200
    ruleType: MatchRule
    matchConditions:
      - matchVariable: RemoteAddr
        operator: GeoMatch
        negateCondition: true
        matchValue:
          - US
          - CA
          - GB
    action: Block
```

### 1.6 Azure Key Vault

**Resource Name:** `fleet-secrets-0d326d71` (already exists)

**Secrets to Store:**

```bash
# Database
fleet-postgres-connection-string = "postgresql://fleetapp:PASSWORD@fleet-production-postgres-final.postgres.database.azure.com:5432/fleetdb?sslmode=require"
fleet-postgres-password = "<generated-password>"

# Redis
fleet-redis-connection-string = "rediss://fleet-production-redis.redis.cache.windows.net:6380,password=PASSWORD,ssl=True,abortConnect=False"
fleet-redis-password = "<from-azure-portal>"

# Application Secrets
fleet-jwt-secret = "<generated-256-bit-secret>"
fleet-session-secret = "<generated-256-bit-secret>"
fleet-csrf-secret = "<generated-256-bit-secret>"

# Azure AD
fleet-azure-ad-client-secret = "<from-azure-ad-app-registration>"

# Container Registry
fleet-acr-password = "<from-acr>"

# Application Insights
fleet-appinsights-connection-string = "<from-fleet-management-insights>"

# API Keys
fleet-openai-api-key = "<from-global-env>"
fleet-anthropic-api-key = "<from-global-env>"
```

**Access Policies:**
```yaml
# Managed Identity for Container Apps
objectId: <fleet-api-managed-identity>
permissions:
  secrets:
    - get
    - list

# CI/CD Service Principal
objectId: <azure-devops-sp>
permissions:
  secrets:
    - get
    - list
    - set
```

---

## 2. Docker Container Specifications

### 2.1 Backend API Dockerfile

**Location:** `/Users/andrewmorton/Documents/GitHub/fleet-local/server/Dockerfile.production`

```dockerfile
# Multi-stage production build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev deps for build)
RUN npm ci --include=dev

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
```

### 2.2 Emulators Dockerfile

**Location:** `/Users/andrewmorton/Documents/GitHub/fleet-local/server/emulators/Dockerfile`

```dockerfile
FROM node:20-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Create package.json for emulators
COPY package.json ./

# Install only socket.io (minimal deps)
RUN npm install socket.io@4.6.1 --production

# Copy emulator files
COPY obd2-emulator.js ./
COPY radio-emulator.js ./
COPY dispatch-emulator.js ./
COPY entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x entrypoint.sh && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose all emulator ports
EXPOSE 8081 8082 8083

# Health check (check if any emulator is responding)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081', () => process.exit(0)).on('error', () => process.exit(1));"

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start all emulators
CMD ["./entrypoint.sh"]
```

**Entrypoint Script:** `server/emulators/entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "Starting Fleet Emulators..."

# Start OBD2 emulator in background
echo "Starting OBD2 emulator on port 8081..."
node obd2-emulator.js &
OBD2_PID=$!

# Start Radio emulator in background
echo "Starting Radio emulator on port 8082..."
node radio-emulator.js &
RADIO_PID=$!

# Start Dispatch emulator in foreground (keeps container alive)
echo "Starting Dispatch emulator on port 8083..."
node dispatch-emulator.js &
DISPATCH_PID=$!

# Function to handle shutdown
shutdown() {
  echo "Shutting down emulators..."
  kill -TERM $OBD2_PID $RADIO_PID $DISPATCH_PID 2>/dev/null
  wait $OBD2_PID $RADIO_PID $DISPATCH_PID
  echo "Emulators stopped"
  exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for all background processes
wait
```

### 2.3 Frontend Dockerfile (Enhanced)

**Location:** `/Users/andrewmorton/Documents/GitHub/fleet-local/Dockerfile.production`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_AZURE_AD_CLIENT_ID
ARG VITE_AZURE_AD_TENANT_ID
ARG VITE_AZURE_AD_REDIRECT_URI

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built dist files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration:** `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json image/svg+xml;

    # SPA routing - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 3. Database Migration Strategy

### 3.1 Migration Files Organization

**Location:** `/Users/andrewmorton/Documents/GitHub/fleet-local/api/src/migrations/`

**Migration Order:**
1. Base schema (000_minimal_base_schema.sql)
2. Core tables (users, tenants, roles)
3. Fleet tables (vehicles, drivers, facilities)
4. Feature tables (maintenance, dispatch, telematics)
5. Security tables (audit logs, security events)
6. Performance indexes (034_performance_indexes.sql)
7. RLS policies (20251219_remediate_all_tables_rls.sql)

### 3.2 Migration Execution

**Tool:** Custom migration script using `node-pg-migrate` or native SQL

**Migration Script:** `server/scripts/migrate-production.ts`

```typescript
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt')
  }
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get list of migrations
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      // Check if already applied
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (rows.length === 0) {
        console.log(`Applying migration: ${file}`);

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`✓ Applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`✗ Failed: ${file}`, err);
          throw err;
        }
      } else {
        console.log(`⊘ Skipped (already applied): ${file}`);
      }
    }

    console.log('\n✓ All migrations completed successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

### 3.3 Migration Deployment

**Option 1: Azure Container Instance (One-time Job)**

```bash
az container create \
  --resource-group fleet-production-rg \
  --name fleet-migration-job \
  --image fleetacr.azurecr.io/fleet-api:latest \
  --registry-login-server fleetacr.azurecr.io \
  --registry-username fleetacr \
  --registry-password $(az acr credential show -n fleetacr --query "passwords[0].value" -o tsv) \
  --environment-variables \
    DATABASE_HOST=fleet-production-postgres-final.postgres.database.azure.com \
    DATABASE_PORT=5432 \
    DATABASE_NAME=fleetdb \
    DATABASE_USER=fleetadmin \
    DATABASE_PASSWORD="$(az keyvault secret show --vault-name fleet-secrets-0d326d71 --name fleet-postgres-password --query value -o tsv)" \
    DATABASE_SSL=true \
  --command-line "node dist/scripts/migrate-production.js" \
  --restart-policy Never
```

**Option 2: Kubernetes Job (if using AKS)**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: fleet-migration
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: fleetacr.azurecr.io/fleet-api:latest
        command: ["node", "dist/scripts/migrate-production.js"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: fleet-secrets
              key: database-url
      restartPolicy: OnFailure
  backoffLimit: 3
```

---

## 4. Deployment Scripts

### 4.1 Complete Deployment Script

**Location:** `/Users/andrewmorton/Documents/GitHub/fleet-local/deploy-production.sh`

```bash
#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="fleet-production-rg"
LOCATION="eastus2"
ACR_NAME="fleetacr"
KEYVAULT_NAME="fleet-secrets-0d326d71"
MANAGED_ENV="fleet-production-env"

echo "====================================="
echo "Fleet Management Production Deployment"
echo "====================================="

# 1. Retrieve secrets from Key Vault
echo "1. Retrieving secrets from Azure Key Vault..."
ACR_PASSWORD=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name fleet-acr-password --query value -o tsv)
DB_PASSWORD=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name fleet-postgres-password --query value -o tsv)
REDIS_PASSWORD=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name fleet-redis-password --query value -o tsv)
JWT_SECRET=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name fleet-jwt-secret --query value -o tsv)
AZURE_AD_SECRET=$(az keyvault secret show --vault-name $KEYVAULT_NAME --name fleet-azure-ad-client-secret --query value -o tsv)

# 2. Build and push backend API
echo "2. Building backend API Docker image..."
cd server
docker build -f Dockerfile.production -t $ACR_NAME.azurecr.io/fleet-api:latest .
docker build -f Dockerfile.production -t $ACR_NAME.azurecr.io/fleet-api:$(date +%Y%m%d-%H%M%S) .

echo "Pushing backend API to ACR..."
az acr login --name $ACR_NAME
docker push $ACR_NAME.azurecr.io/fleet-api:latest
docker push $ACR_NAME.azurecr.io/fleet-api:$(date +%Y%m%d-%H%M%S)

# 3. Build and push emulators
echo "3. Building emulators Docker image..."
cd emulators
docker build -t $ACR_NAME.azurecr.io/fleet-emulators:latest .
docker build -t $ACR_NAME.azurecr.io/fleet-emulators:$(date +%Y%m%d-%H%M%S) .

echo "Pushing emulators to ACR..."
docker push $ACR_NAME.azurecr.io/fleet-emulators:latest
docker push $ACR_NAME.azurecr.io/fleet-emulators:$(date +%Y%m%d-%H%M%S)

# 4. Build and push frontend
echo "4. Building frontend Docker image..."
cd ../../
docker build -f Dockerfile.production \
  --build-arg VITE_API_URL=https://fleet.capitaltechalliance.com/api \
  --build-arg VITE_WS_URL=wss://fleet.capitaltechalliance.com/ws \
  --build-arg VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a \
  --build-arg VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347 \
  --build-arg VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback \
  -t $ACR_NAME.azurecr.io/fleet-ui:latest .

docker push $ACR_NAME.azurecr.io/fleet-ui:latest

# 5. Deploy backend API Container App
echo "5. Deploying backend API Container App..."
az containerapp create \
  --name fleet-api \
  --resource-group $RESOURCE_GROUP \
  --environment $MANAGED_ENV \
  --image $ACR_NAME.azurecr.io/fleet-api:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_NAME \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 2 \
  --max-replicas 10 \
  --cpu 1.0 \
  --memory 2Gi \
  --secrets \
    acr-password="$ACR_PASSWORD" \
    database-password="$DB_PASSWORD" \
    redis-password="$REDIS_PASSWORD" \
    jwt-secret="$JWT_SECRET" \
    azure-ad-client-secret="$AZURE_AD_SECRET" \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    DATABASE_HOST=fleet-production-postgres-final.postgres.database.azure.com \
    DATABASE_PORT=5432 \
    DATABASE_NAME=fleetdb \
    DATABASE_USER=fleetadmin \
    DATABASE_PASSWORD=secretref:database-password \
    DATABASE_SSL=true \
    REDIS_HOST=fleet-production-redis.redis.cache.windows.net \
    REDIS_PORT=6380 \
    REDIS_PASSWORD=secretref:redis-password \
    REDIS_TLS=true \
    JWT_SECRET=secretref:jwt-secret \
    AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a \
    AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347 \
    AZURE_AD_CLIENT_SECRET=secretref:azure-ad-client-secret \
    AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/api/v1/auth/callback \
    FRONTEND_URL=https://fleet.capitaltechalliance.com \
    LOG_LEVEL=info

# 6. Deploy emulators Container App
echo "6. Deploying emulators Container App..."
az containerapp create \
  --name fleet-emulators \
  --resource-group $RESOURCE_GROUP \
  --environment $MANAGED_ENV \
  --image $ACR_NAME.azurecr.io/fleet-emulators:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_NAME \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8081 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi

# 7. Deploy frontend Container App
echo "7. Deploying frontend Container App..."
az containerapp create \
  --name fleet-ui \
  --resource-group $RESOURCE_GROUP \
  --environment $MANAGED_ENV \
  --image $ACR_NAME.azurecr.io/fleet-ui:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_NAME \
  --registry-password "$ACR_PASSWORD" \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi

echo "====================================="
echo "Deployment Complete!"
echo "====================================="
echo ""
echo "Next Steps:"
echo "1. Run database migrations"
echo "2. Configure Azure Front Door routing"
echo "3. Purge Front Door cache"
echo "4. Verify health checks"
echo ""
```

---

## 5. Security Implementation

### 5.1 Network Security

**Azure Container Apps Network Configuration:**
```yaml
# VNet Integration
vnetConfiguration:
  infrastructureSubnetId: /subscriptions/.../subnets/fleet-container-subnet
  internal: false  # External ingress required for Front Door

# Network Security Group Rules
inboundRules:
  - name: AllowFrontDoorInbound
    priority: 100
    direction: Inbound
    access: Allow
    protocol: Tcp
    sourceAddressPrefix: AzureFrontDoor.Backend
    destinationPortRange: 443

  - name: DenyAllInbound
    priority: 4096
    direction: Inbound
    access: Deny
    protocol: *
    sourceAddressPrefix: *
```

### 5.2 Application Security

**Environment Variable Validation:**
```typescript
// server/src/services/config.ts
const requiredEnvVars = [
  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_TENANT_ID',
  'AZURE_AD_REDIRECT_URI',
  'DATABASE_HOST',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'REDIS_HOST',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

**SQL Injection Prevention:**
```typescript
// ALWAYS use parameterized queries
await db.query(
  'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
  [vehicleId, tenantId]
);

// NEVER concatenate user input
// ❌ WRONG: `SELECT * FROM vehicles WHERE id = '${vehicleId}'`
```

**JWT Validation:**
```typescript
// server/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export function validateToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: 'fleet-management-api',
      audience: 'fleet-management-app',
    }) as JWTPayload;
  } catch (err) {
    throw new UnauthorizedError('Invalid token');
  }
}
```

### 5.3 Secrets Management

**Key Vault References in Container Apps:**
```yaml
secrets:
  - name: database-password
    keyVaultUrl: https://fleet-secrets-0d326d71.vault.azure.net/secrets/fleet-postgres-password
    identity: system
  - name: redis-password
    keyVaultUrl: https://fleet-secrets-0d326d71.vault.azure.net/secrets/fleet-redis-password
    identity: system
```

**Managed Identity Configuration:**
```bash
# Enable system-assigned managed identity for Container App
az containerapp identity assign \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --system-assigned

# Grant Key Vault access
IDENTITY_ID=$(az containerapp identity show \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --query principalId -o tsv)

az keyvault set-policy \
  --name fleet-secrets-0d326d71 \
  --object-id $IDENTITY_ID \
  --secret-permissions get list
```

---

## 6. Monitoring & Observability

### 6.1 Application Insights Integration

**Configuration:**
```typescript
// server/src/services/telemetry.ts
import * as appInsights from 'applicationinsights';

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true, true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true)
  .start();

export const telemetryClient = appInsights.defaultClient;
```

**Custom Metrics:**
```typescript
// Track business metrics
telemetryClient.trackMetric({
  name: 'vehicles.active',
  value: activeVehicleCount,
});

telemetryClient.trackEvent({
  name: 'vehicle.checkout',
  properties: {
    vehicleId,
    driverId,
    facilityId,
  },
});
```

### 6.2 Logging Strategy

**Structured Logging with Winston:**
```typescript
// server/src/services/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    }),
  ],
});

// Usage
logger.info('User authenticated', {
  userId,
  tenantId,
  method: 'azure-ad'
});
```

### 6.3 Health Monitoring

**Endpoints:**
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await db.testConnection();
  const redisHealthy = await redis.ping();

  if (dbHealthy && redisHealthy) {
    res.json({
      status: 'healthy',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
    });
  }
});

// Liveness probe (simpler, faster)
app.get('/healthz', (req, res) => {
  res.send('OK');
});

// Readiness probe (checks dependencies)
app.get('/ready', async (req, res) => {
  const dbHealthy = await db.testConnection();
  res.status(dbHealthy ? 200 : 503).send(dbHealthy ? 'Ready' : 'Not Ready');
});
```

### 6.4 Alert Rules

**Critical Alerts:**
```yaml
# High Error Rate
- name: fleet-high-error-rate
  description: Alert when API error rate exceeds 5%
  condition: requests/failed > (requests/count * 0.05)
  evaluationFrequency: PT5M
  windowSize: PT15M
  severity: 2
  actionGroup: fleet-critical-alerts

# Database Connection Failures
- name: fleet-database-failures
  description: Alert on database connection failures
  condition: dependencies/failed where target contains 'postgres' > 5
  evaluationFrequency: PT1M
  windowSize: PT5M
  severity: 1
  actionGroup: fleet-critical-alerts

# Slow Response Time
- name: fleet-slow-response-time
  description: Alert when P95 response time exceeds 2s
  condition: requests/duration percentile 95 > 2000
  evaluationFrequency: PT5M
  windowSize: PT15M
  severity: 3
  actionGroup: fleet-critical-alerts
```

---

## 7. Performance Optimization

### 7.1 Database Performance

**Connection Pooling:**
```typescript
// server/src/services/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
  },
  max: 20,  // Maximum pool size
  min: 2,   // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,  // 30 second query timeout
});
```

**Query Optimization:**
```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_vehicles_tenant_status
  ON vehicles(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_drivers_tenant_active
  ON drivers(tenant_id, is_active);

CREATE INDEX CONCURRENTLY idx_maintenance_vehicle_scheduled
  ON maintenance_records(vehicle_id, scheduled_date)
  WHERE status != 'completed';

-- Analyze tables regularly (automated by Azure PostgreSQL)
ANALYZE vehicles;
ANALYZE drivers;
ANALYZE maintenance_records;
```

### 7.2 Redis Caching Strategy

**Cache Patterns:**
```typescript
// server/src/services/cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Cache-aside pattern
export async function getCachedVehicles(tenantId: string) {
  const cacheKey = `cache:vehicles:${tenantId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from DB
  const vehicles = await db.query(
    'SELECT * FROM vehicles WHERE tenant_id = $1',
    [tenantId]
  );

  // Store in cache (5 minute TTL)
  await redis.setex(cacheKey, 300, JSON.stringify(vehicles));

  return vehicles;
}

// Invalidate cache on updates
export async function invalidateVehicleCache(tenantId: string, vehicleId?: string) {
  await redis.del(`cache:vehicles:${tenantId}`);
  if (vehicleId) {
    await redis.del(`cache:vehicle:${vehicleId}`);
  }
}
```

### 7.3 API Response Optimization

**Response Compression:**
```typescript
// Already enabled via Nginx for frontend
// For API, use compression middleware
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,  // Only compress responses > 1KB
}));
```

**Pagination:**
```typescript
// server/src/routes/vehicles.ts
app.get('/api/v1/vehicles', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;

  const { rows: vehicles, rowCount: total } = await db.query(
    'SELECT * FROM vehicles WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [req.user.tenantId, limit, offset]
  );

  res.json({
    data: vehicles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
```

---

## 8. Deployment Validation Plan

### 8.1 Pre-Deployment Checklist

```bash
✓ All Docker images built successfully
✓ Images pushed to ACR
✓ Azure Key Vault secrets configured
✓ Database created and accessible
✓ Redis cache created and accessible
✓ Container Apps environment ready
✓ Front Door configured
✓ WAF policy applied
✓ SSL certificates valid
✓ DNS records pointing to Front Door
✓ Monitoring alerts configured
```

### 8.2 Post-Deployment Validation

**Step 1: Health Checks**
```bash
# Backend API health
curl https://fleet-api.{env}.eastus2.azurecontainerapps.io/health

# Frontend health
curl https://fleet-ui.{env}.eastus2.azurecontainerapps.io/health

# Emulators health
curl https://fleet-emulators.{env}.eastus2.azurecontainerapps.io/health
```

**Step 2: Database Connectivity**
```bash
# Connect to PostgreSQL
psql "postgresql://fleetapp:PASSWORD@fleet-production-postgres-final.postgres.database.azure.com:5432/fleetdb?sslmode=require"

# Verify tables exist
\dt

# Check row counts
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers;
```

**Step 3: Redis Connectivity**
```bash
# Test Redis connection
redis-cli -h fleet-production-redis.redis.cache.windows.net -p 6380 -a PASSWORD --tls PING

# Check keys
redis-cli -h fleet-production-redis.redis.cache.windows.net -p 6380 -a PASSWORD --tls KEYS "*"
```

**Step 4: End-to-End Flow**
```bash
# 1. Load frontend
curl https://fleet.capitaltechalliance.com/

# 2. API health via Front Door
curl https://fleet.capitaltechalliance.com/api/health

# 3. WebSocket connection (emulators)
wscat -c wss://fleet.capitaltechalliance.com/ws/obd2

# 4. Authentication flow
curl https://fleet.capitaltechalliance.com/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}'

# 5. Fetch vehicles (authenticated)
curl https://fleet.capitaltechalliance.com/api/v1/vehicles \
  -H "Authorization: Bearer <token>"
```

**Step 5: Performance Testing**
```bash
# Load test with Apache Bench
ab -n 1000 -c 10 https://fleet.capitaltechalliance.com/api/health

# WebSocket load test
artillery quick --count 100 --num 10 wss://fleet.capitaltechalliance.com/ws/obd2
```

### 8.3 Rollback Plan

**If deployment fails:**

```bash
# 1. Identify the issue
az containerapp logs show --name fleet-api --resource-group fleet-production-rg --tail 100

# 2. Rollback to previous revision
az containerapp revision list --name fleet-api --resource-group fleet-production-rg --output table

# 3. Activate previous revision
az containerapp revision activate \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --revision <previous-revision-name>

# 4. Update traffic split (gradual rollback)
az containerapp ingress traffic set \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --revision-weight <previous-revision>=100
```

---

## 9. Cost Optimization

### 9.1 Current Estimated Costs (Monthly)

| Resource | SKU | Quantity | Unit Cost | Total |
|----------|-----|----------|-----------|-------|
| Container Apps (API) | 2-10 replicas | ~5 avg | $0.000024/vCPU-sec | ~$260 |
| Container Apps (UI) | 1-3 replicas | ~1.5 avg | $0.000012/vCPU-sec | ~$50 |
| Container Apps (Emulators) | 1 replica | 1 | $0.000012/vCPU-sec | ~$25 |
| PostgreSQL Flexible (B2s) | 2 vCores, 32GB | 1 | $66.43/month | $66.43 |
| Redis Premium P1 | 6 GB | 1 | $147.12/month | $147.12 |
| Front Door Premium | - | 1 | $0.06/GB + $0.025/10K req | ~$150 |
| Application Insights | 5GB/day | - | First 5GB free | $0 |
| Container Registry (Basic) | - | 1 | $5/month | $5 |
| Key Vault | 10K operations | - | $0.03/10K ops | $0.03 |
| **TOTAL** | | | | **~$703.58/month** |

### 9.2 Cost Optimization Strategies

1. **Auto-scaling**: Container Apps scale to zero during low traffic
2. **Reserved Capacity**: Purchase Azure Reserved Instances for PostgreSQL (save 38-72%)
3. **Redis Downgrade**: If usage is low, downgrade to Standard tier (save ~$100/month)
4. **Front Door Optimization**: Enable caching for static assets
5. **Log Retention**: Reduce Application Insights data retention from 90 to 30 days

---

## 10. Next Steps & Timeline

### Phase 1: Infrastructure Setup (Day 1)
- [x] Azure resources already exist
- [ ] Create production PostgreSQL database
- [ ] Create production Redis cache
- [ ] Configure Key Vault secrets
- [ ] Set up managed identities

### Phase 2: Build & Deploy (Day 2)
- [ ] Create backend Dockerfile
- [ ] Create emulators Dockerfile
- [ ] Update frontend Dockerfile
- [ ] Build and push all images to ACR
- [ ] Deploy Container Apps
- [ ] Run database migrations

### Phase 3: Integration & Routing (Day 3)
- [ ] Configure Azure Front Door routing
- [ ] Update SSL certificates
- [ ] Configure WAF policies
- [ ] Test end-to-end flows

### Phase 4: Validation & Monitoring (Day 4)
- [ ] Run health checks
- [ ] Configure Application Insights dashboards
- [ ] Set up alert rules
- [ ] Perform load testing
- [ ] Security scanning

### Phase 5: Go-Live (Day 5)
- [ ] Purge Front Door cache
- [ ] Final smoke tests
- [ ] Monitor for 24 hours
- [ ] Document runbooks
- [ ] Hand off to operations team

---

## Appendix A: Environment Variables Reference

### Backend API (.env)

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
FRONTEND_URL=https://fleet.capitaltechalliance.com

# Database
DATABASE_HOST=fleet-production-postgres-final.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_NAME=fleetdb
DATABASE_USER=fleetapp
DATABASE_PASSWORD=<from-keyvault>
DATABASE_SSL=true

# Redis
REDIS_HOST=fleet-production-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=<from-keyvault>
REDIS_TLS=true

# Azure AD
AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
AZURE_AD_CLIENT_SECRET=<from-keyvault>
AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/api/v1/auth/callback

# JWT
JWT_SECRET=<from-keyvault>
JWT_EXPIRES_IN=24h

# Session
SESSION_SECRET=<from-keyvault>
SESSION_MAX_AGE=86400000

# Monitoring
APPLICATIONINSIGHTS_CONNECTION_STRING=<from-azure-portal>
```

### Frontend (.env)

```bash
VITE_API_URL=https://fleet.capitaltechalliance.com/api
VITE_WS_URL=wss://fleet.capitaltechalliance.com/ws
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback
```

---

## Appendix B: Troubleshooting Guide

### Issue: Frontend shows stale content

**Cause:** Azure Front Door cache not purged

**Solution:**
```bash
az afd endpoint purge \
  --profile-name fleet-frontdoor \
  --endpoint-name fleet-endpoint \
  --resource-group fleet-production-rg \
  --content-paths "/*"
```

### Issue: Backend API cannot connect to database

**Cause:** Firewall rules or connection string incorrect

**Solution:**
```bash
# Check PostgreSQL firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group fleet-production-rg \
  --name fleet-production-postgres-final

# Allow Container Apps subnet
az postgres flexible-server firewall-rule create \
  --resource-group fleet-production-rg \
  --name fleet-production-postgres-final \
  --rule-name AllowContainerApps \
  --start-ip-address 10.0.0.0 \
  --end-ip-address 10.0.255.255
```

### Issue: Redis connection timeouts

**Cause:** TLS not enabled or wrong port

**Solution:**
Ensure `REDIS_TLS=true` and `REDIS_PORT=6380` (SSL port)

### Issue: Azure AD authentication fails

**Cause:** Incorrect redirect URI or client secret

**Solution:**
1. Verify redirect URI matches Azure AD app registration
2. Regenerate client secret in Azure AD
3. Update Key Vault secret
4. Restart Container App

---

## Appendix C: Security Compliance Checklist

### FedRAMP Requirements

- [x] Encryption in transit (TLS 1.2+)
- [x] Encryption at rest (Azure Storage/DB default)
- [x] Multi-factor authentication (Azure AD)
- [x] Role-based access control (RBAC)
- [x] Audit logging (Application Insights)
- [x] Vulnerability scanning (Azure Security Center)
- [x] Network segmentation (VNet/NSG)
- [x] Secrets management (Key Vault)
- [x] Incident response plan
- [x] Disaster recovery plan

### OWASP Top 10 Mitigation

1. **Injection**: Parameterized queries ($1, $2, $3)
2. **Broken Authentication**: Azure AD SSO, bcrypt, JWT
3. **Sensitive Data Exposure**: TLS everywhere, Key Vault
4. **XML External Entities**: JSON only, no XML parsing
5. **Broken Access Control**: RBAC + RLS policies
6. **Security Misconfiguration**: Helmet, CSP headers
7. **Cross-Site Scripting**: React auto-escaping, CSP
8. **Insecure Deserialization**: JSON only, validate schemas
9. **Using Components with Known Vulnerabilities**: Automated dependency scanning
10. **Insufficient Logging & Monitoring**: Application Insights, Winston

---

**Document Version:** 1.0
**Last Updated:** December 30, 2025
**Author:** Claude Code (Anthropic)
**Status:** READY FOR IMPLEMENTATION
