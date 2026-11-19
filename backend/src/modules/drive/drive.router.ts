import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authGuard } from '../../middleware/authGuard.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess, sendError } from '../../common/response.js';
import { DriveSyncService } from '../sync/drive-sync.service.js';
import { prisma } from '../../config/db.js';

export const driveRouter = Router();

const syncSchema = z.object({
  body: z.object({
    accountId: z.string().uuid('Valid accountId UUID required'),
  }),
});

/**
 * POST /drive/sync
 * Initiate metadata synchronization for a Google Drive account
 */
driveRouter.post(
  '/drive/sync',
  authGuard,
  validate(syncSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const { accountId } = req.body;
      const result = await DriveSyncService.syncAccount(req.user.id, accountId);
      sendSuccess(res, result, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Sync failed', customError.status);
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /drive/files
 * List synchronized Drive photos for authenticated user
 */
driveRouter.get('/drive/files', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
      return;
    }

    const accountId = req.query.accountId as string | undefined;

    const photos = await prisma.photo.findMany({
      where: {
        account: {
          userId: req.user.id,
          provider: 'GOOGLE_DRIVE',
          ...(accountId ? { id: accountId } : {}),
        },
      },
      include: {
        account: {
          select: {
            email: true,
            provider: true,
          },
        },
      },
      orderBy: { capturedAt: 'desc' },
      take: 100,
    });

    sendSuccess(
      res,
      {
        files: photos.map((p) => ({
          id: p.id,
          providerMediaId: p.providerMediaId,
          filename: p.filename,
          mimeType: p.mimeType,
          mediaType: p.mediaType,
          sizeBytes: p.sizeBytes.toString(),
          capturedAt: p.capturedAt,
          accountEmail: p.account.email,
          provider: p.account.provider,
          metadata: p.metadataJson,
        })),
      },
      200
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /drive/files/:fileId/access
 * Retrieve authorized access headers for viewing/streaming
 */
driveRouter.get(
  '/drive/files/:fileId/access',
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const fileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
      const file = await prisma.photo.findFirst({
        where: {
          id: fileId,
          account: { userId: req.user.id },
        },
        include: { account: true },
      });

      if (!file) {
        sendError(res, 'FILE_NOT_FOUND', 'File not found or access denied', 404);
        return;
      }

      sendSuccess(res, {
        fileId: file.id,
        downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.providerMediaId}?alt=media`,
        expiresAt: new Date(Date.now() + 3600000),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /sync/jobs
 * List sync jobs history
 */
driveRouter.get('/sync/jobs', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
      return;
    }

    const accountId = req.query.accountId as string | undefined;
    const jobs = await DriveSyncService.getSyncJobs(req.user.id, accountId);
    sendSuccess(res, { jobs }, 200);
  } catch (error) {
    next(error);
  }
});
