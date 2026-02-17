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

const csrfMethods = doubleCsrf({
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
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
}) as unknown as CsrfUtilities;

// Export individual methods
export const generateToken = csrfMethods.generateCsrfToken;
export const validateRequest = csrfMethods.doubleCsrfProtection;
export const doubleCsrfProtection = csrfMethods.doubleCsrfProtection;

// Create a custom error for invalid CSRF token
export const invalidCsrfTokenError = new Error('Invalid CSRF token');

// ALIASES for backward compatibility with existing routes
export const csrfProtection = doubleCsrfProtection;

// CSRF Token endpoint handler
export const getCsrfToken = (req: Request, res: Response) => {
  const token = csrfMethods.generateCsrfToken(req, res);
  res.json({ csrfToken: token });
};
