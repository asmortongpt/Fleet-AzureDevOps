Here's a TypeScript code snippet that follows your requirements:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

interface UserPayload {
  id: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Token error' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Token malformatted' });
  }

  const publicKeyPath = path.join(__dirname, 'public.pem');
  const PUBLIC_KEY = fs.readFileSync(publicKeyPath, 'utf8');

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY) as UserPayload;
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default jwtMiddleware;
```

This middleware function checks for the presence of the Authorization header and verifies the JWT using the public key. If the token is valid, the payload is attached to the request object and the next middleware function is called. If the token is invalid, a 401 status code is returned. 

Please replace `'public.pem'` with the actual path to your public key file. 

Remember to install the required dependencies:

```bash
npm install jsonwebtoken @types/jsonwebtoken express @types/express fs @types/node
```

This middleware assumes you're using Express.js for your server. If you're using a different server framework, you'll need to adjust the code accordingly.