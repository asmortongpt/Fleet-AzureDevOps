# Fleet Demo Console + Emulator Suite (v2)

This is a **standalone demo product** that runs locally or in Docker and can simulate **100+ vehicles** with:
- realtime telemetry (GPS, ignition, CAN-like fields)
- badge scans (RFID / 1-wire UID)
- driver sessions + authorization
- enforcement actions (simulate immobilize)
- incidents (unauthorized driving attempts)
- scenario playback and orchestration from the UI
- a **mock Fleet API backend** so the demo works even without your Fleet app running

It also supports **optional forwarding** to a real Fleet environment by setting a base URL + token in the UI.

## One-command run (recommended)
```bash
docker compose up --build
```

Open:
- Demo Console UI: http://localhost:5173
- Relay:           http://localhost:4010/health
- Emulator Manager:http://localhost:4030/health
- Mock Fleet API:  http://localhost:4020/health

## Local dev (node)
```bash
npm install
npm run dev
```

## Architecture
- `services/relay` — Event gateway:
  - accepts events from emulators and UI
  - broadcasts events to UI over WebSocket
  - optionally forwards to your real Fleet API
- `services/mock-fleet` — Mock Fleet API + state machine:
  - vehicles, drivers, policies, sessions, incidents
  - endpoints compatible with the emulator and UI
- `services/emulator-manager` — Orchestrates 100+ vehicle simulations:
  - start/stop fleets of simulated vehicles
  - assign scenarios
  - deterministic seeds
  - streams telemetry + scans into relay at adjustable rates
- `apps/demo-console` — Standalone UI:
  - live map (Leaflet)
  - vehicles table with status chips
  - driver + badge registry
  - policy configuration
  - incidents timeline
  - scenario library + playback controls
  - raw event inspector

## Integrating into your Fleet repo
Copy this folder into your Fleet repo under `tools/demo-suite/` and run it alongside your API.
Set forwarding in the UI (Settings) to point at your Fleet API (`/api/vehicles/:id/telemetry`, `/api/vehicles/:id/badge-scan`).

## Key endpoints expected in real Fleet (for full end-to-end)
- POST /api/vehicles/:id/telemetry
- POST /api/vehicles/:id/badge-scan
- GET  /api/vehicles/:id/driver-session
