# Fleet Local - Quick Start Guide

## TL;DR - Get Running in 5 Minutes

### Step 1: Start Frontend (Already Running ✅)
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
npm run dev
# Visit: http://localhost:5173
```

### Step 2: Start API Server
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api
npm run dev
# API will be at: http://localhost:3000
```

### Step 3: Verify Everything Works
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
./test-connectivity.sh
```

### Step 4: Test in Browser
```
1. Open http://localhost:5173
2. Press F12 (DevTools)
3. Check Console for errors
4. Navigate to map pages
5. Verify real-time updates
```

---

## Current Status (as of 7:00 PM, Nov 26, 2025)

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Frontend | ✅ RUNNING | None - already working |
| API Server | ⚠️ READY | Just run `cd api && npm run dev` |
| Google Maps | ✅ CONFIGURED | Test in browser |
| Emulators | ✅ READY | Start via API after server runs |

---

## Test Emulators (After API Starts)

```bash
# Check status
curl http://localhost:3000/api/emulator/status

# Start emulators
curl -X POST http://localhost:3000/api/emulator/start

# Get vehicle data
curl http://localhost:3000/api/emulator/vehicles
```

---

## Troubleshooting

### If API Won't Start
```bash
# Make sure you're in the api directory
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api

# Check if .env exists
ls -la .env

# Start server
npm run dev
```

### If Frontend Shows Errors
```
Check browser console (F12)
Look for API connection errors
Verify VITE_API_URL=http://localhost:3000 in .env
```

### If Maps Don't Load
```
Check browser console for Google Maps errors
Verify API key in .env
Check Network tab for API calls to maps.googleapis.com
```

---

## Documentation

- `FINAL_TEST_REPORT.md` - Complete test results
- `BROWSER_TESTING_GUIDE.md` - How to test in browser
- `COMPREHENSIVE_CONNECTIVITY_TEST_REPORT.md` - Full technical details
- `test-connectivity.sh` - Automated testing script

---

## URLs

- Frontend: http://localhost:5173
- API: http://localhost:3000
- API Health: http://localhost:3000/api/health
- Emulator Status: http://localhost:3000/api/emulator/status

---

**Everything is ready to go! Just start the API server and you're live.** 🚀
