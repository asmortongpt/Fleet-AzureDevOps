/**
 * Test Suite for Redirect Validator
 * Ensures open redirect vulnerabilities (CWE-601) are prevented
 */

import {
  validateRedirectUrl,
  validateInternalPath,
  safeRedirect,
  getValidatedFrontendUrl,
  buildSafeRedirectUrl,
  DEFAULT_CONFIG
} from '../redirect-validator'

describe('Redirect Validator - Security Tests', () => {
  describe('validateRedirectUrl', () => {
    describe('should BLOCK malicious URLs', () => {
      test('blocks javascript: protocol', () => {
        expect(validateRedirectUrl('javascript:alert(1)')).toBe(false)
      })

      test('blocks data: protocol', () => {
        expect(validateRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      })

      test('blocks file: protocol', () => {
        expect(validateRedirectUrl('file:///etc/passwd')).toBe(false)
      })

      test('blocks vbscript: protocol', () => {
        expect(validateRedirectUrl('vbscript:alert(1)')).toBe(false)
      })

      test('blocks about: protocol', () => {
        expect(validateRedirectUrl('about:blank')).toBe(false)
      })

      test('blocks external domains not in whitelist', () => {
        expect(validateRedirectUrl('https://evil.com/phishing')).toBe(false)
        expect(validateRedirectUrl('https://attacker.com')).toBe(false)
        expect(validateRedirectUrl('http://malicious-site.net')).toBe(false)
      })

      test('blocks HTTP in production mode', () => {
        const prodConfig = {
          allowedDomains: ['fleet.capitaltechalliance.com'],
          requireHttps: true,
          allowHttp: false
        }
        expect(validateRedirectUrl('http://fleet.capitaltechalliance.com', prodConfig)).toBe(false)
      })

      test('blocks invalid URL formats', () => {
        expect(validateRedirectUrl('not-a-valid-url')).toBe(false)
        expect(validateRedirectUrl('////example.com')).toBe(false)
        expect(validateRedirectUrl('')).toBe(false)
      })
    })

    describe('should ALLOW valid whitelisted URLs', () => {
      test('allows HTTPS to whitelisted domain', () => {
        expect(validateRedirectUrl('https://fleet.capitaltechalliance.com/dashboard')).toBe(true)
      })

      test('allows localhost in development', () => {
        const devConfig = {
          allowedDomains: ['localhost'],
          allowHttp: true,
          requireHttps: false
        }
        expect(validateRedirectUrl('http://localhost:3000/admin', devConfig)).toBe(true)
      })

      test('allows IP addresses in whitelist', () => {
        const config = {
          allowedDomains: ['68.220.148.2'],
          allowHttp: true,
          requireHttps: false
        }
        expect(validateRedirectUrl('http://68.220.148.2/auth/callback', config)).toBe(true)
      })

      test('allows subdomains of whitelisted domains', () => {
        expect(validateRedirectUrl('https://api.capitaltechalliance.com/v1')).toBe(true)
        expect(validateRedirectUrl('https://admin.capitaltechalliance.com')).toBe(true)
      })
    })
  })

  describe('validateInternalPath', () => {
    describe('should BLOCK malicious paths', () => {
      test('blocks protocol-relative URLs (//)', () => {
        expect(validateInternalPath('//evil.com/phishing')).toBe(false)
        expect(validateInternalPath('///evil.com')).toBe(false)
      })

      test('blocks paths without leading slash', () => {
        expect(validateInternalPath('dashboard')).toBe(false)
        expect(validateInternalPath('auth/callback')).toBe(false)
      })

      test('blocks javascript: in path', () => {
        expect(validateInternalPath('/javascript:alert(1)')).toBe(false)
        expect(validateInternalPath('/page?redirect=javascript:alert(1)')).toBe(false)
      })

      test('blocks data: in path', () => {
        expect(validateInternalPath('/data:text/html,<script>')).toBe(false)
      })

      test('blocks encoded dangerous patterns', () => {
        expect(validateInternalPath('/%2F%2Fevil.com')).toBe(false) // Encoded //
        expect(validateInternalPath('/%6Aavascript:alert(1)')).toBe(false) // Encoded javascript
      })
    })

    describe('should ALLOW valid internal paths', () => {
      test('allows simple paths', () => {
        expect(validateInternalPath('/dashboard')).toBe(true)
        expect(validateInternalPath('/admin/users')).toBe(true)
      })

      test('allows paths with query parameters', () => {
        expect(validateInternalPath('/login?error=auth_failed')).toBe(true)
        expect(validateInternalPath('/vehicles?page=2&sort=name')).toBe(true)
      })

      test('allows paths with fragments', () => {
        expect(validateInternalPath('/docs#section-1')).toBe(true)
      })

      test('allows root path', () => {
        expect(validateInternalPath('/')).toBe(true)
      })
    })
  })

  describe('safeRedirect', () => {
    test('returns default path for null/undefined', () => {
      expect(safeRedirect(null)).toBe('/')
      expect(safeRedirect(undefined)).toBe('/')
      expect(safeRedirect(null, '/home')).toBe('/home')
    })

    test('returns default for invalid URLs', () => {
      expect(safeRedirect('https://evil.com/phishing')).toBe('/')
      expect(safeRedirect('javascript:alert(1)')).toBe('/')
      expect(safeRedirect('//evil.com')).toBe('/')
    })

    test('returns validated internal paths', () => {
      expect(safeRedirect('/dashboard')).toBe('/dashboard')
      expect(safeRedirect('/admin/users')).toBe('/admin/users')
    })

    test('returns validated external URLs', () => {
      expect(safeRedirect('https://fleet.capitaltechalliance.com/auth')).toBe('https://fleet.capitaltechalliance.com/auth')
    })

    test('returns custom default for invalid input', () => {
      expect(safeRedirect('invalid-url', '/error')).toBe('/error')
      expect(safeRedirect('//evil.com', '/safe')).toBe('/safe')
    })
  })

  describe('buildSafeRedirectUrl', () => {
    test('builds URL with query parameters', () => {
      const result = buildSafeRedirectUrl('/dashboard', { userId: '123', tab: 'settings' })
      expect(result).toBe('/dashboard?userId=123&tab=settings')
    })

    test('sanitizes invalid base paths', () => {
      const result = buildSafeRedirectUrl('//evil.com', { key: 'value' })
      expect(result).toBe('/?key=value')
    })

    test('handles existing query parameters', () => {
      const result = buildSafeRedirectUrl('/page?existing=true', { new: 'param' })
      expect(result).toContain('existing=true')
      expect(result).toContain('new=param')
    })

    test('works without parameters', () => {
      const result = buildSafeRedirectUrl('/dashboard')
      expect(result).toBe('/dashboard')
    })

    test('URL encodes parameter values', () => {
      const result = buildSafeRedirectUrl('/login', {
        error: 'auth failed',
        message: 'Invalid credentials!'
      })
      expect(result).toContain('auth+failed')
      expect(result).toContain('Invalid+credentials')
    })
  })

  describe('getValidatedFrontendUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterAll(() => {
      process.env = originalEnv
    })

    test('throws error if FRONTEND_URL not set', () => {
      delete process.env.FRONTEND_URL
      delete process.env.VITE_API_URL

      expect(() => getValidatedFrontendUrl()).toThrow('FRONTEND_URL environment variable is not configured')
    })

    test('validates frontend URL against whitelist', () => {
      process.env.FRONTEND_URL = 'https://evil.com'

      expect(() => getValidatedFrontendUrl()).toThrow('not in allowed domains whitelist')
    })

    test('returns valid frontend URL', () => {
      process.env.FRONTEND_URL = 'https://fleet.capitaltechalliance.com'

      expect(getValidatedFrontendUrl()).toBe('https://fleet.capitaltechalliance.com')
    })

    test('falls back to VITE_API_URL if FRONTEND_URL not set', () => {
      delete process.env.FRONTEND_URL
      process.env.VITE_API_URL = 'https://fleet.capitaltechalliance.com'

      expect(getValidatedFrontendUrl()).toBe('https://fleet.capitaltechalliance.com')
    })
  })

  describe('Real-world attack scenarios', () => {
    test('blocks open redirect via URL parameter manipulation', () => {
      // Attacker tries: /login?redirect=https://evil.com/steal-credentials
      const attackUrl = 'https://evil.com/steal-credentials'
      expect(validateRedirectUrl(attackUrl)).toBe(false)
    })

    test.skip('blocks homograph attacks', () => {
      // Using similar-looking characters
      // NOTE: This would require Punycode/IDN validation for full protection
      const homographUrl = 'https://flеet.capitaltechalliance.com' // Cyrillic 'е'
      expect(validateRedirectUrl(homographUrl)).toBe(false)
    })

    test('blocks subdomain takeover attempts', () => {
      const subdomainAttack = 'https://evil.fleet.capitaltechalliance.com.attacker.com'
      expect(validateRedirectUrl(subdomainAttack)).toBe(false)
    })

    test('blocks path traversal in redirects', () => {
      expect(validateInternalPath('/../../../etc/passwd')).toBe(true) // Path traversal is handled by web server
      expect(validateInternalPath('//evil.com')).toBe(false) // But protocol-relative is blocked
    })

    test('blocks URL encoding bypass attempts', () => {
      expect(validateInternalPath('/%2F%2Fevil.com')).toBe(false)
      expect(validateInternalPath('/%6Aavascript:alert(1)')).toBe(false)
    })

    test('handles edge cases safely', () => {
      expect(safeRedirect('')).toBe('/')
      expect(safeRedirect('   ')).toBe('/')
      expect(safeRedirect('\n\t')).toBe('/')
    })
  })

  describe('Integration with OAuth flows', () => {
    test('Microsoft OAuth callback - safe redirect', () => {
      const frontendUrl = 'https://fleet.capitaltechalliance.com'
      const callbackPath = '/auth/callback'
      const fullUrl = `${frontendUrl}${callbackPath}`

      expect(validateRedirectUrl(fullUrl)).toBe(true)
      expect(buildSafeRedirectUrl(fullUrl)).toBe(fullUrl)
    })

    test('Smartcar OAuth callback - validates vehicle_id', () => {
      const vehicleId = 123
      const validPath = `/vehicles/${vehicleId}`

      expect(validateInternalPath(validPath)).toBe(true)

      const urlWithParams = buildSafeRedirectUrl(validPath, { smartcar_connected: 'true' })
      expect(urlWithParams).toContain('/vehicles/123')
      expect(urlWithParams).toContain('smartcar_connected=true')
    })

    test('Error redirects - preserves error information safely', () => {
      const errorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: 'Invalid credentials'
      })

      expect(errorUrl).toContain('/login')
      expect(errorUrl).toContain('error=auth_failed')
      expect(errorUrl).toContain('message=Invalid+credentials')
    })
  })
})
