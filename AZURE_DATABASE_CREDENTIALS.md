# Azure Database Infrastructure - Production Configuration

## Deployment Summary

Successfully deployed PostgreSQL and Redis infrastructure for Fleet production backend.

**Deployment Date**: December 30, 2025
**Resource Group**: fleet-production-rg
**Location**: East US 2

---

## PostgreSQL Database

### Server Details
- **Server Name**: fleet-postgres-prod
- **Fully Qualified Domain Name**: fleet-postgres-prod.postgres.database.azure.com
- **PostgreSQL Version**: 15
- **SKU**: Standard_B2s (Burstable tier)
- **Storage**: 32 GB
- **IOPS**: 120
- **State**: Ready
- **Admin User**: fleetadmin

### Connection Information

**Standard Connection String**:
```
postgresql://fleetadmin:FleetP0stgr3s0fad3984a32ddb85!@fleet-postgres-prod.postgres.database.azure.com/postgres?sslmode=require
```

**Environment Variable Format**:
```bash
DATABASE_URL=postgresql://fleetadmin:FleetP0stgr3s0fad3984a32ddb85!@fleet-postgres-prod.postgres.database.azure.com/postgres?sslmode=require
```

**Component Breakdown**:
- **Host**: fleet-postgres-prod.postgres.database.azure.com
- **Port**: 5432 (default PostgreSQL)
- **Database**: postgres
- **Username**: fleetadmin
- **Password**: FleetP0stgr3s0fad3984a32ddb85!
- **SSL Mode**: require (mandatory)

### Configuration Details
- **Backup Retention**: 7 days
- **Geo-Redundant Backup**: Disabled
- **High Availability**: Disabled (can be enabled if needed)
- **Public Network Access**: Enabled
- **Authentication**: Password-based (Azure AD disabled)
- **Data Encryption**: System Managed

### Firewall Rules
- Azure services access: Enabled
- Rule: AllowAllAzureServicesAndResourcesWithinAzureIps

---

## Redis Cache

### Server Details
- **Instance Name**: fleet-cache-prod-1767130705
- **Hostname**: fleet-cache-prod-1767130705.redis.cache.windows.net
- **Redis Version**: 6.0
- **SKU**: Basic C1 (1GB cache)
- **State**: Succeeded (Running)

### Connection Information

**Primary Connection String (SSL)**:
```
rediss://:x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE=@fleet-cache-prod-1767130705.redis.cache.windows.net:6380
```

**Environment Variable Format**:
```bash
REDIS_URL=rediss://:x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE=@fleet-cache-prod-1767130705.redis.cache.windows.net:6380
REDIS_HOST=fleet-cache-prod-1767130705.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE=
REDIS_TLS=true
```

**Access Keys**:
- **Primary Key**: x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE=
- **Secondary Key**: pxbioAPHjF7rNnpD3cUoqwvC0udifehfPAzCaO3OR5w=

### Port Configuration
- **SSL Port**: 6380 (use this)
- **Non-SSL Port**: 6379 (disabled for security)
- **Primary Instance SSL Port**: 15000

### Configuration Details
- **Minimum TLS Version**: 1.2
- **Public Network Access**: Enabled
- **Max Clients**: 1000
- **Max Memory Policy**: Default (volatile-lru)
- **Max Memory Reserved**: 125 MB
- **Update Channel**: Stable

### Security Settings
- **Non-SSL Port**: Disabled (enforces encrypted connections)
- **Access Key Authentication**: Enabled
- **Azure AD Authentication**: Not configured

---

## Quick Start - Environment Variables

Add these to your production `.env` file:

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://fleetadmin:FleetP0stgr3s0fad3984a32ddb85!@fleet-postgres-prod.postgres.database.azure.com/postgres?sslmode=require
POSTGRES_HOST=fleet-postgres-prod.postgres.database.azure.com
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=fleetadmin
POSTGRES_PASSWORD=FleetP0stgr3s0fad3984a32ddb85!
POSTGRES_SSL=true

# Redis Cache
REDIS_URL=rediss://:x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE=@fleet-cache-prod-1767130705.redis.cache.windows.net:6380
REDIS_HOST=fleet-cache-prod-1767130705.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE=
REDIS_TLS=true
```

---

## Azure Resource IDs

### PostgreSQL
```
/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/fleet-production-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/fleet-postgres-prod
```

### Redis
```
/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/fleet-production-rg/providers/Microsoft.Cache/Redis/fleet-cache-prod-1767130705
```

---

## Next Steps

1. **Database Setup**:
   ```bash
   # Connect to PostgreSQL
   psql "postgresql://fleetadmin:FleetP0stgr3s0fad3984a32ddb85!@fleet-postgres-prod.postgres.database.azure.com/postgres?sslmode=require"

   # Create application database
   CREATE DATABASE fleet_production;

   # Run migrations
   # (use your framework's migration tool)
   ```

2. **Redis Testing**:
   ```bash
   # Test Redis connection (using redis-cli)
   redis-cli -h fleet-cache-prod-1767130705.redis.cache.windows.net -p 6380 -a x1aEvB1grEdsuXC9I1bgU0vfurSjwh7hDAzCaIY9oiE= --tls

   # Test with PING
   PING
   # Should return: PONG
   ```

3. **Security Enhancements** (recommended):
   - Store credentials in Azure Key Vault
   - Configure VNet integration for private connectivity
   - Enable Azure AD authentication for PostgreSQL
   - Set up firewall rules to restrict access by IP
   - Enable Redis data persistence if needed
   - Configure automated backups and monitoring

4. **Monitoring**:
   - Enable Azure Monitor for both services
   - Set up alerts for connection failures, high CPU, memory usage
   - Configure diagnostic logs

---

## Cost Estimate

**PostgreSQL (Standard_B2s)**:
- ~$29/month (2 vCores, 4GB RAM, 32GB storage)

**Redis (Basic C1)**:
- ~$17/month (1GB cache)

**Total Monthly Cost**: ~$46/month

---

## Support Commands

### PostgreSQL Management
```bash
# List databases
az postgres flexible-server db list --server-name fleet-postgres-prod -g fleet-production-rg

# Create new database
az postgres flexible-server db create --server-name fleet-postgres-prod -g fleet-production-rg --database-name fleet_production

# Update admin password
az postgres flexible-server update --name fleet-postgres-prod -g fleet-production-rg --admin-password "<new-password>"

# Show server details
az postgres flexible-server show --name fleet-postgres-prod -g fleet-production-rg
```

### Redis Management
```bash
# Regenerate keys
az redis regenerate-keys --name fleet-cache-prod-1767130705 -g fleet-production-rg --key-type Primary

# Get keys
az redis list-keys --name fleet-cache-prod-1767130705 -g fleet-production-rg

# Show cache details
az redis show --name fleet-cache-prod-1767130705 -g fleet-production-rg

# Restart Redis
az redis force-reboot --name fleet-cache-prod-1767130705 -g fleet-production-rg --reboot-type AllNodes
```

---

## IMPORTANT SECURITY NOTES

1. **DO NOT** commit this file to public repositories
2. **DO** store these credentials in Azure Key Vault for production use
3. **DO** rotate the PostgreSQL password periodically
4. **DO** use the secondary Redis key for rotation without downtime
5. **DO** restrict network access using firewall rules when possible
6. **DO** enable SSL/TLS for all connections (already enforced)

---

Generated: December 30, 2025
