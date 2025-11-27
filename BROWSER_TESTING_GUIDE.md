# Fleet Local - Browser Testing Guide

## Google Maps Integration Testing

### Step 1: Open the Application
1. Navigate to http://localhost:5173 in Chrome or Firefox
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Go to the Console tab

### Step 2: Check for Google Maps Loading
Look for these messages in the console:

✅ **Success Messages:**
```
Google Maps JavaScript API loaded successfully
@react-google-maps/api: Library loaded
```

❌ **Error Messages:**
```javascript
// API Key Errors
Google Maps JavaScript API error: InvalidKeyMapError
Google Maps JavaScript API error: RefererNotAllowedMapError
Google Maps JavaScript API error: ApiNotActivatedMapError

// Loading Errors
Failed to load Google Maps API
Google Maps script failed to load
```

### Step 3: Navigate to Map Pages
Test these pages for map rendering:
- Dashboard (/)
- Live Tracking (/tracking or /fleet)
- Route Planning (/routes)
- Geofences (/geofences)

### Step 4: Visual Inspection
Check for:
- ✅ Map tiles loading (gray/colored map background)
- ✅ Map controls visible (zoom buttons, pan controls)
- ❌ "For development purposes only" watermark (means invalid API key)
- ❌ Gray squares instead of map (API key restriction)

### Step 5: Network Tab Inspection
1. Go to DevTools → Network tab
2. Filter by "maps.googleapis.com"
3. Look for requests like:
   ```
   https://maps.googleapis.com/maps/api/js?key=AIzaSy...&libraries=places,drawing,geometry
   ```
4. Check status codes:
   - ✅ 200 OK = Success
   - ❌ 403 Forbidden = API key restriction
   - ❌ 400 Bad Request = Invalid parameters

## API Connectivity Testing

### Step 1: Check API Requests
1. Open DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. Look for requests to `http://localhost:3000/api/`

### Step 2: Expected API Calls
When you load the Dashboard, you should see:
```
GET http://localhost:3000/api/vehicles → 200 OK
GET http://localhost:3000/api/drivers → 200 OK
GET http://localhost:3000/api/telemetry → 200 OK
```

### Step 3: Check Response Data
Click on any API request and check the Response tab:
```json
{
  "success": true,
  "data": [
    {
      "id": "VEH-001",
      "make": "Ford",
      "model": "F-150",
      "status": "active"
    }
  ]
}
```

### Step 4: Error Detection
Look for these in the Console:
```javascript
// Connection Errors
Failed to fetch
net::ERR_CONNECTION_REFUSED

// CORS Errors
Access to fetch at 'http://localhost:3000/api/vehicles' from origin 'http://localhost:5173'
has been blocked by CORS policy

// Authentication Errors
Unauthorized (401)
Forbidden (403)
```

## WebSocket Testing (OBD2 Emulator)

### Step 1: Check WebSocket Connection
1. DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to `ws://localhost:3000` or `ws://localhost:3001`

### Step 2: Connection Status
```
Status: 101 Switching Protocols ✅
Status: Failed to establish connection ❌
```

### Step 3: Monitor Messages
1. Click on the WebSocket connection
2. Go to "Messages" tab
3. You should see continuous telemetry data:
```json
{
  "type": "telemetry",
  "vehicleId": "VEH-001",
  "data": {
    "speed": 45,
    "rpm": 2200,
    "fuelLevel": 75,
    "engineTemp": 195
  },
  "timestamp": "2025-11-26T23:55:00Z"
}
```

## Performance Testing

### Step 1: Lighthouse Audit
1. DevTools → Lighthouse tab
2. Select "Performance" and "Best practices"
3. Click "Generate report"
4. Target scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 80

### Step 2: Network Performance
1. DevTools → Network tab
2. Check page load metrics:
   - DOMContentLoaded: < 1s
   - Load: < 3s
   - Total Size: < 5MB

## Console Error Checklist

