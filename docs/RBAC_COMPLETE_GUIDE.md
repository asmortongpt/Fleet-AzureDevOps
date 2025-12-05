# Complete RBAC System with Role-Based Route Protection

```typescript
// Import necessary modules and types
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, User, Route } from './models'; // Assuming these models are defined in your existing codebase
import { Logger } from './logger'; // Assuming a logger module is available

// Enable TypeScript strict mode
'use strict';

// FedRAMP Compliance Note: Ensure all sensitive data such as JWT secrets are stored securely and access is restricted.

// Initialize Express application
const app = express();

// Middleware for error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  Logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Function to verify JWT and extract user role
function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    Logger.warn('Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded: any) => {
    if (err) {
      Logger.error('JWT verification failed', { error: err.message });
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = decoded;
    next();
  });
}

// Function to check if the user has the required role for a route
function checkRole(requiredRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || userRole !== requiredRole) {
      Logger.warn('Access denied due to insufficient role', { userRole, requiredRole });
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Define roles and their permissions
const rolesPermissions: Record<UserRole, Route[]> = {
  admin: ['/admin', '/user', '/settings'],
  user: ['/user', '/settings'],
  guest: ['/home']
};

// FedRAMP Compliance Note: Ensure role-based access controls are reviewed regularly to comply with least privilege principles.

// Example route with role-based protection
app.get('/admin', verifyToken, checkRole('admin'), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the admin panel' });
});

// Example route for user
app.get('/user', verifyToken, checkRole('user'), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome user' });
});

// Example route for guests
app.get('/home', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome guest' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  Logger.info(`Server is running on port ${PORT}`);
});

// FedRAMP Compliance Note: Ensure logging is configured to capture all access and error events for auditing purposes.
```

This code provides a basic implementation of a Role-Based Access Control (RBAC) system using TypeScript with strict mode enabled. It includes error handling, logging, and comments for FedRAMP compliance. The code integrates with an existing codebase by assuming the presence of `UserRole`, `User`, `Route` models, and a `Logger` module.