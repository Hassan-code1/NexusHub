import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import healthRouter from './routes/health';
import { verifyDatabaseConnection } from './utils/db'; // Import the new DB utility

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(
  morgan('dev', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

app.use('/api/health', healthRouter);

app.use(errorHandler);

// Verify DB connection before starting the server
verifyDatabaseConnection().then(() => {
  app.listen(env.PORT, () => {
    logger.info(`API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
});