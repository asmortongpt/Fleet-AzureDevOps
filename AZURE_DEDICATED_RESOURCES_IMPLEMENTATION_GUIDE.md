# Azure Dedicated Resources Implementation Guide
**Fleet Application - Environment Isolation**

This guide provides step-by-step instructions for creating dedicated Azure resources for development and staging environments.

---

## Prerequisites

- Azure CLI installed and authenticated
- kubectl configured with fleet-aks-cluster context
- Permissions to create resources in subscription
- Key Vault access for storing secrets

## Cost Estimate

| Environment | Monthly Cost | Components |
|-------------|--------------|------------|
| Development | ~$35 | Postgres B1ms, Redis Basic C0, App Insights, Storage |
| Staging | ~$235 | Postgres D2s_v3, Redis Standard C1, App Insights, Storage |
| **Total** | **~$270** | Additional infrastructure cost |

---

## Part 1: Development Environment Setup

### Step 1: Create Resource Group

```bash
az group create \
  --name fleet-management-dev-rg \
  --location eastus2 \
  --tags Environment=Development Project=Fleet
```

### Step 2: Create PostgreSQL Database

```bash
# Create Flexible Server
az postgres flexible-server create \
  --resource-group fleet-management-dev-rg \
  --name fleet-postgres-dev-$(date +%s) \
  --location eastus2 \
  --admin-user fleetadmin \
  --admin-password "$(openssl rand -base64 32)" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --storage-auto-grow Enabled \
  --backup-retention 7 \
  --public-access 0.0.0.0 \
  --tags Environment=Development Project=Fleet

# Save the server name
DEV_PG_SERVER=$(az postgres flexible-server list \
  --resource-group fleet-management-dev-rg \
  --query "[0].name" -o tsv)

# Create database
az postgres flexible-server db create \
  --resource-group fleet-management-dev-rg \
  --server-name $DEV_PG_SERVER \
  --database-name fleetdb

# Configure firewall rules
# Get AKS outbound IP
AKS_OUTBOUND_IP=$(kubectl get svc -n kube-system kube-dns -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

az postgres flexible-server firewall-rule create \
  --resource-group fleet-management-dev-rg \
  --name $DEV_PG_SERVER \
  --rule-name allow-aks \
  --start-ip-address $AKS_OUTBOUND_IP \
  --end-ip-address $AKS_OUTBOUND_IP

# Optional: Allow your IP for direct access during setup
MY_IP=$(curl -s ifconfig.me)
az postgres flexible-server firewall-rule create \
  --resource-group fleet-management-dev-rg \
  --name $DEV_PG_SERVER \
  --rule-name allow-my-ip \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Step 3: Create Redis Cache

```bash
az redis create \
  --resource-group fleet-management-dev-rg \
  --name fleet-redis-dev-$(date +%s) \
  --location eastus2 \
  --sku Basic \
  --vm-size c0 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2 \
  --tags Environment=Development Project=Fleet

# Save the Redis name
DEV_REDIS_NAME=$(az redis list \
  --resource-group fleet-management-dev-rg \
  --query "[0].name" -o tsv)

# Get Redis connection string
az redis list-keys \
  --resource-group fleet-management-dev-rg \
  --name $DEV_REDIS_NAME
```

### Step 4: Create Application Insights

```bash
az monitor app-insights component create \
  --app fleet-app-insights-dev \
  --location eastus2 \
  --resource-group fleet-management-dev-rg \
  --application-type web \
  --retention-time 90 \
  --tags Environment=Development Project=Fleet

# Get connection string
az monitor app-insights component show \
  --app fleet-app-insights-dev \
  --resource-group fleet-management-dev-rg \
  --query "connectionString" -o tsv
```

### Step 5: Create Storage Account

```bash
az storage account create \
  --name fleetstoragedev$(date +%s | tail -c 6) \
  --resource-group fleet-management-dev-rg \
  --location eastus2 \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --https-only true \
  --min-tls-version TLS1_2 \
  --tags Environment=Development Project=Fleet

# Save the storage account name
DEV_STORAGE_NAME=$(az storage account list \
  --resource-group fleet-management-dev-rg \
  --query "[0].name" -o tsv)

# Get connection string
az storage account show-connection-string \
  --name $DEV_STORAGE_NAME \
  --resource-group fleet-management-dev-rg \
  --output tsv
```

### Step 6: Collect All Connection Strings

```bash
# Create a temporary file with all connection strings
cat > /tmp/fleet-dev-connections.txt <<EOF
=== Development Environment Connection Strings ===

