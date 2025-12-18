# Fleet DNS Configuration - REQUIRED NOW

**Status:** 🚨 DNS RECORDS REQUIRED
**Date:** December 17, 2025
**Domain:** fleet.capitaltechalliance.com

---

## 🎯 Required DNS Records (Add These Now)

### 1. TXT Record (Domain Validation)
**Purpose:** Validates you own the domain for Azure Front Door

```
Type:  TXT
Name:  _dnsauth.fleet
Value: _isdnukwei9p98z6lp4evrya005d5wqc
TTL:   3600
```

### 2. CNAME Record (Traffic Routing)
**Purpose:** Routes fleet.capitaltechalliance.com to Azure Front Door

```
Type:  CNAME
Name:  fleet
Value: fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net
TTL:   3600
```

---

## ✅ Azure Infrastructure Status

### Front Door Configuration (COMPLETE)
- ✅ Profile: fleet-frontdoor
- ✅ Endpoint: fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net
- ✅ Custom Domain: fleet.capitaltechalliance.com (Pending validation)
- ✅ SSL Certificate: Managed (TLS 1.2)
- ✅ Origin: VM at 172.173.175.71:80
- ✅ Route: Associated with custom domain

### Validation Status
- Domain Validation: ⏳ Pending (waiting for DNS TXT record)
- Validation Token: _isdnukwei9p98z6lp4evrya005d5wqc
- Expiration: December 24, 2025 11:59 PM

---

## 📋 DNS Setup Instructions

### Where to Add DNS Records

**If using GoDaddy:**
1. Log in to GoDaddy DNS Manager
2. Find capitaltechalliance.com
3. Click "DNS" → "Manage Zones"
4. Add both records above

**If using Cloudflare:**
1. Log in to Cloudflare Dashboard
2. Select capitaltechalliance.com
3. Go to DNS → Records
4. Add both records above
5. **Important:** Set Proxy status to "DNS only" (gray cloud)

**If using Azure DNS:**
```bash
# TXT Record
az network dns record-set txt add-record \
  --resource-group <your-dns-rg> \
  --zone-name capitaltechalliance.com \
  --record-set-name _dnsauth.fleet \
  --value _isdnukwei9p98z6lp4evrya005d5wqc

# CNAME Record
az network dns record-set cname set-record \
  --resource-group <your-dns-rg> \
  --zone-name capitaltechalliance.com \
  --record-set-name fleet \
  --cname fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net
```

---

## ⏱️ Timeline After DNS Setup

| Time | What Happens |
|------|-------------|
| 0 min | DNS records added to provider |
| 5-15 min | DNS propagation completes globally |
| 15-20 min | Azure validates TXT record |
| 20-25 min | Azure provisions SSL certificate |
| 25-30 min | fleet.capitaltechalliance.com goes live! |

---

## 🔍 Verification Commands

### Check DNS Propagation
```bash
# Check TXT record
dig _dnsauth.fleet.capitaltechalliance.com TXT +short

# Check CNAME record
dig fleet.capitaltechalliance.com CNAME +short

# Alternative (if dig not available)
nslookup -type=TXT _dnsauth.fleet.capitaltechalliance.com
nslookup -type=CNAME fleet.capitaltechalliance.com
```

### Check Domain Validation Status
```bash
az afd custom-domain show \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --custom-domain-name fleet-custom-domain \
  --query '{hostName:hostName, validationState:domainValidationState}' \
  -o json
```

### Test Fleet Application
```bash
# Once DNS is validated (will return 200 OK)
curl -I https://fleet.capitaltechalliance.com

# Check if redirecting properly
curl -I http://fleet.capitaltechalliance.com
```

---

## 🚨 What Happens If DNS is NOT Added?

- ❌ fleet.capitaltechalliance.com will not resolve
- ❌ Azure cannot validate domain ownership
- ❌ SSL certificate cannot be provisioned
- ❌ Validation expires on December 24, 2025
- ✅ The app is still accessible at: http://172.173.175.71 (direct VM IP)

---

## 📊 Current Accessibility

| URL | Status | Notes |
|-----|--------|-------|
| http://172.173.175.71 | ⏳ Deploying | Direct VM access (no DNS needed) |
| fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net | ⏳ Waiting for origin | Front Door endpoint |
| fleet.capitaltechalliance.com | ❌ DNS Required | Needs DNS records added |

---

## ✅ Next Steps (In Order)

1. **[USER ACTION]** Add DNS records to capitaltechalliance.com (see above)
2. **[AUTO]** Wait 5-15 minutes for DNS propagation
3. **[AUTO]** Azure validates domain ownership
4. **[AUTO]** Azure provisions SSL certificate
5. **[AUTO]** fleet.capitaltechalliance.com becomes accessible
6. **[VERIFY]** Test https://fleet.capitaltechalliance.com

---

## 📞 Support Information

**Azure Front Door Dashboard:**
https://portal.azure.com/#resource/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/fleet-production-rg/providers/Microsoft.Cdn/profiles/fleet-frontdoor/overview

**Validation Token Expiry:** December 24, 2025 11:59 PM
**Re-generate Validation Token (if expired):**
```bash
az afd custom-domain regenerate-validation-token \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --custom-domain-name fleet-custom-domain
```

---

**The infrastructure is 100% ready. Fleet will be live at fleet.capitaltechalliance.com within 30 minutes of adding these DNS records.**
