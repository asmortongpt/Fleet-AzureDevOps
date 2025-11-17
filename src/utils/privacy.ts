/**
 * Privacy Utilities
 *
 * GDPR-compliant privacy controls, data anonymization, and PII scrubbing.
 * Ensures all telemetry data respects user privacy and regulatory requirements.
 */

import { getTelemetryConfig } from '../config/telemetry';

/**
 * Consent status
 */
export enum ConsentStatus {
  PENDING = 'pending',
  GRANTED = 'granted',
  DENIED = 'denied',
}

/**
 * Privacy categories for granular consent
 */
export enum PrivacyCategory {
  ESSENTIAL = 'essential',     // Required for app functionality
  ANALYTICS = 'analytics',     // Usage analytics
  PERFORMANCE = 'performance', // Performance monitoring
  MARKETING = 'marketing',     // Marketing and targeting
}

/**
 * User consent record
 */
export interface ConsentRecord {
  status: ConsentStatus;
  categories: Record<PrivacyCategory, boolean>;
  timestamp: number;
  version: string; // Privacy policy version
  ip?: string; // Anonymized IP for audit trail
}

/**
 * PII patterns to detect and scrub
 */
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  // Common PII field names
  password: /password['":\s]*['"]\w+['"]/gi,
  apiKey: /(?:api[_-]?key|apikey)['":\s]*['"]\w+['"]/gi,
  token: /(?:auth[_-]?token|bearer)['":\s]*['"]\w+['"]/gi,
};

/**
 * Privacy Manager - Handles user consent and privacy preferences
 */
export class PrivacyManager {
  private static readonly CONSENT_KEY = 'telemetry_consent_record';
  private static readonly CURRENT_POLICY_VERSION = '1.0.0';

