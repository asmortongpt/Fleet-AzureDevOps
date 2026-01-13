import { doubleCsrf } from "csrf-csrf";
import { Request } from "express";

const csrfMethods = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "complex-secret-key-that-should-be-in-env",
  cookieName: "x-csrf-token", // The name of the cookie to be used, recommend using x-csrf-token
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"], // A list of request methods that will not be checked.
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"], // A function that returns the token from the request
  getSessionIdentifier: (req: Request) => (req as any).session?.id || "", // Optional: session identifier
});

// Export individual methods
export const invalidCsrfTokenError = csrfMethods.invalidCsrfTokenError;
export const generateToken = csrfMethods.generateCsrfToken;
export const validateRequest = csrfMethods.doubleCsrfProtection; // Fixed: validateRequest is actually doubleCsrfProtection middleware
export const doubleCsrfProtection = csrfMethods.doubleCsrfProtection;

// ALIASES for backward compatibility with existing routes
export const csrfProtection = doubleCsrfProtection;

// CSRF Token endpoint handler
export const getCsrfToken = (req: any, res: any) => {
  // Use the correct function name from the package
  const token = csrfMethods.generateToken(req, res);
  res.json({ csrfToken: token });
};
