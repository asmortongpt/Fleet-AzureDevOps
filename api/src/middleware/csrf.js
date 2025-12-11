"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
exports.getCsrfToken = getCsrfToken;
exports.csrfErrorHandler = csrfErrorHandler;
const csurf_1 = __importDefault(require("csurf"));
/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection for state-changing operations
 */
// CSRF protection with cookie storage
exports.csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
    }
});
// Route handler to provide CSRF token to clients
function getCsrfToken(req, res) {
    res.json({
        success: true,
        csrfToken: req.csrfToken()
    });
}
// Error handler specifically for CSRF validation failures
function csrfErrorHandler(err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            error: 'Invalid CSRF token - request rejected',
            code: 'CSRF_VALIDATION_FAILED'
        });
    }
    next(err);
}
//# sourceMappingURL=csrf.js.map