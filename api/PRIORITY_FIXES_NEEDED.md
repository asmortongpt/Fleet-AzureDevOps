# Priority Fixes Needed - Quick Reference

**Status:** Build completed with 296 TypeScript errors
**Risk:** HIGH - Do not deploy
**Full Report:** See BUILD_VERIFICATION_REPORT.md

---

## Top 10 Critical Fixes (Highest ROI)

### 1. Create Express Type Augmentation ⭐⭐⭐
**File:** `src/types/express.d.ts`
**Impact:** Fixes ~48 errors across 6 files
```typescript
// Add this file or update existing:
import { User } from './user';
import { RateLimitInfo } from 'express-rate-limit';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenant?: any;
      rateLimit?: RateLimitInfo;
    }
  }
}
```

### 2. Extend ActionType Enum ⭐⭐⭐
**File:** `src/types/audit.ts` (or wherever ActionType is defined)
**Impact:** Fixes ~25 errors across 5 files
```typescript
export enum ActionType {
  // Existing values...
  CREATE = 'CREATE',
  READ = 'READ',
  // Add these:
  SEARCH = 'SEARCH',
  QUERY = 'QUERY',
  EXECUTE = 'EXECUTE',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  RAG_QUERY = 'RAG_QUERY',
  REQUEST_ELEVATION = 'REQUEST_ELEVATION',
  VIEW_ELEVATION_REQUESTS = 'VIEW_ELEVATION_REQUESTS',
  APPROVE_ELEVATION = 'APPROVE_ELEVATION',
  REVOKE_ELEVATION = 'REVOKE_ELEVATION',
  VIEW_ACTIVE_ELEVATIONS = 'VIEW_ACTIVE_ELEVATIONS',
  CERTIFY = 'CERTIFY',
  CREATE_CATEGORY = 'CREATE_CATEGORY'
}
```

### 3. Install Missing LangChain Dependencies ⭐⭐⭐
**Command:**
```bash
npm install @langchain/core @langchain/community @langchain/openai @langchain/anthropic
```
**Impact:** Fixes 18 TS2307 module not found errors

### 4. Fix VectorSearchService Usage ⭐⭐
**Files:**
- src/routes/ai-search.ts
- src/routes/ai-chat.ts
- src/routes/ai-insights.routes.ts

**Problem:** Calling static methods that don't exist
```typescript
// Current (wrong):
await VectorSearchService.search(...)

// Fix Option A - Make instantiable:
const vectorSearch = new VectorSearchService();
await vectorSearch.search(...)

// Fix Option B - Add static methods to class
```

### 5. Update Vehicle Interface ⭐⭐
**File:** `src/types/vehicle.ts` (or wherever Vehicle is defined)
**Impact:** Fixes errors in EmulatorOrchestrator
```typescript
export interface Vehicle {
  // Existing properties...
  id: string;
  // Add these:
  isElectric?: boolean;
  location?: { lat: number; lng: number };
  driverId?: string;
}
```

### 6. Fix Inspection Model Properties ⭐⭐
**File:** `src/repositories/InspectionRepository.ts`
**Problem:** Using properties that don't exist on Inspection type
```typescript
// Add to Inspection interface:
interface InspectionStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  overdue: number;
}
```

### 7. Add User Properties to Auth User Type ⭐⭐
**File:** `src/types/user.ts` or `src/middleware/auth.ts`
**Impact:** Fixes ~10 errors in mobile routes
```typescript
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  // Add these:
  tenantId?: string;  // alias for tenant_id
  userId?: string;    // alias for id
  scope_level?: string;
  team_driver_ids?: string[];
}
```

### 8. Fix Error Handling Type Guards ⭐
**Pattern to use everywhere:**
```typescript
// Instead of:
catch (error) {
  res.status(500).json({ error: error.message });
}

// Use:
catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({ error: message });
}
```

### 9. Fix ParsedQs Type Issues ⭐
**Files:** attachments.routes.ts, damage-reports.ts
**Solution:** Add type guards for query parameters
```typescript
// Instead of:
const limit = req.query.limit || 50;

// Use:
const limit = typeof req.query.limit === 'string'
  ? parseInt(req.query.limit, 10)
  : 50;
```

### 10. Fix EV Charging Types ⭐
**File:** `src/emulators/evcharging/EVChargingEmulator.ts`
**Problem:** Missing exports from types
```typescript
// In src/emulators/types.ts, add:
export interface EVChargingSession { /* ... */ }
export interface ChargingStation { /* ... */ }
export interface BatteryHealth { /* ... */ }
```

---

## Quick Stats by Agent Area

| Agent Focus | Error Count | Priority | Est. Time |
|-------------|-------------|----------|-----------|
| Type Definitions | 170 | P1 | 1-2 hours |
| Dependencies | 18 | P1 | 15 min |
| Service Architecture | 35 | P2 | 1-2 hours |
| Model Updates | 35 | P2 | 1 hour |
| Error Handling | 20+ | P3 | 1 hour |

---

## Success Criteria

After fixes, running `npm run build` should show:
- ✅ 0 TypeScript errors
- ✅ dist/ directory generated
- ✅ All services type-safe
- ✅ Ready for testing

---

## Commands to Run After Fixes

```bash
# 1. Pull latest changes
git pull origin stage-a/requirements-inception

# 2. Install any new dependencies
npm install

# 3. Build
npm run build

# 4. Verify success
echo "Exit code: $?"
ls -la dist/

# 5. Optional: Run linter
npm run lint

# 6. Optional: Run tests
npm test
```

---

**Created By:** Agent 5 - Build Verification
**Date:** 2025-11-21
**Branch:** stage-a/requirements-inception
