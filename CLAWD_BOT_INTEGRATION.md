# 🤖 CLAWS.BOT Integration - Fleet-CTA

**Anti-Hallucination AI System for Fleet-CTA Development**

---

## ✅ Integration Complete

CLAWS.BOT is now integrated with Fleet-CTA! Use it to finish incomplete features, fix errors, add tests, and more - all with **ACTUAL verification** (not AI hallucinations).

---

## 🚀 Quick Start

### Method 1: NPM Scripts (Recommended)

```bash
# Verify all code is correct
npm run claws:verify

# Finish incomplete features
npm run claws:finish

# Fix all errors and warnings
npm run claws:fix

# Add comprehensive test coverage
npm run claws:test

# Fix security vulnerabilities
npm run claws:secure

# Custom task
npm run claws -- "Your custom task here" --validate
```

### Method 2: Direct Wrapper Script

```bash
# Use the claws.sh wrapper
./claws.sh "Complete the vehicle tracking feature"
```

### Method 3: Direct Command

```bash
npx tsx /Users/andrewmorton/Documents/GitHub/CLAWS.BOT/claws-cli.ts \
  "Your task" \
  --project . \
  --validate
```

---

## 📋 Fleet-CTA Specific Examples

### Finish Incomplete Features

```bash
npm run claws:finish

# Or be specific:
npm run claws -- "Complete the 3D vehicle viewer feature in src/components/visualizations/Vehicle3DViewer.tsx - add missing controls, lighting, and interaction handlers" --validate
```

### Fix TypeScript Errors

```bash
npm run claws:fix

# Or target specific issues:
npm run claws -- "Fix all TypeScript errors in src/pages/ - especially type mismatches between PostgreSQL ids (numbers) and component expectations (strings)" --validate
```

### Add Missing Tests

```bash
npm run claws:test

# Or target specific areas:
npm run claws -- "Add comprehensive Vitest tests for all components in src/components/modules/fleet/ - target 80% coverage" --validate
```

### Fix Security Issues

```bash
npm run claws:secure

# Or be specific:
npm run claws -- "Fix all npm audit vulnerabilities, update packages safely, ensure CORS and authentication remain secure" --validate
```

### Complete Specific Modules

```bash
# Complete charging infrastructure module
npm run claws -- "Complete the EV charging integration in src/components/modules/charging/ - implement real-time charging status, cost calculations, and station finder" --validate

# Complete compliance features
npm run claws -- "Finish the compliance hub in src/pages/ComplianceHub.tsx - add missing DVIR integration, inspection scheduling, and violation tracking" --validate

# Complete driver management
npm run claws -- "Complete driver onboarding workflow in src/components/modules/drivers/ - add document upload, verification, and training tracking" --validate
```

### Fix Database Integration Issues

```bash
npm run claws -- "Fix database integration issues - ensure api-standalone/ API endpoints correctly handle PostgreSQL responses, fix ID type mismatches (number vs string), add proper error handling" --validate
```

### Improve Performance

```bash
npm run claws -- "Optimize Fleet-CTA performance - implement React.memo() for expensive components, add virtualization for large vehicle lists, optimize re-renders in FleetHub" --validate
```

---

## 🔍 What CLAWS.BOT Will Do

When you run CLAWS.BOT on Fleet-CTA, it will:

### 1. Analyze Your Code (AST Parsing)
- Parse all TypeScript/React files with @babel/parser
- Build actual dependency graph
- Understand component structure, props, hooks
- Identify incomplete features, missing implementations

### 2. Complete the Work
- Implement missing features
- Fix errors and warnings
- Add comprehensive tests
- Update documentation

### 3. ACTUALLY Verify Everything
- **TypeScript Compiler**: Run `tsc --noEmit` to verify compilation
- **Vitest**: Run tests to verify they pass
- **ESLint**: Run linter to verify code quality
- **npm audit**: Scan for security vulnerabilities

