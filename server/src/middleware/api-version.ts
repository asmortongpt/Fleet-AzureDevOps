import { Request, Response, NextFunction } from 'express';

const SUPPORTED_VERSIONS = [1, 2];
const DEPRECATION_WARNING = 'This API version is deprecated and will be removed in future releases. Please upgrade to the latest version.';

export function apiVersioning(req: Request, res: Response, next: NextFunction): void {
  const urlVersion = parseInt(req.params.version, 10);
  const headerVersion = parseInt(req.headers['api-version'] as string, 10);
  const acceptHeaderVersion = parseInt(req.headers.accept?.match(/version=(\d+)/)?.[1] || '1', 10);

  const requestedVersion = urlVersion || headerVersion || acceptHeaderVersion || 1;

  if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
    res.status(400).json({
      error: 'API version mismatch',
      requested: requestedVersion,
      supported: SUPPORTED_VERSIONS
    });
    return;
  }

  if (requestedVersion < Math.max(...SUPPORTED_VERSIONS)) {
    res.setHeader('Warning', DEPRECATION_WARNING);
  }

  req.version = requestedVersion;
  next();
}

export function versionedRoute(version: number, handler: (req: Request, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.version === version) {
      handler(req, res, next);
    } else {
      next();
    }
  };
}