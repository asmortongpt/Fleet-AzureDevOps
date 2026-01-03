
# Fleet Backend API - No-DB Mode
# This file records the decision to run the backed in a degraded mode without a database.

## Status
- Frontend: Online (http://localhost:5174)
- Backend: Starting in Degraded Mode (http://localhost:3001)
- Database: Offline (Docker unavailable)

## Changes
- Modified `connection-manager.ts` to log errors but NOT throw when WEAPP pool fails to initialize.
- Ideally, `server.ts` handles this gracefully, but `connection-manager` was throwing early.