### Critical Errors (Must Fix)
```javascript
❌ Uncaught TypeError: Cannot read property 'map' of undefined
❌ Failed to fetch
❌ WebSocket connection to 'ws://localhost:3000' failed
❌ Google Maps JavaScript API error
```

### Warnings (Should Fix)
```javascript
⚠️ Warning: Each child in a list should have a unique "key" prop
⚠️ Warning: Can't perform a React state update on an unmounted component
⚠️ DevTools failed to load source map
```

### Info (Can Ignore)
```javascript
ℹ️ React DevTools initialized
ℹ️ Download the React DevTools extension
```

## Testing Checklist

### Frontend
- [ ] Page loads without errors
- [ ] All components render
- [ ] Navigation works
- [ ] Forms are interactive
- [ ] Buttons respond to clicks

### Google Maps
- [ ] Map renders on Dashboard
- [ ] Map tiles load completely
- [ ] No "development purposes" watermark
- [ ] Zoom controls work
- [ ] Pan/drag works
- [ ] Markers appear on map

### API
- [ ] API requests succeed (200 OK)
- [ ] Data populates in UI
- [ ] No CORS errors
- [ ] No authentication errors
- [ ] Loading states show/hide properly

### Emulators
- [ ] WebSocket connects
- [ ] Telemetry data streams
- [ ] Real-time updates in UI
- [ ] Vehicle markers move on map
- [ ] OBD2 data displays

## Quick Test Commands

### From Browser Console
```javascript
// Test if API is reachable
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test vehicles endpoint
fetch('http://localhost:3000/api/vehicles')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Check if Google Maps is loaded
console.log(typeof google !== 'undefined' ? 'Google Maps: Loaded' : 'Google Maps: Not loaded');

// Check environment variables
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Maps Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing');
```

## Troubleshooting

### Google Maps Not Loading
1. Check API key in .env: `VITE_GOOGLE_MAPS_API_KEY`
2. Verify API key restrictions in Google Cloud Console
3. Enable required APIs: Maps JavaScript API, Places API
4. Check browser console for specific error codes

### API Not Responding
1. Verify API server is running: `ps aux | grep tsx`
2. Check port 3000: `lsof -i :3000`
3. Test with curl: `curl http://localhost:3000/api/health`
4. Check .env has `VITE_API_URL=http://localhost:3000`

### WebSocket Not Connecting
1. Verify API server supports WebSocket
2. Check for CORS/security restrictions
3. Ensure WebSocket endpoint is correct
4. Check firewall/antivirus blocking

### Data Not Showing
1. Check API responses contain data
2. Verify data format matches component expectations
3. Check for JavaScript errors preventing render
4. Inspect React component state in DevTools

## Sample Test Session

```bash
# Terminal 1: Start Frontend
npm run dev

# Terminal 2: Start API
cd api && npm run dev

# Terminal 3: Run test script
./test-connectivity.sh

# Then open browser and:
# 1. Visit http://localhost:5173
# 2. Open DevTools (F12)
# 3. Check Console for errors
# 4. Check Network for API calls
# 5. Navigate to map pages
# 6. Monitor real-time updates
```

## Expected Working State

When everything is working correctly:

### Console Output (No Errors)
```
✅ React app initialized
✅ Router mounted
✅ API connected: http://localhost:3000
✅ Google Maps loaded
✅ WebSocket connected
✅ Emulator data streaming
```

### Network Tab (All 200 OK)
```
✅ http://localhost:5173/ → 200
✅ http://localhost:3000/api/health → 200
✅ http://localhost:3000/api/vehicles → 200
✅ https://maps.googleapis.com/maps/api/js → 200
✅ ws://localhost:3000 → 101 Switching Protocols
```

### Visual Confirmation
```
✅ Map displays on Dashboard
✅ Vehicle markers visible
✅ Real-time updates working
✅ No error messages visible
✅ All UI components interactive
```

---

**Last Updated:** 2025-11-26
**Version:** 1.0
