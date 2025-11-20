# Quick Guide to Fix Remaining 510 TypeScript Errors

## Immediate Quick Fixes (Can be automated)

### 1. Install Missing Type Packages (fixes 3 errors)
```bash
npm install --save-dev @types/jest-axe
```

### 2. Fix Test Files - Minimal Objects (fixes ~50 errors)

Replace this pattern in test files:
```typescript
// BEFORE: Partial object causes TS2741 errors
const vehicle: Vehicle = { id: '1', name: 'Test', type: 'sedan' }

// AFTER: Use Partial<> or as const assertion
const vehicle = { id: '1', name: 'Test', type: 'sedan' as const }
// OR
const vehicle: Partial<Vehicle> & { id: string } = { id: '1', name: 'Test', type: 'sedan' }
```

### 3. Fix Type String Literals (fixes ~20 errors)

```typescript
// BEFORE: src/components/__tests__/accessibility.test.tsx(33,5)
type: "car"  // Error: "car" not in type union

// AFTER:
type: "sedan" // Use valid type from Vehicle type union
```

### 4. Add Optional Chaining (fixes ~75 errors - TS18046, TS18048)

Auto-fix with this regex replacement:
```bash
# Find: (\w+)\.location\.(\w+)
# Replace: $1.location?.$2
```

Example:
```typescript
// BEFORE
vehicle.location.lat

// AFTER
vehicle.location?.lat
```

### 5. Add Missing Properties to Test Mocks (fixes ~40 errors)

```typescript
// BEFORE: Causes TS2741, TS2739
const camera: TrafficCamera = {
  id: '1',
  name: 'Camera 1',
  latitude: 40.7,
  longitude: -74.0
}

// AFTER: Add required fields
const camera: TrafficCamera = {
  id: '1',
  sourceId: 'test',
  externalId: 'cam-1',
  name: 'Camera 1',
  latitude: 40.7,
  longitude: -74.0,
  enabled: true,
  operational: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

## Component Prop Fixes (fixes ~100 errors - TS2322)

Many components don't accept `data` prop. Two solutions:

### Solution A: Add data prop to component interfaces
```typescript
// In component file
export interface FleetDashboardProps {
  data?: any // Add this
  // ... other props
}
```

### Solution B: Pass props individually (RECOMMENDED)
```typescript
// BEFORE: App.tsx(103,36)
<FleetDashboard data={fleetData} />

// AFTER:
<FleetDashboard
  vehicles={fleetData.vehicles}
  drivers={fleetData.drivers}
  facilities={fleetData.facilities}
/>
```

## Type Unknown Assertions (fixes ~15 errors - TS18046)

```typescript
// BEFORE: ConversationalIntake.tsx(87,18)
if (response.success) // Error: response is unknown

// AFTER: Type assertion or type guard
if ((response as { success?: boolean }).success)
// OR better:
interface ResponseType {
  success: boolean
  data?: any
}
const typedResponse = response as ResponseType
if (typedResponse.success)
```

## Missing Name Declarations (fixes 16 errors - TS2304)

Create type declarations file:

**src/types/global.d.ts:**
```typescript
declare module 'jest-axe' {
  export const axe: any
  export function toHaveNoViolations(): any
}

// For test mocks
declare const mockLeaflet: any
declare const mockGoogleMaps: any
```

## Automated Fix Script

**fix-remaining-errors.sh:**
```bash
#!/bin/bash

# 1. Install missing types
npm install --save-dev @types/jest-axe

# 2. Fix optional chaining in all files
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/\(\w\+\)\.location\.\(\w\+\)/\1.location?.\2/g'

# 3. Run TypeScript to see progress
./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS"
```

## Priority Order

1. **Install types** (1 minute) → Fixes 3 errors
2. **Add global.d.ts** (5 minutes) → Fixes 16 errors
3. **Fix optional chaining** (10 minutes) → Fixes 75 errors
4. **Fix test file type literals** (15 minutes) → Fixes 20 errors
5. **Add missing test properties** (30 minutes) → Fixes 40 errors
6. **Refactor component props** (60 minutes) → Fixes 100 errors
7. **Add type assertions** (30 minutes) → Fixes 20 errors
8. **Manual fixes for edge cases** (60 minutes) → Fixes remaining

**Total estimated time: 3-4 hours to reach 0 errors**

## Files to Focus On

### High Error Count Files (fix these first):
1. **src/components/__tests__/accessibility.test.tsx** (~30 errors)
2. **src/App.tsx** (~15 errors)
3. **src/components/LeafletMap.tsx** (~20 errors)
4. **src/components/GoogleMap.tsx** (~15 errors)
5. **src/components/ai/ConversationalIntake.tsx** (~10 errors)

### Error Distribution:
- **Test files (.test.tsx):** ~200 errors (use Partial<> types)
- **Component files:** ~150 errors (fix props, add optional chaining)
- **Hook files:** ~50 errors (type assertions)
- **Utility files:** ~110 errors (various)

## Verification Commands

After each fix batch:
```bash
# Count remaining errors
./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS"

# Show error breakdown
./node_modules/.bin/tsc --noEmit 2>&1 | grep "error TS" | sed 's/.*error \(TS[0-9]*\).*/\1/' | sort | uniq -c | sort -rn

# Test specific file
./node_modules/.bin/tsc --noEmit src/App.tsx
```

## Success Checklist

- [ ] Error count below 100
- [ ] All test files compiling
- [ ] All component files compiling
- [ ] No console errors in dev mode
- [ ] Build succeeds: `npm run build`
- [ ] Final count: 0 errors

## Commit Strategy

Commit after each major reduction:
- After reaching <400 errors
- After reaching <200 errors
- After reaching <100 errors
- Final commit at 0 errors

Each commit message should include error count reduction.
