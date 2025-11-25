# Fleet Management - Azure Cost Analysis

**Date**: November 25, 2025
**Analysis**: Current and Projected Monthly Costs

---

## 💰 Current Azure Resources Cost Breakdown

### Azure Kubernetes Service (AKS)
**Current Configuration**:
- **Cluster**: `fleet-aks-cluster`
- **Tier**: Free (Control Plane)
- **Node Count**: 4 nodes
- **VM Size**: Standard_D2s_v3
- **Region**: East US 2

**Monthly Cost Estimate**:
```
Control Plane: $0/month (Free tier)
Compute Nodes: 4 × Standard_D2s_v3

Standard_D2s_v3 Pricing (East US 2):
- Pay-as-you-go: ~$96.36/month per VM
- Total for 4 nodes: ~$385.44/month

If using 1-year Reserved Instances (40% savings):
- Reserved: ~$57.82/month per VM
- Total for 4 nodes: ~$231.28/month
```

### Azure Container Registry (ACR)
**Current Configuration**:
- **Registry**: `fleetappregistry`
- **SKU**: Basic
- **Storage**: < 10 GB (estimated)

**Monthly Cost**:
```
Basic SKU: $5.00/month (includes 10 GB storage)
Additional storage: $0.10/GB per month (if over 10 GB)

Estimated: $5.00 - $10.00/month
```

### Azure Static Web Apps (Frontend)
**Current Configuration**:
- **App**: Fleet frontend deployment
- **Tier**: Free (likely) or Standard

**Monthly Cost**:
```
Free Tier: $0/month
- 100 GB bandwidth
- Custom domains
- SSL certificates

Standard Tier: $9.00/month (if upgraded)
- 100 GB bandwidth included
- Additional bandwidth: $0.15/GB
```

### Azure DevOps
**Current Configuration**:
- **Organization**: CapitalTechAlliance
- **Pipelines**: 3 configured

**Monthly Cost**:
```
Free Tier Includes:
- 1 Microsoft-hosted CI/CD (1,800 minutes/month)
- Unlimited private repos
- 5 users

Additional Parallel Jobs (if needed):
- $40/month per additional Microsoft-hosted parallel job
- $15/month per additional self-hosted parallel job

Current usage: Free tier (likely sufficient)
Estimated: $0 - $40/month
```

---

## 📊 Total Monthly Cost Estimate

### Current Production Setup (Pay-as-you-go)
```
Component                        Monthly Cost
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AKS Control Plane (Free tier)    $0.00
AKS Compute (4 × D2s_v3)         $385.44
Azure Container Registry          $5.00
Static Web Apps (Free tier)       $0.00
Azure DevOps (Free tier)          $0.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL (Pay-as-you-go)            ~$390.44/month
```

### Optimized Setup (With Reserved Instances)
```
Component                        Monthly Cost
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AKS Control Plane (Free tier)    $0.00
AKS Compute (4 × D2s_v3 RI)      $231.28
Azure Container Registry          $5.00
Static Web Apps (Free tier)       $0.00
Azure DevOps (Free tier)          $0.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL (With Reserved Instances)  ~$236.28/month
```

---

## 💡 Cost Optimization Opportunities

### 1. Reduce AKS Node Count
**Current**: 4 nodes
**Recommendation**: Start with 2-3 nodes for non-production

```
Savings with 2 nodes:
- Pay-as-you-go: $192.72/month → ~$197.72/month total
- Reserved Instances: $115.64/month → ~$120.64/month total
- Annual savings: ~$2,300 - $3,200
```

### 2. Use Smaller VM Size for Development
**Current**: Standard_D2s_v3 (2 vCPU, 8 GB RAM)
**Alternative**: Standard_B2s (2 vCPU, 4 GB RAM) for dev/staging

```
Standard_B2s Pricing:
- Pay-as-you-go: ~$30.37/month per VM
- For 2 nodes: ~$60.74/month
- Savings vs. D2s_v3: ~$131.98/month
```

