/**
 * Custom Error Classes for DAL
 * Provides standardized error handling across the data access layer
 */

export class DatabaseError extends Error {
  public readonly code?: string
  public readonly statusCode: number = 500

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends DatabaseError {
  public readonly statusCode: number = 404

  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends DatabaseError {
  public readonly statusCode: number = 400

  constructor(message: string = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends DatabaseError {
  public readonly statusCode: number = 409

  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class TransactionError extends DatabaseError {
  public readonly statusCode: number = 500

  constructor(message: string = 'Transaction failed') {
    super(message)
    this.name = 'TransactionError'
  }
}

export class ConnectionError extends DatabaseError {
  public readonly statusCode: number = 503

  constructor(message: string = 'Database connection failed') {
    super(message)
    this.name = 'ConnectionError'
  }
}

/**
 * Error handler middleware for Express routes
 */
export function handleDatabaseError(error: unknown): { statusCode: number; error: string; code?: string } {
  if (error instanceof DatabaseError) {
    return {
      statusCode: error.statusCode,
      error: error.message,
      code: error.code
    }
  }

  // Unknown errors
  console.error('Unhandled database error:', error)
  return {
    statusCode: 500,
    error: 'Internal server error'
  }
}
