/**
 * Rate Limiting Configuration
 *
 * FedRAMP SC-5 (Denial of Service Protection) Compliance
 * Centralized configuration for 6-tier rate limiting system
 */

export interface RateLimitTier {
  windowMs: number;
  max: number;
  message: string | { error: string; code: string; retryAfter?: string };
  skipSuccessfulRequests?: boolean;
}

/**
 * 6-Tier Rate Limiting System
 *
 * Tier 1: Strict (Auth endpoints) - Prevents brute force attacks
 * Tier 2: Aggressive (Write operations) - Prevents data manipulation abuse
 * Tier 3: Standard (Read operations) - Standard API protection
 * Tier 4: Generous (Public endpoints) - Health checks, status pages
 * Tier 5: WebSocket - Real-time connection limits
 * Tier 6: File Uploads - Prevents storage abuse
 */
export const rateLimitConfig = {
  /**
   * TIER 1: STRICT - Authentication & Security-Critical Endpoints
   * 5 requests per 15 minutes
   * Prevents: Brute force attacks, credential stuffing
   */
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: false, // Count all attempts
  } as RateLimitTier,

  /**
   * TIER 2: AGGRESSIVE - Write Operations
   * 100 requests per 15 minutes
   * Prevents: Data manipulation abuse, spam creation
   */
  write: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      error: 'Too many write operations. Please try again in 15 minutes.',
      code: 'WRITE_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: false,
  } as RateLimitTier,

  /**
   * TIER 3: STANDARD - Read Operations
   * 1000 requests per 15 minutes
   * Prevents: API abuse, excessive polling
   */
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: {
      error: 'Too many requests. Please try again in 15 minutes.',
      code: 'READ_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Only count failed requests
  } as RateLimitTier,

  /**
   * TIER 4: GENEROUS - Public Endpoints
   * 5000 requests per 15 minutes
   * Used for: Health checks, status pages, documentation
   */
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000,
    message: {
      error: 'Too many requests. Please try again later.',
      code: 'PUBLIC_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true,
  } as RateLimitTier,

  /**
   * TIER 5: WEBSOCKET - Real-time Connections
   * 100 concurrent connections per IP
   * Prevents: Connection flooding, resource exhaustion
   */
  websocket: {
    maxConnections: 100,
    message: {
      error: 'Too many concurrent connections.',
      code: 'WEBSOCKET_LIMIT_EXCEEDED'
    },
  },

  /**
   * TIER 6: FILE UPLOADS
   * 10 uploads per hour
   * Prevents: Storage abuse, malicious file flooding
   */
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
      error: 'Upload limit exceeded. Please try again in 1 hour.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour'
    },
    skipSuccessfulRequests: false,
  } as RateLimitTier,
};

/**
 * IP Whitelist Configuration
 * IPs in this list bypass rate limiting
 * Use for: Admin IPs, monitoring services, trusted partners
 */
export const whitelistedIPs = [
  '127.0.0.1',      // localhost IPv4
  '::1',            // localhost IPv6
  '::ffff:127.0.0.1', // IPv4-mapped IPv6 localhost
  // Add production admin IPs from environment variable
  ...(process.env.RATE_LIMIT_WHITELIST_IPS?.split(',').map(ip => ip.trim()) || [])
];

/**
 * Rate Limit Violation Tracking
 * After this many violations, temporarily ban the IP
 */
export const violationThresholds = {
  /**
   * Maximum violations before temporary ban
   */
  maxViolations: 10,

  /**
   * Ban duration in milliseconds (1 hour)
   */
  banDuration: 60 * 60 * 1000,

  /**
   * Time window to track violations (24 hours)
   */
  trackingWindow: 24 * 60 * 60 * 1000,
};

/**
 * Redis Configuration for Rate Limiting
 */
export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,

  // Connection options
  socket: {
    reconnectStrategy: (retries: number) => {
      // Exponential backoff with max delay of 3 seconds
      return Math.min(retries * 50, 3000);
    },
    connectTimeout: 10000, // 10 seconds
  },

  // Retry strategy
  retryStrategy: (times: number) => {
    if (times > 10) {
      // Stop retrying after 10 attempts
      return null;
    }
    return Math.min(times * 100, 3000);
  },
};

/**
 * Rate Limit Header Configuration
 * Standard headers returned with rate limit info
 */
export const rateLimitHeaders = {
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers (deprecated)
};

/**
 * Sliding Window Algorithm Configuration
 * More accurate than fixed window
 */
export const slidingWindowConfig = {
  // Use sliding window for more accurate rate limiting
  // Prevents burst attacks at window boundaries
  enabled: true,

  // Precision: number of sub-windows per main window
  // Higher = more accurate but more memory
  precision: 60, // 60 sub-windows (1 per second for 15min window)
};

/**
 * Trust Proxy Configuration
 * Required for accurate IP detection behind load balancers
 */
export const trustProxyConfig = {
  // Trust first proxy (Azure Front Door, Application Gateway)
  trust: 1,

  // IP header to use (standard for Azure)
  header: 'X-Forwarded-For',
};

/**
 * DoS Protection Configuration
 */
export const dosProtectionConfig = {
  /**
   * Enable automatic IP banning for repeated violations
   */
  enableAutoBan: process.env.RATE_LIMIT_AUTO_BAN !== 'false',

  /**
   * Enable security team alerts for potential attacks
   */
  enableSecurityAlerts: process.env.RATE_LIMIT_ALERTS === 'true',

  /**
   * Alert threshold (number of violations to trigger alert)
   */
  alertThreshold: 5,
};