PostgreSQL Server: $DEV_PG_SERVER
PostgreSQL Connection String:
$(az postgres flexible-server show-connection-string \
  --server-name $DEV_PG_SERVER \
  --database-name fleetdb \
  --admin-user fleetadmin \
  --admin-password '<password-from-step-2>' \
  --query connectionStrings.psql_cmd -o tsv)

Redis Name: $DEV_REDIS_NAME
Redis Primary Key:
$(az redis list-keys \
  --resource-group fleet-management-dev-rg \
  --name $DEV_REDIS_NAME \
  --query primaryKey -o tsv)

Redis Connection String:
$DEV_REDIS_NAME.redis.cache.windows.net:6380,password=<primary-key>,ssl=True,abortConnect=False

Application Insights Connection String:
$(az monitor app-insights component show \
  --app fleet-app-insights-dev \
  --resource-group fleet-management-dev-rg \
  --query connectionString -o tsv)

Storage Account: $DEV_STORAGE_NAME
Storage Connection String:
$(az storage account show-connection-string \
  --name $DEV_STORAGE_NAME \
  --resource-group fleet-management-dev-rg \
  --output tsv)

EOF

# Display the file
cat /tmp/fleet-dev-connections.txt
```

### Step 7: Update Kubernetes Secrets

```bash
# Get the actual values from previous steps
PG_CONNECTION_STRING="postgresql://fleetadmin:<password>@$DEV_PG_SERVER.postgres.database.azure.com/fleetdb?sslmode=require"
REDIS_CONNECTION_STRING="$DEV_REDIS_NAME.redis.cache.windows.net:6380,password=<primary-key>,ssl=True,abortConnect=False"
APPINSIGHTS_CONNECTION_STRING="<from-step-4>"
STORAGE_CONNECTION_STRING="<from-step-5>"

# Update fleet-secrets in dev namespace
kubectl create secret generic fleet-secrets \
  --from-literal=DB_HOST=$DEV_PG_SERVER.postgres.database.azure.com \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=fleetdb \
  --from-literal=DB_USERNAME=fleetadmin \
  --from-literal=DB_PASSWORD='<password-from-step-2>' \
  --from-literal=DB_CONNECTION_STRING="$PG_CONNECTION_STRING" \
  --from-literal=REDIS_HOST=$DEV_REDIS_NAME.redis.cache.windows.net \
  --from-literal=REDIS_PORT=6380 \
  --from-literal=REDIS_PASSWORD='<primary-key-from-step-3>' \
  --from-literal=REDIS_CONNECTION_STRING="$REDIS_CONNECTION_STRING" \
  --from-literal=APPLICATION-INSIGHTS-CONNECTION-STRING="$APPINSIGHTS_CONNECTION_STRING" \
  --from-literal=AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
  --dry-run=client -o yaml | kubectl apply -n fleet-management-dev -f -
```

### Step 8: Update ConfigMaps

```bash
kubectl edit configmap fleet-config -n fleet-management-dev
```

Update the following keys:
```yaml
DB_HOST: <DEV_PG_SERVER>.postgres.database.azure.com
DB_PORT: "5432"
REDIS_HOST: <DEV_REDIS_NAME>.redis.cache.windows.net
REDIS_PORT: "6380"
```

### Step 9: Migrate Data

```bash
# Dump existing dev database
kubectl exec -n fleet-management-dev fleet-postgres-0 -- \
  pg_dump -U fleetuser fleetdb > /tmp/fleetdb-dev-backup.sql

# Restore to Azure PostgreSQL
PGPASSWORD='<password-from-step-2>' psql \
  -h $DEV_PG_SERVER.postgres.database.azure.com \
  -U fleetadmin \
  -d fleetdb \
  -f /tmp/fleetdb-dev-backup.sql
```

### Step 10: Restart Deployments

```bash
# Restart all deployments to pick up new configuration
kubectl rollout restart deployment -n fleet-management-dev

# Watch the rollout
kubectl get pods -n fleet-management-dev -w
```

### Step 11: Verify Connection

```bash
# Test database connection
kubectl run -it --rm debug \
  --image=postgres:15-alpine \
  --restart=Never \
  --namespace=fleet-management-dev \
  -- psql -h $DEV_PG_SERVER.postgres.database.azure.com \
        -U fleetadmin \
        -d fleetdb \
        -c "SELECT version();"

# Check app logs
kubectl logs -n fleet-management-dev deployment/fleet-api --tail=50 | grep -i "database\|redis\|connected"
```

---

## Part 2: Staging Environment Setup

Repeat all steps from Part 1 with the following changes:

### Modified Parameters for Staging

```bash
# Resource Group
--name fleet-management-staging-rg

