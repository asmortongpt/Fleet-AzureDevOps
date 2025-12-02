# Microsoft Integration Runbook

## Emergency Procedures

### Issue: Integration is Down

**Symptoms**:
- Cannot send Teams messages
- Cannot send emails
- Webhook notifications not arriving

**Quick Fix**:
```bash
# 1. Check API logs
kubectl logs -f deployment/fleet-api -n fleet-management | grep -i microsoft

# 2. Verify token acquisition
cd /home/user/Fleet/api
npm run verify:integration

# 3. Check webhook subscriptions
curl -X GET https://graph.microsoft.com/v1.0/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Restart API pods
kubectl rollout restart deployment/fleet-api -n fleet-management
```

### Issue: Webhooks Expired

**Symptoms**:
- Real-time notifications stopped
- Messages/emails arrive with delay

**Fix**:
```bash
# Renew all webhooks
cd /home/user/Fleet/api
npm run setup:webhooks

# Verify renewal
npm run verify:integration
```

### Issue: Rate Limiting

**Symptoms**:
- Error: "429 Too Many Requests"
- API calls failing intermittently

**Fix**:
```bash
# Check rate limit headers in logs
kubectl logs deployment/fleet-api | grep "429"

# Implement exponential backoff (already in code)
# Wait for rate limit reset (check Retry-After header)

# Scale down aggressive sync jobs
kubectl scale deployment/sync-worker --replicas=1 -n fleet-management
```

## Common Operations

### 1. Renew Expired Webhooks

```bash
cd /home/user/Fleet/api

# List current subscriptions
curl -X GET https://graph.microsoft.com/v1.0/subscriptions \
  -H "Authorization: Bearer $(node -e 'require("./src/scripts/setup-webhooks").acquireToken()')"

# Delete expired subscriptions
npm run webhooks:cleanup

# Create new subscriptions
npm run setup:webhooks
```

### 2. Re-sync Messages

```bash
# Reset sync state for a user
curl -X POST http://localhost:3000/api/sync/reset \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"userId": "user@example.com", "resourceType": "messages"}'

# Trigger full sync
curl -X POST http://localhost:3000/api/sync/full \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"userId": "user@example.com"}'
```

### 3. Restart Failed Jobs

```bash
# List dead letter queue
curl -X GET http://localhost:3000/api/queue/dead-letter \
  -H "Authorization: Bearer YOUR_JWT"

# Retry specific job
curl -X POST http://localhost:3000/api/queue/retry/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT"

# Retry all failed jobs
curl -X POST http://localhost:3000/api/queue/retry-all \
  -H "Authorization: Bearer YOUR_JWT"
```

### 4. Handle Rate Limiting

**Check current rate limit status**:
```bash
# View recent API calls
kubectl logs deployment/fleet-api | grep "Graph API" | tail -20

# Check for 429 errors
kubectl logs deployment/fleet-api | grep "429" | wc -l
```

**Mitigate rate limiting**:
```bash
# Reduce sync frequency
kubectl set env deployment/sync-worker SYNC_INTERVAL_MINUTES=30

# Disable aggressive features temporarily
kubectl set env deployment/fleet-api ENABLE_REALTIME_SYNC=false

# Wait for rate limit reset (typically 60 seconds)
sleep 60

# Re-enable features
kubectl set env deployment/fleet-api ENABLE_REALTIME_SYNC=true
```

### 5. Rotate Client Secret

```bash
# 1. Generate new secret in Azure Portal
# 2. Update Kubernetes secret
kubectl create secret generic microsoft-graph-secret \
  --from-literal=client-id=YOUR_CLIENT_ID \
  --from-literal=client-secret=NEW_CLIENT_SECRET \
  --from-literal=tenant-id=YOUR_TENANT_ID \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Restart API to pick up new secret
kubectl rollout restart deployment/fleet-api -n fleet-management

# 4. Verify
npm run verify:integration
```

## Monitoring

### Key Metrics to Track

1. **API Success Rate**
   ```bash
   kubectl logs deployment/fleet-api | grep "Graph API" | \
     awk '{print $NF}' | sort | uniq -c
   ```

2. **Webhook Health**
   ```bash
   # Check webhook processing
   kubectl logs deployment/fleet-api | grep "Webhook" | tail -20
   ```

3. **Queue Length**
   ```bash
   curl http://localhost:3000/api/metrics/queue | jq '.pending'
   ```

4. **Sync Status**
   ```bash
   curl http://localhost:3000/api/metrics/sync | jq
   ```

### Alerts to Configure

- **Webhook expiring** (< 24 hours)
- **Queue length** (> 1000 jobs)
- **Failed jobs** (> 100 in DLQ)
- **API error rate** (> 5%)
- **Rate limit hits** (> 10/hour)

## Troubleshooting

### Debug Token Issues

```bash
# Get token manually
curl -X POST https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials"

# Decode JWT token
echo "YOUR_TOKEN" | cut -d. -f2 | base64 -d | jq
```

### Debug Webhook Issues

```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/teams \
  -H "Content-Type: application/json" \
  -d '{"validationToken": "test-token"}'

# Check webhook logs
kubectl logs deployment/fleet-api | grep "webhook" -i
```

### Debug Sync Issues

```bash
# Check sync state
curl http://localhost:3000/api/sync/state/user@example.com/messages \
  -H "Authorization: Bearer YOUR_JWT"

# Force delta sync
curl -X POST http://localhost:3000/api/sync/delta \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"userId": "user@example.com", "resourceType": "messages"}'
```

## Recovery Procedures

### Complete System Recovery

```bash
# 1. Stop all services
kubectl scale deployment/fleet-api --replicas=0
kubectl scale deployment/sync-worker --replicas=0

# 2. Clean up old webhook subscriptions
npm run webhooks:cleanup

# 3. Reset database state (if needed)
kubectl exec -it postgres-0 -- psql -U fleetadmin -d fleetdb \
  -c "TRUNCATE microsoft_sync_state;"

# 4. Restart services
kubectl scale deployment/fleet-api --replicas=3
kubectl scale deployment/sync-worker --replicas=1

# 5. Re-create webhooks
npm run setup:webhooks

# 6. Verify everything
npm run verify:integration
```

## Contact Information

- **On-Call Engineer**: [Contact details]
- **Microsoft Support**: [Portal link]
- **Azure Support**: [Portal link]

## References

- [Setup Guide](../microsoft-integration/setup.md)
- [Troubleshooting](../microsoft-integration/troubleshooting.md)
- [API Reference](../microsoft-integration/api-reference.md)
