import rateLimit from 'express-rate-limit'

/**
 * Rate Limiter Configuration
 *
 * Implements comprehensive rate limiting for security and cost protection
 * Complies with FedRAMP SI-10 (Information Input Validation)
 */

// Global API rate limiter - reduced from 100 to 30 requests per minute
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60)
    })
  }
})

// Strict login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900)
    })
  }
})

// File upload rate limiter - 5 uploads per minute
export const fileUploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 file uploads per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many file uploads, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Upload rate limit exceeded',
      message: 'You can only upload 5 files per minute. Please wait before uploading more files.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60)
    })
  }
})

// AI/ML endpoint rate limiter - 2 requests per minute for expensive operations
export const aiProcessingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2, // 2 AI processing requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'AI processing rate limit exceeded',
  handler: (req, res) => {
    res.status(429).json({
      error: 'AI processing rate limit exceeded',
      message: 'AI analysis operations are limited to 2 per minute due to computational costs. Please wait before submitting another request.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
      queue: {
        available: false,
        message: 'Consider upgrading to enterprise tier for queue-based processing'
      }
    })
  }
})

// Registration rate limiter - prevent mass account creation
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many accounts created from this IP',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Registration rate limit exceeded',
      message: 'Too many account creation attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 3600)
    })
  }
})

// Password reset rate limiter - prevent abuse
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset attempts',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Password reset rate limit exceeded',
      message: 'Too many password reset requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 3600)
    })
  }
})

// Moderate rate limiter for read operations - 60 per minute
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 read requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many read requests',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Read rate limit exceeded',
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60)
    })
  }
})

// Write operation rate limiter - 20 per minute
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 write requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many write requests',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Write rate limit exceeded',
      message: 'Too many modification requests. Please slow down.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60)
    })
  }
})
