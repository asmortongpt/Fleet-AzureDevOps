# Fleet Management System - Custom Domain Setup Guide

Complete guide to deploying the Fleet Management System with your custom domain and SSL/TLS certificates.

---

## 🎯 Overview

This guide will help you set up:
- ✅ Custom domain (e.g., fleet.yourdomain.com)
- ✅ Automated SSL/TLS certificates (Let's Encrypt)
- ✅ HTTPS with automatic renewal
- ✅ Professional branding
- ✅ Production-grade security

**Time Required**: 30-45 minutes
**Cost**: $0 (Let's Encrypt is free)

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] Domain name registered (e.g., capitaltechalliance.com)
- [x] Access to DNS management (Cloudflare, Route53, etc.)
- [x] Kubernetes cluster running
- [x] `kubectl` access to the cluster
- [x] Fleet Management System deployed

---

## 🚀 Step-by-Step Setup

### **Step 1: Choose Your Domain Structure**

Pick one of these options:

**Option A: Subdomain-based** (Recommended)
```
Frontend:  fleet.capitaltechalliance.com
API:       api.fleet.capitaltechalliance.com
```

**Option B: Path-based**
```
Frontend:  fleet.capitaltechalliance.com
API:       fleet.capitaltechalliance.com/api
```

**Option C: Separate domains**
```
Frontend:  fleetmanager.com
API:       api.fleetmanager.com
```

---

### **Step 2: Install Nginx Ingress Controller**

If not already installed:

```bash
# Add Nginx Ingress Helm repo
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install Nginx Ingress
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.metrics.enabled=true

# Wait for external IP
kubectl get svc -n ingress-nginx -w
```

**Note the EXTERNAL-IP** - you'll need this for DNS.

---

### **Step 3: Install cert-manager**

cert-manager automates SSL certificate management:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verify installation
kubectl get pods -n cert-manager

# Should see:
# cert-manager-xxx          1/1     Running
# cert-manager-cainjector-xxx   1/1     Running
# cert-manager-webhook-xxx      1/1     Running
```

---

### **Step 4: Configure Let's Encrypt Issuers**

```bash
# Apply cert-manager configuration
kubectl apply -f deployment/cert-manager-setup.yaml

# Verify issuers created
kubectl get clusterissuers
```

**Update email address** in `cert-manager-setup.yaml`:
```yaml
email: your-email@yourdomain.com  # Change this!
```

---

### **Step 5: Update DNS Records**

Add these DNS records (use the EXTERNAL-IP from Step 2):

**For Option A (Subdomain-based)**:
```
Type    Name                            Value
A       fleet.capitaltechalliance.com   <EXTERNAL-IP>
A       api.fleet.capitaltechalliance.com   <EXTERNAL-IP>
```

**For Option B (Path-based)**:
```
Type    Name                            Value
A       fleet.capitaltechalliance.com   <EXTERNAL-IP>
```

**DNS Propagation**: Wait 5-15 minutes for DNS to propagate.

**Verify DNS**:
```bash
# Check DNS resolution
nslookup fleet.capitaltechalliance.com
dig fleet.capitaltechalliance.com

# Should return your EXTERNAL-IP
```

---

### **Step 6: Update Domain in Ingress Configuration**

Edit `deployment/ingress-ssl.yaml` and replace domains:

```yaml
# Change these to your domain:
- fleet.capitaltechalliance.com      # → fleet.yourdomain.com
- api.fleet.capitaltechalliance.com  # → api.fleet.yourdomain.com
```

**Full example**:
```yaml
tls:
- hosts:
  - fleet.yourdomain.com
  - api.fleet.yourdomain.com
  secretName: fleet-tls-cert

rules:
- host: fleet.yourdomain.com
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: fleet-app-service
          port:
            number: 80
```

---

### **Step 7: Deploy Ingress**

```bash
# Apply the Ingress configuration
kubectl apply -f deployment/ingress-ssl.yaml

# Check Ingress status
kubectl get ingress -n fleet-management

# Wait for ADDRESS to be assigned
# NAME            CLASS   HOSTS                                   ADDRESS         PORTS     AGE
# fleet-ingress   nginx   fleet.yourdomain.com,api.fleet...      <EXTERNAL-IP>   80, 443   30s
```

---

### **Step 8: Verify SSL Certificate**

Watch certificate issuance (takes 1-3 minutes):

```bash
# Check certificate request
kubectl get certificaterequest -n fleet-management

# Check certificate status
kubectl get certificate -n fleet-management

# Should show:
# NAME            READY   SECRET          AGE
# fleet-tls-cert  True    fleet-tls-cert  2m
```

**Troubleshooting**:
```bash
# If certificate stuck in "Pending"
kubectl describe certificate fleet-tls-cert -n fleet-management

# Check cert-manager logs
kubectl logs -n cert-manager deploy/cert-manager
```

---

### **Step 9: Update Frontend Environment**

Update the frontend to use your custom domain:

```bash
# Edit frontend deployment
kubectl edit deployment fleet-app -n fleet-management

# Add environment variable:
env:
- name: VITE_API_URL
  value: "https://api.fleet.yourdomain.com"
```

Or update `.env.production`:
```bash
VITE_API_URL=https://api.fleet.yourdomain.com
```

Then rebuild and redeploy frontend.

---

### **Step 10: Test Your Setup** ✅

```bash
# Test HTTPS redirect
curl -I http://fleet.yourdomain.com
# Should return: HTTP/1.1 308 Permanent Redirect

# Test HTTPS access
curl -I https://fleet.yourdomain.com
# Should return: HTTP/2 200

# Test API
curl https://api.fleet.yourdomain.com/api/health
# Should return: {"status":"healthy",...}

# Check SSL certificate
openssl s_client -connect fleet.yourdomain.com:443 -servername fleet.yourdomain.com < /dev/null
# Should show: Let's Encrypt certificate
```

**Browser test**:
1. Open https://fleet.yourdomain.com
2. Check for 🔒 padlock in address bar
3. Click padlock → Should show "Connection is secure"
4. Certificate issued by: "Let's Encrypt"

---

## 🎨 Professional Branding (Optional)

### Update Application Title & Logo

**1. Update HTML Title**:
```bash
# Edit index.html
kubectl exec -it <frontend-pod> -n fleet-management -- sh
vi /app/index.html

# Change:
<title>Fleet Management System</title>
# To:
<title>Capital Tech Alliance Fleet</title>
```

**2. Add Custom Logo**:
Upload logo to `public/logo.png` and rebuild frontend.

**3. Update Theme Colors**:
Edit `src/index.css`:
```css
:root {
  --primary-color: #1e40af;  /* Your brand color */
  --secondary-color: #3b82f6;
}
```

---

## 🔐 Security Best Practices

### Enable Additional Security Headers

Already configured in `ingress-ssl.yaml`:
```yaml
annotations:
  nginx.ingress.kubernetes.io/configuration-snippet: |
    more_set_headers "X-Frame-Options: SAMEORIGIN";
    more_set_headers "X-Content-Type-Options: nosniff";
    more_set_headers "X-XSS-Protection: 1; mode=block";
    more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
```

### Enable Rate Limiting

Configured per Ingress:
```yaml
nginx.ingress.kubernetes.io/limit-rps: "100"
nginx.ingress.kubernetes.io/limit-connections: "20"
```

---

## 🔄 Automatic Certificate Renewal

cert-manager automatically renews certificates 30 days before expiration.

**Monitor renewals**:
```bash
# Check certificate expiration
kubectl get certificate -n fleet-management -o jsonpath='{.items[0].status.notAfter}'

# View renewal logs
kubectl logs -n cert-manager deploy/cert-manager | grep renew
```

**Manual renewal** (if needed):
```bash
# Delete certificate to trigger renewal
kubectl delete certificate fleet-tls-cert -n fleet-management

# cert-manager will automatically recreate it
```

---

## 🌍 Multiple Domains / Tenants

To support multiple domains (for multi-tenant):

```yaml
# Add additional domains to ingress-ssl.yaml
tls:
- hosts:
  - tenant1.yourdomain.com
  - api.tenant1.yourdomain.com
  secretName: tenant1-tls-cert

- hosts:
  - tenant2.yourdomain.com
  - api.tenant2.yourdomain.com
  secretName: tenant2-tls-cert

rules:
- host: tenant1.yourdomain.com
  http:
    paths:
    - path: /
      backend:
        service:
          name: fleet-app-service
          port:
            number: 80
```

---

## 📊 Monitoring SSL Certificates

Add Prometheus alerts for certificate expiration:

```yaml
# prometheus-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cert-expiry-alerts
  namespace: fleet-management
spec:
  groups:
  - name: certificates
    rules:
    - alert: CertificateExpiringSoon
      expr: certmanager_certificate_expiration_timestamp_seconds - time() < 604800
      for: 1h
      annotations:
        summary: "Certificate {{ $labels.name }} expiring in < 7 days"
```

---

## 🐛 Troubleshooting

### Issue: Certificate stuck in "Pending"

**Check DNS**:
```bash
nslookup fleet.yourdomain.com
```

**Check Ingress**:
```bash
kubectl describe ingress fleet-ingress -n fleet-management
```

**Check cert-manager logs**:
```bash
kubectl logs -n cert-manager deploy/cert-manager -f
```

### Issue: "Connection not secure" warning

**Cause**: Using staging issuer or self-signed cert

**Fix**: Ensure using `letsencrypt-prod` issuer:
```bash
kubectl get certificate fleet-tls-cert -n fleet-management -o yaml | grep issuerRef
```

### Issue: 502 Bad Gateway

**Check backend services**:
```bash
kubectl get svc -n fleet-management
kubectl get pods -n fleet-management
```

---

## 📞 Support

**DNS Issues**: Check with your DNS provider (Cloudflare, Route53, etc.)
**Cert Issues**: [cert-manager documentation](https://cert-manager.io/docs/)
**Nginx Issues**: [Nginx Ingress docs](https://kubernetes.github.io/ingress-nginx/)

---

## ✅ Completion Checklist

- [ ] Nginx Ingress installed
- [ ] cert-manager installed
- [ ] DNS records configured
- [ ] Domain verified (nslookup/dig)
- [ ] Ingress deployed
- [ ] Certificate issued (READY=True)
- [ ] HTTPS working in browser
- [ ] API accessible via HTTPS
- [ ] SSL certificate from Let's Encrypt
- [ ] Auto-renewal configured
- [ ] Security headers enabled
- [ ] Branding updated

---

🎉 **Congratulations!** Your Fleet Management System is now accessible at:
- **Frontend**: https://fleet.yourdomain.com
- **API**: https://api.fleet.yourdomain.com

🔒 **Secured with** Let's Encrypt SSL/TLS certificates
🔄 **Auto-renewing** every 60 days
