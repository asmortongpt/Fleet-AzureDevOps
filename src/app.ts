import express from 'express';
import { configureSecurityHeaders } from './middlewares/securityHeaders';

const app = express();

// Configure security headers
configureSecurityHeaders(app);

// Other middleware and route configurations...

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});