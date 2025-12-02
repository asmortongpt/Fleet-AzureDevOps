# DNS Configuration Guide for Fleet Management System

**Date:** 2025-11-09
**Status:** READY TO CONFIGURE
**Time Required:** 10-15 minutes

---

## Overview

This guide provides DNS configuration instructions for all Fleet Management System environments hosted on Azure Kubernetes Service.

**All environments share the same NGINX Ingress Controller IP address.**

---

## DNS Records to Configure

### Shared Ingress IP Address
```
20.15.65.2
```

### A Records to Create

Add these A records in your DNS provider (e.g., GoDaddy, Cloudflare, Azure DNS, etc.):

| **Record Type** | **Hostname** | **Points To (IP)** | **Environment** | **TTL** |
|-----------------|--------------|-------------------|-----------------|---------|
| A | fleet.capitaltechalliance.com | 20.15.65.2 | Production | 300 |
| A | fleet-dev.capitaltechalliance.com | 20.15.65.2 | Development | 300 |
| A | fleet-staging.capitaltechalliance.com | 20.15.65.2 | Staging | 300 |

---

## Step-by-Step: Azure DNS Zone (If Using Azure)

### Option A: Using Azure Portal

1. **Navigate to Azure DNS Zones:**
   ```
   https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FdnsZones
   ```

2. **Select your DNS zone:**
   - Click on `capitaltechalliance.com`

3. **Add Production A Record:**
   - Click **"+ Record set"**
   - Name: `fleet`
   - Type: `A`
   - TTL: `300`
   - TTL unit: `Seconds`
   - IP address: `20.15.65.2`
   - Click **OK**

4. **Add Development A Record:**
   - Click **"+ Record set"**
   - Name: `fleet-dev`
   - Type: `A`
   - TTL: `300`
   - TTL unit: `Seconds`
   - IP address: `20.15.65.2`
   - Click **OK**

5. **Add Staging A Record:**
   - Click **"+ Record set"**
   - Name: `fleet-staging`
   - Type: `A`
   - TTL: `300`
   - TTL unit: `Seconds`
   - IP address: `20.15.65.2`
   - Click **OK**

6. **Verify Records:**
   - You should see all three records in the DNS zone
   - Each pointing to `20.15.65.2`

### Option B: Using Azure CLI

```bash
# Set your resource group and DNS zone name
RG="your-dns-resource-group"
ZONE="capitaltechalliance.com"
IP="20.15.65.2"

# Add production record
az network dns record-set a add-record \
  --resource-group $RG \
  --zone-name $ZONE \
  --record-set-name fleet \
  --ipv4-address $IP \
  --ttl 300

# Add development record
az network dns record-set a add-record \
  --resource-group $RG \
  --zone-name $ZONE \
  --record-set-name fleet-dev \
  --ipv4-address $IP \
  --ttl 300

# Add staging record
az network dns record-set a add-record \
  --resource-group $RG \
  --zone-name $ZONE \
  --record-set-name fleet-staging \
  --ipv4-address $IP \
  --ttl 300
```

---

## Step-by-Step: Other DNS Providers

### GoDaddy

1. Log in to GoDaddy
2. Go to **My Products** → **DNS**
3. Click **Manage** next to capitaltechalliance.com
4. Click **Add** for each record:
   - Type: `A`
   - Name: `fleet`, `fleet-dev`, `fleet-staging`
   - Value: `20.15.65.2`
   - TTL: `300 seconds`

### Cloudflare

1. Log in to Cloudflare
2. Select `capitaltechalliance.com` domain
3. Go to **DNS** tab
4. Click **Add record** for each:
   - Type: `A`
   - Name: `fleet`, `fleet-dev`, `fleet-staging`
   - IPv4 address: `20.15.65.2`
   - TTL: `Auto` or `5 min`
   - Proxy status: `DNS only` (gray cloud)

### Google Domains

1. Log in to Google Domains
2. Select `capitaltechalliance.com`
3. Go to **DNS** tab
4. Click **Manage custom records**
5. Add each record:
   - Host name: `fleet`, `fleet-dev`, `fleet-staging`
   - Type: `A`
   - TTL: `300`
   - Data: `20.15.65.2`

### Namecheap

1. Log in to Namecheap
2. Go to **Domain List**
3. Click **Manage** next to capitaltechalliance.com
4. Go to **Advanced DNS** tab
5. Click **Add New Record** for each:
   - Type: `A Record`
   - Host: `fleet`, `fleet-dev`, `fleet-staging`
   - Value: `20.15.65.2`
   - TTL: `Automatic` or `5 min`

---

## Verification

### 1. Wait for DNS Propagation

DNS changes typically take:
- **Azure DNS:** 1-5 minutes
- **Most providers:** 5-15 minutes
- **Full global propagation:** Up to 48 hours (rare)

### 2. Test DNS Resolution

Use `nslookup` or `dig` to verify:

```bash
# Test production
nslookup fleet.capitaltechalliance.com

# Test development
nslookup fleet-dev.capitaltechalliance.com

# Test staging
nslookup fleet-staging.capitaltechalliance.com
```

**Expected output for each:**
```
Server:  [your DNS server]
Address: [your DNS server IP]

Name:    fleet.capitaltechalliance.com
Address: 20.15.65.2
```

### 3. Test HTTPS Access

Once DNS propagates, test HTTPS access:

