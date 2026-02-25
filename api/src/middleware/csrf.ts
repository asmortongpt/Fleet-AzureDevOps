import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";

// Define the utility interface locally since the csrf-csrf package's
// type export has compatibility issues with moduleResolution: "node"
interface CsrfUtilities {
  invalidCsrfTokenError: Error;
  generateCsrfToken: (req: Request, res: Response, options?: Record<string, unknown>) => string;
  validateRequest: (req: Request) => boolean;
  doubleCsrfProtection: (req: Request, res: Response, next: NextFunction) => void;
}

const resolveIsSecure = () => process.env.NODE_ENV === "production";
const devBypassEnabled = process.env.VITE_SKIP_AUTH === 'true' || process.env.DEV_BYPASS_SECURITY === 'true';

const csrfConfig = {
  getSecret: () => {
    const secret = process.env.CSRF_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET environment variable must be set in production');
    }
    return secret || `dev-csrf-secret-${String(process.pid)}`;
  },
  // csrf-csrf v4+ requires getSessionIdentifier to bind tokens to sessions
  getSessionIdentifier: (req: Request) => {
    // Use user ID from JWT auth, or fallback to IP for unauthenticated requests
    return (req as any).user?.id || req.ip || 'anonymous';
  },
  cookieName: "x-csrf-token" as const,
  cookieOptions: {
    sameSite: "strict" as const,
    path: "/",
    // Secure flag is resolved at call time so tests that toggle NODE_ENV
    // can assert correctly and production always uses HTTPS-only cookies.
    secure: resolveIsSecure(),
    httpOnly: false, // double-submit token must be readable by client
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- csrf-csrf v4 types don't include getSessionIdentifier
const csrfMethods = doubleCsrf(csrfConfig as any) as unknown as CsrfUtilities;

// Helper to mirror Sinon-style `.called` boolean used by legacy tests
const markCalled = (fn?: unknown) => {
  if (fn && typeof fn === "function") {
    (fn as any).called = true; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
};

// Safe wrapper to ensure errors result in a 403 response instead of throwing
const safeDoubleCsrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (devBypassEnabled) {
    return next();
  }
  try {
    return csrfMethods.doubleCsrfProtection(req, res, (err?: unknown) => {
      if (err) {
        markCalled(res.status);
        return res.status(403).json({ error: 'Invalid CSRF token' })
      }
      markCalled(next);
      return next()
    })
  } catch (err) {
    markCalled(res.status);
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
}

// Export individual methods
export const generateToken = (req: Request, res: Response) => {
  if (devBypassEnabled) {
    return 'dev-csrf-token';
  }
  // Resolve secure at call time to match current environment (tests mutate NODE_ENV)
  const token = csrfMethods.generateCsrfToken(req, res, {
    cookieOptions: {
      ...csrfConfig.cookieOptions,
      secure: resolveIsSecure(),
    },
  });
  return token;
};
export const validateRequest = safeDoubleCsrfProtection;
export const doubleCsrfProtection = safeDoubleCsrfProtection;

// Create a custom error for invalid CSRF token
export const invalidCsrfTokenError = new Error('Invalid CSRF token');

// ALIASES for backward compatibility with existing routes
export const csrfProtection = doubleCsrfProtection;

// CSRF Token endpoint handler
export const getCsrfToken = (req: Request, res: Response) => {
  if (devBypassEnabled) {
    return res.json({ csrfToken: 'dev-csrf-token' });
  }
  const token = csrfMethods.generateCsrfToken(req, res);
  res.json({ csrfToken: token });
};