# PostgreSQL
--name fleet-postgres-staging-$(date +%s)
--sku-name Standard_D2s_v3
--tier GeneralPurpose
--storage-size 128
--backup-retention 14
--high-availability Enabled
--zone 1

# Redis
--name fleet-redis-staging-$(date +%s)
--sku Standard
--vm-size c1
--replicas-per-master 1

# Application Insights
--app fleet-app-insights-staging
--retention-time 180

# Storage
--name fleetstoragestagng$(date +%s | tail -c 6)
--sku Standard_GRS
--replication-type GRS

# Namespace
-n fleet-management-staging
```

---

## Part 3: Cost Management

### Set Up Budget Alerts

```bash
# Create budget for dev environment
az consumption budget create \
  --budget-name fleet-dev-monthly \
  --amount 50 \
  --resource-group fleet-management-dev-rg \
  --category Cost \
  --time-grain Monthly \
  --start-date $(date -u +"%Y-%m-01T00:00:00Z") \
  --end-date 2026-12-31T23:59:59Z

# Create budget for staging environment
az consumption budget create \
  --budget-name fleet-staging-monthly \
  --amount 300 \
  --resource-group fleet-management-staging-rg \
  --category Cost \
  --time-grain Monthly \
  --start-date $(date -u +"%Y-%m-01T00:00:00Z") \
  --end-date 2026-12-31T23:59:59Z
```

### Add Cost Tags

```bash
# Tag all dev resources
az resource tag \
  --resource-group fleet-management-dev-rg \
  --tags Environment=Development CostCenter=Engineering Project=Fleet

# Tag all staging resources
az resource tag \
  --resource-group fleet-management-staging-rg \
  --tags Environment=Staging CostCenter=Engineering Project=Fleet
```

---

## Part 4: Security Hardening

### Enable Private Endpoints (Optional, additional cost)

```bash
# Create VNet for private endpoints
az network vnet create \
  --resource-group fleet-management-dev-rg \
  --name fleet-dev-vnet \
  --address-prefix 10.1.0.0/16 \
  --subnet-name default \
  --subnet-prefix 10.1.0.0/24

# Create private endpoint for PostgreSQL
az network private-endpoint create \
  --resource-group fleet-management-dev-rg \
  --name fleet-postgres-dev-pe \
  --vnet-name fleet-dev-vnet \
  --subnet default \
  --private-connection-resource-id $(az postgres flexible-server show \
    --resource-group fleet-management-dev-rg \
    --name $DEV_PG_SERVER \
    --query id -o tsv) \
  --group-id postgresqlServer \
  --connection-name fleet-postgres-dev-connection

# Update PostgreSQL to disable public access
az postgres flexible-server update \
  --resource-group fleet-management-dev-rg \
  --name $DEV_PG_SERVER \
  --public-access Disabled
```

### Enable Diagnostic Logging

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group fleet-management-dev-rg \
  --workspace-name fleet-dev-logs

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group fleet-management-dev-rg \
  --workspace-name fleet-dev-logs \
  --query id -o tsv)

# Enable diagnostics for PostgreSQL
az monitor diagnostic-settings create \
  --resource $(az postgres flexible-server show \
    --resource-group fleet-management-dev-rg \
    --name $DEV_PG_SERVER \
    --query id -o tsv) \
  --name postgres-diagnostics \
  --workspace $WORKSPACE_ID \
  --logs '[{"category":"PostgreSQLLogs","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'

# Enable diagnostics for Redis
az monitor diagnostic-settings create \
  --resource $(az redis show \
    --resource-group fleet-management-dev-rg \
    --name $DEV_REDIS_NAME \
    --query id -o tsv) \
  --name redis-diagnostics \
  --workspace $WORKSPACE_ID \
  --logs '[{"category":"ConnectedClientList","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

---

## Part 5: Monitoring and Alerting

### Create Alerts for Database

```bash
# Alert on high CPU
az monitor metrics alert create \
  --name fleet-dev-postgres-high-cpu \
  --resource-group fleet-management-dev-rg \
  --scopes $(az postgres flexible-server show \
    --resource-group fleet-management-dev-rg \
    --name $DEV_PG_SERVER \
    --query id -o tsv) \
  --condition "avg cpu_percent > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "PostgreSQL CPU usage above 80%"

# Alert on high memory
az monitor metrics alert create \
  --name fleet-dev-postgres-high-memory \
  --resource-group fleet-management-dev-rg \
  --scopes $(az postgres flexible-server show \
    --resource-group fleet-management-dev-rg \
    --name $DEV_PG_SERVER \
    --query id -o tsv) \
  --condition "avg memory_percent > 85" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "PostgreSQL memory usage above 85%"

