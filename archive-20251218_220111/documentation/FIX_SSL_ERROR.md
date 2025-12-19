# Fix SSL Error for fleet.capitaltechalliance.com

## Problem Diagnosis

You're getting `ERR_SSL_PROTOCOL_ERROR` because:
- ✅ Your app is deployed and HTTP works
- ❌ SSL certificate is not configured
- ❌ HTTPS is trying to connect but no certificate exists

## Quick Fix Options

### Option 1: Disable HTTPS Temporarily (Access Now)

**Use HTTP instead:**
```
http://fleet.capitaltechalliance.com
```

This will work immediately while you set up SSL.

---

### Option 2: Set Up Free SSL with Cloudflare (10 minutes - RECOMMENDED)

**Easiest and free SSL solution:**

1. **Sign up for Cloudflare:**
   - Go to https://www.cloudflare.com/
   - Create free account
   - Add your domain: `capitaltechalliance.com`

2. **Update your DNS nameservers:**
   - Cloudflare will give you 2 nameservers
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Replace existing nameservers with Cloudflare's
   - Example:
     ```
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```

3. **Configure DNS in Cloudflare:**
   ```
   Type: A
   Name: fleet
   Content: [Your server IP - see below]
   Proxy: ON (orange cloud)
   ```

4. **Enable SSL:**
   - In Cloudflare: SSL/TLS → Overview
   - Select: **"Full (strict)"** or **"Flexible"**
   - Done! HTTPS will work in 5 minutes

**Benefits:**
- ✅ Free SSL certificate
- ✅ Automatic renewal
- ✅ CDN (faster loading)
- ✅ DDoS protection
- ✅ Works in 10 minutes

---

### Option 3: Set Up Let's Encrypt (If Using Kubernetes)

Your repo has Kubernetes configs. If deployed on K8s:

```bash
# Run the setup script:
cd /home/user/Fleet
chmod +x scripts/setup-custom-domain.sh
./scripts/setup-custom-domain.sh fleet.capitaltechalliance.com api.fleet.capitaltechalliance.com
```

This will:
- Install cert-manager
- Request Let's Encrypt certificate
- Configure automatic renewal

---

### Option 4: Manual SSL Certificate (Traditional Hosting)

If on traditional hosting (VPS, cPanel, etc.):

**Using Certbot:**
```bash
# SSH into your server

# Install Certbot:
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate:
sudo certbot --nginx -d fleet.capitaltechalliance.com

# Follow prompts - certificate installs automatically
```

---

## What's Your Hosting Setup?

To give you the exact fix, I need to know:

### Quick Check:
```bash
# Find your server IP:
dig fleet.capitaltechalliance.com +short
# or
nslookup fleet.capitaltechalliance.com
```

**Then tell me:**
1. **Hosting provider?** (AWS, GCP, DigitalOcean, SiteGround, etc.)
2. **Setup type?** (Kubernetes, Docker, VPS, Shared hosting, etc.)
3. **Do you have server access?** (SSH, kubectl, etc.)

---

## Immediate Workaround (While Fixing SSL)

### For Testing Right Now:

**Access via HTTP:**
```
http://fleet.capitaltechalliance.com
```

**Or use localhost if you have the code:**
```bash
cd /home/user/Fleet
npm run dev
# Access at http://localhost:5173
```

---

## Most Common Solution: Cloudflare (My Recommendation)

Since you have `capitaltechalliance.com`, the fastest fix is:

### Step-by-Step Cloudflare Setup:

1. **Sign up:** https://dash.cloudflare.com/sign-up
2. **Add site:** Enter `capitaltechalliance.com`
3. **Choose plan:** Free ($0)
4. **Review DNS:** Cloudflare auto-detects your records
5. **Update nameservers:**
   - Go to your domain registrar
   - Find "Nameservers" or "DNS Management"
   - Change to Cloudflare's nameservers (they'll show you)
6. **Wait 5-60 minutes** for DNS propagation
7. **Enable SSL:**
   - SSL/TLS tab → Overview
   - Choose "Flexible" (easiest) or "Full"
8. **Done!** HTTPS works automatically

**Total time:** 10-15 minutes
**Cost:** $0 (free)
**Maintenance:** None (auto-renews)

---

## Check Your Current Setup

Run these to see what you have:

```bash
# Check if you have Kubernetes:
kubectl version

# Check if you have nginx:
nginx -v

# Check if you have a web server:
systemctl status nginx
# or
systemctl status apache2

# Find your server IP:
curl ifconfig.me
```

---

## Need Help?

Tell me:
1. Your hosting setup (K8s, VPS, shared hosting?)
2. Do you have SSH access?
3. What's your server IP? (from `dig fleet.capitaltechalliance.com`)

I'll give you the exact commands to run!

For now, use: **http://fleet.capitaltechalliance.com** (works immediately)