### 4. Show Proof
```
🔍 VALIDATION: starting ACTUAL verification

✅ CHECKPOINT 1: Code Compilation
   ACTUALLY running: npx tsc --noEmit
   Result: ✅ Compilation successful
   Verified: true

🧪 CHECKPOINT 2: Test Execution
   ACTUALLY running: npx vitest run
   Result:
   ═══════════════════════════════════
   Test Files: 12 passed (12)
   Tests: 87 passed (87)
   Duration: 12.4s
   ═══════════════════════════════════
   Verified: ✅ true

🔒 CHECKPOINT 3: Security Scan
   ACTUALLY running: npm audit
   Result: 0 vulnerabilities
   Verified: ✅ true

📊 Trust Score: 1.00 (100% - all claims matched reality)
```

---

## 🎯 Fleet-CTA Architecture Context

CLAWS.BOT understands Fleet-CTA's architecture:

### Frontend Structure
- **React 18 + TypeScript + Vite**
- **UI**: shadcn/ui components, Tailwind CSS v4
- **State**: React Context, TanStack Query, Zustand
- **Routing**: React Router v7
- **3D**: Three.js, React Three Fiber
- **Maps**: Google Maps API, React Google Maps
- **Charts**: Recharts, AG Grid

### Backend Structure
- **api-standalone/**: Express.js + PostgreSQL
- **Database**: PostgreSQL (Docker)
- **API**: REST endpoints at `/api/*`

### Key Patterns
- Path aliases: `@/` → `src/`
- Lazy loading with React.lazy()
- Demo mode: `VITE_USE_MOCK_DATA=true`
- ID types: PostgreSQL returns numbers, frontend may expect strings

---

## 💡 Common Fleet-CTA Tasks

### Complete 3D Vehicle Viewer
```bash
npm run claws -- "Complete the 3D vehicle viewer in src/components/visualizations/Vehicle3DViewer.tsx:
1. Add orbit controls for camera manipulation
2. Implement proper lighting (ambient + directional)
3. Add vehicle model loader for GLB/GLTF files
4. Add loading states and error handling
5. Write Vitest tests
Verify everything compiles and tests pass." --validate
```

### Fix FleetHub Performance
```bash
npm run claws -- "Optimize FleetHub performance in src/pages/FleetHub.tsx:
1. Memoize VehicleList component
2. Add virtualization for large vehicle arrays
3. Optimize re-renders with React.memo()
4. Add loading skeletons
5. Verify no performance regressions with tests" --validate
```

### Complete API Integration
```bash
npm run claws -- "Complete API integration between frontend and api-standalone/:
1. Fix ID type mismatches (PostgreSQL number vs React string)
2. Add proper error handling for all API calls
3. Implement retry logic with exponential backoff
4. Add request/response logging
5. Write integration tests
6. Verify with actual API calls" --validate
```

### Add Accessibility Features
```bash
npm run claws -- "Improve accessibility across Fleet-CTA:
1. Add ARIA labels to all interactive elements
2. Ensure keyboard navigation works everywhere
3. Fix color contrast issues
4. Add screen reader support
5. Run axe-core tests and fix all issues
6. Verify with test:a11y" --validate
```

### Complete Compliance Module
```bash
npm run claws -- "Complete compliance module in src/components/modules/compliance/:
1. Implement DVIR (Driver Vehicle Inspection Report) forms
2. Add HOS (Hours of Service) tracking
3. Implement violation management
4. Add compliance reports and exports
5. Write comprehensive tests
6. Verify all features work" --validate
```

---

## 📊 Configuration

### .clawsrc.json

Your Fleet-CTA configuration:

```json
{
  "clawsbot": {
    "verification": {
      "enabled": true,
      "tools": ["vitest", "eslint", "npm-audit", "tsc"],
      "trustScoreThreshold": 0.8,
      "failOnLowTrust": false
    },
    "project": {
      "type": "react-vite-typescript",
      "testFramework": "vitest",
      "linter": "eslint",
      "packageManager": "npm"
    }
  }
}
```

### Customize for Your Needs

Edit `.clawsrc.json` to adjust:
- Trust score threshold (0.8 = 80% of claims must match reality)
- Verification tools
- Logging level
- Timeout values

---

## 🧪 Verify Integration Works

Test that CLAWS.BOT is working:

```bash
# Quick verification test
npm run claws -- "Analyze Fleet-CTA and create a detailed report of:
1. All TypeScript compilation errors
2. Missing test coverage
3. Security vulnerabilities
4. Incomplete features
5. Code quality issues
Verify by actually running tsc, vitest, npm audit, and eslint." --validate
```

You should see:
- ✅ AST parsing of all files
- ✅ Actual TypeScript compiler output
- ✅ Actual Vitest test results
- ✅ Actual npm audit results
- ✅ Actual ESLint output
- ✅ Trust score calculation
- ✅ Complete proof

---

## 📖 Next Steps

### 1. Run a Quick Verification
```bash
npm run claws:verify
```

### 2. Complete High-Priority Features
Review the incomplete features report and use CLAWS.BOT to finish them:
```bash
npm run claws:finish
```

### 3. Fix All Errors
```bash
npm run claws:fix
```

### 4. Add Test Coverage
```bash
npm run claws:test
```

### 5. Production Readiness
```bash
npm run claws -- "Prepare Fleet-CTA for production:
1. Fix all TypeScript errors
2. Achieve 80% test coverage
3. Fix all security vulnerabilities
4. Optimize performance (lazy loading, memoization)
5. Add comprehensive error handling
6. Verify everything actually works" --validate
```

---

## 🔧 Troubleshooting

### "Module not found" Error

Make sure CLAWS.BOT is built:
```bash
cd /Users/andrewmorton/Documents/GitHub/CLAWS.BOT
npm install
npm run build
```

### Verification Failing

This is GOOD! It means CLAWS.BOT found issues. Check:
```bash
cat claws-reports/verification-*.log
```

Look for actual tool outputs showing real errors.

### Trust Score Low

This means AI claims didn't match reality. Review the discrepancies:
- Claimed: [what AI said]
- Actual: [what tools found]

This is the anti-hallucination system working correctly!

---

## 📚 More Information

### CLAWS.BOT Documentation
- **Repository**: https://github.com/asmortongpt/CLAWS.BOT
- **Quick Integration**: /Users/andrewmorton/Documents/GitHub/CLAWS.BOT/QUICK_INTEGRATION.md
- **Complete Guide**: /Users/andrewmorton/Documents/GitHub/CLAWS.BOT/INTEGRATION_GUIDE.md
- **Proof It Works**: /Users/andrewmorton/Documents/GitHub/CLAWS.BOT/TESTING_COMPLETE.md

### Fleet-CTA Documentation
- **Architecture**: See CLAUDE.md in this directory
- **Contributing**: See CONTRIBUTING.md
- **Development**: See README.md

---

## ✅ Summary

**CLAWS.BOT is now integrated with Fleet-CTA!**

### Quick Commands:
```bash
npm run claws:verify    # Verify all code
npm run claws:finish    # Finish incomplete work
npm run claws:fix       # Fix all errors
npm run claws:test      # Add comprehensive tests
npm run claws:secure    # Fix security issues
```

### What Makes It Special:
- ✅ ACTUALLY runs TypeScript compiler
- ✅ ACTUALLY runs Vitest tests
- ✅ ACTUALLY runs ESLint
- ✅ ACTUALLY runs npm audit
- ✅ ACTUALLY verifies everything works
- ✅ Shows complete proof (no hallucinations)
- ✅ Tracks trust score (claimed vs actual)

**Start using it now:**
```bash
npm run claws:verify
```

---

**Built by Capital Tech Alliance**
**Powered by CLAWS.BOT** - Stop trusting AI blindly. Start verifying everything. ✅
