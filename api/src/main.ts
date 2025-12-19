import express from 'express';

import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes';

const app = express();

// Register routes
app.use('/api', routes);

// Register the global error middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});