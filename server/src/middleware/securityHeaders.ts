import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Configures security headers for the application.
 * @param app - The Express application instance.
 */
export function configureSecurityHeaders(app: Express.Application): void {
  // Use Helmet to set various security headers
  app.use(helmet());

  // Custom Content Security Policy
  app.use(helmet.contentSecurityPolicy({
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", 'data:', 'https:'],
      "object-src": ["'none'"],
      "font-src": ["'self'"],
      "connect-src": ["'self'"],
      "media-src": ["'self'"],
      "frame-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'self'"],
      "script-src-attr": ["'none'"],
      "upgrade-insecure-requests": []
    }
  }));

  // Set additional security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Referrer-Policy', process.env.REFERRER_POLICY || 'no-referrer');
    res.setHeader('X-XSS-Protection', "1; mode=block");
    next();
  });
}