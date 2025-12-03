# ESLint Configuration Guide

## Overview

This project uses a comprehensive ESLint configuration with **6 major plugin categories** to ensure code quality, security, and accessibility.

## Table of Contents

1. [Installed Plugins](#installed-plugins)
2. [Running ESLint](#running-eslint)
3. [Rule Categories](#rule-categories)
4. [IDE Integration](#ide-integration)
5. [CI/CD Integration](#cicd-integration)
6. [Disabling Rules](#disabling-rules)
7. [Troubleshooting](#troubleshooting)

---

## Installed Plugins

### Core Plugins
- **eslint** (v9.28.0) - Base ESLint engine
- **typescript-eslint** (v8.38.0) - TypeScript support
- **@eslint/js** - JavaScript recommended rules

### React Plugins
- **eslint-plugin-react-hooks** (v5.2.0) - React Hooks validation
- **eslint-plugin-react-refresh** (v0.4.19) - Fast Refresh compatibility

### Code Quality Plugins
- **eslint-plugin-unused-imports** (v4.3.0) - Detect and remove unused imports
- **eslint-plugin-import** (v2.32.0) - Import ordering and validation

### Security & Accessibility
- **eslint-plugin-security** (v3.0.1) - Security vulnerability detection
- **eslint-plugin-jsx-a11y** (v6.10.2) - Accessibility (WCAG) compliance

### Framework Support
- **eslint-plugin-storybook** (v10.0.7) - Storybook best practices

---

## Running ESLint

### Basic Commands

```bash
# Lint all files
npm run lint

# Auto-fix issues where possible
npm run lint:fix

# Generate HTML report
npm run lint:report
# Opens: eslint-report.html

# Lint specific directory
npm run lint -- "src/components/**/*.tsx"

# Lint single file
npm run lint -- "src/App.tsx"
```

### Command Line Options

```bash
# Show only errors (hide warnings)
npm run lint -- --quiet

# Show max warnings
npm run lint -- --max-warnings 0

# Fix specific file
npm run lint -- --fix "src/App.tsx"

# Debug ESLint configuration
npm run lint -- --print-config src/App.tsx
```

---

## Rule Categories

### 1. React Hooks Rules (CRITICAL)

These rules prevent common React pitfalls and dependency issues.

```javascript
'react-hooks/rules-of-hooks': 'error',        // Enforce hooks rules
'react-hooks/exhaustive-deps': 'warn',        // Check effect dependencies
```

**What they catch:**
- ❌ Hooks called in conditionals/loops
- ❌ Missing dependencies in useEffect/useCallback/useMemo
- ❌ Hooks called outside components/custom hooks

**Example violations:**

```typescript
// ❌ BAD: Hook in conditional
function Component() {
  if (condition) {
    const [state] = useState() // ERROR!
  }
}

// ✅ GOOD: Hook at top level
function Component() {
  const [state] = useState()
  if (condition) {
    // use state
  }
}

// ❌ BAD: Missing dependency
useEffect(() => {
  fetchData(userId)
}, []) // WARNING: userId should be in deps

// ✅ GOOD: All dependencies included
useEffect(() => {
  fetchData(userId)
}, [userId, fetchData])
```

---

### 2. Unused Code Detection

Auto-removes unused imports and detects unused variables.

```javascript
'unused-imports/no-unused-imports': 'error',
'@typescript-eslint/no-unused-vars': ['warn', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
}]
```

**What they catch:**
- ❌ Unused imports
- ❌ Unused variables (except those starting with `_`)
- ❌ Unused function parameters (except those starting with `_`)

**Example violations:**

```typescript
// ❌ BAD: Unused import
import { unused } from 'react'  // ERROR: Auto-removed

// ✅ GOOD: Mark as intentionally unused
function Component(_unusedProp: string) {
  // No warning for _unusedProp
}
```

**Auto-fix:**
```bash
npm run lint:fix  # Automatically removes unused imports
```

---

### 3. Import Ordering

Enforces consistent import organization.

```javascript
'import/order': ['warn', {
  groups: [
    'builtin',   // Node built-ins (fs, path)
    'external',  // npm packages (react, etc)
    'internal',  // @/ imports
    'parent',    // ../
    'sibling',   // ./
    'index'      // ./index
  ],
  'newlines-between': 'always',
  alphabetize: { order: 'asc', caseInsensitive: true }
}]
```

**Example violations:**

```typescript
// ❌ BAD: Wrong order
import { Button } from '@/components/ui/button'
import React from 'react'  // Should be first!

// ✅ GOOD: Correct order with spacing
import React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useFleetData } from '../hooks/use-fleet-data'

import './styles.css'
```

**Additional rules:**
- `import/no-duplicates` - Merge duplicate imports
- `import/first` - All imports at top of file
- `import/newline-after-import` - Blank line after imports

---

### 4. Accessibility Rules (WCAG Compliance)

18 rules ensuring WCAG 2.1 Level AA compliance.

**Critical (error level):**
```javascript
'jsx-a11y/alt-text': 'error',                      // Images must have alt text
'jsx-a11y/aria-props': 'error',                    // Valid ARIA properties
'jsx-a11y/aria-proptypes': 'error',                // ARIA prop types correct
'jsx-a11y/aria-unsupported-elements': 'error',     // ARIA on supported elements
'jsx-a11y/iframe-has-title': 'error',              // iframes must have title
'jsx-a11y/role-has-required-aria-props': 'error',  // Required ARIA props
'jsx-a11y/role-supports-aria-props': 'error',      // Valid ARIA props for role
```

**Warnings:**
```javascript
'jsx-a11y/click-events-have-key-events': 'warn',   // Keyboard accessibility
'jsx-a11y/interactive-supports-focus': 'warn',     // Focusable interactive elements
'jsx-a11y/label-has-associated-control': 'warn',   // Labels for form controls
'jsx-a11y/no-autofocus': 'warn',                   // Avoid autofocus
'jsx-a11y/no-static-element-interactions': 'warn', // Semantic HTML
'jsx-a11y/anchor-is-valid': 'warn',                // Valid anchor hrefs
'jsx-a11y/heading-has-content': 'warn',            // Headings not empty
'jsx-a11y/img-redundant-alt': 'warn',              // Alt text quality
'jsx-a11y/mouse-events-have-key-events': 'warn',   // Keyboard alternatives
'jsx-a11y/no-access-key': 'warn',                  // Avoid accesskey
'jsx-a11y/tabindex-no-positive': 'warn',           // Natural tab order
```

**Example violations:**

```typescript
// ❌ BAD: Missing alt text
<img src="car.jpg" />  // ERROR

// ✅ GOOD: Has alt text
<img src="car.jpg" alt="Red sedan vehicle #1234" />

// ❌ BAD: Click without keyboard
<div onClick={handleClick}>Click me</div>  // WARNING

// ✅ GOOD: Button is naturally keyboard accessible
<button onClick={handleClick}>Click me</button>

// ❌ BAD: Label without control
<label>Email</label>  // WARNING
<input type="email" />

// ✅ GOOD: Label associated with input
<label htmlFor="email">Email</label>
<input type="email" id="email" />
```

---

### 5. Security Rules

12 rules detecting common security vulnerabilities.

**Critical (error level):**
```javascript
'security/detect-unsafe-regex': 'error',              // ReDoS prevention
'security/detect-buffer-noassert': 'error',           // Buffer overflow
'security/detect-disable-mustache-escape': 'error',   // XSS prevention
'security/detect-eval-with-expression': 'error',      // Code injection
'security/detect-no-csrf-before-method-override': 'error',
'security/detect-pseudoRandomBytes': 'error',         // Weak crypto
```

**Warnings:**
```javascript
'security/detect-object-injection': 'warn',           // Prototype pollution
'security/detect-non-literal-regexp': 'warn',         // Dynamic regex
'security/detect-child-process': 'warn',              // Command injection
'security/detect-non-literal-fs-filename': 'warn',    // Path traversal
'security/detect-non-literal-require': 'warn',        // Module injection
'security/detect-possible-timing-attacks': 'warn',    // Timing attacks
```

**Example violations:**

```typescript
// ❌ BAD: SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`  // Never do this!

// ✅ GOOD: Parameterized query
const query = 'SELECT * FROM users WHERE id = $1'
await db.query(query, [userId])

// ❌ BAD: eval is dangerous
eval(userInput)  // ERROR

// ✅ GOOD: Use safe alternatives
JSON.parse(userInput)

// ❌ BAD: Weak random
crypto.pseudoRandomBytes(16)  // ERROR

// ✅ GOOD: Cryptographically secure
crypto.randomBytes(16)
```

---

### 6. TypeScript Rules

```javascript
'@typescript-eslint/no-explicit-any': 'warn',         // Avoid 'any' type
'@typescript-eslint/no-unused-vars': 'warn',          // Detect unused vars
```

**Example violations:**

```typescript
// ❌ BAD: Using 'any'
function process(data: any) {  // WARNING
  return data.value
}

// ✅ GOOD: Specific type
interface Data {
  value: string
}
function process(data: Data) {
  return data.value
}
```

---

### 7. General JavaScript Rules

```javascript
'no-console': ['warn', { allow: ['warn', 'error'] }],  // console.log warnings
'prefer-const': 'error',                                // Use const when possible
'no-var': 'error',                                      // No var, use let/const
```

---

## IDE Integration

### VS Code

1. **Install Extension:**
   - [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

2. **Configure Settings** (`.vscode/settings.json`):

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": true,
  "editor.formatOnSave": true
}
```

3. **Reload VS Code** after installing extension

**Features:**
- ✅ Real-time error highlighting
- ✅ Auto-fix on save
- ✅ Hover for rule documentation
- ✅ Quick fixes via lightbulb icon

---

### WebStorm / IntelliJ IDEA

1. **Enable ESLint:**
   - Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - Check "Automatic ESLint configuration"
   - Check "Run eslint --fix on save"

2. **Features:**
   - Real-time inspection
   - Auto-fix on save
   - Intention actions (Alt+Enter)

---

### Vim / Neovim

Use ALE or coc-eslint:

```vim
" ALE configuration
let g:ale_linters = {
\   'typescript': ['eslint'],
\   'typescriptreact': ['eslint'],
\}
let g:ale_fixers = {
\   'typescript': ['eslint'],
\   'typescriptreact': ['eslint'],
\}
let g:ale_fix_on_save = 1
```

---

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/lint.yml`:

```yaml
name: Lint

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint -- --max-warnings 0

      - name: Generate report
        if: failure()
        run: npm run lint:report

      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: eslint-report
          path: eslint-report.html
```

**Behavior:**
- ✅ Runs on every PR
- ✅ Fails if any errors exist
- ✅ Fails if warnings exceed threshold
- ✅ Uploads HTML report on failure

---

### Pre-commit Hook

Using Husky:

```bash
# Install Husky
npm install --save-dev husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run lint:fix"
```

**`.husky/pre-commit`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lint staged files
npm run lint:fix

# Re-add fixed files
git add -u
```

**Behavior:**
- ✅ Auto-fixes issues before commit
- ✅ Prevents commits with errors
- ✅ Maintains code quality

---

## Disabling Rules

### When to Disable Rules

**Rarely needed!** Only disable rules when:
1. Third-party code integration
2. Generated code
3. Temporary debugging
4. False positives (report to maintainers)

### How to Disable

**Disable for entire file:**
```typescript
/* eslint-disable import/order */
// Your code here
```

**Disable specific rule for file:**
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// Your code here
```

**Disable for single line:**
```typescript
const data: any = response.data  // eslint-disable-line @typescript-eslint/no-explicit-any
```

**Disable for next line:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response.data
```

**Disable multiple rules:**
```typescript
/* eslint-disable import/order, @typescript-eslint/no-explicit-any */
// Your code here
/* eslint-enable import/order, @typescript-eslint/no-explicit-any */
```

**Best Practice:**
Always add a comment explaining WHY:
```typescript
// ESLint disabled: Third-party API returns untyped data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = externalAPI.getData()
```

---

## Troubleshooting

### Issue: ESLint not running

**Solution:**
```bash
# Verify installation
npm list eslint

# Reinstall if needed
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: Rules not being applied

**Solution:**
```bash
# Verify configuration
npm run lint -- --print-config src/App.tsx

# Check if file is ignored
npm run lint -- --debug src/App.tsx
```

---

### Issue: Too many warnings

**Strategy:**

1. **Focus on errors first:**
```bash
npm run lint -- --quiet
```

2. **Fix auto-fixable issues:**
```bash
npm run lint:fix
```

3. **Fix incrementally by directory:**
```bash
npm run lint:fix -- "src/components/ui/**"
npm run lint:fix -- "src/hooks/**"
```

---

### Issue: Import order conflicts with Prettier

**Solution:**

ESLint's import ordering works alongside Prettier. If conflicts occur:

```bash
# Run Prettier first, then ESLint
npm run format  # Prettier
npm run lint:fix  # ESLint
```

---

## Complete Rule List

### React Hooks (2 rules)
- ✅ rules-of-hooks (error)
- ✅ exhaustive-deps (warn)

### Unused Code (2 rules)
- ✅ no-unused-imports (error)
- ✅ no-unused-vars (warn)

### Import Ordering (4 rules)
- ✅ import/order (warn)
- ✅ import/no-duplicates (warn)
- ✅ import/no-unused-modules (warn)
- ✅ import/first (warn)
- ✅ import/newline-after-import (warn)

### Accessibility (18 rules)
- ✅ alt-text (error)
- ✅ aria-props (error)
- ✅ aria-proptypes (error)
- ✅ aria-unsupported-elements (error)
- ✅ click-events-have-key-events (warn)
- ✅ interactive-supports-focus (warn)
- ✅ label-has-associated-control (warn)
- ✅ no-autofocus (warn)
- ✅ no-static-element-interactions (warn)
- ✅ anchor-is-valid (warn)
- ✅ heading-has-content (warn)
- ✅ iframe-has-title (error)
- ✅ img-redundant-alt (warn)
- ✅ mouse-events-have-key-events (warn)
- ✅ no-access-key (warn)
- ✅ role-has-required-aria-props (error)
- ✅ role-supports-aria-props (error)
- ✅ tabindex-no-positive (warn)

### Security (12 rules)
- ✅ detect-object-injection (warn)
- ✅ detect-non-literal-regexp (warn)
- ✅ detect-unsafe-regex (error)
- ✅ detect-buffer-noassert (error)
- ✅ detect-child-process (warn)
- ✅ detect-disable-mustache-escape (error)
- ✅ detect-eval-with-expression (error)
- ✅ detect-no-csrf-before-method-override (error)
- ✅ detect-non-literal-fs-filename (warn)
- ✅ detect-non-literal-require (warn)
- ✅ detect-possible-timing-attacks (warn)
- ✅ detect-pseudoRandomBytes (error)

### TypeScript (2 rules)
- ✅ no-explicit-any (warn)
- ✅ no-unused-vars (warn)

### General (3 rules)
- ✅ no-console (warn, allows warn/error)
- ✅ prefer-const (error)
- ✅ no-var (error)

**Total: 43 active rules across 6 categories**

---

## Quick Reference

### Common Commands
```bash
npm run lint              # Check all files
npm run lint:fix          # Auto-fix issues
npm run lint:report       # Generate HTML report
npm run lint -- --quiet   # Errors only
```

### Common Patterns
```typescript
// Unused variable with underscore prefix
const _unused = getValue()

// Intentionally any type with comment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = externalAPI()

// Accessibility-compliant image
<img src="car.jpg" alt="Red sedan" />

// Secure parameterized query
db.query('SELECT * FROM users WHERE id = $1', [userId])
```

---

## Support

- **ESLint Docs:** https://eslint.org/docs/latest/
- **TypeScript ESLint:** https://typescript-eslint.io/
- **jsx-a11y Rules:** https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
- **Security Plugin:** https://github.com/eslint-community/eslint-plugin-security

---

**Last Updated:** 2025-12-03
**Configuration Version:** 2.0.0
**ESLint Version:** 9.28.0
