import { doubleCsrf } from "csrf-csrf";
import { Request } from "express";

export const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own error handler
  generateToken, // Use this in your routes to provide a CSRF hash cookie and token
  validateRequest, // Also a convenience if you need manually validate
  doubleCsrfProtection, // This is the default CSRF protection middleware
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "complex-secret-key-that-should-be-in-env",
  cookieName: "x-csrf-token", // The name of the cookie to be used, recommend using x-csrf-token
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"], // A list of request methods that will not be checked.
  getTokenFromRequest: (req: Request) => req.headers["x-csrf-token"], // A function that returns the token from the request
});
