# Fleet Management System - Troubleshooting Guide

**To:** Himanshu@capitaltechalliance.com
**From:** Fleet Management System DevOps Team
**Date:** 2025-11-12
**Version:** 1.0.0
**Purpose:** Common issues and solutions

---

## 👋 Dear Himanshu,

Welcome to the Fleet Management System! This troubleshooting guide has been prepared to help you quickly resolve common issues you may encounter while working with the system. It covers everything from DNS and SSL issues to deployment problems, database connectivity, and local development setup.

Keep this guide handy as a reference when things go wrong. It's organized by problem category with clear symptoms, causes, and step-by-step solutions.

---

## 📋 Table of Contents

1. [DNS Issues](#dns-issues)
2. [SSL Certificate Issues](#ssl-certificate-issues)
3. [Deployment Issues](#deployment-issues)
4. [Database Issues](#database-issues)
5. [Authentication Issues](#authentication-issues)
6. [Build/CI/CD Issues](#buildcicd-issues)
7. [Performance Issues](#performance-issues)
8. [Local Development Issues](#local-development-issues)

---

## 🌐 DNS Issues

### Issue: DNS not resolving

**Symptoms**:
```bash
$ nslookup fleet.capitaltechalliance.com
Server:  dns.google
Address:  8.8.8.8

** server can't find fleet.capitaltechalliance.com: NXDOMAIN
```

**Causes**:
- DNS record not configured
- DNS not propagated yet
- Incorrect DNS record value

**Solutions**:

1. **Verify DNS record in provider**:
   - Log into your DNS provider (Cloudflare, GoDaddy, etc.)
   - Check for A record: `fleet` → `20.15.65.2`
   - Ensure record is saved and published

2. **Wait for propagation** (15-60 minutes, max 48 hours):
   ```bash
   # Check propagation status
   # Visit: https://dnschecker.org/#A/fleet.capitaltechalliance.com
   ```

3. **Clear local DNS cache**:
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches
   ```

4. **Test with different DNS servers**:
   ```bash
   # Google DNS
   nslookup fleet.capitaltechalliance.com 8.8.8.8

   # Cloudflare DNS
   nslookup fleet.capitaltechalliance.com 1.1.1.1
   ```

---

### Issue: DNS resolves to wrong IP

**Symptoms**:
```bash
$ nslookup fleet.capitaltechalliance.com
Address:  192.168.1.1  # Wrong IP
```

**Solutions**:

1. **Check DNS record**:
   - Should be: `20.15.65.2`
   - Update if incorrect

2. **Clear cache and retest**:
   ```bash
   # Clear cache (see above)
   # Wait 5 minutes
   # Test again
   ```

---

## 🔒 SSL Certificate Issues

### Issue: Certificate not issuing

**Symptoms**:
```bash
$ kubectl get certificate -n fleet-management
NAME             READY   SECRET           AGE
fleet-tls-cert   False   fleet-tls-cert   30m
```

**Causes**:
- DNS not propagated
- HTTP-01 challenge failing
- cert-manager issues
- Let's Encrypt rate limit

**Solutions**:

1. **Check DNS first**:
   ```bash
   # DNS MUST be working before certificate can issue
   nslookup fleet.capitaltechalliance.com
   ```

2. **Check certificate status**:
   ```bash
   kubectl describe certificate fleet-tls-cert -n fleet-management
   ```
   Look for error messages at the bottom.

3. **Check cert-manager logs**:
   ```bash
   kubectl logs -n cert-manager -l app=cert-manager --tail=100
   ```

4. **Check HTTP-01 challenges**:
   ```bash
   kubectl get challenges -n fleet-management

   # If challenge is stuck, describe it
   kubectl describe challenge <challenge-name> -n fleet-management
   ```

5. **Delete and recreate certificate**:
   ```bash
   kubectl delete certificate fleet-tls-cert -n fleet-management

   # Certificate will auto-recreate from ingress
   # Wait 5-10 minutes
   kubectl get certificate -n fleet-management
   ```

6. **If still failing, check ingress**:
   ```bash
   kubectl get ingress -n fleet-management
   kubectl describe ingress fleet-ingress -n fleet-management
   ```

---

### Issue: Browser shows "Not Secure"

**Symptoms**:
- Browser shows security warning
- Certificate error in console

**Solutions**:

1. **Check certificate is ready**:
   ```bash
   kubectl get certificate -n fleet-management
   # Must show READY: True
   ```

2. **Check certificate details in browser**:
   - Click padlock icon
   - View certificate
   - Verify it's issued by "Let's Encrypt"
   - Check expiration date

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Clear SSL state in browser settings

4. **Test with curl**:
   ```bash
   curl -vI https://fleet.capitaltechalliance.com 2>&1 | grep "SSL certificate"
   ```

---

## 🚀 Deployment Issues

### Issue: Pods not starting

**Symptoms**:
```bash
$ kubectl get pods -n fleet-management
NAME                        READY   STATUS             RESTARTS   AGE
fleet-app-xxx               0/1     ImagePullBackOff   0          5m
fleet-api-xxx               0/1     CrashLoopBackOff   3          5m
```

**Solutions**:

#### For ImagePullBackOff:

1. **Check image exists**:
   ```bash
   az acr repository list --name fleetappregistry --output table
   az acr repository show-tags --name fleetappregistry --repository fleet-app
   ```

2. **Check image pull secrets**:
   ```bash
   kubectl get secret -n fleet-management | grep acr

   # If missing, create it
   kubectl create secret docker-registry acr-secret \
     --docker-server=fleetappregistry.azurecr.io \
     --docker-username=<username> \
     --docker-password=<password> \
     -n fleet-management
   ```

3. **Check pod details**:
   ```bash
   kubectl describe pod <pod-name> -n fleet-management
   ```

#### For CrashLoopBackOff:

1. **Check pod logs**:
   ```bash
   kubectl logs <pod-name> -n fleet-management

   # If pod restarts quickly, check previous logs
   kubectl logs <pod-name> -n fleet-management --previous
   ```

2. **Common causes**:
   - Database connection failure → Check database pod is running
   - Missing environment variables → Check ConfigMap and Secrets
   - Application errors → Check logs for stack trace

3. **Check events**:
   ```bash
   kubectl get events -n fleet-management --sort-by='.lastTimestamp'
   ```

---

### Issue: Deployment stuck in "Progressing"

**Symptoms**:
```bash
$ kubectl rollout status deployment/fleet-app -n fleet-management
Waiting for deployment "fleet-app" rollout to finish: 1 out of 3 new replicas have been updated...
```

**Solutions**:

1. **Check pod status**:
   ```bash
   kubectl get pods -n fleet-management -l app=fleet-app
   ```

2. **Check deployment events**:
   ```bash
   kubectl describe deployment fleet-app -n fleet-management
   ```

3. **Check resource limits**:
   ```bash
   # Check if nodes have enough resources
   kubectl top nodes
   kubectl describe nodes
   ```

4. **Force rollback if needed**:
   ```bash
   kubectl rollout undo deployment/fleet-app -n fleet-management
   ```

---

## 💾 Database Issues

### Issue: Cannot connect to database

**Symptoms**:
- API logs show "ECONNREFUSED"
- Application fails to start

**Solutions**:

1. **Check database pod is running**:
   ```bash
   kubectl get pods -n fleet-management | grep postgres
   ```

2. **Check database service**:
   ```bash
   kubectl get svc fleet-postgres-service -n fleet-management
   ```

3. **Test connection from API pod**:
   ```bash
   API_POD=$(kubectl get pod -n fleet-management -l app=fleet-api -o jsonpath='{.items[0].metadata.name}')
   kubectl exec -it ${API_POD} -n fleet-management -- sh

   # Inside pod
   nc -zv fleet-postgres-service 5432
   ```

4. **Check database logs**:
   ```bash
   kubectl logs fleet-postgres-0 -n fleet-management
   ```

5. **Verify credentials**:
   ```bash
   kubectl get secret fleet-db-secret -n fleet-management -o yaml

   # Decode password
   kubectl get secret fleet-db-secret -n fleet-management \
     -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
   ```

---

### Issue: Database running out of space

**Symptoms**:
- Database pod shows high disk usage
- Errors about disk full

**Solutions**:

1. **Check PVC usage**:
   ```bash
   kubectl get pvc -n fleet-management
   kubectl describe pvc postgres-pvc -n fleet-management
   ```

2. **Resize PVC** (if supported):
   ```bash
   kubectl edit pvc postgres-pvc -n fleet-management
   # Increase storage size
   ```

3. **Clean up old data**:
   ```bash
   # Connect to database
   kubectl exec -it fleet-postgres-0 -n fleet-management -- \
     psql -U fleetadmin -d fleetdb

   # Check database size
   SELECT pg_size_pretty(pg_database_size('fleetdb'));

   # Check table sizes
   SELECT schemaname, tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
   FROM pg_tables
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

   # Clean up old audit logs, etc.
   ```

---

## 🔐 Authentication Issues

### Issue: Azure AD login fails

**Symptoms**:
- Error: "AADSTS50011: The redirect URI specified in the request does not match"
- Cannot log in with Microsoft SSO

**Solutions**:

1. **Check redirect URI**:
   - Go to Azure Portal → Azure AD → App Registrations
   - Find app: `80fe6628-1dc4-41fe-894f-919b12ecc994`
   - Click Authentication
   - Verify redirect URI: `https://fleet.capitaltechalliance.com/auth/callback`

2. **Check client ID in frontend**:
   ```bash
   # In .env file
   VITE_AZURE_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
   ```

3. **Check tenant ID**:
   ```bash
   VITE_AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
   ```

---

### Issue: JWT token expired

**Symptoms**:
- User logged out unexpectedly
- API returns 401 Unauthorized

**Solutions**:

1. **Check token expiration**:
   - Default is 24 hours
   - User needs to log in again

2. **Implement refresh token** (future enhancement):
   - See `SECURITY_SECRETS.md` for token management

---

## 🏗️ Build/CI/CD Issues

### Issue: Docker build fails with "VITE_AZURE_MAPS_SUBSCRIPTION_KEY is required"

**Symptoms**:
```
Error: VITE_AZURE_MAPS_SUBSCRIPTION_KEY is required for production build
```

**Solutions**:

1. **Check GitHub secret is set**:
   - Go to: https://github.com/asmortongpt/Fleet/settings/secrets/actions
   - Verify `AZURE_MAPS_SUBSCRIPTION_KEY` exists

2. **If building locally**:
   ```bash
   docker build \
     --build-arg VITE_AZURE_MAPS_SUBSCRIPTION_KEY="your-key-here" \
     -t fleet-app:latest .
   ```

---

### Issue: GitHub Actions workflow failing

**Symptoms**:
- CI/CD pipeline shows red X
- Build or deploy jobs failing

**Solutions**:

1. **Check workflow logs**:
   - Go to Actions tab in GitHub
   - Click on failed workflow
   - Expand failing job
   - Read error messages

2. **Common issues**:
   - Missing secrets → Add to repository settings
   - ACR credentials expired → Update secrets
   - Kubernetes connection → Check AKS credentials in secrets

3. **Re-run workflow**:
   - Click "Re-run failed jobs"
   - Sometimes transient errors resolve themselves

---

## ⚡ Performance Issues

### Issue: Application slow to load

**Symptoms**:
- Page loads take >5 seconds
- API responses slow

**Solutions**:

1. **Check pod resource usage**:
   ```bash
   kubectl top pods -n fleet-management
   ```

2. **Scale up if needed**:
   ```bash
   kubectl scale deployment fleet-app --replicas=5 -n fleet-management
   ```

3. **Check database performance**:
   ```bash
   # Connect to database
   kubectl exec -it fleet-postgres-0 -n fleet-management -- \
     psql -U fleetadmin -d fleetdb

   # Check slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

4. **Check Redis**:
   ```bash
   kubectl exec -it <redis-pod> -n fleet-management -- redis-cli info
   ```

---

### Issue: High memory usage

**Symptoms**:
- Pods being OOMKilled
- Application crashes

**Solutions**:

1. **Check memory limits**:
   ```bash
   kubectl describe pod <pod-name> -n fleet-management
   ```

2. **Increase memory limits**:
   ```bash
   kubectl edit deployment fleet-api -n fleet-management

   # Update resources.limits.memory
   ```

3. **Check for memory leaks**:
   - Review application logs
   - Monitor memory usage over time
   - Use profiling tools

---

## 💻 Local Development Issues

### Issue: npm install fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use correct Node version**:
   ```bash
   node --version  # Should be 20.x

   # Use nvm to switch if needed
   nvm install 20
   nvm use 20
   ```

---

### Issue: Frontend dev server won't start

**Symptoms**:
```
Error: Port 5173 is already in use
```

**Solutions**:

1. **Kill process on port**:
   ```bash
   # macOS/Linux
   lsof -ti:5173 | xargs kill -9

   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **Use different port**:
   ```bash
   npm run dev -- --port 3001
   ```

---

### Issue: API can't connect to local database

**Symptoms**:
- API fails to start
- Database connection refused

**Solutions**:

1. **Start PostgreSQL**:
   ```bash
   # Using Docker
   docker-compose up -d postgres

   # Or local PostgreSQL
   # macOS
   brew services start postgresql@15

   # Linux
   sudo systemctl start postgresql
   ```

2. **Check connection string**:
   ```bash
   # In api/.env
   DATABASE_URL=postgresql://username:password@localhost:5432/fleetdb
   ```

3. **Create database if needed**:
   ```bash
   createdb fleetdb

   # Run migrations
   cd api
   npm run migrate
   ```

---

## 🆘 Emergency Procedures

### Complete System Down

1. **Check all pods**:
   ```bash
   kubectl get pods -n fleet-management
   ```

2. **Restart all deployments**:
   ```bash
   kubectl rollout restart deployment -n fleet-management
   ```

3. **Check ingress**:
   ```bash
   kubectl get ingress -n fleet-management
   kubectl describe ingress fleet-ingress -n fleet-management
   ```

4. **Check external services**:
   - Azure Maps API status
   - Database connectivity
   - Redis connectivity

5. **Escalate if needed**:
   - Check Azure status: https://status.azure.com/
   - Contact support if Azure issue

---

### Data Loss/Corruption

1. **Stop writes immediately**:
   ```bash
   kubectl scale deployment fleet-api --replicas=0 -n fleet-management
   ```

2. **Check database backups**:
   ```bash
   # List backups in Azure Storage
   az storage blob list \
     --account-name fleetbackups \
     --container-name database-backups
   ```

3. **Restore from backup**:
   ```bash
   # See DEVOPS.md "Disaster Recovery" section
   ```

4. **Verify data**:
   ```bash
   kubectl exec -it fleet-postgres-0 -n fleet-management -- \
     psql -U fleetadmin -d fleetdb -c "\dt"
   ```

5. **Bring system back online**:
   ```bash
   kubectl scale deployment fleet-api --replicas=1 -n fleet-management
   ```

---

## 📞 Getting Help

### Documentation

- **DEVOPS.md** - Complete DevOps reference
- **README.md** - Project overview
- **docs/PROJECT_HANDOFF.md** - Production status

### Useful Commands

```bash
# View all resources
kubectl get all -n fleet-management

# Stream logs
kubectl logs -f deployment/fleet-app -n fleet-management

# Get into a pod
kubectl exec -it <pod-name> -n fleet-management -- sh

# Check resource usage
kubectl top nodes
kubectl top pods -n fleet-management
```

### Support Channels

- **GitHub Issues**: https://github.com/asmortongpt/Fleet/issues
- **Documentation**: All .md files in repository
- **DevOps Team**: Reference contacts in PROJECT_HANDOFF.md

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-12
**Maintained By**: DevOps Team