### 3. Use Azure Spot VMs (Development Only)
**Savings**: Up to 90% off pay-as-you-go pricing
**Risk**: VMs can be evicted with 30-second notice

```
Standard_D2s_v3 Spot:
- Estimated: ~$10-20/month per VM
- For 2 nodes: ~$20-40/month
- Savings: ~$345/month vs. pay-as-you-go
```

⚠️ **Not recommended for production**

### 4. Implement Auto-Scaling
Configure horizontal pod autoscaler (HPA) and cluster autoscaler:
- Scale down during off-hours (nights/weekends)
- Only pay for nodes when needed
- Potential savings: 30-50% if traffic is variable

### 5. Use Azure Dev/Test Pricing
If you have Visual Studio subscriptions:
- Dev/Test VMs: 40-55% discount
- Requires Azure Dev/Test subscription

---

## 🎯 Recommended Deployment Strategy by Environment

### Development Environment
```
AKS: 1 node × Standard_B2s
Cost: ~$30/month
Purpose: Testing and development
```

### Staging Environment
```
AKS: 2 nodes × Standard_D2s_v3
Cost: ~$193/month (pay-as-you-go)
Purpose: Pre-production validation
```

### Production Environment (Current)
```
AKS: 4 nodes × Standard_D2s_v3 (Free tier control plane)
Cost: ~$385/month (pay-as-you-go)
Cost: ~$231/month (with Reserved Instances)
Purpose: Live application
```

### Production Environment (Optimized)
```
AKS: 2-3 nodes × Standard_D2s_v3 with autoscaling
Reserved Instances: 1-year commitment
Cost: ~$115-173/month
Savings: ~$215-270/month vs. current pay-as-you-go
```

---

## 📉 Cost Reduction Action Plan

### Phase 1: Immediate (No Commitment)
1. **Right-size for workload**
   - Reduce to 2 nodes if traffic is low
   - Monitor performance for 1 week
   - Savings: ~$192/month

2. **Enable autoscaling**
   - Set min: 2 nodes, max: 4 nodes
   - Scale based on CPU/memory
   - Savings: ~$50-100/month (variable)

3. **Optimize ACR**
   - Clean up old/unused images
   - Keep only last 10 builds
   - Maintain Basic tier: $5/month

**Phase 1 Total Savings**: ~$242-292/month

### Phase 2: Medium-term (1-3 Month Commitment)
1. **Purchase Reserved Instances**
   - 1-year commitment for production nodes
   - Savings: ~$154/month for 4 nodes
   - Break-even: ~30 days

2. **Implement proper dev/staging split**
   - Dev: 1 × B2s (~$30/month)
   - Staging: 1 × D2s_v3 (~$96/month)
   - Production: 2 × D2s_v3 RI (~$115/month)
   - Total: ~$241/month (vs. $385 current)

**Phase 2 Total Savings**: ~$144/month

### Phase 3: Long-term Optimization
1. **Review and optimize regularly**
   - Monthly cost review
   - Quarterly capacity planning
   - Annual reserved instance renewal

2. **Consider Azure Hybrid Benefit**
   - If you have Windows Server licenses
   - Additional 40% savings on Windows VMs

---

## 💳 Current Monthly Bill Estimate

### What You're Paying Now
```
Azure Subscription: Azure subscription 1

Fleet Management Resources:
├─ AKS cluster (4 nodes)        ~$385.44/month
├─ Container Registry            $5.00/month
├─ Static Web App                $0.00/month
├─ Storage (minimal)             ~$2-5/month
├─ Bandwidth (estimated)         ~$5-10/month
└─ Azure DevOps                  $0.00/month

Estimated Total: $397 - $405/month
```

