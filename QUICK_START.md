# Fleet Management System - Quick Start Guide

## 🚀 INSTANT ACCESS

### URLs
- **Frontend:** http://172.173.175.71:5174
- **Backend:** http://172.173.175.71:3001
- **Health:** http://172.173.175.71:3001/api/health

### One-Line Tests
```bash
# Test health
curl http://172.173.175.71:3001/api/health

# Get vehicles
curl http://172.173.175.71:3001/api/vehicles

# SSH to VM
ssh azureuser@172.173.175.71
```

## 📊 API Endpoints (All Working ✅)

| Endpoint | URL |
|----------|-----|
| Health | http://172.173.175.71:3001/api/health |
| Vehicles | http://172.173.175.71:3001/api/vehicles |
| Drivers | http://172.173.175.71:3001/api/drivers |
| Facilities | http://172.173.175.71:3001/api/facilities |
| Work Orders | http://172.173.175.71:3001/api/work-orders |
| Fuel Trans. | http://172.173.175.71:3001/api/fuel-transactions |
| Routes | http://172.173.175.71:3001/api/routes |
| Maint. Sched. | http://172.173.175.71:3001/api/maintenance-schedules |
| Maintenance | http://172.173.175.71:3001/api/maintenance |

## 🔧 Quick Commands

### View Logs
```bash
ssh azureuser@172.173.175.71 'tail -20 /tmp/fleet-backend.log'
```

### Restart Backend
```bash
ssh azureuser@172.173.175.71 'pkill -f server-mock-simple && cd /home/azureuser/fleet-production/api && PORT=3001 nohup node server-mock-simple.js > /tmp/fleet-backend.log 2>&1 &'
```

### Check Status
```bash
ssh azureuser@172.173.175.71 'ps aux | grep node | grep -v grep'
```

## 📈 Data Counts
- **Vehicles:** 50
- **Drivers:** 50
- **Facilities:** 5
- **Work Orders:** 50
- **Fuel Transactions:** 50
- **Routes:** 50

## ✅ Status
- Backend: ONLINE ✅
- Frontend: ONLINE ✅
- All Endpoints: PASS ✅

## 📚 Full Documentation
- **Detailed Report:** FLEET_AZURE_VM_DEPLOYMENT_REPORT.md
- **Success Summary:** DEPLOYMENT_SUCCESS_SUMMARY.md
