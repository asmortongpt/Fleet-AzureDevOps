import { Request, Response, NextFunction } from 'express';
/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection for state-changing operations
 */
export declare const csrfProtection: any;
export declare function getCsrfToken(req: Request, res: Response): void;
export declare function csrfErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=csrf.d.ts.map