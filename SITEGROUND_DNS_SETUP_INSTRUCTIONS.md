# SiteGround DNS Configuration Instructions

## 🎯 Goal
Point fleet.capitaltechalliance.com to your production Fleet Management System

## 📋 Steps to Update DNS at SiteGround

### 1. Log in to SiteGround
- Go to: https://my.siteground.com
- Log in with your SiteGround credentials

### 2. Access DNS Zone Editor
- Click on "Websites"
- Select "capitaltechalliance.com"
- Click on "Site Tools"
- Go to: **Domain** → **DNS Zone Editor**

### 3. Find the "fleet" Record
- Look for existing record: **fleet.capitaltechalliance.com**
- It's currently a **CNAME** pointing to: `purple-cliff-0e45eb50f.3.azurestaticapps.net`

### 4. Delete the Old CNAME Record
- Click the **Delete** button next to fleet.capitaltechalliance.com
- Confirm deletion

### 5. Create New A Record
Click "Add New Record" and enter:

```
Name:  fleet
Type:  A
Points To: 20.15.65.2
TTL:   300 (5 minutes)
```

Click "Create"

### 6. Add Development Environment (Optional)
Click "Add New Record" again:

```
Name:  fleet-dev
Type:  A
Points To: 20.15.65.2
TTL:   300
```

### 7. Add Staging Environment (Optional)
Click "Add New Record" again:

```
Name:  fleet-staging
Type:  A
Points To: 20.15.65.2
TTL:   300
```

### 8. Save Changes
- SiteGround should save automatically
- DNS propagation: **5-15 minutes**

## ✅ Verification

After 5-15 minutes, test:

```bash
# Check DNS resolution
nslookup fleet.capitaltechalliance.com

# Should return: 20.15.65.2
```

Then open in browser:
- http://fleet.capitaltechalliance.com
- Should redirect to your Fleet Management System

## 🔒 SSL Certificate

Once DNS propagates (pointing to 20.15.65.2), Let's Encrypt will automatically issue an SSL certificate within a few minutes.

You'll then be able to access:
- **https://fleet.capitaltechalliance.com** (secure)

## ⚠️ Alternative: Switch to Azure DNS (Long-term Solution)

If you want Azure to manage ALL DNS for capitaltechalliance.com:

### At Your Domain Registrar:
1. Log in to where you registered the domain
2. Find "Nameserver Settings"
3. Change nameservers to Azure DNS:
   ```
   ns1-02.azure-dns.com
   ns2-02.azure-dns.net
   ns3-02.azure-dns.org
   ns4-02.azure-dns.info
   ```
4. Save changes

**Propagation:** 24-48 hours

**Benefit:** All DNS records managed in Azure portal

## 📞 Need Help?

If you encounter issues:
1. Clear your browser cache
2. Try incognito/private browsing
3. Use a different device
4. Wait the full 15 minutes for DNS propagation

## ✨ Once Complete

Your fleet system will be accessible at:
- ✅ http://68.220.148.2 (working now)
- ✅ https://fleet.capitaltechalliance.com (after DNS + SSL)

Both will work!