# Alert on connection failures
az monitor metrics alert create \
  --name fleet-dev-postgres-connection-failures \
  --resource-group fleet-management-dev-rg \
  --scopes $(az postgres flexible-server show \
    --resource-group fleet-management-dev-rg \
    --name $DEV_PG_SERVER \
    --query id -o tsv) \
  --condition "total active_connections > 45" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --description "PostgreSQL approaching connection limit (50)"
```

---

## Part 6: Cleanup (If Needed)

### Delete Dev Environment

```bash
# Delete entire resource group (WARNING: This deletes all resources)
az group delete \
  --name fleet-management-dev-rg \
  --yes \
  --no-wait

# Revert Kubernetes to use in-cluster databases
kubectl edit configmap fleet-config -n fleet-management-dev
# Change DB_HOST back to: fleet-postgres-service
# Change REDIS_HOST back to: fleet-redis-service

kubectl rollout restart deployment -n fleet-management-dev
```

---

## Troubleshooting

### Issue: Cannot connect to PostgreSQL

**Symptoms:**
```
FATAL: no pg_hba.conf entry for host "X.X.X.X"
```

**Solution:**
```bash
# Add firewall rule for your IP
az postgres flexible-server firewall-rule create \
  --resource-group fleet-management-dev-rg \
  --name $DEV_PG_SERVER \
  --rule-name allow-troubleshooting \
  --start-ip-address $(curl -s ifconfig.me) \
  --end-ip-address $(curl -s ifconfig.me)
```

### Issue: Pods can't reach Azure PostgreSQL

**Symptoms:**
```
could not translate host name "fleet-postgres-dev-XXXXX.postgres.database.azure.com" to address
```

**Solution:**
```bash
# Check DNS resolution from pod
kubectl run -it --rm debug \
  --image=busybox:1.35 \
  --restart=Never \
  --namespace=fleet-management-dev \
  -- nslookup $DEV_PG_SERVER.postgres.database.azure.com

# Check AKS outbound connectivity
kubectl run -it --rm debug \
  --image=postgres:15-alpine \
  --restart=Never \
  --namespace=fleet-management-dev \
  -- psql -h $DEV_PG_SERVER.postgres.database.azure.com -U fleetadmin -d fleetdb -c "SELECT 1;"
```

### Issue: Redis connection timeout

**Symptoms:**
```
Error: connect ETIMEDOUT
```

**Solution:**
```bash
# Verify Redis is accessible
az redis show \
  --resource-group fleet-management-dev-rg \
  --name $DEV_REDIS_NAME \
  --query provisioningState

# Check if SSL port is correct (6380 for SSL)
kubectl exec -n fleet-management-dev deployment/fleet-api -- \
  nc -zv $DEV_REDIS_NAME.redis.cache.windows.net 6380
```

---

## Best Practices

1. **Always use environment variables from secrets, never hardcode connection strings**
2. **Enable SSL/TLS for all connections**
3. **Use managed identities where possible instead of connection strings**
4. **Regularly review and update firewall rules**
5. **Monitor costs daily during first week**
6. **Set up backup retention policies**
7. **Tag all resources with Environment, Project, CostCenter**
8. **Use separate Application Insights instances per environment**
9. **Implement network security groups and private endpoints for production**
10. **Document all password and connection string locations**

---

## Appendix: Estimated Costs (as of November 2025)

### Development Environment

| Service | SKU | Monthly Cost |
|---------|-----|--------------|
| PostgreSQL Flexible Server | Standard_B1ms (1 vCore, 2GB) | $12 |
| Redis Cache | Basic C0 (250MB) | $16 |
| Application Insights | Standard (90-day retention) | $5 |
| Storage Account | Standard_LRS (50GB) | $2 |
| Log Analytics | 5GB ingestion | $3 |
| **Total** | | **~$38** |

### Staging Environment

| Service | SKU | Monthly Cost |
|---------|-----|--------------|
| PostgreSQL Flexible Server | Standard_D2s_v3 (2 vCore, 8GB) + HA | $145 |
| Redis Cache | Standard C1 (1GB) + Replica | $75 |
| Application Insights | Standard (180-day retention) | $10 |
| Storage Account | Standard_GRS (200GB) | $5 |
| Log Analytics | 20GB ingestion | $10 |
| **Total** | | **~$245** |

**Combined Additional Cost: ~$283/month**

---

**Document Version:** 1.0
**Last Updated:** November 13, 2025
**Status:** Ready for implementation