```bash
# Production
curl -I https://fleet.capitaltechalliance.com/api/health

# Development
curl -I https://fleet-dev.capitaltechalliance.com/api/health

# Staging
curl -I https://fleet-staging.capitaltechalliance.com/api/health
```

**Expected:** `HTTP/1.1 200 OK` or similar success response

### 4. Test in Browser

Open each URL in your browser:
- https://fleet.capitaltechalliance.com
- https://fleet-dev.capitaltechalliance.com
- https://fleet-staging.capitaltechalliance.com

**Expected:** Fleet Management System login page with valid SSL certificate

---

## SSL/TLS Certificates

### Automatic Certificate Issuance

The system uses **cert-manager** with **Let's Encrypt** for automatic SSL certificates.

**What happens automatically:**

1. **DNS Challenge:** cert-manager detects the ingress configuration
2. **Certificate Request:** cert-manager requests SSL cert from Let's Encrypt
3. **Verification:** Let's Encrypt verifies domain ownership via HTTP-01 challenge
4. **Certificate Issuance:** Certificate issued and stored as Kubernetes secret
5. **Auto-Renewal:** Certificates automatically renewed before expiry (90 days)

**Verify Certificates:**

```bash
# Check certificate status - production
kubectl get certificate -n fleet-management

# Check certificate status - dev
kubectl get certificate -n fleet-management-dev

# Check certificate status - staging
kubectl get certificate -n fleet-management-staging
```

**Expected output:**
```
NAME            READY   SECRET          AGE
fleet-tls-cert  True    fleet-tls-cert  4h
```

---

## Troubleshooting

### Issue: DNS not resolving

**Check 1:** Verify A record exists
```bash
nslookup fleet.capitaltechalliance.com
```

**Check 2:** Check DNS provider's DNS servers
```bash
dig fleet.capitaltechalliance.com +trace
```

**Check 3:** Wait longer (up to 48 hours for full propagation)

### Issue: Certificate not issuing

**Check 1:** Verify DNS is resolving to correct IP
```bash
nslookup fleet.capitaltechalliance.com
# Must return: 20.15.65.2
```

**Check 2:** Check cert-manager logs
```bash
kubectl logs -n cert-manager -l app=cert-manager
```

**Check 3:** Check certificate request status
```bash
kubectl describe certificaterequest -n fleet-management
```

**Check 4:** Verify HTTP-01 challenge is accessible
```bash
curl http://fleet.capitaltechalliance.com/.well-known/acme-challenge/test
```

### Issue: Wrong environment loading

**Cause:** All domains point to same IP, NGINX routes based on hostname

**Solution:** Verify ingress configuration:
```bash
kubectl get ingress --all-namespaces -o yaml | grep -A 5 "host:"
```

**Expected:** Each environment should have unique hostname

### Issue: SSL certificate warning in browser

**Check 1:** Wait for certificate issuance (can take 5-10 minutes)

**Check 2:** Force-refresh browser cache (Ctrl+Shift+R or Cmd+Shift+R)

**Check 3:** Verify certificate exists:
```bash
kubectl get secret fleet-tls-cert -n fleet-management -o yaml
```

---

## Environment URLs After DNS Configuration

Once DNS is configured and certificates issued:

| **Environment** | **URL** | **Purpose** | **Access** |
|-----------------|---------|-------------|------------|
| **Production** | https://fleet.capitaltechalliance.com | Live production system | Core team only |
| **Development** | https://fleet-dev.capitaltechalliance.com | Development and testing | Himanshu + core team |
| **Staging** | https://fleet-staging.capitaltechalliance.com | Pre-production testing | Read-only for vendors |

---

## Current Status

### Infrastructure Status

✅ **AKS Cluster:** Running with 5 nodes
✅ **NGINX Ingress Controller:** Deployed at 20.15.65.2
✅ **cert-manager:** Installed and configured
✅ **Let's Encrypt ClusterIssuer:** Configured for production
✅ **Kubernetes Ingress:** Configured for all 3 environments
✅ **PostgreSQL:** Running in all environments
✅ **Redis:** Running in all environments
✅ **Applications:** Deployed to all environments
✅ **Databases:** Seeded with test data

### What Still Needs Manual Action

⚠️ **DNS A Records:** Need to be added (this guide)
⚠️ **Certificate Propagation:** Will happen automatically after DNS
⏱️ **Wait Time:** 5-15 minutes after DNS configuration

---

## Quick Reference

### DNS Configuration Summary

```
Record Type: A
TTL: 300 seconds

fleet.capitaltechalliance.com          → 20.15.65.2
fleet-dev.capitaltechalliance.com      → 20.15.65.2
fleet-staging.capitaltechalliance.com  → 20.15.65.2
```

### Verification Commands

```bash
# Test DNS
nslookup fleet.capitaltechalliance.com

# Test HTTPS
curl -I https://fleet.capitaltechalliance.com/api/health

# Check certificates
kubectl get certificate --all-namespaces
```

---

## Next Steps After DNS Configuration

1. **Wait 5-15 minutes** for DNS propagation
2. **Verify DNS resolution** using nslookup
3. **Wait 5-10 minutes** for SSL certificates to issue
4. **Test HTTPS access** in browser
5. **Notify team members** that environments are ready
6. **Send Himanshu onboarding email** with access details

---

**Last Updated:** 2025-11-09
**Created By:** Fleet Management System Setup
**Ingress IP:** 20.15.65.2
**Certificate Provider:** Let's Encrypt
