import { Request, Response, NextFunction } from 'express';
import { AlbumsService } from './albums.service.js';
import { sendSuccess, sendError } from '../../common/response.js';

export class AlbumsController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const albums = await AlbumsService.listAlbums(req.user.id);
      sendSuccess(res, { albums }, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const album = await AlbumsService.createAlbum(req.user.id, req.body);
      sendSuccess(res, { album }, 201);
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
      const albumId = Array.isArray(req.params.albumId) ? req.params.albumId[0] : req.params.albumId;
      const album = await AlbumsService.getAlbumById(req.user.id, albumId);
      sendSuccess(res, { album }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Album fetch failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const albumId = Array.isArray(req.params.albumId) ? req.params.albumId[0] : req.params.albumId;
      const album = await AlbumsService.updateAlbum(req.user.id, albumId, req.body);
      sendSuccess(res, { album }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Album update failed', customError.status);
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
      const albumId = Array.isArray(req.params.albumId) ? req.params.albumId[0] : req.params.albumId;
      await AlbumsService.deleteAlbum(req.user.id, albumId);
      sendSuccess(res, { message: 'Album deleted successfully' }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Album deletion failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async addPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const albumId = Array.isArray(req.params.albumId) ? req.params.albumId[0] : req.params.albumId;
      const { photoId } = req.body;
      if (!photoId) {
        sendError(res, 'MISSING_PHOTO_ID', 'photoId is required', 400);
        return;
      }
      const result = await AlbumsService.addPhotoToAlbum(req.user.id, albumId, photoId);
      sendSuccess(res, result, 201);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Failed to add photo', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async removePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const albumId = Array.isArray(req.params.albumId) ? req.params.albumId[0] : req.params.albumId;
      const photoId = Array.isArray(req.params.photoId) ? req.params.photoId[0] : req.params.photoId;
      const result = await AlbumsService.removePhotoFromAlbum(req.user.id, albumId, photoId);
      sendSuccess(res, result, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Failed to remove photo', customError.status);
        return;
      }
      next(error);
    }
  }
}
