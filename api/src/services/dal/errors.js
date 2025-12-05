"use strict";
/**
 * Custom Error Classes for DAL
 * Provides standardized error handling across the data access layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionError = exports.TransactionError = exports.ConflictError = exports.ValidationError = exports.NotFoundError = exports.DatabaseError = void 0;
exports.handleDatabaseError = handleDatabaseError;
class DatabaseError extends Error {
    code;
    statusCode = 500;
    constructor(message, code) {
        super(message);
        this.name = 'DatabaseError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DatabaseError = DatabaseError;
class NotFoundError extends DatabaseError {
    statusCode = 404;
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends DatabaseError {
    statusCode = 400;
    constructor(message = 'Validation failed') {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ConflictError extends DatabaseError {
    statusCode = 409;
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class TransactionError extends DatabaseError {
    statusCode = 500;
    constructor(message = 'Transaction failed') {
        super(message);
        this.name = 'TransactionError';
    }
}
exports.TransactionError = TransactionError;
class ConnectionError extends DatabaseError {
    statusCode = 503;
    constructor(message = 'Database connection failed') {
        super(message);
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
/**
 * Error handler middleware for Express routes
 */
function handleDatabaseError(error) {
    if (error instanceof DatabaseError) {
        return {
            statusCode: error.statusCode,
            error: error.message,
            code: error.code
        };
    }
    // Unknown errors
    console.error('Unhandled database error:', error);
    return {
        statusCode: 500,
        error: 'Internal server error'
    };
}
//# sourceMappingURL=errors.js.map