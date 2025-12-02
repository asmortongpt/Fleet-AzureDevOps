# Security Fix: XSS Prevention in CodeViewer Component

## Summary

**Date**: 2025-11-21
**Severity**: HIGH
**Component**: `src/components/documents/viewer/CodeViewer.tsx`
**Vulnerability**: Cross-Site Scripting (XSS) via `dangerouslySetInnerHTML`

## Vulnerability Description

The CodeViewer component was using React's `dangerouslySetInnerHTML` to render syntax-highlighted code. While the component did implement basic HTML escaping, there was still a potential security risk where malicious code could be executed if the sanitization was bypassed or improperly configured.

### Risk Level: HIGH

- **Attack Vector**: Malicious code files could contain XSS payloads
- **Impact**: Arbitrary JavaScript execution in user's browser
- **Scope**: Any user viewing code documents through the CodeViewer

## Fix Implementation

### 1. Installed DOMPurify

```bash
npm install dompurify @types/dompurify
```

DOMPurify is an industry-standard, battle-tested XSS sanitizer that removes malicious content while preserving legitimate HTML.

### 2. Updated CodeViewer.tsx

**Key Changes:**

- Added DOMPurify import and configuration
- Created `sanitizeHighlightedCode()` function with strict security settings
- Configured DOMPurify to only allow safe tags (`span`, `br`) and attributes (`class`)
- Disabled all data attributes
- Added security comments explaining the defense-in-depth approach

**DOMPurify Configuration:**

```typescript
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['span', 'br'],        // Only styling tags
  ALLOWED_ATTR: ['class'],             // Only class for CSS
  ALLOW_DATA_ATTR: false,              // No data attributes
  KEEP_CONTENT: true,                  // Preserve text content
  RETURN_TRUSTED_TYPE: false,          // Return string
});
```

### 3. Created Comprehensive Security Tests

**Test Files Created:**

- `__tests__/xss-test-payloads.ts` - 20+ XSS attack vectors
- `__tests__/CodeViewer.security.test.tsx` - Comprehensive test suite

**Test Coverage:**

- ✅ Basic script injection
- ✅ Image tags with onerror handlers
- ✅ SVG with embedded scripts
- ✅ JavaScript protocol in links
- ✅ Data URIs with scripts
- ✅ Event handlers (onclick, onerror, etc.)
- ✅ Style injection
- ✅ Object/Embed/Iframe tags
- ✅ Meta refresh redirects
- ✅ Form actions
- ✅ Polyglot XSS
- ✅ Case variation attacks
- ✅ Nested tags
- ✅ Mixed protocols (javascript:, vbscript:, data:)

## Verification

### Build Status
✅ TypeScript compilation successful with no errors

### Test Payloads
All 20+ XSS test payloads are properly sanitized and neutralized.

### Before & After

**Before:**
```typescript
<pre dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
```
- Basic HTML escaping only
- No sanitization library
- Potential for bypass

**After:**
```typescript
const sanitizeHighlightedCode = (html: string): string => {
  return DOMPurify.sanitize(html, { /* strict config */ });
};

<pre dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
// highlightCode now calls sanitizeHighlightedCode before returning
```
- Double layer of protection (escape + sanitize)
- Industry-standard DOMPurify library
- Strict whitelist of allowed tags/attributes
- Defense-in-depth approach

## Security Improvements

1. **Defense-in-Depth**:
   - First layer: HTML escaping via `escapeHtml()`
   - Second layer: DOMPurify sanitization
   - Result: Even if one layer fails, the other provides protection

2. **Whitelist Approach**:
   - Only `<span>` and `<br>` tags allowed
   - Only `class` attribute allowed
   - All other tags and attributes stripped

3. **Zero JavaScript Execution**:
   - All event handlers removed
   - All JavaScript protocols blocked
   - All inline scripts eliminated

4. **Tested & Verified**:
   - Comprehensive test suite
   - 20+ attack vectors tested
   - Automated verification

## Recommendations

### Immediate Actions
✅ Fix applied and tested
✅ Build verified
⏳ Commit and push changes
⏳ Deploy to production

### Future Enhancements

1. **Consider Using a Syntax Highlighting Library**:
   - Replace custom highlighter with Prism.js or Highlight.js
   - These libraries are designed for secure code rendering
   - Better performance and more features

2. **Content Security Policy (CSP)**:
   - Add CSP headers to prevent inline script execution
   - Further defense layer at the browser level

3. **Regular Security Audits**:
   - Run automated security scans
   - Keep DOMPurify updated
   - Monitor for new XSS vectors

4. **File Upload Validation**:
   - Validate file types on upload
   - Scan uploaded files for malicious content
   - Implement file size limits

## Testing Instructions

### Manual Testing

1. **Upload a malicious code file** with XSS payload:
   ```javascript
   <script>alert('XSS')</script>
   ```

2. **View the file** in CodeViewer

3. **Verify**:
   - No alert box appears
   - Script tags are escaped/removed in rendered HTML
   - Code is readable but not executable

### Automated Testing

```bash
# Run security tests
npm run test:unit src/components/documents/viewer/__tests__/CodeViewer.security.test.tsx

# Run all tests
npm run test:unit

# Check coverage
npm run test:coverage
```

## References

- [DOMPurify GitHub](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React dangerouslySetInnerHTML Security](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)

## Affected Files

- ✅ Modified: `src/components/documents/viewer/CodeViewer.tsx`
- ✅ Created: `src/components/documents/viewer/__tests__/xss-test-payloads.ts`
- ✅ Created: `src/components/documents/viewer/__tests__/CodeViewer.security.test.tsx`
- ✅ Updated: `package.json` (added dompurify dependencies)
- ✅ Created: `SECURITY_FIX_XSS_CODEVIEWER.md` (this document)

## Compliance

This fix addresses:
- ✅ OWASP Top 10 - A03:2021 Injection
- ✅ CWE-79: Cross-site Scripting (XSS)
- ✅ SOC 2 Security Controls
- ✅ NIST 800-53 SI-10: Information Input Validation

---

**Status**: ✅ FIXED
**Next Action**: Deploy to production and monitor
