"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
exports.getCsrfToken = getCsrfToken;
exports.csrfErrorHandler = csrfErrorHandler;
/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection for state-changing operations
 * Made optional for local development environments
 */
// Optional CSRF protection - gracefully handle missing dependency
let csrfMiddleware = null;
let csrfEnabled = false;
try {
    // Try to import csurf if available
    const csrf = require('csurf');
    // CSRF protection with cookie storage
    csrfMiddleware = csrf({
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        }
    });
    csrfEnabled = true;
    console.log('✅ CSRF protection enabled');
}
catch (error) {
    console.log('ℹ️  CSRF protection not available (csurf not installed) - continuing without CSRF');
    // Create a no-op middleware for compatibility
    csrfMiddleware = (req, res, next) => next();
}
// Export the middleware (either real or no-op)
exports.csrfProtection = csrfMiddleware;
// Route handler to provide CSRF token to clients
function getCsrfToken(req, res) {
    if (csrfEnabled && typeof req.csrfToken === 'function') {
        res.json({
            success: true,
            csrfToken: req.csrfToken()
        });
    }
    else {
        res.json({
            success: true,
            csrfToken: null,
            message: 'CSRF protection not enabled'
        });
    }
}
// Error handler specifically for CSRF validation failures
function csrfErrorHandler(err, req, res, next) {
    if (csrfEnabled && err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            error: 'Invalid CSRF token - request rejected',
            code: 'CSRF_VALIDATION_FAILED'
        });
    }
    next(err);
}
//# sourceMappingURL=csrf.js.map