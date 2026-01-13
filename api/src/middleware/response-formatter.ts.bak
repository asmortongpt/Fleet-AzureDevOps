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

  res.json = function(body: any) {
    if (body && typeof body === 'object' && !body.success && !body.error) {
      const formatted: ApiResponse<any> = {
        success: true,
        data: body,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id || '',
          version: req.apiVersion || '1.0'
        }
      };
      return originalJson(formatted);
    }
    return originalJson(body);
  };

  next();
}
