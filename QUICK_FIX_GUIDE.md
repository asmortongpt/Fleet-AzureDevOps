# 🚀 QUICK FIX: React Query Error

**Error:** `Cannot read properties of null (reading 'useEffect')`

---

## ⚡ 2-Minute Fix

```bash
# Option 1: Automated (Recommended)
./fix_react_query.sh

# Option 2: Python Script
python3 nuclear_cache_clear.py

# Option 3: Manual
rm -rf node_modules/.vite-fleet node_modules/.vite dist
npm run dev
```

Then **clear browser cache** (Cmd+Shift+Delete) or use **Incognito mode**.

---

## 🔧 If Issue Persists

```bash
# Nuclear option - complete reinstall
./fix_react_query.sh --aggressive

# Or manually:
rm -rf node_modules/.vite-fleet node_modules/.vite node_modules
npm install
npm run dev
```

---

## 📋 Verification Checklist

After running fix:

- [ ] Stop all running Vite processes
- [ ] Clear server-side caches (automated by script)
- [ ] Clear browser cache or use Incognito
- [ ] Close all browser tabs with app
- [ ] Restart terminal
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Check console - NO errors expected
- [ ] Verify app loads without white screen
- [ ] Test navigation - HMR should work

---

## 🎯 Root Cause

**Problem:** Vite pre-bundled React Query BEFORE React was available, causing React Query to capture a null reference to React hooks.

**Fix:** Include React Query in `optimizeDeps.include` to bundle it WITH React.

---

## 📖 Complete Documentation

- **Recovery Plan:** `REACT_QUERY_RECOVERY_PLAN.md`
- **Technical Analysis:** `VITE_CACHE_ANALYSIS.md`
- **Python Script:** `nuclear_cache_clear.py`
- **Bash Script:** `fix_react_query.sh`
- **Fixed Config:** `vite.config.FIXED.ts`

---

## 🆘 Emergency Commands

```bash
# See what will be deleted (dry run)
./fix_react_query.sh --dry-run

# Stop Vite process
pkill -f vite

# Check for running Vite
pgrep -f vite

# Clear npm cache
npm cache clean --force

# Rebuild from scratch
rm -rf node_modules dist && npm install && npm run dev

# Check React version
npm list react

# Check for duplicate React
npm ls react

# Fix duplicate React
npm dedupe
```

---

## 🎓 Understanding the Fix

**Before (Broken):**
```
1. Browser loads vendor.js (no React)
2. React Query imports React → null
3. ERROR: Cannot read properties of null
```

**After (Fixed):**
```
1. Browser loads react-vendor.js (React ✅)
2. Browser loads react-utils.js (React Query ✅)
3. React Query imports React → success ✅
```

**Key Changes:**
- Use default cache dir (not custom)
- Include React Query in `optimizeDeps.include`
- Separate React and React Query into different chunks
- Force proper load order with `manualChunks`

---

## 🔍 Debug Commands

```bash
# Check Vite cache
ls -lh node_modules/.vite/deps/

# Check build output
npm run build && ls -lh dist/assets/js/

# Enable Vite debug mode
DEBUG=vite:* npm run dev

# Check bundle sizes
npm run build:analyze
```

---

## 📞 Support

If none of these work:

1. Check `package.json` - ensure React is 18.3.1+
2. Check `package.json` - ensure React Query is 5.83.1+
3. Run `npm dedupe` to fix duplicate dependencies
4. Delete `node_modules` and `package-lock.json`, reinstall
5. Check for OS-specific cache: `/tmp/vite*` (clear it)
6. Try different browser (to rule out browser-specific cache)

---

**Last Updated:** 2025-11-26
**Status:** Production Ready ✅