  /**
   * Get current consent record
   */
  static getConsentRecord(): ConsentRecord | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get consent record:', error);
      return null;
    }
  }

  /**
   * Set consent record
   */
  static setConsentRecord(consent: Partial<ConsentRecord>): void {
    if (typeof window === 'undefined') return;

    const record: ConsentRecord = {
      status: consent.status || ConsentStatus.PENDING,
      categories: consent.categories || {
        [PrivacyCategory.ESSENTIAL]: true,
        [PrivacyCategory.ANALYTICS]: false,
        [PrivacyCategory.PERFORMANCE]: false,
        [PrivacyCategory.MARKETING]: false,
      },
      timestamp: Date.now(),
      version: this.CURRENT_POLICY_VERSION,
      ip: this.anonymizeIp(consent.ip),
    };

    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(record));

      // Also set simplified flags for backward compatibility
      localStorage.setItem('telemetry_consent', record.status === ConsentStatus.GRANTED ? 'true' : 'false');
      localStorage.setItem('telemetry_opt_out', record.status === ConsentStatus.DENIED ? 'true' : 'false');

      // Dispatch custom event for listeners
      window.dispatchEvent(new CustomEvent('consentChanged', { detail: record }));
    } catch (error) {
      console.error('Failed to set consent record:', error);
    }
  }

  /**
   * Grant consent for specific categories
   */
  static grantConsent(categories?: PrivacyCategory[]): void {
    const record = this.getConsentRecord();
    const currentCategories = record?.categories || {
      [PrivacyCategory.ESSENTIAL]: true,
      [PrivacyCategory.ANALYTICS]: false,
      [PrivacyCategory.PERFORMANCE]: false,
      [PrivacyCategory.MARKETING]: false,
    };

    if (categories) {
      categories.forEach(cat => {
        currentCategories[cat] = true;
      });
    } else {
      // Grant all
      Object.keys(currentCategories).forEach(cat => {
        currentCategories[cat as PrivacyCategory] = true;
      });
    }

    this.setConsentRecord({
      status: ConsentStatus.GRANTED,
      categories: currentCategories,
    });
  }

  /**
   * Deny consent
   */
  static denyConsent(): void {
    this.setConsentRecord({
      status: ConsentStatus.DENIED,
      categories: {
        [PrivacyCategory.ESSENTIAL]: true, // Essential always allowed
        [PrivacyCategory.ANALYTICS]: false,
        [PrivacyCategory.PERFORMANCE]: false,
        [PrivacyCategory.MARKETING]: false,
      },
    });
  }

  /**
   * Revoke consent
   */
  static revokeConsent(): void {
    this.denyConsent();
    this.clearAllTelemetryData();
  }

  /**
   * Check if specific category is consented
   */
  static hasConsent(category: PrivacyCategory): boolean {
    const record = this.getConsentRecord();
    if (!record || record.status === ConsentStatus.DENIED) {
      return category === PrivacyCategory.ESSENTIAL;
    }

    return record.categories[category] || false;
  }

  /**
   * Check if consent is required and not yet given
   */
  static requiresConsent(): boolean {
    const config = getTelemetryConfig();
    if (!config.requireConsent) return false;

    const record = this.getConsentRecord();
    return !record || record.status === ConsentStatus.PENDING;
  }

  /**
   * Anonymize IP address (remove last octet for IPv4, last 80 bits for IPv6)
   */
  static anonymizeIp(ip?: string): string | undefined {
    if (!ip) return undefined;

    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      parts[parts.length - 1] = '0';
      return parts.join('.');
    }

    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::';
    }

    return undefined;
  }

  /**
   * Clear all telemetry data from localStorage
   */
  static clearAllTelemetryData(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove = [
      'analytics_events',
      'analytics_session',
      'analytics_user',
      'telemetry_events',
      'performance_metrics',
      'error_logs',
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Export user data (GDPR right to data portability)
   */
  static exportUserData(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    const data: Record<string, any> = {};

    [
      'analytics_events',
      'analytics_session',
      'telemetry_consent_record',
      'performance_metrics',
    ].forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch {
        data[key] = localStorage.getItem(key);
      }
    });

    return data;
  }

  /**
   * Request data deletion (GDPR right to be forgotten)
   */
  static async requestDataDeletion(): Promise<void> {
    // Clear local data
    this.clearAllTelemetryData();
    this.denyConsent();

    // In production, also send deletion request to backend
    const config = getTelemetryConfig();
    if (config.custom?.endpoint) {
      try {
        await fetch(`${config.custom.endpoint}/delete-user-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: Date.now(),
            reason: 'user_request',
          }),
        });
      } catch (error) {
        console.error('Failed to request data deletion from backend:', error);
      }
    }
  }
}

/**
 * Data Sanitizer - Removes PII from data before sending
 */
export class DataSanitizer {
  /**
   * Scrub PII from a string
   */
  static scrubString(text: string): string {
    let sanitized = text;

    // Replace email addresses
    sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');

    // Replace phone numbers
    sanitized = sanitized.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');

    // Replace SSN
    sanitized = sanitized.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');

    // Replace credit cards
    sanitized = sanitized.replace(PII_PATTERNS.creditCard, '[CC_REDACTED]');

    // Replace IP addresses
    sanitized = sanitized.replace(PII_PATTERNS.ipv4, '[IP_REDACTED]');
    sanitized = sanitized.replace(PII_PATTERNS.ipv6, '[IP_REDACTED]');

    // Replace passwords/tokens in JSON
    sanitized = sanitized.replace(PII_PATTERNS.password, 'password: "[REDACTED]"');
    sanitized = sanitized.replace(PII_PATTERNS.apiKey, 'api_key: "[REDACTED]"');
    sanitized = sanitized.replace(PII_PATTERNS.token, 'token: "[REDACTED]"');

    return sanitized;
  }

  /**
   * Scrub PII from an object (deep)
   */
  static scrubObject<T extends Record<string, any>>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item =>
        typeof item === 'object' ? this.scrubObject(item) :
        typeof item === 'string' ? this.scrubString(item) :
        item
      ) as unknown as T;
    }

    // Handle objects
    const sanitized: any = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];

      // Redact sensitive field names
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
        return;
      }

      // Recursively sanitize
      if (typeof value === 'string') {
        sanitized[key] = this.scrubString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.scrubObject(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * Check if field name is sensitive
   */
  private static isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'passwd',
      'pwd',
      'secret',
      'token',
      'api_key',
      'apiKey',
      'apikey',
      'auth',
      'authorization',
      'ssn',
      'social_security',
      'credit_card',
      'creditCard',
      'cvv',
      'pin',
    ];

    const lowerField = fieldName.toLowerCase();
    return sensitiveFields.some(sensitive => lowerField.includes(sensitive));
  }

  /**
   * Sanitize error object
   */
  static scrubError(error: Error): Record<string, any> {
    return {
      name: error.name,
      message: this.scrubString(error.message),
      stack: error.stack ? this.scrubString(error.stack) : undefined,
    };
  }

  /**
   * Hash sensitive identifier (for anonymous tracking)
   */
  static async hashIdentifier(identifier: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      // Fallback for environments without SubtleCrypto
      return this.simpleHash(identifier);
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(identifier);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return this.simpleHash(identifier);
    }
  }

  /**
   * Simple hash fallback
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Cookie Consent Manager
 */
export class CookieConsent {
  private static readonly COOKIE_CONSENT_KEY = 'cookie_consent';

  /**
   * Check if cookie consent is given
   */
  static hasConsent(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.COOKIE_CONSENT_KEY) === 'true';
  }

  /**
   * Grant cookie consent
   */
  static grant(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.COOKIE_CONSENT_KEY, 'true');
  }

  /**
   * Deny cookie consent
   */
  static deny(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.COOKIE_CONSENT_KEY, 'false');
  }

  /**
   * Show cookie consent banner (returns true if should show)
   */
  static shouldShowBanner(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.COOKIE_CONSENT_KEY) === null;
  }
}

/**
 * Anonymize user agent string
 */
export function anonymizeUserAgent(ua?: string): string {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  // Extract only browser and OS, remove version specifics
  const browser = userAgent.match(/(Firefox|Chrome|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown';
  const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || 'Unknown';

  return `${browser} on ${os}`;
}

/**
 * Create privacy-safe analytics ID
 */
export async function createAnonymousId(): Promise<string> {
  // Create a stable but anonymous ID based on browser fingerprint
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.colorDepth.toString(),
    screen.width.toString() + 'x' + screen.height.toString(),
  ];

  const fingerprint = components.join('|');
  return DataSanitizer.hashIdentifier(fingerprint);
}

/**
 * Check if running in privacy mode (incognito/private browsing)
 */
export async function isPrivacyMode(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Test for private browsing
  try {
    const testKey = '__privacy_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return false;
  } catch {
    return true;
  }
}

export default PrivacyManager;
