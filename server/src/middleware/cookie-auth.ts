server/src/middleware/cookie-auth.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';

// Middleware to set httpOnly cookies on login
export const setAuthCookies = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, csrfToken } = req.body;
    if (!token || !csrfToken) {
      Logger.error('Missing token or CSRF token');
      return res.status(400).send('Bad Request');
    }

    // Set secure, httpOnly cookies
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    Logger.info('Auth cookies set successfully');
    next();
  } catch (error) {
    Logger.error('Error setting auth cookies', error);
    res.status(500).send('Internal Server Error');
  }
};

// Middleware for automatic CSRF token injection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = req.cookies['csrf_token'];
  if (!csrfToken || req.headers['x-csrf-token'] !== csrfToken) {
    Logger.warn('CSRF token mismatch');
    return res.status(403).send('Forbidden');
  }
  next();
};

// Middleware to refresh cookies on activity
export const refreshAuthCookies = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies['auth_token'];
    if (!token) {
      Logger.warn('No auth token found');
      return res.status(401).send('Unauthorized');
    }

    // Verify and refresh token logic here
    const newToken = jwt.sign({ data: 'newData' }, 'secret', { expiresIn: '1h' });
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    Logger.info('Auth cookies refreshed');
    next();
  } catch (error) {
    Logger.error('Error refreshing auth cookies', error);
    res.status(500).send('Internal Server Error');
  }
};

// Middleware to clear cookies on logout
export const clearAuthCookies = (req: Request, res: Response) => {
  try {
    res.clearCookie('auth_token');
    res.clearCookie('csrf_token');
    Logger.info('Auth cookies cleared');
    res.status(200).send('Logged out');
  } catch (error) {
    Logger.error('Error clearing auth cookies', error);
    res.status(500).send('Internal Server Error');
  }
};
```

src/hooks/use-auth.ts
```typescript
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Logger } from '../utils/logger';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const history = useHistory();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.status === 200) {
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          setIsAuthenticated(false);
          history.push('/login');
        }
      } catch (error) {
        Logger.error('Error checking authentication', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [history]);

  return { isAuthenticated };
};
```

src/lib/api-client.ts
```typescript
export const apiClient = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
};
```