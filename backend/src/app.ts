import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/health.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { accountsRouter } from './modules/accounts/accounts.router.js';
import { photosRouter } from './modules/photos/photos.router.js';
import { albumsRouter } from './modules/albums/albums.router.js';
import { storageRouter } from './modules/storage/storage.router.js';
import { driveRouter } from './modules/drive/drive.router.js';
import { googlePhotosRouter } from './modules/google-photos/photos-picker.router.js';
import { rateLimiter } from './middleware/rateLimiter.js';

export function createApp(): express.Application {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Root health check
  app.use(healthRouter);

  // Mount API modules under /api/v1 with standard rate limiting
  const apiRouter = express.Router();
  apiRouter.use(
    rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 200,
      message: 'Too many requests. Please slow down and try again later.',
    })
  );

  apiRouter.use(authRouter);
  apiRouter.use(accountsRouter);
  apiRouter.use(photosRouter);
  apiRouter.use(albumsRouter);
  apiRouter.use(storageRouter);
  apiRouter.use(driveRouter);
  apiRouter.use('/google-photos', googlePhotosRouter);

  app.use(env.API_PREFIX, apiRouter);

  // Central error handling
  app.use(errorHandler);

  return app;
}
