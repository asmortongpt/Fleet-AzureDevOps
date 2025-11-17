# Fix SSL Backend Protocol Error - Copy & Paste Commands

## Run these commands in order:

### Step 1: Fix the Ingress Annotation
```bash
# Add HTTP backend protocol annotation:
kubectl annotate ingress fleet-ingress \
  nginx.ingress.kubernetes.io/backend-protocol=HTTP \
  -n fleet-management --overwrite
```

### Step 2: Verify the Annotation Was Added
```bash
# Check the ingress annotations:
kubectl get ingress fleet-ingress -n fleet-management -o yaml | grep backend-protocol
```

Expected output:
```
nginx.ingress.kubernetes.io/backend-protocol: HTTP
```

### Step 3: Restart Ingress Controller (Optional but Recommended)
```bash
# Restart to apply changes immediately:
kubectl rollout restart deployment -n ingress-nginx \
  $(kubectl get deployment -n ingress-nginx -o name | grep controller)
```

### Step 4: Wait for Rollout to Complete
```bash
# Wait for the restart (takes 30-60 seconds):
kubectl rollout status deployment -n ingress-nginx \
  $(kubectl get deployment -n ingress-nginx -o name | grep controller | cut -d'/' -f2)
```

### Step 5: Test HTTPS Access
```bash
# Test the HTTPS endpoint:
curl -I https://fleet.capitaltechalliance.com

# You should see: HTTP/2 200 or HTTP/1.1 200
# No more SSL errors!
```

### Step 6: Test in Browser
Open your browser and go to:
```
https://fleet.capitaltechalliance.com
```

Should work with no SSL errors! 🎉

---

## If You Get Permission Errors

Try with proper namespace:
```bash
kubectl annotate ingress fleet-ingress \
  nginx.ingress.kubernetes.io/backend-protocol=HTTP \
  -n fleet-management --overwrite

# If that fails, check your namespace:
kubectl get ingress --all-namespaces | grep fleet
```

---

## Alternative: Edit Ingress Directly

If annotations don't work, edit the ingress:

```bash
kubectl edit ingress fleet-ingress -n fleet-management
```

Add this under `metadata.annotations`:
```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
    # ... other annotations ...
```

Save and exit (`:wq` in vi/vim)

---

## Verify Everything is Working

```bash
# 1. Check ingress:
kubectl get ingress -n fleet-management

# 2. Check certificate:
kubectl get certificate -n fleet-management

# 3. Test HTTPS:
curl -I https://fleet.capitaltechalliance.com

# 4. Check for any errors:
kubectl logs -n ingress-nginx \
  $(kubectl get pod -n ingress-nginx -l app.kubernetes.io/component=controller -o name) \
  --tail=50
```

---

## What This Does

The annotation tells nginx:
- ✅ Terminate SSL at the ingress (handle HTTPS)
- ✅ Forward plain HTTP to backend service
- ✅ Backend doesn't need to handle SSL

This is the standard pattern for Kubernetes ingress!

---

## Success Indicators

After running the commands, you should see:
1. `curl -I https://fleet.capitaltechalliance.com` returns `HTTP/2 200`
2. Browser shows 🔒 padlock with no errors
3. App loads at `https://fleet.capitaltechalliance.com`

Expected time: 1-2 minutes

---

## For Future Deployments

**Good News!** The `deployment/ingress-ssl.yaml` file has been updated to include the `backend-protocol: HTTP` annotation by default.

If you redeploy using the updated configuration:
```bash
kubectl apply -f deployment/ingress-ssl.yaml
```

The SSL will work correctly without needing to manually add the annotation.

This prevents the `ERR_SSL_PROTOCOL_ERROR` from happening on fresh deployments.
