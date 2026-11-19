import { Request, Response, NextFunction } from 'express';
import { PhotosService } from './photos.service.js';
import { sendSuccess, sendError } from '../../common/response.js';

export class PhotosController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const query = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        cursor: req.query.cursor as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        accountId: req.query.accountId as string | undefined,
        provider: req.query.provider as string | undefined,
        mediaType: req.query.mediaType as string | undefined,
        search: req.query.search as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
      };

      const result = await PhotosService.getUnifiedPhotos(req.user.id, query);

      sendSuccess(res, { photos: result.photos }, 200, {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const photoId = Array.isArray(req.params.photoId) ? req.params.photoId[0] : req.params.photoId;
      const photo = await PhotosService.getPhotoById(req.user.id, photoId);
      sendSuccess(res, { photo }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Photo fetch failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const photoId = Array.isArray(req.params.photoId) ? req.params.photoId[0] : req.params.photoId;
      await PhotosService.deletePhoto(req.user.id, photoId);
      sendSuccess(res, { message: 'Photo deleted successfully from CloudVault' }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Photo deletion failed', customError.status);
        return;
      }
      next(error);
    }
  }
}
