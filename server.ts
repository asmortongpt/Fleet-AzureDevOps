// Import necessary modules
import express, { Express } from 'express';
import helmet from 'helmet';
// Other imports...

// Initialize Express app
const app: Express = express();

// Security middleware - Helmet should be added before other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  }
}));

// Other middleware configurations...
// app.use(cors());
// app.use(express.json());
// etc.