# Fleet Emulator Endpoints - Quick Reference

## Production Emulator URLs

### OBD2 Emulator (Port 8081)
- **WebSocket:** `ws://fleet-obd2-prod.eastus.azurecontainer.io:8081`
- **HTTP:** `http://fleet-obd2-prod.eastus.azurecontainer.io:8081`
- **IP:** `20.124.153.213`
- **Event:** `telemetry` (every 1 second)

### Radio Emulator (Port 8082)
- **WebSocket:** `ws://fleet-radio-prod.eastus.azurecontainer.io:8082`
- **HTTP:** `http://fleet-radio-prod.eastus.azurecontainer.io:8082`
- **IP:** `20.241.223.28`
- **Event:** `transmission` (every 5 seconds)

### Dispatch Emulator (Port 8083)
- **WebSocket:** `ws://fleet-dispatch-prod.eastus.azurecontainer.io:8083`
- **HTTP:** `http://fleet-dispatch-prod.eastus.azurecontainer.io:8083`
- **IP:** `57.152.94.177`
- **Event:** `event` (every 10 seconds)

## Quick Connect (JavaScript)

```javascript
const io = require('socket.io-client');

const obd2 = io('http://fleet-obd2-prod.eastus.azurecontainer.io:8081');
const radio = io('http://fleet-radio-prod.eastus.azurecontainer.io:8082');
const dispatch = io('http://fleet-dispatch-prod.eastus.azurecontainer.io:8083');

obd2.on('telemetry', data => console.log('OBD2:', data));
radio.on('transmission', data => console.log('Radio:', data));
dispatch.on('event', data => console.log('Dispatch:', data));
```

## All Emulators Running ✅

See `EMULATOR_DEPLOYMENT_SUMMARY.md` for complete documentation.
