# Azure Pipelines Deployment Checklist

Use this checklist to ensure a successful deployment of the Azure Pipelines CI/CD pipeline.

## Pre-Deployment Checklist

### ✅ Files Created
- [x] `azure-pipelines.yml` - Main pipeline file
- [x] `azure-pipelines/templates/lint-template.yml`
- [x] `azure-pipelines/templates/test-template.yml`
- [x] `azure-pipelines/templates/build-template.yml`
- [x] `azure-pipelines/templates/docker-template.yml`
- [x] `azure-pipelines/templates/security-template.yml`
- [x] `azure-pipelines/templates/deploy-template.yml`
- [x] `azure-pipelines/templates/smoke-test-template.yml`
- [x] `azure-pipelines/templates/rollback-template.yml`
- [x] `azure-pipelines/examples/service-connections.json`
- [x] `azure-pipelines/examples/variable-groups.json`
- [x] `azure-pipelines/validate-pipeline.sh`
- [x] `AZURE_PIPELINES_MIGRATION.md`
- [x] `AZURE_PIPELINES_SETUP.md`
- [x] `GITHUB_ACTIONS_VS_AZURE_PIPELINES.md`
- [x] `AZURE_PIPELINES_SUMMARY.md`

### ✅ Documentation Review
- [ ] Read `AZURE_PIPELINES_SUMMARY.md` (Executive overview)
- [ ] Read `AZURE_PIPELINES_SETUP.md` (Detailed setup)
- [ ] Read `AZURE_PIPELINES_MIGRATION.md` (Migration guide)
- [ ] Review `azure-pipelines/README.md` (Template documentation)

---

## Azure Resources Setup

### Step 1: Azure Subscription
- [ ] Have Azure subscription access
- [ ] Subscription ID: `_______________________`
- [ ] Have Contributor or Owner role

### Step 2: Azure Container Registry (ACR)
```bash
ACR_NAME="fleetacr"
RESOURCE_GROUP="fleet-management-rg"
LOCATION="eastus"

az group create --name $RESOURCE_GROUP --location $LOCATION
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Standard --admin-enabled true
```

- [ ] ACR created: `fleetacr.azurecr.io`
- [ ] Admin user enabled
- [ ] Credentials saved

### Step 3: Azure Kubernetes Service (AKS)
```bash
AKS_CLUSTER="fleet-aks-cluster"

az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --attach-acr $ACR_NAME
```

- [ ] AKS cluster created
- [ ] ACR attached to AKS
- [ ] kubectl configured: `az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER`
- [ ] Nodes verified: `kubectl get nodes`

### Step 4: Azure Key Vault
```bash
KEYVAULT_NAME="fleet-keyvault"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

- [ ] Key Vault created
- [ ] Secrets added (see below)

### Step 5: Key Vault Secrets
```bash
az keyvault secret set --vault-name fleet-keyvault --name DATABASE-URL --value "postgresql://..."
az keyvault secret set --vault-name fleet-keyvault --name JWT-SECRET --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name fleet-keyvault --name AZURE-MAPS-KEY --value "your-key"
az keyvault secret set --vault-name fleet-keyvault --name OPENAI-API-KEY --value "sk-proj-..."
az keyvault secret set --vault-name fleet-keyvault --name ANTHROPIC-API-KEY --value "sk-ant-..."
```

- [ ] DATABASE-URL secret added
- [ ] JWT-SECRET secret added
- [ ] AZURE-MAPS-KEY secret added
- [ ] OPENAI-API-KEY secret added
- [ ] ANTHROPIC-API-KEY secret added

### Step 6: Kubernetes Namespace
```bash
kubectl create namespace fleet-management
kubectl create secret docker-registry acr-secret \
  --docker-server=fleetacr.azurecr.io \
  --docker-username=$(az acr credential show --name fleetacr --query username -o tsv) \
  --docker-password=$(az acr credential show --name fleetacr --query passwords[0].value -o tsv) \
  --namespace=fleet-management
```

- [ ] Namespace `fleet-management` created
- [ ] ACR pull secret created

---

## Azure DevOps Setup

### Step 1: Organization & Project
- [ ] Azure DevOps organization created
- [ ] Organization URL: `https://dev.azure.com/_____________`
- [ ] Project created: `Fleet Management`
- [ ] Git repository initialized or connected

### Step 2: Service Connections

#### 2.1 ACR Connection
**Path**: Project Settings → Service connections → New service connection

- [ ] Type: Docker Registry → Azure Container Registry
- [ ] Name: `fleet-acr-connection`
- [ ] Subscription: Selected
- [ ] Registry: `fleetacr`
- [ ] Grant access to all pipelines: ✅
- [ ] Connection created and authorized

#### 2.2 Azure Subscription Connection
- [ ] Type: Azure Resource Manager → Service principal (automatic)
- [ ] Name: `fleet-azure-subscription`
- [ ] Subscription: Selected
- [ ] Resource group: `fleet-management-rg` (or all)
- [ ] Grant access to all pipelines: ✅
- [ ] Connection created and authorized

