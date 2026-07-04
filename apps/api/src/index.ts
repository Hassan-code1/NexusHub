import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { env } from './config/env';
import { logger } from './config/logger';

import { errorHandler } from './middlewares/errorHandler';

import { verifyDatabaseConnection } from './utils/db'; // Import the new DB utility

import healthRouter from './routes/health';
import authRouter from './routes/auth';
// Import oauth controller to register the Passport strategy on startup
import './controllers/oauth.controller';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize()); // Required for Passport OAuth to function

app.use(
  morgan('dev', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

app.use('/api/health', healthRouter);
app.use('/api/auth/', authRouter);

app.use(errorHandler);

// Verify DB connection before starting the server
verifyDatabaseConnection().then(() => {
  app.listen(env.PORT, () => {
    logger.info(`API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
});