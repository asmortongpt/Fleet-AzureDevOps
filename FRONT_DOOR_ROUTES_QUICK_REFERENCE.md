# Fleet Front Door Routes - Quick Reference

## Endpoint
`http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net`

## Routes

| Pattern | Backend | Port |
|---------|---------|------|
| `/*` | fleet-app-prod.eastus2.azurecontainer.io | 8080 |
| `/api/*` | fleet-backend-prod.eastus2.azurecontainer.io | 3000 |
| `/ws/obd2/*` | fleet-obd2-prod.eastus.azurecontainer.io | 8081 |
| `/ws/radio/*` | fleet-radio-prod.eastus.azurecontainer.io | 8082 |
| `/ws/dispatch/*` | fleet-dispatch-prod.eastus.azurecontainer.io | 8083 |

## Test Commands

```bash
# Check deployment status
az afd endpoint show --profile-name fleet-frontdoor -g fleet-production-rg --endpoint-name fleet-endpoint

# Test routes (once deployed)
curl http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/
curl http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/api/health
```

## Status
- Configuration: ✅ Complete
- Deployment: ⏳ Propagating (5-10 min)
- Cache: ✅ Purged
