import { Request, Response, NextFunction } from 'express';

export function apiVersion(req: Request, res: Response, next: NextFunction) {
  const version = req.header('API-Version') || '1.0';
  req.apiVersion = version;
  res.setHeader('API-Version', version);
  next();
}

export function requireVersion(minVersion: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedVersion = parseFloat(req.apiVersion || '1.0');
    const required = parseFloat(minVersion);

    if (requestedVersion < required) {
      return res.status(400).json({
        success: false,
        error: `API version ${minVersion} or higher required`,
        currentVersion: req.apiVersion
      });
    }
    next();
  };
}
