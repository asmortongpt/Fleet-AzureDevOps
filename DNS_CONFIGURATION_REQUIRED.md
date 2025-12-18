# Fleet DNS Configuration - REQUIRED ACTION

**Status:** ✅ Azure Front Door Configured - DNS Setup Required
**Date:** December 17, 2025

---

## 🎯 Required DNS Records for capitaltechalliance.com

To make Fleet accessible at **fleet.capitaltechalliance.com**, add these DNS records:

### 1. TXT Record (Domain Validation)

```
Type: TXT
Name: _dnsauth.fleet
Value: _isdnukwei9p98z6lp4evrya005d5wqc
TTL: 3600
```

### 2. CNAME Record (Traffic Routing)

```
Type: CNAME
Name: fleet
Value: fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net
TTL: 3600
```

---

## 📋 Step-by-Step DNS Setup

### Option A: If you have access to capitaltechalliance.com DNS

1. Log into your DNS provider (GoDaddy, Cloudflare, Route53, etc.)
2. Navigate to DNS management for `capitaltechalliance.com`
3. Add the TXT record as shown above
4. Add the CNAME record as shown above
5. Wait 5-15 minutes for DNS propagation

### Option B: If someone else manages DNS

Send them this information:

```
Hi,

Please add these DNS records for capitaltechalliance.com:

**TXT Record:**
- Name: _dnsauth.fleet
- Value: _isdnukwei9p98z6lp4evrya005d5wqc

**CNAME Record:**
- Name: fleet
- Value: fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net

These records will route fleet.capitaltechalliance.com to our Azure-hosted
Fleet application with SSL certificate and CDN enabled.

Thanks!
```

---

## ✅ After DNS Records Are Added

### 1. Verify DNS Propagation

```bash
# Check TXT record
dig TXT _dnsauth.fleet.capitaltechalliance.com

# Check CNAME record
dig CNAME fleet.capitaltechalliance.com
```

### 2. Associate Custom Domain with Front Door Route

Once DNS has propagated (5-15 minutes), run this command:

```bash
az afd route update \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --endpoint-name fleet-endpoint \
  --route-name default-route \
  --custom-domains fleet-custom-domain
```

### 3. Enable HTTPS Redirect (Optional but Recommended)

```bash
az afd route update \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --endpoint-name fleet-endpoint \
  --route-name default-route \
  --https-redirect Enabled \
  --forwarding-protocol HttpsOnly
```

---

## 🌐 Current Access URLs

### Temporary Access (Works Now)
- **Direct VM:** http://172.173.175.71
- **Front Door (Default):** http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net

### Production URL (After DNS Setup)
- **Custom Domain:** https://fleet.capitaltechalliance.com

---

## 🏗️ Infrastructure Architecture

```
DNS: fleet.capitaltechalliance.com
  ↓ CNAME
Azure Front Door: fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net
  ↓ (CDN + SSL + WAF)
Origin: 172.173.175.71 (Azure VM)
  ↓ Docker Compose Stack
  ├─ PostgreSQL (port 5432)
  ├─ Redis (port 6379)
  ├─ API Server (port 3000)
  ├─ Frontend (port 80)
  ├─ Prometheus (port 9090)
  └─ Grafana (port 3001)
```

---

## 🔐 Security Features

- **Managed SSL Certificate:** Auto-provisioned by Azure (TLS 1.2)
- **CDN:** Global content delivery via Azure Front Door
- **Health Probes:** Front Door monitors `/api/health` endpoint
- **Load Balancing:** Automatic failover if VM becomes unhealthy
- **WAF (Web Application Firewall):** Protection against common threats

---

## 📊 Expected Timeline

| Step | Duration | Status |
|------|----------|--------|
| Azure Front Door Setup | 5 min | ✅ Complete |
| VM Deployment (Docker Compose) | 10 min | 🔄 In Progress |
| DNS Configuration | 5 min | ⏳ **Action Required** |
| DNS Propagation | 5-15 min | ⏳ Waiting for DNS |
| SSL Certificate Provisioning | 10-30 min | ⏳ After DNS validates |
| **Total Time to Production** | **35-60 min** | 60% Complete |

---

## 🆘 Troubleshooting

### DNS Not Propagating?

```bash
# Check DNS from different servers
nslookup fleet.capitaltechalliance.com 8.8.8.8
nslookup fleet.capitaltechalliance.com 1.1.1.1
```

### SSL Certificate Not Provisioning?

```bash
# Check custom domain status
az afd custom-domain show \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --custom-domain-name fleet-custom-domain \
  --query '{validation:domainValidationState,provisioning:provisioningState}'
```

### Application Not Loading?

```bash
# Test VM directly
curl http://172.173.175.71

# Test Front Door default endpoint
curl http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net

# Check origin health
az afd origin show \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --origin-group-name fleet-origins \
  --origin-name fleet-vm
```

---

## 📞 Azure Resources Created

- **Front Door Profile:** fleet-frontdoor
- **Endpoint:** fleet-endpoint
- **Origin Group:** fleet-origins
- **Origin:** fleet-vm (172.173.175.71)
- **Custom Domain:** fleet-custom-domain
- **Route:** default-route
- **Resource Group:** fleet-production-rg

---

## ✅ Success Criteria

Once DNS is configured, you should be able to:

1. Visit https://fleet.capitaltechalliance.com
2. See valid SSL certificate (green padlock)
3. Access all Fleet features:
   - ✅ Frontend dashboard
   - ✅ API endpoints
   - ✅ 50+ lazy-loaded modules
   - ✅ 104 AI agents
   - ✅ Real-time telemetry
   - ✅ Monitoring dashboards

---

**🤖 Generated with Claude Code**
**Co-Authored-By:** Claude <noreply@anthropic.com>

**Next Action:** Add DNS records above to capitaltechalliance.com DNS settings
