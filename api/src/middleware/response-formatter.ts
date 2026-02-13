import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export function formatResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function(body: Record<string, unknown>) {
    if (body && typeof body === 'object' && !body.success && !body.error) {
      const requestId = req.requestId || req.headers['x-request-id'] || '';
      const formatted: ApiResponse<unknown> = {
        success: true,
        data: body,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: requestId as string,
          version: req.apiVersion || '1.0'
        }
      };
      return originalJson(formatted);
    }
    return originalJson(body);
  };

  next();
}
