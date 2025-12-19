import { Request, Response, NextFunction } from 'express';

import { logger } from '../services/logger';

// Supported API versions
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

// Version deprecation schedule (RFC 8594 Sunset header)
const DEPRECATION_SCHEDULE: Record<string, { sunset: Date; message: string }> = {
  v1: {
    sunset: new Date('2026-06-01T00:00:00Z'), // 6 months notice
    message: 'API v1 is deprecated and will be removed on 2026-06-01. Please migrate to v2. See: /docs/api/v2-migration-guide'
  }
};

// Extend Express Request to include API version
declare global {
  namespace Express {
    interface Request {
      apiVersion: ApiVersion;
    }
  }
}

/**
 * API Versioning Middleware
 *
 * Determines API version from:
 * 1. URL path (/api/v1/, /api/v2/)
 * 2. API-Version header
 * 3. Accept header (Accept: application/vnd.fleet.v2+json)
 * 4. Query parameter (?version=v2)
 *
 * Defaults to v1 for backward compatibility
 */
export function apiVersioning(req: Request, res: Response, next: NextFunction): void {
  // Extract version from URL path
  const urlVersionMatch = req.path.match(/^\/api\/(v\d+)\//);
  const urlVersion = urlVersionMatch ? urlVersionMatch[1] : null;

  // Extract version from API-Version header
  const headerVersion = req.headers['api-version'] as string;

  // Extract version from Accept header (e.g., Accept: application/vnd.fleet.v2+json)
  const acceptHeader = req.headers.accept || '';
  const acceptVersionMatch = acceptHeader.match(/vnd\.fleet\.(v\d+)\+json/);
  const acceptVersion = acceptVersionMatch ? acceptVersionMatch[1] : null;

  // Extract version from query parameter
  const queryVersion = req.query.version as string;

  // Determine requested version (priority: URL > Header > Accept > Query)
  const requestedVersion = (urlVersion || headerVersion || acceptVersion || queryVersion || 'v1') as string;

  // Validate version
  if (!SUPPORTED_VERSIONS.includes(requestedVersion as ApiVersion)) {
    logger.warn('Invalid API version requested', {
      requestedVersion,
      path: req.path,
      ip: req.ip
    });

    res.status(400).json({
      error: 'Invalid API version',
      message: `API version '${requestedVersion}' is not supported`,
      supportedVersions: SUPPORTED_VERSIONS,
      documentation: '/docs/api/versioning'
    });
    return;
  }

  const version = requestedVersion as ApiVersion;
  req.apiVersion = version;

  // Set API version response header
  res.setHeader('API-Version', version);

  // Check for deprecation
  const deprecation = DEPRECATION_SCHEDULE[version];
  if (deprecation) {
    const now = new Date();
    const daysUntilSunset = Math.ceil((deprecation.sunset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // RFC 8594 Sunset header
    res.setHeader('Sunset', deprecation.sunset.toUTCString());

    // RFC 7234 Warning header (299 = Miscellaneous persistent warning)
    res.setHeader('Warning', `299 - "${deprecation.message}"`);

    // Custom deprecation header
    res.setHeader('X-API-Deprecation-Info', JSON.stringify({
      version,
      sunset: deprecation.sunset.toISOString(),
      daysRemaining: daysUntilSunset,
      message: deprecation.message
    }));

    logger.info('Deprecated API version used', {
      version,
      daysUntilSunset,
      path: req.path,
      ip: req.ip
    });
  }

  // Log version usage for analytics
  logger.debug('API version determined', {
    version,
    path: req.path,
    method: req.method
  });

  next();
}

/**
 * Version-specific route handler wrapper
 *
 * Usage:
 * app.get('/api/vehicles',
 *   versionedHandler('v1', handleVehiclesV1),
 *   versionedHandler('v2', handleVehiclesV2)
 * )
 */
export function versionedHandler(
  version: ApiVersion,
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.apiVersion === version) {
      try {
        await handler(req, res, next);
      } catch (error) {
        next(error);
      }
    } else {
      next(); // Pass to next handler
    }
  };
}

/**
 * Require specific API version
 *
 * Usage:
 * app.get('/api/v2/new-feature', requireVersion('v2'), handleNewFeature)
 */
export function requireVersion(version: ApiVersion) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.apiVersion !== version) {
      res.status(400).json({
        error: 'Version mismatch',
        message: `This endpoint requires API version ${version}`,
        currentVersion: req.apiVersion,
        documentation: `/docs/api/${version}`
      });
      return;
    }
    next();
  };
}

/**
 * Get API version compatibility matrix
 */
export function getVersionCompatibility(): Record<string, any> {
  return {
    versions: SUPPORTED_VERSIONS,
    current: 'v2',
    deprecated: Object.entries(DEPRECATION_SCHEDULE).map(([version, info]) => ({
      version,
      sunset: info.sunset.toISOString(),
      message: info.message
    })),
    endpoints: {
      v1: {
        breaking_changes: [],
        deprecated_features: [
          'Legacy authentication flow',
          'Synchronous report generation'
        ]
      },
      v2: {
        new_features: [
          'Async report generation with webhooks',
          'Enhanced telemetry streaming',
          'GraphQL support',
          'Batch operations'
        ],
        breaking_changes: [
          'Authentication now requires JWT in Authorization header',
          'Date formats standardized to ISO 8601',
          'Error responses follow RFC 7807 Problem Details'
        ]
      }
    }
  };
}

/**
 * Middleware to provide version info endpoint
 */
export function versionInfoEndpoint(req: Request, res: Response): void {
  res.json({
    success: true,
    data: getVersionCompatibility(),
    documentation: {
      v1: '/docs/api/v1',
      v2: '/docs/api/v2',
      migration: '/docs/api/v2-migration-guide'
    }
  });
}
