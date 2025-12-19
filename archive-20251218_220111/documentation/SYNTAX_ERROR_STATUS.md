# API Server Syntax Error Status

## Current Situation
The API server won't start due to multiple syntax errors where backticks (`) are being used instead of single quotes (') in SQL query strings across multiple route files.

## Errors Found
1. `/api/src/routes/auth.ts:288` - Unterminated string literal
2. `/api/src/routes/auth.ts:450` - Unterminated string literal
3. `/api/src/routes/microsoft-auth.ts:82` - Expected ")" but found "SELECT"
4. `/api/src/routes/microsoft-auth.ts:133` - Expected ")" but found "SSO" (FIXED)
5. `/api/src/routes/vehicles.ts:203` - Expected "}" but found "vehicles"

## Fixes Applied
- ✅ `api/src/server.ts:7` - Fixed dotenv.config() to use `process.cwd()` instead of `__dirname`
- ✅ `api/src/routes/auth.ts:288` - Changed ending backtick to single quote (ATTEMPTED - not working)
- ✅ `api/src/routes/auth.ts:450` - Changed ending backtick to single quote (ATTEMPTED - not working)
- ✅ `api/src/routes/microsoft-auth.ts:80` - Fixed mixed quotes in console.log
- ✅ `api/src/routes/microsoft-auth.ts:133` - Changed `SSO` and `microsoft` backticks to single quotes

## Root Cause
SQL query strings wrapped in template literals (backticks) contain string values that should use single quotes but are incorrectly using backticks, causing syntax errors.

## Recommended Solution
Use the autonomous-coder agent to systematically search all route files for SQL queries and fix quote mismatches:

```bash
npx tsx azure-agents/orchestrate.ts "Fix all SQL quote syntax errors in api/src/routes/*.ts files"
```

Or manually search and replace using regex:
```bash
# Find all instances where backticks are incorrectly used in SQL
grep -rn "\`[A-Z]" api/src/routes/*.ts
```

## Status
❌ **BLOCKED** - Server cannot start until all syntax errors are fixed
