# INPUT_VALIDATION_GUIDE

## Introduction

This document provides guidelines for implementing input validation using Zod schema validation middleware for all API endpoints in the Fleet Local codebase. The goal is to ensure data integrity, enhance security, and comply with FedRAMP and SOC 2 standards.

## Prerequisites

- Ensure TypeScript is configured in strict mode.
- Familiarity with Zod for schema validation.
- Understanding of the existing Fleet Local codebase.

## Implementation

### Step 1: Install Zod

Ensure Zod is installed in your project:

```bash
npm install zod
```

### Step 2: Create Middleware

Create a middleware function to validate incoming requests using Zod schemas.

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from './logger'; // Assume a logger is implemented

// FedRAMP Compliance: Ensure all input data is validated to prevent injection attacks.
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        Logger.error('Validation Error:', error.errors);
        res.status(400).json({
          message: 'Invalid request data',
          errors: error.errors,
        });
      } else {
        Logger.error('Unexpected Error:', error);
        res.status(500).json({
          message: 'Internal server error',
        });
      }
    }
  };
};
```

### Step 3: Define Zod Schemas

Define Zod schemas for each API endpoint. Ensure schemas are comprehensive and cover all expected fields.

```typescript
import { z } from 'zod';

// Example schema for a user registration endpoint
export const userRegistrationSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  email: z.string().email('Invalid email address'),
});
```

### Step 4: Integrate Middleware

Integrate the validation middleware into your existing API routes.

```typescript
import express from 'express';
import { validateRequest } from './middleware/validateRequest';
import { userRegistrationSchema } from './schemas/userSchemas';

const router = express.Router();

router.post('/register', validateRequest(userRegistrationSchema), (req, res) => {
  // Handle registration logic
  res.status(201).json({ message: 'User registered successfully' });
});

export default router;
```

### Step 5: Logging and Error Handling

Ensure all errors are logged for auditing and monitoring purposes. This is crucial for SOC 2 compliance.

```typescript
// logger.ts
import fs from 'fs';
import path from 'path';

class Logger {
  private static logFilePath = path.join(__dirname, 'logs', 'app.log');

  static error(message: string, error: any) {
    const logMessage = `[ERROR] ${new Date().toISOString()} - ${message} - ${JSON.stringify(error)}`;
    fs.appendFileSync(Logger.logFilePath, logMessage + '\n');
    console.error(logMessage);
  }

  // Additional logging methods (info, warn, etc.) can be added here
}

export { Logger };
```

## Conclusion

By following this guide, you will implement robust input validation for your API endpoints, enhancing security and ensuring compliance with FedRAMP and SOC 2 standards. Always test your schemas thoroughly and update them as your API evolves.