#### 2.3 Kubernetes Connection
- [ ] Type: Kubernetes → Azure Subscription
- [ ] Name: `fleet-aks-connection`
- [ ] Azure subscription: `fleet-azure-subscription`
- [ ] Cluster: `fleet-aks-cluster`
- [ ] Namespace: `fleet-management`
- [ ] Grant access to all pipelines: ✅
- [ ] Connection created and authorized

### Step 3: Variable Groups

#### 3.1 Create `fleet-production-vars`
**Path**: Pipelines → Library → + Variable group

- [ ] Name: `fleet-production-vars`
- [ ] Variables added:
  - [ ] `nodeVersion` = `20.x`
  - [ ] `registryName` = `fleetacr`
  - [ ] `registryLoginServer` = `fleetacr.azurecr.io`
  - [ ] `aksCluster` = `fleet-aks-cluster`
  - [ ] `aksResourceGroup` = `fleet-management-rg`
  - [ ] `namespace` = `fleet-management`
  - [ ] `productionUrl` = `https://fleet.capitaltechalliance.com`
- [ ] Variable group saved

#### 3.2 Create `fleet-secrets` (Key Vault Linked)
- [ ] Name: `fleet-secrets`
- [ ] Link to Azure Key Vault: ✅
- [ ] Azure subscription: `fleet-azure-subscription`
- [ ] Key Vault: `fleet-keyvault`
- [ ] Authorized
- [ ] Secrets added:
  - [ ] `DATABASE-URL`
  - [ ] `JWT-SECRET`
  - [ ] `AZURE-MAPS-KEY`
  - [ ] `OPENAI-API-KEY`
  - [ ] `ANTHROPIC-API-KEY`
- [ ] Variable group saved

### Step 4: Grant Key Vault Access
```bash
# Get service principal ID from service connection
# Then run:
az keyvault set-policy \
  --name fleet-keyvault \
  --spn <service-principal-id> \
  --secret-permissions get list
```

- [ ] Key Vault access policy configured
- [ ] Service principal has get/list permissions

### Step 5: Create Environment
**Path**: Pipelines → Environments → New environment

- [ ] Name: `fleet-production`
- [ ] Resource: None
- [ ] Environment created

#### 5.1 Configure Approvals (Optional)
- [ ] Approvals configured
- [ ] Approvers added
- [ ] Timeout set (e.g., 30 days)

---

## Pipeline Configuration

### Step 1: Validate Pipeline Locally
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('azure-pipelines.yml'))"

# Run validation script
./azure-pipelines/validate-pipeline.sh
```

- [ ] YAML syntax valid
- [ ] All templates validated
- [ ] No errors in validation script

### Step 2: Push Code to Azure Repos (or connect GitHub)

**Option A: Azure Repos**
```bash
git remote add azure https://dev.azure.com/your-org/fleet-management/_git/Fleet
git push azure main
```

**Option B: GitHub Connection**
- [ ] GitHub repository connected
- [ ] Azure Pipelines app installed on GitHub
- [ ] Repository selected

- [ ] Code pushed/connected

### Step 3: Create Pipeline
**Path**: Pipelines → Pipelines → New pipeline

- [ ] Repository source selected
- [ ] Repository: `Fleet`
- [ ] Existing YAML file selected
- [ ] Path: `/azure-pipelines.yml`
- [ ] Pipeline reviewed
- [ ] Pipeline saved (not run yet)

### Step 4: Configure Pipeline Settings
**Path**: Pipeline → Edit → ... (three dots) → Settings

- [ ] Build number format: `$(Date:yyyyMMdd)$(Rev:.r)`
- [ ] YAML file path: `azure-pipelines.yml`
- [ ] Default branch: `main`
- [ ] Allow scripts to access OAuth token: ✅
- [ ] Settings saved

---

## Testing & Validation

### Step 1: Test Pipeline Run
- [ ] Pipeline manually triggered
- [ ] Stages monitored:
  - [ ] Lint stage passed
  - [ ] Test stage passed
  - [ ] Build stage passed
  - [ ] Docker stage passed (main/develop only)
  - [ ] Security stage passed
  - [ ] Deploy stage passed (main only)
  - [ ] Smoke test stage passed
- [ ] Pipeline completed successfully

### Step 2: Verify Artifacts
- [ ] Lint results published
- [ ] Test results visible in UI
- [ ] Coverage report generated
- [ ] Frontend build artifacts published
- [ ] API build artifacts published
- [ ] SBOM reports published
- [ ] Security scan results available

### Step 3: Verify Deployment
```bash
# Connect to AKS
az aks get-credentials --resource-group fleet-management-rg --name fleet-aks-cluster

# Check deployments
kubectl get pods -n fleet-management
kubectl get services -n fleet-management
kubectl get ingress -n fleet-management

