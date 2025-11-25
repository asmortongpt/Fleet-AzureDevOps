/**
 * API Versioning Middleware
 *
 * Implements comprehensive API versioning with deprecation support
 * Supports version detection via URL prefix, header, and query parameter
 *
 * @module middleware/api-version
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Express Request to include API version
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
      isDeprecatedVersion?: boolean;
      versionMetadata?: {
        version: string;
        deprecated: boolean;
        sunsetDate?: Date;
        migrationGuide?: string;
      };
    }
  }
}

/**
 * Supported API versions with their metadata
 */
export const API_VERSIONS = {
  v1: {
    version: 'v1',
    deprecated: false,
    releaseDate: new Date('2025-01-01'),
    description: 'Initial stable API version'
  },
  // Future versions can be added here
  // v2: {
  //   version: 'v2',
  //   deprecated: false,
  //   releaseDate: new Date('2026-01-01'),
  //   description: 'Enhanced API with improved performance'
  // }
} as const;

/**
 * Deprecated API versions with sunset information
 */
export const DEPRECATED_VERSIONS = {
  // Example of how to deprecate a version:
  // legacy: {
  //   version: 'legacy',
  //   deprecated: true,
  //   sunsetDate: new Date('2025-12-31'),
  //   migrationGuide: '/api/docs/migration/legacy-to-v1'
  // }
} as const;

export type ApiVersion = keyof typeof API_VERSIONS;
export type DeprecatedVersion = keyof typeof DEPRECATED_VERSIONS;

/**
 * Extract API version from request
 * Checks in order: URL path, Accept-Version header, query parameter
 */
export function extractApiVersion(req: Request): string | null {
  // 1. Check URL path: /api/v1/vehicles
  const urlMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (urlMatch) {
    return urlMatch[1];
  }

  // 2. Check Accept-Version header
  const headerVersion = req.get('Accept-Version');
  if (headerVersion) {
    return headerVersion.toLowerCase();
  }

  // 3. Check query parameter: ?version=v1
  const queryVersion = req.query.version as string;
  if (queryVersion) {
    return queryVersion.toLowerCase();
  }

  return null;
}

/**
 * Validate if version is supported
 */
export function isValidVersion(version: string): boolean {
  return version in API_VERSIONS || version in DEPRECATED_VERSIONS;
}

/**
 * Check if version is deprecated
 */
export function isDeprecated(version: string): boolean {
  return version in DEPRECATED_VERSIONS;
}

/**
 * Get version metadata
 */
export function getVersionMetadata(version: string) {
  if (version in API_VERSIONS) {
    return API_VERSIONS[version as ApiVersion];
  }
  if (version in DEPRECATED_VERSIONS) {
    return DEPRECATED_VERSIONS[version as DeprecatedVersion];
  }
  return null;
}

/**
 * API Versioning Middleware
 *
 * Extracts and validates API version, sets deprecation headers if needed
 *
 * @param defaultVersion - Default version to use if none specified (default: 'v1')
 */
export function apiVersioning(defaultVersion: string = 'v1') {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract version from request
    let version = extractApiVersion(req) || defaultVersion;

    // Validate version
    if (!isValidVersion(version)) {
      logger.warn(`Invalid API version requested: ${version}`, {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        error: 'Invalid API version',
        message: `Version '${version}' is not supported`,
        supportedVersions: Object.keys(API_VERSIONS),
        hint: 'Use /api/v1/... for current stable version'
      });
    }

    // Set version on request
    req.apiVersion = version;
    req.isDeprecatedVersion = isDeprecated(version);
    req.versionMetadata = getVersionMetadata(version) as any;

    // Set API version header in response
    res.setHeader('X-API-Version', version);

    // Handle deprecated versions
    if (req.isDeprecatedVersion && version in DEPRECATED_VERSIONS) {
      const deprecatedInfo = DEPRECATED_VERSIONS[version as DeprecatedVersion] as {
        version: string;
        deprecated: boolean;
        sunsetDate?: Date;
        migrationGuide?: string;
      };

      // Set deprecation headers
      res.setHeader('X-API-Deprecated', 'true');

      if (deprecatedInfo.sunsetDate) {
        res.setHeader('Sunset', deprecatedInfo.sunsetDate.toUTCString());
      }

      if (deprecatedInfo.migrationGuide) {
        res.setHeader('X-API-Migration-Guide', deprecatedInfo.migrationGuide);
      }

      // Log deprecation warning
      logger.warn(`Deprecated API version used: ${version}`, {
        path: req.path,
        sunsetDate: deprecatedInfo.sunsetDate,
        migrationGuide: deprecatedInfo.migrationGuide,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Add deprecation warning to response body (optional)
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        if (typeof body === 'object' && body !== null) {
          body._deprecation = {
            message: `API version ${version} is deprecated`,
            sunsetDate: deprecatedInfo.sunsetDate,
            migrationGuide: deprecatedInfo.migrationGuide
          };
        }
        return originalJson(body);
      };
    }

    next();
  };
}

/**
 * Version-specific route wrapper
 * Ensures a route only responds to specific API versions
 *
 * @example
 * router.get('/users', requireVersion('v1', 'v2'), getUsersHandler);
 */
export function requireVersion(...versions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentVersion = req.apiVersion || 'v1';

    if (!versions.includes(currentVersion)) {
      return res.status(404).json({
        error: 'Endpoint not available in this API version',
        message: `This endpoint is not available in version ${currentVersion}`,
        availableVersions: versions,
        currentVersion: currentVersion
      });
    }

    next();
  };
}

/**
 * Middleware to redirect legacy routes to versioned routes
 *
 * @example
 * app.use('/api/vehicles', redirectToVersioned('/api/v1/vehicles'));
 */
export function redirectToVersioned(targetPath: string, permanent: boolean = false) {
  return (req: Request, res: Response) => {
    const statusCode = permanent ? 301 : 307; // 301 = Permanent, 307 = Temporary
    const fullPath = `${targetPath}${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    res.setHeader('X-API-Deprecation-Notice', 'Please use versioned endpoints');
    res.redirect(statusCode, fullPath);
  };
}

/**
 * Generate API version info response
 * Useful for /api/version endpoint
 */
export function getApiVersionInfo() {
  return {
    currentVersion: 'v1',
    supportedVersions: Object.entries(API_VERSIONS).map(([key, value]) => ({
      version: value.version,
      deprecated: value.deprecated,
      releaseDate: value.releaseDate,
      description: value.description
    })),
    deprecatedVersions: Object.entries(DEPRECATED_VERSIONS).map(([key, value]) => {
      const deprecatedInfo = value as {
        version: string;
        deprecated: boolean;
        sunsetDate?: Date;
        migrationGuide?: string;
      };
      return {
        version: deprecatedInfo.version,
        deprecated: deprecatedInfo.deprecated,
        sunsetDate: deprecatedInfo.sunsetDate,
        migrationGuide: deprecatedInfo.migrationGuide
      };
    }),
    documentation: '/api/docs',
    changelog: '/api/docs/changelog'
  };
}

export default apiVersioning;