### Additional Costs to Consider
- **Database**: If using Azure Database (not detected)
- **Redis/Cache**: If using Azure Cache for Redis
- **Load Balancer**: Included with AKS
- **Public IPs**: ~$3.65/month per static IP
- **Azure Monitor**: Free tier or ~$2-10/month
- **Application Insights**: Free tier or ~$5-20/month based on ingestion

---

## 🎓 Cost Management Best Practices

### 1. Set Up Cost Alerts
```bash
az consumption budget create \
  --budget-name fleet-monthly-budget \
  --amount 500 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --resource-group fleet-production-rg
```

### 2. Use Azure Cost Management
- View costs: https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/overview
- Set up budgets and alerts
- Review cost recommendations

### 3. Tag Resources for Tracking
```bash
az resource tag \
  --tags Environment=Production Project=FleetManagement CostCenter=Engineering \
  --ids /subscriptions/.../resourceGroups/fleet-production-rg
```

### 4. Regular Reviews
- Weekly: Check cost trends
- Monthly: Review and optimize
- Quarterly: Evaluate reserved instance renewals

---

## 🔍 Cost Comparison: Cloud vs. On-Premises

### Cloud (Current Azure Setup)
**Monthly Cost**: ~$400/month
**Annual Cost**: ~$4,800/year

**Includes**:
- No upfront hardware cost
- Managed infrastructure
- Automatic updates
- Built-in redundancy
- Global availability
- Easy scaling

### On-Premises (Equivalent)
**Initial Investment**: ~$10,000-15,000
- Servers (2-4 physical machines)
- Networking equipment
- UPS/Power backup
- Cooling system
- Rack space

**Monthly Costs**: ~$300-500/month
- Power: ~$100-200/month
- Internet: ~$100-200/month
- Maintenance: ~$100-200/month
- IT staff time: Variable

**Break-even**: ~2-3 years

---

## ✅ Recommended Immediate Actions

### To Minimize Costs Right Now:

1. **Verify Current Usage**
   ```bash
   # Check actual node utilization
   kubectl top nodes

   # Check pod resource usage
   kubectl top pods -n fleet-management
   ```

2. **If Utilization < 50%**:
   - Scale down to 2 nodes
   - Implement autoscaling
   - Save ~$192/month immediately

3. **If This is Development**:
   - Consider shutting down after hours
   - Use Azure Automation to start/stop
   - Save ~60% of compute costs

4. **Review ACR**:
   ```bash
   # List image sizes
   az acr repository list --name fleetappregistry --output table

   # Clean up old images
   az acr repository delete --name fleetappregistry --image <old-image>
   ```

---

## 📊 Cost Forecast

### Conservative Estimate (Current Setup)
```
Month 1-3:  ~$400/month (pay-as-you-go)
Month 4-12: ~$240/month (after optimization + reserved instances)
Year 1:     ~$3,120 total
```

### Optimized Estimate (Following Recommendations)
```
Month 1-3:  ~$200/month (2 nodes, optimized)
Month 4-12: ~$150/month (reserved instances, autoscaling)
Year 1:     ~$1,950 total
Annual Savings: ~$1,170 vs. current
```

---

## 🎯 Summary

### Current State
- **Monthly Cost**: ~$390-405/month
- **Primary Cost**: AKS compute (4 nodes)
- **Optimization Potential**: ~50-60% reduction possible

### Quick Wins
1. Reduce to 2 nodes: **Save $192/month**
2. Enable autoscaling: **Save $50-100/month**
3. Buy reserved instances: **Save $154/month**

### Total Potential Savings
**Up to $346/month (86% reduction)**

### Recommended Next Step
Start with reducing node count and monitoring performance for 1 week. If performance is acceptable, purchase reserved instances for long-term savings.

---

**Cost Analysis Generated**: November 25, 2025
**Resources Analyzed**: AKS, ACR, Static Web Apps, Azure DevOps
**Status**: Current configuration costs ~$390-405/month
**Optimization Potential**: Can reduce to ~$150-240/month
