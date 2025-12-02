import { Request, Response, NextFunction } from 'express';
import { AppInsightsClient } from '../services/AppInsightsClient';
import { Logger } from '../services/Logger';

interface ErrorContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
}

abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly context?: ErrorContext;

  constructor(message: string, statusCode: number, errorCode: string, context?: ErrorContext) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  serializeErrors() {
    return {
      message: this.message,
      errorCode: this.errorCode,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string>, context?: ErrorContext) {
    super(message, 400, 'VALIDATION_ERROR', context);
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 401, 'AUTH_ERROR', context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 404, 'NOT_FOUND_ERROR', context);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const context: ErrorContext = {
    userId: req.user?.id,
    tenantId: req.tenant?.id,
    requestId: req.headers['x-request-id'] as string,
  };

  if (err instanceof AppError) {
    logError(err, context);
    res.status(err.statusCode).json(err.serializeErrors());
  } else {
    const genericError = new AppError('Internal Server Error', 500, 'INTERNAL_SERVER_ERROR', context);
    logError(genericError, context);
    res.status(500).json(genericError.serializeErrors());
  }
};

function logError(error: AppError, context: ErrorContext): void {
  const logData = {
    message: error.message,
    errorCode: error.errorCode,
    context,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };

  Logger.error(JSON.stringify(logData));

  if (process.env.NODE_ENV === 'production') {
    AppInsightsClient.trackException({ exception: error, properties: logData });
  }
}