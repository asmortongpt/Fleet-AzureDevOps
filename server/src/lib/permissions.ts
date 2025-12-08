// server/src/lib/permissions.ts

import { Request, Response, NextFunction } from 'express';

import { getUserRoles, getRoutePermissions } from './authService';
import { Logger } from './logger';

// Enable strict mode in TypeScript
'use strict';

// Define custom error classes for better error handling
class PermissionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermissionError';
    }
}

// Role-based Access Control (RBAC) Middleware
export const rbacMiddleware = (requiredRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new PermissionError('User ID is missing from request.');
            }

            // Fetch user roles from the auth service
            const userRoles = await getUserRoles(userId);
            if (!userRoles) {
                throw new PermissionError('Failed to retrieve user roles.');
            }

            // Check if user has at least one of the required roles
            const hasPermission = requiredRoles.some(role => userRoles.includes(role));
            if (!hasPermission) {
                throw new PermissionError('User does not have the required permissions.');
            }

            // Proceed to the next middleware or route handler
            next();
        } catch (error) {
            // Log the error for auditing purposes
            Logger.error(`RBAC Error: ${error.message}`, { userId: req.user?.id, path: req.path });

            // FedRAMP Compliance: Ensure detailed error messages are not exposed to the client
            res.status(403).json({ error: 'Access denied.' });
        }
    };
};

// Function to protect routes based on route-specific permissions
export const protectRoute = (route: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const routePermissions = await getRoutePermissions(route);
            if (!routePermissions) {
                throw new Error('Failed to retrieve route permissions.');
            }

            // Use the RBAC middleware with the route-specific permissions
            return rbacMiddleware(routePermissions)(req, res, next);
        } catch (error) {
            // Log the error for auditing purposes
            Logger.error(`Route Protection Error: ${error.message}`, { route, path: req.path });

            // FedRAMP Compliance: Ensure detailed error messages are not exposed to the client
            res.status(500).json({ error: 'Internal server error.' });
        }
    };
};

// Note: Ensure that all logging and error handling mechanisms comply with SOC 2 requirements
// by maintaining audit trails and protecting sensitive information.