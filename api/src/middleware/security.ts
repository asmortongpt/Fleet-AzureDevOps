import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Three.js requires unsafe-eval
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for WebGL compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Rate limiting configurations
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: {
    error: 'Rate limit exceeded',
    retryAfter: '1 minute',
  },
});

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/[<>]/g, '') // Remove potential XSS vectors
        .trim()
        .slice(0, 10000); // Limit string length
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      Object.keys(obj).forEach(key => {
        if (key.length <= 50) { // Limit key length
          sanitized[key] = sanitize(obj[key]);
        }
      });
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://fleet-showroom.com',
      'https://staging.fleet-showroom.com',
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Request logging middleware
export const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = randomBytes(16).toString('hex');

  req.requestId = requestId;

  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString(),
    });
    return originalSend.call(this, body);
  };

  next();
};

// Security headers validation
export const validateSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-host'];
  const hassuspicious = suspiciousHeaders.some(header => req.headers[header]);

  if (hassuspicious) {
    return res.status(400).json({ error: 'Invalid request headers' });
  }

  // Validate content-type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' });
    }
  }

  return next();
};

// JWT Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  requestId: string;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Validate token structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new Error('Invalid token structure');
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    return next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control
export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
};

// Permission-based access control
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = req.user.permissions.includes(requiredPermission) ||
                         req.user.role === 'admin';

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
};

// API key validation (for service-to-service communication)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  const hashedKey = createHash('sha256').update(apiKey).digest('hex');

  if (!validApiKeys.includes(hashedKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  return next();
};

// Request size limiter
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    if (contentLength > maxSize) {
      return res.status(413).json({ error: 'Request entity too large' });
    }
  }

  return next();
};

// Security audit logging
export const auditLogger = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      action,
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    };

    // In production, send to secure audit service
    console.log('AUDIT:', auditEntry);

    return next();
  };
};