# Check logs
kubectl logs -n fleet-management deployment/fleet-api --tail=50
kubectl logs -n fleet-management deployment/fleet-frontend --tail=50
```

- [ ] Pods running
- [ ] Services created
- [ ] Ingress configured
- [ ] No errors in logs

### Step 4: Test Endpoints
```bash
# Test API
curl https://fleet.capitaltechalliance.com/api/health

# Test Frontend
curl https://fleet.capitaltechalliance.com/

# Test authentication
curl -X POST https://fleet.capitaltechalliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

- [ ] API health endpoint returns 200
- [ ] Frontend loads (200)
- [ ] Auth endpoint responds (401 expected)
- [ ] All endpoints accessible

### Step 5: Test Rollback (Simulate Failure)
- [ ] Create test branch with intentional error
- [ ] Run pipeline
- [ ] Smoke tests fail
- [ ] Rollback stage triggered
- [ ] Previous version restored
- [ ] Services still functional

---

## Production Deployment

### Step 1: Branch Protection
**Path**: Repos → Branches → main → Branch policies

- [ ] Require pull request review
- [ ] Minimum reviewers: 2
- [ ] Build validation: Fleet Management CI/CD
- [ ] Policy requirement: Required
- [ ] Policies saved

### Step 2: Configure Notifications
**Path**: Project Settings → Notifications

- [ ] Email notifications configured
- [ ] Build failure alerts set up
- [ ] Deployment notifications configured
- [ ] Team notified

### Step 3: Documentation Updates
- [ ] Team onboarding docs updated
- [ ] README updated with Azure Pipelines info
- [ ] Runbook created for common issues
- [ ] Emergency contacts documented

### Step 4: Monitoring Setup
- [ ] Application Insights configured
- [ ] Azure Monitor alerts created
- [ ] Dashboard created for metrics
- [ ] Log aggregation configured

---

## Post-Deployment

### Day 1
- [ ] Monitor first production deployment
- [ ] Check logs for errors
- [ ] Verify all services running
- [ ] Test critical user flows

### Week 1
- [ ] Run pipeline 5+ times successfully
- [ ] Test PR validation
- [ ] Verify approval gates working
- [ ] Collect team feedback

### Week 2
- [ ] Review pipeline performance
- [ ] Identify optimization opportunities
- [ ] Update documentation based on issues
- [ ] Train team members

### Month 1
- [ ] Conduct post-deployment review
- [ ] Document lessons learned
- [ ] Optimize build times
- [ ] Review and rotate secrets
- [ ] Consider cost optimizations

---

## Cleanup (Optional)

### Disable GitHub Actions (if no longer needed)
- [ ] Disable GitHub Actions workflow
- [ ] Keep workflow file for reference
- [ ] Update repository README
- [ ] Notify team of change

---

## Troubleshooting

### Common Issues

#### Pipeline fails at validation
```bash
# Run validation locally
./azure-pipelines/validate-pipeline.sh
```

#### Service connection fails
- Verify service principal permissions
- Re-authorize connection
- Check Azure subscription status

#### Key Vault access denied
```bash
# Grant access to service principal
az keyvault set-policy --name fleet-keyvault --spn <sp-id> --secret-permissions get list
```

#### Docker image push fails
- Verify ACR connection
- Check ACR credentials
- Ensure admin user enabled

#### AKS deployment fails
- Check AKS cluster status
- Verify kubectl connectivity
- Check namespace exists
- Review pod logs

---

## Support Resources

### Documentation
- [ ] `AZURE_PIPELINES_SUMMARY.md` - Overview
- [ ] `AZURE_PIPELINES_SETUP.md` - Detailed setup
- [ ] `AZURE_PIPELINES_MIGRATION.md` - Migration guide
- [ ] `GITHUB_ACTIONS_VS_AZURE_PIPELINES.md` - Comparison

### External Resources
- Azure Pipelines: https://docs.microsoft.com/en-us/azure/devops/pipelines/
- YAML Schema: https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema
- Service Connections: https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints

### Getting Help
- Check troubleshooting sections in docs
- Review pipeline logs in Azure DevOps
- Contact DevOps team
- Azure Support (paid plans)

---

## Success Criteria

### ✅ Deployment Successful When:
- [ ] All Azure resources created
- [ ] All service connections working
- [ ] All variable groups configured
- [ ] Pipeline runs successfully
- [ ] All stages complete without errors
- [ ] Deployment to AKS successful
- [ ] Smoke tests pass
- [ ] Rollback tested and working
- [ ] Production accessible
- [ ] Monitoring configured
- [ ] Team trained

---

## Sign-Off

### Checklist Completed By
- **Name**: _______________________
- **Date**: _______________________
- **Role**: _______________________

### Reviewed By
- **Name**: _______________________
- **Date**: _______________________
- **Role**: _______________________

### Production Approval
- **Name**: _______________________
- **Date**: _______________________
- **Role**: _______________________

---

**Last Updated**: 2025-11-20
**Version**: 1.0.0
**Status**: Ready for Deployment
