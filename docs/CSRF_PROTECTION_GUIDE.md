# CSRF Protection Guide: Double-Submit Cookie Pattern

## Overview

This document outlines the implementation of the CSRF double-submit cookie pattern using TypeScript in strict mode. It includes error handling, logging, and notes for FedRAMP compliance. The code is designed to integrate with the existing Fleet Local codebase.

## Implementation

### CSRF Token Generation

```typescript
// Import necessary modules
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger'; // Assume a logger module exists

// FedRAMP: Ensure cryptographic modules are FIPS 140-2 validated
function generateCsrfToken(): string {
    try {
        return crypto.randomBytes(32).toString('hex');
    } catch (error) {
        Logger.error('Failed to generate CSRF token', error);
        throw new Error('Internal Server Error');
    }
}
```

### Middleware for Setting CSRF Token

```typescript
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const csrfToken = generateCsrfToken();
        res.cookie('csrfToken', csrfToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.locals.csrfToken = csrfToken;
        next();
    } catch (error) {
        Logger.error('Failed to set CSRF token cookie', error);
        res.status(500).send('Internal Server Error');
    }
}
```

### Middleware for Validating CSRF Token

```typescript
export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
    const csrfTokenCookie = req.cookies['csrfToken'];
    const csrfTokenHeader = req.headers['x-csrf-token'];

    if (typeof csrfTokenCookie !== 'string' || typeof csrfTokenHeader !== 'string') {
        Logger.warn('CSRF token missing or malformed');
        return res.status(403).send('Forbidden');
    }

    if (csrfTokenCookie !== csrfTokenHeader) {
        Logger.warn('CSRF token mismatch');
        return res.status(403).send('Forbidden');
    }

    next();
}
```

### Integration with Fleet Local Codebase

1. **Import Middleware**: Ensure the middleware is imported into your main server file.

```typescript
import { csrfTokenMiddleware, validateCsrfToken } from './csrfProtection';
```

2. **Apply Middleware**: Use the middleware in your application routes.

```typescript
// Apply CSRF token middleware to all routes
app.use(csrfTokenMiddleware);

// Apply CSRF validation middleware to routes that modify state
app.post('/api/*', validateCsrfToken);
app.put('/api/*', validateCsrfToken);
app.delete('/api/*', validateCsrfToken);
```

## FedRAMP Compliance Notes

- **Cryptographic Modules**: Ensure that the `crypto` module used for generating CSRF tokens is compliant with FIPS 140-2 standards.
- **Logging**: All error and warning logs should be reviewed and stored according to SOC 2 guidelines to ensure traceability and accountability.
- **Secure Cookies**: The `secure` flag in cookies should be enabled to ensure that cookies are only sent over HTTPS, aligning with FedRAMP requirements for secure data transmission.

## Conclusion

This guide provides a robust implementation of the CSRF double-submit cookie pattern using TypeScript. It includes comprehensive error handling and logging, ensuring compliance with FedRAMP and SOC 2 standards. Integrate this code into your Fleet Local codebase to enhance security against CSRF attacks.