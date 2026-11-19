import { Router } from 'express';
import { z } from 'zod';
import { GooglePhotosController } from './photos-picker.controller.js';
import { authGuard } from '../../middleware/authGuard.js';
import { validate } from '../../middleware/validate.js';

export const googlePhotosRouter = Router();

const createSessionSchema = z.object({
  body: z.object({
    accountId: z.string().uuid('Invalid account ID format'),
  }),
});

const importMediaSchema = z.object({
  body: z.object({
    accountId: z.string().uuid('Invalid account ID format'),
  }),
});

googlePhotosRouter.post(
  '/picker-sessions',
  authGuard,
  validate(createSessionSchema),
  GooglePhotosController.createSession
);

googlePhotosRouter.get(
  '/picker-sessions/:sessionId',
  authGuard,
  GooglePhotosController.getSessionStatus
);

googlePhotosRouter.post(
  '/picker-sessions/:sessionId/import',
  authGuard,
  validate(importMediaSchema),
  GooglePhotosController.importMedia
);

googlePhotosRouter.get(
  '/media/:id/access',
  authGuard,
  GooglePhotosController.getMediaAccess
);
