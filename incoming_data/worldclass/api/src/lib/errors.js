"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
// Custom Error Classes
class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, 'VALIDATION_ERROR', message);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(404, 'NOT_FOUND', `${resource} not found`);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(409, 'CONFLICT', message);
    }
}
exports.ConflictError = ConflictError;
class InternalError extends AppError {
    constructor(message = 'Internal Server Error') {
        super(500, 'INTERNAL_ERROR', message);
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=errors.js.map