# Quick Fix Guide for Common ESLint/TypeScript Errors

## Floating Promises (67 errors)

### Error Message
```
Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator
```

### Fixes

**Option 1: Await (if in async function)**
```typescript
// Before
someAsyncFunction();

// After
await someAsyncFunction();
```

**Option 2: Void (fire-and-forget)**
```typescript
// Before
trackEvent('user-action');

// After
void trackEvent('user-action');
```

**Option 3: Add error handler**
```typescript
// Before
sendNotification(user);

// After
sendNotification(user).catch(err => logger.error('Failed to send notification', err));
```

---

## Unsafe Regex (11 errors)

### Error Message
```
security/detect-unsafe-regex: Unsafe Regular Expression
```

### Fix
Avoid nested quantifiers that can cause exponential backtracking:

```typescript
// BAD - Can cause ReDoS attack
const bad = /^(a+)+$/;
const bad2 = /(x+)x+$/;

// GOOD
const good = /^a+$/;
const good2 = /^x+$/;
```

**Tool:** Use https://devina.io/redos-checker to validate regex

---

## Promise Always Return (5 errors)

### Error Message
```
promise/always-return: Each then() should return a value or throw
```

### Fix
```typescript
// Before
promise.then(value => {
  doSomething(value);
}); // ERROR: No return

// After
promise.then(value => {
  doSomething(value);
  return value;
});

// Or if no return value needed
promise.then(value => {
  doSomething(value);
  return undefined;
});
```

---

## No Prototype Builtins (10 errors)

### Error Message
```
Do not access Object.prototype method 'hasOwnProperty' from target object
```

### Fix
```typescript
// Before
if (obj.hasOwnProperty('key')) { }

// After
if (Object.hasOwn(obj, 'key')) { }

// Or for older Node versions
if (Object.prototype.hasOwnProperty.call(obj, 'key')) { }
```

---

## No Case Declarations (10 errors)

### Error Message
```
Unexpected lexical declaration in case block
```

### Fix
```typescript
// Before
switch (type) {
  case 'A':
    const x = 1; // ERROR
    break;
  case 'B':
    const x = 2; // ERROR: redeclared
    break;
}

// After
switch (type) {
  case 'A': {
    const x = 1;
    break;
  }
  case 'B': {
    const x = 2;
    break;
  }
}
```

---

## TypeScript: Possibly Null (300 errors)

### Error Message
```
TS18047: 'variable' is possibly 'null'
```

### Fixes

**Option 1: Nullish coalescing**
```typescript
// Before
const count = result.rowCount; // ERROR: possibly null

// After
const count = result.rowCount ?? 0;
```

**Option 2: Optional chaining**
```typescript
// Before
const name = user.profile.name; // ERROR: profile possibly null

// After
const name = user.profile?.name ?? 'Unknown';
```

**Option 3: Type guard**
```typescript
// Before
const count = result.rowCount; // ERROR

// After
if (result.rowCount !== null) {
  const count = result.rowCount; // OK
}
```

---

## TypeScript: Possibly Undefined (250 errors)

### Error Message
```
TS18048: 'variable' is possibly 'undefined'
```

### Fixes

**Option 1: Nullish coalescing**
```typescript
// Before
const name = config.name; // ERROR: possibly undefined

// After
const name = config.name ?? 'default';
```

**Option 2: Type narrowing**
```typescript
// Before
if (items.length > 0) {
  const first = items[0]; // ERROR: possibly undefined
}

// After
if (items.length > 0) {
  const first = items[0]!; // Non-null assertion
  // OR
  const first = items.at(0);
  if (first !== undefined) {
    // use first
  }
}
```

---

## TypeScript: Implicit Any (200 errors)

### Error Message
```
TS7006: Parameter 'x' implicitly has an 'any' type
```

### Fix
```typescript
// Before
function process(data) { } // ERROR

// After
function process(data: unknown) { }
// OR
function process(data: any) { } // if truly unknown type
// OR
function process(data: MyType) { } // best option
```

---

## TypeScript: Type Mismatch (400 errors)

### Error Message
```
TS2322: Type 'X' is not assignable to type 'Y'
```

### Common Fixes

**null vs string:**
```typescript
// Before
const id: string = userId; // ERROR: userId is string | null

// After
const id: string = userId ?? '';
// OR
const id: string | null = userId;
```

**number vs string:**
```typescript
// Before
const port: number = process.env.PORT; // ERROR: string | undefined

// After
const port: number = parseInt(process.env.PORT ?? '3000', 10);
```

---

## Batch Fixing Strategy

### 1. Find all instances of an error type
```bash
npm run lint 2>&1 | grep "no-floating-promises" > floating-promises.txt
```

### 2. Group by file
```bash
npm run lint 2>&1 | grep "no-floating-promises" | cut -d: -f1 | sort | uniq -c
```

### 3. Fix file by file
Start with files that have the most errors

### 4. Test after each file
```bash
npm run lint -- --quiet
npm run build
npm test
```

---

## VS Code Tips

### Quick Fix
1. Place cursor on error
2. Press `Cmd+.` (Mac) or `Ctrl+.` (Windows)
3. Select suggested fix

### Multi-cursor Editing
1. Select error line
2. Press `Cmd+D` repeatedly to select similar occurrences
3. Edit all at once

### Find and Replace with Regex
1. Press `Cmd+Shift+F`
2. Enable regex mode (.*) button
3. Use capture groups for complex replacements

Example:
```
Find: obj\.hasOwnProperty\(([^)]+)\)
Replace: Object.hasOwn(obj, $1)
```

---

## Testing Changes

### Run ESLint on specific file
```bash
npx eslint src/path/to/file.ts
```

### Run ESLint with auto-fix
```bash
npx eslint src/path/to/file.ts --fix
```

### Check TypeScript compilation
```bash
npx tsc --noEmit
```

### Run tests
```bash
npm test
```

---

## Commit Message Template

```
fix: Resolve [error-type] in [module-name]

- Fixed [count] instances of [error-type]
- [Specific changes made]

Files modified:
- src/path/to/file1.ts
- src/path/to/file2.ts

✅ ESLint errors: [before] → [after]
✅ Tests passing
```

---

## Get Help

1. Check `CODE_QUALITY_REPORT.md` for detailed explanations
2. Search ESLint docs: https://eslint.org/docs/latest/rules/
3. Search TypeScript docs: https://www.typescriptlang.org/docs/
4. Ask in team chat

---

**Last Updated:** 2026-01-02
