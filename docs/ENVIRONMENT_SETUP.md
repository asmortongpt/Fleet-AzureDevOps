# Fleet-CTA Environment Setup Guide

## Overview

This document details all environment variables, secrets, and configuration parameters required to run Fleet-CTA in production.

## Table of Contents

1. [Environment Variables by Category](#environment-variables-by-category)
2. [Azure Services Configuration](#azure-services-configuration)
3. [Database Configuration](#database-configuration)
4. [Security & Secrets Management](#security--secrets-management)
5. [API Keys & External Services](#api-keys--external-services)
6. [Monitoring & Observability](#monitoring--observability)
7. [Development vs Production Settings](#development-vs-production-settings)
8. [Secret Rotation](#secret-rotation)

---

## Environment Variables by Category

### Application Configuration

**Required for all environments:**

```bash
# Core Settings
NODE_ENV=production              # production, staging, or development
ENVIRONMENT=production           # Alternate name for NODE_ENV
PORT=3001                       # API server port
HOST=0.0.0.0                    # Bind to all interfaces (in container)
API_BASE_URL=https://api.example.com  # API endpoint URL
FRONTEND_URL=https://example.com      # Frontend URL

# Build Information (for tracking)
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)
DEPLOYED_BY=deployment-user
DEPLOYMENT_TIMESTAMP=$(date)
```

### Database Configuration

**PostgreSQL database connection:**

```bash
# ============================================================================
# PRIMARY DATABASE CONNECTION (Web App User)
# ============================================================================
DATABASE_HOST=fleet-db-prod.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_NAME=fleet_production
DATABASE_USER=fleet_webapp_user
DATABASE_PASSWORD=<secure_password_minimum_32_chars>  # From Key Vault
DATABASE_SSL=true               # Required for Azure
DATABASE_SSL_MODE=require       # Strict SSL verification

# ============================================================================
# CONNECTION POOL SETTINGS
# ============================================================================
DB_POOL_SIZE=30                 # Maximum connections in pool
DB_IDLE_TIMEOUT=30000           # Idle timeout in milliseconds
DB_STATEMENT_CACHE_SIZE=256     # Prepared statement cache

# ============================================================================
# ADMIN USER (MIGRATIONS ONLY)
# ============================================================================
DB_ADMIN_USER=cloudadmin
DB_ADMIN_PASSWORD=<secure_password>     # From Key Vault
DB_ADMIN_POOL_SIZE=5                    # Only used for migrations

# ============================================================================
# READ-ONLY USER (REPORTING)
# ============================================================================
DB_READONLY_USER=fleet_readonly_user
DB_READONLY_PASSWORD=<secure_password>  # From Key Vault
DB_READONLY_POOL_SIZE=10                # For analytics queries

# ============================================================================
# CONNECTION HEALTH & MONITORING
# ============================================================================
DB_HEALTH_CHECK_INTERVAL=60000  # Health check every 60 seconds
DB_LOG_QUERIES=false            # Disable query logging in production
DB_CONNECTION_TIMEOUT=10000     # Connection timeout in milliseconds
DB_QUERY_TIMEOUT=30000          # Query timeout in milliseconds
```

### Redis Cache Configuration

**Redis connection and caching:**

```bash
# ============================================================================
# REDIS CONNECTION
# ============================================================================
REDIS_HOST=fleet-redis-prod.redis.cache.windows.net
REDIS_PORT=6380                 # Azure Redis uses 6380 for TLS
REDIS_PASSWORD=<secure_password_minimum_32_chars>  # From Key Vault
REDIS_TLS=true                  # Required for Azure
REDIS_TLS_SERVERNAME=fleet-redis-prod.redis.cache.windows.net

# Complete connection string (alternative to individual settings)
REDIS_URL=rediss://:PASSWORD@HOST:6380/0

# ============================================================================
# REDIS POOL & PERFORMANCE
# ============================================================================
REDIS_CONNECTION_POOL_SIZE=30
REDIS_SOCKET_KEEPALIVE=true
REDIS_SOCKET_CONNECT_TIMEOUT=5000
REDIS_COMMAND_TIMEOUT=5000

# ============================================================================
# REDIS USAGE CONFIGURATION
# ============================================================================
REDIS_KEY_PREFIX=fleet:prod:    # Namespace for all keys
REDIS_SESSION_TTL=86400         # Session timeout (1 day)
REDIS_CACHE_TTL_DEFAULT=300     # Default cache TTL (5 minutes)
REDIS_CACHE_TTL_VEHICLES=60     # Vehicle data cache (1 minute)
REDIS_CACHE_TTL_CONFIG=3600     # Config cache (1 hour)
```

### Azure Authentication & Services

**Azure AD and related services:**

```bash
# ============================================================================
# AZURE AD (OAuth 2.0 / OIDC)
# ============================================================================
AZURE_AD_CLIENT_ID=<from-key-vault>          # Application ID
AZURE_AD_CLIENT_SECRET=<from-key-vault>      # Client secret
AZURE_AD_TENANT_ID=<from-key-vault>          # Tenant ID
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/TENANT_ID
AZURE_AD_REDIRECT_URI=https://fleet.example.com/auth/callback
AZURE_AD_LOGOUT_URI=https://fleet.example.com/logout
AZURE_AD_SCOPES=api://CLIENT_ID/.default    # API scopes

# ============================================================================
# AZURE SUBSCRIPTION & RESOURCES
# ============================================================================
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_TENANT_ID=<your-tenant-id>
AZURE_RESOURCE_GROUP=fleet-prod-rg
AZURE_ENVIRONMENT=AzurePublicCloud           # Not AzureGovernmentCloud

# ============================================================================
# AZURE KEY VAULT
# ============================================================================
AZURE_KEY_VAULT_URI=https://fleet-secrets-prod-xyz.vault.azure.net/
AZURE_CLIENT_ID=<service-principal-or-managed-identity-id>
AZURE_CLIENT_SECRET=<service-principal-secret>  # Or use managed identity

# ============================================================================
# AZURE STORAGE ACCOUNT
# ============================================================================
STORAGE_ACCOUNT_NAME=fleetprodstg
STORAGE_ACCOUNT_KEY=<from-key-vault>         # Primary access key
STORAGE_CONNECTION_STRING=<connection-string> # Alternative to key
STORAGE_CONTAINER_VEHICLE_PHOTOS=vehicle-photos
STORAGE_CONTAINER_DOCUMENTS=documents
STORAGE_CONTAINER_LOGS=logs
STORAGE_MAX_FILE_SIZE=100mb

# ============================================================================
# AZURE OPENAI
# ============================================================================
AZURE_OPENAI_ENDPOINT=https://fleet-openai-prod.openai.azure.com/
AZURE_OPENAI_KEY=<from-key-vault>
AZURE_OPENAI_DEPLOYMENT_ID=gpt-4-turbo      # Deployment name
AZURE_OPENAI_API_VERSION=2024-02-15         # API version

# ============================================================================
# AZURE VISION (IMAGE PROCESSING)
# ============================================================================
AZURE_VISION_ENDPOINT=https://fleet-vision-prod.cognitiveservices.azure.com/
AZURE_VISION_KEY=<from-key-vault>

# ============================================================================
# AZURE MAPS
# ============================================================================
AZURE_MAPS_SUBSCRIPTION_KEY=<from-key-vault>
AZURE_MAPS_ENDPOINT=https://atlas.microsoft.com/

# ============================================================================
# AZURE SEARCH
# ============================================================================
AZURE_SEARCH_ENDPOINT=https://fleet-search.search.windows.net
AZURE_SEARCH_ADMIN_KEY=<from-key-vault>
AZURE_SEARCH_INDEX_NAME=fleet-documents
```

### JWT & Security

**JSON Web Token and security settings:**

```bash
# ============================================================================
# JWT CONFIGURATION
# ============================================================================
JWT_SECRET=<from-key-vault>                  # Minimum 64 random characters
JWT_ALGORITHM=HS256                          # HMAC SHA-256
JWT_EXPIRY=86400                             # Token expiry (24 hours)
JWT_REFRESH_EXPIRY=604800                    # Refresh token (7 days)
JWT_REFRESH_ENABLED=true

# ============================================================================
# SESSION CONFIGURATION
# ============================================================================
SESSION_SECRET=<from-key-vault>              # Minimum 32 random characters
SESSION_TIMEOUT=3600000                      # 1 hour in milliseconds
SESSION_COOKIE_SECURE=true                   # HTTPS only
SESSION_COOKIE_HTTPONLY=true                 # No JavaScript access
SESSION_COOKIE_SAMESITE=Strict               # CSRF protection

# ============================================================================
# PASSWORD HASHING
# ============================================================================
BCRYPT_ROUNDS=12                             # Cost factor (12+ for production)
HASH_ALGORITHM=bcrypt                        # Hashing algorithm

# ============================================================================
# CSRF PROTECTION
# ============================================================================
CSRF_ENABLED=true
CSRF_HEADER_NAME=X-CSRF-Token
CSRF_COOKIE_NAME=_csrf
```

### CORS & Security Headers

**Cross-Origin Resource Sharing and security:**

```bash
# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ORIGIN=https://fleet.capitaltechalliance.com  # Single domain only
CORS_CREDENTIALS=true                              # Allow cookies
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization
CORS_MAX_AGE=86400                                  # Preflight cache (24h)

# ============================================================================
# SECURITY HEADERS
# ============================================================================
HELMET_ENABLED=true                          # Enable all Helmet protections
X_FRAME_OPTIONS=SAMEORIGIN
X_CONTENT_TYPE_OPTIONS=nosniff
X_XSS_PROTECTION=1; mode=block
STRICT_TRANSPORT_SECURITY=max-age=31536000; includeSubDomains
CONTENT_SECURITY_POLICY=default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
REFERRER_POLICY=strict-origin-when-cross-origin
PERMISSIONS_POLICY=geolocation=(), microphone=(), camera=()

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000                     # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100                  # Per IP per window
RATE_LIMIT_STORE=redis                       # Use Redis for distributed limiting
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false    # Count all requests
```

### Email Configuration

**SMTP and email services:**

```bash
# ============================================================================
# SMTP CONFIGURATION
# ============================================================================
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@capitaltechalliance.com
SMTP_PASSWORD=<from-key-vault>               # Application password, not account password
SMTP_FROM_NAME="Fleet Management System"
SMTP_FROM_EMAIL=noreply@capitaltechalliance.com
SMTP_USE_TLS=true                            # Use STARTTLS
SMTP_POOL_SIZE=5                             # Connection pooling
SMTP_TIMEOUT=5000                            # Timeout in milliseconds

# ============================================================================
# EMAIL TEMPLATES
# ============================================================================
EMAIL_TEMPLATE_DIR=/app/templates/emails
EMAIL_TEST_MODE=false                        # For testing only
EMAIL_DEVELOPMENT_RECIPIENT=dev@example.com  # Intercept emails in dev
```

### Logging & Monitoring

**Application logging and observability:**

```bash
# ============================================================================
# LOG LEVEL & FORMAT
# ============================================================================
LOG_LEVEL=info                  # debug, info, warn, error, fatal
LOG_FORMAT=json                 # json for structured logging
LOG_PRETTY_PRINT=false          # Human-readable logs (dev only)

# ============================================================================
# LOG OUTPUT
# ============================================================================
LOG_OUTPUT=stdout              # or file, or both
LOG_FILE=/var/log/fleet-api/app.log
LOG_MAX_SIZE=100M              # Rotate at 100MB
LOG_MAX_FILES=10               # Keep 10 files max
LOG_COMPRESS=gzip              # Compress old files

# ============================================================================
# APPLICATION INSIGHTS (SENTRY ALTERNATIVE)
# ============================================================================
APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;...
APPINSIGHTS_INSTRUMENTATIONKEY=xxx
APPINSIGHTS_SAMPLE_RATE=0.1                 # Sample 10% of transactions

# ============================================================================
# SENTRY ERROR TRACKING
# ============================================================================
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1                      # Transaction sampling
SENTRY_TRACE_SAMPLE_RATE=0.1
SENTRY_ATTACH_STACKTRACE=true
SENTRY_INCLUDE_REQUEST_BODY=small           # small, medium, large, never
SENTRY_REQUEST_BODIES_MAX_SIZE=10000

# ============================================================================
# OPENTELEMETRY TRACING
# ============================================================================
OTEL_ENABLED=true
OTEL_SDK_ENABLED=true
OTEL_EXPORTER_OTLP_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://fleet-app-insights.monitor.azure.com
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer token
OTEL_SERVICE_NAME=fleet-api-prod
OTEL_SERVICE_VERSION=1.0.0
OTEL_TRACE_SAMPLER=traceidratio
OTEL_TRACE_SAMPLE_RATE=0.1

# ============================================================================
# AUDIT LOGGING
# ============================================================================
AUDIT_ENABLED=true
AUDIT_LOG_FILE=/var/log/fleet-api/audit.log
AUDIT_EVENTS=user_login,data_access,config_change,api_call
```

### Feature Flags

**Feature flag configuration:**

```bash
# ============================================================================
# DEBUG & DEVELOPMENT
# ============================================================================
ENABLE_DEBUG_LOGGING=false      # Never true in production
ENABLE_HOT_RELOAD=false         # Hot module replacement
ENABLE_MOCK_DATA=false          # Use fake data for testing
ENABLE_VERBOSE_ERRORS=false     # Detailed error messages
ENABLE_API_DOCS=false           # Hide Swagger/OpenAPI docs

# ============================================================================
# OBSERVABILITY
# ============================================================================
ENABLE_TELEMETRY_EXPORT=true    # Send metrics/traces to backend
ENABLE_AUDIT_LOGGING=true       # Log user actions
ENABLE_REQUEST_LOGGING=true     # Log HTTP requests
ENABLE_DATABASE_LOGGING=false   # Log SQL queries (high volume)

# ============================================================================
# FEATURES
# ============================================================================
ENABLE_RATE_LIMITING=true       # IP-based rate limiting
ENABLE_CACHING=true             # Redis caching layer
ENABLE_COMPRESSION=true         # gzip compression
ENABLE_HTTPS_REDIRECT=true      # Force HTTPS
ENABLE_CORS=true                # Cross-origin requests
ENABLE_WEBHOOKS=true            # Webhook delivery
ENABLE_WEBSOCKETS=true          # Real-time updates

# ============================================================================
# THIRD-PARTY FEATURES
# ============================================================================
ENABLE_GOOGLE_MAPS=true         # Maps functionality
ENABLE_VIDEO_ANALYSIS=true      # AI video analysis
ENABLE_AI_FEATURES=true         # OpenAI/Azure OpenAI features
ENABLE_EMAIL_NOTIFICATIONS=true # Transactional emails
```

### Performance Tuning

**Performance and optimization settings:**

```bash
# ============================================================================
# REQUEST SIZE LIMITS
# ============================================================================
MAX_REQUEST_SIZE=50mb           # Max HTTP request body
MAX_JSON_SIZE=50mb              # Max JSON payload
MAX_URL_LENGTH=8192             # Max URL length
MAX_FIELD_SIZE=10mb             # Max form field

# ============================================================================
# COMPRESSION
# ============================================================================
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6             # 1-9, higher = better ratio but slower
COMPRESSION_THRESHOLD=1024      # Min bytes to compress
COMPRESSION_TYPES=text/html,application/json,application/javascript

# ============================================================================
# CACHING TIMEOUTS
# ============================================================================
CACHE_TTL_USERS=300             # 5 minutes
CACHE_TTL_VEHICLES=60           # 1 minute
CACHE_TTL_DRIVERS=300           # 5 minutes
CACHE_TTL_CONFIG=3600           # 1 hour
CACHE_TTL_ROUTES=120            # 2 minutes
CACHE_TTL_GEOLOCATION=600       # 10 minutes

# ============================================================================
# DATABASE QUERY OPTIMIZATION
# ============================================================================
QUERY_RESULT_CACHE_ENABLED=true
QUERY_TIMEOUT=30000             # 30 seconds (adjustable per query)
QUERY_BATCH_SIZE=1000           # Batch insert/update operations
EXPLAIN_ANALYZE_SLOW_QUERIES=true  # Log query plans for slow queries
SLOW_QUERY_THRESHOLD=1000       # Log queries taking > 1 second

# ============================================================================
# CONNECTION POOL OPTIMIZATION
# ============================================================================
CONNECTION_POOL_MIN=5           # Minimum connections to maintain
CONNECTION_POOL_MAX=30          # Maximum connection pool size
CONNECTION_POOL_IDLE_TIMEOUT=30000  # Close idle connections
CONNECTION_REUSE_ENABLED=true   # Reuse connections
```

### File Upload & Storage

**File handling and storage configuration:**

```bash
# ============================================================================
# FILE UPLOAD
# ============================================================================
UPLOAD_ENABLED=true
UPLOAD_MAX_SIZE=100mb
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf,application/msword
UPLOAD_TEMP_DIR=/tmp/fleet-uploads
UPLOAD_TIMEOUT=300000           # 5 minutes

# ============================================================================
# BLOB STORAGE
# ============================================================================
BLOB_STORAGE_ENABLED=true
BLOB_STORAGE_ACCOUNT=fleetprodstg
BLOB_STORAGE_CONTAINER=vehicle-photos
BLOB_STORAGE_PATH_PREFIX=uploads/
BLOB_STORAGE_RETENTION_DAYS=365

# ============================================================================
# FILE CLEANUP
# ============================================================================
CLEANUP_TEMP_FILES_ENABLED=true
CLEANUP_TEMP_FILES_INTERVAL=3600000  # Every hour
CLEANUP_TEMP_FILES_AGE=604800        # Delete files older than 7 days
CLEANUP_LOGS_ENABLED=true
CLEANUP_LOGS_RETENTION_DAYS=30
```

---

## Azure Services Configuration

### Create and Configure Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name fleet-secrets-prod-xyz \
  --resource-group fleet-prod-rg \
  --location eastus2 \
  --enable-purge-protection true \
  --enable-rbac-authorization true

# Enable soft delete
az keyvault update \
  --name fleet-secrets-prod-xyz \
  --resource-group fleet-prod-rg \
  --enable-soft-delete true \
  --soft-delete-retention-days 90

# Grant permissions to App Service
APP_SERVICE_ID=$(az webapp identity assign \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --query principalId \
  --output tsv)

az keyvault set-policy \
  --name fleet-secrets-prod-xyz \
  --object-id $APP_SERVICE_ID \
  --secret-permissions get list
```

### Configure PostgreSQL

```bash
# Create server
az postgres server create \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --location eastus2 \
  --admin-user cloudadmin \
  --admin-password $(openssl rand -base64 32) \
  --sku-name B_Gen5_2 \
  --storage-size 51200 \
  --backup-retention 35 \
  --geo-redundant-backup Enabled \
  --infrastructure-encryption Enabled

# Allow Azure services
az postgres server firewall-rule create \
  --resource-group fleet-prod-rg \
  --server-name fleet-db-prod \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Configure SSL
az postgres server configuration set \
  --resource-group fleet-prod-rg \
  --server-name fleet-db-prod \
  --name require_secure_transport \
  --value ON
```

### Configure Redis Cache

```bash
# Create Cache
az redis create \
  --resource-group fleet-prod-rg \
  --name fleet-redis-prod \
  --location eastus2 \
  --sku Premium \
  --vm-size p1 \
  --minimum-tls-version 1.2 \
  --enable-non-ssl-port false

# Get connection string
az redis show-connection-string \
  --name fleet-redis-prod \
  --resource-group fleet-prod-rg
```

---

## Database Configuration

### PostgreSQL Connection String

```bash
# Standard format:
postgresql://username:password@host:port/database

# With SSL:
postgresql://username:password@host:5432/database?sslmode=require

# Azure format:
postgresql://fleet_webapp_user@fleet-db-prod:password@fleet-db-prod.postgres.database.azure.com:5432/fleet_production?sslmode=require

# Environment variable:
DATABASE_URL="postgresql://fleet_webapp_user@fleet-db-prod:password@fleet-db-prod.postgres.database.azure.com:5432/fleet_production?sslmode=require"
```

### Create Database Users

```sql
-- Web app user (normal operations)
CREATE USER fleet_webapp_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE fleet_production TO fleet_webapp_user;
GRANT USAGE ON SCHEMA public TO fleet_webapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fleet_webapp_user;

-- Read-only user (reporting)
CREATE USER fleet_readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE fleet_production TO fleet_readonly_user;
GRANT USAGE ON SCHEMA public TO fleet_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO fleet_readonly_user;

-- Verify users
\du
```

### Database Backups

```bash
# Manual backup
pg_dump -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production \
  --verbose \
  --compress=9 \
  > backup.sql.gz

# Restore backup
gunzip < backup.sql.gz | psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production
```

---

## Security & Secrets Management

### Secret Naming Convention

All secrets stored in Azure Key Vault should follow this pattern:

```
fleet-[environment]-[component]-[name]

Examples:
- fleet-prod-db-password
- fleet-prod-jwt-secret
- fleet-prod-azure-ad-client-secret
- fleet-prod-redis-password
```

### Secret Rotation Schedule

| Secret | Rotation | Action |
|--------|----------|--------|
| Database password | Every 90 days | `az keyvault secret set` |
| Redis password | Every 90 days | `azure redis update` |
| JWT secret | Every 180 days | Generate new, update Key Vault |
| API keys | As needed | Regenerate in service portal |
| SSL certificates | Every 365 days | Auto-renewed by Azure |

### Generate Secure Secrets

```bash
# 32-character password (DB/Redis)
openssl rand -base64 32

# 64-character secret (JWT)
openssl rand -base64 64

# Random token
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Verify strength
# Should contain: uppercase, lowercase, numbers, special characters
# Minimum 32 characters
```

---

## API Keys & External Services

### Google Maps API

```bash
# Get from Google Cloud Console
GOOGLE_MAPS_API_KEY=AIzaSyC... (minimum 39 characters)
GOOGLE_MAPS_PROJECT_ID=your-project-id
GOOGLE_MAPS_RESTRICTIONS=https://fleet.capitaltechalliance.com

# Rate limiting
GOOGLE_MAPS_MAX_REQUESTS_PER_SECOND=10
GOOGLE_MAPS_MAX_REQUESTS_PER_DAY=25000
```

### Azure OpenAI

```bash
# Get from Azure Portal > Cognitive Services
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=<get-from-portal>
AZURE_OPENAI_DEPLOYMENT_ID=gpt-4-turbo
AZURE_OPENAI_API_VERSION=2024-02-15
AZURE_OPENAI_MAX_TOKENS=4096
AZURE_OPENAI_TEMPERATURE=0.7
```

### Sentry Error Tracking

```bash
# Get from Sentry Project Settings
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1  # Sample 10% of transactions
```

---

## Monitoring & Observability

### Application Insights

```bash
# Get from Azure Portal
APPLICATION_INSIGHTS_CONNECTION_STRING=InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/

# Enable custom tracking
APPINSIGHTS_ENABLED=true
APPINSIGHTS_SAMPLE_RATE=1.0  # Sample all events (can reduce in production)
```

### Datadog (Optional)

```bash
DATADOG_API_KEY=<get-from-datadog>
DATADOG_SITE=datadoghq.com
DATADOG_ENV=production
DATADOG_SERVICE=fleet-api
DATADOG_VERSION=1.0.0
```

---

## Development vs Production Settings

### Development Environment

```bash
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
DATABASE_SSL=false
REDIS_TLS=false
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
ENABLE_API_DOCS=true
ENABLE_MOCK_DATA=false  # Use real data
ENABLE_DEBUG_LOGGING=true
SENTRY_SAMPLE_RATE=1.0  # Sample all
```

### Staging Environment

```bash
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
DATABASE_SSL=true
REDIS_TLS=true
CORS_ORIGIN=https://staging.capitaltechalliance.com
ENABLE_API_DOCS=false
ENABLE_MOCK_DATA=false
ENABLE_DEBUG_LOGGING=false
SENTRY_SAMPLE_RATE=0.5  # Sample half
```

### Production Environment

```bash
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
DATABASE_SSL=true
REDIS_TLS=true
CORS_ORIGIN=https://fleet.capitaltechalliance.com
ENABLE_API_DOCS=false
ENABLE_MOCK_DATA=false
ENABLE_DEBUG_LOGGING=false
SENTRY_SAMPLE_RATE=0.1  # Sample 10%
```

---

## Secret Rotation

### Database Credentials

```bash
# 1. Create new user
psql -h fleet-db-prod.postgres.database.azure.com \
  -U cloudadmin \
  -d fleet_production \
  -c "CREATE USER fleet_webapp_user_new WITH PASSWORD 'new_password';"

# 2. Grant permissions
psql -h fleet-db-prod.postgres.database.azure.com \
  -U cloudadmin \
  -d fleet_production \
  -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fleet_webapp_user_new;"

# 3. Update Key Vault
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name DATABASE-PASSWORD \
  --value "new_password"

# 4. Update App Service
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings DATABASE_PASSWORD="new_password"

# 5. Restart App Service
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 6. Verify connection
curl https://fleet.capitaltechalliance.com/api/health

# 7. Drop old user
psql -h fleet-db-prod.postgres.database.azure.com \
  -U cloudadmin \
  -d fleet_production \
  -c "DROP USER fleet_webapp_user;"

# 8. Rename new user to standard name
psql -h fleet-db-prod.postgres.database.azure.com \
  -U cloudadmin \
  -d fleet_production \
  -c "ALTER USER fleet_webapp_user_new RENAME TO fleet_webapp_user;"
```

### JWT Secret Rotation

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# 2. Store in Key Vault (with version suffix)
az keyvault secret set \
  --vault-name fleet-secrets-prod-xyz \
  --name JWT-SECRET-NEW \
  --value "$NEW_SECRET"

# 3. Implement dual-validation in code (accept old and new for 24 hours)
# Accept tokens signed with both old and new secrets

# 4. Update App Service after validating
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings JWT_SECRET="$NEW_SECRET"

# 5. Restart App Service
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 6. Monitor for issues (24 hours)
# Check logs for auth errors

# 7. Remove old secret from Key Vault
az keyvault secret delete \
  --vault-name fleet-secrets-prod-xyz \
  --name JWT-SECRET-OLD
```

---

## Troubleshooting Environment Issues

### Verify All Secrets Are Set

```bash
# List all secrets
az keyvault secret list \
  --vault-name fleet-secrets-prod-xyz \
  --query "[].name" \
  --output table

# Check if specific secret exists
az keyvault secret show \
  --vault-name fleet-secrets-prod-xyz \
  --name DATABASE-PASSWORD \
  --query "value" \
  --output tsv
```

### Check App Service Environment Variables

```bash
# View all configured settings
az webapp config appsettings list \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# Check specific setting
az webapp config appsettings list \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --query "[?name=='NODE_ENV'].value" \
  --output tsv
```

### Test Database Connection

```bash
# From App Service
az webapp ssh \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# Then inside container:
psql -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  -c "SELECT version();"
```

### Test Redis Connection

```bash
# Get Redis connection string
redis_connection=$(az redis show-connection-string \
  --name fleet-redis-prod \
  --resource-group fleet-prod-rg)

# Test connection
redis-cli -c "$redis_connection" PING
```

---

## Summary Checklist

Before deploying to production, ensure:

- [ ] All required environment variables are set
- [ ] All secrets are stored in Azure Key Vault (not in code)
- [ ] Database credentials are minimum 32 characters
- [ ] JWT secret is minimum 64 characters
- [ ] SSL/TLS enabled for database and Redis
- [ ] CORS origin is whitelist-only
- [ ] Email credentials are application-specific passwords
- [ ] API keys are from correct Azure subscriptions
- [ ] Monitoring and logging are properly configured
- [ ] Rate limiting is enabled
- [ ] Feature flags are appropriate for production

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** DevOps Team
