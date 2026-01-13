/**
 * Custom Error Classes for DAL
 * Provides standardized error handling across the data access layer
 */
export declare class DatabaseError extends Error {
    readonly code?: string;
    readonly statusCode: number;
    constructor(message: string, code?: string);
}
export declare class NotFoundError extends DatabaseError {
    readonly statusCode: number;
    constructor(message?: string);
}
export declare class ValidationError extends DatabaseError {
    readonly statusCode: number;
    constructor(message?: string);
}
export declare class ConflictError extends DatabaseError {
    readonly statusCode: number;
    constructor(message?: string);
}
export declare class TransactionError extends DatabaseError {
    readonly statusCode: number;
    constructor(message?: string);
}
export declare class ConnectionError extends DatabaseError {
    readonly statusCode: number;
    constructor(message?: string);
}
/**
 * Error handler middleware for Express routes
 */
export declare function handleDatabaseError(error: unknown): {
    statusCode: number;
    error: string;
    code?: string;
};
//# sourceMappingURL=errors.d.ts.map