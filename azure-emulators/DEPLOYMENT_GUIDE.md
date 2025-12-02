# City of Tallahassee Fleet Emulator - Deployment Guide

## Executive Summary

This deployment guide provides step-by-step instructions for deploying a production-grade fleet emulator system simulating 300 continuous vehicles for the City of Tallahassee. The system uses Azure infrastructure with 5 specialized agents working in parallel.

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] Azure subscription with appropriate permissions
- [ ] Azure CLI installed (`az --version`)
- [ ] Docker installed and running (`docker --version`)
- [ ] PostgreSQL client installed (`psql --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Bash shell (Linux/macOS/WSL)
- [ ] Sufficient Azure quota:
  - Container Instances: 10 instances
  - vCPUs: 20+ cores
  - Memory: 40+ GB
  - PostgreSQL Flexible Server: 1 instance

## Estimated Deployment Time

- **Infrastructure Setup**: 15-20 minutes
- **Database Initialization**: 5-10 minutes
- **Emulator Deployment**: 10-15 minutes
- **Orchestrator API**: 5-10 minutes
- **Admin UI**: 5-10 minutes
- **Total**: 40-65 minutes

## Step-by-Step Deployment

### Step 1: Clone Repository

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
git clone <your-repo-url> azure-emulators
cd azure-emulators
```

### Step 2: Review Configuration

Examine the fleet configuration to ensure it matches your requirements:

```bash
cat config/tallahassee-fleet.json
```

**Key Configuration Points:**
- Total Vehicles: 300
- Departments: 6 (Police, Fire, Public Works, Transit, Utilities, Parks)
- Operating Hours: Department-specific
- Service Areas: 5 districts in Tallahassee

### Step 3: Azure Login

```bash
az login
az account list --output table
az account set --subscription "<your-subscription-id>"
```

### Step 4: Execute Master Deployment

The master deployment script orchestrates all 5 agents:

```bash
cd deploy
./master-deploy.sh
```

**What Happens:**

**Phase 1 - Infrastructure (Sequential)**
- Agent 1 deploys Azure resources
- Creates Resource Group
- Deploys ACR, SignalR, PostgreSQL, Container Apps
- Saves configuration to `deployment-config.env`

**Phase 2 - Services (Parallel)**
- Agent 2: Initializes PostgreSQL schema
- Agent 3: Builds and deploys 10 emulator pods
- Agent 4: Deploys orchestrator API
- Agent 5: Deploys admin UI

**Progress Monitoring:**
- Watch terminal output for real-time progress
- Check `logs/` directory for detailed agent logs
- Monitor Azure Portal for resource creation

### Step 5: Verify Deployment

After deployment completes, run the verification script:

```bash
./verify-deployment.sh
```

**Verification Checks:**
1. Orchestrator API responding
2. PostgreSQL database accessible
3. SignalR Service provisioned
4. All 10 emulator pods running
5. Admin UI accessible
6. Real-time telemetry flowing

### Step 6: Access Admin Dashboard

Open the Admin UI in your browser:

```bash
# URL provided in deployment output
https://<your-app>.azurestaticapps.net
```

**Dashboard Features:**
- Fleet statistics (300 vehicles)
- Department filtering
- Real-time vehicle grid
- Individual vehicle selection
- Mobile app screen viewing
- Live telemetry updates

## Agent Responsibilities

### Agent 1: Infrastructure Agent
**Model**: claude-sonnet-4-5
**Role**: Infrastructure provisioning

**Tasks:**
- Create Resource Group
- Deploy Bicep template
- Configure ACR
- Provision SignalR Service
- Create PostgreSQL Flexible Server
- Set up Container Apps Environment
- Deploy Static Web App
- Configure Application Insights
- Extract and save connection strings

**Output:** `deployment-config.env`

### Agent 2: Database Agent
**Model**: claude-sonnet-4-5
**Role**: Database setup and configuration

**Tasks:**
- Wait for PostgreSQL availability
- Create database
- Install TimescaleDB extension
- Execute schema.sql
- Create hypertables
- Configure retention policies (90 days)
- Set compression policies (7 days)
- Create indexes
- Verify connectivity

**Output:** Fully configured PostgreSQL database

### Agent 3: Emulator Service Agent
**Model**: claude-sonnet-4-5
**Role**: Emulator deployment

**Tasks:**
- Build Docker image
- Push to ACR
- Deploy 10 Container Instance pods
- Configure environment variables
- Set restart policy to Always
- Verify pod health
- Test health endpoints

**Output:** 10 running pods with 300 emulators

### Agent 4: Orchestrator API Agent
**Model**: claude-sonnet-4-5
**Role**: API orchestration

**Tasks:**
- Build orchestrator Docker image
- Push to ACR
- Deploy to Container Apps
- Configure auto-scaling (1-3 replicas)
- Set up secrets
- Configure ingress
- Verify API endpoints

**Output:** Running orchestrator API

### Agent 5: Admin UI Agent
**Model**: claude-sonnet-4-5
**Role**: Frontend deployment

**Tasks:**
- Get Static Web App details
- Update UI with orchestrator URL
- Deploy to Static Web Apps
- Configure API proxy
- Verify accessibility

**Output:** Live admin dashboard

## Database Schema Overview

### Core Tables

**Projects** - Track deployment projects
- id, name, repo, default_branch, created_at

**Tasks** - Individual work items
- id, project_id, parent_id, title, description, status, percent_complete, priority

**Agents** - Deployment agents
- id, name, llm_model, role, created_at, active

**Assignments** - Agent task assignments
- id, task_id, agent_id, status, percent_complete, notes

**Evidence** - Deployment evidence
- id, task_id, agent_id, type, ref, summary

### Fleet Tables

**Vehicles** - Vehicle registry
- id, vehicle_number, department, vehicle_type, model

**Vehicle_Telemetry** - Time-series telemetry (hypertable)
- time, vehicle_id, engine_rpm, speed, fuel_level, etc.

**Vehicle_Location** - GPS tracking (hypertable)
- time, vehicle_id, latitude, longitude, speed, heading

**Mobile_App_State** - Driver app state (hypertable)
- time, vehicle_id, driver_info, activity, trip_status

## Monitoring and Operations

### View Real-Time Telemetry

```sql
-- Connect to database
psql -h <postgres-host> -U fleetadmin -d fleet_emulator_telemetry

-- Latest vehicle status
SELECT * FROM latest_vehicle_status;

-- Recent telemetry (last 5 minutes)
SELECT vehicle_id, vehicle_speed, fuel_level, time
FROM vehicle_telemetry
WHERE time > NOW() - INTERVAL '5 minutes'
ORDER BY time DESC;

-- Active drivers
SELECT vehicle_id, driver_name, current_activity
FROM mobile_app_state
WHERE is_driver_logged_in = true
AND time > NOW() - INTERVAL '1 minute'
ORDER BY vehicle_id;
```

### Check Pod Status

```bash
# List all pods
az container list \
  --resource-group rg-fleet-emulators-tallahassee \
  --output table

# Check specific pod
az container show \
  --name ci-emulator-pod-0 \
  --resource-group rg-fleet-emulators-tallahassee

# View pod logs
az container logs \
  --name ci-emulator-pod-0 \
  --resource-group rg-fleet-emulators-tallahassee
```

### Monitor API Performance

```bash
# Test API endpoints
curl https://<orchestrator-url>/api/health
curl https://<orchestrator-url>/api/statistics
curl https://<orchestrator-url>/api/pods/status

# View Application Insights
az monitor app-insights component show \
  --app ai-fleet-emulators \
  --resource-group rg-fleet-emulators-tallahassee
```

## Troubleshooting

### Issue: Pods Not Starting

**Symptoms:** Container instances stuck in "Creating" or "Failed" state

**Solutions:**
1. Check quota: `az vm list-usage --location eastus`
2. Review pod logs: `az container logs --name <pod-name> --resource-group <rg>`
3. Verify ACR credentials
4. Check if image was pushed: `az acr repository list --name <acr-name>`

### Issue: Database Connection Timeout

**Symptoms:** Cannot connect to PostgreSQL

**Solutions:**
1. Check firewall rules: `az postgres flexible-server firewall-rule list`
2. Add your IP: `az postgres flexible-server firewall-rule create --name allow-my-ip --start-ip-address <your-ip> --end-ip-address <your-ip>`
3. Verify server is running: `az postgres flexible-server show`
4. Test connectivity: `psql -h <host> -U fleetadmin -d postgres`

### Issue: No Telemetry Data

**Symptoms:** Database tables are empty or stale

**Solutions:**
1. Check if pods are running: `az container list --query "[].{Name:name,State:instanceView.state}"`
2. Verify SignalR connection
3. Check pod logs for errors
4. Restart pods: `az container restart --name <pod-name>`

### Issue: Admin UI Not Loading

**Symptoms:** 404 or blank page

**Solutions:**
1. Check Static Web App status
2. Verify deployment completed
3. Check browser console for errors
4. Ensure orchestrator URL is correct in deployment config

## Scaling Guidance

### Vertical Scaling (Per Pod)

Increase resources for each pod:

```bash
# Modify deployment to use more CPU/memory
az container create \
  --cpu 4 \
  --memory 8
```

### Horizontal Scaling (More Pods)

Add more pods to increase vehicle count:

1. Update Bicep template: increase pod count from 10 to 20
2. Adjust emulators per pod calculation
3. Redeploy: `./agent3-emulators.sh`

### Database Scaling

Upgrade PostgreSQL tier:

```bash
az postgres flexible-server update \
  --name postgres-fleet-emulators \
  --resource-group rg-fleet-emulators-tallahassee \
  --sku-name Standard_D8s_v3
```

## Cost Management

### Daily Cost Breakdown

- Container Instances: ~$29/day (10 pods)
- PostgreSQL: ~$8.80/day
- SignalR: ~$1.60/day
- Container Apps: ~$1.67-5/day
- Static Web App: ~$0.30/day
- **Total: ~$41-45/day**

### Cost Optimization Tips

1. **Use Azure Reserved Instances** (up to 72% savings)
2. **Scale down during off-hours** (50% savings)
3. **Use Spot Instances for emulators** (up to 90% savings)
4. **Reduce PostgreSQL tier** for testing
5. **Use SignalR Free tier** for development

### Scaling Down for Testing

```bash
# Stop all emulator pods
for i in {0..9}; do
  az container stop --name ci-emulator-pod-$i --resource-group <rg>
done

# Scale down PostgreSQL
az postgres flexible-server update \
  --sku-name Standard_B2s \
  --resource-group <rg>
```

## Security Considerations

### Secrets Management

All secrets are stored securely:
- Database passwords in Container secrets
- SignalR connection strings in Key Vault references
- ACR credentials managed by Azure

### Network Security

- PostgreSQL: Firewall rules restrict access
- SignalR: CORS configured for admin UI only
- Container Registry: Private, authenticated access
- Container Instances: No public ingress except health checks

### Best Practices

1. **Rotate secrets regularly** (every 90 days)
2. **Use managed identities** where possible
3. **Enable audit logging** in PostgreSQL
4. **Monitor failed authentication attempts**
5. **Keep container images updated**

## Maintenance Tasks

### Daily
- Monitor Application Insights for errors
- Check pod health status
- Verify telemetry data flow

### Weekly
- Review database size and retention
- Check compression policy effectiveness
- Analyze cost trends

### Monthly
- Update container images
- Review and optimize database queries
- Backup configuration files
- Test disaster recovery procedures

## Support and Resources

### Documentation
- Full README: `README.md`
- API Documentation: `<orchestrator-url>/api/docs`
- Database Schema: `database/schema.sql`

### Logs Location
- Agent Logs: `deploy/logs/agent*.log`
- Container Logs: Azure Portal or Azure CLI
- Application Insights: Azure Portal

### Contact
For deployment issues or questions:
- Email: fleet-support@tallahassee.gov
- Azure Support: Open ticket in Azure Portal
- Emergency: Check runbooks in `docs/runbooks/`

## Success Criteria

Your deployment is successful when:

- [ ] All 5 agents completed without errors
- [ ] All 10 emulator pods are running
- [ ] PostgreSQL contains vehicle data
- [ ] Orchestrator API responds to health checks
- [ ] Admin UI loads and displays vehicles
- [ ] Real-time telemetry updates visible in dashboard
- [ ] SignalR connection status shows "Connected"
- [ ] Can select vehicles and view mobile app screens

## Next Steps After Deployment

1. **Explore the Admin Dashboard**
   - View all 300 vehicles
   - Filter by department
   - Select vehicles to see mobile app

2. **Query the Database**
   - Connect with psql
   - Run sample queries
   - Export data for analysis

3. **Monitor Performance**
   - Check Application Insights
   - Review pod resource usage
   - Analyze database performance

4. **Customize Configuration**
   - Modify fleet composition
   - Adjust telemetry update frequency
   - Add custom routes

5. **Integrate with External Systems**
   - Connect to existing fleet management
   - Export data to BI tools
   - Set up alerting

## Appendix

### A. Environment Variables Reference

All environment variables saved in `deployment-config.env`:

```bash
RESOURCE_GROUP              # Azure resource group name
LOCATION                    # Azure region
ACR_LOGIN_SERVER           # Container registry URL
POSTGRES_HOST              # PostgreSQL server hostname
DATABASE_URL               # Full PostgreSQL connection string
SIGNALR_CONNECTION_STRING  # SignalR connection string
ORCHESTRATOR_URL           # Orchestrator API URL
ADMIN_UI_URL              # Admin dashboard URL
```

### B. Common Commands

```bash
# Restart all pods
for i in {0..9}; do
  az container restart --name ci-emulator-pod-$i --resource-group <rg>
done

# View all logs
for i in {0..9}; do
  az container logs --name ci-emulator-pod-$i --resource-group <rg>
done

# Check resource usage
az monitor metrics list \
  --resource <resource-id> \
  --metric-names "CPUUsage,MemoryUsage"
```

### C. Deployment Checklist

Print this checklist and check off items as you complete them:

- [ ] Prerequisites verified
- [ ] Azure login successful
- [ ] Subscription selected
- [ ] Fleet configuration reviewed
- [ ] Master deployment script executed
- [ ] Agent 1 completed (Infrastructure)
- [ ] Agent 2 completed (Database)
- [ ] Agent 3 completed (Emulators)
- [ ] Agent 4 completed (Orchestrator)
- [ ] Agent 5 completed (Admin UI)
- [ ] Verification script passed
- [ ] Admin dashboard accessible
- [ ] Telemetry data flowing
- [ ] Documentation reviewed
- [ ] Team notified of deployment
